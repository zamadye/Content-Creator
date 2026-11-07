/**
 * SISTEM VISUAL "KARTUN EDITORIAL" (v2)
 * -------------------------------------
 * Diadopsi dari video_reference.mp4 (720x1280, 88 s): karakter kartun berulang,
 * latar vektor berlapis (langit -> bukit -> tanah -> properti), caption karaoke
 * dengan kata kunci di-highlight.
 *
 * Aturan:
 * - Karakter selalu digambar dari SATU komponen <Karakter/> supaya identitas
 *   (kepala besar, badan tongkat, sepatu) konsisten di seluruh episode.
 * - Lapisan wajib: BG (langit/bukit), MG (gedung/pabrik), FG (karakter/properti).
 * - Caption karaoke hanya SATU baris, maksimum 34 karakter, kata kunci disorot.
 */
import React from 'react';
import { Circle, Ellipse, Path, Rect, T } from './primitives';
import { layout } from '../../../design/tokens';

const W = 1080;
const H = 1920;

export const kartun = {
  sky: '#DCEAE6',
  skyWarm: '#F0E4CE',
  skyDusk: '#E8CDB4',
  hillFar: '#B9C6A8',
  hillMid: '#9AAA85',
  hillNear: '#7C8C63',
  ground: '#C9A97B',
  groundDark: '#AE8E63',
  water: '#8FB8B4',
  road: '#B9AE9C',
  skin: '#F3D4B4',
  skinDark: '#E0B48C',
  hair: '#2B2B2B',
  shirt: '#3F6B63',
  shirtAlt: '#B96A45',
  shirtAlt2: '#D9A544',
  pants: '#3A4650',
  shoe: '#22282A',
  line: '#1B211E',
  green: '#3E9B4F',
  greenDeep: '#2C7539',
  red: '#B4463C',
  paper: '#F7F1E4',
  shadow: 'rgba(27,33,30,0.16)',
};

/* ------------------------------------------------------------------ latar */

export const Sky: React.FC<{ top?: string; bottom?: string; sun?: boolean }> = ({
  top = kartun.sky, bottom = kartun.skyWarm, sun = true,
}) => (
  <g>
    <defs>
      <linearGradient id="k-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={top} />
        <stop offset="100%" stopColor={bottom} />
      </linearGradient>
    </defs>
    <Rect x={0} y={0} w={W} h={H} fill="url(#k-sky)" />
    {sun && <Circle cx={830} cy={360} r={86} fill="#F2D48A" opacity={0.85} />}
  </g>
);

export const Hills: React.FC<{ y?: number; scale?: number }> = ({ y = 1180, scale = 1 }) => (
  <g>
    <Path d={`M-40 ${y + 90} C 160 ${y - 40} 340 ${y + 40} 560 ${y + 80} C 780 ${y + 120} 900 ${y - 20} 1120 ${y + 70} L1120 2100 L-40 2100 Z`} fill={kartun.hillFar} />
    <Path d={`M-40 ${y + 210} C 200 ${y + 90} 420 ${y + 190} 620 ${y + 200} C 820 ${y + 210} 960 ${y + 120} 1120 ${y + 180} L1120 2100 L-40 2100 Z`} fill={kartun.hillMid} opacity={0.95} />
    <Path d={`M-40 ${y + 330} C 240 ${y + 230} 460 ${y + 320} 700 ${y + 310} C 880 ${y + 300} 1000 ${y + 250} 1120 ${y + 290} L1120 2100 L-40 2100 Z`} fill={kartun.hillNear} opacity={0.9} />
    <Rect x={0} y={y + 400} w={W} h={H} fill={kartun.ground} />
    <Rect x={0} y={y + 400} w={W} h={26} fill={kartun.groundDark} opacity={0.5} />
    <g opacity={0.35}>
      {Array.from({ length: 26 }).map((_, i) => (
        <Ellipse key={i} cx={(i * 47 + 20) % W} cy={y + 460 + ((i * 83) % 360)} rx={12} ry={4} fill={kartun.groundDark} />
      ))}
    </g>
    <g opacity={0.28} style={{ display: 'none' }}>{String(scale)}</g>
  </g>
);

