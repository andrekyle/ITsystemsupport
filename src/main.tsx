import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./lib/install"; // capture the PWA install prompt before React mounts

const recoverFromStaleChunk = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  if (!/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(message)) return;
  const key = "itss.chunk-reload";
  const now = Date.now();
  const last = Number(sessionStorage.getItem(key) ?? 0);
  if (now - last < 30_000) return;
  sessionStorage.setItem(key, String(now));
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)))
    ).finally(() => window.location.reload());
  } else {
    window.location.reload();
  }
};

window.addEventListener("unhandledrejection", (event) => recoverFromStaleChunk(event.reason));
window.addEventListener("error", (event) => recoverFromStaleChunk(event.error ?? event.message));

// Offline/installable app support — production builds only, so the dev
// server never fights a stale cache.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        // check for a newer build on every launch and when returning to the tab
        reg.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch(() => {
        /* offline support is progressive enhancement — never block the app */
      });
    // when the new worker takes over, reload once so the fresh UI shows now,
    // not on the visit after next
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
