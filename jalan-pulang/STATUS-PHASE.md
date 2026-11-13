# Status fase produksi — Jalan Pulang

## Fase 1 — sumber dan timeline: belum selesai
Transkrip unggahan 00:00–09:03 baru acuan kasar. Dua berkas VO ada, tetapi offset, kecocokan dan akhir setelah 09:03 belum ditranskrip/diverifikasi. Shotlist `SHOTLIST-PRODUKSI.md` mengidentifikasi isi dan gap.

## Fase 2 — rangkaian adegan: sedang dikerjakan, belum selesai
- `StoryBlocking` menyambung 33 blok shot dari 00:00–09:03 ke satu track VO, dengan potongan kira-kira menurut timestamp; banyak isi masih berulang atau belum sesuai aksi. Telah divalidasi tanpa celah/overlap dan frame ponsel, sosok duduk dan berdiri diuji; belum dirender/ditonton utuh atau dicocokkan dengan audio.
- `OpeningAssembly` mencakup 00:00–01:41 dengan audio VO pertama: motor, gudang, motor, kemacetan. Ini **blokout**, bukan adegan final. Gudang dan kemacetan set 3D baru, dengan figur skinned; belum ada aksi mengirim uang, menelepon, berangkat dari rumah, interaksi dengan tukang parkir, atau staging kecelakaan yang benar. Karakter dan pakaian masih perlu fitting. Motor berulang dipakai sementara, bukan penyelesaian shot.
- Jalan, warung, papan dan sosok sudah punya komposisi uji terpisah. Papan basah, sosok berdiri dan kamera masih perlu animasi, fitting dan QC; belum menjadi rangkaian lengkap.
- Bagian 04:16–09:03 baru blocking dari aset uji; kelanjutan VO setelah 09:03 belum ditranskrip dan dibangun. Jangan menganggap timeline lengkap atau adegan final.

## Fase 3 — penyempurnaan: belum selesai
Aksi dan kontinuitas karakter, material, lisensi vegetasi, suara, sinyal/panggilan, compositing dan QC artistik masih tertunda.

## Fase 4 — render dan QC: belum dimulai untuk rangkaian utuh
Render simultan sebelumnya memicu crash/kehabisan sumber daya. Render warung 29 detik yang sedang berjalan dihentikan karena tidak stabil (tidak menghasilkan video final). Jangan jalankan beberapa render WebGL serentak; uji dulu render dalam potongan kecil dan sambungkan hanya setelah lulus QC. Build dan dua frame pembuka diuji; belum ada render video `OpeningAssembly`, belum divalidasi terhadap VO.

## Catatan visual terbaru
- Insert telepon 23:47 dibuat sebagai objek 3D bergerak, tetapi belum berada di tangan Dimas.
- Lapisan material sementara menutupi kulit yang bocor pada torso rig berdiri; pose, tangan, wajah, pakaian serta lambaian belum final.
- Papan dan warung berulang merupakan placeholder; tikungan, muka tersenyum dan interaksi aktual belum lengkap. Seluruh transisi/VO perlu QC.

## Rangkaian 5 menit (00:00–05:00) — render draft
Timeline `StoryBlocking` kini mencakup 00:00–09:03. `scripts/render-five-minutes.sh` merender 00:00–05:00 menjadi 15 potongan berurutan 20 detik, memeriksa 600 frame tiap potongan, kemudian menggabungkan VO satu kali dan memeriksa 9000 frame. Ini hanya draft 960×540: aset, aksi, sinkronisasi, sound design dan QC belum final. Resolusi internal setengah khusus untuk draft; komposisi lain tetap pada resolusi normal. Frame uji 1 detik berhasil, tetapi seluruh rangkaian belum selesai diverifikasi.

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

## Blok adegan panggilan (06:02–07:23)
`CallWithVO` adalah komposisi terpisah dengan VO 01 dari 06:02, menampilkan motor berhenti, sosok di dekat warung, Dimas ber-rig, telepon 3D pada pergelangan dan perpindahan kamera. Ini masih blocking: telepon belum pas di telinga/tangan, gestur, ekspresi dan motor masih sementara; dua karakter masih berbagi bentuk dan pakaian dasar. Frame lebar dan dekat diuji, belum ada render video atau QC sinkronisasi. Kini diintegrasikan setelah blok pengereman sementara; tidak menganggap 06:02–07:23 sudah selesai.

