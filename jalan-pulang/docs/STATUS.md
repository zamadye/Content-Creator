# STATUS — Studio Aset & Penceritaan v2

Terakhir diperbarui: sesi build ini. Angka diambil langsung dari
`public/assets/registry.json` (jangan diedit manual; jalankan
`python3 studio-forge/build.py --registry-only` untuk menyegarkan).

## Ringkasan

| | |
|---|---|
| Aset | **52** GLB + 52 thumbnail + registry + galeri HTML |
| Ukuran | **± 52,6 MB** (character 21,7 MB · entity 14,7 MB · building 5,7 MB · prop 3,9 MB · road 3,3 MB · nature 2,7 MB · vehicle 0,7 MB) |
| Geometri | ± 398.000 tris total |
| Rig | 163 tulang, 13 klip, 30 fps, `inverseBindMatrices` per klip |
| Status | 44 `review`, 8 `draft` |
| Kontrak | `studio.registry/2`, `studio.story/2`, `studio-humanoid-v1` |

Per kategori: character 6 · entity 5 · building 9 · road 7 · nature 9 · prop 14 · vehicle 2.

## Yang sudah terverifikasi otomatis

`npm run test:studio` (node, tanpa browser) memeriksa:

* setiap entri registry punya file GLB + thumbnail di disk, `pbr` lengkap, lisensi & provenance;
* header GLB, panjang chunk, byteLength buffer, tekstur tertanam;
* setiap primitif punya `POSITION/NORMAL/TEXCOORD_0/TANGENT` dan POSITION ber-min/max;
* setiap material punya baseColor + normal + metallicRoughness;
* aset ber-rig: 163 joint, IBM ada, ≥13 animasi, semua animasi punya channel;
* skema cerita: field tak dikenal, aset tak dikenal, klip salah, fps salah, id ganda,
  path audio tidak aman, durasi di luar batas — semuanya ditolak dengan pesan;
* kompilasi: batas frame per shot nyambung, total frame = Σ round(durasi×fps);
* kamera: `static` benar-benar diam, `dolly-in` mendekat, sampling deterministik;
* ketiga cerita contoh valid, deterministik, dan hanya memakai aset yang ada;
* `docs/ASSET-CATALOG.md` sinkron dengan registry.

## Yang diverifikasi manual (mata)

52 thumbnail di `public/assets/index.html` (buka via Vite: `/assets/index.html`).

## Yang terverifikasi di three.js nyata (Node, tanpa GPU)

`node scripts/test-studio-three.mjs` — **52 GLB dimuat oleh `GLTFLoader` asli**:
geometri, atribut, kulit, 143 klip animasi dievaluasi pada 3 titik waktu,
setiap tulang diperiksa tetap di dalam kotak tubuh, tiap vertex ter-skin
dipanggil lewat `applyBoneTransform` dan dicek finite + tidak lolos batas.
Tekstur dilepas sebelum parsing (Node tidak punya Canvas2D), jadi **upload
tekstur ke GPU tetap belum diuji**.

Yang ditemukan dan diperbaiki berkat tes ini (tiga bug nyata, semuanya tak
terlihat oleh renderer perangkat lunak karena ia tidak pernah men-skin):

1. **Translasi tulang ganda** — `joint_nodes()` menulis posisi absolut sebagai
   translasi lokal, jadi skeleton menumpuk sampai ~23 m dan setiap rotasi
   berporos di titik yang salah. Diperbaiki di `assemble.joint_nodes` dan
   `skin.world_matrices` (lokal = `p − parent.p`).
2. **Inverse bind matrix ditulis baris-mayor** — glTF mewajibkan matriks
   kolom-mayor; `glb.py` menulis apa adanya dari numpy, jadi seluruh translasi
   IBM jatuh ke baris bawah dan setiap vertex ter-skin berputar mengelilingi
   titik nol model. Paling parah di klip `sit` (vertex terbang 2,1 m). Diperbaiki
   dengan `transpose(0, 2, 1)` sebelum flatten di `forge/glb.py`.
3. **Lengan masuk ke badan** — rig beristirahat dalam A-pose (~49° di bawah
   horizontal), tetapi `base_pose` menambah 1,30 rad lagi sehingga lengan
   menyilang ke dada. `arm_drop` sekarang tambahan dari A-pose (0,24–0,34).
