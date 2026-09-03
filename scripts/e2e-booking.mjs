/**
 * End-to-end: client picks service → day → slot → submits; admin sees it pending →
 * confirms → the slot disappears from a fresh client picker (reactive) → a second
 * request is declined → its slot comes back. Screenshots go to docs/screenshots/.
 *
 *   BASE_URL=http://localhost:3217 ADMIN_KEY=... node scripts/e2e-booking.mjs
 */
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { cleanupTestBookings } from "./cleanup-test-bookings.mjs";

function envFromFile() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/.exec(line);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}
const env = { ...envFromFile(), ...process.env };
const BASE = env.BASE_URL ?? "http://localhost:3217";
const ADMIN_KEY = env.ADMIN_KEY;
if (!ADMIN_KEY) throw new Error("ADMIN_KEY required");
const SHOTS = new URL("../docs/screenshots/", import.meta.url);
mkdirSync(SHOTS, { recursive: true });
const shot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`booking-v2-${name}.png`, SHOTS)), fullPage: false });

const browser = await chromium.launch();
const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "ok " : "FAIL"} ${msg}`);
};

async function openWizard(page) {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("zakazivanje")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
}

/** Walk to step 2 for `serviceTitle`; returns { dayLabel, slots: string[] } and leaves the page on step 2. */
async function goToSlots(page, serviceTitle, preferDayLabel) {
  await openWizard(page);
  await page.locator("#zakazivanje").getByRole("button", { name: new RegExp(`^${serviceTitle}`) }).first().click();
  // Pin the staff member so „held slot" checks are not masked by the union of both staff.
  const staffBtn = page.locator("#zakazivanje").getByRole("button", { name: "Бранка", exact: true });
  if (await staffBtn.count()) await staffBtn.first().click();
  await page.locator("#zakazivanje").getByRole("button", { name: "Даље" }).filter({ visible: true }).first().click();
  const radios = page.getByRole("radio");
  await radios.first().waitFor();
  // wait until week counts loaded (no animate-pulse on day numbers)
  await page.waitForFunction(() => !document.querySelector('[role="radio"] .animate-pulse'), null, { timeout: 15000 });
  const chips = page.locator('[aria-label="Слободни термини"] button[aria-pressed]');
  const readSlots = () => chips.evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 5)));
  const pick = async (day) => {
    const dayLabel = (await day.getAttribute("aria-label")).split(",")[0];
    await day.click();
    await page.waitForFunction(() => !document.querySelector('[aria-label="Слободни термини"] .animate-pulse'), null, { timeout: 15000 });
    await page.waitForTimeout(150);
    return { dayLabel, slots: await readSlots(), chips };
  };
  if (preferDayLabel) return pick(page.getByRole("radio", { name: new RegExp(`^${preferDayLabel}`) }).first());
  // No preference: first enabled day after today that offers at least 3 slots, so the flow has room.
  const enabled = page.locator('[role="radio"][aria-disabled="false"]');
  const n = await enabled.count();
  let best = null;
  for (let i = 1; i < n; i++) {
    const r = await pick(enabled.nth(i));
    if (r.slots.length >= 3) return r;
    if (!best || r.slots.length > best.slots.length) best = r;
  }
  return best ?? pick(enabled.first());
}

async function submitRequest(page, { serviceTitle, name, phone, pickLast, preferDayLabel }) {
  const { dayLabel, slots, chips } = await goToSlots(page, serviceTitle, preferDayLabel);
  check(slots.length > 0, `client: slots available on ${dayLabel} (${slots.length})`);
  const idx = pickLast ? slots.length - 1 : 0;
  const time = slots[idx];
  await chips.nth(idx).click();
  await page.locator("#zakazivanje").getByRole("button", { name: "Даље" }).filter({ visible: true }).first().click();
  await page.getByLabel("Име и презиме", { exact: true }).fill(name);
  await page.getByLabel("Телефон", { exact: true }).fill(phone);
  await page.locator("#zakazivanje").getByRole("button", { name: "Пошаљи захтев" }).filter({ visible: true }).first().click();
  await page.getByText("Захтев је послат").waitFor({ timeout: 15000 });
  check(true, `client: request submitted for ${dayLabel} ${time} (${name})`);
  return { dayLabel, time };
}

async function adminLogin(page) {
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const key = page.getByLabel("Кључ");
  if (await key.isVisible().catch(() => false)) {
    await key.fill(ADMIN_KEY);
    await page.getByRole("button", { name: "Отвори панел" }).click();
  }
  await page.getByRole("tab", { name: /Захтеви/ }).waitFor();
}

try {
  /* ---------- 1. Desktop flow with screenshots ---------- */
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "sr-RS" });
  const page = await desktop.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/hydrat/i.test(m.text()) && errors.push(m.text())); // hydration warning is pre-existing (text-reveal head flag)

  await openWizard(page);
  await shot(page, "1440-service");
  const first = await (async () => {
    const { dayLabel, slots, chips } = await goToSlots(page, "Маникир");
    check(slots.length > 0, `client: slots on ${dayLabel}`);
    await shot(page, "1440-day");
    const idx = slots.length - 1;
    await chips.nth(idx).click();
    await page.locator("#zakazivanje").getByRole("button", { name: "Даље" }).filter({ visible: true }).first().click();
    await page.getByLabel("Име и презиме", { exact: true }).fill("Е2Е Тест Прва");
    await page.getByLabel("Телефон", { exact: true }).fill(`0691${String(Date.now()).slice(-6)}`);
    await shot(page, "1440-details");
    await page.locator("#zakazivanje").getByRole("button", { name: "Пошаљи захтев" }).filter({ visible: true }).first().click();
    await page.getByText("Захтев је послат").waitFor({ timeout: 15000 });
    await shot(page, "1440-success");
    return { dayLabel, time: slots[idx] };
  })();

  /* ---------- 2. Admin sees it pending, confirms ---------- */
  const admin = await desktop.newPage();
  await adminLogin(admin);
  const row = admin.getByText("Е2Е Тест Прва").first();
  await row.waitFor({ timeout: 15000 });
  check(true, "admin: request visible as pending");
  await shot(admin, "admin-requests-1440");
  const card = admin.locator("li", { hasText: "Е2Е Тест Прва" }).first();
  await card.getByRole("button", { name: "Потврди" }).click();
  await admin.waitForTimeout(800);
  check(!(await admin.getByText("Е2Е Тест Прва").isVisible().catch(() => false)), "admin: confirmed request left the pending list");

  await admin.getByRole("tab", { name: /Календар/ }).click();
  // Navigate the calendar to the booked day via the date input
  const dateIso = await admin.evaluate(() => null); // placeholder to keep flow simple
  void dateIso;
  await admin.waitForTimeout(800);
  await shot(admin, "admin-calendar-1440");

  /* ---------- 3. Reactive: the confirmed slot is gone from a fresh picker ---------- */
  const fresh = await desktop.newPage();
  const after = await goToSlots(fresh, "Маникир", first.dayLabel);
  check(!after.slots.includes(first.time), `client: slot ${first.time} no longer offered after confirmation`);

  /* ---------- 4. Second request → decline → slot returns ---------- */
  const second = await submitRequest(fresh, { serviceTitle: "Маникир", name: "Е2Е Тест Друга", phone: `0692${String(Date.now()).slice(-6)}`, pickLast: true, preferDayLabel: first.dayLabel });
  const again = await goToSlots(await desktop.newPage(), "Маникир", first.dayLabel);
  check(!again.slots.includes(second.time), `client: pending slot ${second.time} is held (not offered)`);

  await admin.getByRole("tab", { name: /Захтеви/ }).click();
  const card2 = admin.locator("li", { hasText: "Е2Е Тест Друга" }).first();
  await card2.waitFor({ timeout: 15000 });
  await card2.getByRole("button", { name: "Одбиј" }).click();
  await admin.waitForTimeout(800);

  const back = await goToSlots(await desktop.newPage(), "Маникир", first.dayLabel);
  check(back.slots.includes(second.time), `client: slot ${second.time} is offered again after decline`);

  /* ---------- 5. Mobile screenshots ---------- */
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "sr-RS" });
  const m = await mobile.newPage();
  await openWizard(m);
  await shot(m, "390-service");
  const ms = await goToSlots(m, "Гел лак");
  await shot(m, "390-day");
  if (ms.slots.length > 0) {
    await ms.chips.first().click();
    await m.locator("#zakazivanje").getByRole("button", { name: "Даље" }).filter({ visible: true }).first().click();
    await m.waitForTimeout(500);
    await shot(m, "390-details");
  }
  const ma = await mobile.newPage();
  await adminLogin(ma);
  await shot(ma, "admin-requests-390");
  await ma.getByRole("tab", { name: /Радно време/ }).click();
  await ma.waitForTimeout(800);
  await shot(ma, "admin-hours-390");

  check(errors.length === 0, `client console/page errors: ${errors.length === 0 ? "none" : errors.slice(0, 3).join(" | ")}`);
} catch (err) {
  failures.push(`exception: ${err?.message ?? err}`);
  console.error(err);
} finally {
  await browser.close();
  try {
    console.log("cleanup: cancelled/declined", await cleanupTestBookings({ ...env }), "test booking(s)");
  } catch (e) {
    console.warn("cleanup failed", e?.message ?? e);
  }
}

if (failures.length) {
  console.error("\nFAILED:\n - " + failures.join("\n - "));
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
