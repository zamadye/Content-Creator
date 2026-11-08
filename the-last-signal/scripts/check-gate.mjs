#!/usr/bin/env node
/**
 * check-gate.mjs — Gerbang A dijalankan mesin.
 *
 * Kenapa ada: `knowledge/NASKAH.md` §Hukum lapisan (8 Nov 2026) menetapkan enam
 * hal yang membuat orang memutar ulang — peta petunjuk, uji dua bacaan, tiga
 * loop, dua reda, loop mulus, satu unsur yang tidak dijawab. Dokumen yang tidak
 * diperiksa mesin selalu kalah pada episode ke-15 (lihat ATURAN Bagian X: 4
 * butir masih "belum"). Skrip ini menutup celah itu untuk cerita yang **belum
 * tayang**; episode yang sudah terbit dilewati supaya gerbang tidak menghukum
 * karya lama.
 *
 *   node scripts/check-gate.mjs
 *   node scripts/check-gate.mjs --episode LS-0016
 *   node scripts/check-gate.mjs --json
 *
 * Berkas yang dibaca: stories/slate.json (sumber naskah Short).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const asJson = process.argv.includes("--json");
const only = arg("episode");

const slate = JSON.parse(readFileSync(join(ROOT, "stories", "slate.json"), "utf8"));
const episodes = slate.episodes ?? slate;

/** Episode yang sudah tayang tidak dinilai ulang. */
const published = new Set();
const registry = join(ROOT, "knowledge", "episodes.jsonl");
if (existsSync(registry)) {
  for (const line of readFileSync(registry, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.publish?.ok || entry.status === "published") published.add(entry.episodeId);
    } catch {
      /* baris rusak bukan urusan gerbang */
    }
  }
}

const words = (text) => String(text ?? "").trim().split(/\s+/).filter(Boolean);
const firstSentence = (text) => (String(text ?? "").split(/(?<=[.!?])\s+/)[0] ?? "").trim();
const STOP = new Set([
  "yang", "untuk", "dengan", "dalam", "dari", "pada", "akan", "tidak", "sudah", "saya", "kamu",
  "itu", "ini", "dan", "atau", "karena", "kalau", "saat", "setelah", "lebih", "bisa", "ada",
  "juga", "mereka", "dia", "kami", "kita", "tapi", "tetapi", "hanya", "masih", "semua", "atas",
  "bukan", "belum", "punya", "banyak", "sama", "harus", "seperti", "supaya", "malah", "justru",
  "satu", "dua", "tiga", "empat", "saya", "sendiri", "masuk", "orang", "sudah",
]);
const contentWords = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));

const problems = [];
const results = [];

