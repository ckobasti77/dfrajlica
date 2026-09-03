"use client";

import { useEffect, useId, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { staffMembers, staffName, type StaffKey } from "@/content/site";
import { adminStrings as t } from "@/components/booking/strings";
import { WEEKDAYS_MON_FIRST, formatDayLong } from "@/lib/dates";
import { addDays, belgradeNow, fmtRange, toMin, weekdayOf, type Range } from "@/lib/slots";
import { Field, StatusLine, TimeSelect, cardClass, dangerButtonClass, ghostButtonClass, inputClass, primaryButtonClass, useAsyncAction } from "./ui";

type WeekRanges = Record<number, Range[]>;

function fromRows(rows: readonly Doc<"schedules">[], staffKey: StaffKey): WeekRanges {
  const out: WeekRanges = {};
  for (let d = 0; d < 7; d++) out[d] = [];
  for (const r of rows) {
    if (r.staffKey !== staffKey) continue;
    out[r.weekday].push({ startMin: r.startMin, endMin: r.endMin });
  }
  for (let d = 0; d < 7; d++) out[d].sort((a, b) => a.startMin - b.startMin);
  return out;
}

function sameWeek(a: WeekRanges, b: WeekRanges): boolean {
  for (let d = 0; d < 7; d++) {
    if (a[d].length !== b[d].length) return false;
    for (let i = 0; i < a[d].length; i++) {
      if (a[d][i].startMin !== b[d][i].startMin || a[d][i].endMin !== b[d][i].endMin) return false;
    }
  }
  return true;
}

function StaffWeek({ adminKey, staffKey, rows }: { adminKey: string; staffKey: StaffKey; rows: readonly Doc<"schedules">[] }) {
  const set = useMutation(api.schedules.set);
  const { run, busy, error, flash } = useAsyncAction();
  const [saved, setSaved] = useState<WeekRanges>(() => fromRows(rows, staffKey));
  const [week, setWeek] = useState<WeekRanges>(saved);
  const savedKey = JSON.stringify(saved);

  // Adopt server changes when nothing is being edited locally.
  useEffect(() => {
    const adopt = () => {
      const fresh = fromRows(rows, staffKey);
      if (JSON.stringify(fresh) === savedKey) return;
      setSaved(fresh);
      setWeek((w) => (sameWeek(w, JSON.parse(savedKey) as WeekRanges) ? fresh : w));
    };
    adopt();
  }, [rows, staffKey, savedKey]);

  const dirty = !sameWeek(week, saved);

  const update = (d: number, i: number, patch: Partial<Range>) =>
    setWeek((w) => ({ ...w, [d]: w[d].map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const remove = (d: number, i: number) => setWeek((w) => ({ ...w, [d]: w[d].filter((_, j) => j !== i) }));
  const add = (d: number) =>
    setWeek((w) => {
      const last = w[d][w[d].length - 1];
      const startMin = last ? Math.min(last.endMin + 60, toMin("20:00")) : toMin("10:00");
      const endMin = Math.min(startMin + 4 * 60, toMin("22:00"));
      return { ...w, [d]: [...w[d], { startMin, endMin }] };
    });

  const save = async () => {
    const ok = await run(async () => {
      for (let d = 0; d < 7; d++) {
        if (JSON.stringify(week[d]) === JSON.stringify(saved[d])) continue;
        await set({ key: adminKey, staffKey, weekday: d, ranges: week[d] });
      }
    });
    if (ok) setSaved(week);
  };

  return (
    <section className={cardClass} aria-label={staffName(staffKey)}>
      <h3 className="font-serif text-[22px] text-plum-700">{staffName(staffKey)}</h3>
      <ul className="mt-3 divide-y divide-plum-300/30">
        {WEEKDAYS_MON_FIRST.map(({ weekday, label }) => (
          <li key={weekday} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
            <p className="w-32 shrink-0 pt-2 text-[15px] font-medium capitalize text-ink">{label}</p>
            <div className="flex flex-1 flex-col gap-2">
              {week[weekday].length === 0 ? <p className="pt-2 text-[14px] text-ink/70">{t.hours.dayOff}</p> : null}
              {week[weekday].map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-ink/70">{t.hours.from}</span>
                  <TimeSelect value={r.startMin} onChange={(v) => update(weekday, i, { startMin: v, endMin: Math.max(r.endMin, v + 30) })} ariaLabel={`${label} ${t.hours.from}`} />
                  <span className="text-[13px] text-ink/70">{t.hours.to}</span>
                  <TimeSelect value={r.endMin} onChange={(v) => update(weekday, i, { endMin: v })} min={r.startMin + 15} ariaLabel={`${label} ${t.hours.to}`} />
                  <button type="button" className={`${dangerButtonClass} h-9 px-3`} onClick={() => remove(weekday, i)}>
                    {t.remove}
                  </button>
                </div>
              ))}
              <div>
                <button type="button" className={`${ghostButtonClass} h-9`} onClick={() => add(weekday)}>
                  {t.hours.addRange}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className={primaryButtonClass} disabled={!dirty || busy} onClick={save}>
          {t.save}
        </button>
        <StatusLine busy={busy} error={error} flash={flash} />
      </div>
    </section>
  );
}

/* ---------- Overrides ---------- */

type OverrideKind = "saturday" | "off" | "custom";

function nextSaturday(from: string): string {
  let d = from;
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(d) === 6) return d;
    d = addDays(d, 1);
  }
  return d;
}

function Overrides({ adminKey }: { adminKey: string }) {
  const id = useId();
  const today = belgradeNow().date;
  const to = addDays(today, 60);
  const list = useQuery(api.schedules.listOverrides, { key: adminKey, from: today, to });
  const upsert = useMutation(api.schedules.upsertOverride);
  const removeOv = useMutation(api.schedules.removeOverride);
  const { run, busy, error, flash } = useAsyncAction();

  const [kind, setKind] = useState<OverrideKind | null>(null);
  const [date, setDate] = useState(today);
  const [staff, setStaff] = useState<StaffKey | "both">("both");
  const [from, setFrom] = useState(toMin("10:00"));
  const [until, setUntil] = useState(toMin("16:00"));
  const [note, setNote] = useState("");

  const open = (k: OverrideKind) => {
    setKind(k);
    setDate(k === "saturday" ? nextSaturday(today) : today);
    setFrom(toMin("10:00"));
    setUntil(k === "saturday" ? toMin("16:00") : toMin("20:00"));
    setNote("");
  };

  const submit = async () => {
    if (!kind) return;
    const targets: StaffKey[] = staff === "both" ? staffMembers.map((m) => m.key) : [staff];
    const ok = await run(async () => {
      for (const staffKey of targets) {
        await upsert({
          key: adminKey,
          staffKey,
          date,
          kind: kind === "off" ? "off" : "custom",
          startMin: kind === "off" ? undefined : from,
          endMin: kind === "off" ? undefined : until,
          note: note.trim() || undefined,
        });
      }
    });
    if (ok) setKind(null);
  };

  return (
    <section className={cardClass} aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="font-serif text-[22px] text-plum-700">
        {t.hours.overridesTitle}
      </h3>
      <p className="mt-1 text-[14px] text-ink/70">{t.hours.overridesIntro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={ghostButtonClass} onClick={() => open("saturday")}>
          {t.hours.addWorkingSaturday}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => open("off")}>
          {t.hours.addDayOff}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => open("custom")}>
          {t.hours.addCustom}
        </button>
      </div>

      {kind ? (
        <form
          className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-paper/70 p-4 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field label={t.calendar.date} htmlFor={`${id}-date`}>
            <input id={`${id}-date`} type="date" className={inputClass} value={date} min={today} onChange={(e) => e.target.value && setDate(e.target.value)} required />
          </Field>
          <Field label={t.calendar.manual.staff} htmlFor={`${id}-staff`}>
            <select id={`${id}-staff`} className={inputClass} value={staff} onChange={(e) => setStaff(e.target.value as StaffKey | "both")}>
              <option value="both">{staffMembers.map((m) => m.name).join(" и ")}</option>
              {staffMembers.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          {kind !== "off" ? (
            <>
              <Field label={t.hours.from} htmlFor={`${id}-from`}>
                <TimeSelect id={`${id}-from`} value={from} onChange={(v) => { setFrom(v); if (until <= v) setUntil(v + 60); }} />
              </Field>
              <Field label={t.hours.to} htmlFor={`${id}-to`}>
                <TimeSelect id={`${id}-to`} value={until} onChange={setUntil} min={from + 15} />
              </Field>
            </>
          ) : null}
          <div className="col-span-2 sm:col-span-4">
            <Field label={t.hours.note} htmlFor={`${id}-note`}>
              <input id={`${id}-note`} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
            </Field>
          </div>
          <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              {t.save}
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setKind(null)}>
              {t.cancel}
            </button>
            <StatusLine busy={busy} error={error} flash={flash} />
          </div>
        </form>
      ) : (
        <StatusLine busy={busy} error={error} flash={flash} />
      )}

      {list === undefined ? (
        <p className="mt-3 text-ink/70">{t.loading}</p>
      ) : list.length === 0 ? (
        <p className="mt-3 text-[14px] text-ink/70">{t.hours.noOverrides}</p>
      ) : (
        <ul className="mt-3 divide-y divide-plum-300/30">
          {[...list]
            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
            .map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[15px]">
                <span>
                  <span className="font-medium text-ink">{formatDayLong(o.date)}</span>
                  <span className="text-ink/70">
                    {" "}
                    · {staffName(o.staffKey)} ·{" "}
                    {o.kind === "off" ? t.hours.kindOff : `${t.hours.kindCustom} ${fmtRange(o.startMin ?? 0, o.endMin ?? 0)}`}
                    {o.note ? ` · ${o.note}` : ""}
                  </span>
                </span>
                <button type="button" className={`${dangerButtonClass} h-9 px-3`} disabled={busy} onClick={() => run(() => removeOv({ key: adminKey, id: o._id }))}>
                  {t.remove}
                </button>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Settings ---------- */

function SettingsCard({ adminKey }: { adminKey: string }) {
  const id = useId();
  const settings = useQuery(api.settings.get, { key: adminKey });
  const update = useMutation(api.settings.update);
  const { run, busy, error, flash } = useAsyncAction();
  const [form, setForm] = useState<{ slotStepMin: number; leadTimeMin: number; horizonDays: number; holdHours: number } | null>(null);
  const current = form ?? settings ?? null;

  const num = (key: keyof NonNullable<typeof form>, label: string, min: number, max: number, step = 1) => (
    <Field label={label} htmlFor={`${id}-${key}`}>
      <input
        id={`${id}-${key}`}
        type="number"
        className={`${inputClass} tabular-nums`}
        min={min}
        max={max}
        step={step}
        value={current ? current[key] : ""}
        disabled={!current}
        onChange={(e) => current && setForm({ ...current, [key]: Number(e.target.value) })}
      />
    </Field>
  );

  return (
    <section className={cardClass}>
      <h3 className="font-serif text-[22px] text-plum-700">{t.hours.settingsTitle}</h3>
      <form
        className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form) return;
          const ok = await run(() => update({ key: adminKey, ...form }));
          if (ok) setForm(null);
        }}
      >
        {num("slotStepMin", t.hours.step, 5, 120, 5)}
        {num("leadTimeMin", t.hours.lead, 0, 10080, 30)}
        {num("horizonDays", t.hours.horizon, 1, 365)}
        {num("holdHours", t.hours.hold, 1, 720)}
        <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
          <button type="submit" className={primaryButtonClass} disabled={!form || busy}>
            {t.hours.saveSettings}
          </button>
          <StatusLine busy={busy} error={error} flash={flash} />
        </div>
      </form>
    </section>
  );
}

export default function HoursTab({ adminKey }: { adminKey: string }) {
  const rows = useQuery(api.schedules.listWeekly, { key: adminKey });
  if (rows === undefined) return <p className="text-ink/70">{t.loading}</p>;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-[24px] text-ink">{t.hours.title}</h2>
        <p className="mt-1 text-[14px] text-ink/70">{t.hours.intro}</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {staffMembers.map((m) => (
          <StaffWeek key={m.key} adminKey={adminKey} staffKey={m.key} rows={rows} />
        ))}
      </div>
      <Overrides adminKey={adminKey} />
      <SettingsCard adminKey={adminKey} />
    </div>
  );
}
