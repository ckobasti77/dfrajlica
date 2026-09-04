/**
 * Јединствен извор истине за сав садржај сајта.
 * Све на ћирилици. Подаци потичу из docs/brand-brief.md (Instagram, 011info, sredime).
 * Ако нешто мењаш — мењај овде, не у компонентама.
 */

export const site = {
  name: "Д фрајлица",
  nameLatin: "D frajlica",
  tagline: "Козметички салон · Земун",
  description:
    "Козметички салон Д фрајлица у Земуну — маникир, педикир, гел лак, изливање ноктију, ламинација трепавица и обрва, депилација, третмани лица и спреј тен. Заказивање: 069 889 3550.",
  url: "https://dfrajlica.rs",
  locale: "sr-Cyrl-RS",
  address: {
    street: "Бачка 68а",
    city: "Земун",
    postal: "11080",
    country: "Србија",
    full: "Бачка 68а, 11080 Земун, Београд",
    mapsUrl: "https://maps.google.com/?q=Bačka+68a+Zemun+Beograd",
    transport: "Аутобуси 15 и 78",
  },
  phone: {
    /** Главни број — Viber/WhatsApp/Telegram/SMS/позив */
    primary: { display: "069 889 3550", e164: "+381698893550", tel: "tel:+381698893550" },
    landline: { display: "011 316 3738", e164: "+381113163738", tel: "tel:+381113163738" },
  },
  social: {
    instagram: { handle: "@kozmeticki_salon_zemun", url: "https://www.instagram.com/kozmeticki_salon_zemun/" },
    facebook: { handle: "Dfrajlica", url: "https://www.facebook.com/Dfrajlica/" },
  },
  /**
   * ⚠️ Радно време по данима НИЈЕ потврђено (од јануара 2026: „3 дана поподне, 2 дана преподне, свака друга субота").
   * До потврде клијента приказујемо само оквир и „уз заказивање".
   */
  hours: {
    confirmed: false,
    summary: "Радимо уз заказивање, радним данима и сваке друге суботе.",
    note: "Термин потврђујемо поруком или позивом.",
  },
  team: [
    { name: "Бранка", role: "Власница · козметичар", note: "10+ година искуства" },
    { name: "Јана", role: "Маникир и нокти" },
  ],
} as const;

export const nav = [
  { label: "Услуге", href: "#usluge" },
  { label: "Ценовник", href: "#cenovnik" },
  { label: "Галерија", href: "#galerija" },
  { label: "Контакт", href: "#kontakt" },
] as const;

export const hero = {
  eyebrow: "Козметички салон · Земун",
  title: ["Мали рај за", "лепоту"],
  subtitle: "Маникир · Педикир · Трепавице · Депилација · Третмани лица",
  intro:
    "Место где се свака дама осећа као права фрајлица. Више од десет година неге, пажње и лепих ноктију у срцу Земуна.",
  ctaPrimary: "Закажи термин",
  ctaSecondary: "Ценовник",
  image: {
    src: "/images/instagram/hero/ig-029-DIGLJvSoRBp.jpg",
    alt: "Нежни бадемасти нокти у боји коже са шљокицама на розе пешкиру",
  },
} as const;

export const trust = [
  { icon: "heart", text: "10+ година искуства" },
  { icon: "pin", text: "Бачка 68а, Земун" },
  { icon: "card", text: "Картице прихваћене" },
] as const;

export const servicesMeta = {
  title: "Услуге",
} as const;

export type ServiceId = "manikir" | "pedikir" | "trepavice" | "depilacija" | "lice" | "sprej-tan";

