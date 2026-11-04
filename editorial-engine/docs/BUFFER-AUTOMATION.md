# Unggah otomatis ke Buffer — cara kerja, dan ke mana videonya harus ditaruh

Diperbarui 3 November 2026. Semua aturan di bawah diambil dari dokumentasi yang **dibundel CLI Buffer**
(`buffer context pitfalls`, `buffer schema list`, `buffer schema describe posts create`), bukan dari tebakan.

---

## 1. Jawaban singkat: simpan di git tidak cukup

CLI Buffer punya **44 perintah**, dan **tidak satu pun** untuk mengunggah berkas:

```
buffer schema list  →  44 commands, tidak ada "media", "upload", "asset", atau "file"
```

Satu-satunya cara media masuk ke Buffer adalah **URL publik**:

```json
{ "assets": [ { "video": { "url": "https://…/video.mp4" } } ] }
```

Deskripsi field-nya di schema: *"URL to the file source"*. Buffer yang mengunduh sendiri berkasnya.

Artinya: menaruh mp4 di dalam repo memang benar untuk arsip dan versi, tetapi **git bukan server**.
Berkas itu harus bisa diakses lewat HTTPS oleh server Buffer. Tiga cara, semuanya sudah didukung skrip ini.

| `MEDIA_PROVIDER` | URL yang dipakai | Perlu apa | Catatan |
|---|---|---|---|
| **`release`** (default) | `https://github.com/<owner>/<repo>/releases/download/media-<misi>/<file>.mp4` | `gh` login + hak tulis repo | **Disarankan.** Aset tidak masuk riwayat git, URL stabil, clone tetap ringan |
| `raw` | `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/editorial-engine/deliverables/<file>.mp4` | berkas sudah di-push, repo publik | Paling gampang, tapi GitHub mengirim `application/octet-stream` — sebagian platform menolak |
| `pages` | `https://<owner>.github.io/<repo>/editorial-engine/deliverables/<file>.mp4` | Pages diaktifkan di Settings | MIME benar (`video/mp4`), cocok untuk jangka panjang |
| `custom` | apa pun | Anda hosting sendiri (S3/R2/CDN) | Pakai `MEDIA_URL=…` untuk menimpa semua |

### Path harus tepat — dan skrip memeriksanya, bukan mengira-ngira

Sebelum mengirim apa pun dengan `--send`, skrip melakukan `HEAD` ke URL tersebut dan menolak lanjut kalau:

- status bukan 200,
- `content-length` berbeda lebih dari 1% dari ukuran berkas lokal (tanda unggahan belum selesai / URL menunjuk berkas lain),
- `content-type` bukan `video/*` (untuk `raw`, ini muncul sebagai peringatan karena GitHub mengirim `octet-stream`).

Jadi kalau path-nya salah, Anda tahu **sebelum** Buffer mencoba dan gagal dengan pesan yang tidak jelas.

## 2. Yang tidak bisa dilakukan API: thumbnail

Field `assets[].video.thumbnailUrl` **ada** di schema tetapi deskripsinya melarang dipakai:

> *"Do not use: social networks do not accept custom video thumbnail images, and the API rejects
> video assets that set this field. To choose the video thumbnail, set `metadata.thumbnailOffset`
> to select a frame from the video (supported for Instagram, TikTok, and Pinterest only)."*

Artinya:

- **PNG sampul tidak bisa diunggah lewat Buffer.** Titik. Bukan keterbatasan skrip ini.
- Yang bisa: memilih **satu bingkai dari video** lewat `THUMBNAIL_OFFSET_MS` (default 9000 ms — saat lingkaran "per hari" sudah selesai digambar). Hanya Instagram, TikTok, Pinterest.
- Sampul versi desain (T_…png) tetap diunggah manual di aplikasi masing-masing kalau ingin dipakai.

Skrip tetap mencetak lokasi berkas sampul supaya tidak terlupa.

