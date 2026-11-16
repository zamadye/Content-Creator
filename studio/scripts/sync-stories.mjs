#!/usr/bin/env node
/**
 * Menyusun `stories/packs.generated.js` dari isi folder `stories/`.
 *
 *   node scripts/sync-stories.mjs           # tulis ulang berkas
 *   node scripts/sync-stories.mjs --check   # gagal bila berkas basi
 *
 * Kenapa generate, bukan glob: proyek ini dibundel dua bundler (Vite untuk
 * preview, webpack milik Remotion untuk render). `import.meta.glob` hanya ada di
 * Vite dan `require.context` hanya di webpack, jadi daftar paket cerita dibuat
 * sebagai berkas JS statis — cara yang sama seperti `src/studio/registry.generated.js`.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storiesDir = path.join(root, 'stories');
const outFile = path.join(storiesDir, 'packs.generated.js');

const pascal = (dir) =>
  dir
    .split(/[-_.]/)
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');

const dirs = fs
  .readdirSync(storiesDir, {withFileTypes: true})
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(storiesDir, d.name, 'story.json')))
  .map((d) => d.name)
  .sort();

const imports = [];
const entries = [];
for (const dir of dirs) {
  const id = `story_${dir.replace(/[^a-z0-9]/gi, '_')}`;
  imports.push(`import ${id} from './${dir}/story.json';`);
  const hasCompositions = fs.existsSync(path.join(storiesDir, dir, 'compositions.jsx'));
  if (hasCompositions) imports.push(`import ${id}_compositions from './${dir}/compositions.jsx';`);
  entries.push(`  {dir: ${JSON.stringify(dir)}, compositionId: ${JSON.stringify(`Studio${pascal(dir)}`)}, story: ${id}, compositions: ${hasCompositions ? `${id}_compositions` : '[]'}},`);
}

const body = `// BERKAS INI DIHASILKAN OTOMATIS — jangan disunting tangan.
// Sumber: folder stories/<dir>/story.json · jalankan: npm run stories:sync
${imports.join('\n')}

export const storyPacks = [
${entries.join('\n')}
];

export const findStory = (id) => storyPacks.find((p) => p.dir === id || p.story.id === id);
export const packFor = (compositionId) => storyPacks.find((p) => p.compositionId === compositionId);
`;

const next = body;
const prev = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
if (process.argv.includes('--check')) {
  if (prev !== next) {
    console.error('stories/packs.generated.js basi — jalankan: npm run stories:sync');
    process.exit(1);
  }
  console.log(`${dirs.length} paket cerita sinkron: ${dirs.join(', ')}`);
  process.exit(0);
}
fs.writeFileSync(outFile, next);
console.log(`${dirs.length} paket cerita ditulis ke stories/packs.generated.js: ${dirs.join(', ')}`);
