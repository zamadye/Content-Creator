// BERKAS INI DIHASILKAN OTOMATIS — jangan disunting tangan.
// Sumber: folder stories/<dir>/story.json · jalankan: npm run stories:sync
import story_bel_terakhir from './bel-terakhir/story.json';
import story_contoh_kenney from './contoh-kenney/story.json';
import story_contoh_naskah from './contoh-naskah/story.json';
import story_duduk_sore from './duduk-sore/story.json';
import story_jalan_pulang from './jalan-pulang/story.json';
import story_jalan_pulang_compositions from './jalan-pulang/compositions.jsx';
import story_uji_kamera from './uji-kamera/story.json';
import story_uji_karakter from './uji-karakter/story.json';
import story_warung_malam from './warung-malam/story.json';

export const storyPacks = [
  {dir: "bel-terakhir", compositionId: "StudioBelTerakhir", story: story_bel_terakhir, compositions: []},
  {dir: "contoh-kenney", compositionId: "StudioContohKenney", story: story_contoh_kenney, compositions: []},
  {dir: "contoh-naskah", compositionId: "StudioContohNaskah", story: story_contoh_naskah, compositions: []},
  {dir: "duduk-sore", compositionId: "StudioDudukSore", story: story_duduk_sore, compositions: []},
  {dir: "jalan-pulang", compositionId: "StudioJalanPulang", story: story_jalan_pulang, compositions: story_jalan_pulang_compositions},
  {dir: "uji-kamera", compositionId: "StudioUjiKamera", story: story_uji_kamera, compositions: []},
  {dir: "uji-karakter", compositionId: "StudioUjiKarakter", story: story_uji_karakter, compositions: []},
  {dir: "warung-malam", compositionId: "StudioWarungMalam", story: story_warung_malam, compositions: []},
];

export const findStory = (id) => storyPacks.find((p) => p.dir === id || p.story.id === id);
export const packFor = (compositionId) => storyPacks.find((p) => p.compositionId === compositionId);
