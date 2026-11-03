/**
 * TOPIC KIT — MISI 7: KOLASE KERTAS
 * ---------------------------------
 * Bahasa visual yang diambil dari referensi "Explain What is a StoryBoard_!":
 * seluruh frame adalah selembar kertas kusut, dan semua isi hidup di atasnya
 * sebagai potongan yang ditempel (kardus kraft, nota, kertas grafik, selotip)
 * atau sebagai goresan spidol yang muncul bertahap.
 *
 * Aturan teknis:
 *   - semua kedip/gerak adalah fungsi murni dari props (tidak ada Math.random,
 *     tidak ada CSS) sehingga frame ke-n selalu sama byte-nya;
 *   - goresan "digambar" lewat strokeDasharray/dashoffset yang panjangnya
 *     dihitung dari titik-titik path itu sendiri (bukan angka kira-kira);
 *   - tidak ada filter selain feGaussianBlur dari GlobalDefs (resvg-safe).
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { clamp } from '../runtime';
import { T } from './primitives';

/* ------------------------------------------------------------------ */
/* deterministik                                                       */
/* ------------------------------------------------------------------ */
const makeRnd = (seed: number) => {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

type Pt = [number, number];

const toPath = (pts: Pt[], close = false) =>
  `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}${close ? ' Z' : ''}`;

const lenOf = (pts: Pt[]) => pts.reduce((acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])), 0);

/** Tepi sobek: satu sisi lurus, sisi lain bergerigi tidak beraturan. */
export const tornPath = (x: number, y: number, w: number, h: number, seed: number, jag = 7): string => {
  const r = makeRnd(seed);
  const pts: Pt[] = [];
  const sx = Math.max(26, Math.round(w / 11));
  const sy = Math.max(22, Math.round(h / 7));
  for (let px = 0; px <= w; px += sx) pts.push([x + px, y + (r() * 2 - 1) * jag]);
  for (let py = sy; py <= h; py += sy) pts.push([x + w + (r() * 2 - 1) * jag * 0.6, y + py]);
  for (let px = w; px >= 0; px -= sx) pts.push([x + px, y + h + (r() * 2 - 1) * jag]);
  for (let py = h - sy; py > 0; py -= sy) pts.push([x + (r() * 2 - 1) * jag * 0.6, y + py]);
  return toPath(pts, true);
};

/** Garis tangan: lurus secara konsep, tidak pernah benar-benar lurus. */
export const wobble = (x1: number, y1: number, x2: number, y2: number, amp = 2, steps = 9, seed = 1): Pt[] => {
  const r = makeRnd(seed);
  const pts: Pt[] = [];
  const nx = -(y2 - y1);
  const ny = x2 - x1;
  const nl = Math.hypot(nx, ny) || 1;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const j = (r() * 2 - 1) * amp * (i === 0 || i === steps ? 0.4 : 1);
    pts.push([x1 + (x2 - x1) * k + (nx / nl) * j, y1 + (y2 - y1) * k + (ny / nl) * j]);
  }
  return pts;
};

/** Elips tangan (untuk melingkari kata). */
export const wobbleEllipse = (cx: number, cy: number, rx: number, ry: number, seed = 1, amp = 3): Pt[] => {
  const r = makeRnd(seed);
  const n = 30;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2.15 + 0.4;
    const k = 1 + (r() * 2 - 1) * (amp / Math.max(rx, ry));
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
};

/** Busur kuadratik sampel — dipakai untuk panah dan kurva grafik. */
const quad = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, n = 26, amp = 0, seed = 1): Pt[] => {
  const r = makeRnd(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const u = 1 - k;
    const j = (r() * 2 - 1) * amp;
    pts.push([u * u * x1 + 2 * u * k * cx + k * k * x2 + j, u * u * y1 + 2 * u * k * cy + k * k * y2 + j]);
  }
  return pts;
};

/* ------------------------------------------------------------------ */
/* goresan yang digambar bertahap                                      */
/* ------------------------------------------------------------------ */
export const DrawStroke: React.FC<{
  pts: Pt[];
  p: number;
  stroke: string;
  width: number;
  opacity?: number;
  close?: boolean;
  cap?: 'round' | 'butt';
  dash?: string;
}> = ({ pts, p, stroke, width, opacity = 1, close = false, cap = 'round', dash }) => {
  if (p <= 0 || pts.length < 2) return null;
  const L = lenOf(pts) + 1;
  const shown = clamp(p);
  return (
    <path
      d={toPath(pts, close)}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap={cap}
      strokeLinejoin="round"
      opacity={opacity}
      strokeDasharray={dash ?? `${L}`}
      strokeDashoffset={dash ? 0 : L * (1 - shown)}
    />
  );
};

