/**
 * ENVIRONMENTS
 * ------------
 * Each environment is layered (background / midground / foreground) so the camera
 * can move through depth, and so props can sit *inside* a space instead of on top of it.
 * Environments are concrete: a school corridor, a classroom, an SPPG kitchen, a
 * puskesmas waiting room, an institutional hall — never a generic gradient.
 *
 * All environments are authored at 1080x1920 and cropped by the camera.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { Circle, Ellipse, Path, Rect, T } from './primitives';

const W = 1080;
const H = 1920;

/* ------------------------------------------------------------------ */
/* 1. SCHOOL CORRIDOR (one-point perspective)                          */
/* ------------------------------------------------------------------ */
export const Corridor: React.FC<{ dusk?: number; lights?: number; id?: string }> = ({ dusk = 0, lights = 0, id = 'cor' }) => {
  const vx = 540;
  const vy = 1010;
  const mix = (a: string, b: string) => (dusk > 0.5 ? b : a);
  return (
    <g>
      {/* --- background: far wall + end door --- */}
      <Rect x={0} y={0} w={W} h={H} fill={mix(palette.tealDeep, palette.nightDeep)} />
      <Rect x={vx - 150} y={vy - 240} w={300} h={300} fill={mix('#3C5C56', '#22343A')} />
      <Rect x={vx - 52} y={vy - 120} w={104} h={180} fill={palette.ink} opacity={0.55} />
      <Rect x={vx - 40} y={vy - 190} w={80} h={64} fill={mix(palette.warmLight, palette.mustardDeep)} opacity={0.35 + lights * 0.3} />

      {/* --- midground: left wall with windows, right wall with doors --- */}
      {/* left wall */}
      <Path d={`M 0 0 L ${vx - 150} ${vy - 240} L ${vx - 150} ${vy + 60} L 0 ${H} Z`} fill={mix('#4E6A62', '#2C403E')} />
      {/* right wall */}
      <Path d={`M ${W} 0 L ${vx + 150} ${vy - 240} L ${vx + 150} ${vy + 60} L ${W} ${H} Z`} fill={mix('#3F5A53', '#243634')} />
      {/* ceiling */}
      <Path d={`M 0 0 L ${W} 0 L ${vx + 150} ${vy - 240} L ${vx - 150} ${vy - 240} Z`} fill={mix('#2A403C', '#18262A')} />
      {/* floor */}
      <Path d={`M 0 ${H} L ${W} ${H} L ${vx + 150} ${vy + 60} L ${vx - 150} ${vy + 60} Z`} fill={mix('#5A6A5C', '#2A3A38')} />
      {/* floor tile lines */}
      {[0.18, 0.36, 0.54, 0.72].map((t, i) => (
        <Path key={i} d={`M ${t * W} ${H} L ${vx + (t - 0.5) * 300} ${vy + 60}`} stroke={palette.ink} strokeWidth={2} opacity={0.16} />
      ))}
      {[0.1, 0.22, 0.38, 0.6].map((t, i) => (
        <Path key={`h${i}`} d={`M ${vx - 150 - t * 380} ${vy + 60 + t * 700} L ${vx + 150 + t * 380} ${vy + 60 + t * 700}`} stroke={palette.ink} strokeWidth={2} opacity={0.12} />
      ))}

      {/* left windows with light shafts */}
      {[
        { x0: 40, y0: 236, x1: 236, y1: 336 },
        { x0: 214, y0: 390, x1: 336, y1: 452 },
      ].map((w, i) => (
        <g key={i}>
          <Path
            d={`M ${w.x0} ${w.y0} L ${w.x1} ${w.y0 + 20} L ${w.x1} ${w.y1 + 20} L ${w.x0} ${w.y1} Z`}
            fill={mix(palette.warmLight, palette.mustardDeep)}
            opacity={0.5 - dusk * 0.25}
          />
          <Path d={`M ${w.x0} ${w.y0} L ${w.x1} ${w.y0 + 20}`} stroke={palette.ink} strokeWidth={6} opacity={0.4} />
        </g>
      ))}
      <Path d={`M 40 236 L 560 1500 L 900 1600 L 236 336 Z`} fill={palette.warmLight} opacity={0.07 + lights * 0.02} />

      {/* right doors */}
      {[
        { y: 470, h: 300, x: 930 },
        { y: 300, h: 200, x: 800 },
      ].map((d, i) => (
        <g key={i}>
          <Rect x={d.x} y={d.y} w={130} h={d.h} fill={i === 0 ? palette.clayDeep : palette.teal} opacity={0.85} />
          <Rect x={d.x + 14} y={d.y + 22} w={102} h={d.h - 44} fill={palette.ink} opacity={0.18} />
          <Circle cx={d.x + 112} cy={d.y + d.h / 2} r={5} fill={palette.mustard} opacity={0.8} />
        </g>
      ))}

      {/* wall signage — a school nameplate, deliberately abstract */}
      <Rect x={70} y={120} w={300} h={62} r={6} fill={palette.ink} opacity={0.35} />
      <T x={92} y={162} size={26} weight={600} tracking={3.4} fill={palette.paper} opacity={0.6}>
        RUANG KELAS
      </T>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 2. CLASSROOM                                                        */
/* ------------------------------------------------------------------ */
export const Classroom: React.FC<{ dusk?: number; busy?: number }> = ({ dusk = 0, busy = 0 }) => {
  const wall = dusk > 0.5 ? '#3A4A45' : '#5C6E5E';
  const floor = dusk > 0.5 ? '#46503F' : '#7A7A5E';
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={wall} />
      {/* lower wall band */}
      <rect x={0} y={860} width={W} height={460} fill={dusk > 0.5 ? '#33433E' : '#63755F'} />
      <rect x={0} y={856} width={W} height={10} fill={palette.ink} opacity={0.16} />

      {/* blackboard */}
      <rect x={70} y={300} width={610} height={300} rx={6} fill={palette.tealDeep} />
      <rect x={70} y={300} width={610} height={300} rx={6} fill="none" stroke={palette.paperShadow} strokeWidth={9} opacity={0.55} />
      <rect x={112} y={352} width={250} height={9} fill={palette.paper} opacity={0.22} />
      <rect x={112} y={392} width={420} height={9} fill={palette.paper} opacity={0.16} />
      <rect x={112} y={432} width={190} height={9} fill={palette.mustard} opacity={0.5} />
      <rect x={112} y={500} width={130} height={9} fill={palette.paper} opacity={0.14} />
      {/* chalk tray */}
      <rect x={70} y={598} width={610} height={12} rx={4} fill={palette.clayDeep} opacity={0.8} />

      {/* window */}
      <rect x={740} y={320} width={286} height={400} fill={palette.warmLight} opacity={0.5 - dusk * 0.22} />
      <rect x={740} y={320} width={286} height={400} fill="none" stroke={palette.paperShadow} strokeWidth={11} opacity={0.6} />
      <rect x={878} y={320} width={9} height={400} fill={palette.paperShadow} opacity={0.6} />
      <rect x={740} y={520} width={286} height={8} fill={palette.paperShadow} opacity={0.6} />

      {/* wall clock */}
      <circle cx={915} cy={212} r={40} fill={palette.paper} opacity={0.92} />
      <circle cx={915} cy={212} r={40} fill="none" stroke={palette.inkSoft} strokeWidth={5} opacity={0.8} />
      <rect x={913} y={188} width={4} height={26} fill={palette.inkSoft} />
      <rect x={915} y={210} width={20} height={3.5} fill={palette.brick} />

      {/* pinned paper on the wall */}
      <g opacity={0.85}>
        <rect x={170} y={680} width={180} height={130} rx={3} fill={palette.paper} opacity={0.85} />
        <rect x={190} y={706} width={120} height={7} fill={palette.inkSoft} opacity={0.3} />
        <rect x={190} y={726} width={140} height={7} fill={palette.inkSoft} opacity={0.22} />
        <rect x={190} y={746} width={96} height={7} fill={palette.inkSoft} opacity={0.22} />
      </g>

      {/* light shaft from the window */}
      <path d={`M 750 330 L 1020 330 L 860 1500 L 210 1500 Z`} fill={palette.warmLight} opacity={0.09 + (1 - dusk) * 0.05} />

      {/* floor */}
      <rect x={0} y={1320} width={W} height={600} fill={floor} />
      <rect x={0} y={1320} width={W} height={14} fill={palette.ink} opacity={0.2} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 300 - 40} y={1334} width={3} height={586} fill={palette.ink} opacity={0.1} />
      ))}
      <rect x={0} y={1510} width={W} height={4} fill={palette.ink} opacity={0.08} />
      <rect x={0} y={1690} width={W} height={4} fill={palette.ink} opacity={0.08} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 3. SPPG KITCHEN                                                     */
