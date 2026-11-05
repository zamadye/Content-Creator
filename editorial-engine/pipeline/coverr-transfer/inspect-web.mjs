// Diagnose only public page structure. Never print URLs, token values or body.
const page='https://coverr.co/videos/woman-counting-her-money-e7tw4gtksn';
let response;
try { response=await fetch(page,{redirect:'follow',signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Mozilla/5.0 (compatible; ContentCreator/1.0)'}}); }
catch { console.log('::notice title=Coverr public page::'+JSON.stringify({status:'NETWORK_ERROR'}));process.exit(1); }
if(!response.ok){console.log('::notice title=Coverr public page::'+JSON.stringify({status:'HTTP_ERROR',http:response.status}));process.exit(1);}
const raw=await response.text(), normalized=raw.replaceAll('\\/','/').replaceAll('\\u0026','&').replaceAll('&amp;','&');
const fields=new Set();
for(const m of normalized.matchAll(/["']([A-Za-z][A-Za-z0-9_]{1,55})["']\s*:/g)){if(/download|playback|video|mp4|source/i.test(m[1]))fields.add(m[1]);}
const mediaHosts=new Set(); let candidates=0;
for(const m of normalized.matchAll(/https?:\/\/[^\s"'<>\\]+/g)){
 try {const u=new URL(m[0]);if(/mp4|download|playback|stream/i.test(u.pathname)){mediaHosts.add(u.hostname);candidates++;}}catch{}
}
const info={status:'PASS',http:response.status,bytes:raw.length,fields:[...fields].sort().slice(0,80),media_hostnames:[...mediaHosts].sort(),media_url_count:candidates,has_video_element:/<video[ >]/i.test(raw),has_download_button:/download/i.test(raw)};
console.log('::notice title=Coverr public page::'+JSON.stringify(info));
