import type { UnitContent, UnitStandard, LessonSection } from "../types";
import { getContent } from "../data/content";
import { lessonTableMarkdown, parseLessonTextBlocks } from "./lessonTables";

export const MAX_SOURCE_LENGTH = 120_000;
export type BuildOptions = { minutes: number };
export type UnitTopic = { heading: string; paragraphs: string[] };
const normal = (text: string) => text.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();

/** Preserve the supplied words. Headings and paragraph boundaries drive structure. */
export function parseUnitSource(source: string): UnitTopic[] {
  const text = normal(source);
  if (text.length < 100) throw new Error("Add at least 100 characters of teaching content before building.");
  if (text.length > MAX_SOURCE_LENGTH) throw new Error("Split this source into a smaller document (maximum 120,000 characters).");
  const topics: UnitTopic[] = [];
  let current: UnitTopic = { heading: "Introduction", paragraphs: [] };
  const flush = () => { if (current.paragraphs.length) topics.push(current); };
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    const heading = /^(?:#{1,6}\s+|(?:lesson|section|topic|module)\s+\d+[\s:.-])/i.test(first) || (first.length < 100 && /:$/.test(first));
    if (heading) {
      flush();
      current = { heading: first.replace(/^#+\s*/, "").replace(/:$/, ""), paragraphs: [] };
      if (lines.length > 1) current.paragraphs.push(lines.slice(1).join("\n").trim());
    } else current.paragraphs.push(block.trim());
  }
  flush();
  if (!topics.length) throw new Error("No teaching paragraphs were found. Include text below each heading.");
  // Divide long sections at paragraph/sentence boundaries without dropping source text.
  const result: UnitTopic[] = [];
  for (const topic of topics) {
    const tableAwareParagraphs = parseLessonTextBlocks(topic.paragraphs).map(block =>
      block.kind === "table" ? lessonTableMarkdown(block) : block.text
    );
    const parts = tableAwareParagraphs.flatMap(p => p.length > 1800 && !/^\|[\s\S]+\|\s*$/m.test(p)
      ? (p.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [p]).map(s => s.trim())
      : [p]);
    let chunk: string[] = [];
    let part = 0;
    for (let i = 0; i < parts.length; i++) {
      const paragraph = parts[i];
      const nextParagraph = parts[i + 1];
      // A numbered subheading belongs with the prose it introduces. Treat the
      // pair as one chunking unit while preserving both paragraph boundaries.
      // Sentence-like steps and consecutive numbered items remain independent.
      const keepWithNext = (paragraph.length <= 160
        && /^\d+(?:\.\d+)*[.)]?\s+\S/.test(paragraph)
        && !/[.!?]\s*$|\n/.test(paragraph)
        && nextParagraph !== undefined
        && !/^\d+(?:\.\d+)*[.)]?\s+\S/.test(nextParagraph))
        || (/:$/.test(paragraph.trim()) && nextParagraph !== undefined && nextParagraph.length <= 140);
      const group: string[] = [paragraph];
      if (/:$/.test(paragraph.trim())) {
        let k = i + 1;
        while (k < parts.length && parts[k].length <= 140 && !/^\d+(?:\.\d+)*[.)]?\s+\S/.test(parts[k].trim())) group.push(parts[k++]);
        if (group.length > 1) i = k - 1;
      } else if (keepWithNext) group.push(nextParagraph);
      // Keep the supplied section together on one lesson slide. The lesson
      // view can scroll; splitting here separates headings and their points.
      chunk.push(...group);
      if (keepWithNext && !/:$/.test(paragraph.trim())) i++;
    }
    if (chunk.length) result.push({ heading: `${topic.heading}${part ? ` (continued ${part + 1})` : ""}`, paragraphs: chunk });
  }
  if (result.length > 80) throw new Error("This source produces more than 80 lesson sections. Split it into smaller units.");
  return result;
}

