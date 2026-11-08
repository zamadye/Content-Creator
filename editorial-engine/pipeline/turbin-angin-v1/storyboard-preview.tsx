/* Static pre-review design studies only: no voice, footage playback, timeline,
 * or production video. DRAFT labels are burned in. Built from the existing
 * host rig and a deliberately schematic turbine; no claim of real shutdown. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import {Host,RigDefs} from '../awan-rig-v2/rig';
import {openingPeak} from './motion.mjs';
const root=process.cwd(), out=path.resolve(root,'../.scratch/turbine');
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const C={ink:'#0b2732',cream:'#fff4df',gold:'#f8c96f',mint:'#a9d7ce',sky:'#2e7b83',rust:'#c96845'};
const Text=({x,y,size,fill=C.cream,hand=false,children,anchor='start'}:{x:number;y:number;size:number;fill?:string;hand?:boolean;children:string;anchor?:'start'|'middle'|'end'})=><text x={x} y={y} fontFamily={hand?'Permanent Marker':'Archivo'} fontWeight={hand?400:700} fontSize={size} fill={fill} textAnchor={anchor}>{children}</text>;
function Defs(){return <><RigDefs/><defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#144354"/><stop offset=".55" stopColor="#276a6d"/><stop offset="1" stopColor="#d3b37a"/></linearGradient>
 <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#b2c6c1"/><stop offset=".55" stopColor="#fffbef"/><stop offset="1" stopColor="#bed6d0"/></linearGradient>
 <linearGradient id="mast" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#829e98"/><stop offset=".55" stopColor="#f2eee1"/><stop offset="1" stopColor="#91b0a8"/></linearGradient>
 <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff5e3"/><stop offset="1" stopColor="#e6d8b9"/></linearGradient>
 </defs></>}
function Turbine({x,y,angle=0,scale=1}:{x:number;y:number;angle?:number;scale?:number}){
 return <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M-27 15 L-60 640 L60 640 L27 15Z" fill="url(#mast)" stroke="#375755" strokeWidth="9"/>
  <path d="M-18 93 L-41 610" fill="none" stroke="#fffef4" strokeWidth="7" opacity=".45"/>
  <ellipse cx="0" cy="649" rx="137" ry="23" fill="#132d31" opacity=".25"/>
  <path d="M-15-43 Q15-68 73-47 L116-25 Q135 1 108 27 L15 35Z" fill="url(#mast)" stroke="#375755" strokeWidth="8"/>
  <g transform={`rotate(${angle})`}>{[0,120,240].map(v=><g key={v} transform={`rotate(${v})`}>
   <path d="M-30-15 Q-43-150 -24-300 Q-18-405 -4-484 Q6-500 15-474 Q28-379 31-280 L35-18Z" fill="url(#blade)" stroke="#355756" strokeWidth="7" strokeLinejoin="round"/>
   <path d="M-9-55 Q-21-238 3-450" fill="none" stroke="#fffef4" strokeWidth="7" opacity=".55"/>
  </g>)}</g><circle r="53" fill="#f6f4e9" stroke="#375755" strokeWidth="9"/><circle r="19" fill="#8ea8a4"/>
 </g>
}
function Header({sub,first='ANGIN KENCANG',second='TURBIN DIAM?'}:{sub:string;first?:string;second?:string}){return <><circle cx="73" cy="112" r="8" fill={C.gold}/><Text x={94} y={122} size={25}>DUNIA KEBALIK / KNOT THEORY</Text><rect x="66" y="169" width="944" height="3" fill="#def4e5" opacity=".3"/><Text x={70} y={243} size={74} hand>{first}</Text><Text x={70} y={343} size={74} fill={C.gold} hand>{second}</Text><Text x={73} y={411} size={27} fill={C.mint}>{sub}</Text></>}
function Opening(){const a=openingPeak(0).angleRadians*180/Math.PI;return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
 <Defs/><rect width="1080" height="1920" fill="url(#sky)"/><path d="M0 1475 Q180 1400 360 1450 T750 1450 T1080 1435 V1920 H0Z" fill="#244d46"/><path d="M0 1530 Q270 1490 480 1530 T1080 1500 V1920 H0Z" fill="#183c3a"/>
 <rect width="1080" height="455" fill="#0c2d3b" opacity=".8"/><Header sub="SAAT YANG DIBUTUHKAN JADI TERLALU KUAT"/>
 <g fill="none" stroke="#cff5eb" strokeLinecap="round" opacity=".56"><path d="M30 570 Q190 525 350 575 T700 570 T1030 540" strokeWidth="10"/><path d="M10 700 Q160 660 300 708 T590 700" strokeWidth="7"/><path d="M800 1120 Q930 1100 1055 1040" strokeWidth="8"/></g>
 <Turbine x={625} y={930} angle={a} scale={.88}/>
 <g><rect x="80" y="475" width="219" height="49" rx="11" fill={C.ink} opacity=".9"/><Text x={96} y={508} size={23} fill={C.mint}>ILUSTRASI</Text></g>
 <Host x={245} y={1085} scale={.71} frame={0} lean={-4} head={-5} gaze={1} emotion="surprised" left={[-155,330]} right={[245,225]} talk={false}/>
 <rect x="78" y="1574" width="924" height="166" rx="23" fill="#071f28" opacity=".94"/>
 <Text x={540} y={1638} size={41} anchor="middle">Saat angin terlalu kencang,</Text><Text x={540} y={1698} size={41} anchor="middle">turbin angin justru bisa berhenti.</Text>
 <Text x={70} y={1842} size={22} fill="#c8e1d7">STUDI FRAME 0 · DRAF SEBELUM REVIEW</Text>
 </svg>}
function Airfoil({x,y,angle=0}:{x:number;y:number;angle:number}){return <g transform={`translate(${x} ${y})`}><circle r="190" fill="#dbefe3" opacity=".4"/><circle r="190" fill="none" stroke="#568a85" strokeWidth="4" strokeDasharray="13 12"/><g transform={`rotate(${angle})`}><path d="M-154 0 Q-75-56 75-24 L155 0 Q75 28-74 33 Q-130 27-154 0Z" fill="#f8f6ea" stroke="#385d59" strokeWidth="7"/><path d="M-100 0 Q-10-20 105-4" stroke="#a5c9be" strokeWidth="5" fill="none"/></g><circle r="13" fill={C.rust} stroke="#fff" strokeWidth="4"/></g>}
function Mechanism(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
 <Defs/><rect width="1080" height="1920" fill="#123b46"/><Header first="BILAH BERPUTAR" second="PADA SUMBUNYA" sub="SKEMA PITCH · BUKAN REKAMAN KEJADIAN"/>
 <rect x="54" y="490" width="972" height="940" rx="38" fill="url(#panel)" stroke="#3a655f" strokeWidth="8"/>
 <Text x={538} y={565} size={34} fill={C.ink} anchor="middle">PENAMPANG BILAH / ILUSTRASI</Text>
 <g fill="none" stroke="#5da59c" strokeWidth="8" strokeLinecap="round"><path d="M96 780 H976 M96 900 H976 M96 1020 H976"/><path d="M942 755 l34 25 -34 25 M942 875 l34 25 -34 25 M942 995 l34 25 -34 25"/></g>
 <Airfoil x={305} y={900} angle={-45}/><Airfoil x={780} y={900} angle={0}/>
 <path d="M512 891 C548 845 572 845 604 891 M587 862 L604 891 L569 890" fill="none" stroke={C.rust} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
 <Text x={305} y={1188} size={31} fill={C.ink} anchor="middle">SUDUT AWAL</Text><Text x={780} y={1188} size={31} fill={C.ink} anchor="middle">LEBIH SEJAJAR</Text>
 <Text x={540} y={1280} size={27} fill="#31564f" anchor="middle">TITIK = SUMBU PANJANG BILAH</Text><Text x={540} y={1342} size={27} fill="#31564f" anchor="middle">PANAH = ARAH ANGIN</Text>
 <Host x={210} y={1440} scale={.52} frame={0} gaze={1} emotion="aha" left={[-150,390]} right={[240,240]} talk={false}/>
 <rect x="393" y="1505" width="590" height="205" rx="22" fill="#082631"/><Text x={686} y={1560} size={30} anchor="middle">Salah satu caranya,</Text><Text x={686} y={1609} size={30} anchor="middle">bilah diputar pada</Text><Text x={686} y={1658} size={30} anchor="middle">sumbu panjangnya.</Text>
 <Text x={70} y={1842} size={22} fill="#c8e1d7">STUDI MEKANISME · DRAF SEBELUM REVIEW</Text>
 </svg>}
function main(){fs.mkdirSync(out,{recursive:true});for(const [name,el] of [['studi-frame-0.png',<Opening/>],['studi-mekanisme.png',<Mechanism/>]] as const){const png=new Resvg(renderToStaticMarkup(el),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo'}}).render().asPng();fs.writeFileSync(path.join(out,name),png);console.log(`Static draft study: ${name}`)}}
main();
