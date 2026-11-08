# Turbin angin — revisi perilaku audiens, draf privat

Revisi ini mengganti hanya dua kalimat narasi: pembuka menjadi “Angin makin kencang, kok turbin justru bisa berhenti?” dan penutup mengundang tebakan dengan pilihan terbuka. Scene S02–S11, objek/aksi lain, batas fakta, dan shot plan tetap. Naskah dan audit revisi ada di `content/proposals/turbin-angin-draf-v2.json` dan `turbin-angin-audit-kalimat-v2.json`; versi lama dan backup v3 tetap dipertahankan.

**Hanya untuk draf privat.** Pengguna menyetujui revisi naskah/audit dan produksi privat; bukti review terikat pada hash input. Ini bukan izin penjadwalan atau publikasi, bukan bukti hak footage, playback manusia, keterbacaan ponsel, sinkronisasi kata, review ahli atau respons audiens. Catatan tanggal review lama dan tanggal sesi berbeda; keduanya dipertahankan dalam bukti privat untuk ditinjau, bukan direkonstruksi.

## Desain dan timing take ini

- Frame 0 menampilkan turbin berlabel ilustrasi; cut visual pertama di **2,0 detik**. Audio pertanyaan berlanjut di shot penghubung, lalu S02 dimulai pada **3,6 detik**. Akhir cue pertanyaan diperkirakan **3,46 detik** dari awal video; itu estimasi cue, bukan forced alignment. Jadi durasi pembuka lisan/awal cerita masih di luar target kreatif 1–3 detik dan **NEEDS REVIEW**.
- Satu take voice-05 dipakai utuh pada tempo asli; 0,25 detik sunyi awal dipangkas. SHA-256 take: `bb4b929305faec3970b47321aa66a8d28305c966abfc9ea53be329173cbd72b0`. Durasi rencana 77,60 detik/2.328 frame pada 30 fps; video aktual tetap perlu diuji.
- 33 cue diestimasi dari jeda/energi dan dicek terhadap teks masing-masing scene; perhitungan energi bukan pengenalan kata dan tidak membuktikan sinkronisasi. Audio, pelafalan `ikuti knot theory`, musik dan irama belum didengar manusia.
- Periksa kesinambungan puncak sebelum encode dengan menormalisasi mulut Host dan mengecualikan subtitle karena dialog pada kedua momen berbeda. Ini memeriksa kesamaan artwork/model, **bukan** kesamaan seluruh frame final atau pengganti playback.
- Footage 16:9 dipertahankan dalam jendela dan hanya memberi konteks; tidak membuktikan kondisi angin atau sebab turbin tertentu diam. Diagram pitch adalah ilustrasi. Empat sumber Coverr aktual 1920×1080; tracking mengembalikan 404 dan hak/atribusi **NEEDS REVIEW**.

## Input dan eksekusi

Dari root checkout Linux x64, Node/Python 3:

1. `npm ci` di `editorial-engine/` (FFmpeg dan ffprobe tersedia dari dependency terpasang; FFmpeg GPL v3-or-later).
2. Empat original yang hash-nya cocok dengan `footage-manifest.json` di `google_drive/`.
3. `.scratch/turbine-v2/human-review.json`, `original-review.json`, `Review-perubahan-naskah-audit.md`, `narration.txt`, dan `narasi-voice-05.wav`. Bukti review harus sesuai naskah/audit/shot plan persis; jangan membuat keputusan manusia palsu. `prepare.py` menolak take berbeda karena cue-nya hanya dipetakan untuk take ini.

```sh
(cd editorial-engine && npm ci)
node --test editorial-engine/pipeline/turbin-angin-v2/test-preflight.mjs
python3 editorial-engine/pipeline/turbin-angin-v2/test-qa.py
python3 editorial-engine/pipeline/turbin-angin-v2/test-glyphs.py
python3 editorial-engine/pipeline/turbin-angin-v2/test-progress.py
python3 editorial-engine/pipeline/turbin-angin-v2/test-pack-final.py
bash editorial-engine/pipeline/turbin-angin-v2/build-private.sh
```

Build memeriksa review, footage, cmap glyph, teks/cue, frame, komposisi dan decode; membuat audio turunan dan musik, gambar sampel, scene, MP4, subtitle perkiraan, thumbnail/poster, caption dan laporan di `.scratch/turbine-v2/render/`. Tidak mengunggah atau mengakses Buffer. Pemeriksaan cmap, perbandingan SRT dengan data cue untuk burn-in, energi audio, serta contact sheet tidak memverifikasi isi video lewat OCR, pelafalan, kualitas atau pembacaan pada ponsel.

Scene diberi receipt yang mengikat hash output ke source/timing/toolchain. `--all` hanya memakai kembali scene yang receipt, frame dan fingerprint cocok; assembly menolak hasil usang. Jika review, sumber, timing, binary, atau input berubah, selidiki dan render ulang; jangan menghapus/mematikan gate. Konten revisi berbeda memerlukan review manusia baru.

## Checkpoint dan backup

Ketika beberapa scene berurutan selesai:

```sh
python3 editorial-engine/pipeline/turbin-angin-v2/pack-progress.py --through 6
```

Checkpoint ini **belum lengkap**, berisi input privat dan scene/receipt yang selesai; unggah dan verifikasi di Drive privat. Setelah seluruh render dan QA lulus:

```sh
python3 editorial-engine/pipeline/turbin-angin-v2/pack-private-final.py
```

`Turbin-Revisi-DRAF-private-backup-v4.zip` adalah allowlist sumber, empat footage, bukti review lama dan baru, satu take, audio turunan, seluruh scene, video dan QA. Packer menolak overwrite dan memverifikasi setiap hash manifest. Upload privat, unduh kembali, bandingkan SHA-256 ZIP dan verifikasi setiap anggota sebelum menyebut backup terverifikasi. V4 tidak mengubah atau menggantikan backup video versi sebelumnya.

Untuk pemulihan, salin `private-media/` ke `google_drive/`, `private-runtime/` ke `.scratch/turbine-v2/`, dan source `editorial-engine/` ke checkout; install versi dependency yang sama dan jalankan ulang `prepare.py` bila path absolut berbeda. Reuse scene hanya jika fingerprint benar-benar cocok.

## Batas

Jangan menyimpulkan tingkat retensi atau perilaku komentar dari rancangan. Tonton dan dengarkan video lengkap, periksa ponsel, timing subtitle dan hak/atribusi sebelum publikasi. Patuhi preferensi pengguna untuk tidak menyalakan label AI yang opsional; bila disclosure diwajibkan atau tidak jelas, berhenti dan minta keputusan tanpa membuat pernyataan palsu. Buffer dan jadwal memerlukan izin yang sesuai.
