# QA TEKNIS — karhutla-angka-turun-2026 ("Angka yang turun")

Dijalankan: 3 November 2026 · `MISSION=karhutla-angka-turun-2026 tsx pipeline/qa.ts`
Hasil otomatis: **20 PASS / 0 FAIL / 0 NEEDS REVIEW / 0 NOT TESTED**
Laporan mentah: `qa/report-technical-karhutla-angka-turun-2026.json`

## GATE 5 — teknis

| ID | Pemeriksaan | Status | Detail |
|---|---|---|---|
| T1 | resolusi 1080x1920 | PASS | 1080x1920 |
| T2 | codec / pixel format | PASS | h264 yuv420p |
| T3 | frame rate 30 fps | PASS | 30 fps |
| T4 | durasi di dalam 45–90 s | PASS | 89,63 s |
| T5 | ada audio stream | PASS | aac 48000 Hz stereo |
| T6 | loudness −16..−12 LUFS | PASS | −14,1 LUFS |
| T7 | true peak ≤ −1,0 dBTP | PASS | −3,4 dBTP |
| F1 | semua frame dirender | PASS | 2689/2689 |

Catatan T4: durasi direkayasa turun dari 102,63 s (draf pertama) menjadi 89,63 s dengan memangkas tiga segmen narasi dan merapatkan jeda antarsegmen (0,15 s masuk / 0,20 s keluar). Tidak ada angka yang dihapus dari layar — yang dipotong hanya kalimat pengulang.

## GATE 5 — subtitle

| ID | Pemeriksaan | Status | Detail |
|---|---|---|---|
| S1 | cue terbaca | PASS | 28 cue |
| S2 | maksimal 2 baris per cue | PASS | 2 baris |
| S3 | maksimal 42 karakter per baris | PASS | 28 karakter (terpanjang) |
| S4 | tidak ada cue bertumpuk | PASS | 0 tumpang tindih |
| S5 | minimal 1,0 s di layar | PASS | 0 cue lebih pendek |

Subtitle mengikuti ucapan dan dipenggal per makna (`build-subtitles.ts`), bukan per jumlah karakter.

## GATE 7 — paket unggah

| ID | Pemeriksaan | Status | Detail |
|---|---|---|---|
| TH1 | thumbnail 1080x1920 | PASS | 1080x1920 |
| TH2 | ukuran thumbnail > 200 kB | PASS | 2049 kB |
| CP1 | caption 4 platform | PASS | 4/4 · 9 kB |
| CP2 | caption memuat sumber & batas kejujuran | PASS | penerbit utama: BNPB |

## GATE 5 — poster

| ID | Pemeriksaan | Status | Detail |
|---|---|---|---|
| P1 | poster 1080x1350 | PASS | 1080x1350 |

## GATE 6 — aset & determinisme

| ID | Pemeriksaan | Status | Detail |
|---|---|---|---|
| A1 | maksimal dua keluarga huruf | PASS | Instrument Serif, Archivo |
| A2 | font lokal (build offline) | PASS | 6 ttf |

## Pemeriksaan yang TIDAK otomatis (dinyatakan apa adanya)

| Pemeriksaan | Status | Bukti |
|---|---|---|
| GATE 1–4 (naskah, storyboard, visual) | **Ditinjau manual** | 7 still dirender dan diperiksa satu per satu (`rendering/previews/h01…h07`); dua iterasi desain dilakukan pada h01, h03, h05, h07 |
| Kebenaran angka di layar vs sumber | **Ditinjau manual** | 12 klaim (K1–K12) + 1 turunan (D1) + 1 UNKNOWN (U1) di `research/sources/karhutla-angka-turun-2026.sources.json`; setiap scene mencantumkan lembaga + tanggal |
| Keterbacaan di layar ponsel | **Ditinjau manual** | headline ≥56 px, subtitle 46 px, satu garis permukaan sebagai jangkar visual |
| Sinkronisasi bibir/gerak | Tidak berlaku | tidak ada tokoh berbicara |

## Temuan mesin saat misi ini (bug nyata, sudah diperbaiki)

1. **Font sans tidak pernah terpakai.** Berkas `assets/fonts/archivo-*.ttf` mendaftarkan dirinya sebagai keluarga **"Archivo SemiBold"**, bukan "Archivo". resvg tidak menemukan keluarga "Archivo" lalu jatuh ke Instrument Serif — artinya **semua teks sans di misi 1–5 (subtitle, kicker, label) sebenarnya tampil serif**. Diperbaiki di `design/tokens.ts` (`sans: 'Archivo SemiBold'`). Misi 1–5 yang sudah terbit tidak dirender ulang; misi 6 ke atas memakai font yang benar.
2. **`build-timeline.ts` menulis `topic: 'mbg-gizi-anak'`** untuk semua misi. Diperbaiki menjadi `topic: MISSION`.
3. **`render-thumbnail.ts` mengunci copy misi 5** (kicker/tagline/sumber judol). Sekarang copy dibaca dari `content/thumbnails/<misi>.json`, sehingga satu gambar bisa membawa dua pasang judul (9:16 feed dan 4:5 arsip).
4. **`ThumbAI` memaksa penanda "KODE ILUSTRASI · TIDAK AKTIF"** di semua sampul. Penanda itu hanya relevan untuk gambar yang memuat kode; sekarang opsional (`plate`), dipakai misi 5, tidak dipakai misi 6.
5. **Pelat tak dikenal (`filter="url(#blur-soft)"`)** di `ThumbAI` tidak pernah ada di `defs`, sehingga tampil sebagai pita gelap keras yang memotong langit cerah. Dihapus; scrim atas diperkuat dengan lima stop gradien.
