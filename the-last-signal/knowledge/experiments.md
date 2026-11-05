# Eksperimen produksi — 2026-11-04

Aturan: **satu episode = satu variabel utama.** Kalau semua diubah sekaligus,
tidak ada yang bisa dipelajari dari hasilnya. Kolom "hasil" baru diisi setelah
analytics tersedia (butuh ≥ 24 jam dan ≥ beberapa ratus tayangan untuk berarti).

Baseline: **LS-0001 — Ketukan Ketiga** (CCTV, apartemen kosong, 57,1 s, 26 shot,
2 jumpscare, −14,7 LUFS, −1,6 dBTP, 35,5 MB). Semua episode berikut dibandingkan
ke baris ini.

| # | Episode | Variabel yang diuji | Hipotesis | Hasil |
| --- | --- | --- | --- | --- |
| 1 | LS-0001 Ketukan Ketiga | — (baseline) | Narasi orang kedua + skor + 2 jumpscare cukup untuk menahan penonton 40 detik pertama | menunggu data |
| 2 | LS-0002 Siaran Jam Sebelas | **Format analog horror**: estetika VHS/CRT, kamera paling statis dari semua episode | Penonton bertahan lebih lama saat gambar "terlihat seperti rekaman asli" ketimbang sinematik bersih | menunggu data |
| 3 | LS-0003 Suara Terakhir di KM 42 | **Suara sebagai bukti**: hampir seluruh horor dari radio + jalan kosong | Audio-led horror menaikkan watch time karena penonton menunggu suara berikutnya | menunggu data |
| 4 | LS-0004 Kamar Sembilan | **Horor prosedural**: ancaman datang dari rutinitas, bukan dari hantu yang muncul | Ketenangan yang salah (calm dread) menurunkan swipe-away di 3 detik pertama | menunggu data |
| 5 | LS-0005 Perumahan yang Belum Dijual | **Camcorder handheld**: gerak kamera paling agresif, hook menyebut penonton | Gerakan kamera menaikkan retensi di detik 15–30 (titik jenuh biasanya di sini) | menunggu data |
| 6 | LS-0006 Lantai Basement Dua | **Struktur loop**: komposisi diulang dengan satu detail berubah | Loop membuat penonton menonton ulang (repeat view — metrik yang jarang tapi bernilai) | menunggu data |
| 7 | LS-0007 Ruang Tanpa Pintu | **Temuan fisik**: tidak ada entitas terlihat sampai akhir | Payoff yang tidak menampilkan monster mengurangi rasa "murahan", menaikkan like ratio | menunggu data |
| 8 | LS-0008 Panggilan dari Perahu Kosong | **Laut & bahasa daerah**: palet biru-hitam, sedikit cahaya | Palet gelap menaikkan mood tapi berisiko ditinggal kalau hook lemah — uji batasnya | menunggu data |
| 9 | LS-0009 Perangkat Ketujuh | **Horor digital**: log router, tanpa hantu | Penonton muda lebih terhubung ke horor teknologi; cek komentar & share | menunggu data |
| 10 | LS-0010 Lantai Sembilan Belas | **Satu lokasi, satu lift**: variasi ruang paling sempit | Membatasi lokasi menaikkan fokus cerita; uji apakah terasa membosankan | menunggu data |

## Variabel yang sengaja dijaga tetap (kontrol)

Kalau semua ini ikut berubah, tabel di atas tidak berarti apa-apa.

- Durasi 45–57 detik, 6 scene, 1 jumpscare utama (LS-0001 punya 2 sebagai baseline).
- Suara narasi: `voice-00` (id-ID, maskulin) dari awal sampai akhir.
- Skor musik: disintesis `make-score.mjs` dengan struktur sama (build → tension → riser).
- Encode: H.264 CRF 20, AAC 48 kHz, loudnorm −14 LUFS, true peak −3 dBTP.
- Titik jumpscare tidak pernah di 5 detik pertama (kontrak menolaknya).
- Semua judul memuat satu detail konkret dari cerita, bukan janji kosong.

## Blokade: metrik yang dijanjikan di atas tidak tersedia (2026-11-05)

Rencana di tabel ini bertumpu pada *average percentage viewed*, VVSA, dan retensi
detik 15. Per 5 November 2026 ketiganya **kosong** di sumber yang kita pakai
(`completionRate: 0`, `retentionCurve: null`, `getYouTubeDailyViews` = 0). Yang
bisa dibaca hanya tayangan, like, dan komentar.

Konsekuensinya: tabel di atas **tidak bisa dinilai** dan tidak boleh diklaim
sebagai hasil. Sampai kuota YouTube Analytics pulih, eksperimen yang dijalankan
hanya yang bisa diukur dengan tiga angka itu — lihat E3\.

## E3 — Metadata & irama unggah (mulai 2026-11-05)

Variabel: **keseragaman metadata** (judul, baris pertama deskripsi, komentar
pertama) dan **irama unggah**, bukan isi cerita.

Alasan: sembilan unggahan pertama memakai kerangka judul yang sama, pembuka
deskripsi yang sama, dan komentar pertama yang identik kata per kata
(`check-copy.mjs` menghitungnya: 9 dari 9 judul memakai engsel "itu"). Tayangan
jatuh ke nol tepat setelah unggahan keempat.

Cara menilai: tayangan 48 jam per unggahan, dibandingkan dengan LS-0004..LS-0008
(0–5 tayangan). Berhasil kalau dua unggahan berurutan melewati 100 tayangan;
gagal kalau tetap nol meski metadata berbeda dan jeda 24 jam — pada titik itu
yang disalahkan bukan naskah, melainkan kanal.

## Cara membaca hasil nanti

Yang dibandingkan per episode: **average percentage viewed**, bukan views.
Views dipengaruhi jam upload dan jumlah subscriber; persentase ditonton mengukur
apakah cerita dan ritmenya bekerja. Metrik pendukung: viewed vs swiped away
(detik 0–3), retensi di detik 15 (titik jenuh), dan subscriber gained per 1000 views.

Ambang keputusan: kalau satu format menghasilkan retensi ≥ 5 poin persen di atas
baseline pada ≥ 3 video, format itu jadi tulang punggung jadwal. Kalau di bawah
baseline dua kali, formatnya dihentikan — bukan diperbaiki tanpa henti.
