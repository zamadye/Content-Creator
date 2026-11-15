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
    assert.equal(e.rig.skeleton.length > 0, true, `${id}: rig skeleton`);
    // 163 tulang tubuh; entitas ber-shroud menambah rantai kain 3 tulang
    assert.ok(e.rig.bones === 163 || e.rig.bones === 166, `${id}: unexpected joint count ${e.rig.bones}`);
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
// follow: kamera berjalan bersama aktor yang bergerak (`travel`)
{
  const base = JSON.parse(fs.readFileSync(path.join(studioDir, 'uji-kamera.json'), 'utf8'));
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
  const src = JSON.parse(fs.readFileSync(path.join(studioDir, 'warung-malam.json'), 'utf8'));
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
  const src = JSON.parse(fs.readFileSync(path.join(studioDir, 'warung-malam.json'), 'utf8'));
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

  const point = JSON.parse(JSON.stringify(base));
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
  const base = JSON.parse(fs.readFileSync(path.join(studioDir, 'uji-kamera.json'), 'utf8'));

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
  const base = JSON.parse(fs.readFileSync(path.join(studioDir, 'uji-kamera.json'), 'utf8'));
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
    const compiled = compileStory(readJson(path.join(studioDir, file)), {registry});
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

const auditMd = fs.readFileSync(path.join(root, 'docs', 'PIPELINE-AUDIT.md'), 'utf8');
const audit = parseAudit(auditMd);
assert.equal(audit.totals.total, 53, 'audit harus 53 langkah');
assert.equal(audit.phases.length, 9, 'audit harus 9 fase');
assert.ok(auditMd.includes(summaryTable(audit)), 'tabel ringkasan harus cocok dengan baris fase');
assert.ok(auditMd.includes(totalLine(audit)), 'baris total harus cocok dengan baris fase');
ok('audit-summary');

console.log(`Studio tests passed — ${checks} assertions groups over ${ids.length} assets, ${storyFiles.length} stories`);
assert.ok(clipsOf('char.male-dewasa-polo').includes('ride'));
