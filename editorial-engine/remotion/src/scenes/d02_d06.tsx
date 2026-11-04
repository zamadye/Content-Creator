import React from 'react';
import { useCurrentFrame, interpolate, Easing } from '../runtime';
import { Circle, Ellipse, Path, Rect, T } from '../illustration/primitives';
import {
  AngkaBesar, Crowd, Gerbang, Gerobak, Hills, KainRol, Kardus, Karakter, KartunShell,
  KaraokeCaption, MesinJahit, Pabrik, Papan, Sepatu, Sky, Surat, kartun,
} from '../illustration/cartoon';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const Sumber = 'Kemnaker (Satu Data, 4 Nov 2026) · Bloomberg Technoz · KSPI · ilustrasi editorial';

/* meja loket */
const Meja: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 560 }) => (
  <g transform={`translate(${x} ${y})`}>
    <Rect x={-w / 2} y={-90} w={w} h={90} fill="#B08A5E" />
    <Rect x={-w / 2} y={-104} w={w} h={18} fill="#C99A6B" />
    <Rect x={-w / 2 + 26} y={-90} w={22} h={90} fill="#9A774F" />
    <Rect x={w / 2 - 48} y={-90} w={22} h={90} fill="#9A774F" />
  </g>
);

/* tumpukan berkas */
const Berkas: React.FC<{ x: number; y: number; n?: number }> = ({ x, y, n = 4 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: n }).map((_, i) => (
      <Rect key={i} x={-40 + (i % 2) * 4} y={-18 * (i + 1)} w={80} h={18} fill={i % 2 ? '#F2EADA' : '#E3D8C2'} stroke="#B9AE9C" strokeWidth={2} />
    ))}
  </g>
);

/* kontainer */
const Kontainer: React.FC<{ x: number; y: number; s?: number; fill?: string }> = ({ x, y, s = 1, fill = '#8B9682' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rect x={-90} y={-70} w={180} h={70} fill={fill} />
    <g opacity={0.5}>{[0, 1, 2, 3, 4].map((i) => <Rect key={i} x={-80 + i * 36} y={-66} w={6} h={62} fill="#5F6A58" />)}</g>
  </g>
);

/* --------------------------------------------------------------- d02 */
export const D02Context: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.16), t2 = seg(f, d * 0.2, d * 0.34), t3 = seg(f, d * 0.42, d * 0.56);
  const cap = seg(f, d * 0.1, d * 0.2);
  return (
    <KartunShell source={Sumber}>
      <Sky top="#E3E7D8" bottom="#F1E6CE" sun />
      <Hills y={1180} />
      <Rect x={0} y={1180} w={1080} h={20} fill="#B8A98E" />
      <T x={540} y={430} anchor="middle" size={44} weight={800} tracking={2} fill={kartun.line} opacity={0.75 * t1}>SETIAP PHK WAJIB DILAPORKAN</T>
      <g opacity={t2}>
        <T x={540} y={620} anchor="middle" size={92} weight={800} fill={kartun.red}>YANG LAPOR</T>
        <T x={540} y={726} anchor="middle" size={92} weight={800} fill={kartun.line}>YANG DIHITUNG</T>
      </g>
      <Meja x={540} y={1180} w={620} />
      <Karakter x={540} y={1094} s={0.86} shirt="#4C6E8A" face="neutral" pose="slump" />
      <Berkas x={700} y={1090} n={4} />
      <Papan x={902} y={1150} w={262} h={146} label="SATU DATA" value="72.336" rotate={3} />
      <g opacity={t3}>
        <Karakter x={700} y={1372} s={0.78} shirt={kartun.shirtAlt} face="worried" pose="carry" />
        <Kardus x={756} y={1262} s={0.66} rotate={6} />
      </g>
      <Crowd x={60} y={1352} n={3} s={0.58} />
      <KaraokeCaption text="dihitung hanya yang melapor" keyword="melapor" y={1642} opacity={cap} />
    </KartunShell>
  );
};

