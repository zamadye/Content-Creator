# Uji Coverr — satu pencarian footage

## Tujuan dan batas
Masukan: kata pencarian `worker` dan secret Actions dengan salah satu nama
`COVERR_API_KEY`, `COVERR_VIDEO_API_KEY`, atau `COVERR_KEY`. Pencarian diminta
pada endpoint resmi `GET https://api.coverr.co/videos` dengan `page_size=1` dan
filter `is_ai_generated:false`. Hanya satu kandidat yang diminta. Ini **bukan**
uji download, uji lisensi klip individu, atau integrasi ke video UMP.

Umpan balik pengguna: animasi maskot sebelumnya terasa berulang karena banyak
adegan memakai susunan yang sama. Footage dapat diuji sebagai bahan variasi,
bukan otomatis menggambarkan peristiwa, perusahaan, pekerja, atau lokasi yang
dibahas. Identitas maskot dan visual harus ditentukan per adegan sesuai cerita.

## Prosedur satu komponen
1. Periksa nama secret di GitHub Actions; jangan masukkan nilai kunci ke
   repository, log, hasil, atau percakapan. Workflow hanya membaca secret sebagai
   environment variable dan tidak menerima kunci sebagai input teks.
2. Setelah izin push eksplisit, push workflow test ke **branch sesi saja**.
   Push file workflow memicu job satu kali; tidak ada PR, publikasi, penjadwalan,
   atau perubahan `main`. `workflow_dispatch` disediakan tetapi bisa memerlukan
   file workflow pada default branch; tidak menyentuh default branch untuk itu.
3. Proses menggunakan header `x-api-key` sesuai dokumentasi resmi. Batas waktu
   25 detik; tidak mengikuti redirect keluar dari origin API. Hasil yang diproses
   adalah status HTTP dan metadata terbatas (ID, judul, dimensi/durasi bila ada,
   kreator dan flag bila ada). Respons mentah dan signed URL tidak dicetak; URL
   bertanda tangan menurut dokumentasi terikat pada API key.
4. Jika HTTP 401/403/429, jaringan gagal, secret tidak tersedia, hasil kosong,
   atau JSON tidak valid, laporkan keadaan sebenarnya; tidak boleh dianggap PASS.
   Job menggunakan exit status bukan nol untuk kegagalan tersebut.
5. Sebelum footage digunakan: periksa hak klip spesifik, premium/watermark,
   merek/tokoh, konteks dan attribution. Lisensi Coverr yang diperiksa pada 5
   November 2026 menyebut aplikasi API Demo/free harus memberi kredit Coverr
   dan kreator jika tercantum; akses premium bergantung paket. Jika video benar-
   benar dipilih/diunduh, patuhi `PATCH /videos/:id/stats/downloads` sesuai
   lisensi/dokumentasi. Jangan gunakan materi Coverr untuk melatih, menyetel,
   mengevaluasi model AI, atau membuat dataset untuk tujuan itu.

## I/O, uji dan status
- I/O: secret environment → satu permintaan HTTPS → metadata tersaring di log
  dan anotasi Actions; tidak ada file MP4 atau credential yang ditulis.
- Uji offline `python3 -m unittest discover -s editorial-engine/pipeline -p
  'test_coverr_search.py' -v`: **8 PASS** dengan respons palsu, termasuk
  penolakan redirect lintas origin, 401/403/429, error jaringan, dan redaksi.
- Secret kosong: **TESTED**, menghasilkan `MISSING_SECRET` dan exit bukan nol.
- Jaringan langsung sandbox: **FAIL**; `curl` menghasilkan kode 35
  `OpenSSL SSL_connect: SSL_ERROR_SYSCALL` ke `api.coverr.co:443`.
- Panggilan API asli: **NOT TESTED** sampai workflow Actions benar-benar selesai.
  Unit test tidak membuktikan kredensial valid atau ada footage yang sesuai.

## Sumber primer
- https://api.coverr.co/docs/auth/
- https://api.coverr.co/docs/videos/
- https://coverr.co/license (versi tertulis terakhir 4 November 2026; periksa lagi
  saat memakai klip)
