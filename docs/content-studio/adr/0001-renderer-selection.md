# ADR-0001: Renderer selection for Content Studio

- **Status:** Proposed; selection deferred.
- **Date:** 2026-11-01 UTC.
- **Decision owners:** repository owner.
- **Related:** `docs/content-studio/01-ARCHITECTURE.md`, `04-INTEGRATIONS.md`, `05-PHASES-AND-ACCEPTANCE.md`.

## Context

The product needs deterministic seekable preview and full render, audio/sample alignment, cancellation, recovery, private worker operation, and shared preview/final evaluation. OpenFilm is the existing local baseline; HyperFrames and Remotion are candidates. Choosing by familiarity, repository popularity, source inspection, or one screenshot is insufficient.

## Decision

**No production renderer is selected yet.** Implementations that bind app/domain code to a renderer are deferred until the P0 synthetic spike passes. Use a renderer-neutral interface as specified in the architecture. Do not install or maintain three complete renderers.

## Evidence

- Sandbox baseline: Node 22.22.3/Corepack 0.34.6. Global `PATH` lookup did not find FFmpeg/ffprobe or Chrome/Chromium, but that was not evidence the tools could not be provisioned.
- Prior OpenFilm v7 rendered 1,500 frames and passed full-frame OpenFilm look QA; v8 was rendered and VO-muxed with a provisioned FFmpeg binary. Existing wrappers also support configured Chrome and tool-bin paths.
- OpenFilm 0.3.2, HyperFrames 0.9.52, and Remotion 4.0.380 are candidates; the new synthetic comparative benchmark, exact legal/runtime review and seek/cancel/recovery tests remain outstanding.
- See `docs/content-studio/reports/renderer-benchmark.md` and `reports/environment-baseline.md`.

## Selection gate

Run the documented identical synthetic fixture, including both aspect ratios, Indonesian VO/subtitles, SVG/fonts, seek order, warm-up plus two measured renders per candidate, and operational failure tests. Compare correctness and operability first, then maintainability, fidelity, runtime, resources, licensing and cost. If a candidate is blocked, report `NOT TESTED`; do not assign it a fabricated score.

## Consequences

- P0 remains open; no renderer adapter or runtime engine lockfile is authorized by this ADR.
- Contracts, deterministic timeline math and non-renderer domain tests may proceed if they do not bake in engine-specific behavior.
- Revisit this ADR with benchmark evidence and an exact release/version before P3.
