# EP01 VO MIX PLAN (voice-00, id-ID)

Clips: `vo/S01.mp3` … `vo/S14.mp3` (S01–S10 generated; S11–S14 pending turn cap).

## Video scene windows (theme.ts SCENES, ground truth)
S01 0–30 | S02 30–70 | S03 70–105 | S04 105–135 | S05 135–180 | S06 180–240 |
S07 240–290 | S08 290–360 | S09 360–410 | S10 410–470 | S11 470–505 |
S12 505–585 | S13 585–640 | S14 640–685 (video ends 685.00s / 16440f)

## Measured VO durations (raw)
S01 75.36 | S02 42.00 | S03 40.99 | S04 47.78 | S05 47.80 | S06 47.07 |
S07 41.56 | S08 53.37 | S09 45.56 | S10 56.45 | S11–S14 TBD

## Cascade cue plan (start = max(scene_start, prev_end + 0.5s))
| Clip | atempo | target dur | start | end |
|---|---|---|---|---|
| S01 | 1.60 | 47.1 | 0.0 | 47.1 |
| S02 | 1.05 | 40.0 | 47.6 | 87.6 |
| S03 | 1.15 | 35.6 | 88.1 | 123.7 |
| S04 | 1.60 | 29.9 | 124.2 | 154.1 |
| S05 | 1.06 | 45.1 | 154.6 | 199.7 |
| S06 | 1.00 | 47.1 | 200.2 | 247.3 |
| S07 | 1.00 | 41.6 | 247.8 | 289.4 |
| S08 | 1.00 | 53.4 | max(290,289.9)=290 | 343.4 |
| S09 | 1.00 | 45.6 | max(360,343.9)=360 | 405.6 |
| S10 | 1.00 | 56.5 | max(410,406.1)=410 | 466.5 |
| S11 | 1.00 | ~45 est | 470 | ~515 |
| S12 | 1.00 | ~64 est | ~515.5 | ~579.5 |
| S13 | 1.00 | ~40 est | 585 | ~625 |
| S14 | 1.00 | ~46 est | 640 | ~686 ≈ video end ✓ |

Notes:
- S01/S04 atempo 1.6 = punchy urgency (hook + tension scenes); acceptable for narration.
- S01 tail bridges into S02 visuals; S02–S05 narration lags scene start by ≤15s (absorbed naturally).
- From S08 on, narration re-syncs to scene starts exactly; S14 ends ≈685s.
- Inter-clip gap 0.5s. After concat: loudnorm for VO bed (-16 LUFS target mix later with music/SFX).
- Post-atempo QC: re-measure durations; if S11–S14 actuals differ >±8s from estimates, adjust S13/S14 atempo (≤1.2) to land S14 end at 685.

## Mux (after video re-render done)
```
ffmpeg -i EP01-ruangmargin-1080p24.mp4 -i vo_track.m4a -c:v copy -c:a aac -b:a 192k -shortest out.mp4
```
Video re-render running: process ep01-ruang-margin-re-render → out/EP01-ruangmargin-1080p24.mp4
