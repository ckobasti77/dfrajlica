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
