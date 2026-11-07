# Awan 500 ton — revisi rig V2 (draft privat)

Revisi mandiri dari V1: sembilan adegan, satu rekaman narasi perempuan, satu
jam global untuk karakter/objek/subtitle/audio. Ini renderer React → SVG →
resvg → FFmpeg, bukan Remotion di browser. Asset audiovisual tidak disimpan di
Git. Tidak ada penjadwalan atau publikasi.

## Input yang harus dipulihkan secara privat

Tempatkan ZIP input privat di `deliverables/awan-rig-v2/01-INPUT-PRIVAT-RIG-V2.zip`, lalu jalankan `python3 pipeline/awan-rig-v2/restore-input.py`. Script membatasi entri dan memverifikasi CRC/SHA/narasi; ia menolak menimpa aset lokal berbeda. Hasilnya:

- `assets/generated/awan-rig-v2/rooftop.png`, `microcloud.png`, `rainstreet.png`
- `audio/voiceovers/awan-rig-v2/narasi-utuh.mp3` (SHA-256 diperiksa oleh `prepare.py`)
- Gunakan `content/recovered/awan-500-ton-rig-v2.json` dari source untuk narasi,
  pembagian adegan, objek dan referensi. Jangan mengganti isi narasi tanpa take baru.

## Jalankan dari direktori editorial-engine

```sh
python3 pipeline/awan-rig-v2/restore-input.py
npm ci
npm run fonts                  # hanya bila font TTF lokal belum ada
bash pipeline/awan-rig-v2/build.sh
```

Butuh Python 3, Node/npm, ruang disk dan CPU. Dependency menyediakan FFmpeg
statis. `prepare.py` memeriksa hash take, menghitung waktu dari durasi yang
didekode, memangkas border aset, membuat bed musik sintetis, SRT dan metadata.
`render.tsx` menghitung pose/objek berdasarkan satu waktu; dua slice hanya
pembagian kerja encoder dan disambung tanpa mengubah waktu. `write-deliverables.py`
membuat caption empat platform dan storyboard. Output diabaikan Git di
`deliverables/awan-rig-v2/`. Seluruh proses ini lokal dan non-publishing.

### Unit dan pemeriksaan

```sh
node --test pipeline/awan-rig-v2/test-rig.mjs
./node_modules/.bin/tsc --noEmit
```

Test memeriksa dua segmen IK, clamp, keberagaman pose, transformasi lokasi
pergelangan; **tidak membuktikan** keluwesan, kontak prop visual, atau lip sync.
Renderer membuat sample PNG, thumbnail, poster 4:5, SRT estimasi dan MP4 H.264/AAC.
Lihat QA hasil render untuk pemeriksaan aktual, bukan asumsi. Mulut bergerak
secara prosedural, bukan sinkron fonem; subtitle diperkirakan, bukan forced-aligned.
Mendengarkan suara/CTA, review hak pemakaian, playback mobile/platform,
gerakan penuh dan restore/render end-to-end dari instalasi baru tetap perlu
review sampai benar-benar diperiksa. Angka 500 ton adalah massa air satu contoh
USGS, bukan semua awan dan bukan massa udara. Skema visual bukan skala literal.

### Kegagalan yang umum

- Hash suara tak cocok: pulihkan take yang benar, jangan nonaktifkan verifikasi.
- Aset tidak ada: pulihkan ZIP privat; script tidak mengunduh aset.
- `tsx`/FFmpeg hilang: jalankan `npm ci` pada lingkungan yang mendukungnya.
- Satu slice gagal: tidak ada langkah assembly; baca log slice, perbaiki, dan
  ulangi render lokal. Jangan mengunggah file parsial.
- Font hilang: jalankan `npm run fonts` dan cek lisensi font dalam paket sumber.
