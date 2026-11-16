// Analisis UV per primitif: cakupan, tumpang tindih, dan kepadatan texel.
// Murni rasterisasi segitiga di ruang UV — tidak butuh GPU maupun canvas.
import fs from 'node:fs';
import {splitGlb} from './glb.mjs';

const TYPE_SIZE = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4};
const COMP = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16};

/** Baca accessor glTF menjadi array angka (float32/uint16/uint32). */
export function readAccessor(json, bin, index) {
  const acc = json.accessors[index];
  const n = COMP[acc.type];
  const size = TYPE_SIZE[acc.componentType];
  const stride = json.bufferViews[acc.bufferView]?.byteStride ?? n * size;
  const bv = json.bufferViews[acc.bufferView];
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const out = new Float64Array(acc.count * n);
  for (let i = 0; i < acc.count; i++) {
    const off = base + i * stride;
    for (let c = 0; c < n; c++) {
      const o = off + c * size;
      out[i * n + c] =
        size === 1 ? bin[o]
        : size === 2 ? (acc.componentType === 5122 ? bin.readInt16LE(o) : bin.readUInt16LE(o))
        : size === 4 ? (acc.componentType === 5125 ? bin.readUInt32LE(o) : bin.readFloatLE(o))
        : 0;
    }
  }
  return out;
}

/**
 * Rasterisasi primitif di ruang UV.
 * @returns {{coverage:number, overlap:number, texels:number, tiled:boolean, uMax:number, vMax:number}}
 */
export function uvStats(json, bin, prim, res = 256) {
  const uv = readAccessor(json, bin, prim.attributes.TEXCOORD_0);
  const pos = readAccessor(json, bin, prim.attributes.POSITION);
  const idx = prim.indices !== undefined ? readAccessor(json, bin, prim.indices) : null;
  const count = idx ? idx.length : pos.length / 3;

  const hits = new Uint16Array(res * res);
  let uMax = 0;
  let vMax = 0;
  let uMin = 0;
  let vMin = 0;
  let uvArea = 0;
  let worldArea = 0;

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);

  for (let t = 0; t < count; t += 3) {
    const i = [0, 1, 2].map((k) => (idx ? idx[t + k] : t + k));
    const uvs = i.map((v) => [uv[v * 2], uv[v * 2 + 1]]);
    const p3 = i.map((v) => [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]);
    for (const [u, v] of uvs) {
      uMax = Math.max(uMax, u);
      vMax = Math.max(vMax, v);
      uMin = Math.min(uMin, u);
      vMin = Math.min(vMin, v);
    }
    // luas UV & luas dunia (untuk kepadatan texel)
    uvArea += Math.abs((uvs[1][0] - uvs[0][0]) * (uvs[2][1] - uvs[0][1]) - (uvs[2][0] - uvs[0][0]) * (uvs[1][1] - uvs[0][1])) / 2;
    worldArea += len(cross(sub(p3[1], p3[0]), sub(p3[2], p3[0]))) / 2;

    // raster: hanya UV di dalam 0..1 yang dihitung (aset tiling melewati 1)
    const inside = uvs.every(([u, v]) => u >= -1e-6 && u <= 1 + 1e-6 && v >= -1e-6 && v <= 1 + 1e-6);
    if (!inside) continue;
    const x = uvs.map(([u]) => u * res);
    const y = uvs.map(([, v]) => (1 - v) * res);
    const minX = Math.max(0, Math.floor(Math.min(...x)));
    const maxX = Math.min(res - 1, Math.ceil(Math.max(...x)));
    const minY = Math.max(0, Math.floor(Math.min(...y)));
    const maxY = Math.min(res - 1, Math.ceil(Math.max(...y)));
    const area2 = (x[1] - x[0]) * (y[2] - y[0]) - (x[2] - x[0]) * (y[1] - y[0]);
    if (Math.abs(area2) < 1e-12) continue;
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const cx = px + 0.5;
        const cy = py + 0.5;
        const w0 = ((x[1] - cx) * (y[2] - cy) - (x[2] - cx) * (y[1] - cy)) / area2;
        const w1 = ((x[2] - cx) * (y[0] - cy) - (x[0] - cx) * (y[2] - cy)) / area2;
        const w2 = 1 - w0 - w1;
        if (w0 >= -1e-6 && w1 >= -1e-6 && w2 >= -1e-6) {
          const k = py * res + px;
          if (hits[k] < 65535) hits[k] += 1;
        }
      }
    }
  }

  let covered = 0;
  let overlapped = 0;
  for (let k = 0; k < hits.length; k++) {
    if (hits[k] > 0) covered += 1;
    if (hits[k] > 1) overlapped += 1;
  }
  return {
    coverage: covered / (res * res),
    overlap: covered ? overlapped / covered : 0,
    texels: covered,
    // "tiling" = UV di luar 0..1. Kotak memakai UV berbasis ruang objek
    // (bisa negatif) supaya tekstur berulang; itu pilihan, bukan kesalahan.
    tiled: uMax > 1.001 || vMax > 1.001 || uMin < -1e-6 || vMin < -1e-6,
    uMax,
    vMax,
    uMin,
    vMin,
    uvArea,
    worldArea,
  };
}

