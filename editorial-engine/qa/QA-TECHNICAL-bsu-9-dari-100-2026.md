# Technical QA — bsu-9-dari-100-2026

Generated: 2026-11-04T04:43:43.072Z

| Gate | ID | Check | Status | Detail |
| --- | --- | --- | --- | --- |
| GATE 5 | T1 | resolution 1080x1920 | **PASS** | 1080x1920 |
| GATE 5 | T2 | codec / pixel format | **PASS** | h264 yuv420p |
| GATE 5 | T3 | frame rate 30 fps | **PASS** | 30 fps |
| GATE 5 | T4 | duration inside 45-90 s | **PASS** | 88.00 s |
| GATE 5 | T5 | audio stream present | **PASS** | aac 48000 Hz stereo |
| GATE 5 | T6 | integrated loudness -16..-12 LUFS | **PASS** | -13.8 LUFS |
| GATE 5 | T7 | true peak <= -1.0 dBTP | **PASS** | -3.5 dBTP |
| GATE 5 | S1 | cues parse | **PASS** | 22 cues |
| GATE 5 | S2 | max 2 lines per cue | **PASS** | 2 lines |
| GATE 5 | S3 | max 42 chars per line | **PASS** | 24 chars (limit 42) |
| GATE 5 | S4 | no overlapping cues | **PASS** | 0 overlaps |
| GATE 5 | S5 | minimum 1.0 s on screen | **PASS** | 0 cues shorter |
| GATE 5 | F1 | all frames rendered | **PASS** | 2650/2650 |
| GATE 7 | TH1 | thumbnail 1080x1920 | **PASS** | 1080x1920 |
| GATE 7 | TH2 | thumbnail size > 200 kB | **PASS** | 3399 kB |
| GATE 7 | CP1 | caption 4 platform | **PASS** | 4/4 · 10 kB |
| GATE 7 | CP2 | caption memuat sumber & batas kejujuran | **PASS** | Kompas.com |
| GATE 5 | P1 | poster 1080x1350 | **PASS** | 1080x1350 |
| GATE 6 | A1 | max two font families | **PASS** | Permanent Marker, Archivo |
| GATE 6 | A2 | font files are local (offline build) | **PASS** | 5 ttf |
