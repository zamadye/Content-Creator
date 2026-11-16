# PUSTAKA PROPERTI — Kenney (CC0-1.0)

Properti di folder ini **bukan** buatan pipeline sendiri. Sumbernya pustaka
Kenney yang diambil dari cermin GitHub (`github.com/shorepine/kenney`, lihat
`vendor/kenney/README.md`), lisensi **CC0-1.0**.

Aturan pembagian yang dipakai proyek ini:

| jenis | sumber | alasan |
|---|---|---|
| **karakter & entitas** (`char.*`, `entity.*`) | pipeline sendiri (`studio-forge/forge/character.py`) | identitas: proporsi, wajah, kain, dan klip khas proyek |
| **properti, set, kendaraan pendukung** | Kenney CC0 (`public/library/`) | cepat, rapi, bebas lisensi, dan bentuknya sudah terbaca |

## Kenapa lewat cermin GitHub

`kenney.nl` menolak koneksi dari sandbox ini (hanya `github.com`,
`codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`,
`files.pythonhosted.org` yang terbuka). Cermin `shorepine/kenney` menyimpan
**4.812 model GLB dari 49 kit** milik Kenney beserta lisensinya — jumlahnya jauh
lebih lengkap daripada rilis GitHub lain yang kami temukan. Dari situ
`studio-forge/kenney/CURATED.json` memilih 102 model yang relevan.

## Cara pakai

```bash
python3 studio-forge/kenney_import.py --list                 # lihat kurasi
python3 studio-forge/kenney_import.py --build                # bangun semua (indeks + thumbnail)
python3 studio-forge/kenney_import.py --build --only furniture/chair
python3 studio-forge/kenney_import.py --check                # indeks vs berkas
```

Keluaran: `public/library/index.json` (skema `studio.library/1`), satu GLB +
satu PNG per properti, dan tabel di bawah. Normalisasi: sumbu +Y, meter, pivot
di tengah alas, satu mesh per material, tanpa tekstur eksternal (material warna
datar khas Kenney supaya tidak bertabrakan dengan atlas tekstur sendiri).

## Isi pustaka

<!-- BEGIN:library -->

| kit | jumlah | tri total | contoh |
|---|---|---|---|
| food | 15 | 2556 | `bottle-ketchup`, `bottle-oil`, `bowl`, `bowl-cereal` |
| furniture | 37 | 8218 | `bathroomSink`, `bathtub`, `bedBunk`, `bedDouble` |
| modular-buildings | 8 | 312 | `building-corner-window`, `building-steps-narrow`, `building-steps-wide`, `building-window` |
| nature | 13 | 1588 | `bridge_wood`, `campfire_logs`, `canoe`, `flower_redA` |
| retro-urban | 29 | 1128 | `detail-awning-small`, `detail-awning-wide`, `detail-barrier-type-a`, `detail-bench` |

<details><summary>Daftar lengkap 102 properti</summary>

