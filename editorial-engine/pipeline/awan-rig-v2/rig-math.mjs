/** Small deterministic two-bone IK for the Host's upper/lower arms. */
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const lerp=(a,b,p)=>a+(b-a)*p;
export const ease=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
export function solveArm(shoulder,target,upper=140,lower=135,bend=1){
 const dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],len=Math.hypot(dx,dy);
 const ux=len>1e-8?dx/len:0,uy=len>1e-8?dy/len:1;
 const d=clamp(len,Math.abs(upper-lower)+.0001,upper+lower-.0001);
 const a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
 return {elbow:[shoulder[0]+ux*a-uy*h*bend,shoulder[1]+uy*a+ux*h*bend],wrist:[shoulder[0]+ux*d,shoulder[1]+uy*d],clamped:Math.abs(d-len)>.001};
}
/** Global wrist location after torso lean, so a prop can touch the animated hand. */
export function wristWorld(p,side='right'){
 const sh=side==='right'?[92,292]:[-92,292],target=p[side],bend=side==='right'?1:-1;
 const [x,y]=solveArm(sh,target,140,135,bend).wrist,rad=(p.lean||0)*Math.PI/180,cy=450;
 return [p.x+p.scale*(Math.cos(rad)*x-Math.sin(rad)*(y-cy)),p.y+p.scale*(Math.sin(rad)*x+Math.cos(rad)*(y-cy)+cy)];
}
