// BERKAS INI DIHASILKAN OTOMATIS — jangan disunting tangan.
// Sumber: folder stories/<dir>/story.json · jalankan: npm run stories:sync
import story_saldo_8_juta from './saldo-8-juta/story.json';

export const storyPacks = [
  {dir: "saldo-8-juta", compositionId: "StudioSaldo8Juta", story: story_saldo_8_juta, compositions: []},
];

export const findStory = (id) => storyPacks.find((p) => p.dir === id || p.story.id === id);
export const packFor = (compositionId) => storyPacks.find((p) => p.compositionId === compositionId);
