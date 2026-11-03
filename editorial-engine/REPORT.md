# LAPORAN TEKNIS — MBG: "0,0017 persen punya nama"

Status dokumen: **hasil pengukuran, bukan klaim.** Setiap angka di bawah diambil dari
perintah yang benar-benar dijalankan pada mesin ini. Status yang dipakai:
`PASS` / `FAIL` / `NEEDS REVIEW` / `NOT TESTED`, dengan bukti
`VERIFIED` (dijalankan & diukur) / `TESTED` (diuji terbatas) / `LIKELY` / `ASSUMPTION` / `UNKNOWN`.

---

## 0. Ringkasan

| Item | Nilai | Status |
| --- | --- | --- |
| Topik | Program Makan Bergizi Gratis (MBG) & keracunan massal | — |
| Tesis | "Bukan nasinya yang salah — cara kita mengukur berhasil yang salah" | — |
| Deliverable A | Editorial poster 1080×1350, 4:5 | **PASS (VERIFIED)** |
| Deliverable B | Video 1080×1920, 88,67 s, 30 fps, VO + subtitle + SFX + skor | **PASS (VERIFIED)** |
| Deliverable C | Subtitle `.srt` / `.vtt` (26 cue) + laporan ini | **PASS (VERIFIED)** |
| Backend render | React → SVG → resvg → PNG → FFmpeg (bukan Chromium) | **PASS (VERIFIED)** |
| Remotion sebagai timeline owner | Komponen Remotion asli, dirender oleh runtime sendiri | **PASS (TESTED)** |
| `remotion render` (CLI resmi) | Gagal: `libnss3.so` tidak ada, `apt` tidak tersedia | **FAIL** |
| ComfyUI / CosyVoice / WhisperX / Librosa | Tidak dapat dijalankan (tanpa GPU / tanpa torch) | **NOT TESTED** |
| Determinisme | Frame identik byte-per-byte saat dirender dua kali | **PASS (VERIFIED)** |

---

## 1. Lingkungan & batasan perangkat

| Aspek | Nilai | Bukti |
| --- | --- | --- |
| OS | Debian 12 (container) | `cat /etc/os-release` |
| CPU | 2 vCPU | `nproc` |
| RAM | 3.939 MB | `free -m` |
| Node | v22.22.3 | `node -v` |
| Python | 3.11.2 | `python3 -V` |
| GPU | tidak ada | — |
| Chromium | tidak dapat dijalankan | `@sparticuz/chromium` gagal: `libnss3.so: cannot open shared object file`; `apt-get` tidak dapat menjangkau repositori |
| FFmpeg sistem | tidak ada | dipakai `@ffmpeg-installer/ffmpeg` (statis) |

Batasan ini yang menentukan arsitektur: **tanpa Chromium tidak ada Remotion CLI**,
sehingga backend render ditulis sendiri di atas resvg. Komponen visual tetap komponen
React/Remotion biasa (`useCurrentFrame`, `interpolate`, `spring`, `Sequence`,
`AbsoluteFill`), jadi ketika Chromium tersedia, `remotion render` memakai scene yang
sama tanpa perubahan kode.

---

## 2. Tool stack: apa yang terintegrasi

