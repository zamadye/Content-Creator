# Insights — THE LAST SIGNAL

Hanya berisi hal yang sudah diukur pada file nyata. Setiap baris menyebut buktinya.

## Narasi & suara

**Batas TTS yang sebenarnya:** satu klip boleh **sampai 20 detik**, dan satu
episode boleh **5–7 klip**. Batas itu bukan pembatas cerita — pembatasnya adalah
total durasi Shorts (≤ 60 s). Jadi anggaran nyata: 6 klip × ~8–10 s, atau 5 klip
× ~11 s kalau ceritanya butuh satu kalimat panjang yang utuh, bukan dipotong.

**Tempo TTS Indonesia ≈ 1,8 kata/detik, bukan 2,3.**
Diukur dari LS-0002: 110 kata → 60,7 detik audio (6 klip). Estimasi awal 2,3
kata/detik membuat episode pertama yang dibangun lewat `build-episode.mjs`
meledak jadi 64,3 detik dan ditolak kontrak (maks 60). Anggaran aman:
**≤ 17 kata per scene, ≤ 100 kata per episode** (6 scene).

**Padding 4 frame di awal + 8 di akhir** cukup untuk napas antar scene.
LS-0002: speech 53,6 s + 2,4 s padding = 56,0 s. Padding 6+12 (dipakai LS-0001)
lebih lapang tapi memakan 2 detik yang lebih baik dipakai untuk kata.

**Musik tidak boleh di-loop per scene.** Skor harus satu file sepanjang episode
(`scripts/make-score.mjs --episode <ID>`), karena restart tiap cut membunuh tensi.

**Stinger jump scare punya transien tinggi.** `loudnorm` dengan target −1,5 dBTP
pernah menghasilkan +1,0 dBTP. Perbaikan yang terbukti: `aresample=192000` sebelum
`loudnorm`, target `TP=-3`. Hasil LS-0001 v3: −1,6 dBTP, −14,7 LUFS.

## Thumbnail = frame 0

**YouTube tidak memberi cara memilih thumbnail lewat API untuk kanal ini**, dan
Shorts memang tidak punya thumbnail terpisah. Jadi frame pertama video *adalah*
thumbnail-nya, dan ia dirender, bukan diunggah.

Aturan yang sekarang dipegang:

- Headline 2–4 kata, maksimal 42 karakter, di sepertiga atas (titik pandang
  pertama). Kalimat penasaran, bukan judul lengkap: "NAMAMU DI KAMAR KOSONG",
  bukan "Kamar Sembilan".
- Subjek horor wajib terlihat jelas di tengah-bawah, dan wajib ada ruang gelap
  di atasnya untuk teks. Karena itu setiap episode punya `images/thumb.png`
  yang digambar khusus — gambar scene pertama biasanya terlalu kosong untuk
  terbaca di feed.
- Kicker kecil (waktu/tempat) memberi kesan arsip: "KAMAR 9 · 01.52".
- Ditahan 12 frame (0,4 detik) dengan dorongan kamera 1,0 → 1,045, lalu
  potongan keras. Poster statis 2 detik membunuh retensi detik pertama; 0,4 detik
  cukup untuk YouTube mengambil frame dan tetap terasa seperti potongan.

## Visual

**Satu gambar untuk 9 detik = slideshow.** Yang menyelamatkan ritme: 2 cut per
scene dengan framing berbeda (skala 1,3 dan 1,5 + offset), sehingga 26 shot dalam
57 detik (rata-rata 2,19 s/shot).

**Gambar 768×1376 di-upscale ke 1080×1920** oleh Remotion. Selisih 1,4× masih
tajam setelah grain dan vignette; ini batas bawah resolusi yang bisa diterima.

**Wajah agen di jumpscare dipakai ulang lintas episode** (`images/scare-face.png`).
Itu keputusan identitas, bukan kelalaian: penonton mengenali "wajah kanal" dalam
0,5 detik. Yang divariasikan adalah timing, flash, dan zoom.

## Produksi

**Biaya render di 2 vCPU:** 1.712 frame 1080×1920 = ~400 s render + ~155 s encode.
Budget satu episode baru: TTS 6 klip, 6 gambar, 1 render, 1 encode, 1 QC.

