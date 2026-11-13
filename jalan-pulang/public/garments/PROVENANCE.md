# Pakaian MakeHuman yang dipakai dalam studi rig

- Sumber: [VRM Avatar Maker](https://github.com/ffunch/vrm-avatar-maker), commit `46c185c8e94e01efb013e56cc9480ba7e9208e0d`, folder `web/assets/items` dan `web/assets/textures`. README dan ASSETS.md sumber menyebut aset avatar CC0; generator kredit mereka menyatakan memeriksa lisensi setiap aset.
- `namuhekam_male_polo_shirt`: Polo shirt, Namuhekam, CC0 menurut `ASSETS.md`.
- `cortu_cargo_pants`: Cargo trousers, Cortu Johnstone, CC0 menurut `ASSETS.md`.
- `shoes01`: seri sepatu MakeHuman, MakeHuman team, CC0 menurut `ASSETS.md`.
- JSON runtime dihasilkan dengan `scripts/build-garments.py` dari parameter `.mhclo` terkemas dan base/weights MakeHuman yang dijelaskan di `public/makehuman/PROVENANCE.md`. Fitting berbobot 3 vertex dan transfer bobot skeleton menghasilkan mesh UV-skinned; bukan simulasi pakaian. Texture warna berasal dari aset tersebut. Tidak ada peta normal/roughness scan khusus pakaian, material roughness masih seragam.
- Berkas sumber kompres dan base berada di `assets/` yang diabaikan Git; output runtime dan tekstur disimpan di `public/garments/` sehingga tidak dibutuhkan untuk render. Asal dan klaim lisensi berasal dari README dan katalog perantara tersebut; pertahankan catatan ini, lakukan verifikasi lebih lanjut sebelum publikasi bila perlu.
- Pakaian digunakan untuk rig berdiri dan studi gudang/lalu lintas; adegan duduk masih menggunakan proxy sebelumnya. Pakaian belum diverifikasi pada semua pose; fitting dan clipping, karakter Dimas dan entitas tetap WIP.
- `male_casualsuit05`: jaket dan jeans satu mesh, MakeHuman team, CC0 menurut `pipeline/catalog.json` dan `ASSETS.md` pada commit sumber yang sama. Tekstur warna dan geometri UV-skinned dijalankan bersama sepatu; fitting pose dan perpotongan pada siku, duduk, dan sendi masih harus diperiksa. Ini mendekati kebutuhan jaket Dimas, bukan scan jaket kustom.
