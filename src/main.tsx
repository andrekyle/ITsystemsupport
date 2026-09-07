import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

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