## 3. Empat layanan, empat syarat berbeda

Dari `buffer context pitfalls` → *Per-service minimum payloads*:

| Platform | Selain teks | Yang dikirim skrip |
|---|---|---|
| Facebook | text atau assets | `metadata.facebook.type = "reel"` + `firstComment` |
| Instagram | aset video + `metadata.instagram.type` + `shouldShareToFeed` | `type: "reel"`, `shouldShareToFeed: true` + `firstComment` |
| TikTok | aset video | aset video (+ `thumbnailOffset`) |
| YouTube | aset video + `metadata.youtube.title` (+ `categoryId`) | `title` dari baris `Judul:` di caption, `categoryId` default `27` (Education), `privacy: public` |

Komentar pertama diambil dari blok **KOMENTAR PERTAMA** di `deliverables/caption_<misi>.txt`
(berisi sumber angka) dan ditempel otomatis di Instagram dan Facebook.

## 4. Satu klik

```bash
cd editorial-engine
cp .env.example .env      # isi BUFFER_API_KEY sekali saja; .env tidak di-commit
./publish.sh pinjol-bunga-harian-2026              # validasi saja, aman
./publish.sh pinjol-bunga-harian-2026 --send       # benar-benar mengirim
```

Yang dilakukan `./publish.sh <misi> --send`:

1. membaca `deliverables/B_<misi>_1080x1920.mp4`, `T_<misi>_1080x1920.png`, `caption_<misi>.txt`;
2. memastikan aset video ada di GitHub Release `media-<misi>` (membuat + mengunggah kalau belum);
3. memverifikasi URL publiknya (`HEAD`: status, ukuran, content-type);
4. mencari kanal yang cocok di organisasi Buffer Anda;
5. menyusun payload per platform sesuai syarat di tabel atas, memvalidasinya dengan `--dry-run` lokal;
6. memeriksa apakah post serupa sudah ada (`posts create` **tidak idempoten**);
7. mengirim, lalu mencetak ringkasan per platform.

Mode bawaan **`addToQueue`** — masuk antrean Buffer, bukan langsung tayang. Untuk tayang seketika:
`MODE=shareNow ./publish.sh <misi> --send`. Untuk jam tertentu:
`MODE=customScheduled DUE_AT=2026-11-05T19:00:00+08:00 ./publish.sh <misi> --send`.

### Uji yang sudah dilakukan (offline, di sandbox ini)

| Platform | Panjang teks | Validasi payload terhadap schema Buffer |
|---|---|---|
| Facebook | 952 karakter | **VALID** |
| Instagram | 441 karakter | **VALID** |
| TikTok | 246 karakter | **VALID** |
| YouTube | 588 karakter | **VALID** |

`--dry-run` menjalankan validasi schema yang sama dengan panggilan sungguhan, tanpa API call.
Yang **belum** teruji dari sini: panggilan API-nya sendiri — `api.buffer.com` diblokir di sandbox
(`fetch failed`, kode 000). Semua langkah jaringan harus dijalankan di mesin Anda.

## 5. Sebelum pertama kali jalan (di komputer Anda)

```bash
npm i -g @bufferapp/cli          # CLI resmi Buffer (2.2.0)
gh auth login                    # untuk mengunggah aset rilis (provider release)
buffer init                      # sekali: simpan kunci + organizationId + timezone
```

`buffer init` menyimpan `organizationId` dan `timezone` ke config. Kalau ingin memaksa:
`BUFFER_ORGANIZATION_ID=…` di `.env`.

## 6. Keamanan kunci

- Kunci hanya ada di `.env` (sudah masuk `.gitignore`) atau di environment.
- Tidak pernah ditulis ke berkas yang di-commit, tidak pernah dicetak ke log.
- Skrip tidak menyimpan respons API ke disk.
- Kalau kunci sudah pernah tampil di chat: setelah selesai dipakai, cabut di
  **Buffer → Settings → API** dan ganti nilainya di `.env`. Skrip tidak perlu diubah.

