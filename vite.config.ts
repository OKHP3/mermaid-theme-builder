import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createRequire } from "module";
import { execSync } from "child_process";

const _require = createRequire(import.meta.url);
const pkg = _require("./package.json") as { version: string };

let gitSha = "";
try {
  gitSha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  // git unavailable in this environment — version without SHA
}

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error("BASE_PATH environment variable is required but was not provided.");
}

export default defineConfig({
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(gitSha ? `${pkg.version}-${gitSha}` : pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: import.meta.dirname,
            })
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  optimizeDeps: {
    exclude: ["mermaid", "@mermaid-js/mermaid-zenuml"],
  },
  resolve: {
    alias: {
      mermaid: path.resolve(import.meta.dirname, "node_modules/mermaid/dist/mermaid.esm.min.mjs"),
      "@mermaid-js/mermaid-zenuml": path.resolve(
        import.meta.dirname,
        "node_modules/@mermaid-js/mermaid-zenuml/dist/mermaid-zenuml.esm.min.mjs"
      ),
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
