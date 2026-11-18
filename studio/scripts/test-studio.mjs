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
import {createHash} from 'node:crypto';
import gltfValidator from 'gltf-validator';
import {productionIssues} from './lib/production-cast.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registry, listAssets, clipsOf, asset} from '../src/studio/library.js';
import {compileStory, summarize} from '../src/studio/compile.js';
import {StoryError, normalizeStory, validateStory} from '../src/studio/schema.js';
import {sampleCamera, facingYaw, EYE_HEIGHT} from '../src/studio/camera.js';
import {framingIssues} from './qc-framing.mjs';
import {secondaryTurns} from '../src/studio/secondary.js';
import {parseAudit, summaryTable, totalLine} from './lib/audit.mjs';
import {budgetProblems, assetTable} from './qc-topology.mjs';

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
    const file = fs.readFileSync(path.join(publicDir, e.uri));
    const report = await gltfValidator.validateBytes(file, {maxIssues: 100000, writeTimestamp: false});
    assert.equal(report.issues.numErrors, 0, `${id}: invalid GLB: ${report.issues.messages.find(m => m.severity === 0)?.message}`);
    if (e.review) assert.equal(e.review.sha256, createHash('sha256').update(file).digest('hex'), id + ': stale review');
    assert.equal(e.rig.skeleton.length > 0, true, `${id}: rig skeleton`);
    // 163 tulang tubuh; entitas ber-shroud menambah rantai kain 3 tulang
    assert.ok(e.rig.bones === 163 || e.rig.bones === 166, `${id}: unexpected joint count ${e.rig.bones}`);
    assert.ok(e.rig.clips.includes('idle') && e.rig.clips.includes('walk'), `${id}: core clips`);
  }
}
ok('registry');

const castModels = listAssets({rigged: true});
const identities = castModels.filter((a) => !a.variantOf).map((a) => a.id);
assert.deepEqual(Object.keys(registry.identities).sort(), identities.sort(), 'one biography per identity');
const names = new Set(), bios = new Set();
for (const a of castModels) {
  assert.equal(a.identityId, a.variantOf || a.id, a.id + ': costume identity');
  const profile = registry.identities[a.identityId];
  assert.ok(profile.name.trim() && profile.role.trim() && profile.bio.trim(), a.id + ': incomplete bio');
  if (a.variantOf) continue;
  if (a.review) assert.ok(fs.existsSync(path.join(publicDir, a.portrait)), a.id + ': missing portrait');
  assert.ok(!names.has(profile.name) && !bios.has(profile.bio), a.id + ': duplicate identity');
  names.add(profile.name);
  bios.add(profile.bio);
}
ok('cast-identities');

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
    assert.equal(doc.skins[0].joints.length, registry.assets[id].rig.bones, `${id}: joints must match the registry`);
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
rejects((s) => (s.shots[0].lookPreset = 'senja-palsu'), /lookPreset/);
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
const studioDir = path.join(root, 'stories');
const storyFiles = fs.existsSync(studioDir)
  ? fs
      .readdirSync(studioDir, {withFileTypes: true})
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(studioDir, d.name, 'story.json')))
      .map((d) => path.join('stories', d.name, 'story.json'))
      .sort()
  : [];
