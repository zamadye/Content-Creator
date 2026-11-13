/*
 * Kamar Berlangit FULL render (user feedback 2026-11-13 applied):
 *  1. Scenes 5-8 s each, boundaries snapped to cue starts (follows narration).
 *  2. Mixed backgrounds: real Coverr footage (city), AI art pans (sky/room),
 *     and pure Remotion-style SVG animation — footage is a LAYER over the
 *     canvas, never the canvas itself.
 *  3. Narrator rig v2 (trousers, separated legs, larger scale, per-scene
 *     gesture/position that follows the story: pointing, walking, looking up).
 * Per-segment encode + concat keeps memory flat. Nothing is published;
 * Coverr license stays NEEDS_REVIEW for any future publication.
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
const cues=data.cues as {start:number;end:number;lines:string[];beat:string}[];
const dur=data.duration as number, fps=data.fps as number||30;
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const GEN=(n:string)=>path.join(root,'assets/generated/episode-kamar-berlangit-2026',n);
const C={deep:'#071e26',navy:'#0b2c36',teal:'#216d6d',mint:'#abe1c7',cream:'#fff3d9',gold:'#f2c473',copper:'#c2754d',blue:'#74bfd0'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};const enter=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
const T=({x,y,children,size=38,fill=C.cream,anchor='start',family='Archivo SemiBold',weight=700,opacity=1}:any)=><text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} fontFamily={family} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Brand=()=><g><circle cx="82" cy="145" r="10" fill={C.gold}/><T x={105} y={154} size={25}>KNOT THEORY  /  DUNIA KEBALIK</T></g>;

type Scene={a:number;b:number;i0:number;i1:number;kind:'footage'|'art'|'anim';art?:string;title?:boolean;
  nx:number;ny:number;ns:number;armL:number;armR:number;walking?:boolean;happy?:boolean;shadow?:number};
function buildScenes():Scene[]{
  const raw:{a:number;b:number;i0:number;i1:number}[]=[];let i=0;
  while(i<cues.length){let j=i,d=cues[i].end-cues[i].start;
    while(j+1<cues.length){const nd=d+(cues[j+1].end-cues[j+1].start);
      if(d>=5.2&&d<=8.4)break;if(nd>8.4&&d>=4.2)break;j++;d=nd;}
    raw.push({a:cues[i].start,b:cues[j].end,i0:i,i1:j});i=j+1;}
  raw[0].a=0;raw[raw.length-1].b=dur;
  // Narrative art direction per scene (follows the story beats).
  const kindOf=(start:number,end:number,beat:string):Partial<Scene>=>{
    const mid=(start+end)/2;
    if(end<=17.1)return {kind:'footage',art:'footage-city'};             // B1-B2: real city night footage
    if(beat==='B3'&&mid<25.5)return {kind:'art',art:'dark-sky.png'};     // thousands of stars (AI art pan)
    if(beat==='B3')return {kind:'anim'};                                  // light bouncing back to the eye
    if(beat==='B4')return {kind:'anim'};                                  // "Artinya" card focus
    if(beat==='B5'&&mid<52)return {kind:'anim'};                          // Milky Way lost (80%/1-3 numbers)
    if(beat==='B5')return {kind:'art',art:'room.png'};                    // enter the room
    if(beat==='B6'&&mid<69)return {kind:'art',art:'room.png'};            // projector intro (art, beam in overlay)
    if(beat==='B6')return {kind:'anim'};                                  // honest note: not a sky replacement
    if(beat==='B7'&&mid<98)return {kind:'anim'};                          // Proxima Centauri diagram
    if(beat==='B7')return {kind:'art',art:'dark-sky.png'};                // light-years sky
    if(beat==='B8')return {kind:'art',art:'room.png'};                    // try it tonight
    return {kind:'anim'};                                                 // B9 closing: ceiling stars + CTA
  };
  const motion=(start:number,end:number,beat:string):Partial<Scene>=>{
    if(end<=17.1)return {nx:210,ny:955,ns:.86,armL:44,armR:-16,walking:start<3,shadow:1};
    if(beat==='B3')return start<25.5?{nx:190,ny:930,ns:.88,armL:-46,armR:-70,shadow:1}:{nx:185,ny:950,ns:.86,armL:38,armR:-128,shadow:1};
    if(beat==='B4')return {nx:860,ny:990,ns:.62,armL:60,armR:-52};
    if(beat==='B5')return start<52?{nx:170,ny:920,ns:.88,armL:-30,armR:-46,shadow:1}:{nx:700,ny:1137,ns:.70,armL:40,armR:-26,shadow:1};
    if(beat==='B6')return start<69?{nx:700,ny:1137,ns:.70,armL:-40,armR:-64,shadow:1}:{nx:845,ny:975,ns:.64,armL:56,armR:-58};
    if(beat==='B7')return start<98?{nx:855,ny:985,ns:.62,armL:52,armR:-60}:{nx:190,ny:930,ns:.88,armL:-46,armR:-72,shadow:1};
    if(beat==='B8')return {nx:700,ny:1137,ns:.70,armL:36,armR:-30,shadow:1};
    return {nx:170,ny:1050,ns:.62,armL:40,armR:-36,happy:true,shadow:1};
  };
  return raw.map((r,idx)=>{
    const beat=cues[r.i0].beat;
    return {...r,beat,kind:'art',title:idx===0,...kindOf(r.a,r.b,beat),...motion(r.a,r.b,beat)} as Scene;
  });
}
const SCENES=buildScenes();
const b64=(p:string)=>fs.readFileSync(p).toString('base64');
const artCache:Record<string,string>={};
function art(name:string){if(!artCache[name])artCache[name]=b64(GEN(name));return artCache[name];}

function Stars({t,seed=1,count=26,area='sky'}:{t:number;seed?:number;count?:number;area?:string}){
  const out=[];let s=seed*97;
  const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
  for(let i=0;i<count;i++){const x=60+rnd()*960,y=area==='sky'?250+rnd()*700:300+rnd()*1000;
    const r=1.6+rnd()*2.4,tw=.55+.45*Math.sin(t*(1.1+rnd()*1.3)+i);
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={C.cream} opacity={tw*clamp(y>1420?0.25:1)}/>);}
  return <g>{out}</g>;
}
function Projector({t,x=552,y=1218,s=1,beam=true}:{t:number;x?:number;y?:number;s?:number;beam?:boolean}){
  // Generic astronaut-style sky projector (no brand): small SVG prop on the
  // nightstand + animated beam and drifting star dots on the ceiling.
  const drift=18*Math.sin(t/2.4);
  return <g>
    {beam&&<g opacity={.75+-.15*Math.sin(t/1.7)}>
      <path d={`M${x} ${y-58} L${x-165+drift} 330 L${x+165+drift} 330 Z`} fill={C.blue} opacity=".14"/>
      <path d={`M${x} ${y-58} L${x-95+drift} 330 L${x+95+drift} 330 Z`} fill={C.mint} opacity=".16"/>
      {Array.from({length:14}).map((_,i)=>{const px=x-150+drift+((i*53+Math.floor(i/2)*37)%300),py=340+(i%4)*95+22*Math.sin(t/2+i);
        return <circle key={i} cx={px} cy={py} r={2.6+(i%3)} fill={i%3?C.cream:C.gold} opacity={.7+.3*Math.sin(t*1.4+i)}/>;})}
    </g>}
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="34" rx="52" ry="11" fill={C.deep} opacity=".5"/>
      <rect x="-38" y="-18" width="76" height="50" rx="10" fill={C.navy}/>
      <circle cx="-16" cy="6" r="17" fill={C.cream}/>
      <rect x="-30" y="16" width="26" height="18" rx="8" fill={C.cream}/>
      <ellipse cx="30" cy="-38" rx="26" ry="20" fill={C.copper}/>
      <ellipse cx="24" cy="-46" rx="8" ry="6" fill="#d9e5ea" opacity=".9"/>
      <circle cx="46" cy="-38" r="7" fill={C.jacketDeep}/>
    </g>
  </g>;
}
function Diagram({kind,t}:{kind:string;t:number}){
  if(kind==='bounce')return <g>
    <T x={540} y={420} size={34} anchor="middle" fill={C.mint}>CAHAYA KOTA NAIK</T>
    {Array.from({length:7}).map((_,i)=>{const ph=(t*.5+i/7)%1,y=620-ph*300;return <circle key={i} cx={330+i*62} cy={y} r={7} fill={C.gold} opacity={.85*(1-ph)}/>;})}
    <T x={540} y={700} size={34} anchor="middle" fill={C.gold}>MANTUL DI UAP AIR</T>
    {Array.from({length:5}).map((_,i)=>{const ph=((t-i*.14)*.9)%1;return <line key={i} x1={300+i*110} y1={720} x2={340+i*110} y2={720+140*Math.min(1,ph*2)} stroke={C.blue} strokeWidth={5} opacity={.8*(1-ph)} strokeLinecap="round"/>;})}
    <T x={540} y={940} size={34} anchor="middle" fill={C.blue}>BALIK KE MATA</T>
    {Array.from({length:6}).map((_,i)=>{const ph=(t*.6+i/6)%1;return <circle key={i} cx={540-420+840*ph} cy={980+70*Math.sin(ph*9+i)} r={6} fill={C.cream} opacity={.9*(1-ph)}/>;})}
  </g>;
  if(kind==='milkyway')return <g>
    <ellipse cx="540" cy="520" rx="330" ry="150" fill={C.navy} opacity=".85" transform="rotate(-18 540 520)"/>
    <ellipse cx="540" cy="520" rx="330" ry="150" fill="none" stroke={C.mint} strokeWidth="3" opacity=".5" transform="rotate(-18 540 520)"/>
    <T x={540} y={520} size={44} anchor="middle" fill={C.cream}>BIMA SAKTI</T>
    <T x={540} y={760} size={38} anchor="middle" fill={C.gold}>80% AMERIKA UTARA: GAK KELIATAN</T>
    <T x={540} y={812} size={38} anchor="middle" fill={C.blue}>SEPERTIGA PENDUDUK BUMI</T>
    <g transform={`translate(${250+580*clamp((t%6)/6)} 950)`}><Narrator x={0} y={0} scale={.5} frame={Math.round(t*fps)} armL={30} armR={-110}/></g>
  </g>;
  if(kind==='proxima')return <g>
    <circle cx="170" cy="560" r={16+2*Math.sin(t*1.2)} fill={C.copper}/>
    <T x={170} y={630} size={30} anchor="middle" fill={C.cream}>PROXIMA CENTAURI</T>
    <circle cx="940" cy="560" r="30" fill={C.teal}/>
    <T x={940} y={630} size={30} anchor="middle" fill={C.cream}>BUMI</T>
    <line x1="186" y1="560" x2="912" y2="560" stroke={C.mint} strokeWidth="4" strokeDasharray="4 18" strokeLinecap="round"/>
    <T x={540} y={520} size={34} anchor="middle" fill={C.gold}>EMPAT KOMA DUA TAHUN CAHAYA</T>
    <g transform="translate(140 900)"><Narrator x={0} y={0} scale={.5} frame={Math.round(t*fps)} armL={-52} armR={-80}/></g>
  </g>;
  // 'not-sky' honest note
  return <g>
    <rect x="180" y="380" width="720" height="380" rx="26" fill={C.navy} stroke={C.gold} strokeWidth="5"/>
    <T x={540} y={470} size={40} anchor="middle" fill={C.cream}>BUKAN PENGGANTI</T>
    <T x={540} y={530} size={40} anchor="middle" fill={C.cream}>LANGIT ASLI</T>
    <T x={540} y={640} size={34} anchor="middle" fill={C.blue}>bukan alat navigasi mata angin</T>
    <T x={540} y={700} size={34} anchor="middle" fill={C.mint}>nunjukin pola bintang di kamar</T>
    <g transform="translate(160 620)"><Narrator x={0} y={0} scale={.55} frame={Math.round(t*fps)} armL={44} armR={-56}/></g>
  </g>;
}
function Pill({t,a}:{t:number;a:number}){if(a<=0)return null;
  return <g opacity={a}><rect x="245" y="1078" width="590" height="108" rx="54" fill={C.gold}/>
  <T x={540} y={1148} size={46} anchor="middle" family="Permanent Marker">ikuti knot theory</T></g>;}

function Frame({t,scene,titleA}:{t:number;scene:Scene;titleA:number}){
  const local=t-scene.a, f=Math.round(t*fps);
  const drift=Math.sin(local/scene.b*6.3)*0; // (kept zero: pans via transforms below)
  const pan=scene.kind==='art'?{dx:14*Math.sin(local/8),dy:8*Math.cos(local/9)}:{dx:0,dy:0};
  const kb=scene.kind==='footage'?{s:1.0+.05*(local/(scene.b-scene.a)),x:-28*(local/(scene.b-scene.a))}:{s:1,x:0};
  const cue=cues.find(q=>t>=q.start&&t<q.end);
  const two=cue?cue.lines.length===2:false;
  return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    {scene.kind!=='footage'&&<rect width="1080" height="1920" fill={C.deep}/>}
    {scene.kind==='anim'&&<Stars t={t} seed={scene.i0+3} count={scene.beat==='B9'?34:20} area={scene.beat==='B9'?'full':'sky'}/>}
    {scene.kind==='art'&&<g transform={`translate(${pan.dx} ${pan.dy}) scale(1.06)`}>
      <image href={`data:image/png;base64,${art(scene.art!)}`} x="0" y="0" width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/>
    </g>}
    {scene.kind==='art'&&scene.art==='dark-sky.png'&&<Stars t={t} seed={scene.i0} count={14}/>}
    {/* Remotion-style diagrams */}
    {scene.kind==='anim'&&scene.beat==='B3'&&<Diagram kind="bounce" t={t}/>}
    {scene.kind==='anim'&&scene.beat==='B5'&&<Diagram kind="milkyway" t={t}/>}
    {scene.kind==='anim'&&scene.beat==='B7'&&t<80&&<Diagram kind="proxima" t={t}/>}
    {scene.kind==='anim'&&scene.beat==='B6'&&<Diagram kind="not-sky" t={t}/>}
    {scene.kind==='anim'&&scene.beat==='B9'&&<g>
      <rect width="1080" height="1920" fill="#060f16"/>
      <Projector t={t} x={540} y={1560} s={1.25}/>
      <g opacity={.9}>{Array.from({length:26}).map((_,i)=>{const ph=(t*.22+i/26)%1;
        return <circle key={i} cx={120+((i*89)%840)} cy={300+((i*127)%760)} r={2.4+(i%3)*1.2} fill={i%4?C.cream:C.gold} opacity={clamp(1.3-ph*1.3)}/>;})}</g>
      <Pill t={t} a={enter(t,scene.b-7,scene.b-6.2)}/>
    </g>}
    {(scene.kind==='art'&&scene.art==='room.png')&&<g>
      <rect x="424" y="1176" width="108" height="96" rx="10" fill={C.navy}/>
      <rect x="424" y="1254" width="108" height="14" rx="7" fill="#1d3340"/>
      <Projector t={t} x={478} y={1216} s={.92} beam={scene.beat==='B8'||scene.beat==='B6'}/>
    </g>}
    {/* honest labeling */}
    {scene.kind==='footage'&&<g><rect x="60" y="168" width="470" height="42" rx="8" fill={C.deep} opacity=".85"/><T x={76} y={197} size={20}>VIDEO: COVERR / KOTA MALAM</T></g>}
    {scene.kind==='art'&&<g><rect x="60" y="168" width="430" height="42" rx="8" fill={C.deep} opacity=".85"/><T x={76} y={197} size={20}>ILUSTRASI (AI) — DUNIA KEBALIK</T></g>}
    {scene.kind==='anim'&&<g><rect x="60" y="168" width="330" height="42" rx="8" fill={C.deep} opacity=".85"/><T x={76} y={197} size={20}>SKEMA / ANIMASI</T></g>}
    <Brand/>
    {scene.title&&titleA>0&&<g opacity={titleA}>
      <T x={70} y={352} size={72} family="Permanent Marker" fill={C.cream}>LANGIT KAMAR LU</T>
      <T x={70} y={438} size={72} family="Permanent Marker" fill={C.gold}>ADA ATURANNYA</T>
      <T x={70} y={506} size={34} fill={C.mint}>polusi cahaya & proyektor langit</T>
    </g>}
    {!(scene.kind==='anim'&&(scene.beat==='B5'||scene.beat==='B6'||(scene.beat==='B7'&&t<80)))&&
      <Narrator x={scene.nx} y={scene.ny} scale={scene.ns} frame={f} armL={scene.armL} armR={scene.armR} talk={!scene.happy} happy={scene.happy} walking={scene.walking}/>}
    {scene.shadow&&!(scene.kind==='anim'&&(scene.beat==='B5'||scene.beat==='B6'||(scene.beat==='B7'&&t<80)))?<ellipse cx={scene.nx+26} cy={scene.ny+572*scene.ns+22} rx={130*scene.ns/.86} ry={18*scene.ns/.86} fill={C.deep} opacity=".38"/>:null}
    {cue&&<g><rect x="66" y={two?1490:1510} width="948" height={two?165:110} rx="18" fill="#06151c" opacity=".92"/>
      {cue.lines.map((line,i)=><T key={i} x={540} y={(two?1550:1582)+i*57} size={43} anchor="middle" fill="#fff">{line}</T>)}</g>}
  </svg>;
}
const raster=(el:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(el),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());

