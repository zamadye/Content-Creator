# WARUNG HUJAN

**Naskah pendek · 1 menit 35 detik · 18 shot · 3 tokoh + narator**

> Logline: Nisa sudah memutuskan berhenti sekolah untuk menjaga warung Bu Sri.
> Sore itu hujan menahan Bayu di warung, dan tiga gelas teh mengubah keputusan
> itu.

| | |
|---|---|
| Bu Sri | 60-an, pemilik warung · `char.female-lansia` |
| Nisa | 17, kelas XI · `char.remaja-perempuan` |
| Bayu | 17, teman sekelas · `char.remaja-laki` |
| Narator | suara luar, 4 kalimat, tanpa wajah |

**Lokasi:** warung Bu Sri di pinggir jalan kampung — sore gerimis, lalu malam.
**Warna:** `kampung-sore` (shot 1–14) → `kampung-malam` (shot 15–18).
**Cahaya:** `sore` → `lampu-teplok` → `malam`.

---

## 1. WARUNG — SORE, GERIMIS · 6 s
*Wide, dolly-in lambat (fov 40), dari jalan ke teras warung. Bu Sri duduk di
meja depan; Nisa berdiri membereskan gelas di dekat jendela warung. Jalan masih
basah dari hujan sebelumnya.*

**NARATOR** — Di kampung ini hujan selalu datang lewat pukul empat. Dan warung
Bu Sri selalu buka lebih dulu.

## 2. INSERT: MEJA · 4 s
*Static, dekat (fov 32). Lampu teplok, dua gelas kosong, kayu meja yang sudah
tua. Tidak ada dialog — biarkan ambience hujan bekerja.*

## 3. JALAN DEPAN WARUNG · 4 s
*Bayu datang berjalan cepat dari arah jalan, rambut dan bahunya basah.*

**BAYU** — Bu Sri! Teh manis satu—yang panasnya nggak main-main.

## 4. INSERT: TEH DITUANG · 4 s
*Static, rendah (fov 30). Teh dituang ke gelas, uap tipis naik.*

**NARATOR** *(sambil lalu)* — Bu Sri menuang tanpa bertanya dua kali.

## 5. BU SRI · 5 s
*Medium, static (fov 34). Bu Sri menoleh ke arah pintu.*

**BU SRI** — Duduk dulu, Bayu. Hujan belum mau pulang.

## 6. NISA · 5 s
*Medium dekat (fov 36). Nisa sudah duduk di sisi meja, gelas di tangan, dilihat
dari sudut Bayu.*

**NISA** — Bu... Nisa udah mikir dari minggu lalu.

## 7. BAYU · 4 s
*Medium (fov 36). Bayu menoleh dari gelasnya.*

**BAYU** — Mikir apa?

## 8. NISA · 6 s
*Dolly-in pelan ke wajah Nisa (fov 30). Ia meletakkan gelas.*

**NISA** — Nisa nggak daftar tahun ini. Warung nggak bisa ditinggal sendirian.

## 9. INSERT: DUA GELAS · 3 s
*Static (fov 30). Uap. Hening tiga detik — ini jeda yang harus terasa.*

## 10. BU SRI BERDIRI · 5 s
*Medium (fov 34). Kursi bergeser, Bu Sri berdiri. Bukan marah — cuma capek
mendengar kalimat itu.*

**BU SRI** — Siapa bilang warung ini butuh kamu di sini?

## 11. NISA · 4 s
*Medium dekat (fov 30). Nisa tidak menatap Bu Sri.*

**NISA** — Kaki Ibu sakit. Nisa lihat tiap pagi.

## 12. BU SRI · 6 s
*Medium dekat (fov 30), kamera sedikit di bawah mata Bu Sri.*

**BU SRI** — Kaki Ibu pegal karena berdiri sejak subuh — bukan karena kamu
sekolah. Besok bawa fotokopi KK ke sekolah.

## 13. BAYU · 4 s
*Medium (fov 30). Bayu menoleh ke Nisa, setengah tersenyum.*

**BAYU** — Aku anterin. Sepeda.

