/* Awan V3: one global frame clock, genuine shared peak shot, private render.
 * Imports the V2 rig and reusable props read-only; never mutates V2. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import {Host,RigDefs} from '../awan-rig-v2/rig';
import {pose} from '../awan-rig-v2/poses.mjs';
import {ease,wristWorld,risingDroplet} from '../awan-rig-v2/rig-math.mjs';
import {PropDefs,Cloud,Drop,Tank,Cube,LoupeAtGrip,Fan,UmbrellaAtGrip,AirArrow} from '../awan-rig-v2/props';

const root=process.cwd(), D=path.join(root,'deliverables/awan-rig-v3');
const d=JSON.parse(fs.readFileSync(path.join(D,'prepared.json'),'utf8'));
const {timeline,cues,duration,fps}=d;
const art=Object.fromEntries(Object.entries(d.art).map(([k,v]:[string,any])=>[k,'data:image/jpeg;base64,'+fs.readFileSync(v.render).toString('base64')]));
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const C={deep:'#0d2b32',ink:'#173a38',cream:'#fff4df',gold:'#f6c579',mint:'#bfdfca',rust:'#c46c4d'};
const step=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const T=({x,y,size=38,fill=C.cream,anchor='start',hand=false,children}:{x:number;y:number;size?:number;fill?:string;anchor?:'start'|'middle'|'end';hand?:boolean;children:string})=><text x={x} y={y} fontSize={size} fill={fill} fontFamily={hand?'Permanent Marker':'Archivo SemiBold'} fontWeight={hand?400:700} textAnchor={anchor}>{children}</text>;
const Bg=({name,t,dark=.2}:{name:string;t:number;dark?:number})=><g><rect width="1080" height="1920" fill={C.deep}/><g transform={`translate(540 920) scale(${1+Math.min(9,t)*.002}) translate(-540 -920)`}><image href={art[name]} width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/></g><rect width="1080" height="1920" fill={C.deep} opacity={dark}/><rect width="1080" height="455" fill={C.deep} opacity=".72"/></g>;
const Brand=()=><g><circle cx="80" cy="115" r="8" fill={C.gold}/><T x={100} y={124} size={23}>DUNIA KEBALIK / KNOT THEORY</T></g>;
const Title=({a,b,tag}:{a:string;b:string;tag?:string})=><g><Brand/><T x={72} y={239} size={77} hand>{a}</T><T x={72} y={332} size={77} hand fill={C.gold}>{b}</T>{tag&&<T x={76} y={402} size={32} fill={C.mint}>{tag}</T>}</g>;
const Small=({text,x,y=1420}:{text:string;x?:number;y?:number})=>{const width=Math.min(920,Math.max(190,text.length*16+34)),left=x??Math.max(50,1005-width);return <g><rect x={left} y={y-37} width={width} height="52" rx="10" fill={C.deep} opacity=".94"/><T x={left+15} y={y} size={28}>{text}</T></g>};
const Cue=({time}:{time:number})=>{const q=cues.find((v:any)=>time>=v.start&&time<v.end);if(!q)return null;const two=q.lines.length===2;return <g><rect x="80" y={two?1490:1510} width="850" height={two?160:108} rx="20" fill="#07191f" opacity=".94"/>{q.lines.map((v:string,i:number)=><T key={i} x={505} y={(two?1549:1578)+i*57} size={41} anchor="middle" fill="#fff">{v}</T>)}</g>};
const Bubble=({x,y,w,h}:{x:number;y:number;w:number;h:number})=><path d={`M${x+35} ${y} H${x+w-35} Q${x+w} ${y} ${x+w} ${y+35} V${y+h-35} Q${x+w} ${y+h} ${x+w-35} ${y+h} H${x+140} L${x+80} ${y+h+65} L${x+96} ${y+h} H${x+35} Q${x} ${y+h} ${x} ${y+h-35} V${y+35} Q${x} ${y} ${x+35} ${y}Z`} fill="#fff7e6" fillOpacity=".96" stroke={C.ink} strokeWidth="7"/>;
const Specks=({x,y,t,n=13,spread=1}:{x:number;y:number;t:number;n?:number;spread?:number})=><g>{Array.from({length:n},(_,i)=>{const dx=((i*97)%420-210)*spread,dy=((i*79)%250-125)*spread+7*Math.sin(t*1.3+i);return <Drop key={i} x={x+dx} y={y+dy} s={.14+(i%3)*.025}/>})}</g>;
const RisingSpecks=({t}:{t:number})=><g>{Array.from({length:9},(_,i)=>{const p=risingDroplet(t,i);return <Drop key={i} x={p.x} y={p.y} s={.14+(i%3)*.025} opacity={p.opacity}/>})}</g>;

// This SAME cloud/hand/lens layout is used for the opening and the return.
// Opening shows a partial reveal; S04 resumes the same reveal to completion.
const PeakLoupe=({progress,t}:{progress:number;t:number})=><g>
 <path d="M0 0 L94-80" stroke="#5f4533" strokeWidth="38" strokeLinecap="round"/><path d="M3-4 L96-85" stroke="url(#metalV2)" strokeWidth="24" strokeLinecap="round"/>
 <circle cx="206" cy="-188" r="155" fill="#18484f" fillOpacity=".92" stroke={C.ink} strokeWidth="24"/><circle cx="206" cy="-188" r="147" fill="none" stroke="url(#metalV2)" strokeWidth="19"/>
 {Array.from({length:9},(_,n)=>{const opacity=Math.max(0,Math.min(1,(progress-n*.10)*4));return <Drop key={n} x={110+(n*79)%190} y={-290+(n*53)%185+3*Math.sin(t+n)} s={.15+(n%3)*.025} opacity={opacity}/>})}
 <path d="M100-225 Q110-290 164-314" fill="none" stroke="#f9fff6" strokeWidth="8" strokeLinecap="round" opacity=".35"/>
 </g>;
function PeakShot({t,frame,preview}:{t:number;frame:number;preview:boolean}){
 const progress=preview ? .16+.29*step(t,.2,2.7) : .45+.55*step(t,0,3.3);
 // Keeping pose nearly identical at first frame of the return makes the callback recognisable.
 const pt=preview?Math.min(t,2.7):Math.min(2.7+t*.45,4.0);
 const p:any=pose(5,pt);
 p.right=[220+25*step(pt,0,2.7),245+16*Math.cos(pt*.7)];
 p.lean=-2+4*step(pt,0,2.7); p.head=-5+5*step(pt,0,2.7);
 const spread=.25+.75*progress;
 return <><Bg name="rooftop" t={pt} dark={.29}/><Title a={preview?'500 TON AIR?':'LIHAT DEKAT'} b={preview?'KOK MELAYANG?':'BUKAN TANGKI'} tag={preview?'PERKIRAAN AIR · SATU CONTOH':'TAHAP PERBESARAN · ILUSTRASI'}/>
  <g opacity={1-.55*progress}><Cloud x={710} y={875} s={.96}/></g>
  <g>{Array.from({length:13},(_,n)=>{const dx=((n*97)%410)-205,dy=((n*71)%310)-155;const op=step(progress,.04+n*.025,.20+n*.025);return <Drop key={n} x={710+dx*spread} y={875+dy*spread} s={.13+.18*progress} opacity={op}/>})}</g>
  <g opacity={preview?0:1-step(t,.6,2.5)}><Tank x={886} y={900} s={.29} opacity={.35}/></g>
  <Host {...p} frame={frame} gripR talk rightAccessory={<PeakLoupe progress={progress} t={pt}/>}/>
  <Small text={preview?'AIR / CONTOH USGS':'TETESAN DIPERBESAR'} />
 </>;
}
function Scene({i,t,frame}:{i:number;t:number;frame:number}){
 const p:any=pose([5,1,2,5,5,6,2,3,7,8][i],t),w:number[]=wristWorld(p);
 const a=step(t,.15,1.4),b=step(t,1.2,3.8);
 if(i===0)return <PeakShot t={t} frame={frame} preview/>;
 if(i===1){const grow=.72+.12*a;return <><Bg name="rooftop" t={t} dark={.34}/><Title a="KITA BAYANGKAN" b="TANGKI RAKSASA" tag="JIKA AIR DIKUMPULKAN"/><Bubble x={472} y={510} w={492} h={600}/><Tank x={720} y={805} s={grow}/><Drop x={850} y={970} s={.14}/><path d={`M${w[0]} ${w[1]} L486 1035`} fill="none" stroke={C.gold} strokeWidth="9" strokeLinecap="round"/><Host {...p} frame={frame} talk/><Small text="TANGKI = BAYANGAN"/></>}
 if(i===2){return <><Bg name="rooftop" t={t} dark={.32}/><Title a="TUNGGU DULU" b="SATU CONTOH" tag="BUKAN BERAT SETIAP AWAN"/><Cloud x={742} y={695} s={.64}/><Cube x={718} y={890} s={.72} angle={-5+8*b}/><rect x="508" y="1070" width="405" height="124" rx="19" fill="url(#cardV2)" stroke={C.ink} strokeWidth="7"/><T x={710} y={1120} size={31} fill={C.ink} anchor="middle">HITUNGAN USGS</T><T x={710} y={1165} size={31} fill={C.rust} anchor="middle">SATU CONTOH</T><path d={`M${w[0]} ${w[1]} Q460 1070 515 1100`} fill="none" stroke={C.gold} strokeWidth="9"/><Host {...p} frame={frame} gripR talk/><Small text="PERKIRAAN / BUKAN UKURAN LANGSUNG"/></>}
 if(i===3)return <PeakShot t={t} frame={frame} preview={false}/>;
 if(i===4){return <><Bg name="microcloud" t={t} dark={.18}/><Title a="GRAVITASI" b="TETAP BEKERJA" tag="TETES KECIL TURUN PELAN"/><Host {...p} frame={frame} gripR talk rightAccessory={<LoupeAtGrip time={t}/>}/><path d="M865 725 V960 M835 930 L865 960 L895 930" fill="none" stroke={C.gold} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/><T x={725} y={1190} size={32} fill={C.mint} anchor="middle">DI UDARA TENANG</T><Small text="PERBESARAN / TIDAK BERSKALA"/></>}
 if(i===5){const spin=step(t,.35,1.5);return <><Bg name="rooftop" t={t} dark={.35}/><Title a="UDARA NAIK" b="TETES TERBAWA" tag="SALAH SATU BAGIAN MEKANISMENYA"/><Cloud x={720} y={615} s={.70}/><Fan x={705} y={1140} s={.82} frame={frame*spin}/><path d={`M${w[0]} ${w[1]} Q505 1170 620 1180`} fill="none" stroke={C.ink} strokeWidth="10"/><rect x="430" y="1077" width="90" height="64" rx="15" fill="url(#cardV2)" stroke={C.ink} strokeWidth="7"/><circle cx="475" cy="1108" r="16" fill={spin>.5?C.gold:C.rust} stroke={C.ink} strokeWidth="5"/>{[0,1,2].map(n=><g key={n} opacity={spin}><AirArrow x={575+n*142} y={1020-((t*80+n*60)%280)} s={.55}/></g>)}<g opacity={spin}><RisingSpecks t={t}/></g><Host {...p} frame={frame} gripR talk/><Small text="KIPAS = MODEL ARUS NAIK"/></>}
 if(i===6){return <><Bg name="microcloud" t={t} dark={.28}/><Title a="COBA HITUNG" b="CONTOH USGS" tag="UKURAN DAN KADAR AIR"/><Cube x={680} y={755} s={.96} angle={-4+7*b}/><Cloud x={680} y={705} s={.40}/><path d={`M${w[0]} ${w[1]} Q425 1000 505 900`} fill="none" stroke={C.gold} strokeWidth="9"/><rect x="495" y="1030" width="400" height="192" rx="22" fill="url(#cardV2)" stroke={C.ink} strokeWidth="7"/><Drop x={565} y={1120} s={.65}/><T x={730} y={1096} size={41} fill={C.ink} anchor="middle">1 km³</T><T x={730} y={1158} size={32} fill={C.ink} anchor="middle">1 m³ = 0,5 g air</T><Host {...p} frame={frame} gripR talk/><Small text="ASUMSI CONTOH / TIDAK BERSKALA"/></>}
 if(i===7){const pop=step(t,.3,2.6);return <><Bg name="rooftop" t={t} dark={.38}/><Title a="HASIL HITUNGAN" b="AIRNYA SAJA" tag="BUKAN MASSA SEMUA AWAN"/><g transform={`translate(0 ${30*(1-pop)})`}><rect x="466" y="570" width="490" height="560" rx="27" fill="url(#cardV2)" stroke={C.ink} strokeWidth="8"/><path d="M500 680 H920 M500 850 H920" stroke="#a98968" strokeWidth="6" opacity=".55"/><T x={710} y={650} size={40} fill={C.ink} anchor="middle">1 km³ × 0,5 g/m³</T><T x={710} y={790} size={39} fill={C.ink} anchor="middle">500.000 kg air</T><T x={710} y={966} size={62} fill={C.rust} anchor="middle">500 TON</T><T x={710} y={1040} size={28} fill={C.ink} anchor="middle">SATU CONTOH</T></g><path d={`M${w[0]} ${w[1]} Q460 1100 477 1068`} fill="none" stroke={C.gold} strokeWidth="10"/><Host {...p} frame={frame} gripR talk/><Small text="MASSA AIR / UDARA TIDAK DIHITUNG"/></>}
 if(i===8){const merge=step(t,.4,2.3),fall=step(t,2.4,5.0);return <><Bg name="rainstreet" t={t} dark={.35}/><Title a="KALAU MEMBESAR?" b="BISA JADI HUJAN" tag="SEBAGIAN TETES BERGABUNG"/><Cloud x={710} y={620} s={.72}/><Drop x={640+55*merge} y={820} s={.38} opacity={1-.85*merge}/><Drop x={760-55*merge} y={820} s={.38} opacity={1-.85*merge}/><Drop x={700} y={825+310*fall} s={.35+.55*merge}/><ellipse cx="710" cy="1210" rx="175" ry="38" fill="url(#waterV2)" stroke={C.ink} strokeWidth="7"/><ellipse cx="710" cy="1210" rx={45+75*fall} ry={10+8*fall} fill="none" stroke={C.cream} strokeWidth="5" opacity={fall}/><Host {...p} frame={frame} gripR talk rightAccessory={<UmbrellaAtGrip open={step(t,.2,1.5)}/>}/><Small text="PROSES HUJAN HANGAT / SKEMA"/></>}
 const question=step(t,5.2,6.4),cta=step(t,8.65,9.25),reveal=step(t,.2,2.3);
 return <><Bg name="rainstreet" t={t} dark={.30}/><Title a="BUKAN TANGKI" b="TERBANG" tag="BANYAK TETES, UDARA BERGERAK"/><g opacity={1-question}><Tank x={610} y={750} s={.52} opacity={.60*(1-reveal)}/><path d="M750 735 H815 M798 715 L820 735 L798 755" fill="none" stroke={C.gold} strokeWidth="10"/><g opacity={reveal}><Cloud x={850} y={755} s={.45}/><Specks x={850} y={830} t={t} n={7} spread={.42}/></g></g><g opacity={question}><Bubble x={485} y={565} w={465} h={390}/><T x={717} y={685} size={34} fill={C.ink} anchor="middle">SEBELUMNYA</T><T x={717} y={755} size={43} fill={C.rust} anchor="middle">KAMU BAYANGKAN</T><T x={717} y={817} size={39} fill={C.rust} anchor="middle">AWAN SEPERTI APA?</T><T x={717} y={885} size={29} fill={C.ink} anchor="middle">TULIS DI KOMENTAR</T></g><Host {...p} frame={frame} talk/><g opacity={cta}><rect x="285" y="1300" width="510" height="92" rx="46" fill={C.gold}/><T x={540} y={1362} size={46} fill={C.deep} anchor="middle">ikuti knot theory</T></g><Small text="ILUSTRASI" y={1450}/></>;
}
function Artwork({time}:{time:number}){let i=timeline.findIndex((v:any)=>time>=v.start&&time<v.end);if(i<0)i=timeline.length-1;const t=Math.max(0,time-timeline[i].start);return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><RigDefs/><PropDefs/><Scene i={i} t={t} frame={Math.round(t*fps)}/><Cue time={time}/></svg>}
// Standalone editorial thumbnail/poster, not an extracted video frame.
function Thumbnail(){const p:any={...pose(5,1),x:260,y:860,scale:.9};return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><RigDefs/><PropDefs/><image href={art.rooftop} width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/><rect width="1080" height="1920" fill={C.deep} opacity=".42"/><rect width="1080" height="500" fill={C.deep} opacity=".94"/><Brand/><T x={68} y={250} size={91} hand>500 TON AIR?</T><T x={68} y={365} size={92} hand fill={C.gold}>KOK MELAYANG?</T><rect x="70" y="410" width="850" height="65" rx="10" fill={C.cream}/><T x={88} y={455} size={28} fill={C.ink}>SATU CONTOH / MASSA AIR SAJA</T><path d="M460 625 l-55-44 M966 628 l53-40 M450 850 l-55 18 M976 850 l47 20" stroke={C.gold} strokeWidth="14" strokeLinecap="round"/><Cloud x={725} y={835} s={1.08}/><Host {...p} frame={50} talk gripR rightAccessory={<PeakLoupe progress={.75} t={1}/>}/><rect x="480" y="1280" width="470" height="82" rx="18" fill={C.deep} stroke={C.gold} strokeWidth="5"/><T x={715} y={1334} size={31} anchor="middle">KOK TIDAK JATUH?</T><Small text="ILUSTRASI KONSEPTUAL" y={1650}/></svg>}
function Poster(){const p:any={...pose(5,1),x:220,y:720,scale:.72};return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><RigDefs/><PropDefs/><rect width="1080" height="1350" fill={C.deep}/><circle cx="820" cy="460" r="340" fill="#327b79"/><Brand/><T x={70} y={245} size={89} hand>500 TON AIR?</T><T x={70} y={350} size={88} hand fill={C.gold}>KOK MELAYANG?</T><T x={75} y={425} size={29} fill={C.mint}>SATU CONTOH HITUNGAN AWAN</T><Cloud x={725} y={685} s={.90}/><Host {...p} frame={50} talk gripR rightAccessory={<PeakLoupe progress={.75} t={1}/>}/><Small text="ILUSTRASI KONSEPTUAL" y={1280}/></svg>}
const raster=(el:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(el),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());
const png=(t:number)=>raster(<Artwork time={t}/>);
async function main(){
 if(process.argv.includes('--stills')){
  const times=[0,.5,1.9,2.9,3.0,3.5,...timeline.slice(1).flatMap((s:any)=>[s.start+(s.end-s.start)*.25,s.start+(s.end-s.start)*.65]),duration-.2];
  times.forEach((t:number,i:number)=>fs.writeFileSync(path.join(D,`qa-sample-${String(i).padStart(2,'0')}.png`),png(t)));
  fs.writeFileSync(path.join(D,'awan-rig-v3-thumbnail.png'),raster(<Thumbnail/>));fs.writeFileSync(path.join(D,'awan-rig-v3-poster-4x5.png'),raster(<Poster/>));console.log(JSON.stringify({times}));return;
 }
 if(process.argv.includes('--still-zero')){
  fs.writeFileSync(path.join(D,'qa-sample-00.png'),png(0));
  fs.writeFileSync(path.join(D,'awan-rig-v3-thumbnail.png'),raster(<Thumbnail/>));
  fs.writeFileSync(path.join(D,'awan-rig-v3-poster-4x5.png'),raster(<Poster/>));
  return;
 }
 const ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),idx=process.argv.indexOf('--chunk');
 if(idx>=0){
  const first=Number(process.argv[idx+1]),end=Number(process.argv[idx+2]),outfile=path.join(D,process.argv[idx+3]);
  if(!Number.isInteger(first)||!Number.isInteger(end)||first<0||end>Math.round(duration*fps)||first>=end)throw new Error('Invalid frame chunk');
  const args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-vsync','0','-video_track_timescale','90000',outfile];
  const log=fs.createWriteStream(outfile+'.log'),child=spawn(ff,args,{stdio:['pipe','ignore','pipe']});child.stderr.pipe(log);child.on('error',e=>console.error('ffmpeg:',e));
  for(let f=first;f<end;f++){if(!child.stdin.write(png(f/fps)))await once(child.stdin,'drain');if((f-first)%150===0)console.log(`chunk ${first}: frame ${f}/${end}`)}
  child.stdin.end();const [code]=await once(child,'close');if(code!==0)throw new Error(`FFmpeg chunk exit ${code}`);console.log(`chunk ${first}: complete`);return;
 }
 if(process.argv.includes('--assemble')){
  const parts=['part-0.mp4','part-1.mp4'];for(const part of parts)if(!fs.existsSync(path.join(D,part)))throw new Error(`Missing ${part}`);
  const concat=path.join(D,'chunks.txt'),split=Math.floor(Math.round(duration*fps)/2);fs.writeFileSync(concat,`file '${parts[0]}'\nduration ${(split/fps).toFixed(9)}\nfile '${parts[1]}'\n`);
  const out=path.join(D,'awan-500-ton-rig-v3.mp4');const args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',d.narration,'-i',d.score,'-filter_complex','[1:a]volume=1.8[v];[2:a]volume=0.18[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-3.5:LRA=11[a]','-map','0:v:0','-map','[a]','-t',String(duration),'-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out];
  const r=spawnSync(ff,args,{stdio:'inherit'});if(r.status!==0)throw new Error(`Assembly FFmpeg exit ${r.status}`);console.log(`Rendered ${out}`);return;
 }
 throw new Error('Use --stills, --still-zero, --chunk START END NAME, or --assemble');
}
main().catch(e=>{console.error(e);process.exitCode=1});
