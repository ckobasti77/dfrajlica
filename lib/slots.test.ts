import { describe, expect, it } from "vitest";
import {
  addDays,
  belgradeNow,
  buildDaySlots,
  diffDays,
  fmt,
  fmtRange,
  groupByPartOfDay,
  isValidDate,
  minStartFor,
  normalizeRanges,
  startOfWeek,
  toMin,
  weekdayOf,
} from "./slots";

const STEP = 30;
const day = (start: string, end: string) => ({ startMin: toMin(start), endMin: toMin(end) });

describe("time helpers", () => {
  it("toMin / fmt round-trip", () => {
    expect(toMin("10:30")).toBe(630);
    expect(toMin("9:05")).toBe(545);
    expect(fmt(630)).toBe("10:30");
    expect(fmt(0)).toBe("00:00");
    expect(fmtRange(630, 705)).toBe("10:30–11:45");
    expect(() => toMin("25:00")).toThrow();
  });

  it("dates are timezone independent", () => {
    expect(weekdayOf("2026-09-06")).toBe(0); // Sunday
    expect(weekdayOf("2026-09-03")).toBe(4); // Thursday
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30"); // DST day in Belgrade
    expect(diffDays("2026-09-03", "2026-10-03")).toBe(30);
    expect(startOfWeek("2026-09-03")).toBe("2026-08-31");
    expect(startOfWeek("2026-09-06")).toBe("2026-08-31"); // Sunday belongs to the Monday-led week
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-02-28")).toBe(true);
  });

  it("belgradeNow uses Europe/Belgrade", () => {
    // 2026-09-03T22:30Z = 00:30 next day in Belgrade (CEST, UTC+2)
    const n = belgradeNow(Date.parse("2026-09-03T22:30:00Z"));
    expect(n.date).toBe("2026-09-04");
    expect(n.minutes).toBe(30);
    expect(n.weekday).toBe(5);
    // Winter: 2026-12-01T23:30Z = 00:30 Dec 2 (CET, UTC+1)
    const w = belgradeNow(Date.parse("2026-12-01T23:30:00Z"));
    expect(w.date).toBe("2026-12-02");
    expect(w.minutes).toBe(30);
  });

  it("normalizeRanges merges and drops empties", () => {
    expect(normalizeRanges([day("14:00", "20:00"), day("10:00", "14:00"), day("12:00", "12:00")])).toEqual([
      day("10:00", "20:00"),
    ]);
  });
});

describe("buildDaySlots", () => {
  it("fits inside range: 60-min service, 10:00–20:00", () => {
    const slots = buildDaySlots({ workRanges: [day("10:00", "20:00")], busyRanges: [], durationMin: 60, stepMin: STEP });
    expect(slots[0]).toBe(toMin("10:00"));
    expect(slots[slots.length - 1]).toBe(toMin("19:00")); // 19:00–20:00 fits, 19:30 does not
    expect(slots).toHaveLength(19);
  });

  it("120-min service near closing", () => {
    const slots = buildDaySlots({ workRanges: [day("10:00", "16:00")], busyRanges: [], durationMin: 120, stepMin: STEP });
    expect(slots.map(fmt)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("overlap at edges: touching a busy range is allowed, intersecting is not", () => {
    const busy = [day("12:00", "13:00")];
    const slots = buildDaySlots({ workRanges: [day("10:00", "15:00")], busyRanges: busy, durationMin: 60, stepMin: STEP });
    const s = slots.map(fmt);
    expect(s).toContain("11:00"); // 11:00–12:00 touches
    expect(s).not.toContain("11:30"); // 11:30–12:30 intersects
    expect(s).not.toContain("12:00");
    expect(s).not.toContain("12:30"); // 12:30–13:30 intersects
    expect(s).toContain("13:00"); // 13:00–14:00 touches
  });

  it("block in the middle of the day", () => {
    const slots = buildDaySlots({
      workRanges: [day("10:00", "20:00")],
      busyRanges: [day("13:00", "14:00")],
      durationMin: 90,
      stepMin: STEP,
    });
    const s = slots.map(fmt);
    expect(s).toContain("11:30"); // 11:30–13:00
    expect(s).not.toContain("12:00");
    expect(s).not.toContain("12:30");
    expect(s).not.toContain("13:00");
    expect(s).not.toContain("13:30");
    expect(s).toContain("14:00");
  });

  it("split shifts: slot may not span the gap", () => {
    const slots = buildDaySlots({
      workRanges: [day("09:00", "12:00"), day("15:00", "19:00")],
      busyRanges: [],
      durationMin: 60,
      stepMin: STEP,
    });
    const s = slots.map(fmt);
    expect(s).toContain("11:00");
    expect(s).not.toContain("11:30");
    expect(s).not.toContain("12:00");
    expect(s).not.toContain("14:30");
    expect(s).toContain("15:00");
    expect(s).toContain("18:00");
    expect(s).not.toContain("18:30");
  });

  it("lead time: today vs tomorrow", () => {
    const now = { date: "2026-09-03", minutes: toMin("11:20") };
    const lead = 120;
    // Today: earliest start is 13:20 → first slot on the grid is 13:30.
    const todayMin = minStartFor(now, "2026-09-03", lead);
    expect(todayMin).toBe(toMin("13:20"));
    const today = buildDaySlots({
      workRanges: [day("10:00", "20:00")],
      busyRanges: [],
      durationMin: 60,
      stepMin: STEP,
      minStartMin: todayMin ?? 0,
    });
    expect(fmt(today[0])).toBe("13:30");
    // Tomorrow: no lead time.
    const tomorrowMin = minStartFor(now, "2026-09-04", lead);
    expect(tomorrowMin).toBe(0);
    const tomorrow = buildDaySlots({
      workRanges: [day("10:00", "20:00")],
      busyRanges: [],
      durationMin: 60,
      stepMin: STEP,
      minStartMin: tomorrowMin ?? 0,
    });
    expect(fmt(tomorrow[0])).toBe("10:00");
    // Yesterday: nothing.
    expect(minStartFor(now, "2026-09-02", lead)).toBeNull();
  });

  it("override wins over weekly (caller resolves; engine just uses the ranges given)", () => {
    const weekly = [day("10:00", "20:00")];
    const override = [day("12:00", "15:00")];
    const resolved = override.length > 0 ? override : weekly;
    const slots = buildDaySlots({ workRanges: resolved, busyRanges: [], durationMin: 60, stepMin: STEP });
    expect(slots.map(fmt)).toEqual(["12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("empty work → no slots; zero duration → no slots", () => {
    expect(buildDaySlots({ workRanges: [], busyRanges: [], durationMin: 60, stepMin: STEP })).toEqual([]);
    expect(buildDaySlots({ workRanges: [day("10:00", "20:00")], busyRanges: [], durationMin: 0, stepMin: STEP })).toEqual([]);
  });

  it("odd start aligns to the grid", () => {
    const slots = buildDaySlots({ workRanges: [day("10:10", "12:00")], busyRanges: [], durationMin: 30, stepMin: STEP });
    expect(slots.map(fmt)).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("groups by part of day at 14:00", () => {
    const g = groupByPartOfDay([toMin("10:00"), toMin("13:30"), toMin("14:00"), toMin("18:00")]);
    expect(g.prepodne.map(fmt)).toEqual(["10:00", "13:30"]);
    expect(g.popodne.map(fmt)).toEqual(["14:00", "18:00"]);
  });
});
