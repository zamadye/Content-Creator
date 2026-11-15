# AUDIT PIPELINE 53 LANGKAH — Studio v2

Dokumen ini memetakan pipeline produksi 3D 9 fase / 53 langkah ke kondisi nyata
repositori ini. Tujuannya jujur, bukan promosi: setiap baris menyebut **di mana
buktinya** (berkas atau perintah) atau **kenapa belum**.

Legenda status:

| status | arti |
|---|---|
| ✅ | selesai dan ada bukti yang bisa dijalankan |
| ◐ | sebagian — jalan, tapi ada bagian yang belum |
| ⛔ | belum dikerjakan |
| — | tidak berlaku untuk alur kerja proyek ini |

Batas verifikasi yang berlaku untuk seluruh dokumen: semua render QC berasal dari
**renderer perangkat lunak** (`studio-forge/forge/render.py`) dan pengujian runtime
memakai **three.js asli di Node** (`scripts/test-studio-three.mjs`). Tidak ada
Chromium di sandbox ini, jadi **belum ada satu frame pun yang digambar WebGL**.
Baris yang bergantung pada GPU ditandai eksplisit.

---

## Ringkasan per fase

| # | Fase | ✅ | ◐ | ⛔ | — |
|---|---|---|---|---|---|
| 1 | Pre-production | 4 | 0 | 0 | 0 |
| 2 | Procedural & blockout | 5 | 0 | 0 | 0 |
| 3 | Real geometry & modeling | 3 | 1 | 1 | 1 |
| 4 | UV & texture preparation | 4 | 0 | 1 | 0 |
| 5 | PBR material & texturing | 7 | 1 | 1 | 0 |
| 6 | Rigging & deformation | 4 | 1 | 1 | 0 |
| 7 | Animation production | 2 | 3 | 1 | 1 |
| 8 | Scene assembly & lighting | 3 | 2 | 0 | 0 |
| 9 | Rendering & post-production | 0 | 4 | 2 | 0 |
|  | **Total** | 32 | 12 | 7 | 2 |

Total: 32 selesai · 12 sebagian ·  7 belum ·  2 tidak berlaku · 53 langkah.

---

## Phase 1 — Pre-production

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 1 | Concept design | ✅ | `docs/ROADMAP-STUDIO-v2.md` (konsep, gaya, target), 6 karakter + 5 sosok + 41 aset lingkungan di `public/assets/registry.json` |
| 2 | Reference gathering | ✅ | `docs/PROVENANCE-ASSETS.md`, `public/garments/PROVENANCE.md`, `public/makehuman/PROVENANCE.md` — semua sumber, lisensi, dan komit asal dicatat |
| 3 | Technical specification | ✅ | Meter, +Y atas, +Z depan, `EYE_HEIGHT 1.62`, 30 fps, target tris per kategori di registry; engine three.js 0.187 + Remotion 4.0.543 |
| 4 | Scene planning | ✅ | `scripts/qc-plan.mjs` mengukur tiap shot (23 shot × 9 sampel kamera) terhadap **segitiga asli** aset — 6.546 segitiga, jarak kamera terdekat 0,27 m (batas 0,12 m), jarak antar-aktor terdekat 1,52 m (batas 0,45 m), 0 masalah — lalu menulis `docs/plans/<cerita>.json`; `studio-forge/dev_plan.py` menggambar denah PNG `docs/plans/*.png`; `npm run test:plan` 9 grup, termasuk 3 kerusakan buatan (kamera tepat di permukaan geometri, kamera 5 cm dari dinding, aktor di dalam dinding) yang semuanya **terdeteksi** |

