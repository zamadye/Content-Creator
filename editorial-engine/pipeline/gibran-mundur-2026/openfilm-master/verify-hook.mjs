// Verify the copied opening and its return to the untouched main story.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const pkg=resolve(process.argv[2]);
const {open}=await import(pathToFileURL(resolve(pkg,'src/shared.mjs')));
const base=resolve('editorial-engine/deliverables/gibran-mundur-2026');
const root=resolve(base,'openfilm-master-v6-hook');
const out=resolve(base,'audit-v6-hook');await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(resolve(root,'build-manifest.json'),'utf8'));
const original=JSON.parse(await readFile(resolve(base,'openfilm-master-v5/build-manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const checks=[];
const check=(condition,message)=>{checks.push({message,passed:!!condition});if(!condition)throw Error(message)};
check(manifest.voSha256===original.voSha256,'Original VO bytes preserved');
check(manifest.scenes.length===24&&manifest.pictureClipCount===25,'24 main scenes retained, one hook added');
for(let i=0;i<24;i++)check(['scene','start','end','duration'].every(key=>manifest.scenes[i][key]===original.scenes[i][key]),`SC${i+1}: source order and interval unchanged`);
const host=await open(resolve(root,'film.html'));
try{
  const moments=[0,1.5,3,4.299,4.3,5.3,manifest.mainStartOffset+346+12];
  let first;
  for(const t of moments){
    await host.film.seek(t);
    const buffer=await host.film.capture();
    if(t===0)first=hash(buffer);
    const picture=`opening-${String(t).replace('.','-')}.png`;
    await writeFile(resolve(out,picture),buffer);
    const clips=await host.film.page.evaluate(()=>[...document.querySelectorAll('iframe')].filter(e=>e.style.visibility==='visible').map(e=>({id:e.id,text:e.contentDocument?.documentElement.textContent,lines:[...e.contentDocument.querySelectorAll('svg text')].map(x=>x.textContent)})));
    // Trim subtraction can leave the outgoing iframe visible for <1e-12 s at
    // the exact cut. Test the composited topmost picture, not DOM visibility alone.
    const topId=await host.film.page.evaluate(()=>document.elementFromPoint(960,540)?.closest('iframe')?.id);
    check(clips.length>=1,`${t}s: a picture covers the stage`);
    if(t<4.3){
      check(clips[0].id==='opening-hook-copy-sc21',`${t}s: copied SC21 plays in front`);
      check(clips[0].lines.includes('SISTEM DIPERBAIKI')&&clips[0].lines.includes('KOMPONEN SAJA DIGANTI'),`${t}s: both alternative mechanisms visible`);
      check(!clips[0].lines.some(x=>x.startsWith('21 /')),`${t}s: no misleading chapter 21 label at the opening`);
    }else if(t<13.3)check(topId==='main-sc01',`${t}s: original story is the topmost picture after hook`);
    else check(topId==='main-sc21',`${t}s: original SC21 still appears later`);
  }
  await host.film.seek(0);
  check(first===hash(await host.film.capture()),'Opening is deterministic after seeking into the main story');
  check(host.film.problems.length===0,'No host, loading or page errors');
}finally{await host.close()}
await writeFile(resolve(out,'hook-verification.json'),JSON.stringify({checks,hookDuration:4.3,duration:manifest.duration,mainStartOffset:manifest.mainStartOffset,filmSha256:hash(await readFile(resolve(root,'film.html')))},null,2));
console.log(`${checks.length} hook checks passed; main story preserved and offset by 4.3s.`);
