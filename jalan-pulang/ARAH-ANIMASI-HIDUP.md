# Jalan Pulang — arah baru: animasi karakter dan dunia hidup

## Keputusan kreatif

Koreksi pengguna: **tidak lagi menggunakan gambar statis sebagai adegan**. Produksi menggunakan karakter ber-rig, animasi, objek, lingkungan 3D dan kamera bergerak seperti pembuatan game. Bentuk akhir bisa berkesan 2.5D lewat framing, kamera, depth, fog dan komposisi, tetapi karakter dan lingkungan digerakkan sebagai objek sungguhan di kanvas, bukan zoom foto atau cutout gambar AI. Rencana gambar/ITV dan teknik foto-parallax sebelumnya tidak lagi menjadi target produksi. Sebelumnya pengguna merencanakan render ITV sendiri; instruksi terbaru menggantinya untuk arah visual ini. Referensi visual hanya untuk desain, bukan shot final.

## Pipeline

- **Remotion** mengatur urutan adegan, waktu, audio, cut, dan output 30 fps; **Three.js** membuat dunia dan merender karakter/objek ke canvas. Penentuan pose, lintasan, kamera, lampu, dan efek harus dihitung dari frame agar hasil render dapat diulang.
- Set modular: gudang/kos, jalan macet, hutan karet dan papan, warung/beringin, serta rumah dan teras. Dunia yang sama dipakai kembali untuk menunjukkan putaran.
- Karakter: Dimas (juga pose berkendara), tukang parkir, sosok putih (duduk, berdiri, memiringkan badan, lambaian), bayangan penumpang, ibu dan bapak. Kebutuhan rig: idle, berjalan, naik/turun motor, berkendara, memegang telepon, menoleh, tangan dan ekspresi. Gerak dapat berupa clip glTF, rig skeletal, atau procedural keyframe; belanja/kreasi aset sesuai kebutuhan dan lisensi.
- Properti hidup: motor dan roda, lampu/headlight, papan, bohlam berayun, telepon, kursi, pintu. Aksi harus terlihat jelas dan mendukung cerita; sound design mengikuti VO yang telah dicocokkan, bukan sekadar dekorasi.
- Kenney starter kit resmi sudah dipakai untuk **prototipe teknis**; karakternya bukan Dimas, gayanya stylized dan belum sesuai cerita. Butuh model motor, warung Indonesia, kebun karet dan karakter final—jangan klaim tersedia hanya karena sudah ada starter kit.

## Perencanaan waktu

Gunakan `TRANSKRIP-TIMESTAMP-RAPI.md` sebagai cue referensi sampai 09:03 dan `VISUAL-TIMESTAMP-2.5D.md` sebagai peta adegan sementara. Pada kedua dokumen, instruksi gambar/foto/ITV sebelumnya digantikan oleh keputusan kreatif di atas; terjemahkan tiap cue menjadi aksi rig, gerak properti, lingkungan, kamera dan pencahayaan. Timestamp berasal dari transkrip yang diunggah dan belum dikonfirmasi terhadap audio. Bagian setelah 09:03 belum ada di unggahan; perlu transkrip lanjutan dan pemeriksaan dua VO sebelum membuat timeline penuh.

## Hasil uji teknis

- `ForestBlockout` adalah uji 10 detik: karakter Kenney berjalan di jalan hutan sederhana; gerak dan kamera dihitung dari frame. Tidak ada VO atau editing cerita, tidak mewakili tampilan/karakter final.
- Chromium `@sparticuz/chromium` diekstrak bersama library AL2023 dan SwiftShader. Eksekusi render berhasil memakai `--gl=angle` dan flag `enable-unsafe-swiftshader`, `use-angle=swiftshader`, `ignore-gpu-blocklist`, `disable-gpu-sandbox`.
- Uji dirender pada skala 0.5 (960×540), 30 fps, 300 frame dengan concurrency 1. Ini membuktikan jalur teknis pada blockout kecil, bukan bahwa render final 1080p atau seluruh film siap.
- Model `character.glb` dan teksturnya dari [Kenney Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer); README paket menyebut aset model CC0, kode kit MIT. Sumber dan lisensi disimpan di `public/kenney/`.

## Langkah berikut

