import type { CourseDetails, GeneratedCourseModule } from "./courseMetadata";

export interface QualificationDraft {
  qualification: Pick<CourseDetails, "title" | "saqaId" | "nqfLevel" | "credits" | "description">;
  modules: GeneratedCourseModule[];
  issues: string[];
}
export function packCourseDetails(draft: QualificationDraft): CourseDetails {
  return { ...draft.qualification, unitCounts: draft.modules.map(module => module.units.length), moduleNames: draft.modules.map(module => module.name.trim()), unitCodes: draft.modules.map(module => module.units.map(unit => unit.us.trim())) };
}
export function readQualificationDraft(value: unknown): QualificationDraft {
  const draft = value as QualificationDraft;
  if (!draft?.qualification || !Array.isArray(draft.modules) || !draft.modules.length || draft.modules.length > 20 || !Array.isArray(draft.issues)) throw new Error(`No usable module structure was found. Add the qualification outline and module-to-unit mapping to the pack and try again.${Array.isArray(draft?.issues) ? ` ${draft.issues.filter(issue => typeof issue === "string").join(" ").slice(0, 1000)}` : ""}`);
  const string = (v: unknown) => typeof v === "string" && v.length <= 4000;
  if (![draft.qualification.title, draft.qualification.saqaId, draft.qualification.description, ...draft.issues].every(string)) throw new Error("The pack returned invalid qualification details.");
  const normalize = (v: unknown, fallback: number) => v === null ? fallback : v;
  draft.qualification.nqfLevel = normalize(draft.qualification.nqfLevel, 0) as number;
  draft.qualification.credits = normalize(draft.qualification.credits, -1) as number;
  let total = 0;
  for (const module of draft.modules) {
    if (!module || !string(module.name) || !string(module.description) || !Array.isArray(module.outcomes) || !module.outcomes.every(string) || !Array.isArray(module.units) || !module.units.length || module.units.length > 30) throw new Error("The pack has an incomplete module-to-unit mapping. Add a module outline and retry.");
    total += module.units.length;
    for (const unit of module.units) {
      if (!unit || !string(unit.us) || !string(unit.title) || !string(unit.description) || !Array.isArray(unit.outcomes) || !unit.outcomes.every(string)) throw new Error("The pack returned incomplete unit metadata.");
      unit.nqf = normalize(unit.nqf, 0) as number;
      unit.credits = normalize(unit.credits, -1) as number;
    }
  }
  if (total > 100) throw new Error("A course can contain at most 100 unit standards.");
  return draft;
}
