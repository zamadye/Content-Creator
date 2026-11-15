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
| pnpm | Not on PATH at baseline. | Corepack was available and provisioned the workspace-pinned pnpm version; the separate root workspace now installs from its lockfile. |
| Corepack | `0.34.6` | Can provision a pinned pnpm after package-manager decision. |
| Python | `3.11.2` | Existing Python editorial tests run. |
| FFmpeg / ffprobe | `command -v` did not find system binaries on PATH during the baseline check. | PATH lookup is not a capability test: `editorial-engine/package.json` declares `@ffmpeg-installer/ffmpeg`; renderer scripts support a configured tool-bin path. Do not treat this observation as a render blocker. |
| Chrome / Chromium | `command -v` did not find a browser executable on PATH during the baseline check. | PATH lookup is not a capability test: `scripts/openfilm-local-chrome.mjs` selects a configured system Chrome; prior session renders used a provisioned headless Chromium toolchain. Do not treat this observation as a render blocker. |
| Docker | Not installed | PostgreSQL/Redis Compose integration cannot run here. |
| CPU / memory | 2 logical CPUs / ~3.85 GiB | Resource-constrained; record concurrency for future benchmark. |
| Disk | ~20 GiB free at check | Adequate for a small fixture, not proof of production capacity. |
| Root product workspace | None at baseline; only `editorial-engine/package.json` and npm lockfile. | Preserve legacy npm workspace; a separate root pnpm workspace has since been bootstrapped. |
| Existing repo CI / hooks | Local privacy hook installed during this task; `.githooks` checks filenames, not contents | Review staged diffs manually; do not bypass hook. |

No `AGENTS.md` was found in the checkout or its parent search. The legacy project has React/Remotion dependencies declared but `editorial-engine/node_modules` is absent. These facts describe this sandbox, not the user's desktop or deployment host.

## Implementation delta after baseline

A separate root pnpm workspace was added and pinned to `pnpm@10.34.9`; `editorial-engine/` remains excluded. The first contracts package installed reproducibly from its lockfile. This does not change the capability gaps above (browser, FFmpeg, Docker, auth, DB, storage).

## Baseline checks actually run

- `python3 editorial-engine/pipeline/story-engine/test_story_gate.py`: **16 passed**.
- `python3 editorial-engine/pipeline/script-review/test-audit.py`: **7 passed**.
- `node --check scripts/openfilm-local-chrome.mjs`: passed.
- `git status`, branch/remotes, lockfiles, hook scripts, and ignore policy inspected.

These are legacy/story-gate tests, not Content Studio tests. They do not establish a new renderer benchmark.

## Existing render capability evidence

This baseline check incorrectly inferred render inability from system `PATH` lookup. In this same production history, OpenFilm v7 rendered 1,500 frames at 1080×1920/30 fps and `openfilm look --full` reported all frames watched without white flash, jumping frame, still picture, or black. The v8 VO revision was also rendered and muxed with a provisioned FFmpeg binary; the audio was 45.408 seconds and the MP4 50 seconds. The repo's existing scripts configure OpenFilm, local Chrome, tool-bin overrides, and package-provided FFmpeg. These are direct counterexamples to the earlier blanket inference.

The evidence does **not** substitute for the new three-engine comparative spike or prove every future machine has the same binaries. It proves the sandbox can provision a toolchain and has successfully produced full MP4 renders; P0-03 is `NOT TESTED` for comparative benchmarking, not blocked by a missing PATH entry.

## Decisions deferred

Renderer performance/correctness, database migration, auth implementation, storage provider, browser isolation, and private deployment are **NOT TESTED**. Do not claim a working Content Studio or production readiness from this baseline.
