import { lessonTableMarkdown, parseLessonTextBlocks, type LessonTableBlock } from "./lessonTables";
import type { LessonSection } from "../types";

export type LessonBlockType = "paragraph" | "subheading" | "bullet" | "numbered" | "table";
export type LessonBlock = {
  type: LessonBlockType;
  text?: string;
  items?: string[];
  table?: LessonTableBlock;
  estimatedHeight: number;
  keepTogether: boolean;
  keepWithNext: boolean;
  canSplit: boolean;
};
export type PaginatedLesson = { heading: string; paragraphs: string[]; paragraphFormats: ("paragraph" | "subheading" | "numbered" | "bullet")[] };

/** One central, readable slide geometry. Values are CSS pixels at the desktop lesson width. */
export const LESSON_LAYOUT = {
  safeHeight: 610,
  contentWidth: 920,
  bodyFontSize: 19,
  bodyLineHeight: 31,
  paragraphGap: 14,
  headingHeight: 62,
  subheadingHeight: 40,
  listItemGap: 6,
  tableHeaderHeight: 46,
  tableCellPadding: 20,
  minimumFollowingHeight: 62,
} as const;

const clean = (value: string) => value
  .replace(/\r\n?/g, "\n")
  .replace(/[\u0000\u200B-\u200D\uFEFF]/g, "")
  .replace(/\u00a0/g, " ")
  .replace(/[ \t]+/g, " ")
  .replace(/ *\n */g, "\n")
  .trim();

export function normalizeLessonParagraphs(paragraphs: readonly string[]): string[] {
  return paragraphs.map(clean).filter(Boolean);
}

