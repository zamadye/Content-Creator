# Riset pertumbuhan — apa yang benar-benar menentukan sebuah Short

Bukan rangkuman tips. Hanya yang bisa diukur pada kanal ini dan dipakai untuk
memutuskan perubahan berikutnya.

Sumber utama: studi Paddy Galloway atas 3,3 miliar Shorts yang dirangkum
beberapa tulisan industri (2026), plus dokumentasi metrik YouTube Studio.

## Satu angka yang menentukan segalanya: VVSA

**Viewed vs Swiped Away (VVSA)** = persentase orang yang menonton tanpa
langsung menggeser. Ambang yang dipakai industri:

| VVSA | Yang terjadi |
|---|---|
| 70–90% | distribusi terbaik |
| 60–70% | jangkauan sedang, pertumbuhan tertahan |
| < 60% | distribusi ditarik, video dikubur |
| < 50% | dianggap hook-nya rusak |

Untuk kanal ini, itu berarti: **satu kalimat pertama yang gagal = episode
sekuat apa pun sesudahnya tidak pernah ditonton.** Semua kerja visual baru
bernilai kalau 3 detik pertama menahan orang.

Metrik pendamping yang wajib diambil bersama VVSA: persentase ditonton,
durasi tonton rata-rata, dan titik jatuh pada kurva retensi (biasanya 0–3 s
atau di tengah).

## Apa yang secara khusus mematikan 3 detik pertama

1. Kalimat pembuka yang menjelaskan ("Dalam video ini…", "Bayangkan…" diulang
   setiap episode). Penonton sudah tahu polanya sebelum cerita mulai.
2. Diam di awal: tidak ada suara, tidak ada gerak, hanya zoom lambat pada
   gambar statis. Sistem membaca tidak ada aksi sebagai sinyal negatif.
3. Musik atau intro sebelum kata pertama. Kata pertama harus bunyi sebelum
   detik pertama habis.
4. Janji yang tidak dibayar. Hook boleh liar, tetapi harus benar di dalam
   cerita — kalau tidak, penonton yang bertahan akan pergi di detik ke-20,
   dan itu merusak retensi lebih dalam daripada hook lemah.

## Yang sesuai dengan mesin yang sudah ada

| Temuan | Keputusan produksi di kanal ini |
|---|---|
| Kata pertama harus bunyi < 1 s | `align-narration --lead-in 4` (frame) = 0,13 s. Dipertahankan. |
| Frame pertama harus membawa klaim | `publishing.thumbnail` digambar di frame 0 (kartu 12 frame). Sudah berjalan. |
| Tidak boleh ada gerak lambat di awal | kamera scene-01 selalu punya gerak (push_in/handheld), bukan statis. |
| Rewatch menaikkan tayangan | akhir cerita LS-0006 dan LS-0010 berbentuk loop; layak diuji lebih jauh. |
| Panjang ideal 40–60 s | semua episode 43–49 s. Tidak diubah. |

## Eksperimen yang dijalankan sekarang

Aturan pemilik kanal: satu atau dua variabel saja, dan hanya menyimpulkan
setelah beberapa video.

**E1 — Pola hook (sedang berjalan, LS-0005 → LS-0008)**
Variabel: *jenis klaim pembuka*. Tetap: durasi, jumlah scene, suara, musik,
gaya visual.

| Episode | Pola hook | Kalimat |
|---|---|---|
| LS-0005 | konsekuensi + waktu mustahil | "Video mereka baru diunggah besok pagi." |
| LS-0006 | angka + identitas | "Mobil hitam itu masuk lima kali malam ini." |
| LS-0007 | aturan dilanggar (benda) | "Ruangan yang tidak ada di denah." |
| LS-0008 | bukti yang bicara sendiri | "Radionya masih memanggil setiap malam." |

Yang dibandingkan: VVSA dan persentase ditonton. Bukan jumlah tayangan —
tayangan dipengaruhi jam unggah dan antrean.

**E2 — Loop (belum dijalankan)**
Variabel: akhir cerita yang menyambung ke kalimat pertama (LS-0006, LS-0010)
dibandingkan akhir yang menutup (LS-0007). Ukur *replay rate* bila tersedia,
atau persentase ditonton > 100% sebagai tanda tonton ulang.

## Batas kejujuran

- Analitik baru bisa ditarik setelah kuota YouTube Analytics pulih; sampai itu
  terjadi tidak ada satu pun angka di atas yang diklaim sebagai hasil.
- Satu video tidak membuktikan apa pun. Kesimpulan hanya ditulis setelah ≥3
  episode dengan pola yang sama.
