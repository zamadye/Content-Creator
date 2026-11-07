# Thumbnail

`raw/` = latar dari model gambar, sengaja **tanpa teks** (model mengarang huruf).
`*.jpg` di folder ini = hasil final: headline ditempel kode lewat
`scripts/make-thumbnail.mjs`, jadi ejaannya dijamin.

Berkas inilah yang dipasang manual di YouTube Studio — API kanal ini tidak
mengizinkan pemilihan thumbnail, jadi frame 0 video tetap thumbnail bawaan.

| Berkas | Video | Headline |
|---|---|---|
| `ll-0001-a.jpg` | Kanal 16 Tidak Boleh Ditinggal | KANAL 16 / MASIH MENJAWAB |
| `ll-0001-b.jpg` | Kanal 16 Tidak Boleh Ditinggal | YANG MENJAWAB / SUDAH TENGGELAM |
| `ll-0002-a.jpg` | Dua Belas Meter | TANAH INI KURANG / 12 METER |
| `ll-0002-b.jpg` | Dua Belas Meter | MAKAM ITU / TIDAK ADA DI PETA |

Batas YouTube 2 MB per berkas — skrip menolak kalau lewat.
