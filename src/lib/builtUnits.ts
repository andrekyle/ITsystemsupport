import type { PoeDoc, UnitContent } from "../types";
import { unitPackSnapshot } from "./unitStorage";

export type UnitFiles = { pdf: PoeDoc; pptx: PoeDoc; answers: PoeDoc };
export type BuiltUnitVersion = { revision: string; source: string; content: UnitContent; files: UnitFiles; createdAt: string; aiUsed: boolean };
export type BuiltUnit = BuiltUnitVersion & { previous?: BuiltUnitVersion };

function isLegacyGeneratedActivity(activity: UnitContent["exercises"][number]): boolean {
  const oldLessonActivity = /^built-activity-\d+$/i.test(activity.id)
    && /^Activity \d+:/i.test(activity.title)
    && /^Work from the .* lesson section\. Apply its ideas to a realistic workplace example\.$/i.test(activity.task)
    && activity.steps.length === 3
    && activity.steps[0] === "Identify the main idea and explain it in your own words."
    && activity.steps[1] === "Describe a workplace situation where this knowledge is useful."
    && activity.steps[2] === "Show how you would apply the guidance and explain how you would check the result.";
  const oldQuestioningActivity = /^built-questioning-\d+$/i.test(activity.id)
    && /^Questioning\s+[-–—]\s+Prepare a (?:time|cost) estimate for an element of work$/i.test(activity.title)
    && /Time: \d+ minutes .* Activity: Self & Group/i.test(activity.task)
    && activity.steps.length === 3
    && activity.steps[0] === "Break the work element into logical parts and record the assumptions."
    && activity.steps[1] === "Include interface implementation and testing where applicable."
    && activity.steps[2] === "Present the estimate and explain how the figures were calculated.";
  const generatedMarkedActivity = /^(activity|question-session)-\d+-/i.test(activity.id)
    && Array.isArray(activity.steps)
    && activity.steps.length > 0
    && Array.isArray(activity.checks)
    && activity.checks.length > 0;
  const placeholderManualActivity = /^manual-activity-\d+$/i.test(activity.id)
    && (activity.title === "Activity 1" || activity.title === "New activity")
    && activity.steps?.[0] === "Add the first learner question.";
  return oldLessonActivity || oldQuestioningActivity || generatedMarkedActivity || placeholderManualActivity;
}

function isLegacyGeneratedQuestionSession(activity: UnitContent["exercises"][number]): boolean {
  const oldDiscussion = /^built-discussion$/i.test(activity.id)
    && activity.title === "Knowledge and reflection"
    && activity.task === "Use the unit material to support each answer.";
  const generatedQuestionSession = /^question-session-\d+-/i.test(activity.id)
    && Array.isArray(activity.steps)
    && activity.steps.length > 0;
  return oldDiscussion || generatedQuestionSession;
}

function cleanLegacyGeneratedContent<T extends BuiltUnit | BuiltUnitVersion>(unit: T): T {
  const content = unit.content;
  if (!content) return unit;
  const cleaned: UnitContent = {
    ...content,
    exercises: content.exercises.filter(activity => !isLegacyGeneratedActivity(activity)),
    questionSessions: (content.questionSessions ?? []).filter(activity => !isLegacyGeneratedQuestionSession(activity)),
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