/** Ujung panah: dua garis pendek yang mengikuti arah datangnya path. */
const ArrowHead: React.FC<{ from: Pt; to: Pt; p: number; stroke: string; width: number; size?: number; opacity?: number }> = ({
  from,
  to,
  p,
  stroke,
  width,
  size = 18,
  opacity = 1,
}) => {
  if (p < 0.88) return null;
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const s = size * clamp((p - 0.88) / 0.12);
  const l: Pt = [to[0] - Math.cos(a - 0.5) * s, to[1] - Math.sin(a - 0.5) * s];
  const r: Pt = [to[0] - Math.cos(a + 0.5) * s, to[1] - Math.sin(a + 0.5) * s];
  return (
    <g opacity={opacity}>
      <path d={toPath([l, to, r])} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* permukaan: kertas kusut                                             */
/* ------------------------------------------------------------------ */
export const PaperBg: React.FC<{
  seed?: number;
  tone?: 'cream' | 'kraft' | 'deep';
  dark?: number;
  creases?: number;
  w?: number;
  h?: number;
}> = ({ seed = 3, tone = 'cream', dark = 0, creases = 6, w = 1080, h = 1920 }) => {
  const W = w;
  const H = h;
  const r = makeRnd(seed * 977 + 13);
  const base = tone === 'cream' ? palette.paperWarm : tone === 'kraft' ? palette.kraftLight : palette.paperDeep;

  const fibers = Array.from({ length: 130 }, () => {
    const x = r() * W;
    const y = r() * H;
    const l = 4 + r() * 26;
    const a = (r() - 0.5) * 0.9;
    return { x, y, x2: x + Math.cos(a) * l, y2: y + Math.sin(a) * l, o: 0.03 + r() * 0.07, light: r() > 0.45 };
  });

  const blotches = Array.from({ length: 9 }, () => ({
    cx: r() * W,
    cy: r() * H,
    rx: 90 + r() * 260,
    ry: 70 + r() * 200,
    o: 0.025 + r() * 0.045,
    rot: r() * 180,
  }));

  const creaseList = Array.from({ length: creases }, (_, i) => {
    const fromTop = r() > 0.5;
    const x1 = fromTop ? r() * W : -40;
    const y1 = fromTop ? -40 : r() * H;
    const x2 = fromTop ? W + 40 : r() * W;
    const y2 = fromTop ? r() * H : H + 40;
    return { x1, y1, x2, y2, cx: r() * W, cy: r() * H, o: 0.07 + r() * 0.08, w: 1.6 + r() * 3.6, seed: i + seed };
  });

  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={base} />

      {blotches.map((b, i) => (
        <ellipse key={`b${i}`} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={palette.paperShadow} opacity={b.o} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
      ))}

      {creaseList.map((c, i) => {
        const d = `M ${c.x1.toFixed(0)} ${c.y1.toFixed(0)} Q ${c.cx.toFixed(0)} ${c.cy.toFixed(0)} ${c.x2.toFixed(0)} ${c.y2.toFixed(0)}`;
        return (
          <g key={`c${i}`}>
            <path d={d} fill="none" stroke={palette.white} strokeWidth={c.w} opacity={c.o} />
            <path d={d} fill="none" stroke={palette.paperShadow} strokeWidth={c.w * 0.6} opacity={c.o * 0.9} transform="translate(2.5 2.5)" />
          </g>
        );
      })}

      {fibers.map((f, i) => (
        <line
          key={`f${i}`}
          x1={f.x}
          y1={f.y}
          x2={f.x2}
          y2={f.y2}
          stroke={f.light ? palette.white : palette.paperShadow}
          strokeWidth={1.1}
          opacity={f.o}
        />
      ))}

      {dark > 0 && <rect x={0} y={0} width={W} height={H} fill={palette.ink} opacity={dark} />}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* potongan kertas                                                     */
/* ------------------------------------------------------------------ */
export const TornCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  fill?: string;
  rotate?: number;
  jag?: number;
  shadow?: number;
  opacity?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, seed = 1, fill = palette.paper, rotate = 0, jag = 7, shadow = 0.2, opacity = 1, children }) => {
  const d = tornPath(0, 0, w, h, seed, jag);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`} opacity={opacity}>
      {shadow > 0 && <path d={d} fill={palette.ink} opacity={shadow} filter="url(#paper-shadow)" transform="translate(7 11)" />}
      <path d={d} fill={fill} />
      {children}
    </g>
  );
};

/** Kardus kraft — potongan utama pembawa angka besar. */
export const KraftCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  rotate?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, seed = 2, rotate = 0, children }) => {
  const r = makeRnd(seed * 31 + 7);
  const grain = Array.from({ length: 60 }, () => ({
    x: r() * w,
    y: r() * h,
    l: 5 + r() * 22,
    o: 0.04 + r() * 0.08,
  }));
  return (
    <TornCard x={x} y={y} w={w} h={h} seed={seed} fill={palette.kraft} rotate={rotate} jag={9} shadow={0.24}>
      <rect x={0} y={0} width={w} height={h} fill={palette.kraftDeep} opacity={0.16} />
      {grain.map((g, i) => (
        <line key={i} x1={g.x} y1={g.y} x2={g.x + g.l} y2={g.y + (i % 3) - 1} stroke={palette.kraftDeep} strokeWidth={1.6} opacity={g.o} />
      ))}
      {children}
    </TornCard>
  );
};

/** Selotip kertas: dua ujung bergerigi, badan tembus cahaya. */
export const Tape: React.FC<{ x: number; y: number; w?: number; h?: number; rotate?: number; opacity?: number }> = ({
  x,
  y,
  w = 150,
  h = 44,
  rotate = -8,
  opacity = 0.62,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`} opacity={opacity}>
    <path
      d={`M 0 ${h * 0.18} L ${w * 0.06} 0 L ${w} ${h * 0.1} L ${w * 0.94} ${h} L 0 ${h * 0.86} Z`}
      fill={palette.tape}
      stroke={palette.paperShadow}
      strokeWidth={0.8}
      opacity={0.9}
    />
    <path d={`M 4 ${h * 0.5} L ${w - 4} ${h * 0.42}`} stroke={palette.white} strokeWidth={2} opacity={0.35} />
  </g>
);

