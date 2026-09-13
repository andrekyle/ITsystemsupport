import JSZip from "jszip";
import { GlobalWorkerOptions, OPS, getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { MAX_MASTHEAD_CHARS, parseFormDefinition, type FormBox, type FormDefinition, type FormField, type FormPage, type FormPlacement, type LayerText, type PageLayer } from "./formSchema";
import { analysePage, estimateSkew, extractLayer, textColour, type PageAnalysis, type PixelSource, type TextRun } from "./pageAnalysis";
import { supabase } from "./supabase";

GlobalWorkerOptions.workerSrc = workerUrl;

export const FORM_UPLOAD_ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp,.bmp,.gif";
export const MAX_FORM_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 30;
const MAX_GENERATION_BYTES = 3_400_000;
// the replica page (what the form shows and prints) and the lighter copy the AI reads
const PAGE_PIXELS = 1654;
const AI_PIXELS = 1300;
// replica pages are generated one request at a time, this many at once
const GENERATION_CONCURRENCY = 2;
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
  /** text field: one character per cell, charLimit cells across */
  comb?: boolean;
  charLimit?: number;
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
  // an opaque canvas gets sub-pixel (coloured) text anti-aliasing in Chrome,
  // which reads back as orange and blue fringes on small print; the first
  // getContext call fixes the canvas's attributes for good
  const canvasContext = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!canvasContext) throw new Error("This browser cannot process the page image.");
  await page.render({ canvas, canvasContext, viewport, intent: "print", background: "#ffffff" }).promise;
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

/** A scan that came in slightly rotated is straightened, so its rules read as
 *  rows again and the replica page hangs straight. Text runs measured on the
 *  original pixels are turned with it. */
function deskewCanvas(canvas: HTMLCanvasElement, runs: TextRun[]): HTMLCanvasElement {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const skew = estimateSkew({ data: image.data, width: image.width, height: image.height, channels: 4 });
  if (Math.abs(skew) < 0.15) return canvas;
  const straight = window.document.createElement("canvas");
  straight.width = canvas.width;
  straight.height = canvas.height;
  const target = straight.getContext("2d", { willReadFrequently: true });
  if (!target) return canvas;
  const angle = (-skew * Math.PI) / 180;
  target.fillStyle = "#ffffff";
  target.fillRect(0, 0, straight.width, straight.height);
  target.translate(straight.width / 2, straight.height / 2);
  target.rotate(angle);
  target.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  for (const run of runs) {
    const dx = run.x + run.w / 2 - cx;
    const dy = run.y + run.h / 2 - cy;
    run.x = cx + dx * Math.cos(angle) - dy * Math.sin(angle) - run.w / 2;
    run.y = cy + dx * Math.sin(angle) + dy * Math.cos(angle) - run.h / 2;
  }
  releaseCanvas(canvas);
  return straight;
}

interface TextItem extends TextRun {
  /** font size in canvas pixels */
  size: number;
  font: string;
  bold: boolean;
  italic: boolean;
}

/** The face the PDF used, reduced to a family the browser can offer. */
function describeFont(name: string, generic: string): { font: string; bold: boolean; italic: boolean } {
  const lower = name.toLowerCase();
  const bold = /bold|black|heavy|semibold|demibold|extrabold/.test(lower);
  const italic = /italic|oblique/.test(lower);
  const families: [RegExp, string][] = [
    [/calibri|carlito/, "calibri"], [/cambria|caladea/, "cambria"], [/times|tinos|liberationserif|nimbusroman/, "times"],
    [/georgia/, "georgia"], [/garamond/, "garamond"], [/verdana/, "verdana"], [/tahoma/, "tahoma"], [/segoe/, "segoe"],
    [/trebuchet/, "trebuchet"], [/courier|cousine|mono/, "mono"], [/arialnarrow|narrow/, "arial-narrow"], [/arial|helvetica|liberationsans|arimo|nimbussans/, "arial"],
    [/century|schoolbook/, "century"], [/book ?antiqua|palatino/, "palatino"], [/comic/, "comic"], [/impact/, "impact"],
  ];
  const family = families.find(([pattern]) => pattern.test(lower.replace(/[\s_-]/g, "")) || pattern.test(lower))?.[1]
    ?? (generic.includes("serif") && !generic.includes("sans") ? "times" : generic.includes("mono") ? "mono" : "sans");
  return { font: family, bold, italic };
}

