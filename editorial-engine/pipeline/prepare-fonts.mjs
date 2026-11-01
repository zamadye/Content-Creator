#!/usr/bin/env node
/**
 * Font preparation.
 *
 * The render backend (resvg) needs real font files; @fontsource ships woff2.
 * We decompress woff2 -> ttf once and write a manifest the renderer and the
 * Remotion project both read, so the same font files are used everywhere.
 *
 * Input : node_modules/@fontsource/{instrument-serif,archivo}/files/*.woff2
 * Output: assets/fonts/*.ttf + assets/fonts/fonts.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import wawoff2 from 'wawoff2';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/fonts');
fs.mkdirSync(outDir, { recursive: true });

const wanted = [
  { pkg: '@fontsource/instrument-serif', file: 'instrument-serif-latin-400-normal.woff2', family: 'Instrument Serif', weight: 400, style: 'normal' },
  { pkg: '@fontsource/instrument-serif', file: 'instrument-serif-latin-400-italic.woff2', family: 'Instrument Serif', weight: 400, style: 'italic' },
  { pkg: '@fontsource/archivo', file: 'archivo-latin-400-normal.woff2', family: 'Archivo', weight: 400, style: 'normal' },
  { pkg: '@fontsource/archivo', file: 'archivo-latin-500-normal.woff2', family: 'Archivo', weight: 500, style: 'normal' },
  { pkg: '@fontsource/archivo', file: 'archivo-latin-600-normal.woff2', family: 'Archivo', weight: 600, style: 'normal' },
  { pkg: '@fontsource/archivo', file: 'archivo-latin-700-normal.woff2', family: 'Archivo', weight: 700, style: 'normal' },
];

const manifest = [];
for (const w of wanted) {
  const src = path.join(root, 'node_modules', w.pkg, 'files', w.file);
  if (!fs.existsSync(src)) {
    console.error(`MISSING ${src} — run npm install first`);
    process.exit(1);
  }
  const woff2 = fs.readFileSync(src);
  const ttf = Buffer.from(await wawoff2.decompress(woff2));
  const outName = w.file.replace('.woff2', '.ttf');
  fs.writeFileSync(path.join(outDir, outName), ttf);
  manifest.push({ ...w, path: `assets/fonts/${outName}`, bytes: ttf.length });
  console.log(`${outName.padEnd(46)} ${(ttf.length / 1024).toFixed(1)} KB`);
}

fs.writeFileSync(path.join(outDir, 'fonts.json'), JSON.stringify({ generatedAt: new Date().toISOString(), fonts: manifest }, null, 2));
console.log(`\nmanifest -> assets/fonts/fonts.json (${manifest.length} faces)`);
