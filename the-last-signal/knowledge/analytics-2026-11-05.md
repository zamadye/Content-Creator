# Analitik 2026-11-05 — kenapa hanya satu video yang naik

Angka diambil lewat `zernio-analytics.mjs --all` pada 2026-11-05 ±08:20Z.
Sumbernya metrik post (views, likes, comments) dari Zernio.

| Episode | Terbit (UTC) | Jeda | Durasi | Tayangan | Like |
|---|---|---|---|---|---|
| LS-0001 | 04 Nov 05.15 | — | 57 s | **824** | 11 |
| LS-0002 | 04 Nov 08.42 | 3 j 27 m | 57 s | 87 | 0 |
| LS-0003 | 04 Nov 09.43 | 1 j 01 m | 49 s | **1.261** | 16 |
| LS-0004 | 04 Nov 10.43 | 1 j 00 m | 48 s | 5 | 0 |
| LS-0005 | 04 Nov 12.55 | 2 j 12 m | 49 s | 3 | 0 |
| LS-0006 | 04 Nov 14.12 | 1 j 17 m | 43 s | 0 | 0 |
| LS-0007 | 04 Nov 22.07 | 7 j 55 m | 51 s | 0 | 0 |
| LS-0008 | 04 Nov 23.16 | 1 j 09 m | 55 s | 0 | 0 |
| LS-0011 | 05 Nov 08.01 | 8 j 44 m | 58 s | belum | — |

Sembilan unggahan dalam 26 jam 46 menit. Satu komentar di setiap video adalah
komentar pertama yang kita sematkan sendiri, bukan komentar penonton.

## 1. Yang datanya benar-benar katakan

**a. Like per tayangan sama di video juara dan video biasa.**
LS-0003: 16 / 1.261 = 1,27%. LS-0001: 11 / 824 = 1,33%. Penonton yang sampai
ke video bereaksi hampir persis sama kuat. Yang berbeda bukan reaksinya, tapi
**berapa banyak orang yang dikirimi video itu**. Jadi klaim "cerita LS-0003
lebih bagus" tidak punya dasar di data ini.

**b. Bentuk judulnya tidak istimewa — justru seragam.**
Diperiksa `check-copy.mjs`: 6 dari 9 judul yang terbit berkerangka sama,
`<benda> itu <fakta>. <twist>.` (LS-0003, 0004, 0006, 0007, 0008, 0011). Kalau
dihitung lebih longgar, **9 dari 9** judul yang terbit memakai kata "itu"
sebagai engsel. Judul LS-0003 tidak membedakannya dari LS-0008 karena bentuknya
memang kembar.

**c. Metadata lain dicetak dari satu berkas.**
9 dari 9 deskripsi dibuka "ARSIP FIKSI —". Komentar pertama identik kata per
kata di 9 unggahan (`scripts/make-publish-request.mjs` menuliskannya sebagai
konstanta). Narasi satu suara, HUD satu rupa, panjang 43–58 detik, tag beririsan.

**d. Yang benar-benar terlihat bukan kurva penonton bosan, tapi distribusi mati.**
824 → 87 → 1.261 → 5 → 3 → 0 → 0 → 0. Cerita yang gagal biasanya turun
perlahan; ini jatuh ke nol lalu bertahan di nol selama lima unggahan, termasuk
video yang durasinya paling pendek (43 s) dan yang paling panjang (58 s).

**e. Data retensi tidak tersedia.** `completionRate`, `retentionCurve`, dan
`reelsSkipRate` ada di respons tetapi bernilai 0/kosong; `getYouTubeDailyViews`
juga mengembalikan nol. Artinya `knowledge/experiments.md` — yang seluruhnya
bertumpu pada "persentase ditonton" — **tidak bisa dinilai sekarang**. Metode
satu-variabel-per-episode tetap benar, tapi hasilnya kosong sampai salah satu
dari dua hal terjadi: kuota YouTube Analytics pulih, atau kita memakai penanda
yang bisa dibaca (tayangan, like, komentar).

## 2. Tiga penjelasan yang masih terbuka

