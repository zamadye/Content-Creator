# ATURAN — THE LAST SIGNAL

**Satu-satunya dokumen aturan.** Kalau ada dokumen lain yang bertentangan dengan
halaman ini, halaman ini yang menang dan dokumen itu dihapus.

Versi: **6 November 2026**. Berlaku untuk semua episode, Short maupun panjang.
Setiap aturan diberi tanda sumbernya:

- **[ukur]** — berasal dari pengukuran angka (video pembanding, analytics, QC)
- **[arahan]** — keputusan pemilik kanal
- **[baru]** — disepakati 6 Nov 2026, belum pernah dipakai di episode mana pun
- **[status]** — belum diterapkan di kode; harus dikerjakan sebelum render berikutnya

---

# BAGIAN I — DASAR

| # | Aturan |
|---|---|
| 1.1 | Dua format: **Short** 40–60 s (9:16, 1080×1920) dan **video panjang** 5–10 menit (16:9, 1920×1080). |
| 1.2 | Jadwal: **09.00 WIB** video panjang, **20.00 WIB** Short (02:00Z & 13:00Z). |
| 1.3 | Episode **berdiri sendiri**. Tidak ada payung seri, tidak ada nomor arsip, tidak ada nama seri di judul. Model bentuk: **Horror Shorts Party** (satu premis kuat per episode, tidak menuntut episode sebelumnya). |
| 1.4 | Setiap unggahan = **dua platform sekaligus** (YouTube + Facebook) dalam satu panggilan. **Facebook tidak boleh tayang lebih dahulu dari YouTube.** |
| 1.5 | Video panjang ditempatkan di slot pagi; Short di slot malam. |

> **[arahan] 6 Nov 2026 (uji, mulai LL-0002):** jam tayang video panjang digeser
> dari 09.00 ke **12.00–18.00 WIB** (target 13.00 WIB) untuk menangkap jam aktif
> penonton di jam-jam pertama. Kalau data 48 jam setelah LL-0002 tidak lebih baik
> dari LS-0010, kembalikan ke 09.00 WIB. Aturan 1.2 tetap berlaku untuk Short.

---

# BAGIAN II — NASKAH: SETIAP KALIMAT DIHITUNG

> **[arahan] 6 Nov 2026:** "Naskah ini tidak kalah pentingnya. Harus disusun setiap
> kalimatnya untuk mempertahankan audience agar menonton sampai akhir — bahkan
> bisa mengulangi lagi. Jadi pikirkan setiap katanya."

## 2.1 Tiga pekerjaan kalimat

Setiap kalimat wajib melakukan **salah satu** dari tiga hal berikut. Kalau tidak
melakukan ketiganya, kalimat itu dihapus.

| Pekerjaan | Artinya | Contoh |
|---|---|---|
| **Menahan** | membuat penonton menunda pergi karena ada yang belum dijawab | "Liftnya berhenti di lantai sembilan belas." |
| **Menggerakkan** | menambah kejadian baru, bukan penjelasan | "Pintunya terbuka ke kantor yang sama persis." |
| **Membayar** | melunasi janji yang dibuka di awal | "Yang duduk di kursimu sedang menunggumu." |

Penjelasan mekanisme ("cara kerja", "prosedur", "alat itu berfungsi untuk")
**bukan** ketiganya — kecuali penjelasan itu sendiri menimbulkan pertanyaan baru.

## 2.2 Aturan per kalimat

