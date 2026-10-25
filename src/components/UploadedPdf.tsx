import { useEffect, useRef, useState } from "react";
import type { FormAnswer, FormAnswers, FormDefinition } from "../lib/formSchema";
import { ANNOTATIONS_KEY, readAnnotations } from "../lib/formSchema";
import { canSignDocumentField } from "../lib/documentSignatures";
import type { Profile } from "../types";
import { PaperForm } from "./PaperForm";
import { DocumentActions } from "./DocumentActions";
import "./form-builder.css";
import "./uploaded-pdf.css";

function CleanHtmlDocument({ definition, answers, onChange, profile }: { definition: FormDefinition; answers: FormAnswers; onChange: (id: string, value: FormAnswer) => void; profile: Profile }) {
  const pages = definition.pages.map((page, index) => ({ page, index }));
  const fields = definition.sections.flatMap(section => section.fields);
  const fieldForPage = (page: number) => fields.filter(field => field.placement?.page === page);
  return <div className="clean-html-document">
    {pages.map(({ page, index }) => {
      const pageFields = fieldForPage(index + 1);
      const text = (page.layer?.text ?? []).slice().sort((a, b) => a.y - b.y || a.x - b.x).map(run => run.t).join(" ").trim();
      return <section className="clean-html-page" key={index}>
        {text && <div className="clean-html-copy">{text}</div>}
        {pageFields.length > 0 && <div className="clean-html-fields">{pageFields.map(field => {
          const value = answers[field.id];
          const label = field.label || "Answer";
          const set = (next: FormAnswer) => onChange(field.id, next);
          if (field.type === "checkbox") return <label className="clean-html-check" key={field.id}><input type="checkbox" checked={value === true} onChange={event => set(event.target.checked)} />{label}</label>;
          if (field.type === "textarea") return <label className="clean-html-field" key={field.id}><span>{label}</span><textarea value={typeof value === "string" ? value : ""} onChange={event => set(event.target.value)} /></label>;
          if (field.type === "select") return <label className="clean-html-field" key={field.id}><span>{label}</span><select value={typeof value === "string" ? value : ""} onChange={event => set(event.target.value)}><option value="">Select…</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
          return <label className="clean-html-field" key={field.id}><span>{label}</span><input type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"} value={typeof value === "string" ? value : ""} onChange={event => set(event.target.value)} /></label>;
        })}</div>}
      </section>;
    })}
  </div>;
}

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

export function UploadedPdf({ definition, profile, values, onChange, onSave, storageKey = "replica.answers" }: {
  definition: FormDefinition;
  profile: Profile;
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  onSave?: () => Promise<void>;
  storageKey?: string;
}) {
  const key = storageKey;
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
    <p className="muted no-print">{definition.display === "digital" ? "Converted HTML document." : "Original PDF pages (older image-based version)."} Type in the answer areas, or use Fill &amp; sign to add text, ticks and signatures anywhere needed.{onSave && " Answers save automatically to your learner profile as you type. Use Save to verify your latest changes."}</p>
    <div className="uploaded-pdf document-print-target">
      {definition.display === "digital" ? <CleanHtmlDocument definition={definition} answers={local} onChange={change} profile={profile} /> : <PaperForm definition={definition} answers={local} onChange={change}
        readOnlyFields={definition.sections.flatMap(section => section.fields).filter(field => field.type === "signature" && !canSignDocumentField(profile.role, field.label)).map(field => field.id)}
        annotations={readAnnotations(local)}
        onAnnotationsChange={annotations => update(ANNOTATIONS_KEY, JSON.stringify(annotations))} />}
    </div>
  </>;
}
