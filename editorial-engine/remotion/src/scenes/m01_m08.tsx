import React from 'react';
import { useCurrentFrame, interpolate, Easing } from '../runtime';
import { Circle, Ellipse, Path, Rect, T } from '../illustration/primitives';
import {
  AngkaBesar, Crowd, Hills, Kardus, Karakter, KartunShell, KaraokeCaption, Pabrik,
  Papan, Sky, kartun,
} from '../illustration/cartoon';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const rise = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/* ------------------------------------------------------------- objek konkret */

/** Uang rupiah — dipakai saat narasi menyebut uang, gaji, sisa. */
export const Uang: React.FC<{ x: number; y: number; s?: number; n?: number; rotate?: number }> = ({ x, y, s = 1, n = 3, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(${i * 3} ${-i * 7}) rotate(${i % 2 ? 2 : -2})`}>
        <Rect x={-52} y={-30} w={104} h={30} rx={3} fill={i % 2 ? '#C9C096' : '#D8CFA6'} stroke="#9C9472" strokeWidth={2} />
        <Circle cx={-30} cy={-15} r={8} fill="none" stroke="#9C9472" strokeWidth={2} />
        <Rect x={-8} y={-22} w={44} h={4} fill="#9C9472" opacity={0.6} />
        <Rect x={-8} y={-12} w={30} h={4} fill="#9C9472" opacity={0.45} />
      </g>
    ))}
  </g>
);

/** Struk belanja — dipakai saat narasi menyebut belanja/habis. */
export const Struk: React.FC<{ x: number; y: number; s?: number; rotate?: number; n?: number }> = ({ x, y, s = 1, rotate = 0, n = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(${i * 14} ${-i * 10}) rotate(${i * 4 - 3})`}>
        <Path d="M-34 0 L-34 -96 L34 -96 L34 0 L22 6 L10 0 L-2 6 L-14 0 L-26 6 Z" fill="#F7F1E4" stroke="#B9AE9C" strokeWidth={3} />
        {[-82, -66, -50, -34, -18].map((ly, k) => (
          <Rect key={ly} x={-24} y={ly} w={k === 4 ? 26 : 48} h={5} fill="#B9AE9C" opacity={0.8} />
        ))}
      </g>
    ))}
  </g>
);

/** Tangga kelas — inti metafora episode. */
export const Tangga: React.FC<{
  x: number; y: number; s?: number; steps?: string[]; active?: number; colors?: string[];
}> = ({ x, y, s = 1, steps = ['MISKIN', 'RENTAN', 'ASPIRING', 'MENENGAH', 'ATAS'], active = 3, colors }) => {
  const w = 150, h = 96;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {steps.map((label, i) => {
        const c = colors?.[i] ?? (i === active ? kartun.red : i > active ? '#8B9682' : '#A79A82');
        const hh = h * (i + 1);
        return (
          <g key={label}>
            <Rect x={i * w} y={-hh} w={w} h={hh} fill={c} stroke="#6E6A5E" strokeWidth={4} />
            <T x={i * w + w / 2} y={-hh + 34} anchor="middle" size={21} weight={800} tracking={1.6} fill={kartun.paper}>{label}</T>
          </g>
        );
      })}
    </g>
  );
};

/** Grafik batang — dipakai untuk 14,5% -> 7%. */
export const GrafikBatang: React.FC<{
  x: number; y: number; s?: number; bars: { label: string; v: number; txt?: string }[]; max?: number; accent?: string;
}> = ({ x, y, s = 1, bars, max = 100, accent = kartun.red }) => {
  const bw = 90, gap = 60, H = 420;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={-70} y={-H - 40} w={bw * bars.length + gap * (bars.length - 1) + 140} h={4} fill="#8E8577" />
      {bars.map((b, i) => {
        const hh = (b.v / max) * H;
        return (
          <g key={b.label}>
            <Rect x={i * (bw + gap)} y={-hh} w={bw} h={hh} fill={i === bars.length - 1 ? accent : '#6F7A5A'} />
            <T x={i * (bw + gap) + bw / 2} y={-hh - 22} anchor="middle" size={40} weight={800} fill={kartun.line}>{b.txt ?? String(b.v)}</T>
            <T x={i * (bw + gap) + bw / 2} y={46} anchor="middle" size={24} weight={700} fill={kartun.line} opacity={0.75}>{b.label}</T>
          </g>
        );
      })}
    </g>
  );
};

