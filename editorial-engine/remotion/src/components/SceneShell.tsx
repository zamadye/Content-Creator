/**
 * SCENE SHELL
 * -----------
 * Every scene is wrapped by the shell so that the frame-level identity is consistent:
 *   - dip in / dip out (editorial transitions, no zoomy slideshow wipes)
 *   - vignette (keeps the eye inside the frame)
 *   - brand mark + "ILUSTRASI" compliance label
 *   - source tag line (numbers on screen always carry their origin)
 *
 * Scenes never draw their own captions: captions are a separate, global layer so that
 * subtitle timing is decoupled from scene design (see pipeline/build-subtitles.ts).
 */
import React from 'react';
import { palette, layout } from '../../../design/tokens';
import { BrandMark, IllustrationTag, SourceTag } from '../typography';
import { fade } from '../animations';
import { useCurrentFrame } from '../runtime';

export const SceneShell: React.FC<{
  durationInFrames: number;
  bg?: string;
  children: React.ReactNode;
  dipIn?: number;
  dipOut?: number;
  vignette?: number;
  showBrand?: boolean;
  illustration?: boolean;
  /** Override opsional untuk tinggi label ILUSTRASI (misi dengan komposisi padat). */
  illustrationY?: number;
  /** Override opsional untuk tinggi baris sumber. */
  sourceY?: number;
  source?: string | null;
  sourceOpacity?: number;
  extra?: React.ReactNode;
}> = ({
  durationInFrames: d,
  bg = palette.ink,
  children,
  dipIn = 8,
  dipOut = 10,
  vignette = 0.9,
  showBrand = true,
  illustration = false,
  illustrationY,
  sourceY,
  source,
  sourceOpacity = 0.6,
  extra,
}) => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 0, dipIn, Math.max(dipIn, d - dipOut), dipOut);
  return (
    <g opacity={opacity}>
      <rect x={0} y={0} width={layout.video.width} height={layout.video.height} fill={bg} />
      {children}
      {/* vignette — subtle, keeps focus away from the platform UI dead zones */}
      <rect x={0} y={0} width={layout.video.width} height={layout.video.height} fill="url(#vignette)" opacity={vignette} />
      {extra}
      {showBrand && (
        <g opacity={0.72}>
          <BrandMark x={layout.safe.side} y={layout.rhythm.brandY} />
        </g>
      )}
      {illustration && <IllustrationTag x={layout.video.width - layout.safe.side - 118} y={illustrationY ?? layout.rhythm.brandY} opacity={0.5} />}
      {source && <SourceTag x={layout.safe.side} y={sourceY ?? layout.rhythm.sourceY} text={source} opacity={sourceOpacity} />}
    </g>
  );
};
