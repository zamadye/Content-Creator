# PANDUAN AGEN — dari id aset ke film

Dokumen ini untuk agen (atau manusia) yang membuat adegan tanpa menyentuh kode
renderer. Semua yang dibutuhkan ada di dua tempat:

* `public/assets/registry.json` — katalog (sumber kebenaran)
* `docs/STORY-FORMAT.md` — bahasa cerita

## Katalog karakter sebelum casting

Buka `npm run preview` untuk menguji satu GLB dalam cahaya netral. Periksa siluet
dari depan, samping dan belakang, lalu wajah, tangan, dan kaki. Putar klip yang
akan dipakai, jeda di kontak kaki atau tekukan sendi, dan periksa apakah pakaian
menembus badan. Perbaiki sumber model, bangun ulang GLB, lalu ulangi uji
pada sudut dan frame yang sama. Lembar pemeriksaan putaran pertama ada di
[Ulasan karakter](Ulasan-Karakter.pdf).

Catatan bersama berada di `data/character-reviews.json`. Setelah inspeksi, isi
`note`, status (`draft`, `review`, atau `approved`), dan SHA-256 GLB yang diuji
(dari `sha256sum <berkas.glb>`). Jalankan `python3 studio-forge/build.py --registry-only`.
Ulasan hanya berlaku untuk isi GLB tersebut. Varian kostum adalah aset tersendiri.

Mulai cerita dengan pemeran dari katalog yang sudah lulus. Jalankan
`node scripts/studio.mjs production stories/<dir>/story.json` untuk memeriksa
cast setelah resolusi outfit. `render:studio:h264` menjalankan pemeriksaan ini
sebelum render final. Arsip adegan dan `render:studio` tersedia untuk pratinjau.

## 1. Alur kerja (5 langkah)

```bash
# 1. cari aset
node scripts/studio.mjs list --category nature
node scripts/studio.mjs list --query lampu --json

# 2. lihat klip yang tersedia untuk aktor
node scripts/studio.mjs clips char.male-dewasa-polo

# 3. tulis cerita (JSON), lalu validasi
npm run naskah:import -- stories/<dir>/naskah/<file>.naskah.md   # naskah → story.json
node scripts/studio.mjs validate stories/adegan-baru/story.json

# 4. periksa biaya & struktur sebelum render
node scripts/studio.mjs plan stories/adegan-baru/story.json

# 4b. periksa tata letak: kamera menembus geometri? aktor bertumpuk?
npm run qc:plan            # ukur + tulis docs/plans/<cerita>.json
npm run qc:plan:png        # gambar denah tampak atas -> docs/plans/<cerita>.png

# 5. render produksi (Remotion)
STUDIO_COMPOSITION=StudioJalanPulang npm run render:studio:h264
```

`studio.mjs new <id>` membuat kerangka cerita siap-validasi.

## 2. Aturan yang tidak boleh dilanggar

