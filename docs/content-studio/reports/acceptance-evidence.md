# Acceptance evidence — Content Studio

This is an evidence index, not a readiness badge. Updated 2026-11-01 UTC.

| Requirement / check | Status | Evidence / boundary |
|---|---|---|
| Branch and remote baseline | PASS | Active branch `arena/54cb36c6-content-creator`; fast-forwarded to `5dd7c42`; zero ahead/behind at baseline. |
| `AGENTS.md` search | PASS | No file found in checkout or searched ancestors. |
| Node floor | PASS | Node `v22.22.3` available, meeting documented 22.18+ floor. |
| Root pnpm workspace | PARTIAL / TESTED | Root workspace pinned at `pnpm@10.34.9`, lockfile generated, legacy npm package remains excluded. Install succeeded; only the contracts package is currently in the workspace. |
| Privacy hook | PASS (filename-only) | `scripts/install-privacy-hook.sh` installed `.githooks`; hook does not inspect file contents. Manual staged diff review remains mandatory. |
| Initial time contract package | PASS (scoped) | `@content-studio/contracts`: 6/6 tests and TypeScript `tsc --noEmit`; strict half-open ranges, integer microseconds, rational FPS conversion and strict timecode parsing. |
| Existing story gate tests | PASS | `test_story_gate.py`: 16/16. |
| Existing script audit tests | PASS | `test-audit.py`: 7/7. |
| Renderer benchmark | NOT TESTED (comparative spike only) | Prior OpenFilm v7 full render and all-frame QA, plus v8 VO mux, are proven in session evidence. The three-engine synthetic comparison, seek/cancel/recovery matrix is still unrun. PATH absence was not capability evidence. |
| DB/auth/queue/storage | NOT TESTED | No service config or credentials; no integration was attempted. |
| Real user/media/provider behavior | NOT TESTED | Only public repo metadata and synthetic/local checks used. |
| Production deployment | NOT TESTED | No container runtime/domain/storage/auth configuration. |
| Editorial/video quality | NOT TESTED | No Content Studio render exists in this P0 pass. |

No claim of a working application, completed MVP, production readiness, final media, or publication approval is made.
