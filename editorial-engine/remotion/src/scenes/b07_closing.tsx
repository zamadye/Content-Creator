/**
 * B07 — CLOSING
 * -------------
 * Tidak ada jawaban yang dikarang. Video berhenti di satu pertanyaan.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, PaperWrite, Pencil, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const B07Closing: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const line1 = seg(f, 0, d * 0.32);
  const line2 = seg(f, d * 0.34, d * 0.62);
  const under = seg(f, d * 0.64, d * 0.78);
  const note = seg(f, d * 0.8, d * 0.92);
  const pencil = seg(f, d * 0.9, d * 0.99);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand source={null} vignette={0.4}>
      <PaperBg seed={71} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={line1}>
        <MarkerText x={96} y={620} lines="Siapa yang menagih" size={84} fill={palette.marker} />
      </g>
      <PaperWrite id="b07-q" x={96} y={650} w={820} h={190} p={line2}>
        <MarkerText x={96} y={794} lines="janji ini?" size={84} fill={palette.markerRed} />
      </PaperWrite>
      <SketchUnderline x1={96} y={826} x2={470} p={under} width={9} stroke={palette.brick} />

      <g opacity={note}>
        <Slip x={120} y={980} w={840} h={230} seed={72} lines={0} rotate={-1.3}>
          <Tape x={330} y={-16} w={140} h={36} rotate={-4} opacity={0.5} />
          <T x={32} y={62} size={26} weight={700} tracking={1.8} fill={palette.paperShadow}>
            YANG TETAP BENAR
          </T>
          <MarkerText x={32} y={146} lines={['Rp900.000 tetap berarti', 'bagi yang menerimanya.']} size={40} lineHeight={54} fill={palette.marker} />
        </Slip>
      </g>

      <g opacity={pencil}>
        <Pencil x={700} y={1300} s={0.9} rotate={-18} />
      </g>

      <PaperSource text="Permenaker 16/2026 · BPS Sakernas Mei 2026 · BPJS Ketenagakerjaan Juli 2026 · ilustrasi editorial" />
    </SceneShell>
  );
};
