/**
 * H02 — CONTEXT
 * -------------
 * Papan rekap di dinding posko. Empat baris, satu lampu, satu peta iltustrasi.
 * Baris nasional paling besar dan paling gelap; tiga provinsi di bawahnya.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect } from '../illustration/primitives';
import { LangitAsap, PapanRekap, PetaWilayah, ScrimK } from '../illustration/topic-karhutla';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H02Context: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.0, 1.04], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const rows = interpolate(frame, [Math.round(d * 0.08), Math.round(d * 0.72)], [0, 1.3], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const lamp = interpolate(frame, [Math.round(d * 0.1), Math.round(d * 0.3)], [0.2, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const kick = fade(frame, Math.round(d * 0.08), 16);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="BNPB, 2 Nov 2026 · data harian nasional (bukan rekap setahun)"
    >
      <g transform={cam(scale, 540, 980)}>
        <Rect x={0} y={0} w={1080} h={1920} fill="#1A1E18" />
        <LangitAsap h={620} haze={0.55} horizon={0} />
        {/* dinding posko: panel tipis, bukan tekstur */}
        <Rect x={0} y={600} w={1080} h={1320} fill="#232720" />
        <Rect x={0} y={598} w={1080} h={4} fill={palette.paper} opacity={0.08} />
        {/* lampu sorot di atas papan */}
        <Rect x={470} y={0} w={140} h={5} fill={palette.warmLight} opacity={0.4 * lamp} />
        <Rect x={480} y={5} w={120} h={10} fill={palette.warmLight} opacity={0.1 * lamp} />
        <PetaWilayah x={748} y={306} s={0.82} lit={lamp} />
        <PapanRekap
          x={80}
          y={642}
          w={920}
          h={560}
          title="REKAP KARHUTLA · 2 NOVEMBER 2026"
          sub="luas lahan yang masih terbakar"
          p={rows}
          rows={[
            { label: 'NASIONAL', value: '742 ha', trend: '', hot: true },
            { label: 'KALIMANTAN TENGAH', value: '351 ha', trend: '−42%' },
            { label: 'PAPUA SELATAN', value: '253 ha', trend: '−56%' },
            { label: 'SULAWESI TENGGARA', value: '95 ha', trend: '−63%' },
          ]}
        />
        <ScrimK y={1240} h={240} from={0.55} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="BNPB · 2 NOVEMBER 2026" />
        <Headline x={84} y={424} lines={['742 hektare.', 'Masih terbakar.']} size={64} accentLine={0} accentFill={palette.mustard} />
      </g>
    </SceneShell>
  );
};