4. **Kain entity (shroud/veil) salah ruang koordinat** — spesifikasi shroud
   ditulis dalam ruang "0 = telapak kaki, tinggi 7,32 unit", sedangkan mesh
   memakai unit mentah MakeHuman (kaki di −8,168). Kain jadi selebar pinggang
   ("tutu") alih-alih menutupi tubuh. Konversi dilakukan di `character.build`
   (`FEET_Y + y·HEIGHT_UNITS/7.32`). Sekalian: kain sekarang berupa kerucut dari
   bahu ke lantai (radius turunan torso, tumbuh monoton supaya tidak tertekuk ke
   dalam tubuh), dan **bobotnya diikat ke tulang punggung saja** — sebelumnya
   bobot ditransfer dari vertex terdekat sehingga tulang lengan menarik sisi
   kain dan jubahnya terbuka. Lihat `docs/entity-poses.png`.

5. **Pakaian berlubang & lengan menghilang** — tiga sebab sekaligus:
   22,5% segitiga polo ter-winding terbalik (renderer front-face mencullnya,
   jadi kain tampak berlubang), 66 celah kecil 4-vertex di jahitan, dan kaus +
   celana memakai jarak offset yang sama (0,045) sehingga celana menembus kaus
   dan tampak sebagai gerigi di hem. Perbaikan: `kit.orient_consistently`
   (orientasi disebar lewat edge bersama, arah komponen dipilih lewat voting
   ber-bobot luas), `kit.fill_small_holes` (fan pada loop ≤12 vertex, ekstensi
   ≤1,2 unit), offset per lapisan (kaus 0,062 / celana 0,026 / jaket 0,048), dan
   material kain `double_sided` supaya sisa panel terbalik tidak menghilang.
   `forge/render.py` kini menghormati `double_sided`, jadi pratinjau QC tidak
   lagi menyembunyikan bug ini.

Penjaga baru supaya kelas bug ini tidak kembali:

* `scripts/test-studio-three.mjs` — tiap tulang harus tetap di dalam kotak tubuh
  pada semua klip, dan tiap vertex ter-skin (sampel 60 titik per mesh) tidak
  boleh bergerak lebih dari 1,1 m dari posisi istirahatnya.
* `studio-forge/dev_pose.py` + `dev_pose_sheet.py` — render satu frame animasi
  tanpa engine; hasilnya `docs/animation-poses.png` (6 karakter × idle/walk/sit,
  720×1980). Jalankan ulang tiap kali pose/klip berubah.

## Yang **belum** terverifikasi

* ~~WebGL di browser~~ **SUDAH** — Chromium 153 dari `@sparticuz/chromium`,
  di-unpack manual lalu diverifikasi `npm run verify:chromium`:
  `WebGL 2.0 (OpenGL ES 3.0 Chromium)` / `ANGLE (Google, Vulkan 1.3.0
  (SwiftShader Device (Subzero)), SwiftShader driver)`, `readPixels` 8×8 hijau.
  Enam frame sungguhan ada di `docs/webgl-shots/` (`npm run shots:webgl`).
  Cara pasang yang benar (termasuk jebakan library di posisi salah):
  `docs/CHROMIUM.md`.
* Sinkronisasi audio/VO: belum ada.

## Cacat yang diketahui (jujur)

| area | cacat |
|---|---|
| karakter | celana kargo hanya 255 vertex / 392 tris (mesh hasil fitting lama), jadi paha tampak bersudut; tekstur jaket `male_casualsuit05` berwarna ramai (bawaan aset, bukan hoodie polos); rambut masih "helm" halus, bukan helai; pergelangan kaki sedikit memutar saat `walk`; `sit` mengasumsikan kursi setinggi 0,5 m (tidak ada prop kursi di perpustakaan) |
| entitas | bentuk kafan/kerudung masih kasar (kerucut + kain), belum menyeramkan; status `draft` |
| kendaraan | pikap masih kotak-kotak; motor bebek terbaca tapi panel samping datar |
| alam | dedaunan memakai kartu besar, bukan daun individual; pohon beringin akar gantung belum ada |
| bangunan | interior kosong; pintu/jendela belum bisa dibuka; belum ada varian rusak |
| props | teks papan hanya ada di `prop.signboard`; `road.prop.signpost` masih kosong (draft) |
| QC render | software preview menaikkan albedo gelap (ambient kuat) — celana 0,18 tampak lebih terang di thumbnail daripada di engine |
| pakaian (ditemukan dari render WebGL pertama) | pada `StudioJalanPulang` detik 18 (kamera belakang), **badan menembus kemeja**: bercak kulit muncul di punggung dengan tepi bergerigi. Hanya terlihat di frame sungguhan, tidak di thumbnail/QC lama. Dugaan: badan dan kemeja adalah dua mesh terpisah yang di-fit berdekatan, lalu skinning `walk` mendorong badan keluar. Belum diperbaiki |
| malam terlalu pekat | `StudioWarungMalam` f220: 93 % piksel < 0,05 luminans; `StudioJalanPulang` f350: 89 %. Masih terbaca di layar terang, tapi di ponsel akan jadi blok hitam |
| thumbnail | kamera otomatis; beberapa aset datar (jalan) terlihat kecil di frame |

