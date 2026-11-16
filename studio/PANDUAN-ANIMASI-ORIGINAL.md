# PANDUAN TEKNIS ANIMASI 2.5D: JALAN PULANG

Total 72 shot: **28 shot 2.5D**, **39 shot foto + gerak kamera**, **5 shot klip video AI** (image-to-video). Timestamp mengikuti shot list v2 (masih estimasi).

## 1. Spesifikasi teknis
- Rasio dan resolusi: 16:9, 1920x1080, 30 fps (untuk YouTube dan Facebook).
- Resolusi gambar sumber: minimal 2560x1440, ideal 3840x2160, supaya zoom sampai 140% tetap tajam.
- Framing aman: taruh subjek utama di 60% bagian tengah frame agar mudah di-crop ke 9:16 untuk Reels dan Shorts.
- Export: H.264 atau H.265, bitrate 16-20 Mbps, audio AAC 320 kbps.
- Gaya visual: sinematik horor malam, grain film halus, vignette, tanpa teks di dalam gambar kecuali papan jalan dan layar ponsel.
- Palet warna: latar #0B1A1F, bayangan #16313A, kabut #5E7F86, aksen bohlam #E8B84A, aksen sirine merah #B3262E dan biru #2A4FA8, aksen layar ponsel #9CC9FF.

## 2. Aset induk (dibuat sekali, dipakai ulang)
Membuat satu aset induk lalu memakainya di banyak shot menghemat waktu dan menjaga konsistensi.
| Aset | Dipakai di shot | Isi |
|---|---|---|
| MASTER-WARUNG | 5.1, 5.2, 5.5, 6.1, 6.2, 7.3, 7.6, 10.5, 12.2 | Warung atap seng, kursi di atas meja, beringin, tikungan; siapkan versi lampu mati dan lampu menyala |
| MASTER-PAPAN | 4.5, 5.3, 5.6, 7.2 | Papan besi berkarat miring ke kiri, tulisan Desa Sukamaju 12 km; siapkan versi kering dan versi basah meleleh |
| MASTER-HUTAN | 4.1, 4.2, 4.3, 6.4, 8.2, 9.3, 14.1 | Jalan sempit beraspal retak dengan batang karet rapat, kabut tipis |
| MASTER-MOTOR | 2.1, 2.2, 6.4, 8.1, 10.2, 10.3, 11.4 | Motor Supra tua dengan Dimas, versi samping, belakang, dan close-up spion |
| MASTER-RUMAH | 12.4, 13.1, 13.2, 13.7 | Rumah kampung, teras, lampu teras kuning, pintu kayu |

## 3. Karakter dan aturan konsistensi
Buat character sheet dulu (depan, samping, tiga perempat, ekspresi takut dan netral), lalu pakai sebagai gambar referensi di setiap prompt (fitur reference image atau character reference pada generator Anda). Prompt dasar dalam bahasa Inggris karena umumnya lebih akurat.

**Dimas** (28 tahun, tokoh utama)
- Ciri: pria Indonesia kurus, rambut hitam pendek berantakan, wajah lelah, jaket kain tebal abu gelap beresleting, jeans, sepatu kets hitam, helm half-face hitam tanpa visor (wajah tetap terlihat).
- Prompt: `28-year-old Indonesian man, slim, short messy black hair, tired face, thick dark grey zip jacket, jeans, black half-face helmet without visor, cinematic horror night, teal-green color grade, 35mm film grain, realistic, no text`

**Motor Supra tua**
- Ciri: motor bebek tua warna merah marun pudar, lampu depan bulat kuning, tas kecil hitam diikat di bagian belakang.
- Prompt: `old faded maroon Honda Supra underbone motorcycle, round yellow headlight, small black bag strapped at the rear carrier, rural Indonesia, night, cinematic`

