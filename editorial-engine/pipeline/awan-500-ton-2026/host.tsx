import React from 'react';

/**
 * Host rig adapted from the user's Danau/Titik Buta backup, not a new mascot.
 * Identity palette, face, rust hijab, sage clothing and skirt match that rig.
 * Optional boots/leg movement support a field-station walk; pose never changes
 * the identity. All motion is a pure function of this episode's one timeline.
 * This episode adds eye direction and brows without changing the original rig.
 */
const C={ink:'#142f29',sage:'#9eae8b',cream:'#f7f0df',rust:'#b85738',rustDeep:'#8b3f2b',woodDark:'#9c6b42',skin:'#d7a479',skinShade:'#b87950'};
export const Host:React.FC<{x:number;y:number;scale?:number;frame:number;armL?:number;armR?:number;happy?:boolean;talk?:boolean;walking?:boolean;emotion?:'curious'|'surprised'|'happy';look?:'viewer'|'object'}>=
({x,y,scale=1,frame,armL=55,armR=-32,happy=false,talk=true,walking=false,emotion='curious',look='object'})=>{
  const headTilt=2.0*Math.sin(frame/33);
  const armWobble=5*Math.sin(frame/22);
  const blink=(frame%126>121)?1:0;
  const mouth=talk?3+4*Math.abs(Math.sin(frame*.19)):2;
  const gaze=look==='object'?7:0;
  const surprise=emotion==='surprised';
  const browLeft=surprise?'M-46 94 Q-31 84 -16 91':emotion==='curious'?'M-46 98 Q-31 88 -16 101':'M-46 101 Q-31 94 -16 100';
  const browRight=surprise?'M16 91 Q31 84 46 94':emotion==='curious'?'M16 103 Q31 96 46 102':'M16 100 Q31 94 46 101';
  const step=walking?22*Math.sin(frame/8):0;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-116 102 Q-112 -17 0 -27 Q112 -17 116 102 L155 313 Q85 365 0 350 Q-84 365 -155 313 Z" fill={C.rustDeep}/>
    <path d="M-105 104 Q-104 -9 0 -16 Q104 -9 105 104 L132 304 Q70 334 0 329 Q-70 334 -132 304 Z" fill={C.rust}/>
    {/* Feet are jointed independently during a walking action. */}
    <g stroke="#55473b" strokeWidth="24" strokeLinecap="round" fill="none">
      <path d={`M-48 585 l${step} 49 l-14 8`}/><path d={`M48 585 l${-step} 49 l14 8`}/>
    </g>
    <path d="M-104 292 Q-91 245 -46 242 L46 242 Q91 245 104 292 L120 494 Q0 523 -120 494 Z" fill={C.sage}/>
    <path d="M-92 465 L92 465 L116 610 Q0 629 -116 610 Z" fill={C.woodDark}/>
    <path d="M-46 250 Q0 285 46 250" fill="none" stroke={C.cream} strokeWidth="8"/>
    <g transform={`translate(-92 292) rotate(${armL+armWobble})`}>
      <path d="M0 0 L0 105" fill="none" stroke={C.sage} strokeWidth="39" strokeLinecap="round"/>
      <g transform="translate(0 105) rotate(-15)"><path d="M0 0 L0 92" fill="none" stroke={C.sage} strokeWidth="32" strokeLinecap="round"/><ellipse cx="0" cy="98" rx="22" ry="24" fill={C.skin}/></g>
    </g>
    <g transform={`translate(92 292) rotate(${armR-armWobble})`}>
      <path d="M0 0 L0 105" fill="none" stroke={C.sage} strokeWidth="39" strokeLinecap="round"/>
      <g transform="translate(0 105) rotate(18)"><path d="M0 0 L0 92" fill="none" stroke={C.sage} strokeWidth="32" strokeLinecap="round"/><ellipse cx="0" cy="98" rx="22" ry="24" fill={C.skin}/></g>
    </g>
    <g transform={`rotate(${headTilt} 0 225)`}>
      <ellipse cx="0" cy="120" rx="81" ry="103" fill={C.skin}/>
      <path d="M-78 83 Q0 24 78 83 Q63 20 0 15 Q-63 20 -78 83 Z" fill={C.rust}/>
      <path d="M-68 91 Q-35 68 -15 77 M15 77 Q35 68 68 91" fill="none" stroke={C.rustDeep} strokeWidth="7" opacity=".55"/>
      <ellipse cx={-31+gaze} cy="124" rx={surprise?11:10} ry={blink?2:surprise?14:12} fill={C.ink}/><ellipse cx={31+gaze} cy="124" rx={surprise?11:10} ry={blink?2:surprise?14:12} fill={C.ink}/>
      <circle cx={-28+gaze} cy="120" r="3" fill={C.cream}/><circle cx={34+gaze} cy="120" r="3" fill={C.cream}/>
      <path d={`${browLeft} ${browRight}`} fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round"/>
      <path d="M0 132 q-6 15 2 18" fill="none" stroke={C.skinShade} strokeWidth="5" strokeLinecap="round"/>
      {(happy || emotion==='happy') && !talk?<path d="M-17 173 Q0 190 17 173" fill="none" stroke={C.rustDeep} strokeWidth="6" strokeLinecap="round"/>:<ellipse cx="0" cy="174" rx={surprise?13:12} ry={mouth+(surprise?3:0)} fill={C.rustDeep}/>}
      <ellipse cx="-54" cy="155" rx="12" ry="6" fill={C.skinShade} opacity=".35"/><ellipse cx="54" cy="155" rx="12" ry="6" fill={C.skinShade} opacity=".35"/>
    </g>
  </g>;
};
