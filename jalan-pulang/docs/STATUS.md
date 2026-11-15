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
| karakter | hem polo dan selangkangan celana berlubang (mesh pakaian low-poly: kargo hanya 130 tris); jahitan lengan jaket terlihat di siku; rambut masih "helm" halus, bukan helai; pergelangan kaki sedikit memutar saat `walk`; `sit` mengasumsikan kursi setinggi 0,5 m (tidak ada prop kursi di perpustakaan) |
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
