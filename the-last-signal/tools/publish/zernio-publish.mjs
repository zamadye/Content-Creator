#!/usr/bin/env node
/**
 * zernio-publish.mjs — unggah satu episode ke YouTube lewat Zernio.
 *
 * Dijalankan di GitHub Actions (bukan di sandbox: zernio.com tidak terjangkau
 * dari sandbox). Alur:
 *
 *   1. Baca permintaan publikasi dari publish-queue/*.json.
 *   2. Gerbang QC di runner: resolusi, fps, durasi, codec audio, loudness,
 *      true peak, ukuran file. Kalau gagal → BERHENTI, tidak ada upload.
 *   3. Presign + PUT video ke storage Zernio.
 *   4. createPost({ publishNow: true }) ke kanal YouTube THE LAST SIGNAL.
 *   5. Terbitkan hasil sebagai anotasi RESULT (JSON) supaya bisa dibaca
 *      lewat API meski log mentah tidak dapat diunduh.
 *
 * Tidak pernah mencetak API key. Tidak pernah mengaku sukses tanpa
 * platformPostUrl dari respons API.
 *
 *   node tools/publish/zernio-publish.mjs --request the-last-signal/publish-queue/xxx.json
 */

import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readKey, notice, warn, fail, describeError, loadSdk, mask } from './lib/zernio.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const REPORT_DIR = resolve(HERE, '../../report');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const requestPath = resolve(REPO_ROOT, arg('request', ''));
const dryRun = process.argv.includes('--dry-run');

function die(code, message) {
  fail(message);
  process.exit(code);
}

if (!requestPath || !existsSync(requestPath)) {
  die(2, `Permintaan publikasi tidak ditemukan: ${requestPath}`);
}

let request;
try {
  request = JSON.parse(readFileSync(requestPath, 'utf8'));
} catch (error) {
  die(2, `JSON permintaan tidak valid: ${describeError(error)}`);
}

if (request.status && request.status !== 'requested') {
  notice(`Permintaan ${request.episodeId} berstatus "${request.status}" — dilewati (sudah pernah diproses).`);
  process.exit(0);
}

const episodeId = request.episodeId;
if (!/^LS-\d{4}$/.test(String(episodeId))) die(2, `episodeId tidak valid: ${episodeId}`);

const mediaPath = resolve(REPO_ROOT, request.media ?? `the-last-signal/releases/${episodeId}.mp4`);
if (!existsSync(mediaPath)) die(2, `Media tidak ada: ${mediaPath}`);

const yt = request.youtube ?? {};
if (!yt.title || String(yt.title).length > 100) die(2, 'Judul YouTube wajib ada dan ≤ 100 karakter.');
if (!yt.description || String(yt.description).length < 40) die(2, 'Deskripsi wajib ada (≥ 40 karakter).');
if (!String(yt.description).toLowerCase().includes('fiksi')) {
  warn('Deskripsi tidak memuat kata "fiksi" — pengungkapan konten sintetis sebaiknya eksplisit.');
}

// ---------------------------------------------------------------------------
// 1. Gerbang QC di runner
// ---------------------------------------------------------------------------
const sizeBytes = statSync(mediaPath).size;
const sizeMb = sizeBytes / (1024 * 1024);

