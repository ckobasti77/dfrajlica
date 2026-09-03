"use client";

import { Component, useEffect, useId, useState, useSyncExternalStore, type ErrorInfo, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { site } from "@/content/site";
import { adminStrings as t } from "@/components/booking/strings";
import CalendarTab from "./CalendarTab";
import HoursTab from "./HoursTab";
import RequestsTab from "./RequestsTab";
import ServicesTab from "./ServicesTab";
import { ghostButtonClass, inputClass, primaryButtonClass } from "./ui";

const STORAGE_KEY = "dfrajlica_admin_key";
const TAB_KEY = "dfrajlica_admin_tab";

type Tab = "requests" | "calendar" | "hours" | "services";
const TABS: Tab[] = ["requests", "calendar", "hours", "services"];

const subscribeNoop = () => () => {};

function readStored(key: string): string {
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStored(key: string, value: string): void {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // sessionStorage unavailable — state lives in memory only
  }
}

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
        <div role="alert" className="rounded-2xl border border-plum-300/50 bg-plum-100 p-6 text-ink">
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

/* ---------- Shell with tabs ---------- */

function Shell({ adminKey, tab, onTab }: { adminKey: string; tab: Tab; onTab: (t: Tab) => void }) {
  const status = useQuery(api.admin.status, { key: adminKey });
  const pending = useQuery(api.bookings.pendingCount, { key: adminKey });
  const init = useMutation(api.admin.init);
  const tabsId = useId();

  // Seed staff / default hours / settings on first load (idempotent).
  useEffect(() => {
    const seed = () => {
      if (status && !status.seeded) void init({ key: adminKey });
    };
    seed();
  }, [status, init, adminKey]);

  const labels: Record<Tab, string> = t.tabs;

  return (
    <>
      {status && !status.hoursConfirmed ? (
        <div role="status" className="mb-5 rounded-2xl border border-plum-300/50 bg-plum-100 p-4 text-ink">
          <p className="font-medium text-plum-700">{t.banner.title}</p>
          <p className="mt-1 text-[14px] text-ink/80">{t.banner.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={ghostButtonClass} onClick={() => onTab("hours")}>
              {t.banner.go}
            </button>
            {!status.seeded ? (
              <button type="button" className={ghostButtonClass} onClick={() => init({ key: adminKey })}>
                {t.banner.init}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div role="tablist" aria-label={t.heading} className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((k) => {
          const active = k === tab;
          return (
            <button
              key={k}
              id={`${tabsId}-${k}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${tabsId}-panel`}
              onClick={() => onTab(k)}
              className={[
                "relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
                active ? "bg-plum-700 text-white" : "text-plum-700 hover:bg-plum-100",
              ].join(" ")}
            >
              {labels[k]}
              {k === "requests" && pending ? (
                <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums ${active ? "bg-white text-plum-700" : "bg-plum-700 text-white"}`}>
                  {pending}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
        {tab === "requests" ? <RequestsTab adminKey={adminKey} /> : null}
        {tab === "calendar" ? <CalendarTab adminKey={adminKey} /> : null}
        {tab === "hours" ? <HoursTab adminKey={adminKey} /> : null}
        {tab === "services" ? <ServicesTab adminKey={adminKey} /> : null}
      </div>
    </>
  );
}

/* ---------- Panel ---------- */

export default function AdminPanel() {
  // Read sessionStorage lazily on the client; output is gated by `hydrated` so SSR and hydration match.
  const [adminKey, setAdminKey] = useState<string>(() => (typeof window === "undefined" ? "" : readStored(STORAGE_KEY)));
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "requests";
    const stored = readStored(TAB_KEY);
    return (TABS as string[]).includes(stored) ? (stored as Tab) : "requests";
  });
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const applyKey = (key: string) => {
    writeStored(STORAGE_KEY, key);
    setAdminKey(key);
  };
  const clearKey = () => applyKey("");
  const onTab = (next: Tab) => {
    writeStored(TAB_KEY, next);
    setTab(next);
  };

  return (
    <main id="admin-root" data-admin="" className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-plum-500">{site.name}</p>
            <h1 className="font-serif text-3xl text-plum-700 sm:text-4xl">{t.heading}</h1>
          </div>
          {adminKey ? (
            <button type="button" className={ghostButtonClass} onClick={clearKey}>
              {t.keyClear}
            </button>
          ) : null}
        </header>

        {!hydrated ? (
          <p className="text-ink/70">{t.loading}</p>
        ) : !adminKey ? (
          <KeyForm onSubmit={applyKey} />
        ) : (
          <KeyErrorBoundary key={adminKey} onReset={clearKey}>
            <Shell adminKey={adminKey} tab={tab} onTab={onTab} />
          </KeyErrorBoundary>
        )}
      </div>
    </main>
  );
}
