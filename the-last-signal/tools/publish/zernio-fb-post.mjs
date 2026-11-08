#!/usr/bin/env node
/**
 * zernio-fb-post.mjs — terbitkan POST FACEBOOK (bukan Reel, bukan YouTube).
 *
 * Kenapa berkas ini ada (arahan pemilik kanal, 8 Nov 2026):
 * Facebook dan YouTube punya mekanisme yang berbeda. Di YouTube semua harus
 * berupa video 9:16 yang bertahan 2 detik pertama; di Facebook justru sebaliknya
 * — post teks dengan satu atau dua foto bisa menyampaikan cerita yang sama
 * tanpa penonton harus menonton. Karena itu cerita yang sama dilahirkan dua
 * kali: Reel untuk YouTube, post caption untuk Halaman Facebook.
 *
 * Tiga bentuk post yang didukung:
 *   text      — caption saja, tanpa media (cerita pendek / pengumuman)
 *   photo     — caption + 1 foto
 *   carousel  — caption + 2…10 foto (slideshow Facebook)
 *
 *   node zernio-fb-post.mjs --plan ../../fb-posts/FB-0001.json --dry-run
 *   node zernio-fb-post.mjs --plan ../../fb-posts/FB-0001.json
 *   node zernio-fb-post.mjs --dir ../../fb-posts          # semua status=requested
 *
 * Jadwal: kalau `scheduledFor` ada, Zernio yang menayangkan (publishNow=false).
 * Kalau tidak ada, post terbit saat itu juga.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SIGNAL_ROOT = resolve(HERE, "../..");
const REPO_ROOT = resolve(SIGNAL_ROOT, "..");
const REPORT_DIR = join(SIGNAL_ROOT, "report");

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const dryRun = process.argv.includes("--dry-run");
const log = (m) => console.log(`[fb] ${m}`);
const notice = (m) => console.log(`::notice::${String(m).replace(/\r?\n/g, " | ")}`);

/** Batas Facebook yang membuat post ditolak SEBELUM ada byte terunggah. */
const CAPTION_MAX = 63206; // batas caption feed Facebook
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per foto
const CAROUSEL_MAX = 10; // foto per post multi-foto
const ALLOWED = new Set([".jpg", ".jpeg", ".png"]);

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function loadPlan(path) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return { path, raw };
}

/**
 * Jalur boleh ditulis relatif terhadap direktori kerja (cara workflow memanggil
 * skrip, yaitu dari tools/publish) atau terhadap akar repo (cara berkas rencana
 * menulis asetnya: `the-last-signal/...`). Dua kandidat dicoba berurutan — dulu
 * hanya cwd, sehingga `--dir the-last-signal/fb-posts` mencari folder yang tidak
 * pernah ada di dalam tools/publish.
 */
function resolvePath(value) {
  if (isAbsolute(value)) return value;
  const fromRepo = resolve(REPO_ROOT, value);
  if (existsSync(fromRepo)) return fromRepo;
  return resolve(process.cwd(), value);
}

function collectPlans() {
  const dir = arg("dir");
  if (dir) {
    const abs = resolvePath(dir);
    if (!existsSync(abs)) fail(`folder rencana tidak ada: ${abs}`);
    return readdirSync(abs)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(abs, f))
      .map(loadPlan);
  }
  const plan = arg("plan");
  if (!plan) fail("Pakai: --plan <berkas.json> atau --dir <folder>");
  const abs = resolvePath(plan);
  if (!existsSync(abs)) fail(`berkas rencana tidak ada: ${abs}`);
  return [loadPlan(abs)];
}

/** Jalur aset di dalam rencana relatif terhadap akar repo. */
function resolveAsset(rel) {
  const abs = resolvePath(rel);
  if (!existsSync(abs)) fail(`aset tidak ada: ${rel}`);
  return abs;
}

const mimeOf = (path) => {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  return "image/jpeg";
};

