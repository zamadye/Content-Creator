# content-production

Studio produksi horor found-footage berbahasa Indonesia untuk YouTube Shorts dan
Facebook Reels. Repo ini sekarang **hanya menyimpan alur kerja** — kode, aturan,
dan satu episode acuan. Video hasil render hidup di Google Drive.

## Di mana apa

| Kebutuhan | Tempat |
|---|---|
| Cara kerja + perintah | [`the-last-signal/README.md`](the-last-signal/README.md) |
| Aturan main (visual, audio, tulisan, distribusi) | [`the-last-signal/knowledge/`](the-last-signal/knowledge/README.md) |
| Arsip video | Google Drive → `THE LAST SIGNAL/01 Pratinjau`, `02 Arsip` |
| Episode aktif | `the-last-signal/projects/episodes/LS-0010/` |

## Aturan repo yang berlaku sekarang

1. **Tidak ada video terbit di repo.** Setelah unggahan sukses, berkas media
   dihapus dari repo dan diarsipkan di Drive (`knowledge/drive.md`).
2. **Tidak ada gambar episode lama di repo.** Hanya episode yang sedang
   dikerjakan yang menyimpan gambar, audio, dan overlay.
3. **Satu episode acuan.** `LS-0010` adalah benchmark desain v1; episode baru
   dimulai dari `design.json` miliknya, bukan dari template kosong.
4. **Judul, deskripsi, dan komentar tidak boleh memuat label arsip atau
   kalimat pengungkapan.** `scripts/check-copy.mjs` menolaknya sebagai error;
   pengungkapan konten sintetis dikirim sebagai flag platform.
