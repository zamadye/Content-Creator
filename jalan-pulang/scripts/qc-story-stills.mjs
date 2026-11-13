// Serial still sampling for every assembled VO 01 / VO 02 segment.
// This is an inspection aid, not a substitute for watching/listening to video.
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {storyShots} from '../src/story-timeline.js';
import {ENDING_SHOTS,endingFrame} from '../src/ending-timeline.js';
const out=process.argv[2]||'render/qc-story-stills';fs.mkdirSync(out,{recursive:true});
const browserExecutable=process.env.CHROME_PATH||'../.jalan-pulang-tools/chromium';
const chromiumOptions={gl:'angle',flags:{'enable-unsafe-swiftshader':true,'use-angle':'swiftshader','ignore-gpu-blocklist':true,'disable-gpu-sandbox':true}};
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions,logLevel:'error'});
try {
 const serveUrl=await bundle({entryPoint:'src/index.jsx',onProgress:()=>{}});
 const composition=await selectComposition({serveUrl,id:'FullStoryBlocking',puppeteerInstance:browser,inputProps:{resolutionScale:.25},logLevel:'error'});
 const points=[...storyShots.map(s=>({name:`${s.from}-${s.shot}`,frame:Math.round((s.from+s.to)*15)})),...ENDING_SHOTS.map(s=>({name:`VO2-${s.id}`,frame:16309+endingFrame((s.start+s.end)/2)}))];
 const limit=process.env.QC_LIMIT?Number(process.env.QC_LIMIT):points.length;
 if(!Number.isInteger(limit)||limit<1||limit>points.length)throw Error('Invalid QC_LIMIT');
 for(const [i,p] of points.slice(0,limit).entries()){
  const output=`${out}/${String(i+1).padStart(2,'0')}-${p.name}.jpg`;
  await renderStill({composition,serveUrl,frame:p.frame,output,imageFormat:'jpeg',jpegQuality:80,scale:.25,inputProps:{resolutionScale:.25},puppeteerInstance:browser,logLevel:'error'});
  console.log(`${i+1}/${points.length}: frame ${p.frame} ${p.name}`);
 }
 fs.writeFileSync(`${out}/frames.json`,JSON.stringify(points.slice(0,limit),null,2));
}finally{await browser.close({silent:true});}