## Phase 2 — Procedural & blockout

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 5 | Procedural generation | ✅ | `studio-forge/forge/kit.py` (box/tube/lathe/extrude), `env_building.py`, `env_nature.py`, `env_prop.py`, `env_road.py`, `env_vehicle.py` |
| 6 | Primitive blocking | ✅ | Seluruh aset lingkungan lahir dari primitif; `dev_sheet.py` menyusun blockout per kategori |
| 7 | Layout blockout | ✅ | `stories/studio/*.json` (`set`, `objects`, `actors`) + `src/preview.jsx` 8 adegan |
| 8 | Topology planning | ✅ | `docs/TOPOLOGY-PLAN.md`: prinsip (bentuk besar = geometri, detail kecil = tekstur), strategi per kategori yang menunjuk fungsi aslinya, anggaran tri & tekstur per kategori + anggaran shot 120.000, dan tabel 52 aset yang **diukur dari GLB** (bukan disalin dari registry). Dijaga `scripts/qc-topology.mjs` (`npm run qc:topology`, keluar 1 bila melanggar atau dokumen basi) dan grup tes `topology` — termasuk tes bahwa pelanggaran karangan benar-benar terdeteksi |
| 9 | Blockout validation | ✅ | Thumbnail 512 per aset + `stories/studio/uji-kamera.json` (9 shot, satu per preset kamera) |

## Phase 3 — Real geometry & modeling

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 10 | Base mesh construction | ✅ | Base MakeHuman + `character.py` (163 tulang, UV skin, garment fitting) |
| 11 | High-poly modeling | ◐ | Detail prosedural (lipatan, jahitan, kusen) ada, tapi **tidak ada high-poly**: tanpa sculpt/subdivision dan tanpa sumber bake. Blokirnya keputusan toolchain, bukan lupa: anggaran tri karakter sudah 94 % (`docs/TOPOLOGY-PLAN.md`), jadi high-poly hanya berguna kalau ada jalur bake ke low-poly (langkah 18, ⛔). Sementara itu detail halus dibangkitkan prosedural di peta normal (langkah 19) |
| 12 | Anatomical / structural refinement | ✅ | `shape()` di `character.py` (shoulder/chest/limb/jaw/neck), `entity.shape_entity` (limb_len, torso_len, neck_len) |
| 13 | Retopology | — | Topologi base MakeHuman dipakai apa adanya; bukan pekerjaan yang dikerjakan ulang di sini |
| 14 | Low-poly optimization | ✅ | Anggaran per kategori di `docs/TOPOLOGY-PLAN.md` (character 42k · entity 34k · nature 4k · building 3k · vehicle 3k · prop 1,5k · road 1,5k) dan anggaran shot 120k **ditegakkan** oleh `npm run qc:topology`; pemakaian terbesar character 94 % (39.386 tri), shot terberat 79.044 tri = 66 % anggaran; total 232.658 vertex di registry |
| 15 | LOD generation | ⛔ | Belum ada LOD. Belum mendesak karena targetnya klip pendek 1080p, bukan game |

## Phase 4 — UV & texture preparation

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 16 | UV unwrapping | ✅ | UV base MakeHuman untuk karakter; UV generator untuk aset prosedural (`uvpaint.py`) |
| 17 | UV packing | ✅ | `docs/UV-PACKING.md` menyatakan **dua rezim** (atlas 0..1 untuk karakter/entitas/properti parametris, UV ruang-objek tiling untuk 27 aset lingkungan) dan mengukur keduanya: 52 aset, **0 tumpang tindih tak sengaja** (sebelumnya 3: lampu teplok 66,3 %, rumah kos 10,8 %, jeriken 92,5 %), kelas 19 rapat · 6 daur-ulang cermin · 27 tiling, kepadatan texel 123–3.870 px/m (ambang 100). Bug diperbaiki di `forge/kit.py` (U lathe/tabung per radius → radius acuan; cakram UV tutup yang negatif) dan `forge/uvpack.py` (shelf packing pulau parametris); 41 aset dibangun ulang, bukti visual `docs/uv-before-after.png`. Dijaga `npm run qc:uv` + grup tes `uv` |
| 18 | High-to-low baking | ⛔ | Tidak ada high-poly sumber, jadi tidak ada yang bisa di-bake |
| 19 | Texture baking | ✅ | Kanal AO sekarang **hasil bake geometri** (`studio-forge/forge/bake.py`): tiap texel menembak 14 sinar setengah bola ke grid voxel aset sendiri, dicampur ke kanal R ORM. Bukti: selftest sintetis (AO di bawah kotak 0,488 vs pojok terbuka 1,000; pelat datar 1,000; deterministik), 21 dari 52 aset menjadi lebih gelap, rata-rata AO 0,965 → 0,936, tanpa bercak berulang karena material UV-tiling dilewati. Dokumen `docs/BAKING.md`, baseline `docs/bake-baseline.json`, pagar `npm run qc:bake` + grup tes `bake`. **Normal map tetap prosedural** — high→low bake (langkah 18) tetap ⛔ |
| 20 | Texture set preparation | ✅ | 3 peta per aset (base/normal/ORM), 512–2048 px, satu set material per aset |

