# LAPORAN MISI — "TARUHANNYA MENGECIL"
`judol-taruhan-kecil-2026` · 3 November 2026

## 1. Apa yang dibuat

Video editorial 9:16 berdurasi **89,40 detik** tentang perputaran judi online semester I 2026: nilai turun **12,9 persen**, jumlah transaksi naik **167 persen**, dan rata-rata satu transaksi menyusut dari **±Rp680 ribu** menjadi **±Rp186 ribu**.

Tesisnya satu kalimat: **yang diblokir negara adalah nama rekening; yang tidak pernah diblokir adalah kebiasaan — dan kebiasaan tidak punya rekening.**

| Berkas | Ukuran | Catatan |
|---|---|---|
| `B_judol-taruhan-kecil-2026_1080x1920.mp4` | 10,33 MB | 2682 frame, h264 high, AAC 192k, faststart |
| `T_judol-taruhan-kecil-2026_1080x1920.png` | 2.516 kB | sampul paket unggah (sinematik, hasil model gambar) |
| `A_judol-taruhan-kecil-2026_1080x1350.png` | — | poster arsip 4:5 |
| `C_judol-taruhan-kecil-2026.srt / .vtt` | — | 27 cue |
| `caption_judol-taruhan-kecil-2026.txt` | 10 kB | 4 platform + komentar pertama + jawaban siap pakai |

## 2. Angka dan sumber (semua VERIFIED kecuali disebut)

| Angka | Nilai | Sumber |
|---|---|---|
| Perputaran semester I 2026 | Rp86,82 triliun | Kepala PPATK, 4 Agu 2026 (K1) |
| Jumlah transaksi | 467,32 juta | idem (K2) |
| Setoran pemain | Rp22,05 triliun | idem (K3) |
| Perubahan vs semester I 2025 | nilai −12,9 %, transaksi +167 % | idem (K4) |
| Setoran lewat QRIS | Rp12,36 triliun (56 %), 198,77 juta transaksi | idem (K5) |
| 2025 setahun penuh | Rp286,84 T / 422,1 juta / deposit Rp36,01 T / 12,3 juta penyetor | Monitor Indonesia, 29 Jan 2026 (K6) |
| Pemain | ±12 juta orang | PPATK 2026 (K7) |
| Rekening diblokir semester I 2026 | 5.762 rekening, Rp1,07 triliun | PPATK/JawaPos–Liputan6, Jul 2026 (K8) |
| Konten ditindak | 3,7 juta konten (20 Okt 2024–12 Jul 2026) | Kemenkomdigi (K9) |
| Rerata per transaksi | Rp680 ribu → Rp186 ribu | **DERIVED** — hitungan sendiri (K10) |
| Dana yang kembali ke pemain | — | **UNKNOWN** → ditampilkan "TIDAK ADA DATA" (K12) |

## 3. Struktur film

| Scene | Detik | Fungsi | Isi |
|---|---|---|---|
| k01 | 0–11,47 | HOOK | Meja warung malam, dudukan kode, 12 juta orang / 467 juta transaksi |
| k02 | 11,47–26,50 | CONTEXT | Tiga blok angka resmi di atas meja kayu |
| k03 | 26,50–38,50 | CONFLICT | Panah pendek turun (−12,9 %) vs panah panjang naik (+167 %) |
| k04 | 38,50–50,50 | DEVELOPMENT | Lembar uang pecah jadi keping; Rp680 ribu vs Rp186 ribu |
| k05 | 50,50–64,43 | PERSPECTIVE | Warung yang sama, cahaya dingin, 56 % setoran lewat QRIS |
| k06 | 64,43–79,83 | EVIDENCE | Tiga plat penindakan + bingkai kosong "TIDAK ADA DATA" |
| k07 | 79,83–89,40 | CLOSING | Lampu diredupkan, telepon hilang, kalimat penutup |

Perubahan visual besar terjadi tiap 3–5 detik (angka masuk, panah tumbuh, cahaya berubah, koin menyebar, kamera bergeser).

## 4. Keputusan yang diambil selama produksi

1. **Topik dipilih untuk potensi sebaran, bukan bobot editorial.** Judi online punya tiga syarat sebaran: ruang yang dikenali (warung), angka yang bisa di-screenshot, dan satu kalimat penutup yang bisa dikutip.
2. **Bingkai "kebijakan", bukan "permainan".** Tidak ada nama situs, merek, tautan, atau visual kemenangan; kode digambar sebagai mosaik generik; posisi PPATK bahwa QRIS bukan instrumen bermasalah dimuat utuh di baris sumber k05.
3. **Angka turunan diberi label.** Rp186 ribu bukan angka PPATK — ia hasil pembagian, dan disebut begitu di layar, subtitle, dan caption.
4. **Kekosongan ditampilkan, bukan diisi.** Pertanyaan "berapa yang kembali ke pemain" dijawab dengan bingkai kosong, bukan estimasi.
5. **Sampul dari model gambar, bukan frame video.** Satu ide sindiran: uang receh diselipkan di bawah kode QR warung. Karena kode pada gambar ilustrasi bisa tampak dapat dipindai, ditumpuk penanda "KODE ILUSTRASI · TIDAK AKTIF".

## 5. QA

`tsx pipeline/qa.ts` → **20 PASS / 0 FAIL / 0 NEEDS REVIEW / 0 NOT TESTED**.
Rincian: `qa/QA-TECHNICAL-judol-taruhan-kecil-2026.md`.
Satu butir di luar skrip tetap **NEEDS REVIEW**: pelafalan "PPATK", "QRIS", "Kemenkomdigi" oleh penutur asli belum diverifikasi.

## 6. Kejadian teknis yang perlu dicatat

- **Workspace sempat ter-reset** (repo di-clone ulang, HEAD kembali ke `e8684bf`). Mesin produksi dan seluruh berkas misi hilang; dipulihkan dari branch PR #1 (misi 1) lalu misi ini dibangun ulang di atasnya. Kode misi 2–4 tidak dapat dipulihkan dari remote (tidak pernah di-push); file jadinya tetap aman di Google Drive.
- **Pipeline diberi dukungan multi-misi** (`MISSION` env → `PATHS`): script, storyboard, timeline, frame, master audio, video, dan laporan kini punya path per misi. Sebelumnya semua path di-hardcode ke misi pertama.
- **Dua bug pipeline diperbaiki:** `encode.ts` menulis nama berkas yang di-hardcode (sehingga MP4 misi lain tidak pernah muncul), dan `render-still.ts` membaca modul timeline hasil generate (sehingga still selalu memantulkan misi pertama).
- **Subtitle sempat memuat karakter "→"** yang tidak ada di font (muncul sebagai kotak kosong). Diganti dengan kalimat bertutur sebelum render.

## 7. Yang belum selesai / saran berikutnya

1. **Audisi suara belum menemukan suara yang identik dengan misi 1–4.** Voice ID lama tidak tersimpan (layanan TTS mendaftarkan suara per sesi). Video ini memakai suara perempuan pilihan pengguna pada audisi ke-3.
2. **Rasio bicara 1,78–2,21 kata/detik** — cocok untuk laporan, kurang agresif untuk retensi. Jika ingin menaikkan retensi, padatkan vo01 dan vo02 (target 2,6 kata/detik) tanpa menambah durasi.
3. **Belum ada baseline akun.** Target retensi 3 detik >70 % masih patokan industri; catat hasil 48 jam pertama ke `qa/`.
4. **Poster 4:5** memakai komposisi sampul yang sama (crop tengah); kalau ingin poster yang berdiri sendiri, perlu satu gambar tambahan.
