import type { PracticalTaskDocument } from "../types";
import { rebuildCoursePdf, unitPdfFromImport } from "./coursePdfRebuildAgent";

export { unitPdfFromImport };

/** Backwards-compatible entry point. All course PDFs now pass through the agent. */
export async function importUnitPdf(file: File, title: string, onProgress?: (done: number, total: number) => void): Promise<PracticalTaskDocument> {
  return (await rebuildCoursePdf(file, title, onProgress)).document;
}
