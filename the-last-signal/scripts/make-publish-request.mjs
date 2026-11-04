/**
 * make-publish-request.mjs — buat permintaan publikasi untuk satu episode.
 *
 * Permintaan = file JSON di publish-queue/. Menambah file itu ke git adalah
 * satu-satunya cara memicu workflow "Publikasikan ke YouTube", jadi penerbitan
 * tercatat di riwayat repo dan tidak bisa terjadi tanpa jejak.
 *
 *   node scripts/make-publish-request.mjs --episode LS-0001 \
 *     --media renders/LS-0001-delivery.mp4 --release releases/LS-0001.mp4
 *
 * Keluaran: publish-queue/<waktu>-<episode>.json
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(ROOT, "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode");
if (!episodeId) {
  console.error("Pakai: node scripts/make-publish-request.mjs --episode LS-0001 --release releases/LS-0001.mp4");
  process.exit(1);
}

const episodePath = join(ROOT, "projects", "episodes", episodeId, "episode.json");
const episode = JSON.parse(readFileSync(episodePath, "utf8"));

// Path media relatif terhadap ROOT REPO (bukan folder the-last-signal), karena
// workflow menjalankan skrip dari akar repo.
const releaseRel = arg("release", `releases/${episodeId}.mp4`);
const releaseAbs = resolve(ROOT, releaseRel);
if (!existsSync(releaseAbs)) {
  console.error(`✖ file rilis belum ada: ${releaseAbs}`);
  console.error("  Salin hasil encode dulu: cp renders/" + episodeId + "-delivery.mp4 " + releaseRel);
  process.exit(1);
}

const sizeMb = statSync(releaseAbs).size / (1024 * 1024);
if (sizeMb > 40) {
  console.error(`✖ ${sizeMb.toFixed(1)} MB melebihi batas QC 40 MB`);
  process.exit(1);
}

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);
const queueDir = join(ROOT, "publish-queue");
mkdirSync(queueDir, { recursive: true });

const publishing = episode.publishing ?? {};
const request = {
  episodeId,
  createdAt: now.toISOString(),
  media: relative(REPO_ROOT, releaseAbs),
  episode: {
    title: episode.title,
    subgenre: episode.production?.subgenre ?? null,
    structure: episode.production?.structure ?? null,
    durationSeconds: episode.targetDurationSeconds ?? null,
    scenes: episode.scenes.length,
    jumpscares: (episode.jumpscares ?? []).length,
  },
  youtube: {
    title: publishing.title,
    description: publishing.description,
    tags: publishing.tags ?? [],
    categoryId: publishing.categoryId ?? "24",
    visibility: publishing.privacyStatus ?? "public",
    madeForKids: false,
    containsSyntheticMedia: true,
    notifySubscribers: true,
    firstComment: `Fiksi. Visual dibuat dengan bantuan AI.\n\nCerita ini bagian dari seri THE LAST SIGNAL. Kalau kamu pernah mengalami hal serupa, tulis di komentar — cerita yang paling sering disebut akan jadi episode berikutnya.`,
  },
};

const fileName = `${stamp}-${episodeId}.json`;
writeFileSync(join(queueDir, fileName), `${JSON.stringify(request, null, 2)}\n`, "utf8");

console.log(`✔ permintaan dibuat: ${relative(REPO_ROOT, join(queueDir, fileName))}`);
console.log(`  media : ${request.media} (${sizeMb.toFixed(1)} MB)`);
console.log(`  judul : ${request.youtube.title}`);
console.log(`  jadwal: menambah file ini ke git = perintah unggah`);
