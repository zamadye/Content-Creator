/**
 * B02 — CONTEXT
 * -------------
 * Nama program, tiga kotak bulan, lalu ketiganya dilingkari jadi satu: Rp900.000.
 * Semua anak Slip memakai koordinat LOKAL (0..w, 0..h).
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import {
  MarkerText,
  PaperBg,
  PaperHeader,
  PaperIllustrationTag,
  PaperSource,
  PaperWrite,
  SketchCircle,
  Slip,
  Tape,
} from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const MONTHS = ['Oktober', 'November', 'Desember'];

export const B02Context: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const headIn = seg(f, 0, 12);
  const boxes = [seg(f, d * 0.24, d * 0.34), seg(f, d * 0.36, d * 0.46), seg(f, d * 0.48, d * 0.58)];
  const circle = seg(f, d * 0.62, d * 0.78);
  const total = seg(f, d * 0.8, d * 0.94);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={21} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={headIn} transform={`translate(${(1 - headIn) * -30} 0)`}>
        <Slip x={120} y={320} w={840} h={250} seed={22} lines={0} rotate={-1.4}>
          <Tape x={300} y={-18} w={150} h={40} rotate={-4} opacity={0.55} />
          <MarkerText x={420} y={112} anchor="middle" lines="Bantuan Subsidi Upah" size={54} fill={palette.marker} />
          <MarkerText x={420} y={196} anchor="middle" lines="Rp300.000 per bulan" size={40} fill={palette.markerRed} />
        </Slip>
      </g>

      {MONTHS.map((m, i) => {
        const p = boxes[i];
        return (
          <g key={m} opacity={p} transform={`translate(0 ${(1 - p) * 26})`}>
            <Slip x={104 + i * 300} y={660} w={264} h={245} seed={30 + i} lines={0} rotate={i === 1 ? 1.2 : -1}>
              <MarkerText x={132} y={58} anchor="middle" lines={m} size={26} fill={palette.kraftDeep} />
              <PaperWrite id={`b02-amt-${i}`} x={10} y={110} w={244} h={80} p={p}>
                <MarkerText x={122} y={152} anchor="middle" lines="Rp300.000" size={30} fill={palette.markerRed} />
              </PaperWrite>
            </Slip>
          </g>
        );
      })}

      <SketchCircle cx={540} cy={782} rx={448} ry={178} p={circle} seed={33} width={7} stroke={palette.marker} />

      <g opacity={total}>
        <MarkerText x={540} y={1112} anchor="middle" lines="Rp900.000" size={116} fill={palette.marker} />
        <MarkerText x={540} y={1190} anchor="middle" lines="sekali bayar, bukan tiga kali" size={36} fill={palette.marker} />
      </g>

      <T x={540} y={1300} anchor="middle" size={28} weight={700} fill="#5B5548" opacity={total * 0.95}>
        September disiapkan · November–Desember disalurkan
      </T>

      <PaperSource text="Permenaker 16/2026 (28 Okt 2026) · Kemnaker, 29 Okt 2026" />
    </SceneShell>
  );
};
