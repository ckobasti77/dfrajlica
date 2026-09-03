# Prompt 04 — Zakazivanje sa terminima (kalendar + slotovi + potvrda vlasnice)

## Jovan — kako pokrenuti
- **Redosled:** tek POSLE 03a i 03b (dira Booking sekciju, formu, Convex, admin). Pre toga: `node scripts/avif-refs.mjs`, `npm run build`, `git add -A && git commit -m "v2 polish"`.
- **Model / effort:** Fable 5.1, `high`. Razlog: ovo nije UI kozmetika — logika slobodnih termina, vremenske zone i zaštita od duplog zakazivanja su mesta gde greška znači da vlasnica dobije dva klijenta u isto vreme. Ako baš hoćeš Opus 4.8, može, ali ostavi effort na `high` i ne skidaj §7 (testovi).
- **Mode:** auto (auto-prihvatanje izmena + komandi). Plan mode ne — spec ispod je plan. Jedna sesija, ne ultracode: backend i UI ovde dele tipove i moraju da se rade zajedno.
- Referentna slika (sredime): `docs/design-references/booking-reference.png` — to je fazon, ne kopija.

### Paralelni režim (ako istovremeno radi i 03c ili bilo koja druga sesija)
1. Poseban worktree, ne isti folder (tri `npm run build` u istom `.next` se gaze):
   ```powershell
   git worktree add ..\dfrajlica-booking -b booking-v2
   cd ..\dfrajlica-booking
   npm install
   copy "..\dfrajlica\.env.local" .env.local
   ```
   Convex dev deployment je zajednički — u redu je, 04 samo dodaje tabele i opciona polja.
2. Nalepi ovaj pasus odmah ispod `BEGIN PROMPT`:

   > Parallel-work constraint: another session is editing `components/hero/*`, `public/models/*`, `public/images/ornaments/*`. Do NOT modify those. Everything else in this prompt is yours. Mount the new picker into `components/sections/Booking.tsx` yourself (replace the old form) — that file is not owned by anyone else now.
3. Kad obe završe: u main `git merge booking-v2` (i `git merge leaves-v2` ako je 03c bio u worktree-u), `npm run build`, deploy.

