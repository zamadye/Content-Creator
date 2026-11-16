import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
  const activeText = text && shot?.text ? shot.text : null;

  return (
    <AbsoluteFill style={{backgroundColor: '#05080a'}}>
      <canvas ref={canvasRef} width={width} height={height} style={{width: '100%', height: '100%'}} />
      {activeText && activeText.style === 'subtitle' ? <div style={SUBTITLE}>{activeText.value}</div> : null}
      {activeText && activeText.style === 'title' ? <div style={TITLE}>{activeText.value}</div> : null}
      {activeText && (activeText.style === 'caption' || activeText.style === 'sign') ? (
        <div style={{...SUBTITLE, fontSize: 34, bottom: '5%', color: '#e8e2d2'}}>{activeText.value}</div>
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