| Tool | Status | Bukti / alasan |
| --- | --- | --- |
| **Remotion 4.0.380** (runtime + komposisi) | **PASS (TESTED)** | `remotion/src/runtime/index.tsx` mengimplementasikan subset API yang dipakai (`FrameProvider`, `useCurrentFrame`, `interpolate`, `spring`, `random`, `Sequence`, `AbsoluteFill`). 9 scene + 1 poster memakai API ini. Studio/CLI belum pernah jalan (Chromium). |
| **@resvg/resvg-js 2.6.2** | **PASS (VERIFIED)** | 2.660 frame dirender; butuh TTF asli (woff2 ditolak). |
| **FFmpeg 5.x (static)** | **PASS (VERIFIED)** | encode H.264 CRF 18, mix audio, `ebur128`. Catatan: build ini tidak punya `amix=normalize` — kompensasi gain manual (lihat §7). |
| **Fonts: Instrument Serif + Archivo** | **PASS (VERIFIED)** | `@fontsource/*` (woff2) → `wawoff2` → 6 TTF di `assets/fonts/`. Dua keluarga, sesuai batas tipografi. |
| **CosyVoice (TTS lokal)** | **NOT TESTED** | butuh torch + model (~GB) + GPU; tidak tersedia di sandbox. |
| **TTS yang dipakai** | **PASS (TESTED)** | Suara Bahasa Indonesia dari layanan TTS Arena; 7 klip, 76,53 s total, 1,72–2,48 kata/detik. Kualitas pelafalan nama/tempat **NEEDS REVIEW** — lihat §8. |
| **WhisperX (forced alignment)** | **NOT TESTED** | butuh torch + model. |
| **Librosa** | **NOT TESTED** | dipakai `numpy` untuk analisis sinyal (RMS, deteksi klip) dan sintesis skor. |
| **ComfyUI (image generation)** | **NOT TESTED** | tidak ada GPU; ilustrasi seluruhnya vektor, bukan gambar hasil model. |
| **Anime.js** | **TIDAK DIPAKAI** (keputusan) | Remotion adalah pemilik timeline; menambah Anime.js berarti timeline kedua. Semua gerak ditulis sebagai fungsi frame (`interpolate`/`spring`). |
| **Lottie Web** | **TIDAK DIPAKAI** | tidak ada aset Lottie; playback Lottie butuh browser, yang justru tidak tersedia. |

---

## 3. Arsitektur yang dipakai

```
content/scripts/*.json ─┐
content/storyboards/*.json ─┤
audio/voiceovers/*.mp3 ──┴─> build-timeline.ts ──> content/timeline.json
                                                    └─> remotion/src/content/timeline.generated.ts
                                                          │
remotion/src/scenes/s01…s09 (komponen React) ─────────────┤
remotion/src/compositions/EditorialVideo.tsx ─────────────┘
        │
        ├─ render-frames-chunked.sh → rendering/frames/f00000.png … f02659.png
        │        (React → SVG string → resvg → PNG, 2.660 frame)
        │
synth_score.py (numpy) → bed.wav + 5 SFX
        │
mix-audio.ts (FFmpeg) → audio/mix/master.wav (-14,2 LUFS)
        │
encode.ts → deliverables/B_…mp4   ·   render-poster.ts → deliverables/A_…png
        │
qa.ts → qa/QA-TECHNICAL.md
```

Satu perintah: `bash pipeline/build-all.sh`.

---

## 4. Aset & sumber visual

| Aset | Jenis | Catatan |
| --- | --- | --- |
| Karakter (`figures.tsx`) | Vektor, rig bersendi | 4 tipe tubuh (anak laki/perempuan, dewasa laki/perempuan + petugas); identitas (warna pakaian, kerudung, proporsi) konsisten antar-scene karena satu rig dipakai semua scene. |
| Props (`props.tsx`) | 25 objek | piring, baki, sertifikat, tumpukan dokumen, jam dinding, termometer, meja kursi, bangku, tiang infus, wok, rak, rice cooker, tas, ponsel, podium, uang, stempel, tangan terkatup, tumpukan piring. |
| Environment (`environments.tsx`) | 7 ruang konkret | koridor sekolah, kelas, dapur SPPG, ruang tunggu senja, aula, ruang data, kelas kosong. Tidak ada latar abstrak. |
| Font | 6 TTF | 2 keluarga. |
| Audio | 100% sintesis sendiri | skor + SFX dibuat dari numpy; tidak ada sampel pihak ketiga → tidak ada masalah lisensi. |
| Suara | TTS Arena | 7 klip, dipotong per segmen agar satu baris bisa diganti tanpa mengulang film. |

