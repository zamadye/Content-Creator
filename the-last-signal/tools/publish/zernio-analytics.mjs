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
// --all: tarik angka untuk semua episode yang sudah terbit, satu baris ringkas
// per episode, supaya bisa dibandingkan tanpa membuka satu-satu.
const all = process.argv.includes('--all');

import { readdirSync } from 'node:fs';

/** Semua episode yang sudah terbit, dibaca dari berkas antrean. */
function publishedEpisodes() {
  const queueDir = resolve(HERE, '../../publish-queue');
  if (!existsSync(queueDir)) return [];
  return readdirSync(queueDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(resolve(queueDir, file), 'utf8')))
    .filter((entry) => entry.status === 'published' && entry.videoId)
    .sort((a, b) => String(a.publishedAt).localeCompare(String(b.publishedAt)));
}

if (!all && !videoId && !postId) {
  notice('::error::Pakai --video <youtubeId>, --post <zernioPostId>, atau --all.');
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

/** Ambil analytics satu video dan tulis laporannya. */
async function analyse(target) {
  const report = {
    episodeId: target.episodeId,
    videoId: target.videoId,
    postId: target.postId ?? null,
    publishedAt: target.publishedAt ?? null,
    fetchedAt: new Date().toISOString(),
    accountId,
    retention: null,
    dailyViews: null,
    post: null,
    notes: [],
  };

  if (accountId && target.videoId) {
    try {
      const { data } = await zernio.analytics.getYouTubeVideoRetention({
        query: { accountId, videoId: target.videoId },
      });
      report.retention = data ?? null;
    } catch (error) {
      report.notes.push(`retention: ${describeError(error)}`);
    }

    try {
      const { data } = await zernio.analytics.getYouTubeDailyViews({
        query: { accountId, videoId: target.videoId },
      });
      report.dailyViews = data ?? null;
    } catch (error) {
      report.notes.push(`dailyViews: ${describeError(error)}`);
    }
  } else {
    report.notes.push('accountId atau videoId tidak tersedia — analytics tidak diambil.');
  }

  if (target.postId) {
    try {
      const { data } = await zernio.analytics.getAnalytics({
        query: { postId: target.postId, platform: 'youtube' },
      });
      report.post = data ?? null;
    } catch (error) {
      report.notes.push(`postAnalytics: ${describeError(error)}`);
    }
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(resolve(REPORT_DIR, `analytics-${target.episodeId}.json`), `${JSON.stringify(report, null, 2)}\n`);

  const summary = {
    views: report.dailyViews?.totalViews ?? null,
    averageViewPercentage: report.retention?.averageViewPercentage ?? null,
    averageViewDuration: report.retention?.averageViewDuration ?? null,
    likes: report.post?.analytics?.likes ?? null,
    comments: report.post?.analytics?.comments ?? null,
    notes: report.notes,
  };
  notice(`::notice title=ANALYTICS-${target.episodeId}::${JSON.stringify(summary)}`);
  return { report, summary };
}

if (all) {
  const episodes = publishedEpisodes();
  notice(`Menganalisis ${episodes.length} episode terbit.`);
  for (const entry of episodes) {
    await analyse({
      episodeId: entry.episodeId,
      videoId: entry.videoId,
      postId: entry.postId ?? entry.zernioPostId ?? null,
      publishedAt: entry.publishedAt ?? null,
    });
  }
} else {
  await analyse({ episodeId, videoId, postId, publishedAt: arg('published') });
}

// Belum ada data bukan kegagalan: YouTube memfinalkan analytics dengan jeda.
process.exit(0);
