/**
 * Renders deliverable A (editorial illustration, 1080x1350) and a preview.
 * usage: npx tsx pipeline/render-poster.ts
 */
import React from 'react';
import { EditorialPoster } from '../remotion/src/compositions/EditorialPoster';
import { layout } from '../design/tokens';
import { renderPng, ROOT } from './runtime/ssr';
import { PATHS } from './lib';

export const renderPosterStill = (out = `${ROOT}/${PATHS.poster}`) => {
  const t0 = Date.now();
  renderPng(React.createElement(EditorialPoster) as React.ReactElement, layout.poster.width, layout.poster.height, out);
  return { out, ms: Date.now() - t0 };
};

if (process.argv[1]?.includes('render-poster')) {
  const r = renderPosterStill();
  console.log(`poster -> ${r.out} (${r.ms}ms)`);
}
