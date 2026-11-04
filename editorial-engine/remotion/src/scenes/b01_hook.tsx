/**
 * B01 — HOOK
 * ----------
 * "Hampir Rp12 triliun untuk 13,3 juta pekerja. Ambil kalkulator."
 *
 * Catatan koordinat (sama seperti p01): anak dari KraftCard/Slip/PaperWrite berada
 * di ruang LOKAL komponen itu (0..w, 0..h), bukan ruang kanvas.
 * Zona aman teks: y ≤ 1400 (subtitle mulai 1463, sumber 1672).
 */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import {
  KraftCard,
  MarkerText,
  PaperBg,
  PaperHeader,
  PaperIllustrationTag,
  PaperSource,
  PaperWrite,
  Pencil,
  SketchUnderline,
  Slip,
  Tape,
} from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const B01Hook: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const cardIn = seg(f, 0, 12);
  const writeSmall = seg(f, 8, d * 0.16);
  const writeBig = seg(f, d * 0.14, d * 0.34);
  const slipIn = seg(f, d * 0.36, d * 0.46);
  const calcIn = seg(f, d * 0.5, d * 0.62);
  const result = seg(f, d * 0.68, d * 0.8);
  const line1 = seg(f, d * 0.82, d * 0.9);
  const under = seg(f, d * 0.9, d * 0.99);

  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={11} />
      <PaperHeader />
      <PaperIllustrationTag />

      <g transform={`translate(0 ${(1 - cardIn) * -44})`} opacity={cardIn}>
        <KraftCard x={110} y={330} w={860} h={410} seed={12} rotate={-2.1}>
          <Tape x={30} y={-26} w={168} h={44} rotate={-11} />
          <Tape x={660} y={392} w={150} h={42} rotate={6} />

          <PaperWrite id="b01-small" x={250} y={24} w={360} h={96} p={writeSmall}>
            <MarkerText x={430} y={92} anchor="middle" lines="hampir" size={48} fill={palette.kraftDeep} />
          </PaperWrite>

          <PaperWrite id="b01-big" x={60} y={110} w={740} h={200} p={writeBig}>
            <MarkerText x={370} y={256} anchor="middle" lines="Rp12 triliun" size={112} fill={palette.marker} />
          </PaperWrite>

          <T x={430} y={352} anchor="middle" size={30} weight={600} fill={palette.kraftDeep} opacity={0.85}>
            anggaran yang disiapkan
          </T>
        </KraftCard>
      </g>

      <g opacity={slipIn} transform={`translate(${(1 - slipIn) * 34} 0)`}>
        <Slip x={170} y={790} w={740} h={140} seed={13} lines={0} rotate={-1.2}>
          <Tape x={300} y={-16} w={130} h={36} rotate={-3} opacity={0.5} />
          <MarkerText x={370} y={92} anchor="middle" lines="untuk 13,3 juta pekerja" size={48} fill={palette.markerRed} />
        </Slip>
      </g>

      {/* kalkulator kertas — tetap kertas, bukan ilustrasi digital */}
      <g opacity={calcIn} transform={`translate(${(1 - calcIn) * 40} ${(1 - calcIn) * 20})`}>
        <Slip x={330} y={980} w={420} h={280} seed={14} lines={0} rotate={1.6} fill={palette.paper}>
          <T x={34} y={46} size={22} weight={700} tracking={2.4} fill={palette.paperShadow}>
            KALKULATOR
          </T>
          <rect x={32} y={64} width={356} height={96} rx={6} fill={palette.paperDeep} opacity={0.85} />
          <PaperWrite id="b01-res" x={44} y={76} w={332} h={76} p={result}>
            <MarkerText x={166} y={132} anchor="middle" lines="9 / 100" size={64} fill={palette.markerRed} />
          </PaperWrite>
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={34 + c * 88}
                y={180 + r * 30}
                width={74}
                height={20}
                rx={4}
                fill={palette.paperShadow}
                opacity={0.35}
              />
            )),
          )}
        </Slip>
      </g>

      <g opacity={line1}>
        <MarkerText x={72} y={1318} lines={['Hanya yang tercatat', 'yang dapat.']} size={52} lineHeight={66} />
        <SketchUnderline x1={72} y={1284} x2={392} p={under} width={7} />
      </g>

      <Pencil x={820} y={1230} s={0.62} rotate={-22} opacity={0.75} />
      <PaperSource text="Anggaran & sasaran: Menko Perekonomian, 30 Sep 2026 · 9/100: hitungan sendiri dari BPS Mei 2026" />
    </SceneShell>
  );
};
