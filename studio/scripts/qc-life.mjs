/**
 * QC "hidup": seberapa banyak aktor sebenarnya bergerak di dalam satu shot.
 *
 *   node scripts/qc-life.mjs [story.json ...]
 *
 * Alat ini menjawab keluhan "animasinya minim, gerakannya berat" dengan angka,
 * bukan selera: untuk tiap shot ia menyusun pose tiap frame (klip + gerak
 * sekunder + lapisan hidup) di Node — tanpa GPU — lalu mengukur perpindahan
 * dunia tulang kepala dan kedua tangan antar frame.
 *
 *   gerak/frame  rata-rata perpindahan (mm) per frame pada 30 fps
 *   mati         frame yang perpindahannya < 0,05 mm (terbaca sebagai beku)
 *   puncak       perpindahan terbesar dalam shot (mm)
 *
 * Ambang kasar yang dipakai: shot dialog yang sehat bergerak > 0,6 mm/frame
 * dengan 0 frame mati. Di bawah itu penonton melihat "patung yang bicara".
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {compileStory} from '../src/studio/compile.js';
import {registry} from '../src/studio/library.js';
import {createClipSampler} from '../src/studio/clip-sample.js';
import {secondaryTurns, applySecondary, prepareSecondary} from '../src/studio/secondary.js';
import {lifeTurns} from '../src/studio/life.js';

/** Story 2D (sprite + Remotion) tidak punya kamera 3D — lewati di QC 3D. */
function is3dStoryFile(file) {
  try {
    return !String(JSON.parse(fs.readFileSync(file, 'utf8')).schema ?? '').startsWith('studio.story2d');
  } catch {
    return true;
  }
}


const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/** GLB tanpa tekstur/ekstensi supaya GLTFLoader bisa parse di Node (tanpa Canvas2D). */
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
  const texKeys = ['baseColorTexture', 'metallicRoughnessTexture', 'normalTexture', 'occlusionTexture', 'emissiveTexture', 'sheenColorTexture', 'specularTexture'];
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
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([jsonBytes, jsonPad]);
  const binPad = Buffer.alloc((4 - (bin.length % 4)) % 4, 0);
  const binChunk = Buffer.concat([bin, binPad]);
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

const seedOf = (ref) => {
  let h = 0;
  for (let i = 0; i < String(ref).length; i += 1) h = (h * 31 + String(ref).charCodeAt(i)) % 9973;
  return h / 97;
};

/** Ukur gerak kepala + dua tangan sepanjang shot. */
function measure(assetId, shot, {life}) {
  const file = path.join(root, 'public', registry.assets[assetId].uri);
  const {json, bin} = splitGlb(fs.readFileSync(file));
  const buf = buildGlb(json, bin);
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf, '', (gltf) => {
      const scene = gltf.scene;
      const cast = shot.cast.find((c) => c.assetId === assetId);
      const clip = THREE.AnimationClip.findByName(gltf.animations, cast.clip) ?? gltf.animations[0];
      const sampler = createClipSampler(scene, clip);
      prepareSecondary(scene, {nodes: sampler.animatedNodes, scales: sampler.scaleNodes});
      scene.updateMatrixWorld(true);

      // Nama node di GLTFLoader sudah disanitasi ("wrist.L" -> "wristL").
      const bones = ['head', 'wristL', 'wristR', 'spine05']
        .map((n) => scene.getObjectByName(n))
        .filter(Boolean);
      if (!bones.length) return resolve(null);

      const fps = 30;
      const frames = shot.durationInFrames;
      const prev = new Map();
      let total = 0;
      let peak = 0;
      let dead = 0;
      let samples = 0;

      for (let f = 0; f < frames; f += 1) {
        const seconds = f / fps;
        sampler.apply(seconds * cast.speed + cast.offset);
        const turns = secondaryTurns(seconds, {
          clip: cast.clip,
          duration: sampler.duration,
          speed: cast.speed,
          intensity: shot.secondary ?? 1,
        });
        if (life) {
          const extra = lifeTurns(seconds, {
            seed: seedOf(cast.ref),
            speaking: shot.speaker === cast.ref,
            listening: Boolean(shot.speaker) && shot.speaker !== cast.ref,
            clip: cast.clip,
            intensity: shot.secondary ?? 1,
          });
          turns.push(...extra.turns);
        }
        applySecondary(scene, turns);
        scene.updateMatrixWorld(true);

        let frameMove = 0;
        for (const bone of bones) {
          const p = bone.getWorldPosition(new THREE.Vector3());
          const q = prev.get(bone.name);
          if (q) frameMove = Math.max(frameMove, p.distanceTo(q) * 1000);
          prev.set(bone.name, p);
        }
        if (f > 0) {
          total += frameMove;
          samples += 1;
          peak = Math.max(peak, frameMove);
          if (frameMove < 0.05) dead += 1;
          if (process.env.QC_DEBUG && frameMove < 0.05) console.log(`      mati @${f} ${frameMove.toFixed(4)} mm`);
        }
      }
      resolve({
        mean: samples ? total / samples : 0,
        peak,
        dead,
        frames,
      });
    }, reject);
  });
}

const fmt = (r) => `${r.mean.toFixed(2)} mm/frame · puncak ${r.peak.toFixed(1)} mm · mati ${r.dead}/${r.frames - 1}`;

async function main() {
  const args = process.argv.slice(2);
  const files = args.length
    ? args
    : fs
        .readdirSync(path.join(root, 'stories'), {withFileTypes: true})
        .filter((d) => d.isDirectory())
        .map((d) => path.join(root, 'stories', d.name, 'story.json'))
        .filter(is3dStoryFile)
        .filter((f) => fs.existsSync(f))
        .sort();

  let worse = 0;
  for (const file of files) {
    const story = JSON.parse(fs.readFileSync(file, 'utf8'));
    const compiled = compileStory(story, {registry});
    console.log(`${path.basename(path.dirname(file))}`);
    for (const shot of compiled.shots) {
      const cast = shot.cast.find((c) => c.assetId && registry.assets[c.assetId]?.category === 'character');
      if (!cast) continue;
      const before = await measure(cast.assetId, shot, {life: false});
      const after = await measure(cast.assetId, shot, {life: true});
      if (!before || !after) continue;
      const gain = before.mean > 0.0001 ? after.mean / before.mean : Infinity;
      const flag = after.dead > 0 || after.mean < 0.6 ? ' !' : '';
      if (flag) worse += 1;
      console.log(
        `  ${shot.id.padEnd(14)} ${cast.ref.padEnd(6)} sebelum ${fmt(before).padEnd(46)} sesudah ${fmt(after)}  (×${Number.isFinite(gain) ? gain.toFixed(1) : '∞'})${flag}`,
      );
    }
  }
  console.log(`\n${worse} shot masih di bawah ambang hidup (rata-rata < 0,6 mm/frame atau ada frame mati)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