/* --------------------------------------------------------------- d03 */
export const D03Conflict: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const a1 = seg(f, d * 0.04, d * 0.18), a2 = seg(f, d * 0.22, d * 0.36), a3 = seg(f, d * 0.4, d * 0.54);
  const cap = seg(f, d * 0.08, d * 0.18);
  const shake = Math.sin(f / 2.4) * 4 * seg(f, d * 0.55, d * 0.7);
  return (
    <KartunShell source="KSPI (3 Nov 2026) · Kemnaker · Bloomberg Technoz">
      <Sky top="#EADCC8" bottom="#F3E4C9" sun={false} />
      <Hills y={1240} />
      <T x={540} y={330} anchor="middle" size={46} weight={800} tracking={2} fill={kartun.line} opacity={0.7}>SATU PERIODE, TIGA CATATAN</T>
      <g transform={`translate(${shake} 0)`}>
        <Papan x={250} y={800} w={330} h={190} label="KSPI · JUNI" value="70 RIBU" rotate={-4} />
        <Papan x={820} y={780} w={330} h={190} label="VERSI KSPI" value="83 RIBU" rotate={5} accent="#EFE2CB" />
        <Papan x={540} y={1120} w={400} h={200} label="PROYEKSI AKHIR 2026" value=">90 RIBU" rotate={-1.5} accent="#E9DCC4" />
      </g>
      <g opacity={a1}><Karakter x={170} y={1470} s={0.9} shirt={kartun.shirtAlt} face="angry" pose="pointRight" moustache /></g>
      <g opacity={a2}><Karakter x={910} y={1470} s={0.9} shirt="#4C6E8A" face="worried" pose="pointLeft" flip /></g>
      <g opacity={a3}><Karakter x={540} y={1560} s={0.66} shirt={kartun.shirtAlt2} face="shock" pose="armsUp" /></g>
      <KaraokeCaption text="beda sumber, beda angka" keyword="beda" y={1642} opacity={cap} />
    </KartunShell>
  );
};

/* --------------------------------------------------------------- d04 */
export const D04Analysis: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.16), t2 = seg(f, d * 0.22, d * 0.4), t3 = seg(f, d * 0.46, d * 0.62);
  const arrow = seg(f, d * 0.3, d * 0.48);
  const cap = seg(f, d * 0.1, d * 0.2);
  const drop = interpolate(f, [0, d], [0, 46], { extrapolateRight: 'clamp' });
  return (
    <KartunShell source="Kemnaker · sektor padat karya berorientasi ekspor · ilustrasi editorial">
      <Sky top="#DEE6D8" bottom="#EFE3C8" sun={false} />
      <Hills y={1200} />
      <g transform={`translate(0 ${-drop})`}>
        <Pabrik x={800} y={1330} s={0.66} opacity={0.85} />
        <Kontainer x={250} y={1330} s={0.78} fill="#8B9682" />
        <Kontainer x={250} y={1260} s={0.78} fill="#A08A72" />
        <Kontainer x={420} y={1330} s={0.78} fill="#7C8C63" />
      </g>
      <T x={540} y={340} anchor="middle" size={44} weight={800} tracking={2} fill={kartun.line} opacity={0.72 * t1}>YANG PALING TERPUKUL: JAWA BARAT</T>
      <g opacity={t2}>
        <KainRol x={228} y={572} s={1.08} />
        <T x={380} y={566} size={82} weight={800} fill={kartun.line}>TEKSTIL</T>
        <MesinJahit x={228} y={748} s={1.1} />
        <T x={380} y={716} size={82} weight={800} fill={kartun.line}>GARMEN</T>
        <Sepatu x={228} y={866} s={1.16} />
        <T x={380} y={852} size={82} weight={800} fill={kartun.red}>SEPATU</T>
      </g>
      <g opacity={arrow}>
        <Path d="M540 900 L540 1046" stroke={kartun.red} strokeWidth={16} strokeLinecap="round" fill="none" />
        <Path d="M504 1006 L540 1056 L576 1006" stroke={kartun.red} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <Karakter x={210} y={1420} s={0.82} shirt={kartun.shirtAlt2} face="worried" pose="slump" />
      <KaraokeCaption text="padat karya ekspor paling rapuh" keyword="ekspor" y={1642} opacity={cap} />
    </KartunShell>
  );
};

