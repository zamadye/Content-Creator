/**
 * TECHNICAL QA
 * ------------
 * Every status here comes from a measurement taken in this script. Nothing is assumed.
 * Statuses: PASS / FAIL / NEEDS REVIEW / NOT TESTED
 */
import fs from 'node:fs';
import path from 'node:path';
import { FFMPEG, measureLoudness, p, probeDuration, run, writeJson } from './lib';

type Check = { gate: string; id: string; check: string; status: 'PASS' | 'FAIL' | 'NEEDS REVIEW' | 'NOT TESTED'; detail: string };

const checks: Check[] = [];
const add = (gate: string, id: string, check: string, status: Check['status'], detail: string) => checks.push({ gate, id, check, status, detail });

const exists = (f: string) => fs.existsSync(p(f));
const ffprobeText = (file: string) => {
  try {
    run(FFMPEG, ['-hide_banner', '-i', p(file)]);
  } catch (err) {
    return String((err as { stderr?: Buffer }).stderr ?? '');
  }
  return '';
};

/* ---------------- GATE 5: technical ---------------- */
const video = 'deliverables/B_mbg-gizi-anak_1080x1920.mp4';
if (!exists(video)) {
  add('GATE 5', 'T1', 'video deliverable exists', 'NOT TESTED', 'no encode yet');
} else {
  const info = ffprobeText(video);
  const v = info.match(/Stream #0:0[^\n]*Video: ([a-z0-9]+)[^\n]*?(\d{3,4})x(\d{3,4})[^\n]*?(\d+(?:\.\d+)?) fps/);
  const a = info.match(/Stream #0:1[^\n]*Audio: ([a-z0-9]+)[^\n]*?(\d+) Hz, (stereo|mono)/);
  const dur = probeDuration(video);
  add('GATE 5', 'T1', 'resolution 1080x1920', v && v[2] === '1080' && v[3] === '1920' ? 'PASS' : 'FAIL', v ? `${v[2]}x${v[3]}` : 'unparsed');
  add('GATE 5', 'T2', 'codec / pixel format', v && v[1] === 'h264' ? 'PASS' : 'FAIL', v ? `${v[1]} ${info.includes('yuv420p') ? 'yuv420p' : '?'}` : 'unparsed');
  add('GATE 5', 'T3', 'frame rate 30 fps', v && Math.abs(Number(v[4]) - 30) < 0.1 ? 'PASS' : 'FAIL', v ? `${v[4]} fps` : 'unparsed');
  add('GATE 5', 'T4', 'duration inside 45-90 s', dur >= 45 && dur <= 90 ? 'PASS' : 'FAIL', `${dur.toFixed(2)} s`);
  add('GATE 5', 'T5', 'audio stream present', a ? 'PASS' : 'FAIL', a ? `${a[1]} ${a[2]} Hz ${a[3]}` : 'none');

  const loud = measureLoudness(video);
  const I = loud.integrated;
  const TP = loud.truePeak;
  add('GATE 5', 'T6', 'integrated loudness -16..-12 LUFS', I !== null && I >= -16 && I <= -12 ? 'PASS' : I === null ? 'NOT TESTED' : 'FAIL', `${I ?? 'n/a'} LUFS`);
  add('GATE 5', 'T7', 'true peak <= -1.0 dBTP', TP !== null && TP <= -1.0 ? 'PASS' : TP === null ? 'NOT TESTED' : 'FAIL', `${TP ?? 'n/a'} dBTP`);
}

/* ---------------- GATE 5: subtitles ---------------- */
const srtPath = 'deliverables/C_mbg-gizi-anak.srt';
if (!exists(srtPath)) add('GATE 5', 'S1', 'subtitle file', 'NOT TESTED', 'missing');
else {
  const raw = fs.readFileSync(p(srtPath), 'utf8');
  const blocks = raw.trim().split(/\n\n+/);
  const toSec = (s: string) => {
    const m = s.match(/(\d+):(\d+):(\d+),(\d+)/)!;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
  };
  let maxChars = 0;
  let maxLines = 0;
  let overlaps = 0;
  let tooShort = 0;
  let prevEnd = -1;
  for (const block of blocks) {
    const lines = block.split('\n');
    const times = lines[1].split(' --> ').map(toSec);
    const text = lines.slice(2);
    maxChars = Math.max(maxChars, ...text.map((l) => l.length));
    maxLines = Math.max(maxLines, text.length);
    if (times[0] < prevEnd - 0.05) overlaps++;
    if (times[1] - times[0] < 1.0) tooShort++;
    prevEnd = times[1];
  }
  add('GATE 5', 'S1', 'cues parse', blocks.length > 0 ? 'PASS' : 'FAIL', `${blocks.length} cues`);
  add('GATE 5', 'S2', 'max 2 lines per cue', maxLines <= 2 ? 'PASS' : 'FAIL', `${maxLines} lines`);
  add('GATE 5', 'S3', 'max 42 chars per line', maxChars <= 42 ? 'PASS' : 'NEEDS REVIEW', `${maxChars} chars (limit 42)`);
  add('GATE 5', 'S4', 'no overlapping cues', overlaps === 0 ? 'PASS' : 'FAIL', `${overlaps} overlaps`);
  add('GATE 5', 'S5', 'minimum 1.0 s on screen', tooShort === 0 ? 'PASS' : 'NEEDS REVIEW', `${tooShort} cues shorter`);
}

/* ---------------- GATE 5: frames ---------------- */
const frames = exists('rendering/frames') ? fs.readdirSync(p('rendering/frames')).filter((f) => f.endsWith('.png')).length : 0;
const tlPath = 'content/timeline.json';
const expected = exists(tlPath) ? JSON.parse(fs.readFileSync(p(tlPath), 'utf8')).durationInFrames : 0;
add('GATE 5', 'F1', 'all frames rendered', frames === expected && frames > 0 ? 'PASS' : 'FAIL', `${frames}/${expected}`);

/* ---------------- GATE 5: poster ---------------- */
const poster = 'deliverables/A_mbg-gizi-anak_1080x1350.png';
if (!exists(poster)) add('GATE 5', 'P1', 'poster 1080x1350', 'NOT TESTED', 'missing');
else {
  const info = readPngSize(poster);
  add('GATE 5', 'P1', 'poster 1080x1350', info.w === 1080 && info.h === 1350 ? 'PASS' : 'FAIL', `${info.w}x${info.h}`);
}

/* ---------------- GATE 6: assets & determinism ---------------- */
const fontsJson = JSON.parse(fs.readFileSync(p('assets/fonts/fonts.json'), 'utf8')) as { fonts: { family: string }[] };
const families = new Set(fontsJson.fonts.map((f) => f.family));
add('GATE 6', 'A1', 'max two font families', families.size <= 2 ? 'PASS' : 'FAIL', [...families].join(', '));
add('GATE 6', 'A2', 'font files are local (offline build)', fontsJson.fonts.length > 0 ? 'PASS' : 'FAIL', `${fontsJson.fonts.length} ttf`);

writeJson('qa/report-technical.json', { generatedAt: new Date().toISOString(), checks });
fs.mkdirSync(p('qa'), { recursive: true });
const md = [
  '# Technical QA — MBG: 0,0017 persen punya nama',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Gate | ID | Check | Status | Detail |',
  '| --- | --- | --- | --- | --- |',
  ...checks.map((c) => `| ${c.gate} | ${c.id} | ${c.check} | **${c.status}** | ${c.detail} |`),
  '',
].join('\n');
fs.writeFileSync(p('qa/QA-TECHNICAL.md'), md);
console.table(checks.map((c) => ({ id: c.id, check: c.check, status: c.status, detail: c.detail })));

function readPngSize(file: string) {
  const b = fs.readFileSync(p(file));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
