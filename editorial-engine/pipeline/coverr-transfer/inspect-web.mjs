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
// Inspect only field shapes and URL hostnames near the selected public video.
// Values, paths, parameters and any tokens are deliberately never printed.
const clean=normalized.replaceAll('\\\\"','"').replaceAll('\\"','"').replaceAll('&quot;','"');
const target='e7tw4gtksn';
const positions=[...clean.matchAll(new RegExp(target,'g'))].map(m=>m.index);
const local=[];
for(const pos of positions.slice(0,6)){
 const near=clean.slice(Math.max(0,pos-12000),Math.min(clean.length,pos+12000));
 const keys=[...new Set([...near.matchAll(/["']([A-Za-z][A-Za-z0-9_]{1,55})["']\s*:/g)].map(m=>m[1]).filter(k=>/download|playback|video|mp4|source|^id$|slug/i.test(k)))].sort();
 const hosts=new Set(); let downloadFields=0, mediaValues=0;
 for(const m of near.matchAll(/(?:["']?mp4Download["']?\s*:\s*["'])(https?:\/\/[^"'\s\\<>]+)/g)){downloadFields++;try{hosts.add(new URL(m[1]).hostname);}catch{}}
 for(const m of near.matchAll(/https?:\/\/[^"'\s\\<>]+/g))if(/mp4|download/i.test(m[0]))mediaValues++;
 local.push({keys,download_fields:downloadFields,download_hosts:[...hosts].sort(),media_values:mediaValues});
}
const keyPos=[...clean.matchAll(/mp4Download/g)].map(m=>m.index);
const shapes=keyPos.slice(0,5).map(pos=>clean.slice(pos-8,pos+90).replace(/[A-Za-z0-9_-]/g,'x'));
const closest=positions.map(pos=>Math.min(...keyPos.map(k=>Math.abs(pos-k)))).sort((a,b)=>a-b).slice(0,4);
const tags=[...clean.matchAll(/<(?:video|source)\b[^>]{1,4000}>/gi)].slice(0,8).map(m=>({tag:m[0].slice(1).split(/[\s>]/)[0],has_src:/\bsrc=/.test(m[0]),has_https:/https?:/i.test(m[0]),length:m[0].length}));
const info={status:'PASS',http:response.status,bytes:raw.length,fields:[...fields].sort().filter(x=>/^(?:mp4|mp4Download|playbackId|download|video|downloadUrl)$/i.test(x)),media_hostnames:[...mediaHosts].sort(),media_url_count:candidates,target_occurrences:positions.length,download_key_count:keyPos.length,closest_target_distances:closest,key_shapes:shapes,video_tag_shapes:tags,target_neighborhoods:local,has_download_button:/download/i.test(raw)};
console.log('::notice title=Coverr public page::'+JSON.stringify(info));
