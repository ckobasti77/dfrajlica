# Prompt 03a — UI & motion polish (sesija 1: Opus 4.8, effort high)

Radi paralelno sa `03b-3d-leaves.md` (druga sesija). Vlasništvo fajlova je disjunktno — vidi §0.
Pre pokretanja: `git add -A && git commit -m "v1 live"`.

```
BEGIN PROMPT

You are polishing a live one-page site for a beauty salon (Serbian Cyrillic, Next.js 16.3.4, Tailwind v4, framer-motion, GSAP, Lenis). Work autonomously; decide, log decisions in `docs/DECISIONS.md` under "## Polish — UI/motion", keep going. Read first: `docs/DECISIONS.md`, `content/site.ts`, `docs/design-references/{desktop,mobile,hero}.png`, `.claude/skills/text-reveal/SKILL.md`, and `node_modules/next/dist/docs/` for any Next API you are unsure about.

## 0. Ownership — hard boundary
You own: `components/sections/*`, `components/motion/*`, `components/ui/*`, `components/booking/*` (visual only, not logic), `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, new `lib/textReveal.ts`, new `constants/textRevealConfig.ts`, `content/site.ts` (only the `ui` strings object).
You must NOT touch: `components/hero/HeroLeaves.tsx`, `components/hero/LeafScene.tsx`, `components/hero/CanvasErrorBoundary.tsx`, `public/models/*`, `public/images/ornaments/leaf3d-*`, `docs/design/*.blend`, `convex/*`. Another session owns those right now. `components/sections/Hero.tsx` is yours, but keep the `<HeroLeaves />` mount point, its props and wrapper geometry (the 120px "leaf room" at `lg`) exactly as they are.

## 1. Confirmed production bugs (390px, real device + Chrome)
- B1 Mobile menu broken: `<header>` has `backdrop-blur-md` while open; `backdrop-filter` creates a containing block for fixed descendants, so the `fixed inset-0` dialog is 136px tall (measured) and links overflow with no background.
- B2 Logo + hamburger collide with the watercolor corner leaves; on first load ornaments sometimes stay invisible (opacity 0 from a reveal/parallax that never fires).
- B3 Blank sections while scrolling on mobile (400–600px empty above „Ценовник", empty rows inside the open Маникир group): `Reveal` (margin -10%) + `ScrollTrigger.batch` + `MutationObserver` do not fire reliably with Lenis and the fixed bottom bar.
- B4 Price list: groups reordered on mobile (Педикир, Депилација, then Маникир) by the greedy column split; string prices („+300", „— / 3.500") render in both columns and overflow („+300 +30" cut off).
- B5 Accordion: not all groups collapsible, no height animation.

## 2. Mobile header & menu
- Fix B1 properly: render the mobile menu via `createPortal` into `document.body`: `fixed inset-0 min-h-[100dvh] z-[70] bg-white`; header stays underneath; also remove `backdrop-blur` from the header while `open`. Keep focus trap, Escape, body scroll lock, and stop Lenis while open (`lenis.stop()` / `start()`).
- Menu layout: logo top-left and X top-right in exactly the closed-state positions (nothing jumps), links large serif 36px with plum-100 dividers, staggered in (y 16→0, opacity, 0.45s, stagger 0.06, ease [0.16,1,0.3,1]), primary CTA at the bottom, address + phone under it, two watercolor leaves at 40% opacity in the bottom corners. Menu chrome is `data-reveal="off"` (see §4).
- Fix B2: on `< lg` logo `h-9`, header inner padding `px-6`, remove the `-mr-2` on the button; when not scrolled add a top scrim to the header (`bg-gradient-to-b from-white/90 via-white/60 to-transparent`, ~96px) so logo/button always read; shrink mobile corner ornaments to `w-24` and push them 8px outward. Ornaments are visible by default — parallax only translates, never sets opacity.

## 3. Reveal system — rebuild (fixes B3)
Replace `Reveal` + `useStaggerRows` + ScrollTrigger.batch with one deterministic system for NON-TEXT elements (cards, tiles, rows, form fields, buttons, images). Text is handled separately by §4 — never animate the same element's opacity twice.
- `components/motion/Reveal.tsx`: framer `whileInView`, `viewport={{ once: true, amount: 0.2 }}` (no negative margin), `initial {opacity:0, y:24}`, `transition {duration:0.6, ease:[0.16,1,0.3,1]}`, props `as`, `delay`, `className`. Adds `data-reveal-el`.
- `components/motion/RevealGroup.tsx`: parent `variants` with `staggerChildren 0.08`, `delayChildren 0.05`; children consume `variants` only. Use for trust items, service cards, price rows (inside an open group), gallery tiles, booking fields, footer columns.
- Safety net: on mount set `data-motion-ready` on `<html>`; CSS `html:not([data-motion-ready]) [data-reveal-el] { opacity:1 !important; transform:none !important }`. Plus a 2s fallback in `Reveal`: if still hidden and inside the viewport (`getBoundingClientRect`), force the animate state.
- Lenis stays; wire `lenis.on('scroll', ScrollTrigger.update)`, and `ScrollTrigger.refresh()` after `document.fonts.ready`, after gallery images load, and after `price-group-toggled`. GSAP keeps only the hero timeline and ornament parallax.
- Choreography per section: title → subtitle → items (stagger) → footnote/CTA, 80–120ms apart, nothing > 0.7s. Reduced motion: all visible, no transforms.

## 4. Text reveal — implement the `text-reveal` skill in this project
The skill (`.claude/skills/text-reveal/SKILL.md`) is the SPEC: site-wide, word-by-word, random order, blurred + lifted, once, 15% into the viewport, CSS hides copy before first paint and JS reveals it. The files it references (`constants/textRevealConfig.ts`, `lib/textReveal.ts`, `TextRevealGlobal`, `.claude/rules/architecture.md`) DO NOT EXIST here yet — you are porting the system, not using it. There is no `LanguageProvider` on this site; skip the locale/translation parts, keep the split/restore contract.
- Create `constants/textRevealConfig.ts` (`TEXT_REVEAL`: `candidateSelector`, `skipSelector`, `enterRatio: 0.15`, `maxWords: 60`, timings: word duration 0.55s, per-word stagger 0.018s randomized order, `y 10px`, `blur 6px`, ease expo.out) and a helper that compiles the selectors into the CSS rule the root layout inlines (`<style>` in `app/layout.tsx` head) so copy is hidden before paint. Include a `html.no-js` / `:not([data-text-reveal-ready])` guard so copy is visible when JS fails.
- Create `lib/textReveal.ts` with `splitWords(el)` (MOVES the original text node into `.reveal-word` spans — never clones; handles nested inline elements like `<strong>`/`<span class="text-plum-700">` by splitting per text node; skips elements in flex/grid (fade as block) and over `maxWords`), `restoreWords(el)`, and the observer runtime.
- Create `components/motion/TextRevealGlobal.tsx` (client, renders null) mounted once in `app/layout.tsx`: one `IntersectionObserver` with `rootMargin` shrunk from the bottom by `enterRatio`, fires once per element, marks `data-reveal-state="pending|done"`, GSAP or WAAPI for the word animation (pick WAAPI to keep it independent of ScrollTrigger). Re-scan on DOM changes with a `MutationObserver` (accordion panels, lightbox captions, success state) — debounced.
- Coverage: `h1–h6, p, li, dt, dd, blockquote, figcaption`, bare `span`s outside links/buttons/labels, anything `data-reveal="text"`. `skipSelector`: header/nav, mobile menu, forms (labels/inputs/errors/aria-live), lightbox, `/admin`, the mobile bottom bar. Price rows: the row is a `li` → covered; keep it (words in a row are few). Dotted leaders must not become words (render them as a pseudo-element, not text).
- Hero exception (skill "case 2"): the hero eyebrow/H1/subtitle are owned by the GSAP hero timeline → mark the hero copy wrapper `data-reveal="off"` and make the timeline use `splitWords`/`restoreWords` from `lib/textReveal.ts` for a word-by-word arrival synced with the leaves/photo — never a local splitter, never a block fade.
- Cyrillic + fonts: split after `document.fonts.ready`; verify Playfair/Manrope Cyrillic glyphs are intact in `.reveal-word` spans; keep `text-wrap: balance` on headings; make sure the `лепоту` plum span survives the split.
- Do the skill's own check after scrolling the page end to end: the "nothing hidden" snippet must return `[]`, `[data-reveal-state="pending"]` must be empty.

## 5. Price list (fixes B4, B5)
- Keep `priceList` order everywhere. Desktop two columns filled in order (no greedy reorder).
- All groups collapsible below `lg` (desktop: all open by default, still collapsible). Animation: framer `AnimatePresence` + `motion.div` `height: 0 → auto`, `opacity`, `transition {height:{duration:0.4, ease:[0.16,1,0.3,1]}, opacity:{duration:0.25}}`, `overflow:hidden`; chevron rotates 180° in 0.3s; rows inside are a `RevealGroup` (stagger 0.04); `aria-expanded`, `role="region"`, `aria-labelledby`; dispatch `price-group-toggled` on animation complete.
- Price cells: number → `1.700`; `[a,b]` → two cells; `"+300"` → one cell spanning both columns, right-aligned; `"— / 3.500"` → parsed into „—" and „3.500". `tabular-nums`, `min-width:0`; nothing overflows at 360px (name truncates, leader shrinks first).

## 6. Everything else animated (calm, expensive)
Buttons hover `y:-1` / press `scale .98` (`whileTap`); service cards hover lift 4px + thumb scale 1.04; gallery tiles stagger 0.06 with image `scale 1.06→1`; Lightbox spring open (`stiffness 260, damping 26`), backdrop fade, arrows/swipe; booking fields stagger, success card `scale .96→1` + SVG check draws (`pathLength`), errors fade color (no shake); mobile bottom bar slides in after the hero CTA leaves the viewport, hides when `#zakazivanje` is in view; header logo scales 1→0.92 on scroll (desktop); corner ornaments parallax ±12px + 8s breathing rotation ±1.5° (desktop only). All under `motion-safe`; reduced motion → static.

## 7. Verification (mandatory before you report)
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` clean.
- Playwright at 390×844 and 1440×900: (a) scroll top→bottom in 12 steps (150ms waits), then assert every `[data-reveal-el]` has opacity `1` AND the text-reveal "nothing hidden" snippet returns `[]`; (b) open the mobile menu, assert dialog height ≥ `innerHeight`, screenshot; (c) open/close every price group, screenshot mid-animation; (d) full-page screenshots `docs/screenshots/v2-{390,1440}.png`; (e) 360px: no horizontal scroll, no cut-off prices.
- Cyrillic grep as in v1 for any new strings (put them in `content/site.ts` → `ui`).
- Report in Serbian: what changed, screenshots, decisions. Do not deploy — the user deploys after merging with the 3D session.

END PROMPT
```
