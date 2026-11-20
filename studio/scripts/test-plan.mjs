/**
 * Test denah (previs) — jalankan: npm run test:plan
 *
 * Memastikan pemeriksa tata letak benar-benar bisa gagal, bukan hanya
 * selalu melaporkan "0 masalah":
 *   1. matematika jarak titik→segitiga & kotak denah,
 *   2. semua cerita lolos pemeriksaan nyata (kamera, aktor, tabrakan),
 *   3. tiga cerita rusak buatan **terdeteksi** (kamera di dalam dinding,
 *      aktor menembus dinding, dua aktor bertumpuk),
 *   4. docs/plans/*.json sinkron dengan cerita,
 *   5. hasilnya deterministik.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registry} from '../src/studio/library.js';
import {compileStory} from '../src/studio/compile.js';
import {
  planStory,
  assetTriangles,
  pointTriangleDistance,
  insideFootprint,
  distanceToFootprint,
  MIN_ACTOR_GAP,
  MIN_GEOMETRY_CLEARANCE,
} from './qc-plan.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const storyFiles = fs
  .readdirSync(path.join(root, 'stories'), {withFileTypes: true})
  .filter((d) => d.isDirectory())
  .map((d) => path.join(root, 'stories', d.name, 'story.json'))
  .filter((f) => fs.existsSync(f))
  .sort();

let groups = 0;
const ok = () => (groups += 1);

// ------------------------------------------------- 1. matematika dasar
{
  const a = [0, 0, 0];
  const b = [1, 0, 0];
  const c = [0, 0, 1];
  assert.equal(pointTriangleDistance([0.2, 0.5, 0.2], a, b, c).toFixed(3), '0.500', 'di atas segitiga');
  assert.equal(pointTriangleDistance([0, 0, 0], a, b, c), 0, 'titik sudut');
  assert.equal(pointTriangleDistance([1.5, 0, 0], a, b, c).toFixed(3), '0.500', 'di luar sisi');
  assert.equal(pointTriangleDistance([0, 1, 0], a, b, c).toFixed(3), '1.000', 'tegak lurus titik sudut');

  const fp = {cx: 0, cz: 0, w: 2, d: 4, rot: 0, h: 2};
  assert.equal(insideFootprint(fp, 0, 0), true);
  assert.equal(insideFootprint(fp, 1.4, 0), false);
  assert.equal(distanceToFootprint(fp, 0, 0).toFixed(2), '-1.00', 'di dalam = negatif');
  assert.equal(distanceToFootprint(fp, 2, 0).toFixed(2), '1.00', 'di luar = positif');
  assert.equal(MIN_ACTOR_GAP, 0.45);
  assert.equal(MIN_GEOMETRY_CLEARANCE, 0.12);
  ok();
}

// ------------------------------------------------- 2. semua cerita lolos
let shots = 0;
let minCamera = Infinity;
let measured = 0;
for (const file of storyFiles) {
  const story = readJson(file);
  const compiled = compileStory(story, {registry});
  const plan = await planStory(compiled);
  assert.equal(plan.shots.length, compiled.shots.length, `${path.basename(file)}: jumlah shot`);
  assert.deepEqual(plan.problems, [], `${path.basename(file)}: ${plan.problems.join('; ')}`);
  const ids = plan.shots.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, `${path.basename(file)}: id shot ganda`);
  for (const shot of plan.shots) {
    assert.equal(shot.samples.length, 9, `${shot.id}: 9 sampel kamera`);
    for (const s of shot.samples) {
      assert.ok(typeof s.clearance === 'number' || s.clearance === null, `${shot.id} u=${s.u}: jarak geometri`);
      if (typeof s.clearance === 'number') {
        minCamera = Math.min(minCamera, s.clearance);
        measured += 1;
      }
    }
    assert.ok(Array.isArray(shot.actors), `${shot.id}: daftar aktor ada`);
    const nul = shot.samples.filter((s) => s.clearance === null).length;
    assert.ok(nul === 0 || nul === shot.samples.length, `${shot.id}: terukur sebagian (${nul}/9)`);
  }
  shots += plan.shots.length;
}
// jumlah shot ikut bertambah setiap paket cerita baru — hitung dari cerita, bukan konstanta
const expectedShots = storyFiles.reduce((n, f) => n + readJson(f).shots.length, 0);
assert.equal(shots, expectedShots, `${expectedShots} shot diperiksa, dapat ${shots}`);
// ambang diturunkan bersama penyusutan naskah (dulu 190 karena ada 9 paket contoh)
assert.ok(measured >= 150, `minimal 150 sampel terukur, dapat ${measured}`);
assert.ok(minCamera >= MIN_GEOMETRY_CLEARANCE, `jarak kamera terdekat ${minCamera.toFixed(2)} m`);
ok();

// ------------------------------------------------- 3. kerusakan buatan harus terdeteksi
const base = readJson(path.join(root, 'test', 'fixtures', 'warung-malam', 'story.json'));
const clone = () => JSON.parse(JSON.stringify(base));

/** Jalankan planStory, kembalikan daftar masalah (tanpa menyentuh disk). */
async function problemsOf(mutate) {
  const story = clone();
  mutate(story);
  const plan = await planStory(compileStory(story, {registry}));
  return plan.problems;
}

