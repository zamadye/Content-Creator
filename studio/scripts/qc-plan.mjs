/**
 * Rencana lantai (previs) tiap shot — langkah 4 "scene planning".
 *
 * Sebelum ini, tata letak shot hanya bisa dibayangkan dari angka `at` di JSON.
 * Alat ini memproyeksikan isi shot ke denah (tampak atas) dan **memeriksa dua
 * hal yang selama ini tidak pernah diperiksa**:
 *
 *   1. kamera tidak menembus geometri: jarak ke **segitiga asli** aset set diukur,
 *      bukan sekadar kotak batas (kamera di beranda rumah tetap boleh);
 *   2. dua aktor tidak saling bertumpuk (< 0,45 m) di shot yang sama.
 *
 * Keluaran JSON dipakai `studio-forge/dev_plan.py` untuk menggambar PNG; berkas
 * ini sendiri tidak butuh browser, canvas, atau GPU.
 *
 *   node scripts/qc-plan.mjs                 # semua cerita, tulis docs/plans/*.json
 *   node scripts/qc-plan.mjs --check         # hanya jalankan pemeriksaan
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {splitGlb, buildGlb} from './lib/glb.mjs';
import {compileStory} from '../src/studio/compile.js';
import {registry} from '../src/studio/library.js';

/** Story 2D (sprite + Remotion) tidak punya kamera 3D — lewati di QC 3D. */
function is3dStoryFile(file) {
  try {
    return !String(JSON.parse(fs.readFileSync(file, 'utf8')).schema ?? '').startsWith('studio.story2d');
  } catch {
    return true;
  }
}


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studioDir = path.join(root, 'stories');
const planDir = path.join(root, 'docs', 'plans');

/** Aset yang tingginya di bawah ini dianggap lantai, bukan penghalang. */
const FLOOR_HEIGHT = 0.6;
/** Jarak minimum dua aktor dalam satu shot. */
export const MIN_ACTOR_GAP = 0.45;
/** Jarak minimum kamera ke permukaan penghalang. */
export const MIN_CAMERA_CLEARANCE = 0.15;

const BODY_RADIUS = 0.28;
/** Batas jarak kamera/aktor ke segitiga aset (meter). */
export const MIN_GEOMETRY_CLEARANCE = 0.12;
/** Batas tinggi segitiga yang dianggap penghalang (di atas ini tidak dihitung). */
const CLEARANCE_TOP = 2.4;
/** Klip yang membuat badan sah bersentuhan dengan properti (bangku, kasur). */
const SEATED_CLIP = /sit|duduk|lie|tidur|sleep/i;

const loader = new GLTFLoader();
const geoCache = new Map();

/** Segitiga dunia sebuah aset, dibaca sekali per aset. */
export async function assetTriangles(assetId) {
  if (geoCache.has(assetId)) return geoCache.get(assetId);
  const uri = registry.assets?.[assetId]?.uri;
  const tris = [];
  if (uri) {
    const file = path.join(root, 'public', uri);
    const {json, bin} = splitGlb(fs.readFileSync(file));
    const glb = buildGlb(json, bin);
    const gltf = await new Promise((resolve, reject) =>
      loader.parse(
        glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength),
        '',
        resolve,
        reject,
      ),
    );
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh) return;
      const pos = o.geometry.getAttribute('position');
      const idx = o.geometry.getIndex();
      const count = idx ? idx.count : pos.count;
      const v = new THREE.Vector3();
      const limit = Math.min(count, 6000); // cukup untuk pemeriksaan kasar
      for (let i = 0; i < limit; i += 3) {
        const tri = [];
        for (let k = 0; k < 3; k++) {
          const vi = idx ? idx.getX(i + k) : i + k;
          v.fromBufferAttribute(pos, vi).applyMatrix4(o.matrixWorld);
          tri.push([v.x, v.y, v.z]);
        }
        tris.push(tri);
      }
    });
  }
  geoCache.set(assetId, tris);
  return tris;
}

