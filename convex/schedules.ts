import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import schema, { overrideKindValidator, rangeValidator, staffKeyValidator } from "./schema";
import { assertAdminKey } from "./lib/admin";
import { DEFAULT_SETTINGS } from "./lib/availability";
import { MESSAGES, validateRanges } from "./lib/validate";
import { isValidDate } from "../lib/slots";

/** Weekly hours for every staff member (bounded: 2 staff × 7 days × few ranges). */
export const listWeekly = query({
  args: { key: v.string() },
  returns: v.array(schema.doc("schedules")),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    return await ctx.db.query("schedules").take(200);
  },
});

/** Replace all ranges for one staff member + weekday. Empty `ranges` = day off. */
export const set = mutation({
  args: {
    key: v.string(),
    staffKey: staffKeyValidator,
    weekday: v.number(),
    ranges: v.array(rangeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    if (!Number.isInteger(args.weekday) || args.weekday < 0 || args.weekday > 6) throw new ConvexError(MESSAGES.range);
    if (args.ranges.length > 6) throw new ConvexError(MESSAGES.range);
    validateRanges(args.ranges);

    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_staff_weekday", (q) => q.eq("staffKey", args.staffKey).eq("weekday", args.weekday))
      .take(50);
    for (const row of existing) await ctx.db.delete("schedules", row._id);
    for (const r of args.ranges) {
      await ctx.db.insert("schedules", {
        staffKey: args.staffKey,
        weekday: args.weekday,
        startMin: r.startMin,
        endMin: r.endMin,
      });
    }

    // First save of hours hides the „Подесите радно време" banner.
    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      await ctx.db.insert("settings", { ...DEFAULT_SETTINGS, hoursConfirmed: true });
    } else if (!settings.hoursConfirmed) {
      await ctx.db.patch("settings", settings._id, { hoursConfirmed: true });
    }
    return null;
  },
});

/* ---------- Overrides (day off / custom hours, e.g. „+ Радна субота") ---------- */

export const listOverrides = query({
  args: { key: v.string(), from: v.string(), to: v.string() },
  returns: v.array(schema.doc("scheduleOverrides")),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    return await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .take(200);
  },
});

export const upsertOverride = mutation({
  args: {
    key: v.string(),
    staffKey: staffKeyValidator,
    date: v.string(),
    kind: overrideKindValidator,
    startMin: v.optional(v.number()),
    endMin: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  returns: v.id("scheduleOverrides"),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    if (!isValidDate(args.date)) throw new ConvexError(MESSAGES.dateFormat);
    let startMin: number | undefined;
    let endMin: number | undefined;
    if (args.kind === "custom") {
      if (args.startMin === undefined || args.endMin === undefined) throw new ConvexError(MESSAGES.range);
      validateRanges([{ startMin: args.startMin, endMin: args.endMin }]);
      startMin = args.startMin;
      endMin = args.endMin;
    }
    const note = args.note?.trim().slice(0, 120) || undefined;
    const existing = await ctx.db
      .query("scheduleOverrides")
      .withIndex("by_staff_date", (q) => q.eq("staffKey", args.staffKey).eq("date", args.date))
      .take(10);
    // Keep exactly one override per staff+date.
    for (const dup of existing.slice(1)) await ctx.db.delete("scheduleOverrides", dup._id);
    const first = existing[0];
    if (first) {
      await ctx.db.replace("scheduleOverrides", first._id, {
        staffKey: args.staffKey,
        date: args.date,
        kind: args.kind,
        startMin,
        endMin,
        note,
      });
      return first._id;
    }
    return await ctx.db.insert("scheduleOverrides", {
      staffKey: args.staffKey,
      date: args.date,
      kind: args.kind,
      startMin,
      endMin,
      note,
    });
  },
});

export const removeOverride = mutation({
  args: { key: v.string(), id: v.id("scheduleOverrides") },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const doc = await ctx.db.get("scheduleOverrides", args.id);
    if (doc) await ctx.db.delete("scheduleOverrides", args.id);
    return null;
  },
});
