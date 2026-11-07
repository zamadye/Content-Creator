/*
 * Pilot Antartika revisi: frame-driven story based on the same character rig as
 * Danau di Dalam Laut. One prepared timeline drives video, movement and cues.
 * React SVG -> resvg -> one continuous ffmpeg encode; no network/publishing.
 */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import {Host} from './host';

const root=process.cwd();
const dir=path.join(root,'deliverables/interactive-revision-2026-11-11/antartika');
const data=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json'),'utf8'));
const {story,timeline,cues,duration,fps}=data;
const art=Object.fromEntries(Object.entries(data.art).map(([key,v]:[string,any])=>[key,'data:image/jpeg;base64,'+fs.readFileSync(v.render).toString('base64')]));
const files=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const C={navy:'#081d2a',deep:'#0b2e3c',ocean:'#14576a',teal:'#19817f',ink:'#0b2a31',cream:'#f6ecd3',white:'#fff8e7',gold:'#edbe68',ochre:'#be8052',rust:'#c25f42',mint:'#a9dbc6',ice:'#a8d9e4'};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const enter=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
const T=({x,y,children,size=44,fill=C.cream,anchor='start',family='Archivo SemiBold',weight=700,opacity=1}:{x:number;y:number;children:string;size?:number;fill?:string;anchor?:'start'|'middle'|'end';family?:string;weight?:number;opacity?:number})=><text x={x} y={y} fontFamily={family} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Brand=()=><g><circle cx="84" cy="145" r="10" fill={C.gold}/><T x={106} y={154} size={25}>KNOT THEORY  /  DUNIA KEBALIK</T></g>;
const Heading=({scene}:{scene:any})=><g><Brand/>{scene.heading.map((line:string,i:number)=><T key={i} x={75} y={280+i*92} size={78} fill={i?C.gold:C.cream} family="Permanent Marker" weight={400}>{line}</T>)}<T x={80} y={scene.heading.length>1?437:350} size={30} fill={C.mint} weight={600}>{scene.sub.replace('≠','berbeda dari')}</T></g>;
const Label=({text='ILUSTRASI',x=72,y=1430}:{text?:string;x?:number;y?:number})=><g><rect x={x} y={y-29} width={Math.max(125,text.length*13+26)} height="39" rx="7" fill={C.navy} opacity=".88"/><T x={x+12} y={y-2} size={19}>{text}</T></g>;
const Background=({which,t,dark=.20}:{which:string;t:number;dark?:number})=><g>
 <rect width="1080" height="1920" fill={C.navy}/>
 <g transform={`translate(540 920) scale(${1+Math.min(t,8)*.003}) translate(-540 -920)`}><image href={art[which]} width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/></g>
 <rect width="1080" height="1920" fill={C.navy} opacity={dark}/><rect width="1080" height="470" fill={C.navy} opacity=".35"/>
</g>;
const Snow=({t,count=12,x=0,y=490,width=1080,height=850,speed=55}:{t:number;count?:number;x?:number;y?:number;width?:number;height?:number;speed?:number})=><g fill={C.white}>
 {Array.from({length:count},(_,i)=><circle key={i} cx={x+(i*179)%width+Math.sin(t*.9+i)*7} cy={y+((i*233+t*speed)%height)} r={3+(i%3)*1.6} opacity={.42+(i%4)*.12}/>)}
