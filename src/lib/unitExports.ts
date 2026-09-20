import type { UnitContent, UnitStandard } from "../types";
import { COURSE_META, findUnit } from "../data/course";
import { plainSlideText } from "./slideRichText";
import { isLessonBulletListLead, isLessonListLead } from "./lessonSubsections";

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
  for (const tab of content.customTabs ?? []) blocks.push({ title: tab.title, lines: [tab.text] });
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
          grouped.push([lead, ...points.map((point, index) => isLessonBulletListLead(lead) ? `• ${point}` : `${index + 1}. ${point}`)]);
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
  const NAVY = "00285A";
  const BLUE = "1477C9";
  const LIGHT_BLUE = "D6E6F7";
  const GREY = "637083";
  const LINE = "D5DCE6";
  const moduleInfo = findUnit(unit.us);
  const moduleName = moduleInfo?.module.name ?? "Unit Standard";
  const unitDates = moduleInfo?.unit.dates ?? unit.dates;
  const unitTime = moduleInfo?.unit.time ?? unit.time;
  const quality = COURSE_META.qualityAssurance ?? "QCTO / MICT SETA";
  const coverSubtitle = plainSlideText(content.lesson[0]?.paragraphs[0] ?? content.saqa?.notice ?? "")
    .replace(/\s+/g, " ")
    .slice(0, 180);
  const addPeopleGraphic = (slide: any, x = 11.0, y = 1.25) => {
    const line = { color: LIGHT_BLUE, width: 4, transparency: 8 };
    slide.addShape("ellipse", { x, y, w: 0.5, h: 0.5, line, fill: { color: "FFFFFF", transparency: 100 } });
    slide.addShape("ellipse", { x: x + 0.58, y: y + 0.1, w: 0.38, h: 0.38, line, fill: { color: "FFFFFF", transparency: 100 } });
    slide.addShape("arc", { x: x - 0.14, y: y + 0.72, w: 1.0, h: 0.8, line, adjustPoint: 0.4, angleRange: [200, 340] });
    slide.addShape("arc", { x: x + 0.48, y: y + 0.73, w: 0.8, h: 0.7, line, adjustPoint: 0.4, angleRange: [200, 340] });
  };
  const addFooter = (slide: any, i?: number) => {
    slide.addText("ITSS Learn · Investec · Corporate Banking Technology", { x: 0.48, y: 6.92, w: 6.5, h: 0.25, fontFace: "Arial", fontSize: 11, color: GREY, margin: 0 });
    if (i !== undefined) slide.addText(`${i + 1} / ${pages.length}`, { x: 11.9, y: 6.92, w: 0.9, h: 0.2, fontFace: "Arial", fontSize: 9, color: GREY, align: "right", margin: 0 });
  };
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
    slide.background = { color: "FFFFFF" };
    if (i === 0) {
      slide.addShape("roundRect", { x: 0.48, y: 0.7, w: 6.8, h: 0.55, rectRadius: 0.15, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
      slide.addText(`US ${unit.us} · SO 1 · NQF LEVEL ${unit.nqf} · ${unit.credits} CREDITS`, { x: 0.85, y: 0.83, w: 5.95, h: 0.18, fontFace: "Arial", fontSize: 11, bold: true, color: "FFFFFF", margin: 0, fit: "shrink" });
      slide.addText(unit.title, { x: 0.48, y: 1.48, w: 9.6, h: 1.05, fontFace: "Arial", fontSize: 25, bold: true, color: NAVY, margin: 0, breakLine: false, fit: "shrink" });
      if (coverSubtitle) slide.addText(coverSubtitle, { x: 0.48, y: 3.1, w: 9.5, h: 0.55, fontFace: "Arial", fontSize: 13.5, color: GREY, margin: 0, fit: "shrink" });
      slide.addShape("line", { x: 0.48, y: 3.88, w: 12.2, h: 0, line: { color: LINE, width: 1 } });
      const meta = [
        ["TIME", `${unitDates ? "90-minute lessons · " : ""}Self & Group`],
        ["SESSION", `${unitDates}${unitTime ? ` · ${unitTime.replace(/\s*-\s*/g, "–")}` : ""}`],
        ["MODULE", moduleName],
        ["QUALITY ASSURANCE", quality],
      ];
      meta.forEach(([label, value], n) => {
        const x = 0.48 + n * 3.1;
        slide.addText(label, { x, y: 4.08, w: 2.75, h: 0.24, fontFace: "Arial", fontSize: 11, bold: true, color: BLUE, margin: 0 });
        slide.addText(value, { x, y: 4.42, w: 2.75, h: 0.58, fontFace: "Arial", fontSize: 12, color: NAVY, margin: 0, fit: "shrink", breakLine: false });
      });
      addPeopleGraphic(slide);
      addFooter(slide);
      return;
    }
    slide.addShape("roundRect", { x: 0.55, y: 0.42, w: 2.35, h: 0.34, rectRadius: 0.12, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
    slide.addText(`US ${unit.us}`, { x: 0.8, y: 0.51, w: 1.75, h: 0.12, fontFace: "Arial", fontSize: 8.5, bold: true, color: "FFFFFF", margin: 0 });
    slide.addText(page.title, { x:0.55, y:0.98, w:10.3, h:0.68, fontFace:"Arial", fontSize:24, bold:true, color:NAVY, breakLine:false, fit:"shrink", margin:0 });
    slide.addShape("line", { x: 0.55, y: 1.78, w: 11.9, h: 0, line: { color: LINE, width: 1 } });
    addPeopleGraphic(slide, 11.05, 0.58);
    const body = page.lines.join("\n");
    slide.addText(body, { x:0.72, y:2.15, w:11.5, h:4.35, fontFace:"Arial", fontSize:18, color:NAVY, margin:0, fit:"shrink", valign:"top", breakLine:false, paraSpaceAfter: 9 });
    addFooter(slide, i);
  });
  const answerLines = [...content.quiz, ...(content.quizzes ?? []).flatMap(q => q.questions), ...content.lesson.flatMap(s => s.slideQuiz ?? [])].flatMap((q,i) => [`${i+1}. ${q.q}`, `Correct answer: ${q.options[q.answer]}`, q.explain, ""]);
  for (const e of [...content.exercises,...(content.questionSessions??[])]) answerLines.push(e.title, ...(e.modelAnswer ?? []).flatMap(m => [...(m.paragraphs ?? []), ...(m.bullets ?? [])]));
  const wrappedAnswers = answerLines.flatMap(l => wrap(l));
  const answerPages: ExportPage[] = [];
  for (let i=0;i<wrappedAnswers.length;i+=16) answerPages.push({title:"Facilitator answer guide", lines:wrappedAnswers.slice(i,i+16)});
  const [pdf, ppt, answers] = await Promise.all([renderPdf(pages), pptx.write({ outputType:"blob" }), renderPdf(answerPages)]);
  return { pdf: new File([pdf], `US-${unit.us}-Learner-Pack.pdf`,{type:"application/pdf"}), pptx: new File([ppt as Blob], `US-${unit.us}-Slides.pptx`,{type:"application/vnd.openxmlformats-officedocument.presentationml.presentation"}), answers:new File([answers],`US-${unit.us}-Facilitator-Answers.pdf`,{type:"application/pdf"}) };
}
