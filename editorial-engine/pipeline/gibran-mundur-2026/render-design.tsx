/*
 * Gibran Mundur — Remotion/SVG motion-design prototype.
 * The full illustrated scene is constructed from original vector objects.
 * Flow footage is reserved for three 5–7s background plates only; no Flow
 * output replaces the animated diagrams or text. No political likenesses.
 */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(), out=path.join(root,'deliverables/gibran-mundur-2026');
const timeline=JSON.parse(fs.readFileSync(path.join(root,'content/gibran-mundur/timeline.json'),'utf8'));
const C={bg:'#071e26',bg2:'#0b2c36',teal:'#216d6d',mint:'#abe1c7',cream:'#fff3d9',gold:'#f2c473',red:'#c75b53',blue:'#74bfd0',white:'#fffaf0',ink:'#102b33'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const T=({x,y,children,size=38,fill=C.cream,anchor='middle',opacity=1,family='Archivo'}:any)=><text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity} fontFamily={family} fontWeight="700">{children}</text>;
const Panel=({x,y,w,h,fill=C.bg2,stroke=C.teal}:any)=><rect x={x} y={y} width={w} height={h} rx="28" fill={fill} stroke={stroke} strokeWidth="4"/>;
const Pillar=({x,y=700,h=460,w=100,color=C.mint,opacity=1,scale=1}:any)=><g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d={`M-${w/2} ${h} L-${w*.38} 45 Q0 0 ${w*.38} 45 L${w/2} ${h} Z`} fill={color} stroke={C.cream} strokeWidth="5"/>
  <rect x={-w*.72} y={h-5} width={w*1.44} height="32" rx="6" fill={C.gold}/>
  <rect x={-w*.82} y="20" width={w*1.64} height="30" rx="8" fill={C.gold}/>
