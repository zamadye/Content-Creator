# KARAKTER — satu rig, banyak varian

Tokoh manusia memakai rig MakeHuman dengan 163 tulang dan 13 klip. Mayoritas
varian dibentuk dari mesh dasar MakeHuman lewat profil umur, bentuk tubuh,
kulit, rambut, dan pakaian. Dua pelajar memakai model kartun yang dibangun
pada rig yang sama.

```
public/assets/characters/<asset-id>/
  <asset-id>.glb      # mesh + rig + 13 klip animasi
  thumbnail.png       # badan utuh, 384²
  portrait.jpg        # wajah GLB dalam pencahayaan netral, hanya pada model utama
```

Katalog dibuka lewat `#karakter` dan menampilkan 14 manusia dan 5 entitas horor.
Dimas dan Ratih masing-masing punya dua kostum. Tautan ke kostum langsung membuka
model itu dan memperlihatkan bio tokoh yang sama. Nama, peran, dan bio ada di
`data/character-identities.json`. Profil pahatan kepala dan detail seperti
kacamata Pak Harun ada di `studio-forge/forge/portrait.py`.

Sesudah membangun GLB, jalankan preview, lalu
`node scripts/cast-portraits.mjs http://localhost:4173/` untuk mengambil potret
dari penampil WebGL. Tambahkan ID aset sebagai argumen untuk memotret ulang
satu tokoh. Perbarui registry dengan `python3 studio-forge/build.py --registry-only`.

Potret dan bio seluruh tokoh tersedia di [Potret dan Bio](Potret-dan-Bio.pdf). Untuk melihat revisi delapan wajah dari kamera yang sama, buka [perbandingan sebelum dan sesudah](Perbandingan-Wajah.jpg).

Bukti rupa: `docs/character-lineup.png` (16 model manusia berjejer) dan still WebGL
sungguhan di `docs/webgl-shots/StudioUjiKarakter-f*.png`.

Di *Bel Terakhir*, bentuk wajah, rambut dan pola seragam Nisa serta Bayu
dibangun di `studio-forge/forge/student.py`. Lengan kemeja tersambung ke
badan di sepanjang lubang lengan. Kerah dan dasi mengikuti permukaan serta
bobot tulang kemeja. Mata, alis, dan mulut dapat dianimasikan secara terpisah.

Pada klip `talk` Bayu mengangkat telapak tangan saat bertanya. Nisa mengangguk
di awal jawaban lalu mengulurkan tangan pada frasa kedua. Klip `idle` memberi
pendengar kedipan dan perpindahan tumpuan. Di tiap shot, `gazeWeight` mengatur
seberapa kuat kepala mengikuti `lookAt` pada rentang 0–1 (bawaan 1). Set
`building.school.corridor` menghadap +Z dan lantai selasarnya berada di y=0.

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
  WARDROBE              # 7 set pakaian = paket kain + tint
  SPECS                 # 16 tokoh, satu baris per tokoh
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
| `char.remaja-laki` | remaja | 1.60 m | `putih-abu` | pelajar |
| `char.remaja-perempuan` | remaja | 1.54 m | `putih-abu` | pelajar, ekor kuda |
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

### Ukuran mata mengikuti kepala, bukan tinggi badan

Radius bola mata dulu `0,0116 · (tinggi / 1,70)`, sehingga mata balita hanya
55 % mata dewasa padahal kepalanya 87 % — wajah anak terbaca sebagai orang
dewasa yang diperkecil. Sekarang radius memakai **tinggi kepala**
(`PROFILES[profile][2] · tinggi`), dan rasio iris dinaikkan menurut umur
(`IRIS_RATIO`: dewasa 0,476 · remaja 0,50 · anak 0,56 · balita 0,60) karena mata
anak memang beririsan lebih besar. Ini perubahan kecil yang tidak menyentuh
geometri kepala, jadi tidak menimbulkan jahitan baru.

### Wajah: kerut bibir dan bercak cambang

Dua cacat tekstur wajah yang paling terlihat di close-up:

* **Kerut bibir** digambar dengan `sin(x·150)` amplitudo 0,18 di peta tinggi.
  Di atlas 1024 itu menjadi garis-garis tebal yang terbaca seperti **jahitan**,
  dan tonjolan `lips·0,35` membuat bibir atas tampak lempeng terpisah. Sekarang
  frekuensi 70, amplitudo 0,05, tonjolan 0,16.
