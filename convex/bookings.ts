import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import schema from "./schema";
import { staffKeyValidator, staffValidator, statusValidator, timeSlotValidator } from "./schema";
import { assertAdminKey } from "./lib/admin";
import {
  candidateStaff,
  countBookingsOn,
  getSettings,
  resolveDuration,
  serviceByKey,
  slotsFor,
  workRangesFor,
} from "./lib/availability";
import {
  MESSAGES,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  validateName,
  validateNote,
  validatePhone,
} from "./lib/validate";
import { staffName } from "../content/site";
import { belgradeNow, diffDays, fmtRange, isValidDate, overlaps, weekdayOf } from "../lib/slots";

/** Mirrors ServiceId in content/site.ts for the deprecated v1 `create`. */
const LEGACY_SERVICE_IDS = ["manikir", "pedikir", "trepavice", "depilacija", "lice", "sprej-tan"] as const;

/** Today's date as YYYY-MM-DD in Europe/Belgrade (kept for the deprecated v1 path). */
export function belgradeToday(now: number = Date.now()): string {
  return belgradeNow(now).date;
}

const bookingDoc = schema.doc("bookings");

async function assertRateLimit(ctx: MutationCtx, phone: string, now: number): Promise<void> {
  const recent = await ctx.db
    .query("bookings")
    .withIndex("by_phone", (q) => q.eq("phone", phone))
    .order("desc")
    .filter((q) => q.gt(q.field("createdAt"), now - RATE_LIMIT_WINDOW_MS))
    .take(RATE_LIMIT_MAX);
  if (recent.length >= RATE_LIMIT_MAX) throw new ConvexError(MESSAGES.rateLimit);
}

/* =====================================================================
 * v2 — slot requests
 * ===================================================================== */

export const request = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    serviceKey: v.string(),
    staffKey: v.union(staffKeyValidator, v.literal("any")),
    date: v.string(),
    startMin: v.number(),
    note: v.optional(v.string()),
    /** Honeypot — real users never fill it. */
    website: v.optional(v.string()),
  },
  returns: v.object({
    id: v.union(v.id("bookings"), v.null()),
    staffKey: staffKeyValidator,
    startMin: v.number(),
    endMin: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Honeypot: pretend success without writing anything so bots are not tipped off.
    if (args.website && args.website.trim() !== "") {
      return { id: null, staffKey: "branka" as const, startMin: args.startMin, endMin: args.startMin + 60 };
    }

    const name = validateName(args.name);
    const phone = validatePhone(args.phone);
    const note = validateNote(args.note);

    const service = serviceByKey(args.serviceKey);
    if (!service) throw new ConvexError(MESSAGES.service);
    const durationMin = await resolveDuration(ctx, args.serviceKey);
    if (durationMin === null) throw new ConvexError(MESSAGES.service);

    if (!isValidDate(args.date)) throw new ConvexError(MESSAGES.dateFormat);
    const settings = await getSettings(ctx);
    const today = belgradeNow(now);
    if (args.date < today.date) throw new ConvexError(MESSAGES.datePast);
    if (diffDays(today.date, args.date) > settings.horizonDays) throw new ConvexError(MESSAGES.horizon);
    if (!Number.isInteger(args.startMin) || args.startMin < 0 || args.startMin >= 24 * 60) {
      throw new ConvexError(MESSAGES.taken);
    }

    const candidates = await candidateStaff(ctx, args.serviceKey, args.staffKey);
    if (candidates.length === 0) throw new ConvexError(MESSAGES.staff);

    // Sunday is closed unless an override opens it for at least one candidate.
    if (weekdayOf(args.date) === 0) {
      let open = false;
      for (const staffKey of candidates) {
        if ((await workRangesFor(ctx, staffKey, args.date)).length > 0) open = true;
      }
      if (!open) throw new ConvexError(MESSAGES.sunday);
    }

    // Re-validate the slot from the database inside this transaction. Two
    // concurrent requests for the same slot read the same index range, so
    // Convex's serializable execution guarantees only one of them commits.
    const free: Doc<"staff">["key"][] = [];
    for (const staffKey of candidates) {
      const slots = await slotsFor(ctx, { staffKey, date: args.date, durationMin, settings, nowMs: now });
      if (slots.includes(args.startMin)) free.push(staffKey);
    }
    if (free.length === 0) throw new ConvexError(MESSAGES.taken);

    let staffKey = free[0];
    if (free.length > 1) {
      // „Свеједно": prefer the staff member with fewer bookings that day.
      let best = Number.POSITIVE_INFINITY;
      for (const k of free) {
        const n = await countBookingsOn(ctx, k, args.date);
        if (n < best) {
          best = n;
          staffKey = k;
        }
      }
    }

    await assertRateLimit(ctx, phone, now);

    const endMin = args.startMin + durationMin;
    const id = await ctx.db.insert("bookings", {
      name,
      phone,
      serviceKey: service.key,
      serviceTitle: service.title,
      durationMin,
      staffKey,
      date: args.date,
      startMin: args.startMin,
      endMin,
      note,
      status: "nov",
      createdAt: now,
      source: "web",
    });

    await ctx.scheduler.runAfter(0, internal.notify.newRequest, {
      name,
      phone,
      serviceTitle: service.title,
      staffName: staffName(staffKey),
      date: args.date,
      timeRange: fmtRange(args.startMin, endMin),
      note: note ?? "",
    });

    return { id, staffKey, startMin: args.startMin, endMin };
  },
});

