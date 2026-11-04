/** A01 — HOOK. Rp4.106 triliun, anggaran terbesar dalam sejarah; baris yang jarang dibaca: bunga. */
import React from 'react';
import { palette } from '../../../design/tokens';
import { SceneShell } from '../components/SceneShell';
import { KraftCard, MarkerText, PaperBg, PaperHeader, PaperIllustrationTag, PaperSource, PaperWrite, SketchUnderline, Slip, Tape } from '../illustration/topic-paper';
import { T } from '../illustration/primitives';
import { Easing, interpolate, useCurrentFrame } from '../runtime';

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.editorial, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const A01Hook: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const cardIn = seg(f, 0, 12);
  const write = seg(f, d * 0.08, d * 0.3);
  const slip = seg(f, d * 0.34, d * 0.46);
  const word = seg(f, d * 0.62, d * 0.76);
  const under = seg(f, d * 0.78, d * 0.92);
  return (
    <SceneShell durationInFrames={d} bg={palette.paperWarm} showBrand={false} source={null} vignette={0.35}>
      <PaperBg seed={81} />
      <PaperHeader />
      <PaperIllustrationTag />
      <g opacity={cardIn} transform={`translate(0 ${(1 - cardIn) * -40})`}>
        <KraftCard x={110} y={340} w={860} h={360} seed={82} rotate={-1.8}>
          <Tape x={40} y={-24} w={170} h={44} rotate={-10} />
          <Tape x={650} y={344} w={150} h={42} rotate={6} />
          <PaperWrite id="a01-big" x={60} y={90} w={740} h={200} p={write}>
            <MarkerText x={430} y={250} anchor="middle" lines="Rp4.106 triliun" size={84} fill={palette.marker} />
          </PaperWrite>
          <T x={430} y={318} anchor="middle" size={30} weight={600} fill={palette.kraftDeep} opacity={0.85}>
            belanja negara 2027
          </T>
        </KraftCard>
      </g>
      <g opacity={slip}>
        <Slip x={150} y={770} w={780} h={130} seed={83} lines={0} rotate={-1.2}>
          <Tape x={320} y={-16} w={130} h={34} rotate={-3} opacity={0.5} />
          <MarkerText x={390} y={86} anchor="middle" lines="anggaran terbesar dalam sejarah" size={38} fill={palette.markerRed} />
        </Slip>
      </g>
      <g opacity={word}>
        <MarkerText x={540} y={1210} anchor="middle" lines="bunga" size={110} fill={palette.marker} />
        <SketchUnderline x1={330} y={1240} x2={750} p={under} width={9} stroke={palette.brick} />
      </g>
      <PaperSource text="UU APBN 2027, disahkan 29 September 2026 · ilustrasi editorial" />
    </SceneShell>
  );
};
