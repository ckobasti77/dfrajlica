"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { bookableServices, staffMembers, staffName, type StaffKey } from "@/content/site";
import { adminStrings as t, statusLabel } from "@/components/booking/strings";
import { ChevronLeft, ChevronRight } from "@/components/ui/Icons";
import { formatDayLong } from "@/lib/dates";
import { addDays, belgradeNow, fmt, fmtRange, normalizeRanges, weekdayOf, type Range } from "@/lib/slots";
import { Field, Modal, StatusLine, TimeSelect, compactInputClass, dangerButtonClass, ghostButtonClass, inputClass, primaryButtonClass, useAsyncAction } from "./ui";

const DAY_START = 8 * 60;
const DAY_END = 21 * 60;
const ROW_MIN = 30;
const ROW_PX = 44;
const ROWS = (DAY_END - DAY_START) / ROW_MIN;

type Booking = Doc<"bookings">;
type Block = Doc<"blocks">;

type Sheet =
  | { kind: "cell"; staffKey: StaffKey; startMin: number }
  | { kind: "manual"; staffKey: StaffKey; startMin: number }
  | { kind: "block"; staffKey: StaffKey; startMin: number }
  | { kind: "booking"; booking: Booking }
  | { kind: "blockInfo"; block: Block }
  | null;

function top(min: number): number {
  return ((min - DAY_START) / ROW_MIN) * ROW_PX;
}

function workRangesFor(
  staffKey: StaffKey,
  date: string,
  schedules: readonly Doc<"schedules">[],
  overrides: readonly Doc<"scheduleOverrides">[],
): { ranges: Range[]; label: string | null } {
  const ov = overrides.find((o) => o.staffKey === staffKey && o.date === date);
  if (ov) {
    if (ov.kind === "off" || ov.startMin === undefined || ov.endMin === undefined) return { ranges: [], label: t.calendar.off };
    return { ranges: [{ startMin: ov.startMin, endMin: ov.endMin }], label: t.calendar.custom };
  }
  const wd = weekdayOf(date);
  const rows = schedules.filter((s) => s.staffKey === staffKey && s.weekday === wd);
  return { ranges: normalizeRanges(rows.map((r) => ({ startMin: r.startMin, endMin: r.endMin }))), label: rows.length === 0 ? t.calendar.closed : null };
}

/* ---------- Forms ---------- */

