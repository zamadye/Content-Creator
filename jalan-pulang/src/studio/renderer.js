/**
 * three.js runtime for compiled studio stories.
 *
 * The renderer owns nothing but the scene graph: timing and camera come from
 * compile.js, so a shot never "drifts" between the CLI preview and the film.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {asset} from './library.js';

export const LOOKS = {
  'kampung-siang': {sky: 0x9fb6c4, fog: 0x8fa7b4, sun: 0xfff2dd, sunIntensity: 2.6, hemi: 1.1, exposure: 1.0},
  'kampung-sore': {sky: 0xd9a06a, fog: 0xc08a5c, sun: 0xffb066, sunIntensity: 2.2, hemi: 0.9, exposure: 1.05},
  'kampung-malam': {sky: 0x0a1018, fog: 0x070c12, sun: 0x9fb4d8, sunIntensity: 0.35, hemi: 0.28, exposure: 1.25},
  'interior-lampu': {sky: 0x120d08, fog: 0x0d0a07, sun: 0xffb066, sunIntensity: 0.55, hemi: 0.32, exposure: 1.2},
  'hutan-pagi': {sky: 0x8aa08a, fog: 0x7d937f, sun: 0xfff0d0, sunIntensity: 2.0, hemi: 1.0, exposure: 1.0},
  industri: {sky: 0x8d97a0, fog: 0x7b848c, sun: 0xf2f4f8, sunIntensity: 2.4, hemi: 1.0, exposure: 1.0},
};

export const LIGHTS = {
  siang: {color: 0xfff4e2, intensity: 2.6, elevation: 0.85, azimuth: -0.6},
  sore: {color: 0xffb066, intensity: 2.2, elevation: 0.28, azimuth: -0.95},
  malam: {color: 0x8fa6c8, intensity: 0.28, elevation: 0.6, azimuth: 0.4},
  'lampu-teplok': {color: 0xffb45a, intensity: 0.55, elevation: 0.35, azimuth: 0.3},
  neon: {color: 0xff5fa2, intensity: 0.7, elevation: 0.45, azimuth: -0.2},
  bulan: {color: 0xa8c0e0, intensity: 0.22, elevation: 0.75, azimuth: 0.2},
  fajar: {color: 0xffd0a0, intensity: 1.1, elevation: 0.12, azimuth: -1.2},
};

export const DEFAULT_BASE_URL = '/';

/**
 * three.js sanitises node names for animation binding (dots are stripped), so
 * "anchor.hand.L" becomes "anchorhandL". Resolve anchors by sanitised name.
 */
export const sanitizeNodeName = (name) => String(name).replace(/[\[\]\.:/ ]/g, '');

export function findAnchor(root, name) {
  const want = sanitizeNodeName(name);
  let found = null;
  root.traverse((o) => {
    if (!found && sanitizeNodeName(o.name) === want) found = o;
  });
  return found;
}

export class StudioRenderer {
  constructor({compiled, canvas, baseUrl = DEFAULT_BASE_URL, onProgress, pixelRatio = 1}) {
    this.compiled = compiled;
    this.canvas = canvas;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.onProgress = onProgress ?? (() => {});
    this.pixelRatio = pixelRatio;
    this.instances = new Map(); // instanceKey -> {root, mixer, clipNames}
    this.placements = new Map(); // shotIndex -> [instanceKey]
    this.templateCache = new Map();
    this.disposed = false;
  }

