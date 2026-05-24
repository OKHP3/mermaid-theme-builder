import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["src/__tests__/applyTab.test.ts", "happy-dom"],
      ["src/__tests__/exporters-browser.test.ts", "happy-dom"],
      ["src/__tests__/classBrowserLiveRegion.test.tsx", "happy-dom"],
      ["src/__tests__/classBrowserClipboard.test.tsx", "happy-dom"],
      ["src/__tests__/accessibility.test.tsx", "happy-dom"],
      ["src/__tests__/examplesTabPersistence.test.tsx", "happy-dom"],
      ["src/__tests__/familySyntaxHint.test.tsx", "happy-dom"],
      ["src/__tests__/previewPicker.test.ts", "happy-dom"],
    ],
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
