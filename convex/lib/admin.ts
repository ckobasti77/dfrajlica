import { ConvexError } from "convex/values";

export const ADMIN_MESSAGES = {
  badKey: "Неисправан кључ",
} as const;

/** Every admin function takes `key` and must call this first. */
export function assertAdminKey(key: string): void {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    throw new ConvexError(ADMIN_MESSAGES.badKey);
  }
}