/** Periksa satu rencana. Mengembalikan daftar masalah (kosong = lolos). */
function checkPlan(raw) {
  const problems = [];
  const kind = String(raw.kind ?? "text");
  const caption = String(raw.caption ?? "").trim();
  const images = Array.isArray(raw.images) ? raw.images : [];

  if (!caption) problems.push("caption kosong — post Facebook tanpa teks tidak punya cerita");
  if (caption.length > CAPTION_MAX) problems.push(`caption ${caption.length} karakter (maks ${CAPTION_MAX})`);
  if (!["text", "photo", "carousel"].includes(kind)) problems.push(`kind tidak dikenal: ${kind}`);

  if (kind === "text" && images.length) problems.push("kind=text tapi ada images — pilih photo/carousel");
  if (kind === "photo" && images.length !== 1) problems.push(`kind=photo butuh tepat 1 foto (ada ${images.length})`);
  if (kind === "carousel" && (images.length < 2 || images.length > CAROUSEL_MAX)) {
    problems.push(`kind=carousel butuh 2–${CAROUSEL_MAX} foto (ada ${images.length})`);
  }

  for (const rel of images) {
    const abs = resolveAsset(rel);
    const ext = abs.slice(abs.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED.has(ext)) problems.push(`format foto tidak didukung: ${rel}`);
    const size = statSync(abs).size;
    if (size > IMAGE_MAX_BYTES) problems.push(`foto ${(size / 1048576).toFixed(1)} MB melebihi 10 MB: ${rel}`);
  }

  // Baris pertama caption adalah yang terlihat sebelum "Lihat selengkapnya"
  // (±125 karakter). Kalau baris pertama hanya sapaan, ceritanya tidak terbaca.
  const firstLine = caption.split(/\n/)[0] ?? "";
  if (firstLine.length > 125 && kind !== "text") {
    problems.push(`baris pertama ${firstLine.length} karakter — Facebook memotong setelah ±125, taruh hook di baris pertama`);
  }

  return problems;
}

