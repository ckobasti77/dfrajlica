"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ------------------------------------------------------------------ */
/*  Tuning knobs (integrator: adjust here, nothing else needs to move) */
/* ------------------------------------------------------------------ */

export const MODEL_URL = "/models/leaf-cluster.glb";
/** Self-hosted Draco decoder (copied from three/examples/jsm/libs/draco/gltf). */
export const DRACO_PATH = "/models/draco/";

/**
 * Blown-glass plum material. Reference: docs/design-references/leaf-reference.png -
 * plump, cupped magenta glass, bright specular streaks, slightly darker translucent core.
 */
export const MATERIAL = {
  color: "#B23A8E", // body tint. Darker (#8B1E6E) reads as opaque plastic - transmission multiplies by this colour
  transmission: 0.72, // 0 = opaque plastic, 1 = clear glass
  thickness: 0.9, // volume depth used by refraction/attenuation
  roughness: 0.1, // keep low: crisp specular streaks
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  ior: 1.5,
  attenuationColor: "#7A1B63", // colour picked up while light travels through the glass -> darker core/rims
  attenuationDistance: 0.6, // shorter = denser, darker core
  envMapIntensity: 1.6,
  /** FrontSide by default; DoubleSide made no visible difference in the standalone check. */
  side: THREE.FrontSide as THREE.Side,
} as const;

/**
 * Where the two sprigs sit, in normalised wrapper coordinates:
 * x/y in [-0.5, 0.5] of the canvas (0,0 = centre of the wrapper, +y up).
 * Values below assume the photo card occupies ~80% of the wrapper width/height (see CARD_FRACTION);
 * if the wrapper padding differs, scale x/y accordingly (card edge = +-0.5 * CARD_FRACTION).
 * `span` = fraction of the CARD width the sprig should cover.
 */
export type SprigPlacement = {
  x: number;
  y: number;
  z: number;
  /** Euler rotation [x, y, z] in radians, applied after the model is stood upright. */
  rotation: [number, number, number];
  span: number;
  /** Per-instance float phase so the two sprigs never move in lockstep. */
  floatSpeed: number;
};

export const POSITIONS: SprigPlacement[] = [
  // top-left corner of the photo card (card edges are at +-0.5 * CARD_FRACTION)
  { x: -0.36, y: 0.31, z: 0.3, rotation: [0.25, -0.45, -0.5], span: 0.34, floatSpeed: 1.2 },
  // bottom-right corner
  { x: 0.37, y: -0.33, z: 0.3, rotation: [0.2, 0.4, -0.7], span: 0.38, floatSpeed: 1.05 },
  // small sprig at the bottom-left corner (as in hero.png)
  { x: -0.33, y: -0.34, z: 0.2, rotation: [0.15, -0.3, 0.9], span: 0.26, floatSpeed: 0.95 },
];

/** Assumed ratio: photo-card width / wrapper (canvas) width. Used to convert `span` into world units. */
export const CARD_FRACTION = 0.7; // Hero.tsx wrapper = card (520x650) + 120px padding on every side

/** Mouse parallax: max tilt of the whole scene, radians (6 deg). */
export const PARALLAX_MAX = 0.105;
export const TONE_MAPPING_EXPOSURE = 1.0;

/* ------------------------------------------------------------------ */

useGLTF.preload(MODEL_URL, DRACO_PATH);

/** Model is authored lying in the XZ plane, pointing along -Z. Stand it up so it faces the camera. */
const UPRIGHT_X = Math.PI / 2;

function useGlassMaterial(): THREE.MeshPhysicalMaterial {
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MATERIAL.color),
      transmission: MATERIAL.transmission,
      thickness: MATERIAL.thickness,
      roughness: MATERIAL.roughness,
      clearcoat: MATERIAL.clearcoat,
      clearcoatRoughness: MATERIAL.clearcoatRoughness,
      ior: MATERIAL.ior,
      attenuationColor: new THREE.Color(MATERIAL.attenuationColor),
      attenuationDistance: MATERIAL.attenuationDistance,
      envMapIntensity: MATERIAL.envMapIntensity,
      side: MATERIAL.side,
    });
    return m;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

type SprigProps = { placement: SprigPlacement; source: THREE.Group; material: THREE.Material };

function Sprig({ placement, source, material }: SprigProps) {
  const viewport = useThree((s) => s.viewport);

  const { object, length } = useMemo(() => {
    const clone = source.clone(true);
    clone.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) mesh.material = material;
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // Centre the cluster on its bounding-box centre so it rotates/floats about itself.
    clone.position.copy(center).negate();
    return { object: clone, length: Math.max(size.x, size.y, size.z) || 1 };
  }, [source, material]);

  const targetWidth = viewport.width * CARD_FRACTION * placement.span;
  const scale = targetWidth / length;

  return (
    <Float speed={placement.floatSpeed} rotationIntensity={0.35} floatIntensity={0.6}>
      <group
        position={[placement.x * viewport.width, placement.y * viewport.height, placement.z]}
        rotation={placement.rotation}
        scale={scale}
      >
        <group rotation={[UPRIGHT_X, 0, 0]}>
          <primitive object={object} />
        </group>
      </group>
    </Float>
  );
}

function Sprigs({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  const material = useGlassMaterial();

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <>
      {POSITIONS.map((placement, i) => (
        <Sprig key={i} placement={placement} source={scene} material={material} />
      ))}
    </>
  );
}

/** Procedural studio reflections (no HDR download). */
function StudioEnvironment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.background = null;
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [get]);
  return null;
}

/** Whole-scene tilt that eases toward the pointer (the canvas itself is pointer-events: none). */
function ParallaxRig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = 1 - Math.exp(-delta * 4); // frame-rate independent lerp
    g.rotation.y += (pointer.current.x * PARALLAX_MAX - g.rotation.y) * k;
    g.rotation.x += (pointer.current.y * PARALLAX_MAX - g.rotation.x) * k;
  });

  return <group ref={group}>{children}</group>;
}

export type LeafSceneProps = {
  /** Render continuously only while the hero is on screen. */
  active: boolean;
  /** Fired once the GLB is decoded and the first frame can be drawn. */
  onReady: () => void;
};

export default function LeafScene({ active, onReady }: LeafSceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      camera={{ fov: 35, position: [0, 0, 9], near: 0.1, far: 50 }}
      frameloop={active ? "always" : "demand"}
      shadows={false}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = TONE_MAPPING_EXPOSURE;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <StudioEnvironment />
      <ambientLight intensity={0.4} />
      {/* warm key from top-left */}
      <directionalLight position={[-4, 6, 5]} intensity={2.5} color="#FFF4EA" />
      {/* cool rim from behind / top-right */}
      <directionalLight position={[4, 3, -4]} intensity={1.5} color="#EAF2FF" />
      {/* plum-tinted fill from below */}
      <pointLight position={[0, -2, 3]} intensity={1.5} distance={12} decay={2} color="#C98BB8" />
      <ParallaxRig>
        <Sprigs onReady={onReady} />
      </ParallaxRig>
    </Canvas>
  );
}
