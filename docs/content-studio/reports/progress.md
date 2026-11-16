# Content Studio progress tracker

Branch: `arena/54cb36c6-content-creator`
Baseline HEAD: `5dd7c42`
Updated: 2026-11-01 UTC.

| Task | Phase | Status | Evidence | Next / limitation |
|---|---|---|---|---|
| Read design, inspect branch/worktree and search for AGENTS.md | P0-01 | DONE | Handoff/readme plus six design docs reviewed. The only current `AGENTS.md` found is `.scratch/hyperframes-smoke/AGENTS.md` (scoped to that scratch fixture); no repository-level file was found. Local pre-sync changes were protected in `stash@{0}`; branch fast-forwarded to current remote. | Keep stash until owner requests its removal; do not apply indiscriminately over committed content. |
| Record environment and legacy baseline | P0-02 | DONE | `environment-baseline.md`; Node/Python available, no pnpm/FFmpeg/ffprobe/Chrome/Docker. | Deployment and user desktop are not represented by this sandbox. |
| Renderer benchmark | P0-03 | PARTIAL (three synthetic candidates rendered; no selection) | `renderer-benchmark.md`; OpenFilm 0.3.2, HyperFrames 0.9.52 and Remotion 4.0.380 produced valid 30s/300-frame H.264/AAC renders in both ratios at 10 fps. Full decode/frame checks passed; HyperFrames and Remotion seek-repeat checks passed. Captions confirmed in landscape; OpenFilm portrait captions overflow/overlap and remain a visual defect. | Fix/check subtitle layouts and cue timing, pin fonts, test OpenFilm seek repeat, cancellation/missing-asset/recovery, capture peak RAM, complete exact licenses and matched comparisons. PATH lookup alone is never a capability blocker. |
| Stack/auth/storage/runtime decision | P0-04 | PARTIAL | ADR-0002 records OIDC candidate (`openid-client` + `@fastify/secure-session`), Prisma/PostgreSQL + BullMQ/Redis architecture, local private filesystem, and contract-only production storage/AI. Matched Prisma CLI/client 6.19.0 metadata checked and pinned in P1 DB package; npm registry metadata is not compatibility integration evidence. | No OIDC provider, storage/hosting vendor, DB/Redis service, or AI provider authorized/selected; no auth/DB/queue integration executed. Prisma schema validation currently fails because the CLI attempts to fetch engines from binaries.prisma.sh, outside this sandbox's permitted network hosts; Docker unavailable for migration test. |
| License inventory and technical ADR | P0-05 | PARTIAL | Preliminary `license-inventory.md`; ADR-0001 explicitly defers renderer selection. | Verify exact versions/licenses after spike; no runtime adapter selected. |
| Existing repo safety tests | P0 | DONE (legacy scope only) | Story gate 16/16; script audit 7/7; Node syntax check passed. | These do not test Content Studio. |
| Workspace and base scripts | P1-01 | PARTIAL | Root pnpm workspace lockfile refreshed; `@content-studio/contracts`, `@content-studio/domain`, `@content-studio/storage`, and `@content-studio/db` boundaries exist. `pnpm install --frozen-lockfile`, typecheck and unit tests pass for runnable packages. | Build/CI coverage and the web/API/worker package boundaries remain to be completed. |
| Domain, DB schema, migrations | P1-02 | PARTIAL | Contracts plus job-state and workspace-ownership rules tested; Prisma 6.19.0 schema and initial SQL migration authored. | Prisma engine download blocked by permitted-host restriction; schema validation and blank-DB migration were NOT TESTED. Seed and project revision ETag persistence not implemented. |
| Auth, API, ownership | P1-03 | NOT STARTED | No API/session/OIDC integration. | Requires issuer/client config, schema validation and DB repository; don't expose dev-auth in production. |
| Storage | P1-04 | PARTIAL | `LocalPrivateStorage` has content-addressed workspace-scoped files, MIME/size allowlist, checksums, atomic writes, path and symlink containment; 3 storage tests pass. | Upload intent/complete, signed access, streaming and S3 adapter absent; OIDC/ACL integration not present. |
| Jobs and outbox | P1-05 | PARTIAL | Pure job state transitions enforce allowed transitions; unit-tested. SQL schema includes Job/Attempt/Outbox. | No transactional enqueue/outbox dispatcher, heartbeat, worker retry/cancel, or Redis integration. |
| UI shell | P1-06 | NOT STARTED | No Content Studio web UI. | Login/project/settings flows remain. |
| Local services/config | P1-07 | PARTIAL | Placeholder `.env.example` and dev Compose for PostgreSQL 17.6/Redis 7.4.2 added. | Docker is not installed here; Compose health checks and startup/migrations remain NOT TESTED. |
| VO ingest and timestamp alignment | P2 | NOT STARTED | No product code. | Depends on P1 and provider/language validation. |
| Scene-kit/renderer | P3 | NOT STARTED | No adapter selected. | Blocked on ADR-0001 benchmark. |
| Planner/storyboard/revisions | P4 | NOT STARTED | No product code. | Depends on typed contracts, scene-kit and P2/P3. |
| Review/final render/export | P5 | NOT STARTED | No product code. | Depends on prior phases and human review evidence. |
| Recovery/operations/deployment/plugins | P6–P8 | NOT STARTED | No product code or deployment. | Follow phase dependencies; P8 optional. |

## Delivery log

- `5dd7c42` (`build framework`) is the synchronized remote baseline, not this implementation's commit.
- `7283fc4` records the initial P0 reports/ADRs on `arena/54cb36c6-content-creator`.
- `cab50f0` adds the pinned root workspace and first renderer-neutral integer-time contract slice.
- `a21a203` records P0-03 three-candidate synthetic benchmark evidence and corrects the scoped AGENTS.md inventory.
- `e9a0da9` adds deterministic job lifecycle and workspace ownership rules to the domain package.
- Current P1 work adds a Prisma schema/initial migration, local private storage adapter, and local Postgres/Redis Compose/env templates. Prisma schema/migration validation is not proven: CLI engine download failed at `binaries.prisma.sh` (not an allowed host); Docker is unavailable. Storage/domain/contracts tests and TypeScript checks pass. P1 is **PARTIAL**, not complete.
- Future progress updates must cite the commit SHA and exact test/evidence; statuses are scoped, not global quality claims.
