# Turbin angin — pipeline draf privat V1

Episode ini menjelaskan mengapa sebagian turbin dapat berhenti ketika angin melewati batas operasi desain. **Output hanya draf privat; bukan persetujuan publikasi atau penjadwalan.** Naskah, audit kalimat, storyboard dan ruang lingkup fakta telah disetujui untuk produksi draf; cek file bukti privat beserta hash-nya, bukan sekadar teks dokumentasi ini. Respons audiens, audit ahli independen, playback manusia, pemeriksaan ponsel, hak dan atribusi footage belum terverifikasi.

## Sumber dan keputusan visual

- `content/proposals/turbin-angin-draf-v1.json` dan `turbin-angin-audit-kalimat-v1.json`: 12 scene, satu item audit per kalimat, sumber dan `objectMap`. Audit mekanis memeriksa struktur/teks, bukan mutu storytelling atau respons audiens.
- `shot-plan.json`: storyboard yang disetujui. `footage-manifest.json`: empat original Coverr, ukuran dan SHA-256. Metadata pencarian pernah menyebut 4K, tetapi file unduhan aktual **1920×1080**.
- Footage asli dipakai sebagai **konteks, bukan bukti** bahwa turbin dalam rekaman berhenti karena angin. Jendela tajam berukuran 960×540 mempertahankan seluruh frame 16:9. Di belakangnya ada crop vertikal dari footage yang sama, diburamkan dan digelapkan; itu bukan rekaman vertikal native. `prepare.py` memilih in-point yang berbeda saat footage digunakan ulang.
- Mekanisme dan shutdown adalah model berlabel ilustrasi. S04/S07 berubah dari footage konteks ke penampang pitch besar; gambar penampang bukan pengukuran bilah yang direkam. Pengaturan daya ketika masih beroperasi dibedakan dari shutdown di atas batas desain model.
- `motion.mjs` mendefinisikan satu puncak yang diawali di S01 dan diteruskan di S06. `--continuity-check` membandingkan piksel frame terakhir cuplikan puncak sebelum cut visual dengan frame pertama S06 **sebelum encoding**. Ini bukan pengganti menonton gerak final.
- Voice-05 dibuat satu take; `prepare.py` memangkas 0,25 detik hening awal, tanpa mempercepat narasi. Musik tonal disintesis khusus untuk draf. Narasi dan musik bukan bukti sudah didengar manusia.
- **Dua durasi pembuka yang berbeda:** cuplikan visual puncak dipotong pada **2,0 detik**, lalu narasi berlanjut di shot pertanyaan; cerita S02 baru dimulai pada **7,2 detik** setelah pertanyaan lengkap. Jadi target cut visual 1–3 detik dapat diuji terpisah, tetapi pembuka lisan secara keseluruhan tetap lebih lama dari 1–3 detik dan **NEEDS REVIEW**. Narasi tidak dipotong atau dipercepat.
- Subtitle menggunakan 33 cue ≤2 baris yang teksnya cocok dengan naskah. Waktu diperkirakan dari jeda; **bukan forced alignment**. Pemeriksaan energi audio hanya menemukan kemungkinan mismatch kasar, tidak mendengar atau mengenali kata. Sinkronisasi dan pelafalan `ikuti knot theory` perlu didengarkan.

## Input privat dan prasyarat

Gunakan checkout repo ini pada Linux x64, Node.js/Python 3 dan `npm ci` di `editorial-engine/`. Komponen `@ffmpeg-installer/linux-x64/ffmpeg` dan `@remotion/compositor-linux-x64-gnu/ffprobe` dipakai; FFmpeg yang terpasang adalah GPL v3-or-later. Font Archivo dan Permanent Marker sudah berada di `assets/fonts/`. Jangan mengunggah media, rahasia, token, atau `node_modules` ke Git.

Lokasi yang dibutuhkan dari root repo:

