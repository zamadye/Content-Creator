# Facebook — jalur terpisah dari YouTube

Arahan pemilik kanal: **khusus Facebook, saya boleh bertindak sebagai
admin/director yang membuat post** — bukan hanya Reel, tapi juga post caption
biasa dengan **1–2 foto atau slideshow**. Izin format foto/slideshow ini hanya
untuk feed post statis, bukan video/Reel yang dimaksudkan untuk monetisasi.
Arahan terbaru pemilik kanal: semua video sekarang dan ke depan harus memakai
footage/animasi dengan gerak subjek yang nyata; jangan mengemas foto diam
menjadi video slideshow dengan pan/zoom/efek. Facebook menyatakan format video
foto-statis itu tidak dimonetisasi; kebijakan YouTube belum dipastikan.

## Kenapa dua jalur, bukan satu

| | YouTube Shorts | Facebook Page |
|---|---|---|
| Bentuk | video 9:16, 40–60 s | teks + 0–10 foto (feed post) |
| Jendela keputusan | 2 detik pertama, kalau geser = hilang | baris pertama caption, sisanya dibuka sendiri |
| Yang dinilai | retensi & replay | komentar, bagikan, waktu berhenti membaca |
| Cerita | dipecah jadi beat 2–4 detik | ditulis utuh; paragraf pendek, satu gagasan per baris |
| CTA | pertanyaan diucapkan di detik terakhir | pertanyaan di kalimat penutup caption |

Konsekuensinya: **naskah Short tidak boleh ditempel apa adanya ke Facebook.**
Reel butuh kalimat yang dibaca cepat; post FB butuh kalimat yang enak dibaca
diam-diam. Yang dipakai ulang adalah *ceritanya*, bukan *irama kalimatnya*.

## Aturan post Facebook

1. **Baris pertama = hook** dan harus bisa berdiri sendiri. Facebook memotong
   caption setelah ±125 karakter ("Lihat selengkapnya"), jadi klaimnya harus
   sudah mendarat sebelum potongan itu.
2. **Satu gagasan per paragraf**, maksimal 2 kalimat. Tidak ada paragraf
   pembuka basa-basi — pembaca feed tidak memberi waktu.
3. **Panjang ideal 600–1.200 karakter.** Di bawah 400 tidak ada cerita; di atas
   1.500 orang berhenti sebelum kalimat penutup.
4. **Penutup = pertanyaan** yang bisa dijawab singkat di komentar. Pertanyaan
   harus tentang keputusan penonton, bukan tentang pendapat penonton soal cerita.
5. **1 foto kalau ceritanya satu objek; 2 foto kalau ceritanya perbandingan**
   (karcis vs sandaran kepala, sebelum vs sesudah). 3+ hanya kalau memang
   urutan bukti, dan maksimal 10 (batas Facebook).
6. **Jangan pakai hashtag.** Feed Facebook bukan mesin pencari; hashtag membuat
   post terlihat seperti iklan.
7. **Komentar pertama ditulis per post**, bukan templat. Komentar yang
   mengulang caption persis membuat post terasa dicetak dari berkas.
8. Foto vertikal 1080×1920 boleh; Facebook memotongnya jadi 4:5 di feed, jadi
   objek penting harus di tengah, bukan di tepi.

## Cara menerbitkan

```
the-last-signal/fb-posts/<ID>.json      # berkas rencana
the-last-signal/tools/publish/zernio-fb-post.mjs
.github/workflows/zernio-fb.yml          # pemicu: perubahan fb-posts/*.json
```

- `status: "held"` → tidak dijalankan. Ubah ke `"requested"` untuk menerbitkan.
- Tanpa `scheduledFor` → terbit saat itu juga. Dengan `scheduledFor` (WITA) →
  Zernio yang menayangkan, repo tidak perlu cron.
- Bentuk: `kind: "text" | "photo" | "carousel"`.
- Skrip memeriksa caption (≤63.206 karakter), jumlah foto, ukuran (≤10 MB),
  dan format (jpg/png) **sebelum** ada byte yang diunggah.

## Post yang sudah dipakai

| ID | Bentuk | Isi | Jadwal |
|---|---|---|---|
| FB-0001 | 1 foto | cerita LS-0015 utuh sebagai teks; foto = rekaman CCTV | 8 Nov 19.05 WITA |
| FB-0002 | 2 foto | "dua benda ini tidak seharusnya ada di mobil yang sama" | 9 Nov 07.35 WITA |

Slot mengikuti aturan tayang yang sama: **pagi · siang · malam**, dan satu post
tidak boleh menabrak post lain di slot yang sama.