## Render WebGL sungguhan (Chromium)

```bash
npm ci && npm run extract:chromium      # 210 MB ke ../.jalan-pulang-tools (git-ignored)
npm run verify:chromium                 # WebGL2 + readPixels terbukti
npm run shots:webgl                     # 6 still nyata → docs/webgl-shots/
STUDIO_COMPOSITION=StudioJalanPulang npm run render:studio:h264
```

Hasil terakhir: `render/StudioJalanPulang-h264.mp4` — **23,50 s, 960×540,
30 fps, H.264 High, yuv420p(tv, bt709), 3,5 MB**, 705 frame, ±6,5 menit di
SwiftShader (CPU). Poster: `docs/studio-render-frames/`. Detail pemasangan
Chromium (termasuk jebakan library SwiftShader yang harus di samping binary):
`docs/CHROMIUM.md`.

## Cara membangun ulang (deterministik)

```bash
python3 -m venv .venv && .venv/bin/pip install -r studio-forge/requirements.txt
.venv/bin/python studio-forge/build.py --all            # ±7 menit, 52 aset
.venv/bin/python studio-forge/build.py --only prop.drum # satu aset
npm run studio:validate                                  # validasi cerita
npm run test:studio                                      # gerbang mutu
```

Build bersifat deterministik: seed tekstur tetap, urutan registry stabil, ukuran
file identik antar-jalan (kecuali JPEG encoder sistem berubah).

## Bottleneck berikutnya

1. ~~Verifikasi runtime di browser~~ **selesai**: Chromium + WebGL2 terbukti
   menggambar (`docs/CHROMIUM.md`, `docs/webgl-shots/`). Sisa pekerjaan di area
   ini adalah AOV (langkah 49) dan compositing (51), bukan lagi akses browser.
2. Set interior siap pakai (kamar kos, gudang) supaya 9 modul `kit.*` terpakai.
3. Entitas yang layak horor (siluet, bukan kostum).
4. LOD + atlas tekstur: 12 aktor × 3,5 MB terlalu berat untuk satu adegan penuh.

## Duduk di kursi library

Klip `sit` sudah dicocokkan dengan `prop.chair.wood`: permukaan duduk 0,46 m,
pelvis aktor y≈0,50 m, kaki di lantai (lihat `docs/sit-chair-check.png`).
Cerita contoh baru `stories/studio/duduk-sore.json` (4 shot, 16 detik) memakai
pasangan ini, plus `validate` bersih (satu peringatan status `draft` untuk lampu
teplok).

## Audit pipeline 9 fase / 53 langkah

`docs/PIPELINE-AUDIT.md` memetakan seluruh pipeline (pre-production sampai
encoding) ke kondisi nyata repo: **29 selesai, 15 sebagian, 7 belum, 2 tidak
berlaku** (dihitung ulang otomatis, lihat di bawah). Lubang termahal tetap
**belum ada render WebGL** — semua bukti visual berasal dari renderer
perangkat lunak.

Tabel ringkasan di audit tidak lagi ditulis tangan: `scripts/audit-count.mjs`
menghitung ulang semua 53 baris dan `npm run test:studio` (grup
`audit-summary`) menolak dokumen yang tabelnya tidak cocok dengan isinya.

**Phase 1 = 4/4 ✅ · Phase 2 = 5/5 ✅ · Phase 4 = 4 ✅ / 1 ⛔ · Phase 5 = 7 ✅ / 1 ◐ / 1 ⛔.** Langkah 4 (scene planning) ditutup
dengan denah + pemeriksaan tata letak terukur, langkah 8 (topology planning)
dengan rencana + anggaran yang ditegakkan tes — lihat dua bagian berikut.

