import JSZip from "jszip";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { MAX_MASTHEAD_CHARS, parseFormDefinition, type FormBox, type FormDefinition, type FormField, type FormPage, type FormPlacement } from "./formSchema";
import { analysePage, type PageAnalysis, type TextRun } from "./pageAnalysis";
import { supabase } from "./supabase";

GlobalWorkerOptions.workerSrc = workerUrl;

export const FORM_UPLOAD_ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp";
export const MAX_FORM_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 12;
const MAX_GENERATION_BYTES = 3_400_000;
// the replica page (what the form shows and prints) and the lighter copy the AI reads
const PAGE_PIXELS = 1654;
const AI_PIXELS = 1300;
const WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/** A page of the upload rendered for the replica, with its detected geometry. */
export interface ImportedPage extends FormPage {
  analysis: PageAnalysis;
}

export interface ImportedFormDocument {
  name: string;
  text: string;
  /** page images for the AI (smaller than the replica pages) */
  images: string[];
  /** replica pages; empty for documents that cannot be rendered (Word) */
  pages: ImportedPage[];
  definition?: FormDefinition;
}

interface PdfFormWidget {
  type?: string;
  readOnly?: boolean;
  editable?: boolean;
  required?: boolean;
  alternativeText?: string;
  multiline?: boolean;
  multipleSelection?: boolean;
  exportValues?: string | string[];
  items?: { displayValue?: string; exportValue?: string }[];
}

/** A widget's rectangle on its page, as page fractions. */
interface WidgetBox {
  page: number;
  box: FormBox;
  exportValue: string;
}

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Import cancelled.", "AbortError");
}

const round4 = (value: number) => Math.round(value * 10000) / 10000;

/** Draws the page onto a canvas at most `pixels` on its longer side. */
async function renderPage(page: PDFPageProxy, pixels: number): Promise<HTMLCanvasElement> {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: pixels / Math.max(base.width, base.height) });
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport, intent: "print" }).promise;
  return canvas;
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

/** Scales a rendered page down for the AI's eyes. */
function shrink(canvas: HTMLCanvasElement, pixels: number, quality: number): string {
  const scale = Math.min(1, pixels / Math.max(canvas.width, canvas.height));
  if (scale === 1) return canvas.toDataURL("image/jpeg", quality);
  const small = window.document.createElement("canvas");
  small.width = Math.max(1, Math.round(canvas.width * scale));
  small.height = Math.max(1, Math.round(canvas.height * scale));
  const context = small.getContext("2d");
  if (!context) throw new Error("This browser cannot process the page image.");
  context.drawImage(canvas, 0, 0, small.width, small.height);
  const url = small.toDataURL("image/jpeg", quality);
  releaseCanvas(small);
  return url;
}

/** The page's table cells, tick boxes and rules plus the printed runs, from
 *  the rendered pixels. */
function analyseCanvas(canvas: HTMLCanvasElement, runs: TextRun[], pageNumber: number): PageAnalysis {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot process the page image.");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return analysePage({ data: image.data, width: image.width, height: image.height, channels: 4 }, runs, pageNumber);
}

/** Text runs of a page in pixel coordinates of a canvas `width` px wide. */
async function textRuns(page: PDFPageProxy, width: number): Promise<TextRun[]> {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const content = await page.getTextContent();
  const runs: TextRun[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    // transform: [scaleX, skewY, skewX, scaleY, x, y] in PDF space, y up from the bottom
    const [a, b, , , e, f] = item.transform;
    const fontSize = Math.hypot(a, b) || item.height || 1;
    const [x1, baseline] = viewport.convertToViewportPoint(e, f);
    const [x2, top] = viewport.convertToViewportPoint(e + item.width, f + fontSize * 0.8);
    const left = Math.min(x1, x2);
    const runTop = Math.min(baseline, top);
    runs.push({ text: item.str, x: left, y: runTop, w: Math.abs(x2 - x1) || fontSize * viewport.scale * 0.5, h: Math.abs(baseline - top) + fontSize * viewport.scale * 0.2 });
  }
  return runs;
}

