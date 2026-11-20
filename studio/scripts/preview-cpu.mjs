/**
 * Preview CPU — masih gambar (PNG) dari pose sebenarnya, tanpa browser/GPU.
 *
 * Chromium/SwiftShader yang dipakai Remotion tidak tersedia di sandbox ini, jadi
 * untuk memeriksa gerak kita meraster sendiri geometri ber-skinning di Node:
 * kerangka klip + lapisan sekunder + lapisan hidup dijalankan persis seperti di
 * `renderer.js`, lalu tiap frame digambar sebagai "clay render".
 *
 *   node scripts/preview-cpu.mjs --shot nisa-06 --frames 700,712,724,736 --life
 *   node scripts/preview-cpu.mjs --shot nisa-08 --frames 980,1010,1040 --no-life
 *   node scripts/preview-cpu.mjs --shot nisa-06 --mode head --frames 700,706 --out out/qc/nisa-06-kepala.png
 *
 * Opsi:
 *   --shot <id>        shot yang digambar (wajib)
 *   --frames a,b,c     frame global; default 6 frame merata di shot
 *   --life/--no-life   sertakan lapisan hidup (default: ya)
 *   --mode full|head   bidikan penuh atau close-up kepala
 *   --width N          lebar tiap panel (default 384)
 *   --trail            gambar jejak kepala sepanjang shot
 *   --out <path>       PNG gabungan (default out/qc/<shot>.png)
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {compileStory} from '../src/studio/compile.js';
import {registry} from '../src/studio/library.js';
import {createClipSampler} from '../src/studio/clip-sample.js';
import {secondaryTurns, applySecondary, prepareSecondary} from '../src/studio/secondary.js';
import {lifeTurns} from '../src/studio/life.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0) {
    const v = argv[i + 1];
    return v && !v.startsWith('--') ? v : true;
  }
  return fallback;
};
const has = (name) => argv.includes(`--${name}`);

/* ---------------------------------------------------------------- GLB di Node */

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
  const texKeys = ['baseColorTexture', 'metallicRoughnessTexture', 'normalTexture', 'occlusionTexture', 'emissiveTexture'];
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
  const jb = Buffer.from(JSON.stringify(json), 'utf8');
  const jc = Buffer.concat([jb, Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20)]);
  const bc = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4, 0)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jc.length + 8 + bc.length, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jc.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(bc.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  const out = Buffer.concat([header, jh, jc, bh, bc]);
  return out;
}

const glbCache = new Map();
async function loadTemplate(assetId) {
  if (glbCache.has(assetId)) return glbCache.get(assetId);
  const file = path.join(root, 'public', registry.assets[assetId].uri);
  const {json, bin} = splitGlb(fs.readFileSync(file));
  const buf = buildGlb(json, bin);
  const gltf = await new Promise((res, rej) =>
    new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej),
  );
  glbCache.set(assetId, gltf);
  return gltf;
}

/* ------------------------------------------------------------------- raster */

const PALETTE = {
  skin: [214, 168, 140],
  warm: [206, 158, 130],
  hair: [38, 30, 26],
  fringe: [44, 34, 29],
  ink: [22, 22, 24],
  eye: [232, 230, 226],
  mulut: [148, 74, 74],
  shirt: [188, 118, 72],
  'cloth-kerah': [202, 160, 108],
  'cloth-dasi': [176, 120, 70],
  pants: [72, 82, 104],
  sole: [46, 42, 42],
  shoe: [58, 50, 48],
  white: [232, 228, 220],
  ribbon: [162, 74, 66],
};

class Canvas {
  constructor(w, h, bg = [32, 36, 44]) {
    this.w = w;
    this.h = h;
    this.color = Buffer.alloc(w * h * 3);
    this.depth = new Float32Array(w * h).fill(Infinity);
    this.bg = bg;
    for (let i = 0; i < w * h; i += 1) {
      const t = (i / w / h) ** 0.7;
      for (let c = 0; c < 3; c += 1) this.color[i * 3 + c] = Math.min(255, bg[c] * (0.55 + 0.45 * t)) | 0;
    }
  }

