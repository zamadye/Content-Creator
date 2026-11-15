/**
 * Camera vocabulary. Every shot names one preset plus optional explicit points;
 * sampleCamera() turns that into a deterministic camera for u in [0, 1].
 * No three.js here on purpose: the pure math is unit-testable in Node.
 */

export const FACING_VECTORS = {
  '+Z': [0, 0, 1],
  '-Z': [0, 0, -1],
  '+X': [1, 0, 0],
  '-X': [-1, 0, 0],
};

export const EYE_HEIGHT = 1.62;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const smoothstep = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Clamped, deterministic hand-held wobble: 3 out-of-phase sines, no RNG. */
export function handheldOffset(u, seed = 0, amount = 0.035) {
  if (!amount) return [0, 0, 0];
  const p = u * Math.PI * 2;
  return [
    amount * (Math.sin(p * 1.7 + seed) * 0.5 + Math.sin(p * 3.1 + seed * 1.7) * 0.3),
    amount * (Math.sin(p * 2.3 + seed * 2.1) * 0.4 + Math.sin(p * 4.7 + seed) * 0.2),
    amount * Math.sin(p * 1.3 + seed * 0.7) * 0.3,
  ];
}

/**
 * @param shot normalized shot (see schema.js)
 * @param u 0..1 progress inside the shot
 * @param ctx {subject:[x,y,z], seed:number}
 */
export function sampleCamera(shot, u, ctx = {}) {
  const cam = shot.camera ?? {};
  const subject = ctx.subject ?? [0, 0, 0];
  const seed = ctx.seed ?? 0;
  const preset = cam.preset ?? 'static';
  const chest = add(subject, [0, 1.15, 0]);
  const eye = add(subject, [0, EYE_HEIGHT, 0]);
  const t = smoothstep(u);

  let from;
  let to;
  let target = cam.target ?? chest;
  let roll = cam.roll ?? 0;

  switch (preset) {
    case 'dolly-in':
      from = cam.from ?? add(chest, [0, 0.15, 4.2]);
      to = cam.to ?? add(chest, [0, 0.05, 1.7]);
      break;
    case 'dolly-out':
      from = cam.from ?? add(chest, [0, 0.05, 1.7]);
      to = cam.to ?? add(chest, [0, 0.15, 4.6]);
      break;
    case 'pan': {
      const side = cam.side === '-X' ? -1 : 1;
      from = cam.from ?? add(chest, [-2.4 * side, 0.1, 3.4]);
      to = cam.to ?? add(chest, [1.8 * side, 0.1, 3.4]);
      break;
    }
    case 'orbit': {
      const radius = cam.radius ?? 3.4;
      const start = (cam.startAngle ?? -35) * (Math.PI / 180);
      const arc = (cam.arc ?? 55) * (Math.PI / 180);
      const a = start + arc * t;
      from = add(chest, [Math.sin(a) * radius, 0.12, Math.cos(a) * radius]);
      to = from;
      break;
    }
    case 'crane-up':
      from = cam.from ?? add(subject, [0.2, 0.55, 4.0]);
      to = cam.to ?? add(subject, [0.2, 3.4, 4.8]);
      break;
    case 'low-angle':
      from = cam.from ?? add(subject, [0.15, 0.42, 2.0]);
      target = cam.target ?? add(subject, [0, 1.35, 0]);
      to = from;
      break;
    case 'over-shoulder':
      from = cam.from ?? add(subject, [0.42, 1.52, -1.9]);
      target = cam.target ?? add(subject, [0, 1.35, 2.4]);
      to = from;
      break;
    case 'handheld':
    case 'static':
    default:
      from = cam.from ?? add(chest, [0.5, 0.28, 3.1]);
      to = cam.to ?? from;
      break;
  }

  const shake = (cam.shake ?? 0) + (preset === 'handheld' ? 0.8 : 0);
  const travelling = cam.to !== undefined || ['dolly-in', 'dolly-out', 'pan', 'crane-up', 'orbit'].includes(preset);
  let position = travelling ? lerp(from, to, t) : from;
  if (shake > 0) position = add(position, handheldOffset(u, seed, 0.045 * shake));

  return {
    position: position.map((v) => Number(v.toFixed(4))),
    target: target.map((v) => Number(v.toFixed(4))),
    fov: cam.fov ?? 40,
    roll,
    preset,
  };
}

/** Where the camera should look by default: the closest actor's chest. */
export function shotSubject(shot, castPositions = {}) {
  const visible = (shot.actors ?? []).filter((a) => !a.hidden);
  if (!visible.length) return [0, 0, 0];
  const p = castPositions[visible[0].ref] ?? visible[0].at ?? [0, 0, 0];
  return [p[0], p[1], p[2]];
}

export function facingVector(facing) {
  return FACING_VECTORS[facing] ?? FACING_VECTORS['+Z'];
}

export function facingYaw(facing) {
  const v = facingVector(facing);
  return Math.atan2(v[0], v[2]);
}

export {add, sub, mul, lerp};
