import type { UnitContent, UnitStandard, LessonSection, LessonPlan, LessonPlanRow } from "../types";
import { getContent } from "../data/content";
import { lessonTableMarkdown, parseLessonTextBlocks } from "./lessonTables";

export const MAX_SOURCE_LENGTH = 120_000;
export const MAX_LESSON_PLAN_LENGTH = 40_000;
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

const DEFAULT_PLAN_TITLE = "Facilitator Preparation";
const DEFAULT_PLAN_START = "09:00";
const DEFAULT_PLAN_DETAILS: NonNullable<LessonPlan["details"]> = [
  { icon: "calendar", label: "Date", value: "Friday, 17 July 2026" },
  { icon: "clock", label: "Time", value: "09:00 – 14:00 · lunch 12:00 – 13:00" },
  { icon: "globe", label: "Venue", value: "Investec, Sandton, Johannesburg" },
  { icon: "presenter", label: "Facilitator", value: "Andre Snell" },
];
const DEFAULT_PLAN_PREP = [
  "Study the notes in this lesson plan carefully to ensure preparation is done before the start of classes.",
  "Study the learner materials so that you are familiar with the topics that will be covered in this part of the course.",
];
const PLAN_DETAIL_ICONS: [RegExp, string][] = [
  [/date|day/i, "calendar"],
  [/time|duration/i, "clock"],
  [/venue|location|room|site/i, "globe"],
  [/facilitator|trainer|assessor|presenter/i, "presenter"],
  [/group|class|learner|delegate/i, "people"],
  [/programme|program|course|module|unit/i, "book"],
];
const PLAN_DETAIL_KEYS = /^(date|day|time|session time|venue|location|room|facilitator|trainer|assessor|group|class|learners|duration|programme|program|course|module|unit standard)$/;
const planDetailIcon = (label: string) => PLAN_DETAIL_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? "document";
const isBreakTitle = (title: string) => /^(break|tea|coffee|comfort|lunch|refreshment)/i.test(title.trim());
const planClock = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

type PlanRowDraft = LessonPlanRow & { clock?: number };
type PlanSectionDraft = { heading?: string; startTime?: string; rows: PlanRowDraft[] };

/** Read "20 min | Meet & Greet", "09:00 – 09:20 Meet & Greet" or "09:00 Meet & Greet". */
function planRowFromHeader(line: string): PlanRowDraft | undefined {
  const range = line.match(/^(\d{1,2}):(\d{2})\s*(?:[–—-]|to)\s*(\d{1,2}):(\d{2})\s*(?:[|:–—-]\s*)?(.*)$/);
  if (range) {
    const start = Number(range[1]) * 60 + Number(range[2]);
    const minutes = Number(range[3]) * 60 + Number(range[4]) - start;
    return { clock: start, time: minutes > 0 ? `${minutes} minutes` : undefined, title: range[5].trim() };
  }
  const clock = line.match(/^(\d{1,2}):(\d{2})\s*(?:[|:–—-]\s*)?(\S.*)$/);
  if (clock) return { clock: Number(clock[1]) * 60 + Number(clock[2]), title: clock[3].trim() };
  const duration = line.match(/^(\d{1,3})\s*(min|mins|minute|minutes|hr|hrs|hour|hours)\b\s*(?:[|:–—-]\s*)?(.*)$/i);
  if (duration) {
    const minutes = /^h/i.test(duration[2]) ? Number(duration[1]) * 60 : Number(duration[1]);
    return { time: `${minutes} minutes`, title: duration[3].trim() };
  }
  return undefined;
}

const PLAN_RESOURCE_HINT = /^(?:lm|lg|learner manual|learner guide|facilitator guide|white ?board|flip ?chart|class register|register|logbook|log book|projector|data ?projector|laptop|handouts?|slides?|deck|training aids?|pp?t)\b/i;
/** Word tables put the resource cell on its own short line ("LM p4-6", "White Board"). */
const looksLikeResource = (line: string) => line.length <= 60 && (PLAN_RESOURCE_HINT.test(line) || /^p+\.?\s*\d/i.test(line));
const looksLikeTitle = (line: string) => line.length <= 90 && !/[.!?;:,]$/.test(line);

