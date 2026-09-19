import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent, lessonPlanFromSource } from "../src/lib/unitBuilder";
import { importUnitSource } from "../src/lib/unitSourceImport";
import { rememberUnitPack } from "../src/lib/unitStorage";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 80));
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(button => normalize(button.textContent) === label);
  assert(button, `Missing button: ${label}`);
  button.click();
}
const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const run = (text: string, bold = false) => `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = (text: string, options: { bold?: boolean; bullet?: boolean } = {}) =>
  `<w:p><w:pPr>${options.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr>' : ""}</w:pPr>${run(text, options.bold)}</w:p>`;
const cell = (paragraphs: string, span?: number) => `<w:tc><w:tcPr>${span ? `<w:gridSpan w:val="${span}"/>` : ""}</w:tcPr>${paragraphs || "<w:p/>"}</w:tc>`;
const row = (...cells: string[]) => `<w:tr>${cells.join("")}</w:tr>`;

/** The facilitator's Word schedule: Time | Activity | Resources, with bold titles and bulleted steps. */
function scheduleDocx(): string {
  const activity = (title: string, steps: string[], asBullets = true) => para(title, { bold: true }) + steps.map(step => para(step, { bullet: asBullets })).join("");
  const table = `<w:tbl><w:tblGrid><w:gridCol w:w="1500"/><w:gridCol w:w="6000"/><w:gridCol w:w="1500"/></w:tblGrid>
    ${row(cell(para("Unit Standard 114059", { bold: true }), 3))}
    ${row(cell(para("Time", { bold: true })), cell(para("Activity", { bold: true })), cell(para("Resources", { bold: true })))}
    ${row(cell(para("30 minutes", { bold: true })), cell(activity("Index & Unit Standard Alignment – Facilitator", ["Read through the index with the learners, highlighting the areas that will be covered in this manual. Make reference to the unit Standard alignment Index to outline the specific outcomes that will be covered."], false)), cell(para("LM p2-3", { bold: true })))}
    ${row(cell(para("90 minutes", { bold: true })), cell(activity("Interpret the cost/benefit analysis documentation – Facilitator & Class", ["Read through page 4-6 of the learner manual; discuss the methods used for analyzing and interpreting the cost and benefit documentation and reports."])), cell(para("LM p4-6", { bold: true })))}
    ${row(cell(para("45 minutes", { bold: true })), cell(activity("Questionnaire 1 – Class in pairs", ["Facilitator to read through the questions with the learners ensuring they understand what is expected of them.", "Allow the learners to complete the questions, take feedback from two groups/pairs."])), cell(para("LM p 7", { bold: true })))}
    ${row(cell(para("20 minutes", { bold: true })), cell(activity("Affects of late delivery – Facilitator & Class", ["Read through pages 22-25 and discuss the impact of late deliveries of work on the organisation and the client."])), cell(para("LM p22-25", { bold: true })))}
    ${row(cell(para("10 minutes", { bold: true })), cell(activity("Self-Assessment – Learners Individually", ["Explain to the learners that they have to judge their own knowledge gained in the unit by ticking the blocks they feel competent with", "Allow the learners to tick the blocks and take feedback from each learner.", "Identify those learners who have shortcomings and assist them with fulfilling the requirements."])), cell(para("LM p27", { bold: true })))}
    ${row(cell(para("10 minutes", { bold: true })), cell(activity("Parking Bay – Facilitator", ["Take all the questions from the learners and answer them individually", "Ensure the entire class understands the questions posed by other learners"])), cell(para("White Board", { bold: true })))}
    ${row(cell(para("10 minutes", { bold: true })), cell(activity("Closing – Facilitator", ["Thank the learners for their participation", "Agree with them when the next facilitation session is scheduled for"])), cell(""))}
  </w:tbl>`;
  // A cover-page table without times must not pollute the schedule.
  const cover = `<w:tbl>${row(cell(para("Name", { bold: true })), cell(""))}${row(cell(para("Contact Address", { bold: true })), cell(""))}</w:tbl>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${para("Facilitator Preparation", { bold: true })}${cover}${para("Facilitator Guide – Unit Standard 114059")}${table}<w:sectPr/></w:body></w:document>`;
}

async function makeDocx(): Promise<File> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("word/document.xml", scheduleDocx());
  const blob = await zip.generateAsync({ type: "blob" });
  return new File([blob], "114059 Facilitator Guide.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

async function test() {
  const file = await makeDocx();

  // 1. The importer keeps table structure: one line per row, cell paragraphs separated, bullets marked.
  const text = await importUnitSource(file);
  assert(text.includes("| 30 minutes |"), `Table rows are exported as pipe rows:\n${text.slice(0, 600)}`);
  assert(/Questionnaire 1 . Class in pairs<br>- Facilitator to read/.test(text), `Cell paragraphs stay separate and Word bullets are marked:\n${text.split("\n").find(line => line.includes("Questionnaire 1"))}`);

  // 2. The lesson plan parser turns the imported document into the schedule exactly as written.
  const unit = { us: "114059", title: "Estimating", nqf: 5, credits: 5, dates: "", time: "" };
  const plan = lessonPlanFromSource(unit, text);
  assert(plan, "A lesson plan is produced from the imported Word document");
  assert(plan.title === "Facilitator Preparation", `Document title names the plan (${plan.title})`);
  const sections = plan.sections.filter(section => section.rows.length);
  assert(sections.length === 1, `One schedule section (got ${sections.length}: ${sections.map(s => s.heading).join(", ")})`);
  const [section] = sections;
  assert(section.heading === "Unit Standard 114059", `Spanning row becomes the section heading (${section.heading})`);
  const rows = section.rows;
  assert(rows.length === 7, `All 7 schedule rows survive, nothing from the cover table (got ${rows.length}: ${rows.map(r => r.title).join(" | ")})`);
  assert(rows.map(r => r.time).join(",") === "30 minutes,90 minutes,45 minutes,20 minutes,10 minutes,10 minutes,10 minutes", `Times are read from the Time column (${rows.map(r => r.time).join(",")})`);
  assert(rows[0].title === "Index & Unit Standard Alignment – Facilitator" && rows[0].text?.[0]?.startsWith("Read through the index") && !rows[0].bullets, "Plain cell paragraph becomes activity text");
  assert(rows[2].title === "Questionnaire 1 – Class in pairs" && rows[2].bullets?.length === 2 && rows[2].bullets[1].startsWith("Allow the learners"), "Word bullets become bullet points");
  assert(rows[4].bullets?.length === 3, `Three self-assessment bullets (${rows[4].bullets?.length})`);
  assert(JSON.stringify(rows.map(r => r.resources?.[0] ?? "")) === JSON.stringify(["LM p2-3", "LM p4-6", "LM p 7", "LM p22-25", "LM p27", "White Board", ""]), `Resources column is read (${rows.map(r => r.resources?.join("/") ?? "").join(", ")})`);
  assert(!rows.some(r => /^time$|^activity$|^resources$/i.test(r.title)), "Header row is not an activity");

  // 3. End to end through the Lesson plan builder: import the file, preview the plan.
  const revision = "docx-import-fixture";
  const content = buildUnitContent(unit, "# Estimating work\n\nEstimating starts with understanding the scope and identifying the required deliverables. Break the work into smaller tasks before estimating.", { minutes: 300 });
  const doc = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-09-17" };
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({ revision, source: "x", files: { pdf: doc, pptx: doc, answers: doc }, content }));
  createRoot(document.getElementById("fixture")!).render(<UnitPage unitId="114059" profile={{ id: "docx-import-test", name: "Test", role: "Super User" } as any} progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}} saveExerciseResult={() => {}} navigate={() => {}} />);
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Lesson plan");
  await tick();
  click("Build lesson plan from notes");
  await tick();
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Import lesson plan"]');
  assert(input, "Import lesson plan file input exists");
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const textarea = document.querySelector<HTMLTextAreaElement>(".unit-source-field textarea");
  assert(textarea, "Lesson plan textarea exists");
  for (let i = 0; i < 100 && !textarea.value; i++) await tick();
  assert(textarea.value.includes("| 30 minutes |"), "Imported Word content fills the lesson plan box");
  assert(!document.querySelector('[role="alert"]'), `No import error: ${document.querySelector('[role="alert"]')?.textContent}`);
  click("Preview plan");
  await tick();
  const preview = document.querySelector<HTMLElement>(".unit-confirm");
  assert(preview, `Preview appears without error: ${document.querySelector('[role="alert"]')?.textContent}`);
  const previewText = normalize(preview.textContent);
  assert(previewText.includes("7 activities"), `Preview counts the 7 imported activities: ${previewText}`);
  assert(previewText.includes("30 minutes · Index & Unit Standard Alignment – Facilitator"), `Preview lists the first Word row: ${previewText}`);
  assert(previewText.includes("Unit Standard 114059:"), "Preview shows the section heading from the Word table");

  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: a Word (.docx) facilitator schedule imports into the lesson plan builder — table rows become timed activities with bullets and resources, the spanning row is the section heading, header/cover tables are ignored, and the preview succeeds";
}

test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = `FAIL: ${error instanceof Error ? error.stack ?? error.message : String(error)}`;
});
