# Satu Pesan, Dua Harapan — draf psikologi privat

**Status:** naskah dan storyboard draf; belum ada video/thumbnail/audio. Bukan materi siap tayang. Rani, Dimas dan pesannya adalah ilustrasi fiktif, bukan peserta penelitian. Lihat `riset-batas-fakta.md` untuk sumber primer, konteks dan batas.

- `naskah-master.md` dan `storyboard-master.md`: cerita panjang terlebih dulu.
- `naskah-short.md` dan `storyboard-short.md`: versi mandiri dari beat master; timing belum diukur.
- `visual-bergerak-dan-hak.md`: shot plan dan kandidat footage yang **belum diunduh/dicek/clearance**; tidak ada Coverr request baru.
- `caption-draf.txt`: usulan copy untuk FB, TikTok, YouTube dan IG untuk kedua versi.
- `author.py`: satu sumber editorial beranotasi per kalimat; menghasilkan naskah, audit, storyboard, brief dan metadata scene. Render belum ada.

## Jalankan pemeriksaan offline

```bash
python3 editorial-engine/content/pesan-dua-jam/author.py
python3 editorial-engine/pipeline/story-engine/story_gate.py --stage outline \
  --brief editorial-engine/content/pesan-dua-jam/brief.json \
  --script editorial-engine/content/pesan-dua-jam/master.script.json \
  --review editorial-engine/content/pesan-dua-jam/master.audit.json
python3 editorial-engine/pipeline/script-review/audit.py \
  --script editorial-engine/content/pesan-dua-jam/short.script.json \
  --review editorial-engine/content/pesan-dua-jam/short.audit.json
```

PASS hanya cakupan/struktur, bukan penilaian apakah cerita bagus, benar, relevan atau sah dipublikasikan. `prevoice` final membutuhkan receipt manusia independen yang mengikat hash tiga input; jangan mengisi sendiri sebagai lulus. Pilih footage yang relevan hanya setelah pemeriksaan hak/perwujudan; dokumentasikan perubahan, atribusi dan lokasi backup. Pertahankan catatan bahwa visual adalah ilustrasi dan hentikan unggah jika disclosure yang diwajibkan tidak jelas. Full playback/listening, subtitle dan platform overlay, fakta, hak, jadwal, izin rilis serta respons audiens masih **NOT TESTED**. Jangan membuat jadwal atau mengubah status publik tanpa persetujuan.

Opsional, buat PDF draf untuk review di folder lokal yang diabaikan Git:

```bash
python3 -m pip install --target .scratch/psych-tools 'reportlab==4.4.4'
PYTHONPATH=.scratch/psych-tools python3 editorial-engine/content/pesan-dua-jam/make_review_pdf.py
python3 editorial-engine/content/pesan-dua-jam/test_author.py
```

PDF hanya kompilasi naskah yang sudah dihasilkan, bukan pemeriksaan editorial atau izin publikasi. Output dibatasi ke `.scratch`. Durasi Short tidak bisa dipastikan dari jumlah kata; perlu audio dan pemeriksaan platform.
