import { v } from "convex/values";
import { query } from "./_generated/server";
import { staffKeyValidator } from "./schema";
import { candidateStaff, getSettings, resolveDuration, slotsFor } from "./lib/availability";
import { addDays, isValidDate } from "../lib/slots";

const staffArg = v.optional(v.union(staffKeyValidator, v.literal("any")));

/**
 * Free start minutes per staff member for one date.
 * `now` is passed by the client (rounded to a few minutes) so the query stays
 * cacheable and reactive without reading the wall clock.
 */
export const day = query({
  args: {
    date: v.string(),
    serviceKey: v.string(),
    staffKey: staffArg,
    now: v.number(),
  },
  returns: v.array(v.object({ staffKey: staffKeyValidator, slots: v.array(v.number()) })),
  handler: async (ctx, args) => {
    if (!isValidDate(args.date)) return [];
    const durationMin = await resolveDuration(ctx, args.serviceKey);
    if (durationMin === null) return [];
    const settings = await getSettings(ctx);
    const staff = await candidateStaff(ctx, args.serviceKey, args.staffKey);
    const out: { staffKey: (typeof staff)[number]; slots: number[] }[] = [];
    for (const staffKey of staff) {
      const slots = await slotsFor(ctx, { staffKey, date: args.date, durationMin, settings, nowMs: args.now });
      out.push({ staffKey, slots });
    }
    return out;
  },
});

/** Slot counts (union across staff) for 7 days from `startDate` — to dim empty days in the week strip. */
export const week = query({
  args: {
    startDate: v.string(),
    serviceKey: v.string(),
    staffKey: staffArg,
    now: v.number(),
  },
  returns: v.array(v.object({ date: v.string(), count: v.number() })),
  handler: async (ctx, args) => {
    if (!isValidDate(args.startDate)) return [];
    const durationMin = await resolveDuration(ctx, args.serviceKey);
    const settings = await getSettings(ctx);
    const staff = durationMin === null ? [] : await candidateStaff(ctx, args.serviceKey, args.staffKey);
    const out: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(args.startDate, i);
      const union = new Set<number>();
      if (durationMin !== null) {
        for (const staffKey of staff) {
          const slots = await slotsFor(ctx, { staffKey, date, durationMin, settings, nowMs: args.now });
          for (const s of slots) union.add(s);
        }
      }
      out.push({ date, count: union.size });
    }
    return out;
  },
});
