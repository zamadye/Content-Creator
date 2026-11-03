/**
 * K02 — CONTEXT
 * -------------
 * Tiga blok angka cetak diletakkan di atas meja kayu, seperti bukti yang baru dibuka
 * dari amplop. Yang dibesarkan blok pertama; dua sisanya menunggu di bawahnya.
 *
 * Angka-angka ini resmi. Baris sumber menyebut lembaga dan tanggalnya utuh.
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { Rect } from '../illustration/primitives';
import { BlokAngka, Scrim } from '../illustration/topic-judol';
import { Headline, Kicker } from '../typography';
import { cam, fade } from '../animations';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

export const K02Context: React.FC<{ d: number }> = ({ d }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, d], [1.0, 1.045], {
    easing: Easing.editorial,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const a = fade(frame, Math.round(d * 0.08), 20);
  const b = fade(frame, Math.round(d * 0.2), 20);
  const c = fade(frame, Math.round(d * 0.32), 20);

  return (
    <SceneShell
      durationInFrames={d}
      bg={palette.inkSoft}
      illustration
      illustrationY={250}
      sourceY={250}
      source="Keterangan Kepala PPATK, 4 Agustus 2026 · semester I 2026"
    >
      <g transform={cam(scale, 540, 1000)}>
        {/* BG: dinding + meja kayu */}
        <Rect x={0} y={0} w={1080} h={1920} fill="#1C1913" />
        <Rect x={0} y={0} w={1080} h={600} fill="#2B2820" />
        <Rect x={0} y={596} w={1080} h={10} fill={palette.ink} opacity={0.55} />
        <Rect x={0} y={606} w={1080} h={1314} fill="#33251A" />
        <Rect x={0} y={606} w={1080} h={6} fill={palette.warmLight} opacity={0.18} />
        {/* serat kayu */}
        {[660, 720, 790, 860, 930, 1010, 1090, 1170, 1250, 1340].map((y, i) => (
          <Rect key={y} x={0} y={y} w={1080} h={i % 3 === 0 ? 2 : 1} fill={palette.ink} opacity={0.18} />
        ))}
        {/* bayangan lebar di bawah tumpukan kertas */}
        <Rect x={40} y={1188} w={700} h={40} r={20} fill={palette.ink} opacity={0.35} filter="url(#blur-soft)" />

        <defs>
          <radialGradient id="k02-lamp" cx="0.3" cy="0.1" r="0.6">
            <stop offset="0%" stopColor={palette.warmLight} stopOpacity={0.2} />
            <stop offset="60%" stopColor={palette.warmLight} stopOpacity={0.06} />
            <stop offset="100%" stopColor={palette.warmLight} stopOpacity={0} />
          </radialGradient>
        </defs>
        <Rect x={0} y={0} w={1080} h={1400} fill="url(#k02-lamp)" />

        {/* MG: tiga blok angka di atas meja */}
        <g opacity={a}>
          <BlokAngka
            x={72}
            y={618}
            w={640}
            h={176}
            title="PERPUTARAN DANA · ENAM BULAN"
            value="Rp86,82 triliun"
            valueSize={62}
            sub="seluruh aliran dana yang teridentifikasi"
            rotate={-0.4}
          />
        </g>
        <g opacity={b}>
          <BlokAngka
            x={72}
            y={822}
            w={540}
            h={176}
            title="JUMLAH TRANSAKSI"
            value="467,32 juta"
            valueSize={48}
            sub="enam bulan · semester I 2026"
            paper={palette.paperDim}
            rotate={0.3}
          />
        </g>
        <g opacity={c}>
          <BlokAngka
            x={72}
            y={1026}
            w={470}
            h={176}
            title="SETORAN PEMAIN"
            value="Rp22,05 T"
            valueSize={44}
            sub="bank · e-wallet · QRIS"
            paper={palette.paperDim}
            rotate={-0.6}
          />
        </g>

        <Scrim y={0} h={560} from={0.62} to={0} />
      </g>

      <g opacity={fade(frame, Math.round(d * 0.16), 16)}>
        <Kicker x={84} y={330} text="SEMESTER I 2026" />
        <Headline
          x={84}
          y={414}
          lines={['Angka resmi,', 'bukan estimasi.']}
          size={62}
          accentLine={1}
          accentFill={palette.mustard}
        />
      </g>
    </SceneShell>
  );
};
