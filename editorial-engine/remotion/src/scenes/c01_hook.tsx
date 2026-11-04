/**
 * C01 — HOOK / THUMBNAIL FRAME
 * ----------------------------
 * Frame 0 harus bisa dipakai sebagai thumbnail: Buffer TIDAK bisa menyetel thumbnail kustom
 * (metadata.thumbnailUrl ditolak), jadi scene pertama inilah cover-nya.
 * Aturan: gambar sinematik full-bleed + headline penggoda + tanpa fade-in.
 */
import React from 'react';
import { palette, layout } from '../../../design/tokens';
import { MarkerText } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { COVER } from '../covers/umk-2026-enam-dari-sepuluh';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const C01Hook: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  // slow push-in: frame 0..d, komposisi sudah lengkap sejak frame pertama
  const zoom = interpolate(f, [0, d], [1.0, 1.05], { extrapolateRight: 'clamp' });
  const tag = 1; // tagline wajib terlihat sejak frame 0 (frame ini dipakai sebagai thumbnail)
  const under = seg(f, d * 0.55, d * 0.78);

  return (
    <g>
      <rect x={0} y={0} width={layout.video.width} height={layout.video.height} fill={palette.ink} />
      <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
        <image href={COVER} x={0} y={0} width={1080} height={1920} preserveAspectRatio="xMidYMid slice" />
      </g>
      {/* scrim: atas untuk headline, bawah untuk tagline — tipis, tidak menutup gambar */}
      <defs>
        <linearGradient id="hookTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12100D" stopOpacity="0.92" />
          <stop offset="62%" stopColor="#12100D" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#12100D" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hookBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12100D" stopOpacity="0" />
          <stop offset="55%" stopColor="#12100D" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#12100D" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={900} fill="url(#hookTop)" />
      <rect x={0} y={1400} width={1080} height={520} fill="url(#hookBottom)" />

      <T x={72} y={250} size={22} weight={700} tracking={3.4} fill={palette.paper} opacity={0.92}>
        UPAH MINIMUM 2026 · NAIK RATA-RATA 5%
      </T>
      <MarkerText x={64} y={430} lines={['Naik', 'untuk siapa?']} size={132} lineHeight={148} fill={palette.paper} />
      <g opacity={under}>
        <line x1={72} y1={470} x2={72 + 380 * under} y2={470} stroke={palette.brick} strokeWidth={9} strokeLinecap="round" />
      </g>

      <g opacity={tag}>
        <T x={72} y={1638} size={40} weight={800} fill={palette.paper}>
          Enam dari sepuluh pekerja
        </T>
        <T x={72} y={1692} size={40} weight={800} fill="#E08A5F">
          tidak dijangkau aturan ini.
        </T>
      </g>

      <g opacity={0.85}>
        <T x={72} y={1552} size={19} weight={700} tracking={4.2} fill={palette.paper}>SUARA PUBLIK</T>
        <T x={962} y={1552} size={15} weight={700} tracking={2.6} fill={palette.paper}>ILUSTRASI</T>
        <T x={72} y={1808} size={21} weight={600} tracking={0.4} fill={palette.paper}>
          PP 49/2025 · BPS Sakernas Mei 2026 · porsi 59,3% hitungan sendiri
        </T>
      </g>
    </g>
  );
};