## Phase 5 — PBR material & texturing

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 21 | Material definition | ✅ | `forge/tex.py` + `human.GARMENT_LUMA`; jenis: kulit, kain, kayu, logam, beton, kaca |
| 22 | Base color / albedo | ✅ | `paint_skin`, `tex.fabric`, `uvpaint` untuk tiap kategori |
| 23 | Roughness mapping | ✅ | Kanal G pada ORM |
| 24 | Metallic mapping | ✅ | Kanal B pada ORM |
| 25 | Normal mapping | ✅ | `tex.height_to_normal`, plus relief tenun pada kain |
| 26 | Height / displacement | ◐ | Height → normal saja; tidak ada displacement/parallax nyata |
| 27 | Subsurface scattering | ⛔ | Tidak ada SSS; three.js di sini memakai material standar tanpa transmission |
| 28 | Emission mapping | ✅ | `prop.lamp.teplok`, lampu neon, `emissive` di material |
| 29 | Material calibration | ✅ | `studio-forge/dev_materials.py` merender **209 material** sebagai bola di bawah cahaya netral (lampu netral, ambient abu, exposure 1,0, tanpa vignette/grading) lalu mengukur albedo (luminans Rec.709), roughness, metallic, dan luminans render dari isi GLB. Hasil: 204 `ok` · 5 `emisi` · **0 di luar rentang** (albedo 0,134–0,932; median 0,290). Bukti `docs/material-calibration.png`, dokumen `docs/MATERIAL-CALIBRATION.md`, pagar `npm run qc:materials` (`--check` membandingkan tabel dengan GLB) + grup tes `materials` yang juga menjalankan selftest batas verdict |

## Phase 6 — Rigging & deformation

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 30 | Skeleton creation | ✅ | `studio-humanoid-v1`, 163 tulang, 13 klip, 30 fps |
| 31 | Joint placement | ✅ | Diperbaiki sesi ini: translasi node = `p − parent.p` (sebelumnya skeleton menumpuk 23 m) |
| 32 | Skinning / weight painting | ✅ | Weight transfer + perbaikan IBM kolom-mayor; diverifikasi `applyBoneTransform` di 143 klip |
| 33 | IK / FK setup | ◐ | Baru: `src/studio/ik.js` — aim constraint analitik untuk leher+kepala (`lookAt`, galat 0,0° terukur, dipotong 60°). **Belum** ada IK tangan/kaki, tidak ada solver numerik, tidak ada kontrol FK buatan tangan |
| 34 | Corrective shape keys | ⛔ | Tidak ada blendshape koreksi deformasi ekstrem |
| 35 | Rig validation | ✅ | `scripts/test-studio-three.mjs` (kotak tubuh tulang + vertex tak boleh melayang >1,1 m) dan `dev_pose.py` untuk tinjauan visual |

