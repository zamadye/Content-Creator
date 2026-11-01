/**
 * ANIMATION LIBRARY
 * -----------------
 * Small, composable, frame-pure motion helpers. No CSS, no time, no randomness.
 *
 * Motion doctrine (docs/VISUAL_STYLE_GUIDE.md):
 *   - every movement states a change: who moved, why, and what the audience should notice
 *   - idle life is tiny (2-6px, 1-3deg). Acting beats are bigger but still capped
 *   - nothing loops on a perfect sine where it would read as mechanical; we phase-shift
 */
import { Easing, interpolate, clamp, progress, random } from '../runtime';

/** Slow push-in / pull-back. Returns a camera transform-shape. */
export const pushIn = (
  frame: number,
  opts: { start?: number; dur: number; from?: number; to?: number } = { dur: 90 },
): number => {
  const { start = 0, dur, from = 1, to = 1.08 } = opts;
  return interpolate(frame, [start, start + dur], [from, to], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
  });
};

export const pan = (frame: number, start: number, dur: number, from: number, to: number): number =>
  interpolate(frame, [start, start + dur], [from, to], { easing: Easing.editorial, extrapolateRight: 'clamp' });

/** Breathing / weight-shift used to keep standing figures alive. */
export const breathe = (frame: number, fps: number, amount = 1, phase = 0): number =>
  Math.sin((frame / fps) * 1.15 + phase) * amount;

/** Deterministic blink: returns 0 (open) .. 1 (closed). */
export const blinkAt = (frame: number, fps: number, seed = 0, every = 3.6): number => {
  const period = every + random(seed) * 0.9;
  const t = (frame / fps + random(seed + 7) * period) % period;
  const closeDur = 0.09;
  const openDur = 0.16;
  if (t < closeDur) return clamp(t / closeDur);
  if (t < closeDur + openDur) return clamp(1 - (t - closeDur) / openDur);
  return 0;
};

/** Fade helper with independent in/out windows. */
export const fade = (frame: number, inStart: number, inDur: number, outStart?: number, outDur = 10): number => {
  const a = interpolate(frame, [inStart, inStart + inDur], [0, 1], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  if (outStart === undefined) return a;
  const b = interpolate(frame, [outStart, outStart + outDur], [1, 0], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return Math.min(a, b);
};

/** Container transform for a camera move. */
export const cam = (scale: number, anchorX = 540, anchorY = 960, dx = 0, dy = 0, rotate = 0): string =>
  `translate(${dx} ${dy}) translate(${anchorX} ${anchorY}) scale(${scale}) rotate(${rotate}) translate(${-anchorX} ${-anchorY})`;

/** Staggered entrance: index-based delay so groups resolve in reading order. */
export const stagger = (frame: number, index: number, per = 6, dur = 22, ease = Easing.editorial): number =>
  progress(frame, index * per, index * per + dur, ease);

/** A crisp impact: fast in, tiny overshoot, settle. */
export const impact = (frame: number, start: number, dur = 16): number => {
  const t = clamp((frame - start) / dur);
  if (t <= 0) return 0;
  const eased = Easing.impact(t);
  return eased;
};

/** Vertical type reveal used for headlines (clip-based, not opacity flicker). */
export const revealY = (frame: number, start: number, dur = 24, distance = 26): { dy: number; opacity: number } => {
  const p = progress(frame, start, start + dur);
  return { dy: (1 - p) * distance, opacity: p };
};

/** Numeric counter with easing — always paired with a unit label, never alone. */
export const countTo = (frame: number, start: number, dur: number, from: number, to: number, ease = Easing.linearish): number =>
  interpolate(frame, [start, start + dur], [from, to], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Small handheld imperfection for close-ups (never applied to wide shots). */
export const handheld = (frame: number, amp = 1.6): { dx: number; dy: number } => ({
  dx: Math.sin(frame * 0.31) * amp + Math.sin(frame * 0.13) * amp * 0.6,
  dy: Math.cos(frame * 0.27) * amp * 0.7,
});

/** Light-leak / flash amount for transitions. */
export const flash = (frame: number, at: number, dur = 12): number =>
  interpolate(frame, [at - dur / 2, at, at + dur / 2], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
