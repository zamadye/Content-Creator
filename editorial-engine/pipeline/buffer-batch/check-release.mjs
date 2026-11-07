#!/usr/bin/env node
/* Read-only deletion/revocation gate. Input is a freshly fetched private
 * Buffer status snapshot plus a complete list of all posts using a copy.
 * This program does not change Drive permissions or delete any files. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertSafeToRevoke, BatchError} from './core.mjs';
import {resolvePrivateFile} from './prepare.mjs';

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const [input,...extra]=process.argv.slice(2);if(!input||extra.length)throw new BatchError('USAGE');
    const data=JSON.parse(fs.readFileSync(resolvePrivateFile(input),'utf8'));
    assertSafeToRevoke(data);
    console.log('PASS: all recorded dependencies are sent with links; manual permission review still required.');
  } catch(err) {
    console.error(`BLOCK: ${err instanceof BatchError ? err.code : 'PRIVATE_INPUT_INVALID'}. Keep the source accessible.`);
    process.exitCode=1;
  }
}
