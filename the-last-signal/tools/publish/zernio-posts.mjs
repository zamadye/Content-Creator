#!/usr/bin/env node
/**
 * zernio-posts.mjs — pembaca status terbit (read-only).
 *
 * Dipakai untuk memastikan apa yang benar-benar terjadi pada sebuah unggahan,
 * bukan menebak dari HTTP 201. Mencetak post terakhir beserta status platform
 * dan URL-nya sebagai anotasi.
 *
 *   node zernio-posts.mjs [--limit 5] [--post POST_ID]
 */

import { readKey, notice, warn, describeError, loadSdk } from './lib/zernio.mjs';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const limit = Number(arg('limit', '5'));
const postId = arg('post');

const key = readKey();
if (!key) {
  notice('::error::Secret Zernio tidak tersedia.');
  process.exit(2);
}

const Zernio = await loadSdk();
const zernio = new Zernio({ apiKey: key.value });

function summarize(post) {
  const platforms = (post.platforms ?? post.results ?? []).map((entry) => ({
    platform: entry?.platform ?? null,
    status: entry?.status ?? null,
    url: entry?.platformPostUrl ?? entry?.url ?? null,
    id: entry?.platformPostId ?? entry?.postId ?? entry?.platformVideoId ?? null,
    error: entry?.error ?? entry?.errorMessage ?? null,
  }));
  return {
    id: post._id ?? post.id ?? null,
    status: post.status ?? null,
    createdAt: post.createdAt ?? null,
    publishedAt: post.publishedAt ?? post.scheduledFor ?? null,
    title: post.title ?? null,
    content: typeof post.content === 'string' ? post.content.slice(0, 60) : null,
    metadata: post.metadata ?? null,
    platforms,
  };
}

try {
  if (postId) {
    const { data } = await zernio.posts.getPost({ path: { postId } });
    const summary = summarize(data?.post ?? data ?? {});
    notice(`::notice title=POST::${JSON.stringify(summary)}`);
  } else {
    const { data } = await zernio.posts.listPosts({ query: { limit } });
    const posts = data?.posts ?? data?.data ?? [];
    notice(`Ditemukan ${posts.length} post terakhir.`);
    for (const post of posts) {
      const summary = summarize(post);
      notice(`::notice title=POST-${summary.id}::${JSON.stringify(summary)}`);
    }
    if (posts.length === 0) warn('Tidak ada post di akun Zernio ini.');
  }
} catch (error) {
  notice(`::error::Gagal membaca post: ${describeError(error)}`);
  process.exit(1);
}
