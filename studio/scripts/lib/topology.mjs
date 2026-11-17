// Ukur topologi tiap aset langsung dari GLB (bukan dari registry) supaya angka
// di dokumen bisa dibandingkan dengan kenyataan.
import fs from 'node:fs';
import path from 'node:path';
import {splitGlb} from './glb.mjs';

/** Anggaran per kategori. Plafon = aset terbesar yang ada + ruang ~5–10 %. */
export const BUDGETS = {
  // 46k: kain dipotong dari permukaan tubuh sendiri (human.body_cloth) dan
  // memakai resolusi mesh badan — itu harga dari kain yang tidak berlubang dan
  // tidak menembus badan. Pita penutup tepi sudah dilepas (tepi kini lurus
  // karena komponen y offset dimatikan di dekat batas potong), jadi terukur
  // turun ke 44.389 tri (char.anak-laki). Anggaran shot tetap 120.000, jadi
  // dua tokoh masih muat dalam satu shot.
  character: {tris: 46000, tex: 2048, why: 'silhouette halus untuk medium shot; base MakeHuman + kain dari tubuh'},
  entity: {tris: 34000, tex: 2048, why: 'sosok berkain, butuh lipatan & tudung'},
  building: {tris: 3000, tex: 1024, why: 'latar statis, detail lewat tekstur'},
  road: {tris: 1500, tex: 1024, why: 'permukaan datar, 2–3 pita material'},
  nature: {tris: 4000, tex: 1024, why: 'dedaunan berulang, siluet penting'},
  prop: {tris: 1500, tex: 512, why: 'properti kecil di tangan atau meja'},
  vehicle: {tris: 3000, tex: 512, why: 'kendaraan latar, bentuk kotak'},
};

/** Anggaran satu shot (jumlah aset yang tampil bersamaan). */
export const SHOT_TRI_BUDGET = 120000;

export function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return {w: buf.readUInt32BE(16), h: buf.readUInt32BE(20)};
}

export function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const m = buf[i + 1];
    if (sof.has(m)) return {w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5)};
    if (m === 0xd8 || m === 0xd9) {
      i += 2;
      continue;
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/** Baca satu GLB → ukuran topologi & tekstur. */
export function measureGlb(file) {
  const {json, bin} = splitGlb(fs.readFileSync(file));
  let tris = 0;
  let verts = 0;
  let prims = 0;
  const attrs = new Set();
  for (const mesh of json.meshes ?? []) {
    for (const p of mesh.primitives) {
      prims += 1;
      const pos = json.accessors[p.attributes.POSITION];
      verts += pos.count;
      if (p.indices !== undefined) tris += json.accessors[p.indices].count / 3;
      else tris += pos.count / 3;
      for (const k of Object.keys(p.attributes)) attrs.add(k);
    }
  }
  const sizes = [];
  for (const img of json.images ?? []) {
    const bv = json.bufferViews?.[img.bufferView];
    if (!bv) continue;
    const data = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
    const dim = pngSize(data) ?? jpegSize(data);
    if (dim) sizes.push(Math.max(dim.w, dim.h));
  }
  const joints = json.skins?.[0]?.joints?.length ?? 0;
  return {
    tris: Math.round(tris),
    verts,
    prims,
    materials: (json.materials ?? []).length,
    images: (json.images ?? []).length,
    maxTex: sizes.length ? Math.max(...sizes) : 0,
    joints,
    animated: (json.animations ?? []).length,
    attrs: [...attrs].sort(),
    bytes: fs.statSync(file).size,
  };
}

export function measureRegistry(registry, root) {
  const out = {};
  for (const [id, entry] of Object.entries(registry.assets)) {
    const m = measureGlb(path.join(root, 'public', entry.uri));
    out[id] = {...m, category: entry.category, title: entry.title, registryTris: entry.tris};
  }
  return out;
}
