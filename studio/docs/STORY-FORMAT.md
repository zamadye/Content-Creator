# FORMAT CERITA — `studio.story/2`

Kontrak data untuk agen. Satu cerita = satu file JSON. Tidak ada kode, tidak ada
path ke kode: semua aset dirujuk lewat **id katalog** (`public/assets/registry.json`).

```
node scripts/studio.mjs validate stories/<dir>/story.json   # cek dulu, selalu
node scripts/studio.mjs plan stories/x/story.json       # lihat biaya aset
npm run render:studio -- StudioJalanPulang               # render 705 frame
```

Validator bersifat **strict**: field tak dikenal = error. Ini disengaja — agen
mendapat pesan yang menyebut field mana yang salah, bukan diam-diam diabaikan.

---

> **Lokasi berkas (sejak folder diganti jadi `studio/`):** satu cerita = satu
> folder `stories/<dir>/` berisi `story.json`, opsional `compositions.jsx`
> (komposisi manual) dan `naskah/` (naskah markdown sumber yang diimpor dengan
> `npm run naskah:import`). Lihat `docs/FRAMEWORK.md`.

## 1. Kerangka

```jsonc
{
  "schema": "studio.story/2",
  "id": "jalan-pulang-01",          // slug a-z0-9._-
  "title": "Jalan Pulang",
  "fps": 30,                         // 24 | 25 | 30
  "width": 1920, "height": 1080,     // genap, 256..4096
  "look":  { "preset": "kampung-sore", "fog": 0.03, "exposure": 1.02, "grain": 0.045, "vignette": 0.25 },
  "cast":    { "aku":   { "asset": "char.male-dewasa-polo", "label": "Aku" } },
  "objects": { "motor": { "asset": "vehicle.motorcycle.bebek" } },
  "meta":  { "author": "…", "notes": "…", "tags": ["…"] },
  "shots": [ /* minimal satu */ ]
}
```

| field | wajib | catatan |
|---|---|---|
| `schema` | ya | harus `studio.story/2` |
| `id` | ya | slug, dipakai sebagai nama komposisi/preview |
| `fps` | tidak | default 30 |
| `width`/`height` | tidak | default 1920×1080 |
| `look` | tidak | grading global (lihat §6) |
| `cast` | kalau ada aktor | aktor yang bisa muncul di banyak shot |
| `objects` | kalau ada objek | kendaraan/prop yang dipindah-pindah |
| `shots` | ya | 1..400 shot, total ≤ 900 detik |

## 2. Shot

```jsonc
{
  "id": "jembatan-01",
  "title": "Jalan kampung, sore",     // opsional, untuk manusia
  "duration": 5,                       // detik, 0.2..120
  "set":    [ { "asset": "road.asphalt.straight", "at": [0,0,0], "rot": 0, "scale": 1 } ],
  "actors": [ { "ref": "aku", "at": [0,0,1.4], "facing": "-Z", "clip": "walk", "speed": 1 } ],
  "objects":[ { "ref": "motor", "at": [-0.6,0,1.0], "rot": -0.1 } ],
  "camera": { "preset": "dolly-in", "from": [0.6,1.5,-5.4], "to": [0.4,1.42,-2.2], "fov": 42 },
  "light":  { "preset": "sore" },
  "audio":  { "vo": "vo/ep1-01.mp3", "ambience": "amb-night" },
  "text":   { "style": "subtitle", "value": "Sore itu aku pulang lewat jalan yang sama." }
}
```

* **Satuan meter, +Y atas, aset menghadap +Z, origin di kaki.**
* `set` = dekorasi statis untuk shot itu (dibangun ulang tiap shot; biaya GPU nol
  karena hanya visibilitas yang di-toggle).
* `actors[].ref` harus ada di `cast`; `objects[].ref` harus ada di `objects`.
* `at` = posisi di lantai (y=0 untuk kaki). `facing` ∈ `+Z -Z +X -X`.
* `clip` harus milik aset itu: `node scripts/studio.mjs clips <asset-id>`.
* `speed` 0.1..4 (pemutaran klip), `offset` detik awal klip.

## 3. Kosakata kamera

Semua kamera dihitung dari `subject` = aktor pertama yang tidak `hidden`
(pusat dadanya, y+1.15). Kamu boleh menimpa dengan `from` / `to` / `target`.

