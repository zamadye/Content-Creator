/** C07 — CLOSING. Bukan kegagalan program; itu definisinya. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, PaperWrite, Pencil, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';
const seg=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{easing:Easing.editorial,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
export const C07Closing: React.FC<{d:number}> = ({d}) => {
  const f=useCurrentFrame();
  const l1=seg(f,0,d*0.3), l2=seg(f,d*0.3,d*0.56), ul=seg(f,d*0.56,d*0.72), note=seg(f,d*0.70,d*0.84), cta=seg(f,d*0.80,d*0.90);
  return (<SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand source={null} vignette={0.4}>
    <PaperBg seed={261}/><PaperHeader/><PaperIllustrationTag/>
    <g opacity={l1}><MarkerText x={96} y={600} lines="Bukan kegagalan" size={78} fill={palette.marker}/></g>
    <PaperWrite id="c07-q" x={96} y={630} w={820} h={190} p={l2}>
      <MarkerText x={96} y={780} lines="program." size={78} fill={palette.marker}/>
    </PaperWrite>
    <MarkerText x={96} y={990} lines="Definisinya." size={78} fill={palette.markerRed} opacity={ul}/>
    <SketchUnderline x1={96} y={1020} x2={520} p={ul} width={9} stroke={palette.brick}/>
    <g opacity={note}><Slip x={120} y={1072} w={840} h={182} seed={262} lines={0} rotate={-1.2}>
      <Tape x={330} y={-16} w={140} h={36} rotate={-4} opacity={0.5}/>
      <T x={32} y={56} size={24} weight={700} tracking={1.8} fill={palette.paperShadow}>YANG TETAP BENAR</T>
      <MarkerText x={32} y={128} lines={['Aturan mengikat yang tercatat.','Sisanya bekerja tanpa jaring.']} size={34} lineHeight={46} fill={palette.marker}/>
    </Slip></g>
    <g opacity={cta}>
      <T x={540} y={1318} anchor="middle" size={22} weight={700} tracking={2.4} fill={palette.paperShadow}>KALAU INI BERGUNA</T>
      <MarkerText x={540} y={1376} anchor="middle" lines="simpan · bagikan · ikuti" size={34} fill={palette.markerRed} />
    </g>
    <PaperSource text="BPS Sakernas Mei 2026 · PP 49/2025 · ilustrasi editorial, bukan dokumentasi"/>
  </SceneShell>);
};