/* =====================================================================
 * Admin
 * ===================================================================== */

/** Newest 200 requests of any status (legacy list; the admin now uses `listPending` + `listRange`). */
export const list = query({
  args: { key: v.string() },
  returns: v.array(bookingDoc),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    return await ctx.db.query("bookings").withIndex("by_createdAt").order("desc").take(200);
  },
});

/** Pending requests, soonest first. */
export const listPending = query({
  args: { key: v.string() },
  returns: v.array(bookingDoc),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "nov"))
      .take(200);
    return rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.startMin ?? 0) - (b.startMin ?? 0)));
  },
});

export const pendingCount = query({
  args: { key: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "nov"))
      .take(100);
    return rows.length;
  },
});

/** All bookings with `from <= date <= to` (any status) — the admin calendar filters. */
export const listRange = query({
  args: { key: v.string(), from: v.string(), to: v.string() },
  returns: v.array(bookingDoc),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    return await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .take(500);
  },
});

const ALLOWED_TRANSITIONS: Record<Doc<"bookings">["status"], Doc<"bookings">["status"][]> = {
  nov: ["potvrdjen", "odbijen", "otkazan"],
  potvrdjen: ["otkazan"],
  otkazan: [],
  odbijen: [],
};

export const setStatus = mutation({
  args: { key: v.string(), id: v.id("bookings"), status: statusValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const doc = await ctx.db.get("bookings", args.id);
    if (!doc) throw new ConvexError(MESSAGES.notFound);
    if (!ALLOWED_TRANSITIONS[doc.status].includes(args.status)) throw new ConvexError(MESSAGES.transition);
    await ctx.db.patch("bookings", args.id, { status: args.status, decidedAt: Date.now() });
    return null;
  },
});

