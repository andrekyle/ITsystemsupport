import { useEffect, useRef, useState } from "react";
import type { FormAnswer, FormAnswers, FormDefinition } from "../lib/formSchema";
import { ANNOTATIONS_KEY, readAnnotations } from "../lib/formSchema";
import { canSignDocumentField } from "../lib/documentSignatures";
import type { Profile } from "../types";
import { PaperForm } from "./PaperForm";
import { DocumentActions } from "./DocumentActions";
import "./form-builder.css";
import "./uploaded-pdf.css";

function readPdfAnswers(raw: string | boolean | undefined): FormAnswers {
  if (raw === undefined || raw === "") return {};
  if (typeof raw !== "string") throw new Error("Saved PDF answers could not be read.");
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Saved PDF answers could not be read.");
  const answers: FormAnswers = {};
  for (const [id,value] of Object.entries(parsed)) {
    if (typeof value !== "string" && typeof value !== "boolean" && !(Array.isArray(value) && value.every(item=>typeof item==="string"))) throw new Error("Saved PDF answers contain an invalid field.");
    answers[id]=value;
  }
  return answers;
}

export function UploadedPdf({ definition, profile, values, onChange, onSave }: {
  definition: FormDefinition;
  profile: Profile;
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  onSave?: () => Promise<void>;
}) {
  const key = "practical.replica.answers";
  const raw = values[key];
  const [local, setLocal] = useState<FormAnswers>(() => readPdfAnswers(raw));
  const current=useRef(local);
  useEffect(()=>{
    const answers=readPdfAnswers(raw);
    current.current=answers;
    setLocal(answers);
  },[raw]);
  const update = (id: string, value: FormAnswer) => {
    const next = { ...current.current, [id]: value };
    current.current=next;
    setLocal(next);
    onChange(key, JSON.stringify(next));
  };
  const change = (id: string, value: FormAnswer) => {
    const field = definition.sections.flatMap(section => section.fields).find(field => field.id === id);
    if (field?.type === "signature" && !canSignDocumentField(profile.role, field.label)) return;
    update(id, value);
  };
  return <>
    <DocumentActions name={definition.title} onSave={onSave} />
    <p className="muted no-print">{definition.display === "digital" ? "Converted HTML document." : "Original PDF pages (older image-based version)."} Type in the answer areas, or use Fill &amp; sign to add text, ticks and signatures anywhere needed.</p>
    <div className="uploaded-pdf document-print-target">
      <PaperForm definition={definition} answers={local} onChange={change}
        readOnlyFields={definition.sections.flatMap(section => section.fields).filter(field => field.type === "signature" && !canSignDocumentField(profile.role, field.label)).map(field => field.id)}
        annotations={readAnnotations(local)}
        onAnnotationsChange={annotations => update(ANNOTATIONS_KEY, JSON.stringify(annotations))} />
    </div>
  </>;
}
