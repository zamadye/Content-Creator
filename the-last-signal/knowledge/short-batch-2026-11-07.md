# Batch Short — 7 November 2026

Tiga Short **cerita baru**, bukan potongan video panjang. Ditulis dengan hukum
`knowledge/NASKAH.md` dan diuji mesin sebelum masuk produksi.

Status: **dalam antrean tayang** (8 Nov 2026). Ketiga berkas ada di
`publish-queue/` dengan status `held`, jadi menyimpannya tidak mengunggah apa pun.
Yang melepas adalah slot otomatis (`tools/publish/publish-slot.mjs`) di dalam
jendela 12.00–18.00 WITA, satu video per slot, jeda 2 jam antar-video.

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
2. Slot harian (`publish-slot.yml`, cron 04:15Z = 12:15 WITA) mengambil satu
   berkas `held` paling lama, melepasnya jadi `requested`, menjalankan gerbang
   QC + unggah, lalu menulis `published` + URL. Gagal → kembali `held`.
3. Jendela 12.00–18.00 WITA, satu video per slot, jeda 2 jam. Jangan menyebut
   tanggal tetap di judul/deskripsi.
4. Catatan: cron GitHub hanya berjalan dari branch default (`main`). Selama
   work branch belum digabung, slot dipicu lewat push ke
   `the-last-signal/.publish-trigger` — runner menunggu sampai jam jendela.
5. Setelah tayang, catat di `knowledge/episodes.jsonl` seperti LL-0002.
