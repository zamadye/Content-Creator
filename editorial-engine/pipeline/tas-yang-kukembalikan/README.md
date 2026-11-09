# Tas yang Kukembalikan — renderer animatic privat

Renderer offline untuk mengevaluasi cerita/gerak, **bukan renderer rilis**. Tidak memakai file atau frame referensi, tidak memanggil internet/Buffer, dan menolak output di luar `.scratch/`. Voice sintetis dan semua media produksi tetap privat di Drive; jangan commit media, manifest privat, kredensial atau input referensi.

## Bentuk & desain

- Tiga output: master horizontal 1280×720, master alternatif vertikal 720×1280, Short turunan 720×1280; 24 fps, H.264/AAC. Dua rasio master memakai narasi yang sama. Short adalah edit ulang cerita dari titik masalah/penemuan, bukan video penuh yang dipotong sembarang.
- Satu track narasi voice-05 per video, setelah menyatukan potongan master berurutan; musik nada orisinal yang disintesis, bukan rekaman referensi. Master kira-kira 2:54; Short kira-kira 1:03. Dengarkan campuran penuh untuk memastikan pelafalan, level dan kenyamanan—belum terbukti.
- Maya, Nisa, dan tester digambar sebagai rig vektor sederhana dengan tangan, ekspresi, mulut, objek dan aksi. Pada revisi animatic, tangan diarahkan ke tas/payung, sampel berpindah, tas diturunkan dan kartu bergerak dari kantong; pergerakan masih disederhanakan. Tas, kartu, payung, mesin jahit, catatan, kalkulator dan tempat adalah ilustrasi original dengan kontinuitas yang dirancang. Ini animatic vektor, **bukan** footage nyata atau animasi karakter kompleks: daya hidup, kontinuitas tangan dan emosi harus direview manusia.
- `CERITA FIKTIF` dan `DRAF PRIVAT` tampil dari frame 0. Thumbnail/poster adalah komposisi terpisah dari video. Subtitle 2 baris dengan pemenggalan berbasis klausa; batas kalimat dan scene **perkiraan berbasis jeda**, bukan forced alignment. Seluruh subtitle dan kesesuaian aksi/audio harus diperiksa dengan mendengarkan.

## Input dan konfigurasi

- Repo berisi sumber naskah, storyboard, audio-timing utility Chicago, font Archivo dan kode gambar di file ini.
- Directory voice privat berisi `master-01.wav`, `master-02.wav`, `short-01.wav` dan `voice-manifest.json`. Manifest berisi versi, `voiceId=voice-05`, hash SHA-256 setiap naskah dan WAV, teks yang tepat dan ID scene yang berurutan. Hash mendeteksi perubahan, **tidak membuktikan** suara telah disetujui reviewer atau selalu mengucapkan naskah dengan benar.
- Input divalidasi untuk SHA-256, urutan/kecocokan teks, nama file tanpa traversal, serta minimal dua nama objek/tindakan per scene; validasi naskah master + audit kedua versi berjalan sebelum render. Keluaran wajib dalam `.scratch`; `--private-rough` wajib.
- Dependencies lingkungan yang diuji: Python 3.11, Pillow 11.3, NumPy 2.3.3, imageio-ffmpeg 0.6.0. `imageio_ffmpeg` menyediakan FFmpeg, tanpa GPU; uji `ffprobe` memakai binary terpisah di scratch. Font lokal dan generator skor ada pada repo. Tidak ada kunci API atau download selama render.

Contoh setup scratch jika dependensi belum ada:

