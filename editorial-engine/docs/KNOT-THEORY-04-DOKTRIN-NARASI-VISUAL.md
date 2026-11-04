# DOKTRIN NARASI & VISUAL KNOT THEORY (WAJIB — berlaku untuk semua misi)

Sumber: arahan pemilik kanal, 4 Nov 2026. Status: **BINDING**. Semua misi berikutnya dinilai terhadap dokumen ini.

## 1. Hukum objek: setiap kalimat wajib punya bendanya
Kalau narasi menyebut sesuatu, **benda itu harus ada di layar**. Bukan suasana, bukan abstraksi.

| Narasi menyebut | Yang harus tampil |
|---|---|
| petani, padi | batang padi, sawah, caping, cangkul |
| sepatu | sepatu (bentuk sepatu, bukan kotak) |
| tekstil | rol kain, gulungan benang, kain terjuntai |
| garmen | mesin jahit, pola kain, jarum |
| kontrak harian | lembar kontrak dengan tanda tangan |
| pekerja informal | gerobak, ojek, lapak, tanpa seragam |
| mengundurkan diri | surat pengunduran diri |
| PHK | kardus barang bawaan, papan pengumuman, gerbang pabrik |
| angka/statistik | papan angka, berkas menumpuk, meteran |

Aturan turunan:
- **Setiap scene minimal punya 2 objek konkret** yang disebut narasi — bukan hanya teks besar.
- Teks besar boleh ada, tetapi harus **ditemani gambarnya**. Kata "SEPATU" tanpa gambar sepatu = gagal.
- Objek digambar datar (vektor), siluet jelas, terbaca dalam 1 detik di layar HP.
- Jangan ganti objek dengan ikon generik (kotak, panah) bila benda nyata bisa digambar.

## 2. Hukum kalimat: komunikasi = transformasi, bukan informasi
Setiap kalimat harus mengubah cara pandang penonton, bukan sekadar menambah data.

Uji setiap kalimat dengan 4 pertanyaan:
1. **Apa yang penonton percaya sebelum kalimat ini?**
2. **Apa yang dia percaya sesudahnya?**
3. Kalau jawabannya sama → kalimat itu **bukan narasi, hanya keterangan** → tulis ulang atau buang.
4. Apakah ada **kata benda konkret** di dalamnya? Kalau tidak, kemungkinan besar kalimat itu kabur.

Pola yang dipakai:
- **Kontras** ("Pemerintah menghitung yang melapor. Bukan yang kehilangan kerja.")
- **Pembalikan** ("Bukan kegagalan program. Definisinya.")
- **Angka yang mengejutkan, lalu dijelaskan** ("Satu bulan: 8.547 orang.")
- **Tuduhan yang ditarik kembali dengan bukti** (hindari tuduhan tanpa dasar).

Dilarang: kalimat administratif ("Hal ini disebabkan oleh..."), kalimat berlapis-lapis, istilah yang tidak dijelaskan.

## 3. Hukum hook: 2 detik pertama harus "liar"
Hook bukan ringkasan. Hook adalah **kejutan + teka-teki** yang membuat orang berhenti menggeser layar.

Formula hook yang boleh dipakai:
- **Kejutan angka**: "18 ribu orang hilang dari catatan negara."
- **Paradoks**: "Negara bilang 72 ribu. Serikat bilang 90 ribu. Dua-duanya resmi."
- **Tuduhan yang langsung diberi alibi**: "Ini bukan salah hitung. Ini cara menghitungnya."
- **Adegan ganjil**: gerbang pabrik dengan tumpukan kardus dan satu papan bertuliskan angka.

Syarat mutlak: **liar tetapi bisa dipertanggungjawabkan**. Tidak boleh menuduh tanpa sumber, tidak boleh angka palsu. Liar itu soal sudut pandang, bukan soal mengarang.

## 4. Tiga hal yang menentukan ditonton atau tidak
Urutan prioritas: **(1) headline, (2) tagline, (3) frame pertama**.
- Headline: maksimal 4 kata, mengejutkan, terbaca di thumbnail.
- Tagline: satu baris, menjelaskan teka-teki headline, bukan mengulanginya.
- Frame pertama: headline + tagline + satu objek konkret, semuanya **terbaca penuh di frame 0** (tanpa fade-in) karena frame 0 = thumbnail.

## 5. Cara mengukur (dari data kanal)
Data awal kanal (YouTube Shorts, 4 Nov 2026): 360x, 24x, 41x ditonton pada tiga video pertama. Sampel masih terlalu kecil untuk kesimpulan gaya, jadi uji dilakukan per elemen:
- Uji A: hook angka vs hook paradoks.
- Uji B: objek konkret vs teks saja pada scene yang sama.
- Satu variabel per uji. Catat hasilnya di `content/kb/knot-theory.jsonl` pada field `lessons`.

## 6. Checklist sebelum render (gate baru)
- [ ] Setiap kalimat narasi punya objek konkret di scene-nya (tabel narasi→objek diisi di storyboard).
- [ ] Setiap scene minimal 2 objek konkret yang disebut narasi.
- [ ] Hook memenuhi formula kejutan/paradoks dan tetap faktual.
- [ ] Headline ≤ 4 kata; tagline menjelaskan, tidak mengulang.
- [ ] Frame 0 lengkap (headline + tagline + objek).
- [ ] Tidak ada kata besar tanpa gambar bendanya.

Tabel **narasi → objek** wajib ada di setiap `storyboard.json` (field `objectMap`), dan direview sebelum VO dibuat.

## 7. Catatan dari data kanal (screenshot YouTube Studio, 4 Nov 2026)
Yang terlihat pada 5 Shorts terbit: 360x ditonton (video defisit/APBN), lalu 24x (judol) dan 41x (karhutla).
Sampel 5 video terlalu kecil untuk menyimpulkan gaya mana yang menang, jadi **jangan** menyimpulkan "gaya kertas lebih baik" hanya dari ini.
Yang boleh diuji sebagai hipotesis (satu variabel per uji):
- H1: hook berupa paradoks angka menahan penonton lebih lama daripada hook deskriptif.
- H2: scene dengan benda konkret (padi, sepatu, rol kain) menahan penonton lebih lama daripada scene berisi teks besar saja.
- H3: kejelasan teks di frame pertama menaikkan klik dari feed.
Catat hasil tiap uji di `content/kb/knot-theory.jsonl` field `lessons`, lalu pakai untuk episode berikutnya.

## 8. Larangan
- Jangan menulis kalimat yang hanya mengulang angka tanpa mengubah pemahaman.
- Jangan memakai kata besar di layar tanpa gambar bendanya.
- Jangan memakai hook sensasional yang tidak bisa dibuktikan sumbernya.

## 9. Catatan teknis publikasi (ditemukan saat tayang 4 Nov 2026)
- `publish-buffer.mjs` memecah caption pada baris yang **hanya** berisi karakter `=`; header gaya `=== NAMA ===` tidak terbaca. Format aman: satu baris `========`, lalu nama platform, lalu `========`, lalu isi.
- **YouTube menolak** deskripsi berisi `<` atau `>` ("YouTube description cannot contain < or > characters"). Tulis "di atas 90 ribu", bukan `>90.000`.
- Bila satu platform gagal setelah yang lain terkirim, kirim ulang **hanya platform yang gagal** — jangan mengulang semuanya, karena `posts create` tidak idempoten.