/* --------------------------------------------------------------- d05 */
export const D05Analysis2: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const t1 = seg(f, 0, d * 0.16), t2 = seg(f, d * 0.24, d * 0.4);
  const walk = interpolate(f, [d * 0.3, d], [0, -90], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cap = seg(f, d * 0.1, d * 0.2);
  return (
    <KartunShell source="Kemnaker · pekerja informal & pengunduran diri · ilustrasi editorial">
      <Sky top="#E7DBCB" bottom="#F2E6CE" sun={false} />
      <Hills y={1160} />
      <Rect x={0} y={1180} w={1080} h={740} fill="#C3B296" />
      {/* pagar loket */}
      <g opacity={0.95}>
        <Rect x={40} y={1120} w={470} h={18} fill="#8E8577" />
        {[70, 150, 230, 310, 390, 470].map((px) => <Rect key={px} x={px} y={1000} w={14} h={140} fill="#8E8577" />)}
        <T x={275} y={1074} anchor="middle" size={22} weight={800} tracking={2.2} fill="#4B4A42">PINTU PELAPORAN</T>
      </g>
      <T x={540} y={330} anchor="middle" size={44} weight={800} tracking={2} fill={kartun.line} opacity={0.72 * t1}>YANG TIDAK LEWAT PINTU ITU</T>
      <g opacity={t2}>
        <T x={800} y={520} anchor="middle" size={58} weight={800} fill={kartun.line}>TIDAK</T>
        <T x={800} y={590} anchor="middle" size={58} weight={800} fill={kartun.line}>MELAPOR</T>
        <T x={800} y={690} anchor="middle" size={58} weight={800} fill={kartun.red}>TIDAK</T>
        <T x={800} y={760} anchor="middle" size={58} weight={800} fill={kartun.red}>DIHITUNG</T>
      </g>
      <Gerobak x={392} y={1322} s={0.94} />
      <Surat x={752} y={1176} s={0.78} rotate={-6} stamp="HARIAN" />
      <Surat x={972} y={1172} s={0.78} rotate={7} stamp="KELUAR" />
      <g transform={`translate(${walk} 0)`}>
        <Karakter x={640} y={1330} s={0.84} shirt={kartun.shirtAlt} face="sad" pose="slump" />
        <Karakter x={790} y={1364} s={0.78} shirt="#7C8C63" face="neutral" pose="stand" />
        <Karakter x={940} y={1336} s={0.82} shirt={kartun.shirtAlt2} face="worried" pose="carry" />
        <Kardus x={996} y={1222} s={0.58} rotate={8} />
      </g>
      <KaraokeCaption text="yang tak lewat pintu itu" keyword="tak" y={1642} opacity={cap} />
    </KartunShell>
  );
};

/* --------------------------------------------------------------- d06 */
export const D06Closing: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const l1 = seg(f, 0, d * 0.22), l2 = seg(f, d * 0.26, d * 0.46), cta = seg(f, d * 0.62, d * 0.74);
  const cap = seg(f, d * 0.08, d * 0.18);
  return (
    <KartunShell source="Kemnaker · KSPI · perhitungan & interpretasi Suara Publik">
      <Sky top="#E4D6C2" bottom="#F0E2C6" sun={false} />
      <Hills y={1240} />
      <g opacity={l1}>
        <T x={540} y={520} anchor="middle" size={86} weight={800} fill={kartun.line}>BUKAN ANGKANYA</T>
        <T x={540} y={620} anchor="middle" size={86} weight={800} fill={kartun.line}>YANG SALAH</T>
      </g>
      <g opacity={l2}>
        <T x={540} y={790} anchor="middle" size={72} weight={800} fill={kartun.red}>YANG TIDAK PERNAH</T>
        <T x={540} y={876} anchor="middle" size={72} weight={800} fill={kartun.red}>MASUK HITUNGAN</T>
      </g>
      <Karakter x={300} y={1330} s={0.95} shirt={kartun.shirt} face="neutral" pose="stand" />
      <Karakter x={540} y={1350} s={0.98} shirt={kartun.shirtAlt} face="worried" pose="stand" />
      <Karakter x={790} y={1330} s={0.95} shirt={kartun.shirtAlt2} face="sad" pose="stand" />
      <g opacity={cta}>
        <T x={540} y={1500} anchor="middle" size={26} weight={800} tracking={3} fill={kartun.line} opacity={0.7}>KALAU INI BERGUNA</T>
        <T x={540} y={1570} anchor="middle" size={46} weight={800} fill={kartun.red}>simpan · bagikan · ikuti</T>
      </g>
      <KaraokeCaption text="hitung yang tak terhitung" keyword="tak" y={1690} opacity={cap} />
    </KartunShell>
  );
};
