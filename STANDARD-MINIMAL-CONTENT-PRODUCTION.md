# Standar minimum produksi — Dunia Kebalik

**Berlaku mulai 7 November 2026; diperbarui 8 November 2026.** Menggantikan standar editorial lama yang bertentangan. Acuan kreatif: [Riset storytelling Dunia Kebalik](RISET-STORYTELLING-DUNIA-KEBALIK.md). Standar ini adalah daftar kebutuhan dan gerbang, bukan bukti bahwa sebuah video telah lulus.

## 1. Lingkup dan keputusan

- **Format:** Shorts vertikal berbahasa Indonesia, memakai satu narasi perempuan `voice-05`, musik yang mendukung, subtitle, Host dan benda konkret. Fokus pada fakta yang tidak intuitif namun dapat diverifikasi.
- **Target kerja:** tiga konten dalam jendela 07.30–08.30, 11.30–13.00 dan 19.00–20.00 WIB. Target ini tidak menjamin frekuensi atau jangkauan dan tidak membolehkan melewati QA.
- **Durasi:** ditentukan oleh naskah yang telah diuji baca dan kebutuhan cerita. Untuk Facebook Reels melalui Buffer, rujukan yang diperiksa menyatakan **3–90 detik**; periksa lagi sebelum publikasi karena platform dapat berubah. Jangan menjadikan 85–95 detik sebagai target universal atau mempercepat suara sampai tak nyaman. Batas format platform lain dicek pada saat digunakan.
- **Penjadwalan:** pengguna mengarahkan agar setiap video baru yang siap dikirim untuk dijadwalkan langsung ke **Buffer**, bukan ditahan untuk cron GitHub. Gunakan izin umum ini ketika platform dan waktu sesuai arahan pengguna sudah jelas dan gate QA terpenuhi; jangan menganggapnya sebagai persetujuan atas draft lama yang masih menunggu review, perubahan post lama, atau tayang segera. Akses publik untuk salinan media tetap memerlukan persetujuan tersendiri. Jarak minimal dua jam kecuali ada pengecualian yang disetujui untuk posting/waktu tertentu; pengecualian 7 November tidak berlaku otomatis pada hari lain.
- **Label AI untuk upload berikutnya:** sesuai preferensi pengguna, jangan aktifkan label AI secara sukarela bila platform tidak mewajibkannya. Ini berlaku pada setiap platform dan setiap upload baru; bukan pernyataan bahwa AI tidak digunakan. Posting yang sudah terbit atau terjadwal tidak diubah otomatis.
- **Gate pengungkapan:** sebelum upload, tinjau isi visual, suara, musik, jenis posting dan aturan terkini tiap platform. Jika label/pengungkapan diwajibkan atau statusnya belum jelas, **tahan upload**, beri tahu pengguna, dan minta keputusan untuk memenuhi kewajiban atau merevisi konten. Jangan membuat pernyataan yang tidak benar atau mengakali metadata; platform juga dapat menerapkan label otomatis yang tidak selalu bisa dilepas.

  Rujukan untuk dicek kembali: [YouTube: pengungkapan GenAI](https://support.google.com/youtube/answer/14328491?hl=en), [TikTok: konten buatan AI](https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content), dan [Meta: identifikasi konten AI](https://about.fb.com/news/2026/02/meta-prepares-for-2026-us-midterms/). Animasi tidak otomatis membebaskan pemeriksaan atas suara atau elemen lain.

### Struktur cerita wajib: klimaks di awal

Mulai dari **entitas utama yang langsung terlihat sejak frame 0**—objek, makhluk, karakter atau fenomena—di dalam cuplikan momen puncak yang benar-benar berhubungan dengan cerita. **Kalimat narasi pertama** adalah pertanyaan spesifik, fakta terverifikasi atau situasi konkret yang menimbulkan rasa ingin tahu; bukan salam atau perkenalan kanal. Targetkan pembuka 1–3 detik sebagai arahan kreatif pengguna, tanpa mengorbankan kejelasan suara/gambar.

Ketika muncul pertanyaan seperti “apa yang terjadi?” atau “bagaimana bisa?”, **cut sebelum penjelasan tuntas**, lalu baru mulai cerita dari konteks/tindakan yang relevan. Kembangkan petunjuk dan sebab-akibat, kembali ke momen puncak, jawab pertanyaannya, dan beri penutup yang berkesan. Gunakan satu kilas puncak singkat dan satu alur utama, bukan dua linimasa yang bersaing. Jangan mengarang peristiwa atau menunda penjelasan tanpa memberi nilai demi cliffhanger.

Pola ini wajib untuk produksi dan revisi berikutnya; contoh lama adalah referensi, bukan pengecualian otomatis, dan posting yang sudah terbit/terjadwal tidak diubah. Detail, contoh, isian storyboard dan QA ada pada [standar opening](editorial-engine/docs/STANDAR-OPENING-KLIMAKS-DI-AWAL.md). Efektivitasnya pada audiens masih perlu diuji dan tidak dijamin.

## 2. Tujuh gate, dengan bukti

1. **Riset:** sumber primer/otoritatif, URL dan tanggal, definisi, periode, angka, mekanisme, keterbatasan dan klaim yang tidak boleh dibuat. Setiap klaim dalam narasi/visual/caption harus bisa ditelusuri. Berhenti jika bukti tidak cukup.
2. **Cerita & naskah:** headline → tagline/thumbnail → entitas dan cuplikan puncak pada gambar pertama → kalimat pembuka yang menarik harus selaras. Tandai pertanyaan yang muncul, titik cut, awal cerita, perkembangan/petunjuk, kembali ke puncak dan jawaban yang memenuhi janji. Baca keras, perbaiki napas, rujukan dan irama; tidak ada satu template jumlah scene atau jumlah kata yang wajib.
3. **Storyboard & desain:** catat entitas frame 0, cuplikan puncak, cut, awal cerita dan adegan jawaban. Untuk setiap kalimat, tentukan objek konkret, tempat, tindakan Host dan fungsi visual. Setiap scene memuat setidaknya dua objek dalam `objectMap`; benda dapat berubah bentuk/posisi untuk menjelaskan, bukan sekadar latar. Tambahkan relasi **pelaku → aksi/kontak → perubahan**, keadaan sebelum/sesudah, dan kontinuitas objek saat kembali ke puncak. Gunakan gerak sebab-akibat yang bermakna, dengan penampang dan panah diberi label skema jika bukan pengamatan; lihat [metode visual sebab-akibat](editorial-engine/docs/METODE-VISUAL-SEBAB-AKIBAT.md). Host konsisten dengan referensi, ekspresi/tangan/mulut bergerak sesuai aksi. Maksimal dua keluarga font, teks kontras, tidak menutupi wajah atau subjek penting. Ilustrasi/rekonstruksi tidak berpura-pura sebagai bukti dokumenter.
4. **Media & perakitan:** satu narasi, subtitle bermakna, musik yang sesuai tanpa menutupi suara, lingkungan dan gerak variatif. Frame 0 sudah terbaca; thumbnail PNG terpisah dibuat sebagai desain tersendiri, bukan screenshot. Penutup visual persis huruf kecil **`ikuti knot theory`** dan narasi membacanya sebagai kata-kata.
5. **QA manusia:** cocokkan fakta/visual, tonton dan dengarkan seluruh video: entitas frame 0, kalimat pertama, cuplikan puncak, cut, awal cerita, jawaban dan pelafalan CTA. Periksa kejelasan, emosi, musik, sinkron subtitle, keterbacaan/safe area dan gerak pada ponsel. Minta orang yang belum tahu topik mengulang pertanyaan dan inti cerita jika tersedia. `NOT TESTED` bila pemeriksa/perangkat belum tersedia; jangan menukar status dengan hitungan frame atau loudness.
6. **QA teknis & hak:** ukur spesifikasi, decode, frame/rasio, durasi, loudness dan puncak, hasil ekspor serta keutuhan file. Periksa hak media, musik, suara dan izin penggunaan; catat jika belum pasti. Pengujian teknis hanya membuktikan bagian yang diuji.
7. **Paket, cadangan & penjadwalan:** simpan MP4, PNG thumbnail mandiri, caption/hashtag siap tempel untuk FB, TikTok, YouTube dan Instagram, subtitle, catatan sumber/QA serta source modular. Untuk prototipe sertakan poster 4:5 dan laporan. Unggah ke Drive privat, periksa ukuran/hash/izin dan uji unduhan/pemulihan sesuai kebijakan cadangan. Kirim video baru yang siap ke Buffer sesuai izin umum dan jadwal yang jelas; konfirmasi secara read-only, bedakan `scheduled` dari `sent` dan cek playback bila mungkin.

Setiap gate ditandai **PASS / FAIL / NEEDS REVIEW / NOT TESTED** dan dicatat buktinya sebagai **VERIFIED / TESTED / LIKELY / ASSUMPTION / UNKNOWN**. Gate faktual, hak dan kualitas yang belum diverifikasi tidak otomatis lulus karena mesin merender sukses.

## 3. Alur modular dan batas

| Komponen | Masukan → keluaran | Cara / penanganan |
|---|---|---|
| Riset | Pertanyaan + sumber primer → kartu klaim & batas | Cari informasi yang dapat membantah premise; jika ragu, sempitkan atau hentikan. |
| Naskah/storyboard | Kartu klaim → pembuka puncak + cut, narasi, `objectMap`, daftar adegan | Isi entitas frame 0, kalimat pertama, cut, awal cerita, kembali ke puncak dan jawaban; uji sekali dengar, sebab-akibat dan petunjuk; revisi sebelum media. |
| Voice & ilustrasi privat | Naskah final + referensi → satu file suara + aset visual | Simpan di Drive privat. Hak dan kecocokan belum otomatis terbukti. Jangan memakai Coverr lagi tanpa izin; bila disetujui gunakan API yang diotorisasi, bukan scraping situs. |
| Render lokal | Source/pipeline + input privat + font/dependensi → MP4, still, PNG, subtitle perkiraan | Contoh yang dipertahankan ada di `editorial-engine/pipeline/hiu-sebelum-hutan-2026/` dan `interactive-antartika-v2/`; baca README khusus. FFmpeg/headless butuh CPU/disk. Input hilang = pulihkan cadangan, bukan membuat klaim selesai. |
| QA & arsip | Media + source → laporan, checksums, paket privat | Perbaiki `FAIL`; pemeriksaan suara, ponsel, sinkron dan lisensi tetap manusia. Uji pemulihan terpisah. |
| Penjadwalan Buffer | Paket baru siap + waktu/kanal jelas + izin salinan + QA → hasil API & status | Satu Action dapat memproses satu batch; Buffer menyimpan jadwal dan menangani waktu tayang, bukan cron GitHub. Periksa status terlebih dulu bila hasil tidak pasti; jangan mengulang create secara buta. Pertahankan URL media hingga semua posting terkait terverifikasi terbit, lalu cabut akses salinan. |

Dua pipeline di atas mempertahankan materi dan input yang sebelumnya disetujui, tetapi sumber tersebut bukan sistem produksi universal atau bukti semua render di mesin baru telah diuji. Primitif ilustrasi generik dan font dipertahankan sebagai referensi; integrasi ulang ke episode baru perlu diuji.

## 4. Privasi dan keberlanjutan

Media, file kunci, kredensial dan tautan sementara tidak masuk Git publik. Simpan hasil dan backup media di Drive privat; periksa izin tiap file/folder. Source/naskah/dokumen nonrahasia boleh di-checkpoint dan di-push hanya ke branch sesi yang disetujui. Commit lokal bukan cadangan eksternal. Lihat [kebijakan anti-reset](KEBIJAKAN-CADANGAN-ANTI-RESET.md).

File yang dihapus dari tree Git masih berada di riwayat; pembersihan ini bukan penghapusan permanen. Drive Trash berbeda dari hapus permanen dan tidak otomatis mencabut sharing. Jangan kosongkan Trash atau mengubah izin media aktif tanpa dasar/izin yang tepat.
