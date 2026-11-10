# RENCANA VISUAL & PRODUKSI — "Kamu Masih Muda" (Ad Hominem Longform)

Status: PLANING ONLY — belum ada gambar/animasi yang dibuat (sesuai instruksi user).
Naskah: v2 DISETUJUI user. Audio: voice-05 7:37, hash terverifikasi.
Prinsip user: tidak harus sempurna — pola pencarian ad hominem di kolom komentar
adalah bagian dari konten, jadi desain harus mendukung iterasi episode berikutnya.

---

## 1. KONSEP VISUAL INTI

**Bahasa visual: "Meja Debat"** — semua konten cerita terjadi sebagai objek di
atas meja/papan: kartu argumen, stempel, garam, mikrofon. Orang muncul sebagai
karakter vektor bergaya sama dengan staircase (penerus langsung — brand
consistency), tapi PUSAT cerita digeser ke objek supaya konsep "menyerang
argumen vs menyerang orang" terlihat sebagai AKSI FISIK yang jelas:
kartu ditepak, distempel, dililit tali, ditutup tangan.

- Gaya: vektor flat 2D (SVG/PIL, gaya penerus staircase), 12 fps digambar /
  24 fps kontainer, 720x1280 vertikal (master YT/TikTok). Horizontal menyusul
  bila perlu (dari scene kunci).
- Palet: lanjutkan brand — krem #f2e2c9, tinta #193333, koral aksen (serangan),
  hijau pucat #bcd6d0 (argumen/isu), + slate gelap untuk segmen "toxic/twist".
- Tipografi: Archivo (utama) + Permanent Marker (stempel serangan) — 2 keluarga,
  sesuai standar. Headline pendek, tidak menutup wajah.
- Hukum objek (standar proyek): tiap scene ≥2 objek konkret; 1 objek tanda tangan
  per fallacy (peta C4) supaya penonton mengingat lewat benda, bukan teks.
- Pattern interrupt tiap ~15–25 dtk: stempel, flip kartu, pergantian latar,
  zoom cepat, kartu 8 fallacy beruntun, frame gelap 1,5 dtk sebelum twist.

## 2. KARAKTER (rig konsisten, reuse rig staircase yang sudah diperbaiki)
- RANI "Bocah Data": jaket, menggenggam kartu/buku sumber. Korban aktif, bukan
  korban pasif — ekspresinya yang bercerita.
- PAK SENIOR (ayah/ketua RT/atasan — satu rig, kostum beda): kacamata + gelang
  stempel; garam di saku. TIDAK didiagnosis; ekspresinya dibuat memahami
  ("menjaga sesuatu"), bukan karikatur jahat.
- NARATOR: tangan saja (menaruh kartu, menunjuk, menutup komentar) — identitas
  narator tetap suara, bukan tokoh.

## 3. TIMELINE SCENE (terkunci ke durasi chunk audio; batas chunk EKSAK)

Audio: 457.24 s (7:37.24). Jeda antar chunk 0,4 dtk; sebelum twist 1,6 dtk.

