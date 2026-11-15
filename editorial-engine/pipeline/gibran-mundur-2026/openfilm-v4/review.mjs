// Usage: node review.mjs <openfilm-package-dir> [preview-origin]
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const require=createRequire(resolve(process.argv[2], 'package.json'));
const {chromium}=require('playwright-core');
const out=resolve('editorial-engine/deliverables/gibran-mundur-2026/motion-v4-review');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false,args:['--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const checks=[], errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  for(const [scene,times] of [[2,[2,7.5,10.5,14]],[3,[2,9,19,28]],[14,[2,6,12,19]],[18,[1,5.5,11,17]]]){
    await page.goto(`${process.argv[3]||'http://127.0.0.1:8766'}/openfilm-motion-study-v4/scene-${String(scene).padStart(2,'0')}.html`);
    await page.waitForFunction(()=>!!window.film);
    for(const t of times){
      await page.evaluate(t=>window.film.frame(t),t);
      const before=await page.locator('#stage').screenshot();
      await page.evaluate(()=>window.film.frame(0));
      await page.evaluate(t=>window.film.frame(t),t);
      const after=await page.locator('#stage').screenshot();
      const same=createHash('sha256').update(before).digest('hex')===createHash('sha256').update(after).digest('hex');
      if(!same)throw Error(`Non-deterministic SC${scene} at ${t}`);
      const file=`sc${scene}-${t}.png`;
      await writeFile(resolve(out,file),after);
      const overflows=await page.locator('svg text').evaluateAll(nodes=>nodes.filter(n=>{
        const b=n.getBoundingClientRect();return b.left<0||b.right>1920||b.top<0||b.bottom>1080;
      }).map(n=>n.textContent));
      if(overflows.length)throw Error(`Overflow SC${scene}: ${overflows}`);
      checks.push({scene,t,file,deterministic:same,noTextOverflow:true});
      console.log(`SC${scene} ${t}s: deterministic, text in frame`);
    }
  }
  if(errors.length)throw Error(errors.join('\n'));
  await writeFile(resolve(out,'review.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close()}
