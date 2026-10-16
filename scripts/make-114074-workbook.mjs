import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";

// Input is the complete extractFormDocument(..., { preservePdf: true, digitalPdf: true }) result.
const input = process.argv[2];
if (!input) throw new Error("Provide the existing PDF HTML import JSON as the first argument.");
const imported = JSON.parse(readFileSync(input, "utf8"));
if (imported.pages.length !== 18 || imported.pages.some(page => !page.layer?.text.length)) {
  throw new Error("The 114074 workbook must contain all 18 extractable source pages.");
}
const fields = [];
const box = (x, y, w, h) => ({ x: x / 1279, y: y / 1654, w: w / 1279, h: h / 1654 });
function field(page, id, label, x, y, w, h, type = "text") {
  fields.push({ id, label, type, required: false, helpText: label, options: [], placement: { page, box: box(x, y, w, h), options: [] } });
}
function choice(page, id, label, options, boxes) {
  fields.push({ id, label, type: "radio", required: false, helpText: label, options, placement: { page, box: null, options: boxes.map(coords => box(...coords)) } });
}

for (const [index, label] of ["Name", "Surname", "ID Number", "Contact"].entries()) {
  field(1, `cover-${index + 1}`, label, 282, [1206,1299,1391,1487][index], 613, [86,85,88,85][index]);
}
field(3, "overview-us-no", "Overview US No", 108, 668, 193, 171);
field(3, "overview-level", "Overview Level", 893, 668, 82, 171);
field(3, "overview-credits", "Overview Credits", 985, 668, 166, 171);
field(4, "assessment-hours", "Allocated assessment hours", 605, 400, 32, 35);
field(4, "assessment-points", "Total assessment points", 905, 448, 25, 35);
for (const [index, label] of ["Learner Full Names", "Learner ID No.", "Organisation", "Unit/Dept"].entries()) {
  field(5, `learner-${index + 1}`, label, 388, 279 + index * 47, 774, 38);
}
field(5, "telephone", "Telephone / Cell Numbers", 388, 560, 313, 39, "tel");
field(5, "email", "Email Address", 711, 560, 451, 39, "email");
for (const [index, label] of ["Workshop Venue", "Facilitator Name", "Date Started", "Date Completed"].entries()) {
  field(5, `workshop-${index + 1}`, label, 388, 654 + index * 47, 774, 38, index > 1 ? "date" : "text");
}
const checklistRows = [
  [5, 977, 1051], [5, 1053, 1203], [5, 1205, 1354], [5, 1356, 1467],
  [6, 152, 188], [6, 191, 302], [6, 305, 453], [6, 456, 567],
  [6, 570, 719], [6, 722, 832], [6, 836, 946], [6, 950, 1060],
];
for (const [index, [page, top, bottom]] of checklistRows.entries()) {
  choice(page, `preparation-${index + 1}`, `Assessment preparation row ${index + 1}`, ["Yes", "No"], [[696,top+5,54,Math.min(30,bottom-top-8)], [760,top+5,52,Math.min(30,bottom-top-8)]]);
  field(page, `preparation-comments-${index + 1}`, `Assessment preparation row ${index + 1} comments / contingency`, 822, top+3, 337, bottom-top-6, "textarea");
}
field(5, "submission-day", "Evidence submission day", 404, 1092, 49, 35);
field(5, "submission-month", "Evidence submission month", 127, 1132, 94, 35);
field(5, "submission-year", "Evidence submission year", 313, 1132, 71, 35);
field(5, "submission-place", "Evidence submission address / place", 270, 1171, 402, 31);
field(5, "assessment-method-1", "Assessment method 1", 180, 1431, 434, 35);
field(6, "assessment-method-2", "Assessment method 2", 180, 153, 434, 34);
field(6, "preparation-learner-name", "Learner declaration name", 122, 1177, 790, 35);
for (const [index, label] of ["Learner Signature", "Learner preparation date", "Facilitator Signature", "Facilitator preparation date"].entries()) {
  field(6, `preparation-signoff-${index + 1}`, label, [99,366,623,891][index], 1372, [256,246,257,267][index], 64, index % 2 ? "date" : "signature");
}

