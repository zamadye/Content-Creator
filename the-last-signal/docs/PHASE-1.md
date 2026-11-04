# Phase 1 — Fondasi & Render Engine

Tujuan phase ini sempit dan bisa diuji: **satu file JSON episode → satu MP4 vertikal
1080×1920 yang layak ditonton**, tanpa AI Agent di jalur render.

## Yang dibangun

| Komponen | File | Catatan |
| --- | --- | --- |
| Kontrak episode | `packages/contracts/src/episode.schema.ts` | Zod + 12 aturan lintas-field |
| Composition utama | `apps/renderer/src/compositions/HorrorShort.tsx` | satu komposisi untuk semua episode |
| Metadata dinamis | `apps/renderer/src/Root.tsx` | `calculateMetadata()` menghitung durasi dari props dan memvalidasi ulang |
| Render worker | `scripts/render.ts` | bundle → `selectComposition` → `renderMedia` → laporan JSON |
| Validator | `scripts/validate-episode.ts` | dipakai manual & nanti di CI |
| QC still | `scripts/stills.ts` | render PNG per frame tanpa render penuh |
| Efek kamera | `apps/renderer/src/lib/camera.ts` | push-in, pull-out, pan, handheld, flicker deterministik |
| Efek visual | `components/*` | grain, vignette, scanline, light flicker, HUD, end card |
| Audio | `components/Soundscape.tsx` | ambience loop + cue SFX per scene, fade anti-klik |
| Episode demo | `projects/episodes/LS-0001/` | 6 scene, 50 detik, 20 cue subtitle, 12 cue SFX |
| Test kontrak | `packages/contracts/test/` | 11 test: durasi, order, aset ganda, SFX, subtitle, disclosure, resolusi |

## Keputusan teknis penting

**1. Path aset relatif terhadap folder episode.**
`bundle({ publicDir: projects/episodes/LS-0001 })` membuat `staticFile("images/scene-01.png")`
menunjuk langsung ke aset episode. Tidak ada copy file, dan folder episode tetap
self-contained (sesuai blueprint §7).

**2. Validasi berlapis, bukan sekali.**
Schema dipakai di tiga titik: validator CLI, `scripts/render.ts`, dan
`calculateMetadata()` di dalam Remotion. Artinya render tidak mungkin menerima JSON
setengah valid walaupun ada yang melewati satu pintu.

**3. Frame-exact untuk subtitle dan SFX.**
Semua timing (`startFrame`, `endFrame`, `durationFrames`) dalam frame, bukan detik.
Saat Phase 3 memakai hasil alignment TTS, konversi cukup `round(ms / 1000 * 30)` dan
tidak ada pembulatan berantai.

**4. Efek harus deterministik.**
Tidak ada `Math.random()` di jalur render. Flicker memakai fungsi sinus + dropout
berbasis nomor frame, grain memakai 4 tile PNG dengan offset terhitung. Render yang
sama menghasilkan frame yang sama — syarat untuk QC dan debugging.

**5. Grain & scanline dibuat sebagai tile PNG, bukan filter SVG per frame.**
Versi pertama memakai `feTurbulence` penuh layar di setiap frame. Di mesin 2 core itu
membuat render praktis tidak selesai. Tile 512×512 yang diulang + digeser memberi
tampilan setara dengan biaya jauh lebih kecil (`scripts/make-overlays.mjs`).

**6. Panjang shot maksimum ~3 detik.**
Satu gambar 8–10 detik dibaca mata sebagai "gambar diam yang di-zoom", sehebat apa pun
gerakan kameranya. Karena itu scene punya `cuts`: master image dipakai ulang dengan
framing berbeda, tiap shot dapat punch-in singkat dan kedipan cut 2 frame. LS-0001
berubah dari 6 shot menjadi 26 shot (rata-rata 1,9 detik).

**7. Audio diukur, bukan dirasakan.**
Versi pertama punya audio, tapi −23 LUFS dan hampir seluruhnya sub-bass 40–55 Hz:
di speaker ponsel itu artinya senyap. Ambience sekarang punya hum 100/200/300 Hz +
desis, ada riser menuju impact, dan `pnpm qc` menolak file di luar −16…−12 LUFS.

