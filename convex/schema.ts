import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/* ---------- Legacy (v1) validators — kept so old rows stay valid ---------- */
export const staffValidator = v.union(v.literal("jana"), v.literal("branka"), v.literal("any"));
export const timeSlotValidator = v.union(v.literal("prepodne"), v.literal("popodne"), v.literal("any"));

/* ---------- v2 ---------- */
export const staffKeyValidator = v.union(v.literal("branka"), v.literal("jana"));
export const statusValidator = v.union(
  v.literal("nov"),
  v.literal("potvrdjen"),
  v.literal("otkazan"),
  v.literal("odbijen"),
);
export const sourceValidator = v.union(v.literal("web"), v.literal("admin"));
export const overrideKindValidator = v.union(v.literal("off"), v.literal("custom"));

export const rangeValidator = v.object({ startMin: v.number(), endMin: v.number() });

export default defineSchema({
  staff: defineTable({
    key: staffKeyValidator,
    name: v.string(),
    active: v.boolean(),
    order: v.number(),
  }).index("by_key", ["key"]),

  /** Weekly working hours. Several rows per weekday = split shift. */
  schedules: defineTable({
    staffKey: staffKeyValidator,
    /** 0 = Sunday … 6 = Saturday */
    weekday: v.number(),
    startMin: v.number(),
    endMin: v.number(),
  }).index("by_staff_weekday", ["staffKey", "weekday"]),

  /** Per-date exception: a day off, or custom hours (e.g. a working Saturday). Wins over `schedules`. */
  scheduleOverrides: defineTable({
    staffKey: staffKeyValidator,
    /** YYYY-MM-DD */
    date: v.string(),
    kind: overrideKindValidator,
    startMin: v.optional(v.number()),
    endMin: v.optional(v.number()),
    note: v.optional(v.string()),
  })
    .index("by_staff_date", ["staffKey", "date"])
    .index("by_date", ["date"]),

  /** Breaks / holidays inside a working day. */
  blocks: defineTable({
    staffKey: staffKeyValidator,
    date: v.string(),
    startMin: v.number(),
    endMin: v.number(),
    reason: v.optional(v.string()),
  }).index("by_staff_date", ["staffKey", "date"]),

  bookings: defineTable({
    name: v.string(),
    phone: v.string(),
    serviceTitle: v.string(),
    /** YYYY-MM-DD */
    date: v.string(),
    note: v.optional(v.string()),
    status: statusValidator,
    createdAt: v.number(),
    source: sourceValidator,
    // ---- v2 (optional so legacy rows stay valid until migrated) ----
    serviceKey: v.optional(v.string()),
    durationMin: v.optional(v.number()),
    staffKey: v.optional(staffKeyValidator),
    startMin: v.optional(v.number()),
    endMin: v.optional(v.number()),
    decidedAt: v.optional(v.number()),
    // ---- legacy v1 ----
    serviceId: v.optional(v.string()),
    staff: v.optional(staffValidator),
    timeSlot: v.optional(timeSlotValidator),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_phone", ["phone"])
    .index("by_staff_date", ["staffKey", "date"])
    .index("by_date", ["date"]),

  /** Single document. */
  settings: defineTable({
    slotStepMin: v.number(),
    leadTimeMin: v.number(),
    horizonDays: v.number(),
    holdHours: v.number(),
    /** Set once the owner saves working hours in the admin (hides the „Подесите радно време" banner). */
    hoursConfirmed: v.optional(v.boolean()),
  }),

  /** Owner-edited service durations; default comes from content/site.ts. */
  serviceOverrides: defineTable({
    serviceKey: v.string(),
    durationMin: v.number(),
  }).index("by_serviceKey", ["serviceKey"]),
});