/** Timbangan — dipakai untuk kontradiksi 81,5%. */
export const Timbangan: React.FC<{ x: number; y: number; s?: number; tilt?: number }> = ({ x, y, s = 1, tilt = 8 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-10} y={-60} w={20} h={60} fill="#6E6A5E" />
    <Rect x={-120} y={-16} w={240} h={16} rx={6} fill="#8E8577" />
    <g transform={`translate(0 -300) rotate(${tilt})`}>
      <Rect x={-260} y={-14} w={520} h={16} rx={8} fill="#8E8577" />
      <Circle cx={0} cy={-14} r={14} fill="#6E6A5E" />
      <Path d="M-250 0 L-250 70 M250 0 L250 70" stroke="#6E6A5E" strokeWidth={6} />
      <Rect x={-350} y={70} w={200} h={18} rx={6} fill="#A79A82" />
      <Rect x={150} y={70} w={200} h={18} rx={6} fill="#A79A82" />
    </g>
  </g>
);

/** Truk tambang — dipakai saat narasi menyebut tambang. */
export const Truk: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-60} y={-70} w={60} h={44} rx={6} fill="#8B9682" />
    <Rect x={-104} y={-56} w={46} h={30} rx={4} fill="#B9AE9C" />
    <Path d="M2 -74 L96 -74 L110 -30 L2 -30 Z" fill="#4A5560" />
    <Circle cx={-66} cy={-14} r={16} fill="#2B2B2B" />
    <Circle cx={62} cy={-14} r={16} fill="#2B2B2B" />
  </g>
);

/** Sawit — dipakai saat narasi menyebut sawit. */
export const Sawit: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-8} y={-140} w={16} h={140} fill="#8B6F4E" />
    <Path d="M0 -140 q-70 -30 -96 -4 q52 6 96 4 q44 2 96 -4 q-26 -26 -96 4 Z" fill="#6F7A5A" />
    <Circle cx={-16} cy={-120} r={18} fill="#C97B2E" />
    <Circle cx={18} cy={-104} r={14} fill="#B96A45" />
  </g>
);

/* ------------------------------------------------------------------ scenes */

const Sumber = 'AFU.id (20 Okt 2026) · Bank Dunia IEP Juni 2026 · Mandiri Institute · Liputan6/UOB · ilustrasi editorial';

/** m01 HOOK — paradoks: ekonomi naik, orang turun kelas. */
export const M01Hook: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const zoom = rise(f, 0, d, 1, 1.03);
  const cap = seg(f, d * 0.04, d * 0.12);
  const people = 1; // frame 0 = thumbnail: karakter wajib terlihat sejak frame pertama
  return (
    <KartunShell source={Sumber}>
      <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
        <Sky top="#E7DCC6" bottom="#F2E7CF" sun={false} />
        <Hills y={1150} />
        <AngkaBesar x={540} y={330} text="EKONOMI +5%" size={68} fill={kartun.line} />
        {/* grafik naik */}
        <Path d="M150 560 L380 430 L560 480 L860 300" stroke={kartun.greenDeep} strokeWidth={16} fill="none" strokeLinecap="round" />
        <Path d="M832 330 L878 296 L892 344" stroke={kartun.greenDeep} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <AngkaBesar x={540} y={860} text="11 JUTA" size={168} fill={kartun.red} />
        <T x={540} y={928} anchor="middle" size={48} weight={800} tracking={2} fill={kartun.line}>TURUN KELAS</T>
        <Tangga x={190} y={1520} s={0.86} active={3} />
        <g opacity={people}>
          <Karakter x={300} y={1520 - 96 * 3 * 0.86} s={0.6} shirt={kartun.shirtAlt} face="sad" pose="slump" />
          <Karakter x={520} y={1520 - 96 * 2 * 0.86} s={0.6} shirt="#4C6E8A" face="worried" pose="stand" />
          <Karakter x={790} y={1520} s={0.6} shirt={kartun.shirtAlt2} face="sad" pose="carry" />
        </g>
      </g>
      <KaraokeCaption text="ekonomi naik, orang turun kelas" keyword="turun" y={1642} opacity={cap} />
    </KartunShell>
  );
};

