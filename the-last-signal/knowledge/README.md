# Content Performance Knowledge Base

Tiga file, tiga fungsi. Semua ditulis oleh mesin, dibaca oleh mesin dan manusia.
Tidak ada angka yang dikarang di sini: setiap nilai berasal dari episode.json,
laporan QC, respons API Zernio, atau analytics YouTube yang benar-benar diambil.

| File | Isi | Ditulis oleh |
| --- | --- | --- |
| `episodes.jsonl` | satu baris per episode: keputusan cerita, timing, visual, audio, QC, hasil publikasi, analytics | `scripts/kb-record.mjs` |
| `insights.md` | pelajaran yang sudah terbukti lintas episode (angka + sebab) | tangan, setelah evaluasi |
| `experiments.md` | daftar eksperimen per episode: variabel yang diubah, hipotesis, hasil | tangan, sebelum & sesudah produksi |

## Kenapa JSONL, bukan database

Phase 1 tidak memakai Postgres (lihat blueprint). JSONL cukup karena:

- append/ubah per episode tanpa menulis ulang seluruh file,
- bisa di-`grep` dan di-`jq` tanpa tool tambahan,
- setiap perubahan tercatat di riwayat git, jadi keputusan produksi punya jejak waktu.

Naik ke Postgres/SQLite baru masuk akal setelah ada analytics per video yang
jumlahnya puluhan dan butuh query lintas kolom.

## Cara agent memakainya

**Story Agent** — sebelum menulis naskah, baca `insights.md` bagian *Hook* dan
*Struktur*. Jangan mengulang struktur yang sudah dipakai dua episode terakhir
kecuali eksperimennya sengaja diulang.

**Director Agent** — baca `experiments.md` untuk variabel yang sedang diuji
(kamera, lighting, panjang shot). Satu episode = satu variabel utama, bukan lima.

**Editor Agent** — baca `episodes.jsonl` kolom `timing.average_shot_seconds` dan
`timing.jumpscares`. Rata-rata shot di atas 3 detik = risiko terasa slideshow.

**QC Agent** — bandingkan episode baru dengan `qc` episode terakhir. Kalau
loudness, true peak, atau ukuran file keluar dari rentang yang sudah terbukti,
tolak sebelum render penuh.

## Aturan penulisan

1. **Angka, bukan kesan.** "Loudness −14,7 LUFS" bukan "audionya bagus".
2. **Satu sebab per pelajaran.** Kalau dua hal berubah bersamaan, hasilnya tidak
   bisa dipelajari — catat sebagai eksperimen bercabang, bukan kesimpulan.
3. **Jangan hapus kegagalan.** Baris `errors` yang menyakitkan justru yang
   mencegah pengulangan.