export const services: {
  id: ServiceId;
  title: string;
  short: string;
  image: string;
  alt: string;
}[] = [
  {
    id: "manikir",
    title: "Маникир",
    short: "Гел лак, изливање, корекција, dual tipse и poly gel — сваки нокат у боји коју желите.",
    image: "/images/instagram/manikir/ig-043-DDXTCY3oTkj.jpg",
    alt: "Црвени бадемасти нокти",
  },
  {
    id: "pedikir",
    title: "Педикир",
    short: "Естетски, медицински или са гел лаком. Нега за стопала која се и види и осећа.",
    image: "/images/instagram/pedikir/ig-002-CPdbt0CJxsn.jpg",
    alt: "Педикир са црним гел лаком",
  },
  {
    id: "trepavice",
    title: "Трепавице и обрве",
    short: "Ламинација (lash lift), фарбање и корекција — природан поглед који траје недељама.",
    image: "/images/instagram/trepavice_obrve/ig-094-C4ixedMNdTs.jpg",
    alt: "Ламинација трепавица и обрва",
  },
  {
    id: "depilacija",
    title: "Депилација",
    short: "Топли восак, од наусница до целих ногу. Брзо, хигијенски и пажљиво.",
    image: "/images/services/depilacija.jpg",
    alt: "Наношење топлог воска на ногу дрвеном шпатулом",
  },
  {
    id: "lice",
    title: "Третмани лица",
    short: "Хигијенски третман, воћне киселине и микронидлинг — за кожу која блиста.",
    image: "/images/services/tretmani-lica.jpg",
    alt: "Наношење маске на лице четкицом током третмана",
  },
  {
    id: "sprej-tan",
    title: "Спреј тен",
    short: "Бронзани тен без сунца — за свадбу, матуру или прославу. Без оштећења коже.",
    image: "/images/instagram/sprej_tan/ig-031-DHvnnmxoHUF.jpg",
    alt: "Бронзана кожа ногу после спреј тена",
  },
];

export type PriceRow = { name: string; price: number | [number, number] | string; note?: string };
export type PriceGroup = { id: ServiceId | "obrve"; title: string; columns?: [string, string]; rows: PriceRow[]; footnote?: string };

/** Ценовник важи од 1. 2. 2026. Цене у RSD. Маникир: [Јана, Бранка]. */
export const priceList: PriceGroup[] = [
  {
    id: "manikir",
    title: "Маникир",
    columns: ["Јана", "Бранка"],
    rows: [
      { name: "Маникир", price: [1700, 1900] },
      { name: "Гел лак", price: [2500, 2700] },
      { name: "Корекција ноктију S", price: [2500, 2700] },
      { name: "Корекција ноктију M", price: [2700, 2900] },
      { name: "Корекција ноктију L", price: [2900, 3100] },
      { name: "Корекција ноктију XL", price: "— / 3.500" },
      { name: "Изливање S", price: [3200, 3500] },
      { name: "Изливање M", price: [3400, 3700] },
      { name: "Изливање L", price: [3600, 3900] },
      { name: "Изливање XL", price: "— / 4.200" },
      { name: "Корекција туђег рада", price: "+300" },
      { name: "Скидање гела", price: 1500 },
    ],
    footnote: "Уколико се на корекцији излива више од два нокта, наплаћује се цена изливања.",
  },
  {
    id: "pedikir",
    title: "Педикир",
    rows: [
      { name: "Полупедикир", price: 1700 },
      { name: "Естетски педикир", price: 2500 },
      { name: "Педикир са гел лаком", price: 2900 },
      { name: "Медицински педикир", price: 3000 },
    ],
  },
  {
    id: "depilacija",
    title: "Депилација",
    rows: [
      { name: "Наусница", price: 400 },
      { name: "Корекција обрва", price: 500 },
      { name: "Лице", price: 1000 },
      { name: "Пазух", price: 700 },
      { name: "Руке", price: 1000 },
      { name: "Пола руку", price: 700 },
      { name: "Ноге", price: 1300 },
      { name: "Ноге са препонама", price: 1500 },
      { name: "Пола ногу", price: 900 },
      { name: "Пола ногу са препонама", price: 1200 },
      { name: "Плитке препоне", price: 900 },
      { name: "Дубоке препоне", price: 1100 },
      { name: "Интимна регија", price: 1400 },
      { name: "Руке, ноге и интимна регија", price: 3300 },
    ],
  },
  {
    id: "obrve",
    title: "Обрве и трепавице",
    rows: [
      { name: "Фарбање и корекција обрва", price: 600 },
      { name: "Фарбање обрва", price: 300 },
      { name: "Ламинација обрва", price: 2500 },
      { name: "Ламинација трепавица (lash lift)", price: 2500 },
      { name: "Ламинација обрва и трепавица", price: 4000 },
    ],
  },
  {
    id: "lice",
    title: "Третмани лица и тела",
    rows: [
      { name: "Хигијенски третман", price: 2800 },
      { name: "Воћне киселине", price: 1800 },
      { name: "Микронидлинг", price: 5000 },
      { name: "Спреј тен", price: 2000 },
    ],
  },
];

