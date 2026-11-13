/*
 * Kamar Berlangit render v2 (feedback 2026-11-13 round 2):
 *  - Timing from the USER'S TurboScribe transcript (prepare-timestamped.py).
 *  - 23 scenes in the 4-8.6 s band, boundaries follow the narration content.
 *  - ALL scenes have a full moving visual: Coverr footage layers (city,
 *    starry sky AI clip, night-room) plus animated SVG overlays on every
 *    scene; skema scenes are pure animation. No static-only scenes.
 *  - Narrator rig v2 appears in sky/city/finale scenes; room scenes use the
 *    footage person instead. Product shown as generic SVG prop + beam.
 * Nothing is published; Coverr license stays NEEDS_REVIEW for publication.
 */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import {Narrator} from './narrator';

const root=process.cwd(),dir=path.join(root,'deliverables/kamar-berlangit-2026');
const data=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json'),'utf8'));
const cues=data.cues as {start:number;end:number;lines:string[]}[];
const TL=data.timeline as {id:string;a:number;b:number;bg:string;label:string;note:string;dur:number}[];
const dur=data.duration as number, fps=data.fps as number||30;
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const FOOT:string[]=(data.footage as any)?{city:path.join(root,(data.footage as any).city),stars:path.join(root,(data.footage as any).stars),room:path.join(root,(data.footage as any).room)} as any:null;
const C={deep:'#071e26',navy:'#0b2c36',teal:'#216d6d',mint:'#abe1c7',cream:'#fff3d9',gold:'#f2c473',copper:'#c2754d',blue:'#74bfd0'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};const enter=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
const T=({x,y,children,size=38,fill=C.cream,anchor='start',family='Archivo SemiBold',weight=700,opacity=1}:any)=><text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} fontFamily={family} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Brand=()=><g><circle cx="82" cy="145" r="10" fill={C.gold}/><T x={105} y={154} size={25}>KNOT THEORY  /  DUNIA KEBALIK</T></g>;