  tri(p, color, light) {
    const [a, b, c] = p;
    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    if (minX > maxX || minY > maxY) return;
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (area === 0) return;
    const inv = 1 / area;
    const shade = Math.max(0.16, Math.min(1.35, light));
    const r = Math.min(255, color[0] * shade) | 0;
    const g = Math.min(255, color[1] * shade) | 0;
    const bl = Math.min(255, color[2] * shade) | 0;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) * inv;
        if (w0 < 0) continue;
        const w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) * inv;
        if (w1 < 0) continue;
        const w2 = 1 - w0 - w1;
        if (w2 < 0) continue;
        const z = a[2] * w0 + b[2] * w1 + c[2] * w2;
        const i = y * this.w + x;
        if (z >= this.depth[i]) continue;
        this.depth[i] = z;
        this.color[i * 3] = r;
        this.color[i * 3 + 1] = g;
        this.color[i * 3 + 2] = bl;
      }
    }
  }

  line(x0, y0, x1, y1, color) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= steps; s += 1) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps);
      const y = Math.round(y0 + ((y1 - y0) * s) / steps);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      const i = y * this.w + x;
      this.color[i * 3] = color[0];
      this.color[i * 3 + 1] = color[1];
      this.color[i * 3 + 2] = color[2];
    }
  }

  blit(src, ox, oy) {
    for (let y = 0; y < src.h; y += 1) {
      for (let x = 0; x < src.w; x += 1) {
        const dx = ox + x;
        const dy = oy + y;
        if (dx < 0 || dy < 0 || dx >= this.w || dy >= this.h) continue;
        const s = (y * src.w + x) * 3;
        const d = (dy * this.w + dx) * 3;
        this.color[d] = src.color[s];
        this.color[d + 1] = src.color[s + 1];
        this.color[d + 2] = src.color[s + 2];
      }
    }
  }

  fillRect(x0, y0, w, h, color, alpha = 1) {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
        const i = (y * this.w + x) * 3;
        for (let c = 0; c < 3; c += 1) {
          this.color[i + c] = this.color[i + c] * (1 - alpha) + color[c] * alpha;
        }
      }
    }
  }
}

/* --------------------------------------------------------------- PNG writer */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function writePng(file, canvas) {
  const {w, h} = canvas;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 3 + 1)] = 0;
    canvas.color.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level: 6})),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, png);
}

/* ------------------------------------------------------------------- render */

const seedOf = (ref) => {
  let h = 0;
  for (let i = 0; i < String(ref).length; i += 1) h = (h * 31 + String(ref).charCodeAt(i)) % 9973;
  return h / 97;
};

const v = new THREE.Vector3();

/** Gambar satu karakter pada waktu tertentu. */
function drawCharacter(canvas, camera, scene, proj, lightDir) {
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((o) => {
    if (o.isMesh) meshes.push(o);
  });
  for (const mesh of meshes) {
    const geo = mesh.geometry;
    const pos = geo.getAttribute('position');
    const index = geo.getIndex();
    if (!pos) continue;
    const base = PALETTE[mesh.material?.name] ?? [150, 150, 150];
    const count = pos.count;
    // proyeksi semua vertex sekali
    const sx = new Float32Array(count);
    const sy = new Float32Array(count);
    const sz = new Float32Array(count);
    const wx = new Float32Array(count);
    const wy = new Float32Array(count);
    const wz = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      v.fromBufferAttribute(pos, i);
      if (mesh.isSkinnedMesh) mesh.applyBoneTransform(i, v);
      v.applyMatrix4(mesh.matrixWorld);
      wx[i] = v.x;
      wy[i] = v.y;
      wz[i] = v.z;
      v.project(camera);
      sx[i] = ((v.x + 1) / 2) * canvas.w;
      sy[i] = ((1 - v.y) / 2) * canvas.h;
      sz[i] = v.z;
    }
    const triCount = index ? index.count / 3 : count / 3;
    for (let t = 0; t < triCount; t += 1) {
      const ia = index ? index.getX(t * 3) : t * 3;
      const ib = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const ic = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      if (sz[ia] > 1 || sz[ib] > 1 || sz[ic] > 1) continue;
      if (sz[ia] < -1 || sz[ib] < -1 || sz[ic] < -1) continue;
      // normal dunia untuk pencahayaan
      const ax = wx[ib] - wx[ia];
      const ay = wy[ib] - wy[ia];
      const az = wz[ib] - wz[ia];
      const bx = wx[ic] - wx[ia];
      const by = wy[ic] - wy[ia];
      const bz = wz[ic] - wz[ia];
      let nx = ay * bz - az * by;
      let ny = az * bx - ax * bz;
      let nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const facing = nx * (camera.position.x - wx[ia]) + ny * (camera.position.y - wy[ia]) + nz * (camera.position.z - wz[ia]);
      if (facing <= 0) continue; // belakang
      const diff = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
      const rim = Math.max(0, 1 - Math.abs(nz)) * 0.05;
      const light = 0.34 + 0.82 * diff + rim;
      canvas.tri(
        [
          [sx[ia], sy[ia], sz[ia]],
          [sx[ib], sy[ib], sz[ib]],
          [sx[ic], sy[ic], sz[ic]],
        ],
        base,
        light,
      );
    }
  }
}