export const priceMeta = {
  title: "Ценовник",
  note: "Цене су у динарима. Важи од 1. 2. 2026.",
  packages: "Пакети услуга — број термина је ограничен, потребно је заказати.",
} as const;

export const gallery = {
  title: "Галерија",
  subtitle: "Радови из салона. За нове — пратите нас на Инстаграму.",
  images: [
    { src: "/images/instagram/manikir/ig-043-DDXTCY3oTkj.jpg", alt: "Црвени бадемасти нокти" },
    { src: "/images/instagram/manikir/ig-046-DDKjjotoKwZ.jpg", alt: "Златни хром нокти" },
    { src: "/images/instagram/manikir/ig-083-C5WcZgAsHRS.jpg", alt: "Лила нокти" },
    { src: "/images/instagram/manikir/ig-014-DUI02LxiN-l.jpg", alt: "Француски маникир" },
    { src: "/images/instagram/manikir/ig-057-C_vblTEoecy.jpg", alt: "Црни нокти са текстуром" },
    { src: "/images/instagram/manikir/ig-099-C3iKH37oi_T.jpg", alt: "Бордо нокти" },
    { src: "/images/instagram/manikir/ig-026-DI_SNQaIU4-.jpg", alt: "Хром нокти уз љиљан" },
    { src: "/images/instagram/manikir/ig-076-C6zH80EsJ8A.jpg", alt: "Розе нокти са срцима" },
    { src: "/images/instagram/manikir/ig-071-C708EaLsYx1.jpg", alt: "Зелени нокти са тачкама" },
    { src: "/images/instagram/manikir/ig-097-C4BZsSesra2.jpg", alt: "Наранџасти нокти" },
    { src: "/images/instagram/manikir/ig-082-C5feGTRMH06.jpg", alt: "Омбре нокти" },
    { src: "/images/instagram/manikir/ig-101-C3VTImmIIQt.jpg", alt: "Француски маникир са срцима" },
  ],
} as const;

export const booking = {
  title: "Закажите свој термин",
  subtitle: "Пишите нам или позовите — потврђујемо термин у најкраћем року.",
  channelsLabel: "Инстаграм · Вибер · WhatsApp · Позив",
  sheet: {
    title: "Заказивање термина",
    intro: "Изаберите услугу и канал — порука је већ написана, само пошаљите.",
    serviceLabel: "Услуга",
    whenLabel: "Кад вам одговара? (необавезно)",
    whenPlaceholder: "нпр. уторак поподне",
    send: "Пошаљи преко",
    message: (service: string, when?: string) =>
      `Здраво! Желим да закажем термин за: ${service}.${when ? ` Одговара ми ${when}.` : ""} Хвала!`,
  },
  channels: [
    { id: "viber", label: "Вибер", build: (msg: string) => `viber://chat?number=%2B381698893550&text=${encodeURIComponent(msg)}` },
    { id: "whatsapp", label: "WhatsApp", build: (msg: string) => `https://wa.me/381698893550?text=${encodeURIComponent(msg)}` },
    { id: "telegram", label: "Телеграм", build: (msg: string) => `https://t.me/+381698893550?text=${encodeURIComponent(msg)}` },
    { id: "instagram", label: "Инстаграм", build: () => `https://ig.me/m/kozmeticki_salon_zemun` },
    { id: "sms", label: "SMS", build: (msg: string) => `sms:+381698893550?body=${encodeURIComponent(msg)}` },
    { id: "call", label: "Позови", build: () => `tel:+381698893550` },
  ],
} as const;

/* ---------- Заказивање v2: услуге са трајањем (термини) ---------- */

export type StaffKey = "branka" | "jana";

export const staffMembers = [
  { key: "branka", name: "Бранка", order: 0 },
  { key: "jana", name: "Јана", order: 1 },
] as const satisfies readonly { key: StaffKey; name: string; order: number }[];

export function staffName(key: StaffKey | "any" | undefined | null): string {
  if (key === "branka") return "Бранка";
  if (key === "jana") return "Јана";
  return "Свеједно";
}

export const bookableGroups = ["Маникир", "Педикир", "Депилација", "Обрве и трепавице", "Лице и тело"] as const;
export type BookableGroup = (typeof bookableGroups)[number];

export type BookableService = {
  key: string;
  title: string;
  group: BookableGroup;
  /** Подразумевано трајање; власница може да га промени у админу (serviceOverrides). */
  durationMin: number;
  /** „од" цена у RSD или null */
  priceFrom: number | null;
  staff: readonly StaffKey[];
};

