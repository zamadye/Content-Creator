# STANDAR MINIMAL PRODUKSI KONTEN
### Suara Publik — mesin editorial Indonesia
Versi 3.0 · 2 November 2026 · **mengikat**: setiap misi yang diproduksi dengan `editorial-engine/` wajib lulus dokumen ini sebelum diunggah.

> Dokumen ini sempat hilang ketika workspace ter-reset (2 Nov 2026) dan ditulis ulang dari nol. Kalau ada pertentangan dengan dokumen lain di repo ini, **dokumen inilah yang menang**, kecuali pada hal teknis yang sudah dipatok di `editorial-engine/design/tokens.ts` dan `editorial-engine/docs/PIPELINE.md`.

---

## 1. Prinsip yang tidak boleh dilanggar

1. **Suara independen, kritis terhadap kekuasaan, berpihak pada kepentingan publik.** Tidak ada konten yang memihak penguasa atau pemodal.
2. **Angka dulu, kata sifat kemudian.** Klaim editorial dibuktikan dengan angka, dokumen, atau kutipan yang bisa dilacak.
3. **Kekosongan data ditampilkan sebagai kekosongan.** Kolom yang tidak ada datanya ditulis "TIDAK ADA DATA", bukan diperkirakan.
4. **Tidak ada tuduhan tanpa sumber.** Kalau sumber hanya menyebut satu hal, video hanya boleh menyebut satu hal itu.
5. **Visual adalah ilustrasi, bukan dokumentasi.** Setiap frame yang menampilkan orang/kejadian wajib berlabel ilustrasi; tidak ada logo institusi atau wajah nyata yang dipalsukan.
6. **Nada tenang, bukan menghasut.** Kemarahan dibangun dari fakta, bukan dari kata seru.
7. **Tidak ada PR, tidak ada push, tidak ada deploy tanpa izin eksplisit.** Hasil kerja dikirim sebagai berkas (Drive), bukan sebagai pull request.

---

## 2. Format

| Parameter | Nilai | Alasan |
|---|---|---|
| Rasio | 1080×1920 (9:16) | Reels/TikTok/Shorts |
| Durasi | 85–95 detik | Di atas 95 detik retensi turun sebelum closing |
| FPS | 30 | Gerak lambat, hemat render |
| Scene | 7 (HOOK → CLOSING) | Satu scene = satu fungsi naratif |
| Perubahan visual | setiap 3–5 detik | Menahan mata tanpa membisingkan |
| Suara | narasi Indonesia + musik + SFX | Satu klip per segmen |
| Subtitle | terbakar di gambar + `.srt`/`.vtt` | Mayoritas ditonton tanpa suara |
| Loudness | −14 LUFS terintegrasi | Standar platform |

**Struktur 7 scene (skema tetap):**

| # | Scene | Fungsi | Isi wajib |
|---|---|---|---|
| 1 | HOOK | Menahan 3 detik pertama | Angka + manusia/ruang konkret |
| 2 | CONTEXT | Membuktikan | Lembaga, periode, angka resmi |
| 3 | CONFLICT | Membalik | Dua kenyataan yang bertabrakan |
| 4 | DEVELOPMENT | Menjelaskan | Mekanisme + angka turunan (disebut turunan) |
| 5 | PERSPECTIVE | Mendekatkan | Kembali ke ruang pembuka, sudut baru |
| 6 | EVIDENCE | Menimbang | Apa yang dihitung negara, apa yang tidak |
| 7 | CLOSING | Mengutip | Satu kalimat yang bisa berdiri sendiri |

---

## 3. Alur produksi (12 tahap, urutan wajib)

```
1  RISET        minimal 2 sumber primer, catat periode & pemilik angka
2  SUMBER       research/sources/<slug>.sources.json  (klaim K1..Kn + status + knownLimits)
3  NASKAH       content/scripts/<slug>.script.json    (7 segmen, narasi + subtitle + voiceDirection)
4  STORYBOARD   content/storyboards/<slug>.storyboard.json (7 scene, durasi target, kamera, sfx)
5  ILUSTRASI    remotion/src/illustration/topic-<topik>.tsx (props + environment, tanpa merek)
6  SCENE        remotion/src/scenes/<prefix>01..07.tsx + registrasi di scenes/index.tsx
7  REVIEW STILL pipeline/render-still.ts → periksa komposisi sebelum bicara soal suara
8  VO           satu klip per segmen → audio/voiceovers/<slug>/vo01..07
9  TIMELINE     measure-voiceover → build-timeline (durasi scene dari suara nyata)
10 SUBTITLE     build-subtitles → content/captions-<slug>.json → .srt/.vtt
11 AUDIO        synth_score.py → mix-audio → audio/mix/<slug>.master.wav
12 RENDER       render-frames (chunked) → encode → qa.ts → stills → thumbnail → poster
13 PAKET        caption 4 platform → 3 berkas ke Drive (§7)
```