1. Empat file original dengan nama dan hash sesuai `footage-manifest.json` di `google_drive/` (folder terabaikan Git).
2. `.scratch/turbine/human-review.json`: keputusan manusia yang benar-benar terjadi, dengan role, metode, bukti, tanggal, empat scope dan SHA-256 naskah/audit/rencana shot. Bila satu byte input review berubah, gate gagal dan review baru diperlukan. Record bukan tanda tangan kriptografis; **jangan pernah membuat approval palsu**.
3. `.scratch/turbine/narasi-voice-05.wav`: take yang sama dengan SHA-256 `3e26b0cbd59f7e84e8bebbe00b46508c557d717c28c451399d135c2e70e80f22`. Timing diturunkan untuk take spesifik ini; take lain harus dipetakan dan direview ulang.

`preflight.mjs --stage planning` hanya memeriksa struktur. `--stage voice` juga meminta bukti review manusia dan hash media. Setelah `prepare.py`, `--stage render` memeriksa hash input, berkas audio turunan, frame/cue kontigu, in-point dan durasi footage, lalu hanya membuka jalan untuk **render privat**. Hasil preflight PASS tidak menyatakan hak, pelafalan, keterbacaan, kualitas, atau kesiapan publikasi PASS.

## Menjalankan dan menguji

Dari root repo, setelah prasyarat di atas dipenuhi:

```sh
(cd editorial-engine && npm ci)
node --test editorial-engine/pipeline/turbin-angin-v1/test-preflight.mjs
python3 editorial-engine/pipeline/turbin-angin-v1/test-pack.py
python3 editorial-engine/pipeline/turbin-angin-v1/test-qa.py
python3 editorial-engine/pipeline/turbin-angin-v1/test-glyphs.py
python3 editorial-engine/pipeline/turbin-angin-v1/check-glyphs.py
python3 editorial-engine/pipeline/turbin-angin-v1/test-pack-final.py
python3 editorial-engine/pipeline/turbin-angin-v1/test-progress.py
bash editorial-engine/pipeline/turbin-angin-v1/build-private.sh
```

Build menjalankan preflight suara, pengecekan glyph font, menyiapkan audio/timing, preflight render, TypeScript, pengecekan continuity, sampel dan renderer lengkap, lalu QA teknis. Pengecekan glyph membaca Unicode cmap font untuk teks literal dan narasi; ini tidak membuktikan tata letak atau keterbacaan ponsel. Tidak ada jaringan, unggahan, atau Buffer dalam script build. Render memerlukan beberapa menit pada CPU; durasi bergantung pada mesin. Untuk uji satu komponen secara terpisah:

```sh
node editorial-engine/pipeline/turbin-angin-v1/preflight.mjs --stage render --review .scratch/turbine/human-review.json
(cd editorial-engine && ./node_modules/.bin/tsx pipeline/turbin-angin-v1/render.tsx --samples)
(cd editorial-engine && ./node_modules/.bin/tsx pipeline/turbin-angin-v1/render.tsx --scene 6) # S07, indeks mulai dari 0
(cd editorial-engine && ./node_modules/.bin/tsx pipeline/turbin-angin-v1/render.tsx --all)
python3 editorial-engine/pipeline/turbin-angin-v1/qa.py
```

Per scene, renderer memeriksa 1080×1920/H.264/30 fps dan jumlah frame melalui ffprobe, lalu menulis receipt berisi hash video dan fingerprint sumber, rig, timing, font, package lock serta binary render. `--all` hanya memakai ulang scene yang receipt, hash, ukuran dan jumlah frame-nya cocok; lainnya dirender ulang. Assembly menolak scene usang/berubah. Renderer juga menjalankan preflight saat dipanggil langsung, termasuk pemeriksaan teks cue terhadap naskah; sampel memakai file sementara agar gambar lama tidak disalahartikan sebagai hasil baru. `qa.py` mendekode seluruh video dan audio, menghitung frame aktual, membandingkan durasi stream dan isi SRT dengan cue yang dibakar, mengukur level dan menghasilkan laporan. Hasil teknis bukan pemeriksaan estetika atau listening. Output ditulis ke `.scratch/turbine/render/`:

