/**
 * S04 — CONFLICT (the number)
 * The official percentage owns the screen. Then the count of children arrives and
 * refuses to fit inside it. No caricature: the institutional figure is a silhouette.
 * Hierarchy: 1) the two numbers 2) the screen 3) the hall.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { Hall } from '../illustration/environments';
import { InstitutionalSilhouette } from '../illustration/figures';
import { Podium } from '../illustration/props';
import { Rect, Scrim, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { Kicker } from '../typography';
import { cam, countTo, fade, handheld } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const S04Stat: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  // camera tilt-up, then a slow push so the second number has room to arrive
  const yShift = interpolate(frame, [0, Math.min(70, d * 0.4)], [180, 0], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const push = interpolate(frame, [0, d], [1.0, 1.07], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const hh = handheld(frame, 0.9);
  const big = Math.round(countTo(frame, Math.round(d * 0.5), Math.round(d * 0.32), 0, 37693, Easing.linearish));
  const pctIn = fade(frame, 6, 20);
  const countIn = fade(frame, Math.round(d * 0.44), 18);
  const dateIn = fade(frame, 10, 18);

  return (
    <SceneShell durationInFrames={d} bg={palette.nightDeep} source="Sumber: pernyataan resmi 29 Sep 2025; JPPI (Mei 2026)">
      <g transform={cam(push, 540, 900, hh.dx, yShift + hh.dy)}>
        <Hall screenGlow={1} sconce={0.6} />

        {/* --- the official figure, and the percentage on the wall --- */}
        <g opacity={pctIn}>
          <T x={540} y={790} size={248} family={t.display} fill={palette.paper} anchor="middle" tracking={-10}>
            {`0,00${17}`}
          </T>
          <T x={540} y={846} size={64} family={t.display} fill={palette.paper} anchor="middle" tracking={-1}>
            persen
          </T>
          <T x={540} y={890} size={22} weight={600} tracking={5} fill={palette.sage} anchor="middle" opacity={0.85}>
            DARI TOTAL PENERIMA
          </T>
        </g>

        {/* podium + institutional silhouette, kept to the right of the evidence block */}
        <Podium x={830} y={1560} s={1.35} />
        <InstitutionalSilhouette x={830} y={1560} height={430} opacity={0.96} />
      </g>

      {/* the count arrives on its own dark field: it does not fit inside a percentage */}
      <Scrim x={0} y={1080} w={1080} h={430} direction="down" opacity={0.9} />
      <g opacity={countIn}>
        <Kicker x={72} y={1150} text="DIDUGA KERACUNAN" color={palette.brickLight} />
        <T x={72} y={1340} size={158} family={t.display} fill={palette.brickLight} tracking={-8}>
          {big.toLocaleString('id-ID')}
        </T>
        <T x={74} y={1392} size={25} weight={600} tracking={2.2} fill={palette.sage} opacity={0.9}>
          SISWA · JANUARI 2025 — MEI 2026
        </T>
      </g>

      {/* subtle screen light onto the floor */}
      <Rect x={0} y={1580} w={1080} h={4} fill={palette.coolLight} opacity={0.06} />

      <g opacity={dateIn * 0.9}>
        <T x={72} y={286} size={t.size.micro} weight={700} tracking={5} fill={palette.mustard}>
          29 SEPTEMBER 2025
        </T>
      </g>
    </SceneShell>
  );
};
