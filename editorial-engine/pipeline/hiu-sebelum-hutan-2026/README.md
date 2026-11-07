# Hiu Sebelum Hutan — episode 7 November 2026

Satu episode baru Dunia Kebalik, menggunakan rig Host Danau/Antartika yang sama dan satu master narasi voice-05 dari sembilan segmen. Narasi menjelaskan dua temuan, bukan umur satu hiu atau kepastian asal semua pohon. Sumber, batas klaim, tindakan dan `objectMap` tiap adegan tersimpan pada `content/recovered/hiu-sebelum-hutan-2026-11-07.json`. Sumber utama untuk hutan: Davies dkk., *Journal of the Geological Society* (2024), DOI 10.1144/jgs2023-204; umur sisik 420 juta tahun menurut Smithsonian Ocean. Angka perkiraan; penemuan baru dapat mengubah catatan. Ilustrasi AI bukan foto spesimen; hiu modern adalah simbol, bukan rekonstruksi hewan dari sisik.

## Input dan output privat

Input arsip Drive `01-INPUT-PRIVAT-HIU.zip` berisi tiga gambar lingkungan, sembilan MP3, naskah/storyboard dan manifest SHA-256. `restore-input.py` menolak entri ganda/tidak dikenal, CRC/hashes salah, atau naskah yang berbeda dengan source. Jangan commit media ke Git publik. Output di `deliverables/shark-2026-11-07/`: MP4 vertikal 1080×1920, thumbnail mandiri, poster 4:5, caption untuk empat platform, SRT, satu master narasi, musik tonal asli dan laporan QA. `pack.py` memverifikasi dan membuat ZIP berisi input, source, font, dan hasil akhir. Dependency tidak termasuk.

## Eksekusi lokal / pemulihan

Checkout branch sesi dan commit yang dicatat pada cadangan. Unduh input ZIP ke `editorial-engine/deliverables/shark-2026-11-07/01-INPUT-PRIVAT-HIU.zip`, lalu dari root repositori:

```bash
bash editorial-engine/pipeline/hiu-sebelum-hutan-2026/build.sh
```

Perlu Linux x64, Python 3, Node/npm, CPU/disk memadai, font yang disertakan pada repo dan akses npm saat `node_modules` belum ada. Render React SVG → resvg → FFmpeg, tanpa browser/GPU, bisa memakan waktu. Jika terganggu, MP4 parsial bukan hasil akhir; periksa penyebab lalu ulangi render. Output codec dapat berbeda di lingkungan lain. Skrip tidak pernah membuat post atau mengubah Drive. Jadwal pukul 19.00 WIB pada storyboard adalah target, bukan bukti telah dijadwalkan.

## Kejujuran QA

Untuk memenuhi batas Facebook Reels via Buffer 3–90 detik, sembilan segmen dipercepat 1,15× dengan `atempo` tanpa memotong isi; kelancaran dan artefak audio perlu didengarkan manusia. Segmentasi adegan sesuai jumlah sampel hasil proses, bukan forced alignment; timing subtitle kalimat diestimasi dari panjang teks/jeda. `qa.py` memeriksa hal mekanis (termasuk batas durasi, codec, seluruh decode, loudness, subtitle, format caption dan sampel), bukan kualitas kreatif. Batas durasi: https://support.buffer.com/article/555-using-facebook-with-buffer Mendengarkan narasi dan pelafalan “ikuti knot theory”, sinkronisasi kata, gerak utuh, pemutaran ponsel/platform, hak suara/citra, penilaian pengguna, dan restorasi penuh dari cadangan tetap NEEDS REVIEW/NOT TESTED sampai benar-benar dilakukan. Berbeda hash pada dua frame tidak membuktikan gerak yang baik. Pengguna menyetujui pengecualian jadwal khusus 7 Nov untuk konten pukul 19.00 dan Titik Buta YT pukul 20.00; ini tidak mengizinkan berbagi publik otomatis atau membuat ulang post yang sudah ada.
