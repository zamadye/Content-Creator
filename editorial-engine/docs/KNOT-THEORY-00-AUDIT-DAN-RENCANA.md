# KNOT THEORY — Audit Sistem & Rencana Eksekusi
Tanggal audit: 4 November 2026 · branch `arena/54cb36c6-content-creator` · commit acuan `79cf769`

Dokumen ini menjawab langkah 1–5 dan 7–8 dari brief (audit repo/Actions/Buffer/kanal, audit pipeline,
riset tools, dan 10 konsep episode). Eksekusi produksi mengikuti urutan di §7.

---

## 1. Status yang bisa dibuktikan hari ini

| Hal | Status | Bukti |
|---|---|---|
| Pipeline produksi (riset → naskah → TTS → timeline → render → encode → QA) | **TESTED** | `pipeline/build-all.sh`; 9 misi selesai; QA teknis 20/20 |
| Publikasi otomatis ke Buffer | **VERIFIED** (4 Nov 2026) | run `41776475713`: 3 post (IG/TikTok/YouTube) terkirim, id tercatat, anotasi job hijau |
| Buffer API dari sandbox | **NOT AVAILABLE** | `curl https://api.buffer.com` → `000`; `inspect-buffer.mjs` butuh CLI `buffer` yang tidak ada |
| Daftar secret repo | **UNKNOWN → NOT ACCESSIBLE** | `gh secret list` → HTTP 403 (`Resource not accessible by integration`) |
| Nama kanal di Buffer | **VERIFIED sebagian** | org `6ae9e5493e91026c72c93e3b`; TikTok `knottheory.labs`; IG `6ae9e7d9…`; YouTube `6ae9e5d7…` ("Knot Theory"); Facebook **belum tersambung** |
| Akun 1 vs Akun 2 (isolasi) | **BELUM TERBUKTI** | skrip mengambil `organizations[0]` dan kanal **pertama** per layanan → lihat §2 |

Catatan: `gh run list` memperlihatkan aktivitas terbaru dari branch sesi lain
(`arena/479de245-content-creator`) yang menyebut pembaca status "Zernio". Itu **tidak** kami pakai
dan tidak diubah; kalau platform publikasi sudah berpindah, beri tahu sebelum eksekusi.

---

## 2. Isolasi akun — temuan dan perbaikan wajib

Masalah nyata di `pipeline/publish-buffer.mjs`:

1. `organizationId` diambil otomatis dari `orgs[0]` (`buffer account`). Kalau akun Buffer berisi
   dua organisasi, urutan `organizations[]` menentukan tujuan — **tidak deterministik**.
2. Kanal dipilih dengan `channels.find(c => c.service.includes(platform))` → kanal **pertama**
   yang cocok. Kalau YouTube akun 1 dan akun 2 sama-sama ada, hasilnya bergantung urutan.

Perbaikan yang akan diterapkan sebelum publikasi pertama KNOT THEORY (tidak menyentuh akun 1):

- `BUFFER_ORGANIZATION_ID` **wajib** (bukan fallback): skrip berhenti kalau kosong.
- Peta kanal eksplisit per platform: `CHANNEL_IG`, `CHANNEL_TIKTOK`, `CHANNEL_YOUTUBE` berisi id
  kanal KNOT THEORY; jika sebuah id tidak ditemukan di organisasi itu, job **gagal** dan tidak
  memublikasikan apa pun.
- Pagar tambahan: `CHANNEL_ALLOWLIST` — setiap id kanal harus ada di daftar; skrip menolak
  organisasi/kanal di luar daftar.
- Anotasi job mencetak `organisasi + nama kanal + destination` (bukan token) supaya verifikasi
  visual bisa dilakukan dari UI tanpa membuka rahasia.

Karena token GitHub di sandbox tidak boleh/sulit menulis secret (403), nilai-nilai itu harus
dimasukkan lewat pengaturan repo, atau saya minta satu kali konfirmasi nama kanal tujuan.

---

## 3. Batasan Buffer untuk YouTube Shorts (berdasarkan uji, bukan asumsi)

