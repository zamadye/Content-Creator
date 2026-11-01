/** Writes deliverables/C_mbg-gizi-anak.{srt,vtt} from the timeline caption cues. */
import fs from 'node:fs';
import { p, readJson } from './lib';

type Caption = { text: string[]; startFrame: number; durationInFrames: number; segment: string };
const timeline = readJson<{ fps: number; captions: Caption[] }>('content/timeline.json');
const fps = timeline.fps;

const stamp = (frame: number, sep: ',' | '.') => {
  const ms = Math.round((frame / fps) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(r).padStart(3, '0')}`;
};

const srt = timeline.captions
  .map((c, i) => `${i + 1}\n${stamp(c.startFrame, ',')} --> ${stamp(c.startFrame + c.durationInFrames, ',')}\n${c.text.join('\n')}\n`)
  .join('\n');
const vtt = `WEBVTT\n\n${timeline.captions
  .map((c) => `${stamp(c.startFrame, '.')} --> ${stamp(c.startFrame + c.durationInFrames, '.')}\n${c.text.join('\n')}`)
  .join('\n\n')}\n`;

fs.mkdirSync(p('deliverables'), { recursive: true });
fs.writeFileSync(p('deliverables/C_mbg-gizi-anak.srt'), srt);
fs.writeFileSync(p('deliverables/C_mbg-gizi-anak.vtt'), vtt);
fs.writeFileSync(p('content/captions.json'), JSON.stringify(timeline.captions, null, 2));
console.log(`${timeline.captions.length} cues -> deliverables/C_mbg-gizi-anak.srt / .vtt`);
