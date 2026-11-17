# KARAKTER — satu rig, banyak varian

Semua tokoh manusia di studio ini berasal dari **satu mesh dasar** (MakeHuman,
14.517 verteks, 163 tulang, 13 klip) yang di-**copy** menjadi varian lewat
parameter. Tidak ada sepuluh model terpisah: yang berbeda hanya profil umur,
bentuk tubuh (morph), kulit, rambut, dan pakaian.

```
public/assets/characters/<asset-id>/
  <asset-id>.glb      # mesh + rig + 13 klip animasi
  thumbnail.png       # render 384² (renderer perangkat lunak studio-forge)
```

Bukti rupa: `docs/character-lineup.png` (14 tokoh berjejer) dan still WebGL
sungguhan di `docs/webgl-shots/StudioUjiKarakter-f*.png`.

---

## 1. Arsitektur: base → profil → varian

```
forge/human.py      
  base()                # mesh MakeHuman + 163 tulang + bobot kulit
  shape(P, spec)        # deformer elipsoid: bahu, dada, perut, pinggang,
                        # pinggul, glute, leher, rahang, pipi, dll.
  PROFILES              # (kaki, torso, kepala, radial) sebagai fraksi tinggi
  apply_proportions()   # regangkan pita vertikal + lebar badan
  proportion_bones()    # kurva yang sama untuk tulang → animasi tetap benar
forge/character.py
  WARDROBE              # 6 set pakaian = paket kain + tint
  SPECS                 # 14 tokoh, satu baris per tokoh
  build(asset_id, spec) # copy base → proporsi → morph → kulit → pakaian → klip
```

### Profil proporsi umur

Kunci "anak" bukan sekadar tinggi yang diperkecil: kepala harus **besar**,
leher pendek, tungkai pendek. Karena itu proporsi diatur sebagai fraksi tinggi
badan, bukan skala seragam.

| profil | kaki | torso | kepala | radial badan | tinggi hasil |
|---|---|---|---|---|---|
| `dewasa` | 0.527 | 0.321 | 0.152 | 1.00 | 1.60–1.73 m |
| `lansia` | 0.510 | 0.318 | 0.172 | 1.00 | 1.54–1.68 m |
| `remaja` | 0.505 | 0.325 | 0.170 | 0.96 | 1.50–1.57 m |
| `anak-besar` (8–12 th) | 0.470 | 0.335 | 0.195 | 0.93 | — (profil siap pakai) |
| `anak` (5–6 th) | 0.450 | 0.340 | 0.210 | 0.90 | 1.12–1.16 m |
| `balita` (2–3 th) | 0.415 | 0.340 | 0.245 | 0.86 | 0.91–0.95 m |

`radial` mengecilkan lebar badan **di bawah leher saja**; kepala tetap penuh,
jadi anak benar-benar berkepala besar (rasio kepala/tinggi balita ≈ 0.245 vs
dewasa 0.152). Kurva yang sama diterapkan ke mesh, pakaian, dan tulang, jadi
klip `walk`/`run`/`sit` tidak perlu diubah per umur.

> `anak-besar` belum dipakai tokoh mana pun. Ia tetap di `PROFILES` supaya
> rentang 8–12 tahun bisa ditambahkan tanpa menulis kode baru — cukup satu
> baris di `SPECS`.

---

## 2. Daftar tokoh (14)

| id | profil | tinggi | outfit | catatan |
|---|---|---|---|---|
| `char.male-dewasa-polo` | dewasa | 1.73 m | `polo-kargo` | tokoh acuan; punya varian outfit |
| `char.female-dewasa` | dewasa | 1.62 m | `polo-kargo` | punya varian outfit |
| `char.male-muda-jaket` | dewasa | 1.65 m | `jaket` | pemuda |
| `char.male-pekerja` | dewasa | 1.71 m | `kerja` | perawakan besar, brewok |
| `char.male-lansia-kemeja` | lansia | 1.68 m | `kemeja-kasual` | keriput, rambut menipis |
| `char.female-lansia` | lansia | 1.56 m | `daster` | rambut sanggul |
| `char.remaja-laki` | remaja | 1.57 m | `seragam` | pelajar |
| `char.remaja-perempuan` | remaja | 1.51 m | `seragam` | pelajar, ekor kuda |
| `char.anak-laki` | anak | 1.16 m | `seragam` | bocil 5–6 th, potongan mangkuk |
| `char.anak-perempuan` | anak | 1.13 m | `daster` | bocil 5–6 th, kuncir dua |
| `char.balita-laki` | balita | 0.95 m | `seragam` | 2–3 th |
| `char.balita-perempuan` | balita | 0.92 m | `daster` | 2–3 th |
| `char.male-dewasa-kemeja` | dewasa | 1.73 m | `kemeja-kasual` | **varian outfit** dari `male-dewasa-polo` |
| `char.female-dewasa-daster` | dewasa | 1.62 m | `daster` | **varian outfit** dari `female-dewasa` |

