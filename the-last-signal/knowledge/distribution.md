# Distribusi — dua platform dalam satu push

Sejak 5 November 2026 setiap berkas antrean yang dilepas menerbitkan **satu
post ke dua platform sekaligus**: kanal YouTube THE LAST SIGNAL dan Halaman
Facebook-nya. Keduanya dibuat lewat satu panggilan `createPost` di
`tools/publish/zernio-publish.mjs`, bukan dua proses terpisah — kalau medianya
cuma diunggah sekali, tidak ada peluang dua platform menunjuk berkas berbeda.

## Bagaimana target ditentukan

| Platform | Cara menentukan akun | Bentuk yang dipakai |
|---|---|---|
| YouTube | `vars.ZERNIO_YOUTUBE_ACCOUNT_ID` → `accountId` di antrean → akun `youtube` aktif pertama | selalu video biasa |
| Facebook | `vars.ZERNIO_FACEBOOK_ACCOUNT_ID` → `facebookAccountId` di antrean → akun `facebook` aktif pertama | `reel` kalau 9:16 dan 3–90 s; selain itu video feed |

Pencarian otomatis penting: Halaman Facebook yang baru disambungkan di Zernio
langsung terpakai tanpa mengubah kode atau menyalin ID ke variabel repo.

Diverifikasi 5 November 2026 lewat workflow Diagnostik Zernio (anotasi
check-run, karena log mentah tidak terbaca dari sandbox):

    Akun: platform=facebook username=The Last Signal id=6aeca976… status=active
    Akun: platform=youtube  username=thelastsignal-id    id=6ae9fd7d… status=active

Artinya token Actions memang melihat Halaman itu, dan variabel repo
`ZERNIO_FACEBOOK_ACCOUNT_ID` tidak wajib diisi (token Arena yang dipakai di
sandbox tidak punya izin menulis variables — autodiscovery yang jadi jalur
utama, bukan jalan darurat).

## Batas Reels Meta

Meta mendokumentasikan Reels **3–90 detik, video vertikal 9:16**. SDK Zernio
tidak memeriksa durasi di sisi mereka, jadi pemeriksaannya ada di gerbang QC
kita: berkas vertikal ≤ 90 s dikirim dengan `contentType: "reel"` dan
`isAiGenerated: false` (label AI Meta tidak dipakai sejak 2026-11-06); di luar itu dikirim sebagai
video feed biasa.

