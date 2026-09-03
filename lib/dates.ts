/**
 * Cyrillic date formatting for `YYYY-MM-DD` strings (Europe/Belgrade is implied —
 * we format a fixed noon UTC instant so the calendar day never shifts).
 */
const LOCALE = "sr-Cyrl-RS";

function noon(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

const dayLong = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" });
const weekdayLong = new Intl.DateTimeFormat(LOCALE, { weekday: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", timeZone: "UTC" });
const numeric = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** "четвртак, 3. септембар" */
export function formatDayLong(date: string): string {
  return dayLong.format(noon(date));
}

/** "3. септембар" */
export function formatDayMonth(date: string): string {
  return dayMonth.format(noon(date));
}

/** "септембар 2026." */
export function formatMonthYear(date: string): string {
  return monthYear.format(noon(date));
}

/** "ЧЕТ" */
export function formatWeekdayShort(date: string): string {
  return weekdayShort.format(noon(date)).replace(/\.$/, "").toUpperCase();
}

/** "четвртак" */
export function formatWeekdayLong(date: string): string {
  return weekdayLong.format(noon(date));
}

/** "03" */
export function formatDayNumber(date: string): string {
  return date.slice(8, 10);
}

/** "03.09.2026." */
export function formatNumeric(date: string): string {
  return numeric.format(noon(date));
}

/** Weekday names Monday-first, for the admin hours editor: ["понедељак", …, "недеља"] */
export const WEEKDAYS_MON_FIRST: readonly { weekday: number; label: string }[] = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
  weekday,
  // 2026-09-06 is a Sunday; walk forward so each weekday index gets a real date.
  label: formatWeekdayLong(`2026-09-${String(6 + weekday).padStart(2, "0")}`),
}));
