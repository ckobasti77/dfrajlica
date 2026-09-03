/** Текстови админ панела — ћирилица. (Текстови бирача термина су у content/site.ts → bookingV2.) */

export const statusOptions = [
  { value: "nov", label: "На чекању" },
  { value: "potvrdjen", label: "Потврђен" },
  { value: "otkazan", label: "Отказан" },
  { value: "odbijen", label: "Одбијен" },
] as const;
export type Status = (typeof statusOptions)[number]["value"];

export function statusLabel(status: Status): string {
  return statusOptions.find((o) => o.value === status)?.label ?? status;
}

/** YYYY-MM-DD → dd.MM.yyyy */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export const adminStrings = {
  title: "Панел — Д фрајлица",
  heading: "Панел",
  keyLabel: "Кључ",
  keyPlaceholder: "Унесите админ кључ",
  keySubmit: "Отвори панел",
  keyClear: "Промени кључ",
  badKey: "Неисправан кључ",
  loading: "Учитавам…",
  saving: "Чувам…",
  saved: "Сачувано ✓",
  error: "Грешка",
  close: "Затвори",
  cancel: "Одустани",
  save: "Сачувај",
  remove: "Уклони",
  tabs: {
    requests: "Захтеви",
    calendar: "Календар",
    hours: "Радно време",
    services: "Услуге",
  },
  banner: {
    title: "Подесите радно време",
    text: "Тренутно важе подразумевани термини: пон–пет 10:00–20:00, суб 10:00–16:00, недеља нерадна. Проверите и измените у картици „Радно време“ — уносе се за Бранку и Јану посебно.",
    go: "Отвори радно време",
    init: "Иницијализуј",
  },
  requests: {
    empty: "Нема нових захтева. Сви термини су у календару.",
    count: (n: number) => (n === 1 ? "1 захтев на чекању" : n >= 2 && n <= 4 ? `${n} захтева на чекању` : `${n} захтева на чекању`),
    confirm: "Потврди",
    decline: "Одбиј",
    received: "примљено",
    note: "Напомена",
    source: { web: "сајт", admin: "ручно" },
  },
  calendar: {
    today: "Данас",
    prev: "Претходни дан",
    next: "Следећи дан",
    date: "Датум",
    closed: "нерадно",
    off: "слободан дан",
    custom: "посебно радно време",
    pending: "на чекању",
    confirmed: "потврђен",
    block: "пауза",
    legend: { confirmed: "Потврђен", pending: "На чекању", block: "Пауза / блокирано", closed: "Ван радног времена" },
    cellActions: "Радње",
    addBooking: "Додај термин",
    addBlock: "Блокирај",
    confirm: "Потврди",
    decline: "Одбиј",
    cancel: "Откажи термин",
    removeBlock: "Уклони паузу",
    call: "Позови",
    manual: {
      title: "Додај термин (ручно)",
      name: "Име и презиме",
      phone: "Телефон (необавезно)",
      service: "Услуга",
      staff: "Мајстор",
      start: "Почетак",
      duration: "Трајање (мин)",
      note: "Напомена",
      save: "Сачувај као потврђен",
    },
    blockForm: {
      title: "Блокирај време",
      staff: "Мајстор",
      from: "Од",
      to: "До",
      reason: "Разлог (необавезно)",
      reasonPlaceholder: "пауза, одмор, приватно…",
      save: "Блокирај",
    },
  },
  hours: {
    title: "Недељно радно време",
    intro: "За сваки дан унесите један или више опсега (нпр. 10:00–14:00 и 16:00–20:00). Дан без опсега је нерадан.",
    dayOff: "Нерадан дан",
    addRange: "+ Додај опсег",
    from: "од",
    to: "до",
    overridesTitle: "Изузеци по датуму",
    overridesIntro: "Радна субота, слободан дан или посебно радно време за конкретан датум. Изузетак има предност над недељним распоредом.",
    addWorkingSaturday: "+ Радна субота",
    addDayOff: "+ Слободан дан",
    addCustom: "+ Посебно време",
    noOverrides: "Нема изузетака у наредних 60 дана.",
    kindOff: "слободан дан",
    kindCustom: "ради",
    note: "Напомена",
    settingsTitle: "Подешавања термина",
    step: "Корак термина (мин)",
    lead: "Најмања најава (мин)",
    horizon: "Колико дана унапред",
    hold: "Захтев истиче после (сати)",
    saveSettings: "Сачувај подешавања",
  },
  services: {
    title: "Трајање услуга",
    intro: "Трајање одређује које термине клијенткиње виде. Измена важи одмах.",
    service: "Услуга",
    duration: "Трајање (мин)",
    priceFrom: "Цена од",
    defaultOf: (n: number) => `подразумевано ${n} мин`,
    reset: "Врати подразумевано",
  },
} as const;
