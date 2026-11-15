# Opening hook — salinan SC21

**Dipilih: cuplikan SC21, bukan seluruh scene 25 detik.**
Pertanyaannya adalah konflik utama episode: sistem memperbaiki diri, atau hanya
berganti komponen? Visual dua mekanisme memperlihatkan dua kemungkinan secara
langsung. Penjelasannya kemudian dibangun lewat analogi pilar, mekanisme negara,
pendingin mobil, dan kembali ke SC21. Penilaian ini keputusan kreatif, bukan bukti
bahwa retensi penonton pasti meningkat.

## Pemeriksaan 24 scene

| SC | Kecocokan sebagai opening |
|---|---|
| 01 | Orientasi gedung; visual kuat tetapi belum menunjukkan konflik. Dipertahankan sebagai awal cerita setelah hook. |
| 02 | Pertanyaan fisik jelas; kandidat kedua untuk versi yang menonjolkan analogi bangunan, tetapi belum merangkum konflik sistem. |
| 03 | Beban/retak memberi tensi; berisiko terasa seperti video keruntuhan jika tanpa konteks analogi. |
| 04 | Entitas/peristiwa konkret; lebih berfungsi sebagai konteks berita daripada pertanyaan utama explainer. |
| 05 | Pengiriman surat melanjutkan peristiwa, membutuhkan konteks SC04. |
| 06 | Kekosongan alasan menimbulkan pertanyaan, tetapi benda dan keputusannya belum dikenali penonton baru. |
| 07 | Jenis perkara perlu pengantar; bukan momen puncak. |
| 08 | Batas kesimpulan penting tetapi belum memberikan entitas/konflik yang konkret di awal. |
| 09 | Pernyataan berlawanan dugaan; mudah disalahpahami tanpa konteks perkara dan peristiwa. |
| 10 | Pertanyaan penggantian pilar kuat; masih mengarah ke masalah bangunan sebagai topik utama. |
| 11 | Diagnosis menjelaskan proses; lebih efektif sebagai perkembangan daripada cold open. |
| 12 | Jaringan institusi adalah orientasi sistem, bukan konflik/puncak. |
| 13 | Memperjelas kewenangan/batas; membutuhkan jaringan SC12. |
| 14 | Prosedur penggantian adalah sebagian jawaban, sehingga membuka dengannya mengurangi pertanyaan inti. |
| 15 | Dua perspektif menjanjikan perbandingan, tetapi pertanyaannya masih umum. |
| 16 | Satu sisi penilaian; membuka dengan ini dapat memberi bobot berlebih pada perspektif A. |
| 17 | Berkas yang tetap ada kuat secara sebab–akibat, tetapi memerlukan konteks pengunduran diri. |
| 18 | Aksi mobil paling mudah dibaca; dapat membuat penonton mengira topiknya perbaikan kendaraan. |
| 19 | Kandidat kuat: mekanisme tetap bermasalah setelah komponen diganti. Narasi utamanya sudah memberi kesimpulan. |
| 20 | Definisi resilience memerlukan pengantar; bukan kalimat pembuka yang paling konkret. |
| **21** | **Pilihan utama: dua kondisi sistem terlihat sejak frame 0, narasi bertanya, jawaban belum selesai.** |
| 22 | Mandat/jabatan adalah prinsip penutup; belum membuka proses yang perlu ditelusuri. |
| 23 | Kesetaraan aturan merupakan simpulan, lebih tepat sesudah argumen berkembang. |
| 24 | CTA dan sign-off tidak tepat untuk membuka sebelum penonton menerima penjelasan. |

## Copy yang benar-benar diterapkan

- Proyek aktif baru: `editorial-engine/deliverables/gibran-mundur-2026/openfilm-master-v6-hook/`.
- Page salinan: **`hook-sc21.html`**, bersumber dari `scene-21.html`. Scene asal tidak dipindah/dihapus.
- Visual salinan: waktu lokal SC21 **12,000–16,300 detik**. Dua mekanisme sudah tampak sejak frame pertama; bukan fade dari layar kosong.
- Audio asli yang disalin: **5:48,200–5:52,500** dari `assets/vo.mp3`.
- Kalimat pembuka: **“Apakah kita sedang melihat sebuah sistem yang sedang memperbaiki dirinya?”**
- Durasi hook: **4,300 detik / 129 frame pada 30 fps**. Suara tidak dipercepat, tidak diregenerasi, tidak diubah isinya.
- CUT pada 0:04,300 ke SC01 dan narasi asli “Coba bayangin…”. Pertanyaan masih terbuka, sementara cerita kembali ke orientasi gedung.
- Semua 24 scene utama dan rentang audio aslinya tetap utuh. SC21 asli masih kembali pada bagian penutup sebagai payoff.