/** Segitiga aset setelah dipindah/diputar/diskalakan sesuai penempatan shot. */
export function placeTriangles(tris, at, rot = 0, scale = 1) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return tris.map((tri) =>
    tri.map(([x, y, z]) => {
      const sx = x * scale;
      const sy = y * scale;
      const sz = z * scale;
      return [at[0] + sx * c + sz * s, at[1] + sy, at[2] - sx * s + sz * c];
    }),
  );
}

/** Jarak titik ke segitiga (Real-Time Collision Detection, Christer Ericson). */
export function pointTriangleDistance(p, a, b, c) {
  const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(p, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return Math.hypot(...ap);
  const bp = sub(p, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return Math.hypot(...bp);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return Math.hypot(p[0] - (a[0] + ab[0] * v), p[1] - (a[1] + ab[1] * v), p[2] - (a[2] + ab[2] * v));
  }
  const cp = sub(p, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return Math.hypot(...cp);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return Math.hypot(p[0] - (a[0] + ac[0] * w), p[1] - (a[1] + ac[1] * w), p[2] - (a[2] + ac[2] * w));
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return Math.hypot(
      p[0] - (b[0] + (c[0] - b[0]) * w),
      p[1] - (b[1] + (c[1] - b[1]) * w),
      p[2] - (b[2] + (c[2] - b[2]) * w),
    );
  }
  const denom = 1 / (va + vb + vc);
  const v = vb * denom;
  const w = vc * denom;
  return Math.hypot(
    p[0] - (a[0] + ab[0] * v + ac[0] * w),
    p[1] - (a[1] + ab[1] * v + ac[1] * w),
    p[2] - (a[2] + ab[2] * v + ac[2] * w),
  );
}

const rot2 = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];

/** Kotak denah sebuah aset (x/z), sudah diputar dan diskalakan. */
function footprint(assetId, at, rot = 0, scale = 1) {
  const b = registry.assets?.[assetId]?.bounds;
  if (!b) return null;
  const w = b.size[0] * scale;
  const d = b.size[2] * scale;
  const h = b.size[1] * scale;
  const cx = at[0] + ((b.min[0] + b.max[0]) / 2) * scale;
  const cz = at[2] + ((b.min[2] + b.max[2]) / 2) * scale;
  return {assetId, at, scale, cx, cz, w, d, h, rot, floor: h < FLOOR_HEIGHT};
}

/** Apakah titik (x, z) ada di dalam kotak (dengan jarak `pad`)? */
export function insideFootprint(fp, x, z, pad = 0) {
  const [dx, dz] = rot2(x - fp.cx, z - fp.cz, -fp.rot);
  return Math.abs(dx) <= fp.w / 2 + pad && Math.abs(dz) <= fp.d / 2 + pad;
}

/** Jarak titik ke tepi terdekat (negatif = di dalam). */
export function distanceToFootprint(fp, x, z) {
  const [dx, dz] = rot2(x - fp.cx, z - fp.cz, -fp.rot);
  const ox = Math.abs(dx) - fp.w / 2;
  const oz = Math.abs(dz) - fp.d / 2;
  if (ox <= 0 && oz <= 0) return Math.max(ox, oz); // di dalam: negatif
  return Math.hypot(Math.max(ox, 0), Math.max(oz, 0));
}

