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

## Polish — UI/motion

Sesija: полирање живог сајта (Next 16.3.4, Tailwind v4, framer-motion, GSAP, Lenis). Радни worktree; власништво: `components/*`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, нови `lib/textReveal.ts`, `constants/textRevealConfig.ts`, `content/site.ts` само `ui`. Није дирано: `components/hero/*` 3D, `public/models`, `public/images/ornaments/leaf3d-*`, `convex/*`.

### Два система за откривање (reveal) — да се opacity никад не анимира двапут
- **Текст (реч по реч):** нови `constants/textRevealConfig.ts` (`TEXT_REVEAL` + `textRevealHideCss()` + `textRevealHeadScript()`) и `lib/textReveal.ts` (`splitWords` МЕСТИ текст-чворове у `.reveal-word` спанове — никад не клонира; `restoreWords`; рантайм са једним `IntersectionObserver` + `MutationObserver`, WAAPI, насумичан редослед речи, blur 6px/y 10px/0.55s). `TextRevealGlobal` монтиран једном у `app/layout.tsx`.
- Скривање пре првог фрејма: инлајн `<style>` у `<head>` (из `textRevealHideCss()`) + инлајн скрипта која поставља `data-text-reveal-active` и има 2.6s failsafe (ако рантайм не крене, копија постаје видљива). CSS правило **изузима skip-подстабла** (`header/nav/form/[role=dialog]/[data-reveal=off]/…`) истом логиком као рантайм `closest(skipSelector)` — иначе би хром остао трајно скривен.
- **Не-текст (картице/плочице/редови/поља):** `components/motion/Reveal.tsx` (framer `whileInView`, amount 0.2, once, `initial{opacity:0,y:24}`, 2s fallback преко `getBoundingClientRect`, `data-reveal-el`) и `components/motion/RevealGroup.tsx` (`RevealGroup`/`RevealItem`, `staggerChildren`). `Reveal` и `RevealItem` носе `data-reveal="off"` да их текст-систем не дира.
- Safety net у `globals.css`: `html:not([data-motion-ready]) [data-reveal-el]{opacity:1!important}`; `data-motion-ready` поставља `TextRevealGlobal` на mount (клијент, не head — да преживи неуспелу хидратацију).
- **Bottom-catch:** скупљени root (−15%) никад не досегне доњих 15% стране, па најнижи елементи (нпр. фусnote copyright) не окидају; додат scroll/resize handler који их открије кад је страна на дну. Провера „ништа скривено" враћа `[]` и на 390 и на 1440.
- Обрисан `components/motion/useStaggerRows.ts` (ScrollTrigger.batch + MutationObserver — узрок B3); GSAP задржава само hero timeline и parallax.

### Hero (skill „case 2")
- Копија је у `data-reveal="off"` омотачу; `useHeroTimeline` користи `splitWords`/`restoreWords` из `lib/textReveal.ts` (никад локални splitter, никад block-fade) — речи стижу reč по reč синхроно са фотографијом. Наслов су два блок-спана (задњи plum-700), plum „лепоту" преживљава поделу. Под reduced-motion: без поделе, копија остаје видљива.
- Уклоњено fade-овање орнамената у timeline-у (узрок B2 — листови остајали невидљиви). Орнаменти видљиви по дефолту; parallax само транслира (±12px, desktop+motion-safe); додата „breathing" ротација ±1.5°/8s на унутрашњи `<img>` (desktop, motion-safe) да не колидира са GSAP transform-ом на омотачу.

### B1/B2 — мобилни хедер и мени
- Мени се рендерује кроз `createPortal` у `document.body` (`fixed inset-0 min-h-[100dvh] z-[70] bg-white`), хедер испод. Хедер више **не** блурује док је мени отворен (`blurred = scrolled && !open`) — `backdrop-filter` је правио containing block за fixed децу (B1: дијалог 136px → сад = innerHeight, потврђено 844=844).
- Focus trap (Tab циклус), Escape, scroll-lock, `lenisStop()/lenisStart()` (нови експорти у `SmoothScroll`). Лого горе-лево / X горе-десно у истим позицијама као затворено стање (иста `ROW` геометрија, `px-6`). Линкови serif 36px, plum-100 дивидери, stagger (y16→0, 0.45s, 0.06). CTA + адреса + телефон на дну, два листа 40% у угловима. Мени је `data-reveal="off"`.
- B2: лого `h-9` на мобилном, top scrim (`from-white/90…`) кад није скроловано да лого/хамбургер увек читљиви; hero орнаменти смањени на `w-24` и померени напоље.

### B4/B5 — ценовник
- Редослед `priceList` очуван свуда. Десктоп: две колоне се пуне **префикс/суфикс** поделом (`splitColumns`) — леви = први K група, десни = остатак; слагањем леви-па-десни на мобилном добија се тачан оригинални редослед (нема greedy reorder-а из B4).
- Све групе collapsible и на мобилном и на десктопу (десктоп: све отворене по дефолту). `AnimatePresence` + `motion.div` height 0↔auto (0.4s) + opacity (0.25s), `overflow:hidden`, chevron ротира 180°, `aria-expanded/role=region/aria-labelledby`, `price-group-toggled` на крају анимације (окида `ScrollTrigger.refresh()`). Редови су `RevealGroup` (stagger 0.04).
- Ћелије цена: број→`1.700`; `[a,b]`→две ћелије; `"+300"`→једна ћелија десно-поравната преко обе колоне; `"— / 3.500"`→парсирано у „—" и „3.500". `tabular-nums`, име се прелама (`overflow-wrap:anywhere`), leader се скупља први (`min-width:8px`). Провера на 360px: `scrollWidth 345 ≤ 360`, 0 редова прелива.

