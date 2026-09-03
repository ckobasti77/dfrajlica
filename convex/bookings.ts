import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { staffValidator, statusValidator, timeSlotValidator } from "./schema";

/** Mirrors ServiceId in content/site.ts (Convex functions cannot import app code). */
const ALLOWED_SERVICE_IDS = ["manikir", "pedikir", "trepavice", "depilacija", "lice", "sprej-tan"] as const;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const MESSAGES = {
  name: "Унесите име и презиме (2–60 знакова).",
  phone: "Унесите исправан број телефона (нпр. 069 889 3550).",
  dateFormat: "Унесите исправан датум.",
  datePast: "Изаберите данашњи или неки наредни датум.",
  sunday: "Недељом не радимо — изаберите други дан.",
  service: "Изаберите услугу.",
  note: "Напомена може имати највише 300 знакова.",
  rateLimit: "Превише захтева. Позовите нас на 069 889 3550.",
  badKey: "Неисправан кључ",
} as const;

function normalizePhone(phone: string): string {
  return phone.replace(/[\s/-]/g, "");
}

/** Today's date as YYYY-MM-DD in Europe/Belgrade. */
export function belgradeToday(now: number = Date.now()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date(now));
}

function isSunday(date: string): boolean {
  return new Date(`${date}T12:00:00`).getDay() === 0;
}

function assertAdminKey(key: string): void {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    throw new ConvexError(MESSAGES.badKey);
  }
}

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
    /** Honeypot — real users never fill it. */
    website: v.optional(v.string()),
  },
  returns: v.object({ id: v.union(v.id("bookings"), v.null()) }),
  handler: async (ctx: MutationCtx, args) => {
    // Honeypot: pretend success without writing anything so bots are not tipped off.
    if (args.website && args.website.trim() !== "") {
      return { id: null };
    }

    const name = args.name.trim();
    if (name.length < 2 || name.length > 60) throw new ConvexError(MESSAGES.name);

    const phone = normalizePhone(args.phone);
    if (!/^(\+381|0)\d{7,11}$/.test(phone)) throw new ConvexError(MESSAGES.phone);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date) || Number.isNaN(new Date(`${args.date}T12:00:00`).getTime())) {
      throw new ConvexError(MESSAGES.dateFormat);
    }
    const now = Date.now();
    if (args.date < belgradeToday(now)) throw new ConvexError(MESSAGES.datePast);
    if (isSunday(args.date)) throw new ConvexError(MESSAGES.sunday);

    if (!(ALLOWED_SERVICE_IDS as readonly string[]).includes(args.serviceId)) {
      throw new ConvexError(MESSAGES.service);
    }
    const serviceTitle = args.serviceTitle.trim().slice(0, 80);

    const note = args.note?.trim();
    if (note && note.length > 300) throw new ConvexError(MESSAGES.note);

    // Rate limit: max 3 requests per phone per hour.
    const recent = await ctx.db
      .query("bookings")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .filter((q) => q.gt(q.field("createdAt"), now - RATE_LIMIT_WINDOW_MS))
      .take(RATE_LIMIT_MAX);
    if (recent.length >= RATE_LIMIT_MAX) throw new ConvexError(MESSAGES.rateLimit);

    const id = await ctx.db.insert("bookings", {
      name,
      phone,
      serviceId: args.serviceId,
      serviceTitle,
      staff: args.serviceId === "manikir" ? args.staff : undefined,
      date: args.date,
      timeSlot: args.timeSlot,
      note: note ? note : undefined,
      status: "nov",
      createdAt: now,
      source: "web",
    });
    return { id };
  },
});

export const list = query({
  args: { key: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    assertAdminKey(args.key);
    return await ctx.db.query("bookings").withIndex("by_createdAt").order("desc").take(200);
  },
});

export const setStatus = mutation({
  args: { key: v.string(), id: v.id("bookings"), status: statusValidator },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    assertAdminKey(args.key);
    await ctx.db.patch("bookings", args.id, { status: args.status });
    return null;
  },
});
