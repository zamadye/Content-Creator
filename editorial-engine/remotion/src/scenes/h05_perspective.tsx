/**
 * H05 — PERSPECTIVE
 * -----------------
 * Ruang kelas kosong pada jam pelajaran. Kabut masuk dari jendela dan berhenti di lantai,
 * setinggi kaki bangku. Tidak ada tokoh: yang absen justru subjeknya.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect, T } from '../illustration/primitives';
import { MejaKelas, RuangKelasKabut, ScrimK } from '../illustration/topic-karhutla';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H05Perspective: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.0, 1.05], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const kabut = interpolate(frame, [Math.round(d * 0.1), Math.round(d * 0.7)], [0.35, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const bag = fade(frame, Math.round(d * 0.56), 18);
  const kick = fade(frame, Math.round(d * 0.08), 16);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Kemendikdasmen, 15 Okt 2026 · Malaysia, 8–9 Okt 2026"
    >
      <g transform={cam(scale, 540, 1020)}>
        <RuangKelasKabut kabut={0.55 + 0.45 * kabut} p={kabut} />

        {/* baris belakang */}
        <MejaKelas x={120} y={1158} s={0.98} bag={bag * 0.85} tone="#39433A" />
        <MejaKelas x={560} y={1158} s={0.98} bag={bag * 0.45} tone="#39433A" />

        {/* baris depan */}
        <MejaKelas x={40} y={1372} s={1.18} bag={bag} tone="#454F43" />
        <MejaKelas x={600} y={1372} s={1.18} bag={bag * 0.7} tone="#454F43" />

        <ScrimK y={0} h={720} from={0.9} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="KELAS · OKTOBER 2026" />
        <Headline x={84} y={424} lines={['Kelas kosong.', 'Asap lintas negara.']} size={58} accentLine={1} accentFill={palette.mustard} />
      </g>
    </SceneShell>
  );
};
