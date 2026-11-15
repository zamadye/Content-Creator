/**
 * Audit UV (langkah 17).
 *
 *   node scripts/qc-uv.mjs --write   # tulis ulang tabel di docs/UV-PACKING.md
 *   node scripts/qc-uv.mjs           # periksa: tumpang tindih tak sengaja + tabel basi
 *
 * Klasifikasi per aset:
 *   rapat       atlas di 0..1, tumpang tindih ≤ 5 % (jahitan tersembunyi)
 *   daur-ulang  tumpang tindih disengaja: wilayah UV dipakai ulang bilangan bulat ≥ 2×
 *               (kiri/kanan cermin, kaki kursi berulang)
 *   tiling      UV di luar 0..1 = pemetaan ruang-objek (kotak/tabung), memang berulang
 *   tabrakan    tumpang tindih berantakan → satu-satunya yang dianggap masalah
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {registry} from '../src/studio/library.js';
import {measureGlb} from './lib/topology.mjs';
import {measureUv, primKind, uvStats} from './lib/uv.mjs';


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docPath = path.join(root, 'docs', 'UV-PACKING.md');
const BEGIN = '<!-- BEGIN:uv -->';
const END = '<!-- END:uv -->';

/** Kepadatan texel minimum yang dianggap layak untuk tampilan 1080p. */
export const MIN_DENSITY = 100;

const rows = Object.entries(registry.assets)
  .map(([id, entry]) => {
    const topo = measureGlb(path.join(root, 'public', entry.uri));
    const uv = measureUv(path.join(root, 'public', entry.uri), topo.maxTex || 512);
    return {id, category: entry.category, topo, uv};
  })
  .sort((a, b) => a.id.localeCompare(b.id));

export function uvTable() {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  const out = [
    line(['aset', 'kat.', 'prim', 'atlas', 'cakupan', 'tumpang', 'pemakaian', 'tex', 'px/m', 'kelas']),
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const r of rows) {
    out.push(
      line([
        `\`${r.id}\``,
        r.category,
        r.uv.prims,
        r.uv.atlasedPrims,
        r.uv.coverage ? `${Math.round(r.uv.coverage * 100)}%` : '—',
        `${(r.uv.overlap * 100).toFixed(1)}%`,
        r.uv.kind === 'tiling' ? 'tiling' : `${r.uv.reuse.toFixed(1)}×`,
        r.topo.maxTex || '—',
        Math.round(r.uv.density),
        r.uv.kind,
      ]),
    );
  }
  return out.join('\n');
}

export function summary() {
  const kinds = {};
  for (const r of rows) kinds[r.uv.kind] = (kinds[r.uv.kind] ?? 0) + 1;
  const dens = rows.map((r) => r.uv.density).sort((a, b) => a - b);
  return {
    kinds,
    minDensity: dens[0],
    minDensityAt: rows.find((r) => r.uv.density === dens[0])?.id,
    maxDensity: dens[dens.length - 1],
    atlased: rows.filter((r) => r.uv.kind !== 'tiling').length,
  };
}

/** Masalah nyata: tumpang tindih tak sengaja atau texel terlalu kasar. */
export function uvProblems(list = rows) {
  const out = [];
  for (const r of list) {
    if (r.uv.kind === 'tabrakan') {
      out.push(`${r.id}: tumpang tindih UV tak sengaja ${(r.uv.overlap * 100).toFixed(1)}%`);
    }
    if (r.uv.density < MIN_DENSITY) out.push(`${r.id}: ${Math.round(r.uv.density)} px/m < ${MIN_DENSITY}`);
  }
  return out;
}

function main() {
  const write = process.argv.includes('--write');
  const s = summary();
  console.log(
    `kelas UV: ${Object.entries(s.kinds).map(([k, v]) => `${k} ${v}`).join(' · ')} · ` +
      `${s.atlased} aset ber-atlas`,
  );
  console.log(
    `kepadatan texel: ${Math.round(s.minDensity)} px/m (${s.minDensityAt}) … ${Math.round(s.maxDensity)} px/m`,
  );

  if (write) {
    const md = fs.readFileSync(docPath, 'utf8');
    const a = md.indexOf(BEGIN);
    const b = md.indexOf(END);
    if (a < 0 || b < 0) throw new Error('penanda BEGIN/END tidak ada di docs/UV-PACKING.md');
    fs.writeFileSync(docPath, md.slice(0, a + BEGIN.length) + '\n\n' + uvTable() + '\n\n' + md.slice(b));
    console.log('\ntabel ditulis ulang di docs/UV-PACKING.md');
    return;
  }

  const problems = uvProblems();
  const md = fs.readFileSync(docPath, 'utf8');
  if (!md.includes(uvTable())) problems.push('docs/UV-PACKING.md: tabel UV basi (jalankan dengan --write)');
  if (problems.length) {
    console.log('\nMASALAH:');
    for (const p of problems) console.log(`  ! ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`\n${rows.length} aset · 0 tabrakan · 0 texel di bawah ${MIN_DENSITY} px/m · dokumen sinkron`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
