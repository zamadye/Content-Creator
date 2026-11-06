# stories/

Naskah mentah untuk episode yang **belum** diproduksi. Tidak ada arsip di sini:
begitu sebuah episode dirender, isi ceritanya sudah hidup di
`projects/episodes/<id>/episode.json` dan teks aslinya tidak perlu disimpan dua kali.

Alur pembuatan episode:

```bash
node scripts/new-episode.ts --id LS-0011 --title "Kamar 307"   # scaffold + episode.json
node scripts/build-episode.mjs --story LS-0011 --slate stories/slate.json
```

Kedua perintah sengaja menuntut berkas dimasukkan lewat argumen; repo ini tidak
menyimpan daftar episode lama, jadi tidak ada "slate" besar yang harus dirawat.
