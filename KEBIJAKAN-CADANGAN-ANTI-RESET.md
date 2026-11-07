# Kebijakan checkpoint dan cadangan anti-reset

Kebijakan operasional untuk produksi konten: hasil bernilai **tidak dianggap aman hanya karena ada di sandbox**, karena workspace pernah ter-reset dan menghapus file yang belum tersimpan di luar sandbox. File yang hilang tidak otomatis dapat dipulihkan dengan Git.

## 1. Wajib untuk setiap pekerjaan

1. Pecah pekerjaan menjadi tahap kecil. Simpan naskah, storyboard, sumber, kode renderer, konfigurasi non-rahasia, metadata timeline dan laporan QA secara bertahap ke Git; jangan menunggu seluruh batch selesai.
2. Commit lokal saja bukan cadangan eksternal. Pengguna menyetujui **push checkpoint rutin** untuk kode, naskah, manifest, dan dokumen nonrahasia ke branch sesi `arena/54cb36c6-content-creator` pada 7 November 2026. Push secara bertahap, **bukan** ke `main`; bandingkan hash `git rev-parse HEAD` dengan `git ls-remote` untuk branch tersebut. Izin ini tidak mencakup PR, merge, perubahan `main`, atau penjadwalan konten.
3. Sesuai pilihan pengguna, semua video, ilustrasi, thumbnail, audio TTS dan aset media berada di **Google Drive privat**, bukan di Git publik; Git hanya berisi source nonrahasia dan manifest/checksum. Unggah tiap episode/komponen penting secara bertahap, bukan pada akhir seluruh batch. Periksa ukuran, checksum penyedia bila tersedia, izin akses, dan catat ID/link serta SHA-256 per file di catatan privat yang sesuai—jangan taruh tautan atau ID media sementara di Git publik. Jika salah satu belum diverifikasi, hasil belum aman.
4. Periksa bahwa cadangan dapat dipulihkan. Sekurang-kurangnya uji unduhan dan checksum secara selektif serta uji pemulihan source untuk satu hasil; tulis cakupan uji secara jujur. Beri label `NOT TESTED` untuk bagian yang belum diuji. Bila cadangan gagal, hentikan produksi sampai masalah terselesaikan; jangan menyebut hasil itu aman atau selesai.
5. Berikan catatan status yang membedakan file lokal, commit lokal, commit di remote, file Drive yang terverifikasi, serta materi yang hilang. Tunjukkan kepada pengguna lokasi masing-masing hasil dan informasikan sebelum sesi berakhir jika ada pekerjaan yang belum punya cadangan.

## 2. Privasi dan ukuran

- Repositori `zamadye/Content-Creator` diperiksa sebagai **publik** pada 7 November 2026. Semua yang di-push ke branch-nya dapat diakses publik. Pilihan pengguna: hanya source dan manifest nonrahasia di Git; semua media dan aset privat disimpan di Drive privat. Jangan mengunggah media baru dalam bentuk terbuka ke Git. Media lama yang dipilih untuk dibersihkan telah dihapus dari tree branch terbaru; font dan referensi yang diperlukan tetap dipertahankan. Penghapusan dari tree tidak menghapus data dari riwayat Git publik.
- Kredensial, token API, kunci privat, file `.env`, dan data sensitif tidak boleh di-commit, di-push, dimasukkan dalam arsip publik atau ditulis pada log. Tautan publik sementara hanya sesuai persetujuan, dan harus dicabut manual setelah publikasi terverifikasi.
- GitHub membatasi ukuran file individual; media besar dapat memerlukan Git LFS atau strategi yang disetujui. `git lfs` belum tersedia pada pemeriksaan 7 November 2026. Jangan mengklaim cadangan LFS berhasil sebelum instalasi, kuota, push dan pemulihan diuji.
- Hindari staging massal tanpa inspeksi. Periksa nama/ukuran file serta `git diff --cached` sebelum commit. Jalankan `bash scripts/install-privacy-hook.sh` pada setiap workspace baru; hook `pre-commit` dan `pre-push` memblokir nama media, arsip, dan nama kredensial umum, termasuk media yang sempat ditambah lalu dihapus dalam commit yang akan di-push. Pengujian ini berdasarkan nama, **tidak memeriksa isi berkas atau semua jenis rahasia**, dan bukan jaminan privasi; tinjau diff secara manual. File yang sudah telanjur ada di riwayat publik tidak hilang dengan `.gitignore`. Materi sementara yang dapat dihasilkan ulang (frame render/cache) bukan satu-satunya salinan source.

## 3. Produksi dan publikasi

- Simpan setiap episode beserta MP4, thumbnail PNG, caption empat platform, subtitle, satu narasi, sumber/objek storyboard, dan QA. Suara untuk seri ini `voice-05`; penutup tertulis dan input narasi **`ikuti knot theory`**. Pelafalan harus didengarkan manusia.
- Jadwal editorial bukan posting terjadwal. Buat/ubah posting hanya dengan persetujuan eksplisit yang sesuai, patuhi jeda minimal dua jam kecuali pengecualian spesifik yang disetujui, dan verifikasi penerbitan secara terpisah. Jangan buat ulang posting Danau/Titik Buta yang sudah terjadwal.
