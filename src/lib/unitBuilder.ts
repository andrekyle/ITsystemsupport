import type { UnitContent, UnitStandard, QuizQuestion, LessonSection } from "../types";
import { lessonTableMarkdown, parseLessonTextBlocks } from "./lessonTables";

export const MAX_SOURCE_LENGTH = 120_000;
export type BuildOptions = { questions: number; minutes: number };
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

/** Deterministic source-completion questions, with answers quoted from the source. */
export function makeSourceQuiz(topics: UnitTopic[], count: number): QuizQuestion[] {
  const sentences = topics.flatMap(t => t.paragraphs.flatMap(p => p.match(/[^.!?\n]+[.!?]?/g) ?? [p])).map(s => s.trim()).filter(s => s.length >= 35 && s.length <= 500);
  const vocabulary = [...new Set(sentences.flatMap(s => s.match(/[A-Za-z][A-Za-z-]{5,}/g) ?? []))];
  const questions: QuizQuestion[] = [];
  const used = new Set<string>();
  for (const sentence of sentences) {
    const words = (sentence.match(/[A-Za-z][A-Za-z-]{5,}/g) ?? []).sort((a, b) => b.length - a.length);
    const word = words.find(w => !used.has(w.toLowerCase()));
    if (!word) continue;
    const others = vocabulary.filter(w => w.toLowerCase() !== word.toLowerCase() && !sentence.toLowerCase().includes(w.toLowerCase())).slice(0, 3);
    if (others.length < 3) continue;
    const answer = questions.length % 4;
    const options = [...others]; options.splice(answer, 0, word);
    questions.push({ q: `Complete this statement from the learning material: “${sentence.replace(word, "_____") }”`, options, answer, explain: `Source: ${sentence}` });
    used.add(word.toLowerCase());
    if (questions.length === count) break;
  }
  if (questions.length < 3) throw new Error("The source needs more explanatory sentences to build at least three meaningful quiz questions. Add more teaching content.");
  return questions;
}


