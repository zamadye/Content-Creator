import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Sequence, cancelRender, staticFile, useCurrentFrame, useDelayRender, useVideoConfig, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AnimationMixer, Box3, Group, LoopRepeat, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

const MODEL = "assets/ls0020-revisi-01/models/";

const BEATS = [
  { start: 0, duration: 132, text: "Pukul dua, anak saya berbisik: Ayah tadi sudah masuk.", place: "doorway" },
  { start: 132, duration: 135, text: "Saya baru pulang lembur; kunci depan masih di tangan.", place: "keys" },
  { start: 267, duration: 135, text: "Istri saya masih tidur. Siapa yang tadi masuk?", place: "bed" },
  { start: 402, duration: 153, text: "Di kamar, jejak kaki basah berhenti di sisi ranjang.", place: "prints" },
  { start: 555, duration: 138, text: "Sepatu saya masih kering; jejak itu tak menuju pintu.", place: "shoes" },
  { start: 693, duration: 165, text: "Anak saya menunjuk lorong: Yang tadi tidak berkedip. Kamu percaya?", place: "hall" },
  { start: 858, duration: 150, text: "Saya kunci kamar. Dari depan, kunci berdenting tiga kali.", place: "lock" },
  { start: 1008, duration: 150, text: "Suara saya dari luar berkata: Buka. Aku ketinggalan.", place: "outside" },
  { start: 1158, duration: 150, text: "Anak saya menggenggam tangan saya: Ayah yang mana?", place: "hands" },
  { start: 1308, duration: 192, text: "Kalau pukul dua terdengar suara Ayah dari luar, kamu buka? Tulis komentarmu.", place: "loop" },
] as const;
const FPS = 30;
const TOTAL_FRAMES = 1500;

const fitObject = (source: Group, targetHeight: number, zUp = false) => {
  if (zUp) source.rotation.x = -Math.PI / 2;
  source.updateMatrixWorld(true);
  const initial = new Box3().setFromObject(source);
  const size = initial.getSize(new Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);
  source.scale.setScalar(scale);
  source.updateMatrixWorld(true);
  const fittedBounds = new Box3().setFromObject(source);
  const center = fittedBounds.getCenter(new Vector3());
  source.position.x -= center.x;
  source.position.y -= fittedBounds.min.y;
  source.position.z -= center.z;
  source.updateMatrixWorld(true);
  return source;
};

const AnimatedFigure: React.FC<{
  height: number;
  position: [number, number, number];
  rotationY?: number;
  movement?: "approach" | "sway" | "point" | "sleep" | "tremble" | "still";
  offset?: number;
}> = ({ height, position, rotationY = 0, movement = "sway", offset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame + offset) / fps;
  const scale = height / 1.8;
  const sway = Math.sin(t * 2.1) * (movement === "tremble" ? 0.045 : 0.018);
  const step = movement === "approach" ? Math.min(0.8, (frame + offset) / fps * 0.2) : 0;
  const point = movement === "point" ? Math.sin(t * 2) * 0.07 : 0;
  const sleep = movement === "sleep" ? Math.PI / 2 : 0;
  const armPoint = movement === "point" ? -0.45 + Math.sin(t * 2) * 0.06 : Math.sin(t * 2.3) * (movement === "tremble" ? 0.09 : 0.035);
  const skin = "#74685c";
  const clothes = "#44464b";
  return (
    <group position={[position[0] - step, position[1], position[2]]} rotation={[sleep, rotationY + sway + point, 0]} scale={scale}>
      <mesh position={[0, 0.96, 0]} castShadow>
        <capsuleGeometry args={[0.19, 0.48, 5, 10]} />
        <meshStandardMaterial color={clothes} roughness={0.92} emissive="#101114" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.145, 18, 14]} />
        <meshStandardMaterial color={skin} roughness={0.94} emissive="#17120e" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.12, 12]} />
        <meshStandardMaterial color={skin} roughness={0.95} />
      </mesh>
      <group position={[-0.27, 1.12, 0]} rotation={[0, 0, 0.15 + armPoint]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.38, 4, 8]} />
          <meshStandardMaterial color={clothes} roughness={0.94} />
        </mesh>
      </group>
      <group position={[0.27, 1.12, 0]} rotation={[0, 0, -0.15 - armPoint]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.38, 4, 8]} />
          <meshStandardMaterial color={clothes} roughness={0.94} />
        </mesh>
      </group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.11, 0.38, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.5, 4, 8]} />
          <meshStandardMaterial color={clothes} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
};