  async init() {
    const {width, height, fps} = this.compiled;
    this.fps = fps;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(2, this.pixelRatio));
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 400);
    this.hemi = new THREE.HemisphereLight(0xbfd4e6, 0x2c2a24, 1);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 60;
    const d = 14;
    Object.assign(this.sun.shadow.camera, {left: -d, right: d, top: d, bottom: -d});
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.applyLook(this.compiled.look);

    const ids = [...new Set(this.compiled.assetIds)];
    let done = 0;
    await Promise.all(
      ids.map(async (id) => {
        await this.loadTemplate(id);
        done += 1;
        this.onProgress(done / ids.length, id);
      }),
    );

    for (const shot of this.compiled.shots) this.buildShot(shot);
    this.update(0);
    return this;
  }

  async loadTemplate(assetId) {
    if (this.templateCache.has(assetId)) return this.templateCache.get(assetId);
    const uri = `${this.baseUrl}${asset(assetId).uri}`;
    const gltf = await new Promise((resolve, reject) => {
      new GLTFLoader().load(uri, resolve, undefined, (e) => reject(new Error(`failed to load ${uri}: ${e?.message ?? e}`)));
    });
    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) {
          o.material.side = o.material.transparent ? THREE.DoubleSide : THREE.FrontSide;
          if (o.material.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    });
    const tpl = {scene: gltf.scene, animations: gltf.animations ?? []};
    this.templateCache.set(assetId, tpl);
    return tpl;
  }

  buildShot(shot) {
    const keys = [];
    const add = (key, assetId, {at, yaw = 0, scale = 1, clip, speed = 1, travel = 0, offset = 0, rot = 0}) => {
      const tpl = this.templateCache.get(assetId);
      if (!tpl) return;
      const root = cloneSkeleton(tpl.scene);
      root.position.set(at[0], at[1], at[2]);
      root.rotation.y = yaw + rot;
      root.scale.setScalar(scale);
      root.visible = false;
      this.scene.add(root);
      let mixer = null;
      if (clip && tpl.animations.length) {
        const found = THREE.AnimationClip.findByName(tpl.animations, clip) ?? tpl.animations[0];
        mixer = new THREE.AnimationMixer(root);
        const action = mixer.clipAction(found);
        action.play();
        action.setEffectiveWeight(1);
      }
      this.instances.set(key, {root, mixer, assetId, clip: clip ?? null, speed, offset, at, yaw, travel});
      keys.push(key);
    };

    for (const item of shot.set ?? []) {
      if (item.hidden) continue;
      add(`set:${shot.id}:${item.asset}:${item.at.join(',')}`, item.asset, {
        at: item.at,
        rot: item.rot ?? 0,
        scale: item.scale ?? 1,
        clip: item.clip,
      });
    }
    for (const c of shot.cast) {
      if (c.hidden) continue;
      add(`cast:${shot.id}:${c.ref}`, c.assetId, {at: c.at, yaw: c.yaw, clip: c.clip, speed: c.speed, travel: c.travel, offset: c.offset});
    }
    for (const o of shot.objectPlacements) {
      if (o.hidden) continue;
      add(`obj:${shot.id}:${o.ref}`, o.assetId, {at: o.at, rot: o.rot, scale: o.scale});
    }
    this.placements.set(shot.index, keys);
  }

  applyLook(look) {
    const preset = LOOKS[look.preset] ?? LOOKS['kampung-siang'];
    this.scene.background = new THREE.Color(preset.sky);
    this.scene.fog = new THREE.FogExp2(new THREE.Color(preset.fog), Math.max(0.0001, look.fog ?? 0.02));
    this.hemi.color.set(preset.sky);
    this.hemi.intensity = preset.hemi;
    this.renderer.toneMappingExposure = (look.exposure ?? 1) * preset.exposure;
  }

  applyShotLight(light) {
    const preset = LIGHTS[light.preset] ?? LIGHTS.siang;
    this.sun.color.set(preset.color);
    this.sun.intensity = preset.intensity * (light.intensity ?? 1);
    const el = preset.elevation;
    const az = preset.azimuth;
    const r = 18;
    this.sun.position.set(Math.cos(el) * Math.sin(az) * r, Math.sin(el) * r, Math.cos(el) * Math.cos(az) * r);
    this.sun.target.position.set(0, 0, 0);
    this.sun.castShadow = preset.intensity > 0.5;
  }

  shotAtFrame(frame) {
    const {shots} = this.compiled;
    let lo = 0;
    let hi = shots.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (shots[mid].from <= frame) lo = mid;
      else hi = mid - 1;
    }
    return shots[lo];
  }

  update(frame) {
    if (this.disposed) return;
    const shot = this.shotAtFrame(frame);
    this.activeShot = shot;
    const local = frame - shot.from;
    const u = shot.durationInFrames > 1 ? local / (shot.durationInFrames - 1) : 0;
    const seconds = local / this.fps;

    for (const [index, keys] of this.placements) {
      const active = index === shot.index;
      for (const key of keys) {
        const inst = this.instances.get(key);
        if (!inst) continue;
        inst.root.visible = active;
        if (!inst.mixer) continue;
        if (active) {
          inst.mixer.setTime(seconds * inst.speed + inst.offset);
          // travel: world-space movement along `facing`. In-place locomotion
          // clips slide exactly as fast as the actor fails to move, so this is
          // the knob that stops foot sliding.
          if (inst.travel) {
            inst.root.position.set(
              inst.at[0] + Math.sin(inst.yaw) * inst.travel * seconds,
              inst.at[1],
              inst.at[2] + Math.cos(inst.yaw) * inst.travel * seconds,
            );
          }
        } else {
          inst.mixer.setTime(0);
          inst.root.position.set(inst.at[0], inst.at[1], inst.at[2]);
        }
      }
    }

    this.applyShotLight(shot.light);
    const cam = shot.cameraSample(Math.min(1, Math.max(0, u)));
    this.camera.fov = cam.fov;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(cam.position[0], cam.position[1], cam.position[2]);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
    if (cam.roll) this.camera.rotateZ(cam.roll);

    // keep the shadow box centred on the action
    this.sun.target.position.set(cam.target[0], 0, cam.target[2]);
    this.sun.target.updateMatrixWorld();
  }

  draw(frame) {
    this.update(frame);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    for (const inst of this.instances.values()) {
      inst.mixer?.stopAllAction();
      this.scene?.remove(inst.root);
    }
    this.instances.clear();
    this.placements.clear();
    this.templateCache.clear();
    this.renderer?.dispose();
  }
}

export async function createStudioRenderer(opts) {
  const r = new StudioRenderer(opts);
  await r.init();
  return r;
}
