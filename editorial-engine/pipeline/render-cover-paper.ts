/**
 * Renders the upload thumbnail (9:16) and the archive poster (4:5) for the paper-collage mission.
 *   MISSION=pinjol-bunga-harian-2026 tsx pipeline/render-cover-paper.ts
 *
 * Unlike render-thumbnail.ts this needs no model-generated image: the cover is drawn with
 * the film's own paper components, so the promise of the thumbnail matches the film.
 */
import fs from 'node:fs';
import React from 'react';
import { PaperCover } from '../remotion/src/compositions/PaperCover';
import { layout } from '../design/tokens';
import { renderPng, ROOT } from './runtime/ssr';
import { MISSION, PATHS, p, readJson } from './lib';

type Copy = { tagline: string[]; note: string };

const copyPath = `content/thumbnails/${MISSION}.cover.json`;
if (!fs.existsSync(p(copyPath))) {
  console.error(`missing cover copy: ${copyPath}`);
  process.exit(1);
}
const copy = readJson<{ kicker: string; thumb: Copy; poster: Copy }>(copyPath);

const render = (el: React.ReactElement, w: number, h: number, out: string) => {
  const t0 = Date.now();
  renderPng(el, w, h, out);
  console.log(`${out.replace(ROOT + '/', '')} (${w}x${h}, ${Date.now() - t0}ms)`);
};

render(
  React.createElement(PaperCover, {
    kicker: copy.kicker,
    ...copy.thumb,
    width: layout.video.width,
    height: layout.video.height,
  }) as React.ReactElement,
  layout.video.width,
  layout.video.height,
  p(PATHS.thumb),
);

render(
  React.createElement(PaperCover, {
    kicker: copy.kicker,
    ...copy.poster,
    width: layout.poster.width,
    height: layout.poster.height,
  }) as React.ReactElement,
  layout.poster.width,
  layout.poster.height,
  p(PATHS.poster),
);
