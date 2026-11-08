# PACKAGING — kapan orang berhenti menggulir

Dokumen ini bukan tentang isi cerita (itu `NASKAH.md`). Ini tentang **kemasan**:
judul, thumbnail, dua detik pertama, dan ajakan. Sumbernya data kanal sendiri
(analisis 8 Nov 2026), bukan selera.

## Diagnosa dari angka

| Gejala | Angka | Artinya |
|---|---|---|
| CTR video panjang | 0,88% (LL-0001) · 0,42% (LL-0002) | Judul + thumbnail tidak menjual. Cerita dalamnya justru paling kuat (LL-0002 ditonton 66,9%) |
| Retensi Short | 33–46% | Separuh penonton pergi di 1–2 detik pertama |
| Subscriber | +13 dari 4.400+ tayangan | Orang menonton, lalu lupa kanalnya |
| Waktu tonton | 6+ jam dari LL-0001 | Yang bertahan benar-benar bertahan; masalahnya di pintu masuk |

Kesimpulan: **bottleneck-nya di pintu masuk**, bukan di dalam cerita. Karena itu
semua aturan di bawah menyasar 3 detik pertama dan judul.

## 1. Judul: premis dulu, suasana kemudian

Judul yang puitis tanpa premis tidak bisa diklik orang yang belum mengenal
kanal ini. "Dua Belas Meter yang Hilang" terdengar indah, tapi tidak menjanjikan
apa pun yang konkret.

Aturan:

1. **Satu benda + satu kejanggalan** harus ada di judul. Contoh bentuk:
   "Tanah Ini Kurang 12 Meter Setiap Diukur".
2. **Angka lebih kuat daripada kata sifat.** "12 meter" mengalahkan "misterius".
3. **Jangan buka dengan kata suasana** (misteri, teror, kelam) — buka dengan
   kejadian.
4. Maksimal 70 karakter supaya tidak terpotong di ponsel; kata kunci paling
   penting di 40 karakter pertama.
5. "Cerita Horor" boleh, tapi di belakang — bukan pengganti premis.

Perbaikan untuk dua video yang sudah tayang:

| Video | Judul sekarang | Usulan |
|---|---|---|
| LL-0001 | Kanal 16 Tidak Boleh Ditinggal — Stasiun Radio Pantai di Pantura \| Cerita Horor | **Kanal 16 Masih Menjawab, 12 Tahun Setelah Kapalnya Tenggelam** |
| LL-0002 | Dua Belas Meter yang Hilang | **Tanah Ini Kurang 12 Meter Setiap Diukur — Selisihnya Selalu Sama** |

## 2. Thumbnail: 2–3 kata, satu titik fokus

Thumbnail tidak merangkum cerita; ia menimbulkan satu pertanyaan. Teks maksimal
tiga kata, huruf besar, kontras tinggi, satu objek ganjil yang bisa dijelaskan
dalam satu tarikan mata. Empat thumbnail yang sudah ada mengikuti aturan ini
(`stories/thumbnails/README.md`) dan **belum pernah dipasang** — pasang dulu
sebelum membuat yang baru.

## 3. Dua detik pertama Short

Yang dihitung penonton bukan durasi video, tapi jarak antara jempol berhenti dan
otak mengerti ada yang aneh.

- Kata pertama harus terdengar **sebelum 0,3 detik** (`LEAD_IN_FRAMES` = 6 di
  30 fps). Tanpa jeda hening, tanpa musik pembuka.
- Kartu hook tampil bersamaan dengan kalimat pertama, bukan sesudahnya.
- Gambar pertama harus memperlihatkan **benda yang salah**, bukan suasana:
  celah kosong di antara dua rumah, kursi yang sudah terisi, layar monitor bayi.
- Kalimat pertama Short ≤ 9 kata dan wajib memuat angka atau penanda waktu
  (ditegakkan `check-copy.mjs`).

## 4. Jembatan Short → video panjang

