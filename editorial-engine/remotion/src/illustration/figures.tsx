/**
 * CHARACTER RIG — layered flat-vector figures
 * -------------------------------------------
 * Characters are NOT single images. Each figure is a layered rig
 * (head / neck / torso / upper+lower arms / hands / upper+lower legs / accessories)
 * so the animation layer can move parts independently while identity stays locked.
 *
 * Identity contract (docs/CHARACTER_GUIDE.md):
 *   - face shape, body ratio, clothing, colour, accessories never change between scenes
 *   - only pose, expression, camera and light change
 *
 * Coordinate system: origin = hip centre. y grows downward.
 * The component's `y` prop is the GROUND line (the feet), not the hip — scenes can place
 * figures on a floor line without doing rig math.
 */
import React from 'react';
import { palette, skin as skinTokens } from '../../../design/tokens';
import { Circle, Ellipse, Path, Rect, polar } from './primitives';
import { clamp } from '../runtime';

export type Kind = 'ibu' | 'anak' | 'guru' | 'petugas';

export type Pose = {
  torso?: number; // lean, degrees
  head?: number; // tilt, degrees
  headTurn?: number; // -1..1 (0 = front, 1 = looking to their left)
  armA?: [number, number]; // viewer-right arm: shoulder, elbow (relative)
  armB?: [number, number]; // viewer-left arm
  legA?: [number, number];
  legB?: [number, number];
  crouch?: number; // 0..1 knees bend
  /** Lower the hip by N local units (seated figures). */
  hipDrop?: number;
};

export type Expression = 'neutral' | 'tired' | 'sick' | 'worried' | 'kind' | 'firm' | 'sad' | 'open';

type Palette = {
  skin: string;
  skinShade: string;
  hair: string;
  top: string;
  topShade: string;
  bottom: string;
  bottomShade: string;
  accent: string;
  sleeve: 'long' | 'short';
  /** lower-leg fill when the garment stops above the knee */
  shin?: string;
  /** long skirt covering the thighs */
  skirt?: string;
  skirtShade?: string;
  /** short trousers drawn as a garment over both thighs */
  shorts?: boolean;
  scarf?: string;
  scarfShade?: string;
  hairStyle: 'short' | 'bun' | 'ponytail' | 'crop';
  glasses?: boolean;
  apron?: string;
  hairnet?: boolean;
  gloves?: string;
  batik?: boolean;
  collar?: string;
  shoes: string;
};

const PALETTES: Record<Kind, Palette> = {
  anak: {
    skin: skinTokens.light,
    skinShade: skinTokens.lightDeep,
    hair: '#241C18',
    top: '#F4EDE0',
    topShade: '#D3C4AA',
    bottom: '#B23A2C',
    bottomShade: '#87281D',
    accent: '#D9A544',
    sleeve: 'short',
    shin: skinTokens.light,
    shorts: true,
    hairStyle: 'crop',
    collar: '#B23A2C',
    shoes: '#1E1B19',
  },
  ibu: {
    skin: skinTokens.medium,
    skinShade: skinTokens.mediumDeep,
    hair: '#2A211C',
    top: '#7C8B63',
    topShade: '#5E6B49',
    bottom: '#8E6B4F',
    bottomShade: '#6F513B',
    accent: '#C4703F',
    sleeve: 'long',
    shin: skinTokens.medium,
    skirt: '#8E6B4F',
    skirtShade: '#6F513B',
    scarf: '#B96A45',
    scarfShade: '#8B4A2F',
    hairStyle: 'bun',
    collar: '#EFE3CB',
    shoes: '#4A3B30',
  },
  guru: {
    skin: skinTokens.light,
    skinShade: skinTokens.lightDeep,
    hair: '#2A211C',
    top: '#8B4A2F',
    topShade: '#6C3822',
    bottom: '#2F3A34',
    bottomShade: '#1F2723',
    accent: '#D9A544',
    sleeve: 'long',
    hairStyle: 'short',
    glasses: true,
    batik: true,
    collar: '#E7D8BE',
    shoes: '#171B18',
  },
  petugas: {
    skin: skinTokens.deep,
    skinShade: skinTokens.deepShade,
    hair: '#1E1815',
    top: '#E7D8BE',
    topShade: '#C4B49A',
    bottom: '#3B4640',
    bottomShade: '#2A332E',
    accent: '#D9A544',
    sleeve: 'short',
    hairStyle: 'crop',
    apron: '#D9A544',
    hairnet: true,
    gloves: '#EFE6D4',
    shoes: '#22201D',
  },
};

