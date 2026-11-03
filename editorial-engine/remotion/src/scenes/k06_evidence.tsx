/**
 * K06 — EVIDENCE
 * --------------
 * Dinding penindakan: tiga plat berisi angka yang dihitung rapi, dan satu bingkai kosong
 * untuk pertanyaan yang tidak pernah diumumkan — berapa uang yang kembali ke pemain.
 * Kamera bergeser ke kanan mencari jawaban dan tidak menemukannya.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect, T } from '../illustration/primitives';
import { PlatAngka, Scrim } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const K06Evidence: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const dx = interpolate(frame, [0, d], [26, -46], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const pulse = 0.5 + 0.25 * Math.sin(Math.min(1, Math.max(0, (frame - d * 0.55) / (d * 0.3))) * Math.PI);
  const p1 = fade(frame, Math.round(d * 0.06), 16);
  const p2 = fade(frame, Math.round(d * 0.14), 16);
  const p3 = fade(frame, Math.round(d * 0.22), 16);
  const empty = fade(frame, Math.round(d * 0.6), 24);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.inkSoft}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Komdigi, 20 Okt 2024–12 Jul 2026 · PPATK, semester I 2026 · uang yang kembali: tidak dipublikasikan"
    >
      {/* BG: dinding beton — tetap, tidak ikut bergeser */}
      <g>
        <Rect x={0} y={0} w={1080} h={1920} fill="#212420" />
        <Rect x={0} y={0} w={1080} h={1246} fill="#2E302A" />
        {[0, 1, 2, 3].map((i) => (
          <Rect key={i} x={0} y={430 + i * 190} w={1080} h={2} fill={palette.ink} opacity={0.16} />
        ))}
        <Rect x={0} y={1246} w={1080} h={8} fill={palette.ink} opacity={0.55} />
        <Rect x={0} y={1254} w={1080} h={666} fill="#191C16" />
      </g>

      {/* MG: plat & bingkai — bergeser pelan mengikuti pencarian jawaban */}
      <g transform={cam(1, 540, 980, dx)}>
        <g opacity={p1}>
          <PlatAngka x={56} y={650} w={300} h={238} label="KONTEN DIBLOKIR" value="3,7 juta" note="Komdigi · sampai 12 Jul 2026" />
        </g>
        <g opacity={p2}>
          <PlatAngka x={386} y={650} w={300} h={238} label="REKENING DIBLOKIR" value="5.762" note="PPATK · semester I 2026" />
        </g>
        <g opacity={p3}>
          <PlatAngka x={716} y={650} w={300} h={238} label="DANA DI REKENING ITU" value="Rp1,07 T" note="PPATK · semester I 2026" />
        </g>

        <g opacity={empty}>
          <PlatAngka x={386} y={930} w={630} h={196} label="UANG YANG KEMBALI KE PEMAIN" value="" empty dim={pulse + 0.4} />
          <T x={416} y={1160} size={17} weight={500} fill={palette.paper} opacity={0.5}>
            tidak ada dalam rilis mana pun, per 2 November 2026
          </T>
        </g>
      </g>

      <Scrim y={0} h={620} from={0.62} to={0} />

      <g opacity={fade(frame, Math.round(d * 0.16), 16)}>
        <Kicker x={84} y={330} text="YANG SUDAH DIBLOKIR" color={palette.mustard} />
        <Headline
          x={84}
          y={414}
          lines={['Yang diblokir dicatat.', 'Yang kembali tidak.']}
          size={56}
          accentLine={1}
          accentFill={palette.brickLight}
        />
      </g>
      <T x={84} y={1330} size={21} family={t.sans} weight={600} tracking={2.2} fill={palette.paper} opacity={0.45}>
        TIGA ANGKA YANG ADA, SATU YANG TIDAK
      </T>
    </SceneShell>
  );
};
