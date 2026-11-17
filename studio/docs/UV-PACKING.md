# UV & PACKING — langkah 17

Dokumen ini menutup **langkah 17 (UV packing)** di `docs/PIPELINE-AUDIT.md`.
Sebelumnya statusnya "sebagian" dengan alasan "tidak ada packing/UDIM". Setelah
diukur, ternyata masalahnya bukan "tidak ada packing", tapi **ada dua rezim UV
yang tidak pernah dinyatakan** — dan dua bug kecil di generator yang membuat
bagian-bagian aset saling menimpa di ruang UV.

Angka di bawah diukur dari isi GLB oleh `scripts/qc-uv.mjs`.

## 1. Dua rezim UV (dinyatakan, bukan tersirat)

| rezim | dipakai oleh | cara kerja | tumpang tindih? |
|---|---|---|---|
| **atlas 0..1** | 6 karakter, 5 entitas, sebagian properti | UV hasil unwrap (MakeHuman untuk tubuh & pakaian; generator untuk lathe/tabung) dipepetkan ke 0..1 | diukur per aset; yang disengaja = pemakaian ulang bilangan bulat ≥ 2× |
| **ruang objek (tiling)** | 27 aset bangunan/jalan/alam/properti/vehicle | UV = koordinat meter ÷ `uv_scale`, jadi tekstur berulang mengikuti ukuran aset (plester, aspal, kulit kayu) | tidak relevan: pengulangan adalah tujuannya |

UDIM **tidak** dipakai, dan itu keputusan: satu aset = satu set tekstur, tidak ada
aset raksasa yang perlu dipecah jadi beberapa ubin.

## 2. Bug yang ditemukan sambil mengukur (dan diperbaiki)

| bug | akibat terukur | perbaikan |
|---|---|---|
| `add_lathe` & `add_tube` menskalakan **U per radius** (`2π·r/uv_scale`) | cincin yang lebih kecil mengecil di U lalu menimpa cincin lain — lampu teplok: **66,3 %** texel tertimpa | U kini memakai radius acuan (radius terbesar profil/tabung) di `kit.py` |
| tutup lathe/tabung memakai UV cakram `cos/sin × r` | koordinat UV **negatif** (−0,44…0,44), sehingga tutup tidak bisa dipadatkan dan menimpa badan | cakram UV dinormalisasi ke `0,5 + 0,5·cos/sin` |
| tidak ada pemadat UV untuk pulau parametris | pulau-pulau tabung/lathe saling menimpa bebas | `forge/uvpack.py` — shelf packing per material (hanya untuk material yang seluruh pulaunya di dalam 0..1; material tiling dilewati) dipanggil dari `write_static_glb` |

Sesudah perbaikan, 41 aset lingkungan dibangun ulang (`build.py --category
building|nature|prop|road|vehicle`, ±50 detik). Thumbnail sebelum/sesudah:
`docs/uv-before-after.png` (lampu teplok, jeriken, beringin, rumah kos) — bentuk
tidak berubah, hanya skala/arah tekstur.

## 3. Hasil pengukuran (sesudah perbaikan)

| metrik | hasil |
|---|---|
| aset dengan tumpang tindih **tak sengaja** | **0** (sebelumnya 3: lampu teplok 66,3 %, rumah kos 10,8 %, jeriken 92,5 %) |
| kelas UV | 27 tiling · 19 rapat (≤5 %) · 6 daur-ulang (cermin/berulang ≥2×) · 0 tabrakan |
| cakupan atlas | **32 %** (`prop.drum`) … **90 %** (`nature.bush.fern`) |
| kepadatan texel | **123 px/m** (`nature.tree.banana`, tekstur 512 di pohon 4 m) … **3.870 px/m** (`char.female-lansia`, 2048) |
| ambang | 100 px/m — aset baru di bawah ini ditolak `npm run qc:uv` |

Kepadatan dihitung analitik: `texSize × √(luas UV / luas permukaan)`, jadi sah
untuk aset tiling maupun atlas (tidak bergantung pada rasterisasi).

## 4. Tabel per aset

<!-- BEGIN:uv -->