assert.ok(storyFiles.length >= 3, 'expected example stories');
for (const file of storyFiles) {
  const raw = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const c = compileStory(raw, {registry});
  assert.ok(c.durationInFrames > 0);
  for (const id of c.assetIds) assert.ok(asset(id), `${file}: asset ${id}`);
  const again = compileStory(raw, {registry});
  assert.equal(again.durationInFrames, c.durationInFrames, `${file}: compile must be deterministic`);
}
// follow: kamera berjalan bersama aktor yang bergerak (`travel`)
{
  const base = JSON.parse(fs.readFileSync(path.join(studioDir, 'uji-kamera', 'story.json'), 'utf8'));
  const walk = JSON.parse(JSON.stringify(base));
  walk.shots = [
    {
      id: 'ikut',
      duration: 4,
      actors: [{ref: Object.keys(base.cast)[0], at: [0, 0, 2], facing: '-Z', clip: 'walk', speed: 0.6, travel: 1.36}],
      camera: {preset: 'follow', distance: 4.2, height: 1.45, fov: 40},
    },
  ];
  const shot = compileStory(walk, {registry}).shots[0];
  const a = shot.cameraSample(0);
  const b = shot.cameraSample(1);
  const sec = shot.durationInFrames / 30;
  const dist = (cam, sub) => Math.hypot(cam.position[0] - sub[0], cam.position[1] - sub[1], cam.position[2] - sub[2]);
  const subAt = (u) => [0, 0, 2 - 1.36 * sec * u];
  assert.ok(Math.abs(dist(a, subAt(0)) - dist(b, subAt(1))) < 1e-3, 'follow keeps a constant distance');
  const moved = Math.hypot(b.position[0] - a.position[0], b.position[2] - a.position[2]);
  assert.ok(Math.abs(moved - 1.36 * sec) < 1e-3, `camera must travel with the actor (${moved.toFixed(2)} m vs ${(1.36 * sec).toFixed(2)} m)`);

  const still = JSON.parse(JSON.stringify(walk));
  still.shots[0].actors[0].travel = 0;
  const s2 = compileStory(still, {registry}).shots[0];
  assert.ok(Math.abs(s2.cameraSample(1).position[2] - s2.cameraSample(0).position[2]) < 1e-6, 'follow must stay put when the actor does');

  const bad = JSON.parse(JSON.stringify(walk));
  bad.shots[0].camera.distance = 40;
  assert.throws(() => validateStory(bad, {registry}), /distance/, 'distance out of range must be rejected');
}
ok('camera follow');

ok('stories');

// -------------------------------------------------------------------- 5e. hold
{
  const src = JSON.parse(fs.readFileSync(path.join(studioDir, 'warung-malam', 'story.json'), 'utf8'));
  const base = JSON.parse(JSON.stringify(src));
  base.objects = {lampu: {asset: 'prop.lamp.teplok'}};
  base.shots = [
    {
      id: 'bawa',
      duration: 2,
      actors: [{ref: 'ibu', at: [0, 0, 0], facing: '+Z', clip: 'walk', hold: 'lampu'}],
      camera: {preset: 'static'},
    },
  ];
  const compiled = compileStory(base, {registry});
  const cast = compiled.shots[0].cast[0];
  assert.equal(cast.hold, 'lampu', 'hold ref must survive compile');
  assert.equal(cast.holdHand, 'R', 'holdHand defaults to the right hand');
  assert.ok(compiled.assetIds.includes('prop.lamp.teplok'), 'held prop must be loaded even when not placed in the set');

  const left = JSON.parse(JSON.stringify(base));
  left.shots[0].actors[0].holdHand = 'L';
  assert.equal(compileStory(left, {registry}).shots[0].cast[0].holdHand, 'L');

  const unknown = JSON.parse(JSON.stringify(base));
  unknown.shots[0].actors[0].hold = 'parang';
  assert.throws(() => validateStory(unknown, {registry}), /not in objects/, 'unknown hold ref must be rejected');

  const badHand = JSON.parse(JSON.stringify(base));
  badHand.shots[0].actors[0].holdHand = 'tengah';
  assert.throws(() => validateStory(badHand, {registry}), /holdHand/, 'holdHand must be L or R');
  ok('hold');
}

