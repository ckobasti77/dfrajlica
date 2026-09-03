import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

/**
 * One-off: give legacy v1 bookings (date + timeSlot) a staffKey / startMin / endMin
 * so they show in the v2 admin calendar. Best effort: преподне → 10:00, поподне → 14:00,
 * „свеједно" → 10:00; 60 minutes; staff „jana" stays, anything else → Бранка.
 *
 * Run once: `npx convex run migrations:convertLegacyBookings` (add `--prod` for production).
 * Idempotent — rows that already have `startMin` are skipped.
 */
export const convertLegacyBookings = internalMutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({ converted: v.number(), done: v.boolean() }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("bookings")
      .withIndex("by_createdAt")
      .paginate({ numItems: 100, cursor: args.cursor ?? null });

    let converted = 0;
    for (const b of page.page) {
      if (b.startMin !== undefined && b.staffKey !== undefined) continue;
      const startMin = b.startMin ?? (b.timeSlot === "popodne" ? 14 * 60 : 10 * 60);
      const durationMin = b.durationMin ?? 60;
      await ctx.db.patch("bookings", b._id, {
        serviceKey: b.serviceKey ?? b.serviceId ?? "manikir",
        durationMin,
        staffKey: b.staffKey ?? (b.staff === "jana" ? "jana" : "branka"),
        startMin,
        endMin: b.endMin ?? startMin + durationMin,
      });
      converted++;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.convertLegacyBookings, { cursor: page.continueCursor });
    }
    return { converted, done: page.isDone };
  },
});
