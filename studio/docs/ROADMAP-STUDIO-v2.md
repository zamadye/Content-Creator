# ROADMAP — Studio Aset & Penceritaan v2

Tujuan: satu pustaka aset 3D bertekstur PBR + satu runtime data-driven, supaya **video berbeda bisa memakai aset yang sama**, dan **agent lain / orang lain bisa membuat cerita sendiri tanpa menyentuh kode React**.

Roadmap ini dikerjakan **berurutan**. Setiap fase punya *gerbang* yang harus lolos sebelum fase berikutnya dianggap selesai. Status jujur per fase ada di `docs/STATUS.md`.

---

## Prinsip yang tidak boleh dilanggar

1. **Aset ≠ cerita.** Semua mesh, tekstur, rig, animasi hidup di `public/assets/` dan didaftarkan di `public/assets/registry.json`. Cerita hanya JSON.
2. **Setiap GLB/glTF wajib punya tekstur nyata**: base color (sRGB), normal (OpenGL/tangent space), metallic-roughness, dan occlusion bila relevan. Tidak ada aset "warna faktor saja".
3. **Kontrak stabil untuk agent.** ID aset tidak berubah. Skema cerita divalidasi ketat dan pesan errornya menunjuk field.
4. **Reproducible.** Semua aset dibangun ulang dari skrip Python deterministik (`studio-forge/`), bukan binary misterius.
5. **Tidak merusak karya lama.** Komposisi Remotion lama tetap render.
6. **Status aset jujur**: `draft` → `review` → `approved`. Hanya `approved` yang boleh dipakai untuk publikasi.

---

## Fase 0 — Fondasi pipeline aset (prasyarat semua)
- `studio-forge/`: penulis GLB (JSON+BIN, tekstur embedded), kit mesh (box, extrude, lathe, tube, leaf, smooth normals, UV projection), sintesis tekstur PBR (albedo/normal/roughness/metal/AO, tileable), rasterizer UV-space (position map untuk melukis tekstur berdasarkan koordinat anatomi), dan *software preview renderer* untuk QC + thumbnail.
- CLI: `python3 studio-forge/build.py --list | --only <id> | --all`.
- **Gerbang:** `node scripts/validate-assets.mjs` lulus glTF Validator untuk semua GLB; setiap material punya ≥1 tekstur; thumbnail dihasilkan untuk setiap aset.

## Fase 1 — Karakter manusia + anatomi wajah (prioritas)
- Base humanoid dari mesh MakeHuman CC0 yang sudah di-rig (163 tulang, weights asli) → **GLB skinned** dengan inverse bind matrices, rest pose, unit meter.
- Varian bentuk (bukan cuma warna): pria/wanita × muda/dewasa/lansia × perawakan; proporsi tengkorak, rahang, pipi, hidung, bibir, telinga dibedakan per varian.
- **Anatomi wajah jelas**: tekstur wajah dilukis di ruang UV tapi dipetakan dari posisi 3D (alis, kelopak, lipatan kelopak, hidung, filtrlum, bibir, telinga, pori, kerut); geometri mata (sclera + iris + kornea) ditempatkan di tulang mata; bulu mata & alis sebagai geometri; normal map kulit wajah.
- Rambut: beberapa gaya (pendek, klimis, panjang, ikal) sebagai shell + strand, punya tekstur.
- Pakaian: polo, kemeja, jaket, kaos, celana kargo, celana pendek, sepatu, sandal — mesh ter-skin, tekstur kain PBR.
- Rig: `studio-humanoid-v1` (nama tulang konsisten) + klip animasi di GLB: `idle`, `walk`, `run`, `sit`, `stand-up`, `talk`, `look`, `point`, `reach`, `ride`.
- **Gerbang:** close-up wajah terbaca (mata, hidung, bibir, telinga), tidak ada clipping pakaian pada walk/idle, validator + review visual lolos.

## Fase 2 — Entitas / hantu
- Varian siluet & material berbeda (bukan recolor): `entity.pale.standing`, `entity.shadow.crouch`, `entity.veiled.seated`, `entity.long.limb`, `entity.child`.
- Klip: `float`, `approach`, `turn`, `vanish`, `appear`, `reach`.
- **Gerbang:** siluet terbaca jauh, wajah terbaca dekat, tidak bergantung cerita tertentu.

## Fase 3 — Rumah & interior modular
- Kit: dinding (polos/pintu/jendela), lantai, atap (seng, genteng, rumbia), teras, tangga, pagar; varian kondisi bersih/usang.
- Bangunan utuh: `house.village.simple`, `house.old.decay`, `house.kos.room`, `shop.warung`, `industrial.warehouse`, `guard.post`.
- Interior bisa dimasuki kamera; skala pintu 2,0 m; modul snap grid 0,5 m.
- **Gerbang:** PBR di semua komponen, atap tidak bocor pandangan, pintu/jendela punya bukaan nyata.

## Fase 4 — Alam, jalan, kendaraan
- Pohon: `tree.karet` (karet), `tree.beringin` (beringin akar gantung), `tree.palm`, `tree.banana`, `tree.dead`, semak, rumput, ilalang, batu, batang tumbang.
- Jalan: lurus, tikungan 90°, persimpangan T, persimpangan +, trotoar, marka, bahu tanah, aspal kering & basah, rambu, tiang listrik, portal gapura.
- Kendaraan: motor (bebek & sport) dengan anchor `seat`/`grip`, mobil, truk; proporsional roda/lampu.
- **Gerbang:** tiling jalan tak terlihat seam, skala manusia konsisten, LOD/instansiasi aman untuk set ramai.

