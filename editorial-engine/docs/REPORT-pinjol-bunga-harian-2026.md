# Laporan misi 7 — "0,3 persen sehari"

**Slug:** `pinjol-bunga-harian-2026` · **Tanggal:** 3 November 2026
**Gaya:** kolase kertas (mengikuti referensi `Explain What is a StoryBoard_!.mp4`)
**Judul kerja:** 0,3 persen sehari — kenapa bunga harian kelihatan kecil

---

## 1. Apa yang dibuat

Satu video vertikal 1080x1920, 30 fps, **80,83 detik**, tujuh segmen HOOK → CLOSING.
Topik baru: **aritmetika bunga harian** — bagaimana 0,3% per hari berubah menjadi 109,5% per tahun (bunga tunggal) atau 198,4% (bunga majemuk), dan kenapa angka harian selalu terasa kecil.

| Segmen | Fungsi | Isi | Durasi |
|---|---|---|---|
| p01 | HOOK | Kardus kraft "0,3% per hari", kata "per hari" dilingkari | 10,40 s |
| p02 | CONTEXT | Nota pinjaman + 30 kotak hari terisi → Rp90.000 | 11,57 s |
| p03 | CONFLICT | Kotak dicoret, "HARI 31" di luar hitungan, panah melingkar | 10,00 s |
| p04 | DEVELOPMENT | Kertas grafik: garis lurus 109,5% vs kurva 198% | 14,87 s |
| p05 | PERSPECTIVE | Tiga batang satu skala: 1 px vs 17 px vs 380 px | 13,40 s |
| p06 | EVIDENCE | Tiga baris periksa dengan centang spidol | 13,03 s |
| p07 | CLOSING | "Angka setahun tidak bisa disembunyikan." | 7,57 s |

## 2. Kenapa topik ini

Semua klaim di video adalah **aritmetika yang bisa diperiksa dengan kalkulator**, bukan data lapangan. Itu pilihan sadar: tanpa akses ke sumber primer (OJK diblokir dari sandbox), satu-satunya cara tetap jujur dan tetap tajam adalah membangun argumen dari hitungan yang bisa diulang siapa pun.

Angka 0,3% diperlakukan sebagai **contoh terbuka** — narasi memakai bentuk bersyarat ("kalau ada pinjaman yang menulis…"), tidak menyebut satu pun penyelenggara, dan tidak mengklaim praktik pasar.

## 3. Bahasa visual yang diambil dari referensi

| Elemen referensi | Cara diterapkan |
|---|---|
| Kertas kusut sebagai seluruh dunia | `PaperBg` — 130 serat, 6–8 lipatan, 9 bercak, dibuat vektor deterministik |
| Kardus kraft sobek | `KraftCard` dengan tepi bergerigi hasil PRNG bersemai |
| Tulisan spidol yang menulis | `PaperWrite` (clip melebar) + `Permanent Marker` |
| Lingkaran & panah tangan | `SketchCircle`, `SketchArrow`, `SketchLoop`, `SketchUnderline` — panjang goresan dihitung dari path, bukan dikira |
| Elemen ditempel satu per satu | tiap scene punya ≥3 momen tempel/gambar, jarak 3–5 detik |
| Dua typeface saja | Permanent Marker (spidol) + Archivo (subtitle, sumber, label) |
| Palet muted earthy | krem kertas, arang, marun, mustard, zaitun pudar |

## 4. Perubahan engine (dan alasannya)

1. **Display font diganti: Instrument Serif → Permanent Marker.**
   Bahasa visual referensi adalah tulisan spidol; serif editorial akan langsung mematahkannya. Manifest font sekarang hanya memuat **dua keluarga** (Permanent Marker + Archivo), jadi gate A1 tetap PASS. Instrument Serif masih ada di `assets/fonts/` untuk arsip misi 1–6, tapi tidak lagi dimuat — kalau misi lama dirender ulang, judulnya akan jatuh ke Archivo. **Ini konsekuensi yang disengaja, bukan kelalaian.**
2. **`layout.rhythm.captionY`: 1566 → 1536.**
   Kotak subtitle dua baris setinggi ±146 px ternyata menutup baris sumber di y=1672 — terlihat saat uji still misi ini, dan sebenarnya sudah ada sejak misi sebelumnya. Dinaikkan 30 px; jarak ke zona konten (1470) masih 22 px.
