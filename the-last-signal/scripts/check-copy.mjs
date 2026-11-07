#!/usr/bin/env node
/**
 * check-copy.mjs — penjaga hukum penulisan (knowledge/ATURAN.md bagian II & VI).
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
// Dua sumber status terbit: berkas antrean bertanda "published" (episode
// terbaru) dan registry knowledge/episodes.jsonl (arsip — berkas antreannya
// sudah dibersihkan setelah tayang). Tanpa sumber kedua, episode lama yang
// sudah live ditagih aturan naskah baru dan pemeriksa gagal selamanya.
const registryPath = join(ROOT, "knowledge", "episodes.jsonl");
if (existsSync(registryPath)) {
  for (const line of readFileSync(registryPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.publish?.ok) published.add(entry.episodeId);
    } catch {
      /* satu baris rusak tidak boleh mematikan pemeriksa */
    }
  }
}
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

  // Retensi Short: penonton berhenti saat penjelasan masih berjalan, bukan saat
  // cerita berbelok. LS-0009 (487 tayangan, 40,81% tetap menonton) ditonton
  // rata-rata 17 detik dari 58 detik — dan belokan pertamanya baru datang di
  // detik 15,5, setelah dua scene menjelaskan cara kerja log router. Aturannya:
  // cerita berbelok sebelum detik 11, paling lambat 13.
  if (!longform) {
    const fps = episode.targetFps || 30;
    const scenes = episode.scenes ?? [];
    let elapsedFrames = 0;
    let turnAt = null;
    for (let index = 0; index < scenes.length; index += 1) {
      if (index === 2) {
        turnAt = elapsedFrames / fps;
        break;
      }
      elapsedFrames += scenes[index].durationFrames ?? 0;
    }
    // Episode yang sudah dirender tidak bisa diperbaiki tanpa membuang hasil
    // produksi: temuan untuk mereka selalu peringatan, bukan kegagalan.
    const sudahDirender =
      existsSync(join(ROOT, "releases", `${id}.mp4`)) ||
      existsSync(join(ROOT, "projects", "episodes", id, "reports", "render.json"));
    if (turnAt !== null) {
      const report = published.has(id) || sudahDirender ? warnings : errors;
      if (turnAt > 13) {
        report.push(
          `${id}: belokan cerita baru di detik ${turnAt.toFixed(1)} — penonton Short berhenti sekitar detik 10–17; rapatkan scene pembuka supaya belokan datang sebelum detik 11`,
        );
      } else if (turnAt > 11) {
        warnings.push(`${id}: belokan cerita di detik ${turnAt.toFixed(1)} — masih boleh, tapi tipis`);
      }
    }

    // Ajakan di akhir harus berupa pertanyaan yang ditujukan ke penonton.
    const closing = scenes.at(-1)?.narration ?? "";
    if (!/[?]/.test(closing) || !/\b(kamu|kalian|anda)\b/i.test(closing)) {
      warnings.push(
        `${id}: penutup belum bertanya ke penonton — akhiri dengan pertanyaan yang bisa dijawab di komentar (mis. "pernah cek daftar perangkat asing di Wi-Fi kosmu?")`,
      );
    }
  }

  // ── Hook: buka satu lubang, jangan jelaskan apa pun (ATURAN 2.3) ──────
  // Arahan pemilik kanal 7 Nov 2026: hook LL-0002 dinilai kurang kuat.
  // "Kurang dua belas meter." lolos, tapi kalimat keduanya — "Itu selisih
  // antara angka di kertas dan angka di tanah." — adalah DEFINISI. Lubangnya
  // ditutup sebelum penonton sempat masuk.
  const maxOpenerWords = longform ? 12 : 9;
  if (wordCount(first) > maxOpenerWords) {
    (published.has(id) ? warnings : errors).push(
      `${id}: kalimat pertama ${wordCount(first)} kata (maks ${maxOpenerWords}) — hook harus satu tarikan napas: "${first.slice(0, 60)}…"`,
    );
  }

  if (!CONCRETE.test(first)) {
    (published.has(id) ? warnings : errors).push(
      `${id}: kalimat pertama tanpa angka/penanda waktu — klaim tanpa ukuran terdengar seperti ringkasan, bukan kejadian`,
    );
  }

  const EXPLANATORY = /^(itu|ini|hal itu|selisih|perbedaan|masalahnya|sebenarnya|singkatnya|intinya)\b/i;
  if (EXPLANATORY.test(first)) {
    (published.has(id) ? warnings : errors).push(
      `${id}: kalimat pertama dibuka dengan "${first.split(/\s+/)[0]}" — itu penjelas, bukan pukulan; pindahkan kejanggalannya ke depan`,
    );
  }

  // Kejanggalan harus terdengar sebelum detik ±8 (tiga kalimat pertama).
  const opening = (episode.scenes[0]?.narration ?? "")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
  const WRONGNESS =
    /\b(tidak (bisa|boleh|mau|pernah|ada)|selalu|lagi|lagi-lagi|setiap kali|tiap kali|dua kali|tiga kali|empat kali|berulang|tetap|tidak berubah|sama saja|hilang|kosong)\b/i;
  if (!WRONGNESS.test(opening)) {
    (published.has(id) ? warnings : errors).push(
      `${id}: tiga kalimat pertama tanpa kejanggalan (mis. "tidak bisa", "selalu", "hilang") — penonton belum punya alasan bertahan sebelum detik 8`,
    );
  }

  // ── Telinga: satu gagasan per kalimat (NASKAH 4.x) ────────────────────
  // Naskah ini didengar sekali. Kalimat yang butuh dua koma untuk benar
  // terlalu panjang untuk telinga, walaupun masih di bawah batas kata.
  const sentenceLengths = [];
  episode.scenes.forEach((scene, index) => {
    for (const sentence of (scene.narration ?? "").split(/(?<=[.!?])\s+/).filter(Boolean)) {
      const words = wordCount(sentence);
      sentenceLengths.push(words);
      if (words > maxSentenceWords) {
        errors.push(
          `${id} scene ${index + 1}: kalimat ${words} kata (maks ${maxSentenceWords}) — "${sentence.slice(0, 60)}…"`,
        );
      }
      const commas = (sentence.match(/,/g) ?? []).length;
      if (commas >= 3) {
        warnings.push(
          `${id} scene ${index + 1}: ${commas} koma dalam satu kalimat — pecah jadi dua; telinga tidak bisa mengulang`,
        );
      }
    }
  });

  if (sentenceLengths.length > 8) {
    const average = sentenceLengths.reduce((sum, n) => sum + n, 0) / sentenceLengths.length;
    if (average > 20) {
      warnings.push(
        `${id}: rata-rata ${average.toFixed(1)} kata per kalimat (target ≤ 20) — pembaca akan kehabisan napas sebelum ceritanya selesai`,
      );
    }
    const spread = Math.max(...sentenceLengths) - Math.min(...sentenceLengths);
    if (spread < 8) {
      warnings.push(`${id}: panjang kalimat nyaris seragam (selisih ${spread} kata) — ritme monoton, variasikan`);
    }
  }

  // ── Twist: adil berarti bahannya sudah ada (NASKAH 3.2, 3.3) ──────────
  // Twist yang bahannya baru muncul di detik pengungkapan bukan kejutan,
  // itu kecurangan. Uji kasar: kata isi dari `story.twist` harus sudah
  // terdengar di narasi SEBELUM scene terakhir.
  const STOP = new Set([
    "yang", "untuk", "dengan", "dalam", "dari", "pada", "akan", "tidak", "sudah", "saya", "kamu",
    "itu", "ini", "dan", "atau", "karena", "kalau", "saat", "setelah", "lebih", "bisa", "ada",
    "juga", "mereka", "dia", "kami", "kita", "tapi", "tetapi", "hanya", "masih", "semua", "atas",
    "bukan", "belum", "punya", "banyak", "sama", "harus", "seperti", "supaya", "malah", "justru",
  ]);
  const contentWords = (text) =>
    String(text ?? "")
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !STOP.has(word));

  const twistWords = contentWords(episode.story?.twist).filter((word, index, all) => all.indexOf(word) === index);
  if (twistWords.length >= 3) {
    const beforeLast = episode.scenes
      .slice(0, -1)
      .map((scene) => (scene.narration ?? "").toLowerCase())
      .join(" ");
    const planted = twistWords.filter((word) => beforeLast.includes(word));
    if (planted.length < 2) {
      (published.has(id) ? warnings : errors).push(
        `${id}: twist hanya punya ${planted.length} kata kunci yang sudah terdengar sebelum scene terakhir — bahan twist harus ditanam lebih awal (2–3 petunjuk berbeda bentuk)`,
      );
    }
  }

  // Lubang yang dibuka di hook harus ditutup di kalimat terakhir.
  const hookWords = contentWords(episode.story?.hook);
  if (hookWords.length > 0) {
    const closing = (episode.scenes.at(-1)?.narration ?? "").toLowerCase();
    const closingWords = new Set(contentWords(closing));
    const hooked = hookWords.filter((word) => closingWords.has(word)).length;
    if (hooked === 0) {
      warnings.push(
        `${id}: kalimat terakhir tidak menyentuh satu kata pun dari hook — lubang yang dibuka di awal tidak pernah ditutup`,
      );
    }
  }

  // ── Metadata ──────────────────────────────────────────────────────────
  // Sembilan unggahan pertama memakai kerangka judul yang sama
  // ("<Benda> Itu <fakta>. <twist>."), membuka deskripsi dengan "ARSIP FIKSI —",
  // dan menyematkan komentar yang identik kata per kata. Isi ceritanya boleh
  // berbeda; yang dilihat penonton (dan sistem yang menilai kanal) adalah
  // sepuluh video yang tampak dicetak dari satu berkas.
  const meta = (id, isPublished, text) => (isPublished ? warnings : errors).push(`${id}: ${text}`);

  /**
   * Arahan pemilik kanal 2026-11-06: "ARSIP FIKSI" dan pernyataan sejenis tidak
   * boleh ada lagi di judul, deskripsi, maupun komentar. Alasannya bukan selera:
   * kalimat semacam itu memakan 12 karakter pertama judul (bagian yang paling
   * berbobot untuk pencarian) dan mengganti hook dengan pengumuman.
   *
   * Label AI di platform juga tidak dicentang (arahan 2026-11-06): video disusun
   * per scene lewat kode, bukan hasil generate video otomatis. Yang tersisa
   * hanyalah larangan ini — tidak ada label di frame, judul, deskripsi, komentar.
   */
  const BANNED_COPY = /arsip fiksi|dibuat dengan bantuan ai|seluruh kejadian[^.]*fiksi|adalah fiksi/i;

  const title = episode.publishing?.title ?? "";
  const description = episode.publishing?.description ?? "";
  const pinComment = episode.publishing?.pinComment ?? "";
  const isPublished = published.has(id);

  if (!title.trim()) {
    meta(id, isPublished, "tidak punya publishing.title");
  } else {
    if (title.length > 100) errors.push(`${id}: judul ${title.length} karakter (maks 100)`);
    if (title.includes("\\n")) meta(id, isPublished, "judul memuat \\n harfiah — naskah salah escape");
    if (BANNED_COPY.test(title)) {
      errors.push(`${id}: judul memuat label arsip/pengungkapan — dilarang (arahan pemilik kanal 2026-11-06)`);
    }
  }

  if (!description.trim()) {
    meta(id, isPublished, "tidak punya publishing.description");
  } else {
    if (description.includes("\\n")) meta(id, isPublished, "deskripsi memuat \\n harfiah — penonton akan melihatnya sebagai teks");
    if (BANNED_COPY.test(description)) {
      errors.push(`${id}: deskripsi memuat label arsip atau kalimat pengungkapan — dilarang (arahan 2026-11-06)`);
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
    if (BANNED_COPY.test(pinComment)) {
      errors.push(`${id}: komentar pertama memuat label arsip/pengungkapan — dilarang (arahan 2026-11-06)`);
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
