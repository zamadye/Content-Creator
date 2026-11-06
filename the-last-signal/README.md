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
node scripts/make-score.mjs           # skor musik + stinger jump scare
pnpm test                              # test kontrak
pnpm validate                          # validasi kontrak episode
pnpm render                            # → renders/LS-0010.mp4 (master 153 MB)
pnpm encode                            # → renders/LS-0010-delivery.mp4
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

## Yang terbit sekarang

Hanya satu episode yang dipakai sebagai acuan desain. Sisanya sudah diarsipkan
ke Google Drive dan berkasnya dihapus dari repo (lihat `knowledge/drive.md`).

| Episode | Judul | Durasi | QC | YouTube | Facebook |
| --- | --- | --- | --- | --- | --- |
| LS-0010 | Lift Berhenti di Lantai 19 | 54,2 s | 9/9 | [Yyr8QFQjgA8](https://www.youtube.com/watch?v=Yyr8QFQjgA8) | [reel](https://www.facebook.com/reel/1109243115286734) |

Desain v1 yang dipakai episode ini — tokoh tetap, entitas tiga kali makin dekat,
empat suara makhluk, caption satu-tiga kata di tengah layar, shot 1,5 detik,
bed tanpa jeda — semuanya aturan tetap di `knowledge/ATURAN.md` bagian III–V,
dengan rencana per episode di `projects/episodes/LS-0010/design.json`.

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
├── projects/episodes/LS-0010/  episode acuan: episode.json + design.json + images-v2 + images/thumb + audio
├── publish-queue/            satu berkas = satu perintah unggah
├── releases/                 media yang sedang menunggu diunggah (kosong setelah terbit)
├── renders/                  output MP4 & still (git-ignored, tidak untuk disimpan)
└── docs/                     arsitektur
```

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `pnpm validate` | validasi `episode.json` terhadap kontrak + cek aset |
| `pnpm render` | render episode penuh → `renders/LS-0010.mp4` (master, besar) |
| `pnpm encode` | transcode master → delivery (crf 24, ~5 Mbps, loudnorm −14 LUFS) |
| `pnpm qc` | QC deterministik: resolusi, fps, durasi, LUFS, true peak, ukuran, ritme cut |
| `tsx scripts/align-narration.ts --episode LS-0010` | tulis ulang timing scene + subtitle dari audio TTS |
| `pnpm render -- --frames 0-59` | render potongan timeline (uji cepat) |
| `pnpm render -- --scale 0.5` | draft setengah resolusi |
| `pnpm studio` | Remotion Studio untuk preview interaktif |
| `pnpm exec tsx scripts/stills.ts --frames 210,760,1320` | still PNG untuk QC |
| `pnpm exec tsx scripts/new-episode.ts --id LS-0011 --title "Kamar 307"` | scaffold episode baru |
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

## Ritme visual: cut, bukan zoom pelan

Satu scene boleh punya beberapa **cut** (`scene.cuts`): master image yang sama
dipakai dengan framing berbeda, kameranya "mendarat" (punch) di setiap cut, dan
ada kedipan 2 frame seperti pindah feed kamera. LS-0010 kini 35 shot untuk 54 detik
— rata-rata 1,55 detik per shot, sesuai video pembanding (1,0 detik). Tanpa ini,
hasilnya memang terasa slideshow.

Kartu teks 2–3 kata (`episode.onScreenText`) dipakai sebagai tanda baca ritme:
`JANGAN DIBUKA` → `PINTU KEDUA` → `TERLAMBAT`.

Alasan dan angkanya ada di [`knowledge/reference-design.md`](knowledge/reference-design.md).

## Episode acuan — LS-0010 "Lantai Sembilan Belas"

7 scene / 1624 frame / 54 detik: lift kantor → panel 19 → kantor kosong → ruang
rapat → makhluk menoleh → pintu lift terbuka lagi → penutup. Isi
`projects/episodes/LS-0010/episode.json` adalah kontrak lengkap: timing per
scene, subtitle frame-exact, cue SFX, framing setiap shot, efek.

Dua berkas yang membuat episode ini bisa diulang:

- `design.json` — keputusan cerita: kapan makhluk muncul, suara apa, kartu teks
  apa, target panjang shot. Diterapkan oleh `node scripts/plan-design.mjs
  --episode LS-0010`.
- `images-v2/` — tujuh adegan + wajah jumpscare, semuanya dengan tokoh tetap.

> Pengungkapan konten sintetis dikirim sebagai **flag unggahan**
> (`containsSyntheticMedia`, `isAiGenerated`) dan `publishing.syntheticDisclosure`
> di kontrak. Tidak ada label "ARSIP FIKSI" di frame, judul, deskripsi, maupun
> komentar — dilarang sejak 2026-11-06 dan ditegakkan `scripts/check-copy.mjs`.

## Status roadmap

| Phase | Isi | Status |
| --- | --- | --- |
| 1 | Fondasi, schema, satu composition, render MP4 | ✅ |
| 2 | Cinematic engine (camera, grain, flicker, subtitle, sound) | ✅ |
| 3 | Story/director, image generation, TTS, alignment | ✅ dipakai manual per episode |
| 4 | Orchestrator, queue/retry, QC agent | ✅ publish + QC otomatis |
| 5 | Publikasi YouTube + Facebook + analytics | ✅ dua platform per push |
| 6 | Optimasi: desain v1 sebagai baseline, iterasi berikutnya | ⏳ |
