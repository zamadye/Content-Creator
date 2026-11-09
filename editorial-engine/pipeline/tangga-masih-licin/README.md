# Tangga Itu Masih Licin — animatic privat v2

Pipeline offline untuk **preview privat**, bukan rilis. Pengguna menyukai arah awal, meminta istilah dan konteks edukasi diperjelas, lalu meminta produksi. Itu bukan persetujuan publikasi, pengesahan fakta/hak atau receipt reviewer prevoice. Jangan menjadwalkan atau mengunggah ke platform tanpa persetujuan dan gate terpisah.

## Bentuk dan batas kreatif

- Master horizontal 1280×720 dan master vertikal 720×1280 memakai satu narasi yang sama. Short vertikal 720×1280 adalah ringkasan momen penting dengan konteks dan payoff sendiri; `short-sumber-master.json` memetakan sumbernya. Naskah v2: 49 adegan master dan 21 adegan Short.
- File MP4 adalah H.264/AAC dalam wadah 24 fps. Untuk mengurangi kebutuhan CPU, ilustrasi digambar pada **12 gambar/detik** dan ditahan masing-masing dua frame; ini bukan 24 gambar unik/detik. Hasilnya masih animatic vektor terbatas, bukan footage nyata atau animasi karakter penuh.
- Adegan baru untuk Nara, Bima, tetangga dan petugas, dengan air, tangga, lampu, catatan, uang bersama, cermin dan telepon. Ada rig sederhana, pose, ekspresi, gerak benda dan perubahan skala; `objectMap` berisi minimal dua objek per adegan. Periksa sendiri apakah objek benar-benar terlihat dan kontak/gerak masuk akal: label, hitungan objek dan perbedaan pixel bukan bukti kualitas.
- `CERITA FIKTIF` dan `DRAF PRIVAT` muncul sejak frame 0. Video tidak memakai frame, desain atau audio dari referensi. Musik nada disintesis secara orisinal oleh utilitas repo. Satu track narasi sintetis voice-05 digabung dari potongan sesuai urutan.
- Thumbnail dan poster dapat dibuat dengan `make_promos.py` dari ilustrasi sintetis independen yang disimpan privat di Drive, bukan screenshot video. Gambar promosi ini lebih sinematik daripada animatic vektor; konsistensi desain karakter dan representasi cerita tetap butuh pemeriksaan manusia. Hak penggunaan suara/font/musik/ilustrasi dan aturan disclosure platform belum disetujui.
- Subtitle maksimal dua baris dan dipecah menurut teks; posisi dan waktu scene merupakan **perkiraan berdasarkan jeda dan bobot teks**, bukan forced alignment atau transkrip suara. Orang perlu menonton dan mendengar seluruh video, memeriksa pengucapan istilah, teks, musik, ritme, keterbacaan mobile, aksi, serta batas platform.
- Durasi narasi yang diukur pada input v2 ini adalah **176,88 dtk master** dan **80,80 dtk Short**; hasil encode dan batas platform harus dicek ulang. Dokumentasi Buffer yang sebelumnya ditelusuri menyebut FB Page Reels 3–90 detik: Short adalah kandidat durasi, master bukan; bukan jaminan platform menerima unggahan.

## Input dan reproduksi

Sumber narasi/visual dan font ada di repo. Pulihkan `master-01.wav`, `master-02.wav`, `short-01.wav`, dan `voice-manifest.json` dari checkpoint privat ke `.scratch/tangga-v2/voice/`. Manifest mengikat ID voice-05, hash naskah dan WAV, teks persis, dan urutan ID adegan. Hash **tidak** membuktikan apa yang diucapkan, persetujuan reviewer atau kualitas audio. Bila teks berubah, buat ulang voice dan manifest setelah review, jangan mengakali verifikasi.

Dependensi yang diuji: Python 3.11, Pillow 11.3, NumPy, `imageio-ffmpeg` dan FFmpeg yang disertakannya; QA memerlukan ffprobe terpisah. PDF menggunakan ReportLab. Contoh:

```bash
python3 -m venv .scratch/venv
.scratch/venv/bin/pip install 'Pillow>=10,<12' 'numpy>=1.26,<3' 'imageio-ffmpeg>=0.5,<1' 'reportlab>=4,<5'
.scratch/venv/bin/python editorial-engine/content/tangga-masih-licin/test_author.py
.scratch/venv/bin/python editorial-engine/pipeline/tangga-masih-licin/test_render_private.py
.scratch/venv/bin/python editorial-engine/pipeline/tangga-masih-licin/render_private.py \
  --private-rough --voice-dir .scratch/tangga-v2/voice --work-dir .scratch/tangga-v2/work \
  --out-dir .scratch/tangga-v2/out --edition all --plan-only
.scratch/venv/bin/python -u editorial-engine/pipeline/tangga-masih-licin/render_private.py \
  --private-rough --voice-dir .scratch/tangga-v2/voice --work-dir .scratch/tangga-v2/work \
  --out-dir .scratch/tangga-v2/out --edition all
# ffprobe is an independently installed executable; substitute its real path.
.scratch/venv/bin/python editorial-engine/pipeline/tangga-masih-licin/qa_outputs.py \
  --out-dir .scratch/tangga-v2/out --work-dir .scratch/tangga-v2/work --ffprobe /path/to/ffprobe
# Optional: restore the separate art into .scratch, then compose the private PNGs.
.scratch/venv/bin/python editorial-engine/pipeline/tangga-masih-licin/make_promos.py \
  --art .scratch/tangga-v2/out/hero-art.png --out-dir .scratch/tangga-v2/promo
.scratch/venv/bin/python editorial-engine/pipeline/tangga-masih-licin/build_report.py \
  --out-dir .scratch/tangga-v2/out --promo-dir .scratch/tangga-v2/promo \
  --output .scratch/tangga-v2/out/report-review-v2.pdf
```

`--edition` dapat `master`, `master-vertical`, `short`, atau `all`. `--plan-only` menghasilkan kontak gambar, frame pertama, SRT/timeline perkiraan dan key art vektor tetapi tidak encode video. Output dan direktori kerja harus di bawah `.scratch`, flag privat wajib, dan tidak ada network/scheduling. Jika hash, naskah, urutan, `objectMap`, dependensi, file suara, font atau encoder salah/hilang, proses gagal. QA decode memeriksa semua stream, satu cuplikan per adegan, dua sampel gerak, cakupan teks subtitle dan durasi, bukan manusia menonton keseluruhan.

## Gate tetap terbuka

- Prevoice final membutuhkan receipt reviewer manusia independen yang sah dan terikat hash naskah/brief/audit. Preview sintetis **tidak** mengisi atau menggantikan receipt tersebut.
- `NOT TESTED / NEEDS REVIEW`: kebenaran substantif, hak, label AI/disclosure tiap platform, intelligibility/pengucapan dan dengar penuh, keterbacaan mobile, ritme/emosi/efektivitas cerita, respons audiens, serta persetujuan tayang dan jadwal.
- Arahan lama meminta penutup `ikuti knot theory` huruf kecil. Arahan terbaru meminta diskusi tumbuh dari isi, bukan CTA. Preview ini tidak memaksakan CTA; konfirmasi penutup brand sebelum final.
- Semua WAV, MP4, ilustrasi, poster, thumbnail, manifest suara, hasil QA dan checkpoint disimpan di Drive privat, bukan repo publik. Gunakan checkpoint berversi dan verifikasi setelah upload. Jangan mengubah aset v1, menambah akses publik, atau menerbitkan/schedule tanpa izin.
