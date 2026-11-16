#!/usr/bin/env node
// Render stills sungguhan lewat Chromium + WebGL2 (ANGLE/SwiftShader).
//
//   npm run shots:webgl                      # 6 shot pilihan → docs/webgl-shots/
//   node scripts/qc-webgl-shots.mjs --all    # semua komposisi Studio*
//
// Beda dengan `qc:framing` (renderer perangkat lunak di Python) dan thumbnail
// katalog: di sini pikselnya benar-benar keluar dari WebGL2 di Chromium, jadi
// ini bukti bahwa registry, material, rig, kamera, dan komposisi Remotion
// bekerja di browser — bukan hanya di hitungan Node.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = path.resolve(root, '..', '.studio-tools');
const exe = path.join(tools, 'chromium');
const outDir = path.join(root, 'docs', 'webgl-shots');

if (!fs.existsSync(exe)) {
  console.error(`Chromium belum di-unpack: ${exe}\nJalankan: npm ci && npm run extract:chromium`);
  process.exit(2);
}

const env = {
  ...process.env,
  LD_LIBRARY_PATH: `${tools}:${tools}/al2023/lib:${tools}/swiftshader${process.env.LD_LIBRARY_PATH ? `:${process.env.LD_LIBRARY_PATH}` : ''}`,
};
const FLAGS = JSON.stringify({
  'enable-unsafe-swiftshader': true,
  'use-angle': 'swiftshader',
  'ignore-gpu-blocklist': true,
  'disable-gpu-sandbox': true,
});

const scale = Number(process.argv.find((a) => a.startsWith('--scale='))?.split('=')[1] ?? 0.4);
const SHOTS = [
  ['ModularStage', 45],
  ['StudioUjiKamera', 300],
  ['StudioJalanPulang', 350],
  ['StudioWarungMalam', 220],
  ['WarungLit', 90],
  ['EntityRigStudy', 60],
];

fs.mkdirSync(outDir, {recursive: true});

function renderStill(id, frame) {
  const output = path.join(outDir, `${id}-f${frame}.png`);
  execFileSync(
    'npx',
    [
      'remotion', 'still', 'src/index.jsx', id, output,
      `--frame=${frame}`,
      `--scale=${scale}`,
      `--browser-executable=${exe}`,
      '--gl=angle',
      `--chromium-flags=${FLAGS}`,
      '--log=error',
    ],
    {cwd: root, env, stdio: ['ignore', 'ignore', 'inherit'], timeout: 900000},
  );
  return output;
}

const t0 = Date.now();
const shots = process.argv.includes('--all')
  ? execFileSync('npx', ['remotion', 'compositions', 'src/index.jsx', '--browser-executable=' + exe, '--gl=angle', '--log=error'], {
      cwd: root,
      env,
      encoding: 'utf8',
    })
      .split('\n')
      .map((l) => l.trim().split(/\s+/))
      .filter((c) => c[0]?.startsWith('Studio'))
      .map((c) => [c[0], Math.floor(Number(c[3]) / 2)])
  : SHOTS;

for (const [id, frame] of shots) {
  const out = renderStill(id, frame);
  console.log(`✓ ${id} frame ${frame} → ${path.relative(root, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} kB)`);
}
console.log(`${shots.length} shot WebGL dalam ${((Date.now() - t0) / 1000).toFixed(1)} s · skala ${scale}`);
