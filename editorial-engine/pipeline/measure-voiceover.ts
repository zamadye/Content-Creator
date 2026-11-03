/**
 * MEASURES every voice-over clip and writes audio/voiceovers/manifest.json.
 *
 * Two things are measured, per line:
 *   duration  -> the timeline is built from real speech length, not estimates
 *   mean level -> so the seven lines sit at the same loudness before mastering
 *
 * usage: npx tsx pipeline/measure-voiceover.ts
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FFMPEG, PATHS, VO_DIR, p, probeDuration, writeJson } from './lib';

const LEVEL_TARGET = -18; // dB mean for dialogue before mastering

/** mean_volume from ffmpeg's volumedetect (this build ships no ffprobe/ebur128 helper) */
const meanVolume = (file: string): number | null => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', p(file), '-af', 'volumedetect', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const m = String(r.stderr ?? '').match(/mean_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  return m ? Number(m[1]) : null;
};

const script = JSON.parse(fs.readFileSync(p(PATHS.script), 'utf8')) as {
  segments: { id: string; narration: string; scene: string }[];
};

const dir = p(VO_DIR);
const clips = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(mp3|wav|m4a)$/.test(f)) : [];

const segments = script.segments.map((seg) => {
  const clip = clips.find((f) => f.startsWith(seg.id));
  const words = seg.narration.split(/\s+/).length;
  if (!clip) return { id: seg.id, scene: seg.scene, file: null, durationSec: null, words };
  const rel = path.join(VO_DIR, clip);
  const durationSec = Number(probeDuration(rel).toFixed(3));
  const meanDb = meanVolume(rel);
  return {
    id: seg.id,
    scene: seg.scene,
    file: rel,
    durationSec,
    meanDb,
    gainDb: meanDb === null ? 0 : Number((LEVEL_TARGET - meanDb).toFixed(2)),
    words,
    wordsPerSec: Number((words / durationSec).toFixed(2)),
  };
});

const missing = segments.filter((s) => !s.file).map((s) => s.id);
const total = segments.reduce((n, s) => n + (s.durationSec ?? 0), 0);
writeJson(PATHS.manifest, {
  generatedAt: new Date().toISOString(),
  levelTargetDb: LEVEL_TARGET,
  totalSpeechSec: Number(total.toFixed(2)),
  segments,
  missing,
});

console.table(segments.map((s) => ({ id: s.id, sec: s.durationSec, meanDb: s.meanDb, gainDb: s.gainDb, wps: s.wordsPerSec })));
console.log(`total speech: ${total.toFixed(2)} s · missing: ${missing.length ? missing.join(', ') : 'none'}`);
