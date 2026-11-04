/** A03 — CONFLICT. Keseimbangan primer: 671,16 dikurangi bunga 650,31 = 20,85. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { KraftCard, MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, PaperWrite, Slip, SketchUnderline, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const A03Conflict: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const head = seg(f, 0, 10);
  const l1 = seg(f, d * 0.12, d * 0.3);
  const l2 = seg(f, d * 0.3, d * 0.48);
  const l3 = seg(f, d * 0.48, d * 0.64);
  const small = seg(f, d * 0.68, d * 0.8);
  const under = seg(f, d * 0.8, d * 0.95);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={101} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={head}>
        <MarkerText x={72} y={300} lines="Angka kecil di halaman yang sama" size={44} fill={palette.marker} />
      </g>
      <KraftCard x={90} y={380} w={900} h={330} seed={102} rotate={-1.4}>
        <Tape x={40} y={-22} w={160} h={42} rotate={-9} />
        <PaperWrite id="a03-l1" x={60} y={30} w={780} h={90} p={l1}>
          <MarkerText x={450} y={112} anchor="middle" lines="671,16" size={76} fill={palette.marker} />
        </PaperWrite>
        <PaperWrite id="a03-l2" x={60} y={130} w={780} h={90} p={l2}>
          <MarkerText x={450} y={212} anchor="middle" lines="- 650,31" size={72} fill={palette.brick} />
        </PaperWrite>
        <PaperWrite id="a03-l3" x={60} y={230} w={780} h={90} p={l3}>
          <MarkerText x={450} y={312} anchor="middle" lines="= 20,85" size={80} fill={palette.marker} />
        </PaperWrite>
      </KraftCard>
      <g opacity={small}>
        <MarkerText x={90} y={840} lines="keseimbangan primer" size={52} fill={palette.markerRed} />
        <SketchUnderline x1={90} y={868} x2={640} p={under} width={8} stroke={palette.brick} />
        <T x={90} y={960} size={30} weight={600} fill="#5B5548">
          minus Rp20,85 triliun. Tanpa bunga, anggaran nyaris seimbang.
        </T>
      </g>
      <Slip x={150} y={1060} w={780} h={150} seed={103} lines={0} rotate={1.1} fill={palette.kraftLight}>
        <T x={390} y={58} anchor="middle" size={26} weight={700} tracking={1.4} fill={palette.paperShadow}>BUNGA = 650,31</T>
        <MarkerText x={390} y={118} anchor="middle" lines="hitungan sendiri" size={44} fill={palette.marker} />
      </Slip>
      <PaperSource text="Keseimbangan primer -Rp20,85 T (UU APBN 2027) · bunga: defisit - keseimbangan primer" />
    </SceneShell>
  );
};
