/*
 * One timeline: seven animated scenes from pause-snapped offsets of the user's
 * single narration. React/SVG -> resvg -> FFmpeg; illustration, not science.
 * This renderer does not connect to Drive or a publishing service.
 */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import {Host} from './host';

const root=process.cwd(), dir=path.join(root,'deliverables/teleskop-2026-11-12');
const data=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json'),'utf8'));
const {story,timeline,cues,duration,fps}=data;
const art=Object.fromEntries(Object.entries(data.art).map(([key,v]:[string,any])=>[key,'data:image/jpeg;base64,'+fs.readFileSync(v.render).toString('base64')]));
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const C={deep:'#071e26',navy:'#0b2c36',teal:'#216d6d',mint:'#abe1c7',cream:'#fff3d9',gold:'#f2c473',copper:'#c2754d',blue:'#74bfd0',ink:'#112f35',white:'#fffaf0'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};const enter=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
const T=({x,y,children,size=38,fill=C.cream,anchor='start',family='Archivo SemiBold',weight=700,opacity=1}:{x:number;y:number;children:string;size?:number;fill?:string;anchor?:'start'|'middle'|'end';family?:string;weight?:number;opacity?:number})=><text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} fontFamily={family} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Brand=()=><g><circle cx="82" cy="145" r="10" fill={C.gold}/><T x={105} y={154} size={25}>KNOT THEORY  /  DUNIA KEBALIK</T></g>;
const Heading=({s}:{s:any})=><g><Brand/>{s.heading.map((v:string,i:number)=><T key={i} x={75} y={278+i*91} size={76} family="Permanent Marker" weight={400} fill={i?C.gold:C.cream}>{v}</T>)}<T x={80} y={434} size={29} fill={C.mint} weight={600}>{s.sub}</T></g>;
const Bg=({name,t,dark=.27}:{name:string;t:number;dark?:number})=><g><rect width="1080" height="1920" fill={C.deep}/><g transform={`translate(540 925) scale(${1+Math.min(t,10)*.0022}) translate(-540 -925)`}><image href={art[name]} width="1080" height="1920" preserveAspectRatio="xMidYMid slice"/></g><rect width="1080" height="1920" fill={C.deep} opacity={dark}/><rect width="1080" height="485" fill={C.deep} opacity=".30"/></g>;
const Label=({text='ILUSTRASI',x=70,y=1445}:{text?:string;x?:number;y?:number})=><g><rect x={x} y={y-29} width={Math.max(145,text.length*12+28)} height="39" rx="7" fill={C.deep} opacity=".90"/><T x={x+13} y={y-2} size={19}>{text}</T></g>;
const Panel=({x,y,w,h,fill=C.navy}:{x:number;y:number;w:number;h:number;fill?:string})=><rect x={x} y={y} width={w} height={h} rx="25" fill={fill} fillOpacity=".94" stroke={C.mint} strokeWidth="4"/>;
const Cue=({t}:{t:number})=>{const q=cues.find((v:any)=>t>=v.start&&t<v.end);if(!q)return null;const two=q.lines.length===2;return <g><rect x="66" y={two?1490:1510} width="948" height={two?165:110} rx="18" fill="#06151c" opacity=".92"/>{q.lines.map((line:string,i:number)=><T key={i} x={540} y={(two?1550:1582)+i*57} size={43} anchor="middle" fill="#fff">{line}</T>)}</g>};
const Stars=({t}:{t:number})=><g>{Array.from({length:26},(_,k)=>{const x=(k*151+57)%1000+40,y=500+(k*233)%690,o=.22+.5*Math.abs(Math.sin(t*.9+k*.9)),r=k%4===0?4:2.4;return <circle key={k} cx={x} cy={y} r={r} fill={k%3?C.cream:C.gold} opacity={o}/>;})}</g>;
/* Handheld brass spyglass, drawn as an icon; never a real instrument photo. */
const Scope=({x,y,s=1,rot=-48}:{x:number;y:number;s?:number;rot?:number})=><g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><rect x="-118" y="-19" width="52" height="38" rx="10" fill={C.copper} stroke={C.deep} strokeWidth="8"/><rect x="-95" y="-27" width="172" height="54" rx="15" fill={C.gold} stroke={C.deep} strokeWidth="8"/><rect x="58" y="-20" width="76" height="40" rx="11" fill={C.copper} stroke={C.deep} strokeWidth="8"/><circle cx="136" cy="0" r="11" fill={C.mint} stroke={C.deep} strokeWidth="7"/></g>;
const Chip=({x,y,text,delay=2,fill=C.gold,color=C.deep,w}:{x:number;y:number;text:string;delay?:number;fill?:string;color?:string;w?:number})=>{const a=enter(t_global,delay,delay+1);const width=w??text.length*22+56;return <g opacity={a} transform={`translate(0 ${(1-a)*46})`}><rect x={x-width/2} y={y-44} width={width} height="88" rx="17" fill={fill} stroke={C.deep} strokeWidth="5"/><T x={x} y={y+13} size={34} fill={color} anchor="middle">{text}</T></g>;};
let t_global=0;
const Flow=({t,x1,x2,y,n=4,color=C.cream}:{t:number;x1:number;x2:number;y:number;n?:number;color?:string})=><g>{Array.from({length:n},(_,k)=>{const s=(t*.10+k/n)%1,x=x1+(x2-x1)*s;return <circle key={k} cx={x} cy={y+6*Math.sin(s*Math.PI)} r={7} fill={color} opacity={.9*Math.sin(s*Math.PI)}/>;})}</g>;
const Ray=({t,x1,y1,x2,y2,seed=0}:{t:number;x1:number;y1:number;x2:number;y2:number;seed?:number})=>{const L=Math.hypot(x2-x1,y2-y1);return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.gold} strokeWidth="7" strokeDasharray="16 13" strokeLinecap="round" opacity=".9" strokeDashoffset={-(t*130+seed)}/><circle r={9} fill={C.cream} cx={x1+(x2-x1)*((t*.10+seed)%1)} cy={y1+(y2-y1)*((t*.10+seed)%1)}/></g>;};

