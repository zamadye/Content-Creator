# Kebijakan checkpoint dan cadangan anti-reset

Kebijakan operasional untuk produksi konten: hasil bernilai **tidak dianggap aman hanya karena ada di sandbox**, karena workspace pernah ter-reset dan menghapus file yang belum tersimpan di luar sandbox. File yang hilang tidak otomatis dapat dipulihkan dengan Git.

## 1. Wajib untuk setiap pekerjaan

1. Pecah pekerjaan menjadi tahap kecil. Simpan naskah, storyboard, sumber, kode renderer, konfigurasi non-rahasia, metadata timeline dan laporan QA secara bertahap ke Git; jangan menunggu seluruh batch selesai.
2. Commit lokal saja bukan cadangan eksternal. Setelah ada izin eksplisit untuk push, kirim commit ke branch sesi yang sedang aktif, **bukan** `main`, dan bandingkan hash `git rev-parse HEAD` dengan `git ls-remote` untuk branch tersebut. Jangan buat PR, merge, atau push tanpa izin yang berlaku.
3. Semua video, ilustrasi, audio TTS dan aset yang tidak dapat dibuat ulang harus memiliki cadangan persisten yang bisa diakses pengguna. Unggah bertahap ke penyimpanan privat yang disetujui, bukan pada akhir seluruh batch. Periksa ukuran, checksum penyedia bila tersedia, izin akses, dan catat ID/link dan SHA-256 per file.
4. Periksa bahwa cadangan dapat dipulihkan. Sekurang-kurangnya uji unduhan dan checksum secara selektif serta uji pemulihan source untuk satu hasil; tulis cakupan uji secara jujur. Beri label `NOT TESTED` untuk bagian yang belum diuji. Bila cadangan gagal, hentikan produksi sampai masalah terselesaikan; jangan menyebut hasil itu aman atau selesai.
5. Berikan catatan status yang membedakan file lokal, commit lokal, commit di remote, file Drive yang terverifikasi, serta materi yang hilang. Tunjukkan kepada pengguna lokasi masing-masing hasil dan informasikan sebelum sesi berakhir jika ada pekerjaan yang belum punya cadangan.

## 2. Privasi dan ukuran

- Repositori `zamadye/Content-Creator` diperiksa sebagai **publik** pada 7 November 2026. Semua yang di-push ke branch-nya dapat diakses publik. Tidak boleh mengunggah video, aset privat, atau source rahasia dalam bentuk terbuka tanpa persetujuan pengguna yang memahami akibatnya. Pilihan penyimpanan file besar harus disepakati dengan pengguna.
- Kredensial, token API, kunci privat, file `.env`, dan data sensitif tidak boleh di-commit, di-push, dimasukkan dalam arsip publik atau ditulis pada log. Tautan publik sementara hanya sesuai persetujuan, dan harus dicabut manual setelah publikasi terverifikasi.
- GitHub membatasi ukuran file individual; media besar dapat memerlukan Git LFS atau strategi yang disetujui. `git lfs` belum tersedia pada pemeriksaan 7 November 2026. Jangan mengklaim cadangan LFS berhasil sebelum instalasi, kuota, push dan pemulihan diuji.
- Hindari staging massal tanpa inspeksi. Periksa nama/ukuran file serta `git diff --cached` sebelum commit. Materi sementara yang dapat dihasilkan ulang (frame render/cache) bukan satu-satunya salinan source.

## 3. Produksi dan publikasi

- Simpan setiap episode beserta MP4, thumbnail PNG, caption empat platform, subtitle, satu narasi, sumber/objek storyboard, dan QA. Suara untuk seri ini `voice-05`; penutup tertulis dan input narasi **`ikuti knot theory`**. Pelafalan harus didengarkan manusia.
- Jadwal editorial bukan posting terjadwal. Buat/ubah posting hanya dengan persetujuan eksplisit yang sesuai, patuhi jeda minimal dua jam kecuali pengecualian spesifik yang disetujui, dan verifikasi penerbitan secara terpisah. Jangan buat ulang posting Danau/Titik Buta yang sudah terjadwal.