function drawLabel(canvas, x, y, text, color = [232, 232, 232]) {
  const FONT = {
    0: ['111', '101', '101', '101', '111'],
    1: ['010', '110', '010', '010', '111'],
    2: ['111', '001', '111', '100', '111'],
    3: ['111', '001', '111', '001', '111'],
    4: ['101', '101', '111', '001', '001'],
    5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'],
    7: ['111', '001', '010', '010', '010'],
    8: ['111', '101', '111', '101', '111'],
    9: ['111', '101', '111', '001', '111'],
    '.': ['000', '000', '000', '000', '010'],
  };
  let cx = x;
  for (const ch of String(text)) {
    const g = FONT[ch];
    if (g) {
      for (let r = 0; r < 5; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          if (g[r][c] === '1') canvas.fillRect(cx + c * 2, y + r * 2, 2, 2, color);
        }
      }
    }
    cx += 9;
  }
}

const LIGHT_DIR = new THREE.Vector3(-0.45, 0.75, 0.5).normalize();

/**
 * Susun satu frame: aktor + pose (klip, sekunder, hidup) + kamera, lalu raster.
 * Dipakai oleh mode lembar-kontak maupun GIF.
 */
async function buildPanel({story, shot, frame, life, mode, width, camera}) {
  const panelH = Math.round((width * story.height) / story.width);
  const local = frame - shot.from;
  const u = shot.durationInFrames > 1 ? local / (shot.durationInFrames - 1) : 0;
  const seconds = local / story.fps;

  const scene = new THREE.Scene();
  let leadFacing = 0;
  let leadRefHere = null;
  for (const c of shot.cast) {
    if (c.hidden) continue;
    const asset = registry.assets[c.assetId];
    if (!asset || asset.category !== 'character') continue;
    const tpl = await loadTemplate(c.assetId);
    const inst = cloneSkeleton(tpl.scene);
    inst.position.set(c.at[0], c.at[1], c.at[2]);
    inst.rotation.y = c.yaw ?? 0;
    scene.add(inst);

    const clip = THREE.AnimationClip.findByName(tpl.animations, c.clip) ?? tpl.animations[0];
    const sampler = createClipSampler(inst, clip);
    prepareSecondary(inst, {nodes: sampler.animatedNodes, scales: sampler.scaleNodes});
    sampler.apply(seconds * (c.speed ?? 1) + (c.offset ?? 0));
    const turns = secondaryTurns(seconds, {
      clip: c.clip,
      duration: sampler.duration,
      speed: c.speed ?? 1,
      intensity: shot.secondary ?? 1,
    });
    const speaking = shot.speaker === c.ref;
    const listening = Boolean(shot.speaker) && !speaking;
    let rootOffset = [0, 0];
    if (life) {
      const extra = lifeTurns(seconds, {
        seed: seedOf(c.ref),
        speaking,
        listening,
        clip: c.clip,
        intensity: shot.secondary ?? 1,
      });
      turns.push(...extra.turns);
      rootOffset = extra.root;
    }
    applySecondary(inst, turns);
    inst.position.x += rootOffset[0];
    inst.position.y += rootOffset[1];
    if (speaking) {
      leadFacing = inst.rotation.y;
      leadRefHere = c.ref;
    }
    if (c.travel) {
      inst.position.z += Math.cos(inst.rotation.y) * c.travel * seconds;
      inst.position.x += Math.sin(inst.rotation.y) * c.travel * seconds;
    }
  }

  const cam = shot.cameraSample(Math.min(1, Math.max(0, u)));
  camera.fov = cam.fov;
  camera.aspect = story.width / story.height;
  camera.updateProjectionMatrix();
  camera.position.set(cam.position[0], cam.position[1], cam.position[2]);
  camera.up.set(0, 1, 0);
  camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
  if (cam.roll) camera.rotateZ(cam.roll);
  camera.updateMatrixWorld(true);

  const headObj = findCharacterHead(scene);
  const headWorld = headObj ? headObj.getWorldPosition(new THREE.Vector3()) : null;

  if (mode === 'side' && headWorld) {
    // Kamera uji dari samping: untuk memeriksa siklus langkah (lutut, pergelangan,
    // ayunan lengan) tanpa kamera cerita yang menyembunyikannya.
    const yaw = leadFacing;
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const focus = new THREE.Vector3(headWorld.x, headWorld.y - 0.75, headWorld.z);
    camera.position.copy(focus).addScaledVector(right, 3.4).add(new THREE.Vector3(0, 0.25, 0));
    camera.fov = 38;
    camera.updateProjectionMatrix();
    camera.lookAt(focus);
    camera.updateMatrixWorld(true);
  }

  if (mode === 'head' && headWorld) {
    // Kamera ditaruh di depan wajah aktor (arah `yaw` aktor), bukan mengikuti
    // kamera shot: yang diperiksa di sini kelopak mata dan mulut.
    const fwd = new THREE.Vector3(Math.sin(leadFacing), 0, Math.cos(leadFacing));
    camera.position.copy(headWorld).addScaledVector(fwd, 0.62).add(new THREE.Vector3(0, 0.02, 0));
    camera.fov = 34;
    camera.updateProjectionMatrix();
    camera.lookAt(headWorld.x, headWorld.y - 0.05, headWorld.z);
    camera.updateMatrixWorld(true);
  }

  const panel = new Canvas(width, panelH, [26, 30, 36]);
  drawCharacter(panel, camera, scene, null, LIGHT_DIR);
  panel.fillRect(0, 0, width, 2, [70, 78, 90]);
  drawLabel(panel, 8, 8, String(frame), [255, 214, 120]);
  drawLabel(panel, 8, panelH - 16, shot.id, [180, 186, 196]);
  return {panel, panelH, headWorld};
}