* **Cambang** (`stubble`) memakai `band(y, 6,10, 6,95)` — batas atas 6,95 ada di
  pipi atas, jadi bercak cambang muncul sebagai noda gelap di tulang pipi. Batas
  diturunkan ke 6,85, titik diperkecil (95/15000 vs 55/9000), dan intensitas
  fitur 0,85 → 0,70.

### Garis rambut: dilukis di tekstur, bukan dipotong di geometri

Keluhan yang paling lama menggantung: "di atas dahi hitam bergerigi". Ternyata
dua cacat bertumpuk, dan keduanya berasal dari asumsi yang salah.

1. **Garis rambut lama ada di bawah alis.** `scalp_line` dulu
   `6,80 + 0,22·(z−0,15)` → 7,02 di dahi, sementara alis 7,47 dan mata 7,29.
   Jadi topi rambut sebenarnya **menutupi seluruh wajah**, dan yang tampil
   sebagai "garis rambut" adalah perpotongan cangkang rambut dengan kulit wajah
   — dua permukaan yang nyaris berimpit (offset 1,5 mm, galat faset kepala
   1–2 mm). Perpotongan dua bidang nyaris sebidang selalu bergerigi. Sekarang
   garis rambut memakai sudut keliling kepala (`f = (cos θ + 1)/2`,
   `line = 6,98 + 0,85·f^1,6`): dahi **7,83**, pelipis 7,71, samping 7,26,
   tengkuk 6,98 — semuanya di atas alis, di atas puncak telinga (7,45) di
   x = 0,80.
2. **Kulit di bawah rambut kini dicat warna rambut.** `paint_skin` menggelapkan
   kulit kepala 13 mm di atas garis rambut (transisi 10 mm, mulai 11 mm di bawah
   garis), persis warna `hair.color`. Jadi tepi geometri topi rambut — seburuk
   apa pun bentuknya — jatuh di area yang sudah gelap: **gelap di atas gelap**,
   tidak terlihat. Garis rambut yang terlihat sekarang adalah batas lukisan yang
   mulus di atlas 1024 (± 0,4 mm/texel di dahi), bukan lagi potongan segitiga.

Topi rambutnya sendiri tetap cangkang hasil salin-permukaan (offset
`0,18–1,15 × thickness`, ubun-ubun dilengkungkan 0,55 × thickness, disapu ke
belakang 0,12 × thickness) dan dipotong per segitiga dengan ambang
`scalp_weight > 0,13` memakai `.all()` — bukan `.any()` — supaya tidak ada
segitiga yang menjulur ke bawah melewati pita gelap itu.

Bukti sebelum/sesudah: `docs/character-hairline.png` (kiri: gerigi 8–10 px di
dahi; kanan: garis rambut mulus dengan pita bayangan 13 mm di bawahnya).

Sisa cacat yang jujur: di pelipis, ± 1,5 cm di atas telinga, masih ada 2–3
takik segitiga pada tepi topi rambut yang terlihat saat kamera 16° (close-up
ekstrem, 700 px untuk area 10 cm); di jarak potret normal (0,62 m, 30°) dan di
render WebGL `docs/webgl-shots/StudioUjiKarakter-f300.png` garis rambutnya
mulus. Penyebabnya faset mesh kepala (~1 cm per edge): potongan per segitiga
selalu menuruni faset, jadi takik itu baru hilang kalau kepala di-retopo lebih
rapat di area pelipis.

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

### Jahitan garis di kelim

`hem_stitch()` menambahkan satu garis tipis (lebar 3 mm, 5 mm di dalam tepi,
diangkat 0,4 mm) mengikuti **kelim bawah** tiap potongan. Manset dan kerah
dilewati: kerah sudah punya pita lipatan, manset terlalu kecil untuk terbaca.

Dua hal yang membuat ini gagal di percobaan pertama:

* **Satuan.** Angka di `PIECES` dan fungsi kain memakai unit MH (1 unit ≈ 9,6 cm).
  Lebar 0,011 yang dimaksud "11 mm" ternyata 1 mm — garisnya tidak terlihat.
  Sekarang `inset` 0,055 (≈5 mm) dan `width` 0,030 (≈3 mm).
