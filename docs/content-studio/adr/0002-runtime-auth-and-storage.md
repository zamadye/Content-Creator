# ADR-0002: Runtime, authentication, and storage baseline

- **Status:** Proposed baseline; vendor/runtime integration remains unimplemented.
- **Date:** 2026-11-01 UTC.
- **Decision owners:** repository owner.
- **Related:** architecture, API contracts, UI specification and P0 reports.

## Context

The product is a private, single-owner application first, with workspace-aware ownership from the start. VO, scripts, source assets, renders and signed URLs are private data. The existing repo has a legacy npm package under `editorial-engine`; it must not be upgraded or absorbed into the new workspace implicitly.

## Decisions

- Preserve `editorial-engine/` as a legacy npm workspace during the initial migration.
- Root workspace baseline: `pnpm@10.34.9`, Node `>=22.18.0`; the renderer-neutral contracts package pins Zod `4.6.7`, TypeScript `5.9.3`, and tsx `4.20.6`. This workspace slice is implemented and its six contract tests/typecheck pass after `pnpm install --frozen-lockfile`.
- Keep the documented modular-monolith boundaries: Next.js/React UI; Fastify API; PostgreSQL metadata with Prisma migrations; Redis/BullMQ jobs; worker process separate from web request handling. These are architecture choices, not installed product integrations.
- **Authentication candidate:** use OIDC with `openid-client` for protocol handling and Fastify secure cookies/session handling via `@fastify/secure-session`; do not implement OAuth/OIDC cryptography or a custom identity provider. Registry metadata was checked 2026-11-01: `openid-client@6.9.0` and `@fastify/secure-session@8.4.2`, both reported MIT. No code was installed or integration-tested; exact versions remain provisional pending provider selection, compatibility tests, and full dependency license review.
- **Database/queue:** keep Prisma/PostgreSQL and BullMQ/Redis as the intended adapter stack. Candidate registry metadata on 2026-11-01 showed Prisma CLI `8.0.0-rc.33` (pre-release) while `@prisma/client` latest was `7.10.1`; do not mix those or adopt the prerelease. Pin a mutually compatible stable CLI/client pair and PostgreSQL/Redis service images in P1 when implementation begins. BullMQ `6.7.6` / ioredis `6.0.0` metadata was checked but neither was installed or tested.
- **Storage:** local development uses a private filesystem adapter behind an object-storage interface. No production S3-compatible provider is selected because hosting, region, retention, and cost constraints are not specified. Keep production integration contract-only; do not create buckets or store private media in Git.
- **AI/ASR:** provider interface/fixture mode only for now. No vendor, credentials, model, or provider test has been selected/authorized. Avoid provider-specific code or claims of live generation.
- **Deployment:** no OIDC issuer, database/Redis service, object storage, public domain, or deployment target is configured in this sandbox. No deployment or real-media acceptance is authorized by this ADR.

## Rationale and limits

This establishes enough architecture to sequence implementation without inventing owner decisions about hosting, identity, provider spend, or retention. Registry metadata is a discovery snapshot, not a security audit, compatibility proof, availability guarantee, or complete license inventory. Docker is not installed in the sandbox; no DB, Redis, OIDC, S3 or AI integration has been run. Node 22.22.3 meets the workspace floor. Auth configuration must enforce issuer/audience validation, state/nonce/PKCE, secure HTTP-only SameSite cookies, CSRF protection on mutations, callback allowlisting, session rotation/revocation, and workspace ACL checks; these controls are acceptance requirements, not yet implemented.

## Required follow-up

Before P1 integrations: obtain owner choice of OIDC provider and private storage/hosting target (or explicitly approve a local-only milestone); pin mutually compatible stable library/service versions after a minimal Node compatibility check; review the complete transitive license/security inventory; specify session lifetime, upload limits, retention/deletion, signed URL duration and backup policy. Then implement and test OIDC callback/session/CSRF, workspace ownership negatives, migrations, outbox/retry behavior, filesystem containment, and S3-compatible access controls. Do not mark this ADR implemented based on package metadata alone.
