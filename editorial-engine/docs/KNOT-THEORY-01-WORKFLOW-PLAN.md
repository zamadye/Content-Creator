# KNOT THEORY — Workflow Plan (SOP Produksi & Publikasi)

Versi: 1.0 · 4 November 2026 · branch `arena/54cb36c6-content-creator`
Aturan pokok: **kualitas dulu, satu video satu slot.** Jeda antar-publikasi **minimal 60 menit,
default 120 menit**. Tidak ada unggahan beruntun. Target realistis: **2–3 video/hari**, bukan 10.

---

## 0. Prinsip yang mengikat seluruh alur

1. Satu mesin timeline: Remotion. Tidak ada timeline kedua (Anime.js/MoviePy ditolak).
2. Satu suara narasi (`voice-05`) sampai ada instruksi lain; narasi selalu **satu berkas utuh**.
3. Setiap klaim faktual menunjuk `S#` di `research/sources/<misi>.sources.json`. Angka turunan
   **wajib** berlabel "hitungan sendiri".
4. Tidak ada tuduhan kriminal terhadap individu tanpa dokumen.
5. Vonis QA ditulis apa adanya: `PASS` / `FAIL` / `NEEDS REVIEW` / `NOT TESTED`.
6. Akun 1 (THE LAST SIGNAL) tidak disentuh: tidak ada token, kanal, atau histori yang dipakai.

---

## 1. Bentuk kerja: satu misi = satu folder id

`MISSION=<slug>` (contoh `apbn-2027-bunga-utang`) dipakai sebagai satu-satunya kunci; semua
berkas turunan mengikuti nama itu:

```
research/sources/<misi>.sources.json      sumber + turunan + uncertainties + prohibited
content/scripts/<misi>.script.json        7 segmen: narration, claims, subtitles, voiceDirection
content/storyboards/<misi>.storyboard.json  durasi target, sfx, teks, aset
content/timelines/<misi>.json             hasil build-timeline (jangan diedit tangan)
audio/voiceovers/<misi>/vo01..vo07.mp3    narasi per segmen (voice-05)
audio/voiceovers/<misi>/narasi-lengkap.mp3  narasi utuh (acuan "suara misi ini")
audio/mix/<misi>.master.wav               master audio
rendering/frames-<misi>/                  frame PNG (tidak masuk git)
deliverables/B_<misi>_1080x1920.mp4       video
deliverables/T_<misi>_1080x1920.png       thumbnail
deliverables/caption_<misi>.txt           caption 4 platform + batas kejujuran
qa/QA-TECHNICAL-<misi>.md                 laporan gate teknis
content/kb/knot-theory.jsonl              baris knowledge base setelah selesai
```

---

## 2. Fase produksi (12 langkah, dengan gerbang di antaranya)

Estimasi satu siklus penuh: **±2,5–3 jam** per video (bukan karena lambat, tapi karena ada jeda
manusiawi untuk memeriksa).

| # | Fase | Perintah / aksi | Keluaran | Gerbang |
|---|---|---|---|---|
| 1 | RISET | 2–3 sumber independen, utamakan dokumen primer; catat tanggal kejadian vs tanggal terbit | `sources.json` | **G-FAKTA**: setiap angka punya `S#`; turunan berlabel |
| 2 | SUDUT | tulis `editorialThesis` 1 kalimat + `prohibited` (apa yang tidak boleh diklaim) | `script.json` (kerangka) | **G-EDITORIAL**: ada kontradiksi/argumen, bukan ringkasan berita |
| 3 | NASKAH | 7 segmen, pola HOOK→CONTEXT→CONTRADICTION→ANALYSIS(2)→EVIDENCE→CLOSING; angka dieja untuk suara ("enam ratus lima puluh triliun"), subtitle memakai digit | `script.json` lengkap | **G-NASKAH**: 170–200 kata; tiap segmen punya `claims[]` |
| 4 | NARASI | `generate_speech` voice-05 untuk vo01…vo07 (boleh paralel) | `raw/` | — |
| 5 | TRIM + GABUNG | rantai silenceremove (tanpa `atempo`), jeda 0,35 s, gabung jadi satu berkas | `vo01..vo07.mp3`, `narasi-lengkap.mp3` | **G-AUDIO-1**: total 70–85 s; mean ≈ −19 dB |
| 6 | UKUR | `MISSION=<misi> npx tsx pipeline/measure-voiceover.ts` | tabel durasi + wps | wps 2,0–3,0; `missing: none` |
| 7 | TIMELINE | `MISSION=<misi> npx tsx pipeline/build-timeline.ts` | `content/timelines/<misi>.json` | 2100–2600 frame (70–87 s), caption 14–22 |
| 8 | ADEGAN | tulis `remotion/src/scenes/<id>_*.tsx`, daftarkan di `scenes/index.tsx`; render 3 still | `rendering/previews/` | **G-VISUAL**: tidak ada teks < 100 px dari tepi, tidak ada tumpang tindih, isi ≤ y 1400 |
| 9 | SUBTITLE + MUSIK + MIX | `build-subtitles.ts` → `synth_score.py --duration <sec>` → `mix-audio.ts` | `.srt/.vtt`, master wav | **G-AUDIO-2**: −16…−12 LUFS, TP ≤ −1 dB |
| 10 | RENDER | `TOTAL=<n> FRAMES_DIR=rendering/frames-<misi> bash pipeline/render-frames-chunked.sh` | 2000+ PNG | — |
| 11 | ENCODE + QA | `encode.ts` → `render-thumbnail.ts` → `qa.ts` | mp4, T_/A_ PNG, laporan QA | **G-TEKNIS**: 20/20 PASS. Ada `NEEDS REVIEW` → perbaiki, jangan dilaporkan PASS |
| 12 | CATAT | tulis `caption_<misi>.txt` (4 platform + batas kejujuran + komentar pertama) dan baris KB | caption, KB | **G-CAPTION**: nama penerbit sumber pertama muncul; angka tidak diubah |

