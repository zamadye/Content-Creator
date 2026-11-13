// Extract the original guide without claiming its 13:25 timings match the VOs.
import fs from 'node:fs';
const guide=fs.readFileSync('PANDUAN-ANIMASI-ORIGINAL.md','utf8');
const rows=[];let sceneTitle='';
for(const line of guide.split('\n')) {
 const heading=line.match(/^### Adegan (\d+): (.+)$/);
 if(heading){sceneTitle=heading[2];continue;}
 const match=line.match(/^\| (\d+)\.(\d+) \| (\d\d:\d\d)-(\d\d:\d\d) \| (.+)$/);
 if(!match) continue;
 const [,scene,shot,originalStart,originalEnd,description]=match;
 rows.push({id:`${scene}.${shot}`,scene:Number(scene),sceneTitle,originalStart,originalEnd,description:description.replace(/ \|$/,'')});
}
if(rows.length!==72||new Set(rows.map(s=>s.scene)).size!==14)throw Error(`Guide extraction failed: ${rows.length} shots`);
fs.writeFileSync('data/guide-72-shots.json',JSON.stringify(rows,null,2)+'\n');
console.log(`Extracted ${rows.length} reference shots in 14 scenes`);
