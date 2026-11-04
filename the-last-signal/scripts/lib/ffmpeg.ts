import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Cari binary ffmpeg: env var → ffmpeg sistem → ffmpeg bawaan Remotion.
 * Remotion membawa ffmpeg sendiri di paket @remotion/compositor-*, jadi server
 * tidak perlu memasang ffmpeg terpisah.
 */
const FULL_BUILD_CANDIDATES = [
  "/tmp/ffmpeg-full",
  "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2",
];

export function resolveFfmpeg(): string {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  // ffmpeg bawaan Remotion di-build minimal: tanpa alimiter/acompressor/ebur128.
  // Tanpa limiter, true peak mix horor (stinger tajam) tidak bisa ditahan, jadi
  // build lengkap dipakai lebih dulu bila tersedia.
  for (const candidate of FULL_BUILD_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }

  const which = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
  if (which.status === 0 && which.stdout.trim()) {
    return which.stdout.trim();
  }

  const pnpmDir = join(ROOT, "node_modules", ".pnpm");
  if (existsSync(pnpmDir)) {
    for (const entry of readdirSync(pnpmDir)) {
      if (!entry.startsWith("@remotion+compositor-")) continue;
      const candidate = join(pnpmDir, entry, "node_modules", "@remotion", entry.split("@remotion+")[1].split("@")[0], "ffmpeg");
      if (existsSync(candidate)) return candidate;
    }
  }

  throw new Error(
    "ffmpeg tidak ditemukan. Pasang ffmpeg sistem atau set FFMPEG_PATH. (pnpm install seharusnya sudah membawa @remotion/compositor-*)",
  );
}

/** Jalankan ffmpeg dan kembalikan output walau exit code != 0 (untuk probe metadata). */
export function probeFfmpeg(args: string[]): string {
  const ffmpeg = resolveFfmpeg();
  const result = spawnSync(ffmpeg, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

export function runFfmpeg(args: string[]): string {
  const ffmpeg = resolveFfmpeg();
  const result = spawnSync(ffmpeg, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  if (result.status !== 0) {
    throw new Error(`ffmpeg gagal (${result.status}):\n${result.stderr?.slice(-2000)}`);
  }
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}