**Sosok berbaju putih** (penunggu di warung)
- Ciri: pria kurus tinggi, sangat pucat, kemeja putih kusam lengan panjang, celana gelap, rambut hitam acak, senyum terlalu lebar, saat dekat kedua mata hitam seluruhnya.
- Prompt: `tall thin pale man in dirty off-white long sleeve shirt, dark trousers, messy black hair, unnaturally wide smile, eyes completely black, standing on a dark rural road at night, eerie, cinematic horror, no gore`

**Sosok hitam di jok belakang**
- Ciri: bayangan hitam semi transparan berbentuk manusia, kepala tertunduk, kedua lengan melingkar di pinggang, tanpa fitur wajah.
- Prompt: `faceless black shadow figure shaped like a human sitting behind a motorcycle rider, head bowed, arms wrapped around the rider's waist, semi-transparent smoky edges, seen in motorcycle mirror reflection, night, cinematic horror`

**Ibu** (55-60 tahun, lebih banyak suara dan siluet)
- Ciri: wanita desa sederhana, kerudung krem, daster batik, wajah teduh dan cemas.
- Prompt: `Indonesian village woman in her late fifties, cream hijab, batik house dress, worried gentle face, standing on a porch lit by a warm yellow lamp at night, cinematic`

**Bapak** (almarhum, 60-an, foto lama dan kilas balik)
- Ciri: pria 60-an, kumis tipis, peci hitam, foto lama pudar.
- Prompt: `faded old photograph of an Indonesian man in his sixties, thin mustache, black peci cap, worn paper texture, wallet photo`

**Tukang parkir** (60-an)
- Ciri: pria tua, rompi parkir oranye lusuh, topi lusuh, kumis, peluit di leher, senyum tipis yang terlalu tenang.
- Prompt: `elderly Indonesian parking attendant, faded orange vest, worn cap, mustache, whistle around neck, calm slight smile, streetlight backlight at night, cinematic`

Aturan konsistensi: pakai seed atau referensi yang sama, jangan ganti pakaian Dimas antar shot, dan jangan tampilkan wajah ibu secara jelas (cukup siluet atau bayangan) agar konsistensi tidak jadi masalah.

## 4. Alur kerja 2.5D (langkah demi langkah)
1. **Generate gambar utama** per shot sesuai aset induk dan karakter. Minta latar yang jelas dan objek terpisah dari latar agar mudah dipisah.
2. **Pisahkan lapisan.** Gunakan Select Subject atau Remove Background (Photoshop, CapCut, Runway, atau alat sejenis) untuk memotong karakter, motor, bohlam, dan pohon depan.
3. **Isi latar yang hilang.** Pakai Generative Fill atau inpainting pada layer belakang agar tidak ada lubang saat layer bergeser.
4. **Buat kedalaman.** Susun layer dari jauh ke dekat, lalu gerakkan dengan kecepatan berbeda. Alternatif otomatis: buat depth map lalu pakai sebagai displacement.
5. **Animasikan kamera** di After Effects (kamera 3D), DaVinci Resolve (Fusion), atau CapCut (keyframe scale dan posisi per layer). Gunakan easing halus (ease in-out) kecuali shot panik.
6. **Tambahkan efek** (kabut, grain, vignette, kedip lampu, chromatic aberration), lalu render per adegan supaya mudah direvisi.

Untuk shot VIDEO AI: pakai gambar utama sebagai gambar awal, tulis motion prompt singkat (satu aksi saja per klip), generate 5-6 detik, lalu potong di editor. Siapkan 2-3 variasi dan pilih yang paling stabil.

