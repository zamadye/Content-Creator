/** C03 — CONTRADICTION. Formal 40,7% vs informal 59,3%. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';
const seg=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{easing:Easing.editorial,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const FULL=780;
export const C03Conflict: React.FC<{d:number}> = ({d}) => {
  const f=useCurrentFrame();
  const head=seg(f,0,10), b1=seg(f,d*0.1,d*0.34), b2=seg(f,d*0.38,d*0.6), note=seg(f,d*0.68,d*0.82), foot=seg(f,d*0.84,d*0.96);
  return (<SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
    <PaperBg seed={221}/><PaperHeader/><PaperIllustrationTag/>
    <g opacity={head}><MarkerText x={72} y={300} lines="Siapa yang bekerja" size={52} fill={palette.marker}/></g>
    <g opacity={b1>0.05?1:0}>
      <T x={72} y={392} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>INFORMAL · 59,3%</T>
      <rect x={72} y={412} width={Math.max(4,FULL*b1)} height={112} rx={3} fill={palette.brick}/>
      <MarkerText x={96} y={488} lines="87,88 juta" size={46} fill={palette.paper} opacity={b1>0.75?1:0}/>
    </g>
    <g opacity={b2>0.05?1:0}>
      <T x={72} y={592} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>FORMAL · 40,7%</T>
      <rect x={72} y={612} width={Math.max(4,535*b2)} height={112} rx={3} fill={palette.kraft}/>
      <MarkerText x={96} y={688} lines="60,31 juta" size={46} fill={palette.paper} opacity={b2>0.8?1:0}/>
    </g>
    <g opacity={note}>
      <MarkerText x={72} y={840} lines="148,19 juta orang bekerja" size={44} fill={palette.marker}/>
      <T x={72} y={896} size={28} weight={600} fill="#5B5548">BPS, Sakernas Mei 2026</T>
    </g>
    <g opacity={foot}><Slip x={120} y={960} w={840} h={170} seed={222} lines={0} rotate={-1} fill={palette.kraftLight}>
      <Tape x={330} y={-14} w={130} h={32} rotate={-4} opacity={0.45}/>
      <MarkerText x={420} y={102} anchor="middle" lines="upah minimum hanya untuk yang formal" size={38} fill={palette.marker}/>
    </Slip></g>
    <PaperSource text="BPS Sakernas Mei 2026 · porsi informal 87,88/148,19 = 59,3% (hitungan sendiri)"/>
  </SceneShell>);
};
