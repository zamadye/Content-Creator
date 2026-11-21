/**
 * 2d-sprites.mjs — potong character sheet jadi sprite per pose.
 *
 * Sheet yang digenerate berisi banyak pose di atas latar putih rata. Skrip ini:
 *   1. mendeteksi bounding box tiap pose (connected components pada piksel "tinta"),
 *   2. membuang latar putih lewat flood fill dari tepi (jadi baju putih tetap utuh),
 *   3. menulis PNG RGBA per pose ke `public/chars/<karakter>-<n>.png`,
 *   4. menulis manifest `public/chars/manifest.json` (ukuran + urutan pose).
 *
 *   node scripts/2d-sprites.mjs public/chars/sheet-alya.png alya
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/* ------------------------------------------------------------------ PNG baca */

function decodePng(file) {
  const b = fs.readFileSync(file);
  let o = 8;
  let w = 0;
  let h = 0;
  let ct = 0;
  let bd = 8;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const type = b.toString('ascii', o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bd = data[8];
      ct = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  if (bd !== 8) throw new Error(`bit depth ${bd} tidak didukung`);
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
        const p = a + bb - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - bb);
        const pc = Math.abs(p - c);
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
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
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

function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level: 9})),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------- potong */

const [file, name] = process.argv.slice(2);
if (!file || !name) {
  console.error('pakai: node scripts/2d-sprites.mjs public/chars/sheet-alya.png alya');
  process.exit(1);
}

const {w, h, ch, data} = decodePng(file);
const isWhite = (x, y) => {
  const i = (y * w + x) * ch;
  return data[i] > 236 && data[i + 1] > 236 && data[i + 2] > 236;
};

// 1. mask tinta
const ink = new Uint8Array(w * h);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) ink[y * w + x] = isWhite(x, y) ? 0 : 1;
}

// 2. connected components (4-neighbour, iterative)
const label = new Int32Array(w * h).fill(-1);
const boxes = [];
let next = 0;
const stack = [];
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = y * w + x;
    if (!ink[idx] || label[idx] !== -1) continue;
    let minX = x;
    let maxX = x;
    let minY = y;
    let maxY = y;
    let area = 0;
    label[idx] = next;
    stack.push(idx);
    while (stack.length) {
      const p = stack.pop();
      const px = p % w;
      const py = (p - px) / w;
      area++;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (ink[ni] && label[ni] === -1) {
          label[ni] = next;
          stack.push(ni);
        }
      }
    }
    if (area > 4000) boxes.push({minX, maxX, minY, maxY, area});
    next++;
  }
}

// 3. gabung box yang bertumpuk (mis. tangan terpisah dari badan)
boxes.sort((a, b) => a.minY - b.minY || a.minX - b.minX);
const merged = [];
for (const b of boxes) {
  const hit = merged.find(
    (m) => b.minX <= m.maxX + 12 && b.maxX >= m.minX - 12 && b.minY <= m.maxY + 12 && b.maxY >= m.minY - 12,
  );
  if (hit) {
    hit.minX = Math.min(hit.minX, b.minX);
    hit.maxX = Math.max(hit.maxX, b.maxX);
    hit.minY = Math.min(hit.minY, b.minY);
    hit.maxY = Math.max(hit.maxY, b.maxY);
    hit.area += b.area;
  } else merged.push({...b});
}

// urutkan baris demi baris: kelompokkan berdasarkan tinggi tengah
merged.sort((a, b) => {
  const ay = (a.minY + a.maxY) / 2;
  const by = (b.minY + b.maxY) / 2;
  if (Math.abs(ay - by) > (a.maxY - a.minY) * 0.5) return ay - by;
  return a.minX - b.minX;
});

// 4. ekspor sprite + buang putih dari tepi
const outDir = path.join('public', 'chars');
fs.mkdirSync(outDir, {recursive: true});
const manifestPath = path.join(outDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const poses = [];
for (const [i, b] of merged.entries()) {
  const pad = 6;
  const x0 = Math.max(0, b.minX - pad);
  const y0 = Math.max(0, b.minY - pad);
  const x1 = Math.min(w - 1, b.maxX + pad);
  const y1 = Math.min(h - 1, b.maxY + pad);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const px = Buffer.alloc(bw * bh * 4);

  // flood fill latar putih dari tepi crop
  const bg = new Uint8Array(bw * bh);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= bw || y >= bh) return;
    const k = y * bw + x;
    if (bg[k]) return;
    if (!isWhite(x0 + x, y0 + y)) return;
    bg[k] = 1;
    q.push(k);
  };
  for (let x = 0; x < bw; x++) {
    push(x, 0);
    push(x, bh - 1);
  }
  for (let y = 0; y < bh; y++) {
    push(0, y);
    push(bw - 1, y);
  }
  while (q.length) {
    const k = q.pop();
    const x = k % bw;
    const y = (k - x) / bw;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const k = y * bw + x;
      const si = ((y0 + y) * w + (x0 + x)) * ch;
      const di = k * 4;
      px[di] = data[si];
      px[di + 1] = data[si + 1];
      px[di + 2] = data[si + 2];
      if (bg[k]) {
        px[di + 3] = 0;
      } else {
        // piksel tepi hasil anti-alias masih bercampur putih: jadikan alpha
        // separuh supaya tidak ada garis putih mengelilingi karakter
        const edge =
          (x > 0 && bg[k - 1]) ||
          (x < bw - 1 && bg[k + 1]) ||
          (y > 0 && bg[k - bw]) ||
          (y < bh - 1 && bg[k + bw]);
        const whiteness = Math.min(px[di], px[di + 1], px[di + 2]);
        px[di + 3] = edge ? Math.max(60, Math.round(255 * (1 - whiteness / 255))) : 255;
      }
    }
  }

  const outFile = path.join(outDir, `${name}-${i + 1}.png`);
  fs.writeFileSync(outFile, encodePng(bw, bh, px));
  poses.push({file: `chars/${name}-${i + 1}.png`, width: bw, height: bh});
}

manifest[name] = poses;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${name}: ${poses.length} pose → ${poses.map((p) => `${p.width}x${p.height}`).join(', ')}`);
