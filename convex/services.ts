import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminKey } from "./lib/admin";
import { serviceByKey } from "./lib/availability";
import { MESSAGES } from "./lib/validate";

/** Public: owner-edited durations, so the picker shows the same duration the engine uses. */
export const overrides = query({
  args: {},
  returns: v.array(v.object({ serviceKey: v.string(), durationMin: v.number() })),
  handler: async (ctx) => {
    const rows = await ctx.db.query("serviceOverrides").take(100);
    return rows.map((r) => ({ serviceKey: r.serviceKey, durationMin: r.durationMin }));
  },
});

export const setDuration = mutation({
  args: { key: v.string(), serviceKey: v.string(), durationMin: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertAdminKey(args.key);
    const service = serviceByKey(args.serviceKey);
    if (!service) throw new ConvexError(MESSAGES.service);
    if (!Number.isInteger(args.durationMin) || args.durationMin < 5 || args.durationMin > 8 * 60) {
      throw new ConvexError(MESSAGES.range);
    }
    const existing = await ctx.db
      .query("serviceOverrides")
      .withIndex("by_serviceKey", (q) => q.eq("serviceKey", args.serviceKey))
      .first();
    if (args.durationMin === service.durationMin) {
      // Back to the default → no override needed.
      if (existing) await ctx.db.delete("serviceOverrides", existing._id);
    } else if (existing) {
      await ctx.db.patch("serviceOverrides", existing._id, { durationMin: args.durationMin });
    } else {
      await ctx.db.insert("serviceOverrides", { serviceKey: args.serviceKey, durationMin: args.durationMin });
    }
    return null;
  },
});
