import type { PracticalTaskDocument, PracticalTaskField, PracticalTaskSection } from "../types";
import { importUnitSource } from "./unitSourceImport";

const FIELD_LABEL = /^(name|surname|id number|contact|learner|organisation|unit\/?dept|telephone|email|venue|facilitator|date|workplace|coach|mentor|received|signature|comments|feedback|address)/i;
const HEADING = /^(general information|learner details|workshop details|practical work|practical assessment|observational checklist|witness testimony|workplace testimonial|overall performance|so\s*\d+)/i;

function slug(value: string, fallback: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || fallback;
}

/** Convert a text-based practical-task PDF into a safe editable form structure. */
export async function importPracticalTask(file: File, unitTitle: string): Promise<PracticalTaskDocument> {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Choose a PDF practical-task document.");
  const source = await importUnitSource(file);
  const lines = source.split(/\n+/).map(line => line.replace(/\s{2,}/g, " ").trim()).filter(Boolean);
  const sections: PracticalTaskSection[] = [];
  let current: PracticalTaskSection = { id: "task-details", title: "Practical task details", fields: [] };
  sections.push(current);
  let fieldNo = 0;
  let itemNo = 0;

  for (const line of lines) {
    if (HEADING.test(line) && line.length < 140) {
      current = { id: slug(line, `section-${sections.length + 1}`), title: line, fields: [], items: [] };
      sections.push(current);
    } else if (FIELD_LABEL.test(line) && line.length < 100) {
      const field: PracticalTaskField = { id: slug(line, `field-${++fieldNo}`), label: line.replace(/:$/, ""), type: /comment|feedback|address|testimonial|evidence/i.test(line) ? "textarea" : /email/i.test(line) ? "email" : /telephone|contact|cell/i.test(line) ? "tel" : /date/i.test(line) ? "date" : "text" };
      current.fields = [...(current.fields ?? []), field];
    } else if (line.length > 25) {
      current.items = [...(current.items ?? []), { id: `response-${++itemNo}`, text: line, responseLabel: "Learner response" }];
    }
  }
  const usable = sections.filter(section => (section.fields?.length ?? 0) + (section.items?.length ?? 0) > 0);
  if (!usable.length) throw new Error("No editable practical-task content could be read from this PDF.");
  return {
    title: lines.find(line => /practical task/i.test(line)) ?? "Practical Task",
    subtitle: unitTitle,
    sourceName: file.name,
    notice: "This form was converted from the uploaded PDF. Review the headings and fields in Manage tabs and structure before publishing it to learners.",
    sections: usable,
  };
}