/** Nota/slip: kartu dengan garis tulis horizontal. */
export const Slip: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  rotate?: number;
  fill?: string;
  lines?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, seed = 4, rotate = 0, fill = palette.paper, lines = 4, children }) => (
  <TornCard x={x} y={y} w={w} h={h} seed={seed} fill={fill} rotate={rotate} jag={5} shadow={0.18}>
    {Array.from({ length: lines }, (_, i) => (
      <line
        key={i}
        x1={26}
        y1={h - 26 - i * 26}
        x2={w - 26}
        y2={h - 26 - i * 26}
        stroke={palette.paperShadow}
        strokeWidth={1.4}
        opacity={0.5}
      />
    ))}
    {children}
  </TornCard>
);

/** Kertas buku tulis: garis horizontal + margin merah. */
export const LinedPaper: React.FC<{ x: number; y: number; w: number; h: number; seed?: number; rotate?: number; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  seed = 6,
  rotate = 0,
  children,
}) => (
  <TornCard x={x} y={y} w={w} h={h} seed={seed} fill={palette.paper} rotate={rotate} jag={8} shadow={0.16}>
    {Array.from({ length: Math.floor(h / 78) }, (_, i) => (
      <line key={i} x1={0} y1={54 + i * 78} x2={w} y2={54 + i * 78} stroke={palette.sageDeep} strokeWidth={1.6} opacity={0.28} />
    ))}
    <line x1={92} y1={0} x2={92} y2={h} stroke={palette.brick} strokeWidth={2} opacity={0.22} />
    {children}
  </TornCard>
);

