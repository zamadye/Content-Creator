# THE LAST SIGNAL

Automated found-footage horror studio untuk YouTube Shorts berbahasa Indonesia.
**Phase 1 (fondasi + cinematic render engine) sudah berjalan.**

Satu perintah menghasilkan MP4 1080×1920, 30 FPS, 50 detik, dengan gerakan kamera,
film grain, lampu berkedip, vignette, subtitle sinkron, sound design, dan HUD
rekaman pengawas — dari file JSON episode, tanpa AI Agent di jalur render.

```bash
pnpm install
node scripts/make-demo-audio.mjs      # placeholder ambience + SFX
node scripts/make-overlays.mjs        # tile grain & scanline
pnpm test                              # test kontrak
pnpm validate                          # validasi kontrak episode
pnpm render                            # → renders/LS-0001.mp4
```

---

## Prinsip yang sudah ditegakkan

1. **AI tidak mengontrol render.** Agent (nanti) hanya menulis JSON. `packages/contracts`
   memvalidasi, Remotion mengeksekusi template.
2. **Satu composition untuk semua episode.** `HorrorShort` menerima `Episode` sebagai
   props; tidak ada komposisi khusus per cerita.
3. **Gambar tidak di-generate per frame.** 6 master image + gerakan kamera + efek
   lapisan yang dihasilkan Remotion.
4. **Validasi deterministik lebih dulu.** Schema Zod + pemeriksaan lintas-field,
   sebelum satu frame pun dirender.

## Struktur

```
the-last-signal/
├── apps/renderer/            Remotion app (composition + efek + audio)
│   └── src/
│       ├── Root.tsx          registrasi composition + calculateMetadata
│       ├── compositions/     HorrorShort (timeline utama)
│       ├── components/       CinematicScene, FilmGrain, LightFlicker, SubtitleTrack…
│       └── lib/              camera math, design token
├── packages/contracts/       schema episode (sumber kebenaran)
├── scripts/
│   ├── render.ts             render worker (bundle → renderMedia → report)
│   ├── validate-episode.ts   validator mandiri (exit code 1 kalau gagal)
│   ├── stills.ts             QC visual cepat (PNG per frame)
│   ├── make-demo-audio.mjs   ambience + SFX placeholder deterministik
│   └── make-overlays.mjs     tile grain & scanline PNG
├── projects/episodes/LS-0001/  episode demo: episode.json + images + audio + overlays
├── renders/                  output MP4 & still (git-ignored)
└── docs/                     arsitektur & catatan phase
```

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `pnpm validate` | validasi `episode.json` terhadap kontrak + cek aset |
| `pnpm render` | render episode penuh → `renders/LS-0001.mp4` |
| `pnpm render -- --frames 0-59` | render potongan timeline (uji cepat) |
| `pnpm render -- --scale 0.5` | draft setengah resolusi |
| `pnpm studio` | Remotion Studio untuk preview interaktif |
| `pnpm exec tsx scripts/stills.ts --frames 210,760,1320` | still PNG untuk QC |
| `pnpm exec tsx scripts/new-episode.ts --id LS-0002 --title "Kamar 307"` | scaffold episode baru |
| `pnpm test` | 11 test kontrak (durasi, order, aset, subtitle, disclosure) |
| `pnpm audio:demo` | regenerate ambience & SFX placeholder |

## Menjalankan di server / sandbox tanpa browser

Remotion membutuhkan Chromium. Di Debian/Ubuntu minimal yang belum punya browser:

```bash
sudo apt-get install -y chromium libnss3 libnspr4 libgbm1 libasound2
export REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
pnpm render
```

`REMOTION_BROWSER_EXECUTABLE` dibaca oleh `scripts/render.ts` dan `scripts/stills.ts`.
Kalau variabel ini kosong, Remotion akan mengunduh Chrome Headless Shell sendiri
(membutuhkan akses ke `storage.googleapis.com`).

## Episode demo — LS-0001 “Ketukan Ketiga”

6 scene / 1500 frame / 50 detik: CCTV koridor kosong → pos jaga → lemari besi
terkunci → isi lemari → sosok di ujung koridor → sinyal putus.

Isi `projects/episodes/LS-0001/episode.json` adalah kontrak lengkap: timing per
scene, subtitle (frame-exact), cue SFX, arah kamera, lighting, efek.

> Visual pada episode demo dibuat dengan AI generatif dan seluruh peristiwa adalah
> fiksi. Format found footage **tidak boleh** dipakai untuk mengklaim kejadian nyata;
> label `ARSIP FIKSI` dan `publishing.syntheticDisclosure` dijaga oleh schema.

## Status roadmap

| Phase | Isi | Status |
| --- | --- | --- |
| 1 | Fondasi, schema, satu composition, render MP4 | ✅ selesai |
| 2 | Cinematic engine (camera, grain, flicker, subtitle, sound) | ✅ sebagian besar sudah ikut terbangun |
| 3 | Research/Story/Director agent, image generation, TTS, alignment | ⏳ berikutnya |
| 4 | Orchestrator, queue/retry, Continuity + QC agent | ⏳ |
| 5 | Publishing YouTube + analytics | ⏳ |
| 6 | Optimasi 30 Shorts | ⏳ |

Detail keputusan teknis dan batas Phase 1: [`docs/PHASE-1.md`](docs/PHASE-1.md).
Peta arsitektur blueprint → kode: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
