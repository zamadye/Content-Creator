/**
 * S03 — CONTEXT (scale)
 * Piring bergerak lebih cepat daripada kemampuan sistem mengawasinya.
 * Foreground: counter + plates in constant motion. Upper third: the budget.
 * Hierarchy: 1) the plates 2) the number 3) the kitchen.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { Kitchen } from '../illustration/environments';
import { Character } from '../illustration/figures';
import { Plate } from '../illustration/props';
import { Rect, Scrim, T } from '../illustration/primitives';
import { SceneShell } from '../components/SceneShell';
import { Kicker, SourceTag } from '../typography';
import { breathe, cam, countTo, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const PLATES = Array.from({ length: 9 }, (_, i) => i);

export const S03Scale: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.14, 1.0], { easing: Easing.editorial, extrapolateRight: 'clamp' });
  const budget = countTo(frame, 8, Math.min(100, d * 0.55), 71, 268, Easing.linearish);
  const b1 = breathe(frame, 30, 1.2, 0.4);
  const b2 = breathe(frame, 30, 1.0, 2.4);
  const statsIn = fade(frame, 4, 18);
  const yearIn = fade(frame, Math.round(d * 0.42), 16);

  return (
    <SceneShell durationInFrames={d} bg={palette.tealDeep} source="Sumber: Kemenkeu; CNN Indonesia (Jul 2026)">
      <g transform={cam(scale, 540, 1180)}>
        <Kitchen steam={1} />

        {/* staff behind the line — the work never stops */}
        <Character
          kind="petugas"
          x={214}
          y={1392}
          height={520}
          pose={{ torso: 12 + b1 * 0.4, head: 16, armA: [42, -18], armB: [30, -34], legA: [5, -3], legB: [-6, -4] }}
          expression="firm"
          opacity={0.95}
        />
        <Character
          kind="petugas"
          x={906}
          y={1400}
          height={500}
          flip
          pose={{ torso: -8, head: 14, armA: [38, -12], armB: [16, -28], legA: [-5, -3], legB: [7, -4] }}
          expression="tired"
          opacity={0.92}
        />

        {/* --- the counter: plates travel left to right, forever --- */}
        <Rect x={-40} y={1408} w={1180} h={54} fill="#9AA79C" />
        <Rect x={-40} y={1462} w={1180} h={60} fill="#7C8B80" />
        <Rect x={-40} y={1510} w={1180} h={16} fill={palette.ink} opacity={0.25} />

        {PLATES.map((i) => {
          const travel = (frame * 3.4 + i * 138) % 1580;
          const x = -240 + travel;
          const bob = Math.sin((frame + i * 22) * 0.06) * 2.2;
          const edge = Math.min(1, Math.min(x + 240, 1160 - x) / 200);
          return (
            <g key={i} opacity={Math.max(0, Math.min(1, edge))}>
              <Plate x={x} y={1406 + bob} s={1.04} tilt={Math.sin(frame * 0.05 + i) * 2} />
            </g>
          );
        })}

        {/* foreground counter edge */}
        <Rect x={-40} y={1690} w={1180} h={320} fill="#6E7C72" />
        <Rect x={-40} y={1690} w={1180} h={14} fill="#A9B4A9" />
      </g>

      {/* ---- the money, stated plainly (on a scrim so it never fights the kitchen) ---- */}
      <Scrim x={0} y={200} w={1080} h={470} direction="down" opacity={0.86} />
      <g opacity={statsIn}>
        <Kicker x={72} y={330} text="ANGGARAN PROGRAM" color={palette.mustard} />
        <g transform={`translate(72 ${470})`}>
          <TypeNumber value={`${Math.round(budget)} T`} />
        </g>
        <g opacity={yearIn}>
          <Rect x={72} y={506} w={210 * Math.min(1, yearIn + 0.35)} h={2} fill={palette.mustard} opacity={0.55} />
        </g>
        <T x={72} y={562} size={30} weight={600} tracking={1.6} fill={palette.sage}>
          RUPIAH · 2025 — 2026
        </T>
        <T x={72} y={614} size={26} weight={500} tracking={0.8} fill={palette.sage} opacity={0.85}>
          sejak 6 Januari 2025 · puluhan juta penerima
        </T>
      </g>
    </SceneShell>
  );
};

/** Local helper: the big number keeps the design system's numeral treatment. */
const TypeNumber: React.FC<{ value: string }> = ({ value }) => (
  <text x={0} y={0} fontFamily={t.display} fontSize={168} fill={palette.paper} letterSpacing={-5}>
    {value}
  </text>
);
