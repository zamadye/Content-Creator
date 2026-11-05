#!/usr/bin/env node
/**
 * check-copy.mjs — penjaga hukum penulisan (knowledge/copywriting.md).
 *
 * Yang diperiksa hanya hal yang bisa dinilai tanpa selera:
 *   1. kalimat pertama tidak boleh dibuka dengan kata yang sudah dipakai
 *      episode lain ("Bayangkan" tidak boleh jadi pembuka semua cerita),
 *   2. tidak ada kalimat lebih dari 24 kata,
 *   3. kalimat pertama memuat angka atau konsekuensi konkret (peringatan),
 *   4. headline thumbnail ≤ 42 karakter dan minimal dua kata,
 *   5. metadata (judul, deskripsi, komentar pertama) tidak boleh dicetak dari
 *      satu templat — lihat catatan di bawah.
 *
 *   node scripts/check-copy.mjs
 *   node scripts/check-copy.mjs --strict   # peringatan dihitung sebagai gagal
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

// "Bayangkan", "pernahkah", "bagaimana kalau" TIDAK dilarang: arahan pemilik
// kanal justru meminta cerita terasa seperti mengobrol dengan penonton. Yang
// dilarang adalah kata pembuka cerita dongeng, dan pemakaian pembuka yang sama
// di dua episode.
const BANNED_OPENERS = ["pada suatu", "di sebuah", "alkisah", "konon"];
const DIRECT_ADDRESS = /\b(kamu|kau|anda|kalian)\b/i;
const CTA_WORDS = /(subscribe|subcribe|like|komentar|comment|follow|ikuti)/i;
const SECOND_PERSON_QUESTIONS = /(pernahkah|pernah|bagaimana|apa yang|apakah|bayangkan|kalau kamu|kalau kau|sudahkah)/i;
const CONCRETE = /\d|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|dua belas|puluhan|ratus|jam|pukul|malam/i;

// Kata tugas dipakai apa adanya saat menghitung "bentuk" judul; kata isi
// diganti "•". Dua judul dengan bentuk sama = satu templat yang diisi ulang.
const FUNCTION_WORDS = new Set([
  "itu", "yang", "ini", "di", "ke", "dan", "dengan", "masih", "tidak", "pernah", "kamu", "kau",
  "ada", "punya", "dari", "dalam", "pada", "akan", "sudah", "tapi", "atau", "tiap", "setiap",
  "pukul", "jam", "malam", "hari", "lalu", "nya", "si", "sang", "para", "satu", "cuma", "hanya",
]);

/** Bentuk judul: tiga kata pertama, kata isi dijadikan "•". */
const titleShape = (title) =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => (/^[\d.,:]+$/.test(word) ? word : FUNCTION_WORDS.has(word) ? word : "•"))
    .join(" ");

