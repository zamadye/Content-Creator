/** Shared helpers for the production pipeline (paths, ffmpeg, json). */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const p = (...parts: string[]) => path.join(ROOT, ...parts);

/** ffmpeg comes from the npm-packaged static build (no system install needed). */
export const FFMPEG: string = (await import('@ffmpeg-installer/ffmpeg')).default.path;

export const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(p(file), 'utf8'));
export const writeJson = (file: string, data: unknown) => {
  fs.mkdirSync(path.dirname(p(file)), { recursive: true });
  fs.writeFileSync(p(file), JSON.stringify(data, null, 2) + '\n');
};

export const run = (cmd: string, args: string[], opts: { quiet?: boolean } = {}): string => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const e = err as { stderr?: Buffer; stdout?: Buffer };
    if (!opts.quiet) {
      console.error(`\n[${path.basename(cmd)}] failed`);
      console.error(String(e.stderr ?? ''));
    }
    throw err;
  }
};

/**
 * Media duration in seconds.
 * ffprobe is not part of @ffmpeg-installer, so we parse ffmpeg's own header output.
 */
export const probeDuration = (file: string): number => {
  try {
    run(FFMPEG, ['-hide_banner', '-i', p(file)]);
  } catch (err) {
    const e = err as { stderr?: Buffer };
    const text = String(e.stderr ?? '');
    const m = text.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    throw new Error(`could not read duration of ${file}`);
  }
  return 0;
};

export const framecount = (dir: string) =>
  fs.existsSync(p(dir)) ? fs.readdirSync(p(dir)).filter((f) => f.endsWith('.png')).length : 0;

/** EBU R128 measurement — reads the numbers out of ffmpeg's stderr (this build has no ffprobe). */
export const measureLoudness = (file: string): { integrated: number | null; truePeak: number | null } => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', p(file), '-af', 'ebur128=peak=true', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const text = String(r.stderr ?? '');
  const i = [...text.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)].pop();
  const tp = [...text.matchAll(/Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/g)].pop();
  return { integrated: i ? Number(i[1]) : null, truePeak: tp ? Number(tp[1]) : null };
};