Semua memakai `rig.skeleton = studio-humanoid-v1`, 163 tulang, dan daftar klip
yang identik (`idle, walk, run, sit, ride, stand-up, talk, look, point, reach,
collapse, float, vanish`). Pagar tes `characters & outfits` menolak tokoh baru
yang memakai rig atau klip berbeda.

Lembar kontak: `docs/character-lineup.png`.

---

## 3. Pakaian sebagai data (`WARDROBE`)

Pakaian **tidak** tertanam di mesh. Satu outfit = daftar potongan kain +
warna, dan tokoh hanya menyebut id outfit:

```python
WARDROBE = {
  "polo-kargo":   {"cloth": [("shirt-short", "#d9dee4"), ("pants", "#9aa98a")], "shoes": "shoes01"},
  "kemeja-kasual":{"cloth": [("shirt-long",  "#46536b"), ("pants", "#37414f")], "shoes": "shoes01"},
  "jaket":        {"cloth": [("shirt-long",  "#2f343d"), ("pants", "#262a31")], "shoes": "shoes01"},
  "seragam":      {"cloth": [("shirt-short", "#93b8e6"), ("pants", "#5d7ea8")], "shoes": "shoes01"},
  "daster":       {"cloth": [("tunic",       "#e0a1a9"), ("shorts", "#e0a1a9")], "shoes": "shoes01"},
  "kerja":        {"cloth": [("shirt-long",  "#6f7a5b"), ("pants", "#414a3a")], "shoes": "shoes01"},
}
```

### Kain diturunkan dari tubuh, bukan model kain jadi

Potongan kain (`human.PIECES`) dibuat dengan **memotong permukaan tubuh
sendiri** lalu mendorongnya keluar, dengan kelonggaran yang bertambah ke arah
kelim:

| potongan | cakupan | kelonggaran | tambahan di kelim (`flare`) |
|---|---|---|---|
| `shirt-short` | torso sampai lengan atas (manset 1,45 unit dari sendi bahu) | 2,0 cm | +1,0 cm |
| `shirt-long` | torso + lengan sampai pergelangan (3,3 unit) | 2,0 cm | +0,9 cm |
| `tunic` | torso diperpanjang sampai pertengahan paha | 2,2 cm | +2,1 cm |
| `pants` | pinggang sampai mata kaki | 1,6 cm | +1,1 cm |
| `shorts` | pinggang sampai pertengahan paha | 1,7 cm | +1,1 cm |

Satuan internal MakeHuman: 1 unit ≈ 0,103 m pada tinggi 1,72 m. (Offset lama
0,05 unit ternyata hanya **5 mm** — itu sebabnya versi pertama kain terbaca
seperti spandeks. Angka di tabel ini sudah dalam cm.)

Karena kain dan badan adalah permukaan yang sama, **tidak ada badan menembus
kain, tidak ada lubang crotch, dan tidak ada segitiga yang menghadap ke
dalam** — tiga cacat yang dulu muncul karena memakai model kain jadi
(`cortu_cargo_pants` ternyata dua tabung tanpa crotch; seperlima segitiga polo
menghadap ke dalam). Offset-nya **radial dari tulang dominan vertex itu**,
bukan sepanjang normal: di lipatan (crotch, ketiak) normal menunjuk ke dalam
sehingga offset normal justru menenggelamkan kain ke badan.

