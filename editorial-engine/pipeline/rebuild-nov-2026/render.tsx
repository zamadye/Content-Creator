/* Rebuilt November Shorts: headless React SVG -> resvg -> one continuous FFmpeg encode.
   Private inputs and outputs live under gitignored folders; no network or publishing.
   Prerequisites and limitations: see README.md. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';

const root=process.cwd();
const id=process.argv[2];
if (!id) throw new Error('Usage: npx tsx pipeline/rebuild-nov-2026/render.tsx EPISODE_ID [--stills]');
const dir=path.join(root,'deliverables','rebuild-2026-11-11',id);
const data=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json'),'utf8'));
const {episode:ep,board,sceneBounds,cues,voiceDuration,videoDuration}=data;
const [bg,accent,cream]=board.palette as string[];
const hero='data:image/jpeg;base64,'+fs.readFileSync(data.hero).toString('base64');
const fontFiles=['archivo-latin-400-normal.ttf','archivo-latin-700-normal.ttf'].map(f=>path.join(root,'assets/fonts',f));
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ease=(v:number)=>{v=clamp(v,0,1);return 1-Math.pow(1-v,3);};
// Conservative width estimate: bold uppercase has much wider glyphs than
// lowercase. Reserve a safe margin so no headline runs beyond the frame.
const pretty=(s:string,max=60)=>{
 const letters=[...s].filter(c=>/[A-Za-z]/.test(c));
 const upper=letters.length>0 && letters.filter(c=>c===c.toUpperCase()).length/letters.length>.8;
 return Math.min(max,Math.floor(925/(Math.max(1,s.length)*(upper ? 0.80 : 0.60))));
};
const txt=(x:number,y:number,str:string,size=50,fill=cream,anchor:'start'|'middle'|'end'='middle',weight=700)=>
  <text x={x} y={y} textAnchor={anchor} fontFamily="Archivo" fontSize={size} fontWeight={weight} fill={fill}>{str}</text>;
const Star=({x,y,r=5}:{x:number,y:number,r?:number})=><circle cx={x} cy={y} r={r} fill={cream} opacity=".7"/>;
const Sun=({x,y,r=90}:{x:number,y:number,r?:number})=><g transform={`translate(${x} ${y})`}>
  {Array.from({length:10},(_,i)=><line key={i} x1={Math.cos(i*Math.PI/5)*r*1.25} y1={Math.sin(i*Math.PI/5)*r*1.25} x2={Math.cos(i*Math.PI/5)*r*1.53} y2={Math.sin(i*Math.PI/5)*r*1.53} stroke="#f2be68" strokeWidth="12" strokeLinecap="round"/>)}
  <circle r={r} fill="#f2be68"/><circle r={r*.72} fill="#ffe3a5" opacity=".4"/>
</g>;
const Cloud=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`} fill="#d8ebed" stroke="#9eb9c2" strokeWidth="7">
  <path d="M-145 35 Q-153 -20 -100 -29 Q-80 -100 -10 -87 Q55 -105 83 -45 Q155 -44 153 23 Q151 65 105 66 H-100 Q-145 64 -145 35Z"/>
</g>;
const Ice=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M-285 205 L-165 -54 L-105 28 L15 -218 L94 -68 L141 -112 L300 205 Z" fill="#b1d9df" stroke="#e8f7f0" strokeWidth="8" strokeLinejoin="round"/>
  <path d="M-165 -54 L-122 4 L-86 -9 M15 -218 L61 -128 L24 -151 L-10 -115Z" fill="#f5faf0"/>
  <path d="M-150 175 L-35 24 L-54 176 M70 -25 L100 125 L159 192" fill="none" stroke="#6da4b2" strokeWidth="13" opacity=".8"/>
</g>;
const Dune=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}>
  <circle cx="-155" cy="-92" r="58" fill="#f5c76b"/><path d="M-290 165 Q-165 -100 6 133 Q126 -45 289 165Z" fill="#db9d55" stroke="#ffe1a1" strokeWidth="8"/><path d="M-55 165 Q12 66 96 165" fill="none" stroke="#b97142" strokeWidth="8"/>
</g>;
const Gauge=({x,y,s=1,level=55}:{x:number,y:number,s?:number,level?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x="-52" y="-151" width="104" height="300" rx="18" fill="#eaf3ef" stroke="#50747c" strokeWidth="9"/>
  <path d={`M-42 ${139-level}h84v${level}h-84z`} fill="#92cedc"/>
  {[0,1,2,3,4,5].map(i=><line key={i} x1="8" x2={i%2?31:38} y1={-110+i*41} y2={-110+i*41} stroke="#537782" strokeWidth="5"/>)}
  <path d="M-63 -165 H63 L46 -140 H-46Z" fill="#d0e5e2" stroke="#537782" strokeWidth="8"/>
  <path d="M0 149 V220 M-55 220 H55" stroke="#819a98" strokeWidth="12" strokeLinecap="round"/>
</g>;
const Earth=({x,y,r=150,tilt=false}:{x:number,y:number,r?:number,tilt?:boolean})=><g transform={`translate(${x} ${y})`}>
  <circle r={r} fill="#67bbce" stroke="#d6f2e7" strokeWidth="7"/>
  <path d={`M${-r*.8} ${-r*.4} q ${r*.35} ${-r*.5} ${r*.75} ${-r*.12} l ${r*.15} ${r*.2} l ${-r*.2} ${r*.17} l ${r*.1} ${r*.25} q ${-r*.34} ${r*.15} ${-r*.52} ${-r*.09} Z`} fill="#a5cb8e"/>
  <path d={`M${r*.1} ${r*.48} q ${r*.24} ${-r*.27} ${r*.55} ${-r*.12} l ${r*.05} ${r*.25} q ${-r*.22} ${r*.22} ${-r*.47} ${r*.13}Z`} fill="#a5cb8e"/>
  {tilt&&<line x1={-r*.52} y1={r*1.25} x2={r*.52} y2={-r*1.25} stroke="#f7d38d" strokeWidth="10" strokeDasharray="18 12"/>}
</g>;
const Planet=({x,y,r=175,color='#b6a9a4',rings=false}:{x:number,y:number,r?:number,color?:string,rings?:boolean})=><g transform={`translate(${x} ${y})`}>
 {rings&&<ellipse rx={r*1.65} ry={r*.40} transform="rotate(-15)" fill="none" stroke="#c99b70" strokeWidth="56"/>}
 <circle r={r} fill={color} stroke="#efddd0" strokeWidth="7"/><path d={`M${-r*.8} ${-r*.35} Q0 ${-r*.14} ${r*.85} ${-r*.38} M${-r*.87} ${r*.06} Q0 ${r*.31} ${r*.86} ${r*.04} M${-r*.7} ${r*.43} Q0 ${r*.60} ${r*.72} ${r*.38}`} stroke="#806c70" opacity=".35" strokeWidth="14" fill="none"/>
 {rings&&<path d={`M${-r*1.45} ${r*.42} Q0 ${r*.8} ${r*1.52} ${-r*.42}`} fill="none" stroke="#e6be88" strokeWidth="23"/>}
</g>;
const Moon=({x,y,r=120}:{x:number,y:number,r?:number})=><g transform={`translate(${x} ${y})`}><circle r={r} fill="#dedbd1" stroke="#fff3e1" strokeWidth="6"/><circle cx={-r*.3} cy={-r*.24} r={r*.18} fill="#b8b8b3"/><circle cx={r*.36} cy={r*.17} r={r*.23} fill="#b8b8b3"/><circle cx={-r*.1} cy={r*.46} r={r*.13} fill="#b8b8b3"/></g>;
const Guide=({t}:{t:number})=><g transform="translate(150 1195) scale(.9)">
  <path d="M-82 105 Q-90 5 -45 -20 Q0 -47 47 -20 Q96 8 82 105Z" fill="#358275" stroke="#d5eadb" strokeWidth="5"/>
  <path d="M-58 -20 Q-78 -83 -46 -130 Q-8 -171 45 -133 Q81 -92 62 -20 Q30 -47 0 -37 Q-31 -45 -58 -20Z" fill="#bd694e" stroke="#f4b18a" strokeWidth="4"/>
  <ellipse cx="0" cy="-91" rx="37" ry="44" fill="#eeb996"/>
  <circle cx="-13" cy="-97" r="3.5" fill="#243c3d"/><circle cx="13" cy="-97" r="3.5" fill="#243c3d"/>
  <ellipse cx="0" cy="-74" rx="8" ry={3+2*Math.abs(Math.sin(t*8))} fill="#995d54"/>
  <path d={`M40 20 Q75 ${-7+Math.sin(t*3)*8} 100 ${-31+Math.sin(t*3)*8}`} fill="none" stroke="#72b1a2" strokeWidth="22" strokeLinecap="round"/>
  <circle cx="102" cy={-32+Math.sin(t*3)*8} r="11" fill="#eeb996"/>
  <path d="M-52 105 V143 M50 105 V143" stroke="#9bd1bf" strokeWidth="20" strokeLinecap="round"/>
</g>;
const Talk=({x=318,y=1110}:{x?:number,y?:number})=><g transform={`translate(${x} ${y})`}><path d="M-100-55 H100 Q127-55 127-28 V36 Q127 65 100 65 H-32 L-73 96 L-65 65 H-100 Q-127 65 -127 38 V-28 Q-127-55-100-55Z" fill="#f1d8a5"/><circle cx="-49" r="9" fill="#36565b"/><circle cx="0" r="9" fill="#36565b"/><circle cx="49" r="9" fill="#36565b"/></g>;
const Calendar=({x,y,t}:{x:number,y:number,t:number})=><g transform={`translate(${x} ${y}) rotate(${Math.sin(t*2)*2})`}>
 <rect x="-130" y="-145" width="260" height="280" rx="20" fill="#f8ead4" stroke="#c99c6a" strokeWidth="9"/><rect x="-130" y="-145" width="260" height="70" rx="15" fill="#d99165"/>
 {[0,1,2].map(i=>[0,1,2].map(j=><rect key={`${i}-${j}`} x={-90+j*65} y={-40+i*58} width="32" height="25" rx="4" fill={i===2&&j===2?'#d99165':'#cad8d0'}/>))}
</g>;
const Parcel=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-120 -90 L0 -145 L120 -90 L120 90 L0 145 L-120 90Z" fill="#d7a373" stroke="#f6d3a7" strokeWidth="7"/><path d="M-120-90 L0-35 L120-90 M0-35 V145 M-58-118 L58-61" fill="none" stroke="#ac744f" strokeWidth="7"/></g>;
const Receipt=({x,y,lines,scale=1}:{x:number,y:number,lines:string[],scale?:number})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
 <path d="M-200 -270 H200 V260 L165 240 L130 260 L95 240 L60 260 L25 240 L-10 260 L-45 240 L-80 260 L-115 240 L-150 260 L-200 240Z" fill="#fbf0d6" stroke="#dab98d" strokeWidth="8"/>
 {lines.map((line,i)=><g key={i}>{txt(0,-170+i*72,line,Math.min(46,Math.floor(360/(line.length*.59))),'#243d3b','middle',700)}</g>)}
</g>;
const Rainbow=({x,y,r=240}:{x:number,y:number,r?:number})=><g transform={`translate(${x} ${y})`}>
 {['#df7a7a','#e9a75c','#e6d57c','#8ac0a4','#75b4c9','#8d9acb','#ac8eb9'].map((c,i)=><circle key={c} r={r-i*20} fill="none" stroke={c} strokeWidth="20"/>)}
</g>;
const Drop=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M0-180 Q-65-80 -116 5 Q-168 123 0 160 Q168 123 116 5 Q65-80 0-180Z" fill="#91d5df" stroke="#e8f7ef" strokeWidth="8" opacity=".9"/></g>;
const Airplane=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`} fill="#f5f2e7" stroke="#91abb1" strokeWidth="7"><path d="M-180 10 Q-160-10 -40-15 L15-112 H58 L32-12 H135 Q180-10 180 10 Q180 28 135 30 H33 L58 112 H15 L-40 30 H-160Z"/></g>;
const Crab=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}>
 {[0,1,2].map(i=><g key={i} stroke="#a77b60" strokeWidth="15" strokeLinecap="round"><path d={`M-100 ${-30+i*45} L-170 ${-5+i*45} L-198 ${-30+i*45}`}/><path d={`M100 ${-30+i*45} L170 ${-5+i*45} L198 ${-30+i*45}`}/></g>)}
 <path d="M0 112 L-13 250 L13 250Z" fill="#b78562"/><path d="M-150-15 Q-145-142 0-158 Q145-142 150-15 Q120 118 0 130 Q-120 118 -150-15Z" fill="#bd8a65" stroke="#f0d6b8" strokeWidth="7"/><path d="M-115 -10 Q0 -82 115 -10" fill="none" stroke="#e1b38c" strokeWidth="10"/><circle cx="-74" cy="-43" r="8" fill="#35464a"/><circle cx="74" cy="-43" r="8" fill="#35464a"/>
</g>;
const Vial=({x,y,s=1,color='#5aabc8'}:{x:number,y:number,s?:number,color?:string})=><g transform={`translate(${x} ${y}) scale(${s})`}><rect x="-70" y="-150" width="140" height="290" rx="25" fill="#e6f2ef" stroke="#b5d2ce" strokeWidth="7"/><path d="M-62 10 H62 V115 Q62 132 45 132 H-45 Q-62 132-62 115Z" fill={color}/><rect x="-75" y="-170" width="150" height="38" rx="8" fill="#d7c3a5"/></g>;
const Spider=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`} fill="#a57867" stroke="#eacbb0" strokeWidth="8" strokeLinecap="round">
 {[0,1,2,3].map(i=><g key={i} fill="none"><path d={`M-25 ${-20+i*25} L-100 ${-70+i*30} L-145 ${-45+i*36}`}/><path d={`M25 ${-20+i*25} L100 ${-70+i*30} L145 ${-45+i*36}`}/></g>)}<ellipse cy="25" rx="70" ry="85"/><circle cy="-65" r="45"/>
</g>;
const Scorpion=({x,y,s=1}:{x:number,y:number,s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`} fill="#bd8c6d" stroke="#efd0b2" strokeWidth="8" strokeLinecap="round"><ellipse rx="70" ry="95"/><path d="M10-95 Q70-165 55-230 Q30-255 5-235" fill="none" stroke="#bd8c6d" strokeWidth="24"/><path d="M-40 25 L-130 55 M40 25 L130 55 M-40-5 L-125-35 M40-5 L125-35" fill="none"/><path d="M-140 32 l-35-22 8 45 27 17 M140 32 l35-22-8 45-27 17" fill="none" strokeWidth="14"/></g>;

function Facts({scene,t}:{scene:number,t:number}){
 const bob=Math.sin(t*2)*10, wave=Math.sin(t*1.6)*9;
 const dt=Math.max(0,t-sceneBounds[scene]);
 const entrance=1-ease(dt*.75);
 if(id.startsWith('antartika')) return <g>
   {scene===1&&<><g transform={`translate(${-90*entrance} 0)`}><Dune x={-235} y={70} s={.7}/></g><g transform={`translate(${90*entrance} 0)`}><Ice x={240} y={70} s={.7}/></g><Cloud x={wave*2} y={-230} s={.55}/><Gauge x={0} y={142} s={.58} level={20+15*ease(dt/5)}/></>}
   {scene===2&&<><Cloud x={wave*2} y={-235} s={1.05}/><Gauge x={30} y={113} s={1.1} level={25+13*ease(dt/7)}/>{Array.from({length:9},(_,i)=><g key={i} transform={`translate(${(i%3-1)*90} ${-110+((t*65+i*47)%220)})`}><path d="M-10 0H10M0-10V10M-7-7L7 7M-7 7L7-7" stroke="#e9f4eb" strokeWidth="5"/></g>)}</>}
   {scene===3&&<><Ice x={-110} y={-35} s={.95}/>{[0,1,2].map(i=><path key={i} d={`M-365 ${180+i*40} H115`} stroke="#7ab2bf" strokeWidth="18" opacity={ease((dt-i*.8)/.8)}/>)}<Calendar x={230} y={105} t={t}/></>}
   {scene===4&&<><g transform={`translate(${-80*entrance} 0)`}><Ice x={-210} y={55} s={.7}/></g><g transform={`translate(${80*entrance} 0)`}><Dune x={235} y={55} s={.7}/></g><Talk x={0} y={290}/></>}
 </g>;
 if(id.startsWith('merkurius')) return <g>
   {(scene===1||scene===2)&&<><Sun x={-310} y={-220} r={65}/><path d="M-220-180 L220 100 M-235-100 L180 150 M-200-240 L270 20" stroke="#f5cf87" strokeWidth="11" opacity=".7"/><path d="M-410 180 Q-230 110 -130 160 Q0 335 120 160 Q260 120 410 180 L410 320 H-410Z" fill="#a59491" stroke="#e5c9b6" strokeWidth="8"/><path d="M-125 165 Q0 330 123 165 L90 215 Q0 300 -93 215Z" fill="#343341"/><path d="M-60 250 Q0 280 64 248 L54 271 Q0 302 -52 272Z" fill="#a4dce5"/>{txt(0,355,'kawah kutub',38,cream)}</>}
   {scene===3&&<><Planet x={0} y={40} r={190}/><g transform={`translate(${220+wave} -180) rotate(15)`}><rect x="-75" y="-45" width="150" height="90" rx="12" fill="#e4d5be" stroke="#a9b9ba" strokeWidth="6"/><path d="M-185-55 H-90 V55 H-185 Z M90-55 H185 V55 H90 Z" fill="#79a8ba" stroke="#bcd8d4" strokeWidth="6"/><circle r="22" fill="#efbb7a"/></g><circle cx="28" cy="-126" r="22" fill="#a3dbe2"/></>}
   {scene===4&&<><Planet x={-210} y={0} r={130}/><Planet x={210} y={0} r={160} color="#dfb57e"/>{txt(-210,230,'MERKURIUS',39,cream)}{txt(210,230,'VENUS',39,cream)}</>}
 </g>;
 if(id.startsWith('sisi-jauh')) {
   const a=-.7+t*.19, mx=300*Math.cos(a), my=260*Math.sin(a);
   return <g>
    {(scene===1||scene===2)&&<><Earth x={-40} y={20} r={155}/><ellipse cx="-40" cy="20" rx="300" ry="260" fill="none" stroke="#a8c0ca" strokeDasharray="15 17" strokeWidth="5"/><Moon x={mx-40} y={my+20} r={86}/><circle cx={mx-40-(mx/Math.hypot(mx,my))*72} cy={my+20-(my/Math.hypot(mx,my))*72} r="10" fill="#edaa69"/>{txt(-40,400,'skema tidak berskala',34,cream,'middle',400)}</>}
    {scene===3&&<><Sun x={-310} y={0} r={75}/><Moon x={0} y={0} r={112}/><path d="M0 -112 A112 112 0 0 1 0 112 L0 -112Z" fill="#59616d"/><Earth x={300} y={0} r={120}/><path d="M-200-40 L-125-40 M-200 0 H-125 M-200 40 H-125" stroke="#ffdc98" strokeWidth="8" markerEnd="url(#arrow)"/>{txt(0,230,'BULAN BARU',38,cream)}{txt(-45,285,'SISI JAUH TERANG',28,cream,'middle',400)}</>}
    {scene===4&&<><Sun x={-275} y={-100} r={75}/><Moon x={75} y={25} r={190}/><Talk x={300} y={260}/></>}
   </g>;
 }
 if(id.startsWith('gratis')) return <g>
   {scene===1&&<><Receipt x={-140} y={5} lines={['BARANG  Rp80.000','ONGKIR   Rp15.000','TOTAL   Rp95.000']} scale={.82}/><Parcel x={240} y={50+bob} s={.85}/></>}
   {scene===2&&<><Parcel x={-240} y={-35+bob} s={.85}/><Parcel x={120} y={45-bob} s={.68}/><rect x="-300" y="190" width="610" height="105" rx="28" fill="#e8c894"/>{txt(5,257,'MINIMUM Rp100.000',43,'#254238')}</>}
   {scene===3&&<><Receipt x={-212} y={0} lines={['BARANG','Rp80.000','ONGKIR','Rp15.000','TOTAL','Rp95.000']} scale={.82}/><Receipt x={212} y={0} lines={['BARANG','Rp105.000','ONGKIR Rp0','TOTAL','Rp105.000']} scale={.82}/>{txt(0,300,'SELISIH Rp10.000',42,accent)}</>}
   {scene===4&&<><Parcel x={-140} y={5} s={1}/><Receipt x={230} y={10} lines={['BUTUH?','CEK TOTAL','SEBELUM','BAYAR']} scale={.65}/><Talk x={0} y={295}/></>}
 </g>;
 if(id.startsWith('pelangi')) return <g>
   {scene===1&&<><Sun x={-310} y={-50} r={70}/><g transform="translate(-20 40)"><circle cy="-80" r="40" fill="#f2c493"/><path d="M0-30 V125 M0 20 L-50 85 M0 20 L45 72 M0 125 L-50 200 M0 125 L50 200" fill="none" stroke="#e3c397" strokeWidth="20" strokeLinecap="round"/></g><Cloud x={230} y={-100} s={.7}/><Drop x={220} y={140} s={.65}/><path d="M-210-50 H-80" stroke="#f6db9d" strokeWidth="10"/></>}
   {scene===2&&<><Drop x={0} y={0} s={1.35}/><path d="M-350-110 H-40 L95 30 L20 100" fill="none" stroke="#fff4d5" strokeWidth="12" markerEnd="url(#arrow)"/>{['#df7a7a','#e9a75c','#e6d57c','#8ac0a4','#75b4c9'].map((c,i)=><path key={c} d={`M20 100 L-260 ${150+i*19}`} stroke={c} strokeWidth="10"/>)}</>}
   {scene===3&&<><Rainbow x={0} y={0} r={230}/><Airplane x={0} y={50+bob} s={.72}/><Cloud x={-230} y={220} s={.48}/><Cloud x={255} y={-210} s={.45}/></>}
   {scene===4&&<><Rainbow x={80} y={0} r={220}/><Airplane x={-250} y={110} s={.53}/><Talk x={280} y={275}/></>}
 </g>;
 if(id.startsWith('musim')) return <g>
   {scene===1&&<><Earth x={0} y={0} r={185} tilt/><line x1="0" y1="-270" x2="0" y2="270" stroke="#dae8dc" strokeWidth="5" strokeDasharray="12 14"/>{txt(245,-210,'23,5°',53,accent)}</>}
   {scene===2&&<><Sun x={-320} y={-35} r={75}/><Earth x={120} y={20} r={175} tilt/><path d="M-195-90 H-60 M-195-20 H-60 M-195 50 H-60" stroke="#f1cf8a" strokeWidth="9" markerEnd="url(#arrow)"/></>}
   {scene===3&&<><Sun x={0} y={0} r={66}/><Earth x={-265} y={0} r={115} tilt/><Earth x={265} y={0} r={115} tilt/>{txt(-265,-240,'UTARA PANAS',31,cream)}{txt(-265,-195,'SELATAN DINGIN',31,cream)}{txt(265,-240,'UTARA DINGIN',31,cream)}{txt(265,-195,'SELATAN PANAS',31,cream)}</>}
   {scene===4&&<><Sun x={-240} y={-150} r={85}/><Cloud x={155} y={-130} s={.8}/><path d="M-230 200 Q-30-60 170 200Z" fill="#e5a35f" stroke="#f1dab3" strokeWidth="8"/><path d="M-30 200 V300 Q-30 340 10 330" stroke="#e7e1d1" strokeWidth="14" fill="none"/>{Array.from({length:6},(_,i)=><line key={i} x1={95+i*40} x2={75+i*40} y1={10+(t*35+i*20)%120} y2={50+(t*35+i*20)%120} stroke="#9cdae2" strokeWidth="8"/>)}</>}
 </g>;
 if(id.startsWith('darah')) return <g>
   {scene===1&&<><Crab x={-245} y={25} s={.8}/><Spider x={0} y={10} s={.7}/><Scorpion x={250} y={20} s={.65}/>{txt(-245,-270,'BELANGKAS',32,cream)}{txt(0,-270,'LABA-LABA',32,cream)}{txt(245,-270,'KALAJENGKING',30,cream)}</>}
   {scene===2&&<><Vial x={-185} y={0} s={1.05}/><Vial x={185} y={0} s={1.05} color="#bf7774"/>{txt(-185,235,'TEMBAGA',38,cream)}{txt(185,235,'ZAT BESI',38,cream)}</>}
   {scene===3&&<><Vial x={-135} y={10} s={1.2}/><g transform={`translate(${190+wave} 10)`}><ellipse rx="135" ry="80" fill="#9abcaa" stroke="#d6e5d5" strokeWidth="7"/><circle cx="-55" cy="-12" r="14" fill="#5d887c"/><circle cx="20" cy="20" r="17" fill="#5d887c"/><circle cx="70" cy="-15" r="12" fill="#5d887c"/></g>{txt(0,260,'ENDOTOKSIN BAKTERI',38,cream)}</>}
   {scene===4&&<><Crab x={-80} y={10} s={1.1}/><path d="M205-125 L320-88 V30 Q320 115 205 165 Q90 115 90 30 V-88Z" fill="#8ebba5" stroke="#e3f0dc" strokeWidth="8"/><path d="M160 10 L195 45 L255-25" fill="none" stroke="#f3f3da" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/></>}
 </g>;
 if(id.startsWith('nol-koma')) return <g>
   {scene===1&&<><path d="M-360 90 H360" stroke="#d9d4d1" strokeWidth="10"/><circle cx="-110" cy="90" r="16" fill="#eead85"/><circle cx="75" cy="90" r="16" fill="#eead85"/><circle cx="320" cy="90" r="16" fill="#f6e3ca"/>{txt(-110,-40,'0,9',62,cream)}{txt(75,-40,'0,99',62,cream)}{txt(320,-40,'1',70,accent)}{txt(0,220,'masih lebih kecil',38,cream)}</>}
   {scene===2&&<><rect x="-350" y="-125" width="700" height="260" rx="28" fill="#eddfcf"/>{txt(0,45,'0,999...',100,'#453242')}<path d={`M${-300+(t*35)%500} 155 L${-250+(t*35)%500} 95`} stroke="#f3bd8e" strokeWidth="22" strokeLinecap="round"/>{txt(0,250,'sembilan tanpa akhir',40,cream)}</>}
   {scene===3&&<><rect x="-385" y="-135" width="770" height="275" rx="34" fill="#efdfce"/>{txt(0,40,'0,999... = 1',100,'#453242')}{txt(0,245,'dua tulisan, nilai sama',40,cream)}</>}
   {scene===4&&<><rect x="-320" y="-140" width="640" height="240" rx="32" fill="#efdfce"/>{txt(0,20,'0,999... = 1',86,'#453242')}<Talk x={180} y={270}/></>}
 </g>;
 if(id.startsWith('saturnus')) return <g>
   {scene===1&&<><Planet x={-150} y={0} r={150} color="#e8c38b" rings/><Vial x={245} y={25} s={.9}/>{txt(-150,260,'SATURNUS',39,cream)}{txt(245,260,'AIR',39,cream)}</>}
   {(scene===2||scene===4)&&<><path d="M-350 30 L-300 250 Q-290 290 -240 290 H240 Q290 290 300 250 L350 30Z" fill="#d8e4df" stroke="#eaf4e7" strokeWidth="9"/><path d="M-330 90 Q-240 60 -150 90 T30 90 T210 90 T330 90 L300 245 Q285 278 240 278 H-240 Q-285 278-300 245Z" fill="#74b7c4"/><Planet x={0} y={20+bob} r={145} color="#e4c18c" rings/>{txt(0,370,'BAK IMAJINER',36,cream)}</>}
   {scene===3&&<><Planet x={0} y={20} r={175} color="#e4bf87" rings/><circle cx="-280" cy="-160" r="57" fill="#d5dfd2"/>{txt(-280,-148,'H₂',42,'#405a54')}<circle cx="280" cy="-160" r="57" fill="#d5dfd2"/>{txt(280,-148,'He',42,'#405a54')}</>}
 </g>;
 return <><Planet x={0} y={0}/><Talk/></>;
}

function Artwork({time}:{time:number}){
 let idx=sceneBounds.findIndex((b:number,i:number)=>i<sceneBounds.length-1&&time>=b&&time<sceneBounds[i+1]);
 if(idx<0)idx=4;
 const scene=board.scenes[idx];
 const local=time-sceneBounds[idx];
 const cue=cues.find((q:any)=>time>=q.start&&time<q.end) || (time>=voiceDuration?cues[cues.length-1]:null);
 const name='knot theory';
 return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
 <defs>
  <linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop stopColor={bg}/><stop offset="1" stopColor="#0c1925"/></linearGradient>
  <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#06121c" stopOpacity=".10"/><stop offset=".65" stopColor="#06121c" stopOpacity=".02"/><stop offset="1" stopColor="#06121c" stopOpacity=".8"/></linearGradient>
  <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#f1cf8a"/></marker>
 </defs>
 <rect width="1080" height="1920" fill="url(#back)"/>
 {idx===0 ? <>
   <g transform={`translate(${Math.sin(time*.35)*-8} ${Math.sin(time*.31)*-5}) scale(${1+Math.min(.02,time*.003)})`}><image href={hero} x="0" y="0" width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/></g>
   <rect width="1080" height="1920" fill="url(#shade)"/>
   {txt(72,93,'KNOT THEORY  /  DUNIA KEBALIK',30,accent,'start')}
   {board.headline.map((line:string,i:number)=><g key={i}>{txt(68,205+i*113,line,pretty(line,104),cream,'start')}</g>)}
   <rect x="55" y={205+board.headline.length*113-53} width="970" height="69" rx="12" fill="#06121d" opacity=".78"/>
   {txt(72,205+board.headline.length*113,board.tagline,39,cream,'start',400)}
 </> : <>
   <image href={hero} x="0" y="0" width="1080" height="1920" preserveAspectRatio="xMidYMid slice" opacity=".14"/>
   <rect x="0" y="0" width="1080" height="1920" fill={bg} opacity=".72"/>
   <rect x="55" y="62" width="970" height="5" rx="3" fill="#ffffff" opacity=".13"/>
   <rect x="55" y="62" width={970*clamp(time/videoDuration,0,1)} height="5" rx="3" fill={accent}/>
   {txt(67,132,'KNOT THEORY  /  DUNIA KEBALIK',30,accent,'start')}
   {txt(67,245,scene.heading,pretty(scene.heading,72),cream,'start')}
   {txt(69,309,scene.sub,pretty(scene.sub,39),cream,'start',400)}
   <circle cx="540" cy="850" r="470" fill="#ffffff" opacity=".035"/>
   {[0,1,2,3,4,5,6].map((n)=><Star key={n} x={80+n*150} y={420+(n%3)*60} r={3+n%2}/>)}
   <g transform={`translate(540 ${875+Math.sin(time*1.1)*3}) scale(${.96+.04*ease(local*1.1)})`}><Facts scene={idx} t={time}/></g>
   <Guide t={time}/>
   {idx===4&&<g><rect x="265" y="1312" width="640" height="100" rx="50" fill={accent}/>{txt(585,1377,'ikuti knot theory',48,bg)}</g>}
 </>}
 {cue&&<g>
   <rect x="62" y={1510-(cue.lines.length===1?0:18)} width="956" height={cue.lines.length===1?110:164} rx="24" fill="#06131d" opacity=".88"/>
   {cue.lines.map((line:string,i:number)=><g key={i}>{txt(540,1581+i*60-(cue.lines.length===2?19:0),line,pretty(line,53),'#ffffff')}</g>)}
 </g>}
 </svg>;
}
const raster=(element:React.ReactElement)=>{
 const svg=renderToStaticMarkup(element);
 return Buffer.from(new Resvg(svg,{font:{fontFiles,loadSystemFonts:false,defaultFontFamily:'Archivo'}}).render().asPng());
};
const png=(t:number)=>raster(<Artwork time={t}/>);
// An independently composed cover using the original art, not a video screenshot.
function Thumbnail(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
 <image href={hero} width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/>
 <rect x="0" y="0" width="1080" height="550" fill="#071621" opacity=".89"/>
 {txt(72,92,'KNOT THEORY  /  DUNIA KEBALIK',30,accent,'start')}
 {board.headline.map((line:string,i:number)=><g key={i}>{txt(68,220+i*115,line,pretty(line,105),cream,'start')}</g>)}
 {txt(72,235+board.headline.length*115,board.tagline,39,cream,'start',400)}
 <rect x="65" y="1570" width="330" height="94" rx="47" fill={accent}/>{txt(230,1632,'KOK BISA?',44,bg)}
 </svg>;}
async function main(){
 if(process.argv.includes('--stills')){
  const samples=[0,...sceneBounds.slice(1,5).map((x:number,i:number)=>(x+sceneBounds[i+2])/2),Math.max(0,voiceDuration-.6)];
  samples.forEach((t:number,i:number)=>fs.writeFileSync(path.join(dir,`qa-frame-${String(i).padStart(2,'0')}.png`),png(t)));
  fs.writeFileSync(path.join(dir,`${id}-thumbnail.png`),raster(<Thumbnail/>));
  console.log(JSON.stringify({id,stills:samples}));return;
 }
 const fps=15;const n=Math.ceil(videoDuration*fps);const out=path.join(dir,`${id}.mp4`);
 const ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
 const args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-i',data.voice,'-i',data.score,'-filter_complex',`[1:a]volume=1.8[v];[2:a]volume=0.16[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-3.5:LRA=11[a]`,'-map','0:v:0','-map','[a]','-t',String(videoDuration),'-r','30','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',out];
 const log=fs.createWriteStream(path.join(dir,'ffmpeg-error.log'));
 const child=spawn(ff,args,{stdio:['pipe','ignore','pipe']});child.stderr.pipe(log);
 child.on('error',e=>console.error('ffmpeg:',e));
 for(let i=0;i<n;i++){
  const frame=png(i/fps);
  if(!child.stdin.write(frame))await once(child.stdin,'drain');
  if(i%150===0)console.log(`${id}: ${i}/${n} frames`);
 }
 child.stdin.end();
 const [code]=await once(child,'close');
 if(code!==0)throw new Error(`FFmpeg exit ${code}; see ${dir}/ffmpeg-error.log`);
 console.log(`Rendered ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
