#!/usr/bin/env node
/**
 * Menyalin `public/library/index.json` (pustaka properti Kenney) menjadi modul
 * yang bisa di-import bundler: `src/studio/props.generated.js`.
 *
 *   node scripts/sync-library.mjs           # tulis ulang
 *   node scripts/sync-library.mjs --check   # gagal bila basi
 *
 * Cerita boleh memakai id properti apa pun dari pustaka ini (`kenney.<kit>.<nama>`)
 * tanpa menyentuh kode — sama seperti aset katalog sendiri.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexFile = path.join(root, 'public', 'library', 'index.json');
const outFile = path.join(root, 'src', 'studio', 'props.generated.js');

if (!fs.existsSync(indexFile)) {
  console.error('public/library/index.json belum ada — jalankan: python3 studio-forge/kenney_import.py --build');
  process.exit(2);
}
const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const props = {};
for (const p of index.props) {
  props[p.id] = {
    category: 'library',
    kit: p.kit,
    title: p.title,
    uri: p.path,
    thumbnail: p.thumbnail,
    bounds: p.bounds,
    tris: p.tris,
    verts: p.verts,
    materials: p.materials,
    flat: p.flat,
    license: p.license,
    source: p.source,
    status: 'review',
  };
}

const body = `// BERKAS INI DIHASILKAN OTOMATIS — jangan disunting tangan.
// Sumber: public/library/index.json · jalankan: npm run library:sync
// ${Object.keys(props).length} properti pihak ketiga (Kenney, CC0-1.0).
const PROPS = ${JSON.stringify(props, null, 1)};

export default PROPS;
`;

const prev = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
if (process.argv.includes('--check')) {
  if (prev !== body) {
    console.error('src/studio/props.generated.js basi — jalankan: npm run library:sync');
    process.exit(1);
  }
  console.log(`${Object.keys(props).length} properti pustaka sinkron`);
  process.exit(0);
}
fs.writeFileSync(outFile, body);
console.log(`${Object.keys(props).length} properti pustaka ditulis ke src/studio/props.generated.js`);