```bash
python3 -m pip install --target .scratch/tas-deps 'Pillow==11.3.0' 'numpy==2.3.3' 'imageio-ffmpeg==0.6.0'
# Pulihkan voice-manifest.json dan 3 WAV dari checkpoint Drive privat ke .scratch/tas-animation/voice/.
PYTHONPATH=.scratch/tas-deps python3 editorial-engine/pipeline/tas-yang-kukembalikan/test_render_private.py
PYTHONPATH=.scratch/tas-deps python3 editorial-engine/pipeline/tas-yang-kukembalikan/render_private.py \
  --private-rough --voice-dir .scratch/tas-animation/voice \
  --work-dir .scratch/tas-animation/work --out-dir .scratch/tas-animation/out --edition all --plan-only
PYTHONPATH=.scratch/tas-deps python3 -u editorial-engine/pipeline/tas-yang-kukembalikan/render_private.py \
  --private-rough --voice-dir .scratch/tas-animation/voice \
  --work-dir .scratch/tas-animation/work --out-dir .scratch/tas-animation/out --edition all
```

`--edition` juga dapat `master`, `master-vertical`, `short`, atau `both` (master horizontal dan Short). `--plan-only` membuat timeline perkiraan, SRT, contact sheet, frame awal dan key art tanpa encode. Output final animatic adalah `*-DRAF-PRIVAT.mp4`; input voice hasil normalisasi serta timeline ada di work-dir privat. Proses membutuhkan ruang untuk silent MP4, WAV dan hasil; semua hasil dapat dibangun kembali dari source+private inputs.

## Masalah umum & batas

- Hash salah, teks berubah, voice hilang/berbeda atau ID scene tidak berurutan: render gagal; regenerasi voice dan rebind manifest setelah review, jangan mengabaikan pemeriksaan.
- `ModuleNotFoundError`: install versi scratch di atas. `ffmpeg`/encoder gagal: cek log, ruang dan binary; jangan tandai video PASS bila tidak terbaca penuh. `ffprobe` perlu binary terpisah, tidak dihasilkan renderer.
- Output di luar `.scratch` atau tanpa flag: gagal sengaja. Ini hanya melindungi jalur output renderer; manusia tetap perlu menjaga privasi file lain.
- `test_render_private.py` memakai input sintetik untuk validasi, paginasi, geometri dan perbedaan pixel gerak. Ia tidak membuktikan kualitas ilustrasi, emosi, lip-sync, mobile legibility atau respons audiens. QA aktual harus memeriksa durasi/codec, full decode, frame awal, gerak, kesesuaian audio/subtitle, hak/font/voice, klaim, keterbacaan dan batas platform.
- Gerbang `prevoice` final belum lulus: butuh receipt reviewer manusia yang nyata dan mengikat hash brief/naskah/audit. Rough privat ini tidak mengisi/mengganti receipt. Fakta/hak/disclosure, respons penonton, full listening, QA manusia dan persetujuan rilis masih **NOT TESTED** sampai dilakukan.
- Facebook Page via Buffer adalah Reels (3–90 detik menurut dokumentasi yang ditelusuri sebelumnya): master sekitar 174 detik tidak cocok sebagai Reels tersebut. Short sekitar 63 detik adalah kandidat durasi, tetap perlu konfirmasi format/persyaratan platform pada saat publikasi. Tidak ada output yang otomatis diunggah atau dijadwalkan.

## QA dan report privat

Setelah render, dengan binary ffprobe lokal yang tepercaya tersedia, jalankan:

```bash
PYTHONPATH=.scratch/tas-deps python3 editorial-engine/pipeline/tas-yang-kukembalikan/qa_outputs.py \
  --out-dir .scratch/tas-animation/out --work-dir .scratch/tas-animation/work \
  --ffprobe /path/to/ffprobe
# Opsional report PDF: install reportlab==4.4.4 dalam direktori scratch yang sama.
PYTHONPATH=.scratch/tas-deps python3 editorial-engine/pipeline/tas-yang-kukembalikan/build_report.py \
  --out-dir .scratch/tas-animation/out
```

QA memeriksa codec, ukuran, frame rate, durasi, satu stream audio, full decode dan perbedaan dua sampel frame. Ia menghasilkan `technical-qa.json`, frame awal dan contact sheet hasil decode. Memeriksa perbedaan frame tidak membuktikan gerak meyakinkan. Report membacanya sebagai status teknis; review editorial, dengar penuh, akurasi/rights/disclosure dan rilis tetap terpisah.
