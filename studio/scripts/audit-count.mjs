/**
 * Hitung ulang ringkasan docs/PIPELINE-AUDIT.md dari baris tabel fase.
 *
 *   node scripts/audit-count.mjs           # cetak ringkasan
 *   node scripts/audit-count.mjs --write   # tulis ulang tabel + baris total
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseAudit, summaryTable, totalLine} from './lib/audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs', 'PIPELINE-AUDIT.md');
const md = fs.readFileSync(file, 'utf8');
const audit = parseAudit(md);

console.log(summaryTable(audit));
console.log();
console.log(totalLine(audit));

if (process.argv.includes('--write')) {
  const tableStart = md.indexOf('| # | Fase | ✅ | ◐ | ⛔ | — |');
  const tableEnd = md.indexOf('\n\n', md.indexOf('|', md.indexOf('|---|---|---|---|---|---|') + 1));
  let out = md.slice(0, tableStart) + summaryTable(audit) + md.slice(tableEnd);
  out = out.replace(/^Total: .*$/m, totalLine(audit));
  fs.writeFileSync(file, out);
  console.log('\nringkasan ditulis ulang.');
}
