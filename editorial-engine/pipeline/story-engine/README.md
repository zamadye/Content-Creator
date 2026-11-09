# Story gate — preflight cerita panjang

Alat offline dengan Python 3 standar. Ia **memeriksa bentuk**, bukan apakah cerita sungguh menarik atau benar. Tidak menghasilkan video, tidak tersambung ke Buffer, dan **belum terhubung otomatis ke pipeline episode lama**. Untuk produksi baru, pipeline yang dibangun harus memanggil tahap `prevoice` sebagai perintah wajib sebelum voice/render final, berhenti bila exit code bukan 0, lalu menjalankan gate manusia/teknis terpisah. Integrasi ke pipeline long-form yang sesungguhnya **NOT TESTED / belum dibuat**; jangan mengklaim pipeline lama sudah dilindungi alat ini.

## Input dan isian

1. Salin `brief.template.json` ke tempat kerja privat dan isi seluruh kolom. Templat sengaja kosong dan harus gagal sampai diisi. `truthMode` adalah `fact` atau `fiction`; fiksi memerlukan `fictionDisclosure`. Isi `sources` dengan URL, klaim dan batas jika faktual, serta `sourceIds` pada setiap beat faktual. Penggunaan URL tidak memverifikasi isinya.
2. `beats` berisi ID unik dan `kind`: `context`, `disruption`, dua `escalation`, `crisis`, `climax`, `consequence`, `payoff`, serta `turning_point` yang boleh terjadi sebelum atau sesudah klimaks fisik, tetapi setelah gangguan dan sebelum payoff. Tiap beat menyatakan keadaan sebelum, kejadian, keadaan sesudah, sebab ke langkah berikut, dan hipotesis emosi. `turn.clueBeatId` harus sebelum `revealBeatId`; itu tidak membuktikan twist adil.
3. `hook.climaxBeatId` menunjuk beat klimaks yang dicuplik; `answerBeatId` menunjuk jawaban. Waktu visual dan seluruh kalimat lisan masing-masing angka detik hasil pengukuran, atau `null` bila belum ada. Keduanya target kreatif 1–3 detik: di luar itu `NEEDS REVIEW`, bukan bukti salah atau alasan mempercepat suara.
4. `interactions.comment` menunjuk **momen isi**, bukan CTA; jelaskan dua posisi berbeda yang tidak menciptakan keseimbangan palsu. `share` menunjukkan penerima dan nilai; `follow` menjelaskan janji serial dan alasan kembali. Ketiga field itu merupakan metadata perencanaan dan **tidak mewajibkan permintaan komentar/share/follow dalam narasi**. Untuk penutup brand lama, konfirmasi pemilik sebelum final; lihat [arahan terbaru](../../docs/PANDUAN-ARAH-OBROLAN-EVALUASI.md). `shortPlan` harus menunjuk beat krisis, klimaks, perubahan atau akibat serta mencatat konteks, konflik mini, payoff, dan risiko distorsi.
5. Untuk `prevoice`, siapkan JSON naskah `id` + `scenes[]` seperti dijelaskan pada [audit kalimat](../script-review/README.md), dan audit per kalimat sesuai schema itu. `brief.scriptId` harus cocok. `scenePlan` mencakup seluruh scene secara berurutan, termasuk yang tanpa suara; masing-masing menunjuk beat dan memiliki `objectMap` dengan minimal dua objek bernama berbeda dan tindakan.

Niat, pilihan, hubungan sebab-akibat, kecukupan bukti, kejelasan bahasa dan dampak emosi tetap harus ditinjau orang. Tulisan generik panjang dapat lolos cek isian; tool ini tidak memahami apakah isinya bermakna.

## Tahap outline

```bash
python3 editorial-engine/pipeline/story-engine/story_gate.py \
  --stage outline --brief /path/private/brief.json
```

`mechanical: PASS` berarti format, urutan dasar dan referensi ID yang dicek ada, bukan berarti outline telah lolos review. Belum perlu script atau receipt untuk tahap ini. `story_quality`, `audience_response`, `facts_and_rights`, dan `release_authorization` selalu `NOT TESTED` bagi alat ini.

## Tahap sebelum voice final

Siapkan **receipt privat kosong**, kemudian reviewer sungguhan menilai dan mengisinya. Perintah ini tidak melakukan review dan menolak menimpa receipt yang sudah ada:

