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

* `StudioStory` belum pernah **menggambar** satu frame pun di browser: tidak ada
  Chromium yang bisa dijalankan di sandbox ini (`@sparticuz/chromium` butuh
  `libnss3`, tidak tersedia). Bundel Vite (`npx vite build`) lolos, jadi
  sintaks/import aman, tetapi jalur WebGL belum dibuktikan.
* Upload tekstur GLB (PNG/JPEG tertanam) ke GPU.
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
| thumbnail | kamera otomatis; beberapa aset datar (jalan) terlihat kecil di frame |

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

1. **Verifikasi runtime di browser** (`npm i` + Chromium) — paling mendesak
   karena seluruh pengalaman cerita bergantung padanya.
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
encoding) ke kondisi nyata repo: 26 selesai, 16 sebagian, 8 belum, 3 tidak
berlaku. Lubang termahal tetap **belum ada render WebGL** — semua bukti visual
berasal dari renderer perangkat lunak.

Sesi ini menutup langkah 41 (foot sliding): `scripts/qc-motion.mjs` mengukur
laju kaki saat menapak (walk 2,26 m/s, run 4,76 m/s pada `speed 1`, tanpa
interpenetrasi lantai), dan skema aktor mendapat field `travel` (m/s) yang
benar-benar menggeser aktor di dunia — lihat `duduk-sore.json` shot
`duduk-05`.

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