| # | Penjelasan | Yang mendukung | Cara memisahkannya |
|---|---|---|---|
| 1 | Uji awal kanal baru selesai. YouTube memberi jatah tayangan pada beberapa unggahan pertama; setelah sinyal penontonnya lemah, jatah itu berhenti | Tiga unggahan pertama dapat tayangan, sisanya nol; tidak ada subscriber | Tidak bisa dipaksa. Yang bisa dilakukan: berhenti menambah unggahan, perbaiki dua hal yang dinilai pada uji itu (judul & 3 detik pertama) |
| 2 | Kanal terbaca sebagai produksi massal sehingga distribusi ditekan | 9 unggahan/27 jam, judul satu kerangka, deskripsi satu pembuka, komentar pertama identik | Perlambat irama, bedakan metadata, lalu lihat apakah unggahan berikutnya kembali dapat tayangan |
| 3 | Metrik Zernio belum menyegarkan post terbaru | Like LS-0006–0008 sempat naik +1/hari tanpa perubahan tayangan | Tunggu 48 jam, tarik ulang. Kalau angka bergerak, sebagian "nol" itu artefak alat, bukan YouTube |

Ketiganya menuntut tindakan yang sama, jadi tidak perlu memilih dulu: **jangan
menambah unggahan beruntun, dan jangan kirim video kesepuluh dengan metadata
kembar.** Itu sebabnya LS-0009 belum diunggah.

## 3. Yang bisa (dan tidak bisa) ditiru dari LS-0003

Tidak bisa ditiru: judulnya, deskripsinya, komentar pertamanya — semuanya
kembar dengan episode lain. Yang tersisa sebagai hipotesis, bukan kesimpulan:

- **Bendanya bisa dipegang.** Truk, radio, napas di mikrofon. Episode sesudahnya
  bergerak ke benda abstrak: log router, denah, panel lift, catatan. Penonton
  tidak bisa membayangkan "satu perangkat" sejelas "radio yang masih menyala di
  truk yang mesinnya hidup".
- **49 detik, bukan 58.** Empat unggahan terakhir yang makin panjang juga makin
  sepi — tapi LS-0006 (43 s) juga nol, jadi ini belum terbukti.

Kalau hipotesis benda konkret diuji, ia harus diuji **sendirian**, setelah irama
unggah dan metadata diperbaiki — bukan bersamaan.

## 4. Yang sudah diubah hari ini

1. **Metadata tidak lagi dicetak dari satu templat.** `scripts/build-episode.mjs`
   membaca `youtube.pinComment` per episode; `make-publish-request.mjs` memakai
   teks itu, bukan konstanta bersama. `\n` harfiah yang membuat deskripsi
   LS-0011 terbit sebagai teks "`\n\n`" kini dilepas di kedua skrip.
2. **`check-copy.mjs` punya enam pemeriksaan baru** (semua sudah ada ujinya di
   `check-copy.test.mjs`, 14 uji lolos):
   - bentuk judul tidak boleh sama antar episode yang belum terbit,
   - dua judul belum terbit tidak boleh dibuka dua kata yang sama,
   - baris pertama deskripsi tidak boleh dipakai dua episode,
   - deskripsi wajib mengungkap fiksi + visual AI,
   - `\n` harfiah di judul/deskripsi ditolak,
   - komentar pertama wajib ada, wajib bertanya, dan wajib berbeda.
3. **LS-0009 dan LS-0010 ditulis ulang metadatanya** (judul, deskripsi,
   komentar pertama, headline thumbnail LS-0010). Judul baru tidak memakai
   engsel "itu" dan memuat angka di tiga kata pertama.
4. **LS-0010 naskahnya diubah di scene 1** agar dibuka dengan sapaan penonton,
   bukan laporan gedung.

## 5. Keputusan pemilik kanal: dua slot per hari

Irama unggah diganti dari "±1 jam sekali" menjadi **dua slot tetap per hari** —
09.00 WIB (02.00 UTC) dan 20.00 WIB (13.00 UTC). Alasinya ada di
`knowledge/growth.md`; ringkasnya: sembilan unggahan beruntun berakhir nol, dan
pengalaman sebelumnya menunjukkan kanal perlu terlihat punya jadwal, bukan
semburan. Yang berubah bukan hanya jaraknya, tapi juga jumlah: dari delapan
video per hari menjadi dua.

## 6. Cara menilai ulang

- Tarik analitik 48 jam setelah unggahan berikutnya, bukan 2 jam.
- Yang dibaca: tayangan per jam tayang (bukan total), dan apakah komentar
  pertama sekarang dapat balasan.
- Kalau dua unggahan berurutan tetap 0 tayangan meski metadata berbeda dan jeda
  24 jam, penjelasan (2) naik peringkat: saat itu yang direvisi bukan judul,
  tapi kanal (topik, atau mulai dari akun baru dengan riwayat bersih).
