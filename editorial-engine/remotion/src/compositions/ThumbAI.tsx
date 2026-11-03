/**
 * ThumbAI — sampul paket unggah (9:16) dan poster arsip (4:5)
 * -----------------------------------------------------------
 * Gambar dibuat dengan model gambar (sinematik), BUKAN potongan frame video.
 * Komposisi ini hanya menambahkan: scrim agar teks terbaca, tagline satir,
 * penanda merek, label ILUSTRASI, dan satu penanda kejujuran di area kode:
 * kode pada gambar ilustrasi tidak aktif — supaya tidak ada yang memindainya.
 */
import React from 'react';
import { palette, type as t } from '../../../design/tokens';
import { Rect, T } from '../illustration/primitives';
import { BrandMark } from '../typography';

export type ThumbAIProps = {
  /** data:image/png;base64,... — disematkan supaya render offline dan deterministik. */
  imageDataUri: string;
  kicker: string;
  tagline: string[];
  source?: string;
  /** Penanda kejujuran opsional. Hanya dipakai kalau gambar memuat elemen yang bisa disalahgunakan
   *  (mis. kode yang tampak dapat dipindai). Kosongkan untuk gambar yang tidak memuatnya. */
  plate?: string;
  width?: number;
  height?: number;
};

export const ThumbAI: React.FC<ThumbAIProps> = ({
  imageDataUri,
  kicker,
  tagline,
  source,
  plate,
  width = 1080,
  height = 1920,
}) => {
  const side = Math.round(width * 0.0667); // 72 px pada lebar 1080
  const display = Math.round(height * 0.0497); // ±95 px pada tinggi 1920
  const micro = Math.round(height * 0.0112); // ±21 px

  return (
    <g>
      <defs>
        <linearGradient id="thumb-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ink} stopOpacity={0.94} />
          <stop offset="34%" stopColor={palette.ink} stopOpacity={0.86} />
          <stop offset="62%" stopColor={palette.ink} stopOpacity={0.55} />
          <stop offset="82%" stopColor={palette.ink} stopOpacity={0.22} />
          <stop offset="100%" stopColor={palette.ink} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="thumb-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={palette.ink} stopOpacity={0.34} />
          <stop offset="100%" stopColor={palette.ink} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="thumb-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ink} stopOpacity={0} />
          <stop offset="70%" stopColor={palette.ink} stopOpacity={0.72} />
          <stop offset="100%" stopColor={palette.ink} stopOpacity={0.96} />
        </linearGradient>
      </defs>

      {/* gambar sinematik penuh bingkai */}
      <image
        href={imageDataUri}
        x={0}
        y={0}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* scrim atas untuk tagline */}
      <Rect x={0} y={0} w={width} h={Math.round(height * 0.52)} fill="url(#thumb-top)" />
      {/* scrim bawah untuk merek & sumber */}
      <Rect x={0} y={Math.round(height * 0.8)} w={width} h={Math.round(height * 0.2)} fill="url(#thumb-bottom)" />
      {/* tepi kiri: gradien, bukan pita gelap (pita keras terlihat sebagai sambungan) */}
      <Rect x={0} y={0} w={Math.round(width * 0.34)} h={height} fill="url(#thumb-left)" />

      {/* kejujuran: hanya kalau gambar memuat elemen yang bisa disalahgunakan */}
      {plate && (
      <g opacity={0.86}>
        <Rect
          x={Math.round(width * 0.245)}
          y={Math.round(height * 0.726)}
          w={Math.round(width * 0.4)}
          h={Math.round(height * 0.032)}
          r={2}
          fill={palette.ink}
          opacity={0.82}
        />
        <T x={Math.round(width * 0.245) + 12} y={Math.round(height * 0.749)} size={micro - 4} weight={700} tracking={2} fill={palette.mustard}>
          {plate}
        </T>
      </g>
      )}

      {/* tagline satir */}
      <T x={side} y={Math.round(height * 0.113)} size={micro} weight={700} tracking={4.2} fill={palette.mustard}>
        {kicker}
      </T>
      {tagline.map((line, i) => (
        <T
          key={line}
          x={side}
          y={Math.round(height * (0.168 + i * 0.066))}
          size={display}
          family={t.display}
          fill={i === tagline.length - 1 ? palette.mustard : palette.paper}
          tracking={-2.4}
        >
          {line}
        </T>
      ))}

      {/* merek + label ilustrasi + sumber */}
      <BrandMark x={side} y={Math.round(height * 0.945)} />
      <T x={width - side} y={Math.round(height * 0.945)} size={micro - 2} weight={700} tracking={3.6} fill={palette.paper} anchor="end" opacity={0.55}>
        ILUSTRASI
      </T>
      {source && (
        <T x={side} y={Math.round(height * 0.978)} size={micro - 4} weight={500} fill={palette.paper} opacity={0.5}>
          {source}
        </T>
      )}
    </g>
  );
};
