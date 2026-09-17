import JSZip from "jszip";
import { MAX_SOURCE_LENGTH } from "./unitBuilder";

function paragraphText(element: Element): string {
  const pieces: string[] = [];
  function visit(node: Element) {
    if (node.localName === "t") pieces.push(node.textContent ?? "");
    else if (["br", "cr", "tab"].includes(node.localName)) pieces.push(" ");
    else Array.from(node.children).forEach(visit);
  }
  visit(element);
  return pieces.join("").trim();
}

function tableMarkdown(table: Element): string {
  // Stop at the requested element so nested tables cannot duplicate outer rows
  // or cells. Nested cell content still contributes its text to that cell.
  function descendants(parent: Element, name: string): Element[] {
    return Array.from(parent.children).flatMap(child => {
      if (child.localName === name) return [child];
      if (child.localName === "tbl") return [];
      return descendants(child, name);
    });
  }
  const rows = descendants(table, "tr").map(row => descendants(row, "tc").flatMap(cell => {
    const text = Array.from(cell.getElementsByTagNameNS("*", "p"))
      .map(paragraphText).filter(Boolean).join(" ")
      .replace(/\s+/g, " ").replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
    const properties = Array.from(cell.children).find(child => child.localName === "tcPr");
    const spanElement = properties && Array.from(properties.children).find(child => child.localName === "gridSpan");
    // Word omits cells covered by gridSpan. PowerPoint keeps those cells with
    // hMerge/vMerge flags, so its existing cell positions need no expansion.
    const spanValue = spanElement && Array.from(spanElement.attributes).find(attribute => attribute.localName === "val")?.value;
    const span = Math.max(1, Math.min(100, Math.floor(Number(spanValue) || 1)));
    return [text, ...Array.from({ length: span - 1 }, () => "")];
  }));
  if (!rows.length || !rows.some(row => row.some(Boolean))) return "";
  const width = Math.max(...rows.map(row => row.length));
  const format = (row: string[]) => `| ${Array.from({ length: width }, (_, index) => row[index] ?? "").join(" | ")} |`;
  return [format(rows[0]), format(Array.from({ length: width }, () => "---")), ...rows.slice(1).map(format)].join("\n");
}

function officeDocumentText(doc: XMLDocument, presentation: boolean): string {
  const blocks: string[] = [];
  let hasTitle = false;
  function visit(element: Element) {
    if (element.localName === "tbl") {
      const table = tableMarkdown(element);
      if (table) blocks.push(table);
    } else if (element.localName === "p") {
      const text = paragraphText(element);
      if (text) {
        blocks.push(presentation && !hasTitle ? `# ${text}` : text);
        hasTitle = true;
      }
    } else Array.from(element.children).forEach(visit);
  }
  visit(doc.documentElement);
  return blocks.join("\n\n");
}

export async function importUnitSource(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) throw new Error("Choose a source document under 20 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  if (["txt", "md"].includes(extension ?? "")) text = await file.text();
  else if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const doc = await task.promise;
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const data = await page.getTextContent();
        text += data.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("") + "\n\n";
        if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
      }
    } finally { await task.destroy(); }
  } else if (extension === "docx" || extension === "pptx") {
    const zip = await JSZip.loadAsync(file);
    const paths = extension === "docx" ? ["word/document.xml"] : Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a,b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
    for (const path of paths) {
      const entry = zip.file(path);
      if (!entry) continue;
      const xml = await entry.async("string");
      if (xml.length > 10_000_000) throw new Error("This document is too complex. Export it as text first.");
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      text += officeDocumentText(doc, extension === "pptx") + "\n\n";
      if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
    }
  } else throw new Error("Use a TXT, Markdown, PDF, DOCX or PPTX file.");
  if (!text.trim()) throw new Error("No readable text was found. For scanned documents, paste the text or upload a text-based PDF.");
  if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
  return text.trim();
}
