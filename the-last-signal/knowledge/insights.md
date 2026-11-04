# Insights — THE LAST SIGNAL

Hanya berisi hal yang sudah diukur pada file nyata. Setiap baris menyebut buktinya.

## Narasi & suara

**Tempo TTS Indonesia ≈ 1,8 kata/detik, bukan 2,3.**
Diukur dari LS-0002: 110 kata → 60,7 detik audio (6 klip). Estimasi awal 2,3
kata/detik membuat episode pertama yang dibangun lewat `build-episode.mjs`
meledak jadi 64,3 detik dan ditolak kontrak (maks 60). Anggaran aman:
**≤ 17 kata per scene, ≤ 100 kata per episode** (6 scene).

**Padding 4 frame di awal + 8 di akhir** cukup untuk napas antar scene.
LS-0002: speech 53,6 s + 2,4 s padding = 56,0 s. Padding 6+12 (dipakai LS-0001)
lebih lapang tapi memakan 2 detik yang lebih baik dipakai untuk kata.

**Musik tidak boleh di-loop per scene.** Skor harus satu file sepanjang episode
(`scripts/make-score.mjs --episode <ID>`), karena restart tiap cut membunuh tensi.

**Stinger jump scare punya transien tinggi.** `loudnorm` dengan target −1,5 dBTP
pernah menghasilkan +1,0 dBTP. Perbaikan yang terbukti: `aresample=192000` sebelum
`loudnorm`, target `TP=-3`. Hasil LS-0001 v3: −1,6 dBTP, −14,7 LUFS.

## Visual

**Satu gambar untuk 9 detik = slideshow.** Yang menyelamatkan ritme: 2 cut per
scene dengan framing berbeda (skala 1,3 dan 1,5 + offset), sehingga 26 shot dalam
57 detik (rata-rata 2,19 s/shot).

**Gambar 768×1376 di-upscale ke 1080×1920** oleh Remotion. Selisih 1,4× masih
tajam setelah grain dan vignette; ini batas bawah resolusi yang bisa diterima.

**Wajah agen di jumpscare dipakai ulang lintas episode** (`images/scare-face.png`).
Itu keputusan identitas, bukan kelalaian: penonton mengenali "wajah kanal" dalam
0,5 detik. Yang divariasikan adalah timing, flash, dan zoom.

## Produksi

**Biaya render di 2 vCPU:** 1.712 frame 1080×1920 = ~400 s render + ~155 s encode.
Budget satu episode baru: TTS 6 klip, 6 gambar, 1 render, 1 encode, 1 QC.

**Nominasi QC yang tidak bisa ditawar** (dari `scripts/qc.ts`, dipakai juga di
runner sebelum upload): 1080×1920, 30 fps, 40–60,5 s, audio AAC, −16…−12 LUFS,
true peak ≤ −1 dBTP, ≤ 40 MB, rata-rata shot ≤ 3 s.

## Publikasi

**Zernio tidak bisa dihubungi dari sandbox.** Semua panggilan API dijalankan di
GitHub Actions. Video diangkut lewat repo (`releases/`), diunggah ke storage
Zernio dari runner, lalu `createPost({ publishNow: true })`.

**Bukti sukses harus dari API**, bukan dari HTTP 200: `platformPostUrl` untuk
akun YouTube `thelastsignal-id`. Tanpa itu, statusnya "belum terbit".

**`containsSyntheticMedia: true`** selalu dikirim — pengungkapan konten sintetis
adalah syarat, bukan opsi.

## Kegagalan yang sudah dibayar mahal

| Kejadian | Sebab | Perbaikan permanen |
| --- | --- | --- |
| v1 ditolak | 54 MB untuk 50 s, tanpa audio, satu gambar per 8–10 s | encode CRF + QC ukuran, score + SFX wajib, 2 cut/scene |
| v2 ditolak | tanpa musik latar, tanpa jump scare, narasi dokumenter | `make-score.mjs`, `episode.jumpscares`, narasi "Bayangkan/Rasakan" |
| Render LS-0001 gagal berulang | Chrome Remotion tidak bisa diunduh | `scripts/dev/provision-browser.sh` (npm @sparticuz/chromium) |
| QC true peak gagal | transien stinger + loudnorm single-pass | resample 192 kHz + TP −3 |
| Naskah LS-0002 64,3 s | estimasi kata terlalu optimistis | anggaran 17 kata/scene |