const BOTH: readonly StaffKey[] = ["branka", "jana"];
const BRANKA: readonly StaffKey[] = ["branka"];

/**
 * Услуге које се могу заказати кроз бирач термина. Претпоставка (види DECISIONS):
 * нокти (Маникир група) раде обе, све остало само Бранка.
 */
export const bookableServices: readonly BookableService[] = [
  { key: "manikir", title: "Маникир", group: "Маникир", durationMin: 60, priceFrom: 1700, staff: BOTH },
  { key: "gel-lak", title: "Гел лак", group: "Маникир", durationMin: 75, priceFrom: 2500, staff: BOTH },
  { key: "korekcija", title: "Корекција ноктију", group: "Маникир", durationMin: 90, priceFrom: 2500, staff: BOTH },
  { key: "izlivanje", title: "Изливање ноктију", group: "Маникир", durationMin: 120, priceFrom: 3200, staff: BOTH },
  { key: "skidanje-gela", title: "Скидање гела", group: "Маникир", durationMin: 30, priceFrom: 1500, staff: BOTH },
  { key: "polupedikir", title: "Полупедикир", group: "Педикир", durationMin: 45, priceFrom: 1700, staff: BRANKA },
  { key: "estetski-pedikir", title: "Естетски педикир", group: "Педикир", durationMin: 60, priceFrom: 2500, staff: BRANKA },
  { key: "pedikir-gel-lak", title: "Педикир са гел лаком", group: "Педикир", durationMin: 75, priceFrom: 2900, staff: BRANKA },
  { key: "medicinski-pedikir", title: "Медицински педикир", group: "Педикир", durationMin: 60, priceFrom: 3000, staff: BRANKA },
  { key: "dep-nausnica-obrve", title: "Депилација (наусница/обрве)", group: "Депилација", durationMin: 15, priceFrom: 400, staff: BRANKA },
  { key: "dep-lice", title: "Депилација лица", group: "Депилација", durationMin: 20, priceFrom: 1000, staff: BRANKA },
  { key: "dep-ruke", title: "Депилација руку", group: "Депилација", durationMin: 30, priceFrom: 1000, staff: BRANKA },
  { key: "dep-noge", title: "Депилација ногу", group: "Депилација", durationMin: 45, priceFrom: 1300, staff: BRANKA },
  { key: "dep-noge-prepone", title: "Депилација ногу са препонама", group: "Депилација", durationMin: 60, priceFrom: 1500, staff: BRANKA },
  { key: "dep-intimna", title: "Депилација интимне регије", group: "Депилација", durationMin: 30, priceFrom: 1400, staff: BRANKA },
  { key: "obrve-farbanje", title: "Фарбање и корекција обрва", group: "Обрве и трепавице", durationMin: 20, priceFrom: 600, staff: BRANKA },
  { key: "laminacija-obrva", title: "Ламинација обрва", group: "Обрве и трепавице", durationMin: 45, priceFrom: 2500, staff: BRANKA },
  { key: "laminacija-trepavica", title: "Ламинација трепавица", group: "Обрве и трепавице", durationMin: 60, priceFrom: 2500, staff: BRANKA },
  { key: "laminacija-obrva-trepavica", title: "Ламинација обрва и трепавица", group: "Обрве и трепавице", durationMin: 90, priceFrom: 4000, staff: BRANKA },
  { key: "higijenski", title: "Хигијенски третман", group: "Лице и тело", durationMin: 60, priceFrom: 2800, staff: BRANKA },
  { key: "vocne-kiseline", title: "Воћне киселине", group: "Лице и тело", durationMin: 45, priceFrom: 1800, staff: BRANKA },
  { key: "mikronidling", title: "Микронидлинг", group: "Лице и тело", durationMin: 60, priceFrom: 5000, staff: BRANKA },
  { key: "sprej-ten", title: "Спреј тен", group: "Лице и тело", durationMin: 30, priceFrom: 2000, staff: BRANKA },
];

export function findBookableService(key: string): BookableService | undefined {
  return bookableServices.find((s) => s.key === key);
}