## 5. Preset gerak kamera
| Preset | Arti |
|---|---|
| PUSH-IN a>b% | Zoom-in dari skala a ke b selama durasi shot (ease in-out) |
| PULL-OUT a>b% | Zoom-out, a lebih besar dari b |
| PAN-KANAN/KIRI x% | Geser horizontal sebesar x% lebar gambar |
| DOLLY | Kamera maju: layer depan membesar lebih cepat daripada layer belakang (efek 2.5D paling terasa) |
| DRIFT x% | Geser sangat pelan untuk menghindari kesan diam |
| SHAKE n px | Getar handheld dengan amplitudo n piksel (hanya saat panik) |
| Hold | Kamera diam |
Aturan: jangan pakai gerakan yang sama di dua shot berurutan, gerakan paling halus untuk shot yang hening, dan gerakan paling kuat hanya di 6.4, 7.7, 8.1, dan 9.4.

## 6. Tabel per shot


### Adegan 1: Perkenalan Dimas dan telepon ibu

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 1.1 | 00:00-00:10 | 10 dtk | 2.5D | L1 langit malam+awan | L2 siluet pohon/bangunan jauh | L3 jalan beraspal | L4 garis cahaya lampu kendaraan | PULL-OUT 108>100%, drift kanan 2% | Streak lampu bergerak horizontal (loop), grain, vignette ringan, fade-in dari hitam |
| 1.2 | 00:10-00:18 | 8 dtk | FOTO | 1 gambar: Dimas di lorong rak gudang pabrik | PUSH-IN 100>108% ke wajah | Grain, desaturasi 15%, debu melayang |
| 1.3 | 00:18-00:28 | 10 dtk | FOTO x3 | 3 gambar: alarm/jam pagi, gerbang pabrik malam, layar transfer di ponsel (masing-masing 3-4 dtk) | PUSH-IN 100>105% tiap gambar, cross-dissolve 0,5 dtk | Grain, warna makin dingin tiap gambar |
| 1.4 | 00:28-00:39 | 11 dtk | FOTO | 1 gambar: ponsel di meja kos, layar menyala nama Ibu | PUSH-IN 100>112% ke layar | Glow layar berdenyut (opacity 70-100%), vignette |
| 1.5 | 00:39-00:47 | 8 dtk | FOTO x2 | G1 close-up Dimas menelepon | G2 teras rumah kampung, siluet ibu memegang telepon | G1 PUSH-IN 100>110% | G2 PULL-OUT 108>100% | Lampu teras kuning glow lembut, grain, dissolve antar gambar |
| 1.6 | 00:47-00:58 | 10 dtk | FOTO | 1 gambar: foto bapak di dompet, jari Dimas menyentuh | PUSH-IN 100>115% ke foto | Vignette kuat, blur tepi (depth of field), grain |

### Adegan 2: Berangkat dan macet

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 2.1 | 00:58-01:10 | 12 dtk | FOTO | 1 gambar: Dimas dan motor Supra di halaman kos, tas kecil diikat di belakang | PAN-KANAN 5% lalu PUSH-IN 100>106% | Grain, kilau lampu motor |
| 2.2 | 01:10-01:23 | 14 dtk | 2.5D | L1 langit+bulan tipis | L2 pohon jauh | L3 jalan raya | L4 motor+Dimas (cutout) | L5 tiang listrik depan (blur) | DOLLY: L5 100>135%, L4 100>110%, L3 100>112%, L2 100>105%, L1 100>102% | Flare lampu kendaraan lewat, grain, vignette |
| 2.3 | 01:23-01:32 | 8 dtk | 2.5D | L1 langit oranye gelap | L2 antrean mobil jauh | L3 truk terguling | L4 jalan+Dimas kecil di motor | L5 overlay lampu sirine | PUSH-IN 100>112% + drift kiri 3% | Sirine merah-biru berkedip 2 Hz (overlay), grain |

