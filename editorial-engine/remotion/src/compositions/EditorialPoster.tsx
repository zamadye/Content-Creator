/**
 * EDITORIAL POSTER — deliverable A (1080 x 1350, 4:5)
 * ---------------------------------------------------
 * One idea, one focal point: a child looking up at a stack of delivered plates that is
 * taller than the child. The statistic is not the subject; the child is.
 *
 * Rules applied here (see docs/VISUAL-QA.md):
 *  - type never covers the face or the focal point
 *  - type is minimal: 4 short blocks, readable at 380 px wide
 *  - the plate stack is the "object interaction" — measured, not decorative
 *  - compliance: labelled ILUSTRASI, no real faces, no institutional logos
 */
import React from 'react';
import { palette, layout, type as t } from '../../../design/tokens';
import { Scrim } from '../illustration/primitives';
import { PlateStack } from '../illustration/props';
import { Character } from '../illustration/figures';
import { GlobalDefs } from '../components/GlobalDefs';
import { Headline, Kicker, IllustrationTag, SourceTag, BrandMark } from '../typography';
import { T, Rect, Ellipse, Path } from '../illustration/primitives';

/** Soft radial pool of light — used to weight the focal object without adding objects. */
const RadialGlow: React.FC<{ cx: number; cy: number; r: number; color: string; opacity: number }> = ({ cx, cy, r, color, opacity }) => {
  const id = `glow-${cx}-${cy}`;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.9} fill={`url(#${id})`} />
    </g>
  );
};

const { width: W, height: H } = layout.poster;

/** Floor line: everything stands on this. Kept high enough to leave room for the source. */
const GROUND = 1112;

export const EditorialPoster: React.FC = () => (
  <g>
    <GlobalDefs />
    <Rect x={0} y={0} w={W} h={H} fill={palette.ink} />
    <ColdRoom ground={GROUND} />

    {/* ---------- background depth: a queue of plates receding into the room ---------- */}
    <g opacity={0.5}>
      <PlateStack x={905} y={GROUND - 6} count={9} s={0.62} jitter={0.5} dim={0.55} />
      <PlateStack x={150} y={GROUND - 10} count={6} s={0.54} jitter={0.4} dim={0.42} />
    </g>

    {/* ---------- focal object: the delivered plates, taller than the child ---------- */}
    <Ellipse cx={706} cy={GROUND + 4} rx={132} ry={20} fill={palette.ink} opacity={0.45} />
    <PlateStack x={706} y={GROUND} count={21} s={1} jitter={1} />

    {/* ---------- the child, small against the stack, turned up towards it ---------- */}
    <Ellipse cx={352} cy={GROUND + 2} rx={96} ry={16} fill={palette.ink} opacity={0.4} />
    <Character
      kind="anak"
      x={318}
      y={GROUND}
      height={596}
      pose={{
        torso: -2,
        head: -12,
        headTurn: 0.42,
        armA: [7, 6],
        armB: [-6, -5],
        legA: [4, -3],
        legB: [-5, -2],
      }}
      expression="worried"
      gaze={0.5}
    />

    {/* ---------- typography: top band, own scrim, never over the faces ---------- */}
    <Scrim x={0} y={0} w={W} h={700} direction="up" opacity={0.86} color={palette.ink} />
    <Kicker x={72} y={126} text="PROGRAM MAKAN BERGIZI GRATIS · 2025–2026" />
    <Headline
      x={72}
      y={268}
      lines={['Yang kita hitung', 'piring.']}
      size={104}
      lineHeight={104}
      accentLine={1}
      accentFill={palette.mustard}
    />
    <T x={72} y={452} size={38} family={t.display} fill={palette.paper} opacity={0.9}>
      Bukan anak yang pulang.
    </T>


    {/* ---------- footer: source, compliance, brand ---------- */}
    <Scrim x={0} y={H - 260} w={W} h={260} direction="down" opacity={0.86} color={palette.ink} />
    <g>
      <Rect x={72} y={H - 226} w={5} h={66} fill={palette.brick} />
      <T x={96} y={H - 196} size={32} weight={700} fill={palette.paper} opacity={0.96}>
        34.201 siswa
      </T>
      <T x={96} y={H - 164} size={26} weight={400} fill={palette.sage} opacity={0.92}>
        diduga keracunan, Jan 2025 – Mei 2026
      </T>
    </g>
    <SourceTag x={72} y={H - 116} text="Sumber: JPPI (data s.d. Mei 2026) · The Conversation, Sep 2026" />
    <SourceTag x={72} y={H - 90} text="Angka dipakai sesuai periode terbitnya, bukan dipindah konteks." opacity={0.42} />
    <BrandMark x={72} y={H - 46} />
    <IllustrationTag x={W - 152} y={H - 44} />
  </g>
);

/**
 * The poster's room: deliberately barer than the film's environments — a wall, a floor,
 * one cold light source from the left. The plate stack has to read as the only object.
 */
const ColdRoom: React.FC<{ ground: number }> = ({ ground }) => (
  <g>
    <Rect x={0} y={0} w={W} h={ground} fill="#3E4A44" />
    <Rect x={0} y={0} w={W} h={ground} fill="url(#tile-fill)" opacity={0.5} />
    <Rect x={0} y={0} w={W} h={ground} fill={palette.ink} opacity={0.22} />
    {/* light shaft from upper left */}
    <Path d={`M -60 0 L 470 0 L 250 ${ground} L -160 ${ground} Z`} fill={palette.coolLight} opacity={0.1} />
    {/* floor */}
    <Rect x={0} y={ground} w={W} h={H - ground} fill={palette.oliveDeep} />
    <Rect x={0} y={ground} w={W} h={H - ground} fill={palette.ink} opacity={0.35} />
    <Rect x={0} y={ground} w={W} h={4} fill={palette.ink} opacity={0.55} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Rect key={i} x={0} y={ground + 24 + i * 46} w={W} h={2} fill={palette.ink} opacity={0.22} />
    ))}
    {/* warm light pooling behind the stack: the focal point gets the only warm value */}
    <RadialGlow cx={706} cy={700} r={520} color={palette.mustard} opacity={0.1} />
    {/* vignette so the type bands read on a phone */}
    <Rect x={0} y={0} w={W} h={H} fill="url(#vignette)" opacity={0.6} />
  </g>
);
