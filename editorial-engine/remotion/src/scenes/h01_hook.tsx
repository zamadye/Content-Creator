/**
 * H01 — HOOK
 * ----------
 * Potongan melintang lahan gambut malam hari. Di atas garis permukaan hanya asap dan
 * tunggul hangus; sumber cahaya satu-satunya ada di BAWAH garis itu.
 *
 * Lapisan: BG = langit berkabut · MG = permukaan, tunggul, asap · FG = lapisan gambut + bara.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { AsapKepul, LangitAsap, PohonHangus, ScrimK, TanahGambut } from '../illustration/topic-karhutla';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H01Hook: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.0, 1.06], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const beat = (frame / 52) % 1;
  const smoke = interpolate(frame, [0, Math.round(d * 0.4)], [0.3, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const kick = fade(frame, Math.round(d * 0.12), 18);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Kemendikdasmen, 15 Okt 2026 · Kemenkes, 18 Agu–21 Okt 2026"
    >
      <g transform={cam(scale, 540, 1080)}>
        <LangitAsap h={1120} haze={0.9} />
        <AsapKepul x={200} y={1120} s={1.5} p={smoke} opacity={0.1} />
        <AsapKepul x={620} y={1114} s={1.15} p={smoke * 0.85} opacity={0.085} />
        <AsapKepul x={950} y={1122} s={1.7} p={smoke * 0.7} opacity={0.07} />
        <PohonHangus x={168} y={1122} s={1.15} lean={-4} />
        <PohonHangus x={352} y={1118} s={0.72} lean={6} />
        <PohonHangus x={884} y={1122} s={0.95} lean={3} />
        <TanahGambut surfaceY={1120} depth={800} ember={0.9} beat={beat} embers={8} />
        <ScrimK y={0} h={880} from={0.92} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="KARHUTLA · OKTOBER–NOVEMBER 2026" />
        <Headline
          x={84}
          y={424}
          lines={['7,9 juta murid.', '333 ribu sakit.']}
          size={64}
          accentLine={1}
          accentFill={palette.brickLight}
        />
      </g>
    </SceneShell>
  );
};
