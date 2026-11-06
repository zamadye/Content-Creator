# Catatan encode — LL-0002 (9:58,3)

## Masalahnya angka, bukan selera

| | |
|---|---|
| Batas QC & batas `make-publish-request` | **40 MB** |
| Durasi LL-0002 | **598,3 detik** |
| Berarti bitrate total | 40 × 8 × 1024 / 598,3 = **548 kbps** |
| Audio AAC stereo | 96 kbps |
| Sisa untuk video | **±452 kbps** |

Bandingkan dengan episode panjang pendek sebelumnya:

| | Durasi | Ukuran | Bitrate |
|---|---|---|---|
| LS-0010 (Short, acuan) | 54,2 s | 32,5 MB | **4.912 kbps** |
| LL-0002 kalau pakai bitrate LS-0010 | 598,3 s | **359 MB** | 4.912 kbps |

Jadi batas 40 MB berasal dari dunia Short. Untuk video 10 menit, angka itu
meminta bitrate **sepersebelas** episode acuan. Konsekuensinya harus dipilih
sadar, bukan ditemukan setelah render 2 jam.

## Tiga pilihan

**A. Tetap < 40 MB (aman untuk semua gerbang sekarang)**
`crf 27`, `maxrate 520k`, `bufsize 1040k`, grain overlay dimatikan saat encode,
audio 96 kbps. Gambar 1080p yang hampir seluruhnya diam akan bertahan; yang
paling dulu rusak adalah tekstur grain dan gerakan lambat. Perkiraan ukuran
32–38 MB.

**B. Longgarkan batas untuk format panjang (mis. 120 MB)**
Kualitas setara LS-0010 (±4,5 Mbps), ukuran ±340 MB — tidak realistis untuk
disimpan di git; hanya masuk akal kalau berkas rilis tidak lagi di-commit dan
workflow mengambilnya dari Drive. Itu perubahan aturan distribusi, bukan
keputusan teknis kecil.

**C. Turunkan resolusi**
1280×720 pada 900 kbps memberi kualitas gambar lebih baik daripada 1080p pada
452 kbps, tapi melanggar aturan 1080p untuk video panjang (ATURAN 1.1).

## Usulan saya

**A**, dengan dua syarat yang harus diuji, bukan diasumsikan:

1. Encode uji 60 detik dari hasil render, ukur ukuran dan lihat apakah grain
   masih terbaca. Kalau rusak, grain dimatikan dan diganti vignette saja.
2. Setelah encode penuh, hitung ulang: kalau hasilnya 38–40 MB (mepet), turunkan
   `crf` satu langkah sebelum masuk antrean — jangan mengandalkan keberuntungan.

**Yang tidak boleh terjadi:** render 17.948 frame selesai, lalu encode gagal
karena 45 MB, dan tidak ada waktu mengulang sebelum jadwal 13.00 WIB.
