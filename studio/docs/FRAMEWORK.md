# KERANGKA — `studio/` sebagai mesin cerita, bukan mesin satu cerita

Repo ini bernama **Content-Creator**: tujuannya membuat **banyak** video cerita
3D dari satu kerangka. Folder ini dulu bernama `jalan-pulang/` — nama satu judul —
dan sudah diganti menjadi `studio/` supaya jelas: *Jalan Pulang* adalah **salah
satu paket cerita**, bukan kerangkanya.

```
studio/                     kerangka: tidak tahu cerita apa pun
├── src/
│   ├── index.jsx           register Remotion: 1 paket = 1 komposisi (+ komposisi manual paket)
│   ├── studio/             MESIN: registry aset, compile naskah→shot, kamera, renderer, IK, look
│   └── (adegan manual)     scene JSX lama yang masih dipakai paket jalan-pulang
├── stories/                DATA: cerita masuk di sini, bukan di src/
│   ├── index.js            pintu masuk paket
│   ├── packs.generated.js  hasil generate (jangan disunting)
│   ├── jalan-pulang/
│   │   ├── story.json      naskah terstruktur (studio.story/2)
│   │   └── compositions.jsx komposisi manual khas cerita ini
│   ├── contoh-naskah/      contoh hasil impor naskah markdown
│   └── contoh-kenney/      contoh pakai properti pustaka (Kenney CC0)
├── public/
│   ├── assets/             katalog 52 aset buatan sendiri (registry.json)
│   └── library/            pustaka 102 properti Kenney (index.json, CC0)
├── studio-forge/           generator aset (Python): karakter, env, tekstur, UV, bake, impor Kenney
├── scripts/                CLI + QC (Node): studio.mjs, qc-*, sync-*, naskah-import
└── docs/                   dokumen ini + STATUS, STORY-FORMAT, LIBRARY, CHROMIUM, PIPELINE-AUDIT
```

## Tiga jalur yang sudah jalan

| jalur | masuk | keluar |
|---|---|---|
| **naskah → video** | `stories/<id>/naskah/*.md` → `npm run naskah:import` | `stories/<id>/story.json` → komposisi `Studio<Id>` → MP4 |
| **cerita manual** | `stories/<id>/story.json` ditulis tangan | sama |
| **adegan bebas** | `stories/<id>/compositions.jsx` | komposisi Remotion tambahan (studi kamera, versi VO, dsb.) |

Menambah cerita **tidak menyentuh `src/`**:

```bash
mkdir -p stories/cerita-baru
# tulis stories/cerita-baru/naskah/cerita-baru.naskah.md
npm run naskah:import -- stories/cerita-baru/naskah/cerita-baru.naskah.md
npm run stories:sync          # daftarkan paket → komposisi StudioCeritaBaru
npm run studio:validate       # cek seluruh paket
STUDIO_COMPOSITION=StudioCeritaBaru npm run render:studio:h264
```

## Aset: dua kelas, dua aturan

| kelas | lokasi | siapa yang membuat | aturan |
|---|---|---|---|
| **katalog** `char.*`, `entity.*`, `road.*`, `nature.*`, `building.*`, `prop.*`, `vehicle.*` | `public/assets/` + `registry.json` | pipeline sendiri (`studio-forge/`) | 52 aset, anggaran poligon + QC UV/topologi/tekstur ditegakkan |
| **pustaka** `kenney.<kit>.<nama>` | `public/library/` + `index.json` | pihak ketiga, CC0-1.0 | 102 properti, tidak ikut anggaran katalog |

Keputusan yang disengaja: **karakter selalu buatan sendiri** (itu identitas
visual proyek), sedangkan **properti/set boleh dari pustaka** (cepat, rapi,
bebas lisensi). Cerita boleh mencampur keduanya dalam satu shot — id-nya
diselesaikan oleh modul yang sama (`src/studio/library.js`).

## Prinsip yang dijaga

1. **Data cerita tidak tinggal di kode.** `src/` hanya mesin; cerita = JSON +
   naskah di `stories/`.
2. **Semua yang dihasilkan punya pagar yang bisa dijalankan**: `npm run
   library:qc`, `stories:check`, `qc:framing`, `qc:uv`, `qc:topology`,
   `qc:bake`, `qc:materials`, `test:studio`.
3. **Berkas generate tidak disunting tangan**: `src/studio/registry.generated.js`,
   `src/studio/props.generated.js`, `stories/packs.generated.js`.
4. **Renderer yang dipakai untuk memutuskan adalah renderer sungguhan** kalau
   pertanyaannya soal rupa: `npm run shots:webgl` (Chromium + WebGL2), bukan
   hanya hitungan.