const Prop: React.FC<{
  gltf: GLTF;
  file: string;
  height: number;
  position: [number, number, number];
  rotationY?: number;
  animate?: boolean;
}> = ({ gltf, file, height, position, rotationY = 0, animate = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const object = useMemo(() => {
    const instance = cloneSkinned(gltf.scene) as Group;
    instance.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        const materialName = material.name.toLowerCase();
        if (file === "SheenChair.glb") {
          material.color.set(materialName.includes("fabric") ? "#554b47" : materialName.includes("wood") ? "#49382e" : "#716656");
        }
        if (file === "DiffuseTransmissionPlant.glb" && materialName.includes("leaves")) {
          material.color.set("#63715e");
        }
      }
    });
    return instance;
  }, [gltf.scene, file]);
  const mixer = useMemo(() => new AnimationMixer(object), [object]);
  const action = useMemo(() => {
    if (!gltf.animations.length) return null;
    const a = mixer.clipAction(gltf.animations[0]);
    a.setLoop(LoopRepeat, Infinity);
    a.play();
    return a;
  }, [gltf.animations, mixer]);
  const fitted = useMemo(() => fitObject(object, height), [object, height]);
  if (action && animate) mixer.setTime(frame / fps);
  const sway = animate ? Math.sin(frame / fps * 1.4) * 0.035 : 0;
  return (
    <group position={position} rotation={[0, rotationY + sway, 0]}>
      <primitive object={fitted} />
    </group>
  );
};

const Door: React.FC<{ place: string }> = ({ place }) => {
  const frame = useCurrentFrame();
  const local = frame % 150;
  const opening = place === "outside" || place === "loop"
    ? interpolate(local, [0, 100, 150], [0.01, 0.01, 0.22], { extrapolateRight: "clamp" })
    : place === "lock"
      ? interpolate(local, [15, 55, 90], [0, 0.12, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
      : Math.sin(local / 150 * Math.PI * 2) * 0.008;
  const knobTurn = place === "lock" || place === "outside" ? Math.sin(local * 0.11) * 0.18 : 0;
  return (
    <group position={[0.65, 0, -4.25]}>
      <mesh position={[0, 1.6, -0.04]}>
        <boxGeometry args={[1.35, 3.2, 0.12]} />
        <meshStandardMaterial color="#302a24" roughness={0.78} metalness={0.08} />
      </mesh>
      <group position={[-0.62, 0, 0.05]} rotation={[0, -opening, 0]}>
        <mesh position={[0.67, 1.5, 0]} castShadow>
          <boxGeometry args={[1.3, 3.0, 0.08]} />
          <meshStandardMaterial color="#40332b" roughness={0.66} metalness={0.04} />
        </mesh>
        <mesh position={[1.12, 1.35, 0.09]} rotation={[0, 0, knobTurn]}>
          <sphereGeometry args={[0.075, 16, 12]} />
          <meshStandardMaterial color="#a17c4f" roughness={0.3} metalness={0.78} />
        </mesh>
        <mesh position={[1.1, 1.35, 0.04]}>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 20]} />
          <meshStandardMaterial color="#4d3d2a" roughness={0.25} metalness={0.8} />
        </mesh>
      </group>
      <pointLight position={[0, 2.0, 0.8]} color="#526985" intensity={place === "outside" || place === "loop" ? 4.2 : 2.4} distance={5.5} />
    </group>
  );
};

