# Pilot Antartika — revisi interaktif v2

**Status: DRAFT UNTUK REVIEW; jangan jadwalkan/publikasikan.** Ini satu pilot baru, bukan overwrite video Danau, Titik Buta, atau delapan draft yang ditahan. Pengguna perlu meninjau hasil sebelum produksi lain dilanjutkan. Tidak ada akses Buffer/Drive atau penjadwalan di skrip ini.

## Desain dan batas

`content/recovered/antartika-revisi-interaktif.json` menyimpan riset primer NASA/British Antarctic Survey, narasi, sembilan adegan, batas klaim, object map, dan tindakan adegan. `host.tsx` mengadaptasi rig Host asli dari cadangan privat Danau/Titik Buta: bentuk wajah, hijab, warna dan pakaian; ada penambahan sepatu yang bergerak saat berjalan. `render.tsx` menambahkan tindakan dan objek spesifik (termasuk lup yang dipegang, meter presipitasi, perbandingan wilayah, lapisan es dan pertanyaan penutup). Ini bukan video asli yang dulu hilang. Lingkungan merupakan ilustrasi AI, grafik skematik tidak berskala, tanpa logo resmi; musik dan aksen tonal disintesis sendiri.

`prepare.py` mendekode sembilan segmen voice-05 ke PCM lalu merakit **satu master narasi**. `prepared.json` memiliki satu timeline: offset adegan dihitung dari jumlah sampel aktual dan mengatur animasi, scene switch, audio, serta subtitle. Panjang video mengikuti narasi, bukan dibatasi target durasi tetap. Pemisahan kalimat subtitle dibuat manual, sedangkan waktu per frasa **perkiraan** dari panjang teks dan jeda; bukan forced alignment. Dengarkan dan koreksi sebelum publikasi. `render.tsx` memproduksi 30 frame independen/detik, diraster dengan resvg lalu di-encode sekali secara kontinu via FFmpeg. `captions.py` membuat empat caption. `qa.py` hanya mengecek hal mekanis; ia tidak menggantikan peninjauan kreatif, audio, sinkronisasi kata, hak, dan pemutaran ponsel.

## Input / output

- Input privat: arsip Drive `01-INPUT-PRIVAT-REV2.zip` memuat 3 PNG lingkungan, 9 MP3 segmen, naskah/storyboard, dan manifest SHA-256. Jangan commit media ke repo publik.
- Input kode: branch sesi, lockfile Node, font yang sudah ada di repo. Gunakan lingkungan Linux x64 dengan Python 3, Node/npm dan dependency dari `npm ci`. FFmpeg/ffprobe yang dipakai berasal dari paket di lockfile; lisensi FFmpeg dan model/aset harus diperiksa terpisah sebelum penggunaan komersial.
- Output privat di `editorial-engine/deliverables/interactive-revision-2026-11-11/antartika/`: MP4, PNG thumbnail tersendiri (bukan screenshot), TXT caption empat platform, SRT perkiraan, master narasi MP3/WAV, musik WAV, still QA, `QA-DAN-SUMBER.md`, dan SHA-256. Tidak semua file antara merupakan deliverable final.

## Pemulihan dan eksekusi lokal

1. Checkout branch sesi dan commit yang dicatat dalam laporan QA. Unduh arsip input privat ke `editorial-engine/deliverables/interactive-revision-2026-11-11/antartika/01-INPUT-PRIVAT-REV2.zip`.
2. Jalankan dari root repo (pemeriksaan manifest membatasi nama yang diekstrak; gagal jika naskah Git dan naskah dalam arsip berbeda):

```bash
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile
import hashlib,json
root=Path('editorial-engine')
zpath=root/'deliverables/interactive-revision-2026-11-11/antartika/01-INPUT-PRIVAT-REV2.zip'
out_art=root/'assets/generated/interactive-revision-2026-11-11/antartika'
out_voice=root/'audio/voiceovers/interactive-revision-2026-11-11/antartika'
with ZipFile(zpath) as z:
    assert z.testzip() is None
    manifest=json.loads(z.read('MANIFEST-SHA256.json'))
    expected={f'gambar/{n}.png' for n in ('hero','station','layers')} | {f'narasi-segmen/A{i:02}.mp3' for i in range(1,10)} | {'naskah-storyboard.json'}
    assert set(manifest)==expected and set(z.namelist())==expected|{'MANIFEST-SHA256.json'}
    for name,digest in manifest.items():
        assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
    assert z.read('naskah-storyboard.json')==(root/'content/recovered/antartika-revisi-interaktif.json').read_bytes()
    out_art.mkdir(parents=True,exist_ok=True);out_voice.mkdir(parents=True,exist_ok=True)
    for name in expected:
        if name.startswith('gambar/'): (out_art/Path(name).name).write_bytes(z.read(name))
        if name.startswith('narasi-segmen/'): (out_voice/Path(name).name).write_bytes(z.read(name))
print('Input privat dan naskah diverifikasi')
PY
cd editorial-engine
npm ci
bash pipeline/interactive-antartika-v2/build.sh
```

Render satu episode 1080×1920 30fps memerlukan waktu/CPU/disk yang cukup; non-GPU dan tanpa browser. `npm ci` dapat memerlukan internet registry. Jika terhenti, MP4 parsial **bukan** hasil akhir: jalankan ulang setelah memeriksa penyebab; jangan unggah sebagai final. Output dapat berbeda byte antarplatform/versi codec dan perlu QA ulang. Pemulihan utuh lalu render ulang dari Drive **belum diuji** sampai dilaporkan secara terpisah. Hak/izin model suara dan citra, mendengar audio, sinkronisasi dan persetujuan kreatif tetap NEEDS REVIEW.