| aset | kat. | prim | atlas | cakupan | tumpang | pemakaian | tex | px/m | kelas |
|---|---|---|---|---|---|---|---|---|---|
| `building.house.kos` | building | 7 | 1 | 35% | 0.0% | 1.0× | 1024 | 871 | rapat |
| `building.house.old` | building | 6 | 0 | — | 0.0% | tiling | 1024 | 773 | tiling |
| `building.house.village` | building | 6 | 0 | — | 0.0% | tiling | 1024 | 823 | tiling |
| `building.industrial.warehouse` | building | 4 | 0 | — | 0.0% | tiling | 512 | 412 | tiling |
| `building.shop.warung` | building | 6 | 1 | 34% | 0.0% | 1.0× | 1024 | 854 | rapat |
| `char.anak-besar-laki` | character | 12 | 12 | 47% | 13.2% | 1.1× | 2048 | 3618 | daur-ulang |
| `char.anak-besar-perempuan` | character | 13 | 12 | 46% | 13.3% | 1.1× | 2048 | 4661 | daur-ulang |
| `char.anak-laki` | character | 12 | 12 | 47% | 13.0% | 1.1× | 2048 | 4416 | daur-ulang |
| `char.anak-perempuan` | character | 12 | 11 | 50% | 13.5% | 1.1× | 2048 | 5773 | daur-ulang |
| `char.balita-laki` | character | 12 | 12 | 47% | 13.0% | 1.1× | 2048 | 5566 | daur-ulang |
| `char.balita-perempuan` | character | 12 | 11 | 50% | 13.5% | 1.1× | 2048 | 7319 | daur-ulang |
| `char.female-dewasa` | character | 13 | 12 | 46% | 13.3% | 1.1× | 2048 | 3683 | daur-ulang |
| `char.female-dewasa-daster` | character | 12 | 11 | 50% | 13.4% | 1.1× | 2048 | 3778 | daur-ulang |
| `char.female-lansia` | character | 12 | 11 | 50% | 13.4% | 1.1× | 2048 | 3961 | daur-ulang |
| `char.male-dewasa-kemeja` | character | 12 | 12 | 46% | 13.2% | 1.1× | 2048 | 2686 | daur-ulang |
| `char.male-dewasa-polo` | character | 12 | 12 | 46% | 13.3% | 1.1× | 2048 | 2717 | daur-ulang |
| `char.male-lansia-kemeja` | character | 12 | 12 | 46% | 13.3% | 1.1× | 2048 | 2787 | daur-ulang |
| `char.male-muda-jaket` | character | 12 | 12 | 46% | 13.2% | 1.1× | 2048 | 2829 | daur-ulang |
| `char.male-pekerja` | character | 12 | 12 | 46% | 13.2% | 1.1× | 2048 | 2701 | daur-ulang |
| `char.remaja-laki` | character | 12 | 12 | 47% | 13.2% | 1.1× | 2048 | 3094 | daur-ulang |
| `char.remaja-perempuan` | character | 13 | 12 | 46% | 13.3% | 1.1× | 2048 | 4034 | daur-ulang |
| `entity.child` | entity | 7 | 6 | 74% | 0.0% | 1.0× | 2048 | 3446 | rapat |
| `entity.pale-standing` | entity | 7 | 6 | 73% | 0.0% | 1.0× | 2048 | 2440 | rapat |
| `entity.shadow-crouch` | entity | 6 | 5 | 84% | 0.0% | 1.0× | 2048 | 2570 | rapat |
| `entity.tall-limbs` | entity | 6 | 5 | 84% | 0.0% | 1.0× | 2048 | 1776 | rapat |
| `entity.veiled-seated` | entity | 7 | 5 | 84% | 0.0% | 1.0× | 2048 | 3107 | rapat |
| `kit.floor.tile` | building | 1 | 0 | — | 0.0% | tiling | 512 | 256 | tiling |
| `kit.wall.door` | building | 2 | 0 | — | 0.0% | tiling | 1024 | 1024 | tiling |
| `kit.wall.plain` | building | 1 | 0 | — | 0.0% | tiling | 1024 | 1024 | tiling |
| `kit.wall.window` | building | 3 | 0 | — | 0.0% | tiling | 1024 | 1074 | tiling |
| `nature.bush.fern` | nature | 2 | 2 | 90% | 0.4% | 1.0× | 512 | 189 | rapat |
| `nature.grass.patch` | nature | 2 | 2 | 78% | 0.4% | 1.0× | 512 | 232 | rapat |
| `nature.log.fallen` | nature | 2 | 0 | — | 0.0% | tiling | 512 | 560 | tiling |
| `nature.rock.boulder` | nature | 1 | 0 | — | 0.0% | tiling | 512 | 300 | tiling |
| `nature.tree.banana` | nature | 3 | 2 | 76% | 0.4% | 1.0× | 512 | 123 | rapat |
| `nature.tree.beringin` | nature | 3 | 1 | 76% | 0.4% | 1.0× | 512 | 176 | rapat |
| `nature.tree.dead` | nature | 1 | 0 | — | 0.0% | tiling | 512 | 1001 | tiling |
| `nature.tree.karet` | nature | 3 | 1 | 65% | 0.4% | 1.0× | 512 | 151 | rapat |
| `nature.tree.palm` | nature | 3 | 2 | 76% | 0.4% | 1.0× | 512 | 197 | rapat |
| `prop.bed` | prop | 3 | 0 | — | 0.0% | tiling | 512 | 511 | tiling |
| `prop.chair.wood` | prop | 2 | 0 | — | 0.0% | tiling | 512 | 805 | tiling |
| `prop.clothesline` | prop | 5 | 3 | 58% | 0.0% | 1.0× | 512 | 898 | rapat |
| `prop.crate` | prop | 2 | 0 | — | 0.0% | tiling | 512 | 805 | tiling |
| `prop.drum` | prop | 3 | 1 | 32% | 0.4% | 1.0× | 512 | 630 | rapat |
| `prop.jerrycan` | prop | 2 | 0 | — | 0.0% | tiling | 512 | 1524 | tiling |
| `prop.lamp.teplok` | prop | 4 | 1 | 41% | 0.0% | 1.0× | 512 | 3139 | rapat |
| `prop.sack` | prop | 2 | 0 | — | 0.0% | tiling | 512 | 1545 | tiling |
| `prop.shelves.steel` | prop | 3 | 0 | — | 0.0% | tiling | 512 | 654 | tiling |
| `prop.signboard` | prop | 2 | 1 | 43% | 0.4% | 1.0× | 512 | 730 | rapat |
| `prop.stove` | prop | 5 | 1 | 50% | 0.2% | 1.0× | 512 | 2661 | rapat |
| `prop.table.wood` | prop | 2 | 0 | — | 0.0% | tiling | 512 | 617 | tiling |
| `road.asphalt.cross` | road | 2 | 0 | — | 0.0% | tiling | 1024 | 532 | tiling |
| `road.asphalt.curve` | road | 2 | 0 | — | 0.0% | tiling | 1024 | 538 | tiling |
| `road.asphalt.straight` | road | 2 | 0 | — | 0.0% | tiling | 1024 | 557 | tiling |
| `road.asphalt.tjunction` | road | 2 | 0 | — | 0.0% | tiling | 1024 | 530 | tiling |
| `road.asphalt.wet` | road | 1 | 0 | — | 0.0% | tiling | 1024 | 512 | tiling |
| `road.dirt.straight` | road | 2 | 0 | — | 0.0% | tiling | 1024 | 666 | tiling |
| `road.prop.powerpole` | prop | 3 | 1 | 58% | 0.3% | 1.0× | 512 | 604 | rapat |
| `road.prop.signpost` | prop | 3 | 0 | — | 0.0% | tiling | 512 | 559 | tiling |
| `road.sidewalk.segment` | road | 1 | 0 | — | 0.0% | tiling | 512 | 478 | tiling |
| `vehicle.motorcycle.bebek` | vehicle | 8 | 0 | — | 0.0% | tiling | 512 | 1565 | tiling |
| `vehicle.pickup` | vehicle | 5 | 0 | — | 0.0% | tiling | 512 | 616 | tiling |

<!-- END:uv -->

## 5. Cara memakai

```bash
npm run qc:uv                    # periksa tabrakan + kepadatan + kesegaran tabel
npm run qc:uv -- --write         # tulis ulang tabel bagian 4
npm run test:studio              # grup uv: 0 tabrakan, dan pagar terbukti bisa gagal
```

## 6. Batas yang jujur

* "Rapat" hanya berarti tidak ada texel yang tertimpa lebih dari 5 %; ia tidak
  mengukur apakah *layout* UV enak untuk painter — cekungan dan jahitan tidak
  diperiksa.
* Pemadatan hanya menyentuh pulau yang seluruhnya di dalam 0..1. Bagian tiling
  (plester, aspal, kayu) sengaja dibiarkan.
* Semua ini analisis angka; tidak ada render WebGL di sandbox, jadi kualitas
  visual dipantau lewat thumbnail renderer perangkat lunak.