Short berdiri sendiri, jadi jembatan tidak boleh memaksa ("tonton video
panjangnya") kalau ceritanya tidak berhubungan. Yang boleh:

- Sematan komentar yang menanyakan pilihan sulit dari cerita itu (sudah ada di
  `publishing.pinComment` tiap episode).
- Kalau Short memang turunan sebuah video panjang, sebut di deskripsi:
  "Versi lengkapnya: <judul>". Jangan pernah mengarang kaitan yang tidak ada.

## 5. Ajakan: satu pertanyaan, bukan tiga perintah

CTA di ekor video berbentuk pilihan yang harus dijawab penonton
("Kamu akan tanda tangan, atau memindahkan rumahnya?"). Tombol SUBSCRIBE/LIKE/
KOMENTAR ada di bawahnya sebagai jalan keluar, bukan sebagai kalimat.

Alasan: +13 subscriber dari 4.400 tayangan menunjukkan penonton menikmati cerita
tanpa merasa perlu kembali. Pertanyaan yang belum terjawab membuat mereka ingin
mendengar cerita berikutnya — dan itu pekerjaan subscribe, bukan pekerjaan
tombol.

---

## 6. Komentar, share, dan emosi — riset + diagnosis kanal (8 Nov 2026)

### Koreksi penting: komentar bukan tombol rahasia algoritma

Jangan simpulkan "view berhenti karena tidak ada komentar" atau "like saja yang
mendorong video naik lambat". YouTube menyebut sinyal personalisasi dan kepuasan
seperti pilihan klik, waktu tonton, survei kepuasan, share, like, dan dislike;
penimbangannya berbeda menurut penonton dan permukaan rekomendasi, tanpa rumus
statis yang diumumkan. Komentar tidak tercantum di daftar contoh utama dalam
penjelasan rekomendasi YouTube tersebut; ini **bukan bukti** bahwa sistem tidak
pernah menggunakan data komentar. Yang tidak didukung sumber publik adalah
menganggap komentar sebagai tombol distribusi yang pasti. Komentar tetap
bernilai untuk percakapan, hubungan, umpan balik, dan ide episode. [1][2]

Secara historis, orang bisa menonton secara pasif tanpa pernah berkomentar.
Untuk mengomentari, mereka perlu alasan yang cukup spesifik untuk menukar waktu,
perhatian, dan keterlihatan publik dengan satu kontribusi. Karena itu CTA umum
("tulis pendapatmu") biasanya tidak memberi bahan untuk dijawab. Dalam studi
8.500 video berbahasa Inggris, CTA lisan untuk like berasosiasi dengan kenaikan
like, tetapi CTA komentar/subscribe tidak menunjukkan efek signifikan terhadap
tindakan masing-masing. Hasil tersebut tidak otomatis berlaku untuk penonton
horor Indonesia; ia cukup kuat untuk menolak asumsi bahwa meminta komentar saja
sudah memadai. [3]

**Rumus kerja (hipotesis editorial, bukan hukum algoritma):**
`komentar bernilai = pertanyaan spesifik + bukti yang bisa ditunjuk + jawaban yang aman/pendek + ruang untuk berbeda pendapat`.

### Apa yang sebenarnya membuat orang berbicara atau berbagi?

- **Komentar = kontribusi/posisi.** Penonton ingin menebak, mengoreksi, memilih,
  menceritakan pengalaman sendiri, atau menanggapi kreator/orang lain. Riset
  YouTube menemukan bahwa pembicaraan tentang kreator/kanal, permintaan
  tanggapan, serta sedikit keterbukaan personal dapat berkaitan dengan bentuk
  komentar yang lebih langsung; ini riset tentang kedekatan parasosial, bukan
  jaminan jumlah komentar. [4]
- **Share = hadiah sosial untuk penerima dan pengirim.** Penelitian penggunaan
  YouTube mengaitkan menonton/berbagi dengan hiburan, co-viewing, dan interaksi
  sosial. Konten yang memicu awe, marah, atau cemas—emosi ber-arousal tinggi—
  cenderung lebih banyak dibagikan daripada konten sedih/tenang dalam studi
  artikel NYT; penelitian itu bukan eksperimen ranking Shorts dan tidak
  menjamin video horor akan viral. [5][6]
- **Emosi ≠ satu jenis engagement.** Kaget dapat menimbulkan reaksi singkat;
  takut/penasaran menjaga perhatian; dilema mengundang posisi; rasa dekat
  memberi alasan mengirim ke orang tertentu. Jangan mengharapkan satu emosi
  sekaligus menaikkan retention, komentar, share, dan subscribe.

### Peta emosi untuk horor yang tetap memuaskan

| Emosi | Pemicu cerita | Kemungkinan tindakan penonton | Batas etis/editorial |
|---|---|---|---|
| **Gelisah / dread** | Rutinitas yang akrab berubah sedikit; ancaman dekat tetapi sebab belum jelas. | Bertahan untuk mencari sebab; membandingkan petunjuk. | Ketidakpastian harus punya pola, bukan sengaja membingungkan. |
| **Takut** | Tokoh terasa rentan, ancaman terasa dekat dan cukup masuk akal; ada jeda antara prediksi dan bukti. | Menonton sampai payoff; mengirim ke teman yang berbagi konteks. | Takut yang aman dan terkendali; jangan mengaku sebagai peringatan nyata bila fiksi. |
| **Penasaran** | Ada lubang informasi yang bisa dipecahkan dari bukti yang sudah diberikan. | Menebak teori, replay, menandai detail. | Jangan menahan semua jawaban; tutup cerita, sisakan hanya satu pertanyaan yang adil. |
| **Kaget / surprise** | Satu pelanggaran ekspektasi yang dibangun oleh pola sebelumnya. | Reaksi spontan, replay untuk memastikan. | Jumpscare berulang cepat menjadi pola; shock sendiri belum tentu membuat percakapan atau kepuasan. |
| **Marah / indignation** | Ketidakadilan, pengkhianatan, atau pilihan tokoh dengan konsekuensi nyata. | Memilih pihak, memberi alasan, membalas komentar lain. | Jangan membuat tokoh sengaja bodoh, memfitnah kelompok nyata, atau memancing amarah kosong. Harus ada dilema yang masuk akal. |
| **Takjub / awe / aha** | Petunjuk lama tersambung dan mengubah arti kejadian awal. | Mengirim video sebagai "lihat hubungan ini"; menjelaskan twist. | Twist harus fair: petunjuknya sudah terlihat/didengar sebelum pengungkapan. |
| **Sedih / jijik** | Kehilangan atau detail tubuh yang mengganggu. | Dapat menghasilkan simpati atau justru menjauh. | Tidak perlu mengejar gore; eksperimen horor dengan 558 peserta menemukan fearfulness, realness yang dirasakan, dan morbid curiosity memprediksi excitement/enjoyment; disgust berhubungan negatif dengan enjoyment. [7] |

**Urutan yang disarankan:** akrab → anomali kecil → bukti yang menguatkan → ancaman mendekat → kejutan/reframe → napas/reda → satu pilihan atau teori. Intensitas yang terus maksimum membuat tidak ada kontras; shock jangan dipakai menggantikan sebab-akibat.

### Diagnosis The Last Signal: komentar yang ada sudah memberi petunjuk

Data terdokumentasi di kanal: CTR long-form **0,88% (LL-0001)** dan **0,42%
(LL-0002)**; dokumen analitik mencatat retensi **66,9% untuk LL-0002**, retensi
Short **33–46%**, dan **13 subscriber dari 4.400+ tayangan**. Ini menunjuk pada
masalah yang berbeda: packaging/pintu masuk perlu diuji untuk long-form;
opening/hold Short dan alasan untuk kembali juga perlu diperbaiki. Angka itu
tidak membuktikan bahwa kurangnya komentar menyebabkan rendahnya distribusi.
Catatan 66,9% perlu dicocokkan lagi dengan rentang tanggal, sumber traffic, dan
jumlah views—angka persentase dari sampel sangat kecil mudah menyesatkan.

Dari dua contoh komentar organik yang dilaporkan pemilik:
- **"Jadi itu rumah siapa"** = rasa ingin menutup lubang identitas. Ini bahan
  untuk teori/percakapan, bukan sekadar pujian.
- **"😮 menyeramkan ko bisa"** = emosi hadir, tetapi belum diberi pegangan untuk
  menjadi komentar balasan atau teori.

Perbandingan dengan contoh yang diberikan pemilik (monitor bayi, router kos,
nomor rumah ke-13): objek sehari-hari memudahkan penonton menghubungkan cerita
ke kamar, kos, atau lingkungan mereka; pertanyaan "rumah siapa?" menunjukkan
misteri identitas sudah bekerja. Ini perbandingan **mekanisme cerita dari judul
dan komentar yang dibagikan**, bukan klaim bahwa kanal lain mempunyai retention,
share-rate, atau distribusi lebih baik—data privat mereka tidak tersedia di sini.

### Eksperimen empat video berikutnya

Uji **satu mekanisme utama per video**, jangan sekaligus mengganti subgenre,
durasi, CTA, dan gaya thumbnail. Pisahkan Shorts dan long-form saat membaca
hasil.

1. **Teori A/B + bukti.** "Menurutmu angka itu mengikuti rumah, atau ada orang
   yang membayar? Sebut satu petunjuk." Kode komentar: teori / alasan.
2. **Pengalaman personal.** "Pernah ada alat di kos yang tetap menyala saat
   semua orang pergi? Apa yang pertama kamu cek?" Jangan mendorong orang
   membongkar listrik atau menghadapi bahaya.
3. **Dilema moral.** "Kalau nama ibumu muncul di meteran asing, kamu lapor dulu
   atau tanya keluarga? Kenapa?" Tokoh harus punya alasan masuk akal untuk
   pilihannya.
4. **Bukti yang layak dibagikan.** Satu petunjuk visual benar-benar muncul
   sebelum reveal; ajak penonton mengirim video ke teman untuk melihat apakah
   mereka menemukan petunjuk yang sama. Jangan mengklaim ada clue yang tidak ada.

Satu CTA utama per video. Tempatkan pertanyaan sebagai bagian alami dari suara
narator setelah payoff; komentar sematan mengulang **pertanyaan yang sama** dan
menunjuk bukti, bukan menambah tiga perintah like/comment/share/subscribe.
Balas komentar awal dengan pertanyaan lanjutan yang tulus; heart/reply adalah
cara membangun percakapan, bukan trik untuk menjamin rekomendasi.

Contoh sematan LL-0003 (bukan perintah tayang ulang):
> Meteran rumah kosong naik saat listrik rumah narator diputus. Menurutmu ini
> salah sistem, ada orang yang membayar, atau ada penjelasan lain? Sebut satu
> petunjuk yang membuatmu memilih.

### Ukur tindakan yang berbeda secara terpisah

Pada jendela 48 jam dan 7 hari, catat per format dan sumber traffic:

- **Pintu masuk:** impressions, CTR long-form; untuk Shorts, shown in feed dan
  viewed vs swiped away.
- **Perhatian/kepuasan:** average view duration, average % viewed, kurva retensi
  di hook, pengungkapan clue, dan CTA; gunakan engaged views Shorts saat
  membandingkan rasio, bukan hanya view count mentah.
- **Percakapan:** komentar organik per 1.000 views untuk long-form, dan per
  1.000 engaged views untuk Shorts; jumlah penulis unik, reply-thread rate,
  lalu kode jenis komentar (reaksi / teori / pengalaman / dilema / koreksi).
  Pisahkan komentar pemilik/sematan dari penonton.
- **Sebar:** shares per 1.000 views untuk long-form dan per 1.000 engaged views
  untuk Shorts, bukan jumlah share mentah; tambahkan subscriber per 1.000 views
  dan returning viewers.

Anggap 4 video sebagai uji awal, bukan bukti statistik. Pilih pemenang hanya jika
pertanyaan berkualitas naik **tanpa** kerugian besar pada viewed-vs-swiped,
retention, atau satisfaction. Prioritas saat ini tetap CTR long-form dan hold
awal Shorts—komentar/share menjadi eksperimen tambahan, bukan pengganti.

### Sumber utama

1. YouTube, [On YouTube’s recommendation system](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/) — kepuasan personal, watch time, survei, share/like/dislike; tidak ada formula tunggal.
2. YouTube Help, [Search & discovery tips](https://support.google.com/youtube/answer/11914225) — pilihan klik, bertahan/keluar, average view duration, average % viewed, likes, dan survei.
3. Anderson, Nguyen & Anderson, [Like, comment, and subscribe](https://doi.org/10.1108/JRIM-12-2024-0573), *Journal of Research in Interactive Marketing* (2026), 8.500 video English; keterbatasan pasar dan faktor kualitas isi.
4. Thelwall et al., [YouTube influencers and parasocial interactions](https://doi.org/10.2478/jdis-2022-0011), *Journal of Data and Information Science* (2022); permintaan feedback/channel discussion dan keterbatasan sampel influencer.
5. Haridakis & Hanson, [Social Interaction and Co-Viewing With YouTube](https://doi.org/10.1080/08838150902908270), *Journal of Broadcasting & Electronic Media* (2009).
6. Berger & Milkman, [What Makes Online Content Viral?](https://doi.org/10.1509/jmr.10.0353), *Journal of Marketing Research* 49(2), 192–205 (2012); sharing artikel NYT, bukan jaminan performa video.
7. Kiss et al., [The role of excitement and enjoyment through subjective evaluation of horror film scenes](https://doi.org/10.1038/s41598-024-53533-y), *Scientific Reports* 14, 2987 (2024), N=558.
