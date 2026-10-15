import type { PracticalTaskDocument, PracticalTaskField, PracticalTaskSection } from "../types";
import { cleanImportedText, importUnitSource } from "./unitSourceImport";
import { parseLessonTextBlocks } from "./lessonTables";

const FIELD_LABEL = /^(name|surname|id number|contact|learner|assessor|moderator|organisation|unit\/?dept|telephone|email|venue|facilitator|date|workplace|coach|mentor|received|signature|comments|feedback|address)/i;
const HEADING = /^(general information|learner details|workshop details|practical work|practical assessment|observational checklist|witness testimony|workplace testimonial|overall performance|so\s*\d+)/i;

function slug(value: string, fallback: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || fallback;
}

/** Reading-order text from the editable structure, also used by pack exports. */
export function sourceDocumentText(document: PracticalTaskDocument): string {
  return document.sections.flatMap(section => (section.blocks ?? []).map(block => {
    if (block.kind === "page") return "\f";
    if (block.kind === "field") return block.field.label;
    if (block.kind === "item") return block.item.text;
    return [block.headers, ...block.rows].map(row => row.join(" | ")).join("\n");
  })).join("\n");
}

/** Clean uploads to text before deterministic, source-faithful HTML layout. */
export async function importPracticalTask(file: File, unitTitle: string): Promise<PracticalTaskDocument> {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Choose a PDF practical-task document.");
  const source = await importUnitSource(file);
  return practicalTaskFromSource(source, file.name, unitTitle);
}

/** Preserve repeated PDF labels while assigning a distinct identity to each entry. */
export function practicalTaskFromSource(source: string, sourceName: string, unitTitle: string): PracticalTaskDocument {
  const sourceText = cleanImportedText(source);
  const lines = sourceText.split(/[\n\f]+/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error("No readable document content was found.");
  const sections: PracticalTaskSection[] = [];
  const title = sourceName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Uploaded document";
  let current: PracticalTaskSection = { id: "source", title, blocks: [] };
  sections.push(current);
  let fieldNo = 0;
  let itemNo = 0;
  let tableNo = 0;
  const pages = sourceText.split("\f");

  for (const [pageIndex, page] of pages.entries()) {
    if (/\.pdf$/i.test(sourceName)) current.blocks!.push({ kind: "page", number: pageIndex + 1 });
    for (const block of parseLessonTextBlocks(page.split(/\n\s*\n/))) {
      if (block.kind === "table") {
        current.blocks!.push({ kind: "table", id: `table-${++tableNo}`, headers: block.headers, rows: block.rows });
        continue;
      }
      for (const line of block.text.split("\n").map(line => line.trim()).filter(Boolean)) {
        const heading = line.replace(/^#{1,6}\s+/, "");
        const isHeading = /^#{1,6}\s+/.test(line) || (HEADING.test(line) && line.length < 140)
          || /^(?:learner (?:workbook|guide)|practical task)\s*$/i.test(line)
          || (line.length < 100 && /[A-Z]{3}/.test(line) && line === line.toUpperCase() && !/[?!]$/.test(line) && !FIELD_LABEL.test(line));
        if (isHeading) {
          // Keep even consecutive/empty headings, without inventing form sections.
          if (current.blocks!.every(block => block.kind === "page")) {
            current.id = `section-${sections.length}-${slug(heading, "section")}`;
            current.title = heading;
          } else {
            current = { id: `section-${sections.length + 1}-${slug(heading, "section")}`, title: heading, blocks: [] };
            sections.push(current);
          }
        }
        const blank = /^[_\u2026.]{3,}$/.test(line);
        const fieldLine = !isHeading && FIELD_LABEL.test(line) && line.length < 100
          && /[:_]\s*$|_{3,}|\.{4,}/.test(line);
        if (fieldLine || blank) {
          const field: PracticalTaskField = {
            id: `field-${++fieldNo}-${slug(line, "field")}`, label: line,
            type: blank || /comment|feedback|address|testimonial|evidence/i.test(line) ? "textarea"
              : /email/i.test(line) ? "email" : /telephone|contact|cell/i.test(line) ? "tel" : /date/i.test(line) ? "date" : "text",
          };
          current.blocks!.push({ kind: "field", field });
        } else {
          const id = `response-${++itemNo}`;
          const question = !isHeading && /^(?:(?:task|question|activity)\s+\d+\b|\d+[.)]\s+.*\?)|[?]$/i.test(line);
          current.blocks!.push({
            kind: "item", item: { id, text: isHeading ? heading : line, ...(question ? { responseLabel: "Learner response" } : {}) },
            format: isHeading ? "heading" : /^\d+(?:\.\d+)*[.)]?\s+/.test(line) ? "numbered"
              : /^[-*\u2022]\s+/.test(line) ? "bullet" : "paragraph",
          });
        }
      }
    }
  }
  const usable = sections.filter(section => section.blocks!.length > 0);
  const document: PracticalTaskDocument = {
    title,
    subtitle: unitTitle,
    sourceName,
    notice: "Source styling has been removed. All extracted text is retained in source order. Review PDF reading order, tables and any image-only content against the original before publishing. Edit document wording in Manage tabs and structure.",
    sections: usable,
    sourceText,
    ...(/\.pdf$/i.test(sourceName) ? { sourcePageCount: pages.length } : {}),
  };
  const words = (text: string) => text.replace(/<br\s*\/?>/gi, "\n").replace(/[^\p{L}\p{N}]/gu, "");
  if (words(sourceDocumentText(document)) !== words(sourceText)) throw new Error("The conversion did not preserve every source word in order. Export the document as plain text and retry.");
  return document;
}
