/**
 * AUDIO MIX
 * ---------
 * voice-over + original score + sound design -> single 48 kHz / 24-bit master.
 *
 * The score is side-chain ducked by the voice, not just turned down: the music has to
 * get out of the way of the argument on every line, then come back in the gaps.
 * Final loudness target: -14 LUFS integrated, -1.5 dBTP (streaming reference).
 */
import fs from 'node:fs';
import { FFMPEG, measureLoudness, p, readJson, run, writeJson } from './lib';

const FPS = 30;
const timeline = readJson<{ durationInFrames: number; vo: { id: string; file: string; startFrame: number }[] }>('content/timeline.json');

/** per-line level trim, measured by pipeline/measure-voiceover.ts */
const voGain = new Map<string, number>();
try {
  const manifest = readJson<{ segments: { id: string; gainDb?: number }[] }>('audio/voiceovers/manifest.json');
  for (const s of manifest.segments) if (s.gainDb !== undefined) voGain.set(s.id, s.gainDb);
} catch {
  console.warn('[mix] no voiceover manifest: line levels will not be matched');
}
const cues = readJson<{
  totalFrames: number;
  music: { file: string; gainDb: number };
  sfx: { at: number; file: string; gainDb: number; note: string }[];
}>('content/audio-cues.json');

const args: string[] = ['-y', '-hide_banner', '-loglevel', 'error'];
const filters: string[] = [];
const inputs: string[] = [];

const addInput = (file: string) => {
  inputs.push('-i', p(file));
  return inputs.length / 2 - 1;
};

const db = (v: number) => `${Math.round(v * 10) / 10}dB`;
/**
 * This ffmpeg build (5.x packaged with @ffmpeg-installer) has no `amix=normalize=0`,
 * so amix always divides the sum by its input count. We pre-multiply every input by
 * that same factor, which restores unity gain exactly (voice tracks never overlap).
 */
const undoAmix = (inputs: number) => 20 * Math.log10(inputs);

/* ---- voice-over ---- */
const voLabels: string[] = [];
const voCount = Math.max(1, timeline.vo.length);
for (const vo of timeline.vo) {
  const idx = addInput(vo.file);
  const ms = Math.round((vo.startFrame / FPS) * 1000);
  const label = `vo${idx}`;
  const level = voGain.get(vo.id) ?? 0;
  filters.push(
    `[${idx}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${ms}|${ms},highpass=f=90,acompressor=threshold=0.12:ratio=3:attack=8:release=180:makeup=2,volume=${db(level + undoAmix(voCount))}[${label}]`,
  );
  voLabels.push(`[${label}]`);
}
filters.push(`${voLabels.join('')}amix=inputs=${voCount}:dropout_transition=0[vo]`);
filters.push('[vo]asplit=2[voOut][voKey]');

/* ---- score (ducked by the voice) ---- */
const musicIdx = addInput(cues.music.file);
filters.push(`[${musicIdx}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${db(cues.music.gainDb)},lowpass=f=9000[mus]`);
filters.push('[mus][voKey]sidechaincompress=threshold=0.02:ratio=7:attack=12:release=420:makeup=1[musDucked]');

/* ---- sound design ---- */
const sfxLabels: string[] = [];
for (const cue of cues.sfx) {
  const idx = addInput(cue.file);
  const ms = Math.round((cue.at / FPS) * 1000);
  const label = `sfx${idx}`;
  filters.push(
    `[${idx}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${db(cue.gainDb)},adelay=${ms}|${ms}[${label}]`,
  );
  sfxLabels.push(`[${label}]`);
}
if (sfxLabels.length) {
  // per-cue gains already applied above; undo the amix division on the whole bus
  filters.push(`${sfxLabels.join('')}amix=inputs=${sfxLabels.length}:dropout_transition=0[sfxSum]`);
  filters.push(`[sfxSum]volume=${db(undoAmix(sfxLabels.length))}[sfx]`);
}

/* ---- sum + master ----
 * This build rejects a 3-input amix (invalid argument), so buses are summed in pairs.
 * Every amix divides by its input count; each input is pre-gained by that factor.
 */
const pairUp = 6.0; // 20*log10(2)
filters.push(`[voOut]volume=${db(pairUp)}[voG]`);
filters.push(`[musDucked]volume=${db(pairUp)}[musG]`);
filters.push('[voG][musG]amix=inputs=2:dropout_transition=0[mix1]');
if (sfxLabels.length) {
  filters.push(`[mix1]volume=${db(pairUp)}[mix1G]`);
  filters.push(`[sfx]volume=${db(pairUp)}[sfxG]`);
  filters.push('[mix1G][sfxG]amix=inputs=2:dropout_transition=0[mixed]');
} else {
  filters.push('[mix1]anull[mixed]');
}
// loudnorm upsamples to 192 kHz internally and drops the channel layout: restate both.
// single-pass loudnorm overshoots by ~2 LU here, so a fixed -2.1 dB trim lands the master on -14 LUFS (verified below)
filters.push('[mixed]loudnorm=I=-14:TP=-1.5:LRA=11,volume=-2.1dB,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[out]');

fs.mkdirSync(p('audio/mix'), { recursive: true });
const out = p('audio/mix/mbg-gizi-anak.master.wav');
const durationSec = timeline.durationInFrames / FPS;

if (process.env.DUMP_FFMPEG) {
  fs.writeFileSync('/tmp/ffargs.json', JSON.stringify([...args, ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-t', durationSec.toFixed(3), '-c:a', 'pcm_s24le', '-ar', '48000', out], null, 1));
}
run(FFMPEG, [
  ...args,
  ...inputs,
  '-filter_complex', filters.join(';'),
  '-map', '[out]',
  '-t', durationSec.toFixed(3),
  '-c:a', 'pcm_s24le',
  '-ar', '48000',
  out,
]);

writeJson('audio/mix/mix-report.json', {
  master: 'audio/mix/mbg-gizi-anak.master.wav',
  durationSec,
  voiceSegments: timeline.vo.length,
  sfxCues: cues.sfx.length,
  chain: ['highpass 90Hz', 'acompressor 3:1', 'sidechain duck -7:1 on score', 'loudnorm I=-14 TP=-1.5'],
});

/* ---- loudness verification (measured, not assumed) ---- */
const loud = measureLoudness('audio/mix/mbg-gizi-anak.master.wav');
console.log(`master written: ${out}`);
console.log(`loudness measured: ${loud.integrated ?? 'n/a'} LUFS / true peak ${loud.truePeak ?? 'n/a'} dBTP`);