export type UnitContentEnhancement = {
  overview?: UnitContent["saqa"];
  saqa?: UnitContent["saqa"];
  logbook?: UnitContent["logbook"];
  evaluation?: UnitContent["evaluation"];
  selfAssessment?: UnitContent["selfAssessment"];
  lessonPlan?: UnitContent["lessonPlan"];
  exercises?: UnitContent["exercises"];
  questionSessions?: UnitContent["questionSessions"];
  assignments?: UnitContent["assignments"];
  quiz?: UnitContent["quiz"];
};

const nonemptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const nonemptyArray = <T,>(value: unknown): value is T[] => Array.isArray(value) && value.length > 0;

function stableId(prefix: string, title: string, index: number): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56);
  return `${prefix}-${index + 1}-${slug || "activity"}`;
}

function normalizeActivities<T extends { id: string; title: string; steps?: string[]; checks?: unknown[] }>(items: T[] | undefined, prefix: string): T[] | undefined {
  if (!items?.length) return items;
  return items.map((item, index) => ({ ...item, id: stableId(prefix, item.title, index) }));
}

const STANDARD_LOGBOOK_DETAIL_FIELDS = [
  "Learner Name",
  "Qualification",
  "Group / Class",
  "Workplace Name",
  "Supervisor / Mentor",
  "Start & Completion Date",
];
const KNOWLEDGE_MARKS = [true, false, false, true, false, false];
const PRACTICAL_MARKS = [false, true, false, false, true, false];
const PROJECT_MARKS = [true, true, true, true, true, true];

function normalizeMarks(value: unknown, fallback: boolean[]): boolean[] {
  const marks = Array.isArray(value) ? value.slice(0, 6).map(Boolean) : [];
  while (marks.length < 6) marks.push(fallback[marks.length] ?? false);
  return marks;
}

function normalizeLogbookSpec(unit: UnitStandard, logbook: UnitContent["logbook"]): UnitContent["logbook"] {
  if (!logbook) return logbook;
  const projectName = unit.us || logbook.unitLabel || unit.title;
  return {
    ...logbook,
    assignmentTitle: logbook.assignmentTitle?.trim() || "Assignment One",
    programme: logbook.programme?.trim() || "Information Technology - Systems Support",
    unitLabel: logbook.unitLabel?.trim() || `${unit.us} - ${unit.title}`,
    detailFields: STANDARD_LOGBOOK_DETAIL_FIELDS,
    project: {
      time: logbook.project?.time?.trim() || "30 minutes",
      title: logbook.project?.title?.trim() || "Project",
      text: logbook.project?.text?.trim() || "Complete the workplace project and attach the evidence to this logbook.",
      resource: logbook.project?.resource?.trim() || "Logbook",
    },
    knowledgeQuestions: (logbook.knowledgeQuestions ?? []).map(row => ({
      text: row.text,
      marks: normalizeMarks(row.marks, KNOWLEDGE_MARKS),
    })),
    practicalActivities: (logbook.practicalActivities ?? []).map((row, index, rows) => ({
      text: row.text,
      marks: normalizeMarks(row.marks, rows.length === 1 ? PROJECT_MARKS : PRACTICAL_MARKS),
    })),
    workplaceActivities: logbook.workplaceActivities?.length ? logbook.workplaceActivities : (logbook.practicalActivities ?? []).map(row => row.text),
    workplaceEvidenceNote: logbook.workplaceEvidenceNote?.trim() || "The workplace completes this section after observing the learner having complied to and completed all the activities as mentioned below.",
    otherActivities: logbook.otherActivities?.length ? logbook.otherActivities : [{ activity: logbook.project?.title || "Workplace project", evidence: logbook.project?.text || "Attach the completed workplace evidence." }],
    otherEvidenceNote: logbook.otherEvidenceNote?.trim() || "Learner evidence and experience is recorded here. Make reference to equipment, tools, materials or systems that were used in these processes.",
    projectChecklist: [{ no: "1", name: projectName }],
  };
}

function selfAssessmentFromTemplate(items: string[]): UnitContent["selfAssessment"] {
  const template = getContent("8252")?.selfAssessment;
  return {
    intro: [...(template?.intro ?? [
      "You are now ready to go through a check list. Be honest with yourself.",
      "Tick the box with either a √ or an X to indicate your response.",
    ])],
    items,
    outro: [...(template?.outro ?? [
      "You must think about any point you could not tick. Write this down as a goal.",
      "Decide on a plan of action to achieve these goals. Regularly review these goals.",
    ])],
  };
}

