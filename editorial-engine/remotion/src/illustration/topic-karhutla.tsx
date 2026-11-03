/**
 * PROPS & ENVIRONMENTS — misi `karhutla-angka-turun-2026`
 * -------------------------------------------------------
 * Aturan yang dipegang:
 *   - api tidak pernah digambar sebagai kobaran. Yang terlihat adalah BARA: titik pijar
 *     di dalam lapisan tanah. Ini bukan penghalusan estetis, ini inti argumennya —
 *     api karhutla 2026 hidup di bawah permukaan, bukan di puncak pohon.
 *   - satu ruang konkret per scene: potongan tanah gambut (h01, h04, h07), papan rekap
 *     posko (h02), dinding data (h03), kelas (h05), papan penyidikan (h06).
 *   - tidak ada logo institusi, wajah nyata, atau foto asap.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { Circle, Ellipse, Path, Rect, T } from './primitives';

const rnd = (i: number) => {
  const x = Math.sin(i * 7.311 + 1.729) * 43758.5453;
  return x - Math.floor(x);
};

const W = 1080;

/* ---------------------------------------------------------------- 0. lapisan gelap */

export const ScrimK: React.FC<{
  y: number;
  h: number;
  from?: number;
  to?: number;
  color?: string;
  up?: boolean;
}> = ({ y, h, from = 0.9, to = 0, color = palette.ink, up = false }) => {
  const id = `kar-scrim-${Math.round(y)}-${Math.round(h)}-${up ? 'u' : 'd'}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1={up ? '1' : '0'} x2="0" y2={up ? '0' : '1'}>
          <stop offset="0%" stopColor={color} stopOpacity={from} />
          <stop offset="100%" stopColor={color} stopOpacity={to} />
        </linearGradient>
      </defs>
      <rect x={0} y={y} width={W} height={h} fill={`url(#${id})`} />
    </g>
  );
};

/* ---------------------------------------------------------------- 1. langit berkabut */

export const LangitAsap: React.FC<{ h?: number; haze?: number; horizon?: number }> = ({
  h = 1120,
  haze = 1,
  horizon = 0.55,
}) => (
  <g>
    <Rect x={0} y={0} w={W} h={h} fill="#141813" />
    <Rect x={0} y={0} w={W} h={Math.round(h * 0.62)} fill="#1B2019" />
    {/* pita kabut: lebar, tipis, tidak pernah berbentuk asap rokok */}
    {Array.from({ length: 7 }).map((_, i) => (
      <Ellipse
        key={i}
        cx={180 + rnd(i + 2) * 760}
        cy={220 + i * 132}
        rx={320 + rnd(i + 5) * 260}
        ry={26 + rnd(i + 9) * 16}
        fill={palette.paperDim}
        opacity={(0.028 + rnd(i + 11) * 0.022) * haze * (1 - i * 0.06)}
      />
    ))}
    {/* horizon hangat yang tersisa — cahaya kota kecil di kejauhan */}
    <Rect x={0} y={h - 150} w={W} h={150} fill={palette.brick} opacity={0.05 * horizon} />
    <Rect x={0} y={h - 3} w={W} h={3} fill={palette.paper} opacity={0.05} />
  </g>
);

/* ---------------------------------------------------------------- 2. tanah gambut */

/** Titik bara. Satu-satunya sumber cahaya di bawah garis tanah. */
export const Bara: React.FC<{ x: number; y: number; r?: number; p?: number; tone?: string }> = ({
  x,
  y,
  r = 22,
  p = 1,
  tone = palette.brickLight,
}) => {
  const id = `kar-bara-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g opacity={0.25 + 0.75 * p}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={tone} stopOpacity={0.85 * p} />
          <stop offset="55%" stopColor={palette.brick} stopOpacity={0.35 * p} />
          <stop offset="100%" stopColor={palette.brickDeep} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 3.4} fill={`url(#${id})`} />
      <ellipse cx={x} cy={y} rx={r} ry={r * 0.62} fill={tone} opacity={0.55 + 0.4 * p} />
    </g>
  );
};

