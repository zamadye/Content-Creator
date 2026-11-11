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

## Hukum tambahan — hasil riset 8 November 2026 (Short)

Riset platform 2026 mempersempit tiga hal yang sebelumnya samar. Semuanya
menyasar satu angka: **penonton memutuskan dalam 2 detik**, dan **replay adalah
jam tonton gratis**.

### 1. Jendela swipe hanya 2 detik, bukan 3

YouTube Shorts mengukur persentase orang yang menggeser di 2 detik pertama;
kalau angkanya jelek, distribusi berhenti sebelum cerita sempat berjalan.
Konsekuensinya:

- Kata pertama harus **sudah berbunyi** sebelum 0,3 detik (di build kita 6 frame).
- Hook harus **verbal + visual sekaligus**: kartu teks besar di frame pertama
  mengulang janji hook, supaya penonton yang menonton tanpa suara tetap kena.
- Frame pertama tidak boleh berupa establishing shot. Mulai dari **benda yang
  salah** — karcis, layar, plat nomor — bukan pemandangan.

### 2. Loop dirancang, bukan kebetulan

Short diputar berulang. Kalau kalimat terakhir menyambung ke kalimat pertama,
tonton-ulang terasa seperti lanjutan, bukan pengulangan. Aturannya:

- Kalimat terakhir **memakai kata kunci hook** (sudah diuji mesin).
- Lebih kuat lagi: kalimat terakhir memberi **arti baru** pada frame pertama.
  Setelah twist, penonton menonton ulang untuk mencari tanda yang tadi lolos.
- Tanam satu **easter egg visual di frame pertama** yang baru masuk akal di
  akhir (contoh: sehelai rambut di karcis, padahal rambut narator pendek).

### 3. Beat tiap 2–4 detik, lalu berhenti saat payoff mendarat

- Satu scene = 8–12 kata. Lebih dari itu, penonton Short mulai menggeser.
- Setiap scene harus menaikkan taruhan atau menambah satu fakta baru; scene yang
  hanya mengulang tidak punya alasan untuk ada.
- **Berhenti tepat setelah payoff.** Jangan menambahkan penjelasan sesudah
  twist — kalimat terakhir sudah CTA, tidak perlu ringkasan.

### 4. Klaim spesifik mengalahkan suasana

