# Chicago 1992 — renderer animatic privat saja

**Bukan renderer final dan bukan integrasi otomatis gate prevoice ke renderer final.** Program ini hanya membuat draf berlabel permanen `REKONSTRUKSI • DRAF PRIVAT` untuk memperoleh kritik. Ia menolak berjalan tanpa `--private-rough`, dan menolak output di luar `.scratch/`. Draf tidak boleh dijadwalkan atau disebut siap tayang. Tidak ada panggilan Buffer, pengubah akses Drive, sistem cron, atau penanganan credential.

Master ditulis dan di-storyboard terlebih dahulu; Short merangkum momen penentu dengan konteks dan putusan yang tidak dipotong secara menyesatkan. Mapping `T02→S19–20`, `T03→S10`, `T04→S11–14`, `T05→S16–19`, `T06→S26`, `T07→S27–28`, `T08→S30`, `T09→S31–32`. Timecode aktual draf dicatat pada `TIMELINE_PERKIRAAN.json` setelah render, bukan dikarang sebelum ada audio. Naskah dan audit Short terpisah.

## Input, setup dan build

1. Source nonrahasia: `editorial-engine/content/chicago-banjir-bawah-1992/{author.py,brief.json,master.script.json,master.audit.json,short.script.json,short.audit.json,render-meta.json}`. `python3 .../author.py` meregenerasi keluaran turunan; perubahan apa pun pada naskah membatalkan kecocokan input voice dan receipt review.
2. Input privat yang **tidak** ada di Git: sepuluh JPG rekonstruksi di `.scratch/chicago/assets/`, rekaman TTS draf `voice-05` dan `rough-input-manifest.json` di `.scratch/chicago/voice/`. Pulihkan dari backup Drive yang sah. Manifest mengikat SHA-256 file media, isi masing-masing segmen narasi, urutan scene dan naskah. Ia tidak membuktikan suara enak, benar atau berizin.
3. Pasang dependensi ke lingkungan privat dari root repo. Tidak memerlukan GPU atau Chrome:

```bash
python3 -m pip install --target .scratch/py -r editorial-engine/pipeline/chicago-banjir-bawah-1992/requirements-rough.txt
python3 editorial-engine/content/chicago-banjir-bawah-1992/author.py
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/render_rough.py \
  --private-rough \
  --asset-dir .scratch/chicago/assets \
  --voice-dir .scratch/chicago/voice \
  --manifest .scratch/chicago/voice/rough-input-manifest.json \
  --out .scratch/chicago/output --only both
```

`--only master` atau `--only short` membatasi render. Input dan output harus tetap privat; output sementara `work/` tidak perlu didistribusikan. `imageio-ffmpeg` memasok FFmpeg statis. Font dari `editorial-engine/assets/fonts/`: Archivo dan Permanent Marker; CTA sengaja memakai Archivo karena Permanent Marker menampilkan karakter lowercase sebagai huruf besar. Musik tonal disintesis lokal, tanpa sampel pihak ketiga; hak semua aset dan hasil dengar tetap perlu diperiksa.

## Cara kerja dan batas

