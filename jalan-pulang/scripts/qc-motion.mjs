/**
 * QC gerak: kecepatan langkah tersirat, fase kontak, dan kaki menembus lantai.
 *
 *   node scripts/qc-motion.mjs
 *
 * Klip lokomosi kita in-place (tidak ada root translation ke depan), jadi angka
 * "implied speed" di sini adalah kecepatan dunia yang harus dipakai kalau aktor
 * digeser lewat cerita. Kalau renderer tidak menggeser aktor, kaki akan meluncur
 * sebesar kecepatan itu.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const PUBLIC = new URL('../public/', import.meta.url).pathname;
const REGISTRY = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'assets/registry.json'), 'utf8'));

/** Buang tekstur supaya GLTFLoader bisa parse tanpa Canvas2D. */
function stripTextures(buf) {
  let off = 12;
  let json = null;
  let bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    off += 8;
    const chunk = buf.subarray(off, off + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').trimEnd());
    else bin = chunk;
    off += len;
  }
  const j = JSON.parse(JSON.stringify(json));
  delete j.textures;
  delete j.images;
  delete j.samplers;
  for (const m of j.materials ?? []) {
    for (const k of ['baseColorTexture', 'metallicRoughnessTexture', 'normalTexture', 'occlusionTexture', 'emissiveTexture']) {
      if (m[k]) delete m[k];
      if (m.pbrMetallicRoughness?.[k]) delete m.pbrMetallicRoughness[k];
    }
  }
  const jb = Buffer.from(JSON.stringify(j));
  const pad = Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20);
  const jc = Buffer.concat([jb, pad]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jc.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jc.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(bin.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  const out = Buffer.concat([header, jh, jc, bh, bin]);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

function load(asset) {
  const file = path.join(PUBLIC, asset.uri);
  const buf = fs.readFileSync(file);
  const ab = stripTextures(buf);
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(ab, '', resolve, reject);
  });
}

const CLIPS = process.argv.slice(2).length ? process.argv.slice(2) : ['walk', 'run', 'idle'];
const SUBJECT = 'char.male-dewasa-polo';

const gltf = await load(REGISTRY.assets[SUBJECT]);
const scene = gltf.scene;
const mixer = new THREE.AnimationMixer(scene);
const findings = [];

for (const clipName of CLIPS) {
  const clip = THREE.AnimationClip.findByName(gltf.animations, clipName);
  if (!clip) {
    console.log(`levati ${clipName}: tidak ada`);
    continue;
  }
  const action = mixer.clipAction(clip);
  action.play();
  const samples = [];
  const step = 1 / 120;
  const left = scene.getObjectByName('footL') ?? scene.getObjectByName('foot.L');
  const right = scene.getObjectByName('footR') ?? scene.getObjectByName('foot.R');
  for (let t = 0; t <= clip.duration; t += step) {
    mixer.setTime(t);
    scene.updateMatrixWorld(true);
    samples.push({
      t,
      l: left.getWorldPosition(new THREE.Vector3()),
      r: right.getWorldPosition(new THREE.Vector3()),
    });
  }
  action.stop();
  const ys = samples.flatMap((s) => [s.l.y, s.r.y]);
  const floor = Math.min(...ys);
  const contactY = floor + 0.02;
  const speeds = [];
  let contact = 0;
  for (let i = 1; i < samples.length; i++) {
    for (const side of ['l', 'r']) {
      const a = samples[i - 1][side];
      const b = samples[i][side];
      if (a.y <= contactY && b.y <= contactY) {
        contact++;
        const dz = b.z - a.z;
        const dx = b.x - a.x;
        speeds.push(Math.hypot(dx, dz) / step);
      }
    }
  }
  speeds.sort((x, y) => x - y);
  const median = speeds.length ? speeds[Math.floor(speeds.length / 2)] : 0;
  const p90 = speeds.length ? speeds[Math.floor(speeds.length * 0.9)] : 0;
  const contactPct = (contact / (2 * (samples.length - 1))) * 100;
  const below = ys.filter((y) => y < -0.005).length;
  findings.push({clip: clipName, duration: clip.duration, feet: ys.length, floor, median, p90, contactPct, below});
  console.log(
    `${clipName}: durasi ${clip.duration.toFixed(2)}s · kaki terendah y=${floor.toFixed(3)} · ` +
      `kontak ${contactPct.toFixed(0)}% · laju kaki saat menapak median ${median.toFixed(2)} m/s (p90 ${p90.toFixed(2)}) · ` +
      `sampel di bawah lantai ${below}`,
  );
}

const walk = findings.find((f) => f.clip === 'walk');
if (walk && walk.median > 0) {
  console.log(
    `\nSarannya: shot berjalan perlu menggeser aktor ~${walk.median.toFixed(2)} m/s ` +
      `(atau kamera ikut bergerak), kalau tidak kaki meluncur sebesar itu.`,
  );
}