### Adegan 3: Tukang parkir dan jalan pintas

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 3.1 | 01:32-01:46 | 14 dtk | FOTO | 1 gambar: tukang parkir mendekat dari pinggir jalan, Dimas di motor | PAN-KIRI 5% mengikuti gerak | Backlight lampu jalan, grain |
| 3.2 | 01:46-01:55 | 9 dtk | 2.5D | L1 jalan latar+mobil macet (blur) | L2 tukang parkir (cutout) | L3 Dimas di motor (cutout) | L4 jalan kebun karet gelap di kejauhan | PAN-KANAN 6% mengikuti arah telunjuk, lalu PUSH-IN 100>108% | Rack focus: fokus pindah dari tukang parkir ke jalan gelap, grain |
| 3.3 | 01:55-02:04 | 9 dtk | FOTO | 1 gambar: close-up tukang parkir tersenyum tipis | PUSH-IN 100>115% sangat lambat | Vignette kuat, kontras +10% |

### Adegan 4: Masuk hutan karet

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 4.1 | 02:04-02:11 | 7 dtk | 2.5D | L1 langit gelap | L2 kebun karet jauh | L3 jalan sempit memanjang | L4 motor kecil+Dimas | L5 ranting depan (blur) | PULL-OUT 112>100% sambil tilt-up 3% (kesan drone) | Kabut tipis bergerak (overlay), grain |
| 4.2 | 02:11-02:25 | 14 dtk | 2.5D | L1 langit hitam kebiruan | L2 batang karet jauh | L3 batang tengah (siluet seperti orang) | L4 jalan | L5 batang depan (blur gelap) | DOLLY maju pelan 100>115% (L5 paling cepat) | Kabut berlapis, batang bergoyang 1 px, vignette |
| 4.3 | 02:25-02:36 | 11 dtk | 2.5D | L1 gelap | L2 batang jauh | L3 aspal dengan cone cahaya lampu motor | L4 batang kiri-kanan menyapu | DOLLY maju cepat 100>130%, shake 2 px | Cone cahaya goyang halus, partikel debu/serangga di cahaya, grain |
| 4.4 | 02:36-02:47 | 11 dtk | FOTO x2 | G1 speedometer+tangan di stang | G2 papan besi berkarat muncul dari gelap | G1 PUSH-IN 100>110% | G2 PUSH-IN 100>106% | Jarum speedometer bergetar, dashboard berkedip pelan, G2 fade-in dari hitam |
| 4.5 | 02:47-02:57 | 10 dtk | FOTO | 1 gambar: papan Desa Sukamaju 12 km, cat pudar (MASTER-PAPAN) | PUSH-IN 100>108% | Sapuan cahaya lampu motor melintasi papan, grain |
| 4.6 | 02:57-03:08 | 11 dtk | FOTO | 1 gambar: wajah Dimas lega | PUSH-IN 100>106% | Warna sedikit hangat (+5), vignette |

### Adegan 5: Putaran pertama dan kedua

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 5.1 | 03:08-03:23 | 15 dtk | 2.5D | L1 langit+kabut | L2 pohon karet jauh | L3 warung gelap atap seng, kursi di atas meja | L4 beringin (akar menjuntai) | L5 aspal+rumput depan (MASTER-WARUNG) | PAN-KANAN 6% + PUSH-IN 100>108% | Kabut, grain, akar beringin bergoyang 1-2 px (warp) |
| 5.2 | 03:23-03:33 | 11 dtk | 2.5D | Pakai MASTER-WARUNG sisi kanan: L3 beringin | L4 aspal melengkung ke tikungan | L5 papan di ujung tikungan muncul dari gelap | PAN-KANAN 8% mengikuti tikungan + PUSH-IN 100>106% | Papan fade-in dari gelap, grain |
| 5.3 | 03:33-03:41 | 8 dtk | FOTO | MASTER-PAPAN, crop lebih jauh dari 4.5 | PUSH-IN 100>104% | Sengaja identik dengan 4.5, tanpa sapuan cahaya |
| 5.4 | 03:41-04:02 | 21 dtk | FOTO | 1 gambar: Dimas menoleh kiri-kanan di atas motor | PAN-KIRI lalu PAN-KANAN 3% | Grain, vignette; tambah insert telapak tangan dingin bila perlu |
| 5.5 | 04:02-04:17 | 14 dtk | 2.5D | Pakai MASTER-WARUNG, framing identik 5.1 + tikungan + papan | PAN-KANAN 6% + PUSH-IN 100>108% (parameter sama persis dengan 5.1) | Identik dengan 5.1, ditambah getar 1 px (sengaja: pengulangan) |
| 5.6 | 04:17-04:25 | 9 dtk | FOTO x2 | G1 MASTER-PAPAN 12 km | G2 tangan Dimas merogoh saku jaket | PUSH-IN 100>108% tiap gambar | Cahaya lampu motor makin redup (brightness -10%) |
| 5.7 | 04:25-04:32 | 6 dtk | FOTO | 1 gambar: layar ponsel 23.47 di tangan gemetar | PUSH-IN 100>115% | Glow layar, angka berkedip sekali, tangan bergetar 1 px |
| 5.8 | 04:32-04:40 | 9 dtk | FOTO | 1 gambar: wajah Dimas bertekad menarik napas | PUSH-IN 100>110% | Kontras naik, vignette makin kuat |