**Nominasi QC yang tidak bisa ditawar** (dari `scripts/qc.ts`, dipakai juga di
runner sebelum upload): 1080×1920, 30 fps, 40–60,5 s, audio AAC, −16…−12 LUFS,
true peak ≤ −1 dBTP, ≤ 40 MB, rata-rata shot ≤ 3 s.

## Batas alat (yang harus diperhitungkan sebelum menjadwalkan produksi)

**10 gambar dan 10 klip TTS per putaran kerja.** Satu episode butuh 6 gambar +
6 narasi, jadi **satu putaran maksimal satu episode penuh**. Rencana produksi
yang mengasumsikan dua episode per putaran akan selalu gagal di gambar ke-7.

**Sandbox kerja bisa di-reset tanpa peringatan.** Kejadian nyata hari ini: reset
menghapus `node_modules`, `renders/`, dan mengembalikan HEAD ke commit dasar,
sekaligus memakan ~3 jam jeda (05.45Z → 08.33Z). Semua yang tidak di-commit
hilang. Aturan yang dipakai sekarang: **commit setelah setiap episode lolos QC**,
jangan menumpuk pekerjaan di working tree. `scripts/dev/bootstrap.sh` memulihkan
lingkungan dalam ~40 detik setelah reset.

**Klip TTS bisa mengandung hening ekstra.** scene-05 LS-0003 keluar 15,74 detik
untuk 13 kata (rata-rata normalnya ~7 detik), lalu 11,38 detik setelah
diregenerasi. Selalu ukur durasi per klip sebelum alignment; satu klip yang
menggembung membuat satu scene terasa berhenti.

## Publikasi

**Zernio tidak bisa dihubungi dari sandbox.** Semua panggilan API dijalankan di
GitHub Actions. Video diangkut lewat repo (`releases/`), diunggah ke storage
Zernio dari runner, lalu `createPost({ publishNow: true })`.

**Bukti sukses harus dari API**, bukan dari HTTP 200: `platformPostUrl` untuk
akun YouTube `thelastsignal-id`. Tanpa itu, statusnya "belum terbit".

**`containsSyntheticMedia: true`** selalu dikirim — pengungkapan konten sintetis
adalah syarat, bukan opsi.

## Kegagalan yang sudah dibayar mahal

| Kejadian | Sebab | Perbaikan permanen |
| --- | --- | --- |
| v1 ditolak | 54 MB untuk 50 s, tanpa audio, satu gambar per 8–10 s | encode CRF + QC ukuran, score + SFX wajib, 2 cut/scene |
| v2 ditolak | tanpa musik latar, tanpa jump scare, narasi dokumenter | `make-score.mjs`, `episode.jumpscares`, narasi "Bayangkan/Rasakan" |
| Render LS-0001 gagal berulang | Chrome Remotion tidak bisa diunduh | `scripts/dev/provision-browser.sh` (npm @sparticuz/chromium) |
| QC true peak gagal | transien stinger + loudnorm single-pass | resample 192 kHz + TP −3 |
| Naskah LS-0002 64,3 s | estimasi kata terlalu optimistis | anggaran 17 kata/scene |

## Pelajaran 2026-11-04 — sesi kedua (hook baru, kontradiksi, dan batas alat)

**1. Hook, akhir cerita, dan judul adalah satu klaim yang sama.**
LS-0005 sempat punya tiga versi kebenaran sekaligus: hook "video baru diunggah
besok pagi", akhir cerita "diunggah tiga jam sebelum berangkat", judul "tiga jam
sebelum mereka merekamnya". Penonton tidak akan menyebutnya kontinuitas — mereka
akan menyebutnya bohong. Aturannya sekarang: setiap kali hook diganti, tiga hal
ikut diperiksa dalam satu tarikan napas — kalimat pembuka, kalimat terakhir, dan
judul. Kalau salah satu tertinggal, episode itu belum selesai.

**2. Gambar bisa jadi bukti terkuat, bukan pelengkap.**
Gambar LS-0007 awalnya menghasilkan koran bertanggal 1932 sementara narasi
menjanjikan "tahun depan". Daripada memaksa gambar mengikuti teks, teks yang
mengikuti bukti justru lebih kuat: foto tiga pekerja di dalam ruangan itu
bertanggal 1998, puluhan tahun sebelum mereka masuk. Prinsipnya: kalau sebuah
detail visual sudah terlihat meyakinkan, ubah kalimatnya agar detail itu menjadi
bukti — jangan buang gambarnya hanya karena tanggalnya tidak sesuai rencana.

