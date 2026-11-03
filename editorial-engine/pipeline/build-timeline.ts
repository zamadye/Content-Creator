/**
 * TIMELINE BUILDER
 * ----------------
 *   storyboard targets  +  measured voice-over  ->  content/timeline.json
 *                                                ->  remotion/src/content/timeline.generated.ts
 *                                                ->  content/audio-cues.json
 *
 * Rules
 *  - a scene is never shorter than its voice-over plus breathing room
 *  - silent beats keep their authored duration exactly (they are rhythm, not filler)
 *  - subtitle cues are phrase-level (meaning first, character count second)
 */
import fs from 'node:fs';
import { MISSION, PATHS, readJson, writeJson } from './lib';

type Segment = { id: string; scene: string; narration: string; purpose: string; subtitles?: string[][] };
type Scene = { id: string; vo: string | null; durationTargetSec: number; narrativePurpose: string };

const FPS = 30;
const LEAD_IN = 0.15; // silence before the first word in a scene
const TAIL = 0.2; // silence after the last word

const script = readJson<{ segments: Segment[] }>(PATHS.script);
const board = readJson<{ fps: number; scenes: Scene[] }>(PATHS.storyboard);
const manifest = readJson<{ segments: { id: string; file: string | null; durationSec: number | null }[] | null }>(
  PATHS.manifest,
);

const voById = new Map<string, { file: string; durationSec: number }>();
for (const s of manifest.segments ?? []) {
  if (s.file && s.durationSec) voById.set(s.id, { file: s.file, durationSec: s.durationSec });
}

const scenes: {
  id: string;
  startFrame: number;
  durationInFrames: number;
  purpose: string;
  vo: string | null;
  voStartFrame: number | null;
}[] = [];

let cursor = 0;
for (const scene of board.scenes) {
  const vo = scene.vo ? voById.get(scene.vo) : undefined;
  const voSec = vo?.durationSec ?? 0;
  const target = scene.durationTargetSec;
  const wanted = vo ? Math.max(target, voSec + LEAD_IN + TAIL) : target;
  const frames = Math.round(wanted * FPS);
  scenes.push({
    id: scene.id,
    startFrame: cursor,
    durationInFrames: frames,
    purpose: scene.narrativePurpose,
    vo: scene.vo,
    voStartFrame: vo ? cursor + Math.round(LEAD_IN * FPS) : null,
  });
  cursor += frames;
}

const totalFrames = cursor;

/* ---------------- subtitles: authored per segment, timed by weight ---------------- */
type SegmentWithSubs = Segment & { subtitles?: string[][] };

const captions: { text: string[]; startFrame: number; durationInFrames: number; segment: string }[] = [];
for (const scene of scenes) {
  const segment = script.segments.find((s) => s.scene === scene.id) as SegmentWithSubs | undefined;
  if (!segment || scene.voStartFrame === null) continue;
  const vo = voById.get(segment.id);
  const cues = segment.subtitles ?? [];
  if (!vo || cues.length === 0) continue;

  const weights = cues.map((lines) => lines.join(' ').length);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const voFrames = Math.round(vo.durationSec * FPS);

  // span by weight, then a floor of MIN_CUE frames (a one-word beat still has to be
  // readable); the deficit is taken from the neighbour that can afford it
  const MIN_CUE = 34;
  const spans = cues.map((_, i) => Math.max(1, Math.round((weights[i] / totalWeight) * voFrames)));
  // the last cue absorbs the rounding remainder so the block fits the speech exactly
  spans[spans.length - 1] = voFrames - spans.slice(0, -1).reduce((a, b) => a + b, 0);
  for (let i = 0; i < spans.length; i++) {
    if (spans[i] >= MIN_CUE) continue;
    const deficit = MIN_CUE - spans[i];
    const j = i + 1 < spans.length && spans[i + 1] - deficit >= MIN_CUE ? i + 1 : i - 1;
    if (j >= 0 && j < spans.length && spans[j] - deficit >= MIN_CUE) {
      spans[i] = MIN_CUE;
      spans[j] -= deficit;
    }
  }
  // hard guarantee: cumulative cue windows stay inside the speech window
  const drift = spans.reduce((a, b) => a + b, 0) - voFrames;
  if (drift > 0) spans[spans.length - 1] = Math.max(MIN_CUE, spans[spans.length - 1] - drift);
  let consumed = 0;
  cues.forEach((lines, i) => {
    captions.push({
      text: lines,
      startFrame: scene.voStartFrame! + consumed,
      durationInFrames: spans[i],
      segment: segment.id,
    });
    consumed += spans[i];
  });
}