### Adegan 6: Putaran ketiga: warung menyala

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 6.1 | 04:40-04:47 | 7 dtk | 2.5D | MASTER-WARUNG versi lampu menyala: L3 warung+cahaya kuning | L4 beringin | L5 aspal | PUSH-IN 100>110% | Teks "Putaran 3" fade in-out 1,5 dtk, glow kuning |
| 6.2 | 04:47-05:04 | 17 dtk | 2.5D | L3a bohlam (layer terpisah) | L3b warung | L4 kursi kayu+sosok duduk membelakangi | L5 aspal | PUSH-IN 100>112% ke bohlam | Bohlam berayun (rotasi +-6 derajat, periode 3 dtk), bayangan sosok ikut bergerak, kedip halus |
| 6.3 | 05:04-05:10 | 5 dtk | FOTO | 1 gambar: siluet sosok berbaju putih duduk membelakangi | PUSH-IN 100>118% sangat lambat | Sosok "bernapas" (scale 100-101%), grain, vignette |
| 6.4 | 05:10-05:17 | 8 dtk | 2.5D | L1 gelap | L2 batang karet | L3 motor+Dimas dari samping | L4 aspal | L5 warung melintas cepat di sisi kiri | PAN-KANAN cepat mengikuti motor + DOLLY 100>125% | Motion blur horizontal, shake 3 px |
| 6.5 | 05:17-05:30 | 13 dtk | FOTO | 1 gambar: close-up telinga Dimas, siluet kepala | PUSH-IN 100>112% | Vignette pekat, ripple/chromatic 1 px mengikuti senandung, teks "Putaran 4" di akhir |