/** m02 STAKES — meja makan, struk, uang habis. */
export const M02Stakes: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.14), t2 = seg(f, d * 0.2, d * 0.4), t3 = seg(f, d * 0.45, d * 0.62);
  const cap = seg(f, d * 0.05, d * 0.14);
  return (
    <KartunShell source="ilustrasi editorial · pengeluaran rumah tangga">
      <Sky top="#E4DAC8" bottom="#F1E5CC" sun={false} />
      <Hills y={1240} />
      <Rect x={0} y={1240} w={1080} h={680} fill="#C3B296" />
      <g opacity={t1}>
        <T x={540} y={330} anchor="middle" size={44} weight={800} tracking={2} fill={kartun.line}>GAJI NAIK 8%</T>
        <T x={540} y={440} anchor="middle" size={88} weight={800} fill={kartun.red}>UANG HABIS</T>
      </g>
      {/* meja */}
      <Rect x={90} y={1120} w={900} h={34} fill="#B08A5E" />
      <Rect x={140} y={1154} w={26} h={150} fill="#9A774F" />
      <Rect x={914} y={1154} w={26} h={150} fill="#9A774F" />
      <g opacity={t2}><Struk x={250} y={1116} s={1.05} rotate={-6} n={3} /><Struk x={600} y={1116} s={0.95} rotate={5} n={2} /></g>
      <g opacity={t3}><Uang x={800} y={1100} s={1.05} n={3} rotate={4} /></g>
      <Karakter x={320} y={1500} s={0.92} shirt={kartun.shirtAlt} face="worried" pose="slump" />
      <Karakter x={770} y={1512} s={0.9} shirt="#4C6E8A" face="sad" pose="stand" flip />
      <KaraokeCaption text="gaji naik, sisa makin tipis" keyword="sisa" y={1660} opacity={cap} />
    </KartunShell>
  );
};

/** m03 CONTEXT — tangga kelas. */
export const M03Context: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.12), t2 = seg(f, d * 0.18, d * 0.34), t3 = seg(f, d * 0.5, d * 0.7);
  const cap = seg(f, d * 0.05, d * 0.14);
  const move = rise(f, d * 0.62, d * 0.82, 0, 1);
  return (
    <KartunShell source="definisi kelas menengah · BPS/Mandiri Institute · ilustrasi editorial">
      <Sky top="#E3E7D8" bottom="#F1E6CE" sun={false} />
      <Hills y={1300} />
      <g opacity={t1}><T x={540} y={300} anchor="middle" size={40} weight={800} tracking={2} fill={kartun.line}>KELAS MENENGAH BUKAN GELAR</T></g>
      <g opacity={t2}><T x={540} y={392} anchor="middle" size={76} weight={800} fill={kartun.line}>INI TANGGA</T></g>
      <g opacity={t3}>
        <Tangga x={70} y={1420} s={0.66} active={3} />
        <Karakter x={560} y={1420 - 96 * 4 * 0.66} s={0.66} shirt={kartun.shirtAlt} face="neutral" pose="stand" />
      </g>
      <g opacity={move}>
        <Path d="M760 1180 q40 90 -30 150" stroke={kartun.red} strokeWidth={10} fill="none" markerEnd="" strokeLinecap="round" />
        <T x={850} y={1300} anchor="middle" size={30} weight={800} fill={kartun.red}>SISA UANG</T>
        <T x={850} y={1348} anchor="middle" size={30} weight={800} fill={kartun.red}>HABIS</T>
      </g>
      <KaraokeCaption text="yang menentukan: sisa uang" keyword="sisa" y={1660} opacity={cap} />
    </KartunShell>
  );
};

/** m04 EVIDENCE — Bank Dunia 14,5% -> 7%. */
export const M04Evidence: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.12), t2 = seg(f, d * 0.18, d * 0.42), t3 = seg(f, d * 0.55, d * 0.72);
  const cap = seg(f, d * 0.05, d * 0.14);
  return (
    <KartunShell source="Bank Dunia, Indonesia Economic Prospects Juni 2026 · ilustrasi editorial">
      <Sky top="#DEE6D8" bottom="#EFE3C8" sun={false} />
      <Hills y={1290} />
      <g opacity={t1}><T x={540} y={320} anchor="middle" size={40} weight={800} tracking={1.6} fill={kartun.line}>PEKERJA BERPENDAPATAN MENENGAH</T></g>
      <g opacity={t2}><GrafikBatang x={200} y={1040} s={1} bars={[{ label: '2018', v: 14.5, txt: '14,5' }, { label: '2025', v: 7.3, txt: '7,3' }]} max={20} /></g>
      <g opacity={t3}>
        <Path d="M700 1080 q60 60 -20 110" stroke={kartun.red} strokeWidth={12} fill="none" strokeLinecap="round" />
        <T x={540} y={1180} anchor="middle" size={40} weight={800} fill={kartun.red}>UPAH RIIL −1 s.d. −2% / TAHUN</T>
      </g>
      <Karakter x={900} y={1470} s={0.8} shirt="#5C6A63" face="sad" pose="carry" />
      <Kardus x={956} y={1356} s={0.6} rotate={6} />
      <KaraokeCaption text="separuh hilang dalam 7 tahun" keyword="hilang" y={1662} opacity={cap} />
    </KartunShell>
  );
};