function Twinkles({t,seed=1,count=26,y0=250,y1=1250}:{t:number;seed?:number;count?:number;y0?:number;y1?:number}){
  const out=[];let s=seed*97+13;
  const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
  for(let i=0;i<count;i++){const x=40+rnd()*1000,y=y0+rnd()*(y1-y0),r=1.6+rnd()*2.6;
    const tw=.5+.5*Math.sin(t*(1.2+rnd()*1.6)+i*1.7);
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={i%5?C.cream:C.gold} opacity={tw*.9}/>);}
  return <g>{out}</g>;
}
function Rise({t,y=1290,count=12}:{t:number;y?:number;count?:number}){
  return <g>{Array.from({length:count}).map((_,i)=>{const ph=(t*.36+i/count)%1;
    return <circle key={i} cx={120+(i*83)%860} cy={y-ph*560} r={5+2*(i%3)} fill={C.gold} opacity={.75*(1-ph)*(ph>.03?1:0)}/>;})}</g>;
}
function Bounce({t}:{t:number}){
  return <g>{Array.from({length:8}).map((_,i)=>{const ph=(t*.55+i/8)%1,y=1050-ph*430;
    return <circle key={i} cx={170+(i*104)%760} cy={y} r={6} fill={C.blue} opacity={.8*Math.sin(Math.PI*ph)}/>;})}</g>;
}
function Projector({t,x,y,s=1,beam=true}:{t:number;x:number;y:number;s?:number;beam?:boolean}){
  const drift=18*Math.sin(t/2.4);
  return <g>
    {beam&&<g opacity={.72+.14*Math.sin(t/1.7)}>
      <path d={`M${x} ${y-62} L${x-190+drift} 240 L${x+190+drift} 240 Z`} fill={C.blue} opacity=".16"/>
      <path d={`M${x} ${y-62} L${x-110+drift} 240 L${x+110+drift} 240 Z`} fill={C.mint} opacity=".18"/>
      {Array.from({length:16}).map((_,i)=>{const px=x-170+drift+((i*53+Math.floor(i/2)*37)%340),py=250+(i%4)*95+22*Math.sin(t/2+i);
        return <circle key={i} cx={px} cy={py} r={2.6+(i%3)} fill={i%3?C.cream:C.gold} opacity={.7+.3*Math.sin(t*1.4+i)}/>;})}
    </g>}
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="36" rx="54" ry="11" fill="#000" opacity=".45"/>
      <rect x="-38" y="-18" width="76" height="50" rx="10" fill={C.navy}/>
      <circle cx="-16" cy="6" r="17" fill={C.cream}/>
      <rect x="-30" y="16" width="26" height="18" rx="8" fill={C.cream}/>
      <ellipse cx="30" cy="-38" rx="26" ry="20" fill={C.copper}/>
      <ellipse cx="24" cy="-46" rx="8" ry="6" fill="#d9e5ea" opacity=".9"/>
      <circle cx="46" cy="-38" r="7" fill="#a35f3c"/>
    </g>
  </g>;
}
function Proxima({t}:{t:number}){
  const dash=(t*90)%22;
  return <g>
    <rect x="90" y="330" width="900" height="560" rx="30" fill="#050f16" opacity=".82"/>
    <circle cx="230" cy="590" r={18+2.4*Math.sin(t*1.2)} fill={C.copper}/>
    <circle cx="230" cy="590" r="30" fill="none" stroke={C.copper} strokeWidth="2.5" opacity={.5+.3*Math.sin(t*1.2)}/>
    <T x={230} y={668} size={30} anchor="middle" fill={C.cream}>PROXIMA CENTAURI</T>
    <circle cx="880" cy="590" r="32" fill={C.teal}/>
    <T x={880} y={668} size={30} anchor="middle" fill={C.cream}>BUMI</T>
    <line x1="262" y1="590" x2="846" y2="560" stroke={C.mint} strokeWidth="4" strokeDasharray={`4 18`} strokeDashoffset={-dash} strokeLinecap="round"/>
    <T x={540} y={470} size={40} anchor="middle" fill={C.gold}>4,2 TAHUN CAHAYA</T>
    <T x={540} y={820} size={30} anchor="middle" fill={C.blue}>setiap malam langit nunjukin masa lalu</T>
  </g>;
}
function Milky({t,mode}:{t:number;mode:string}){
  const sweep=clamp((t-37.5)/3);
  return <g>
    <ellipse cx="540" cy="470" rx="360" ry="150" fill="#050f16" opacity=".8" transform="rotate(-14 540 470)"/>
    <ellipse cx="540" cy="470" rx="360" ry="150" fill="none" stroke={C.mint} strokeWidth="3" opacity=".55" transform="rotate(-14 540 470)" strokeDasharray="10 14" strokeDashoffset={-(t*30)%24}/>
    <T x={540} y={478} size={46} anchor="middle" fill={C.cream}>BIMA SAKTI</T>
    {mode==='80'&&<g opacity={enter(t,43.6,44.6)}>
      <T x={540} y={900} size={44} anchor="middle" fill={C.gold}>80% AMERIKA UTARA GAK KELIATAN</T>
      <T x={540} y={958} size={38} anchor="middle" fill={C.blue}>1/3 PENDUDUK BUMI</T>
      <g opacity={.8}>{Array.from({length:10}).map((_,i)=><circle key={i} cx={330+((i*67)%420)} cy={1000+((i*41)%60)} r={4} fill={C.cream}/>)}</g>
    </g>}
  </g>;
}
function Card({t,x=540,y=620,w=760,h=330,l1,l2,l3}:{t:number;x?:number;y?:number;w?:number;h?:number;l1:string;l2?:string;l3?:string}){
  const a=enter(t,.2,.8);
  return <g opacity={a}>
    <rect x={x-w/2} y={y-h/2} width={w} height={h} rx="26" fill="#050f16" opacity=".86"/>
    <rect x={x-w/2} y={y-h/2} width={w} height={h} rx="26" fill="none" stroke={C.gold} strokeWidth="4" opacity=".9"/>
    {l3?<g><T x={x} y={y-34} size={44} anchor="middle" fill={C.cream}>{l1}</T><T x={x} y={y+24} size={44} anchor="middle" fill={C.cream}>{l2}</T><T x={x} y={y+88} size={34} anchor="middle" fill={C.blue}>{l3}</T></g>
      :l2?<g><T x={x} y={y-16} size={48} anchor="middle" fill={C.cream}>{l1}</T><T x={x} y={y+52} size={48} anchor="middle" fill={C.cream}>{l2}</T></g>
      :<T x={x} y={y+16} size={50} anchor="middle" fill={C.cream}>{l1}</T>}
  </g>;
}
function Pill({t,a}:{t:number;a:number}){if(a<=0)return null;
  return <g opacity={a}><rect x="245" y="1078" width="590" height="108" rx="54" fill={C.gold}/>
  <T x={540} y={1148} size={46} anchor="middle" family="Permanent Marker">ikuti knot theory</T></g>;}

