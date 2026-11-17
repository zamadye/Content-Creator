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

Pakaian **tidak** tertanam di mesh. Satu outfit = kombinasi paket kain +
tint, dan tokoh hanya menyebut id outfit:

```python
WARDROBE = {
  "polo-kargo":   {"garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"], "tint": [1.00, 1.00, 1.00]},
  "kemeja-kasual":{"garments": ["male_casualsuit05", "shoes01"],                            "tint": [0.95, 0.98, 1.02]},
  "jaket":        {"garments": ["male_casualsuit05", "shoes01"],                            "tint": [0.62, 0.66, 0.74]},
  "seragam":      {"garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"], "tint": [0.86, 0.94, 1.18]},
  "daster":       {"garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"], "tint": [1.18, 0.92, 0.88]},
  "kerja":        {"garments": ["male_casualsuit05", "shoes01"],                            "tint": [0.80, 0.83, 0.78]},
}
```

Paket kainnya ada di `public/garments/` (4 potong: polo, celana kargo, setelan
kasual, sepatu) — lihat `public/garments/PROVENANCE.md`. Karena hanya ada 4
potong kain, variasi outfit saat ini datang dari **kombinasi + tint**, bukan
dari 20 model baju baru.

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
| satu tokoh penuh (2048² kulit, 13 klip, thumbnail) | **≈ 21 s** |
| 14 tokoh sekaligus | **≈ 5 menit** (297 s untuk build pertama) |
| ukuran per tokoh | 3,5–3,9 MB (27–30 tekstur), 13.900–14.500 tris |

Tidak ada bake high→low per tokoh, tidak ada rigging ulang: animasi dibuat
prosedural dari `CLIPS` sekali, lalu disalin ke setiap varian. Karena itu
menambah tokoh ke-15 praktis hanya biaya build 21 detik.

---

## 5. Cacat yang masih terbuka (jujur)

1. **Jahitan pakaian kasar.** Paket kain ditulis untuk tubuh dewasa lalu
   di-offset per potong; di saku/paha celana kargo masih ada bercak gelap
   (interior kain terlihat) dan ujung lengan bergerigi.
2. **Wajah anak masih wajah dewasa yang diperkecil.** Proporsi kepala/leher
   sudah benar, tetapi mata, hidung, dan pipi belum punya morph khusus balita.
3. **Rambut = cangkang skalp + panel belakang.** Gaya `ponytail`/`twin-tails`
   belum benar-benar dua ekor; hanya panel di belakang kepala.
4. **Belum ada variasi kulit tubuh** (tanda lahir, luka, tato) dan belum ada
   pakaian adat/ seragam sekolah Indonesia yang spesifik.
5. **`anak-besar`** profil tersedia tetapi belum ada tokohnya.
6. Varian outfit baru membuktikan mekanisme tukar-kostum, belum kekayaan
   desain: hanya 4 potong kain.

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
```