/** Kertas grafik: kotak 1:1 tipis, dipakai untuk kurva bunga majemuk. */
export const GraphPaper: React.FC<{ x: number; y: number; w: number; h: number; seed?: number; rotate?: number; cell?: number; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  seed = 8,
  rotate = 0,
  cell = 54,
  children,
}) => (
  <TornCard x={x} y={y} w={w} h={h} seed={seed} fill={palette.paperDeep} rotate={rotate} jag={7} shadow={0.18}>
    {Array.from({ length: Math.ceil(w / cell) }, (_, i) => (
      <line key={`v${i}`} x1={i * cell} y1={0} x2={i * cell} y2={h} stroke={palette.sageDeep} strokeWidth={1} opacity={0.22} />
    ))}
    {Array.from({ length: Math.ceil(h / cell) }, (_, i) => (
      <line key={`h${i}`} x1={0} y1={i * cell} x2={w} y2={i * cell} stroke={palette.sageDeep} strokeWidth={1} opacity={0.22} />
    ))}
    {children}
  </TornCard>
);

/* ------------------------------------------------------------------ */
/* goresan spidol                                                      */
/* ------------------------------------------------------------------ */
export const MarkerText: React.FC<{
  x: number;
  y: number;
  lines: string | string[];
  size?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  rotate?: number;
  opacity?: number;
  lineHeight?: number;
}> = ({ x, y, lines, size = 76, fill = palette.marker, anchor = 'start', rotate = 0, opacity = 1, lineHeight }) => (
  <g transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} opacity={opacity}>
    <T x={x} y={y} size={size} family={t.display} fill={fill} anchor={anchor} tracking={0} lineHeight={lineHeight ?? size * 1.06}>
      {lines}
    </T>
  </g>
);

/** Lingkaran spidol mengelilingi satu kata/frasa. */
export const SketchCircle: React.FC<{ cx: number; cy: number; rx: number; ry: number; p: number; stroke?: string; width?: number; seed?: number }> = ({
  cx,
  cy,
  rx,
  ry,
  p,
  stroke = palette.markerRed,
  width = 6,
  seed = 5,
}) => <DrawStroke pts={wobbleEllipse(cx, cy, rx, ry, seed, 4)} p={p} stroke={stroke} width={width} opacity={0.92} />;

/** Garis bawah ganda khas spidol. */
export const SketchUnderline: React.FC<{ x1: number; y: number; x2: number; p: number; stroke?: string; width?: number; seed?: number; slant?: number }> = ({
  x1,
  y,
  x2,
  p,
  stroke = palette.markerRed,
  width = 7,
  seed = 9,
  slant = 5,
}) => (
  <g>
    <DrawStroke pts={wobble(x1, y, x2, y + slant, 3, 10, seed)} p={p} stroke={stroke} width={width} opacity={0.9} />
    {p > 0.55 && <DrawStroke pts={wobble(x1 + 12, y + 14, x2 - 18, y + 16 + slant, 3, 10, seed + 3)} p={(p - 0.55) / 0.45} stroke={stroke} width={width * 0.55} opacity={0.7} />}
  </g>
);

/** Panah tangan dengan lidah melengkung. */
export const SketchArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx?: number;
  cy?: number;
  p: number;
  stroke?: string;
  width?: number;
  seed?: number;
  head?: number;
}> = ({ x1, y1, x2, y2, cx, cy, p, stroke = palette.marker, width = 5, seed = 11, head = 20 }) => {
  const ctrlX = cx ?? (x1 + x2) / 2;
  const ctrlY = cy ?? (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.22;
  const pts = quad(x1, y1, ctrlX, ctrlY, x2, y2, 26, 1.6, seed);
  const tip = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  return (
    <g>
      <DrawStroke pts={pts} p={p} stroke={stroke} width={width} opacity={0.92} />
      <ArrowHead from={prev} to={tip} p={p} stroke={stroke} width={width} size={head} />
    </g>
  );
};

/** Garis melingkar: dari satu titik kembali ke titik lain lewat bawah. Panah melingkar. */
export const SketchLoop: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; drop?: number; stroke?: string; width?: number; seed?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  drop = 170,
  stroke = palette.markerRed,
  width = 5,
  seed = 17,
}) => {
  const r = makeRnd(seed);
  const pts: Pt[] = [];
  const n = 30;
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = x1 + (x2 - x1) * k;
    const y = y1 + (y2 - y1) * k + Math.sin(k * Math.PI) * drop + (r() * 2 - 1) * 1.8;
    pts.push([x, y]);
  }
  const tip = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const inside = lo <= x1 && x1 <= hi;
  return (
    <g>
      <DrawStroke pts={pts} p={p} stroke={stroke} width={width} opacity={0.85} />
      <ArrowHead from={prev} to={[tip[0], tip[1] - 4]} p={inside ? p : p} stroke={stroke} width={width} size={18} />
    </g>
  );
};

