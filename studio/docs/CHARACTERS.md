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
  "daster":       {"cloth": [("tunic",       "#bf5a72"), ("shorts", "#b0546a")], "shoes": "shoes01"},
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
| `tunic` | torso diperpanjang sampai pertengahan paha, lengan sampai siku (2,4 unit) | 2,2 cm | +2,1 cm |
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
| bidang leher `y = 6,20` | atasan | di atas puncak bahu, di bawah dagu → kerah crew-neck (lihat catatan di bawah) |

Riwayat kerah, supaya tidak diulang: potongan datar 6,05 (bahu telanjang) →
6,42 (turtleneck) → 7,30 + lingkaran radius 0,62 (kain menutupi wajah) →
6,34 + lingkaran 0,62 (bertahan satu putaran, **tetapi tepinya bergerigi dan
berlubang**) → **bidang datar 6,20 saja** (sekarang).

Kenapa lingkaran radius itu dilepas: ia memotong **nyaris sejajar** permukaan
bahu, jadi vertex yang bersebelahan bisa jatuh di sisi berlawanan (masuk/keluar)
dan tepinya jadi gerigi dengan celah. Bidang datar memotong leher melintang,
sehingga garis potongnya bersih dan hasilnya kerah crew-neck yang rata. Pelajaran
umumnya: pilih bidang potong yang memotong permukaan **melintang**, bukan yang
menyinggungnya.

Kendala jarak lengan diterapkan **terbobot**: bobot skin pada tulang lengan
(0 = badan, 1 = lengan penuh) dipakai sebagai pengali, dan sisa bobotnya
memakai nilai besar (kendala tidak aktif). Daftar awalan tulang lengan mencakup
`metacarpal` dan `wrist`.

Dulu dipakai mask biner "tulang dominan lengan atau bukan". Nilai bidang potong
melompat di batas lengan↔bahu, dan lompatan itu menjadi garis potong yang tidak
menerus — terlihat sebagai **sobekan di jahitan bahu**, paling parah di daster
yang memakai dua kendala sekaligus (`sleeve` + `reach`).

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

Segitiga **sisir** (tinggi < 0,12 unit) hasil pemotongan dibuang
(`_clean_slivers`). Setelah didorong keluar 2 cm, sisir setipis 0,1 mm berubah
jadi duri di sekitar kerah dan bahu. Vertex **tidak** dilekatkan berdasarkan
posisi saja: vertex di jahitan UV punya posisi sama tetapi UV berbeda, dan
melekatkannya membuat segitiga melompati seluruh atlas (tumpang tindih UV
13 % → 22 %).

### Relaksasi: kain tidak mencetak badan

Offset saja tetap membuat kain mengikuti tonjolan badan (dada, pusar, bokong,
tempurung lutut). Setelah didorong keluar, permukaan kain **dihaluskan**
(Laplacian tangensial, 4 putaran, bobot 0,45) lalu tiap vertex ditarik kembali
keluar sepanjang arah offset semula sampai jaraknya ke badan ≥ **1,1 cm**
(`min_clear`). Hasilnya siluet rata tanpa kain menembus badan.

Dua jebakan yang sempat dicoba dan ditolak:

* **meratakan radius dari sumbu tulang** (radius per vertex dihaluskan lalu
  dipakai ulang) — permukaan jadi bergelombang seperti lilin meleleh, karena
  sumbu acuan tiap vertex berbeda (tulang berbeda);
* **menghaluskan posisi tanpa lantai** — kain menyusut dan badan menembus.

Vertex di tepi potong (kelim, kerah, manset) dikecualikan dari penghalusan dan
dikembalikan persis ke posisi hasil offset, supaya garis tepinya tetap lurus.

Titik acuan offset = posisi tulang **terbobot** (`Σ bobot skin × posisi tulang`),
bukan tulang dominan. Tulang dominan berubah mendadak antar vertex (di bahu:
`clavicle` → `spine03`); karena radius diukur dari titik itu, kain sobek tepat
di batas perubahan.

### Warna kain jauh dari warna kulit

Daster semula `#e0a1a9` (pink pucat). Di shot lebar, tokoh berbaju itu terbaca
**seperti telanjang** karena warnanya nyaris sama dengan kulit dan siluetnya
ketat. Sekarang `#bf5a72`/`#b0546a` (rose tua) dan lengannya sampai siku
(`sleeve` 2,40), jadi jelas memakai baju tanpa perlu mengubah bentuk.

### Ruang koordinat kain (dan kenapa kerah balita dulu menutup mulut)