function Scene({i,t,frame,len}:{i:number;t:number;frame:number;len:number}){
 const s=story.scenes[i],f=frame;t_global=t;
 if(i===0){const a=enter(t,.4,1.6);return <><Bg name="night" t={t} dark={.16}/><Stars t={t}/><Heading s={s}/>
  <circle cx="620" cy="760" r={7+2.2*Math.abs(Math.sin(f*.11))} fill={C.gold} opacity={a}/>
  <line x1="620" y1="772" x2="305" y2="1112" stroke={C.gold} strokeWidth="6" strokeDasharray="4 15" strokeLinecap="round" opacity={.85*a}/>
  <Host x={250} y={935} scale={.62} frame={f} armL={60} armR={-20} talk/>
  <Scope x={231} y={1218} s={.62} rot={-48}/>
  <Label text="ILUSTRASI"/></>;}
 if(i===1){const a=enter(t,.5,1.7);const s2=(t*.09)%1,bx=940-610*s2,by=560+880*s2;return <><Bg name="sun" t={t} dark={.30}/><Heading s={s}/>
  <g opacity={a}><circle cx={bx} cy={by} r={10} fill={C.cream}/><circle cx={bx} cy={by} r={19} fill={C.cream} opacity={.35*(1-s2)}/></g>
  <Chip x={620} y={900} text="8 MNT 20 DTK" delay={2.4}/>
  <T x={620} y={1005} size={27} anchor="middle" opacity={enter(t,3.2,4.2)}>CAHAYA MATAHARI KE BUMI</T>
  <Host x={880} y={1010} scale={.48} frame={f} armL={60} armR={-88} talk/>
  <Label text="SKEMA • TIDAK BERSKALA"/></>;}
 if(i===2){const a=enter(t,1.2,2.4);return <><Bg name="galaxy" t={t} dark={.24}/><Heading s={s}/>
  <g opacity={a}><ellipse cx="600" cy="880" rx="262" ry="158" fill="none" stroke={C.mint} strokeWidth="6" strokeDasharray="20 16" opacity=".9" transform={`rotate(${t*4} 600 880)`}/></g>
  <Chip x={640} y={1300} text="2,5 JUTA TAHUN CAHAYA" delay={2.8}/>
  <Host x={205} y={880} scale={.66} frame={f} armL={42} armR={-80} talk/>
  <Label text="ILUSTRASI GALAKSI"/></>;}
 if(i===3){const a=enter(t,.5,1.7),b=enter(t,2.6,3.8),c=enter(t,4.4,5.6);return <><Bg name="galaxy" t={t} dark={.58}/><Heading s={s}/>
  <Panel x={75} y={505} w={930} h={800}/>
  <g opacity={a}><line x1="215" y1="880" x2="865" y2="880" stroke={C.mint} strokeWidth="9" strokeLinecap="round"/><circle cx="215" cy="880" r="17" fill={C.gold}/><circle cx="865" cy="880" r="17" fill={C.gold}/></g>
  <g opacity={a}><Ray t={t} x1={232} y1={880} x2={848} y2={880} seed={.3}/></g>
  <T x={215} y={955} size={29} anchor="middle" opacity={a}>BERANGKAT</T><T x={215} y={995} size={25} fill={C.gold} anchor="middle" opacity={a}>2,5 JT TAHUN LALU</T>
  <T x={865} y={955} size={29} anchor="middle" opacity={a}>TIBA</T><T x={865} y={995} size={25} fill={C.gold} anchor="middle" opacity={a}>HARI INI</T>
  <g opacity={b} transform={`translate(0 ${(1-b)*40})`}><circle cx="540" cy="672" r="34" fill={C.cream} stroke={C.deep} strokeWidth="6"/><path d="M498 812 Q540 726 582 812" fill={C.cream} stroke={C.deep} strokeWidth="6"/><T x={540} y={862} size={25} anchor="middle">SEBELUM MANUSIA MODERN</T></g>
  <Chip x={540} y={1150} text="CAHAYA LAMA, TIBA HARI INI" delay={4.8} fill={C.cream} color={C.deep}/>
  <Host x={150} y={1065} scale={.38} frame={f} armL={45} armR={-70} talk/>
  <T x={540} y={1372} size={27} anchor="middle" opacity={c}>FOTO LAMA DARI LANGIT</T>
  <Label text="SKEMA WAKTU" y={1445}/></>;}
 if(i===4){const a=enter(t,.6,2);return <><Bg name="deepfield" t={t} dark={.38}/><Heading s={s}/>
  {Array.from({length:12},(_,k)=>{const x=[250,420,610,780,330,540,700,880,200,470,640,820][k],y=[700,640,760,690,930,880,950,900,1140,1090,1180,1120][k],d=1+k*.45,o=enter(t,d,d+1)*(.75+.25*Math.sin(t*2+k));return <g key={k}><circle cx={x} cy={y} r={8} fill={k%2?C.mint:C.gold} opacity={o}/><circle cx={x} cy={y} r={16} fill={k%2?C.mint:C.gold} opacity={o*.28}/></g>;})}
  <Chip x={620} y={1330} text="INFRAMERAH" delay={1.8}/>
  <Host x={880} y={1005} scale={.5} frame={f} armL={70} armR={-75} talk/>
  <T x={540} y={1425} size={26} anchor="middle" opacity={a}>GALAKSI-GALAKSI MASA AWAL MENYALA</T>
  <Label text="SKEMA • BUKAN FOTO" y={1478}/></>;}
 if(i===5){const a=enter(t,.5,1.8),b=enter(t,1.8,2.9),c=enter(t,3.2,4.3),d=enter(t,4.6,5.7);return <><Bg name="deepfield" t={t} dark={.60}/><Heading s={s}/>
  <Panel x={75} y={505} w={930} h={800}/>
  <g opacity={a}><line x1="150" y1="985" x2="930" y2="985" stroke={C.mint} strokeWidth="9" strokeLinecap="round"/>
   {Array.from({length:9},(_,k)=><line key={k} x1={150+k*97.5} y1="972" x2={150+k*97.5} y2="998" stroke={C.mint} strokeWidth="5"/>)}
   <circle cx="150" cy="985" r="16" fill={C.gold}/><circle cx="930" cy="985" r="16" fill={C.cream}/>
   <T x={150} y={1055} size={27} anchor="middle">BIG BANG</T><T x={930} y={1055} size={27} anchor="middle">SEKARANG</T></g>
  <Flow t={t} x1={160} x2={920} y={985} n={5} color={C.gold}/>
  <g opacity={b} transform={`translate(0 ${(1-b)*40})`}><circle cx="205" cy="985" r="26" fill={C.gold} stroke={C.deep} strokeWidth="7"/><line x1="205" y1="860" x2="205" y2="959" stroke={C.gold} strokeWidth="8" strokeDasharray="10 8"/><rect x="88" y="770" width="234" height="86" rx="14" fill={C.gold}/><T x="205" y="826" size={27} fill={C.deep} anchor="middle">280 JUTA TAHUN</T></g>
  <g opacity={c} transform={`translate(0 ${(1-c)*40})`}><rect x="470" y="640" width="460" height="180" rx="19" fill="#286e71" stroke={C.mint} strokeWidth="4"/><T x="700" y="725" size={46} fill={C.gold} anchor="middle">MOMZ14</T><T x="700" y="780" size={27} anchor="middle">DIKONFIRMASI JANUARI 2026</T></g>
  <Chip x={540} y={1180} text="LEBIH DARI 13 MILIAR TAHUN" delay={5.2} fill={C.cream}/>
  <Host x={150} y={1065} scale={.38} frame={f} armL={45} armR={-70} talk/>
  <T x={540} y={1372} size={27} anchor="middle" opacity={d}>GARIS WAKTU TIDAK BERSKALA</T>
  <Label text="SKEMA KOSMOLOGI"/></>;}
 if(i===6){const a=enter(t,.5,2),b=enter(t,2.2,3.6),pill=enter(t,7.5,8.7);return <><Bg name="night" t={t} dark={.26}/><Stars t={t}/><Heading s={s}/>
  <g opacity={b} transform={`translate(0 ${(1-b)*46})`}>
   <rect x="600" y="565" width="400" height="330" rx="20" fill={C.cream} stroke={C.gold} strokeWidth="9"/>
   <clipPath id="fr"><rect x="622" y="587" width="356" height="286" rx="8"/></clipPath>
   <image href={art.deepfield} x="622" y="587" width="356" height="286" preserveAspectRatio="xMidYMid slice" clipPath="url(#fr)"/>
   <T x="800" y="932" size={26} anchor="middle">SEMESTA MUDA — SKEMA</T></g>
  <Host x={235} y={935} scale={.62} frame={f} armL={60} armR={-20} happy={t>9} talk={t<=9}/>
  <Scope x={216} y={1218} s={.62} rot={-48}/>
  <g opacity={pill} transform={`translate(0 ${(1-pill)*40})`}><rect x="280" y="1310" width="520" height="90" rx="45" fill={C.gold}/><T x="540" y="1370" size={45} fill={C.deep} anchor="middle">ikuti knot theory</T></g>
  <Label text="ILUSTRASI"/></>;}
 const tail=enter(t,2,3.4);return <><Bg name="night" t={t} dark={.40}/><Heading s={s}/><g opacity={tail}><Host x={240} y={820} scale={.7} frame={f} armL={55} armR={-60} talk/></g></>;
}
function Artwork({time}:{time:number}){let i=timeline.findIndex((x:any)=>time>=x.start&&time<x.end);if(i<0)i=timeline.length-1;const seg=timeline[i],local=Math.max(0,time-seg.start);return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><Scene i={i} t={local} frame={Math.round(local*fps)} len={seg.end-seg.start}/><Cue t={time}/></svg>}
function Thumbnail(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><image href={art.night} width="1080" height="1920"/><rect width="1080" height="1920" fill={C.deep} opacity=".30"/><rect width="1080" height="550" fill={C.deep} opacity=".94"/><Brand/><T x={70} y={285} size={92} family="Permanent Marker" weight={400}>LIHAT KE ATAS,</T><T x={70} y={405} size={95} fill={C.gold} family="Permanent Marker" weight={400}>LIHAT MASA LALU?</T><rect x="74" y="454" width="860" height="66" rx="10" fill={C.cream}/><T x={96} y={500} size={31} fill={C.deep}>MATAHARI 8 MENIT • ANDROMEDA 2,5 JUTA TAHUN</T><circle cx="750" cy="830" r="240" fill={C.teal} stroke={C.mint} strokeWidth="10"/><Scope x={750} y={810} s={1.15} rot={-42}/><rect x="95" y="1170" width="460" height="290" rx="28" fill={C.navy} stroke={C.gold} strokeWidth="8"/><Stars t={1.5}/><T x="325" y="1290" size={33} anchor="middle">2,5 JT TAHUN LALU</T><T x="325" y="1350" size={29} anchor="middle">SEBELUM MANUSIA MODERN</T><Host x={655} y={1180} scale={.78} frame={0} armL={55} armR={-70} happy/><Label text="ILUSTRASI KONSEPTUAL" x={75} y={1670}/></svg>}
function Poster(){return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill={C.deep}/><circle cx="820" cy="380" r="310" fill={C.teal}/><Brand/><T x={70} y={300} size={88} family="Permanent Marker" weight={400}>LIHAT KE ATAS,</T><T x={70} y={410} size={95} fill={C.gold} family="Permanent Marker" weight={400}>LIHAT MASA LALU?</T><T x={75} y={475} size={30} fill={C.mint}>CAHAYA ADALAH MESIN WAKTU</T><Scope x={760} y={420} s={1.1} rot={-44}/><Stars t={1.2}/><Host x={280} y={940} scale={.8} frame={0} armL={55} armR={-65} happy/><T x="700" y="900" size={31} anchor="middle">8 MNT 20 DTK</T><T x="700" y="950" size={27} anchor="middle">MATAHARI KE BUMI</T><Label text="ILUSTRASI KONSEPTUAL" y={1290}/></svg>}
const raster=(element:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(element),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());
const png=(t:number)=>raster(<Artwork time={t}/>);
async function main(){if(process.argv.includes('--stills')){const times=[0,...timeline.map((s:any)=>s.start+(s.end-s.start)*.48),...timeline.map((s:any)=>s.start+(s.end-s.start)*.68)];times.forEach((t:number,i:number)=>fs.writeFileSync(path.join(dir,`qa-sample-${String(i).padStart(2,'0')}.png`),png(t)));fs.writeFileSync(path.join(dir,'teleskop-thumbnail.png'),raster(<Thumbnail/>));fs.writeFileSync(path.join(dir,'teleskop-poster-4x5.png'),raster(<Poster/>));console.log(JSON.stringify({stills:times.map((t:number)=>+t.toFixed(3))}));return;}
 const count=Math.ceil(duration*fps),out=path.join(dir,'teleskop.mp4'),ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
 const args=['-nostdin','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-i',data.narration,'-i',data.score,'-filter_complex','[1:a]volume=1.0[v];[2:a]volume=0.18[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-3.5:LRA=11[a]','-map','0:v:0','-map','[a]','-t',String(duration),'-r',String(fps),'-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out];
 const log=fs.createWriteStream(path.join(dir,'ffmpeg-error.log')),child=spawn(ff,args,{stdio:['pipe','ignore','pipe']});child.stderr.pipe(log);child.on('error',e=>console.error('ffmpeg:',e));for(let i=0;i<count;i++){if(!child.stdin.write(png(i/fps)))await once(child.stdin,'drain');if(i%200===0)console.log(`frame ${i}/${count}`)}child.stdin.end();const [code]=await once(child,'close');if(code!==0)throw new Error(`FFmpeg exit ${code}`);console.log(`Rendered ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
