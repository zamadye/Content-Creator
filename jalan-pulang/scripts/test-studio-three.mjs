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
    const mixer = new THREE.AnimationMixer(instance);
    for (const clip of gltf.animations) {
      clips += 1;
      assert.ok(clip.duration > 0, `${id}/${clip.name}: zero duration`);
      const action = mixer.clipAction(clip);
      action.play();
      for (const t of [0, clip.duration * 0.37, clip.duration * 0.93]) {
        mixer.setTime(t);
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
      action.stop();
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

assert.equal(problems.length, 0, `\n${problems.join('\n')}`);
console.log(
  `three.js runtime test passed — ${files} GLBs parsed, ${verts.toLocaleString()} vertices, ${clips} animation clips evaluated, ${compiled.shots.length} shots of camera maths (textures stripped: no GPU/Canvas2D in Node)`,
);
