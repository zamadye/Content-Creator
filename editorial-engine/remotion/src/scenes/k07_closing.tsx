/**
 * K07 — CLOSING
 * -------------
 * Warung yang sama, lampu diredupkan, telepon sudah tidak di meja. Kode masih menempel.
 * Tidak ada nasihat di layar: hanya satu kalimat yang membedakan apa yang bisa diblokir
 * dan apa yang tidak.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect } from '../illustration/primitives';
import { Kopi, QrisStand, Scrim, WarungMeja } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const K07Closing: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.06, 1.0], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const lamp = interpolate(frame, [0, d], [0.92, 0.62], {
    easing: Easing.linearish,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const dark = fade(frame, Math.round(d * 0.5), 30);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.nightDeep}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Angka: PPATK, semester I 2026"
    >
      <g transform={cam(scale, 540, 1060)}>
        <WarungMeja lamp={lamp} shelfRows={1} />
        <QrisStand x={540} y={1240} s={1.5} glow={0.5} />
        <Kopi x={858} y={1240} s={1.6} />

        {/* kegelapan menyempit dari bawah: meja menghitam, kode tetap menyala */}
        <defs>
          <linearGradient id="k07-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.nightDeep} stopOpacity={0} />
            <stop offset="100%" stopColor={palette.nightDeep} stopOpacity={0.92} />
          </linearGradient>
        </defs>
        <g opacity={dark}>
          <Rect x={0} y={1240} w={1080} h={680} fill="url(#k07-floor)" />
        </g>
        <Scrim y={0} h={780} from={0.7} to={0} />
      </g>

      <g opacity={fade(frame, 6, 18)}>
        <Kicker x={84} y={330} text="DUA HAL YANG BERBEDA" />
        <Headline
          x={84}
          y={414}
          lines={['Yang diblokir: rekening.', 'Yang tidak: kebiasaan.']}
          size={54}
          accentLine={1}
          accentFill={palette.mustard}
        />
      </g>
    </SceneShell>
  );
};