```
BEGIN PROMPT

You are a senior product engineer building a real appointment-booking flow for a small beauty salon (Serbian Cyrillic one-page site; Next.js 16.3.4, Tailwind v4, framer-motion, Convex). Work autonomously; decide, log decisions in `docs/DECISIONS.md` under "## Booking v2 (slots)", keep going. Read first: `docs/DECISIONS.md`, `content/site.ts`, `convex/schema.ts`, `convex/bookings.ts`, `components/booking/*`, `components/sections/Booking.tsx`, `app/admin/*`, `.claude/skills/text-reveal/SKILL.md` (forms are opted out of text reveal — keep it that way), and `docs/design-references/booking-reference.png` (UX reference: week strip on the left, time chips grouped by part of day, summary card on the right — match the feel, not the pixels; ours is plum/paper brand). Use the Convex skills in `.agents/skills/convex-*` (schema/index design, transactions) — `convex-design` and `convex-reviewer` at minimum.

## 0. Product rules (from the owner's own posts — do not change)
- Two staff: **Бранка** (owner) and **Јана**. Each has her own schedule ("3 days afternoons, 2 days mornings, every other Saturday" — exact hours unknown, so the OWNER sets them in the admin; ship sensible defaults: Mon–Fri 10:00–20:00, Sat 10:00–16:00, Sun off, and a banner in admin "Подесите радно време").
- A client request NEVER auto-confirms. It reserves the slot as „на чекању" and the owner confirms or declines in the admin. Confirmed = „потврђен". Declined slots free up immediately.
- Slot step 30 min. A service has a duration; a slot is bookable only if the whole duration fits inside working time and does not overlap any pending/confirmed booking or block for that staff.
- Lead time: no requests less than 2h from now; horizon: 30 days ahead; Sundays closed unless the owner adds an override.
- Timezone: everything is Europe/Belgrade; store `date` as `YYYY-MM-DD` and times as minutes from midnight (`startMin`, `endMin`); never store JS Dates for slots.

## 1. Content: bookable services (`content/site.ts` → add `bookableServices`)
Curated list with `key`, `title` (Cyrillic), `group` (Маникир/Педикир/Депилација/Обрве и трепавице/Лице и тело), `durationMin`, `priceFrom` (RSD number or null), `staff: ["branka","jana"] | ["branka"]`. Defaults (owner can change durations in admin later — see §5): Маникир 60, Гел лак 75, Корекција ноктију 90, Изливање ноктију 120, Скидање гела 30, Полупедикир 45, Естетски педикир 60, Педикир са гел лаком 75, Медицински педикир 60, Депилација (наусница/обрве) 15, Депилација лица 20, Депилација руку 30, Депилација ногу 45, Депилација ногу са препонама 60, Депилација интимне регије 30, Фарбање и корекција обрва 20, Ламинација обрва 45, Ламинација трепавица 60, Ламинација обрва и трепавица 90, Хигијенски третман 60, Воћне киселине 45, Микронидлинг 60, Спреј тен 30. Nail services (Маникир group) allow both staff; everything else Бранка only (log this assumption).

## 2. Convex schema (`convex/schema.ts`) — new/changed tables, all with indexes
- `staff`: { key: "branka" | "jana", name, active: boolean, order } (seed on first admin load if empty).
- `schedules`: { staffKey, weekday: 0–6, startMin, endMin } — multiple rows per weekday allowed (split shifts). Index `by_staff_weekday`.
- `scheduleOverrides`: { staffKey, date, kind: "off" | "custom", startMin?, endMin?, note? } — day off, or custom hours for a date (this is how "every other Saturday" works: the owner taps „+ радна субота" on the dates she works). Index `by_staff_date`, `by_date`.
- `blocks`: { staffKey, date, startMin, endMin, reason? } — breaks/holidays inside a day. Index `by_staff_date`.
- `bookings` (extend, keep old fields optional for existing rows): { name, phone, serviceKey, serviceTitle, durationMin, staffKey, date, startMin, endMin, note?, status: "nov" | "potvrdjen" | "otkazan" | "odbijen", createdAt, decidedAt?, source: "web" | "admin" }. Indexes `by_staff_date`, `by_date`, `by_status`, `by_phone`.
- `settings` (single doc): { slotStepMin: 30, leadTimeMin: 120, horizonDays: 30, holdHours: 48 (pending requests older than this auto-expire to „otkazan" via a cron — `convex/crons.ts`) }.
Write a one-off migration (`convex/migrations.ts`, internal mutation) that converts legacy bookings (date + timeSlot) into startMin/endMin best-effort (преподне → 10:00, поподне → 14:00) so the admin list still shows them.

## 3. Availability engine (`convex/availability.ts`) — pure functions + queries, unit-tested
- `lib/slots.ts` (shared, pure, no Convex imports): `buildDaySlots({ workRanges, busyRanges, durationMin, stepMin, minStartMin }) → number[]` (start minutes where `[start, start+duration)` ⊆ some work range and does not intersect any busy range). Export helpers `toMin("10:30")`, `fmt(630) → "10:30"`, `belgradeNow() → { date, minutes }`.
- Query `availability.day({ date, serviceKey, staffKey? })` → `{ staffKey, slots: number[] }[]` — resolves work ranges from `scheduleOverrides` (wins) else `schedules`, subtracts `blocks` and bookings with status nov/potvrdjen, applies lead time if `date === today`. If `staffKey` omitted for a nail service, returns both staff.
- Query `availability.week({ startDate, serviceKey, staffKey? })` → per-day `{ date, count }` for 7 days (to grey out days with 0 slots). Must be cheap: index scans by staff+date only.
- Mutation `bookings.request({ name, phone, serviceKey, staffKey, date, startMin, note?, website? })`: re-validate EVERYTHING inside the mutation (Convex mutations are serializable, so this is what prevents double booking): honeypot, name/phone rules (reuse), date within horizon, not Sunday unless override, slot ∈ `buildDaySlots(...)` computed from the DB at mutation time — if not, throw `ConvexError("Термин је управо заузет — изаберите други.")`; rate limit 3/h per phone; insert with status "nov"; return `{ id, startMin, endMin }`.
- Admin mutations (all require `key` = `process.env.ADMIN_KEY`): `bookings.setStatus` (nov→potvrdjen/odbijen; potvrdjen→otkazan), `bookings.createManual` (owner adds a phone booking directly as potvrdjen), `schedules.set({ staffKey, weekday, ranges })`, `scheduleOverrides.upsert/remove`, `blocks.add/remove`, `settings.update`, `services.setDuration` (store overrides in a `serviceOverrides` table read by both queries and the UI).
- Query `bookings.listRange({ key, from, to })` for the admin calendar; `bookings.pendingCount({ key })` for the badge.

## 4. Client UI — section `#zakazivanje` (replace the current form)
Three steps in one card, framer-motion between steps (slide 24px + fade, 0.35s, no bounce), progress dots, everything Cyrillic, mobile-first; desktop = two columns like the reference (picker left, summary right); mobile = stacked with a sticky summary bar at the bottom of the card.
1. **Услуга** — grouped chips (group as small uppercase label, chips with title · duration · „од 1.700"); when the service allows both staff, a segmented control „Бранка / Јана / Свеједно" (Свеједно = show union of slots, and the request goes to whoever has the slot; if both, prefer the one with fewer bookings that day — log it).
2. **Дан и време** — week strip (7 days, ‹ › arrows, today ring, Sunday disabled, days with 0 slots dimmed, month label „септембар 2026." with „(ове недеље)" on the current week), then slot chips grouped „Преподне" (< 14:00) / „Поподне"; selected chip fills plum; skeleton while `availability.day` loads; empty state „Нема слободних термина — пробајте други дан или нас позовите" with the tel: pill. When the user picks a slot, show end time („10:30–11:45").
3. **Подаци** — Име и презиме, Телефон, Напомена (optional), honeypot; summary card: service, staff, date in Cyrillic („четвртак, 3. септембар"), time range, price from; button „Пошаљи захтев". Success: „Захтев је послат ✓ — {Бранка} потврђује термин поруком или позивом на {phone}. Термин је резервисан до потврде." + quick channel buttons (Viber/WhatsApp/позив, existing builders). Error „Термин је управо заузет" → go back to step 2 with the day refreshed.
- Accessibility: chips are `button`s with `aria-pressed`, week strip is a `radiogroup`, keyboard arrows move days, focus management on step change, `aria-live` for loading/errors. Forms stay `data-reveal="off"`.
- Copy lives in `content/site.ts` → `booking.v2` (all strings). Date formatting via `Intl.DateTimeFormat("sr-Cyrl-RS", ...)` — verify Cyrillic weekday/month names render.

## 5. Admin (`/admin`, same key gate) — what the owner uses daily
- Tabs: **Захтеви** (pending list, badge count, buttons Потврди/Одбиј; each row shows service, staff, date/time, name, phone as tel: link, note), **Календар** (day view with ‹ › and a date picker; two columns Бранка/Јана; 30-min rows 08:00–21:00; confirmed = plum block, pending = plum outline, blocks = grey hatched; tap a booking → status actions; tap an empty cell → „Додај термин" (manual booking) or „Блокирај" (break)), **Радно време** (per staff: weekday rows with ranges editor — add/remove range, „Нерадан дан"; overrides list with „+ Радна субота" / „+ Слободан дан" date pickers; settings: корак, најава, хоризонт), **Услуге** (durations table, editable).
- All Cyrillic. Optimistic updates via Convex reactivity. Mobile-friendly (she will use it on the phone).
- Notifications (only if `RESEND_API_KEY` is set, else skip silently): `convex/notify.ts` action sends the owner an e-mail on every new request (service, time, name, phone) — from `onboarding@resend.dev` if no domain; document in DECISIONS how to set the key with `npx convex env set`.

## 6. Migration & safety
- Keep `bookings.create` working for one deploy (old clients) but mark deprecated; remove after.
- Seed: staff (2 rows), default schedules for both, settings doc — via an internal mutation run once from the admin („Иницијализуј") and idempotent.
- Cron (`convex/crons.ts`): every hour expire pending requests older than `holdHours` → status "otkazan" with note „истекло".

## 7. Tests & verification (mandatory)
- `lib/slots.test.ts` with Vitest (add dev dep): fits-inside-range, overlap at edges, lead time today vs tomorrow, split shifts, override wins over weekly, block in the middle, 120-min service near closing. `npx vitest run` green.
- Playwright e2e against `next dev` + Convex dev: pick service → day → slot → submit → appears in admin as pending → confirm → the slot disappears from the client picker (reactive) → decline another → slot returns. Screenshots at 390 and 1440 into `docs/screenshots/booking-v2-*.png`.
- Race test: fire two `bookings.request` for the same slot concurrently (script) → exactly one succeeds.
- `npx tsc --noEmit`, `npx eslint .`, `npm run build` clean; Cyrillic grep for new strings.
- Deploy: `git add -A && git commit -m "booking v2: slots, availability engine, admin schedule"`, `git push origin main` (Vercel builds), then `npx convex deploy` (answer Yes; prod deployment is `fortunate-deer-607`). After deploy, verify on https://dfrajlica.vercel.app: pick a slot and submit a test request, confirm it appears in `/admin` on production, then decline it. If the production form errors with a Convex URL/auth problem, report the exact error — the Vercel env `NEXT_PUBLIC_CONVEX_URL` must equal `https://fortunate-deer-607.eu-west-1.convex.cloud`.
- Report in Serbian: schema, what the owner must do first in admin (set hours), env vars, screenshots, open decisions, and the production test result.

END PROMPT
```
