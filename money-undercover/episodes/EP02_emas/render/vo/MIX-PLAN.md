# EP02 VO MIX PLAN (voice-00, id-ID) — EXECUTED

Clips: `vo/S01.mp3` … `S14.mp3` (14/14) → `vo_track_final.wav` (635.00s, loudnorm −16 LUFS / TP −1.5)

## Windows (theme.ts): 635s total = 15.240 frames

S01 0–30 | S02 30–75 | S03 75–110 | S04 110–160 | S05 160–210 | S06 210–250 |
S07 250–310 | S08 310–355 | S09 355–400 | S10 400–445 | S11 445–495 |
S12 495–540 | S13 540–590 | S14 590–635

## Executed cascade (scene-anchored)

| Clip | Raw | atempo | Final | Start | End | Gap |
|---|---|---|---|---|---|---|
| S01 | 22.52 | 1.00 | 22.48 | 0 | 22.48 | 0 |
| S02 | 34.59 | 1.00 | 34.54 | 30 | 64.54 | 7.52 |
| S03 | **67.11** | **1.92** | 34.91 | 75 | 109.91 | 10.46 |
| S04 | 37.88 | 1.00 | 37.84 | 110.45 | 148.29 | 0.54 |
| S05 | 39.63 | 1.00 | 39.58 | 160 | 199.58 | 11.71 |
| S06 | 33.52 | 1.00 | 33.47 | 210 | 243.47 | 10.42 |
| S07 | 55.22 | 1.00 | 55.19 | 250 | 305.19 | 6.53 |
| S08 | 27.48 | 1.00 | 27.43 | 310 | 337.43 | 4.81 |
| S09 | 31.84 | 1.00 | 31.81 | 355 | 386.81 | 17.57 |
| S10 | 30.20 | 1.00 | 30.16 | 400 | 430.16 | 13.19 |
| S11 | 46.08 | 1.00 | 46.03 | 445 | 491.03 | 14.84 |
| S12 | 40.31 | 1.00 | 40.26 | 495 | 535.26 | 3.97 |
| S13 | 27.92 | 1.00 | 27.89 | 540 | 567.89 | 4.74 |
| S14 | 28.26 | 1.00 | 28.24 | 590 | 618.24 | 22.11 |

**Notes:**
- S03 anomaly: TTS delivered 67.11s (≈53 wpm) — no silence padding, genuinely slow pacing. atempo 1.92 normalizes to ≈105 wpm (natural). Verified no gap ≥1s in raw file; post-fit ends 109.91 (window 110) ✓
- No overlaps; all gaps ≥0.54s; narration ends **618.24s** (16.76s before 635 end-card hold)
- QC: speech mean −19.3 dB / max −1.5 dB; gaps −91 dB
- Mux: `ffmpeg -i EP02-emas-1080p24.mp4 -i vo_track_final.wav -c:v copy -c:a aac -b:a 192k -movflags +faststart`
