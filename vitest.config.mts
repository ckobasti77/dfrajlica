import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    exclude: ["**/node_modules/**", "**/.claude/**", "**/.next/**"],
  },
});