Sesi ini menutup langkah 41 (foot sliding): `scripts/qc-motion.mjs` mengukur
laju kaki saat menapak (walk 2,26 m/s, run 4,76 m/s pada `speed 1`, tanpa
interpenetrasi lantai), dan skema aktor mendapat field `travel` (m/s) yang
benar-benar menggeser aktor di dunia — lihat `duduk-sore.json` shot
`duduk-05`.

## Denah (previs) + pemeriksaan tata letak — langkah 4

Perencanaan komposisi tidak lagi manual. Dua alat, satu sumber angka:
`docs/plans/*.json`.

**`scripts/qc-plan.mjs`** memeriksa setiap shot cerita:

| pemeriksaan | cara ukur | hasil sesi ini |
|---|---|---|
| kamera menembus geometri | jarak titik→**segitiga asli** aset (bukan kotak batas), dinilai di 9 sampel `u` per shot | 6.546 segitiga diperiksa, jarak terdekat **0,27 m** (`duduk-sore/duduk-01`, `uji-kamera/kamera-05`), batas 0,12 m |
| dua aktor bertumpuk | jarak XZ di awal & akhir shot (ikut `travel`) | terdekat **1,52 m** (`warung-malam/duduk-02`), batas 0,45 m |
| aktor berdiri di dalam properti | jarak dada (y+1,0 m) ke segitiga aset | 0 temuan; aktor dengan klip duduk/berbaring **dikecualikan** karena memang bersentuhan dengan bangku |

Hasil: **23 shot · 0 masalah**. Keluaran `docs/plans/<cerita>.json` memuat kotak
set/objek, jalur kamera 9 sampel beserta jarak terdekatnya, posisi awal–akhir
aktor, dan `stats` ringkas.

**`studio-forge/dev_plan.py`** menggambar JSON itu jadi PNG tampak atas
(`docs/plans/*.png`, 3 kolom per cerita): kotak set berisi transparan, properti
di atasnya, titik aktor + arah hadap + jalur `travel`, jalur kamera
(awal biru → akhir magenta) dengan panah ke target, skala 1 m, dan label jarak
kamera per shot.

**`npm run test:plan`** (9 grup) bukan hanya memastikan "0 masalah", tapi
membuktikan pemeriksaannya **bisa gagal**: tiga cerita rusak buatan —
kamera tepat di permukaan geometri, kamera 5 cm dari dinding, aktor berdiri di
dalam dinding — semuanya terdeteksi; satu kasus sah (aktor duduk di bangku)
tidak dilaporkan. Titik dinding untuk tes diambil dari centroid segitiga aset,
jadi tes tidak bergantung pada koordinat yang ditulis tangan.

Perintah: `npm run qc:plan` (periksa + tulis JSON), `npm run qc:plan:png`
(gambar denah), `npm run test:plan`.

Batas yang jujur: segitiga yang diperiksa disaring per wilayah shot (pusat
segitiga harus di dalam kotak sampel ±2,5 m) dan dibatasi 6.000 segitiga per
mesh; aktor diperiksa sebagai titik dada, bukan tabung badan penuh; dan ini
tetap perhitungan, **bukan render** — ia tidak menangkap oklusi visual,
pencahayaan, atau clipping near/far.

## Rencana topologi & anggaran — langkah 8

`docs/TOPOLOGY-PLAN.md` akhirnya menuliskan keputusan yang selama ini hanya ada
di kode: mana yang jadi geometri, mana yang jadi tekstur, dan berapa plafonnya.
Isinya dipakai — bukan pajangan:

| bagian | isi |
|---|---|
| prinsip | bentuk besar = geometri, detail kecil = tekstur; silhouette dulu; statis = murah |
| strategi per kategori | menunjuk fungsi aslinya (mis. daun = kartu alpha `add_leaf_card`, batang = `add_tube`; roda = `add_lathe`) |
| keputusan yang ditolak | LOD, high→low bake, atlasing lintas aset — beserta alasan |
| anggaran | character 42k · entity 34k · nature 4k · building 3k · vehicle 3k · prop 1,5k · road 1,5k tri; tekstur 512–2048 px; **shot 120k tri** |
| tabel 52 aset | tri, vertex, primitif, material, tekstur, tulang, % pemakaian — **diukur dari GLB** |

