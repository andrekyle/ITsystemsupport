import type { PoeDoc, UnitContent } from "../types";
import { unitPackSnapshot } from "./unitStorage";

export type UnitFiles = { pdf: PoeDoc; pptx: PoeDoc; answers: PoeDoc; material?: PoeDoc; materialEditable?: PoeDoc };
export type BuiltUnitVersion = { revision: string; source: string; content: UnitContent; files: UnitFiles; createdAt: string; aiUsed: boolean };
export type BuiltUnit = BuiltUnitVersion & { previous?: BuiltUnitVersion };

const SELF_ASSESSMENT_INTRO = [
  "You are now ready to go through a check list. Be honest with yourself.",
  "Tick the box with either a √ or an X to indicate your response.",
];
const SELF_ASSESSMENT_OUTRO = [
  "You must think about any point you could not tick. Write this down as a goal.",
  "Decide on a plan of action to achieve these goals. Regularly review these goals.",
];

function lessonPlanTemplate(us: string, content: UnitContent): UnitContent["lessonPlan"] {
  const topics = content.lesson.map(section => section.heading).filter(Boolean);
  const topicRows = topics.map((heading, index) => ({
    time: "25 minutes",
    title: `${heading} — Facilitator & Class`,
    bullets: [`Read through the learner material and facilitate discussion on ${heading.toLowerCase()}.`],
    resources: [`LM p${Math.max(4, index + 4)}`],
  }));
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

function cleanLegacyGeneratedContent<T extends BuiltUnit | BuiltUnitVersion>(unit: T, us: string): T {
  const content = unit.content;
  if (!content) return unit;
  const cleaned: UnitContent = {
    ...content,
    evaluation: undefined,
    lessonPlan: lessonPlanTemplate(us, content),
    selfAssessment: content.selfAssessment ? {
      ...content.selfAssessment,
      intro: SELF_ASSESSMENT_INTRO,
      outro: SELF_ASSESSMENT_OUTRO,
    } : content.selfAssessment,
    exercises: content.exercises.filter(activity => !isLegacyGeneratedActivity(activity)),
    questionSessions: (content.questionSessions ?? []).filter(activity => !isLegacyGeneratedQuestionSession(activity)),
    studyNotes: undefined,
  };
  return { ...unit, content: cleaned, previous: "previous" in unit && unit.previous ? cleanLegacyGeneratedContent(unit.previous, us) : undefined } as T;
}

export const builtUnitKey = (us: string) => `itss.unitbuilder.${us}.shared`;
export function readBuiltUnit(us: string): BuiltUnit | undefined {
  try {
    if (typeof localStorage === "undefined") return;
    const data = JSON.parse(unitPackSnapshot(builtUnitKey(us)) ?? "null");
    return data?.content?.lesson && data?.revision && data?.files ? cleanLegacyGeneratedContent(data, us) : undefined;
  } catch { return undefined; }
}
