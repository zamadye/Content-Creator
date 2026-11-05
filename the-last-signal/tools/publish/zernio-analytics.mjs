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
    .filter((entry) => entry.status === 'published')
    .map((entry) => ({
      ...entry,
      // Bentuk lama: id tersimpan di youtube.videoId, bukan di akar berkas.
      videoId: entry.videoId ?? entry.youtube?.videoId ?? null,
      postId: entry.postId ?? entry.zernioPostId ?? null,
    }))
    .filter((entry) => entry.videoId)
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

  // Angka tayangan yang benar ada di metrik post, bukan di dailyViews:
  // dailyViews hanya mencakup rentang tanggal yang sudah difinalkan YouTube.
  const metrics = report.post?.analytics ?? report.post?.metrics ?? report.post ?? {};
  const pick = (keys) => {
    for (const key of keys) {
      const value = metrics?.[key];
      if (value !== undefined && value !== null) return value;
    }
    return null;
  };
  const summary = {
    views: pick(['views', 'viewCount', 'totalViews']),
    impressions: pick(['impressions', 'thumbnailImpressions']),
    averageViewDuration: pick(['averageViewDuration', 'averageWatchTime']),
    averageViewPercentage: report.retention?.averageViewPercentage ?? pick(['averageViewPercentage']),
    likes: pick(['likes', 'likeCount']),
    comments: pick(['comments', 'commentCount']),
    shares: pick(['shares', 'shareCount']),
    subscribersGained: pick(['subscribersGained', 'subscribers']),
    completionRate: pick(['completionRate']),
    replays: pick(['replays']),
    reelsSkipRate: pick(['reelsSkipRate']),
    videoDurationSeconds: pick(['videoDurationSeconds']),
    retentionCurve: Array.isArray(metrics?.retentionCurve)
      ? metrics.retentionCurve.slice(0, 40).map((point, index) => {
          const value = typeof point === 'number' ? point : point?.audienceWatchRatio ?? point?.value ?? null;
          const at = typeof point === 'object' && point !== null ? point?.elapsedVideoTimeRatio ?? null : null;
          return [at !== null ? Number(Number(at).toFixed(2)) : index, value !== null ? Number(Number(value).toFixed(3)) : null];
        })
      : null,
    notes: report.notes,
  };
  // Satu anotasi per episode cepat kena batas 10 anotasi per langkah, jadi
  // ringkasannya hanya dikumpulkan di sini dan dikirim sebagai satu baris.
  return { report, summary };
}

const collected = [];

if (all) {
  const episodes = publishedEpisodes();
  notice(`Menganalisis ${episodes.length} episode terbit.`);
  for (const entry of episodes) {
    notice(`Menganalisis ${entry.episodeId} (${entry.videoId})`);
    try {
      const result = await analyse({
      episodeId: entry.episodeId,
      videoId: entry.videoId,
      postId: entry.postId,
        publishedAt: entry.publishedAt ?? null,
      });
      collected.push({ episode: entry.episodeId, ...result.summary, keys: undefined });
    } catch (error) {
      collected.push({ episode: entry.episodeId, error: describeError(error) });
    }
  }
} else {
  const result = await analyse({ episodeId, videoId, postId, publishedAt: arg('published') });
  collected.push({ episode: episodeId, ...result.summary, keys: undefined });
}

notice(`::notice title=ANALYTICS-ALL::${JSON.stringify(collected)}`);

// Belum ada data bukan kegagalan: YouTube memfinalkan analytics dengan jeda.
process.exit(0);
