/**
 * PaperCover — sampul paket unggah (9:16) dan poster arsip (4:5) untuk misi kolase kertas.
 * ------------------------------------------------------------------------------------
 * Bukan potongan frame video dan bukan gambar model: sampul ini digambar dengan
 * komponen yang sama dengan filmnya (kertas kusut, kardus kraft, spidol), supaya
 * orang yang melihat sampul langsung mendapat janji visual yang sama dengan isinya.
 *
 * Satu ide per sampul: angkanya kecil karena harian — tagmenyerang lewat perkalian.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { T } from '../illustration/primitives';
import { KraftCard, MarkerText, PaperBg, SketchCircle, SketchUnderline, Tape, TornCard } from '../illustration/topic-paper';

export type PaperCoverProps = {
  kicker: string;
  tagline: string[];
  note: string;
  width?: number;
  height?: number;
};

export const PaperCover: React.FC<PaperCoverProps> = ({ kicker, tagline, note, width = 1080, height = 1920 }) => {
  const W = width;
  const H = height;
  const side = Math.round(W * 0.0667);
  const big = Math.round(H * 0.2);
  // ukuran tagline dihitung dari lebar kartu dan panjang baris terpanjang,
  // supaya tidak pernah keluar tepi (kesalahan yang paling sering di sampul).
  const longest = Math.max(...tagline.map((l) => l.length), 1);
  const tag = Math.min(Math.round(H * 0.072), Math.round(((W - side * 2) * 0.9) / (longest * 0.58)));
  const cardX = Math.round(W * 0.055);
  const cardW = W - cardX * 2;
  const cardY = Math.round(H * 0.17);
  const cardH = Math.round(H * 0.44);

  return (
    <g>
      <PaperBg w={W} h={H} seed={21} dark={0.02} creases={8} />

      {/* kertas sobek besar: satu angka, sebesar mungkin */}
      <KraftCard x={cardX} y={cardY} w={cardW} h={cardH} seed={5} rotate={-2.6}>
        <Tape x={Math.round(cardW * 0.08)} y={-26} w={170} h={46} rotate={-11} />
        <Tape x={Math.round(cardW * 0.72)} y={cardH - 26} w={150} h={42} rotate={8} />

        <MarkerText x={cardW / 2} y={Math.round(cardH * 0.56)} lines="0,3%" size={big} anchor="middle" fill={palette.marker} />
        <MarkerText x={cardW / 2} y={Math.round(cardH * 0.82)} lines="per hari" size={Math.round(big * 0.42)} anchor="middle" fill={palette.markerRed} />
        <SketchCircle cx={cardW / 2} cy={Math.round(cardH * 0.775)} rx={Math.round(cardW * 0.31)} ry={Math.round(cardH * 0.13)} p={1} seed={7} width={8} />
      </KraftCard>

      <T x={side} y={Math.round(H * 0.075)} size={Math.round(H * 0.0135)} weight={700} tracking={4.4} fill="#4A453C" opacity={0.65}>
        {kicker}
      </T>

      {/* tagline: dua baris, tangan, kontras tinggi */}
      <g>
        <TornCard x={side - 12} y={Math.round(cardY + cardH + H * 0.035)} w={W - side * 2 + 24} h={Math.round(H * 0.155)} seed={12} fill={palette.paper} rotate={1.4} jag={6} shadow={0.18}>
          <MarkerText
            x={(W - side * 2 + 24) / 2}
            y={Math.round(tag * 1.15)}
            lines={tagline}
            size={tag}
            anchor="middle"
            lineHeight={Math.round(tag * 1.12)}
            fill={palette.marker}
          />
          <SketchUnderline x1={Math.round((W - side * 2) * 0.24)} y={Math.round(tag * 2.42)} x2={Math.round((W - side * 2) * 0.76)} p={1} width={8} />
        </TornCard>
      </g>

      <T x={side} y={Math.round(H - H * 0.075)} size={Math.round(H * 0.0086)} weight={600} tracking={0.4} fill="#5B5548" opacity={0.7}>
        {note}
      </T>
      <T x={side} y={Math.round(H - H * 0.045)} size={Math.round(H * 0.0086)} weight={700} tracking={3.6} fill="#4A453C" opacity={0.55}>
        SUARA PUBLIK · ILUSTRASI EDITORIAL
      </T>
    </g>
  );
};
