import React from 'react';
import { useCurrentFrame } from '../runtime';
import { interpolate, Easing } from '../runtime';
import { AngkaBesar, Crowd, Gerbang, Hills, Kardus, Karakter, KartunShell, KaraokeCaption, Pabrik, Papan, Sky, kartun } from '../illustration/cartoon';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** HOOK — dua angka PHK yang tidak pernah cocok. */
export const D01Hook: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  // ATURAN FRAME 0: seluruh hook harus terbaca penuh di frame pertama (thumbnail).
  const kick = 1, n1 = 1, vs = 1, n2 = 1;
  const cap = seg(f, d * 0.03, d * 0.1);
  const zoom = interpolate(f, [0, d], [1, 1.035], { extrapolateRight: 'clamp' });
  const walk = interpolate(f, [0, d], [0, -120], { extrapolateRight: 'clamp' });
  const push = interpolate(f, [0, d], [0, -34], { extrapolateRight: 'clamp' });

  return (
    <KartunShell source="Kemnaker (Satu Data, 4 Nov 2026) · KSPI · ilustrasi editorial">
      <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
      <Sky top="#E6D9C6" bottom="#F3E7CE" sun={false} />
      <Hills y={1150} />
      <g transform={`translate(0 ${push})`}>
        <Pabrik x={540} y={1382} s={0.92} opacity={0.85} />
        <Gerbang x={540} y={1400} s={1} />
      </g>
      {/* pekerja keluar membawa kardus */}
      <g transform={`translate(${walk} 0)`}>
        <Karakter x={300} y={1500} s={1.02} shirt={kartun.shirtAlt} face="sad" pose="carry" />
        <Kardus x={368} y={1380} s={0.9} rotate={-8} />
      </g>
      <Karakter x={762} y={1512} s={0.96} shirt="#5C6A63" face="worried" pose="slump" />
      <Crowd x={70} y={1596} n={4} s={0.5} opacity={0.9} />

      {/* judul */}
      <g opacity={kick}>
        <AngkaBesar x={540} y={400} text="ORANG KEHILANGAN KERJA" size={52} fill={kartun.line} />
      </g>
      <g opacity={n1}>
        <AngkaBesar x={540} y={640} text="72.336" size={196} fill={kartun.red} />
      </g>
      <g opacity={vs}>
        <AngkaBesar x={540} y={760} text="atau" size={62} fill={kartun.line} />
      </g>
      <g opacity={n2}>
        <AngkaBesar x={540} y={960} text="90.000?" size={196} fill={kartun.line} />
      </g>

      <Papan x={210} y={1180} w={300} h={168} label="KEMNAKER" value="72.336" accent={kartun.paper} rotate={-3} />
      <Papan x={870} y={1180} w={300} h={168} label="KSPI" value=">90.000" accent="#EDE3CF" rotate={3} />

      </g>
      <KaraokeCaption text="satu PHK, dua angka resmi" keyword="dua" y={1642} opacity={cap} />
    </KartunShell>
  );
};
