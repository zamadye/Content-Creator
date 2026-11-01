/**
 * ILLUSTRATION PRIMITIVES
 * -----------------------
 * Flat 2D vector vocabulary for the editorial identity:
 * deliberate linework, muted earth base, primary accents, strong silhouettes.
 *
 * Everything must render with resvg (no foreignObject, no CSS animation,
 * no filters beyond feGaussianBlur / feTurbulence-lite).
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { clamp } from '../runtime';

/* ------------------------------------------------------------------ */
/* Text                                                               */
/* ------------------------------------------------------------------ */
export type TextProps = {
  x: number;
  y: number; // baseline of the FIRST line
  size?: number;
  family?: string;
  weight?: number;
  fill?: string;
  tracking?: number;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  italic?: boolean;
  children: string | string[];
  lineHeight?: number;
};

/**
 * SVG text with hand-authored line breaks.
 * Line breaks are deliberate (editorial rag control), never auto-wrapped.
 */
export const T: React.FC<TextProps> = ({
  x,
  y,
  size = t.size.body,
  family = t.sans,
  weight = t.weight.regular,
  fill = palette.paper,
  tracking = 0,
  anchor = 'start',
  opacity,
  italic,
  children,
  lineHeight,
}) => {
  const lines = Array.isArray(children) ? children : [children];
  const lh = lineHeight ?? size * 1.18;
  return (
    <text
      x={x}
      y={y}
      fontFamily={family}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      letterSpacing={tracking}
      textAnchor={anchor}
      opacity={opacity}
      fontStyle={italic ? 'italic' : undefined}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={y + i * lh}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

/** Baseline helper: convert a "top of text block" y into a baseline y. */
export const baseline = (top: number, size: number) => top + size * 0.74;

/* ------------------------------------------------------------------ */
/* Shape helpers                                                      */
/* ------------------------------------------------------------------ */
export const Rect: React.FC<
  { x: number; y: number; w: number; h: number; r?: number; rx?: number; fill?: string; opacity?: number; stroke?: string; strokeWidth?: number; filter?: string; rotate?: number; transform?: string }
> = ({ x, y, w, h, r = 0, rx, fill = palette.inkSoft, opacity, stroke, strokeWidth, filter, rotate, transform }) => (
  <rect
    x={x}
    y={y}
    width={Math.max(0, w)}
    height={Math.max(0, h)}
    rx={rx ?? r}
    fill={fill}
    opacity={opacity}
    stroke={stroke}
    strokeWidth={strokeWidth}
    filter={filter}
    transform={transform ?? (rotate ? `rotate(${rotate} ${x + w / 2} ${y + h / 2})` : undefined)}
  />
);

export const Circle: React.FC<{ cx: number; cy: number; r: number; fill?: string; opacity?: number; stroke?: string; strokeWidth?: number }> = ({
  cx,
  cy,
  r,
  fill = palette.ink,
  opacity,
  stroke,
  strokeWidth,
}) => <circle cx={cx} cy={cy} r={Math.max(0.01, r)} fill={fill} opacity={opacity} stroke={stroke} strokeWidth={strokeWidth} />;

export const Ellipse: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill?: string;
  opacity?: number;
  rotate?: number;
  stroke?: string;
  strokeWidth?: number;
  filter?: string;
}> = ({ cx, cy, rx, ry, fill = palette.ink, opacity, rotate, stroke, strokeWidth, filter }) => (
  <ellipse
    cx={cx}
    cy={cy}
    rx={Math.max(0.01, rx)}
    ry={Math.max(0.01, ry)}
    fill={fill}
    opacity={opacity}
    stroke={stroke}
    strokeWidth={strokeWidth}
    filter={filter}
    transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}
  />
);

export const Path: React.FC<{ d: string; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number; linecap?: 'round' | 'butt' | 'square'; linejoin?: 'round' | 'miter' }> = ({
  d,
  fill = 'none',
  stroke,
  strokeWidth,
  opacity,
  linecap = 'round',
  linejoin = 'round',
}) => (
  <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeLinecap={linecap} strokeLinejoin={linejoin} />
);

/** Soft contact shadow: an ellipse or rect that sits under a subject. */
export const GroundShadow: React.FC<{ cx: number; cy: number; rx: number; ry?: number; opacity?: number; fill?: string }> = ({
  cx,
  cy,
  rx,
  ry = 14,
  opacity = 0.18,
  fill = palette.ink,
}) => <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={opacity} />;

export const polar = (x: number, y: number, angleDeg: number, length: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: x + Math.sin(a) * length, y: y + Math.cos(a) * length };
};

