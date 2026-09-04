# Lesson Factory Studio: seed-kit audit and Phase 0/1 execution plan

Date: 2026-09-04. Author: engineering lead (Perplexity Computer) for Nick Brown, AEA Workforce Development.

## 1. Seed-kit audit (00ainick-cmd/lesson-factory)

Vendored at `seed-kit/` (commit recorded in `seed-kit/SOURCE.md`). 41 files, 1.2 MB, ~37,700 words of Markdown.

| Area | Files | What the app consumes |
|---|---|---|
| Entry / pipeline | START.md, PIPELINE.md, MANIFEST.md, SKILLS-POLICY.md, PROMPTS.md, SPEC-TEMPLATE.md, NOTES-TEMPLATE.md | Knowledge Library documents (category `process`). PIPELINE stages (SPEC, BUILD, PROVE, SHIP with gates G0 to G3) inform project status flow in Phase 3. |
| Pedagogy | pedagogy/README.md, 01-cognitive-goals, 03-frameworks, 04-research-foundations, 05-craft-principles, 07-vocabulary | Library category `pedagogy`. Retrieved for lesson planning and beat-map proposals. |
| Chassis | chassis/chassis.md, BEAT-TYPES.md (+ .html, REVIEW), beat-recipes.md, lesson-chassis.html, lesson-chassis-notes.md, player-face-snippets.md | BEAT-TYPES.md is parsed into the editable **beat taxonomy** (10 types in 5 phases: Orientation, Case, Definition, Explanation, Demonstration, Simulation, Practice, Procedure, Check, Consolidation, each with gate kind and word budget). chassis.md defines the frozen engine contract (`#ldock`, `__inkGate`, `.gatebar` / `data-clear` / `data-need`, `#check` state machine, field card). The import classifier has an **Electric Ink chassis profile** that recognises these. |
| Identity | identity/tokens.css, ELECTRIC-INK-LOCK.md, families.md | tokens.css header documents the AERO **shell** surface (#0f1419 shell, #0c1119 rail, #eaf2ff ink, #9fadc2 muted, #2b8fff accent, #3fd9d4 ok, #f5a623 gold; JetBrains Mono / IBM Plex Sans / Saira). The app chrome uses this. Electric Ink (ink #0a0b0d, paper #eef1f4, quantity colors R #ff9e3d, I #39d7ff, V #b48cff, Systems `--hero` #3ee0c8) becomes the lesson theme family. |
| Voice | NICK-VOICE-STYLE-GUIDE.md, nick-aet-voice.md, voice-examples.md, NICK-AET-CERT-BOOK.md | Library category `voice`. Retrieved for drafting and rewrite proposals. Banned phrase list from quality-gate.py becomes a rule. |
| Content | caet-lo-registry.md, objectives.md, dc-course-router.md | caet-lo-registry.md is parsed into the editable **objective registry** (code, category, verbatim wording, study-guide note). |
| Assessment | ASSESSMENT.md | Category `assessment`. Item rules (four options, no negative stems, keyed position varies, feedback per option) become audit rules. |
| Quality | QUALITY-BAR.md, tools/quality-gate.py | CONFIG thresholds are translated into versioned, editable **quality rules** rows (words, fragment rate, svg per minute, photos, ready call sites, gated beats, items, banned phrases, external hosts allowlist). |
| Ship | ship/SHIP.md | Category `shipping`. Export preflight checks (assets referenced must exist, forward-slash zip paths, SCORM 1.2 reporting fields). |
| Gold | gold/01-resistance.html, GOLD-TEARDOWN.md, gold-metrics.json | Import/export regression fixture. SHA-256 `50d9ee05...78b9c`, 2,914 lines, 167,905 bytes. |

### Gold lesson anatomy (drives the import design)

- 10 `<section class="section" data-beat="...">` beats: hook (Cirrus), intuition (Define), bench, lattice, types, network, colorcode, measure (Ohms), check, wrap-up (Field card). A sticky `<nav id="ldock">` progress dock precedes them.
- 5 `<style>` blocks (one global at lines 11-321, four beat-local), 3 `<script>` blocks: `../../../core/lesson-runtime.js` (external, AERO Player runtime, **not present in the kit**), `assets/three.min.js` (**not present**), and one 1,400-line inline IIFE that implements the bench simulation, lattice (three.js, guarded by `if(!window.THREE)`), flip cards, networks, color decoder, Fluke meter procedure, `#check` state machine, `__inkGate`, and `window.autoSolve()` (a self-test hook).
- Local assets referenced but absent from the kit: 5 resistor photographs, `Resistance.mp3`. External: Google Fonts (allowed host per quality-gate.py).
- All `AeroLesson` calls are guarded with `if(window.AeroLesson)`; the file runs standalone with only 404 resource errors. This is the baseline the exporter must at least preserve.
- 15 inline SVG figures, 2 canvases, 1 table, 5 img, 135 unique IDs, zero inline event handlers.

Implications:
1. Beats are identifiable with high confidence from `[data-beat]` sections. Blocks inside them split into managed (headings, paragraphs, callouts, figures with img, tables, gate buttons) and wrapped-custom (anything with canvas, range/inputs, script-referenced IDs, or `.cc-stage`/bench/decoder/fluke containers).
2. Scripts reference DOM by ID; the exporter must preserve every ID and never regenerate custom markup. Hence the **patch-mode compiler** (Decision D3).
3. Missing runtime and assets are audit findings with repair proposals, not silent fixes.

## 2. Architecture summary

```
Browser (main context, strict CSP, no lesson code runs here)
  Next.js App Router UI  ── Editor (beat map | sandboxed preview iframe | inspector) ── ID Copilot panel
        │ fetch /api/*                          ▲ postMessage (validated, UI hints only)
        ▼                                       │
Next.js server (route handlers, server components)
  auth/session ─ rbac ─ audit log ─ jobs queue ─ storage (local | S3) ─ knowledge retrieval (FTS + pgvector)
  lesson/import (parse5 + cheerio) → canonical LessonDocument + SourceMap + AssetManifest + ImportReport
  lesson/compile (patch mode for imports, template mode for new lessons) → preview HTML / export HTML
  copilot/audit rules (versioned) → findings → proposals (JSON Patch + unified diff + preview)
  copilot/provider (mock | anthropic) server-side only
PostgreSQL 15+ (+pgvector)      Object storage (originals content-addressed, immutable)
```

Key models: `workspaces`, `workspace_members(role)`, `invites`, `projects`, `project_versions` (immutable snapshots with `content_hash`), `project_working_copy`, `artifacts` (originals, sha256, storage key), `assets`, `exports`, `knowledge_documents` + `knowledge_document_versions` (seed baseline hash), `objectives`, `beat_types`, `quality_rules`, `theme_tokens`, `jobs`, `audit_findings`, `proposals`, `activity_log`, `copilot_runs` (prompt version, sources used).

## 3. Phase 0 execution plan

1. Repo, tooling, CI, env, migrations (Drizzle). 
2. Auth: argon2 password hashing, DB-backed sessions, signed cookie, invite tokens, first-admin bootstrap. RBAC helper `requireRole(workspaceId, role)`.
3. Workspaces, projects, versions, artifacts, assets, exports tables and API.
4. Knowledge Library: seeder copies every kit `.md` (and tokens.css) into `knowledge_documents` with category, seed path, seed commit, baseline sha256; parsers derive objectives, beat types, quality rules, theme tokens. Document detail page shows version list and baseline drift.
5. Theme foundation: AERO shell tokens as CSS variables; Electric Ink family tokens stored as workspace theme data.
6. Activity log middleware for every mutation.
7. ID Copilot shell: right-rail panel, droid indicator states (idle, scanning, done, attention), server endpoint with mock provider and retrieval preview showing sources used.

## 4. Phase 1 execution plan

1. Upload → `artifacts` (immutable, sha256) → import job.
2. Import pipeline: parse5 with source locations → chassis profile detection → beat extraction → block classification (managed / wrapped custom / opaque embed / unsupported) → source map → asset manifest (local, external, inline data) → import report.
3. Canonical `LessonDocument` (zod-validated) saved as working copy; version 1 "Imported" created.
4. Compiler: patch mode. Start from original HTML, apply block edits into the source DOM by source-map node path, apply beat reorder/hide/delete, inject `data-lfs-*` markers for preview (stripped on export), optional standalone runtime shim.
5. Preview route `/api/preview/:projectId` served with sandbox CSP, iframe `sandbox="allow-scripts"`. Inspector agent script handles hover/select, validated postMessage.
6. Editor: three panes, block inspector forms (heading, rich text via Tiptap, callout, image alt/caption, table cells, safe button labels), beat ops (reorder, duplicate, hide, delete), undo/redo (client history), save, named versions.
7. Import audit rules with evidence + proposals (severity, rule id + version, evidence, JSON Patch, unified diff, explanation, preview, accept/edit/reject/ignore).
8. Export: standalone HTML job → artifact; validation job runs Playwright against the export (page errors, console errors, `autoSolve` when present) and stores a report.
9. Tests: unit (parser, classifier, compiler round-trip, patch application, rules), integration (API with test DB), Playwright regression (full gold workflow).

## 5. Out of scope for this slice

Phase 2 (new lesson wizard, theme editor, component library, ZIP), Phase 3 (review), Phase 4 (SCORM 1.2). Schema and module boundaries leave room for them (project status enum, exports.kind, review tables reserved in docs).
