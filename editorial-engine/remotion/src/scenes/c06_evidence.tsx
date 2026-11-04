/** C06 — EVIDENCE. Sumber dan batas hitungan. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchCircle, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';
const seg=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{easing:Easing.editorial,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const LINES=[['Penduduk bekerja','148,19 juta'],['Formal','60,31 juta'],['Informal','87,88 juta'],['Dasar aturan','PP 49/2025']];
export const C06Evidence: React.FC<{d:number}> = ({d}) => {
  const f=useCurrentFrame();
  const head=seg(f,0,10), slip=seg(f,d*0.08,d*0.2), rows=LINES.map((_,i)=>seg(f,d*(0.22+i*0.09),d*(0.3+i*0.09))), circle=seg(f,d*0.7,d*0.86), note=seg(f,d*0.86,d*0.97);
  return (<SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
    <PaperBg seed={251}/><PaperHeader/><PaperIllustrationTag/>
    <g opacity={head}><MarkerText x={72} y={300} lines="Dari mana angkanya" size={52} fill={palette.marker}/></g>
    <g opacity={slip}><Slip x={100} y={350} w={880} h={420} seed={252} lines={0} rotate={-0.8}>
      <Tape x={340} y={-18} w={150} h={36} rotate={-3} opacity={0.5}/>
      <T x={36} y={48} size={24} weight={700} tracking={1.5} fill={palette.paperShadow}>BPS SAKERNAS MEI 2026 · PP 49/2025</T>
      {LINES.map((l,i)=>(<g key={l[0]} opacity={rows[i]}>
        <T x={36} y={112+i*66} size={26} weight={600} fill="#4A453C">{l[0]}</T>
        <T x={560} y={112+i*66} size={30} weight={800} fill={palette.marker} anchor="end">{l[1]}</T>
        <line x1={36} y1={126+i*66} x2={560} y2={126+i*66} stroke={palette.paperShadow} strokeWidth={1.2} opacity={0.7}/>
      </g>))}
    </Slip></g>
    <SketchCircle cx={540} cy={350+112+3*66-10} rx={300} ry={42} p={circle} seed={253} width={6} stroke={palette.brick}/>
    <g opacity={note}>
      <MarkerText x={72} y={860} lines="5% dan Rp8.300: hitungan sendiri" size={40} fill={palette.markerRed}/>
      <T x={72} y={920} size={28} weight={600} fill="#5B5548">bukan angka resmi Kemnaker</T>
    </g>
    <Slip x={150} y={990} w={780} h={140} seed={254} lines={0} rotate={1} fill={palette.kraftLight}>
      <MarkerText x={390} y={92} anchor="middle" lines="angka resmi: 148,19 / 60,31 / 87,88" size={30} fill={palette.marker}/>
    </Slip>
    <PaperSource text="Kontan 26 Des 2025 · BPS Sakernas Mei 2026 (dikutip Liputan6, 6 Agu 2026)"/>
  </SceneShell>);
};
