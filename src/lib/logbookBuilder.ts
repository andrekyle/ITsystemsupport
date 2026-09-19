import type { LogbookChecklistRow, LogbookSpec, UnitStandard } from "../types";
import { KNOWLEDGE_MARKS, PRACTICAL_MARKS, PROJECT_MARKS, STANDARD_LOGBOOK_DETAIL_FIELDS, isPlanTime, normalizeLogbookSpec, pipeRowCells } from "./unitBuilder";

export const MAX_LOGBOOK_SOURCE_LENGTH = 40_000;

type Section = "details" | "project" | "knowledge" | "practical" | "workplace" | "other" | "checklist" | "ignore";

const SECTION_HEADINGS: [RegExp, Section][] = [
  [/^(?:embedded )?knowledge questions?$|^specific outcomes?(?: (?:&|and) assessment criteria)?$|^embedded knowledge$|^evidence checklist$/i, "knowledge"],
  [/^practical activit(?:y|ies)$/i, "practical"],
  [/^workplace activit(?:y|ies)$/i, "workplace"],
  [/^other activit(?:y|ies)$/i, "other"],
  [/^project checklist$/i, "checklist"],
  [/^(?:logbook )?project(?: task)?$/i, "project"],
  [/^learner (?:details?|information)$|^candidate details?$/i, "details"],
  [/^(?:for )?assessor(?: [\u2014\u2013-] file checked)?$|^feedback record$|^declaration(?: by learner)?$|^judgement$|^file checked$/i, "ignore"],
];

const HEADER_WORDS = /^(?:no\.?|#|number|activity|activities|evidence|workplace|learner|assessor|moderator|project(?: name)?|date|time|resources?|learner activity|logbook activity|learner manual|evidence checklist|specific outcome(?: & assessment criteria)?|embedded knowledge questions?|comments?|sign(?:ature)?|designation|name|reg\.? no|\u2713|x)$/i;

const NOTE_HINT = /^(?:evidence|note|notes|evidence note)\s*:\s*(.+)$/i;
const META: [RegExp, keyof Pick<LogbookSpec, "assignmentTitle" | "programme" | "unitLabel">][] = [
  [/^(?:assignment(?: title)?|logbook(?: title)?)\s*:\s*(.+)$/i, "assignmentTitle"],
  [/^(?:programme|program|qualification)\s*:\s*(.+)$/i, "programme"],
  [/^(?:unit standard|unit|us)\s*:\s*(.+)$/i, "unitLabel"],
];

const normal = (text: string) => text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/\u0000/g, "").trim();
const clean = (text: string) => text.replace(/\*\*+/g, "").replace(/__/g, "").replace(/\s+/g, " ").trim();
const isBlankCell = (cell: string) => !cell || /^[_\s.\u2026-]+$/.test(cell);

/** ✓ / x / yes / true mark → true; blank / no / false → false; anything else is text. */
export function markValue(cell: string): boolean | undefined {
  const value = cell.trim();
  if (/^(?:\u2713|\u2714|\u221a|x|\u00d7|\u2717|\u2718|yes|y|true|t|1|\u2022|\u25cf|\u25a0|\u2611|\u2612|\[x\]|\(x\))$/i.test(value)) return true;
  if (/^(?:no|n|false|f|0|-|\u2013|\u2014|\u2610|\u25a1|\[\s?\]|\(\s?\))?$/i.test(value)) return false;
  return undefined;
}

const stripNumber = (text: string) => text.replace(/^\(?\d{1,3}(?:\.\d+)*[.)]?\s+/, "").trim();
const isNumbered = (text: string) => /^\(?\d{1,3}(?:\.\d+)*[.)]?\s+\S/.test(text);
const isBullet = (text: string) => /^[-*\u2022\u00b7\u25aa\u2023]\s+\S/.test(text);
const listItem = (text: string) => text.replace(/^[-*\u2022\u00b7\u25aa\u2023]\s+/, "").trim();