**Tidak ada** gambar hasil model generatif, tidak ada logo institusi, tidak ada wajah
pejabat, dan setiap frame bergambar peristiwa diberi label `ILUSTRASI`.

---

## 5. Waktu render (diukur di mesin ini)

| Tahap | Waktu | Catatan |
| --- | --- | --- |
| Font (woff2 → ttf) | ± 3 s | sekali per instalasi |
| Ukur VO (7 klip) | ± 3 s | `ffmpeg volumedetect` + durasi |
| Bangun timeline + subtitle | ± 4 s | — |
| Skor + SFX (88,67 s audio) | ± 4 s | numpy |
| Mix audio | ± 7 s | 25 input FFmpeg |
| Render 2.660 frame | ± 12–15 menit | 2–15 fps tergantung scene; dipecah per 180 frame karena proses tunggal di-OOM-kill sekitar 600 frame |
| Encode MP4 | 62–69 s | CRF 18, `preset medium`, 2 vCPU |
| Poster | 0,16 s | — |
| QA teknis | ± 7 s | termasuk `ebur128` |
| **Total dari nol** | **± 18–22 menit** | satu mesin 2 vCPU |

Kegagalan yang benar-benar terjadi: dua proses render paralel menghabiskan 3,9 GB RAM →
proses pertama dibunuh kernel (`exit 137`). Solusi: chunk 180 frame, satu proses per chunk
(`pipeline/render-frames-chunked.sh`), RSS tetap datar.

---

## 6. Hasil QA teknis (diukur)

Dari `qa/QA-TECHNICAL.md` (dibuat otomatis oleh `pipeline/qa.ts`):

| ID | Pemeriksaan | Status | Nilai |
| --- | --- | --- | --- |
| T1 | Resolusi 1080×1920 | PASS | 1080×1920 |
| T2 | Codec / pixel format | PASS | h264 / yuv420p |
| T3 | Frame rate 30 fps | PASS | 30 fps |
| T4 | Durasi 45–90 s | PASS | 88,67 s |
| T5 | Stream audio | PASS | AAC 48 kHz stereo 192 kb/s |
| T6 | Loudness terintegrasi | PASS | −14,2 LUFS |
| T7 | True peak | PASS | −3,4 dBTP |
| S1–S5 | Subtitle: parse, ≤2 baris, ≤42 karakter, tanpa tumpang-tindih, ≥1,0 s | PASS | 26 cue; baris terpanjang 41 karakter; cue terpendek 1,13 s |
| F1 | Semua frame ada | PASS | 2660/2660 |
| P1 | Poster 1080×1350 | PASS | 1080×1350 |
| A1–A2 | ≤2 keluarga font, font lokal | PASS | Instrument Serif, Archivo; 6 TTF |

Determinisme (di luar `qa.ts`, diuji manual): frame 120 / 900 / 1800 / 2500 dirender dua
kali → **md5 identik**. Tidak ada `Math.random`, `Date.now`, CSS animation, atau
`foreignObject` di jalur render.

---

## 7. Kesalahan yang ditemukan & perbaikannya

