# Prompt 02 — Claude Code: izgradi ceo sajt (one-page + Convex zakazivanje)

## Kako se koristi (Jovan)
1. U terminalu u folderu projekta prvo odradi **preflight** (2 min), jer npm kroz agenta može da traje:
   ```powershell
   Remove-Item -Recurse -Force node_modules\three -ErrorAction SilentlyContinue
   npm install
   npm install convex
   npx convex dev
   ```
   Zašto `Remove-Item node_modules\three`: moja instalacija kroz mount je prekinuta usred raspakivanja, pa je `three` folder ostao polovičan (bez `package.json`) i npm odbija da ga prepiše. Brišemo samo taj polomljeni folder — `npm install` ga odmah vraća ceo. Three.js ostaje u projektu.
   `npx convex dev` će tražiti login i izbor projekta → izaberi **postojeći projekat `dfrajlica`**. Ostavi ga da radi u tom terminalu (on generiše `convex/_generated` i upisuje `.env.local`). Otvori drugi terminal za Claude Code.
   3D asseti su već gotovi: `public/models/leaf.glb` i `leaf-cluster.glb` (Blender 5.1 → glTF), izvor `docs/design/leaf-cluster.blend`. Agent ih samo Draco-kompresuje i učitava.
2. Pokreni `claude`, uključi ultracode ako hoćeš paralelne agente, i nalepi **ceo blok ispod** (od `BEGIN PROMPT` do `END PROMPT`).
3. Agent na kraju mora da ti da: `npm run build` zelen, screenshotove 390px i 1440px, i listu otvorenih pitanja za vlasnicu. Sve što je označeno „⚠️ potvrditi" nosiš na sastanak.

---

