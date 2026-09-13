import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/styles.css";
import "../src/components/form-builder.css";
import { PaperForm } from "../src/components/PaperForm";
import { parseFormDefinition, type FormAnswers, type FormPage, type FormFieldType, type LayerShape, type LayerText } from "../src/lib/formSchema";

const pageWidth = 1000;
const pageHeight = 400;
const fixtureFields = [
  { id: "street", label: "Street address", type: "textarea" as FormFieldType, page: 1, x: 0.1, y: 0.2, w: 0.72, h: 0.075, count: 24 },
  { id: "suburb", label: "Suburb", type: "text" as FormFieldType, page: 1, x: 0.1, y: 0.45, w: 0.72, h: 0.075, count: 24 },
  { id: "telephone", label: "Telephone", type: "tel" as FormFieldType, page: 1, x: 0.1, y: 0.7, w: 0.36, h: 0.075, count: 12 },
  { id: "initials", label: "Initials", type: "text" as FormFieldType, page: 2, x: 0.1, y: 0.2, w: 0.09, h: 0.075, count: 3 },
  { id: "surname", label: "Surname", type: "text" as FormFieldType, page: 2, x: 0.3, y: 0.2, w: 0.6, h: 0.075, count: 20 },
  { id: "email", label: "Email", type: "email" as FormFieldType, page: 2, x: 0.1, y: 0.45, w: 0.72, h: 0.075, count: 24 },
];

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

const definition = parseFormDefinition({
  title: "Saved block fields",
  display: new URLSearchParams(location.search).get("display") === "image" ? "image" : "digital",
  pages: [makePage(1), makePage(2)],
  sections: [{ id: "details", fields: fixtureFields.map(field => ({
    id: field.id, label: field.label, type: field.type, options: [],
    placement: { page: field.page, box: { x: field.x - 0.001, y: field.y + 0.002, w: field.w + 0.001, h: field.h - 0.004 }, options: [] },
  })) }],
});

function App() {
  const [answers, setAnswers] = useState<FormAnswers>(() => JSON.parse(sessionStorage.getItem("replica-regression:answers") ?? "{}"));
  return <main style={{ width: "100%", maxWidth: 1032, margin: "0 auto", padding: 16, boxSizing: "border-box" }}>
    <PaperForm definition={definition} answers={answers} onChange={(fieldId, value) => setAnswers(previous => {
      const next = { ...previous, [fieldId]: value };
      sessionStorage.setItem("replica-regression:answers", JSON.stringify(next));
      return next;
    })} />
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);