1. Cari dan audit aset yang benar-benar sesuai (Dimas, motor, warung, hutan), termasuk rig, animasi, format, lisensi dan sumber yang dapat diakses; sesuaikan atau buat model yang tidak tersedia.
2. Buat vertical slice adegan hutan: Dimas di motor, lampu menyapu jalan, pohon dan kabut bergerak, kamera mengikuti. Kembangkan rig dan gerak berdasarkan frame, lalu render untuk evaluasi gaya.
3. Cocokkan VO dan seluruh timestamp; rancang adegan lanjut sampai akhir setelah transkrip tersedia.
4. Bangun modular scene dan shot, render per adegan, periksa kontinuitas, tindakan karakter, kualitas visual dan audio sebelum master final.

## Iterasi PBR mesh & UI

- `ForestBlockout` kini memakai mesh jalan retak, batang dan tajuk pohon, papan jalan 3D, material `MeshStandardMaterial` dengan roughness/metalness dan tekstur prosedural, pencahayaan, kabut dan kamera perspektif. Material ini masih prosedural sederhana, belum merupakan paket texture PBR fotorealistis lengkap (normal/roughness maps), dan karakter Kenney masih placeholder.
- `PhoneCallTest` adalah contoh UI diegetik panggilan Ibu; terpisah dari video cerita dan belum tersambung ke VO.
- `npm run preview` membuka antarmuka review dengan pemilih scene dan kontrol playback; ini untuk preview, bukan editor GUI. Scene tetap didefinisikan dalam kode Remotion/Three.js.
- Berhasil build Vite dan Remotion; uji render hutan 60 frame dan UI ponsel 120 frame pada 960×540, 30fps. Belum validasi audio, rig Dimas/motor, 1080p, atau keseluruhan film.

## Iterasi uji berkendara

`RideBlockout` menampilkan motor dan pengendara yang dibuat secara prosedural, dengan roda berputar, gerak suspensi, lampu, aspal, vegetasi yang bergerak relatif terhadap kamera dan material berbasis `MeshStandardMaterial`. Semak berasal dari mirror Kenney; asal dan keterbatasan verifikasi lisensinya ada di `public/kenney-nature/PROVENANCE.md`. Render pengujian 3 detik / 960×540 / 30 fps, tanpa VO. Ini tetap blockout stylized, bukan karakter Dimas, motor Supra, atau kualitas film final. Perlu rig karakter anatomis, geometri motor lebih tepat, material/texture PBR lengkap serta kalibrasi audio.

## Iterasi warung pertama — 12 November

- Komposisi `WarungApproach` merancang adegan sekitar cue transkrip 02:25–02:34 (kedatangan warung); bukan sinkronisasi audio yang sudah diverifikasi. Render uji 270 frame / 9 detik / 960×540 / tanpa suara.
- Set dibuat sebagai grup 3D modular: atap seng berusuk, dinding dan tiang, meja dengan kursi terbalik, serta beringin dan akar. Set bergerak relatif ke kamera saat motor mendekat dan bisa dipakai ulang untuk loop berikutnya. Material jalan sekarang juga menggunakan bump prosedural; lampu motor menggunakan spot dan wash halus.
- Ini **blockout**; bentuk lingkungan sederhana dan terlalu stylized untuk final sinematik, pengendara belum memiliki skeletal rig nyata, dan model motor belum Supra akurat. VO belum dimasukkan. Perlu menyempurnakan geometri, rig, tekstur PBR/normal/roughness, pencahayaan, dan uji terhadap audio; jangan menganggap test ini siap tayang.
- Jalankan setelah `npm ci` dan `npm run extract:chromium`: `npm run render:warung`. Hasil tersimpan di `render/warung-first-pass.mp4`; output render dan tools tidak dimasukkan Git. Preview via `npm run preview` → “Warung pertama”.

## Iterasi putaran ketiga

Set warung yang sama memiliki dua komposisi tambahan di Remotion dan preview: `WarungLit` (cue narasi 03:47–03:53, lampu menyala), dan `WarungFigure` (cue 04:00–04:06, sosok duduk). Keduanya mempertahankan geometri set yang sama. Bohlam dan point light adalah objek 3D yang berayun deterministik dengan periode tiga detik; pada versi sosok ada figur placeholder duduk, kepala tertunduk. Titik waktu adalah acuan dari transkrip, bukan sinkronisasi VO final. Rentang di antaranya serta seluruh adegan belum dirakit sebagai timeline final.

`npm run render:warung-lit` dan `npm run render:warung-figure` merender masing-masing komposisi 6 detik pada skala 0,5 setelah setup Chromium; uji pendek 60 frame untuk `WarungFigure` telah berhasil. Wajah, rig manusia, motor, vegetasi dan material masih sederhana/stylized; tidak mencerminkan kualitas akhir. Uji belum mengandung audio, dan masih memerlukan karakter final yang layak serta lebih banyak shot dan QA.

