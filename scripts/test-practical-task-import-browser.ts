import { practicalTaskFromSource } from "../src/lib/practicalTaskImport";
import { buildUnitContent, validateUnitContent } from "../src/lib/unitBuilder";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function testPracticalTaskImport() {
  const longLabel = `Comments ${"a".repeat(70)}`;
  const source = [
    "Learner details", "Name:", "Date:", "Date:", "Signature:", "Signature:",
    `${longLabel} one`, `${longLabel} two`,
    "Complete the practical evidence response carefully.",
    "Learner details", "Name:", "Date:",
  ].join("\n");
  const document = practicalTaskFromSource(source, "practical.pdf", "Test unit");
  assert(document.sections.length === 2, "Repeated headings must retain both sections.");
  assert(new Set(document.sections.map(section => section.id)).size === 2, "Section IDs must be unique.");
  for (const section of document.sections) {
    const entries = [...(section.fields ?? []), ...(section.items ?? [])];
    assert(entries.every(entry => entry.id), "Every entry must have an ID.");
    assert(new Set(entries.map(entry => entry.id)).size === entries.length, "Fields and responses must have unique IDs.");
  }
  const labels = document.sections.flatMap(section => (section.fields ?? []).map(field => field.label));
  assert(JSON.stringify(labels) === JSON.stringify([
    "Name", "Date", "Date", "Signature", "Signature",
    `${longLabel} one`, `${longLabel} two`, "Name", "Date",
  ]), "Repeated and truncated labels must be preserved in order.");
  assert(document.sections[0].items?.[0].text === "Complete the practical evidence response carefully.", "Response text must be preserved.");
  assert(JSON.stringify(document) === JSON.stringify(practicalTaskFromSource(source, "practical.pdf", "Test unit")), "IDs must be deterministic.");
  const unit = { us: "114074", title: "Test unit", nqf: 5, credits: 5, dates: "", time: "" };
  const content = buildUnitContent(unit, "# Practical learning\n\n" + "Prepare the equipment, follow the instructions and record the evidence from each completed task. ".repeat(5), { minutes: 300 });
  content.practicalTask = document;
  validateUnitContent(content);
  const invalid = structuredClone(content);
  invalid.practicalTask!.sections[0].fields![1].id = invalid.practicalTask!.sections[0].fields![0].id;
  let rejected = false;
  try { validateUnitContent(invalid); } catch { rejected = true; }
  assert(rejected, "Validation must still reject duplicate IDs.");
  return "Passed practical-task import: repeated labels/headings, truncated slugs, preserved content, deterministic IDs and build validation.";
}
