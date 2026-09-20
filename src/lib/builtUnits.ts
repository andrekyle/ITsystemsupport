import type { PoeDoc, UnitContent } from "../types";
import { unitPackSnapshot } from "./unitStorage";
import { courseScopedUnit } from "./courseScope";

export type UnitFiles = { pdf: PoeDoc; pptx: PoeDoc; answers: PoeDoc; material?: PoeDoc; materialEditable?: PoeDoc };
export type BuiltUnitVersion = { revision: string; source: string; content: UnitContent; files: UnitFiles; createdAt: string; aiUsed: boolean; planSource?: string };
export type BuiltUnit = BuiltUnitVersion & { previous?: BuiltUnitVersion; history?: BuiltUnitVersion[] };

/** How many superseded builds stay restorable on the unit. */
export const MAX_UNIT_HISTORY = 3;

/** Restorable versions, newest first. Packs saved before history existed only carry `previous`. */
export function unitHistory(unit: BuiltUnit | undefined): BuiltUnitVersion[] {
  if (!unit) return [];
  if (unit.history?.length) return unit.history;
  return unit.previous ? [unit.previous] : [];
}

/** Strip nested versions so archived builds never nest inside each other. */
export function unitVersionArchive(version: BuiltUnitVersion): BuiltUnitVersion {
  return { revision: version.revision, source: version.source, content: version.content, files: version.files, createdAt: version.createdAt, aiUsed: version.aiUsed, planSource: version.planSource };
}

/** Local-only packs embed the export files, so keep the saved row a workable size. */
export const MAX_UNIT_PACK_BYTES = 5_000_000;

/** Serialise the pack that replaces `old`, keeping the superseded builds restorable. */
export function unitPackValue(old: BuiltUnit | undefined, next: BuiltUnitVersion): string {
  // Newest first: the build being replaced, then the versions it already kept.
  const history = (old ? [unitVersionArchive(old), ...unitHistory(old).map(unitVersionArchive)] : [])
    .filter(version => version.revision !== next.revision)
    .slice(0, MAX_UNIT_HISTORY);
  // `previous` is derived on read: storing it as well would duplicate the newest archive.
  const pack = (): string => JSON.stringify({ ...unitVersionArchive(next), history: history.length ? history : undefined } as BuiltUnit);
  let value = pack();
  // Drop the oldest restorable versions rather than fail the save on an oversized row.
  while (value.length > MAX_UNIT_PACK_BYTES && history.length > 1) { history.pop(); value = pack(); }
  return value;
}

const SELF_ASSESSMENT_INTRO = [
  "You are now ready to go through a check list. Be honest with yourself.",
  "Tick the box with either a √ or an X to indicate your response.",
];
const SELF_ASSESSMENT_OUTRO = [
  "You must think about any point you could not tick. Write this down as a goal.",
  "Decide on a plan of action to achieve these goals. Regularly review these goals.",
];

function lessonPlanTemplate(us: string, content: UnitContent): UnitContent["lessonPlan"] {
  const topics = content.lesson.filter(section => section.heading);
  const topicRows = topics.map((section, index) => {
    const detail = (section.paragraphs ?? []).map(p => p.trim()).filter(Boolean);
    return {
      time: "25 minutes",
      title: `${section.heading} — Facilitator & Class`,
      bullets: [`Read through the learner material and facilitate discussion on ${section.heading.toLowerCase()}.`],
      ...(detail.length ? { text: detail } : {}),
      resources: [`LM p${Math.max(4, index + 4)}`],
    };
  });
  return {
    title: "Facilitator Preparation",
    startTime: "09:00",
    details: [
      { icon: "calendar", label: "Date", value: "Friday, 17 July 2026" },
      { icon: "clock", label: "Time", value: "09:00 – 14:00 · lunch 12:00 – 13:00" },
      { icon: "globe", label: "Venue", value: "Investec, Sandton, Johannesburg" },
      { icon: "presenter", label: "Facilitator", value: "Andre Snell" },
    ],
    prep: [
      "Study the notes in this lesson plan carefully to ensure preparation is done before the start of classes.",
      "Study the learner materials so that you are familiar with the topics that will be covered in this part of the course.",
    ],
    sections: [
      {
        rows: [
          { title: "Room Set Up", text: ["Ensure venue and equipment needed is ready."] },
          {
            time: "20 minutes",
            title: "Meet, Greet & Seat",
            text: [
              "Learners to get out their stationery and settle. Allow learners to sign the class register OR check learners against the class register.",
              "Explain the parking bay to the learners where they can ask questions and it will be parked until the class has been completed, and then attended to.",
            ],
            resources: ["Class Register", "LM p1"],
          },
        ],
      },
      {
        heading: `Unit Standard ${us}`,
        rows: [
          {
            time: "25 minutes",
            title: "Index & Unit Standard Alignment — Facilitator",
            text: [
              "Read through the index with the learners, highlighting the areas that will be covered in this manual. Make reference to the Unit Standard Alignment Index to outline the specific outcomes that will be covered.",
            ],
            resources: ["LM p3"],
          },
          ...topicRows.slice(0, Math.max(1, Math.ceil(topicRows.length / 2))),
          { time: "10 minutes", title: "Break", break: true },
          ...topicRows.slice(Math.max(1, Math.ceil(topicRows.length / 2))),
          { time: "60 minutes", title: "Lunch", break: true },
          {
            time: "10 minutes",
            title: "Self-Assessment — Learners individually",
            bullets: [
              "Explain to the learners that they have to judge their own knowledge gained in the unit by ticking the blocks they feel competent with.",
              "Allow the learners to tick the blocks and take feedback from each learner.",
              "Identify those learners who have shortcomings and assist them with fulfilling the requirements.",
            ],
            resources: ["LM p12"],
          },
          {
            time: "10 minutes",
            title: "Parking Bay — Facilitator",
            bullets: [
              "Take all the questions from the learners and answer them individually.",
              "Ensure the entire class understands the questions posed by other learners.",
            ],
            resources: ["White Board"],
          },
          {
            time: "10 minutes",
            title: "Closing — Facilitator",
            bullets: [
              "Thank the learners for their participation.",
              "Agree with them when the next facilitation session is scheduled for.",
            ],
          },
        ],
      },
    ],
  };
}

