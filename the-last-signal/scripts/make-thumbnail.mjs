#!/usr/bin/env node
/**
 * make-thumbnail.mjs — tempel headline ke gambar latar, jadi thumbnail 16:9.
 *
 * Kenapa teks tidak diminta ke model gambar: model mengarang huruf. Thumbnail
 * yang tulisannya salah baca lebih buruk daripada tidak punya thumbnail, jadi
 * latarnya dibuat model, teksnya ditempel kode dengan ejaan yang dijamin.
 *
 *   node scripts/make-thumbnail.mjs --bg raw/ll-0002-a.jpg --out ll-0002-a.jpg \
 *     --kicker "SETIAP KALI DIUKUR, ANGKANYA SAMA" \
 *     --l1 "TANAH INI KURANG" --l2 "12 METER"
 *
 * Butuh ImageMagick (`convert`) dan font DejaVu Sans Bold.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HERE = join(ROOT, "stories", "thumbnails");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const bg = arg("bg");
const out = arg("out");
if (!bg || !out) {
  console.error('Pakai: node scripts/make-thumbnail.mjs --bg <latar.jpg> --out <hasil.jpg> --kicker "..." --l1 "..." [--l2 "..."]');
  process.exit(1);
}

const kicker = arg("kicker", "");
const line1 = arg("l1", "");
const line2 = arg("l2", "");
const bgPath = bg.startsWith("/") ? bg : join(HERE, bg);
const outPath = out.startsWith("/") ? out : join(HERE, out);

if (!existsSync(bgPath)) {
  console.error(`✖ latar tidak ada: ${bgPath}`);
  process.exit(1);
}
if (!line1) {
  console.error("✖ --l1 wajib (baris headline pertama)");
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });

const WIDTH = 1920;
const HEIGHT = 1080;
const LEFT = 96;
const FONT = "DejaVu-Sans-Bold";
const MONO = "DejaVu-Sans-Mono-Bold";

/**
 * Lebar huruf kapital DejaVu Bold ≈ 0,78 × pointsize. Angka ini diukur, bukan
 * ditebak: 0,62 membuat baris 16 huruf meluber dan menutupi separuh gambar.
 */
function sizeFor(text) {
  const usable = WIDTH - LEFT * 2;
  const guess = Math.floor(usable / (text.length * 0.78));
  return Math.max(56, Math.min(120, guess));
}

const s1 = sizeFor(line1);
const s2 = line2 ? sizeFor(line2) : s1;
const headlineSize = Math.min(s1, s2);
const lineStep = Math.round(headlineSize * 1.12);

/**
 * Tata letak dihitung DARI BAWAH, dan y di `-annotate` (gravity northwest)
 * adalah ATAS kotak teks, bukan baseline. Dua kali salah asumsi ini membuat
 * baris terakhir menabrak tanda kanal.
 */
const markTop = HEIGHT - 52;
const head2Top = 1000 - Math.round(headlineSize * 0.72);
const head1Top = line2 ? head2Top - lineStep : head2Top;
const kickerTop = head1Top - 58;
const accentY = kickerTop - 24;
const kickerSize = 38;

const draw = (text, size, x, y, fill, font = FONT, kerning = 0) => [
  "-font", font,
  "-pointsize", String(size),
  "-kerning", String(kerning),
  "-fill", fill,
  "-annotate", `+${x}+${y}`, text,
];

const args = [
  bgPath,
  "-resize", `${WIDTH}x${HEIGHT}^`,
  // Latar dari model cenderung underexposed; dinaikkan sedikit supaya subjeknya
  // terbaca di feed ponsel.
  "-modulate", "112,104,100",
  "-gravity", "center",
  "-extent", `${WIDTH}x${HEIGHT}`,
  // Gelap dari kiri: ruang teks, tanpa menghapus subjek di kanan.
  "(", "-size", "1000x1080", "gradient:rgba(0,0,0,0.86)-rgba(0,0,0,0)", "-rotate", "90",
  "-resize", `${WIDTH}x${HEIGHT}!`, ")",
  "-gravity", "northwest",
  "-compose", "over",
  "-composite",
  // Gelap tipis di bawah untuk tanda kanal.
  "(", "-size", `${WIDTH}x260`, "gradient:rgba(0,0,0,0)-rgba(0,0,0,0.8)",
  "-rotate", "180", ")",
  "-gravity", "southwest",
  "-compose", "over",
  "-composite",
  "-gravity", "northwest",
  "-stroke", "none",
];

// Bayangan lebih dulu, teks di atasnya: tanpa bayangan, huruf putih hilang di
// langit terang dan thumbnail jadi tidak terbaca di feed ponsel.
if (kicker) {
  args.push("-fill", "#C0392B", "-draw", `rectangle ${LEFT},${accentY} ${LEFT + 190},${accentY + 10}`);
  args.push(...draw(kicker, kickerSize, LEFT + 3, kickerTop + 3, "rgba(0,0,0,0.8)", MONO, 9));
  args.push(...draw(kicker, kickerSize, LEFT, kickerTop, "#F2A63B", MONO, 9));
}
args.push(...draw(line1, headlineSize, LEFT + 5, head1Top + 7, "rgba(0,0,0,0.85)"));
args.push(...draw(line1, headlineSize, LEFT, head1Top, "#FFFFFF"));
if (line2) {
  args.push(...draw(line2, headlineSize, LEFT + 5, head2Top + 7, "rgba(0,0,0,0.85)"));
  args.push(...draw(line2, headlineSize, LEFT, head2Top, "#FFFFFF"));
}
args.push(...draw("THE LAST SIGNAL", 26, LEFT, markTop, "rgba(255,255,255,0.62)", MONO, 7));

args.push("-quality", "86", "-sampling-factor", "4:2:0", outPath);

execFileSync("convert", args, { stdio: ["ignore", "inherit", "inherit"] });

const kb = Math.round(statSync(outPath).size / 1024);
console.log(`✔ ${outPath.replace(ROOT + "/", "")} — ${kb} kB (batas YouTube 2048 kB)`);
if (kb > 2000) {
  console.error("✖ melebihi batas thumbnail YouTube 2 MB");
  process.exit(1);
}
