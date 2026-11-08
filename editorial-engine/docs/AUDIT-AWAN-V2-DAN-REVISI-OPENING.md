# Audit Awan V2 dan rancangan klimaks awal

**Draf audit · Bukan persetujuan publikasi**

## Cakupan pemeriksaan

Diperiksa: naskah dan storyboard V2 sembilan adegan, subtitle yang masih berupa perkiraan, QA V2, serta 24 frame sampel dari master privat pada pembuka dan adegan cerita. Master yang diunduh cocok dengan MD5 dan SHA-256 yang tercatat di Drive/QA; `ffprobe` membaca 74,3 detik, 1080 × 1920, 30 fps, video H.264 dan audio AAC. Sampel bukan pemutaran penuh atau uji pada ponsel. Narasi, musik, pelafalan CTA, sinkronisasi serta seluruh gerakan **belum didengarkan/dinilai manusia dalam audit ini**.

## Hasil terhadap koreksi pengguna

| Kriteria | Status | Bukti dan batas |
|---|---|---|
| Entitas terlihat sejak awal | **PASS / TESTED pada satu frame** | Frame 0 yang didekode menampilkan awan ilustrasi, timbangan dan Host. Teks pembuka sudah muncul tanpa fade. Keterbacaan aktual pada ponsel tetap `NOT TESTED`. |
| Kalimat pertama memancing pertanyaan | **PASS pada naskah; audio NOT TESTED** | Storyboard dimulai “Lima ratus ton air, melayang di langit? Kok bisa?”. Subtitle memperkirakan rangkaian ini sekitar 0,24–5,25 detik; itu bukan forced alignment atau bukti bahwa suara didengar. |
| Puncak asli dicuplik di awal | **NEEDS REVIEW** | Pembuka yang disampel menampilkan awan dan timbangan. Transformasi tangki menjadi tetesan baru tampak pada adegan S05, sekitar 30,01–38,71 detik; storyboard V2 tidak menandai pembuka sebagai cuplikan dari komposisi puncak itu. Tidak cukup bukti untuk menyebut koreksi ini sudah diterapkan. |
| Cut pada pertanyaan, lalu mulai cerita | **NEEDS REVIEW** | Storyboard menempatkan pergantian S01 ke S02 pada 5,35 detik; sampel 5,33 dan 5,40 detik menunjukkan perubahan properti dari timbangan ke tangki bayangan. Ini bukan bukti bahwa cut sudah terasa sebagai cuplikan puncak lalu awal cerita, atau bahwa ritmenya pas. Target 1–3 detik belum terbukti pada audio. |
| Jawaban dan penutup | **PASS pada struktur naskah; video lengkap NOT TESTED** | S05 membahas tetesan, S06–S07 gravitasi/udara naik, dan S09 mengembalikan perbandingan tangki serta CTA. Kualitas pengalaman audio-visual dan pelafalan belum diperiksa. |

Adegan perhitungan S03–S04 dalam storyboard berlangsung sekitar 12,37–30,01 detik. Ini observasi durasi, **bukan** bukti penonton meninggalkan video di sana. Sebagai hipotesis revisi, konsep tetesan diperlihatkan lebih awal lalu hitungan dimasukkan kembali secara bertahap; hasilnya tetap perlu diuji dan tidak dijamin lebih baik.

## Rancangan terpisah untuk V3

Naskah dan storyboard usulan ada di `editorial-engine/content/proposals/awan-500-ton-klimaks-v3.json`. Ini **proposal**, bukan video baru yang selesai. Master, source dan posting V2 tidak diubah.

- **Frame 0:** awan sebagai entitas utama, Host memegang kaca pembesar; jarum visual menunjukkan estimasi massa air untuk **satu contoh**.
- **Kalimat pertama:** “Lima ratus ton air melayang? Kok bisa?”
- **Cuplikan puncak dan cut:** pada tata letak yang sama dengan puncak S04, tepi awan mulai terurai menjadi tetesan; cut ketika pertanyaan terbentuk, sebelum transformasi selesai. Target 1–3 detik harus dicek pada take suara yang sebenarnya.
- **Baru mulai cerita:** Host membayangkan air terkumpul sebagai tangki; informasi bahwa angka hanya satu contoh muncul sebelum ilustrasi dipahami sebagai fakta umum.
- **Bayar janji:** komposisi pembuka kembali di S04 dan transformasi diselesaikan. Hitungan, gravitasi, arus naik, serta kemungkinan hujan dijelaskan kemudian; penutup tetap `ikuti knot theory`.

Setiap adegan proposal memuat gerak Host dan sedikitnya dua objek. Lima tes struktur dan konsistensi proposal **PASS**; suite `npm test` menghasilkan 70 lulus, 2 dilewati, 0 gagal. Tes ini memeriksa data, bukan kualitas cerita atau video. Gerakan, prop contact, kualitas animasi, CTA, subtitle, musik dan durasi masih `NOT TESTED`; tidak ada video, suara baru, thumbnail atau caption final yang dibuat pada tahap ini.

## Pagar fakta dan pekerjaan berikutnya

- [USGS](https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh): 1 km³ × 0,5 g/m³ menghasilkan sekitar 500.000 kg air, yaitu 500 ton metrik, **dalam satu contoh**; bukan massa udara atau semua awan.
- [NOAA](https://www.noaa.gov/jetstream/atmosphere/precipitation): pada sebagian awan hangat, tumbukan dan penggabungan dapat membesarkan tetesan menjadi hujan; bukan satu-satunya proses hujan.
- [Shupe dkk. (2008)](https://psl.noaa.gov/people/matthew.shupe/publications/Shupeetal.JTECH2008.pdf): tetesan awan cair yang sangat kecil memiliki laju jatuh kecil dibanding gerak udara vertikal dan dapat mengikuti gerak udara; kondisi awan bervariasi.
- Pembuatan V3 memerlukan satu take `voice-05` baru untuk naskah yang berubah, storyboard/animatic, animasi prop dan Host, subtitle yang dicocokkan dengan suara, musik, thumbnail serta caption empat platform. Uji AV lengkap, ponsel, hak dan fakta harus dilakukan sebelum menyebutnya siap.
- Belum ada jadwal, salinan media publik, persetujuan publikasi atau request Buffer baru. Jangan menyimpulkan video boleh tayang hanya karena template/tes mekanis lolos.
