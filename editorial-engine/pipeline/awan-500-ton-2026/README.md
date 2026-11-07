# Dunia Kebalik — Awan 500 Ton (produksi privat)

Ini satu video, satu timeline dan satu take narasi voice-05 tanpa percepatan. Contoh hitungan USGS adalah **massa air** pada awan kumulus hipotetis 1 km³ dengan 0,5 g/m³, bukan massa total setiap awan; udara tidak dihitung. Naskah, sumber, objek dan aksi sembilan adegan ada di `content/recovered/awan-500-ton-2026.json`. Pada beberapa awan tetesan dapat membesar dan jatuh; awan tidak selalu menghasilkan hujan. Visual skematis dan perbesaran tidak berskala.

## Input, keluaran dan privasi

Input ZIP privat `01-INPUT-PRIVAT-AWAN.zip` berisi tiga ilustrasi lingkungan AI, satu MP3 narasi dan naskah serta SHA-256 per entri. `restore-input.py` memvalidasi daftar entri, CRC, hash dan kecocokan naskah dengan checkout; ekstraksi dibatasi empat path media. Timeline/subtitle hanya cocok dengan take yang hash-nya tercatat di `prepare.py`; perubahan suara harus membuat timing baru, bukan mengabaikan hash. Input dan hasil disimpan di Drive privat, jangan commit media atau ID/tautan privat ke Git.

Di `deliverables/awan-500-ton-2026/`: MP4 vertikal 1080×1920 H.264/AAC, thumbnail PNG mandiri, poster 4:5, empat caption, storyboard terbaca manusia, SRT, musik tonal dari kode, laporan QA, SHA-256 dan ZIP cadangan berisi source, font, input serta keluaran. Skrip ini tidak memakai Coverr, membuat post, menyetel jadwal atau mengubah Drive.

## Build lokal sekali jalan

Memerlukan Linux x64, Python 3, Node/npm, CPU/disk memadai, font repo dan akses npm registry jika dependency belum ada. Di checkout branch sesi, taruh `01-INPUT-PRIVAT-AWAN.zip` ke `editorial-engine/deliverables/awan-500-ton-2026/`, lalu dari `editorial-engine/` jalankan:

```bash
npm run build:awan
```

Render React/SVG → resvg → FFmpeg berlangsung tanpa browser/GPU dan dapat memakan waktu. Jika proses berhenti, MP4 parsial **bukan hasil akhir**. Periksa error dan jalankan ulang. `npm ci` menginstal dependency sesuai lockfile; tidak disertakan dalam arsip. Byte output dapat berbeda lintas sistem/versi codec. Periksa lisensi FFmpeg dan seluruh hak sebelum distribusi. Build ulang lengkap dari backup Drive **belum diuji**; restore input pada direktori terisolasi diuji saat input tersedia.

## Tes dan batas

```bash
python3 -m unittest pipeline/awan-500-ton-2026/test_pipeline.py -v
python3 pipeline/awan-500-ton-2026/qa.py
```

QA membuktikan hal mekanis tertentu saja: codec, durasi, frame timestamps, decode, loudness, struktur subtitle, caption, dimensi dan perbedaan sample. Seluruh take suara, pengucapan CTA, keseimbangan musik, word-level subtitle, gerakan, hak dan pemutaran perangkat tetap **NEEDS REVIEW/NOT TESTED** sampai manusia memeriksa. Waktu adegan diletakkan pada jeda; timing subtitle dalam kalimat diperkirakan, bukan forced alignment. Frame berbeda tidak membuktikan interaksi yang baik. Pembahasan ilmiah merujuk USGS, riset Takahashi dkk. 2017 dan penjelasan NASA/JPL. Tidak otomatis dipublikasikan, bahkan bila tes mekanis lulus.
