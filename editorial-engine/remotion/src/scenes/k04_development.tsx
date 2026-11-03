/**
 * K04 — DEVELOPMENT
 * -----------------
 * Satu lembar uang utuh di atas meja. Lalu ia pecah dan menyebar jadi puluhan keping
 * kecil ke seluruh meja — makin banyak, makin kecil, makin sulit dihitung.
 *
 * Dua kartu di bawah meja adalah angka rerata: 2025 setahun vs 2026 enam bulan.
 * Angka itu HITUNGAN SENDIRI (pembagian dua angka PPATK) dan disebut begitu di layar.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect, T } from '../illustration/primitives';
import { Koin, LembarUang, Scrim } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const K04Development: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.05, 1.0], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const broken = interpolate(frame, [Math.round(d * 0.16), Math.round(d * 0.34)], [0, 1], {
    easing: Easing.impact,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const burstP = interpolate(frame, [Math.round(d * 0.22), Math.round(d * 0.62)], [0, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const before = fade(frame, Math.round(d * 0.06), 16);
  const after = fade(frame, Math.round(d * 0.5), 18);
  const coins = fade(frame, Math.round(d * 0.24), 22);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.inkSoft}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Hitungan sendiri: nilai perputaran ÷ jumlah transaksi (PPATK, semester I 2026 & 2025)"
    >
      <g transform={cam(scale, 540, 1000)}>
        {/* BG: dinding gelap + meja kayu */}
        <Rect x={0} y={0} w={1080} h={1920} fill="#1B1710" />
        <Rect x={0} y={0} w={1080} h={616} fill="#2A231A" />
        <defs>
          <radialGradient id="k04-pool" cx="0.5" cy="0.44" r="0.42">
            <stop offset="0%" stopColor={palette.warmLight} stopOpacity={0.22} />
            <stop offset="55%" stopColor={palette.warmLight} stopOpacity={0.07} />
            <stop offset="100%" stopColor={palette.warmLight} stopOpacity={0} />
          </radialGradient>
        </defs>
        <Rect x={0} y={0} w={1080} h={1500} fill="url(#k04-pool)" />

        <Rect x={0} y={612} w={1080} h={10} fill={palette.ink} opacity={0.5} />
        <Rect x={0} y={622} w={1080} h={934} fill="#452F1B" />
        <Rect x={0} y={622} w={1080} h={7} fill={palette.warmLight} opacity={0.22} />
        {[680, 760, 850, 950, 1060, 1180, 1310, 1450].map((y, i) => (
          <Rect key={y} x={0} y={y} w={1080} h={i % 3 === 0 ? 2 : 1} fill={palette.ink} opacity={0.18} />
        ))}
        {/* bayangan lembar uang di meja */}
        <Rect x={230} y={972} w={620} h={46} r={22} fill={palette.ink} opacity={0.4} filter="url(#blur-soft)" />

        {/* MG: lembar uang */}
        <g transform="translate(0 30)">
          <LembarUang x={540} y={840} s={1.55} rotate={-5} broken={broken} />
        </g>

        {/* koin menyebar keluar dari lembar */}
        <g opacity={coins}>
          {Array.from({ length: 46 }).map((_, i) => {
            const ang = (i / 46) * Math.PI * 2 + rnd(i) * 0.5;
            const reach = 110 + rnd(i + 11) * 250;
            const r = reach * burstP;
            const x = 540 + Math.cos(ang) * r * 1.15;
            const y = 870 + Math.sin(ang) * r * 0.62 + burstP * 120;
            return (
              <Koin
                key={i}
                x={x}
                y={y}
                s={0.55 + rnd(i + 5) * 0.5}
                opacity={0.45 + rnd(i + 3) * 0.45}
              />
            );
          })}
        </g>

        {/* kartu pembanding */}
        <g opacity={before}>
          <Rect x={72} y={1246} w={430} h={118} r={3} fill={palette.paper} />
          <T x={96} y={1286} size={16} weight={700} tracking={2.6} fill={palette.inkSoft} opacity={0.62}>
            2025 · SETAHUN
          </T>
          <T x={96} y={1336} size={44} family={t.display} fill={palette.ink} tracking={-1.4}>
            Rp680 ribu
          </T>
        </g>
        <g opacity={after}>
          <Rect x={560} y={1246} w={430} h={118} r={3} fill={palette.paper} />
          <T x={584} y={1286} size={16} weight={700} tracking={2.6} fill={palette.inkSoft} opacity={0.62}>
            2026 · ENAM BULAN
          </T>
          <T x={584} y={1336} size={44} family={t.display} fill={palette.brick} tracking={-1.4}>
            Rp186 ribu
          </T>
        </g>
        <T x={540} y={1404} size={17} weight={500} fill={palette.paper} opacity={0.5} anchor="middle">
          rata-rata nilai per transaksi · hitungan sendiri
        </T>

        <Rect x={0} y={1556} w={1080} h={6} fill={palette.warmLight} opacity={0.1} />
        <Rect x={0} y={1562} w={1080} h={358} fill="#1C140E" />
        <Scrim y={0} h={580} from={0.66} to={0} />
      </g>

      <g opacity={fade(frame, Math.round(d * 0.14), 16)}>
        <Kicker x={84} y={330} text="RERATA PER TRANSAKSI" />
        <Headline
          x={84}
          y={414}
          lines={['Taruhannya mengecil.', 'Jejaknya membesar.']}
          size={58}
          accentLine={1}
          accentFill={palette.mustard}
        />
      </g>
    </SceneShell>
  );
};
