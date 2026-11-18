import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assetUri} from './library.js';

const views = {
  Depan: [0, 0.51, 1.7],
  Samping: [Math.PI / 2, 0.51, 1.7],
  Belakang: [Math.PI, 0.51, 1.7],
  Wajah: [0.12, 0.89, 0.5],
  Tangan: [0.24, 0.53, 0.95],
  Kaki: [0.2, 0.16, 0.68],
};

function disposeModel(root) {
  const textures = new Set();
  const materials = new Set();
  root.traverse((o) => {
    o.geometry?.dispose();
    o.skeleton?.dispose();
    for (const m of [].concat(o.material || [])) materials.add(m);
  });
  for (const m of materials) {
    for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    m.dispose();
  }
  for (const t of textures) {
    t.source?.data?.close?.();
    t.dispose();
  }
}

export default function ModelInspector({actor}) {
  const canvas = useRef(null);
  const controls = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [clip, setClip] = useState('rest');
  const [view, setView] = useState('Depan');
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [last, setLast] = useState(0);
  useEffect(() => {
    const element = canvas.current;
    let gl;
    try {
      gl = new THREE.WebGLRenderer({canvas: element, antialias: true});
    } catch {
      setError('WebGL tidak tersedia. Unduh GLB untuk memeriksa model.');
      return;
    }
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    gl.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e5e7df');
    scene.add(new THREE.HemisphereLight(0xfffaf4, 0xc6cfc6, 1.8));
    const key = new THREE.DirectionalLight(0xfffaf1, 2.2);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe7f0ff, 1.1);
    rim.position.set(2, 3, -3);
    scene.add(rim);
    const h = actor.bounds.size[1],
      base = actor.bounds.min[1];
    const grid = new THREE.GridHelper(8 * h, 48, 0xb5bdae, 0xcbd0c7);
    grid.position.y = base - 0.008;
    scene.add(grid);
    const camera = new THREE.PerspectiveCamera(39, 1, 0.01, 60);
    const orbit = new OrbitControls(camera, element);
    orbit.minDistance = 0.08 * h;
    orbit.maxDistance = 7 * h;
    let model,
      mixer,
      action,
      animations = [],
      time = 0,
      speed = 1,
      running = false,
      dead = false;
    let tick = 0,
      previous = 0,
      lastShown = -1,
      activeView = 'Depan';
    const draw = () => {
      if (!dead) gl.render(scene, camera);
    };
    const focus = (name) => {
      const [angle, level, distance] = views[name];
      activeView = name;
      const center = new THREE.Vector3(0, base + h * level, 0);
      const joint = {Wajah: 'head', Tangan: 'wristR', Kaki: 'footR'}[name];
      const node = joint && model?.getObjectByName(joint);
      if (node) {
        node.getWorldPosition(center);
        if (name === 'Wajah') center.y += 0.02 * h;
      }
      const radius = (h * distance) / Math.min(1, camera.aspect);
      orbit.target.copy(center);
      camera.position
        .copy(center)
        .add(new THREE.Vector3(Math.sin(angle) * radius, 0.07 * radius, Math.cos(angle) * radius));
      orbit.update();
      draw();
    };
    const resize = new ResizeObserver(() => {
      const {width, height} = element.getBoundingClientRect();
      if (!width || !height) return;
      gl.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      focus(activeView);
    });
    resize.observe(element);
    orbit.addEventListener('change', draw);
    const showTime = () => {
      const value = Math.round(time * 30);
      if (value !== lastShown) {
        lastShown = value;
        setFrame(value);
      }
    };
    const animate = (now) => {
      if (!running || dead) return;
      time = (time + Math.min((now - previous) / 1000, 0.1) * speed) % action.getClip().duration;
      previous = now;
      action.time = time;
      mixer.update(0);
      showTime();
      draw();
      tick = requestAnimationFrame(animate);
    };
    const play = (value) => {
      running = Boolean(value && action);
      setPlaying(running);
      cancelAnimationFrame(tick);
      if (running) {
        previous = performance.now();
        tick = requestAnimationFrame(animate);
      }
    };
    const select = (name) => {
      play(false);
      mixer.stopAllAction();
      action = null;
      time = 0;
      const selected = animations.find((a) => a.name === name);
      if (selected) {
        action = mixer.clipAction(selected);
        action.reset().play();
        action.paused = true;
        mixer.update(0);
      }
      setLast(selected ? Math.round(selected.duration * 30) : 0);
      showTime();
      draw();
      play(Boolean(action));
    };
    controls.current = {
      focus,
      select,
      play,
      speed: (v) => {
        speed = v;
      },
      seek: (f) => {
        play(false);
        time = Math.min(f / 30, action.getClip().duration);
        action.time = time;
        mixer.update(0);
        showTime();
        draw();
      },
    };
    new GLTFLoader().load(
      assetUri(actor.id),
      (gltf) => {
        if (dead) {
          disposeModel(gltf.scene);
          return;
        }
        model = gltf.scene;
        animations = gltf.animations;
        scene.add(model);
        mixer = new THREE.AnimationMixer(model);
        focus('Depan');
        setReady(true);
      },
      undefined,
      (e) => {
        if (!dead) setError('Model gagal dimuat. ' + (e.message || 'Periksa berkas GLB.'));
      },
    );
    return () => {
      dead = true;
      cancelAnimationFrame(tick);
      resize.disconnect();
      orbit.dispose();
      mixer?.stopAllAction();
      if (model) {
        mixer.uncacheRoot(model);
        disposeModel(model);
      }
      grid.geometry.dispose();
      grid.material.dispose();
      gl.dispose();
      gl.forceContextLoss();
      controls.current = null;
    };
  }, [actor]);
  return (
    <div className="model-test">
      <div className="model-stage">
        <canvas ref={canvas} aria-label={'Model 3D ' + actor.title} />
        {(!ready || error) && <p role="status">{error || 'Memuat model…'}</p>}
      </div>
      <div className="model-panel">
        <div className="model-buttons" aria-label="Sudut pemeriksaan">
          {Object.keys(views).map((v) => (
            <button
              key={v}
              disabled={!ready}
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                controls.current.focus(v);
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="model-row">
          <label>
            Klip{' '}
            <select
              aria-label="Klip"
              disabled={!ready}
              value={clip}
              onChange={(e) => {
                setClip(e.target.value);
                controls.current.select(e.target.value);
              }}
            >
              <option value="rest">Pose dasar</option>
              {actor.rig.clips.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button disabled={!last} onClick={() => controls.current.play(!playing)}>
            {playing ? 'Jeda' : 'Putar'}
          </button>
          <label>
            Laju{' '}
            <select
              aria-label="Laju"
              disabled={!last}
              defaultValue="1"
              onChange={(e) => controls.current.speed(Number(e.target.value))}
            >
              <option value=".25">0,25×</option>
              <option value=".5">0,5×</option>
              <option value="1">1×</option>
            </select>
          </label>
        </div>
        <div className="model-row">
          <input
            type="range"
            aria-label="Frame animasi"
            min="0"
            max={last}
            value={frame}
            disabled={!last}
            onChange={(e) => controls.current.seek(Number(e.target.value))}
          />
          <output>
            {frame} / {last} f
          </output>
        </div>
      </div>
    </div>
  );
}
