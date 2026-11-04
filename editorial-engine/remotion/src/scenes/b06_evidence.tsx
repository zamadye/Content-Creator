/**
 * B06 — EVIDENCE
 * --------------
 * Dua batang: 77,8 juta pekerja informal, 13,56 juta yang terlindungi.
 * Persentase ditulis di sela, bukan di ujung — supaya yang terbaca proporsi.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchUnderline, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const FULL = 760;
const SCALE = (juta: number) => Math.max(30, Math.round((juta / 77.8) * FULL));

export const B06Evidence: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const headIn = seg(f, 0, 10);
  const bar1 = seg(f, d * 0.08, d * 0.34);
  const bar2 = seg(f, d * 0.38, d * 0.6);
  const pct = seg(f, d * 0.62, d * 0.8);
  const under = seg(f, d * 0.84, d * 0.98);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.4}>
      <PaperBg seed={61} tone="cream" dark={0.06} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={headIn}>
        <MarkerText x={72} y={330} lines={['BPJS Ketenagakerjaan', 'menghitung dirinya sendiri']} size={52} lineHeight={68} fill={palette.marker} />
      </g>

      <g opacity={1}>
        <T x={72} y={520} size={26} weight={700} tracking={1.8} fill={palette.paperShadow}>
          PEKERJA INFORMAL (POTENSI)
        </T>
        <rect x={72} y={540} width={SCALE(77.8) * bar1} height={110} rx={3} fill={palette.kraft} />
        <T x={96} y={608} size={54} weight={800} fill={palette.paper} opacity={bar1 > 0.6 ? 1 : 0}>
          77,8 juta
        </T>
      </g>

      <g opacity={1}>
        <T x={72} y={760} size={26} weight={700} tracking={1.8} fill={palette.paperShadow}>
          YANG TERLINDUNGI (PER JULI 2026)
        </T>
        <rect x={72} y={780} width={SCALE(13.56) * bar2} height={110} rx={3} fill={palette.brick} />
        <T x={72 + SCALE(13.56) + 26} y={852} size={50} weight={800} fill={palette.markerRed} opacity={bar2 > 0.9 ? 1 : 0}>
          13,56 juta
        </T>
      </g>

      <g opacity={pct}>
        <Tape x={72 + SCALE(13.56) + 200} y={768} w={110} h={30} rotate={-4} opacity={0.5} />
        <MarkerText x={72} y={1010} lines="17,44 persen" size={86} fill={palette.markerRed} />
        <SketchUnderline x1={72} y={1040} x2={430} p={under} width={8} />
      </g>

      <g opacity={pct}>
        <MarkerText x={72} y={1160} lines={['Sisanya: tidak terdaftar.', 'Bukan tidak mau — tidak tercatat.']} size={44} lineHeight={60} fill={palette.marker} />
      </g>

      <PaperSource text="BPJS Ketenagakerjaan, 28 Agu 2026 — data per Juli 2026 (Dirut, dikutip media)" />
    </SceneShell>
  );
};
