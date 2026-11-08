/* Private draft renderer: real landscape turbine clips are only context;
 * the shutdown and pitch mechanisms are explicitly labelled illustrations.
 * One global clock joins the opening glimpse to the later peak. No publishing. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {Host,RigDefs} from '../awan-rig-v2/rig';
import {pose} from '../awan-rig-v2/poses.mjs';
import {UmbrellaAtGrip,PropDefs} from '../awan-rig-v2/props';
import {openingPeak,returnPeak,smoothstep} from './motion.mjs';
import {checkHumanReview,sha256} from './review-gate.mjs';

const engine=process.cwd(),root=path.resolve(engine,'..'),D=path.join(root,'.scratch/turbine-v2/render');
const scriptPath=path.join(engine,'content/proposals/turbin-angin-draf-v2.json');
const auditPath=path.join(engine,'content/proposals/turbin-angin-audit-kalimat-v2.json');
const planPath=path.join(engine,'pipeline/turbin-angin-v2/shot-plan.json');
const reviewPath=path.join(root,'.scratch/turbine-v2/human-review.json');
const data=JSON.parse(fs.readFileSync(path.join(D,'prepared.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(engine,'pipeline/turbin-angin-v2/footage-manifest.json'),'utf8'));
const {timeline,cues,fps,duration}=data;
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(engine,'assets/fonts',n));
const ff=path.join(engine,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
const ffprobe=path.join(engine,'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe');
const rendererFiles=[
 path.join(engine,'pipeline/turbin-angin-v2/render.tsx'),
 path.join(engine,'pipeline/turbin-angin-v2/motion.mjs'),
 path.join(engine,'pipeline/turbin-angin-v2/review-gate.mjs'),
 path.join(engine,'pipeline/turbin-angin-v2/preflight.mjs'),
 path.join(engine,'pipeline/turbin-angin-v2/prepare.py'),
 path.join(engine,'pipeline/turbin-angin-v2/check-glyphs.py'),
 path.join(engine,'pipeline/script-review/audit.py'),
 path.join(engine,'pipeline/turbin-angin-v2/footage-manifest.json'),
 path.join(engine,'pipeline/awan-rig-v2/rig.tsx'),
 path.join(engine,'pipeline/awan-rig-v2/props.tsx'),
 path.join(engine,'pipeline/awan-rig-v2/poses.mjs'),
 path.join(engine,'pipeline/awan-rig-v2/rig-math.mjs'),
 path.join(engine,'package-lock.json'),
 path.join(engine,'node_modules/@resvg/resvg-js/index.js'),
 path.join(engine,'node_modules/@resvg/resvg-js/js-binding.js'),
 path.join(engine,'node_modules/@resvg/resvg-js-linux-x64-gnu/resvgjs.linux-x64-gnu.node'),
 ff,ffprobe,path.join(D,'prepared.json'),...fonts,
];
// Prevent reuse after rendering code, rig math, toolchain, timing or fonts change.
function buildFingerprint(){
 const h=crypto.createHash('sha256'),buf=Buffer.allocUnsafe(1024*1024);
 h.update(`${process.version}/${process.platform}/${process.arch}\0`);
 for(const f of rendererFiles){
  h.update(path.relative(root,f));h.update('\0');const fd=fs.openSync(f,'r');
  try{let n;while((n=fs.readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,n))}finally{fs.closeSync(fd)}
  h.update('\0');
 }
 return h.digest('hex');
}
function inspectScene(file:string,expected:number){
 const p=spawnSync(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames','-of','json',file],{encoding:'utf8'});
 if(p.status!==0)throw new Error(`ffprobe failed for ${path.basename(file)}: ${String(p.stderr).slice(-300)}`);
 const v=JSON.parse(p.stdout).streams?.[0];
 if(!v||v.codec_name!=='h264'||v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||Number(v.nb_frames)!==expected)throw new Error(`Unexpected output for ${path.basename(file)}: ${JSON.stringify(v)}; expected ${expected} frames`);
 return v;
}
const C={ink:'#0b2732',deep:'#113b46',cream:'#fff4df',gold:'#f8c96f',mint:'#a9d7ce',sky:'#2e7b83',rust:'#d46d4d',white:'#fffef5'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const step=(t:number,a:number,b:number)=>smoothstep((t-a)/(b-a));
function authorization(){
 // Also run the independent timeline/cue/source validation when the renderer
 // is invoked directly, not only through build-private.sh.
 const pre=spawnSync('node',[path.join(engine,'pipeline/turbin-angin-v2/preflight.mjs'),'--stage','render','--review',reviewPath],{cwd:root,encoding:'utf8',timeout:30000});
 if(pre.status!==0)throw new Error(`Private render preflight failed: ${String(pre.stdout||pre.stderr).slice(-3000)}`);
 const glyph=spawnSync('python3',[path.join(engine,'pipeline/turbin-angin-v2/check-glyphs.py')],{cwd:root,encoding:'utf8',timeout:30000});
 if(glyph.status!==0)throw new Error(`Rendered font glyph check failed: ${String(glyph.stdout||glyph.stderr).slice(-1500)}`);
 const sb=fs.readFileSync(scriptPath),ab=fs.readFileSync(auditPath),pb=fs.readFileSync(planPath),rb=fs.readFileSync(reviewPath);
 const r=checkHumanReview(JSON.parse(rb.toString('utf8')),sb,ab,pb);
 if(!r.allowed)throw new Error(`Human review gate: ${r.issues.join('; ')}`);
 if(sha256(sb)!==data.scriptSha256||sha256(ab)!==data.auditSha256||sha256(pb)!==data.planSha256||sha256(rb)!==data.reviewSha256)throw new Error('Prepared metadata no longer matches reviewed inputs');
 const rawVoice=path.join(root,'.scratch/turbine-v2/narasi-voice-05.wav');
 if(!fs.existsSync(rawVoice)||sha256(fs.readFileSync(rawVoice))!==data.voiceSourceSha256)throw new Error('Voice take missing or changed');
 if(!fs.existsSync(data.narration)||!fs.existsSync(data.score)||sha256(fs.readFileSync(data.narration))!==data.narrationSha256||sha256(fs.readFileSync(data.score))!==data.scoreSha256)throw new Error('Prepared audio missing or changed; rerun prepare.py');
 for(const shot of timeline){
  if(!shot.footage)continue;
  const item=manifest.items.find((x:any)=>x.id===shot.footage);
  if(!item||shot.source!==path.join(root,'google_drive',item.localFilename)||!fs.existsSync(shot.source)||sha256(fs.readFileSync(shot.source))!==item.sha256)throw new Error(`Footage missing or altered: ${shot.id}`);
 }
}
function Defs(){return <><RigDefs/><PropDefs/><defs>
 <linearGradient id="skyT" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#143f50"/><stop offset=".55" stopColor="#286b6d"/><stop offset="1" stopColor="#d3b37a"/></linearGradient>
 <linearGradient id="bladeT" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#a5bfbb"/><stop offset=".55" stopColor="#fffdf1"/><stop offset="1" stopColor="#b9d5ce"/></linearGradient>
 <linearGradient id="mastT" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#829f99"/><stop offset=".55" stopColor="#f3eee0"/><stop offset="1" stopColor="#93b1a9"/></linearGradient>
 <linearGradient id="cardT" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff5e3"/><stop offset="1" stopColor="#dfd4bc"/></linearGradient>
 <mask id="footageHole"><rect width="1080" height="1920" fill="white"/><rect x="60" y="500" width="960" height="540" rx="26" fill="black"/></mask>
 </defs></>}
const Txt=({x,y,size=38,fill=C.cream,hand=false,children,anchor='start'}:{x:number;y:number;size?:number;fill?:string;hand?:boolean;children:string;anchor?:'start'|'middle'|'end'})=><text x={x} y={y} fontSize={size} fill={fill} fontFamily={hand?'Permanent Marker':'Archivo'} fontWeight={hand?400:700} textAnchor={anchor}>{children}</text>;
function Bg({footage=false}:{footage?:boolean}){return <g mask={footage?'url(#footageHole)':undefined}>
 <rect width="1080" height="1920" fill="url(#skyT)" opacity={footage ? 0.66 : 1}/><path d="M0 1475 Q180 1400 360 1450 T750 1450 T1080 1435 V1920 H0Z" fill="#244d46" opacity={footage ? 0.72 : 1}/><path d="M0 1530 Q270 1490 480 1530 T1080 1500 V1920 H0Z" fill="#183c3a" opacity={footage ? 0.84 : 1}/><rect width="1080" height="455" fill="#0c2d3b" opacity=".90"/>
 </g>}
function Title({a,b,tag}:{a:string;b:string;tag:string}){return <g><circle cx="73" cy="112" r="8" fill={C.gold}/><Txt x={94} y={122} size={25}>DUNIA KEBALIK / KNOT THEORY</Txt><path d="M66 169 H1010" stroke="#def4e5" opacity=".3" strokeWidth="3"/><Txt x={70} y={243} size={a.length>16?64:74} hand>{a}</Txt><Txt x={70} y={343} size={b.length>16?64:74} hand fill={C.gold}>{b}</Txt><Txt x={73} y={411} size={33} fill={C.mint}>{tag}</Txt></g>}
function Tag({text,x=76,y=1110}:{text:string;x?:number;y?:number}){const w=Math.min(1020-x,Math.max(205,text.length*16+45));return <g><rect x={x} y={y-40} width={w} height="54" rx="10" fill={C.ink} opacity=".94"/><Txt x={x+16} y={y} size={28} fill={C.mint}>{text}</Txt></g>}
function Cue({time}:{time:number}){const q=cues.find((v:any)=>time>=v.start&&time<v.end);if(!q)return null;const two=q.lines.length===2;return <g><rect x="76" y={two?1510:1530} width="866" height={two?154:108} rx="20" fill="#071f28" opacity=".95"/>{q.lines.map((v:string,i:number)=><Txt key={i} x={509} y={(two?1569:1597)+i*56} size={42} fill={C.white} anchor="middle">{v}</Txt>)}</g>}
function Wind({t,p=1}:{t:number;p?:number}){return <g fill="none" stroke="#cff5eb" strokeLinecap="round" opacity={.35+.25*clamp(p)}>
 {[0,1,2].map(i=><path key={i} d={`M${-180+((t*(30+i*12))%180)} ${570+i*154} Q180 ${520+i*154} 350 ${570+i*154} T700 ${570+i*154} T1110 ${540+i*154}`} strokeWidth={7+i*2}/>)}</g>}
function Turbine({x,y,angle=0,pitch=0,scale=1}:{x:number;y:number;angle?:number;pitch?:number;scale?:number}){const thin=1-.42*clamp(pitch);return <g transform={`translate(${x} ${y}) scale(${scale})`}>
 <path d="M-27 15 L-60 640 L60 640 L27 15Z" fill="url(#mastT)" stroke="#375755" strokeWidth="9"/><path d="M-18 93 L-41 610" fill="none" stroke="#fffef4" strokeWidth="7" opacity=".45"/><ellipse cx="0" cy="649" rx="137" ry="23" fill="#132d31" opacity=".25"/>
 <path d="M-15-43 Q15-68 73-47 L116-25 Q135 1 108 27 L15 35Z" fill="url(#mastT)" stroke="#375755" strokeWidth="8"/>
 <g transform={`rotate(${angle})`}>{[0,120,240].map(v=><g key={v} transform={`rotate(${v}) scale(${thin} 1)`}><path d="M-30-15 Q-43-150 -24-300 Q-18-405 -4-484 Q6-500 15-474 Q28-379 31-280 L35-18Z" fill="url(#bladeT)" stroke="#355756" strokeWidth="7" strokeLinejoin="round"/><path d="M-9-55 Q-21-238 3-450" fill="none" stroke="#fffef4" strokeWidth="7" opacity=".55"/></g>)}</g>
 <circle r="53" fill="#f6f4e9" stroke="#375755" strokeWidth="9"/><circle r="19" fill="#8ea8a4"/></g>}
function FootageFrame(){return <g><rect x="60" y="500" width="960" height="540" rx="26" fill="none" stroke="#d6f1e8" strokeWidth="7"/><rect x="610" y="988" width="395" height="46" rx="8" fill="#0b2832" opacity=".92"/><Txt x={625} y={1023} size={32} fill="#e2f6ed">FOOTAGE · KONTEKS</Txt></g>}
function HostAt({i,t,frame,talk=true,umbrella=false}:{i:number;t:number;frame:number;talk?:boolean;umbrella?:boolean}){
 const p:any=pose([0,1,2,5,6,0,5,6,1,2,3,8][i],t);p.x=245;p.y=1085;p.scale=.70;
 p.right=umbrella?[230,255]:i===3||i===6?[240+10*Math.sin(t*.8),170+20*Math.cos(t*.9)]:i===9?[245+12*Math.sin(t*.8),195+95*step(t,1,3)]:i===11?[225+36*Math.sin(t*1.5),230+30*Math.cos(t)]:[235+15*Math.sin(t*.8),250+18*Math.cos(t*.9)];
 p.left=i===10?[-165,285+25*Math.sin(t)]:i===11?[-180,300+30*Math.sin(t*.8)]:[-145,390+15*Math.sin(t*.7)];
 return <Host {...p} frame={frame} talk={talk} gripR={umbrella} rightAccessory={umbrella?<UmbrellaAtGrip open={1}/>:undefined}/>;
}
function Card({x=480,y=1080,w=500,h=330,children}:{x?:number;y?:number;w?:number;h?:number;children:React.ReactNode}){return <g><rect x={x} y={y} width={w} height={h} rx="25" fill="url(#cardT)" stroke="#456c63" strokeWidth="7"/>{children}</g>}
function Airfoil({x,y,angle=0,s=1}:{x:number;y:number;angle:number;s?:number}){return <g transform={`translate(${x} ${y}) scale(${s})`}><circle r="150" fill="#bce0d6" opacity=".3"/><circle r="150" fill="none" stroke="#6c9b8e" strokeWidth="4" strokeDasharray="12 12"/><g transform={`rotate(${angle})`}><path d="M-125 0 Q-65-45 58-19 L125 0 Q58 23-60 27 Q-105 22-125 0Z" fill="#f8f6ea" stroke="#385d59" strokeWidth="7"/><path d="M-85 0 Q-8-18 88-3" stroke="#a5c9be" strokeWidth="5" fill="none"/></g><circle r="11" fill={C.rust} stroke="#fff" strokeWidth="4"/></g>}
function Arrow({x,y,dx,dy,color=C.gold}:{x:number;y:number;dx:number;dy:number;color?:string}){const a=Math.atan2(dy,dx),ex=x+dx,ey=y+dy;return <g fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"><path d={`M${x} ${y} L${ex} ${ey}`}/><path d={`M${ex-20*Math.cos(a-.5)} ${ey-20*Math.sin(a-.5)} L${ex} ${ey} L${ex-20*Math.cos(a+.5)} ${ey-20*Math.sin(a+.5)}`}/></g>}
function Peak({i,t,frame,talk}:{i:number;t:number;frame:number;talk:boolean}){
 // Use the last encoded frame before the visual teaser cut as the preview
 // endpoint, so that still and S06's first still share the same model.
 const span=(i===0?data.openingVisualCutFrame-1:timeline[i].endFrame-timeline[i].startFrame-1)/fps;
 const s=i===0?openingPeak(t/span):returnPeak(t/span);const a=s.angleRadians*180/Math.PI;
 const pp=pose(0,s.progress*3) as any;pp.x=245;pp.y=1085;pp.scale=.71;pp.right=[245,225+20*s.progress];pp.left=[-155,330];
 return <><Bg/><Title a="ANGIN KENCANG" b="TURBIN DIAM?" tag="SAAT YANG DIBUTUHKAN JADI TERLALU KUAT"/><Wind t={s.progress*5} p={s.windStrength}/>
  <Turbine x={625} y={930} scale={.88} angle={a} pitch={(s.pitchDegrees-8)/77}/>
  <Tag text="ILUSTRASI" x={80} y={510}/><Host {...pp} frame={Math.round(s.progress*120)} talk={talk}/>
  {i===5&&<g opacity={step(t,1.0,2.4)}><rect x="490" y="1180" width="474" height="72" rx="16" fill={C.ink}/><Txt x={727} y={1228} size={28} fill={C.gold} anchor="middle">BATAS OPERASI MODEL</Txt></g>}
 </>
}
function HookBridge({t,frame,talk}:{t:number;frame:number;talk:boolean}){
 const local=t-data.openingVisualCutFrame/fps,s=openingPeak(1);
 return <><Bg/><Title a="BUTUH ANGIN" b="KOK DIAM?" tag="TURBIN JUGA PUNYA BATAS KERJA"/><Wind t={local+2} p={.9}/>
  <Turbine x={700} y={850} scale={.72} angle={s.angleRadians*180/Math.PI} pitch={(s.pitchDegrees-8)/77}/>
  <Tag text="ILUSTRASI" x={80} y={510}/><HostAt i={0} t={local} frame={frame} talk={talk}/>
  <g opacity={step(local,.2,.8)}><circle cx="835" cy="1170" r="115" fill={C.gold} stroke={C.ink} strokeWidth="10"/><rect x="783" y="1105" width="38" height="130" rx="11" fill={C.ink}/><rect x="850" y="1105" width="38" height="130" rx="11" fill={C.ink}/></g>
 </>;
}
function Light({x,y,on=1}:{x:number;y:number;on?:number}){return <g transform={`translate(${x} ${y})`}><circle r="58" fill={on?'#ffdc7c':'#a9c5b7'} stroke="#315b56" strokeWidth="7"/><path d="M-24 48 V77 H24 V48 M-22 61 H22 M-15 78 Q0 92 15 78" fill="#d1b786" stroke="#315b56" strokeWidth="7"/><path d="M-18-4 L-4 10 L4-8 L20 8" fill="none" stroke="#93672f" strokeWidth="5"/></g>}
function Scene({i,t,frame,time,quiet=false}:{i:number;t:number;frame:number;time:number;quiet?:boolean}){
 const has=!!timeline[i].footage,talk=!quiet&&cues.some((q:any)=>time>=q.start&&time<q.end),a=step(t,.2,2),b=step(t,1.2,3.8);
 if(i===0&&frame>=data.openingVisualCutFrame)return <HookBridge t={t} frame={frame} talk={talk}/>;
 if(i===0||i===5)return <Peak i={i} t={t} frame={frame} talk={talk}/>;
 if(i===1)return <><Bg footage/><Title a="MAKIN KENCANG" b="MAKIN BANYAK?" tag="DUGAAN AWAL · BUKAN DATA VIDEO"/><FootageFrame/><HostAt i={i} t={t} frame={frame} talk={talk}/><Card><Txt x={730} y={1138} size={29} fill={C.ink} anchor="middle">ANGIN & DAYA</Txt><path d="M545 1320 H918 M550 1320 V1190" fill="none" stroke="#446b5f" strokeWidth="6"/><path d={`M570 1295 Q710 ${1295-75*a} 880 ${1280-105*a}`} fill="none" stroke={C.rust} strokeWidth="12" strokeLinecap="round"/><Light x={830} y={1220} on={a}/></Card></>;
 if(i===2)return <><Bg footage/><Title a="ANGIN KUAT" b="BEBAN BESAR" tag="PAYUNG = ANALOGI BEBAN"/><FootageFrame/><HostAt i={i} t={t} frame={frame} talk={talk} umbrella/><Card x={520} y={1105} w={455} h={285}><Txt x={748} y={1162} size={29} fill={C.ink} anchor="middle">TERPAAN ANGIN</Txt><Arrow x={585} y={1220} dx={290*a} dy={0} color={C.rust}/><Arrow x={585} y={1280} dx={240*a} dy={0} color="#4c9087"/><Txt x={748} y={1350} size={29} fill="#315b53" anchor="middle">BUKAN MEKANISME IDENTIK</Txt></Card></>;
 if(i===3)return <><Bg footage/><Title a="SUDUT BILAH" b="MULAI DIATUR" tag="DAYA TERKENDALI · ILUSTRASI"/><FootageFrame/>
  <g opacity={step(t,.8,1.8)}><rect x="60" y="500" width="960" height="540" rx="26" fill="url(#cardT)" stroke="#bddcd0" strokeWidth="7"/><Txt x={540} y={570} size={33} fill={C.ink} anchor="middle">PENAMPANG BILAH / SKEMA</Txt><Arrow x={145} y={755} dx={790} dy={0} color="#71afa0"/><Airfoil x={540} y={765} angle={-45+20*b} s={1.16}/><Txt x={540} y={985} size={34} fill="#315b53" anchor="middle">TITIK = SUMBU PANJANG</Txt></g>
  <HostAt i={i} t={t} frame={frame} talk={talk}/><Card x={500} y={1110} w={470} h={290}><Txt x={735} y={1175} size={29} fill={C.ink} anchor="middle">DAYA DIATUR</Txt><Turbine x={635} y={1250} scale={.17} angle={80*a}/><Arrow x={690} y={1255} dx={70} dy={0} color={C.rust}/><Light x={840} y={1255} on={a}/></Card></>;
 if(i===4)return <><Bg footage/><Title a="MASIH BERPUTAR" b="MASIH BEKERJA" tag="KONTROL DAYA BUKAN BERHENTI"/><FootageFrame/><HostAt i={i} t={t} frame={frame} talk={talk}/><Card><Txt x={730} y={1145} size={28} fill={C.ink} anchor="middle">DAYA DIATUR</Txt><path d="M550 1330 H910 M550 1330 V1200" fill="none" stroke="#52746b" strokeWidth="6"/><path d="M575 1300 Q640 1212 720 1210 H890" fill="none" stroke={C.rust} strokeWidth="12" strokeLinecap="round"/><circle cx={575+290*a} cy={1300-90*Math.min(1,a*2)} r="12" fill={C.gold} stroke={C.ink} strokeWidth="5"/></Card><Tag text="KURVA SKEMATIS" x={548} y={1460}/></>;
 if(i===6)return <><Bg footage/><Title a="BILAH DIPUTAR" b="PADA SUMBUNYA" tag="SKEMA PITCH · BUKAN REKAMAN"/><FootageFrame/>
  <g opacity={step(t,.8,1.8)}><rect x="60" y="500" width="960" height="540" rx="26" fill="url(#cardT)" stroke="#bddcd0" strokeWidth="7"/><Txt x={540} y={570} size={33} fill={C.ink} anchor="middle">LEBIH SEJAJAR ANGIN</Txt><Arrow x={150} y={720} dx={780} dy={0} color="#70ac9f"/><Arrow x={150} y={825} dx={780} dy={0} color="#70ac9f"/><Airfoil x={540} y={770} angle={-45+45*b} s={1.16}/><Txt x={540} y={985} size={34} fill="#315b53" anchor="middle">TITIK = SUMBU PANJANG</Txt></g>
  <HostAt i={i} t={t} frame={frame} talk={talk}/><Card x={500} y={1110} w={470} h={290}><Txt x={735} y={1175} size={29} fill={C.ink} anchor="middle">GAYA PUTAR</Txt><Arrow x={555} y={1260} dx={320-180*b} dy={0} color={C.rust}/><Txt x={735} y={1362} size={30} fill="#315b53" anchor="middle">BERKURANG</Txt></Card></>;
 if(i===7)return <><Bg footage/><Title a="ANGIN REDA" b="BISA BEKERJA" tag="KETIKA KONDISI MEMUNGKINKAN"/><FootageFrame/><HostAt i={i} t={t} frame={frame} talk={talk}/><Card><Txt x={730} y={1140} size={28} fill={C.ink} anchor="middle">KEMBALI AMAN</Txt><Turbine x={625} y={1240} scale={.16} angle={40*a}/><Light x={850} y={1260} on={a}/><Arrow x={685} y={1260} dx={70} dy={0} color={C.rust}/><Txt x={730} y={1390} size={30} fill="#315b53" anchor="middle">RESTART ILUSTRASI</Txt></Card></>;
 if(i===8)return <><Bg/><Title a="TURBIN DIAM" b="BELUM TENTU" tag="PENYEBABNYA BISA BERBEDA"/><Wind t={t} p={.35}/><Turbine x={670} y={870} scale={.70} angle={25}/><HostAt i={i} t={t} frame={frame} talk={talk}/><circle cx="840" cy="720" r="98" fill={C.gold} stroke={C.ink} strokeWidth="8"/><Txt x={840} y={762} size={115} fill={C.ink} anchor="middle">?</Txt><Tag text="ILUSTRASI · SEBAB BELUM PASTI" x={440} y={1435}/></>;
 if(i===9)return <><Bg footage/><Title a="BISA PELAN" b="BISA DIRAWAT" tag="DUA KEMUNGKINAN, BUKAN DIAGNOSIS"/><FootageFrame/><HostAt i={i} t={t} frame={frame} talk={talk}/><Card x={480} y={1090} w={500} h={340}><path d="M515 1257 H945" stroke="#aac6b5" strokeWidth="4"/><Txt x={730} y={1162} size={30} fill={C.ink} anchor="middle">ANGIN TERLALU PELAN</Txt><Arrow x={635} y={1207} dx={170*a} dy={0} color="#5b9b8d"/><Txt x={730} y={1324} size={30} fill={C.ink} anchor="middle">PEMELIHARAAN</Txt><path d="M670 1360 L790 1360" stroke={C.rust} strokeWidth="13" strokeLinecap="round"/></Card></>;
 if(i===10)return <><Bg footage/><Title a="LIHAT VIDEO" b="BELUM CUKUP" tag="JANGAN MENYIMPULKAN SEBABNYA"/><FootageFrame/><HostAt i={i} t={t} frame={frame} talk={talk}/><Card><circle cx="730" cy="1240" r="100" fill="#c8e9df" stroke="#436c65" strokeWidth="8"/><Txt x={730} y={1280} size={120} fill={C.rust} anchor="middle">?</Txt><Txt x={730} y={1400} size={30} fill={C.ink} anchor="middle">BUTUH DATA KONDISI</Txt></Card></>;
 return <><Bg/><Title a="TEBAKANMU" b="APA?" tag="BERBAGAI PENYEBAB MUNGKIN"/><Turbine x={720} y={785} scale={.62} angle={25}/><HostAt i={i} t={t} frame={frame} talk={talk}/><g opacity={a}><rect x="485" y="1115" width="480" height="68" rx="16" fill={C.ink}/><Txt x={725} y={1160} size={32} anchor="middle">ANGIN PELAN?</Txt><rect x="485" y="1200" width="480" height="68" rx="16" fill={C.ink}/><Txt x={725} y={1245} size={32} anchor="middle">PERAWATAN? / LAINNYA?</Txt></g><g opacity={step(t,3.3,4.3)}><rect x="445" y="1343" width="540" height="90" rx="45" fill={C.gold}/><Txt x={715} y={1402} size={42} fill={C.ink} anchor="middle">ikuti knot theory</Txt></g><Tag text="ILUSTRASI" x={75} y={510}/></>;
}
function Artwork({i,t,normalizeContinuity=false}:{i:number;t:number;normalizeContinuity?:boolean}){const time=timeline[i].start+t,frame=Math.round(t*fps);return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><Defs/><Scene i={i} t={t} frame={frame} time={time} quiet={normalizeContinuity}/>{!normalizeContinuity&&<Cue time={time}/>}</svg>}
function Thumbnail(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
 <Defs/><defs><linearGradient id="thumbSky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#112d3c"/><stop offset=".56" stopColor="#204d52"/><stop offset="1" stopColor="#9d6148"/></linearGradient><radialGradient id="thumbGlow"><stop stopColor="#ffe4a8" stopOpacity=".9"/><stop offset="1" stopColor="#efac71" stopOpacity="0"/></radialGradient></defs>
 <rect width="1080" height="1920" fill="url(#thumbSky)"/><ellipse cx="700" cy="855" rx="570" ry="600" fill="url(#thumbGlow)"/>
 <path d="M-90 705 Q170 565 440 645 T1150 560 M-90 875 Q175 730 425 805 T1150 720 M-80 1065 Q180 920 430 990 T1150 900" fill="none" stroke="#d4f5e6" strokeWidth="22" opacity=".5" strokeLinecap="round"/>
 <path d="M0 1515 Q310 1390 630 1505 T1080 1450 V1920 H0Z" fill="#12352f"/><Turbine x={670} y={900} scale={.88} angle={-16} pitch={.75}/>
 <Host x={205} y={1140} scale={.77} frame={15} emotion="surprised" left={[-165,315]} right={[225,205]} talk={false}/>
 <g transform="rotate(-8 858 1160)"><circle cx="858" cy="1160" r="145" fill="#cb5c45" stroke="#fff0ce" strokeWidth="12"/><circle cx="858" cy="1160" r="123" fill="none" stroke="#6e2d2e" strokeWidth="6"/><rect x="800" y="1079" width="42" height="160" rx="12" fill="#fff5dc"/><rect x="873" y="1079" width="42" height="160" rx="12" fill="#fff5dc"/></g>
 <rect width="1080" height="425" fill="#0b2938" opacity=".91"/><Txt x={70} y={100} size={27} fill={C.mint}>KNOT THEORY / DUNIA KEBALIK</Txt><Txt x={67} y={215} size={77} hand>ANGIN MENGAMUK</Txt><Txt x={67} y={315} size={77} hand fill={C.gold}>TURBIN MALAH</Txt><Txt x={67} y={402} size={90} hand fill={C.white}>DIAM?!</Txt>
 <Tag text="ILUSTRASI" x={70} y={490}/><rect x="400" y="1450" width="610" height="100" rx="25" fill="#0b2938" stroke="#f3d69a" strokeWidth="5"/><Txt x={705} y={1516} size={43} anchor="middle">LAH, KOK DI-PAUSE?</Txt>
 </svg>}
function Poster(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><Defs/><rect width="1080" height="1350" fill="url(#skyT)"/><rect width="1080" height="455" fill="#0c2d3b" opacity=".8"/><Title a="ANGIN KENCANG" b="TURBIN DIAM?" tag="MESIN PUNYA BATAS KERJA"/><Turbine x={650} y={810} scale={.72} angle={15}/><Host x={210} y={870} scale={.60} frame={30} emotion="surprised" left={[-150,390]} right={[235,230]} talk={false}/><Tag text="ILUSTRASI" x={80} y={510}/></svg>}
const raster=(el:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(el),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo'}}).render().asPng());
const png=(i:number,t:number)=>raster(<Artwork i={i} t={t}/>);
function sample(i:number,t:number,name:string){
 const overlay=png(i,t),dest=path.join(D,name),source=timeline[i].source;
 if(process.env.DEBUG_SAMPLE==='1'&&source)fs.writeFileSync(path.join(D,`debug-${timeline[i].id}.png`),overlay);
 if(!source){fs.writeFileSync(dest,overlay);return}
 // Never accept an old sample if a zero-exit FFmpeg call produced no frame.
 const temp=dest+'.partial.png';if(fs.existsSync(temp))fs.unlinkSync(temp);
 const filter='[0:v]split=2[wide][back];[back]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,boxblur=14:3,scale=1080:1920,setsar=1[blur];[wide]scale=960:540,setsar=1[clip];[blur][clip]overlay=60:500[bg];[bg][1:v]overlay=0:0';
 const args=['-nostdin','-hide_banner','-loglevel','error','-y','-ss',String(Math.max(0,t+timeline[i].sourceOffset)),'-i',source,'-f','image2pipe','-vcodec','png','-i','pipe:0','-filter_complex',filter,'-frames:v','1',temp];
 const r=spawnSync(ff,args,{input:overlay,timeout:60000,maxBuffer:4*1024*1024});
 if(r.status!==0||!fs.existsSync(temp)||fs.statSync(temp).size<1000){if(fs.existsSync(temp))fs.unlinkSync(temp);throw new Error(`Sample ${i} failed: ${String(r.stderr).slice(-500)}`)}
 fs.renameSync(temp,dest);
}
async function renderScene(i:number){
 if(!Number.isInteger(i)||i<0||i>=timeline.length)throw new Error('Invalid scene index');
 const scene=timeline[i],n=scene.endFrame-scene.startFrame,source=scene.source,out=path.join(D,`scene-${scene.id}.mp4`),receipt=out+'.json';
 const fingerprint=buildFingerprint();
 // A partial/failing render must never inherit the previous success receipt.
 if(fs.existsSync(receipt))fs.unlinkSync(receipt);
 const args=['-nostdin','-hide_banner','-loglevel','error','-y'];
 if(source)args.push('-ss',String(scene.sourceOffset),'-i',source);else args.push('-f','lavfi','-i','color=c=black:s=1080x1920:r=30');
 args.push('-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0');
 const filter=source?'[0:v]setpts=PTS-STARTPTS,fps=30,split=2[wide][back];[back]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,boxblur=14:3,scale=1080:1920,setsar=1[blur];[wide]scale=960:540,setsar=1[clip];[blur][clip]overlay=60:500[bg];[bg][1:v]overlay=0:0:shortest=1,format=yuv420p[v]':'[0:v][1:v]overlay=0:0:shortest=1,format=yuv420p[v]';
 args.push('-filter_complex',filter,'-map','[v]','-frames:v',String(n),'-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-video_track_timescale','90000',out);
 const log=fs.createWriteStream(out+'.log'),child=spawn(ff,args,{stdio:['pipe','ignore','pipe']});child.stderr.pipe(log);child.stdin.on('error',()=>{});
 for(let f=0;f<n;f++){if(!child.stdin.write(png(i,f/fps)))await once(child.stdin,'drain');if(f%120===0)console.log(`${scene.id}: frame ${f}/${n}`)}
 child.stdin.end();const [code]=await once(child,'close');if(code!==0)throw new Error(`${scene.id} FFmpeg exit ${code}`);
 const stream=inspectScene(out,n);
 if(buildFingerprint()!==fingerprint)throw new Error('Source/timing changed during render; discard this scene.');
 fs.writeFileSync(receipt,JSON.stringify({scene:scene.id,frames:n,fingerprint,sha256:sha256(fs.readFileSync(out)),stream},null,2)+'\n');
 console.log(`${scene.id}: verified ${n} frames`);
}
function verifyReceipt(s:any,fingerprint:string){
 const f=path.join(D,`scene-${s.id}.mp4`),r=f+'.json';
 if(!fs.existsSync(f)||!fs.existsSync(r))throw new Error(`Missing rendered scene or receipt: ${s.id}`);
 const receipt=JSON.parse(fs.readFileSync(r,'utf8')),n=s.endFrame-s.startFrame;
 if(receipt.scene!==s.id||receipt.frames!==n||receipt.fingerprint!==fingerprint||receipt.sha256!==sha256(fs.readFileSync(f)))throw new Error(`Stale or changed scene: ${s.id}`);
 inspectScene(f,n);
}
function assemble(){
 const concat=path.join(D,'scenes.txt');fs.writeFileSync(concat,timeline.map((s:any)=>`file 'scene-${s.id}.mp4'\nduration ${((s.endFrame-s.startFrame)/fps).toFixed(9)}\n`).join(''));
 const fingerprint=buildFingerprint();
 for(const s of timeline)verifyReceipt(s,fingerprint);
 const out=path.join(D,'turbin-angin-draf-privat.mp4'),args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',data.narration,'-i',data.score,'-filter_complex','[1:a]volume=1.8[v];[2:a]volume=0.40[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-3.5:LRA=11[a]','-map','0:v:0','-map','[a]','-t',String(duration),'-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out];
 const r=spawnSync(ff,args,{stdio:'inherit'});if(r.status!==0)throw new Error(`Assembly exit ${r.status}`);console.log(`Private draft assembled: ${out}`);
}
async function main(){
 authorization();
 if(process.argv.includes('--continuity-check')){
  const last=(data.openingVisualCutFrame-1)/fps;
  // Dialogue/subtitle are different at the two moments. Compare underlying
  // scene art with cues omitted and the host mouth normalized; actual output
  // still uses its own dialogue and lip state at both moments.
  const firstPng=raster(<Artwork i={5} t={0} normalizeContinuity/>),lastPng=raster(<Artwork i={0} t={last} normalizeContinuity/>);
  if(!lastPng.equals(firstPng)){
   fs.writeFileSync(path.join(D,'continuity-last-S01.png'),lastPng);fs.writeFileSync(path.join(D,'continuity-first-S06.png'),firstPng);
   throw new Error('Normalized preview and returning artwork differ; inspect saved stills.');
  }
  console.log('Normalized preview and returning artwork match pre-encode; subtitles and host mouth are excluded.');return;
 }
 if(process.argv.includes('--samples')){
  sample(0,0,'sample-S01-frame0.png');
  sample(0,(data.openingVisualCutFrame-1)/fps,'sample-S01-before-cut.png');
  sample(0,data.openingVisualCutFrame/fps,'sample-S01-after-cut.png');
  for(let i=0;i<timeline.length;i++){const d=timeline[i].end-timeline[i].start;sample(i,d*.28,`sample-${timeline[i].id}-a.png`);sample(i,d*.72,`sample-${timeline[i].id}-b.png`)}
  fs.writeFileSync(path.join(D,'turbin-thumbnail-draf.png'),raster(<Thumbnail/>));fs.writeFileSync(path.join(D,'turbin-poster-4x5-draf.png'),raster(<Poster/>));console.log('Samples, standalone thumbnail and poster written.');return;
 }
 const idx=process.argv.indexOf('--scene');if(idx>=0){await renderScene(Number(process.argv[idx+1]));return}
 if(process.argv.includes('--all')){
  const fingerprint=buildFingerprint();
  for(let i=0;i<timeline.length;i++){
   let ready=false;try{verifyReceipt(timeline[i],fingerprint);ready=true}catch{/* missing/stale: render again */}
   if(ready)console.log(`${timeline[i].id}: reuse verified scene`);else await renderScene(i);
  }
  assemble();return;
 }
 if(process.argv.includes('--assemble')){assemble();return}
 throw new Error('Use --samples, --continuity-check, --scene INDEX, --assemble or --all');
}
main().catch(e=>{console.error(e);process.exitCode=1});
