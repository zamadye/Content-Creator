> **Pembaruan arahan:** pengguna memilih animasi karakter dan aset hidup, bukan gambar statis atau ITV. Instruksi lama yang bertentangan tidak berlaku. Lihat `ARAH-ANIMASI-HIDUP.md`.

# Rencana produksi — Jalan Pulang

Status: **pra-produksi / belum dirender**, 12 November 2026. Koreksi pengguna: shot list di KNOT THEORY adalah versi berbeda; jangan gunakan sebagai acuan Jalan Pulang. Klip ITV akan dirender pengguna setelah seluruh gambar siap. Rencana awal di bawah ini perlu dikalibrasi ulang hanya terhadap sumber Jalan Pulang dan VO.

## Sumber dan batas pembacaan

- [Panduan animasi 2.5D](https://drive.google.com/file/d/1z6PSuU0LHFvoRRfjIWDOUiSurtTuHU-_/view): 72 shot, terdiri dari 28 2.5D, 39 foto bergerak, 5 video AI; 14 adegan. Bagian tengah hasil pembacaan terpotong oleh connector, jadi detail shot tengah harus dibaca ulang sebelum produksi, bukan ditebak.
- Shot list di KNOT THEORY **bukan versi episode ini**, sesuai konfirmasi pengguna. Jangan dipakai sebagai sumber cerita, cue, atau keputusan kreatif; angka dan rincian yang sebelumnya diserap darinya harus diverifikasi ulang.
- [Folder Jalan Pulang](https://drive.google.com/drive/folders/16WKlNrM2xGpY_QvaQQPvfCxpYwVD0Ysj): panduan dan dua file VO ditemukan. Ini membuktikan metadata dapat diakses, bukan bahwa audio telah diunduh atau didengar.
- Dokumen kanonis The Last Signal pada folder Struktur & Gerbang berhasil ditemukan, tetapi hasil pembacaan juga terpotong. Bagian yang terlihat menekankan cerita horor utuh, hook spesifik, eskalasi, pilihan tokoh, payoff, dan QA tanpa naskah.

## Brief dan keputusan kreatif

Panduan Jalan Pulang menampilkan Dimas, motor Supra, jalan kebun karet, warung, papan jalan, sosok putih, bayangan dan rumah. Rincian narasi, urutan shot dan payoff perlu dicocokkan kembali dengan VO serta panduan lengkap; ringkasan yang berasal dari shot list KNOT THEORY tidak dipakai.

Target 1920×1080, 16:9, 30 fps, master H.264/H.265 16–20 Mbps, AAC 320 kbps; subjek di 60% tengah untuk crop vertikal. Palet #0B1A1F, #16313A, #5E7F86, kuning #E8B84A, sirene #B3262E / #2A4FA8, layar #9CC9FF. Grain dan vignette halus konsisten. Timestamp dalam panduan bersifat estimasi dan belum dikalibrasi terhadap VO. Gunakan batas frame hasil kalibrasi audio sebagai sumber kebenaran.

## Rencana bertahap

1. **Akses dan keputusan:** gunakan panduan dalam folder Jalan Pulang dan VO sebagai sumber; abaikan shot list KNOT THEORY. Verifikasi informasi hook dan seluruh cue dari sumber yang benar. Pastikan panduan lengkap dapat dibaca.
2. **Audio-first:** unduh dua VO secara sah ke workspace, ukur dengan ffprobe, dengarkan dan tandai kalimat awal tiap shot, cek sambungan dan kesalahan transkrip. Buat cue sheet frame-akurat; jangan pakai asumsi 11:06 + 02:19 sebagai data terukur. Simpan VO di folder aset yang diabaikan Git.
3. **Asset bible:** character sheet Dimas serta sosok, motor, ibu dan bapak; lima master WARUNG (mati/menyala), PAPAN (kering/basah), HUTAN, MOTOR dan RUMAH. Gambar sumber minimal 2560×1440, ideal 3840×2160. Gunakan referensi konsisten; ibu dominan siluet. Inventaris per shot: visual, layer, footage, SFX, hak penggunaan, status dan cue VO. Visual dan audio pendukung belum ditemukan dalam folder itu; jangan menganggap tidak ada di tempat lain.
4. **Animatic:** bentuk 14 adegan dan 72 shot dari cue terkalibrasi di Remotion; placeholder diberi label dan bukan final. Mulai uji adegan 4–7 dan 10 (hutan, loop warung dan reveal), lalu 13–14 (ending). Pertahankan framing identik warung 5.1/5.5 sebagai petunjuk; jangan spoil reveal terlalu dini.
5. **Produksi visual:** gambar per shot, potong foreground/subjek, isi latar tersembunyi; susun layer depth dan animasikan parallax, push/pull, pan, kabut, lampu, vignette dan grain dengan komponen berbasis frame di Remotion/React dan library npm; tidak memakai editor GUI. Lottie/GSAP dapat digunakan jika cocok dan gerak diikat deterministik ke frame. Hindari pan/zoom identik berturut-turut kecuali pengulangan yang memang disengaja. Untuk lima shot video AI, siapkan gambar awal dan instruksi gerak berdasarkan panduan yang lengkap; pengguna akan merender klip ITV setelah seluruh gambar siap.
6. **Suara:** gunakan VO asli, susun ambience, mesin motor, senandung, telepon, ketukan dan musik berlisensi; sisakan hening pada momen penting, tidak menenggelamkan narasi. Buat inventaris sumber/lisensi. Campur, cek kejelasan dan sinkronisasi; jangan klaim level final tanpa pengukuran.
7. **Render dan QA:** tes render beberapa detik dulu, lalu adegan per bagian dan master; cek frame hitam, tepi cutout/lubang, konsistensi karakter, rasio 9:16 aman, kontinuitas, audio, encoding, serta tonton rough cut penuh tanpa naskah. Penandaan AI saat publikasi mengikuti aturan platform yang berlaku. Buat versi Shorts setelah master disetujui.

## Status resource dan kendala terukur

- Node 22.22.3, npm 10.9.8, Python 3.11.2 tersedia; RAM sekitar 3.8 GiB, ruang kosong sekitar 20 GiB saat diperiksa. Render 1080p perlu uji dengan concurrency rendah dan pemrosesan per adegan.
- Paket npm dipasang dan versinya dikunci di `package-lock.json`: Remotion 4.0.543 beserta CLI/bundler/renderer, React, GSAP, lottie-web, @sparticuz/chromium 153.0.0, dan binary FFmpeg dari npm. FFmpeg berjalan, tetapi belum dipakai memeriksa VO; ffprobe belum tersedia/diuji.
- Chromium: `npm pack` dan ekstraksi manual Brotli berhasil; `npm run extract:chromium` mereproduksi ekstraksi dari paket terpasang. Eksekusi gagal karena `libnspr4.so`, `libnss3.so`, `libnssutil3.so` tidak tersedia. Ini bukan render Remotion yang tervalidasi. Cari library kompatibel melalui sumber yang diizinkan atau minta lingkungan/binary dengan dependensi; jangan mengunduh browser dari host yang tidak diizinkan.
- Blender `bpy==4.5.16` terpasang dalam `.venv` sementara, tetapi import gagal. `ldd` menunjukkan `libXrender.so.1`, `libXfixes.so.3`, `libXi.so.6`, `libxkbcommon.so.0`, `libSM.so.6`, `libICE.so.6`, dan `libGL.so.1` hilang. Perlu penyediaan library kompatibel dan smoke test render headless sebelum disebut siap untuk 3D.
- Godot 4.5.1-stable: rilis resmi ditemukan via GitHub, tetapi unduhan `gh release download` dialihkan ke `release-assets.githubusercontent.com` dan gagal EOF. Paket npm `godot-bin` tidak ada; paket bernama `godot` bukan engine. Belum terinstal. Coba sumber binary terpercaya di registry yang diizinkan atau minta artefak resmi yang dapat diakses; verifikasi versi/hash dan render headless sebelum penggunaan.
- `.venv`, `node_modules`, `.jalan-pulang-tools`, aset dan hasil render diabaikan Git dan tidak dijamin bertahan pada snapshot. Setup npm dapat diulang dengan `cd jalan-pulang && npm ci && npm run extract:chromium`; bpy dengan `python3 -m venv .venv && .venv/bin/pip install bpy==4.5.16`. Instalasi ulang tidak menyelesaikan library OS yang hilang.

## Pertanyaan / gap sebelum produksi

1. Adakah shot list atau transkrip khusus versi Jalan Pulang selain panduan di folder tersebut? Shot list KNOT THEORY adalah versi berbeda dan tidak digunakan.
2. Apakah ada instruksi hook untuk versi Jalan Pulang? Verifikasi pada sumber yang benar sebelum mengubah audio dan cue.
3. Mohon lokasi atau akses ke visual master, footage, musik, SFX dan lisensinya bila sudah tersedia; bila belum, setujui pembuatan aset baru. Pengguna akan merender klip image-to-video setelah gambar siap.
4. Diperlukan cara membaca panduan 2.5D lengkap (bagian tengah terpotong di respons connector) dan cara memindahkan dua VO ke workspace untuk didengar/diukur. Metadata Drive tersedia, tetapi transfer dan hak download belum diuji.
5. Dependensi runtime Chromium/bpy dan akses binary Godot masih menjadi pekerjaan teknis; kami sudah mencoba jalur npm/PyPI dan GitHub, namun belum ada render end-to-end. Jika library/binary tidak bisa diperoleh dari sumber yang diizinkan, diperlukan bantuan penyediaan artefak yang kompatibel.

## Pembaruan 12 November — transkrip dan arah game 2.5D

Transkrip unggahan pengguna dirapikan pada `TRANSKRIP-TIMESTAMP-RAPI.md`, mencakup 80 segmen 00:00–09:03 saja. Rencana visual baru mengikuti rentang itu di `VISUAL-TIMESTAMP-2.5D.md`; VO belum dicocokkan dan bagian setelah 09:03 belum tersedia dalam unggahan. Arah kini staging 3D seperti game dengan timeline Remotion; ITV tetap dirender pengguna setelah gambar selesai. Semua penjelasan timestamp atau teknik sebelumnya yang bertentangan dengan pembaruan ini bersifat usang.

Kenney starter kit resmi dan karakter GLB sudah diambil dari GitHub; prototipe Three.js/Remotion berhasil dibundle tetapi gagal membuat WebGL context saat render. Chromium sekarang dapat dijalankan setelah mengekstrak `al2023.tar.br` dari paket npm dan menambahkan library ke `LD_LIBRARY_PATH`; status NSS/NSPR yang disebut di atas sudah teratasi. WebGL tetap belum teratasi. Aset gambar AI yang disebut inventaris sebelumnya tidak tersedia di workspace pada sesi ini; perlu diambil ulang atau dibuat kembali, jangan dianggap sebagai aset siap.
