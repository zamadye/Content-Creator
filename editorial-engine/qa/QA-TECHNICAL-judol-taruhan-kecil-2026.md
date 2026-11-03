# QA TEKNIS — `judol-taruhan-kecil-2026`
Dijalankan 3 November 2026 · `MISSION=judol-taruhan-kecil-2026 tsx pipeline/qa.ts`
Hasil mentah: `qa/report-technical-judol-taruhan-kecil-2026.json`

## Ringkasan
**20 PASS · 0 FAIL · 0 NEEDS REVIEW · 0 NOT TESTED**

| ID | Pemeriksaan | Status | Detail |
|---|---|---|---|
| T1 | resolusi 1080x1920 | PASS | 1080x1920 |
| T2 | codec / pixel format | PASS | h264 yuv420p |
| T3 | frame rate 30 fps | PASS | 30 fps |
| T4 | durasi 45–90 dtk | PASS | 89,40 dtk |
| T5 | stream audio ada | PASS | aac 48000 Hz stereo |
| T6 | loudness terintegrasi −16..−12 LUFS | PASS | −14 LUFS |
| T7 | true peak ≤ −1,0 dBTP | PASS | −3,4 dBTP |
| S1 | cue subtitle terbaca | PASS | 27 cue |
| S2 | maksimum 2 baris per cue | PASS | 2 baris |
| S3 | maksimum 42 karakter per baris | PASS | 36 karakter |
| S4 | tidak ada cue bertumpuk | PASS | 0 tumpang tindih |
| S5 | minimum 1,0 dtk di layar | PASS | 0 cue terlalu pendek |
| F1 | semua frame dirender | PASS | 2682/2682 |
| TH1 | thumbnail 1080x1920 | PASS | 1080x1920 |
| TH2 | ukuran thumbnail > 200 kB | PASS | 2.516 kB |
| CP1 | caption 4 platform | PASS | 4/4 · 10 kB |
| CP2 | caption memuat sumber & batas kejujuran | PASS | dicek manual |
| P1 | poster 1080x1350 | PASS | 1080x1350 |
| A1 | maksimum dua keluarga huruf | PASS | Instrument Serif, Archivo |
| A2 | berkas font lokal (offline) | PASS | 6 ttf |

## Catatan pemeriksaan manual (di luar skrip)

| Butir | Status | Catatan |
|---|---|---|
| Review still 7 scene (komposisi, tipografi, label ilustrasi) | PASS | 4 putaran still: perbaikan rak yang menabrak headline, ukuran props di meja, panah yang menimpa angka, dan panel yang ikut bergeser bersama kamera |
| Label "hitungan sendiri" pada angka turunan | PASS | muncul di baris sumber k04, subtitle vo04, dan caption 4 platform |
| "TIDAK ADA DATA" untuk dana yang kembali ke pemain | PASS | bingkai kosong k06, bukan angka perkiraan |
| Tidak ada kode QR yang dapat dipindai di motion graphic | PASS | mosaik kotak generik 9×9 di k01/k05/k07 |
| Sampul: kode pada gambar ilustrasi tidak aktif | PASS | penanda "KODE ILUSTRASI · TIDAK AKTIF" ditumpuk di area kode |
| Karakter yang tidak ada di font | PASS | panah "→" di subtitle vo04 diganti kata sebelum render |
| Pelafalan VO oleh penutur asli | NEEDS REVIEW | "PPATK", "QRIS", "Kemenkomdigi" belum didengar penutur asli |

## Batas yang diketahui

- **Rasio bicara** 1,78–2,21 kata/detik — pas untuk tenor laporan, bukan untuk retensi tinggi di TikTok (lihat `docs/STRATEGI-KONTEN-VIRAL.md` §3).
- **P1/F1 saling mengunci:** `encode.ts` tidak menghapus frame, jadi F1 tetap bisa diuji setelah encode. Pada misi sebelumnya F1 menjadi NOT TESTED karena frame dihapus setelah encode.
- **Durasi audio 89,02 dtk vs video 89,40 dtk** — selisih 0,38 dtk karena padding ekor; tidak ada klip terpotong (`-shortest`).