/**
 * Word and PDF lesson plans wrap inside table cells and mark cells bold. Re-join
 * lines with an unclosed bold marker ("**20" + "minutes**", or a wrapped title)
 * and drop the emphasis markers, keeping single "*" bullets intact.
 */
function normalizePlanLines(source: string): string[] {
  const merged: string[] = [];
  for (const raw of normal(source).replace(/\u00a0/g, " ").split("\n")) {
    const line = raw.trim();
    const previous = merged[merged.length - 1];
    const unclosed = previous !== undefined && ((previous.match(/\*\*/g)?.length ?? 0) % 2 === 1);
    if (unclosed && line) merged[merged.length - 1] = `${previous} ${line}`;
    else merged.push(line);
  }
  return merged.map(line => line.replace(/\*\*+/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim());
}

/**
 * Turn pasted facilitator notes into lesson plan sections. Times may be given as
 * durations or clock times, "# " starts a new section, "-", "*" and "·" lines are
 * bullets, and short trailing lines such as "Resources: LM p4" or "LM p4-6" list
 * the materials for the activity above. Hard-wrapped lines rejoin the entry above.
 */
function parseLessonPlanContent(source: string): { title?: string; startTime?: string; details: NonNullable<LessonPlan["details"]>; prep: string[]; sections: PlanSectionDraft[] } {
  const details: NonNullable<LessonPlan["details"]> = [];
  const prep: string[] = [];
  const sections: PlanSectionDraft[] = [];
  let title: string | undefined;
  let startTime: string | undefined;
  let section: PlanSectionDraft | undefined;
  let row: PlanRowDraft | undefined;
  let prepMode = false;
  let blankBefore = false;
  let lastKind: "title" | "text" | "bullet" | "resource" | undefined;
  const openSection = (heading?: string, sectionStart?: string) => {
    section = { heading, startTime: sectionStart, rows: [] };
    sections.push(section);
    row = undefined;
    prepMode = false;
  };
  const openRow = (draft: PlanRowDraft) => {
    if (!section) openSection();
    row = draft;
    section!.rows.push(row);
    prepMode = false;
    lastKind = draft.title ? "title" : undefined;
  };

  for (const line of normalizePlanLines(source)) {
    if (!line) { blankBefore = true; continue; }
    const afterBlank = blankBefore;
    blankBefore = false;

    const heading = line.match(/^#{1,6}\s*(.+)$/);
    if (heading) {
      const value = heading[1].trim();
      const clock = value.match(/[(@]\s*(\d{1,2}:\d{2})\s*\)?$/);
      openSection(value.replace(/[(@]\s*\d{1,2}:\d{2}\s*\)?$/, "").replace(/[-–—\s]+$/, "").trim() || undefined, clock?.[1]);
      continue;
    }

    const meta = !sections.length && line.match(/^([A-Za-z][A-Za-z /&]{1,28}):\s*(.*)$/);
    if (meta) {
      const key = meta[1].trim().toLowerCase();
      const value = meta[2].trim();
      if (/^(prep|preparation|facilitator preparation|before the session)$/.test(key)) { prepMode = true; if (value) prep.push(value); continue; }
      if (/^(title|plan title|lesson plan)$/.test(key)) { if (value) title = value; continue; }
      if (/^start(\s*time)?$/.test(key)) { startTime = value.match(/\d{1,2}:\d{2}/)?.[0] ?? startTime; continue; }
      if (PLAN_DETAIL_KEYS.test(key) && value) { details.push({ icon: planDetailIcon(key), label: meta[1].trim(), value }); prepMode = false; continue; }
    }

    const bullet = line.match(/^[-*•·]\s*(.*)$/);
    const body = bullet ? bullet[1].trim() : line;
    if (bullet) {
      if (prepMode && !sections.length) { if (body) prep.push(body); lastKind = "bullet"; continue; }
      if (row) { row.bullets = [...(row.bullets ?? []), body]; lastKind = "bullet"; continue; }
      if (!body) { lastKind = undefined; continue; }
    }

    const listed = body.match(/^(?:resources?|materials?|training aids?)\s*:\s*(.+)$/i);
    if (listed && row) {
      row.resources = [...(row.resources ?? []), ...listed[1].split(/[;,]/).map(item => item.trim()).filter(Boolean)];
      lastKind = "resource";
      continue;
    }

    // A standalone "Unit Standard 1234" line before any activity is the document's own
    // cover heading (Word exports it bold on its own row); the section already gets this
    // heading automatically, so drop the line instead of turning it into a spurious row.
    if (!row && !sections.length && /^unit standard\s+\S/i.test(body)) { continue; }

    const header = planRowFromHeader(body);
    if (header) { openRow(header); continue; }
    if (prepMode && !sections.length) { prep.push(body); lastKind = "text"; continue; }
    if (!row) { openRow({ title: body }); continue; }

    // A line that is not separated by a blank continues the entry it follows.
    if (!afterBlank && lastKind === "bullet" && row.bullets?.length) {
      row.bullets[row.bullets.length - 1] = `${row.bullets[row.bullets.length - 1]} ${body}`.trim();
      continue;
    }
    if (!afterBlank && lastKind === "text" && row.text?.length) {
      row.text[row.text.length - 1] = `${row.text[row.text.length - 1]} ${body}`.trim();
      continue;
    }
    if (!row.title) { row.title = body; lastKind = "title"; continue; }
    if (afterBlank && looksLikeResource(body)) { row.resources = [...(row.resources ?? []), body]; lastKind = "resource"; continue; }
    if (afterBlank && (row.text?.length || row.bullets?.length || row.resources?.length) && looksLikeTitle(body)) { openRow({ title: body }); continue; }
    row.text = [...(row.text ?? []), body];
    lastKind = "text";
  }

  const cleaned: PlanSectionDraft[] = [];
  for (const [index, draft] of sections.entries()) {
    // Word bullets arrive as a marker line followed by the wrapped text, so an
    // empty bullet only survives when the cell itself was empty.
    for (const item of draft.rows) {
      item.bullets = item.bullets?.map(entry => entry.trim()).filter(Boolean);
      item.text = item.text?.map(entry => entry.trim()).filter(Boolean);
      if (!item.bullets?.length) delete item.bullets;
      if (!item.text?.length) delete item.text;
    }
    const rows = draft.rows.filter(item => item.title.trim() || item.text?.length || item.bullets?.length);
    if (!rows.length) continue;
    rows.forEach((item, position) => {
      const next = rows[position + 1];
      if (!item.time && item.clock !== undefined && next?.clock !== undefined && next.clock > item.clock) item.time = `${next.clock - item.clock} minutes`;
    });
    if (rows[0].clock !== undefined) {
      const value = planClock(rows[0].clock);
      if (!index) startTime ??= value;
      else draft.startTime ??= value;
    }
    cleaned.push({
      heading: draft.heading,
      startTime: draft.startTime,
      rows: rows.map(({ clock: _clock, ...item }) => ({
        ...item,
        title: item.title.trim() || "Facilitated activity",
        ...(item.break || isBreakTitle(item.title) ? { break: true } : {}),
      })),
    });
  }
  return { title, startTime, details, prep, sections: cleaned };
}

/** Build the lesson plan tab from administrator-supplied facilitator notes. */
export function lessonPlanFromSource(unit: UnitStandard, source: string): LessonPlan | undefined {
  const parsed = parseLessonPlanContent(source);
  if (!parsed.sections.length) return undefined;
  const template = getContent("8252")?.lessonPlan;
  return {
    title: parsed.title ?? template?.title ?? DEFAULT_PLAN_TITLE,
    startTime: parsed.startTime ?? template?.startTime ?? DEFAULT_PLAN_START,
    details: parsed.details.length ? parsed.details : structuredClone(template?.details ?? DEFAULT_PLAN_DETAILS),
    prep: parsed.prep.length ? parsed.prep : structuredClone(template?.prep ?? DEFAULT_PLAN_PREP),
    sections: parsed.sections.map(section => ({
      ...section,
      heading: section.heading ?? (parsed.sections.length === 1 ? `Unit Standard ${unit.us}` : undefined),
    })),
  };
}

/** Keep an AI-written lesson plan when it has usable rows, otherwise fall back to the template. */
function lessonPlanFromEnhancement(plan: UnitContent["lessonPlan"], unit: UnitStandard): LessonPlan | undefined {
  const sections = (plan?.sections ?? [])
    .filter(section => Array.isArray(section?.rows))
    .map(section => ({
      heading: nonemptyString(section.heading) ? section.heading.trim() : undefined,
      startTime: nonemptyString(section.startTime) && /^\d{1,2}:\d{2}$/.test(section.startTime.trim()) ? section.startTime.trim() : undefined,
      rows: section.rows.filter(row => nonemptyString(row?.title)).map(row => {
        const text = (row.text ?? []).filter(nonemptyString).map(item => item.trim());
        const bullets = (row.bullets ?? []).filter(nonemptyString).map(item => item.trim());
        const resources = (row.resources ?? []).filter(nonemptyString).map(item => item.trim());
        return {
          ...(nonemptyString(row.time) ? { time: row.time.trim() } : {}),
          title: row.title.trim(),
          ...(row.break === true || isBreakTitle(row.title) ? { break: true } : {}),
          ...(text.length ? { text } : {}),
          ...(bullets.length ? { bullets } : {}),
          ...(resources.length ? { resources } : {}),
        };
      }),
    }))
    .filter(section => section.rows.length);
  if (sections.reduce((count, section) => count + section.rows.length, 0) < 3) return undefined;
  const template = getContent("8252")?.lessonPlan;
  const details = (plan?.details ?? [])
    .filter(detail => nonemptyString(detail?.label) && nonemptyString(detail?.value))
    .map(detail => ({ icon: planDetailIcon(detail.label), label: detail.label.trim(), value: detail.value.trim() }));
  const prep = (plan?.prep ?? []).filter(nonemptyString).map(item => item.trim());
  return {
    title: nonemptyString(plan?.title) ? plan!.title.trim() : template?.title ?? DEFAULT_PLAN_TITLE,
    startTime: nonemptyString(plan?.startTime) && /^\d{1,2}:\d{2}$/.test(plan!.startTime!.trim()) ? plan!.startTime!.trim() : template?.startTime ?? DEFAULT_PLAN_START,
    details: details.length ? details : structuredClone(template?.details ?? DEFAULT_PLAN_DETAILS),
    prep: prep.length ? prep : structuredClone(template?.prep ?? DEFAULT_PLAN_PREP),
    sections: sections.map((section, index) => ({
      ...section,
      heading: section.heading ?? (index === sections.length - 1 && sections.length > 1 ? `Unit Standard ${unit.us}` : undefined),
    })),
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
  const topicRows = topics.map((topic, index) => {
    // Show the facilitator the actual supplied material for this topic instead of a
    // generic placeholder sentence, so the plan reflects what was pasted.
    const detail = topic.paragraphs.map(p => p.trim()).filter(Boolean);
    return {
      time: `${topicMinutes} minutes`,
      title: `${topic.heading} — Facilitator & Class`,
      bullets: [`Read through the learner material and facilitate discussion on ${topic.heading.toLowerCase()}.`],
      text: detail.length ? detail : undefined,
      resources: [`LM p${Math.max(4, index + 4)}`],
    };
  });
  return {
    title: template?.title ?? DEFAULT_PLAN_TITLE,
    startTime: template?.startTime ?? DEFAULT_PLAN_START,
    details: structuredClone(template?.details ?? DEFAULT_PLAN_DETAILS),
    prep: structuredClone(template?.prep ?? DEFAULT_PLAN_PREP),
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
  if (enhancement.lessonPlan?.sections?.length) {
    next.lessonPlan = lessonPlanFromEnhancement(enhancement.lessonPlan, unit)
      ?? lessonPlanFromTemplate(unit, next.lesson.map(section => ({ heading: section.heading, paragraphs: section.paragraphs })), enhancement.lessonPlan.details?.length ? Number(enhancement.lessonPlan.details.find(detail => /duration/i.test(detail.label))?.value.match(/\d+/)?.[0] ?? 300) : 300);
  }
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