## Sambungan pengereman ke panggilan (WIP)
Pada 05:45–06:02 motor melambat dan berhenti; rig Dimas muncul di samping lalu bergerak mundur. Ini transisi blockout, **bukan animasi turun yang mulus**: rig pengendara proxy diganti mendadak dengan rig berdiri, dan pakaian/penampilan belum konsisten. Tahap 06:02–07:23 memakai adegan telepon; gestur memegang telepon dan akting masih perlu fitting. Frame awal dan setelah turun serta frame timeline panggilan diuji; belum dirender video/di-QC terhadap VO. Render lokal kini menerima maksimum 543 detik untuk timeline ini, tetap bukan film lengkap.

## Spion dan sosok bayangan (07:23–09:03), WIP
Spion memakai mesh dan render target dari kamera kedua (gambar dalam spion bergerak, bukan gambar statis), menampilkan rig bayangan di atas motor. Shot berikutnya memperlihatkan bayangan ber-rig di belakang Dimas, dan shot 08:52 memudarkan dan menggeser bayangan selama sepuluh detik. Ini blockout: bentuk sosok masih mirip manusia biasa, lengannya belum melingkar di pinggang, spion tidak memakai solusi refleksi fisik, phone/ekspresi/penampilan karakter belum final, shot dan suara belum dicocokkan pada audio. Frame tiga studi dan frame timeline spion telah diuji; video keseluruhan belum dirender/diperiksa. Transkrip lanjutan dan penutup belum tersedia.

## Rig pengendara (WIP)
Pada perjalanan dan awal pengereman, proxy pengendara diganti rig MakeHuman berpakaian UV-skinned agar lebih konsisten dengan Dimas. Frame dua adegan diuji. Helm masih mesh sederhana, pose duduk belum menggenggam setang dan transisi turun masih mendadak; motor tetap blockout. Bila aset rig gagal dimuat digunakan proxy cadangan. Ini belum siap render final.

## Penutup dan transkrip VO 02 — blocking awal, bukan final
- Audio kedua ditranskrip otomatis secara lokal memakai Whisper small multilingual CTranslate2 int8 dari `@skillninja/shortmovie-telop-model-p0` sampai `p3` (1.0.0), disatukan dan SHA-256 diperiksa sesuai paket. `TRANSKRIP-VO02-ASR.md` mempertahankan teks mentah dan timestamp relatif; ASR memiliki kesalahan jelas dan **belum dikoreksi melalui pendengaran**. Salinan Drive: `1Hnqr9Wpu4PyL89XWFgZkDMN7tXTW-5pX`.
- Komposisi `FullStoryBlocking` menambah VO 02 pada frame 16309 (perkiraan awal VO 02 tepat setelah durasi 543,63425 detik VO 01). Belum ada keputusan editorial apakah ada jeda. Uji render 36 frame di sambungan mengandung stream gambar dan audio; sinkronisasi dan kelancaran sambungan belum dinilai dengan pendengaran.
- Berdasarkan ASR mentah, ditambahkan blocking suasana warung padam, kembali berkendara, papan 3 km dan rumah dengan pintu tertutup, gerak karakter, lampu teras dan sosok. Rumah memakai tekstur PBR dan rig, namun masih fasad geometris; belum ada motor/halaman desa yang memadai, aksi naik/turun motor, ketukan tangan akurat, karakter/ekspresi, efek napas, staging ibunya, suara lingkungan atau penyutradaraan final. Tiga frame rumah dan satu frame sambungan diuji. Gerak, kontinuitas dan durasi harus diverifikasi terhadap audio asli.
- `render-local.sh` awalnya hanya merender `StoryBlocking`; lihat pembaruan opsi `--full` di bawah. Jangan memakai keduanya sebagai final; render dan pemeriksaan lengkap belum dilaksanakan. Resolusi test bukan bukti kesiapan produksi.