- `turbin-angin-draf-privat.mp4`: target 1080×1920, 30 fps, 2.371 frame, durasi sekitar 79,03 detik.
- `turbin-thumbnail-draf.png`: karya cover terpisah; `turbin-poster-4x5-draf.png`: poster 1080×1350.
- `Caption-4-platform-DRAF.txt`: caption dan hashtag untuk FB Reels, TikTok, IG Reels dan YouTube Shorts.
- `subtitle-perkiraan.srt`: timing sementara; subtitle juga dibakar ke MP4.
- `QA-draf-privat.md`, `QA-teknis-draf.json`, `qa-frame0-final.png`, `QA-contact-360.png` (12 frame pada ukuran simulasi), `QA-potongan-pembuka.png` (frame sebelum/sesudah cut), file adegan dan receipt untuk pemeriksaan.

## Backup dan pemulihan

Bila render panjang perlu checkpoint sebelum selesai, simpan hanya scene berurutan yang sudah mempunyai receipt (contoh 6 scene pertama):

```sh
python3 editorial-engine/pipeline/turbin-angin-v1/test-progress.py
python3 editorial-engine/pipeline/turbin-angin-v1/pack-progress.py --through 6
```

ZIP **belum lengkap** ini mengandung input privat, audio persiapan dan scene+receipt yang telah diperiksa hash/fingerprint. Simpan dan verifikasi di Drive privat. Untuk melanjutkan setelah reset, pulihkan `private-runtime/` ke `.scratch/turbine/`, pulihkan footage asli, install dependensi yang sama dan jalankan `--all`; renderer hanya memakai kembali scene jika fingerprint toolchain/sumber/timing cocok. Ini tidak menggantikan backup final.

Setelah render dan QA selesai, pastikan caption sudah disalin, lalu:

```sh
python3 editorial-engine/pipeline/turbin-angin-v1/pack-private-final.py
```

Packer memakai **allowlist**: sumber episode/rig/font yang diperlukan, empat video asli, bukti review privat, voice, timing, musik, semua scene, master dan keluaran/QA. Setiap anggota diverifikasi terhadap manifest SHA-256 setelah ZIP ditutup. Output `Turbin-DRAF-private-backup-v3.zip` tidak ditimpa bila sudah ada; upload ke Drive **privat**, lalu unduh kembali dan bandingkan SHA-256 arsip serta jalankan `verify()` sebelum menyatakan backup terverifikasi. Isi `private-media/` dipulihkan ke `google_drive/`, `private-runtime/` ke `.scratch/turbine/`, dan sumber `editorial-engine/` ke checkout yang sama. Jalur absolut di `prepared.json` mungkin berubah antar mesin; jalankan `prepare.py` lagi setelah memulihkan dan jangan mengabaikan gate/hash.

## Batas dan kesalahan yang harus ditangani

- Footage hilang/hash beda: pulihkan original terverifikasi, jangan mematikan pemeriksaan. Durasi/in-point tidak cukup: pilih in-point valid dan render ulang.
- Review hilang/input berubah: hentikan, minta review manusia baru. Persetujuan draf bukan persetujuan unggah.
- Receipt usang, frame terpotong, FFmpeg/ffprobe gagal atau decode gagal: jangan gabungkan sebagai selesai; telusuri log scene, render ulang dan jalankan QA lagi.
- PATCH tracking Coverr mengembalikan 404 dan field creator kosong; hak/atribusi **NEEDS REVIEW**. Jangan publikasikan sebelum jelas.
- Lakukan playback penuh dengan audio, cek pelafalan CTA, timing subtitle, kualitas musik, motion, area aman dan keterbacaan pada ponsel; semua **NOT TESTED/NEEDS REVIEW** sampai benar-benar diperiksa. Jangan menyimpulkan respons audiens.
- Untuk publikasi nanti: patuhi instruksi pengguna tentang label AI yang opsional. Jika disclosure diwajibkan atau tidak jelas, berhenti untuk keputusan; jangan pernah menyangkal penggunaan AI secara salah. Buffer/schedule memerlukan persetujuan terpisah.