export const GEO = {
  adult: {
    shoulderY: -112,
    shoulderHalf: 52,
    waistHalf: 31,
    hipY: 0,
    neckTop: -124,
    headCy: -158,
    headRx: 26,
    headRy: 31,
    upperArm: 56,
    lowerArm: 52,
    upperLeg: 82,
    lowerLeg: 80,
    armWidth: 17,
    forearmWidth: 14,
    legWidth: 25,
    shinWidth: 19,
  },
  child: {
    shoulderY: -88,
    shoulderHalf: 38,
    waistHalf: 25,
    hipY: 0,
    neckTop: -98,
    headCy: -130,
    headRx: 33,
    headRy: 36,
    upperArm: 42,
    lowerArm: 38,
    upperLeg: 56,
    lowerLeg: 54,
    armWidth: 14,
    forearmWidth: 11,
    legWidth: 20,
    shinWidth: 16,
  },
};

const isChild = (kind: Kind) => kind === 'anak';

/** Distance (local units) from the hip to the floor — the rig's ground contract. */
export const hipHeight = (kind: Kind): number => {
  const g = isChild(kind) ? GEO.child : GEO.adult;
  return g.upperLeg + g.lowerLeg + 10;
};

/** Total drawn height (local units) from the top of the hair to the soles. */
export const nativeExtent = (kind: Kind): number => {
  const g = isChild(kind) ? GEO.child : GEO.adult;
  const top = g.headCy - g.headRy * 1.5;
  return Math.abs(top) + hipHeight(kind);
};

export type CharacterProps = {
  kind: Kind;
  x: number;
  y: number; // GROUND line (feet)
  height: number; // px height of the whole figure
  flip?: boolean;
  pose?: Pose;
  expression?: Expression;
  mouthOpen?: number;
  blink?: number;
  gaze?: number;
  opacity?: number;
  /** drawn in front of the figure, positioned at a hand */
  handProp?: { hand: 'A' | 'B'; render: (p: { x: number; y: number; angle: number }) => React.ReactNode };
};

/* ------------------------------------------------------------------ */
/* Limb chain                                                          */
/* ------------------------------------------------------------------ */
const Limb: React.FC<{
  x: number;
  y: number;
  /** joint angles in degrees, each relative to its parent. 0 = pointing down. */
  angles: number[];
  lengths: number[];
  widths: number[];
  /** per-segment fill */
  colors: string[];
  endRadius?: number;
  endColor?: string;
}> = ({ x, y, angles, lengths, widths, colors, endColor }) => {
  // A capsule is a stroked line with round caps: the segment endpoints are exactly the
  // joint positions, so child segments always start exactly where the parent ends.
  const points: { x: number; y: number }[] = [{ x, y }];
  let px = x;
  let py = y;
  let acc = 0;
  lengths.forEach((len, i) => {
    acc += angles[i] ?? 0;
    const next = polar(px, py, acc, len);
    px = next.x;
    py = next.y;
    points.push({ x: px, y: py });
  });
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {lengths.map((_, i) => (
        <path
          key={i}
          d={`M ${points[i].x} ${points[i].y} L ${points[i + 1].x} ${points[i + 1].y}`}
          stroke={colors[i]}
          strokeWidth={widths[i]}
        />
      ))}
      {/* hand / foot cap */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={widths[widths.length - 1] / 2} fill={endColor ?? colors[colors.length - 1]} stroke="none" />
    </g>
  );
};

