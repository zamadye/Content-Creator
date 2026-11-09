# Tangga Itu Masih Licin — usulan arah konten

**DRAF EVALUASI PRIVAT, belum disetujui sebagai topik atau untuk produksi/tayang.** Cerita fiksi menguji apakah sebuah usul ditolak hanya karena orang yang mengusulkannya punya tunggakan. Pilihan topik dan alasannya ada di `evaluasi-arah.md`; batas konsep dan sumber ada di `riset-batas-fakta.md`.

- Master 39 scene, Short 15 scene yang diringkas dari momen penentu master. Kedua versi berbicara dengan penonton di dalam cerita, bukan meminta komentar. `short-sumber-master.json` melacak sumber adegan tanpa mengklaim Short adalah potongan teks identik.
- `author.py` menghasilkan naskah, brief, audit per kalimat, storyboard dan `objectMap`/metadata. `rencana-visual.md` merencanakan variasi shot, aksi dan objek; tidak ada video/audio/gambar final di folder ini.
- `caption-draf.txt` hanya draf empat platform. Penutup lama `ikuti knot theory` sengaja belum diputuskan karena arahan terbaru meminta diskusi berasal dari konten, bukan CTA; konfirmasi sebelum final.
- Hak/disclosure platform, voice-05, pembacaan keras, ritme, playback, uji audiens, persetujuan topik, dan persetujuan penjadwalan: **NOT TESTED / NEEDS REVIEW**. Fiksi harus diungkap sejak frame 0 dan di caption.

## Regenerasi dan pemeriksaan

```bash
python3 editorial-engine/content/tangga-masih-licin/author.py
python3 editorial-engine/content/tangga-masih-licin/test_author.py
python3 editorial-engine/pipeline/story-engine/story_gate.py --stage outline \
  --brief editorial-engine/content/tangga-masih-licin/brief.json \
  --script editorial-engine/content/tangga-masih-licin/master.script.json \
  --review editorial-engine/content/tangga-masih-licin/master.audit.json
python3 editorial-engine/pipeline/script-review/audit.py \
  --script editorial-engine/content/tangga-masih-licin/short.script.json \
  --review editorial-engine/content/tangga-masih-licin/short.audit.json
```

Kode pengarang dan tes memakai Python 3 standar, tanpa network dan tanpa rahasia. PDF review bisa dibuat secara privat dengan `reportlab==4.4.4` dan font Archivo yang tersedia di repo:

```bash
python3 -m pip install --target .scratch/tangga-deps 'reportlab==4.4.4'
PYTHONPATH=.scratch/tangga-deps python3 editorial-engine/content/tangga-masih-licin/build_review.py --out .scratch/evaluasi-tangga/Evaluasi-Arah-dan-Naskah-DRAF.pdf
```

Builder PDF menolak output di luar `.scratch`; ia tidak membuat media video/audio atau mengirim data. Dependensi yang belum terpasang, font hilang, output tidak diizinkan atau direktori tak dapat ditulis membuat builder gagal dan perlu diperbaiki sebelum membagikan PDF.

Pemeriksaan hanya mengukur struktur, kecocokan audit, rujukan Short dan jumlah/nama objek yang tertulis. Hasil `PASS` bukan bukti bahwa objek tampak berbeda, cerita menarik, sumber benar atau ada persetujuan manusia. Gate `prevoice` final tetap memerlukan bukti review manusia yang sah dan terikat hash. Belum ada video, audio atau gambar final yang dibuat, dan draf ini tidak menjadwalkan atau menerbitkan apa pun.
