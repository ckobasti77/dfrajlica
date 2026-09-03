/**
 * Race test: two concurrent `bookings.request` calls for the SAME slot must yield
 * exactly one success. Runs against the deployment in .env.local (or CONVEX_URL).
 *
 *   node scripts/race-test.mjs            # uses NEXT_PUBLIC_CONVEX_URL from .env.local
 *   ADMIN_KEY=... node scripts/race-test.mjs   # also cleans up (declines) the winner
 */
import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

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
const url = env.CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
if (!url) throw new Error("No Convex URL (CONVEX_URL / NEXT_PUBLIC_CONVEX_URL)");
const client = new ConvexHttpClient(url);

function addDays(date, n) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}
function belgradeToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
}

const serviceKey = "manikir";
const staffKey = "branka";
const now = Date.now();

// Find the first upcoming day with a free slot for Branka.
let date = addDays(belgradeToday(), 1);
let slot = null;
for (let i = 0; i < 14 && slot === null; i++, date = addDays(date, 1)) {
  const day = await client.query(anyApi.availability.day, { date, serviceKey, staffKey, now });
  const mine = day.find((d) => d.staffKey === staffKey);
  if (mine && mine.slots.length > 0) {
    slot = { date, startMin: mine.slots[mine.slots.length - 1] };
  }
}
if (!slot) throw new Error("No free slot found in the next two weeks");
console.log("Racing for", slot);

const suffix = String(now).slice(-5);
const make = (i) =>
  client
    .mutation(anyApi.bookings.request, {
      name: `Race Test ${i}`,
      phone: `06${i}${suffix}00`,
      serviceKey,
      staffKey,
      date: slot.date,
      startMin: slot.startMin,
      note: "race-test",
    })
    .then((r) => ({ ok: true, r }))
    .catch((e) => ({ ok: false, message: e?.data ?? e?.message ?? String(e) }));

const results = await Promise.all([make(1), make(2)]);
console.log(results);
const wins = results.filter((r) => r.ok);
const losses = results.filter((r) => !r.ok);

if (env.ADMIN_KEY) {
  for (const w of wins) {
    await client.mutation(anyApi.bookings.setStatus, { key: env.ADMIN_KEY, id: w.r.id, status: "odbijen" });
  }
  console.log(`Cleaned up ${wins.length} booking(s) (odbijen).`);
}

if (wins.length === 1 && losses.length === 1 && /заузет/.test(losses[0].message)) {
  console.log("PASS: exactly one request succeeded, the other got „заузет“.");
  process.exit(0);
}
console.error("FAIL: expected exactly one success");
process.exit(1);