const KeyRing: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const swing = Math.sin(t * 8) * 0.48;
  const turn = Math.sin(t * 5.2) * 0.38;
  return (
    <group position={[0.05 + Math.sin(t * 3) * 0.04, 1.62 + Math.sin(t * 8) * 0.12, 1.1]} rotation={[swing, turn, Math.sin(t * 7) * 0.2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.025, 8, 28]} />
        <meshStandardMaterial color="#c3a36d" metalness={0.9} roughness={0.22} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[Math.sin(i * 2) * 0.15, -0.29 - i * 0.045, (i - 1) * 0.04]} rotation={[0, 0, Math.sin(t * 4 + i) * 0.04]}>
          <mesh>
            <boxGeometry args={[0.055, 0.44, 0.035]} />
            <meshStandardMaterial color={i === 1 ? "#a88753" : "#d3b77d"} metalness={0.86} roughness={0.26} />
          </mesh>
          <mesh position={[0, -0.19, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.035]} />
            <meshStandardMaterial color="#bc9a62" metalness={0.9} roughness={0.24} />
          </mesh>
        </group>
      ))}
      <pointLight color="#c08a42" intensity={0.2} distance={1} />
    </group>
  );
};

const WetPrints: React.FC<{ reveal: boolean }> = ({ reveal }) => {
  const frame = useCurrentFrame();
  const opacity = reveal ? interpolate(frame % 153, [0, 30, 150], [0.08, 0.85, 0.72], { extrapolateRight: "clamp" }) : 0.5;
  return (
    <group position={[-0.35, 0.012, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[Math.sin(i * 1.7) * 0.12, -i * 0.55, 0]} scale={[1, 1, 1]}>
          <mesh scale={[0.5, 1, 1]}>
            <circleGeometry args={[0.24, 24]} />
            <meshStandardMaterial color="#52717a" metalness={0.36} roughness={0.12} transparent opacity={opacity * (1 - i * 0.1)} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <circleGeometry args={[0.09, 18]} />
            <meshStandardMaterial color="#52717a" metalness={0.34} roughness={0.16} transparent opacity={opacity * (1 - i * 0.1)} />
          </mesh>
        </group>
      ))}
      {reveal ? <pointLight position={[0, 0, 0.4]} color="#6b9ba3" intensity={0.45} distance={2.4} /> : null}
    </group>
  );
};

const CameraMove: React.FC<{ place: string }> = ({ place }) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const t = frame / FPS;
  const targets: Record<string, [number, number, number, number, number, number]> = {
    doorway: [0.0, 1.5, 7.5, 0.35, 1.25, -3.5], keys: [0.25, 1.6, 3.0, 0, 1.4, 0.6],
    bed: [-1.0, 1.2, 5.1, 0, 0.7, -0.5], prints: [-0.25, 0.48, 3.6, -0.2, 0.1, 0.4],
    shoes: [0.25, 0.38, 3.1, 0.1, 0.1, 0.4], hall: [0, 1.45, 6.4, 1.2, 1.2, -2.0],
    lock: [-0.6, 1.48, 3.5, 1.2, 1.4, -2.8], outside: [1.1, 1.45, 5.1, 1.1, 1.45, -2.8],
    hands: [-0.2, 1.2, 3.4, 0, 1.2, 1.0], loop: [0, 1.5, 7.2, 0, 1.2, -1.2],
  };
  const [x, y, z, tx, ty, tz] = targets[place] ?? targets.doorway;
  const handheld = place === "hall" || place === "hands";
  camera.position.set(x + Math.sin(t * 2.8) * (handheld ? 0.035 : 0.008), y + Math.cos(t * 1.7) * 0.014, z);
  camera.lookAt(tx, ty, tz);
  return null;
};

type SceneAssets = { chair: GLTF; plant: GLTF; lamp: GLTF };

