# Audit sebelum render penuh — Gibran Mundur

**Arsip audit v3.** Temuan utama telah ditindaklanjuti dalam master v5; lihat
[laporan perbaikan](../openfilm-master/STATUS-V5.md). Tabel di bawah mempertahankan
bukti kondisi sebelum perbaikan, bukan status master terbaru.

**Keputusan: master saat ini BELUM SIAP untuk render final.**

Audit dilakukan terhadap `openfilm-full/film.html` dan seluruh 24 page scene
yang benar-benar akan dipakai script render, bukan terhadap montage v4.
Arah penilaian: explainer teknis, ilustrasi presisi, diagram berkembang,
transformasi objek, dan gerak yang menjelaskan sebab–akibat.

## Bukti dan batas pemeriksaan

- Sumber waktu asli: **`Timpstamp Gibran Mundur.docx`** yang tersedia di root proyek. Berisi 25 blok ucapan untuk 24 scene, karena SC18 memiliki dua blok. Outro nol detik diabaikan.
- Pembanding: `content/gibran-mundur/timeline.json`, storyboard visual, dan `ANIMATION&MOTION.md`.
- VO aktual diprobe: **434,991 detik**, MP3 mono 44,1 kHz. Timeline master berakhir tepat pada 434,991 detik; timestamp DOCX membulatkan akhir ke 7:15. Selisih 9 ms lebih kecil dari satu frame 30 fps.
- Seluruh 24 scene dibuka melalui host OpenFilm dengan Google Chrome lokal; 3 titik waktu per scene (12%, 50%, 88% durasi), total **72 frame**. Enam contact sheet telah dilihat langsung.
- Gambar tengah tiap scene diperiksa lagi setelah seek ke waktu lain: **24/24 deterministik pada sampel yang diperiksa**.
- Pemeriksaan teknis tidak menemukan error host pada sampel. Dokumen/teks terpotong ditemukan pada **SC04–SC08**.
- Kode gerak seluruh scene diperiksa untuk mengetahui objek apa yang benar-benar berubah, termasuk aksi yang tidak dapat dibuktikan dari satu gambar.
- **Ini bukan listen-through audio per kata atau peninjauan seluruh 13.050 frame master.** DOCX berisi rentang ucapan, bukan timestamp tiap frasa/kata. Kecocokan rentang tidak membuktikan aksi sinkron dengan ucapan.
- Audit ini menilai waktu dan visual; tidak menyatakan kebenaran faktual/hukum naskah sudah diverifikasi.

## Audit waktu

**23/24 awal scene cocok dengan awal blok DOCX.** SC19 masuk satu detik terlalu awal.
Semua 24 slot cocok dengan `timeline.json`, sehingga kesalahan SC19 juga ada dalam timeline lokal.
Tidak ditemukan celah/overlap antar-slot gambar; tetapi kontinuitas gambar tidak sama dengan sinkronisasi narasi.

Ada **10 jeda satu detik** pada DOCX. Sembilan ditutup dengan hold adegan sebelumnya.
Satu lagi, 5:10–5:11, justru diisi dengan masuknya SC19 lebih awal.
Catatan lama yang menyebut hanya sembilan jeda belum menghitung jeda ini.

Perbaikan yang disarankan untuk SC18–19: tahan akhir SC18 sampai 5:11,
mulai SC19 pada 5:11, pertahankan akhir slot SC19 pada 5:23.
Durasi page/timeline yang terkait harus diperbarui bersama; jangan hanya menggeser audio.