// ------------------------------------------------------------------ 5d. lookAt
{
  const src = JSON.parse(fs.readFileSync(path.join(studioDir, 'warung-malam', 'story.json'), 'utf8'));
  const base = JSON.parse(JSON.stringify(src));
  base.shots = [
    {
      id: 'tatap',
      duration: 2,
      actors: [
        {ref: 'ibu', at: [0, 0, 0], facing: '+Z', clip: 'talk', lookAt: 'aku'},
        {ref: 'aku', at: [1.2, 0, 0.8], facing: '-X', clip: 'sit', lookAt: 'ibu'},
      ],
      camera: {preset: 'static'},
    },
  ];
  const compiled = compileStory(base, {registry});
  assert.equal(compiled.shots[0].cast[0].lookAt, 'aku', 'lookAt ref must survive compile');

  assert.equal(compiled.shots[0].cast[0].gazeWeight, 1);
  const point = JSON.parse(JSON.stringify(base));
  point.shots[0].actors[0].gazeWeight = 0;
  assert.equal(compileStory(point, {registry}).shots[0].cast[0].gazeWeight, 0);
  point.shots[0].actors[0].gazeWeight = 1.5;
  assert.throws(() => validateStory(point, {registry}), /gazeWeight/);
  point.shots[0].actors[0].gazeWeight = 0.52;
  assert.equal(compileStory(point, {registry}).shots[0].cast[0].gazeWeight, 0.52);
  point.shots[0].actors[0].lookAt = [0, 1.4, 3];
  assert.deepEqual(compileStory(point, {registry}).shots[0].cast[0].lookAt, [0, 1.4, 3]);

  const self = JSON.parse(JSON.stringify(base));
  self.shots[0].actors[0].lookAt = 'ibu';
  assert.throws(() => validateStory(self, {registry}), /diri sendiri/, 'looking at self must be rejected');

  const unknown = JSON.parse(JSON.stringify(base));
  unknown.shots[0].actors[0].lookAt = 'hantu';
  assert.throws(() => validateStory(unknown, {registry}), /not in cast/, 'unknown lookAt ref must be rejected');

  const absent = JSON.parse(JSON.stringify(base));
  absent.shots[0].actors = [absent.shots[0].actors[0]];
  assert.throws(() => validateStory(absent, {registry}), /must be placed in this shot/, 'target must be in the shot');

  const badVec = JSON.parse(JSON.stringify(base));
  badVec.shots[0].actors[0].lookAt = [0, 1];
  assert.throws(() => validateStory(badVec, {registry}), /lookAt/, 'lookAt point must be [x, y, z]');
  ok('lookAt');
}

// ------------------------------------------------------------ 5a. gerak sekunder
{
  const shot = {id: 'a', duration: 1, actors: [], camera: {preset: 'static'}};
  const base = JSON.parse(fs.readFileSync(path.join(studioDir, 'uji-kamera', 'story.json'), 'utf8'));

  // default 1, diteruskan compile, dan boleh dimatikan per shot
  const on = JSON.parse(JSON.stringify(base));
  on.shots = [shot];
  assert.equal(compileStory(on, {registry}).shots[0].secondary, 1, 'secondary defaults to 1');

  const off = JSON.parse(JSON.stringify(base));
  off.shots = [{...shot, secondary: 0}];
  assert.equal(compileStory(off, {registry}).shots[0].secondary, 0, 'secondary 0 must survive compile');

  const loud = JSON.parse(JSON.stringify(base));
  loud.shots = [{...shot, secondary: 1.5}];
  assert.equal(compileStory(loud, {registry}).shots[0].secondary, 1.5);

  const bad = JSON.parse(JSON.stringify(base));
  bad.shots = [{...shot, secondary: 3}];
  assert.throws(() => validateStory(bad, {registry}), /secondary/, 'secondary above 2 must be rejected');

  // gerak sekunder: murni terhadap waktu, mati saat intensitas 0
  const turns = secondaryTurns(0.4, {clip: 'walk', duration: 1.07, speed: 0.6, intensity: 1});
  assert.ok(turns.length > 5, 'walk must produce overlap + breath + drift');
  assert.deepEqual(secondaryTurns(0.4, {clip: 'walk', duration: 1.07, intensity: 0}), []);
  assert.deepEqual(
    secondaryTurns(0.4, {clip: 'walk', duration: 1.07, intensity: 1}),
    secondaryTurns(0.4, {clip: 'walk', duration: 1.07, intensity: 1}),
    'secondary turns must be a pure function of time',
  );
  for (const t of turns) assert.ok(Number.isFinite(t.angle) && Math.abs(t.angle) < 0.2, 'angles stay small');
  ok('secondary');
}