const Room: React.FC<{ place: string; models: SceneAssets }> = ({ place, models }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lightPulse = 0.65 + Math.sin(t * 1.8) * 0.08;
  return (
    <>
      <color attach="background" args={["#030609"]} />
      <fog attach="fog" args={["#070b10", 6.5, 17]} />
      <ambientLight intensity={1.5} color="#758092" />
      <directionalLight position={[-3, 5, 3]} intensity={1.35} color="#9a8063" />
      <pointLight position={[0, 2.2, 4.0]} intensity={3.1} color="#71849a" distance={7.5} />
      <pointLight position={[-1.8, 2.15, -0.4]} intensity={4.8 * lightPulse} color="#bf8352" distance={7.2} />
      <pointLight position={[0.2, 1.8, -5.8]} intensity={3.6} color="#345477" distance={8.5} />
      <mesh position={[0, -0.08, -1.6]} receiveShadow>
        <boxGeometry args={[6.4, 0.16, 11]} />
        <meshStandardMaterial color="#343131" roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[0, 2.35, -4.35]}>
        <planeGeometry args={[6.4, 4.7]} />
        <meshStandardMaterial color="#202427" roughness={0.94} side={2} />
      </mesh>
      <Door place={place} />

      {place === "bed" ? (
        <>
          <Prop gltf={models.chair} file="SheenChair.glb" height={0.72} position={[-1.35, 0, -1.2]} rotationY={0.35} />
          <Prop gltf={models.lamp} file="IridescenceLamp.glb" height={0.42} position={[-1.35, 0.72, -1.0]} rotationY={0.3} />
          <mesh position={[0, 0.25, -0.55]}>
            <boxGeometry args={[1.0, 0.3, 2.0]} />
            <meshStandardMaterial color="#25201e" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.42, -0.55]}>
            <boxGeometry args={[0.96, 0.08, 1.92]} />
            <meshStandardMaterial color="#57463a" roughness={0.94} />
          </mesh>
          <mesh position={[0, 0.48, -0.7]}>
            <boxGeometry args={[0.86, 0.07, 1.55]} />
            <meshStandardMaterial color="#79706a" roughness={0.97} />
          </mesh>
        </>
      ) : null}
      {place === "hall" ? <Prop gltf={models.plant} file="DiffuseTransmissionPlant.glb" height={0.88} position={[2.25, 0, -1.2]} rotationY={0.8} animate /> : null}

      <WetPrints reveal={place === "prints" || place === "shoes" || place === "bed"} />
      {place === "keys" ? <KeyRing /> : null}
      {place === "shoes" ? (
        <group position={[0.35, 0.08, 1.2]} rotation={[0, -0.4, 0]}>
          <mesh position={[-0.12, 0.06, 0]} rotation={[0.12, 0, 0.15]}>
            <capsuleGeometry args={[0.11, 0.42, 4, 10]} />
            <meshStandardMaterial color="#252a2c" roughness={0.55} />
          </mesh>
          <mesh position={[0.16, 0.06, 0.04]} rotation={[0.08, 0.1, -0.12]}>
            <capsuleGeometry args={[0.11, 0.42, 4, 10]} />
            <meshStandardMaterial color="#252a2c" roughness={0.55} />
          </mesh>
        </group>
      ) : null}
      <AnimatedFigure height={place === "bed" ? 1.65 : 1.8} position={place === "doorway" ? [-0.4, 0, 3.1] : place === "keys" ? [0.1, 0.05, 2.8] : place === "hall" ? [-0.5, 0, 1.0] : place === "bed" ? [0, 0.52, -0.55] : place === "outside" || place === "loop" ? [0.6, 0, -2.6] : [0.4, 0, 2.2]} movement={place === "doorway" ? "approach" : place === "hall" ? "point" : place === "hands" ? "tremble" : place === "bed" ? "sleep" : place === "outside" || place === "loop" ? "still" : "sway"} rotationY={place === "outside" || place === "loop" ? Math.PI : 0.1} />
      {(place === "doorway" || place === "hall" || place === "hands") ? (
        <AnimatedFigure height={1.15} position={place === "doorway" ? [0.45, 0.08, 2.5] : [0.05, 0.08, 2.35]} movement={place === "hall" ? "point" : place === "hands" ? "tremble" : "sway"} rotationY={place === "hall" ? -0.55 : 0.25} offset={23} />
      ) : null}
    </>
  );
};

