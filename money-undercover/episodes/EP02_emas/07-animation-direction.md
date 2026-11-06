# STAGE 07 — ANIMATION DIRECTION (EP02)

**Pipeline:** identik EP01 — Remotion 4.0.540 + Chromium @sparticuz, 1920×1080 24fps, `EP02` composition, scene windows = storyboard (635s = 15.240 frames).

## Prinsip (brand bible)

1. **Discovery** (S01–S03): push-in lambat, parallax 2.5D, reveal bertahap — penonton diajak melihat.
2. **Explanation** (S04, S08, S10): sequential build — satu gagasan per baris/panah; jangan tampilkan semua sekaligus.
3. **Conflict** (S05, S07, S09): pacing lebih cepat (kartu masuk 8–10 frame), garis merah HANYA untuk risiko/kerugian.
4. **Reveal** (S11–S12): kontrol — checklist & stempel dengan bobot; merah tidak untuk status hukum netral (pakai slate/amber).
5. **Aftermath** (S13): gerak minimal; parallax lambat; hening di beat duka.
6. **Out** (S14): hold lama (≥30 frame) — jangan terburu-buru.

## Aturan teknis

- Transisi: fade 12 frame + cut tegas antar act; TANPA zoom/strobe/twerk.
- Camera shake: maksimum 1× per episode (di S08 saat "mesin" lock) — alasan jelas.
- Angka [editing]: count-up 40–60 frame, easeOut; digit size stabil (tabular).
- Stempel: overshoot 1 frame + settle; tidak memantul.
- Warna: amber = emas/janji; bone = fakta/kertas; red = kerugian/risk ONLY; green = pemulihan ONLY; slate = netral/status.
- Ilustrasi bergerak via layer split (parallax) — aset statis jangan di-stretch.
- Semua huruf via font Open Sans (Bold/Regular) konsisten EP01.

## Structure (theme.ts)

```ts
SCENES = [S01:30, S02:45, S03:35, S04:50, S05:50, S06:40,
          S07:60, S08:45, S09:45, S10:45, S11:50, S12:45, S13:50, S14:45] // detik
EPISODE_DURATION_IN_FRAMES = 15240 // 635s @24fps
```

Act tags: ACT 1 THE PROMISE (S01–03) · ACT 2 THE TRUST (S04–06) · ACT 3 THE MARKETING (S07) · ACT 4 THE MECHANISM (S08–10) · ACT 5 THE DEFENSE (S11–12) · ACT 6 THE LESSON (S13–14).

## Audio pasca-render

VO cue cascade (seperti EP01 MIX-PLAN): scene-anchored, gap ≥0,5s, atempo hanya bila >1.15× diperlukan; loudnorm −16 LUFS/TP −1.5; mux AAC 192k.
