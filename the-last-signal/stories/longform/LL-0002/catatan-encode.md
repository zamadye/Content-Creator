# Catatan encode — LL-0002 (9:58,3)

## Masalahnya angka, bukan selera

| | |
|---|---|
| Batas QC & batas `make-publish-request` | **40 MB** |
| Durasi LL-0002 | **598,3 detik** |
| Berarti bitrate total | 40 × 8 × 1024 / 598,3 = **548 kbps** |
| Audio AAC stereo | 96 kbps |
| Sisa untuk video | **±452 kbps** |

Bandingkan dengan episode panjang pendek sebelumnya:

| | Durasi | Ukuran | Bitrate |
|---|---|---|---|
| LS-0010 (Short, acuan) | 54,2 s | 32,5 MB | **4.912 kbps** |
| LL-0002 kalau pakai bitrate LS-0010 | 598,3 s | **359 MB** | 4.912 kbps |

Jadi batas 40 MB berasal dari dunia Short. Untuk video 10 menit, angka itu
meminta bitrate **sepersebelas** episode acuan. Konsekuensinya harus dipilih
sadar, bukan ditemukan setelah render 2 jam.

## Tiga pilihan

**A. Tetap < 40 MB (aman untuk semua gerbang sekarang)**
`crf 27`, `maxrate 520k`, `bufsize 1040k`, grain overlay dimatikan saat encode,
audio 96 kbps. Gambar 1080p yang hampir seluruhnya diam akan bertahan; yang
paling dulu rusak adalah tekstur grain dan gerakan lambat. Perkiraan ukuran
32–38 MB.

**B. Longgarkan batas untuk format panjang (mis. 120 MB)**
Kualitas setara LS-0010 (±4,5 Mbps), ukuran ±340 MB — tidak realistis untuk
disimpan di git; hanya masuk akal kalau berkas rilis tidak lagi di-commit dan
workflow mengambilnya dari Drive. Itu perubahan aturan distribusi, bukan
keputusan teknis kecil.

**C. Turunkan resolusi**
1280×720 pada 900 kbps memberi kualitas gambar lebih baik daripada 1080p pada
452 kbps, tapi melanggar aturan 1080p untuk video panjang (ATURAN 1.1).

## Usulan saya

**A**, dengan dua syarat yang harus diuji, bukan diasumsikan:

1. Encode uji 60 detik dari hasil render, ukur ukuran dan lihat apakah grain
   masih terbaca. Kalau rusak, grain dimatikan dan diganti vignette saja.
2. Setelah encode penuh, hitung ulang: kalau hasilnya 38–40 MB (mepet), turunkan
   `crf` satu langkah sebelum masuk antrean — jangan mengandalkan keberuntungan.

**Yang tidak boleh terjadi:** render 17.948 frame selesai, lalu encode gagal
karena 45 MB, dan tidak ada waktu mengulang sebelum jadwal 13.00 WIB.

---

## Kenapa render pindah ke GitHub Actions (6 Nov 2026)

Sandbox kerja **tidak bisa meluncurkan Chromium**: `ldd /tmp/chromium` melaporkan
`libnss3.so`, `libnssutil3.so`, `libnspr4.so` tidak ditemukan, dan `apt` terkunci
tanpa root. Remotion tidak punya jalur render tanpa browser, jadi render 17.965
frame tidak mungkin dikerjakan di sini — bukan soal waktu, soal pustaka sistem.

Jalurnya sekarang `.github/workflows/render.yml` (workflow_dispatch):
bangun → render `crf 20` → encode `crf 27 / maxrate 520k` → cek < 40 MB → QC →
artefak + commit `releases/<ID>.mp4`. Runner ubuntu punya semua pustaka dan
4 core, dan berkas rilis langsung tersedia untuk `zernio-publish.yml`.

Dua ketergantungan lama pada LS-0001 (sudah diarsipkan) ikut dibereskan karena
memblokir render: `apps/renderer/src/Root.tsx` mengimpor
`projects/episodes/LS-0001/episode.json`, dan `remotion.config.ts` menunjuk
folder itu sebagai publicDir.

## 7 Nov 2026 — render pertama yang benar-benar berjalan (GitHub Actions)

Render 17.948 frame selesai di runner (±60 menit, concurrency 4), tapi encode
gagal karena berkas > 40 MB. Penyebabnya satu baris:

    "-bufsize", String(Number.parseInt("520k", 10) * 2) + "M"

`parseInt("520k")` = 520, lalu ditempeli "M" → bufsize **1040 MB**. VBV praktis
mati, `--maxrate` diabaikan, CRF 27 menentukan sendiri, hasilnya membengkak.
Sekarang `parseRate()`/`formatRate()` membaca akhiran k/M dan bufsize = 2× maxrate.

Anggaran ukuran untuk 598,8 s (batas unggah 40 MiB = 41.943.040 byte):
560 kbps total. Dipakai **video maxrate 400k + audio 96k** ≈ 37 MB.
Audio dulu 192k = 14 MB untuk 10 menit, terlalu mahal untuk format panjang.

Artefak `master-<ID>` sekarang disimpan SEBELUM encode (7 hari), dan
`.render-trigger` menerima mode ketiga: `LL-0002 523 encode` memakai master itu
sehingga menala encode tidak lagi memaksa render ulang 60 menit.

Temuan lain dari run ini:
- `publishing.thumbnail.image` = `images/thumb.png`, tapi `.gitignore` melarang
  PNG di `images/`. Nama berkas kini `images/thumb.jpg` (1920×1080), dan
  `collectRequiredAssets()` ikut memeriksanya — sebelum ini validator bilang
  "aset lengkap" padahal render 404 di tengah jalan.
- Runner tidak punya ffmpeg dengan `ebur128`/`alimiter`; workflow memasangnya
  lewat apt sebelum build.
- Durasi hasil ukur di runner 598,3 s / 17.948 frame, di sandbox 598,8 s /
  17.965 frame. Selisih 17 frame berasal dari versi ffmpeg yang berbeda saat
  mengukur audio. Tidak berbahaya karena dalam satu run semuanya diukur dengan
  alat yang sama, tapi angka di dokumen lama tidak akan sama persis.
- Log job tidak bisa diunduh dari sandbox (blob storage di luar jangkauan),
  jadi `scripts/annotate-log.sh` mengirim pesan galat sebagai anotasi check-run.