---

## 7. Tanpa terminal sama sekali: GitHub Actions

Runner GitHub punya internet penuh — termasuk `api.buffer.com` yang diblokir dari sandbox Arena.
Jadi seluruh pengiriman bisa dijalankan di sana, dan Anda hanya menekan tombol di browser.

Workflow: `.github/workflows/publish-buffer.yml` (pemicu `workflow_dispatch` saja).

### Sekali saja: isi dua secret

**Settings → Secrets and variables → Actions → New repository secret**

| Nama | Isi |
|---|---|
| `BUFFER_API_KEY` | kunci API Buffer |
| `BUFFER_ORGANIZATION_ID` | id organisasi Buffer Anda (terlihat di `buffer context` atau URL dashboard) |

Kunci disimpan terenkripsi oleh GitHub, hanya bisa dibaca job yang berjalan di repo ini,
dan tidak pernah muncul di log (workflow memanggil `::add-mask::` lebih dulu).
Tombol **Run workflow** hanya terlihat oleh yang punya akses tulis, meskipun repo publik.

### Setiap kali terbit konten

**Actions → "Publish ke Buffer" → Run workflow**

| Input | Arti |
|---|---|
| `mission` | slug misi, mis. `pinjol-bunga-harian-2026` |
| `aksi` | `validasi` (hanya cek payload, tidak menyentuh API) atau `kirim` |
| `platforms` | `instagram,facebook,tiktok,youtube` — boleh dipersingkat |
| `mode` | `addToQueue` (antre), `shareNow`, `shareNext` |

Alur job: pasang Node 20 → pasang CLI Buffer → pastikan 3 berkas misi ada → susun URL media
→ **curl HEAD ke URL itu** (di sinilah pertanyaan "content-type apa dari raw.githubusercontent?"
dijawab dengan bukti nyata di log, bukan dugaan) → jalankan `publish-buffer.mjs`
→ ringkasan di halaman run.

### URL media yang dipakai

```
https://raw.githubusercontent.com/<owner>/<repo>/<SHA-commit>/editorial-engine/deliverables/B_<misi>_1080x1920.mp4
```

Di-pin ke **SHA commit**, bukan nama branch: URL tidak berubah selamanya dan tidak ambigu
walau nama branch mengandung garis miring. Repo ini publik, jadi URL-nya bisa diunduh Buffer
tanpa autentikasi. Kalau kelak repo dijadikan privat, jalur ini mati dan media harus pindah
ke hosting sendiri (`MEDIA_PROVIDER=custom` + `MEDIA_URL`).

### Batasan yang perlu diketahui

- `gh` tidak bisa membuat secret dari sini (token di sandbox hanya `metadata=read`) — dua secret di atas harus Anda isi sendiri lewat browser, sekali.
- Workflow belum pernah dijalankan. Yang sudah diverifikasi: YAML valid, nama input cocok dengan argumen skrip, dan `--platforms` benar-benar memfilter (`instagram,tiktok` → hanya dua payload divalidasi).
- Thumbnail tetap tidak bisa diunggah lewat API (lihat bagian 2), di runner mana pun.

---

## 8. Diagnostik: akun dan kanal mana yang tersambung?

Pertanyaan "akun YouTube mana yang nyambung ke Buffer?" hanya bisa dijawab dengan memanggil API.
Dua cara, keduanya memakai skrip yang sama — `pipeline/inspect-buffer.mjs`:

```bash
./publish.sh --akun            # di komputer Anda, sekali jalan
```

Keluarannya: email akun (disamarkan), zona waktu, daftar organisasi beserta jumlah kanal,
lalu tiap kanal dengan layanan + nama + id, ditandai `▶` untuk YouTube.
Diakhiri kesimpulan: kanal YouTube mana yang benar-benar tersambung, atau peringatan kalau tidak ada.

