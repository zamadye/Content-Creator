# KALIBRASI MATERIAL DI CAHAYA NETRAL — langkah 29

Sebelum ini, satu-satunya bukti visual material adalah thumbnail katalog yang
memakai satu setup cahaya "cantik" (lampu hangat, ambient kebiruan, vignette).
Itu bagus untuk katalog, buruk untuk kalibrasi: material gelap bisa terlihat
terang karena lampunya, dan sebaliknya.

`studio-forge/dev_materials.py` merender **setiap material sebagai bola** di
bawah cahaya netral dan mengukur empat angka dari data aslinya:

| angka | cara ambil |
|---|---|
| albedo | luminans rata-rata tekstur baseColor (Rec.709) |
| roughness / metallic | rata-rata kanal G / B tekstur ORM |
| render | luminans bola hasil render, diukur hanya pada piksel bola |
| status | `ok` · `terlalu gelap` (< 0,035) · `terlalu terang` (> 0,90) · `emisi` |

Setup cahaya netral (dipilih supaya angka bisa dibandingkan antar-material):
satu lampu `(1,0; 0,98; 0,96)` dari kiri-atas-depan, ambient abu netral
`(0,45)` tanpa warna langit, exposure 1,0, tanpa vignette, tanpa grading,
latar abu `#3a3d42`.

## Hasil

<!-- BEGIN:materials -->

