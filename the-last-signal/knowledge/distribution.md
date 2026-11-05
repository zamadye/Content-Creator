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
`isAiGenerated: true` (label AI Meta untuk Reels); di luar itu dikirim sebagai
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

Pengungkapan fiksi + AI tetap ikut — sama seperti YouTube, karena itu juga
kewajiban saat video sintetis disebar ke feed.

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
