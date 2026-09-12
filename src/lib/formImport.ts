import JSZip from "jszip";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { parseFormDefinition, type FormDefinition, type FormField } from "./formSchema";
import { supabase } from "./supabase";

GlobalWorkerOptions.workerSrc = workerUrl;

export const FORM_UPLOAD_ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp";
export const MAX_FORM_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 12;
const MAX_GENERATION_BYTES = 3_400_000;
const WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export interface ImportedFormDocument {
  name: string;
  text: string;
  images: string[];
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

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Import cancelled.", "AbortError");
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

async function pdfFields(document: PDFDocumentProxy): Promise<FormDefinition | undefined> {
  const objects = await document.getFieldObjects();
  if (!objects) return undefined;
  const metadata = new Map<string, { required: boolean; readOnly: boolean; label: string }>();
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    for (const annotation of await page.getAnnotations()) {
      if (typeof annotation.fieldName !== "string") continue;
      const previous = metadata.get(annotation.fieldName);
      metadata.set(annotation.fieldName, {
        required: annotation.required === true || previous?.required === true,
        readOnly: annotation.readOnly === true,
        label: annotation.alternativeText || previous?.label || annotation.fieldName,
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
    fields.push({ id: `field_${fields.length + 1}`, label: info?.label || field.alternativeText || name, type, required: info?.required === true || field.required === true, helpText: "", options: [...new Set(options)] });
  }
  if (!fields.length) return undefined;
  return parseFormDefinition({ title: "Imported form", description: "", sections: [{ id: "section_1", title: "Form details", description: "", fields }] });
}

async function importPdf(file: File, signal?: AbortSignal): Promise<ImportedFormDocument> {
  const loading = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const cancel = () => { void loading.destroy(); };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const document = await loading.promise;
    if (document.numPages > MAX_PAGES) throw new Error(`Upload at most ${MAX_PAGES} pages at a time.`);
    const nativeDefinition = await pdfFields(document);
    const pages: string[] = [];
    const images: string[] = [];
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
      pages.push(`Page ${pageNumber}\n${lines.join("")}`);
      if (!nativeDefinition) {
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1.8, 1300 / Math.max(base.width, base.height)) });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport, intent: "print" }).promise;
        images.push(canvas.toDataURL("image/jpeg", 0.7));
        canvas.width = 0;
        canvas.height = 0;
      }
      page.cleanup();
    }
    const title = file.name.replace(/\.pdf$/i, "");
    return { name: file.name, text: pages.join("\n\n"), images, definition: nativeDefinition ? { ...nativeDefinition, title } : undefined };
  } finally {
    signal?.removeEventListener("abort", cancel);
    await loading.destroy();
  }
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
  return { name: file.name, text, images: [] };
}

async function importImage(file: File): Promise<ImportedFormDocument> {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot process the image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { name: file.name, text: "", images: [canvas.toDataURL("image/jpeg", 0.8)] };
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
  if (document.text.length > 80_000 || new TextEncoder().encode(JSON.stringify(document)).length > MAX_GENERATION_BYTES) {
    throw new Error("This form has too much content. Split it into smaller documents.");
  }
  return document;
}

export async function generateFormDefinition(document: ImportedFormDocument, signal?: AbortSignal): Promise<FormDefinition> {
  if (document.definition) return parseFormDefinition(document.definition);
  if (!supabase) throw new Error("AI generation needs a signed-in cloud administrator. Fillable PDFs can be imported locally, or add fields manually.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sign in before generating a form.");
  const response = await fetch("/api/generate-form", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ name: document.name, text: document.text, images: document.images }),
    signal,
  });
  let body: { definition?: unknown; error?: string };
  try {
    body = await response.json();
  } catch {
    // no JSON means the platform answered, not our function (gateway timeout, size limit…)
    if (response.status === 504 || response.status === 408) {
      throw new Error("Form generation timed out on the server. Try fewer pages or a smaller file.");
    }
    if (response.status === 413) throw new Error("The document is too large to send. Upload a smaller file or fewer pages.");
    throw new Error(`The form-generation endpoint did not answer properly (HTTP ${response.status}). Check that the latest app is deployed.`);
  }
  if (!response.ok || body.error) throw new Error(body.error || "Form generation failed.");
  return parseFormDefinition(body.definition);
}