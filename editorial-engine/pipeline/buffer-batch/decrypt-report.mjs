#!/usr/bin/env node
/* Decrypt Action annotations privately; never print captions, IDs or media URLs. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decryptAnnotations} from '../decrypt-diagnostic.mjs';
import {resolvePrivateFile} from './prepare.mjs';

const ROOT=fileURLToPath(new URL('../../../', import.meta.url));
const PRIVATE=path.join(ROOT,'editorial-engine/deliverables/buffer-batch/private');
export function saveReport(annotations,key,output) {
  const a=resolvePrivateFile(annotations),k=resolvePrivateFile(key);
  const root=fs.realpathSync(PRIVATE), parent=fs.realpathSync(path.dirname(path.resolve(output)));
  if (!parent.startsWith(root+path.sep) || path.basename(output)!=='report.json') throw new Error('PRIVATE_OUTPUT_REQUIRED');
  const result=decryptAnnotations(JSON.parse(fs.readFileSync(a,'utf8')),fs.readFileSync(k));
  fs.writeFileSync(path.join(parent,'report.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  return true;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const [a,k,out,...extra]=process.argv.slice(2);if(!a||!k||!out||extra.length)throw Error('USAGE');
    saveReport(a,k,out);console.log('Encrypted batch report decrypted to the private directory.');
  }catch {console.error('Batch report decryption failed; inspect paths, key and chunks locally.');process.exitCode=1;}
}
