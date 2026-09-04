# Lesson Factory Studio

Lesson Factory Studio is a private authoring environment for importing, reviewing, and safely editing beat-based interactive HTML training lessons. It is designed around AEA avionics instruction, the AERO lesson chassis, and the Electric Ink visual language.

The editor preserves the behavior of an imported lesson instead of regenerating it from scratch. Managed text and metadata are editable, custom interactions remain wrapped and protected, and ID Copilot proposes changes for an author to review rather than silently applying them.

## Current capabilities

- Import a self-contained `.html` lesson into an immutable, content-addressed original.
- Detect lesson beats and classify managed, custom, opaque, and unsupported blocks.
- Edit from a three-pane workspace:
  - Beat Map and structural navigation
  - Sandboxed live Author or Learner preview
  - Inspector or ID Copilot review panel
- Edit headings, rich text, callouts, image metadata, tables, button labels, and beat metadata.
- Preserve script-sensitive custom markup through the patch-mode compiler.
- Autosave with optimistic concurrency, undo and redo, named versions, and version restore.
- Run deterministic instructional-design audits with source evidence.
- Rewrite any supported text block with the MIT-licensed `no-ai-slop` editing rules while preserving its HTML structure.
- Review proposal-only fixes with JSON Patch, HTML diff, and provenance.
- Export standalone HTML and validate it in a clean Chromium session.
- Manage workspace knowledge, objectives, beat types, quality rules, members, and activity.

## Product principles

- **The original is immutable.** Imported bytes are stored once under a SHA-256 content key.
- **Fidelity before normalization.** Imported lessons compile by patching known source nodes.
- **Executable content is isolated.** Lesson JavaScript runs in a sandboxed iframe, not the authenticated application context.
- **AI remains reviewable.** ID Copilot creates proposals. It does not change the lesson until an author explicitly accepts one.
- **Rules are workspace data.** Objectives, beat types, quality rules, voice guidance, and other knowledge can evolve without hard-coding them into the editor.

## Technology

- Next.js 15 App Router and React 19
- TypeScript, Tailwind CSS, Zustand, and Tiptap
- PostgreSQL 15+ with the `pgvector` extension
- Drizzle ORM and SQL migrations
- Local filesystem or S3-compatible object storage
- PostgreSQL-backed background jobs
- Anthropic or deterministic mock ID Copilot provider
- Playwright/Chromium export validation

## Repository layout

```text
.
├── src/app/                 Next.js pages and API route handlers
├── src/components/          Application shell and editor components
├── src/server/              Auth, RBAC, storage, jobs, lesson engine, and Copilot
├── drizzle/                 Reviewable PostgreSQL migrations
├── scripts/                 Migration, seed, reset, worker, and preview scripts
├── docs/                    Plan, decisions, and deployment runbook
├── seed-kit/                Vendored source snapshot consumed by the app
├── lesson-factory/          Original curriculum/design kit preserved from this repo
└── preview-bundle/          Perplexity Computer preview entry point
```

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 15 or newer with permission to install `pgvector`
- Chromium installed by Playwright if export validation will be used

### Install and configure

```bash
git clone https://github.com/00ainick-cmd/lesson-factory.git
cd lesson-factory
npm ci
cp .env.example .env
```

Create the development and test databases, then edit `.env` with valid connection strings and a unique session secret:

```bash
createdb lesson_factory
createdb lesson_factory_test
openssl rand -base64 32
```

Do not commit `.env`. The repository ignores it.

### Initialize the database

```bash
npm run db:migrate
npm run db:seed
```

`db:migrate` installs the `vector` extension when needed and applies migrations. `db:seed` creates the configured seed administrator and AERO Studio workspace if they do not already exist, then copies the bundled knowledge into the workspace.

For a clean database without the default seed account, run only `npm run db:migrate`, start the app, and complete `/setup`. First-run setup is disabled after the first user exists.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To use another local port without changing package scripts:

```bash
npx next dev -p 3100
```

