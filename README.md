# Content-Creator

Kerangka produksi video cerita 3D: **naskah → shot → render**, dengan aset yang
dibangun sendiri secara prosedural dan properti pendukung dari pustaka CC0.

```
studio/            kerangka + toolchain (React/Remotion/three.js + Python forge)
  stories/         paket cerita: satu folder = satu cerita
  public/assets/   52 aset katalog buatan sendiri (registry.json)
  public/library/  102 properti Kenney CC0 (index.json)
  docs/            FRAMEWORK, STORY-FORMAT, LIBRARY, CHROMIUM, PIPELINE-AUDIT, STATUS
*.md               catatan pengetahuan produksi (storytelling, editing, audio, dst.)
```

Mulai dari sini:

* `studio/docs/FRAMEWORK.md` — struktur dan cara menambah cerita
* `studio/docs/STORY-FORMAT.md` — kontrak `studio.story/2`
* `studio/docs/LIBRARY.md` — pustaka properti CC0 dan aturan pemakaiannya
* `studio/docs/STATUS.md` — apa yang sudah terbukti, apa yang belum

Perintah tercepat:

```bash
cd studio
npm ci && npm run extract:chromium      # Chromium + WebGL2 (lihat docs/CHROMIUM.md)
npm run studio:validate                 # validasi semua paket cerita
npm run test:studio                     # gerbang mutu
STUDIO_COMPOSITION=StudioJalanPulang npm run render:studio:h264
```
