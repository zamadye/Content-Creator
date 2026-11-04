/**
 * B03 — CONFLICT
 * --------------
 * Tiga batang dengan panjang mengikuti angkanya.
 * 148,19 juta → 60,31 juta → 13,3 juta.
 * Label nilai dipindah ke LUAR batang bila batangnya pendek, supaya tidak terpotong.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const FULL = 760;
const px = (juta: number) => Math.max(24, Math.round((juta / 148.19) * FULL));

const ROWS = [
  { label: 'PENDUDUK YANG BEKERJA', value: '148,19 juta', juta: 148.19, fill: palette.kraft, y: 430 },
  { label: 'YANG BERSTATUS FORMAL', value: '60,31 juta', juta: 60.31, fill: palette.kraftLight, y: 690 },
  { label: 'YANG AKAN MENERIMA', value: '13,3 juta', juta: 13.3, fill: palette.brick, y: 950 },
];

export const B03Conflict: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const headIn = seg(f, 0, 10);
  const p = [seg(f, d * 0.08, d * 0.24), seg(f, d * 0.33, d * 0.49), seg(f, d * 0.58, d * 0.74)];
  const frameIn = seg(f, d * 0.78, d * 0.9);
  const note = seg(f, d * 0.84, d * 0.99);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={31} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g opacity={headIn}>
        <MarkerText x={72} y={310} lines="Siapa yang masuk daftar" size={56} fill={palette.marker} />
      </g>

      {ROWS.map((r, i) => {
        const w = px(r.juta);
        const inside = w > 300;
        return (
          <g key={r.label} opacity={p[i]}>
            <T x={72} y={r.y - 16} size={24} weight={700} tracking={1.8} fill={palette.paperShadow} opacity={0.9}>
              {r.label}
            </T>
            <rect x={72} y={r.y} width={Math.max(4, w * p[i])} height={96} rx={3} fill={r.fill} />
            <rect x={72} y={r.y} width={Math.max(4, w * p[i])} height={10} rx={3} fill={palette.kraftDeep} opacity={0.26} />
            {inside ? (
              <MarkerText x={96} y={r.y + 68} lines={r.value} size={42} fill={palette.paper} opacity={p[i]} />
            ) : (
              <MarkerText x={72 + w + 44} y={r.y + 68} lines={r.value} size={42} fill={palette.markerRed} opacity={p[i]} />
            )}
          </g>
        );
      })}

      <g opacity={frameIn}>
        <rect x={58} y={936} width={px(13.3) + 26} height={124} fill="none" stroke={palette.markerRed} strokeWidth={5} rx={4} />
      </g>

      <g opacity={note}>
        <Slip x={120} y={1130} w={840} h={180} seed={34} lines={0} rotate={-1.2}>
          <Tape x={330} y={-14} w={120} h={32} rotate={-4} opacity={0.45} />
          <MarkerText x={420} y={78} anchor="middle" lines="sembilan dari seratus" size={50} fill={palette.marker} />
          <T x={420} y={132} anchor="middle" size={26} weight={600} fill={palette.paperShadow}>
            13,3 juta ÷ 148,19 juta = 8,97 persen (hitungan sendiri)
          </T>
        </Slip>
      </g>

      <PaperSource text="BPS, Sakernas Mei 2026 · sasaran penerima: Kemnaker 2026" />
    </SceneShell>
  );
};
