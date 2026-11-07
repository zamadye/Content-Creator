export type Point = [number,number];
export function clamp(v:number,lo:number,hi:number):number;
export function lerp(a:number,b:number,t:number):number;
export function ease(t:number):number;
export function solveArm(shoulder:Point,target:Point,upper?:number,lower?:number,bend?:number):{elbow:Point;wrist:Point;clamped:boolean};
export function wristWorld(p:{x:number;y:number;scale:number;lean?:number;left:Point;right:Point},side?:'left'|'right'):Point;
export function risingDroplet(t:number,i:number):{x:number;y:number;opacity:number};
