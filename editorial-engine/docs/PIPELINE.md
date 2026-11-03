# PIPELINE — cara kerja Editorial Content Production Engine

Semua langkah deterministik: masukan yang sama → byte yang sama.
Satu perintah: `bash pipeline/build-all.sh`.

```
content/scripts/*.json       naskah + subtitle yang ditulis manusia
content/storyboards/*.json   storyboard: tujuan naratif, durasi target, VO, SFX
audio/voiceovers/*.mp3       narasi, satu berkas per segmen
        │
        ├── measure-voiceover.ts   durasi + kenyaringan tiap baris  → manifest.json
        ├── build-timeline.ts      durasi nyata + storyboard        → timeline.json
        │                                                          → timeline.generated.ts
        │                                                          → audio-cues.json
        ├── build-subtitles.ts     timeline                         → .srt / .vtt
        ├── synth_score.py         panjang film                     → bed.wav + sfx_*.wav
        ├── mix-audio.ts           VO + skor + SFX                  → master.wav (-14 LUFS)
        ├── render-frames.ts       frame N                          → f00000.png
        ├── encode.ts              frame + master                   → MP4
        ├── render-poster.ts       komposisi poster                 → PNG 1080×1350
        └── qa.ts                  semua artefak                    → qa/QA-TECHNICAL.md
```

## Prinsip yang tidak dilanggar

1. **Durasi scene berasal dari suara yang benar-benar direkam**, bukan perkiraan. Jika satu
   baris direkam ulang, `build-timeline.ts` menggeser scene lain otomatis.
2. **Subtitle dipotong menurut makna, ditulis manusia.** `pipeline/qa.ts` menolak baris
   > 42 karakter, > 2 baris, atau cue yang bertumpang-tindih.
3. **Tidak ada angka tanpa atribusi** di layar: `SourceTag` wajib pada setiap scene berangka.
4. **Tidak ada gerak dekoratif.** Setiap animasi berasal dari `animations/index.ts` dan
   punya alasan naratif (push-in saat angka masuk, stempel jatuh saat respons berulang).
5. **Tidak ada timeline kedua.** Anime.js tidak dipakai; semua gerak adalah fungsi frame.

## Backend render

Chromium tidak tersedia di lingkungan ini, jadi:

```
React element --renderToStaticMarkup--> SVG string --resvg--> PNG
```

Komponennya tetap komponen Remotion (`useCurrentFrame`, `interpolate`, `spring`,
`Sequence`, `AbsoluteFill`) yang disediakan `remotion/src/runtime/index.tsx`.
Jika Chromium ada, `remotion render` memakai scene yang sama apa adanya.

## Menambah scene baru

1. Tulis `remotion/src/scenes/sNN_nama.tsx` dengan prop `{ d: number }` (durasi frame).
2. Daftarkan di `remotion/src/scenes/index.tsx`.
3. Tambahkan entri storyboard (`durationTargetSec`, `vo`, `narrativePurpose`).
4. `npx tsx pipeline/build-timeline.ts && npx tsx pipeline/render-still.ts sNN:0.5`

## Memeriksa satu momen

```bash
npx tsx pipeline/render-still.ts s04:0.6      # 60% dari scene s04
npx tsx pipeline/render-still.ts s07:170      # frame lokal ke-170
npx tsx pipeline/render-still.ts poster
```

## Mengganti suara (mis. ke CosyVoice)

Letakkan berkas baru di `audio/voiceovers/` dengan awalan `vo01…vo07`, lalu:

```bash
npx tsx pipeline/measure-voiceover.ts && npx tsx pipeline/build-timeline.ts \
  && npx tsx pipeline/build-subtitles.ts && npx tsx pipeline/mix-audio.ts
```

Timing, subtitle, dan skor menyesuaikan sendiri.
