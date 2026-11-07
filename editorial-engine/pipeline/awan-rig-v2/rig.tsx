import React from 'react';
import {solveArm} from './rig-math.mjs';

/**
 * Upgraded original host, retaining rust hijab, sage top, warm skin and brown
 * skirt. Two-bone arms, independent grip, walking legs, gaze, brows and speech
 * mouth are driven by the episode's one timeline; not phoneme-synchronised.
 */
type Point=[number,number];
type Mood='surprised'|'skeptical'|'curious'|'aha'|'happy';
export function RigDefs(){return <defs>
 <linearGradient id="rigScarf" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e07d57"/><stop offset=".52" stopColor="#bd5b3b"/><stop offset="1" stopColor="#843c2b"/></linearGradient>
 <linearGradient id="rigTop" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#c3d0a8"/><stop offset=".56" stopColor="#9aac8b"/><stop offset="1" stopColor="#718469"/></linearGradient>
 <linearGradient id="rigSkin" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#ecc197"/><stop offset=".68" stopColor="#d7a479"/><stop offset="1" stopColor="#bb805a"/></linearGradient>
 <linearGradient id="rigSkirt" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#b98559"/><stop offset="1" stopColor="#79563e"/></linearGradient>
 </defs>}
function Arm({shoulder,target,bend,grip=false}:{shoulder:Point;target:Point;bend:number;grip?:boolean}){
 const {elbow,wrist}=solveArm(shoulder,target,140,135,bend);const angle=Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])*180/Math.PI;
 const d=`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${wrist[0]} ${wrist[1]}`;
 return <g><path d={d} fill="none" stroke="#405747" strokeWidth="53" strokeLinecap="round" strokeLinejoin="round"/><path d={d} fill="none" stroke="url(#rigTop)" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/><path d={`M${wrist[0]-8} ${wrist[1]-16} L${wrist[0]+8} ${wrist[1]+16}`} stroke="#d8d8ba" strokeWidth="6" opacity=".75"/>
  <g transform={`translate(${wrist[0]} ${wrist[1]}) rotate(${angle})`}><path d={grip?'M-11-18 Q4-24 19-14 Q30-7 27 7 Q26 23 9 23 L-9 16 Z':'M-13-18 Q1-24 17-16 Q27-11 27 0 Q28 15 16 21 Q4 25-10 17Z'} fill="url(#rigSkin)" stroke="#604c3a" strokeWidth="4"/><path d="M5-13 Q14-6 12 3 M13-10 Q21-4 19 4" fill="none" stroke="#a66f50" strokeWidth="3" strokeLinecap="round"/></g></g>
}
export type RigProps={x:number;y:number;scale:number;frame:number;lean?:number;head?:number;gaze?:number;emotion?:Mood;left:Point;right:Point;walk?:number;talk?:boolean;gripL?:boolean;gripR?:boolean;rightAccessory?:React.ReactNode};
export function Host({x,y,scale,frame,lean=0,head=0,gaze=0,emotion='curious',left,right,walk=0,talk=true,gripL=false,gripR=false,rightAccessory}:RigProps){
 const blink=frame%150>145;const pupil=7*gaze;const open=talk?3+6*Math.abs(Math.sin(frame*.20)):2;
 const browL=emotion==='surprised'?'M-48 94 Q-33 82-17 90':emotion==='skeptical'?'M-48 101 Q-31 88-16 99':'M-48 99 Q-33 92-16 99';
 const browR=emotion==='surprised'?'M16 90 Q33 82 48 94':emotion==='skeptical'?'M16 101 Q31 105 48 96':'M16 99 Q33 92 48 99';
 const r=solveArm([92,292],right,140,135,1).wrist;
 return <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <ellipse cx="0" cy="648" rx="148" ry="17" fill="#10251e" opacity=".25"/>
  <g transform={`rotate(${lean} 0 450)`}>
   {/* Back scarf, neck, two jointed legs, body, and shaded skirt. */}
   <path d="M-119 103 Q-117-20 0-31 Q117-20 119 103 L155 315 Q93 365 0 347 Q-88 366-155 315Z" fill="#783b2e" stroke="#47352c" strokeWidth="7"/>
   <path d="M-108 103 Q-108-10 0-19 Q108-10 108 103 L137 312 Q74 339 0 325 Q-74 339-137 312Z" fill="url(#rigScarf)"/>
   <path d="M-98 151 Q-108 250-130 305 M82 175 Q104 255 122 303" stroke="#f3a57b" strokeWidth="6" fill="none" opacity=".4"/>
   <g stroke="#57443a" strokeWidth="24" strokeLinecap="round" fill="none"><path d={`M-45 568 l${24*walk} 48 l-12 8`}/><path d={`M45 568 l${-24*walk} 48 l13 8`}/></g>
   <g fill="#4c4035" stroke="#302d29" strokeWidth="4"><ellipse cx={-55+24*walk} cy="625" rx="31" ry="13"/><ellipse cx={55-24*walk} cy="625" rx="31" ry="13"/></g>
   <path d="M-98 277 Q-88 242-45 240 L45 240 Q88 242 98 277 L118 483 Q0 510-118 483Z" fill="url(#rigTop)" stroke="#405747" strokeWidth="7"/>
   <path d="M-93 456 L93 456 L115 590 Q0 615-115 590Z" fill="url(#rigSkirt)" stroke="#5b4937" strokeWidth="7"/>
   <path d="M-70 468 Q-54 526-58 582 M13 465 Q6 528 22 591 M70 473 Q65 529 81 582" fill="none" stroke="#dbb289" strokeWidth="5" opacity=".36"/>
   <path d="M-47 251 Q0 282 47 251" fill="none" stroke="#f7f0df" strokeWidth="9" strokeLinecap="round"/>
   <path d="M-70 380 Q-40 392-15 382 M27 402 Q58 411 82 400" fill="none" stroke="#60745d" strokeWidth="5" opacity=".35"/>
   <g transform={`rotate(${head+1.4*Math.sin(frame/37)} 0 208)`}>
    <path d="M-82 80 Q-84 6 0 6 Q84 6 82 80 L76 159 Q55 222 0 229 Q-55 222-76 159Z" fill="url(#rigSkin)" stroke="#6a493b" strokeWidth="6"/>
    <path d="M-83 78 Q0 25 83 78 Q74 8 0 2 Q-74 8-83 78Z" fill="url(#rigScarf)" stroke="#7b3d2d" strokeWidth="5"/>
    <path d="M-68 80 Q-38 62-18 68 M18 68 Q38 62 68 80" fill="none" stroke="#f1a77c" strokeWidth="5" opacity=".4"/>
    <path d={`${browL} ${browR}`} fill="none" stroke="#4d4038" strokeWidth="6" strokeLinecap="round"/>
    {blink?<g stroke="#3f382f" strokeWidth="6" strokeLinecap="round"><path d="M-47 125 Q-33 131-18 125 M18 125 Q33 131 47 125"/></g>:<g><ellipse cx="-32" cy="125" rx="16" ry="18" fill="#fff9ec"/><ellipse cx="32" cy="125" rx="16" ry="18" fill="#fff9ec"/><ellipse cx={-32+pupil} cy="126" rx="9" ry="12" fill="#233d35"/><ellipse cx={32+pupil} cy="126" rx="9" ry="12" fill="#233d35"/><circle cx={-29+pupil} cy="122" r="3" fill="#fff"/><circle cx={35+pupil} cy="122" r="3" fill="#fff"/></g>}
    <path d="M0 135 q-7 16 2 19" fill="none" stroke="#ae7957" strokeWidth="5" strokeLinecap="round"/>
    <ellipse cx="-55" cy="158" rx="11" ry="6" fill="#bd755b" opacity=".35"/><ellipse cx="55" cy="158" rx="11" ry="6" fill="#bd755b" opacity=".35"/>
    {(!talk&&emotion==='happy')?<path d="M-17 174 Q0 190 17 174" fill="none" stroke="#823f37" strokeWidth="6" strokeLinecap="round"/>:<ellipse cx="0" cy="174" rx={emotion==='surprised'?14:12} ry={open+(emotion==='surprised'?2:0)} fill="#853f37"/>}
   </g>
   {rightAccessory&&<g transform={`translate(${r[0]} ${r[1]})`}>{rightAccessory}</g>}
   <Arm shoulder={[-92,292]} target={left} bend={left[1]>370?1:-1} grip={gripL}/><Arm shoulder={[92,292]} target={right} bend={1} grip={gripR}/>
  </g>
 </g>
}
