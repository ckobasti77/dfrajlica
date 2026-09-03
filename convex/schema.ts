import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const staffValidator = v.union(v.literal("jana"), v.literal("branka"), v.literal("any"));
export const timeSlotValidator = v.union(v.literal("prepodne"), v.literal("popodne"), v.literal("any"));
export const statusValidator = v.union(v.literal("nov"), v.literal("potvrdjen"), v.literal("otkazan"));

export default defineSchema({
  bookings: defineTable({
    name: v.string(),
    phone: v.string(),
    serviceId: v.string(),
    serviceTitle: v.string(),
    staff: v.optional(staffValidator),
    /** YYYY-MM-DD */
    date: v.string(),
    timeSlot: timeSlotValidator,
    note: v.optional(v.string()),
    status: statusValidator,
    createdAt: v.number(),
    source: v.literal("web"),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_phone", ["phone"]),
});
