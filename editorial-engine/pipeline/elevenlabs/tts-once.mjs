#!/usr/bin/env node
/**
 * ElevenLabs TTS for Dunia Kebalik episodes. Runs on GitHub Actions only
 * (api.elevenlabs.io is not reachable from the sandbox). Finds a voice by
 * name via GET /v1/voices, then renders the episode script to MP3.
 * No publishing, no Drive, no posting — writes the audio file locally.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCRIPT = process.argv[2] || 'editorial-engine/content/kamar-berlangit/naskah-vo.json';
const OUT = process.argv[3] || 'editorial-engine/assets/audio/episode-kamar-berlangit-2026/vo-kamar-berlangit.mp3';
const VOICE_NAME = process.argv[4] || 'Zephlyn';
const MODEL = 'eleven_multilingual_v2';
const API = 'https://api.elevenlabs.io';
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('FAIL: ELEVENLABS_API_KEY not set (checked fallback secret names in the workflow).');
  process.exit(2);
}
const episode = JSON.parse(fs.readFileSync(path.join(ROOT, SCRIPT), 'utf8'));
const text = episode.fullTextTTS;
if (!text || text.length < 200) { console.error('FAIL: script has no fullTextTTS'); process.exit(2); }
if (text.length > 4500) { console.error(`FAIL: text too long for one request: ${text.length}`); process.exit(2); }

async function api(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 400)}`);
  }
  return res;
}

// 1) Resolve the voice by NAME (user asked: use voices -> Zephlyn).
const voicesRes = await api(`${API}/v1/voices`, {headers: {'xi-api-key': key}});
const voices = (await voicesRes.json()).voices || [];
const match = voices.find(v => v.name && v.name.toLowerCase() === VOICE_NAME.toLowerCase());
if (!match) {
  console.error(`FAIL: voice "${VOICE_NAME}" not found. Available names: ${voices.map(v => v.name).join(', ')}`);
  process.exit(3);
}
console.log(JSON.stringify({step: 'voice-resolved', name: match.name, voiceId: match.voice_id, category: match.category || null}));

// 2) Render the script.
const body = {
  text,
  model_id: MODEL,
  voice_settings: {stability: 0.42, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true}
};
const ttsRes = await api(`${API}/v1/text-to-speech/${match.voice_id}?output_format=mp3_44100_128`, {
  method: 'POST',
  headers: {'xi-api-key': key, 'content-type': 'application/json', 'accept': 'audio/mpeg'},
  body: JSON.stringify(body)
});
const buf = Buffer.from(await ttsRes.arrayBuffer());
if (buf.length < 10000) { console.error(`FAIL: suspiciously small audio (${buf.length} B)`); process.exit(4); }
fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), {recursive: true});
fs.writeFileSync(path.join(ROOT, OUT), buf);
const out = {
  ok: true,
  voice: {name: match.name, voiceId: match.voice_id},
  model: MODEL,
  textChars: text.length,
  audioBytes: buf.length,
  output: OUT,
  note: 'VO only. Subtitle timing comes later from silence detection on this file. Nothing published.'
};
console.log(JSON.stringify(out));
fs.writeFileSync(path.join(ROOT, OUT + '.meta.json'), JSON.stringify(out, null, 2) + '\n');
