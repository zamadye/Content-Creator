# Standar minimum produksi — Dunia Kebalik

**Berlaku mulai 7 November 2026;** menggantikan standar editorial lama yang bertentangan. Acuan kreatif: [Riset storytelling Dunia Kebalik](RISET-STORYTELLING-DUNIA-KEBALIK.md). Standar ini adalah daftar kebutuhan dan gerbang, bukan bukti bahwa sebuah video telah lulus.

## 1. Lingkup dan keputusan

- **Format:** Shorts vertikal berbahasa Indonesia, memakai satu narasi perempuan `voice-05`, musik yang mendukung, subtitle, Host dan benda konkret. Fokus pada fakta yang tidak intuitif namun dapat diverifikasi.
- **Target kerja:** tiga konten dalam jendela 07.30–08.30, 11.30–13.00 dan 19.00–20.00 WIB. Target ini tidak menjamin frekuensi atau jangkauan dan tidak membolehkan melewati QA.
- **Durasi:** ditentukan oleh naskah yang telah diuji baca dan kebutuhan cerita. Untuk Facebook Reels melalui Buffer, rujukan yang diperiksa menyatakan **3–90 detik**; periksa lagi sebelum publikasi karena platform dapat berubah. Jangan menjadikan 85–95 detik sebagai target universal atau mempercepat suara sampai tak nyaman. Batas format platform lain dicek pada saat digunakan.
- **Izin:** jadwal kerja bukan izin membuat/mengubah posting. Butuh persetujuan eksplisit untuk publikasi/penjadwalan dan akses publik sementara. Jarak minimal dua jam kecuali ada pengecualian yang disetujui untuk posting/waktu tertentu. Pengecualian 7 November tidak berlaku otomatis pada hari lain.

## 2. Tujuh gate, dengan bukti

1. **Riset:** sumber primer/otoritatif, URL dan tanggal, definisi, periode, angka, mekanisme, keterbatasan dan klaim yang tidak boleh dibuat. Setiap klaim dalam narasi/visual/caption harus bisa ditelusuri. Berhenti jika bukti tidak cukup.
2. **Cerita & naskah:** headline → tagline/thumbnail → gambar pertama → kalimat pembuka selaras. Ada pertanyaan nyata, perkembangan berbasis petunjuk, belokan yang disiapkan dan penjelasan/penutup yang memenuhi janji. Baca keras, perbaiki napas, rujukan dan irama; tidak ada satu template jumlah scene atau jumlah kata yang wajib.
3. **Storyboard & desain:** untuk setiap kalimat, tentukan objek konkret, tempat, tindakan Host dan fungsi visual. Setiap scene memuat setidaknya dua objek dalam `objectMap`; benda dapat berubah bentuk/posisi untuk menjelaskan, bukan sekadar latar. Host konsisten dengan referensi, ekspresi/tangan/mulut bergerak sesuai aksi. Maksimal dua keluarga font, teks kontras, tidak menutupi wajah. Ilustrasi/rekonstruksi tidak berpura-pura sebagai bukti dokumenter.
4. **Media & perakitan:** satu narasi, subtitle bermakna, musik yang sesuai tanpa menutupi suara, lingkungan dan gerak variatif. Frame 0 sudah terbaca; thumbnail PNG terpisah dibuat sebagai desain tersendiri, bukan screenshot. Penutup visual persis huruf kecil **`ikuti knot theory`** dan narasi membacanya sebagai kata-kata.
5. **QA manusia:** cocokkan fakta/visual, dengarkan seluruh video (termasuk pelafalan CTA), periksa emosi, musik, sinkron subtitle, keterbacaan/safe area dan gerak pada ponsel. Minta orang yang belum tahu topik mengulang inti cerita jika tersedia. `NOT TESTED` bila pemeriksa/perangkat belum tersedia; jangan menukar status dengan hitungan frame atau loudness.
6. **QA teknis & hak:** ukur spesifikasi, decode, frame/rasio, durasi, loudness dan puncak, hasil ekspor serta keutuhan file. Periksa hak media, musik, suara dan izin penggunaan; catat jika belum pasti. Pengujian teknis hanya membuktikan bagian yang diuji.
7. **Paket, cadangan & publikasi:** simpan MP4, PNG thumbnail mandiri, caption/hashtag siap tempel untuk FB, TikTok, YouTube dan Instagram, subtitle, catatan sumber/QA serta source modular. Untuk prototipe sertakan poster 4:5 dan laporan. Unggah ke Drive privat, periksa ukuran/hash/izin dan uji unduhan/pemulihan sesuai kebijakan cadangan. Posting hanya setelah izin; konfirmasi secara read-only, lalu bedakan `scheduled` dari `sent` dan cek playback bila mungkin.

