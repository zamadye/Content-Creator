# Tas yang Kukembalikan

Cerita animasi fiksi dari POV Maya, calon pembeli; Nisa adalah pembuat tas. Topiknya tetap rencana usaha dan belajar dari pengujian awal, tetapi tokoh, situasi, aset dan susunan cerita berbeda dari video referensi.

**Status:** draf privat, bukan izin tayang. Struktur master dan cakupan audit diperiksa secara mekanis; review manusia, fakta, hak, disclosure, prevoice, respons audiens dan rilis tetap **NOT TESTED**. Sebuah animatic privat boleh diuji, tetapi bukan final dan tidak boleh dijadwalkan.

`author.py` menghasilkan brief, naskah, audit kalimat, storyboard dan objectMap. `riset-dan-perbedaan-referensi.md` mendokumentasikan dasar riset, perbedaan referensi dan klaim yang ditahan. Caption untuk 4 platform ada di `caption-draf.txt`.

```bash
python3 editorial-engine/content/tas-yang-kukembalikan/author.py
python3 editorial-engine/pipeline/story-engine/story_gate.py --stage outline --brief editorial-engine/content/tas-yang-kukembalikan/brief.json --script editorial-engine/content/tas-yang-kukembalikan/master.script.json --review editorial-engine/content/tas-yang-kukembalikan/master.audit.json
python3 editorial-engine/pipeline/script-review/audit.py --script editorial-engine/content/tas-yang-kukembalikan/short.script.json --review editorial-engine/content/tas-yang-kukembalikan/short.audit.json
```

Untuk produksi final, gerbang `prevoice` memerlukan receipt review manusia independen yang terikat hash input. Belum ada receipt seperti itu. Original video referensi, voice, gambar dan media output **tidak** disimpan di Git. Jangan mengaktifkan publikasi bila disclosure platform belum jelas atau diwajibkan; jangan menyangkal penggunaan AI. Penjadwalan butuh persetujuan.