| preset | gerak | parameter tambahan |
|---|---|---|
| `static` | diam | `from` (opsional) |
| `dolly-in` | maju ke subjek | `from`, `to` |
| `dolly-out` | mundur dari subjek | `from`, `to` |
| `pan` | geser menyamping, target tetap | `from`, `to`, `target`, `side` (`+X`/`-X`) |
| `orbit` | busur mengelilingi subjek | `radius`, `startAngle`, `arc` (derajat) |
| `crane-up` | naik vertikal | `from`, `to` |
| `low-angle` | dari bawah, melihat ke atas | `from`, `target` |
| `over-shoulder` | dari belakang bahu | `from`, `target` |
| `handheld` | diam + guncang halus | `shake` (0..3) |
| `follow` | berjalan bersama subjek (untuk aktor `travel`) | `distance` (0,3..30 m), `height` (-2..20 m) |

Umum untuk semua: `fov` (10..120), `roll` (radian), `shake` (0..3).

Gerak memakai `smoothstep`, jadi awal/akhir shot tidak pernah "patah".
Preset `static` dijamin **tidak bergerak sama sekali** (dites).

## 4. Cast & objects

```jsonc
"cast": {
  "aku":    { "asset": "char.male-dewasa-polo", "label": "Aku" },
  "sosok":  { "asset": "entity.pale-standing",  "scale": 1.0 }
}
```

Aset ber-rig (`character`, `entity`) membawa 13 klip:
`idle, walk, run, sit, ride, stand-up, talk, look, point, reach, collapse, float, vanish`.
Non-loop: `sit, stand-up, collapse, vanish` — shot yang lebih panjang dari klipnya
akan berhenti di frame terakhir klip (bukan melompat).

**Anchor** untuk menempelkan props (node kosong di GLB):

| aset | anchor |
|---|---|
| character/entity | `anchor.hand.L/R`, `anchor.head`, `anchor.eye.L/R`, `anchor.foot.L/R` |
| vehicle.motorcycle.bebek | `anchor.seat`, `anchor.grip.L/R`, `anchor.ride-foot.L/R`, `anchor.headlight`, `anchor.rear` |
| vehicle.pickup | `anchor.driver`, `anchor.door.L/R`, `anchor.bed` |

Catatan: three.js membuang titik dari nama node untuk binding animasi
(`anchor.hand.L` → `anchorhandL`). Pakai `findAnchor(root, 'anchor.hand.L')` dari
`src/studio/renderer.js`, jangan `getObjectByName` dengan nama bertitik.

## 5. Teks & audio

`text.style`: `subtitle` (bawah, 46px), `title` (tengah, 96px), `caption`/`sign`
(abu-abu kecil). `value` ≤ 240 karakter, satu shot satu teks.

`audio.vo` harus path publik-relatif aman: `vo/<nama>.mp3|wav|m4a`.
`ambience`/`music`/`sfx` hanya label untuk tahap mixing (belum diputar oleh
renderer).

## 5b. Properti pustaka (Kenney)

Selain id katalog, `set`/`objects` boleh memakai **id pustaka** berawalan
`kenney.` (lihat `docs/LIBRARY.md`): 102 properti CC0 di `public/library/`.
Contoh cerita yang memakainya: `stories/contoh-kenney/story.json`.

```jsonc
"set": [
  { "asset": "kenney.retro-urban.planks", "at": [0,0,0], "rot": 0, "scale": 5 },
  { "asset": "kenney.furniture.desk",     "at": [0.15,0,0.55], "rot": 0.1 }
]
```

Aturan tetap sama: id tak dikenal = error, dan ukuran tiap properti bisa dilihat
di `public/library/index.json` (`bounds.size`, satuan meter, pivot di alas).

## 6. Look & light

`look.preset`: `kampung-siang`, `kampung-sore`, `kampung-malam`,
`interior-lampu`, `hutan-pagi`, `industri`.
`fog` 0..0.2 (eksponensial), `exposure` 0.5..2, `grain` 0..0.3, `vignette` 0..1.

`light.preset`: `siang`, `sore`, `malam`, `lampu-teplok`, `neon`, `bulan`, `fajar`
· `intensity` pengali (default 1) · `color` (opsional, hex string).

## 7. Contoh minimal

```json
{
 "schema": "studio.story/2",
 "id": "contoh",
 "fps": 30,
 "cast": {"aku": {"asset": "char.male-dewasa-polo"}},
 "shots": [{
   "id": "s1", "duration": 4,
   "set": [{"asset": "road.asphalt.straight", "at": [0, 0, 0]}],
   "actors": [{"ref": "aku", "at": [0, 0, 1], "facing": "-Z", "clip": "walk"}],
   "camera": {"preset": "dolly-in", "fov": 42},
   "light": {"preset": "sore"},
   "text": {"style": "subtitle", "value": "Aku pulang."}
 }]
}
```

## 8. Pesan error yang akan kamu temui

