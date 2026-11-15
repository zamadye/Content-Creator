# Perbaikan gap audit — master v5

Catatan versi berikutnya: opening salinan SC21 telah ditambahkan pada master v6.
Script default sekarang memakai v6; lihat [opening hook SC21](OPENING-HOOK-SC21.md).
Laporan ini tetap mencatat perbaikan dan QA master v5 sebelum penambahan opening.

Master revisi sekarang berisi **24 scene / 434,991 detik**, bukan montage empat scene.
Project lokal: `editorial-engine/deliverables/gibran-mundur-2026/openfilm-master-v5/`.
Source lama dan ZIP v3 dipertahankan sebagai pembanding dan sumber media.
VO asli tidak diregenerasi atau diedit.

## Temuan yang sudah diperbaiki

| Temuan audit | Perbaikan di master |
|---|---|
| SC19 masuk pada 5:10 | SC18 berakhir 5:11; SC19 mulai 5:11 dan berakhir 5:23. |
| Hanya sembilan jeda yang dijelaskan | Seluruh sepuluh jeda DOCX kini menahan adegan sebelumnya; tidak ada celah/overlap antar-slot. |
| Pendingin mobil tidak mempunyai fase tersendiri | Penggantian komponen/gerak mobil berada sebelum 4:58; reveal pendingin dimulai pada 4:58. |
| Dokumen SC04–08 terpotong | Transform layout dan gerak dipisahkan; dokumen tetap berada di kanvas. |
| Pilar hilang lalu muncul lagi SC02–03 | Keadaan pilar tengah yang hilang diteruskan ke awal SC03. |
| Hook SC01 berjudul | Judul dihilangkan; plate pembuka beralih ke struktur ilustrasi. |
| Surat/diagnosis tidak mempunyai aksi | Pengiriman ke penerima, kolom kosong, dua konteks perkara, dan batas kesimpulan dibedakan. |
| Crane/pilar tidak benar-benar dipasang | SC10 mengangkat/menggeser/menurunkan pilar; fondasi menjadi fokus berikutnya. |
| Tiga diagnosis hanya berupa footer | SC11 memperlihatkan desain, pemeriksaan, dan distribusi secara bertahap. |
| Empat node institusi | SC12 mempunyai tujuh node; SC13 mempertahankan jaringan dan menambahkan batas konstitusi. |
| SC14 hanya garis 60 hari | Dua calon, alur Presiden → calon → MPR, dan 60 sel kalender hadir. |
| SC15–17 mengulang kartu yang sama | Percabangan perspektif → gangguan mereda → berkas/prosedur yang tetap ada. |
| SC18–19 mengulang gearbox | Komponen diganti, mobil bergerak, pendingin terganggu; mekanisme beralih ke institusi. |
| Partikel resilience meleset dari jalur | Sinyal bergerak pada jalur yang sama dengan diagram; deteksi, koreksi, pencegahan dan pemulihan berurutan. |
| Penutup tidak berkembang | Dua hasil dibandingkan; kunci/mandat, kesetaraan aturan, pertanyaan, komentar, refleksi dan outro mendapat beat tersendiri. |
| Teks berlapis pada pergantian pesan | Footer SC14 dan refleksi/outro SC24 menggunakan fade berurutan agar teks tidak bertumpuk. |
| Font tergantung mesin | Archivo lokal disertakan dalam project. |
| Render mengekstrak ulang HTML v3 | Script memakai master v5; render tidak membangun ulang project yang sudah ada. |
| Render tertahan 10 dtk/frame | Elemen `<video>` kosong di halaman animasi dihilangkan. Hanya SC01 yang memuat video. Ini mencegah timeout `mediaShown()` di timeline OpenFilm. |

## Verifikasi yang sudah dijalankan