async function textItems(page: PDFPageProxy, width: number): Promise<TextItem[]> {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const content = await page.getTextContent();
  const items: TextItem[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    // transform: [scaleX, skewY, skewX, scaleY, x, y] in PDF space, y up from the bottom
    const [a, b, , , e, f] = item.transform;
    const fontSize = Math.hypot(a, b) || item.height || 1;
    const [x1, baseline] = viewport.convertToViewportPoint(e, f);
    const [x2, top] = viewport.convertToViewportPoint(e + item.width, f + fontSize * 0.8);
    const left = Math.min(x1, x2);
    const runTop = Math.min(baseline, top);
    const style = content.styles[item.fontName];
    let fontName = "";
    try {
      fontName = (page.commonObjs.get(item.fontName) as { name?: string } | undefined)?.name ?? "";
    } catch {
      /* font not loaded for this page */
    }
    items.push({
      text: item.str,
      x: left,
      y: runTop,
      w: Math.abs(x2 - x1) || fontSize * viewport.scale * 0.5,
      h: Math.abs(baseline - top) + fontSize * viewport.scale * 0.2,
      size: fontSize * viewport.scale,
      ...describeFont(fontName, style?.fontFamily ?? "sans-serif"),
    });
  }
  // fake bold: the same words printed twice a hair apart (whole or letter by
  // letter) become one bold run - widest runs first so fragments fall inside
  const kept: TextItem[] = [];
  for (const item of [...items].sort((a, b) => b.w - a.w)) {
    const slack = item.size * 0.2;
    const twin = kept.find(other => Math.abs(other.size - item.size) <= item.size * 0.1
      && Math.abs(other.y - item.y) <= slack
      && item.x >= other.x - slack && item.x + item.w <= other.x + other.w + slack
      && (other.text === item.text || other.text.includes(item.text.trim())));
    if (twin) { twin.bold = true; continue; }
    kept.push(item);
  }
  return kept.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** A scanned page carrying an OCR text layer draws its words invisibly over
 *  the picture; that text only roughly follows the print and must not be
 *  rebuilt as the page. */
async function hasHiddenText(page: PDFPageProxy): Promise<boolean> {
  try {
    const ops = await page.getOperatorList();
    return ops.fnArray.some((fn, index) => fn === OPS.setTextRenderingMode && [3, 7].includes(Number(ops.argsArray[index]?.[0])));
  } catch {
    return false;
  }
}

/** The page rebuilt as real text plus its drawn shapes, with picture regions
 *  cut from the render. */
function buildLayer(canvas: HTMLCanvasElement, items: TextItem[], analysis: PageAnalysis): PageLayer | undefined {
  if (!items.length) return undefined;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return undefined;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels: PixelSource = { data: image.data, width: image.width, height: image.height, channels: 4 };
  const round = (v: number) => Math.round(v * 10000) / 10000;
  const text: LayerText[] = items.map(item => ({
    t: item.text,
    x: round(item.x / canvas.width),
    y: round(item.y / canvas.height),
    w: round(item.w / canvas.width),
    h: round(item.h / canvas.height),
    s: round(item.size / canvas.width),
    f: item.font,
    b: item.bold,
    i: item.italic,
    c: textColour(pixels, { x: item.x, y: item.y, w: item.w, h: item.h }),
  }));
  const ticks = analysis.boxes.filter(box => box.kind === "tick").map(box => ({ x: box.x * canvas.width, y: box.y * canvas.height, w: box.w * canvas.width, h: box.h * canvas.height }));
  const combs = analysis.boxes.filter(box => box.kind === "comb" && box.n).map(box => ({ x: box.x * canvas.width, y: box.y * canvas.height, w: box.w * canvas.width, h: box.h * canvas.height, n: box.n! }));
  const geometry = extractLayer(pixels, items, ticks, combs);
  // text that leaves much of the page's ink unexplained is not the print
  // (an OCR layer, outlined lettering): the picture is the truer page
  const pictureArea = geometry.pictures.reduce((sum, rect) => sum + rect.w * rect.h, 0) / (canvas.width * canvas.height);
  if (geometry.unexplained > 0.35 || pictureArea > 0.2) return undefined;
  const pictures = geometry.pictures.flatMap(rect => {
    const crop = window.document.createElement("canvas");
    crop.width = Math.max(1, Math.round(rect.w));
    crop.height = Math.max(1, Math.round(rect.h));
    const target = crop.getContext("2d");
    if (!target) return [];
    target.drawImage(canvas, Math.round(rect.x), Math.round(rect.y), crop.width, crop.height, 0, 0, crop.width, crop.height);
    const src = crop.toDataURL("image/png");
    releaseCanvas(crop);
    return [{ x: round(rect.x / canvas.width), y: round(rect.y / canvas.height), w: round(rect.w / canvas.width), h: round(rect.h / canvas.height), src, path: "" }];
  });
  return { text, rules: geometry.rules, fills: geometry.fills, frames: geometry.frames, combs: geometry.combs, pictures };
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
    // a comb text field types one character per printed cell
    const comb = type === "text" && field.comb === true && Number.isInteger(field.charLimit) && (field.charLimit as number) >= 2 ? field.charLimit as number : 0;
    let placement: FormPlacement | undefined;
    if (placed.length) {
      placement = type === "radio"
        ? { page: placed[0].page, box: null, options: unique.map(option => placed.find(widget => widget.exportValue === option)?.box ?? null) }
        : { page: placed[0].page, box: placed[0].box, options: [], ...(comb ? { comb } : {}) };
    }
    fields.push({ id: `field_${fields.length + 1}`, label: info?.label || field.alternativeText || name, type, required: info?.required === true || field.required === true, helpText: "", options: unique, ...(placement ? { placement } : {}), ...(Number.isInteger(field.charLimit) && (field.charLimit as number) > 0 ? { maxLength: field.charLimit as number } : {}) });
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
      let canvas = await renderPage(page, PAGE_PIXELS);
      checkAborted(signal);
      const items = await textItems(page, canvas.width);
      const runs: TextRun[] = items;
      // scanned pages (with or without an OCR text layer) come in slightly rotated
      if (!nativeDefinition) canvas = deskewCanvas(canvas, runs);
      const analysis = nativeDefinition ? { page: pageNumber, width: canvas.width, height: canvas.height, text: [], boxes: [] } : analyseCanvas(canvas, runs, pageNumber);
      const layer = (await hasHiddenText(page)) ? undefined : buildLayer(canvas, items, analysis);
      pages.push({ src: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height, path: "", ...(layer ? { layer } : {}), analysis });
      if (!nativeDefinition) images.push(shrink(canvas, AI_PIXELS, 0.7));
      releaseCanvas(canvas);
      page.cleanup();
    }
    const title = file.name.replace(/\.pdf$/i, "");
    return { name: file.name, text: texts.join("\n\n"), images, pages, definition: nativeDefinition ? { ...nativeDefinition, title, pages: pages.map(({ analysis: _analysis, ...page }) => page), display: pages.some(page => page.layer) ? "digital" : "image" } : undefined };
  } finally {
    signal?.removeEventListener("abort", cancel);
    await loading.destroy();
  }
}