## Fase 5 — Props & set siap pakai
- Props: meja, kursi, rak, kasur, kompor, termos, gelas, lampu teplok, neon sign, papan nama, kaleng, karung, drum, kabel, jemuran.
- `sets/` perpustakaan set: `set.forest-road.night`, `set.warung.lit`, `set.home.interior`, `set.warehouse.night`, `set.river.bridge` — berisi instance aset siap dipakai.
- **Gerbang:** set bisa dipakai di cerita mana pun tanpa edit mesh.

## Fase 6 — Runtime studio (`src/studio/`)
- `registry.js` (load + validasi katalog), `asset-loader.js` (cache, clone, dispose, variant), `stage.js` (scene graph, ground, collision ringan), `actor.js` (skinned + mixer + attach anchor), `camera-rig.js`, `lighting.js`, `film-renderer.jsx`.
- **Cerita = data**: cast, scenes, shots, camera, actions, audio, captions, transitions.
- **Gerbang:** cerita baru tidak butuh file `src/*.jsx` baru; semua lewat JSON.

## Fase 7 — Kontrak cerita v2 + CLI
- `schema/film.schema.json` + validator (error menunjuk path), `stories/*.json` contoh (≥2 cerita berbeda memakai aset yang sama), `scripts/studio.mjs` (`new`, `validate`, `catalog`, `preflight`, `render`).
- Dokumen untuk agent: `docs/AGENT-GUIDE.md`, `docs/ASSET-CATALOG.md` (auto-generate), `docs/STORY-FORMAT.md`.
- **Gerbang:** agent lain bisa membuat cerita valid hanya dari dokumen + registry.

## Fase 8 — QA & operasional
- CI: unit test skema, validasi GLB + tekstur, smoke render, thumbnail golden, lisensi.
- QC manusia: anatomi, tekstur, clipping, sinkronisasi audio.
- **Gerbang:** laporan QA + provenance lengkap sebelum publikasi.

---

## Urutan eksekusi praktis (yang dikerjakan di sesi ini)

| # | Pekerjaan | Artefak | Status |
|---|-----------|---------|--------|
| 1 | Pipeline `studio-forge/` | GLB writer, tekstur PBR, preview renderer | **selesai** |
| 2 | Karakter + anatomi wajah + rig + klip | `public/assets/characters/*` (6) | **selesai** — status `review` |
| 3 | Entitas/hantu | `public/assets/entities/*` (5) | **selesai** — status `draft` |
| 4 | Rumah modular + bangunan utuh | `public/assets/building/*` (9) | **selesai** — status `review` |
| 5 | Pohon, jalan, kendaraan | `public/assets/nature/*` (9), `road/*` (7), `vehicle/*` (2) | **selesai** |
| 6 | Props + set library | `public/assets/prop/*` (14) | **selesai** — set siap pakai belum |
| 7 | Registry + thumbnail + katalog | `public/assets/registry.json`, `index.html`, `docs/ASSET-CATALOG.md` | **selesai** |
| 8 | Runtime + skema film v2 + CLI | `src/studio/*`, `scripts/studio.mjs` | **selesai, belum diverifikasi di browser** |
| 9 | Contoh cerita + dokumen agent | `stories/studio/*` (4), `docs/STORY-FORMAT.md`, `docs/AGENT-GUIDE.md` | **selesai** |
| 10 | Tes + status jujur | `scripts/test-studio.mjs`, `docs/STATUS.md` | **selesai** |

Lihat `docs/STATUS.md` untuk progres nyata, dan `docs/ASSET-CATALOG.md` untuk daftar aset yang sudah ada.

## Catatan sesi (implementasi)

Keputusan yang mengubah rencana awal:

* **Tanpa Blender.** Lingkungan tidak punya Blender/`ffmpeg`; seluruh model dibuat
  prosedural dengan numpy + Pillow, lalu ditulis ke GLB 2.0 oleh `forge/glb.py`.
* **Runtime lebih tipis dari rencana.** `src/studio/` berisi `schema.js`,
  `camera.js`, `compile.js`, `library.js`, `renderer.js`, `StudioStory.jsx` —
  bukan enam modul terpisah (stage/actor/lighting digabung ke `renderer.js`)
  karena ukuran kode lebih mudah dijaga dan diuji.
* **Katalog di-generate ganda**: `public/assets/registry.json` (runtime) dan
  `src/studio/registry.generated.js` (impor statis, aman di Node maupun bundler).
* **Verifikasi**: yang diuji otomatis adalah katalog, header/chunk GLB, atribut
  primitif, skin/animasi, skema cerita, kompilasi waktu, dan determinisme kamera.
  Render three.js di browser **sudah** jalan: Chromium 153 + ANGLE/SwiftShader
  (`docs/CHROMIUM.md`, bukti `docs/webgl-shots/`).

Bottleneck berikutnya (berurutan): (a) verifikasi `StudioStory` di browser,
(b) set interior siap pakai, (c) entitas yang benar-benar menyeramkan,
(d) LOD/atlas tekstur agar 12 karakter + set muat di memori.
