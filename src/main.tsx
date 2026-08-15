import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Offline/installable app support — production builds only, so the dev
// server never fights a stale cache.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is progressive enhancement — never block the app */
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
