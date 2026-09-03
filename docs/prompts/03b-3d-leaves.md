# Prompt 03b — 3D stakleni listovi (sesija 2: Opus 5, effort high)

Radi paralelno sa `03a-ui-motion.md`. Blender mora biti otvoren (Blender MCP). Pre pokretanja: `git add -A && git commit -m "v1 live"` (ako već nije).

```
BEGIN PROMPT

You are a senior 3D/real-time graphics engineer (Blender + three.js / React Three Fiber). One job: make the hero's 3D glass leaves on https://dfrajlica.vercel.app match `docs/design-references/leaf-reference.png` (and their placement in `docs/design-references/hero.png`). Work autonomously in a tight visual loop; log decisions in `docs/DECISIONS.md` under "## Polish — 3D". Read first: `docs/DECISIONS.md` (section "3D / motion"), `components/hero/HeroLeaves.tsx`, `components/hero/LeafScene.tsx`, `docs/design/leaf-cluster.blend`, `docs/design/leaf-cluster-blender-preview.png`.

## 0. Ownership — hard boundary
You own: `components/hero/HeroLeaves.tsx`, `components/hero/LeafScene.tsx`, `components/hero/CanvasErrorBoundary.tsx`, any new file under `components/hero/`, `public/models/*`, `public/images/ornaments/leaf3d-*`, `docs/design/*.blend`, `docs/design/*preview*.png`, `docs/screenshots/leaves-*.png`. You may `npm i @react-three/postprocessing` if needed.
You must NOT touch anything else (another session is editing sections, motion, CSS, layout). `components/sections/Hero.tsx` is theirs — if you need a different mount geometry, write the request into `docs/DECISIONS.md` and work within the current wrapper (photo card + 120px leaf room at `lg`).

## 1. Target look (be literal)
`leaf-reference.png`: plump, elongated (≈2.6:1), cupped and slightly curled leaves; deep magenta glass (#C23B98 body, darker #7A1B63 in the thick core), high gloss, long bright white specular streaks along the length, soft internal translucency, thin rounded stem. Six alternating leaves on a gently curved stem. It reads as blown glass jewelry, not plastic, not flat.

## 2. Loop (max 6 iterations, then decide)
Each iteration: change → `npm run dev` (port 3001 is used; pick another) → Playwright screenshot of the hero at 1440×900 → crop the leaf area → compose side by side with the reference crop into `docs/screenshots/leaves-compare-N.png` → LOOK at it → list the 3 biggest differences → fix them. Stop when a designer would say "same family".

## 3. Geometry (Blender MCP: `execute_blender_code`, open `docs/design/leaf-cluster.blend`)
Leaves need volume: Solidify 0.14–0.18 with `use_even_offset`, Bevel width 0.05 / 3 segments, Subdivision 2, smooth shading. Profile: length:width ≈ 2.6:1, pointed tip, cup 0.25 across, bend 0.4 along, slight twist. 6 leaves alternating on a bezier stem (radius 0.022). Export `public/models/leaf-cluster.glb` (`export_apply=True, export_yup=True`), then `npx @gltf-transform/cli optimize --compress draco` (decoder is self-hosted in `public/models/draco/`). Keep < 300 KB. Render a preview PNG each time you re-export.

## 4. Material & lighting (this is where the reference look comes from)
- Material: drei `MeshTransmissionMaterial` `{ samples: 6, resolution: 512, transmission: 1, thickness: 1.2, roughness: 0.05, ior: 1.5, chromaticAberration: 0.03, anisotropy: 0.15, distortion: 0.08, distortionScale: 0.4, temporalDistortion: 0.1, color: "#C23B98", attenuationColor: "#7A1B63", attenuationDistance: 0.7, clearcoat: 1, clearcoatRoughness: 0.04, backside: true, backsideThickness: 0.4 }`. Fallback if < 50 fps on a mid laptop: `MeshPhysicalMaterial` `{ transmission 0.9, thickness 1.0, ior 1.5, clearcoat 1, roughness 0.05, attenuationColor #7A1B63, attenuationDistance 0.7, envMapIntensity 2 }`.
- Lighting = the highlights. Replace RoomEnvironment with a custom studio: drei `<Environment resolution={256} frames={1}>` containing `<Lightformer>`s — large soft white rect above-left (intensity 3, scale [6,3]), a thin bright vertical strip on the right (intensity 6, scale [1,6]) → the long white streak in the reference, a warm-pink fill below (#F3D3E6, intensity 1.5), a `form="ring"` behind the camera for the rim. Add `@react-three/postprocessing` `<Bloom intensity={0.35} luminanceThreshold={0.85} mipmapBlur />` — glass needs bloom to "pop". ACES tone mapping, exposure 1.1, transparent background, dpr ≤ 1.5, `frameloop="demand"` when the hero is off-screen (keep the existing IntersectionObserver logic).
- Placement per `hero.png`: one sprig top-left overlapping the photo card corner, one bottom-right; drei `<Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.5}>`; pointer parallax ±5°. Below 1024px keep the static PNG path, but re-cut `leaf3d-a/b.png` from the reference/hero at 2× so they are crisp; the mobile leaf should sit like in `mobile.png` (bottom-right of the photo).

## 5. Fallback you must be honest about
If after 6 iterations the compare image is not "same family": ship the **2.5D fallback on desktop too** — 2–3 PNG cutout layers per sprig (from `leaf-reference.png`/`hero.png`) at different depths with parallax, gentle float rotation and a moving specular sheen (CSS mask + gradient sweep). This is literally what the reference is, and it is guaranteed to look right. Keep the R3F path behind a flag (`NEXT_PUBLIC_HERO_3D=1`) so it can be finished later. Log the decision and why.

## 6. Verification & report
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` clean; no console errors (THREE.Clock deprecation from drei Float is known/harmless).
- Deliver `docs/screenshots/leaves-compare-final.png` (reference | ours), `docs/screenshots/hero-1440-v2.png`, `docs/screenshots/hero-390-v2.png`; FPS note from `npm run dev` on your machine.
- Report in Serbian: what the desktop shows now (GLB or 2.5D), the material/lighting values that made the difference, file sizes, and anything the UI session needs to change in `Hero.tsx`. Do not deploy.

END PROMPT
```
