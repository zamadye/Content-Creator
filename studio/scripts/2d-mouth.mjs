/**
 * 2d-mouth.mjs — bikin pasangan sprite "mulut tertutup / mulut terbuka" dari satu gambar.
 *
 * Gagasan: badan TIDAK BOLEH berubah sama sekali saat bicara. Jadi kita pakai satu
 * ilustrasi tubuh utuh, lalu menutup mulutnya secara programatik (mengecat area mulut
 * dengan warna kulit lalu menggambar garis mulut tertutup). Hasilnya dua PNG dengan
 * badan identik piksel per piksel — selisihnya hanya di kotak mulut.
 *
 *   node scripts/2d-mouth.mjs public/chars/mouth/alya-base.png alya
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

/* ------------------------------------------------------------------ PNG baca */
function decodePng(file) {
  const b = fs.readFileSync(file);
  let o = 8, w = 0, h = 0, ct = 0, bd = 8;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const type = b.toString('ascii', o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  if (bd !== 8) throw new Error('bit depth tidak didukung');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = ct === 2 ? 3 : ct === 6 ? 4 : ct === 0 ? 1 : 2;
  const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const bb = prev[x];
      const c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += bb;
      else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) {
        const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c;
      }
      cur[x] = v & 255;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return {w, h, ch, data: out};
}

/* ----------------------------------------------------------------- PNG tulis */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
const crc32 = (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};
function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const [file, name, targetH] = process.argv.slice(2);
if (!file || !name) { console.error('pakai: node scripts/2d-mouth.mjs <base.png> <nama> [tinggi_px]'); process.exit(1); }

const {w, h, ch, data} = decodePng(file);
const px = (x, y) => {
  const i = (y * w + x) * ch;
  return {r: data[i], g: data[i + 1], b: data[i + 2], a: ch === 4 ? data[i + 3] : 255};
};
const lum = (p) => 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;

// 1. buang latar putih dari tepi (flood fill) -> alpha
const alpha = new Uint8Array(w * h).fill(255);
const isWhite = (x, y) => { const p = px(x, y); return p.r > 238 && p.g > 238 && p.b > 238; };
const stack = [];
for (let x = 0; x < w; x++) { stack.push([x, 0], [x, h - 1]); }
for (let y = 0; y < h; y++) { stack.push([0, y], [w - 1, y]); }
while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= w || y >= h) continue;
  const i = y * w + x;
  if (alpha[i] === 0 || !isWhite(x, y)) continue;
  alpha[i] = 0;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// 2. bounding box seluruh tubuh (untuk skala acuan)
const trim = {minX: w, maxX: 0, minY: h, maxY: 0};
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x]) {
  trim.minX = Math.min(trim.minX, x); trim.maxX = Math.max(trim.maxX, x);
  trim.minY = Math.min(trim.minY, y); trim.maxY = Math.max(trim.maxY, y);
}
const tw0 = trim.maxX - trim.minX + 1, th0 = trim.maxY - trim.minY + 1;

// 3. mulut = blob gelap paling bawah di area kepala (30% atas tubuh).
//    Kepala selalu di 30% teratas pada ilustrasi full-body seperti ini, jadi
//    kita tidak perlu mendeteksi wajah secara eksak.
const dark = new Uint8Array(w * h);
const headBottom = Math.round(trim.minY + th0 * 0.30);
for (let y = trim.minY; y <= headBottom; y++) {
  for (let x = trim.minX; x <= trim.maxX; x++) {
    const i = y * w + x;
    if (alpha[i] === 0) continue;
    if (lum(px(x, y)) < 130) dark[i] = 1;
  }
}
const seen = new Uint8Array(w * h);
const darkBlobs = [];
for (let y = trim.minY; y <= headBottom; y++) {
  for (let x = trim.minX; x <= trim.maxX; x++) {
    const i = y * w + x;
    if (!dark[i] || seen[i]) continue;
    const q = [[x, y]]; seen[i] = 1;
    let minX = x, maxX = x, minY = y, maxY = y, count = 0;
    while (q.length) {
      const [cx, cy] = q.pop(); count++;
      minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (nx < trim.minX || ny < trim.minY || nx > trim.maxX || ny > headBottom) continue;
        const ni = ny * w + nx;
        if (!dark[ni] || seen[ni]) continue;
        seen[ni] = 1; q.push([nx, ny]);
      }
    }
    darkBlobs.push({count, minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2});
  }
}
const minBlob = Math.max(20, th0 * th0 * 0.0004);
const candidates = darkBlobs
  .filter((b) => b.count > minBlob)
  .filter((b) => b.maxX - b.minX > th0 * 0.015 && b.maxX - b.minX < th0 * 0.11)
  .filter((b) => b.cy > trim.minY + th0 * 0.10 && b.cy < trim.minY + th0 * 0.28);
if (!candidates.length) throw new Error('mulut tidak terdeteksi');
const mouth = candidates.sort((a, b) => b.cy - a.cy)[0];

// warna kulit dominan di sekitar mulut (piksel terang/berwarna kulit)
const skinSamples = [];
for (let y = mouth.minY - 10; y <= mouth.maxY + 10; y++) {
  for (let x = mouth.minX - 14; x <= mouth.maxX + 14; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = px(x, y);
    if (alpha[y * w + x] === 0) continue;
    if (lum(p) < 150) continue;
    if (p.r - p.b < 25) continue;
    skinSamples.push(p);
  }
}
// fallback: kalau di sekitar mulut penuh rambut/bayangan, ambil warna kulit
// dominan dari seluruh sprite (predikat kulit sederhana).
if (skinSamples.length < 20) {
  for (let y = trim.minY; y < trim.maxY; y++) {
    for (let x = trim.minX; x < trim.maxX; x++) {
      if (alpha[y * w + x] === 0) continue;
      const p = px(x, y);
      if (p.r > 135 && p.r - p.b > 30 && p.g - p.b > 8 && lum(p) > 105) skinSamples.push(p);
    }
  }
}
if (!skinSamples.length) throw new Error('warna kulit tidak terdeteksi');
const med = (arr, k) => arr.map((p) => p[k]).sort((a, b) => a - b)[Math.floor(arr.length / 2)];
const skin = {r: med(skinSamples, 'r'), g: med(skinSamples, 'g'), b: med(skinSamples, 'b')};
console.log(`  kulit sekitar mulut: rgb(${skin.r},${skin.g},${skin.b}) dari ${skinSamples.length} sampel`);

