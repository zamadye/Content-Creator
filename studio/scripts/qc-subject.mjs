/**
 * QC subjek — ukur besar & posisi aktor di frame memakai **pose sebenarnya**.
 *
 * `qc-framing.mjs` memakai bounding box aset yang berdiri tegak. Aktor yang
 * duduk (`clip: "sit"`) atau berpose lain punya kepala jauh di bawah nilai itu,
 * jadi angka dari bbox menyesatkan: di `busri-05` bbox bilang kepala di NDC
 * +0,51 padahal di render kepala keluar frame bawah. Skrip ini memuat GLB,
 * menjalankan klip + lapisan hidup seperti `renderer.js`, lalu memproyeksikan
 * tulang `head` ke kamera shot.
 *
 *   node scripts/qc-subject.mjs                        # semua shot warung-hujan
 *   node scripts/qc-subject.mjs --shot nisa-06
 *   node scripts/qc-subject.mjs --solve                # usul kamera (dry-run)
 *   node scripts/qc-subject.mjs --solve --write        # tulis ke story.json
 *
 * Kolom: ndcX/ndcY kepala, %wajah (tinggi kepala / tinggi frame di jarak itu),
 * dan status: `ok` bila kepala di dalam frame dengan margin ≥ 0,08,
 * `mepet` bila 0,08–1,0, `LUAR` bila > 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {compileStory} from '../src/studio/compile.js';
import {registry} from '../src/studio/library.js';
import {createClipSampler} from '../src/studio/clip-sample.js';
import {secondaryTurns, applySecondary, prepareSecondary} from '../src/studio/secondary.js';
import {lifeTurns} from '../src/studio/life.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const has = (name) => argv.includes(`--${name}`);

/* ------------------------------------------------------------------ GLB di Node */

function splitGlb(buf) {
  let off = 12;
  let json = null;
  let bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    off += 8;
    const chunk = buf.subarray(off, off + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/\0+$/, '').trimEnd());
    else if (type === 0x004e4942) bin = chunk;
    off += len;
  }
  return {json, bin};
}

/** Buang tekstur KTX2/basis supaya GLTFLoader bisa memuat tanpa basisu. */
function buildGlb(json, bin) {
  const texKeys = ['baseColorTexture', 'metallicRoughnessTexture', 'normalTexture', 'occlusionTexture', 'emissiveTexture'];
  for (const m of json.materials ?? []) {
    for (const k of texKeys) {
      if (m[k]) delete m[k];
      if (m.pbrMetallicRoughness?.[k]) delete m.pbrMetallicRoughness[k];
    }
  }
  delete json.textures;
  delete json.images;
  delete json.samplers;
  delete json.extensions;
  delete json.extensionsUsed;
  delete json.extensionsRequired;
  const jb = Buffer.from(JSON.stringify(json), 'utf8');
  const jc = Buffer.concat([jb, Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20)]);
  const bc = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4, 0)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jc.length + 8 + bc.length, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jc.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(bc.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, jc, bh, bc]);
}

const cache = new Map();
async function loadTemplate(assetId) {
  if (cache.has(assetId)) return cache.get(assetId);
  const file = path.join(root, 'public', registry.assets[assetId].uri);
  const {json, bin} = splitGlb(fs.readFileSync(file));
  const buf = buildGlb(json, bin);
  const gltf = await new Promise((res, rej) =>
    new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej),
  );
  cache.set(assetId, gltf);
  return gltf;
}

/* -------------------------------------------------------------------- pose */

const seedOf = (ref) => [...ref].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100000, 7);

