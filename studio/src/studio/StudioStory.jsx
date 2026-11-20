import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {compileStory} from './compile.js';
import {registry} from './library.js';
import {createStudioRenderer} from './renderer.js';

/** Remotion metadata: duration/size come from the story itself. */
export const studioMetadata = ({props}) => {
  const compiled = compileStory(props.story, {registry});
  return {
    durationInFrames: compiled.durationInFrames,
    fps: compiled.fps,
    width: compiled.width,
    height: compiled.height,
  };
};

/** Jeda masuk sebelum VO mulai, dalam frame (0,45 detik @30 fps). */
const VO_LEAD_IN_FRAMES = 14;

const SUBTITLE = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '8%',
  textAlign: 'center',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 46,
  lineHeight: 1.25,
  color: '#f4f1e8',
  textShadow: '0 2px 12px rgba(0,0,0,0.85)',
  padding: '0 12%',
};

const TITLE = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '38%',
  textAlign: 'center',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 96,
  letterSpacing: '-0.02em',
  fontWeight: 600,
  color: '#f8f5ec',
  textShadow: '0 6px 30px rgba(0,0,0,0.9)',
};

/**
 * Renders a compiled studio story with three.js.
 * `story` is the same JSON an agent authors and validates — no glue code needed.
 */
export const StudioStory = ({story, hud = false, text = true}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const compiled = useMemo(() => compileStory(story, {registry}), [story]);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('studio: loading story assets'));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const renderer = await createStudioRenderer({
        compiled,
        canvas: canvasRef.current,
        baseUrl: staticFile(''),
        pixelRatio: 1,
        cutout: Boolean(story.backdrops),
      });
      if (cancelled) {
        renderer.dispose();
        return;
      }
      rendererRef.current = renderer;
      renderer.draw(0);
      setReady(true);
      continueRender(handle);
    })().catch((err) => {
      // Never deadlock a render: surface the failure and let Remotion continue.
      // eslint-disable-next-line no-console
      console.error('[studio] failed to initialise', err);
      continueRender(handle);
    });
    return () => {
      cancelled = true;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [compiled, handle]);

  useEffect(() => {
    if (!ready) return;
    rendererRef.current?.draw(frame);
  }, [frame, ready]);

  const shot = compiled.shots.find((s) => frame >= s.from && frame < s.from + s.durationInFrames) ?? compiled.shots[0];
  // Latar ilustrasi 2D: satu gambar per lokasi, digerakkan perlahan (Ken Burns)
  // supaya shot terasa hidup tanpa kamera 3D menyentuh set.
  const backdropId = shot?.backdrop ?? (story.backdrops ? Object.keys(story.backdrops)[0] : null);
  const backdrop = story.backdrops?.[backdropId] ?? null;
  const localFrame = shot ? frame - shot.from : 0;
  const u = shot && shot.durationInFrames > 1 ? localFrame / (shot.durationInFrames - 1) : 0;
  const motion = shot?.backdropMotion ?? {zoom: [1.02, 1.08], drift: [0, -0.012]};
  const zoom = motion.zoom ? motion.zoom[0] + (motion.zoom[1] - motion.zoom[0]) * u : 1;
  // drift dalam persen (bukan fraksi): nilai kecil = gerak halus 1–2 % per shot
  const driftX = motion.drift ? motion.drift[0] * u : 0;
  const driftY = motion.drift ? motion.drift[1] * u : 0;
  // VO tiap baris diletakkan sebagai klip terpisah dengan jeda masuk/keluar,
  // supaya editor bisa memotong per dialog tanpa memotong satu tarikan napas.
  const leadIn = VO_LEAD_IN_FRAMES;
  const voClips = (compiled.audio || []).filter((a) => a.vo);
  const activeText = text && shot?.text ? shot.text : null;

  return (
    <AbsoluteFill style={{backgroundColor: '#05080a', overflow: 'hidden'}}>
      {backdrop ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${staticFile(backdrop.image)})`,
            backgroundSize: 'cover',
            backgroundPosition: backdrop.anchor
              ? `${backdrop.anchor[0] * 100}% ${backdrop.anchor[1] * 100}%`
              : '50% 55%',
            transform: `scale(${zoom}) translate(${driftX}%, ${driftY}%)`,
            transformOrigin: '50% 55%',
            zIndex: 0,
          }}
        />
      ) : null}
      {voClips.map((a) => (
        <Sequence key={a.shotId} from={a.from + leadIn} durationInFrames={Math.max(1, a.durationInFrames - leadIn)}>
          <Audio src={staticFile(a.vo)} />
        </Sequence>
      ))}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, filter: 'drop-shadow(0 10px 18px rgba(24,12,4,0.45))'}}
      />
      {activeText && activeText.style === 'subtitle' ? <div style={{...SUBTITLE, zIndex: 3}}>{activeText.value}</div> : null}
      {activeText && activeText.style === 'title' ? <div style={TITLE}>{activeText.value}</div> : null}
      {activeText && (activeText.style === 'caption' || activeText.style === 'sign') ? (
        <div style={{...SUBTITLE, fontSize: 34, bottom: '5%', color: '#e8e2d2', zIndex: 3}}>{activeText.value}</div>
      ) : null}
      {hud ? (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 28,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 20,
            color: '#9fe8c0',
            textShadow: '0 2px 8px #000',
          }}
        >
          {compiled.id} · shot {shot?.id} · f{frame} · cam:{shot?.camera.preset} ·{' '}
          {shot?.cast.map((c) => `${c.ref}:${c.clip}`).join(' ')}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default StudioStory;
