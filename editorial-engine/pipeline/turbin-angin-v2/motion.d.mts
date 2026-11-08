export const PEAK_CUT: number;
export const FRAME: {width:number;height:number};
export const SAFE: {left:number;right:number;top:number;bottom:number};
export const FOOTAGE_WINDOW: {x:number;y:number;width:number;height:number};
export function smoothstep(x:number):number;
export function peakState(p:number):{progress:number;angleRadians:number;rotorSpeed:number;pitchDegrees:number;windStrength:number;mechanism:string};
export function openingPeak(t:number):ReturnType<typeof peakState>;
export function returnPeak(t:number):ReturnType<typeof peakState>;
export function fitsNativeLandscape(window?:{x:number;y:number;width:number;height:number},sourceWidth?:number,sourceHeight?:number):boolean;
