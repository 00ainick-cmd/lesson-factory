# Deployment and operations

This runbook covers production deployment of Lesson Factory Studio. The recommended topology is a long-running Node web process, a PostgreSQL database with `pgvector`, durable S3-compatible object storage, and an optional worker process.

## Recommended topology

```text
Browser
  |
  | HTTPS
  v
Reverse proxy or platform load balancer
  |
  +--> Next.js web process
  |      |
  |      +--> PostgreSQL 15+ with pgvector
  |      +--> Private S3-compatible bucket
  |
  +--> Job worker
         |
         +--> Same PostgreSQL database
         +--> Same private object bucket
         +--> Chromium for export validation
```

The worker is optional when `JOBS_MODE=inline`. A separate worker is recommended when imports, audits, or export validation should not compete with web requests.

## Platform requirements

- Node.js 20 or newer
- PostgreSQL 15 or newer
- `pgvector` available to the database user
- A persistent filesystem only when `STORAGE_DRIVER=local`
- S3-compatible storage for horizontally scaled or ephemeral deployments
- Chromium and its system libraries wherever export validation jobs run
- A TLS-terminating reverse proxy or managed platform

The app does not require Redis. Jobs are stored and claimed in PostgreSQL with `FOR UPDATE SKIP LOCKED`.

## Production environment

Start from `.env.example` and provide secrets through the host's secret manager.

### Required

```dotenv
NODE_ENV=production
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/lesson_factory
SESSION_SECRET=replace-with-at-least-32-random-characters
APP_ORIGIN=https://studio.example.org
```

Generate a session secret with:

```bash
openssl rand -base64 32
```

Rotating `SESSION_SECRET` invalidates existing login sessions.

### Durable object storage

Production should normally use S3-compatible storage:

```dotenv
STORAGE_DRIVER=s3
S3_BUCKET=lesson-factory-production
S3_REGION=us-east-1
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
```

Leave `S3_ENDPOINT` empty for AWS S3. Set it for another compatible provider. Credentials can be omitted when the runtime receives an IAM role or workload identity.

The bucket must be private. The application reads and writes artifacts through the server; clients do not need direct bucket access.

For a single-host installation with a persistent volume:

```dotenv
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=/var/lib/lesson-factory/storage
```

Do not use local storage on ephemeral or horizontally scaled hosts.

### Jobs

For a simple single-process deployment:

```dotenv
JOBS_MODE=inline
```

For a dedicated worker:

```dotenv
JOBS_MODE=worker
JOBS_POLL_MS=1000
```

Run the web and worker with identical database, storage, and AI configuration:

```bash
npm run worker
```

Only the worker should use `JOBS_MODE=worker`; the web process also uses that value so it queues jobs without executing them inline.

### ID Copilot

For deterministic offline behavior:

```dotenv
AI_PROVIDER=mock
AI_MODEL=mock
EMBEDDINGS_PROVIDER=none
```

For Anthropic:

```dotenv
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-5
ANTHROPIC_API_KEY=provided-by-secret-manager
ANTHROPIC_BASE_URL=
EMBEDDINGS_PROVIDER=none
```

Never expose the API key through `NEXT_PUBLIC_*` variables or client-side code.

The block-level **Remove AI slop** action uses the same provider settings. With `AI_PROVIDER=anthropic`, the server sends only the selected block's editable text units and the no-ai-slop editing guidance to the configured model. With `AI_PROVIDER=mock`, it applies a deterministic subset of those rules. Both paths validate that the block's HTML elements, attributes, comments, and nesting are unchanged, then store a proposal instead of editing the lesson directly.

### Production security switches

These settings are only for the Perplexity attachment preview and must not be enabled in production:

```dotenv
ALLOW_FRAMING=false
AUTH_VISITOR_HEADER=false
BASE_PATH=
```

`AUTH_VISITOR_HEADER=true` trusts a platform-injected visitor header when third-party cookies are unavailable. It is not a general authentication mode.

## Database provisioning

Create a database and grant the application user permission to create the `vector` extension, or have an administrator install it before deployment.

Apply migrations before starting a new release:

```bash
npm ci
npm run db:migrate
```

Migrations are stored in `drizzle/` and should be applied exactly once per environment. Multiple application replicas should not all race to migrate during startup; use a release command or one-off deployment job.

### Initial administrator

There are two supported initialization paths.

**Interactive setup**

1. Apply migrations.
2. Start the web process.
3. Open `/setup`.
4. Create the first platform administrator and workspace.

The endpoint rejects additional setup attempts after any user exists.

**Seed script**

Provide these optional variables and run the seed once:

```dotenv
SEED_ADMIN_EMAIL=admin@example.org
SEED_ADMIN_PASSWORD=replace-with-a-long-password
SEED_WORKSPACE_NAME=AERO Studio
```

```bash
npm run db:seed
```

The seed is idempotent by email and workspace slug. Do not deploy the development defaults.

## Build and run

### Standard long-running Node deployment

Install dependencies and build with the production environment available:

```bash
npm ci
npm run db:migrate
npm run build
```

The project uses Next.js standalone output. Copy static assets into the standalone bundle:

```bash
cp -R public .next/standalone/
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/
```

Start the web process:

```bash
HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js
```

If jobs are separated, start the worker as a second process from the full source checkout:

```bash
NODE_ENV=production JOBS_MODE=worker npm run worker
```

The worker needs production dependencies, the `scripts/` and `src/` trees, and Chromium.

### Process definitions

A typical platform configuration is:

```text
Release: npm run db:migrate
Web:     HOSTNAME=0.0.0.0 PORT=$PORT node .next/standalone/server.js
Worker:  npm run worker
```