export const TanahGambut: React.FC<{
  surfaceY?: number;
  depth?: number;
  ember?: number;
  char?: number;
  embers?: number;
  /** denyut bara: 0..1, dipakai untuk animasi tanpa loop mekanis */
  beat?: number;
}> = ({ surfaceY = 1120, depth = 800, ember = 1, char = 1, embers = 7, beat = 0 }) => {
  const bottom = Math.min(1920, surfaceY + depth);
  const layers = [
    { y: surfaceY, h: 120, fill: '#2A2118' },
    { y: surfaceY + 120, h: 210, fill: '#221B12' },
    { y: surfaceY + 330, h: bottom - (surfaceY + 330), fill: '#191510' },
  ];
  return (
    <g>
      {layers.map((l, i) => (
        <Rect key={i} x={0} y={l.y} w={W} h={Math.max(0, l.h)} fill={l.fill} />
      ))}
      {/* serat gambut: garis pendek, tidak teratur, memberi tekstur tanpa noise */}
      {Array.from({ length: 90 }).map((_, i) => {
        const y = surfaceY + 40 + rnd(i + 1) * Math.max(40, bottom - surfaceY - 70);
        const x = rnd(i + 31) * W;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            w={18 + rnd(i + 7) * 54}
            h={2}
            fill={palette.paperDim}
            opacity={0.04 + rnd(i + 13) * 0.05}
          />
        );
      })}
      {/* abu di permukaan */}
      {Array.from({ length: 26 }).map((_, i) => (
        <Ellipse
          key={i}
          cx={rnd(i + 41) * W}
          cy={surfaceY - 4 + rnd(i + 53) * 10}
          rx={14 + rnd(i + 61) * 34}
          ry={3}
          fill={palette.paper}
          opacity={0.07 * char}
        />
      ))}
      {/* garis permukaan: satu-satunya garis terang di frame */}
      <Rect x={0} y={surfaceY - 2} w={W} h={3} fill={palette.paper} opacity={0.12 + 0.1 * char} />
      {/* bara di dalam lapisan */}
      {Array.from({ length: embers }).map((_, i) => {
        const x = 90 + rnd(i + 5) * 900;
        const y = surfaceY + 150 + rnd(i + 17) * Math.max(60, depth - 240);
        const pulse = 0.55 + 0.45 * Math.sin(beat * Math.PI * 2 + i * 1.7);
        return <Bara key={i} x={x} y={y} r={14 + rnd(i + 23) * 14} p={ember * pulse} />;
      })}
    </g>
  );
};

