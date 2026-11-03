/**
 * Renders the upload-package thumbnail (9:16) and the archive poster (4:5)
 * from ONE generated image. Usage:
 *   MISSION=karhutla-angka-turun-2026 tsx pipeline/render-thumbnail.ts
 *
 * Copy lives in content/thumbnails/<mission>.json so the same art can carry two
 * different headline pairs (feed thumbnail vs 4:5 archive poster).
 * The image lives in assets/thumbnails/<mission>-cover.png and is embedded as a
 * data URI so the render stays offline and deterministic.
 */
import fs from 'node:fs';
import React from 'react';
import { ThumbAI } from '../remotion/src/compositions/ThumbAI';
import { layout } from '../design/tokens';
import { renderPng, ROOT } from './runtime/ssr';
import { MISSION, PATHS, p, readJson } from './lib';

type Copy = { kicker: string; tagline: string[]; source: string; plate?: string };
const copyPath = `content/thumbnails/${MISSION}.json`;
if (!fs.existsSync(p(copyPath))) {
  console.error(`missing thumbnail copy: ${copyPath}`);
  process.exit(1);
}
const copy = readJson<{ thumb: Copy; poster: Copy }>(copyPath);

const coverPath = `assets/thumbnails/${MISSION}-cover.png`;
if (!fs.existsSync(p(coverPath))) {
  console.error(`missing cover image: ${coverPath}`);
  process.exit(1);
}
const imageDataUri = `data:image/png;base64,${fs.readFileSync(p(coverPath)).toString('base64')}`;

const render = (el: React.ReactElement, w: number, h: number, out: string) => {
  const t0 = Date.now();
  renderPng(el, w, h, out);
  console.log(`${out.replace(ROOT + '/', '')} (${w}x${h}, ${Date.now() - t0}ms)`);
};

// 1. thumbnail paket unggah 9:16
render(
  React.createElement(ThumbAI, {
    imageDataUri,
    ...copy.thumb,
    width: layout.video.width,
    height: layout.video.height,
  }) as React.ReactElement,
  layout.video.width,
  layout.video.height,
  p(PATHS.thumb),
);

// 2. poster arsip 4:5
render(
  React.createElement(ThumbAI, {
    imageDataUri,
    ...copy.poster,
    width: layout.poster.width,
    height: layout.poster.height,
  }) as React.ReactElement,
  layout.poster.width,
  layout.poster.height,
  p(PATHS.poster),
);