Kain dipotong pada mesh yang **sudah diproporsi** (`apply_proportions`). Karena
itu semua angka yang ikut menentukan potongan harus melewati kurva proporsi yang
sama, bukan angka unit MH mentah:

| angka | dipakai untuk | dulu |
| --- | --- | --- |
| `PIECES[..]["y"]` | bidang potong atas/bawah | mentah (6,20) |
| `PIECES[..]["buttons"]` | tinggi kancing | mentah (4,75 …) |
| `neck_y` = 5,55 | lingkaran kerah | mentah |
| posisi tulang (`b_cloth`) | sumbu radial + kendala `sleeve`/`reach` | tulang mentah |

Untuk dewasa kurva proporsi hampir identitas (kaki 0,527 vs 0,527 unit,
torso 0,321 vs 0,321, kepala 0,152 vs 0,153), jadi salah ruang tidak terlihat.
Untuk balita kurva memetakan 6,20 → 4,81: garis leher mentah jatuh **di dagu**,
dan hasilnya kerah menutupi mulut. Sekarang potongan, kancing, kerah, dan tulang
acuan semuanya dipetakan lewat `_f_y()` / `proportion_bones()`.

### Kerah dan kancing

Dua detail yang membuat kain terbaca sebagai baju, bukan bodysuit:

* **Kerah** (`human.collar_ring`): pita lipatan setinggi 1 cm di tepi lubang
  leher, menonjol 4 mm, dengan bahan **30 % lebih tua**. Lebar pita mengikuti
  normal permukaan tiap vertex — bukan satu sumbu rata-rata, karena garis leher
  tidak sebidang (lebih tinggi di belakang) dan pita dengan satu sumbu tampak
  terpilin.
* **Kancing** (`human.buttons`): bulatan radius 5,5 mm di tengah depan. Tinggi
  kancing ada di data potongan (`PIECES[...]["buttons"]`): polo 3 buah, kemeja
  9 buah. Posisi depannya dicari dari vertex kain dengan `z` terbesar di tinggi
  itu.

Urutan vertex tepi dicari dengan menelusuri sisi, dan kalau penelusuran tidak
menutup, diganti urutan sudut mengelilingi pusat (`human._ring`). Urutan sudut
saja pernah dipakai untuk semua: hasilnya pita raksasa yang terpilin, karena
satu vertex bisa dipakai dua loop.

UV pita kerah dan kancing sengaja **satu titik** (`0.5, 0.5`): bahannya rata dan
tidak butuh wilayah atlas. Memakai UV kain membuat texel pita menumpuk di
wilayah body dan `qc-uv` melaporkannya sebagai tabrakan; kotak kecil pun tetap
bertumpuk karena 206 segitiga tidak mungkin dipetakan tanpa tumpang tindih ke
kotak sekecil itu.

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

1. **Siluet masih ketat.** Setelah relaksasi, relief badan sudah tidak tercetak
   (dada/pusar tinggal bayangan tipis), tapi kain tetap menempel dengan
   kelonggaran 1,1–2,2 cm. Kain yang benar-benar longgar butuh permukaan kain
   tersendiri (pola potong + loft/simulasi), bukan deformasi badan. Percobaan
   3 cm + flare 1,2 cm membuat bahu berlubang (manset terangkat dari lengan),
   jadi 2 cm dipilih sebagai titik seimbang.
2. **Jahitan garis & saku belum ada.** Kerah dan kancing sudah ada (lihat §3),
   tetapi belum ada jahitan garis, saku, atau kancing manset. Kelim dan manset
   pemilik lengan masih berupa tepi potongan (lurus, tanpa ketebalan).
3. **Wajah anak masih wajah dewasa yang diperkecil.** Terukur: kepala
   0,141 × 0,099 m (rasio lebar/tinggi 0,70) pada balita 0,94 m, yaitu rasio
   kepala/tubuh **0,15 — sama dengan dewasa (0,14)**, padahal anak sungguhan
   0,18–0,20. Selain itu alis yang dilukis `skinpaint.py` tampil lebih tebal
   dan bergerigi pada anak, dan tepi bawah rambut (fringe) jatuh tepat di garis
   alis. Percobaan menambah `head_k` (skala kepala seragam, 1,28 untuk balita,
   + fraksi kepala 0,314 dengan kaki/torso dikecilkan) sempat dicoba: rasio
   kepala membaik, tapi bola mata tenggelam di dalam rongga dan muncul garis
   sambung di dahi, jadi dibatalkan sebelum build. Yang perlu dikerjakan
   bersama: skala kepala seragam **plus** radius/kedalaman bola mata menurut
   ukuran kepala, ambang fitur wajah yang memakai ruang pra-proporsi, dan posisi
   fringe rambut menurut profil.
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
