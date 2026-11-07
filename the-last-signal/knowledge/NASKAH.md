# NASKAH — hook, tangga tegangan, twist, dan telinga

Dokumen ini bukan kumpulan tips. Isinya hukum yang dipakai saat menulis, dan
sebagian besar bisa diuji `scripts/check-copy.mjs`. Kalau sebuah aturan tidak
bisa diuji, ia ditandai **[manual]** dan masuk daftar periksa sebelum rekam.

Ditulis 7 November 2026 setelah hook LL-0002 dinilai kurang kuat oleh pemilik
kanal. Rujukan riset ada di bagian akhir.

---

## 1. Hook: buka satu lubang, jangan jelaskan apa pun

Penonton tidak bertahan karena kalimatnya bagus. Ia bertahan karena ada satu hal
yang **belum selesai** dan ia ingin menutupnya. Hook yang menjelaskan sudah
menutup lubangnya sendiri sebelum penonton sempat masuk.

| # | Hukum | Uji |
|---|---|---|
| 1.1 | **Satu lubang dibuka di 5 detik pertama** — satu klaim yang tidak lengkap, bukan ringkasan. | [manual] |
| 1.2 | Kalimat pertama **maksimal 12 kata** (panjang) / **9 kata** (Short). Satu tarikan napas. | mesin |
| 1.3 | Kalimat pertama **wajib memuat angka atau penanda waktu**. Angka adalah bukti bahwa ini kejadian, bukan suasana. | mesin |
| 1.4 | Kalimat pertama **dilarang dibuka dengan kata penjelas**: *itu, ini, selisih, perbedaan, masalahnya, sebenarnya, singkatnya, intinya*. Penjelas menunda pukulan satu kalimat penuh. | mesin |
| 1.5 | **Kejanggalan harus terdengar sebelum detik 8** (tiga kalimat pertama): *tidak bisa, selalu, lagi, hilang, kosong, tetap, berapa kali pun*. | mesin |
| 1.6 | **Mulai di tengah kejadian**, bukan di awal hari. "Pukul tiga sore alat itu menghitung 1.228" mengalahkan "Saya juru ukur tanah yang tinggal di desa". | [manual] |
| 1.7 | **Jangan menutup lubang di kalimat kedua.** Kalau hook dijawab sebelum detik 30, tidak ada yang tersisa untuk ditonton. | [manual] |
| 1.8 | Bentuk hook **berbeda dari episode sebelumnya** — pola `<benda> itu <fakta>` tidak boleh dua episode berurutan. | mesin |

Contoh LL-0002 yang **ditolak** aturan ini:

> "Kurang dua belas meter. Itu selisih antara angka di kertas dan angka di tanah."

Kalimat pertama lolos (4 kata, ada angka). Kalimat kedua membunuhnya: ia
**mendefinisikan** alih-alih menambah bahaya. Penonton sudah tahu semuanya
sebelum detik 5.

Bentuk yang lolos untuk cerita yang sama:

> "Tanah ini saya ukur empat kali. Empat kali hasilnya kurang dua belas meter."

Angka + pengulangan = mustahil, dan lubangnya terbuka: kenapa tidak pernah sama?

## 2. Tangga tegangan: setiap scene harus berakhir lebih buruk

Aturan paling berguna yang bisa dipinjam dari craft fiksi adalah **scene dan
sequel** (Dwight V. Swain). Satu scene bukan "sesuatu yang terjadi", tapi satu
unit yang **membuat keadaan tokoh lebih buruk**:

```
SCENE   : tujuan → hambatan → malapetaka
SEQUEL  : reaksi → dilema → keputusan   (keputusan = tujuan scene berikutnya)
```

Kalau sebuah scene berakhir dengan tokoh mendapatkan yang ia mau, tegangan
runtuh dan penonton kehilangan alasan menunggu. Scene hanya boleh berakhir
"berhasil" di **scene terakhir**.

| # | Hukum | Uji |
|---|---|---|
| 2.1 | Tiap scene punya **tujuan konkret** yang bisa disebut dalam satu kalimat. | [manual] |
| 2.2 | Tiap scene berakhir **lebih buruk** (tidak, ya-tapi, atau tidak-dan-bahkan). | [manual] |
| 2.3 | Setelah malapetaka ada **reaksi** (satu-dua kalimat perasaan), lalu **dilema**, lalu **keputusan**. Dilema yang dilewati membuat tokoh terasa tidak memilih. | [manual] |
| 2.4 | Keputusan di akhir scene menjadi tujuan scene berikutnya — rantai sebab-akibat, bukan rangkaian kejadian. | [manual] |
| 2.5 | **Mikro-imbalan setiap 60–90 detik**: satu informasi baru, satu kesalahan, satu pertanyaan dijawab separuh. Untuk format panjang, jangan menunggu 2–3 menit. | [manual] |
| 2.6 | **Jembatan retensi di detik 10–30**: satu kalimat yang menyatakan apa yang akan penonton dapat kalau bertahan ("Yang tidak saya duga: angka itu sudah ada di buku desa"). | [manual] |

## 3. Twist: ditulis mundur, adil, dan mengubah arti adegan sebelumnya

Twist yang baik bukan kejutan; ia **penjelasan yang selama ini bersembunyi di
depan mata**. Penonton harus bisa berkata "aku seharusnya sadar", bukan "dari
mana itu datang".