`npm run qc-topology` (`scripts/qc-topology.mjs`) memeriksa tiga hal sekaligus:
tidak ada aset melewati anggaran, jumlah tri di GLB **sama** dengan registry, dan
tabel di dokumen tidak basi (`--write` untuk menyegarkan). Hasil sekarang:
52 aset, 0 pelanggaran; pemakaian tertinggi `char.male-muda-jaket` 39.386 tri =
**94 %**; shot terberat `warung-malam/duduk-02` 79.044 tri = **66 %** anggaran.

Grup tes `topology` di `npm run test:studio` juga membuktikan pagarnya **bisa
gagal**: aset karangan 50.000 tri + tekstur 4096 px langsung dilaporkan sebagai
dua pelanggaran.

## UV: dua rezim, packing, dan dua bug — langkah 17

`docs/UV-PACKING.md` mengubah pertanyaan "kenapa belum ada packing?" menjadi
fakta terukur: repo ini memakai **dua rezim UV** yang tidak pernah ditulis.

| rezim | aset | tumpang tindih |
|---|---|---|
| atlas 0..1 | 25 aset (karakter, entitas, properti parametris) | diukur; yang disengaja = pemakaian ulang bilangan bulat ≥ 2× (cermin kiri/kanan) |
| ruang objek tiling | 27 aset lingkungan | tidak relevan — berulang memang tujuannya |

Sambil mengukur, dua bug generator ketemu dan diperbaiki:

* `add_lathe`/`add_tube` menskalakan **U per radius** → cincin kecil menimpa
  cincin besar (lampu teplok: **66,3 %** texel tertimpa). Kini U memakai radius
  acuan;
* cakram UV tutup lathe/tabung memakai `cos/sin × r` → koordinat **negatif**
  (sampai −0,44). Kini dinormalisasi ke `0,5 + 0,5·cos/sin`.

Ditambah `forge/uvpack.py` (shelf packing per material, hanya untuk material
yang seluruh pulaunya di dalam 0..1) yang dipanggil `write_static_glb`.

Sesudah perbaikan dan rebuild 41 aset (±50 detik): **0 tumpang tindih tak
sengaja** (sebelumnya 3 aset), kelas 19 rapat · 6 daur-ulang · 27 tiling,
kepadatan texel **123–3.870 px/m** (ambang 100). Bukti visual
`docs/uv-before-after.png`; pagar `npm run qc:uv` + grup tes `uv` (yang juga
membuktikan pagarnya bisa gagal).

## Bake AO dari geometri — langkah 19

Kanal AO tidak lagi berasal dari noise permukaan. `forge/bake.py` merasterisasi
tiap primitif di ruang UV, lalu menembakkan 14 sinar setengah bola per texel ke
grid voxel aset itu sendiri; hasilnya dicampur ke kanal R tekstur ORM
(bobot 0,55) sehingga detail cavity prosedural tetap ada.

Bukti bahwa ini bake, bukan "dibuat lebih gelap":

| uji | hasil |
|---|---|
| geometri sintetis (pelat + kotak melayang) | AO **0,488** di bawah kotak vs **1,000** di pojok terbuka |
| pelat datar tanpa penghalang | AO **1,000** (tidak ada penggelapan palsu) |
| determinisme | dua kali bake → array identik |
| 52 aset | **21 menjadi lebih gelap**, rata-rata 0,965 → 0,936 |
| paling terpengaruh | `entity.tall-limbs` 0,817 · `char.male-pekerja` 0,822 · `nature.tree.palm` 0,827 |

Keputusan penting: material dengan **UV tiling** dilewati. Percobaan pertama
membake semuanya dan hasilnya memperlihatkan bercak gelap yang berulang di
dinding rumah — tekstur yang berulang tidak bisa menyimpan AO per permukaan.
Sekarang hanya material atlas yang dibake; sisanya tetap AO prosedural.

Bukti visual: `docs/bake-ao-maps.png`, `docs/bake-before-after.png`. Pagar:
`npm run qc:bake` (membandingkan dengan `docs/bake-baseline.json`) dan grup tes
`bake` yang menjalankan selftest + verify. Langkah 18 (high→low) tetap ⛔ karena
tidak ada sumber high-poly.

## Kalibrasi material di cahaya netral — langkah 29

