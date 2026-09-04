import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
  customType,

} from "drizzle-orm/pg-core";


// pgvector column. Dimension is fixed at 1536 (OpenAI/Voyage-compatible); adapt in migration if needed.
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => Number(v));
  },
});

export const roleEnum = pgEnum("workspace_role", ["admin", "author", "reviewer"]);
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "ready_for_review",
  "in_review",
  "changes_requested",
  "approved_for_export",
  "exported",
]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "succeeded", "failed"]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "open",
  "accepted",
  "rejected",
  "ignored",
]);
export const severityEnum = pgEnum("severity", ["blocker", "error", "warning", "info"]);

const ts = (name: string) => timestamp(name, { withTimezone: true }).defaultNow().notNull();

// ---------------------------------------------------------------------------
// Identity and access
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // random 32-byte token id (hashed in cookie signature)
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    // Hosted-preview fallback only (AUTH_VISITOR_HEADER=true): proxy-injected browser id bound to this session.
    visitorId: text("visitor_id"),
    createdAt: ts("created_at"),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_visitor_idx").on(t.visitorId)],
);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  seedCommit: text("seed_commit"),
  seededAt: timestamp("seeded_at", { withTimezone: true }),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("author"),
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("workspace_members_unique").on(t.workspaceId, t.userId)],
);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("author"),
  tokenHash: text("token_hash").notNull().unique(),
  invitedBy: uuid("invited_by").references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: ts("created_at"),
});

// ---------------------------------------------------------------------------
// Projects, versions, artifacts, assets, exports
// ---------------------------------------------------------------------------
export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // original_html | export_html | export_zip | asset | report
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    storageKey: text("storage_key").notNull(),
    immutable: boolean("immutable").notNull().default(true),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: ts("created_at"),
  },
  (t) => [index("artifacts_ws_sha_idx").on(t.workspaceId, t.sha256)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    origin: text("origin").notNull(), // import | new
    status: projectStatusEnum("status").notNull().default("draft"),
    originalArtifactId: uuid("original_artifact_id").references(() => artifacts.id),
    // Canonical editable document (working copy). Versions snapshot this.
    workingDocument: jsonb("working_document").$type<unknown>(),
    workingRevision: integer("working_revision").notNull().default(0),
    importReport: jsonb("import_report").$type<unknown>(),
    sourceMap: jsonb("source_map").$type<unknown>(),
    assetManifest: jsonb("asset_manifest").$type<unknown>(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("projects_ws_slug").on(t.workspaceId, t.slug)],
);

export const projectVersions = pgTable(
  "project_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    name: text("name").notNull(),
    note: text("note"),
    document: jsonb("document").$type<unknown>().notNull(),
    contentHash: text("content_hash").notNull(), // sha256 of canonical JSON
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("project_versions_unique").on(t.projectId, t.number)],
);

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  artifactId: uuid("artifact_id").references(() => artifacts.id),
  path: text("path").notNull(), // path as referenced by the lesson
  kind: text("kind").notNull(), // image | audio | video | script | style | font | other
  status: text("status").notNull(), // present | missing | external | inline
  url: text("url"),
  createdAt: ts("created_at"),
});

export const exports = pgTable("exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionId: uuid("version_id").references(() => projectVersions.id),
  format: text("format").notNull(), // standalone_html | web_zip | scorm12
  artifactId: uuid("artifact_id").references(() => artifacts.id),
  status: text("status").notNull().default("queued"), // queued | building | validating | passed | failed
  options: jsonb("options").$type<unknown>(),
  validationReport: jsonb("validation_report").$type<unknown>(),
  jobId: uuid("job_id"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
});

// ---------------------------------------------------------------------------
// Knowledge Library (seeded from the kit, editable, versioned)
// ---------------------------------------------------------------------------
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(), // pedagogy | voice | chassis | identity | objectives | assessment | quality | shipping | process | gold
    roles: jsonb("roles").$type<string[]>().notNull().default([]), // Copilot retrieval roles: design | phrasing | alignment | checks | audit | export | process
    seedPath: text("seed_path"),
    seedCommit: text("seed_commit"),
    baselineSha256: text("baseline_sha256"),
    currentVersion: integer("current_version").notNull().default(1),
    content: text("content").notNull(),
    contentSha256: text("content_sha256").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("knowledge_documents_ws_slug").on(t.workspaceId, t.slug)],
);

export const knowledgeDocumentVersions = pgTable(
  "knowledge_document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    content: text("content").notNull(),
    contentSha256: text("content_sha256").notNull(),
    isBaseline: boolean("is_baseline").notNull().default(false),
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("knowledge_versions_unique").on(t.documentId, t.number)],
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    roles: jsonb("roles").$type<string[]>().notNull().default([]),
    ordinal: integer("ordinal").notNull(),
    heading: text("heading"),
    content: text("content").notNull(),
    embedding: vector("embedding"),
    createdAt: ts("created_at"),
  },
  (t) => [index("knowledge_chunks_doc_idx").on(t.documentId)],
);

