import { courseScopedKey } from "./courseScope";
export interface AttendanceEvidenceRow {
  name?: string;
  surname?: string;
  idNumber?: string;
}

export const MIN_ATTENDANCE_REGISTER_LEARNERS = 4;

export function attendanceSignerCount(rows: Record<string, unknown> | undefined): number {
  const learners = new Set<string>();
  for (const [profileId, value] of Object.entries(rows ?? {})) {
    const row = value && typeof value === "object" && !Array.isArray(value)
      ? value as AttendanceEvidenceRow
      : {};
    const idNumber = typeof row.idNumber === "string" ? row.idNumber.replace(/\D/g, "") : "";
    const name = `${typeof row.name === "string" ? row.name : ""} ${typeof row.surname === "string" ? row.surname : ""}`
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    learners.add(idNumber ? `id:${idNumber}` : name ? `name:${name}` : `profile:${profileId}`);
  }
  return learners.size;
}

export function isCountedAttendanceRegister(rows: Record<string, unknown> | undefined): boolean {
  return attendanceSignerCount(rows) >= MIN_ATTENDANCE_REGISTER_LEARNERS;
}

/** Read both legacy register sheets and authoritative per-learner rows.
 * A session counts once even when its signatures exist in both formats. */
export function attendanceEvidence(
  storage: Pick<Storage, "length" | "key" | "getItem"> = localStorage
): Map<string, Record<string, AttendanceEvidenceRow>> {
  const prefix = courseScopedKey("itss.attendance.");
  const registers = new Map<string, Record<string, AttendanceEvidenceRow>>();
  const individual: { date: string; id: string; row: AttendanceEvidenceRow }[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    const match = key?.startsWith(prefix) ? key.slice(prefix.length).match(/^(\d{4}-\d{2}-\d{2})(?:\.row\.(.+))?$/) : null;
    if (!key || !match) continue;
    try {
      const value = JSON.parse(storage.getItem(key) ?? "null");
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Attendance evidence is not an object.");
      }
      if (match[2]) {
        individual.push({ date: match[1], id: match[2], row: value });
      } else {
        if (value.rows !== undefined && (!value.rows || typeof value.rows !== "object" || Array.isArray(value.rows))) {
          throw new Error("Attendance register rows are not an object.");
        }
        registers.set(match[1], value.rows ?? {});
      }
    } catch (error) {
      console.error("Could not read saved attendance evidence:", key, error);
    }
  }
  for (const { date, id, row } of individual) {
    registers.set(date, { ...registers.get(date), [id]: row });
  }
  return registers;
}
