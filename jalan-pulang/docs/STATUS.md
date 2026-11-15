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

## Yang **belum** terverifikasi

* `StudioStory` (three.js) belum pernah dijalankan di browser pada sesi ini —
  tidak ada Chromium di lingkungan dan `node_modules` belum dipasang.
  Kode-nya selesai dan mengikuti pola `delayRender`/`continueRender` Remotion,
  tapi **belum ada satu frame pun yang dirender**.
* Pemuatan GLB oleh `GLTFLoader` (termasuk tekstur PNG/JPEG tertanam) belum diuji
  di mesin nyata.
* Sinkronisasi audio/VO: belum ada.

## Cacat yang diketahui (jujur)

| area | cacat |
|---|---|
| karakter | jahitan lengan jaket (`male_casualsuit05`) terlihat di siku; hem polo berlubang kecil; celana kargo hanya 130 tris sehingga paha tampak datar; rambut masih "helm" halus, bukan helai |
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