</g>;
const Arrow=({x1,y1,x2,y2,p=0,color=C.mint}:any)=><g>
  <path d={`M${x1} ${y1} Q${(x1+x2)/2} ${y1-35} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="8" strokeDasharray="14 11" strokeDashoffset={-p*40}/>
  <path d={`M${x2-18} ${y2-15} L${x2} ${y2} L${x2-20} ${y2+11}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
</g>;
const Node=({x,y,label,active=1,color=C.mint,r=42}:any)=><g opacity={active}>
  <circle cx={x} cy={y} r={r+12} fill={color} opacity=".11"/>
  <circle cx={x} cy={y} r={r} fill={C.bg2} stroke={color} strokeWidth="5"/>
  <T x={x} y={y+r+35} size={24} fill={C.cream}>{label}</T>
</g>;
const Paper=({x=540,y=780,angle=0,blank=true}:any)=><g transform={`translate(${x} ${y}) rotate(${angle})`}>
  <rect x="-170" y="-220" width="340" height="440" rx="18" fill={C.cream} stroke={C.gold} strokeWidth="8"/>
  <rect x="-120" y="-165" width="240" height="38" rx="8" fill={C.teal}/>
  <T x={0} y={-137} size={19} fill={C.white}>ILUSTRASI</T>
  {[0,1,2,3].map(i=><rect key={i} x="-115" y={-65+i*55} width={i===2?155:230} height="8" rx="4" fill={C.teal} opacity=".46"/>)}
  {blank&&<rect x="-118" y="95" width="230" height="70" rx="10" fill="none" stroke={C.red} strokeDasharray="10 8" strokeWidth="4"/>}
</g>;
const Chair=({x=540,y=920,lit=1}:any)=><g opacity={lit}>
  <rect x={x-90} y={y-210} width="180" height="220" rx="36" fill={C.teal} stroke={C.mint} strokeWidth="6"/>
  <rect x={x-108} y={y-20} width="216" height="86" rx="28" fill={C.gold}/>
  <path d={`M${x-66} ${y+62}v120 M${x+66} ${y+62}v120 M${x-105} ${y+175}h210`} stroke={C.cream} strokeWidth="16" strokeLinecap="round"/>
</g>;
const Gear=({x,y,r=90,rot=0,color=C.gold}:any)=><g transform={`translate(${x} ${y}) rotate(${rot})`} fill={color} stroke={C.ink} strokeWidth="8">
  <circle r={r} fill="none" stroke={color} strokeWidth="24" strokeDasharray="24 14"/>
  <circle r={r*.52} fill={C.bg2} stroke={color} strokeWidth="14"/><circle r={r*.18} fill={color}/>
</g>;
const Stamp=({children,x=540,y=1320,delay=1}:any)=><g opacity={ease((tGlobal-delay)/.7)} transform={`translate(0 ${(1-ease((tGlobal-delay)/.7))*30})`}>
  <rect x={x-450} y={y-56} width="900" height="112" rx="22" fill={C.gold}/><text x={x} y={y+12} fill={C.ink} fontSize="27" textAnchor="middle" fontFamily="Archivo" fontWeight="700" textLength="840" lengthAdjust="spacingAndGlyphs">{children}</text>
</g>;
let tGlobal=0;
function Illustration({n,t}:{n:number;t:number}){
  const pulse=.5+.5*Math.sin(t*2.1), draw=ease(t/1.4);
  switch(n){
    case 1:return <g>
      <g opacity={.5}><Pillar x={260} y={660} h={560} w={128}/><Pillar x={540} y={660} h={560} w={128}/><Pillar x={820} y={660} h={560} w={128}/>
        <path d="M180 670 L180 600 L900 600 L900 670" fill="none" stroke={C.cream} strokeWidth="42"/></g>
      <Pillar x={260} y={660} h={560} w={128} color={C.blue}/><Pillar x={540} y={660} h={560} w={128} color={C.mint}/><Pillar x={820} y={660} h={560} w={128} color={C.mint} opacity={1-draw}/>
      <Arrow x1={800} y1={720} x2={640} y2={720} p={t} color={C.gold}/><Arrow x1={800} y1={780} x2={645} y2={780} p={t+1} color={C.gold}/>
      <Stamp>SEBARAN BEBAN</Stamp></g>;
    case 2:return <g>
      {[0,1,2,3,4].map(i=><g key={i}><Pillar x={180+i*180} y={760} h={360} w={105} color={i===2?C.gold:C.mint} opacity={i===2?1-draw:1}/></g>)}
      <path d="M180 740 H900" fill="none" stroke={C.cream} strokeWidth="34"/><path d="M180 740 H900" fill="none" stroke={C.gold} strokeWidth="5" strokeDasharray="18 15" strokeDashoffset={-t*36}/>
      <g opacity={draw}><path d="M540 820 l72 0 M576 784 l0 72" stroke={C.red} strokeWidth="12" strokeLinecap="round"/><T x={540} y={1300} size={52} fill={C.gold}>BELUM TENTU</T></g>
      <Stamp>SATU PILAR HILANG — BEBAN PINDAH</Stamp></g>;
    case 3:return <g>
      {[0,1,2,3,4].map((i)=><g key={i}>
       <line x1={160+i*190} y1="720" x2={160+i*190} y2="1040" stroke={i===2?C.red:C.mint} strokeWidth={12+((i===2?pulse:0)*9)} opacity={.45+draw*.5}/>
       <rect x={115+i*190} y={1040} width="90" height="35" rx="8" fill={i===2?C.red:C.gold}/>
       {i===2&&<path d={`M${160+i*190} 760 l-24 42 32 22 -29 45 30 27`} fill="none" stroke={C.red} strokeWidth="8" strokeDasharray={`${draw*200} 200`}/>}
      </g>)}
      <Arrow x1={190} y1={630} x2={350} y2={630} p={t}/><Arrow x1={380} y1={630} x2={570} y2={630} p={t+1}/><Arrow x1={600} y1={630} x2={810} y2={630} p={t+2}/>
      <Stamp>LOAD REDISTRIBUTION · BEBAN BERPINDAH</Stamp></g>;
    case 4:case 5:return <g>
      <circle cx={540} cy={875} r={95} fill={C.bg2} stroke={C.gold} strokeWidth="8"/><T x={540} y={865} size={24}>SURAT</T><T x={540} y={902} size={22} fill={C.mint}>ILUSTRASI</T>
      <Node x={240} y={560} label="PRESIDEN" color={C.blue}/><Node x={840} y={560} label="MPR" color={C.mint}/>
      <Arrow x1={490} y1={810} x2={280} y2={620} p={t}/><Arrow x1={590} y1={810} x2={800} y2={620} p={t+1}/>
      <rect x="150" y="1110" width="780" height="104" rx="22" fill={C.bg2} stroke={C.teal} strokeWidth="4"/><T x={540} y={1174} size={30}>12 NOV 2026 · SURAT DISAMPAIKAN</T>
      <Stamp>ILUSTRASI — BUKAN DOKUMEN ASLI</Stamp></g>;
    case 6:return <g>
      <Paper x={540+Math.sin(t)*25} y={830} angle={Math.sin(t*.7)*2}/>
      <circle cx={540} cy={1140} r={55+10*pulse} fill="none" stroke={C.gold} strokeWidth="7"/><T x={540} y={1160} size={68} fill={C.gold}>?</T>
      <Stamp>ALASAN SPESIFIK TIDAK DIJELASKAN</Stamp></g>;
    case 7:return <g>
      <Panel x={90} y={585} w={425} h={520}/><Panel x={565} y={585} w={425} h={520}/>
      <T x={302} y={665} size={36} fill={C.blue}>MK · PHPU</T><T x={777} y={665} size={36} fill={C.mint}>MA · TUN</T>
      <Paper x={302} y={846} angle={-2}/><Paper x={777} y={846} angle={2}/>
      <line x1="540" y1="600" x2="540" y2="1080" stroke={C.gold} strokeWidth="4" strokeDasharray="14 14"/>
      <Stamp>BEDAKAN PERKARA & AMAR PUTUSAN</Stamp></g>;
    case 8:return <g>
      <Panel x={90} y={590} w={900} h={600}/>
      <rect x="145" y="690" width="350" height="270" rx="22" fill={C.teal}/><rect x="585" y="690" width="350" height="270" rx="22" fill="#3a2428"/>
      <T x={320} y={765} size={30}>FAKTA DALAM PUTUSAN</T><T x={760} y={765} size={30}>TUDUHAN TAMBAHAN</T>
      <T x={540} y={920} size={120} fill={C.gold}>≠</T>
      <Stamp>JANGAN DIPLOKIR JADI KLAIM LAIN</Stamp></g>;
    case 9:return <g>
      <Panel x={90} y={620} w={420} h={400}/><Panel x={570} y={620} w={420} h={400}/>
      <T x={300} y={755} size={30}>MUNDUR</T><T x={780} y={755} size={30}>MENGAKUI</T><T x={780} y={800} size={30}>KESALAHAN</T>
      <T x={540} y={900} size={112} fill={C.gold}>≠</T><Chair x={540} y={1190} lit={.8}/><Stamp>JANGAN BURU-BURU MENYIMPULKAN</Stamp></g>;
    case 10:return <g>
      {[0,1,2,3].map(i=><Pillar key={i} x={240+i*200} y={720} h={430} w={105} color={i===1?C.gold:C.mint} opacity={i===1?draw:1}/>)}
      <line x1="170" y1="700" x2="910" y2="700" stroke={C.cream} strokeWidth="36"/><path d="M540 630V530m-80 0h160m-120-40 40 40 40-40" stroke={C.gold} strokeWidth="12" fill="none"/>
      <Stamp>CUKUP PASANG PILAR BARU?</Stamp></g>;
    case 11:return <g>
      <rect x="90" y="590" width="900" height="570" rx="22" fill="#c9a976" opacity=".15" stroke={C.gold} strokeWidth="5"/>
      <path d="M170 720H900M170 840H900M170 960H900M300 640V1110M520 640V1110M740 640V1110" stroke={C.mint} strokeWidth="3" strokeDasharray="12 10" opacity=".65"/>
      <path d={`M260 1060 l70-85 50 24 74-108 64 31 80-132`} fill="none" stroke={C.red} strokeWidth="12" strokeDasharray={`${draw*520} 520`}/>
      <Stamp>DESAIN · PEMERIKSAAN · DISTRIBUSI BEBAN</Stamp></g>;
    case 12:case 13:return <g>
      <circle cx={540} cy={875} r={370} fill="none" stroke={C.mint} strokeWidth="5" strokeDasharray="18 14" strokeDashoffset={-t*24}/>
      <Node x={540} y={550} label="PRESIDEN" color={C.gold}/><Node x={810} y={710} label="MPR" color={C.blue}/><Node x={810} y={1010} label="DPR" color={C.mint}/><Node x={540} y={1190} label="PENGADILAN" color={C.blue}/><Node x={270} y={1010} label="LEMBAGA" color={C.mint}/><Node x={270} y={710} label="WARGA" color={C.gold}/>
      {[0,1,2,3,4,5].map(i=>{const p=[540,810,810,540,270,270][i],q=[550,710,1010,1190,1010,710][i],r=[540,810,810,540,270,270][(i+1)%6],s=[550,710,1010,1190,1010,710][(i+1)%6];return <line key={i} x1={p} y1={q} x2={r} y2={s} stroke={C.teal} strokeWidth="8" opacity={.55+.4*pulse}/>})}
      <Stamp>{n===13?'PASAL 8 AYAT (2) · ALUR KONSTITUSI':'KEWENANGAN · BATAS · SISTEM'}</Stamp></g>;
    case 14:return <g>
      <Panel x={110} y={550} w={860} h={620}/>
      <Node x={250} y={850} label="PRESIDEN" color={C.gold}/><Node x={830} y={850} label="MPR" color={C.blue}/>
      <Arrow x1={325} y1={820} x2={740} y2={820} p={t}/>
      {[0,1].map(i=><g key={i} opacity={draw}><circle cx={470+i*145} cy={690} r="32" fill={C.cream}/><T x={470+i*145} y={696} size={22} fill={C.ink}>{i+1}</T></g>)}
      <g>{Array.from({length:60},(_,i)=><rect key={i} x={165+(i%10)*75} y={960+Math.floor(i/10)*25} width="48" height="12" rx="4" fill={i<Math.round(pulse*60)?C.gold:C.teal}/>)}</g>
      <T x={540} y={1190} size={31} fill={C.gold}>PALING LAMBAT 60 HARI</T><Stamp>2 CALON · MPR MEMILIH</Stamp></g>;
    case 15:return <g>
      <path d="M540 520V700M540 700 C400 770 290 850 250 1050M540 700 C680 770 790 850 830 1050" fill="none" stroke={C.gold} strokeWidth="10" strokeDasharray="18 12" strokeDashoffset={-t*28}/>
      <Panel x={80} y={1020} w={390} h={230} stroke={C.mint}/><Panel x={610} y={1020} w={390} h={230} stroke={C.blue}/>
      <T x={275} y={1135} size={32}>PERSPEKTIF A</T><T x={805} y={1135} size={32}>PERSPEKTIF B</T>
      <circle cx={540} cy={610} r={60} fill={C.bg2} stroke={C.gold} strokeWidth="8"/><T x={540} y={627} size={50}>?</T><Stamp>DUA SUDUT PANDANG</Stamp></g>;
    case 16:case 17:return <g>
      <rect x="180" y="620" width="720" height="390" rx="34" fill="#4f3826" stroke={C.gold} strokeWidth="8"/>
      {[0,1,2,3].map(i=><g key={i}><line x1={250+i*190} y1="660" x2={250+i*190} y2="990" stroke="#997453" strokeWidth="5"/><Chair x={250+i*190} y={850} lit={.85}/></g>)}
      <rect x="445" y="1030" width="190" height="32" rx="8" fill={n===16?C.mint:C.gold} opacity={.65+.3*pulse}/>
      <Stamp>{n===16?'PERSPEKTIF A · MEREDAKAN KONFLIK':'PERSPEKTIF B · BERKAS TETAP ADA'}</Stamp></g>;
    case 18:case 19:return <g>
      <path d="M180 940 L245 820 Q280 770 370 760 L700 760 Q780 770 850 880 L900 930 L900 1000 L180 1000 Z" fill={C.blue} stroke={C.cream} strokeWidth="8"/>
      <circle cx="340" cy="1010" r="65" fill={C.bg} stroke={C.gold} strokeWidth="14"/><circle cx="740" cy="1010" r="65" fill={C.bg} stroke={C.gold} strokeWidth="14"/>
      <rect x="455" y="650" width="170" height="120" rx="20" fill={C.bg2} stroke={C.mint} strokeWidth="6"/><Gear x={540} y={710} r={55} rot={t*90}/>
      <path d={`M470 605 Q540 ${530+15*Math.sin(t*2)} 610 605`} fill="none" stroke={C.red} strokeWidth="10" strokeDasharray="12 10"/>
      <Stamp>{n===18?'AKAR MASALAH · SISTEM PENDINGIN':'GANTI KOMPONEN ≠ GANTI SISTEM'}</Stamp></g>;
    case 20:return <g>
      {['GANGGUAN','DETEKSI','PERBAIKI','CEGAH'].map((v,i)=>{const ang=-Math.PI/2+i*Math.PI/2+ t*.15,x=540+290*Math.cos(ang),y=870+290*Math.sin(ang),on=(Math.floor(t*1.4)%4)===i;return <g key={v}><circle cx={x} cy={y} r={72+8*(on?pulse:0)} fill={on?C.mint:C.bg2} stroke={on?C.gold:C.teal} strokeWidth="6"/><T x={x} y={y+7} size={24} fill={on?C.ink:C.cream}>{v}</T></g>})}
      <circle cx={540} cy={870} r={116} fill={C.teal} opacity={.5}/><T x={540} y={860} size={33}>RESILIENCE</T><T x={540} y={906} size={22} fill={C.gold}>LOOP</T><Stamp>SISTEM KUAT = BISA PULIH & BELAJAR</Stamp></g>;
    case 21:return <g>
      <path d="M540 660 C370 730 330 840 300 980 M540 660 C710 730 750 840 780 980" fill="none" stroke={C.mint} strokeWidth="11" strokeDasharray="20 12" strokeDashoffset={-t*40}/>
      <Panel x={100} y={940} w={390} h={190}/><Panel x={590} y={940} w={390} h={190}/>
      <T x={295} y={1020} size={27}>PERBAIKI</T><T x={295} y={1060} size={27}>SISTEM</T><T x={785} y={1020} size={27}>GANTI SATU</T><T x={785} y={1060} size={27}>KOMPONEN</T>
      <Pillar x={540} y={850} h={310} w={130} color={C.gold}/><Stamp>PILAR BUKAN PEMILIK GEDUNG</Stamp></g>;
    case 22:return <g>
      <Chair x={540} y={1030} lit={.95}/><circle cx={540} cy={1180} r={120+12*pulse} fill={C.gold} opacity={.1}/>
      <path d="M500 1160 l40 45 80-95" fill="none" stroke={C.mint} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
      <Stamp>JABATAN BUKAN MILIK PRIBADI</Stamp></g>;
    case 23:return <g>
      <path d="M120 700 H960" stroke={C.gold} strokeWidth="12" strokeDasharray="20 10" strokeDashoffset={-t*36}/>
      <T x={540} y={600} size={32}>ATURAN YANG SAMA UNTUK SEMUA</T>
      {[0,1,2].map(i=><g key={i} opacity={.65+.35*Math.sin(t*1.5+i)}><circle cx={280+i*260} cy={900} r="82" fill={i===1?C.teal:C.bg2} stroke={C.mint} strokeWidth="5"/><T x={280+i*260} y={910} size={25}>{['NAMA','KELUARGA','KELOMPOK'][i]}</T><line x1={280+i*260} y1="820" x2={280+i*260} y2="715" stroke={C.cream} strokeWidth="6"/></g>)}
      <Stamp>SIAPA PUN BERKUASA, TUNDUK PADA ATURAN</Stamp></g>;
    case 24:return <g>
      {[0,1].map(i=><g key={i}><Panel x={90+i*475} y={610} w={425} h={530} stroke={i?C.blue:C.gold}/><circle cx={302+i*475} cy={760} r={78} fill={i?C.blue:C.gold}/><T x={302+i*475} y={774} size={44} fill={C.ink}>{i?'B':'A'}</T><T x={302+i*475} y={900} size={27}>{i?'EVALUASI':'GANTI'}</T><T x={302+i*475} y={945} size={27}>{i?'SISTEM':'KOMPONEN'}</T></g>)}
      <circle cx={540} cy={1270} r={66} fill={C.mint}/><path d="M500 1260 Q540 1218 580 1260 V1300 H500 Z" fill={C.bg2}/><circle cx={520} cy={1270} r={5} fill={C.cream}/><circle cx={560} cy={1270} r={5} fill={C.cream}/><Stamp>PILIHAN ADA DI TANGAN KITA</Stamp></g>;
    default:return <g><Pillar x={540} y={700}/><Stamp>KNOT THEORY · ILUSTRASI</Stamp></g>;
  }
}
function Frame({n,t}:{n:number;t:number}){
  tGlobal=t;
  const scene=timeline.scenes[n-1];
  const label=scene.visualType==='footage'?'PLATE FOOTAGE + MOTION REMOTION':scene.visualType==='mixed'?'FOOTAGE (JIKA ADA) + OBJEK REMOTION':'ANIMASI REMOTION';
  const overlayText=(scene.overlay||scene.visual.slice(0,40)).replaceAll('≠','BUKAN').replaceAll('→','KE');
  const overlayFont=overlayText.length>48?22:overlayText.length>36?26:30;
  return <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stopColor={C.bg}/><stop offset="1" stopColor={C.bg2}/></linearGradient><pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke={C.teal} strokeOpacity=".12" strokeWidth="1"/></pattern><radialGradient id="glow"><stop stopColor={C.teal} stopOpacity=".25"/><stop offset="1" stopColor={C.bg} stopOpacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="url(#b)"/><rect width="1920" height="1080" fill="url(#grid)"/><ellipse cx="960" cy="555" rx="760" ry="500" fill="url(#glow)"/>
    <circle cx="78" cy="70" r="10" fill={C.gold}/><text x="105" y="79" fill={C.cream} fontSize="25" fontWeight="700" fontFamily="Archivo">KNOT THEORY / DUNIA KEBALIK</text>
    <rect x="78" y="112" width="520" height="40" rx="8" fill="#041219" opacity=".9"/><text x="98" y="139" fill={C.mint} fontSize="19" fontWeight="700" fontFamily="Archivo">{label}</text>
    <text x="78" y="220" fill={C.cream} fontSize="38" fontFamily="Archivo" fontWeight="700">SC{String(n).padStart(2,'0')} · {scene.section.toUpperCase()}</text>
    <g transform="translate(485 -330) scale(.88)"><Illustration n={n} t={t}/></g>
    <g opacity=".62"><path d="M80 330h230M1610 330h230M80 765h230M1610 765h230" stroke={C.teal} strokeWidth="3"/><circle cx="170" cy="545" r="75" fill="none" stroke={C.teal} strokeWidth="3"/><circle cx="1750" cy="545" r="75" fill="none" stroke={C.teal} strokeWidth="3"/><text x="170" y="552" fill={C.mint} fontSize="22" textAnchor="middle" fontFamily="Archivo">{String(n).padStart(2,'0')}</text><text x="1750" y="552" fill={C.gold} fontSize="22" textAnchor="middle" fontFamily="Archivo">{Math.floor(scene.start/60)}:{String(Math.floor(scene.start%60)).padStart(2,'0')}</text></g>
    <rect x="70" y="890" width="1780" height="132" rx="20" fill="#041219" opacity=".96" stroke={C.teal} strokeWidth="3"/>
    <text x="960" y="946" fill={C.white} fontSize={overlayFont} textAnchor="middle" fontFamily="Archivo" fontWeight="700">{overlayText}</text>
    <text x="960" y="990" fill={C.gold} fontSize="18" textAnchor="middle" fontFamily="Archivo">SUBTITLE AKAN DISINKRONKAN KE VO · FRAME PREVIEW DESAIN</text>
    <text x="78" y="1055" fill={C.mint} fontSize="17" fontFamily="Archivo">ILUSTRASI REMOTION · TIDAK MENGGAMBARKAN TOKOH ATAU PERISTIWA NYATA</text>
    <text x="1842" y="1055" fill={C.mint} fontSize="17" textAnchor="end" fontFamily="Archivo">1920 × 1080 · 16:9</text>
  </svg>;
}
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const resvg=(el:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(el),{font:{fontFiles:[path.join(root,'assets/fonts/archivo-latin-700-normal.ttf')],loadSystemFonts:false,defaultFontFamily:'Archivo'}}).render().asPng());
  const indices=Array.from({length:timeline.scenes.length},(_,i)=>i+1);
  for(const n of indices){
    const s=timeline.scenes[n-1], t=(s.end-s.start)*.54;
    fs.writeFileSync(path.join(out,`design-sc${String(n).padStart(2,'0')}.png`),resvg(<Frame n={n} t={t}/>));
  }
  console.log(JSON.stringify({previewFrames:indices.length,scenes:timeline.scenes.length,frames:indices.map(n=>`design-sc${String(n).padStart(2,'0')}.png`)}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