| Scene | Rentang sumber DOCX | Slot master aktual | Hasil waktu |
|---|---|---|---|
| 01 | 0:00–0:09 | 0:00–0:09 | Awal/akhir cocok |
| 02 | 0:09–0:25 | 0:09–0:25 | Awal/akhir cocok |
| 03 | 0:25–0:54 | 0:25–0:55 | Hold akhir 1 dtk |
| 04 | 0:55–1:10 | 0:55–1:11 | Hold akhir 1 dtk |
| 05 | 1:11–1:23 | 1:11–1:24 | Hold akhir 1 dtk |
| 06 | 1:24–1:38 | 1:24–1:38 | Awal/akhir cocok |
| 07 | 1:38–1:53 | 1:38–1:54 | Hold akhir 1 dtk |
| 08 | 1:54–2:08 | 1:54–2:08 | Awal/akhir cocok |
| 09 | 2:08–2:25 | 2:08–2:25 | Awal/akhir cocok |
| 10 | 2:25–2:37 | 2:25–2:37 | Awal/akhir cocok |
| 11 | 2:37–3:05 | 2:37–3:05 | Awal/akhir cocok |
| 12 | 3:05–3:20 | 3:05–3:20 | Awal/akhir cocok |
| 13 | 3:20–3:29 | 3:20–3:29 | Awal/akhir cocok |
| 14 | 3:29–3:52 | 3:29–3:53 | Hold akhir 1 dtk |
| 15 | 3:53–4:07 | 3:53–4:07 | Awal/akhir cocok |
| 16 | 4:07–4:27 | 4:07–4:28 | Hold akhir 1 dtk |
| 17 | 4:28–4:50 | 4:28–4:51 | Hold akhir 1 dtk |
| 18 | 4:51–4:58 + 4:58–5:10 | 4:51–5:10 | Dua fase ucapan harus dibedakan |
| 19 | 5:11–5:22 | **5:10–5:23** | **Masuk 1 dtk terlalu awal**, lalu hold akhir 1 dtk |
| 20 | 5:23–5:46 | 5:23–5:46 | Awal/akhir cocok |
| 21 | 5:46–6:11 | 5:46–6:11 | Awal/akhir cocok |
| 22 | 6:11–6:19 | 6:11–6:19 | Awal/akhir cocok |
| 23 | 6:19–6:42 | 6:19–6:43 | Hold akhir 1 dtk |
| 24 | 6:43–7:15 | 6:43–7:14,991 | Cocok dengan akhir VO aktual |

Hold tidak otomatis salah; ini cara menutup jeda tanpa black frame.
Namun, jeda pada DOCX belum membuktikan hening aktual di rekaman: perlu listen-through
sebelum mengunci cut dan memastikan tidak ada kata yang terpotong.

## Audit animasi semua scene

**Tidak ada scene master yang dinyatakan final/profesional dari audit ini.**
Masing-masing masih mempunyai ketidaksesuaian visual spesifik di bawah.
Beberapa ide dasarnya dapat dipakai kembali; masalahnya bukan semua objek harus dibuat ulang.

