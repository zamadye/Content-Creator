# Strategi animasi video 2.5D tanpa footage

Arahan pemilik kanal: video sekarang dan ke depan **tidak boleh memakai foto diam
sebagai visual timeline**, termasuk slideshow, still dengan pan/zoom, parallax,
grain, partikel, atau transisi. Animasi boleh berupa 2.5D/3D dengan aksi subjek
atau objek yang terlihat. Still hanya untuk thumbnail terpisah. Untuk Facebook,
pemilik kanal melaporkan bahwa video foto-statis tidak dimonetisasi; status
YouTube belum dipastikan.

## Pipeline multi-tool yang diusulkan

Gunakan beberapa alat dengan tanggung jawab yang jelas, bukan satu alat untuk
semua hal dan bukan menambah dependensi tanpa proof:

1. **Asset sumber — model dan material PBR berlisensi jelas.** Ambil GLB/glTF
   bertekstur/rigged dari perpustakaan yang mengizinkan penggunaan sesuai kanal.
   Kenney bagus untuk placeholder, blocking, dan props game sederhana; gaya
   umumnya stylized/low-poly, bukan sumber utama untuk photoreal. Repo starter
   Kenney di GitHub yang dicek berlisensi MIT dan tidak punya GitHub Releases;
   lisensi kode repo tidak otomatis menggantikan lisensi per aset. Poly Haven
   dan ambientCG adalah kandidat katalog aset CC0 (model, material PBR, HDRI),
   tetapi bukan paket npm/pypi. Unduh hanya dari sumber resmi dan rekam lisensi,
   URL, versi, serta atribusi jika diperlukan. Jangan anggap mirror GitHub
   sebagai sumber resmi.
2. **Scene/asset authoring — Blender, jika tersedia di mesin produksi.** Untuk
   merakit stage, menyiapkan/menyesuaikan rig, material, pencahayaan, kamera,
   dan depth pass. Blender tidak ditemukan di environment repo saat dicek, jadi
   belum bisa diandalkan untuk render lokal di sini. Output yang diharapkan:
   GLB/glTF animated atau image sequence dari adegan yang benar-benar dianimasi;
   bukan still yang sekadar digerakkan kameranya.
3. **Scene 2.5D dan animasi — Three.js + `@remotion/three` bila asset GLB cukup.**
   Import model PBR, susun beberapa bidang kedalaman, gerakkan karakter/objek,
   kamera, lampu, dan fog dengan koordinat waktu Remotion. Ini pilihan langsung
   dalam pipeline saat ini dan menghindari framework editor tambahan. Three.js
   dan `@remotion/three` berlisensi MIT; versi registry yang dicek 0.187.0 dan
   4.0.540, selaras dengan Remotion 4.0.540 di repo.
4. **Editing/output — Remotion yang sudah ada.** Tetap gunakan untuk timeline,
   potongan scene, transisi, teks/hook, subtitle, audio, dan render akhir.
   Lisensi Remotion 4.0.540 bersifat custom (bukan MIT): lisensi terpasang
   mengizinkan penggunaan gratis untuk individu dan organisasi kecil sampai 3
   pegawai dengan syarat tertentu. Pastikan kelayakan sebelum produksi kanal.
5. **Optimasi aset — glTF Transform opsional.** `@gltf-transform/core` (MIT,
   versi dicek 4.5.1) dapat membantu memeriksa/menyiapkan asset glTF; bukan
   pembuat model atau pengganti inspeksi visual. `gltf-validator` (Apache-2.0)
   dapat menjadi pemeriksaan format tambahan.

**Alternatif authoring, bukan kewajiban:** Motion Canvas 2D (`@motion-canvas/core`,
`@motion-canvas/2d`, MIT; 3.17.2 saat dicek) cocok untuk grafis/rig vektor 2D
orisinil. Gunakan hanya untuk beat yang memang lebih kuat sebagai ilustrasi
stylized; bukan pipeline utama jika targetnya 2.5D dengan model PBR. PixiJS 8.23.0
(MIT) dan runtime Rive/Lottie tidak dipilih untuk awal karena menambah tumpukan
renderer/authoring tanpa keuntungan yang sudah dibuktikan.

## Standar aset dan rupa

- Untuk hasil realistis, cari **mesh 3D dengan tekstur PBR**, bukan hanya bentuk
  geometris/procedural: minimal base color/albedo, normal, roughness; metallic,
  opacity, displacement, atau ambient occlusion jika material memang perlu.
  Pastikan tekstur disertakan dan UV/material valid.
- Material PBR saja tidak membuat hasil otomatis photoreal. Skala, proporsi,
  tekstur, kualitas mesh, shader, pencahayaan, color management, dan HDRI harus
  serasi. Pohon butuh siluet/daun/batang yang baik; material daun transparan
  atau dua sisi dan gerak angin halus boleh mendukung, tetapi gerakan subjek
  cerita harus tetap jelas.
- Simpan satu asset library berulang (karakter, pakaian, rumah/lorong, props,
  tekstur, lighting presets) dan pakai kembali untuk kontinuitas. Catat asset
  ID, sumber URL, lisensi, perubahan, material, rig/animasi, dan checksum di
  manifest proyek. Hindari paket campuran lisensi yang tidak diketahui.
- Kenney cocok sebagai proxy untuk staging dan blocking selama proof, bukan
  otomatis sebagai final untuk target realistis. Jangan masukkan asset biner
  besar ke Git tanpa perlu; ikuti konvensi penyimpanan/ignore repo.

## Uji produksi bertahap

1. Buat satu shot uji non-rilis: lorong gelap dengan pohon/objek bertekstur PBR
   sebagai foreground, midground, dan background; kamera bergerak seperlunya.
   Tambahkan sekurangnya satu aksi nyata yang terlihat—misalnya ranting bergoyang
   karena angin atau pintu yang bergerak—serta karakter/objek beranimasi bila
   beat memerlukannya. Depth/parallax sendiri tidak cukup.
2. Import GLB ke Three.js/`@remotion/three`; animasikan dengan frame-time supaya
   hasil deterministic, lalu gunakan Remotion untuk cut, transisi, teks, audio,
   subtitle, dan render. Bila tiga dimensi penuh terlalu mahal, pakai 2.5D:
   mesh/plane pada beberapa jarak dan gerak independen yang masih punya volume,
   shading, serta aksi subjek—bukan still-photo layers.
3. Bandingkan dengan shot berbasis Motion Canvas hanya jika dibutuhkan; evaluasi
   konsistensi visual, waktu pengerjaan/render, kestabilan karakter, dan lisensi.
   Pilih kombinasi minimum yang lolos, bukan sekadar jumlah tools terbanyak.
4. Arsipkan manifest asset dan konfigurasi shot agar lokasi, model, pencahayaan,
   karakter, dan warna konsisten di seluruh episode.

## Gerbang mutu

1. Tonton pada kecepatan normal: aksi utama subjek/objek terbaca tanpa bergantung
   pada zoom, grain, partikel, atau transisi.
2. Periksa frame berurutan: tidak ada frame beku atau pengulangan diam untuk
   mengisi durasi; kamera/parallax bukan satu-satunya sumber gerak.
3. Pastikan siluet/proporsi, pakaian, material, skala, lighting, dan palette
   konsisten antarshot.
4. Pastikan tiap gerakan menyampaikan beat cerita; hindari gerak acak.
5. LS-0020 versi lama tetap ditolak dan tidak boleh digunakan ulang. Revisi 01
   telah disetujui untuk produksi penuh; aset/render baru harus mengikuti pipeline
   2.5D/3D dan gerak subjek nyata yang dijelaskan di dokumen ini.
