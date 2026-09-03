"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { booking, services, site, type ServiceId } from "@/content/site";
import { RevealGroup, RevealItem } from "@/components/motion/RevealGroup";
import {
  formStrings as t,
  formatDate,
  staffLabel,
  staffOptions,
  timeSlotLabel,
  timeSlotOptions,
  type Staff,
  type TimeSlot,
} from "./strings";

const NOTE_MAX = 300;
const HAS_BACKEND = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type FieldName = "name" | "phone" | "serviceId" | "date" | "note";
type Errors = Partial<Record<FieldName, string>>;

type FormState = {
  name: string;
  phone: string;
  serviceId: ServiceId | "";
  staff: Staff;
  date: string;
  timeSlot: TimeSlot;
  note: string;
  website: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  serviceId: "",
  staff: "any",
  date: "",
  timeSlot: "any",
  note: "",
  website: "",
};

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; summary: string }
  | { kind: "error"; message: string };

function belgradeDateString(offsetDays: number): string {
  const now = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(now);
}

function isSunday(date: string): boolean {
  return new Date(`${date}T12:00:00`).getDay() === 0;
}

function isValidPhone(phone: string): boolean {
  return /^(\+381|0)\d{7,11}$/.test(phone.replace(/[\s/-]/g, ""));
}

function validate(s: FormState, minDate: string): Errors {
  const e: Errors = {};
  const name = s.name.trim();
  if (!name) e.name = t.errors.required;
  else if (name.length < 2 || name.length > 60) e.name = t.errors.name;

  if (!s.phone.trim()) e.phone = t.errors.required;
  else if (!isValidPhone(s.phone)) e.phone = t.errors.phone;

  if (!s.serviceId) e.serviceId = t.errors.service;

  if (!s.date) e.date = t.errors.required;
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) e.date = t.errors.date;
  else if (s.date < minDate) e.date = t.errors.datePast;
  else if (isSunday(s.date)) e.date = t.errors.sunday;

  if (s.note.length > NOTE_MAX) e.note = t.errors.note;
  return e;
}

const CHEVRON_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237A1B63' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")";

const inputClass =
  "h-12 w-full rounded-xl border border-plum-300/50 bg-white px-4 text-ink placeholder:text-ink/40 outline-none transition-shadow duration-200 focus:ring-2 focus:ring-plum-500 aria-[invalid=true]:border-plum-700";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";
const errorClass = "mt-1.5 text-sm text-plum-700";
const primaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-plum-700 px-6 font-medium text-white transition-[background-color,transform] duration-200 hover:bg-plum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.98]";
const channelButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-plum-300/60 bg-white px-5 text-sm font-medium text-plum-700 transition-colors duration-200 hover:bg-plum-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500";

const QUICK_CHANNEL_IDS: readonly string[] = ["viber", "whatsapp", "instagram", "sms"];

