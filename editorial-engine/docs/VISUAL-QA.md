# QA VISUAL — kriteria & hasil

Dinilai pada frame hasil render sebenarnya (`rendering/previews/`, `qa/frames/`),
bukan pada niat desain.

## Kriteria wajib

| # | Kriteria | Cara diperiksa | Hasil |
| --- | --- | --- | --- |
| 1 | Focal point tunggal per scene | lihat frame pada 3 titik waktu per scene | PASS — s04 angka, s06 sertifikat + termometer, s08 tangan terkatup, s09 kursi kosong |
| 2 | Anatomi: tangan menempel di lengan | prop dihitung dengan `limbEndPoint(...)` | PASS — s07 sendok presisi di tangan guru |
| 3 | Proporsi anak vs dewasa konsisten | skala rig dari `nativeExtent()` | PASS (≈0,72), catatan: lengan bawah kaku pada pose menunjuk |
| 4 | Teks tidak menutupi wajah / focal point | cek frame per frame pada band teks | PASS — poster & s04/s08 memakai scrim, s09 memindahkan objek dari band subtitle |
| 5 | ≤2 keluarga font | `qa.ts` membaca `fonts.json` | PASS — Instrument Serif, Archivo |
| 6 | Judul ≤2 baris, terbaca di 380 px | render poster diperkecil | PASS — baris terpanjang 41 karakter |
| 7 | Palet bumi + satu aksen per frame | sampel warna tiap scene | PASS |
| 8 | Lingkungan konkret, bukan latar abstrak | 7 environment | PASS |
| 9 | Gerak punya tujuan naratif | tiap `interpolate` punya alasan di komentar scene | PASS |
| 10 | Perubahan visual tiap 3–5 s | 9 scene / 26 cue / 88,67 s | PASS — rata-rata 3,4 s |
| 11 | Label `ILUSTRASI` pada gambar peristiwa | cek tag di poster & scene | PASS |
| 12 | Identitas karakter konsisten antar scene | satu rig + palet per tipe tubuh | PASS |

## Catatan jujur (belum PASS)

- **Pose lengan** pada beberapa frame masih terbaca kaku (s06 petugas, s07 guru menunjuk).
  Diperbaiki dengan menambah pose data, bukan menambah komponen.
- **Kepadatan s07**: papan tulis + 3 stempel + 3 anak + meja dalam satu frame; masih
  terbaca, tetapi scene ini yang paling dekat ke batas "terlalu ramai".
- **Penilaian suara** (pelafalan nama tempat/institusi, kehangatan nada) belum dilakukan
  penutur asli; statusnya NEEDS REVIEW, bukan PASS.
