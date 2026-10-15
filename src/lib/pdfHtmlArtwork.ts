import type { FormBox, LayerShape } from "./formSchema";

export type PdfHtmlArtwork = { fills: LayerShape[]; pictures: FormBox[]; issues: string[] };

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
      if (bounds.w*bounds.h > 0.3) throw new Error("AI HTML conversion tried to use a page image instead of HTML.");
      return bounds;
    }),
  };
}
