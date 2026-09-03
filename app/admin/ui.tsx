"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ConvexError } from "convex/values";
import { adminStrings as t } from "@/components/booking/strings";
import { fmt } from "@/lib/slots";

export const inputClass =
  "h-11 w-full rounded-xl border border-plum-300/50 bg-white px-3 text-[15px] text-ink outline-none transition-shadow duration-200 focus:ring-2 focus:ring-plum-500 disabled:opacity-60";
/** Same look, but sized to content (time/date pickers inside flex rows). */
export const compactInputClass = inputClass.replace("w-full ", "");
export const labelClass = "mb-1 block text-[13px] font-medium text-ink/80";
export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full bg-plum-700 px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-plum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const ghostButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-plum-300/60 bg-white px-4 text-[14px] font-medium text-plum-700 transition-colors duration-200 hover:bg-plum-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 disabled:cursor-not-allowed disabled:opacity-50";
export const dangerButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-white px-4 text-[14px] font-medium text-red-700 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50";
export const cardClass = "rounded-2xl border border-plum-300/40 bg-white p-4 sm:p-5";

export function errorMessage(err: unknown): string {
  return err instanceof ConvexError && typeof err.data === "string" ? err.data : t.error;
}

/** Runs an async action, tracks busy/error, shows a short „Сачувано" flash. */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setFlash(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlash(false), 1800);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { run, busy, error, flash, clearError: () => setError(null) };
}

export function StatusLine({ busy, error, flash }: { busy: boolean; error: string | null; flash: boolean }) {
  return (
    <p className="min-h-5 text-[13px]" aria-live="polite">
      {busy ? <span className="text-ink/70">{t.saving}</span> : error ? <span className="text-red-700">{error}</span> : flash ? <span className="text-emerald-700">{t.saved}</span> : null}
    </p>
  );
}

/** 15-minute time options between 06:00 and 22:00. */
export const TIME_OPTIONS: number[] = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => 6 * 60 + i * 15);

export function TimeSelect({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  ariaLabel,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const opts = TIME_OPTIONS.filter((m) => (min === undefined || m >= min) && (max === undefined || m <= max));
  const list = opts.includes(value) ? opts : [value, ...opts].sort((a, b) => a - b);
  return (
    <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled} aria-label={ariaLabel} className={`${compactInputClass} min-w-[96px] tabular-nums`}>
      {list.map((m) => (
        <option key={m} value={m}>
          {fmt(m)}
        </option>
      ))}
    </select>
  );
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Minimal accessible modal: Escape closes, focus moves in, returns on close. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>("input,select,textarea,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-plum-lg sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-serif text-[22px] text-plum-700">
            {title}
          </h2>
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            {t.close}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