// 4. buat dua RGBA: open (asli) & closed (mulut dicat)
const tw = tw0, th = th0;
const makeRgba = (closed) => {
  const out = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const sx = x + trim.minX, sy = y + trim.minY;
      const si = sy * w + sx;
      const di = (y * tw + x) * 4;
      const p = px(sx, sy);
      let r = p.r, g = p.g, b = p.b;
      if (closed) {
        // cat seluruh area mulut (termasuk garis bibir) dengan kulit, lalu garis mulut tertutup
        const padX = Math.max(4, Math.round((mouth.maxX - mouth.minX) * 0.16));
        const padY = Math.max(3, Math.round((mouth.maxY - mouth.minY) * 0.38));
        const cx0 = (mouth.minX + mouth.maxX) / 2, cy0 = (mouth.minY + mouth.maxY) / 2;
        const rx = (mouth.maxX - mouth.minX) / 2 + padX, ry = (mouth.maxY - mouth.minY) / 2 + padY;
        const t = ((sx - cx0) / rx) ** 2 + ((sy - cy0) / ry) ** 2;
        if (t <= 1.16) {
          // isi elips dengan warna kulit, tepinya dilembutkan supaya tidak terlihat kotak
          const a = t <= 0.72 ? 1 : Math.max(0, (1.16 - t) / 0.44);
          r = Math.round(r + (skin.r - r) * a);
          g = Math.round(g + (skin.g - g) * a);
          b = Math.round(b + (skin.b - b) * a);
        }
        const lineY = mouth.minY + Math.round((mouth.maxY - mouth.minY) * 0.55);
        const half = Math.max(3, Math.round((mouth.maxX - mouth.minX) * 0.45));
        const midX = Math.round((mouth.minX + mouth.maxX) / 2);
        const dx = Math.abs(sx - midX);
        if (dx <= half && Math.abs(sy - lineY) <= 1.6) {
          const t = dx / Math.max(1, half);
          const curve = Math.round(1.2 * (1 - t * t)); // sedikit melengkung
          if (Math.abs(sy - (lineY + curve)) <= 1.2) { r = 70; g = 40; b = 34; }
        }
      }
      out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = alpha[si];
    }
  }
  return out;
};

// 5. perkecil ke tinggi target (bilinear sederhana)
const target = targetH ? Number(targetH) : 720;
const scale = target / th;
const ow = Math.round(tw * scale), oh = target;
const resample = (src) => {
  const out = Buffer.alloc(ow * oh * 4);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const fx = Math.min(tw - 1, x / scale), fy = Math.min(th - 1, y / scale);
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const x1 = Math.min(tw - 1, x0 + 1), y1 = Math.min(th - 1, y0 + 1);
      const dx = fx - x0, dy = fy - y0;
      const di = (y * ow + x) * 4;
      for (let k = 0; k < 4; k++) {
        const p00 = src[(y0 * tw + x0) * 4 + k], p10 = src[(y0 * tw + x1) * 4 + k];
        const p01 = src[(y1 * tw + x0) * 4 + k], p11 = src[(y1 * tw + x1) * 4 + k];
        out[di + k] = Math.round((p00 * (1 - dx) + p10 * dx) * (1 - dy) + (p01 * (1 - dx) + p11 * dx) * dy);
      }
    }
  }
  return out;
};

fs.mkdirSync('public/chars/mouth', {recursive: true});
const openRgba = resample(makeRgba(false));
const closedRgba = resample(makeRgba(true));
fs.writeFileSync(`public/chars/mouth/${name}-open.png`, encodePng(ow, oh, openRgba));
fs.writeFileSync(`public/chars/mouth/${name}-closed.png`, encodePng(ow, oh, closedRgba));

// 6. verifikasi: selisih hanya di kotak mulut
let diffOutside = 0, diffTotal = 0;
const mBox = {
  x0: (mouth.minX - trim.minX) * scale, x1: (mouth.maxX - trim.minX) * scale,
  y0: (mouth.minY - trim.minY) * scale, y1: (mouth.maxY - trim.minY) * scale,
};
for (let y = 0; y < oh; y++) {
  for (let x = 0; x < ow; x++) {
    const i = (y * ow + x) * 4;
    const d = Math.abs(openRgba[i] - closedRgba[i]) + Math.abs(openRgba[i + 1] - closedRgba[i + 1]) + Math.abs(openRgba[i + 2] - closedRgba[i + 2]);
    if (d > 6) {
      diffTotal++;
      const inside = x >= mBox.x0 - 6 && x <= mBox.x1 + 6 && y >= mBox.y0 - 6 && y <= mBox.y1 + 6;
      if (!inside) diffOutside++;
    }
  }
}
console.log(`${name}: ${ow}×${oh} · mulut ${mouth.maxX - mouth.minX}×${mouth.maxY - mouth.minY}px · piksel beda ${diffTotal} (luar kotak mulut: ${diffOutside})`);
if (diffOutside > diffTotal * 0.02) {
  console.warn(`  ⚠ ${name}: ada ${diffOutside} piksel beda di luar mulut`);
}
