"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { bookableGroups, bookableServices } from "@/content/site";
import { adminStrings as t } from "@/components/booking/strings";
import { formatNumber } from "@/components/ui/format";
import { StatusLine, cardClass, ghostButtonClass, inputClass, useAsyncAction } from "./ui";

export default function ServicesTab({ adminKey }: { adminKey: string }) {
  const overrides = useQuery(api.services.overrides, {});
  const setDuration = useMutation(api.services.setDuration);
  const { run, busy, error, flash } = useAsyncAction();
  const [draft, setDraft] = useState<Record<string, number>>({});

  if (overrides === undefined) return <p className="text-ink/70">{t.loading}</p>;
  const current = new Map(overrides.map((o) => [o.serviceKey, o.durationMin]));

  const commit = async (key: string) => {
    const value = draft[key];
    if (value === undefined) return;
    const ok = await run(() => setDuration({ key: adminKey, serviceKey: key, durationMin: value }));
    if (ok) setDraft((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-[24px] text-ink">{t.services.title}</h2>
        <p className="mt-1 text-[14px] text-ink/70">{t.services.intro}</p>
      </div>
      <StatusLine busy={busy} error={error} flash={flash} />
      {bookableGroups.map((group) => (
        <section key={group} className={cardClass} aria-label={group}>
          <p className="eyebrow text-plum-500">{group}</p>
          <ul className="mt-2 divide-y divide-plum-300/30">
            {bookableServices
              .filter((s) => s.group === group)
              .map((s) => {
                const effective = current.get(s.key) ?? s.durationMin;
                const value = draft[s.key] ?? effective;
                const changed = draft[s.key] !== undefined && draft[s.key] !== effective;
                const id = `svc-${s.key}`;
                return (
                  <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <label htmlFor={id} className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-ink">{s.title}</span>
                      <span className="block text-[12.5px] text-ink/50">
                        {s.priceFrom !== null ? `${t.services.priceFrom} ${formatNumber(s.priceFrom)} · ` : ""}
                        {t.services.defaultOf(s.durationMin)}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={id}
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        value={value}
                        onChange={(e) => setDraft((d) => ({ ...d, [s.key]: Number(e.target.value) }))}
                        onBlur={() => changed && commit(s.key)}
                        onKeyDown={(e) => e.key === "Enter" && changed && commit(s.key)}
                        className={`${inputClass} w-24 tabular-nums ${changed ? "ring-2 ring-plum-500" : ""}`}
                        aria-label={`${s.title} — ${t.services.duration}`}
                      />
                      <span className="text-[13px] text-ink/50">мин</span>
                      {effective !== s.durationMin ? (
                        <button
                          type="button"
                          className={`${ghostButtonClass} h-9 px-3`}
                          disabled={busy}
                          onClick={() => run(() => setDuration({ key: adminKey, serviceKey: s.key, durationMin: s.durationMin }))}
                        >
                          {t.services.reset}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
