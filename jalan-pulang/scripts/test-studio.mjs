/**
 * Studio framework tests — run with: npm run test:studio
 *
 * Covers the three contracts an agent depends on:
 *   1. the asset registry matches the files on disk,
 *   2. every GLB is loadable and PBR-complete,
 *   3. story JSON validates, compiles deterministically, and only uses real assets.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registry, listAssets, clipsOf, asset} from '../src/studio/library.js';
import {compileStory, summarize} from '../src/studio/compile.js';
import {StoryError, normalizeStory, validateStory} from '../src/studio/schema.js';
import {sampleCamera, facingYaw, EYE_HEIGHT} from '../src/studio/camera.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const publicDir = path.join(root, 'public');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

let checks = 0;
const ok = (label) => {
  checks += 1;
  return label;
};

// --------------------------------------------------------------- 1. registry
assert.equal(registry.schema, 'studio.registry/2');
assert.equal(registry.units, 'metre');
assert.equal(registry.up, '+Y');
const ids = Object.keys(registry.assets);
assert.ok(ids.length >= 50, `expected the full catalogue, got ${ids.length}`);
for (const id of ids) {
  const e = registry.assets[id];
  assert.match(id, /^[a-z0-9][a-z0-9._-]*$/, `bad asset id ${id}`);
  assert.ok(e.title && e.category, `${id}: title/category required`);
  assert.ok(fs.existsSync(path.join(publicDir, e.uri)), `${id}: missing ${e.uri}`);
  assert.ok(fs.existsSync(path.join(publicDir, e.thumbnail)), `${id}: missing thumbnail`);
  assert.ok(e.bounds && e.bounds.size.every((v) => v >= 0), `${id}: bounds`);
  assert.ok(['draft', 'review', 'approved'].includes(e.status), `${id}: status`);
  assert.ok(e.license && e.provenance, `${id}: license/provenance`);
  assert.ok(e.pbr.baseColor && e.pbr.normal && e.pbr.metallicRoughness, `${id}: PBR set incomplete`);
  if (e.rig) {
    assert.equal(e.rig.skeleton.length > 0, true, `${id}: rig skeleton`);
    assert.equal(e.rig.bones, 163, `${id}: expected 163 joints`);
    assert.ok(e.rig.clips.includes('idle') && e.rig.clips.includes('walk'), `${id}: core clips`);
  }
}
ok('registry');

// category coverage the stories rely on
for (const cat of ['character', 'entity', 'road', 'nature', 'building', 'prop', 'vehicle']) {
  assert.ok(listAssets({category: cat}).length > 0, `category ${cat} empty`);
}

// --------------------------------------------------------------- 2. GLBs
function readGlb(buf) {
  assert.equal(buf.readUInt32LE(0), 0x46546c67, 'GLB magic');
  assert.equal(buf.readUInt32LE(4), 2, 'GLB version');
  assert.equal(buf.readUInt32LE(8), buf.length, 'GLB header length');
  let off = 12;
  let doc = null;
  let bin = 0;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    off += 8;
    if (type === 0x4e4f534a) doc = JSON.parse(buf.subarray(off, off + len).toString('utf8').replace(/\0+$/, '').trimEnd());
    else if (type === 0x004e4942) bin = len;
    off += len;
  }
  return {doc, bin};
}

let animated = 0;
for (const id of ids) {
  const e = registry.assets[id];
  const {doc, bin} = readGlb(fs.readFileSync(path.join(publicDir, e.uri)));
  assert.ok(doc.meshes?.length, `${id}: no mesh`);
  assert.ok(doc.buffers[0].byteLength <= bin, `${id}: buffer exceeds BIN chunk`);
  for (const img of doc.images ?? []) assert.ok(img.bufferView !== undefined, `${id}: texture must be embedded`);
  for (const mesh of doc.meshes) {
    for (const prim of mesh.primitives) {
      for (const attr of ['POSITION', 'NORMAL', 'TEXCOORD_0', 'TANGENT']) {
        assert.ok(prim.attributes[attr] !== undefined, `${id}: primitive missing ${attr}`);
      }
      const pos = doc.accessors[prim.attributes.POSITION];
      assert.ok(pos.min && pos.max, `${id}: POSITION needs min/max`);
    }
  }
  for (const m of doc.materials ?? []) {
    assert.ok(m.pbrMetallicRoughness?.baseColorTexture, `${id}/${m.name}: baseColor texture`);
    assert.ok(m.normalTexture, `${id}/${m.name}: normal map`);
  }
  if (doc.skins?.length) {
    animated += 1;
    assert.equal(doc.skins[0].joints.length, 163, `${id}: joints`);
    assert.ok(doc.skins[0].inverseBindMatrices !== undefined, `${id}: IBM`);
    assert.ok(doc.animations.length >= 13, `${id}: animations`);
    for (const a of doc.animations) assert.ok(a.channels.length > 0, `${id}/${a.name}: channels`);
  }
}
assert.ok(animated >= 11, `expected rigged assets, got ${animated}`);
ok('glb');

// --------------------------------------------------------------- 3. schema
const base = {
  schema: 'studio.story/2',
  id: 'unit-test',
  fps: 30,
  cast: {aku: {asset: 'char.male-dewasa-polo'}},
  shots: [{id: 's1', duration: 2, actors: [{ref: 'aku', at: [0, 0, 0], clip: 'walk'}], camera: {preset: 'dolly-in'}}],
};
const compiled = compileStory(structuredClone(base), {registry});
assert.equal(compiled.durationInFrames, 60);
assert.equal(compiled.shots[0].from, 0);
assert.ok(compiled.warnings.length === 0, `unexpected warnings: ${compiled.warnings}`);
assert.match(summarize(compiled), /unit-test/);

const rejects = (mutate, pattern) => {
  const story = structuredClone(base);
  mutate(story);
  assert.throws(() => validateStory(story, {registry}), pattern);
  checks += 1;
};
rejects((s) => (s.schema = 'studio.story/1'), /schema/);
rejects((s) => (s.fps = 29), /fps/);
rejects((s) => (s.shots[0].bogus = 1), /unknown field/);
rejects((s) => (s.cast.aku.asset = 'char.tidak-ada'), /unknown asset/);
rejects((s) => (s.shots[0].actors[0].clip = 'terbang'), /not in char\.male-dewasa-polo/);
rejects((s) => (s.shots[0].actors[0].facing = 'utara'), /facing/);
rejects((s) => (s.shots.push({id: 's1', duration: 1}), null), /duplicate id/);
rejects((s) => (s.shots[0].camera = {preset: 'zoom'}), /camera\.preset/);
rejects((s) => (s.shots[0].duration = 0), /duration/);
rejects((s) => (s.shots[0].audio = {vo: '../secret.mp3'}), /safe public-relative/);
rejects((s) => (s.shots[0].actors.push({ref: 'ghost', at: [0, 0, 0]}), null), /not in cast/);
rejects((s) => (s.width = 1921), /even integer/);
try {
  validateStory({...structuredClone(base), shots: [{id: 'x', duration: 1, light: {preset: 'disko'}}]}, {registry});
  assert.fail('expected throw');
} catch (err) {
  assert.ok(err instanceof StoryError);
  assert.ok(err.problems.length >= 1);
}
ok('schema');

// --------------------------------------------------------------- 4. compile + camera
const two = compileStory(
  {
    ...structuredClone(base),
    shots: [
      {id: 'a', duration: 1.5, camera: {preset: 'static'}},
      {id: 'b', duration: 2.25, camera: {preset: 'dolly-in'}},
    ],
  },
  {registry},
);
assert.equal(two.shots[0].durationInFrames, 45);
assert.equal(two.shots[1].durationInFrames, 68);
assert.equal(two.shots[1].from, 45);
assert.equal(two.durationInFrames, 113);

const cam = (preset, u = 0) => sampleCamera({camera: {preset, fov: 40}}, u, {subject: [0, 0, 0], seed: 3});
const dollyStart = cam('dolly-in', 0);
const dollyEnd = cam('dolly-in', 1);
assert.ok(dollyEnd.position[2] < dollyStart.position[2], 'dolly-in must approach');
assert.deepEqual(cam('static', 0), cam('static', 1), 'static camera must not move');
assert.deepEqual(cam('dolly-in', 0.5), cam('dolly-in', 0.5), 'camera sampling must be deterministic');
assert.ok(cam('handheld', 0.3).position[0] !== cam('handheld', 0.31).position[0], 'handheld must wobble');
assert.equal(facingYaw('+Z'), 0);
assert.equal(facingYaw('-Z'), Math.PI);
assert.ok(EYE_HEIGHT > 1.4 && EYE_HEIGHT < 1.8);
for (const preset of ['static', 'dolly-in', 'dolly-out', 'pan', 'orbit', 'crane-up', 'low-angle', 'over-shoulder', 'handheld']) {
  const c = cam(preset, 0.42);
  assert.ok(c.position.every(Number.isFinite) && c.target.every(Number.isFinite), `${preset}: finite camera`);
  assert.ok(c.fov >= 10 && c.fov <= 120, `${preset}: fov`);
}
ok('compile+camera');

// --------------------------------------------------------------- 5. stories on disk
const studioDir = path.join(root, 'stories', 'studio');
const storyFiles = fs.existsSync(studioDir) ? fs.readdirSync(studioDir).filter((f) => f.endsWith('.json')) : [];
assert.ok(storyFiles.length >= 3, 'expected example stories');
for (const file of storyFiles) {
  const raw = JSON.parse(fs.readFileSync(path.join(studioDir, file), 'utf8'));
  const c = compileStory(raw, {registry});
  assert.ok(c.durationInFrames > 0);
  for (const id of c.assetIds) assert.ok(asset(id), `${file}: asset ${id}`);
  const again = compileStory(raw, {registry});
  assert.equal(again.durationInFrames, c.durationInFrames, `${file}: compile must be deterministic`);
}
ok('stories');

// --------------------------------------------------------------- 6. docs & catalogue
const catalogue = fs.readFileSync(path.join(root, 'docs', 'ASSET-CATALOG.md'), 'utf8');
assert.ok(catalogue.includes('KATALOG ASET'), 'catalogue header');
assert.equal((catalogue.match(/^\| `/gm) ?? []).length, ids.length, 'catalogue rows must match registry');
const storyDoc = fs.readFileSync(path.join(root, 'docs', 'STORY-FORMAT.md'), 'utf8');
for (const key of ['studio.story/2', 'camera', 'actors']) assert.ok(storyDoc.includes(key), `STORY-FORMAT must document ${key}`);
ok('docs');

console.log(`Studio tests passed — ${checks} assertions groups over ${ids.length} assets, ${storyFiles.length} stories`);
assert.ok(clipsOf('char.male-dewasa-polo').includes('ride'));
