"use client";

import { motion } from "framer-motion";
import { bookingV2 as t } from "@/content/site";
import { errorClass, inputClass, labelClass } from "./wizardStyles";

export const NOTE_MAX = 300;

export type DetailsValues = { name: string; phone: string; note: string; website: string };
export type DetailsField = "name" | "phone" | "note";
export type DetailsErrors = Partial<Record<DetailsField, string>>;

export function isValidPhone(phone: string): boolean {
  return /^(\+381|0)\d{7,11}$/.test(phone.replace(/[\s/()-]/g, ""));
}

export function validateDetails(v: DetailsValues): DetailsErrors {
  const e: DetailsErrors = {};
  const name = v.name.trim();
  if (!name) e.name = t.errors.required;
  else if (name.length < 2 || name.length > 60) e.name = t.errors.name;
  if (!v.phone.trim()) e.phone = t.errors.required;
  else if (!isValidPhone(v.phone)) e.phone = t.errors.phone;
  if (v.note.length > NOTE_MAX) e.note = t.errors.note;
  return e;
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
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

type Props = {
  ids: { name: string; phone: string; note: string; website: string };
  values: DetailsValues;
  errors: DetailsErrors;
  touched: Partial<Record<DetailsField, boolean>>;
  disabled: boolean;
  onChange: <K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) => void;
  onBlur: (field: DetailsField) => void;
};

export default function DetailsStep({ ids, values, errors, touched, disabled, onChange, onBlur }: Props) {
  const show = (f: DetailsField) => (touched[f] ? errors[f] : undefined);
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-5">
      <legend className="sr-only">{t.details.title}</legend>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.name} className={labelClass}>
            {t.details.name}
          </label>
          <input
            id={ids.name}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            placeholder={t.details.namePlaceholder}
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            onBlur={() => onBlur("name")}
            aria-invalid={Boolean(show("name"))}
            aria-describedby={show("name") ? `${ids.name}-err` : undefined}
            className={inputClass}
          />
          <ErrorText id={`${ids.name}-err`} message={show("name")} />
        </div>
        <div>
          <label htmlFor={ids.phone} className={labelClass}>
            {t.details.phone}
          </label>
          <input
            id={ids.phone}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder={t.details.phonePlaceholder}
            value={values.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            onBlur={() => onBlur("phone")}
            aria-invalid={Boolean(show("phone"))}
            aria-describedby={show("phone") ? `${ids.phone}-err` : undefined}
            className={inputClass}
          />
          <ErrorText id={`${ids.phone}-err`} message={show("phone")} />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor={ids.note} className="text-sm font-medium text-ink">
            {t.details.note}
          </label>
          <span className="text-xs text-ink/50" aria-hidden="true">
            {t.details.noteCount(values.note.length, NOTE_MAX)}
          </span>
        </div>
        <textarea
          id={ids.note}
          name="note"
          rows={3}
          maxLength={NOTE_MAX}
          placeholder={t.details.notePlaceholder}
          value={values.note}
          onChange={(e) => onChange("note", e.target.value)}
          onBlur={() => onBlur("note")}
          aria-invalid={Boolean(show("note"))}
          aria-describedby={show("note") ? `${ids.note}-err` : undefined}
          className={`${inputClass} h-auto min-h-24 resize-y py-3`}
        />
        <ErrorText id={`${ids.note}-err`} message={show("note")} />
      </div>

      {/* Honeypot — invisible to people, tempting to bots */}
      <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={ids.website}>Веб сајт</label>
        <input
          id={ids.website}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => onChange("website", e.target.value)}
        />
      </div>

      <p className="text-[13px] text-ink/60">{t.details.privacy}</p>
    </fieldset>
  );
}
