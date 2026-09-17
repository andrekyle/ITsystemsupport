import type { PoeDoc, UnitContent } from "../types";
import { unitPackSnapshot } from "./unitStorage";

export type UnitFiles = { pdf: PoeDoc; pptx: PoeDoc; answers: PoeDoc };
export type BuiltUnitVersion = { revision: string; source: string; content: UnitContent; files: UnitFiles; createdAt: string; aiUsed: boolean };
export type BuiltUnit = BuiltUnitVersion & { previous?: BuiltUnitVersion };

function cleanLegacyGeneratedContent<T extends BuiltUnit | BuiltUnitVersion>(unit: T): T {
  const content = unit.content;
  if (!content) return unit;
  const cleaned: UnitContent = {
    ...content,
    exercises: content.exercises.filter(activity => !/^built-activity-\d+$/i.test(activity.id) && !/^built-questioning-\d+$/i.test(activity.id)),
    questionSessions: (content.questionSessions ?? []).filter(activity => !/^built-discussion$/i.test(activity.id)),
    studyNotes: undefined,
  };
  return { ...unit, content: cleaned, previous: "previous" in unit && unit.previous ? cleanLegacyGeneratedContent(unit.previous) : undefined } as T;
}

export const builtUnitKey = (us: string) => `itss.unitbuilder.${us}.shared`;
export function readBuiltUnit(us: string): BuiltUnit | undefined {
  try {
    if (typeof localStorage === "undefined") return;
    const data = JSON.parse(unitPackSnapshot(builtUnitKey(us)) ?? "null");
    return data?.content?.lesson && data?.revision && data?.files ? cleanLegacyGeneratedContent(data) : undefined;
  } catch { return undefined; }
}
