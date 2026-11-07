# Reproduksi Shorts 11–13 November 2026

Reproduksi baru, **bukan** pemulihan video asli. Alur ini membuat satu episode per eksekusi dan tidak membuat, menjadwalkan, atau mengubah posting. Target waktu di naskah adalah rencana editorial, bukan jadwal publikasi.

## Komponen dan batas

| Komponen | Masukan | Keluaran | Cara dan batas |
|---|---|---|---|
| Narasi dan storyboard | `content/recovered/week-2026-11-11-{narration,storyboards}.json` | 5 adegan/episode dengan peta objek | Satu teks per episode; semua adegan minimal 2 objek. URL sumber primer ada di data. |
| Voice | MP3 privat, satu file per episode, `voice-05` bahasa Indonesia | Dibaca sebagai track narasi tunggal | Generasi suara butuh layanan terpisah; dengarkan seluruhnya, termasuk pelafalan CTA. |
| `prepare.py` | JSON + MP3 + ilustrasi PNG privat | `prepared.json`, `subtitle-perkiraan.srt`, JPEG runtime dan WAV musik original | Alokasi durasi dengan panjang teks dan deteksi jeda; **bukan forced alignment**. Musik deterministik dari gelombang sinusoida, tidak memakai rekaman pihak ketiga. |
| `captions.py` | JSON | TXT untuk Facebook, TikTok, YouTube Shorts, Instagram | Sumber dan hashtag ada pada setiap bagian; tinjau sebelum menyalin. |
| `render.tsx` | data hasil prepare + gambar + suara | still QA, thumbnail PNG terpisah, MP4 | Headless React SVG → resvg → FFmpeg; satu encoder image2pipe CFR. Thumbnail disusun ulang, bukan screenshot. Ilustrasi AI, grafik skematis dan bukan gambar resmi. |
| `qa.py` | MP4, PNG, TXT, SRT | `QA-DAN-SUMBER.md`, `SHA256SUMS.txt` | Memeriksa codec, dimensi, durasi, decode, loudness, CTA input, struktur dan caption; tidak menggantikan tinjauan manusia. |

## Menyiapkan input privat

Dari `editorial-engine`, jalankan `npm ci --include=dev --no-audit --no-fund` di Linux x64 dengan Python 3. Tempatkan satu ilustrasi dan satu narasi dari cadangan privat (bukan dari Git):

```
assets/generated/rebuild-2026-11-11/EPISODE_ID.png
audio/voiceovers/rebuild-2026-11-11/EPISODE_ID.mp3
```

File media dan output diabaikan Git. Repositori publik: jangan tambahkan media privat, credential, kunci, atau tautan akses rahasia. Pasang pengaman dengan `bash scripts/install-privacy-hook.sh` dari root repo setiap kali workspace baru; pengaman hanya memeriksa nama file, sehingga diff tetap harus diperiksa manual.

## Satu perintah per episode

```bash
cd editorial-engine
npm ci --include=dev --no-audit --no-fund
bash pipeline/rebuild-nov-2026/build.sh antartika-gurun-2026
```

Perintah ini menimpa output dengan ID yang sama. Output berada di `deliverables/rebuild-2026-11-11/EPISODE_ID/`: MP4, PNG thumbnail, caption TXT, SRT perkiraan, frame QA, WAV musik, laporan dan SHA-256. Build membutuhkan paket npm terkunci dan binary ffmpeg/ffprobe Linux x64 dari dependensi; bukan renderer Remotion berbasis browser. Suara dan ilustrasi tidak otomatis diunduh. Untuk input dan versi source yang sama, generator musik dan rendering dirancang deterministik, tetapi kesamaan byte lintas versi CPU/library belum dijamin.

## Cadangan dan pemeriksaan wajib

1. Cadangkan input privat sebelum rendering: jalankan `python3 pipeline/rebuild-nov-2026/archive_inputs.py EPISODE_ID` untuk mengemas PNG, satu MP3, naskah, dan SHA-256. Simpan ZIP di Drive privat; jangan taruh ke Git publik.
2. Commit/push source nonrahasia ke branch sesi yang disetujui, periksa kembali remote HEAD. Media tetap di Drive.
3. Jalankan build dan simpan MP4, PNG thumbnail, caption TXT, SRT/laporan/manifes ke Drive privat. Bandingkan checksum dan periksa izin folder dan berkas. Hanya metadata checksum cocok yang dapat diklaim; pemulihan/unduhan terpisah perlu diuji tersendiri.
4. Tinjau seluruh suara dan visual pada ponsel, sinkron subtitle, pelafalan CTA, fakta, hak media, dan visibilitas teks. Statusnya **NEEDS REVIEW** sampai benar-benar diperiksa, sekalipun QA mekanis PASS.
5. Jangan membuat posting atau jadwal tanpa izin eksplisit. Tidak ada integrasi Buffer dalam pipeline ini.

## Kesalahan umum

- `Missing private voice or art`: pulihkan file input privat dengan nama dan path di atas.
- `Cannot find ... ffprobe / ffmpeg`: pasang dependensi terkunci pada Linux x64, atau sesuaikan path tool setelah memverifikasi build FFmpeg. `-nostdin` dipakai untuk mencegah FFmpeg membaca input shell.
- `FFmpeg exit ...`: lihat `ffmpeg-error.log` di folder output; bangun ulang setelah penyebab diperbaiki. Gunakan satu proses image2pipe, bukan menggabungkan segmen video pendek.
- `FAIL` pada QA: jangan kirim sebagai selesai; catat dan perbaiki. Loudness dibatasi -18 hingga -13 LUFS dan true peak ≤ -2 dBTP sebagai cek mekanis, bukan penilaian kualitas audio.
- Subtitle kurang cocok dengan ucapan: sesuaikan secara manual setelah mendengar audio; pipeline ini belum punya alignment kata.

Font Archivo dan dependensi di repositori punya lisensi masing-masing. Hak penggunaan hasil AI/TTS dan distribusi di tiap platform perlu ditinjau sebelum publikasi.
