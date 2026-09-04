export type ParsedRule = {
  key: string;
  name: string;
  category: string;
  severity: "info" | "warning" | "error";
  description: string;
  params: Record<string, unknown>;
  version: number;
  sourceRef: string;
};

function pyList(src: string, name: string): string[] {
  const m = src.match(new RegExp(`^${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "m")) ?? src.match(new RegExp(`^${name}\\s*=\\s*\\(([\\s\\S]*?)\\)`, "m"));
  if (!m) return [];
  return [...m[1]!.matchAll(/"([^"]+)"/g)].map((x) => x[1]!);
}

function pyConfigNumber(src: string, profile: string, key: string, fallback: number): number {
  const block = src.match(new RegExp(`"${profile}"\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
  const m = block?.[1]?.match(new RegExp(`"${key}"\\s*:\\s*([0-9.]+)`));
  return m ? Number(m[1]) : fallback;
}

/**
 * Derive the workspace's initial quality rule set from tools/quality-gate.py (thresholds, banned
 * phrases, allowed hosts) plus the structural/accessibility rules the Studio audit implements.
 * Every rule is versioned and editable in the workspace after seeding.
 */
export function parseQualityGate(py: string): ParsedRule[] {
  const t = (k: string, fb: number) => pyConfigNumber(py, "teach", k, fb);
  const banned = pyList(py, "BANNED");
  const watch = pyList(py, "WATCH");
  const allowedHosts = pyList(py, "ALLOWED_HOSTS");
  const gate = "tools/quality-gate.py";
  const rules: ParsedRule[] = [
    { key: "writing.words-min", name: "Visible word count", category: "writing", severity: "error", description: "Visible prose below the floor means a thin lesson (NEETS manual density).", params: { fail: t("words_fail", 1800), warn: t("words_warn", 2400) }, version: 1, sourceRef: `${gate} CONFIG.teach.words_fail` },
    { key: "writing.fragment-rate", name: "Sentence fragment rate", category: "writing", severity: "warning", description: "Share of prose sentences with three words or fewer.", params: { warn: t("frag_rate_warn", 0.22), fail: t("frag_rate_fail", 0.3) }, version: 1, sourceRef: `${gate} CONFIG.teach.frag_rate_fail` },
    { key: "writing.banned-phrases", name: "Banned phrases", category: "writing", severity: "error", description: "Phrases that fail a lesson outright (voice lock and house rules).", params: { phrases: banned.length ? banned : ["delve", "tapestry", "it's important to note"] }, version: 1, sourceRef: `${gate} BANNED` },
    { key: "writing.watch-phrases", name: "Watch-list phrases", category: "writing", severity: "warning", description: "Magazine-AI phrasing that reads wrong in a training manual.", params: { phrases: watch }, version: 1, sourceRef: `${gate} WATCH` },
    { key: "writing.em-dash", name: "No em or en dashes", category: "style", severity: "error", description: "The voice lock forbids em and en dashes in lesson prose.", params: {}, version: 1, sourceRef: `${gate} EMDASH check; voice/NICK-VOICE-STYLE-GUIDE.md` },
    { key: "style.viewport-height", name: "No height:100vh containers", category: "style", severity: "error", description: "Use min-height; height:100vh clips content inside the player.", params: {}, version: 1, sourceRef: `${gate} line 438` },
    { key: "richness.svg-per-minute", name: "SVG figures per minute", category: "richness", severity: "warning", description: "Bespoke figures per estimated minute of lesson time.", params: { fail: t("svg_per_min_fail", 0.35), warn: t("svg_per_min_warn", 0.5), wordsPerMinute: 130 }, version: 1, sourceRef: `${gate} CONFIG.teach.svg_per_min_fail` },
    { key: "richness.images-min", name: "Photograph count", category: "richness", severity: "error", description: "Physical-parts lessons need real photographs.", params: { failAtOrBelow: t("img_fail", 0), warnBelow: t("img_warn", 2) }, version: 1, sourceRef: `${gate} CONFIG.teach.img_fail` },
    { key: "gate.ready-sites", name: "__inkGate.ready call sites", category: "chassis", severity: "error", description: "Distinct gate-release sites in the lesson script.", params: { fail: t("ready_fail", 3), warn: t("ready_warn", 4) }, version: 1, sourceRef: `${gate} CONFIG.teach.ready_fail` },
    { key: "gate.gated-beats-min", name: "Interaction-gated beats", category: "chassis", severity: "error", description: "Beats whose Continue button requires an interaction (data-need).", params: { fail: t("gated_fail", 4) }, version: 1, sourceRef: `${gate} CONFIG.teach.gated_fail` },
    { key: "gate.reachability", name: "Gate reachability", category: "chassis", severity: "error", description: "Every data-clear target must be a beat id; every beat except the last needs a release path; the sequence must end in completion.", params: {}, version: 1, sourceRef: "chassis/chassis.md" },
    { key: "assess.items-min", name: "Checkpoint item count", category: "assessment", severity: "error", description: "Checkpoint must carry enough items to score objectives.", params: { fail: t("items_fail", 5), feedbackChars: t("feedback_chars", 50) }, version: 1, sourceRef: `${gate} CONFIG.teach.items_fail` },
    { key: "assess.objective-alignment", name: "Objective alignment", category: "assessment", severity: "warning", description: "Objectives referenced by the lesson must exist verbatim in the workspace registry and be scored by the checkpoint.", params: {}, version: 1, sourceRef: "content/caet-lo-registry.md; assessment/ASSESSMENT.md" },
    { key: "assess.score-validity", name: "Score validity", category: "assessment", severity: "warning", description: "AeroLesson.score posts must carry an objectiveId and correct <= total.", params: {}, version: 1, sourceRef: "assessment/ASSESSMENT.md" },
    { key: "struct.duplicate-ids", name: "Duplicate element ids", category: "structure", severity: "error", description: "Duplicate ids break gate wiring and ARIA references.", params: {}, version: 1, sourceRef: "Studio importer" },
    { key: "struct.beat-types", name: "Mandatory beat types", category: "structure", severity: "warning", description: "A lesson has an orientation, a check, and a consolidation beat.", params: { required: ["orientation", "check", "consolidation"] }, version: 1, sourceRef: "chassis/BEAT-TYPES.md §2" },
    { key: "struct.beat-sequence", name: "Beat phase order", category: "structure", severity: "warning", description: "FRAME beats precede DELIVER, which precede APPLY, VERIFY, CLOSE.", params: { order: ["FRAME", "DELIVER", "APPLY", "VERIFY", "CLOSE"] }, version: 1, sourceRef: "chassis/BEAT-TYPES.md §2" },
    { key: "struct.beat-metadata", name: "Beat instructional metadata", category: "structure", severity: "info", description: "Each beat should declare a purpose, an objective link, and a learner action.", params: {}, version: 1, sourceRef: "Studio principle 4" },
    { key: "assets.missing-local", name: "Unbundled local assets", category: "assets", severity: "warning", description: "Relative asset paths that were not uploaded with the lesson will 404 on export.", params: {}, version: 1, sourceRef: "ship/SHIP.md" },
    { key: "assets.external-host", name: "External hosts", category: "assets", severity: "error", description: "Only allow-listed hosts may be referenced.", params: { allowedHosts: allowedHosts.length ? allowedHosts : ["fonts.googleapis.com", "fonts.gstatic.com"] }, version: 1, sourceRef: `${gate} ALLOWED_HOSTS` },
    { key: "assets.runtime-guard", name: "Runtime calls guarded", category: "assets", severity: "error", description: "Calls into an unbundled runtime (AeroLesson, THREE) must be guarded so the standalone export runs.", params: { globals: ["AeroLesson", "THREE"] }, version: 1, sourceRef: "ship/SHIP.md; chassis/player-face-snippets.md" },
    { key: "a11y.lang", name: "Document language", category: "accessibility", severity: "error", description: "<html> needs a lang attribute.", params: {}, version: 1, sourceRef: "WCAG 3.1.1" },
    { key: "a11y.img-alt", name: "Image alt text", category: "accessibility", severity: "error", description: "Every <img> needs alt text (empty alt only for decorative images).", params: {}, version: 1, sourceRef: "WCAG 1.1.1" },
    { key: "a11y.heading-order", name: "Heading order", category: "accessibility", severity: "warning", description: "One h1; heading levels do not skip.", params: {}, version: 1, sourceRef: "WCAG 1.3.1" },
    { key: "a11y.control-name", name: "Control names", category: "accessibility", severity: "error", description: "Buttons and inputs need a visible label, aria-label, or associated <label>.", params: {}, version: 1, sourceRef: "WCAG 4.1.2" },
    { key: "a11y.svg-labeling", name: "SVG labeling", category: "accessibility", severity: "warning", description: "Inline SVG is aria-hidden or has role=img with a title/aria-label.", params: {}, version: 1, sourceRef: "WCAG 1.1.1" },
    { key: "a11y.canvas-fallback", name: "Canvas fallback", category: "accessibility", severity: "warning", description: "Canvas simulations need an aria-label or text alternative.", params: {}, version: 1, sourceRef: "WCAG 1.1.1" },
    { key: "custom.event-contract", name: "Custom interaction contract", category: "custom", severity: "info", description: "Wrapped custom interactions should declare the interaction:* postMessage contract or be documented as inline.", params: { events: ["interaction:ready", "interaction:progress", "interaction:complete", "interaction:score", "interaction:reset", "interaction:error"] }, version: 1, sourceRef: "docs/custom-interactive-beat-spec.md" },
    { key: "sourcemap.health", name: "Source map health", category: "structure", severity: "info", description: "Blocks without source offsets or with low mapping confidence.", params: {}, version: 1, sourceRef: "Studio importer" },
    { key: "export.readiness", name: "Export readiness", category: "export", severity: "info", description: "Summary: a lesson is export-ready when no error-severity findings remain unresolved.", params: {}, version: 1, sourceRef: "QUALITY-BAR.md" },
  ];
  return rules;
}
