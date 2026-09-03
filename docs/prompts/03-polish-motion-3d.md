# Prompt 03 — Polish: mobilni header/meni, reveal sistem, text reveal, cenovnik akordeon, 3D listovi, admin ključ

## Kako se koristi (Jovan)
1. `git add -A && git commit -m "v1 live"` — tačka za povratak.
2. Ako hoćeš da 3D listove radi drugi model: pokreni **dve** sesije Claude Code u istom folderu — prva (Fable, effort high) dobija ceo prompt ispod ali sa rečenicom „Skip §6 (3D) — another session owns `components/hero/*`, `public/models/*`, `docs/design/*.blend`"; druga (Opus ili Fable, effort high) dobija SAMO §0 + §6. Vlasništvo fajlova je disjunktno, neće se sudarati. Ako radiš jednu sesiju, nalepi sve.
3. Posle: `git diff --stat`, `npm run build`, proveri na telefonu, pa deploy (`deploy-to-production` skill).

---

```
BEGIN PROMPT

ultracode

Orchestration: two implementation agents in parallel — Agent A (effort high) owns §1–§5: `components/sections/*`, `components/motion/*`, `components/ui/*`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`. Agent C (effort high) owns §6: `components/hero/*`, `public/models/*`, `public/images/ornaments/leaf3d-*`, `docs/design/*.blend`. Nobody touches `convex/*` or `content/site.ts` except to add strings to `ui`. Then one verification stage (effort high) runs §7. Do not ask questions; decide, log in `docs/DECISIONS.md` under a new "Polish" heading, keep going.

## 0. Context (read first)
Production is live at https://dfrajlica.vercel.app (Vercel) with Convex prod deployment `happy-otter-123`; local dev on :3001 with dev deployment `gregarious-oriole-702`. Read `docs/DECISIONS.md` (what v1 did and why), `content/site.ts`, `docs/design-references/{desktop,mobile,hero,leaf-reference}.png`. This is Next.js 16.3.4 — check `node_modules/next/dist/docs/` before using any Next API you are unsure about. All copy stays Serbian Cyrillic, sourced from `content/site.ts`.

Bugs confirmed on production (390px, real device + Chrome):
- B1 Mobile menu is broken: `<header>` has `backdrop-blur-md` while open; `backdrop-filter` creates a containing block for `position:fixed` descendants, so the `fixed inset-0` menu dialog is only 136px tall (measured) and links overflow with no white background over the hero.
- B2 Logo + hamburger sit on top of the watercolor corner leaves; on first load the corner ornaments sometimes don't render at all (reveal/parallax leaves them at opacity 0).
- B3 Blank sections while scrolling: content stays invisible (Services grid, price rows, footnote) because `ScrollTrigger.batch` + `MutationObserver` + `Reveal` with `margin:-10%` don't fire reliably on mobile with the fixed bottom bar and Lenis. Screenshots show 400–600px empty areas above „Ценовник" and inside the open Manikir group.
- B4 Price list: groups are reordered on mobile (Педикир, Депилација, Маникир…) by the greedy column split — content order must be kept (Маникир first). String prices („+300", „— / 3.500") are rendered in both columns and overflow the card („+300 +30" cut off).
- B5 Accordion: groups are not all collapsible and toggling has no height animation.
- B6 3D leaves on desktop are far from `leaf-reference.png` (flat, thin, no glass highlights).

## 1. Mobile header (Agent A)
- Fix B1 the robust way: render the mobile menu through a portal into `document.body` (React `createPortal`), `position:fixed; inset:0; min-height:100dvh; z-index 60; background:#fff`, header stays underneath with its own close button state. Alternatively drop `backdrop-blur` while `open` — but the portal is the real fix; do both. Keep focus trap, Escape, body scroll lock (also stop Lenis while open: `lenis.stop()/start()`).
- Menu content per `mobile.png` spirit: logo top-left, X top-right (same positions as closed state so nothing jumps), links as large serif (36px) staggered in (y 16 → 0, opacity, 0.45s, stagger 0.06, expo.out), thin plum-100 dividers, primary CTA at the bottom, address + phone under it. Background: white with the two watercolor corner leaves at 40% opacity bottom corners.
- Fix B2: on `< lg` reduce the logo to `h-9`, give the header inner padding `px-6` (was `px-5` with `-mr-2` on the button — remove the negative margin), and when NOT scrolled add a soft top scrim to the header (`bg-gradient-to-b from-white/90 via-white/60 to-transparent`, height 96px) so logo and button always read over the ornaments. Also scale the mobile corner ornaments down (`w-24`) and push them 8px outward so they frame, not collide. Re-check at 360/390/430.
- Ornaments must never depend on JS to be visible: initial state visible; parallax only translates.

## 2. Reveal system — rebuild (Agent A) — fixes B3
Replace the three mechanisms (`Reveal` + `useStaggerRows` + ScrollTrigger.batch) with ONE deterministic system:
- `components/motion/Reveal.tsx`: framer-motion `whileInView` with `viewport={{ once: true, amount: 0.2 }}` (NO negative margin), `initial={{opacity:0, y:24}}`, `transition {duration:0.6, ease:[0.16,1,0.3,1]}`. Supports `as`, `delay`.
- `components/motion/RevealGroup.tsx`: parent `variants` with `staggerChildren: 0.08, delayChildren: 0.05`; children use `variants` only (no own `whileInView`). Use it for: trust items, service cards, price rows (inside an open group), gallery tiles, footer columns, booking form fields.
- Safety net: a tiny effect on mount adds `data-motion-ready` to `<html>`; CSS: `html:not([data-motion-ready]) [data-reveal] { opacity: 1 !important; transform: none !important }` so nothing is ever invisible without JS. Additionally, in `Reveal`, `onViewportEnter` is not required — but add a 2s `setTimeout` fallback that forces `animate` if the element is within the viewport (`getBoundingClientRect`) and still hidden (guards against Lenis/ScrollTrigger timing on mobile).
- Lenis: keep, but call `ScrollTrigger.update` on lenis `scroll` and `ScrollTrigger.refresh()` after fonts load (`document.fonts.ready`), after images in Gallery load, and after any accordion toggle (`price-group-toggled` event). Only the hero timeline and the ornament parallax remain on GSAP.
- Choreography („stepenasto, jedna po jedna stvar"): in every section: title → subtitle → items (staggered) → footnote/CTA, each 80–120ms apart. Never longer than 0.7s per element. Reduced motion: everything visible, no transforms.

## 3. Text reveal on every text (Agent A)
- If a skill named like `text-reveal` / `anthropic-text-reveal` exists in your skills list, read and apply it. Otherwise implement with GSAP **SplitText** (free since GSAP 3.13 — `import { SplitText } from "gsap/SplitText"`; verify the installed gsap version supports it, else `npm i gsap@latest`).
- `components/motion/TextReveal.tsx` ("use client"): props `as`, `mode: "lines" | "words" | "chars"`, `delay`, `stagger`. Waits for `document.fonts.ready` before splitting (Playfair/Manrope Cyrillic must be loaded or line breaks shift). Lines: each line wrapped in an overflow-hidden mask, animate `yPercent: 110 → 0` + `opacity`, 0.8s, stagger 0.09, expo.out. Words: `y: 12 → 0`, `opacity 0 → 1`, `filter: blur(6px) → 0`, 0.5s, stagger 0.02. Chars only for the hero eyebrow (letter-spaced uppercase): 0.02 stagger. Trigger on `ScrollTrigger` `start: "top 85%"`, `once: true`. Revert split on unmount (`split.revert()`), re-split on resize (debounced 200ms) for `lines` mode.
- Apply: hero eyebrow (chars), hero H1 (lines — replace the current line-mask spans, keep plum color on „лепоту"), hero subtitle (words), every section H2 (lines), section subtitles/paragraphs (words), service card titles (words), price group titles (lines), price rows (row-level Reveal, not per word), booking title/subtitle (lines/words), footer address lines (words). Buttons: no split (whole-element reveal).
- `aria`: keep the original text accessible — SplitText keeps semantics but add `aria-label` with the full string on split headings to be safe.
- Cyrillic check after splitting: no broken glyphs, no widows on 390px for H1 (allow `text-wrap: balance`).

## 4. Price list (Agent A) — fixes B4, B5
- Keep `priceList` order on all breakpoints. Desktop two-column layout: fill columns in order (Маникир + Педикир left, rest right) — no greedy reorder.
- All groups collapsible on `< lg` (and optionally also on desktop, with all groups open by default there). Toggle animation: framer `AnimatePresence` + `motion.div` `initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}}` with `transition {height:{duration:0.4, ease:[0.16,1,0.3,1]}, opacity:{duration:0.25}}`, `overflow:hidden`; chevron rotates 180° (0.3s); rows inside use `RevealGroup` stagger (0.04). Button has `aria-expanded`, panel has `role="region"` + `aria-labelledby`. Dispatch `price-group-toggled` after the transition completes.
- Price cell rendering: `number` → formatted `1.700`; `[a,b]` → two cells; string starting with `+` → single cell spanning both columns, right-aligned; `"— / 3.500"` → parse into two cells („—" and „3.500"). Nothing may overflow at 360px — use `tabular-nums`, `min-width:0`, and let the name cell truncate with dotted leader shrinking first.
- Sticky category chips (Маникир · Педикир · Депилација · Обрве · Лице) under the section title on mobile that scroll to/open the group — optional, only if time allows.

## 5. Everything animated (Agent A) — „sve ostalo lepo animirano"
- Buttons: hover `y:-1`, press `scale:0.98` (framer `whileTap`), plum shadow grows; focus ring already exists.
- Service cards: hover lift 4px + thumb scale 1.04; tap on mobile → scroll + open group (exists).
- Gallery tiles: RevealGroup stagger 0.06 + image `scale 1.06 → 1` on reveal; Lightbox: spring open (`type:"spring", stiffness:260, damping:26`), swipe/arrow, backdrop fade.
- Booking form: fields stagger in; success card `scale 0.96 → 1` + check icon draws (SVG `pathLength` 0→1, 0.5s); error shake is NOT allowed (calm brand) — use a color fade.
- Mobile bottom bar: slides in after the hero CTA leaves the viewport (`y: 100% → 0`, 0.35s), hides when `#zakazivanje` is in view (exists).
- Header: background/blur/shadow 300ms (exists) + logo scales 1 → 0.92 when scrolled on desktop.
- Corner ornaments: subtle parallax (±12px) + slow breathing rotation (±1.5°, 8s loop, only desktop).
- Global: `motion-safe` only; `prefers-reduced-motion` disables transforms and SplitText (render plain).

## 6. 3D leaves — make them match `leaf-reference.png` (Agent C) — fixes B6
Target: plump, glossy, translucent magenta-glass leaves with bright white specular streaks and a darker translucent core, like blown glass. Work in a tight loop: change → `npm run dev` → Playwright screenshot of the hero at 1440×900 → compare side by side with `docs/design-references/leaf-reference.png` and `hero.png` → adjust. Max 6 iterations, then decide (see fallback).
- Geometry (Blender MCP — `execute_blender_code`, open `docs/design/leaf-cluster.blend`): leaves need VOLUME. Solidify thickness 0.14–0.18 (was 0.09), `use_even_offset`, Bevel width 0.05 with 3 segments, Subdivision 2, shade smooth; leaf profile: elongated (length:width ≈ 2.6:1), pointed tip, cupped (cross-section curl 0.25) and curled up along length (bend 0.4). Two variants: `leaf-cluster.glb` (6 leaves, desktop) and `leaf-cluster-sm.glb` (3 leaves, mobile fallback if ever used). Export GLB `export_apply=True, export_yup=True`; then `npx @gltf-transform/cli optimize --compress draco`. Keep < 300 KB.
- Material (drei): use `MeshTransmissionMaterial` — `{ samples: 6, resolution: 512, transmission: 1, thickness: 1.2, roughness: 0.05, ior: 1.5, chromaticAberration: 0.03, anisotropy: 0.15, distortion: 0.08, distortionScale: 0.4, temporalDistortion: 0.1, color: "#C23B98", attenuationColor: "#7A1B63", attenuationDistance: 0.7, clearcoat: 1, clearcoatRoughness: 0.04, backside: true, backsideThickness: 0.4 }`. If performance on a mid laptop < 50 fps, fall back to `MeshPhysicalMaterial` with `transmission 0.9, thickness 1.0, ior 1.5, clearcoat 1, roughness 0.05, attenuationColor #7A1B63, attenuationDistance 0.7, envMapIntensity 2`.
- Lighting = the highlights. Replace RoomEnvironment with a **custom studio environment**: drei `<Environment resolution={256} frames={1}>` containing 3–4 `<Lightformer>` panels — one large soft white rect above-left (intensity 3, scale [6,3]), one thin bright strip from the right (intensity 6, scale [1,6]) for the long white streak visible in the reference, one warm-pink fill below (color #F3D3E6, intensity 1.5), plus a `<Lightformer form="ring">` behind the camera for the rim. Add `@react-three/postprocessing` `Bloom` (intensity 0.35, luminanceThreshold 0.85, mipmapBlur) — this is what makes glass "pop". ACES tone mapping, exposure 1.1. Background transparent.
- Placement like `hero.png`: one sprig top-left of the photo card overlapping its corner, one bottom-right; each with drei `<Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.5}>`; mouse parallax ±5°. On `< 1024px` keep the static PNG, but re-cut `leaf3d-a/b.png` from `leaf-reference.png`/`hero.png` at 2× so they are crisp.
- Acceptance: a side-by-side image `docs/screenshots/leaves-compare.png` (left: reference crop, right: our render) where a designer would say „same family". If after 6 iterations it is not there, SHIP THE 2.5D FALLBACK on desktop too: PNG cutouts of the reference leaves (2–3 layers per sprig at different depths) with parallax, gentle rotation and a moving specular sheen (CSS mask + gradient sweep). This is what the reference literally is, and it is guaranteed to look right. Log the decision.

## 7. Verification (final stage)
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` — all clean.
- Playwright at 390×844 and 1440×900: (a) scroll from top to bottom in 12 steps with 150ms waits, then assert every `[data-reveal]` has computed `opacity === "1"` — fail = B3 not fixed; (b) open the mobile menu, screenshot, assert the dialog height ≥ `innerHeight`; (c) open/close each price group, screenshot mid-animation; (d) full-page screenshots to `docs/screenshots/v2-*.png`; (e) hero at 1440 with the 3D leaves + the compare image from §6.
- Cyrillic grep as in v1; no Latin leaks from new strings (put new UI strings into `content/site.ts` → `ui`).
- Report in Serbian: what changed, screenshots, decisions, and the answer to: „is the 3D on desktop the GLB or the 2.5D fallback, and why".

END PROMPT
```

---

## Admin ključ — kako da radi i lokalno i na produkciji (Jovan, ručno, 2 minuta)
Kod čita `process.env.ADMIN_KEY` **na Convex serveru**, ne na Vercelu. Postoje dva Convex deployment-a i svaki ima svoje env varijable:

| Deployment | Ko ga koristi | Komanda |
|---|---|---|
| dev `gregarious-oriole-702` | `localhost:3001` (iz `.env.local`) | `npx convex env set ADMIN_KEY <KLJUC>` |
| prod `happy-otter-123` | `dfrajlica.vercel.app` | `npx convex env set ADMIN_KEY <KLJUC> --prod` |

Koraci:
1. Napravi novi ključ (PowerShell): `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})`
2. Postavi ga na oba deployment-a (dve komande iznad, isti ključ) — provera: `npx convex env list` i `npx convex env list --prod`.
3. Na sajtu `/admin` unesi taj ključ (čuva se u sessionStorage tog browsera).
4. ⚠️ Stari dev ključ `RYTTdqZPAlbzN963RzdA7Cp8` je zapisan u `docs/DECISIONS.md` — ako je to komitovano/deployovano, smatraj ga procurelim: obriši tu liniju iz DECISIONS.md i koristi novi ključ. Ključ čuvaj u password manageru, ne u repou.
5. Vlasnici salona daš: link `dfrajlica.vercel.app/admin` + ključ (može da ga sačuva kao lozinku u telefonu). Kasnije, ako hoće bez ključa — Convex Auth sa e-mail lozinkom (skill `convex-auth` već stoji u `.agents/skills`).
