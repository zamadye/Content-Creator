# Referensi format — channel horor faceless

Catatan riset untuk mengkalibrasi THE LAST SIGNAL terhadap format yang benar-benar
bekerja di YouTube Shorts/TikTok, bukan terhadap selera kita sendiri.

## Temuan yang paling sering muncul

1. **Voice adalah brand, bukan visual.** Channel faceless horor besar (Mr. Nightmare,
   Lazy Masquerade, Nexpo, CreepsMcPasta) dibangun dari satu hal: narator yang
   konsisten. Visual mereka minimal dan murah. Penonton subscribe ke suara, bukan
   ke gambar. Implikasi: kalau episode kita tidak punya narasi bersuara, kita bukan
   channel horor — kita slideshow.
2. **Pacing lambat, bukan cepat.** Narator bagus justru melambat di momen penting dan
   memberi jeda setelah reveal. Tensi dibangun dari keheningan, bukan dari tempo.
3. **Anatomi Shorts horor:** hook 0–3 detik (satu detail konkret yang "salah"),
   konteks 4–15 detik, tanda pertama 15–25 detik, eskalasi 25–45 detik, payoff.
4. **Teks di layar berfungsi sebagai tanda baca ritme**, bukan pengganti narasi:
   kartu 2–3 kata ("JANGAN DIBUKA", "TERLALU LAMBAT", "TIDAK ADA SINYAL") dipakai
   untuk mengembalikan atensi saat masuk beat baru.
5. **Mayoritas penonton menonton tanpa suara pada detik pertama.** Subtitle bukan
   aksesibilitas tambahan — itu jalur utama penceritaan untuk penonton mute.
6. **AI voice bisa dipakai, tapi harus dikendalikan:** lebih dalam, lebih lambat,
   jeda di tempat yang tepat. AI voice "flat" muncul kalau dipakai dengan tempo
   seragam dari awal sampai akhir.

## Terjemahan ke aturan produksi THE LAST SIGNAL

| Temuan | Aturan keras di pipeline |
| --- | --- |
| Voice adalah brand | Narasi wajib ada sebelum QC lolos. Tidak ada episode tanpa narasi bersuara. |
| Pacing lambat | Narasi ~135–150 kata untuk 50 detik (≈2,7 kata/detik), bukan 170+. |
| Hook 0–3 detik | Narasi mulai ≤ 0,5 detik; kartu hook muncul 0–2 detik. |
| Eskalasi | Cut interval maksimum 3 detik; setelah detik ke-30 turun ke 2–2,5 detik. |
| Teks sebagai irama | Kartu on-screen 2–3 kata di titik balik cerita, maksimum 4 per episode. |
| Sound design | Audio harus audible di speaker HP: butuh konten mid/high, bukan hanya sub-bass. |
| Loudness | Master −14 LUFS, true peak −1,5 dBTP (standar platform). |
| Ukuran file | Delivery 1080×1920 30fps ≈ 5–6 Mbps (≈30–35 MB untuk 50 detik). |

## Sudut pandang narasi: "Bayangkan / Rasakan"

Narasi dokumenter ("Aku penjaga malam gedung ini…") menjelaskan. Narasi orang
kedua menempatkan penonton **di dalam** kejadian: "Bayangkan kamu jaga malam di
gedung yang sudah kosong…" — penonton dipaksa membayangkan dirinya di sana, dan
itu yang menghasilkan ketegangan, bukan informasi.

Aturan yang dipakai sekarang:

- Kalimat pertama wajib membuka dengan ajakan membayangkan/merasakan.
- Minimal satu instruksi sensorik per episode ("rasakan bulu tengkukmu berdiri").
- Subjek adalah "kamu", bukan "aku" — kecuali di akhir, saat posisi itu berbalik.
- Tidak ada kalimat yang menjelaskan latar belakang administratif (nama gedung,
  jam shift, prosedur); semua detail harus bisa dirasakan.

## Yang salah pada versi pertama (LS-0001 v1)

- **Tidak ada narasi bersuara.** Hanya ambience 40–55 Hz + beberapa SFX. Di speaker
  ponsel, 40 Hz praktis tidak terdengar → penonton menyimpulkan "tidak ada audio".
- **Satu gambar per scene (8–10 detik).** Walaupun kamera bergerak, tidak ada cut.
  Mata membaca "gambar diam yang di-zoom", bukan "rekaman yang diedit".
- **Master 25 Mbps → 153 MB**, delivery 8,9 Mbps → 54 MB. Untuk konten ber-grain,
  bitrate tinggi hanya membakar kuota upload; YouTube akan re-encode lagi.

## Catatan penting soal AI voice di cerita horor

Riset di atas konsisten: AI voice yang dipakai apa adanya (tempo datar, tanpa jeda)
terasa "flat". Karena itu pipeline harus memperlakukan TTS sebagai talent, bukan
fungsi: satu voice per channel, kecepatan per segmen bisa diatur, dan jeda ditulis
eksplisit di skrip (mis. "…" jadi 300–500 ms silence).