## Koreksi akses VO dan uji dengan suara

Kedua VO Drive telah berhasil diunduh melalui connector (bukan URL Drive langsung). Probe FFmpeg: `VO-Jalan-Pulang_01.mp3` **09:03,63**, `VO-Jalan-Pulang_02.mp3` **02:16,28**, masing-masing MP3 mono 44.1 kHz; total durasi jika disambung tanpa pemotongan sekitar **11:19,91**. Waktu berakhir VO pertama sesuai kurang lebih dengan akhir transkrip unggahan, tetapi isi dan sambungan belum didengarkan/diverifikasi. Transkrip kedua belum tersedia.

Komposisi `WarungWithVO` memasangkan scene dengan VO pertama dimulai pada detik 145 (02:25) sesuai cue transkrip. Uji `render/warung-dengan-vo.mp4` berhasil 9 detik, 960×540, 30 fps, H.264 + AAC 317 kbps. Ini uji tersinkron secara offset numerik, bukan bukti timing artistik sudah diverifikasi; visual masih blockout, bukan output final. `npm run render:warung-vo` untuk mengulang setelah kedua file VO ditempatkan di `public/vo/`; file VO diabaikan Git, harus dipulihkan melalui connector jika workspace tidak lagi menyimpannya. Jangan memasukkan VO privat ke repo.

## Revisi kejernihan dan material warung-sosok

Pada varian `warungScene`, fog Three.js dihapus, kamera didekatkan, dan figur dibalik sehingga membelakangi jalan, kepala tertunduk serta tangan menggantung. Untuk mengikuti teks 04:11 yang menyatakan sosok tidak bergerak, animasi figur ditahan; bohlam dan kamera tetap bergerak. Tekstur prosedural kayu, kain dan logam sekarang memiliki base color, normal tangent dan roughness terpisah; logam menggunakan nilai metalness konstan. Normal dan roughness diturunkan dari tekstur prosedural—**bukan** data hasil scan, dan tidak ada AO, displacement, retopologi atau UV kustom. Output `deliverables/warung-sosok-10-detik.mp4` (VO sumber pertama offset 04:00, 300 frame, 960×540) menggantikan preview sosok yang lebih lama. Figur dan warung tetap model primitif/low-poly, belum fotorealistis atau memiliki rig skeletal; karakter dan environment memerlukan aset berkualitas dan pipeline refinement lebih lanjut. Fog masih ada pada varian perjalanan selain warungScene.

## Peningkatan mesh kepala — belum menyelesaikan pipeline

Figur sekarang menggunakan potongan mesh kepala anatomis MakeHuman (4.154 vertex, 4.122 face) yang berlisensi CC0, termasuk UV bawaan; provenance dan lisensi ada di `public/makehuman/`. Ekstraksi oleh `scripts/makehuman-head.py` (perlu `assets/makehuman/base.obj` dari URL yang tercatat). Kepala ini tidak memiliki peta kulit, rig, weight painting, atau retopologi baru. Tubuh dan pakaian tetap geometri blockout, jadi keseluruhan masih jauh dari target realistis/menyeramkan. Belum ada Cycles/Eevee, shadow dan material scan final, AO atau displacement, animasi skeletal entitas, compositing final dan sound design. Render ulang 10 detik tersedia di `deliverables/warung-sosok-10-detik.mp4`; Vite build dan render H.264/AAC berhasil.

Di lingkungan saat ini, instalasi bpy 4.5.16 berhasil tetapi import gagal: `libXrender.so.1`, `libXfixes.so.3`, `libXi.so.6`, `libxkbcommon.so.0`, `libSM.so.6`, `libICE.so.6`, dan `libGL.so.1` tidak tersedia. Jangan menganggap Blender atau penyelesaian 8 tahapan berhasil sampai tool dan hasilnya benar-benar diverifikasi.

## Uji rig skeletal MakeHuman

Tersedia `public/makehuman/rigged-body.json`, 14.517 vertex hasil pemecahan UV, 26.756 triangle dan 163 bone. Geometri, UV dan weight berasal dari MakeHuman CC0, lihat provenance dan lisensinya; bobot dibatasi maksimal 4 lalu dinormalisasi. `EntityRigStudy` membangun `THREE.SkinnedMesh` dengan skeleton hierarkis dan menggerakkan sendi ke pose duduk dalam 4 detik. Shell pakaian masih proxy ketat yang mengambil bentuk dasar, bukan garment final. Render uji `deliverables/tes-rig-entitas.mp4` tanpa VO, 960×540, 30 fps; build Vite dan render sukses. Ini uji rig terpisah, **belum dipasang ke scene warung** karena karakter, pose duduk, pakaian dan tampilan horor belum layak, dan belum ada tekstur kulit/pakaian PBR, retopologi/UV kustom, IK, simulasi, bayangan, sound design atau render final. Perlu pengujian deformasi terutama bahu/paha dan fitting ke kursi sebelum integrasi.

