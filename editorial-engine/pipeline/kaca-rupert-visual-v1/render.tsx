/* Visual V1: a single glass prop persists and transforms across one timeline.
 * Safety illustrations and stress colors are schematic, not experiment video. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';import path from 'node:path';
import {Host,RigDefs} from '../awan-rig-v2/rig';
import {pose} from '../awan-rig-v2/poses.mjs';
import {wristWorld} from '../awan-rig-v2/rig-math.mjs';
import {step,lerp,hammer,crackPath,shard} from './motion.mjs';

const root=process.cwd(),D=path.join(root,'deliverables/kaca-rupert-visual-v1');
const d=JSON.parse(fs.readFileSync(path.join(D,'prepared.json'),'utf8'));
const {timeline,cues,duration,fps}=d;
const art=Object.fromEntries(Object.entries(d.art).map(([k,v]:[string,any])=>[k,'data:image/jpeg;base64,'+fs.readFileSync(v.render).toString('base64')]));
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const C={ink:'#101929',navy:'#13182d',white:'#fff4df',gold:'#ffc56b',aqua:'#8ce8ed',amber:'#ff9270',violet:'#574b80'};
const GLASS='M67 -102 C90 -94 105 -52 137 -36 C186 -17 267 -23 345 -24 C269 -24 183 -4 139 8 C105 19 89 68 63 90 C22 131 -54 126 -102 62 C-154 -2 -125 -93 -54 -115 C0 -135 47 -125 67 -102 Z';
const INNER='M50 -80 C74 -70 87 -37 125 -22 C177 -10 243 -23 310 -24 C248 -22 177 -4 123 0 C87 12 65 52 50 70 C15 98 -42 98 -77 46 C-112 -1 -91 -75 -37 -88 C4 -101 36 -98 50 -80 Z';
function Defs(){return <defs><RigDefs/>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dcffff" stopOpacity=".84"/><stop offset=".23" stopColor="#70d8e6" stopOpacity=".44"/><stop offset=".63" stopColor="#1b7290" stopOpacity=".57"/><stop offset="1" stopColor="#d6ffff" stopOpacity=".84"/></linearGradient>
 <radialGradient id="hotcore"><stop stopColor="#ffd17c"/><stop offset=".66" stopColor="#fa8057"/><stop offset="1" stopColor="#9f4871"/></radialGradient>
 <linearGradient id="shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4ffff"/><stop offset=".5" stopColor="#79d7e8"/><stop offset="1" stopColor="#4484b7"/></linearGradient>
 <linearGradient id="wood" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#9c684a"/><stop offset="1" stopColor="#58372d"/></linearGradient>
 <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f5dcc1"/><stop offset=".5" stopColor="#8093a5"/><stop offset="1" stopColor="#2d405a"/></linearGradient>
 <clipPath id="windowClip"><rect x="408" y="608" width="625" height="535" rx="35"/></clipPath>
 </defs>}
const Txt=({x,y,size=38,fill=C.white,anchor='start',hand=false,children}:{x:number;y:number;size?:number;fill?:string;anchor?:'start'|'middle'|'end';hand?:boolean;children:string})=><text x={x} y={y} fontSize={size} fill={fill} fontFamily={hand?'Permanent Marker':'Archivo SemiBold'} fontWeight={hand?400:700} textAnchor={anchor}>{children}</text>;
function Bg({name,t,dim=.16}:{name:string;t:number;dim?:number}){const z=1+Math.min(t,8)*.003;return <g><rect width="1080" height="1920" fill={C.navy}/><g transform={`translate(540 950) scale(${z}) translate(-540 -950)`}><image href={art[name]} width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/></g><rect width="1080" height="1920" fill={C.navy} opacity={dim}/><rect width="1080" height="443" fill={C.navy} opacity=".82"/></g>}
const Brand=()=><g><circle cx="78" cy="112" r="8" fill={C.aqua}/><Txt x={98} y={121} size={23}>DUNIA KEBALIK / KNOT THEORY</Txt></g>;
const Title=({a,b,tag}:{a:string;b:string;tag:string})=><g><Brand/><Txt x={68} y={232} size={75} hand>{a}</Txt><Txt x={68} y={324} size={75} hand fill={C.gold}>{b}</Txt><Txt x={72} y={395} size={30} fill={C.aqua}>{tag}</Txt></g>;
const Label=({x,y,w,text,color=C.aqua}:{x:number;y:number;w:number;text:string;color?:string})=><g><rect x={x} y={y-36} width={w} height="52" rx="12" fill={C.navy} stroke={color} strokeWidth="3"/><Txt x={x+w/2} y={y} size={25} anchor="middle" fill={C.white}>{text}</Txt></g>;
const Safety=({y=1385}:{y?:number})=><g><rect x="576" y={y-36} width="440" height="51" rx="11" fill={C.navy} opacity=".95"/><Txt x={796} y={y} size={23} anchor="middle">ILUSTRASI · JANGAN DITIRU</Txt></g>;
const Cue=({time}:{time:number})=>{const q=cues.find((v:any)=>time>=v.start&&time<v.end);if(!q)return null;const two=q.lines.length===2;return <g><rect x="80" y={two?1490:1513} width="855" height={two?155:105} rx="20" fill="#090e1d" opacity=".96"/>{q.lines.map((v:string,i:number)=><Txt key={i} x={507} y={(two?1548:1579)+i*57} size={40} anchor="middle" fill="#fff">{v}</Txt>)}</g>};

// Same hand-drawn silhouette is reused in every story scene. Head is left,
// elongated taper is the tail. Color overlays represent stress, not reality.
function Glass({x,y,s=1,t=0,mode='glass',crack=0,opacity=1}:{x:number;y:number;s?:number;t?:number;mode?:'glass'|'cool'|'stress';crack?:number;opacity?:number}){
 const cool=step(t,.2,2.1), core=step(t,2.4,4.5), reveal=mode==='cool'?step(t,.25,1.3):1;
 return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
  <path d={GLASS} fill="url(#glass)" stroke="#d4ffff" strokeWidth="7" strokeLinejoin="round"/>
  {(mode==='cool'||mode==='stress')&&<g opacity={reveal}>
    <path d={GLASS} fill="url(#shell)" opacity={mode==='cool'?.22+.36*cool:.50}/>
    <path d={INNER} transform={mode==='stress'?`scale(${1-.05*step(t,.1,1.6)})`:undefined} fill="url(#hotcore)" opacity={mode==='cool'?.92-.42*core:.78}/>
    <path d={GLASS} fill="none" stroke="#97eafa" strokeWidth="17" opacity=".8"/>
  </g>}
  <path d="M-94-58 Q-65-110-7-112 M-110-8 Q-112 31-91 56 M72-88 Q158-28 310-25" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".65"/>
  <ellipse cx="-53" cy="-72" rx="15" ry="8" fill="#fff" opacity=".7" transform="rotate(-33 -53 -72)"/>
  {crack>0&&<path d={crackPath(crack)} fill="none" stroke="#fff8d6" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>}
 </g>
}
function Fragments({x,y,s,p}:{x:number;y:number;s:number;p:number}){return <g transform={`translate(${x} ${y}) scale(${s})`}>
 {Array.from({length:26},(_,i)=>{const q=shard(i,p),k=10+(i*13)%20;return <g key={i} transform={`translate(${q.x} ${q.y}) rotate(${q.rotation})`} opacity={q.opacity}><path d={`M${-k} ${-k*.35} L${k*.65} ${-k} L${k} ${k*.45} L${-k*.5} ${k*.8} Z`} fill={i%3===0?'#d8ffff':'#63cddd'} stroke="#f0ffff" strokeWidth="3"/></g>})}</g>}
function Shield(){return <g><rect x="408" y="608" width="625" height="535" rx="35" fill="#d3faff" fillOpacity=".045" stroke="#b6d8ec" strokeOpacity=".65" strokeWidth="7"/><path d="M445 648 L516 648 M449 672 L477 672 M985 1066 L985 1101 L944 1101" fill="none" stroke="#e7ffff" strokeWidth="7" opacity=".43"/><rect x="420" y="1090" width="600" height="42" rx="14" fill="#1d2639" opacity=".7"/></g>}
function Mallet({p,t,swing=1}:{p:any;t:number;swing?:number}){const w=wristWorld(p),target=[535,735],h=hammer(w,target,swing);return <g>
 <path d={`M${w[0]} ${w[1]} L${h.x} ${h.y}`} fill="none" stroke="#3e2630" strokeWidth="34" strokeLinecap="round"/><path d={`M${w[0]} ${w[1]} L${h.x} ${h.y}`} fill="none" stroke="url(#wood)" strokeWidth="23" strokeLinecap="round"/>
 <g transform={`translate(${h.x} ${h.y}) rotate(${h.angle})`}><rect x="-29" y="-55" width="58" height="110" rx="12" fill="url(#metal)" stroke="#28334a" strokeWidth="7"/><path d="M-22-42 H20 M-22 42 H20" stroke="#fff8e8" strokeWidth="5" opacity=".6"/></g>
 </g>}
function Arrow({x,y,dx,dy,color=C.aqua}:{x:number;y:number;dx:number;dy:number;color?:string}){const a=Math.atan2(dy,dx),ex=x+dx,ey=y+dy;return <g><line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth="10" strokeLinecap="round"/><path d={`M${ex-22*Math.cos(a-.55)} ${ey-22*Math.sin(a-.55)} L${ex} ${ey} L${ex-22*Math.cos(a+.55)} ${ey-22*Math.sin(a+.55)}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/></g>}
function HostAt({p,frame}:{p:any;frame:number}){return <Host {...p} frame={frame} talk gripR/>}
function ImpactShot({t,frame,mode}:{t:number;frame:number;mode:'preview'|'resist'|'release'}){
 const p:any=pose(mode==='release'?0:1,t);p.x=205;p.y=748;p.scale=.72;p.right=[250,205+12*Math.sin(t*1.1)];
 const swing=mode==='preview'?(t<.68?step(t,.12,.68):1-.42*step(t,.88,1.5)):mode==='resist'?(t<.95?step(t,.15,.95):1-.42*step(t,1.2,1.9)):.58;
 const crack=mode==='preview'?.17*step(t,2.0,2.6):mode==='release'?step(t,1.1,3.0):0;
 const burst=mode==='release'?step(t,2.9,4.25):0;
 return <><Bg name="ruang-lab" t={t}/><Title a={mode==='preview'?'KACA vs PALU':mode==='resist'?'PALU MEMANTUL':'EKORNYA PATAH'} b={mode==='preview'?'KOK BISA?':mode==='resist'?'TAPI ADA BATAS':'RETAK MENJALAR'} tag={mode==='preview'?'SATU BENDA, DUA KEJUTAN':mode==='resist'?'PUKULAN TERTENTU':'ADEGAN PUNCAK · SKEMA'}/>
 <rect x="424" y="985" width="585" height="46" rx="12" fill="#403e52" stroke="#8995ae" strokeWidth="6"/>
 <g clipPath="url(#windowClip)"><Glass x={606} y={859} s={1.02} t={t} crack={crack} opacity={1-step(burst,.02,.22)}/>{burst>0&&<Fragments x={606} y={859} s={1.02} p={burst}/>}</g>
 <Mallet p={p} t={t} swing={swing}/><Shield/><HostAt p={p} frame={frame}/>
 {mode==='resist'&&<g opacity={step(t,.7,1.3)}><Label x={665} y={1217} w={315} text="TIDAK KEBAL SEMUA" color={C.gold}/></g>}
 <Safety/>
 </>
}
function Scene({i,t,frame}:{i:number;t:number;frame:number}){
 const p:any=pose([1,2,1,0,3,4,5,1,2,0,6,8][i],t);p.x=205;p.y=750;p.scale=.70;
 if(i===0)return <ImpactShot t={t} frame={frame} mode="preview"/>;
 if(i===2)return <ImpactShot t={t} frame={frame} mode="resist"/>;
 if(i===3)return <ImpactShot t={t} frame={frame} mode="release"/>;
 if(i===1){const a=step(t,.3,1.2),b=step(t,1.2,2.2);return <><Bg name="ruang-lab" t={t}/><Title a="MIRIP KECEBONG" b="TAPI INI KACA" tag="KEPALA BULAT · EKOR TIPIS"/>
  <Glass x={605} y={865+8*Math.sin(t*.7)} s={1.05} t={t}/><g opacity={a}><path d="M548 723 L505 650" stroke={C.aqua} strokeWidth="7"/><Label x={424} y={636} w={200} text="KEPALA"/></g><g opacity={b}><path d="M889 858 L940 790" stroke={C.gold} strokeWidth="7"/><Label x={830} y={775} w={180} text="EKOR" color={C.gold}/></g><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===4){const re=step(t,.1,1.8);return <><Bg name="ruang-lab" t={t}/><Title a="SATU KACA" b="DUA SIFAT" tag="TETES PANGERAN RUPERT"/>
  <g opacity={1-re}><Fragments x={606} y={860} s={1} p={1-re}/></g><Glass x={606} y={860} s={1.02} t={t} opacity={re}/>
  <g opacity={step(t,1.3,2.1)}><Label x={452} y={681} w={190} text="KUAT" color={C.aqua}/><Label x={815} y={681} w={190} text="RAPUH" color={C.gold}/></g><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===5){return <><Bg name="dalam-kaca" t={t} dim={.18}/><Title a="LUAR MENDINGIN" b="LEBIH DULU" tag="PENAMPANG / ILUSTRASI"/>
  <Glass x={600} y={875} s={1.13} t={t} mode="cool"/><Arrow x={462} y={640} dx={55} dy={112}/><Arrow x={641} y={627} dx={-14} dy={112}/>
  <g opacity={step(t,.5,1.5)}><Label x={425} y={1206} w={255} text="LUAR: DINGIN"/><Label x={705} y={1206} w={300} text="DALAM: MASIH PANAS" color={C.amber}/></g><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===6){const a=step(t,.5,1.9),b=step(t,2.0,3.2);return <><Bg name="dalam-kaca" t={t} dim={.18}/><Title a="TEKAN DI LUAR" b="TARIK DI DALAM" tag="TEGANGAN TERKUNCI · SKEMA"/>
  <Glass x={590} y={875} s={1.12} t={t} mode="stress"/>
  <g opacity={a}><Arrow x={590} y={615} dx={0} dy={105}/><Arrow x={441} y={858} dx={65} dy={0}/><Label x={440} y={1230} w={218} text="TEKAN"/></g>
  <g opacity={b}><Arrow x={590} y={854} dx={60} dy={-40} color={C.amber}/><Arrow x={590} y={854} dx={-54} dy={46} color={C.amber}/><Label x={700} y={1230} w={218} text="TARIK" color={C.amber}/></g><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===7){const swing=t<1.3?step(t,.35,1.3):1-.4*step(t,1.6,2.2);return <><Bg name="dalam-kaca" t={t}/><Title a="KEPALA BERTAHAN" b="KARENA TEKANAN" tag="RETAK SULIT MASUK · SKEMA"/>
  <Glass x={606} y={859} s={1.02} t={t} mode="stress"/><Mallet p={p} t={t} swing={swing}/><path d="M520 750 Q475 792 477 852" fill="none" stroke={C.gold} strokeWidth="9" strokeLinecap="round" opacity={step(t,1,2)}/><Shield/><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===8){const crack=step(t,.65,3.6);return <><Bg name="dalam-kaca" t={t}/><Title a="EKORNYA TIPIS" b="RETAK MASUK" tag="DARI EKOR MENUJU INTI"/>
  <Glass x={606} y={859} s={1.02} t={t} mode="stress" crack={crack}/><g opacity={step(t,.3,1)}><Arrow x={972} y={750} dx={-36} dy={75} color={C.gold}/><Label x={765} y={724} w={215} text="MULAI DI EKOR" color={C.gold}/></g><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===9){const crack=step(t,.15,2.1),burst=step(t,2.0,3.5);return <><Bg name="ruang-lab" t={t}/><Title a="RETAK MELAJU" b="KACA REMUK" tag="ANIMASI DIPERLAMBAT / SKEMA"/>
  <g clipPath="url(#windowClip)"><Glass x={606} y={859} s={1.02} t={t} crack={crack} opacity={1-step(burst,.02,.22)}/>{burst>0&&<Fragments x={606} y={859} s={1.02} p={burst}/>}</g><Shield/><HostAt p={p} frame={frame}/><Safety/></>}
 if(i===10){const a=step(t,.2,1.0),b=step(t,1.2,2.0);return <><Bg name="ruang-lab" t={t}/><Title a="BUKAN SULAP" b="SATU TEGANGAN" tag="KEPALA KUAT, EKOR RAPUH"/>
  <Glass x={606} y={859} s={1.02} t={t} crack={.13*b}/><g opacity={a}><Label x={450} y={690} w={205} text="KEPALA"/><Arrow x={540} y={735} dx={22} dy={45}/></g><g opacity={b}><Label x={795} y={690} w={180} text="EKOR" color={C.gold}/><Arrow x={885} y={735} dx={35} dy={60} color={C.gold}/></g><HostAt p={p} frame={frame}/><Safety/></>}
 const a=step(t,.2,1.1),cta=step(t,2.4,3.3);return <><Bg name="ruang-lab" t={t}/><Title a="KAMU KAGET" b="YANG MANA?" tag="KEPALA ATAU EKOR?"/>
  <Glass x={606} y={810+6*Math.sin(t*.8)} s={.92} t={t}/><g opacity={a}><Label x={435} y={1100} w={245} text="KEPALA KUAT"/><Label x={730} y={1100} w={245} text="EKOR RAPUH" color={C.gold}/></g><HostAt p={p} frame={frame}/><g opacity={cta}><rect x="290" y="1280" width="500" height="88" rx="44" fill={C.gold}/><Txt x={540} y={1338} size={45} anchor="middle" fill={C.navy}>ikuti knot theory</Txt></g><Safety y={1435}/></>
}
function Artwork({time}:{time:number}){let i=timeline.findIndex((v:any)=>time>=v.start&&time<v.end);if(i<0)i=timeline.length-1;const t=Math.max(0,time-timeline[i].start);return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><Defs/><Scene i={i} t={t} frame={Math.round(t*fps)}/><Cue time={time}/></svg>}
function Thumbnail(){const p:any=pose(0,1);p.x=220;p.y=760;p.scale=.76;return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><Defs/><Bg name="ruang-lab" t={0} dim={.22}/><Brand/><Txt x={64} y={240} size={88} hand>KACA TAHAN</Txt><Txt x={64} y={348} size={88} hand fill={C.gold}>PALU KECIL?</Txt><Txt x={68} y={416} size={31} fill={C.aqua}>TAPI EKORNYA BISA MENGHANCURKAN</Txt><Glass x={600} y={885} s={1.10} t={1} crack={.24}/><Mallet p={p} t={1} swing={1}/><Shield/><HostAt p={p} frame={30}/><rect x="470" y="1240" width="495" height="86" rx="18" fill={C.gold}/><Txt x={718} y={1297} size={39} anchor="middle" fill={C.navy}>KOK BISA?</Txt><Safety y={1430}/></svg>}
function Poster(){const p:any=pose(0,1);p.x=190;p.y=600;p.scale=.68;return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><Defs/><rect width="1080" height="1350" fill={C.navy}/><circle cx="690" cy="650" r="400" fill="#45335e"/><Brand/><Txt x={65} y={235} size={82} hand>KACA TAHAN</Txt><Txt x={65} y={335} size={82} hand fill={C.gold}>PALU KECIL?</Txt><Txt x={68} y={405} size={31} fill={C.aqua}>EKORNYA BISA MEMBUATNYA REMUK</Txt><Glass x={610} y={720} s={1.02} t={1} crack={.26}/><Mallet p={p} t={1} swing={1}/><HostAt p={p} frame={30}/><Safety y={1270}/></svg>}
const raster=(el:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(el),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());
const png=(t:number)=>raster(<Artwork time={t}/>);
async function main(){
 if(process.argv.includes('--stills')){
  const times=[0,.7,1.7,2.6,2.8,...timeline.slice(1).flatMap((s:any)=>[s.start+(s.end-s.start)*.25,s.start+(s.end-s.start)*.65]),duration-.2];
  times.forEach((t:number,i:number)=>fs.writeFileSync(path.join(D,`qa-sample-${String(i).padStart(2,'0')}.png`),png(t)));
  fs.writeFileSync(path.join(D,'kaca-rupert-thumbnail.png'),raster(<Thumbnail/>));fs.writeFileSync(path.join(D,'kaca-rupert-poster-4x5.png'),raster(<Poster/>));console.log(JSON.stringify({times}));return;
 }
 if(process.argv.includes('--still-zero')){fs.writeFileSync(path.join(D,'qa-sample-00.png'),png(0));fs.writeFileSync(path.join(D,'kaca-rupert-thumbnail.png'),raster(<Thumbnail/>));fs.writeFileSync(path.join(D,'kaca-rupert-poster-4x5.png'),raster(<Poster/>));return;}
 const ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),idx=process.argv.indexOf('--chunk');
 if(idx>=0){const first=Number(process.argv[idx+1]),end=Number(process.argv[idx+2]),out=path.join(D,process.argv[idx+3]);
  if(!Number.isInteger(first)||!Number.isInteger(end)||first<0||end>Math.round(duration*fps)||first>=end)throw new Error('Invalid frame chunk');
  const args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-vsync','0','-video_track_timescale','90000',out];
  const log=fs.createWriteStream(out+'.log'),child=spawn(ff,args,{stdio:['pipe','ignore','pipe']});child.stderr.pipe(log);child.on('error',e=>console.error(e));
  for(let f=first;f<end;f++){if(!child.stdin.write(png(f/fps)))await once(child.stdin,'drain');if((f-first)%150===0)console.log(`chunk ${first}: frame ${f}/${end}`)}
  child.stdin.end();const [code]=await once(child,'close');if(code!==0)throw new Error(`FFmpeg chunk exit ${code}`);console.log(`chunk ${first}: complete`);return;
 }
 if(process.argv.includes('--assemble')){const parts=['part-0.mp4','part-1.mp4'];for(const part of parts)if(!fs.existsSync(path.join(D,part)))throw new Error(`Missing ${part}`);
  const concat=path.join(D,'chunks.txt'),split=Math.floor(Math.round(duration*fps)/2);fs.writeFileSync(concat,`file '${parts[0]}'\nduration ${(split/fps).toFixed(9)}\nfile '${parts[1]}'\n`);
  const out=path.join(D,'kaca-rupert-visual-v1.mp4'),args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',d.narration,'-i',d.score,'-filter_complex','[1:a]volume=1.8[v];[2:a]volume=0.18[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-3.5:LRA=11[a]','-map','0:v:0','-map','[a]','-t',String(duration),'-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out];const r=spawnSync(ff,args,{stdio:'inherit'});if(r.status!==0)throw new Error(`Assembly exit ${r.status}`);console.log(`Rendered ${out}`);return;}
 throw new Error('Use --stills, --still-zero, --chunk START END NAME, or --assemble');
}
main().catch(e=>{console.error(e);process.exitCode=1});