export function checkFormUpload(file: File): string {
  if (!file.size) throw new Error("The uploaded file is empty.");
  if (file.size > MAX_FORM_UPLOAD_BYTES) throw new Error("Choose a form smaller than 25 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["pdf", "docx", "png", "jpg", "jpeg", "webp", "bmp", "gif"].includes(extension)) {
    throw new Error("Upload a PDF, Word (.docx), PNG, JPG, WebP, BMP or GIF form. Scan paper forms to PDF or JPG first.");
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
    let canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser cannot process the image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas = deskewCanvas(canvas, []);
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
  // replica pages go to the AI one page per request, so only a text-only document can be too big
  if (document.text.length > 80_000 || (!document.pages.length && new TextEncoder().encode(JSON.stringify(generationRequest(document))).length > MAX_GENERATION_BYTES)) {
    throw new Error("This form has too much content. Split it into smaller documents.");
  }
  return document;
}

/** The body sent to /api/generate-form: the AI's page images and, for
 *  replica pages, their detected geometry (never the full-size pages). */
function generationRequest(document: ImportedFormDocument, pageIndex?: number) {
  if (pageIndex !== undefined) {
    const page = document.pages[pageIndex];
    return { name: document.name, text: "", images: [document.images[pageIndex]], pages: [{ text: page.analysis.text, boxes: page.analysis.boxes }] };
  }
  return {
    name: document.name,
    text: document.text,
    images: document.images,
    ...(document.pages.length ? { pages: document.pages.map(page => ({ text: page.analysis.text, boxes: page.analysis.boxes })) } : {}),
  };
}

async function requestDefinition(body: unknown, token: string, signal?: AbortSignal): Promise<{ definition: FormDefinition; mastheadBox?: MastheadBox | null }> {
  const response = await fetch("/api/generate-form", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal,
  });
  // the server streams keep-alive spaces while OpenAI works, then the JSON
  const raw = (await response.text()).trim();
  let result: { definition?: unknown; mastheadBox?: MastheadBox | null; error?: string };
  try {
    if (!raw) throw new Error("empty");
    result = JSON.parse(raw);
  } catch {
    // no JSON means the platform answered, not our function (gateway timeout, size limit…)
    if (response.status === 504 || response.status === 408) {
      throw new Error("Form generation timed out on the server. Try fewer pages or a smaller file.");
    }
    if (response.status === 413) throw new Error("The document is too large to send. Upload a smaller file or fewer pages.");
    if (response.ok) throw new Error("The connection dropped before the form came back. Try again, or use fewer pages.");
    throw new Error(`The form-generation endpoint did not answer properly (HTTP ${response.status}). Check that the latest app is deployed.`);
  }
  if (!response.ok || result.error) throw new Error(result.error || "Form generation failed.");
  // a page the model found nothing to fill in on comes back with no sections
  const answer = result.definition as { sections?: unknown[]; title?: unknown } | undefined;
  if (answer && Array.isArray(answer.sections) && !answer.sections.length) {
    return { definition: { title: typeof answer.title === "string" ? answer.title : "", description: "", sections: [], titleColor: "", accentColor: "", masthead: "", pages: [], display: "image" }, mastheadBox: null };
  }
  return { definition: parseFormDefinition(result.definition), mastheadBox: result.mastheadBox };
}