| Fitur | Status | Catatan |
|---|---|---|
| Unggah video ke YouTube via Buffer | **TESTED** | 4 post terkirim; media `raw.githubusercontent.com/<sha>/…mp4` (8,7 MB) diterima |
| Judul YouTube | **TESTED** | `metadata.youtube.title` wajib; dipakai sebagai hook |
| Kategori | **TESTED** | `categoryId: 27` (Education) |
| Deskripsi panjang | **LIKELY** | dikirim lewat `metadata.youtube.description`; batas panjang belum diuji batasnya |
| Jadwal (`customScheduled` + `dueAt`) | **TESTED** | jeda antar-post ditentukan berkas permintaan |
| Thumbnail kustom YouTube | **NOT SUPPORTED** | `thumbnailUrl` ditolak API Buffer; `metadata.thumbnailOffset` hanya untuk IG/TikTok/Pinterest |
| Komentar pertama | **TIDAK TERSEDIA (paket gratis)** | `First comment requires a paid plan` — mematikan seluruh post |
| Status publik "langsung tayang" | **LIKELY** | Buffer mengantre → publikasi; balapan waktu tidak bisa dipastikan detiknya |
| Analytics YouTube | **NOT AVAILABLE via Buffer** | perlu YouTube Analytics API (OAuth akun 2) — belum ada kredensialnya |

Konsekuensi jujur: **tidak** bisa menjanjikan "publish instan tanpa antrean". Antrean Buffer
adalah mekanisme yang tersedia; pengaturan tercepat = `dueAt` beberapa menit ke depan, bukan nol.

---

## 4. Audit pipeline produksi saat ini

Kekuatan (dipakai ulang, jangan dirombak):

- Naskah per segmen dengan `claims[]` yang menunjuk id sumber → jejak fakta bisa diaudit.
- TTS Indonesian + trimming + satu berkas narasi utuh (`voice-05`), timeline diturunkan dari VO terukur.
- 7 QA gate teknis + QA editorial manual; caption wajib memuat blok batas kejujuran.
- Sutradara visual: kolase kertas (2 jenis huruf), bukan stok/AI-realistis.

Kelemahan yang menghambat target 10 video/hari:

| Masalah | Dampak | Rencana |
|---|---|---|
| Render 2361 frame ≈ 11 menit/misi | 10 video ≈ 2 jam render | tetap (kualitas dulu); batch paralel 2 proses setelah Episode 3 |
| Scene ditulis tangan per misi | 30–40 menit/misi | 6 template scene (hook, dua angka, bar, persamaan, ledger, closing) dijadikan komponen berparameter |
| Edukasi visual belum variatif antar pilar | risiko "10 judul, 1 video" | 3 bahasa visual: kolase kertas (politik), arsip+tipografi (struktural), kartu hubungan (relationship) |
| Belum ada knowledge base | hook bisa berulang | §6 |

---

## 5. Evaluasi tools (open-source, CPU-only) — keputusan

| Tool | Keputusan | Alasan |
|---|---|---|
| FFmpeg | **dipakai** (sudah) | encode, trim, loudness, concat |
| Remotion (SSR + resvg) | **dipakai** (sudah) | satu-satunya pemilik timeline |
| Sharp | **dipakai** | resize/kompres frame, thumbnail |
| Python + numpy (venv) | **dipakai** | skor musik prosedural |
| MoviePy | **ditolak** | duplikasi FFmpeg, lebih lambat, dependensi berat |
| GStreamer | **ditolak** | tidak ada kebutuhan streaming |
| OpenCV | **cadangan** | hanya kalau perlu deteksi wajah/auto-crop; belum perlu |
| ImageMagick | **ditolak** | Sharp cukup |
| Anime.js | **ditolak** | timeline kedua = konflik; animasi tetap di Remotion |
| Chart libs (D3/vega) | **ditolak untuk render** | grafik digambar sebagai komponen Remotion agar konsisten dengan gaya kertas |

Prinsip: satu mesin timeline, satu bahasa visual per pilar.

---

## 6. Content knowledge base (siap diisi)

Berkas: `content/kb/knot-theory.jsonl` — satu baris per episode dengan field:
`episodeId, tanggal, pillar, topik, hook, angle, sumber[], klaim[], durasi, tools, renderSec,
qaStatus, bufferPostId, youtubeVideoId, url, analytics{...}, lessons, nextImprovement`.
Tidak digabung dengan THE LAST SIGNAL (berkas terpisah).

