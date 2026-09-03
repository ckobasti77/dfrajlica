"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshTransmissionMaterial, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Tuning knobs (integrator: adjust here, nothing else needs to move) */
/* ------------------------------------------------------------------ */

export const MODEL_URL = "/models/leaf-cluster.glb";
/** Self-hosted Draco decoder (copied from three/examples/jsm/libs/draco/gltf). */
export const DRACO_PATH = "/models/draco/";

/**
 * Blown-glass plum. Reference: docs/design-references/leaf-reference.png -
 * deep magenta body, much darker plum where the light path through the glass is
 * long (rim + core), long white specular streaks, soft internal translucency.
 *
 * The look is 3 things working together and none of them alone:
 *   - transmission 1 + a short attenuation distance -> the dark rim/core,
 *   - roughness ~0.05 + clearcoat -> the crisp streaks,
 *   - the Lightformer studio below -> what those streaks are a reflection *of*.
 */
export const MATERIAL = {
  samples: 6,
  resolution: 512,
  transmission: 1,
  thickness: 3.4,
  roughness: 0.05,
  ior: 1.5,
  chromaticAberration: 0.05,
  anisotropy: 0.15,
  distortion: 0.08,
  distortionScale: 0.4,
  temporalDistortion: 0.1,
  color: "#DE72B7",
  attenuationColor: "#7A1B63",
  attenuationDistance: 4.6,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  envMapIntensity: 2.0,
  backside: true,
  backsideThickness: 1.0,
} as const;

/**
 * What the glass shows *through* itself. MeshTransmissionMaterial samples the scene
 * into an FBO, and this canvas is transparent - so without an explicit backdrop the
 * glass refracts the black clear colour and every leaf renders near-black.
 */
export const TRANSMISSION_BACKDROP = "#FFF7FB";

/**
 * The GLB carries each vertex's own half-thickness (relative to the thickest point of
 * the biggest leaf) in UV.x - see the generator in docs/design. Feeding a 1-D green
 * ramp in as `thicknessMap` turns that into real Beer's-law attenuation that follows
 * the geometry: the plump core absorbs, the thin flanks stay luminous. Without it
 * `thickness` is one constant for the whole leaf and the glass reads as flat colour.
 */
