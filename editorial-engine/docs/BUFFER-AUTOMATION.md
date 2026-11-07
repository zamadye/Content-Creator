# Buffer — batas operasional yang berlaku

**Diperbarui 7 November 2026.** Dokumen lama yang menyarankan menaruh video di repo, GitHub Release atau Pages tidak lagi berlaku. Semua master dan aset media disimpan di Drive privat; jangan commit atau mengunggah media baru ke repo publik.

- Penjadwalan atau perubahan posting membutuhkan persetujuan eksplisit yang sesuai. Target editorial bukan persetujuan, dan status `scheduled` bukan bukti terbit. Setelah operasi tulis yang ragu, lakukan pemeriksaan read-only sebelum mempertimbangkan tindakan lain; jangan membuat duplikat secara buta.
- Jika Buffer memerlukan URL yang dapat diakses untuk mengambil video, minta persetujuan untuk **salinan** sementara, jangan membuka master privat. Pertahankan akses sampai semua posting yang terkait terbukti terbit; cabut akses salinan secara manual dan periksa permission setelahnya. `anyone` pada Drive tidak otomatis kedaluwarsa. Jangan masukkan URL atau ID media sementara ke source/log publik.
- Validasi kanal, judul, caption, zona waktu, durasi, benturan jadwal dan kesesuaian pengecualian. Jarak antarpublikasi minimal dua jam kecuali pengecualian spesifik yang disetujui. FB Page memakai kanal **FACEBOOK REELS**.
- Standalone PNG thumbnail tetap disediakan dalam paket, tetapi dukungan thumbnail khusus bergantung pada platform dan integrasi. Jangan mengklaim PNG telah dipasang di FB/YT melalui Buffer jika tidak terbukti.
- **Label AI pada upload baru:** preferensi pengguna adalah tidak menyalakan label secara sukarela jika tidak diwajibkan. Sebelum membuat payload, cek kebijakan terkini berdasarkan video, suara, musik dan platform. Jika pengungkapan wajib atau belum jelas, hentikan dan minta keputusan pengguna; jangan otomatis menyatakan tidak ada AI. Platform dapat memasang labelnya sendiri. Lihat [standar produksi](../../STANDARD-MINIMAL-CONTENT-PRODUCTION.md).
- **Jangan menyamakan field Buffer:** [`aiAssisted`](https://developers.buffer.com/types/CreatePostInput.html) menyatakan apakah pembuatan post dibantu AI; tidak terbukti identik dengan sakelar label publik, dan tidak boleh diisi `false` jika pernyataannya tidak benar. Field `metadata.{platform}.isAiGenerated` adalah pengungkapan platform (jika didukung); `false` hanya setelah review memastikan pilihan tanpa pengungkapan diperbolehkan. Jangan menganggap menghilangkan field menjamin tidak ada label otomatis.
- Pipa yang disimpan dalam `schedule-shark-1900/`, `publish-antartika/`, Danau dan Titik Buta adalah **historis untuk posting tertentu** dan masih memiliki flag AI yang ditetapkan pada saat itu. Jangan menggunakannya untuk upload baru sebelum disesuaikan dengan aturan ini dan diuji; perubahan aturan tidak mengubah post yang sudah ada. Danau dan Titik Buta yang sudah dibuat jangan diubah atau dibuat ulang. Pemeriksaan status dan pencabutan tautan tidak berjalan otomatis.
- Detail dan batas API dapat berubah. Verifikasi dengan [panduan media Buffer](https://developers.buffer.com/guides/hosting-media.html), [Facebook Buffer](https://support.buffer.com/article/555-using-facebook-with-buffer) dan [YouTube Shorts Buffer](https://support.buffer.com/article/562-using-youtube-shorts-with-buffer) saat eksekusi.

Catat hasil sebagai `scheduled`, `sent`, gagal, atau belum diketahui berdasarkan bukti yang benar-benar terbaca; playback platform secara terpisah tetap perlu diuji.

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
# Ambil check-run annotations, urutkan chunk 01..N, lalu dekripsi secara lokal.
```

Private key, hasil dekripsi, URL media, identitas pemilik dan log mentah jangan di-commit atau dicetak ke log publik; `private/` diabaikan Git. Setelah hasil yang diperlukan dicatat privat, hapus kunci sementara dan hasil mentah. Periksa `errors`, `retrievedAt`, `status`, `sentAt`, `externalLink` dan `metricsUpdatedAt`; bila dekripsi atau hasil gagal, status **UNKNOWN**. Gunakan `node --check editorial-engine/pipeline/inspect-buffer-performance.mjs` untuk pemeriksaan sintaks. Audit read-only teruji pada 7 November 2026; koneksi, izin dan skema Buffer tetap dapat berubah.