| pesan | artinya |
|---|---|
| `unknown field "x"` | typo / field tak didukung — cek tabel di atas |
| `unknown asset "…"` | id salah — `node scripts/studio.mjs list` |
| `clip "…" not in <asset>` | pakai klip yang ada di aset itu |
| `ref "…" is not in cast` | tambahkan dulu ke `cast` |
| `duplicate id` | id shot unik |
| `duration must be 0.2..120 s` | shot terlalu pendek/panjang |
| `audio.vo must be a safe public-relative path` | jangan pakai `../` |

Semua masalah dilaporkan sekaligus (`StoryError.problems`), jadi satu iterasi
bisa memperbaiki semuanya.

## Duduk: `sit` + `prop.chair.wood`

Klip `sit` mengasumsikan kursi setinggi **0,46 m** (pelvis aktor turun ke y≈0,50,
telapak kaki tetap di lantai). `prop.chair.wood` punya permukaan duduk tepat
0,46 m dan punggung di −Z, jadi tempatkan kursi dan aktor di titik yang sama
dengan `rot: 0` dan `facing: "+Z"`:

```json
"objects": [{ "ref": "kursi", "at": [0, 0, 0], "rot": 0 }],
"actors":  [{ "ref": "aku", "at": [0, 0, 0], "facing": "+Z", "clip": "sit" }]
```

Contoh lengkap: `stories/duduk-sore/story.json`; bukti visual (render software,
tanpa engine): `docs/sit-chair-check.png`.

## Aktor berjalan: `travel`

`clip` lokomosi kita **in-place** (tidak ada translasi root ke depan). Supaya kaki
tidak meluncur, geser aktornya sendiri dengan `travel` (meter/detik, 0..6):

```json
{ "ref": "aku", "at": [0, 0, 1.8], "facing": "-Z", "clip": "walk",
  "speed": 0.6, "travel": 1.36 }
```

`speed` adalah **kecepatan pemutaran klip**, `travel` adalah **kecepatan dunia**.
Keduanya harus dikalikan ke angka yang sama: `walk` pada `speed 1` menyiratkan
2,26 m/s, jadi `speed 0,6` ⇒ `travel 1,36` m/s (langkah manusia normal), dan
`run` pada `speed 1` menyiratkan 4,76 m/s. Ukur sendiri dengan:

```
node scripts/qc-motion.mjs            # walk, run, idle
```

## Cek framing sebelum render

Framing tidak bisa ditebak dari angka `from`/`to`/`target` saja, apalagi kalau
aktornya bergerak (`travel`). Ukur:

```
npm run qc:framing                       # semua cerita di stories/<dir>
node scripts/qc-framing.mjs stories/duduk-sore/story.json
```

Keluaran per shot: status, titik acuan, posisi NDC, dan jarak kamera.

| status | arti |
|---|---|
| `ok` | kepala dan dada semua aktor di dalam frame, di 5 titik waktu (u = 0, ¼, ½, ¾, 1) |
| `mepet` | ada kepala terpotong di salah satu titik, atau shot tanpa aktor tak punya isi set di frame |
| `LUAR` | aktor tidak pernah masuk frame sepanjang shot |
| `kosong` | shot tak punya aktor maupun properti untuk diperiksa |

Kaki tidak diwajibkan masuk frame: medium shot normal memotong kaki. Yang dicari
`mepet` adalah kepala terpotong (tidak sengaja) dan kamera yang menempel ke
badan aktor.

`npm run test:studio` menjalankan pemeriksaan yang sama untuk semua cerita, jadi
cerita baru tidak bisa masuk dengan framing rusak.

## Gerak sekunder: `secondary`

Setiap shot punya field `secondary` (0..2, default **1**) yang mengatur lapisan
gerak tambahan di atas klip: napas, ayunan badan yang merambat dengan
keterlambatan per tulang, dan goyangan berat badan yang lambat. Ini yang membuat
pose diam tidak terasa seperti patung.

| nilai | efek |
|---|---|
| `0` | mati — berguna untuk adegan beku atau saat figur harus terasa tidak hidup |
| `1` | normal |
| `1.5`–`2` | dilebihkan — untuk ketegangan atau kamera sangat dekat |

```json
"shots": [
  { "id": "sosok-04", "duration": 4.5, "secondary": 0.35, "actors": [ ... ] },
  { "id": "duduk-02", "duration": 5,   "secondary": 1.4,  "actors": [ ... ] }
]
```

Catatan penting:

* Lapisan ini **bukan** simulasi kain atau rambut. Rig `studio-humanoid-v1`
  tidak punya tulang rambut/kain, jadi keduanya tetap kaku.
* Besarnya diukur, bukan diklaim: pada `walk` kepala bergeser maksimum **24,7 mm**
  (rata-rata 14,9 mm) dan tangan 16,1 mm — lihat keluaran
  `node scripts/test-studio-three.mjs`.
