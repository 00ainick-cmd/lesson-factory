# Product and engineering decisions log

Each entry: context, decision, alternatives, consequences. Newest at the bottom.

## D1. Drizzle ORM over Prisma

Context: PostgreSQL with pgvector, raw SQL needed for FTS and vector search, small team.
Decision: Drizzle ORM with SQL migrations under `drizzle/`. `vector` columns declared via `customType`.
Alternatives: Prisma (pgvector support via `Unsupported`, heavier client generation).
Consequences: Migrations are plain SQL and reviewable; typed queries; no codegen step.

## D2. Own session auth instead of a hosted identity provider

Context: Private, invite-only, three roles, no public sign-up.
Decision: argon2id password hashing, server-side sessions table, HttpOnly SameSite=Lax cookie carrying an opaque session id signed with HMAC (SESSION_SECRET). Invite tokens are single-use, hashed at rest, expire in 7 days. First admin bootstrapped from env only while `users` is empty.
Alternatives: Auth.js / Clerk. Rejected for now to keep the trust boundary small and self-hostable; the `auth/` module is isolated so an OIDC provider can be added later.
Consequences: We own password reset (Phase 3 item) and rate limiting (basic in-memory limiter on login).

## D3. Patch-mode compiler for imported lessons (import fidelity)

Context: The gold lesson's 1,400-line script addresses the DOM by ID and class. A full re-render from a canonical model would inevitably drift and break `__inkGate`, `#check`, the bench and the meter.
Decision: Two compiler modes. **Patch mode** (imports): the original HTML is the base; every managed block edit is written back into the exact source node via the source map; beats are reordered, hidden or removed at the `<section>` level; custom regions are copied byte-for-byte. **Template mode** (Phase 2 new lessons): render from the chassis template.
Alternatives: Full normalisation to a block model with regenerated HTML (loses fidelity), or raw HTML as the only source of truth (no structured editing).
Consequences: The canonical model stores managed block content plus verbatim `rawHtml` for custom/opaque regions; the original artifact is required to compile an imported project (it is immutable and content-addressed, so this is safe). Edits to managed blocks are exact; structural changes outside beats are limited to what the source map covers.

## D4. Executable content runs only in sandboxed iframes with a dedicated CSP

Context: Imported lessons contain arbitrary JS. The main app holds session cookies and workspace data.
Decision: Previews are served from `/api/preview/*` with `Content-Security-Policy: sandbox allow-scripts; ...` headers and embedded with `<iframe sandbox="allow-scripts">` (no `allow-same-origin`), producing an opaque origin with no cookies, storage or DOM access to the parent. Communication is one-way hints via `postMessage` validated with zod; the parent treats messages as UI selection hints only and never as mutation authority. The preview injects a small inspector agent that marks managed blocks with `data-lfs-block` attributes.
Consequences: Lesson code cannot read the app's cookies or call app APIs (`connect-src 'none'`). Some lessons that rely on `localStorage` will see it blocked in preview (opaque origin); the export is unaffected. Documented in security model.

## D5. Beats first, blocks second; taxonomy is workspace data

Context: The kit defines ten beat types with gate kinds and budgets, and insists they are chosen before interaction design.
Decision: `beat_types` is a per-workspace table seeded from BEAT-TYPES.md and editable. Each canonical beat carries `typeKey`, `purpose`, `objectiveIds`, `learnerAction`, `completionEvidence`, `gate`. Imported beats get a best-effort type with a confidence score; authors can correct it.
Consequences: Audit rules that reference taxonomy read workspace data, not constants.

## D6. Proposal-only AI with structured patches

Decision: Every ID Copilot output is a `proposals` row: severity, rule id and version (or generation prompt version), evidence (selectors, line ranges, excerpts), a JSON Patch (RFC 6902) against the canonical document, a unified diff of the affected compiled HTML, a plain-English explanation and a sandbox preview. Accept applies the patch to the working copy and records provenance on touched blocks. Nothing is ever applied without an explicit accept.
Consequences: Deterministic rule proposals and LLM proposals share one review UI and one audit trail.

## D7. Missing AERO Player runtime handled as a proposal, not a silent fix

Context: The gold lesson loads `../../../core/lesson-runtime.js` which is outside the kit. Its code guards every call, so the lesson runs without it.
Decision: The importer records the dependency as `missing-external`. The audit emits a finding with two proposals: (a) inline a standalone `AeroLesson` shim that stores state in memory / `localStorage` and logs interactions to the console so completion and score events are visible when the file is opened directly; (b) ignore. Export never removes the original script tag unless the author accepts a proposal that does so.

## D8. Knowledge Library is copied and versioned, kit stays read-only

Decision: `seed-kit/` is a vendored, read-only copy with the upstream commit recorded. The seeder creates `knowledge_documents` per workspace with `seed_path`, `seed_commit`, `baseline_sha256`. Users edit workspace copies; every save is a new `knowledge_document_versions` row; the UI shows drift versus the baseline. Re-seeding never overwrites an edited document; it adds a new baseline version for comparison.

## D9. Jobs on Postgres, no extra broker

Decision: A `jobs` table with `FOR UPDATE SKIP LOCKED` claiming, run inline in dev (`JOBS_MODE=inline`) or by a dedicated worker process. Import, audit, export and export validation are jobs so the UI can poll status and results are durable.
Alternatives: BullMQ (needs Redis), pg-boss (fine, but the surface we need is small).

## D10. Retrieval is filtered before it is embedded

Decision: ID Copilot never receives the whole library. Each task declares the categories it may read (planning: pedagogy + chassis + objectives; phrasing: voice; audit: quality + assessment + shipping; design: identity). Retrieval ranks chunks inside those categories via pgvector when embeddings are configured, else Postgres FTS. Every run stores the chunk ids used and the prompt version.

## D11. Export validation runs the exported file in a clean browser

Decision: The export job writes the standalone HTML artifact; a validation job serves it over HTTP from a temp directory and opens it with Playwright: collects `pageerror`, console errors, failed requests, and, when the lesson exposes `window.autoSolve`, runs it and asserts resolution. Failed requests for assets already listed as missing in the import report are reported as warnings, not blockers.

## D12. Standalone HTML first, ZIP second, SCORM 1.2 third

Decision: Phase 1 exports one self-contained HTML file. Web package ZIP (Phase 2) adds assets and a manifest. SCORM 1.2 (Phase 4) wraps the web package with `imsmanifest.xml` and a runtime adapter. SCORM 2004, xAPI, cmi5 are out of scope.

## D13. Tailwind 3 and hand-built accessible primitives

Decision: Tailwind 3.4 with CSS-variable tokens (AERO shell). Primitives (Button, Dialog, Tabs, Field) are small, keyboard-accessible components in `src/components/ui`. No heavy component library to keep the bundle small and the styling on-identity.

## D14. Hosted preview compatibility stays outside the production architecture

Context: Perplexity Computer serves attached previews below a private nested path and renders them in an iframe where third-party cookies may be blocked. Next.js normally assumes its configured base path begins at the domain root.
Decision: Keep preview compatibility in `preview-bundle/index.html`, `scripts/serve.mjs`, and the opt-in `BASE_PATH`, `ALLOW_FRAMING`, and `AUTH_VISITOR_HEADER` environment switches. Normal production runs the standalone Next.js server at the origin root with framing and visitor-header authentication disabled.
Consequences: The attached preview can exercise the full application without weakening the default deployment. The preview gateway is infrastructure-specific and must not be exposed as the production server.