// --------------------------------------------------------------- 5b. travel aktor
{
  const base = JSON.parse(fs.readFileSync(path.join(studioDir, 'uji-kamera', 'story.json'), 'utf8'));
  const walkShot = JSON.parse(JSON.stringify(base));
  walkShot.id = 'uji-travel';
  walkShot.shots = [walkShot.shots[0]];
  walkShot.shots[0].actors = [{ref: Object.keys(base.cast)[0], at: [0, 0, 0], facing: '+Z', clip: 'walk', travel: 1.4, speed: 0.6}];
  const compiled = compileStory(walkShot, {registry});
  const cast = compiled.shots[0].cast[0];
  assert.equal(cast.travel, 1.4, 'compile must pass actor travel through');
  assert.equal(cast.speed, 0.6, 'compile must pass actor speed through');
  assert.equal(compiled.shots[0].cast[0].facing.length, 3, 'facing vector');

  const bad = JSON.parse(JSON.stringify(walkShot));
  bad.shots[0].actors[0].travel = 9;
  assert.throws(() => validateStory(bad, {registry}), /travel/, 'travel above 6 m/s must be rejected');
  const silent = JSON.parse(JSON.stringify(walkShot));
  silent.shots[0].actors[0].travel = 0;
  validateStory(silent, {registry}); // tidak boleh melempar
  ok('actor travel');
}

// --------------------------------------------------------------- 5c. framing shot
{
  // Setiap cerita yang dikirim harus menjaga kepala + dada aktornya di dalam
  // frame sepanjang shot. Ini yang menangkap kamera yang menempel ke aktor atau
  // dolly yang berakhir terlalu jauh — tanpa perlu render.
  let shots = 0;
  for (const file of storyFiles) {
    const compiled = compileStory(readJson(file), {registry});
    for (const row of framingIssues(compiled)) {
      shots++;
      assert.notEqual(row.status, 'LUAR', `${file} ${row.id}: ${row.issues.join('; ')}`);
      assert.deepEqual(row.issues, [], `${file} ${row.id}: ${row.issues.join('; ')}`);
    }
  }
  assert.ok(shots >= 20, `expected at least 20 shots to check, got ${shots}`);
  ok('framing');
}