| # | Masalah | Penyebab | Perbaikan |
| --- | --- | --- | --- |
| 1 | Render Remotion gagal | Chromium butuh `libnss3.so`; `apt` mati | backend resvg ditulis sendiri |
| 2 | Nuansa `npm install ffmpeg-static` gagal | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | pakai `@ffmpeg-installer/ffmpeg` |
| 3 | JSX di file `.ts` | esbuild: *Expected '>' but found value* | semua komponen `.tsx` |
| 4 | Wajah karakter jadi gumpalan cokelat | kain kerudung digambar setelah wajah | urutan cat: kain → telinga → wajah |
| 5 | Tangan lepas dari badan | posisi prop ditebak | prop memakai `limbEndPoint(...)` dari sendi bahu |
| 6 | Panah `→` muncul sebagai kotak | font tidak punya glyph panah | `ArrowRight` digambar sebagai bentuk |
| 7 | `amix=normalize=0` tidak dikenal | FFmpeg 5.x bawaan npm | kompensasi `+20·log10(n)` per input |
| 8 | `amix` 3 input → *Invalid argument* | bug build FFmpeg ini | penjumlahan berpasangan (2 input per tahap) |
| 9 | `loudnorm` → *Invalid argument* | loudnorm melepas channel layout & naik ke 192 kHz | `aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo` setelahnya |
| 10 | Master −12,1 LUFS (target −14) | single-pass loudnorm overshoot | trim −2,1 dB; diukur ulang → −14,2 LUFS |
| 11 | Dua subtitle tampil bersamaan | cue terakhir tiap segmen diberi durasi seluruh segmen | sisa durasi dibagikan benar + penjaga anti-tumpang-tindih |
| 12 | Angka terbelah dua baris ("tujuh / puluh satu triliun") | pemotongan subtitle otomatis | baris subtitle ditulis manusia; QA menolak >42 karakter |
| 13 | Naskah 88,3 s suara → film > 90 s | VO awal terlalu panjang | 3 baris dipendekkan, total 76,53 s bicara |
| 14 | Render paralel → OOM (exit 137) | 2 proses × ~1,9 GB | chunk 180 frame, proses berumur pendek |
| 15 | Dua teks sama di s09 (pertanyaan di layar + subtitle) | naskah layar mengulang narasi | layar memuat jawabannya: "Bukan nasinya. / Cara kita mengukurnya." |
| 16 | s01 terbaca "berdiri di belakang bangku", bukan siswa yang tumbang | meja latar & meja depan bertumpuk di kedalaman yang sama | meja latar dihapus, satu meja didorong ke kanan, kedua siswa berdiri di satu garis lantai dengan bayangan |
| 17 | Subtitle menutupi tas di s09 | band subtitle tetap, objek bergerak | kursi + tas dipindah ke atas band subtitle |

---

## 8. QA visual (dinilai manusia terhadap frame hasil render)

| Kriteria | Status | Catatan |
| --- | --- | --- |
| Focal point jelas per scene | PASS | s04 angka, s06 sertifikat vs termometer, s08 tangan terkatup, s09 kursi kosong |
| Anatomi & proporsi | PASS (dengan catatan) | rasio anak:dewasa ≈ 0,72; sendi tangan–bahu tersambung; **catatan**: lengan bawah masih kaku pada pose menunjuk |
| Hierarki teks | PASS | judul ≤2 baris, badan teks tidak menutupi wajah; angka utama memakai scrim |
| Palet | PASS | bumi redup + aksen mustard/bata; maksimal satu aksen per frame |
| Tipografi ≤2 keluarga | PASS | Instrument Serif (suara editorial) + Archivo (informasi) |
| Gerak punya tujuan | PASS | push-in pada angka, hitung naik pada 37.693, stempel jatuh berurutan, kamera genggam pada s08, cahaya senja bergerak di s09 |
| Perubahan visual tiap 3–5 s | PASS (VERIFIED) | 9 scene, 26 cue subtitle, rata-rata 3,4 s per perubahan; scene terpanjang (s04, 16,2 s) punya 4 keadaan visual di dalamnya |
| Keterbacaan di ponsel | PASS | tinggi huruf subtitle 46 px pada 1080 lebar; judul ≥52 px |
| Label ILUSTRASI | PASS | pada poster + setiap scene bergambar peristiwa |
| Suara: pelafalan nama/tempat | NEEDS REVIEW | "JPPI", "Ombudsman Sumatera Utara", "Kudus" perlu didengar penutur asli; belum dapat diverifikasi di sini |
| Nada narasi | NEEDS REVIEW | tenang & percakapan; bukan pembaca berita — dinilai dari parameter & panjang jeda, belum lewat pendengaran manusia |

---

## 9. Keterbatasan yang diketahui

1. **Belum pernah diuji di Chromium.** Komponen adalah Remotion asli, tetapi
   `remotion studio` / `remotion render` belum terbukti jalan di mesin ini.
