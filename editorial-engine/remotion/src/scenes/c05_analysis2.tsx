/** C05 — ANALYSIS. Enam dari sepuluh tidak dijangkau definisi. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';
const seg=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{easing:Easing.editorial,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
export const C05Analysis2: React.FC<{d:number}> = ({d}) => {
  const f=useCurrentFrame();
  const head=seg(f,0,10), big=seg(f,d*0.12,d*0.34), ul=seg(f,d*0.36,d*0.5), line=seg(f,d*0.52,d*0.66), note=seg(f,d*0.68,d*0.84), foot=seg(f,d*0.86,d*0.97);
  return (<SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
    <PaperBg seed={241}/><PaperHeader/><PaperIllustrationTag/>
    <g opacity={head}><MarkerText x={72} y={300} lines="Sisi yang tidak dijangkau" size={46} fill={palette.marker}/></g>
    <g opacity={big}>
      <MarkerText x={540} y={560} anchor="middle" lines="6 dari 10" size={104} fill={palette.brick}/>
      <SketchUnderline x1={190} y={600} x2={890} p={ul} width={9} stroke={palette.brick}/>
    </g>
    <g opacity={line}>
      <line x1={72} y1={700} x2={1008} y2={700} stroke={palette.marker} strokeWidth={3} strokeDasharray="10 9" opacity={0.55}/>
      <T x={540} y={760} anchor="middle" size={30} weight={600} fill="#5B5548">pekerja informal: 87,88 juta orang</T>
    </g>
    <g opacity={note}>
      <MarkerText x={72} y={900} lines={['bukan haknya dilanggar,','tapi tidak masuk definisi.']} size={46} lineHeight={62} fill={palette.marker}/>
    </g>
    <g opacity={foot}><Slip x={120} y={1080} w={840} h={160} seed={242} lines={0} rotate={-1} fill={palette.kraftLight}>
      <Tape x={330} y={-14} w={130} h={32} rotate={-4} opacity={0.45}/>
      <MarkerText x={420} y={96} anchor="middle" lines="definisi: pekerja penerima upah" size={36} fill={palette.marker}/>
    </Slip></g>
    <PaperSource text="BPS Sakernas Mei 2026 · definisi penerima upah: PP 49/2025 · ilustrasi editorial"/>
  </SceneShell>);
};