/** m05 EVIDENCE — 47,9 -> 46,7 juta; 50,4% penduduk. */
export const M05Evidence: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.12), t2 = seg(f, d * 0.2, d * 0.42), t3 = seg(f, d * 0.56, d * 0.74);
  const cap = seg(f, d * 0.05, d * 0.14);
  return (
    <KartunShell source="Mandiri Institute (2024-2025) · AFU.id 20 Okt 2026 · ilustrasi editorial">
      <Sky top="#E7DBCB" bottom="#F2E6CE" sun={false} />
      <Hills y={1260} />
      <g opacity={t1}><T x={540} y={300} anchor="middle" size={40} weight={800} tracking={1.8} fill={kartun.line}>KELAS MENENGAH INDONESIA</T></g>
      <g opacity={t2}>
        <AngkaBesar x={310} y={560} text="47,9 jt" size={92} fill={kartun.line} />
        <Path d="M470 556 L610 556" stroke={kartun.line} strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.8} />
        <Path d="M576 532 L612 556 L576 580" stroke={kartun.line} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
        <AngkaBesar x={790} y={560} text="46,7 jt" size={92} fill={kartun.red} />
        <T x={310} y={604} anchor="middle" size={24} weight={700} fill={kartun.line} opacity={0.7}>2024</T>
        <T x={790} y={604} anchor="middle" size={24} weight={700} fill={kartun.line} opacity={0.7}>2025</T>
      </g>
      <g opacity={t3}>
        <Tangga x={60} y={1330} s={0.56} active={2} colors={['#A79A82', '#A79A82', kartun.red, '#8B9682', '#8B9682']} />
        <T x={880} y={1130} anchor="middle" size={44} weight={800} fill={kartun.line}>50,4%</T>
        <T x={880} y={1182} anchor="middle" size={26} weight={700} tracking={1} fill={kartun.line} opacity={0.8}>PENDUDUK HAMPIR SAMPAI</T>
      </g>
      <Crowd x={640} y={1560} n={4} s={0.56} />
      <KaraokeCaption text="satu langkah dari jatuh" keyword="jatuh" y={1664} opacity={cap} />
    </KartunShell>
  );
};

/** m06 CONTRADICTION — 81,5% ditopang kelompok yang mengecil. */
export const M06Contradiction: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.12), t2 = seg(f, d * 0.2, d * 0.44), t3 = seg(f, d * 0.58, d * 0.76);
  const cap = seg(f, d * 0.05, d * 0.14);
  const tilt = rise(f, d * 0.44, d * 0.7, 0, 10);
  return (
    <KartunShell source="UOB Indonesia via Liputan6, 4 Mar 2026 · ilustrasi editorial">
      <Sky top="#EADCC8" bottom="#F3E4C9" sun={false} />
      <Hills y={1320} />
      <g opacity={t1}><T x={540} y={300} anchor="middle" size={40} weight={800} tracking={1.8} fill={kartun.line}>MEREKA YANG MENYUSUT</T></g>
      <g opacity={t2}><T x={540} y={430} anchor="middle" size={112} weight={800} fill={kartun.red}>81,5%</T>
        <T x={540} y={486} anchor="middle" size={30} weight={700} tracking={1.4} fill={kartun.line} opacity={0.8}>DARI EKONOMI</T></g>
      <g opacity={t3}>
        <Timbangan x={540} y={1300} s={0.72} tilt={tilt} />
        <Rect x={230} y={1240} w={150} h={120} fill="#8B9682" />
        <T x={305} y={1320} anchor="middle" size={40} weight={800} fill={kartun.paper}>?</T>
        <Karakter x={860} y={1520} s={0.84} shirt={kartun.shirtAlt} face="worried" pose="pointLeft" flip />
      </g>
      <KaraokeCaption text="penopang mengecil. ke mana?" keyword="ke mana" y={1662} opacity={cap} />
    </KartunShell>
  );
};