/** Susun data denah + masalah untuk satu cerita hasil compile. */
export async function planStory(story) {
  const shots = [];
  const problems = [];

  for (const shot of story.shots) {
    const seconds = shot.durationInFrames / story.fps;
    const blockers = [];
    for (const item of shot.set) {
      if (item.hidden) continue;
      const fp = footprint(item.asset, item.at, item.rot ?? 0, item.scale ?? 1);
      if (fp && !fp.floor) blockers.push({...fp, kind: 'set'});
    }
    for (const o of shot.objectPlacements) {
      if (o.hidden) continue;
      const fp = footprint(o.assetId, o.at, o.rot ?? 0, o.scale ?? 1);
      if (fp && !fp.floor) blockers.push({...fp, kind: 'object', ref: o.ref});
    }

    const actors = shot.cast
      .filter((c) => !c.hidden)
      .map((c) => {
        // posisi di awal & akhir shot (ikut travel)
        const p0 = c.at;
        const p1 = [
          c.at[0] + Math.sin(c.yaw) * (c.travel ?? 0) * seconds,
          c.at[1],
          c.at[2] + Math.cos(c.yaw) * (c.travel ?? 0) * seconds,
        ];
        return {ref: c.ref, assetId: c.assetId, at: p0, end: p1, yaw: c.yaw, clip: c.clip, radius: BODY_RADIUS};
      });

    const samples = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const cam = shot.cameraSample(u);
      samples.push({u, position: cam.position, target: cam.target, fov: cam.fov});
    }

    // pemeriksaan 1: segitiga asli aset (bukan kotak batas) di sekitar shot
    const region = [...samples.map((s) => s.position), ...actors.flatMap((a) => [a.at, a.end])];
    const pad = 2.5;
    const min = [0, 1, 2].map((k) => Math.min(...region.map((p) => p[k])) - pad);
    const max = [0, 1, 2].map((k) => Math.max(...region.map((p) => p[k])) + pad);
    const tris = [];
    for (const b of blockers) {
      const src = await assetTriangles(b.assetId);
      for (const tri of placeTriangles(src, b.at, b.rot, b.scale)) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3;
        if (cy > CLEARANCE_TOP) continue;
        if (cx < min[0] || cy < min[1] || cz < min[2] || cx > max[0] || cy > max[1] || cz > max[2]) continue;
        tris.push({tri, id: b.assetId, ref: b.ref});
      }
    }

    for (const s of samples) {
      let best = {d: Infinity, id: null};
      for (const t of tris) {
        const d = pointTriangleDistance(s.position, t.tri[0], t.tri[1], t.tri[2]);
        if (d < best.d) best = {d, id: t.id, ref: t.ref};
      }
      s.clearance = Number.isFinite(best.d) ? +best.d.toFixed(2) : null;
      if (Number.isFinite(best.d) && best.d < MIN_GEOMETRY_CLEARANCE) {
        const name = `${best.id}${best.ref ? ` (${best.ref})` : ''}`;
        problems.push(
          best.d < 0.02
            ? `${shot.id}: kamera menembus ${name} di u=${s.u.toFixed(2)}`
            : `${shot.id}: kamera hanya ${best.d.toFixed(2)} m dari ${name} di u=${s.u.toFixed(2)}`,
        );
      }
    }

    // pemeriksaan 2: aktor tidak saling bertumpuk (dicek di awal dan akhir)
    for (const a of actors) {
      for (const b of actors) {
        if (a === b) continue;
        for (const [label, pa, pb] of [
          ['awal', a.at, b.at],
          ['akhir', a.end, b.end],
        ]) {
          const gap = Math.hypot(pa[0] - pb[0], pa[2] - pb[2]);
          if (gap < MIN_ACTOR_GAP) {
            problems.push(`${shot.id}: ${a.ref} dan ${b.ref} hanya ${gap.toFixed(2)} m (${label} shot)`);
          }
        }
      }
    }

    // pemeriksaan 3: aktor tidak berdiri di dalam geometri padat.
    // Aktor dengan klip duduk/berbaring memang bersentuhan dengan bangku/kasur,
    // jadi pemeriksaan ini hanya untuk aktor yang berdiri.
    for (const a of actors) {
      if (SEATED_CLIP.test(a.clip ?? '')) continue;
      const chest = [a.at[0], a.at[1] + 1.0, a.at[2]];
      let best = {d: Infinity, id: null};
      for (const t of tris) {
        const d = pointTriangleDistance(chest, t.tri[0], t.tri[1], t.tri[2]);
        if (d < best.d) best = {d, id: t.id};
      }
      a.clearance = Number.isFinite(best.d) ? +best.d.toFixed(2) : null;
      if (Number.isFinite(best.d) && best.d < 0.1) {
        problems.push(`${shot.id}: ${a.ref} menembus ${best.id} (dada ${best.d.toFixed(2)} m)`);
      }
    }

    let nearest = null;
    for (const s of samples) {
      if (s.clearance === null) continue;
      if (!nearest || s.clearance < nearest.clearance) nearest = {clearance: s.clearance, u: s.u};
    }
    let minGap = Infinity;
    for (const a of actors) {
      for (const b of actors) {
        if (a === b) continue;
        minGap = Math.min(minGap, Math.hypot(a.at[0] - b.at[0], a.at[2] - b.at[2]));
      }
    }

    shots.push({
      id: shot.id,
      triangles: tris.length,
      nearestCamera: nearest,
      minActorGap: Number.isFinite(minGap) ? +minGap.toFixed(2) : null,
      index: shot.index,
      durationInFrames: shot.durationInFrames,
      cameraPreset: shot.camera.preset,
      set: shot.set.filter((s) => !s.hidden).map((s) => ({asset: s.asset, at: s.at, rot: s.rot ?? 0, scale: s.scale ?? 1})),
      objects: blockers
        .filter((b) => b.kind === 'object')
        .map((b) => ({ref: b.ref, asset: b.assetId, at: [b.cx, 0, b.cz], rot: b.rot, w: b.w, d: b.d})),
      blockers,
      actors,
      samples,
      text: shot.text?.value ?? null,
    });
  }

  let nearest = null;
  let minGap = null;
  let triangles = 0;
  for (const shot of shots) {
    triangles += shot.triangles;
    if (shot.nearestCamera && (!nearest || shot.nearestCamera.clearance < nearest.clearance)) {
      nearest = {...shot.nearestCamera, shot: shot.id};
    }
    if (shot.minActorGap !== null && (minGap === null || shot.minActorGap < minGap)) minGap = shot.minActorGap;
  }

  return {
    schema: 'studio.plan/1',
    story: {id: story.id, title: story.title, fps: story.fps, width: story.width, height: story.height},
    stats: {shots: shots.length, cameraSamples: shots.length * 9, triangles, nearestCamera: nearest, minActorGap: minGap},
    shots,
    problems,
  };
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const files = fs
    .readdirSync(studioDir, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .map((d) => path.join(studioDir, d.name, 'story.json'))
        .filter(is3dStoryFile)
    .filter((f) => fs.existsSync(f))
    .sort();

  let total = 0;
  let flagged = 0;
  const out = [];
  for (const file of files) {
    const compiled = compileStory(JSON.parse(fs.readFileSync(file, 'utf8')), {registry});
    const plan = await planStory(compiled);
    total += plan.shots.length;
    flagged += plan.problems.length;
    if (!checkOnly) {
      fs.mkdirSync(planDir, {recursive: true});
      fs.writeFileSync(path.join(planDir, `${plan.story.id}.json`), JSON.stringify(plan, null, 1));
    }
    out.push(
      `${path.basename(file)} — ${plan.shots.length} shot · ${plan.stats.triangles} segitiga diperiksa · ` +
        `kamera terdekat ${plan.stats.nearestCamera ? `${plan.stats.nearestCamera.clearance.toFixed(2)} m (${plan.stats.nearestCamera.shot})` : '—'} · ` +
        `jarak aktor terdekat ${plan.stats.minActorGap ?? '—'} m`,
    );
    for (const p of plan.problems) out.push(`  ! ${p}`);
  }
  console.log(out.join('\n'));
  console.log(
    `\n${total} shot diperiksa · ${flagged} masalah tata letak` + (checkOnly ? '' : ` · rencana ditulis ke docs/plans/`),
  );
  if (flagged) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
