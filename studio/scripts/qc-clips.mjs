/**
 * QC klip: seberapa lengkap dan seberapa besar gerak sebuah klip.
 *
 *   node scripts/qc-clips.mjs public/assets/characters/char.female-lansia/char.female-lansia.glb
 *   node scripts/qc-clips.mjs /tmp/lama.glb --compare /tmp/baru.glb
 *
 * Yang dilaporkan per klip:
 *   tulang  jumlah tulang yang benar-benar ditulis klip (dari total deform bone)
 *   gerak   total perpindahan sudut semua tulang selama satu siklus (radian);
 *           ini ukuran kasar "seberapa banyak yang terjadi", bukan selera
 *   reng   rata-rata rentang sudut per tulang yang bergerak (derajat)
 *   step   untuk klip berjalan: rentang sudut lutut & pinggul (derajat)
 *
 * Angka ini dipakai untuk membandingkan rig lama (klip hanya menulis segmen
 * pertama tiap rantai) dengan yang baru (putaran dibagi ke seluruh rantai).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

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
  const jp = Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([jb, jp]);
  const binChunk = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4, 0)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jsonChunk.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(binChunk.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  const out = Buffer.concat([header, jh, jsonChunk, bh, binChunk]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

async function load(file) {
  const {json, bin} = splitGlb(fs.readFileSync(file));
  const buf = buildGlb(json, bin);
  return new Promise((res, rej) =>
    new GLTFLoader().parse(buf, '', res, rej),
  );
}

const DEG = 180 / Math.PI;

/**
 * Evaluasi klip lewat interpolant track — penting karena objek bone tidak
 * bergerak sendiri saat klip hanya dibaca.
 */
function sampleClip(gltf, clip, t) {
  const byName = new Map();
  gltf.scene.traverse((o) => {
    if (o.name) byName.set(o.name, o);
  });
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    const name = track.name.slice(0, dot).replace(/[.[\]:/ ]/g, '');
    const prop = track.name.slice(dot + 1);
    const node = byName.get(name);
    if (!node) continue;
    const buf = new Float32Array(track.getValueSize());
    const interp = track.createInterpolant(buf);
    interp.evaluate(t);
    if (prop === 'quaternion') node.quaternion.fromArray(buf).normalize();
    else if (prop === 'scale') node.scale.fromArray(buf);
    else node.position.fromArray(buf);
  }
}

function measure(gltf, samples = 24) {
  const bones = [];
  gltf.scene.traverse((o) => {
    if (o.isBone) bones.push(o);
  });
  const out = [];
  for (const clip of gltf.animations) {
    const travel = new Map();
    const range = new Map();
    const prev = new Map();
    for (let i = 0; i <= samples; i += 1) {
      const t = (clip.duration * i) / samples;
      sampleClip(gltf, clip, t);
      for (const b of bones) {
        const e = new THREE.Euler().setFromQuaternion(b.quaternion, 'XYZ');
        const cur = [e.x * DEG, e.y * DEG, e.z * DEG];
        const before = prev.get(b.name);
        if (before) {
          let d = 0;
          for (let k = 0; k < 3; k += 1) d += Math.abs(cur[k] - before[k]);
          if (d > 1e-4) {
            travel.set(b.name, (travel.get(b.name) || 0) + d);
            const r = range.get(b.name) || [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
            for (let k = 0; k < 3; k += 1) {
              r[k] = Math.min(r[k], cur[k]);
              r[k + 3] = Math.max(r[k + 3], cur[k]);
            }
            range.set(b.name, r);
          }
        }
        prev.set(b.name, cur);
      }
    }
    out.push({name: clip.name, duration: clip.duration, travel, range, bones: bones.length});
  }
  return out;
}

const fmt = (v) => v.toFixed(2);

async function report(file, label) {
  const gltf = await load(file);
  const rows = measure(gltf);
  console.log(`\n${label} — ${path.basename(file)}`);
  console.log('klip       dur    aktif  gerak(rad)  rata-reng(°)  lutut(°)  siku(°)');
  for (const r of rows) {
    const moved = [...r.travel.entries()].filter(([, v]) => v > 0.5);
    const total = moved.reduce((a, [, v]) => a + v, 0) / DEG;
    const avgRange =
      moved.reduce((a, [k]) => {
        const g = r.range.get(k);
        return a + Math.max(g[3] - g[0], g[4] - g[1], g[5] - g[2]);
      }, 0) / Math.max(1, moved.length);
    const knee = maxRange(r, ['lowerleg01L', 'lowerleg02L', 'lowerleg01R', 'lowerleg02R']);
    const elbow = maxRange(r, ['lowerarm01L', 'lowerarm02L', 'lowerarm01R', 'lowerarm02R']);
    console.log(
      `${r.name.padEnd(10)} ${r.duration.toFixed(2)}  ${String(moved.length).padStart(4)}/${r.bones}  ${total.toFixed(1).padStart(10)}  ${avgRange.toFixed(1).padStart(11)}  ${knee.toFixed(1).padStart(8)}  ${elbow.toFixed(1).padStart(7)}`,
    );
  }
  return rows;
}

function maxRange(row, names) {
  let best = 0;
  for (const n of names) {
    const g = row.range.get(n);
    if (!g) continue;
    best = Math.max(best, g[3] - g[0], g[4] - g[1], g[5] - g[2]);
  }
  return best;
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const cmp = process.argv.indexOf('--compare');
if (cmp > 0 && process.argv[cmp + 1]) {
  const before = args[0];
  const after = process.argv[cmp + 1];
  await report(before, 'SEBELUM');
  await report(after, 'SESUDAH');
} else {
  for (const file of args.length ? args : [path.join(root, 'public/assets/characters/char.remaja-perempuan/char.remaja-perempuan.glb')]) {
    await report(file, 'KLIP');
  }
}
