// Baca docs/PIPELINE-AUDIT.md dan hitung status per fase dari baris tabelnya.
// Dipakai oleh scripts/audit-count.mjs (menulis ulang ringkasan) dan oleh
// scripts/test-studio.mjs (memastikan ringkasan tidak pernah basi).
export const STATUSES = ['✅', '◐', '⛔', '—'];

export function parseAudit(md) {
  const phases = [];
  let cur = null;
  for (const line of md.split('\n')) {
    const head = line.match(/^## Phase (\d+) — (.+)$/);
    if (head) {
      cur = {n: Number(head[1]), name: head[2].trim(), rows: []};
      phases.push(cur);
      continue;
    }
    if (line.startsWith('## ')) cur = null;
    if (!cur) continue;
    const row = line.match(/^\| (\d+) \| (.+?) \| (✅|◐|⛔|—) \|/);
    if (row) cur.rows.push({step: Number(row[1]), title: row[2].trim(), status: row[3]});
  }
  const count = (rows) => {
    const c = {total: rows.length};
    for (const s of STATUSES) c[s] = rows.filter((r) => r.status === s).length;
    return c;
  };
  const totals = count(phases.flatMap((p) => p.rows));
  return {phases: phases.map((p) => ({...p, counts: count(p.rows)})), totals};
}

/** Tabel ringkasan markdown yang cocok dengan isi fase. */
export function summaryTable({phases, totals}) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  const out = [
    line(['#', 'Fase', '✅', '◐', '⛔', '—']),
    '|---|---|---|---|---|---|',
    ...phases.map((p) => line([p.n, p.name, p.counts['✅'], p.counts['◐'], p.counts['⛔'], p.counts['—']])),
    line(['', '**Total**', totals['✅'], totals['◐'], totals['⛔'], totals['—']]),
  ];
  return out.join('\n');
}

export function totalLine({totals}) {
  const f = (n, w) => String(n).padStart(w);
  return (
    `Total: ${f(totals['✅'], 2)} selesai · ${f(totals['◐'], 2)} sebagian · ` +
    `${f(totals['⛔'], 2)} belum · ${f(totals['—'], 2)} tidak berlaku · ` +
    `${f(totals.total, 2)} langkah.`
  );
}