function widgetBox(page: PDFPageProxy, rect: number[]): FormBox | null {
  if (!Array.isArray(rect) || rect.length < 4) return null;
  const viewport = page.getViewport({ scale: 1 });
  const [x1, y1] = viewport.convertToViewportPoint(rect[0], rect[1]);
  const [x2, y2] = viewport.convertToViewportPoint(rect[2], rect[3]);
  const box = { x: Math.min(x1, x2) / viewport.width, y: Math.min(y1, y2) / viewport.height, w: Math.abs(x2 - x1) / viewport.width, h: Math.abs(y2 - y1) / viewport.height };
  if (box.w <= 0 || box.h <= 0) return null;
  return { x: round4(box.x), y: round4(box.y), w: round4(box.w), h: round4(box.h) };
}

/** Fields declared inside a fillable PDF, placed exactly where its widgets sit. */
async function pdfFields(document: PDFDocumentProxy): Promise<FormDefinition | undefined> {
  const objects = await document.getFieldObjects();
  if (!objects) return undefined;
  const metadata = new Map<string, { required: boolean; readOnly: boolean; label: string; widgets: WidgetBox[] }>();
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    for (const annotation of await page.getAnnotations()) {
      if (typeof annotation.fieldName !== "string") continue;
      const previous = metadata.get(annotation.fieldName);
      const box = widgetBox(page, annotation.rect);
      const exportValue = typeof annotation.buttonValue === "string" ? annotation.buttonValue : typeof annotation.exportValue === "string" ? annotation.exportValue : "";
      metadata.set(annotation.fieldName, {
        required: annotation.required === true || previous?.required === true,
        readOnly: annotation.readOnly === true,
        label: annotation.alternativeText || previous?.label || annotation.fieldName,
        widgets: [...(previous?.widgets ?? []), ...(box ? [{ page: pageNumber, box, exportValue }] : [])],
      });
    }
  }
  const fields: FormField[] = [];
  for (const [name, entries] of Object.entries(objects)) {
    const widgets = entries as PdfFormWidget[];
    const field = widgets[0];
    const info = metadata.get(name);
    if (!field || field.type === "button" || field.readOnly || field.editable === false || info?.readOnly) continue;
    const options: string[] = field.type === "radiobutton"
      ? widgets.flatMap(widget => Array.isArray(widget.exportValues) ? widget.exportValues : [widget.exportValues ?? ""]).filter(Boolean)
      : Array.isArray(field.items) ? field.items.map((item: { displayValue?: string; exportValue?: string }) => String(item.displayValue ?? item.exportValue ?? "")).filter(Boolean) : [];
    const type = field.type === "checkbox" ? "checkbox"
      : field.type === "radiobutton" ? "radio"
      : field.type === "combobox" || field.type === "listbox" ? (field.multipleSelection ? "checkboxes" : "select")
      : field.type === "signature" ? "signature"
      : field.multiline ? "textarea" : "text";
    if (["radio", "select", "checkboxes"].includes(type) && !options.length) continue;
    const unique = [...new Set(options)];
    const placed = info?.widgets ?? [];
    let placement: FormPlacement | undefined;
    if (placed.length) {
      placement = type === "radio"
        ? { page: placed[0].page, box: null, options: unique.map(option => placed.find(widget => widget.exportValue === option)?.box ?? null) }
        : { page: placed[0].page, box: placed[0].box, options: [] };
    }
    fields.push({ id: `field_${fields.length + 1}`, label: info?.label || field.alternativeText || name, type, required: info?.required === true || field.required === true, helpText: "", options: unique, ...(placement ? { placement } : {}) });
  }
  if (!fields.length) return undefined;
  return parseFormDefinition({ title: "Imported form", description: "", sections: [{ id: "section_1", title: "Form details", description: "", fields }], pages: [] });
}

