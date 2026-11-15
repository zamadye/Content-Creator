# Master v6 dengan opening hook dan render OpenFilm lokal

Script sekarang memakai **master v6: salinan SC21 selama 4,3 detik di depan + 24 scene utama**, bukan HTML lama dalam ZIP v3.
SC21 aslinya tetap berada di penutup. Durasi baru 439,291 detik / 7:19,291;
semua scene dan VO cerita utama bergeser bersama +4,3 detik. Lihat
[pemilihan opening](openfilm-master/OPENING-HOOK-SC21.md).
ZIP hanya menyediakan VO dan footage pembuka. Revisi mencakup perbaikan cut
SC18–19 ke 5:11, seluruh sepuluh hold pada jeda DOCX, dokumen, kontinuitas pilar,
jaringan tujuh entitas, serta koreografi seluruh scene.

```sh
# Bangun ulang source revisi, tanpa render:
bash scripts/render-gibran-openfilm.sh --prepare
# Buka master lengkap di Studio:
bash scripts/render-gibran-openfilm.sh --open
# Ekspor penuh setelah review:
bash scripts/render-gibran-openfilm.sh --render
```

Project aktif: `editorial-engine/deliverables/gibran-mundur-2026/openfilm-master-v6-hook/`.
`--render` tidak mengekstrak ulang ZIP atau mengganti hasil edit Studio.
Gunakan `--prepare` hanya saat ingin memperbarui file project dari source pipeline.

VO tetap utuh. Ketepatan cut pada rentang DOCX sudah diperbaiki; sinkronisasi
kata/frasa dan penilaian editorial akhir belum boleh disimpulkan dari pemeriksaan kode saja.

## 1. Clone hanya branch kerja ini

```sh
git clone --single-branch --branch arena/54cb36c6-content-creator https://github.com/zamadye/Content-Creator.git
cd Content-Creator
```

`--single-branch` membuat clone hanya mengambil branch tersebut, bukan semua branch.

## 2. Download project ZIP satu kali

Unduh **OpenFilm full 24-scene project v3 (WIP)** dari [Google Drive](https://drive.google.com/file/d/1tmqfI5LlNRVFYZ6FFe41ZL5KzkGI99CO/view?usp=drivesdk). Simpan ZIP tanpa diekstrak di root clone (folder `Content-Creator`) dengan nama:

```text
gibran-mundur-openfilm-full-project-v3.zip
```

ZIP sudah berisi project `film.html`, semua 24 halaman scene, VO asli di `assets/vo.mp3`, dan footage pembuka di `assets/SC01.mp4`. **Tidak perlu menaruh/mengunduh VO secara terpisah.**

## 3. Prasyarat sekali saja

Pasang Node.js 22.18+, Python 3, FFmpeg modern, FFprobe, dan Google Chrome. Pastikan Node.js, FFmpeg, dan FFprobe tersedia di PATH terminal. Script menggunakan Google Chrome lokal dengan jendela GUI dan profil otomasi terpisah. OpenFilm diunduh pada pemakaian pertama; Chromium headless tidak diperlukan. Jalankan dari sesi desktop yang aktif.

Pemilihan Chrome diterapkan dalam memori oleh `scripts/openfilm-local-chrome.mjs`, khusus launcher OpenFilm 0.3.2, termasuk worker render dan Studio. Paket npm tidak diubah. Untuk memakai Chrome lokal tanpa jendela, atur `OPENFILM_HEADED=0`.

## 4. Jalankan satu script

Dari root clone:

```sh
bash scripts/render-gibran-openfilm.sh
```

Script memeriksa copy hook, 24 clip utama, media, hash VO/source, kontinuitas waktu dan batas SC18–19; merender 1920×1080 30 fps dengan VO target −16 LUFS; lalu memeriksa MP4 dengan OpenFilm. Hasil disimpan di:

```text
editorial-engine/deliverables/gibran-mundur-2026/gibran-mundur-master-v6-<waktu>.mp4
```

Default satu worker. Naikkan `OPENFILM_WORKERS` bila mesin mempunyai RAM/CPU/GPU memadai.
`OPENFILM_TOOL_BIN` menunjuk folder FFmpeg/FFprobe portabel; `OPENFILM_CLI` dapat
menunjuk `bin/openfilm.mjs` dari paket 0.3.2 yang sudah terpasang, sehingga tidak
perlu mengunduh ulang paket. `OPENFILM_PROJECT_DIR` memilih project lain secara eksplisit.

Catatan: ini masih WIP. VO asli tidak diubah; pemeriksaan timing per kata, footage library publik dan lisensinya, serta QA editorial/fakta tetap harus dilakukan sebelum final atau publikasi.