---

## 7. Rencana eksekusi (urutan yang saya pakai)

1. **Hardening isolasi akun** (§2) + uji kering (tanpa kirim) → anotasi job menampilkan
   organisasi + kanal tujuan.
2. **Buat 6 komponen scene berparameter** (§4) → target 15 menit/misi.
3. **Produksi Episode 1** (di bawah) → factual QC + technical QC → publikasi Buffer (YouTube
   kanal 2 + IG/TikTok bila id kanal tersedia) → catat `bufferPostId`.
4. Ulangi dengan jeda ≥1 jam; isi knowledge base setiap selesai.
5. Analytics: menunggu kredensial YouTube Analytics akun 2 (belum ada) — sampai itu ada,
   angka analytics dilaporkan **UNKNOWN**, bukan dikarang.

**Target realistis hari ini:** 1–2 episode selesai penuh (bukan 10). Sepuluh konsep di §8
disiapkan sebagai antrean, bukan janji produksi.

---

## 8. 10 konsep episode (antrean, berbeda pilar/angle/hook)

| # | Pilar | Topik & angle | Hook | Judul |
|---|---|---|---|---|
| 1 | Politik/kebijakan | APBN 2027: defisit Rp671 T hampir seluruhnya bunga (mis. 8 — **SUDAH DIPRODUKSI**, QA 20/20) | "Defisit bisa diperdebatkan. Bunga tidak." | Defisit Rp671 triliun, tapi hampir semuanya bunga utang |
| 2 | Struktural | BSU: program menyasar yang sudah punya pipa pencatatan (mis. 8 sebelumnya, sudah tayang) | "Ambil kalkulator." | Rp12 triliun untuk 13,3 juta orang — itu 9 dari 100 |
| 3 | Struktural | Upah minimum naik, tapi komposisi kerja informal 59%: kenaikan UMK hanya menyentuh 4 dari 10 pekerja | "Naik berapa persen, untuk siapa?" | UMK naik. Tapi 6 dari 10 pekerja tidak dijangkau UMK |
| 4 | Politik | Bantuan pangan: anggaran naik, penerima turun — angka mana yang dipakai untuk klaim keberhasilan | "Penerima berkurang. Katanya berhasil." | Kalau penerima turun, itu keberhasilan atau penghematan? |
| 5 | Politik | Aturan baru yang menambah lembaga, bukan menyelesaikan masalah — ongkos koordinasi | "Solusi dari masalah ini adalah rapat baru." | Setiap masalah baru, satu badan baru |
| 6 | Relationship | Standar ganda "sabar": siapa yang diminta mengalah dan kapan itu disebut dewasa | "Kamu bukan sabar. Kamu cuma tidak punya pilihan." | Sabar yang cuma diminta ke satu pihak |
| 7 | Relationship | Silent treatment sebagai kontrol, bukan introversi | "Diam bukan selalu damai." | Diam yang dipakai sebagai hukuman |
| 8 | Struktural | Pendidikan: angka partisipasi naik, kualitas guru tidak bergerak — mana yang dihitung | "Semua anak masuk sekolah. Lalu apa?" | Kalau semua sudah sekolah, apa yang belum berubah? |
| 9 | Trending | Isu viral yang punya implikasi struktural (dipilih saat produksi, wajib 2 sumber independen) | menyesuaikan | menyesuaikan |
| 10 | Satire/struktural | Birokrasi: satu izin, berapa meja | "Izinnya satu. Pintunya sebelas." | Satu izin, sebelas meja |

Aturan anti-pengulangan: hook dan payoff tiap episode harus beda bentuk (pertanyaan retoris,
angka, analogi, kontras kalimat pendek). Sebelum menulis, cek knowledge base.

---

## 9. Gate yang tidak boleh dilanggar

- Setiap klaim faktual menunjuk id sumber; angka turunan **wajib** berlabel "hitungan sendiri".
- Tidak ada tuduhan kriminal terhadap individu tanpa dokumen.
- Vonis QA ditulis apa adanya: PASS / FAIL / NEEDS REVIEW / NOT TESTED.
- Persentase akun 1 yang tersentuh: **nol**.
