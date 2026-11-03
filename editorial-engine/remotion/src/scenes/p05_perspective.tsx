/**
 * P05 — PERSPECTIVE
 * -----------------
 * Tiga baris, SATU skala. Batang 365 hari tumbuh 380 px; batang per hari tumbuh 0,57 px
 * sehingga digambar setebal 3 px dan diberi label "di bawah 1 px" — bukan dibesarkan
 * supaya kelihatan, karena justru kecilnya itu yang jadi pesan.
 *
 * Koordinat anak Slip = lokal kartu.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchBarH, SketchUnderline, Slip } from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** 380 px = Rp1.984.287. Skala yang sama dipakai untuk ketiga batang. */
const SCALE = 380 / 1984287;
const BAR_X = 600;
const BAR_H = 38;

const Row: React.FC<{
  y: number;
  period: string;
  value: string;
  amount: number;
  pIn: number;
  pBar: number;
  note: string;
  accent?: boolean;
}> = ({ y, period, value, amount, pIn, pBar, note, accent = false }) => {
  const w = Math.max(3, amount * SCALE);
  return (
    <g opacity={pIn} transform={`translate(${(1 - pIn) * 26} 0)`}>
      <Slip x={70} y={y} w={470} h={160} seed={y} lines={0} fill={accent ? palette.paperWarm : palette.paper} rotate={accent ? -1.4 : 1.2}>
        <MarkerText x={28} y={52} lines={period} size={30} fill="#5B5548" />
        <MarkerText x={28} y={122} lines={value} size={54} fill={accent ? palette.markerRed : palette.marker} />
      </Slip>
      <SketchBarH x={BAR_X} y={y + (160 - BAR_H) / 2} w={w} h={BAR_H} p={pBar} fill={accent ? palette.markerRed : palette.marker} seed={y + 3} />
      <MarkerText x={BAR_X} y={y + 186} lines={note} size={26} fill="#5B5548" opacity={Math.min(1, pBar * 1.4)} />
    </g>
  );
};

export const P05Perspective: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const r1 = seg(f, d * 0.04, d * 0.12);
  const b1 = seg(f, d * 0.1, d * 0.2);
  const r2 = seg(f, d * 0.28, d * 0.36);
  const b2 = seg(f, d * 0.34, d * 0.46);
  const r3 = seg(f, d * 0.52, d * 0.6);
  const b3 = seg(f, d * 0.58, d * 0.82);
  const micro = seg(f, d * 0.8, d * 0.86);
  const close = seg(f, d * 0.82, d * 0.91);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={11} />
      <PaperHeader />
      <PaperIllustrationTag />

      <MarkerText x={72} y={330} lines="Skala yang sama untuk ketiganya." size={38} fill="#5B5548" opacity={r1} />

      <Row y={380} period="PER HARI" value="Rp3.000" amount={3000} pIn={r1} pBar={b1} note="lebar batang: 1 px" />
      <Row y={600} period="30 HARI" value="Rp90.000" amount={90000} pIn={r2} pBar={b2} note="lebar batang: 17 px" />
      <Row y={820} period="365 HARI" value="Rp1.984.287" amount={1984287} pIn={r3} pBar={b3} note="lebar batang: 380 px" accent />

      <g opacity={close}>
        <MarkerText x={72} y={1140} lines="Setahun, bunganya" size={52} />
        <MarkerText x={72} y={1258} lines="hampir Rp2 juta." size={84} fill={palette.markerRed} />
        <SketchUnderline x1={72} y={1294} x2={700} p={close} width={8} />
      </g>

      <MarkerText x={72} y={1384} lines="untuk pinjaman Rp1 juta." size={40} fill="#5B5548" opacity={micro} />

      <PaperSource text="Bunga majemuk 365 hari atas pokok Rp1.000.000 (S1) — bukan total tagihan, bukan bunga tunggal." />
    </SceneShell>
  );
};
