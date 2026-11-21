/**
 * Rencana & pagar topologi (langkah 8).
 *
 *   node scripts/qc-topology.mjs --write   # tulis ulang tabel di docs/TOPOLOGY-PLAN.md
 *   node scripts/qc-topology.mjs           # periksa: anggaran, registry, dan kesegaran dokumen
 *
 * Angka diukur langsung dari GLB (bukan dari registry), lalu dicocokkan dengan
 * registry dan dengan tabel di dokumen. Kalau salah satunya melenceng, keluar 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {registry} from '../src/studio/library.js';
import {compileStory} from '../src/studio/compile.js';
import {BUDGETS, SHOT_TRI_BUDGET, measureRegistry} from './lib/topology.mjs';

/** Story 2D (sprite + Remotion) tidak punya kamera 3D — lewati di QC 3D. */
function is3dStoryFile(file) {
  try {
    return !String(JSON.parse(fs.readFileSync(file, 'utf8')).schema ?? '').startsWith('studio.story2d');
  } catch {
    return true;
  }
}


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docPath = path.join(root, 'docs', 'TOPOLOGY-PLAN.md');
const BEGIN = '<!-- BEGIN:assets -->';
const END = '<!-- END:assets -->';

const assets = measureRegistry(registry, root);
export const ids = Object.keys(assets).sort();

export function assetTable() {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  const rows = [
    line(['aset', 'kat.', 'tri', 'vert', 'prim', 'mat', 'tex', 'tulang', 'anggaran', 'pakai']),
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const id of ids) {
    const a = assets[id];
    const b = BUDGETS[a.category];
    const pct = Math.round((a.tris / b.tris) * 100);
    rows.push(
      line([
        `\`${id}\``,
        a.category,
        a.tris,
        a.verts,
        a.prims,
        a.materials,
        a.maxTex,
        a.joints || '—',
        b.tris,
        `${pct}%`,
      ]),
    );
  }
  return rows.join('\n');
}

/** Ringkasan per kategori + anggaran shot. */
export function summary() {
  const per = {};
  for (const id of ids) {
    const a = assets[id];
    const b = BUDGETS[a.category];
    const s = (per[a.category] ??= {n: 0, tris: 0, max: 0, maxId: '', budget: b.tris, tex: 0});
    s.n += 1;
    s.tris += a.tris;
    s.tex = Math.max(s.tex, a.maxTex);
    if (a.tris > s.max) {
      s.max = a.tris;
      s.maxId = id;
    }
  }
  return per;
}

/** Shot terberat dari seluruh cerita (aset yang tampil bersamaan). */
export function heaviestShot(stories) {
  let best = {tris: 0, where: '', ids: []};
  for (const {file, story} of stories) {
    const compiled = compileStory(story, {registry});
    for (const shot of compiled.shots) {
      const used = [
        ...shot.set.filter((s) => !s.hidden).map((s) => s.asset),
        ...shot.objectPlacements.filter((o) => !o.hidden).map((o) => o.assetId),
        ...shot.cast.filter((c) => !c.hidden).map((c) => c.assetId),
      ];
      const tris = used.reduce((n, id) => n + (registry.assets[id]?.tris ?? 0), 0);
      if (tris > best.tris) best = {tris, where: `${path.basename(file, '.json')}/${shot.id}`, ids: used};
    }
  }
  return best;
}

export function stories() {
  // Satu naskah produksi = `stories/<dir>/story.json` (dulu `stories/studio/*.json`).
  return fs
    .readdirSync(path.join(root, 'stories'), {withFileTypes: true})
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, 'stories', d.name, 'story.json')))
    .map((d) => path.join(root, 'stories', d.name, 'story.json'))
        .filter(is3dStoryFile)
    .sort()
    .map((file) => ({file: path.relative(path.join(root, 'stories'), file), story: JSON.parse(fs.readFileSync(file, 'utf8'))}));
}

/** Pelanggaran anggaran untuk sembarang peta aset (dipakai juga oleh tes). */
export function budgetProblems(map, budgets = BUDGETS) {
  const out = [];
  for (const [id, a] of Object.entries(map)) {
    const b = budgets[a.category];
    if (!b) {
      out.push(`${id}: kategori ${a.category} tidak punya anggaran`);
      continue;
    }
    if (a.tris > b.tris) out.push(`${id}: ${a.tris} tri > anggaran ${b.tris}`);
    if (a.maxTex > b.tex) out.push(`${id}: tekstur ${a.maxTex}px > anggaran ${b.tex}px`);
    if (a.registryTris !== undefined && a.tris !== a.registryTris) {
      out.push(`${id}: GLB ${a.tris} tri ≠ registry ${a.registryTris}`);
    }
  }
  return out;
}

export function violations() {
  const out = budgetProblems(assets);
  const heavy = heaviestShot(stories());
  if (heavy.tris > SHOT_TRI_BUDGET) out.push(`${heavy.where}: ${heavy.tris} tri > anggaran shot ${SHOT_TRI_BUDGET}`);
  return {problems: out, heavy};
}

function main() {
  const write = process.argv.includes('--write');
  const per = summary();
  for (const [cat, s] of Object.entries(per).sort()) {
    console.log(
      `${cat.padEnd(9)} ${String(s.n).padStart(2)} aset · ${String(s.tris).padStart(6)} tri · ` +
        `terbesar ${String(s.max).padStart(6)} (${s.maxId}) = ${Math.round((s.max / s.budget) * 100)}% dari ${s.budget} · tex ≤ ${s.tex}`,
    );
  }
  const {problems, heavy} = violations();
  console.log(
    `\nshot terberat: ${heavy.where} — ${heavy.tris} tri (anggaran ${SHOT_TRI_BUDGET}, ${Math.round((heavy.tris / SHOT_TRI_BUDGET) * 100)}%)`,
  );

  if (write) {
    const md = fs.readFileSync(docPath, 'utf8');
    const a = md.indexOf(BEGIN);
    const b = md.indexOf(END);
    if (a < 0 || b < 0) throw new Error('penanda BEGIN/END tidak ada di docs/TOPOLOGY-PLAN.md');
    const out = md.slice(0, a + BEGIN.length) + '\n\n' + assetTable() + '\n\n' + md.slice(b);
    fs.writeFileSync(docPath, out);
    console.log('\ntabel ditulis ulang di docs/TOPOLOGY-PLAN.md');
    return;
  }

  const md = fs.readFileSync(docPath, 'utf8');
  if (!md.includes(assetTable())) problems.push('docs/TOPOLOGY-PLAN.md: tabel aset basi (jalankan dengan --write)');
  if (problems.length) {
    console.log('\nMASALAH:');
    for (const p of problems) console.log(`  ! ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`\n${ids.length} aset · 0 pelanggaran anggaran · dokumen sinkron`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
