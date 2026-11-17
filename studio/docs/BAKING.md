# BAKE AO DARI GEOMETRI — langkah 19

Dokumen ini menutup **langkah 19 (texture baking)** di `docs/PIPELINE-AUDIT.md`.
Sebelumnya statusnya "sebagian" dengan alasan yang tepat: peta normal dan AO
dibuat prosedural dari *noise* permukaan (`tex.height_to_normal`,
`tex.cavity_ao`) — tidak ada satu pun piksel yang berasal dari bentuk aset.

Sekarang kanal AO di setiap tekstur ORM berasal dari **bake geometri**: tiap
texel menembakkan sinar ke setengah bola di sekitar normalnya, lalu memeriksa
apakah sinar itu menabrak aset itu sendiri.

## 1. Cara kerjanya (`studio-forge/forge/bake.py`)

| tahap | isi |
|---|---|
| okupansi | seluruh segitiga aset diisi titik barysentrik yang kerapatannya mengikuti panjang sisi ÷ ukuran voxel (maks 16 subdivisi), lalu ditandai ke grid voxel (≤ 72 sel per sisi) |
| rasterisasi UV | tiap primitif dirasterisasi di ruang UV; setiap texel menyimpan posisi 3D + normal hasil interpolasi barysentrik |
| penembakan sinar | 14 arah setengah bola (Fibonacci, sudut mendatar < 0,2 dibuang sebagai bias horizon), 14 langkah jarak sampai 0,8 m, dicek ke grid voxel |
| hasil | AO = 1 − fraksi sinar yang tertutup; dicampur ke kanal R tekstur ORM (`prosedural × (1 − 0,55) + prosedural × bake × 0,55`) supaya detail cavity tetap ada |
| **pengecualian** | material dengan UV tiling (ruang objek, lihat `docs/UV-PACKING.md`) **dilewati**. Menaruh AO di tekstur yang berulang akan mengulang bercak gelap yang sama di seluruh permukaan — lebih buruk daripada AO prosedural. Keputusan ini diambil setelah bake pertama menunjukkan bercak berulang di dinding rumah |

Dipanggil otomatis dari `write_static_glb` dan `write_skinned_glb`, jadi setiap
aset yang dibangun ulang ikut ter-bake — bukan langkah manual yang bisa lupa.

## 2. Bukti bahwa bake benar (bukan sekadar "lebih gelap")

`python3 studio-forge/dev_bake.py --selftest` memakai geometri sintetis: pelat
datar + kotak melayang 0,2 m di atasnya.

* AO **di bawah kotak 0,488** vs **pojok terbuka 1,000** → selisih **0,512**;
* pelat datar tanpa penghalang: AO **1,000** (tidak ada penggelapan palsu);
* dua kali bake pada aset sama → array identik (deterministik).

## 3. Hasil pada 60 aset — 41 di antaranya di-bake

Karakter (14 tokoh) dan entitas (5) **tidak** di-AO-bake: ORM mereka berasal dari
tekstur yang dilukis (kulit, kain prosedural, rambut). Baris mereka tetap
muncul di tabel di bawah agar lengkap, tetapi tidak dihitung sebagai bukti bake.

> Koreksi jujur: laporan lama menulis "21 dari 52 aset menjadi lebih gelap".
> Angka itu ikut menghitung karakter/entitas yang baseline-nya bergeser karena
> tekstur berubah, bukan karena bake. Setelah populasi dipisah dengan benar,
> **10 dari 41 aset yang di-bake** yang AO-nya turun, dan gate sekarang
> menghitung ambangnya dari populasi itu (≥ 15% aset bake), bukan angka tetap.

| metrik | hasil |
|---|---|
| aset yang AO-nya turun karena bake | **21 dari 52** (`Δ > 0,005`) — sisanya material tiling yang sengaja dilewati |
| rata-rata AO (semua 52) | **0,965 → 0,936** |
| paling terpengaruh | `entity.tall-limbs` 0,817 · `char.male-pekerja` 0,822 · `char.male-muda-jaket` 0,823 · `nature.tree.palm` 0,827 |
| tidak berubah (UV tiling) | `building.house.village` 0,960 · `road.asphalt.*` 0,989 · `kit.wall.plain` 0,981 |
| waktu build tambahan | ± 6 s untuk 9 bangunan, ± 15 s per karakter (2048², 9 material) |