/** Fields of one page's answer, renumbered onto that page with ids that
 *  cannot collide with the other pages' answers. */
function pageFields(definition: FormDefinition, pageNumber: number): FormField[] {
  return definition.sections.flatMap(section => section.fields).map(field => ({
    ...field,
    id: `p${pageNumber}_${field.id}`,
    ...(field.placement ? { placement: { ...field.placement, page: pageNumber } } : {}),
  }));
}

export async function generateFormDefinition(document: ImportedFormDocument, signal?: AbortSignal, onProgress?: (done: number, total: number) => void): Promise<FormDefinition> {
  if (document.definition) return parseFormDefinition(document.definition);
  if (!supabase) throw new Error("AI generation needs a signed-in cloud administrator. Fillable PDFs can be imported locally, or add fields manually.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sign in before generating a form.");
  const token = data.session.access_token;
  if (document.pages.length) {
    // one request per page: dense multi-page forms stay within the request and answer limits
    const total = document.pages.length;
    const results: FormDefinition[] = new Array(total);
    let next = 0;
    let done = 0;
    onProgress?.(0, total);
    const worker = async () => {
      while (next < total) {
        const index = next++;
        results[index] = (await requestDefinition(generationRequest(document, index), token, signal)).definition;
        done += 1;
        onProgress?.(done, total);
      }
    };
    await Promise.all(Array.from({ length: Math.min(GENERATION_CONCURRENCY, total) }, worker));
    const title = results.map(result => result.title).find(value => value && value !== "Form") ?? results[0].title;
    const sections = results.map((result, index) => ({
      id: `page_${index + 1}`,
      title: total > 1 ? `Page ${index + 1}` : "",
      description: "",
      fields: pageFields(result, index + 1),
      columns: 4,
      widths: [],
      rows: [],
      banner: "",
      pageBreak: false,
    })).filter(section => section.fields.length);
    const pages = document.pages.map(({ analysis: _analysis, ...page }) => page);
    // no detected fields is still a usable replica: everything can be written with fill & sign
    return parseFormDefinition({ title, description: "", sections, titleColor: "", accentColor: "", masthead: "", pages, display: pages.some(page => page.layer) ? "digital" : "image" });
  }
  const { definition, mastheadBox } = await requestDefinition(generationRequest(document), token, signal);
  if (!definition.sections.length) throw new Error("No fillable fields could be identified. Upload a clearer blank form or add the fields manually.");
  if (mastheadBox && !definition.masthead) {
    definition.masthead = await cropMasthead(document.images, mastheadBox);
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