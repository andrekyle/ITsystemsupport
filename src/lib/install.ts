/** PWA install plumbing: captures the browser's install prompt so the app can
 *  offer its own "Download the app" button. Import early (main.tsx) so the
 *  beforeinstallprompt event is never missed. */

type BipEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BipEvent | null = null;
/** set when the user asked to install before the browser granted the prompt */
let wantsInstall = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as BipEvent;
  notify();
  if (wantsInstall) {
    wantsInstall = false;
    void promptInstall();
  }
});

window.addEventListener("appinstalled", () => {
  deferred = null;
  notify();
});

/** True when the browser has an install prompt ready to show. */
export function canInstall(): boolean {
  return deferred !== null;
}

/** True when already running as the installed app. */
export function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/** Subscribe to install-state changes; returns the unsubscribe. */
export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Show the browser's install dialog. Resolves true when it could be shown.
 *  When the browser hasn't granted the prompt yet, remembers the request and
 *  fires the dialog automatically as soon as it arrives. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) {
    wantsInstall = true;
    return false;
  }
  const ev = deferred;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  if (outcome === "accepted") deferred = null;
  notify();
  return true;
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