## Phase 7 — Animation production

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 36 | Animation blocking | ✅ | `human.py`: idle, walk, run, sit, ride, stand-up, talk, look, point, reach, collapse, float, vanish |
| 37 | Spline / motion refinement | ◐ | Kurva sinus/easing prosedural; belum ada editor kurva |
| 38 | Secondary motion | ◐ | `secondary.js`: napas, keterlambatan kepala/tangan (24,7 mm), **dan kain**: rantai `cloth01–03` di 5 entitas ber-shroud (ayunan 37,8 mm, 2,2 mm/frame, bobot 594/594 vertex). Masih ⛔ untuk **rambut** — belum ada tulang rambut |
| 39 | Procedural animation | ✅ | Pose dan root offset dihasilkan parameter waktu; `travel` (baru) menggeser aktor di dunia |
| 40 | Physics simulation | ⛔ | Tidak ada cloth/rigid/soft body |
| 41 | Animation cleanup | ◐ | Sesi ini: `scripts/qc-motion.mjs` mengukur laju kaki saat menapak (walk 2,26 m/s, run 4,76 m/s pada `speed 1`) dan interpenetrasi lantai (0 sampel). Foot sliding baru bisa *dihilangkan*, bukan hanya diukur, kalau cerita memakai `travel` |
| 42 | Animation baking | — | Klip sudah berupa keyframe kuaternion yang dibangkitkan kode; tidak ada simulasi yang perlu di-bake |

## Phase 8 — Scene assembly & lighting

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 43 | Final scene assembly | ✅ | `src/studio/compile.js` merakit set, objek, aktor, kamera, cahaya, teks per shot |
| 44 | Camera setup | ✅ | 11 preset (`camera.js`): static, dolly-in/out, pan, orbit, crane-up, low-angle, over-shoulder, handheld, follow (mengikuti aktor `travel`) + fov/roll. Sesi ini: `scripts/qc-framing.mjs` (dan grup `framing` di test) mengukur kepala/dada tiap aktor di 5 titik waktu per shot — 3 shot yang melanggar sudah diperbaiki |
| 45 | Lighting setup | ✅ | 7 preset (`LIGHTS` di `renderer.js`) + 6 look preset (sky/fog/exposure) + lampu lokal |
| 46 | Atmospheric effects | ◐ | `FogExp2` per look; tidak ada volumetrik/god ray |
| 47 | Look development | ◐ | Preset look + ACES tone mapping + exposure; belum ada LUT/kalibrasi warna final |

## Phase 9 — Rendering & post-production

| # | Langkah | Status | Bukti / catatan |
|---|---|---|---|
| 48 | Render optimization | ◐ | PCFSoft shadow, ACES, `pixelRatio`; belum ada pengaturan sampling/denoise/anggaran memori |
| 49 | Render passes / AOV | ⛔ | Belum ada pemisahan beauty/depth/normal/emission |
| 50 | Final rendering | ◐ | Komposisi Remotion (`StudioStory`) siap, `npx vite build` lolos, **belum pernah digambar di browser** — tidak ada Chromium di sandbox |
| 51 | Compositing | ⛔ | Belum ada compositing pass; teks subtitle digambar Remotion langsung |
| 52 | Color grading | ◐ | Exposure + vignette + grain lewat `look`; belum ada grading per shot |
| 53 | Final encoding | ◐ | Jalur `npm run render:studio` (Remotion, H.264) ada; parameter codec belum dikonfigurasi di kode dan belum pernah dijalankan |

---

## Tiga lubang termahal (dan urutannya)

1. **Belum pernah ada render WebGL (langkah 50).** Semua bukti visual berasal dari
   renderer perangkat lunak kita sendiri. Ini menutup sekaligus langkah 48–53
   (pass, compositing, grading, encoding) karena semuanya butuh frame nyata.
   Jalan keluarnya bukan kode baru, tapi menjalankan `npm run render:studio` di
   mesin dengan browser, lalu menyimpan satu still 1080p sebagai bukti.