for (const entry of episodes) {
  const id = entry.episodeId;
  if (!id) continue;
  if (only && id !== only) continue;
  // Episode yang sudah dirender/diterbitkan tidak boleh dihukum oleh hukum baru:
  // asetnya sudah ada, dan mengubah naskah berarti membuang hasil produksi.
  const sudahDirender =
    existsSync(join(ROOT, "releases", `${id}.mp4`)) ||
    existsSync(join(ROOT, "projects", "episodes", id, "reports", "render.json"));
  if (published.has(id) || sudahDirender) {
    results.push({ id, skipped: published.has(id) ? "sudah tayang" : "sudah dirender" });
    continue;
  }

  const fail = (message) => problems.push(`${id}: ${message}`);
  const before = problems.length;
  const scenes = entry.scenes ?? [];
  const story = entry.story ?? {};

  if (!scenes.length) {
    fail("tidak ada scene — cerita belum ditulis");
    results.push({ id, ok: false, problems: problems.slice(before) });
    continue;
  }

  // ── 0. Struktur dasar ────────────────────────────────────────────────
  const first = firstSentence(scenes[0].narration);
  const last = String(scenes.at(-1)?.narration ?? "");
  const hookWords = words(first);
  if (hookWords.length > 13) fail(`kalimat pertama ${hookWords.length} kata (maks 13 untuk format klimaks-di-depan)`);

  const totalWords = scenes.reduce((sum, s) => sum + words(s.narration).length, 0);
  if (totalWords < 70) fail(`naskah hanya ${totalWords} kata — terlalu tipis untuk 3 loop`);
  if (totalWords > 140) fail(`naskah ${totalWords} kata — terlalu panjang, durasi akan melewati 60 s`);

  // ── 1. Peta petunjuk: 3 jenis, masing-masing punya detik bayar ───────
  const clues = Array.isArray(entry.clues) ? entry.clues : [];
  const kinds = new Set(clues.map((c) => String(c.kind ?? "").toLowerCase()));
  for (const kind of ["visual", "audio", "teks"]) {
    if (!kinds.has(kind)) fail(`peta petunjuk tidak punya petunjuk ${kind}`);
  }
  if (clues.length < 3) fail(`peta petunjuk hanya ${clues.length} butir (wajib 3: visual, audio, teks)`);
  for (const [index, clue] of clues.entries()) {
    if (String(clue.kind).toLowerCase() === "teks") continue; // petunjuk teks hidup di deskripsi
    if (typeof clue.atSeconds !== "number") fail(`petunjuk #${index + 1} (${clue.kind}) tanpa atSeconds`);
    if (typeof clue.paidAtSeconds !== "number") fail(`petunjuk #${index + 1} (${clue.kind}) tanpa paidAtSeconds — itu hiasan, bukan petunjuk`);
    if (clue.paidAtSeconds !== undefined && clue.atSeconds !== undefined && clue.paidAtSeconds <= clue.atSeconds) {
      fail(`petunjuk #${index + 1} dibayar sebelum muncul`);
    }
    if (!String(clue.detail ?? "").trim()) fail(`petunjuk #${index + 1} tanpa detail`);
  }

  // ── 2. Uji dua bacaan ────────────────────────────────────────────────
  const dual = story.dualReading ?? {};
  const artiA = String(dual.a ?? "").trim();
  const artiB = String(dual.b ?? "").trim();
  if (!artiA || !artiB) fail("dualReading belum lengkap — tulis arti A (sebelum twist) dan arti B (sesudah)");
  else if (artiA.toLowerCase() === artiB.toLowerCase()) fail("arti A dan arti B sama — twist tidak mengubah makna");

  // ── 3. Tiga loop ─────────────────────────────────────────────────────
  const loops = story.loops ?? {};
  for (const key of ["l1", "l2", "l3"]) {
    if (!String(loops[key] ?? "").trim()) fail(`loop ${key.toUpperCase()} kosong — wajib L1 ditutup, L2 ke CTA, L3 dibiarkan terbuka`);
  }
  if (loops.l1 && loops.l3 && String(loops.l1).trim().toLowerCase() === String(loops.l3).trim().toLowerCase()) {
    fail("L1 dan L3 memakai benda yang sama — L3 harus lapisan lain");
  }

  // ── 4. Dua reda ──────────────────────────────────────────────────────
  const releases = Array.isArray(entry.releases) ? entry.releases : [];
  if (releases.length < 2) fail(`titik reda hanya ${releases.length} (wajib 2: sekitar 35% dan 70%)`);
  for (const [index, r] of releases.entries()) {
    if (typeof r.atRatio !== "number" || r.atRatio <= 0 || r.atRatio >= 1) fail(`reda #${index + 1} tanpa atRatio 0–1`);
    if (typeof r.seconds !== "number" || r.seconds < 0.6 || r.seconds > 1.2) {
      fail(`reda #${index + 1} ${r.seconds ?? "?"} s (harus 0,6–1,2 s)`);
    }
  }

  // ── 5. Loop mulus + CTA ──────────────────────────────────────────────
  const closing = new Set(contentWords(last));
  const shared = contentWords(first).filter((w) => closing.has(w));
  if (shared.length === 0) fail("kalimat terakhir tidak menyambung ke kalimat pertama — loop akan terasa mengulang");
  if (!last.includes("?") || !/\b(kamu|kalian|anda)\b/i.test(last)) {
    fail("penutup belum berupa pertanyaan ke penonton (loop L2 memindahkan penasaran ke komentar)");
  }

  // ── 6. Satu unsur tidak dijawab ──────────────────────────────────────
  const unexplained = String(entry.unexplained ?? "").trim();
  if (!unexplained) fail("unexplained kosong — tanpa satu unsur terbuka, tidak ada alasan menonton ulang");

  // ── 7. Beat 8–12 kata ────────────────────────────────────────────────
  const lengths = scenes.map((s) => words(s.narration).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (avg < 8 || avg > 12) fail(`rata-rata ${avg.toFixed(1)} kata per beat (target 8–12)`);
  for (const [index, n] of lengths.entries()) {
    if (n > 15) fail(`scene ${index + 1}: ${n} kata — pecah jadi dua beat`);
  }

  results.push({ id, ok: problems.length === before, problems: problems.slice(before), avgWords: Number(avg.toFixed(1)), totalWords });
}

if (asJson) {
  console.log(JSON.stringify({ results }, null, 2));
} else {
  console.log("Gerbang A — hukum lapisan (NASKAH.md, 8 Nov 2026)\n");
  for (const r of results) {
    if (r.skipped) {
      console.log(`  · ${r.id}: dilewati (${r.skipped})`);
      continue;
    }
    if (r.ok) {
      console.log(`  ✔ ${r.id}: lolos — ${r.totalWords} kata, rata-rata ${r.avgWords}/beat`);
    } else {
      console.log(`  ✖ ${r.id}:`);
      for (const p of r.problems) console.log(`      - ${p.replace(`${r.id}: `, "")}`);
    }
  }
  const failed = results.filter((r) => r.ok === false).length;
  console.log(failed ? `\n✖ ${failed} episode gagal gerbang` : "\n✔ semua episode lolos gerbang");
}

process.exit(results.some((r) => r.ok === false) ? 1 : 0);
