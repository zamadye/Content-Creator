# EP01 — QC RESULTS (instance of templates/QC-CHECKLIST.md)

**Date:** 2026-11-05 · **Episode:** EP01_ponzi · **Build:** RUANG MARGIN rebrand render (`EP01-ruangmargin-1080p24.mp4`)

## Animation / picture-lock (from Stage 09 QC record)

- [x] Movement purposeful; visual style consistent (navy #101A2B / amber #F2A900 / red #D94B40 risk-only / green #5D9B78 positive-only)
- [x] Graphics readable; scene timeline frame-accurate vs storyboard (PSNR cross-check)
- [x] S14 outro overlap bug found → fixed → segment re-render → junction QC seamless
- [x] Rebrand QC: brand bug + outro show **RUANG MARGIN** (frame extract QC on rebrand render)
- [x] 16,440 frames exact · 11:25.00 · 1920×1080 · 24 fps · H.264 High yuv420p CRF 18

## Audio (VO track `render/vo/vo_track_final.wav`)

- [x] Narration clear: native Indonesian (voice-00), investigative tone, exact Stage-04 script text, 14/14 scenes
- [x] Scene-anchored cue cascade (MIX-PLAN.md): no overlaps; gaps ≥ 0.54 s; narration re-syncs to scene starts from S07; ends 679.98 s (5 s before video end)
- [x] Pacing: S01/S04 atempo 1.6 (hook/tension), S02/S03/S05 1.15–1.20, rest 1.00 — drift ≤ ~20 s mid-episode, absorbed by scene slack
- [x] Loudness: loudnorm I=-16 LUFS, TP=-1.5 dB → spot-check mean -18.7 dB, max -1.5 dB (no clipping); silence gaps -91 dB
- [ ] Music balanced — **pending**: no music assets generated (VO-only delivery; music/SFX pass not yet produced)
- [ ] Sound effects support visual events — pending (same)

## Final video (post-mux)

- [x] Rebrand render complete: `EP01-ruangmargin-1080p24.mp4` — 11:25.00, 16,440 frames, EXIT=0, 133.4 MB
- [x] QC frames (burned frame numbers): f00600 hook — brand bug **RUANG MARGIN** ✓; f16200 outro — end brand **RUANG MARGIN**, 2L/157 cards, no S14 overlap ✓; ActTag "ACT 6 · THE AFTERMATH" consistent with act-grouping pattern (S13+S14) ✓
- [x] Mux `vo_track_final.wav` → `EP01-ruangmargin-1080p24-AV.mp4` (AAC LC 192k, 11:25.02)
- [x] Post-mux A/V sync spot-checks: t=470 speech ✓ (S11 cue), t=640 speech ✓ (S14 cue), t=681–685 digital silence ✓ (narration ends 679.98)
- [x] Delivers title promise; claims mapped F01–F16; MeMiles = vonis bebas; VIR = OJK "indikasi"; Rani labeled composite
- [x] Export: MP4 · H.264 · 1920×1080 · 16:9 · 24 FPS · AAC 44.1 kHz stereo · YouTube-ready
- [ ] Upload copy CRF-22 < 100 MB → Drive review folder (encoding)

## Publishing Package (10-publishing-package.md)

- [x] 3 title variations · 3 thumbnail concepts · `THUMB_EP01_FINAL.png` 1280×720 (headline "MEREKA DIBAYAR.", navy+amber, mobile-readable)
- [x] Description + keywords + chapters · sources · pinned comment · 2 Shorts · community post
- [x] Shorts self-contained scripts (9:16, 30–60 s)

## Editorial Integrity

- [x] No invented figures/dates/quotes; ledger IDs F01–F16; allegations framed (VIR indikasi, First Travel verdict from PN Depok/MA)
- [x] Generated images text-free; on-screen text added in editing/render DOM
