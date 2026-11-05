# Membuat visual bergerak — hasil diagnosis LL-0001

Catatan ini menjawab satu keluhan konkret setelah menonton LL-0001: **visualnya
statis dan banyak kalimat yang tidak divisualisasikan.** Isinya apa yang
diukur, apa yang diperbaiki, dan apa yang sengaja tidak dipakai.

## 1. Diagnosis, bukan opini

| Ukuran | LL-0001 versi 1 | Rujukan | LL-0001 sekarang |
|---|---|---|---|
| Shot | 21 | — | **57** |
| Rata-rata panjang shot | **26,6 s** | 4–7 s untuk kesan kontemplatif | **9,8 s** |
| Gambar per menit | 2,3 | 6–10 | **6,1** |
| Kalimat per shot | **6,4** | ±1,5–3 | **2,4** |
| Gerakan kamera | 3 jenis (static, push, pan) | butuh kosakata | **11 jenis** |
| Lapisan yang bergerak | grain + flicker | — | + hujan/kabut/debu/statik |

Satu gambar bertahan setengah menit adalah penyebab utama rasa "slideshow".
Gerakan kamera tidak bisa menyelamatkan shot selama itu; yang menyelamatkan
adalah **memotong lebih sering**.

## 2. Tiga lapis perbaikan

**a. `scripts/plan-shots.mjs` — cut dari kalimat, bukan dari durasi bulat.**
Skrip membaca cue subtitle (hasil alignment audio), lalu memotong di akhir
kalimat terdekat dengan target 9 detik. Efek sampingnya penting: karena potongan
jatuh di batas kalimat, cut selalu terasa "diniatkan" — tidak pernah memotong
kata di tengah subtitle. Skrip juga memutar kosakata kamera dan ukuran framing
(wide/medium/close) supaya dua shot berurutan dari gambar yang sama tidak
terlihat seperti salinan.

**b. `components/Atmosphere.tsx` — partikel yang bergerak.**
Yang membuat mata percaya sebuah still adalah rekaman bukan gambarnya, tapi
partikel di depannya. Tujuh lapisan tersedia dan dipilih per scene lewat
`shots.json`: `rain`, `heavy_rain`, `mist_drift`, `dust_motes`, `sea_spray`,
`smoke_drift`, `static_burst`.

Catatan teknis yang tidak boleh diulang: hujan versi pertama dibuat dari
`repeating-linear-gradient` dan hasilnya **garis sepanjang layar** — terbaca
seperti goresan film, bukan hujan. Versi yang dipakai sekarang menile ubin SVG
420 px berisi puluhan tetes dengan panjang/ketebalan/opasitas berbeda, lalu
menggeser `backgroundPosition` per frame. Satu div per lapisan, tanpa canvas.

**c. `lib/camera.ts` — napas kamera.**
Semua gerakan (lama dan baru: `dolly_in/out`, `arc_left/right`, `tilt_up/down`,
`drift`) sekarang mendapat tiga hal: amplitudo yang naik untuk shot panjang
(√durasi, batas 1,6×), napas dua frekuensi yang tidak pernah berulang tepat
(frame tidak pernah identik), dan seed per shot supaya dua shot dari gambar
yang sama punya fase berbeda.

## 3. Kalimat yang tidak divisualisasikan

Ini masalah *coverage*, bukan masalah gerak. LL-0001 punya 135 kalimat dan 10
gambar scene; kalimat seperti "gensetnya Kubota tua, warnanya biru pudar" atau
"pulpen terikat tali ke meja" tidak punya wajah.

Jawabannya: **insert**. Sepuluh gambar baru dibuat khusus untuk kalimat yang
belum punya visual (genset, meja jaga, halaman buku, Pak Sukirman, peta laut,
dermaga lama, lemari arsip, telepon syahbandar, antena, kursi kosong), lalu
dipetakan per scene di `stories/longform/LL-0001/shots.json`. Insert dipakai
2–3 kali per episode dengan framing berbeda — sama seperti footage b-roll di
dokumenter, bukan pengulangan template.

Aturan untuk episode berikutnya: **satu gambar per 8–10 detik**, jadi episode
9 menit butuh ±60 gambar. Batas 10 gambar per giliran berarti insert harus
direncanakan sebelum produksi dimulai, bukan ditambal di akhir.

## 4. Parallax tanpa depth map

`components/ParallaxPlate.tsx` membuat lapisan "dekat" dari gambar yang sama:
salinan diperbesar 4,5%, dipotong mask elips lembut di sekitar titik fokus, dan
digeser 4–8 px lebih cepat daripada lapisan dasar. Selisih sekecil itu dengan
tepi yang di-feather tidak terbaca sebagai gambar ganda; yang terbaca adalah
ruang. Dipakai lewat efek `focus_rack`.

Kalau nanti ada depth map asli, ganti `maskImage` dengan PNG depth — sisa
komponen tidak perlu berubah.

## 5. Yang dicoba dan gagal (jangan diulang)

- **Video AI (image-to-video).** Tidak ada model video di pipeline ini.
- **Depth/segmentasi offline (rembg + u2net).** `pip install rembg` berhasil,
  tapi bobot model diunduh dari `release-assets.githubusercontent.com` yang
  tidak dapat dihubungi dari sandbox (SSL/egress). `curl` juga gagal di host
  yang sama. Jadi cutout subjek untuk parallax asli belum bisa.
- **Parallax penuh per objek.** Butuh mask; lihat poin di atas. `ParallaxPlate`
  adalah kompromi yang aman.

## 6. Biaya render

Atmosfer menambah kerja per frame: 540 frame butuh 175 s (3,1 fps) versus 5,6
fps sebelumnya. Render penuh 16.751 frame kira-kira 90 menit pada concurrency 2.
Kalau waktu mepet, turunkan jumlah lapisan atmosfer dulu (bukan jumlah shot) —
cut yang rapat memberi kesan hidup lebih besar daripada partikel tambahan.