/* ------------------------------------------------------------------ */
export const Kitchen: React.FC<{ steam?: number }> = ({ steam = 0 }) => (
  <g>
    <Rect x={0} y={0} w={W} h={H} fill="#6C7A6E" />
    {/* tiled wall */}
    <Rect x={0} y={0} w={W} h={1060} fill="url(#tile-fill)" />
    <Rect x={0} y={0} w={W} h={1060} fill={palette.ink} opacity={0.12} />
    {/* upper steel shelf */}
    <Rect x={60} y={300} w={960} h={16} r={4} fill={palette.paperShadow} />
    <Rect x={60} y={470} w={960} h={16} r={4} fill={palette.paperShadow} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Rect key={i} x={100 + i * 180} y={214} w={110} h={80} r={6} fill={i % 2 ? palette.sage : palette.paperDim} />
    ))}
    {/* hanging utensils */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <Rect x={760 + i * 62} y={488} w={6} h={74} fill={palette.paperShadow} />
        <Path d={`M ${752 + i * 62} 562 q 14 40 28 0 Z`} fill={palette.inkSoft} opacity={0.8} />
      </g>
    ))}
    {/* certificate frame on the wall — evidence object, deliberately readable */}
    <Rect x={640} y={300} w={250} h={150} r={4} fill={palette.paper} opacity={0.96} />
    <Rect x={640} y={300} w={250} h={150} r={4} fill="none" stroke={palette.mustardDeep} strokeWidth={5} opacity={0.8} />
    <Rect x={662} y={324} w={150} h={8} fill={palette.teal} opacity={0.6} />
    <Rect x={662} y={344} w={206} h={6} fill={palette.inkSoft} opacity={0.25} />
    <Rect x={662} y={360} w={170} h={6} fill={palette.inkSoft} opacity={0.25} />
    <Circle cx={700} cy={406} r={20} fill="none" stroke={palette.brick} strokeWidth={4} opacity={0.7} />
    <Rect x={740} y={392} w={128} h={6} fill={palette.inkSoft} opacity={0.25} />
    <Rect x={740} y={410} w={92} h={6} fill={palette.inkSoft} opacity={0.2} />
    {/* steam */}
    {steam > 0 && (
      <g opacity={0.16 * steam}>
        <Path d={`M 300 900 q -40 -120 10 -230 q 40 -90 -6 -180`} stroke={palette.paper} strokeWidth={44} fill="none" />
        <Path d={`M 460 920 q 46 -130 -6 -240 q -40 -90 8 -170`} stroke={palette.paper} strokeWidth={36} fill="none" />
      </g>
    )}
    {/* stainless counter */}
    <Rect x={0} y={980} w={W} h={44} fill="#9AA79C" />
    <Rect x={0} y={1024} w={W} h={220} fill="#7C8B80" />
    <Rect x={0} y={1024} w={W} h={10} fill={palette.ink} opacity={0.2} />
    {[0, 1, 2, 3].map((i) => (
      <Rect key={i} x={60 + i * 250} y={1060} w={180} h={140} r={6} fill="#6C7A70" opacity={0.85} />
    ))}
    {/* floor */}
    <Rect x={0} y={1244} w={W} h={676} fill="#4E5A52" />
    <Rect x={0} y={1244} w={W} h={8} fill={palette.ink} opacity={0.25} />
    {/* drain */}
    <Rect x={430} y={1620} w={220} h={16} r={4} fill={palette.inkSoft} opacity={0.6} />
    {Array.from({ length: 10 }).map((_, i) => (
      <Rect key={i} x={442 + i * 20} y={1624} w={8} h={8} fill={palette.ink} opacity={0.5} />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* 4. PUSKESMAS WAITING ROOM                                           */
/* ------------------------------------------------------------------ */
export const WaitingRoom: React.FC<{ dusk?: number }> = ({ dusk = 0.6 }) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={dusk > 0.5 ? '#3E4E4A' : '#8FA298'} />
    {/* wall */}
    <rect x={0} y={0} width={W} height={1180} fill={dusk > 0.5 ? '#43534E' : '#93A79B'} />
    <rect x={0} y={700} width={W} height={480} fill={dusk > 0.5 ? '#3B4A46' : '#8A9E93'} />
    <rect x={0} y={900} width={W} height={10} fill={palette.ink} opacity={0.14} />

    {/* window: a real dusk view (roofline + sky), not a light box */}
    <g>
      <rect x={600} y={250} width={430} height={450} fill={palette.mustardDeep} opacity={0.55} />
      <rect x={600} y={250} width={430} height={450} fill="none" stroke={palette.paperShadow} strokeWidth={16} opacity={0.75} />
      {/* sky gradient */}
      <rect x={612} y={262} width={406} height={426} fill={palette.warmLight} opacity={0.5} />
      <rect x={612} y={262} width={406} height={240} fill={palette.mustard} opacity={0.35} />
      {/* sun */}
      <circle cx={880} cy={430} r={54} fill={palette.warmLight} opacity={0.85} />
      {/* rooftops */}
      <path d="M 612 560 L 700 560 L 700 520 L 760 520 L 760 574 L 826 574 L 826 500 L 884 500 L 884 566 L 940 566 L 940 536 L 1018 536 L 1018 688 L 612 688 Z" fill={palette.tealDeep} opacity={0.55} />
      {/* mullions */}
      <rect x={806} y={262} width={12} height={426} fill={palette.paperShadow} opacity={0.85} />
      <rect x={612} y={468} width={406} height={12} fill={palette.paperShadow} opacity={0.85} />
    </g>
    <path d={`M 640 280 L 1000 280 L 860 1500 L 240 1500 Z`} fill={palette.warmLight} opacity={0.1} />

    {/* posters — abstract, no official identity */}
    <rect x={80} y={300} width={290} height={210} rx={4} fill={palette.paper} opacity={0.9} />
    <rect x={80} y={300} width={290} height={52} fill={palette.teal} opacity={0.85} />
    <rect x={100} y={376} width={210} height={9} fill={palette.inkSoft} opacity={0.3} />
    <rect x={100} y={402} width={170} height={9} fill={palette.inkSoft} opacity={0.22} />
    <rect x={100} y={428} width={200} height={9} fill={palette.inkSoft} opacity={0.22} />
    <circle cx={318} cy={468} r={20} fill={palette.sage} opacity={0.5} />

    {/* wall clock + ceiling fan */}
    <circle cx={470} cy={250} r={46} fill={palette.paper} opacity={0.92} />
    <circle cx={470} cy={250} r={46} fill="none" stroke={palette.inkSoft} strokeWidth={5} opacity={0.8} />
    <rect x={468} y={224} width={4} height={30} fill={palette.inkSoft} />
    <rect x={470} y={248} width={24} height={4} fill={palette.brick} />
    <g opacity={0.55}>
      <rect x={532} y={0} width={8} height={120} fill={palette.paperShadow} />
      <ellipse cx={536} cy={132} rx={120} ry={16} fill={palette.paperShadow} />
      <ellipse cx={536} cy={132} rx={26} ry={12} fill={palette.inkSoft} opacity={0.5} />
    </g>

    {/* floor tiles */}
    <rect x={0} y={1180} width={W} height={740} fill="#6E7A70" />
    <rect x={0} y={1180} width={W} height={740} fill="url(#tile-fill)" opacity={0.25} />
    <rect x={0} y={1180} width={W} height={12} fill={palette.ink} opacity={0.2} />
  </g>
);

/* ------------------------------------------------------------------ */
/* 5. INSTITUTIONAL HALL (dark, screen, podium)                        */
/* ------------------------------------------------------------------ */
export const Hall: React.FC<{ screenGlow?: number; sconce?: number }> = ({ screenGlow = 1, sconce = 0.5 }) => (
  <g>
    <Rect x={0} y={0} w={W} h={H} fill={palette.nightDeep} />
    {/* back wall */}
    <Rect x={0} y={240} w={W} h={1000} fill={palette.night} />
    {/* screen frame */}
    <Rect x={90} y={520} w={900} h={520} r={8} fill="#0B1210" />
    <Rect x={90} y={520} w={900} h={520} r={8} fill={palette.coolLight} opacity={0.03 + screenGlow * 0.05} />
    <Rect x={90} y={520} w={900} h={520} r={8} fill="none" stroke={palette.tealLight} strokeWidth={3} opacity={0.5} />
    {/* screen glow spill */}
    <Ellipse cx={540} cy={780} rx={620} ry={420} fill={palette.coolLight} opacity={0.07 * screenGlow} filter="url(#blur-soft)" />
    {/* ceiling strips */}
    {[320, 470, 620, 770].map((x, i) => (
      <Rect key={i} x={x} y={252} w={120} h={10} r={5} fill={palette.warmLight} opacity={0.18 + sconce * 0.12} />
    ))}
    {/* floor */}
    <Rect x={0} y={1240} w={W} h={680} fill="#16211E" />
    <Rect x={0} y={1240} w={W} h={680} fill={palette.tealLight} opacity={0.05} />
    {/* audience chairs, silhouetted — no faces, no identifiable persons */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i} transform={`translate(${90 + i * 160} 1330) scale(${1.5 - i * 0.05})`}>
        <Rect x={-46} y={-30} w={92} h={26} r={9} fill="#0D1513" />
        <Rect x={-40} y={-96} w={80} h={70} r={12} fill="#0D1513" />
        <Rect x={-8} y={-118} w={16} h={30} rx={8} fill="#0D1513" />
        <Circle cx={0} cy={-140} r={26} fill="#0D1513" />
      </g>
    ))}
    {/* foreground desk edge */}
    <Rect x={0} y={1700} w={W} h={220} fill="#0A110F" />
    <Rect x={0} y={1700} w={W} h={10} fill={palette.tealLight} opacity={0.14} />
  </g>
);

