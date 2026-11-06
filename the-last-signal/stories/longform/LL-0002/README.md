# LL-0002 — Dua Belas Meter

Video panjang pertama yang dibangun penuh dengan aturan `knowledge/ATURAN.md`.
Status: **naskah + peta visual siap, belum dirender, target unggah 7 Nov 2026 pukul 13.00 WIB (uji slot 12.00–18.00).**

| Berkas | Isi |
|---|---|
| `naskah.md` | narasi lengkap 9 segmen, 1.251 kata, ±9:29, plus fungsi tiap segmen dan tabel pembeda dari cerita hantu umum |
| `narration.json` | narasi terpecah per segmen siap masuk TTS (id, judul, paragraf, jumlah kata, estimasi detik) |
| `dossier.md` | 12 rujukan (R1–R12): prosedur BPN, letter C/Buku C, kasus patok Purbalingga, beban juru ukur, adat juru kunci makam |
| `visual-map.json` | 152 shot (rata-rata 3,8 detik/shot, tidak ada shot > 8 detik), tiap shot punya **kata pemicu** + offset 2–8 frame, palet & cahaya per segmen, 3 kemunculan entitas |

## Periksa sebelum lanjut

```bash
cd the-last-signal
node scripts/check-visual-triggers.mjs stories/longform/LL-0002 --strict
```

Perintah itu gagal kalau ada shot yang kata pemicunya tidak ada di narasi segmennya
(artinya gambar akan mendahului cerita), kalau entitas tidak muncul tepat 3 kali,
kalau ada shot yang bertahan lebih dari 8 detik, atau kalau tidak ada segmen terang.

## Struktur

| Segmen | Detik | Fungsi |
|---|---|---|
| 1 | 0:00–1:11 | **tiga detik pertama: "Kurang dua belas meter" + kartu layar KURANG 12 M²**; lalu identitas, uang, aturan patok, ayah berhenti jadi juru ukur |
| 2 | 0:59–2:18 | tawaran, harga Rp1,2 juta/m² (12 m² = Rp14 juta), tempat, berkas letter C |
| 3 | 2:18–2:56 | Mang Karta mengelak: "patoknya jangan di situ" |
| 4 | 2:56–4:15 | alat mati tanpa sebab; kemunculan entitas ke-1 (siluet jauh) |
| 5 | 4:15–5:23 | angka tetap kurang 12 m²; patok ke-4 pindah sendiri; entitas ke-2 (setengah badan) |
| 6 | 5:23–6:54 | Buku C, nama dicoret, catatan pensil "kurang 12" tulisan ayahnya, pengumuman 60 hari |
| 7 | 6:54–8:08 | sebab manusianya: makam dihapus supaya harga naik; Pak Hadi anak bungsu |
| 8 | 8:08–9:07 | menanam patok di tepi makam, berita acara, mengembalikan uang muka; entitas ke-3 (utuh) |
| 9 | 9:07–9:29 | pertanyaan ke penonton + ajakan |

## Keputusan yang belum diambil

1. **Suara narator** — pakai suara id-ID maskulin yang sama dengan LS-0010, atau pilih baru.
2. **Cara menjadwalkan** — berkas antrean Zernio sekarang dengan jadwal 7 Nov 09.00 WIB, atau tahan dan push workflow besok pagi.

## Batas

Cerita ini fiktif. Nama orang dan desa karangan. Yang nyata hanya prosedurnya —
lihat bagian "Batas klaim" di `dossier.md`.