Sebelumnya material hanya "diperiksa mata" lewat thumbnail katalog yang memakai
cahaya hangat + ambient kebiruan — bagus untuk katalog, tidak bisa dipakai
membandingkan material. Sekarang tiap material dirender sebagai **bola** di
bawah cahaya netral dan diukur:

| angka | hasil (209 material) |
|---|---|
| albedo (Rec.709) | 0,134 – 0,932, median 0,290 |
| status | 204 `ok` · 5 `emisi` · **0 di luar rentang** (batas 0,035–0,90 untuk non-emisif) |
| roughness / metallic | diambil dari kanal G/B tekstur ORM |
| luminans render | diukur hanya pada piksel bola, bukan latar |

Bukti: `docs/material-calibration.png` (grid 8 kolom, label per bola), dokumen
`docs/MATERIAL-CALIBRATION.md`, pagar `npm run qc:materials`. Tes `materials`
menjalankan selftest batas verdict (albedo 0,02 → "terlalu gelap", 0,95 →
"terlalu terang") dan memastikan tabel dokumen tidak basi.

## QC framing shot (`scripts/qc-framing.mjs`)

Framing sekarang **diukur**, bukan ditebak. Skrip memproyeksikan kepala dan dada
setiap aktor (sudah termasuk geseran `travel`) ke NDC di lima titik waktu per
shot, memakai `cameraSample()` yang sama dengan renderer, lalu melaporkan
`ok` / `mepet` / `LUAR` / `kosong` beserta posisi NDC dan jarak kamera.

Hasil pemeriksaan 22 shot di 4 cerita menemukan tiga shot bermasalah, semuanya
diperbaiki:

| shot | masalah | perbaikan |
|---|---|---|
| `warung-malam/keluar-03` | kamera mulai 0,37 m dari aktor — dada di NDC (−0,89, −1,55), kepala terpotong | kamera `from` z 1,2 → 3,3, `to` z 5,2 → 1,9 (dolly-in halus), target diturunkan; aktor kini `speed 0.42` + `travel 0.95` sehingga benar-benar berjalan pergi |
| `warung-malam/masuk-01` | dolly-in berakhir 1,55 m dari Bu Sri, kepala di NDC y = 1,01 | `to` z 2,9 → 3,35, tinggi 1,52 |
| `duduk-sore/duduk-03` | kepala `tetangga` keluar frame di u = 0,75 saat pan | kamera mundur (z 2,9 → 3,5) dan target dinaikkan |

Sesudah perbaikan: **22 shot, 0 masalah**, jarak kamera terdekat 1,08 m
(`warung-malam/duduk-02`, shot duduk dua orang) dan terjauh 9,4 m
(`jalan-pulang-01/sosok-04`).

Pemeriksaan ini juga masuk `npm run test:studio` (grup `framing`), jadi cerita
baru tidak bisa lolos dengan kepala terpotong. Perintah: `npm run qc:framing`,
`npm run qc:motion`.

Batasnya tetap sama dan harus disebut: ini perhitungan proyeksi, bukan render.
Ia menangkap framing dan jarak kamera, **tidak** menangkap oklusi (kamera di
belakang dinding), clipping near/far, atau apakah pencahayaan benar.

## Gerak sekunder (langkah 38, sebagian)

`src/studio/secondary.js` menambahkan satu lapis gerak di atas klip tanpa
menyentuh GLB: napas 3,6 detik di tulang punggung dan klavikula, ayunan badan
mengikuti irama klip dengan keterlambatan per tulang (spine02 → spine04 → neck02
→ head, lengan mengayun menyusul), dan goyangan berat badan 7,3 detik. Semuanya
fungsi murni dari waktu lokal shot — tidak ada integrator, karena Remotion
merender frame secara acak.

Diukur di `scripts/test-studio-three.mjs` pada `char.male-muda-jaket` + `walk`
(`speed 0,6`): kepala bergeser maksimum **24,7 mm** (rata-rata 14,9 mm), tangan
**16,1 mm**, tanpa NaN, dan dua instans dengan riwayat berbeda menghasilkan pose
identik.

Field baru per shot: `secondary` (0..2, default 1) — `0` mematikan lapisan ini
(mis. adegan beku), `1,5`–`2` melebihkannya untuk kamera dekat. Cerita memakainya
di `jalan-pulang-01/sosok-04` (`0,35`, ketegangan) dan `warung-malam/duduk-02`
(`1,4`, percakapan dekat).