| # | Window (s) | Chunk/Beat | Visual utama | Objek tanda tangan | Screen text |
|---|---|---|---|---|---|
| S1 | 0.0–8.0 | C1 meja makan | Malam; anak taruh kartu data + buku sumber; garam didorong ke tengah meja; stempel merah "BELUM MAKAN GARAM" | garam | "CERITA FIKTIF" badge |
| S2 | 8.0–16.0 | C1 kantor | Kartu ide di meja rapat; tangan menimpa stempel "JUNIOR" menutup kartu | stempel | #1 "Yang diserang: orangnya. Bukan argumennya." |
| S3 | 16.0–30.0 | C1 definisi visual | Split: kartu ARGUMEN vs figur orang; panah merah melengkung dari kartu → orang; kartu tak tersentuh (ring hijau) | panah bengkok | "Itu bukan debat. Itu ad hominem." |
| S4 | 30.0–54.4 | C1 janji video | Papan 4 ikon: mengapa / korban / dampak / konter + kartu kecil tertutup "??" (twist) | papan janji | list janji |
| S5 | 54.8–75.0 | C2 apa yang diserang | Orang dikelilingi 6 label orbit (fisik/usia/latar/niat/pengalaman/moral) menyala merah; di sisi, kartu premis/bukti/logika tenang | orbit label | #2 "Ad hominem = menyerang pribadi, bukan premis." |
| S6 | 75.0–95.0 | C2 cek ulang kasus | Replay S1 di-zoom: kartu data diberi stempel "TIDAK DIBANTAH"; garam di frame; mulut Pak Senior tutup (tidak ada balasan isi) | stempel TIDAK DIBANTAH | — |
| S7 | 95.0–107.9 | C2 3 korban | Tiga panel: kartu robek / 3 kepala pendengar / dua kursi menjauh | kartu robek | #3 "Korban: pemilik argumen, audiens, dan hubungan." |
| S8 | 108.3–142.2 | C3 dampak | Undakan turun (callback tangga): balon bicara → diam → kursi kosong; lonceng alarm ditutup tangan, debu | lonceng alarm | "learned helplessness" kecil |
| S9–S16 | 142.6–208.7 | C4 8 kartu fallacy | 8 kartu cepat (~8 dtk/kartu), 1 objek masing-masing: tinju stempel (abusive), label harga di mulut (circumstantial), cermin tunjuk (tu quoque), tali pengikat 2 figur (guilt by assoc), KTP+piala (appeal to age), boneka jerami (straw man), panah memantul ke rumah sebelah (whataboutism), mikrofon dibisukan+kacamata (tone policing) | 8 objek | nama + 1 baris contoh |
| S17 | 209.1–228.0 | C5 sosok | Patung "TIDAK PERNAH SALAH" di atas podium; antrean tag alasan berjajar di bawah | podium | — |
| S18 | 228.0–247.0 | C5 empati | Kamera ke belakang patung: dia memegang perisai bertuliskan status/wibawa; palet menghangat | perisai | "menjaga sesuatu" |
| S19 | 247.0–266.0 | C5 riset | Dua kartu fakta jujur (bukan grafik menyesatkan): "konflik ORANG LAIN: usia membantu (studi 2010)" / "konflik PRIBADI: usia ≈ tidak berpengaruh; yang menolong: melihat dari luar diri" | dua kartu | — |
| S20 | 266.0–284.6 | C5 pernyataan | Tiga kartu tebal berurutan | — | #4 "Usia ≠ kebenaran. Pengalaman ≠ bukti." + #5 "Kedewasaan = bisa mengakui 'saya bisa salah'." |
| S21–S26 | 285.0–366.4 | C6 6 langkah | Enam pintu/lensa bernomor: kaca pembesar / lingkaran napas / setir mengembalikan kartu / balon "bagian mana?" / pagar / pintu keluar (varian gelap untuk kasus abusive) | 6 objek | frasa konter muncul sebagai teks dialog | 
| S27 | 366.0–409.0 | C7 TWIST | GELOMBANG hening 1,5 dtk → cermin: tangan kita sendiri menunjuk refleksi; mock kotak komentar, balasan menghina diketik lalu DIHAPUS karakter demi karakter | cermin | #5 "...kamu bukan idemu." |
| S28 | 409.4–424.0 | C8 takeaway | Tiga kartu rekap berhenti berurutan | 3 kartu | #6 "Konter terbaik: pisahkan orang dari argumen." |
| S29 | 424.0–442.0 | C8 kolom komentar | Mock kolom komentar: kotak "Pernah kena ad hominem soal apa?" kursor berkedip; kartu aturan main (anonim, tanpa nama orang) | kotak komentar | #7 "Safety first: batas > menang debat." |
| S30 | 442.0–457.2 | C8 teaser | Siluet boneka jerami + judul berikutnya "STRAW MAN"; kartu akhir brand | boneka jerami | judul next |

Total ±30 scene. Semua scene memenuhi ≥2 objek; dialog frasa konter (S21–S26)
memakai teks dari blueprint user.

## 4. SUBTITLE & SCREEN TEXT
- SRT per chunk: batas chunk EKSAK dari durasi audio; pembagian baris di dalam
  chunk proporsional panjang kalimat (estimasi — dicek ulang saat QA).