/** Posisi kepala (dunia) untuk satu aktor pada `seconds` shot — mirip renderer. */
async function headAt(c, shot, seconds, steps) {
  const tpl = await loadTemplate(c.assetId);
  const inst = cloneSkeleton(tpl.scene);
  inst.position.set(c.at[0], c.at[1], c.at[2]);
  inst.rotation.y = c.yaw ?? 0;
  const clip = THREE.AnimationClip.findByName(tpl.animations, c.clip) ?? tpl.animations[0];
  const sampler = createClipSampler(inst, clip);
  prepareSecondary(inst, {nodes: sampler.animatedNodes, scales: sampler.scaleNodes});
  sampler.apply(seconds * (c.speed ?? 1) + (c.offset ?? 0));
  const turns = secondaryTurns(seconds, {
    clip: c.clip,
    duration: sampler.duration,
    speed: c.speed ?? 1,
    intensity: shot.secondary ?? 1,
  });
  const speaking = shot.speaker === c.ref;
  const extra = lifeTurns(seconds, {
    seed: seedOf(c.ref),
    speaking,
    listening: Boolean(shot.speaker) && !speaking,
    clip: c.clip,
    intensity: shot.secondary ?? 1,
  });
  turns.push(...extra.turns);
  applySecondary(inst, turns);
  inst.position.x += extra.root[0];
  inst.position.y += extra.root[1];
  inst.updateMatrixWorld(true);
  let head = null;
  inst.traverse((o) => {
    if (!head && o.name === 'head') head = o;
  });
  const p = head ? head.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(...c.at);
  // tinggi kepala: dari titik kepala ke ubun-ubun ±0,13 m (tulang head di tengah wajah)
  return {pos: p, top: p.y + 0.13};
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((n) => n / l);
};

function project(point, cam, aspect) {
  const eye = cam.position;
  const fwd = norm(sub(cam.target, eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const rel = sub(point, eye);
  const depth = dot(rel, fwd);
  const tanHalf = Math.tan((cam.fov * Math.PI) / 360);
  const y = dot(rel, up) / (depth * tanHalf);
  const x = dot(rel, right) / (depth * tanHalf * aspect);
  return {x, y, depth, frameH: 2 * depth * tanHalf};
}

const FACE = 0.24; // tinggi wajah (m) di model karakter studio

/** Baris ukur untuk satu shot: satu objek per aktor terlihat. */
async function measure(shot, story) {
  const aspect = story.width / story.height;
  const actors = shot.cast.filter((c) => !c.hidden);
  const samples = [];
  for (const u of [0, 0.5, 1]) {
    const seconds = (shot.durationInFrames / story.fps) * u;
    const cam = shot.cameraSample(u);
    for (const c of actors) {
      const assets = registry.assets[c.assetId];
      if (!assets || assets.category !== 'character') continue;
      const h = await headAt(c, shot, seconds);
      const p = project([h.pos.x, h.pos.y, h.pos.z], cam, aspect);
      samples.push({ref: c.ref, u, ...p, face: FACE / p.frameH});
    }
  }
  return samples;
}

function status(face) {
  return face.margin === undefined ? 'ok' : face.max > 1 ? 'LUAR' : face.max > 0.92 ? 'mepet' : 'ok';
}

/* ------------------------------------------------------------------- solver */

/**
 * Usul kamera baru untuk satu shot: pertahankan arah (azimut) kamera lama,
 * lalu geser sepanjang arah itu supaya tinggi frame di kepala ≈ `frameH`,
 * dan arahkan bidik ke kepala supaya kepala duduk di ndcY target.
 */
async function solve(shot, story, {frameH = 0.72, ndcY = 0.42} = {}) {
  const aspect = story.width / story.height;
  const lead = shot.cast.find((c) => !c.hidden && shot.speaker === c.ref) ?? shot.cast.find((c) => !c.hidden);
  if (!lead) return null;
  const cam0 = shot.cameraSample(0.35);
  const h = await headAt(lead, shot, (shot.durationInFrames / story.fps) * 0.35);
  const eye = cam0.position;
  const flat = norm([eye[0] - h.pos.x, 0, eye[2] - h.pos.z]);
  const tanHalf = Math.tan((cam0.fov * Math.PI) / 360);
  const d = frameH / (2 * tanHalf);
  const pos = [h.pos.x + flat[0] * d, h.pos.y + 0.06, h.pos.z + flat[2] * d];
  // target: tepat di bawah kepala, supaya kepala di ndcY yang diminta
  const aimY = h.pos.y - ndcY * (frameH / 2);
  const target = [h.pos.x, Number(aimY.toFixed(3)), h.pos.z];
  // uji balik
  const camT = {position: pos, target, fov: cam0.fov};
  const back = project([h.pos.x, h.pos.y, h.pos.z], camT, aspect);
  return {
    ref: lead.ref,
    from: pos.map((v) => Number(v.toFixed(2))),
    target: target.map((v) => Number(v.toFixed(2))),
    fov: cam0.fov,
    check: {ndcY: Number(back.y.toFixed(2)), face: Number((FACE / back.frameH).toFixed(2))},
  };
}

/* --------------------------------------------------------------------- CLI */

async function main() {
  // Tanpa `--story`, periksa semua naskah produksi di `stories/*/story.json`.
  const explicit = arg('story');
  const storyFiles = explicit
    ? [path.resolve(String(explicit))]
    : fs
        .readdirSync(path.join(root, 'stories'), {withFileTypes: true})
        .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, 'stories', d.name, 'story.json')))
        .map((d) => path.join(root, 'stories', d.name, 'story.json'))
        .sort();
  for (const file of storyFiles) await probe(file);
}

