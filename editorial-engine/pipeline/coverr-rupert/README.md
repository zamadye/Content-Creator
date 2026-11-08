# Coverr untuk visual Rupert — pencarian dan transfer privat

Pipeline satu kali untuk permintaan visual yang disetujui. Ia **tidak** menjadwalkan, menerbitkan, mengubah draf, atau memakai cron. Setiap penggunaan konten/kueri baru memerlukan persetujuan yang relevan; jangan menyalakan workflow dengan marker hanya untuk menguji sesuatu yang akan memanggil API.

## Konfigurasi dan I/O

- `.github/workflows/coverr-rupert-footage.yml` menggunakan branch sesi yang ditetapkan. Pada push, marker `[approved-coverr-rupert-search]` menjalankan pencarian; marker `[approved-coverr-rupert-download]` menjalankan unduhan. Tanpa marker yang cocok, job dilewati. `workflow_dispatch` tidak tersedia pada integrasi sesi ini.
- Key Coverr hanya dari Actions secret/variable `COVERR_API_KEY`, `COVERR_VIDEO_API_KEY`, atau `COVERR_KEY`; jangan menulis nilainya ke kode, log, chat, atau dokumen. Token GitHub berasal dari Actions. Job hanya membutuhkan `contents: read` dan `checks: write`.
- `search.py` memanggil endpoint Coverr `/videos` dengan kueri allowlist. Output: metadata tersanitasi di log/annotations, bukan key, signed URL atau response mentah. GitHub membatasi ukuran anotasi; `omitted_from_annotation` melaporkan hasil yang tidak muat. Banyaknya kueri, metadata dan peringkat hasil tidak membuktikan seluruh katalog sudah diperiksa.
- `direct-drive-relay.mjs` untuk satu ID yang disetujui (`azy1Cd1ZeQ`), bukan pengunduh massal. Ia mengambil detail dan original melalui `urls.mp4_download`, memeriksa host HTTPS Coverr, menolak premium/AI/vertikal atau status metadata yang tidak diketahui, membatasi 100 MiB, memeriksa ffprobe, dan menyimpan media hanya di folder temporer runner dengan akses terbatas. FFprobe dipasang di `$RUNNER_TEMP` dengan versi tetap dan tanpa install script. Native source tidak diubah, dipotong, atau di-upscale.
- `READY` di check-run berisi metadata aman, hash, ukuran, nonce dan public key RSA sementara. Runner memegang private key hanya di memori. Operator membuat **satu** sesi upload resumable Drive privat dengan connector setelah memverifikasi folder, ukuran dan hash, dan menyimpan URI capability hanya di scratch privat berizin 0600. Jangan menaruh URI dalam argumen shell, stdout, dokumen atau Git.
- `seal-direct-session.mjs` membaca `ready.json` dan `drive-session-uri` dari `/home/user/.cache/coverr-rupert-relay` (atau `COVERR_RELAY_STATE_DIR`), memverifikasi `COVERR_APPROVED_RUN`, lalu menyegel capability dengan RSA-OAEP/AES-GCM ke `drive-session-envelope.json`. Hanya ciphertext ditambahkan sementara pada branch sesi. Ciphertext dalam riwayat Git masih dapat bertahan, tetapi tidak berisi media dan private key runner tidak disimpan. URI scratch dihapus setelah penyegelan; hapus envelope dari HEAD setelah job berakhir.
- Runner memvalidasi nonce, ID, run, ukuran, hash dan tujuan Google Drive, lalu mengunggah file lokal dalam chunk 2 MiB. Header status resumable `active`/`final` menentukan hasil; 308 tidak diikuti sebagai redirect. Tidak ada retry otomatis atas hasil write yang ambigu. Jangan mengulang finalisasi yang tidak jelas tanpa memeriksa folder Drive.
- Keluaran: file original owner-only di Drive, SHA-256 serta metadata/QA tersanitasi. Verifikasi permission, ukuran, checksum, decode dan visual secara terpisah. File asli, frame dan cadangan **tidak** masuk Git; jangan jadikan folder Drive publik.

## Pengujian offline

```bash
python3 editorial-engine/pipeline/coverr-rupert/test-search.py
node --test editorial-engine/pipeline/coverr-rupert/test-direct-drive-relay.mjs \
  editorial-engine/pipeline/coverr-transfer/test-transfer.mjs \
  editorial-engine/pipeline/drive-relay/test-relay.mjs
```

Tes meliputi redaksi metadata, panjang anotasi, endpoint allowlist, ikatan nonce/ukuran/hash, otentikasi enkripsi, ukuran chunk, probe, serta header upload `active`/`final`. Ini bukan pengganti uji visual, hak atau live end-to-end. Satu unduhan nyata berhasil melalui runner ke Drive; perubahan penanganan HTTP 308 setelahnya baru diuji offline.

## Kesalahan dan batasan

- Bila API/media mengembalikan 401, 403 atau 429: hentikan, jangan mengakali kontrol akses atau mengulang massal. Key dan signed URL harus tetap rahasia. Coverr menyebut batas demo 50 request/jam; batas akun aktual dapat berbeda.
- `FFPROBE_MISSING`: jangan mengonsumsi request lebih lanjut; perbaiki dependency runner dahulu. Satu percobaan awal berhasil mengambil file temporer tetapi gagal pada langkah probe dan file dibersihkan.
- `MEDIA_OVER_100_MB`: hentikan dan rencanakan jalur transfer/inspeksi yang aman; jangan memotong diam-diam atau mengunggah media ke Git. Ukuran ini dipilih agar original juga dapat diunduh balik lewat connector.
- `ENVELOPE_WAIT_TIMEOUT`/`DRIVE_STATUS_UNCONFIRMED`: cek run dan folder Drive terlebih dahulu; jangan melakukan write ulang jika status belum pasti. Jangan mencetak URL sesi ketika melakukan diagnosis.
- Endpoint tracking PATCH yang didokumentasikan mengembalikan 404 pada percobaan ini dengan kedua metode autentikasi yang didokumentasikan. Dokumentasi unduhan juga mengatakan direct `mp4_download` tidak perlu tindakan tambahan. Tracking tetap **NEEDS REVIEW**.
- Ketentuan komersial/atribusi di dokumentasi resmi Coverr tampak tidak konsisten. Verifikasi lisensi akun, atribusi dan ketentuan platform sebelum publikasi; jangan menyimpulkan clearance hanya dari keberhasilan unduh.
- Footage lab adalah ilustrasi umum, bukan bukti eksperimen atau pembuatan tetes Rupert. Sumber 1080p lanskap kehilangan resolusi pada crop vertikal; rencanakan komposisi dan periksa pada ponsel.
