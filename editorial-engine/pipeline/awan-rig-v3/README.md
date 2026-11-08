# Awan 500 ton — V3 (draf privat, terpisah dari V2)

V3 menggunakan satu take `voice-05`, satu timeline, 10 adegan dan rig Host
V2 yang diimpor read-only. Pembuka memanggil komposisi awan/lensa yang sama
seperti pengungkapan S04; cut frame 89 (sekitar 2,97 detik). Penjelasan tetes,
gravitasi dan arus naik terjadi sebelum hitungan. Ini hipotesis editorial,
bukan jaminan retensi. Master, input, dan source V2 tidak ditimpa.

## Input privat

Simpan arsip input privat sebagai
`deliverables/awan-rig-v3/01-INPUT-PRIVAT-RIG-V3.zip`. Arsip berisi tiga
ilustrasi yang dipakai ulang dari V2, satu take baru, transkrip dan manifest.
Media tetap di Drive privat, bukan Git. Sebelum membuat ulang:

```sh
cd editorial-engine
python3 pipeline/awan-rig-v3/restore-input.py
npm ci --no-audit --no-fund
npm run build:awan-rig-v3
```

Pemulihan memverifikasi struktur, CRC, SHA dan kecocokan narasi, serta menolak
menimpa aset lokal yang berbeda. `prepare.py` memverifikasi hash take dan
ketiga gambar; setiap penggantian take harus disertai pemetaan timing baru.
Butuh Linux x64 kompatibel, Node/npm, Python 3, CPU, ruang disk, dan akses npm
untuk menginstal dependency; renderer tidak memerlukan browser/GPU. Dua slice
encoder menggunakan satu clock dan disambung pada durasi frame yang persis.

## Output privat

`deliverables/awan-rig-v3/` berisi MP4 H.264/AAC 9:16, thumbnail PNG mandiri,
poster 4:5, caption empat platform, storyboard dan sumber, SRT, hash dan QA.
Video adalah **draf**, bukan persetujuan tayang; pipeline tidak menjadwalkan,
mempublikasikan atau memanggil Buffer.

## Timing dan batas QA

Take narasi tidak dipercepat: 0,34 detik sunyi awal dan 0,15 detik bagian jeda
sunyi antara dua pertanyaan dipangkas. Estimasi waktu adegan didasarkan pada
pola sunyi pada take yang cocok hash; cue dalam kalimat adalah perkiraan,
**bukan forced alignment**. Gerak mulut prosedural bukan lip sync fonem.
Pemeriksaan suara, pelafalan CTA “ikuti knot theory”, sinkronisasi, musik,
seluruh gerakan dan kontak prop, tampilan di ponsel/platform, fakta dan hak
harus dilakukan manusia sebelum menyatakan siap. Sampel gambar/tes mekanis
bukan bukti bahwa seluruh video sudah ditonton atau didengar.

## Pengujian tanpa publikasi

```sh
node --test pipeline/awan-rig-v3/test-story.mjs pipeline/awan-rig-v2/test-rig.mjs
python3 pipeline/awan-rig-v3/test-prepare.py
python3 pipeline/awan-rig-v3/test-restore.py
./node_modules/.bin/tsc --noEmit
```

Unit test memeriksa struktur, urutan, batas waktu estimasi, rig dan keamanan
restore, bukan kualitas penceritaan atau respons penonton. Lihat
`QA-DAN-SUMBER.md` yang dihasilkan untuk hasil spesifik render.

## Masalah umum

- Hash take/gambar salah atau tidak ada: pulihkan input yang benar; jangan
  mematikan pemeriksaan. Narasi baru berarti timing harus dipetakan lagi.
- `tsx`/FFmpeg hilang: install dependency dengan `npm ci` pada lingkungan
  yang mendukung. Tidak ada unduhan aset pada script build.
- Salah satu slice gagal: output tidak dirakit; periksa `.log`, pulihkan
  penyebab, lalu ulangi build. Jangan mengunggah file parsial.
- Teks subtitle belum cocok terhadap audio: edit cue setelah mendengarkan dan
  render ulang; jangan menyebutnya forced-aligned.
