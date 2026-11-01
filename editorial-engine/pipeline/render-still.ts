/**
 * QA still renderer.
 *   npx tsx pipeline/render-still.ts s01:40 s04:120 ...
 *   npx tsx pipeline/render-still.ts s01:0.15 (fraction of the scene)
 *   npx tsx pipeline/render-still.ts poster
 *
 * Renders the real composition at a global frame, so transitions, caption layer and
 * scene timing are exercised exactly as in the final video.
 */
import path from 'node:path';
import React from 'react';
import { FrameProvider } from '../remotion/src/runtime';
import { EditorialVideo } from '../remotion/src/compositions/EditorialVideo';
import { timeline } from '../remotion/src/content/timeline.generated';
import { renderPng, ROOT } from './runtime/ssr';

const renderFrame = (frame: number, outPath: string, tl = timeline) => {
  const el = React.createElement(
    FrameProvider,
    { frame, fps: tl.fps, width: tl.width, height: tl.height, durationInFrames: tl.durationInFrames },
    React.createElement(EditorialVideo, { timeline: tl }),
  );
  renderPng(el as React.ReactElement, tl.width, tl.height, outPath);
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: render-still.ts <sceneId>:<frame|0..1> | poster');
  process.exit(1);
}

for (const arg of args) {
  if (arg === 'poster') {
    const { renderPosterStill } = await import('./render-poster');
    await renderPosterStill();
    continue;
  }
  const [id, posRaw] = arg.split(':');
  const scene = timeline.scenes.find((s) => s.id === id);
  if (!scene) {
    console.error(`unknown scene ${id}`);
    continue;
  }
  const pos = Number(posRaw ?? 0);
  const local = pos > 0 && pos <= 1 ? Math.round(pos * (scene.durationInFrames - 1)) : pos;
  const frame = scene.startFrame + local;
  const out = path.join(ROOT, 'rendering/previews', `${id}_f${String(local).padStart(4, '0')}.png`);
  const t0 = Date.now();
  renderFrame(frame, out);
  console.log(`${id} local=${local} global=${frame} -> ${path.relative(ROOT, out)} (${Date.now() - t0}ms)`);
}