function ManualForm({ adminKey, staffKey, startMin, date, onDone }: { adminKey: string; staffKey: StaffKey; startMin: number; date: string; onDone: () => void }) {
  const id = useId();
  const create = useMutation(api.bookings.createManual);
  const overrides = useQuery(api.services.overrides, {});
  const { run, busy, error, flash } = useAsyncAction();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceKey, setServiceKey] = useState(bookableServices[0].key);
  const [staff, setStaff] = useState<StaffKey>(staffKey);
  const [start, setStart] = useState(startMin);
  const [note, setNote] = useState("");
  const [durationTouched, setDurationTouched] = useState<number | null>(null);

  const service = bookableServices.find((s) => s.key === serviceKey)!;
  const defaultDuration = overrides?.find((o) => o.serviceKey === serviceKey)?.durationMin ?? service.durationMin;
  const duration = durationTouched ?? defaultDuration;

  const submit = async () => {
    const ok = await run(() =>
      create({ key: adminKey, name, phone: phone.trim() || undefined, serviceKey, staffKey: staff, date, startMin: start, durationMin: duration, note: note.trim() || undefined }),
    );
    if (ok) onDone();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-[14px] text-ink/70">{formatDayLong(date)}</p>
      <Field label={t.calendar.manual.name} htmlFor={`${id}-name`}>
        <input id={`${id}-name`} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} autoFocus />
      </Field>
      <Field label={t.calendar.manual.phone} htmlFor={`${id}-phone`}>
        <input id={`${id}-phone`} className={inputClass} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label={t.calendar.manual.service} htmlFor={`${id}-service`}>
        <select
          id={`${id}-service`}
          className={inputClass}
          value={serviceKey}
          onChange={(e) => {
            setServiceKey(e.target.value);
            setDurationTouched(null);
          }}
        >
          {bookableServices.map((s) => (
            <option key={s.key} value={s.key}>
              {s.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t.calendar.manual.staff} htmlFor={`${id}-staff`}>
          <select id={`${id}-staff`} className={inputClass} value={staff} onChange={(e) => setStaff(e.target.value as StaffKey)}>
            {staffMembers.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.calendar.manual.start} htmlFor={`${id}-start`}>
          <TimeSelect id={`${id}-start`} value={start} onChange={setStart} />
        </Field>
        <Field label={t.calendar.manual.duration} htmlFor={`${id}-dur`}>
          <input id={`${id}-dur`} className={`${inputClass} tabular-nums`} type="number" min={5} max={480} step={5} value={duration} onChange={(e) => setDurationTouched(Number(e.target.value))} />
        </Field>
      </div>
      <Field label={t.calendar.manual.note} htmlFor={`${id}-note`}>
        <input id={`${id}-note`} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </Field>
      <StatusLine busy={busy} error={error} flash={flash} />
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={busy}>
        {t.calendar.manual.save}
      </button>
    </form>
  );
}

function BlockForm({ adminKey, staffKey, startMin, date, onDone }: { adminKey: string; staffKey: StaffKey; startMin: number; date: string; onDone: () => void }) {
  const id = useId();
  const add = useMutation(api.blocks.add);
  const { run, busy, error, flash } = useAsyncAction();
  const [staff, setStaff] = useState<StaffKey>(staffKey);
  const [from, setFrom] = useState(startMin);
  const [to, setTo] = useState(Math.min(startMin + 60, DAY_END));
  const [reason, setReason] = useState("");

  const submit = async () => {
    const ok = await run(() => add({ key: adminKey, staffKey: staff, date, startMin: from, endMin: to, reason: reason.trim() || undefined }));
    if (ok) onDone();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-[14px] text-ink/70">{formatDayLong(date)}</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t.calendar.blockForm.staff} htmlFor={`${id}-staff`}>
          <select id={`${id}-staff`} className={inputClass} value={staff} onChange={(e) => setStaff(e.target.value as StaffKey)}>
            {staffMembers.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.calendar.blockForm.from} htmlFor={`${id}-from`}>
          <TimeSelect id={`${id}-from`} value={from} onChange={(v) => { setFrom(v); if (to <= v) setTo(v + 30); }} />
        </Field>
        <Field label={t.calendar.blockForm.to} htmlFor={`${id}-to`}>
          <TimeSelect id={`${id}-to`} value={to} onChange={setTo} min={from + 15} />
        </Field>
      </div>
      <Field label={t.calendar.blockForm.reason} htmlFor={`${id}-reason`}>
        <input id={`${id}-reason`} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.calendar.blockForm.reasonPlaceholder} maxLength={120} />
      </Field>
      <StatusLine busy={busy} error={error} flash={flash} />
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={busy}>
        {t.calendar.blockForm.save}
      </button>
    </form>
  );
}

