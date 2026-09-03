# Prompt 03c — Varijacije listova (posle merge-a; Opus 5 ili Fable, effort high, auto)

Pokreće se u **main-u posle merge-a** 03a/03b (ili u worktree-u `leaves-v2` ako istovremeno radi 04). Sesija dira samo `components/hero/*`, `public/models/*`, `public/images/ornaments/leaf3d-*`, `docs/design/*.blend`.

```
BEGIN PROMPT

Continue the hero glass-leaves work (read `docs/DECISIONS.md` → "Polish — 3D" and `components/hero/LeafScene.tsx`; the current result in `docs/screenshots/leaves-compare-final.png` is approved — keep the material, lighting and Bloom exactly as they are). Ownership: only `components/hero/*`, `public/models/*`, `public/images/ornaments/leaf3d-*`, `docs/design/*.blend`, `docs/screenshots/leaves-*`. Do not touch anything else.

Goals:
1. **Variation.** One sprig repeated twice reads as a stamp. Build 3 sprig variants in Blender (`execute_blender_code`, from `docs/design/leaf-cluster.blend`): A = 5 leaves large (current), B = 3 leaves medium with a longer stem, C = 2 small leaves (a "bud"). Export each as its own Draco GLB (< 60 KB each) or as three named nodes in one GLB. Place per `hero.png`: A bottom-right (largest, in front of the card corner), B top-left (medium, behind the card edge — renderOrder/z so the card overlaps it slightly), C bottom-left small near the CTA buttons, plus one tiny C mirrored near the top-right corner ornament at 60% opacity. Different `Float` speeds (0.9 / 1.2 / 1.5) and rotations so they never move in sync. Total on-screen leaf area should stay ≈ what it is now — variety, not more mass.
2. **Mobile/tablet parity.** Below 1024px the site shows old PNG cutouts from `hero.png` that no longer match the desktop material. Render the new sprigs from the R3F scene itself (headless Playwright screenshot of a `/leaf-render` temporary route at 2× with a transparent background, one PNG per variant, or Blender EEVEE render with `film_transparent`) into `public/images/ornaments/leaf3d-{a,b,c}.png`, then convert to AVIF (`sharp`, quality 70, keep alpha) and reference the AVIF. Mobile layout per `mobile.png`: one B sprig at the bottom-right of the photo, one C near the headline. Remove the temporary route.
3. **Tablet 768–1023px:** use the static AVIFs but positioned like desktop (the wrapper has no 120px leaf room there — overlap the card corners instead of sitting inside the photo).
4. Keep performance: dpr ≤ 1.5, `frameloop="demand"` off-screen, transmission FBO sizes as documented; measure and keep the frame budget ≤ 4 ms median on your machine.
5. Verify: hero screenshots at 390 / 768 / 1440 into `docs/screenshots/hero-v3-*.png`, plus an updated `leaves-compare-final.png`. `npx tsc --noEmit`, `npx eslint .`, `npm run build` clean. Report in Serbian. Do not deploy.

END PROMPT
```
