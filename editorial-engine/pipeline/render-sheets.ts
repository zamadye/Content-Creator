/**
 * Renders the character design sheet to assets/characters/.
 * Sheet resolution is intentionally larger than video frames so it can be used as
 * a production reference (and printed) without upscaling.
 */
import path from 'node:path';
import React from 'react';
import { FrameProvider } from '../remotion/src/runtime';
import { CharacterSheet } from '../remotion/src/compositions/CharacterSheet';
import { renderPng, ROOT } from './runtime/ssr';

const W = 2400;
const H = 1700;
const el = React.createElement(
  FrameProvider,
  { frame: 0, fps: 30, width: W, height: H, durationInFrames: 1 },
  React.createElement(CharacterSheet),
);
const out = path.join(ROOT, 'assets/characters/character-sheet-v1.png');
const t0 = Date.now();
renderPng(el as React.ReactElement, W, H, out);
console.log(`character sheet -> ${path.relative(ROOT, out)} (${Date.now() - t0}ms)`);
