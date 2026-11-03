/**
 * P02 — CONTEXT
 * -------------
 * Nota pinjaman di kiri atas, dan tiga puluh kotak hari yang diisi satu per satu.
 * Sampai kotak terakhir habis, angkanya memang masih masuk akal — itu justru intinya.
 *
 * Koordinat anak Slip = lokal kartu.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchUnderline, Slip, TallyGrid, Tape } from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const P02Context: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const notaIn = seg(f, 0, 12);
  const noteIn = seg(f, d * 0.12, d * 0.22);
  const gridDraw = seg(f, d * 0.18, d * 0.3);
  const fillRaw = interpolate(f, [d * 0.3, d * 0.72], [0, 30], { easing: Easing.linearish, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const total = seg(f, d * 0.78, d * 0.86);
  const closeLine = seg(f, d * 0.88, d * 0.96);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={4} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={notaIn} transform={`translate(${(1 - notaIn) * -34} 0)`}>
        <Slip x={80} y={330} w={470} h={330} seed={3} lines={0} rotate={-2.2}>
          <Tape x={150} y={-16} w={150} h={40} rotate={-6} opacity={0.55} />
          <MarkerText x={34} y={72} lines="PINJAM" size={36} fill="#5B5548" />
          <MarkerText x={34} y={166} lines="Rp1.000.000" size={56} />
          <MarkerText x={34} y={252} lines="tenor 30 hari" size={44} fill={palette.markerRed} />
        </Slip>
      </g>

      <g opacity={noteIn} transform={`translate(${(1 - noteIn) * 34} 0)`}>
        <Slip x={590} y={360} w={410} h={240} seed={9} lines={0} fill={palette.paperDeep} rotate={2}>
          <MarkerText x={205} y={112} lines="Rp3.000" size={70} anchor="middle" />
          <MarkerText x={205} y={192} lines="per hari" size={44} anchor="middle" fill={palette.markerRed} />
        </Slip>
      </g>

      <TallyGrid
        x={110}
        y={740}
        cols={10}
        rows={3}
        cell={54}
        gap={16}
        filled={Math.floor(fillRaw)}
        fillProgress={fillRaw % 1}
        drawn={gridDraw}
        stroke={palette.marker}
        fill={palette.marker}
      />

      <g opacity={total}>
        <MarkerText x={72} y={1092} lines="30 hari:" size={50} fill="#5B5548" />
        <MarkerText x={72} y={1200} lines="Rp90.000" size={112} fill={palette.markerRed} />
        <SketchUnderline x1={72} y={1236} x2={520} p={total} width={8} />
      </g>

      <g opacity={closeLine}>
        <MarkerText x={648} y={1120} lines={['masih', 'masuk', 'akal.']} size={54} fill={palette.marker} lineHeight={66} />
      </g>

      <PaperSource text="Perhitungan: Rp1.000.000 × 0,3% × 30 hari (S1)." />
    </SceneShell>
  );
};
