"use client";

import { useId } from "react";
import { bookableGroups, bookableServices, bookingV2 as t, staffMembers, type BookableService, type StaffKey } from "@/content/site";
import { formatNumber } from "@/components/ui/format";
import { chipClass } from "./wizardStyles";

export type StaffChoice = StaffKey | "any";

type Props = {
  serviceKey: string | null;
  staffKey: StaffChoice;
  durations: ReadonlyMap<string, number>;
  onService: (key: string) => void;
  onStaff: (key: StaffChoice) => void;
};

export function serviceMeta(service: BookableService, durations: ReadonlyMap<string, number>): string {
  const dur = durations.get(service.key) ?? service.durationMin;
  const parts = [t.service.minutes(dur)];
  if (service.priceFrom !== null) parts.push(t.service.priceFrom(formatNumber(service.priceFrom)));
  return parts.join(" · ");
}

export default function ServiceStep({ serviceKey, staffKey, durations, onService, onStaff }: Props) {
  const staffLabelId = useId();
  const selected = serviceKey ? bookableServices.find((s) => s.key === serviceKey) : undefined;
  const showStaff = selected !== undefined && selected.staff.length > 1;

  return (
    <div className="space-y-6">
      {bookableGroups.map((group) => {
        const items = bookableServices.filter((s) => s.group === group);
        return (
          <div key={group}>
            <p className="eyebrow mb-2.5 text-plum-500">{group}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => {
                const isSel = s.key === serviceKey;
                return (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => onService(s.key)}
                    className={chipClass(isSel, "h-auto min-h-11 flex-col items-start gap-0 rounded-2xl px-4 py-2 text-left")}
                  >
                    <span className="leading-tight">{s.title}</span>
                    <span className={`text-[12.5px] font-normal tabular-nums ${isSel ? "text-white/80" : "text-ink/70"}`}>
                      {serviceMeta(s, durations)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {showStaff ? (
        <div>
          <p id={staffLabelId} className="eyebrow mb-2.5 text-plum-500">
            {t.service.staffLabel}
          </p>
          <div role="group" aria-labelledby={staffLabelId} className="inline-flex rounded-full border border-plum-300/60 bg-white p-1">
            {[...staffMembers.map((m) => ({ key: m.key as StaffChoice, label: m.name })), { key: "any" as StaffChoice, label: t.service.staffAny }].map(
              (o) => {
                const isSel = o.key === staffKey;
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => onStaff(o.key)}
                    className={[
                      "h-10 rounded-full px-4 text-[15px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
                      isSel ? "bg-plum-700 text-white" : "text-ink hover:bg-plum-100",
                    ].join(" ")}
                  >
                    {o.label}
                  </button>
                );
              },
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
