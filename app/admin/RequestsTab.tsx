"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { staffName } from "@/content/site";
import { adminStrings as t } from "@/components/booking/strings";
import { formatDayLong } from "@/lib/dates";
import { fmtRange } from "@/lib/slots";
import { cardClass, dangerButtonClass, errorMessage, primaryButtonClass } from "./ui";

export function bookingTime(b: Doc<"bookings">): string {
  if (b.startMin === undefined || b.endMin === undefined) return "—";
  return fmtRange(b.startMin, b.endMin);
}

export default function RequestsTab({ adminKey }: { adminKey: string }) {
  const pending = useQuery(api.bookings.listPending, { key: adminKey });
  const setStatus = useMutation(api.bookings.setStatus);
  const [busy, setBusy] = useState<Id<"bookings"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (id: Id<"bookings">, status: "potvrdjen" | "odbijen") => {
    setBusy(id);
    setError(null);
    try {
      await setStatus({ key: adminKey, id, status });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (pending === undefined) return <p className="text-ink/70">{t.loading}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70">{t.requests.count(pending.length)}</p>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {pending.length === 0 ? (
        <p className={`${cardClass} text-ink/70`}>{t.requests.empty}</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((b) => (
            <li key={b._id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-[20px] leading-tight text-ink">{b.serviceTitle}</p>
                  <p className="mt-0.5 text-[14px] text-ink/70">
                    {staffName(b.staffKey)} · {formatDayLong(b.date)} · <span className="tabular-nums">{bookingTime(b)}</span>
                  </p>
                </div>
                <p className="text-[12px] text-ink/70">
                  {t.requests.received} {new Date(b.createdAt).toLocaleString("sr-Latn-RS", { dateStyle: "short", timeStyle: "short" })}
                  {b.source === "admin" ? ` · ${t.requests.source.admin}` : ""}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
                <span className="font-medium text-ink">{b.name}</span>
                {b.phone ? (
                  <a href={`tel:${b.phone}`} className="tabular-nums text-plum-700 underline underline-offset-4 hover:text-plum-500">
                    {b.phone}
                  </a>
                ) : null}
              </div>
              {b.note ? (
                <p className="mt-2 rounded-xl bg-paper/70 px-3 py-2 text-[14px] text-ink/80">
                  <span className="text-ink/70">{t.requests.note}: </span>
                  {b.note}
                </p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <button type="button" className={primaryButtonClass} disabled={busy === b._id} onClick={() => decide(b._id, "potvrdjen")}>
                  {t.requests.confirm}
                </button>
                <button type="button" className={`${dangerButtonClass} h-11`} disabled={busy === b._id} onClick={() => decide(b._id, "odbijen")}>
                  {t.requests.decline}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