### Adegan 7: Putaran keempat dan kelima: sosok mendekat

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 7.1 | 05:30-05:41 | 11 dtk | FOTO | 1 gambar: wajah Dimas pucat, sadar ini bukan kebetulan | PUSH-IN 100>108% | Desaturasi 20%, grain |
| 7.2 | 05:41-05:56 | 15 dtk | FOTO | 1 gambar: papan basah, cat putih meleleh | PUSH-IN 100>112% | Animasi 2-3 tetes cat turun (mask layer), kilap basah berkedip |
| 7.3 | 05:56-06:05 | 9 dtk | 2.5D | MASTER-WARUNG menyala + sosok duduk di L4 | PAN-KANAN 5% + PUSH-IN 100>106% | Bohlam berkedip, grain |
| 7.4 | 06:05-06:17 | 12 dtk | VIDEO AI | Gambar awal dari 7.3 (sosok lebih dekat). Motion prompt 5 dtk: sosok memiringkan badan pelan, separuh wajah pucat terlihat, senyum melebar, kamera diam | Hold, tambah PUSH-IN 100>106% di editor | Chromatic aberration 1-2 px saat wajah terlihat, teks "Putaran 5" |
| 7.5 | 06:17-06:33 | 16 dtk | FOTO | 1 gambar: tangan licin keringat di stang, bibir komat-kamit | SHAKE ringan 3 px + PUSH-IN 100>108% | Highlight keringat, grain |
| 7.6 | 06:33-06:41 | 7 dtk | 2.5D | MASTER-WARUNG: sosok berdiri di pinggir jalan di L4, L5 aspal | PUSH-IN lambat 100>115% ke sosok dengan parallax | Kabut menebal di kaki sosok, bohlam berkedip |
| 7.7 | 06:41-06:54 | 14 dtk | VIDEO AI | Gambar awal: close-up wajah sosok, mata hitam seluruhnya. Motion prompt 5 dtk: tangan kanan terangkat melambai pelan, kepala miring sedikit, kamera diam | Hold, lalu PUSH-IN 100>108% | Glitch 2 frame saat tangan terangkat, flash dingin 1 frame |
| 7.8 | 06:54-07:06 | 12 dtk | FOTO | 1 gambar: close-up bibir sosok membentuk nama Dimas | PUSH-IN 100>125% cepat 2 dtk lalu freeze | Hard cut ke hitam dan hening sesaat sebelum 8.1 |

### Adegan 8: Berhenti dan menelepon ibu

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 8.1 | 07:06-07:18 | 12 dtk | VIDEO AI | Gambar awal: motor oleng di jalan karet. Motion prompt 5 dtk: motor oleng hampir jatuh, Dimas melompat turun lalu mundur, kamera handheld | SHAKE kuat 8 px selama 1,5 dtk | Motion blur, flash putih 3 frame saat rem, cut ke hitam saat mesin mati |
| 8.2 | 07:18-07:31 | 13 dtk | 2.5D | L1 hutan gelap | L2 batang karet | L3 sosok kecil jauh + warung | L4 Dimas dari belakang di aspal | L5 kabut depan | PULL-OUT 112>100% (kesan terisolasi) | Tanpa musik, kabut nyaris diam, vignette kuat, grain |
| 8.3 | 07:31-07:45 | 14 dtk | FOTO | 1 gambar: layar ponsel satu garis sinyal, jempol menekan nama Ibu | PUSH-IN 100>115% | Glow layar, indikator sinyal berkedip |
| 8.4 | 07:45-07:53 | 8 dtk | FOTO | 1 gambar: layar memanggil, wajah Dimas diterangi biru layar | PUSH-IN 100>108% | Layar berdenyut, tanpa elemen lain |
| 8.5 | 07:53-08:05 | 12 dtk | FOTO | 1 gambar: Dimas bicara panik dengan ponsel di telinga | SHAKE ringan 2 px + PUSH-IN 100>110% | Grain, tepi gelap |
| 8.6 | 08:05-08:13 | 8 dtk | FOTO | 1 gambar: wajah Dimas menyimak suara ibu | PUSH-IN 100>120% sangat lambat | Vignette makin tebal, desaturasi 25% |

### Adegan 9: Ibu membuka rahasia

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 9.1 | 08:13-08:22 | 9 dtk | FOTO | 1 gambar: Dimas tertegun | PUSH-IN 100>108% | Grain, vignette |
| 9.2 | 08:22-08:37 | 15 dtk | FOTO | 1 gambar lebar: layar ponsel dan wajah Dimas menelan ludah | PAN dari layar ke wajah 5% | Cahaya biru layar di wajah |
| 9.3 | 08:37-08:46 | 10 dtk | 2.5D | L1 langit | L2 batang karet | L3 Dimas+motor+ponsel di telinga | L4 sosok jauh samar | L5 kabut | PUSH-IN super pelan 100>112% sepanjang shot + drift 2% | Batang bergoyang 1-2 px, kabut mengalir, sosok jauh membesar 100>104% (sangat halus), tanpa musik |
| 9.4 | 08:46-08:53 | 6 dtk | FOTO | 1 gambar: extreme close-up mata Dimas membelalak | PUSH-IN 100>130% cepat 1 dtk lalu tahan | Chromatic 1 px (efek dengung telinga), vignette pekat |
| 9.5 | 08:53-09:11 | 18 dtk | 2.5D + FOTO | L1 langit | L2 pohon | L3 bapak di motor (siluet) | L4 aspal, versi sepia/desaturasi 60%; lanjut 1 gambar bapak terbaring sakit | PULL-OUT 108>100%, lalu dissolve ke FOTO PUSH-IN 100>106% | Noise film lama, flicker 8 Hz, dissolve 0,5 dtk |