async function renderShot({story, shot, frames, life, mode, width, trail}) {
  const camera = new THREE.PerspectiveCamera(45, story.width / story.height, 0.05, 200);
  const first = await buildPanel({story, shot, frame: frames[0], life, mode, width, camera});
  const panelH = first.panelH;
  const per = Math.min(frames.length, 4);
  const rows = Math.ceil(frames.length / per);
  const sheet = new Canvas(width * per, panelH * rows, [26, 30, 36]);
  sheet.blit(first.panel, 0, 0);
  const headTrail = [];
  if (trail && first.headWorld) headTrail.push(first.headWorld.clone());

  for (let fi = 1; fi < frames.length; fi += 1) {
    const {panel, headWorld} = await buildPanel({story, shot, frame: frames[fi], life, mode, width, camera});
    if (trail && headWorld) headTrail.push(headWorld.clone());
    const ox = (fi % per) * width;
    const oy = Math.floor(fi / per) * panelH;
    sheet.blit(panel, ox, oy);
  }
  for (let fi = 0; fi < frames.length; fi += 1) {
    const ox = (fi % per) * width;
    const oy = Math.floor(fi / per) * panelH;
    sheet.fillRect(ox, oy, width, 1, [90, 96, 108]);
    if (fi % per) sheet.fillRect(ox, oy, 1, panelH, [90, 96, 108]);
  }

  // jejak kepala digambar di panel pertama agar arah/arc-nya terbaca
  if (trail && headTrail.length > 1) {
    const cam = shot.cameraSample(Math.min(1, Math.max(0, (frames[0] - shot.from) / Math.max(1, shot.durationInFrames - 1))));
    camera.fov = cam.fov;
    camera.aspect = story.width / story.height;
    camera.updateProjectionMatrix();
    camera.position.set(cam.position[0], cam.position[1], cam.position[2]);
    camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
    camera.updateMatrixWorld(true);
    const pts = headTrail.map((p) => {
      const q = p.clone().project(camera);
      return [((q.x + 1) / 2) * width, ((1 - q.y) / 2) * panelH];
    });
    for (let i = 1; i < pts.length; i += 1) {
      sheet.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], [255, 190, 90]);
    }
  }
  return sheet;
}