const timeline = {
  topic: MISSION,
  fps: FPS,
  width: 1080,
  height: 1920,
  durationInFrames: totalFrames,
  generatedAt: new Date().toISOString(),
  scenes: scenes.map((s) => ({
    id: s.id,
    startFrame: s.startFrame,
    durationInFrames: s.durationInFrames,
    purpose: s.purpose,
    vo: s.vo,
  })),
  captions: captions.map((c) => ({ text: c.text, startFrame: c.startFrame, durationInFrames: c.durationInFrames, segment: c.segment })),
  vo: scenes
    .filter((s) => s.vo && s.voStartFrame !== null)
    .map((s) => {
      const v = voById.get(s.vo!)!;
      return { id: s.vo!, file: v.file, startFrame: s.voStartFrame!, durationInFrames: Math.round(v.durationSec * FPS) };
    }),
};

writeJson(PATHS.timeline, timeline);
writeJson(PATHS.audioCues, buildCues(scenes, timeline.durationInFrames));

const ts = `// AUTO-GENERATED by pipeline/build-timeline.ts — do not edit by hand.
// Source: content/timeline.json (built from measured voice-over durations)
import type { Timeline } from './types';

export const timeline: Timeline = ${JSON.stringify(timeline, null, 2)};
`;
fs.writeFileSync('remotion/src/content/timeline.generated.ts', ts);

console.log(`timeline: ${scenes.length} scenes, ${totalFrames} frames @ ${FPS}fps = ${(totalFrames / FPS).toFixed(2)}s`);
console.table(scenes.map((s) => ({ id: s.id, start: s.startFrame, dur: s.durationInFrames, sec: (s.durationInFrames / FPS).toFixed(2), vo: s.vo })));
console.log(`captions: ${captions.length}`);

/* ---------------- sound design cues ---------------- */
function buildCues(
  scenes: { id: string; startFrame: number; durationInFrames: number }[],
  total: number,
) {
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const sfx: { at: number; file: string; gainDb: number; note: string }[] = [];
  const at = (id: string, offset: number, file: string, gainDb: number, note: string) => {
    const scene = byId.get(id);
    if (scene) sfx.push({ at: scene.startFrame + Math.round(offset * FPS), file: `audio/processing/generated/sfx_${file}.wav`, gainDb, note });
  };
  // transitions are cuts: a short whoosh under the cut hides the seam without drawing attention
  for (const s of scenes.slice(1)) sfx.push({ at: s.startFrame - 6, file: 'audio/processing/generated/sfx_whoosh.wav', gainDb: -24, note: `transisi ke ${s.id}` });
  at('s04', 0.55, 'impact', -17, 'angka 0,0017% masuk');
  at('s04', 0.9, 'tick', -22, 'layar berganti');
  at('s06', 0.6, 'stamp', -15, 'stempel sertifikat');
  at('s06', 0.35, 'paper', -25, 'kertas sertifikat');
  for (const s of [0.34, 0.48, 0.62]) at('s07', s, 'stamp', -14, 'stempel penutupan');
  at('s08', 0.1, 'paper', -26, 'piring digeser');
  at('s09', 0.05, 'whoosh', -28, 'masuk ruang kosong');
  return { totalFrames: total, music: { file: 'audio/processing/generated/bed.wav', gainDb: -13, duckDb: -9 }, sfx };
}
