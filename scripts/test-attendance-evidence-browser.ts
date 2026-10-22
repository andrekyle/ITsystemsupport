import { attendanceEvidence } from "../src/lib/attendanceEvidence";
import { computeGamification } from "../src/lib/gamification";

export function testAttendanceEvidence() {
  function assert(value: unknown, message: string) {
    if (!value) throw new Error(message);
  }
  const data = new Map<string, string>();
  const store = {
    get length() { return data.size; },
    key(index: number) { return [...data.keys()][index] ?? null; },
    getItem(key: string) { return data.get(key) ?? null; },
  };
  data.set("itss.attendance.2026-07-01.row.learner", JSON.stringify({ name: "Test", surname: "Learner" }));
  data.set("itss.attendance.2026-07-01", JSON.stringify({ rows: {} }));
  data.set("itss.attendance.2026-07-02", JSON.stringify({ rows: { learner: { name: "Old" } } }));
  data.set("itss.attendance.2026-07-02.row.learner", JSON.stringify({ name: "Current" }));
  data.set("itss.attendance.2026-07-03.row.learner", JSON.stringify({ name: "Test" }));
  data.set("itss.attendance.2026-07-04", JSON.stringify({ rows: {} }));
  data.set("itss.attendance.2026-07-02.metadata", JSON.stringify({}));
  const registers = attendanceEvidence(store);
  assert(registers.size === 4, "Count dates once; row records and metadata are not extra sessions.");
  assert(registers.get("2026-07-01")?.learner, "Recover row evidence missing from the aggregate sheet.");
  assert(registers.get("2026-07-02")?.learner.name === "Current", "Authoritative rows must override older sheet fields.");
  assert(registers.get("2026-07-03")?.learner, "Include sessions saved only as individual rows.");
  const signed = [...registers.values()].filter(rows => rows.learner).length;
  assert(signed === 3, "Do not award attendance for an empty sheet.");
  assert(computeGamification({ units: {} }, 0, signed).xp === 45, "Award exactly 15 XP per recorded session, once.");
  data.clear();
  for (let index = 0; index < 70; index++) {
    const date = new Date(Date.UTC(2026, 6, 1 + index)).toISOString().slice(0, 10);
    data.set(`itss.attendance.${date}.row.learner`, JSON.stringify({ name: "Test" }));
  }
  assert(computeGamification({ units: {} }, 0, attendanceEvidence(store).size).xp === 1050, "Large attendance histories must not be capped or omitted.");
  return "Passed attendance recovery: row-only sessions, empty sheets, row precedence, duplicate-date prevention, metadata exclusion and exact XP above 1,000.";
}