## Transkrip pengguna dan staging kedatangan (WIP)
Transkrip dan timestamp VO 02 kiriman pengguna tersimpan di `TRANSKRIP-VO02-PENGGUNA.md` dan menjadi acuan utama; teks meragukan tetap dipertahankan untuk diperiksa terhadap audio. Salinan Drive `1cng9JeSY8MFg9LhFbrUkBRc_RtXRc4gA`. Pergantian papan, berkendara dan rumah disesuaikan; rig Dimas kini tiba di motor, turun, berjalan dan mengetuk dalam adegan rumah. Tiga still diuji dan bundling berhasil; motor dan rumah masih proxy, kontak animasi, gerbang desa, ekspresi, suara serta sinkronisasi presisi masih WIP. Belum siap render final.

## Kontak telepon dan transisi turun motor — WIP
- Tangan kanan diarahkan mendekati telinga dengan penyelesaian IK sederhana pada lengan atas/bawah, dihitung ulang dari pose awal setiap frame agar hasil seek acak deterministik. Frame close-up panggilan diuji. Ponsel masih dipasang pada pergelangan, jari belum menggenggam, sudut tangan/siku dan kontak telinga belum final; IK tanpa batas anatomi dapat menghasilkan pose buruk dan perlu penyempurnaan.
- Blok pengereman kini menginterpolasi pose duduk dan posisi pengendara selama dua detik sebelum beralih ke rig berdiri. Frame pada 4, 5,5 dan 6,5 detik diuji; masih ada pertukaran rig, perubahan helm, clipping dengan motor dan posisi kaki belum terkunci. Motor tetap geometri blockout; transisi ini belum layak dianggap animasi final.

## Jalur render draft kedua VO
`render-local.sh --full` memilih `FullStoryBlocking`, memeriksa kedua VO, menyambung audio pada frame 16309 dan memverifikasi total 20398 frame hasil. Preflight, smoke satu detik, penolakan kombinasi opsi dan filter penggabungan audio diuji; **render lengkap belum dijalankan atau diperiksa**. `--full` bukan pernyataan kesiapan final, dan masih memerlukan aset, animasi, sound design serta QC.

## Bentuk motor yang konsisten — masih sementara
Blok motor kotak pada perjalanan, pengereman/panggilan dan halaman rumah diganti dengan geometri step-through terperinci yang dibuat secara deterministik oleh generator MIT MediaGeni; sumber, commit dan lisensi dicatat di `public/models/PROVENANCE.md`. Roda punya pivot terpisah dan frame dari tiga adegan diperiksa. Ini masih motor generik low-poly, **bukan** model Supra akurat atau aset PBR fotorealistis; jok, setang, tangan/kaki, suspensi dan pergerakan tetap perlu fitting dan QC. Validasi geometri tersedia via `node --experimental-default-type=module scripts/test-motorcycle.mjs`.

## Tangan pengendara ke setang (WIP)
Lengan pengendara kini memakai IK dua sendi untuk mendekati setang model motor, dengan bobot yang berkurang saat turun; pose dihitung ulang agar frame acak konsisten. Panjang sumbu motor dipendekkan dan posisi badan digeser untuk jangkauan yang lebih masuk akal. Pengujian model/rig mengukur jarak asal pergelangan ke target sekitar **6,6 cm**, bukan kontak telapak yang sempurna; tiga frame dan bundle diuji. Jari, siku, kaki, jok, transisi dan bentuk motor tetap perlu diperbaiki, sehingga ini belum final.

## Wajah sosok pada putaran keempat — WIP
Timeline 04:47–05:05 kini dipisah: pandangan dari belakang hingga 04:55, lalu cut ke sisi wajah pada 04:55–05:05 mengikuti rentang transkrip. Kamera, putaran kepala dan garis mulut 3D mengikuti rig; garis diambil dari permukaan mesh agar tidak melayang sebagai bidang. Pada shot baru karakter mengenakan polo/cargo/sepatu UV-skinned, sedangkan pose preview yang disetujui pada shot sebelumnya dipertahankan. Dua frame dan validator kontinuitas timeline diuji. Garis mulut bukan ekspresi wajah yang dirig, desain rambut dan clipping pakaian belum final; perlu QC gerak, sinkronisasi audio, penampilan seram dan kontinuitas antarpotongan.

## Kontinuitas jaket Dimas
Jaket dan jeans `male_casualsuit05` bertekstur dan UV-skinned (MakeHuman team CC0 menurut katalog sumber) dipakai pada perjalanan, kemacetan, pengereman, panggilan dan rumah; gudang mempertahankan pakaian kerja sebelumnya. Empat frame di lokasi berbeda serta bundle diuji. Pakaian masih perlu inspeksi deformasi/kliping sepanjang animasi; helm, gestur dan kulit belum final.