/** Tunggul & batang hangus. Silhouette saja — tidak ada daun yang tersisa. */
export const PohonHangus: React.FC<{ x: number; y: number; s?: number; lean?: number }> = ({
  x,
  y,
  s = 1,
  lean = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${lean})`}>
    <Path d="M -14 0 L -9 -180 L -4 -250 L 6 -250 L 10 -180 L 15 0 Z" fill="#100D0A" />
    <Path d="M -6 -168 L -58 -214 L -50 -222 L 2 -186 Z" fill="#100D0A" />
    <Path d="M 8 -196 L 52 -246 L 60 -238 L 14 -180 Z" fill="#100D0A" />
    <Path d="M 3 -246 L -22 -296 L -14 -302 L 10 -258 Z" fill="#100D0A" />
    <Ellipse cx={0} cy={2} rx={34} ry={7} fill={palette.ink} opacity={0.5} />
  </g>
);

/** Kepulan asap dari permukaan: elips bertumpuk yang memudar ke atas. */
export const AsapKepul: React.FC<{ x: number; y: number; s?: number; p?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  p = 1,
  opacity = 0.16,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity * p}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Ellipse
        key={i}
        cx={Math.sin(i * 1.3 + 0.4) * (18 + i * 12)}
        cy={-36 - i * 96}
        rx={96 + i * 44}
        ry={24 + i * 8}
        fill={palette.paperDim}
        opacity={0.5 - i * 0.085}
      />
    ))}
  </g>
);

/** Hujan: garis tipis, bukan partikel acak. */
export const Hujan: React.FC<{ y0: number; y1: number; p?: number; n?: number; opacity?: number }> = ({
  y0,
  y1,
  p = 1,
  n = 46,
  opacity = 0.35,
}) => (
  <g opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => {
      const x = rnd(i + 3) * W;
      const span = y1 - y0;
      const y = y0 + ((rnd(i + 71) + p * 1.4) % 1) * span;
      return (
        <Rect key={i} x={x} y={y} w={2} h={26 + rnd(i + 9) * 30} fill={palette.coolLight} opacity={0.18 + rnd(i + 13) * 0.3} />
      );
    })}
  </g>
);

/* ---------------------------------------------------------------- 3. papan rekap */

export type RekapRow = { label: string; value: string; trend: string; hot?: boolean };

export const PapanRekap: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub: string;
  rows: RekapRow[];
  p?: number;
}> = ({ x, y, w = 920, h = 560, title, sub, rows, p = 1 }) => (
  <g>
    <Rect x={x + 8} y={y + 10} w={w} h={h} fill={palette.ink} opacity={0.45} />
    <Rect x={x} y={y} w={w} h={h} fill="#E8DEC9" />
    <Rect x={x} y={y} w={w} h={6} fill={palette.mustard} opacity={0.8} />
    <T x={x + 34} y={y + 56} size={20} weight={700} tracking={3.2} fill={palette.ink} opacity={0.62}>
      {title}
    </T>
    <T x={x + 34} y={y + 88} size={17} weight={500} tracking={0.6} fill={palette.ink} opacity={0.45}>
      {sub}
    </T>
    {rows.map((row, i) => {
      const ry = y + 128 + i * 104;
      const reveal = Math.max(0, Math.min(1, (p - i * 0.16) / 0.34));
      if (reveal <= 0) return null;
      return (
        <g key={row.label} opacity={reveal}>
          <Rect x={x + 34} y={ry} w={w - 68} h={2} fill={palette.ink} opacity={0.12} />
          <T x={x + 34} y={ry + 52} size={22} weight={600} tracking={1.4} fill={palette.ink} opacity={0.7}>
            {row.label}
          </T>
          <T x={x + w - 96} y={ry + 62} size={row.hot ? 54 : 40} family={t.display} fill={row.hot ? palette.brickDeep : palette.ink} anchor="end" tracking={-1}>
            {row.value}
          </T>
          <T x={x + w - 34} y={ry + 62} size={20} weight={700} fill={row.hot ? palette.brick : palette.oliveDeep} anchor="end" opacity={0.85}>
            {row.trend}
          </T>
        </g>
      );
    })}
  </g>
);

/** Peta blok wilayah — bentuk abstrak, bukan peta administratif. */
export const PetaWilayah: React.FC<{ x: number; y: number; s?: number; lit?: number }> = ({ x, y, s = 1, lit = 0.4 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.85}>
    <Rect x={0} y={0} w={300} h={230} fill="#1B2019" />
    <Rect x={0} y={0} w={300} h={230} fill="none" stroke={palette.paper} strokeWidth={1.5} opacity={0.18} />
    {Array.from({ length: 24 }).map((_, i) => {
      const c = i % 6;
      const r = Math.floor(i / 6);
      const on = i === 8 || i === 9 || i === 14;
      return (
        <Rect
          key={i}
          x={18 + c * 46}
          y={18 + r * 50}
          w={38}
          h={42}
          fill={on ? palette.brick : palette.sage}
          opacity={on ? 0.35 + 0.5 * lit : 0.16}
        />
      );
    })}
    <T x={16} y={214} size={14} weight={700} tracking={2.4} fill={palette.paper} opacity={0.5}>
      PETA ILUSTRASI
    </T>
  </g>
);

/* ---------------------------------------------------------------- 4. batang pembanding */

export const BarBanding: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  label: string;
  value: string;
  note: string;
  fill?: string;
  ember?: number;
  emberP?: number;
  beat?: number;
}> = ({ x, y, w, h, p, label, value, note, fill = palette.sageDeep, ember = 0, emberP = 0, beat = 0 }) => {
  const fill_ = Math.max(0, Math.min(1, p));
  return (
    <g>
      <T x={x} y={y - 22} size={19} weight={700} tracking={3} fill={palette.sage} opacity={0.85}>
        {label}
      </T>
      <Rect x={x} y={y} w={w} h={h} fill={palette.paper} opacity={0.07} />
      <Rect x={x} y={y} w={w * fill_} h={h} fill={fill} opacity={0.9} />
      {ember > 0 && (
        <Rect x={x + w * (1 - ember) * fill_} y={y} w={w * ember * fill_} h={h} fill={palette.brick} opacity={0.5 + 0.3 * emberP} />
      )}
      {ember > 0 &&
        Array.from({ length: 5 }).map((_, i) => (
          <Bara
            key={i}
            x={x + w * (1 - ember) * fill_ + 40 + i * ((w * ember * fill_) / 5.6)}
            y={y + h / 2}
            r={7 + i * 1.5}
            p={emberP * (0.6 + 0.4 * Math.sin(beat * Math.PI * 2 + i))}
          />
        ))}
      <T x={x + w * fill_ + 16} y={y + h / 2 + 14} size={34} family={t.display} fill={palette.paper} opacity={fill_ > 0.4 ? 1 : 0} tracking={-1}>
        {value}
      </T>
      <T x={x} y={y + h + 32} size={18} weight={500} fill={palette.paper} opacity={0.5}>
        {note}
      </T>
    </g>
  );
};

/** Garis waktu tipis dengan dua penanda. */
export const GarisWaktu: React.FC<{ y: number; x0: number; x1: number; p?: number; marks?: { at: number; label: string }[] }> = ({
  y,
  x0,
  x1,
  p = 1,
  marks = [],
}) => (
  <g opacity={0.7}>
    <Rect x={x0} y={y} w={(x1 - x0) * Math.max(0, Math.min(1, p))} h={2} fill={palette.paper} opacity={0.35} />
    {marks.map((m) => (
      <g key={m.label} opacity={p > m.at ? 1 : 0}>
        <Rect x={x0 + (x1 - x0) * m.at - 1} y={y - 8} w={2} h={18} fill={palette.mustard} />
        <T x={x0 + (x1 - x0) * m.at} y={y + 40} size={16} weight={600} tracking={1.6} fill={palette.mustard} anchor="middle" opacity={0.8}>
          {m.label}
        </T>
      </g>
    ))}
  </g>
);

/* ---------------------------------------------------------------- 5. papan penyidikan */

export const PapanInvestigasi: React.FC<{ x: number; y: number; w?: number; h?: number }> = ({
  x,
  y,
  w = 960,
  h = 620,
}) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill="#1C1F19" />
    <Rect x={x} y={y} w={w} h={h} fill="none" stroke={palette.paper} strokeWidth={2} opacity={0.12} />
    {Array.from({ length: 22 }).map((_, i) => (
      <Rect key={i} x={x + rnd(i + 3) * w} y={y + rnd(i + 29) * h} w={1.6} h={1.6} fill={palette.paper} opacity={0.12} />
    ))}
  </g>
);

export const KartuInvestigasi: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  value: string;
  note?: string;
  rotate?: number;
  p?: number;
  accent?: string;
}> = ({ x, y, w = 300, h = 190, label, value, note, rotate = 0, p = 1, accent = palette.mustard }) => (
  <g opacity={p} transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${rotate}) translate(${-w / 2} ${-h / 2})`}>
    <Rect x={6} y={9} w={w} h={h} fill={palette.ink} opacity={0.5} />
    <Rect x={0} y={0} w={w} h={h} fill="#E6DCC7" />
    <Rect x={0} y={0} w={w} h={5} fill={accent} />
    <T x={20} y={40} size={15} weight={700} tracking={2.4} fill={palette.ink} opacity={0.6}>
      {label}
    </T>
    <T x={20} y={h / 2 + 26} size={46} family={t.display} fill={palette.ink} tracking={-1.4}>
      {value}
    </T>
    {note && (
      <T x={20} y={h - 20} size={15} weight={500} fill={palette.ink} opacity={0.55}>
        {note}
      </T>
    )}
    <Circle cx={w - 22} cy={22} r={7} fill={palette.brick} opacity={0.9} />
  </g>
);

