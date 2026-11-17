# Content Studio local development

Status: **PARTIAL / API and UI foundation only.** This is a local development recipe, not a production deployment guide. No real OIDC issuer or private storage provider is configured in this repository. Do not put real media or credentials in Git.

## Prerequisites

- Node.js `>=22.18.0`, Corepack and pnpm `10.34.9` (provided by the root `packageManager` pin).
- Docker Compose plugin for PostgreSQL/Redis services.
- An OIDC issuer/client for exercising real login. The API deliberately does not provide a fake login.

## Setup

1. Install the pinned workspace: `corepack pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env`. Replace `SESSION_KEY_HEX` with 32 random bytes encoded as hex, e.g. `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `STUDIO_OWNER_SUBJECT`. `STUDIO_OWNER_SUBJECT` is the exact `${issuer}|${sub}` identity returned by the configured OIDC provider. Register the redirect URI exactly as `http://localhost:3000/studio-api/auth/callback` for local use.
4. Choose exactly one PostgreSQL target. For local development, start dependencies with `docker compose --env-file .env -f infra/compose/studio.dev.yml up -d`. For the owner-created Supabase Content Studio project, copy its PostgreSQL connection URI from Supabase Dashboard into local `.env` as `DATABASE_URL`; keep its password private, encode URI-special characters, and retain `sslmode=require` (the pool rejects Supabase URLs without TLS). Do not place the URI in Git, logs, or chat.
5. Before running `corepack pnpm db:migrate` against Supabase, reconcile the applied `content_studio_initial_schema` migration in Supabase's migration ledger with Prisma's `_prisma_migrations`. The Supabase migration connector applied the schema, but Prisma CLI history was not initialized; blindly running Prisma deploy may try to create already-existing tables. Local Compose can use the normal committed Prisma migration. Prisma engine acquisition attempted `binaries.prisma.sh`, which is outside the sandbox's permitted network hosts.
6. Run `corepack pnpm dev`. Web listens on `0.0.0.0:3000`; API listens on `0.0.0.0:3100`. Next rewrites browser requests under `/studio-api/*` to the server-side `API_ORIGIN`; browser code uses relative URLs, not localhost API calls.

The API starts only with `DATABASE_URL`, `SESSION_KEY_HEX`, `STUDIO_OWNER_SUBJECT`, and a valid `STUDIO_WORKSPACE_ID`. It bootstraps only the explicitly configured owner membership; it never grants access to the first visitor. Configure OIDC to make `/health/ready` pass. The app shell and tests work without OIDC, but login then returns a deliberate 503.

## Implemented paths

- `/` — API-connected login/session/project list/create shell (real database/OIDC acceptance still requires configured services).
- `/settings` — read-only service readiness and configuration guidance; provider secret write-only settings are not implemented.
- API health `/health/live`, `/health/ready`; auth `/auth/login`, `/auth/callback`, `/auth/session`, `/auth/logout`; projects `GET/POST /api/projects` and `PATCH /api/projects/:projectId`; jobs `POST /api/projects/:projectId/jobs` (allowlisted `system.health-check` fixture only) and `POST /api/jobs/:jobId/cancel`. When `STORAGE_DRIVER=s3` and its required S3 settings are configured, upload routes are `POST /api/projects/:projectId/uploads` (signed intent), `POST /api/projects/:projectId/uploads/:intentId/complete` (verify and persist metadata), and `POST /api/projects/:projectId/assets/:assetId/download` (120-second signed URL after project-membership check).

## Known limits

- No UI E2E/browser run, real OIDC provider test, live PostgreSQL migration test, or Redis worker test has been performed here.
- Project API tests use an injected fake repository. The SQL repository and schema were typechecked but not executed against PostgreSQL.
- Jobs/outbox now have transactional enqueue + idempotency, BullMQ outbox dispatch, a worker with heartbeat/state/attempt records, cooperative DB cancellation, retry/backoff, and a health-check fixture handler. These operations have unit/injection tests only, not Redis/Postgres recovery tests. S3 signed upload intent/completion routes now enforce session, CSRF origin, strict MIME/size and project membership at the service boundary; they are not live-service tested, and provider settings UI does not exist.
- For production, use HTTPS, an owner-controlled OIDC provider, durable private storage and independently managed Postgres/Redis. Do not expose the development Compose ports publicly.
