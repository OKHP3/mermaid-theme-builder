import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["src/__tests__/setup/storage-isolation.ts"],
    clearMocks: true,
    testTimeout: 10000,
    // Browser-facing tests declare their environment with a
    // `// @vitest-environment happy-dom` docblock in the test file.
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
});
