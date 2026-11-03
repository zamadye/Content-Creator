/**
 * PROPS & ENVIRONMENTS — misi `judol-taruhan-kecil-2026`
 * ------------------------------------------------------
 * Aturan yang dipegang:
 *   - kode pembayaran digambar sebagai mosaik kotak generik — TIDAK PERNAH kode
 *     yang bisa dipindai, karena frame ini akan tersebar di feed
 *   - tidak ada merek, tidak ada nama situs, tidak ada logo institusi
 *   - warung di k01, k05, k07 memakai tata letak yang sama; hanya cahaya yang berubah
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { Circle, Ellipse, Path, Rect, T } from './primitives';

const rnd = (i: number) => {
  const x = Math.sin(i * 7.311 + 1.729) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------------------------------------------------------------- 1. warung malam */

export const WarungMeja: React.FC<{ lamp?: number; cold?: number; shelfRows?: number }> = ({
  lamp = 1,
  cold = 0,
  shelfRows = 3,
}) => {
  const wall = cold > 0.5 ? '#20272A' : '#26241C';
  const glass = cold > 0.5 ? '#2C3538' : '#332F24';
  return (
    <g>
      <Rect x={0} y={0} w={1080} h={1920} fill={palette.ink} />
      {/* dinding warung */}
      <Rect x={0} y={0} w={1080} h={1240} fill={wall} />
      {/* rak sachet di belakang */}
      {[420, 620, 820].slice(3 - Math.max(0, Math.min(3, shelfRows))).map((y, row) => (
        <g key={y}>
          <Rect x={40} y={y} w={640} h={12} fill="#3A3427" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Rect
              key={i}
              x={56 + i * 78}
              y={y - 54}
              w={54}
              h={54}
              r={3}
              fill={i % 3 === 0 ? '#8C7A52' : i % 3 === 1 ? '#6F6244' : '#9A8557'}
              opacity={0.9 - row * 0.08}
            />
          ))}
        </g>
      ))}
      {/* jalan gelap di kanan */}
      <Rect x={720} y={0} w={360} h={1240} fill="#0E1210" />
      <Rect x={720} y={0} w={5} h={1240} fill={palette.paper} opacity={0.06} />
      {/* meja kaca */}
      <Rect x={0} y={1240} w={1080} h={40} fill={glass} />
      <Rect x={0} y={1280} w={1080} h={640} fill="#1C1A14" />
      <Rect x={0} y={1240} w={1080} h={6} fill={palette.warmLight} opacity={0.16 + 0.1 * lamp} />
      {/* pantulan di kaca */}
      <Rect x={120} y={1252} w={300} h={14} fill={palette.warmLight} opacity={0.08 * lamp} />
      {/* lampu gantung */}
      <Rect x={536} y={0} w={4} h={150} fill={palette.inkSoft} />
      <Path d="M 486 150 L 590 150 L 570 196 L 506 196 Z" fill="#4A3A26" />
      <Ellipse cx={538} cy={198} rx={28} ry={8} fill={palette.warmLight} opacity={0.9 * lamp} />
      <Path d="M 494 198 L 582 198 L 760 1240 L 316 1240 Z" fill={palette.warmLight} opacity={0.09 * lamp} />
      <Rect x={0} y={0} w={1080} h={1920} fill="url(#vignette)" opacity={0.4} />
    </g>
  );
};

/** Dudukan akrilik dengan kode pembayaran generik (bukan kode fungsional). */
export const QrisStand: React.FC<{ x: number; y: number; s?: number; glow?: number }> = ({ x, y, s = 1, glow = 1 }) => {
  const N = 9;
  const cell = 15;
  const size = N * cell;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={6} rx={96} ry={16} fill={palette.ink} opacity={0.45} />
      {/* dasar akrilik */}
      <Path d="M -80 0 L 80 0 L 70 -30 L -70 -30 Z" fill={palette.paperShadow} opacity={0.5} />
      <Rect x={-86} y={-196} w={172} h={170} r={6} fill={palette.paper} opacity={0.96} />
      <Rect x={-86} y={-196} w={172} h={170} r={6} fill={palette.warmLight} opacity={0.08 * glow} />
      {/* mosaik kode */}
      <g transform={`translate(${-size / 2} ${-196 + 26})`}>
        {Array.from({ length: N * N }).map((_, i) => {
          const c = i % N;
          const r = Math.floor(i / N);
          const finder = (c < 3 && r < 3) || (c > N - 4 && r < 3) || (c < 3 && r > N - 4);
          const on = finder || rnd(i + 3) > 0.52;
          return on ? (
            <Rect key={i} x={c * cell} y={r * cell} w={cell - 2} h={cell - 2} fill={palette.ink} opacity={finder ? 0.95 : 0.8} />
          ) : null;
        })}
      </g>
      {/* label instrumen — bukan merek, ini nama sistem pembayaran nasional */}
      <T x={0} y={-12} size={13} weight={700} tracking={3.4} fill={palette.inkSoft} anchor="middle" opacity={0.8}>
        QRIS
      </T>
      {/* kilau akrilik */}
      <Rect x={-78} y={-190} w={26} h={150} fill={palette.white} opacity={0.1} />
    </g>
  );
};

