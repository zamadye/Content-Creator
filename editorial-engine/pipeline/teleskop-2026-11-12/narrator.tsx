import React from 'react';

/**
 * Male narrator rig for the Teleskop episode (the user's VO is a male voice).
 * Same flat Dunia Kebalik look and palette, with improved proportions over
 * the female Host rig: smaller head, visible neck/shoulders, longer legs,
 * white sclera eyes with pupils, brows, light stubble, breathing bob, and a
 * separate ground shadow drawn by the scene. Params match the Host contract
 * so scenes can swap rigs without layout rewrites. All motion is a pure
 * function of this episode's one timeline. The female Host rig stays in the
 * hiu pipeline for episodes that use it.
 */
const C={ink:'#142f29',skin:'#d7a479',skinShade:'#b87950',hair:'#46321f',hairShine:'#5d432b',
 jacket:'#c2754d',jacketDeep:'#a35f3c',shirt:'#f7f0df',pants:'#2c3e46',boots:'#22303a'};
export const Narrator:React.FC<{x:number;y:number;scale?:number;frame:number;armL?:number;armR?:number;happy?:boolean;talk?:boolean;walking?:boolean}>=
({x,y,scale=1,frame,armL=55,armR=-32,happy=false,talk=true,walking=false})=>{
  const headTilt=1.8*Math.sin(frame/33);
  const bob=Math.sin(frame/16)*1.6;
  const armWobble=5*Math.sin(frame/22);
  const blink=(frame%126>121)?1:0;
  const mouthRy=talk?3.6+4.5*Math.abs(Math.sin(frame*.19)):2.6;
  const browLift=happy?2.5:0;
  const step=walking?20*Math.sin(frame/8):0;
  return <g transform={`translate(${x} ${y+bob}) scale(${scale})`}>
    <g stroke={C.pants} strokeWidth="27" strokeLinecap="round" fill="none">
      <path d={`M-30 462 l${step} 98 l-12 8`}/><path d={`M30 462 l${-step} 98 l12 8`}/>
    </g>
    <ellipse cx={-30+step} cy="572" rx="27" ry="12" fill={C.boots}/>
    <ellipse cx={30-step} cy="572" rx="27" ry="12" fill={C.boots}/>
    <path d="M-54 330 L54 330 L47 470 L-47 470 Z" fill={C.pants}/>
    <path d="M-64 178 Q-75 186 -75 212 L-67 336 Q0 353 67 336 L75 212 Q75 186 64 178 Z" fill={C.jacket}/>
    <path d="M-21 179 L21 179 L15 340 L-15 340 Z" fill={C.shirt}/>
    <path d="M-27 175 L0 197 L27 175 L20 166 L0 183 L-20 166 Z" fill={C.jacketDeep}/>
    <line x1="0" y1="201" x2="0" y2="338" stroke="#f2c473" strokeWidth="4" opacity=".9"/>
    <g transform={`translate(-66 208) rotate(${armL+armWobble})`}>
      <path d="M0 0 L0 92" fill="none" stroke={C.jacket} strokeWidth="34" strokeLinecap="round"/>
      <g transform="translate(0 92) rotate(-12)"><path d="M0 0 L0 82" fill="none" stroke={C.jacket} strokeWidth="28" strokeLinecap="round"/><ellipse cx="0" cy="90" rx="19" ry="21" fill={C.skin}/></g>
    </g>
    <g transform={`translate(66 208) rotate(${armR-armWobble})`}>
      <path d="M0 0 L0 92" fill="none" stroke={C.jacket} strokeWidth="34" strokeLinecap="round"/>
      <g transform="translate(0 92) rotate(14)"><path d="M0 0 L0 82" fill="none" stroke={C.jacket} strokeWidth="28" strokeLinecap="round"/><ellipse cx="0" cy="90" rx="19" ry="21" fill={C.skin}/></g>
    </g>
    <rect x="-15" y="148" width="30" height="36" rx="11" fill={C.skinShade}/>
    <g transform={`rotate(${headTilt} 0 170)`}>
      <ellipse cx="-58" cy="98" rx="10" ry="14" fill={C.skin}/>
      <ellipse cx="58" cy="98" rx="10" ry="14" fill={C.skin}/>
      <ellipse cx="0" cy="92" rx="60" ry="70" fill={C.skin}/>
      <path d="M-62 84 Q-66 16 0 11 Q66 16 62 84 Q58 42 44 38 Q20 30 0 35 Q-24 30 -44 40 Q-58 45 -62 84 Z" fill={C.hair}/>
      <path d="M-45 43 Q-18 29 9 33 Q37 38 51 52" fill="none" stroke={C.hairShine} strokeWidth="6" opacity=".55"/>
      <path d="M-40 126 Q-20 152 0 152 Q20 152 40 126 Q29 159 0 161 Q-29 159 -40 126 Z" fill={C.hair} opacity=".26"/>
      <path d={`M-39 ${86-browLift} Q-28 ${79-browLift} -16 ${84-browLift}`} stroke={C.hair} strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d={`M16 ${84-browLift} Q28 ${79-browLift} 39 ${86-browLift}`} stroke={C.hair} strokeWidth="6" fill="none" strokeLinecap="round"/>
      <g>{[-28,28].map((ex,i)=><g key={i}>
        <ellipse cx={ex} cy="104" rx="12.5" ry={blink?2.5:13} fill="#fffaf0"/>
        <circle cx={ex} cy="106" r={blink?1.5:6.5} fill={C.ink}/>
        <circle cx={ex+2.4} cy="103" r="2" fill="#fffaf0"/>
      </g>)}</g>
      <path d="M0 112 Q-6 122 2 126" fill="none" stroke={C.skinShade} strokeWidth="5" strokeLinecap="round"/>
      {happy
        ? <path d="M-21 136 Q0 157 21 136 Q0 147 -21 136Z" fill={C.skinShade}/>
        : <ellipse cx="0" cy="140" rx="13" ry={mouthRy} fill={C.skinShade}/>}
      <ellipse cx="-45" cy="118" rx="10" ry="5" fill={C.skinShade} opacity=".3"/>
      <ellipse cx="45" cy="118" rx="10" ry="5" fill={C.skinShade} opacity=".3"/>
    </g>
  </g>;
};
