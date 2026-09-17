import type { UnitContent, UnitStandard } from "../types";
import { plainSlideText } from "./slideRichText";
import { isLessonListLead } from "./lessonSubsections";

export type ExportPage = { title: string; lines: string[] };
function wrap(text: string, width = 86): string[] {
  const lines: string[] = [];
  for (const paragraph of plainSlideText(text).replace(/\*\*/g, "").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (line.length + word.length + 1 > width && line) { lines.push(line); line = ""; }
      line += (line ? " " : "") + word;
    }
    lines.push(line);
  }
  return lines;
}
export function unitExportPages(unit: UnitStandard, content: UnitContent): ExportPage[] {
  const blocks: ExportPage[] = [{ title: `US ${unit.us}`, lines: [unit.title, `NQF ${unit.nqf} | ${unit.credits} credits`] }];
  if(content.saqa) blocks.push({title:"Overview",lines:[content.saqa.notice,...content.saqa.registration.map(r=>`${r.label}: ${r.value}`)]});
  for (const s of content.saqa?.sections ?? []) blocks.push({ title: s.heading, lines: [...(s.paragraphs ?? []), ...(s.bullets ?? [])] });
  for (const s of content.lesson) blocks.push({ title: s.heading, lines: [...s.paragraphs, ...(s.bullets ?? []).map((b,i) => `${i+1}. ${b}`), ...(s.cards ?? []).flatMap(c => [c.title, c.text]), ...(s.table ? [s.table.headers.join(" | "), ...s.table.rows.map(r => r.join(" | "))] : []), ...(s.example ? [s.example.title, ...s.example.lines] : []), ...(s.examples ?? []).flatMap(e => [e.title, ...e.lines])] });
  for (const e of [...content.exercises, ...(content.questionSessions ?? [])]) blocks.push({ title: e.title, lines: [e.task, ...(e.scenario ?? []), ...e.steps.map((s,i) => `${i+1}. ${s}`)] });
  for (const a of content.assignments) blocks.push({ title: a.title, lines: [a.brief, ...a.requirements, `Evidence: ${a.evidence}`] });
  const allQuiz = [...content.quiz,...(content.quizzes??[]).flatMap(q=>q.questions),...content.lesson.flatMap(s=>s.slideQuiz??[])];
  allQuiz.forEach((q,i) => blocks.push({ title: `Quiz question ${i+1}`, lines: [q.q, ...q.options.map((o,j) => `${String.fromCharCode(65+j)}. ${o}`)] }));
  if (content.logbook) {
    const l = content.logbook;
    blocks.push({ title: "Logbook", lines: [l.assignmentTitle, ...l.detailFields.map(f => `${f}: __________________`), l.project.text, ...l.knowledgeQuestions.map(r => `[ ] ${r.text}`), ...l.practicalActivities.map(r => `[ ] ${r.text}`), ...l.workplaceActivities, l.workplaceEvidenceNote, ...l.projectChecklist.map(r => `[ ] ${r.no}. ${r.name}`)] });
  }
  for (const n of content.studyNotes ?? []) blocks.push({ title: `Notes: ${n.title}`, lines: [n.text] });
  if (content.selfAssessment) blocks.push({ title: "Self assessment", lines: [...content.selfAssessment.intro, ...content.selfAssessment.items.map(i => `[ ] ${i}`), ...content.selfAssessment.outro] });
  if (content.evaluation) blocks.push({ title: "Lesson evaluation", lines: [content.evaluation.intro, ...content.evaluation.questions.map(q => `${q}\nResponse: ________________________________`)] });
  if (content.lessonPlan) blocks.push({ title: content.lessonPlan.title, lines: [...content.lessonPlan.prep, ...content.lessonPlan.sections.flatMap(s => [s.heading ?? "", ...s.rows.flatMap(r => [`${r.time ?? ""} ${r.title}`, ...(r.text ?? []), ...(r.bullets ?? [])])])] });
  return blocks.flatMap(block => {
    const grouped: string[][] = [];
    for (let i = 0; i < block.lines.length; i++) {
      const lead = block.lines[i];
      if (isLessonListLead(lead)) {
        const points: string[] = [];
        let j = i + 1;
        while (j < block.lines.length && block.lines[j].trim().length > 0 && block.lines[j].trim().length <= 180 && !/^\d+(?:\.\d+)*[.)]?\s+\S/.test(block.lines[j].trim())) points.push(block.lines[j++]);
        if (points.length) {
          grouped.push([lead, ...points.map((point, index) => `${index + 1}. ${point}`)]);
          i = j - 1;
          continue;
        }
      }
      grouped.push([lead]);
    }
    const pages: ExportPage[] = [];
    let pageLines: string[] = [];
    for (const group of grouped) {
      const lines = group.flatMap(line => wrap(line));
      if (pageLines.length && pageLines.length + lines.length > 16) { pages.push({ title: block.title + (pages.length ? " (continued)" : ""), lines: pageLines }); pageLines = []; }
      pageLines.push(...lines);
    }
    if (pageLines.length || !pages.length) pages.push({ title: block.title + (pages.length ? " (continued)" : ""), lines: pageLines });
    return pages;
  });
}