function makeThicknessRamp(): THREE.DataTexture {
  const n = 256;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.round((i / (n - 1)) * 255);
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v; // .g is the channel three reads
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Where the sprigs sit, in **card**-normalised coordinates: x/y in [-0.5, 0.5],
 * so +-0.5 is exactly a photo-card edge and (-0.5, 0.5) is the top-left corner.
 * `span` = fraction of the card width the sprig should cover.
 * Values below were measured off docs/design-references/hero.png.
 */
export type SprigPlacement = {
  x: number;
  y: number;
  z: number;
  /** Euler rotation [x, y, z] in radians. The GLB is already upright and facing +Z. */
  rotation: [number, number, number];
  span: number;
  /** Per-instance float phase so the sprigs never move in lockstep. */
  floatSpeed: number;
  /**
   * Transmission FBO size for this sprig. Each MeshTransmissionMaterial re-renders the
   * whole scene into this buffer twice per frame (backside + main), so the two small
   * sprigs run at half resolution - at ~150px on screen it is not visible.
   */
  resolution?: number;
};

export const POSITIONS: SprigPlacement[] = [
  // top-left corner. The model's three leaves sit at 124/58/5 degrees with the stem
  // running down-left; rolling it +55 degrees puts them at 179/113/60 with the stem
  // pointing down - the V-plus-one-low-leaf that hero.png shows in this corner.
  // (Mirroring it with rotation.y ~ PI instead turns the leaf backs to the camera and
  // reads noticeably flatter than the other two sprigs.)
  { x: -0.54, y: 0.36, z: 0.35, rotation: [0.1, 0.28, 0.96], span: 0.32, floatSpeed: 1.2, resolution: 256 },
  // bottom-right corner - the hero sprig, closest to the camera
  { x: 0.46, y: -0.45, z: 0.45, rotation: [0.06, 0.26, 0.16], span: 0.34, floatSpeed: 1.05 },
  // bottom-left corner
  { x: -0.46, y: -0.41, z: 0.15, rotation: [0.12, -0.3, 0.55], span: 0.29, floatSpeed: 0.95, resolution: 256 },
];

/**
 * photo-card size / wrapper (canvas) size. Measured from the DOM by HeroLeaves so the
 * corners stay correct at any breakpoint; these are only the lg defaults
 * (Hero.tsx: card 520x650 inside a wrapper padded by 120px on every side).
 */
export const CARD_FRACTION: CardFraction = { x: 520 / 760, y: 650 / 890 };
export type CardFraction = { x: number; y: number };

/**
 * Base tone of the baked studio cubemap. This must stay DARK: it is what the glass
 * reflects everywhere the Lightformers do not cover. A light base puts a flat neutral
 * specular wash over the whole leaf, which desaturates the plum to grey and turns the
 * Fresnel rim pale - the opposite of the reference, where the rim is the darkest part.
 */
export const ENV_BASE = "#1C0517";

/** Mouse parallax: max tilt of the whole scene, radians (5 deg). */
export const PARALLAX_MAX = 0.087;
export const TONE_MAPPING_EXPOSURE = 1.15;

/* ------------------------------------------------------------------ */

useGLTF.preload(MODEL_URL, DRACO_PATH);

type SprigProps = { placement: SprigPlacement; source: THREE.Group; card: CardFraction };

/** Shared so the backdrop colour and ramp are allocated once, not once per sprig. */
const backdrop = new THREE.Color(TRANSMISSION_BACKDROP);
const thicknessRamp = makeThicknessRamp();

function Sprig({ placement, source, card }: SprigProps) {
  const viewport = useThree((s) => s.viewport);

  const { geometry, length } = useMemo(() => {
    // Merge every mesh of the sprig into one geometry: MeshTransmissionMaterial
    // renders a per-mesh backside pass, so one mesh instead of four is ~4x cheaper.
    const parts: THREE.BufferGeometry[] = [];
    source.updateWorldMatrix(true, true);
    source.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const g = mesh.geometry.clone();
      g.applyMatrix4(mesh.matrixWorld);
      // keep position + normal + uv (uv carries the baked thickness); drop the rest so
      // the merge cannot fail on mismatched attributes
      for (const name of Object.keys(g.attributes)) {
        if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
      }
      parts.push(g.index ? g.toNonIndexed() : g);
    });

    const total = parts.reduce((n, g) => n + g.getAttribute("position").count, 0);
    const position = new Float32Array(total * 3);
    const normal = new Float32Array(total * 3);
    const uv = new Float32Array(total * 2);
    let offset = 0;
    for (const g of parts) {
      const count = g.getAttribute("position").count;
      position.set(g.getAttribute("position").array as Float32Array, offset * 3);
      normal.set(g.getAttribute("normal").array as Float32Array, offset * 3);
      const src = g.getAttribute("uv");
      if (src) uv.set(src.array as Float32Array, offset * 2);
      offset += count;
      g.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(position, 3));
    merged.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
    merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    merged.computeBoundingBox();

    const box = merged.boundingBox!;
    const size = box.getSize(new THREE.Vector3());
    // Centre on the bounding-box centre so the sprig floats/rotates about itself.
    const centre = box.getCenter(new THREE.Vector3());
    merged.translate(-centre.x, -centre.y, -centre.z);
    return { geometry: merged, length: Math.max(size.x, size.y) || 1 };
  }, [source]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const scale = (viewport.width * card.x * placement.span) / length;

  return (
    <Float speed={placement.floatSpeed} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh
        geometry={geometry}
        position={[
          placement.x * viewport.width * card.x,
          placement.y * viewport.height * card.y,
          placement.z,
        ]}
        renderOrder={placement.z > 0.3 ? 1 : 0}
        rotation={placement.rotation}
        scale={scale}
      >
        <MeshTransmissionMaterial
          {...MATERIAL}
          resolution={placement.resolution ?? MATERIAL.resolution}
          background={backdrop}
          thicknessMap={thicknessRamp}
        />
      </mesh>
    </Float>
  );
}