/* -------------------------------------------------------------- GIF (animasi) */

/**
 * GIF 256 warna (kubus 6×6×6). Tidak ada encoder video di sandbox ini, dan GIF
 * bisa diputar langsung di penampil berkas — cukup untuk memeriksa gerak.
 */
class GifEncoder {
  constructor(w, h, {delayMs = 66, loop = 0} = {}) {
    this.w = w;
    this.h = h;
    this.delay = Math.max(2, Math.round(delayMs / 10));
    this.frames = [];
    this.loop = loop;
  }

  static palette() {
    const pal = Buffer.alloc(256 * 3);
    for (let i = 0; i < 216; i += 1) {
      const r = Math.floor(i / 36) % 6;
      const g = Math.floor(i / 6) % 6;
      const b = i % 6;
      pal[i * 3] = Math.round((r / 5) * 255);
      pal[i * 3 + 1] = Math.round((g / 5) * 255);
      pal[i * 3 + 2] = Math.round((b / 5) * 255);
    }
    return pal;
  }

  addFrame(canvas) {
    const idx = Buffer.alloc(this.w * this.h);
    for (let i = 0; i < this.w * this.h; i += 1) {
      const r = Math.min(5, Math.round((canvas.color[i * 3] / 255) * 5));
      const g = Math.min(5, Math.round((canvas.color[i * 3 + 1] / 255) * 5));
      const b = Math.min(5, Math.round((canvas.color[i * 3 + 2] / 255) * 5));
      idx[i] = r * 36 + g * 6 + b;
    }
    this.frames.push(idx);
  }

  build() {
    const out = [Buffer.from('GIF89a', 'ascii')];
    const lsd = Buffer.alloc(7);
    lsd.writeUInt16LE(this.w, 0);
    lsd.writeUInt16LE(this.h, 2);
    lsd[4] = 0xf7; // global color table, 256 warna
    out.push(lsd, GifEncoder.palette());
    const netscape = Buffer.alloc(19);
    netscape[0] = 0x21;
    netscape[1] = 0xff;
    netscape[2] = 11;
    netscape.write('NETSCAPE2.0', 3, 'ascii');
    netscape[14] = 3;
    netscape[15] = 1;
    netscape.writeUInt16LE(this.loop, 16);
    out.push(netscape);
    for (const frame of this.frames) {
      const gce = Buffer.from([0x21, 0xf9, 4, 0x04, 0, 0, 0, 0]);
      gce.writeUInt16LE(this.delay, 4);
      const desc = Buffer.alloc(10);
      desc[0] = 0x2c;
      desc.writeUInt16LE(0, 1);
      desc.writeUInt16LE(0, 3);
      desc.writeUInt16LE(this.w, 5);
      desc.writeUInt16LE(this.h, 7);
      out.push(gce, desc, Buffer.from([8]), lzwEncode(frame, 8));
    }
    out.push(Buffer.from([0x3b]));
    return Buffer.concat(out);
  }
}

