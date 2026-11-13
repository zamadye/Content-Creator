# Render lokal — Jalan Pulang (draft)

## Cakupan sebenarnya
Perintah standar merender `StoryBlocking` hingga 09:03. Opsi `--full` memilih `FullStoryBlocking`, mencakup kedua VO dan penutup sampai sekitar 11:20. Keduanya **blocking/prototipe**, bukan film final: adegan dan aksi masih placeholder, animasi serta PBR belum final, sound design belum terintegrasi dan sinkronisasi belum diperiksa menyeluruh. Render lengkap `--full` belum diuji dari awal sampai akhir. Periksa lisensi individual aset sebelum publikasi.

## Kebutuhan
- Linux x86_64, atau Windows 10/11 dengan **WSL2 Linux x86_64**. Native Windows dan macOS belum diuji. WSL2 untuk GPU memerlukan driver host dan WSL GPU support; keberhasilannya tergantung konfigurasi.
- Node.js 22 (disarankan 22 LTS), npm, `bash`, `tar`, `sha256sum`, `awk`, dan internet ke npm saat `npm ci` pertama. Penyimpanan bebas beberapa GB untuk dependensi dan potongan render; RAM 8 GB atau lebih disarankan. Angka ini saran, bukan hasil benchmark.
- Chrome/Chromium yang bisa dijalankan secara headless, atau script otomatis mengekstrak Linux x64 `@sparticuz/chromium` dari paket npm. Bila browser gagal mulai, pasang library Linux yang disebut dalam pesan error atau tunjukkan browser sistem dengan `--browser /path/to/chromium`. GPU memerlukan driver OpenGL/EGL yang bekerja di Chromium headless; WSL2 memakai dukungan GPU WSL. Mode GPU **tidak menjamin** hardware acceleration—driver/Chrome bisa memakai software.
- Aset 3D/PBR ada pada branch; jangan hapus `public/`. VO diabaikan Git demi menjaga sumber pengguna: unduh [VO 01](https://drive.google.com/file/d/1hVY_98my0wxeR7GWaLZfW3n1SAxqOq27/view?usp=drivesdk), simpan persis sebagai `jalan-pulang/public/vo/VO-Jalan-Pulang_01.mp3`. Untuk `--full`, unduh juga [VO 02](https://drive.google.com/file/d/1Qa9W0EQfrIwVxUufj8mTPIOnPEw9rQn3/view?usp=drivesdk) dan simpan sebagai `jalan-pulang/public/vo/VO-Jalan-Pulang_02.mp3`. Blender/Godot dan Python **tidak dibutuhkan** untuk render draft ini.

## Menjalankan
Sesudah clone branch yang sudah dipush, masuk ke repo lalu folder `jalan-pulang`. Buat folder `public/vo` dan simpan file VO di sana. Jalankan:

```bash
cd jalan-pulang
bash scripts/render-local.sh --check
bash scripts/render-local.sh --smoke
bash scripts/render-local.sh
```

`--check` memasang dependency melalui `npm ci` bila belum ada, memeriksa aset/VO, browser dan durasi VO; itu bukan tes GPU. `--smoke` merender satu detik dengan VO ke `render/local/smoke.mp4`: pastikan visual dan suara benar. Perintah terakhir merender 300 detik sebagai potongan 20 detik, memverifikasi frame, menyambung potongan dan menambahkan VO sekali. File draft berada di `deliverables/jalan-pulang-blocking-300s.mp4`. Render dapat dilanjutkan dengan menjalankan ulang perintah yang sama; cache dilindungi hash source, aset, browser, VO dan pengaturan. Jangan mengubah file selama render.

### Opsi
```bash
# Coba browser sistem yang spesifik
bash scripts/render-local.sh --browser /usr/bin/chromium --mode gpu
# Jika GPU/EGL gagal, fallback yang biasanya lebih lambat
bash scripts/render-local.sh --mode software
# Draft 09:03 (VO pertama)
bash scripts/render-local.sh --seconds 543
# Draft kedua VO; masih WIP, belum diuji render penuh
bash scripts/render-local.sh --check --full
bash scripts/render-local.sh --smoke --full
bash scripts/render-local.sh --full
# Resolusi 1920x1080, jauh lebih berat
bash scripts/render-local.sh --scale 1 --concurrency 1
# Coba lebih banyak worker hanya jika RAM/GPU memadai
bash scripts/render-local.sh --concurrency 2
```

Default `--mode gpu` memakai ANGLE EGL. `--mode software` memakai SwiftShader; untuk browser sistem, dukungan SwiftShader bergantung pada paket browser. Untuk menilai akselerasi GPU, periksa diagnostik GPU Chrome/driver atau penggunaan GPU sistem saat `--smoke`: sukses render saja tidak membuktikan GPU dipakai. Rendering pakai GPU dapat lebih cepat, tetapi tidak ada estimasi yang valid tanpa benchmark pada mesin pengguna. Naikkan concurrency bertahap; terlalu tinggi dapat menyebabkan kekurangan RAM atau crash. Jika WebGL/EGL gagal, coba `--mode software`. Cache `render/local/` aman dihapus jika ingin mulai ulang. Jangan unggah hasil tanpa QC.

Pada `--full`, output yang direncanakan `deliverables/jalan-pulang-blocking-full.mp4`; VO 02 dimulai pada frame 16309, asumsi tanpa jeda. Pemeriksaan sambungan audio, visual dan sinkronisasi secara menyeluruh masih diperlukan. `--full` dan `--seconds` tidak dapat digabung.
