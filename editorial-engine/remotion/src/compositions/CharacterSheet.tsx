/**
 * CHARACTER DESIGN SHEET (Deliverable: assets/characters)
 * ------------------------------------------------------
 * One sheet generated from the same rig used in the film, so the sheet can never drift
 * from what the animation actually renders. Front / three-quarter / profile, plus the
 * expression and pose vocabulary the scenes are allowed to use.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { GlobalDefs } from '../components/GlobalDefs';
import { Character, Kind } from '../illustration/figures';
import { T, Rect } from '../illustration/primitives';
import { AbsoluteFill } from '../runtime';

const CAST: { kind: Kind; name: string; role: string }[] = [
  { kind: 'anak', name: 'RIAN, 11', role: 'siswa SD — korban/keluarga' },
  { kind: 'ibu', name: 'SARI, 38', role: 'ibu — penunggu di puskesmas' },
  { kind: 'guru', name: 'PAK WAHYU, 45', role: 'guru — juru cicip' },
  { kind: 'petugas', name: 'PETUGAS SPPG', role: 'dapur — rantai distribusi' },
];

const EXPRESSIONS = ['neutral', 'tired', 'sick', 'worried', 'kind', 'firm', 'sad', 'open'] as const;

export const CharacterSheet: React.FC = () => (
  <AbsoluteFill>
    <GlobalDefs />
    <Rect x={0} y={0} w={2400} h={1700} fill={palette.ink} />
    <T x={90} y={130} size={54} family={t.display} fill={palette.paper}>
      CHARACTER SHEET — 2D ANIMATED EDITORIAL STORYTELLING
    </T>
    <T x={90} y={180} size={22} weight={600} tracking={3.4} fill={palette.mustard}>
      SUARA PUBLIK · RIG v1 · SEMUA FIGUR DIGAMBAR DARI KOMPONEN YANG SAMA DENGAN FILM
    </T>
    <Rect x={90} y={208} w={2220} h={2} fill={palette.mustard} opacity={0.5} />

    {CAST.map((c, i) => {
      const col = 120 + i * 570;
      return (
        <g key={c.kind}>
          <Rect x={col} y={260} w={520} h={760} r={6} fill={palette.night} />
          {/* front */}
          <Character kind={c.kind} x={col + 150} y={940} height={560} expression="neutral" />
          {/* three-quarter (head turn) */}
          <g opacity={0.98}>
            <Character kind={c.kind} x={col + 330} y={940} height={520} expression="worried" pose={{ headTurn: 0.75, torso: -3, head: 4 }} />
          </g>
          {/* profile-ish */}
          <g opacity={0.9}>
            <Character kind={c.kind} x={col + 460} y={940} height={470} flip expression="firm" pose={{ headTurn: -1 }} />
          </g>
          <T x={col + 24} y={300} size={30} family={t.display} fill={palette.paper}>
            {c.name}
          </T>
          <T x={col + 24} y={330} size={17} weight={600} tracking={1.4} fill={palette.sage}>
            {c.role}
          </T>
          <T x={col + 24} y={1030} size={15} weight={500} tracking={1.2} fill={palette.sageDeep}>
            front · 3/4 (headTurn .75) · profile (flip)
          </T>
        </g>
      );
    })}

    {/* expression vocabulary */}
    <T x={120} y={1180} size={26} weight={700} tracking={4} fill={palette.mustard}>
      EXPRESSION SET (anak)
    </T>
    {EXPRESSIONS.map((e, i) => (
      <g key={e}>
        <Character kind="anak" x={190 + i * 265} y={1600} height={330} expression={e} pose={{ headTurn: 0.15 }} />
        <T x={190 + i * 265} y={1650} size={16} weight={600} tracking={2} fill={palette.sage} anchor="middle">
          {e.toUpperCase()}
        </T>
      </g>
    ))}
  </AbsoluteFill>
);
