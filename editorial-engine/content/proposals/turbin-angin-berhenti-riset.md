# Riset topik: turbin angin yang justru berhenti saat angin terlalu kencang

Status: **usulan, belum disetujui untuk produksi**. Tidak ada footage yang diunduh, video yang diubah, atau unggahan yang dijadwalkan dalam riset ini.

## POV dan hook

POV-nya dari sisi turbin: mesin yang hidup dari angin justru harus tahu kapan berhenti menangkapnya.

> Saat angin terlalu kencang, turbin angin justru bisa berhenti. Kok mesin yang butuh angin malah memilih diam?

Tampilkan turbin sebagai entitas utama pada frame pertama. Awali dengan pertanyaan dan momen seolah putarannya berhenti, potong sebelum jawabannya. Jangan mengklaim sebuah klip stok merekam kejadian penghentian akibat angin kencang bila keadaan itu belum diverifikasi.

Arah cerita: angin bertambah → daya mencapai batas rancangan → pada turbin yang memiliki kontrol pitch, bilah diputar pada sumbu panjangnya untuk mengurangi tangkapan energi → jika batas operasi terlampaui, sistem dapat menghentikan turbin untuk mengurangi beban → turbin dapat kembali bekerja ketika kondisi aman. Tunjukkan perubahan sudut bilah lewat diagram/animasi yang dilabeli **ilustrasi**, bukan rekaman peristiwa sebenarnya. Penutup: “Kadang cara terbaik memanen angin adalah tahu kapan berhenti.”

Fakta dan batasannya: [Departemen Energi AS](https://www.energy.gov/cmei/wind/articles/how-do-wind-turbines-survive-severe-weather-and-storms) menjelaskan kontrol pitch, ambang penghentian (*cut-out*) yang berbeda menurut turbin, dan pengoperasian kembali. Angin kencang bukan satu-satunya alasan turbin diam; bisa juga karena angin lemah, perawatan, atau penyebab lain. Jangan menjanjikan bahwa setiap turbin akan merespons dengan cara yang sama, atau memakai ambang angka sebagai angka universal.

## Pencarian footage Coverr — metadata saja

Pada [run pertama](https://github.com/zamadye/Content-Creator/actions/runs/42455261758) dan [run sinonim](https://github.com/zamadye/Content-Creator/actions/runs/42455314780), API mengembalikan **enam ID unik** yang judul/deskripsinya secara eksplisit menyebut turbin angin. Setelah deduplikasi, hasil yang sama tidak dihitung lagi. Semuanya beresolusi maksimum 3840×2160, landscape, dan bertanda `is_premium=false` serta `is_ai_generated=false` **menurut metadata API**, bukan pemeriksaan visual atau persetujuan lisensi.

| ID | Keterangan metadata | Pemakaian yang mungkin |
|---|---|---|
| `9Y8kk5xCuY` | Close-up aerial shot of a wind turbine | Calon opening/bilah |
| `WuuebDPmKg` | Aerial shot of wind turbines in Madeira Island | Skala dan lokasi |
| `oaw1EMLhFi` | Aerial shot of wind turbines in the field | Konteks ladang turbin |
| `bKxrMHq2wt` | Long shot of wind turbines in a field | Variasi sudut jauh |
| `k6GEFHq7u4` | Aerial shot of several wind turbines in a field | Skala banyak turbin |
| `ubwZ0jOPny` | Aerial shot of wind turbines in a grass field | Variasi visual ladang |

Kueri `wind turbine` mengembalikan 7 hasil, tetapi satu bertema pemandangan jendela pesawat. `turbine` menghasilkan 12 dengan banyak hasil pesawat; `wind farm` menghasilkan 10 yang tidak jelas menampilkan turbin; `windmill blade` hanya mengulang dua video ladang. Karena itu jumlah hasil pencarian bukan jumlah footage yang relevan. Belum ditemukan metadata yang membuktikan ada close-up pitch bilah maupun rekaman turbin berhenti karena angin kencang.

**NEEDS REVIEW:** enam kandidat bukan bukti bahwa footage yang siap digunakan melimpah. Unduhan/pemutaran, durasi, gerak, variasi, kecocokan framing 9:16, hak penggunaan/atribusi API dan mekanisme tracking belum diperiksa untuk klip ini. Metadata landscape 4K tidak menjamin crop vertikal tetap memperlihatkan seluruh turbin. Pada eksperimen sebelumnya, PATCH tracking mengembalikan 404; jangan menganggap masalah tersebut sudah selesai. Jangan mengunduh tanpa persetujuan yang diperlukan.

## Kebaruan dan alternatif

Penelusuran awal berbahasa Indonesia menemukan [artikel penjelasan turbin](https://explorehall.com/id/how/wind-turbine/) yang sudah membahas penghentian; jadi fenomena ini bukan penemuan baru. Hasil awal lebih banyak berisi artikel/penjelasan teknis dibanding video pendek berbahasa Indonesia tentang pertanyaan yang sama, tetapi penelusuran bukan survei popularitas platform dan tidak membuktikan topik ini belum ramai. POV dan eksekusi tetap perlu dibedakan.

Alternatif yang diperiksa: pasang surut bumi padat punya banyak kandidat stok kota, tetapi perubahan daratannya sendiri tidak dapat dibuktikan oleh stok tersebut dan butuh ilustrasi; rel kereta las punya satu kandidat stok rel yang eksplisit dan topiknya telah dibahas dalam konten Indonesia. Kedua alternatif tidak dipilih sebagai jawaban utama untuk kebutuhan footage relevan.
