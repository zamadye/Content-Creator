# STATUS INTEGRASI TOOL (diukur, bukan diasumsikan)

| Tool | Versi | Terpasang | Terintegrasi ke pipeline | Bukti | Status |
| --- | --- | --- | --- | --- | --- |
| Remotion (runtime API) | 4.0.380 | ya | ya — semua scene memakai `useCurrentFrame`/`interpolate`/`spring`/`Sequence` | 9 scene + poster memakai API ini | **PASS (TESTED)** |
| Remotion CLI / Studio | 4.0.380 | ya | tidak | butuh Chromium → `libnss3.so` hilang, `apt` tidak tersedia | **FAIL** |
| @resvg/resvg-js | 2.6.2 | ya | ya — raster SVG → PNG | 2.660 frame dirender | **PASS (VERIFIED)** |
| FFmpeg (static npm) | 5.x | ya | ya — mix, encode, ukur loudness | encode 66–69 s, ebur128 −14,2 LUFS | **PASS (VERIFIED)** |
| Instrument Serif + Archivo | 5.2.x | ya | ya — 6 TTF lokal | `assets/fonts/fonts.json` | **PASS (VERIFIED)** |
| CosyVoice | — | tidak | tidak | butuh torch + GPU + model | **NOT TESTED** |
| WhisperX | — | tidak | tidak | butuh torch | **NOT TESTED** |
| Librosa | — | tidak | tidak | dipakai numpy untuk analisis & sintesis | **NOT TESTED** |
| ComfyUI | — | tidak | tidak | tidak ada GPU | **NOT TESTED** |
| Anime.js | — | tidak | tidak (keputusan desain) | Remotion pemilik timeline | **N/A** |
| Lottie Web | — | tidak | tidak | playback butuh browser | **N/A** |

## Catatan penting per tool

**Remotion.** Komponen visual adalah Remotion murni; yang diganti hanya *backend render*.
`remotion/src/runtime/index.tsx` mengimplementasikan subset API yang dipakai, termasuk
`spring`, `interpolate` dengan opsi `extrapolate`, `random(seed)`, `Sequence` (memotong
waktu lokal), dan `AbsoluteFill`. Tidak ada ketergantungan pada DOM.

**FFmpeg 5.x.** Tiga jebakan yang sudah ditangani di `pipeline/mix-audio.ts`:
`amix` tidak punya opsi `normalize` (kompensasi gain manual), `amix` tiga input gagal
(penjumlahan berpasangan), dan `loudnorm` melepas channel layout (diratakan dengan
`aformat`).

**CosyVoice/WhisperX/Librosa.** Tidak ada torch dan tidak ada GPU; memasangnya akan
memakan >2 GB dan tetap tidak bisa berjalan. Karena itu: TTS memakai layanan, alignment
diturunkan dari durasi terukur, dan analisis audio memakai numpy. Penggantian ke tool
aslinya tidak memerlukan perubahan kode selain menaruh berkas audio baru.