Tekstur kain prosedural (`human.fabric_texture`): tenunan + lipatan + warna per
outfit, 512². Tenunan 140 ulir di atlas 512 px sempat terbaca sebagai
kotak-kotak besar di layar (UV kain hanya memakai sebagian atlas) sehingga kain
tampak seperti jaring bodysuit; sekarang relief tenunan dilembutkan dan
kontrasnya diturunkan — warnanya tetap, polanya hilang. Tidak ada tekstur kain
yang perlu diunduh atau dilisensikan.
Sepatu tetap memakai paket kain jadi `shoes01` (bentuknya sudah benar).

### Batas kain: dipotong, bukan dipilih

Batas kain (kelim, manset, garis leher) dipotong dengan **bidang implisit**
(`human.slice_by_field`): segitiga yang memotong batas dibelah dan titik
potongnya diinterpolasi, jadi tepinya lurus. Memilih segitiga utuh (cara
pertama) memberi tepi bergerigi sebesar satu segitiga — terlihat seperti kain
robek. Tiga kendala yang dipakai:

| kendala | dipakai oleh | kenapa |
|---|---|---|
| rentang `y` | semua | kelim bawah dan atap potongan |
| jarak dari sendi bahu per sisi | atasan | lengan pose-A miring; bidang datar memberi panjang beda kiri–kanan |
| jangkauan dari panggul | celana, rok, daster | tangan ada di ketinggian pinggang saat pose-A, jadi tanpa ini celana menutupi telapak tangan |
| lingkaran leher (r 0,62 unit) | atasan | bidang datar memotong di bawah puncak bahu (bahu telanjang) atau di tengah leher (turtleneck) |

Urutan percobaan kerah yang gagal, supaya tidak diulang: potongan datar di
6,05 (bahu telanjang) → 6,42 (turtleneck) → 7,30 + lingkaran 0,62 (kain
menutupi wajah karena tengkorak juga beradius > 0,62) → **6,34 + lingkaran
0,62** (kerah crew-neck, bahu tertutup, wajah bersih).

Kendala jarak **hanya** berlaku untuk vertex bertulang lengan (daftar awalan
mencakup `metacarpal` dan `wrist`): kalau diterapkan ke semua vertex, dada yang
hanya 1,7 unit dari bahu ikut terpotong.

**Kelim harus lurus.** Offset kain diarahkan radial dari tulang dominan, jadi
arahnya punya komponen `y`. Komponen itu membuat vertex tepat di bawah garis
potong ikut terangkat melewati batas, dan tepi kain tampil bergerigi. Karena
itu komponen `y` offset dimatikan dengan bobot yang naik halus dari batas
potong: 0 di tepi → 1 setelah ±0,25 unit (±2,5 cm). Bobotnya dihitung dari
`_cloth_field` yang sama dengan yang dipakai memotong mesh, jadi kedua
pemakaian tidak pernah berbeda.

Normal kain diambil dari **normal badan** (diinterpolasi di titik potong),
bukan dihitung ulang dari mesh kain: mesh kain terbuka di tepi, sehingga normal
hasil hitung ulang membelok ke dalam di baris terakhir dan tepinya tampil
sebagai gigi hitam. Itu masalah pencahayaan, bukan geometri.

Pita penutup tepi (`_close_rim`) sudah **tidak dipakai** (tebal 0): sumber
gerigi ternyata komponen `y` offset di atas, dan pita itu sendiri menambah
baris segitiga yang tampak sebagai rumbai gelap di kelim. Fungsi tetap ada
kalau nanti kain diberi ketebalan sungguhan.

### Menukar kostum dari naskah

`cast.<ref>.outfit` di `story.json` memilih varian yang sudah dibangun:

```jsonc
"cast": {
  "aku":        { "asset": "char.male-dewasa-polo" },
  "aku-kemeja": { "asset": "char.male-dewasa-polo", "outfit": "kemeja-kasual" }
}
```

Registry menyimpan peta varian per tokoh (`assets.<id>.outfits`), dan
`compile.js` menukar asset **setelah** validasi. Outfit yang tidak dibangun
ditolak validator dengan pesan yang menyebut pilihan yang tersedia.

Bukti: `stories/uji-karakter/story.json` — shot `karakter-04` memakai
`polo-kargo`, shot `karakter-05` memakai tokoh yang sama dengan `kemeja-kasual`.

