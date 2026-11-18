export interface CourseDetails {
  title: string;
  saqaId: string;
  nqfLevel: number;
  credits: number;
  description: string;
  unitCounts: number[];
}
export interface GeneratedCourseModule {
  name: string;
  description: string;
  outcomes: string[];
  units: { us: string; title: string; nqf: number; credits: number; description: string; outcomes: string[] }[];
}
export function validateCourseDetails(details: CourseDetails) {
  if (!details || typeof details.title !== "string" || !details.title.trim() || details.title.length > 300) throw new Error("Enter a course name (up to 300 characters).");
  if (typeof details.saqaId !== "string" || !/^\d{1,9}$/.test(details.saqaId.trim())) throw new Error("Enter a numeric SAQA ID.");
  if (!Number.isInteger(details.nqfLevel) || details.nqfLevel < 1 || details.nqfLevel > 10 || !Number.isInteger(details.credits) || details.credits < 0) throw new Error("Enter a valid NQF level (1–10) and credits.");
  if (typeof details.description !== "string" || details.description.length > 4000) throw new Error("Keep the description within 4,000 characters.");
  if (!Array.isArray(details.unitCounts) || details.unitCounts.length < 1 || details.unitCounts.length > 20 || details.unitCounts.some(count => !Number.isInteger(count) || count < 1 || count > 30) || details.unitCounts.reduce((a, b) => a + b, 0) > 100) throw new Error("Choose 1–20 modules, 1–30 unit standards per module, and at most 100 unit standards in total.");
}
export function validateCourseModules(value: unknown, counts: number[]): asserts value is GeneratedCourseModule[] {
  const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 4000;
  const outcomes = (v: unknown) => Array.isArray(v) && v.length > 0 && v.length <= 10 && v.every(text);
  const codes = new Set<string>();
  if (!Array.isArray(value) || value.length !== counts.length || !value.every((module, index) =>
    module && text(module.name) && text(module.description) && outcomes(module.outcomes) && Array.isArray(module.units) && module.units.length === counts[index] && module.units.every((unit: GeneratedCourseModule["units"][number]) => {
      if (!unit || !text(unit.us) || !/^\d{1,9}$/.test(unit.us) || codes.has(unit.us) || !text(unit.title) || !text(unit.description) || !outcomes(unit.outcomes) || !Number.isInteger(unit.nqf) || unit.nqf < 1 || unit.nqf > 10 || !Number.isInteger(unit.credits) || unit.credits < 0) return false;
      codes.add(unit.us); return true;
    }))) throw new Error("AI returned incomplete metadata or a different course structure. Retry generation or check the requested unit counts.");
}
