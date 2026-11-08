# Turbin angin — persiapan V1, belum menjadi video

Komponen ini menyiapkan naskah, audit, visual dan gate untuk episode tentang turbin yang bisa berhenti saat angin sangat kencang. Status: **DRAF / HUMAN REVIEW NOT TESTED**. Tidak ada narasi, musik, subtitle bertiming, MP4 final, thumbnail final, jadwal, atau publikasi. `storyboard-preview.tsx` hanya membuat dua **studi gambar statis** berlabel draf untuk membantu review; bukan renderer video dan bukan bukti gerak.

## Input

- `content/proposals/turbin-angin-draf-v1.json`: 12 scene, narasi, sumber dan `objectMap`.
- `content/proposals/turbin-angin-audit-kalimat-v1.json`: satu item per kalimat, dari hook sampai CTA. Uji offline hanya memeriksa kelengkapan struktur/teks, bukan mutu.
- `shot-plan.json`: rencana visual, termasuk pemisahan footage nyata dan skema. Waktu scene/cue belum ditetapkan; harus mengikuti satu take narasi yang disetujui.
- `footage-manifest.json`: empat original Coverr dan SHA-256. Media asli **hanya** ada di Drive privat dan, ketika dibutuhkan, folder lokal terabaikan `google_drive/`.
- `motion.mjs`: model gerak puncak, dengan frame pertemuan identik antara cuplikan awal dan kembali ke puncak. Tidak menggambarkan data fisik turbin yang direkam.
- `review-gate.mjs` / `preflight.mjs`: penjagaan approval manusia dan pemeriksaan offline. Ini proses kerja, bukan tanda tangan kriptografis: record **tidak boleh dibuat tanpa review manusia yang nyata**.

## Eksekusi dan keluaran

Dari root repo, setelah `npm ci` di `editorial-engine`:

```sh
node --test editorial-engine/pipeline/turbin-angin-v1/test-preflight.mjs
python3 editorial-engine/pipeline/turbin-angin-v1/test-pack.py
python3 editorial-engine/pipeline/script-review/audit.py \
  --script editorial-engine/content/proposals/turbin-angin-draf-v1.json \
  --review editorial-engine/content/proposals/turbin-angin-audit-kalimat-v1.json
node editorial-engine/pipeline/turbin-angin-v1/preflight.mjs --stage planning
(cd editorial-engine && ./node_modules/.bin/tsx pipeline/turbin-angin-v1/storyboard-preview.tsx)
```

Gambar prareview masuk ke `.scratch/turbine/`, yang diabaikan Git. Perintah gambar tidak memakai footage, tidak memproduksi video, dan tidak membuktikan kualitas animasi. `preflight --stage planning` bisa lulus secara **struktural** saat manusia dan hak masih belum diperiksa; hasil lain ditampilkan terpisah.

Sesudah pemilik/editor benar-benar membaca dan menyetujui **naskah, audit, storyboard dan ruang lingkup fakta**, simpan bukti keputusan privat dengan role, metode, tanggal dan scope; buat record JSON privat yang berisi `decision: "PASS"`, `reviewerRole`, `reviewMethod`, `evidence`, tanggal `reviewedAt` (`YYYY-MM-DD`), `scope: ["script", "sentence-audit", "storyboard", "factual-scope"]`, serta `scriptSha256`, `auditSha256` dan `planSha256` dari preflight. Bila suatu byte naskah, audit atau rencana shot berubah, review otomatis tidak berlaku dan harus diulang. Lalu `node .../preflight.mjs --stage voice --review <file-privat>` harus lolos sebelum menghasilkan suara. Gunakan satu take `voice-05`, bukan ejaan huruf nama kanal.

Tahap `--stage render` **sengaja gagal** saat ini: renderer produksi, soundtrack, sinkronisasi subtitle/scene dan QA belum dibuat. Setelah disetujui, implementasikan serta uji dengan input aktual secara terpisah; jangan menafsirkan gate suara sebagai gate publikasi. Suara, gambar, master, thumbnail, poster, caption, source dan backup tetap di Drive privat, bukan Git. Buffer dan label AI tunduk pada persetujuan dan aturan platform yang berlaku.

## Backup checkpoint privat

Dengan keempat file asli terverifikasi di `google_drive/` dan enam studi/review
lokal di `.scratch/turbine/`, jalankan dari root repo:

```sh
python3 editorial-engine/pipeline/turbin-angin-v1/pack-checkpoint.py
```

Script hanya memasukkan daftar file yang disetujui, memverifikasi hash sumber,
menulis manifest SHA-256 per anggota, lalu membaca kembali seluruh archive dan
memverifikasi isi sebelum menyatakan PASS. Output
`.scratch/turbine/Checkpoint-Turbin-DRAF.zip` mengandung media privat: upload
hanya ke Drive privat. Jika archive atau `.partial` sudah ada, berhenti untuk
mencegah penimpaan; simpan checkpoint lama atau tentukan versi baru setelah
memeriksa kondisi. Verifikasi juga hash archive yang diunduh kembali dari
Drive. Checkpoint ini bukan video final dan tidak mencakup voice ataupun musik.

## Batas dan kesalahan

- Empat unduhan API aktual adalah 1920×1080, meskipun metadata scout menyebut 3840×2160. Crop 9:16 tengah hanya sekitar 608×1080 dan butuh upscale sekitar 1,78× untuk lebar 1080. Contoh jendela 16:9 dalam 9:16 menghindari upscale, tetapi belum diuji pada video/ponsel.
- Tracking `PATCH` masing-masing 404 dengan kedua metode; hak/atribusi Coverr **NEEDS REVIEW**. Creator tidak diberikan pada metadata API. Jangan publikasikan sebelum jelas. Tidak ada klaim bahwa frame stok menunjukkan turbin berhenti akibat angin kencang.
- `PASS HASH` memverifikasi byte sumber, bukan lisensi, keterlihatan gerak atau kesesuaian framing. Jika file tidak ada/hash beda: pulihkan original terverifikasi dari Drive; jangan menonaktifkan check.
- Mechanical audit PASS tidak berarti human quality, fakta, segmentasi, atau respons audiens PASS. Static sample tidak membuktikan frame 0 final, timing, voice, CTA, motion atau playback ponsel; semuanya masih perlu diuji.
- Pakai teks `ikuti knot theory` lowercase; tidak menyimpulkan respons audiens. Jangan mengubah episode lama, menjadwalkan, atau mengaktifkan label AI bertentangan dengan aturan yang disepakati. Jika platform mewajibkan disclosure atau tidak jelas, hentikan dan minta keputusan.