const responses = [
  [8,1,660,1450], [9,1,150,1492], [10,1,150,1365],
  [11,2,697,1490], [12,2,150,1492], [13,2,150,1407],
  [14,3,618,1494], [15,3,150,1154],
];
for (const [page, activity, top, bottom] of responses) {
  field(page, `activity-${activity}-page-${page}`, `Activity ${activity} answer - page ${page}`, 103, top, 1045, bottom-top, "textarea");
}
for (let index = 0; index < 7; index++) {
  field(16, `self-outcome-${index + 1}`, `Self-assessment learning outcome ${index + 1}`, 164, 241+index*43.2, 667, 34, "textarea");
  choice(16, `self-rating-${index + 1}`, `Self-assessment rating ${index + 1}`, ["1", "2", "3"], [[842,242+index*43.2,101,30], [955,242+index*43.2,82,30], [1049,242+index*43.2,101,30]]);
}
field(16, "self-learner-signature", "Learner self-assessment Signature", 104, 606, 400, 42, "signature");
field(16, "self-learner-date", "Learner self-assessment date", 645, 606, 363, 42, "date");
field(16, "self-facilitator-signature", "Facilitator self-assessment Signature", 104, 732, 422, 42, "signature");
field(16, "self-facilitator-date", "Facilitator self-assessment date", 634, 732, 362, 42, "date");
field(17, "facilitator-feedback", "Facilitator feedback and remarks", 99, 284, 1052, 201, "textarea");
field(17, "learner-total-mark", "Learner total mark", 104, 581, 360, 41);
choice(17, "assessment-judgement", "Assessment judgement", ["Requirements met", "Requirements not met"], [[699,625,20,20],[109,667,20,20]]);
field(17, "actions-required", "Actions required", 311, 751, 839, 72, "textarea");
field(17, "actions-due", "Actions required by when", 241, 827, 910, 40, "date");
field(17, "learner-feedback", "Learner feedback and comments", 99, 967, 1052, 159, "textarea");
field(17, "facilitator-declaration-name", "Facilitator declaration name", 121, 1257, 471, 37);
field(18, "learner-declaration-name", "Learner final declaration name", 128, 232, 596, 37);
field(18, "assessor-declaration-name", "Assessor declaration name", 121, 701, 471, 37);
for (const [top, prefix, roles] of [[410,"final",["Learner","Facilitator"]],[796,"assessment",["Assessor","Moderator"]]]) {
  for (const [index, role] of roles.entries()) {
    field(18, `${prefix}-${role.toLowerCase()}-signature`, `${role} final Signature`, 100+index*519, top, 283, 54, "signature");
    field(18, `${prefix}-${role.toLowerCase()}-date`, `${role} final date`, 388+index*519, top, 242, 54, "date");
  }
}

const logo = await sharp(Buffer.from(imported.pages[0].src.split(",")[1], "base64")).extract({left:210,top:45,width:605,height:220}).png().toBuffer();
const pages = await Promise.all(imported.pages.map(async page => {
  const image = await sharp(Buffer.from(page.src.split(",")[1], "base64")).webp({ lossless: true }).toBuffer();
  return { src: `data:image/webp;base64,${image.toString("base64")}`, width: page.width, height: page.height, path: "", layer: page.layer };
}));
const cover = pages[0].layer;
cover.fills = [
  { ...box(10,322,931,1332), c:"#e9ceaa" },
  { ...box(955,0,324,1654), c:"#ee7a1b" },
  ...[1204,1296,1388,1484].map((top,index) => ({ ...box(278,top,620,[92,92,96,92][index]), c:"#ffffff" })),
];
cover.pictures = [{ ...box(210,45,605,220), src:`data:image/png;base64,${logo.toString("base64")}`, path:"" }];
cover.rules = cover.rules.filter(rule => !(rule.x >= 210/1279 && rule.y >= 45/1654 && rule.x + rule.w <= 815/1279 && rule.y + rule.h <= 265/1654));
const definition = {
  title:"114074 Learner Workbook", description:"All 18 source pages converted to HTML. Responses save to the current learner profile.",
  titleColor:"", accentColor:"", masthead:"", display:"digital", pages,
  sections:pages.map((_,index) => ({ id:`page-${index+1}`,title:`Page ${index+1}`,description:"",fields:fields.filter(field => field.placement.page === index+1),columns:4,widths:[],rows:[],banner:"",pageBreak:false })),
};
const sourceHash = createHash("sha256").update(readFileSync("SAQA-114074 -   Learner Workbook.pdf")).digest("hex");
const document = {
  title:definition.title, sourceName:imported.name, sourcePageCount:18, sourceText:imported.text,
  notice:"Original wording and all 18 pages are preserved. Source review: the total-mark and assessment-time blanks remain blank; activity 3 says LAN while its outcomes refer to WAN; seven self-assessment outcome descriptions are blank in the PDF. Complete or review these with the facilitator.",
  sections:[], replica:definition,
};
const output = `import type { PracticalTaskDocument } from "../types";\n\n// Generated by scripts/make-114074-workbook.mjs from the existing PDF HTML importer.\n// Source SHA-256: ${sourceHash}\nexport const LEARNER_WORKBOOK_114074: PracticalTaskDocument = ${JSON.stringify(document, null, 2)};\n`;
writeFileSync("src/data/learnerWorkbook114074.ts", output);
console.log(`Generated ${pages.length} HTML pages, ${pages.reduce((sum,page)=>sum+page.layer.text.length,0)} source text runs and ${fields.length} editable fields.`);
