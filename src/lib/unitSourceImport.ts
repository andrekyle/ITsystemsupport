import JSZip from "jszip";
import { MAX_SOURCE_LENGTH } from "./unitBuilder";

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
      const paras = Array.from(doc.getElementsByTagNameNS("*", "p"));
      const paragraphs = paras.map(p => Array.from(p.getElementsByTagNameNS("*", "t")).map(t => t.textContent ?? "").join("")).filter(Boolean);
      text += (extension === "pptx" && paragraphs.length ? `# ${paragraphs[0]}\n\n${paragraphs.slice(1).join("\n\n")}` : paragraphs.join("\n\n")) + "\n\n";
      if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
    }
  } else throw new Error("Use a TXT, Markdown, PDF, DOCX or PPTX file.");
  if (!text.trim()) throw new Error("No readable text was found. For scanned documents, paste the text or upload a text-based PDF.");
  if (text.length > MAX_SOURCE_LENGTH) throw new Error("The source exceeds 120,000 characters. Split the document.");
  return text.trim();
}