/* ------------------------------------------------------------------ */
/* Reusable <defs> — gradients, paper texture, light shafts           */
/* ------------------------------------------------------------------ */
export const SceneDefs: React.FC<{ idPrefix: string }> = ({ idPrefix: p }) => (
  <defs>
    <linearGradient id={`${p}-dusk`} x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stopColor={palette.nightDeep} />
      <stop offset="55%" stopColor={palette.tealDeep} />
      <stop offset="100%" stopColor={palette.ink} />
    </linearGradient>
    <linearGradient id={`${p}-warm`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={palette.paperWarm} />
      <stop offset="100%" stopColor={palette.paperDim} />
    </linearGradient>
    <linearGradient id={`${p}-shaft`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={palette.warmLight} stopOpacity="0.55" />
      <stop offset="100%" stopColor={palette.warmLight} stopOpacity="0" />
    </linearGradient>
    <linearGradient id={`${p}-floorshade`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={palette.ink} stopOpacity="0.28" />
      <stop offset="100%" stopColor={palette.ink} stopOpacity="0" />
    </linearGradient>
    <radialGradient id={`${p}-spot`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stopColor={palette.warmLight} stopOpacity="0.30" />
      <stop offset="70%" stopColor={palette.warmLight} stopOpacity="0.05" />
      <stop offset="100%" stopColor={palette.warmLight} stopOpacity="0" />
    </radialGradient>
    <pattern id={`${p}-batik`} width="26" height="26" patternUnits="userSpaceOnUse">
      <rect width="26" height="26" fill={palette.clayDeep} />
      <circle cx="6.5" cy="6.5" r="3.1" fill={palette.paper} opacity="0.55" />
      <circle cx="19.5" cy="19.5" r="3.1" fill={palette.paper} opacity="0.55" />
      <path d="M13 0 L26 13 L13 26 L0 13 Z" fill="none" stroke={palette.mustard} strokeWidth="1.1" opacity="0.35" />
    </pattern>
    <pattern id={`${p}-tile`} width="120" height="120" patternUnits="userSpaceOnUse">
      <rect width="120" height="120" fill={palette.sage} />
      <path d="M0 0 H120 M0 60 H120 M0 120 H120" stroke={palette.sageDeep} strokeWidth="1.6" opacity="0.5" />
      <path d="M0 0 V120 M60 0 V120 M120 0 V120" stroke={palette.sageDeep} strokeWidth="1.6" opacity="0.5" />
    </pattern>
    <pattern id={`${p}-hatch`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="14" height="14" fill="none" />
      <path d="M0 0 V14" stroke={palette.ink} strokeWidth="4" opacity="0.35" />
    </pattern>
    <filter id={`${p}-blur`} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    <filter id={`${p}-blur-sm`} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>
);

/* ------------------------------------------------------------------ */
/* Composition helpers                                                */
/* ------------------------------------------------------------------ */
/** Camera transform: push-in / pull-out / lateral drift, anchored on a focal point. */
export const cameraTransform = (
  scale: number,
  anchorX: number,
  anchorY: number,
  dx = 0,
  dy = 0,
  rotate = 0,
): string =>
  `translate(${dx} ${dy}) translate(${anchorX} ${anchorY}) scale(${scale}) rotate(${rotate}) translate(${-anchorX} ${-anchorY})`;

/** A labelled data pill — used for statistics so numbers never look decorative. */
export const StatBlock: React.FC<{
  x: number;
  y: number;
  value: string;
  label: string[];
  valueSize?: number;
  color?: string;
  labelColor?: string;
  anchor?: 'start' | 'middle' | 'end';
}> = ({ x, y, value, label, valueSize = 120, color = palette.paper, labelColor = palette.sage, anchor = 'start' }) => (
  <g>
    <T x={x} y={y} size={valueSize} family={t.display} fill={color} anchor={anchor} tracking={-3}>
      {value}
    </T>
    <T x={x} y={y + 46} size={24} weight={t.weight.semibold} tracking={3.2} fill={labelColor} anchor={anchor}>
      {label}
    </T>
  </g>
);

/** Thin rule used to structure information blocks. */
export const Rule: React.FC<{ x: number; y: number; w: number; color?: string; opacity?: number; h?: number }> = ({
  x,
  y,
  w,
  color = palette.mustard,
  opacity = 0.9,
  h = 3,
}) => <Rect x={x} y={y} w={w} h={h} fill={color} opacity={opacity} />;

/**
 * Scrim: a soft local darkening behind type so text never fights the illustration.
 * Used instead of putting text on top of busy detail.
 */
export const Scrim: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  direction?: 'down' | 'up' | 'flat';
  opacity?: number;
  color?: string;
  radius?: number;
}> = ({ x, y, w, h, direction = 'down', opacity = 0.72, color = palette.ink, radius = 0 }) => {
  const id = `scrim-${direction}-${Math.round(x)}-${Math.round(y)}-${Math.round(h)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1={direction === 'down' ? '1' : '0'} x2="0" y2={direction === 'down' ? '0' : '1'}>
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={direction === 'flat' ? opacity : 0} />
        </linearGradient>
        <linearGradient id={`${id}-flat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={opacity} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={radius} fill={direction === 'flat' ? `url(#${id}-flat)` : `url(#${id})`} />
    </g>
  );
};

/** Drawn arrow — the fonts in this project have no arrow glyph, so arrows are shapes. */
export const ArrowRight: React.FC<{ x: number; y: number; w?: number; color?: string; opacity?: number; thickness?: number }> = ({
  x,
  y,
  w = 34,
  color = palette.mustard,
  opacity = 0.9,
  thickness = 3,
}) => (
  <g opacity={opacity}>
    <Rect x={x} y={y} w={w} h={thickness} fill={color} />
    <Path d={`M ${x + w - 9} ${y - 6.5} L ${x + w + 2} ${y + thickness / 2} L ${x + w - 9} ${y + thickness + 6.5} Z`} fill={color} />
  </g>
);

export const lerp = (a: number, b: number, p: number) => a + (b - a) * clamp(p);
