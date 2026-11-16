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

## Modul lingkungan dan stage berbasis aset (draft)

`src/asset-catalog.js` mendaftarkan tiga modul glTF: `road-straight-v1` (4 × 0,1 × 10 m), `wall-plain-v1` (4 × 3 × 0,2 m), dan `wall-door-v1` (4 × 3 × 0,2 m; bukaan 2 × 2,2 m). Titik origin horizontal ada di tengah dan di ketinggian tanah; jalan memiliki permukaan y=0. Mesh dan materialnya masih draft: repetisi tekstur dan model dinding sederhana belum memenuhi gerbang final. Lihat `public/library/PROVENANCE.md`, termasuk kewajiban memverifikasi asal peta. Semua dependensi glTF ada di `public/library` dan `public/pbr`.

Komposisi `ModularStage` merupakan prototipe terpisah yang menempatkan instance aset katalog dengan `position` dalam meter, `rotationY` dalam radian dan `scale` positif, serta gerak kamera linear. Contoh dan formatnya di `stories/modular-stage.json`. Tidak ada karakter, animasi rig, narasi, efek atau sistem multi-shot di komposisi ini; belum terhubung ke `ManifestStory`. Dengan modul ini agent dapat menyusun lingkungan sederhana, belum dapat membuat film lengkap secara data-driven.

```bash
node scripts/test-modular-assets.mjs
npx remotion render src/index.jsx ModularStage render/modular-stage.mp4 --props=stories/modular-stage.json
```

Generator mesh yang dapat diulang: `python3 scripts/build-modular-assets.py` (Python hanya dibutuhkan untuk membangun ulang mesh, bukan untuk render). Tes memeriksa schema, dependensi, material dasar dan glTF Validator; ini tidak menggantikan QC visual/anatomi maupun verifikasi lisensi. `status: draft` bukan persetujuan distribusi.