export const River: React.FC<{ y?: number }> = ({ y = 1470 }) => (
  <g>
    <Path d={`M-40 ${y} C 240 ${y - 40} 700 ${y + 40} 1120 ${y - 10} L1120 ${y + 210} C 700 ${y + 250} 240 ${y + 170} -40 ${y + 200} Z`} fill={kartun.water} />
    <Path d={`M60 ${y + 70} C 300 ${y + 50} 520 ${y + 90} 760 ${y + 60}`} stroke="#EAF2EF" strokeWidth={7} fill="none" opacity={0.55} linecap="round" />
    <Path d={`M300 ${y + 140} C 520 ${y + 120} 700 ${y + 150} 900 ${y + 128}`} stroke="#EAF2EF" strokeWidth={6} fill="none" opacity={0.4} linecap="round" />
  </g>
);

/* ------------------------------------------------------------------ karakter */

const armPath = (side: -1 | 1, ang: number) => {
  const ax = side * 34, ay = -204;
  const ex = ax + side * 26, ey = ay + 52;
  const rad = (ang * Math.PI) / 180;
  const hx = ex + side * Math.sin(rad) * 54;
  const hy = ey + Math.cos(rad) * 56;
  return `M${ax} ${ay} L${ex} ${ey} L${hx} ${hy}`;
};

export type Pose = 'stand' | 'pointLeft' | 'pointRight' | 'slump' | 'armsUp' | 'carry';
export type Face = 'neutral' | 'worried' | 'sad' | 'angry' | 'smile' | 'shock';

export const Karakter: React.FC<{
  x: number; y: number; s?: number;           // y = garis tanah (kaki)
  shirt?: string; skin?: string; hair?: string;
  pose?: Pose; face?: Face; moustache?: boolean; hat?: string;
  flip?: boolean; opacity?: number; cap?: string;
}> = ({ x, y, s = 1, shirt = kartun.shirt, skin = kartun.skin, hair = kartun.hair,
  pose = 'stand', face = 'neutral', moustache = false, hat, flip = false, opacity = 1, cap }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={opacity}>
      <Ellipse cx={0} cy={6} rx={64} ry={16} fill={kartun.shadow} />
      {/* kaki */}
      <Path d={`M-16 -92 L-20 -14`} stroke={kartun.pants} strokeWidth={16} linecap="round" fill="none" />
      <Path d={`M16 -92 L20 -14`} stroke={kartun.pants} strokeWidth={16} linecap="round" fill="none" />
      <Ellipse cx={-26} cy={-8} rx={20} ry={9} fill={kartun.shoe} />
      <Ellipse cx={26} cy={-8} rx={20} ry={9} fill={kartun.shoe} />
      {/* tangan */}
      <Path d={armPath(-1, pose === 'armsUp' ? 130 : pose === 'slump' ? 8 : pose === 'carry' ? 20 : 26)} stroke={skin} strokeWidth={15} linecap="round" fill="none" />
      <Path d={armPath(1, pose === 'armsUp' ? 130 : pose === 'pointRight' ? 96 : pose === 'pointLeft' ? 20 : pose === 'carry' ? 30 : 24)} stroke={skin} strokeWidth={15} linecap="round" fill="none" />
      {/* badan */}
      <Path d={`M-30 -100 Q-34 -150 -27 -196 Q-20 -234 0 -236 Q20 -234 27 -196 Q34 -150 30 -100 Z`} fill={shirt} />
      {cap && <Rect x={-26} y={-190} w={52} h={8} fill="#ffffff" opacity={0.35} />}
      {/* kepala */}
      <Circle cx={0} cy={-292} r={62} fill={skin} />
      <Path d={`M-62 -300 a62 62 0 0 1 124 0 q-30 -18 -62 -14 q-32 -4 -62 14 Z`} fill={hair} />
      {hat && <Path d={`M-54 -344 h108 l-10 -30 h-88 Z`} fill={hat} />}
      {/* mata */}
      {face === 'shock' ? (
        <g>
          <Circle cx={-20} cy={-292} r={13} fill="#fff" stroke={kartun.line} strokeWidth={3} />
          <Circle cx={20} cy={-292} r={13} fill="#fff" stroke={kartun.line} strokeWidth={3} />
          <Circle cx={-20} cy={-292} r={5} fill={kartun.line} />
          <Circle cx={20} cy={-292} r={5} fill={kartun.line} />
        </g>
      ) : (
        <g>
          <Ellipse cx={-20} cy={-294} rx={7} ry={9} fill={kartun.line} />
          <Ellipse cx={20} cy={-294} rx={7} ry={9} fill={kartun.line} />
        </g>
      )}
      {/* alis */}
      <Path d={face === 'angry' ? 'M-34 -314 L-8 -308' : face === 'worried' || face === 'sad' ? 'M-34 -312 L-8 -318' : 'M-34 -316 L-8 -316'} stroke={kartun.line} strokeWidth={5} linecap="round" fill="none" />
      <Path d={face === 'angry' ? 'M34 -314 L8 -308' : face === 'worried' || face === 'sad' ? 'M34 -312 L8 -318' : 'M34 -316 L8 -316'} stroke={kartun.line} strokeWidth={5} linecap="round" fill="none" />
      {moustache && <Path d="M-20 -268 q20 -8 40 0" stroke={kartun.hair} strokeWidth={7} fill="none" linecap="round" />}
      {/* mulut */}
      {face === 'smile' && <Path d="M-16 -262 q16 14 32 0" stroke={kartun.line} strokeWidth={5} fill="none" linecap="round" />}
      {(face === 'sad' || face === 'worried') && <Path d="M-16 -252 q16 -12 32 0" stroke={kartun.line} strokeWidth={5} fill="none" linecap="round" />}
      {face === 'angry' && <Path d="M-16 -256 h32" stroke={kartun.line} strokeWidth={6} linecap="round" />}
      {face === 'shock' && <Ellipse cx={0} cy={-256} rx={10} ry={13} fill={kartun.line} />}
      {face === 'neutral' && <Path d="M-14 -258 h28" stroke={kartun.line} strokeWidth={5} linecap="round" />}
    </g>
  );
};

