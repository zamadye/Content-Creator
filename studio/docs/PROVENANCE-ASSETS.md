# PROVENANCE — Aset Studio v2

Ringkas: **semua mesh dan tekstur di `public/assets/` dibuat oleh pipeline ini**,
kecuali mesh + skeleton manusia/entitas yang berasal dari basis data MakeHuman
(CC0). Tidak ada tekstur, model, atau audio pihak ketiga yang tidak berlisensi.

## 1. Basis manusia & entitas

| sumber | lisensi | dipakai untuk |
|---|---|---|
| `public/makehuman/rigged-body.json` (basis MakeHuman) | CC0-1.0 | mesh tubuh + 163 tulang untuk `char.*` dan `entity.*` |
| `public/makehuman/entity-head.obj` | CC0-1.0 | kepala entitas |

Lihat `public/makehuman/PROVENANCE.md` untuk rincian asal CC0 tersebut.
Bentuk tubuh diubah oleh `forge/human.py` (`shape()`); tekstur kulit, mata,
rambut, pakaian, dan seluruh animasi dihasilkan pipeline ini.

## 2. Pakaian

`public/garments/*.json` + `*.jpg/webp` — paket pakaian CC0 yang sudah ada di
repositori. Tekstur difoto studio dipakai sebagai **albedo mentah**, lalu
dikoreksi luminansinya (`GARMENT_LUMA`) supaya masuk akal secara fisik. Tidak ada
tekstur baru yang diunduh.

## 3. Lingkungan (41 aset)

Seluruhnya prosedural, dihasilkan `forge/tex.py` dari seed tetap:

| kategori | jumlah | contoh |
|---|---|---|
| road | 7 | aspal lurus/basah/tikungan/T/cross, tanah, trotoar |
| nature | 9 | karet, beringin, kelapa, pisang, pohon mati, pakis, rumput, batu, batang tumbang |
| building | 9 | rumah kampung, rumah tua, warung, gudang, kos + 4 modul `kit.*` |
| prop | 14 | meja, kursi, rak, kasur, kompor, lampu teplok, drum, karung, peti, jeriken, jemuran, papan |
| vehicle | 2 | motor bebek (dengan anchor duduk), pikap |

Semua teks di papan (`prop.signboard`, `road.prop.signpost`) digambar dengan font
default Pillow — bukan aset font berlisensi.

## 4. Kebaruan dan determinisme

* Setiap tekstur memakai seed tetap; hasil build identik antar-jalan.
* `public/assets/registry.json` mencantumkan `provenance` dan `license` per aset.
* Status kualitas (`review`/`draft`) dicatat jujur di registry dan
  `docs/ASSET-CATALOG.md`.

## 5. Audio

Belum ada audio baru. Mixing memakai `scripts/mix-story-guide.sh` dan aset yang
sudah ada; `studio.story/2` hanya menyimpan **referensi** path (`vo/...`).
