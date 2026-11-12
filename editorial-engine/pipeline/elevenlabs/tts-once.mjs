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

const fail = (msg) => {
  const one = String(msg).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  console.log(`::error::${one}`);
  console.error(msg);
};

async function api(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 300)}`);
  }
  return res;
}

async function main() {
  if (!key) {
    fail('FAIL: ELEVENLABS_API_KEY not set (workflow maps secret ELEVENTLABS_API_KEY + fallbacks).');
    process.exit(2);
  }
  const episode = JSON.parse(fs.readFileSync(path.join(ROOT, SCRIPT), 'utf8'));
  const text = episode.fullTextTTS;
  if (!text || text.length < 200) { fail('FAIL: script has no fullTextTTS'); process.exit(2); }
  if (text.length > 4500) { fail(`FAIL: text too long for one request: ${text.length}`); process.exit(2); }

  // 1) Resolve the voice: explicit VOICE_ID wins (no voices_read permission
  // needed); otherwise resolve by NAME via GET /v1/voices.
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '';
  let voiceId = '', voiceName = VOICE_NAME;
  if (VOICE_ID) {
    voiceId = VOICE_ID;
    console.log(JSON.stringify({step: 'voice-id-direct', voiceId}));
  } else {
    const voicesRes = await api(`${API}/v1/voices`, {headers: {'xi-api-key': key}});
    const voices = (await voicesRes.json()).voices || [];
    const match = voices.find(v => v.name && v.name.toLowerCase() === VOICE_NAME.toLowerCase());
    if (!match) {
      fail(`FAIL: voice "${VOICE_NAME}" not found. Available: ${voices.map(v => v.name).join(', ').slice(0, 800)}`);
      process.exit(3);
    }
    voiceId = match.voice_id; voiceName = match.name;
    console.log(JSON.stringify({step: 'voice-resolved', name: match.name, voiceId: match.voice_id, category: match.category || null}));
  }

  // 2) Render the script.
  const ttsRes = await api(`${API}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'content-type': 'application/json', 'accept': 'audio/mpeg'},
    body: JSON.stringify({text, model_id: MODEL, voice_settings: {stability: 0.42, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true}})
  });
  const buf = Buffer.from(await ttsRes.arrayBuffer());
  if (buf.length < 10000) { fail(`FAIL: suspiciously small audio (${buf.length} B)`); process.exit(4); }
  fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), {recursive: true});
  fs.writeFileSync(path.join(ROOT, OUT), buf);
  const out = {
    ok: true,
    voice: {name: voiceName, voiceId},
    model: MODEL,
    textChars: text.length,
    audioBytes: buf.length,
    output: OUT,
    note: 'VO only. Subtitle timing comes later from silence detection on this file. Nothing published.'
  };
  console.log(JSON.stringify(out));
  fs.writeFileSync(path.join(ROOT, OUT + '.meta.json'), JSON.stringify(out, null, 2) + '\n');
}

main().catch(e => { fail(`TTS-FAILED: ${e && e.message || e}`); process.exit(1); });
