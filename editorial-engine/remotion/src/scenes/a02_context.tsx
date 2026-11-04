/** A02 — CONTEXT. Postur: pendapatan, belanja, defisit. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchCircle, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const ROWS = [
  { label: 'PENDAPATAN NEGARA', value: 'Rp3.435,10 T', y: 330, fill: palette.paper },
  { label: 'BELANJA NEGARA', value: 'Rp4.106,26 T', y: 520, fill: palette.kraftLight },
  { label: 'DEFISIT', value: 'Rp671,16 T', y: 730, fill: palette.paperDeep },
];

export const A02Context: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const head = seg(f, 0, 10);
  const rows = ROWS.map((_, i) => seg(f, d * (0.1 + i * 0.16), d * (0.18 + i * 0.16)));
  const circle = seg(f, d * 0.68, d * 0.82);
  const foot = seg(f, d * 0.84, d * 0.95);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={91} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={head}>
        <MarkerText x={72} y={280} lines="Postur 2027" size={54} fill={palette.marker} />
      </g>
      {ROWS.map((r, i) => (
        <g key={r.label} opacity={rows[i]} transform={`translate(${(1 - rows[i]) * -26} 0)`}>
          <Slip x={110} y={r.y} w={860} h={160} seed={95 + i} lines={0} rotate={i === 1 ? 0.9 : -0.9} fill={r.fill}>
            <T x={36} y={54} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>
              {r.label}
            </T>
            <MarkerText x={36} y={122} lines={r.value} size={56} fill={palette.marker} />
          </Slip>
        </g>
      ))}
      <SketchCircle cx={540} cy={812} rx={452} ry={112} p={circle} seed={99} width={7} stroke={palette.brick} />
      <g opacity={foot}>
        <T x={540} y={1000} anchor="middle" size={30} weight={600} fill="#5B5548">
          defisit = 2,4 persen dari produk domestik bruto
        </T>
        <MarkerText x={540} y={1120} anchor="middle" lines="selisih yang harus ditutup" size={40} fill={palette.paperShadow} />
      </g>
      <PaperSource text="UU APBN 2027 · angka defisit 2,4% PDB · ilustrasi editorial" />
    </SceneShell>
  );
};
