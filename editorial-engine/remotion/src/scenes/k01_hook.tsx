/**
 * K01 — HOOK
 * ----------
 * Meja warung malam. Dudukan akrilik berisi kode pembayaran menyala kena lampu gantung.
 * Yang mengejutkan bukan kodenya, tapi angka di atasnya: 12 juta orang, 467 juta transaksi.
 *
 * Lapisan: BG = dinding + satu baris rak · MG = meja kaca, dudukan, telepon, kopi.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Phone } from '../illustration/props';
import { Kopi, QrisStand, Scrim, WarungMeja } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const K01Hook: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.01, 1.08], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const glow = interpolate(frame, [Math.round(d * 0.3), Math.round(d * 0.3) + 18], [0.3, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const kick = fade(frame, Math.round(d * 0.18), 16);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="PPATK, 4 Agu 2026 (semester I 2026) · PPATK, 2026 (jumlah pemain)"
    >
      <g transform={cam(scale, 540, 1000)}>
        <WarungMeja lamp={1} shelfRows={1} />
        <QrisStand x={540} y={1240} s={1.6} glow={glow} />
        <Phone x={248} y={1240} s={1.32} rotate={-9} glow={0.24} />
        <Kopi x={858} y={1240} s={1.7} />
        <Scrim y={0} h={780} from={0.66} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="JUDI ONLINE · SEMESTER I 2026" />
        <Headline
          x={84}
          y={414}
          lines={['12 juta orang.', '467 juta transaksi.']}
          size={64}
          accentLine={1}
          accentFill={palette.mustard}
        />
      </g>
    </SceneShell>
  );
};
