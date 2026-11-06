#!/usr/bin/env node
/**
 * plan-audio.mjs — pasang bed dan efek suara sesuai isi cerita.
 *
 * Arahan pemilik kanal (2026-11-06): horor tidak boleh hanya bergantung pada
 * gambar dan narasi. Setiap episode harus punya musik latar, dan efek yang
 * mengikuti apa yang sedang diceritakan — pintu, petir, tawa, bisikan, dan
 * seterusnya.
 *
 * Skrip ini membaca narasi tiap scene, mencocokkannya dengan tag di
 * assets/audio/horror/manifest.json, lalu:
 *   1. memilih satu bed musik untuk episode (yang paling sering disebut),
 *   2. menaruh satu efek per scene pada kata yang memicunya,
 *   3. menyalin berkas yang dipakai ke folder episode (publicDir renderer
 *      adalah folder episode, jadi staticFile() hanya bisa membaca dari sana),
 *   4. menulis scene.audio + audio.horrorPlan ke episode.json.
 *
 *   node scripts/plan-audio.mjs --episode LS-0010 --dry-run
 *   node scripts/plan-audio.mjs --episode LS-0010
 *   node scripts/plan-audio.mjs --episode LS-0010 --bed bed_music_box
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

/**
 * Peta pemicu. Kiri: pola pada narasi (bahasa Indonesia, huruf kecil).
 * Kanan: aset + seberapa keras + catatan kapan dipakai.
 *
 * Aturannya: satu pemicu, satu efek. Kalau satu scene menyebut hujan dan petir,
 * petir yang menang — ia lebih dramatis dan lebih pendek.
 */
const TRIGGERS = [
  { regex: /petir|guntur|kilat|geledek/, asset: "sfx_petir", volume: 0.55, weight: 10 },
  { regex: /hujan|gerimis|basah|tiris/, asset: "sfx_hujan", volume: 0.4, weight: 8 },
  { regex: /tawa|cekikikan|tertawa|gelak|kekeh/, asset: "sfx_tawa_cekikikan", volume: 0.45, weight: 10 },
  { regex: /bisik|berbisik|membisikkan|namamu disebut|memanggil namamu/, asset: "sfx_bisikan", volume: 0.5, weight: 9 },
  { regex: /pintu|lemari|gerbang|pagar/, asset: "sfx_pintu_terbuka", volume: 0.45, weight: 8 },
  { regex: /dibanting|membanting|tertutup keras|menghentak/, asset: "sfx_pintu_dibanting", volume: 0.6, weight: 9 },
  { regex: /ketuk|mengetuk|tok tok|mengetok/, asset: "sfx_ketukan", volume: 0.5, weight: 9 },
  { regex: /radio|siaran|frekuensi|kanal|pemancar|gelombang/, asset: "sfx_radio_statis", volume: 0.45, weight: 7 },
  { regex: /telepon|dering|berdering|menelepon/, asset: "sfx_telepon_lama", volume: 0.5, weight: 9 },
  { regex: /langkah|kaki|melangkah|berjalan/, asset: "sfx_langkah_kayu", volume: 0.45, weight: 8 },
  { regex: /jam|pukul|detik|tengah malam|tiga lewat/, asset: "sfx_jam_berdetak", volume: 0.35, weight: 5 },
  { regex: /tetes|menetes|bocor|rembes|air/, asset: "sfx_tetes_air", volume: 0.4, weight: 6 },
  { regex: /angin|berangin|jendela|terbuka/, asset: "sfx_angin", volume: 0.4, weight: 6 },
  { regex: /napas|bernafas|menghela|terengah/, asset: "sfx_nafas_berat", volume: 0.45, weight: 7 },
  { regex: /anak|bocah|kecil|senandung|menyanyi/, asset: "sfx_anak_bersenandung", volume: 0.4, weight: 7 },
  { regex: /logam|besi|rantai|pipa|pagar besi/, asset: "sfx_logam_tergesek", volume: 0.45, weight: 6 },
  { regex: /jantung|dada|berdebar|degup/, asset: "sfx_detak_jantung", volume: 0.45, weight: 7 },
  { regex: /lari|kabur|berlari|dikejar/, asset: "sfx_whoosh", volume: 0.35, weight: 5 },
  { regex: /geram|menggeram|setan|iblis|makhluk|bayangan itu|bukan manusia/, asset: "sfx_geraman_setan", volume: 0.5, weight: 9 },
  { regex: /teriak|berteriak|pekik|menjerit|menjeri/, asset: "sfx_teriakan", volume: 0.5, weight: 9 },
  { regex: /tangis|menangis|tersedu|isak/, asset: "sfx_tangisan", volume: 0.45, weight: 8 },
  { regex: /desah|mendesah|napas di telinga|tepat di belakang/, asset: "sfx_desahan_iblis", volume: 0.45, weight: 8 },
];