/** Klasifikasi satu primitif: rapat / daur-ulang / tabrakan / tiling. */
export function primKind(p) {
  if (p.tiled) return 'tiling';
  if (p.overlap <= 0.05) return 'rapat'; // ≤5 % = jahitan tersembunyi, lazim
  const reuse = p.coverage > 0 ? p.uvArea / p.coverage : 0;
  const near = Math.round(reuse);
  return near >= 2 && Math.abs(reuse - near) < 0.3 ? 'daur-ulang' : 'tabrakan';
}

/**
 * Ringkasan UV satu aset (agregat semua primitif ber-TEXCOORD_0).
 * `texSize` dipakai untuk menghitung kepadatan texel (px per meter).
 * Kepadatan dihitung analitik dari luas UV vs luas dunia, jadi sah untuk
 * aset tiling maupun atlas.
 */
export function measureUv(file, texSize = 1024, res = 256) {
  const {json, bin} = splitGlb(fs.readFileSync(file));
  const prims = [];
  for (const mesh of json.meshes ?? []) {
    for (const p of mesh.primitives) {
      if (p.attributes.TEXCOORD_0 === undefined) continue;
      const st = uvStats(json, bin, p, res);
      prims.push({...st, kind: primKind(st)});
    }
  }
  const atlased = prims.filter((p) => p.kind !== 'tiling');
  const covered = atlased.reduce((n, p) => n + p.texels, 0);
  const overlapped = atlased.reduce((n, p) => n + p.overlap * p.texels, 0);
  const worldArea = prims.reduce((n, p) => n + p.worldArea, 0);
  const uvArea = prims.reduce((n, p) => n + p.uvArea, 0);
  // pemakaian ulang hanya bermakna untuk pulau atlas; pulau tiling punya luas
  // UV raksasa yang akan mengacaukan rasio
  const atlasedUvArea = atlased.reduce((n, p) => n + p.uvArea, 0);
  const coverage = atlased.length ? atlased.reduce((n, p) => n + p.coverage, 0) / atlased.length : 0;
  const reuse = coverage > 0 && atlased.length ? atlasedUvArea / (atlased.length * coverage) : 0;
  const rank = {tabrakan: 3, 'daur-ulang': 2, rapat: 1, tiling: 0};
  const kind = prims.reduce((best, p) => (rank[p.kind] > rank[best] ? p.kind : best), 'tiling');
  return {
    prims: prims.length,
    atlasedPrims: atlased.length,
    coverage,
    overlap: covered ? overlapped / covered : 0,
    reuse,
    kind,
    kinds: prims.map((p) => p.kind),
    tiled: prims.some((p) => p.tiled),
    uMax: prims.length ? Math.max(...prims.map((p) => p.uMax)) : 0,
    vMax: prims.length ? Math.max(...prims.map((p) => p.vMax)) : 0,
    uvArea,
    worldArea,
    density: worldArea > 0 ? texSize * Math.sqrt(uvArea / worldArea) : 0,
  };
}
