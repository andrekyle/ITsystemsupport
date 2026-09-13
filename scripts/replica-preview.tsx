import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/styles.css";
import "../src/components/form-builder.css";
import { PaperForm } from "../src/components/PaperForm";
import { parseFormDefinition, validateFormAnswers, type FormAnswers, type FormPage, type FormFieldType, type LayerShape, type LayerText } from "../src/lib/formSchema";

const pageWidth = 1000;
const pageHeight = 400;
const fixtureFields = [
  { id: "street", label: "Street address", type: "textarea" as FormFieldType, page: 1, x: 0.1, y: 0.2, w: 0.72, h: 0.075, count: 24 },
  { id: "suburb", label: "Suburb", type: "text" as FormFieldType, page: 1, x: 0.1, y: 0.45, w: 0.72, h: 0.075, count: 24 },
  { id: "telephone", label: "Telephone", type: "tel" as FormFieldType, page: 1, x: 0.1, y: 0.7, w: 0.36, h: 0.075, count: 12 },
  { id: "initials", label: "Initials", type: "text" as FormFieldType, page: 2, x: 0.1, y: 0.2, w: 0.09, h: 0.075, count: 3 },
  { id: "surname", label: "Surname", type: "text" as FormFieldType, page: 2, x: 0.3, y: 0.2, w: 0.6, h: 0.075, count: 20 },
  { id: "email", label: "Email", type: "email" as FormFieldType, page: 2, x: 0.1, y: 0.45, w: 0.72, h: 0.075, count: 24 },
  { id: "officer_signature", label: "Signature", type: "signature" as FormFieldType, page: 3, x: 0.06, y: 0.15, w: 0.75, h: 0.12, count: 0 },
  { id: "signed_place", label: "Place", type: "text" as FormFieldType, page: 3, x: 0.20, y: 0.21, w: 0.56, h: 0.045, count: 0 },
  { id: "signed_year", label: "Year", type: "text" as FormFieldType, page: 3, x: 0.30, y: 0.40, w: 0.16, h: 0.08, count: 0 },
  { id: "signed_month", label: "Month", type: "text" as FormFieldType, page: 3, x: 0.46, y: 0.40, w: 0.08, h: 0.08, count: 0 },
  { id: "signed_day", label: "Day", type: "text" as FormFieldType, page: 3, x: 0.54, y: 0.40, w: 0.08, h: 0.08, count: 0 },
  { id: "review_date", label: "Review date", type: "date" as FormFieldType, page: 3, x: 0.20, y: 0.70, w: 0.26, h: 0.055, count: 0 },
];

function makeDeclarationPage(): FormPage {
  const caption = (t: string, x: number, y: number, w: number): LayerText => ({ t, x, y, w, h: 0.04, s: 0.018, f: "arial", b: false, i: false, c: "#000000" });
  const century = new URLSearchParams(location.search).get("century") ?? "20";
  const text = [
    caption("Signature", 0.06, 0.10, 0.12), caption("Handtekening", 0.80, 0.10, 0.15),
    caption("Place", 0.06, 0.22, 0.10), caption("Plek", 0.89, 0.22, 0.05),
    caption("Date", 0.06, 0.42, 0.08), caption("Datum", 0.86, 0.42, 0.08),
    caption("Y/J", 0.36, 0.50, 0.035), caption("M", 0.49, 0.50, 0.02), caption("D", 0.57, 0.50, 0.02),
    ...(["19", "20"].includes(century) ? [caption(century, 0.31, 0.423, 0.045)] : []),
    caption("Review date", 0.04, 0.705, 0.14),
  ];
  const frames: LayerShape[] = [
    { x: 0.04, y: 0.04, w: 0.92, h: 0.44, c: "#000000", t: 0.002 },
    ...fixtureFields.filter(field => field.id.startsWith("signed_") && field.id !== "signed_place").map(field => ({ x: field.x, y: field.y, w: field.w, h: field.h, c: "#000000", t: 0.002 })),
  ];
  const rules: LayerShape[] = [
    { x: 0.20, y: 0.135, w: 0.56, h: 0.002, c: "#000000", d: true },
    { x: 0.20, y: 0.255, w: 0.64, h: 0.002, c: "#000000", d: true },
    { x: 0.20, y: 0.757, w: 0.26, h: 0.002, c: "#000000" },
  ];
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 500;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  context.font = "18px Arial";
  const printedCentury = text.find(run => run.t === century);
  if (printedCentury) printedCentury.w = context.measureText(printedCentury.t).width / canvas.width;
  text.forEach(run => context.fillText(run.t, run.x * canvas.width, (run.y + run.h * 0.8) * canvas.height));
  context.lineWidth = 2;
  frames.forEach(frame => context.strokeRect(frame.x * canvas.width, frame.y * canvas.height, frame.w * canvas.width, frame.h * canvas.height));
  context.setLineDash([1, 6]);
  context.lineWidth = 1;
  rules.forEach(rule => {
    context.beginPath();
    context.moveTo(rule.x * canvas.width, rule.y * canvas.height);
    context.lineTo((rule.x + rule.w) * canvas.width, rule.y * canvas.height);
    context.stroke();
  });
  return { src: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, path: "", layer: { text, rules, frames, combs: [], fills: [], pictures: [] } };
}

