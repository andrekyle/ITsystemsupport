const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i;

export function isStaleChunkError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return CHUNK_ERROR.test(message);
}

/** Refresh an open app tab once when a deployment has replaced a lazy chunk. */
export function recoverFromStaleChunk(reason: unknown): boolean {
  if (!isStaleChunkError(reason)) return false;

  const key = "itss.chunk-reload";
  const now = Date.now();
  try {
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (now - last < 30_000) return false;
    sessionStorage.setItem(key, String(now));
  } catch {
    /* continue with recovery when session storage is restricted */
  }
  const reload = () => window.location.reload();
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)))
      )
      .finally(reload);
  } else {
    reload();
  }
  return true;
}