- 7 screen text wajib blueprint sudah dipetakan ke S2, S5, S7, S20, S26, S28, S29.
- Headline S1 muncul ≤3 dtk pertama: hook "DASAR BELUM MAKAN GARAM?" ( curiosity).

## 5. SOUND DESIGN (di atas VO voice-05, mix tahap visual)
Cold open (S1–S2): riser/heartbeat halus. Definisi (S3–S5): minus-one tipis.
Dampak (S7–S8): piano lembut. Listicle (S9–S16): perkusif berirama kartu.
Kasus kedua (S17–S20): hangat → tegas. Konter (S21–S26): percussive minimal.
PRA-TWIST (sebelum S27): HENING 1,5 dtk. Twist: kembali satu instrumen.
Closing: hangat. Musik disintesis pipeline (bukan trek pihak ketiga).

## 6. THUMBNAIL & POSTER (konsep, digenerate NANTI setelah gaya disetujui)
- Opsi A (blueprint user): split — kiri figur menunjuk + stempel "KAMU MASIH MUDA!",
  kanan kartu argumen dengan ring hijau + "TAPI ARGUMENNYA?" — teks Archivo tebal.
- Opsi B: satu figur tenang, tulisan besar "AD HOMINEM", subteks "Yang diserang:
  orangnya. Bukan isinya."
- Poster 4:5 laporan produksi mengikuti standar proyek. Keputusan A/B nanti.

## 7. STRATEGI KOLOM KOMENTAR (inti arahan user — "kita mencari ad hominem")
- Video diakhiri undangan eksplisit: tuliskan contoh ad hominem yang pernah kamu
  terima (usia/fisik/masa lalu/kelompok).
- Komentar tersemat kami (saat publikasi): template + ATURAN MAIN — anonimkan
  nama/instansi, tidak menyerang balik, satu contoh satu komentar.
- Kami balas dengan MELABELI jenis fallacy-nya (abusive/tu quoque/dll) — jawaban
  kami sendiri jadi mini-kursus di kolom komentar.
- LOOP KONTEN: contoh terbaik (dengan izin penulisnya, disunting identitas)
  dibedah di episode berikutnya / Short "Deteksi 30 Detik". Ini alasan kembali
  yang berkelanjutan (bukan CTA generik) — sesuai standar channel.
- Moderasi: komentar yang menyerang orang nyata tidak di-push; safety first.

## 8. PIPELINE PRODUKSI (setelah plan ini disetujui)
1. Storyboard per scene + objectMap (standar proyek: tiap baris narasi ≥2 objek).
2. Renderer privat baru (penerus `render_private.py`): reutilitas bag/rough,
   stream frame → ffmpeg stdin (RAM-aman), 720x1280, 12fps digambar; output
   private-rough DENGAN watermark DRAF PRIVAT dulu.
3. QA mekanis: decode penuh, sampel scene, cakupan subtitle, durasi = 457.24s.
4. USER REVIEW draf ber-watermark → final render bersih HANYA setelah
   persetujuan eksplisit (flag release-clean terkunci file otorisasi).
5. Captions FB/YT/TikTok + thumbnail final + poster → paket rilis.
6. Publikasi via Buffer (shareNow atau jadwal — minta keputusan saat itu,
   hormati jeda 2 jam dari 27 post sent; terakhir tayang 00:21 UTC 10 Nov).

## 9. STATUS & HAL TERBUKA
- SUDAH: naskah v2 (disetujui), VO penuh 7:37 (hash OK, belum review telinga
  menyeluruh — silakan dengar ulang), rencana visual ini.
- BELUM / MENUNGGU KEPUTUSAN: (a) gaya thumbnail A vs B, (b) apakah master
  perlu versi horizontal, (c) target durasi final 7:37 vs perpanjang role-play
  (opsi 10–15 mnt blueprint), (d) jadwal/shareNow nanti.
- CATATAN JUJUR: belum ada visual yang dibuat; angka window scene berbasis
  chunk audio eksak + estimasi internal antar kalimat.