1. **Satu kalimat, satu pukulan.** Dua gagasan = dua kalimat.
2. **Benda konkret mengalahkan perasaan abstrak.** Bukan "ia takut", tapi "ia mundur sampai punggungnya menyentuh dinding".
3. **Kata kerja di depan, kata sifat dipotong.**
4. **Jangan jelaskan, tunjukkan akibatnya.**
5. **Setiap detail harus bisa diindra.** Kalau tidak bisa dilihat/didengar/dirasakan, belum dipakai.
6. **Akhiri kalimat dengan kata yang menghantam** — nama, angka, atau ancaman.
7. **Variasi panjang.** Dua kalimat sejajar tanpa alasan = bunyi mesin. Satu panjang, satu pendek, atau buang satu.
8. **Kata pengisi dilarang:** "sebenarnya", "cukup", "agak", "sangat", "benar-benar", "secara perlahan". Satu kata pengisi menghapus satu kata yang bekerja.
9. **Jangan mengulang yang sudah terlihat.** Kalau visual sudah memperlihatkan pintu terbuka, kalimatnya tidak perlu mengatakan pintu itu terbuka.
10. **Setiap 15–20 detik harus ada kail baru** (fakta, angka, atau ancaman). Penonton tidak menunggu lebih lama dari itu.

## 2.3 Hook (detik 0–8)

Hukum lengkapnya — hook, tangga tegangan, twist, telinga — ada di
**`knowledge/NASKAH.md`**. Yang diuji mesin (`check-copy.mjs`):

| # | Aturan |
|---|---|
| 2.3.1 | Kalimat pertama maks **12 kata** (panjang) / **9 kata** (Short). Satu tarikan napas. |
| 2.3.2 | Kalimat pertama wajib memuat **angka atau penanda waktu**. |
| 2.3.3 | Dilarang dibuka dengan kata penjelas: *itu, ini, selisih, perbedaan, masalahnya, sebenarnya*. |
| 2.3.4 | **Kejanggalan** harus terdengar dalam tiga kalimat pertama (± 8 detik). |
| 2.3.5 | Bentuk hook berbeda dari episode sebelumnya. |
| 2.3.6 | Sapaan "kamu" di kalimat pertama atau kedua. |
| 2.3.7 | Twist: 2–3 kata kunci sudah terdengar **sebelum** scene terakhir (fair play). |
| 2.3.8 | Kalimat terakhir menyentuh kembali kata kunci hook (lubang ditutup). |

Dasar riset: `knowledge/NASKAH.md` bagian "Rujukan".

- Klaim liar di **klausa pertama**. Bukan latar, bukan nama tempat, bukan prosedur.
- **3–5 detik pertama** harus sudah memuat pukulan. Tidak ada pemanasan.
- Bentuk hook harus **berbeda dari episode sebelumnya** — tidak boleh mengulang pola `<benda> itu <fakta>. <twist>.` dua episode berurutan.
- Boleh: pertanyaan yang sudah membawa fakta mustahil ("Pernah lembur sampai gedung tinggal kamu sendiri? Liftnya berhenti di lantai sembilan belas.").
- Dilarang: pertanyaan kosong yang bisa dijawab "tidak pernah" tanpa kehilangan apa pun.
- **Sapaan "kamu"** di kalimat pertama atau kedua.
- Dilarang menjanjikan yang tidak ada di dalam video.

## 2.4 Retensi & tonton ulang

| # | Aturan | Bukti |
|---|---|---|
| 2.4.1 | **Belokan pertama sebelum detik 11** (Short). Cara mencapainya: potong scene 1–2, bukan scene 3. | [ukur] LS-0009: rata-rata tonton 17 s dari 58 s; belokan baru di detik 15,5 |
| 2.4.2 | **Kejadian dulu, penjelasan menyusul.** Satu scene penjelasan maksimal per episode. | [ukur] |
| 2.4.3 | **Ending harus mengubah arti kalimat pertama.** Kalau tidak, cerita hanya berjalan, tidak menutup. | [arahan] |
| 2.4.4 | **Satu detail di awal yang baru masuk akal setelah ending** — itu yang membuat orang menonton kedua kali. | [baru] |
| 2.4.5 | Penutup = **pertanyaan yang bisa dijawab penonton dalam satu kalimat**, tentang pengalamannya sendiri, tanpa pengetahuan teknis. | [ukur] |
| 2.4.5b | Metrik utama Short bukan tayangan, melainkan **VVSA** (viewed vs swiped away): berapa yang tetap menonton setelah 3 detik. Kalau VVSA buruk, yang direvisi kalimat pertama, bukan visualnya. Untuk video panjang yang dibaca rata-rata durasi tonton dan titik jatuhnya. | [ukur] |
| 2.4.6 | CTA (subscribe/like/komentar) diucapkan **di kalimat terakhir**, dibingkai sebagai akibat cerita ("Kalau kamu tidak ingin lift itu berhenti di lantaimu, klik subscribe"). Kartu CTA di layar wajib ada. | [arahan] |

