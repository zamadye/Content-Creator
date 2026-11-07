# PACKAGING — kapan orang berhenti menggulir

Dokumen ini bukan tentang isi cerita (itu `NASKAH.md`). Ini tentang **kemasan**:
judul, thumbnail, dua detik pertama, dan ajakan. Sumbernya data kanal sendiri
(analisis 8 Nov 2026), bukan selera.

## Diagnosa dari angka

| Gejala | Angka | Artinya |
|---|---|---|
| CTR video panjang | 0,88% (LL-0001) · 0,42% (LL-0002) | Judul + thumbnail tidak menjual. Cerita dalamnya justru paling kuat (LL-0002 ditonton 66,9%) |
| Retensi Short | 33–46% | Separuh penonton pergi di 1–2 detik pertama |
| Subscriber | +13 dari 4.400+ tayangan | Orang menonton, lalu lupa kanalnya |
| Waktu tonton | 6+ jam dari LL-0001 | Yang bertahan benar-benar bertahan; masalahnya di pintu masuk |

Kesimpulan: **bottleneck-nya di pintu masuk**, bukan di dalam cerita. Karena itu
semua aturan di bawah menyasar 3 detik pertama dan judul.

## 1. Judul: premis dulu, suasana kemudian

Judul yang puitis tanpa premis tidak bisa diklik orang yang belum mengenal
kanal ini. "Dua Belas Meter yang Hilang" terdengar indah, tapi tidak menjanjikan
apa pun yang konkret.

Aturan:

1. **Satu benda + satu kejanggalan** harus ada di judul. Contoh bentuk:
   "Tanah Ini Kurang 12 Meter Setiap Diukur".
2. **Angka lebih kuat daripada kata sifat.** "12 meter" mengalahkan "misterius".
3. **Jangan buka dengan kata suasana** (misteri, teror, kelam) — buka dengan
   kejadian.
4. Maksimal 70 karakter supaya tidak terpotong di ponsel; kata kunci paling
   penting di 40 karakter pertama.
5. "Cerita Horor" boleh, tapi di belakang — bukan pengganti premis.

Perbaikan untuk dua video yang sudah tayang:

| Video | Judul sekarang | Usulan |
|---|---|---|
| LL-0001 | Kanal 16 Tidak Boleh Ditinggal — Stasiun Radio Pantai di Pantura \| Cerita Horor | **Kanal 16 Masih Menjawab, 12 Tahun Setelah Kapalnya Tenggelam** |
| LL-0002 | Dua Belas Meter yang Hilang | **Tanah Ini Kurang 12 Meter Setiap Diukur — Selisihnya Selalu Sama** |

## 2. Thumbnail: 2–3 kata, satu titik fokus

Thumbnail tidak merangkum cerita; ia menimbulkan satu pertanyaan. Teks maksimal
tiga kata, huruf besar, kontras tinggi, satu objek ganjil yang bisa dijelaskan
dalam satu tarikan mata. Empat thumbnail yang sudah ada mengikuti aturan ini
(`stories/thumbnails/README.md`) dan **belum pernah dipasang** — pasang dulu
sebelum membuat yang baru.

## 3. Dua detik pertama Short

Yang dihitung penonton bukan durasi video, tapi jarak antara jempol berhenti dan
otak mengerti ada yang aneh.

- Kata pertama harus terdengar **sebelum 0,3 detik** (`LEAD_IN_FRAMES` = 6 di
  30 fps). Tanpa jeda hening, tanpa musik pembuka.
- Kartu hook tampil bersamaan dengan kalimat pertama, bukan sesudahnya.
- Gambar pertama harus memperlihatkan **benda yang salah**, bukan suasana:
  celah kosong di antara dua rumah, kursi yang sudah terisi, layar monitor bayi.
- Kalimat pertama Short ≤ 9 kata dan wajib memuat angka atau penanda waktu
  (ditegakkan `check-copy.mjs`).

## 4. Jembatan Short → video panjang

Short berdiri sendiri, jadi jembatan tidak boleh memaksa ("tonton video
panjangnya") kalau ceritanya tidak berhubungan. Yang boleh:

- Sematan komentar yang menanyakan pilihan sulit dari cerita itu (sudah ada di
  `publishing.pinComment` tiap episode).
- Kalau Short memang turunan sebuah video panjang, sebut di deskripsi:
  "Versi lengkapnya: <judul>". Jangan pernah mengarang kaitan yang tidak ada.

## 5. Ajakan: satu pertanyaan, bukan tiga perintah

CTA di ekor video berbentuk pilihan yang harus dijawab penonton
("Kamu akan tanda tangan, atau memindahkan rumahnya?"). Tombol SUBSCRIBE/LIKE/
KOMENTAR ada di bawahnya sebagai jalan keluar, bukan sebagai kalimat.

Alasan: +13 subscriber dari 4.400 tayangan menunjukkan penonton menikmati cerita
tanpa merasa perlu kembali. Pertanyaan yang belum terjawab membuat mereka ingin
mendengar cerita berikutnya — dan itu pekerjaan subscribe, bukan pekerjaan
tombol.
