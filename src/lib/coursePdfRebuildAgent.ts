import type { PracticalTaskDocument } from "../types";
import { convertPdfHtml, extractFormDocument, type ImportedFormDocument } from "./formImport";
import type { FormBox, FormDefinition, FormField } from "./formSchema";

/**
 * The single PDF-to-course boundary.
 *
 * Learner-Guide.html is the contract: one source page becomes one HTML page,
 * printed text is real HTML text, artwork is cropped only where necessary,
 * and answer controls are positioned over the original answer areas. A failed
 * conversion must stop the build; an image-only or partial document is never
 * a successful course build.
 */

export interface CoursePdfRebuildResult {
  document: PracticalTaskDocument;
  pageCount: number;
  fieldCount: number;
  sourceName: string;
}

function overlaps(a: FormBox, b: FormBox): boolean {
  const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return width * height > Math.min(a.w * a.h, b.w * b.h) * 0.8;
}

function fieldsForPage(document: ImportedFormDocument, pageNumber: number): FormField[] {
  return (document.definition?.sections.flatMap(section => section.fields) ?? [])
    .filter(field => field.placement?.page === pageNumber);
}

/** Deterministic checks run after every AI response and before publication. */
export function validateCoursePdfRebuild(document: PracticalTaskDocument, sourcePageCount: number): void {
  const replica = document.replica;
  if (!replica || replica.display !== "digital") throw new Error("PDF rebuild did not produce a digital HTML document.");
  if (replica.pages.length !== sourcePageCount || document.sourcePageCount !== sourcePageCount) {
    throw new Error(`PDF rebuild lost source pages: expected ${sourcePageCount}, received ${replica.pages.length}.`);
  }
  if (replica.sections.length !== sourcePageCount) throw new Error("PDF rebuild did not create one HTML section per source page.");
  if (replica.pages.some((page, index) => !page.src || page.width <= 0 || page.height <= 0 || !page.layer?.text.length)) {
    throw new Error("PDF rebuild produced a page without an extractable HTML text layer.");
  }
  const ids = new Set<string>();
  for (const section of replica.sections) {
    for (const field of section.fields) {
      if (ids.has(field.id)) throw new Error(`PDF rebuild produced a duplicate field id: ${field.id}.`);
      ids.add(field.id);
      const placement = field.placement;
      if (!placement || placement.page < 1 || placement.page > sourcePageCount) {
        throw new Error(`PDF field ${field.id} is not attached to an original source page.`);
      }
      for (const box of [placement.box, ...placement.options]) {
        if (box && (box.x < 0 || box.y < 0 || box.w <= 0 || box.h <= 0 || box.x + box.w > 1.001 || box.y + box.h > 1.001)) {
          throw new Error(`PDF field ${field.id} lies outside its original page.`);
        }
      }
    }
  }
}

export function unitPdfFromImport(imported: ImportedFormDocument, title: string): PracticalTaskDocument {
  if (!imported.pages.length) throw new Error("The PDF has no readable pages.");
  const nativeFields = imported.definition?.sections.flatMap(section => section.fields) ?? [];
  const sections = imported.pages.map((page, index) => {
    const number = index + 1;
    const fields: FormField[] = fieldsForPage(imported, number);
    for (const box of page.analysis.boxes) {
      if (box.text || box.w <= 0 || box.h <= 0) continue;
      if (fields.some(field => field.placement && [field.placement.box, ...field.placement.options].some(existing => existing && overlaps(existing, box)))) continue;
      const captions = page.analysis.text.filter(text => [text.right, text.below, text.left, text.above].includes(box.id));
      const beside = captions.filter(text => text.right === box.id && text.y < box.y + box.h && text.y + text.h > box.y);
      const nearest = beside.length ? beside : captions.slice().sort((a, b) => Math.abs(a.y - box.y) + Math.abs(a.x - box.x) - Math.abs(b.y - box.y) - Math.abs(b.x - box.x)).slice(0, 1);
      const label = nearest.map(text => text.text).join(" ").trim() || `Page ${number}, answer ${fields.length + 1}`;
      if (box.kind === "line" && box.w < 0.2 && !/name|date|id\b|contact|signature|signed|tel|email|mark|score|initial/i.test(label)) continue;
      if (box.kind === "tick" && !captions.some(text => text.y < box.y + box.h && text.y + text.h > box.y)) continue;
      fields.push({ id: `p${number}_${box.id}`, label, type: box.kind === "tick" ? "checkbox" : /signature|signed by/i.test(label) ? "signature" : box.h / box.w > 0.16 && box.kind === "cell" ? "textarea" : "text", required: false, helpText: "", options: [], placement: { page: number, box: { x: box.x, y: box.y, w: box.w, h: box.h }, options: [], ...(box.kind === "comb" && box.n ? { comb: box.n } : {}) } });
    }
    return { id: `page_${number}`, title: `Page ${number}`, description: "", fields, columns: 4, widths: [], rows: [], banner: "", pageBreak: false };
  });
  const replica: FormDefinition = { title, description: "", titleColor: "", accentColor: "", masthead: "", display: "image", pages: imported.pages.map(({ analysis: _analysis, ...page }) => page), sections };
  return { title, sourceName: imported.name, sourceText: imported.text, sourcePageCount: replica.pages.length, replica, sections: replica.pages.map((_, index) => ({ id: `page_${index + 1}`, title: `Page ${index + 1}`, blocks: [{ kind: "page", number: index + 1 }] })) };
}

export async function rebuildCoursePdf(file: File, title: string, onProgress?: (done: number, total: number) => void): Promise<CoursePdfRebuildResult> {
  if (!/\.pdf$/i.test(file.name) || file.type && file.type !== "application/pdf") throw new Error("Choose a PDF document.");
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("Choose a non-empty PDF under 20 MB.");
  const imported = await extractFormDocument(file, undefined, { preservePdf: true, digitalPdf: true });
  const source = unitPdfFromImport(imported, title);
  const previous = source.replica!.sections.flatMap(section => section.fields);
  const replica = await convertPdfHtml(imported, onProgress);
  for (const section of replica.sections) {
    const used = new Set<string>();
    section.fields = section.fields.map(field => {
      const match = previous.find(old => !used.has(old.id) && old.placement && field.placement && old.placement.page === field.placement.page && old.placement.box && field.placement.box && overlaps(old.placement.box, field.placement.box));
      if (!match) return { ...field, id: `html_${field.id}` };
      used.add(match.id);
      return { ...field, id: match.id };
    });
  }
  for (const native of imported.definition?.sections.flatMap(section => section.fields) ?? []) {
    const section = replica.sections.find(item => item.id === `page_${native.placement?.page}`);
    if (!section) throw new Error("A native PDF field is missing its source page.");
    section.fields = section.fields.filter(field => !field.placement?.box || !native.placement?.box || !overlaps(field.placement.box, native.placement.box));
    section.fields.push(native);
  }
  const document: PracticalTaskDocument = { ...source, replica: { ...replica, title } };
  validateCoursePdfRebuild(document, imported.pages.length);
  return { document, pageCount: imported.pages.length, fieldCount: replica.sections.reduce((count, section) => count + section.fields.length, 0), sourceName: file.name };
}
