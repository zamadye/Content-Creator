import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateManifest} from '../src/manifest.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
 const file=process.argv[2]; if(!file || process.argv.length!==3) throw Error('Usage: node scripts/validate-story.mjs stories/example.json');
 const props=JSON.parse(fs.readFileSync(file,'utf8'));
 if (!props || typeof props !== 'object' || Object.keys(props).some(k=>k!=='story')) throw Error('Expected props object containing only story');
 const info=validateManifest(props.story);
 for (const a of props.story.audio || []) {
  const publicDir=fs.realpathSync(path.join(root,'public'));
  const f=fs.realpathSync(path.join(publicDir,a.src));
  if (!f.startsWith(publicDir+path.sep) || !fs.statSync(f).isFile()) throw Error(`Audio outside public/ or not a file: ${a.src}`);
 }
 console.log(`Valid: ${props.story.id}, ${info.durationInFrames} frames at ${info.fps} fps`);
} catch(e) { console.error(e.message); process.exitCode=1; }