## 2.5 Naskah panjang: terdengar manusia, bukan model

| Penyakit | Gejala | Obat |
|---|---|---|
| Simetri | Dua kalimat sejajar tanpa alasan | Ubah panjang salah satu, atau buang |
| Tanpa nama | Tidak ada nama diri | Minimal lima nama: orang, tempat, warung, benda |
| Tanpa benda | "perangkat", "panel", "log" | Benda yang bisa dibeli: termos, lakban, pulpen bertali |
| Tanpa tubuh | Narator tidak pernah capek/haus/ngantuk | Satu kalimat badan per 2 menit |
| Angka bulat | Semua angka rapi | "pukul 08.15 persis", "dua ratus meter" |
| Tanpa salah | Narator selalu benar | Narator wajib melakukan minimal satu kebodohan |
| Konflik metafisik saja | Hantu jahat karena memang jahat | Sebabnya manusiawi: lalai, malu, takut dipecat |
| Semua tahu | Semua paham situasi | Minimal satu karakter mengelak dengan pertanyaan |
| Suara seragam | Semua kalimat sepanjang 15 kata | Wajib ada kalimat di bawah 5 kata per 2 menit |

**Sumber:** setiap kalimat harus bisa dilacak ke rujukan Indonesia nyata (dossier
R1–R12). Detail yang dikarang tanpa rujukan tidak dipakai.

## 2.6 Struktur video panjang 8–10 menit

| Waktu | Isi |
|---|---|
| 0:00–0:40 | aturan/pekerjaan, bukan kejadian; satu kalimat yang bisa diulang penonton |
| 0:40–2:00 | tempat dan benda; penonton harus bisa menggambar ruangannya |
| 2:00–3:00 | orang lain; satu dialog yang mengelak |
| 3:00–4:00 | kejadian pertama yang **masih bisa dijelaskan** |
| 4:00–5:00 | kejadian kedua yang melanggar aturan |
| 5:00–6:30 | penyelidikan (arsip, buku, telepon) — bagian paling menentukan |
| 6:30–7:45 | sebab manusianya terbuka |
| 7:45–8:40 | narator melakukan sesuatu (bukan melarikan diri); tanpa rangkuman |
| 8:40–9:00 | CTA yang menyambung dari tema |

Aturan naskah panjang: 1.000–1.400 kata (2,2 kata/detik), 8–12 segmen, wajib
minimal tiga dialog (satu di antaranya mengelak), sudut pandang orang pertama
yang punya nama, umur, pekerjaan, dan satu masalah uang.

## 2.7 Uji naskah sebelum masuk produksi

Satu "tidak" = revisi.

1. Kalimat pertama tidak bisa diabaikan?
2. 3 detik pertama sudah berisi pukulan, bukan pemanasan?
3. Setiap kalimat mengubah keadaan penonton, bukan menambah data?
4. Ada kalimat yang bisa dihapus tanpa kehilangan apa pun? Hapus.
5. Belokan pertama sebelum detik 11 (Short)?
6. Ending mengubah arti kalimat pertama?
7. Ada satu detail di awal yang baru masuk akal setelah ending?

---

# BAGIAN III — VISUAL

## 3.1 Tokoh dan entitas itu TETAP, bukan dinamis **[baru]**

> **[arahan] 6 Nov 2026:** "Tokoh dan entitas itu dynamic, tidak tetap — entitas
> dan karakter tidak sama."

