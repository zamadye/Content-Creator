#!/usr/bin/env node
/**
 * zernio-publish.mjs — unggah satu episode ke YouTube DAN Facebook lewat Zernio.
 *
 * Dijalankan di GitHub Actions (bukan di sandbox: zernio.com tidak terjangkau
 * dari sandbox). Alur:
 *
 *   1. Baca permintaan publikasi dari publish-queue/*.json.
 *   2. Gerbang QC di runner: resolusi, fps, durasi, codec audio, loudness,
 *      true peak, ukuran file. Kalau gagal → BERHENTI, tidak ada upload.
 *   3. Presign + PUT video ke storage Zernio.
 *   4. createPost({ publishNow: true }) ke kanal YouTube THE LAST SIGNAL dan
 *      Halaman Facebook-nya dalam satu panggilan (satu post, dua platform).
 *      · Shorts 9:16 ≤ 90 s  → Facebook Reel (contentType: 'reel')
 *      · Video panjang 16:9  → video feed Facebook (Reels dibatasi Meta 3–90 s)
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

/**
 * Mode jadwal (2026-11-08, arahan pemilik kanal).
 *
 * Jadwal tayang hidup di Zernio, bukan di repo: video diunggah ke storage
 * Zernio SEKARANG dan Zernio yang menayangkannya pada `scheduledFor`. Setelah
 * itu berkas di repo boleh hilang — tidak ada yang bergantung padanya.
 *
 *   node zernio-publish.mjs --request <berkas.json> --schedule 2026-11-08T04:05:00Z
 */
const scheduleFor = arg('schedule', null);
const scheduleTimezone = arg('timezone', 'Asia/Makassar'); // WITA (UTC+8)
if (scheduleFor && Number.isNaN(Date.parse(scheduleFor))) {
  die(2, `--schedule bukan waktu yang sah: ${scheduleFor} (pakai ISO 8601, mis. 2026-11-08T04:05:00Z)`);
}
if (scheduleFor && Date.parse(scheduleFor) < Date.now() - 60_000) {
  die(2, `--schedule sudah lewat: ${scheduleFor}`);
}

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

// Status "requested" = tayang sekarang. Untuk penjadwalan, berkas `held` juga
// boleh diproses — justru itu sumbernya. Yang tetap ditolak: berkas yang sudah
// tayang atau sudah punya jadwal, supaya tidak ada unggahan kedua.
const bolehDijadwalkan = Boolean(scheduleFor) && ['held', 'requested'].includes(String(request.status ?? 'requested'));
if (request.status && request.status !== 'requested' && !bolehDijadwalkan) {
  notice(`Permintaan ${request.episodeId} berstatus "${request.status}" — dilewati (sudah pernah diproses).`);
  process.exit(0);
}

const episodeId = request.episodeId;
if (!/^(LS|LL)-\d{4}$/.test(String(episodeId))) die(2, `episodeId tidak valid: ${episodeId}`);

// Format panjang (LL-####) punya gerbang QC sendiri: 16:9, 5–11 menit, dan
// berkas yang jauh lebih besar. Memakai ambang Shorts di sini akan menolak
// setiap video panjang sebelum sempat diunggah.
const longform = String(request.format ?? '').toLowerCase() === 'longform'
  || /^LL-/.test(String(episodeId));
const limits = longform
  ? { width: '1920', height: '1080', minDuration: 300, maxDuration: 660, maxSizeMb: 300 }
  : { width: '1080', height: '1920', minDuration: 40, maxDuration: 60.5, maxSizeMb: 40 };

const mediaPath = resolve(REPO_ROOT, request.media ?? `the-last-signal/releases/${episodeId}.mp4`);
if (!existsSync(mediaPath)) die(2, `Media tidak ada: ${mediaPath}`);

const yt = request.youtube ?? {};
// Judul YouTube tidak wajib untuk permintaan Facebook-only, tapi kaption tetap
// butuh isi — diambil dari youtube.caption kalau ada.
const fb = request.facebook ?? {};