```
BEGIN PROMPT

ultracode

Orchestration instructions (read before anything else): run this as ONE Workflow with three long-lived implementation agents exactly as defined in §7 (A = UI sections, B = Convex + booking + admin, C = 3D/motion), running in parallel with `effort: 'high'` for A and C and `effort: 'medium'` for B, followed by an integration + verification stage (build, screenshots, Cyrillic check) at `effort: 'high'`. Do NOT split the UI into many micro-agents — three owners with clear file boundaries beat fifteen agents fighting over globals.css. Agents share the working tree (no worktree isolation) because file ownership is disjoint. Each agent's final message must list the files it created/changed and any integration point it expects from the others.

You are a senior UI/UX + web engineer (15+ yrs) shipping a production-quality one-page website for a beauty salon in Zemun, Belgrade, in ONE working session (~60 min). Work autonomously, decisively, and verify visually. Do not ask questions unless truly blocked — make the sensible call, note it in docs/DECISIONS.md, and keep going.

## 0. Context you MUST read first (in this order, ~3 min)
1. `AGENTS.md` — this is Next.js 16.3.4; APIs may differ from your training. Consult `node_modules/next/dist/docs/` before using any Next API you are unsure about (fonts, images, metadata, layout props).
2. `docs/brand-brief.md` — every fact about the salon (services, prices, phones, address, hours caveats, palette). Never invent facts not in this file.
3. `content/site.ts` — ALL page copy in Serbian Cyrillic, already prepared: nav, hero, trust strip, services, full price list, gallery image list, booking copy, deep-link builders. It is the single source of truth. Components must import from it; do not hardcode text in JSX.
4. `docs/design-references/desktop.png`, `hero.png`, `mobile.png` — the visual target. Follow them closely (layout, hierarchy, spacing, colors, corner ornaments, glossy 3D plum leaves). You may swap the photos for the real salon photos (see §2) and improve details, but the design language stays.
5. `public/images/instagram/manifest.json` + folders `hero/ manikir/ pedikir/ trepavice_obrve/ sprej_tan/ salon/` — 52 real salon photos (1440px+), already selected and safe to use (no faces except in trepavice_obrve which are eye close-ups). `public/images/source/` has older 011info interior photos (2018, yellow walls — use only if nothing better). `public/images/ornaments/leaf-{tl,tr,bl,br}.png` — the brand's watercolor corner leaves, transparent PNG, already cut. `public/logos/logo.png` — the logo (black chair/„Д" silhouette + „фрајлица" in plum), 2048px RGBA.

## 1. Stack (already in package.json — do not change versions)
Next.js 16.3.4 (App Router, RSC), React 19, TypeScript strict, Tailwind v4 (`@theme` tokens in `app/globals.css`), `three` + `@react-three/fiber` + `@react-three/drei` (hero 3D leaves), `gsap` + `@gsap/react` (hero entrance timeline, price-row stagger, ScrollTrigger), `framer-motion` (in-view reveals, booking sheet), `lenis` (smooth scroll), `convex` (backend for bookings). Site language: `<html lang="sr-Cyrl">`. ALL user-facing text is Serbian Cyrillic; the only Latin allowed: brand/technical terms already Latin in content/site.ts (e.g. WhatsApp, lash lift, poly gel, S/M/L/XL), phone numbers, the Instagram handle.

## 2. Page structure (single route `/`, sections in this order, each with an id used by the nav)
1. `Header` — sticky, transparent→white with blur on scroll. Logo left (public/logos/logo.png, height ~44px desktop / 36px mobile), nav center (Услуге · Ценовник · Галерија · Контакт), plum pill CTA „Закажи термин" right (opens booking section/sheet). Mobile: logo + hamburger → full-screen menu with big serif links.
2. `Hero` (#hero) — exactly like hero.png: eyebrow „КОЗМЕТИЧКИ САЛОН · ЗЕМУН" (tracked uppercase), H1 „Мали рај за / лепоту" (serif, „лепоту" in plum), subtitle line, two buttons. Right: rounded (28px) photo card using `/images/instagram/hero/ig-068-C8E8Lp2oUV6.jpg` (or pick the best of `hero/`; must be a nude/neutral manicure close-up). Around the card: **3D glossy translucent plum leaves** (see §4). Watercolor corner ornaments TL/TR from `ornaments/`. Mobile: stacked like mobile.png with a full-width CTA under the subtitle and one leaf cluster at bottom-right of the photo.
3. `TrustStrip` — light plum band (#F3E4EE) with three items + small plum heart icon (content: `trust`).
4. `Services` (#usluge) — title „Услуге" with a faint watercolor sprig behind it; 3×2 grid desktop / 2 columns mobile; each card: circular photo thumb + title (+ `short` description under the title on desktop, hidden on small mobile). Cards hover: lift + plum-tinted shadow. Clicking a card scrolls to its price group (`#cenovnik` and expands that group) — nice-to-have.
5. `PriceList` (#cenovnik) — warm paper background (#F7F2EC) with subtle paper grain (CSS noise or a tiny tiled PNG you generate), dark mocha text (#5B2E2A), serif title „Ценовник". Render ALL groups from `priceList` with dotted leaders (CSS, not dots typed by hand). Manikir group has two columns „Јана / Бранка". Desktop: two columns of groups; mobile: accordion per group (first open). Under it: `priceMeta.note` and `priceMeta.packages`. GSAP stagger on rows when in view.
6. `Gallery` (#galerija) — title + subtitle, then a masonry/strip of the 12 `gallery.images`, `next/image`, lazy, with a lightbox (framer-motion) on click. Add a link „Још радова на Инстаграму →".
7. `Booking` (#zakazivanje) — plum band (#7A1B63) with faint white watercolor leaves (ornaments with `mix-blend`/opacity or CSS mask), white serif title „Закажите свој термин", subtitle. Inside: the **booking form card** (white, rounded) — see §3. Beneath the form: the big white pill with the phone `069 889 3550` (tel: link) and small channel buttons (Вибер / WhatsApp / Инстаграм / SMS) built with `booking.channels[...].build(msg)`.
8. `Footer` (#kontakt) — logo, address (link to maps), both phones, hours summary (`site.hours.summary` — ⚠️ hours not confirmed, do NOT print a weekly table), Instagram + Facebook links, `footer.copyright`. Corner ornaments BL/BR.
9. Mobile-only sticky bottom bar: plum button „Закажи термин" with phone icon (like mobile.png), hidden when the booking section is in view.

Add `app/opengraph-image.tsx` (or a static OG PNG) and JSON-LD `BeautySalon` (name, address, telephone, sameAs Instagram/Facebook, priceRange „RSD") in `layout.tsx`. Metadata: title „Д фрајлица — Козметички салон Земун", description from `site.description`.

## 3. Booking with Convex (this is the feature the owner will see in a meeting — make it demo-ready)
- Convex project already exists: `dfrajlica`. `npx convex dev` is running in another terminal and has written `.env.local` (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`). If `convex/_generated` is missing, run `npx convex dev --once`. If auth is missing, STOP and tell the user to run `npx convex login` — do not fake the backend.
- `convex/schema.ts`: table `bookings` { name: string, phone: string, serviceId: string, serviceTitle: string, staff?: "jana" | "branka" | "any", date: string (YYYY-MM-DD), timeSlot: "prepodne" | "popodne" | "any", note?: string, status: "nov" | "potvrdjen" | "otkazan", createdAt: number, source: "web" } with indexes by_createdAt, by_status, by_phone.
- `convex/bookings.ts`: `create` mutation with `v` validators; server-side checks: name 2–60 chars, phone matches Serbian mobile/landline (`/^(\+381|0)[0-9\s\/-]{7,12}$/` after stripping spaces), date ≥ today and not Sunday, honeypot field `website` must be empty, rate limit: max 3 requests per phone per 60 min (query by_phone). Returns `{ id }`. `list` query (args: `key: string`) returns bookings newest first ONLY if `key === process.env.ADMIN_KEY` (set with `npx convex env set ADMIN_KEY <value>`; if not set, generate one, set it, and print it in the final report). `setStatus` mutation (key + id + status).
- Frontend: `components/providers/ConvexClientProvider.tsx` ("use client", `ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)`) wrapping `{children}` in `app/layout.tsx`. `components/booking/BookingForm.tsx` ("use client"): fields — Име и презиме, Телефон, Услуга (select from `services`), Мајстор (only when service = manikir: Јана / Бранка / Свеједно), Датум (native date input, min = tomorrow, Sundays disabled via validation message), Време (Преподне / Поподне / Свеједно), Напомена (textarea, optional), hidden honeypot. Inline validation messages in Cyrillic. Submit → `useMutation(api.bookings.create)` → success state: „Захтев је примљен ✓ — потврђујемо порукoм или позивом на {телефон}." with the quick-channel buttons for people who want to write immediately. Error state offers the phone/Viber fallback. Optimistic UI, disabled button while pending, `aria-live` on status.
- `app/admin/page.tsx` — minimal, not linked from the site: a key input (kept in sessionStorage), then a table of bookings (date, time, service, staff, name, phone as tel: link, note, status) with buttons „Потврди" / „Откажи". Cyrillic. This is what the owner will be shown as „ваш панел".

## 4. Motion & 3D (premium but disciplined)
- **The look to match is `docs/design-references/leaf-reference.png`**: plump, elongated, cupped magenta-glass leaves with bright specular highlights and a slightly darker translucent core — like blown glass, not flat plastic. Judge your R3F material against that image (screenshot the hero and compare).
- **3D assets are already modeled in Blender and exported**: `public/models/leaf-cluster.glb` (a sprig: curved stem + 6 alternating cupped leaves, ~1.1 MB before Draco) and `public/models/leaf.glb` (single leaf, ~190 KB). Source: `docs/design/leaf-cluster.blend`, preview `docs/design/leaf-cluster-blender-preview.png`. First thing agent C does: `npx @gltf-transform/cli optimize public/models/leaf-cluster.glb public/models/leaf-cluster.glb --compress draco` (same for leaf.glb) and load with drei `useGLTF` + `useGLTF.preload` (drei's default Draco decoder path is fine online; if offline, copy `node_modules/three/examples/jsm/libs/draco/` into `public/draco/` and set `useGLTF(url, '/draco/')`).
- **Blender MCP is available to you** (tools `mcp__*Blender*`: `execute_blender_code`, `render_viewport_to_path`, screenshots). If the sprig needs refinement (more curl, thinner leaves, a second variant with 3 leaves for mobile), open `docs/design/leaf-cluster.blend`, modify with `bpy`, render a preview, and re-export GLB with `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB', export_apply=True, export_yup=True)`. Keep each GLB < 400 KB after Draco. Do not spend more than 8 minutes in Blender — the current asset is already good.
- `components/hero/HeroLeaves.tsx` ("use client", loaded with `next/dynamic` `ssr:false`): R3F `<Canvas>` transparent, camera fov ~35, two instances of the sprig positioned like `hero.png` (top-left of the photo card, bottom-right of it; on mobile one at bottom-right per `mobile.png`). Override every mesh material with `MeshPhysicalMaterial` { color #8B1E6E, transmission 0.78, thickness 0.5, roughness 0.1, clearcoat 1, clearcoatRoughness 0.05, ior 1.45, attenuationColor #B23C8F, attenuationDistance 1.2, envMapIntensity 1.2 }. Lighting: soft key + rim + a subtle plum-tinted fill; for reflections use drei `<Environment>` **built from `RoomEnvironment`/`PMREMGenerator` procedurally — do NOT use presets that download HDR files**. drei `<Float>` (speed 1.2, rotationIntensity 0.35, floatIntensity 0.6) + mouse parallax via `useFrame` (lerp, max ±6°). Cap DPR at 1.5, `frameloop="always"` only while hero is on screen (IntersectionObserver → `frameloop="demand"` otherwise). Respect `prefers-reduced-motion`: render the static fallback instead.
- Static fallback (also used on mobile < 768px to save battery): crop the 3D leaf clusters out of `docs/design-references/hero.png` into transparent PNGs (`public/images/ornaments/leaf3d-{a,b}.png`) using sharp/python — they already look perfect. Alternatively render the GLB sprig from Blender with a transparent background (`film_transparent = True`, EEVEE, 1600px) to `public/images/ornaments/leaf3d-render.png`.
- GSAP: hero timeline on mount (eyebrow → title lines with clip-path reveal → subtitle → buttons → photo card scale/fade), price rows stagger with ScrollTrigger, subtle parallax on corner ornaments. framer-motion: `whileInView` reveals for section titles/cards (once). lenis: `components/SmoothScroll.tsx` synced to gsap ticker; anchor links must still work (use lenis `scrollTo` for `#` links).
- Motion budget: nothing longer than 900ms, easing `power3.out`/`expo.out`, no bounce on text. Everything must feel calm and expensive.

## 5. Design tokens (put in `app/globals.css` under `@theme`)
--color-plum-700 #7A1B63; --color-plum-500 #9B2C82; --color-plum-300 #C98BB8; --color-plum-100 #F3E4EE; --color-paper #F7F2EC; --color-ink #2B1A26; --color-mocha #5B2E2A; --color-white #FFFFFF. Fonts via `next/font/google`: headings **Playfair Display** (subsets latin + cyrillic, weights 400/500/600) → `--font-serif`; body **Manrope** (subsets latin + cyrillic, 400/500/600/700) → `--font-sans`. Radius: cards 20px, photo card 28px, pills 999px. Shadows plum-tinted (`0 20px 50px -20px rgb(122 27 99 / .25)`). Container max 1200px, section padding 96px desktop / 64px mobile. Type scale: H1 clamp(44px, 7vw, 96px) serif 1.02 line-height; H2 clamp(36px, 4vw, 56px); body 17px/1.6.

## 5b. Skills & tools — use everything available
- Invoke these skills when they exist in your environment (check the skills list; skip silently if absent): `impeccable` (design/UX pass on every section before calling it done), `ui-ux-pro-max`, `design-taste-frontend` (component architecture + CSS performance rules), `motion-design` (timing/easing choreography), `3d-scrollytelling` (R3F + GSAP ScrollTrigger patterns), `liquid-glass` (glass material/backdrop surfaces if used on the header), `apple-design` (spring/gesture polish for the mobile menu and lightbox). Read each skill once, apply its rules, do not let it derail the time-box.
- MCP servers you may use: **Blender** (see §4), **Playwright/browser** for screenshots, **Convex** CLI via `npx convex`. Nothing else is required.

## 6. Quality bar / definition of done
- `npm run build` passes with zero TS errors and no ESLint errors; no `any`.
- All images through `next/image` with correct `sizes`; hero image `priority`. Logo PNG is fine.
- Lighthouse-minded: no layout shift (reserve aspect ratios), fonts `display: swap`, 3D canvas lazy.
- Accessibility: semantic landmarks, focus-visible styles in plum, form labels, contrast ≥ 4.5:1 for body text (white on #7A1B63 is fine), lightbox with Escape + focus trap, reduced-motion honored.
- Responsive: 360, 390, 768, 1024, 1440. No horizontal scroll ever.
- Cyrillic check: grep all `.tsx` for Latin letters inside JSX text nodes; anything not in the allowed list above is a bug.
- Verification (mandatory): run `npm run build && npm run start` (or `next dev`), then use Playwright (already available; `npx playwright screenshot` or a tiny script) to capture full-page screenshots at 390×844 and 1440×900 into `docs/screenshots/`. LOOK at them, compare with the references, fix the 3 biggest visual gaps, re-screenshot. Also screenshot `/admin` with one test booking created via the form (then mark it „otkazan").
- Final report to the user (in Serbian): what was built, the ADMIN_KEY (if generated), the screenshots paths, decisions made (docs/DECISIONS.md), and the open questions for the owner: exact weekly hours per staff, whether prices are shown per staff, Cyrillic naming of Gel lak / lash lift / spray tan, photo rights, „Депилација дубоких препона" price (1100?).

## 7. Time-box (60 min) and, if running as multiple agents (ultracode), file ownership
- 0–8 min: preflight check (`node_modules/three` present? `convex/_generated` present?), tokens, fonts, layout, providers, ornaments cropped, `content/site.ts` wired.
- 8–35 min: Header, Hero (with static leaves first), TrustStrip, Services, PriceList, Gallery, Footer, mobile bar.
- 25–45 min (parallel agent B): Convex schema + functions + BookingForm + /admin.
- 30–45 min (parallel agent C): Draco-compress GLBs, HeroLeaves R3F (useGLTF + physical glass material) + GSAP timeline + lenis; optional Blender refinement via MCP (max 8 min); must not touch files owned by A/B.
- 45–60 min: integrate, build, screenshots, fixes, report.
Ownership: Agent A owns `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `components/sections/*`, `components/ui/*`. Agent B owns `convex/*`, `components/booking/*`, `components/providers/*`, `app/admin/*`. Agent C owns `components/hero/HeroLeaves.tsx`, `components/motion/*`, `components/SmoothScroll.tsx`, `public/models/*`, `public/images/ornaments/leaf3d-*.png`, `docs/design/*.blend`. Integration points are agreed up front: `<HeroLeaves />` is rendered by A inside Hero behind a `dynamic()` import; `<BookingForm />` is rendered by A inside the Booking section; `<SmoothScroll />` is mounted by A in layout. Nobody edits another owner's files; request changes via the integrator.

Ship it. Calm, precise, premium. Every pixel in Cyrillic.

END PROMPT
```

---

## Napomene (Jovan)
- Ako Claude Code zapne na `convex/_generated` — to znači da `npx convex dev` nije uspeo login. Uradi `npx convex login` pa ponovo `npx convex dev`.
- Za sastanak: pokaži `/` na telefonu (mobile.png je ono što će ona videti), pa `/admin` na laptopu sa test-zakazivanjem koje napraviš sa telefona uživo — to je „aha" momenat.
- Posle sastanka: deploy na Vercel (`deploy-to-production` skill), env `NEXT_PUBLIC_CONVEX_URL` iz `.env.local`, `npx convex deploy` za prod backend.
