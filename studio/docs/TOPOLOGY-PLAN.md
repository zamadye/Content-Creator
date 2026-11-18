# RENCANA TOPOLOGI PER ASET — Studio v2

Dokumen ini menutup **langkah 8 (Topology planning)** di
`docs/PIPELINE-AUDIT.md`. Sebelumnya keputusan "detail mana yang jadi geometri,
mana yang jadi tekstur" hanya ada di kepala: tercermin di kode, tidak pernah
ditulis, tidak pernah diukur, tidak pernah dijaga. Sekarang ada tiga hal:

1. **aturan** yang menyebut aset mana memakai strategi apa (bagian 1–3);
2. **anggaran** tri & tekstur per kategori dengan alasan (bagian 4);
3. **pagar otomatis** — `npm run qc:topology` mengukur tiap GLB, membandingkan
   dengan anggaran dan dengan registry, dan menolak dokumen yang basi.

Semua angka di tabel bagian 5 diukur dari isi GLB (`accessors`, `meshes`,
`images`), bukan disalin dari registry — justru kecocokan keduanya ikut diuji.

---

## 1. Prinsip

| prinsip | artinya di repo ini |
|---|---|
| **bentuk besar = geometri, detail kecil = tekstur** | kusen, kaki kursi, batang pohon, roda: geometri. Jahitan, serat kayu, pori kulit, marka aus: peta normal/ORM. |
| **silhouette dulu** | anggaran tri dibelanjakan di tepi bentuk yang terlihat dari kamera (tubuh, daun, kabin), bukan di permukaan datar. |
| **satu aset = beberapa primitif, satu material per primitif** | memudahkan batching; material ≠ primitif berarti draw call tambahan tanpa manfaat. |
| **statis = murah** | properti dan bangunan tidak beranimasi, jadi boleh digabung menjadi satu mesh tanpa risiko skinning. |
| **beranimasi = wajib punya tulang** | karakter & entitas: satu mesh ter-skinned, 163 tulang (+3 kain pada 5 entitas). |
| **UV selalu 0..1, tanpa UDIM** | tekstur per aset, bukan atlas lintas aset (lihat langkah 17, masih sebagian). |

## 2. Strategi per kategori (yang benar-benar dipakai kode)

| kategori | strategi geometri | detail lewat tekstur | sumber kode |
|---|---|---|---|
| `character` (6) | base mesh MakeHuman + `shape()` (bahu/dada/anggota/jaw/neck), pakaian sebagai lapisan ber-offset (kaus 0,062 · jaket 0,048 · celana 0,026) | UV paint kulit & kain 2048², jahitan/lipatan di normal map | `forge/character.py`, `forge/skin.py`, `forge/uvpaint.py`, `forge/skinpaint.py` |
| `entity` (5) | base MakeHuman yang dimodifikasi (proporsi, leher/torso) + shroud/veil + rantai kain 3 tulang | kain 2048², motif & lubang veil di alpha | `forge/entity.py`, `forge/character.py` (`CLOTH_CHAIN`) |
| `building` (9) | slab + balok kusen/pintu/atap dari primitif (`add_box`), pipa/tiang dari `add_tube`, lengkung dari `add_lathe` | papan, seng, plester: base + normal + ORM 512–1024 | `forge/env_building.py`, `forge/kit.py` |
| `road` (7) | slab tipis (`skip_faces=("y-",)`) + marka sebagai kotak 4 mm; belokan disusun dari segmen `_arc` | aspal basah/kering, retak: base + normal 512–1024 | `forge/env_road.py` |
| `nature` (9) | batang `add_tube` beradius menyusur; daun **kartu alpha** (`add_leaf_card`, `alpha_mode MASK`, cutoff 0,42) dan gumpalan `_blob` (elipsoid 10×16) | peta daun ber-alpha 512² (cutout) | `forge/env_nature.py`, `forge/tex.py` (`foliage`) |
| `prop` (14) | kotak/tabung; kursi & meja dari balok, lampu teplok/ember/jeriken/drum dari `add_lathe`, kabel dari `add_tube` | kayu, kaleng, kain: 512² | `forge/env_prop.py` |
| `vehicle` (2) | kabin & bak dari kotak, roda dari `add_lathe` + tapak dari torus tersegmen | cat, kaca, ban: 512² | `forge/env_vehicle.py` |

