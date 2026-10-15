import { practicalTaskFromSource, sourceDocumentText } from "../src/lib/practicalTaskImport";
import { buildUnitContent, mergeUnitContentEnhancement, validateUnitContent } from "../src/lib/unitBuilder";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function testPracticalTaskImport() {
  const longLabel = `Comments ${"a".repeat(70)}`;
  const source = [
    "Learner details", "Name:", "Date:", "Date:", "Signature:", "Signature:",
    `${longLabel} one:`, `${longLabel} two:`,
    "Complete the practical evidence response carefully.",
    "Learner details", "Name:", "Date:",
  ].join("\n");
  const document = practicalTaskFromSource(source, "practical.pdf", "Test unit");
  assert(document.sections.length === 2, "Repeated headings must retain both sections.");
  assert(new Set(document.sections.map(section => section.id)).size === 2, "Section IDs must be unique.");
  for (const section of document.sections) {
    const ids = (section.blocks ?? []).flatMap(block => block.kind === "field" ? [block.field.id] : block.kind === "item" ? [block.item.id] : []);
    assert(ids.every(Boolean), "Every entry must have an ID.");
    assert(new Set(ids).size === ids.length, "Fields and responses must have unique IDs.");
  }
  const labels = document.sections.flatMap(section => (section.blocks ?? []).flatMap(block => block.kind === "field" ? [block.field.label] : []));
  assert(JSON.stringify(labels) === JSON.stringify([
    "Name:", "Date:", "Date:", "Signature:", "Signature:",
    `${longLabel} one:`, `${longLabel} two:`, "Name:", "Date:",
  ]), "Repeated and truncated labels must be preserved in order.");
  assert(sourceDocumentText(document).includes("Complete the practical evidence response carefully."), "Instruction text must be preserved without inventing a response prompt.");
  assert(JSON.stringify(document) === JSON.stringify(practicalTaskFromSource(source, "practical.pdf", "Test unit")), "IDs must be deterministic.");
  const unit = { us: "114074", title: "Test unit", nqf: 5, credits: 5, dates: "", time: "" };
  const content = buildUnitContent(unit, "# Practical learning\n\n" + "Prepare the equipment, follow the instructions and record the evidence from each completed task. ".repeat(5), { minutes: 300 });
  content.practicalTask = document;
  validateUnitContent(content);
  const invalid = structuredClone(content);
  const fields = invalid.practicalTask!.sections[0].blocks!.flatMap(block => block.kind === "field" ? [block.field] : []);
  fields[1].id = fields[0].id;
  let rejected = false;
  try { validateUnitContent(invalid); } catch { rejected = true; }
  assert(rejected, "Validation must still reject duplicate IDs.");
  const workbookSource = [
    "# Learner Workbook", "US 12345", "Name:", "C", "NYS", "1. Read.", "2. Write.",
    "| Task | Marks | Answer |", "| --- | --- | --- |", "| Identify components | 5 | |",
    "\f", "# Sign-off", "Date:", "Assessor signature:", "Total: 10", "Total: 15", "End.",
    '<img src="x" onerror="alert(1)">',
  ].join("\n");
  const workbook = practicalTaskFromSource(workbookSource, "workbook.pdf", "Test unit");
  const reconstructed = sourceDocumentText(workbook);
  for (const text of ["US 12345", "C", "NYS", "1. Read.", "2. Write.", "Date:", "Assessor signature:", "Total: 10", "Total: 15", "End."]) assert(reconstructed.includes(text), `Source text must survive: ${text}`);
  const blocks = workbook.sections.flatMap(section => section.blocks ?? []);
  assert(blocks.filter(block => block.kind === "page").length === 2 && workbook.sourcePageCount === 2, "Every PDF page boundary is retained.");
  const table = blocks.find(block => block.kind === "table");
  assert(table?.kind === "table" && table.rows[0][2] === "", "Tables retain blank answer cells, even beside numeric marks.");
  content.learnerWorkbook = workbook;
  content.workbook = undefined;
  content.editableDocuments = [{ id: "extra", title: "Extra", sourceName: "extra.pdf", document: workbook }];
  const enhanced = mergeUnitContentEnhancement(content, { workbook: buildUnitContent(unit, "# Learning\n\n" + "Follow the source material and complete each required practical step. ".repeat(3), { minutes: 300 }).workbook }, unit);
  assert(enhanced.workbook === undefined, "AI must not generate a replacement for an uploaded workbook.");
  assert(JSON.stringify(enhanced.learnerWorkbook) === JSON.stringify(workbook), "Workbook source must be authoritative through AI merging.");
  assert(JSON.stringify(enhanced.practicalTask) === JSON.stringify(document), "Practical-task source must be authoritative through AI merging.");
  assert(enhanced.editableDocuments?.[0].document.sourceText === workbook.sourceText, "Additional PDF sources must survive AI merging.");
  const missingPage = structuredClone(enhanced);
  missingPage.learnerWorkbook!.sourcePageCount = 3;
  rejected = false;
  try { validateUnitContent(missingPage); } catch { rejected = true; }
  assert(rejected, "Missing source pages must fail validation.");
  return "Passed source conversion: unique IDs, all short labels, repeated headings/totals, numbering, blank table cells, page coverage and authoritative workbook/practical/extra documents through AI merging.";
}