/** Benang penghubung antar kartu. */
export const Benang: React.FC<{ x1: number; y1: number; x2: number; y2: number; p?: number }> = ({ x1, y1, x2, y2, p = 1 }) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + 26;
  // gambar benang sebagai bagian kurva: titik ujung dihitung pada t = p
  const t = Math.max(0, Math.min(1, p));
  const ex = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
  const ey = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
  return (
    <Path
      d={`M ${x1} ${y1} Q ${mx} ${my} ${ex} ${ey}`}
      stroke={palette.brickLight}
      strokeWidth={1.6}
      opacity={0.35}
      fill="none"
    />
  );
};

/* ---------------------------------------------------------------- 6. kelas berkabut */

export const RuangKelasKabut: React.FC<{ kabut?: number; p?: number; curtains?: number }> = ({
  kabut = 0.6,
  p = 1,
}) => (
  <g>
    {/* dinding & lantai */}
    <Rect x={0} y={0} w={W} h={1180} fill="#242C26" />
    <Rect x={0} y={1180} w={W} h={740} fill="#1A1F1A" />
    <Rect x={0} y={1176} w={W} h={4} fill={palette.paper} opacity={0.07} />
    {/* papan tulis: lebih rendah supaya headline duduk di dinding, bukan di papan */}
    <Rect x={88} y={700} w={470} h={250} fill="#1D2922" />
    <Rect x={88} y={700} w={470} h={250} fill="none" stroke={palette.paperShadow} strokeWidth={3} opacity={0.22} />
    <Rect x={88} y={946} w={470} h={10} fill="#39413A" />
    {/* dua jendela tinggi: cahaya luar memutih karena kabut */}
    {[664, 866].map((x, i) => (
      <g key={x}>
        <Rect x={x} y={560} w={150} h={400} fill={palette.coolLight} opacity={0.2 - i * 0.03} />
        <Rect x={x} y={560} w={150} h={400} fill="none" stroke={palette.paper} strokeWidth={3} opacity={0.26} />
        <Rect x={x + 72} y={560} w={3} h={400} fill={palette.paper} opacity={0.2} />
        <Rect x={x} y={742} w={150} h={3} fill={palette.paper} opacity={0.2} />
      </g>
    ))}
    {/* kabut: pita mendatar tipis, bukan elips besar */}
    <g opacity={kabut}>
      <defs>
        <linearGradient id="kar-kelas-kabut" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={palette.paperDim} stopOpacity={0.22 * p} />
          <stop offset="55%" stopColor={palette.paperDim} stopOpacity={0.12 * p} />
          <stop offset="100%" stopColor={palette.paperDim} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={860} width={W} height={640} fill="url(#kar-kelas-kabut)" />
    </g>
  </g>
);