Label nomor bab di kanan atas dihilangkan hanya pada salinan hook agar pembuka
tidak tampak sebagai “bab 21”. Teks pertanyaan, bentuk, warna dan gerak berasal
dari scene yang dipilih.

## Waktu dan validasi audio

ASR lokal pada 14 detik awal SC21 menemukan “apakah” pada lokal 2,360 detik dan
akhir “dirinya” pada 6,240 detik. Batas copy memakai lokal **2,200–6,500**:
160 ms sebelum kata pertama, 260 ms sesudah kata terakhir. Kata berikutnya,
“Atau”, mulai sekitar 6,820 dan tidak ikut masuk. Teks dicocokkan ke DOCX asli.
Ini pemeriksaan otomatis batas kata; tidak mengklaim listen-through manusia sudah dilakukan.

Panduan opening menargetkan cuplikan visual awal 1–3 detik sebagai arahan kreatif,
bukan syarat memotong kalimat. Copy 4,3 detik dipilih agar pertanyaan utuh dengan
kecepatan asli. Status terhadap target durasi pendek: **NEEDS REVIEW**. Daya tarik
untuk penonton baru tetap memerlukan penilaian pengguna; tidak dinyatakan lulus
hanya karena ada tanda tanya atau uji kode.

## Dampak pada timeline

Master bertambah dari **7:14,991 menjadi 7:19,291**.
Semua timestamp playback cerita utama bergeser **+4,300 detik** bersama VO-nya;
timestamp sumber DOCX dan timing internal setiap scene tidak diubah.
Contoh: SC19 tetap bersumber pada 5:11, tetapi tampil pada 5:15,300 setelah hook.

Manifest menyimpan `mainStartOffset`, `openingHook`, dan kedua jam sumber/playback.
Audit timestamp mengurangi offset hook sebelum membandingkan 24 scene utama ke DOCX.
Preflight memeriksa 25 clip gambar (1 hook + 24 asli), dua pemakaian VO tanpa
overlap, panjang visual/audio hook yang sama, urutan scene, rentang asli yang utuh,
dan kesamaan isi page copy dengan SC21 asal.

Konfigurasi yang dapat direproduksi: `content/gibran-mundur/opening-hook.json`.
`build.py --without-hook` mereproduksi master v5 tanpa prefix; default builder dan
script render kini memakai v6 dengan hook.

## Hasil pemeriksaan copy

- Preflight lolos: 25 clip gambar, durasi 439,291 detik, dua pemakaian VO asli dengan titik sambung 4,300 detik.
- Audit DOCX: 24 scene utama tetap cocok setelah offset opening dikurangi; sepuluh hold tetap utuh.
- `verify-hook.mjs`: **50 pemeriksaan lolos**. Gambar pembuka deterministik; dua alternatif mekanisme terlihat; cut kembali ke SC01; SC21 asli masih muncul di bagian cerita utama; tidak ada error pemuatan/page.
- Pratinjau hasil render **`gibran-opening-hook-sc21-preview-14s.mp4`**: 1920×1080, 30 fps, 420 frame, audio asli, target -16 LUFS.
- Semua frame pratinjau diperiksa OpenFilm: tidak terdeteksi white flash, jumping frame, still picture, atau black frame. Decode seluruh MP4 juga tanpa error.
- Frame 0, frame cut pada 4,3 detik, dan masuk SC02 diperiksa langsung dari MP4.
- Ini MP4 **pratinjau 14 detik**, bukan ekspor penuh master 7:19,291.

Bukti lokal: `deliverables/gibran-mundur-2026/audit-v6-hook/` berisi
`timestamp-audit.json`, `hook-verification.json`, capture titik sambung dan contact sheet.