```bash
python3 editorial-engine/pipeline/story-engine/create_review_receipt.py \
  --brief /path/private/brief.json --script /path/private/script.json \
  --review /path/private/sentence-audit.json --output /path/private/human-review.json
```

Receipt awal mengikat SHA-256 ketiga file dan menandai semua kriteria `NOT TESTED`. Reviewer mencatat peran, waktu yang benar, metode, lokasi bukti privat, dan hasil/evidence untuk setiap kriteria: `causality`, `stakes_and_payoff`, `emotion_and_discussion`, `source_boundaries`, `sentence_audit`. Hanya isi `PASS` setelah penilaian nyata. Jika ada `FAIL`, `NEEDS REVIEW`, atau `NOT TESTED`, revisi/tinjau lagi; jangan dipaksa lulus. Jangan menulis identitas pribadi, isi analitik privat, atau rahasia ke repo publik.

```bash
python3 editorial-engine/pipeline/story-engine/story_gate.py --stage prevoice \
  --brief /path/private/brief.json --script /path/private/script.json \
  --review /path/private/sentence-audit.json --human-review /path/private/human-review.json
```

Tahap ini memeriksa scene + objek, menjalankan pemeriksa audit kalimat, meminta catatan manusia dengan semua kriteria `PASS`, dan membandingkan hash seluruh byte input dengan receipt. Jika naskah, audit, atau brief berubah—bahkan hanya format JSON—buat receipt baru dan ulangi review terdampak. Tool tidak memverifikasi identitas atau isi review; `RECORDED (NOT INDEPENDENTLY VERIFIED)` hanya berarti tanda tangan isian dan hash lengkap. Tinjauan orang yang belum tahu cerita, pemutaran penuh, fakta/hak, disclosure, QA final, backup dan persetujuan publikasi tetap wajib secara terpisah. Rough/animatic privat untuk mencari feedback dapat dibuat sebelum seluruh gate final, tetapi tidak boleh disebut siap tayang.

Untuk memasukkan pemeriksaan dalam perintah pipeline baru, gunakan wrapper fail-closed di depan perintah produksi yang akan dibuat:

```bash
python3 editorial-engine/pipeline/story-engine/run_after_story_gate.py \
  --brief /path/private/brief.json --script /path/private/script.json \
  --review /path/private/sentence-audit.json --human-review /path/private/human-review.json \
  -- python3 /path/to/new-long-form-renderer.py
```

Jika preflight gagal, perintah setelah `--` tidak dijalankan; jika sukses, exit code perintah diteruskan. Wrapper tidak memakai shell untuk menjalankan argumen, bukan sandbox, dan tidak mencegah input berubah sesudah pemeriksaan. Tidak ada renderer long-form yang sudah diintegrasikan; contoh di atas adalah cara integrasi, **bukan** perintah renderer yang tersedia.

## Kode keluar dan masalah

- `0`: pemeriksaan mekanis tahap yang diminta lulus; **bukan** persetujuan kreatif/publikasi. Waktu opening masih dapat `NOT TESTED`/`NEEDS REVIEW` dan perlu ditinjau.
- `1`: struktur, cakupan, hash, atau catatan `PASS` yang diperlukan belum lengkap/cocok; jangan lanjut ke tahap yang bergantung padanya.
- `2`: JSON tidak dapat dibaca/parse atau pasangan argumen tidak lengkap.

Source atau beat ID salah: cocokkan `sources`, `sourceIds`, `beats` dan `scenePlan`. Objek satu saja/duplikat: lengkapi objek dan tindakan, lalu nilai fungsinya secara manusia. Audit kalimat tidak cocok: perbarui audit sesuai naskah aktual, jangan mengedit naskah hanya supaya angka lulus. Receipt lama berbeda hash: ulangi proses review. Kekuatan diskusi, twist, emosi, waktu, hak dan pengalaman audiens tidak dapat diselesaikan oleh isian semata.

```bash
python3 editorial-engine/pipeline/story-engine/test_story_gate.py
python3 editorial-engine/pipeline/script-review/test-audit.py
```

Tes memakai data sintetis; hasilnya membuktikan perilaku program yang diuji, bukan kualitas episode nyata. Lihat [sistem cerita](../../docs/SISTEM-CERITA-LONG-FORM.md) dan [audit penerapan](../../docs/AUDIT-ATURAN-DAN-PENERAPAN.md).
