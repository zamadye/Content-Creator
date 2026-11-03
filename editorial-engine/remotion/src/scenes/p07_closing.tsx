/**
 * P07 — CLOSING
 * -------------
 * Tidak ada elemen baru yang ditempel. Kertas menggelap sedikit, dua baris terakhir
 * ditulis tangan, lalu berhenti. Tidak ada ajakan, tidak ada penawaran.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, Pencil, SketchUnderline } from '../illustration/topic-paper';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const P07Closing: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const dim = seg(f, 0, d * 0.5);
  const l1 = seg(f, d * 0.1, d * 0.38);
  const l2 = seg(f, d * 0.44, d * 0.76);
  const under = seg(f, d * 0.78, d * 0.92);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperDeep} showBrand={false} source={null} vignette={0.62} dipIn={10} dipOut={12}>
      <PaperBg seed={17} tone="deep" dark={0.015 + dim * 0.045} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={l1}>
        <MarkerText x={72} y={820} lines="Angka harian bikin" size={66} />
        <MarkerText x={72} y={906} lines="utang kelihatan kecil." size={66} />
      </g>

      <g opacity={l2}>
        <MarkerText x={72} y={1090} lines="Angka setahun" size={92} fill={palette.markerRed} />
        <MarkerText x={72} y={1194} lines="tidak bisa" size={92} fill={palette.markerRed} />
        <MarkerText x={72} y={1298} lines="disembunyikan." size={92} fill={palette.markerRed} />
      </g>
      <SketchUnderline x1={72} y={1340} x2={690} p={under} width={9} />

      <Pencil x={760} y={1420} s={0.82} rotate={-18} opacity={0.86} />

      <PaperSource text="Sumber: perhitungan bunga tunggal & majemuk (S1, S2) · ilustrasi editorial, bukan dokumentasi." />
    </SceneShell>
  );
};
