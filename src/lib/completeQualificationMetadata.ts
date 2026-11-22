import type { QualificationDraft } from "./qualificationPack";

/** Resolve registration facts from SAQA rather than guessing from folder names. */
export async function completeQualificationMetadata(
  draft: QualificationDraft,
  token: string | undefined,
  model: string,
  onUpdate: (draft: QualificationDraft) => void,
  onProgress: (message: string, completed: number, total: number) => void,
  refreshUnits = false,
): Promise<QualificationDraft> {
  const next = structuredClone(draft);
  const tasks: { code: string; kind: "unit" | "qualification"; apply: (metadata: { title: string; nqf: number; credits: number }) => void }[] = [];
  const q = next.qualification;
  if (!q.title.trim() || q.nqfLevel < 1 || q.credits < 0) tasks.push({ code: q.saqaId, kind: "qualification", apply: metadata => { q.title = metadata.title; q.nqfLevel = metadata.nqf; q.credits = metadata.credits; } });
  next.modules.forEach(module => module.units.forEach(unit => {
    if (refreshUnits || !unit.title.trim() || /^unit standard\s+\d+$/i.test(unit.title.trim()) || unit.nqf < 1 || unit.credits < 0) tasks.push({ code: unit.us, kind: "unit", apply: metadata => { Object.assign(unit, metadata); } });
  }));
  for (const [index, task] of tasks.entries()) {
    const recordType = task.kind === "unit" ? "unit standard" : "qualification";
    const label = `SAQA ${recordType} ${task.code}`;
    onProgress(`Looking up ${label} (${index + 1} of ${tasks.length})`, index, tasks.length);
    if (!/^[1-9]\d{0,8}$/.test(task.code)) {
      throw new Error(`${label} lookup was not sent: the SAQA code must be a non-zero number with at most 9 digits. Correct it in the course review and retry.`);
    }
    let response: Response;
    try {
      response = await fetch("/api/unit-metadata", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ us: task.code, kind: task.kind, model }), signal: AbortSignal.timeout(60000) });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`${label} lookup request failed before the server responded: ${reason || "network or timeout error"}. Retry or enter the metadata manually.`);
    }
    let raw: string;
    try {
      raw = await response.text();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`${label} lookup returned HTTP ${response.status}, but its response could not be read: ${reason}.`);
    }
    let result: { error?: unknown; metadata?: { us?: string; title?: string | null; nqf?: number | null; credits?: number | null } };
    try {
      result = JSON.parse(raw);
      if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error();
    } catch {
      const contentType = response.headers.get("content-type")?.split(";")[0] || "unknown content type";
      const preview = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
      throw new Error(`${label} lookup failed: /api/unit-metadata returned HTTP ${response.status} with ${contentType}, not JSON.${preview ? ` Server response: "${preview}".` : ""} Retry or enter the metadata manually.`);
    }
    if (!response.ok || result.error) {
      const detail = typeof result.error === "string" && result.error.trim() ? result.error.trim() : "No error details were returned.";
      throw new Error(`${label}: ${detail}${response.ok ? "" : ` (HTTP ${response.status})`}`);
    }
    const metadata = result.metadata;
    if (metadata?.us !== task.code || typeof metadata.title !== "string" || !metadata.title.trim() || typeof metadata.nqf !== "number" || !Number.isInteger(metadata.nqf) || metadata.nqf < 1 || metadata.nqf > 10 || typeof metadata.credits !== "number" || !Number.isInteger(metadata.credits) || metadata.credits < 0) throw new Error(`${label} did not provide a complete title, NQF level and credits. Check this code or retry.`);
    task.apply({ title: metadata.title, nqf: metadata.nqf, credits: metadata.credits });
    onUpdate(structuredClone(next));
    onProgress(`Completed SAQA metadata for ${task.code}`, index + 1, tasks.length);
  }
  return next;
}