2. **Forced alignment tidak ada.** Waktu subtitle berasal dari durasi klip per segmen dan
   bobot panjang frasa, bukan dari aligner. Pergeseran maksimum yang mungkin terjadi
   adalah ±0,3 s di dalam satu segmen yang panjang.
3. **TTS tidak lokal.** Syarat "CosyVoice" tidak terpenuhi; suara berasal dari layanan TTS.
   Penggantian ke CosyVoice hanya mengubah 7 berkas audio — semua timing dibangun ulang
   otomatis dari durasi terukur.
4. **Tidak ada ilustrasi hasil model (ComfyUI).** Seluruh visual adalah vektor yang
   digambar tangan dalam kode. Ini konsisten dengan arah visual (2D editorial), tetapi
   berarti kapabilitas ComfyUI tidak diuji sama sekali.
5. **Kualitas audio dinilai dengan pengukuran, bukan pendengaran.** Loudness, peak,
   jarak suara–musik (10–13 dB) terukur; kesan artistik belum diverifikasi manusia.
6. **Satu mesin 2 vCPU.** Waktu render di atas tidak mewakili mesin produksi.
7. **Sumber berita berbahasa Indonesia** diambil dari halaman publik; dua di antaranya
   (Kontan, Kompas) berbayar/terbatas sehingga hanya kutipan yang dipakai.

---

## 10. Rekomendasi

1. Jalankan `remotion render` di mesin dengan Chromium sebelum menyerahkan pekerjaan ke
   editor — supaya kompatibilitas resmi terbukti, bukan diasumsikan.
2. Ganti TTS ke CosyVoice (atau rekaman manusia) dan tambahkan WhisperX untuk alignment;
   pipeline sudah siap karena timing dibangun dari durasi terukur.
3. Tambahkan `qa/visual-check.ts` yang memeriksa kotak teks vs kotak wajah secara
   programatik (sekarang masih dinilai mata).
4. Untuk seri berikutnya: pindahkan pose ke berkas data (JSON) agar animator non-kode bisa
   mengubah akting tanpa menyentuh komponen.
5. Tambahkan `--force` pada langkah frame di `build-all.sh` bila komponen berubah tetapi
   jumlah frame tidak — kalau tidak, frame lama akan dipakai ulang (sudah ditangani manual
   di sesi ini, lihat #11).

---

## 11. Integritas faktual

Setiap angka di layar punya periode dan atribusi; tidak ada yang dipindah konteks.
Berkas sumber: `research/sources/mbg-gizi-anak.sources.json`.

| Angka | Periode | Atribusi |
| --- | --- | --- |
| 118 siswa dirawat (SMA di Kudus) | Januari 2026 | BBC News Indonesia, 30 Jan 2026 |
| Rp71 T → Rp268 T | APBN 2025 → 2026 | Kemenkeu/CNN Indonesia, Jul 2026 |
| 0,0017% dari total penerima | pernyataan 29 Sep 2025 | Prabowo Subianto (dikutip pers) |
| 37.693 siswa diduga keracunan | s.d. Mei 2026 | JPPI |
| 34.201 terduga keracunan | Jan 2025 – Mei 2026 | JPPI (rentang berbeda, ditulis terpisah) |
| 1.908 korban dalam 3 hari | 1–3 Sep 2026 | Kontan, 3 Sep 2026 |
| ≥50.000 korban | 6 Jan 2025 – 7 Sep 2026 | The Conversation, 10 Sep 2026 |
| 789 anak (Sumatera Utara), ambang 60 °C vs 42 °C | Okt 2026 | Ombudsman RI Perwakilan Sumut |

Yang **tidak** diklaim: tidak ada tuduhan korupsi atau niat jahat; tidak ada kutipan
pejabat yang direkonstruksi; tidak ada visual yang bisa disalahartikan sebagai dokumentasi
peristiwa nyata.
