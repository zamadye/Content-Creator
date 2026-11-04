/** C04 — ANALYSIS. 5% dari Rp3,5 juta = Rp175.000; ≈ Rp8.300/hari. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { KraftCard, MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, PaperWrite, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';
const seg=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{easing:Easing.editorial,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
export const C04Analysis1: React.FC<{d:number}> = ({d}) => {
  const f=useCurrentFrame();
  const head=seg(f,0,10), l1=seg(f,d*0.1,d*0.3), l2=seg(f,d*0.34,d*0.52), day=seg(f,d*0.62,d*0.78), note=seg(f,d*0.8,d*0.94);
  return (<SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
    <PaperBg seed={231}/><PaperHeader/><PaperIllustrationTag/>
    <g opacity={head}><MarkerText x={72} y={300} lines="Lima persen itu berapa" size={50} fill={palette.marker}/></g>
    <KraftCard x={90} y={370} w={900} h={330} seed={232} rotate={-1.4}>
      <Tape x={40} y={-22} w={160} h={42} rotate={-9}/>
      <PaperWrite id="c04-l1" x={60} y={40} w={780} h={110} p={l1}>
        <MarkerText x={450} y={128} anchor="middle" lines="Rp3,5 jt × 5%" size={64} fill={palette.marker}/>
      </PaperWrite>
      <PaperWrite id="c04-l2" x={60} y={160} w={780} h={120} p={l2}>
        <MarkerText x={450} y={262} anchor="middle" lines="= Rp175.000" size={84} fill={palette.markerRed}/>
      </PaperWrite>
    </KraftCard>
    <g opacity={day}><Slip x={120} y={760} w={840} h={170} seed={233} lines={0} rotate={-1} fill={palette.kraftLight}>
      <Tape x={330} y={-14} w={130} h={32} rotate={-4} opacity={0.45}/>
      <T x={420} y={58} anchor="middle" size={26} weight={700} tracking={1.5} fill={palette.paperShadow}>PER HARI KERJA (21 HARI)</T>
      <MarkerText x={420} y={128} anchor="middle" lines="Rp8.300" size={62} fill={palette.marker}/>
    </Slip></g>
    <g opacity={note}>
      <MarkerText x={72} y={1030} lines="sebulan, untuk satu pekerja" size={44} fill={palette.marker}/>
      <T x={72} y={1090} size={28} weight={600} fill="#5B5548">contoh upah Rp3,5 juta, bukan upah rata-rata</T>
    </g>
    <PaperSource text="Hitungan sendiri: 3.500.000 x 5% = 175.000 · 175.000 / 21 = 8.333"/>
  </SceneShell>);
};
