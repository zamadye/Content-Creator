# Kaca Pangeran Rupert — Visual V1 (draf privat)

Konten baru dengan satu tetes kaca yang sama dari pembuka sampai penutup.
Palu mengikuti pergelangan Host dan mencapai titik kontak yang ditetapkan;
retak bergerak dari ekor ke kepala, kaca menjadi pecahan, lalu objek berubah
menjadi penampang dingin/panas dan skema tegangan. Warna dan gerakan retak
adalah ilustrasi, bukan rekaman eksperimen atau simulasi fisika kuantitatif.
Kekuatan kepala tidak tak terbatas; adegan dilabeli “jangan ditiru”.

Opening cut frame 82 (2,733 detik) setelah pertanyaan pertama menurut estimasi
jeda take. S04 memakai panggung dan objek yang sama dan menyelesaikan retakan.
Satu take `voice-05` pada tempo asli; hanya 0,22 detik sunyi awal dipangkas.
Subtitle didasarkan pada jeda dan estimasi frasa, **bukan forced alignment**.

## Restore dan build

Letakkan `01-INPUT-PRIVAT.zip` dari Drive pada
`deliverables/kaca-rupert-visual-v1/`, lalu:

```sh
cd editorial-engine
python3 pipeline/kaca-rupert-visual-v1/restore-input.py
npm ci --no-audit --no-fund
npm run build:kaca-rupert
```

Input berisi dua latar ilustrasi dan satu take privat; manifest dan hash juga
diperiksa oleh `prepare.py`. Restore menolak menimpa file lokal yang berbeda.
Diperlukan Linux x64 kompatibel, Node/npm, Python, CPU, ruang disk dan akses npm
untuk dependency. Setelah instalasi tidak ada unduhan aset di build.
Renderer React→SVG→resvg→FFmpeg membagi encode menjadi dua chunk dengan satu
clock. Hasil mencakup MP4, thumbnail, poster, SRT estimasi, caption empat
platform, storyboard, sumber, QA dan SHA. Tidak ada fungsi upload atau Buffer.

## Tes dan batas

```sh
node --test pipeline/kaca-rupert-visual-v1/test-story.mjs pipeline/awan-rig-v2/test-rig.mjs
python3 pipeline/kaca-rupert-visual-v1/test-prepare.py
python3 pipeline/kaca-rupert-visual-v1/test-restore.py
./node_modules/.bin/tsc --noEmit
```

Tes numerik memeriksa lintasan pukulan, urutan retak dan gerak pecahan, bukan
kualitas animasi utuh, kontak yang terlihat atau kepuasan penonton. Harus ada
review manusia untuk playback lengkap, suara/CTA, timing subtitle, animasi,
safe area ponsel/platform dan hak sebelum persetujuan tayang. Jangan mengaku
full rebuild berhasil jika hanya frame 0 dipulihkan. Catatan inspeksi visual
manual berlaku untuk render tertentu saja; buat ulang catatan sebelum membuat
backup render yang berbeda.

## Sumber

Aben dkk., *Applied Physics Letters* 109, 231903 (2016),
https://doi.org/10.1063/1.4971339; Purdue Research (2017),
https://www.purdue.edu/research/features/stories/a-hammer-cant-break-this-tadpole-shaped-glass/.
