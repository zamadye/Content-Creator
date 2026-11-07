# Buffer — batas operasional yang berlaku

**Diperbarui 8 November 2026.** Pengguna memilih **Buffer** sebagai tujuan antrean; Zernio adalah layanan terpisah dan tidak otomatis tersinkron. Semua master dan aset media disimpan di Drive privat; jangan commit atau mengunggah media baru ke repo publik.

- Untuk video baru yang siap, kirim jadwal ke Buffer sesuai izin umum pengguna, gate QA serta platform/waktu yang jelas. Ini bukan izin mengubah post lama, menayangkan draft lama yang masih menunggu review, atau membuat salinan publik tanpa izin. Status `scheduled` bukan bukti terbit. Setelah operasi tulis yang ragu, lakukan pemeriksaan read-only sebelum mempertimbangkan tindakan lain; jangan membuat duplikat secara buta.
- **Satu Action sekali jalan per batch, bukan cron:** Action hanya mengirim dan membaca balik post; setelah Buffer mengonfirmasi `scheduled`, Buffer yang menangani waktu tayangnya. Tidak perlu PR ke `main` dan posting tidak bergantung pada repo atau Action tetap hidup. Satu Action dapat melakukan banyak panggilan API: Buffer membuat post per kanal, bukan satu panggilan ajaib untuk seluruh batch. Batas paket/kuota tetap berlaku.
- **Jangan menganggap media sudah tersalin ke Buffer.** [Panduan resmi Buffer](https://developers.buffer.com/guides/hosting-media.html) menyatakan API menerima URL publik, bukan upload file langsung, dan mengambil media saat post terbit. Karena itu URL harus tetap stabil dan dapat diakses sampai semua post terkait `sent`; hilangnya file di repo tidak masalah **jika** sumber yang dipakai Buffer tetap tersedia. Tautan share Drive dan redirect dapat gagal; sumber direct HTTPS yang stabil lebih andal. Ketersediaan saat preflight bukan jaminan ketersediaan pada waktu tayang.
- Minta persetujuan untuk **salinan** publik sementara, jangan membuka master privat. Pertahankan akses sampai semua posting yang terkait terbukti terbit; cabut akses salinan secara manual dan periksa permission setelahnya. `anyone` pada Drive tidak otomatis kedaluwarsa. Jangan masukkan URL atau ID media sementara ke source/log publik; lihat guard read-only pada [panduan batch](../pipeline/buffer-batch/README.md).
- Validasi kanal, judul, caption, zona waktu, durasi, benturan jadwal dan kesesuaian pengecualian. Jarak antarpublikasi minimal dua jam kecuali pengecualian spesifik yang disetujui. FB Page memakai kanal **FACEBOOK REELS**.
- Standalone PNG thumbnail tetap disediakan dalam paket, tetapi dukungan thumbnail khusus bergantung pada platform dan integrasi. Jangan mengklaim PNG telah dipasang di FB/YT melalui Buffer jika tidak terbukti.
- **Label AI pada upload baru:** preferensi pengguna adalah tidak menyalakan label secara sukarela jika tidak diwajibkan. Sebelum membuat payload, cek kebijakan terkini berdasarkan video, suara, musik dan platform. Jika pengungkapan wajib atau belum jelas, hentikan dan minta keputusan pengguna; jangan otomatis menyatakan tidak ada AI. Platform dapat memasang labelnya sendiri. Lihat [standar produksi](../../STANDARD-MINIMAL-CONTENT-PRODUCTION.md).
- **Jangan menyamakan field Buffer:** [`aiAssisted`](https://developers.buffer.com/types/CreatePostInput.html) menyatakan apakah pembuatan post dibantu AI; tidak terbukti identik dengan sakelar label publik, dan tidak boleh diisi `false` jika pernyataannya tidak benar. Field `metadata.{platform}.isAiGenerated` adalah pengungkapan platform (jika didukung); `false` hanya setelah review memastikan pilihan tanpa pengungkapan diperbolehkan. Jangan menganggap menghilangkan field menjamin tidak ada label otomatis.
- Pipa yang disimpan dalam `schedule-shark-1900/`, `publish-antartika/`, Danau dan Titik Buta adalah **historis untuk posting tertentu** dan masih memiliki flag AI yang ditetapkan pada saat itu. Jangan menggunakannya untuk upload baru sebelum disesuaikan dengan aturan ini dan diuji; perubahan aturan tidak mengubah post yang sudah ada. Danau dan Titik Buta yang sudah dibuat jangan diubah atau dibuat ulang. Pemeriksaan status dan pencabutan tautan tidak berjalan otomatis.
- Detail dan batas API dapat berubah. Verifikasi dengan [panduan media Buffer](https://developers.buffer.com/guides/hosting-media.html), [Facebook Buffer](https://support.buffer.com/article/555-using-facebook-with-buffer) dan [YouTube Shorts Buffer](https://support.buffer.com/article/562-using-youtube-shorts-with-buffer) saat eksekusi.

Catat hasil sebagai `scheduled`, `sent`, gagal, atau belum diketahui berdasarkan bukti yang benar-benar terbaca; playback platform secara terpisah tetap perlu diuji. Buffer mendokumentasikan [Free: 10 post terjadwal per kanal; Essentials/Team: 5.000 per kanal](https://support.buffer.com/article/643-how-many-posts-can-i-schedule-in-advance), serta [batas API sesuai paket](https://developers.buffer.com/guides/api-limits.html). Paket akun pengguna belum diketahui di dokumen ini; jangan menjanjikan puluhan slot pada satu kanal tanpa memeriksa kuotanya. Kegagalan di tengah batch bisa meninggalkan sebagian post sudah terjadwal.

## Diagnostik performa dan status read-only

Workflow `.github/workflows/buffer-performance-readonly.yml` berjalan saat request `.github/analytics-readonly-request.json` diubah pada branch sesi. Ia memakai secret `BUFFER_API_KEY`, CLI Buffer dan `pipeline/inspect-buffer-performance.mjs` untuk membaca akun, kanal yang namanya cocok, hingga 10 halaman post dan metrik agregat. ID post yang pernah disetujui ditambahkan eksplisit agar Page Facebook dengan nama berbeda dan post terjadwal dapat diperiksa. Script hanya menjalankan query, tidak membuat, mengubah atau menghapus post; ia tidak memantau secara otomatis. Data dan timestamp dapat tertinggal, sebagian field mungkin tidak tersedia, dan kesuksesan workflow tidak membuktikan posting telah terbit ataupun grafik retensi tersedia.

Output digzip dan dienkripsi RSA-OAEP-SHA256 / AES-256-GCM oleh `pipeline/encrypt-diagnostic.mjs`, lalu dipecah menjadi annotations bernomor karena repo dan logs publik. **Kunci publik yang ada adalah sekali pakai untuk sesi terdahulu; jangan memicu ulang sebelum membuat pasangan kunci baru dan menyimpan private key secara aman.** Contoh, setelah mendapat persetujuan pemeriksaan yang relevan:

```bash
mkdir -p editorial-engine/deliverables/retensi-research/private
chmod 700 editorial-engine/deliverables/retensi-research/private
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 \
  -out editorial-engine/deliverables/retensi-research/private/analytics-private.pem
chmod 600 editorial-engine/deliverables/retensi-research/private/analytics-private.pem
openssl pkey -in editorial-engine/deliverables/retensi-research/private/analytics-private.pem \
  -pubout -out editorial-engine/pipeline/diagnostic-public.pem
# Perbarui request, tinjau diff nonrahasia dan push ke branch sesi.
# Setelah workflow selesai, ambil RUN_ID dari `gh run list` lalu:
P=editorial-engine/deliverables/retensi-research/private
JOB_ID=$(gh api "repos/zamadye/Content-Creator/actions/runs/$RUN_ID/jobs" \
  --jq '.jobs[] | select(.name == "inspect") | .id')
gh api "repos/zamadye/Content-Creator/check-runs/$JOB_ID/annotations?per_page=100" > "$P/annotations.json"
node editorial-engine/pipeline/decrypt-diagnostic.mjs \
  "$P/annotations.json" "$P/analytics-private.pem" "$P/analytics-result.json"
```

Alat dekripsi memeriksa urutan chunk dan autentikasi, hanya menulis di `private/` dengan mode 0600, dan menolak menimpa hasil. Private key, hasil dekripsi, URL media, identitas pemilik dan log mentah jangan di-commit atau dicetak ke log publik; `private/` diabaikan Git. Setelah hasil yang diperlukan dicatat privat, hapus kunci sementara dan hasil mentah. Periksa `errors`, `retrievedAt`, `status`, `sentAt`, `externalLink` dan `metricsUpdatedAt`; bila dekripsi atau hasil gagal, status **UNKNOWN**. Gunakan `node --check editorial-engine/pipeline/inspect-buffer-performance.mjs` dan `node --test editorial-engine/pipeline/tests/decrypt-diagnostic.test.mjs` untuk pemeriksaan komponen. Audit read-only teruji pada 7 November 2026; koneksi, izin dan skema Buffer tetap dapat berubah.
