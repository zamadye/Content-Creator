/**
 * TYPOGRAPHY SYSTEM
 * -----------------
 * Two families only:
 *   Instrument Serif  -> editorial voice (headlines, numbers, pull-quotes)
 *   Archivo           -> information voice (labels, captions, sources)
 *
 * Typography is part of the composition: it is placed after the visual hierarchy of
 * the scene is decided, never as an afterthought that covers a face.
 * Maximum two lines of headline; captions are short by construction (the subtitle
 * builder enforces a phrase-level split, not a character-count split).
 */
import React from 'react';
import { palette, type as t, layout } from '../../../design/tokens';
import { T } from '../illustration/primitives';
import { fade, revealY } from '../animations';

export const Headline: React.FC<{
  x: number;
  y: number;
  lines: string[];
  size?: number;
  fill?: string;
  accentLine?: number;
  accentFill?: string;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  family?: string;
  tracking?: number;
  lineHeight?: number;
}> = ({
  x,
  y,
  lines,
  size = t.size.h1,
  fill = palette.paper,
  accentLine,
  accentFill = palette.mustard,
  opacity = 1,
  anchor = 'start',
  tracking = -2.4,
  lineHeight,
}) => (
  <g opacity={opacity}>
    {lines.map((line, i) => (
      <T
        key={i}
        x={x}
        y={y + i * (lineHeight ?? size * 0.98)}
        size={size}
        family={t.display}
        fill={accentLine === i ? accentFill : fill}
        anchor={anchor}
        tracking={tracking}
      >
        {line}
      </T>
    ))}
  </g>
);

export const Kicker: React.FC<{ x: number; y: number; text: string; color?: string; opacity?: number; rule?: boolean; anchor?: 'start' | 'middle' | 'end' }> = ({
  x,
  y,
  text,
  color = palette.mustard,
  opacity = 1,
  rule = true,
  anchor = 'start',
}) => (
  <g opacity={opacity}>
    {rule && <rect x={x - (anchor === 'middle' ? 60 : 0)} y={y - 24} width={44} height={3} fill={color} />}
    <T x={x + (anchor === 'middle' ? 0 : 58)} y={y} size={t.size.label} weight={700} tracking={4.6} fill={color} anchor={anchor}>
      {text}
    </T>
  </g>
);

/** Big number + its unit. The number is always anchored to something concrete. */
export const BigNumber: React.FC<{
  x: number;
  y: number;
  value: string;
  unit: string;
  label?: string[];
  size?: number;
  color?: string;
  unitColor?: string;
  labelColor?: string;
  anchor?: 'start' | 'middle' | 'end';
}> = ({ x, y, value, unit, label, size = t.size.stat, color = palette.paper, unitColor = palette.mustard, labelColor = palette.sage, anchor = 'start' }) => (
  <g>
    <T x={x} y={y} size={size} family={t.display} fill={color} anchor={anchor} tracking={-6}>
      {value}
    </T>
    <T x={x} y={y + size * 0.16 + 34} size={38} weight={600} tracking={2} fill={unitColor} anchor={anchor}>
      {unit}
    </T>
    {label && (
      <T x={x} y={y + size * 0.16 + 84} size={26} weight={500} tracking={1.2} fill={labelColor} anchor={anchor} lineHeight={36}>
        {label}
      </T>
    )}
  </g>
);

/** Subtitle burn-in. Phrase-split upstream, two lines max, inside the bottom safe area. */
export const Caption: React.FC<{ text: string[]; opacity?: number; y?: number }> = ({ text, opacity = 1, y }) => {
  const baseY = y ?? layout.rhythm.captionY;
  const boxH = 34 + text.length * 56;
  return (
    <g opacity={opacity}>
      <rect x={layout.safe.side - 26} y={baseY - 44} width={layout.video.width - (layout.safe.side - 26) * 2} height={boxH} rx={10} fill={palette.ink} opacity={0.42} />
      <T x={layout.video.width / 2} y={baseY} size={46} weight={600} fill={palette.paper} anchor="middle" lineHeight={58}>
        {text}
      </T>
    </g>
  );
};

/** Source / method tag. Small, quiet, always present when a number is on screen. */
export const SourceTag: React.FC<{ x: number; y: number; text: string; opacity?: number; anchor?: 'start' | 'middle' | 'end' }> = ({ x, y, text, opacity = 0.62, anchor = 'start' }) => (
  <T x={x} y={y} size={t.size.micro} weight={500} tracking={0.6} fill={palette.sage} opacity={opacity} anchor={anchor}>
    {text}
  </T>
);

/**
 * Compliance label: any scene that depicts an event participants recognise as real must
 * state that it is an illustration, not documentation (editorial integrity rule 6.7).
 */
export const IllustrationTag: React.FC<{ x: number; y: number; opacity?: number; small?: boolean }> = ({ x, y, opacity = 0.55, small = false }) => (
  <g opacity={opacity}>
    <rect x={x - 8} y={y - (small ? 17 : 20)} width={small ? 108 : 126} height={small ? 24 : 28} rx={4} fill={palette.paper} opacity={0.14} />
    <T x={x + 4} y={y} size={small ? 15 : 17} weight={700} tracking={2.6} fill={palette.paper}>
      ILUSTRASI
    </T>
  </g>
);

export const BrandMark: React.FC<{ x: number; y: number; opacity?: number }> = ({ x, y, opacity = 0.45 }) => (
  <g opacity={opacity}>
    <rect x={x} y={y - 15} width={4} height={20} fill={palette.mustard} />
    <T x={x + 14} y={y} size={19} weight={700} tracking={4.2} fill={palette.paper}>
      SUARA PUBLIK
    </T>
  </g>
);

/** Quote block: an editorial position, attributed to nobody but stated as opinion. */
export const PullQuote: React.FC<{ x: number; y: number; lines: string[]; size?: number; frame: number; start: number; fill?: string; accent?: string }> = ({
  x,
  y,
  lines,
  size = 66,
  frame,
  start,
  fill = palette.paper,
  accent = palette.mustard,
}) => (
  <g>
    {lines.map((line, i) => {
      const { dy, opacity } = revealY(frame, start + i * 8, 24, 20);
      return (
        <g key={i} transform={`translate(0 ${dy})`} opacity={opacity}>
          <T x={x} y={y + i * size * 1.16} size={size} family={t.display} fill={fill} tracking={-1.6}>
            {line}
          </T>
        </g>
      );
    })}
    <rect x={x} y={y + lines.length * size * 1.16 + 6} width={70} height={3} fill={accent} opacity={0.9} />
  </g>
);
