/** A07 — CLOSING. Defisit bisa diperdebatkan; bunga tidak. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, PaperWrite, Pencil, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const A07Closing: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const l1 = seg(f, 0, d * 0.3);
  const l2 = seg(f, d * 0.3, d * 0.58);
  const under = seg(f, d * 0.58, d * 0.74);
  const note = seg(f, d * 0.76, d * 0.9);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand source={null} vignette={0.4}>
      <PaperBg seed={141} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={l1}>
        <MarkerText x={96} y={620} lines="Defisit bisa" size={82} fill={palette.marker} />
      </g>
      <PaperWrite id="a07-q" x={96} y={650} w={820} h={190} p={l2}>
        <MarkerText x={96} y={800} lines="diperdebatkan." size={82} fill={palette.marker} />
      </PaperWrite>
      <MarkerText x={96} y={1010} lines="Bunga tidak." size={82} fill={palette.markerRed} opacity={under} />
      <SketchUnderline x1={96} y={1040} x2={560} p={under} width={9} stroke={palette.brick} />
      <g opacity={note}>
        <Slip x={120} y={1120} w={840} h={200} seed={142} lines={0} rotate={-1.2}>
          <Tape x={330} y={-16} w={140} h={36} rotate={-4} opacity={0.5} />
          <T x={32} y={60} size={26} weight={700} tracking={1.8} fill={palette.paperShadow}>YANG TETAP BENAR</T>
          <MarkerText x={32} y={140} lines={['Bunga dibayar lebih dulu,', 'sebelum anggaran jadi program.']} size={38} lineHeight={52} fill={palette.marker} />
        </Slip>
      </g>
      <Pencil x={800} y={1230} s={0.62} rotate={-22} opacity={0.75} />
      <PaperSource text="UU APBN 2027 · 29 September 2026 · ilustrasi editorial, bukan dokumentasi" />
    </SceneShell>
  );
};