/** "Text — true, false, false, true, false, false" or "Text ✓ ✓" written on one line. */
function splitTrailingMarks(text: string): { text: string; marks?: boolean[] } {
  const tokens = /(?:[\s|,;:(\[\u2013\u2014-]+(?:\u2713|\u2714|\u221a|x|\u00d7|\u2717|\u2718|yes|no|true|false|\u2610|\u2611|\u2612))+[)\]]?\s*$/i.exec(text);
  if (!tokens) return { text };
  const marks = tokens[0].match(/\u2713|\u2714|\u221a|x|\u00d7|\u2717|\u2718|yes|no|true|false|\u2610|\u2611|\u2612/gi)?.map(token => markValue(token) === true) ?? [];
  if (marks.length < 2) return { text };
  return { text: text.slice(0, tokens.index).replace(/[\s|,;:(\[\u2013\u2014-]+$/, "").trim(), marks };
}

function padMarks(marks: (boolean | undefined)[], fallback: boolean[]): boolean[] {
  const full = marks.slice(0, 6).map((mark, index) => mark ?? fallback[index] ?? false);
  while (full.length < 6) full.push(fallback[full.length] ?? false);
  return full;
}

/** Turn a table row into a checklist row: [no?] text [six marks]. */
function checklistRowFromCells(cells: string[], fallback: boolean[]): LogbookChecklistRow | undefined {
  const values = cells.map(clean);
  let index = 0;
  if (/^\d{1,3}\.?$/.test(values[0] ?? "")) index = 1;
  // The description is the first cell that is neither a number nor a mark.
  while (index < values.length && (isBlankCell(values[index]) || markValue(values[index]) !== undefined) && values[index].length <= 3) index++;
  const text = values[index];
  if (!text || isBlankCell(text)) return undefined;
  const trailing = values.slice(index + 1);
  const marks = trailing.map(markValue);
  if (trailing.some(cell => !isBlankCell(cell) && markValue(cell) === undefined && cell.length > 3)) {
    // Another descriptive cell (e.g. a "Comments" column) — keep only genuine mark cells.
    const genuine = trailing.filter(cell => markValue(cell) !== undefined || isBlankCell(cell)).map(markValue);
    return { text: stripNumber(text), marks: genuine.length ? padMarks(genuine, fallback) : fallback.slice() };
  }
  const inline = splitTrailingMarks(stripNumber(text));
  if (inline.marks && !trailing.length) return { text: inline.text, marks: padMarks(inline.marks, fallback) };
  return { text: stripNumber(text), marks: marks.length ? padMarks(marks, fallback) : fallback.slice() };
}

function sectionFor(text: string): Section | undefined {
  const value = clean(text).replace(/[:\s]+$/, "");
  if (!value || value.length > 80) return undefined;
  for (const [pattern, section] of SECTION_HEADINGS) if (pattern.test(value)) return section;
  return undefined;
}

const isHeaderCell = (cell: string) => HEADER_WORDS.test(clean(cell.split("\n")[0]).replace(/\s*\(.*\)$/, ""));
const isHeaderRow = (cells: string[]) => {
  const filled = cells.filter(cell => !isBlankCell(cell));
  return filled.length >= 2 && filled.every(isHeaderCell);
};

/**
 * Read a pasted or imported logbook form (Word/PDF/text or the text read from
 * logbook images) into the logbook structure: learner details, project task,
 * the two evidence checklists with their six marks, workplace and other
 * activities and the project checklist. Section headings switch what the
 * following rows mean; "No | Text | ✓ | | | ✓ | |" table rows and "1. Text"
 * lines both work.
 */
export function logbookFromSource(unit: UnitStandard, source: string): LogbookSpec | undefined {
  const text = normal(source);
  if (!text) return undefined;
  const spec: LogbookSpec = {
    assignmentTitle: "",
    programme: "",
    unitLabel: "",
    detailFields: [],
    project: { time: "", title: "", text: "", resource: "" },
    knowledgeQuestions: [],
    practicalActivities: [],
    workplaceActivities: [],
    workplaceEvidenceNote: "",
    otherActivities: [],
    otherEvidenceNote: "",
    projectChecklist: [],
  };
  let section: Section | undefined;
  let projectLines: string[] = [];
  let lastOther: { activity: string; evidence: string } | undefined;

  const applyMeta = (line: string): boolean => {
    for (const [pattern, key] of META) {
      const match = pattern.exec(line);
      if (match) { spec[key] = clean(match[1]); return true; }
    }
    const note = NOTE_HINT.exec(line);
    if (note && (section === "workplace" || section === "other")) {
      if (section === "workplace") spec.workplaceEvidenceNote = clean(note[1]); else spec.otherEvidenceNote = clean(note[1]);
      return true;
    }
    const projectMeta = /^(?:time|duration)\s*:\s*(.+)$/i.exec(line);
    if (projectMeta && section === "project") { spec.project.time = clean(projectMeta[1]); return true; }
    const resource = /^resources?\s*:\s*(.+)$/i.exec(line);
    if (resource && section === "project") { spec.project.resource = clean(resource[1]); return true; }
    const title = /^(?:project )?title\s*:\s*(.+)$/i.exec(line);
    if (title && section === "project") { spec.project.title = clean(title[1]); return true; }
    return false;
  };

  const addChecklist = (row: LogbookChecklistRow | undefined) => {
    if (!row || !row.text) return;
    if (section === "practical") spec.practicalActivities.push(row); else spec.knowledgeQuestions.push(row);
  };

  const handleLine = (raw: string) => {
    const line = clean(raw);
    if (!line) { lastOther = undefined; return; }
    const heading = sectionFor(line.replace(/^#+\s*/, ""));
    if (heading && (/^#/.test(raw.trim()) || line.length <= 60)) { section = heading; projectLines = []; lastOther = undefined; return; }
    if (applyMeta(line)) return;
    const body = isNumbered(line) ? stripNumber(line) : isBullet(line) ? listItem(line) : line;
    switch (section) {
      case "knowledge":
      case "practical": {
        const inline = splitTrailingMarks(body);
        const fallback = section === "practical" ? PRACTICAL_MARKS : KNOWLEDGE_MARKS;
        // Continuation of a wrapped row (not numbered, no marks) joins the row above.
        const rows = section === "practical" ? spec.practicalActivities : spec.knowledgeQuestions;
        if (!isNumbered(line) && !isBullet(line) && !inline.marks && rows.length && /^[a-z(]/.test(body)) { rows[rows.length - 1].text = `${rows[rows.length - 1].text} ${body}`; return; }
        addChecklist({ text: inline.text, marks: inline.marks ? padMarks(inline.marks, fallback) : fallback.slice() });
        return;
      }
      case "workplace":
        if (!isNumbered(line) && !isBullet(line) && body.length > 90 && !spec.workplaceActivities.length) { spec.workplaceEvidenceNote = body; return; }
        spec.workplaceActivities.push(body);
        return;
      case "other": {
        if (!isNumbered(line) && !isBullet(line) && body.length > 90 && !spec.otherActivities.length) { spec.otherEvidenceNote = body; return; }
        const split = /^(.{3,120}?)\s+(?:[\u2013\u2014-]|:)\s+(.+)$/.exec(body);
        if (split) { lastOther = { activity: split[1].trim(), evidence: split[2].trim() }; spec.otherActivities.push(lastOther); return; }
        if (lastOther && !isNumbered(line) && !isBullet(line) && !lastOther.evidence) { lastOther.evidence = body; return; }
        lastOther = { activity: body, evidence: "" };
        spec.otherActivities.push(lastOther);
        return;
      }
      case "checklist": {
        const match = /^(\d{1,3})[.)]?\s+(.+)$/.exec(line);
        spec.projectChecklist.push(match ? { no: match[1], name: match[2].trim() } : { no: String(spec.projectChecklist.length + 1), name: body });
        return;
      }
      case "details":
        if (body.length <= 40) spec.detailFields.push(body.replace(/\s*:$/, ""));
        return;
      case "project":
        if (isPlanTime(body)) { spec.project.time = body; return; }
        projectLines.push(body);
        if (!spec.project.title) spec.project.title = body;
        else spec.project.text = [spec.project.text, body].filter(Boolean).join(" ");
        return;
      default:
        return;
    }
  };

  const handleRow = (cells: string[]) => {
    const values = cells.map(cell => cell.replace(/\*\*+/g, "").replace(/__/g, "").trim());
    const filled = values.filter(cell => !isBlankCell(cell));
    if (!filled.length) return;
    // A row spanning the table (or a first cell that names a section) switches section.
    const heading = sectionFor(filled[0].split("\n")[0]);
    if (heading && filled.slice(1).every(isHeaderCell)) {
      section = heading;
      projectLines = [];
      lastOther = undefined;
      return;
    }
    if (isHeaderRow(values)) {
      // "Evidence / The workplace completes this section…" — the header's second line is the note.
      for (const cell of values) {
        const [head, ...rest] = cell.split("\n").map(clean).filter(Boolean);
        if (/^evidence$/i.test(head ?? "") && rest.length) {
          if (section === "workplace") spec.workplaceEvidenceNote = rest.join(" ");
          else if (section === "other") spec.otherEvidenceNote = rest.join(" ");
        }
      }
      return;
    }
    switch (section) {
      case "details": {
        const label = clean(filled[0]);
        if (label.length <= 40 && !HEADER_WORDS.test(label)) spec.detailFields.push(label.replace(/\s*:$/, ""));
        return;
      }
      case "project": {
        const timeIndex = values.findIndex(isPlanTime);
        if (timeIndex >= 0) spec.project.time = clean(values[timeIndex]);
        const rest = values.map((cell, index) => ({ cell, index })).filter(item => item.index !== timeIndex && !isBlankCell(item.cell));
        const activity = rest.length ? rest.reduce((best, item) => item.cell.length > best.cell.length ? item : best) : undefined;
        if (activity) {
          const [title, ...body] = activity.cell.split("\n").map(clean).filter(Boolean);
          spec.project.title = title ?? spec.project.title;
          spec.project.text = body.join(" ");
          const resource = rest.find(item => item !== activity && item.index > activity.index) ?? rest.find(item => item !== activity);
          if (resource) spec.project.resource = clean(resource.cell);
        }
        return;
      }
      case "workplace": {
        const activity = filled[0];
        if (activity) spec.workplaceActivities.push(clean(activity.replace(/\n/g, " ")));
        return;
      }
      case "other": {
        const [activity, evidence] = filled;
        if (activity) spec.otherActivities.push({ activity: clean(activity), evidence: evidence && markValue(evidence) === undefined ? clean(evidence) : "" });
        return;
      }
      case "checklist": {
        const numbered = /^\d{1,3}$/.test(clean(values[0] ?? ""));
        const name = numbered ? values.slice(1).find(cell => !isBlankCell(cell)) : filled[0];
        if (name) spec.projectChecklist.push({ no: numbered ? clean(values[0]) : String(spec.projectChecklist.length + 1), name: clean(name) });
        return;
      }
      case "knowledge":
      case "practical":
      default: {
        // Without a heading, a row that carries marks is still a knowledge question.
        const marks = values.filter(cell => markValue(cell) !== undefined && !isBlankCell(cell)).length;
        if (!section && marks < 1) return;
        if (!section) section = "knowledge";
        addChecklist(checklistRowFromCells(values, section === "practical" ? PRACTICAL_MARKS : KNOWLEDGE_MARKS));
      }
    }
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (/^\|.*\|$/.test(line)) {
      const cells = pipeRowCells(line);
      if (cells.every(cell => !cell || /^:?-{2,}:?$/.test(cell))) continue;
      handleRow(cells);
    } else handleLine(line);
  }

  if (!spec.knowledgeQuestions.length && !spec.practicalActivities.length) return undefined;
  if (spec.practicalActivities.length === 1) spec.practicalActivities[0].marks = spec.practicalActivities[0].marks.some(Boolean) ? spec.practicalActivities[0].marks : PROJECT_MARKS.slice();
  const normalized = normalizeLogbookSpec(unit, {
    ...spec,
    detailFields: spec.detailFields.length ? spec.detailFields : STANDARD_LOGBOOK_DETAIL_FIELDS,
    projectChecklist: spec.projectChecklist.length ? spec.projectChecklist : [{ no: "1", name: unit.us }],
    project: {
      time: spec.project.time,
      title: spec.project.title || (projectLines[0] ?? ""),
      text: spec.project.text,
      resource: spec.project.resource,
    },
  }, { keepStructure: true });
  return normalized ?? undefined;
}

/** Short description for the preview / save message. */
export function logbookStats(spec: LogbookSpec): string {
  return `${spec.knowledgeQuestions.length} knowledge question${spec.knowledgeQuestions.length === 1 ? "" : "s"} · ${spec.practicalActivities.length} practical · ${spec.workplaceActivities.length} workplace · ${spec.otherActivities.length} other · ${spec.projectChecklist.length} project checklist`;
}
