# Tokoh dan entitas — bible visual

> Arahan pemilik kanal, 2026-11-06: **"visual character"**, **"visual setan
> hantu"**, **"suara SFX"**, dan **"subtitle di tengah layar"**.

Sebelum ini tidak ada tokoh sama sekali. Sepuluh Short yang terbit hanya berisi
tempat: lorong, pasar, lift, kamar kos. Tidak ada orang yang bisa ditemani
penonton, dan tidak ada makhluk yang bisa dilihatnya. Horor yang tidak punya
wajah tidak punya sesuatu untuk ditakuti.

## Dua tokoh tetap

Berkas acuan ada di `assets/characters/`. Yang dipakai adalah **deskripsinya**
(`promptCore` di `characters.json`), disalin ke setiap prompt adegan dan
ditempelkan sebagai referensi gambar supaya wajah, pakaian, dan proporsinya
sama dari shot ke shot.

| Id | Berkas | Peran | Aturan keras |
|---|---|---|---|
| `protagonis` | `protagonis-punggung.png` | orang kedua — penonton | selalu dari belakang/samping, **wajah tidak pernah terlihat**, jaket hijau tua, tas kanvas, sandal |
| `entitas-penunggu` | `entitas-penunggu.png` | makhluk utama | sangat tinggi, kurus, kain basah, rambut menutup wajah, **wajah kosong tanpa mata dan mulut**, berdiri diam seperti menunggu |
| `entitas-bayangan` | — | varian jauh | siluet di ujung lorong, dibuat dari referensi entitas |

Keputusan yang disengaja:

- **Wajah protagonis tidak pernah memperlihatkan wajah** supaya penonton bisa
  menempatkan dirinya. Ini alasan yang sama kenapa narasi memakai "kamu".
- **Entitas tidak pernah melompat atau membuka mulut.** Yang menakutkan adalah
  benda yang berdiri diam di tempat yang tidak seharusnya ada. Lompatan
  diserahkan ke jumpscare satu kali di akhir.
- **Tidak ada darah dan tidak ada tubuh rusak** — YouTube membatasi; dan
  kengerian yang tidak terlihat bertahan lebih lama di kepala penonton.

## Aturan penempatan per episode

1. Tokoh utama terlihat di **minimal dua shot** — bukan hanya POV kosong.
2. Entitas muncul **tiga kali, makin dekat**: siluet/bagian tubuh → setengah
   badan → utuh. Kemunculan utuh hanya sekali, di frame jumpscare.
3. Setiap kemunculan entitas punya **suara**: `sfx_desahan_iblis` atau
   `sfx_geraman_setan` untuk kemunculan awal, `sfx_teriakan` sekali di puncak.
4. Kamera tidak pernah mengejar entitas. Kamera yang ditarik pelan ke belakang
   lebih menakutkan daripada kamera yang mendekat.

## Cara memakai saat membuat gambar adegan

```
promptCore tokoh + promptLingkungan + deskripsi shot
```

Contoh untuk adegan "kamu melihat ke ujung lorong":

> young Indonesian man seen from behind only, worn dark green jacket, grey
> canvas backpack, phone flashlight in right hand, standing in an old boarding
> house corridor at night, staring down the hallway — at the far end, mostly
> silhouette, a very tall thin figure in a wet grey garment standing perfectly
> still, no face detail, single bare bulb blowing out, 35mm film grain

Berkas acuan (`protagonis-punggung.png`, `entitas-penunggu.png`) disertakan
sebagai referensi gambar setiap kali membuat shot baru, supaya tidak berubah
wajah antar episode.

## Subtitle

Subtitle sekarang **di tengah layar** (bukan di bawah): 900 px lebar, 74 px,
tebal 900, garis luar 12 px. Kata yang sedang diucapkan menyala kuning
(`#f5c451`), kata yang belum diredupkan ke 82%. Alasan: di ponsel, mata
berhenti di tengah layar, dan teks bawah sering tertutup ibu jari serta UI
YouTube.
