import type { PriceRow } from "@/content/site";

/** 1700 → "1.700" (тачка као хиљадарски сепаратор, као на IG ценовнику) */
export function formatNumber(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** number → "1.700"; [a, b] → "1.700–1.900"; string → непромењено ("+300", "— / 3.500") */
export function formatPrice(price: PriceRow["price"]): string {
  if (typeof price === "number") return formatNumber(price);
  if (Array.isArray(price)) return `${formatNumber(price[0])}–${formatNumber(price[1])}`;
  return price;
}

/**
 * За групе са две колоне (Јана / Бранка): враћа [левa, десна] ћелија.
 * number → иста цена у обе; [a,b] → a, b; "x / y" → x, y; остало (нпр. "+300") → у обе.
 */
export function splitPrice(price: PriceRow["price"]): [string, string] {
  if (typeof price === "number") {
    const s = formatNumber(price);
    return [s, s];
  }
  if (Array.isArray(price)) return [formatNumber(price[0]), formatNumber(price[1])];
  const parts = price.split("/").map((p) => p.trim());
  if (parts.length === 2) return [parts[0], parts[1]];
  return [price, price];
}
