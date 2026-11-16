/**
 * Titik masuk paket cerita.
 *
 * Daftar paket di-*generate* oleh `npm run stories:sync` menjadi
 * `packs.generated.js` (bukan glob), karena proyek ini dibundel dua bundler:
 * Vite (preview) dan webpack (Remotion). Lihat `scripts/sync-stories.mjs`.
 *
 * Bentuk satu paket:
 *   stories/<dir>/story.json        naskah terstruktur (skema studio.story/2)
 *   stories/<dir>/compositions.jsx  opsional: komposisi manual khas cerita
 *   stories/<dir>/naskah/           opsional: naskah markdown sumber
 */
export {storyPacks, findStory, packFor} from './packs.generated.js';
