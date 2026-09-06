/**
 * Incoming-message alerts — WhatsApp-style feedback on every new message:
 * a short two-tone sound, a vibration (where the device supports it), the
 * unread count on the app icon (PWA badging) and in the tab title, and a
 * system notification with the sender + preview when the tab is hidden.
 * Every part is progressive enhancement: unsupported APIs no-op silently.
 */

let audioCtx: AudioContext | null = null;
const BASE_TITLE = typeof document !== "undefined" ? document.title : "ITSS Learn";

/** Short two-tone "pop" rendered with WebAudio — no sound file needed. */
export function playMessageTone(): void {
  try {
    type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t0 = audioCtx.currentTime;
    for (const [freq, at, dur] of [
      [880, 0, 0.09],
      [660, 0.11, 0.14],
    ] as const) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + dur + 0.02);
    }
  } catch {
    /* audio blocked (no user gesture yet) — the visual cues still fire */
  }
}

/** Short buzz on devices that support vibration (Android; iOS ignores it). */
export function vibrateForMessage(): void {
  try {
    navigator.vibrate?.([90, 45, 90]);
  } catch {
    /* unsupported */
  }
}

/** Reflect the unread count on the app icon (installed PWA) and tab title. */
export function syncUnreadBadge(count: number): void {
  try {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (count > 0) void nav.setAppBadge?.(count);
    else void nav.clearAppBadge?.();
  } catch {
    /* unsupported */
  }
  document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE;
}

/** Ask for system-notification permission (safe to call repeatedly). */
export async function ensureNotifyPermission(): Promise<boolean> {
  try {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Fire every enabled channel for one incoming message. The system
 *  notification only shows when the tab is hidden — in the open app the
 *  bell badge + sound already tell the user. */
export function notifyIncoming(opts: { from: string; preview: string; unread: number }): void {
  playMessageTone();
  vibrateForMessage();
  syncUnreadBadge(opts.unread);
  try {
    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.visibilityState === "hidden"
    ) {
      const n = new Notification(opts.from, {
        body: opts.preview.slice(0, 140),
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "itss-chat", // replaces the previous chat notification instead of stacking
        silent: true, // we already play our own tone
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  } catch {
    /* notification construction can throw on some platforms — ignore */
  }
}
