# Content Production — Editorial Engine

Mesin produksi konten editorial berbahasa Indonesia: satu topik → satu poster, satu video
vertikal, dan satu laporan teknis, semuanya dibangun ulang dari kode.

```
editorial-engine/          proyek: kode, naskah, aset, pipeline, deliverable
EDITORIAL-FONDATION.md     doktrin editorial (suara, batas, integritas)
VISUAL-STORYTELLING.md     arah visual & standar komposisi
ANIMATION&MOTION.md        aturan gerak (tujuan > dekorasi)
HOOK ENGINEERING.md        struktur pembuka
EMOTIONAL-PACING.md        tempo & jeda
MEMORABLE-ENDING.md        cara menutup
NARRATIVE-TENSION-&-AUDIENCE-RETENTION.md
NATURAL-INDONESIAN-WRITING-HUMAN-VOICE.md
AUDIO PRODUCTION.md
IMAGE-GENERATION.md
```

## Misi pertama (selesai)

Topik: **Program Makan Bergizi Gratis (MBG) dan keracunan massal**.
Tesis: *bukan nasinya yang salah — cara kita mengukur berhasil yang salah.*

| Deliverable | Berkas |
| --- | --- |
| A — ilustrasi editorial 1080×1350 | `editorial-engine/deliverables/A_mbg-gizi-anak_1080x1350.png` |
| B — video 1080×1920, 88,67 s | `editorial-engine/deliverables/B_mbg-gizi-anak_1080x1920.mp4` |
| C — subtitle | `editorial-engine/deliverables/C_mbg-gizi-anak.srt` / `.vtt` |
| Laporan teknis | `editorial-engine/REPORT.md` |
| QA teknis (otomatis) | `editorial-engine/qa/QA-TECHNICAL.md` |
| QA visual (kriteria) | `editorial-engine/docs/VISUAL-QA.md` |
| Status integrasi tool | `editorial-engine/docs/TOOL-INTEGRATION.md` |
| Cara kerja pipeline | `editorial-engine/docs/PIPELINE.md` |

Bangun ulang semuanya: `cd editorial-engine && bash pipeline/build-all.sh`
