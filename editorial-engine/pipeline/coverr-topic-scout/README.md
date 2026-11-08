# Scout topik / footage Coverr

Eksplorasi read-only yang disetujui untuk membandingkan topik cerita berdasarkan sumber dan ketersediaan footage. Tidak mengunduh video, mempublikasikan, mengubah draf, atau menjadwalkan Buffer. Setiap kueri/topik baru atau aksi unduh memerlukan persetujuan yang relevan.

## Input, eksekusi, dan output

- `scout.py` menggunakan daftar kueri spesifik di file, serta sanitasi dan endpoint resmi dari `../coverr-rupert/search.py`. Tidak mengambil API key lokal dan tidak mencetak signed URL, raw response, atau secret.
- `.github/workflows/coverr-topic-scout.yml` bekerja di branch sesi, membutuhkan Actions secret/variable Coverr yang sudah dikonfigurasi dan marker commit `[approved-coverr-topic-search]` setelah persetujuan. Maksimal 8 kueri per satu run saat ini.
- Hasil muncul sebagai metadata sanitasi di log dan check-run annotations. `total_hits` adalah angka pencarian luas, bukan jumlah klip relevan; `omitted_from_annotation` menyatakan metadata yang tidak muat di anotasi. Periksa judul/deskripsi, deduplikasi ID, resolusi dan flag; unduhan, isi visual, izin, dan kualitas crop belum dibuktikan oleh metadata.
- Pada status 401, 403, atau 429 proses berhenti dan tidak mencoba melewati pembatasan. Dokumentasi Coverr menyebut batas demo 50 request/jam; batas akun dapat berbeda.

## Tes offline

```sh
python3 editorial-engine/pipeline/coverr-rupert/test-search.py
python3 editorial-engine/pipeline/coverr-topic-scout/test-scout.py
```

Tes memeriksa daftar kueri, masukan tak valid, tidak bocornya key/URL, dan ukuran anotasi. Tes tidak memanggil API. Kondisi cerita, hak/atribusi dan isi rekaman tetap memerlukan pemeriksaan terpisah.
