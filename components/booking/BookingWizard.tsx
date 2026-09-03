"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { bookableServices, booking, bookingV2 as t, site, staffName, type StaffKey } from "@/content/site";
import { formatNumber } from "@/components/ui/format";
import { formatDayLong } from "@/lib/dates";
import { addDays, belgradeNow, fmt, fmtRange } from "@/lib/slots";
import DetailsStep, { validateDetails, type DetailsErrors, type DetailsField, type DetailsValues } from "./DetailsStep";
import ServiceStep, { serviceMeta, type StaffChoice } from "./ServiceStep";
import SlotChips, { type SlotOption } from "./SlotChips";
import StepDots from "./StepDots";
import { SummaryBar, SummaryCard, type SummaryData } from "./SummaryCard";
import WeekStrip, { type DayInfo } from "./WeekStrip";
import { channelButtonClass, primaryButtonClass, secondaryButtonClass } from "./wizardStyles";

const HAS_BACKEND = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
/** Mirrors the default `settings.horizonDays`; the engine is authoritative (days past it return 0 slots). */
const HORIZON_DAYS = 30;
/** `now` sent to queries is rounded so the subscription key stays stable for a few minutes. */
const NOW_ROUND_MS = 5 * 60 * 1000;
const STEP_EASE = [0.16, 1, 0.3, 1] as const;

type Clock = { now: number; today: string };
type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | { kind: "success"; staffKey: StaffKey; startMin: number; endMin: number; date: string; serviceTitle: string; name: string };

function makeClock(): Clock {
  const now = Math.floor(Date.now() / NOW_ROUND_MS) * NOW_ROUND_MS;
  return { now, today: belgradeNow(now).date };
}

const emptyDetails: DetailsValues = { name: "", phone: "", note: "", website: "" };

const stepVariants = {
  initial: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -24 * dir }),
};