</g>;
const Cloud=({x,y,s=1}:{x:number;y:number;s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-155 40 Q-160-15 -108-25 Q-90-92-24-85 Q45-112 82-49 Q145-47 154 8 Q161 60 105 65 H-111 Q-155 66-155 40Z" fill="#d4e6e6" stroke="#a6c6c6" strokeWidth="7"/></g>;
const Gauge=({x,y,s=1,fill=.10}:{x:number;y:number;s?:number;fill?:number})=><g transform={`translate(${x} ${y}) scale(${s})`}>
 <path d="M-62-176 L-62 160 Q-62 185 -40 185 H40 Q62 185 62 160 V-176" fill="#e9f4ed" fillOpacity=".93" stroke="#244c55" strokeWidth="9"/>
 <path d={`M-52 ${175-260*fill} H52 V175 H-52Z`} fill="#75bfd0"/>
 {[0,1,2,3,4].map(i=><path key={i} d={`M10 ${-125+i*62} h${i%2?25:36}`} fill="none" stroke="#527983" strokeWidth="5"/>)}
 <path d="M-83-188 H83 L65-155 H-65Z" fill="#d8e5d7" stroke="#355e63" strokeWidth="8"/><path d="M0 185 V240 M-48 240 H48" stroke="#d8e5d7" strokeWidth="12" strokeLinecap="round"/>
</g>;
const flake=(x:number,y:number,scale=1)=><g transform={`translate(${x} ${y}) scale(${scale})`} stroke={C.white} strokeWidth="5" strokeLinecap="round"><path d="M0-16 V16 M-14-8 L14 8 M-14 8 L14-8"/></g>;
const Panel=({x,y,w,h}:{x:number;y:number;w:number;h:number})=><rect x={x} y={y} width={w} height={h} rx="26" fill={C.deep} opacity=".9" stroke={C.mint} strokeWidth="4"/>;
const CueText=({time}:{time:number})=>{
 const cue=cues.find((q:any)=>time>=q.start&&time<q.end);
 if(!cue)return null;
 const two=cue.lines.length===2;return <g><rect x="70" y={two?1490:1510} width="940" height={two?166:110} rx="17" fill="#06141c" opacity=".90"/>
 {cue.lines.map((line:string,i:number)=><T key={i} x={540} y={(two?1552:1582)+i*58} size={44} fill="#ffffff" anchor="middle">{line}</T>)}
 </g>;
};

function Scene({i,t,frame,len}:{i:number;t:number;frame:number;len:number}){
 const s=story.scenes[i]; const progress=clamp(t/Math.max(.1,len));
 const hf=frame; // frame is local to this scene, but from the same master timeline
 if(i===0){
  const walk=enter(t,.5,3.4);const x=245+250*walk;
  return <><Background which="hero" t={t} dark={.10}/><Snow t={t} count={13} speed={34}/>
   <Host x={x} y={945-4*Math.sin(t*5)} scale={.67} frame={hf} armL={45+20*walk} armR={-28-24*walk} walking={t<3.4} talk/>
   <Heading scene={s}/><Label text="ILUSTRASI"/>
  </>;
 }
 if(i===1){
  const a=enter(t,0,.9),b=enter(t,1.4,2.5);
  return <><rect width="1080" height="1920" fill={C.deep}/><Heading scene={s}/>
   <g transform={`translate(${-80*(1-a)} 0)`} opacity={a}>
    <Panel x={70} y={535} w={445} h={665}/><rect x="80" y="545" width="425" height="645" rx="20" fill="#885c43"/>
    <circle cx="215" cy="670" r="72" fill="#f2bb65"/><path d="M80 950 Q195 765 340 975 Q410 855 505 945 V1190 H80Z" fill="#d49b63"/><path d="M80 1105 Q210 925 375 1110 Q455 1010 505 1050 V1190 H80Z" fill="#efbe84"/>
    <T x={290} y={1154} size={36} fill={C.ink} anchor="middle">PASIR &amp; PANAS</T>
   </g>
   <g transform={`translate(${80*(1-b)} 0)`} opacity={b}>
    <Panel x={565} y={535} w={445} h={665}/><rect x="575" y="545" width="425" height="645" rx="20" fill="#277083"/>
    <path d="M575 990 L690 785 L754 900 L820 735 L1000 1005 V1190 H575Z" fill="#b7dae0"/><path d="M575 1100 Q755 1015 1000 1100 V1190 H575Z" fill="#e0f1ed"/>
    <T x={786} y={1154} size={36} fill={C.ink} anchor="middle">ES &amp; DINGIN</T>
   </g>
   <g opacity={enter(t,2.4,3.2)} transform="translate(540 650)"><circle r="66" fill={C.deep} stroke={C.cream} strokeWidth="5"/><rect x="-12" y="-45" width="24" height="76" rx="12" fill={C.cream}/><circle cy="28" r="22" fill={C.rust}/><path d="M-42-42 L42 42 M42-42 L-42 42" stroke={C.gold} strokeWidth="9" strokeLinecap="round"/></g>
   <Host x={540} y={1050} scale={.43} frame={hf} armL={65} armR={-65} talk/>
   <g opacity={enter(t,3.2,4.2)}><rect x="300" y="1280" width="480" height="62" rx="12" fill={C.cream}/><T x={540} y={1323} size={31} fill={C.ink} anchor="middle">SUHU BUKAN SYARAT UTAMA</T></g><Label text="PERBANDINGAN"/>
  </>;
 }
 if(i===2){
  const fall=(t*95)%340;
  return <><Background which="station" t={t} dark={.36}/><Heading scene={s}/><Panel x={365} y={530} w={600} h={755}/>
   <Cloud x={655} y={665} s={.75}/>
   {[0,1,2].map(n=><g key={n}>{flake(545+n*100,740+((fall+n*115)%300),.8)}</g>)}
   {[0,1,2].map(n=><path key={n} d={`M${590+n*100} ${740+((fall+n*115+80)%300)} l-9 24`} stroke="#8ecad8" strokeWidth="11" strokeLinecap="round"/>)}
   <Gauge x={655} y={1030} s={.65} fill={Math.min(.30,.06+progress*.18)}/>
   <T x={655} y={1255} size={32} anchor="middle">HUJAN + SALJU</T>
   <Host x={220} y={890} scale={.66} frame={hf} armL={40} armR={-84} talk/>
   <Label text="SKEMA ILUSTRATIF"/>
  </>;
 }
 if(i===3){
  return <><Background which="hero" t={t} dark={.31}/><Heading scene={s}/><Snow t={t} count={8} speed={38}/>
   <Host x={225} y={900} scale={.67} frame={hf} armL={42} armR={-75} talk/>
   <g opacity={enter(t,.4,1.2)}><Panel x={480} y={565} w={430} h={690}/><Cloud x={690} y={700} s={.63}/>
    {[0,1].map(n=><g key={n}>{flake(635+n*90,760+((t*45+n*125)%160),.75)}</g>)}
    <Gauge x={690} y={1020} s={.70} fill={.08+.04*progress}/>
    <T x={690} y={1238} size={31} anchor="middle">INDIKATOR RENDAH</T>
   </g><Label text="SKEMA / SUMBER NASA"/>
  </>;
 }
 if(i===4){
  const traveler=enter(t,.5,Math.min(6,len-.2));
  return <><rect width="1080" height="1920" fill={C.deep}/><Heading scene={s}/>
   <rect x="68" y="535" width="944" height="730" rx="28" fill="#2d7888" stroke={C.mint} strokeWidth="5"/>
   <path d="M70 1050 Q190 1000 290 1025 L420 915 L575 850 L745 880 L1010 870 V1262 H70Z" fill="#c3e2df"/>
   <path d="M70 1110 Q185 1050 330 1060 L330 1262 H70Z" fill="#226879"/>
   <path d="M70 1060 Q190 1020 325 1058" fill="none" stroke="#9bd3d4" strokeWidth="9"/>
   <Cloud x={260} y={720} s={.54}/><Cloud x={780} y={720} s={.47}/>
   {[0,1,2,3,4,5].map(n=><g key={n}>{flake(150+n*38,760+((t*48+n*54)%210),.55)}</g>)}
   {[0,1].map(n=><g key={n}>{flake(758+n*44,760+((t*35+n*100)%200),.55)}</g>)}
   <rect x="110" y="1130" width="230" height="60" rx="10" fill={C.navy} opacity=".85"/><T x={225} y={1172} size={30} anchor="middle">PESISIR</T>
   <rect x="675" y="1010" width="245" height="60" rx="10" fill={C.navy} opacity=".85"/><T x={798} y={1052} size={30} anchor="middle">PEDALAMAN</T>
   <circle cx={350+340*traveler} cy={925-55*Math.sin(traveler*Math.PI)} r="15" fill={C.gold} stroke={C.cream} strokeWidth="5"/>
   <path d="M350 925 Q530 830 690 925" stroke={C.gold} strokeWidth="6" strokeDasharray="15 12" fill="none"/>
   <Host x={520} y={1060} scale={.36} frame={hf} armL={55} armR={-70} talk/>
   <T x={540} y={1350} size={29} anchor="middle">BISA BERBEDA MENURUT WILAYAH</T><Label text="SKEMA / TIDAK BERSKALA"/>
  </>;
 }
 if(i===5){
  const z=.75+.25*enter(t,.6,2.6);
  return <><Background which="layers" t={t} dark={.25}/><Heading scene={s}/><Snow t={t} count={9} y={515} height={450} speed={42}/>
   <Host x={235} y={900} scale={.70} frame={hf} armL={34} armR={-85} talk/>
   <g transform={`translate(650 910) scale(${z})`}><circle r="150" fill="#d5f2ee" fillOpacity=".45" stroke={C.gold} strokeWidth="22"/>
    <path d="M-105-52 Q0-78 108-48 M-105 0 Q0-20 108 12 M-105 52 Q0 30 108 60" fill="none" stroke="#eaf9f4" strokeWidth="15"/>
    <path d="M-104 104 l-115 115" stroke={C.gold} strokeWidth="30" strokeLinecap="round"/>
   </g><Label text="ILUSTRASI LAPISAN"/>
  </>;
 }
 if(i===6){
  const p=enter(t,.8,Math.max(1.8,len-1.0));const drop=(t*64)%180;
  return <><Background which="layers" t={t} dark={.62}/><Heading scene={s}/><Panel x={95} y={500} w={890} h={795}/>
   <Cloud x={570} y={615} s={.56}/>{[0,1,2,3].map(n=><g key={n}>{flake(475+n*63,670+((drop+n*49)%180),.6)}</g>)}
   <path d="M240 985 H840 V1195 H240Z" fill="#76b9c9"/><path d={`M240 ${935-45*p} H840 V985 H240Z`} fill="#aedadd"/>
   <path d={`M240 ${898-80*p} H840 V${935-45*p} H240Z`} fill="#e8f4ef"/>
   <path d={`M240 ${898-80*p} Q390 ${886-80*p} 540 ${898-80*p} T840 ${898-80*p}`} stroke={C.white} strokeWidth="9" fill="none"/>
   <path d="M300 1060 H780 M300 1110 H780" stroke="#bce4e4" strokeWidth="8" opacity=".65"/>
   <path d={`M155 ${760+50*p} V${870+50*p} m-22-25 l22 25 l22-25`} stroke={C.gold} strokeWidth="12" fill="none" strokeLinecap="round"/>
   <rect x="425" y={834-80*p} width="230" height="42" rx="9" fill={C.deep}/><T x={540} y={865-80*p} size={29} fill={C.cream} anchor="middle">SALJU BARU</T><T x={540} y={1134} size={36} fill={C.ink} anchor="middle">LAPISAN ES</T>
   <g transform="translate(845 668)"><rect x="-61" y="-62" width="122" height="130" rx="12" fill={C.cream}/><rect x="-61" y="-62" width="122" height="35" rx="8" fill={C.rust}/><path d={`M-43 5 H43 M-43 30 H${-25+65*p}`} stroke={C.deep} strokeWidth="8"/></g>
   <T x={540} y={1360} size={28} anchor="middle">ANIMASI WAKTU DIPERCEPAT</T><Label text="SKEMA / TIDAK BERSKALA"/>
  </>;
 }
 if(i===7){
  const a=enter(t,.2,1.2),b=enter(t,2.0,3.2);
  return <><Background which="station" t={t} dark={.43}/><Heading scene={s}/>
   <g opacity={a}><Panel x={320} y={545} w={285} h={625}/><Cloud x={462} y={655} s={.42}/>{flake(445,730+((t*38)%100),.60)}<Gauge x={462} y={930} s={.56} fill={.12}/><T x={462} y={1098} size={29} anchor="middle">SALJU BARU</T><T x={462} y={1142} size={26} anchor="middle">DALAM SETAHUN</T></g>
   <g opacity={b}><Panel x={645} y={545} w={305} h={625}/><rect x="685" y="660" width="225" height="350" rx="10" fill="#8fc9d6"/><path d="M685 735 H910 M685 805 H910 M685 875 H910 M685 945 H910" stroke="#dff0ed" strokeWidth="12"/><T x={797} y={1098} size={29} anchor="middle">ES TERSIMPAN</T><T x={797} y={1142} size={26} anchor="middle">SANGAT LAMA</T></g>
   <Host x={150} y={950} scale={.58} frame={hf} armL={36} armR={-68-17*enter(t,2,3)} talk/>
   <Label text="SKEMA / TIDAK BERSKALA"/>
  </>;
 }
 const a=enter(t,2,3),b=enter(t,3.6,4.6),c=enter(t,5,6);
 return <><Background which="hero" t={t} dark={.35}/><Snow t={t} count={8} speed={25}/><Heading scene={s}/>
  <Host x={250} y={795} scale={.78} frame={hf} armL={70} armR={-65} happy={t>3.5} talk={t<=3.5}/>
  <g opacity={a}><rect x="510" y="810" width="400" height="100" rx="20" fill="#236e69" stroke={C.mint} strokeWidth="4"/><T x={710} y={873} size={40} anchor="middle">ES TEBAL</T></g>
  <g opacity={b}><rect x="510" y="945" width="400" height="100" rx="20" fill="#83523c" stroke={C.gold} strokeWidth="4"/><T x={710} y={1008} size={37} anchor="middle">GURUN DINGIN</T></g>
  <g opacity={c}><rect x="490" y="1102" width="445" height="88" rx="16" fill={C.cream}/><T x={713} y={1159} size={31} fill={C.ink} anchor="middle">TULIS DI KOMENTAR</T></g>
  <rect x="280" y="1310" width="520" height="90" rx="45" fill={C.gold}/><T x={540} y={1370} size={45} fill={C.deep} anchor="middle">ikuti knot theory</T><Label text="ILUSTRASI"/>
 </>;
}

function Artwork({time}:{time:number}){
 let i=timeline.findIndex((x:any)=>time>=x.start && time<x.end);if(i<0)i=timeline.length-1;
 const seg=timeline[i],local=Math.max(0,time-seg.start);
 return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><Scene i={i} t={local} frame={Math.round(local*fps)} len={seg.end-seg.start}/><CueText time={time}/></svg>;
}
function Thumbnail(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
 <image href={art.hero} width="1080" height="1920"/><rect width="1080" height="510" fill={C.navy} opacity=".86"/>
 <Brand/><T x={76} y={285} size={100} family="Permanent Marker" weight={400}>ANTARTIKA</T><T x={76} y={400} size={100} family="Permanent Marker" weight={400} fill={C.gold}>ITU GURUN?</T>
 <rect x="80" y="445" width="675" height="62" rx="9" fill={C.cream}/><T x={95} y={489} size={32} fill={C.navy}>ES LUAS, TAPI SEDIKIT SALJU</T>
 <Host x={660} y={820} scale={.86} frame={0} armL={45} armR={-68} talk={false}/><Label text="ILUSTRASI"/>
 </svg>;}
const raster=(element:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(element),{font:{fontFiles:files,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());
const png=(t:number)=>raster(<Artwork time={t}/>);
async function main(){
 if(process.argv.includes('--stills')){
  const times=[0,...timeline.map((s:any)=>s.start+(s.end-s.start)*.48),...timeline.map((s:any)=>s.start+(s.end-s.start)*.68)];
  times.forEach((t:number,i:number)=>fs.writeFileSync(path.join(dir,`qa-sample-${String(i).padStart(2,'0')}.png`),png(t)));
  fs.writeFileSync(path.join(dir,'antartika-revisi-v2-thumbnail.png'),raster(<Thumbnail/>));
  console.log(JSON.stringify({stills:times.map((t:number)=>+t.toFixed(3))}));return;
 }
 const count=Math.ceil(duration*fps);const out=path.join(dir,'antartika-revisi-v2.mp4');
 const ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
 const args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-i',data.narration,'-i',data.score,'-filter_complex','[1:a]volume=1.8[v];[2:a]volume=0.18[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-3.5:LRA=11[a]','-map','0:v:0','-map','[a]','-t',String(duration),'-r',String(fps),'-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out];
 const log=fs.createWriteStream(path.join(dir,'ffmpeg-error.log'));const child=spawn(ff,args,{stdio:['pipe','ignore','pipe']});child.stderr.pipe(log);
 child.on('error',e=>console.error('ffmpeg:',e));
 for(let i=0;i<count;i++){if(!child.stdin.write(png(i/fps)))await once(child.stdin,'drain');if(i%150===0)console.log(`frame ${i}/${count}`);}
 child.stdin.end();const [code]=await once(child,'close');if(code!==0)throw new Error(`FFmpeg exit ${code}; see ffmpeg-error.log`);
 console.log(`Rendered ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