async function sh(cmd:string,args:string[]):Promise<void>{
  const p=spawn(cmd,args,{stdio:['ignore','ignore','pipe']});
  const err='';p.stderr.on('data',(d)=>{if(String(d).match(/error|invalid/i))process.stderr.write(d);});
  const [code]=await once(p,'close');
  if(code!==0)throw new Error(`${path.basename(cmd)} exit ${code} ${err}`);
}
async function main(){
  const argv=process.argv.slice(2);
  if(argv.includes('--stills')){
    for(const t of [2.5,7,12,20,28,33,38,45,58,64,71,78,84,95,105,115,126,134,137]){
      const scene=SCENES.find(s=>t>=s.a&&t<s.b)!;
      fs.writeFileSync(path.join(dir,`full-still-${String(t).replace('.','_')}.png`),raster(<Frame t={t} scene={scene} titleA={enter(t,.4,1.6)}/>));
    }
    console.log(JSON.stringify({stills:true,scenes:SCENES.map(s=>({a:+s.a.toFixed(1),b:+s.b.toFixed(1),kind:s.kind,beat:s.beat,d:+(s.b-s.a).toFixed(1)}))}));
    return;
  }
  const from=Number(argv.find(a=>a.startsWith('--from='))?.split('=')[1]??0);
  const to=Number(argv.find(a=>a.startsWith('--to='))?.split('=')[1]??SCENES.length);
  const tmp=argv.find(a=>a.startsWith('--tmp='))?.split('=')[1]||fs.mkdtempSync(path.join(root,'deliverables/kamar-berlangit-2026','seg-'));
  const ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
  for(let si=from;si<Math.min(to,SCENES.length);si++){
    const s=SCENES[si],count=Math.ceil((s.b-s.a)*fps);
    const ov=path.join(tmp,`ov-${String(si).padStart(3,'0')}`);fs.mkdirSync(ov,{recursive:true});
    for(let k=0;k<count;k++){const t=+(s.a+k/fps).toFixed(4);
      fs.writeFileSync(path.join(ov,`f-${String(k).padStart(5,'0')}.png`),raster(<Frame t={t} scene={s} titleA={enter(t,.4,1.6)}/>));}
    const seg=path.join(tmp,`seg-${String(si).padStart(3,'0')}.mp4`);
    if(s.kind==='footage'){
      await sh(ff,['-nostdin','-hide_banner','-loglevel','error','-y','-stream_loop','-1','-i',path.join(root,'assets/footage/episode-kamar-berlangit-2026/kamar-footage.mp4'),
        '-framerate',String(fps),'-i',path.join(ov,'f-%05d.png'),
        '-filter_complex',`[0:v]scale=-2:1920:flags=bicubic,crop=1080:1920,setsar=1[bg];[1:v]format=rgba[ov2];[bg][ov2]overlay=0:0,format=yuv420p[v]`,
        '-map','[v]','-t',(s.b-s.a).toFixed(4),'-r',String(fps),'-c:v','libx264','-preset','veryfast','-crf','19',seg]);
    }else{
      await sh(ff,['-nostdin','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=0x071e26:s=1080x1920:r=${fps}`,
        '-framerate',String(fps),'-i',path.join(ov,'f-%05d.png'),
        '-filter_complex','[1:v]format=rgba[ov2];[0][ov2]overlay=0:0:shortest=1,format=yuv420p[v]',
        '-map','[v]','-t',(s.b-s.a).toFixed(4),'-c:v','libx264','-preset','veryfast','-crf','19',seg]);
    }
    fs.rmSync(ov,{recursive:true,force:true});
    console.log(`segment ${si+1}/${SCENES.length} ok (${s.kind} ${(s.b-s.a).toFixed(1)}s)`);
  }
  console.log(`SEGMENTS-DONE ${from}:${to} tmp=${tmp}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