/* ------------------------------------------------------------------ */
/* 6. DATA VOID (abstract, used only where abstraction is the point)   */
/* ------------------------------------------------------------------ */
export const DataVoid: React.FC<{ gridOpacity?: number }> = ({ gridOpacity = 0.14 }) => (
  <g>
    <Rect x={0} y={0} w={W} h={H} fill={palette.nightDeep} />
    <Ellipse cx={540} cy={900} rx={700} ry={700} fill={palette.tealDeep} opacity={0.55} filter="url(#blur-soft)" />
    {Array.from({ length: 18 }).map((_, i) => (
      <Path key={`v${i}`} d={`M ${i * 64} 0 L ${i * 64} ${H}`} stroke={palette.sage} strokeWidth={1} opacity={gridOpacity * 0.5} />
    ))}
    {Array.from({ length: 30 }).map((_, i) => (
      <Path key={`h${i}`} d={`M 0 ${i * 64} L ${W} ${i * 64}`} stroke={palette.sage} strokeWidth={1} opacity={gridOpacity * 0.5} />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* 7. EMPTY ROOM AT DUSK (closing)                                     */
/* ------------------------------------------------------------------ */
export const EmptyRoom: React.FC<{ warmth?: number }> = ({ warmth = 0.5 }) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill="#1B2521" />
    {/* wall */}
    <rect x={0} y={0} width={W} height={1240} fill="#26332C" />
    <rect x={0} y={820} width={W} height={420} fill="#22302A" />
    <rect x={0} y={816} width={W} height={8} fill={palette.ink} opacity={0.35} />

    {/* window on the right: dusk sky, roofs, long light */}
    <g>
      <rect x={640} y={300} width={380} height={430} fill={palette.mustardDeep} opacity={0.5} />
      <rect x={652} y={312} width={356} height={406} fill={palette.warmLight} opacity={0.42 * (warmth + 0.6)} />
      <rect x={652} y={312} width={356} height={210} fill={palette.mustard} opacity={0.3} />
      <circle cx={890} cy={430} r={44} fill={palette.warmLight} opacity={0.8} />
      <path d="M 652 560 L 720 560 L 720 526 L 780 526 L 780 572 L 840 572 L 840 512 L 900 512 L 900 566 L 960 566 L 960 540 L 1008 540 L 1008 648 L 652 648 Z" fill={palette.tealDeep} opacity={0.5} />
      <rect x={826} y={312} width={10} height={406} fill={palette.ink} opacity={0.5} />
      <rect x={652} y={500} width={356} height={10} fill={palette.ink} opacity={0.5} />
      <rect x={640} y={300} width={380} height={430} fill="none" stroke={palette.ink} strokeWidth={14} opacity={0.55} />
    </g>

    {/* blackboard, left wall */}
    <rect x={60} y={430} width={520} height={300} rx={6} fill="#20322E" />
    <rect x={60} y={430} width={520} height={300} rx={6} fill="none" stroke={palette.paperShadow} strokeWidth={8} opacity={0.35} />
    <rect x={60} y={720} width={520} height={12} rx={4} fill={palette.clayDeep} opacity={0.7} />
    {/* faint chalk remains */}
    <rect x={110} y={700} width={180} height={5} fill={palette.paper} opacity={0.08} />

    {/* light beam onto the floor */}
    <path d="M 660 320 L 1010 320 L 900 1600 L 260 1600 Z" fill={palette.warmLight} opacity={0.1} />
    <path d="M 700 340 L 860 340 L 760 1560 L 420 1560 Z" fill={palette.warmLight} opacity={0.06} />

    {/* floor */}
    <rect x={0} y={1240} width={W} height={680} fill="#39443A" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={0} y={1300 + i * 150} width={W} height={3} fill={palette.ink} opacity={0.14} />
    ))}
    <rect x={0} y={1240} width={W} height={10} fill={palette.ink} opacity={0.3} />
  </g>
);