**Dari GitHub tanpa terminal:** workflow `.github/workflows/buffer-diagnostic.yml`.
Dipicu `push` (bukan cuma tombol) karena tombol `workflow_dispatch` baru muncul setelah berkasnya
ada di `main`. Hasilnya juga ditulis ke halaman ringkasan run.

Karena repo ini publik, log Actions bisa dibaca siapa saja — maka skrip menyamarkan email
dan tidak mencetak JSON mentah. Kunci API ditutup `::add-mask::` sebelum dipakai.

Kalau secret belum diisi, workflow **tidak gagal** — ia menulis catatan "dilewati" lalu berhenti.
Setelah secret ditambahkan, tekan **Re-run all jobs** pada run yang sama.

### Hasil pemeriksaan nyata (4 Nov 2026, run 41752165625)

Dipanggil dari runner GitHub, bukan dugaan:

| | |
|---|---|
| Akun | `earlyaakses` · zona waktu `Asia/Jakarta` |
| Organisasi | 1 (`My organization`) |
| Kanal | 3 |

| Layanan | Nama kanal |
|---|---|
| TikTok | `knottheory.labs` |
| Instagram | `knottheory.labs` |
| YouTube | **Knot Theory** |
| Facebook | **tidak tersambung** |

Konsekuensi: pengiriman `--platforms instagram,tiktok,youtube` akan jalan; `facebook` akan
berstatus SKIP sampai halaman Facebook disambungkan di Buffer → Channels → Connect Channel.

---

## 9. Publikasi nyata pertama (4 November 2026)

Dijalankan dari runner GitHub lewat `.github/publish-request.json`. Semua klaim di bawah
diambil dari keluaran run dan dari `buffer posts list`, bukan dari asumsi.

| Waktu (WIB) | Konten | Instagram | TikTok | YouTube |
|---|---|---|---|---|
| 11.00 | karhutla-angka-turun-2026 | ✓ | ✓ | ✓ |
| 13.00 | judol-taruhan-kecil-2026 | ✓ | ✓ | ✓ |
| 15.00 | pinjol-bunga-harian-2026 | ✓ | ✓ | ✓ |

`buffer posts list` → 9 post berstatus `scheduled` pada 04:00Z / 06:00Z / 08:00Z
(= 11.00 / 13.00 / 15.00 WIB), jarak tepat 2 jam.

### Tiga hal yang baru terbukti, dan satu jebakan

1. **`application/octet-stream` dari `raw.githubusercontent.com` diterima.** Ketiga platform
   berhasil mengunduh mp4-nya (ukuran terverifikasi sama: 9 477 555 / 10 333 444 / 8 283 303 B).
   Peringatan content-type di log bersifat informatif, bukan penghalang.
2. **`organizationId` bisa ditemukan sendiri** lewat `buffer account` — cukup satu secret
   (`BUFFER_API_KEY`). Percobaan pertama gagal justru karena menunggu secret kedua.
3. **`firstComment` adalah fitur berbayar.** Pada paket gratis, API menolak **seluruh** post
   dengan `Invalid post: First comment requires a paid plan` — bukan hanya komentarnya.
   Karena itu payload kini hanya menyertakan `firstComment` bila `BUFFER_FIRST_COMMENT=1`.
   Sumber angka tetap terkirim karena sudah ada di badan caption.

Jebakan: satu platform yang gagal tidak menggagalkan platform lain (TikTok & YouTube terkirim
saat Instagram ditolak). Karena `posts create` tidak idempoten, pengiriman ulang harus
dibatasi ke platform yang gagal saja — `"platforms": "instagram"` di berkas permintaan.

### Yang belum bisa dikirim

- **Facebook** — belum ada halaman tersambung di Buffer.
- **mbg-gizi-anak** — belum punya `caption_mbg-gizi-anak.txt` dan `T_mbg-gizi-anak_1080x1920.png`,
  jadi skrip menolak sebelum menyentuh API (memang seharusnya begitu).
