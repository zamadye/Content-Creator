#!/usr/bin/env node
/**
 * inspect-buffer.mjs — "akun mana yang sebenarnya tersambung ke Buffer?"
 *
 * Menjawab satu pertanyaan dengan bukti, bukan dugaan:
 *   - akun Buffer mana yang dipakai kunci ini
 *   - organisasi apa saja yang bisa dilihat
 *   - kanal apa saja yang tersambung, dan khususnya: kanal YouTube mana
 *
 * Pemakaian:
 *   BUFFER_API_KEY=xxx node pipeline/inspect-buffer.mjs
 *   ./publish.sh --akun                      # versi satu klik
 *   node pipeline/inspect-buffer.mjs --raw   # tampilkan JSON mentah juga
 *
 * Tidak menulis apa pun ke disk. Email disamarkan secara bawaan karena
 * repo ini publik — log GitHub Actions bisa dibaca siapa saja.
 */
import { spawnSync } from 'node:child_process';
// run 2026-11-10: dipicu ulang untuk mendapatkan channelId YouTube (short gateway kamu-masih-muda).

const RAW = process.argv.includes('--raw');
const KEY = process.env.BUFFER_API_KEY;
const ORG_ONLY = (() => {
  const i = process.argv.indexOf('--organization-id');
  return i > -1 ? process.argv[i + 1] : process.env.BUFFER_ORGANIZATION_ID;
})();

const maskEmail = (s) => {
  if (!s || typeof s !== 'string' || !s.includes('@')) return s;
  const [u, d] = s.split('@');
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(1, u.length - 2))}@${d.replace(/^[^.]*/, (m) => `${m.slice(0, 1)}***`)}`;
};

const run = (args) => {
  const r = spawnSync('buffer', [...args, '--output', 'json', '--quiet'], {
    env: { ...process.env, BUFFER_API_KEY: KEY, NO_COLOR: '1' },
    encoding: 'utf8',
    timeout: 60_000,
  });
  const out = (r.stdout ?? '').trim();
  let json = null;
  try {
    json = JSON.parse(out);
  } catch {
    /* biarkan null, ditangani pemanggil */
  }
  return { status: r.status, json, out, err: (r.stderr ?? '').trim() };
};

/** Cari objek pertama yang punya `predicate` benar, menelusuri JSON apa pun bentuknya. */
const dig = (node, predicate, depth = 0) => {
  if (!node || typeof node !== 'object' || depth > 8) return null;
  if (predicate(node)) return node;
  for (const v of Object.values(node)) {
    const hit = dig(v, predicate, depth + 1);
    if (hit) return hit;
  }
  return null;
};

const fail = (msg, raw) => {
  console.error(`✗ ${msg}`);
  if (raw) console.error(raw);
  process.exit(1);
};

if (!KEY) fail('BUFFER_API_KEY belum diset. Taruh di .env atau export lebih dulu.');

const which = spawnSync('buffer', ['--version'], { encoding: 'utf8' });
if (which.status !== 0) fail('CLI buffer tidak ditemukan. Jalankan: npm i -g @bufferapp/cli');

console.log(`CLI buffer: ${(which.stdout ?? '').trim()}`);

/* ---------------------------------------------------------------- akun */
console.log('\n=== 1. akun ===');
const acc = run(['account', '--fields', 'id,email,name,timezone,organizations.id,organizations.name,organizations.channelCount']);
if (acc.status !== 0) {
  fail('panggilan `buffer account` gagal — inilah error aslinya (bukan tebakan):', acc.err || acc.out);
}
const account = dig(acc.json, (o) => 'email' in o || 'timezone' in o);
if (!account) fail('respons tidak berbentuk yang diharapkan.', JSON.stringify(acc.json).slice(0, 800));

console.log(`  email    : ${maskEmail(account.email)}`);
if (account.name) console.log(`  nama     : ${account.name}`);
console.log(`  zona     : ${account.timezone ?? '(tidak disebut)'}`);

const orgs = account.organizations
  ? account.organizations.filter(Boolean)
  : dig(acc.json, (o) => Array.isArray(o.channels))?.channels ?? [];
if (!orgs.length) fail('tidak ada organisasi pada akun ini.');

console.log('\n=== 2. organisasi ===');
for (const o of orgs) {
  console.log(`  ${o.name ?? '(tanpa nama)'}  id=${o.id}  kanal=${o.channelCount ?? '?'}`);
}

/* -------------------------------------------------------------- kanal */
console.log('\n=== 3. kanal tersambung ===');
let youtube = [];
let total = 0;

for (const org of orgs) {
  if (ORG_ONLY && String(org.id) !== String(ORG_ONLY)) continue;
  const res = run(['channels', 'list', '--organization-id', String(org.id)]);
  if (res.status !== 0) {
    console.log(`  ! gagal mengambil kanal org ${org.id}: ${res.err || res.out}`);
    continue;
  }
  const arr = dig(res.json, (o) => Array.isArray(o.channels))?.channels ?? (Array.isArray(res.json) ? res.json : []);
  if (!arr.length) {
    console.log(`  (org ${org.name ?? org.id}: tidak ada kanal)`);
    continue;
  }

  console.log(`\n  — ${org.name ?? org.id} (${arr.length} kanal)`);
  for (const c of arr) {
    total++;
    const service = String(c.service ?? c.channelType ?? c.type ?? '?').toLowerCase();
    const name = c.name ?? c.displayName ?? c.handle ?? c.username ?? '(tanpa nama)';
    const id = c.id ?? c.channelId ?? '?';
    const isYt = service.includes('youtube');
    if (isYt) youtube.push({ name, id, org: org.name, extra: c });
    console.log(`    ${isYt ? '▶' : ' '} ${service.padEnd(10)} ${String(name).padEnd(28)} id=${id}`);
    if (RAW) console.log('      ' + JSON.stringify(c));
  }
}

/* ------------------------------------------------------------ ringkas */
console.log('\n=== 4. kesimpulan ===');
console.log(`  total kanal terlihat : ${total}`);
if (!youtube.length) {
  console.log('  YouTube              : ✗ tidak ada kanal YouTube tersambung ke organisasi ini');
} else {
  for (const y of youtube) {
    console.log(`  YouTube              : ✓ ${y.name}  (id=${y.id}, org=${y.org})`);
  }
}
console.log('\n  Catatan: kanal YouTube harus tersambung lewat akun Google pemilik channel,');
console.log('  bukan brand account lain — kalau nama di atas bukan channel yang Anda maksud,');
console.log('  sambungkan ulang di Buffer → Channels → Connect Channel → YouTube.');