### Adegan 10: Pengungkapan di jok belakang

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 10.1 | 09:11-09:18 | 7 dtk | FOTO | 1 gambar: tengkuk Dimas, bulu kuduk berdiri | PUSH-IN 100>115% | Kabut dingin tipis di leher, vignette |
| 10.2 | 09:18-09:30 | 12 dtk | 2.5D | L1 hutan | L2 aspal | L3 motor miring | L4 stang+kaca spion (cutout terpisah) | L5 bohlam kuning dari atas | PUSH-IN 100>140% ke kaca spion | Rack focus ke spion, lampu berkedip |
| 10.3 | 09:30-09:43 | 13 dtk | VIDEO AI | Gambar awal: pantulan kaca spion. Motion prompt 5 dtk: siluet hitam perlahan muncul di jok belakang, kepala tertunduk, kamera diam | Hold | Chromatic aberration, 3 frame flash putih/invert saat siluet sempurna |
| 10.4 | 09:43-10:07 | 23 dtk | FOTO x4 | 4 gambar (2-3 dtk): suspensi motor berat | hawa dingin di punggung | tikungan berulang | papan 12 km | PUSH-IN 100>106% tiap gambar, cut cepat | Flash putih 2 frame antar gambar, grain |
| 10.5 | 10:07-10:17 | 11 dtk | 2.5D | MASTER-WARUNG: sosok berbaju putih menunggu di L4, motor+sosok hitam di L3 depan | PULL-OUT 110>100% | Kabut, bohlam berkedip |

### Adegan 11: Salam dan sosok turun

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 11.1 | 10:17-10:28 | 11 dtk | FOTO | 1 gambar: Dimas menunduk ke ponsel, tangan mengepal di stang | PUSH-IN 100>108% | Glow ponsel redup |
| 11.2 | 10:28-10:35 | 7 dtk | FOTO | 1 gambar: Dimas memejam, menarik napas | PUSH-IN 100>112% | Vignette, desaturasi 15% |
| 11.3 | 10:35-10:54 | 18 dtk | FOTO | 1 gambar: wajah Dimas mengucap salam | PUSH-IN 100>108% | Efek minimal, grain tipis |
| 11.4 | 10:54-11:06 | 12 dtk | VIDEO AI | Gambar awal: punggung Dimas dengan bayangan hitam di jok. Motion prompt 6 dtk: bayangan menipis seperti asap lalu hilang, kamera diam | Hold | Opacity bayangan 100>0% (bisa manual di 2.5D), kabut naik, cahaya menghangat sedikit |

### Adegan 12: Sosok pergi dan keluar dari hutan

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 12.1 | 11:06-11:17 | 11 dtk | 2.5D | L3 sosok berbaju putih berdiri (lengan terpisah) | L4 motor+Dimas depan | L5 kabut | PUSH-IN 100>108% | Lengan sosok turun (rotasi bahu 40 derajat), bohlam berkedip |
| 12.2 | 11:17-11:27 | 10 dtk | 2.5D | MASTER-WARUNG: lampu menyala lalu padam, sosok memudar | PULL-OUT 108>100% | Lampu off (opacity 100>0 dalam 0,3 dtk), sosok fade 100>0, exposure -40% |
| 12.3 | 11:27-11:42 | 15 dtk | 2.5D | L1 hutan | L2 jalan | L3 motor+Dimas | L4 papan baru 3 km muncul di depan | DOLLY maju 100>125% | Sapuan lampu motor, warna mulai hangat |
| 12.4 | 11:42-11:55 | 14 dtk | 2.5D | L1 langit | L2 rumah-rumah desa | L3 gerbang desa | L4 gang+motor | L5 lampu teras kuning di ujung | DOLLY maju 100>130% | Glow lampu teras menguat, transisi warna teal ke hangat, grain |