export const Kopi: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Ellipse cx={0} cy={4} rx={34} ry={8} fill={palette.ink} opacity={0.4} />
    <Path d="M -28 0 L -22 -74 L 22 -74 L 28 0 Z" fill={palette.paper} opacity={0.18} />
    <Path d="M -24 -10 L -20 -56 L 20 -56 L 24 -10 Z" fill="#3A2415" opacity={0.9} />
    <Ellipse cx={0} cy={-56} rx={20} ry={5} fill="#5A3A22" />
    <Path d="M -28 0 L -22 -74 L 22 -74 L 28 0 Z" fill="none" stroke={palette.paper} strokeWidth={2} opacity={0.5} />
  </g>
);

/* ---------------------------------------------------------------- 2. aliran titik */

export const TitikAliran: React.FC<{ p: number; fromX: number; fromY: number; toX: number; toY: number; n?: number; color?: string }> = ({
  p,
  fromX,
  fromY,
  toX,
  toY,
  n = 26,
  color = palette.mustard,
}) => (
  <g opacity={0.85}>
    {Array.from({ length: n }).map((_, i) => {
      const off = (i / n + p * 1.4) % 1;
      const x = fromX + (toX - fromX) * off;
      const y = fromY + (toY - fromY) * off + Math.sin((off + i) * 6) * 10;
      const o = Math.sin(off * Math.PI);
      return <Circle key={i} cx={x} cy={y} r={3 + (i % 3)} fill={color} opacity={o * 0.9} />;
    })}
  </g>
);

/* ---------------------------------------------------------------- 3. blok & plat angka */

export const BlokAngka: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  value: string;
  sub?: string;
  valueSize?: number;
  ink?: string;
  paper?: string;
  rotate?: number;
  opacity?: number;
}> = ({ x, y, w, h, title, value, sub, valueSize = 76, ink = palette.ink, paper = palette.paper, rotate = 0, opacity = 1 }) => (
  <g opacity={opacity} transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
    <Rect x={x + 6} y={y + 8} w={w} h={h} r={3} fill={palette.ink} opacity={0.35} />
    <Rect x={x} y={y} w={w} h={h} r={3} fill={paper} />
    <Rect x={x} y={y} w={w} h={7} fill={palette.mustard} opacity={0.85} />
    <T x={x + 24} y={y + 48} size={16} weight={700} tracking={2.8} fill={ink} opacity={0.62}>
      {title}
    </T>
    <T x={x + 24} y={y + 48 + valueSize * 0.92} size={valueSize} family={t.display} fill={ink} tracking={-2}>
      {value}
    </T>
    {sub && (
      <T x={x + 24} y={y + h - 22} size={17} weight={500} fill={ink} opacity={0.6}>
        {sub}
      </T>
    )}
  </g>
);

/** Plat logam di dinding — dipakai untuk angka penindakan (k06). */
export const PlatAngka: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  value: string;
  note?: string;
  dim?: number;
  empty?: boolean;
}> = ({ x, y, w, h, label, value, note, dim = 1, empty = false }) => (
  <g opacity={dim}>
    <Rect x={x} y={y} w={w} h={h} r={2} fill={empty ? 'none' : '#2C3129'} stroke={empty ? palette.paper : 'none'} strokeWidth={empty ? 2 : 0} opacity={empty ? 0.4 : 1} />
    {!empty && <Rect x={x} y={y} w={w} h={5} fill={palette.mustard} opacity={0.7} />}
    <T x={x + 22} y={y + 42} size={15} weight={700} tracking={2.4} fill={palette.sage} opacity={empty ? 0.6 : 1}>
      {label}
    </T>
    {empty ? (
      <T x={x + 22} y={y + h / 2 + 12} size={24} weight={600} tracking={2} fill={palette.brickLight}>
        TIDAK ADA DATA
      </T>
    ) : (
      <T x={x + 22} y={y + h / 2 + 18} size={52} family={t.display} fill={palette.paper} tracking={-1.6}>
        {value}
      </T>
    )}
    {note && (
      <T x={x + 22} y={y + h - 20} size={16} weight={500} fill={palette.paper} opacity={0.5}>
        {note}
      </T>
    )}
  </g>
);

