import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminKey } from "./lib/admin";
import { DEFAULT_SETTINGS, DEFAULT_WEEK, getSettings, isSeeded } from "./lib/availability";
import { staffMembers } from "../content/site";

/** Seed status + whether the owner still has to set working hours. */
export const status = query({
  args: { key: v.string() },
  returns: v.object({ seeded: v.boolean(), hoursConfirmed: v.boolean() }),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const seeded = await isSeeded(ctx);
    const settings = await getSettings(ctx);
    return { seeded, hoursConfirmed: settings.hoursConfirmed };
  },
});

/**
 * Idempotent seed: staff rows, default weekly hours for both, settings doc.
 * Called automatically on first admin load („Иницијализуј" button also exists).
 */
export const init = mutation({
  args: { key: v.string() },
  returns: v.object({ seededStaff: v.boolean(), seededSchedules: v.boolean(), seededSettings: v.boolean() }),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const result = { seededStaff: false, seededSchedules: false, seededSettings: false };

    if (!(await isSeeded(ctx))) {
      for (const s of staffMembers) {
        await ctx.db.insert("staff", { key: s.key, name: s.name, active: true, order: s.order });
      }
      result.seededStaff = true;
    }

    const anySchedule = await ctx.db.query("schedules").first();
    if (!anySchedule) {
      for (const s of staffMembers) {
        for (let weekday = 0; weekday < 7; weekday++) {
          for (const r of DEFAULT_WEEK[weekday]) {
            await ctx.db.insert("schedules", { staffKey: s.key, weekday, startMin: r.startMin, endMin: r.endMin });
          }
        }
      }
      result.seededSchedules = true;
    }

    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      await ctx.db.insert("settings", { ...DEFAULT_SETTINGS, hoursConfirmed: false });
      result.seededSettings = true;
    }

    return result;
  },
});