function makePage(pageNumber: number): FormPage {
  const canvas = document.createElement("canvas");
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageWidth, pageHeight);
  context.fillStyle = "#000000";
  context.strokeStyle = "#000000";
  context.lineWidth = 1;
  context.font = "16px Arial";
  const text: LayerText[] = [];
  const combs: LayerShape[] = [];
  for (const field of fixtureFields.filter(field => field.page === pageNumber)) {
    const box = { x: field.x, y: field.y, w: field.w, h: field.h };
    combs.push({ ...box, n: field.count, c: "#000000", t: 0.001 });
    text.push({ t: field.label, x: field.x, y: field.y - 0.075, w: 0.15, h: 0.04, s: 0.016, f: "arial", b: false, i: false, c: "#000000" });
    context.fillText(field.label, field.x * pageWidth, field.y * pageHeight - 14);
    context.strokeRect(field.x * pageWidth, field.y * pageHeight, field.w * pageWidth, field.h * pageHeight);
    for (let cell = 1; cell < field.count; cell++) {
      const divider = (field.x + field.w * cell / field.count) * pageWidth;
      context.beginPath();
      context.moveTo(divider, field.y * pageHeight);
      context.lineTo(divider, (field.y + field.h) * pageHeight);
      context.stroke();
    }
  }
  return { src: canvas.toDataURL("image/png"), width: pageWidth, height: pageHeight, path: "", layer: { text, combs, frames: [], rules: [], fills: [], pictures: [] } };
}

const declarationOnly = new URLSearchParams(location.search).get("case") === "declaration";
const definition = parseFormDefinition({
  title: "Saved block fields",
  display: new URLSearchParams(location.search).get("display") === "image" ? "image" : "digital",
  pages: declarationOnly ? [makeDeclarationPage()] : [makePage(1), makePage(2), makeDeclarationPage()],
  sections: [{ id: "details", fields: fixtureFields.filter(field => !declarationOnly || field.page === 3).map(field => ({
    id: field.id, label: field.label, type: field.type, options: [],
    placement: { page: declarationOnly ? 1 : field.page, box: { x: field.x - 0.001, y: field.y + 0.002, w: field.w + 0.001, h: field.h - 0.004 }, options: [] },
  })) }],
});

function App() {
  const [answers, setAnswers] = useState<FormAnswers>(() => JSON.parse(sessionStorage.getItem("replica-regression:answers") ?? "{}"));
  return <main style={{ width: "100%", maxWidth: 1032, margin: "0 auto", padding: 16, boxSizing: "border-box" }}>
    <PaperForm definition={definition} answers={answers} errors={validateFormAnswers(definition, answers)} onChange={(fieldId, value) => setAnswers(previous => {
      const next = { ...previous, [fieldId]: value };
      sessionStorage.setItem("replica-regression:answers", JSON.stringify(next));
      return next;
    })} />
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);