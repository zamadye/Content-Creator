#!/usr/bin/env node
/**
 * PUBLISH TO BUFFER — automation for an upload package
 * ---------------------------------------------------
 * Takes the three deliverable files of a mission (mp4 + thumbnail + caption) and turns the
 * caption into a real Buffer post on the matching channel.
 *
 * What this script can and cannot do — read this before trusting it:
 *   - It talks to Buffer through the official CLI (@bufferapp/cli), so every call is a
 *     normal Buffer API call made with YOUR key. No scraping, no private endpoint.
 *   - The video asset is passed to Buffer as a **URL** (`assets[].video.url`). Buffer fetches
 *     the file itself, so the mp4 must already be reachable on the public internet.
 *     A local file path cannot be uploaded by this script — that is an API limitation.
 *   - The thumbnail PNG cannot be attached to a video post: the schema explicitly rejects
 *     `video.thumbnailUrl` ("social networks do not accept custom video thumbnail images").
 *     Upload the cover manually in the platform app if you need it.
 *
 * Usage
 *   MISSION=pinjol-bunga-harian-2026 PLATFORM=instagram MEDIA_URL=https://… mp4 \
 *     node pipeline/publish-buffer.mjs                 # dry-run by default
 *   … node pipeline/publish-buffer.mjs --send          # actually create the post
 *
 * Environment
 *   BUFFER_API_KEY            required (never stored in this repo)
 *   BUFFER_ORGANIZATION_ID    optional; falls back to `buffer config get organizationId`
 *   MEDIA_URL                 public URL of the mp4
 *   PLATFORM                  facebook | instagram | tiktok | youtube   (default: instagram)
 *   MODE                      shareNow | addToQueue | customScheduled   (default: addToQueue)
 *   DUE_AT                    ISO-8601 WITH offset, required for customScheduled
 *   CHANNEL_ID                optional; skips the lookup
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => path.join(ROOT, ...a);

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const MISSION = process.env.MISSION;
const PLATFORM = (process.env.PLATFORM ?? 'instagram').toLowerCase();
const MODE = process.env.MODE ?? 'addToQueue';
const MEDIA_URL = process.env.MEDIA_URL ?? '';
const DUE_AT = process.env.DUE_AT ?? '';
const SEND = flag('send');
const API_KEY = process.env.BUFFER_API_KEY;

if (!MISSION) {
  console.error('MISSION=<slug> wajib diisi');
  process.exit(2);
}
if (!API_KEY) {
  console.error('BUFFER_API_KEY belum diset. Ekspor dulu (jangan ditulis ke repo):');
  console.error('  export BUFFER_API_KEY=...');
  process.exit(4);
}

/* ---------------------------------------------------------------- caption */

const HEADING = {
  facebook: 'FACEBOOK REELS',
  instagram: 'INSTAGRAM REELS',
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE SHORTS',
};

/** Ambil satu blok platform dari caption_pinjol-...txt (dipisah baris '====='). */
const pickCaptionBlock = (raw, heading) => {
  const blocks = raw.split(/^=+$/m);
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].includes(heading)) return blocks[i + 1] ?? '';
  }
  return '';
};

