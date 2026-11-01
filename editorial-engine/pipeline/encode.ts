/**
 * ENCODES the rendered frames + master audio into the deliverable MP4.
 * H.264 High / yuv420p / CRF 18 / 30 fps, AAC 192 kb/s 48 kHz, faststart for web.
 */
import fs from 'node:fs';
import { FFMPEG, p, probeDuration, run, writeJson } from './lib';

const timeline = JSON.parse(fs.readFileSync(p('content/timeline.json'), 'utf8')) as { durationInFrames: number; fps: number };
const audio = p('audio/mix/mbg-gizi-anak.master.wav');
const outDir = p('deliverables');
fs.mkdirSync(outDir, { recursive: true });
const out = `${outDir}/B_mbg-gizi-anak_1080x1920.mp4`;

const t0 = Date.now();
run(FFMPEG, [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(timeline.fps),
  '-i', p('rendering/frames/f%05d.png'),
  '-i', audio,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
  '-g', '60', '-keyint_min', '30',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
  '-movflags', '+faststart',
  '-shortest',
  out,
]);
const secs = Date.now() - t0;

writeJson('deliverables/render-report.json', {
  video: 'deliverables/B_mbg-gizi-anak_1080x1920.mp4',
  frames: timeline.durationInFrames,
  fps: timeline.fps,
  durationSec: Number(probeDuration('deliverables/B_mbg-gizi-anak_1080x1920.mp4').toFixed(2)),
  audioSec: Number(probeDuration('audio/mix/mbg-gizi-anak.master.wav').toFixed(2)),
  encodeSec: Number((secs / 1000).toFixed(1)),
  sizeMB: Number((fs.statSync(out).size / 1e6).toFixed(2)),
  settings: { codec: 'h264 high', crf: 18, pixFmt: 'yuv420p', audio: 'aac 192k 48k', faststart: true },
});
console.log(`encoded in ${(secs / 1000).toFixed(1)}s -> ${out}`);
