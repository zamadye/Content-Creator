// Integration checks against the rendered DOM, including the defects found in v3.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const pkg=resolve(process.argv[2]);
const {open}=await import(pathToFileURL(resolve(pkg,'src/shared.mjs')));
const {launch}=await import(pathToFileURL(resolve(pkg,'src/host.mjs')));
const root=resolve('editorial-engine/deliverables/gibran-mundur-2026/openfilm-master-v5');
const out=resolve(root,'../audit-v5');
await mkdir(out,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const sourceHash=digest(await readFile(resolve(root,'motion.js')));
const manifest=JSON.parse(await readFile(resolve(root,'build-manifest.json'),'utf8'));
const generatedFiles=[...manifest.scenes.map(s=>`scene-${String(s.scene).padStart(2,'0')}.html`),'motion.js','film.html'];
const projectDigest=async()=>digest(Buffer.concat(await Promise.all(generatedFiles.map(name=>readFile(resolve(root,name))))));
const projectHash=await projectDigest();
const browser=await launch();
const checks=[], failures=[], overlaps=[], pictures=[];
let sampled=0;
const assert=(ok,message)=>{checks.push({message,passed:!!ok});if(!ok)failures.push(message)};
try{
  for(const scene of manifest.scenes){
    const host=await open(resolve(root,`scene-${String(scene.scene).padStart(2,'0')}.html`),{browser});
    try{
      const times=new Set([0,scene.duration-.001]);
      for(let t=.5;t<scene.duration;t+=.5)times.add(t);
      if(scene.scene===18){times.add(6.99);times.add(7);times.add(7.8)}
      let last;
      for(const t of [...times].sort((a,b)=>a-b)){
        await host.film.seek(t);sampled++;
        const state=await host.film.page.evaluate(()=>{
          const visible=e=>{let opacity=1;for(let p=e;p&&p!==document;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden')return false;opacity*=Number(c.opacity);}return opacity>.15};
          const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}};
          const texts=[...document.querySelectorAll('svg text')].filter(e=>visible(e)&&e.textContent.trim()).map(e=>({text:e.textContent,...box(e)}));
          const collisions=[];
          for(let a=0;a<texts.length;a++)for(let b=a+1;b<texts.length;b++){
            const x=texts[a],y=texts[b];
            if(Math.min(x.x+x.w,y.x+y.w)-Math.max(x.x,y.x)>3&&Math.min(x.y+x.h,y.y+y.h)-Math.max(x.y,y.y)>3)collisions.push([x.text,y.text]);
          }
          const documents=[...document.querySelectorAll('[data-role="document"]')].filter(visible).map(box);
          return {overflow:texts.filter(b=>b.x<0||b.y<0||b.x+b.w>1920||b.y+b.h>1080),documents,collisions,
            missing:document.querySelector('[data-role="column"][data-x="960"]')?.getAttribute('data-missing'),
            nodes:[...document.querySelectorAll('[data-role="institution-node"]')].filter(visible).length,
            candidates:[...document.querySelectorAll('[data-role="candidate"]')].filter(visible).length,
            cells:[...document.querySelectorAll('[data-role="calendar-cell"]')].filter(visible).length,
            cooling:document.querySelector('[data-role="cooling-system"]')?.getAttribute('opacity'),
            rings:[...document.querySelectorAll('[data-role="constitution-ring"] path')].filter(visible).length,
            emptyVideos:[...document.querySelectorAll('video')].filter(e=>!e.currentSrc&&!e.getAttribute('src')).length};
        });
        if(state.overflow.length)failures.push(`SC${scene.scene} ${t}s text overflow: ${state.overflow.map(x=>x.text)}`);
        if(state.documents.some(b=>b.x<0||b.y<0||b.x+b.w>1920||b.y+b.h>1080))failures.push(`SC${scene.scene} ${t}s clipped document`);
        if(state.collisions.length)overlaps.push({scene:scene.scene,t,pairs:state.collisions});
        if(scene.scene===2&&t===scene.duration-.001)assert(state.missing==='1','SC02 ends with the middle support absent');
        if(scene.scene===3&&t===0)assert(state.missing==='1','SC03 starts with the same middle support absent');
        if(scene.scene===13&&t===0)assert(state.nodes===7,'SC13 preserves all seven institutional nodes at the cut');
        if(scene.scene===18&&t===6.99)assert(Number(state.cooling)===0,'Cooling fault stays hidden before the DOCX 4:58 phase');
        if(scene.scene===18&&t===7.8)assert(Number(state.cooling)>.15,'Cooling fault reveals during the DOCX 4:58 phase');
        last=state;
      }
      if(scene.scene===12)assert(last.nodes===7,'SC12 introduces all seven named institutions/entities');
      assert(last.emptyVideos===0,`SC${String(scene.scene).padStart(2,'0')} has no empty video element delaying timeline capture`);
      if(scene.scene===13)assert(last.rings===1,'SC13 completes the enclosing constitutional boundary');
      if(scene.scene===14){assert(last.candidates===2,'SC14 shows two candidates');assert(last.cells===60,'SC14 shows sixty calendar cells');}
      assert(!host.film.problems.length,`SC${String(scene.scene).padStart(2,'0')} has no host/page errors`);
      // Re-capture the previously overlapping footer and institutional diagram.
      if([10,13,14,19].includes(scene.scene)){
        const t={10:2.5,13:8,14:21,19:6}[scene.scene];await host.film.seek(t);
        const name=`detail-sc${scene.scene}.png`;await writeFile(resolve(out,name),await host.film.capture());pictures.push(name);
      }
      console.log(`SC${String(scene.scene).padStart(2,'0')}: sampled every 0.5s, no missing media`);
    }finally{await host.close()}
  }
}finally{await browser.close()}
assert(sourceHash===digest(await readFile(resolve(root,'motion.js'))),'Motion source did not change during verification');
assert(projectHash===await projectDigest(),'Project pages did not change during verification');
const result={version:5,sampled,checks,failures,overlaps,pictures,motionSha256:sourceHash,
  filmSha256:digest(await readFile(resolve(root,'film.html'))),projectSha256:projectHash,
  technicalPassed:failures.length===0&&overlaps.length===0,
  phraseAlignmentVerified:false,fullFilmRendered:false};
await writeFile(resolve(out,'verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({sampled,failures,overlaps},null,2));
if(!result.technicalPassed)process.exitCode=1;