/** World position of a hand, given the figure placement (used to attach props). */
export const limbEndPoint = (
  kind: Kind,
  spec: { x: number; y: number; height: number; flip?: boolean; hipDrop?: number },
  side: 'A' | 'B',
  angles: [number, number],
): { x: number; y: number; angle: number } => {
  const g = isChild(kind) ? GEO.child : GEO.adult;
  const s = spec.height / nativeExtent(kind);
  const flip = spec.flip ? -1 : 1;
  const shoulderX = (side === 'A' ? 1 : -1) * (g.shoulderHalf - 1);
  const sy = g.shoulderY + 10;
  const a1 = angles[0];
  const a2 = angles[1];
  const p1 = polar(shoulderX, sy, a1, g.upperArm);
  const p2 = polar(p1.x, p1.y, a1 + a2, g.lowerArm);
  const groupY = spec.y - (hipHeight(kind) - (spec.hipDrop ?? 0)) * s;
  return { x: spec.x + flip * p2.x * s, y: groupY + p2.y * s, angle: a1 + a2 };
};

/* ------------------------------------------------------------------ */
/* Face                                                               */
/* ------------------------------------------------------------------ */
const FACE: Record<Expression, { eyeOpen: number; browY: number; browTilt: number; mouth: number; mouthOpen: number }> = {
  neutral: { eyeOpen: 1, browY: 0, browTilt: 0, mouth: 0.12, mouthOpen: 0 },
  tired: { eyeOpen: 0.45, browY: 2, browTilt: -3, mouth: -0.1, mouthOpen: 0 },
  sick: { eyeOpen: 0.2, browY: 3.2, browTilt: -5, mouth: -0.3, mouthOpen: 0.32 },
  worried: { eyeOpen: 0.92, browY: 1.2, browTilt: -6, mouth: -0.2, mouthOpen: 0 },
  kind: { eyeOpen: 0.88, browY: 0.4, browTilt: 2, mouth: 0.45, mouthOpen: 0 },
  firm: { eyeOpen: 1, browY: -1, browTilt: 4, mouth: -0.05, mouthOpen: 0 },
  sad: { eyeOpen: 0.6, browY: 2.4, browTilt: -8, mouth: -0.4, mouthOpen: 0 },
  open: { eyeOpen: 1, browY: -1.4, browTilt: 2, mouth: 0.1, mouthOpen: 0.42 },
};

