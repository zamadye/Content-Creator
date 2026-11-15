# Renderer benchmark — P0-03

Status: **BLOCKED / NOT TESTED** (2026-11-01 UTC). No renderer was selected.

## Candidates inspected

| Candidate | Evidence captured | Benchmark status |
|---|---|---|
| OpenFilm 0.3.2 | Existing project baseline in this repo; npm metadata reports MIT and upstream `openfilm/openfilm`. | Not installed in this environment; no FFmpeg, ffprobe, or Chrome executable is available on PATH. No render/seek/cancel evidence. |
| HyperFrames | `git ls-remote` reported `e426ce4eb44517db3f65105f1e05cb7b762cd950` for `main`; npm metadata reported package `hyperframes@0.9.52`, Apache-2.0. | Not cloned/installed; no browser/FFmpeg. No performance or operational evidence. |
| Remotion | `git ls-remote` reported `b0c3781e6acc736aeaf2102511068094032ea061` for `main`; requested legacy version `4.0.380` exists in the repo lockfile/package manifest. | Not installed; no browser/FFmpeg. No comparison evidence. |

Only these three renderer candidates were inspected; no collection of optional tools was cloned. Registry/Git metadata is not a benchmark and upstream `main` is not a dependency pin.

## Required spike — not run

The documented comparison requires one identical synthetic 30–60 second input with three scenes (component replacement, branching flow, scale comparison), both 16:9 and a 9:16 reflow, Indonesian VO/text, subtitles, pinned fonts, SVG and a seek-dependent transition. It requires one warm-up plus two measured full renders for each available candidate, and evidence for:

- frame count, cue timing, audio mapping and output decode;
- out-of-order seek determinism (`8 -> 2 -> 8`);
- preview/final parity, cancellation, missing assets, restart/retry;
- wall time, effective FPS, peak memory, cold/warm run and host/browser versions;
- license and fees for the exact selected release/features.

The sandbox currently lacks FFmpeg/ffprobe, Chrome/Chromium, Docker, and pnpm. Running a fake benchmark or extrapolating from source inspection would be misleading. Next: install only the minimum pinned prerequisites for the spike, create synthetic fixture, run the three candidates where feasible, record blocked candidates explicitly, then make ADR-0001. No adapter implementation is authorized by this report.
