import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// compileStory resolves outfit variants and includes assets used as props or set dressing.
export function productionIssues(compiled, registry, publicDir) {
  const issues = [];
  for (const id of compiled.assetIds) {
    const actor = registry.assets[id];
    if (!['character', 'entity'].includes(actor?.category)) continue;
    if (actor.status !== 'approved' || !actor.review?.sha256) {
      issues.push(id + ' belum lulus ulasan karakter');
      continue;
    }
    const digest = createHash('sha256')
      .update(fs.readFileSync(path.join(publicDir, actor.uri)))
      .digest('hex');
    if (digest !== actor.review.sha256) issues.push(id + ' berubah sejak ulasan terakhir');
  }
  return issues;
}