| SC | Temuan pada implementasi aktual | Perbaikan yang diperlukan sebelum final |
|---|---|---|
| 01 | Plate gedung terbaca, tetapi headline muncul setelah 1,2 dtk. Hook storyboard meminta tanpa judul; perpindahan ke ilustrasi datar belum disambungkan. | Pertahankan pembukaan visual; siapkan sambungan bentuk/perspektif ke pilar SC02. |
| 02 | Pilar tengah menghilang dan panah muncul; aksi dasar ada. Retak ditampilkan meski beat ini menekankan struktur tetap berdiri. Pemicunya memakai angka tetap, bukan hasil alignment ucapan. | Sinkronkan hilangnya pilar, pertanyaan, dan “Belum tentu”; tampilkan redistribusi sebelum memasuki risiko kerusakan di SC03. |
| 03 | **Pilar yang hilang muncul lagi** pada awal scene: seluruh `.column` kembali opacity 1. Tidak ada indikator kapasitas/kenaikan beban yang diminta; retak muncul pada diagram lima pilar. | Teruskan keadaan akhir SC02; distribusi → peningkatan beban → batas → retakan → konteks berikutnya. |
| 04 | Dua dokumen bergeser keluar kiri/atas. Pada frame tengah, bbox dokumen sekitar x=-344,6, y=-359,0. Panah tidak berakhir di lembaga penerima. | Pisahkan transform posisi dan gerak; bangun pengiriman surat ke penerima yang jelas. |
| 05 | Mengulang gambar SC04, dokumen tetap terpotong, dua tujuan tidak diperlihatkan. | Bedakan tahap pengiriman ke Presiden/MPR secara eksplisit; tanpa mengarang dokumen asli. |
| 06 | Mengulang pengiriman surat; tidak ada pengungkapan kolom alasan kosong, pertanyaan, atau rewind yang diminta. Dokumen terpotong. | Tunjukkan informasi yang tidak diisi dan transisi mundur ke konteks. |
| 07 | Dokumen terpotong; yang tampak hanya dua badge FAKTA/KLAIM. Identitas dua jenis perkara yang diminta tidak hadir. | Pisahkan dua konteks dokumen/perkara, beri label yang tepat dan urutan muncul. |
| 08 | Sama dengan SC07; batas antara isi putusan dan klaim tambahan tidak berkembang menjadi penjelasan visual. | Gunakan highlight/seleksi isi dan batas pernyataan; perbaiki komposisi dokumen. |
| 09 | Simbol ≠ membantu, tetapi palang timbangan berputar sementara rantai/mangkuk tetap diam; mekanisme tidak koheren. Kursi kosong tidak hadir. | Satukan hierarki gerak timbangan atau gunakan pemisahan konsep; lanjutkan ke kekosongan posisi. |
| 10 | Gedung utuh, pilar pengganti/crane tidak ditampilkan di scene ini. Tidak terjadi pemasangan pilar. | Buat pengangkatan, penurunan, kontak dan settling pilar; sorot fondasi sebagai pertanyaan berikutnya. |
| 11 | Crane/pilar pengganti ada di scene ini tetapi statis; tiga diagnosis hanya tertulis pada footer. | Tiga beat berbeda untuk desain, pemeriksaan, dan distribusi; perlihatkan hubungan sebab–akibatnya. |
| 12 | Hanya empat node: NEGARA, PRESIDEN, MPR, LEMBAGA; bukan tujuh entitas yang disebut. Semua sudah terlihat sejak awal, tidak masuk mengikuti penjelasan. | Hadirkan tujuh entitas sesuai ucapan, bobot visual setara, hubungan digambar bertahap. |
| 13 | Mengulang empat node SC12; tidak ada cincin KONSTITUSI atau batas kewenangan yang berkembang. | Pertahankan jaringan yang lengkap, lalu gambar batas dan ring konstitusi sebagai keadaan baru. |
| 14 | Hanya linimasa HARI 0–60 dan badge 60 HARI yang mengambang; Presiden, dua calon, serta MPR memilih tidak ditampilkan. | Tampilkan alur pelaku → calon → pemilihan, kondisi kekosongan, dan kalender; cocokkan label akhir dengan storyboard. |
| 15 | Dua kartu sudah langsung muncul; tidak ada transisi dari mekanisme ke dua sudut pandang. | Bentuk percabangan dan pemisahan fokus secara berimbang. |
| 16 | Sama dengan SC15; tidak ada konflik yang mereda atau keadaan pemerintahan kembali bekerja. | Buat perubahan konflik → penurunan gangguan → ruang kerja stabil, dengan label sudut pandang. |
| 17 | Sama dengan SC15–16; berkas yang tertinggal, kursi kosong, dan prosedur belum selesai tidak hadir. | Tunjukkan orang/posisi dapat berganti tetapi berkas/prosedur tetap memerlukan tindak lanjut. |
| 18 | Gearbox dan jarum berosilasi sejak awal; tidak ada komponen yang diganti, mobil berjalan, radiator, atau aliran terputus. Dua fase timestamp tidak diikuti. | 4:51–4:58: kerusakan → ganti komponen → berjalan. Mulai 4:58: ungkap pendingin → hambatan → risiko berulang. |
| 19 | Gearbox sama dengan SC18 tanpa transformasi ke mekanisme institusi. Masuk satu detik terlalu awal. | Perbaiki cut ke 5:11; match-cut komponen ke institusi dan perlihatkan mekanisme yang tetap bermasalah. |
| 20 | Empat node bertuliskan PULIH/ADAPTASI/LANJUT/BERFUNGSI; aksi deteksi, perbaikan, pencegahan tidak terjadi. Titik bergerak juga tidak mengikuti lintasan orbit yang digambar. | Gunakan jalur dan posisi partikel yang konsisten; gangguan → deteksi → tindakan koreksi → pengaman → fungsi pulih. |
| 21 | Hanya mengulang gedung lima pilar. Dua kemungkinan yang menjadi pertanyaan utama tidak terlihat. | Bandingkan sistem diperbaiki vs komponen saja diganti, lalu wide reveal struktur. |
| 22 | Kursi mengambang; tidak ada kunci/penyerahan mandat atau perubahan pemilikan yang diminta. | Gerak kunci/mandat dan perpindahan fokus yang konkret; akhiri pada posisi stabil. |
| 23 | Timbangan statis dengan judul berulang; satu nama/keluarga/kelompok dan aturan yang sama tidak divisualkan. | Tiga entitas berbeda melewati satu aturan yang sama dengan bobot visual setara. |
| 24 | Bubble komentar/cursor berjalan dengan loop selama hampir 32 dtk. Dua opsi, pergantian ke kalimat refleksi, dan outro tidak dikoreografikan. | Pecah pertanyaan → dua pilihan → ajakan komentar → refleksi → penutup; cocokkan tiap beat ke ucapan. |