2. **Secondary motion & physics (38, 40).** Overlap tubuh (napas, kepala
   tertinggal, ayunan lengan) sekarang ada di `secondary.js`, tapi rambut dan
   kain masih kaku: rig tidak punya tulang untuk keduanya, dan tidak ada
   simulasi. Ini yang paling terasa kalau klip mulai dipakai berulang.
3. **IK/FK & corrective shapes (33, 34).** Pandangan sudah bisa diarahkan
   (`lookAt`), tetapi tangan dan kaki belum punya IK: menaruh tangan di meja
   atau kaki di undakan masih dikerjakan dengan menggeser seluruh aktor. Pose
   ekstrem (jongkok dalam, memanjat) hanya bisa didekati dengan klip manual.

## Yang ditutup sesi ini

* **Foot sliding (langkah 41).** `scripts/qc-motion.mjs` mengukur kecepatan kaki
  saat menapak; `travel` (m/s, 0..6) ditambahkan ke skema aktor, diteruskan
  `compile.js`, dan dieksekusi `renderer.js` sebagai perpindahan dunia sepanjang
  `facing`. Contoh pemakaian: `stories/studio/duduk-sore.json` shot `duduk-05`.
* Nomor stride dari pengukuran: `walk` pada `speed 1` menyiratkan **2,26 m/s**
  (pakai `speed 0,6` + `travel 1,36` untuk langkah manusia normal), `run`
  menyiratkan **4,76 m/s**.
* **Framing shot (langkah 44).** `scripts/qc-framing.mjs` memproyeksikan kepala
  dan dada aktor di lima titik waktu per shot; tiga shot yang melanggar sudah
  diperbaiki.
* **Gerak sekunder (langkah 38, sebagian).** `src/studio/secondary.js`:
  napas 3,6 detik, ayunan langkah yang merambat dengan keterlambatan per tulang,
  dan goyangan lambat 7,3 detik. Besar pengaruhnya diukur, bukan diklaim:
  kepala bergeser maks 24,7 mm / rata-rata 14,9 mm, tangan 16,1 mm.
* **Properti di tangan (langkah 43).** Field `hold`/`holdHand`/`holdOffset`:
  properti menempel ke tulang metacarpal, ikut ayunan dan `travel` (0,000 mm
  meleset di sepanjang siklus `walk`). Ini baru mungkin setelah bug anchor
  di bawah diperbaiki — dan sengaja memakai tulang, bukan anchor statis.
* **Anchor aset (langkah 43).** `anchor.*` dulu diekspor di titik nol karena
  membaca `translation` (lokal) alih-alih `p` (absolut). Diperbaiki, 11 aset
  dibangun ulang, dan test kini memeriksa posisinya, bukan hanya jumlahnya.
* **Kain berayun (langkah 38).** Tiga tulang kain per entitas ber-shroud +
  bobot banded; ayunan prosedural 37,8 mm dengan kehalusan 2,2 mm/frame. Bukti
  visual `docs/cloth-sway.png` (renderer perangkat lunak).
* **Menoleh (langkah 33, sebagian).** `src/studio/ik.js`: arah pandang dihitung
  dari sumbu +Z tulang kepala, selisihnya dibagi ke neck02/neck03/head dengan
  batas 60° dan pitch ±29°. Diuji: galat 20,9° → 0,00°, target 91° di samping
  dipotong ke 60,2°, deterministik, tanpa NaN.
* **Pose jadi fungsi waktu.** Saat memasang gerak sekunder ditemukan
  `AnimationMixer.setTime()` tidak deterministik antar-urutan frame (menyimpang
  13,8 cm pada `walk`), padahal Remotion merender frame secara acak dan paralel.
  Mixer diganti `src/studio/clip-sample.js` (evaluasi interpolant sendiri);
  kemurnian frame diuji di `test-studio-three` dan disimpan sebagai gerbang.