Tidak ada tahap yang boleh dilewati. Kalau sebuah tahap gagal, misi berhenti di situ; tidak ada "nanti diperbaiki di akhir".

---

## 4. Struktur berkas

```
editorial-engine/
  design/tokens.ts                  palet, tipografi, layout (satu-satunya sumber warna)
  remotion/src/
    illustration/                   primitives, figures, props, environments, topic-*.tsx
    scenes/                         <prefix>01..07 + index.tsx (registry)
    typography/                     Headline, Kicker, Caption
    animations/                     cam, fade, pushIn, pan, stagger, impact
    compositions/                   EditorialVideo, ThumbAI, EditorialPoster*
  content/{scripts,storyboards,timelines,captions-*.json}
  research/sources/<slug>.sources.json
  pipeline/                         build-*, measure-*, build-subtitles, mix-audio,
                                    render-*, encode, qa, render-poster, render-thumbnail
  audio/{voiceovers,processing,mix}
  qa/{QA-TECHNICAL*.md, visual/, report-*.json}
  deliverables/                     B_*.mp4, T_*.png, A_*.png, C_*.srt/.vtt, caption_*.txt
  docs/                             PIPELINE, VISUAL_STYLE_GUIDE, REPORT-<slug>, STRATEGI-KONTEN-VIRAL
```

**Penamaan keluaran (patok):**
- `B_<slug>_1080x1920.mp4` — video final
- `T_<slug>_1080x1920.png` — thumbnail paket unggah
- `A_<slug>_1080x1350.png` — poster 4:5 (arsip, bukan paket unggah)
- `C_<slug>.srt` / `.vtt` — subtitle
- `caption_<slug>.txt` — paket caption 4 platform

---

## 5. Status bukti

Setiap klaim di `sources.json` **wajib** punya satu status:

| Status | Arti | Boleh dipakai sebagai |
|---|---|---|
| **VERIFIED** | Diambil langsung dari dokumen/resmi, periode jelas | Angka utama di video |
| **DERIVED** | Hitungan sendiri dari angka VERIFIED (mis. pembagian) | Angka pendukung, **wajib** disebut "hitungan sendiri" |
| **LIKELY** | Beberapa sumber industri konsisten, bukan angka resmi | Patokan kerja (retensi, jam unggah) |
| **ASSUMPTION** | Penalaran internal, belum diuji | Hanya di dokumen strategi, tidak di video |
| **UNKNOWN** | Tidak ada data | Ditampilkan "TIDAK ADA DATA" |

**Aturan:** UNKNOWN tidak pernah dinaikkan ke VERIFIED tanpa dokumen baru. Setiap `sources.json` mencantumkan `knownLimits` — daftar hal yang **tidak** boleh disimpulkan dari angka itu.

---

## 6. Tujuh gerbang kualitas (quality gates)

| Gate | Nama | Lulus bila | Alat/bukti |
|---|---|---|---|
| Q1 | Riset | ≥2 sumber primer, periode disebut, `knownLimits` terisi | `sources.json` |
| Q2 | Naskah | 7 segmen, satu klaim per kalimat, tanpa kata sifat kosong | `script.json` + review |
| Q3 | Visual | Tidak ada merek/logo/wajah nyata; label ilustrasi; tipografi ≤2 keluarga | `render-still.ts` + mata |
| Q4 | Audio | VO per segmen, musik bernada, −14 LUFS, tanpa hiss | `mix-report.json` |
| Q5 | Render | Semua frame ada, durasi = timeline, tidak ada frame hitam | `render-report-<slug>.json` |
| Q6 | QA teknis | `qa.ts` dijalankan; PASS/FAIL dicatat apa adanya | `qa/QA-TECHNICAL-<slug>.md` |
| Q7 | Paket unggah | §7 terpenuhi: 3 berkas + caption 4 platform | Drive + `caption_<slug>.txt` |