Artinya sekarang: **satu tokoh, satu makhluk, untuk seluruh kanal.** Bukan tokoh
baru tiap episode, bukan makhluk baru tiap cerita.

**Tokoh (tetap):** laki-laki Indonesia akhir dua puluhan, jaket coach hijau tua,
kaus hitam, jeans gelap, sandal karet, tas kanvas abu-abu di satu bahu, rambut
sebahu diikat longgar, lampu ponsel di tangan kanan, **wajah tidak pernah
terlihat** (selalu dari belakang/samping).

**Entitas (tetap):** "Penunggu" — ±2,2 m, sangat kurus, kain basah kelabu-putih
sampai mata kaki, leher terlalu panjang dan condong ke depan, rambut hitam basah
menutup wajah, **wajah kosong tanpa mata dan mulut**, kulit kelabu pucat dengan
bercak air, tangan satu sendi terlalu panjang, berdiri diam seperti menunggu.

| # | Aturan |
|---|---|
| 3.1.1 | Deskripsi identitas disalin **apa adanya** dari `assets/characters/characters.json` ke setiap prompt gambar. Tidak dikarang ulang, tidak diringkas, tidak ditambah. |
| 3.1.2 | Berkas acuan (`protagonis-punggung.png`, `entitas-penunggu.png`) **selalu** disertakan saat membuat gambar baru. |
| 3.1.3 | Dilarang menambah atribut baru pada tokoh atau entitas (jubah merah, tanduk, sayap, kumis, tato, ganti jaket). Kalau cerita butuh makhluk lain, ia **varian dari Penunggu** (siluet, tangan, rambut, bayangan) — bukan desain baru. |
| 3.1.4 | Cek konsistensi sebelum render: ambil 3 gambar acak, bandingkan dengan acuan. Beda kostum, proporsi, atau wajah = gambar dibuat ulang, bukan dipakai. |
| 3.1.5 | Tokoh muncul **minimal dua shot** per episode — bukan POV kosong sepanjang video. |
| 3.1.6 | Entitas muncul **tiga kali, makin dekat**: siluet/bagian tubuh → setengah badan → utuh. Utuh hanya sekali, di jumpscare. |
| 3.1.7 | Entitas tidak pernah berlari, membuka mulut, atau melukai. Tidak ada darah, tidak ada tubuh rusak. Yang menakutkan adalah benda yang berdiri diam di tempat yang tidak seharusnya ada. |
| 3.1.8 | Kamera tidak pernah mengejar entitas. Kamera menarik pelan ke belakang lebih menakutkan daripada mendekat. |
| 3.1.9 | Wajah entitas tidak pernah tajam kecuali di jumpscare, dan jumpscare memakai wajah yang sama dengan penampakan ketiga. |

## 3.2 Atmosfer VARIATIF, bukan selalu kelam **[baru]**

> **[arahan] 6 Nov 2026:** "Atmosfernya juga dynamic — tidak selalu kelam gelap,
> tapi bervariasi tergantung konteks cerita."

| # | Aturan |
|---|---|
| 3.2.1 | Atmosfer ditentukan **isi cerita**, bukan selera kanal. Pasar malam = lampu kuning hangat dan ramai. Kantor siang = neon putih dan bersih. Rumah tua = coklat hangat dan debu. Hutan = hijau lembap. Gudang bawah tanah = gelap dan sempit. |
| 3.2.2 | **Minimal satu adegan terang di setiap episode.** Kontras yang membuat gelap terasa; episode yang gelap dari awal sampai akhir tidak punya kejutan. |
| 3.2.3 | Palette, sumber cahaya, dan suhu warna ditulis **per scene** di `episode.json` (`visual.lighting`, `visual.intensity`, `visual.effects`). Tidak ada satu grade global untuk seluruh episode. |
| 3.2.4 | Dilarang mengulang kombinasi "malam + biru-teal + hujan" dua episode berurutan. |
| 3.2.5 | Gerak di dalam frame (hujan, debu, kabut, lampu berkedip, asap) dipilih sesuai tempat, bukan ditempel seragam. |