/** Meja + kursi kelas, digambar sebagai satu unit supaya tidak pernah "melayang". */
export const MejaKelas: React.FC<{ x: number; y: number; s?: number; bag?: number; mask?: number; tone?: string }> = ({
  x,
  y,
  s = 1,
  bag = 0,
  mask = 0,
  tone = '#3C463B',
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* kursi di belakang meja: sandaran rendah, duduk di bawah garis meja */}
    <Rect x={122} y={-64} w={86} h={9} fill={palette.tealLight} opacity={0.5} />
    <Rect x={128} y={-60} w={7} h={46} fill={palette.tealLight} opacity={0.34} />
    <Rect x={196} y={-60} w={7} h={46} fill={palette.tealLight} opacity={0.34} />
    <Rect x={96} y={-18} w={138} h={11} fill={palette.tealLight} opacity={0.55} />
    <Rect x={102} y={-7} w={7} h={46} fill={palette.tealLight} opacity={0.34} />
    <Rect x={221} y={-7} w={7} h={46} fill={palette.tealLight} opacity={0.34} />
    {/* meja */}
    <Rect x={0} y={0} w={240} h={16} fill={tone} />
    <Rect x={0} y={16} w={240} h={4} fill={palette.ink} opacity={0.35} />
    <Rect x={18} y={20} w={9} h={96} fill={tone} opacity={0.85} />
    <Rect x={213} y={20} w={9} h={96} fill={tone} opacity={0.85} />
    <Rect x={0} y={116} w={240} h={5} fill={palette.ink} opacity={0.3} />
    {bag > 0 && (
      <g opacity={bag}>
        <Rect x={252} y={-26} w={54} h={62} r={7} fill="#8E4A32" />
        <Rect x={252} y={-26} w={54} h={10} r={5} fill="#6E3726" />
        <Rect x={268} y={-8} w={22} h={8} r={3} fill="#C97A4F" opacity={0.8} />
      </g>
    )}
    {mask > 0 && <g opacity={mask}><Masker x={118} y={-6} s={0.95} rot={-8} /></g>}
  </g>
);

export const Masker: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = -12 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
    <Path d="M -40 -18 q 40 -16 80 0 q 6 30 -8 44 q -32 14 -64 0 q -14 -14 -8 -44 Z" fill="#DCE3DC" />
    <Path d="M -40 -18 q 40 -16 80 0" stroke={palette.ink} strokeWidth={2} fill="none" opacity={0.25} />
    <Path d="M -40 -10 l -26 -16 M 40 -10 l 26 -16" stroke="#DCE3DC" strokeWidth={4} fill="none" opacity={0.8} />
    <Path d="M -26 4 q 26 8 52 0" stroke={palette.ink} strokeWidth={1.6} fill="none" opacity={0.18} />
  </g>
);

/** Label kecil dengan garis penunjuk — untuk menamai lapisan tanpa paragraf. */
export const LabelTunjuk: React.FC<{ x: number; y: number; text: string; dir?: 1 | -1; len?: number; p?: number }> = ({
  x,
  y,
  text,
  dir = 1,
  len = 90,
  p = 1,
}) => (
  <g opacity={p}>
    <Rect x={dir === 1 ? x : x - len} y={y} w={len} h={1.6} fill={palette.mustard} opacity={0.6} />
    <Circle cx={x} cy={y} r={4} fill={palette.mustard} />
    <T x={dir === 1 ? x + 12 : x - len - 12} y={y - 10} size={16} weight={700} tracking={2.2} fill={palette.mustard} anchor={dir === 1 ? 'start' : 'end'}>
      {text}
    </T>
  </g>
);