**Aturan pelaporan QA:** hanya boleh memakai **PASS / FAIL / NEEDS REVIEW / NOT TESTED**. Tidak ada "hampir lulus", tidak ada "tampaknya baik". Kalau pemeriksaan tidak dijalankan, statusnya NOT TESTED — bukan PASS.

---

## 7. Paket unggah per konten

### 7.1 Isi paket
Setiap konten menghasilkan **tepat tiga berkas** untuk diunggah/diarsipkan:

1. **`.mp4`** — video final 1080×1920, audio termiks di dalamnya.
2. **`.png`** — thumbnail 1080×1920 (sampul feed), digenerate sebagai karya sinematik, **bukan** potongan frame video.
3. **`.txt`** — caption siap tempel untuk **FB Reels, IG Reels, TikTok, YouTube Shorts**, berisi: judul, caption per platform, 3–5 hashtag, komentar pertama berisi sumber, jawaban siap pakai untuk komentar, dan bagian "batas kejujuran".

### 7.1b Aturan mengunggah ke Drive
- Unggah **ketiga berkas di atas** (mp4 + png + txt) ke folder konten yang sama, sekali jalan per konten.
- Nama berkas di Drive = nama berkas di `deliverables/`. Jangan diganti.
- Poster `A_*.png` dan `.srt/.vtt` **tidak** termasuk paket unggah; simpan lokal sebagai arsip.
- Setelah unggah: daftar ulang isi folder dan laporkan jumlah berkas ke pengguna.
- Kalau satu konten diunggah ulang, hapus versi lama dulu supaya tidak ada dua versi beredar.

### 7.2 Aturan thumbnail (delapan butir, mengikat)
1. **Digenerate dengan model gambar**, bertema sinematik — bukan screenshot, bukan vektor datar.
2. **Satu ide sindiran** per sampul; kalau perlu dua, buat dua berkas.
3. **Tagline satir**, maksimum 6 kata, huruf besar-kecil normal, tanpa emoji.
4. **Terbaca di 120 px**: satu subjek besar, kontras tinggi, ruang kosong di sekitar teks.
5. **Wajah/objek konkret**; hindari komposisi abstrak atau gradien kosong.
6. **Tanpa logo institusi, tanpa wajah pejabat/nyata, tanpa merek.** Ilustrasi orang biasa boleh.
7. **Teks pendek** — model gambar sering salah mengeja; periksa ejaan, perbaiki dengan img2img atau tulis ulang tagline.
8. **Boleh clickbait secara bentuk, tidak boleh bohong secara isi.** Semua angka di sampul harus ada di video.

### 7.3 Caption per platform
- Empat varian **berbeda**, bukan satu caption yang ditempel empat kali.
- Baris pertama caption IG harus bisa berdiri sendiri (terpotong di feed).
- Setiap angka di caption juga muncul di video.
- Angka turunan selalu disertai "hitungan sendiri".
- Tidak ada tautan judi/pinjol, tidak ada nama situs, tidak ada ajakan bertaruh.
- Hashtag 3–5: 1 topik besar + 2 niche + 1 seri.

Detail pola, jam unggah, dan protokol uji ada di `editorial-engine/docs/STRATEGI-KONTEN-VIRAL.md`.

---

## 8. Bahasa

- **Narasi:** kalimat pendek (maks ±18 kata), satu klaim per kalimat, kata kerja konkret.
- **Angka:** ditulis sebagai digit di subtitle dan di layar; di naskah VO ditulis terbaca ("delapan puluh enam koma delapan dua triliun").
- **Larangan kata:** "bahaya", "darurat", "miris", "viral", "gila", "auto kaget".
- **Larangan nada:** menghakimi penonton, menasihati, orasi, iklan.
- **Penutup:** satu kalimat yang bisa dikutip tanpa konteks; tanpa ajakan, tanpa seruan moral.

---

## 9. Tipografi dan visual

- **Maksimum dua keluarga huruf:** Instrument Serif (display/editorial) + Archivo (informasi). Sudah dipatok di `design/tokens.ts`.
- Tidak ada paragraf di layar. Maksimum dua baris per judul.
- Ukuran judul ≥58 px pada kanvas 1080; label ≥16 px.
- Teks tidak pernah menutupi wajah atau angka utama.
- Palet: tanah murung + aksen semantik (brick = kerugian/urgensi, mustard = angka, teal = institusi, clay = manusia).
- Latar harus **konkret** (warung, meja, dinding, koridor) bila cerita butuh tempat; latar abstrak hanya untuk beat data.
- Karakter dan ruang yang sama dipakai ulang antar-scene untuk mempertahankan identitas.

