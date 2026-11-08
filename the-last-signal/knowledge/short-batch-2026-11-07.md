# Batch Short — 7 November 2026

Tiga Short **cerita baru**, bukan potongan video panjang. Ditulis dengan hukum
`knowledge/NASKAH.md` dan diuji mesin sebelum masuk produksi.

Status: **terjadwal di Zernio** (8 Nov 2026). Video sudah diunggah ke storage
Zernio dan Zernio yang menayangkan — repo tidak menahan jadwal lagi, dan berkas
di `releases/` boleh hilang tanpa efek.

| Video | Waktu tayang (WITA) | Status di Zernio |
|---|---|---|
| LS-0012 Nomor Tiga Belas | 12.05 | scheduled (`04:05Z`) |
| LS-0013 Lima Menit Sebelum | 13.05 | scheduled (`05:05Z`) |
| LS-0014 Kursi Ketujuh | 15.05 | scheduled (`07:05Z`) |

Catatan: `createPost` menjawab "Post scheduled successfully" tanpa id post, jadi
id kosong di berkas antrean bukan tanda gagal. Sumber kebenaran adalah
`listPosts` lewat `zernio-reconcile.mjs` (baca-saja).

## Daftar

| ID | Judul | Hook | Twist | Durasi | Berkas |
|---|---|---|---|---|---|
| LS-0012 | Nomor Tiga Belas | "Nomor tiga belas tidak ada di gang kami." | Baris ke-13 daftar desa berisi nomor rumah petugas sensusnya sendiri | 50,5 s | `releases/LS-0012.mp4` (3,0 MB) |
| LS-0013 | Lima Menit Sebelum | "Anak saya menangis tiga kali semalam. Saya tidak bangun." | Kameranya bukan telat — ia mendahului lima menit | 40,8 s | `releases/LS-0013.mp4` (2,6 MB) |
| LS-0014 | Kursi Ketujuh | "Ayah selalu menyiapkan tujuh kursi untuk enam orang." | Kursi itu bukan untuk tamu; kursi itu yang menjaga keluarga tetap enam | 50,6 s | `releases/LS-0014.mp4` (3,3 MB) |

Ketiganya 1080×1920 native, 30 fps, H.264 + AAC 48 kHz, ±500 kbps.

## Kenapa ceritanya begitu

- **Hook tiga bentuk berbeda** — penyangkalan kejadian (LS-0012), pengakuan
  bersalah (LS-0013), kebiasaan keluarga yang ganjil (LS-0014). Hukum melarang
  dua episode berurutan memakai bentuk hook yang sama.
- **Belokan cerita sebelum detik 11** — versi pertama ketiganya berbelok di
  detik 13–17 dan ditolak `check-copy.mjs`. Yang diubah urutan scene, bukan
  panjang kalimat.
- **Twist adil** — semua petunjuk sudah terdengar sebelum pengungkapan: dua
  lubang sekrup (LS-0012), "kameranya kadang telat lima menit" (LS-0013),
  gelas yang tinggal separuh dan sepupu yang namanya hilang (LS-0014).
- **Penutup menyentuh hook** dan berisi ajakan; kartu CTA di ekor tiap video.

## LS-0015 — format baru (klimaks di depan), 8 Nov 2026

Short pertama yang memakai hukum `NASKAH.md` § *koreksi 8 Nov: klimaks di depan*:

- 10 beat, 98 kata, 56,9 s tayang, 1080×1920 @ 30fps, −14,2 LUFS / true peak −2,0 dBTP.
- Frame pertama = rekaman CCTV dengan **sosok berambut panjang** keluar dari mobil,
  teks hook besar di atasnya, subtitle 64 px di tengah.
- Frame terakhir = frame pertama (loop fisik); kalimat terakhir membuka arti frame itu.
- Suara: `voice-05`.
- Jadwal Zernio: **9 Nov 2026, 12.05 WITA** (04:05Z), satu video per hari — tidak
  menumpuk dengan 12.05/13.05/15.05 pada 8 Nov.

## Berkas pendamping

- Naskah + peta visual: `stories/shorts/<ID>/` (naskah.md, narration.json,
  visual-map.json, image-prompts.json, plan.json) — dibuat otomatis dari
  `stories/slate.json` oleh `scripts/make-story-files.mjs`.
- Aset: `projects/episodes/<ID>/` (7/6/6 gambar 9:16, narasi, skor, ambience,
  overlay, thumb).
- Suara: LS-0012 `voice-02`, LS-0013 `voice-03`, LS-0014 `voice-04`.

## Cara tayangnya bekerja

1. Berkas antrean ditulis dengan `status: "held"`. Push berkas `held` **tidak**
   mengunggah apa pun — `zernio-publish.mjs` hanya memproses `requested`.
2. Tambahkan baris ke `schedule.json` dengan `scheduledFor` (WITA), lalu push.
   `zernio-schedule.yml` menjalankan QC, mengunggah ke Zernio, dan membuat post
   terjadwal. Satu jalan bisa memuat puluhan video.
3. Jendela 12.00–18.00 WITA, jeda minimal 1 jam. Jangan menyebut tanggal tetap.
4. Setelah tayang, jalankan `.reconcile-trigger` sekali supaya status antrean
   ikut berubah menjadi `published` (skrip hanya membaca, tidak mengunggah).
5. Setelah tayang, catat di `knowledge/episodes.jsonl` seperti LL-0002.