function lessonPlanFromTemplate(unit: UnitStandard, topics: UnitTopic[], minutes: number): UnitContent["lessonPlan"] {
  const template = getContent("8252")?.lessonPlan;
  const setupRows = structuredClone(template?.sections?.[0]?.rows ?? [
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
  ]);
  const topicMinutes = Math.max(10, Math.floor((minutes - 120) / Math.max(1, topics.length)));
  const topicRows = topics.map((topic, index) => ({
    time: `${topicMinutes} minutes`,
    title: `${topic.heading} — Facilitator & Class`,
    bullets: [
      `Read through the learner material and facilitate discussion on ${topic.heading.toLowerCase()}.`,
    ],
    resources: [`LM p${Math.max(4, index + 4)}`],
  }));
  return {
    title: template?.title ?? "Facilitator Preparation",
    startTime: template?.startTime ?? "09:00",
    details: structuredClone(template?.details ?? [
      { icon: "calendar", label: "Date", value: "Friday, 17 July 2026" },
      { icon: "clock", label: "Time", value: "09:00 – 14:00 · lunch 12:00 – 13:00" },
      { icon: "globe", label: "Venue", value: "Investec, Sandton, Johannesburg" },
      { icon: "presenter", label: "Facilitator", value: "Andre Snell" },
    ]),
    prep: structuredClone(template?.prep ?? [
      "Study the notes in this lesson plan carefully to ensure preparation is done before the start of classes.",
      "Study the learner materials so that you are familiar with the topics that will be covered in this part of the course.",
    ]),
    sections: [
      { rows: setupRows },
      {
        heading: `Unit Standard ${unit.us}`,
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

export function mergeUnitContentEnhancement(base: UnitContent, enhancement: UnitContentEnhancement, unit: UnitStandard): UnitContent {
  const next = structuredClone(base);
  const overview = enhancement.overview ?? enhancement.saqa;
  if (overview?.sections?.length && overview.registration?.length) next.saqa = overview;
  if (enhancement.logbook?.knowledgeQuestions?.length && enhancement.logbook.practicalActivities?.length) next.logbook = normalizeLogbookSpec(unit, enhancement.logbook);
  next.evaluation = undefined;
  if (enhancement.selfAssessment?.items?.length) next.selfAssessment = selfAssessmentFromTemplate(enhancement.selfAssessment.items);
  if (enhancement.lessonPlan?.sections?.length) next.lessonPlan = lessonPlanFromTemplate(unit, next.lesson.map(section => ({ heading: section.heading, paragraphs: section.paragraphs })), enhancement.lessonPlan.details?.length ? Number(enhancement.lessonPlan.details.find(detail => /duration/i.test(detail.label))?.value.match(/\d+/)?.[0] ?? 300) : 300);
  next.exercises = [];
  next.questionSessions = [];
  if (nonemptyArray(enhancement.assignments)) next.assignments = enhancement.assignments;
  next.quiz = [];
  next.quizzes = undefined;
  next.lesson = next.lesson.map(section => ({ ...section, slideQuiz: undefined, quizGate: undefined }));
  validateUnitContent(next);
  return next;
}
export function buildUnitContent(unit: UnitStandard, source: string, options: BuildOptions): UnitContent {
  const topics = parseUnitSource(source);
  // Use the same section-title/lesson-flat layout as the completed report unit.
  // A source topic is a section, not a new lesson with a repeated banner.
  const lesson: LessonSection[] = topics.map(topic => ({ ...topic, icon: "presenter", flat: true }));
  const goals = topics.map(t => `Explain and apply ${t.heading.toLowerCase()}, using examples from the supplied material.`);
  return {
    lesson, exercises: [],
    questionSessions: [],
    assignments: [{ id: "built-workplace-project", title: `Workplace project: ${unit.title}`, brief: "Choose a realistic unit of work relevant to this learning material. Prepare a practical plan and explain your decisions using the source.", requirements: goals.concat(["Document assumptions, resources, dependencies and delivery risks.", "Submit your plan, supporting evidence and a short reflection on the result."]), evidence: "A completed workplace plan, supporting calculations or records, and a reflection reviewed by your facilitator." }],
    quiz: [],
    saqa: { notice: "Learning pack assembled from the supplied source. Confirm official outcomes and assessment requirements with the registered unit standard.", registration: [{ label: "SAQA US ID", value: unit.us }, { label: "Unit standard title", value: unit.title }, { label: "NQF level", value: String(unit.nqf) }, { label: "Credits", value: String(unit.credits) }], sections: [
      { heading: "Purpose of the unit standard", icon: "target", paragraphs: [topics[0].paragraphs[0]] },
      { heading: "Unit standard range", icon: "folder", bullets: topics.map(t=>t.heading) },
      { heading: "Learning outcomes", icon: "checklist", bullets: goals },
      { heading: "Essential embedded knowledge", icon: "book", bullets: topics.map(t=>`${t.heading}: ${t.paragraphs[0]}`) },
      { heading: "Assessor criteria — evidence required", icon: "checklist", bullets: ["Completed practical activities supported by the supplied learning material.", "Workplace project and supporting evidence.", "Knowledge-check answers, self assessment and a completed workplace logbook."] },
    ] },
    logbook: normalizeLogbookSpec(unit, { assignmentTitle: "Assignment One", programme: "Information Technology - Systems Support", unitLabel: `${unit.us} - ${unit.title}`, detailFields: STANDARD_LOGBOOK_DETAIL_FIELDS, project: { time: "30 minutes", title: "Workplace application", text: "Apply the unit learning in the workplace and record evidence against the activities below.", resource: "Logbook" }, knowledgeQuestions: goals.map(text => ({ text, marks: KNOWLEDGE_MARKS })), practicalActivities: goals.map(text => ({ text, marks: PROJECT_MARKS })), workplaceActivities: goals, workplaceEvidenceNote: "The workplace completes this section after observing the learner having complied to and completed all the activities as mentioned below.", otherActivities: [{ activity: "Workplace application", evidence: "Apply the unit learning in the workplace and record evidence against the activities below." }], otherEvidenceNote: "Learner evidence and experience is recorded here. Make reference to equipment, tools, materials or systems that were used in these processes.", projectChecklist: [{ no: "1", name: unit.us }] }),
    selfAssessment: selfAssessmentFromTemplate(goals.map(g => `I am able to ${g.charAt(0).toLowerCase()}${g.slice(1)}`)),
    lessonPlan: lessonPlanFromTemplate(unit, topics, options.minutes),
  };
}

/** Validate the editable pack before replacing any saved content. */
export function validateUnitContent(content: UnitContent): void {
  const nonempty = (s: unknown) => typeof s === "string" && s.trim().length > 0;
  if (!content.lesson?.length || !content.assignments?.length) throw new Error("Keep at least one lesson and assignment.");
  for (const s of content.lesson) if (!nonempty(s.heading) || !s.paragraphs?.some(nonempty)) throw new Error("Every lesson needs a title and teaching text.");
  for (const q of [...content.quiz, ...content.lesson.flatMap(s => s.slideQuiz ?? []), ...(content.quizzes ?? []).flatMap(q => q.questions)]) {
    if (!nonempty(q.q) || q.options?.length < 2 || !q.options.every(nonempty) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length || !nonempty(q.explain)) throw new Error("Every quiz question needs text, answer options, a valid correct answer and an explanation.");
  }
  for (const list of [content.exercises, content.assignments, content.questionSessions ?? [], content.quizzes ?? []]) {
    const ids = list.map(item => item.id);
    if (ids.some(id => !nonempty(id)) || new Set(ids).size !== ids.length) throw new Error("Activities and quizzes must have unique IDs.");
  }
  if (!content.logbook || !content.lessonPlan?.sections.length || !content.selfAssessment?.items.length || !content.saqa) throw new Error("Overview, notes, logbook, lesson plan and self assessment must all have content.");
}




