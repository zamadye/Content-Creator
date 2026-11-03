/**
 * S09 — CLOSING
 * The room after everyone has gone home. Nobody is in frame; the absence is the subject.
 * The closing question arrives in the empty space of the blackboard, then the frame
 * goes dark without resolving.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { EmptyRoom } from '../illustration/environments';
import { Chair, SchoolBag } from '../illustration/props';
import { Ellipse, Rect, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { Scrim } from '../illustration/primitives';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame, random } from '../runtime';

const DUST = Array.from({ length: 26 }, (_, i) => i);

export const S09Closing: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.18, 0.96], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const q1 = fade(frame, Math.round(d * 0.18), 26);
  const q2 = fade(frame, Math.round(d * 0.34), 26);
  const endMark = fade(frame, Math.round(d * 0.72), 24);
  const dark = interpolate(frame, [d - 22, d - 2], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <SceneShell durationInFrames={d} bg={palette.ink} dipIn={10} dipOut={2} vignette={1.1} showBrand={false} source="Data per November 2026">
      <g transform={cam(scale, 520, 1180)}>
        <EmptyRoom warmth={0.7} />

        {/* dust in the light beam — the only movement in the room */}
        {DUST.map((i) => {
          const speed = 0.16 + random(i) * 0.22;
          const y = 1500 - ((frame * speed + random(i + 40) * 1400) % 1400);
          const x = 260 + random(i + 13) * 620 + Math.sin(frame * 0.012 + i) * 14;
          const o = 0.1 + random(i + 7) * 0.28;
          return <Ellipse key={i} cx={x} cy={y} rx={1.6 + random(i + 3) * 2.2} ry={1.6 + random(i + 3) * 2.2} fill={palette.warmLight} opacity={o} />;
        })}

        {/* one chair, one bag: the child who is not here */}
        <Chair x={430} y={1305} s={3.2} color={palette.oliveDeep} />
        <SchoolBag x={438} y={1234} s={2.0} />
        <Ellipse cx={430} cy={1311} rx={230} ry={24} fill={palette.ink} opacity={0.38} />
        <Chair x={968} y={1348} s={2.4} flip color={palette.oliveDeep} />


      </g>

      {/* the question itself is spoken (and subtitled); the screen carries the answer,
          never a repeat of the caption */}
      <Scrim x={0} y={880} w={1080} h={330} direction="flat" opacity={0.34} radius={0} />
      <g>
        <g opacity={q1} transform={`translate(0 ${(1 - q1) * 16})`}>
          <T x={90} y={1002} size={54} family={t.display} fill={palette.paper} opacity={0.96}>
            Bukan nasinya.
          </T>
        </g>
        <g opacity={q2} transform={`translate(0 ${(1 - q2) * 16})`}>
          <T x={90} y={1076} size={54} family={t.display} fill={palette.mustard}>
            Cara kita mengukurnya.
          </T>
        </g>
      </g>

      {/* end mark: brand only — the credit line belongs to SceneShell */}
      <g opacity={endMark}>
        <Rect x={90} y={1160} w={96} h={2} fill={palette.mustard} opacity={0.65} />
      </g>

      <Rect x={0} y={0} w={1080} h={1920} fill={palette.ink} opacity={dark} />
    </SceneShell>
  );
};