> **[status]** Renderer saat ini memakai grade dingin tetap
> (`saturate/contrast/brightness` + lapisan gradien biru-hijau) untuk semua scene.
> Sebelum video panjang dirender, grade harus dibaca dari `visual.lighting` per
> scene supaya aturan 3.2.3 benar-benar berlaku.

## 3.3 Visual mengikuti narasi, bukan mendahuluinya **[baru]**

> **[arahan] 6 Nov 2026:** "Visual tidak sinkron dengan naratif — visual lebih dulu
> keluar sebelum naratif masuk. Misal visual Pak Sukirman suka ngopi keluar dulu
> sebelum kata itu diucapkan."

| # | Aturan |
|---|---|
| 3.3.1 | **Tidak ada objek, orang, atau aksi yang tampil sebelum narasi menyebutnya.** Gambar masuk pada kata, bukan sebelum kata. |
| 3.3.2 | Objek masuk **+2 s.d. +4 frame setelah** onset kata pemicunya. Sedikit sesudah, bukan tepat, supaya tidak terasa seperti stempel. |
| 3.3.3 | **Latar boleh lebih dulu.** Yang dilarang adalah objek/aksi spesifik mendahului sebutannya. |
| 3.3.4 | Satu kalimat yang menyebut dua benda butuh dua insert, bukan satu gambar gabungan. |
| 3.3.5 | Titik potong mengikuti kata, bukan sebaliknya. Insert tidak boleh muncul di tengah kalimat lain hanya karena enak dipotong. |
| 3.3.6 | Kalau kata pemicunya di akhir kalimat, gambar masuk di akhir kalimat itu — retensi tidak boleh dibeli dengan membocorkan isi kalimat. |
| 3.3.7 | Aturan ini berlaku juga untuk **suara**: SFX baru berbunyi saat benda/peristiwa itu disebut. |
| 3.3.8 | Jumpscare satu-satunya yang boleh menimpa; tetap tidak boleh mendahului kata yang menyebutnya. |

> **[status]** Butuh peta waktu **per kata** dari alignment narasi; sekarang
> alignment baru sampai batas kalimat — itulah sebabnya visual bisa muncul lebih
> dulu. Sampai peta kata ada, insert ditaruh di **awal kalimat yang menyebutnya**
> (lebih lambat, tapi tidak pernah mendahului).
>
> **[status] 6 Nov 2026:** sejak LL-0002 setiap shot di `visual-map.json` wajib
> punya `pemicu` (kata yang harus sudah diucapkan) dan `offset_frame` 2–8.
> `node scripts/check-visual-triggers.mjs stories/longform/<id>` gagal kalau ada
> pemicu yang tidak terdapat di narasi segmennya. Ini mengikat gambar ke kalimat,
> belum ke frame persis — itu tetap pekerjaan alignment per kata.

## 3.4 Irama shot

| # | Aturan | Angka |
|---|---|---|
| 3.4.1 | Shot Short: **1,2–1,8 detik**, rata-rata ±1,55. | [ukur] referensi 1,0 s |
| 3.4.2 | Video panjang: cut tetap rapat, **2–4 detik per shot**. Slow zoom hanya mengisi shot yang sudah ada, bukan pengganti cut. | [ukur] |
| 3.4.3 | Titik potong jatuh di batas kata/kalimat; tidak pernah membelah satu kata. | [ukur] |
| 3.4.4 | Tangga framing bergantian dengan selisih skala minimal **0,25** (1,00 → 1,34 → 1,12 → 1,48). Selisih kecil terbaca sebagai gambar bergeser, bukan shot baru. | [ukur] |
| 3.4.5 | Kamera berbeda setiap shot berurutan; setiap cut punya punch 6 frame + jolt 8 frame. | [ukur] |
| 3.4.6 | Tidak ada counter penonton/follower palsu di overlay. | [ukur] |
| 3.4.7 | Kamera tidak bergerak sendiri (referensi: 0,000 px/frame); kesan hidup datang dari cut + partikel di dalam frame. | [ukur] |

