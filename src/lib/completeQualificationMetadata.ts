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
    onProgress(`Looking up SAQA ${task.kind === "unit" ? "unit standard" : "qualification"} ${task.code} (${index + 1} of ${tasks.length})`, index, tasks.length);
    const response = await fetch("/api/unit-metadata", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ us: task.code, kind: task.kind, model }), signal: AbortSignal.timeout(60000) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(`${task.code}: ${result.error || "Could not retrieve SAQA metadata. Retry to continue."}`);
    const metadata = result.metadata;
    if (metadata?.us !== task.code || typeof metadata.title !== "string" || !metadata.title.trim() || !Number.isInteger(metadata.nqf) || metadata.nqf < 1 || metadata.nqf > 10 || !Number.isInteger(metadata.credits) || metadata.credits < 0) throw new Error(`SAQA ${task.code} did not provide a complete title, NQF level and credits. Check this code or retry.`);
    task.apply({ title: metadata.title, nqf: metadata.nqf, credits: metadata.credits });
    onUpdate(structuredClone(next));
    onProgress(`Completed SAQA metadata for ${task.code}`, index + 1, tasks.length);
  }
  return next;
}