| # | Hukum | Uji |
|---|---|---|
| 3.1 | **Tulis twist lebih dulu**, lalu susun cerita mundur dari situ. | [manual] |
| 3.2 | **Adil**: semua bahan twist sudah ada di cerita sebelumnya. Dilarang memasukkan fakta baru di detik pengungkapan. | mesin (sebagian) |
| 3.3 | **2–3 petunjuk** yang berbeda bentuk (benda, ucapan, tindakan) — satu petunjuk mudah terlewat, empat membuat twist terbaca. | mesin (jumlah kata kunci) + [manual] |
| 3.4 | **Petunjuk harus bekerja ganda**: masuk akal sebagai bagian adegan sekarang, berubah arti setelah pengungkapan. Petunjuk yang tidak punya fungsi permukaan harus dibuang. | [manual] |
| 3.5 | Twist **mengubah arti minimal satu scene sebelumnya**. Kalau tidak ada scene yang berubah arti, itu bukan twist — itu tambahan. | [manual] |
| 3.6 | Twist menyentuh **konflik utama**, bukan menghias ending. | [manual] |
| 3.7 | Penempatan: **85–90% durasi**, bukan di menit terakhir, supaya masih ada ruang untuk akibatnya. | [manual] |
| 3.8 | Misdireksi memakai **red herring yang jujur**: tersangka palsu punya alasan masuk akal untuk terlihat salah. | [manual] |

## 4. Telinga: naskah ini didengar sekali, tidak bisa diulang

Aturan menulis untuk radio berlaku penuh di sini. Penonton tidak bisa
memundurkan kalimat; kalau satu kalimat perlu dibaca dua kali, ia hilang.

| # | Hukum | Uji |
|---|---|---|
| 4.1 | **Satu gagasan per kalimat.** Kalau satu kalimat punya dua pikiran, potong jadi dua. | mesin (panjang) |
| 4.2 | Rata-rata **≤ 20 kata per kalimat**; tidak ada kalimat > 40 kata (panjang) / > 24 (Short). | mesin |
| 4.3 | **Kalimat aktif**: subjek–kata kerja–objek. "Suratnya bilang 1.240", bukan "angka 1.240 dinyatakan dalam surat". | [manual] |
| 4.4 | **Angka ditulis sebagai kata** di naskah narasi untuk angka di bawah seratus ("dua belas", bukan "12"); angka besar boleh tetap angka kalau itu yang memancing ("1.228"). | [manual] |
| 4.5 | **Tanpa anak kalimat bersarang.** Kalau sebuah kalimat butuh dua koma untuk benar, ia terlalu panjang untuk telinga. | mesin (≥3 koma = peringatan) |
| 4.6 | **Ritme harus bervariasi**: kalimat pendek. Lalu satu yang sedikit lebih panjang untuk konteks. Lalu pendek lagi untuk pukulan. Rata-rata sama panjang = monoton. | mesin (sebaran panjang) |
| 4.7 | **Baca keras sebelum rekam.** Kalau mulut tersandung, telinga penonton juga. | [manual] |
| 4.8 | Kecepatan ukur kami ±2,2 kata/detik (≈132 kata/menit). Naskah 9 menit ≈ 1.200–1.300 kata. Jangan menulis 1.600 kata untuk slot 9 menit. | mesin (durasi) |

## 5. Penutup: tutup lubang yang dibuka di detik pertama

| # | Hukum | Uji |
|---|---|---|
| 5.1 | Kalimat terakhir **menutup lubang hook**, bukan menambah lubang baru. | mesin (kata kunci hook muncul lagi) |
| 5.2 | Ajakan (komentar/subscribe) harus **tumbuh dari cerita**: pertanyaan yang penonton memang ingin jawab. | mesin |
| 5.3 | Tanpa penafian, tanpa label arsip, tanpa pengungkapan AI di dalam naskah. | mesin |

---

## Daftar periksa sebelum rekam

1. Hook: ≤12 kata, ada angka, ada kejanggalan sebelum detik 8, dan **aku sendiri
   mau berhenti scroll** kalau mendengar kalimat ini? [manual]
2. Tiap scene berakhir lebih buruk? Sebutkan satu per satu. [manual]
3. Twist: 2–3 petunjuk berbeda bentuk, semua bisa ditemukan ulang di menit ke-2? [manual]
4. Ada scene yang artinya berubah setelah twist? [manual]
5. Baca keras penuh. Di mana mulut tersandung? [manual]
6. Mesin: `node scripts/check-copy.mjs` harus lolos tanpa galat.

---

## Rujukan

- Hook, open loop, jembatan retensi 10–30 detik, pattern interrupt tiap 60–90 detik: <https://sumera.io/blog/how-to-write-youtube-script-keeps-viewers-watching>
- Lubang dibuka 5 detik pertama dan ditutup di akhir; jangan memberi ending lebih awal: <https://biolinky.co/blog/storytelling-for-creators>
- Mulai di tengah kejadian; spesifik mengalahkan umum: <https://www.markhub24.com/post/the-storyhook-creation-framework-why-some-stories-pull-people-in-and-others-just-pass-by>
- Scene (tujuan–hambatan–malapetaka) dan sequel (reaksi–dilema–keputusan): <https://en.wikipedia.org/wiki/Scene_and_sequel>, <https://www.iwrity.com/writing-scene-sequel-guide>
- Twist: tulis mundur dari twist, adil, 2–3 petunjuk, petunjuk bekerja ganda, salah satu scene berubah arti: <https://hilltreepress.com/manuscript/how-to-write-plot-twists/>, <https://dnschmidt.com/writing-advice/writing-twist-endings/>, <https://www.outastory.com/blog/post/twist-ending-schreiben>
- Menulis untuk telinga: ≤20 kata per kalimat, satu gagasan, aktif, variasi panjang, baca keras: <https://www.gregeschmeyervoice.com/how-to-write-voice-over-script-naturally/>, <https://journalism.university/print-media/crafting-compelling-audio-stories/>, <https://www.ukjournohub.com/broadcast/writing-for-radio>
