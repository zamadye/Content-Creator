# Renderer benchmark — P0-03

Status: **PARTIAL — three candidates rendered synthetic fixtures; no renderer selected.** Updated 2026-11-01 UTC. Evidence below is from this constrained sandbox, not a general performance claim or a production acceptance run. A prior `PATH` probe is not a capability test and is not a blocker claim.

## Environment and fixture

Linux x86_64, Node 22.22.3, 2 logical CPUs / approximately 3.85 GiB RAM at baseline, software Chromium 153.0.8010.0 (SwiftShader), FFmpeg n9.0.2, one render worker, 10 fps. The synthetic 30-second fixture covers component replacement, branching flow, and scale comparison. Three Indonesian eSpeak-NG voice clips and WebVTT cues span 0–9.8s, 10–19.8s, and 20–29.8s. Scene functions are deterministic; landscape is 1920×1080 and portrait 1080×1920. Fonts are system Arial and **not pinned**, so visual typography is not reproducible across hosts. Test outputs and fixture are ignored under `.scratch/renderer-spike/`; no media is committed.

These are useful smoke measurements but not perfectly apples-to-apples: renderer versions/options, fixture adaptation, browser/runtime details, and render implementations differ. Reported duration/frame count agree at 30 seconds/300 frames (Remotion container duration reports 30.058667s). Timings are wall-clock observations on this shared host, not statistically meaningful benchmarks. Peak RSS was not recorded.

## Candidate results

| Candidate | Version / configuration | Runs (warm-up; measured 1; measured 2) | Output and checks | Assessment |
|---|---|---|---|---|
| OpenFilm | 0.3.2; one worker; 10 fps; Playwright Chromium 153; FFmpeg n9.0.2 | Landscape: ~41s; ~40s; ~40s wall. Portrait: ~40s; ~40s; ~40s wall. Renderer log measured 40.4/39.8/39.4s landscape and 39.2/39.9/39.2s portrait. | Both orientations: H.264, 300 frames, AAC 48 kHz stereo, 30.000s; full FFmpeg decode; `openfilm look --full` watched every frame and passed no-white-flash/jump/still/black heuristic. `openfilm look` deterministic shuffled-order draw check passed (12 frames). Landscape captions visible in render contact sheet and at 2s. Portrait captions are visible but grossly oversized/overlap scene content; caption layout is not acceptable/parity-safe. | Render capability PASS; visual/caption acceptance PARTIAL/FAIL for portrait. No selection. |
| HyperFrames | 0.9.52; `--workers 1 --low-memory-mode`; 10 fps | Landscape measured 1/2: 30.2/29.8s wall. Portrait warm-up/measured 1/2: 28.4/28.6/30.9s wall. | Both: H.264, 300 frames, AAC, 30.000s; frame contact sheet visually shows captions. Full-frame decode/visual checks passed. | Synthetic render PASS. Font pinning, resource and operational checks remain. |
| Remotion | 4.0.380; concurrency 1; 10 fps | Landscape measured 1/2: 32/33s. Portrait warm-up/measured 1/2: 30/30/31s. | Both: H.264, 300 frames, AAC; 1920×1080 or 1080×1920; container duration 30.058667s. Contact sheets show timed Indonesian captions and changing scene graphics. | Synthetic render PASS. Full duration difference is noted, not interpreted as proof of extra visual frames. Font pinning, resource and operational checks remain. |

A separate HyperFrames 30 fps landscape smoke render took 77.8s (renderer-reported) and produced a valid 30-second 1920×1080 MP4; it is not part of the 10 fps comparison.

## Visual parity and determinism evidence

- At 10 fps, the three fixtures contain the same three concepts, narration/cue text and scene durations, but are separately adapted to renderer APIs. They are not pixel-identical implementations; scene motion, typography, subtitle styling/placement, and some frame content differ. The contact sheets at `.scratch/renderer-spike/landscape/.film/cache/look/` and portrait counterpart are temporary local evidence, not checked-in assets.
- OpenFilm was initially suspected of dropping captions. Investigation showed its project contact sheet and a direct `look 2` frame include the Indonesian cue; the earlier omission was not reproducible after refreshing the fixture. Refreshed full render contact sheets show landscape captions. Portrait captions are far too large and collide with artwork. Root cause is responsive caption sizing/style, not proven to be track stacking. Do not count captions as acceptable in both aspect ratios.
- HyperFrames seek-order test at 8s → 2s → 8s produced identical first-frame MD5s for the repeated 8s captures: `da03df80ee65c82c623f1c3b70aee7f9`.
- Remotion still-frame sequence 80 → 20 → 80 produced identical SHA-256s for the repeated frame 80: `fc509a6b499daf9d6cd49c34769a4b5f45747cf85eb32eb9838181a73e766c07`.
- OpenFilm's `look` shuffled-order test verifies 12 frames drawn twice in two orders, with same-time/same-picture result. An equivalent explicit 8 → 2 → 8 pixel hash test has not been completed for OpenFilm.
- Full-frame OpenFilm checks passed both orientations; full decode and visual checks also passed on the earlier HyperFrames and Remotion measured outputs. These heuristics do not establish editorial quality, audio sync, or absence of every visual defect.

## Provisioning and license notes

OpenFilm 0.3.2 was provisioned from npm. Standard Playwright browser download failed to `cdn.playwright.dev`; following the user's direction, the bundled `@sparticuz/chromium` `chromium.br` and `al2023.tar.br` were manually inflated, `/tmp/al2023/lib` exposed through `LD_LIBRARY_PATH`, and Chromium linked into Playwright's expected cache path. Chromium launched successfully. `scripts/provision-openfilm-sparticuz.sh` automates this route and supplies FFmpeg from the `imageio-ffmpeg` wheel because the older `@ffmpeg-installer` binary did not support OpenFilm's required `adelay=...:all=1` filter. HyperFrames and Remotion were provisioned in temporary ignored scratch runtime directories. This is local capability evidence, not an install/runbook guarantee for a clean machine.

Exact transitive license inventory and legal/usage review for all three renderer/browser/codec dependency trees remain incomplete; do not infer permission or suitability from a package's top-level license alone. See P0-05 work still required.

## Gaps before renderer decision

- Fix and verify OpenFilm portrait subtitle sizing/safe-area and check cue boundaries against actual audio; pin fonts across candidates.
- Run equivalent explicit cue-boundary and seek-repeat image comparisons for all candidates; define preview/final parity contract.
- Repeat under matched fixture/API, settings, browser and codec where possible; capture peak RSS and CPU/disk conditions.
- Test cancellation, missing assets, process failure, restart/retry, output validation and resource limits for candidates.
- Complete exact dependency license/usage inventory and compare deployment compatibility.
- Capture and retain only privacy-safe evidence. No user media or credentials are involved in the synthetic fixture.

**Decision: no renderer selected.** P0-03 supplies successful synthetic render evidence for three candidates, but portrait visual correctness and operational gates are incomplete. OpenFilm currently has a demonstrated portrait caption defect; this alone prevents treating its outputs as parity-complete. No adapter or production renderer should be built on the assumption that this benchmark selects one.
