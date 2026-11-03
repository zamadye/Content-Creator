/**
 * P06 — EVIDENCE
 * --------------
 * Kertas buku tulis, tiga baris periksa. Centangnya digambar spidol mengikuti kalimat,
 * jadi penonton bisa menyalin urutannya sambil menonton.
 *
 * Koordinat anak LinedPaper = lokal kartu (titik 0,0 di sudut kiri atas kertas).
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { CheckBox, LinedPaper, MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchCheck } from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const Row: React.FC<{ y: number; num: string; lines: string[]; pIn: number; pCheck: number; accent?: boolean }> = ({
  y,
  num,
  lines,
  pIn,
  pCheck,
  accent = false,
}) => (
  <g opacity={pIn}>
    <CheckBox x={110} y={y - 46} size={52} stroke={palette.marker} />
    <MarkerText x={196} y={y - 16} lines={num} size={30} fill="#5B5548" />
    <MarkerText
      x={196}
      y={y + 34}
      lines={lines}
      size={50}
      fill={accent ? palette.markerRed : palette.marker}
      lineHeight={60}
    />
    <SketchCheck x={116} y={y - 34} p={pCheck} s={0.8} width={8} />
  </g>
);

export const P06Evidence: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const paperIn = seg(f, 0, 10);
  const r1 = seg(f, d * 0.04, d * 0.12);
  const c1 = seg(f, d * 0.2, d * 0.32);
  const r2 = seg(f, d * 0.34, d * 0.42);
  const c2 = seg(f, d * 0.46, d * 0.58);
  const r3 = seg(f, d * 0.6, d * 0.68);
  const c3 = seg(f, d * 0.74, d * 0.9);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={13} />
      <PaperHeader />
      <PaperIllustrationTag />

      <MarkerText x={72} y={330} lines="Cek tiga hal." size={70} opacity={r1} />

      <g opacity={paperIn}>
        <LinedPaper x={60} y={400} w={960} h={940} seed={14} rotate={-0.6}>
          <Row y={230} num="1" lines={['Cari angka', 'hariannya.']} pIn={r1} pCheck={c1} />
          <Row y={450} num="2" lines={['Kalikan 365.']} pIn={r2} pCheck={c2} />
          <Row y={650} num="3" lines={['Baca total', 'pengembalian.']} pIn={r3} pCheck={c3} accent />
          <MarkerText x={196} y={810} lines="bukan cuma bunganya." size={36} fill="#5B5548" opacity={r3} />
        </LinedPaper>
      </g>

      <PaperSource text="Tiga langkah ini aritmetika biasa — bisa dicek dengan kalkulator apa pun." />
    </SceneShell>
  );
};
