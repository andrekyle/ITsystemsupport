import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { CHOICE_FIELD_TYPES, FORM_FIELD_TYPES, MAX_FORM_FIELDS, parseFormDefinition, type FormAnswers, type FormDefinition, type FormField, type FormFieldType, type FormSection } from "../lib/formSchema";
import { checkFormUpload, extractFormDocument, FORM_UPLOAD_ACCEPT, generateFormDefinition, missingPrintedText, type ImportedFormDocument } from "../lib/formImport";
import { saveFormTemplate, type SavedForm } from "../lib/forms";
import { PaperForm } from "./PaperForm";
import { Select } from "./Select";
import { ConfirmModal } from "./Modal";

const FIELD_NAMES: Record<FormFieldType, string> = {
  text: "Short text", textarea: "Long text", email: "Email", tel: "Phone number", number: "Number", date: "Date",
  select: "Dropdown", radio: "Single choice", checkbox: "Checkbox", checkboxes: "Multiple choice", signature: "Typed signature",
};

const newField = (): FormField => ({ id: `field_${crypto.randomUUID()}`, label: "", type: "text", required: false, helpText: "", options: [] });
const newSection = (): FormSection => ({ id: `section_${crypto.randomUUID()}`, title: "Form details", description: "", fields: [newField()], columns: 4, widths: [], rows: [], banner: "", pageBreak: false });

