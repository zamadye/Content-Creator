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
| `building.house.kos` | floor | 0.658 | 0.899 | 0.006 | 0.682 | ok |
| `building.house.kos` | wall-plaster | 0.600 | 0.929 | 0.004 | 0.655 | ok |
| `building.house.kos` | cut-wood | 0.261 | 0.849 | 0.004 | 0.310 | ok |
| `building.house.kos` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `building.house.kos` | brick | 0.394 | 0.89 | 0.005 | 0.441 | ok |
| `building.house.kos` | roof | 0.480 | 0.538 | 0.826 | 0.577 | ok |
| `building.house.kos` | lamp | 0.051 | 0.35 | 0.001 | 0.082 | emisi |
| `building.house.old` | floor | 0.658 | 0.899 | 0.006 | 0.682 | ok |
| `building.house.old` | wall-plaster | 0.587 | 0.929 | 0.004 | 0.649 | ok |
| `building.house.old` | cut-wood | 0.261 | 0.849 | 0.004 | 0.310 | ok |
| `building.house.old` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `building.house.old` | brick | 0.394 | 0.89 | 0.005 | 0.441 | ok |
| `building.house.old` | roof-tile | 0.287 | 0.88 | 0.003 | 0.338 | ok |
| `building.house.village` | floor | 0.658 | 0.899 | 0.006 | 0.682 | ok |
| `building.house.village` | wall-wood | 0.290 | 0.85 | 0.003 | 0.347 | ok |
| `building.house.village` | cut-wood | 0.261 | 0.849 | 0.004 | 0.310 | ok |
| `building.house.village` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `building.house.village` | beam-wood | 0.250 | 0.847 | 0.004 | 0.299 | ok |
| `building.house.village` | roof | 0.480 | 0.538 | 0.826 | 0.577 | ok |
| `building.industrial.warehouse` | floor | 0.658 | 0.899 | 0.006 | 0.682 | ok |
| `building.industrial.warehouse` | steel | 0.271 | 0.565 | 0.364 | 0.331 | ok |
| `building.industrial.warehouse` | wall-steel | 0.432 | 0.557 | 0.794 | 0.532 | ok |
| `building.industrial.warehouse` | roof | 0.480 | 0.538 | 0.826 | 0.577 | ok |
| `building.shop.warung` | floor | 0.658 | 0.899 | 0.006 | 0.682 | ok |
| `building.shop.warung` | wall-wood | 0.290 | 0.85 | 0.003 | 0.347 | ok |
| `building.shop.warung` | cut-wood | 0.261 | 0.849 | 0.004 | 0.310 | ok |
| `building.shop.warung` | beam-wood | 0.250 | 0.847 | 0.004 | 0.299 | ok |
| `building.shop.warung` | roof | 0.480 | 0.538 | 0.826 | 0.577 | ok |
| `building.shop.warung` | lamp | 0.051 | 0.349 | 0.0 | 0.083 | emisi |
| `kit.floor.tile` | floor | 0.658 | 0.899 | 0.006 | 0.682 | ok |
| `kit.wall.door` | wall-wood | 0.290 | 0.85 | 0.003 | 0.347 | ok |
| `kit.wall.door` | cut-wood | 0.261 | 0.849 | 0.004 | 0.310 | ok |
| `kit.wall.plain` | wall-wood | 0.290 | 0.85 | 0.003 | 0.347 | ok |
| `kit.wall.window` | wall-wood | 0.290 | 0.85 | 0.003 | 0.347 | ok |
| `kit.wall.window` | glass | 0.609 | 0.134 | 0.003 | 0.656 | ok |
| `kit.wall.window` | beam-wood | 0.250 | 0.847 | 0.004 | 0.299 | ok |
| `char.anak-besar-laki` | skin | 0.390 | 0.537 | 0.005 | 0.533 | ok |
| `char.anak-besar-laki` | cloth-shirt-short | 0.667 | 0.941 | 0.002 | 0.796 | ok |
| `char.anak-besar-laki` | cloth-shirt-short-trim | 0.574 | 0.922 | 0.0 | 0.734 | ok |
| `char.anak-besar-laki` | cloth-shirt-short-buttons | 0.138 | 0.922 | 0.0 | 0.174 | ok |
| `char.anak-besar-laki` | cloth-pants | 0.456 | 0.918 | 0.001 | 0.629 | ok |
| `char.anak-besar-laki` | cloth-pants-trim | 0.392 | 0.922 | 0.0 | 0.561 | ok |
| `char.anak-besar-laki` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.175 | ok |
| `char.anak-besar-laki` | sclera-L | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.anak-besar-laki` | iris-L | 0.217 | 0.225 | 0.001 | 0.203 | ok |
| `char.anak-besar-laki` | sclera-R | 0.820 | 0.33 | 0.003 | 0.746 | ok |
| `char.anak-besar-laki` | iris-R | 0.217 | 0.225 | 0.001 | 0.203 | ok |
| `char.anak-besar-laki` | hair | 0.055 | 0.647 | 0.022 | 0.082 | ok |
| `char.anak-besar-perempuan` | skin | 0.414 | 0.538 | 0.005 | 0.554 | ok |
| `char.anak-besar-perempuan` | cloth-shirt-short | 0.667 | 0.941 | 0.002 | 0.795 | ok |
| `char.anak-besar-perempuan` | cloth-shirt-short-trim | 0.574 | 0.922 | 0.0 | 0.734 | ok |
| `char.anak-besar-perempuan` | cloth-shirt-short-buttons | 0.138 | 0.922 | 0.0 | 0.174 | ok |
| `char.anak-besar-perempuan` | cloth-pants | 0.456 | 0.918 | 0.001 | 0.629 | ok |
| `char.anak-besar-perempuan` | cloth-pants-trim | 0.392 | 0.922 | 0.0 | 0.561 | ok |
| `char.anak-besar-perempuan` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.175 | ok |
| `char.anak-besar-perempuan` | sclera-L | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.anak-besar-perempuan` | iris-L | 0.225 | 0.226 | 0.001 | 0.206 | ok |
| `char.anak-besar-perempuan` | sclera-R | 0.820 | 0.33 | 0.003 | 0.746 | ok |
| `char.anak-besar-perempuan` | iris-R | 0.225 | 0.225 | 0.001 | 0.205 | ok |
| `char.anak-besar-perempuan` | hair | 0.057 | 0.647 | 0.022 | 0.084 | ok |
| `char.anak-besar-perempuan` | hair-long | 0.057 | 0.647 | 0.022 | 0.085 | ok |
| `char.anak-laki` | skin | 0.413 | 0.537 | 0.005 | 0.554 | ok |
| `char.anak-laki` | cloth-shirt-short | 0.667 | 0.941 | 0.002 | 0.796 | ok |
| `char.anak-laki` | cloth-shirt-short-trim | 0.574 | 0.922 | 0.0 | 0.734 | ok |
| `char.anak-laki` | cloth-shirt-short-buttons | 0.138 | 0.922 | 0.0 | 0.174 | ok |
| `char.anak-laki` | cloth-pants | 0.456 | 0.918 | 0.001 | 0.629 | ok |
| `char.anak-laki` | cloth-pants-trim | 0.392 | 0.922 | 0.0 | 0.561 | ok |
| `char.anak-laki` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.175 | ok |
| `char.anak-laki` | sclera-L | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `char.anak-laki` | iris-L | 0.224 | 0.225 | 0.001 | 0.205 | ok |
| `char.anak-laki` | sclera-R | 0.820 | 0.33 | 0.003 | 0.747 | ok |
| `char.anak-laki` | iris-R | 0.224 | 0.225 | 0.001 | 0.205 | ok |
| `char.anak-laki` | hair | 0.055 | 0.647 | 0.022 | 0.082 | ok |
| `char.anak-perempuan` | skin | 0.431 | 0.538 | 0.005 | 0.567 | ok |
| `char.anak-perempuan` | cloth-tunic | 0.421 | 0.919 | 0.001 | 0.567 | ok |
| `char.anak-perempuan` | cloth-tunic-trim | 0.361 | 0.922 | 0.0 | 0.496 | ok |
| `char.anak-perempuan` | cloth-shorts | 0.391 | 0.916 | 0.0 | 0.535 | ok |
| `char.anak-perempuan` | cloth-shorts-trim | 0.335 | 0.922 | 0.0 | 0.463 | ok |
| `char.anak-perempuan` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.176 | ok |
| `char.anak-perempuan` | sclera-L | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `char.anak-perempuan` | iris-L | 0.229 | 0.225 | 0.001 | 0.207 | ok |
| `char.anak-perempuan` | sclera-R | 0.820 | 0.33 | 0.003 | 0.747 | ok |
| `char.anak-perempuan` | iris-R | 0.229 | 0.225 | 0.001 | 0.207 | ok |
| `char.anak-perempuan` | hair | 0.057 | 0.647 | 0.022 | 0.084 | ok |
| `char.anak-perempuan` | hair-long | 0.057 | 0.647 | 0.022 | 0.085 | ok |
| `char.balita-laki` | skin | 0.416 | 0.537 | 0.005 | 0.558 | ok |
| `char.balita-laki` | cloth-shirt-short | 0.666 | 0.941 | 0.002 | 0.796 | ok |
| `char.balita-laki` | cloth-shirt-short-trim | 0.574 | 0.922 | 0.0 | 0.734 | ok |
| `char.balita-laki` | cloth-shirt-short-buttons | 0.138 | 0.922 | 0.0 | 0.174 | ok |
| `char.balita-laki` | cloth-pants | 0.456 | 0.918 | 0.001 | 0.629 | ok |
| `char.balita-laki` | cloth-pants-trim | 0.392 | 0.922 | 0.0 | 0.561 | ok |
| `char.balita-laki` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.176 | ok |
| `char.balita-laki` | sclera-L | 0.820 | 0.33 | 0.003 | 0.747 | ok |
| `char.balita-laki` | iris-L | 0.224 | 0.226 | 0.001 | 0.205 | ok |
| `char.balita-laki` | sclera-R | 0.820 | 0.33 | 0.003 | 0.748 | ok |
| `char.balita-laki` | iris-R | 0.224 | 0.225 | 0.001 | 0.205 | ok |
| `char.balita-laki` | hair | 0.048 | 0.647 | 0.022 | 0.076 | ok |
| `char.balita-perempuan` | skin | 0.435 | 0.538 | 0.005 | 0.569 | ok |
| `char.balita-perempuan` | cloth-tunic | 0.421 | 0.919 | 0.001 | 0.568 | ok |
| `char.balita-perempuan` | cloth-tunic-trim | 0.361 | 0.922 | 0.0 | 0.496 | ok |
| `char.balita-perempuan` | cloth-shorts | 0.391 | 0.916 | 0.0 | 0.535 | ok |
| `char.balita-perempuan` | cloth-shorts-trim | 0.335 | 0.922 | 0.0 | 0.463 | ok |
| `char.balita-perempuan` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.176 | ok |
| `char.balita-perempuan` | sclera-L | 0.820 | 0.33 | 0.003 | 0.747 | ok |
| `char.balita-perempuan` | iris-L | 0.230 | 0.225 | 0.001 | 0.207 | ok |
| `char.balita-perempuan` | sclera-R | 0.820 | 0.33 | 0.003 | 0.748 | ok |
| `char.balita-perempuan` | iris-R | 0.230 | 0.225 | 0.001 | 0.207 | ok |
| `char.balita-perempuan` | hair | 0.058 | 0.647 | 0.022 | 0.085 | ok |
| `char.balita-perempuan` | hair-long | 0.059 | 0.647 | 0.022 | 0.086 | ok |
| `char.female-dewasa` | skin | 0.414 | 0.539 | 0.005 | 0.554 | ok |
| `char.female-dewasa` | cloth-shirt-short | 0.825 | 0.953 | 0.001 | 0.858 | ok |
| `char.female-dewasa` | cloth-shirt-short-trim | 0.711 | 0.922 | 0.0 | 0.813 | ok |
| `char.female-dewasa` | cloth-shirt-short-buttons | 0.172 | 0.922 | 0.0 | 0.225 | ok |
| `char.female-dewasa` | cloth-pants | 0.625 | 0.929 | 0.001 | 0.771 | ok |
| `char.female-dewasa` | cloth-pants-trim | 0.524 | 0.922 | 0.0 | 0.700 | ok |
| `char.female-dewasa` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.female-dewasa` | sclera-L | 0.820 | 0.33 | 0.003 | 0.740 | ok |
| `char.female-dewasa` | iris-L | 0.223 | 0.225 | 0.001 | 0.205 | ok |
| `char.female-dewasa` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `char.female-dewasa` | iris-R | 0.223 | 0.226 | 0.0 | 0.205 | ok |
| `char.female-dewasa` | hair | 0.066 | 0.647 | 0.022 | 0.092 | ok |
| `char.female-dewasa` | hair-long | 0.066 | 0.647 | 0.022 | 0.092 | ok |
| `char.female-dewasa-daster` | skin | 0.414 | 0.539 | 0.005 | 0.554 | ok |
| `char.female-dewasa-daster` | cloth-tunic | 0.421 | 0.919 | 0.001 | 0.567 | ok |
| `char.female-dewasa-daster` | cloth-tunic-trim | 0.361 | 0.922 | 0.0 | 0.496 | ok |
| `char.female-dewasa-daster` | cloth-shorts | 0.391 | 0.916 | 0.0 | 0.535 | ok |
| `char.female-dewasa-daster` | cloth-shorts-trim | 0.335 | 0.922 | 0.0 | 0.463 | ok |
| `char.female-dewasa-daster` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.female-dewasa-daster` | sclera-L | 0.820 | 0.33 | 0.003 | 0.740 | ok |
| `char.female-dewasa-daster` | iris-L | 0.223 | 0.225 | 0.0 | 0.205 | ok |
| `char.female-dewasa-daster` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `char.female-dewasa-daster` | iris-R | 0.223 | 0.225 | 0.0 | 0.205 | ok |
| `char.female-dewasa-daster` | hair | 0.066 | 0.647 | 0.022 | 0.092 | ok |
| `char.female-dewasa-daster` | hair-long | 0.066 | 0.647 | 0.022 | 0.092 | ok |
| `char.female-lansia` | skin | 0.393 | 0.539 | 0.005 | 0.537 | ok |
| `char.female-lansia` | cloth-tunic | 0.421 | 0.919 | 0.001 | 0.567 | ok |
| `char.female-lansia` | cloth-tunic-trim | 0.361 | 0.922 | 0.0 | 0.496 | ok |
| `char.female-lansia` | cloth-shorts | 0.391 | 0.916 | 0.0 | 0.535 | ok |
| `char.female-lansia` | cloth-shorts-trim | 0.335 | 0.922 | 0.0 | 0.463 | ok |
| `char.female-lansia` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.female-lansia` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `char.female-lansia` | iris-L | 0.217 | 0.225 | 0.0 | 0.204 | ok |
| `char.female-lansia` | sclera-R | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `char.female-lansia` | iris-R | 0.217 | 0.225 | 0.0 | 0.203 | ok |
| `char.female-lansia` | hair | 0.518 | 0.647 | 0.022 | 0.693 | ok |
| `char.female-lansia` | hair-long | 0.518 | 0.647 | 0.022 | 0.693 | ok |
| `char.male-dewasa-kemeja` | skin | 0.375 | 0.538 | 0.005 | 0.525 | ok |
| `char.male-dewasa-kemeja` | cloth-shirt-long | 0.307 | 0.902 | 0.001 | 0.432 | ok |
| `char.male-dewasa-kemeja` | cloth-shirt-long-trim | 0.263 | 0.922 | 0.0 | 0.374 | ok |
| `char.male-dewasa-kemeja` | cloth-shirt-long-buttons | 0.063 | 0.922 | 0.0 | 0.084 | ok |
| `char.male-dewasa-kemeja` | cloth-pants | 0.240 | 0.894 | 0.001 | 0.338 | ok |
| `char.male-dewasa-kemeja` | cloth-pants-trim | 0.204 | 0.922 | 0.0 | 0.277 | ok |
| `char.male-dewasa-kemeja` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.male-dewasa-kemeja` | sclera-L | 0.820 | 0.33 | 0.003 | 0.739 | ok |
| `char.male-dewasa-kemeja` | iris-L | 0.212 | 0.225 | 0.0 | 0.202 | ok |
| `char.male-dewasa-kemeja` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-dewasa-kemeja` | iris-R | 0.212 | 0.226 | 0.0 | 0.202 | ok |
| `char.male-dewasa-kemeja` | hair | 0.063 | 0.647 | 0.022 | 0.089 | ok |
| `char.male-dewasa-polo` | skin | 0.375 | 0.538 | 0.005 | 0.525 | ok |
| `char.male-dewasa-polo` | cloth-shirt-short | 0.825 | 0.953 | 0.001 | 0.858 | ok |
| `char.male-dewasa-polo` | cloth-shirt-short-trim | 0.711 | 0.922 | 0.0 | 0.813 | ok |
| `char.male-dewasa-polo` | cloth-shirt-short-buttons | 0.172 | 0.922 | 0.0 | 0.225 | ok |
| `char.male-dewasa-polo` | cloth-pants | 0.625 | 0.929 | 0.001 | 0.771 | ok |
| `char.male-dewasa-polo` | cloth-pants-trim | 0.524 | 0.922 | 0.0 | 0.700 | ok |
| `char.male-dewasa-polo` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.male-dewasa-polo` | sclera-L | 0.820 | 0.33 | 0.003 | 0.739 | ok |
| `char.male-dewasa-polo` | iris-L | 0.212 | 0.225 | 0.0 | 0.202 | ok |
| `char.male-dewasa-polo` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-dewasa-polo` | iris-R | 0.212 | 0.225 | 0.0 | 0.202 | ok |
| `char.male-dewasa-polo` | hair | 0.063 | 0.647 | 0.022 | 0.089 | ok |
| `char.male-lansia-kemeja` | skin | 0.382 | 0.538 | 0.005 | 0.527 | ok |
| `char.male-lansia-kemeja` | cloth-shirt-long | 0.307 | 0.902 | 0.001 | 0.432 | ok |
| `char.male-lansia-kemeja` | cloth-shirt-long-trim | 0.263 | 0.922 | 0.0 | 0.374 | ok |
| `char.male-lansia-kemeja` | cloth-shirt-long-buttons | 0.063 | 0.922 | 0.0 | 0.084 | ok |
| `char.male-lansia-kemeja` | cloth-pants | 0.240 | 0.894 | 0.001 | 0.338 | ok |
| `char.male-lansia-kemeja` | cloth-pants-trim | 0.204 | 0.922 | 0.0 | 0.277 | ok |
| `char.male-lansia-kemeja` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.male-lansia-kemeja` | sclera-L | 0.820 | 0.33 | 0.003 | 0.739 | ok |
| `char.male-lansia-kemeja` | iris-L | 0.215 | 0.225 | 0.0 | 0.203 | ok |
| `char.male-lansia-kemeja` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-lansia-kemeja` | iris-R | 0.215 | 0.226 | 0.0 | 0.203 | ok |
| `char.male-lansia-kemeja` | hair | 0.473 | 0.647 | 0.022 | 0.654 | ok |
| `char.male-muda-jaket` | skin | 0.394 | 0.538 | 0.005 | 0.539 | ok |
| `char.male-muda-jaket` | cloth-shirt-long | 0.192 | 0.89 | 0.001 | 0.260 | ok |
| `char.male-muda-jaket` | cloth-shirt-long-trim | 0.164 | 0.922 | 0.0 | 0.212 | ok |
| `char.male-muda-jaket` | cloth-shirt-long-buttons | 0.039 | 0.922 | 0.0 | 0.064 | ok |
| `char.male-muda-jaket` | cloth-pants | 0.156 | 0.887 | 0.0 | 0.198 | ok |
| `char.male-muda-jaket` | cloth-pants-trim | 0.133 | 0.922 | 0.0 | 0.166 | ok |
| `char.male-muda-jaket` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.male-muda-jaket` | sclera-L | 0.820 | 0.33 | 0.003 | 0.740 | ok |
| `char.male-muda-jaket` | iris-L | 0.218 | 0.225 | 0.001 | 0.204 | ok |
| `char.male-muda-jaket` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `char.male-muda-jaket` | iris-R | 0.218 | 0.225 | 0.0 | 0.204 | ok |
| `char.male-muda-jaket` | hair | 0.048 | 0.647 | 0.022 | 0.076 | ok |
| `char.male-pekerja` | skin | 0.331 | 0.538 | 0.005 | 0.478 | ok |
| `char.male-pekerja` | cloth-shirt-long | 0.438 | 0.91 | 0.001 | 0.627 | ok |
| `char.male-pekerja` | cloth-shirt-long-trim | 0.375 | 0.922 | 0.0 | 0.543 | ok |
| `char.male-pekerja` | cloth-shirt-long-buttons | 0.094 | 0.922 | 0.0 | 0.116 | ok |
| `char.male-pekerja` | cloth-pants | 0.268 | 0.894 | 0.001 | 0.380 | ok |
| `char.male-pekerja` | cloth-pants-trim | 0.223 | 0.922 | 0.0 | 0.308 | ok |
| `char.male-pekerja` | cloth-shoes01 | 0.111 | 0.762 | 0.002 | 0.175 | ok |
| `char.male-pekerja` | sclera-L | 0.820 | 0.33 | 0.003 | 0.739 | ok |
| `char.male-pekerja` | iris-L | 0.200 | 0.225 | 0.001 | 0.198 | ok |
| `char.male-pekerja` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `char.male-pekerja` | iris-R | 0.200 | 0.225 | 0.0 | 0.198 | ok |
| `char.male-pekerja` | hair | 0.044 | 0.647 | 0.022 | 0.074 | ok |
| `char.remaja-laki` | skin | 0.394 | 0.538 | 0.005 | 0.540 | ok |
| `char.remaja-laki` | cloth-shirt-short | 0.667 | 0.941 | 0.002 | 0.795 | ok |
| `char.remaja-laki` | cloth-shirt-short-trim | 0.574 | 0.922 | 0.0 | 0.734 | ok |
| `char.remaja-laki` | cloth-shirt-short-buttons | 0.138 | 0.922 | 0.0 | 0.174 | ok |
| `char.remaja-laki` | cloth-pants | 0.456 | 0.918 | 0.001 | 0.629 | ok |
| `char.remaja-laki` | cloth-pants-trim | 0.392 | 0.922 | 0.0 | 0.561 | ok |
| `char.remaja-laki` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.175 | ok |
| `char.remaja-laki` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `char.remaja-laki` | iris-L | 0.218 | 0.225 | 0.001 | 0.204 | ok |
| `char.remaja-laki` | sclera-R | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `char.remaja-laki` | iris-R | 0.218 | 0.225 | 0.0 | 0.204 | ok |
| `char.remaja-laki` | hair | 0.059 | 0.647 | 0.022 | 0.086 | ok |
| `char.remaja-perempuan` | skin | 0.414 | 0.539 | 0.005 | 0.556 | ok |
| `char.remaja-perempuan` | cloth-shirt-short | 0.667 | 0.941 | 0.002 | 0.795 | ok |
| `char.remaja-perempuan` | cloth-shirt-short-trim | 0.574 | 0.922 | 0.0 | 0.734 | ok |
| `char.remaja-perempuan` | cloth-shirt-short-buttons | 0.138 | 0.922 | 0.0 | 0.174 | ok |
| `char.remaja-perempuan` | cloth-pants | 0.456 | 0.918 | 0.001 | 0.629 | ok |
| `char.remaja-perempuan` | cloth-pants-trim | 0.392 | 0.922 | 0.0 | 0.561 | ok |
| `char.remaja-perempuan` | cloth-shoes01 | 0.111 | 0.762 | 0.001 | 0.175 | ok |
| `char.remaja-perempuan` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `char.remaja-perempuan` | iris-L | 0.225 | 0.225 | 0.0 | 0.206 | ok |
| `char.remaja-perempuan` | sclera-R | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `char.remaja-perempuan` | iris-R | 0.225 | 0.225 | 0.0 | 0.206 | ok |
| `char.remaja-perempuan` | hair | 0.067 | 0.647 | 0.022 | 0.093 | ok |
| `char.remaja-perempuan` | hair-long | 0.067 | 0.647 | 0.022 | 0.093 | ok |
| `entity.child` | skin | 0.496 | 0.54 | 0.005 | 0.608 | ok |
| `entity.child` | sclera-L | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `entity.child` | iris-L | 0.166 | 0.226 | 0.0 | 0.129 | ok |
| `entity.child` | sclera-R | 0.820 | 0.33 | 0.003 | 0.746 | ok |
| `entity.child` | iris-R | 0.166 | 0.226 | 0.0 | 0.129 | ok |
| `entity.child` | shroud | 0.413 | 0.901 | 0.008 | 0.594 | ok |
| `entity.child` | hair | 0.080 | 0.647 | 0.022 | 0.105 | ok |
| `entity.pale-standing` | skin | 0.502 | 0.54 | 0.005 | 0.611 | ok |
| `entity.pale-standing` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `entity.pale-standing` | iris-L | 0.165 | 0.225 | 0.0 | 0.128 | ok |
| `entity.pale-standing` | sclera-R | 0.820 | 0.33 | 0.003 | 0.744 | ok |
| `entity.pale-standing` | iris-R | 0.165 | 0.226 | 0.0 | 0.128 | ok |
| `entity.pale-standing` | shroud | 0.413 | 0.901 | 0.008 | 0.594 | ok |
| `entity.pale-standing` | hair | 0.100 | 0.647 | 0.022 | 0.128 | ok |
| `entity.shadow-crouch` | skin | 0.161 | 0.54 | 0.005 | 0.239 | ok |
| `entity.shadow-crouch` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `entity.shadow-crouch` | iris-L | 0.068 | 0.225 | 0.0 | 0.083 | ok |
| `entity.shadow-crouch` | sclera-R | 0.820 | 0.33 | 0.003 | 0.745 | ok |
| `entity.shadow-crouch` | iris-R | 0.068 | 0.226 | 0.0 | 0.083 | ok |
| `entity.shadow-crouch` | shroud | 0.413 | 0.901 | 0.008 | 0.594 | ok |
| `entity.tall-limbs` | skin | 0.504 | 0.54 | 0.005 | 0.611 | ok |
| `entity.tall-limbs` | sclera-L | 0.820 | 0.33 | 0.002 | 0.738 | ok |
| `entity.tall-limbs` | iris-L | 0.146 | 0.225 | 0.0 | 0.117 | ok |
| `entity.tall-limbs` | sclera-R | 0.820 | 0.33 | 0.003 | 0.743 | ok |
| `entity.tall-limbs` | iris-R | 0.146 | 0.226 | 0.0 | 0.117 | ok |
| `entity.tall-limbs` | shroud | 0.413 | 0.901 | 0.008 | 0.594 | ok |
| `entity.veiled-seated` | skin | 0.508 | 0.54 | 0.005 | 0.613 | ok |
| `entity.veiled-seated` | sclera-L | 0.820 | 0.33 | 0.003 | 0.741 | ok |
| `entity.veiled-seated` | iris-L | 0.178 | 0.226 | 0.0 | 0.139 | ok |
| `entity.veiled-seated` | sclera-R | 0.820 | 0.33 | 0.002 | 0.744 | ok |
| `entity.veiled-seated` | iris-R | 0.178 | 0.226 | 0.0 | 0.139 | ok |
| `entity.veiled-seated` | shroud | 0.413 | 0.901 | 0.008 | 0.594 | ok |
| `entity.veiled-seated` | veil | 0.474 | 0.9 | 0.007 | 0.665 | ok |
| `nature.bush.fern` | foliage-#35502c | 0.226 | 0.801 | 0.005 | 0.379 | ok |
| `nature.bush.fern` | foliage-#43602f | 0.269 | 0.8 | 0.005 | 0.318 | ok |
| `nature.grass.patch` | foliage-#4d6631 | 0.289 | 0.801 | 0.005 | 0.458 | ok |
| `nature.grass.patch` | foliage-#425a2c | 0.258 | 0.8 | 0.005 | 0.396 | ok |
| `nature.log.fallen` | bark | 0.220 | 0.932 | 0.003 | 0.253 | ok |
| `nature.log.fallen` | cut-wood | 0.261 | 0.85 | 0.005 | 0.313 | ok |
| `nature.rock.boulder` | stone | 0.396 | 0.901 | 0.005 | 0.477 | ok |
| `nature.tree.banana` | stalk | 0.308 | 0.801 | 0.005 | 0.414 | ok |
| `nature.tree.banana` | foliage-#4e6b2f | 0.308 | 0.801 | 0.005 | 0.423 | ok |
| `nature.tree.banana` | foliage-#5c7a38 | 0.326 | 0.801 | 0.005 | 0.554 | ok |
| `nature.tree.beringin` | bark | 0.348 | 0.932 | 0.002 | 0.432 | ok |
| `nature.tree.beringin` | foliage-#2f4a2a | 0.204 | 0.801 | 0.005 | 0.278 | ok |
| `nature.tree.beringin` | foliage-#3c5a30 | 0.252 | 0.801 | 0.006 | 0.413 | ok |
| `nature.tree.dead` | bark | 0.202 | 0.927 | 0.003 | 0.225 | ok |
| `nature.tree.karet` | bark | 0.308 | 0.931 | 0.002 | 0.367 | ok |
| `nature.tree.karet` | foliage-#3d5a30 | 0.250 | 0.801 | 0.005 | 0.349 | ok |
| `nature.tree.karet` | foliage-#4a6a38 | 0.304 | 0.801 | 0.005 | 0.469 | ok |
| `nature.tree.palm` | bark | 0.340 | 0.93 | 0.002 | 0.411 | ok |
| `nature.tree.palm` | foliage-#47632f | 0.279 | 0.801 | 0.005 | 0.456 | ok |
| `nature.tree.palm` | foliage-#3d5729 | 0.229 | 0.801 | 0.005 | 0.396 | ok |
| `prop.bed` | wood-dark | 0.191 | 0.851 | 0.004 | 0.225 | ok |
| `prop.bed` | fabric-warm | 0.357 | 0.9 | 0.005 | 0.434 | ok |
| `prop.bed` | fabric | 0.303 | 0.901 | 0.005 | 0.366 | ok |
| `prop.chair.wood` | wood | 0.290 | 0.851 | 0.004 | 0.350 | ok |
| `prop.chair.wood` | wood-dark | 0.191 | 0.851 | 0.004 | 0.225 | ok |
| `prop.clothesline` | wood-dark | 0.191 | 0.851 | 0.004 | 0.225 | ok |
| `prop.clothesline` | rust | 0.273 | 0.567 | 0.368 | 0.331 | ok |
| `prop.clothesline` | canvas | 0.663 | 0.901 | 0.007 | 0.684 | ok |
| `prop.clothesline` | burlap | 0.430 | 0.901 | 0.008 | 0.507 | ok |
| `prop.clothesline` | fabric-warm | 0.357 | 0.9 | 0.005 | 0.434 | ok |
| `prop.crate` | wood | 0.290 | 0.851 | 0.004 | 0.350 | ok |
| `prop.crate` | wood-dark | 0.191 | 0.851 | 0.004 | 0.225 | ok |
| `prop.drum` | rust | 0.273 | 0.567 | 0.368 | 0.331 | ok |
| `prop.drum` | metal | 0.333 | 0.565 | 0.365 | 0.414 | ok |
| `prop.drum` | steel-bare | 0.545 | 0.565 | 0.365 | 0.618 | ok |
| `prop.jerrycan` | red-paint | 0.234 | 0.562 | 0.363 | 0.269 | ok |
| `prop.jerrycan` | metal | 0.333 | 0.565 | 0.365 | 0.414 | ok |
| `prop.lamp.teplok` | brass | 0.458 | 0.56 | 0.36 | 0.543 | ok |
| `prop.lamp.teplok` | lamp-glow | 0.051 | 0.349 | 0.0 | 0.084 | emisi |
| `prop.lamp.teplok` | glass-clear | 0.601 | 0.163 | 0.002 | 0.650 | ok |
| `prop.lamp.teplok` | metal | 0.333 | 0.565 | 0.365 | 0.413 | ok |
| `prop.sack` | burlap | 0.430 | 0.901 | 0.008 | 0.507 | ok |
| `prop.sack` | metal | 0.333 | 0.565 | 0.365 | 0.414 | ok |
| `prop.shelves.steel` | steel-bare | 0.545 | 0.565 | 0.365 | 0.626 | ok |
| `prop.shelves.steel` | wood | 0.290 | 0.851 | 0.004 | 0.350 | ok |
| `prop.shelves.steel` | burlap | 0.430 | 0.901 | 0.008 | 0.507 | ok |
| `prop.signboard` | sign-board | 0.431 | 0.714 | 0.054 | 0.512 | ok |
| `prop.signboard` | wood-dark | 0.191 | 0.851 | 0.004 | 0.225 | ok |
| `prop.stove` | red-paint | 0.234 | 0.562 | 0.363 | 0.269 | ok |
| `prop.stove` | metal | 0.333 | 0.565 | 0.365 | 0.414 | ok |
| `prop.stove` | steel-bare | 0.545 | 0.565 | 0.365 | 0.626 | ok |
| `prop.stove` | rust | 0.273 | 0.567 | 0.368 | 0.331 | ok |
| `prop.stove` | brass | 0.458 | 0.56 | 0.36 | 0.541 | ok |
| `prop.table.wood` | wood | 0.290 | 0.851 | 0.004 | 0.350 | ok |
| `prop.table.wood` | wood-dark | 0.191 | 0.851 | 0.004 | 0.225 | ok |
| `road.prop.powerpole` | pole | 0.268 | 0.932 | 0.003 | 0.312 | ok |
| `road.prop.powerpole` | crossarm | 0.211 | 0.855 | 0.006 | 0.226 | ok |
| `road.prop.powerpole` | insulator | 0.128 | 0.56 | 0.36 | 0.135 | ok |
| `road.prop.signpost` | metal | 0.320 | 0.563 | 0.363 | 0.396 | ok |
| `road.prop.signpost` | sign-board | 0.661 | 0.697 | 0.215 | 0.677 | ok |
| `road.prop.signpost` | wood | 0.272 | 0.849 | 0.006 | 0.327 | ok |
| `road.asphalt.cross` | asphalt | 0.231 | 0.847 | 0.006 | 0.264 | ok |
| `road.asphalt.cross` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.curve` | asphalt | 0.231 | 0.847 | 0.006 | 0.264 | ok |
| `road.asphalt.curve` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.straight` | asphalt | 0.231 | 0.847 | 0.006 | 0.264 | ok |
| `road.asphalt.straight` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.tjunction` | asphalt | 0.231 | 0.847 | 0.006 | 0.264 | ok |
| `road.asphalt.tjunction` | paint | 0.731 | 0.562 | 0.364 | 0.733 | ok |
| `road.asphalt.wet` | asphalt | 0.206 | 0.663 | 0.005 | 0.238 | ok |
| `road.dirt.straight` | asphalt | 0.231 | 0.847 | 0.006 | 0.264 | ok |
| `road.dirt.straight` | soil | 0.138 | 0.801 | 0.003 | 0.147 | ok |
| `road.sidewalk.segment` | concrete | 0.658 | 0.899 | 0.006 | 0.683 | ok |
| `vehicle.motorcycle.bebek` | rubber | 0.052 | 0.901 | 0.008 | 0.063 | ok |
| `vehicle.motorcycle.bebek` | chrome | 0.651 | 0.566 | 0.365 | 0.691 | ok |
| `vehicle.motorcycle.bebek` | frame | 0.162 | 0.568 | 0.369 | 0.180 | ok |
| `vehicle.motorcycle.bebek` | paint | 0.278 | 0.565 | 0.367 | 0.340 | ok |
| `vehicle.motorcycle.bebek` | lamp-glass | 0.605 | 0.149 | 0.002 | 0.652 | emisi |
| `vehicle.motorcycle.bebek` | engine | 0.373 | 0.562 | 0.361 | 0.465 | ok |
| `vehicle.motorcycle.bebek` | seat | 0.088 | 0.699 | 0.002 | 0.098 | ok |
| `vehicle.motorcycle.bebek` | tail-light | 0.020 | 0.349 | 0.0 | 0.066 | emisi |
| `vehicle.pickup` | paint | 0.407 | 0.563 | 0.362 | 0.500 | ok |
| `vehicle.pickup` | car-glass | 0.601 | 0.165 | 0.002 | 0.654 | ok |
| `vehicle.pickup` | rust | 0.241 | 0.562 | 0.363 | 0.286 | ok |
| `vehicle.pickup` | rubber | 0.047 | 0.902 | 0.008 | 0.059 | ok |
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