Update `APP_ORIGIN` to match the URL users will open.

### Run checks

```bash
npm run typecheck
npm run lint
npm run build
```

The package also reserves `npm test` and `npm run test:e2e` for Vitest and Playwright suites. The current repository does not yet include an automated test suite, so production readiness is presently checked with type checking, linting, a production build, and browser QA.

## First workflow

1. Enter the shared workspace password, or complete the one-time setup screen on a new installation.
2. Open a workspace and choose **Import lesson**.
3. Select a self-contained HTML file.
4. Wait for the import and automatic audit to finish.
5. Open the editor.
6. Select a beat or managed block from the Beat Map.
7. Edit content in the Inspector and verify it in Author and Learner preview modes.
8. To humanize a block, select it and choose **Remove AI slop** in the Inspector.
9. Review the generated HTML diff in ID Copilot, then explicitly accept, reject, or ignore the proposal.
10. Save a named version.
11. Export and inspect the stored validation report before downloading the HTML.

The block rewrite uses the [`no-ai-slop`](https://github.com/petergyang/no-ai-slop) skill by Peter Yang at pinned commit `000650b156983f5159695b441477f4e63b25dc85`. The server records that revision with every rewrite proposal. In `mock` mode, a deterministic subset of the rules is applied; in `anthropic` mode, the full editing guidance is supplied to the configured model. In both modes, the app validates that HTML structure is unchanged and requires a human to accept the proposal.

## Environment summary

The complete template is in [`.env.example`](.env.example).

| Variable            | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection used by the app and worker            |
| `DATABASE_URL_TEST` | Optional isolated test database                             |
| `SESSION_SECRET`    | Signs opaque session IDs; use at least 32 random characters |
| `APP_ORIGIN`        | Public application origin used in generated links           |
| `STORAGE_DRIVER`    | `local` for development or `s3` for durable deployment      |
| `JOBS_MODE`         | `inline`, `worker`, or `off`                                |
| `AI_PROVIDER`       | `mock` or `anthropic`                                       |
| `AI_MODEL`          | Server-side model identifier                                |
| `ANTHROPIC_API_KEY` | Required only when `AI_PROVIDER=anthropic`                  |

`BASE_PATH`, `ALLOW_FRAMING`, and `AUTH_VISITOR_HEADER` exist for the Perplexity hosted preview adapter. They must remain unset or false in a normal production deployment.

## Deployment

Use a long-running Node host for the complete feature set, especially Playwright export validation and a dedicated worker. A production deployment also needs durable PostgreSQL and S3-compatible storage.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:

- production architecture and environment variables
- standalone Next.js build commands
- database migrations and seed policy
- web and worker process configuration
- S3-compatible storage
- reverse proxy and TLS requirements
- health checks, backups, rollback, and troubleshooting
- Vercel limitations
- Perplexity preview-only deployment

## Security model

- Passwords are hashed with Argon2id.
- Sessions are server-side and represented by signed, HttpOnly cookies.
- Workspace permissions are enforced by role-based authorization.
- Imported lesson code runs under a dedicated sandbox CSP with no access to application cookies or APIs.
- Originals are immutable and content-addressed.
- Mutations are recorded in the activity log.
- AI credentials remain server-side.

Production deployments must use TLS, a unique `SESSION_SECRET`, private object storage, and `AUTH_VISITOR_HEADER=false`.

## Documentation

- [Deployment and operations](docs/DEPLOYMENT.md)
- [Architecture and implementation plan](docs/00-plan.md)
- [Engineering decisions](docs/decisions.md)
- [Original Lesson Factory kit](lesson-factory/START.md)
- [Vendored seed source](seed-kit/SOURCE.md)

## Delivery status

The implemented slice includes the foundation, API surface, Knowledge Library, import pipeline, patch-mode compiler, three-pane editor, live preview, ID Copilot audits and proposals, standalone HTML export, and browser validation.

New-lesson generation, packaged ZIP export, review workflows, and SCORM 1.2 packaging remain future phases.