function isLegacyGeneratedActivity(activity: UnitContent["exercises"][number]): boolean {
  const oldLessonActivity = /^built-activity-\d+$/i.test(activity.id)
    && /^Activity \d+:/i.test(activity.title)
    && /^Work from the .* lesson section\. Apply its ideas to a realistic workplace example\.$/i.test(activity.task)
    && activity.steps.length === 3
    && activity.steps[0] === "Identify the main idea and explain it in your own words."
    && activity.steps[1] === "Describe a workplace situation where this knowledge is useful."
    && activity.steps[2] === "Show how you would apply the guidance and explain how you would check the result.";
  const oldQuestioningActivity = /^Questioning\s+[-–—]\s+Prepare a (?:time|cost) estimate for an element of work$/i.test(activity.title)
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

/**
 * Old builds shipped a lesson plan whose topic rows were nothing but the
 * boilerplate "Read through the learner material…" bullet. Only those are
 * regenerated; a plan pasted by the facilitator or built with real topic text
 * must be shown exactly as saved.
 */
function isLegacyGeneratedLessonPlan(plan: UnitContent["lessonPlan"], planSource?: string): boolean {
  if (!plan?.sections?.length || !plan.sections.some(section => section.rows?.length)) return true;
  if (planSource?.trim()) return false;
  const topicRows = plan.sections.flatMap(section => section.rows).filter(row => /—\s*Facilitator & Class$/.test(row.title ?? ""));
  if (!topicRows.length) return false;
  return topicRows.every(row =>
    !row.text?.length
    && row.bullets?.length === 1
    && /^Read through the learner material and facilitate discussion on /.test(row.bullets[0]));
}

function cleanLegacyGeneratedContent<T extends BuiltUnit | BuiltUnitVersion>(unit: T, us: string): T {
  const content = unit.content;
  if (!content) return unit;
  const cleaned: UnitContent = {
    ...content,
    evaluation: content.evaluation,
    lessonPlan: isLegacyGeneratedLessonPlan(content.lessonPlan, unit.planSource) ? lessonPlanTemplate(us, content) : content.lessonPlan,
    selfAssessment: content.selfAssessment ? {
      ...content.selfAssessment,
      intro: content.selfAssessment.intro ?? SELF_ASSESSMENT_INTRO,
      outro: content.selfAssessment.outro ?? SELF_ASSESSMENT_OUTRO,
    } : content.selfAssessment,
    exercises: content.exercises.filter(activity => !isLegacyGeneratedActivity(activity)),
    questionSessions: (content.questionSessions ?? []).filter(activity => !isLegacyGeneratedQuestionSession(activity)),
    studyNotes: content.studyNotes,
  };
  return { ...unit, content: cleaned, ...restorableVersions(unit, us) } as T;
}

/** Clean every restorable version, upgrading legacy single-`previous` packs to a history list. */
function restorableVersions(unit: BuiltUnit | BuiltUnitVersion, us: string): { previous?: BuiltUnitVersion; history?: BuiltUnitVersion[] } {
  const stored = "history" in unit && unit.history?.length
    ? unit.history
    : "previous" in unit && unit.previous ? [unit.previous] : [];
  if (!stored.length) return { previous: undefined, history: undefined };
  const history = stored.slice(0, MAX_UNIT_HISTORY).map(version => unitVersionArchive(cleanLegacyGeneratedContent(version, us)));
  return { previous: history[0], history };
}

export const builtUnitKey = (us: string) => `itss.unitbuilder.${courseScopedUnit(us)}.shared`;
export function readBuiltUnit(us: string): BuiltUnit | undefined {
  try {
    if (typeof localStorage === "undefined") return;
    const data = JSON.parse(unitPackSnapshot(builtUnitKey(us)) ?? "null");
    return data?.content?.lesson && data?.revision && data?.files ? cleanLegacyGeneratedContent(data, us) : undefined;
  } catch { return undefined; }
}
