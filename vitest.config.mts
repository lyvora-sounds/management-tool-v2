import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resuelve el alias "@/..." desde tsconfig.json, para que los tests
    // importen igual que el resto del código.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
