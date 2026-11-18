export interface CourseDetails {
  title: string;
  saqaId: string;
  nqfLevel: number;
  credits: number;
  description: string;
  unitCounts: number[];
  moduleNames: string[];
  unitCodes: string[][];
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
  if (!Array.isArray(details.moduleNames) || details.moduleNames.length !== details.unitCounts.length) throw new Error("Enter a name for every module.");
  if (!Array.isArray(details.unitCodes) || details.unitCodes.length !== details.unitCounts.length) throw new Error("Enter the unit standard codes for every module.");
  const codes = new Set<string>();
  details.unitCounts.forEach((count, index) => {
    if (typeof details.moduleNames[index] !== "string" || !details.moduleNames[index].trim() || details.moduleNames[index].length > 300) throw new Error(`Enter a name for Module ${index + 1} (up to 300 characters).`);
    const units = details.unitCodes[index];
    if (!Array.isArray(units) || units.length !== count) throw new Error(`Enter ${count} unit standard codes for Module ${index + 1}.`);
    units.forEach((code, unitIndex) => {
      if (typeof code !== "string" || !/^[1-9]\d{0,8}$/.test(code)) throw new Error(`Enter a numeric code for Module ${index + 1}, unit standard ${unitIndex + 1}.`);
      if (codes.has(code)) throw new Error(`Unit standard ${code} is listed more than once. Each code must be unique.`);
      codes.add(code);
    });
  });
}
export function validateCourseModules(value: unknown, counts: number[], requested?: Pick<CourseDetails, "moduleNames" | "unitCodes">): asserts value is GeneratedCourseModule[] {
  const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 4000;
  const outcomes = (v: unknown) => Array.isArray(v) && v.length > 0 && v.length <= 10 && v.every(text);
  const codes = new Set<string>();
  if (!Array.isArray(value) || value.length !== counts.length || !value.every((module, index) =>
    module && text(module.name) && text(module.description) && outcomes(module.outcomes) && Array.isArray(module.units) && module.units.length === counts[index] && module.units.every((unit: GeneratedCourseModule["units"][number]) => {
      if (!unit || !text(unit.us) || !/^\d{1,9}$/.test(unit.us) || codes.has(unit.us) || !text(unit.title) || !text(unit.description) || !outcomes(unit.outcomes) || !Number.isInteger(unit.nqf) || unit.nqf < 1 || unit.nqf > 10 || !Number.isInteger(unit.credits) || unit.credits < 0) return false;
      codes.add(unit.us); return true;
    }))) throw new Error("AI returned incomplete metadata or a different course structure. Retry generation or check the requested unit counts.");
  if (requested) (value as GeneratedCourseModule[]).forEach((module, index) => {
    if (module.name !== requested.moduleNames[index].trim()) throw new Error(`AI changed the name of Module ${index + 1}. Retry generation.`);
    module.units.forEach((unit, unitIndex) => {
      if (unit.us !== requested.unitCodes[index][unitIndex]) throw new Error(`Module ${index + 1}, unit ${unitIndex + 1}: expected code ${requested.unitCodes[index][unitIndex]}, but AI returned ${unit.us}. Retry generation.`);
    });
  });
}