/** Buang petunjuk internal (baris "Panjang:", "Judul:", "Deskripsi:") sebelum dikirim. */
const cleanCaption = (block) =>
  block
    .split('\n')
    .filter((l) => !/^(Panjang:|Judul:|Deskripsi:)/i.test(l.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const captionFile = p('deliverables', `caption_${MISSION}.txt`);
if (!fs.existsSync(captionFile)) {
  console.error(`caption tidak ditemukan: ${path.relative(ROOT, captionFile)}`);
  process.exit(2);
}
const rawCaption = fs.readFileSync(captionFile, 'utf8');
const heading = HEADING[PLATFORM];
if (!heading) {
  console.error(`PLATFORM harus salah satu: ${Object.keys(HEADING).join(', ')}`);
  process.exit(2);
}
const text = cleanCaption(pickCaptionBlock(rawCaption, heading));
if (!text) {
  console.error(`blok "${heading}" tidak ada di ${path.relative(ROOT, captionFile)}`);
  process.exit(2);
}

/* ---------------------------------------------------------------- buffer cli */

const buffer = (args, { quiet = false } = {}) => {
  const r = spawnSync('buffer', [...args, '--output', 'json'], {
    encoding: 'utf8',
    env: { ...process.env, BUFFER_API_KEY: API_KEY },
  });
  const out = (r.stdout ?? '').trim();
  const err = (r.stderr ?? '').trim();
  let json = null;
  try {
    json = out ? JSON.parse(out) : null;
  } catch {
    json = null;
  }
  if (!quiet && r.status !== 0) {
    console.error(`[buffer ${args[0]}] exit ${r.status}`);
    if (out) console.error(out.slice(0, 800));
    if (err) console.error(err.slice(0, 800));
  }
  return { status: r.status, json, out, err };
};

const readConfig = (key) => {
  const r = buffer(['config', 'get', key], { quiet: true });
  return r.status === 0 ? (r.json?.value ?? null) : null;
};

/* ---------------------------------------------------------------- target */

const SERVICE_OF = { facebook: 'facebook', instagram: 'instagram', tiktok: 'tiktok', youtube: 'youtube' };

const resolveChannel = () => {
  if (process.env.CHANNEL_ID) return { id: process.env.CHANNEL_ID, name: '(dari CHANNEL_ID)' };
  const orgId = process.env.BUFFER_ORGANIZATION_ID ?? readConfig('organizationId');
  if (!orgId) return { error: 'organizationId tidak diketahui: set BUFFER_ORGANIZATION_ID atau jalankan `buffer init`' };

  const r = buffer(['channels', 'list', '--organization-id', orgId, '--fields', 'items.{id,service,name}']);
  if (r.status !== 0 || !r.json) return { error: `gagal membaca daftar kanal (exit ${r.status})` };

  const items = r.json.items ?? [];
  const want = SERVICE_OF[PLATFORM];
  const hit = items.find((c) => String(c.service).toLowerCase().includes(want));
  if (!hit) {
    return {
      error: `tidak ada kanal ${PLATFORM} di organisasi ini. Kanal yang ada: ${items.map((c) => `${c.service}:${c.name}`).join(', ') || '(kosong)'}`,
    };
  }
  return hit;
};

/* ---------------------------------------------------------------- payload */

const buildPayload = (channelId) => {
  const payload = {
    channelId,
    schedulingType: 'automatic',
    mode: MODE,
    text,
  };
  if (MODE === 'customScheduled') {
    if (!DUE_AT) throw new Error('MODE=customScheduled butuh DUE_AT (ISO-8601 dengan offset, mis. 2026-11-05T19:00:00+08:00)');
    payload.mode = 'customScheduled';
    payload.dueAt = DUE_AT;
  }
  if (MEDIA_URL) payload.assets = [{ video: { url: MEDIA_URL } }];
  return payload;
};

/* ---------------------------------------------------------------- main */

const channel = (() => {
  const c = resolveChannel();
  if (c.error) {
    // Dry-run tetap berguna tanpa jaringan: pakai id placeholder supaya payload bisa divalidasi.
    if (!SEND) {
      console.error(`[peringatan] ${c.error}`);
      console.error('[peringatan] memakai CHANNEL_ID placeholder untuk validasi payload');
      return { id: 'channel_placeholder', name: '(placeholder)' };
    }
    console.error(`[gagal] ${c.error}`);
    process.exit(3);
  }
  return c;
})();

const payload = buildPayload(channel.id);

console.log(`misi      : ${MISSION}`);
console.log(`platform  : ${PLATFORM} -> kanal ${channel.name} (${channel.id})`);
console.log(`mode      : ${MODE}${DUE_AT && MODE === 'customScheduled' ? ` @ ${DUE_AT}` : ''}`);
console.log(`media     : ${MEDIA_URL || '(tanpa media — hanya teks)'}`);
console.log(`teks      : ${text.length} karakter, ${text.split('\n')[0].slice(0, 70)}…`);

const dry = buffer(['posts', 'create', '--json', JSON.stringify(payload), '--dry-run'], { quiet: true });
if (dry.status !== 0) {
  console.error(`[gagal] payload ditolak validasi lokal (exit ${dry.status})`);
  console.error((dry.out || dry.err).slice(0, 800));
  process.exit(2);
}
console.log('validasi  : OK (dry-run lokal, tidak ada panggilan API)');

if (!SEND) {
  console.log('\nTidak mengirim apa pun. Jalankan ulang dengan --send untuk membuat post.');
  console.log('Catatan: posts create TIDAK idempoten — kirim sekali, cek dulu sebelum mengulang.');
  process.exit(0);
}

const sent = buffer(['posts', 'create', '--json', JSON.stringify(payload)]);
if (sent.status !== 0) {
  console.error(`[gagal] posts create exit ${sent.status}`);
  console.error('JANGAN langsung ulangi. Periksa dulu: buffer posts list --organization-id <id> --fields items.{id,text,createdAt}');
  process.exit(sent.status ?? 3);
}
console.log('terkirim  :', JSON.stringify(sent.json).slice(0, 500));