Konsekuensi yang harus disadari: **episode panjang (LL-####, 16:9, ±9 menit)
tidak bisa jadi Reel.** Ia terbit di Facebook sebagai video feed. Kalau nanti
ingin episode panjang juga masuk Reels, yang dibutuhkan adalah potongan vertikal
terpisah 60–90 detik — belum ada di pipeline, dan itu pekerjaan render
tersendiri, bukan sekadar penanda di antrean.

## Kaption

Kaption Facebook dibuat dari deskripsi YouTube dengan dua pembuangan:
blok bab waktu (`00:00 …`) dan baris hashtag lama. Alasannya praktis: bab waktu
hanya berguna di YouTube, dan di feed Facebook tujuh baris angka menunda
kalimat pembuka cerita. Hashtag ditulis ulang tiga tag saja.

Tidak ada kalimat pengungkapan di kaption Facebook: label arsip dan pernyataan
sejenis dilarang sejak 2026-11-06 (lihat `knowledge/ATURAN.md` bagian VI).

## Status dan kegagalan

`PUBLISH-RESULT` sekarang memuat `youtube` dan `facebook` terpisah
(`enabled`, `mode`, `postId`, `url`, `status`, `ok`).

Aturan yang dipilih: **kegagalan Facebook tidak membatalkan keberhasilan
YouTube.** YouTube adalah kanal utama dan tidak boleh ikut gagal karena satu
API Meta menolak; tetapi kegagalan itu tidak disembunyikan — ia muncul sebagai
`::warning::` di check-run dan `result.facebook.ok === false` di laporan.
Sebaliknya kegagalan YouTube tetap menggagalkan seluruh job.

## Cara menguji tanpa menyentuh jaringan

Zernio tidak terjangkau dari sandbox, jadi pengujian lokal memakai stub
`@zernio/node` di `tools/publish/node_modules/` (di-ignore git) plus preload
yang mengganti `globalThis.fetch`. Yang diperiksa: susunan payload
`platforms[]`, mode Reel vs feed, dan pemisahan hasil per platform. Stub harus
dihapus setelah uji — kalau tertinggal, unggahan "sukses" padahal tidak ada
apa pun yang dikirim.

## Jebakan yang sudah kena: status terbit tidak bisa ditulis dari runner

`zernio-publish.yml` memakai `permissions: contents: read`. Artinya langkah di
dalam runner **tidak bisa** meng-commit `knowledge/fb-reels-state.json`.
Akibatnya pada 6 November 2026 status LS-0005 tertulis `error` selama hampir
satu jam padahal Reel-nya sudah terbit (09:33:51Z, `reel/1002441906232966`);
run-nya sukses, laporannya hanya tidak pernah tersimpan.

Cara membaca kebenaran sekarang: jalankan **Diagnostik Zernio**
(`zernio-posts.mjs --limit 8`), lalu baca anotasi `POST-<id>` lewat
`gh run view <run-id>`. Anotasi itu memuat `metadata.episodeId`, waktu terbit,
dan URL per platform — cukup untuk memastikan mana yang benar-benar tayang dan
mendeteksi duplikat.

Dua konsekuensi yang harus diingat:

1. Jangan percaya `knowledge/fb-reels-state.json` sebagai sumber tunggal;
   setelah run panjang, periksa daftar post sebelum menyusun ulang antrean.
2. Berkas antrean yang sudah dieksekusi harus ditutup (`status: published` +
   `url`). Berkas `requested` yang tertinggal akan dianggap permintaan baru
   oleh jadwal backfill berikutnya dan berakhir sebagai duplikat.

## Label AI di platform: TIDAK dicentang (keputusan 2026-11-06)

Arahan pemilik kanal:

> "Jangan centang label AI pada kedua platform, karena kita memakai Remotion dan
> tools lain untuk membangun kode, naskah, dan seterusnya — ada unsur manusia di
> dalamnya. Label AI itu untuk video yang 100% di-generate otomatis oleh AI video,
> bukan yang ditulis per scene."

Yang dikirim sekarang:

| Platform | Field | Nilai |
|---|---|---|
| YouTube | `containsSyntheticMedia` (kotak *altered content*) | **false** |
| Facebook Reel | `isAiGenerated` (label *AI generated*) | **false** |

Bersama itu, larangan teks tetap berlaku: tidak ada "ARSIP FIKSI", "dibuat dengan
bantuan AI", atau "adalah fiksi" di judul, deskripsi, komentar, maupun frame
(ditegakkan `check-copy.mjs` dan gerbang `zernio-publish.mjs`).

### Catatan yang harus diingat

- `publishing.syntheticDisclosure` di `episode.json` **bukan** label platform. Itu
  catatan internal bahwa gambarnya dibuat dengan bantuan AI — dipakai supaya kita
  sendiri tidak lupa, dan tidak pernah dikirim ke mana pun.
- Untuk video yang **sudah** tayang sebelum 2026-11-06, label terpasang saat
  unggah dan tidak bisa dilepas lewat API. Perubahan hanya berlaku untuk unggahan
  berikutnya; kalau label lama ingin dihapus, jalurnya manual di YouTube Studio
  dan Meta Business Suite.
- Kalau nanti ada episode yang seluruh visualnya hasil generate video utuh (bukan
  gambar per scene), keputusan ini perlu ditinjau ulang: di situ label memang
  tempatnya.