export async function makeUnitExports(unit: UnitStandard, content: UnitContent): Promise<{ pdf: File; pptx: File; answers: File }> {
  const [{ default: PDFDocument }, { default: PptxGenJS }] = await Promise.all([import("pdfkit/js/pdfkit.standalone.js"), import("pptxgenjs")]);
  const pages = unitExportPages(unit, content);
  const renderPdf = (entries: ExportPage[]): Promise<Blob> => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, size: "A4", layout: "landscape", margin: 40, info: { Title: `US ${unit.us}: ${unit.title}` } });
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(new Uint8Array(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(new Blob(chunks as BlobPart[], { type: "application/pdf" })));
    entries.forEach((page,i) => {
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#202020").text(page.title,40,35,{ width:760, height:60, ellipsis:true });
      doc.font("Helvetica").fontSize(14).fillColor("#303030").text(page.lines.join("\n"),40,105,{ width:760, lineGap:5 });
      doc.fontSize(9).fillColor("#666666").text(`US ${unit.us} | ${i+1} / ${entries.length}`,40,555,{ lineBreak:false });
    });
    doc.end();
  });
  const pptx = new PptxGenJS(); pptx.layout = "LAYOUT_WIDE"; pptx.title = unit.title; pptx.subject = `US ${unit.us}`; pptx.author = "ITSS Learn";
  pages.forEach((page,i) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FAFAFA" };
    slide.addText(page.title, { x:0.55, y:0.3, w:12.2, h:0.7, fontFace:"Arial", fontSize:24, bold:true, color:"202020", breakLine:false, fit:"shrink" });
    slide.addText(page.lines.join("\n"), { x:0.55, y:1.2, w:12.2, h:5.65, fontFace:"Arial", fontSize:17, color:"303030", margin:0, fit:"shrink", valign:"top" });
    slide.addText(`US ${unit.us} | ${i+1} / ${pages.length}`, { x:0.55, y:7.05, w:11, h:0.2, fontSize:9, color:"666666" });
  });
  const answerLines = [...content.quiz, ...(content.quizzes ?? []).flatMap(q => q.questions), ...content.lesson.flatMap(s => s.slideQuiz ?? [])].flatMap((q,i) => [`${i+1}. ${q.q}`, `Correct answer: ${q.options[q.answer]}`, q.explain, ""]);
  for (const e of [...content.exercises,...(content.questionSessions??[])]) answerLines.push(e.title, ...(e.modelAnswer ?? []).flatMap(m => [...(m.paragraphs ?? []), ...(m.bullets ?? [])]));
  const wrappedAnswers = answerLines.flatMap(l => wrap(l));
  const answerPages: ExportPage[] = [];
  for (let i=0;i<wrappedAnswers.length;i+=16) answerPages.push({title:"Facilitator answer guide", lines:wrappedAnswers.slice(i,i+16)});
  const [pdf, ppt, answers] = await Promise.all([renderPdf(pages), pptx.write({ outputType:"blob" }), renderPdf(answerPages)]);
  return { pdf: new File([pdf], `US-${unit.us}-Learner-Pack.pdf`,{type:"application/pdf"}), pptx: new File([ppt as Blob], `US-${unit.us}-Slides.pptx`,{type:"application/vnd.openxmlformats-officedocument.presentationml.presentation"}), answers:new File([answers],`US-${unit.us}-Facilitator-Answers.pdf`,{type:"application/pdf"}) };
}
