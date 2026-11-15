# Environment baseline — P0-01/P0-02

Date checked: 2026-11-01 (UTC)
Branch: `arena/54cb36c6-content-creator`
HEAD at baseline: `5dd7c42` (`build framework`)
Source: direct local commands in the Git sandbox; no private media inspected.

## Runtime and host

| Capability | Observed | Consequence |
|---|---|---|
| OS/kernel | Linux x86_64, kernel `6.1.158+` | Linux-only evidence; deployment targets remain untested. |
| Node.js | `v22.22.3` | Meets the documented Node 22.18+ floor. |
| npm | `10.9.8` | Available for the legacy `editorial-engine` only. |
| pnpm | Not installed | Root workspace cannot yet be installed reproducibly. |
| Corepack | `0.34.6` | Can provision a pinned pnpm after package-manager decision. |
| Python | `3.11.2` | Existing Python editorial tests run. |
| FFmpeg / ffprobe | Not on PATH | No local MP4 render/decode benchmark from this host as-is. |
| Chrome / Chromium | No executable on PATH | No local OpenFilm/Remotion browser render as-is. |
| Docker | Not installed | PostgreSQL/Redis Compose integration cannot run here. |
| CPU / memory | 2 logical CPUs / ~3.85 GiB | Resource-constrained; record concurrency for future benchmark. |
| Disk | ~20 GiB free at check | Adequate for a small fixture, not proof of production capacity. |
| Root product workspace | None; only `editorial-engine/package.json` and npm lockfile | Preserve legacy npm workspace; create separate root pnpm workspace only after P0 decisions. |
| Existing repo CI / hooks | Local privacy hook installed during this task; `.githooks` checks filenames, not contents | Review staged diffs manually; do not bypass hook. |

No `AGENTS.md` was found in the checkout or its parent search. The legacy project has React/Remotion dependencies declared but `editorial-engine/node_modules` is absent. These facts describe this sandbox, not the user's desktop or deployment host.

## Baseline checks actually run

- `python3 editorial-engine/pipeline/story-engine/test_story_gate.py`: **16 passed**.
- `python3 editorial-engine/pipeline/script-review/test-audit.py`: **7 passed**.
- `node --check scripts/openfilm-local-chrome.mjs`: passed.
- `git status`, branch/remotes, lockfiles, hook scripts, and ignore policy inspected.

These are legacy/story-gate tests, not Content Studio tests and not renderer evidence.

## Decisions deferred

Renderer performance/correctness, database migration, auth implementation, storage provider, browser isolation, and private deployment are **NOT TESTED**. Do not claim a working Content Studio or production readiness from this baseline.