// --------------------------------------------------------------- 6. docs & catalogue
const catalogue = fs.readFileSync(path.join(root, 'docs', 'ASSET-CATALOG.md'), 'utf8');
assert.ok(catalogue.includes('KATALOG ASET'), 'catalogue header');
assert.equal((catalogue.match(/^\| `/gm) ?? []).length, ids.length, 'catalogue rows must match registry');
const storyDoc = fs.readFileSync(path.join(root, 'docs', 'STORY-FORMAT.md'), 'utf8');
for (const key of ['studio.story/2', 'camera', 'actors']) assert.ok(storyDoc.includes(key), `STORY-FORMAT must document ${key}`);
// --------------------------------------------------------------- 7. topologi & anggaran
{
  const {violations, summary, heaviestShot, stories, ids: topoIds} = await import('./qc-topology.mjs');
  const {problems, heavy} = violations();
  assert.deepEqual(problems, [], `anggaran topologi: ${problems.join('; ')}`);
  assert.equal(topoIds.length, ids.length, 'semua aset diukur');
  assert.ok(heavy.tris > 0 && heavy.tris <= 120000, `shot terberat ${heavy.where} = ${heavy.tris} tri`);
  const per = summary();
  assert.equal(Object.keys(per).length, registry.categories.length, 'semua kategori punya anggaran');
  // pagar ini harus bisa gagal: aset karangan yang melewati anggaran wajib terdeteksi
  const fake = budgetProblems({'char.palsu': {category: 'character', tris: 50000, maxTex: 4096, registryTris: 50000}});
  assert.equal(fake.length, 2, `pelanggaran karangan harus dilaporkan, dapat ${JSON.stringify(fake)}`);
  const planDoc = fs.readFileSync(path.join(root, 'docs', 'TOPOLOGY-PLAN.md'), 'utf8');
  assert.ok(planDoc.includes(assetTable()), 'tabel topologi harus sinkron dengan GLB');
  void stories;
  void heaviestShot;
  ok('topology');
}

// --------------------------------------------------------------- 8. UV packing
{
  const {uvProblems, uvTable, summary: uvSummary} = await import('./qc-uv.mjs');
  const problems = uvProblems();
  assert.deepEqual(problems, [], `UV: ${problems.join('; ')}`);
  const s = uvSummary();
  assert.equal((s.kinds.tabrakan ?? 0), 0, 'tidak boleh ada UV bertabrakan');
  assert.ok(s.minDensity >= 100, `kepadatan texel terendah ${Math.round(s.minDensity)} px/m`);
  // pagar harus bisa gagal: baris karangan dengan tumpang tindih 40 % wajib dilaporkan
  const fake = uvProblems([{id: 'x.palsu', uv: {kind: 'tabrakan', overlap: 0.4, density: 50}}]);
  assert.equal(fake.length, 2, `pelanggaran UV karangan harus dilaporkan, dapat ${JSON.stringify(fake)}`);
  const doc = fs.readFileSync(path.join(root, 'docs', 'UV-PACKING.md'), 'utf8');
  assert.ok(doc.includes(uvTable()), 'tabel UV harus sinkron dengan GLB');
  ok('uv');
}

// --------------------------------------------------------------- 9. bake AO
{
  const {execFileSync} = await import('node:child_process');
  const py = ['./.venv/bin/python', 'python3'].find((p) => fs.existsSync(path.join(root, p))) ?? 'python3';
  let ok3 = true;
  let skipped = '';
  try {
    const self = execFileSync(py, ['studio-forge/dev_bake.py', '--selftest'], {cwd: root, encoding: 'utf8'});
    assert.match(self, /selftest lulus/, `selftest bake: ${self}`);
    const verifyOut = execFileSync(py, ['studio-forge/dev_bake.py', '--verify', 'docs/bake-baseline.json'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.match(verifyOut, /0 masalah/, `verify bake: ${verifyOut}`);
    ok3 = true;
  } catch (err) {
    if (/No module named 'numpy'|No module named 'PIL'|ENOENT/.test(String(err.stderr ?? err))) {
      skipped = 'dilewati: numpy/PIL tidak tersedia';
      console.warn(`  ! bake: ${skipped}`);
    } else {
      throw err;
    }
  }
  const doc = fs.readFileSync(path.join(root, 'docs', 'BAKING.md'), 'utf8');
  assert.ok(doc.includes('<!-- BEGIN:bake -->') && /\| `char\./.test(doc), 'tabel bake harus ada di BAKING.md');
  assert.ok(fs.existsSync(path.join(root, 'docs', 'bake-baseline.json')), 'baseline bake harus tersimpan');
  void ok3;
  void skipped;
  ok('bake');
}

// --------------------------------------------------------------- 10. kalibrasi material
{
  const {execFileSync} = await import('node:child_process');
  const py = ['./.venv/bin/python', 'python3'].find((p) => fs.existsSync(path.join(root, p))) ?? 'python3';
  try {
    const self = execFileSync(py, ['studio-forge/dev_materials.py', '--selftest'], {cwd: root, encoding: 'utf8'});
    assert.match(self, /selftest kalibrasi lulus/, `selftest kalibrasi: ${self}`);
    const chk = execFileSync(py, ['studio-forge/dev_materials.py', '--check'], {cwd: root, encoding: 'utf8'});
    assert.match(chk, /0 di luar rentang/, `kalibrasi: ${chk}`);
    assert.match(chk, /0 masalah tabel/, `tabel kalibrasi basi: ${chk}`);
  } catch (err) {
    if (/No module named 'numpy'|No module named 'PIL'|ENOENT/.test(String(err.stderr ?? err))) {
      console.warn('  ! materials: dilewati (numpy/PIL tidak tersedia)');
    } else {
      throw err;
    }
  }
  const doc = fs.readFileSync(path.join(root, 'docs', 'MATERIAL-CALIBRATION.md'), 'utf8');
  assert.ok((doc.match(/^\| `/gm) ?? []).length >= 200, 'tabel kalibrasi harus memuat semua material');
  assert.ok(fs.existsSync(path.join(root, 'docs', 'material-calibration.png')), 'lembar kalibrasi PNG harus ada');
  ok('materials');
}

// --------------------------------------------------------------- 11. WebGL nyata
{
  const {execFileSync} = await import('node:child_process');
  const tools = path.resolve(root, '..', '.studio-tools');
  const exe = path.join(tools, 'chromium');
  if (!fs.existsSync(exe)) {
    console.warn('  ! webgl: dilewati (Chromium belum di-unpack — lihat docs/CHROMIUM.md)');
  } else {
    const out = execFileSync(process.execPath, ['scripts/qc-webgl.mjs'], {cwd: root, encoding: 'utf8'});
    assert.match(out, /WebGL 2\.0/, `WebGL2 tidak tersedia: ${out}`);
    assert.match(out, /✓ warna terverifikasi/, `readPixels gagal: ${out}`);
    assert.match(out, /SwiftShader/, `renderer bukan SwiftShader: ${out}`);
  }
  const shots = fs.readdirSync(path.join(root, 'docs', 'webgl-shots')).filter((f) => f.endsWith('.png'));
  assert.ok(shots.length >= 6, `frame WebGL kurang: ${shots.length}`);
  const doc = fs.readFileSync(path.join(root, 'docs', 'CHROMIUM.md'), 'utf8');
  assert.match(doc, /libEGL\.so/, 'CHROMIUM.md harus menyebut penempatan library');
  assert.match(doc, /enable-unsafe-swiftshader/, 'CHROMIUM.md harus menyebut flag wajib');
  ok('webgl');
}

// ------------------------------------------------------- 12. pustaka properti (Kenney)
{
  const {execFileSync} = await import('node:child_process');
  const libIndex = path.join(root, 'public', 'library', 'index.json');
  assert.ok(fs.existsSync(libIndex), 'public/library/index.json harus ada');
  const lib = JSON.parse(fs.readFileSync(libIndex, 'utf8'));
  assert.equal(lib.schema, 'studio.library/1');
  assert.ok(lib.props.length >= 50, `pustaka terlalu kecil: ${lib.props.length}`);
  assert.equal(lib.license, 'CC0-1.0', 'lisensi pustaka harus CC0-1.0');
  const {listProps, asset, registry: libRegistry} = await import('../src/studio/library.js');
  assert.equal(listProps().length, lib.props.length, 'props.generated.js harus memuat semua properti');
  for (const prop of lib.props.slice(0, 10)) {
    const entry = asset(prop.id);
    assert.ok(fs.existsSync(path.join(root, 'public', entry.uri)), `${prop.id}: berkas GLB hilang`);
    assert.ok(entry.bounds.size.every((v) => v >= 0), `${prop.id}: bounds rusak`);
  }
  assert.equal(Object.keys(libRegistry.assets).length, ids.length, 'katalog utama tidak boleh tercampur pustaka');
  if (fs.existsSync(path.join(root, '.venv', 'bin', 'python'))) {
    execFileSync('./.venv/bin/python', ['studio-forge/kenney_import.py', '--check'], {cwd: root, stdio: 'pipe'});
  }
  ok('library');
}

// ------------------------------------------------------------ 13. paket cerita sinkron
{
  const {execFileSync} = await import('node:child_process');
  execFileSync(process.execPath, ['scripts/sync-stories.mjs', '--check'], {cwd: root, stdio: 'pipe'});
  // berkas hasil generate dipakai bundler; di Node kita baca JSON-nya langsung
  const generated = fs.readFileSync(path.join(root, 'stories', 'packs.generated.js'), 'utf8');
  const dirs = fs
    .readdirSync(path.join(root, 'stories'), {withFileTypes: true})
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, 'stories', d.name, 'story.json')))
    .map((d) => d.name)
    .sort();
  assert.ok(dirs.length >= 4, `paket cerita kurang: ${dirs.length}`);
  for (const dir of dirs) {
    assert.ok(generated.includes(`'./${dir}/story.json'`), `${dir} tidak terdaftar di packs.generated.js`);
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'stories', dir, 'story.json'), 'utf8'));
    const compiled = compileStory(raw, {registry});
    assert.ok(compiled.durationInFrames > 0, `${dir}: durasi nol`);
    for (const id of compiled.assetIds) assert.ok(asset(id), `${dir}: aset ${id} tidak dikenal`);
  }
  ok('story packs');
}

// ------------------------------------------------------- 14. karakter & outfit
{
  const chars = Object.entries(registry.assets).filter(([, a]) => a.category === 'character');
  assert.ok(chars.length >= 10, `karakter kurang dari 10: ${chars.length}`);

  // Satu rig untuk semua: tulang & klip identik, hanya parameter yang berbeda.
  const ref = registry.assets['char.male-dewasa-polo'];
  assert.ok(ref, 'char.male-dewasa-polo wajib ada sebagai acuan rig');
  const refClips = ref.rig.clips.join(',');
  for (const [id, a] of chars) {
    assert.ok(a.rig, `${id}: tidak punya rig`);
    assert.equal(a.rig.skeleton, 'studio-humanoid-v1', `${id}: skeleton beda`);
    assert.equal(a.rig.bones, ref.rig.bones, `${id}: jumlah tulang beda (${a.rig.bones})`);
    assert.equal(a.rig.clips.join(','), refClips, `${id}: daftar klip beda`);
    assert.ok(a.profile, `${id}: profil umur tidak tercatat di registry`);
  }

  // Cakupan umur yang diminta: dewasa, lansia, remaja, anak, balita — pria & wanita.
  const profiles = new Set(chars.map(([, a]) => a.profile));
  for (const want of ['dewasa', 'lansia', 'remaja', 'anak', 'balita']) {
    assert.ok(profiles.has(want), `profil "${want}" belum ada`);
  }
  const females = chars.filter(([id, a]) => a.tags.includes('female') || id.startsWith('char.female'));
  assert.ok(females.length >= 4, `tokoh perempuan kurang: ${females.length}`);

  // Tinggi harus masuk akal per kelompok umur (bukti proporsi benar-benar dipakai).
  const bands = {balita: [0.8, 1.05], anak: [1.0, 1.3], remaja: [1.35, 1.7], dewasa: [1.5, 1.85], lansia: [1.45, 1.8]};
  for (const [id, a] of chars) {
    const h = a.bounds.size[1];
    const [lo, hi] = bands[a.profile] ?? [0.5, 2.0];
    assert.ok(h > lo && h < hi, `${id}: tinggi ${h.toFixed(2)} m di luar rentang ${a.profile} (${lo}–${hi})`);
  }
  // Urutan umur harus monoton: balita < anak < remaja < dewasa.
  assert.ok(registry.assets['char.balita-laki'].bounds.size[1] < registry.assets['char.anak-laki'].bounds.size[1]);
  assert.ok(registry.assets['char.anak-laki'].bounds.size[1] < registry.assets['char.remaja-laki'].bounds.size[1]);
  assert.ok(registry.assets['char.remaja-laki'].bounds.size[1] < registry.assets['char.male-dewasa-polo'].bounds.size[1]);

  // Outfit bisa ditukar lewat data cerita: base + outfit -> asset varian.
  const base = registry.assets['char.male-dewasa-polo'];
  assert.ok(base.outfits?.['kemeja-kasual'], 'varian kemeja belum terdaftar di registry');
  const variantId = base.outfits['kemeja-kasual'];
  const variant = registry.assets[variantId];
  assert.ok(variant, `varian ${variantId} tidak ada`);
  assert.equal(variant.outfit, 'kemeja-kasual', 'varian salah kostum');
  assert.equal(variant.rig.bones, base.rig.bones, 'varian outfit harus memakai rig yang sama');
  assert.equal(variant.meta?.profile ?? variant.profile, base.profile, 'varian outfit harus sama tubuhnya');

  const swapStory = JSON.parse(fs.readFileSync(path.join(root, 'stories', 'uji-karakter', 'story.json'), 'utf8'));
  const compiled = compileStory(swapStory, {registry});
  const ids2 = new Set(compiled.shots.flatMap((s) => s.cast.map((c) => c.assetId)));
  assert.ok(ids2.has('char.male-dewasa-polo') && ids2.has(variantId), 'cerita uji harus memakai dua kostum tokoh yang sama');
  const digest = createHash('sha256').update(fs.readFileSync(path.join(publicDir, variant.uri))).digest('hex');
  const reviewed = {...variant, status:'approved', review:{sha256:digest}};
  const assess = item => productionIssues({assetIds:[variantId]}, {assets:{[variantId]:item}}, publicDir);
  assert.deepEqual(assess(reviewed), []);
  assert.equal(assess({...reviewed, status:'review'}).length, 1);
  assert.equal(assess({...reviewed, review:{sha256:'old'}}).length, 1);
  const pendingVariant = {...registry.assets, [variantId]:{...reviewed, status:'draft'}};
  assert.ok(productionIssues(compiled, {assets:pendingVariant}, publicDir).some(issue => issue.startsWith(variantId)));
  const outs = [registry.assets['char.male-dewasa-polo'].outfit, variant.outfit];
  assert.equal(new Set(outs).size, 2, 'dua shot harus memakai outfit berbeda');
  // Cerita lain tetap memakai outfit aslinya (bukan varian).
  assert.ok(fs.existsSync(path.join(root, 'docs', 'character-lineup.png')), 'lembar kontak karakter belum dibuat');

  // Outfit yang tidak dibangun harus ditolak, bukan diam-diam diabaikan.
  const bad = JSON.parse(JSON.stringify(swapStory));
  bad.cast.aku.outfit = 'kostum-tidak-ada';
  let rejected = false;
  try {
    validateStory(bad, {registry});
  } catch (err) {
    rejected = /outfit/.test(String(err));
  }
  assert.ok(rejected, 'outfit tak dikenal harus ditolak');

  ok('characters & outfits');
}

const auditMd = fs.readFileSync(path.join(root, 'docs', 'PIPELINE-AUDIT.md'), 'utf8');
const audit = parseAudit(auditMd);
assert.equal(audit.totals.total, 53, 'audit harus 53 langkah');
assert.equal(audit.phases.length, 9, 'audit harus 9 fase');
assert.ok(auditMd.includes(summaryTable(audit)), 'tabel ringkasan harus cocok dengan baris fase');
assert.ok(auditMd.includes(totalLine(audit)), 'baris total harus cocok dengan baris fase');
ok('audit-summary');

console.log(`Studio tests passed — ${checks} assertions groups over ${ids.length} assets, ${storyFiles.length} stories`);
assert.ok(clipsOf('char.male-dewasa-polo').includes('ride'));