---

## 3.5 HUD kamera pengawas: HANYA untuk episode yang memang rekaman kamera

Overlay `REC` / `CAM 07` / timestamp bergerak adalah bahasa visual kanal, tetapi
**bukan bawaan**. HUD menyatakan "peristiwa ini terekam kamera pengawas". Kalau
narator bercerita orang pertama ("saya petugas sensus", "saya laki-laki 27
tahun"), tidak ada kamera yang merekamnya — stempel REC di sudut frame langsung
membocorkan bahwa ini templat.

Karena itu keputusan HUD tidak lagi diambil dari `format`, melainkan dari
pernyataan episode:

- `production.hud: true` → HUD tampil (hanya untuk naskah berformat rekaman kamera).
- selain itu → tidak ada HUD, apa pun formatnya (Short maupun panjang).

`build-episode.mjs` menulis `hud: false` sebagai bawaan; naskah yang memang
found-footage harus menyatakan `hud: true` di `stories/slate.json`.
Ditemukan pada render LS-0012 (2026-11-07): HUD muncul di cerita petugas sensus
dan harus dirender ulang.

## 3.6 Short punya rantai bangun sendiri

`bash scripts/build-all.sh <ID>` mengenali dua jalur:

| Folder naskah | Rantai |
|---|---|
| `stories/longform/<ID>` | plan → build-longform → align-narration → align-cuts → skor → ambience → overlay → validasi |
| `stories/shorts/<ID>` | slate.json → build-episode → align-narration → skor → ambience → overlay → thumb → validasi |

`align-cuts` sengaja **tidak** dipakai di jalur Short: skrip itu mengejar kata
pemicu dari daftar shot di plan longform, sedangkan Short punya satu narasi per
scene dengan tiga potongan yang sudah ditempatkan `build-episode.mjs` di
28/56/82% scene.

## 3.7 Satu elemen utama per frame: kartu hook didahulukan

Kartu teks dan subtitle tidak boleh berukuran sama besar. Kalau keduanya
sebesar itu, frame pertama terbaca sebagai dua judul yang berkelahi dan mata
tidak tahu harus mulai dari mana.

Aturan (ditetapkan 7 Nov 2026, arahan pemilik kanal):

| Elemen | Ukuran | Peran |
|---|---|---|
| Kartu hook (`onScreenText`) | **104–150 px**, adaptif panjang teks | satu-satunya hal yang dibaca di frame itu |
| Subtitle berjalan | **64 px** | pendamping, bukan pesaing |

Kartu memakai garis tepi gelap 9 px supaya tetap terbaca di atas foto terang.
Subtitle **tidak** ikut dibesarkan lagi tanpa mengecilkan kartu — kalau nanti
keterbacaan subtitle dinilai kurang, yang dinaikkan dulu adalah kontras dan
garis tepi, bukan ukuran huruf.

# BAGIAN IV — SUARA

| # | Aturan | Sumber |
|---|---|---|
| 4.1 | Musik latar **satu berkas sepanjang episode**, tanpa jeda. Referensi: 0 celah sunyi dalam 25,29 s. | [ukur] |
| 4.2 | Ambience per scene hanya lapisan kedua; turunnya tidak boleh menyisakan keheningan. | [ukur] |
| 4.3 | Musik **ducking** saat narasi berjalan. | [ukur] |
| 4.4 | SFX dipilih dari isi cerita (pintu, petir, tawa, napas, langkah) dan ditempel ke kata pemicunya. | [arahan] |
| 4.5 | Empat suara makhluk wajib tersedia: `sfx_geraman_setan`, `sfx_teriakan` (**sekali per episode**, di puncak), `sfx_tangisan`, `sfx_desahan_iblis`. | [arahan] |
| 4.6 | Panjang cue SFX mengikuti durasi berkas aslinya (tangisan 7 detik tidak dipotong 4 detik). | [ukur] |
| 4.7 | Target **−14 LUFS**, true peak ≤ **−1 dBTP**, ukuran file ≤ 40 MB (Short) / ≤ 200 MB (panjang). | [ukur] |
| 4.8 | Riser tidak dipakai sebelum 2/3 durasi video panjang — kejutan yang datang terlalu awal menghabiskan tenaga. | [ukur] |

Pustaka aset & level: `knowledge/audio.md`.

---

# BAGIAN V — SUBTITLE

| # | Aturan | Angka |
|---|---|---|
| 5.1 | Posisi **tengah layar** (47–50 % tinggi), bukan bawah. | [arahan] |
| 5.2 | **1–3 kata per kartu**, maksimal 16 karakter; tidak pernah satu kalimat. | [ukur] |
| 5.3 | **Satu kartu satu baris.** Kalau panjang, huruf mengecil (92 → 79 → 68 px), bukan turun ke baris kedua. | [ukur] |
| 5.4 | Huruf besar, putih `#f7f4ec`, garis luar hitam tebal 13 px, tanpa kotak latar; kata aktif kuning `#f5c451`. | [ukur] |
| 5.5 | Tanda baca dibuang. | [ukur] |
| 5.6 | Portrait 92 px (maxWidth 950) · landscape 62 px (maxWidth 1380). | [ukur] |
| 5.7 | Subtitle berhenti sebelum kartu CTA masuk. | [ukur] |

---

# BAGIAN VI — COPYWRITING UNGGAHAN

| # | Aturan | Sumber |
|---|---|---|
| 6.1 | **"ARSIP FIKSI" dilarang total** — di frame, judul, deskripsi, komentar. Begitu juga "dibuat dengan bantuan AI", "adalah fiksi", dan pernyataan sejenis. Ditegakkan sebagai *error* di `check-copy.mjs` dan di gerbang unggah. | [arahan] |
| 6.2 | **Label AI tidak dicentang**: YouTube `containsSyntheticMedia=false`, Meta `isAiGenerated=false`. Alasan: video dirakit per scene dengan kode, naskah dan pengarahan dikerjakan manusia; label itu untuk video yang seluruhnya digenerate model video. | [arahan] |
| 6.3 | `publishing.syntheticDisclosure` tetap ada sebagai **catatan internal**; tidak pernah dikirim ke platform. | [arahan] |
| 6.4 | **Judul:** dibuka dengan peristiwa; klaim selesai sebelum karakter ke-40; satu angka/penanda waktu di tiga kata pertama; sudut pandang "kamu"; maks 100 karakter; bentuknya beda dari episode sebelumnya; kata kunci pencarian di ekor, bukan sebagai label di depan. | [ukur] |
| 6.5 | **Deskripsi:** baris pertama = hook, bukan label. Tiga beat cerita + satu pertanyaan penonton. Tanpa blok penafian. Tanpa `\n` harfiah. Hashtag 3–4. | [arahan] |
| 6.6 | **Komentar sematan:** satu pertanyaan yang hanya masuk akal untuk episode itu + satu ajakan. Wajib memuat tanda tanya. Tidak identik dengan episode lain. | [ukur] |
| 6.7 | **Thumbnail = frame 0:** headline 3–6 kata (≤42 karakter), memuat angka atau konsekuensi, tidak boleh berbohong. | [ukur] |

---

# BAGIAN VII — DISTRIBUSI & ARSIP

| # | Aturan |
|---|---|
| 7.1 | Short 9:16 ≤ 90 s → Facebook **Reel**; video panjang 16:9 > 90 s → video feed. |
| 7.2 | Jarak antar-Reels **2 jam**; jarak antar-unggahan YouTube minimal **55 menit**. |
| 7.3 | Satu berkas antrean = satu unggahan = satu jalan workflow. Dua berkas `requested` dalam satu push = workflow menolak. |
| 7.4 | Drive adalah satu-satunya arsip: `01 Pratinjau (belum terbit)` → `02 Arsip (sudah terbit)`. Repo tidak menyimpan video terbit. |
| 7.5 | Nama berkas Drive: `<ID> — <judul cerita> (<versi>, <durasi>).mp4`. |
| 7.6 | Repo hanya menyimpan episode yang sedang dikerjakan + satu episode acuan (LS-0010 desain v1). |
| 7.7 | Status terbit yang benar dibaca dari daftar post Zernio, bukan dari `fb-reels-state.json`. |

Mekanisme teknis: `knowledge/distribution.md` · struktur Drive: `knowledge/drive.md`.

---

# BAGIAN VIII — GERBANG QC

Semua harus hijau sebelum satu byte diunggah:

1. Resolusi, fps, durasi, codec sesuai kontrak
2. Loudness −16…−12 LUFS · true peak ≤ −1 dBTP · ukuran sesuai format
3. Skor musik terdeteksi (bukan episode bisu)
4. Rata-rata shot ≤ 3 detik
5. **[status]** Tidak ada insert visual sebelum onset kata pemicunya + jarak rata-rata kata→gambar dilaporkan
6. **[status]** Rata-rata shot panjang 2–4 detik, dan minimal satu scene terang
7. `check-copy` lolos (tanpa label arsip, judul ≤ 100, komentar bertanya, CTA ada)
8. Peta entitas: 3 kemunculan, makin dekat, utuh hanya di jumpscare
9. Konsistensi tokoh/entitas terhadap berkas acuan (3 sampel gambar)

---

# BAGIAN IX — DAFTAR HITAM

Segala yang tidak boleh muncul lagi:

- "ARSIP FIKSI" dan kalimat pengungkapan lain, di mana pun
- Kotak centang label AI di YouTube/Meta
- Payung seri / nomor berkas / kalimat pembuka wajib
- Atmosfer gelap-biru-teal sebagai default semua episode
- Tokoh atau entitas dengan desain berbeda antar episode
- Objek yang tampil sebelum narasi menyebutnya
- Zoom pelan sebagai pengganti cut
- Counter penonton/follower palsu
- Judul berpola `<benda> itu <fakta>. <twist>.` dua episode berurutan
- Kalimat pengisi, simetri kalimat tanpa alasan, penjelasan tanpa kail
- Angka/episode yang dikarang: semua bukti di dokumen ini punya sumber

---

# BAGIAN X — STATUS IMPLEMENTASI

| Aturan | Sudah di kode? |
|---|---|
| Subtitle tengah, 1–3 kata, satu baris, tanpa tanda baca | ya (`SubtitleTrack.tsx`) |
| Shot cepat + tangga framing + cut di batas kalimat | ya (`plan-design.mjs`) |
| Musik satu berkas + ducking | ya (`Soundscape.tsx`) |
| Larangan "ARSIP FIKSI" di teks | ya (`check-copy.mjs`, `zernio-publish.mjs`) |
| Label AI tidak dicentang | ya (`zernio-publish.mjs`) |
| Entitas 3× makin dekat | ya — `scripts/check-visual-triggers.mjs` gagal kalau kemunculan ≠ 3 atau urutannya bukan siluet → setengah → utuh |
| Konsistensi tokoh/entitas | **belum** — belum ada pemeriksa otomatis terhadap `assets/characters/*.png` |
| Atmosfer variatif per scene | sebagian — palet per scene sudah ditulis di `visual-map.json`, grade per scene **belum** di renderer |
| Visual mengikuti kata (3.3) | sebagian — `scripts/check-visual-triggers.mjs` memastikan setiap shot punya kata pemicu yang benar-benar ada di narasi segmennya; pemetaan kata → frame tetap butuh alignment per kata |
| QC butir 5, 6, 9 | **belum** ada di `qc.ts` |
