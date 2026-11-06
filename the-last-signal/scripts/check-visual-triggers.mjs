#!/usr/bin/env node
/**
 * check-visual-triggers.mjs — penjaga aturan "visual mengikuti narasi"
 * (knowledge/ATURAN.md §III.3).
 *
 * Setiap shot di visual-map.json punya kata pemicu. Shot baru boleh dipotong
 * SETELAH kata itu diucapkan. Karena itu kata pemicunya harus benar-benar ada
 * di narasi segmen itu — kalau tidak ada, gambar akan mendahului cerita.
 *
 * Yang diperiksa:
 *   1. setiap "pemicu" muncul di narasi segmennya (setelah dinormalisasi),
 *   2. offset_frame berada di rentang 2–8 frame,
 *   3. id shot unik,
 *   4. entitas muncul tepat 3 kali dan makin dekat (siluet → setengah → utuh),
 *   5. minimal satu segmen ditandai terang (qc_khusus_episode.wajib_terang).
 *
 *   node scripts/check-visual-triggers.mjs stories/longform/LL-0002
 *   node scripts/check-visual-triggers.mjs stories/longform/LL-0002 --strict
 */
import { readFileSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const arg = process.argv[2] ?? "stories/longform/LL-0002";
const strict = process.argv.includes("--strict");
const dir = resolve(arg);

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function bacaNarasi(md) {
  // Narasi = baris blockquote ("> ...") di bawah setiap "## Segmen N".
  const segmen = {};
  const bagian = md.split(/^## Segmen\s+/m).slice(1);
  for (const blok of bagian) {
    const nomor = Number(blok.match(/^(\d+)/)?.[1]);
    if (!nomor) continue;
    const teks = blok
      .split("\n")
      .filter((l) => l.trimStart().startsWith(">"))
      .map((l) => l.replace(/^\s*>\s?/, "").trim())
      .join(" ");
    segmen[nomor] = normalize(teks);
  }
  return segmen;
}

if (!existsSync(join(dir, "naskah.md")) || !existsSync(join(dir, "visual-map.json"))) {
  console.error(`✗ ${basename(dir)}: naskah.md atau visual-map.json tidak ada`);
  process.exit(1);
}

const narasi = bacaNarasi(readFileSync(join(dir, "naskah.md"), "utf8"));
const peta = JSON.parse(readFileSync(join(dir, "visual-map.json"), "utf8"));

const gagal = [];
const peringatan = [];
const idTerpakai = new Set();
let jumlahShot = 0;
const entitas = [];

for (const seg of peta.segmen ?? []) {
  const nomor = Number(String(seg.id).replace(/\D/g, ""));
  const badan = narasi[nomor];
  if (!badan) {
    gagal.push(`${seg.id}: segmen tidak ditemukan di naskah.md`);
    continue;
  }
  for (const shot of seg.shots ?? []) {
    jumlahShot += 1;
    if (idTerpakai.has(shot.id)) gagal.push(`${shot.id}: id shot ganda`);
    idTerpakai.add(shot.id);

    if (!normalize(shot.pemicu ?? "")) {
      gagal.push(`${shot.id}: tidak punya pemicu`);
    } else if (!badan.includes(normalize(shot.pemicu))) {
      gagal.push(`${shot.id}: pemicu "${shot.pemicu}" tidak ada di narasi ${seg.id}`);
    }

    const offset = Number(shot.offset_frame);
    if (!Number.isFinite(offset) || offset < 2 || offset > 8) {
      gagal.push(`${shot.id}: offset_frame ${shot.offset_frame} di luar 2–8 frame`);
    }

    if (shot.entitas) entitas.push({ id: shot.id, segmen: seg.id, teks: shot.entitas });
  }
}

// Entitas: tepat 3 kemunculan.
if (entitas.length !== 3) {
  gagal.push(`entitas muncul ${entitas.length} kali, seharusnya 3`);
}
const urutan = entitas.map((e) => e.teks.toLowerCase());
const pola = [/siluet|jauh/, /setengah|balik/, /seluruh|utuh/];
pola.forEach((re, i) => {
  if (urutan[i] && !re.test(urutan[i])) {
    peringatan.push(
      `kemunculan entitas ke-${i + 1} (${entitas[i].id}) tidak cocok pola "siluet → setengah → seluruh"`
    );
  }
});

// Atmosphere: minimal satu segmen terang.
const terang = peta.qc_khusus_episode?.wajib_terang ?? [];
if (terang.length === 0) gagal.push("tidak ada segmen terang (qc_khusus_episode.wajib_terang kosong)");

console.log(`peta visual : ${basename(dir)}`);
console.log(`segmen      : ${peta.segmen?.length ?? 0}`);
console.log(`shot        : ${jumlahShot}`);
console.log(`entitas     : ${entitas.length} → ${entitas.map((e) => e.id).join(", ")}`);
console.log(`segmen terang: ${terang.join(", ") || "-"}`);

for (const p of peringatan) console.log(`! ${p}`);
for (const g of gagal) console.log(`✗ ${g}`);

const jumlahPeringatan = peringatan.length;
const ok = gagal.length === 0 && (!strict || jumlahPeringatan === 0);
console.log(ok ? "\n✓ pemicu visual semua terikat ke narasi" : `\n✗ ${gagal.length} masalah, ${jumlahPeringatan} peringatan`);
process.exit(ok ? 0 : 1);
