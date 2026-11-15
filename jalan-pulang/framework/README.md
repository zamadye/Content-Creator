# Story framework v0.1 — adaptor awal

Baca `ROADMAP.md` untuk urutan pekerjaan dan kriteria mutu. Lapisan ini memungkinkan membuat **blocking** cerita alternatif dengan kombinasi shot Jalan Pulang yang sudah ada, bukan editor aset bebas atau framework produksi yang sudah lengkap. Karakter, setting, aksi, sebagian kamera dan timing internal masih tertanam di komponen lama. Aset baru yang diminta belum dibuat. Konten Jalan Pulang lama tidak dimigrasikan dan perintah render lama tetap bekerja.

## Kontrak manifest

Contoh `stories/example.json`: `version` harus 1; `id` lowercase/hyphen; `fps` 30; `width` dan `height` positif genap; `shots` berurutan dan rapat dari frame 0. `from` inklusif, `duration` bilangan bulat positif dalam frame; total adalah akhir shot terakhir. `type` salah satu registry `src/shot-registry.js`; parameter opsional `view` hanya pada `ride` (lihat registry). `audio`, jika disediakan, berisi `src` relatif terhadap `public/`, `from` dan `duration` frame. Semua track audio harus berada di dalam cerita; file harus disediakan pengguna dan tidak disimpan otomatis. Tidak ada audio jika `audio` dihilangkan. Cut bersifat hard cut; efek dan transisi belum didukung.

Untuk cerita baru salin contoh, ubah shot/timing, lalu validasi dan render menggunakan Remotion props. Render ID `ManifestStory` menghitung dimensi dan durasi dari manifest. Contoh:

```bash
cd jalan-pulang
npm ci
node scripts/validate-story.mjs stories/example.json
# Browser/driver harus tersedia; untuk opsi Chromium dan software lihat RENDER-LOKAL.md
npx remotion render src/index.jsx ManifestStory render/example.mp4 --props=stories/example.json
```

Remotion `--props` mengharapkan objek props; file contoh membungkus manifest dalam `{ "story": ... }`. Untuk `--browser-executable` dan SwiftShader, gunakan opsi yang dijelaskan `RENDER-LOKAL.md`. Periksa hasil dan izin aset sebelum distribusi. Jika menambahkan audio, letakkan file di `public/` dan jangan gunakan path absolut atau traversal. Validator CLI mengecek keberadaan file lokal, bukan kualitas audio atau hak pakai.

### Menambah jenis shot

Edit `SHOT_TYPES` pada `src/shot-registry.js` dan switch `Shot` pada `src/story-assembly.jsx`, lalu tambahkan test. `from` pada adaptor diteruskan sebagai detik agar kompatibel dengan shot lama; nilai itu dapat memicu perilaku khusus Jalan Pulang. Variasi ini tidak berarti model dapat dipilih secara mandiri. Untuk migrasi ke asset registry dan tindakan bebas ikuti roadmap, jangan ubah arti format v1 diam-diam.

Untuk agent: mulai dengan roadmap dan kontrak ini, jalankan `node scripts/test-manifest.mjs`, jangan mendeklarasikan aset final hanya karena file berhasil dimuat. Source of truth lisensi adalah provenance per aset, bukan nama kategori.
