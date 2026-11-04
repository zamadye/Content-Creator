/** A06 — EVIDENCE. Sumber dan batas: mana angka resmi, mana hitungan sendiri. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchCircle, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const LINES = [
  ['Pendapatan', 'Rp3.435,10 T'],
  ['Belanja', 'Rp4.106,26 T'],
  ['Defisit (2,4% PDB)', 'Rp671,16 T'],
  ['Keseimbangan primer', '-Rp20,85 T'],
];

export const A06Evidence: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const head = seg(f, 0, 10);
  const slipP = seg(f, d * 0.08, d * 0.2);
  const rowsP = LINES.map((_, i) => seg(f, d * (0.22 + i * 0.09), d * (0.3 + i * 0.09)));
  const circle = seg(f, d * 0.7, d * 0.86);
  const note = seg(f, d * 0.86, d * 0.97);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={131} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={head}>
        <MarkerText x={72} y={300} lines="Dari mana angkanya" size={52} fill={palette.marker} />
      </g>
      <g opacity={slipP}>
        <Slip x={100} y={350} w={880} h={430} seed={132} lines={0} rotate={-0.8}>
          <Tape x={340} y={-18} w={150} h={36} rotate={-3} opacity={0.5} />
          <T x={36} y={48} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>UNDANG-UNDANG APBN 2027 · 29 SEPTEMBER 2026</T>
          {LINES.map((l, i) => (
            <g key={l[0]} opacity={rowsP[i]}>
              <T x={36} y={116 + i * 68} size={26} weight={600} fill="#4A453C">{l[0]}</T>
              <T x={560} y={116 + i * 68} size={30} weight={800} fill={palette.marker} anchor="end">{l[1]}</T>
              <line x1={36} y1={130 + i * 68} x2={560} y2={130 + i * 68} stroke={palette.paperShadow} strokeWidth={1.2} opacity={0.7} />
            </g>
          ))}
        </Slip>
      </g>
      <SketchCircle cx={540} cy={350 + 116 + 3 * 68 - 10} rx={300} ry={44} p={circle} seed={133} width={6} stroke={palette.brick} />
      <g opacity={note}>
        <MarkerText x={72} y={880} lines="bunga = defisit - keseimbangan primer" size={40} fill={palette.markerRed} />
        <T x={72} y={950} size={30} weight={600} fill="#5B5548">650,31 = 671,16 - 20,85 (hitungan sendiri, bukan angka resmi)</T>
      </g>
      <Slip x={150} y={1020} w={780} h={140} seed={134} lines={0} rotate={1} fill={palette.kraftLight}>
        <MarkerText x={390} y={92} anchor="middle" lines="pembiayaan Rp671,16 T, bukan utang baru bruto" size={30} fill={palette.marker} />
      </Slip>
      <PaperSource text="TopBusiness/Indikator Bisnis, 29 Sep 2026 · rincian pendidikan: pemberitaan APBN 2027" />
    </SceneShell>
  );
};
