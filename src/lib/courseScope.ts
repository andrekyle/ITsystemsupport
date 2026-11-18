/** Keep custom-course content independent while preserving built-in storage keys. */
export function courseScopedUnit(us: string): string {
  let id: string | null = null;
  try { id = localStorage.getItem("itss.activeCourse"); } catch { /* local mode */ }
  return id?.startsWith("custom-") ? `${id}.${us}` : us;
}

/** Keep the original qualification's keys, with a separate namespace for new courses. */
export function courseScopedKey(key: string): string {
  let id: string | null = null;
  try { id = localStorage.getItem("itss.activeCourse"); } catch { /* local mode */ }
  return id?.startsWith("custom-") ? key.replace(/^(itss\.[^.]+\.)/, `$1${id}.`) : key;
}
