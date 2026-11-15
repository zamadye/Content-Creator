# Gibran Mundur — revisi motion v4

Arah yang dipilih pengguna: **explainer teknis — ilustrasi presisi, diagram, transformasi objek**.

## Temuan pada v3

Audit ini membaca kode semua scene, lalu memeriksa visual contoh v4. Ini bukan klaim
bahwa seluruh video telah ditonton atau seluruh timing VO sudah diverifikasi.

- `.float` memiliki posisi dasar `translate(x,y) rotate(...)`, tetapi `frame(t)` menggantinya dengan `translate(0,sin(...))`. Posisi dokumen hilang. Transform tata letak dan transform gerak harus berada di grup berbeda.
- Lima scene pilar dan tiga scene perspektif memakai gambar dasar sama tanpa perkembangan yang memadai.
- Crane dibuat tetapi tidak mengangkat/menurunkan pilar; gearbox berputar tanpa memperlihatkan gangguan pendingin; timbangan bergoyang tanpa konsekuensi yang dijelaskan.
- SC12–13 hanya memiliki empat node; storyboard meminta tujuh entitas dan batas konstitusional.
- SC14 hanya memakai garis waktu dan angka 60; pelaku, dua calon, dan pemilihan tidak terlihat.
- Gerak sinus, debu, zoom, dan garis putus-putus berjalan hampir di semua scene. Itu tidak mengikuti urutan penjelasan VO.
- SC01 menampilkan judul sementara storyboard meminta hook tanpa judul.
- Header/kartu/footer seragam membuat kerangka UI lebih menonjol daripada objek yang dijelaskan.

## Aturan revisi

1. Perubahan visual harus mempunyai pemicu, aksi, akibat, dan posisi akhir yang dapat dibaca.
2. Tata letak tidak boleh ditimpa gerak objek; seluruh `frame(t)` harus bisa diakses acak.
3. Kamera hanya berpindah saat fokus penjelasan berpindah. Hindari zoom atau getaran terus-menerus.
4. Bentuk dan garis mewakili hubungan yang dijelaskan. Warna memiliki peran: mint normal, amber peningkatan beban, coral gangguan.
5. Teks menjelaskan objek/relasi; jangan menggandakan narasi sebagai panel judul dan panel kesimpulan di setiap beat.
6. Tidak menambah kesimpulan politik/hukum. Revisi ini tidak memverifikasi klaim VO atau dokumen sumber.
7. Tinjau cuplikan bergerak, sinkron VO, dan keterbacaan sebelum menyebut hasil final. Pemeriksaan determinisme tidak membuktikan kualitas kreatif.

## Contoh yang sudah dibuat

| Scene | Keadaan awal | Aksi / akibat | Keadaan akhir |
|---|---|---|---|
| 02 · 16 dtk | Lima penopang dan gaya vertikal | Pilar tengah ditarik 5,8–7 dtk; reaksi singkat mereda; jalur gaya ke tetangga digambar 8,2–10,7 | Struktur tetap berdiri; “Belum tentu” muncul 12–12,7 |
| 03 · 30 dtk | Pilar tengah sudah kosong, melanjutkan SC02 | Distribusi terlihat; indikator beban naik 11–19; retakan muncul 19,5–23,5 | Struktur beralih menjadi jaringan komponen 25–28,5 |
| 14 · 24 dtk | Kondisi kekosongan, Presiden | Dua calon muncul setelah garis usulan; jalur ke MPR; kalender 60 kotak | MPR memilih, dengan batas waktu untuk bersidang; bukan countdown peristiwa |
| 18 · 19 dtk | Mobil dan komponen yang diganti | Komponen lama keluar; komponen baru masuk; roda berjalan sekali; kamera mendekat; aliran tetap tersumbat dan temperatur naik | Hubungan penggantian komponen vs akar gangguan terlihat |

Rentang VO asli: 9–25, 25–55, 209–233, 291–310 detik. Total montage: 89 detik.
Montage melompat ke cuplikan lain; bukan master yang berjalan kontinu.
Timing visual masih mengikuti storyboard makro. Belum ada alignment per kata,
subtitle final, atau sound design baru. Indikator beban adalah ilustrasi tanpa nilai rekayasa.

## Pekerjaan untuk revisi master

