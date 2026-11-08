# Review baseline perilaku — draf privat turbin angin

**Status: NEEDS REVIEW.** Ini penilaian kreatif awal dan usulan, bukan revisi video, persetujuan baru, atau hasil uji audiens. Draf tetap privat; tidak ada penjadwalan atau publikasi yang diizinkan oleh dokumen ini.

## Cakupan dan bukti

- Naskah 12 scene: `turbin-angin-draf-v1.json`, SHA-256 `777c93361de2177ac5345a2666c6c8fca911fefa27259e54d051165fc9fa5824`.
- Storyboard: `pipeline/turbin-angin-v1/shot-plan.json`, SHA-256 `5dfe816a640a3921e64ec4512a0549125fc3f14fdb062bc2843841771a62771c`.
- QA teknis draf privat dan frame terdekode yang diperiksa sebelumnya: MP4 SHA-256 `00382bb9c211bf963035cb8e1fb95734f7989382818ed52f2a4abaf9c4ac7ffe`. QA melaporkan cut visual pada 2,0 detik, sedangkan S02 baru dimulai pada 7,2 detik. Frame sampel dan perubahan gambar yang terukur bukan bukti reaksi audiens atau playback penuh.
- Audit teks per kalimat: pemeriksaan mekanis **PASS** untuk cakupan teks/kolom; kualitas manusia, respons audiens, fakta, dan hak tidak dinilai oleh alat tersebut.

**NOT TESTED:** playback audio-video penuh oleh manusia, pelafalan CTA dan keseimbangan musik, keterbacaan pada ponsel, sinkronisasi subtitle per kata, serta respons audiens. **NEEDS REVIEW:** hak/atribusi footage Coverr (tracking menghasilkan 404) dan review fakta ahli independen. Izin yang ada hanya untuk naskah/storyboard dan produksi draf privat.

## Peta perilaku saat ini

| Elemen | Yang benar-benar dirancang atau tercatat | Pertanyaan review |
|---|---|---|
| Pattern interrupt | Frame 0 menampilkan ilustrasi turbin dan headline “ANGIN KENCANG / TURBIN DIAM?”; naskah membuka dengan mesin yang bisa berhenti ketika angin terlalu kencang. | **NEEDS REVIEW:** apakah kontradiksi itu langsung jelas dan cukup menarik bagi orang yang belum tahu topik? Ini hipotesis, bukan bukti berhenti-scroll. |
| Cut vs pembuka | Cut cuplikan visual pada 2,0 detik, tetapi pertanyaan lisan berlanjut dan cerita S02 mulai 7,2 detik. | **NEEDS REVIEW:** seluruh pembuka lebih lama dari target kreatif 1–3 detik. Tonton dengan suara dan ukur versi baru jika dibuat; jangan menyebut cut 2 detik sebagai durasi seluruh hook. |
| Emosi | Pilihan yang sesuai: penasaran dan keheranan terhadap dugaan “lebih banyak angin berarti lebih banyak listrik”. S03 memakai payung sebagai analogi beban. | Tidak perlu memaksakan takut, shock, atau marah. Pastikan analogi bukan klaim bahwa payung dan turbin bekerja sama. |
| Petunjuk dan payoff | S04–S05 membedakan pengaturan daya dari berhenti; S06 menjelaskan sebagian turbin berhenti pada batas desain; S07 menggambarkan pitch; S09–S11 menjelaskan bahwa gambar turbin diam tidak memastikan penyebabnya. | **NEEDS REVIEW:** apakah hubungan pengaturan daya → batas operasi → berhenti mudah diikuti saat ditonton? Ilustrasi bukan diagnosis footage. |
| Friction komentar | S12 bertanya “Kalau cuma melihat turbin yang diam, tebakanmu apa?” Visual saat ini memberi pilihan angin pelan, perawatan, dan lainnya. | **NEEDS REVIEW:** apakah pertanyaannya terasa mudah dan sungguh mengundang dugaan, tanpa memberi kesan penyebab video stok sudah diketahui? |
| Nilai berbagi / replay | Kemungkinan nilai berbagi: intuisi awal dibalik dan gambar saja tidak cukup untuk menebak penyebab. Ilustrasi penampang menunjukkan perubahan sudut sebagai detail yang dapat diperiksa ulang. | **NOT TESTED:** apakah nilai itu cukup jelas untuk dibagikan, dan apakah gerak/detail terbaca dalam playback ponsel. |

## Usulan untuk review, bukan naskah baru yang disetujui

1. **Pembuka lebih padat:** “Angin makin kencang, kok turbin justru bisa berhenti?” Visual tetap ilustrasi turbin pada momen puncak; cut sebelum alasan, lalu masuk ke dugaan awal S02. Ini hanya kandidat: durasi voice belum diukur, kekuatan hook belum diuji, dan penjelasan model-spesifik tetap harus dipertahankan.
2. **Komentar dengan friction lebih kecil:** “Turbin diam: kamu tebak angin pelan, sedang dirawat, atau sebab lain? Tulis di komentar, dan ikuti knot theory.” Letakkan setelah penegasan bahwa gambar saja tidak memastikan penyebab. Pilihan “sebab lain” mencakup kemungkinan lain termasuk angin terlalu kencang; jangan menyebut salah satu pilihan sebagai diagnosis klip.
3. **Alternatif replay, bila detail terbukti terlihat:** “Di ilustrasi penampang tadi, yang berubah sudutnya atau ukurannya? Cek lagi, lalu ikuti knot theory.” Pakai hanya jika gerak sudut terbaca jelas di playback; ini alternatif untuk komentar, bukan tambahan wajib.
4. **Alternatif share:** “Punya teman yang penasaran kenapa turbin diam? Bagikan penjelasan ini, lalu ikuti knot theory.” Ini hipotesis nilai berbagi, bukan klaim penonton akan membagikannya.

Pilih satu aksi utama yang paling sesuai; jangan memasang ketiganya sekaligus. Opsi di atas perlu uji baca dan review. Jika naskah atau storyboard yang telah disetujui diubah, perbarui audit per kalimat, dapatkan review manusia untuk perubahan yang terdampak, lalu siapkan ulang voice/timing dan render privat sesuai gate hash; jangan menempelkan naskah usulan ke video lama dan menganggapnya sinkron.

## Cara menguji tanpa publikasi

Putar draf dengan suara kepada reviewer yang belum tahu topik, bila tersedia. Minta mereka menjelaskan pertanyaan awal, penyebab yang dipahami, perbedaan pengaturan daya dan shutdown, alasan turbin diam tidak dapat didiagnosis dari gambar, dan apakah ajakan di akhir mudah dijawab. Catat jumlah reviewer, perangkat, jawaban apa adanya dan bagian yang membingungkan. Gunakan **NOT TESTED** jika belum ada review; jangan mengarang reaksi. Setelah ada izin terbit, metrik yang tersedia dapat membantu membandingkan pola, tetapi tidak membuktikan satu sebab dari satu video.
