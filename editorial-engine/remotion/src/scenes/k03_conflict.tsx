/**
 * K03 — CONFLICT
 * --------------
 * Dua batang, satu sumbu. Batang kiri pendek dan menunjuk ke bawah; batang kanan panjang
 * dan menunjuk ke atas. Kedua label duduk di garis yang sama supaya tidak ada yang
 * dibaca lebih dulu — yang berbeda hanya arah dan panjangnya.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect, T } from '../illustration/primitives';
import { PanahTegak, Scrim } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const K03Conflict: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const pDown = interpolate(frame, [Math.round(d * 0.16), Math.round(d * 0.4)], [0, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const pUp = interpolate(frame, [Math.round(d * 0.4), Math.round(d * 0.72)], [0, 1], {
    easing: Easing.impact,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const dy = interpolate(frame, [0, d], [5, -5], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="PPATK: semester I 2026 dibanding semester I 2025 · nilai & jumlah transaksi"
    >
      <g transform={cam(1, 540, 1040, 0, dy)}>
        <Rect x={0} y={0} w={1080} h={1920} fill="#1D211A" />
        <Rect x={0} y={0} w={1080} h={1246} fill="#242820" />
        <Rect x={0} y={1246} w={1080} h={10} fill={palette.ink} opacity={0.55} />
        <Rect x={0} y={1256} w={1080} h={664} fill="#191C16" />
        {/* pemisah kolom */}
        <Rect x={538} y={676} w={1.5} h={520} fill={palette.paper} opacity={0.1} />

        {/* kiri: nilai turun */}
        <g opacity={fade(frame, Math.round(d * 0.1), 16)}>
          <T x={270} y={700} size={17} weight={700} tracking={3} fill={palette.sage} anchor="middle">
            NILAI PERPUTARAN
          </T>
          <PanahTegak x={270} y={748} len={200} dir={-1} p={pDown} color={palette.sage} />
          <T x={270} y={1024} size={68} family={t.display} fill={palette.sage} anchor="middle" tracking={-2}>
            −12,9%
          </T>
          <T x={270} y={1070} size={17} weight={500} fill={palette.paper} anchor="middle" opacity={0.55}>
            semester I 2026 vs semester I 2025
          </T>
        </g>

        {/* kanan: transaksi naik */}
        <g opacity={fade(frame, Math.round(d * 0.34), 16)}>
          <T x={810} y={700} size={17} weight={700} tracking={3} fill={palette.brickLight} anchor="middle">
            JUMLAH TRANSAKSI
          </T>
          <T x={810} y={796} size={76} family={t.display} fill={palette.brickLight} anchor="middle" tracking={-2}>
            +167%
          </T>
          <PanahTegak x={810} y={1160} len={336} dir={1} p={pUp} color={palette.brickLight} />
          <T x={810} y={1204} size={17} weight={500} fill={palette.paper} anchor="middle" opacity={0.55}>
            467 juta transaksi dalam enam bulan
          </T>
        </g>

        <Scrim y={0} h={600} from={0.62} to={0} />
      </g>

      <g opacity={fade(frame, Math.round(d * 0.12), 16)}>
        <Kicker x={84} y={330} text="2025 SETAHUN vs 2026 ENAM BULAN" />
        <Headline
          x={84}
          y={414}
          lines={['Nilainya turun.', 'Transaksinya meledak.']}
          size={60}
          accentLine={1}
          accentFill={palette.brickLight}
        />
      </g>
    </SceneShell>
  );
};