const plain = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
const marker = (value: string) => value.match(/^\s*(?:(\d+(?:\.\d+)*)[.)]|([\u2022\u00b7*+-]))\s+(.+)$/s);
const listLead = (value: string) => /(?::|\bas follows|\bfollowing items of work|\busually|\bincludes?|\binvolves?|\bcomprises?|\bconsists? of)\s*:?$/i.test(plain(value));
const listPoint = (value: string) => {
  const text = plain(value);
  return text.length > 0 && text.length <= 180 && !isSubheading(value) && !listLead(value);
};
const isSubheading = (value: string) => {
  const text = plain(value);
  return text.length <= 140 && !/[.!?]$/.test(text) && (/^#{2,6}\s+/.test(value) || /^\d+(?:\.\d+)+[.)]?\s+\p{L}/u.test(text) || /^\*\*[^*]+\*\*$/.test(value));
};

function lineCount(text: string, width: number = LESSON_LAYOUT.contentWidth, fontSize: number = LESSON_LAYOUT.bodyFontSize): number {
  // Average proportional-font glyph width is approximately .52em. Long words
  // still consume a line, so never estimate fewer lines than explicit breaks.
  const charsPerLine = Math.max(18, Math.floor(width / (fontSize * .52)));
  return plain(text).split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
}

function paragraphHeight(text: string): number {
  return lineCount(text) * LESSON_LAYOUT.bodyLineHeight + LESSON_LAYOUT.paragraphGap;
}

function tableRowHeight(row: readonly string[], columns: number): number {
  const cellWidth = Math.max(90, LESSON_LAYOUT.contentWidth / Math.max(1, columns));
  return Math.max(...row.map(cell => lineCount(cell, cellWidth - LESSON_LAYOUT.tableCellPadding, 16))) * 25 + LESSON_LAYOUT.tableCellPadding;
}

function tableHeight(table: LessonTableBlock): number {
  return LESSON_LAYOUT.tableHeaderHeight + table.rows.reduce((height, row) => height + tableRowHeight(row, table.headers.length), 0) + 16;
}

/** Classify cleaned source into renderer-independent semantic blocks. */
export function createLessonBlocks(paragraphs: readonly string[]): LessonBlock[] {
  const parsed = parseLessonTextBlocks(normalizeLessonParagraphs(paragraphs));
  const blocks: LessonBlock[] = [];
  for (let index = 0; index < parsed.length; index++) {
    const block = parsed[index];
    if (block.kind === "table") {
      blocks.push({ type: "table", table: block, estimatedHeight: tableHeight(block), keepTogether: true, keepWithNext: false, canSplit: true });
      continue;
    }
    const text = clean(block.text);
    const first = marker(text);
    if (first) {
      const numbered = Boolean(first[1]);
      const items: string[] = [first[3].trim()];
      while (index + 1 < parsed.length && parsed[index + 1].kind === "paragraph") {
        const next = marker((parsed[index + 1] as { kind: "paragraph"; text: string }).text);
        if (!next || Boolean(next[1]) !== numbered) break;
        items.push(next[3].trim()); index++;
      }
      const estimatedHeight = items.reduce((height, item) => height + paragraphHeight(item) + LESSON_LAYOUT.listItemGap, 8);
      blocks.push({ type: numbered ? "numbered" : "bullet", items, estimatedHeight, keepTogether: true, keepWithNext: false, canSplit: true });
    } else if (listLead(text)) {
      blocks.push({ type: "paragraph", text, estimatedHeight: paragraphHeight(text), keepTogether: true, keepWithNext: true, canSplit: true });
      const items: string[] = [];
      let explicitNumbering = false;
      while (index + 1 < parsed.length && parsed[index + 1].kind === "paragraph") {
        const candidate = clean((parsed[index + 1] as { kind: "paragraph"; text: string }).text);
        if (!listPoint(candidate)) break;
        const candidateMarker = marker(candidate);
        explicitNumbering ||= Boolean(candidateMarker?.[1]);
        items.push(candidateMarker?.[3].trim() ?? candidate); index++;
      }
      if (items.length) {
        const numbered = explicitNumbering || !/:$/.test(plain(text)) || /following items of work|usually/i.test(plain(text));
        blocks.push({ type: numbered ? "numbered" : "bullet", items, estimatedHeight: items.reduce((height, item) => height + paragraphHeight(item) + LESSON_LAYOUT.listItemGap, 8), keepTogether: true, keepWithNext: false, canSplit: true });
      }
    } else if (isSubheading(text)) {
      blocks.push({ type: "subheading", text: text.replace(/^#{2,6}\s+/, "").replace(/^\*\*(.*)\*\*$/, "$1"), estimatedHeight: LESSON_LAYOUT.subheadingHeight, keepTogether: true, keepWithNext: true, canSplit: false });
    } else {
      blocks.push({ type: "paragraph", text, estimatedHeight: paragraphHeight(text), keepTogether: true, keepWithNext: false, canSplit: true });
    }
  }
  return blocks;
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+(?:[.!?]+[”'\"]?|$)/g)?.map(clean).filter(Boolean) ?? [text];
}

function splitParagraph(block: LessonBlock, available: number): [LessonBlock, LessonBlock?] {
  const sentences = splitSentences(block.text ?? "");
  if (sentences.length < 2) return [block];
  let first = "";
  let take = 0;
  for (let index = 0; index < sentences.length; index++) {
    const candidate = [first, sentences[index]].filter(Boolean).join(" ");
    if (paragraphHeight(candidate) > available && first) break;
    first = candidate; take++;
  }
  // Avoid a one-sentence widow when rebalancing is possible.
  if (sentences.length - take === 1 && take > 1) { take--; first = sentences.slice(0, take).join(" "); }
  if (!take || take === sentences.length) return [block];
  const rest = sentences.slice(take).join(" ");
  return [
    { ...block, text: first, estimatedHeight: paragraphHeight(first) },
    { ...block, text: rest, estimatedHeight: paragraphHeight(rest) },
  ];
}

function splitTable(block: LessonBlock, available: number): [LessonBlock, LessonBlock?] {
  const table = block.table!;
  let height = LESSON_LAYOUT.tableHeaderHeight + 16;
  let count = 0;
  for (const row of table.rows) {
    const rowHeight = tableRowHeight(row, table.headers.length);
    if (count && height + rowHeight > available) break;
    height += rowHeight; count++;
  }
  if (!count || count === table.rows.length) return [block];
  const make = (rows: string[][]): LessonBlock => {
    const part = { ...table, rows };
    return { ...block, table: part, estimatedHeight: tableHeight(part) };
  };
  return [make(table.rows.slice(0, count)), make(table.rows.slice(count))];
}

function splitList(block: LessonBlock, available: number): [LessonBlock, LessonBlock?] {
  const items = block.items ?? [];
  let height = 8; let count = 0;
  for (const item of items) {
    const itemHeight = paragraphHeight(item) + LESSON_LAYOUT.listItemGap;
    if (count && height + itemHeight > available) break;
    height += itemHeight; count++;
  }
  // Do not leave a single list item isolated on either slide.
  if (items.length - count === 1 && count > 2) count--;
  if (!count || count === items.length) return [block];
  const make = (values: string[]): LessonBlock => ({ ...block, items: values, estimatedHeight: values.reduce((sum, item) => sum + paragraphHeight(item) + LESSON_LAYOUT.listItemGap, 8) });
  return [make(items.slice(0, count)), make(items.slice(count))];
}

function serialize(blocks: LessonBlock[]): Pick<PaginatedLesson, "paragraphs" | "paragraphFormats"> {
  const paragraphs: string[] = [];
  const paragraphFormats: PaginatedLesson["paragraphFormats"] = [];
  for (const block of blocks) {
    if (block.type === "table") { paragraphs.push(lessonTableMarkdown(block.table!)); paragraphFormats.push("paragraph"); }
    else if (block.type === "paragraph" || block.type === "subheading") { paragraphs.push(block.text!); paragraphFormats.push(block.type); }
    else for (const item of block.items ?? []) { paragraphs.push(item); paragraphFormats.push(block.type); }
  }
  return { paragraphs, paragraphFormats };
}

/** Height-aware pagination with heading affinity, atomic rows and widow protection. */
export function paginateLesson(heading: string, paragraphs: readonly string[]): PaginatedLesson[] {
  const queue = createLessonBlocks(paragraphs);
  const pages: LessonBlock[][] = [];
  let page: LessonBlock[] = [];
  let used = LESSON_LAYOUT.headingHeight;
  const commit = () => { if (page.length) pages.push(page); page = []; used = LESSON_LAYOUT.headingHeight; };
  while (queue.length) {
    const block = queue.shift()!;
    const next = queue[0];
    const required = block.estimatedHeight + (block.keepWithNext && next ? Math.min(next.estimatedHeight, LESSON_LAYOUT.minimumFollowingHeight) : 0);
    if (used + required <= LESSON_LAYOUT.safeHeight) { page.push(block); used += block.estimatedHeight; continue; }
    if (page.length) {
      const trailing = page.at(-1);
      if (trailing?.keepWithNext && page.length > 1) {
        page.pop();
        used -= trailing.estimatedHeight;
        commit();
        page.push(trailing);
        used += trailing.estimatedHeight;
        queue.unshift(block);
        continue;
      }
      if (!trailing?.keepWithNext) { commit(); queue.unshift(block); continue; }
    }
    const available = LESSON_LAYOUT.safeHeight - used;
    const split = block.type === "table" ? splitTable(block, available) : block.type === "bullet" || block.type === "numbered" ? splitList(block, available) : splitParagraph(block, available);
    page.push(split[0]); commit();
    if (split[1]) queue.unshift(split[1]);
  }
  commit();
  return pages.map((blocks, index) => ({ heading: index ? `${heading} — Continued` : heading, ...serialize(blocks) }));
}

export function validateLessonPages(pages: readonly PaginatedLesson[]): string[] {
  const issues: string[] = [];
  pages.forEach((page, index) => {
    const blocks = createLessonBlocks(page.paragraphs);
    const height = LESSON_LAYOUT.headingHeight + blocks.reduce((sum, block) => sum + block.estimatedHeight, 0);
    if (height > LESSON_LAYOUT.safeHeight + 1) issues.push(`Slide ${index + 1} exceeds the safe content height.`);
    if (!blocks.length) issues.push(`Slide ${index + 1} has no content.`);
    if (blocks.at(-1)?.type === "subheading") issues.push(`Slide ${index + 1} ends with an orphan heading.`);
    for (const block of blocks) if ((block.type === "bullet" || block.type === "numbered") && block.items?.length === 1 && pages.length > 1) issues.push(`Slide ${index + 1} has an isolated list item.`);
  });
  return issues;
}

/** Upgrade saved/generated lesson sections that predate semantic pagination.
 * Rich media sections retain their authored layout; text-first sections are
 * safely repaginated and keep quizzes/figures on the final continuation. */
export function layoutLessonSections(sections: readonly LessonSection[]): LessonSection[] {
  return sections.flatMap(section => {
    if (!section.paragraphs?.length) return [section];
    const hasAuthoredLayout = Boolean(section.cards?.length || section.table || section.example || section.examples?.length || section.bullets?.length || section.modelAnswer?.length);
    if (hasAuthoredLayout) return [section];
    const source = section.paragraphs.map((paragraph, index) => {
      const format = section.paragraphFormats?.[index];
      if (format === "numbered" && !marker(paragraph)) return `1. ${paragraph}`;
      if (format === "bullet" && !marker(paragraph)) return `• ${paragraph}`;
      if (format === "subheading" && !isSubheading(paragraph)) return `**${paragraph}**`;
      return paragraph;
    });
    const baseHeading = section.heading.replace(/\s*(?:—|\(|-)\s*continued(?:\s+\d+)?\)?$/i, "").trim();
    const pages = paginateLesson(baseHeading, source);
    if (pages.length === 1 && pages[0].heading === section.heading && pages[0].paragraphs.join("\u0000") === section.paragraphs.join("\u0000")) return [section];
    return pages.map((page, index) => ({
      ...section,
      heading: page.heading,
      paragraphs: page.paragraphs,
      paragraphFormats: page.paragraphFormats,
      lessonStart: index === 0 ? section.lessonStart : undefined,
      figures: index === pages.length - 1 ? section.figures : undefined,
      slideQuiz: index === pages.length - 1 ? section.slideQuiz : undefined,
      quizGate: index === pages.length - 1 ? section.quizGate : undefined,
    }));
  });
}