/** LZW sesuai spesifikasi GIF. */
function lzwEncode(indices, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let dict = new Map();
  let next = eoi + 1;
  let codeSize = minCodeSize + 1;
  const bytes = [];
  let bitBuf = 0;
  let bitCount = 0;
  const emit = (code) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };
  const resetDict = () => {
    dict = new Map();
    next = eoi + 1;
    codeSize = minCodeSize + 1;
  };
  emit(clear);
  let current = indices[0];
  for (let i = 1; i < indices.length; i += 1) {
    const k = indices[i];
    const key = current * 4096 + k;
    if (dict.has(key)) {
      current = dict.get(key);
      continue;
    }
    emit(current);
    dict.set(key, next);
    next += 1;
    if (next > 1 << codeSize) {
      if (codeSize < 12) codeSize += 1;
      else {
        emit(clear);
        resetDict();
      }
    }
    current = k;
  }
  emit(current);
  emit(eoi);
  if (bitCount > 0) bytes.push(bitBuf & 0xff);
  const blocks = [];
  for (let i = 0; i < bytes.length; i += 255) {
    const slice = bytes.slice(i, i + 255);
    blocks.push(Buffer.from([slice.length]), Buffer.from(slice));
  }
  blocks.push(Buffer.from([0]));
  return Buffer.concat(blocks);
}

async function renderGif({story, shot, frames, life, mode, width, out, step = 1}) {
  const camera = new THREE.PerspectiveCamera(45, story.width / story.height, 0.05, 200);
  // delay mengikuti langkah frame supaya kecepatannya sama dengan film (30 fps)
  const enc = new GifEncoder(width, Math.round((width * story.height) / story.width), {
    delayMs: (1000 / story.fps) * step,
  });
  for (const frame of frames) {
    const {panel} = await buildPanel({story, shot, frame, life, mode, width, camera});
    enc.addFrame(panel);
  }
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, enc.build());
  return out;
}

function findCharacterHead(scene) {
  let best = null;
  scene.traverse((o) => {
    if (!best && o.name === 'head') best = o;
  });
  return best;
}

async function main() {
  const storyFile = arg('story', path.join(root, 'stories/warung-hujan/story.json'));
  const story = JSON.parse(fs.readFileSync(storyFile, 'utf8'));
  const compiled = compileStory(story, {registry});
  const shotId = arg('shot');
  if (!shotId) throw new Error('--shot wajib diisi');
  const shot = compiled.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error(`shot ${shotId} tidak ada`);

  const life = !has('no-life');
  const mode = arg('mode', 'full');
  const width = Number(arg('width', 384));
  const trail = has('trail');
  let frames;
  const rawFrames = arg('frames');
  const rawRange = arg('range');
  if (rawRange) {
    const [a, b, stepRaw] = String(rawRange).split(',').map(Number);
    const step = stepRaw || 1;
    frames = [];
    for (let f = a; f <= b; f += step) frames.push(f);
  } else if (rawFrames) frames = String(rawFrames).split(',').map(Number);
  else {
    frames = [];
    const n = 6;
    for (let i = 0; i < n; i += 1) {
      frames.push(shot.from + Math.round(((shot.durationInFrames - 1) * i) / (n - 1)));
    }
  }

  const t0 = Date.now();
  if (has('gif')) {
    const out = arg('out', path.join(root, 'out/qc', `${shot.id}-${life ? 'hidup' : 'tanpa'}-${mode}.gif`));
    await renderGif({story, shot, frames, life, mode, width, out, step: frames.length > 1 ? frames[1] - frames[0] : 1});
    console.log(`${out} — ${frames.length} frame GIF, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    return;
  }
  const sheet = await renderShot({story, shot, frames, life, mode, width, trail});
  const suffix = `${life ? 'hidup' : 'tanpa'}-${mode}`;
  const out = arg('out', path.join(root, 'out/qc', `${shot.id}-${suffix}.png`));
  writePng(out, sheet);
  console.log(`${out} — ${sheet.w}×${sheet.h}, ${frames.length} frame, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
