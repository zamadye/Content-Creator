# STAGE 09 — VIDEO ASSEMBLY STATUS

**Episode ID:** EP02 · **Status:** ✅ FINAL RENDER + MUX COMPLETE — picture-lock QC passed (v2 after source-line fix)  
**Date:** 2026-11-06

---

## Deliverable

**`render/out/EP02-emas-1080p24-AV.mp4`** — full render v2 + VO mux

| Spec | Value |
|---|---|
| Duration | 635.00 s video / 635.01 s A+V (10:35 — target 10:35) |
| Frames | 15,240 @ 24 fps (exact) |
| Resolution | 1920×1080, 16:9 |
| Codec | H.264 High, CRF 18 master / CRF 22 upload copy |
| Audio | VO `vo/vo_track_final.wav` → AAC LC 192k, loudnorm −16 LUFS / TP −1.5 dB, voice-00, 14-scene cue cascade (MIX-PLAN.md) |
| QC | see `QC-RESULTS.md` (6 vision-checked frames + editorial checklist ✓) |

## Build history

1. Full render v1 → QC found source lines missing on 8/14 scenes → **not shipped**
2. Fix: 8 source lines added (bottom-left, storyboard position) → full render v2 → mux
3. QC frames f1500 / f4200 / f9000 / f14400 (+ v1 spots S07/S11) all PASS

## Toolchain (all verified working in this environment)

| Tool | Source | Proof |
|---|---|---|
| **ffmpeg** | npm `@ffmpeg-installer/ffmpeg` (static, in render/node_modules) | mux, QC extraction, thumbnail, CRF-22 |
| **Chromium (headless)** | npm `@sparticuz/chromium` v153 → `/tmp/chromium` | Remotion browser; full 15,240-frame render (re-extracted via node `zlib.brotliDecompressSync` + tar this session) |
| **Remotion 4.0.540** | npm (`npm ci` in render/) | test render, spot renders, full render v1+v2, stills |

**Render command:**
```bash
cd money-undercover/episodes/EP02_emas/render
FONTCONFIG_PATH=/tmp/fonts LD_LIBRARY_PATH=/tmp/al2023/lib \
  npx remotion render src/index.ts EP02 out/EP02-emas-1080p24.mp4
```

**Mux command:**
```bash
node_modules/@ffmpeg-installer/linux-x64/ffmpeg -y -vsync 0 \
  -i out/EP02-emas-1080p24.mp4 -i vo/vo_track_final.wav \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart out/EP02-emas-1080p24-AV.mp4
```

## Known limitations

- Music/SFX pass not produced (VO-only, same as EP01)
- Upload copy (CRF 22) produced for Drive review — master stays CRF 18 local