/** Bed dipilih dari tema episode, bukan dari satu scene. */
const BED_RULES = [
  { bed: "bed_static_tension", regex: /radio|siaran|frekuensi|kanal|pemancar|rekaman|pita/, note: "cerita siaran/rekaman" },
  { bed: "bed_music_box", regex: /anak|bocah|musik|kotak musik|lemari|senandung|lagu/, note: "cerita anak dan benda tua" },
  { bed: "bed_night_ambience", regex: /malam|kos|kampung|halaman|jalan|luar|pasar/, note: "cerita luar ruang" },
  { bed: "bed_pulse_ritual", regex: /jantung|tubuh|lorong|sumur|tangga|bawah tanah/, note: "cerita ruang dalam" },
  { bed: "bed_strings_swell", regex: /upacara|ritual|kubur|makam|sesajen/, note: "cerita ritual" },
];

const manifest = JSON.parse(readFileSync(join(ROOT, "assets", "audio", "horror", "manifest.json"), "utf8"));
const byName = new Map(manifest.assets.map((entry) => [entry.name, entry]));

const episodeId = arg("episode");
if (!episodeId) {
  console.error("pakai: node scripts/plan-audio.mjs --episode LS-0010 [--dry-run] [--bed nama]");
  process.exit(2);
}

const episodeDir = join(ROOT, "projects", "episodes", episodeId);
const episodePath = join(episodeDir, "episode.json");
if (!existsSync(episodePath)) {
  console.error(`tidak ada ${episodePath}`);
  process.exit(2);
}
const episode = JSON.parse(readFileSync(episodePath, "utf8"));
const longform = /^LL-/.test(episodeId);

// ── 1. Pilih bed ─────────────────────────────────────────────────────────────
const allNarration = episode.scenes.map((scene) => scene.narration ?? "").join(" ").toLowerCase();
let bed = arg("bed");
let bedNote = "dipilih manual";
if (!bed) {
  const scored = BED_RULES.map((rule) => ({
    ...rule,
    hits: (allNarration.match(new RegExp(rule.regex.source, "g")) ?? []).length,
  })).sort((a, b) => b.hits - a.hits);
  const winner = scored[0].hits > 0 ? scored[0] : { bed: longform ? "bed_drone_dread" : "bed_night_ambience", note: "tema umum", hits: 0 };
  bed = winner.bed;
  bedNote = `${winner.note} (${winner.hits} sebutan)`;
}
if (!byName.has(bed)) {
  console.error(`bed tidak ada di manifest: ${bed}`);
  process.exit(2);
}

const bedVolume = longform ? 0.16 : 0.2;
const bedAsset = byName.get(bed);

// ── 2. Efek per scene ────────────────────────────────────────────────────────
const cues = [];
const used = new Set();
for (const [index, scene] of episode.scenes.entries()) {
  const narration = (scene.narration ?? "").toLowerCase();
  if (!narration) continue;

  let best = null;
  for (const trigger of TRIGGERS) {
    const match = narration.match(trigger.regex);
    if (!match) continue;
    const candidate = { ...trigger, sceneIndex: index, word: match[0], at: match.index ?? 0 };
    if (!best || candidate.weight > best.weight) best = candidate;
  }
  if (!best) continue;

  // Efek ditaruh sedikit setelah kalimat pembuka scene, bukan di frame 0:
  // kalau menempel persis di potongan, terdengar seperti klik.
  const lead = Math.min(scene.durationFrames - 20, Math.round(0.35 * FPS + (best.at / Math.max(1, narration.length)) * scene.durationFrames * 0.6));
  const asset = byName.get(best.asset);
  cues.push({
    sceneIndex: index,
    assetId: `audio/horror/${asset.name}.mp3`,
    name: asset.name,
    startFrame: Math.max(6, lead),
    volume: best.volume * (used.has(asset.name) ? 0.75 : 1), // pengulangan dikecilkan
    durationFrames: Math.ceil(asset.durationSeconds * FPS),
    source: best.word,
  });
  used.add(asset.name);
}

