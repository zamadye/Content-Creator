// Inspect the actual full-project pages through OpenFilm's reference host.
// Usage: OPENFILM_BROWSER_CHANNEL=chrome OPENFILM_HEADED=0 node --import
// scripts/openfilm-local-chrome.mjs inspect-scenes.mjs <openfilm package dir>
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const pkg=resolve(process.argv[2]);
const {open}=await import(pathToFileURL(resolve(pkg,'src/shared.mjs')));
const {launch}=await import(pathToFileURL(resolve(pkg,'src/host.mjs')));
const base=resolve('editorial-engine/deliverables/gibran-mundur-2026');
const project=resolve(process.argv[3]||resolve(base,'openfilm-full'));
const out=resolve(base,process.argv[4]||'audit-full');
await mkdir(out,{recursive:true});
const timeline=JSON.parse(await readFile('editorial-engine/content/gibran-mundur/timeline.json','utf8'));
const results=[];
const browser=await launch();
const hash=b=>createHash('sha256').update(b).digest('hex');
let index=0;
try{
  for(const scene of timeline.scenes){
    let host;
    const result={scene:scene.n,start:scene.start,end:scene.end,frames:[],errors:[]};
    try{
      const file=resolve(project,`scene-${String(scene.n).padStart(2,'0')}.html`);
      host=await open(file,{browser});
      const duration=host.film.meta.duration;
      result.duration=duration;
      for(const ratio of [.12,.5,.88]){
        const t=Number((duration*ratio).toFixed(3));
        await host.film.seek(t);
        const png=await host.film.capture();
        const file=`frame-${String(index++).padStart(3,'0')}.png`;
        await writeFile(resolve(out,file),png);
        const state=await host.film.page.evaluate(()=>{
          const visible=e=>{for(let p=e;p&&p!==document;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)<.02)return false;}return true;};
          const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};};
          const texts=[...document.querySelectorAll('svg text')].filter(visible).map(e=>({text:e.textContent,...box(e)}));
          return {texts,overflow:texts.filter(e=>e.x<0||e.x+e.w>1920||e.y<0||e.y+e.h>1080),
            documents:[...document.querySelectorAll('.float')].map(e=>({transform:e.getAttribute('transform'),...box(e)})),
            nodes:document.querySelectorAll('.node').length,
            ids:[...document.querySelectorAll('[id]')].map(e=>e.id)};
        });
        let deterministic=null;
        if(ratio===.5){
          await host.film.seek(Math.max(.1,duration-.1));
          await host.film.seek(t);
          deterministic=hash(png)===hash(await host.film.capture());
        }
        result.frames.push({t,globalTime:scene.start+t,file,deterministic,...state});
      }
      result.hostProblems=host.film.problems;
      console.log(`SC${String(scene.n).padStart(2,'0')}: 3 frames; overflow=${result.frames.reduce((n,f)=>n+f.overflow.length,0)}; deterministic=${result.frames[1].deterministic}`);
    }catch(e){result.errors.push(e.message);console.log(`SC${scene.n}: ERROR ${e.message}`)}
    finally{await host?.close()}
    results.push(result);
    await writeFile(resolve(out,'scene-inspection.json'),JSON.stringify(results,null,2));
  }
}finally{await browser.close()}
// Sheets are assembled from the *captured images*, not re-created vector art.
const {createRequire}=await import('node:module');
const require=createRequire(resolve(pkg,'package.json'));
const {chromium}=require('playwright-core');
const viewer=await chromium.launch({channel:'chrome',headless:process.env.OPENFILM_HEADED!=='1'});
try{
  const page=await viewer.newPage({viewport:{width:1440,height:1200},deviceScaleFactor:1});
  for(let first=0;first<results.length;first+=4){
    let figures='';
    for(const r of results.slice(first,first+4))for(const f of r.frames){
      const image=(await readFile(resolve(out,f.file))).toString('base64');
      figures+=`<figure><img src="data:image/png;base64,${image}"><figcaption>SC${String(r.scene).padStart(2,'0')} · local ${f.t}s · global ${f.globalTime.toFixed(3)}s</figcaption></figure>`;
    }
    await page.setContent(`<style>body{margin:0;background:#18252c;color:#fff;font:16px Arial}main{display:grid;grid-template-columns:repeat(3,480px)}figure{margin:0;height:300px}img{display:block;width:480px;height:270px}figcaption{padding:5px 12px}</style><main>${figures}</main>`);
    await page.screenshot({path:resolve(out,`sheet-${String(first/4+1).padStart(2,'0')}.png`)});
  }
}finally{await viewer.close()}
