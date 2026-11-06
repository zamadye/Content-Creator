# Drive — satu-satunya arsip video

Arahan pemilik kanal 2026-11-06: **"hanya Drive yang dibiarkan"**. Repo tidak
lagi menyimpan video yang sudah terbit, dan tidak menyimpan gambar episode lama.

## Struktur folder

```
THE LAST SIGNAL/
├── 01 Pratinjau (belum terbit)/   video yang menunggu diunggah atau menunggu ditonton
└── 02 Arsip (sudah terbit)/       video yang sudah tayang di YouTube + Facebook
```

Dua folder, bukan lebih. Jumlah folder bertambah hanya kalau ada jenis berkas
baru yang tidak bisa ditebak dari namanya (saat ini tidak ada).

## Nama berkas

```
<EPISODE-ID> — <Judul> (<penanda versi>, <durasi>).mp4
```

Contoh: `LS-0010 — Lantai Sembilan Belas (desain v1, 54s).mp4`

Judul di nama berkas **tidak** memakai judul SEO unggahan (yang panjang dan
berubah-ubah). Yang dipakai judul cerita, supaya folder Drive tetap terbaca
setahun kemudian ketika judul unggahan sudah diganti.

## Aturan pindah folder

| Kejadian | Tindakan |
|---|---|
| Render lolos QC | unggah ke **01 Pratinjau** |
| Unggahan YouTube + Facebook sukses | pindahkan berkas ke **02 Arsip** |
| Revisi desain (v2, v3) | berkas baru; versi lama tetap di Arsip, jangan ditimpa |
| Video dihapus dari kanal | berkas tetap di Arsip, beri keterangan di deskripsi Drive |

## Apa yang masih boleh ada di repo

| Boleh | Tidak boleh |
|---|---|
| kode, skrip, kontrak, workflow | video hasil render |
| `assets/characters` + `assets/audio/horror` (pustaka bersama) | gambar adegan episode yang sudah terbit |
| episode yang **sedang dikerjakan** (sumber + gambar + audio) | episode yang sudah terbit |
| `releases/<id>.mp4` **hanya** selama berkas itu menunggu diunggah | arsip `releases/` untuk video lama |
| `publish-queue/*.json` yang menunggu dijalankan | riwayat permintaan lama |

Ukuran repo dijaga di bawah ±50 MB di luar `node_modules`. Kalau sebuah episode
akan membengkakkan repo lebih dari itu, episode itu sudah waktunya diarsipkan ke
Drive dan dihapus dari repo.

## Kenapa begitu

Repo dipakai dua hal yang saling bertentangan: **riwayat keputusan** (butuh teks
dan diff) dan **penyimpanan media** (butuh tempat besar). Git buruk untuk yang
kedua: setiap versi video 30 MB menambah ukuran `.git` selamanya, walau berkasnya
kemudian dihapus. Drive menangani media; git menangani keputusan.

Efek samping yang diinginkan: repo ini bisa dibaca dari atas ke bawah dalam satu
duduk — satu episode aktif, satu alur, satu cara kerja.