// Satu efek per scene, tidak lebih dari satu efek tiap 2,5 detik, dan satu aset
// tidak boleh muncul lebih dari dua kali — pengulangan adalah cara tercepat
// membuat efek terdengar seperti templat.
const MAX_PER_ASSET = 2;
const REPEAT_GAP = Math.round(25 * FPS);
const minGap = Math.round(2.5 * FPS);
const kept = [];
let lastEnd = -Infinity;
const sceneOffsets = [];
let acc = 0;
for (const scene of episode.scenes) {
  sceneOffsets.push(acc);
  acc += scene.durationFrames;
}
const assetUses = new Map();
const assetLast = new Map();
for (const cue of cues.sort((a, b) => a.sceneIndex - b.sceneIndex)) {
  const absolute = sceneOffsets[cue.sceneIndex] + cue.startFrame;
  if (absolute < lastEnd + minGap) continue;
  const uses = assetUses.get(cue.name) ?? 0;
  if (uses >= MAX_PER_ASSET) continue;
  if (absolute - (assetLast.get(cue.name) ?? -Infinity) < REPEAT_GAP) continue;
  assetUses.set(cue.name, uses + 1);
  assetLast.set(cue.name, absolute);
  kept.push(cue);
  lastEnd = absolute + cue.durationFrames * 0.5;
}

// Riser sebelum jumpscare: tanpa itu, pukulan kaget datang dari keheningan dan
// terasa seperti suara yang salah tempel. Risernya berhenti tepat di pukulan.
for (const scare of episode.jumpscares ?? []) {
  const startAbsolute = scare.atFrame - 6 * FPS;
  if (startAbsolute < 0) continue;
  const sceneIndex = sceneOffsets.findLastIndex((offset) => offset <= startAbsolute);
  if (sceneIndex < 0) continue;
  if (assetUses.get("sfx_riser")) continue;
  const asset = byName.get("sfx_riser");
  kept.push({
    sceneIndex,
    assetId: `audio/horror/${asset.name}.mp3`,
    name: asset.name,
    startFrame: startAbsolute - sceneOffsets[sceneIndex],
    volume: 0.34,
    durationFrames: Math.ceil(asset.durationSeconds * FPS),
    source: "riser sebelum jumpscare",
  });
  assetUses.set("sfx_riser", 1);
}
kept.sort((a, b) => sceneOffsets[a.sceneIndex] + a.startFrame - (sceneOffsets[b.sceneIndex] + b.startFrame));

// ── 3. Salin berkas ke folder episode ────────────────────────────────────────
const needed = new Set([bed, ...kept.map((cue) => cue.name)]);
const targetDir = join(episodeDir, "audio", "horror");
if (!flag("dry-run")) mkdirSync(targetDir, { recursive: true });
for (const name of needed) {
  const from = join(ROOT, byName.get(name).file);
  const to = join(targetDir, `${name}.mp3`);
  if (!flag("dry-run")) copyFileSync(from, to);
}

// ── 4. Tulis ke episode.json ────────────────────────────────────────────────
// Bed dipasang di scene pertama lalu DILANJUTKAN (loop) oleh renderer per
// scene. Referensi memakai musik tanpa satu pun jeda hening; karena itu setiap
// scene mendapat ambience yang sama, bukan hanya scene pertama.
for (const [index, scene] of episode.scenes.entries()) {
  const sceneCues = kept.filter((cue) => cue.sceneIndex === index);
  scene.audio = {
    ...(scene.audio ?? {}),
    ambienceId: `audio/horror/${bed}.mp3`,
    ambienceVolume: bedVolume,
    sfx: sceneCues.map((cue) => ({
      assetId: cue.assetId,
      startFrame: cue.startFrame,
      volume: Number(cue.volume.toFixed(2)),
      durationFrames: cue.durationFrames,
    })),
  };
}
episode.audioPlan = {
  bed,
  bedNote,
  bedVolume,
  sfx: kept.map((cue) => ({
    scene: episode.scenes[cue.sceneIndex].id,
    asset: cue.name,
    trigger: cue.source,
    startFrame: cue.startFrame,
    seconds: Number((cue.durationFrames / FPS).toFixed(1)),
  })),
  plannedAt: new Date().toISOString(),
  plannedBy: "scripts/plan-audio.mjs",
};

if (!flag("dry-run")) writeFileSync(episodePath, `${JSON.stringify(episode, null, 2)}\n`);

// ── 5. Laporan ──────────────────────────────────────────────────────────────
console.log(`${episodeId}${longform ? " (panjang)" : ""} — bed: ${bed} @ ${bedVolume}  — ${bedNote}`);
console.log(`  total: ${(acc / FPS).toFixed(1)} s, ${episode.scenes.length} scene`);
for (const cue of kept) {
  const scene = episode.scenes[cue.sceneIndex];
  console.log(
    `  ${scene.id}  ${(cue.durationFrames / FPS).toFixed(1)}s  ${cue.name.padEnd(22)} vol ${cue.volume.toFixed(2)}  ← "${cue.source}"`,
  );
}
if (!kept.length) console.log("  (tidak ada pemicu efek di narasi — bed tetap dipasang)");
if (flag("dry-run")) console.log("  dry-run: episode.json tidak diubah");
