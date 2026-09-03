/** Сви текстови форме за заказивање и админ панела — ћирилица. */

export const staffOptions = [
  { value: "jana", label: "Јана" },
  { value: "branka", label: "Бранка" },
  { value: "any", label: "Свеједно" },
] as const;
export type Staff = (typeof staffOptions)[number]["value"];

export const timeSlotOptions = [
  { value: "prepodne", label: "Преподне" },
  { value: "popodne", label: "Поподне" },
  { value: "any", label: "Свеједно" },
] as const;
export type TimeSlot = (typeof timeSlotOptions)[number]["value"];

export const statusOptions = [
  { value: "nov", label: "Нов" },
  { value: "potvrdjen", label: "Потврђен" },
  { value: "otkazan", label: "Отказан" },
] as const;
export type Status = (typeof statusOptions)[number]["value"];

export function staffLabel(staff: Staff | undefined): string {
  return staffOptions.find((o) => o.value === staff)?.label ?? "—";
}
export function timeSlotLabel(slot: TimeSlot): string {
  return timeSlotOptions.find((o) => o.value === slot)?.label ?? slot;
}
export function statusLabel(status: Status): string {
  return statusOptions.find((o) => o.value === status)?.label ?? status;
}

/** YYYY-MM-DD → dd.MM.yyyy */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export const formStrings = {
  legend: "Захтев за термин",
  name: "Име и презиме",
  namePlaceholder: "нпр. Милица Јовановић",
  phone: "Телефон",
  phonePlaceholder: "069 123 4567",
  service: "Услуга",
  servicePlaceholder: "Изаберите услугу",
  staff: "Мајстор",
  date: "Датум",
  time: "Време",
  note: "Напомена (необавезно)",
  notePlaceholder: "Боја, дужина, посебне жеље…",
  noteCount: (n: number, max: number) => `${n}/${max}`,
  submit: "Пошаљи захтев",
  submitting: "Шаљем…",
  privacy: "Податке користимо само да потврдимо термин.",
  errors: {
    required: "Ово поље је обавезно.",
    name: "Унесите име и презиме (2–60 знакова).",
    phone: "Унесите исправан број телефона (нпр. 069 889 3550).",
    service: "Изаберите услугу.",
    date: "Унесите исправан датум.",
    datePast: "Изаберите неки наредни датум.",
    sunday: "Недељом не радимо — изаберите други дан.",
    note: "Напомена може имати највише 300 знакова.",
    generic: "Нешто је пошло по злу.",
    noBackend: "Слање тренутно није доступно.",
  },
  errorTitle: "Захтев није послат",
  errorHint: "Позовите нас или пишите на Вибер:",
  callUs: "Позови",
  success: {
    title: "Захтев је примљен ✓",
    text: (phone: string) => `Потврђујемо поруком или позивом на ${phone}.`,
    quickTitle: "Желите одмах да нам пишете?",
    reset: "Нови захтев",
  },
  summary: (parts: { serviceTitle: string; staff?: string; date: string; timeSlot: string; name: string }) =>
    `Здраво! Желим термин: ${parts.serviceTitle}${parts.staff ? `, мајстор ${parts.staff}` : ""}, ${parts.date}, ${parts.timeSlot}. ${parts.name}`,
} as const;

export const adminStrings = {
  title: "Панел — Д фрајлица",
  heading: "Захтеви за термине",
  count: (n: number) => (n === 1 ? "1 захтев" : n >= 2 && n <= 4 ? `${n} захтева` : `${n} захтева`),
  keyLabel: "Кључ",
  keyPlaceholder: "Унесите админ кључ",
  keySubmit: "Отвори панел",
  keyClear: "Промени кључ",
  badKey: "Неисправан кључ",
  loading: "Учитавам…",
  empty: "Још нема захтева.",
  columns: {
    date: "Датум",
    time: "Време",
    service: "Услуга",
    staff: "Мајстор",
    name: "Име",
    phone: "Телефон",
    note: "Напомена",
    status: "Статус",
    actions: "Акције",
  },
  confirm: "Потврди",
  cancel: "Откажи",
  received: "Примљено",
} as const;