* **Pemilihan titik tepi.** Versi pertama menelusuri loop tepi, tetapi kelim dan
  kedua manset sering menyatu dalam **satu** loop (mereka bertemu di ketiak),
  jadi penelusuran melewatkannya. Sekarang titik tepi dipilih menurut tinggi
  (`y < y_min + 0,12`) dan arah "ke dalam kain" diambil dari rata-rata tetangga
  1-ring, bukan dari urutan loop.

Segitiganya murah: ± 2 segitiga per sisi tepi (≈ 240 tri untuk kemeja).

### Kelim lurus: y dikunci ke rentang potongan

Offset radial punya komponen y, jadi vertex di dekat kelim bisa melewati garis
potong (diukur: spike 6 mm di bawah kelim polo) dan tepinya tampak bergerigi.
Karena potongan atas dan bawah memang bidang datar, `body_cloth` sekarang
mengunci `y = clip(y, lo, hi)` setelah offset dan relaksasi. Tepi potong juga
dikunci lebih lebar (`margin < 0,03` ≈ 3 mm, dulu 0,1 mm) supaya tidak ada
vertex tepi yang ikut bergerak.

### Bahan warna rata untuk detail ber-UV titik

Kerah, kancing, dan jahitan memakai UV satu titik (luas nol → `qc-uv` bersih).
Memakai `fabric_texture` untuk mereka hanya mengambil **satu texel** tenunan,
yang kebetulan jatuh di benang gelap: kancing dan saku tampil hampir hitam.
`flat_fabric()` memberi albedo warna rata untuk semua detail itu.

Bug yang menyertainya: `flat_fabric` semula mengembalikan peta normal `(0,0,1)`,
padahal peta normal glTF **dienkode 0..1** (0,5 = datar, seperti keluaran
`tex.height_to_normal`). Normal (0,0,1) terbaca sebagai permukaan miring 45°
sehingga kerah, kancing, dan saku tampil nyaris hitam selama beberapa putaran.
Sekarang `(0,5, 0,5, 1,0)`.

Kancing dipisah jadi bagian sendiri (`…-buttons`, bahan plastik gelap 0,20).
Sebelumnya kancing menumpang bahan kerah, jadi warnanya harus sama dan
kancingnya tak terlihat.

### Saku: digambar ke tekstur, bukan geometri

Saku geometris dicoba dua kali — bidang hasil fitting kuadratik dan sub-mesh
kain sendiri yang didorong 3 mm keluar. Keduanya **tampil hitam di WebGL**
walaupun warnanya benar di renderer perangkat lunak (albedo diperiksa langsung
dari atlas GLB: rata-rata 0,49 abu-abu), dan penyebabnya tidak ditemukan sebelum
tenggat. Solusi yang dipakai: `paint_pocket()` menggelapkan texel albedo kain di
kotak saku + garis tepi lebih gelap, memakai peta posisi dari
`uvpaint.rasterize_uv` (jadi bentuknya mengikuti UV kain yang sebenarnya).
Aman di semua renderer, tanpa tri tambahan, dan atlas UV tidak berubah.

Perhatikan juga arti `darker(color, factor)`: `factor` adalah **pengali
kecerahan** (0,55 = 55 % terang), bukan jumlah yang dikurangi. Nilai 0,30 yang
dulu dipakai membuat kerah dan kancing nyaris hitam; sekarang 0,55.

### Kerah dan kancing

Dua detail yang membuat kain terbaca sebagai baju, bukan bodysuit:

* **Kerah** (`human.collar_ring`): pita **tegak** setinggi 7,5 mm di tepi lubang
  leher, menonjol 8 mm ke luar, bahan 82 % terang (sedikit lebih tua dari kain).
  Pita naik sepanjang **+y**, bukan sepanjang normal permukaan: normal di garis
  leher sangat bervariasi antar vertex (menghadap ke atas di depan, ke samping
  di bahu), sehingga pita yang mengikuti normal zigzag dan di layar tampak
  sebagai **gigi putih di leher**. Pita vertikal selalu mulus, dan normalnya
  sendiri dihitung sebagai arah radial keluar (tegak lurus garis tepi × sumbu y).

  Urutan vertex tepi diambil dengan **mengurutkan sudut** mengelilingi sumbu
  leher. Lubang leher berbentuk bintang terhadap sumbu itu, jadi urutan sudut
  selalu benar; penelusuran sisi kadang melompat dan menghasilkan pita
  bergerigi.
