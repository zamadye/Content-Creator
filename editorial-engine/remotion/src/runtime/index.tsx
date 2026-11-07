/**
 * DETERMINISTIC FRAME RUNTIME — shared illustration reference.
 * A small frame-based API used by the retained generic illustration primitives.
 * Old episode scenes, compositions and their entrypoints have been retired; this
 * runtime alone is not a render pipeline or a working Remotion Studio preview.
 * Integration into a new production must be tested separately.
 */
import React, { createContext, useContext } from 'react';
import { motion } from '../../../design/tokens';

export type FrameConfig = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
};

type Ctx = FrameConfig & { frame: number };

const FrameContext = createContext<Ctx>({
  frame: 0,
  fps: motion.fps,
  width: 1080,
  height: 1920,
  durationInFrames: 1,
});

export const FrameProvider: React.FC<Ctx & { children?: React.ReactNode }> = ({ children, ...ctx }) => (
  <FrameContext.Provider value={ctx}>{children}</FrameContext.Provider>
);

/** Current frame relative to the closest enclosing <Sequence>. */
export const useCurrentFrame = (): number => useContext(FrameContext).frame;
export const useVideoConfig = (): FrameConfig => {
  const { fps, width, height, durationInFrames } = useContext(FrameContext);
  return { fps, width, height, durationInFrames };
};

/* ------------------------------------------------------------------ */
/* AbsoluteFill — in SVG land this is simply a <g>.                    */
/* ------------------------------------------------------------------ */
export const AbsoluteFill: React.FC<React.SVGProps<SVGGElement>> = ({ children, ...rest }) => (
  <g {...rest}>{children}</g>
);

/* ------------------------------------------------------------------ */
/* Sequence — time-windowed group with its own local frame.            */
/* ------------------------------------------------------------------ */
export const Sequence: React.FC<{
  from?: number;
  durationInFrames?: number;
  name?: string;
  children?: React.ReactNode;
}> = ({ from = 0, durationInFrames, children }) => {
  const ctx = useContext(FrameContext);
  const local = ctx.frame - from;
  if (local < 0) return null;
  if (durationInFrames !== undefined && local >= durationInFrames) return null;
  return (
    <FrameContext.Provider value={{ ...ctx, frame: local }}>{children}</FrameContext.Provider>
  );
};

/** Total length of a set of sequences (used by compositions). */
export const getSequenceDuration = (items: { durationInFrames: number }[]): number =>
  items.reduce((sum, i) => sum + i.durationInFrames, 0);

/* ------------------------------------------------------------------ */
/* Easing                                                              */
/* ------------------------------------------------------------------ */
export type EasingFn = (t: number) => number;

const bezier = (x1: number, y1: number, x2: number, y2: number): EasingFn => (t: number) => {
  // Newton-Raphson solve of the cubic bezier x(t) = progress, then evaluate y.
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const sampleDX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleX(s) - t;
    if (Math.abs(x) < 1e-5) break;
    const d = sampleDX(s);
    if (Math.abs(d) < 1e-6) break;
    s -= x / d;
  }
  return sampleY(Math.min(1, Math.max(0, s)));
};

export const Easing = {
  bezier,
  linear: ((t) => t) as EasingFn,
  ease: bezier(0.42, 0, 1, 1),
  in: bezier(0.42, 0, 1, 1),
  out: bezier(0, 0, 0.58, 1),
  inOut: bezier(0.42, 0, 0.58, 1),
  editorial: bezier(...motion.curve.editorial),
  impact: bezier(...motion.curve.impact),
  breath: bezier(...motion.curve.breath),
  linearish: bezier(...motion.curve.linearish),
};

/* ------------------------------------------------------------------ */
/* interpolate                                                         */
/* ------------------------------------------------------------------ */
type Extrapolate = 'clamp' | 'extend' | 'identity';

