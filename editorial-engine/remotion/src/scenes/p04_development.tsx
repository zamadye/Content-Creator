/**
 * P04 — DEVELOPMENT
 * -----------------
 * Kertas grafik. Dua garis, dua skala: bunga tunggal naik lurus ke 109,5%,
 * bunga majemuk melengkung ke 198,4%. Panjang batang bukan hiasan — ia hasil hitung.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { DrawStroke, GraphPaper, MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchArrow, wobble } from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** skala papan: sumbu mendatar 0–365 hari, tegak 0–220 persen */
const OX = 90;
const OY = 690;
const K_PCT = 620 / 220;
const K_DAY = 800 / 365;
const yOf = (pct: number) => OY - pct * K_PCT;
const xOf = (day: number) => OX + day * K_DAY;

const CURVE = Array.from({ length: 74 }, (_, i) => {
  const day = (i / 73) * 365;
  const pct = (Math.pow(1.003, day) - 1) * 100;
  return [xOf(day), yOf(pct)] as [number, number];
});

export const P04Development: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const boardIn = seg(f, 0, 12);
  const axis = seg(f, d * 0.04, d * 0.16);
  const straight = seg(f, d * 0.16, d * 0.38);
  const curve = seg(f, d * 0.4, d * 0.72);
  const lab1 = seg(f, d * 0.72, d * 0.8);
  const lab2 = seg(f, d * 0.8, d * 0.9);
  const close = seg(f, d * 0.9, d * 0.98);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={8} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={boardIn} transform={`rotate(-0.8 540 740)`}>
        <GraphPaper x={70} y={340} w={940} h={800} seed={8} cell={54}>
          {/* sumbu */}
          <DrawStroke pts={wobble(OX, OY, 900, OY, 2, 14, 41)} p={axis} stroke={palette.marker} width={5} />
          <DrawStroke pts={wobble(OX, OY, OX, 70, 2, 12, 43)} p={axis} stroke={palette.marker} width={5} />
          <MarkerText x={700} y={742} lines="365 hari" size={34} fill="#5B5548" opacity={axis} />
          <MarkerText x={36} y={110} lines="%" size={34} fill="#5B5548" opacity={axis} />

          {/* bunga tunggal: lurus */}
          <DrawStroke pts={wobble(OX, OY, xOf(365), yOf(109.5), 3, 10, 47)} p={straight} stroke={palette.pencil} width={5} dash="16 12" />

          {/* bunga majemuk: melengkung */}
          <DrawStroke pts={CURVE} p={curve} stroke={palette.markerRed} width={9} />

          {/* penanda hari ke-30 */}
          <g opacity={lab1}>
            <circle cx={xOf(30)} cy={yOf(9.4)} r={11} fill={palette.marker} />
            <MarkerText x={xOf(30) + 24} y={yOf(9.4) - 18} lines="9% di hari 30" size={30} fill={palette.markerRed} />
          </g>

          <g opacity={lab1}>
            <MarkerText x={xOf(365) - 250} y={yOf(109.5) - 44} lines="109,5%" size={54} fill={palette.marker} />
          </g>
          <g opacity={lab2}>
            <MarkerText x={xOf(365) - 250} y={yOf(198.4) - 30} lines="198%" size={96} fill={palette.markerRed} />
            <SketchArrow x1={xOf(300) + 10} y1={yOf(150)} x2={xOf(345)} y2={yOf(190)} p={lab2} stroke={palette.markerRed} width={5} seed={51} head={18} />
          </g>
        </GraphPaper>
      </g>

      <g opacity={close}>
        <MarkerText x={72} y={1290} lines="Hitung setahun," size={64} />
        <MarkerText x={72} y={1382} lines="bukan sehari." size={84} fill={palette.markerRed} />
      </g>

      <PaperSource text="0,3% × 365 = 109,5% (tunggal) · 1,003^365 − 1 = 198,4% (majemuk) — S1." />
    </SceneShell>
  );
};