async function importPdf(file: File, signal?: AbortSignal): Promise<ImportedFormDocument> {
  const loading = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const cancel = () => { void loading.destroy(); };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const document = await loading.promise;
    if (document.numPages > MAX_PAGES) throw new Error(`Upload at most ${MAX_PAGES} pages at a time.`);
    const nativeDefinition = await pdfFields(document);
    const texts: string[] = [];
    const images: string[] = [];
    const pages: ImportedPage[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      checkAborted(signal);
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let previousY: number | undefined;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const currentY = item.transform[5];
        if (previousY !== undefined && Math.abs(currentY - previousY) > 4) lines.push("\n");
        lines.push(item.str + (item.hasEOL ? "\n" : " "));
        previousY = currentY;
      }
      texts.push(`Page ${pageNumber}\n${lines.join("")}`);
      const canvas = await renderPage(page, PAGE_PIXELS);
      checkAborted(signal);
      const runs = await textRuns(page, canvas.width);
      const analysis = nativeDefinition ? { page: pageNumber, width: canvas.width, height: canvas.height, text: [], boxes: [] } : analyseCanvas(canvas, runs, pageNumber);
      pages.push({ src: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height, path: "", analysis });
      if (!nativeDefinition) images.push(shrink(canvas, AI_PIXELS, 0.7));
      releaseCanvas(canvas);
      page.cleanup();
    }
    const title = file.name.replace(/\.pdf$/i, "");
    return { name: file.name, text: texts.join("\n\n"), images, pages, definition: nativeDefinition ? { ...nativeDefinition, title, pages: pages.map(({ analysis: _analysis, ...page }) => page) } : undefined };
  } finally {
    signal?.removeEventListener("abort", cancel);
    await loading.destroy();
  }
}

export function checkFormUpload(file: File): string {
  if (!file.size) throw new Error("The uploaded file is empty.");
  if (file.size > MAX_FORM_UPLOAD_BYTES) throw new Error("Choose a form smaller than 10 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["pdf", "docx", "png", "jpg", "jpeg", "webp"].includes(extension)) {
    throw new Error("Upload a PDF, Word (.docx), PNG, JPG or WebP form.");
  }
  return extension;
}

async function importWord(file: File): Promise<ImportedFormDocument> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("This file is not a valid Word (.docx) document.");
  const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
  if (size && size > 5_000_000) throw new Error("The Word document is too large to process.");
  const xml = await entry.async("string");
  if (xml.length > 5_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsupported Word document structure.");
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("The Word document could not be read.");
  const paragraphs = Array.from(document.getElementsByTagNameNS(WORD_NAMESPACE, "p"));
  const text = paragraphs.map(paragraph => Array.from(paragraph.getElementsByTagNameNS(WORD_NAMESPACE, "t")).map(node => node.textContent ?? "").join("")).filter(Boolean).join("\n");
  if (!text.trim()) throw new Error("No text was found in this Word form. Export scanned or image-only Word documents to PDF first.");
  return { name: file.name, text, images: [], pages: [] };
}

async function importImage(file: File): Promise<ImportedFormDocument> {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, PAGE_PIXELS / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser cannot process the image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const analysis = analyseCanvas(canvas, [], 1);
    const page: ImportedPage = { src: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height, path: "", analysis };
    const ai = shrink(canvas, AI_PIXELS, 0.75);
    releaseCanvas(canvas);
    return { name: file.name, text: "", images: [ai], pages: [page] };
  } finally {
    image.close();
  }
}

export async function extractFormDocument(file: File, signal?: AbortSignal): Promise<ImportedFormDocument> {
  const extension = checkFormUpload(file);
  checkAborted(signal);
  const document = extension === "pdf" ? await importPdf(file, signal)
    : extension === "docx" ? await importWord(file) : await importImage(file);
  checkAborted(signal);
  if (document.text.length > 80_000 || new TextEncoder().encode(JSON.stringify(generationRequest(document))).length > MAX_GENERATION_BYTES) {
    throw new Error("This form has too much content. Split it into smaller documents.");
  }
  return document;
}

/** The body sent to /api/generate-form: the AI's page images and, for
 *  replica pages, their detected geometry (never the full-size pages). */
function generationRequest(document: ImportedFormDocument) {
  return {
    name: document.name,
    text: document.text,
    images: document.images,
    ...(document.pages.length ? { pages: document.pages.map(page => ({ text: page.analysis.text, boxes: page.analysis.boxes })) } : {}),
  };
}