// Titik dinding nyata: centroid segitiga aset pada ketinggian badan (0,5–1,5 m),
// jadi tes tidak bergantung pada koordinat yang ditulis tangan.
const wallTris = (await assetTriangles('building.shop.warung'))
  .map((t) => {
    const c = [0, 1, 2].map((k) => (t[0][k] + t[1][k] + t[2][k]) / 3);
    const u = [0, 1, 2].map((k) => t[1][k] - t[0][k]);
    const v = [0, 1, 2].map((k) => t[2][k] - t[0][k]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    return {c, n: n.map((x) => x / len)};
  })
  .filter(({c}) => c[1] > 0.5 && c[1] < 1.5 && Math.abs(c[0]) < 2.3 && Math.abs(c[2]) < 3.8);
assert.ok(wallTris.length > 50, `titik dinding untuk tes: ${wallTris.length}`);
const wallTri = wallTris[0];
const wall = wallTri.c.map((v) => +v.toFixed(3));

// 3a. kamera tepat di permukaan geometri → "menembus"
{
  const out = await problemsOf((s) => {
    s.shots[0].set = [{asset: 'building.shop.warung', at: [0, 0, 0]}];
    s.shots[0].actors = [];
    s.shots[0].camera = {preset: 'over-shoulder', from: wall, target: [wall[0], wall[1], wall[2] + 4], fov: 40};
  });
  assert.ok(
    out.some((p) => /menembus/.test(p)),
    `kamera di permukaan geometri tidak terdeteksi: ${JSON.stringify(out)}`,
  );
  ok();
}

// 3b. kamera 5 cm dari dinding → "hanya X m"
{
  // 5 cm keluar sepanjang normal permukaan
  const near = wallTri.c.map((v, k) => +(v + wallTri.n[k] * 0.05).toFixed(3));
  const out = await problemsOf((s) => {
    s.shots[0].set = [{asset: 'building.shop.warung', at: [0, 0, 0]}];
    s.shots[0].actors = [];
    s.shots[0].camera = {preset: 'over-shoulder', from: near, target: [near[0] + 4, near[1], near[2]], fov: 40};
  });
  assert.ok(
    out.some((p) => /hanya 0\.0[0-9] m dari building\.shop\.warung/.test(p)),
    `kamera 5 cm dari dinding tidak terdeteksi: ${JSON.stringify(out)}`,
  );
  ok();
}

// 3c. aktor berdiri dengan dada di dalam dinding
{
  const out = await problemsOf((s) => {
    s.shots[0].set = [{asset: 'building.shop.warung', at: [0, 0, 0]}];
    s.shots[0].actors = [{ref: 'aku', at: [wall[0], 0, wall[2]], facing: '+Z', clip: 'idle'}];
    s.shots[0].camera = {preset: 'over-shoulder', from: [3, 1.5, 3], target: [0, 1.2, 0], fov: 40};
  });
  assert.ok(
    out.some((p) => /aku menembus/.test(p)),
    `aktor di dalam dinding tidak terdeteksi: ${JSON.stringify(out)}`,
  );
  ok();
}

// 3d. dua aktor bertumpuk
{
  const out = await problemsOf((s) => {
    s.shots[0].actors = [
      {ref: 'aku', at: [0, 0, 0], facing: '+Z', clip: 'idle'},
      {ref: 'ibu', at: [0.2, 0, 0.1], facing: '+Z', clip: 'idle'},
    ];
    s.shots[0].camera = {preset: 'over-shoulder', from: [3, 1.5, 3], target: [0, 1.2, 0], fov: 40};
  });
  assert.ok(
    out.some((p) => /hanya 0\.\d+ m \(awal shot\)/.test(p)),
    `aktor bertumpuk tidak terdeteksi: ${JSON.stringify(out)}`,
  );
  ok();
}

// 3e. pengecualian: aktor duduk di bangku tidak dilaporkan (false positive dulu)
{
  const out = await problemsOf((s) => {
    s.shots[1].actors[1].clip = 'sit';
  });
  assert.deepEqual(out, [], `aktor duduk tidak boleh dilaporkan: ${JSON.stringify(out)}`);
  ok();
}

// ------------------------------------------------- 4. docs/plans sinkron
{
  for (const file of storyFiles) {
    const story = readJson(file);
    const planFile = path.join(root, 'docs', 'plans', `${story.id}.json`);
    assert.ok(fs.existsSync(planFile), `rencana ${path.basename(planFile)} belum dibuat (jalankan npm run qc:plan)`);
    const plan = readJson(planFile);
    assert.equal(plan.story.id, story.id);
    assert.equal(plan.shots.length, story.shots.length);
    assert.deepEqual(plan.problems, [], `${story.id}: rencana tersimpan masih punya masalah`);
    for (const shot of plan.shots) {
      assert.ok(shot.set.length > 0 && shot.samples.length === 9, `${shot.id}: denah lengkap`);
    }
  }
  ok();
}

// ------------------------------------------------- 5. deterministik
{
  const compiled = compileStory(readJson(storyFiles[0]), {registry});
  const a = JSON.stringify(await planStory(compiled));
  const b = JSON.stringify(await planStory(compiled));
  assert.equal(a, b, 'planStory harus deterministik');
  ok();
}

console.log(
  `Test denah lulus — ${groups} grup · ${shots} shot · jarak kamera terdekat ke geometri ${minCamera.toFixed(2)} m`,
);
