"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { bookingV2 as t } from "@/content/site";
import { ChevronLeft, ChevronRight } from "@/components/ui/Icons";
import { formatDayLong, formatDayNumber, formatMonthYear, formatWeekdayShort } from "@/lib/dates";
import { addDays, weekdayOf } from "@/lib/slots";

export type DayInfo = {
  date: string;
  /** undefined while the week query is loading */
  count: number | undefined;
};

type Props = {
  weekStart: string;
  today: string;
  /** last bookable date (inclusive) */
  horizonEnd: string;
  selected: string | null;
  days: readonly DayInfo[];
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

const arrowClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-plum-700 transition-colors duration-200 hover:bg-plum-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 disabled:cursor-not-allowed disabled:opacity-30";

export default function WeekStrip({ weekStart, today, horizonEnd, selected, days, onSelect, onPrev, onNext }: Props) {
  const groupId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isCurrentWeek = weekStart === today;
  const canPrev = weekStart > today;
  const canNext = addDays(weekStart, 7) <= horizonEnd;

  const enabled = (d: DayInfo) => d.date >= today && d.date <= horizonEnd && weekdayOf(d.date) !== 0 && d.count !== 0;

  const firstEnabled = days.findIndex(enabled);
  const rovingIndex = selected ? days.findIndex((d) => d.date === selected) : firstEnabled;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    let i = index;
    if (e.key === "Home") i = -1;
    if (e.key === "End") i = days.length;
    for (let step = 0; step < days.length; step++) {
      i = e.key === "Home" ? i + 1 : e.key === "End" ? i - 1 : i + dir;
      if (i < 0 || i >= days.length) break;
      if (enabled(days[i])) {
        onSelect(days[i].date);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  return (
    <div className="rounded-2xl bg-paper/70 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onPrev} disabled={!canPrev} aria-label={t.day.prevWeek} className={arrowClass}>
          <ChevronLeft size={20} />
        </button>
        <p id={`${groupId}-label`} className="text-center font-serif text-[19px] text-ink sm:text-[21px]">
          {formatMonthYear(weekStart)}
          {isCurrentWeek ? <span className="block font-sans text-[13px] leading-tight text-ink/50 sm:ml-2 sm:inline sm:text-[14px]">{t.day.thisWeek}</span> : null}
        </p>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label={t.day.nextWeek} className={arrowClass}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div role="radiogroup" aria-label={t.day.weekStrip} aria-describedby={`${groupId}-label`} className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isSel = d.date === selected;
          const isToday = d.date === today;
          const sunday = weekdayOf(d.date) === 0;
          const past = d.date < today || d.date > horizonEnd;
          const isEnabled = enabled(d);
          const loading = d.count === undefined && !sunday && !past;
          const reason = sunday ? t.day.sundayClosed : past ? t.day.dayOff : d.count === 0 ? t.day.noSlots : "";
          const label = `${formatDayLong(d.date)}${isToday ? `, ${t.day.today}` : ""}${reason ? `, ${reason}` : ""}`;
          return (
            <button
              key={d.date}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSel}
              aria-label={label}
              aria-disabled={!isEnabled}
              tabIndex={i === rovingIndex ? 0 : -1}
              onClick={() => isEnabled && onSelect(d.date)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={[
                "group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
                isEnabled ? "cursor-pointer hover:bg-plum-100/70" : "cursor-not-allowed",
              ].join(" ")}
            >
              <span className={`text-[11px] font-semibold tracking-[0.08em] ${isEnabled ? "text-ink/60" : "text-ink/30"}`}>
                {formatWeekdayShort(d.date)}
              </span>
              <span
                className={[
                  "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-200",
                  isSel
                    ? "bg-plum-700 text-white shadow-plum"
                    : isEnabled
                      ? "text-ink group-hover:bg-white"
                      : "text-ink/30 line-through decoration-ink/20",
                  isToday && !isSel ? "ring-2 ring-plum-500 ring-offset-2 ring-offset-paper" : "",
                  loading ? "animate-pulse" : "",
                ].join(" ")}
              >
                {formatDayNumber(d.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
