export function clamp(x:number,a?:number,b?:number):number;
export function ease(x:number):number;
export function step(t:number,a:number,b:number):number;
export function lerp(a:number,b:number,p:number):number;
export function hammer(wrist:number[],impact:number[],p:number):{x:number;y:number;radius:number;angle:number};
export function crackPath(progress:number):string;
export function shard(i:number,p:number):{x:number;y:number;rotation:number;opacity:number};
