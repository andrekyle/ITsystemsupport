/** Retry a temporary service outage once, respecting Retry-After. */
export async function fetchWithServiceRetry(url: string, init: RequestInit): Promise<Response> {
  const first = await fetch(url, init);
  if (![502, 503, 504].includes(first.status)) return first;
  const header = first.headers.get("retry-after");
  const seconds = header === null ? NaN : Number(header);
  const delay = header === null ? 1000 : Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(header) - Date.now());
  // A long backoff needs a later user retry, rather than holding an edge request open.
  if (!Number.isFinite(delay) || delay > 5000 || init.signal?.aborted) return first;
  await new Promise<void>((resolve, reject) => {
    const signal = init.signal;
    const onAbort = () => { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); reject(new DOMException("Request aborted", "AbortError")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, delay);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
  return fetch(url, init);
}

export function reportServiceError(status: number, code?: string): string {
  if (code === "insufficient_quota" || code?.endsWith("spend_limit_exceeded") || code?.endsWith("usage_limit_exceeded")) return "quota_exceeded";
  if (status === 401 || status === 403) return "invalid_api_key";
  if (status === 429) return "rate_limited";
  if ([502, 503, 504].includes(status)) return "service_unavailable";
  return `http_${status}`;
}
