/** A04 — DEVELOPMENT. Bunga 18,9% dari pendapatan; Rp1,78 triliun sehari. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, Pencil, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const FULL = 760;
export const A04Development: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const head = seg(f, 0, 10);
  const b1 = seg(f, d * 0.1, d * 0.3);
  const b2 = seg(f, d * 0.34, d * 0.56);
  const pct = seg(f, d * 0.6, d * 0.74);
  const day = seg(f, d * 0.78, d * 0.92);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={111} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={head}>
        <MarkerText x={72} y={300} lines="Ke mana sisanya pergi" size={52} fill={palette.marker} />
      </g>
      <g opacity={b1 > 0.1 ? 1 : 0}>
        <T x={72} y={396} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>PENDAPATAN NEGARA</T>
        <rect x={72} y={416} width={Math.max(4, FULL * b1)} height={104} rx={3} fill={palette.kraft} />
        <MarkerText x={96} y={486} lines="Rp3.435,10 T" size={44} fill={palette.paper} opacity={b1 > 0.7 ? 1 : 0} />
      </g>
      <g opacity={b2 > 0.1 ? 1 : 0}>
        <T x={72} y={600} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>BUNGA UTANG (18,9%)</T>
        <rect x={72} y={620} width={Math.max(4, 144 * b2)} height={104} rx={3} fill={palette.brick} />
        <MarkerText x={72 + 144 + 28} y={690} lines="Rp650,31 T" size={46} fill={palette.markerRed} opacity={b2 > 0.9 ? 1 : 0} />
      </g>
      <g opacity={pct}>
        <MarkerText x={72} y={840} lines="18,9 persen" size={72} fill={palette.marker} />
        <T x={72} y={890} size={28} weight={600} fill="#5B5548">dari seluruh pendapatan negara</T>
      </g>
      <g opacity={day}>
        <Slip x={120} y={980} w={840} h={180} seed={112} lines={0} rotate={-1.2} fill={palette.kraftLight}>
          <Tape x={330} y={-16} w={130} h={34} rotate={-4} opacity={0.45} />
          <T x={420} y={58} anchor="middle" size={26} weight={700} tracking={1.4} fill={palette.paperShadow}>SETIAP HARI</T>
          <MarkerText x={420} y={132} anchor="middle" lines="Rp1,78 triliun" size={58} fill={palette.marker} />
        </Slip>
      </g>
      <Pencil x={820} y={880} s={0.6} rotate={-24} opacity={0.7} />
      <PaperSource text="Hitungan sendiri: 650,31 / 3.435,10 = 18,9% · 650,31 / 365 = Rp1,78 T per hari" />
    </SceneShell>
  );
};