const firstTwo = (title) => title.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
const firstLineOf = (text) => String(text ?? "").split(/\n/)[0].trim();

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
const metadata = [];
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
  // Episode panjang dinarasikan seperti orang bercerita, bukan seperti Shorts
  // yang harus memancing di kalimat pertama. Aturannya diganti, bukan dimatikan:
  // kalimat boleh lebih panjang (satu napas orang berbicara ≈ 40 kata), pembuka
  // boleh diegetik, tapi run-on tetap ditangkap.
  const longform = episode.format === "longform_narration";
  const maxSentenceWords = longform ? 40 : 24;

  const first = sentenceOf(episode.scenes[0]?.narration ?? "");
  const opener = firstWord(first);

  if (!first) {
    errors.push(`${id}: hook kosong`);
    continue;
  }

  // Semua pembuka dicatat, bukan hanya yang terlarang: yang dinilai adalah
  // kebiasaan mengulang, bukan satu kata tertentu.
  const count = openers.get(opener) ?? [];
  count.push(id);
  openers.set(opener, count);

  if (BANNED_OPENERS.some((banned) => opener === banned.split(" ")[0])) {
    errors.push(`${id}: dibuka dengan "${opener}" — itu pembuka cerita dongeng, bukan hook`);
  }

  // Cerita harus terasa mengobrol dengan penonton, bukan monolog.
  const narration = episode.scenes.map((scene) => scene.narration ?? "").join(" ");
  if (!DIRECT_ADDRESS.test(narration)) {
    errors.push(`${id}: tidak menyapa penonton sama sekali — pakai "kamu", bukan monolog`);
  } else if (!longform && !SECOND_PERSON_QUESTIONS.test(first)) {
    warnings.push(
      `${id}: pembuka belum menyentuh penonton langsung (mis. "pernahkah kamu…", "bayangkan kamu…", "bagaimana kalau…")`,
    );
  }

  // Ajakan bertindak: harus ada, dan harus diucapkan di scene terakhir.
  if (!episode.publishing?.cta) {
    (published.has(id) ? warnings : errors).push(`${id}: tidak punya publishing.cta — penonton tidak pernah diminta subscribe/like/komentar`);
  }
  const last = episode.scenes.at(-1)?.narration ?? "";
  if (!CTA_WORDS.test(last)) {
    (published.has(id) ? warnings : errors).push(`${id}: kalimat terakhir belum berisi ajakan (subscribe/like/komentar)`);
  }

  const maxOpenerWords = longform ? 28 : 20;
  if (wordCount(first) > maxOpenerWords) {
    errors.push(`${id}: kalimat pertama ${wordCount(first)} kata (maks ${maxOpenerWords}) — "${first.slice(0, 60)}…"`);
  }

  if (!CONCRETE.test(first)) {
    warnings.push(`${id}: kalimat pertama tidak memuat angka atau penanda waktu — cek apakah klaimnya cukup konkret`);
  }

  // Semua kalimat, bukan hanya yang pertama.
  episode.scenes.forEach((scene, index) => {
    for (const sentence of (scene.narration ?? "").split(/(?<=[.!?])\s+/).filter(Boolean)) {
      if (wordCount(sentence) > maxSentenceWords) {
        errors.push(
          `${id} scene ${index + 1}: kalimat ${wordCount(sentence)} kata (maks ${maxSentenceWords}) — "${sentence.slice(0, 60)}…"`,
        );
      }
    }
  });

  // ── Metadata ──────────────────────────────────────────────────────────
  // Sembilan unggahan pertama memakai kerangka judul yang sama
  // ("<Benda> Itu <fakta>. <twist>."), membuka deskripsi dengan "ARSIP FIKSI —",
  // dan menyematkan komentar yang identik kata per kata. Isi ceritanya boleh
  // berbeda; yang dilihat penonton (dan sistem yang menilai kanal) adalah
  // sepuluh video yang tampak dicetak dari satu berkas.
  const meta = (id, isPublished, text) => (isPublished ? warnings : errors).push(`${id}: ${text}`);

  const title = episode.publishing?.title ?? "";
  const description = episode.publishing?.description ?? "";
  const pinComment = episode.publishing?.pinComment ?? "";
  const isPublished = published.has(id);

  if (!title.trim()) {
    meta(id, isPublished, "tidak punya publishing.title");
  } else {
    if (title.length > 100) errors.push(`${id}: judul ${title.length} karakter (maks 100)`);
    if (title.includes("\\n")) meta(id, isPublished, "judul memuat \\n harfiah — naskah salah escape");
    if (/^arsip fiksi/i.test(title)) meta(id, isPublished, "judul dibuka dengan label arsip, bukan cerita");
  }

  if (!description.trim()) {
    meta(id, isPublished, "tidak punya publishing.description");
  } else {
    if (description.includes("\\n")) meta(id, isPublished, "deskripsi memuat \\n harfiah — penonton akan melihatnya sebagai teks");
    if (!/fiksi/i.test(description) || !/\bAI\b/i.test(description)) {
      errors.push(`${id}: deskripsi belum mengungkap fiksi + visual AI (kewajiban, bukan selera)`);
    }
    if (/^arsip fiksi\s*[—-]/i.test(firstLineOf(description))) {
      meta(id, isPublished, 'baris pertama deskripsi masih "ARSIP FIKSI —": itu templat, bukan hook');
    }
  }

  if (!pinComment.trim()) {
    meta(id, isPublished, "tidak punya publishing.pinComment — komentar pertama tidak boleh kosong");
  } else {
    if (!pinComment.includes("?")) {
      meta(id, isPublished, "komentar pertama tidak bertanya apa pun — tidak ada alasan untuk dibalas");
    }
    if (/^Fiksi\. Visual dibuat dengan bantuan AI\.\s*Cerita ini bagian dari seri THE LAST SIGNAL\.\s*Kalau kamu pernah mengalami hal serupa/i.test(pinComment)) {
      meta(id, isPublished, "komentar pertama masih templat lama yang dipakai semua episode");
    }
  }

  metadata.push({ id, isPublished, title, firstLine: firstLineOf(description), pinComment });

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

// Metadata yang seragam antar episode. Yang sudah terbit tinggal jadi riwayat;
// yang belum terbit wajib diperbaiki sebelum masuk antrean.
const pendingMeta = metadata.filter((row) => !row.isPublished);
const byKey = (rows, pick) => {
  const map = new Map();
  for (const row of rows) {
    const key = pick(row);
    if (!key) continue;
    map.set(key, [...(map.get(key) ?? []), row.id]);
  }
  return map;
};

const shapeCount = byKey(metadata.filter((row) => row.title.trim()), (row) => titleShape(row.title));
for (const [shape, list] of shapeCount) {
  const pending = list.filter((episodeId) => !published.has(episodeId));
  if (pending.length > 1) {
    errors.push(`bentuk judul "${shape}" dipakai di ${pending.join(", ")} — kerangka judul tidak boleh dipakai ulang selama antrean belum kosong`);
  } else if (list.length > 2) {
    warnings.push(`bentuk judul "${shape}" sudah dipakai ${list.length} episode (${list.join(", ")}): ${shape.includes("itu") ? "pola \"<benda> itu\"" : "pola ini"} sudah terlalu sering — ganti bentuknya`);
  }
}

for (const [pair, list] of byKey(metadata.filter((row) => row.title.trim()), (row) => firstTwo(row.title))) {
  const pending = list.filter((episodeId) => !published.has(episodeId));
  if (pending.length > 1) {
    errors.push(`dua episode belum terbit dibuka dengan kata yang sama di judul ("${pair}"): ${pending.join(", ")}`);
  }
}

const lineCount = byKey(metadata.filter((row) => row.firstLine), (row) => row.firstLine.toLowerCase());
for (const [line, list] of lineCount) {
  const pending = list.filter((episodeId) => !published.has(episodeId));
  if (pending.length > 1 || (pending.length === 1 && list.length > 1)) {
    errors.push(`baris pertama deskripsi dipakai di ${list.join(", ")} — baris itu milik episode sendiri, bukan kepala surat: "${line.slice(0, 50)}"`);
  }
}

const pinCount = byKey(metadata.filter((row) => row.pinComment.trim()), (row) => row.pinComment.trim());
for (const [, list] of pinCount) {
  const pending = list.filter((episodeId) => !published.has(episodeId));
  if (pending.length > 1 || (pending.length === 1 && list.length > 1)) {
    errors.push(`komentar pertama identik di ${list.join(", ")} — tulis ulang untuk episode yang belum terbit`);
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