/* ------------------------------------------------------------------ properti */

export const Pabrik: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 1, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <Rect x={-260} y={-300} w={520} h={300} fill="#B9AE9C" />
    <Rect x={-260} y={-300} w={520} h={18} fill="#8E8577" />
    <Rect x={-200} y={-420} w={64} h={130} fill="#9E9485" />
    <Rect x={-80} y={-460} w={64} h={170} fill="#9E9485" />
    <Rect x={40} y={-400} w={64} h={110} fill="#9E9485" />
    <g opacity={0.55}>
      <Circle cx={-168} cy={-470} r={34} fill="#E4E0D8" />
      <Circle cx={-124} cy={-512} r={26} fill="#E4E0D8" opacity={0.8} />
      <Circle cx={-48} cy={-520} r={38} fill="#E4E0D8" />
      <Circle cx={8} cy={-566} r={24} fill="#E4E0D8" opacity={0.7} />
    </g>
    {[-190, -120, -50, 20, 90, 160].map((wx) => (
      <Rect key={wx} x={wx} y={-210} w={44} h={52} fill="#5C6A63" opacity={0.8} />
    ))}
    <Rect x={-70} y={-140} w={140} h={140} fill="#5C6A63" />
    <Rect x={-260} y={-16} w={520} h={16} fill="#8E8577" />
  </g>
);

export const Papan: React.FC<{ x: number; y: number; w?: number; h?: number; label?: string; value?: string; accent?: string; rotate?: number }> = ({
  x, y, w = 380, h = 210, label, value, accent = kartun.paper, rotate = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <Rect x={-w / 2} y={-h} w={w} h={h} fill={accent} stroke={kartun.line} strokeWidth={5} />
    <Rect x={-10} y={-4} w={20} h={54} fill="#8A7C63" />
    {label && <T x={0} y={-h + 56} anchor="middle" size={26} weight={800} tracking={1.4} fill={kartun.line}>{label}</T>}
    {value && <T x={0} y={-h + 150} anchor="middle" size={64} weight={800} fill={kartun.red}>{value}</T>}
  </g>
);

export const Gerbang: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-230} y={-260} w={26} h={260} fill="#6E6A5E" />
    <Rect x={204} y={-260} w={26} h={260} fill="#6E6A5E" />
    <Rect x={-244} y={-292} w={488} h={40} fill="#8A8474" />
    <T x={0} y={-256} anchor="middle" size={30} weight={800} tracking={3} fill={kartun.paper}>GERBANG PABRIK</T>
  </g>
);