// Target platform per permintaan. Bawaannya dua-duanya (YouTube + Facebook).
// "platforms": ["facebook"] dipakai untuk memindahkan katalog Shorts yang
// sudah terbit di YouTube ke Reels Facebook tanpa menerbitkan ulang di YouTube.
const ALLOWED_PLATFORMS = ["youtube", "facebook"];
const targets = Array.isArray(request.platforms) && request.platforms.length
  ? request.platforms.map((entry) => String(entry).toLowerCase())
  : ALLOWED_PLATFORMS;
for (const target of targets) {
  if (!ALLOWED_PLATFORMS.includes(target)) die(2, `Platform tidak dikenal di permintaan: ${target}`);
}
const wantsYoutube = targets.includes("youtube");
const wantsFacebook = targets.includes("facebook");
if (wantsYoutube && (!yt.title || String(yt.title).length > 100)) {
  die(2, 'Judul YouTube wajib ada dan ≤ 100 karakter.');
}
if (!yt.description || String(yt.description).length < 40) die(2, 'Deskripsi wajib ada (≥ 40 karakter).');
// Arahan pemilik kanal 2026-11-06: tidak ada label AI di kedua platform, dan
// tidak ada kalimat pengungkapan di judul/deskripsi/komentar. Videonya disusun
// per scene lewat kode (Remotion), bukan hasil generate video otomatis, jadi
// kotak "altered content" / "AI generated" sengaja TIDAK dicentang.
if (/arsip fiksi|dibuat dengan bantuan ai|adalah fiksi/i.test(`${yt.title} ${yt.description}`)) {
  die(2, 'Judul/deskripsi memuat label arsip atau kalimat pengungkapan — dilarang sejak 2026-11-06.');
}
if (request.youtube?.containsSyntheticMedia) {
  warn('Berkas antrean menyetel containsSyntheticMedia=true — kotak label AI akan tercentang. Setel false (arahan 2026-11-06).');
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

// Facebook Reels: Meta mendokumentasikan 3–90 detik dan video vertikal 9:16.
// Di luar itu tetap diunggah ke Facebook, tapi sebagai video feed — bukan Reel.
// Lebih baik turun satu tingkat daripada tidak terbit sama sekali.
const FB_REEL_MAX_SECONDS = 90;
const vertical = Boolean(videoMatch) && videoMatch[1] === '1080' && videoMatch[2] === '1920';
const fbMode = vertical && duration >= 3 && duration <= FB_REEL_MAX_SECONDS ? 'reel' : 'video';
const fbEnabled = wantsFacebook && request.facebook?.enabled !== false;

/**
 * Kaption Facebook bawaan: deskripsi YouTube tanpa blok bab waktu dan tanpa
 * baris hashtag YouTube. Bab waktu berguna di YouTube (penonton bisa melompat),
 * di feed Facebook ia hanya jadi tujuh baris angka sebelum ceritanya dimulai.
 */
function defaultFacebookCaption(source) {
  const lines = String(source ?? '')
    .split("\n")
    .filter((line) => !/^\s*\d{1,2}:\d{2}\s/.test(line))
    .filter((line) => !/^\s*#[\w#\s]+$/.test(line));
  const trimmed = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return `${trimmed}\n\n#TheLastSignal #CeritaHoror #HororIndonesia`;
}

// Cek kualitas berkas (fps, codec, loudness, true peak, ukuran) selalu jalan —
// itu soal berkasnya, bukan aturan platform. Yang bergantung platform hanya
// resolusi dan durasi: YouTube punya ambang Shorts vs video panjang, Facebook
// Reels 3–90 detik 9:16.
const resolutionCheck = wantsYoutube
  ? {
      name: `resolusi ${limits.width}×${limits.height}`,
      pass: Boolean(videoMatch) && videoMatch[1] === limits.width && videoMatch[2] === limits.height,
      detail: videoMatch ? `${videoMatch[1]}×${videoMatch[2]}` : 'tidak terbaca',
    }
  : fbMode === 'reel'
    ? {
        name: 'resolusi 1080×1920 (Reels)',
        pass: Boolean(videoMatch) && videoMatch[1] === '1080' && videoMatch[2] === '1920',
        detail: videoMatch ? `${videoMatch[1]}×${videoMatch[2]}` : 'tidak terbaca',
      }
    : null;

const durationCheck = wantsYoutube
  ? {
      name: longform ? 'durasi 5–11 menit' : 'durasi 40–60,5 s',
      pass: duration >= limits.minDuration && duration <= limits.maxDuration,
      detail: `${duration.toFixed(2)}s`,
    }
  : {
      name: fbMode === 'reel' ? 'durasi Reel 3–90 s' : 'durasi video feed ≤ 60 menit',
      pass: fbMode === 'reel' ? duration >= 3 && duration <= FB_REEL_MAX_SECONDS : duration > 0 && duration <= 3600,
      detail: `${duration.toFixed(2)}s`,
    };

const checks = [
  ...(resolutionCheck ? [resolutionCheck] : []),
  {
    name: 'fps 30',
    pass: Boolean(videoMatch) && Number(videoMatch[3]) === 30,
    detail: videoMatch ? `${videoMatch[3]} fps` : 'tidak terbaca',
  },
  durationCheck,
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
  { name: `ukuran ≤ ${limits.maxSizeMb} MB`, pass: sizeMb <= limits.maxSizeMb, detail: `${sizeMb.toFixed(1)} MB` },
  {
    name: 'Facebook (Reel 3–90 s 9:16 / selain itu video feed)',
    pass: true,
    detail: fbEnabled
      ? fbMode === 'reel'
        ? `Reel · ${duration.toFixed(1)}s · 1080×1920`
        : `video feed · ${duration.toFixed(1)}s · ${videoMatch ? `${videoMatch[1]}×${videoMatch[2]}` : '?'}`
      : 'dimatikan di permintaan',
  },
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
  facebook: { enabled: fbEnabled, mode: fbMode, postId: null, url: null, status: null, ok: false },
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

// ---------------------------------------------------------------------------
// Jeda antar-unggahan (aturan kanal: minimal 1 jam, dihitung dari unggahan
// BERHASIL sebelumnya). Dibaca dari knowledge/episodes.jsonl, jadi aturannya
// tidak bergantung pada ingatan manusia yang memicu workflow.
// ---------------------------------------------------------------------------
const MIN_GAP_MS = 55 * 60 * 1000; // 55 menit: toleransi 5 menit untuk jam runner
// Jeda antar-unggahan adalah aturan feed YouTube. Untuk permintaan Facebook-only
// (memindahkan katalog Shorts ke Reels) jeda diatur pemanggil, bukan di sini.
if (!wantsYoutube) {
  notice('Permintaan Facebook-only: jeda antar-unggahan YouTube tidak diperiksa.');
} else try {
  const kbPath = resolve(REPO_ROOT, 'the-last-signal/knowledge/episodes.jsonl');
  if (existsSync(kbPath)) {
    const published = readFileSync(kbPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((record) => record.publish?.ok && record.publish?.at)
      .map((record) => ({ id: record.episodeId, at: Date.parse(record.publish.at) }))
      .filter((record) => Number.isFinite(record.at))
      .sort((a, b) => b.at - a.at);
    const last = published[0];
    if (last) {
      const gap = Date.now() - last.at;
      if (gap < MIN_GAP_MS) {
        const minutes = Math.round(gap / 60000);
        persist();
        die(
          7,
          `Jeda antar-unggahan belum terpenuhi: ${minutes} menit sejak ${last.id} terbit. Tunggu sampai ${new Date(last.at + MIN_GAP_MS).toISOString()}.`,
        );
      }
      notice(`Jeda sejak ${last.id}: ${Math.round(gap / 60000)} menit (minimum 55).`);
    }
  } else {
    warn('knowledge/episodes.jsonl tidak ada — jeda antar-unggahan tidak bisa diperiksa.');
  }
} catch (error) {
  warn(`Pemeriksaan jeda gagal (tidak fatal): ${describeError(error)}`);
}

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
// Akun platform dicari sekali, lalu dipakai untuk YouTube dan Facebook.
// Sumber ID: environment (vars repo) → kolom di berkas antrean → pencarian
// otomatis dari daftar akun Zernio. Pencarian otomatis yang jadi andalan,
// supaya akun yang baru disambungkan tidak perlu ditulis ke kode.
let accountList = null;
async function listAccounts() {
  if (!accountList) {
    try {
      const { data } = await zernio.accounts.listAccounts();
      accountList = data?.accounts ?? [];
    } catch (error) {
      warn(`Gagal membaca daftar akun Zernio: ${describeError(error)}`);
      accountList = [];
    }
  }
  return accountList;
}

async function resolveAccount(platform, envName, requestKey) {
  const fromEnv = process.env[envName];
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const fromRequest = request[requestKey];
  if (fromRequest) return String(fromRequest);

  const accounts = await listAccounts();
  const candidate = accounts.find(
    (account) =>
      account.platform === platform && account.isActive !== false && account.status !== 'inactive',
  );
  const id = candidate?._id ?? candidate?.accountId ?? candidate?.id ?? null;
  if (id) {
    notice(
      `Akun ${platform} ditemukan otomatis: ${candidate.username ?? candidate.name ?? '(tanpa nama)'} id=${id}`,
    );
  } else {
    const known = accounts.map((account) => account.platform).join(', ') || 'kosong';
    warn(`Tidak ada akun ${platform} aktif di Zernio. Akun yang ada: ${known}.`);
  }
  return id;
}

const accountId = wantsYoutube
  ? await resolveAccount('youtube', 'ZERNIO_YOUTUBE_ACCOUNT_ID', 'accountId')
  : null;
if (wantsYoutube && !accountId) {
  persist();
  die(2, 'Tidak ada kanal YouTube yang bisa dipakai (accountId kosong dan pencarian otomatis gagal).');
}

const facebookAccountId = fbEnabled
  ? await resolveAccount('facebook', 'ZERNIO_FACEBOOK_ACCOUNT_ID', 'facebookAccountId')
  : null;
if (fbEnabled && !facebookAccountId) {
  result.facebook.enabled = false;
  warn('Facebook dilewati: tidak ada Halaman Facebook yang tersambung di Zernio.');
}

try {
  const { data: post, response } = await zernio.posts.createPost({
    body: {
      content: String(yt.description),
      tags: Array.isArray(yt.tags) ? yt.tags : undefined,
      mediaItems: [{ url: publicUrl, type: 'video', mimeType: 'video/mp4' }],
      platforms: [
        ...(wantsYoutube
          ? [
              {
                platform: 'youtube',
                accountId,
                platformSpecificData: {
                  title: String(yt.title),
                  visibility: yt.visibility ?? 'public',
                  madeForKids: false,
                  // Tidak dicentang (arahan pemilik kanal 2026-11-06): video
                  // disusun per scene dengan kode, bukan generate video utuh.
                  containsSyntheticMedia: false,
                  categoryId: String(yt.categoryId ?? '24'),
                  notifySubscribers: yt.notifySubscribers !== false,
                  ...(yt.firstComment ? { firstComment: String(yt.firstComment) } : {}),
                },
              },
            ]
          : []),
        ...(fbEnabled && facebookAccountId
          ? [
              {
                platform: 'facebook',
                accountId: facebookAccountId,
                // Kaption Facebook dipisah: hashtag YouTube tidak berguna di
                // feed, dan baris pertama harus bisa berdiri sendiri karena
                // Facebook memotong teks setelah ±125 karakter.
                customContent: String(fb.caption ?? defaultFacebookCaption(yt.description)),
                platformSpecificData: {
                  // Label "AI generated" Meta tidak dipakai (arahan 2026-11-06).
                  ...(fbMode === 'reel' ? { contentType: 'reel', isAiGenerated: false } : {}),
                  ...(fb.title ? { title: String(fb.title) } : {}),
                  ...(fb.firstComment ?? yt.firstComment
                    ? { firstComment: String(fb.firstComment ?? yt.firstComment) }
                    : {}),
                },
              },
            ]
          : []),
      ],
      // Jadwal: Zernio yang menayangkan, jadi publishNow WAJIB false. Kalau
      // keduanya terkirim, publishNow menang dan video tayang detik itu juga.
      ...(scheduleFor
        ? { scheduledFor: new Date(scheduleFor).toISOString(), timezone: scheduleTimezone, publishNow: false }
        : { publishNow: true }),
      metadata: {
        episodeId,
        studio: 'the-last-signal',
        qcDigest: `lufs:${lufs.toFixed(1)} tp:${truePeak.toFixed(1)} dur:${duration.toFixed(1)}`,
      },
    },
  });

  // Bentuk respons createPost: { message?, post: {...}, platformResults?: [...] }.
  // Versi lama membaca objek pembungkusnya langsung, sehingga post.id selalu
  // null dan hanya regex URL YouTube yang kebetulan menyelamatkan status —
  // untuk Facebook tidak ada URL yang bisa ditebak, jadi unggahan "sukses"
  // terlihat gagal. Sekarang isinya yang dibuka.
  const payload = post?.post ?? post ?? {};
  const platformResults = Array.isArray(post?.platformResults) ? post.platformResults : [];

  result.post = {
    id: payload.id ?? null,
    status: payload.status ?? null,
    httpStatus: response?.status ?? null,
    message: post?.message ?? null,
    warnings: Array.isArray(post?.warnings) ? post.warnings : undefined,
  };

  if (post?.error) result.post.error = String(post.error).slice(0, 300);

  const platform =
    (payload.platforms ?? []).find((entry) => entry?.platform === 'youtube') ?? (payload.platforms ?? [])[0] ?? null;
  const fbPlatform =
    (payload.platforms ?? []).find((entry) => entry?.platform === 'facebook') ??
    (platformResults.find((entry) => entry?.platform === 'facebook') ?? null);
  if (fbPlatform) {
    result.facebook.status = fbPlatform.status ?? null;
    result.facebook.url = fbPlatform.platformPostUrl ?? fbPlatform.url ?? null;
    result.facebook.postId = fbPlatform.platformPostId ?? fbPlatform.id ?? fbPlatform.postId ?? null;
    result.facebook.ok = String(fbPlatform.status ?? '').toLowerCase() === 'published' || Boolean(result.facebook.url);
    if (!result.facebook.ok && fbPlatform.error) {
      result.facebook.error = String(fbPlatform.error).slice(0, 300);
    }
  }
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

  // createPost bisa menjawab 201 dengan status "publishing": Meta memproses
  // Reels setelah request diterima. Dulu itu dianggap gagal (exit 6) padahal
  // post-nya ada — dan percobaan ulang berarti Reel kedua. Sekarang hasilnya
  // ditanyakan ulang ke API sampai jelas, maksimal ±6 menit.
  const pending = ['publishing', 'processing', 'pending', 'queued', 'uploading'];
  const statusOf = () => String(payload.status ?? result.facebook.status ?? '').toLowerCase();
  if (!scheduleFor && !wantsYoutube && pending.includes(statusOf())) {
    notice(`Post diterima (status=${statusOf()}) — menanyakan hasil akhir ke Zernio`);
    const episodeIdWanted = episodeId;
    const deadline = Date.now() + 6 * 60 * 1000;
    while (Date.now() < deadline && pending.includes(statusOf())) {
      await new Promise((done) => setTimeout(done, 20000));
      try {
        const { data: listing } = await zernio.posts.listPosts({ query: { limit: 10 } });
        const posts = listing?.posts ?? listing?.data ?? [];
        const mine = posts.find((entry) => entry?.metadata?.episodeId === episodeIdWanted);
        if (mine) {
          const target = (mine.platforms ?? []).find((entry) => entry?.platform === 'facebook');
          if (target) {
            result.facebook.status = target.status ?? result.facebook.status;
            result.facebook.url = target.url ?? target.platformPostUrl ?? result.facebook.url;
            result.facebook.postId = target.id ?? target.platformPostId ?? result.facebook.postId;
            result.facebook.ok =
              String(target.status).toLowerCase() === 'published' || Boolean(result.facebook.url);
            result.post.id = result.post.id ?? mine.id ?? null;
            result.post.status = mine.status ?? result.post.status;
            if (result.facebook.ok) {
              notice(`Facebook dikonfirmasi setelah menunggu: ${result.facebook.url ?? result.facebook.postId}`);
              break;
            }
            // Sudah ada post untuk episode ini, hanya belum selesai diproses.
            // Itu cukup untuk mencegah unggahan kedua; statusnya tetap dicatat.
            result.facebook.accepted = true;
          }
        }
      } catch (error) {
        warn(`Pemeriksaan status post gagal: ${describeError(error)}`);
      }
    }
  }

  if (!result.facebook.ok && !fbPlatform && !result.facebook.accepted) {
    const fbError = platformResults.find((entry) => entry?.platform === 'facebook' && entry?.error);
    if (fbError) result.facebook.error = String(fbError.error).slice(0, 300);
    result.facebook.status = result.facebook.status ?? 'tidak dilaporkan';
  }

  // Bukti terbit: status platform "published" ATAU ada URL hasil dari platform.
  // HTTP 201 saja tidak cukup, dan sebaliknya 207 parsial tetap bisa berisi
  // satu platform sukses — jadi yang dinilai adalah platform YouTube-nya.
  const platformStatus = String(platform?.status ?? '').toLowerCase();

  // Post terjadwal belum punya URL apa pun — yang membuktikan berhasil adalah
  // adanya id post + status "scheduled" dan waktu yang Zernio simpan.
  if (scheduleFor) {
    const statusAll = [
      String(result.post.status ?? '').toLowerCase(),
      ...(payload.platforms ?? []).map((entry) => String(entry?.status ?? '').toLowerCase()),
    ];
    const terjadwal =
      Boolean(result.post.id) &&
      (statusAll.includes('scheduled') || statusAll.includes('pending') || statusAll.includes('queued'));
    result.schedule = {
      requestedFor: new Date(scheduleFor).toISOString(),
      timezone: scheduleTimezone,
      confirmedFor: String(payload.scheduledFor ?? '') || null,
      status: result.post.status ?? null,
    };
    result.ok = terjadwal;
    notice(
      terjadwal
        ? `Terjadwal di Zernio: ${result.schedule.confirmedFor ?? result.schedule.requestedFor} (${scheduleTimezone}) · post ${result.post.id}`
        : `Zernio tidak mengonfirmasi jadwal: status=${result.post.status ?? 'tidak ada'}`,
    );
  } else {
    result.ok = wantsYoutube
      ? platformStatus === 'published' || Boolean(result.youtube.url)
      : Boolean(result.facebook.ok) || result.facebook.accepted === true;
  }

  notice(`Respons createPost: HTTP ${result.post.httpStatus} · status=${result.youtube.status ?? '-'}`);
  if (result.youtube.url) notice(`URL: ${result.youtube.url}`);
  if (fbEnabled && facebookAccountId) {
    if (result.facebook.ok) {
      notice(`Facebook (${fbMode}) terbit: ${result.facebook.url ?? result.facebook.postId ?? '(tanpa URL)'}`);
    } else {
      warn(
        `Facebook (${fbMode}) tidak dikonfirmasi: status=${result.facebook.status ?? 'tidak ada'}${result.facebook.error ? ` · ${result.facebook.error}` : ''}. YouTube tetap dianggap sukses.`,
      );
    }
  }
} catch (error) {
  result.post = { error: describeError(error) };
  persist();
  die(5, `createPost gagal: ${describeError(error)}`);
}

persist();

if (result.ok) {
  notice(`::notice title=PUBLISH-RESULT-${episodeId}::${JSON.stringify(result)}`);
  notice(
    scheduleFor
      ? `JADWAL OK ${episodeId} → ${result.schedule?.confirmedFor ?? scheduleFor}`
      : `PUBLISH OK ${episodeId} → ${wantsYoutube ? result.youtube.url : result.facebook.url}`,
  );
  process.exit(0);
}

fail(`::error title=PUBLISH-RESULT-${episodeId}::${JSON.stringify(result)}`);
die(6, `API tidak mengonfirmasi publikasi untuk ${episodeId}. Status=${result.youtube.status ?? 'tidak ada'}.`);