* Pose aktor adalah **fungsi murni dari waktu lokal shot** (tanpa mixer three.js),
  jadi frame yang sama selalu menghasilkan pose yang sama walau Remotion
  merendernya acak dan paralel.

## Menoleh: `lookAt`

Aktor bisa diarahkan memandang aktor lain atau satu titik. Ini yang membuat
adegan dua orang terasa seperti percakapan, bukan dua figur yang menatap lurus
ke depan masing-masing:

```json
"actors": [
  { "ref": "ibu", "at": [0, 0, 1.35], "facing": "+Z", "clip": "talk", "lookAt": "aku" },
  { "ref": "aku", "at": [1.35, 0, 2.35], "facing": "-X", "clip": "sit", "lookAt": "ibu" }
]
```

| nilai `lookAt` | arti |
|---|---|
| `"nama"` | pandang ke kepala aktor lain; aktor itu **wajib** ada di shot yang sama |
| `[x, y, z]` | pandang ke satu titik dunia (mis. layar TV, papan nama, sosok di kejauhan) |
| tidak ada | leher mengikuti klip saja |

Aturannya:

* Sudah ditangani otomatis: kepala lawan bicara dibaca dari **pose terakhirnya**,
  termasuk `travel` — jadi target tetap tepat walau aktornya berjalan.
* Putaran dibatasi: total maksimum **60°** (0,05 rad lebih), naik/turun maksimum
  **±29°**. Target di belakang kepala tidak akan memelintir leher 180°.
* Ini **aim constraint**, bukan IK: hanya leher dan kepala (neck02, neck03,
  head). Tangan dan kaki tetap mengikuti klip; tidak ada penempelan ke properti.
* Bisa digabung dengan `secondary`; menoleh diterapkan setelah gerak sekunder.

Hasil terukur: galat pandang **0,0°** untuk target yang bisa dijangkau, dan
target 91° di samping dipotong ke 60,2° — lihat `node scripts/test-studio-three.mjs`.

## Membawa properti: `hold`

Aktor bisa memegang properti dari `objects`. Properti itu ikut ayunan tangan,
ikutserta saat aktor berjalan (`travel`), dan tidak perlu diletakkan di `set`:

```json
"objects": { "jerigen": { "asset": "prop.jerrycan", "label": "Jerigen" } },
"shots": [{
  "id": "jembatan-01", "duration": 3,
  "actors": [{ "ref": "aku", "at": [0, 0, 1.4], "facing": "-Z", "clip": "walk", "hold": "jerigen" }]
}]
```

| field | arti |
|---|---|
| `hold` | nama di `objects`; properti menempel di tengah telapak |
| `holdHand` | `"R"` (default) atau `"L"` |
| `holdOffset` | geseran `[x, y, z]` **di ruang tangan**, default `[0,0,0]`; pakai untuk menaruh gagang tepat di telapak |

Cara kerjanya: properti ditempelkan ke tulang `metacarpal1` (cadangan `wrist`),
bukan ke node `anchor.hand.*`. Anchor posisinya benar tetapi statis — properti
yang ditempel ke sana akan melayang saat tangan bergerak.

Terukur: properti menempel tepat di tulang (0,000 mm meleset) di sepanjang
ayunan, ikut berpindah 1,36 m saat akar aktor digeser, dan bisa dipasang di
tangan kiri maupun kanan — lihat `node scripts/test-studio-three.mjs`.

Batasnya: orientasi properti mengikuti sumbu tulang tangan. Kalau sebuah
properti terlihat miring, koreksi lewat `holdOffset`; belum ada rotasi per
properti, dan belum ada penyesuaian jari (tangan tidak menggenggam).

## Kamera yang mengikuti: `preset: "follow"`

Shot berjalan biasanya rusak karena aktor makin jauh dari kamera. `follow`
menempatkan kamera di belakang arah hadap aktor pada jarak dan tinggi tetap, lalu
**ikut bergerak bersama `travel`**:

```json
"actors": [{ "ref": "aku", "at": [0, 0, 2], "facing": "-Z", "clip": "walk", "speed": 0.6, "travel": 1.36 }],
"camera": { "preset": "follow", "distance": 4.2, "height": 1.45, "fov": 40 }
```

Diuji: jarak kamera ke subjek tetap sepanjang shot (selisih < 1 mm) dan
perpindahan kamera sama dengan perpindahan aktor (1,36 m/s × durasi). Kalau
aktornya tidak punya `travel`, kamera diam — tidak ada gerak yang mengada-ada.
Contoh hidup: `stories/<dir>/uji-kamera.json` shot `kamera-10`.
