/**
 * Renders every frame of the film to PNG.
 * The whole video is a pure function of (timeline, scene components): same input, same bytes.
 * usage: npx tsx pipeline/render-frames.ts [--from 0] [--to 2115] [--step 1]
 */
import fs from 'node:fs';
import React from 'react';
import { p } from './lib';
import { FrameProvider } from '../remotion/src/runtime';
import { EditorialVideo } from '../remotion/src/compositions/EditorialVideo';
import { renderPng } from './runtime/ssr';

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};

const from = arg('from', 0);
const to = arg('to', Number.MAX_SAFE_INTEGER);
const step = arg('step', 1);

const timeline = JSON.parse(fs.readFileSync(p('content/timeline.json'), 'utf8')) as {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  scenes: unknown[];
  captions: unknown[];
  vo: unknown[];
};
const last = Math.min(to, timeline.durationInFrames - 1);
fs.mkdirSync(p('rendering/frames'), { recursive: true });

const t0 = Date.now();
let n = 0;
for (let f = from; f <= last; f += step) {
  const file = p(`rendering/frames/f${String(f).padStart(5, '0')}.png`);
  if (fs.existsSync(file) && !process.argv.includes('--force')) {
    n++;
    continue;
  }
  const el = React.createElement(
    FrameProvider,
    { frame: f, fps: timeline.fps, width: timeline.width, height: timeline.height, durationInFrames: timeline.durationInFrames },
    React.createElement(EditorialVideo, { timeline: timeline as never }),
  ) as React.ReactElement;
  renderPng(el, timeline.width, timeline.height, file);
  n++;
  if (n % 150 === 0) {
    const el = (Date.now() - t0) / 1000;
    const rate = n / el;
    console.log(`${n} frames (${(f / timeline.durationInFrames * 100).toFixed(0)}%) ${rate.toFixed(1)} fps · eta ${((last - f) / rate / 60).toFixed(1)} min`);
  }
}
const elapsed = (Date.now() - t0) / 1000;
console.log(`rendered ${n} frames in ${elapsed.toFixed(1)}s (${(n / elapsed).toFixed(1)} fps)`);