- Preflight memanggil story gate `outline` dengan naskah dan audit master, serta dua pemeriksa cakupan audit kalimat; jika salah satu gagal, proses berhenti. Metadata Short juga diuji memiliki sedikitnya dua nama objek berbeda dan aksi per scene. Itu hanya tes struktur/teks, bukan bukti objek benar-benar terlihat. Manifest melindungi dari ketidakcocokan naskah/voice, perubahan file, path traversal sederhana, urutan scene dan aset tanpa hash. Tidak menguji apakah TTS benar-benar mengucapkan teks yang terikat.
- Suara didekode dan digabung menjadi **satu file narasi** per video. Pemotongan scene/subtitle mencari perkiraan titik hening dan bobot teks; **bukan forced alignment**. Tahun yang dinarasikan sebagai kata-kata ditampilkan sebagai angka agar tidak terpotong secara janggal; pemisahan halaman mengutamakan batas klausa jika muat. Waktu subtitle, pergantian visual dan pelafalan harus ditonton/didengar dan dibetulkan secara manusia sebelum final.
- Latar AI bersifat ilustrasi, bukan rekaman atau foto arsip. Grafik vektor adalah skema ilustratif, bukan peta berskala, lokasi akurat, wajah James, tiruan memo/pengadilan resmi, atau simulasi fisika. Gerak berupa pan/zoom, penanda, dan Host sederhana; draf belum memenuhi klaim animasi karakter final. Durasi, music mix, safe area dan kualitas di ponsel belum lolos penilaian manusia.
- File output: dua MP4 draf (master 1280×720, Short 720×1280, 24 fps), dua PNG thumbnail yang dikomposisikan terpisah, poster 4:5, dua SRT **perkiraan**, satu MP3 narasi per video dan timeline JSON. Resolusi Short ini hanya pratinjau, bukan master 1080×1920 final.
- Ketika nanti membuat pipeline final sungguhan, **wajib** jalankan `story_gate.py --stage prevoice` melalui `run_after_story_gate.py` pada brief master, naskah, audit dan receipt yang hash-nya cocok sebelum voice/render final master. Receipt kosong yang disertakan berstatus `NOT TESTED` dan memang ditolak. Gate saat ini hanya menerima brief `long-master`: belum ada brief/gate prevoice Short yang kompatibel, jadi perlu diimplementasikan dan diuji fail-closed sebelum produksi final Short, serta review manusia dan haknya terpisah. Jangan menyamarkan Short sebagai master atau menulis bukti review palsu. Penonton awal yang belum tahu cerita, playback, akurasi sumber, hak/disclosure, QA teknis dan izin publikasi tetap wajib.
- Salah satu sumber berita [Tribune 2011](https://www.chicagotribune.com/2011/11/24/catching-up-with-newsmakers-of-the-90s/) hanya terbaca melalui indeks karena fetch 403; klaim kembali bekerja pada 1999 juga didukung WBEZ yang dibaca. Putusan dan penuturan wartawan memiliki batas yang dicatat pada `riset-batas-fakta.md`.

## Tes dan diagnosis

```bash
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/test_render_rough.py
python3 editorial-engine/pipeline/story-engine/test_story_gate.py
python3 editorial-engine/pipeline/script-review/test-audit.py
```

Tes sintetis memeriksa penolakan final/path, pengikatan hash/teks/urutan, media yang berubah, alokasi waktu terurut, cakupan subtitle dan pencegahan loop input gambar overlay tanpa batas. Versi awal sempat kehabisan memori saat render S12; perbaikan memakai satu frame pada overlay statis. Uji scene S12, S27, S32 dan T09 di lingkungan ini mencatat peak proses anak maksimum sekitar 292 MiB; bukan jaminan batas memori pada sistem lain. Mereka tidak membuktikan teks suara, sinkron, cerita, hak atau respons audiens. Exit `1` berarti dependency, input/hash, mechanical preflight atau FFmpeg gagal; jangan memaksa bypass. Saat input diubah, perbarui audit dan lakukan review lagi; jika naskah berubah, generate ulang voice sesuai keputusan reviewer dan buat manifest baru, bukan mengganti hash tanpa menyamakan audionya.

## Eksperimen footage bergerak — tetap draf privat

`render_footage.py` membangun ulang dari **satu clock** narasi/scene yang sama, lalu memakai bobot shot relatif di `footage-plan.json`; ia tidak membuat timeline cerita kedua. `footage-sources.json` mengikat SHA-256, asal/tahun, sumber, creator, lisensi dan teks asal pada setiap shot. Program berhenti jika naskah/voice/aset/hash sumber tidak cocok, scene tidak lengkap, rentang klip melewati durasi, atau label/kredit tidak lengkap. Audio sumber dibuang; draf memakai narasi dan musik sintetis. Aslinya dan semua hasil tetap privat, tidak dimasukkan ke Git.

**Tidak satu pun klip adalah rekaman banjir 13 April 1992.** Pusat Chicago sekitar 1974, Sungai Chicago 2014, kereta Metra September 1992 (setelah banjir) dan metro Spanyol 2017 ialah footage konteks yang diberi tanggal/lokasi dan peringatan pada layar. Tekstur video air (2011, lokasi tidak diketahui) kadang dikomposit ke rekonstruksi AI, dan ini juga ditandai; jangan menyebut tekstur itu dokumentasi kejadian atau memastikan teksturnya direkam dari air nyata. Rekonstruksi AI dan skema tetap dipakai saat tidak ada arsip kejadian yang haknya diperiksa. Cuplikan kota/kereta yang menyertai bahasan evakuasi dinyatakan bukan rekaman evakuasi/gangguan. `KREDIT_FOOTAGE_DRAF.txt` dan `caption-footage-draf.txt` mencantumkan attribution, URL sumber/lisensi dan perubahan; klaim lisensi Commons bukan pengganti pemeriksaan hak independen, termasuk hak pihak ketiga dan yurisdiksi.

```bash
# Sumber dan voice dipulihkan dari Drive privat yang sah, bukan dari repositori.
# Gunakan manifest footage-input-manifest.json yang cocok dengan S21 revisi.
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/render_footage.py \
  --private-rough --asset-dir .scratch/chicago/assets --voice-dir .scratch/chicago/voice \
  --footage-dir .scratch/chicago/footage/originals \
  --manifest .scratch/chicago/voice/footage-input-manifest.json \
  --out .scratch/chicago/footage/output --only both

PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/test_render_footage.py
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/test_pack_footage_private.py

# ffprobe untuk contoh Linux x64 berikut disimpan di .scratch; pada sistem lain
# gunakan binary ffprobe yang sesuai. Sesuaikan --out dengan output privat aktual.
npm install --prefix .scratch/chicago/tools @ffprobe-installer/linux-x64@5.2.0
# Pemeriksaan ini tidak menggantikan review pemutaran/pendengaran oleh manusia.
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/qa_footage.py \
  --out .scratch/chicago/footage/output \
  --ffprobe .scratch/chicago/tools/node_modules/@ffprobe-installer/linux-x64/ffprobe
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/write_footage_storyboard.py \
  --timeline .scratch/chicago/footage/output/TIMELINE_FOOTAGE_PERKIRAAN.json \
  --out .scratch/chicago/footage/output/STORYBOARD_FOOTAGE_DRAF.md

# Catatan pemulihan privat harus memuat lokasi sumber dan hasil yang disimpan terpisah.
PYTHONPATH=.scratch/py python3 editorial-engine/pipeline/chicago-banjir-bawah-1992/pack_footage_private.py \
  --manifest .scratch/chicago/voice/footage-input-manifest.json \
  --restore-note .scratch/chicago/footage/RESTORE-PRIVAT.txt \
  --out .scratch/chicago/footage/CHECKPOINT_INPUT_FOOTAGE_PRIVAT.zip
```

`--include-companions --output-dir <direktori-privat>` menambahkan file pendamping yang telah selesai termasuk storyboard, laporan dan QA, tetapi **tidak** menambahkan MP4 hasil atau tujuh sumber video: simpan dan verifikasi terpisah di Drive privat. Pemeriksa QA melakukan decode, perhitungan frame, konsistensi urutan scene/shot/SRT, perbandingan durasi, pengukuran loudness dan dimensi gambar; kesuksesan mekanis bukan PASS untuk pemutaran atau review manusia. Subtitle portrait diletakkan di atas 18% terbawah sebagai target ruang untuk overlay aplikasi, bukan jaminan aman di semua platform/perangkat. Tidak ada overwrite backup animatic lama. Output tetap ber-watermark draf, tidak ada Buffer/pengaturan berbagi, dan Short masih belum punya gate prevoice kompatibel. Subtitle/scene timing hasil estimasi, komposisi vertikal, kecocokan gambar terhadap kalimat, respons penonton, kemampuan karakter, hak/disclosure, pemutaran/pendengaran penuh dan persetujuan rilis masih harus ditinjau manusia. Tests memakai klip sintetis untuk memastikan jumlah frame dan audio sumber tidak ikut, tetapi tidak dapat membuktikan keterbacaan di ponsel atau kualitas emosional.
