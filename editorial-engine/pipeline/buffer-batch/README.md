# Buffer: satu Action untuk satu batch

## Tujuan dan batas

Video yang siap dijadwalkan dikirim **sekarang** ke Buffer dengan `customScheduled` dan `dueAt`; Buffer yang menangani penayangan pada waktunya. Workflow `.github/workflows/buffer-batch-once.yml` **tidak memiliki cron** dan tidak harus hidup sampai waktu tayang. Tidak perlu PR ke `main`. Satu run dapat memproses sampai 100 post, tetapi membuat post tetap satu panggilan API **per kanal**; ini bukan jaminan semua post akan diterima.

**Pengujian:** 25 tes komponen, relay dan probe hanya-baca lokal `PASS`, termasuk satu batch sintetis 30 post. Action [simulasi 42427272855](https://github.com/zamadye/Content-Creator/actions/runs/42427272855) `PASS`: relay terenkripsi selesai dalam satu run, dua post palsu `NOT_ATTEMPTED`, dan tidak ada panggilan Buffer. Action [42427619479](https://github.com/zamadye/Content-Creator/actions/runs/42427619479) `PASS` untuk pembacaan kanal, seluruh antrean, validasi status/waktu dan satu `getPost` pada akun Buffer; tidak ada operasi tulis. **Create nyata, sumber media baru dan penerbitan terjadwal tetap `NOT TESTED`** untuk runner generik ini. Skrip historis untuk episode lama tidak boleh dipakai ulang: flag AI dan izin kedaluwarsa.

**Kapasitas:** [Buffer](https://support.buffer.com/article/643-how-many-posts-can-i-schedule-in-advance) menyebut paket Free maksimum 10 post terjadwal **per kanal** pada satu waktu; Essentials/Team 5.000 per kanal menurut dokumentasi saat ini. Akun pengguna belum dipastikan paketnya. Ada pula [rate limit API](https://developers.buffer.com/guides/api-limits.html). Kegagalan kapasitas/rate-limit bisa terjadi setelah sebagian batch diterima: status parsial harus direkonsiliasi sebelum pengiriman berikutnya.

**Video:** [Buffer API tidak menerima upload file langsung](https://developers.buffer.com/guides/hosting-media.html), melainkan URL HTTPS yang dapat diakses publik dan tetap hidup **sampai post terbit**. `scheduled` bukan bukti Buffer telah menyimpan byte video. Jangan hapus/tutup URL sumber sebelum seluruh post yang menggunakannya `sent` dan memiliki tautan, terlepas dari apakah media ada atau tidak di repo. Master dan cadangan tetap privat di Drive. Tautan Drive biasa atau redirect dapat gagal; hosting direct HTTPS lebih andal. Hash dan unduhan anonim yang lolos sekarang tidak menjamin URL tetap tersedia nanti. Membuka **salinan** publik memerlukan izin terpisah; jangan membuka master. Jangan memasukkan URL, ID media, caption, jadwal privat, token atau video ke Git/log publik.

## Data privat dan gerbang

1. Siapkan video dan paket di Drive privat, lakukan QA fakta, hak, teknis serta pemeriksaan manusia penuh. Untuk naskah baru/revisi, QA manusia mencakup [audit per kalimat dan psikologi penonton](../../docs/STANDAR-NASKAH-PSIKOLOGI-PENONTON.md); `PASS` harus berasal dari review nyata, bukan dibuat otomatis. Bila ada `FAIL`, `NEEDS REVIEW` atau pemeriksaan wajib `NOT TESTED`, jangan kirim. Respons audiens aktual dicatat terpisah dan tidak diasumsikan; pemeriksaan mekanis tidak membuktikannya.
2. Pastikan tanggal/jam WIB dan kanal yang dimaksud jelas, jarak semua posting minimal dua jam, sumber media adalah salinan berizin yang stabil, dan aturan label AI telah ditinjau per platform. Workflow ini mendukung Facebook Reel dan YouTube; TikTok/Instagram memerlukan pengembangan dan tes tersendiri. Tidak ada pengecualian waktu otomatis: bila pengguna menyetujui pengecualian baru, implementasi harus disesuaikan dan dites dahulu.
3. Buat JSON **hanya dalam** `editorial-engine/deliverables/buffer-batch/private/` (diabaikan Git), misalnya dengan bentuk berikut. Nilai contoh dalam kurung adalah deskripsi, bukan ID, URL atau jadwal nyata. `prepare.mjs` membuat nonce; tidak perlu menaruh nonce sendiri.

```json
{
  "schemaVersion": 1,
  "action": "schedule",
  "authorization": { "scheduleApproved": true },
  "videos": [{
    "id": "video-a",
    "url": "https://res.cloudinary.com/APPROVED-DIRECT-MEDIA",
    "sha256": "64-lowercase-hex-characters-from-real-file",
    "sizeBytes": 12345678,
    "publicCopyApproved": true,
    "aiAssisted": true,
    "qa": { "facts": "PASS", "rights": "PASS", "technical": "PASS", "human": "PASS" },
    "disclosure": { "facebook": "optional", "youtube": "optional" }
  }],
  "posts": [{
    "id": "post-a", "videoId": "video-a", "platform": "youtube",
    "channelId": "ID-DARI-DAFTAR-KANAL-BUFFER", "dueAt": "YYYY-MM-DDTHH:mm:ss+07:00",
    "title": "Judul video", "text": "Caption yang sudah diperiksa"
  }]
}
```

`publicCopyApproved` harus benar-benar sesuai persetujuan, dan `disclosure` hanya `optional` bila tinjauan aturan platform mendukungnya. Bila wajib atau tidak jelas, hentikan dan minta keputusan. `aiAssisted` menyatakan bantuan AI, bukan sakelar label publik; jangan isi `false` bila tidak benar. Jangan memasukkan salinan yang belum disetujui. Durasi/ukuran bukan hanya klaim dalam JSON: Action mengunduh salinan anonim ke file sementara, memeriksa SHA-256, ukuran, ffprobe, audio, rasio vertikal, dan batas durasi, lalu menghapus file sementara. Drive/Cloudinary/R2 dibatasi daftar host yang diizinkan; perlu pengujian lagi pada host nyata.

## Menjalankan satu batch

Untuk operator/agen; jangan jalankan perintah ini bila belum ada input nyata yang telah disetujui. Pastikan branch dan index benar, tidak ada batch lain yang sedang berjalan, serta file privat tidak ditambahkan ke Git.

1. `node editorial-engine/pipeline/buffer-batch/prepare.mjs <input-privat.json>` memvalidasi input, membuat direktori sesi privat berisi permintaan dan private key mode 0600, dan menulis `.github/buffer-batch-trigger.json`. Trigger hanya berisi nonce, hash, public key dan mode, **bukan jadwal/caption/URL**. Hash mencakup salt acak yang tetap berada dalam request terenkripsi agar isi tidak mudah ditebak dari hash publik. Catat path `session` yang dicetak. Untuk uji sintetis tanpa Buffer gunakan action `preflight` dan tambahkan `--simulate`.
2. Pastikan tidak ada staged change lain. Tinjau dan commit **hanya** trigger nonrahasia dengan pesan `[buffer-batch]`, lalu `git push origin arena/54cb36c6-content-creator`. Ini memulai **satu** Action dan menghasilkan public key sementara di check-run `Buffer batch secure input`. Catat commit SHA pemicu.
3. `node editorial-engine/pipeline/buffer-batch/seal.mjs <session> <trigger-sha>` menunggu check-run GitHub Actions pada commit tersebut, mengenkripsi request, lalu menaruh ciphertext sebagai **unreferenced Git blob**. Hanya SHA ciphertext dan nonce dikirim balik sebagai pesan commit kosong yang dicetak oleh perintah. Pastikan index kosong, buat commit kosong dengan pesan itu, lalu push ke branch sesi. Commit ini tidak mengubah trigger dan tidak memulai Action kedua. Ciphertext bisa tetap ada di object storage GitHub sampai garbage collection; kunci dekripsi runner bersifat sementara, dan tidak ada request plaintext dalam tree/repo. Jangan mencetak file input privat.
4. Action memeriksa seluruh kanal, antrean, jeda, media dan payload sebelum create pertama; kemudian mengecek ulang antrean dan batas waktu sebelum setiap create, mengirim post satu per satu, dan membaca ulang setiap ID/waktu/status. Ia mencatat `CREATE_IN_PROGRESS` sebelum setiap request, dan berhenti pada hasil meragukan—tidak retry otomatis. Pemeriksaan ini mengurangi tetapi tidak dapat meniadakan race bila orang lain mengubah antrean langsung di Buffer saat batch berjalan; hindari perubahan bersamaan. Hasil dienkripsi dengan public key pemilik dan dipancarkan sebagai annotations. Tidak ada konten privat dalam log plaintext.
5. Setelah run selesai, ambil job `batch` dengan `gh api repos/zamadye/Content-Creator/actions/runs/<RUN_ID>/jobs`, lalu ambil annotations melalui `gh api repos/zamadye/Content-Creator/check-runs/<JOB_ID>/annotations?per_page=100` ke `<session>/annotations.json`. Jalankan `node editorial-engine/pipeline/buffer-batch/decrypt-report.mjs <session>/annotations.json <session>/owner-private.pem <session>/report.json`. Periksa report secara privat, simpan hasil/manifest ke Drive privat, lalu hapus private key dan plaintext sementara bila tidak diperlukan. Jangan mencetak report ke log publik.

`SUBMITTED` berarti semua record terbaca kembali sebagai `scheduled`, **bukan** sudah tayang atau terbukti media tersalin. `PREFLIGHT_PASS` tidak membuat post. `STOPPED_BEFORE_CREATION` tidak menjadwalkan apa pun; `PARTIAL_OR_UNCERTAIN`, `CREATE_IN_PROGRESS`, `CREATE_UNCERTAIN` atau `CREATED_NOT_VERIFIED` memerlukan pemeriksaan read-only pada Buffer sebelum langkah lain. Tidak adanya report berarti `UNKNOWN`, bukan aman untuk retry.

## Sebelum mencabut akses salinan

Setelah waktu tayang, lakukan pemeriksaan Buffer read-only yang baru dan lengkap, lalu siapkan file privat dengan `retrievedAt`, `allDependenciesKnown: true`, `expectedPostIds` untuk **semua** post yang memakai salinan, dan `observedPosts` berisi masing-masing `id`, `status`, serta `externalLink`. Jalankan `node editorial-engine/pipeline/buffer-batch/check-release.mjs <file-privat.json>`. Guard menolak data lebih dari 15 menit, daftar tidak lengkap, status selain `sent`, atau tautan kosong. `PASS` hanyalah izin untuk mempertimbangkan pencabutan; periksa juga keterkaitan seluruh post dan izin Drive. Guard tidak menghapus file atau mencegah orang lain menghapusnya di luar alur.

## Snapshot kanal dan antrean hanya-baca

`snapshot-readonly.mjs` menggunakan `BufferAdapter.listChannels()` dan `listPosts()` saja pada organisasi yang dipilih oleh `BUFFER_ORGANIZATION_ID` (atau satu-satunya organisasi yang terlihat). Ia **tidak** memanggil create, update, delete, publish ataupun dry-run. Hasil meliputi kanal dan status koneksinya, hitungan semua status, serta maksimal 200 post aktif/baru terkirim; `relevantTruncated: true` berarti ringkasan tidak lengkap. Caption tidak disertakan. Ini **bukan** pemeriksaan penuh semua organisasi, pengesahan video, pemeriksaan duplikasi, atau preflight saat penjadwalan; daftar antrean perlu dibaca ulang secara lengkap sebelum menulis.

Untuk menjalankannya secara privat di repo publik, buat pasangan RSA sementara: simpan kunci privat hanya di direktori `editorial-engine/deliverables/buffer-batch/private/` yang diabaikan Git, lalu tulis public key base64, nonce acak, `operation: buffer-channels-readonly` dan `readOnly: true` ke `.github/analytics-readonly-request.json`. Commit hanya permintaan nonrahasia itu dengan penanda `[buffer-channels-readonly]` dan push branch sesi. Job `channels-snapshot` pada `buffer-performance-readonly.yml` mengenkripsi hasil sebelum anotasi Actions; jangan pernah mencetak output mentah, ID kanal atau waktu antrean pada log publik. Dekripsi memakai `decrypt-report.mjs` di direktori privat. Bila job gagal atau tidak ada laporan yang terbaca, status akun adalah `UNKNOWN`, bukan bukti kanal tidak tersambung. Laporan `PASS` berarti pembacaan berhasil saja; dapat menjadi kedaluwarsa segera setelah kanal/antrean berubah.

## Tes lokal

```bash
node --test editorial-engine/pipeline/tests/buffer-batch.test.mjs \
            editorial-engine/pipeline/tests/buffer-batch-relay.test.mjs \
            editorial-engine/pipeline/tests/buffer-batch-probe.test.mjs \
            editorial-engine/pipeline/tests/buffer-snapshot-readonly.test.mjs
```

Tes menggunakan input/gateway sintetis: tidak menghubungi Buffer, tidak memverifikasi hak, kualitas kreatif atau masa berlaku URL, dan tidak membuktikan jadwal sungguhan sudah masuk. Catat tiap post hanya sebagai `scheduled`/`sent` jika benar-benar dibaca kembali dari layanan.
