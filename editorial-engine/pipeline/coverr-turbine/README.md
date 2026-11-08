# Transfer footage turbin untuk review privat

Tujuan: mendownload **empat kandidat yang dipilih** dari pencarian metadata turbin, serial, lalu mengirim masing-masing original ke folder Drive privat. Ini **bukan** approval hak pakai, bukan bukti visual tentang penyebab turbin berhenti, dan bukan pipeline publikasi. Tidak ada media, API key, signed URL, Drive upload capability, atau private key di Git/log. Kandidat hard-coded dalam `private-relay.mjs`: `9Y8kk5xCuY`, `WuuebDPmKg`, `oaw1EMLhFi`, `k6GEFHq7u4`.

## Pemicu dan input

Push commit berkode **`[approved-coverr-turbine-download]`** pada branch sesi hanya setelah user menyetujui pekerjaan footage. Workflow `coverr-turbine-private.yml` memakai secret/variable Coverr yang sudah ada di Actions, `GITHUB_TOKEN` berizin membuat check, Node, dan FFprobe terisolasi. Tidak ada input URI atau kunci dalam Git. Maksimum 100 MiB **per original**; file lebih besar gagal, tidak dipotong diam-diam. Metadata harus non-premium dan bukan AI menurut API. Tidak ada upload paralel atau pengulangan otomatis.

Di runner, unduh dan probe empat original satu per satu; jika salah satu mendapatkan HTTP 401/403/429 atau error lain, hentikan seluruh batch dan jangan lanjut ke kandidat berikutnya. `PATCH` tracking 404 dengan dua metode autentikasi terdokumentasi dicatat `NEEDS REVIEW`; klaim tracking berhasil dilarang. Sumber dengan respons/redirect mencurigakan, URL bukan HTTPS host Coverr, atau ukuran melampaui batas ditolak. Saat semua siap, check-run `Coverr turbine private relay` menampilkan metadata yang sudah disanitasi, SHA-256, ukuran, nonce, ID run, dan RSA public key ephemeral.

Operator membaca metadata check-run ke file lokal di `.scratch/`; membuat empat sesi upload Drive terpisah **di folder privat**, satu per item, dengan ukuran yang cocok. Buat file plaintext `.scratch/...` dengan mode 0600, berformat `{nonce,run_id,items:[{id,size,sha256,drive_uri},...]}` dan urutan yang sama dengan check. Kemudian jalankan `COVERR_APPROVED_RUN=<run-id> node editorial-engine/pipeline/coverr-turbine/seal-private-session.mjs <ready.json> <session.json>`. Script mencocokkan semua ID/run/size/hash, memeriksa host/path dan keunikan sesi, mengenkripsi bersama RSA-OAEP + AES-GCM ke `drive-session-envelope.json`, dan menghapus plaintext. Push hanya ciphertext, tanpa marker pemicu. Jangan menaruh URI dalam output, laporan, pesan commit, atau file selain plaintext sementara yang diabaikan Git. Setelah Action selesai, segera hapus envelope dan push penghapusan.

## Output dan verifikasi

Action memindahkan tiap original dalam chunk 2 MiB dan mensyaratkan header status `active`/`final`; menyatakan jumlah item yang berhasil. Tidak retry jika respons ambigu: inspect isi folder Drive dan hash/ukuran dulu. Runner menghapus media dan private key sementara pada akhir proses. Sesudahnya: verifikasi tiap ukuran dan MD5 Drive, SHA-256 untuk file yang berhasil diunduh kembali, FFprobe/full decode, serta buat contact sheet 9:16 dan inspeksi motion. Laporan harus menyatakan apakah video menunjukkan turbin atau hanya lokasi generik; footage turbin berputar/diam **tidak** membuktikan kecepatan angin atau alasan berhentinya.

Status hak pakai dan atribusi Coverr: **NEEDS REVIEW** karena sumber dokumentasi resminya berbeda dan tracking pernah mengembalikan 404. Draft tetap privat, tidak boleh masuk jadwal sampai haknya jelas serta pemeriksaan editorial/manusia disetujui. Human playback, kecocokan, dan keterbacaan crop bukan akibat otomatis dari probe.

## Uji offline

```
node --test editorial-engine/pipeline/coverr-turbine/test-private-relay.mjs \
  editorial-engine/pipeline/coverr-rupert/test-direct-drive-relay.mjs \
  editorial-engine/pipeline/coverr-transfer/test-transfer.mjs \
  editorial-engine/pipeline/drive-relay/test-relay.mjs
```

Uji meliputi pembatasan ID dan urutan, SHA/ukuran/run/nonce, URI Drive unik dan valid, enkripsi & tamper, ukuran chunk, status upload dan probe. Ini **tidak** menjalankan API/Drive nyata. Batalkan pada `MEDIA_OVER_100_MB`, `NETWORK_OR_TIMEOUT`, `COVERR_*_HTTP_401/403/429`, `PARTIAL_OR_UNCERTAIN`, atau sesi salah; periksa kondisi sebelum memutuskan langkah berikutnya. Jangan menimpa file atau mengulangi operasi yang hasilnya belum jelas.
