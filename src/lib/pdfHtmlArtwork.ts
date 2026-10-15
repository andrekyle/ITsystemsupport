import type { FormBox, LayerShape } from "./formSchema";

export type PdfHtmlArtwork = { fills: LayerShape[]; pictures: FormBox[]; issues: string[] };

/** Keep artwork around labels, but let the HTML text supply the labels themselves. */
export function pdfHtmlPictureMasks(picture: FormBox, text: FormBox[]): FormBox[] {
  return text.flatMap(run => {
    const x = Math.max(picture.x, run.x);
    const y = Math.max(picture.y, run.y);
    const w = Math.min(picture.x + picture.w, run.x + run.w) - x;
    const h = Math.min(picture.y + picture.h, run.y + run.h) - y;
    return w > 0 && h > 0 ? [{ x, y, w, h }] : [];
  });
}

export function readPdfHtmlArtwork(value: unknown): PdfHtmlArtwork {
  if (!value || typeof value !== "object") throw new Error("AI HTML conversion omitted the page artwork.");
  const source = value as Record<string, unknown>;
  if (!Array.isArray(source.issues) || !source.issues.every(issue=>typeof issue==="string")) throw new Error("AI HTML conversion omitted its source completeness review.");
  if (source.issues.length) throw new Error(`The source needs review before HTML conversion: ${source.issues.join("; ")}`);
  if (!Array.isArray(source.fills) || !Array.isArray(source.pictures) || source.fills.length > 100 || source.pictures.length > 20) throw new Error("AI HTML conversion returned invalid page artwork.");
  const box = (value: unknown): FormBox => {
    if (!value || typeof value !== "object") throw new Error("AI HTML conversion returned an invalid rectangle.");
    const item = value as Record<string, unknown>;
    const { x, y, w, h } = item;
    if (typeof x !== "number" || typeof y !== "number" || typeof w !== "number" || typeof h !== "number"
      || ![x,y,w,h].every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x+w > 1.001 || y+h > 1.001) throw new Error("AI HTML conversion placed artwork outside the page.");
    return { x,y,w,h };
  };
  return {
    issues: [],
    fills: source.fills.map(value => {
      const bounds = box(value);
      const color = (value as Record<string, unknown>).c;
      if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) throw new Error("AI HTML conversion returned an invalid colour.");
      return { ...bounds, c: color };
    }),
    pictures: source.pictures.map(value => {
      const bounds = box(value);
      // Large diagrams are valid artwork; only page-sized crops are substitutes.
      if (bounds.w >= 0.9 && bounds.h >= 0.9) throw new Error("AI returned a page-sized artwork crop. Retry conversion so it identifies individual diagrams or logos instead.");
      return bounds;
    }),
  };
}