**3. Batas alat menentukan bentuk kerja, bukan sebaliknya.**
10 gambar dan ±10 klip suara per giliran. Artinya satu episode utuh adalah satu
giliran. Rencanakan: satu giliran = aset + render episode berjalan; giliran
berikutnya = episode baru. Jangan pernah memulai episode baru di menit terakhir
giliran.

**4. Workflow unggah menolak dua permintaan dalam satu push.**
Ini disengaja (jeda antar-video dijaga manusia). Akibatnya: mengubah dua berkas
antrean sekaligus — misalnya memperbaiki judul LS-0006 sambil menandai LS-0005 —
membuat push gagal di langkah "Tentukan permintaan". Satu berkas antrean per push.

**5. Angka di thumbnail bekerja lebih baik daripada kata sifat.**
"MOBIL ITU MASUK 5 KALI" dan "LIFT ITU BERHENTI DI LANTAI 19" langsung
menyampaikan ketidakmungkinan tanpa perlu membaca kalimat lengkap.

**6. `stills.ts` bergantung pada remotion.media; di sandbox yang jaringan luarnya
dibatasi, ambil frame lewat ffmpeg bawaan Remotion:**
`node_modules/.pnpm/@remotion+compositor-linux-x64-gnu@*/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg`.

## Pelajaran 2026-11-04 — sesi ketiga (musik yang hilang, CTA, dan batas ffmpeg)

**1. Parameter yang tidak pernah diperiksa adalah parameter yang akan rusak.**
Empat episode terbit dengan skor musik **senyap total**. Penyebabnya satu field:
`sectionAt()` mengembalikan `{name, energy}` tanpa `gain`, sementara loop
mengalikan sampel dengan `section.gain`. `undefined` membuat semuanya `NaN`,
dan `Math.round(NaN)` ditulis sebagai `0` — berkas tetap terbentuk, panjangnya
benar, hanya isinya nol. QC tidak menangkapnya karena loudness mix tetap wajar:
narasi dan efek suara masih ada.

Yang berubah: `make-score` melempar galat kalau skor yang dihasilkan senyap, dan
QC punya cek baru `skor musik terdengar` yang membaca puncak `score.wav`.
Pelajaran umumnya: **setiap aset yang dibuat otomatis butuh satu cek yang
membuktikan aset itu tidak kosong.**

**2. Batas library lebih menentukan desain daripada selera.**
ffmpeg bawaan Remotion di-build minimal — hanya 50 filter, tanpa `alimiter`,
`acompressor`, atau `ebur128`. Akibatnya mix horor (stinger tajam + narasi)
tidak bisa memenuhi −14 LUFS **dan** true peak ≤ −1 secara bersamaan; setiap
kali dipaksa, salah satu jebol. Solusi yang dipakai: build ffmpeg lengkap dari
`imageio-ffmpeg` (PyPI), lalu `loudnorm` + `alimiter`. Runner Actions memasang
ffmpeg penuh lewat apt, jadi jalur unggah tidak terpengaruh.

**3. CTA harus menyambung dari cerita, bukan ditempel.**
"Kalau kamu tidak ingin radio di rumahmu menyala sendiri, klik subscribe" jauh
lebih kuat daripada "jangan lupa subscribe" karena konsekuensinya masih
bergema dari payoff. Permintaan komentar juga harus bisa dijawab: "barang apa
yang pernah hilang?" bukan "tulis pendapatmu".

**4. Dua teks yang mengatakan hal yang sama akan saling menimpa.**
Kartu CTA memuat kalimat yang juga diucapkan narasi; subjudul otomatis
menampilkannya di saat yang sama, jadi keduanya bertumpuk di layar. Subjudul
sekarang dipotong tepat sebelum kartu masuk. Pemeriksaan frame CTA (seperti
pemeriksaan frame 0) harus jadi kebiasaan, bukan pengecualian.

**5. Gambar hasil model membawa asumsi budayanya sendiri.**
Gambar dinding perahu awalnya penuh nama Irlandia (O'NEILL, MURPHY) untuk cerita
pesisir Indonesia. Nama-nama itu harus ditulis eksplisit di prompt. Kalau tidak,
penonton Indonesia akan melihat ketidakcocokan yang lebih besar daripada
efek horornya.