function QuickChannels({ message }: { message: string }) {
  const channels = booking.channels.filter((c) => c.id === "viber" || c.id === "whatsapp" || c.id === "call");
  return (
    <ul className="flex flex-wrap gap-2">
      {channels.map((c) => (
        <li key={c.id}>
          <a
            href={c.build(message)}
            target={c.id === "whatsapp" ? "_blank" : undefined}
            rel={c.id === "whatsapp" ? "noopener noreferrer" : undefined}
            className={channelButtonClass}
          >
            {c.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function ErrorBanner({ message }: { message: string }) {
  const viber = booking.channels.find((c) => c.id === "viber");
  return (
    <div role="alert" className="mt-5 rounded-2xl border border-plum-300/50 bg-plum-100 p-4 text-sm text-ink">
      <p className="font-medium text-plum-700">{t.errors.title}</p>
      <p className="mt-1">{message}</p>
      <p className="mt-3 text-ink/80">{t.errors.hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a href={site.phone.primary.tel} className={channelButtonClass}>
          {t.errors.callUs} {site.phone.primary.display}
        </a>
        {viber ? (
          <a href={viber.build("")} className={channelButtonClass}>
            {viber.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function BookingWizardLive() {
  const baseId = useId();
  const ids = {
    name: `${baseId}-name`,
    phone: `${baseId}-phone`,
    note: `${baseId}-note`,
    website: `${baseId}-website`,
    heading: `${baseId}-heading`,
  };
  const reduce = useReducedMotion();
  const request = useMutation(api.bookings.request);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [serviceKey, setServiceKey] = useState<string | null>(null);
  const [staffKey, setStaffKey] = useState<StaffChoice>("any");
  const [clock, setClock] = useState<Clock | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [details, setDetails] = useState<DetailsValues>(emptyDetails);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [touched, setTouched] = useState<Partial<Record<DetailsField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [live, setLive] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const mountedRef = useRef(false);

  // Wall clock for lead time / today — refreshed every minute, rounded to 5 min.
  useEffect(() => {
    const tick = () => setClock(makeClock());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const service = useMemo(() => (serviceKey ? bookableServices.find((s) => s.key === serviceKey) : undefined), [serviceKey]);
  const overrides = useQuery(api.services.overrides, {});
  const durations = useMemo(() => new Map((overrides ?? []).map((o) => [o.serviceKey, o.durationMin] as const)), [overrides]);
  const durationMin = service ? (durations.get(service.key) ?? service.durationMin) : 0;

  const today = clock?.today ?? null;
  const horizonEnd = today ? addDays(today, HORIZON_DAYS) : null;
  const effectiveWeekStart = weekStart ?? today;

  const weekArgs =
    clock && serviceKey && effectiveWeekStart && step >= 1
      ? { startDate: effectiveWeekStart, serviceKey, staffKey, now: clock.now }
      : "skip";
  const week = useQuery(api.availability.week, weekArgs);

  const dayArgs = clock && serviceKey && date && step >= 1 ? { date, serviceKey, staffKey, now: clock.now } : "skip";
  const dayAvail = useQuery(api.availability.day, dayArgs);

  const slots: SlotOption[] | undefined = useMemo(() => {
    if (dayAvail === undefined) return undefined;
    const map = new Map<number, StaffKey[]>();
    for (const { staffKey: k, slots: list } of dayAvail) {
      for (const s of list) {
        const arr = map.get(s) ?? [];
        arr.push(k);
        map.set(s, arr);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([s, staff]) => ({ startMin: s, staff }));
  }, [dayAvail]);

  const days: DayInfo[] = useMemo(() => {
    if (!effectiveWeekStart) return [];
    const counts = new Map((week ?? []).map((d) => [d.date, d.count] as const));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(effectiveWeekStart, i);
      return { date: d, count: week === undefined ? undefined : (counts.get(d) ?? 0) };
    });
  }, [effectiveWeekStart, week]);

  // Reactivity: if the chosen slot disappears (someone else got it / the owner
  // confirmed another request), drop it and send the user back to the picker.
  useEffect(() => {
    const syncSlot = () => {
      if (startMin === null || slots === undefined) return;
      if (slots.some((s) => s.startMin === startMin)) return;
      setStartMin(null);
      if (step === 2) {
        setDir(-1);
        setStep(1);
        setStatus({ kind: "error", message: t.errors.taken });
      }
    };
    syncSlot();
  }, [slots, startMin, step]);

  const go = useCallback((to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    setStatus((s) => (s.kind === "error" ? { kind: "idle" } : s));
  }, [step]);

  const focusHeading = () => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  };

  const onService = (key: string) => {
    if (key !== serviceKey) {
      setServiceKey(key);
      setStartMin(null);
      const s = bookableServices.find((x) => x.key === key);
      if (s && s.staff.length === 1) setStaffKey("any");
    }
  };
  const onStaff = (k: StaffChoice) => {
    setStaffKey(k);
    setStartMin(null);
  };
  const onDate = (d: string) => {
    if (d !== date) {
      setDate(d);
      setStartMin(null);
    }
  };
  const shiftWeek = (n: number) => {
    if (!effectiveWeekStart) return;
    setWeekStart(addDays(effectiveWeekStart, n));
  };

  const setField = <K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) => {
    const next = { ...details, [key]: value };
    setDetails(next);
    setErrors(validateDetails(next));
  };
  const blurField = (field: DetailsField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateDetails(details));
  };

  const canProceed = step === 0 ? Boolean(serviceKey) : step === 1 ? Boolean(date && startMin !== null) : true;

  const submit = async () => {
    if (!service || !date || startMin === null) return;
    setTouched({ name: true, phone: true, note: true });
    const errs = validateDetails(details);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = (["name", "phone", "note"] as const).find((f) => errs[f]);
      if (first) document.getElementById(ids[first])?.focus();
      return;
    }
    setStatus({ kind: "pending" });
    setLive(t.details.submitting);
    const name = details.name.trim();
    try {
      const res = await request({
        name,
        phone: details.phone.trim(),
        serviceKey: service.key,
        staffKey,
        date,
        startMin,
        note: details.note.trim() || undefined,
        website: details.website || undefined,
      });
      setStatus({ kind: "success", staffKey: res.staffKey, startMin: res.startMin, endMin: res.endMin, date, serviceTitle: service.title, name });
      setLive(t.success.title);
    } catch (err) {
      const message = err instanceof ConvexError && typeof err.data === "string" ? err.data : t.errors.generic;
      setLive(message);
      if (message === t.errors.taken) {
        setStartMin(null);
        setDir(-1);
        setStep(1);
      }
      setStatus({ kind: "error", message });
    }
  };

  const primary = () => {
    if (status.kind === "pending") return;
    if (step < 2) {
      if (canProceed) go(step + 1);
      return;
    }
    void submit();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    primary();
  };

  const reset = () => {
    setStep(0);
    setDir(-1);
    setServiceKey(null);
    setStaffKey("any");
    setWeekStart(null);
    setDate(null);
    setStartMin(null);
    setDetails(emptyDetails);
    setErrors({});
    setTouched({});
    setStatus({ kind: "idle" });
    setLive("");
  };

  /* ---------- summary ---------- */
  const chosenSlot = startMin !== null ? slots?.find((s) => s.startMin === startMin) : undefined;
  const staffLabel = !service
    ? null
    : service.staff.length === 1
      ? staffName(service.staff[0])
      : staffKey !== "any"
        ? staffName(staffKey)
        : chosenSlot && chosenSlot.staff.length === 1
          ? staffName(chosenSlot.staff[0])
          : t.summary.staffAny;
  const summary: SummaryData = {
    service: service?.title ?? null,
    meta: service ? serviceMeta(service, durations) : null,
    staff: staffLabel,
    date: date && step >= 1 ? formatDayLong(date) : null,
    time: startMin !== null && service ? fmtRange(startMin, startMin + durationMin) : null,
    price: service && service.priceFrom !== null ? t.service.priceFrom(formatNumber(service.priceFrom)) : null,
  };

  /* ---------- success ---------- */
  if (status.kind === "success") {
    const message = t.success.message({
      service: status.serviceTitle,
      date: formatDayLong(status.date),
      time: fmt(status.startMin),
      name: status.name,
    });
    return (
      <motion.div
        className="text-ink"
        aria-live="polite"
        data-reveal="off"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: STEP_EASE }}
      >
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-plum-100 text-plum-700">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <motion.path
              d="M5 12.5l4 4 10-10"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut", delay: reduce ? 0 : 0.15 }}
            />
          </svg>
        </span>
        <h3 ref={headingRef} tabIndex={-1} className="font-serif text-2xl text-plum-700 outline-none sm:text-3xl">
          {t.success.title}
        </h3>
        <p className="mt-3 text-base text-ink/80">{t.success.text(staffName(status.staffKey), site.phone.primary.display)}</p>
        <p className="mt-4 rounded-2xl bg-paper/70 px-4 py-3 text-[15px] text-ink">
          <span className="font-medium">{status.serviceTitle}</span> · {formatDayLong(status.date)} · {fmtRange(status.startMin, status.endMin)} ·{" "}
          {staffName(status.staffKey)}
        </p>
        <p className="mt-6 mb-3 text-sm font-medium text-ink">{t.success.quickTitle}</p>
        <QuickChannels message={message} />
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded text-sm font-medium text-plum-700 underline underline-offset-4 hover:text-plum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500"
        >
          {t.success.reset}
        </button>
      </motion.div>
    );
  }

  const pending = status.kind === "pending";
  const stepTitle = step === 0 ? t.service.title : step === 1 ? t.day.title : t.details.title;

  const actions = (
    <>
      {step > 0 ? (
        <button type="button" onClick={() => go(step - 1)} disabled={pending} className={`${secondaryButtonClass} h-12 shrink-0`}>
          {t.nav.back}
        </button>
      ) : null}
      <button
        type="button"
        onClick={primary}
        disabled={pending || (step < 2 && !canProceed)}
        className={primaryButtonClass}
        aria-describedby={step === 1 && !canProceed ? `${baseId}-hint` : undefined}
      >
        {step === 2 ? (pending ? t.details.submitting : t.details.submit) : t.nav.next}
      </button>
    </>
  );

  return (
    <div className="relative text-ink" data-reveal="off">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <StepDots step={step} onJump={go} />
        <p className="text-[13px] text-ink/70">{t.stepOf(step + 1, t.steps.length)}</p>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <form onSubmit={onSubmit} noValidate className="relative min-w-0 overflow-x-clip" aria-busy={pending}>
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={reduce ? undefined : stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: reduce ? 0 : 0.35, ease: STEP_EASE }}
              onAnimationComplete={(def) => {
                if (def === "animate") focusHeading();
              }}
            >
              <h3 id={ids.heading} ref={headingRef} tabIndex={-1} className="mb-4 font-serif text-[24px] leading-tight text-ink outline-none sm:text-[28px]">
                {stepTitle}
              </h3>

              {step === 0 ? (
                <ServiceStep serviceKey={serviceKey} staffKey={staffKey} durations={durations} onService={onService} onStaff={onStaff} />
              ) : null}

              {step === 1 && effectiveWeekStart && today && horizonEnd ? (
                <div className="space-y-5">
                  <WeekStrip
                    weekStart={effectiveWeekStart}
                    today={today}
                    horizonEnd={horizonEnd}
                    selected={date}
                    days={days}
                    onSelect={onDate}
                    onPrev={() => shiftWeek(-7)}
                    onNext={() => shiftWeek(7)}
                  />
                  {date ? (
                    <div aria-label={t.day.slotsLabel}>
                      <SlotChips
                        slots={slots}
                        selected={startMin}
                        durationMin={durationMin}
                        showStaffHint={Boolean(service && service.staff.length > 1 && staffKey === "any")}
                        onSelect={setStartMin}
                      />
                      {startMin !== null ? (
                        <p className="mt-4 text-[15px] text-ink/80">
                          {t.day.ends(fmtRange(startMin, startMin + durationMin))}
                          {chosenSlot && chosenSlot.staff.length === 1 && service && service.staff.length > 1 ? (
                            <span className="text-ink/70"> · {t.day.withStaff(staffName(chosenSlot.staff[0]))}</span>
                          ) : null}
                        </p>
                      ) : (
                        <p id={`${baseId}-hint`} className="mt-4 text-[14px] text-ink/70">
                          {t.day.pickHint}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p id={`${baseId}-hint`} className="text-[14px] text-ink/70">
                      {t.day.pickHint}
                    </p>
                  )}
                </div>
              ) : null}

              {step === 2 ? (
                <DetailsStep ids={ids} values={details} errors={errors} touched={touched} disabled={pending} onChange={setField} onBlur={blurField} />
              ) : null}

              {status.kind === "error" ? <ErrorBanner message={status.message} /> : null}
            </motion.div>
          </AnimatePresence>
        </form>

        <div className="hidden lg:block lg:sticky lg:top-24">
          <SummaryCard data={summary}>{actions}</SummaryCard>
        </div>
      </div>

      <SummaryBar data={summary} className="lg:hidden">
        {actions}
      </SummaryBar>

      <div aria-live="polite" className="sr-only">
        {live || (step === 1 && date && slots === undefined ? t.day.loading : "")}
      </div>
    </div>
  );
}

/** Shown when NEXT_PUBLIC_CONVEX_URL is missing — no Convex provider, so no hooks. */
function NoBackendFallback() {
  return <ErrorBanner message={t.errors.noBackend} />;
}

export default function BookingWizard() {
  return HAS_BACKEND ? <BookingWizardLive /> : <NoBackendFallback />;
}