const SceneBeat: React.FC<{ place: string; index: number; models: SceneAssets }> = ({ place, index, models }) => (
  <AbsoluteFill style={{ backgroundColor: "#030609" }}>
    <ThreeCanvas
      width={720}
      height={1280}
      camera={{ position: [0, 1.45, 7.5], fov: 48, near: 0.1, far: 40 }}
      gl={{ alpha: false, antialias: true, preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <CameraMove place={place} />
      <Room place={place} models={models} />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(1,4,8,.2), rgba(1,4,8,.01) 42%, rgba(1,4,8,.48))" }} />
    <div style={{ position: "absolute", top: 112, left: 42, right: 42, color: "#cfa87a", fontFamily: "Arial, sans-serif", fontSize: 22, letterSpacing: 6, fontWeight: 700, textShadow: "0 2px 10px #000" }}>
      CATATAN MALAM · 02:00
    </div>
    <BeatCaption index={index} />
  </AbsoluteFill>
);

const BeatCaption: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const beat = BEATS[index];
  const local = frame;
  const opacity = interpolate(local, [0, 10, beat.duration - 8, beat.duration], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 138, left: 46, right: 46, opacity, color: "#f3eee6", fontFamily: "Arial, sans-serif", fontWeight: 600, fontSize: 38, lineHeight: 1.28, textAlign: "left", textShadow: "0 3px 18px rgba(0,0,0,.98)", background: "linear-gradient(90deg, rgba(3,6,9,.75), rgba(3,6,9,0))", padding: "22px 20px 22px 16px", borderLeft: "3px solid #b17b4b" }}>
      {beat.text}
    </div>
  );
};

export const LS0020Revisi01: React.FC = () => {
  const frame = useCurrentFrame();
  const [models, setModels] = useState<SceneAssets | null>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading LS-0020 GLB assets"));
  useEffect(() => {
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        continueRender(handle);
      }
    };
    const loader = new GLTFLoader();
    Promise.all([
      loader.loadAsync(staticFile(`${MODEL}SheenChair.glb`)),
      loader.loadAsync(staticFile(`${MODEL}DiffuseTransmissionPlant.glb`)),
      loader.loadAsync(staticFile(`${MODEL}IridescenceLamp.glb`)),
    ]).then(([chair, plant, lamp]) => {
      setModels({ chair, plant, lamp });
      release();
    }).catch((error) => {
      release();
      cancelRender(error);
    });
    return release;
  }, [continueRender, handle]);
  const beatIndex = BEATS.findIndex((b, i) => frame >= b.start && (i === BEATS.length - 1 || frame < BEATS[i + 1].start));
  const beat = BEATS[Math.max(0, beatIndex)];
  const transition = interpolate(frame - beat.start, [0, 8], [0.25, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#030609" }}>
      {models ? BEATS.map((b, index) => (
        <Sequence key={`${b.place}-${index}`} from={b.start} durationInFrames={b.duration} name={`beat ${index + 1}`}>
          <SceneBeat place={b.place} index={index} models={models} />
        </Sequence>
      )) : null}
      <AbsoluteFill style={{ pointerEvents: "none", boxShadow: "inset 0 0 160px 42px rgba(0,0,0,.64)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.055, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0px, rgba(255,255,255,.12) 1px, transparent 1px, transparent 3px)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: "100%", background: `rgba(210,161,104,${0.16 + transition * 0.25})` }} />
    </AbsoluteFill>
  );
};

export const LS0020RevisionMeta = { fps: FPS, durationInFrames: TOTAL_FRAMES, width: 720, height: 1280, beats: BEATS };