export const Kardus: React.FC<{ x: number; y: number; s?: number; rotate?: number }> = ({ x, y, s = 1, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <Rect x={-34} y={-58} w={68} h={58} fill="#C99A5F" stroke="#8A6238" strokeWidth={3} />
    <Rect x={-34} y={-58} w={68} h={12} fill="#B98A50" />
    <Path d="M-8 -58 L0 -70 L8 -58" stroke="#8A6238" strokeWidth={4} fill="none" />
  </g>
);

export const Crowd: React.FC<{ x: number; y: number; n?: number; s?: number; shirts?: string[]; opacity?: number }> = ({
  x, y, n = 4, s = 0.72, shirts = [kartun.shirt, kartun.shirtAlt, kartun.shirtAlt2, '#5C6A63'], opacity = 1,
}) => (
  <g opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => (
      <Karakter key={i} x={x + i * 78 * s} y={y + (i % 2) * 8} s={s} shirt={shirts[i % shirts.length]}
        face={i % 3 === 0 ? 'sad' : i % 3 === 1 ? 'neutral' : 'worried'} />
    ))}
  </g>
);

/* ------------------------------------------------------------------ teks */

export const AngkaBesar: React.FC<{ x: number; y: number; text: string; size?: number; fill?: string; opacity?: number; anchor?: 'start' | 'middle' | 'end' }> = ({
  x, y, text, size = 190, fill = kartun.line, opacity = 1, anchor = 'middle',
}) => (
  <g opacity={opacity}>
    <T x={x + 6} y={y + 8} anchor={anchor} size={size} weight={800} fill={kartun.paper} opacity={0.55}>{text}</T>
    <T x={x} y={y} anchor={anchor} size={size} weight={800} fill={fill}>{text}</T>
  </g>
);

