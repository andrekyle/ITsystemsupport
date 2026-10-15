import type { PracticalTaskDocument } from "../types";
import { extractFormDocument, type ImportedFormDocument } from "./formImport";
import type { FormBox, FormDefinition, FormField } from "./formSchema";

function overlaps(a: FormBox, b: FormBox): boolean {
  const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return width * height > Math.min(a.w * a.h, b.w * b.h) * 0.8;
}

/** Only blank answer areas become inputs. The printed page is never rebuilt. */
export function unitPdfFromImport(imported: ImportedFormDocument, title: string): PracticalTaskDocument {
  if (!imported.pages.length) throw new Error("The PDF has no readable pages.");
  const nativeFields = imported.definition?.sections.flatMap(section => section.fields) ?? [];
  const sections = imported.pages.map((page, index) => {
    const number = index + 1;
    const fields: FormField[] = nativeFields.filter(field => field.placement?.page === number);
    for (const box of page.analysis.boxes) {
      if (box.text || box.w <= 0 || box.h <= 0) continue;
      if (fields.some(field => {
        const placement = field.placement;
        return placement && [placement.box, ...placement.options].some(existing => existing && overlaps(existing, box));
      })) continue;
      const captions = page.analysis.text.filter(text => [text.right, text.below, text.left, text.above].includes(box.id));
      const beside = captions.filter(text => text.right === box.id && text.y < box.y + box.h && text.y + text.h > box.y);
      const nearest = beside.length ? beside : captions.slice().sort((a,b)=>
        Math.abs(a.y-box.y)+Math.abs(a.x-box.x)-Math.abs(b.y-box.y)-Math.abs(b.x-box.x)).slice(0,1);
      const label = nearest.map(text => text.text).join(" ").trim() || `Page ${number}, answer ${fields.length + 1}`;
      if (box.kind === "line" && box.w < 0.2 && !/name|date|id\b|contact|signature|signed|tel|email|mark|score|initial/i.test(label)) continue;
      if (box.kind === "tick" && !captions.some(text => text.y < box.y + box.h && text.y + text.h > box.y)) continue;
      fields.push({
        id: `p${number}_${box.id}`, label,
        type: box.kind === "tick" ? "checkbox" : /signature|signed by/i.test(label) ? "signature" : box.h / box.w > 0.16 && box.kind === "cell" ? "textarea" : "text",
        required: false, helpText: "", options: [],
        placement: { page: number, box: { x: box.x, y: box.y, w: box.w, h: box.h }, options: [], ...(box.kind === "comb" && box.n ? { comb: box.n } : {}) },
      });
    }
    return { id: `page_${number}`, title: `Page ${number}`, description: "", fields, columns: 4, widths: [], rows: [], banner: "", pageBreak: false };
  });
  const replica: FormDefinition = {
    title, description: "", titleColor: "", accentColor: "", masthead: "", display: "image",
    pages: imported.pages.map(({ analysis: _analysis, layer: _layer, ...page }) => page), sections,
  };
  return {
    title, sourceName: imported.name, sourceText: imported.text,
    sourcePageCount: replica.pages.length, replica,
    sections: replica.pages.map((_, index) => ({ id: `page_${index + 1}`, title: `Page ${index + 1}`, blocks: [{ kind: "page", number: index + 1 }] })),
  };
}

export async function importUnitPdf(file: File, title: string): Promise<PracticalTaskDocument> {
  if (!/\.pdf$/i.test(file.name)) throw new Error("Choose a PDF document.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Choose a PDF under 20 MB.");
  return unitPdfFromImport(await extractFormDocument(file, undefined, { preservePdf: true }), title);
}