Catatan yang harus jujur: tidak ada *subdivision surface*, tidak ada sculpt,
dan tidak ada retopologi manual (langkah 13 = `—`). Topologi karakter adalah
topologi base MakeHuman apa adanya; detail halus memang tidak pernah dibuat
sebagai geometri, jadi tidak ada yang perlu di-bake dari high-poly.

## 3. Keputusan yang ditolak (dan alasannya)

| keputusan | alasan |
|---|---|
| LOD berjenjang (langkah 15) | target klip 1080p pendek, satu kamera, tanpa streaming; biaya memelihara 3 versi tiap aset tidak sebanding. Tetap ⛔, bukan karena lupa. |
| high→low baking (langkah 18) | tidak ada high-poly sumber; normal map dibuat prosedural dari noise (`tex.height_to_normal`). |
| atlasing lintas aset | aset dipakai terpisah-pisah di adegan berbeda; atlas akan memaksa semua aset dimuat bersama. |
| kartu daun ber-alpha cutout vs. geometri daun | 1 kartu = 2 tri vs. ~40 tri daun nyata; pada jarak kamera cerita ini tak terbedakan. |

## 4. Anggaran (dan dari mana angkanya)

Plafon = aset terbesar yang sudah ada **+ ruang 5–10 %**, dibulatkan ke angka
bulat. Angka ini bukan target artistik, tapi **pagar**: aset baru yang
melewatinya akan menggagalkan `npm run qc:topology` dan `npm run test:studio`.

| kategori | anggaran tri | anggaran tekstur | alasan |
|---|---|---|---|
| `character` | 46.000 | 2048 px | wajah & siluet dibaca di medium shot; kain dipotong dari mesh badan sehingga memakai resolusi badan; aset terbesar sekarang 45.991 dari 46.000 tri |
| `entity` | 34.000 | 2048 px | sosok berkain, lipatan harus terbaca; terbesar 32.554 |
| `building` | 3.000 | 1024 px | latar statis; terbesar 976 |
| `road` | 1.500 | 1024 px | permukaan datar; terbesar 576 |
| `nature` | 4.000 | 1024 px | dedaunan berulang; terbesar 3.144 |
| `prop` | 1.500 | 512 px | objek kecil; terbesar 1.020 |
| `vehicle` | 3.000 | 512 px | kendaraan latar; terbesar 2.544 |

**Anggaran satu shot: 120.000 tri** (semua aset yang tampil bersamaan). Shot
terberat sekarang **85.956 tri** (`warung-malam/duduk-02`: dua karakter + warung
+ meja + kursi + lampu) = **72 %** anggaran, jadi masih ada ruang untuk satu
aktor lagi atau pohon besar tanpa melewati pagar.

## 5. Tabel aset (dihasilkan otomatis)

Dijaga oleh tes: `npm run qc:topology` menolak dokumen bila satu baris pun
tidak cocok dengan isi GLB. `vert` = jumlah POSITION, `prim` = jumlah primitif,
`tex` = sisi tekstur terbesar, `pakai` = tri ÷ anggaran kategori.

<!-- BEGIN:assets -->