function QuickChannels({ message }: { message: string }) {
  const channels = booking.channels.filter((c) => QUICK_CHANNEL_IDS.includes(c.id));
  return (
    <ul className="flex flex-wrap gap-2">
      {channels.map((c) => (
        <li key={c.id}>
          <a href={c.build(message)} target="_blank" rel="noopener noreferrer" className={channelButtonClass}>
            {c.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Segmented<V extends string>({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const labelId = useId();
  return (
    <div>
      <span id={labelId} className={labelClass}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={`inline-flex h-11 cursor-pointer select-none items-center rounded-full border px-5 text-sm font-medium transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-plum-500 has-[:focus-visible]:ring-offset-2 ${
                checked
                  ? "border-plum-700 bg-plum-700 text-white"
                  : "border-plum-300/60 bg-white text-ink hover:bg-plum-100"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  // Fade in (opacity/colour), never shake — calm, not alarming.
  return (
    <motion.p
      id={id}
      className={errorClass}
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {message}
    </motion.p>
  );
}

function BookingFormLive() {
  const baseId = useId();
  const ids = {
    name: `${baseId}-name`,
    phone: `${baseId}-phone`,
    service: `${baseId}-service`,
    date: `${baseId}-date`,
    note: `${baseId}-note`,
    website: `${baseId}-website`,
    status: `${baseId}-status`,
  };
  const create = useMutation(api.bookings.create);
  const reduce = useReducedMotion();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const minDate = useMemo(() => belgradeDateString(1), []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors(validate(next, minDate));
  };

  const blur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(form, minDate));
  };

  const visibleError = (field: FieldName): string | undefined =>
    touched[field] || (field === "date" && form.date !== "") ? errors[field] : undefined;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, serviceId: true, date: true, note: true });
    const errs = validate(form, minDate);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const service = services.find((s) => s.id === form.serviceId);
    if (!service) return;

    setStatus({ kind: "pending" });
    const staff = service.id === "manikir" ? form.staff : undefined;
    const name = form.name.trim();
    const note = form.note.trim();
    try {
      await create({
        name,
        phone: form.phone.trim(),
        serviceId: service.id,
        serviceTitle: service.title,
        staff,
        date: form.date,
        timeSlot: form.timeSlot,
        note: note ? note : undefined,
        website: form.website ? form.website : undefined,
      });
      const summary = t.summary({
        serviceTitle: service.title,
        staff: staff && staff !== "any" ? staffLabel(staff) : undefined,
        date: formatDate(form.date),
        timeSlot: timeSlotLabel(form.timeSlot),
        name,
      });
      setStatus({ kind: "success", summary });
    } catch (err) {
      const message =
        err instanceof ConvexError && typeof err.data === "string" ? err.data : t.errors.generic;
      setStatus({ kind: "error", message });
    }
  };

  const reset = () => {
    setForm(initialState);
    setErrors({});
    setTouched({});
    setStatus({ kind: "idle" });
  };

  const viber = booking.channels.find((c) => c.id === "viber");

  if (status.kind === "success") {
    return (
      <motion.div
        className="text-ink"
        aria-live="polite"
        data-reveal="off"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
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
        <h3 className="font-serif text-2xl text-plum-700 sm:text-3xl">{t.success.title}</h3>
        <p className="mt-3 text-base text-ink/80">{t.success.text(site.phone.primary.display)}</p>
        <p className="mt-6 mb-3 text-sm font-medium text-ink">{t.success.quickTitle}</p>
        <QuickChannels message={status.summary} />
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
  const disabled = pending;
  const showStaff = form.serviceId === "manikir";

  return (
    <form onSubmit={onSubmit} noValidate className="relative text-ink" aria-busy={pending}>
      <fieldset disabled={disabled} className="min-w-0">
        <legend className="sr-only">{t.legend}</legend>

        <RevealGroup as="div" stagger={0.06} className="space-y-5">
        <RevealItem className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.name} className={labelClass}>
              {t.name}
            </label>
            <input
              id={ids.name}
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={60}
              placeholder={t.namePlaceholder}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => blur("name")}
              aria-invalid={Boolean(visibleError("name"))}
              aria-describedby={visibleError("name") ? `${ids.name}-err` : undefined}
              className={inputClass}
            />
            <ErrorText id={`${ids.name}-err`} message={visibleError("name")} />
          </div>

          <div>
            <label htmlFor={ids.phone} className={labelClass}>
              {t.phone}
            </label>
            <input
              id={ids.phone}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder={t.phonePlaceholder}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => blur("phone")}
              aria-invalid={Boolean(visibleError("phone"))}
              aria-describedby={visibleError("phone") ? `${ids.phone}-err` : undefined}
              className={inputClass}
            />
            <ErrorText id={`${ids.phone}-err`} message={visibleError("phone")} />
          </div>
        </RevealItem>

        <RevealItem>
          <label htmlFor={ids.service} className={labelClass}>
            {t.service}
          </label>
          <select
            id={ids.service}
            name="serviceId"
            required
            value={form.serviceId}
            onChange={(e) => set("serviceId", e.target.value as ServiceId | "")}
            onBlur={() => blur("serviceId")}
            aria-invalid={Boolean(visibleError("serviceId"))}
            aria-describedby={visibleError("serviceId") ? `${ids.service}-err` : undefined}
            className={`${inputClass} appearance-none bg-[length:16px_16px] bg-[position:right_1rem_center] bg-no-repeat pr-11`}
            style={{ backgroundImage: CHEVRON_BG }}
          >
            <option value="" disabled>
              {t.servicePlaceholder}
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <ErrorText id={`${ids.service}-err`} message={visibleError("serviceId")} />
        </RevealItem>

        {showStaff && (
          <RevealItem>
            <Segmented
              name="staff"
              label={t.staff}
              options={staffOptions}
              value={form.staff}
              onChange={(v) => set("staff", v)}
            />
          </RevealItem>
        )}

        <RevealItem className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.date} className={labelClass}>
              {t.date}
            </label>
            <input
              id={ids.date}
              name="date"
              type="date"
              required
              min={minDate}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              onBlur={() => blur("date")}
              aria-invalid={Boolean(visibleError("date"))}
              aria-describedby={visibleError("date") ? `${ids.date}-err` : undefined}
              className={inputClass}
            />
            <ErrorText id={`${ids.date}-err`} message={visibleError("date")} />
          </div>

          <Segmented
            name="timeSlot"
            label={t.time}
            options={timeSlotOptions}
            value={form.timeSlot}
            onChange={(v) => set("timeSlot", v)}
          />
        </RevealItem>

        <RevealItem>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor={ids.note} className="text-sm font-medium text-ink">
              {t.note}
            </label>
            <span className="text-xs text-ink/50" aria-hidden="true">
              {t.noteCount(form.note.length, NOTE_MAX)}
            </span>
          </div>
          <textarea
            id={ids.note}
            name="note"
            rows={3}
            maxLength={NOTE_MAX}
            placeholder={t.notePlaceholder}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            onBlur={() => blur("note")}
            aria-invalid={Boolean(visibleError("note"))}
            aria-describedby={visibleError("note") ? `${ids.note}-err` : undefined}
            className={`${inputClass} h-auto min-h-24 resize-y py-3`}
          />
          <ErrorText id={`${ids.note}-err`} message={visibleError("note")} />
        </RevealItem>

        {/* Honeypot — invisible to people, tempting to bots */}
        <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor={ids.website}>Веб сајт</label>
          <input
            id={ids.website}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>

        <RevealItem className="space-y-3 pt-1">
          <button type="submit" className={primaryButtonClass} disabled={disabled}>
            {pending ? t.submitting : t.submit}
          </button>
          <p className="text-center text-xs text-ink/60">{t.privacy}</p>
        </RevealItem>
        </RevealGroup>
      </fieldset>

      <div id={ids.status} aria-live="polite" className="sr-only">
        {pending ? t.submitting : ""}
      </div>

      {status.kind === "error" && (
        <div
          role="alert"
          className="mt-5 rounded-[20px] border border-plum-300/50 bg-plum-100 p-4 text-sm text-ink"
        >
          <p className="font-medium text-plum-700">{t.errorTitle}</p>
          <p className="mt-1">{status.message}</p>
          <p className="mt-3 text-ink/80">{t.errorHint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={site.phone.primary.tel} className={channelButtonClass}>
              {t.callUs} {site.phone.primary.display}
            </a>
            {viber && (
              <a href={viber.build("")} className={channelButtonClass}>
                {viber.label}
              </a>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

/** Shown when NEXT_PUBLIC_CONVEX_URL is missing — no Convex provider, so no hooks. */
function NoBackendFallback() {
  const viber = booking.channels.find((c) => c.id === "viber");
  return (
    <div role="alert" className="rounded-[20px] border border-plum-300/50 bg-plum-100 p-4 text-sm text-ink">
      <p className="font-medium text-plum-700">{t.errorTitle}</p>
      <p className="mt-1">{t.errors.noBackend}</p>
      <p className="mt-3 text-ink/80">{t.errorHint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a href={site.phone.primary.tel} className={channelButtonClass}>
          {t.callUs} {site.phone.primary.display}
        </a>
        {viber && (
          <a href={viber.build("")} className={channelButtonClass}>
            {viber.label}
          </a>
        )}
      </div>
    </div>
  );
}

export default function BookingForm() {
  return HAS_BACKEND ? <BookingFormLive /> : <NoBackendFallback />;
}