| aset | material | albedo | roughness | metallic | render | status |
|---|---|---|---|---|---|---|
| `building.house.kos` | floor | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `building.house.kos` | wall-plaster | 0.599 | 0.928 | 0.003 | 0.653 | ok |
| `building.house.kos` | cut-wood | 0.261 | 0.849 | 0.004 | 0.309 | ok |
| `building.house.kos` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `building.house.kos` | brick | 0.393 | 0.89 | 0.005 | 0.435 | ok |
| `building.house.kos` | roof | 0.479 | 0.538 | 0.825 | 0.576 | ok |
| `building.house.kos` | lamp | 0.051 | 0.35 | 0.001 | 0.082 | emisi |
| `building.house.old` | floor | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `building.house.old` | wall-plaster | 0.586 | 0.928 | 0.003 | 0.647 | ok |
| `building.house.old` | cut-wood | 0.261 | 0.849 | 0.004 | 0.309 | ok |
| `building.house.old` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `building.house.old` | brick | 0.393 | 0.89 | 0.005 | 0.435 | ok |
| `building.house.old` | roof-tile | 0.287 | 0.879 | 0.003 | 0.337 | ok |
| `building.house.village` | floor | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `building.house.village` | wall-wood | 0.289 | 0.849 | 0.003 | 0.344 | ok |
| `building.house.village` | cut-wood | 0.261 | 0.849 | 0.004 | 0.309 | ok |
| `building.house.village` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `building.house.village` | beam-wood | 0.249 | 0.846 | 0.004 | 0.298 | ok |
| `building.house.village` | roof | 0.479 | 0.538 | 0.825 | 0.576 | ok |
| `building.industrial.warehouse` | floor | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `building.industrial.warehouse` | steel | 0.271 | 0.565 | 0.364 | 0.331 | ok |
| `building.industrial.warehouse` | wall-steel | 0.432 | 0.556 | 0.793 | 0.531 | ok |
| `building.industrial.warehouse` | roof | 0.479 | 0.538 | 0.825 | 0.576 | ok |
| `building.shop.warung` | floor | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `building.shop.warung` | wall-wood | 0.289 | 0.849 | 0.003 | 0.344 | ok |
| `building.shop.warung` | cut-wood | 0.261 | 0.849 | 0.004 | 0.309 | ok |
| `building.shop.warung` | beam-wood | 0.249 | 0.846 | 0.004 | 0.298 | ok |
| `building.shop.warung` | roof | 0.479 | 0.538 | 0.825 | 0.576 | ok |
| `building.shop.warung` | lamp | 0.051 | 0.349 | 0.0 | 0.083 | emisi |
| `kit.floor.tile` | floor | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `kit.wall.door` | wall-wood | 0.289 | 0.849 | 0.003 | 0.344 | ok |
| `kit.wall.door` | cut-wood | 0.261 | 0.849 | 0.004 | 0.309 | ok |
| `kit.wall.plain` | wall-wood | 0.289 | 0.849 | 0.003 | 0.344 | ok |
| `kit.wall.window` | wall-wood | 0.289 | 0.849 | 0.003 | 0.344 | ok |
| `kit.wall.window` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `kit.wall.window` | beam-wood | 0.249 | 0.846 | 0.004 | 0.298 | ok |
| `char.female-dewasa` | skin | 0.414 | 0.539 | 0.004 | 0.552 | ok |
| `char.female-dewasa` | cloth-namuhekam_male_polo_shirt | 0.545 | 0.831 | 0.003 | 0.722 | ok |
| `char.female-dewasa` | cloth-cortu_cargo_pants | 0.169 | 0.771 | 0.001 | 0.180 | ok |
| `char.female-dewasa` | cloth-shoes01 | 0.103 | 0.762 | 0.002 | 0.162 | ok |
| `char.female-dewasa` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `char.female-dewasa` | iris-L | 0.223 | 0.226 | 0.0 | 0.205 | ok |
| `char.female-dewasa` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `char.female-dewasa` | iris-R | 0.223 | 0.226 | 0.0 | 0.205 | ok |
| `char.female-dewasa` | hair | 0.066 | 0.647 | 0.021 | 0.092 | ok |
| `char.female-dewasa` | hair-long | 0.066 | 0.647 | 0.021 | 0.092 | ok |
| `char.female-lansia` | skin | 0.392 | 0.539 | 0.004 | 0.535 | ok |
| `char.female-lansia` | cloth-namuhekam_male_polo_shirt | 0.487 | 0.831 | 0.003 | 0.668 | ok |
| `char.female-lansia` | cloth-cortu_cargo_pants | 0.151 | 0.771 | 0.001 | 0.161 | ok |
| `char.female-lansia` | cloth-shoes01 | 0.093 | 0.762 | 0.002 | 0.146 | ok |
| `char.female-lansia` | sclera-L | 0.820 | 0.33 | 0.003 | 0.742 | ok |
| `char.female-lansia` | iris-L | 0.217 | 0.226 | 0.0 | 0.204 | ok |
| `char.female-lansia` | sclera-R | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `char.female-lansia` | iris-R | 0.217 | 0.226 | 0.0 | 0.204 | ok |
| `char.female-lansia` | hair | 0.517 | 0.647 | 0.021 | 0.685 | ok |
| `char.female-lansia` | hair-long | 0.517 | 0.647 | 0.021 | 0.686 | ok |
| `char.male-dewasa-polo` | skin | 0.374 | 0.539 | 0.004 | 0.522 | ok |
| `char.male-dewasa-polo` | cloth-namuhekam_male_polo_shirt | 0.581 | 0.831 | 0.003 | 0.742 | ok |
| `char.male-dewasa-polo` | cloth-cortu_cargo_pants | 0.180 | 0.771 | 0.001 | 0.193 | ok |
| `char.male-dewasa-polo` | cloth-shoes01 | 0.110 | 0.762 | 0.002 | 0.174 | ok |
| `char.male-dewasa-polo` | sclera-L | 0.820 | 0.33 | 0.003 | 0.739 | ok |
| `char.male-dewasa-polo` | iris-L | 0.212 | 0.225 | 0.0 | 0.202 | ok |
| `char.male-dewasa-polo` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-dewasa-polo` | iris-R | 0.212 | 0.226 | 0.0 | 0.202 | ok |
| `char.male-dewasa-polo` | hair | 0.062 | 0.647 | 0.021 | 0.089 | ok |
| `char.male-lansia-kemeja` | skin | 0.382 | 0.539 | 0.004 | 0.525 | ok |
| `char.male-lansia-kemeja` | cloth-namuhekam_male_polo_shirt | 0.499 | 0.831 | 0.003 | 0.678 | ok |
| `char.male-lansia-kemeja` | cloth-cortu_cargo_pants | 0.155 | 0.771 | 0.001 | 0.165 | ok |
| `char.male-lansia-kemeja` | cloth-shoes01 | 0.095 | 0.762 | 0.002 | 0.150 | ok |
| `char.male-lansia-kemeja` | sclera-L | 0.820 | 0.33 | 0.003 | 0.740 | ok |
| `char.male-lansia-kemeja` | iris-L | 0.215 | 0.225 | 0.0 | 0.203 | ok |
| `char.male-lansia-kemeja` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `char.male-lansia-kemeja` | iris-R | 0.215 | 0.226 | 0.0 | 0.203 | ok |
| `char.male-lansia-kemeja` | hair | 0.473 | 0.647 | 0.021 | 0.646 | ok |
| `char.male-muda-jaket` | skin | 0.394 | 0.539 | 0.004 | 0.536 | ok |
| `char.male-muda-jaket` | cloth-male_casualsuit05 | 0.129 | 0.765 | 0.003 | 0.264 | ok |
| `char.male-muda-jaket` | cloth-shoes01 | 0.107 | 0.762 | 0.002 | 0.169 | ok |
| `char.male-muda-jaket` | sclera-L | 0.820 | 0.33 | 0.003 | 0.740 | ok |
| `char.male-muda-jaket` | iris-L | 0.218 | 0.226 | 0.0 | 0.204 | ok |
| `char.male-muda-jaket` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-muda-jaket` | iris-R | 0.218 | 0.226 | 0.0 | 0.204 | ok |
| `char.male-muda-jaket` | hair | 0.047 | 0.647 | 0.021 | 0.076 | ok |
| `char.male-pekerja` | skin | 0.330 | 0.539 | 0.004 | 0.476 | ok |
| `char.male-pekerja` | cloth-male_casualsuit05 | 0.110 | 0.765 | 0.003 | 0.229 | ok |
| `char.male-pekerja` | cloth-shoes01 | 0.092 | 0.762 | 0.002 | 0.144 | ok |
| `char.male-pekerja` | sclera-L | 0.820 | 0.33 | 0.003 | 0.739 | ok |
| `char.male-pekerja` | iris-L | 0.200 | 0.225 | 0.001 | 0.198 | ok |
| `char.male-pekerja` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-pekerja` | iris-R | 0.200 | 0.226 | 0.0 | 0.198 | ok |
| `char.male-pekerja` | hair | 0.044 | 0.647 | 0.021 | 0.073 | ok |
| `entity.child` | skin | 0.496 | 0.539 | 0.005 | 0.605 | ok |
| `entity.child` | sclera-L | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `entity.child` | iris-L | 0.166 | 0.226 | 0.0 | 0.129 | ok |
| `entity.child` | sclera-R | 0.820 | 0.33 | 0.003 | 0.746 | ok |
| `entity.child` | iris-R | 0.166 | 0.226 | 0.0 | 0.129 | ok |
| `entity.child` | shroud | 0.413 | 0.9 | 0.007 | 0.592 | ok |
| `entity.child` | hair | 0.079 | 0.647 | 0.021 | 0.105 | ok |
| `entity.pale-standing` | skin | 0.502 | 0.539 | 0.005 | 0.607 | ok |
| `entity.pale-standing` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `entity.pale-standing` | iris-L | 0.165 | 0.225 | 0.0 | 0.128 | ok |
| `entity.pale-standing` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `entity.pale-standing` | iris-R | 0.165 | 0.226 | 0.0 | 0.128 | ok |
| `entity.pale-standing` | shroud | 0.413 | 0.9 | 0.007 | 0.592 | ok |
| `entity.pale-standing` | hair | 0.100 | 0.647 | 0.021 | 0.128 | ok |
| `entity.shadow-crouch` | skin | 0.161 | 0.539 | 0.005 | 0.239 | ok |
| `entity.shadow-crouch` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `entity.shadow-crouch` | iris-L | 0.068 | 0.225 | 0.0 | 0.083 | ok |
| `entity.shadow-crouch` | sclera-R | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `entity.shadow-crouch` | iris-R | 0.068 | 0.226 | 0.0 | 0.083 | ok |
| `entity.shadow-crouch` | shroud | 0.413 | 0.9 | 0.007 | 0.592 | ok |
| `entity.tall-limbs` | skin | 0.504 | 0.539 | 0.004 | 0.607 | ok |
| `entity.tall-limbs` | sclera-L | 0.820 | 0.33 | 0.002 | 0.738 | ok |
| `entity.tall-limbs` | iris-L | 0.146 | 0.225 | 0.0 | 0.117 | ok |
| `entity.tall-limbs` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `entity.tall-limbs` | iris-R | 0.146 | 0.226 | 0.0 | 0.117 | ok |
| `entity.tall-limbs` | shroud | 0.413 | 0.9 | 0.007 | 0.592 | ok |
| `entity.veiled-seated` | skin | 0.508 | 0.539 | 0.005 | 0.610 | ok |
| `entity.veiled-seated` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `entity.veiled-seated` | iris-L | 0.178 | 0.226 | 0.0 | 0.139 | ok |
| `entity.veiled-seated` | sclera-R | 0.820 | 0.33 | 0.002 | 0.744 | ok |
| `entity.veiled-seated` | iris-R | 0.178 | 0.226 | 0.0 | 0.139 | ok |
| `entity.veiled-seated` | shroud | 0.413 | 0.9 | 0.007 | 0.592 | ok |
| `entity.veiled-seated` | veil | 0.473 | 0.9 | 0.007 | 0.663 | ok |
| `nature.bush.fern` | foliage-#35502c | 0.225 | 0.8 | 0.005 | 0.378 | ok |
| `nature.bush.fern` | foliage-#43602f | 0.269 | 0.8 | 0.005 | 0.317 | ok |
| `nature.grass.patch` | foliage-#4d6631 | 0.289 | 0.8 | 0.005 | 0.457 | ok |
| `nature.grass.patch` | foliage-#425a2c | 0.258 | 0.8 | 0.005 | 0.396 | ok |
| `nature.log.fallen` | bark | 0.220 | 0.931 | 0.003 | 0.253 | ok |
| `nature.log.fallen` | cut-wood | 0.261 | 0.85 | 0.004 | 0.312 | ok |
| `nature.rock.boulder` | stone | 0.396 | 0.9 | 0.004 | 0.476 | ok |
| `nature.tree.banana` | stalk | 0.307 | 0.8 | 0.005 | 0.414 | ok |
| `nature.tree.banana` | foliage-#4e6b2f | 0.308 | 0.8 | 0.005 | 0.422 | ok |
| `nature.tree.banana` | foliage-#5c7a38 | 0.326 | 0.8 | 0.005 | 0.553 | ok |
| `nature.tree.beringin` | bark | 0.347 | 0.931 | 0.002 | 0.431 | ok |
| `nature.tree.beringin` | foliage-#2f4a2a | 0.204 | 0.8 | 0.005 | 0.278 | ok |
| `nature.tree.beringin` | foliage-#3c5a30 | 0.252 | 0.8 | 0.005 | 0.413 | ok |
| `nature.tree.dead` | bark | 0.202 | 0.927 | 0.003 | 0.225 | ok |
| `nature.tree.karet` | bark | 0.307 | 0.93 | 0.002 | 0.366 | ok |
| `nature.tree.karet` | foliage-#3d5a30 | 0.250 | 0.8 | 0.005 | 0.348 | ok |
| `nature.tree.karet` | foliage-#4a6a38 | 0.303 | 0.8 | 0.005 | 0.468 | ok |
| `nature.tree.palm` | bark | 0.339 | 0.929 | 0.002 | 0.410 | ok |
| `nature.tree.palm` | foliage-#47632f | 0.279 | 0.8 | 0.005 | 0.455 | ok |
| `nature.tree.palm` | foliage-#3d5729 | 0.229 | 0.8 | 0.005 | 0.395 | ok |
| `prop.bed` | wood-dark | 0.191 | 0.851 | 0.004 | 0.224 | ok |
| `prop.bed` | fabric-warm | 0.356 | 0.9 | 0.005 | 0.432 | ok |
| `prop.bed` | fabric | 0.302 | 0.9 | 0.005 | 0.365 | ok |
| `prop.chair.wood` | wood | 0.290 | 0.85 | 0.004 | 0.349 | ok |
| `prop.chair.wood` | wood-dark | 0.191 | 0.851 | 0.004 | 0.224 | ok |
| `prop.clothesline` | wood-dark | 0.191 | 0.851 | 0.004 | 0.224 | ok |
| `prop.clothesline` | rust | 0.272 | 0.566 | 0.367 | 0.331 | ok |
| `prop.clothesline` | canvas | 0.662 | 0.9 | 0.007 | 0.682 | ok |
| `prop.clothesline` | burlap | 0.429 | 0.901 | 0.007 | 0.506 | ok |
| `prop.clothesline` | fabric-warm | 0.356 | 0.9 | 0.005 | 0.432 | ok |
| `prop.crate` | wood | 0.290 | 0.85 | 0.004 | 0.349 | ok |
| `prop.crate` | wood-dark | 0.191 | 0.851 | 0.004 | 0.224 | ok |
| `prop.drum` | rust | 0.272 | 0.566 | 0.367 | 0.331 | ok |
| `prop.drum` | metal | 0.332 | 0.565 | 0.365 | 0.413 | ok |
| `prop.drum` | steel-bare | 0.545 | 0.564 | 0.365 | 0.618 | ok |
| `prop.jerrycan` | red-paint | 0.233 | 0.562 | 0.362 | 0.268 | ok |
| `prop.jerrycan` | metal | 0.332 | 0.565 | 0.365 | 0.413 | ok |
| `prop.lamp.teplok` | brass | 0.458 | 0.56 | 0.36 | 0.543 | ok |
| `prop.lamp.teplok` | lamp-glow | 0.051 | 0.349 | 0.0 | 0.084 | emisi |
| `prop.lamp.teplok` | glass-clear | 0.601 | 0.163 | 0.002 | 0.650 | ok |
| `prop.lamp.teplok` | metal | 0.332 | 0.565 | 0.365 | 0.412 | ok |
| `prop.sack` | burlap | 0.429 | 0.901 | 0.007 | 0.506 | ok |
| `prop.sack` | metal | 0.332 | 0.565 | 0.365 | 0.413 | ok |
| `prop.shelves.steel` | steel-bare | 0.545 | 0.564 | 0.365 | 0.626 | ok |
| `prop.shelves.steel` | wood | 0.290 | 0.85 | 0.004 | 0.349 | ok |
| `prop.shelves.steel` | burlap | 0.429 | 0.901 | 0.007 | 0.506 | ok |
| `prop.signboard` | sign-board | 0.430 | 0.714 | 0.053 | 0.509 | ok |
| `prop.signboard` | wood-dark | 0.191 | 0.851 | 0.004 | 0.224 | ok |
| `prop.stove` | red-paint | 0.233 | 0.562 | 0.362 | 0.268 | ok |
| `prop.stove` | metal | 0.332 | 0.565 | 0.365 | 0.413 | ok |
| `prop.stove` | steel-bare | 0.545 | 0.564 | 0.365 | 0.626 | ok |
| `prop.stove` | rust | 0.272 | 0.566 | 0.367 | 0.331 | ok |
| `prop.stove` | brass | 0.458 | 0.56 | 0.36 | 0.541 | ok |
| `prop.table.wood` | wood | 0.290 | 0.85 | 0.004 | 0.349 | ok |
| `prop.table.wood` | wood-dark | 0.191 | 0.851 | 0.004 | 0.224 | ok |
| `road.prop.powerpole` | pole | 0.267 | 0.932 | 0.003 | 0.311 | ok |
| `road.prop.powerpole` | crossarm | 0.211 | 0.855 | 0.006 | 0.226 | ok |
| `road.prop.powerpole` | insulator | 0.128 | 0.56 | 0.36 | 0.135 | ok |
| `road.prop.signpost` | metal | 0.320 | 0.563 | 0.363 | 0.396 | ok |
| `road.prop.signpost` | sign-board | 0.661 | 0.697 | 0.215 | 0.673 | ok |
| `road.prop.signpost` | wood | 0.272 | 0.849 | 0.006 | 0.327 | ok |
| `road.asphalt.cross` | asphalt | 0.230 | 0.846 | 0.006 | 0.262 | ok |
| `road.asphalt.cross` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.curve` | asphalt | 0.230 | 0.846 | 0.006 | 0.262 | ok |
| `road.asphalt.curve` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.straight` | asphalt | 0.230 | 0.846 | 0.006 | 0.262 | ok |
| `road.asphalt.straight` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.tjunction` | asphalt | 0.230 | 0.846 | 0.006 | 0.262 | ok |
| `road.asphalt.tjunction` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.wet` | asphalt | 0.205 | 0.662 | 0.005 | 0.237 | ok |
| `road.dirt.straight` | asphalt | 0.230 | 0.846 | 0.006 | 0.262 | ok |
| `road.dirt.straight` | soil | 0.137 | 0.8 | 0.002 | 0.147 | ok |
| `road.sidewalk.segment` | concrete | 0.658 | 0.898 | 0.005 | 0.682 | ok |
| `vehicle.motorcycle.bebek` | rubber | 0.052 | 0.901 | 0.007 | 0.063 | ok |
| `vehicle.motorcycle.bebek` | chrome | 0.651 | 0.566 | 0.365 | 0.691 | ok |
| `vehicle.motorcycle.bebek` | frame | 0.162 | 0.568 | 0.369 | 0.180 | ok |
| `vehicle.motorcycle.bebek` | paint | 0.277 | 0.565 | 0.367 | 0.339 | ok |
| `vehicle.motorcycle.bebek` | lamp-glass | 0.605 | 0.149 | 0.002 | 0.652 | emisi |
| `vehicle.motorcycle.bebek` | engine | 0.373 | 0.562 | 0.361 | 0.465 | ok |
| `vehicle.motorcycle.bebek` | seat | 0.087 | 0.699 | 0.002 | 0.098 | ok |
| `vehicle.motorcycle.bebek` | tail-light | 0.020 | 0.349 | 0.0 | 0.066 | emisi |
| `vehicle.pickup` | paint | 0.406 | 0.563 | 0.361 | 0.500 | ok |
| `vehicle.pickup` | car-glass | 0.601 | 0.165 | 0.002 | 0.654 | ok |
| `vehicle.pickup` | rust | 0.241 | 0.562 | 0.363 | 0.286 | ok |
| `vehicle.pickup` | rubber | 0.047 | 0.901 | 0.007 | 0.059 | ok |
| `vehicle.pickup` | chrome | 0.590 | 0.559 | 0.359 | 0.657 | ok |

<!-- END:materials -->

Gambar: `docs/material-calibration.png` (grid 8 kolom; label tiap bola berisi
nama material, albedo · roughness · luminans render; nama berwarna merah bila
di luar rentang).

## Cara memakai

```bash
npm run qc:materials                    # ukur + tulis tabel, gagal bila ada yang di luar rentang
./.venv/bin/python studio-forge/dev_materials.py --sheet docs/material-calibration.png
```

## Batas yang jujur

* Ini kalibrasi **albedo & konsistensi**, bukan pencocokan referensi foto:
  tidak ada colorimeter, tidak ada sampel spektral.
* Bola adalah geometri uji, bukan aset aslinya — tekstur yang bergantung pada
  UV (mis. garis papan) tampil berbeda di bola, tapi statistiknya tetap sah.
* Renderer-nya renderer perangkat lunak (`forge/render.py`), bukan WebGL:
  tidak ada tone mapping ACES browser, jadi angka `render` hanya untuk
  perbandingan antar-material, bukan prediksi warna final.