// Structured workspace data derived from the kit (editable)
export const objectives = pgTable(
  "objectives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    code: text("code").notNull(), // e.g. 2.4
    category: text("category").notNull(), // e.g. Electrical Theory
    wording: text("wording").notNull(), // verbatim
    studyGuide: text("study_guide"),
    bankItems: integer("bank_items"),
    sourceDocumentId: uuid("source_document_id").references(() => knowledgeDocuments.id),
    active: boolean("active").notNull().default(true),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("objectives_ws_code").on(t.workspaceId, t.code)],
);

export const beatTypes = pgTable(
  "beat_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // orientation | case | definition | ...
    name: text("name").notNull(),
    phase: text("phase").notNull(), // FRAME | DELIVER | APPLY | VERIFY | CLOSE
    ordinal: integer("ordinal").notNull(),
    gateKind: text("gate_kind").notNull(), // read | lab | check | completion
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    definition: text("definition").notNull(),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    recipes: jsonb("recipes").$type<string[]>().notNull().default([]),
    mandatory: boolean("mandatory").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sourceDocumentId: uuid("source_document_id").references(() => knowledgeDocuments.id),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("beat_types_ws_key").on(t.workspaceId, t.key)],
);

export const qualityRules = pgTable(
  "quality_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(), // writing | richness | chassis | assessment | style | assets | accessibility | structure | export
    severity: severityEnum("severity").notNull(),
    description: text("description").notNull(),
    params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    sourceRef: text("source_ref"), // e.g. QUALITY-BAR.md#axes / quality-gate.py CONFIG.teach.words_fail
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("quality_rules_ws_key").on(t.workspaceId, t.key)],
);

export const themeTokens = pgTable(
  "theme_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    family: text("family").notNull(), // shell | electric-ink-dc | electric-ink-systems | field-manual
    name: text("name").notNull(),
    tokens: jsonb("tokens").$type<Record<string, string>>().notNull(),
    meaning: jsonb("meaning").$type<Record<string, string>>().notNull().default({}),
    sourceRef: text("source_ref"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("theme_tokens_ws_family").on(t.workspaceId, t.family)],
);

// ---------------------------------------------------------------------------
// Jobs, audit findings, proposals, Copilot runs, activity log
// ---------------------------------------------------------------------------
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // import | audit | export | validate_export | copilot | seed
    status: jobStatusEnum("status").notNull().default("queued"),
    payload: jsonb("payload").$type<unknown>().notNull(),
    result: jsonb("result").$type<unknown>(),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    runAfter: timestamp("run_after", { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: ts("created_at"),
  },
  (t) => [index("jobs_status_idx").on(t.status, t.runAfter)],
);

export const auditRuns = pgTable("audit_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  workingRevision: integer("working_revision").notNull(),
  kind: text("kind").notNull(), // import_audit | quality_audit | writing_check | export_preflight
  summary: jsonb("summary").$type<unknown>().notNull(),
  createdAt: ts("created_at"),
});

export const auditFindings = pgTable(
  "audit_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => auditRuns.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ruleKey: text("rule_key").notNull(),
    ruleVersion: integer("rule_version").notNull(),
    severity: severityEnum("severity").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    evidence: jsonb("evidence").$type<unknown>().notNull(),
    beatId: text("beat_id"),
    blockId: text("block_id"),
    createdAt: ts("created_at"),
  },
  (t) => [index("audit_findings_project_idx").on(t.projectId)],
);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    findingId: uuid("finding_id").references(() => auditFindings.id, { onDelete: "set null" }),
    copilotRunId: uuid("copilot_run_id"),
    kind: text("kind").notNull(), // repair | rewrite | draft | structure | style | accessibility | code
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    severity: severityEnum("severity").notNull(),
    ruleKey: text("rule_key"),
    ruleVersion: integer("rule_version"),
    evidence: jsonb("evidence").$type<unknown>().notNull(),
    patch: jsonb("patch").$type<unknown>().notNull(), // RFC 6902 operations
    diff: text("diff").notNull(), // unified diff of affected compiled HTML
    baseRevision: integer("base_revision").notNull(),
    status: proposalStatusEnum("status").notNull().default("open"),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: ts("created_at"),
  },
  (t) => [index("proposals_project_idx").on(t.projectId, t.status)],
);

export const copilotRuns = pgTable("copilot_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  task: text("task").notNull(), // chat | plan_lesson | draft_beat | audit | ...
  promptVersion: text("prompt_version").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
  sourceChunkIds: jsonb("source_chunk_ids").$type<string[]>().notNull(),
  input: jsonb("input").$type<unknown>().notNull(),
  output: jsonb("output").$type<unknown>(),
  assumptions: jsonb("assumptions").$type<string[]>().notNull().default([]),
  latencyMs: integer("latency_ms"),
  createdAt: ts("created_at"),
});

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(), // dotted, e.g. project.create, version.create, proposal.accept
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: jsonb("details").$type<unknown>(),
    ip: text("ip"),
    createdAt: ts("created_at"),
  },
  (t) => [index("activity_ws_idx").on(t.workspaceId, t.createdAt)],
);

