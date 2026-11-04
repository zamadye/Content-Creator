# KNOT THEORY — Analisis Dua Video Referensi

Sumber: folder Drive KNOT THEORY `1jJiDmlvyPTQx1Fm6Io9N0r-gcSmCftz_`.
Keduanya sudah diunduh & diperiksa dengan ffmpeg (bukan diasumsikan). Status: **VERIFIED (dibaca frame-by-frame)**.

| Berkas | Durasi | Resolusi | fps | Gaya |
|---|---|---|---|---|
| `video_reference.mp4` (16EXsAD9V…) | 88,4 s | 720×1280 (9:16) | 30 | Animasi kartun 2D karakter |
| `video_reference_01.mp4` (1Gy6VsPAM…) | 69,0 s | 1280×720 (16:9) | 25 | Kolase kertas / sketch explainer |

## 1. `video_reference.mp4` — kartun 2D karakter
- Karakter lucu berbadan tongkat dengan kepala besar, ekspresi kartun, berulang sepanjang video (identitas karakter konsisten).
- Latar bergaya vektor datar berlapis: langit/hutan (BG) → sungai/rumput (MG) → karakter & properti (FG).
- Metafora konkret, bukan abstrak: jaring penangkap sampah vs ikan, warung "WARKOP", kalender "HARI 7".
- **Kartu judul/chapter** di tengah video (papan nama, kalender) sebagai penanda bab.
- **Caption karaoke per frasa**: satu baris di bawah, kata kunci diberi blok hijau (highlight) — mata selalu punya titik fokus.
- Nada satir/jenaka; tanpa foto, tanpa aset AI generatif.

## 2. `video_reference_01.mp4` — kolase kertas
- Kertas bergaris, kertas sobek, selotip, staples, bayangan tangan.
- Tipografi marker tangan untuk headline; teks pendukung kecil dan miring.
- Alat peraga naratif: papan sketsa, jam, dokumen bertanda pisau/panah — setiap properti menjelaskan satu ide.
- **Kartu judul besar** ("Why Storyboard?") yang muncul di awal bab; panah tulisan tangan sebagai penunjuk arah baca.
- Gerak: geser/angkat kertas (stop-motion feel), zoom pelan.

## 3. Posisi produksi KNOT THEORY sekarang
Sistem visual yang dipakai (`topic-paper`: kertas, slip, tape, Marker + Archivo) **sehaluan dengan `video_reference_01`** — bukan dengan `video_reference.mp4`.
Yang belum diadopsi dari kedua referensi:

| Fitur referensi | Status di pipeline | Tindakan |
|---|---|---|
| Thumbnail = frame 0 (aturan Buffer) | **SUDAH** (c01 full-bleed cover, teks lengkap di frame 0) | — |
| CTA di akhir | **SUDAH** (c07: "Kalau ini berguna / simpan · bagikan · ikuti") | — |
| Kartu judul/chapter di tengah | sebagian (PaperHeader + kicker) | opsional |
| Caption karaoke dengan kata kunci di-highlight | **BELUM** — caption sekarang teks polos | perlu upgrade `CaptionLayer` (re-render penuh ±11 menit) |
| Karakter kartun berulang | **BELUM** — gaya kolase tidak memakai karakter | keputusan pemilik kanal |

## 4. Rekomendasi
1. **Pertahankan gaya kolase kertas** (cocok dengan `video_reference_01`, murah, khas, tidak meniru artis tertentu).
2. **Adopsi caption karaoke** dari `video_reference.mp4`: highlight kata kunci per cue. Timing kata diturunkan proporsional dari durasi cue (tanpa ASR) — jujur sebagai pendekatan, bukan word-level hasil transkripsi.
3. Tambah **kartu chapter** ringan di c02/c04/c06 (label bab di PaperHeader) untuk paritas struktur.
4. Karakter kartun berulang hanya jika kanal pindah ke gaya animasi penuh — itu proyek terpisah (rig karakter + 8–10 pose/ekspresi), bukan tambalan.

Aturan baru yang berlaku untuk semua misi berikutnya:
- frame 0 = thumbnail yang bisa dibaca penuh (hook + tagline), tanpa fade-in;
- wajib CTA eksplisit di scene terakhir;
- caption memakai satu kata kunci ter-highlight per cue.
