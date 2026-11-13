# Status fase produksi — Jalan Pulang

## Fase 1 — sumber dan timeline: belum selesai
Transkrip unggahan 00:00–09:03 baru acuan kasar. Dua berkas VO ada, tetapi offset, kecocokan dan akhir setelah 09:03 belum ditranskrip/diverifikasi. Shotlist `SHOTLIST-PRODUKSI.md` mengidentifikasi isi dan gap.

## Fase 2 — rangkaian adegan: sedang dikerjakan, belum selesai
- `StoryBlocking` menyambung 23 blok shot dari 00:00–05:39 ke satu track VO, dengan potongan kira-kira menurut timestamp; banyak isi masih berulang atau belum sesuai aksi. Telah divalidasi tanpa celah/overlap dan frame ponsel, sosok duduk dan berdiri diuji; belum dirender/ditonton utuh atau dicocokkan dengan audio.
- `OpeningAssembly` mencakup 00:00–01:41 dengan audio VO pertama: motor, gudang, motor, kemacetan. Ini **blokout**, bukan adegan final. Gudang dan kemacetan set 3D baru, dengan figur skinned; belum ada aksi mengirim uang, menelepon, berangkat dari rumah, interaksi dengan tukang parkir, atau staging kecelakaan yang benar. Karakter dan pakaian masih perlu fitting. Motor berulang dipakai sementara, bukan penyelesaian shot.
- Jalan, warung, papan dan sosok sudah punya komposisi uji terpisah. Papan basah, sosok berdiri dan kamera masih perlu animasi, fitting dan QC; belum menjadi rangkaian lengkap.
- Bagian 04:16–05:39 baru blocking dari aset uji, dan 05:39–09:03 serta kelanjutan VO belum dibangun menyeluruh. Jangan menganggap timeline lengkap atau adegan final.

## Fase 3 — penyempurnaan: belum selesai
Aksi dan kontinuitas karakter, material, lisensi vegetasi, suara, sinyal/panggilan, compositing dan QC artistik masih tertunda.

## Fase 4 — render dan QC: belum dimulai untuk rangkaian utuh
Render simultan sebelumnya memicu crash/kehabisan sumber daya. Render warung 29 detik yang sedang berjalan dihentikan karena tidak stabil (tidak menghasilkan video final). Jangan jalankan beberapa render WebGL serentak; uji dulu render dalam potongan kecil dan sambungkan hanya setelah lulus QC. Build dan dua frame pembuka diuji; belum ada render video `OpeningAssembly`, belum divalidasi terhadap VO.

## Catatan visual terbaru
- Insert telepon 23:47 dibuat sebagai objek 3D bergerak, tetapi belum berada di tangan Dimas.
- Lapisan material sementara menutupi kulit yang bocor pada torso rig berdiri; pose, tangan, wajah, pakaian serta lambaian belum final.
- Papan dan warung berulang merupakan placeholder; tikungan, muka tersenyum dan interaksi aktual belum lengkap. Seluruh transisi/VO perlu QC.

## Rangkaian 5 menit (00:00–05:00) — render draft
Timeline `StoryBlocking` sudah mencakup 00:00–05:39. `scripts/render-five-minutes.sh` merender 00:00–05:00 menjadi 15 potongan berurutan 20 detik, memeriksa 600 frame tiap potongan, kemudian menggabungkan VO satu kali dan memeriksa 9000 frame. Ini hanya draft 960×540: aset, aksi, sinkronisasi, sound design dan QC belum final. Resolusi internal setengah khusus untuk draft; komposisi lain tetap pada resolusi normal. Frame uji 1 detik berhasil, tetapi seluruh rangkaian belum selesai diverifikasi.

## Sound guide sementara
`scripts/make-ambience.py` menghasilkan ambient sintetis berdasarkan timestamp: mesin, hum gudang, sirene, bohlam, dan nada senandung. Bukan rekaman Foley dan belum dinilai artistik. Guide mix 300 detik sementara di `render/vo-ambience-guide-5min.m4a` (rata-rata −29,5 dBFS, puncak −8,0 dBFS hasil volumedetect; bukan LUFS). Pengukuran ini bukan pengganti pemeriksaan pendengaran. `scripts/apply-guide-audio.sh` siap menambahkan mix ke video **setelah** render dan QC; belum dijalankan karena video belum selesai.

## Revisi aset karakter (sesudah render draft dihentikan)
- Render draft lama dihentikan karena user meminta mengganti placeholder sebelum render panjang. Bagian-bagian sebelumnya tidak boleh dicampur dengan render versi aset baru.
- Pakaian proxy pada karakter berdiri/gudang/lalu lintas diganti mesh MakeHuman ber-UV dan tekstur polo, cargo dan sepatu (provenance `public/garments/PROVENANCE.md`). Transfer skin weight dan masking badan dibuat; frame diuji, tetapi pose dan clipping belum final. Entitas duduk masih memakai proxy yang disetujui untuk preview lama; pakaian yang sesuai, karakter, motor, gudang, kendaraan, pohon dan animasi masih perlu peningkatan.
- Belum semua adegan atau VO setelah 09:03 tersedia; jangan gunakan status ini sebagai tanda film siap render.

## Revisi set gudang dan warung
- Set gudang memakai material aspal/beton/plester dengan peta color, normal dan roughness, ditambah mesh rak glTF dengan tekstur PBR. Ukuran rak disesuaikan setelah pemeriksaan frame; posisi kotak diselaraskan dengan rak. Set masih blockout dan banyak aksi belum ada.
- Warung memakai peta kayu PBR hasil scan dari mirror dan meja glTF mengganti meja kotak. Potongan kayu dan kursi masih geometri sederhana; belum final. Referensi dan catatan lisensi `public/pbr/PROVENANCE.md`, `public/models/PROVENANCE.md`.
- Lisensi individual model meja dan rak serta vegetasi **belum diverifikasi di sumber asli**; jangan dipublikasikan sebelum verifikasi. Bukan bukti kualitas realistis final.