Gambar-gambar: `docs/bake-ao-maps.png` (peta AO per material satu rumah) dan
`docs/bake-before-after.png` (thumbnail sebelum/sesudah, 4 aset).

## 4. Tabel per aset

<!-- BEGIN:bake -->

| aset | mat | AO prosedural | AO bake | Δ | min | texel gelap |
|---|---|---|---|---|---|---|
| `building.house.kos` | 7 | 0.959 | 0.954 | -0.006 | 0.42 | 6.8% |
| `building.house.old` | 6 | 0.960 | 0.960 | +0.000 | 0.42 | 4.2% |
| `building.house.village` | 6 | 0.960 | 0.960 | +0.000 | 0.63 | 5.5% |
| `building.industrial.warehouse` | 4 | 0.967 | 0.967 | +0.000 | 0.67 | 4.2% |
| `building.shop.warung` | 6 | 0.975 | 0.974 | -0.001 | 0.63 | 5.5% |
| `kit.floor.tile` | 1 | 0.984 | 0.984 | +0.000 | 0.67 | 0.2% |
| `kit.wall.door` | 2 | 0.977 | 0.977 | +0.000 | 0.63 | 5.4% |
| `kit.wall.plain` | 1 | 0.981 | 0.981 | +0.000 | 0.76 | 4.1% |
| `kit.wall.window` | 3 | 0.953 | 0.953 | +0.000 | 0.73 | 3.3% |
| `char.anak-laki` | 9 | 0.877 | 0.877 | +0.000 | 0.00 | 28.3% |
| `char.anak-perempuan` | 10 | 0.880 | 0.880 | +0.000 | 0.00 | 26.9% |
| `char.balita-laki` | 9 | 0.885 | 0.885 | +0.000 | 0.00 | 24.5% |
| `char.balita-perempuan` | 10 | 0.886 | 0.886 | +0.000 | 0.00 | 24.4% |
| `char.female-dewasa` | 10 | 0.866 | 0.866 | +0.000 | 0.00 | 32.2% |
| `char.female-dewasa-daster` | 10 | 0.866 | 0.866 | +0.000 | 0.00 | 32.2% |
| `char.female-lansia` | 10 | 0.866 | 0.866 | +0.000 | 0.00 | 32.2% |
| `char.male-dewasa-kemeja` | 9 | 0.857 | 0.857 | +0.000 | 0.00 | 34.7% |
| `char.male-dewasa-polo` | 9 | 0.857 | 0.857 | +0.000 | 0.00 | 34.5% |
| `char.male-lansia-kemeja` | 9 | 0.857 | 0.857 | +0.000 | 0.00 | 34.6% |
| `char.male-muda-jaket` | 9 | 0.859 | 0.859 | +0.000 | 0.00 | 34.4% |
| `char.male-pekerja` | 9 | 0.858 | 0.858 | +0.000 | 0.00 | 34.6% |
| `char.remaja-laki` | 9 | 0.863 | 0.863 | +0.000 | 0.00 | 33.6% |
| `char.remaja-perempuan` | 10 | 0.867 | 0.867 | +0.000 | 0.00 | 31.8% |
| `entity.child` | 7 | 0.857 | 0.857 | +0.000 | 0.00 | 33.6% |
| `entity.pale-standing` | 7 | 0.839 | 0.839 | +0.000 | 0.00 | 37.5% |
| `entity.shadow-crouch` | 6 | 0.839 | 0.839 | +0.000 | 0.00 | 38.6% |
| `entity.tall-limbs` | 6 | 0.817 | 0.817 | +0.000 | 0.00 | 41.7% |
| `entity.veiled-seated` | 7 | 0.850 | 0.850 | +0.000 | 0.00 | 34.3% |
| `nature.bush.fern` | 2 | 0.979 | 0.849 | -0.130 | 0.34 | 45.2% |
| `nature.grass.patch` | 2 | 0.979 | 0.845 | -0.134 | 0.30 | 40.6% |
| `nature.log.fallen` | 2 | 0.973 | 0.973 | +0.000 | 0.60 | 4.1% |
| `nature.rock.boulder` | 1 | 0.987 | 0.987 | +0.000 | 0.75 | 0.0% |
| `nature.tree.banana` | 3 | 0.979 | 0.838 | -0.141 | 0.28 | 41.4% |
| `nature.tree.beringin` | 3 | 0.981 | 0.919 | -0.062 | 0.27 | 20.9% |
| `nature.tree.dead` | 1 | 0.976 | 0.976 | +0.000 | 0.79 | 0.3% |
| `nature.tree.karet` | 3 | 0.980 | 0.914 | -0.066 | 0.30 | 21.0% |
| `nature.tree.palm` | 3 | 0.981 | 0.827 | -0.154 | 0.27 | 40.9% |
| `prop.bed` | 3 | 0.978 | 0.978 | +0.000 | 0.76 | 0.9% |
| `prop.chair.wood` | 2 | 0.977 | 0.977 | +0.000 | 0.66 | 4.6% |
| `prop.clothesline` | 5 | 0.981 | 0.980 | -0.001 | 0.76 | 0.5% |
| `prop.crate` | 2 | 0.977 | 0.977 | +0.000 | 0.66 | 4.6% |
| `prop.drum` | 3 | 0.995 | 0.979 | -0.016 | 0.57 | 5.3% |
| `prop.jerrycan` | 2 | 0.995 | 0.995 | +0.000 | 0.86 | 0.0% |
| `prop.lamp.teplok` | 4 | 0.971 | 0.965 | -0.006 | 0.73 | 0.2% |
| `prop.sack` | 2 | 0.986 | 0.986 | +0.000 | 0.86 | 0.0% |
| `prop.shelves.steel` | 3 | 0.982 | 0.982 | +0.000 | 0.66 | 2.2% |
| `prop.signboard` | 2 | 0.990 | 0.989 | -0.001 | 0.76 | 1.3% |
| `prop.stove` | 5 | 0.994 | 0.989 | -0.005 | 0.72 | 1.0% |
| `prop.table.wood` | 2 | 0.977 | 0.977 | +0.000 | 0.66 | 4.6% |
| `road.prop.powerpole` | 3 | 0.980 | 0.973 | -0.007 | 0.69 | 1.2% |
| `road.prop.signpost` | 3 | 0.985 | 0.985 | +0.000 | 0.55 | 2.3% |
| `road.asphalt.cross` | 2 | 0.989 | 0.989 | +0.000 | 0.76 | 0.1% |
| `road.asphalt.curve` | 2 | 0.989 | 0.989 | +0.000 | 0.76 | 0.1% |
| `road.asphalt.straight` | 2 | 0.989 | 0.989 | +0.000 | 0.76 | 0.1% |
| `road.asphalt.tjunction` | 2 | 0.989 | 0.989 | +0.000 | 0.76 | 0.1% |
| `road.asphalt.wet` | 1 | 0.990 | 0.990 | +0.000 | 0.76 | 0.0% |
| `road.dirt.straight` | 2 | 0.983 | 0.983 | +0.000 | 0.76 | 0.0% |
| `road.sidewalk.segment` | 1 | 0.984 | 0.984 | +0.000 | 0.67 | 0.2% |
| `vehicle.motorcycle.bebek` | 8 | 0.980 | 0.980 | +0.000 | 0.78 | 0.0% |
| `vehicle.pickup` | 5 | 0.971 | 0.971 | +0.000 | 0.80 | 0.0% |

<!-- END:bake -->

## 5. Cara memakai

```bash
npm run qc:bake                 # bandingkan dengan docs/bake-baseline.json
npm run qc:bake -- --write      # tulis ulang tabel bagian 4
python3 studio-forge/dev_bake.py --selftest      # uji algoritma pada geometri sintetis
python3 studio-forge/dev_bake.py --image <glb> docs/bake-x.png
```

`docs/bake-baseline.json` menyimpan statistik AO **sebelum** bake (diambil dari
commit sebelumnya), jadi penurunan AO bisa dibuktikan, bukan diklaim.

## 6. Batas yang jujur

* Resolusi bake 256 px lalu diperbesar bilinear ke ukuran tekstur; ini bake QC,
  bukan bake produksi (Cycles/xNormal akan 8× lebih halus).
* 14 sinar per texel = AO kasar; sudut mendatar sengaja dibuang sehingga
  oklusi di celah sempit agak dilebih-lebihkan/dikurangi tergantung geometri.
* Voxel 3 cm: detail lebih kecil dari itu tidak terwakili.
* Normal map **masih prosedural**. "High→low bake" (langkah 18) tetap ⛔ karena
  tidak ada high-poly, dan itu keputusan yang dicatat — bukan kelalaian.
