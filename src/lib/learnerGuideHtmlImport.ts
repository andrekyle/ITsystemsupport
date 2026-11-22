import type { PracticalTaskDocument } from "../types";
import { MAX_SOURCE_LENGTH } from "./unitBuilder";
import type { FormDefinition, FormPage } from "./formSchema";

const MAX_HTML_BYTES = 20 * 1024 * 1024;
const MAX_HTML_PAGES = 100;

function stripExternalResources(source: string): string {
  return source
    .replace(/<(script|style|iframe|object|embed|link|video|audio|source|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(?:base|link|meta|iframe|object|embed|video|audio|source|svg)\b[^>]*\/?>/gi, "")
    .replace(/\s(?:srcset|href|poster|data)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\ssrc\s*=\s*(?!(?:"|')?data:image\/(?:png|jpe?g|webp);base64,)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/url\([^)]+\)/gi, "none");
}

function pageSize(page: HTMLElement, property: "width" | "height"): number {
  const value = page.style.getPropertyValue(property).match(/^\s*([\d.]+)px\s*$/i);
  const size = value ? Number(value[1]) : 0;
  if (!Number.isFinite(size) || size <= 0) throw new Error("Every HTML guide page must specify its width and height in pixels.");
  return size;
}

function pageImage(page: HTMLElement): string {
  const image = page.querySelector<HTMLImageElement>("img.f") ?? page.querySelector<HTMLImageElement>("img:not(.b)");
  const src = image?.getAttribute("src") ?? "";
  if (!/^data:image\/(?:png|jpe?g|webp);base64,/i.test(src)) {
    throw new Error("The HTML guide must include each page as an embedded PNG, JPEG or WebP image.");
  }
  return src;
}

/** Imports a page-based HTML guide without executing or rendering its markup. */
export async function importLearnerGuideHtml(file: File, title: string, onProgress?: (done: number, total: number) => void): Promise<PracticalTaskDocument> {
  if (!/\.html?$/i.test(file.name)) throw new Error("Choose an HTML learner guide.");
  if (!file.size || file.size > MAX_HTML_BYTES) throw new Error("Choose a non-empty HTML file under 20 MB.");
  if (file.type && !["text/html", "application/xhtml+xml", "application/octet-stream"].includes(file.type)) {
    throw new Error("Choose an HTML learner guide.");
  }

  const source = await file.text();
  const parsed = new DOMParser().parseFromString(stripExternalResources(source), "text/html");
  const pages = Array.from(parsed.querySelectorAll<HTMLElement>(".page"));
  if (!pages.length) throw new Error("No page-based guide content was found. Upload an HTML guide with embedded page images.");
  if (pages.length > MAX_HTML_PAGES) throw new Error(`The HTML guide has ${pages.length} pages. Split it into files with no more than ${MAX_HTML_PAGES} pages each.`);

  const pageText: string[] = [];
  const formPages: FormPage[] = [];
  onProgress?.(0, pages.length);
  for (const [index, page] of pages.entries()) {
    const text = Array.from(page.querySelectorAll(".textLayer span")).map(span => span.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
    pageText.push(text);
    formPages.push({
      src: pageImage(page),
      width: pageSize(page, "width"),
      height: pageSize(page, "height"),
      path: "",
    });
    onProgress?.(index + 1, pages.length);
    await new Promise<void>(resolve => window.setTimeout(resolve, 0));
  }
  const sourceText = pageText.join("\n\f\n");
  if (sourceText.length > MAX_SOURCE_LENGTH) throw new Error("The HTML guide's text layer exceeds 120,000 characters. Split the document.");

  const sections: FormDefinition["sections"] = pages.map((_, index) => ({
    id: `page_${index + 1}`,
    title: `Page ${index + 1}`,
    description: "",
    fields: [],
    columns: 4,
    widths: [],
    rows: [],
    banner: "",
    pageBreak: false,
  }));
  const replica: FormDefinition = {
    title,
    description: "",
    sections,
    titleColor: "",
    accentColor: "",
    masthead: "",
    pages: formPages,
    display: "image",
  };
  return {
    title,
    sourceName: file.name,
    sourceText,
    sourcePageCount: pages.length,
    replica,
    sections: pages.map((_, index) => ({
      id: `page_${index + 1}`,
      title: `Page ${index + 1}`,
      blocks: [{ kind: "page", number: index + 1 }],
    })),
  };
}
