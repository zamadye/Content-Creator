/*
 * Kamar Berlangit VISUAL TEST composite: Coverr real footage as the moving
 * background, the same male narrator rig as an SVG overlay, and the same
 * subtitle-card typography as the published Shorts. Overlay PNGs (RGBA) are
 * piped to FFmpeg over the scaled/cropped footage with the Zephlyn VO.
 * Illustration vs footage is labeled on screen. This is a test render only;
 * nothing is published, and the Coverr license remains NEEDS_REVIEW for
 * any future publication.
 */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {once} from 'node:events';
import {Narrator} from './narrator';

const root=process.cwd(), dir=path.join(root,'deliverables/kamar-berlangit-2026');
const data=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json'),'utf8'));
const {cues,duration,fps,testSeconds}=data;
const fonts=['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf'].map(n=>path.join(root,'assets/fonts',n));
const FOOTAGE=path.join(root,'assets/footage/episode-kamar-berlangit-2026/kamar-footage.mp4');
const C={deep:'#071e26',navy:'#0b2c36',teal:'#216d6d',mint:'#abe1c7',cream:'#fff3d9',gold:'#f2c473',copper:'#c2754d',blue:'#74bfd0'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};const enter=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
const T=({x,y,children,size=38,fill=C.cream,anchor='start',family='Archivo SemiBold',weight=700,opacity=1}:{x:number;y:number;children:string;size?:number;fill?:string;anchor?:'start'|'middle'|'end';family?:string;weight?:number;opacity?:number})=><text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} fontFamily={family} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Brand=()=><g><circle cx="82" cy="145" r="10" fill={C.gold}/><T x={105} y={154} size={25}>KNOT THEORY  /  DUNIA KEBALIK</T></g>;
const Label=({text,x=70,y}:{text:string;x?:number;y:number})=><g><rect x={x} y={y-29} width={Math.max(145,text.length*12+28)} height="39" rx="7" fill={C.deep} opacity=".88"/><T x={x+13} y={y-2} size={19}>{text}</T></g>;
const Cue=({t}:{t:number})=>{const q=cues.find((v:any)=>t>=v.start&&t<v.end);if(!q)return null;const two=q.lines.length===2;return <g><rect x="66" y={two?1490:1510} width="948" height={two?165:110} rx="18" fill="#06151c" opacity=".92"/>{q.lines.map((line:string,i:number)=><T key={i} x={540} y={(two?1550:1582)+i*57} size={43} anchor="middle" fill="#fff">{line}</T>)}</g>};
/* The footage supplies the sky; the overlay adds a soft top band for the
 * brand, the narrator illustration, and the subtitle cards. */
function Overlay({time,frame}:{time:number;frame:number}){
  const t=time;
  return <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="240" fill={C.deep} opacity=".55"/>
    <rect y="1440" width="1080" height="480" fill={C.deep} opacity=".45"/>
    <Brand/>
    <Label text="VIDEO LANGIT: COVERR (UJI)" y={210}/>
    <Label text="KARAKTER: ILUSTRASI" y={262}/>
    <g><Narrator x={205} y={975} scale={.74} frame={frame} armL={40} armR={-24} talk/></g>
    <ellipse cx="238" cy="1412" rx="126" ry="18" fill={C.deep} opacity=".35"/>
    <Cue t={t}/>
  </svg>;
}
const raster=(element:React.ReactElement)=>Buffer.from(new Resvg(renderToStaticMarkup(element),{font:{fontFiles:fonts,loadSystemFonts:false,defaultFontFamily:'Archivo SemiBold'}}).render().asPng());
async function main(){
  if(process.argv.includes('--stills')){
    const times=[1,8,15,25,35];
    times.forEach((t,i)=>fs.writeFileSync(path.join(dir,`overlay-still-${i}.png`),raster(<Overlay time={t} frame={Math.round(t*fps)}/>)));
    console.log(JSON.stringify({stills:times}));
    return;
  }
  const count=Math.ceil(testSeconds*fps);
  const rangeArg=process.argv.find(a=>a.startsWith('--range='));
  const tmp=process.argv.find(a=>a.startsWith('--tmp='))?.split('=')[1]||fs.mkdtempSync(path.join(os.tmpdir(),'kamar-ov-'));
  if(rangeArg){
    // Chunked overlay render: one fresh process per chunk so resvg/font
    // allocations never accumulate across the whole sequence.
    const [from,to]=rangeArg.split('=')[1].split(':').map(Number);
    for(let i=from;i<Math.min(to,count);i++){
      fs.writeFileSync(path.join(tmp,`ov-${String(i).padStart(5,'0')}.png`),raster(<Overlay time={i/fps} frame={i}/>));
    }
    console.log(`overlay chunk ${from}:${to} done -> ${tmp}`);
    return;
  }
  const out=path.join(dir,'kamar-uji-komposit.mp4'),ff=path.join(root,'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
  const args=['-nostdin','-hide_banner','-loglevel','error','-y',
    '-stream_loop','-1','-i',FOOTAGE,
    '-framerate',String(fps),'-i',path.join(tmp,'ov-%05d.png'),
    '-i',data.narration,
    '-filter_complex','[0:v]scale=-2:1920:flags=bicubic,crop=1080:1920,setsar=1[bg];[1:v]format=rgba[ov];[bg][ov]overlay=0:0[v];[2:a]atrim=0:'+testSeconds.toFixed(3)+',asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-3.5:LRA=11[a]',
    '-map','[v]','-map','[a]','-t',String(testSeconds),'-r',String(fps),'-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out];
  const child=spawn(ff,args,{stdio:['ignore','ignore','pipe']});
  const log=fs.createWriteStream(path.join(dir,'ffmpeg-uji-error.log'));
  child.stderr.pipe(log);child.on('error',e=>console.error('ffmpeg:',e));
  const [code]=await once(child,'close');
  fs.rmSync(tmp,{recursive:true,force:true});
  if(code!==0)throw new Error(`FFmpeg exit ${code}`);
  console.log(`Rendered ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