function Sprigs({ onReady, card }: { onReady: () => void; card: CardFraction }) {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <>
      {POSITIONS.map((placement, i) => (
        <Sprig key={i} placement={placement} source={scene} card={card} />
      ))}
    </>
  );
}

/**
 * Custom studio, baked once. These four lightformers *are* the reference look:
 * the vertical strip on the right is the long white streak down each leaf, the
 * big soft rect above-left is the broad sheen, the ring gives the rim.
 */
function Studio() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      {/* base tone of the virtual scene the cubemap is baked from - a dark base here
          turns the glass black, which is exactly what happens with the default. */}
      <color attach="background" args={[ENV_BASE]} />
      {/* broad dim dome front and back: stops any part of the leaf reading as a
          hole. Without it the dark base bands hard against the bright strips. */}
      <Lightformer intensity={0.16} form="rect" scale={[14, 14, 1]} position={[0, 0, 8]} color="#FBEFF7" />
      <Lightformer intensity={0.1} form="rect" scale={[14, 14, 1]} position={[0, 0, -8]} rotation={[0, Math.PI, 0]} color="#E7B9D6" />
      {/* large soft key above-left -> broad sheen along the upper edge */}
      <Lightformer
        intensity={4}
        form="rect"
        scale={[6, 3, 1]}
        position={[-4, 5, 2]}
        rotation={[-Math.PI / 3, 0, 0]}
        color="#ffffff"
      />
      {/* thin bright vertical strip on the right -> the long specular streak */}
      <Lightformer
        intensity={22}
        form="rect"
        scale={[1.2, 6, 1]}
        position={[4.5, 0.5, 2]}
        rotation={[0, -Math.PI / 2.6, 0]}
        color="#ffffff"
      />
      {/* second, narrower strip from the left so both leaf flanks get a streak */}
      <Lightformer
        intensity={15}
        form="rect"
        scale={[0.8, 5, 1]}
        position={[-4, 1, 1.5]}
        rotation={[0, Math.PI / 2.6, 0]}
        color="#ffffff"
      />
      {/* warm pink fill from below -> keeps the shadow side from going black */}
      <Lightformer
        intensity={1.8}
        form="rect"
        scale={[6, 3, 1]}
        position={[0, -4, 2]}
        rotation={[Math.PI / 2.6, 0, 0]}
        color="#F3D3E6"
      />
      {/* narrow bar behind the camera -> the bright rim that reads as polished glass.
          A ring here reflects as a visible oval blob on the flatter leaf faces. */}
      <Lightformer intensity={2.2} form="rect" scale={[0.7, 3.5, 1]} position={[1.2, 1.4, 6]} rotation={[0, 0, -0.5]} color="#ffffff" />
    </Environment>
  );
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
  /** photo card size / canvas size, measured from the DOM by HeroLeaves. */
  card?: CardFraction;
};

export default function LeafScene({ active, onReady, card = CARD_FRACTION }: LeafSceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      resize={{ offsetSize: true }}
      camera={{ fov: 35, position: [0, 0, 9], near: 0.1, far: 50 }}
      frameloop={active ? "always" : "demand"}
      shadows={false}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = TONE_MAPPING_EXPOSURE;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Studio />
      <ParallaxRig>
        <Sprigs onReady={onReady} card={card} />
      </ParallaxRig>
      <EffectComposer enableNormalPass={false}>
        <Bloom intensity={0.5} luminanceThreshold={0.8} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