/** Caption karaoke: satu baris, kata kunci diberi blok hijau (gaya video_reference.mp4). */
export const KaraokeCaption: React.FC<{ text: string; keyword?: string; y?: number; opacity?: number }> = ({
  text, keyword, y = 1642, opacity = 1,
}) => {
  const size = 46;
  const words = text.split(' ');
  const kw = keyword ? keyword.toLowerCase() : null;
  // lebar kasar per kata (Archivo 800 ~0.58 em)
  const cw = (c: string) => {
    if (c === ' ') return 0.30;
    if ('iljI.,:;·!\'|'.includes(c)) return 0.26;
    if ('mwMW'.includes(c)) return 0.84;
    if (c >= '0' && c <= '9') return 0.60;
    if (c === c.toUpperCase()) return 0.62;
    return 0.53;
  };
  let widths = words.map((w) => [...w].reduce((a, c) => a + cw(c), 0) * size * 1.16);
  let space = size * 0.34;
  let total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  // Jaga caption tetap di dalam layar: perkecil proporsional bila terlalu panjang.
  const MAXW = 940;
  if (total > MAXW) {
    const k = MAXW / total;
    widths = widths.map((w) => w * k);
    space *= k;
    total = MAXW;
  }
  let cursor = (W - total) / 2;
  return (
    <g opacity={opacity}>
      <Rect x={(W - total) / 2 - 26} y={y - size - 20} w={total + 52} h={size + 44} rx={18} fill="rgba(18,22,20,0.34)" />
      {words.map((w, i) => {
        const isKw = kw ? w.toLowerCase().replace(/[.,·;:]/g, '') === kw : false;
        const x = cursor;
        cursor += widths[i] + space;
        return (
          <g key={i}>
            {isKw && <Rect x={x - 8} y={y - size - 2} w={widths[i] + 16} h={size + 14} rx={10} fill={kartun.green} />}
            <T x={x} y={y} size={size} weight={800} fill={isKw ? '#0E2412' : kartun.paper}>{w}</T>
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ shell */

export const KartunShell: React.FC<{
  children: React.ReactNode; brand?: string; source?: string | null; vignette?: number;
}> = ({ children, brand = 'SUARA PUBLIK', source = null, vignette = 0.22 }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
    {children}
    <Rect x={0} y={0} w={W} h={H} fill="none" stroke="rgba(20,26,24,0.10)" strokeWidth={26} />
    <T x={64} y={96} size={26} weight={800} tracking={4} fill={kartun.line} opacity={0.62}>{brand}</T>
    <Rect x={64} y={112} w={86} h={5} fill={kartun.red} opacity={0.8} />
    <T x={W - 64} y={96} anchor="end" size={20} weight={700} tracking={2.6} fill={kartun.line} opacity={0.45}>ILUSTRASI</T>
    {source && <T x={64} y={H - 92} size={22} weight={600} fill={kartun.line} opacity={0.5}>{source}</T>}
    <g opacity={vignette} style={{ display: 'none' }}>{String(layout.video.width)}</g>
  </svg>
);

/* ------------------------------------------------------- objek konkret (hukum objek) */
export const KainRol: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Ellipse cx={0} cy={0} rx={62} ry={20} fill="#8C6E52" opacity={0.25} />
    <Rect x={-62} y={-78} w={124} h={78} rx={6} fill="#C9A25E" />
    <Ellipse cx={0} cy={-78} rx={62} ry={20} fill="#DFBB78" />
    <Ellipse cx={0} cy={-78} rx={20} ry={8} fill="#8C6E52" />
    <Path d="M-62 -40 q-40 26 -14 58" stroke="#C9A25E" strokeWidth={16} fill="none" linecap="round" />
  </g>
);

export const MesinJahit: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Ellipse cx={0} cy={0} rx={70} ry={16} fill="#8C6E52" opacity={0.25} />
    <Rect x={-70} y={-18} w={140} h={18} rx={4} fill="#6E6A5E" />
    <Path d="M-46 -18 L-46 -92 Q-46 -104 -32 -104 L34 -104 Q46 -104 46 -92 L46 -60 L16 -60 L16 -34 L-16 -34 L-16 -18 Z" fill="#B9AE9C" />
    <Rect x={-4} y={-34} w={8} h={22} fill="#6E6A5E" />
    <Circle cx={-30} cy={-86} r={9} fill="#3A4650" />
    <Circle cx={52} cy={-80} r={22} fill="none" stroke="#6E6A5E" strokeWidth={7} />
    <Rect x={16} y={-52} w={58} h={16} fill="#C9A25E" />
  </g>
);

export const Sepatu: React.FC<{ x: number; y: number; s?: number; flip?: boolean }> = ({ x, y, s = 1, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <Ellipse cx={0} cy={0} rx={66} ry={14} fill="#8C6E52" opacity={0.22} />
    <Path d="M-64 -16 L-64 -54 Q-64 -66 -50 -66 L-10 -66 Q6 -66 18 -50 L40 -30 Q58 -20 58 -16 Z" fill="#4A5560" />
    <Rect x={-66} y={-16} w={126} h={16} rx={7} fill="#EDE6D6" />
    <Path d="M-40 -46 l26 -8 M-36 -34 l26 -8" stroke="#EDE6D6" strokeWidth={6} linecap="round" />
  </g>
);

export const Surat: React.FC<{ x: number; y: number; s?: number; rotate?: number; stamp?: string }> = ({ x, y, s = 1, rotate = 0, stamp }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    <Rect x={-62} y={-84} w={124} h={168} fill="#F7F1E4" stroke="#B9AE9C" strokeWidth={4} />
    {[-56, -34, -12, 10, 32].map((ly, i) => (
      <Rect key={ly} x={-44} y={ly} w={i === 4 ? 46 : 88} h={7} rx={3} fill="#B9AE9C" opacity={0.75} />
    ))}
    <Path d="M20 50 q14 -18 22 0 q8 18 18 -6" stroke={kartun.line} strokeWidth={4} fill="none" linecap="round" />
    {stamp && (
      <g transform="rotate(-16 22 22)">
        <Rect x={-12} y={4} w={72} h={34} rx={6} fill="none" stroke={kartun.red} strokeWidth={4} opacity={0.85} />
        <T x={24} y={28} anchor="middle" size={19} weight={800} tracking={1} fill={kartun.red} opacity={0.85}>{stamp}</T>
      </g>
    )}
  </g>
);

export const Gerobak: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Ellipse cx={0} cy={0} rx={78} ry={14} fill="#8C6E52" opacity={0.22} />
    <Rect x={-70} y={-96} w={140} h={66} fill="#B96A45" />
    <Rect x={-70} y={-104} w={140} h={12} fill="#8B4A2F" />
    <Circle cx={-44} cy={-6} r={18} fill="#3A4650" />
    <Circle cx={44} cy={-6} r={18} fill="#3A4650" />
    <Rect x={-30} y={-136} w={54} h={34} rx={4} fill="#D9A544" />
  </g>
);