async function main() {
  const plans = collectPlans();
  const runnable = plans.filter(({ raw }) => {
    const status = String(raw.status ?? "held");
    if (["published", "scheduled"].includes(status)) {
      log(`${raw.id}: sudah ${status} — dilewati`);
      return false;
    }
    return status === "requested" || dryRun;
  });

  if (!runnable.length) {
    notice("Tidak ada rencana berstatus requested — tidak ada yang diterbitkan.");
    return;
  }

  let failed = 0;
  const results = [];

  for (const { path, raw } of runnable) {
    const id = String(raw.id ?? "?");
    const problems = checkPlan(raw);
    if (problems.length) {
      problems.forEach((p) => console.error(`::error::${id}: ${p}`));
      failed += 1;
      results.push({ id, ok: false, problems });
      continue;
    }

    const kind = String(raw.kind ?? "text");
    const images = (raw.images ?? []).map((rel) => ({ rel, abs: resolveAsset(rel) }));
    log(`${id}: ${kind} · ${images.length} foto · ${String(raw.caption).length} karakter`);

    if (dryRun) {
      results.push({ id, ok: true, dryRun: true, kind, images: images.map((i) => i.rel) });
      continue;
    }

    const key = process.env.ZERNIO_API_KEY ?? process.env.ZERNIO_KEY;
    if (!key) fail("ZERNIO_API_KEY tidak tersedia di environment job ini.");

    const { default: Zernio } = await import("@zernio/node");
    const zernio = new Zernio({ apiKey: key });

    // ── akun Facebook ────────────────────────────────────────────────────
    let accountId = process.env.ZERNIO_FACEBOOK_ACCOUNT_ID || null;
    if (!accountId) {
      const { data } = await zernio.accounts.listAccounts({ query: { limit: 100 } });
      const accounts = Array.isArray(data) ? data : (data?.accounts ?? data?.data ?? []);
      const candidate = accounts.find(
        (a) => String(a.platform).toLowerCase() === "facebook" && /active|connected/i.test(String(a.status ?? "active")),
      );
      accountId = candidate?._id ?? candidate?.accountId ?? candidate?.id ?? null;
      if (!accountId) {
        const known = accounts.map((a) => a.platform).join(", ") || "kosong";
        fail(`${id}: tidak ada Halaman Facebook tersambung (akun: ${known}).`);
      }
      log(`${id}: memakai Halaman ${candidate?.username ?? candidate?.name ?? "(tanpa nama)"}`);
    }

    // ── unggah foto ──────────────────────────────────────────────────────
    const mediaItems = [];
    for (const image of images) {
      const buffer = readFileSync(image.abs);
      const mimeType = mimeOf(image.abs);
      const filename = `${id}-${image.rel.split("/").pop()}`;
      const { data: presign } = await zernio.media.getMediaPresignedUrl({
        body: { filename, contentType: mimeType, size: buffer.byteLength },
      });
      if (!presign?.uploadUrl || !presign?.publicUrl) throw new Error(`${id}: respons presign tidak lengkap`);
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: buffer,
        headers: { "Content-Type": mimeType, "Content-Length": String(buffer.byteLength) },
      });
      if (!put.ok) throw new Error(`${id}: PUT foto gagal HTTP ${put.status}`);
      mediaItems.push({ url: presign.publicUrl, type: "image", mimeType });
      log(`${id}: foto terunggah (${filename}, ${(buffer.byteLength / 1024).toFixed(0)} KB)`);
    }

    // ── buat post ────────────────────────────────────────────────────────
    const scheduledFor = raw.scheduledFor ?? null;
    const timezone = raw.timezone ?? "Asia/Makassar";
    const body = {
      content: String(raw.caption),
      ...(mediaItems.length ? { mediaItems } : {}),
      platforms: [
        {
          platform: "facebook",
          accountId,
          platformSpecificData: {
            // Tanpa contentType: post feed biasa. 'reel'/'story' hanya untuk video.
            ...(raw.firstComment ? { firstComment: String(raw.firstComment) } : {}),
          },
        },
      ],
      ...(scheduledFor
        ? { scheduledFor: String(scheduledFor), timezone, publishNow: false }
        : { publishNow: true }),
      metadata: { ...(raw.metadata ?? {}), fbPostId: id, kind },
    };

    try {
      const { data } = await zernio.posts.createPost({ body });
      const post = data?.post ?? data;
      const status = post?.status ?? (scheduledFor ? "scheduled" : "published");
      const url =
        post?.platformPostUrl ??
        (post?.platforms ?? [])?.find?.((p) => p?.platform === "facebook")?.url ??
        null;

      results.push({ id, ok: true, status, postId: post?._id ?? post?.id ?? null, url, scheduledFor });
      notice(`${id}: ${status}${url ? ` · ${url}` : ""}${scheduledFor ? ` · ${scheduledFor}` : ""}`);

      // Catat hasil di berkas rencana supaya tidak terkirim dua kali.
      const updated = {
        ...raw,
        status: status === "published" ? "published" : "scheduled",
        postId: post?._id ?? post?.id ?? null,
        url,
        publishedAt: status === "published" ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    } catch (error) {
      const message = error?.message ?? String(error);
      console.error(`::error::${id}: ${message}`);
      results.push({ id, ok: false, error: message });
      failed += 1;
    }
  }

  // Laporan mentah untuk artefak Actions (sama seperti jalur video).
  try {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(REPORT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
    writeFileSync(join(REPORT_DIR, `fb-${stamp}.json`), `${JSON.stringify({ results }, null, 2)}\n`, "utf8");
  } catch {
    /* laporan gagal ditulis bukan alasan menggagalkan penerbitan */
  }

  if (failed) {
    console.error(`::error::${failed} post Facebook gagal`);
    process.exit(1);
  }
  notice(`selesai: ${results.length} post diproses`);
}

main().catch((error) => fail(error?.stack ?? String(error)));
