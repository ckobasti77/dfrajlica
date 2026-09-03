"use client";

import type { ReactNode } from "react";
import { bookingV2 as t } from "@/content/site";

export type SummaryData = {
  service: string | null;
  meta: string | null;
  staff: string | null;
  date: string | null;
  time: string | null;
  price: string | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[13px] font-medium uppercase tracking-[0.1em] text-ink/70">{label}</dt>
      <dd className="text-right text-[15px] font-medium text-ink">{value}</dd>
    </div>
  );
}

/** Desktop summary column. */
export function SummaryCard({ data, children }: { data: SummaryData; children?: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-plum-300/40 bg-paper/70 p-5" aria-label={t.summary.title}>
      <p className="eyebrow text-plum-500">{t.summary.title}</p>
      {data.service ? (
        <>
          <p className="mt-2 font-serif text-[22px] leading-tight text-ink">{data.service}</p>
          {data.meta ? <p className="text-[13px] text-ink/70">{data.meta}</p> : null}
          <dl className="mt-3 divide-y divide-plum-300/30 border-t border-plum-300/30">
            {data.staff ? <Row label={t.summary.staff} value={data.staff} /> : null}
            {data.date ? <Row label={t.summary.date} value={data.date} /> : null}
            {data.time ? <Row label={t.summary.time} value={data.time} /> : null}
            {data.price ? <Row label={t.summary.price} value={data.price} /> : null}
          </dl>
          {data.price ? <p className="mt-1 text-[12px] text-ink/70">{t.summary.priceNote}</p> : null}
        </>
      ) : (
        <p className="mt-2 text-[15px] text-ink/70">{t.summary.empty}</p>
      )}
      {children ? <div className="mt-5 space-y-2">{children}</div> : null}
    </aside>
  );
}

/** Mobile sticky bar at the bottom of the card. */
export function SummaryBar({ data, children, className = "" }: { data: SummaryData; children?: ReactNode; className?: string }) {
  const line = [data.service, data.date, data.time].filter(Boolean).join(" · ");
  // Must be a direct child of the tall wizard root: a sticky element can only travel
  // inside its parent's box, so a short wrapper would pin it to the card's end.
  return (
    <div className={`sticky bottom-0 z-10 -mx-5 -mb-5 mt-6 border-t border-plum-300/40 bg-white/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-8 sm:-mb-8 sm:px-8 ${className}`}>
      <p className="mb-2 truncate text-[13px] text-ink/70" aria-live="polite">
        {line || t.summary.empty}
      </p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
