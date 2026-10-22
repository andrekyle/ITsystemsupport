export interface AttendanceEvidenceRow {
  name?: string;
  surname?: string;
  idNumber?: string;
}

/** Read both legacy register sheets and authoritative per-learner rows.
 * A session counts once even when its signatures exist in both formats. */
export function attendanceEvidence(
  storage: Pick<Storage, "length" | "key" | "getItem"> = localStorage
): Map<string, Record<string, AttendanceEvidenceRow>> {
  const registers = new Map<string, Record<string, AttendanceEvidenceRow>>();
  const individual: { date: string; id: string; row: AttendanceEvidenceRow }[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    const match = key?.match(/^itss\.attendance\.(\d{4}-\d{2}-\d{2})(?:\.row\.(.+))?$/);
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