const extrapolateValue = (
  value: number,
  input: number[],
  output: number[],
  side: 'left' | 'right',
  mode: Extrapolate,
): number => {
  const edge = side === 'left' ? 0 : input.length - 1;
  const inEdge = input[edge];
  const outEdge = output[edge];
  if (mode === 'identity') return value;
  if (mode === 'extend') {
    const neighbour = side === 'left' ? 1 : input.length - 2;
    const slope = (output[neighbour] - outEdge) / (input[neighbour] - inEdge);
    return outEdge + (value - inEdge) * slope;
  }
  return outEdge;
};

export const interpolate = (
  value: number,
  inputRange: number[],
  outputRange: number[],
  opts: { easing?: EasingFn; extrapolateLeft?: Extrapolate; extrapolateRight?: Extrapolate } = {},
): number => {
  const { easing = Easing.linear, extrapolateLeft = 'extend', extrapolateRight = 'extend' } = opts;
  if (inputRange.length !== outputRange.length) throw new Error('interpolate: range length mismatch');
  if (value <= inputRange[0]) {
    return extrapolateLeft === 'extend' && inputRange.length > 1
      ? extrapolateValue(value, inputRange, outputRange, 'left', 'extend')
      : outputRange[0];
  }
  const last = inputRange.length - 1;
  if (value >= inputRange[last]) {
    return extrapolateRight === 'extend' && inputRange.length > 1
      ? extrapolateValue(value, inputRange, outputRange, 'right', 'extend')
      : outputRange[last];
  }
  let i = 0;
  while (i < last && value > inputRange[i + 1]) i++;
  const span = inputRange[i + 1] - inputRange[i];
  const progress = span === 0 ? 0 : (value - inputRange[i]) / span;
  return outputRange[i] + (outputRange[i + 1] - outputRange[i]) * easing(progress);
};

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Progress 0..1 across a window — the workhorse for scene-local timing. */
export const progress = (
  frame: number,
  start: number,
  end: number,
  easing: EasingFn = Easing.editorial,
): number => clamp(easing(clamp((frame - start) / Math.max(1, end - start))));

/* ------------------------------------------------------------------ */
/* spring — mass/spring/damper integration, evaluated from frame 0.    */
/* ------------------------------------------------------------------ */
export const spring = ({
  frame,
  fps = motion.fps,
  config = { damping: 200, stiffness: 60, mass: 1 },
  durationInFrames,
  from = 0,
  to = 1,
}: {
  frame: number;
  fps?: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
  durationInFrames?: number;
  from?: number;
  to?: number;
}): number => {
  const { damping = 200, stiffness = 60, mass = 1 } = config;
  const end = frame;
  const dt = 1 / 240;
  let x = 0;
  let v = 0;
  const target = 1;
  const steps = Math.max(0, Math.floor(end * dt * fps * 4));
  for (let i = 0; i < steps; i++) {
    const a = (-stiffness * (x - target) - damping * v) / mass;
    v += a * dt * 4;
    x += v * dt * 4;
  }
  const clamped = durationInFrames ? Math.min(1, x) : x;
  return from + (to - from) * clamped;
};

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random (Remotion-compatible contract).         */
/* ------------------------------------------------------------------ */
export const random = (seed: number): number => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const randomIn = (seed: number, min: number, max: number) => min + random(seed) * (max - min);

/* ------------------------------------------------------------------ */
/* Audio / Img — declared for authoring parity with Remotion.          */
/* The SVG render backend ignores them; the mix is built by           */
/* pipeline/mix-audio.ts from content/audio-cues.json.                 */
/* ------------------------------------------------------------------ */
export const Audio: React.FC<{ src: string; volume?: number; startFrom?: number }> = () => null;
export const Img: React.FC<{ src: string } & React.SVGProps<SVGImageElement>> = ({ src, ...rest }) => (
  <image href={src} {...rest} />
);
export const staticFile = (p: string) => p;
