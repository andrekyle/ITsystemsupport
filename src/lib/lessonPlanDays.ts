import type { LessonPlan, LessonPlanRow } from "../types";

const opening = /^(?:room set\s*up|meet\b|welcome\b|introductions?\b|opening\b|registration\b|ice\s*breaker\b|index\s*&\s*unit standard alignment\b)/i;
const closing = /^(?:parking bay\b|closing\b|conclusions?\b|wrap[ -]?up\b|summary\b)/i;

function dayOneBookends(plan: LessonPlan) {
  const end = plan.sections.findIndex((section, i) => i > 0 && section.startTime);
  const rows = plan.sections.slice(0, end < 0 ? undefined : end).flatMap(section => section.rows);
  const intro: LessonPlanRow[] = [];
  const conclusion: LessonPlanRow[] = [];
  for (const row of rows) {
    if (!opening.test(row.title.trim())) break;
    intro.push(row);
  }
  for (let i = rows.length - 1; i >= 0; i--) {
    if (!closing.test(rows[i].title.trim())) break;
    conclusion.unshift(rows[i]);
  }
  return structuredClone({ intro, conclusion });
}

function completeDay(plan: LessonPlan, start: number, template: ReturnType<typeof dayOneBookends>, dayId: string) {
  let end = start + 1;
  while (end < plan.sections.length && !plan.sections[end].startTime) end++;
  const rows = plan.sections.slice(start, end).flatMap(section => section.rows);
  const titles = new Set(rows.map(row => row.title.trim().toLowerCase()));
  const missing = (items: LessonPlanRow[]) => structuredClone(items.filter(row => !titles.has(row.title.trim().toLowerCase()))).map(row => ({ ...row, addedForDay: dayId }));
  plan.sections[start].rows.unshift(...missing(template.intro));
  plan.sections[end - 1].rows.push(...missing(template.conclusion));
}

/** Insert a new day between sections, using Day 1's opening and closing activities. */
export function insertLessonPlanDay(plan: LessonPlan, index: number, activity: LessonPlanRow): void {
  if (index < 0 || index > plan.sections.length) return;
  const template = dayOneBookends(plan);
  const dayId = crypto.randomUUID();
  plan.sections.splice(index, 0, { startTime: plan.startTime ?? "09:00", addedDayId: dayId, rows: [activity] });
  if (index > 0) {
    let previousDay = index - 1;
    while (previousDay > 0 && !plan.sections[previousDay].startTime) previousDay--;
    completeDay(plan, previousDay, template, dayId);
  }
  completeDay(plan, index, template, dayId);
}

export function lessonPlanDayCount(plan: LessonPlan): number {
  return 1 + plan.sections.slice(1).filter((section) => section.startTime).length;
}

/** Start a day at an existing activity without dropping or reordering rows. */
export function startLessonPlanDay(plan: LessonPlan, sectionIndex: number, rowIndex: number): void {
  const section = plan.sections[sectionIndex];
  if (!section?.rows[rowIndex] || (sectionIndex === 0 && rowIndex === 0)) return;
  if (rowIndex === 0 && section.startTime) return;
  const template = dayOneBookends(plan);
  const dayId = crypto.randomUUID();
  const startTime = plan.startTime ?? "09:00";
  let newDayIndex = sectionIndex;
  if (rowIndex === 0) {
    section.startTime = startTime;
    section.addedDayId = dayId;
  } else {
    const rows = section.rows.splice(rowIndex);
    newDayIndex++;
    plan.sections.splice(newDayIndex, 0, { startTime, rows, addedDayId: dayId, splitForDay: true });
  }
  let previousDay = newDayIndex - 1;
  while (previousDay > 0 && !plan.sections[previousDay].startTime) previousDay--;
  completeDay(plan, previousDay, template, dayId);
  completeDay(plan, newDayIndex, template, dayId);
}

/** Undo a day boundary, preserving original and manually added activities. */
export function removeLessonPlanDay(plan: LessonPlan, sectionIndex: number): void {
  const section = plan.sections[sectionIndex];
  if (!section || sectionIndex === 0 || !section.startTime) return;
  if (section.addedDayId) {
    for (const item of plan.sections) {
      item.rows = item.rows.filter(row => row.addedForDay !== section.addedDayId);
    }
  }
  delete section.startTime;
  delete section.addedDayId;
  if (section.splitForDay || !section.heading) {
    plan.sections[sectionIndex - 1].rows.push(...section.rows);
    plan.sections.splice(sectionIndex, 1);
  }
  delete section.splitForDay;
}