Use `JOBS_MODE=worker` when the worker process is deployed. Use `JOBS_MODE=inline` when only the web process exists.

## Reverse proxy

Forward the original scheme and client information:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Serve the application at the domain root for normal production. `BASE_PATH` is a build-time Next.js setting and should not be added casually.

TLS is required in production because session cookies are marked secure when `NODE_ENV=production`.

## Playwright export validation

Standalone HTML exports can be opened in a clean Chromium session. Install the browser and operating-system dependencies in the web process for inline jobs or in the worker image for worker mode:

```bash
npx playwright install --with-deps chromium
```

If the runtime cannot install system packages, use an image that already contains Playwright-compatible Chromium. Export creation can run without validation at the API level, but the current UI requests validation by default.

## Vercel

The Next.js UI and API routes can run on Vercel if PostgreSQL and S3 are external. However, the complete workflow is better suited to a long-running Node host because:

- local artifact storage is not durable on serverless filesystems
- a polling worker cannot remain resident
- Playwright/Chromium export validation may exceed serverless runtime or package limits
- imports and exports are designed as durable background jobs

If Vercel is used:

1. Configure external PostgreSQL with `pgvector`.
2. Set `STORAGE_DRIVER=s3`.
3. Start with `JOBS_MODE=inline`.
4. Move long-running jobs and Playwright validation to a separate worker service.
5. Run `npm run db:migrate` as a controlled release step, not from every function instance.

## Perplexity Computer preview

The attached development preview uses a platform-specific adapter:

- `preview-bundle/index.html` redirects to `__PORT_5000__`.
- `scripts/serve.mjs` exposes port 5000 and proxies Next.js on port 5001.
- `BASE_PATH=/port/5000` lets Next.js build paths for the port proxy.
- The gateway rewrites the nested private mount used by the attachment.
- `ALLOW_FRAMING=true` permits the preview iframe.
- `AUTH_VISITOR_HEADER=true` provides a cookie fallback bound to the platform visitor header.

Build and start that adapter with:

```bash
BASE_PATH=/port/5000 npm run build
PORT=5000 \
NEXT_INTERNAL_PORT=5001 \
BASE_PATH=/port/5000 \
ALLOW_FRAMING=true \
AUTH_VISITOR_HEADER=true \
node scripts/serve.mjs
```

This adapter is only for the Perplexity preview proxy. Do not expose it as the production server.

## Release procedure

1. Confirm the working tree is clean.
2. Run:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm run build
   ```

3. Back up the production database before a schema migration.
4. Deploy the new application artifact.
5. Run `npm run db:migrate` as a single release task.
6. Restart the web process.
7. Restart the worker if present.
8. Verify `/login`, authentication, workspace loading, one project, preview rendering, and a non-destructive audit.
9. Verify that queued jobs transition to `succeeded`.
10. Keep the previous application artifact available for rollback.

## Health and smoke checks

There is no dedicated `/health` route yet. Use `/login` as the basic HTTP readiness path, then perform an authenticated smoke test:

- sign in
- load a workspace
- open a project
- open the editor
- switch Author and Learner preview modes
- open Inspector and ID Copilot
- run a non-destructive audit
- create and validate a standalone export

Monitor application logs for `job_failed`, `worker_loop_error`, authentication failures, and database connection errors.

## Backups

Back up both data planes:

- **PostgreSQL:** users, sessions, workspaces, canonical documents, versions, proposals, jobs, and audit history
- **Object storage:** immutable originals and generated export artifacts

A database-only restore is incomplete if the corresponding object keys are missing. Preserve both systems to the same recovery point when possible.

Suggested minimum policy:

- daily database backups
- point-in-time recovery when the provider supports it
- bucket versioning or immutable retention for artifacts
- periodic restore drills in a non-production environment

## Rollback

Application rollback:

1. Stop or drain the worker.
2. Redeploy the previous application artifact.
3. Restart the web process and worker.
4. Run the smoke checks.

Database rollback:

- Prefer forward-fix migrations.
- Do not run `npm run db:reset`; it destroys the public schema.
- If a migration is incompatible with the previous release, restore the database backup taken before that migration.

`npm run db:reset` is for disposable local databases only.

## Troubleshooting

### The app redirects to setup repeatedly

- Confirm migrations ran against the same `DATABASE_URL` used by the web process.
- Check that the `users` table contains the administrator.
- Verify the database host is reachable from every web replica.

### Sign-in succeeds but the next request is anonymous

- Confirm the public site uses HTTPS.
- Verify `APP_ORIGIN` matches the public origin.
- Check that a reverse proxy is not stripping cookies.
- Keep `AUTH_VISITOR_HEADER=false` outside the Perplexity preview.

### Imports or exports remain queued

- With `JOBS_MODE=inline`, inspect the web logs for `inline_job_failed`.
- With `JOBS_MODE=worker`, confirm the worker uses the same `DATABASE_URL` and is running.
- Query the `jobs` table for `queued`, `running`, or `failed` rows.

### Export validation fails to launch Chromium

- Run `npx playwright install --with-deps chromium` in the deployment image.
- Confirm the worker has enough memory and the required shared libraries.
- Review the export validation report to separate known missing assets from blocking JavaScript errors.

### Imported assets disappear after a restart

- Do not use `.storage` on an ephemeral filesystem.
- Configure S3-compatible storage or attach a persistent volume.
- Confirm the web and worker processes use the same storage configuration.

### ID Copilot is unavailable

- Verify `AI_PROVIDER`.
- When using Anthropic, confirm `ANTHROPIC_API_KEY` is present only on the server.
- Use `AI_PROVIDER=mock` to verify the rest of the proposal workflow without an external model.