## 14. NISA · 5 s
*Medium dekat (fov 34). Nisa menunduk, lalu mengangguk — pelan.*

**NISA** — ...iya, Bu.

## 15. JALAN — MALAM · 5 s
*Dari aspal basah ke arah warung yang menyala (fov 40), tiang listrik dan papan
nama di tepi jalan. Tanpa aktor.*

**NARATOR** — Malam itu hujan tidak jadi deras.

## 16. DUA SHOT: NISA & BAYU · 6 s
*Dolly-out (fov 48), `interior-lampu` (malam di teras). Dua gelas sudah
setengah, dua anak itu duduk berhadapan.*

**NARATOR** — Tapi ada satu hal yang berubah: ada yang akhirnya mengangguk.

## 17. INSERT: LAMPU · 4 s
*Static dekat (fov 28). Nyala lampu teplok, malam. Tanpa dialog.*

## 18. WARUNG — CLOSING · 6 s
*Crane-up (fov 54). Warung menyala, jalan gelap, hujan belum berhenti.*

**TITLE** — WARUNG HUJAN

---

### Catatan produksi

* Semua diambil di satu set: `building.shop.warung` + dua `prop.table.wood`
  + tiga `prop.chair.wood` + `prop.lamp.teplok` + `kenney.food.cup-tea`, di
  **teras depan** warung (z≈4,9–5,6). Bangunan warung jadi latar; kamera duduk
  di sumbu jalan (z≈7–9) supaya kounter/jendela yang menyala terlihat di
  belakang para tokoh.
* Tokoh yang duduk memakai klip `sit` dengan `offset` 1,95 s (pose duduk
  ditahan); `stand-up` hanya di shot 10. Semua aktor duduk memakai
  `secondary` 1,25–1,35 sebagai napas/gerak halus, dan `lookAt` untuk arah
  pandang.
* Adegan = `stories/warung-hujan/story.json` (komposisi `StudioWarungHujan`),
  dibangun tangan karena importer `naskah:import` belum bisa menyimpan
  `lookPreset` per shot, `secondary`, `lookAt`, dan dua `hold` di satu shot.
* Perintah cek: `node scripts/studio.mjs validate stories/warung-hujan/story.json`
  lalu `node scripts/qc-framing.mjs stories/warung-hujan/story.json`.
* Perintah render: `npm run render:studio -- StudioWarungHujan`.

### Bukti render (Chromium + WebGL2, skala 0,4)

`node scripts/qc-webgl-shots.mjs` belum memuat komposisi ini, jadi still
diambil langsung dengan Remotion:

| frame | shot | file |
|---|---|---|
| 90 | 1 · warung-01 | `docs/warung-hujan/warung-hujan-f90.png` |
| 360 | 3 · bayu-datang-03 | `docs/warung-hujan/warung-hujan-f360.png` |
| 600 | 5 · busri-05 | `docs/warung-hujan/warung-hujan-f600.png` |
| 900 | 7 · bayu-07 | `docs/warung-hujan/warung-hujan-f900.png` |
| 1080 | 8 · nisa-08 | `docs/warung-hujan/warung-hujan-f1080.png` |
| 1400 | 10 · busri-10 | `docs/warung-hujan/warung-hujan-f1400.png` |
| 1740 | 13 · bayu-13 | `docs/warung-hujan/warung-hujan-f1740.png` |
| 2040 | 15 · jalan-15 | `docs/warung-hujan/warung-hujan-f2040.png` |
| 2220 | 16 · dua-shot-16 | `docs/warung-hujan/warung-hujan-f2220.png` |
| 2520 | 18 · warung-18 | `docs/warung-hujan/warung-hujan-f2520.png` |

Denah tata letak: `docs/plans/warung-hujan.png` (`node scripts/qc-plan.mjs`).

```
node scripts/studio.mjs validate stories/warung-hujan/story.json   # ok
node scripts/qc-framing.mjs stories/warung-hujan/story.json        # 18 shot, 0 perlu perhatian
node scripts/qc-plan.mjs stories/warung-hujan/story.json           # 0 masalah tata letak
```