## Fase staging lintas awal dan akhir
- Gudang: karakter berjalan lalu mengangkat ponsel saat percakapan, dengan kamera berpindah; telepon kini mengikuti rig, bukan melayang di meja. Masih ada keterbatasan IK/siku/jari dan pakaian.
- Kemacetan: kendaraan kotak diganti lima aset GLB dari Kenney Car Kit 3.1 (CC0, `public/kenney-car/PROVENANCE.md`), termasuk truk miring, polisi, sedan/SUV dan kerucut. Motor Dimas dan tukang parkir yang mendekat/menunjuk disambungkan. Aset low-poly, belum PBR fotorealistis, posisi objek dan kecelakaan perlu QC.
- VO 02: perjalanan dari papan 3 km ke rumah sekarang melewati gerbang desa dan rumah-rumah 3D dengan material bertekstur; bentuk rumah generik, bukan lingkungan Indonesia final.
- Sosok bayangan: kedua lengan diarahkan melalui IK ke pinggang Dimas; mata sosok berdiri diposisikan lebih dekat permukaan wajah. Bentuk, clipping, jari, tampilan dan sinkronisasi tetap perlu diperiksa pada gerak/video.
- Frame gudang, kemacetan, desa dan sosok diuji secara serial. Ini bukan pemeriksaan video lengkap; pekerjaan material, akting, sound design dan QC masih terbuka.

## Rancangan suara lintas kedua VO
- Ditambahkan lima rekaman ambiens dan Foley Oculus Audio Pack 01 berlisensi CC BY 4.0, dengan lisensi dan atribusi di `public/audio-oculus/`. `scripts/mix-story-guide.sh` menghasilkan mix opsional 11:19,9 dengan VO gabungan, ambiens malam/ruang, mesin pengganti, langkah dan ketukan, dengan crossfade level tiap rentang. Skrip tidak mengubah render utama dan tidak menggantikan perekaman suara motor asli; timing dan level harus diperiksa dengan mendengarkan.

## Fase rumah dan kontinuitas VO 02
- Rumah kini memiliki anak tangga, bingkai jendela dan tanaman; pijakan Dimas dinaikkan ke ketinggian teras. Adegan kedatangan, ketukan dan percakapan di pintu menggunakan enam framing/kamera bergerak, bukan satu sudut yang ditahan selama hampir 90 detik. Pernapasan dan reaksi kepala ditambahkan; tangan diarahkan dengan IK ke permukaan pintu dan ditarik dalam tiga gerakan terpisah. Sosok di belakang masuk pada segmen napas dan lengannya tidak lagi dalam pose default terbuka.
- Lima still fase rumah diperiksa secara visual, lalu tiga still perbaikan dan klip 81 frame bagian ketukan berhasil dirender. Klip belum ditinjau gerak dan kontak jari/ketukan masih memerlukan QC. Sosok akhir masih siluet generik, belum wajah/akting final.
- Batas lima shot VO 02 dipusatkan pada `src/ending-timeline.js`; `scripts/test-ending-timeline.mjs` memeriksa kontinuitas berbasis frame dan ujung komposisi 20398. Tes timeline VO 01, IK setang, bundle dan preflight full lulus. Sinkronisasi dialog dan tiga ketukan belum divalidasi melalui pendengaran.

## Fase pulang dari warung (VO 02)
- Shot 0–35,8 detik sekarang menyambung penurunan tangan dan anggukan sosok, padamnya bohlam dan hilangnya sosok, napas Dimas, perpindahan ke motor, gerak duduk/meraih setang, nyala lampu dan motor menjauh. Tidak lagi memotong langsung dari Dimas berdiri ke sepeda motor yang sudah berjalan pada 23,5 detik. Model animasi duduk menggunakan outfit sama; helm disembunyikan di shot ini agar tidak tiba-tiba muncul. Pohon dan pakis yang berada di tengah jalur dipindah ke tepi.
- Enam still FullStory diperiksa untuk gestur, lampu, transisi naik dan keberangkatan; klip 101 frame transisi berhasil dibuat. Gerakan naik masih interpolasi rig kasar, kontak tangan/kaki dan kesinambungan helm antar-shot belum final; klip dan kecocokan VO masih perlu pemeriksaan gerak serta pendengaran.
- Durasi empat shot VO 02 tetap menutup total 20398 frame; tes kedua timeline, IK setang, bundle dan preflight full berhasil. Mix guide disesuaikan supaya mesin pengganti mulai saat motor hendak pergi, bukan ketika Dimas masih berdiri; ini masih suara mesin mobil sementara.