### Menambah varian outfit

1. Tambah entri di `WARDROBE` (paket kain + tint).
2. Tambah satu baris `SPECS` dengan `variant_of="<tokoh asal>"` (lihat
   `char.male-dewasa-kemeja`).
3. Daftarkan di `OUTFIT_VARIANTS`: `"<tokoh asal>": {"<outfit>": "<asset varian>"}`.
4. `python3 studio-forge/build.py --only <asset varian>` lalu
   `--registry-only` (menulis ulang `registry.json` + `registry.generated.js`).

---

## 4. Biaya membangun (terukur, satu inti)

| langkah | waktu |
|---|---|
| satu tokoh penuh (2048² kulit, 5 potong kain, 13 klip, thumbnail) | **≈ 28 s** |
| 14 tokoh sekaligus | **≈ 6,5 menit** (391 s terukur) |
| ukuran per tokoh | 3,9–4,2 MB (27–30 tekstur), 14.700–16.500 tris |

Tidak ada bake high→low per tokoh, tidak ada rigging ulang: animasi dibuat
prosedural dari `CLIPS` sekali, lalu disalin ke setiap varian. Karena itu
menambah tokoh ke-15 praktis hanya biaya build 21 detik.

---

## 5. Cacat yang masih terbuka (jujur)

1. **Siluet masih ketat.** Kain mengikuti badan dengan kelonggaran 1,6–2,2 cm
   (dari 1,0–1,5 cm), jadi kemeja masih mencetak bentuk dada dan pinggang walau
   sudah tidak seperti spandeks. Kain yang benar-benar longgar butuh permukaan
   kain tersendiri (loft/simulasi), bukan offset dari badan. Percobaan 3 cm +
   flare 1,2 cm membuat bahu berlubang (manset terangkat dari lengan) dan
   kerah terlihat lepas, jadi 2 cm dipilih sebagai titik seimbang.
2. **Jahitan belum ada.** Tidak ada jahitan, kancing, kerah, atau saku. Kelim
   dan manset masih berupa tepi potongan (lurus, tanpa ketebalan); pita
   penutup tepi 1,3 mm sudah dilepas karena tampak sebagai rumbai gelap.
3. **Wajah anak masih wajah dewasa yang diperkecil.** Proporsi kepala/leher
   sudah benar, tetapi mata, hidung, dan pipi belum punya morph khusus balita.
4. **Rambut = cangkang skalp + panel belakang.** Gaya `ponytail`/`twin-tails`
   belum benar-benar dua ekor; hanya panel di belakang kepala.
5. **Belum ada variasi kulit tubuh** (tanda lahir, luka, tato) dan belum ada
   pakaian adat/seragam sekolah khas Indonesia.
6. **`anak-besar`** (8–12 th) profil tersedia tetapi belum ada tokohnya.
7. **Sepatu** masih memakai paket kain jadi `shoes01`; yang lain prosedural.

Riwayat perbaikan penting: alpha rambut dulu dipanggang dari `scalp_weight`
lalu diblur 12 px di atlas 512², sehingga nilai di ubun-ubun turun di bawah
`alphaCutoff` 0.45 dan **di WebGL kepala tampak botak** (hanya dua jepit di
pelipis). Sejak perbaikan ini, garis rambut ditentukan geometri (segitiga di
atas hairline) dan alpha tekstur = 1. Thumbnail perangkat lunak tidak pernah
menunjukkan cacat itu karena renderer-nya memakai alpha sebagai campuran, bukan
ambang.

---

## 6. Perintah

```bash
cd studio
python3 studio-forge/build.py --list                    # daftar 60 aset
python3 studio-forge/build.py --category character      # bangun semua tokoh
python3 studio-forge/build.py --only char.anak-laki     # satu tokoh
python3 studio-forge/build.py --registry-only           # tulis ulang registry
node scripts/test-studio.mjs                            # termasuk grup characters & outfits
node scripts/studio.mjs validate stories/uji-karakter/story.json
node scripts/qc-webgl-shots.mjs --only=StudioUjiKarakter
./.venv/bin/python studio-forge/dev_lineup.py docs/character-lineup.png   # lembar kontak
```
