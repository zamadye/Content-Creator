/** Pure motion/layout primitives for the turbine story. No media IO or render. */
const clamp01=x=>Math.max(0,Math.min(1,x));
const lerp=(a,b,t)=>a+(b-a)*t;
export const PEAK_CUT=0.42;
export const FRAME={width:1080,height:1920};
export const SAFE={left:64,right:1016,top:100,bottom:1650};
// Full-width 16:9 source in a portrait composition, reduced from 1920×1080.
// It avoids a 608×1080 center crop/upscale; the surrounding scene is designed
// with the host, model and captions, not presented as native vertical footage.
export const FOOTAGE_WINDOW={x:60,y:500,width:960,height:540};
export function smoothstep(x){x=clamp01(x);return x*x*(3-2*x)}
export function peakState(p){
 if(!Number.isFinite(p))throw new RangeError('Peak progress must be finite');
 p=clamp01(p);
 // Integral of a steadily reducing speed: one direction, ends at zero speed.
 // A visual model, not physical measurements of any recorded turbine.
 return {progress:p,angleRadians:5.8*(p-p*p/2),rotorSpeed:1-p,
  pitchDegrees:lerp(8,85,smoothstep((p-.12)/.78)),windStrength:lerp(.72,1,p),
  mechanism:'illustration'};
}
export const openingPeak=t=>peakState(PEAK_CUT*clamp01(t));
export const returnPeak=t=>peakState(PEAK_CUT+(1-PEAK_CUT)*clamp01(t));
export function fitsNativeLandscape(window=FOOTAGE_WINDOW,sourceWidth=1920,sourceHeight=1080){
 return Number.isFinite(window.x)&&Number.isFinite(window.y)&&window.x>=0&&window.y>=0&&
  window.x+window.width<=FRAME.width&&window.y+window.height<=FRAME.height&&
  window.width>0&&window.height>0&&window.width<=sourceWidth&&window.height<=sourceHeight&&
  Math.abs(window.width/window.height-sourceWidth/sourceHeight)<.01;
}