### Adegan 13: Tiba di rumah: klimaks akhir

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 13.1 | 11:55-12:06 | 11 dtk | 2.5D | L1 langit subuh gelap | L2 pagar+pohon pisang | L3 rumah kampung (teras+lampu) | L4 motor di halaman | L5 rumput depan | PUSH-IN 100>110% | Glow lampu teras, kabut tipis, grain |
| 13.2 | 12:06-12:16 | 10 dtk | FOTO | 1 gambar: pintu kayu, tangan Dimas mengetuk | PUSH-IN 100>108% | Getar 1 px tiap ketukan (sinkron SFX tiga kali) |
| 13.3 | 12:16-12:24 | 8 dtk | FOTO | 1 gambar: celah bawah pintu dengan bayangan kaki ibu | PUSH-IN 100>115% ke celah | Cahaya dari dalam, bayangan diam |
| 13.4 | 12:24-12:36 | 11 dtk | FOTO | 1 gambar: gagang pintu dan celah | PUSH-IN 100>110% | Tanpa gerakan lain |
| 13.5 | 12:36-12:49 | 13 dtk | FOTO | 1 gambar: Dimas tersenyum lelah | PULL-OUT 108>100% | Warna hangat |
| 13.6 | 12:49-13:01 | 12 dtk | FOTO | 1 gambar: wajah Dimas, senyum hilang | PUSH-IN 100>125% perlahan | Warna bergeser dingin (teal +20) selama shot, vignette |
| 13.7 | 13:01-13:14 | 13 dtk | 2.5D | L1 pintu | L2 dinding teras | L3 bayangan Dimas di dinding | L4 bayangan kedua di belakang kepala | L5 belakang kepala Dimas (cutout, blur) | PUSH-IN 100>120% | Bayangan kedua membesar 100>110%, lampu teras berkedip sekali |

### Adegan 14: Penutup

| Shot | Waktu | Durasi | Teknik | Lapisan / aset | Gerak kamera | Efek |
|---|---|---|---|---|---|---|
| 14.1 | 13:14-13:19 | 5 dtk | 2.5D | L1 langit | L2 batang jauh | L3 batang tengah | L4 jalan kosong | L5 kabut depan | PULL-OUT 115>100% (naik tinggi) | Kabut mengalir, grain, fade perlahan ke gelap |
| 14.2 | 13:19-13:25 | 6 dtk | 2.5D | L1 pintu rumah | L2 dua bayangan berdampingan | L3 lampu teras | PULL-OUT 105>100% lalu fade ke hitam | Judul akhir JALAN PULANG fade-in, musik menghilang |

## 7. Estimasi kerja dan checklist
- Estimasi waktu kasar: 2.5D sekitar 10 menit per shot (28 shot), foto sekitar 2 menit (39 shot), klip AI sekitar 10 menit termasuk percobaan ulang (5 shot), ditambah sound design dan render. Total sekitar 7-9 jam.
- Urutan kerja yang disarankan: buat aset induk dan character sheet, kerjakan adegan 4-7 dan 10 (paling menentukan retensi), lalu sisanya.
- Checklist sebelum render: framing 9:16 aman, tidak ada lubang di belakang layer, tidak ada gerakan sama berurutan, semua shot punya grain dan vignette yang sama, label konten AI diaktifkan saat upload.

