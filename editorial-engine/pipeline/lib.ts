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

/* ---------------------------------------------------------------- misi & path */

/**
 * Misi dipilih lewat env `MISSION` atau argumen `--mission <slug>`.
 * Misi bawaan (mbg-gizi-anak) memakai path lama supaya arsip misi pertama tetap utuh;
 * misi lain mendapat folder sendiri sehingga satu repo bisa memuat banyak film.
 */
const argvMission = (() => {
  const i = process.argv.indexOf('--mission');
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

export const DEFAULT_MISSION = 'mbg-gizi-anak';
export const MISSION: string = argvMission ?? process.env.MISSION ?? DEFAULT_MISSION;
export const IS_DEFAULT_MISSION = MISSION === DEFAULT_MISSION;

const voDirForMission = `audio/voiceovers/${MISSION}`;
export const VO_DIR: string = IS_DEFAULT_MISSION
  ? 'audio/voiceovers'
  : fs.existsSync(p(voDirForMission))
    ? voDirForMission
    : 'audio/voiceovers';

export const PATHS = {
  mission: MISSION,
  isDefault: IS_DEFAULT_MISSION,
  script: `content/scripts/${MISSION}.script.json`,
  storyboard: `content/storyboards/${MISSION}.storyboard.json`,
  voDir: VO_DIR,
  manifest: `${VO_DIR}/manifest.json`,
  timeline: IS_DEFAULT_MISSION ? 'content/timeline.json' : `content/timelines/${MISSION}.json`,
  frames: IS_DEFAULT_MISSION ? 'rendering/frames' : `rendering/frames-${MISSION}`,
  master: `audio/mix/${MISSION}.master.wav`,
  mixReport: IS_DEFAULT_MISSION ? 'audio/mix/mix-report.json' : `audio/mix/mix-report-${MISSION}.json`,
  audioCues: IS_DEFAULT_MISSION ? 'content/audio-cues.json' : `content/audio-cues-${MISSION}.json`,
  captions: IS_DEFAULT_MISSION ? 'content/captions.json' : `content/captions-${MISSION}.json`,
  report: IS_DEFAULT_MISSION ? 'deliverables/render-report.json' : `deliverables/render-report-${MISSION}.json`,
  qaReport: IS_DEFAULT_MISSION ? 'qa/report-technical.json' : `qa/report-technical-${MISSION}.json`,
  video: `deliverables/B_${MISSION}_1080x1920.mp4`,
  srt: `deliverables/C_${MISSION}.srt`,
  vtt: `deliverables/C_${MISSION}.vtt`,
  poster: `deliverables/A_${MISSION}_1080x1350.png`,
  thumb: `deliverables/T_${MISSION}_1080x1920.png`,
  caption: `deliverables/caption_${MISSION}.txt`,
} as const;
