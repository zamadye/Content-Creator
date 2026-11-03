/**
 * K05 — PERSPECTIVE
 * -----------------
 * Kembali ke warung yang sama seperti pembuka, dengan cahaya lebih dingin. Kodenya sama;
 * yang berubah hanya arah uang: titik-titik mengalir MASUK ke kode dari arah telepon.
 *
 * PPATK sendiri menyatakan QRIS bukan instrumen bermasalah — itu ditulis di baris sumber.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { T } from '../illustration/primitives';
import { Phone } from '../illustration/props';
import { Kopi, QrisStand, Scrim, TitikAliran, WarungMeja } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const K05Perspective: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.0, 1.05], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const flow = interpolate(frame, [Math.round(d * 0.2), Math.round(d * 0.95)], [0, 3], {
    easing: Easing.linearish,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const nums = fade(frame, Math.round(d * 0.4), 20);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.tealDeep}
      illustration
      illustrationY={250}
      sourceY={250}
      source="PPATK, 4 Agu 2026 · PPATK: QRIS bukan instrumen bermasalah, yang disalahgunakan merchant & identitas pembayaran"
    >
      <g transform={cam(scale, 540, 1010)}>
        <WarungMeja lamp={0.82} cold={1} shelfRows={1} />
        <QrisStand x={540} y={1240} s={1.55} glow={1} />
        <Phone x={250} y={1240} s={1.3} rotate={-9} glow={0.7} />
        <Kopi x={858} y={1240} s={1.6} />
        <TitikAliran p={flow} fromX={320} fromY={1136} toX={498} toY={1168} n={16} />

        <g opacity={nums}>
          <T x={996} y={768} size={94} family={t.display} fill={palette.mustard} anchor="end" tracking={-2}>
            56%
          </T>
          <T x={996} y={812} size={17} weight={600} tracking={2.4} fill={palette.paper} anchor="end" opacity={0.7}>
            DARI NILAI SETORAN LEWAT QRIS
          </T>
          <T x={996} y={908} size={52} family={t.display} fill={palette.paper} anchor="end" tracking={-1.6}>
            Rp12,36 T
          </T>
          <T x={996} y={950} size={17} weight={600} tracking={2.4} fill={palette.paper} anchor="end" opacity={0.7}>
            198,77 JUTA TRANSAKSI
          </T>
        </g>

        <Scrim y={0} h={780} from={0.66} to={0} />
      </g>

      <g opacity={fade(frame, Math.round(d * 0.14), 16)}>
        <Kicker x={84} y={330} text="QRIS · 56 PERSEN DARI SETORAN" />
        <Headline
          x={84}
          y={414}
          lines={['Kode yang sama', 'untuk bayar kopi.']}
          size={62}
          accentLine={1}
          accentFill={palette.mustard}
        />
      </g>
    </SceneShell>
  );
};
