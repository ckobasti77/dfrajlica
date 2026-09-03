import { ConvexError } from "convex/values";

export const MESSAGES = {
  name: "Унесите име и презиме (2–60 знакова).",
  phone: "Унесите исправан број телефона (нпр. 069 889 3550).",
  dateFormat: "Унесите исправан датум.",
  datePast: "Изаберите данашњи или неки наредни датум.",
  horizon: "Термине примамо највише 30 дана унапред.",
  sunday: "Недељом не радимо — изаберите други дан.",
  service: "Изаберите услугу.",
  staff: "Изабрани мајстор не ради ову услугу.",
  note: "Напомена може имати највише 300 знакова.",
  rateLimit: "Превише захтева. Позовите нас на 069 889 3550.",
  taken: "Термин је управо заузет — изаберите други.",
  overlap: "Термин се преклапа са постојећим термином или паузом.",
  range: "Неисправан временски опсег.",
  transition: "Промена статуса није дозвољена.",
  notFound: "Термин није пронађен.",
} as const;

export const NOTE_MAX = 300;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const RATE_LIMIT_MAX = 3;

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s/()-]/g, "");
}

export function isValidPhone(normalized: string): boolean {
  return /^(\+381|0)\d{7,11}$/.test(normalized);
}

export function validateName(raw: string): string {
  const name = raw.trim();
  if (name.length < 2 || name.length > 60) throw new ConvexError(MESSAGES.name);
  return name;
}

export function validatePhone(raw: string): string {
  const phone = normalizePhone(raw);
  if (!isValidPhone(phone)) throw new ConvexError(MESSAGES.phone);
  return phone;
}

export function validateNote(raw: string | undefined): string | undefined {
  const note = raw?.trim();
  if (!note) return undefined;
  if (note.length > NOTE_MAX) throw new ConvexError(MESSAGES.note);
  return note;
}

/** Ranges must be inside the day, start < end, sorted and non-overlapping. */
export function validateRanges(ranges: readonly { startMin: number; endMin: number }[]): void {
  let lastEnd = -1;
  const sorted = [...ranges].sort((a, b) => a.startMin - b.startMin);
  for (const r of sorted) {
    if (!Number.isInteger(r.startMin) || !Number.isInteger(r.endMin)) throw new ConvexError(MESSAGES.range);
    if (r.startMin < 0 || r.endMin > 24 * 60 || r.startMin >= r.endMin) throw new ConvexError(MESSAGES.range);
    if (r.startMin < lastEnd) throw new ConvexError(MESSAGES.range);
    lastEnd = r.endMin;
  }
}