/* ---------------------------------------------------------------- 4. panah & koin */

/** Panah tegak: 1 = ke atas, -1 = ke bawah. */
export const PanahTegak: React.FC<{ x: number; y: number; len: number; dir: 1 | -1; p: number; color?: string }> = ({
  x,
  y,
  len,
  dir,
  p,
  color = palette.mustard,
}) => {
  const l = len * p;
  const tipY = dir === 1 ? y - l : y + l;
  return (
    <g opacity={0.95}>
      <Rect x={x - 7} y={dir === 1 ? tipY + 26 : y} w={14} h={Math.max(0, l - 26)} fill={color} />
      <Path d={`M ${x - 26} ${tipY + dir * 30} L ${x} ${tipY} L ${x + 26} ${tipY + dir * 30} Z`} fill={color} opacity={p > 0.4 ? 1 : 0} />
    </g>
  );
};

export const Koin: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 1, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <Ellipse cx={0} cy={0} rx={17} ry={7} fill={palette.mustardDeep} />
    <Ellipse cx={0} cy={-3} rx={17} ry={7} fill={palette.mustard} />
    <Ellipse cx={0} cy={-3} rx={10} ry={4} fill={palette.mustardDeep} opacity={0.5} />
  </g>
);

export const LembarUang: React.FC<{ x: number; y: number; s?: number; rotate?: number; broken?: number }> = ({
  x,
  y,
  s = 1,
  rotate = -4,
  broken = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 + broken * 0.05)}) rotate(${rotate})`} opacity={1 - broken * 0.5}>
    <Rect x={-190} y={-88} w={380} h={176} r={6} fill="#CBB78C" />
    <Rect x={-190} y={-88} w={380} h={176} r={6} fill="none" stroke={palette.ink} strokeWidth={2} opacity={0.25} />
    <Circle cx={-130} cy={0} r={44} fill={palette.paperDim} opacity={0.9} />
    <Circle cx={-130} cy={0} r={44} fill="none" stroke={palette.ink} strokeWidth={2} opacity={0.2} />
    <Rect x={-60} y={-40} w={210} h={12} fill={palette.ink} opacity={0.35} />
    <Rect x={-60} y={-12} w={170} h={10} fill={palette.ink} opacity={0.25} />
    <Rect x={-60} y={16} w={190} h={10} fill={palette.ink} opacity={0.25} />
    {/* garis guilloche & strip tanda tangan: membuat lembaran terbaca sebagai uang,
        bukan sekadar persegi panjang */}
    {Array.from({ length: 7 }).map((_, i) => (
      <Path
        key={i}
        d={`M -178 ${-78 + i * 24} q 120 10 240 0 q 60 -6 118 2`}
        stroke={palette.ink}
        strokeWidth={1}
        fill="none"
        opacity={0.12}
      />
    ))}
    <Rect x={-186} y={-80} w={372} h={4} fill={palette.ink} opacity={0.14} />
    <Rect x={-186} y={76} w={372} h={4} fill={palette.ink} opacity={0.14} />
    <Rect x={72} y={54} w={100} h={7} fill={palette.ink} opacity={0.28} />
    <T x={128} y={-46} size={30} family={t.display} fill={palette.ink} anchor="middle" opacity={0.55}>
      Rp
    </T>
  </g>
);

/* ---------------------------------------------------------------- 5. lapisan */

export const Scrim: React.FC<{ y: number; h: number; from?: number; to?: number; color?: string }> = ({
  y,
  h,
  from = 0.85,
  to = 0,
  color = palette.ink,
}) => {
  const id = `judol-scrim-${Math.round(y)}-${Math.round(h)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={from} />
          <stop offset="100%" stopColor={color} stopOpacity={to} />
        </linearGradient>
      </defs>
      <rect x={0} y={y} width={1080} height={h} fill={`url(#${id})`} />
    </g>
  );
};

export const ForegroundEdge: React.FC<{ y: number; h?: number; tone?: string }> = ({ y, h = 220, tone = '#1B1710' }) => (
  <g>
    <Rect x={0} y={y} w={1080} h={h} fill={tone} />
    <Rect x={0} y={y} w={1080} h={3} fill={palette.warmLight} opacity={0.1} />
  </g>
);