const Head: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  pal: Palette;
  expression: Expression;
  blink: number;
  gaze: number;
  mouthOpenOverride?: number;
  turn: number;
}> = ({ cx, cy, rx, ry, pal, expression, blink, gaze, mouthOpenOverride, turn }) => {
  const f = FACE[expression];
  const eyeY = cy + ry * 0.02;
  const eyeDX = rx * 0.4;
  const gazeShift = clamp(gaze, -1, 1) * 2.2;
  const turnShift = clamp(turn, -1, 1) * rx * 0.16;
  const eyeOpenFactor = clamp(1 - blink) * f.eyeOpen;
  const mouthOpen = mouthOpenOverride ?? f.mouthOpen;
  const mouthY = cy + ry * 0.58;
  const jawW = rx * 0.82;

  return (
    <g>
      {/* drape behind the head — keeps the silhouette readable from a distance */}
      <Path
        d={`M ${cx - rx * 1.06} ${cy + ry * 1.15}
            C ${cx - rx * 1.28} ${cy - ry * 0.3} ${cx - rx * 1.06} ${cy - ry * 1.3} ${cx} ${cy - ry * 1.3}
            C ${cx + rx * 1.06} ${cy - ry * 1.3} ${cx + rx * 1.28} ${cy - ry * 0.3} ${cx + rx * 1.06} ${cy + ry * 1.15}
            C ${cx + rx * 0.6} ${cy + ry * 1.34} ${cx - rx * 0.6} ${cy + ry * 1.34} ${cx - rx * 1.06} ${cy + ry * 1.15} Z`}
        fill={pal.scarfShade ?? palette.clayDeep}
      />
      {/* ears */}
      {!pal.scarf && (
        <>
          <Ellipse cx={cx - rx * 0.98} cy={eyeY + 6} rx={4.6} ry={7.4} fill={pal.skinShade} />
          <Ellipse cx={cx + rx * 0.98} cy={eyeY + 6} rx={4.6} ry={7.4} fill={pal.skinShade} />
        </>
      )}

      {/* cranium + jaw */}
      <Ellipse cx={cx} cy={cy - ry * 0.12} rx={rx} ry={ry * 0.92} fill={pal.skin} />
      <Path
        d={`M ${cx - jawW} ${cy - ry * 0.05}
            C ${cx - jawW * 0.98} ${cy + ry * 0.62} ${cx - jawW * 0.42} ${cy + ry * 0.92} ${cx} ${cy + ry * 0.92}
            C ${cx + jawW * 0.42} ${cy + ry * 0.92} ${cx + jawW * 0.98} ${cy + ry * 0.62} ${cx + jawW} ${cy - ry * 0.05} Z`}
        fill={pal.skin}
      />
      {/* cheek warmth */}
      <Ellipse cx={cx - rx * 0.55} cy={eyeY + ry * 0.34} rx={rx * 0.22} ry={ry * 0.13} fill={pal.skinShade} opacity={0.35} />
      <Ellipse cx={cx + rx * 0.55} cy={eyeY + ry * 0.34} rx={rx * 0.22} ry={ry * 0.13} fill={pal.skinShade} opacity={0.35} />

      {/* eyes */}
      {[-1, 1].map((s) => {
        const ex = cx + s * eyeDX + turnShift;
        return (
          <g key={s}>
            <Ellipse cx={ex} cy={eyeY} rx={rx * 0.14} ry={Math.max(0.5, ry * 0.105 * eyeOpenFactor)} fill={palette.ink} />
            {eyeOpenFactor > 0.42 && <Circle cx={ex + gazeShift * 0.25} cy={eyeY - ry * 0.035} r={rx * 0.045} fill={palette.paper} opacity={0.8} />}
            {eyeOpenFactor < 0.5 && <Path d={`M ${ex - rx * 0.16} ${eyeY - ry * 0.07} q ${rx * 0.16} ${-ry * 0.05} ${rx * 0.32} 0`} stroke={pal.hair} strokeWidth={rx * 0.07} />}
            {/* lower lid line for a tired read */}
            {(expression === 'sick' || expression === 'tired' || expression === 'sad') && (
              <Path d={`M ${ex - rx * 0.13} ${eyeY + ry * 0.09} q ${rx * 0.13} ${ry * 0.06} ${rx * 0.26} 0`} stroke={pal.skinShade} strokeWidth={rx * 0.05} fill="none" />
            )}
          </g>
        );
      })}

      {/* brows */}
      {[-1, 1].map((s) => {
        const bx = cx + s * eyeDX + turnShift;
        const by = eyeY - ry * 0.28 - f.browY;
        return (
          <Path
            key={s}
            d={`M ${bx - rx * 0.2} ${by} q ${rx * 0.2} ${f.browTilt * 0.06 * s} ${rx * 0.4} ${f.browTilt * 0.12 * s}`}
            stroke={pal.hair}
            strokeWidth={rx * 0.09}
            fill="none"
          />
        );
      })}

      {/* nose */}
      <Path d={`M ${cx + turnShift * 0.8} ${eyeY + ry * 0.16} q ${rx * 0.07} ${ry * 0.14} ${-rx * 0.03} ${ry * 0.16}`} stroke={pal.skinShade} strokeWidth={rx * 0.075} />

      {/* mouth */}
      <g transform={`translate(${cx + turnShift * 0.7} ${mouthY})`}>
        {mouthOpen > 0.02 ? (
          <Ellipse cx={0} cy={0} rx={rx * 0.2} ry={rx * 0.07 + mouthOpen * rx * 0.19} fill={palette.clayDeep} />
        ) : (
          <Path d={`M ${-rx * 0.22} 0 q ${rx * 0.22} ${f.mouth * rx * 0.22} ${rx * 0.44} 0`} stroke={palette.clayDeep} strokeWidth={rx * 0.085} opacity={0.9} />
        )}
      </g>

      {/* headwear */}
      {pal.scarf ? (
        <g>
          {/* face frame: covers hair + forehead + chin sides, leaves the face open */}
          <Path
            d={`M ${cx - rx * 1.08} ${cy + ry * 0.95}
                C ${cx - rx * 1.2} ${cy - ry * 0.5} ${cx - rx * 0.95} ${cy - ry * 1.3} ${cx} ${cy - ry * 1.3}
                C ${cx + rx * 0.95} ${cy - ry * 1.3} ${cx + rx * 1.2} ${cy - ry * 0.5} ${cx + rx * 1.08} ${cy + ry * 0.95}
                C ${cx + rx * 1.02} ${cy + ry * 0.6} ${cx + rx * 0.94} ${cy - ry * 0.28} ${cx + rx * 0.86} ${cy - ry * 0.34}
                C ${cx + rx * 0.5} ${cy - ry * 0.6} ${cx - rx * 0.5} ${cy - ry * 0.6} ${cx - rx * 0.86} ${cy - ry * 0.34}
                C ${cx - rx * 0.94} ${cy - ry * 0.28} ${cx - rx * 1.02} ${cy + ry * 0.6} ${cx - rx * 1.08} ${cy + ry * 0.95} Z`}
            fill={pal.scarf}
          />
          <Path
            d={`M ${cx - rx * 0.8} ${cy - ry * 0.5} C ${cx - rx * 0.4} ${cy - ry * 0.86} ${cx + rx * 0.5} ${cy - ry * 0.82} ${cx + rx * 0.9} ${cy - ry * 0.36}`}
            stroke={pal.scarfShade ?? palette.ink}
            strokeWidth={rx * 0.1}
            opacity={0.55}
            fill="none"
          />
        </g>
      ) : (
        <g>
          {pal.hairStyle === 'bun' && <Circle cx={cx + rx * 1.0} cy={cy - ry * 0.95} r={rx * 0.34} fill={pal.hair} />}
          {pal.hairStyle === 'ponytail' && (
            <Path d={`M ${cx + rx * 0.9} ${cy - ry * 0.5} q ${rx * 0.5} ${ry * 0.5} ${rx * 0.18} ${ry * 1.3} q ${-rx * 0.45} ${-ry * 0.2} ${-rx * 0.5} ${-ry * 0.85} Z`} fill={pal.hair} />
          )}
          <Path
            d={`M ${cx - rx * 1.03} ${cy - ry * 0.02}
                C ${cx - rx * 1.12} ${cy - ry * 1.62} ${cx + rx * 1.12} ${cy - ry * 1.62} ${cx + rx * 1.03} ${cy - ry * 0.02}
                C ${cx + rx * 0.96} ${cy - ry * 0.46} ${cx + rx * 0.62} ${cy - ry * 0.66} ${cx + rx * 0.1} ${cy - ry * 0.68}
                C ${cx - rx * 0.48} ${cy - ry * 0.7} ${cx - rx * 0.9} ${cy - ry * 0.5} ${cx - rx * 1.03} ${cy - ry * 0.02} Z`}
            fill={pal.hair}
          />
        </g>
      )}

      {pal.hairnet && (
        <Path
          d={`M ${cx - rx * 1.01} ${cy - ry * 0.42} C ${cx - rx * 0.98} ${cy - ry * 1.16} ${cx + rx * 0.98} ${cy - ry * 1.16} ${cx + rx * 1.01} ${cy - ry * 0.42}`}
          stroke={palette.paper}
          strokeWidth={2.2}
          opacity={0.55}
          fill="none"
        />
      )}
      {pal.glasses && (
        <g opacity={0.95}>
          <Rect x={cx - rx * 0.86} y={eyeY - ry * 0.24} w={rx * 0.66} h={ry * 0.46} r={7} fill="none" stroke={palette.inkSoft} strokeWidth={3} />
          <Rect x={cx + rx * 0.2} y={eyeY - ry * 0.24} w={rx * 0.66} h={ry * 0.46} r={7} fill="none" stroke={palette.inkSoft} strokeWidth={3} />
          <Path d={`M ${cx - rx * 0.2} ${eyeY - 1} h ${rx * 0.4}`} stroke={palette.inkSoft} strokeWidth={2.6} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Character                                                           */
/* ------------------------------------------------------------------ */
export const Character: React.FC<CharacterProps> = ({
  kind,
  x,
  y,
  height,
  flip = false,
  pose = {},
  expression = 'neutral',
  mouthOpen,
  blink = 0,
  gaze = 0,
  opacity = 1,
  handProp,
}) => {
  const pal = PALETTES[kind];
  const g = isChild(kind) ? GEO.child : GEO.adult;
  const s = height / nativeExtent(kind);
  const hipDrop = pose.hipDrop ?? 0;
  const kneeBend = clamp(pose.crouch ?? 0) * 26;

  const armA = pose.armA ?? [13, 6];
  const armB = pose.armB ?? [-13, -6];
  const legA = pose.legA ?? [4, -3 + kneeBend];
  const legB = pose.legB ?? [-4, -3 + kneeBend];

  const groupY = y - (hipHeight(kind) - hipDrop) * s;
  const outer = `translate(${x} ${groupY}) scale(${flip ? -s : s} ${s})`;

  const headCx = 0;
  const headCy = g.headCy;
  const torsoLean = pose.torso ?? 0;

  /** Short sleeve = sleeved upper arm + bare forearm. Long sleeve = shirt colour all the way. */
  const armColors: [string, string] = pal.sleeve === 'long' ? [pal.top, pal.topShade] : [pal.topShade, pal.skin];

  const footOf = (angles: [number, number], hipX: number) => {
    let acc = 0;
    let px = hipX;
    let py = g.hipY;
    angles.forEach((a, i) => {
      acc += a;
      const e = polar(px, py, acc, i === 0 ? g.upperLeg : g.lowerLeg);
      px = e.x;
      py = e.y;
    });
    return { x: px, y: py, angle: acc };
  };
  const footA = footOf(legA, g.waistHalf * 0.42);
  const footB = footOf(legB, -g.waistHalf * 0.5);

  const shoulderAX = g.shoulderHalf - 1;
  const shoulderBX = -(g.shoulderHalf - 1);
  const shoulderY = g.shoulderY + 10;

  const gloveColor = pal.gloves;

  return (
    <g transform={outer} opacity={opacity}>
      {/* ---------------- legs (behind the garments) ---------------- */}
      <Limb
        x={-g.waistHalf * 0.52}
        y={g.hipY}
        angles={legB}
        lengths={[g.upperLeg, g.lowerLeg]}
        widths={[g.legWidth, g.shinWidth]}
        colors={[pal.shorts ? pal.skinShade : pal.bottomShade, pal.shin ?? pal.bottomShade]}
        endRadius={g.shinWidth / 2}
      />
      <g transform={`translate(${footB.x} ${footB.y + 3}) rotate(${footB.angle})`}>
        <Rect x={-g.shinWidth * 0.5} y={-3} w={g.shinWidth * 0.5} h={12} r={5} fill={pal.shoes} />
        <Rect x={-g.shinWidth * 0.5} y={-2} w={g.shinWidth * 1.05} h={9} r={4.5} fill={pal.shoes} />
      </g>
      <Limb
        x={g.waistHalf * 0.44}
        y={g.hipY}
        angles={legA}
        lengths={[g.upperLeg, g.lowerLeg]}
        widths={[g.legWidth, g.shinWidth]}
        colors={[pal.shorts ? pal.skin : pal.bottom, pal.shin ?? pal.bottom]}
        endRadius={g.shinWidth / 2}
      />
      <g transform={`translate(${footA.x} ${footA.y + 3}) rotate(${footA.angle})`}>
        <Rect x={-g.shinWidth * 0.55} y={-4} w={g.shinWidth * 1.15} h={14} r={6.5} fill={pal.shoes} />
        <Ellipse cx={g.shinWidth * 0.56} cy={9.5} rx={g.shinWidth * 0.78} ry={5.2} fill={pal.shoes} />
      </g>

      <g transform={`rotate(${torsoLean} 0 ${g.shoulderY})`}>
        {/* ---------------- torso ---------------- */}
        <Path
          d={`M ${-g.shoulderHalf + 8} ${g.shoulderY + 2}
              Q ${-g.shoulderHalf - 2} ${g.shoulderY - 4} ${-g.waistHalf - 1} ${g.hipY - 4}
              L ${g.waistHalf + 1} ${g.hipY - 4}
              Q ${g.shoulderHalf + 2} ${g.shoulderY - 4} ${g.shoulderHalf - 8} ${g.shoulderY + 2}
              Q 0 ${g.shoulderY + 14} ${-g.shoulderHalf + 8} ${g.shoulderY + 2} Z`}
          fill={pal.batik ? 'url(#batik-fill)' : pal.top}
        />
        {pal.batik && (
          <Path
            d={`M ${-g.shoulderHalf + 8} ${g.shoulderY + 2}
                Q ${-g.shoulderHalf - 2} ${g.shoulderY - 4} ${-g.waistHalf - 1} ${g.hipY - 4}
                L ${g.waistHalf + 1} ${g.hipY - 4}
                Q ${g.shoulderHalf + 2} ${g.shoulderY - 4} ${g.shoulderHalf - 8} ${g.shoulderY + 2}
                Q 0 ${g.shoulderY + 14} ${-g.shoulderHalf + 8} ${g.shoulderY + 2} Z`}
            fill={pal.top}
            opacity={0.28}
          />
        )}
        {/* collar */}
        <Path d={`M ${-g.waistHalf * 0.34} ${g.shoulderY + 2} L 0 ${g.shoulderY + 15} L ${g.waistHalf * 0.34} ${g.shoulderY + 2}`} stroke={pal.collar ?? palette.paper} strokeWidth={4.5} fill="none" opacity={0.9} />
        {kind === 'anak' && <Rect x={-g.waistHalf * 0.72} y={g.shoulderY + 34} w={16} h={11} r={2} fill={pal.topShade} opacity={0.7} />}
        {pal.apron && (
          <Path d={`M ${-g.waistHalf + 4} ${g.shoulderY + 22} L ${g.waistHalf - 4} ${g.shoulderY + 22} L ${g.waistHalf + 3} ${g.hipY + 24} L ${-g.waistHalf - 3} ${g.hipY + 24} Z`} fill={pal.apron} opacity={0.95} />
        )}

        {/* ---------------- far arm (drawn over the torso, shaded to sit "behind") ---------------- */}
        <Limb
          x={shoulderBX}
          y={shoulderY}
          angles={armB}
          lengths={[g.upperArm, g.lowerArm]}
          widths={[g.armWidth, g.forearmWidth]}
          colors={pal.sleeve === 'long' ? [pal.topShade, pal.topShade] : [pal.topShade, pal.skinShade]}
          endRadius={g.forearmWidth / 2}
          endColor={gloveColor ?? (pal.sleeve === 'long' ? pal.topShade : pal.skinShade)}
        />

        {/* ---------------- lower garment ---------------- */}
        <Path
          d={`M ${-g.waistHalf - 1} ${g.hipY - 28} L ${g.waistHalf + 1} ${g.hipY - 28} L ${g.waistHalf + 4} ${g.hipY + 12} L ${-g.waistHalf - 4} ${g.hipY + 12} Z`}
          fill={pal.bottom}
        />
        {pal.shorts && (
          <Path
            d={`M ${-g.waistHalf - 3} ${g.hipY - 26}
                L ${g.waistHalf + 3} ${g.hipY - 26}
                L ${g.waistHalf + 3} ${g.hipY + g.upperLeg * 0.56}
                Q ${g.waistHalf * 0.4} ${g.hipY + g.upperLeg * 0.44} ${g.waistHalf * 0.16} ${g.hipY + g.upperLeg * 0.52}
                L 0 ${g.hipY + g.upperLeg * 0.3}
                L ${-g.waistHalf * 0.16} ${g.hipY + g.upperLeg * 0.6}
                Q ${-g.waistHalf * 0.4} ${g.hipY + g.upperLeg * 0.44} ${-g.waistHalf - 3} ${g.hipY + g.upperLeg * 0.56} Z`}
            fill={pal.bottom}
          />
        )}
        {pal.skirt && (
          <>
            <Path
              d={`M ${-g.waistHalf - 2} ${g.hipY - 24} L ${g.waistHalf + 2} ${g.hipY - 24}
                  L ${g.waistHalf + 30} ${g.hipY + g.upperLeg * 0.95} Q 0 ${g.hipY + g.upperLeg * 1.06} ${-g.waistHalf - 30} ${g.hipY + g.upperLeg * 0.95} Z`}
              fill={pal.skirt}
            />
            <Path
              d={`M ${-g.waistHalf + 8} ${g.hipY - 8} L ${-g.waistHalf - 6} ${g.hipY + g.upperLeg * 0.9}`}
              stroke={pal.skirtShade ?? palette.ink}
              strokeWidth={5}
              opacity={0.35}
              fill="none"
            />
          </>
        )}

        {/* ---------------- neck + head ---------------- */}
        <Rect x={-7.5} y={g.neckTop - 4} w={15} h={18} r={6.5} fill={pal.skinShade} />
        <g transform={`rotate(${pose.head ?? 0} ${headCx} ${headCy + g.headRy})`}>
          <Head
            cx={headCx}
            cy={headCy}
            rx={g.headRx}
            ry={g.headRy}
            pal={pal}
            expression={expression}
            blink={blink}
            gaze={gaze}
            mouthOpenOverride={mouthOpen}
            turn={pose.headTurn ?? 0}
          />
        </g>

        {/* ---------------- near arm ---------------- */}
        <Limb
          x={shoulderAX}
          y={shoulderY}
          angles={armA}
          lengths={[g.upperArm, g.lowerArm]}
          widths={[g.armWidth, g.forearmWidth]}
          colors={armColors}
          endRadius={g.forearmWidth / 2}
          endColor={gloveColor ?? armColors[1]}
        />
      </g>

      {handProp &&
        (() => {
          const p = limbEndPoint(kind, { x: 0, y: 0, height: nativeExtent(kind), hipDrop }, handProp.hand, handProp.hand === 'A' ? armA : armB);
          return <g transform={`translate(${p.x} ${p.y})`}>{handProp.render({ x: 0, y: 0, angle: p.angle })}</g>;
        })()}
    </g>
  );
};

/** Convenience: draw a figure + its contact shadow on the ground. */
export const StandingFigure: React.FC<CharacterProps & { shadow?: boolean }> = ({ shadow = true, ...props }) => (
  <g>
    {shadow && <Ellipse cx={props.x} cy={props.y + 4} rx={props.height * 0.18} ry={props.height * 0.032} fill={palette.ink} opacity={0.22} />}
    <Character {...props} />
  </g>
);

/** Editorial "no face" institutional silhouette — used instead of caricaturing real officials. */
export const InstitutionalSilhouette: React.FC<{ x: number; y: number; height: number; opacity?: number; flip?: boolean }> = ({
  x,
  y,
  height,
  opacity = 0.95,
  flip,
}) => {
  const s = height / 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={opacity}>
      <Rect x={-46} y={-104} w={92} h={110} r={10} fill={palette.tealDeep} />
      <Rect x={-40} y={-206} w={80} h={108} r={26} fill={palette.tealDeep} />
      <Circle cx={0} cy={-252} r={34} fill={palette.tealDeep} />
      <Rect x={-13} y={-224} w={26} h={22} fill={palette.tealDeep} />
      <Path d="M -12 -140 L 12 -140" stroke={palette.tealLight} strokeWidth={3} opacity={0.35} />
    </g>
  );
};
