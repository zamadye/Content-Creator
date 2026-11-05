# Format panjang — aturan terpisah dari Short

Ditulis 2026-11-05 saat memutuskan video panjang pertama (LL-0001).
Alasan: naskah 40–60 detik dan naskah 5–10 menit **tidak boleh dinilai dengan
penggaris yang sama**. Aturan yang membuat Short bagus justru membuat video
panjang terdengar seperti mesin.

## 1. Beda kontraknya

| | Short (LS-XXXX) | Panjang (LL-XXXX) |
|---|---|---|
| Durasi | 40–60 detik | 5–10 menit |
| Jumlah kata | 100–135 | 1.000–1.400 (2,2 kata/detik) |
| Kalimat pertama | klaim, maks 20 kata | boleh 3 kalimat; yang penting ada suara manusia |
| Panjang kalimat | maks 24 kata | maks 40 kata, dan **harus ada** kalimat di bawah 5 kata |
| Scene | 6–7, ganti gambar tiap ±2 detik | 8–12 segmen, ganti gambar tiap 15–25 detik |
| Pembuka | langsung kejadian | rutinitas dulu 60–90 detik, baru kejadian |
| Narator | "kamu" tanpa identitas | orang pertama, punya nama, umur, pekerjaan, utang |
| Dialog | tidak ada | wajib ada, minimal tiga, dan minimal satu yang mengelak |
| CTA | diucapkan di kalimat terakhir | diucapkan di segmen terakhir, setelah cerita selesai |

`scripts/check-copy.mjs` memakai ambang Short (kalimat maks 24 kata, pembuka maks
20 kata). Untuk LL-XXXX ambang itu **tidak dipakai**; yang dipakai rubrik
"ini manusia, bukan model" di `stories/longform/LL-0001/reference.md` §4.

## 2. Yang membuat naskah terdengar seperti model (dan perbaikannya)

| Penyakit | Gejala | Obat |
|---|---|---|
| Simetri | Dua kalimat sejajar tanpa alasan ("Tidak ada yang bergerak. Tidak ada yang bernapas.") | Bikin satu kalimat lebih panjang, satu lebih pendek, atau buang satu |
| Tanpa nama | Tidak ada satu pun nama diri di seluruh cerita | Minimal lima nama: orang, tempat, kapal, warung |
| Tanpa benda | "perangkat", "log", "panel" | Ganti dengan benda yang bisa dibeli: termos, lakban, pulpen yang terikat tali |
| Tanpa tubuh | Narator tidak pernah capek, haus, ngantuk | Satu kalimat per 2 menit soal badan |
| Tanpa angka jelek | Semua angka bulat | "pukul 08.15 persis", "tiga koma empat mil", "dua ratus meter" |
| Tanpa salah | Narator selalu benar | Narator harus melakukan minimal satu kebodohan |
| Konflik metafisik saja | Hantunya jahat karena memang jahat | Horor punya sebab manusia: lalai, malu, takut dipecat |
| Semua tahu | Semua karakter paham situasinya | Minimal satu karakter mengelak dengan pertanyaan |

## 3. Struktur 8–10 menit yang dipakai

1. **0:00–0:40** aturan/pekerjaan, bukan kejadian. Satu kalimat yang bisa
   diulang penonton ("kanal 16 tidak boleh ditinggal").
2. **0:40–2:00** tempat dan benda. Penonton harus bisa menggambar ruangannya.
3. **2:00–3:00** orang lain: senior, rekan, atasan. Satu dialog yang mengelak.
4. **3:00–4:00** kejadian pertama yang **masih bisa dijelaskan**.
5. **4:00–5:00** kejadian kedua yang melanggar aturan/prosedur.
6. **5:00–6:30** penyelidikan: arsip, buku, telepon. Bagian yang paling
   "membosankan" dan paling menentukan.
7. **6:30–7:45** sebab manusianya terbuka.
8. **7:45–8:40** narator melakukan sesuatu (bukan melarikan diri). Penutup tanpa
   rangkuman.
9. **8:40–9:00** CTA yang menyambung dari tema, bukan tempelan.

## 4. Produksi

- VO: satu klip per segmen (`voice-00` id-ID), maks 1.500 karakter per klip.
- Gambar: 16:9 1920×1080 untuk format panjang (Short tetap 1080×1920). 2–3
  gambar per segmen, ganti tiap 15–25 detik, gerak lambat (push 4–6%).
- Musik: drone tanpa ketukan selama segmen 2–3, denyut masuk di segmen 4, dan
  **tidak ada riser** sebelum 6:30. Riser di awal membuat penonton kehabisan.
- QC baru: durasi 5–11 menit, −16…−12 LUFS, TP ≤ −1 dBTP, ≤ 200 MB, dan
  "tidak ada 60 detik tanpa perubahan gambar" (dicek dari panjang `cuts`).
- Gerbang QC di runner (`tools/publish/zernio-publish.mjs`) juga sadar format:
  LL-#### dinilai dengan 1920×1080, durasi 300–660 s, dan batas 300 MB. Tanpa
  itu setiap video panjang ditolak sebelum sempat diunggah — sudah diuji ulang
  setelah perubahan ini.
- Encode untuk format panjang memakai `--maxrate 1.2M --crf 30`: gambar gelap
  dan banyak diam, jadi 5M hanya membengkakkan berkas tanpa menambah detail.
- Batas sebenarnya bukan QC (200 MB) melainkan GitHub: berkas > 100 MB ditolak
  saat push, dan runner mengunggah dari hasil checkout. Master crf 20 = 1,4 GB,
  delivery 2,8M = 183 MB (tetap ditolak), 1,2M/crf 30 = ±62 MB dan setelah
  dibandingkan potongan 1:1 tidak ada blocking yang terlihat. Ukur 60 detik
  dulu sebelum encode penuh: 60 s × 6,6 MB = 558 s × ±6,6 MB.
- Judul panjang boleh dua klausa + kata kunci pencarian di ekor
  ("| Cerita Horor Pantura") — pola yang dipakai kanal panjang yang sudah besar.

## 5. Yang diukur setelah tayang

Untuk format panjang, tayangan bukan angka utama. Yang dibaca: **rata-rata
durasi tonton** dan titik jatuh. Kalau penonton berhenti di menit 1–2, yang
salah adalah kecepatan masuk ke kejadian; kalau berhenti di menit 5–6, yang
salah adalah bagian arsip/penyelidikan (terlalu lambat atau terlalu jelas).
