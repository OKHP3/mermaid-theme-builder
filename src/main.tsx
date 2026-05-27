import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyMode } from "./hooks/useThemeMode";

(() => {
  try {
    const stored = window.localStorage.getItem("mtb.theme");
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "light";
    applyMode(mode);
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch((err) => {
      console.warn("[mtb] service worker registration failed", err);
    });
  });
}
