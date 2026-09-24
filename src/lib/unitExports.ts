import type { UnitContent, UnitStandard } from "../types";
import { COURSE_META, findUnit } from "../data/course";
import { plainSlideText } from "./slideRichText";
import { isLessonBulletListLead, isLessonListLead } from "./lessonSubsections";

export type ExportPage = { title: string; lines: string[] };
export const PPT_MIN_FONT_SIZE = 18;
const PPT_BODY_WIDTH = 11.55;
const PPT_BODY_HEIGHT = 4.72;

export type PresentationPage = {
  kind: "overview" | "divider" | "content" | "cards";
  eyebrow: string;
  title: string;
  items?: string[];
  cards?: { title: string; text: string }[];
};

const cleanPresentationText = (text: string) => plainSlideText(text)
  .replace(/\*\*/g, "")
  .replace(/\s+/g, " ")
  .trim();

/** Presentation slides are prompts and explanations, not a duplicate learner manual. */
function presentationSummary(text: string, limit = 240): string {
  const clean = cleanPresentationText(text);
  if (clean.length <= limit) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [];
  let summary = "";
  for (const sentence of sentences) {
    if ((summary + " " + sentence).trim().length > limit) break;
    summary = (summary + " " + sentence).trim();
    if (summary.length >= limit * 0.55) break;
  }
  if (summary) return summary;
  const clipped = clean.slice(0, limit + 1);
  const wordEnd = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, Math.max(1, wordEnd)).trim()}…`;
}

function estimatedTextHeight(text: string, fontSize: number, width: number, lineMultiple = 1.2): number {
  const charsPerLine = Math.max(8, Math.floor((width * 72) / (fontSize * 0.58)));
  let lines = 1;
  let used = 0;
  for (const word of cleanPresentationText(text).split(/\s+/)) {
    if (used && used + word.length + 1 > charsPerLine) { lines += 1; used = word.length; }
    else used += word.length + (used ? 1 : 0);
  }
  return (lines * fontSize * lineMultiple) / 72;
}

function paginatePresentationItems(title: string, eyebrow: string, items: string[]): PresentationPage[] {
  const pages: PresentationPage[] = [];
  let current: string[] = [];
  let used = 0;
  for (const raw of items.map(item => presentationSummary(item)).filter(Boolean)) {
    const height = Math.max(0.38, estimatedTextHeight(raw, PPT_MIN_FONT_SIZE, PPT_BODY_WIDTH - 0.5)) + 0.14;
    if (current.length && used + height > PPT_BODY_HEIGHT) {
      pages.push({ kind: "content", eyebrow, title: presentationSummary(pages.length ? `${title} (continued)` : title, 100), items: current });
      current = [];
      used = 0;
    }
    current.push(raw);
    used += height;
  }
  if (current.length || !pages.length) pages.push({ kind: "content", eyebrow, title: presentationSummary(pages.length ? `${title} (continued)` : title, 100), items: current });
  return pages;
}

/** Builds the concise, layout-aware slide plan used by the editable PPT export. */
export function unitPresentationPages(unit: UnitStandard, content: UnitContent): PresentationPage[] {
  const pages: PresentationPage[] = [];
  const lessonStarts = content.lesson.filter(section => section.lessonStart).map(section => section.lessonStart!);
  if (lessonStarts.length) {
    for (let i = 0; i < lessonStarts.length; i += 4) {
      pages.push({ kind: "overview", eyebrow: `US ${unit.us}`, title: i ? "What you will learn (continued)" : "What you will learn", cards: lessonStarts.slice(i, i + 4).map(lesson => ({ title: `Lesson ${lesson.n}`, text: presentationSummary(lesson.title, 100) })) });
    }
  }
  const lessonGroups: { n: number; title: string; sections: typeof content.lesson }[] = [];
  for (const section of content.lesson) {
    if (section.lessonStart || !lessonGroups.length) lessonGroups.push({ n: section.lessonStart?.n ?? lessonGroups.length + 1, title: section.lessonStart?.title ?? unit.title, sections: [] });
    lessonGroups.at(-1)!.sections.push(section);
  }
  for (const lesson of lessonGroups) {
    const eyebrow = `Lesson ${lesson.n}`;
    pages.push({ kind: "divider", eyebrow, title: presentationSummary(lesson.title, 150) });
    const sectionSummaries = lesson.sections.map(section => {
      const detail = section.paragraphs?.[0] ?? section.bullets?.[0] ?? section.cards?.[0]?.text ?? "";
      return detail ? `${section.heading} — ${presentationSummary(detail, 155)}` : section.heading;
    });
    pages.push(...paginatePresentationItems(lesson.title, eyebrow, sectionSummaries));

    const lessonCards = lesson.sections.flatMap(section => (section.cards ?? []).map(card => ({
      title: presentationSummary(card.title, 50),
      text: presentationSummary(card.text, 100),
    })));
    for (let i = 0; i < lessonCards.length; i += 4) {
      pages.push({ kind: "cards", eyebrow, title: "Key concepts", cards: lessonCards.slice(i, i + 4) });
    }

  }
  return pages;
}
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
  const presentationPages = unitPresentationPages(unit, content);
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
    slide.addText(`US ${unit.us} · ITSS Learn`, { x: 0.55, y: 7.02, w: 5.5, h: 0.28, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: GREY, margin: 0, fit: "none" });
    if (i !== undefined) slide.addText(`${i + 1} / ${presentationPages.length + 1}`, { x: 11.75, y: 7.02, w: 1.0, h: 0.28, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: GREY, align: "right", margin: 0, fit: "none" });
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
  const addContentChrome = (slide: any, page: PresentationPage, i: number) => {
    slide.background = { color: "FFFFFF" };
    slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.09, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
    slide.addText(page.eyebrow.toUpperCase(), { x: 0.55, y: 0.28, w: 9.8, h: 0.3, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, bold: true, color: BLUE, charSpacing: 1.4, margin: 0, fit: "none" });
    slide.addText(page.title, { x: 0.55, y: 0.72, w: 10.9, h: 0.76, fontFace: "Aptos Display", fontSize: 28, bold: true, color: NAVY, margin: 0, fit: "none", valign: "top" });
    slide.addShape("line", { x: 0.55, y: 1.58, w: 12.15, h: 0, line: { color: LINE, width: 1 } });
    addPeopleGraphic(slide, 11.62, 0.34);
    addFooter(slide, i);
  };
  const addCard = (slide: any, card: { title: string; text: string }, x: number, y: number, w: number, h: number) => {
    slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, line: { color: LINE, width: 1 }, fill: { color: "F7FAFD" } });
    slide.addText(card.title, { x: x + 0.22, y: y + 0.18, w: w - 0.44, h: 0.42, fontFace: "Aptos Display", fontSize: PPT_MIN_FONT_SIZE, bold: true, color: BLUE, margin: 0, fit: "none" });
    slide.addText(card.text, { x: x + 0.22, y: y + 0.72, w: w - 0.44, h: h - 0.9, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: NAVY, margin: 0, fit: "none", valign: "top", lineSpacingMultiple: 1.05 });
  };
  const slideEntries: (PresentationPage | { kind: "cover" })[] = [{ kind: "cover" }, ...presentationPages];
  slideEntries.forEach((entry, i) => {
    const slide = pptx.addSlide();
    if (entry.kind === "cover") {
      slide.background = { color: "FFFFFF" };
      slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.12, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
      slide.addShape("roundRect", { x: 0.55, y: 0.92, w: 7.9, h: 0.58, rectRadius: 0.15, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
      slide.addText(`US ${unit.us} · NQF LEVEL ${unit.nqf} · ${unit.credits} CREDITS`, { x: 0.78, y: 1.02, w: 7.42, h: 0.34, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, bold: true, color: "FFFFFF", margin: 0, fit: "none", align: "center" });
      slide.addText(unit.title, { x: 0.55, y: 1.76, w: 10.35, h: 1.22, fontFace: "Aptos Display", fontSize: 32, bold: true, color: NAVY, margin: 0, fit: "none", valign: "top" });
      if (coverSubtitle) slide.addText(presentationSummary(coverSubtitle, 175), { x: 0.55, y: 3.18, w: 10.2, h: 0.66, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: GREY, margin: 0, fit: "none", valign: "top" });
      slide.addShape("line", { x: 0.55, y: 4.02, w: 12.15, h: 0, line: { color: LINE, width: 1 } });
      const meta = [
        ["TIME", `${unitDates ? "90-minute lessons · " : ""}Self & Group`],
        ["SESSION", `${unitDates}${unitTime ? ` · ${unitTime.replace(/\s*-\s*/g, "–")}` : ""}`],
        ["MODULE", moduleName],
        ["QUALITY ASSURANCE", quality],
      ];
      meta.forEach(([label, value], n) => {
        const x = 0.55 + n * 3.06;
        slide.addText(label, { x, y: 4.22, w: 2.82, h: 0.3, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, bold: true, color: BLUE, margin: 0, fit: "none" });
        slide.addText(value, { x, y: 4.72, w: 2.82, h: 1.05, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: NAVY, margin: 0, fit: "none", valign: "top" });
      });
      addPeopleGraphic(slide);
      addFooter(slide);
      return;
    }
    const page = entry as PresentationPage;
    if (page.kind === "divider") {
      slide.background = { color: NAVY };
      slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.12, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
      slide.addText(page.eyebrow.toUpperCase(), { x: 0.7, y: 2.05, w: 11.8, h: 0.38, fontFace: "Aptos", fontSize: 20, bold: true, color: "8CC2F0", charSpacing: 2.5, margin: 0, fit: "none" });
      slide.addText(page.title, { x: 0.7, y: 2.68, w: 11.4, h: 1.65, fontFace: "Aptos Display", fontSize: 38, bold: true, color: "FFFFFF", margin: 0, fit: "none", valign: "top" });
      slide.addText(`US ${unit.us} · ITSS Learn`, { x: 0.7, y: 6.94, w: 5.5, h: 0.3, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: "8CC2F0", margin: 0, fit: "none" });
      return;
    }
    addContentChrome(slide, page, i - 1);
    if (page.kind === "cards" || page.kind === "overview") {
      const cards = page.cards ?? [];
      cards.forEach((card, cardIndex) => addCard(slide, card, 0.65 + (cardIndex % 2) * 6.05, 1.84 + Math.floor(cardIndex / 2) * 2.25, 5.82, 2.02));
      return;
    }
    let y = 1.86;
    for (const item of page.items ?? []) {
      const h = Math.max(0.38, estimatedTextHeight(item, PPT_MIN_FONT_SIZE, PPT_BODY_WIDTH - 0.5)) + 0.06;
      slide.addShape("ellipse", { x: 0.72, y: y + 0.12, w: 0.1, h: 0.1, line: { color: BLUE, transparency: 100 }, fill: { color: BLUE } });
      slide.addText(item, { x: 1.0, y, w: PPT_BODY_WIDTH - 0.4, h, fontFace: "Aptos", fontSize: PPT_MIN_FONT_SIZE, color: NAVY, margin: 0, fit: "none", valign: "top", lineSpacingMultiple: 1.08 });
      y += h + 0.12;
    }
  });
  const answerLines = [...content.quiz, ...(content.quizzes ?? []).flatMap(q => q.questions), ...content.lesson.flatMap(s => s.slideQuiz ?? [])].flatMap((q,i) => [`${i+1}. ${q.q}`, `Correct answer: ${q.options[q.answer]}`, q.explain, ""]);
  for (const e of [...content.exercises,...(content.questionSessions??[])]) answerLines.push(e.title, ...(e.modelAnswer ?? []).flatMap(m => [...(m.paragraphs ?? []), ...(m.bullets ?? [])]));
  const wrappedAnswers = answerLines.flatMap(l => wrap(l));
  const answerPages: ExportPage[] = [];
  for (let i=0;i<wrappedAnswers.length;i+=16) answerPages.push({title:"Facilitator answer guide", lines:wrappedAnswers.slice(i,i+16)});
  const [pdf, ppt, answers] = await Promise.all([renderPdf(pages), pptx.write({ outputType:"blob" }), renderPdf(answerPages)]);
  return { pdf: new File([pdf], `US-${unit.us}-Learner-Pack.pdf`,{type:"application/pdf"}), pptx: new File([ppt as Blob], `US-${unit.us}-Slides.pptx`,{type:"application/vnd.openxmlformats-officedocument.presentationml.presentation"}), answers:new File([answers],`US-${unit.us}-Facilitator-Answers.pdf`,{type:"application/pdf"}) };
}
