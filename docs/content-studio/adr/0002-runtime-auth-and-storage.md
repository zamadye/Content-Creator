# ADR-0002: Runtime, authentication, and storage baseline

- **Status:** Proposed baseline; implementation choice incomplete.
- **Date:** 2026-11-01 UTC.
- **Decision owners:** repository owner.
- **Related:** architecture, API contracts, UI specification and P0 reports.

## Context

The product is a private, single-owner application first, with workspace-aware ownership from the start. VO, scripts, source assets, renders and signed URLs are private data. The existing repo has a legacy npm package under `editorial-engine`; it must not be upgraded or absorbed into the new workspace implicitly.

## Decision

- Preserve `editorial-engine/` as a legacy npm workspace during the initial migration.
- A separate root pnpm workspace is the intended direction, but package-manager version, root scripts, auth library, database/storage drivers and service versions are **not yet selected or installed**.
- Keep API, worker and UI as explicit boundaries; use private filesystem storage for local development and an S3-compatible adapter for production only after provider choice.
- Use maintained OIDC/session libraries rather than custom authentication or cryptography. No OIDC provider is configured in this sandbox.
- Never place user media, credentials or private outputs in Git or test fixtures; tests use synthetic data.

## Rationale / limits

This follows the architecture document while avoiding a premature vendor lock or untested dependency pile. The sandbox has Node 22.22.3/Corepack 0.34.6 but no pnpm or Docker. No DB, Redis, object storage or auth integration has been run. This ADR is not an approval to deploy or accept real media.

## Required follow-up

After the P0 renderer/runtime compatibility spike, pin package manager and Node engine; choose an OIDC library; verify local filesystem and one S3-compatible provider contracts; document threat model, ACL tests, upload limits, signed URL policy, migrations and rollback. Amend this ADR with exact versions and evidence before P1 integration is called complete.