function BookingActions({ adminKey, booking, onDone }: { adminKey: string; booking: Booking; onDone: () => void }) {
  const setStatus = useMutation(api.bookings.setStatus);
  const { run, busy, error, flash } = useAsyncAction();
  const act = async (status: "potvrdjen" | "odbijen" | "otkazan") => {
    const ok = await run(() => setStatus({ key: adminKey, id: booking._id, status }));
    if (ok) onDone();
  };
  const time = booking.startMin !== undefined && booking.endMin !== undefined ? fmtRange(booking.startMin, booking.endMin) : "—";
  return (
    <div className="space-y-4">
      <div>
        <p className="font-serif text-[20px] text-ink">{booking.serviceTitle}</p>
        <p className="text-[14px] text-ink/70">
          {staffName(booking.staffKey)} · {formatDayLong(booking.date)} · <span className="tabular-nums">{time}</span>
        </p>
        <p className="mt-2 text-[15px] font-medium text-ink">{booking.name}</p>
        {booking.phone ? (
          <a href={`tel:${booking.phone}`} className="tabular-nums text-plum-700 underline underline-offset-4">
            {booking.phone}
          </a>
        ) : null}
        {booking.note ? <p className="mt-2 rounded-xl bg-paper/70 px-3 py-2 text-[14px] text-ink/80">{booking.note}</p> : null}
        <p className="mt-2 text-[13px] text-ink/70">{statusLabel(booking.status)}</p>
      </div>
      <StatusLine busy={busy} error={error} flash={flash} />
      <div className="flex flex-wrap gap-2">
        {booking.status === "nov" ? (
          <>
            <button type="button" className={primaryButtonClass} disabled={busy} onClick={() => act("potvrdjen")}>
              {t.calendar.confirm}
            </button>
            <button type="button" className={`${dangerButtonClass} h-11`} disabled={busy} onClick={() => act("odbijen")}>
              {t.calendar.decline}
            </button>
          </>
        ) : null}
        {booking.status === "potvrdjen" ? (
          <button type="button" className={`${dangerButtonClass} h-11`} disabled={busy} onClick={() => act("otkazan")}>
            {t.calendar.cancel}
          </button>
        ) : null}
        {booking.phone ? (
          <a href={`tel:${booking.phone}`} className={`${ghostButtonClass} h-11`}>
            {t.calendar.call}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function BlockInfo({ adminKey, block, onDone }: { adminKey: string; block: Block; onDone: () => void }) {
  const remove = useMutation(api.blocks.remove);
  const { run, busy, error, flash } = useAsyncAction();
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-ink">
        {staffName(block.staffKey)} · <span className="tabular-nums">{fmtRange(block.startMin, block.endMin)}</span>
        {block.reason ? ` · ${block.reason}` : ""}
      </p>
      <StatusLine busy={busy} error={error} flash={flash} />
      <button
        type="button"
        className={`${dangerButtonClass} h-11`}
        disabled={busy}
        onClick={async () => {
          const ok = await run(() => remove({ key: adminKey, id: block._id as Id<"blocks"> }));
          if (ok) onDone();
        }}
      >
        {t.calendar.removeBlock}
      </button>
    </div>
  );
}

/* ---------- Day grid ---------- */

export default function CalendarTab({ adminKey }: { adminKey: string }) {
  const [date, setDate] = useState(() => belgradeNow().date);
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = useCallback(() => setSheet(null), []);

  const bookings = useQuery(api.bookings.listRange, { key: adminKey, from: date, to: date });
  const blocks = useQuery(api.blocks.listDay, { key: adminKey, date });
  const schedules = useQuery(api.schedules.listWeekly, { key: adminKey });
  const overrides = useQuery(api.schedules.listOverrides, { key: adminKey, from: date, to: date });

  const today = belgradeNow().date;
  const rows = useMemo(() => Array.from({ length: ROWS }, (_, i) => DAY_START + i * ROW_MIN), []);

  const loading = bookings === undefined || blocks === undefined || schedules === undefined || overrides === undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ghostButtonClass} onClick={() => setDate(addDays(date, -1))} aria-label={t.calendar.prev}>
          <ChevronLeft size={18} />
        </button>
        <input type="date" className={`${compactInputClass} h-10`} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={t.calendar.date} />
        <button type="button" className={ghostButtonClass} onClick={() => setDate(addDays(date, 1))} aria-label={t.calendar.next}>
          <ChevronRight size={18} />
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => setDate(today)} disabled={date === today}>
          {t.calendar.today}
        </button>
        <p className="ml-1 font-serif text-[20px] text-ink">{formatDayLong(date)}</p>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink/70">
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-plum-700" />{t.calendar.legend.confirmed}</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border-2 border-plum-700 bg-white" />{t.calendar.legend.pending}</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[repeating-linear-gradient(45deg,#d4d4d4_0_3px,#f5f5f5_3px_6px)]" />{t.calendar.legend.block}</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-paper" />{t.calendar.legend.closed}</li>
      </ul>

      {loading ? (
        <p className="text-ink/70">{t.loading}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-plum-300/40 bg-white">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[56px_1fr_1fr] border-b border-plum-300/30 text-center text-[14px] font-semibold text-plum-700">
              <div />
              {staffMembers.map((m) => {
                const { label } = workRangesFor(m.key, date, schedules, overrides);
                return (
                  <div key={m.key} className="py-2">
                    {m.name}
                    {label ? <span className="ml-2 text-[12px] font-normal text-ink/70">{label}</span> : null}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-[56px_1fr_1fr]">
              <div className="relative" style={{ height: ROWS * ROW_PX }}>
                {rows.map((m) => (
                  <div key={m} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-ink/70" style={{ top: top(m) }}>
                    {m % 60 === 0 ? fmt(m) : ""}
                  </div>
                ))}
              </div>
              {staffMembers.map((m) => {
                const { ranges } = workRangesFor(m.key, date, schedules, overrides);
                const myBookings = bookings.filter((b) => b.staffKey === m.key && (b.status === "nov" || b.status === "potvrdjen") && b.startMin !== undefined);
                const myBlocks = blocks.filter((b) => b.staffKey === m.key);
                return (
                  <div key={m.key} className="relative border-l border-plum-300/30" style={{ height: ROWS * ROW_PX }}>
                    {/* off-hours shading */}
                    {ranges.length === 0 ? (
                      <div className="absolute inset-0 bg-paper" aria-hidden="true" />
                    ) : (
                      <>
                        <div className="absolute inset-x-0 top-0 bg-paper" style={{ height: Math.max(0, top(Math.max(DAY_START, ranges[0].startMin))) }} aria-hidden="true" />
                        {ranges.slice(1).map((r, i) => (
                          <div key={i} className="absolute inset-x-0 bg-paper" style={{ top: top(ranges[i].endMin), height: top(r.startMin) - top(ranges[i].endMin) }} aria-hidden="true" />
                        ))}
                        <div className="absolute inset-x-0 bottom-0 bg-paper" style={{ height: Math.max(0, top(DAY_END) - top(Math.min(DAY_END, ranges[ranges.length - 1].endMin))) }} aria-hidden="true" />
                      </>
                    )}
                    {/* cells */}
                    {rows.map((start) => (
                      <button
                        key={start}
                        type="button"
                        aria-label={`${m.name} ${fmt(start)} — ${t.calendar.cellActions}`}
                        onClick={() => setSheet({ kind: "cell", staffKey: m.key, startMin: start })}
                        className={`absolute inset-x-0 border-t ${start % 60 === 0 ? "border-plum-300/30" : "border-plum-300/15"} hover:bg-plum-100/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plum-500`}
                        style={{ top: top(start), height: ROW_PX }}
                      />
                    ))}
                    {/* blocks */}
                    {myBlocks.map((b) => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => setSheet({ kind: "blockInfo", block: b })}
                        className="absolute inset-x-1 z-[2] overflow-hidden rounded-lg border border-neutral-300 bg-[repeating-linear-gradient(45deg,#e5e5e5_0_4px,#f7f7f7_4px_8px)] px-2 text-left text-[12px] text-neutral-700"
                        style={{ top: top(Math.max(b.startMin, DAY_START)) + 1, height: Math.max(ROW_PX / 2, top(Math.min(b.endMin, DAY_END)) - top(Math.max(b.startMin, DAY_START)) - 2) }}
                      >
                        <span className="font-medium">{t.calendar.block}</span>
                        {b.reason ? ` · ${b.reason}` : ""}
                      </button>
                    ))}
                    {/* bookings */}
                    {myBookings.map((b) => {
                      const s = b.startMin ?? DAY_START;
                      const e = b.endMin ?? s + 60;
                      const confirmed = b.status === "potvrdjen";
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => setSheet({ kind: "booking", booking: b })}
                          className={[
                            "absolute inset-x-1 z-[3] overflow-hidden rounded-lg px-2 py-1 text-left text-[12px] leading-tight shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 focus-visible:ring-offset-1",
                            confirmed ? "bg-plum-700 text-white" : "border-2 border-plum-700 bg-white text-plum-700",
                          ].join(" ")}
                          style={{ top: top(Math.max(s, DAY_START)) + 1, height: Math.max(ROW_PX / 2, top(Math.min(e, DAY_END)) - top(Math.max(s, DAY_START)) - 2) }}
                        >
                          <span className="block truncate font-semibold">{b.name}</span>
                          <span className="block truncate">{b.serviceTitle}</span>
                          <span className="block tabular-nums opacity-80">{fmtRange(s, e)}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {sheet?.kind === "cell" ? (
        <Modal title={`${staffName(sheet.staffKey)} · ${fmt(sheet.startMin)}`} onClose={close}>
          <div className="flex flex-col gap-2">
            <button type="button" className={`${primaryButtonClass} w-full`} onClick={() => setSheet({ kind: "manual", staffKey: sheet.staffKey, startMin: sheet.startMin })}>
              {t.calendar.addBooking}
            </button>
            <button type="button" className={`${ghostButtonClass} h-11 w-full`} onClick={() => setSheet({ kind: "block", staffKey: sheet.staffKey, startMin: sheet.startMin })}>
              {t.calendar.addBlock}
            </button>
          </div>
        </Modal>
      ) : null}
      {sheet?.kind === "manual" ? (
        <Modal title={t.calendar.manual.title} onClose={close}>
          <ManualForm adminKey={adminKey} staffKey={sheet.staffKey} startMin={sheet.startMin} date={date} onDone={close} />
        </Modal>
      ) : null}
      {sheet?.kind === "block" ? (
        <Modal title={t.calendar.blockForm.title} onClose={close}>
          <BlockForm adminKey={adminKey} staffKey={sheet.staffKey} startMin={sheet.startMin} date={date} onDone={close} />
        </Modal>
      ) : null}
      {sheet?.kind === "booking" ? (
        <Modal title={sheet.booking.status === "nov" ? t.calendar.pending : t.calendar.confirmed} onClose={close}>
          <BookingActions adminKey={adminKey} booking={sheet.booking} onDone={close} />
        </Modal>
      ) : null}
      {sheet?.kind === "blockInfo" ? (
        <Modal title={t.calendar.legend.block} onClose={close}>
          <BlockInfo adminKey={adminKey} block={sheet.block} onDone={close} />
        </Modal>
      ) : null}
    </div>
  );
}
