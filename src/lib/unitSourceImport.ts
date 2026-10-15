import JSZip from "jszip";
import { MAX_SOURCE_LENGTH } from "./unitBuilder";

/** Discard transport/style artifacts, not document wording or structural delimiters. */
export function cleanImportedText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ").replace(/\u200b/g, "")
    .split("\n").map(line => line.replace(/[ \t]+$/, "")).join("\n").trim();
}

function paragraphText(element: Element): string {
  const pieces: string[] = [];
  function visit(node: Element) {
    if (node.localName === "t") pieces.push(node.textContent ?? "");
    else if (["br", "cr"].includes(node.localName)) pieces.push("\n");
    else if (node.localName === "tab") pieces.push("\t");
    else Array.from(node.children).forEach(visit);
  }
  visit(element);
  return pieces.join("").trim();
}

/** Word list items carry `w:pPr/w:numPr`; the bullet glyph itself is not in the text. */
function isListParagraph(paragraph: Element): boolean {
  const properties = Array.from(paragraph.children).find(child => child.localName === "pPr");
  return !!properties && Array.from(properties.children).some(child => child.localName === "numPr");
}

const xmlValue = (element: Element | undefined, name: string) => element && Array.from(element.attributes).find(attribute => attribute.localName === name)?.value;

function wordListFormatter(numbering?: XMLDocument): (paragraph: Element) => string {
  const counters = new Map<string, number[]>();
  return paragraph => {
    const properties = paragraph.getElementsByTagNameNS("*", "numPr")[0];
    if (!properties) return "";
    const id = xmlValue(properties.getElementsByTagNameNS("*", "numId")[0], "val");
    if (id === "0") return "";
    const level = Number(xmlValue(properties.getElementsByTagNameNS("*", "ilvl")[0], "val") ?? 0);
    if (!Number.isInteger(level) || level < 0 || level > 8) throw new Error("This Word list has an invalid nesting level.");
    const num = numbering && Array.from(numbering.getElementsByTagNameNS("*", "num")).find(item => xmlValue(item, "numId") === id);
    const abstractId = num && xmlValue(num.getElementsByTagNameNS("*", "abstractNumId")[0], "val");
    const definition = numbering && Array.from(numbering.getElementsByTagNameNS("*", "abstractNum")).find(item => xmlValue(item, "abstractNumId") === abstractId);
    const levels = definition && Array.from(definition.getElementsByTagNameNS("*", "lvl"));
    const spec = levels?.find(item => Number(xmlValue(item, "ilvl")) === level);
    if (!id || !spec) throw new Error("This Word list has unreadable numbering. Export the document as plain text and retry.");
    const format = xmlValue(spec.getElementsByTagNameNS("*", "numFmt")[0], "val");
    if (format === "bullet") return "-";
    const formatNumber = (value: number, kind?: string): string => {
      if (kind === "decimal" || !kind) return String(value);
      if (kind === "decimalZero") return String(value).padStart(2, "0");
      if (kind === "lowerLetter" || kind === "upperLetter") {
        let result = "";
        for (let n = value; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(97 + (n - 1) % 26) + result;
        return kind === "upperLetter" ? result.toUpperCase() : result;
      }
      if (kind === "lowerRoman" || kind === "upperRoman") {
        let n = value, result = "";
        for (const [amount, symbol] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as const) {
          while (n >= amount) { result += symbol; n -= amount; }
        }
        return kind === "lowerRoman" ? result.toLowerCase() : result;
      }
      throw new Error(`Word numbering format "${kind}" needs a plain-text export before importing.`);
    };
    const values = counters.get(id) ?? [];
    const override = num && Array.from(num.getElementsByTagNameNS("*", "lvlOverride")).find(item => Number(xmlValue(item, "ilvl")) === level);
    const start = Number(xmlValue(override?.getElementsByTagNameNS("*", "startOverride")[0], "val") ?? xmlValue(spec.getElementsByTagNameNS("*", "start")[0], "val") ?? 1);
    if (!Number.isSafeInteger(start) || start < 0 || start > 10000) throw new Error("This Word list has an unsupported start number.");
    values[level] = values[level] === undefined ? start : values[level] + 1;
    values.length = level + 1;
    counters.set(id, values);
    return (xmlValue(spec.getElementsByTagNameNS("*", "lvlText")[0], "val") ?? `%${level + 1}.`).replace(/%(\d)/g, (_, digit: string) => {
      const index = Number(digit) - 1;
      const referenced = levels?.find(item => Number(xmlValue(item, "ilvl")) === index);
      return formatNumber(values[index] ?? Number(xmlValue(referenced?.getElementsByTagNameNS("*", "start")[0], "val") ?? 1), xmlValue(referenced?.getElementsByTagNameNS("*", "numFmt")[0], "val"));
    });
  };
}

function tableMarkdown(table: Element, listPrefix: (paragraph: Element) => string): string {
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
    // Keep each cell paragraph on its own line (`<br>`, which the table reader
    // turns back into a newline) and mark list items, so a schedule cell such as
    // "Title / • step / • step" survives the round trip.
    const text = Array.from(cell.getElementsByTagNameNS("*", "p"))
      .map(paragraph => {
        const value = paragraphText(paragraph).replace(/[ \t]+/g, " ").replace(/\n/g, "<br>");
        const prefix = listPrefix(paragraph);
        return value ? (prefix ? `${prefix} ${value}` : value) : "";
      })
      .filter(Boolean).join("<br>")
      .replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
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

function officeDocumentText(doc: XMLDocument, presentation: boolean, listPrefix: (paragraph: Element) => string): string {
  const blocks: string[] = [];
  let hasTitle = false;
  function visit(element: Element) {
    if (element.localName === "tbl") {
      const table = tableMarkdown(element, listPrefix);
      if (table) blocks.push(table);
    } else if (element.localName === "p") {
      const plain = paragraphText(element);
      const prefix = listPrefix(element);
      const text = prefix ? `${prefix} ${plain}` : plain;
      if (text) {
        const style = element.getElementsByTagNameNS("*", "pStyle")[0];
        const name = style && Array.from(style.attributes).find(attribute => attribute.localName === "val")?.value;
        const heading = name?.match(/^heading\s*([1-6])$/i);
        blocks.push(heading ? `${"#".repeat(Number(heading[1]))} ${text}`
          : presentation && !hasTitle ? `# ${text}` : text);
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
        let pageText = "";
        let previous: { x: number; y: number; width: number; height: number; eol: boolean } | undefined;
        for (const item of data.items) {
          if (!("str" in item)) continue;
          const x = item.transform[4], y = item.transform[5];
          if (previous && item.str) {
            const lineHeight = Math.max(item.height, previous.height, 1);
            const gap = Math.abs(y - previous.y);
            if (gap > lineHeight * 0.5) pageText += gap > lineHeight * 1.7 ? "\n\n" : previous.eol ? "" : "\n";
            else if (!previous.eol) pageText += x - previous.x - previous.width > lineHeight ? "\t" : " ";
          }
          pageText += item.str + (item.hasEOL ? "\n" : "");
          previous = { x, y, width: item.width, height: item.height, eol: item.hasEOL };
        }
        if (!pageText.trim()) throw new Error(`Page ${n} has no readable text. Run OCR or upload a text-based document so no page is lost.`);
        text += (n > 1 ? "\n\f\n" : "") + pageText.trim();
        if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
      }
    } finally { await task.destroy(); }
  } else if (extension === "docx" || extension === "pptx") {
    const zip = await JSZip.loadAsync(file);
    const numberingXml = await zip.file("word/numbering.xml")?.async("string");
    const listPrefix = extension === "docx"
      ? wordListFormatter(numberingXml ? new DOMParser().parseFromString(numberingXml, "application/xml") : undefined)
      : (paragraph: Element) => isListParagraph(paragraph) ? "-" : "";
    const paths = extension === "docx" ? ["word/document.xml"] : Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a,b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
    for (const path of paths) {
      const entry = zip.file(path);
      if (!entry) continue;
      const xml = await entry.async("string");
      if (xml.length > 10_000_000) throw new Error("This document is too complex. Export it as text first.");
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) throw new Error("The Office document could not be read. Export it as text and retry.");
      text += officeDocumentText(doc, extension === "pptx", listPrefix) + "\n\n";
      if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
    }
  } else throw new Error("Use a TXT, Markdown, PDF, DOCX or PPTX file.");
  if (!text.trim()) throw new Error("No readable text was found. For scanned documents, paste the text or upload a text-based PDF.");
  if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
  return cleanImportedText(text);
}
