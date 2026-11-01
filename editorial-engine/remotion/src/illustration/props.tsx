/**
 * PROPS LIBRARY
 * -------------
 * Every prop is a pure function of props (and, where relevant, of a frame-driven value
 * passed in by the scene). Props stay in the same flat-vector vocabulary as figures.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { Circle, Ellipse, Path, Rect, T } from './primitives';

/* ------------------------------------------------------------------ */
/* Food service                                                        */
/* ------------------------------------------------------------------ */
export const Plate: React.FC<{ x: number; y: number; s?: number; empty?: boolean; tilt?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  empty = false,
  tilt = 0,
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`} opacity={opacity}>
    <Ellipse cx={0} cy={6} rx={74} ry={22} fill={palette.ink} opacity={0.18} />
    <Ellipse cx={0} cy={0} rx={74} ry={24} fill={palette.paper} />
    <Ellipse cx={0} cy={-2} rx={62} ry={19} fill={palette.paperDim} />
    {!empty && (
      <>
        <Ellipse cx={-26} cy={-4} rx={26} ry={11} fill={palette.paper} /> {/* rice */}
        <Ellipse cx={-26} cy={-8} rx={22} ry={9} fill={palette.white} opacity={0.65} />
        <Ellipse cx={20} cy={-6} rx={18} ry={8} fill={palette.olive} /> {/* greens */}
        <Ellipse cx={44} cy={0} rx={13} ry={6} fill={palette.clay} /> {/* protein */}
        <Circle cx={8} cy={4} r={7} fill={palette.mustard} /> {/* egg */}
      </>
    )}
    <Ellipse cx={0} cy={-4} rx={74} ry={24} fill="none" stroke={palette.white} strokeWidth={1.6} opacity={0.5} />
  </g>
);

export const Tray: React.FC<{ x: number; y: number; s?: number; plates?: number }> = ({ x, y, s = 1, plates = 3 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-120} y={-10} w={240} h={20} r={8} fill={palette.tealLight} />
    <Rect x={-120} y={-14} w={240} h={8} r={4} fill={palette.sage} opacity={0.6} />
    {Array.from({ length: plates }).map((_, i) => (
      <Plate key={i} x={-70 + i * 70} y={-22} s={0.52} />
    ))}
  </g>
);

export const Bowl: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Path d="M -34 0 A 34 22 0 0 0 34 0 Z" fill={palette.paper} />
    <Ellipse cx={0} cy={0} rx={34} ry={7} fill={palette.paperDim} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Institutional documents & evidence                                  */
/* ------------------------------------------------------------------ */
export const Certificate: React.FC<{
  x: number;
  y: number;
  s?: number;
  rotate?: number;
  stamped?: number; // 0..1 stamp progress
  title?: string;
  lines?: string[];
}> = ({ x, y, s = 1, rotate = 0, stamped = 0, title = 'SERTIFIKAT', lines = ['LAIK HIGIENE SANITASI', 'SPPG — DAPUR SATUAN PELAYANAN'] }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <Rect x={-86} y={-108} w={172} h={216} r={4} fill={palette.paper} />
    <Rect x={-86} y={-108} w={172} h={216} r={4} fill="none" stroke={palette.paperShadow} strokeWidth={2} />
    <Rect x={-76} y={-98} w={152} h={196} r={2} fill="none" stroke={palette.mustard} strokeWidth={2} opacity={0.75} />
    <T x={0} y={-56} size={17} weight={700} tracking={2.6} fill={palette.teal} anchor="middle">
      {title}
    </T>
    {lines.map((l, i) => (
      <T key={i} x={0} y={-18 + i * 22} size={12} weight={500} tracking={0.6} fill={palette.inkSoft} anchor="middle">
        {l}
      </T>
    ))}
    <Rect x={-56} y={54} w={64} h={2} fill={palette.inkSoft} opacity={0.5} />
    <Rect x={-56} y={64} w={40} h={2} fill={palette.inkSoft} opacity={0.3} />
    {[-70, -40, -10].map((yy, i) => (
      <Rect key={i} x={-60} y={yy + 46} w={i === 2 ? 44 : 76} h={3} fill={palette.inkSoft} opacity={0.25} />
    ))}
    {stamped > 0 && (
      <g opacity={Math.min(1, stamped * 1.6)} transform={`translate(6 74) rotate(-9) scale(${0.6 + stamped * 0.4})`}>
        <Circle cx={0} cy={0} r={40} fill="none" stroke={palette.brick} strokeWidth={5} opacity={0.85} />
        <T x={0} y={-2} size={13} weight={700} tracking={1.4} fill={palette.brick} anchor="middle">
          TERVERIFIKASI
        </T>
        <T x={0} y={14} size={10} weight={600} tracking={1} fill={palette.brick} anchor="middle" opacity={0.8}>
          2026
        </T>
      </g>
    )}
  </g>
);

export const DocumentStack: React.FC<{ x: number; y: number; s?: number; sheets?: number; rotate?: number; label?: string }> = ({
  x,
  y,
  s = 1,
  sheets = 4,
  rotate = 0,
  label,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    {Array.from({ length: sheets }).map((_, i) => {
      const off = (sheets - i - 1) * 5;
      return (
        <g key={i} transform={`translate(${off * 0.5} ${-off}) rotate(${(i - sheets / 2) * 1.4})`}>
          <Rect x={-80} y={-110} w={160} h={220} r={3} fill={i === 0 ? palette.paper : palette.paperDim} />
          {Array.from({ length: 9 }).map((__, j) => (
            <Rect key={j} x={-64} y={-88 + j * 20} w={j % 3 === 0 ? 96 : 128} h={5} r={2.5} fill={palette.inkSoft} opacity={0.22} />
          ))}
          {label && i === 0 && (
            <T x={-64} y={-96} size={13} weight={700} tracking={2} fill={palette.teal}>
              {label}
            </T>
          )}
        </g>
      );
    })}
  </g>
);

export const WallClock: React.FC<{ x: number; y: number; s?: number; minutes?: number; hours?: number }> = ({ x, y, s = 1, minutes = 0, hours = 0 }) => {
  const minAngle = (minutes / 60) * 360;
  const hourAngle = ((hours % 12) / 12) * 360 + minAngle / 12;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={0} r={46} fill={palette.paper} />
      <Circle cx={0} cy={0} r={46} fill="none" stroke={palette.inkSoft} strokeWidth={3} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <Rect key={i} x={Math.sin(a) * 38 - 1} y={-Math.cos(a) * 38 - 1} w={2} h={5} fill={palette.inkSoft} opacity={0.5} />;
      })}
      <Rect x={-2} y={-24} w={4} h={26} r={2} fill={palette.ink} transform={`rotate(${hourAngle})`} />
      <Rect x={-1.5} y={-34} w={3} h={36} r={1.5} fill={palette.brick} transform={`rotate(${minAngle})`} />
      <Circle cx={0} cy={0} r={4} fill={palette.ink} />
    </g>
  );
};

/** Digital holding-temperature gauge. `temp` in °C. */
export const TempGauge: React.FC<{ x: number; y: number; s?: number; temp: number; safe?: number }> = ({ x, y, s = 1, temp, safe = 60 }) => {
  const unsafe = temp < safe;
  const color = unsafe ? palette.brick : palette.sage;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-58} y={-40} w={116} h={80} r={8} fill={palette.inkSoft} />
      <Rect x={-50} y={-32} w={100} h={46} r={4} fill={palette.nightDeep} />
      <T x={0} y={4} size={30} weight={700} fill={color} anchor="middle">
        {`${Math.round(temp)}°C`}
      </T>
      <T x={0} y={26} size={10} weight={600} tracking={1.4} fill={unsafe ? palette.brickLight : palette.sage} anchor="middle">
        {unsafe ? 'DI BAWAH AMAN' : 'SUHU AMAN'}
      </T>
      <Rect x={-50} y={36} w={100} h={4} r={2} fill={palette.ink} opacity={0.5} />
    </g>
  );
};

/** A big-screen statistic, used for the "official number" scenes. */
export const GiantStat: React.FC<{ x: number; y: number; value: string; caption: string[]; s?: number; color?: string; dim?: number }> = ({
  x,
  y,
  value,
  caption,
  s = 1,
  color = palette.paper,
  dim = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={dim}>
    <T x={0} y={0} size={150} family="Instrument Serif" fill={color} anchor="middle" tracking={-4}>
      {value}
    </T>
    <T x={0} y={54} size={24} weight={600} tracking={4} fill={color} anchor="middle" opacity={0.72}>
      {caption}
    </T>
  </g>
);

/* ------------------------------------------------------------------ */
/* Furniture & environment objects                                     */
/* ------------------------------------------------------------------ */
export const SchoolDesk: React.FC<{ x: number; y: number; s?: number; flip?: boolean }> = ({ x, y, s = 1, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <Rect x={-70} y={-6} w={140} h={12} r={4} fill={palette.clayDeep} />
    <Rect x={-70} y={6} w={140} h={8} r={3} fill={palette.clay} />
    <Rect x={-56} y={14} w={8} h={54} fill={palette.inkSoft} opacity={0.85} />
    <Rect x={48} y={14} w={8} h={54} fill={palette.inkSoft} opacity={0.85} />
    <Rect x={-58} y={60} w={116} h={7} r={3} fill={palette.inkSoft} opacity={0.7} />
  </g>
);

export const Chair: React.FC<{ x: number; y: number; s?: number; flip?: boolean; color?: string }> = ({ x, y, s = 1, flip, color = palette.tealLight }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <Rect x={-34} y={-8} w={68} h={10} r={4} fill={color} />
    <Rect x={-32} y={-64} w={9} h={58} r={4} fill={color} />
    <Rect x={23} y={-64} w={9} h={58} r={4} fill={color} />
    <Rect x={-26} y={-56} w={52} h={10} r={4} fill={color} opacity={0.9} />
    <Rect x={-28} y={2} w={7} h={44} fill={palette.inkSoft} opacity={0.6} />
    <Rect x={21} y={2} w={7} h={44} fill={palette.inkSoft} opacity={0.6} />
  </g>
);

export const Bench: React.FC<{ x: number; y: number; s?: number; seats?: number; color?: string }> = ({ x, y, s = 1, seats = 3, color = palette.tealLight }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-160} y={-24} w={320} h={16} r={6} fill={color} />
    <Rect x={-160} y={-74} w={320} h={14} r={6} fill={color} opacity={0.85} />
    <Rect x={-146} y={-8} w={12} h={42} fill={palette.inkSoft} opacity={0.65} />
    <Rect x={134} y={-8} w={12} h={42} fill={palette.inkSoft} opacity={0.65} />
    {Array.from({ length: seats - 1 }).map((_, i) => (
      <Rect key={i} x={-160 + ((i + 1) * 320) / seats - 1} y={-24} w={2} h={16} fill={palette.ink} opacity={0.18} />
    ))}
  </g>
);

export const IVStand: React.FC<{ x: number; y: number; s?: number; drip?: number }> = ({ x, y, s = 1, drip = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-2} y={-210} w={4} h={210} fill={palette.paperShadow} />
    <Rect x={-30} y={-4} w={60} h={5} r={2} fill={palette.paperShadow} />
    <Rect x={-16} y={-252} w={32} h={58} r={10} fill={palette.coolLight} opacity={0.92} />
    <Rect x={-16} y={-252} w={32} h={58} r={10} fill="none" stroke={palette.paper} strokeWidth={2} opacity={0.5} />
    <Rect x={-13} y={-236} w={26} h={30} r={4} fill={palette.sage} opacity={0.7 + drip * 0.2} />
    <Path d={`M 0 -194 q 16 40 4 78`} stroke={palette.paper} strokeWidth={2} fill="none" opacity={0.6} />
  </g>
);

/** Kitchen equipment */
export const WokStation: React.FC<{ x: number; y: number; s?: number; flame?: number }> = ({ x, y, s = 1, flame = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-110} y={-40} w={220} h={16} r={6} fill={palette.paperShadow} />
    <Rect x={-96} y={-24} w={16} h={72} fill={palette.inkSoft} opacity={0.6} />
    <Rect x={80} y={-24} w={16} h={72} fill={palette.inkSoft} opacity={0.6} />
    <Path d="M -70 -40 A 70 34 0 0 0 70 -40 Z" fill={palette.inkSoft} />
    <Ellipse cx={0} cy={-42} rx={70} ry={13} fill={palette.ink} />
    {flame > 0 && (
      <Path d={`M -26 44 q 8 ${-18 - flame * 14} 16 0 q 6 ${-22 - flame * 10} 16 0 q 8 ${-14 - flame * 12} 14 0 Z`} fill={palette.mustard} opacity={0.85} />
    )}
    <Path d="M 92 -40 q 26 6 30 30" stroke={palette.paperShadow} strokeWidth={6} fill="none" />
  </g>
);

export const StorageShelf: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => (
      <Rect key={i} x={-120} y={-40 - i * 66} w={240} h={7} r={2} fill={palette.paperShadow} />
    ))}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        {[0, 1, 2].map((j) => (
          <Rect key={j} x={-104 + j * 74} y={-92 - i * 66} w={56} h={48} r={3} fill={i === 1 ? palette.sage : palette.clayLight} opacity={0.9} />
        ))}
      </g>
    ))}
    <Rect x={-124} y={-190} w={7} h={190} fill={palette.inkSoft} opacity={0.5} />
  </g>
);

export const RiceCooker: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-30} y={-56} w={60} h={56} r={10} fill={palette.paper} />
    <Rect x={-30} y={-56} w={60} h={12} r={6} fill={palette.paperDim} />
    <Circle cx={0} cy={-44} r={5} fill={palette.brick} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Everyday objects                                                    */
/* ------------------------------------------------------------------ */
export const SchoolBag: React.FC<{ x: number; y: number; s?: number; flip?: boolean }> = ({ x, y, s = 1, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <Rect x={-26} y={-52} w={52} h={52} r={14} fill={palette.brick} />
    <Rect x={-26} y={-30} w={52} h={12} fill={palette.brickDeep} opacity={0.6} />
    <Path d="M -14 -52 q 14 -18 28 0" stroke={palette.brickDeep} strokeWidth={5} fill="none" />
    <Rect x={-8} y={-16} w={16} h={12} r={3} fill={palette.mustard} opacity={0.9} />
  </g>
);

export const Phone: React.FC<{ x: number; y: number; s?: number; rotate?: number; glow?: number }> = ({ x, y, s = 1, rotate = 0, glow = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    {glow > 0 && <Rect x={-34} y={-64} w={68} h={128} r={14} fill={palette.coolLight} opacity={0.18 * glow} filter="url(#blur-soft)" />}
    <Rect x={-30} y={-60} w={60} h={120} r={12} fill={palette.ink} />
    <Rect x={-25} y={-53} w={50} h={106} r={7} fill={palette.tealDeep} />
    <Rect x={-25} y={-53} w={50} h={40} r={7} fill={palette.sageDeep} opacity={0.8} />
    <Path d="M -25 20 q 12 -8 24 2 q 10 8 26 -4" stroke={palette.paper} strokeWidth={2.4} fill="none" opacity={0.5} />
    <Circle cx={0} cy={-30} r={7} fill={palette.brick} opacity={0.9} />
    <Rect x={-14} y={-8} w={28} h={3} fill={palette.paper} opacity={0.5} />
    <Rect x={-14} y={2} w={20} h={3} fill={palette.paper} opacity={0.35} />
  </g>
);

export const Podium: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Path d="M -60 0 L -70 -150 L 70 -150 L 60 0 Z" fill={palette.teal} />
    <Rect x={-76} y={-166} w={152} h={18} r={4} fill={palette.tealLight} />
    <Rect x={-14} y={-206} w={28} h={42} r={6} fill={palette.inkSoft} />
    <Circle cx={0} cy={-214} r={12} fill={palette.ink} />
    <Rect x={-44} y={-124} w={88} h={3} fill={palette.paper} opacity={0.35} />
    <Rect x={-38} y={-108} w={76} h={3} fill={palette.paper} opacity={0.22} />
    <T x={0} y={-60} size={16} weight={700} tracking={3} fill={palette.paper} anchor="middle" opacity={0.55}>
      RAPAT
    </T>
  </g>
);

export const MoneyNote: React.FC<{ x: number; y: number; s?: number; rotate?: number }> = ({ x, y, s = 1, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <Rect x={-50} y={-26} w={100} h={52} r={4} fill={palette.sage} />
    <Rect x={-44} y={-20} w={88} h={40} r={2} fill="none" stroke={palette.oliveDeep} strokeWidth={2} opacity={0.5} />
    <Circle cx={-20} cy={0} r={13} fill={palette.oliveDeep} opacity={0.35} />
    <T x={22} y={6} size={14} weight={700} fill={palette.oliveDeep} anchor="middle" opacity={0.7}>
      Rp
    </T>
  </g>
);

export const CheckMark: React.FC<{ x: number; y: number; s?: number; color?: string; opacity?: number }> = ({ x, y, s = 1, color = palette.sage, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <Path d="M -14 0 L -4 12 L 16 -14" stroke={color} strokeWidth={6} fill="none" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Hands (the one image the statistics cannot produce)                 */
/* ------------------------------------------------------------------ */
/**
 * Two hands holding. Drawn as flat bands with a small set of fingers — enough detail to
 * read at 1080px without pretending to be photographic.
 */
export const HandsClasped: React.FC<{
  x: number;
  y: number;
  s?: number;
  grip?: number; // 0..1 — how tightly the adult fingers wrap
  adultSkin?: string;
  adultShade?: string;
  childSkin?: string;
  childShade?: string;
}> = ({ x, y, s = 1, grip = 0.5, adultSkin = '#C08A5F', adultShade = '#A06F49', childSkin = '#E8BE9B', childShade = '#CE9E79' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* adult forearm from lower-left */}
    <path d="M -300 210 L -96 40" stroke={adultShade} strokeWidth={104} strokeLinecap="round" fill="none" />
    <path d="M -300 190 L -100 30" stroke={adultSkin} strokeWidth={96} strokeLinecap="round" fill="none" />
    {/* child forearm from lower-right */}
    <path d="M 290 250 L 70 60" stroke={childShade} strokeWidth={70} strokeLinecap="round" fill="none" />
    <path d="M 290 232 L 76 52" stroke={childSkin} strokeWidth={64} strokeLinecap="round" fill="none" />

    {/* child hand: back of the hand facing us */}
    <g transform="rotate(-26 40 20)">
      <rect x={-30} y={-30} width={128} height={104} rx={40} fill={childSkin} />
      <rect x={-26} y={-22} width={114} height={88} rx={36} fill={childSkin} />
      {/* child fingers */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={70 - i * 2} y={-26 + i * 22} width={44 + grip * 10} height={18} rx={9} fill={childShade} opacity={0.95} />
      ))}
      <rect x={-6} y={44} width={62} height={20} rx={10} fill={childShade} opacity={0.9} />
    </g>

    {/* adult hand wrapping over */}
    <g transform="rotate(-18 -10 10)">
      <rect x={-84} y={-44} width={150} height={122} rx={48} fill={adultSkin} />
      {/* adult fingers over the child's hand */}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={50 - grip * 8}
          y={-40 + i * 26}
          width={62 + grip * 14}
          height={22}
          rx={11}
          fill={adultSkin}
        />
      ))}
      {/* thumb */}
      <rect x={-8} y={40 + grip * 6} width={70} height={24} rx={12} fill={adultSkin} />
      <rect x={54} y={-46} width={14} height={108} rx={7} fill={adultShade} opacity={0.35} />
    </g>
  </g>
);

/**
 * PlateStack — the programme's unit of success, drawn to scale.
 * Each plate is offset by hand-tuned jitter so the stack reads as physical rather than
 * as a repeated symbol; `dim` pushes background stacks back into the room.
 */
export const PlateStack: React.FC<{ x: number; y: number; count?: number; s?: number; jitter?: number; dim?: number }> = ({
  x,
  y,
  count = 12,
  s = 1,
  jitter = 1,
  dim = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - dim * 0.6}>
    {Array.from({ length: count }).map((_, i) => {
      const wobble = (i % 2 === 0 ? 1 : -1) * jitter * (1.2 + (i % 3) * 0.6);
      return (
        <g key={i} transform={`translate(${wobble * 3} ${-i * 26})`}>
          <Plate x={0} y={0} s={0.86} empty={false} tilt={wobble * 0.7} opacity={1 - i * 0.012} />
          {dim > 0 && <Plate x={0} y={0} s={0.86} empty tilt={wobble * 0.7} opacity={dim * 0.5} />}
        </g>
      );
    })}
  </g>
);