**Batasnya jelas:** ini bukan simulasi. Rambut dan kain tetap kaku karena rig
163 tulang tidak punya tulang untuk keduanya; langkah 40 (fisika) tetap ⛔.

## Bug yang ditemukan sambil mengerjakan gerak sekunder

`THREE.AnimationMixer.setTime()` **tidak murni terhadap waktu**: pose pada
`t = 2,0` berbeda 13,8 cm antara "langsung ke 2,0" dan "melangkah 120 frame lalu
ke 2,0" (penghitungan loop tersimpan di dalam mixer). Itu berarti selama ini
frame yang sama bisa menghasilkan pose berbeda tergantung urutan render —
persis yang tidak boleh terjadi pada Remotion yang merender paralel dan acak.

Mixer sudah diganti `src/studio/clip-sample.js` (evaluasi interpolant klip
sendiri, satu klip per aktor, tanpa fade/penimbangan). Kemurniannya sekarang
diuji: 6 waktu × 4 urutan pemanggilan (segar, naik, acak, setelah melangkah
1/120 detik) dengan simpangan maksimum **0,0000 mm**. `scripts/qc-motion.mjs`
ikut memakai sampler yang sama dan menghasilkan angka identik (walk 2,26 m/s,
run 4,76 m/s) — bukti sampler tidak mengubah animasi, hanya membuatnya
deterministik.

## Menoleh ke lawan bicara (langkah 33, sebagian)

`src/studio/ik.js` menambahkan **aim constraint** untuk leher dan kepala. Field
aktor baru `lookAt` menerima nama aktor lain (yang wajib ada di shot yang sama)
atau titik dunia `[x, y, z]`. Target dibaca dari tulang kepala lawan bicara pada
pose frame itu — bukan tinggi tebakan — sehingga tetap tepat saat lawannya
berjalan (`travel`).

Diukur di `scripts/test-studio-three.mjs` pada `char.female-lansia` + `sit`:

| kasus | galat sebelum | galat sesudah | putaran |
|---|---|---|---|
| target 2 m di depan | 20,9° | **0,00°** | 20,9° |
| target 91° di samping | 91° | 21° | dipotong ke **60,2°** |
| target di belakang | 179° | tetap di luar pandangan | dipotong ke 60,2° |

Batasan: total putaran maksimum 60°, pitch ±29°, hanya leher+kepala. **Tidak ada
IK tangan/kaki** — menaruh tangan di meja masih dikerjakan dengan menggeser
seluruh aktor. Cerita yang memakainya: `warung-malam/duduk-02` (Bu Sri dan aku
saling memandang) dan `duduk-sore/duduk-03` (tetangga menoleh).

## Bug yang diperbaiki: anchor aset dulu menumpuk di titik nol

Ketujuh `anchor.*` (tangan, kaki, kepala, mata) di **setiap** karakter dan
entitas pernah diekspor di `(0, 0, 0)`, sehingga tidak bisa dipakai untuk
menempelkan properti ke tangan atau kamera ke kepala. Penyebabnya
`character.py::_anchor_nodes` membaca `b["translation"]`, padahal rig menyimpan
posisi rest absolut di `b["p"]`; `translation` baru dibuat saat node glTF ditulis.

Sekarang dibaca dari `b["p"]`, dan 11 aset dibangun ulang
(`--category character --skin-size 2048`, `--category entity`). Hasilnya:

| aset | anchor.head | anchor.hand.L | anchor.foot.L |
|---|---|---|---|
| `char.male-muda-jaket` | 1,491 m | 0,422 / 1,023 / 0,194 | 0,216 / 0,071 / −0,001 |
| `entity.pale-standing` | 1,618 m | 0,459 / 1,111 / 0,210 | 0,235 / 0,077 / −0,001 |

Test sekarang memeriksa **posisi**, bukan hanya jumlah node: anchor tidak boleh
di titik nol, `anchor.head` harus 0,8–1,02 × tinggi aset, kaki di bawah
0,16 × tinggi, tangan di 0,45–0,85 × tinggi, dan jarak kiri-kanan tidak boleh
runtuh. Ambangnya relatif karena entitas jauh lebih tinggi daripada manusia.

## Properti di tangan (`hold`)