### Masalah berulang yang membuat kualitas belum memadai

- Posisi `.float` dari `translate(x,y) rotate(...)` ditimpa `translate(0,sin(...))`; ini kegagalan tata letak, bukan soal selera.
- SC02 → SC03 mengembalikan pilar yang baru dihilangkan; kontinuitas keadaan cerita rusak.
- Template kamera yang sama (zoom awal, perubahan skala di akhir), sinyal sinus, debu dan garis bergerak dipakai di banyak scene. Gerak sekunder sering lebih dominan daripada aksi penjelasan.
- SC15–17 dan SC18–19 secara praktis mengulang gambar dasar meski narasinya berubah.
- Kriteria kegagalan kritis pada `ANIMATION&MOTION.md` berlaku: pergerakan yang didominasi zoom/gerak dekoratif tanpa perkembangan bermakna tidak lulus. Karena itu tidak diberikan angka skor “profesional” yang seolah objektif.
- Tidak ada track subtitle atau cue sound-effect pada master; hanya VO. Sinkronisasi sound–motion belum bisa dinyatakan selesai.

## Status contoh v4 terhadap master

Empat contoh v4 ada di proyek terpisah dan **belum diterapkan pada master**.
Lolos QA teknis montage 32 detik tidak membuktikan 24 scene master sudah direvisi.
Koreografi mobil v4 juga belum final: source memakai reveal pendingin lokal 8,8 dtk
(4:59,8), sementara blok penjelasan pendingin mulai 4:58. Itu 1,8 detik setelah
awal blok, sehingga perlu dicocokkan lagi dengan frasa sebenarnya.
Awal blok bukan timestamp pasti kata “pendingin”; jangan menganggap selisih itu bukti
lag per kata tanpa listen-through.

## Urutan perbaikan sebelum render penuh

1. Benahi cut SC18–19 dan tetapkan kebijakan hold untuk seluruh 10 jeda sumber.
2. Perbaiki clipping SC04–08, kontinuitas pilar SC02–03, serta hierarki gerak timbangan.
3. Buat aksi yang hilang pada setiap scene menurut tabel, dengan gaya explainer teknis yang sudah dipilih.
4. Terapkan revisi ke **satu master 24 scene**, tidak hanya ke montage contoh.
5. Listen-through VO, catat waktu frasa pemicu, lalu geser cue aksi; khusus SC18 gunakan batas internal 4:58 sebagai patokan awal.
6. Periksa awal/akhir cut dan transisi pada master yang sudah direvisi, lalu render uji pendek dengan audio sebelum ekspor penuh.

**Tidak ada render penuh yang dijalankan selama audit ini.** Master, VO, dan DOCX asli tidak diubah.

## Berkas bukti

Di folder lokal `editorial-engine/deliverables/gibran-mundur-2026/audit-full/`:

- `timestamp-audit.json`: hasil perbandingan DOCX, timeline, actual film, dan hash sumber.
- `scene-inspection.json`: waktu global/lokal, bbox dokumen/teks, jumlah node, dan hasil determinisme.
- `frame-000.png`–`frame-071.png`: capture aktual dari page scene.
- `sheet-01.png`–`sheet-06.png`: contact sheet SC01–04, 05–08, 09–12, 13–16, 17–20, 21–24.

Script reproduksi berada di folder audit ini: `check-timestamps.py` dan `inspect-scenes.mjs`.
Pemeriksaan membutuhkan DOCX lokal, proyek hasil ekstraksi, FFprobe, OpenFilm 0.3.2,
dan Chrome. Tidak perlu akses Drive untuk mengulang audit dengan DOCX yang sudah tersedia.
