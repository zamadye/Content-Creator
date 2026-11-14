# Render OpenFilm di komputer lokal

## 1. Clone hanya branch kerja ini

```sh
git clone --single-branch --branch arena/54cb36c6-content-creator https://github.com/zamadye/Content-Creator.git
cd Content-Creator
```

`--single-branch` membuat clone hanya mengambil branch tersebut, bukan semua branch.

## 2. Download project ZIP satu kali

Unduh **OpenFilm full 24-scene project v3 (WIP)** dari [Google Drive](https://drive.google.com/file/d/1tmqfI5LlNRVFYZ6FFe41ZL5KzkGI99CO/view?usp=drivesdk). Simpan ZIP tanpa diekstrak di:

```text
editorial-engine/incoming/gibran-mundur-openfilm-full-project-WIP.zip
```

ZIP sudah berisi project `film.html`, semua 24 halaman scene, VO asli di `assets/vo.mp3`, dan footage pembuka di `assets/SC01.mp4`. **Tidak perlu menaruh/mengunduh VO secara terpisah.**

## 3. Prasyarat sekali saja

Pasang Node.js 22.18+, FFmpeg modern dan FFprobe, lalu pastikan ketiganya tersedia di PATH terminal. Pada render pertama, OpenFilm mengunduh paket OpenFilm dan browser Chromium-nya (sekitar 100 MB). Mesin dengan Chromium/GPU acceleration akan merender jauh lebih cepat daripada software/SwiftShader.

## 4. Jalankan satu script

Dari root clone:

```sh
bash scripts/render-gibran-openfilm.sh
```

Script memvalidasi ZIP dan dependensi, mengekstrak/memasang project, merender 1920×1080 30 fps dengan VO target −16 LUFS, lalu memeriksa keseluruhan MP4 dengan OpenFilm. Hasil disimpan di:

```text
editorial-engine/deliverables/gibran-mundur-2026/gibran-mundur-openfilm-full-<waktu>.mp4
```

Opsional: `OPENFILM_WORKERS=4 bash scripts/render-gibran-openfilm.sh` untuk mesin dengan RAM/CPU/GPU memadai. Jika script menyebut ZIP tidak ditemukan, periksa nama dan path persis pada bagian 2.

Catatan: ini masih WIP. VO asli tidak diubah; pemeriksaan timing per kata, footage library publik dan lisensinya, serta QA editorial/fakta tetap harus dilakukan sebelum final atau publikasi.
