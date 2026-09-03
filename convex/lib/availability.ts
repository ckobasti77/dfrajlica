/**
 * Availability core: resolves working ranges, busy ranges and settings from the
 * database and feeds them to the pure `buildDaySlots` in lib/slots.ts.
 * Used by both queries (reads) and the `bookings.request` mutation (re-validation
 * inside the transaction — this is what makes double booking impossible).
 */
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { bookableServices, staffMembers, type StaffKey } from "../../content/site";
import { belgradeNow, buildDaySlots, diffDays, minStartFor, toMin, weekdayOf, type Range } from "../../lib/slots";

export type Ctx = QueryCtx | MutationCtx;

export const DEFAULT_SETTINGS = {
  slotStepMin: 30,
  leadTimeMin: 120,
  horizonDays: 30,
  holdHours: 48,
} as const;

export type Settings = {
  slotStepMin: number;
  leadTimeMin: number;
  horizonDays: number;
  holdHours: number;
  hoursConfirmed: boolean;
};

/** Default weekly hours until the owner sets her own: Mon–Fri 10–20, Sat 10–16, Sun off. */
export const DEFAULT_WEEK: readonly (readonly Range[])[] = [
  [], // 0 Sunday
  [{ startMin: toMin("10:00"), endMin: toMin("20:00") }],
  [{ startMin: toMin("10:00"), endMin: toMin("20:00") }],
  [{ startMin: toMin("10:00"), endMin: toMin("20:00") }],
  [{ startMin: toMin("10:00"), endMin: toMin("20:00") }],
  [{ startMin: toMin("10:00"), endMin: toMin("20:00") }],
  [{ startMin: toMin("10:00"), endMin: toMin("16:00") }], // 6 Saturday
];

export const MAX_SCHEDULE_ROWS = 10;
export const MAX_BLOCKS_PER_DAY = 50;
export const MAX_BOOKINGS_PER_DAY = 200;

export async function getSettings(ctx: Ctx): Promise<Settings> {
  const doc = await ctx.db.query("settings").first();
  if (!doc) return { ...DEFAULT_SETTINGS, hoursConfirmed: false };
  return {
    slotStepMin: doc.slotStepMin,
    leadTimeMin: doc.leadTimeMin,
    horizonDays: doc.horizonDays,
    holdHours: doc.holdHours,
    hoursConfirmed: doc.hoursConfirmed ?? false,
  };
}

/** True once `admin.init` has run (staff rows exist). Before that, defaults apply in memory. */
export async function isSeeded(ctx: Ctx): Promise<boolean> {
  return (await ctx.db.query("staff").first()) !== null;
}

export async function activeStaffKeys(ctx: Ctx): Promise<StaffKey[]> {
  const rows = await ctx.db.query("staff").take(10);
  if (rows.length === 0) return staffMembers.map((s) => s.key);
  return rows
    .filter((r) => r.active)
    .sort((a, b) => a.order - b.order)
    .map((r) => r.key);
}

export function serviceByKey(serviceKey: string) {
  return bookableServices.find((s) => s.key === serviceKey);
}

/** Owner override (serviceOverrides) or the content default. `null` for an unknown service. */
export async function resolveDuration(ctx: Ctx, serviceKey: string): Promise<number | null> {
  const service = serviceByKey(serviceKey);
  if (!service) return null;
  const override = await ctx.db
    .query("serviceOverrides")
    .withIndex("by_serviceKey", (q) => q.eq("serviceKey", serviceKey))
    .first();
  return override?.durationMin ?? service.durationMin;
}

/** Working ranges for a staff member on a date: override wins, else weekly schedule, else defaults before seeding. */
export async function workRangesFor(ctx: Ctx, staffKey: StaffKey, date: string): Promise<Range[]> {
  const override = await ctx.db
    .query("scheduleOverrides")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .first();
  if (override) {
    if (override.kind === "off") return [];
    if (override.startMin === undefined || override.endMin === undefined) return [];
    return [{ startMin: override.startMin, endMin: override.endMin }];
  }
  const weekday = weekdayOf(date);
  const rows = await ctx.db
    .query("schedules")
    .withIndex("by_staff_weekday", (q) => q.eq("staffKey", staffKey).eq("weekday", weekday))
    .take(MAX_SCHEDULE_ROWS);
  if (rows.length === 0 && !(await isSeeded(ctx))) {
    return DEFAULT_WEEK[weekday].map((r) => ({ ...r }));
  }
  return rows.map((r) => ({ startMin: r.startMin, endMin: r.endMin }));
}

/** Blocks + pending/confirmed bookings for the staff member on that date. */
export async function busyRangesFor(ctx: Ctx, staffKey: StaffKey, date: string): Promise<Range[]> {
  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .take(MAX_BLOCKS_PER_DAY);
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .take(MAX_BOOKINGS_PER_DAY);
  const busy: Range[] = blocks.map((b) => ({ startMin: b.startMin, endMin: b.endMin }));
  for (const b of bookings) {
    if (b.status !== "nov" && b.status !== "potvrdjen") continue;
    if (b.startMin === undefined || b.endMin === undefined) continue;
    busy.push({ startMin: b.startMin, endMin: b.endMin });
  }
  return busy;
}

export type SlotsForArgs = {
  staffKey: StaffKey;
  date: string;
  durationMin: number;
  settings: Settings;
  /** Wall clock in ms — passed in by the caller (client for queries, Date.now() in mutations). */
  nowMs: number;
};

/** Bookable start minutes for one staff member on one date. */
export async function slotsFor(ctx: Ctx, { staffKey, date, durationMin, settings, nowMs }: SlotsForArgs): Promise<number[]> {
  const now = belgradeNow(nowMs);
  const minStartMin = minStartFor(now, date, settings.leadTimeMin);
  if (minStartMin === null) return [];
  if (diffDays(now.date, date) > settings.horizonDays) return [];
  const workRanges = await workRangesFor(ctx, staffKey, date);
  if (workRanges.length === 0) return [];
  const busyRanges = await busyRangesFor(ctx, staffKey, date);
  return buildDaySlots({ workRanges, busyRanges, durationMin, stepMin: settings.slotStepMin, minStartMin });
}

/** Number of pending + confirmed bookings for the staff member on that date (used to balance „Свеједно"). */
export async function countBookingsOn(ctx: Ctx, staffKey: StaffKey, date: string): Promise<number> {
  const rows = await ctx.db
    .query("bookings")
    .withIndex("by_staff_date", (q) => q.eq("staffKey", staffKey).eq("date", date))
    .take(MAX_BOOKINGS_PER_DAY);
  return rows.filter((b) => b.status === "nov" || b.status === "potvrdjen").length;
}

/** Staff members that may perform the service, restricted to the requested one if given. */
export async function candidateStaff(
  ctx: Ctx,
  serviceKey: string,
  staffKey: StaffKey | "any" | undefined,
): Promise<StaffKey[]> {
  const service = serviceByKey(serviceKey);
  if (!service) return [];
  const active = await activeStaffKeys(ctx);
  const allowed = service.staff.filter((k) => active.includes(k));
  if (!staffKey || staffKey === "any") return [...allowed];
  return allowed.includes(staffKey) ? [staffKey] : [];
}