/** Centang spidol. */
export const SketchCheck: React.FC<{ x: number; y: number; s?: number; p: number; stroke?: string; width?: number }> = ({
  x,
  y,
  s = 1,
  p,
  stroke = palette.markerRed,
  width = 7,
}) => (
  <g>
    <DrawStroke pts={wobble(x, y, x + 22 * s, y + 26 * s, 1.6, 4, 21)} p={Math.min(1, p / 0.42)} stroke={stroke} width={width} />
    <DrawStroke pts={wobble(x + 22 * s, y + 26 * s, x + 62 * s, y - 30 * s, 2, 6, 23)} p={Math.max(0, (p - 0.42) / 0.58)} stroke={stroke} width={width} />
  </g>
);

/** Kotak centang (kosong) yang digambar tangan. */
export const CheckBox: React.FC<{ x: number; y: number; size?: number; p?: number; stroke?: string }> = ({ x, y, size = 46, p = 1, stroke = palette.marker }) => {
  const s = size;
  const pts: Pt[] = [
    [x, y],
    [x + s, y - 1],
    [x + s - 1, y + s],
    [x + 1, y + s + 1],
    [x, y],
  ];
  return <DrawStroke pts={pts} p={p} stroke={stroke} width={4} opacity={0.9} />;
};

/** Batang grafik arang, tumbuh dari garis dasar. */
export const SketchBar: React.FC<{
  x: number;
  yBase: number;
  w: number;
  h: number;
  p: number;
  fill?: string;
  seed?: number;
  opacity?: number;
}> = ({ x, yBase, w, h, p, fill = palette.marker, seed = 13, opacity = 0.9 }) => {
  const r = makeRnd(seed);
  const hh = h * clamp(p);
  if (hh < 1) return null;
  const top: Pt[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) top.push([x + (w * i) / steps, yBase - hh + (i === 0 || i === steps ? 1 : (r() * 2 - 1) * 2.4)]);
  const pts: Pt[] = [...top, [x + w - 1, yBase], [x + 1, yBase]];
  return (
    <g opacity={opacity}>
      <path d={toPath(pts, true)} fill={fill} />
      {Array.from({ length: 4 }, (_, i) => (
        <line
          key={i}
          x1={x + 4 + i * 2}
          y1={yBase - 6 - (hh - 12) * (i / 4)}
          x2={x + w - 6}
          y2={yBase - 6 - (hh - 12) * (i / 4) + 3}
          stroke={palette.paper}
          strokeWidth={1.2}
          opacity={0.12}
        />
      ))}
    </g>
  );
};