**8. Composition tidak pernah tahu soal file.**
Props hanya berisi `Episode` tervalidasi; path gambar/audio sudah relatif dan sudah
dicek eksistensinya di `scripts/render.ts` sebelum bundling.

## Aturan validasi yang sudah aktif

Selain tipe dasar:

1. Total durasi 40–60 detik dan menyimpang maksimal ±10% dari `targetDurationSeconds`.
2. `scene.order` harus sama dengan posisi array; `scene.id` unik berbentuk `scene_NN`.
3. Satu master image tidak boleh dipakai dua scene (memaksa 6 gambar berbeda).
4. Scene minimal 15 frame agar terbaca.
5. Cue SFX tidak boleh melewati durasi scene.
6. Subtitle: `endFrame > startFrame`, tidak melewati durasi scene, tidak overlap,
   maksimal 120 karakter per cue.
7. `narrationAudio` hanya boleh ada kalau setiap scene punya teks narasi.
8. `publishing.syntheticDisclosure` wajib `true` — pengungkapan media sintetis
   diperlakukan sebagai bagian dari kontrak, bukan opsi UI.

## Performa render (terukur di mesin uji 2 vCPU / 3 GB)

| Konfigurasi | Hasil |
| --- | --- |
| 60 frame, 1080×1920, `concurrency 2` | ~85 detik (>1 s/frame) |
| Episode penuh 1500 frame | ~1,5–2,2 s/frame (≈35–50 menit) |
| Still per frame (QC) | ~4 detik/frame |
| Master H.264 `crf 20` | **153 MB** (≈25 Mbps — grain sangat mahal) |
| Delivery `crf 23`, maxrate 9M | **54 MB** (2,5 menit encode) |

Catatan penting:

- Gerakan kamera yang benar-benar berubah tiap frame menghapus cache raster
  Chromium, jadi render dengan motion nyata lebih lambat daripada render statis.
  Itu biaya yang memang dibayar untuk hasil yang tidak terlihat seperti slideshow.
- Master 153 MB tidak layak diunggah apa adanya. `pnpm encode` menurunkan ke
  ~54 MB dengan kualitas praktis setara untuk YouTube (YouTube akan re-encode
  lagi, jadi bitrate 25 Mbps hanya membuang waktu upload).
- Satu render aktif dan `concurrency 1–2` bukan saran gaya, tapi batas mesin.
  Untuk 30 video/bulan, render worker sebaiknya dipisah dari API/agen.

## Yang belum ada di Phase 1 (sengaja)

- Tidak ada AI Agent, image generation, maupun TTS. Gambar dan audio demo dibuat
  di luar pipeline (image generator + SFX sintetis).
- Tidak ada PostgreSQL, Redis, BullMQ. State machine episode belum ditegakkan oleh
  database karena belum ada yang perlu di-retry.
- Narasi belum bersuara: subtitle sudah frame-exact, tapi `narrationAudio` masih
  kosong sampai Phase 3 (TTS + alignment).
- Efek P2 (parallax depth, creature reveal berbasis mask, volumetric lighting) belum
  diimplementasikan; `creature_reveal` masih berupa penanda di schema.

## Definition of Done Phase 1

- [x] Satu input JSON → satu MP4.
- [x] Cerita punya hook, suspense, reveal, twist (LS-0001: 6 scene).
- [x] Minimal 6 scene visual dengan master image berbeda.
- [x] Visual tidak statis: setiap scene punya gerakan kamera + lapisan efek.
- [x] Resolusi tepat 1080×1920, 30 FPS, durasi 40–60 detik.
- [x] Subtitle tampil frame-exact sesuai cue.
- [ ] Narasi bahasa Indonesia bersuara (Phase 3).
- [ ] QC otomatis audio/video (Phase 4).

## Langkah berikutnya

1. **Voice**: TTS Indonesia + alignment → isi `narrationAudio`, ganti timing subtitle
   hasil estimasi dengan timing hasil alignment.
2. **Depth + parallax**: satu depth map per scene yang butuh kedalaman, layer FG/MG/BG
   bergerak dengan kecepatan berbeda (efek P1 paling berdampak setelah grain).
3. **Story & Director Agent**: mulai dari generator JSON yang menghasilkan
   `episode.json` valid — bukan dari membuat video.
