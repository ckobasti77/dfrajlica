# Odluke tokom izrade (DECISIONS)

Datum: 2026-09-03

## Radni direktorijum
- Git repo je ceo `C:\Users\admin` (home). Projekat `Desktop\Web Dev Projects\dfrajlica` je u njemu **netrackovan**, pa je automatski
  kreirani worktree (`.claude/worktrees/ultracode-salon-site-8c3c77`) bio prazan. Rad je obavljen direktno u pravom folderu projekta.
  Preporuka: `git init` unutar `dfrajlica` (nested repo) i commit pre deploy-a.
- Harness worktree u `.claude/worktrees/` sadrži kopije tuđih projekata (scanme-mvp, abluxtravel…), pa je `.claude/**` dodat u
  `eslint.config.mjs` globalIgnores i `tsconfig.exclude` (zajedno sa `convex/_generated/**`, `public/**`, `Claude outputs/**`).

## Dizajn (Agent A + integrator)
- Header je `position: fixed` (64px mobil / 80px desktop), providan preko akvarel ornamenata u vrhu hero-a; posle 24px skrola dobija belu pozadinu 85% + blur + plum-100 liniju.
- Logo: originalni `public/logos/logo.png` (2048×1143) ima ~63% praznog prostora po vertikali, pa je logotip u headeru bio sićušan. Integrator je iz njega isekao `public/logos/logo-wide.png` (1200×270) i njega koriste Header, Footer i OG slika.
- Hero fotografija: zamenjena sa `ig-068` (mlečno beli nokti na crnoj tkanini) na `ig-029-DIGLJvSoRBp.jpg` (nude bademasti nokti na roze peškiru) jer odgovara toploj bež paleti reference; alt ispravljen u `content/site.ts`.
- Hero na mobilnom: samo primarni CTA („Закажи термин") — sekundarni „Ценовник" je sakriven ispod 640px (`max-sm:hidden`, jer je bazni `inline-flex` iz Button-a pobeđivao `hidden`).
- Naslov hero-a su dva `span[data-hero="title-line"]` u `.line-mask` omotaču; zadnja linija plum-700.
- TrustStrip koristi plum srce za sve tri stavke (kao na referenci); `trust[].icon` se ignoriše (Pin ikona postoji u Icons.tsx).
- Services: vertikalne kartice sa kružnim thumb-om (96/120/160px) na svim širinama; klik šalje `open-price-group` event + `scrollToHash('#cenovnik')`.
- Cenovnik: dve kolone na desktopu (greedy podela po broju redova uz očuvan redosled), akordeon ispod 1024px (prva grupa otvorena); Manikir ima Јана/Бранка kolone; cene bez „дин" sufiksa, valuta u napomeni.
- Galerija: CSS multi-column masonry (2/3 kolone), Lightbox sa Escape/strelicama, fokus-trap i vraćanje fokusa.
- Booking sekcija: bela kartica sa BookingForm + veliki tel: pill + brzi kanali (Viber, WhatsApp, Instagram, SMS); ornamenti invertovani preko plum-700.
- MobileBar (fiksni CTA) se sakriva kad je #zakazivanje ≥15% u vidnom polju.
- `html, body { overflow-x: clip }` — listovi/ornamenti smeju da prelaze ivicu bez horizontalnog skrola. Provereno na 360/390/768/1024/1440: `scrollWidth <= innerWidth` svuda.
- Bazna pravila `img/picture/video { display:block }` i `button { font: inherit }` premeštena u `@layer base` — van layer-a su pobeđivala Tailwind utilitije (`hidden` nije radio na slikama, pa se gornji levi list video na mobilnom).
- Footer: društveni pill-ovi se prelamaju (`flex-wrap`) da ne prelaze 360px.

## Sadržaj / ćirilica
- `content/site.ts` je jedini izvor teksta. UI natpisi (aria oznake, „Услуге", „Још радова на Инстаграму", brza poruka…) preseljeni u `content/site.ts` kao `ui` (+ `servicesMeta.title`); `components/ui/strings.ts` je samo re-export (`export { ui as strings }`).
- Forma i admin: svi natpisi u `components/booking/strings.ts` (ćirilica). Honeypot labela promenjena sa „Website" na „Веб сајт" (skrivena, aria-hidden).
- Grep JSX tekst-čvorova i label/placeholder/alt/title propova: nema latinice osim dozvoljenih (WhatsApp, lash lift, poly gel, S/M/L/XL, telefoni, IG handle). `<html lang="sr-Cyrl">`.
- OG slika (`/opengraph-image`) proverena vizuelno: ćirilica se renderuje ispravno (podrazumevani next/og font).

## 3D / motion (Agent C + integrator)
- `leaf-cluster.glb` Draco-kompresovan 1,145,784 → 155,520 B (bez simplifikacije; simplifikacija je kvarila ivice). Draco dekoder self-hostovan u `/public/models/draco/` (učitava se samo na desktop 3D putanji). `leaf.glb` prošao kroz `optimize` (lossy, ne koristi se; backup originala nema u repou).
- HeroLeaves režim: statični PNG (< 1024px, prefers-reduced-motion, nema WebGL, ili greška u Canvas-u); inače R3F. **Odstupanje od ugovora:** prag podignut sa 768 na 1024px jer Hero omotač dobija 120px „prostora za listove" tek od `lg` — na 768–1023px bi se 3D listovi crtali unutar fotografije. Na mobilu/tabletu prikazuje se samo donji desni PNG list (kao na mobile.png).
- Statični PNG listovi (`leaf3d-a/b.png`) isečeni iz hero.png HSV ključem; pozicije su responsive Tailwind klase (mobil: omotač = kartica; lg: omotač = kartica + 120px).
- LeafScene: `CARD_FRACTION` 0.8 → 0.7 (stvarni odnos kartica/omotač 520/760); tri grančice (gore-levo, dole-desno, mala dole-levo kao na hero.png) sa span 0.34/0.38/0.26; materijal: color #B23A8E, transmission .72, thickness .9, attenuation #7A1B63 @ .6, envMapIntensity 1.6, exposure 1.0, roze point light 4 → 1.5 (ranije je izgledao kao ravna plastika).
- Studio osvetljenje: RoomEnvironment (PMREM), ACES tone mapping, dpr ≤ 1.5, frameloop `demand` van vidnog polja, pointer parallax ±6°, drei Float.
- Motion hookovi: `useHeroTimeline` (gsap.matchMedia, immediateRender), `useStaggerRows` (ScrollTrigger.batch + MutationObserver + `price-group-toggled` event), `useParallax` (scrub), `Reveal` (framer-motion, reduced-motion → običan element). `SmoothScroll` = Lenis 1.3 na gsap.ticker-u, isključen pod reduced-motion; `scrollToHash` sa 80px offsetom i native fallback-om.
- Poznato: `THREE.Clock` deprecation upozorenje dolazi iz drei `Float` — bezopasno.

## Convex / zakazivanje (Agent B)
- Šema `bookings` (indeksi by_createdAt, by_phone, by_status); funkcije `api.bookings.create / list / setStatus`.
- Zaštite: honeypot `website` (lažni uspeh `{ id: null }`), rate-limit 3 zahteva/sat po normalizovanom telefonu, telefon regex `^(\+381|0)\d{7,11}$`, datum ≥ danas (Europe/Belgrade) i ne nedelja, `staff` samo za manikir, `note` ≤ 300, `serviceTitle` ≤ 80.
- Admin `/admin` (noindex, nije linkovan): ključ se proverava server-side kroz `process.env.ADMIN_KEY`; čuva se u sessionStorage; pogrešan ključ → ErrorBoundary „Неисправан кључ".
- ADMIN_KEY (dev deployment `gregarious-oriole-702`): `RYTTdqZPAlbzN963RzdA7Cp8`. Za produkciju: `npx convex env set ADMIN_KEY <vrednost> --prod`.
- `NEXT_PUBLIC_CONVEX_URL` je u `.env.local`; bez njega forma prikazuje fallback (poziv/Viber) i sajt i dalje radi.
- Demo: u panelu postoji jedan test zahtev („Тест Тестић", 07.09.2026, Маникир/Јана, Преподне) sa statusom „Отказан" — može se obrisati iz Convex dashboard-a.

## Verifikacija (integrator)
- `npx tsc --noEmit`: 0 grešaka. `npx eslint .`: 0 grešaka, 0 upozorenja.
- `npm run build` (Next 16.3.4, Turbopack): prošao; rute `/`, `/_not-found`, `/admin`, `/opengraph-image` (statične).
- Produkcioni server testiran na portu 3100 (3000 je zauzet tuđim procesom, PID 17508, nije diran); server ugašen posle testa.
- Konzola: 0 grešaka (samo THREE.Clock deprecation i „preload not used" upozorenja za next/image priority slike).
- Screenshotovi (`docs/screenshots/`): `hero-1440.png`, `desktop-1440.png`, `hero-1024.png`, `hero-768.png`, `hero-390.png`, `hero-360.png`, `mobile-390.png`, `booking-success.png`, `admin-1440.png`, `admin-after.png`.
- Tri najveća vizuelna gapa koja su ispravljena: (1) hero listovi — preveliki, preklapali navigaciju, ravan magenta materijal → manji, na uglovima kartice, staklasti materijal, treća grančica; (2) logo praktično nevidljiv u headeru zbog praznog prostora u PNG-u → `logo-wide.png`; (3) tamna hero fotografija i mobilni hero (dva CTA, list unutar fotografije) → topla fotografija, jedan CTA, list na donjem desnom uglu.
- Pristupačnost: sve slike imaju alt (dekorativne `alt=""`), dugmad imaju imena, labele povezane (`htmlFor`), Lightbox zatvara Escape, `:focus-visible` plum outline globalno, reduced-motion ne sakriva ništa trajno.
- Booking tok testiran end-to-end: forma → Convex → `/admin` tabela → „Откажи" menja status u „Отказан".

## Otvorena pitanja za vlasnicu
- Tačno radno vreme po danima / po majstoru (trenutno samo „уз заказивање, радним данима и сваке друге суботе").
- Da li cene prikazivati po majstoru (Јана/Бранка) i za druge grupe, ili samo za manikir.
- Ćirilično imenovanje stranih termina: Gel lak / lash lift / spray tan (sada: „Гел лак", „lash lift", „Спреј тен").
- Prava na fotografije sa Instagrama (da li su sve iz salona / dozvola klijentkinja).
- Cena „Депилација дубоких препона" — u cenovniku stoji 1.100, potvrditi.
- Da li Telegram i „Позови" prikazivati kao brze kanale (sada Viber, WhatsApp, Instagram, SMS).
- Statični leaf PNG-ovi imaju sitne artefakte (senka/sjaj sa hero.png) — po želji ručno očistiti u editoru.

## Polish — 3D (staklasti listovi u hero-u)

Cilj: `docs/design-references/leaf-reference.png` + raspored sa `hero.png`. Desktop sada prikazuje **GLB kroz R3F**
(`MeshTransmissionMaterial`); nije se išlo na 2.5D fallback.

### Geometrija — napravljena iznova
- Stara geometrija (Solidify + Bevel + Subsurf preko ravne ploče) bila je tanka, tupih vrhova, 6 listova na dugoj
  stabljici — ni oblik ni kompozicija nisu odgovarali referenci. Zamenjena je **parametarski generisanim sočivom**
  (bikonveksni solid): presek `z = t·(1-|s|^rim)`, širina `u^wa·(1-u)^wb` podignuta na `full`. Oštar rub po celom
  obodu, puna sredina, šiljati vrhovi. Parametri: ratio 2.35, thick 0.62, rim 1.85, cup 0.30, bend 0.16, twist 0.30.
  `rim` je namerno spušten ispod 2: površina se tada povija ka ivici preko šireg pojasa, a taj pojas je ono što pod
  grazing Fresnel-om čita kao debela tamna šljiva-ivica sa reference.
- Sprig = **3 lista + kratka stabljika** (kao na `hero.png`), ne 6 listova na dugoj stabljici. Ista grančica se
  koristi tri puta, sa različitim rotacijama.
- Generator je parametarski Python, sačuvan **unutar `.blend` fajla kao Text datablock `build_leaf.py`**
  (Text Editor → Run Script rebuild-uje i re-eksportuje). Model se gradi u ravni pa rotira +90° oko X, tako da posle
  `export_yup=True` stoji uspravno i gleda u kameru — u R3F nije potrebna nikakva korekcija rotacije.
- **Debljina je zapečena u UV.x** (svaki vertex nosi svoju poludebljinu podeljenu poludebljinom najdebljeg mesta).
  U R3F se kao `thicknessMap` prosleđuje 256×1 `DataTexture` (zeleni ramp). Ovo je bila najveća pojedinačna razlika:
  bez toga je `thickness` jedna konstanta za ceo list, Beer-ov zakon daje ravnomernu boju i staklo izgleda kao ravan
  vektorski oblik. Sa mapom se dobija pravi gradijent — puno jezgro upija, tanki bokovi ostaju svetli.
- `leaf-cluster.glb`: 282.432 B sirovo → **49.152 B** posle `gltf-transform draco`
  (`--quantize-texcoord 14`, jer UV nosi podatak o debljini, ne teksturne koordinate). 4.774 trougla.

### Materijal i osvetljenje — odatle dolazi izgled
Tri stvari koje su pojedinačno bile pogrešne i tek zajedno daju rezultat:
1. **`background` na `MeshTransmissionMaterial` je obavezan.** Materijal uzorkuje scenu u FBO, a canvas je providan —
   bez eksplicitne podloge staklo prelama crnu clear boju i listovi se renderuju skoro crni.
   `TRANSMISSION_BACKDROP = #FFF7FB`.
2. **Environment mora biti taman** (`ENV_BASE = #1C0517`), a *ne* svetao. Sa svetlim environmentom preko celog lista
   legne ravnomeran neutralan specular, šljiva se desaturiše u sivo, a Fresnel-ivica postane bleda — obrnuto od
   reference, gde je ivica najtamniji deo. Svetlo dolazi isključivo iz `Lightformer`-a: veliki mekani key gore-levo,
   dve uske jarke vertikalne trake (to su duge bele pruge po dužini lista), topli roze fill odozdo i uska traka iza
   kamere za rim. `form="ring"` je izbačen — reflektuje se kao vidljiva ovalna mrlja na ravnijim licima listova.
3. **Odstupanje od vrednosti zadatih u promptu:** `color` `#C23B98` → `#DE72B7`, `attenuationDistance` 0.7 → 4.6,
   `thickness` 1.2 → 3.4. Zadate vrednosti pretpostavljaju drugu skalu modela; na našoj (mesh scale ≈ 0.65) gasile su
   zeleni kanal na 4–5, pa su listovi čitali kao tamna aubergine umesto magente. Mereno na `hero.png`: referentni
   median (139, 68, 112), naš sada (137, 33, 98) — pre korekcije (91, 4, 56). `thickness` je sada *maksimalna*
   debljina koju mapa skalira naniže, otud veća vrednost.
- Ostalo po ugovoru: samples 6, resolution 512, transmission 1, roughness 0.05, ior 1.5, chromaticAberration 0.05,
  anisotropy 0.15, distortion 0.08, distortionScale 0.4, temporalDistortion 0.1, clearcoat 1, backside true,
  `attenuationColor #7A1B63`, ACES, exposure 1.15, `Bloom intensity 0.5 / luminanceThreshold 0.8 / mipmapBlur`,
  dpr ≤ 1.5, `frameloop="demand"` van vidnog polja, pointer parallax ±5°,
  `Float speed 1.05–1.2 / rotationIntensity 0.3 / floatIntensity 0.5`.
- `MeshPhysicalMaterial` fallback **nije uključen** — nije bio potreban, vidi merenja niže.

### Ispravljeni bagovi
- **Canvas je bio pogrešno dimenzionisan i sekao je donji desni sprig.** R3F meri preko `getBoundingClientRect`, koji
  uključuje GSAP `scale` sa hero ulazne animacije, a ResizeObserver posle toga ne vidi promenu jer transform nije
  layout. Rešeno sa `resize={{ offsetSize: true }}` (canvas 697×813 → tačnih 726×847).
- **Pozicije se više ne pogađaju.** `HeroLeaves` meri `.frame` u odnosu na svoj sloj (ResizeObserver) i prosleđuje
  odnos kartica/canvas u `LeafScene`; `POSITIONS` su sada u koordinatama *kartice* (±0.5 = ivica kartice), izmerenim
  sa `hero.png`. Radi na svakom breakpoint-u, bez hardkodovanih 520/650/120.
- Gornji levi sprig je prvo bio „ogledaljen" rotacijom oko Y ≈ π; to okreće naličja listova ka kameri i čita znatno
  ravnije od druga dva. Umesto toga je rotiran +55° oko Z (listovi 124/58/5° → 179/113/60°, stabljika nadole) — to je
  V plus jedan niski list, tačno kao u tom uglu na `hero.png`.
- Sve 4 mreže grančice se spajaju u jednu geometriju pri učitavanju: `MeshTransmissionMaterial` radi backside prolaz
  po *mesh*-u, pa je 1 umesto 4 mesh-a ≈ 4× jeftinije. Dva mala sprig-a rade na FBO rezoluciji 256 umesto 512 (na
  ~150px na ekranu se ne vidi).

### Statični PNG-ovi (mobilni / bez WebGL-a)
- `leaf3d-a/b.png` **više nisu isečeni iz `hero.png`** (izvor je bio ~190px, pa su bili mekani i sa artefaktima senke).
  Sada se seku iz **žive 3D scene na 3×**, preko chroma-key pozadine (`#00ff00`; staklo ne uzorkuje stranicu jer ima
  fiksni transmission backdrop, pa zeleno može biti samo prava pozadina), uz despill zelenog ruba. 420px, ~103–114 KB.
  Posledica: mobilni i desktop prikazuju identično staklo.
- `lg` pozicije statičnih slika izvedene su iz `POSITIONS`, da cross-fade na 3D ne „skoči". Ispod `lg` se, kao na
  `mobile.png`, vidi samo desni sprig — uz desnu ivicu fotografije, oko tri četvrtine visine
  (`right-[-2%] bottom-[12%] w-[32%]`).

### Merenja
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` — čisto.
- Konzola: nema grešaka iz 3D putanje. Jedina greška na stranici je `400` sa `/_next/image` — vidi „Za UI sesiju".
- Performanse, RTX 4060 Laptop (ANGLE/D3D11), 1440×900: **60 fps zaključano na vsync, p95 18 ms, bez ispuštenih
  frejmova**; sa isključenim vsync-om median petlje **1.0 ms**. Velika rezerva, pa fallback materijal nije uključen.
  Napomena: **nije testirano na slaboj mašini** — nemam je ovde. Ako se na integrisanoj grafici pokaže problem,
  `MeshPhysicalMaterial` varijanta iz ugovora ostaje kao opcija.
- Iteracija je bilo **12, ne 6**. Prve četiri su otišle na dijagnostiku tri prave greške (crno staklo zbog FBO
  podloge, sivo staklo zbog svetlog environmenta, pogrešna veličina canvas-a), ne na estetiku; posle toga je
  konvergencija bila jasna, pa je nastavak bio opravdaniji od prelaska na 2.5D fallback.
  Poređenja: `docs/screenshots/leaves-compare-6/9/11/final.png`.

### Za UI sesiju (ne diram — vlasništvo druge sesije)
- **`content/site.ts` pokazuje na fajlove koji ne postoje.** `hero.image.src` je
  `/images/instagram/hero/ig-029-DIGLJvSoRBp.jpg`, a u `public/` postoji samo `.avif` verzija — hero fotografija je
  slomljena (`400` sa `/_next/image`). Isto važi za `/images/instagram/hero/ig-034-DGkaSmyotBn.jpg`. Ispravka je
  `.jpg` → `.avif` na oba mesta. Screenshotovi `hero-1440-v2.png` / `hero-390-v2.png` snimljeni su sa tom ispravkom
  primenjenom u browseru, da bi listovi bili merljivi.
- `Hero.tsx` **nije bilo potrebno menjati** — sve staje u postojeći omotač (kartica + 120px na `lg`).
- Na 390×844 donja ivica hero kartice pada tačno na pregib, pa je mobilni list na samoj granici vidljivog. Ako se
  kartica podigne ~40px, list bi bio ceo u prvom ekranu (kao na `mobile.png`).
