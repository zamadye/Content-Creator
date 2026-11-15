# Renderer benchmark — P0-03

Status: **NOT TESTED (comparative spike not run)**, updated 2026-11-01 UTC. OpenFilm has proven full-render evidence in prior work; no renderer is yet selected for the new Content Studio because the required apples-to-apples comparative spike has not been run. This is not blocked by `command -v` failing to find global binaries.

## Candidates inspected

| Candidate | Evidence captured | Benchmark status |
|---|---|---|
| OpenFilm 0.3.2 | Existing project baseline; npm metadata reports MIT and upstream `openfilm/openfilm`. The repo has local Chrome/tool-bin setup scripts and declares an FFmpeg installer. Earlier OpenFilm previews v7/v8 rendered here; v7 passed full-frame look QA. | Prior render capability is proven. The specified synthetic comparison, random-seek determinism, cancellation, recovery, and two-run timing are still not measured for Content Studio. |
| HyperFrames | `git ls-remote` reported `e426ce4eb44517db3f65105f1e05cb7b762cd950` for `main`; npm metadata reported package `hyperframes@0.9.52`, Apache-2.0. | Not installed; benchmark/operational evidence not collected. Toolchain availability is not inferred from PATH. |
| Remotion | `git ls-remote` reported `b0c3781e6acc736aeaf2102511068094032ea061` for `main`; requested legacy version `4.0.380` exists in the repo lockfile/package manifest. | Not installed for the spike; benchmark comparison not collected. Toolchain availability is not inferred from PATH. |

Only these three renderer candidates were inspected; no collection of optional tools was cloned. Registry/Git metadata is not a benchmark and upstream `main` is not a dependency pin.

## Required spike — not run

The documented comparison requires one identical synthetic 30–60 second input with three scenes (component replacement, branching flow, scale comparison), both 16:9 and a 9:16 reflow, Indonesian VO/text, subtitles, pinned fonts, SVG and a seek-dependent transition. It requires one warm-up plus two measured full renders for each available candidate, and evidence for:

- frame count, cue timing, audio mapping and output decode;
- out-of-order seek determinism (`8 -> 2 -> 8`);
- preview/final parity, cancellation, missing assets, restart/retry;
- wall time, effective FPS, peak memory, cold/warm run and host/browser versions;
- license and fees for the exact selected release/features.

The comparative spike was not run during P0. A prior PATH-only probe was mistakenly treated as proof of absent rendering capability; that conclusion is retracted. The repo has a configured Chrome/OpenFilm launcher and FFmpeg installation paths, and prior successful full renders demonstrate that a toolchain can be provisioned here. Next: reuse those established provisioning paths, create the synthetic fixture, run the three candidates where feasible, and record any candidate-specific failure only after an actual attempt. Then make ADR-0001. No fake score or extrapolation from source inspection.
