import type { UnitContent } from "../types";
import { LEARNER_WORKBOOK_114074 } from "./learnerWorkbook114074";

export function withDefaultLearnerWorkbook(unitId: string, content: UnitContent | undefined): UnitContent | undefined {
  if (unitId !== "114074" || content?.learnerWorkbook) return content;
  return {
    ...(content ?? { lesson: [], exercises: [], assignments: [], quiz: [] }),
    learnerWorkbook: LEARNER_WORKBOOK_114074,
  };
}
