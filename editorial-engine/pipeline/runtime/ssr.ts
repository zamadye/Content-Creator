/**
 * SSR RENDER BACKEND
 * ------------------
 * React component tree -> SVG string -> PNG raster (resvg).
 *
 * This is a retained generic utility, not a complete render entrypoint. The old
 * scenes and Remotion Studio composition were retired during the niche cleanup;
 * validate any new integration independently before using it in production.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import type React from 'react';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../..');

const fontManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/fonts/fonts.json'), 'utf8')) as {
  fonts: { path: string; family: string; weight: number; style: string }[];
};
export const FONT_FILES = fontManifest.fonts.map((f) => path.join(ROOT, f.path));

export const renderSvg = (element: React.ReactElement, width: number, height: number): string => {
  const markup = renderToStaticMarkup(element);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${markup}</svg>`;
};

export const svgToPng = (svg: string, width: number): Buffer => {
  const r = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Archivo', serifFamily: 'Instrument Serif', sansSerifFamily: 'Archivo' },
    fitTo: { mode: 'width', value: width },
    background: '#141713',
    shapeRendering: 2,
    imageRendering: 0,
  });
  return r.render().asPng();
};

export const renderPng = (element: React.ReactElement, width: number, height: number, outPath: string): void => {
  const svg = renderSvg(element, width, height);
  const png = svgToPng(svg, width);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
};
