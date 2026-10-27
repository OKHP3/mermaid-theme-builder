import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  test: {
    root: import.meta.dirname,
    environment: "happy-dom",
    include: ["src/__tests__/*.test.tsx"],
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
});
