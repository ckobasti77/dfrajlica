"use client";

import { Component, useId, useState, useSyncExternalStore, type ErrorInfo, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { site } from "@/content/site";
import {
  adminStrings as t,
  formatDate,
  staffLabel,
  statusLabel,
  timeSlotLabel,
  type Status,
} from "@/components/booking/strings";

const STORAGE_KEY = "dfrajlica_admin_key";

const subscribeNoop = () => () => {};

function readStoredKey(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredKey(key: string): void {
  try {
    if (key) window.sessionStorage.setItem(STORAGE_KEY, key);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage unavailable — key lives in memory only
  }
}

const inputClass =
  "h-12 w-full rounded-xl border border-plum-300/50 bg-white px-4 text-ink outline-none transition-shadow duration-200 focus:ring-2 focus:ring-plum-500";
const primaryButtonClass =
  "inline-flex h-12 items-center justify-center rounded-full bg-plum-700 px-6 font-medium text-white transition-colors duration-200 hover:bg-plum-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-2 disabled:opacity-60";
const ghostButtonClass =
  "inline-flex h-9 items-center justify-center rounded-full border border-plum-300/60 bg-white px-4 text-sm font-medium text-plum-700 transition-colors duration-200 hover:bg-plum-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 disabled:cursor-not-allowed disabled:opacity-50";

const statusBadgeClass: Record<Status, string> = {
  nov: "bg-plum-100 text-plum-700",
  potvrdjen: "bg-emerald-100 text-emerald-800",
  otkazan: "bg-neutral-200 text-neutral-700",
};

/* ---------- Error boundary: useQuery throws ConvexError for a wrong key ---------- */

type BoundaryProps = { onReset: () => void; children: ReactNode };
type BoundaryState = { failed: boolean };

class KeyErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("Admin query failed", error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div role="alert" className="rounded-[20px] border border-plum-300/50 bg-plum-100 p-6 text-ink">
          <p className="font-medium text-plum-700">{t.badKey}</p>
          <button
            type="button"
            className={`${ghostButtonClass} mt-4`}
            onClick={() => {
              this.setState({ failed: false });
              this.props.onReset();
            }}
          >
            {t.keyClear}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Key form ---------- */

function KeyForm({ onSubmit }: { onSubmit: (key: string) => void }) {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="max-w-sm space-y-4"
    >
      <div>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
          {t.keyLabel}
        </label>
        <input
          id={id}
          type="password"
          autoComplete="current-password"
          required
          placeholder={t.keyPlaceholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        />
      </div>
      <button type="submit" className={primaryButtonClass}>
        {t.keySubmit}
      </button>
    </form>
  );
}

/* ---------- Table ---------- */

function BookingsTable({ adminKey }: { adminKey: string }) {
  const bookings = useQuery(api.bookings.list, { key: adminKey });
  const setStatus = useMutation(api.bookings.setStatus);
  const [busy, setBusy] = useState<Id<"bookings"> | null>(null);

  const update = async (id: Id<"bookings">, status: Status) => {
    setBusy(id);
    try {
      await setStatus({ key: adminKey, id, status });
    } finally {
      setBusy(null);
    }
  };

  if (bookings === undefined) {
    return <p className="text-ink/70">{t.loading}</p>;
  }

  return (
    <>
      <p className="mb-4 text-sm text-ink/70">{t.count(bookings.length)}</p>
      {bookings.length === 0 ? (
        <p className="rounded-[20px] border border-plum-300/40 bg-white p-6 text-ink/70">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-plum-300/40 bg-white">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm text-ink">
            <thead className="bg-plum-100/60 text-xs uppercase tracking-wide text-plum-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.date}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.time}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.service}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.staff}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.name}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.phone}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.note}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.status}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: Doc<"bookings">) => (
                <tr key={b._id} className="border-t border-plum-300/30 align-top">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium">{formatDate(b.date)}</div>
                    <div className="text-xs text-ink/50">
                      {t.received} {new Date(b.createdAt).toLocaleDateString("sr-Latn-RS")}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{timeSlotLabel(b.timeSlot)}</td>
                  <td className="px-4 py-3">{b.serviceTitle}</td>
                  <td className="whitespace-nowrap px-4 py-3">{staffLabel(b.staff)}</td>
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a href={`tel:${b.phone}`} className="text-plum-700 underline underline-offset-4 hover:text-plum-500">
                      {b.phone}
                    </a>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 text-ink/80">{b.note ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass[b.status]}`}>
                      {statusLabel(b.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={ghostButtonClass}
                        disabled={busy === b._id || b.status === "potvrdjen"}
                        onClick={() => update(b._id, "potvrdjen")}
                      >
                        {t.confirm}
                      </button>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        disabled={busy === b._id || b.status === "otkazan"}
                        onClick={() => update(b._id, "otkazan")}
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------- Panel ---------- */

export default function AdminPanel() {
  // Read sessionStorage lazily on the client; output is gated by `hydrated` so SSR and hydration match.
  const [adminKey, setAdminKey] = useState<string>(() =>
    typeof window === "undefined" ? "" : readStoredKey(),
  );
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const applyKey = (key: string) => {
    writeStoredKey(key);
    setAdminKey(key);
  };

  const clearKey = () => applyKey("");

  return (
    <main className="min-h-screen bg-paper px-4 py-10 text-ink sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-plum-500">{site.name}</p>
            <h1 className="font-serif text-3xl text-plum-700 sm:text-4xl">{t.heading}</h1>
          </div>
          {adminKey && (
            <button type="button" className={ghostButtonClass} onClick={clearKey}>
              {t.keyClear}
            </button>
          )}
        </header>

        {!hydrated ? (
          <p className="text-ink/70">{t.loading}</p>
        ) : !adminKey ? (
          <KeyForm onSubmit={applyKey} />
        ) : (
          <KeyErrorBoundary key={adminKey} onReset={clearKey}>
            <BookingsTable adminKey={adminKey} />
          </KeyErrorBoundary>
        )}
      </div>
    </main>
  );
}
