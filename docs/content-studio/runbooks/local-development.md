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
4. Start only local development dependencies: `docker compose --env-file .env -f infra/compose/studio.dev.yml up -d`.
5. Apply the committed SQL/Prisma migration explicitly: `corepack pnpm db:migrate`. This command has not been verified in this sandbox; Prisma engine acquisition attempted `binaries.prisma.sh`, which is outside the sandbox's permitted network hosts.
6. Run `corepack pnpm dev`. Web listens on `0.0.0.0:3000`; API listens on `0.0.0.0:3100`. Next rewrites browser requests under `/studio-api/*` to the server-side `API_ORIGIN`; browser code uses relative URLs, not localhost API calls.

The API starts only with `DATABASE_URL`, `SESSION_KEY_HEX`, `STUDIO_OWNER_SUBJECT`, and a valid `STUDIO_WORKSPACE_ID`. It bootstraps only the explicitly configured owner membership; it never grants access to the first visitor. Configure OIDC to make `/health/ready` pass. The app shell and tests work without OIDC, but login then returns a deliberate 503.

## Implemented paths

- `/` — API-connected login/session/project list/create shell (real database/OIDC acceptance still requires configured services).
- `/settings` — read-only service readiness and configuration guidance; provider secret write-only settings are not implemented.
- API health `/health/live`, `/health/ready`; auth `/auth/login`, `/auth/callback`, `/auth/session`, `/auth/logout`; projects `GET/POST /api/projects`.

## Known limits

- No UI E2E/browser run, real OIDC provider test, live PostgreSQL migration test, or Redis worker test has been performed here.
- Project API tests use an injected fake repository. The SQL repository and schema were typechecked but not executed against PostgreSQL.
- Jobs/outbox are schema and domain transition foundations only. No dispatcher/worker, upload intent/completion endpoint, signed URLs, S3 adapter, or provider settings UI exists.
- For production, use HTTPS, an owner-controlled OIDC provider, durable private storage and independently managed Postgres/Redis. Do not expose the development Compose ports publicly.
