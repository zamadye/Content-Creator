# Roadmap studio cerita 3D bersama

Tujuan: pustaka aset dan runtime yang bisa dipakai manusia maupun agent untuk membuat cerita berbeda tanpa menulis ulang seluruh proyek. Dikerjakan **berurutan**; jangan sebut sebuah aset siap produksi sebelum lolos gerbang di bawah. Implementasi pertama baru berupa kerangka story manifest dan adaptor shot lama — bukan katalog aset lengkap.

## 1. Kontrak dan fondasi (mulai sekarang)
- Pertahankan render Jalan Pulang agar tidak rusak. Definisikan story manifest berbasis frame, registry, validasi, contoh cerita kedua dan tes; simpan kontrak stabil bagi agent.
- Buat katalog aset berversi: ID stabil, kategori/varian, path GLB/glTF dan semua dependensi, satuan/skala, asal, lisensi, persyaratan atribusi, status QC, thumbnail, maps, rig/aksi dan batasan. Jangan menganggap semua aset yang sudah ada telah lolos lisensi atau kualitas.
- Pisahkan asset loader, manajemen cache/disposal, scene graph, staging, pencahayaan, kamera, animasi, timeline dan audio dari cerita. Gunakan seed untuk variasi deterministik. Migrasikan bertahap dengan tes regresi Jalan Pulang.
- **Gerbang:** manifest salah gagal dengan pesan jelas; cerita contoh dapat dirender di clone bersih; karya lama tidak berubah; kontrak dan dependensi terdokumentasi.

## 2. Karakter manusia dan anatomi wajah (prioritas aset pertama)
- Base modular manusia dewasa pria dan wanita dengan variasi usia muda/dewasa/lansia, bentuk wajah, warna kulit, rambut, pakaian dan prop; variasi terjaga identitasnya antar shot, bukan hanya warna material.
- Perbaiki proporsi tengkorak/rahang, kelopak dan mata, hidung, bibir, telinga, gigi, rambut, UV dan deformasi. Close-up harus jelas dalam pencahayaan malam; eye line, kedipan dan ekspresi diuji. Dimas saat ini masih prototipe dan tidak mewakili kualitas final.
- Rig humanoid berversi dengan nama tulang konsisten, rest pose, skin weights, ukuran dunia, kontrol wajah/blendshape (termasuk kedipan dan viseme), IK tangan/kaki, animasi idle/jalan/duduk/bicara/naik motor. Sediakan retargeting dan dokumentasikan keterbatasannya.
- **Gerbang:** GLB/glTF tertekstur dan tervalidasi, deformasi di pose ekstrem dan walk cycle tidak menembus pakaian, wajah terbaca dalam close-up, lisensi dan asal per komponen terverifikasi.

## 3. Entitas/hantu
- Variasi siluet manusia menyeramkan, sosok pucat, bayangan dan sosok duduk/berdiri; mesh, bahan dan identitas visual berbeda, bukan hanya recolor. Rig tubuh/wajah berbagi kontrak manusia bila memungkinkan; aksi diam, mendekat, menoleh, muncul/hilang dan ekspresi.
- **Gerbang:** uji siluet serta wajah pada jarak dekat/jauh tanpa kabut, deformasi dan penempatan, tidak bergantung pada cerita tertentu.

## 4. Rumah dan interior modular
- Rumah kampung sederhana, rumah tua, kos, warung dan pabrik/gudang; modul dinding, atap, lantai, pintu/jendela yang bisa dibuka, teras, furnitur dan variasi kondisi bersih/usang. Skala pintu/manusia konsisten.
- **Gerbang:** modul snap pada grid, interior/eksterior dapat diakses kamera, collision/occlusion teruji, PBR dan lisensi tiap komponen diverifikasi.

## 5. Alam, jalan dan kendaraan
- Pohon tropis termasuk beringin dan karet, semak, rumput, variasi usia dan LOD; ruas jalan lurus/tikungan/percabangan, aspal kering/basah, marka, trotoar, rambu dan tiang. Kendaraan dan motor proporsional dengan roda/lampu serta titik duduk dan pegangan.
- **Gerbang:** tiling tidak mencolok, seam jalan dan skala benar, performa pada set ramai, rig/IK kendaraan diuji. Motor yang ada bersifat generik, bukan model Supra akurat.

## 6. Sistem penceritaan umum
- Per-instance aset/varian, transform dan hierarchical attachment; aksi bertiming, kamera target/gerak, lampu, environment, efek, VO dan cue suara, transisi, subtitle aman 16:9/9:16. Hindari aksi bergantung pada nama tokoh atau detik cerita tertentu.
- Skema dan validator untuk referensi, rentang, asset availability/licensing, kamera, animasi, audio dan konflik; renderer memilih shot dengan durasi frame eksplisit. CLI membuat proyek baru, preflight, render parsial/full/resume, kredit dan laporan QA.
- **Gerbang:** agent lain bisa membuat cerita berbeda hanya dengan manifest + aset yang disetujui, dan render reproduktif di clone bersih. Adaptor shot lama saat ini belum memenuhi gerbang ini karena shot masih hard-coded.

## 7. QA, distribusi dan operasional
- CI: unit tests, validasi manifest/katalog, pemeriksaan eksternal dependency GLTF dan material, smoke render deterministik, golden image toleransi, tes lisensi; uji GPU/software dan penggunaan memori. Dokumentasi operasi, contoh, versi skema, migrasi, troubleshooting dan package aset di luar Git jika ukuran meningkat.
- QC manusia: anatomi, tekstur, pose, clipping, visual dan sinkronisasi suara seluruh video; dokumentasikan perbedaan visual antar renderer dan riwayat perubahan. Publikasi hanya jika izin semua sumber dikonfirmasi.

## Standar penerimaan aset GLB/glTF
- Geometry nyata, proporsi dan normals/tangent benar, UV tanpa distorsi mencolok; material **metallic-roughness PBR**, base color berwarna (sRGB), normal dan roughness (linear); metallic/AO bila relevan. Bahan seperti kain/kulit bukan logam. Tekstur harus cocok aset dan terlihat realistis, bukan sekadar faktor warna atau prosedural placeholder. Tidak semua bahan membutuhkan setiap map, tetapi pengecualian harus tercatat.
- Tekstur embedded di GLB atau semua file relatif glTF disertakan; tak boleh path absolut/hilang, transparansi dan double-sided hanya bila diperlukan. Buka ulang pada viewer/runtime target, uji dekat/jauh, kondisi cahaya berbeda, UV seam serta skalanya.
- Karakter: skeleton, weights, inverse bind matrices, pose rest, nama tulang dan klip terdokumentasi; cek morf wajah bila ada, bentuk saat deformasi dan pakaian. Lakukan automated glTF validation **dan** review visual, karena validasi format tidak membuktikan realisme.
- Setiap aset ada provenance yang dapat ditelusuri, lisensi terverifikasi dan kredit; status `draft`, `review` atau `approved`, versi, batasan, ukuran dan budget poligon/tekstur. Jangan mencampur aset generatif/CC0/lisensi terbatas tanpa catatan.