export function FormBuilder({ profile, onSaved, onCancel }: {
  profile: Profile;
  onSaved: (form: SavedForm) => void;
  onCancel: () => void;
}) {
  const [source, setSource] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [imported, setImported] = useState<ImportedFormDocument | null>(null);
  const [draft, setDraft] = useState<FormDefinition | null>(null);
  const [busy, setBusy] = useState<"reading" | "generating" | "saving" | null>(null);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewAnswers, setPreviewAnswers] = useState<FormAnswers>({});
  const [confirmLeave, setConfirmLeave] = useState(false);
  // printed lines of the source the generated replica does not contain
  const [missing, setMissing] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => {
    if (!source) { setSourceUrl(""); return; }
    const url = URL.createObjectURL(source);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);
  useEffect(() => {
    if (!source && !draft) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [source, draft]);

  const chooseFile = (file?: File) => {
    if (!file || busy || draft) return;
    setError("");
    try {
      checkFormUpload(file);
      setSourceUrl("");
      setSource(file);
      setImported(null);
      setConsent(false);
    } catch (error) { setError(error instanceof Error ? error.message : "The file could not be opened."); }
  };

  const generate = async () => {
    if (!source || !consent || busy) return;
    const nextController = new AbortController();
    controller.current = nextController;
    setBusy("reading");
    setError("");
    try {
      const document = imported ?? await extractFormDocument(source, nextController.signal);
      setImported(document);
      setBusy("generating");
      const definition = await generateFormDefinition(document, nextController.signal);
      if (nextController.signal.aborted) return;
      setDraft(definition);
      setMissing(missingPrintedText(document, definition));
      setMode("preview");
      setPreviewAnswers({});
    } catch (error) {
      if (!nextController.signal.aborted) setError(error instanceof Error ? error.message : "Form generation failed.");
    } finally {
      if (controller.current === nextController) { setBusy(null); controller.current = null; }
    }
  };

  const updateSection = (sectionId: string, update: (section: FormSection) => FormSection) =>
    setDraft(current => current ? { ...current, sections: current.sections.map(section => section.id === sectionId ? update(section) : section) } : current);
  const updateField = (sectionId: string, fieldId: string, patch: Partial<FormField>) =>
    updateSection(sectionId, section => ({ ...section, fields: section.fields.map(field => field.id === fieldId ? { ...field, ...patch } : field) }));
  const moveField = (sectionId: string, index: number, direction: -1 | 1) => updateSection(sectionId, section => {
    const fields = [...section.fields];
    const target = index + direction;
    if (target >= 0 && target < fields.length) [fields[index], fields[target]] = [fields[target], fields[index]];
    return { ...section, fields };
  });
  const totalFields = draft?.sections.reduce((total, section) => total + section.fields.length, 0) ?? 0;

  const save = async () => {
    if (!draft || busy) return;
    setError("");
    try {
      const definition = parseFormDefinition(draft);
      setBusy("saving");
      const saved = await saveFormTemplate(definition, source, profile.id);
      onSaved(saved);
    } catch (error) { setError(error instanceof Error ? error.message : "The form could not be saved."); }
    finally { setBusy(null); }
  };

  return (
    <div className="form-builder">
      <div className="fb-toolbar">
        <button type="button" className="btn ghost" disabled={busy === "saving"} onClick={() => source || draft ? setConfirmLeave(true) : onCancel()}><Icon name="chevronLeft" size={16} /> Forms</button>
        <h2>Form builder</h2>
        {draft && <span className="fb-field-count">{totalFields} fields</span>}
        {draft && <button type="button" className="btn primary" onClick={() => void save()} disabled={!!busy}><Icon name="check" size={16} /> {busy === "saving" ? "Saving..." : "Save form"}</button>}
      </div>

      {error && <p className="auth-error fb-message" role="alert">{error}</p>}
      {!draft ? (
        <div className="fb-upload-layout">
          <div>
            <div className="fb-upload" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}>
              <Icon name="document" size={36} />
              <h3>{source ? source.name : "Upload a blank form"}</h3>
              <p className="muted">{source ? `${(source.size / 1024).toFixed(0)} KB` : "PDF, Word, PNG, JPG or WebP. Up to 10 MB and 12 pages."}</p>
              <input ref={fileInput} type="file" accept={FORM_UPLOAD_ACCEPT} aria-label="Upload blank form" hidden disabled={!!busy} onChange={event => chooseFile(event.target.files?.[0])} />
              <button className="btn" type="button" disabled={!!busy} onClick={() => fileInput.current?.click()}><Icon name="folder" size={16} /> {source ? "Choose another file" : "Choose file"}</button>
            </div>
            <label className="fb-choice fb-consent">
              <input type="checkbox" checked={consent} disabled={!!busy} onChange={event => setConsent(event.target.checked)} />
              <span>This is a blank form. I consent to its text and images being processed by OpenAI for form generation.</span>
            </label>
            <div className="fb-actions">
              <button type="button" className="btn primary" disabled={!source || !consent || !!busy} onClick={() => void generate()}><Icon name="refresh" size={16} /> {busy === "reading" ? "Reading document..." : busy === "generating" ? "Generating..." : "Generate form"}</button>
              {busy ? <button type="button" className="btn ghost" onClick={() => controller.current?.abort()}>Cancel</button> : <button type="button" className="btn ghost" onClick={() => { setError(""); setMissing([]); setDraft({ title: source?.name.replace(/\.[^.]+$/, "") ?? "Untitled form", description: "", sections: [newSection()], titleColor: "", accentColor: "", masthead: "" }); }}><Icon name="document" size={16} /> Create manually</button>}
            </div>
            {busy && <p role="status" className="fb-field-note">{busy === "reading" ? "Reading the uploaded document..." : "Generating form fields..."}</p>}
          </div>
          {source && sourceUrl && <SourcePreview source={source} url={sourceUrl} text={imported?.text} />}
        </div>
      ) : (
        <>
          <div className="fb-review-toolbar">
            <div className="fb-mode" role="tablist" aria-label="Form builder view">
              <button type="button" role="tab" aria-selected={mode === "edit"} onClick={() => setMode("edit")}>Fields</button>
              <button type="button" role="tab" aria-selected={mode === "preview"} onClick={() => setMode("preview")}>Preview</button>
            </div>
            <div className="fb-actions">
              {draft.masthead && <button type="button" className="btn ghost" onClick={() => setDraft({ ...draft, masthead: "" })} title="Drop the letterhead image cut from the upload"><Icon name="close" size={16} /> Remove letterhead</button>}
              {source && sourceUrl && <a className="btn ghost" href={sourceUrl} download={source.name}><Icon name="download" size={16} /> Original document</a>}
            </div>
          </div>
          {missing.length > 0 && (
            <details className="fb-missing">
              <summary>Verbatim check: {missing.length} printed line{missing.length === 1 ? "" : "s"} of the original {missing.length === 1 ? "was" : "were"} not found in the replica</summary>
              <p className="fb-field-note">Compare against the original document and add anything that matters under Fields (a caption, a note, a declaration). Handwritten answers, page numbers and decorative text can be ignored.</p>
              <ul>{missing.map(line => <li key={line}>{line}</li>)}</ul>
            </details>
          )}
          {mode === "preview" ? <PaperForm definition={draft} answers={previewAnswers} onChange={(fieldId, value) => setPreviewAnswers(current => ({ ...current, [fieldId]: value }))} /> : (
            <fieldset className="fb-editor" disabled={!!busy}>
              <div className="field"><label htmlFor="builder-title">Form title</label><input id="builder-title" value={draft.title} maxLength={200} onChange={event => setDraft({ ...draft, title: event.target.value })} /></div>
              <div className="field"><label htmlFor="builder-description">Introduction</label><textarea id="builder-description" value={draft.description} rows={2} maxLength={5000} onChange={event => setDraft({ ...draft, description: event.target.value })} /></div>
              {draft.sections.map((section, sectionIndex) => (
                <section key={section.id} className="fb-section">
                  <div className="fb-section-head">
                    <div className="field"><label htmlFor={section.id}>Section {sectionIndex + 1}</label><input id={section.id} value={section.title} maxLength={300} onChange={event => updateSection(section.id, current => ({ ...current, title: event.target.value }))} /></div>
                    <button type="button" className="btn fb-icon" aria-label={`Remove section ${sectionIndex + 1}`} title="Remove section" disabled={draft.sections.length === 1} onClick={() => setDraft({ ...draft, sections: draft.sections.filter(current => current.id !== section.id) })}><Icon name="close" size={16} /></button>
                  </div>
                  <div className="field"><label htmlFor={`${section.id}-description`}>Section instructions</label><textarea id={`${section.id}-description`} rows={2} value={section.description} maxLength={5000} onChange={event => updateSection(section.id, current => ({ ...current, description: event.target.value }))} /></div>
                  {section.rows.length > 0 && <p className="fb-field-note">This section keeps the printed layout of the uploaded document ({section.columns} columns, {section.rows.length} rows). Fields you add here appear in a grid below it; removed fields leave their boxes blank.</p>}
                  {section.fields.length === 0 && <p className="fb-field-note">Printed text only (declaration, note or footer) — no fields to fill in.</p>}
                  {section.fields.map((field, fieldIndex) => (
                    <div key={field.id} className="fb-field-editor">
                      <div className="fb-field-editor-main">
                        <div className="field"><label htmlFor={field.id}>Field label</label><input id={field.id} value={field.label} maxLength={500} onChange={event => updateField(section.id, field.id, { label: event.target.value })} /></div>
                        <div className="field"><label>Type</label><Select value={field.type} ariaLabel={`Type for ${field.label || `field ${fieldIndex + 1}`}`} options={FORM_FIELD_TYPES.map(type => ({ value: type, label: FIELD_NAMES[type] }))} onChange={value => updateField(section.id, field.id, { type: value as FormFieldType, options: CHOICE_FIELD_TYPES.includes(value as FormFieldType) ? field.options : [] })} /></div>
                        <label className="fb-choice"><input type="checkbox" checked={field.required} onChange={event => updateField(section.id, field.id, { required: event.target.checked })} /><span>Required</span></label>
                        <div className="fb-actions">
                          <button type="button" className="btn fb-icon" aria-label={`Move field ${fieldIndex + 1} up`} title="Move field up" disabled={fieldIndex === 0} onClick={() => moveField(section.id, fieldIndex, -1)}><Icon name="chevronUp" size={16} /></button>
                          <button type="button" className="btn fb-icon" aria-label={`Move field ${fieldIndex + 1} down`} title="Move field down" disabled={fieldIndex === section.fields.length - 1} onClick={() => moveField(section.id, fieldIndex, 1)}><Icon name="chevronDown" size={16} /></button>
                          <button type="button" className="btn fb-icon" aria-label={`Remove field ${fieldIndex + 1}`} title="Remove field" disabled={section.fields.length === 1 && !section.rows.some(row => row.cells.some(cell => cell.kind === "text"))} onClick={() => updateSection(section.id, current => ({ ...current, fields: current.fields.filter(item => item.id !== field.id) }))}><Icon name="close" size={16} /></button>
                        </div>
                      </div>
                      <div className="field"><label htmlFor={`${field.id}-help`}>Field instructions</label><textarea id={`${field.id}-help`} rows={2} maxLength={3000} value={field.helpText} onChange={event => updateField(section.id, field.id, { helpText: event.target.value })} /></div>
                      {CHOICE_FIELD_TYPES.includes(field.type) && <div className="field"><label htmlFor={`${field.id}-options`}>Options</label><textarea id={`${field.id}-options`} rows={3} value={field.options.join("\n")} onChange={event => updateField(section.id, field.id, { options: event.target.value.split("\n") })} placeholder="One option per line" /></div>}
                    </div>
                  ))}
                  <button type="button" className="btn ghost" disabled={totalFields >= MAX_FORM_FIELDS} onClick={() => updateSection(section.id, current => ({ ...current, fields: [...current.fields, newField()] }))}><Icon name="document" size={16} /> Add field</button>
                </section>
              ))}
              <button type="button" className="btn ghost" disabled={draft.sections.length >= 30 || totalFields >= MAX_FORM_FIELDS} onClick={() => setDraft({ ...draft, sections: [...draft.sections, newSection()] })}><Icon name="layers" size={16} /> Add section</button>
            </fieldset>
          )}
        </>
      )}
      {confirmLeave && <ConfirmModal title="Discard form draft?" message="This form has not been saved. Discard the current draft and return to Forms?" confirmLabel="Discard draft" danger onConfirm={() => { controller.current?.abort(); onCancel(); }} onCancel={() => setConfirmLeave(false)} />}
    </div>
  );
}

function SourcePreview({ source, url, text }: { source: File; url: string; text?: string }) {
  const extension = source.name.split(".").pop()?.toLowerCase();
  return (
    <div className="fb-source">
      <h3>Original document</h3>
      {extension === "pdf" ? <iframe src={url} title="Uploaded form preview" /> : extension === "docx" ? <div className="fb-source-text"><Icon name="document" size={36} /><p>{source.name}</p>{text && <pre>{text}</pre>}</div> : <img src={url} alt={`Uploaded blank form: ${source.name}`} />}
    </div>
  );
}