Field aktor `hold` (ref ke `objects`) + `holdHand` (`L`/`R`) + `holdOffset`
(`[x,y,z]` di ruang tangan). Properti ditempelkan ke tulang `metacarpal1`
(cadangan `wrist`), jadi ikut ayunan lengan dan `travel`; properti juga otomatis
ikut dimuat walau tidak diletakkan di `set` (`assetIds` di `compile.js`).

Diukur di `scripts/test-studio-three.mjs`: asal properti berimpit dengan tulang
tangan (**0,000 mm** selisih) di sepanjang ayunan `walk`, ikut berpindah 1,36 m
saat akar aktor digeser, `holdOffset` menggeser tepat 0,1 m di ruang tangan,
tangan kiri/kanan sama-sama jalan, dan tulang yang tidak ada menghasilkan `null`
alih-alih crash. Cerita yang memakainya: `jalan-pulang-01/jembatan-01` (aku
membawa jerigen saat berjalan pulang).

Batas: orientasi properti mengikuti sumbu tangan dan tidak ada rotasi per
properti; jari tidak menggenggam (tidak ada pose genggam di klip).

## Kamera mengikuti aktor (`preset: "follow"`)

Preset ke-11 di `camera.js`. Kamera ditaruh di belakang arah hadap aktor pada
jarak (`distance`, default 4,2 m) dan tinggi (`height`, default 1,45 m) tetap,
lalu ikut bergerak bersama `travel` lewat `subjectAt(u)` yang disiapkan
`compile.js`. Ini menutup masalah shot berjalan yang sebelumnya hanya bisa
diakali dengan `dolly` yang kebetulan searah.

Terukur: jarak kamera ke subjek tetap (selisih < 1 mm dari awal ke akhir shot),
perpindahan kamera = perpindahan aktor (1,36 m/s × durasi), dan tanpa `travel`
kamera diam. Contoh: `uji-kamera.json` shot `kamera-10`; `qc:framing` sekarang
memeriksa 23 shot dengan 0 masalah.

Batas: `follow` hanya mengikuti aktor pertama yang tidak `hidden`; dolly selama
mengikuti (mis. menjauh perlahan) belum ada.

## Kain berayun: rantai tulang cloth01–03

Sebelumnya shroud dan veil diikat ke tulang punggung saja, jadi kainnya kaku
seperti papan. Sekarang aset ber-shroud mendapat **tiga tulang kain**
(`spine03 → cloth01 → cloth02 → cloth03`) di
`studio-forge/forge/character.py::_add_cloth_bones`, dengan bobot banded
(`_cloth_weights`): puncak kain ikut punggung, ujung bawah ikut tulang terbawah.

Lima entitas dibangun ulang (163 → **166 tulang**). Karakter tetap 163 tulang
karena tidak memakai shroud.

Penggeraknya di `src/studio/secondary.js`: ayunan mengikuti langkah dengan
keterlambatan makin ke ujung (0,14 / 0,20 / 0,26 detik) plus angin pelan 5,7
detik, diterapkan setelah sampler menulis pose klip.

Angka yang diukur, bukan diklaim:

| pengukuran | hasil | di mana |
|---|---|---|
| vertex shroud yang mengikuti tulang kain | **594 / 594** | `test-studio-three` |
| normalisasi bobot kulit | selisih < 0,02 per vertex | `test-studio-three` |
| rentang ayunan (klip dibekukan) | **37,8 mm** | `test-studio-three` |
| gerak per frame | maks **2,2 mm** (halus, tanpa menyentak) | `test-studio-three` |
| putar `cloth03` 8° di renderer perangkat lunak | hem bergeser hingga 41,8 mm, tidak sobek | `docs/cloth-sway.png` |

Bukti visual: `docs/cloth-sway.png` (0° vs 8°), dirender
`studio-forge/dev_pose.py` argumen kelima:
`./.venv/bin/python studio-forge/dev_pose.py entity.pale-standing walk 10 /tmp/x.png 8`.

Batas yang harus disebut:

* Ini gerak **prosedural**, bukan simulasi kain. Tidak ada tabrakan dengan tubuh
  atau diri sendiri; handuk tidak akan jatuh mengikuti gravitasi.
* **Rambut tetap kaku** — belum ada tulang rambut, dan gaya rambut aset ini
  pendek.
* Shroud masih menembus kaki dan tangan pada pose tertentu (terlihat di
  `docs/cloth-sway.png` sebagai bercak terang); itu masalah fit kain yang sudah
  ada sebelumnya, bukan efek tulang baru.
