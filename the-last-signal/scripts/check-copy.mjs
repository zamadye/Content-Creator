#!/usr/bin/env node
/**
 * check-copy.mjs — penjaga hukum penulisan (knowledge/copywriting.md).
 *
 * Yang diperiksa hanya hal yang bisa dinilai tanpa selera:
 *   1. kalimat pertama tidak boleh dibuka dengan kata yang sudah dipakai
 *      episode lain ("Bayangkan" tidak boleh jadi pembuka semua cerita),
 *   2. tidak ada kalimat lebih dari 24 kata,
 *   3. kalimat pertama memuat angka atau konsekuensi konkret (peringatan),
 *   4. headline thumbnail ≤ 42 karakter dan minimal dua kata.
 *
 *   node scripts/check-copy.mjs
 *   node scripts/check-copy.mjs --strict   # peringatan dihitung sebagai gagal
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const BANNED_OPENERS = ["bayangkan", "rasakan", "pada suatu", "di sebuah", "alkisah", "konon"];
const CONCRETE = /\d|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|dua belas|puluhan|ratus|jam|pukul|malam/i;

const errors = [];
const warnings = [];

const sentenceOf = (text) => text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const firstWord = (text) => (text.trim().split(/\s+/)[0] ?? "").toLowerCase().replace(/[^\p{L}]/gu, "");

const episodesDir = join(ROOT, "projects", "episodes");
const ids = existsSync(episodesDir)
  ? readdirSync(episodesDir).filter((id) => existsSync(join(episodesDir, id, "episode.json")))
  : [];

const openers = new Map();
const published = new Set();
const queueDir = join(ROOT, "publish-queue");
if (existsSync(queueDir)) {
  for (const file of readdirSync(queueDir).filter((f) => f.endsWith(".json"))) {
    try {
      const entry = JSON.parse(readFileSync(join(queueDir, file), "utf8"));
      if (entry.status === "published") published.add(entry.episodeId ?? file.replace(/\.json$/, ""));
    } catch {
      /* berkas antrean rusak bukan urusan pemeriksa naskah */
    }
  }
}

for (const id of ids) {
  const episode = JSON.parse(readFileSync(join(episodesDir, id, "episode.json"), "utf8"));
  const first = sentenceOf(episode.scenes[0]?.narration ?? "");
  const opener = firstWord(first);

  if (!first) {
    errors.push(`${id}: hook kosong`);
    continue;
  }

  if (BANNED_OPENERS.some((banned) => opener.startsWith(banned.split(" ")[0]))) {
    const count = openers.get(opener) ?? [];
    count.push(id);
    openers.set(opener, count);
  }

  if (wordCount(first) > 20) {
    errors.push(`${id}: kalimat pertama ${wordCount(first)} kata (maks 20) — "${first.slice(0, 60)}…"`);
  }

  if (!CONCRETE.test(first)) {
    warnings.push(`${id}: kalimat pertama tidak memuat angka atau penanda waktu — cek apakah klaimnya cukup konkret`);
  }

  // Semua kalimat, bukan hanya yang pertama.
  episode.scenes.forEach((scene, index) => {
    for (const sentence of (scene.narration ?? "").split(/(?<=[.!?])\s+/).filter(Boolean)) {
      if (wordCount(sentence) > 24) {
        errors.push(`${id} scene ${index + 1}: kalimat ${wordCount(sentence)} kata (maks 24) — "${sentence.slice(0, 60)}…"`);
      }
    }
  });

  const thumb = episode.publishing?.thumbnail;
  if (!thumb) {
    warnings.push(`${id}: tidak punya publishing.thumbnail — frame 0 tidak akan jadi thumbnail yang terbaca`);
  } else {
    if (thumb.headline.length > 42) {
      errors.push(`${id}: headline thumbnail ${thumb.headline.length} karakter (maks 42)`);
    }
    if (wordCount(thumb.headline) < 2) {
      errors.push(`${id}: headline thumbnail minimal dua kata`);
    }
  }
}

for (const [opener, list] of openers) {
  if (list.length < 2) continue;
  // Episode yang sudah tayang tidak bisa diubah lagi: catat sebagai riwayat,
  // bukan pelanggaran. Yang masih bisa dicegah adalah kebiasaan yang berulang
  // pada episode yang belum terbit.
  const pending = list.filter((id) => !published.has(id));
  if (pending.length > 1 || (pending.length === 1 && list.length > 2)) {
    errors.push(`pembuka "${opener}" dipakai di ${list.length} episode (${list.join(", ")}) — hook tidak boleh seragam`);
  } else {
    warnings.push(`pembuka "${opener}" pernah dipakai ${list.join(", ")} — jangan diulang lagi`);
  }
}

const report = (label, items) => {
  if (items.length === 0) return;
  console.log(`\n${label} (${items.length}):`);
  for (const item of items) console.log(`  - ${item}`);
};

console.log(`\nPeriksa naskah: ${ids.length} episode`);
report("✖ GAGAL", errors);
report("⚠ PERINGATAN", warnings);

if (errors.length === 0 && (!strict || warnings.length === 0)) {
  console.log("\n✔ naskah lolos hukum penulisan\n");
  process.exit(0);
}

console.log("");
process.exit(1);
