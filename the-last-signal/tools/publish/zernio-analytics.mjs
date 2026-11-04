#!/usr/bin/env node
/**
 * zernio-analytics.mjs — tarik analytics YouTube untuk episode yang sudah terbit.
 *
 * Dijalankan di GitHub Actions (Zernio tidak terjangkau dari sandbox).
 * Yang diambil: retensi penonton, tayangan harian, dan metrik post.
 * Tidak ada angka yang dikarang: kalau endpoint belum punya data (YouTube
 * memfinalkan analytics dengan jeda ~3 hari), kolomnya dibiarkan null dan
 * dilaporkan sebagai "belum tersedia".
 *
 *   node zernio-analytics.mjs --video 8UnXLrjbDqE --episode LS-0001 --post 6aeabf6b...
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readKey, notice, warn, describeError, loadSdk } from './lib/zernio.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = resolve(HERE, '../../report');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const videoId = arg('video');
const postId = arg('post');
const episodeId = arg('episode', videoId ?? 'unknown');

if (!videoId && !postId) {
  notice('::error::Pakai --video <youtubeId> atau --post <zernioPostId>.');
  process.exit(1);
}

const key = readKey();
if (!key) {
  notice('::error::Secret Zernio tidak tersedia.');
  process.exit(2);
}

const Zernio = await loadSdk();
const zernio = new Zernio({ apiKey: key.value });

let accountId = process.env.ZERNIO_YOUTUBE_ACCOUNT_ID ?? null;
if (!accountId) {
  try {
    const { data } = await zernio.accounts.listAccounts();
    const account = (data?.accounts ?? []).find((entry) => entry.platform === 'youtube');
    accountId = account?._id ?? account?.accountId ?? null;
  } catch (error) {
    warn(`Tidak bisa mencari accountId: ${describeError(error)}`);
  }
}

const report = {
  episodeId,
  videoId,
  postId,
  fetchedAt: new Date().toISOString(),
  accountId,
  retention: null,
  dailyViews: null,
  post: null,
  notes: [],
};

if (accountId && videoId) {
  try {
    const { data } = await zernio.analytics.getYouTubeVideoRetention({
      query: { accountId, videoId },
    });
    report.retention = data ?? null;
    notice(`Retensi ${videoId}: ${JSON.stringify(data).slice(0, 500)}`);
  } catch (error) {
    report.notes.push(`retention: ${describeError(error)}`);
    warn(`Retensi belum tersedia: ${describeError(error)}`);
  }

  try {
    const { data } = await zernio.analytics.getYouTubeDailyViews({ query: { accountId, videoId } });
    report.dailyViews = data ?? null;
    notice(`Tayangan harian ${videoId}: ${JSON.stringify(data).slice(0, 400)}`);
  } catch (error) {
    report.notes.push(`dailyViews: ${describeError(error)}`);
    warn(`Tayangan harian belum tersedia: ${describeError(error)}`);
  }
} else {
  report.notes.push('accountId atau videoId tidak tersedia — analytics tidak diambil.');
}

if (postId) {
  try {
    const { data } = await zernio.analytics.getAnalytics({ query: { postId, platform: 'youtube' } });
    report.post = data ?? null;
    notice(`Metrik post ${postId}: ${JSON.stringify(data).slice(0, 500)}`);
  } catch (error) {
    report.notes.push(`postAnalytics: ${describeError(error)}`);
    warn(`Metrik post belum tersedia: ${describeError(error)}`);
  }
}

mkdirSync(REPORT_DIR, { recursive: true });
const outPath = resolve(REPORT_DIR, `analytics-${episodeId}.json`);
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
notice(`::notice title=ANALYTICS-${episodeId}::${JSON.stringify({
  views: report.dailyViews?.totalViews ?? null,
  averageViewPercentage: report.retention?.averageViewPercentage ?? null,
  averageViewDuration: report.retention?.averageViewDuration ?? null,
  likes: report.post?.analytics?.likes ?? null,
  notes: report.notes,
})}`);
notice(`Laporan ditulis ke ${outPath}`);

// Belum ada data bukan kegagalan: YouTube memfinalkan analytics dengan jeda.
process.exit(0);
