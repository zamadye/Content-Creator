# EP02 — QC RESULTS (instance of templates/QC-CHECKLIST.md)

**Date:** 2026-11-06 · **Episode:** EP02_emas · **Build:** `EP02-emas-1080p24.mp4` (full render v2) + mux `EP02-emas-1080p24-AV.mp4`

## Animation / picture-lock

- [x] Movement purposeful; visual style consistent (navy #101A2B / amber #F2A900 / red #D94B40 risk-only / green positive-only)
- [x] 15,240 frames exact · 635.00 s · 1920×1080 · 24 fps · H.264 High yuv420p CRF 18 — scene windows match storyboard frame map (S01 0–719, S02 720–1799, S03 1800–2639, S04 2640–3839, S05 3840–5039, S06 5040–5999, S07 6000–7439, S08 7440–8519, S09 8520–9599, S10 9600–10679, S11 10680–11879, S12 11880–12959, S13 12960–14159, S14 14160–15239)
- [x] **QC loop found real defect:** full render v1 had source lines on only 6/14 scenes → fixed (8 scenes added, bottom-left per storyboard) → full re-render v2 → re-mux
- [x] Brand: RUANG MARGIN bug top-right + act tags (ACT 1–6 · PROMISE/TRUST/MARKETING/MECHANISM/DEFENSE/LESSON) consistent

## QC frames (burned frame numbers, vision-checked)

| Frame | Scene | Result |
|---|---|---|
| f1500 | S02 Demam Emas | PASS — ANTAM card Rp3.168.000/gram (29 Jan 2026), dunia US$5.589,38/ons, chips, source line, ILUSTRASI label, brand ✓ |
| f4200 | S05 40 Gram Umrah | PASS (post-fix) — kutipan media card, 444,5 g + Rp180 jt box, source bottom-left readable, ILUSTRASI ✓ |
| f6000 spot | S07 Pre-Order | PASS (v1 spot; layout/source/brand) |
| f9000 | S09 Empat Kunci Kepercayaan | PASS (post-fix) — 4-card grid, source "edukasi OJK — 7 ciri ponzi & 2L", ILUSTRASI ✓ |
| f11000 spot | S11 case B | PASS (v1 spot) |
| f14400 | S14 Insight & Out | PASS (post-fix) — closing thesis, investigator illustration, source F01–F22, ILUSTRASI ✓ |

- [x] All 14 scenes now carry a source line (ledger-traceable); generated images text-free (all text rendered by DOM)

## Audio (VO track `render/vo/vo_track_final.wav`)

- [x] Narration: native Indonesian (voice-00), exact Stage-04 script, 14/14 scenes rendered (`vo/S01–S14.mp3`)
- [x] Scene-anchored mix (`vo/MIX-PLAN.md`): starts S01 0, S02 30, S03 75 (atempo 1.92 after length QC), S04 110.45, S05 160, S06 210, S07 250, S08 310, S09 355, S10 400, S11 445, S12 495, S13 540, S14 590 — no overlaps; gaps ≥ 0.54 s; narration ends 618.24 s; track 635.00 s
- [x] Loudness: loudnorm I=−16 LUFS, TP=−1.5 dB → speech −19.3 dB mean / −1.5 dB max; gaps −91 dB
- [ ] Music balanced — **pending**: no music assets (VO-only delivery; music/SFX pass not yet produced)
- [ ] Sound effects support visual events — pending (same)

## Final video (post-mux)

- [x] Full render v2: `EP02-emas-1080p24.mp4` — 635.00 s, 15,240 frames, EXIT=0, 146.7 MB
- [x] Mux `vo_track_final.wav` → `EP02-emas-1080p24-AV.mp4` (AAC LC 192k, 635.01 s, 158.8 MB, +faststart)
- [x] Delivers title promise; claims mapped F01–F22; both cases framed dugaan/laporan/bantahan — belum ada putusan; RM denial on-screen; JC/KL/NN/AWK = klarifikasi with "promosi ≠ kelola dana"; composite "Sari" labeled ILUSTRASI
- [x] Export: MP4 · H.264 · 1920×1080 · 16:9 · 24 FPS · AAC 44.1 kHz stereo · YouTube-ready

## Publishing Package (10-publishing-package.md)

- [x] 3 title variations · 3 thumbnail concepts · `assets/THUMB_EP02_FINAL.png` 1280×720 (frame-based, headline "EMAS BODONG", navy+amber, vision-QC passed, no frame-text bleed)
- [x] Description + keywords + chapters · sources · pinned comment · 2 Shorts · community post

## Editorial Integrity

- [x] No invented figures/dates/quotes; ledger IDs F01–F22; allegations not presented as proven facts
- [x] Composite character always ILUSTRASI-labeled; public figures = clarification framing only
