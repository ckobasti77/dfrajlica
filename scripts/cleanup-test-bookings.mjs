/** Cancels/declines bookings created by the test scripts (names „Е2Е Тест…" / „Race Test…"). Dev use only. */
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
export async function cleanupTestBookings(env = { ...envFromFile(), ...process.env }) {
  const url = env.CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
  const key = env.ADMIN_KEY;
  if (!url || !key) throw new Error("CONVEX URL + ADMIN_KEY required");
  const client = new ConvexHttpClient(url);
  const all = await client.query(anyApi.bookings.list, { key });
  let n = 0;
  for (const b of all) {
    if (!/^(Е2Е Тест|Race Test)/.test(b.name)) continue;
    if (b.status === "nov") await client.mutation(anyApi.bookings.setStatus, { key, id: b._id, status: "odbijen" });
    else if (b.status === "potvrdjen") await client.mutation(anyApi.bookings.setStatus, { key, id: b._id, status: "otkazan" });
    else continue;
    n++;
  }
  return n;
}
if (process.argv[1]?.endsWith("cleanup-test-bookings.mjs")) {
  console.log("cleaned", await cleanupTestBookings());
}
