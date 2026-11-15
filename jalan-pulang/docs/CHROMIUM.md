# CHROMIUM + WEBGL DI SANDBOX — cara pasang yang benar

Sebelum dokumen ini, seluruh repo berasumsi **tidak ada browser**: QC memakai
renderer perangkat lunak Python (`forge/render.py`) dan uji three.js di Node.
Sekarang Chromium berjalan, **WebGL2 hidup**, dan ada frame sungguhan di
`docs/webgl-shots/`.

Kuncinya satu: `@sparticuz/chromium` mengirim browser sebagai arsip brotli di
dalam paket npm (bukan unduhan terpisah), jadi `npm ci` cukup — **tapi library
SwiftShader-nya harus diletakkan sendiri di samping binary**. Kalau hanya
mengandalkan `LD_LIBRARY_PATH`, `canvas.getContext('webgl2')` mengembalikan
`null` tanpa pesan error yang jelas.

## Langkah

```bash
cd jalan-pulang
npm ci                       # 282 paket, ~10 s (sudah termasuk @sparticuz/chromium)
npm run extract:chromium     # unpack brotli manual → ../.jalan-pulang-tools (3,5 s, 210 MB)
npm run verify:chromium      # bukti: WebGL2 + readPixels
```

Urutan itu wajib: **unpack dulu, baru jalankan**. Menjalankan `remotion` sebelum
library diletakkan menghasilkan `THREE.WebGLRenderer: Error creating WebGL context`.

## Apa yang di-unpack dan ke mana

| sumber (`node_modules/@sparticuz/chromium/bin/`) | hasil |
|---|---|
| `chromium.br` | `../.jalan-pulang-tools/chromium` (209 MB, chmod 755) |
| `al2023.tar.br` | `../.jalan-pulang-tools/al2023/` (libnss3, libnspr4, …) |
| `swiftshader.tar.br` | `../.jalan-pulang-tools/swiftshader/` |
| `fonts.tar.br` | `../.jalan-pulang-tools/fonts/` |

Lalu — bagian yang dulu terlewat — lima berkas SwiftShader
(`libEGL.so`, `libGLESv2.so`, `libvk_swiftshader.so`, `libvulkan.so.1`,
`vk_swiftshader_icd.json`) **disalin ke tiga tempat**:

1. `../.jalan-pulang-tools/` — di samping binary. ANGLE mencari `libEGL.so`
   lewat direktori modul, bukan lewat `LD_LIBRARY_PATH`.
2. `../.jalan-pulang-tools/al2023/lib/` — ikut di `LD_LIBRARY_PATH`.
3. `../.jalan-pulang-tools/al2023/swiftshader/` — salinan untuk tool yang
   memakai direktori itu langsung.

`scripts/extract-chromium.cjs` melakukan semuanya dan **idempoten** (browser
tidak di-unpack ulang bila sudah ada).

## Flag yang wajib

```
--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
--ignore-gpu-blocklist --disable-gpu-sandbox --no-sandbox --disable-dev-shm-usage
```

`--enable-unsafe-swiftshader` wajib untuk Chromium ≥ 128: tanpa itu SwiftShader
ditolak sebagai "unsafe" dan konteks WebGL gagal.

Lingkungan:

```bash
export LD_LIBRARY_PATH="$(pwd)/../.jalan-pulang-tools:$(pwd)/../.jalan-pulang-tools/al2023/lib:$(pwd)/../.jalan-pulang-tools/swiftshader"
```

Semua skrip `npm run render:*` di `package.json` sudah memuat path itu dan
`--browser-executable=../.jalan-pulang-tools/chromium`.

## Bukti

`npm run verify:chromium`:

```
chromium Chrome/153.0.8010.0
WebGL2: WebGL 2.0 (OpenGL ES 3.0 Chromium)
renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)
maxTexture 8192 · maxVertexUniforms 4096
readPixels 8×8: [0, 255, 0, 255] ✓ warna terverifikasi
```

`npm run shots:webgl` merender 6 still nyata (61 s) ke `docs/webgl-shots/`
(768×432, skala 0,4):

| shot | luminans rata-rata | std | piksel < 0,05 |
|---|---|---|---|
| `StudioUjiKamera` f300 | 0,562 | 0,237 | 3 % |
| `ModularStage` f45 | 0,240 | 0,080 | 0 % |
| `EntityRigStudy` f60 | 0,140 | 0,036 | 0 % |
| `WarungLit` f90 | 0,121 | 0,065 | 14 % |
| `StudioJalanPulang` f350 | 0,068 | 0,165 | 89 % |
| `StudioWarungMalam` f220 | 0,019 | 0,062 | 93 % |

Dua yang terakhir adalah adegan malam (subtitle ikut ter-render), jadi gelapnya
wajar — tapi angka itu juga mengingatkan: **malam kita cukup pekat**, 89–93 %
piksel di bawah 0,05.

## Video penuh dari WebGL

```bash
STUDIO_COMPOSITION=StudioJalanPulang npm run render:studio:h264
```

Hasil: `render/StudioJalanPulang-h264.mp4` — 705 frame, **23,50 s**, 960×540,
30 fps, `h264 (High)`, `yuv420p(tv, bt709)`, 1194 kb/s, 3,5 MB, ±6,5 menit
(`--concurrency=1`, SwiftShader CPU). Poster diambil dari MP4 itu sendiri:
`docs/studio-render-frames/frame-{2,10,18}s.png`.

Catatan penting: tanpa `--color-space=bt709`, ffmpeg menulis `yuvj420p(pc)`
(full range) — bukan standar siaran. Karena itu flag tersebut ada di skrip.

## Batas jujur

* SwiftShader adalah **rasterizer CPU** di dalam Chromium. Jalur shader, MRT,
  post-processing, dan upload tekstur semuanya nyata, tetapi **tidak ada GPU**:
  angka fps/detik-render di sini tidak mewakili mesin ber-GPU.
* Ekstraksi 210 MB ke `../.jalan-pulang-tools/` **tidak masuk git**
  (`.gitignore`), dan `node_modules` tidak ikut snapshot — setelah snapshot
  dipulihkan, ulangi `npm ci && npm run extract:chromium` (± 15 s total).
* `@sparticuz/chromium` adalah build headless Lambda: tidak ada audio device,
  tidak ada codec H.264 bawaan Chrome (Remotion memakai ffmpeg sendiri, jadi aman),
  dan ukuran kanvas dibatasi `maxTexture 8192`.