/** Сви текстови бирача термина (v2). */
export const bookingV2 = {
  steps: ["Услуга", "Дан и време", "Подаци"] as const,
  stepOf: (i: number, n: number) => `Корак ${i} од ${n}`,
  nav: { back: "Назад", next: "Даље", change: "Промени" },
  service: {
    title: "Изаберите услугу",
    staffLabel: "Ко ради?",
    staffAny: "Свеједно",
    minutes: (n: number) => `${n} мин`,
    priceFrom: (p: string) => `од ${p}`,
    required: "Изаберите услугу да бисте наставили.",
  },
  day: {
    title: "Изаберите дан и време",
    thisWeek: "(ове недеље)",
    prevWeek: "Претходна недеља",
    nextWeek: "Следећа недеља",
    weekStrip: "Избор дана",
    today: "данас",
    sundayClosed: "недељом не радимо",
    dayOff: "нерадан дан",
    noSlots: "нема слободних термина",
    loading: "Учитавам слободне термине…",
    empty: "Нема слободних термина — пробајте други дан или нас позовите.",
    prepodne: "Преподне",
    popodne: "Поподне",
    slotsLabel: "Слободни термини",
    ends: (range: string) => `Термин: ${range}`,
    withStaff: (name: string) => `код ${name}`,
    pickHint: "Изаберите време да бисте наставили.",
  },
  details: {
    title: "Ваши подаци",
    name: "Име и презиме",
    namePlaceholder: "нпр. Милица Јовановић",
    phone: "Телефон",
    phonePlaceholder: "069 123 4567",
    note: "Напомена (необавезно)",
    notePlaceholder: "Боја, дужина, посебне жеље…",
    noteCount: (n: number, max: number) => `${n}/${max}`,
    submit: "Пошаљи захтев",
    submitting: "Шаљем…",
    privacy: "Податке користимо само да потврдимо термин. Термин није потврђен док вам се не јавимо.",
  },
  summary: {
    title: "Ваш термин",
    service: "Услуга",
    staff: "Мајстор",
    date: "Дан",
    time: "Време",
    duration: "Трајање",
    price: "Цена",
    empty: "Изаберите услугу — овде ће се приказати детаљи термина.",
    staffAny: "Бранка или Јана",
    priceNote: "коначна цена зависи од обима рада",
  },
  success: {
    title: "Захтев је послат ✓",
    text: (staff: string, phone: string) =>
      `${staff} потврђује термин поруком или позивом на ${phone}. Термин је резервисан до потврде.`,
    quickTitle: "Желите одмах да нам пишете?",
    reset: "Нови захтев",
    message: (parts: { service: string; date: string; time: string; name: string }) =>
      `Здраво! Послала сам захтев за термин преко сајта: ${parts.service}, ${parts.date} у ${parts.time}. ${parts.name}`,
  },
  errors: {
    required: "Ово поље је обавезно.",
    name: "Унесите име и презиме (2–60 знакова).",
    phone: "Унесите исправан број телефона (нпр. 069 889 3550).",
    note: "Напомена може имати највише 300 знакова.",
    taken: "Термин је управо заузет — изаберите други.",
    generic: "Нешто је пошло по злу. Покушајте поново или нас позовите.",
    noBackend: "Онлајн заказивање тренутно није доступно.",
    title: "Захтев није послат",
    hint: "Позовите нас или пишите на Вибер:",
    callUs: "Позови",
  },
} as const;

export const footer = {
  copyright: `© ${new Date().getFullYear()} Д фрајлица`,
  madeWith: "Земун · Србија",
} as const;

/** Кратки UI натписи (aria ознаке, дугмад, помоћни текст). */
export const ui = {
  menuOpen: "Отвори мени",
  menuClose: "Затвори мени",
  mainNav: "Главна навигација",
  mobileNav: "Мени",
  skipToContent: "Пређи на садржај",
  close: "Затвори",
  previous: "Претходна",
  next: "Следећа",
  imageOf: (i: number, n: number) => `Слика ${i} од ${n}`,
  servicesTitle: servicesMeta.title,
  moreOnInstagram: "Још радова на Инстаграму",
  openGallery: "Увећај слику",
  priceColumnService: "Услуга",
  priceColumnPrice: "Цена",
  callUs: "Позовите нас",
  orWrite: "или нам пишите",
  quickMessage: "Здраво! Желим да закажем термин. Хвала!",
  address: "Адреса",
  phones: "Телефони",
  hours: "Радно време",
  social: "Друштвене мреже",
  openInMaps: "Отвори у мапама",
  homeLink: "Д фрајлица — почетна",
} as const;
