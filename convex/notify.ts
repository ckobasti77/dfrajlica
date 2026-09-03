import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * E-mail the owner about a new request. Silently skipped unless BOTH env vars are set:
 *   npx convex env set RESEND_API_KEY re_xxx [--prod]
 *   npx convex env set NOTIFY_EMAIL vlasnica@example.com [--prod]
 * Optional: RESEND_FROM (defaults to onboarding@resend.dev — works without a verified domain,
 * but Resend then only delivers to the account owner's address).
 */
export const newRequest = internalAction({
  args: {
    name: v.string(),
    phone: v.string(),
    serviceTitle: v.string(),
    staffName: v.string(),
    date: v.string(),
    timeRange: v.string(),
    note: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.NOTIFY_EMAIL;
    if (!apiKey || !to) return null;
    const from = process.env.RESEND_FROM ?? "Д фрајлица <onboarding@resend.dev>";

    const [y, m, d] = args.date.split("-");
    const prettyDate = `${d}.${m}.${y}.`;
    const subject = `Нов захтев: ${args.serviceTitle} · ${prettyDate} ${args.timeRange}`;
    const lines = [
      `Услуга: ${args.serviceTitle}`,
      `Мајстор: ${args.staffName}`,
      `Термин: ${prettyDate} ${args.timeRange}`,
      `Име: ${args.name}`,
      `Телефон: ${args.phone}`,
      args.note ? `Напомена: ${args.note}` : "",
      "",
      "Потврдите или одбијте у админ панелу: https://dfrajlica.vercel.app/admin",
    ].filter(Boolean);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, text: lines.join("\n") }),
      });
      if (!res.ok) {
        console.warn("Resend failed", res.status, await res.text());
      }
    } catch (err) {
      console.warn("Resend request threw", err instanceof Error ? err.message : String(err));
    }
    return null;
  },
});