| id | tri | ukuran (m) | material |
|---|---|---|---|
| `kenney.food.bottle-ketchup` | 96 | 0.07 × 0.18 × 0.07 | colormap |
| `kenney.food.bottle-oil` | 96 | 0.06 × 0.28 × 0.06 | colormap |
| `kenney.food.bowl` | 84 | 0.23 × 0.10 × 0.26 | colormap |
| `kenney.food.bowl-cereal` | 120 | 0.23 × 0.19 × 0.29 | colormap |
| `kenney.food.bowl-soup` | 132 | 0.23 × 0.10 × 0.26 | colormap |
| `kenney.food.bread` | 116 | 0.20 × 0.02 × 0.17 | colormap |
| `kenney.food.burger` | 294 | 0.18 × 0.13 × 0.18 | colormap |
| `kenney.food.can` | 156 | 0.14 × 0.14 × 0.14 | colormap |
| `kenney.food.can-small` | 154 | 0.14 × 0.07 × 0.14 | colormap |
| `kenney.food.cup-coffee` | 108 | 0.10 × 0.06 × 0.13 | colormap |
| `kenney.food.cup-tea` | 144 | 0.11 × 0.09 × 0.13 | colormap |
| `kenney.food.cutting-board` | 120 | 0.26 × 0.03 × 0.37 | colormap |
| `kenney.food.fries` | 564 | 0.08 × 0.18 × 0.12 | colormap |
| `kenney.food.mug` | 232 | 0.15 × 0.12 × 0.13 | colormap |
| `kenney.food.plate` | 140 | 0.40 × 0.04 × 0.40 | colormap |
| `kenney.furniture.bathroomSink` | 316 | 0.54 × 0.90 × 0.46 | _defaultMat, carpetWhite, metalLight |
| `kenney.furniture.bathtub` | 602 | 1.90 × 0.67 × 0.90 | carpetWhite, metalDark, metalLight |
| `kenney.furniture.bedBunk` | 580 | 0.91 × 1.36 × 1.75 | carpet, carpetWhite, wood |
| `kenney.furniture.bedDouble` | 264 | 1.53 × 0.60 × 1.80 | carpet, carpetWhite, metal, wood |
| `kenney.furniture.bedSingle` | 214 | 0.91 × 0.60 × 1.80 | carpet, carpetWhite, metal, wood |
| `kenney.furniture.bench` | 170 | 0.64 × 0.75 × 0.32 | wood |
| `kenney.furniture.bookcaseClosed` | 372 | 0.64 × 1.36 × 0.40 | wood |
| `kenney.furniture.bookcaseClosedWide` | 372 | 1.28 × 1.26 × 0.40 | wood |
| `kenney.furniture.bookcaseOpen` | 320 | 0.64 × 1.41 × 0.40 | wood |
| `kenney.furniture.books` | 62 | 0.24 × 0.17 × 0.15 | carpetDarker, carpetWhite, metal, plant |
| `kenney.furniture.cabinetTelevision` | 154 | 1.28 × 0.50 × 0.40 | wood |
| `kenney.furniture.cardboardBoxClosed` | 60 | 0.34 × 0.45 × 0.34 | wood, woodDark |
| `kenney.furniture.cardboardBoxOpen` | 60 | 0.59 × 0.45 × 0.34 | wood, woodDark |
| `kenney.furniture.chair` | 170 | 0.32 × 0.75 × 0.32 | wood |
| `kenney.furniture.chairDesk` | 588 | 0.54 × 0.97 × 0.50 | carpet, metalMedium |
| `kenney.furniture.chairRounded` | 280 | 0.32 × 0.73 × 0.32 | wood |
| `kenney.furniture.coatRack` | 132 | 0.72 × 0.45 × 0.21 | metalMedium, wood |
| `kenney.furniture.desk` | 198 | 1.18 × 0.61 × 0.63 | metal, wood |
| `kenney.furniture.deskCorner` | 250 | 1.56 × 0.61 × 1.56 | metal, wood |
| `kenney.furniture.doorwayFront` | 156 | 0.78 × 1.61 × 0.18 | carpetWhite, glass, metal, metalDark |
| `kenney.furniture.doorwayOpen` | 28 | 0.78 × 1.61 × 0.14 | wood |
| `kenney.furniture.floorFull` | 12 | 1.60 × 0.08 × 1.60 | wood |
| `kenney.furniture.kitchenBar` | 76 | 0.69 × 0.67 × 0.34 | metal, wood, woodDark |
| `kenney.furniture.kitchenCabinet` | 114 | 0.69 × 0.72 × 0.72 | metal, wood, woodDark |
| `kenney.furniture.kitchenFridge` | 250 | 0.69 × 1.47 × 0.47 | glass, metal, metalDark, metalLight |
| `kenney.furniture.kitchenSink` | 318 | 0.69 × 0.78 × 0.72 | _defaultMat, metal, metalDark, metalLight |
| `kenney.furniture.kitchenStove` | 830 | 0.69 × 0.72 × 0.72 | carpetWhite, glass, metal, metalDark |
| `kenney.furniture.lampRoundFloor` | 76 | 0.24 × 1.38 × 0.28 | lamp, metal |
| `kenney.furniture.lampRoundTable` | 76 | 0.24 × 0.50 × 0.28 | lamp, metal |
| `kenney.furniture.lampSquareFloor` | 60 | 0.19 × 1.38 × 0.19 | lamp, metal |
| `kenney.furniture.loungeChair` | 128 | 0.78 × 0.74 × 0.66 | carpet, wood |
| `kenney.furniture.loungeSofa` | 128 | 1.57 × 0.74 × 0.66 | carpet, wood |
| `kenney.furniture.pillow` | 50 | 0.37 × 0.35 × 0.14 | carpet |
| `kenney.furniture.plantSmall1` | 102 | 0.15 × 0.22 × 0.15 | plant, wood |
| `kenney.furniture.plantSmall2` | 158 | 0.15 × 0.22 × 0.15 | plant, wood |
| `kenney.furniture.pottedPlant` | 60 | 0.34 × 1.05 × 0.39 | plant, wood, woodDark |
| `kenney.furniture.radio` | 432 | 0.50 × 0.36 × 0.16 | metal, metalMedium, wood |
| `kenney.modular-buildings.building-corner-window` | 32 | 1.00 × 0.62 × 1.00 | colormap |
| `kenney.modular-buildings.building-steps-narrow` | 74 | 1.00 × 0.84 × 1.20 | colormap |
| `kenney.modular-buildings.building-steps-wide` | 82 | 1.00 × 0.84 × 1.20 | colormap |
| `kenney.modular-buildings.building-window` | 28 | 1.00 × 0.62 × 1.00 | colormap |
| `kenney.modular-buildings.building-window-large` | 28 | 1.00 × 0.62 × 1.00 | colormap |
| `kenney.modular-buildings.door-brown` | 28 | 0.25 × 0.50 × 0.05 | colormap |
| `kenney.modular-buildings.door-white` | 28 | 0.25 × 0.50 × 0.05 | colormap |
| `kenney.modular-buildings.roof-flat-center` | 12 | 1.00 × 0.11 × 1.00 | colormap |
| `kenney.nature.bridge_wood` | 220 | 1.04 × 0.40 × 1.04 | stone, wood, woodBark |
| `kenney.nature.campfire_logs` | 112 | 0.29 × 0.06 × 0.29 | wood, woodDark |
| `kenney.nature.canoe` | 200 | 0.30 × 0.18 × 1.15 | leafsFall, wood |
| `kenney.nature.flower_redA` | 76 | 0.16 × 0.29 × 0.18 | colorRed, grass |
| `kenney.nature.grass_large` | 224 | 0.41 × 0.25 × 0.41 | grass |
| `kenney.nature.log` | 200 | 0.23 × 0.17 × 0.71 | woodBark, woodInner |
| `kenney.nature.log_large` | 96 | 1.00 × 0.42 × 0.55 | woodBark, woodInner |
| `kenney.nature.log_stack` | 184 | 0.42 × 0.35 × 0.71 | woodBark, woodInner |
| `kenney.nature.mushroom_red` | 48 | 0.17 × 0.20 × 0.20 | _defaultMat, colorRed |
| `kenney.nature.plant_bushLarge` | 60 | 0.37 × 0.24 × 0.34 | grass |
| `kenney.nature.rock_largeA` | 80 | 0.79 × 0.26 × 1.01 | dirt, grass |
| `kenney.nature.rock_largeC` | 72 | 1.06 × 0.32 × 1.02 | dirt, grass |
| `kenney.nature.rock_smallA` | 16 | 0.36 × 0.19 × 0.36 | dirt, grass |
| `kenney.retro-urban.detail-awning-small` | 24 | 0.60 × 0.28 × 0.30 | roof |
| `kenney.retro-urban.detail-awning-wide` | 24 | 1.00 × 0.28 × 0.30 | roof |
| `kenney.retro-urban.detail-barrier-type-a` | 44 | 0.43 × 0.40 × 0.13 | metal, signs |
| `kenney.retro-urban.detail-bench` | 84 | 0.60 × 0.41 × 0.32 | metal, planks |
| `kenney.retro-urban.detail-dumpster-closed` | 22 | 0.60 × 0.55 × 0.45 | roof, wall, wall_metal |
| `kenney.retro-urban.detail-dumpster-open` | 24 | 0.60 × 0.55 × 0.48 | dirt, roof, wall, wall_metal |
| `kenney.retro-urban.detail-light-double` | 96 | 0.09 × 0.96 × 0.44 | metal |
| `kenney.retro-urban.detail-light-single` | 68 | 0.09 × 0.96 × 0.26 | metal |
| `kenney.retro-urban.detail-light-traffic` | 114 | 0.16 × 1.04 × 0.58 | metal, roof |
| `kenney.retro-urban.door-type-a` | 26 | 0.40 × 0.63 × 0.05 | doors, metal |
| `kenney.retro-urban.grass` | 2 | 1.00 × 0.00 × 1.00 | grass |
| `kenney.retro-urban.grass-hill` | 2 | 1.00 × 0.50 × 1.00 | grass |
| `kenney.retro-urban.pallet` | 84 | 1.00 × 0.15 × 1.00 | planks |
| `kenney.retro-urban.pallet-small` | 60 | 0.50 × 0.15 × 0.57 | planks |
| `kenney.retro-urban.planks` | 36 | 1.13 × 0.10 × 0.57 | planks |
| `kenney.retro-urban.road-asphalt-corner` | 50 | 2.00 × 0.05 × 2.00 | asphalt, concreteSmooth |
| `kenney.retro-urban.road-asphalt-damaged` | 24 | 1.00 × 0.05 × 1.00 | asphalt, concreteSmooth |
| `kenney.retro-urban.road-asphalt-side` | 12 | 1.00 × 0.05 × 1.00 | asphalt, concreteSmooth |
| `kenney.retro-urban.road-asphalt-straight` | 22 | 1.00 × 0.05 × 2.00 | asphalt, concreteSmooth |
| `kenney.retro-urban.road-dirt-corner` | 50 | 2.00 × 0.05 × 2.00 | concrete, concreteSmooth, dirt |
| `kenney.retro-urban.road-dirt-damaged` | 24 | 1.00 × 0.05 × 1.00 | concrete, dirt |
| `kenney.retro-urban.road-dirt-straight` | 22 | 1.00 × 0.05 × 2.00 | concrete, dirt |
| `kenney.retro-urban.tree-large` | 16 | 1.30 × 1.70 × 1.30 | treeA |
| `kenney.retro-urban.tree-park-large` | 76 | 1.04 × 1.46 × 1.04 | concreteSmooth, dirt, treeA |
| `kenney.retro-urban.tree-shrub` | 32 | 0.78 × 0.30 × 0.78 | treeA |
| `kenney.retro-urban.tree-small` | 16 | 0.78 × 0.30 × 0.78 | treeA |
| `kenney.retro-urban.wall-a-door` | 36 | 1.00 × 1.00 × 1.00 | concrete, doors, metal, wall_lines |
| `kenney.retro-urban.wall-a-flat` | 2 | 1.00 × 1.00 × 0.00 | wall_lines |
| `kenney.retro-urban.wall-a-window` | 36 | 1.00 × 1.00 × 1.00 | concrete, metal, wall_lines, windows |

</details>

<!-- END:library -->