const NOTE_NARRATOR=new Set(['hook','kontrak fakta','ribuan bintang','mantul balik + akibat','coba bayangin','80 persen','sepertiga + dim','gua purba -> gelap','plafon kamar + CTA']);
const NOTE_PROJECTOR=new Set(['astronot nocuh plafon + beam','proyektor punya tempat + beam','bukan ganti bintang']);
const NOTE_DIM=new Set(['gua purba -> gelap','sepertiga + dim']);

function Frame({t,scene,titleA}:{t:number;scene:any;titleA:number}){
  const f=Math.round(t*fps);
  const cue=cues.find(q=>t>=q.start&&t<q.end);
  const two=cue?cue.lines.length===2:false;
  const kind=scene.bg==='anim'?'anim':'footage';
  const dimT=NOTE_DIM.has(scene.note)?clamp((t-scene.a)/(scene.b-scene.a)*.7)*.5:0;
  const local=t-scene.a;
  return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    {kind!=='footage'&&<rect width="1080" height="1920" fill="#060f16"/>}
    {scene.bg==='anim'&&scene.note==='artinya'&&<g>
      <Twinkles t={t} count={16} y0={250} y1={1450}/>
      <T x={540} y={430} size={40} anchor="middle" fill={C.mint}>BUKAN AWAN…</T>
      <Bounce t={t}/>
      <T x={540} y={1180} size={40} anchor="middle" fill={C.gold}>CAHAYA SALAH ALAMAT</T>
      {Array.from({length:5}).map((_,i)=>{const ph=(t*.5+i/5)%1;
        return <line key={i} x1={300+i*110} y1={1220} x2={340+i*110} y2={1220+120*Math.min(1,ph*2)} stroke={C.copper} strokeWidth={5} opacity={.8*(1-ph)} strokeLinecap="round"/>;})}
    </g>}
    {scene.bg==='anim'&&scene.note==='plafon kamar + CTA'&&<g>
      <rect width="1080" height="1920" fill="#04090f"/>
      <Projector t={t} x={540} y={1580} s={1.3}/>
      <g>{Array.from({length:30}).map((_,i)=>{const ph=(t*.2+i/30)%1;
        return <circle key={i} cx={110+((i*89)%860)} cy={280+((i*127)%820)} r={2.6+(i%3)*1.3} fill={i%4?C.cream:C.gold} opacity={clamp(1.25-ph*1.25)}/>;})}</g>
      <g><Narrator x={195} y={1075} scale={.66} frame={f} armL={36} armR={-30} happy/></g>
      <ellipse cx="222" cy="1395" rx="105" ry="15" fill="#000" opacity=".4"/>
      <Pill t={t} a={enter(t,scene.b-6.4,scene.b-5.6)}/>
    </g>}
    {/* footage layer over canvas */}
    {kind==='footage'&&<rect x="0" y="118" width="1080" height="182" fill="#050f16" opacity=".52"/>}
    {kind==='footage'&&dimT>0&&<rect width="1080" height="1920" fill="#000" opacity={dimT*.72}/>}
    {kind==='footage'&&scene.note==='cahaya naik'&&<Rise t={t}/>}
    {kind==='footage'&&scene.note==='mantul balik + akibat'&&<g><Bounce t={t}/><Rise t={t} y={1330} count={8}/></g>}
    {scene.bg==='stars'&&<g><Twinkles t={t} seed={scene.a} count={scene.note==='ribuan bintang'?30:18} y0={230} y1={1300}/></g>}
    {scene.bg==='stars'&&scene.note==='ribuan bintang'&&<g opacity={enter(t,11.6,12.6)}>
      <T x={540} y={1585} size={40} anchor="middle" fill={C.gold}>RIBUAN SEKALI NENGADAH</T></g>}
    {scene.bg==='stars'&&(scene.note==='coba bayangin'||scene.note==='80 persen')&&<Milky t={t} mode={scene.note==='80 persen'?'80':'intro'}/>}
    {scene.bg==='stars'&&scene.note==='gua purba -> gelap'&&<Card t={t} y={520} h={280} l1="SEJAK ZAMAN GUA PURBA" l2="SEKARANG ILANG" />}
    {scene.bg==='stars'&&(scene.note==='proxima diagram'||scene.note==='masa lalu')&&<Proxima t={t}/>}
    {scene.bg==='room'&&NOTE_PROJECTOR.has(scene.note)&&<Projector t={t} x={830} y={1490} s={1.05} beam/>}
    {scene.bg==='room'&&scene.note==='jujur bukan pengganti'&&<Card t={t} y={540} h={330} l1="BUKAN PENGGANTI" l2="LANGIT ASLI" l3="bukan alat mata angin"/>}
    {scene.bg==='room'&&scene.note==='kamar ditutup lampu kota'&&<Card t={t} y={520} h={300} l1="LANGIT DITUTUP LAMPU KOTA" l2="pola bintang & galaksi" l3="jarang banget keliatan"/>}
    {scene.bg==='stars'&&scene.note==='masa lalu'&&<Card t={t} y={520} h={300} l1="NUNJUKIN MASA LALU" l2="jarak pakai tahun cahaya"/>}
    {scene.bg==='stars'&&scene.note==='kagak lucu gratis'&&<g><Card t={t} y={500} h={300} l1="SEJAUH ITU… GRATIS" l2="tapi kita kelewatan"/><g opacity={.85}><Narrator x={215} y={968} scale={.74} frame={f} armL={-40} armR={-96} talk/></g><ellipse cx="242" cy="1408" rx="126" ry="18" fill="#000" opacity=".38"/></g>}
    {scene.bg==='room'&&scene.note==='jadi mungkin malam ini'&&<Card t={t} y={520} h={280} l1="MALAM INI COBA:" l2="SATU HAL SIMPLE"/>}
    {scene.bg==='room'&&scene.note==='matiin lampu 5 menit'&&<rect width="1080" height="1920" fill="#000" opacity={.28+.1*Math.sin((t-113.8)*1.1)}/>}
    {scene.bg==='room'&&scene.note==='matiin lampu 5 menit'&&<Card t={t} y={500} h={300} l1="MATIIN LAMPU 5 MENIT" l2="biarin mata adaptasi, nengadah"/>}
    {scene.bg==='room'&&scene.note==='bukan ganti bintang'&&<Card t={t} y={520} h={300} l1="BUKAN GANTI BINTANG" l2="balikin kebiasaan nengadah"/>}
    {/* honest kind labels */}
    <rect x="60" y="168" width={scene.bg==='anim'?330:scene.bg==='stars'?520:430} height="42" rx="8" fill="#050f16" opacity=".82"/>
    <T x={76} y={197} size={20}>{scene.bg==='anim'?'SKEMA / ANIMASI':scene.bg==='stars'?'VIDEO: COVERR — LANGIT BINTANG (AI)':scene.bg==='city'?'VIDEO: COVERR — KOTA MALAM':'VIDEO: COVERR — KAMAR MALAM'}</T>
    {NOTE_NARRATOR.has(scene.note)&&<g><rect x="60" y="222" width="330" height="42" rx="8" fill="#050f16" opacity=".82"/><T x={76} y={251} size={20}>KARAKTER: ILUSTRASI</T></g>}
    <Brand/>
    {scene.note==='hook'&&titleA>0&&<g opacity={titleA}>
      <T x={70} y={352} size={70} family="Permanent Marker" fill={C.cream}>LANGIT KAMAR LU</T>
      <T x={70} y={438} size={70} family="Permanent Marker" fill={C.gold}>ADA ATURANNYA</T>
      <T x={70} y={502} size={34} fill={C.mint}>polusi cahaya & proyektor langit</T>
    </g>}
    {NOTE_NARRATOR.has(scene.note)&&scene.bg!=='anim'&&
      <g><Narrator x={205} y={968} scale={.74} frame={f} armL={44} armR={scene.note==='ribuan bintang'?-110:scene.note==='80 persen'?-70:scene.note==='coba bayangin'?-46:-16} talk/></g>}
    {NOTE_NARRATOR.has(scene.note)&&scene.bg!=='anim'&&<ellipse cx="232" cy="1408" rx="126" ry="18" fill="#000" opacity=".38"/>}
    {cue&&<g><rect x="66" y={two?1490:1510} width="948" height={two?165:110} rx="18" fill="#06151c" opacity=".92"/>
      {cue.lines.map((line,i)=><T key={i} x={540} y={(two?1550:1582)+i*57} size={43} anchor="middle" fill="#fff">{line}</T>)}</g>}
  </svg>;
}
const raster=(el:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(el),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());
async function sh(cmd:string,args:string[]):Promise<void>{
  const p=spawn(cmd,args,{stdio:['ignore','ignore','pipe']});
  p.stderr.on('data',(d)=>{if(/error|invalid/i.test(String(d)))process.stderr.write(d);});
  const [code]=await once(p,'close');
  if(code!==0)throw new Error(`${path.basename(cmd)} exit ${code}`);
}
async function main(){
  const argv=process.argv.slice(2);
  if(argv.includes('--stills')){
    const times=[2,8,14,20,26,33,40,46,52,59,64,70,76,82,89,95,101,106,112,118,123,129,136];
    for(const t of times){
      const scene=TL.find(s=>t>=s.a&&t<s.b)!;
      fs.writeFileSync(path.join(dir,`v2-still-${String(t).replace('.','_')}.png`),raster(<Frame t={t} scene={scene} titleA={enter(t,.4,1.6)}/>));
    }
    console.log(JSON.stringify({stills:times.length}));
    return;
  }
  const from=Number(argv.find(a=>a.startsWith('--from='))?.split('=')[1]??0);
  const to=Number(argv.find(a=>a.startsWith('--to='))?.split('=')[1]??TL.length);
  const tmp=argv.find(a=>a.startsWith('--tmp='))?.split('=')[1]||fs.mkdtempSync(path.join(dir,'seg2-'));
  const ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
  for(let si=from;si<Math.min(to,TL.length);si++){
    const s=TL[si],count=Math.ceil((s.b-s.a)*fps);
    const ov=path.join(tmp,`ov-${String(si).padStart(3,'0')}`);fs.mkdirSync(ov,{recursive:true});
    for(let k=0;k<count;k++){const t=+(s.a+k/fps).toFixed(4);
      fs.writeFileSync(path.join(ov,`f-${String(k).padStart(5,'0')}.png`),raster(<Frame t={t} scene={s} titleA={enter(t,.4,1.6)}/>));}
    const seg=path.join(tmp,`seg-${String(si).padStart(3,'0')}.mp4`);
    if(s.bg!=='anim'){
      await sh(ff,['-nostdin','-hide_banner','-loglevel','error','-y','-stream_loop','-1','-i',FOOT[s.bg],
        '-framerate',String(fps),'-i',path.join(ov,'f-%05d.png'),
        '-filter_complex','[0:v]scale=-2:1920:flags=bicubic,crop=1080:1920,setsar=1[bg];[1:v]format=rgba[ov2];[bg][ov2]overlay=0:0,format=yuv420p[v]',
        '-map','[v]','-t',(s.b-s.a).toFixed(4),'-r',String(fps),'-c:v','libx264','-preset','veryfast','-crf','19',seg]);
    }else{
      await sh(ff,['-nostdin','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=0x060f16:s=1080x1920:r=${fps}`,
        '-framerate',String(fps),'-i',path.join(ov,'f-%05d.png'),
        '-filter_complex','[1:v]format=rgba[ov2];[0][ov2]overlay=0:0:shortest=1,format=yuv420p[v]',
        '-map','[v]','-t',(s.b-s.a).toFixed(4),'-c:v','libx264','-preset','veryfast','-crf','19',seg]);
    }
    fs.rmSync(ov,{recursive:true,force:true});
    console.log(`segment ${si+1}/${TL.length} ok (${s.bg} ${s.dur}s)`);
  }
  console.log(`SEGMENTS-DONE ${from}:${to} tmp=${tmp}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
