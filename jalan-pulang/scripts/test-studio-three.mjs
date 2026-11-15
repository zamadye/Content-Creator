/**
 * Runtime integration test: does three.js actually parse our GLBs and animate them?
 *
 * Textures are stripped before parsing (Node has no DOM/2D canvas), so this covers
 * geometry, skinning, animation and scene graph — everything except GPU upload.
 *
 *   node scripts/test-studio-three.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {registry} from '../src/studio/library.js';
import {compileStory} from '../src/studio/compile.js';
import {secondaryTurns, applySecondary, prepareSecondary, resetSecondary, SECONDARY_BONES} from '../src/studio/secondary.js';
import {createClipSampler} from '../src/studio/clip-sample.js';
import {aimGaze, gazeDirection, gazeOrigin} from '../src/studio/ik.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([jsonBytes, jsonPad]);
  const binPad = Buffer.alloc((4 - (bin.length % 4)) % 4, 0);
  const binChunk = Buffer.concat([bin, binPad]);
  const header = Buffer.alloc(12);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jsonChunk.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(binChunk.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, jsonChunk, bh, binChunk]);
}

const loader = new GLTFLoader();
const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const parse = (buffer) =>
  new Promise((resolve, reject) => loader.parse(toArrayBuffer(buffer), '', resolve, reject));

const allFinite = (arr) => {
  for (const v of arr) if (!Number.isFinite(v)) return false;
  return true;
};

let files = 0;
let clips = 0;
let verts = 0;
const problems = [];

for (const id of Object.keys(registry.assets)) {
  const file = path.join(root, 'public', registry.assets[id].uri);
  const {json, bin} = splitGlb(fs.readFileSync(file));
  let gltf;
  try {
    gltf = await parse(buildGlb(json, bin));
  } catch (err) {
    problems.push(`${id}: three.js failed to parse — ${err.message}`);
    continue;
  }
  files += 1;
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);

  let meshes = 0;
  let skinned = 0;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    meshes += 1;
    const pos = o.geometry.getAttribute('position');
    assert.ok(pos && pos.count > 0, `${id}: empty geometry`);
    verts += pos.count;
    assert.ok(allFinite(pos.array), `${id}: non-finite vertex positions`);
    const nrm = o.geometry.getAttribute('normal');
    assert.ok(nrm && allFinite(nrm.array), `${id}: non-finite normals`);
    const uv = o.geometry.getAttribute('uv');
    assert.ok(uv, `${id}: missing uv`);
    if (o.isSkinnedMesh) {
      skinned += 1;
      assert.equal(o.skeleton.bones.length, 163, `${id}: skeleton bones`);
      const weights = o.geometry.getAttribute('skinWeight');
      assert.ok(weights, `${id}: missing skinWeight`);
    }
  });
  assert.ok(meshes > 0, `${id}: no meshes`);

  // Instances must be independent clones (two actors from one asset).
  const instance = cloneSkeleton(scene);
  assert.notEqual(instance, scene);

  if (gltf.animations.length) {
    for (const clip of gltf.animations) {
      clips += 1;
      assert.ok(clip.duration > 0, `${id}/${clip.name}: zero duration`);
      const sampler = createClipSampler(instance, clip);
      assert.ok(sampler.channels > 0, `${id}/${clip.name}: no channels bound`);
      for (const t of [0, clip.duration * 0.37, clip.duration * 0.93]) {
        sampler.apply(t);
        instance.updateMatrixWorld(true);
        instance.traverse((o) => {
          if (!o.isBone) return;
          const p = o.getWorldPosition(new THREE.Vector3());
          assert.ok(
            Math.abs(p.x) < 2.2 && p.y > -1.5 && p.y < 3.6 && Math.abs(p.z) < 2.2,
            `${id}/${clip.name}: bone ${o.name} outside the body box (${p.toArray().map((n) => n.toFixed(2))})`,
          );
        });
        instance.traverse((o) => {
          if (!o.isSkinnedMesh) return;
          const b = o.skeleton.bones[Math.floor(o.skeleton.bones.length / 2)];
          assert.ok(allFinite(b.matrixWorld.elements), `${id}/${clip.name}: non-finite bone matrix at ${t.toFixed(2)}s`);
        });
      }
      // A skinned vertex must stay inside a believable human-sized box.
      // Diukur pada t=0: klip `float` memang menerjemahkan akar ke atas (1,19 m),
      // jadi posisi akhir sampel tidak boleh dipakai sebagai acuan.
      sampler.apply(0);
      instance.updateMatrixWorld(true);
      instance.traverse((o) => {
        if (!o.isSkinnedMesh) return;
        const attr = o.geometry.getAttribute('position');
        if (!attr.count) return;
        o.skeleton.update();
        const step = Math.max(1, Math.floor(attr.count / 60));
        for (let vi = 0; vi < attr.count; vi += step) {
          const rest = new THREE.Vector3().fromBufferAttribute(attr, vi);
          const v = rest.clone();
          o.applyBoneTransform(vi, v);
          v.applyMatrix4(o.matrixWorld);
          const moved = v.distanceTo(rest.clone().applyMatrix4(o.matrixWorld));
          assert.ok(
            moved < 1.1,
            `${id}/${clip.name}: vertex ${vi} of ${o.name} flew ${moved.toFixed(2)} m from its rest position (transposed inverse bind matrices?)`,
          );
          assert.ok(allFinite([v.x, v.y, v.z]), `${id}/${clip.name}: non-finite skinned vertex ${vi}`);
          assert.ok(
            Math.abs(v.x) < 40 && Math.abs(v.y) < 40 && Math.abs(v.z) < 40,
            `${id}/${clip.name}: skinned vertex ${vi} escaped (${v.toArray().map((n) => n.toFixed(1))})`,
          );
        }
      });
    }
    assert.ok(skinned > 0, `${id}: animated but not skinned`);
  }
  // anchors
  const anchors = [];
  scene.traverse((o) => {
    if (String(o.name).startsWith('anchor')) anchors.push(o.name);
  });
  if (registry.assets[id].anchors?.length) {
    assert.equal(anchors.length, registry.assets[id].anchors.length, `${id}: anchor node count`);
  }
}

// Compile a story and feed every shot's camera through the renderer's maths.
const story = JSON.parse(fs.readFileSync(path.join(root, 'stories/studio/uji-kamera.json'), 'utf8'));
const compiled = compileStory(story, {registry});
for (const shot of compiled.shots) {
  for (let f = 0; f <= shot.durationInFrames; f += 5) {
    const u = shot.durationInFrames > 1 ? f / (shot.durationInFrames - 1) : 0;
    const cam = shot.cameraSample(Math.min(1, u));
    assert.ok(allFinite([...cam.position, ...cam.target]), `${shot.id}: non-finite camera`);
    assert.ok(cam.fov >= 10 && cam.fov <= 120);
  }
}

// ------------------------------------------- pose murni terhadap waktu (render)
{
  // Remotion merender frame secara acak dan paralel: pose seekor aktor WAJIB
  // hanya fungsi dari waktu lokal shot. Ini yang menangkap pemakaian
  // AnimationMixer.setTime(), yang menyimpang sampai 13,8 cm pada `walk` antara
  // "langsung ke t=2,0" dan "melangkah 120 frame lalu ke t=2,0".
  const charId = 'char.male-muda-jaket';
  const {json, bin} = splitGlb(fs.readFileSync(path.join(root, 'public', registry.assets[charId].uri)));
  const gltf = await parse(buildGlb(json, bin));
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'walk');
  const times = [0, 0.37, 1.0, 2.0, 3.31, 5.02];

  const make = () => {
    const inst = cloneSkeleton(gltf.scene);
    inst.updateMatrixWorld(true);
    const sampler = createClipSampler(inst, clip);
    return {inst, sampler};
  };
  const probe = ({inst, sampler}, t) => {
    sampler.apply(t);
    inst.updateMatrixWorld(true);
    return inst.getObjectByName('wristL').getWorldPosition(new THREE.Vector3());
  };

  // 1. instance segar untuk tiap waktu (cara render sesungguhnya)
  const fresh = times.map((t) => probe(make(), t));
  // 2. satu instance, waktu naik
  const up = make();
  const seq = times.map((t) => probe(up, t));
  // 3. satu instance, urutan acak
  const rnd = make();
  const order = [4, 1, 5, 0, 3, 2];
  const shuffled = [];
  for (const i of order) shuffled[i] = probe(rnd, times[i]);
  // 4. instance yang sempat melangkah 1/120 detik sampai t terakhir
  const stepped = make();
  for (let f = 0; f <= 3.31 * 120; f += 1) probe(stepped, f / 120);

  let worst = 0;
  for (let i = 0; i < times.length; i++) {
    worst = Math.max(worst, seq[i].distanceTo(fresh[i]), shuffled[i].distanceTo(fresh[i]));
  }
  assert.ok(worst < 1e-9, `pose must be frame-pure (worst drift ${(worst * 1000).toFixed(3)} mm)`);
  // setelah melangkah, waktu berikutnya tetap sama persis
  const afterStep = probe(stepped, 2.0);
  assert.ok(afterStep.distanceTo(fresh[3]) < 1e-9, 'stepping history must not change a later frame');

  // klip berulang: t dan t+duration adalah pose yang sama
  const smp = make();
  const p0 = probe(smp, 0.8);
  const pw = probe(smp, 0.8 + clip.duration);
  assert.ok(p0.distanceTo(pw) < 1e-9, 'clip must loop seamlessly in the sampler');
  console.log(`pose murni: ${times.length} waktu x 4 urutan, simpangan maks ${(worst * 1000).toFixed(4)} mm`);
}

// ------------------------------------------------ menoleh / aim gaze (langkah 33)
{
  const charId = 'char.female-lansia';
  const {json, bin} = splitGlb(fs.readFileSync(path.join(root, 'public', registry.assets[charId].uri)));
  const gltf = await parse(buildGlb(json, bin));
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'sit');

  const rigged = () => {
    const inst = cloneSkeleton(gltf.scene);
    inst.updateMatrixWorld(true);
    const sampler = createClipSampler(inst, clip);
    prepareSecondary(inst, sampler.animatedNodes);
    sampler.apply(0.7);
    inst.updateMatrixWorld(true);
    return inst;
  };
  const errorTo = (inst, target) => {
    const want = new THREE.Vector3(...target).sub(gazeOrigin(inst)).normalize();
    return gazeDirection(inst).angleTo(want);
  };
  const deg = (r) => (r * 180) / Math.PI;

  // target di depan: harus hampir tepat
  const front = [0, 1.35, 2];
  const a = rigged();
  const before = errorTo(a, front);
  const res = aimGaze(a, front, {maxAngle: 1.05, maxPitch: 0.5});
  a.updateMatrixWorld(true);
  const after = errorTo(a, front);
  assert.ok(res.applied, 'aim must report applied');
  assert.ok(before > 0.05, `rig should not already stare straight ahead (was ${deg(before).toFixed(1)}°)`);
  assert.ok(after < 0.05, `gaze must land on target (error ${deg(after).toFixed(1)}°)`);

  // target di samping 80°: dipotong ke maxAngle, tapi tetap membaik
  const side = [2, 1.35, 0];
  const b = rigged();
  const beforeSide = errorTo(b, side);
  const resSide = aimGaze(b, side, {maxAngle: 1.05});
  b.updateMatrixWorld(true);
  assert.ok(resSide.angle <= 1.0501, `turn must be clamped (${deg(resSide.angle).toFixed(1)}°)`);
  assert.ok(errorTo(b, side) < beforeSide * 0.85, 'clamped turn must still reduce the error');

  // target di belakang: dipotong, leher tidak terpelintir
  const c = rigged();
  const resBack = aimGaze(c, [0, 1.4, -2], {maxAngle: 1.05});
  c.updateMatrixWorld(true);
  assert.ok(resBack.angle <= 1.0501, 'never twist the neck past the clamp');
  assert.ok(errorTo(c, [0, 1.4, -2]) > 1.0, 'target behind the head stays out of view');

  // murni terhadap pose: dua instans berbeda riwayat → hasil identik
  const d1 = rigged();
  const d2 = rigged();
  for (const inst of [d1, d2]) {
    aimGaze(inst, front, {maxAngle: 1.05});
    inst.updateMatrixWorld(true);
  }
  const h1 = d1.getObjectByName('head').getWorldQuaternion(new THREE.Quaternion());
  const h2 = d2.getObjectByName('head').getWorldQuaternion(new THREE.Quaternion());
  // 1e-6 rad ≈ 0,00006°: batas noise acos di dekat dot=1 (data quaternion float32)
  assert.ok(h1.angleTo(h2) < 1e-6, `aim must be deterministic (differs by ${h1.angleTo(h2).toExponential(2)} rad)`);
  assert.ok(allFinite(h1.toArray()), 'aim must not produce NaN');

  console.log(
    `menoleh: galat ${deg(before).toFixed(1)}° → ${deg(after).toFixed(2)}° (target depan), ` +
      `samping ${deg(beforeSide).toFixed(0)}° dipotong ke ${deg(resSide.angle).toFixed(1)}°`,
  );
}

// ------------------------------------------------- gerak sekunder (langkah 38)
{
  // Klip cuma punya satu lapis gerak; kepala dan tangan harus datang terlambat.
  // Diukur pada dua salinan identik: satu dengan lapisan sekunder, satu tanpa.
  const charId = 'char.male-muda-jaket';
  const {json, bin} = splitGlb(fs.readFileSync(path.join(root, 'public', registry.assets[charId].uri)));
  const gltf = await parse(buildGlb(json, bin));
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'walk');
  assert.ok(clip && clip.duration > 0, 'walk clip must exist');

  // semua tulang yang disebut harus benar-benar ada di rig
  const probe = cloneSkeleton(gltf.scene);
  for (const name of SECONDARY_BONES) {
    const found = probe.getObjectByName(name) ?? probe.getObjectByName(name.replace(/[.[\]:/ ]/g, ''));
    assert.ok(found, `secondary bone "${name}" must exist in the rig`);
  }

  const track = (intensity) => {
    const inst = cloneSkeleton(gltf.scene);
    inst.updateMatrixWorld(true);
    const sampler = createClipSampler(inst, clip);
    prepareSecondary(inst, sampler.animatedNodes);
    const out = [];
    for (let f = 0; f <= 120; f += 1) {
      const t = f / 60;
      sampler.apply(t * 0.6);
      if (intensity > 0) {
        applySecondary(inst, secondaryTurns(t, {clip: 'walk', duration: clip.duration, speed: 0.6, intensity}));
      }
      inst.updateMatrixWorld(true);
      const head = inst.getObjectByName('head');
      const hand = inst.getObjectByName('wristL') ?? inst.getObjectByName('wrist.L') ?? inst.getObjectByName('wristL');
      out.push({
        head: head.getWorldPosition(new THREE.Vector3()),
        hand: hand ? hand.getWorldPosition(new THREE.Vector3()) : null,
      });
    }
    return out;
  };

  const plain = track(0);
  const moved = track(1);
  let maxHead = 0;
  let sumHead = 0;
  let maxHand = 0;
  for (let i = 0; i < plain.length; i++) {
    const d = plain[i].head.distanceTo(moved[i].head);
    maxHead = Math.max(maxHead, d);
    sumHead += d;
    if (plain[i].hand && moved[i].hand) {
      maxHand = Math.max(maxHand, plain[i].hand.distanceTo(moved[i].hand));
    }
  }
  const meanHead = sumHead / plain.length;
  assert.ok(allFinite(moved.flatMap((m) => m.head.toArray())), 'secondary must not produce NaN');
  assert.ok(maxHead > 0.004, `head must visibly lag the chest (max ${(maxHead * 1000).toFixed(1)} mm)`);
  assert.ok(meanHead > 0.001, `mean head offset ${(meanHead * 1000).toFixed(2)} mm is too small to see`);
  assert.ok(maxHand > 0.004, `hand follow-through must be visible (max ${(maxHand * 1000).toFixed(1)} mm)`);

  // determinisme: waktu yang sama -> pose yang sama (Remotion merender frame
  // secara acak/paralel, jadi tidak boleh ada state yang menumpuk)
  const a = cloneSkeleton(gltf.scene);
  const b = cloneSkeleton(gltf.scene);
  for (const inst of [a, b]) {
    const sampler = createClipSampler(inst, clip);
    prepareSecondary(inst, sampler.animatedNodes);
    sampler.apply(0.9);
    applySecondary(inst, secondaryTurns(1.5, {clip: 'walk', duration: clip.duration, speed: 0.6, intensity: 1}));
    inst.updateMatrixWorld(true);
  }
  const ha = a.getObjectByName('head').getWorldPosition(new THREE.Vector3());
  const hb = b.getObjectByName('head').getWorldPosition(new THREE.Vector3());
  assert.ok(ha.distanceTo(hb) < 1e-9, 'secondary must be a pure function of shot time');

  // intensitas: 0 = mati, 2 = dua kali sudut
  assert.deepEqual(secondaryTurns(1, {clip: 'walk', duration: 1, intensity: 0}), [], 'intensity 0 must be a no-op');
  const one = secondaryTurns(0.4, {clip: 'walk', duration: 1.07, speed: 1, intensity: 1});
  const two = secondaryTurns(0.4, {clip: 'walk', duration: 1.07, speed: 1, intensity: 2});
  assert.equal(one.length, two.length);
  for (let i = 0; i < one.length; i++) {
    assert.ok(Math.abs(two[i].angle - 2 * one[i].angle) < 1e-12, 'intensity scales linearly');
  }
  // klip tanpa langkah hanya bernapas + goyang lambat
  const idleTurns = secondaryTurns(0.4, {clip: 'idle', duration: 2, speed: 1, intensity: 1});
  assert.ok(!idleTurns.some((o) => o.bone.startsWith('lowerarm')), 'no gait swing on idle');
  console.log(
    `gerak sekunder: kepala bergeser maks ${(maxHead * 1000).toFixed(1)} mm (rata-rata ${(meanHead * 1000).toFixed(2)} mm), ` +
      `tangan ${(maxHand * 1000).toFixed(1)} mm, deterministik`,
  );
}

assert.equal(problems.length, 0, `\n${problems.join('\n')}`);
console.log(
  `three.js runtime test passed — ${files} GLBs parsed, ${verts.toLocaleString()} vertices, ${clips} animation clips evaluated, ${compiled.shots.length} shots of camera maths (textures stripped: no GPU/Canvas2D in Node)`,
);