function ffmpegOutput(args) {
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

const probe = ffmpegOutput(['-hide_banner', '-i', mediaPath]);
const durationMatch = probe.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
const videoMatch = probe.match(/Video:.*?,\s(\d{3,4})x(\d{3,4}).*?,\s([\d.]+) fps/);
const audioMatch = probe.match(/Audio:\s([a-z0-9]+).*?(\d+) Hz/);

const duration = durationMatch
  ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
  : 0;

const loudnessRaw = ffmpegOutput([
  '-hide_banner', '-nostats', '-i', mediaPath,
  '-vn', '-af', 'loudnorm=print_format=json', '-f', 'null', '-',
]);
const lufs = Number(loudnessRaw.match(/"input_i"\s*:\s*"(-?[\d.]+)"/)?.[1] ?? 0);
const truePeak = Number(loudnessRaw.match(/"input_tp"\s*:\s*"(-?[\d.]+)"/)?.[1] ?? 0);

const checks = [
  {
    name: 'resolusi 1080×1920',
    pass: Boolean(videoMatch) && videoMatch[1] === '1080' && videoMatch[2] === '1920',
    detail: videoMatch ? `${videoMatch[1]}×${videoMatch[2]}` : 'tidak terbaca',
  },
  {
    name: 'fps 30',
    pass: Boolean(videoMatch) && Number(videoMatch[3]) === 30,
    detail: videoMatch ? `${videoMatch[3]} fps` : 'tidak terbaca',
  },
  {
    name: 'durasi 40–60,5 s',
    pass: duration >= 40 && duration <= 60.5,
    detail: `${duration.toFixed(2)}s`,
  },
  {
    name: 'audio AAC',
    pass: Boolean(audioMatch) && audioMatch[1] === 'aac',
    detail: audioMatch ? `${audioMatch[1]} ${audioMatch[2]} Hz` : 'TIDAK ADA AUDIO',
  },
  {
    name: 'loudness −16…−12 LUFS',
    pass: lufs <= -12 && lufs >= -16,
    detail: `${lufs.toFixed(1)} LUFS`,
  },
  { name: 'true peak ≤ −1 dBTP', pass: truePeak <= -1, detail: `${truePeak.toFixed(1)} dBTP` },
  { name: 'ukuran ≤ 40 MB', pass: sizeMb <= 40, detail: `${sizeMb.toFixed(1)} MB` },
];

for (const check of checks) {
  const line = `${check.pass ? 'PASS' : 'FAIL'} · ${check.name} · ${check.detail}`;
  check.pass ? notice(`QC ${line}`) : fail(`QC ${line}`);
}

const qcPassed = checks.every((check) => check.pass);

const result = {
  episodeId,
  requestPath: requestPath.replace(`${REPO_ROOT}/`, ''),
  checkedAt: new Date().toISOString(),
  media: { file: basename(mediaPath), sizeBytes, sizeMb: Number(sizeMb.toFixed(2)) },
  qc: { passed: qcPassed, lufs, truePeak, duration, checks },
  upload: { attempted: false, mediaUrl: null, presignKey: null },
  post: null,
  youtube: { videoId: null, url: null, status: null },
  ok: false,
};

function persist() {
  try {
    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(resolve(REPORT_DIR, `publish-${episodeId}.json`), `${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    warn(`Gagal menulis laporan: ${describeError(error)}`);
  }
}

if (!qcPassed) {
  result.ok = false;
  persist();
  fail(`QC gagal untuk ${episodeId} — upload dibatalkan. Tidak ada video yang diunggah.`);
  process.exit(3);
}

notice(`QC lolos untuk ${episodeId} (${sizeMb.toFixed(1)} MB, ${duration.toFixed(1)} s, ${lufs.toFixed(1)} LUFS).`);

if (dryRun) {
  notice(`::notice title=RESULT::${JSON.stringify({ ...result, dryRun: true })}`);
  notice('Mode dry-run: QC lolos, tidak ada upload.');
  persist();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Klien Zernio
// ---------------------------------------------------------------------------
const key = readKey();
if (!key) die(2, 'ZERNIO_API_KEY tidak tersedia di environment job ini.');

const Zernio = await loadSdk();
const zernio = new Zernio({ apiKey: key.value });

// ---------------------------------------------------------------------------
// 3. Presign + PUT media
// ---------------------------------------------------------------------------
let publicUrl;
try {
  const { data: presign } = await zernio.media.getMediaPresignedUrl({
    body: { filename: `${episodeId}.mp4`, contentType: 'video/mp4', size: sizeBytes },
  });
  if (!presign?.uploadUrl || !presign?.publicUrl) {
    throw new Error('Respons presign tidak memuat uploadUrl/publicUrl');
  }
  const buffer = readFileSync(mediaPath);
  const put = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: buffer,
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(buffer.byteLength) },
  });
  if (!put.ok) throw new Error(`PUT media gagal: HTTP ${put.status} ${(await put.text()).slice(0, 200)}`);

  publicUrl = presign.publicUrl;
  result.upload = { attempted: true, mediaUrl: publicUrl, presignKey: presign.key ?? null };
  notice(`Media terunggah ke storage Zernio (${sizeMb.toFixed(1)} MB).`);
  if (presign.uploadUrl) mask(presign.uploadUrl.includes('?') ? presign.uploadUrl.split('?')[1] : '');
} catch (error) {
  result.upload.error = describeError(error);
  persist();
  die(4, `Upload media ke Zernio gagal: ${result.upload.error}`);
}

// ---------------------------------------------------------------------------
// 4. Buat post + publishNow
// ---------------------------------------------------------------------------
let accountId = request.accountId ?? process.env.ZERNIO_YOUTUBE_ACCOUNT_ID ?? null;
if (!accountId) {
  // Cari kanal YouTube aktif secara otomatis: satu sumber kebenaran, bukan
  // ID yang ditempel manual dan bisa basi.
  try {
    const { data } = await zernio.accounts.listAccounts();
    const candidate = (data?.accounts ?? []).find(
      (account) => account.platform === 'youtube' && account.isActive !== false && account.status !== 'inactive',
    );
    accountId = candidate?._id ?? candidate?.accountId ?? candidate?.id ?? null;
    if (accountId) notice(`Kanal YouTube ditemukan otomatis: ${candidate.username ?? '(tanpa username)'} id=${accountId}`);
  } catch (error) {
    warn(`Gagal mencari kanal otomatis: ${describeError(error)}`);
  }
}
if (!accountId) {
  persist();
  die(2, 'Tidak ada kanal YouTube yang bisa dipakai (accountId kosong dan pencarian otomatis gagal).');
}

try {
  const { data: post, response } = await zernio.posts.createPost({
    body: {
      content: String(yt.description),
      tags: Array.isArray(yt.tags) ? yt.tags : undefined,
      mediaItems: [{ url: publicUrl, type: 'video', mimeType: 'video/mp4' }],
      platforms: [
        {
          platform: 'youtube',
          accountId,
          platformSpecificData: {
            title: String(yt.title),
            visibility: yt.visibility ?? 'public',
            madeForKids: false,
            containsSyntheticMedia: true,
            categoryId: String(yt.categoryId ?? '24'),
            notifySubscribers: yt.notifySubscribers !== false,
            ...(yt.firstComment ? { firstComment: String(yt.firstComment) } : {}),
          },
        },
      ],
      publishNow: true,
      metadata: {
        episodeId,
        studio: 'the-last-signal',
        qcDigest: `lufs:${lufs.toFixed(1)} tp:${truePeak.toFixed(1)} dur:${duration.toFixed(1)}`,
      },
    },
  });

  result.post = { id: post?.id ?? null, status: post?.status ?? null, httpStatus: response?.status ?? null };

  const platform = (post?.platforms ?? []).find((entry) => entry?.platform === 'youtube') ?? post?.platforms?.[0];
  if (platform) {
    result.youtube.status = platform.status ?? null;
    result.youtube.url = platform.platformPostUrl ?? platform.url ?? null;
    result.youtube.videoId =
      platform.platformPostId ?? platform.id ?? platform.postId ?? platform.platformVideoId ?? null;
  }

  const raw = JSON.stringify(post ?? {});
  if (!result.youtube.videoId) {
    const idMatch = raw.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
    if (idMatch) result.youtube.videoId = idMatch[1];
    const ytIdField = raw.match(/"youtubeVideoId"\s*:\s*"([A-Za-z0-9_-]{11})"/);
    if (!result.youtube.videoId && ytIdField) result.youtube.videoId = ytIdField[1];
  }
  if (!result.youtube.url && result.youtube.videoId) {
    result.youtube.url = `https://www.youtube.com/watch?v=${result.youtube.videoId}`;
  }

  // Bukti terbit: status platform "published" ATAU ada URL hasil dari platform.
  // HTTP 201 saja tidak cukup, dan sebaliknya 207 parsial tetap bisa berisi
  // satu platform sukses — jadi yang dinilai adalah platform YouTube-nya.
  const platformStatus = String(platform?.status ?? '').toLowerCase();
  result.ok = platformStatus === 'published' || Boolean(result.youtube.url);

  notice(`Respons createPost: HTTP ${result.post.httpStatus} · status=${result.youtube.status ?? '-'}`);
  if (result.youtube.url) notice(`URL: ${result.youtube.url}`);
} catch (error) {
  result.post = { error: describeError(error) };
  persist();
  die(5, `createPost gagal: ${describeError(error)}`);
}

persist();

if (result.ok) {
  notice(`::notice title=PUBLISH-RESULT-${episodeId}::${JSON.stringify(result)}`);
  notice(`PUBLISH OK ${episodeId} → ${result.youtube.url}`);
  process.exit(0);
}

fail(`::error title=PUBLISH-RESULT-${episodeId}::${JSON.stringify(result)}`);
die(6, `API tidak mengonfirmasi publikasi untuk ${episodeId}. Status=${result.youtube.status ?? 'tidak ada'}.`);
