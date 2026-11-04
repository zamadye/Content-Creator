#!/usr/bin/env node
/**
 * PUBLISH TO BUFFER — satu paket misi jadi post di semua kanal
 * --------------------------------------------------------------
 * Menjalankan: video + caption per platform + komentar pertama -> Buffer, lewat CLI resmi
 * (@bufferapp/cli). Semua aturan di bawah diambil dari dokumentasi yang dibundel CLI
 * (`buffer context pitfalls`, `buffer schema describe posts create`), bukan dari tebakan.
 *
 * EMPAT FAKTA YANG MEMBENTUK SKRIP INI
 * 1. CLI Buffer tidak punya perintah unggah berkas. `buffer schema list` -> 44 perintah,
 *    tidak satu pun untuk upload media. Media WAJIB berupa URL publik
 *    (`assets[].video.url`), dan Buffer yang mengunduh sendiri.
 *    Artinya: menyimpan mp4 di git TIDAK cukup — git bukan server. Berkasnya harus
 *    didorong ke repo publik / Releases / Pages dulu, lalu URL-nya dipakai di sini.
 * 2. Thumbnail PNG tidak bisa ditempel ke post video. Deskripsi field
 *    `assets[].video.thumbnailUrl` di schema: "Do not use: social networks do not accept
 *    custom video thumbnail images, and the API rejects video assets that set this field."
 *    Yang didukung hanya `metadata.thumbnailOffset` (milidetik) — memilih satu bingkai
 *    dari video itu sendiri, dan hanya untuk Instagram, TikTok, Pinterest.
 * 3. Tiap layanan punya syarat metadata sendiri (pitfalls -> "Per-service minimum payloads"):
 *      instagram : aset video + metadata.instagram.type + metadata.instagram.shouldShareToFeed
 *      facebook  : metadata.facebook.type
 *      youtube   : aset video + metadata.youtube.title (+ categoryId)
 *      tiktok    : aset video
 * 4. `posts create` TIDAK idempoten. Skrip memeriksa post serupa lebih dulu, dan tidak
 *    mengulang otomatis saat gagal.
 *
 * PEMAKAIAN
 *   node pipeline/publish-buffer.mjs --mission <slug>                    # validasi saja
 *   node pipeline/publish-buffer.mjs --mission <slug> --send             # kirim
 *   node pipeline/publish-buffer.mjs --mission <slug> --platforms instagram,tiktok
 *
 * ENV
 *   BUFFER_API_KEY        wajib (jangan disimpan di repo)
 *   MEDIA_URL             URL publik mp4. Kalau kosong, script menurunkan URL dari
 *                         MEDIA_PROVIDER (release | pages | raw) dan memverifikasinya.
 *   MEDIA_PROVIDER        release (default) | pages | raw | custom
 *   MODE                  addToQueue (default) | shareNext | shareNow | customScheduled
 *   DUE_AT                ISO-8601 dengan offset, wajib untuk customScheduled
 *   THUMBNAIL_OFFSET_MS   default 9000 (hanya IG/TikTok/Pinterest yang mendukung)
 *   DRY_RUN=1             sama dengan tanpa --send
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => path.join(ROOT, ...a);

/* ------------------------------------------------------------------ argumen */
const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i > -1 ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const MISSION = argOf('mission', process.env.MISSION);
const SEND = flag('send') && process.env.DRY_RUN !== '1';
const MODE = process.env.MODE ?? 'addToQueue';
const DUE_AT = process.env.DUE_AT ?? '';
const THUMB_OFFSET = Number(process.env.THUMBNAIL_OFFSET_MS ?? 9000);
const PLATFORMS = (argOf('platforms', 'facebook,instagram,tiktok,youtube') ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const API_KEY = process.env.BUFFER_API_KEY;
const MEDIA_PROVIDER = (process.env.MEDIA_PROVIDER ?? 'release').toLowerCase();

const die = (msg, code = 3) => {
  console.error(`\n✗ ${msg}`);
  process.exit(code);
};

if (!MISSION) die('butuh --mission <slug> (mis. pinjol-bunga-harian-2026)', 2);
if (!API_KEY) {
  die('BUFFER_API_KEY belum diset.\n  export BUFFER_API_KEY=...   (jangan ditulis ke repo)', 4);
}

/* ------------------------------------------------------------------ berkas misi */
const FILE = {
  video: p('deliverables', `B_${MISSION}_1080x1920.mp4`),
  thumb: p('deliverables', `T_${MISSION}_1080x1920.png`),
  caption: p('deliverables', `caption_${MISSION}.txt`),
};
for (const [k, f] of Object.entries(FILE)) {
  if (!fs.existsSync(f)) die(`${k} tidak ada: ${path.relative(ROOT, f)}`, 2);
}
const videoBytes = fs.statSync(FILE.video).size;
const rawCaption = fs.readFileSync(FILE.caption, 'utf8');

/* ------------------------------------------------------------------ caption */
const HEADING = {
  facebook: 'FACEBOOK REELS',
  instagram: 'INSTAGRAM REELS',
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE SHORTS',
};

const blockOf = (heading) => {
  const blocks = rawCaption.split(/^=+$/m);
  for (let i = 0; i < blocks.length; i++) if (blocks[i].includes(heading)) return blocks[i + 1] ?? '';
  return '';
};

// Baris catatan produksi tidak boleh ikut terkirim. Yang difilter:
//   "Panjang: ±1.100 karakter…", "Caption:", "Judul (kolom judul Reels):",
//   "Deskripsi (±640 karakter):", "HASHTAG", "CARA PAKAI", "BATAS KEJUJURAN".
const META_LINE = /^(Panjang\b[^:]*:|Caption\b[^:]*:\s*$|Judul\b[^:]*:\s*$|Deskripsi\b[^:]*:\s*$|HASHTAG\b|CARA PAKAI|BATAS KEJUJURAN)/i;

const stripMeta = (block) =>
  block
    .split('\n')
    .filter((l) => !META_LINE.test(l.trim()))
    .map((l) => l.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')) // CLI menolak control char
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Instagram/TikTok/Facebook: badan post. YouTube: judul + deskripsi terpisah. */
const captionFor = (platform) => {
  const block = blockOf(HEADING[platform]);
  if (!block) die(`blok "${HEADING[platform]}" tidak ada di caption`, 2);
  const lines = block.split('\n');
  // Toleran terhadap label berhias: "Judul (78 karakter):", "Deskripsi (±640 karakter):".
  // Ada juga bentuk dua baris — label di satu baris, judulnya di baris berikutnya:
  //     Judul (maks 100 karakter):
  //     Judi online makin kecil-kecil: ...
  // Keduanya harus terbaca, dan baris judul tidak boleh ikut masuk ke badan post.
  const isLabel = (l) => /^Judul\b[^:]*:\s*$/i.test(l.trim());
  const tIdx = lines.findIndex((l) => /^Judul\b[^:]*:/i.test(l.trim()));
  let title = '';
  let titleLineConsumed = -1;
  if (tIdx > -1) {
    const inline = lines[tIdx].replace(/^Judul\b[^:]*:\s*/i, '').trim();
    if (inline) {
      title = inline;
      titleLineConsumed = tIdx;
    } else {
      const nextIdx = lines.findIndex((l, i) => i > tIdx && l.trim());
      if (nextIdx > -1) {
        title = lines[nextIdx].trim();
        titleLineConsumed = nextIdx;
      } else {
        titleLineConsumed = tIdx;
      }
    }
  }
  if (title.length > 100) console.error(`[peringatan] judul ${title.length} char — batas YouTube 100.`);

  const descLine = lines.findIndex((l) => /^Deskripsi\b[^:]*:/i.test(l.trim()));
  let body;
  if (descLine > -1) {
    body = lines.slice(descLine + 1).join('\n');
  } else {
    body = lines
      .filter((l, i) => i !== titleLineConsumed && !isLabel(l))
      .filter((l) => !/^Judul\b[^:]*:/i.test(l.trim()))
      .join('\n');
  }
  return { text: stripMeta(body), title };
};

/** Blok KOMENTAR PERTAMA -> firstComment (didukung Instagram & Facebook). */
const firstCommentOf = () => {
  const blocks = rawCaption.split(/^=+$/m);
  const idx = blocks.findIndex((b) => b.includes('KOMENTAR PERTAMA'));
  return idx > -1 ? stripMeta(blocks[idx + 1] ?? '') : '';
};
const FIRST_COMMENT = firstCommentOf();
// Komentar pertama adalah fitur berbayar Buffer: pada paket gratis, API menolak
// SELURUH post dengan "First comment requires a paid plan". Karena sumber angka
// sudah ada di badan caption, fitur ini dimatikan secara bawaan.
const USE_FIRST_COMMENT = process.env.BUFFER_FIRST_COMMENT === '1';

/* ------------------------------------------------------------------ mode --dump */
// Mencetak PERSIS teks yang akan terkirim, tanpa jaringan. Dipakai untuk memeriksa
// caption sebelum dijadwalkan — lebih murah daripada menemukan "Caption:" ikut tayang.
if (process.argv.includes('--dump')) {
  for (const platform of PLATFORMS) {
    const cap = captionFor(platform);
    console.log(`\n===================== ${platform.toUpperCase()} =====================`);
    if (cap.title) console.log(`judul (${cap.title.length} char): ${cap.title}`);
    console.log(`teks  (${cap.text.length} char):`);
    console.log(cap.text);
  }
  console.log(`\n===================== KOMENTAR PERTAMA (${FIRST_COMMENT.length} char) =====================`);
  console.log(FIRST_COMMENT);
  process.exit(0);
}

/* ------------------------------------------------------------------ buffer cli */
const runBuffer = (args) => {
  const r = spawnSync('buffer', [...args, '--output', 'json'], {
    encoding: 'utf8',
    env: { ...process.env, BUFFER_API_KEY: API_KEY },
  });
  let json = null;
  try {
    json = r.stdout?.trim() ? JSON.parse(r.stdout) : null;
  } catch {
    json = null;
  }
  return { status: r.status ?? 1, json, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() };
};

const preflight = runBuffer(['--version']);
if (preflight.status !== 0) die('CLI buffer tidak ditemukan. Jalankan: npm i -g @bufferapp/cli');

const configValue = (key) => {
  const r = runBuffer(['config', 'get', key]);
  return r.status === 0 ? (r.json?.value ?? null) : null;
};

/**
 * organizationId dengan urutan: env -> config `buffer init` -> temukan sendiri.
 * Penemuan otomatis penting untuk CI, di mana `buffer init` tidak pernah dijalankan
 * dan menambah satu secret lagi hanya menambah titik gagal.
 */
const resolveOrgId = () => {
  if (process.env.BUFFER_ORGANIZATION_ID) return { id: process.env.BUFFER_ORGANIZATION_ID, how: 'dari environment' };
  const fromCfg = configValue('organizationId');
  if (fromCfg) return { id: fromCfg, how: 'dari config buffer init' };

  const r = runBuffer(['account', '--fields', 'organizations.id,organizations.name']);
  if (r.status !== 0 || !r.json) return null;
  const orgs = r.json?.account?.organizations ?? r.json?.organizations ?? [];
  if (!orgs.length) return null;
  if (orgs.length > 1) {
    console.error(`[info] akun punya ${orgs.length} organisasi; memakai yang pertama. Set BUFFER_ORGANIZATION_ID untuk memilih.`);
  }
  return { id: orgs[0].id, how: `otomatis dari buffer account (${orgs[0].name ?? orgs[0].id})` };
};

/* ------------------------------------------------------------------ git & URL media */
const git = (args) => {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
};

const remoteUrl = git(['remote', 'get-url', 'origin']);
const m = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
const OWNER = m?.[1];
const REPO = m?.[2];
// Di CI checkout bersifat detached, `--abbrev-ref HEAD` menghasilkan "HEAD" —
// jatuh ke SHA commit supaya URL raw tetap menunjuk revisi yang benar.
const _br = (git(['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim();
const BRANCH = _br && _br !== 'HEAD' ? _br : (git(['rev-parse', 'HEAD']) || 'main').trim();

const relPathFromRepoRoot = () => {
  const repoRoot = path.resolve(ROOT, '..');
  return path.relative(repoRoot, FILE.video).split(path.sep).join('/');
};

const deriveMediaUrl = () => {
  if (process.env.MEDIA_URL) return { url: process.env.MEDIA_URL, how: 'MEDIA_URL dari environment' };
  if (!OWNER || !REPO) die('tidak bisa membaca owner/repo dari `git remote -v`. Set MEDIA_URL manual.');

  if (MEDIA_PROVIDER === 'raw') {
    return { url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${relPathFromRepoRoot()}`, how: `raw.githubusercontent (${BRANCH})` };
  }
  if (MEDIA_PROVIDER === 'pages') {
    return { url: `https://${OWNER.toLowerCase()}.github.io/${REPO}/${relPathFromRepoRoot()}`, how: 'GitHub Pages' };
  }
  // release: aset tidak masuk riwayat git, URL stabil, dan tidak membengkakkan clone
  const tag = `media-${MISSION}`;
  const assetName = path.basename(FILE.video);
  const url = `https://github.com/${OWNER}/${REPO}/releases/download/${tag}/${assetName}`;
  return { url, how: `GitHub Release "${tag}"`, tag, assetName };
};

/** Pastikan URL benar-benar bisa diambil publik, ukurannya sama, dan tipenya video. */
const verifyMediaUrl = async (url) => {
  let res;
  try {
    res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  } catch (e) {
    return { ok: false, why: `tidak bisa dihubungi: ${e.message}` };
  }
  if (!res.ok) return { ok: false, why: `HTTP ${res.status}` };
  const type = res.headers.get('content-type') ?? '';
  const len = Number(res.headers.get('content-length') ?? 0);
  const sizeOk = !len || Math.abs(len - videoBytes) / videoBytes < 0.01;
  const typeOk = type.startsWith('video/') || type.includes('octet-stream');
  return {
    ok: sizeOk && typeOk,
    type,
    len,
    warning: typeOk && !type.startsWith('video/') ? `content-type "${type}" — sebagian platform menolak selain video/*` : '',
    why: !sizeOk ? `ukuran di server ${len} B ≠ lokal ${videoBytes} B (berkas belum terunggah penuh?)` : !typeOk ? `content-type "${type}" bukan video` : '',
  };
};

/* ------------------------------------------------------------------ metadata per layanan */
const buildPayload = (platform, channelId, cap, mediaUrl) => {
  const base = { channelId, schedulingType: 'automatic', mode: MODE, text: cap.text };
  if (MODE === 'customScheduled') {
    if (!DUE_AT) die('MODE=customScheduled butuh DUE_AT (ISO-8601 dengan offset)', 2);
    base.dueAt = DUE_AT;
  }
  const assets = mediaUrl
    ? [{ video: { url: mediaUrl, ...(THUMB_OFFSET ? { metadata: { thumbnailOffset: THUMB_OFFSET } } : {}) } }]
    : [];

  switch (platform) {
    case 'instagram':
      base.metadata = {
        instagram: { type: 'reel', shouldShareToFeed: true, ...(USE_FIRST_COMMENT && FIRST_COMMENT ? { firstComment: FIRST_COMMENT } : {}) },
      };
      if (assets.length) base.assets = assets;
      break;
    case 'facebook':
      base.metadata = { facebook: { type: 'reel', ...(USE_FIRST_COMMENT && FIRST_COMMENT ? { firstComment: FIRST_COMMENT } : {}) } };
      if (assets.length) base.assets = assets;
      break;
    case 'youtube':
      base.metadata = {
        youtube: {
          title: (cap.title || cap.text.split('\n')[0]).slice(0, 100),
          categoryId: process.env.YOUTUBE_CATEGORY_ID ?? '27', // 27 = Education
          privacy: 'public',
          madeForKids: false,
        },
      };
      if (assets.length) base.assets = assets;
      break;
    case 'tiktok':
      if (assets.length) base.assets = assets;
      break;
    default:
      die(`platform tidak dikenal: ${platform}`, 2);
  }
  return base;
};

/* ------------------------------------------------------------------ kanal */
/**
 * Cari larik kanal tanpa mengandalkan satu nama kunci tertentu.
 * Bentuk keluaran CLI bisa `items` atau `channels`, dan `--fields` yang salah
 * ucap membuat panggilan gagal sebelum data apa pun dikembalikan.
 */
const findChannelArray = (node, depth = 0) => {
  if (!node || typeof node !== 'object' || depth > 6) return null;
  if (Array.isArray(node) && node.length && node.every((x) => x && typeof x === 'object' && ('id' in x || 'channelId' in x) && ('service' in x || 'channelType' in x))) return node;
  for (const v of Object.values(node)) {
    const hit = findChannelArray(v, depth + 1);
    if (hit) return hit;
  }
  return null;
};

const resolveChannels = (orgId) => {
  const r = runBuffer(['channels', 'list', '--organization-id', orgId]);
  if (r.status !== 0 || !r.json) die(`gagal membaca daftar kanal (exit ${r.status}). ${r.err.slice(0, 200)}`);
  const arr = r.json.items ?? r.json.channels ?? findChannelArray(r.json) ?? [];
  return arr.map((c) => ({
    id: c.id ?? c.channelId,
    service: c.service ?? c.channelType,
    name: c.name ?? c.displayName ?? c.handle ?? '',
  }));
};

/** Deteksi post kembar (posts create tidak idempoten). */
const alreadyPosted = (orgId, text) => {
  const r = runBuffer(['posts', 'list', '--organization-id', orgId, '--fields', 'items.{id,text,createdAt,channelId}']);
  if (r.status !== 0 || !r.json) return null;
  const head = text.slice(0, 60);
  return (r.json.items ?? []).find((it) => (it.text ?? '').slice(0, 60) === head) ?? null;
};

/* ------------------------------------------------------------------ main */
const main = async () => {
  console.log(`\n=== Buffer publish · ${MISSION} ===`);
  console.log(`video   : ${path.relative(ROOT, FILE.video)} (${(videoBytes / 1e6).toFixed(2)} MB)`);
  console.log(`sampul  : ${path.relative(ROOT, FILE.thumb)} — tidak dikirim lewat API (ditolak schema)`);
  console.log(`mode    : ${MODE}${MODE === 'customScheduled' ? ` @ ${DUE_AT}` : ''}`);
  console.log(`platform: ${PLATFORMS.join(', ')}`);
  console.log(`kirim   : ${SEND ? 'YA (--send)' : 'tidak (validasi saja)'}\n`);

  /* --- 1. media URL --- */
  const media = deriveMediaUrl();
  let mediaOk = true;
  if (media.tag) {
    // pastikan aset release sudah ada; kalau belum, unggah sekarang (butuh gh + hak tulis repo)
    const exists = spawnSync('gh', ['release', 'view', media.tag, '--json', 'assets'], { cwd: ROOT, encoding: 'utf8' });
    const hasAsset = exists.status === 0 && (JSON.parse(exists.stdout || '{"assets":[]}').assets ?? []).some((a) => a.name === media.assetName);
    if (!hasAsset) {
      if (!SEND) {
        console.log(`[info] aset rilis "${media.tag}" belum ada. Saat --send, script akan menjalankannya:`);
        console.log(`       gh release create ${media.tag} --title "Media ${MISSION}" --notes "aset video ${MISSION}"`);
        console.log(`       gh release upload ${media.tag} ${path.relative(ROOT, FILE.video)}\n`);
      } else {
        const create = spawnSync('gh', ['release', 'create', media.tag, '--title', `Media ${MISSION}`, '--notes', `Aset video ${MISSION}`, '--latest=false'], { cwd: ROOT, encoding: 'utf8' });
        if (create.status !== 0 && !/already exists/i.test(create.stderr ?? '')) die(`gagal membuat release: ${create.stderr}`);
        const upload = spawnSync('gh', ['release', 'upload', media.tag, path.relative(ROOT, FILE.video)], { cwd: ROOT, encoding: 'utf8' });
        if (upload.status !== 0 && !/already exists/i.test(upload.stderr ?? '')) die(`gagal unggah aset: ${upload.stderr}`);
        console.log(`✓ aset video diunggah ke release ${media.tag}`);
      }
    }
  }
  console.log(`media   : ${media.url}`);
  console.log(`          (${media.how})`);
  if (SEND) {
    const v = await verifyMediaUrl(media.url);
    if (!v.ok) {
      mediaOk = false;
      console.log(`✗ verifikasi URL GAGAL: ${v.why}`);
      console.log('  Perbaiki URL ini dulu — Buffer juga akan gagal mengunduhnya.\n');
    } else {
      console.log(`✓ URL publik OK (${v.type || 'content-type tidak dikirim'}, ${v.len || '?'} B)`);
      if (v.warning) console.log(`  ⚠ ${v.warning}`);
      console.log('');
    }
  } else {
    console.log('');
  }

  /* --- 2. organisasi & kanal --- */
  const orgInfo = resolveOrgId();
  const orgId = orgInfo?.id;
  if (orgId) console.log(`org     : ${orgId} (${orgInfo.how})`);
  if (!orgId) {
    console.error('✗ organizationId belum diketahui. Jalankan `buffer init` sekali, atau set BUFFER_ORGANIZATION_ID.\n');
    if (!SEND) {
      console.log('Masih bisa memvalidasi bentuk payload dengan channel placeholder:\n');
      return validateOnly();
    }
    process.exit(3);
  }

  const channels = resolveChannels(orgId);
  if (!channels.length) die('tidak ada kanal di organisasi ini');

  const results = [];
  for (const platform of PLATFORMS) {
    const ch = channels.find((c) => String(c.service).toLowerCase().includes(platform));
    if (!ch) {
      results.push({ platform, status: 'SKIP', detail: `tidak ada kanal ${platform}` });
      continue;
    }
    const cap = captionFor(platform);
    const payload = buildPayload(platform, ch.id, cap, mediaOk || !SEND ? media.url : null);

    const dry = runBuffer(['posts', 'create', '--json', JSON.stringify(payload), '--dry-run']);
    if (dry.status !== 0) {
      results.push({ platform, status: 'INVALID', detail: (dry.out || dry.err).slice(0, 120) });
      continue;
    }
    if (!SEND) {
      results.push({ platform, status: 'VALID', detail: `${cap.text.length} char · ${path.basename(String(ch.name))}` });
      continue;
    }

    const dup = alreadyPosted(orgId, cap.text);
    if (dup) {
      results.push({ platform, status: 'SKIP', detail: `post serupa sudah ada (${dup.id})` });
      continue;
    }

    const sent = runBuffer(['posts', 'create', '--json', JSON.stringify(payload)]);
    if (sent.status !== 0) {
      results.push({ platform, status: 'GAGAL', detail: (sent.out || sent.err).slice(0, 160) });
      continue;
    }
    const post = sent.json?.post ?? sent.json?.idea ?? sent.json;
    results.push({ platform, status: 'TERKIRIM', detail: post?.id ? `id ${post.id}` : JSON.stringify(sent.json).slice(0, 80) });
  }

  console.log('=== ringkasan ===');
  for (const r of results) console.log(`${r.status.padEnd(9)} ${r.platform.padEnd(10)} ${r.detail}`);
  const bad = results.filter((r) => ['GAGAL', 'INVALID'].includes(r.status));
  console.log('');
  if (bad.length) {
    console.log('JANGAN mengulang buta: `posts create` tidak idempoten.');
    console.log('Periksa dulu:  buffer posts list --organization-id ' + orgId + ' --fields items.{id,text,createdAt}');
  }
  process.exit(bad.length ? 3 : 0);
};

/** Tanpa jaringan/organisasi: bangun payload dengan channel placeholder lalu validasi. */
const validateOnly = () => {
  const results = [];
  for (const platform of PLATFORMS) {
    const cap = captionFor(platform);
    const payload = buildPayload(platform, 'channel_placeholder', cap, 'https://example.com/video.mp4');
    const dry = runBuffer(['posts', 'create', '--json', JSON.stringify(payload), '--dry-run']);
    results.push({
      platform,
      status: dry.status === 0 ? 'VALID' : 'INVALID',
      detail: dry.status === 0 ? `${cap.text.length} char` : (dry.out || dry.err).slice(0, 120),
    });
  }
  console.log('=== validasi bentuk payload (tanpa jaringan) ===');
  for (const r of results) console.log(`${r.status.padEnd(8)} ${r.platform.padEnd(10)} ${r.detail}`);
  process.exit(results.some((r) => r.status === 'INVALID') ? 2 : 0);
};

main().catch((e) => die(e.stack ?? String(e), 1));
