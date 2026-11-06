#!/usr/bin/env node
/**
 * zernio-admin.mjs — tindakan sekali pakai untuk post yang sudah terlanjur salah.
 *
 * Sandbox tidak bisa menghubungi zernio.com; semua tindakan harus lewat runner
 * Actions. Skrip ini dipanggil workflow `zernio-fix.yml`.
 *
 *   node zernio-admin.mjs --list
 *   node zernio-admin.mjs --delete <postId> [--delete <postId>...]
 *   node zernio-admin.mjs --dedupe-episode LS-0002   # simpan yang paling awal
 */
import Zernio from "@zernio/node";

const zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY ?? process.env.ZERNIO_KEY });
const args = process.argv.slice(2);

function values(name) {
  const out = [];
  args.forEach((value, index) => {
    if (value === `--${name}` && args[index + 1]) out.push(args[index + 1]);
  });
  return out;
}

async function listPosts(limit = 20) {
  const { data } = await zernio.posts.listPosts({ query: { limit } });
  return data?.posts ?? data?.data ?? [];
}

function summarize(post) {
  const facebook = (post.platforms ?? []).find((entry) => entry?.platform === "facebook");
  return {
    // Post memakai _id (gaya Mongo), bukan id. Percobaan pertama menghapus
    // "undefined" karena perbedaan itu.
    id: post._id ?? post.id,
    episodeId: post.metadata?.episodeId ?? "?",
    createdAt: post.createdAt,
    status: post.status,
    facebookUrl: facebook?.url ?? null,
    facebookId: facebook?.id ?? null,
  };
}

async function main() {
  const deletes = values("delete");
  const dedupeEpisodes = values("dedupe-episode");

  if (args.includes("--list")) {
    for (const post of await listPosts()) {
      const info = summarize(post);
      console.log(`::notice::${info.createdAt} | ${info.episodeId} | ${info.status} | ${info.id} | ${info.facebookUrl ?? ""}`);
    }
    return;
  }

  const targets = new Set(deletes);

  for (const episodeId of dedupeEpisodes) {
    const all = await listPosts();
    const matches = all
      .filter((post) => post.metadata?.episodeId === episodeId)
      // Post tanpa id tidak bisa dihapus; jangan pernah memasukkannya ke daftar
      // target (dulu ini berujung permintaan hapus "undefined").
      .filter((post) => typeof (post._id ?? post.id) === "string");
    for (const post of matches) {
      console.log(`::notice::kandidat ${episodeId}: ${post._id ?? post.id} ${post.createdAt} ${post.status}`);
    }
    // Simpan yang paling awal terbit — itu yang sudah dibagikan algoritma.
    const ordered = matches.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const idOf = (post) => post._id ?? post.id;
    for (const extra of ordered.slice(1)) {
      console.log(`::warning::duplikat ${episodeId}: ${idOf(extra)} (${extra.createdAt}) → dihapus; disimpan ${idOf(ordered[0])}`);
      targets.add(idOf(extra));
    }
    if (ordered.length <= 1) {
      console.log(`::warning::${episodeId}: tidak ada duplikat (${ordered.length} post terlihat)`);
      // Tanpa ini, "tidak ada duplikat" tidak bisa dibedakan dari "metadata-nya
      // tidak terbaca". Delapan post terakhir dicetak sebagai anotasi.
      for (const post of all.slice(0, 8)) {
        console.log(`::warning::lihat: ${post._id ?? post.id} | episode=${post.metadata?.episodeId ?? "-"} | ${post.createdAt} | ${post.status}`);
      }
    }
  }

  for (const postId of targets) {
    try {
      await zernio.posts.deletePost({ path: { postId } });
      console.log(`::notice::post ${postId} dihapus`);
    } catch (error) {
      console.log(`::error::gagal menghapus ${postId}: ${error?.message ?? error}`);
      process.exitCode = 1;
    }
  }

  if (!targets.size) console.log("tidak ada yang dihapus");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
