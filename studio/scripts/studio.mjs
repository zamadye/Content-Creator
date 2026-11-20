#!/usr/bin/env node
/**
 * studio.mjs — the agent-facing CLI for the studio story framework.
 *
 *   node scripts/studio.mjs list [--category nature] [--tag road] [--query kayu] [--json]
 *   node scripts/studio.mjs clips <asset-id>
 *   node scripts/studio.mjs validate stories/<dir>/story.json
 *   node scripts/studio.mjs plan stories/saldo-8-juta/story.json
 *   node scripts/studio.mjs inspect public/assets/road/road.asphalt.straight/road.asphalt.straight.glb
 *   node scripts/studio.mjs new my-scene
 */
import fs from 'node:fs';
import {compositionId} from './lib/composition-id.mjs';
import {productionIssues} from './lib/production-cast.mjs';
import path from 'node:path';
import {compileStory, summarize} from '../src/studio/compile.js';
import {StoryError} from '../src/studio/schema.js';
import {registry, listAssets, asset, clipsOf, catalogueSummary} from '../src/studio/library.js';

const argv = process.argv.slice(2);
const cmd = argv[0] ?? 'help';
const args = argv.slice(1);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').startsWith('--'));

const json = has('json');
const root = new URL('../', import.meta.url).pathname;

function out(value) {
  if (json) process.stdout.write(`${JSON.stringify(value, null, 1)}\n`);
  else process.stdout.write(`${value}\n`);
}

function listCommand() {
  const items = listAssets({
    category: flag('category'),
    tag: flag('tag'),
    query: flag('query'),
    rigged: has('rigged') ? true : undefined,
  });
  if (json) return out(items);
  const byCat = new Map();
  for (const it of items) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category).push(it);
  }
  const lines = [];
  for (const [cat, list] of byCat) {
    lines.push(`\n${cat.toUpperCase()} (${list.length})`);
    for (const it of list) {
      const dims = it.bounds ? it.bounds.size.map((v) => v.toFixed(2)).join('×') : '-';
      const rig = it.rig ? ` · ${it.rig.bones} bones · ${it.rig.clips.length} clips` : '';
      lines.push(`  ${it.id.padEnd(34)} ${it.title.padEnd(34)} ${dims.padEnd(20)} ${(it.tris ?? 0).toString().padStart(6)} tris${rig}`);
    }
  }
  lines.push(`\n${items.length} assets · registry ${registry.assets ? Object.keys(registry.assets).length : 0} entries`);
  out(lines.join('\n'));
}

function clipsCommand() {
  const id = positional[0];
  if (!id) throw new Error('usage: studio.mjs clips <asset-id>');
  out(json ? {id, clips: clipsOf(id)} : `${id}: ${clipsOf(id).join(', ') || '(static asset, no rig)'}`);
}

function validateCommand() {
  const files = positional;
  if (!files.length) throw new Error('usage: studio.mjs validate <story.json...>');
  let failures = 0;
  const results = [];
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
    try {
      const compiled = compileStory(raw, {registry});
      results.push({file, ok: true, frames: compiled.durationInFrames, shots: compiled.shots.length, warnings: compiled.warnings});
      if (!json) out(`ok   ${file}  ${compiled.durationInFrames}f  ${compiled.shots.length} shots  ${compiled.warnings.length} warning(s)`);
      for (const w of compiled.warnings) if (!json) out(`     ! ${w}`);
    } catch (err) {
      failures += 1;
      const problems = err instanceof StoryError ? err.problems : [err.message];
      results.push({file, ok: false, problems});
      if (!json) {
        out(`FAIL ${file}`);
        for (const p of problems) out(`     - ${p}`);
      }
    }
  }
  if (json) out(results);
  process.exitCode = failures ? 1 : 0;
}

function planCommand() {
  const file = positional[0];
  if (!file) throw new Error('usage: studio.mjs plan <story.json>');
  const raw = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
  const compiled = compileStory(raw, {registry});
  const usage = new Map();
  for (const shot of compiled.shots) {
    for (const c of shot.cast) usage.set(c.assetId, (usage.get(c.assetId) ?? 0) + 1);
    for (const o of shot.objectPlacements) usage.set(o.assetId, (usage.get(o.assetId) ?? 0) + 1);
    for (const s of shot.set) usage.set(s.asset, (usage.get(s.asset) ?? 0) + 1);
  }
  const assets = [...usage.entries()].map(([id, count]) => {
    const e = registry.assets[id];
    return {id, count, bytes: e?.bytes ?? 0, tris: e?.tris ?? 0, status: e?.status, title: e?.title};
  });
  const totalBytes = assets.reduce((n, a) => n + a.bytes, 0);
  const totalTris = assets.reduce((n, a) => n + a.tris, 0);
  if (json) return out({compiled: {...compiled, shots: undefined, cameraSample: undefined}, assets, totalBytes, totalTris});
  out(summarize(compiled));
  out('\nassets:');
  for (const a of assets.sort((x, y) => y.bytes - x.bytes)) {
    out(`  ${a.id.padEnd(32)} ×${String(a.count).padStart(2)}  ${(a.bytes / 1048576).toFixed(2)} MB  ${String(a.tris).padStart(6)} tris  ${a.status}`);
  }
  out(`  total ${(totalBytes / 1048576).toFixed(1)} MB, ${totalTris} tris`);
}