/** m07 ANALYSIS — modal vs gaji. */
export const M07Analysis: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.12), t2 = seg(f, d * 0.18, d * 0.44), t3 = seg(f, d * 0.56, d * 0.78);
  const cap = seg(f, d * 0.05, d * 0.14);
  return (
    <KartunShell source="struktur pertumbuhan: tambang, sawit, hilirisasi, belanja negara · ilustrasi editorial">
      <Sky top="#DEE6D8" bottom="#EFE3C8" sun={false} />
      <Hills y={1230} />
      <g opacity={t1}>
        <Truk x={200} y={1330} s={1.0} />
        <Sawit x={520} y={1330} s={1.0} />
        <Pabrik x={830} y={1330} s={0.6} />
      </g>
      <g opacity={t2}>
        <T x={540} y={330} anchor="middle" size={42} weight={800} tracking={1.6} fill={kartun.line}>UANG BARU: MODAL, BUKAN GAJI</T>
      </g>
      <g opacity={t3}>
        <Path d="M400 620 q60 -70 150 -70" stroke={kartun.greenDeep} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Rect x={560} y={500} w={150} h={110} rx={8} fill="#8E8577" />
        <T x={635} y={572} anchor="middle" size={34} weight={800} fill={kartun.paper}>MESIN</T>
        <Path d="M400 720 q60 60 150 60" stroke={kartun.red} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.9} />
        <Rect x={560} y={730} w={150} h={100} rx={8} fill="#D9C9A6" stroke="#8A7C63" strokeWidth={4} />
        <T x={635} y={792} anchor="middle" size={30} weight={800} fill="#6B6350">GAJI</T>
        <Karakter x={230} y={820} s={0.7} shirt={kartun.shirtAlt2} face="worried" pose="pointRight" />
      </g>
      <KaraokeCaption text="untung ke mesin, bukan upah" keyword="upah" y={1662} opacity={cap} />
    </KartunShell>
  );
};

/** m08 CLOSING — tangga tanpa anak tangga baru + CTA. */
export const M08Closing: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const l1 = seg(f, 0, d * 0.18), l2 = seg(f, d * 0.22, d * 0.42), cta = seg(f, d * 0.55, d * 0.68);
  const cap = seg(f, d * 0.05, d * 0.14);
  return (
    <KartunShell source="AFU.id · Bank Dunia IEP Juni 2026 · Mandiri Institute · interpretasi Suara Publik">
      <Sky top="#E4D6C2" bottom="#F0E2C6" sun={false} />
      <Hills y={1300} />
      <g opacity={l1}>
        <T x={540} y={470} anchor="middle" size={78} weight={800} fill={kartun.line}>BUKAN KAMU</T>
        <T x={540} y={566} anchor="middle" size={78} weight={800} fill={kartun.line}>YANG GAGAL NAIK</T>
      </g>
      <g opacity={l2}>
        <T x={540} y={700} anchor="middle" size={64} weight={800} fill={kartun.red}>TANGGANYA YANG</T>
        <T x={540} y={772} anchor="middle" size={64} weight={800} fill={kartun.red}>TIDAK DITAMBAH</T>
      </g>
      <Tangga x={90} y={1400} s={0.6} active={3} />
      <Karakter x={560} y={1400 - 96 * 4 * 0.6} s={0.62} shirt={kartun.shirtAlt} face="neutral" pose="stand" />
      <Karakter x={720} y={1400 - 96 * 3 * 0.6} s={0.62} shirt="#4C6E8A" face="worried" pose="stand" />
      <g opacity={cta}>
        <T x={880} y={1200} anchor="middle" size={26} weight={800} tracking={2.6} fill={kartun.line} opacity={0.75}>KALAU INI BERGUNA</T>
        <T x={880} y={1258} anchor="middle" size={38} weight={800} fill={kartun.red}>simpan · bagikan · ikuti</T>
      </g>
      <KaraokeCaption text="tangganya yang tidak ditambah" keyword="tidak" y={1690} opacity={cap} />
    </KartunShell>
  );
};