- **24/24 batas awal scene cocok** dengan DOCX asli. Seluruh 10 jeda ditutup dengan hold. Akhir film cocok dengan durasi aktual VO, 434,991 detik.
- Audit gambar: 72 frame dari 24 scene ditinjau; detail SC10, SC13, SC14, SC19 ditinjau lagi setelah perapian.
- Pemeriksaan integrasi terbaru: **896 titik waktu**, interval 0,5 detik ditambah titik batas khusus. Tidak ada teks keluar kanvas, dokumen terpotong, teks saling tumpang tindih, atau error host/page pada sampel.
- Uji kontinuitas: pilar tengah hilang pada akhir SC02 dan awal SC03; SC13 tetap mempunyai tujuh node pada cut.
- Uji diagram: tujuh node pada SC12; ring konstitusi pada SC13; dua calon dan 60 sel kalender pada SC14.
- Uji fase mobil: pendingin belum terlihat pada lokal 6,99 dtk, mulai berkembang setelah lokal 7 dtk / global 4:58.
- Uji performa media: semua scene bebas elemen video tanpa sumber yang membuat ekspor menunggu timeout.
- Uji negatif preflight: menggeser SC19 kembali ke 5:10 ditolak.
- Hash VO/source diperiksa; checksum project disimpan bersama hasil verifikasi.

Bukti mesin berada di `editorial-engine/deliverables/gibran-mundur-2026/audit-v5/`:
`timestamp-audit.json`, `verification.json`, `scene-inspection.json`, contact sheet dan capture detail.
`verification.json` juga mencatat bahwa sinkronisasi per frasa belum dinyatakan terverifikasi.

## Klip uji perpindahan scene

`gibran-master-v5-fixes-review-52s.mp4` adalah **montage uji 52 detik** dari master yang sama:

- 0:14–0:29: pilar hilang, cut SC02–03, dan redistribusi beban.
- 0:58–1:02: gerak dokumen utuh menuju penerima.
- 3:15–3:27: jaringan tujuh entitas dipertahankan saat masuk SC13.
- 4:55–5:16: penggantian komponen, fase pendingin, hold 5:10–5:11, lalu cut SC18–19.

VO memakai rentang asli yang sama, tanpa regenerasi. Lompatan antarbagian montage
memang disengaja; ini bukan potongan narasi yang berkesinambungan dari awal sampai akhir.
Master penuh tetap 7:14,991. Klip uji tidak boleh disebut sebagai MP4 penuh.

Hasil ekspor uji: **1920×1080, 30 fps, 1.560 frame, 52 detik, H.264 + AAC**,
4.357.210 byte. Google Chrome lokal, satu worker, 311,3 detik render.
Audio hasil normalisasi terukur -16,3 LUFS / -1,7 dBTP.
Decode seluruh MP4 selesai tanpa error. Pemeriksaan empat tepi frame pada empat
titik waktu lolos. `openfilm look --full` memeriksa seluruh frame dan tidak
mendeteksi white flash, jumping frame, still picture, atau black frame.
Contact sheet hasil MP4 juga telah dilihat, bukan hanya gambar source.

Pemeriksaan ulang `--prepare` menghasilkan checksum project yang sama dengan
project yang lolos 896 sampel. Uji negatif juga memastikan elemen video kosong
yang disisipkan kembali pada SC04 ditolak preflight.

## Memakai master revisi

```sh
# Memperbarui project dari source ini; tidak merender.
bash scripts/render-gibran-openfilm.sh --prepare
# Membuka 24 scene di OpenFilm Studio, memakai Google Chrome lokal.
bash scripts/render-gibran-openfilm.sh --open
# Render MP4 penuh dan pemeriksaan seluruh frame.
bash scripts/render-gibran-openfilm.sh --render
```

Default render satu worker; Chrome GUI tersedia. `OPENFILM_HEADED=0` memakai
Google Chrome lokal yang sama di latar. Jangan menutup jendela otomatis saat
memilih mode GUI. Paket OpenFilm dan FFmpeg portabel yang sudah diunduh pada
mesin ini disimpan di `.scratch/openfilm/`, sehingga tidak bergantung pada `/tmp`.

## Batas hasil

Penutupan gap audit berarti kesalahan interval, clipping, kontinuitas, aksi yang
hilang, dan pengulangan diagram utama sudah diperbaiki. Hasil teknis tidak
membuktikan kualitas kreatif akhir secara otomatis. Cue di dalam sebagian besar
scene masih mengikuti rentang dan urutan narasi DOCX, belum hasil alignment
setiap frasa/kata pada rekaman. Listen-through akhir, subtitle dan sound design
final, serta verifikasi editorial/fakta tetap terpisah. Tidak ada publikasi.