async function probe(storyFile) {
  const raw = JSON.parse(fs.readFileSync(storyFile, 'utf8'));
  const story = compileStory(raw, {registry});
  const only = arg('shot');
// Vertikal 9:16 butuh tinggi frame lebih besar (wajah lebih kecil) dan kepala
// duduk di sepertiga atas supaya badan muat di bawah.
const frameHeight = Number(arg('frame-height', 0) || 0.72);
const ndcYArg = Number(arg('ndc-y', 0) || 0.42);
  const wantSolve = has('solve');
  const wantWrite = has('write');

  const shots = story.shots.filter((s) => (only ? s.id === only : true));
  let flagged = 0;
  if (wantSolve) {
    for (const shot of shots) {
      const s = await solve(shot, story, {frameH: frameHeight, ndcY: ndcYArg});
      if (!s) continue;
      console.log(
        `  ${shot.id.padEnd(13)} ${s.ref.padEnd(8)} from ${JSON.stringify(s.from)} target ${JSON.stringify(
          s.target,
        )} fov ${s.fov} → ndcY ${s.check.ndcY}, wajah ${(s.check.face * 100).toFixed(0)}%`,
      );
      if (wantWrite) {
        const i = raw.shots.findIndex((x) => x.id === shot.id);
        const cam = raw.shots[i].camera ?? {};
        raw.shots[i].camera = {...cam, from: s.from, target: s.target, fov: s.fov};
        if (cam.to) {
          // geser titik akhir dolly sejauh pergeseran `from` (push-in tetap push-in)
          raw.shots[i].camera.to = [cam.to[0] + (s.from[0] - cam.from[0]), cam.to[1] + (s.from[1] - cam.from[1]), cam.to[2] + (s.from[2] - cam.from[2])];
        }
      }
    }
    if (wantWrite) {
      fs.writeFileSync(storyFile, JSON.stringify(raw, null, 2) + '\n');
      console.log(`\n${storyFile} ditulis ulang`);
    }
    return;
  }

  for (const shot of shots) {
    const rows = await measure(shot, story);
    if (!rows.length) {
      console.log(`  ${shot.id.padEnd(13)} (tanpa aktor)`);
      continue;
    }
    const lead = rows.filter((r) => r.u === 0.5);
    const detail = lead
      .map((r) => {
        const m = Math.max(Math.abs(r.x), Math.abs(r.y));
        const st = m > 1 ? 'LUAR' : m > 0.92 ? 'mepet' : 'ok';
        if (st !== 'ok') flagged += 1;
        return `${r.ref} x=${r.x.toFixed(2)} y=${r.y.toFixed(2)} wajah=${(r.face * 100).toFixed(0)}% ${st}`;
      })
      .join(' · ');
    console.log(`  ${shot.id.padEnd(13)} ${detail}`);
  }
  console.log(`\n${shots.length} shot · ${flagged} aktor keluar/mepet frame`);
  if (flagged) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