| Scene | Perubahan yang dibutuhkan |
|---|---|
| 01 | Hook tanpa headline; skala dan tilt objek, sambungan komposisi ke SC02 |
| 02–03 | Terapkan contoh, sesuaikan pemicu gerak setelah listen-through VO |
| 04–05 | Dokumen bergerak dari pengirim ke tujuan; bedakan dua tahap pengiriman |
| 06 | Ruang informasi kosong dan peralihan mundur ke konteks, tanpa mengarang isinya |
| 07–08 | Dua jenis perkara yang terpisah; sorot batas pernyataan, bukan ikon fakta/klaim generik |
| 09 | Hilangkan inferensi otomatis dengan memutus hubungan visual; lanjut ke kursi kosong |
| 10 | Crane benar-benar memasang pilar; kamera memperlihatkan fondasi yang belum dibenahi |
| 11 | Tiga diagnosis berbeda: desain, pemeriksaan, distribusi; hubungan ke struktur |
| 12–13 | Tujuh node setara; jaringan berkembang; batas kewenangan dan konstitusi |
| 14 | Terapkan contoh setelah cek ulang overlay dan pemicu VO |
| 15–17 | Cabang berimbang; gelombang konflik mereda pada A, berkas tetap tertinggal pada B |
| 18 | Terapkan contoh mobil; sesuaikan penekanan pendingin dengan ucapan |
| 19 | Match-cut komponen ke sistem; penggantian tidak menghilangkan titik macet |
| 20 | Deteksi → perbaikan → pencegahan → fungsi pulih; tidak sekadar orbit |
| 21 | Dua kemungkinan menghasilkan kondisi sistem yang berbeda, lalu kembali ke pilar |
| 22 | Kursi, kunci, dan mandat berpindah secara konkret |
| 23 | Entitas berbeda melewati aturan yang sama; objek setara, tidak sekadar timbangan |
| 24 | Perbandingan dua hasil yang sudah dipahami; CTA setelah pertanyaan, lalu jeda baca |

## Menyiapkan / meninjau

`python3 editorial-engine/pipeline/gibran-mundur-2026/openfilm-v4/build.py`

Output terpisah di `editorial-engine/deliverables/gibran-mundur-2026/openfilm-motion-study-v4/`.
Kode sumber v4 tersimpan di folder pipeline ini; media dan hasil render diabaikan Git.
`build.py` tidak mengubah v3, ZIP, atau VO asli.

`review.mjs <folder-package-openfilm>` memeriksa 16 titik waktu dengan Chrome GUI:
akses acak menghasilkan screenshot identik, teks tidak keluar frame, dan tidak ada
error JavaScript. Gambar disimpan di folder `motion-v4-review/` untuk inspeksi manusia.

Chrome lokal dipilih oleh `scripts/openfilm-local-chrome.mjs`, adaptasi launcher dalam
memori khusus OpenFilm 0.3.2. Tidak ada paket npm yang dimodifikasi.

Panduan yang dipakai: `ANIMATION&MOTION.md`, storyboard visual, dan panduan `manual/edit/SKILL.md`
dari paket OpenFilm 0.3.2. Metode: SVG berlapis, path reveal, transform objek, dan `frame(t)` deterministik.

## Hasil render uji yang diserahkan

- **`gibran-motion-v4-review-32s.mp4`**: H.264 + AAC, 1920×1080, 30 fps, 32 detik, 960 frame, 3.130.516 byte.
- Montage aksi empat scene: SC02 lokal 5–13; SC03 lokal 14–22; SC14 lokal 6–14; SC18 lokal 9–17. VO memakai rentang sumber yang sama. Potongan bukan kalimat VO utuh dan bukan edit kontinu master.
- Dibangun dengan `build.py --compact`; proyek 89 detik tetap tersedia sebagai source untuk review di Studio.
- OpenFilm 0.3.2 memakai Google Chrome yang terpasang. Delapan chunk awal selesai dengan Chrome GUI; ekspor dilanjutkan memakai Chrome lokal dalam mode latar setelah tab GUI tertutup. Ini tidak memakai browser Chromium unduhan.
- Seluruh MP4 didecode FFmpeg tanpa error.
- `check-capture.py`: keempat tepi gambar terisi pada empat titik waktu; tidak ada padding hitam akibat capture GUI.
- `openfilm look ../gibran-motion-v4-review-32s.mp4 --full --loudness=-16`: semua frame diperiksa; **tidak terdeteksi white flash, jumping frame, still picture, atau black frame**.
- Frame dari keempat adegan hasil MP4 juga dilihat langsung. Contact sheet: `motion-v4-review/review-32s-contact.png`.
- Normalisasi render terukur -16,3 LUFS dan -1,7 dBTP. Belum ada penilaian sinkronisasi per kata atau klaim lulus QA editorial penuh.

### Masalah capture yang ditemukan dan diperbaiki

Ekspor 89 detik pertama dan kedua **gagal inspeksi visual** meskipun codec, durasi, dan decode valid: raw CDP screenshot bawaan OpenFilm dapat menangkap wilayah GUI yang terpotong/berskala salah. Menambahkan `captureBeyondViewport` saja belum menyelesaikan ekspor panjang. Adapter kini memakai `page.screenshot()` milik Playwright agar viewport disiapkan sebelum capture. Paket npm tetap tidak dimodifikasi.

File 89 detik bernama `gibran-motion-study-v4-invalid-capture.mp4` dan `gibran-motion-study-v4-chrome.mp4` bukan hasil untuk review. Gunakan **file 32 detik** di atas. Peringatan still-picture dari file gagal tersebut tidak dipakai untuk menilai ritme animasi.

### Batas hasil saat ini

Empat contoh belum menggantikan 24 scene master. Masih perlu listen-through VO, sinkronisasi beat pada kata/frasa, pengembangan adegan lain, transisi antarscene, subtitle, dan sound design. Lulus pemeriksaan frame bukan bukti bahwa gaya sudah memenuhi harapan pengguna; montage diserahkan sebagai bahan penilaian kreatif.