| aset | kat. | tri | vert | prim | mat | tex | tulang | anggaran | pakai |
|---|---|---|---|---|---|---|---|---|---|
| `building.house.kos` | building | 372 | 702 | 7 | 7 | 1024 | — | 3000 | 12% |
| `building.house.old` | building | 400 | 800 | 6 | 6 | 1024 | — | 3000 | 13% |
| `building.house.village` | building | 532 | 1064 | 6 | 6 | 1024 | — | 3000 | 18% |
| `building.industrial.warehouse` | building | 976 | 1952 | 4 | 4 | 512 | — | 3000 | 33% |
| `building.school.corridor` | building | 894 | 1788 | 9 | 9 | 512 | — | 3000 | 30% |
| `building.shop.warung` | building | 592 | 1124 | 6 | 6 | 1024 | — | 3000 | 20% |
| `char.anak-besar-laki` | character | 43411 | 24076 | 13 | 13 | 2048 | 163 | 46000 | 94% |
| `char.anak-besar-perempuan` | character | 41675 | 23128 | 13 | 13 | 2048 | 163 | 46000 | 91% |
| `char.anak-laki` | character | 45991 | 25527 | 13 | 13 | 2048 | 163 | 46000 | 100% |
| `char.anak-perempuan` | character | 41369 | 22904 | 12 | 12 | 2048 | 163 | 46000 | 90% |
| `char.balita-laki` | character | 42703 | 23668 | 13 | 13 | 2048 | 163 | 46000 | 93% |
| `char.balita-perempuan` | character | 40594 | 22512 | 12 | 12 | 2048 | 163 | 46000 | 88% |
| `char.female-dewasa` | character | 42949 | 23767 | 13 | 13 | 2048 | 163 | 46000 | 93% |
| `char.female-dewasa-daster` | character | 41380 | 22923 | 12 | 12 | 2048 | 163 | 46000 | 90% |
| `char.female-lansia` | character | 40064 | 22235 | 12 | 12 | 2048 | 163 | 46000 | 87% |
| `char.male-dewasa-kemeja` | character | 42053 | 23294 | 12 | 12 | 2048 | 163 | 46000 | 91% |
| `char.male-dewasa-polo` | character | 41039 | 22748 | 12 | 12 | 2048 | 163 | 46000 | 89% |
| `char.male-lansia-kemeja` | character | 43716 | 24336 | 13 | 13 | 2048 | 163 | 46000 | 95% |
| `char.male-muda-jaket` | character | 44300 | 24571 | 13 | 13 | 2048 | 163 | 46000 | 96% |
| `char.male-pekerja` | character | 42909 | 23784 | 13 | 13 | 2048 | 163 | 46000 | 93% |
| `char.remaja-laki` | character | 20924 | 12160 | 17 | 17 | 384 | 163 | 46000 | 45% |
| `char.remaja-perempuan` | character | 21884 | 12716 | 17 | 17 | 384 | 163 | 46000 | 48% |
| `entity.child` | entity | 32554 | 17810 | 8 | 8 | 2048 | 166 | 34000 | 96% |
| `entity.pale-standing` | entity | 30246 | 16497 | 7 | 7 | 2048 | 166 | 34000 | 89% |
| `entity.shadow-crouch` | entity | 29944 | 16309 | 6 | 6 | 2048 | 166 | 34000 | 88% |
| `entity.tall-limbs` | entity | 29944 | 16309 | 6 | 6 | 2048 | 166 | 34000 | 88% |
| `entity.veiled-seated` | entity | 30560 | 16654 | 7 | 7 | 2048 | 166 | 34000 | 90% |
| `kit.floor.tile` | building | 12 | 24 | 1 | 1 | 512 | — | 3000 | 0% |
| `kit.wall.door` | building | 60 | 120 | 2 | 2 | 1024 | — | 3000 | 2% |
| `kit.wall.plain` | building | 12 | 24 | 1 | 1 | 1024 | — | 3000 | 0% |
| `kit.wall.window` | building | 120 | 240 | 3 | 3 | 1024 | — | 3000 | 4% |
| `nature.bush.fern` | nature | 36 | 72 | 2 | 2 | 512 | — | 4000 | 1% |
| `nature.grass.patch` | nature | 52 | 104 | 2 | 2 | 512 | — | 4000 | 1% |
| `nature.log.fallen` | nature | 140 | 154 | 2 | 2 | 512 | — | 4000 | 4% |
| `nature.rock.boulder` | nature | 560 | 315 | 1 | 1 | 512 | — | 4000 | 14% |
| `nature.tree.banana` | nature | 142 | 225 | 3 | 3 | 512 | — | 4000 | 4% |
| `nature.tree.beringin` | nature | 3144 | 2653 | 3 | 3 | 512 | — | 4000 | 79% |
| `nature.tree.dead` | nature | 792 | 845 | 1 | 1 | 512 | — | 4000 | 20% |
| `nature.tree.karet` | nature | 2070 | 1552 | 3 | 3 | 512 | — | 4000 | 52% |
| `nature.tree.palm` | nature | 394 | 575 | 3 | 3 | 512 | — | 4000 | 10% |
| `prop.bed` | prop | 120 | 240 | 3 | 3 | 512 | — | 1500 | 8% |
| `prop.chair.wood` | prop | 144 | 288 | 2 | 2 | 512 | — | 1500 | 10% |
| `prop.clothesline` | prop | 296 | 452 | 5 | 5 | 512 | — | 1500 | 20% |
| `prop.crate` | prop | 108 | 216 | 2 | 2 | 512 | — | 1500 | 7% |
| `prop.drum` | prop | 512 | 355 | 3 | 3 | 512 | — | 1500 | 34% |
| `prop.jerrycan` | prop | 200 | 332 | 2 | 2 | 512 | — | 1500 | 13% |
| `prop.lamp.teplok` | prop | 712 | 555 | 4 | 4 | 512 | — | 1500 | 47% |
| `prop.sack` | prop | 1020 | 682 | 2 | 2 | 512 | — | 1500 | 68% |
| `prop.shelves.steel` | prop | 228 | 456 | 3 | 3 | 512 | — | 1500 | 15% |
| `prop.signboard` | prop | 100 | 200 | 2 | 2 | 512 | — | 1500 | 7% |
| `prop.stove` | prop | 762 | 762 | 5 | 5 | 512 | — | 1500 | 51% |
| `prop.table.wood` | prop | 144 | 288 | 2 | 2 | 512 | — | 1500 | 10% |
| `road.asphalt.cross` | road | 90 | 180 | 2 | 2 | 1024 | — | 1500 | 6% |
| `road.asphalt.curve` | road | 576 | 300 | 2 | 2 | 1024 | — | 1500 | 38% |
| `road.asphalt.straight` | road | 80 | 160 | 2 | 2 | 1024 | — | 1500 | 5% |
| `road.asphalt.tjunction` | road | 70 | 140 | 2 | 2 | 1024 | — | 1500 | 5% |
| `road.asphalt.wet` | road | 10 | 20 | 1 | 1 | 1024 | — | 1500 | 1% |
| `road.dirt.straight` | road | 30 | 60 | 2 | 2 | 1024 | — | 1500 | 2% |
| `road.prop.powerpole` | prop | 230 | 268 | 3 | 3 | 512 | — | 1500 | 15% |
| `road.prop.signpost` | prop | 72 | 102 | 3 | 3 | 512 | — | 1500 | 5% |
| `road.sidewalk.segment` | road | 124 | 248 | 1 | 1 | 512 | — | 1500 | 8% |
| `vehicle.motorcycle.bebek` | vehicle | 2250 | 2068 | 8 | 8 | 512 | — | 3000 | 75% |
| `vehicle.pickup` | vehicle | 2544 | 1832 | 5 | 5 | 512 | — | 3000 | 85% |

<!-- END:assets -->

## 6. Cara memakai

```bash
npm run qc:topology          # periksa anggaran + kesegaran tabel (keluar 1 bila melanggar)
npm run qc:topology -- --write   # tulis ulang tabel di bagian 5
npm run test:studio          # grup topology: 60 aset, 0 pelanggaran, dokumen sinkron
```

Menambah aset baru: ukur dulu dengan `--write`, lihat persen pemakaian. Kalau
melewati 100 %, pilihannya hanya dua — turunkan detail geometri, atau naikkan
anggaran **beserta alasannya** di tabel bagian 4. Tidak ada jalan ketiga.

## 7. Batas yang jujur

* Anggaran diukur dari jumlah tri **statis di file**, bukan dari waktu gambar di
  GPU — sandbox ini tidak pernah merender satu frame WebGL pun.
* `vert` adalah jumlah POSITION per primitif; vertex di batas primitif bisa
  terduplikasi, jadi angkanya bukan jumlah vertex unik mesh.
* Tabel tidak memeriksa kualitas topologi (n-gon, aliran loop, pole). Ia
  memeriksa **besaran dan konsistensi**, yaitu hal yang bisa diukur tanpa mata.