## Integrasi awal rig di warung

`src/rigged-entity.js` membangun skinned mesh MakeHuman, mentransfer bobot tetangga terdekat ke mesh baju longgar berbentuk tabung, dan menggunakan shell berskin untuk celana serta lengan. Pose duduk dipasang pada tulang; saat cuplikan ini entitas sengaja diam mengikuti transkrip, sedangkan kamera dan lampu tetap bergerak. `WarungFigureWithVO` kini memakai rig ini dan render `deliverables/warung-entitas-rig-uji.mp4` 10 detik, 960×540, 30 fps, H.264/AAC; video diuji menggunakan FFmpeg dan frame kelima diperiksa. Frame membuktikan integrasi, **bukan** bahwa hasil kualitas final: pakaian masih sederhana dan fitting tubuh/kursi, proporsi, tangan, visual entitas seram, kulit dan peta PBR serta lingkungan semua masih membutuhkan perbaikan. VO masuk pada offset 04:00 tanpa verifikasi artistik presisi. Render versi sebelumnya disimpan terpisah sebagai `warung-sosok-10-detik.mp4`.

## Iterasi PBR lingkungan dan pencahayaan

Jalan dan atap memakai set peta ambientCG CC0 dari mirror The Last Signal: base color, normal OpenGL, roughness dan metalness (atap). Rincian dan sumber tercatat di `public/pbr/PROVENANCE.md`; kayu masih material prosedural. Dinding belakang dan lantai dipecah menjadi papan-papan bergeometri nyata. Lampu warung menggunakan shadow map, dan skala entitas telah ditingkatkan; kabut dimatikan juga untuk perjalanan. `deliverables/warung-pbr-rig-10detik.mp4` berhasil dirender 960×540, 30fps, H.264/AAC dengan VO 04:00–04:10; Vite build serta render frame varian perjalanan berhasil. Ini belum render final: karakter masih kecil dan perlu pose/fitting, desain seram, pakaian dan tekstur kulit; prop/pohon masih primitif, kayu bukan material scan, dan shadow map masih kasar. Warung preview ini diuji tanpa kabut; varian perjalanan setelah penghapusan kabut belum di-render ulang.

## Iterasi vegetasi 3D

Pohon geometris blockout pada sisi jalan dan pohon utama warung diganti mesh 3D vegetasi dari mirror Quaternius/Poly Pizza, disertai akar gantung prosedural dan pakis; detail sumber serta keterbatasan verifikasi lisensi tercatat di `public/nature-cc0/PROVENANCE.md`. Model adalah pohon generik bergaya, bukan identifikasi botani beringin dan bukan aset fotorealistis. Render `deliverables/warung-vegetasi-10detik.mp4` berhasil 10 detik, H.264/AAC 960×540, VO 04:00–04:10. Render frame pada `WarungWithVO` juga berhasil tanpa kabut dan menunjukkan pohon baru; jarak pohon dan komposisi perjalanan masih perlu penataan. Pakaian, karakter entitas, set, kualitas bayangan, sound design dan output film tetap belum final.

## Penyesuaian pose dan kamera dekat

Posisi sendi diukur menggunakan Three.js pada pose terpasang; entitas dinaikkan 7 cm agar kaki tidak terlalu menembus lantai, lengan dirapatkan, tulang punggung sedikit membungkuk, dan kursi diberi sandaran 3D. Baju proxy diberi lipatan geometri serta noda dan garis prosedural. `WarungFigureWithVO` memotong dari wide ke kamera dekat pada frame 165 (5,5 s), kamera tetap bergerak; transisi belum diverifikasi artistik terhadap VO. Video `deliverables/warung-pose-kursi-10detik.mp4` berhasil H.264/AAC 960×540 selama 10 detik; frame 7 detik dan Vite build diperiksa. Pengamatan frame dekat: figur dan pakaian masih tampak sintetis, kepala terlalu terang, kursi menutupi banyak tubuh, dan pose/fitting serta pencahayaan perlu lanjut; ini belum memenuhi target realistis atau horor. VO ada, bukan sound design lengkap.