| aturan | kenapa |
|---|---|
| satuan **meter**, **+Y** atas, aset menghadap **+Z**, origin di **kaki** | kalau tidak, aktor mengambang/tertanam |
| id aset hanya dari registry | GLB dimuat lewat `uri` di registry |
| `clip` hanya yang ada di aset itu | mixer jatuh ke klip 0 kalau tidak ketemu |
| jangan pakai `../` di `audio.vo` | validator menolak (keamanan path) |
| shot 0.2..120 detik, total ≤ 900 detik | satu file = satu cerita |
| field tak dikenal = error | supaya typo ketahuan, bukan diabaikan |
| matriks 4×4 untuk glTF **wajib** di-transpose sebelum flatten (`glb.py`) | glTF kolom-mayor, numpy baris-mayor; kalau lupa, IBM rusak dan semua vertex berputar di titik nol |
| aktor dengan klip `walk`/`run` wajib punya `travel` ≈ `speed` × stride (walk 2,26 m/s, run 4,76 m/s) | klip lokomosi in-place; tanpa `travel` kaki meluncur |
| setiap habis mengubah `camera`/`at`/`travel`, jalankan `npm run qc:framing` (dan `npm run qc:motion` kalau klip lokomosi berubah) | framing diukur, bukan ditebak; tanpa browser tidak ada cara lain melihat kepala terpotong |
| setiap habis mengubah `set`/`objects`/`camera`, jalankan `npm run qc:plan` | mengukur jarak kamera ke segitiga asli + tabrakan aktor; angka, bukan dugaan |
| jangan menambah status ✅ di `docs/PIPELINE-AUDIT.md` tanpa bukti yang bisa dijalankan | tabel ringkasan dihitung ulang oleh `node scripts/audit-count.mjs` dan dijaga tes `audit-summary` |
| attachment memakai `anchor.*` (tangan/kaki/kepala/mata); posisinya absolut di ruang rig, bukan lokal tulang | bug lama: semuanya diekspor di (0,0,0) karena membaca `translation`, bukan `p` |
| properti yang dibawa pakai `hold` (bukan `objects` terpisah) | `objects` statis tidak ikut tangan; `hold` menempel ke tulang metacarpal |
| adegan dua orang: beri `lookAt` di kedua aktor | tanpa itu keduanya menatap lurus ke depan klip, percakapan terasa hampa |
| jangan pernah memakai `THREE.AnimationMixer.setTime()` di renderer; pakai `createClipSampler` | `setTime` bergantung pada riwayat pemanggilan (menyimpang 13,8 cm pada `walk`), sedangkan Remotion merender frame acak/paralel — pose wajib fungsi dari waktu |
| offset pakaian per lapisan (kaus 0,062 · jaket 0,048 · celana 0,026) | kalau sama, celana menembus kaus dan muncul gerigi di hem |
| translasi node = `p − parent.p` | `p` di rig adalah posisi absolut, bukan lokal |
| `sit` mengasumsikan kursi 0,5 m; jangan taruh aktor duduk di lantai tanpa prop | pantat aktor berada di y≈0,50 saat `sit` |
| `spec["shroud"].y_top/y_bottom` memakai ruang "0 = kaki, tinggi 7,32 unit"; `spec["veil"]` memakai unit mentah MakeHuman | `character.build` mengonversi shroud, veil tidak — kalau tertukar, kain berhenti di pinggang |

## 3. Merancang shot yang enak ditonton

* **Satu ide per shot.** Kalau perlu dua ide, pecah shot-nya.
* **Aktor berjalan → `camera.preset: "follow"`.** `dolly-*` diam di tempat,
  jadi aktor yang punya `travel` akan keluar frame atau mengecil.
* **Gerak kamera punya arah.** `dolly-in` = mendekat (intim), `dolly-out` =
  meninggalkan (sepi), `crane-up` = menutup babak.
* **Jangan taruh kamera di dalam geometri.** Jarak aman minimal 1.2 m dari aktor
  untuk fov 40, 2 m untuk fov 30. Setelah mengubah `set`/`objects`/`camera`,
  jalankan `npm run qc:plan` — skrip ini mengukur jarak kamera ke **segitiga
  asli** aset di 9 titik per shot (batas 0,12 m) dan jarak antar-aktor
  (batas 0,45 m). `docs/plans/<cerita>.png` memperlihatkan denahnya: kotak set,
  properti, jalur kamera, dan arah hadap aktor.
* **Ukur framing.** `node scripts/qc-framing.mjs [cerita.json]` memproyeksikan
  kepala + dada aktor di 5 titik waktu sepanjang shot; `LUAR` berarti aktor tak
  pernah masuk frame, `mepet` berarti kepala terpotong. Kaki boleh terpotong
  (medium shot), jadi tidak diperingatkan. `npm run test:studio` ikut menjalankan
  pemeriksaan ini untuk semua cerita.
* **Satu sumber cahaya per adegan malam.** `light.preset: "lampu-teplok"` +
  `look.preset: "interior-lampu"` sudah cukup; menambah intensitas hanya
  membakar highlight.
* **Durasi bicara**: ~2.4 kata/detik bahasa Indonesia. Subtitle 12 kata ≈ 5 detik.
* **Waktu diam** (2–3 detik tanpa dialog) setelah beat emosional hampir selalu
  memperkuat, bukan melemahkan.

## 4. Menambah aset ke perpustakaan

1. Tulis builder di `studio-forge/forge/env_<kategori>.py`:

```python
def bench_wood():
    b, ms = Builder(), std_mats()
    b.add_box("wood", (0, 0.42, 0), (1.4, 0.06, 0.34), 1.0)
    ...
    return b, ms

ASSETS["prop.bench.wood"] = dict(build=bench_wood, title="Bangku kayu",
                                 tags=["furniture"], category="prop")
```

2. Build + QC:

```bash
python studio-forge/build.py --only prop.bench.wood
# lihat public/assets/prop/prop.bench.wood/thumbnail.png
```

3. Registry, katalog, dan modul JS (`src/studio/registry.generated.js`)
   ikut ditulis ulang otomatis, lalu jalankan `npm run test:studio`.
5. jalankan `npm run qc:topology -- --write` lalu `npm run qc:topology`. Kalau
   aset baru melewati anggaran kategori di `docs/TOPOLOGY-PLAN.md`, pilihannya
   hanya dua: turunkan detail geometri, atau naikkan anggaran **beserta
   alasannya**. Pagar ini sengaja bisa gagal.

Aturan builder:

* meter; aset berdiri di `y=0`; menghadap `+Z`; pusat di `x=z=0`.
* material **wajib** punya `base` (sRGB) + `normal` + `orm` (R=AO, G=rough,
  B=metal) — test akan gagal kalau tidak.
* `ASSETS[id] = dict(build=<fn>, title=…, tags=[…], category=…)`;
  builder mengembalikan `(builder, materials[, anchors])`.
* hindari geometri degenerate (silinder dengan p0 == p1, torus tanpa radius):
  normal jadi NaN dan bounding box meledak — ini pernah merusak satu kendaraan.

## 5. Status jujur perpustakaan

| kategori | jumlah | status | catatan |
|---|---|---|---|
| character | 16 | review | 163 tulang, 13 klip, PBR kulit/rambut/baju; jahitan lengan jaket masih terlihat |
| entity | 5 | draft | 166 tulang (163 + rantai kain `cloth01–03`), 13 klip, kain berayun prosedural; siluet kafan/kerudung masih kasar, rambut kaku |
| building | 9 | review | atap pelana benar; interior kosong (butuh prop) |
| road | 7 | review | marka + trotoar; belum ada varian rusak/berlubang |
| nature | 9 | review | daun masih kartu besar, bukan daun individual |
| prop | 14 | review | siluet terbaca; teks papan sudah dicat |
| vehicle | 2 | draft | motor bebek terbaca; pikap masih kotak-kotak |

Untuk karakter dan entitas, status `approved` pada versi GLB yang diuji diperlukan untuk render produksi. Aset latar berstatus `draft` masih dapat dipakai untuk blockout.

## 6. Batas yang diketahui

* Tidak ada Blender/`ffmpeg` di lingkungan ini: model dibuat prosedural di Python.
* Renderer QC = path tracer sederhana di `studio-forge/forge/render.py`
  (tanpa GI, tanpa AA agresif) — thumbnail bagus ≠ film bagus.
* `StudioStory` (three.js) belum diverifikasi di browser pada sesi ini; jalur
  yang **sudah** diuji adalah katalog, skema, kompilasi, dan validasi GLB.
* Audio hanya metadata (`vo`/`ambience`); mixing tetap lewat `scripts/mix-story-guide.sh`.

## 7. Kalau macet

| gejala | cek |
|---|---|
| validator menolak field | `docs/STORY-FORMAT.md` §8 |
| aset tidak muncul di render | `node scripts/studio.mjs plan <story>` → daftar aset & byte |
| aktor mengambang | `at[1]` harus 0 (origin di kaki) |
| aset terlihat gelap | `light.preset` + `look.exposure`; bukan masalah material |
| GLB gagal dimuat | `node scripts/studio.mjs inspect <file.glb>` |

## Karakter

Semua tokoh manusia berasal dari satu mesh + satu rig (`docs/CHARACTERS.md`).
Jangan menulis tokoh baru dari nol: tambah satu baris di `SPECS`
(`studio-forge/forge/character.py`) dengan `profile` umur (`dewasa`, `lansia`,
`remaja`, `anak`, `balita`), tinggi, morph, kulit, rambut, dan `outfit`.
Kostum ditukar dari naskah lewat `cast.<ref>.outfit` — bukan dengan membuat GLB
baru.