* **Kancing** (`human.buttons`): bulatan radius 5,5 mm di tengah depan. Tinggi
  kancing ada di data potongan (`PIECES[...]["buttons"]`): polo 3 buah, kemeja
  9 buah. Posisi depannya dicari dari vertex kain dengan `z` terbesar di tinggi
  itu.

Catatan riwayat: untuk kelim dan manset, penelusuran sisi (`human._ring`) masih
dipakai dan aman karena loop-nya sederhana. Untuk kerah, urutan sudut wajib
(lihat di atas).

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
| 16 tokoh sekaligus | **≈ 7,2 menit** (429 s terukur) |
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
2. **Kain belum berlapis.** Dua lapis kain yang bertumpuk (kemeja di atas
   celana) memakai kelonggaran yang sama, jadi menaikkan `offset` celana
   (`pants` 0,16 → 0,24 dicoba) membuat pinggang celana menembus kemeja —
   terlihat sebagai bercak warna celana di pinggang. Kain di bawah kain butuh
   offset bertingkat per lapis (lapis luar = lapis dalam + tebal), bukan angka
   tunggal per potongan. Percobaan itu dibatalkan sebelum build.
3. **Saku masih datar (digambar ke tekstur), jahitan baru di kelim.** Saku
   geometris belum berhasil: dua percobaannya tampil hitam di WebGL meski albedo
   atlasnya benar (lihat §3). Yang dipakai sekarang saku yang digambar ke
   albedo, jadi tidak ada bayangan tepi dan saku tidak berubah bentuk saat
   pose. Kancing manset dan ketebalan tepi kain juga belum ada.
4. **Wajah anak masih wajah dewasa yang diperkecil.** Terukur: kepala
   0,141 × 0,099 m (rasio lebar/tinggi 0,70) pada balita 0,94 m, yaitu rasio
   kepala/tubuh **0,15 — sama dengan dewasa (0,14)**, padahal anak sungguhan
   0,18–0,20. Selain itu alis yang dilukis `skinpaint.py` tampil lebih tebal
   dan bergerigi pada anak. (Tepi bawah rambut yang dulu jatuh di garis alis
   sudah tidak berlaku: garis rambut sekarang 7,83 di dahi dan 7,53 untuk
   potongan `bowl` anak — lihat §"Garis rambut: dilukis di tekstur".)
   Percobaan menambah `head_k` (skala kepala seragam, 1,28 untuk balita,
   + fraksi kepala 0,314 dengan kaki/torso dikecilkan) sempat dicoba: rasio
   kepala membaik, tapi bola mata tenggelam di dalam rongga dan muncul garis
   sambung di dahi, jadi dibatalkan sebelum build. Yang perlu dikerjakan
   bersama: skala kepala seragam **plus** radius/kedalaman bola mata menurut
   ukuran kepala, ambang fitur wajah yang memakai ruang pra-proporsi, dan posisi
   fringe rambut menurut profil.
5. **Tubuh pria masih condong feminin.** Mesh dasar MakeHuman yang dipakai
   berbentuk perempuan; pria sekarang diratakan dadanya (kontraksi z ke bidang
   rusuk dengan bobot yang hanya bergantung pada y, 55 %), pinggang dilebarkan,
   dan panggul dipersempit. Hasilnya tidak lagi berdada, tetapi lipatan bawah
   dada dan panggul masih terbaca. Percobaan bobot per payudara (Gauss pada x)
   membuat kerut keras di tepi atas dada, jadi dipakai bobot y saja. Solusi
   bersih: mesh dasar pria, atau deformer berbasis permukaan.
6. **Rambut = cangkang skalp + panel belakang.** Gaya `twin-tails`
   masih memakai panel belakang. Profil remaja dengan `ponytail` memakai ekor tiga dimensi.
7. **Belum ada variasi kulit tubuh** (tanda lahir, luka, tato) atau pakaian adat.
8. **`anak-besar`** (8–12 th) profil tersedia tetapi belum ada tokohnya.
9. **Sepatu** masih memakai paket kain jadi `shoes01`; yang lain prosedural.

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
