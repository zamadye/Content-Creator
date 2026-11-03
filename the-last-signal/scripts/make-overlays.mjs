/**
 * Generator overlay tekstur (Phase 1).
 *
 * Film grain dan scanline dibuat SEKALI sebagai PNG tile, lalu diulang
 * (repeat) dan digeser per frame di Remotion. Jauh lebih murah daripada
 * merasterisasi filter SVG turbulence 1080×1920 di setiap frame — perbedaan
 * kecepatan render di mesin 2 core sangat besar.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// Overlay bersifat generik untuk channel, tapi disimpan di dalam folder episode
// supaya publicDir Remotion tetap satu direktori yang self-contained.
const episodeArgIndex = process.argv.indexOf("--episode");
const EPISODE_ID = episodeArgIndex !== -1 ? process.argv[episodeArgIndex + 1] : "LS-0001";
const OUT_DIR = join(HERE, "..", "projects", "episodes", EPISODE_ID, "overlays");

const crcTable = (() => {
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
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Minimal PNG encoder (RGBA, 8-bit, tanpa filter). */
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrain(size, seed) {
  const rnd = mulberry32(seed);
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(rnd() * 255);
    // Grain diletakkan di sekitar mid-gray supaya blend mode `overlay`
    // hanya menambah/mengurangi luminansi, tidak mengubah warna.
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 235;
  }
  return encodePng(size, size, rgba);
}

function makeScanlines(width, height) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const dark = y % 4 === 0 || y % 4 === 1;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = dark ? 0 : 255;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
      rgba[i + 3] = dark ? 90 : 0;
    }
  }
  return encodePng(width, height, rgba);
}

console.log(`Overlays untuk ${EPISODE_ID} → ${OUT_DIR}`);
mkdirSync(OUT_DIR, { recursive: true });
for (let i = 1; i <= 4; i++) {
  writeFileSync(join(OUT_DIR, `grain-0${i}.png`), makeGrain(512, 1000 + i));
  console.log(`  overlays/grain-0${i}.png`);
}
writeFileSync(join(OUT_DIR, "scanlines.png"), makeScanlines(8, 8));
console.log("  overlays/scanlines.png");
