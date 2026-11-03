/**
 * H04 — DEVELOPMENT
 * -----------------
 * Kamera masuk ke potongan tanah. Hujan turun di atas garis permukaan dan meresap;
 * bara tidak tersentuh, karena ia ada di lapisan yang lebih dalam.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect } from '../illustration/primitives';
import { Hujan, LabelTunjuk, ScrimK, TanahGambut } from '../illustration/topic-karhutla';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H04Development: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const dy = interpolate(frame, [0, d], [0, 60], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const rain = interpolate(frame, [Math.round(d * 0.06), Math.round(d * 0.5)], [0, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const glow = interpolate(frame, [Math.round(d * 0.35), Math.round(d * 0.62)], [0.35, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const labels = fade(frame, Math.round(d * 0.5), 18);
  const beat = (frame / 58) % 1;
  const kick = fade(frame, Math.round(d * 0.08), 16);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="BNPB, 2 Nov 2026 · hujan belum menghapus bara gambut"
    >
      <g transform={cam(1, 540, 1000, 0, dy)}>
        <Rect x={0} y={0} w={1080} h={900} fill="#171B16" />
        <Rect x={0} y={0} w={1080} h={420} fill="#1C211B" />
        <Hujan y0={230} y1={900} p={rain} n={52} opacity={0.3} />
        {/* percikan di permukaan */}
        {Array.from({ length: 10 }).map((_, i) => (
          <Rect
            key={i}
            x={60 + i * 104}
            y={880}
            w={26 + (i % 3) * 10}
            h={2}
            fill={palette.coolLight}
            opacity={0.18 + 0.2 * Math.abs(Math.sin(rain * 6 + i))}
          />
        ))}
        <TanahGambut surfaceY={900} depth={1020} ember={glow} beat={beat} embers={9} char={0.7} />

        <g opacity={labels}>
          <LabelTunjuk x={250} y={884} text="PERMUKAAN GAMBUT" dir={1} len={120} />
          <LabelTunjuk x={800} y={1420} text="BARA TETAP" dir={-1} len={150} />
        </g>

        <ScrimK y={0} h={760} from={0.86} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="GAMBUT · API DI BAWAH TANAH" />
        <Headline x={84} y={424} lines={['Hujan masuk.', 'Bara tinggal.']} size={64} accentLine={0} accentFill={palette.mustard} />
      </g>
    </SceneShell>
  );
};