## Fase panggilan pertama
- Panggilan pertama 06:02–07:23 kini memiliki lima sudut kamera dan gerak kamera dalam shot; penyelesaian IK bergerak dari pinggang ke telinga sebelum panggilan tersambung, bukan langsung memulai dengan ponsel di telinga. Penggunaan `callIntro` hanya pada awal panggilan menjaga adegan panggilan lanjutan tetap pada pose berbicara.
- Posisi target pergelangan dan orientasi tangan disesuaikan setelah pemeriksaan delapan still. Pergelangan kini lebih dekat sisi wajah, tetapi jari masih terbuka dan genggaman/ponsel kurang natural; akting bibir, pemeriksaan gerak dan sinkronisasi audio belum selesai. Bundle, timeline kedua VO, IK setang dan preflight lulus.

## Audit panduan lengkap dan pekerjaan lintas adegan
- Panduan Drive berhasil diunduh **lengkap** dan disimpan sebagai `PANDUAN-ANIMASI-ORIGINAL.md`; 14 adegan dan 72 baris shot kini diekstrak ke `data/guide-72-shots.json` dan dibuka satu per satu dalam `AUDIT-14-ADEGAN-72-SHOT.md`. Panduan aslinya berdurasi 13:25 sedangkan kedua VO sekitar 11:19,9; karenanya timestamp panduan tidak dipakai mentah sebagai sinkronisasi VO. Audit secara eksplisit membedakan referensi dari shot yang selesai dan mencatat sisa pada setiap adegan.
- Gudang: paket mengikuti rig saat bekerja dan layar telepon diberi UI panggilan Ibu; posisi tangan panggilan disesuaikan dan dua still diperiksa. Genggaman paket/jari dan foto ayah/transfer belum selesai.
- Adegan 9: memasukkan kilas balik 3D kamar ayah selama VO 06:57–07:14, dengan rig, IK lengan, kamera bergerak dan material ruang. Beberapa still diuji; model ayah dan tempat tidur masih generik, kontak dan ekspresi perlu penyempurnaan.
- Adegan rumah/penutup: cahaya bawah pintu dan siluet dari dalam disertai insert kamera rendah, fade ke hitam dan judul penutup. Still diperiksa; geometri bayangan masih sederhana, sound design serta QC keseluruhan tetap diperlukan.

## Fase terarah adegan 3–5
- Adegan 3: Dimas kini duduk pada motor (rig dan IK setang) saat petugas mendekat/menunjuk, bukan berdiri di sebelah motor. Kamera berganti dari antrean ke percakapan/close-up; kerucut dipindahkan agar tidak bertabrakan dengan petugas.
- Adegan 4–5: perjalanan dibagi ke framing lebar, POV lampu, samping, tangan pada setang, dan tikungan kanan dengan jalan bergeometri melengkung. Posisi pohon dan semak mengikuti tikungan. Kesalahan modulo negatif yang mengosongkan hutan setelah satu siklus diperbaiki dan diberi tes; kepala pengendara diangkat ke arah jalan. Enam still awal dan lima still koreksi plus tikungan diperiksa.
- Foley panduan kini memiliki ambiens kemacetan beratribusi, sirene sintetis dengan fade dan mesin sementara yang berlanjut selama perjalanan hutan. Mix 679,914 detik berhasil dibuat; audio belum didengar dan mesin/ambien masih pengganti, bukan rekaman autentik lokasi.
- Pemeriksaan: `test-scenes-3-5.mjs`, `test-road-motion.mjs`, timeline dan bundle lulus; klip 61 frame tikungan berhasil dirender. Ini **bukan persetujuan akhir**: kontak jari/kaki, gerak petugas, material kendaraan, vegetasi, transisi dan sinkronisasi VO masih butuh QC video/audio; belum semua 72 shot dinyatakan selesai.