function inspectCommand() {
  const file = positional[0];
  if (!file) throw new Error('usage: studio.mjs inspect <file.glb>');
  const buf = fs.readFileSync(path.resolve(root, file));
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const total = buf.readUInt32LE(8);
  let off = 12;
  let doc = null;
  let binLength = 0;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    off += 8;
    if (type === 0x4e4f534a) doc = JSON.parse(buf.subarray(off, off + len).toString('utf8').replace(/\0+$/, '').trimEnd());
    else if (type === 0x004e4942) binLength = len;
    off += len;
  }
  const report = {
    file,
    bytes: buf.length,
    headerLength: total,
    meshCount: doc.meshes?.length ?? 0,
    primitives: (doc.meshes ?? []).reduce((n, m) => n + m.primitives.length, 0),
    materials: (doc.materials ?? []).map((m) => m.name),
    images: (doc.images ?? []).length,
    nodes: (doc.nodes ?? []).length,
    skins: (doc.skins ?? []).length,
    joints: doc.skins?.[0]?.joints?.length ?? 0,
    animations: (doc.animations ?? []).map((a) => a.name),
    anchors: (doc.nodes ?? []).filter((n) => String(n.name ?? '').startsWith('anchor.')).map((n) => n.name),
    binLength,
    extras: doc.asset?.extras ?? null,
  };
  if (json) return out(report);
  out(`${file}  ${(report.bytes / 1048576).toFixed(2)} MB`);
  out(`  meshes ${report.meshCount} · primitives ${report.primitives} · materials ${report.materials.length} · images ${report.images}`);
  out(`  materials: ${report.materials.join(', ')}`);
  if (report.skins) out(`  skin: ${report.joints} joints · animations ${report.animations.length}: ${report.animations.join(', ')}`);
  if (report.anchors.length) out(`  anchors: ${report.anchors.join(', ')}`);
}

function newCommand() {
  const id = positional[0] ?? 'new-scene';
  const file = path.join(root, 'stories', id, 'story.json');
  if (fs.existsSync(file)) throw new Error(`${file} already exists`);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const starter = {
    schema: 'studio.story/2',
    id,
    title: id.replace(/-/g, ' '),
    fps: 30,
    width: 1920,
    height: 1080,
    look: {preset: 'kampung-malam', fog: 0.035, exposure: 1.05, grain: 0.05},
    cast: {},
    objects: {},
    shots: [
      {
        id: 'shot-01',
        duration: 4,
        set: [{asset: 'road.asphalt.straight', at: [0, 0, 0]}],
        actors: [],
        camera: {preset: 'dolly-in', fov: 42},
        light: {preset: 'malam'},
      },
    ],
  };
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `${JSON.stringify(starter, null, 1)}\n`);
  out(`wrote ${path.relative(root, file)} — next: node scripts/studio.mjs validate ${path.relative(root, file)}`);
}

function productionCommand() {
  let file = positional[0];
  if (!file) {
    const id = process.env.STUDIO_COMPOSITION || 'StudioUjiKamera';
    const dir = fs.readdirSync(path.join(root, 'stories'), {withFileTypes:true})
      .find(entry => entry.isDirectory() && compositionId(entry.name) === id);
    if (!dir) throw new Error('Paket cerita tidak ditemukan untuk ' + id);
    file = path.join('stories', dir.name, 'story.json');
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
  const compiled = compileStory(raw, {registry});
  const issues = productionIssues(compiled, registry, path.join(root, 'public'));
  if (issues.length) throw new Error('Periksa pemeran di Katalog karakter.\n' + issues.join('\n'));
  out(file + ' — pemeran siap produksi');
}

function help() {
  out(`studio.mjs — story framework CLI

  list [--category C] [--tag T] [--query Q] [--rigged] [--json]
  clips <asset-id>
  validate <story.json...>
  plan <story.json>
  production [story.json]
  inspect <file.glb>
  new <story-id>

catalogue: ${catalogueSummary().map((c) => `${c.category}(${c.items.length})`).join(' ')}
story schema: studio.story/2 — see docs/STORY-FORMAT.md`);
}

try {
  switch (cmd) {
    case 'production':
      productionCommand();
      break;
    case 'list':
      listCommand();
      break;
    case 'clips':
      clipsCommand();
      break;
    case 'validate':
      validateCommand();
      break;
    case 'plan':
      planCommand();
      break;
    case 'inspect':
      inspectCommand();
      break;
    case 'new':
      newCommand();
      break;
    case 'help':
    default:
      help();
  }
} catch (err) {
  process.stderr.write(`studio: ${err.message}\n`);
  process.exitCode = 1;
}

export {asset};
