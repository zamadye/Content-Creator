/** C02 — CONTEXT. Formula UMP 2026 dan rentang alfa. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';
const seg=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{easing:Easing.editorial,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
export const C02Context: React.FC<{d:number}> = ({d}) => {
  const f=useCurrentFrame();
  const head=seg(f,0,10), s1=seg(f,d*0.12,d*0.3), a1=seg(f,d*0.36,d*0.48), a2=seg(f,d*0.5,d*0.62), note=seg(f,d*0.7,d*0.86);
  return (<SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
    <PaperBg seed={211}/><PaperHeader/><PaperIllustrationTag/>
    <g opacity={head}><MarkerText x={72} y={300} lines="Cara menghitungnya" size={52} fill={palette.marker}/></g>
    <g opacity={s1}><Slip x={90} y={370} w={900} h={250} seed={212} lines={0} rotate={-0.8}>
      <Tape x={350} y={-18} w={150} h={38} rotate={-3} opacity={0.5}/>
      <T x={40} y={58} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>RUmus UMP</T>
      <MarkerText x={40} y={150} lines="inflasi + (pertumbuhan × alfa)" size={42} fill={palette.marker}/>
      <T x={40} y={206} size={26} weight={600} fill="#5B5548">alfa ditetapkan Kemnaker, rentangnya sempit</T>
    </Slip></g>
    <g opacity={a1}><Slip x={110} y={680} w={400} h={170} seed={213} lines={0} rotate={-1.4}>
      <T x={200} y={56} anchor="middle" size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>ALFA TERENDAH</T>
      <MarkerText x={200} y={124} anchor="middle" lines="0,5" size={64} fill={palette.marker}/>
    </Slip></g>
    <g opacity={a2}><Slip x={570} y={680} w={400} h={170} seed={214} lines={0} rotate={1.2}>
      <T x={200} y={56} anchor="middle" size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>ALFA TERTINGGI</T>
      <MarkerText x={200} y={124} anchor="middle" lines="0,9" size={64} fill={palette.marker}/>
    </Slip></g>
    <g opacity={note}>
      <MarkerText x={72} y={1010} lines="hasilnya 5 persen, rata-rata" size={46} fill={palette.markerRed}/>
      <T x={72} y={1070} size={28} weight={600} fill="#5B5548">berbeda tiap provinsi · PP 49/2025</T>
    </g>
    <PaperSource text="Kontan.co.id, 26 Des 2025 · PP 49/2025 · ilustrasi editorial"/>
  </SceneShell>);
};
