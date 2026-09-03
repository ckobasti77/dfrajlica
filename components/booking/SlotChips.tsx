"use client";

import { bookingV2 as t, site, staffName, type StaffKey } from "@/content/site";
import { Phone } from "@/components/ui/Icons";
import { fmt, fmtRange, groupByPartOfDay } from "@/lib/slots";
import { chipClass, secondaryButtonClass } from "./wizardStyles";

export type SlotOption = { startMin: number; staff: readonly StaffKey[] };

type Props = {
  /** undefined = loading */
  slots: readonly SlotOption[] | undefined;
  selected: number | null;
  durationMin: number;
  /** true when the user chose „Свеједно" and a slot is offered by only one staff member */
  showStaffHint: boolean;
  onSelect: (startMin: number) => void;
};

function Skeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {[0, 1].map((g) => (
        <div key={g}>
          <div className="mb-2.5 h-3 w-20 animate-pulse rounded bg-plum-100" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: g === 0 ? 5 : 7 }).map((_, i) => (
              <div key={i} className="h-11 w-[78px] animate-pulse rounded-full bg-plum-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SlotChips({ slots, selected, durationMin, showStaffHint, onSelect }: Props) {
  if (slots === undefined) return <Skeleton />;

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-plum-300/50 bg-plum-100/60 p-5 text-ink">
        <p className="text-[15px]">{t.day.empty}</p>
        <a href={site.phone.primary.tel} className={`${secondaryButtonClass} mt-3 gap-2`}>
          <Phone size={18} className="text-plum-500" />
          <span className="tabular-nums">{site.phone.primary.display}</span>
        </a>
      </div>
    );
  }

  const byStart = new Map(slots.map((s) => [s.startMin, s]));
  const groups = groupByPartOfDay(slots.map((s) => s.startMin));
  const sections = [
    { label: t.day.prepodne, starts: groups.prepodne },
    { label: t.day.popodne, starts: groups.popodne },
  ].filter((s) => s.starts.length > 0);

  return (
    <div className="space-y-5">
      {sections.map((sec) => (
        <div key={sec.label} role="group" aria-label={sec.label}>
          <p className="eyebrow mb-2.5 text-plum-500">{sec.label}</p>
          <div className="flex flex-wrap gap-2">
            {sec.starts.map((start) => {
              const isSel = start === selected;
              const opt = byStart.get(start);
              const hint = showStaffHint && opt && opt.staff.length === 1 ? staffName(opt.staff[0]) : null;
              return (
                <button
                  key={start}
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`${fmtRange(start, start + durationMin)}${hint ? `, ${t.day.withStaff(hint)}` : ""}`}
                  onClick={() => onSelect(start)}
                  className={chipClass(isSel, "h-11 min-w-[78px] flex-col gap-0 px-4 tabular-nums")}
                >
                  <span>{fmt(start)}</span>
                  {hint ? <span className={`text-[11px] font-normal leading-none ${isSel ? "text-white/80" : "text-ink/70"}`}>{hint}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