### Микро-интеракције (§6)
- Дугмад: `motion-safe:hover:-translate-y-px` + `active:scale-[0.98]`. Service картице: hover lift 4px + thumb `scale 1.04`. Галерија: stagger 0.06 + слика `scale 1.06→1` на reveal (унутрашњи `motion.span` варијанта). Lightbox: spring open (stiffness 260, damping 26), swipe (framer `drag="x"`, ±80px → next/prev). Booking: поља stagger, success картица `scale .96→1` + SVG чекирка се исцртава (`pathLength`), грешке fade (без тресења). MobileBar: улази тек кад hero CTA (`#hero-primary-cta`) изађе из видног поља, крије се на `#zakazivanje`. Header лого `scale 0.92` на скрол (desktop). Све под `motion-safe`; reduced-motion → статично.

### Одступања / напомене за authора
- **Bare `<span>` НИЈЕ у `candidateSelector`** (за разлику од skill §4): угнежђени спанови унутар наслова (нпр. `SectionTitle` унутрашњи span, hero title спанови) би се двоструко обрађивали. Eyebrows/kickers на овом сајту су `<p>` па нема губитка. Експлицитно `data-reveal="text"` и даље ради.
- **Редови ценовника: `RevealGroup` (stagger), НЕ реч-по-реч** (spec §4 vs §5 су у конфликту). framer opacity на `li` + WAAPI на речима исте `li` би се тукли и правили flash кад framer открије `li` пре него што splitter подели речи. Редови су `data-reveal="off"`.
- Могући минималан „flash" hero копије на веома спором учитавању фонтова (копија је видљива од SSR-а јер је `data-reveal=off`, па се тек после `fonts.ready` подели и анимира). У пракси `fonts.ready` брзо резолвује; прихваћено.
- **ПРЕ-ПОСТОЈЕЋИ БАГ (ван власништва, хитно пре деплоја):** `public/images/instagram/hero/*` су комитовани као `.avif`, али `content/site.ts` (`hero.image.src`, `services` депилација) и `public/images/instagram/manifest.json` их референцирају као `.jpg` → 2 слике 400 (hero фото + депилација картица). Референце нису у мом власништву (само `ui` објекат `content/site.ts`). **Исправка:** променити те 2 путање у `.avif` (или конвертовати назад). За screenshot-ове је привремено DOM-ом мењан `src` (без измене фајлова). Остале слике (галерија/картице) су `.jpg` и раде.

### Билд/верификација (worktree)
- Worktree нема `node_modules`; направљен junction ка `dfrajlica/node_modules`. Turbopack одбија junction који излази из root-а, па је `next.config.ts` **привремено** добио `turbopack.root` на главни фолдер — **враћено на чисто пре краја** (не сме у commit). За билд у worktree-у треба и junction и тај root; корисник ионако билдује у правом фолдеру.
- `npx tsc --noEmit`: 0; `npx eslint .`: 0; `npm run build`: пролази. Playwright 390/844 и 1440/900: „ништа скривено" `[]`, `pending` 0, сви `[data-reveal-el]` opacity 1, мени height=innerHeight, ценовник toggle, 360px без хоризонталног скрола/пресеченик цена. Screenshotови: `docs/screenshots/v2-{390,1440}.png`, `v2-menu-390.png`, `v2-price-{360,390}.png`. Конзола: само 2 позната image-400 (avif/jpg) + Convex fallback warning.
- Lint правило `react-hooks/set-state-in-effect`: setState у ефекту иде преко именоване функције (као постојећи `onScroll()`), не директно.

## Otvorena pitanja za vlasnicu
- **HITNO пре деплоја:** hero слике `.avif` vs `.jpg` референце (види „Одступања" горе) — 2 сломљене слике на живом сајту.
- Tačno radno vreme po danima / po majstoru (trenutno samo „уз заказивање, радним данима и сваке друге суботе").
- Da li cene prikazivati po majstoru (Јана/Бранка) i za druge grupe, ili samo za manikir.
- Ćirilično imenovanje stranih termina: Gel lak / lash lift / spray tan (sada: „Гел лак", „lash lift", „Спреј тен").
- Prava na fotografije sa Instagrama (da li su sve iz salona / dozvola klijentkinja).
- Cena „Депилација дубоких препона" — u cenovniku stoji 1.100, potvrditi.
- Da li Telegram i „Позови" prikazivati kao brze kanale (sada Viber, WhatsApp, Instagram, SMS).
- Statični leaf PNG-ovi imaju sitne artefakte (senka/sjaj sa hero.png) — po želji ručno očistiti u editoru.