Setiap gate ditandai **PASS / FAIL / NEEDS REVIEW / NOT TESTED** dan dicatat buktinya sebagai **VERIFIED / TESTED / LIKELY / ASSUMPTION / UNKNOWN**. Gate faktual, hak dan kualitas yang belum diverifikasi tidak otomatis lulus karena mesin merender sukses.

## 3. Alur modular dan batas

| Komponen | Masukan → keluaran | Cara / penanganan |
|---|---|---|
| Riset | Pertanyaan + sumber primer → kartu klaim & batas | Cari informasi yang dapat membantah premise; jika ragu, sempitkan atau hentikan. |
| Naskah/storyboard | Kartu klaim → narasi, `objectMap`, daftar adegan | Uji sekali dengar, perkembangan sebab-akibat dan petunjuk twist; revisi sebelum media. |
| Voice & ilustrasi privat | Naskah final + referensi → satu file suara + aset visual | Simpan di Drive privat. Hak dan kecocokan belum otomatis terbukti. Jangan memakai Coverr lagi tanpa izin; bila disetujui gunakan API yang diotorisasi, bukan scraping situs. |
| Render lokal | Source/pipeline + input privat + font/dependensi → MP4, still, PNG, subtitle perkiraan | Contoh yang dipertahankan ada di `editorial-engine/pipeline/hiu-sebelum-hutan-2026/` dan `interactive-antartika-v2/`; baca README khusus. FFmpeg/headless butuh CPU/disk. Input hilang = pulihkan cadangan, bukan membuat klaim selesai. |
| QA & arsip | Media + source → laporan, checksums, paket privat | Perbaiki `FAIL`; pemeriksaan suara, ponsel, sinkron dan lisensi tetap manusia. Uji pemulihan terpisah. |
| Publikasi disetujui | Paket lolos + izin + verifikasi jadwal → hasil API & status | Workflow khusus episode bukan izin umum. Periksa status terlebih dulu bila hasil tidak pasti; jangan mengulang create secara buta. Tarik akses publik salinan setelah semua posting yang membutuhkan terverifikasi terbit. |

Dua pipeline di atas mempertahankan materi dan input yang sebelumnya disetujui, tetapi sumber tersebut bukan sistem produksi universal atau bukti semua render di mesin baru telah diuji. Primitif ilustrasi generik dan font dipertahankan sebagai referensi; integrasi ulang ke episode baru perlu diuji.

## 4. Privasi dan keberlanjutan

Media, file kunci, kredensial dan tautan sementara tidak masuk Git publik. Simpan hasil dan backup media di Drive privat; periksa izin tiap file/folder. Source/naskah/dokumen nonrahasia boleh di-checkpoint dan di-push hanya ke branch sesi yang disetujui. Commit lokal bukan cadangan eksternal. Lihat [kebijakan anti-reset](KEBIJAKAN-CADANGAN-ANTI-RESET.md).

File yang dihapus dari tree Git masih berada di riwayat; pembersihan ini bukan penghapusan permanen. Drive Trash berbeda dari hapus permanen dan tidak otomatis mencabut sharing. Jangan kosongkan Trash atau mengubah izin media aktif tanpa dasar/izin yang tepat.