---

## 10. Gerak

- Setiap gerak menyatakan perubahan: siapa bergerak, kenapa, apa yang harus diperhatikan.
- Idle life kecil (2–6 px, 1–3 derajat); beat akting boleh besar tapi tidak melebihi ruang aman.
- Satu perubahan visual besar setiap 3–5 detik.
- Angka masuk **utuh**, tidak pernah ditulis digit demi digit.
- Tidak ada gerak dekoratif tanpa alasan cerita.

---

## 11. Audio

- **Musik bernada, bukan bunyi samar.** Tidak ada lapisan noise/hiss/hujan sebagai pengisi.
- Setiap SFX punya tinggi nada tertentu (whoosh, impact, stamp, tick, paper).
- VO satu berkas per segmen supaya satu baris bisa diganti tanpa mengulang film.
- Jarak VO–musik 10–13 dB; master −14 LUFS.
- Pemeriksaan wajib: tidak ada klip yang pecah (clipping), tidak ada jeda mati > 0,6 detik tanpa alasan.

---

## 12. Subtitle

- Mengikuti ucapan, dipenggal **per makna**, bukan per jumlah karakter.
- Maksimum 2 baris, ±42 karakter per baris.
- Angka sebagai digit; satuan ditulis penuh ("persen", "triliun").
- Karakter yang tidak ada di font **dilarang** (mis. "→"); sudah pernah menghasilkan kotak kosong di layar — pakai kata.
- Subtitle terbakar + `.srt` + `.vtt` dari satu sumber yang sama.

---

## 13. Larangan keras

- Menyebut merek, situs, aplikasi judi/pinjol, atau tautan apa pun.
- Menampilkan kode QR yang dapat dipindai (gunakan mosaik generik).
- Menyalahkan pihak yang tidak disebut sumbernya (contoh: QRIS atau warung).
- Memakai angka dari periode berbeda tanpa menyebut periodenya.
- Menampilkan "TIDAK ADA DATA" sebagai nol atau perkiraan.
- Menyerahkan hasil tanpa menjalankan QA.
- Push/PR/merge ke GitHub tanpa izin eksplisit.

---

## 14. Definisi selesai (definition of done)

Sebuah misi dinyatakan selesai hanya bila **semua** benar:

- [ ] `sources.json` lengkap, status & `knownLimits` terisi
- [ ] `script.json` + `storyboard.json` konsisten 7 segmen
- [ ] 7 scene terdaftar di registry dan lolos review still (komposisi, tipografi, label ilustrasi)
- [ ] VO 7 segmen, `manifest.json` terukur
- [ ] timeline dibangun dari durasi VO nyata
- [ ] subtitle memenuhi §12, tanpa karakter hilang
- [ ] musik bernada + master −14 LUFS (`mix-report.json`)
- [ ] render tanpa frame hilang, `encode.ts` selesai, durasi = timeline
- [ ] `qa.ts` dijalankan; hasil dilaporkan apa adanya di `qa/QA-TECHNICAL-<slug>.md`
- [ ] still review + sampul 4-up diperiksa
- [ ] `caption_<slug>.txt` empat platform + hashtag + komentar pertama
- [ ] tiga berkas (§7.1) terunggah ke Drive dan jumlah berkas folder dilaporkan
- [ ] laporan misi di `docs/REPORT-<slug>.md` menyebut angka, gate, dan batas

---

## 15. Yang belum teruji (jujur)

| Komponen | Status | Sebab |
|---|---|---|
| ComfyUI (generasi gambar lokal) | NOT TESTED | tanpa GPU; sampul memakai model gambar layanan |
| CosyVoice (TTS lokal) | NOT TESTED | butuh torch + model GB + GPU |
| WhisperX (alignment) | NOT TESTED | butuh torch; subtitle dibangun dari timeline |
| Librosa (analisis musik) | NOT TESTED | skor musik dihasilkan lewat sintesis numpy |
| Remotion CLI (render penuh) | NOT TESTED | Chromium tidak bisa jalan di sandbox; render memakai SSR + resvg |
| Penilaian artistik oleh manusia | NEEDS REVIEW | selalu disebut di laporan misi |

Kalau salah satu komponen di atas dipasang nanti, ganti satu per satu dan catat prosedur, konfigurasi, I/O, penanganan galat, kasus uji, dan batasannya.