/** Owner adds a phone booking straight into the calendar as confirmed. */
export const createManual = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    serviceKey: v.string(),
    staffKey: staffKeyValidator,
    date: v.string(),
    startMin: v.number(),
    durationMin: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  returns: v.id("bookings"),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const name = validateName(args.name);
    const phoneRaw = args.phone?.trim() ?? "";
    const phone = phoneRaw ? validatePhone(phoneRaw) : "";
    const note = validateNote(args.note);
    const service = serviceByKey(args.serviceKey);
    if (!service) throw new ConvexError(MESSAGES.service);
    const durationMin = args.durationMin ?? (await resolveDuration(ctx, args.serviceKey)) ?? service.durationMin;
    if (!Number.isInteger(durationMin) || durationMin <= 0 || durationMin > 12 * 60) throw new ConvexError(MESSAGES.range);
    if (!isValidDate(args.date)) throw new ConvexError(MESSAGES.dateFormat);
    if (!Number.isInteger(args.startMin) || args.startMin < 0) throw new ConvexError(MESSAGES.range);
    const endMin = args.startMin + durationMin;
    if (endMin > 24 * 60) throw new ConvexError(MESSAGES.range);

    // The owner may book outside working hours, but never on top of another booking or block.
    const slot = { startMin: args.startMin, endMin };
    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_staff_date", (q) => q.eq("staffKey", args.staffKey).eq("date", args.date))
      .take(200);
    for (const b of existing) {
      if ((b.status === "nov" || b.status === "potvrdjen") && b.startMin !== undefined && b.endMin !== undefined) {
        if (overlaps(slot, { startMin: b.startMin, endMin: b.endMin })) throw new ConvexError(MESSAGES.overlap);
      }
    }
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_staff_date", (q) => q.eq("staffKey", args.staffKey).eq("date", args.date))
      .take(50);
    for (const b of blocks) {
      if (overlaps(slot, { startMin: b.startMin, endMin: b.endMin })) throw new ConvexError(MESSAGES.overlap);
    }

    const now = Date.now();
    return await ctx.db.insert("bookings", {
      name,
      phone,
      serviceKey: service.key,
      serviceTitle: service.title,
      durationMin,
      staffKey: args.staffKey,
      date: args.date,
      startMin: args.startMin,
      endMin,
      note,
      status: "potvrdjen",
      createdAt: now,
      decidedAt: now,
      source: "admin",
    });
  },
});

/** Cron target: pending requests older than `holdHours` become „otkazan" with note „истекло". */
export const expirePending = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const settings = await getSettings(ctx);
    const cutoff = Date.now() - settings.holdHours * 60 * 60 * 1000;
    const pending = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "nov"))
      .take(200);
    let n = 0;
    for (const b of pending) {
      if (b.createdAt >= cutoff) continue;
      const note = b.note ? `${b.note} · истекло` : "истекло";
      await ctx.db.patch("bookings", b._id, { status: "otkazan", note, decidedAt: Date.now() });
      n++;
    }
    return n;
  },
});

/* =====================================================================
 * v1 — DEPRECATED. Kept for one deploy so already-loaded clients keep working.
 * Remove after the next deploy.
 * ===================================================================== */

/** @deprecated Use `bookings.request`. */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    serviceId: v.string(),
    serviceTitle: v.string(),
    staff: v.optional(staffValidator),
    date: v.string(),
    timeSlot: timeSlotValidator,
    note: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  returns: v.object({ id: v.union(v.id("bookings"), v.null()) }),
  handler: async (ctx, args) => {
    if (args.website && args.website.trim() !== "") return { id: null };
    const name = validateName(args.name);
    const phone = validatePhone(args.phone);
    if (!isValidDate(args.date)) throw new ConvexError(MESSAGES.dateFormat);
    const now = Date.now();
    if (args.date < belgradeToday(now)) throw new ConvexError(MESSAGES.datePast);
    if (weekdayOf(args.date) === 0) throw new ConvexError(MESSAGES.sunday);
    if (!(LEGACY_SERVICE_IDS as readonly string[]).includes(args.serviceId)) throw new ConvexError(MESSAGES.service);
    const note = validateNote(args.note);
    await assertRateLimit(ctx, phone, now);
    const startMin = args.timeSlot === "popodne" ? 14 * 60 : 10 * 60;
    const staffKey = args.staff === "jana" ? "jana" : "branka";
    const id = await ctx.db.insert("bookings", {
      name,
      phone,
      serviceId: args.serviceId,
      serviceKey: args.serviceId,
      serviceTitle: args.serviceTitle.trim().slice(0, 80),
      durationMin: 60,
      staff: args.serviceId === "manikir" ? args.staff : undefined,
      staffKey,
      date: args.date,
      timeSlot: args.timeSlot,
      startMin,
      endMin: startMin + 60,
      note,
      status: "nov",
      createdAt: now,
      source: "web",
    });
    return { id };
  },
});
