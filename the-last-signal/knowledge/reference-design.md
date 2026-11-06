# Bedah teknis referensi: "The true story of the 1876 haunted house"

Berkas: `The true story of the 1876 haunted house😱 #scarystories.mp4`
(commit `c639a75`, 1.188.919 byte). Diukur langsung dari berkasnya, bukan dari
kesan menonton.

## Berkasnya

| | |
|---|---|
| Durasi | 25,29 s |
| Resolusi | 360×640 (9:16) — kecil, hasil unduhan ulang |
| Frame rate | 30 fps |
| Video | h264 Main, 243 kbps |
| Audio | AAC 128 kbps, 44,1 kHz stereo, −23,7 LUFS, true peak −8,1 dBTP, LRA 1,8 |

Gambarnya bergaya ilustrasi datar (bukan foto): rumah gelap dengan pintu merah
menyala, tokoh kartun dengan mata besar. Palet: biru-navy tua, merah menyala
hanya di pintu/objek penting, hijau untuk teks penghitung di bawah.

## 1. Pergeseran foto — jawabannya: tidak ada

Ini bagian yang paling mengejutkan. Saya ukur perpindahan antar frame dengan
korelasi fase subpiksel (puncak parabola, akurasi ±0,05 px) pada resolusi asli
360×640:

- **median pergeseran per frame di dalam satu shot: 0,000 px** pada sumbu x
  maupun y;
- p90 |dy| = 0,027 px; tidak ada drift yang konsisten ke satu arah;
- pencarian skala (0,99–1,02) juga tidak menemukan zoom yang konsisten.

Artinya kamera **diam**. Tidak ada Ken Burns, tidak ada pan, tidak ada zoom
perlahan. Yang bergerak hanya dua hal lain:

1. **Isi gambarnya sendiri** — tokoh kartun berkedip/bergerak, api di pintu
   bergetar (MSE antar frame median 415 dari 65.025, jadi frame tidak identik,
   tetapi gerak kameranya nol);
2. **Potongan gambar** — 25 pergantian adegan terdeteksi pada ambang scene 0,3
   dalam 25,29 detik → **rata-rata satu shot ±1,0 detik** (ada yang 0,3 detik,
   ada yang 5 detik).

Jadi "pergerakan" yang terasa hidup itu berasal dari **irama potong + teks**,
bukan dari kamera. Ini kebalikan dari cara kita: kita memakai zoom pelan 8–10
detik per shot.

**Yang kita ambil untuk Shorts:** potong lebih rapat (target 1,2–1,8 detik per
shot, bukan 2 detik), dan biarkan efek atmosfer (hujan, debu, statik) yang
memberi gerak di dalam frame. Zoom pelan tetap dipakai untuk video panjang,
karena di sana penonton menonton 9 menit, bukan 25 detik.

## 2. Subtitle — satu kata per kartu, di tengah

Diukur dari frame-frame yang ditarik pada resolusi penuh:

| Unsur | Nilai terukur |
|---|---|
| Isi kartu | **satu kata** ("HOUSE", "YOUTUBERS", "A") |
| Posisi | tengah horizontal; pusat vertikal **±47–50% tinggi layar** |
| Huruf | kapital, sans-serif sangat tebal |
| Warna | putih penuh dengan **garis luar hitam tebal** (tanpa kotak latar) |
| Tinggi huruf | ±6% tinggi layar → **±115 px pada 1080×1920** |
| Irama ganti | ±0,4 detik per kartu (terukur dari perubahan tajam di pita tengah) |
| Lebar | mengikuti panjang kata, tidak pernah lebih dari ±60% lebar layar |

Implementasi kita sekarang (`SubtitleTrack.tsx`): kartu **1–3 kata**, maksimal
16 karakter, huruf 92 px, kapital, garis luar 13 px, di tengah layar, kata yang
sedang diucapkan menyala kuning. Sudah diperiksa dengan still frame 205 LS-0011.

## 3. Elemen tetap di layar bawah

Ada satu elemen yang tidak pernah hilang selama 25 detik: penghitung hijau
**"11731/20000 HORROR FANS"** di dasar layar (tinggi ±4,8% tinggi layar, lebar
±76%). Fungsinya bukan informasi — fungsinya membuat penonton merasa ikut
sesuatu yang sedang berjalan (dan mendorong like/subscribe untuk "menaikkan"
angkanya).

Kita tidak meniru angka palsu seperti itu. Padanan yang jujur untuk kanal kita:
penanda berkas di HUD bawah (`ARSIP FIKSI · 03 NOV 2026 · SINYAL 42%`) sudah
ada dan sudah berfungsi sebagai penanda seri.

## 4. Audio

Tidak ada satu pun jeda hening (0 detik senyap pada ambang −35 dB): musik latar
menyala dari detik nol sampai akhir. Loudness −23,7 LUFS dengan LRA 1,8 —
sangat rata, tanpa lonjakan. Efek suara ditumpuk di atas musik, bukan
menggantikannya.

Pelajaran untuk kita: **jangan pernah membiarkan musik berhenti**. Di
`plan-audio.mjs` bed sekarang dipasang per scene; untuk episode berikutnya, bed
harus dipasang sekali untuk seluruh episode supaya tidak ada celah di potongan.

## 5. Ringkasan perbedaan dan yang diubah

| Unsur | Referensi | Kita sebelum | Kita sekarang |
|---|---|---|---|
| Pergerakan kamera | nol (diam) | zoom pelan 8–10 s | diam + atmosfer bergerak; zoom hanya untuk video panjang |
| Rata-rata shot | ±1,0 s | ±2,0 s | target 1,2–1,8 s untuk Short |
| Teks | 1 kata / ±0,4 s, tengah | 1 kalimat / 5–8 s, bawah | 1–3 kata / ±0,5 s, tengah, 92 px |
| Latar musik | terus menyala, tanpa jeda | per scene, ada jeda | satu bed untuk seluruh episode |
| Penghitung di bawah | angka pengikut | tidak ada | penanda berkas (HUD) |

## 6. Yang belum bisa diukur dari berkas ini

Gaya ilustrasinya (flat vector, garis tebal) berbeda dari gaya fotorealistis
kita. Meniru gaya gambar itu berarti mengganti seluruh arah visual kanal — itu
keputusan pemilik kanal, bukan keputusan teknis. Yang diambil di sini hanya
**teknik penyajian**: irama potong, ukuran/posisi teks, dan kesinambungan audio.
