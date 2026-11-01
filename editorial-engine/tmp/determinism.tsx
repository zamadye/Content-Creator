/** Determinism proof: the same frame rendered twice must be byte-identical. */
import { execFileSync } from 'node:child_process';
import React from 'react';
import { FrameProvider } from '../remotion/src/runtime';
import { EditorialVideo } from '../remotion/src/compositions/EditorialVideo';
import { timeline } from '../remotion/src/content/timeline.generated';
import { renderPng } from '../pipeline/runtime/ssr';

const frames = [120, 900, 1800, 2500];
for (const f of frames) {
  const el = React.createElement(
    FrameProvider,
    { frame: f, fps: timeline.fps, width: timeline.width, height: timeline.height, durationInFrames: timeline.durationInFrames },
    React.createElement(EditorialVideo, { timeline }),
  ) as React.ReactElement;
  renderPng(el, timeline.width, timeline.height, `tmp/det-${f}-a.png`);
  renderPng(el, timeline.width, timeline.height, `tmp/det-${f}-b.png`);
}
const out = execFileSync('md5sum', [...frames.flatMap((f) => [`tmp/det-${f}-a.png`, `tmp/det-${f}-b.png`])], { encoding: 'utf8' });
console.log(out);
