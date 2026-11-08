// Deterministic global-timeline motion math, independent of renderer.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
export const step=(t,a,b)=>ease((t-a)/(b-a));
export const lerp=(a,b,p)=>a+(b-a)*p;

// Hammer head follows a constant-radius arc around the host's wrist. At p=1
// the centre is exactly at the authored impact position.
export function hammer(wrist,impact,p){
 const dx=impact[0]-wrist[0],dy=impact[1]-wrist[1],radius=Math.hypot(dx,dy);
 const theta=Math.atan2(dy,dx)-.75*(1-clamp(p));
 return {x:wrist[0]+radius*Math.cos(theta),y:wrist[1]+radius*Math.sin(theta),radius,angle:theta*180/Math.PI};
}
// Path starts at the tail, never at the head; progressive segment lengths.
const CRACK=[[338,-24],[284,-25],[234,-24],[190,-19],[142,-14],[110,-6],[80,-9],[54,10],[31,-13],[6,8],[-18,-8],[-38,20],[-66,4],[-78,35]];
export function crackPath(progress){
 const p=clamp(progress),scaled=p*(CRACK.length-1),n=Math.floor(scaled),out=CRACK.slice(0,n+1).map(v=>[...v]);
 if(n<CRACK.length-1){const q=scaled-n,a=CRACK[n],b=CRACK[n+1];out.push([lerp(a[0],b[0],q),lerp(a[1],b[1],q)])}
 return out.map((v,i)=>`${i?'L':'M'}${v[0].toFixed(2)} ${v[1].toFixed(2)}`).join(' ');
}
// Shards spread deterministically from the original glass silhouette. Clip to
// the protective window in the renderer; no claim of physical simulation.
export function shard(i,p){
 p=clamp(p);const theta=(i*2.399963),velocity=35+(i*37)%180,originX=((i*47)%195)-70,originY=((i*29)%125)-62;
 return {x:originX+Math.cos(theta)*velocity*p,y:originY+Math.sin(theta)*velocity*p+80*p*p,rotation:(i*61%360)+(i%2?-1:1)*210*p,opacity:1-.38*p};
}