Bila sebuah gerbang gagal: perbaiki fase itu saja, jangan ulang seluruh pipeline.

---

## 3. Kebijakan publikasi (ini yang menjaga kanal tidak dianggap spam)

1. **Satu video satu slot, tiga platform sekaligus.** Setiap video langsung didistribusikan ke
   **Instagram Reels + TikTok + YouTube Shorts** dalam satu kali kirim (`"platforms":
   "instagram,tiktok,youtube"`). Jeda antar-*video* **≥ 60 menit**, jadwal yang dipakai **120 menit**
   (praktik 4 November 2026: 11.00 / 13.00 / 15.00 / 19.00 WIB). Jeda itu antar-video, bukan
   antar-platform: ketiga platform untuk satu video tayang di slot yang sama.
2. **Slot kerja:** 11.00, 13.00, 15.00 WIB (maksimum 3/hari). Kalau produksi selesai di luar slot,
   video **ditahan** ke slot berikutnya — tidak pernah "dipaksa tayang sekarang".
3. Mekanisme: ubah `.github/publish-request.json` → push → workflow `publish-scheduled` membaca
   berkas itu → tiap item dijadwalkan `customScheduled` + `dueAt`. Path lain tidak memicu publish.
4. **Jangan mengunggah semua video sekaligus**; `posts create` tidak idempoten, jadi kiriman ulang
   dibatasi ke platform yang gagal (`"platforms": "instagram"` dst.).
5. Verifikasi hasil **hanya** lewat anotasi job (`gh api …/check-runs/<job_id>/annotations`):
   id post per platform + total antrean. Respons "job diterima" bukan bukti tayang.
6. Simpan `bufferPostId`, waktu, dan URL ke KB. Analytics ditulis `UNKNOWN` sampai ada akses
   YouTube Analytics akun 2 — tidak dikarang.

### 3a. Isolasi akun (wajib sebelum kiriman pertama KNOT THEORY)

`publish-buffer.mjs` saat ini mengambil `organizations[0]` dan kanal **pertama** per layanan — itu
tidak deterministik kalau akun punya dua organisasi. Yang harus dipasang:

```
BUFFER_API_KEY          (secret, sudah ada)
BUFFER_ORGANIZATION_ID  (wajib, ID organisasi Akun 2 — tanpa ini skrip berhenti)
CHANNEL_YOUTUBE / CHANNEL_IG / CHANNEL_TIKTOK  (id kanal Akun 2)
CHANNEL_ALLOWLIST       (daftar id di atas; id di luar daftar = job gagal)
```

Uji kering (tanpa `posts create`): cetak organisasi + nama kanal + destination, cocokkan manual
dengan UI Buffer. Baru setelah cocok, kirim.

---

## 4. Ritme harian yang realistis

| Waktu | Kegiatan |
|---|---|
| 08.00–10.00 | riset + naskah + narasi + timeline (video untuk slot 11.00) |
| 10.30–11.00 | render, encode, QA, caption → jadwalkan 11.00 |
| 11.00–13.00 | produksi video berikutnya (render ±11 menit berjalan sendiri) |
| 13.00 | slot kedua tayang |
| 13.00–15.00 | produksi ketiga + evaluasi dua video sebelumnya |
| 15.00 | slot ketiga tayang |
| 16.00 | isi KB, catat pelajaran, rencanakan 2–3 topik besok |

Hasil hari ini: **2 video selesai** (BSU tayang, APBN siap tayang). Itu baseline yang jujur.

---

## 5. Gate QC — daftar periksa ringkas

**Faktual (G-FAKTA):** sumber ≥2 untuk isu aktual · dokumen primer bila ada · tanggal kejadian vs
terbit · turunan berlabel · tidak ada kutipan karangan · opini tidak disamarkan sebagai fakta.

**Editorial (G-EDITORIAL):** ada kontradiksi yang dibongkar · alasan di belakang opini · satire tidak
menghapus konteks · tidak ada generalisasi (khusus pilar relationship: perilaku, bukan gender) ·
closing memberi ruang diskusi, bukan vonis.

**Teknis (G-TEKNIS, otomatis `qa.ts`):** resolusi 1080×1920 · h264 yuv420p · 30 fps · 45–90 s ·
audio AAC · −16…−12 LUFS · TP ≤ −1 dB · subtitle ≤2 baris, ≤42 karakter, tanpa tumpang tindih ·
semua frame ada · thumbnail 1080×1920 > 200 kB · poster 1080×1350 · caption 4 platform · maks 2
jenis huruf · font lokal.

---

## 6. Definisi "selesai" untuk satu episode

mp4 + thumbnail + caption + laporan QA 20/20 + `bufferPostId` + baris KB. Tanpa keenamnya,
episode berstatus **belum selesai** dan tidak boleh masuk antrean publikasi.

---

## 7. Antrean berikutnya (dari §8 dokumen audit)

1. APBN 2027 — **selesai, menunggu slot** (98 detik → 78,7 s, QA 20/20)
2. UMK naik vs 59% pekerja informal
3. Bantuan pangan: penerima turun, diklaim berhasil
4. Relationship: "sabar" yang hanya diminta ke satu pihak
5. Relationship: silent treatment sebagai kontrol
6. Pendidikan: semua sudah sekolah, lalu apa
7. Birokrasi: satu izin, sebelas meja

Aturan anti-ulang: sebelum menulis hook, periksa `content/kb/knot-theory.jsonl`; hook dan payoff
harus berbeda bentuk dari episode sebelumnya.
