/** A05 — PERSPECTIVE. Bunga 650,31 T setara 79% anggaran pendidikan 824 T. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const FULL = 800;
export const A05Perspective: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const head = seg(f, 0, 10);
  const b1 = seg(f, d * 0.1, d * 0.34);
  const b2 = seg(f, d * 0.36, d * 0.6);
  const dash = seg(f, d * 0.62, d * 0.8);
  const noteP = seg(f, d * 0.82, d * 0.95);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={121} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={head}>
        <MarkerText x={72} y={300} lines="Bandingkan" size={54} fill={palette.marker} />
      </g>
      <g opacity={b1 > 0.05 ? 1 : 0}>
        <T x={72} y={392} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>ANGGARAN PENDIDIKAN</T>
        <rect x={72} y={412} width={Math.max(4, FULL * b1)} height={104} rx={3} fill={palette.kraft} />
        <MarkerText x={96} y={482} lines="Rp824 T" size={44} fill={palette.paper} opacity={b1 > 0.7 ? 1 : 0} />
      </g>
      <g opacity={b2 > 0.05 ? 1 : 0}>
        <T x={72} y={592} size={24} weight={700} tracking={1.6} fill={palette.paperShadow}>BUNGA UTANG</T>
        <rect x={72} y={612} width={Math.max(4, 631 * b2)} height={104} rx={3} fill={palette.brick} />
        <MarkerText x={72 + 631 + 26} y={682} lines="Rp650,31 T" size={42} fill={palette.markerRed} opacity={b2 > 0.85 ? 1 : 0} />
      </g>
      <g opacity={dash}>
        <line x1={631 + 72 + 40} y1={380} x2={631 + 72 + 40} y2={730} stroke={palette.marker} strokeWidth={4} strokeDasharray="12 10" opacity={0.8} />
        <MarkerText x={72} y={800} lines="79 persen" size={64} fill={palette.marker} />
      </g>
      <g opacity={noteP}>
        <Slip x={120} y={860} w={840} h={170} seed={122} lines={0} rotate={-1} fill={palette.paper}>
          <Tape x={330} y={-14} w={120} h={32} rotate={-4} opacity={0.45} />
          <T x={420} y={62} anchor="middle" size={28} weight={600} fill="#5B5548">dibayar sebelum satu program pun dimulai</T>
          <SketchUnderline x1={150} y={110} x2={690} p={noteP} width={6} stroke={palette.brick} />
          <MarkerText x={420} y={148} anchor="middle" lines="itu yang tidak bisa ditunda" size={34} fill={palette.marker} />
        </Slip>
      </g>
      <PaperSource text="Pendidikan Rp824 T (APBN 2027, pemberitaan) · 650,31 / 824 = 78,9% (hitungan sendiri)" />
    </SceneShell>
  );
};
