#!/usr/bin/env node
/**
 * zernio-check.mjs — diagnostik integrasi Zernio.
 *
 * Menjawab, tanpa mencetak rahasia apa pun:
 *   1. Apakah secret Zernio benar-benar sampai ke runner?
 *   2. Apakah API menerima key itu (autentikasi)?
 *   3. Akun/kanal apa yang terhubung, dan apakah ada kanal YouTube?
 *   4. Apakah akun sehat dan paket/billing tidak memblokir penerbitan?
 *
 * Jalankan: node tools/publish/zernio-check.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readKey, notice, warn, fail, describeError, loadSdk } from './lib/zernio.mjs';

const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../report/zernio-check.json',
);

const report = {
  checkedAt: new Date().toISOString(),
  runtime: {
    node: process.version,
    runner: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local',
    sha: process.env.GITHUB_SHA ?? null,
  },
  secret: { present: false, from: null, length: null },
  auth: { ok: false, error: null },
  accounts: [],
  youtube: [],
  youtubeTargets: [],
  health: { ok: false, error: null },
  billing: { ok: false, error: null },
  verdict: 'unknown',
};

function persist() {
  try {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
    notice(`Laporan ditulis ke ${OUT}`);
  } catch (error) {
    warn(`Gagal menulis laporan: ${describeError(error)}`);
  }
}

const key = readKey();
if (!key) {
  fail('Secret Zernio tidak terlihat oleh job ini. Periksa Settings → Secrets and variables → Actions, lalu pastikan namanya ZERNIO_API_KEY (atau ZERNIO_KEY).');
  report.verdict = 'no-secret';
  persist();
  process.exit(2);
}

report.secret = { present: true, from: key.name, length: key.length };
notice(`Secret ditemukan: nama=${key.name} panjang=${key.length} karakter.`);

const Zernio = await loadSdk();

let zernio;
try {
  zernio = new Zernio({ apiKey: key.value });
} catch (error) {
  fail(`SDK gagal diinisialisasi: ${describeError(error)}`);
  report.verdict = 'sdk-init-failed';
  persist();
  process.exit(3);
}

// ---------------------------------------------------------------------------
// 1. Akun terhubung
// ---------------------------------------------------------------------------
try {
  const { data } = await zernio.accounts.listAccounts();
  const accounts = data?.accounts ?? [];
  report.auth.ok = true;
  report.accounts = accounts.map((account) => ({
    id: account._id ?? account.id ?? null,
    platform: account.platform,
    username: account.username ?? account.name ?? null,
    displayName: account.displayName ?? account.name ?? null,
    profileId: account.profileId ?? null,
    isActive: account.isActive ?? account.active ?? null,
    status: account.status ?? null,
  }));

  notice(`Autentikasi Berhasil. ${accounts.length} akun terhubung.`);
  for (const account of report.accounts) {
    notice(
      `Akun: platform=${account.platform} username=${account.username ?? '-'} id=${account.id} status=${account.status ?? (account.isActive === false ? 'inactive' : 'active')}`,
    );
  }

  report.youtube = report.accounts.filter((account) => account.platform === 'youtube');
  if (report.youtube.length === 0) {
    fail('Tidak ada akun YouTube terhubung ke workspace Zernio. Hubungkan kanal YouTube di dashboard Zernio sebelum menerbitkan.');
  } else {
    const active = report.youtube.filter((account) => account.isActive !== false);
    notice(`Kanal YouTube: ${report.youtube.length} terhubung, ${active.length} aktif.`);
    report.youtubeTargets = active.map((account) => ({
      accountId: account._id ?? account.id,
      username: account.username,
    }));
  }
} catch (error) {
  report.auth.error = describeError(error);
  fail(`Autentikasi/daftar akun gagal: ${report.auth.error}`);
}

// ---------------------------------------------------------------------------
// 2. Kesehatan akun (kalau ada akun YouTube)
// ---------------------------------------------------------------------------
if (report.youtube.length > 0) {
  try {
    const { data } = await zernio.accounts.getAllAccountsHealth();
    const health = data?.accounts ?? data ?? [];
    report.health = { ok: true, error: null, raw: Array.isArray(health) ? health : [] };
    for (const entry of Array.isArray(health) ? health : []) {
      if (entry?.platform === 'youtube') {
        notice(`Kesehatan YouTube: ${JSON.stringify(entry).slice(0, 400)}`);
      }
    }
  } catch (error) {
    report.health = { ok: false, error: describeError(error) };
    warn(`Pemeriksaan kesehatan akun gagal (tidak fatal): ${report.health.error}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Paket / billing — kuota habis berarti upload akan ditolak
// ---------------------------------------------------------------------------
try {
  const { data } = await zernio.usage.getUsageStats();
  const plan = data?.plan ?? data?.subscription ?? null;
  const status = data?.status ?? data?.paymentStatus ?? null;
  report.billing = {
    ok: true,
    error: null,
    plan: plan ?? null,
    status: status ?? null,
    snapshot: data ?? null,
  };
  notice(`Paket: ${typeof plan === 'string' ? plan : JSON.stringify(plan ?? 'tidak dilaporkan')} · status=${status ?? 'tidak dilaporkan'}`);
} catch (error) {
  report.billing = { ok: false, error: describeError(error) };
  warn(`Pemeriksaan billing gagal (tidak fatal): ${report.billing.error}`);
}

// ---------------------------------------------------------------------------
// Putusan
// ---------------------------------------------------------------------------
if (!report.auth.ok) report.verdict = 'auth-failed';
else if (report.youtube.length === 0) report.verdict = 'no-youtube-account';
else if (report.youtubeTargets.length === 0) report.verdict = 'youtube-inactive';
else report.verdict = 'ready';

notice(`PUTUSAN: ${report.verdict}`);
persist();

if (report.verdict !== 'ready') process.exit(1);