export type UnitContentEnhancement = {
  overview?: UnitContent["saqa"];
  saqa?: UnitContent["saqa"];
  logbook?: UnitContent["logbook"];
  evaluation?: UnitContent["evaluation"];
  selfAssessment?: UnitContent["selfAssessment"];
  lessonPlan?: UnitContent["lessonPlan"];
  studyNotes?: UnitContent["studyNotes"];
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

export function mergeUnitContentEnhancement(base: UnitContent, enhancement: UnitContentEnhancement): UnitContent {
  const next = structuredClone(base);
  const overview = enhancement.overview ?? enhancement.saqa;
  if (overview?.sections?.length && overview.registration?.length) next.saqa = overview;
  if (enhancement.logbook?.knowledgeQuestions?.length && enhancement.logbook.practicalActivities?.length) next.logbook = enhancement.logbook;
  if (enhancement.evaluation?.questions?.length && nonemptyString(enhancement.evaluation.intro)) next.evaluation = enhancement.evaluation;
  if (enhancement.selfAssessment?.items?.length) next.selfAssessment = enhancement.selfAssessment;
  if (enhancement.lessonPlan?.sections?.length) next.lessonPlan = enhancement.lessonPlan;
  if (nonemptyArray(enhancement.studyNotes)) next.studyNotes = enhancement.studyNotes;
  if (nonemptyArray(enhancement.exercises)) next.exercises = normalizeActivities(enhancement.exercises, "activity")!;
  if (nonemptyArray(enhancement.questionSessions)) next.questionSessions = normalizeActivities(enhancement.questionSessions, "question-session")!;
  if (nonemptyArray(enhancement.assignments)) next.assignments = enhancement.assignments;
  if (nonemptyArray(enhancement.quiz)) next.quiz = enhancement.quiz;
  validateUnitContent(next);
  return next;
}

export function buildUnitContent(unit: UnitStandard, source: string, options: BuildOptions): UnitContent {
  const topics = parseUnitSource(source);
  const count = Math.min(10, Math.max(3, options.questions));
  const quiz = makeSourceQuiz(topics, count);
  // Use the same section-title/lesson-flat layout as the completed report unit.
  // A source topic is a section, not a new lesson with a repeated banner.
  const lesson: LessonSection[] = topics.map(topic => ({ ...topic, icon: "presenter", flat: true }));
  const goals = topics.map(t => `Explain and apply ${t.heading.toLowerCase()}, using examples from the supplied material.`);
  const exercises = topics.map((t, i) => ({
    id: `built-activity-${i + 1}`, title: `Activity ${i + 1}: ${t.heading}`,
    task: `Work from the “${t.heading}” lesson section. Apply its ideas to a realistic workplace example.`,
    scenario: t.paragraphs.slice(0, 1),
    steps: ["Identify the main idea and explain it in your own words.", "Describe a workplace situation where this knowledge is useful.", "Show how you would apply the guidance and explain how you would check the result."],
    modelAnswer: [{ heading: "Source reference for the facilitator", paragraphs: t.paragraphs }],
  }));
  // US 114059 includes two practical tasks in the supplied source. Keep the
  // instructions in the Activity tab rather than repeating them on lesson slides.
  if (unit.us === "114059" && /Prepare a time estimate for an element of work/i.test(source)) {
    const activityLines = [
      { title: "Questioning — Prepare a time estimate for an element of work", time: "45 minutes", task: "Prepare a time estimate for an element of work. Explain how the estimate is based on a breakdown of the component into logical parts, including implementation and testing of interfaces to other components where applicable." },
      { title: "Questioning — Prepare a cost estimate for an element of work", time: "90 minutes", task: "Prepare a cost estimate for an element of work. Use the Japanese construction firm cost-estimation extract as a worked reference; monetary values may differ from South Africa, but the calculation method remains useful." },
    ];
    for (const [index, activity] of activityLines.entries()) exercises.push({
      id: `built-questioning-${index + 1}`,
      title: activity.title,
      task: `${activity.task} Time: ${activity.time} · Activity: Self & Group`,
      scenario: [activity.task],
      steps: ["Break the work element into logical parts and record the assumptions.", "Include interface implementation and testing where applicable.", "Present the estimate and explain how the figures were calculated."],
      modelAnswer: [{ heading: "Facilitator reference", paragraphs: [activity.task] }],
    });
    const remove = /^(?:Questioning|Prepare a time estimate for an element of work|Prepare a cost estimate for an element of work|Time:\s*\d+\s*minutes\s*Activity:\s*Self\s*&\s*Group|Explain how the time estimate.*|The following is an extract from a Japanese construction firms.*)$/i;
    for (const section of lesson) section.paragraphs = section.paragraphs.filter(paragraph => !remove.test(paragraph.trim()));
  }
  return {
    lesson, exercises,
    questionSessions: [{ id: "built-discussion", title: "Knowledge and reflection", task: "Use the unit material to support each answer.", steps: topics.map(t => `What are the key points in “${t.heading}”, and why do they matter at work?`), modelAnswer: topics.map(t => ({ heading: t.heading, paragraphs: t.paragraphs })) }],
    assignments: [{ id: "built-workplace-project", title: `Workplace project: ${unit.title}`, brief: "Choose a realistic unit of work relevant to this learning material. Prepare a practical plan and explain your decisions using the source.", requirements: goals.concat(["Document assumptions, resources, dependencies and delivery risks.", "Submit your plan, supporting evidence and a short reflection on the result."]), evidence: "A completed workplace plan, supporting calculations or records, and a reflection reviewed by your facilitator." }],
    quiz,
    saqa: { notice: "Learning pack assembled from the supplied source. Confirm official outcomes and assessment requirements with the registered unit standard.", registration: [{ label: "SAQA US ID", value: unit.us }, { label: "Unit standard title", value: unit.title }, { label: "NQF level", value: String(unit.nqf) }, { label: "Credits", value: String(unit.credits) }], sections: [
      { heading: "Purpose of the unit standard", icon: "target", paragraphs: [topics[0].paragraphs[0]] },
      { heading: "Unit standard range", icon: "folder", bullets: topics.map(t=>t.heading) },
      { heading: "Learning outcomes", icon: "checklist", bullets: goals },
      { heading: "Essential embedded knowledge", icon: "book", bullets: topics.map(t=>`${t.heading}: ${t.paragraphs[0]}`) },
      { heading: "Assessor criteria — evidence required", icon: "checklist", bullets: ["Completed practical activities supported by the supplied learning material.", "Workplace project and supporting evidence.", "Knowledge-check answers, self assessment and a completed workplace logbook."] },
    ] },
    logbook: { assignmentTitle: unit.title, programme: "IT Systems Support", unitLabel: `US ${unit.us}`, detailFields: ["Learner name", "Workplace", "Supervisor", "Date"], project: { time: "Record actual hours", title: "Workplace application", text: "Apply the unit learning in the workplace and record evidence against the activities below.", resource: "Source material, workplace procedures and supervisor feedback" }, knowledgeQuestions: goals.map(text => ({ text, marks: [true, true, false, true, false, false] })), practicalActivities: exercises.map(e => ({ text: e.title, marks: [true, true, true, false, true, true] })), workplaceActivities: goals, workplaceEvidenceNote: "Attach dated evidence and obtain supervisor verification.", otherActivities: [{ activity: "Review and reflection", evidence: "A short reflection and supervisor feedback" }], otherEvidenceNote: "Record any additional relevant learning.", projectChecklist: exercises.map((e, i) => ({ no: String(i + 1), name: e.title })) },
    selfAssessment: { intro: ["Rate your readiness by ticking the skills you can demonstrate."], items: goals.map(g => `I can ${g.charAt(0).toLowerCase()}${g.slice(1)}`), outro: ["Revisit any unticked areas and ask the facilitator for help."] },
    lessonPlan: { title: "Facilitator Preparation", startTime: "09:00", details: [{ icon: "clock", label: "Planned duration", value: `${options.minutes} minutes` }], prep: ["Read the source material and check that examples fit your learners' workplace.", "Prepare the generated handout and slides; review the answer key before delivery."], sections: [{ rows: [{ title: "Room Set Up", text: ["Prepare the venue, equipment, learner handout and presentation."] }, { time: "10 min", title: "Meet, Greet & Seat", text: ["Welcome learners, check attendance and introduce the learning goals."] }] }, { heading: `Unit Standard ${unit.us}`, rows: [...topics.map(t => ({ time: `${Math.max(5, Math.floor((options.minutes - 30) / topics.length))} min`, title: `${t.heading} \u2014 Facilitator & Class`, text: ["Explain the source material, discuss a workplace example, then complete the linked activity."], resources: ["Generated slides", "Learner handout"] })), { time: "20 min", title: "Knowledge check and reflection", text: ["Complete the quiz, discuss answers, update the logbook, and submit the lesson evaluation."] }] }] },
    studyNotes: topics.map(t => ({ title: t.heading, text: t.paragraphs.join("\n\n") })),
    evaluation: { intro: "Help improve this unit by reflecting on the content and delivery.", questions: ["Which part was most useful for your work?", "Which topic needs more explanation?", "How will you apply what you learned?", "What would improve the activities or training materials?"] },
  };
}

/** Validate the editable pack before replacing any saved content. */
export function validateUnitContent(content: UnitContent): void {
  const nonempty = (s: unknown) => typeof s === "string" && s.trim().length > 0;
  if (!content.lesson?.length || !content.exercises?.length || !content.assignments?.length || !content.quiz?.length) throw new Error("Keep at least one lesson, activity, assignment and quiz question.");
  for (const s of content.lesson) if (!nonempty(s.heading) || !s.paragraphs?.some(nonempty)) throw new Error("Every lesson needs a title and teaching text.");
  for (const q of [...content.quiz, ...content.lesson.flatMap(s => s.slideQuiz ?? []), ...(content.quizzes ?? []).flatMap(q => q.questions)]) {
    if (!nonempty(q.q) || q.options?.length < 2 || !q.options.every(nonempty) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length || !nonempty(q.explain)) throw new Error("Every quiz question needs text, answer options, a valid correct answer and an explanation.");
  }
  for (const list of [content.exercises, content.assignments, content.questionSessions ?? [], content.quizzes ?? []]) {
    const ids = list.map(item => item.id);
    if (ids.some(id => !nonempty(id)) || new Set(ids).size !== ids.length) throw new Error("Activities and quizzes must have unique IDs.");
  }
  if (!content.logbook || !content.lessonPlan?.sections.length || !content.selfAssessment?.items.length || !content.saqa || !content.studyNotes?.length || !content.evaluation?.questions.length) throw new Error("Overview, notes, logbook, lesson plan, self assessment and evaluation must all have content.");
}