Pembuka terbaik untuk kanal ini adalah **klaim yang bisa diperiksa** ("karcis
parkir saya selalu tercetak satu jam lebih awal"), bukan perasaan ("malam itu
sangat mencekam"). Penonton bertahan untuk menguji klaim, bukan untuk suasana.

## Hukum tambahan — koreksi pemilik kanal, 8 November 2026: **klimaks di depan**

Ini mengoreksi urutan lama (buka pelan → naik → twist di 85%). Format yang
dipakai sekarang adalah format yang sudah jadi standar pemilik kanal:

1. **Klimaks ditaruh di awal**, di 2 detik pertama — bukan ditunda sampai akhir.
2. **Frame pertama wajib berisi entitas**: satu sosok/benda yang jelas hadir di
   gambar (orang, punggung, tangan, wajah setengah). Pemandangan kosong tidak
   boleh jadi frame pertama, walau sudah "benda yang salah".
3. **Kalimat pertama** harus salah satu dari dua: **pertanyaan** atau **fakta
   yang menahan** ("Pukul empat pagi, mobil saya keluar dari basement.").
   Bukan suasana, bukan perkenalan.
4. **Potong tepat di titik pertanyaan.** Setelah klimaks diperlihatkan, scene
   berikutnya harus membuat penonton bertanya "apa yang terjadi / bagaimana
   bisa / kok bisa" — dan cerita **baru dimulai** sesudah potongan itu.
5. Urutan baku: `klimaks → entitas → POTONG (pertanyaan) → cerita dari awal →
   kembali ke klimaks dengan satu detail baru (twist) → CTA`.
6. Cerita dari awal tetap wajib punya kejanggalan tiap beat (hukum lama §1–§4
   masih berlaku) supaya penonton tidak bosan menunggu climaks kedua.
7. **Frame terakhir memakai frame pertama** (loop fisik), dan kalimat terakhir
   memberi arti baru pada frame itu.

Contoh yang dipakai di LS-0015:

```
04.00  "Pukul empat pagi, mobil saya keluar dari basement." (CCTV + sosok)
       "Tidak ada saya di dalamnya."
       "Pengemudinya bukan saya. Rambutnya panjang."
POTONG "Saya baru sampai jam tujuh. Jadi siapa yang masuk jam empat?"
cerita "Karcis parkir saya selalu tercetak satu jam lebih awal." …
twist  "Satpam menyebut nama saya dengan santai. Katanya, pria itu berambut panjang."
CTA    "Rambut saya pendek. Kamu akan naik ke mobil itu? Tulis di komentar."
```


## Hukum lapisan — evaluasi 8 November 2026 (rewatch)

Hook membuat orang berhenti. Lapisan yang membuat orang **memutar ulang**. Enam
hukum ini berlaku untuk setiap cerita yang masuk produksi, dan **diperiksa
mesin** oleh `scripts/check-gate.mjs` sebelum gambar dibuat.

### 1. Peta petunjuk: tiga petunjuk, tiga medium

Setiap episode wajib punya tiga petunjuk, dan ketiganya harus berbeda jenis:

| Jenis | Bentuk | Contoh |
|---|---|---|
| visual | sesuatu di frame yang bisa dilihat ulang | rambut di karcis; angka ganda di layar antrean |
| audio | bisikan / napas / denyut, 0,4–0,8 s, −18 dB di bawah musik | bisikan menyebut nomor kamar |
| teks | satu kalimat di deskripsi / komentar sematan | "ada dua baris angka yang sama; perhatikan jamnya" |

Masing-masing ditulis dengan **detik muncul** dan **detik dibayar**. Petunjuk yang
tidak punya detik bayar bukan petunjuk — itu hiasan.

### 2. Uji dua bacaan

Kalimat pertama harus punya dua arti dan keduanya ditulis di lembar naskah:

- **arti A** — yang dipahami penonton sebelum twist;
- **arti B** — yang dipahami setelah twist.

Kalau penulis tidak bisa menuliskan arti B, twistnya bukan twist; itu cuma
kejutan, dan kejutan tidak menghasilkan tontonan kedua.

### 3. Tiga loop

- **L1** ditutup di payoff — membuat cerita terasa selesai.
- **L2** dipindahkan ke pertanyaan CTA — memindahkan rasa penasaran ke komentar.
- **L3** **dibiarkan terbuka** — bahan teori, alasan menonton ulang.

L1 dan L3 tidak boleh berasal dari benda yang sama.

### 4. Dua reda

Di sekitar 35% dan 70% durasi, musik turun sampai nyaris hilang selama
**0,6–1,2 detik**, ambience tetap jalan. Ini bukan hening: ini tarikan napas.
Mengoreksi `ATURAN` 4.1 — yang dilarang adalah **sunyi total**, bukan **reda**.

### 5. Loop mulus

Baca kalimat terakhir lalu kalimat pertama dengan suara keras. Kalau sambungannya
terasa seperti satu kalimat, loop berhasil. Kalau terasa dipaksakan, penonton
menyadari video berulang — dan justru berhenti.

### 6. Satu unsur tidak dijawab

Tulis eksplisit apa yang **tidak** dijelaskan cerita (siapa / kenapa / sejak
kapan). Unsur ini tidak boleh dijelaskan di dalam video, dan boleh ditanyakan di
CTA.

### Gerbang

`node scripts/check-gate.mjs` — memeriksa hukum 1–6 di atas untuk semua episode
yang belum tayang. Episode yang gagal **tidak boleh dirender**.

## Hukum tambahan — 8 November 2026 (setelah bedah struktur): lapisan & gerbang

Hukum di atas mengatur **pintu masuk**. Yang membuat penonton bertahan dan
memutar ulang adalah **lapisan** — dan lapisan sekarang wajib, bukan opsional.

### 1. Tiga petunjuk per episode (bukan satu)

| Jenis | Tempat | Aturan |
|---|---|---|
| Visual | frame pertama | sudah terlihat sebelum dijelaskan; dibayar di ¾ durasi |
| Audio | scene 2–4 | `sfx: [{ "asset": "whisper.mp3", "at": 0.35, "volume": 0.28 }]` — bisikan 0,4–0,8 s **di bawah** narasi |
| Teks | deskripsi + komentar sematan | menyebut bahwa ada detail yang baru masuk akal di akhir |

Petunjuk ditulis di `clues` pada `stories/slate.json`, bukan hanya di kepala
penulis: `{ type, at, paidAt, isi }`. Episode tanpa tiga petunjuk tidak masuk
produksi (garis merah gerbang).

### 2. Uji dua bacaan

Kalimat pertama harus punya **arti A** (sebelum twist) dan **arti B** (sesudah).
Kalau B tidak bisa ditulis, itu kejutan, bukan twist.

### 3. Tiga loop

L1 ditutup di payoff · L2 pindah ke pertanyaan CTA · L3 **sengaja dibiarkan
terbuka** (bahan teori di komentar). L1 dan L3 tidak boleh dari benda yang sama.

### 4. Dua titik reda (koreksi ATURAN 4.1)

`releases: [{ "atRatio": 0.35, "seconds": 0.9 }, { "atRatio": 0.7, "seconds": 0.9 }]`
di `stories/slate.json` → `make-score` menurunkan musik ke 8 % selama 0,6–1,2 s
sementara ambience tetap jalan. **Yang dilarang adalah sunyi total**, bukan
turunnya musik.

### 5. Kartu hook 0,9 detik

`holdFrames` kartu hook = 27 frame (0,9 s). Pada 12 frame kartu hilang sebelum
mata sempat mendarat — terukur di LS-0016.

### 6. Gerbang kelayakan (rubrik lengkap di Drive)

`THE LAST SIGNAL / 03 Struktur & Gerbang (Nov 2026)`. Ringkasnya:
Gerbang A (12 butir naskah) → produksi; Gerbang B (10 butir hasil jadi) → tayang;
skor 8 sumbu: ≥13 LAYAK, 9–12 REVISI sekali, ≤8 KUBUR.

---

## Hukum tambahan — lapisan ketiga: cerita yang mengundang diskusi, dan gambar yang bergerak

Arahan pemilik kanal (paling baru, berlaku surut ke semua produksi berikutnya).
Empat hal ini yang membedakan kanal dari "cerita horor AI" biasa.

### 1. Setiap kalimat harus mengundang pertanyaan

Naskah bukan kumpulan kalimat yang menjelaskan; ia kumpulan kalimat yang membuat
penonton menyusun teori. Uji per kalimat: **apa yang penonton ingin tanyakan
setelah kalimat ini?** Kalau jawabannya "tidak ada", kalimat itu lemah.

Yang dipakai:
- angka yang tidak masuk akal sebelum dijelaskan (`empat ratus satu` di dua rumah),
- pertanyaan yang tidak dijawab saat itu juga (dijawab 2–3 segmen kemudian),
- satu pertanyaan langsung ke penonton **di akhir setiap segmen** — ini yang
  memancing komentar, dan komentar adalah distribusi.

Yang dilarang: kalimat yang merangkum perasaannya sendiri
("saya sangat ketakutan"), dan pertanyaan retoris yang sudah dijawab di kalimat
berikutnya.

### 2. Kanal ini tidak 100% fiksi

Cerita disusun dari **kisah lapangan yang mirip**: hal yang katanya pernah
terjadi pada orang lain, lalu dinaikkan tensinya. Karena itu:
- setiap episode panjang **wajib** punya satu kalimat jangkar yang menyebut
  asalnya (contoh LL-0003: "Di grup petugas, cerita rumah kosong yang meternya
  tetap jalan muncul lebih dari sekali. Nama dan tempat selalu diganti."),
- deskripsi video menyebut "disusun dari kisah lapangan, nama dan tempat diubah",
- yang gaib **boleh** ada, tapi tidak boleh jadi satu-satunya sebab: harus ada
  sebab manusia yang bisa diperiksa (dokumen, angka, kebiasaan),
- nama, tempat, dan angka nyata tetap diubah. Jangan mengarang nama instansi
  yang bisa diklaim sebagai tuduhan.

### 3. Komposisi gambar: satu frame, beberapa elemen yang menyambung

Foto 16:9 tidak boleh berisi satu benda di tengah. Gambar harus punya **jalur
mata**: kiri → tengah → kanan, atau bawah → atas, dengan 2–3 elemen berbeda di
dalam satu frame. Contoh yang dipakai di LL-0003: tetangga menyapu (kiri), pagar
bergembok (tengah), rumah berjendela kardus (kanan).

Alasannya bukan estetika: kamera hanya bisa bergerak kalau ada yang dilewati.
Gambar satu benda hanya bisa di-zoom, dan zoom berulang membuat video terasa
seperti slideshow.

Prompt gambar wajib menyebut arah jalurnya ("dari kiri … di tengah … di kanan").
Teks di dokumen hasil generate tetap tidak boleh terbaca.

### 4. Transisi antar scene harus terasa epik

Cut keras hanya untuk patahan di dalam satu segmen. **Perpindahan segmen**
memakai transisi yang membawa gambar: `zoom_punch`, `whip_left`, `whip_right`,
`whip_up`, `whip_down`, `flash_white`, `dip_black` (12 frame; lihat
`apps/renderer/src/components/SceneTransition.tsx`).

Pilih berdasarkan kontras: gelap → terang `flash_white`, terang → gelap
`dip_black`, dua segmen sama gelapnya `whip` searah jalan cerita, masuk ke
tempat baru `zoom_punch`. Ditulis di `meta.json` → `transisi` (satu per
sambungan), lalu `make-longform-plan.mjs` meneruskannya ke `episode.json`.

### 5. Kamera: tidak ada dua shot berurutan dengan gerak sama

Tangga gerak: `push_in`, `dolly_in`, `pan_left`, `pan_right`, `tilt_up`,
`tilt_down`, `arc_left/right`, `drift`, `handheld`, `static`.
`make-longform-plan.mjs` menggeser otomatis kalau naskah menulis gerak yang sama
dua kali berturut-turut. Zoom ke dalam dipakai untuk **detail yang baru
disebut**; geser kiri-kanan untuk **ruang yang lebih luas dari bingkai**;
atas-bawah untuk **bangunan dan tubuh**.

---

## Pola observasional — analisis 11 video Nadia Omara (masukan pemilik kanal)

Sampel yang dilaporkan: 8 video panjang dan 3 Shorts, dianalisis dari transkrip
asli. Ini **hipotesis kerja dari sampel kecil**, bukan bukti sebab-akibat atau
jaminan performa. Pinjam mekanismenya, bukan kalimat, persona, logat, cerita,
atau detail permukaannya.

### Video panjang: janji cerita, bukti, lalu pembayaran

Urutan yang paling sering terlihat pada sampel:

1. Buka langsung dengan potongan adegan paling tegang; jangan beri salam atau
   konteks sebelum cold open.
2. Setelah cold open, beri salam dan sinopsis singkat: dugaan awal → fakta yang
   membuat dugaan itu retak → pertanyaan besar cerita.
3. Sebelum 1:30, sampaikan premis utuh secukupnya agar penonton tahu janji
   judulnya. Ucapkan kata kunci judul dalam menit pertama.
4. Kenalkan konsep/fakta yang diperlukan sebelum klimaks, lalu panggil kembali
   secara eksplisit ketika konsep itu dipakai untuk memahami payoff.
5. Ucapkan kebingungan penonton dengan wajar, jawab saat cerita siap menjawab,
   atau janjikan jawaban nanti hanya jika benar-benar dibayar.
6. Jaga suara tutur yang akrab dan mudah didengar. Analogi sehari-hari dan
   pengakuan batas pengetahuan berguna bila sesuai; jangan meniru catchphrase,
   dialek, atau persona kreator lain.

### Shorts: tanpa salam, langsung ke benda dan kejanggalan

Pada sampel, pembuka Shorts langsung memakai benda/tempat yang akrab namun
menyimpan misteri, atau peristiwa bertanggal dengan detail saksi yang spesifik.
Tidak perlu memindahkan salam dan sinopsis panjang dari struktur video panjang.
Tetap penuhi hukum Shorts yang sudah ada: hook verbal-visual pada frame pertama,
konflik cepat terbaca, detail konkret, beat ringkas, dan payoff/loop yang sudah
ditanam.

### Topik dan pemeriksaan sebelum rekam

Analisis tersebut melihat topik lokal, misteri, dan manusia pada contoh dengan
angka tayang tertinggi di dalam sampelnya. Angka itu tidak cukup untuk
menyimpulkan bahwa formula tersebut menyebabkan views; gunakan hanya sebagai
arah eksplorasi, bukan target atau prediksi.

- [ ] Kata kunci judul terdengar di menit pertama (format panjang).
- [ ] Premis dan pertanyaan utama jelas sebelum 1:30 (format panjang).
- [ ] Fakta yang kelak dipakai sudah dikenalkan sebelum payoff; callback-nya
      terdengar jelas.
- [ ] Ada rasa ingin tahu yang spesifik, bukan janji kosong; pertanyaan yang
      diajukan memang dijawab atau sengaja dibiarkan terbuka secara terarah.
- [ ] Shorts tidak diawali salam; frame dan kalimat pertama sudah memuat objek /
      kejadian konkret serta kejanggalannya.
- [ ] Relatabilitas datang dari kebutuhan, rutinitas, atau pilihan manusia yang
      dikenal penonton; bukan menyalin benda atau plot dari referensi.
- [ ] Dialog terasa lisan dan sesuai narator kanal, bukan imitasi kreator sumber.

Sumber: ringkasan analisis transkrip 11 video yang diberikan pemilik kanal
(8 panjang, 3 Shorts); data views dan metode sampling tidak diverifikasi terpisah.
