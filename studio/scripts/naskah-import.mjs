#!/usr/bin/env node
/**
 * Naskah (markdown ringkas) → `stories/<dir>/story.json` (skema studio.story/2).
 *
 *   node scripts/naskah-import.mjs stories/contoh-naskah/naskah/contoh.naskah.md
 *   node scripts/naskah-import.mjs <naskah.md> --out stories/x/story.json --force
 *
 * Format sengaja datar supaya penulis (atau LLM) bisa menulis naskah tanpa
 * mengingat JSON. Satu baris = satu keputusan:
 *
 *   # Judul cerita
 *   @id contoh-naskah
 *   @look kampung-sore
 *   @fps 30
 *   @cast   aku = char.male-dewasa-polo
 *   @object motor = vehicle.motorcycle.bebek
 *
 *   ## 1. Jalan kampung, sore | 5
 *   - set:    road.asphalt.straight @ 0 0 0 | rot 0
 *   - actor:  aku walk @ 0 0 1.4 facing -Z
 *   - object: motor @ -0.6 0 1.0 | rot -0.1
 *   - camera: dolly-in from 0.6 1.5 -5.4 to 0.4 1.42 -2.2 fov 42
 *   - light:  sore
 *   - text:   Sore itu aku pulang lewat jalan yang sama.
 *
 * Nilai `duration` (detik) menentukan panjang shot; `text` menjadi subtitle.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileStory} from '../src/studio/compile.js';
import {registry} from '../src/studio/library.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const input = argv.find((a) => !a.startsWith('--'));
const flag = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = (n) => argv.includes(`--${n}`);

if (!input) {
  console.error('usage: node scripts/naskah-import.mjs <naskah.md> [--out stories/<dir>/story.json] [--force]');
  process.exit(2);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = path.resolve(input);
const lines = fs.readFileSync(file, 'utf8').split('\n');

const story = {schema: 'studio.story/2', id: slug(path.basename(file).replace(/\.naskah\.md$|\.md$/, '')), title: '', fps: 30, width: 1920, height: 1080, look: {preset: 'kampung-sore'}, cast: {}, objects: {}, meta: {author: 'naskah', notes: `Diimpor dari ${path.relative(root, file)}`, tags: []}, shots: []};
let shot = null;

const vec = (s) => s.trim().split(/[\s,]+/).map(Number);
const put = (obj, k, v) => {
  obj[k] = v;
};

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  if (line.startsWith('#')) {
    if (line.startsWith('## ')) {
      const [head, dur] = line.slice(3).split('|').map((s) => s.trim());
      const m = head.match(/^(\d+)[.)]\s*(.*)$/);
      shot = {
        id: slug(m ? m[2] : head) || `shot-${story.shots.length + 1}`,
        title: m ? m[2] : head,
        duration: dur ? Number(dur.replace(/[^\d.]/g, '')) : 4,
        set: [],
        actors: [],
        camera: {preset: 'static', fov: 40},
        light: {preset: 'siang'},
      };
      story.shots.push(shot);
    } else {
      story.title = line.replace(/^#\s*/, '').trim();
    }
    continue;
  }

  if (line.startsWith('@')) {
    const [key, ...rest] = line.slice(1).split(/\s+/);
    const value = rest.join(' ').trim();
    if (key === 'id') story.id = value;
    else if (key === 'look') story.look.preset = value;
    else if (key === 'fps') story.fps = Number(value);
    else if (key === 'size') {
      const [w, h] = value.split(/[x×]/).map(Number);
      story.width = w;
      story.height = h;
    } else if (key === 'cast' || key === 'object') {
      const [ref, asset] = value.split('=').map((s) => s.trim());
      if (!ref || !asset) throw new Error(`naskah: baris "@${key}" harus "ref = asset.id" → ${line}`);
      (key === 'cast' ? story.cast : story.objects)[ref] = key === 'cast' ? {asset, label: ref} : {asset, label: ref};
    } else if (key === 'tag') {
      story.meta.tags.push(value);
    } else if (key === 'author') {
      story.meta.author = value;
    }
    continue;
  }

  if (line.startsWith('-')) {
    if (!shot) throw new Error(`naskah: baris aksi sebelum heading shot → ${line}`);
    const body = line.slice(1).trim();
    const [kindRaw, ...restParts] = body.split(':');
    const kind = kindRaw.trim();
    const rest = restParts.join(':').trim();
    const [mainPart, ...mods] = rest.split('|').map((s) => s.trim());
    const mod = {};
    for (const m of mods) {
      const [k, ...v] = m.split(/\s+/);
      mod[k] = v.join(' ');
    }

    if (kind === 'set') {
      const [asset, at] = mainPart.split('@').map((s) => s.trim());
      shot.set.push({asset, at: at ? vec(at) : [0, 0, 0], rot: mod.rot !== undefined ? Number(mod.rot) : 0, ...(mod.scale ? {scale: Number(mod.scale)} : {})});
    } else if (kind === 'actor') {
      const [ref, clip, atPart] = mainPart.split(/\s+/);
      const facing = mainPart.match(/facing\s+(-?[XZY]+)/i)?.[1] ?? '-Z';
      const at = atPart && atPart.startsWith('@') ? vec(mainPart.split('@')[1].replace(/facing.*$/, '')) : [0, 0, 0];
      shot.actors.push({ref, clip: clip ?? 'idle', at, facing});
    } else if (kind === 'object') {
      const [ref, atPart] = mainPart.split('@').map((s) => s.trim());
      shot.objects = shot.objects ?? [];
      shot.objects.push({ref, at: atPart ? vec(atPart) : [0, 0, 0], rot: mod.rot !== undefined ? Number(mod.rot) : 0});
    } else if (kind === 'camera') {
      const preset = mainPart.split(/\s+/)[0];
      const from = mainPart.match(/from\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
      const to = mainPart.match(/to\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
      const fov = mainPart.match(/fov\s+([\d.]+)/);
      shot.camera = {preset, ...(from ? {from: from.slice(1).map(Number)} : {}), ...(to ? {to: to.slice(1).map(Number)} : {})};
      if (fov) shot.camera.fov = Number(fov[1]);
    } else if (kind === 'light') {
      shot.light = {preset: mainPart};
    } else if (kind === 'text') {
      shot.text = {style: mod.style ?? 'subtitle', value: rest};
    } else {
      throw new Error(`naskah: aksi tak dikenal "${kind}" → ${line}`);
    }
    continue;
  }
  throw new Error(`naskah: baris tak dikenal → ${line}`);
}

if (!story.shots.length) throw new Error('naskah: tidak ada shot (heading "## 1. judul | durasi")');

const outFile = path.resolve(flag('out') ?? path.join(root, 'stories', story.id, 'story.json'));
if (fs.existsSync(outFile) && !has('force')) {
  console.error(`${path.relative(root, outFile)} sudah ada — pakai --force untuk menimpa`);
  process.exit(1);
}

// validasi dulu: naskah yang salah harus gagal di sini, bukan saat render
try {
  const compiled = compileStory(story, {registry});
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  fs.writeFileSync(outFile, JSON.stringify(story, null, 1) + '\n');
  console.log(`ok  ${path.relative(root, outFile)}  ${compiled.durationInFrames} frame · ${story.shots.length} shot · ${compiled.warnings.length} peringatan`);
  for (const w of compiled.warnings) console.log(`    ! ${w}`);
} catch (err) {
  console.error(`naskah ditolak: ${err.message}`);
  for (const p of err.problems ?? []) console.error(`  - ${p}`);
  process.exit(1);
}
