/**
 * B04 — DEVELOPMENT
 * -----------------
 * Seratus kotak untuk pekerja formal; 22 dicap, 78 kosong.
 * Lalu satu baris untuk 87,88 juta pekerja informal: tanpa satu pun cap.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const COLS = 10;
const S = 52;
const GAP = 7;
const X0 = 245;
const Y0 = 452;
const STAMPS = 22;

export const B04Development: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const headIn = seg(f, 0, 10);
  const gridIn = seg(f, d * 0.06, d * 0.16);
  const stampP = (i: number) => seg(f, d * 0.12 + (i / STAMPS) * d * 0.34, d * 0.14 + (i / STAMPS) * d * 0.34);
  const label22 = seg(f, d * 0.5, d * 0.62);
  const informal = seg(f, d * 0.68, d * 0.82);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={41} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={headIn}>
        <MarkerText x={72} y={330} lines="100 pekerja formal" size={58} fill={palette.marker} />
        <T x={72} y={386} size={28} weight={600} fill={palette.paperShadow} opacity={0.9}>
          60,31 juta orang · BPS Mei 2026
        </T>
      </g>

      {Array.from({ length: 100 }, (_, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        const x = X0 + c * (S + GAP);
        const y = Y0 + r * (S + GAP);
        const stamped = i < STAMPS;
        const p = stamped ? stampP(i) : 0;
        return (
          <g key={i} opacity={gridIn}>
            <rect x={x} y={y} width={S} height={S} fill={palette.paper} stroke={palette.paperShadow} strokeWidth={1.6} rx={3} />
            {stamped && (
              <g opacity={p}>
                <rect x={x + 5} y={y + 5} width={S - 10} height={S - 10} fill={palette.brick} opacity={0.82} rx={2} />
                <path d={`M ${x + 12} ${y + S / 2} L ${x + S / 2 - 2} ${y + S - 14} L ${x + S - 10} ${y + 14}`} fill="none" stroke={palette.paper} strokeWidth={4} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}

      <g opacity={label22}>
        <MarkerText x={96} y={1104} lines="22 menerima · 78 tidak" size={46} fill={palette.marker} />
        <SketchUnderline x1={96} y={1132} x2={560} p={label22} width={7} />
      </g>

      <g opacity={informal}>
        <Slip x={96} y={1170} w={888} h={225} seed={44} lines={0} rotate={-1.1}>
          <Tape x={330} y={-16} w={130} h={36} rotate={-4} opacity={0.5} />
          <T x={32} y={66} size={26} weight={700} tracking={1.6} fill={palette.paperShadow}>
            PEKERJA INFORMAL
          </T>
          <MarkerText x={32} y={140} lines="87,88 juta" size={66} fill={palette.markerRed} />
          <T x={32} y={192} size={27} weight={600} fill={palette.paperShadow} opacity={0.92}>
            tidak punya nomor peserta · tidak ada di daftar
          </T>
        </Slip>
      </g>

      <PaperSource text="BPS, Sakernas Mei 2026 · 13,3 juta ÷ 60,31 juta = 22 persen (hitungan sendiri)" />
    </SceneShell>
  );
};