export async function generateFormDefinition(document: ImportedFormDocument, signal?: AbortSignal): Promise<FormDefinition> {
  if (document.definition) return parseFormDefinition(document.definition);
  if (!supabase) throw new Error("AI generation needs a signed-in cloud administrator. Fillable PDFs can be imported locally, or add fields manually.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sign in before generating a form.");
  const response = await fetch("/api/generate-form", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(generationRequest(document)),
    signal,
  });
  // the server streams keep-alive spaces while OpenAI works, then the JSON
  const raw = (await response.text()).trim();
  let body: { definition?: unknown; mastheadBox?: MastheadBox | null; error?: string };
  try {
    if (!raw) throw new Error("empty");
    body = JSON.parse(raw);
  } catch {
    // no JSON means the platform answered, not our function (gateway timeout, size limit…)
    if (response.status === 504 || response.status === 408) {
      throw new Error("Form generation timed out on the server. Try fewer pages or a smaller file.");
    }
    if (response.status === 413) throw new Error("The document is too large to send. Upload a smaller file or fewer pages.");
    if (response.ok) throw new Error("The connection dropped before the form came back. Try again, or use fewer pages.");
    throw new Error(`The form-generation endpoint did not answer properly (HTTP ${response.status}). Check that the latest app is deployed.`);
  }
  if (!response.ok || body.error) throw new Error(body.error || "Form generation failed.");
  const definition = parseFormDefinition(body.definition);
  if (document.pages.length) {
    // the replica carries the full-size page images the fields were bound to
    definition.pages = document.pages.map(({ analysis: _analysis, ...page }) => page);
    return definition;
  }
  if (body.mastheadBox && !definition.masthead) {
    definition.masthead = await cropMasthead(document.images, body.mastheadBox);
  }
  return definition;
}

interface MastheadBox { page: number; x: number; y: number; width: number; height: number }

/** Cut the letterhead the AI located out of the page image so the replica
 *  carries the original logo. Implausible boxes (tiny, huge, off-page) are
 *  ignored rather than risk pasting a random patch of the page. */
async function cropMasthead(images: string[], box: MastheadBox): Promise<string> {
  const source = images[box.page - 1];
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const x = clamp(box.x);
  const y = clamp(box.y);
  const width = clamp(Math.min(box.width, 1 - x));
  const height = clamp(Math.min(box.height, 1 - y));
  if (!source || width < 0.08 || height < 0.02 || height > 0.35 || y > 0.4) return "";
  try {
    const bitmap = await createImageBitmap(await (await fetch(source)).blob());
    try {
      const sx = Math.round(x * bitmap.width);
      const sy = Math.round(y * bitmap.height);
      const sw = Math.max(1, Math.round(width * bitmap.width));
      const sh = Math.max(1, Math.round(height * bitmap.height));
      const scale = Math.min(1, 900 / sw);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const context = canvas.getContext("2d");
      if (!context) return "";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", 0.85);
      return url.length <= MAX_MASTHEAD_CHARS ? url : "";
    } finally {
      bitmap.close();
    }
  } catch {
    return "";
  }
}

const wordsOf = (text: string) => (text.toLowerCase().match(/[a-z0-9][a-z0-9'’&/-]*/g) ?? []).filter(word => word.length >= 3);

/**
 * Verbatim check: lines of the document's own text whose words do not all
 * appear somewhere in the replica. Empty when there is no extracted text
 * (image uploads) or when everything printed made it across.
 */
export function missingPrintedText(document: ImportedFormDocument, definition: FormDefinition): string[] {
  if (!document.text.trim()) return [];
  const known = new Set<string>();
  const learn = (text: string) => { for (const word of wordsOf(text)) known.add(word); };
  learn(definition.title);
  learn(definition.description);
  for (const section of definition.sections) {
    learn(section.title);
    learn(section.description);
    learn(section.banner);
    for (const field of section.fields) {
      learn(field.label);
      learn(field.helpText);
      field.options.forEach(learn);
    }
    for (const row of section.rows) for (const cell of row.cells) learn(cell.text);
  }
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const rawLine of document.text.split(/\n+/)) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line || /^page \d+$/i.test(line)) continue;
    const words = wordsOf(line);
    if (words.length < 2) continue;
    const lost = words.filter(word => !known.has(word));
    // a line counts as missing when a real share of its words never appears
    if (lost.length >= 2 && lost.length / words.length >= 0.4) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      missing.push(line.length > 140 ? `${line.slice(0, 137)}…` : line);
      if (missing.length >= 40) break;
    }
  }
  return missing;
}