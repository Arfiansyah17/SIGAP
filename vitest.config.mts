import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` alias in tsconfig.json so tests import the same way the
    // app does.
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    // The password logic is pure and has no DOM dependency.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
