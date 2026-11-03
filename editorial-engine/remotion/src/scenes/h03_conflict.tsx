/**
 * H03 — CONFLICT
 * --------------
 * Dua angka, dua tanggal, dua metode. Sengaja TIDAK digambar sebagai satu deret grafik:
 * batang yang sejajar akan membuat 742 dan 41.554 terlihat sebading, padahal keduanya
 * menjawab pertanyaan berbeda. Yang bisa dibandingkan hanya satu hal — porsi yang masih
 * membara pada 23 Oktober (64 persen), dan itu digambar sebagai pita bara di dalam kartu.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect, T } from '../illustration/primitives';
import { Bara, ScrimK } from '../illustration/topic-karhutla';
import { BlokAngka } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const H03Conflict: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const dy = interpolate(frame, [0, d], [6, -6], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const pRekap = fade(frame, Math.round(d * 0.3), 20);
  const pHarian = fade(frame, Math.round(d * 0.52), 18);
  const pEmber = interpolate(frame, [Math.round(d * 0.58), Math.round(d * 0.82)], [0, 1], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const beat = (frame / 46) % 1;
  const kick = fade(frame, Math.round(d * 0.06), 14);

  const barX = 84;
  const barW = 560;
  const emberShare = 0.64; // 26.681 / 41.554 — hitungan sendiri, tanggal sama

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.ink}
      illustration
      illustrationY={250}
      sourceY={250}
      source="BNPB, 23 Okt & 2 Nov 2026 · dua metode, tidak dikurangkan"
    >
      <g transform={cam(1, 540, 980, 0, dy)}>
        <Rect x={0} y={0} w={1080} h={1920} fill="#181C17" />
        {/* garis dinding data */}
        {Array.from({ length: 9 }).map((_, i) => (
          <Rect key={i} x={0} y={520 + i * 120} w={1080} h={1} fill={palette.paper} opacity={0.045} />
        ))}

        {/* kartu rekap 23 Oktober */}
        <g opacity={pRekap}>
          <BlokAngka
            x={barX}
            y={740}
            w={barW}
            h={310}
            title="23 OKT 2026 · REKAP"
            value="41.554"
            sub="hektare sudah terbakar"
            valueSize={86}
          />
          {/* pita bara di dalam kartu: porsi yang belum padam */}
          <Rect x={barX + 24} y={944} w={barW - 48} h={24} fill={palette.ink} opacity={0.12} />
          <Rect x={barX + 24} y={944} w={(barW - 48) * emberShare * pEmber} h={24} fill={palette.brick} opacity={0.85} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bara key={i} x={barX + 44 + i * ((barW - 88) * emberShare) / 4.2} y={956} r={6} p={pEmber * (0.6 + 0.4 * Math.sin(beat * Math.PI * 2 + i))} />
          ))}
        </g>

        {/* kartu harian 2 November — kecil, di depan, menimpa tepi kanan */}
        <g opacity={pHarian}>
          <BlokAngka
            x={596}
            y={880}
            w={400}
            h={250}
            title="2 NOV 2026 · HARIAN"
            value="742"
            sub="hektare masih terbakar"
            valueSize={84}
          />
        </g>

        <g opacity={pRekap}>
          <T x={barX} y={1102} size={18} weight={600} tracking={1} fill={palette.brickLight} opacity={0.92 * pEmber}>
            26.681 masih membara · 64% dari yang terbakar
          </T>
          <T x={barX} y={1142} size={16} weight={500} tracking={0.8} fill={palette.sage} opacity={0.6}>
            Dua metode pemantauan. Tidak dikurangkan.
          </T>
        </g>

        <ScrimK y={1220} h={260} from={0.5} to={0} />
      </g>

      <g opacity={kick}>
        <Kicker x={84} y={330} text="SATU LAHAN · DUA ANGKA" />
        <Headline x={84} y={424} lines={['Yang turun hari ini.', 'Yang tinggal di tanah.']} size={56} accentLine={1} accentFill={palette.brickLight} />
      </g>
    </SceneShell>
  );
};
