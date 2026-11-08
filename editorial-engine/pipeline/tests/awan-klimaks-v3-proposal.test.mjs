import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Structure checks only: they do not render video, hear voice, assess creative
// quality, verify licenses, or authorize publication.
const source = new URL('../../content/proposals/awan-500-ton-klimaks-v3.json', import.meta.url);
const p = JSON.parse(fs.readFileSync(source, 'utf8'));

test('V3 remains a separate, unapproved proposal and preserves V2', () => {
  assert.match(p.status, /PROPOSAL/);
  assert.match(p.status, /belum dirender/);
  assert.match(p.status, /belum disetujui publikasi/);
  assert.equal(p.derivedFrom, 'awan-500-ton-rig-v2');
  assert.equal(p.preserveOriginal, true);
  assert.match(p.voice, /voice-05/);
  assert.match(p.voice, /belum dibuat/);
});

test('opening ties a concrete entity and first question to a later payoff', () => {
  assert.equal(p.scenes[0].id, 'S01');
  assert.equal(p.opening.firstLine, p.scenes[0].narration);
  assert.match(p.opening.firstLine, /\?/);
  assert.match(p.opening.entityAtFrameZero.toLowerCase(), /awan/);
  assert.match(p.opening.cut, /CUT|[Cc]ut/);
  assert.equal(p.scenes[0].payoffScene, 'S04');
  assert.match(p.scenes.find(s => s.id === 'S04').beat, /PUNCAK/);
  assert.match(p.opening.onScreenQualifier.toLowerCase(), /satu contoh/);
});

test('each scene has concrete actions, a mapped Host, and two or more distinct objects', () => {
  assert.equal(new Set(p.scenes.map(s => s.id)).size, p.scenes.length);
  assert.ok(p.scenes.length > 1);
  const sourceIds = new Set(p.sources.map(s => s.id));
  for (const s of p.scenes) {
    assert.ok(s.narration && s.visualAction && s.hostAction, s.id);
    assert.ok(Array.isArray(s.objectMap) && new Set(s.objectMap).size >= 2, s.id);
    assert.ok(s.objectMap.includes('Host'), s.id);
    for (const sourceId of s.sourceRefs) assert.ok(sourceIds.has(sourceId), `${s.id}: ${sourceId}`);
  }
  assert.match(p.scenes.at(-1).narration, /ikuti knot theory\.$/);
  assert.match(p.scenes.at(-1).visualAction, /ikuti knot theory/);
});

test('readable storyboard contains the same script, scene actions, and source claims', () => {
  const md = fs.readFileSync(new URL('../../content/proposals/AWAN-V3-NASKAH-DAN-STORYBOARD.md', import.meta.url), 'utf8');
  for (const s of p.scenes) {
    assert.ok(md.includes(`> ${s.narration}`), `${s.id}: narrated script`);
    assert.ok(md.includes(`**Visual dan aksi:** ${s.visualAction}`), `${s.id}: visual action`);
    assert.ok(md.includes(`**Gerak Host:** ${s.hostAction}`), `${s.id}: host action`);
    assert.ok(md.includes(`**Object map:** ${s.objectMap.join(', ')}.`), `${s.id}: object map`);
  }
  for (const ref of p.sources) {
    assert.ok(md.includes(`[${ref.id}](${ref.url}): ${ref.claim}`), ref.id);
  }
});

test('factual limits and untested production requirements remain explicit', () => {
  assert.match(p.sources.find(s => s.id === 'usgs').claim, /500\.000 kg/);
  assert.match(p.sources.find(s => s.id === 'usgs').claim, /massa udara tidak dihitung/);
  assert.match(p.scenes.find(s => s.id === 'S03').narration, /bukan untuk semua awan/i);
  assert.ok(p.notTested.some(s => s.includes('voice-05')));
  assert.ok(p.notTested.some(s => s.includes('publikasi')));
});