3. **Kit ilustrasi baru `remotion/src/illustration/topic-paper.tsx`** (sekitar 700 baris): 18 komponen kertas + goresan tangan, semuanya fungsi murni dari props.
4. **Sampul baru `PaperCover` + `pipeline/render-cover-paper.ts`.**
   Misi 1–6 memakai gambar model untuk sampul. Untuk gaya kolase, sampul digambar dengan komponen yang sama dengan filmnya — supaya janji di sampul sama dengan isi video, dan tidak ada foto/ilustrasi model yang bertabrakan gaya.

## 5. Angka dan status bukti

| ID | Klaim | Status |
|---|---|---|
| K1 | 0,3% × 365 = 109,5% (bunga tunggal) | **VERIFIED** (dihitung ulang) |
| K2 | 1,003^365 − 1 = 198,4% (bunga majemuk) | **VERIFIED** |
| K3 | Rp1.000.000 × 0,3% = Rp3.000 per hari | **VERIFIED** |
| K4 | 30 hari bunga tunggal = Rp90.000 (9%) | **VERIFIED** |
| K5 | Bunga majemuk 365 hari = Rp1.984.287; total Rp2.984.287 | **VERIFIED** |
| K6 | Bunga majemuk menghitung bunga dari bunga; tunggal hanya dari pokok | **VERIFIED** (definisi) |
| U1 | Batas bunga harian resmi November 2026 | **UNKNOWN** — tidak dipakai di video |
| U2 | Ada penyelenggara yang benar-benar memakai skema ini | **UNKNOWN** — narasi memakai bentuk bersyarat |

Sumber: `research/sources/pinjol-bunga-harian-2026.sources.json` (S1 perhitungan, S2 definisi).

## 6. Hasil terukur

| | |
|---|---|
| Frame dirender | 2425 / 2425 |
| Durasi | 80,83 s |
| Ukuran MP4 | 8,28 MB |
| Video | h264 High, yuv420p, 1080x1920, 30 fps, CRF 18 |
| Audio | AAC 192 kb/s, 48 kHz, stereo |
| Loudness | **−14 LUFS** integrated, **−3,4 dBTP** |
| Subtitle | 23 cue, maksimum 27 karakter/baris, tanpa tumpang tindih |
| Suara | `voice-05` (perempuan, Indonesia) — 7 klip, total bicara 77,65 s |

## 7. QA teknis

`qa/QA-TECHNICAL-pinjol-bunga-harian-2026.md` — **19 PASS, 1 NEEDS REVIEW, 0 FAIL**.

Yang NEEDS REVIEW: **TH2 — ukuran thumbnail 179 kB** (ambang gate: >200 kB).

Alasan, tanpa membela diri: ambang itu adalah *proxy* untuk "sampul bukan gambar kosong". Sampul misi ini dirender sebagai vektor datar, jadi PNG-nya sangat terkompresi. Isinya sudah diperiksa langsung, bukan diasumsikan:

- 1340 warna unik pada 1080x1920;
- luminansi min/mean/maks 31,4 / 173,8 / 233,7 — ada kontras penuh, bukan bidang rata;
- diperiksa secara visual: "0,3%" setinggi ±640 px, kata "per hari" dilingkari, tagline "kelihatan kecil… sampai dikali 365."

Gate-nya tidak saya turunkan supaya statusnya jadi PASS. Statusnya tetap NEEDS REVIEW, dengan alasan tertulis.

## 8. Batas kejujuran

- Video **tidak** menyebut regulator, batas bunga resmi, atau nama penyelenggara apa pun — semuanya belum bisa diverifikasi dari sandbox ini.
- Bunga majemuk hanya berlaku bila bunga yang belum dibayar ikut berbunga sesuai perjanjian; itu dinyatakan di caption, bukan disembunyikan.
- Rp1.984.287 adalah **bunga**, bukan total tagihan, dan belum termasuk denda/biaya.
- Seluruh visual ilustrasi; tidak ada tangkapan layar, logo, atau wajah.
- Bukan nasihat keuangan.

## 9. Catatan untuk misi berikutnya

- Kit `topic-paper.tsx` bisa dipakai ulang untuk topik lain yang butuh gaya kolase; yang perlu diganti hanya scene dan komponen data (grid, grafik, centang).
- Biaya render: ±2425 frame pada 2 core = ±19 menit, 1,5–3,3 fps tergantung kepadatan scene (p04 dan p06 paling berat karena grid + goresan).
- Kalau mau membandingkan dengan referensi: referensi 69,05 s dengan 13 cut (rata-rata 5,3 s). Film ini 80,83 s dengan 7 scene tapi ±20 momen tempel/gambar — rata-rata satu perubahan tiap ±4 s.
