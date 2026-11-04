/** Still cepat untuk scene tunggal tanpa timeline misi (dipakai saat membangun gaya baru).
 *   npx tsx pipeline/dev-still.ts d01 <frame>
 */
import React from 'react';
import path from 'node:path';
import { FrameProvider } from '../remotion/src/runtime';
import { EditorialVideo } from '../remotion/src/compositions/EditorialVideo';
import { renderPng, ROOT } from './runtime/ssr';

const [id, frameRaw] = process.argv.slice(2);
const D = 300;
const tl: any = {
  topic: 'dev', fps: 30, width: 1080, height: 1920, durationInFrames: D,
  generatedAt: new Date().toISOString(),
  scenes: [{ id, startFrame: 0, durationInFrames: D, purpose: 'HOOK', vo: null }],
  captions: [],
  vo: null,
};
const frame = Number(frameRaw ?? 0);
const out = path.join(ROOT, `rendering/previews/${id}_dev_${frame}.png`);
const el = React.createElement(FrameProvider, { frame, fps: 30, width: 1080, height: 1920, durationInFrames: D },
  React.createElement(EditorialVideo, { timeline: tl }));
renderPng(el as React.ReactElement, 1080, 1920, out);