/** Grid hari (kotak-kotak) yang terisi satu per satu. */
export const TallyGrid: React.FC<{
  x: number;
  y: number;
  cols: number;
  rows: number;
  cell?: number;
  gap?: number;
  filled: number;
  fillProgress?: number;
  stroke?: string;
  fill?: string;
  seed?: number;
  drawn?: number;
  opacity?: number;
}> = ({ x, y, cols, rows, cell = 44, gap = 14, filled, fillProgress = 1, stroke = palette.marker, fill = palette.marker, drawn = 1, opacity = 1 }) => {
  const cells = Array.from({ length: cols * rows }, (_, i) => i);
  return (
    <g opacity={opacity}>
      {cells.map((i) => {
        const c = i % cols;
        const rr = Math.floor(i / cols);
        const cx = x + c * (cell + gap);
        const cy = y + rr * (cell + gap);
        const appear = clamp((drawn * (cols * rows + 8) - i) / 8);
        if (appear <= 0) return null;
        const isFilled = i < filled;
        const partial = i === filled ? clamp(fillProgress) : 0;
        return (
          <g key={i} opacity={appear}>
            <CheckBox x={cx} y={cy} size={cell} stroke={stroke} />
            {(isFilled || partial > 0) && (
              <g opacity={isFilled ? 1 : partial}>
                <rect x={cx + 6} y={cy + 6} width={cell - 12} height={cell - 12} fill={fill} opacity={0.82} />
                <line x1={cx + 8} y1={cy + cell - 8} x2={cx + cell - 8} y2={cy + 8} stroke={palette.paper} strokeWidth={2} opacity={0.35} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Pensil (untuk menandai bahwa ini sketsa, bukan tangkapan layar). */
export const Pencil: React.FC<{ x: number; y: number; s?: number; rotate?: number; opacity?: number }> = ({ x, y, s = 1, rotate = -32, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`} opacity={opacity}>
    <rect x={0} y={-13} width={196} height={26} fill={palette.mustard} />
    <rect x={0} y={-13} width={196} height={9} fill={palette.mustardDeep} opacity={0.55} />
    <path d="M 196 -13 L 236 0 L 196 13 Z" fill={palette.paperWarm} />
    <path d="M 224 -4 L 236 0 L 224 4 Z" fill={palette.marker} />
    <rect x={-2} y={-13} width={16} height={26} fill={palette.brick} opacity={0.8} />
  </g>
);

/* ------------------------------------------------------------------ */
/* kemunculan tulisan & kepala halaman                                 */
/* ------------------------------------------------------------------ */
/**
 * Tulisan yang "sedang ditulis": sebuah clip melebar dari kiri ke kanan.
 * Dipakai untuk teks spidol, karena men-fade teks tidak pernah terbaca sebagai menulis.
 */
export const PaperWrite: React.FC<{ id: string; x: number; y: number; w: number; h: number; p: number; children: React.ReactNode }> = ({
  id,
  x,
  y,
  w,
  h,
  p,
  children,
}) => (
  <g>
    <clipPath id={id}>
      <rect x={x - 8} y={y - 8} width={Math.max(0, (w + 12) * clamp(p))} height={h + 16} />
    </clipPath>
    <g clipPath={`url(#${id})`}>{children}</g>
  </g>
);

/** Kepala halaman: nama kanal ditulis spidol, bukan wordmark terang di atas kertas terang. */
export const PaperHeader: React.FC<{ y?: number; color?: string }> = ({ y = 196, color = '#4A453C' }) => (
  <g opacity={0.62}>
    <T x={72} y={y} size={19} weight={700} tracking={4.2} fill={color}>
      SUARA PUBLIK
    </T>
    <rect x={72} y={y + 10} width={34} height={2.5} fill={palette.brick} opacity={0.8} />
  </g>
);

/** Baris sumber di atas kertas — pensil, bukan sage (kontras di latar krem). */
export const PaperSource: React.FC<{ x?: number; y?: number; text: string; opacity?: number }> = ({ x = 72, y = 1672, text, opacity = 0.88 }) => (
  <T x={x} y={y} size={21} weight={600} tracking={0.4} fill="#413C33" opacity={opacity}>
    {text}
  </T>
);

/** Label "ILUSTRASI" versi kertas. */
export const PaperIllustrationTag: React.FC<{ x?: number; y?: number }> = ({ x = 962, y = 196 }) => (
  <g opacity={0.55}>
    <T x={x} y={y} size={15} weight={700} tracking={2.6} fill="#5B5548">
      ILUSTRASI
    </T>
    <line x1={x} y1={y + 8} x2={x + 96} y2={y + 8} stroke={palette.brick} strokeWidth={1.4} opacity={0.6} />
  </g>
);

/** Batang grafik arang versi mendatar (tumbuh ke kanan). */
export const SketchBarH: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  fill?: string;
  seed?: number;
  opacity?: number;
}> = ({ x, y, w, h, p, fill = palette.marker, seed = 15, opacity = 0.9 }) => {
  const r = makeRnd(seed);
  const ww = Math.max(3, w * clamp(p));
  const right: Pt[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) right.push([x + ww + (i === 0 || i === steps ? 1 : (r() * 2 - 1) * 2.2), y + (h * i) / steps]);
  const pts: Pt[] = [[x, y], ...right, [x, y + h]];
  return (
    <g opacity={opacity}>
      <path d={toPath(pts, true)} fill={fill} />
      {Array.from({ length: 3 }, (_, i) => (
        <line
          key={i}
          x1={x + 6}
          y1={y + 7 + (i * (h - 14)) / 3}
          x2={x + ww - 6}
          y2={y + 7 + (i * (h - 14)) / 3 + 2}
          stroke={palette.paper}
          strokeWidth={1.2}
          opacity={0.12}
        />
      ))}
    </g>
  );
};
