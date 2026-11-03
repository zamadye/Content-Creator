/**
 * S08 — PERSPECTIVE (what we count, what we don't)
 * One plate in the foreground, two hands behind it, and a tally that never stops.
 * The visual argument: the tally is animated, the hands are not.
 * Hierarchy: 1) the hands 2) the plate 3) the tally.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { HandsClasped, Plate } from '../illustration/props';
import { Ellipse, Path, Rect, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { Kicker } from '../typography';
import { cam, fade, handheld } from '../animations';
import { Easing, interpolate, useCurrentFrame, random } from '../runtime';

const TICKS = Array.from({ length: 66 }, (_, i) => i);

export const S08Metric: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const hh = handheld(frame, 1.4);
  const grip = interpolate(frame, [Math.round(d * 0.2), d], [0.35, 1], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const focus = interpolate(frame, [0, d], [0, 1], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const plateOpacity = 1 - focus * 0.55;
  const scale = interpolate(frame, [0, d], [1.0, 1.1], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const handsIn = fade(frame, 4, 22);
  const textIn = fade(frame, Math.round(d * 0.28), 20);

  return (
    <SceneShell durationInFrames={d} bg={palette.ink} source="Metafora visual — bukan data resmi">
      {/* dark room behind: the waiting room out of focus */}
      <Rect x={0} y={0} w={1080} h={1920} fill="#1E2A26" />
      <Ellipse cx={700} cy={760} rx={520} ry={420} fill={palette.warmLight} opacity={0.1} filter="url(#blur-hard)" />
      <Rect x={0} y={1240} w={1080} h={680} fill="#26332C" />
      <Rect x={0} y={1240} w={1080} h={12} fill={palette.ink} opacity={0.4} />

      <g transform={`translate(${hh.dx} ${hh.dy})`}>
        {/* hands — the still centre of the frame */}
        <g opacity={handsIn} transform={cam(1.02 + focus * 0.06, 560, 1080)}>
          <HandsClasped x={520} y={1180} s={1.38} grip={grip} />
        </g>

        {/* foreground plate, deliberately losing focus as we stay with the hands */}
        <g transform={cam(scale, 320, 1500)}>
          <g opacity={plateOpacity}>
            <g filter="url(#blur-mid)" opacity={focus * 0.5}>
              <Plate x={250} y={1760} s={2.6} tilt={-4} />
            </g>
            <g opacity={1 - focus * 0.5}>
              <Plate x={250} y={1760} s={2.6} tilt={-4} />
            </g>
          </g>
        </g>
      </g>

      {/* the tally: only the countable thing moves */}
      <g opacity={0.9}>
        {TICKS.map((i) => {
          const period = 6;
          const local = (frame - i * 1.2) % (TICKS.length * period);
          const visible = Math.max(0, Math.min(1, (frame - i * 1.6) / 8));
          const col = i % 9;
          const row = Math.floor(i / 9);
          return (
            <Rect
              key={i}
              x={716 + col * 34}
              y={300 + row * 34 + (local > 0 ? 0 : 0)}
              w={3.4}
              h={22}
              fill={palette.mustard}
              opacity={visible * (0.35 + random(i) * 0.55)}
            />
          );
        })}
        <T x={716} y={586} size={20} weight={700} tracking={3.6} fill={palette.mustard} opacity={0.85}>
          PIRING TERKIRIM
        </T>
        <Path d={`M 716 604 L 1010 604`} stroke={palette.mustard} strokeWidth={2} opacity={0.35} />
        <T x={716} y={660} size={26} weight={600} tracking={1.4} fill={palette.sage} opacity={0.9}>
          ANAK SELAMAT
        </T>
        <T x={716} y={716} size={40} family={t.display} fill={palette.brickLight} opacity={0.95}>
          —
        </T>
      </g>

      {/* the line that closes the argument */}
      <g opacity={textIn}>
        <Kicker x={72} y={430} text="YANG KITA HITUNG" color={palette.mustard} />
        <T x={72} y={530} size={56} family={t.display} fill={palette.paper} tracking={-1.2}>
          piring yang terkirim
        </T>
        <T x={72} y={598} size={56} family={t.display} fill={palette.mustard} tracking={-1.2}>
          bukan anak yang pulang
        </T>
      </g>
    </SceneShell>
  );
};
