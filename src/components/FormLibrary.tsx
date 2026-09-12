import { useEffect, useState, type ReactNode } from "react";
import type { Profile } from "../types";
import { Icon } from "../icons";
import { cloudEnabled } from "../lib/supabase";
import { formSourceUrl, loadFormResponse, removeFormTemplate, saveFormResponse, useForms, type SavedForm } from "../lib/forms";
import { validateFormAnswers, type FormAnswers } from "../lib/formSchema";
import { FormBuilder } from "./FormBuilder";
import { FormFields } from "./FormFields";
import { ConfirmModal, Modal } from "./Modal";
import "./form-builder.css";

export function FormLibrary({ profile, children }: { profile: Profile; children: ReactNode }) {
  const { forms, loading, error, reload } = useForms();
  const [view, setView] = useState<"list" | "registration" | "builder" | SavedForm>("list");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<SavedForm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const canBuild = profile.role === "Super User";
  const query = search.trim().toLowerCase();
  const visibleForms = forms.filter(form => `${form.title} ${form.source_name}`.toLowerCase().includes(query));
  const showRegistration = "student registration form".includes(query);

  const downloadSource = async (form: SavedForm) => {
    setActionError("");
    try {
      const url = await formSourceUrl(form);
      if (!url) throw new Error("The original document is only retained in cloud storage.");
      const link = document.createElement("a");
      link.href = url;
      link.download = form.source_name;
      link.click();
    } catch (error) { setActionError(error instanceof Error ? error.message : "The document could not be downloaded."); }
  };

  const deleteForm = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    setActionError("");
    try {
      await removeFormTemplate(confirmDelete);
      setNotice("Form deleted.");
      setConfirmDelete(null);
    } catch (error) { setActionError(error instanceof Error ? error.message : "The form could not be deleted."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="forms-library">
      <div className="eyebrow no-print"><Icon name="document" size={15} /> Learner forms</div>
      <h1 className="page-title no-print">Forms</h1>
      {!cloudEnabled && <p className="fb-field-note no-print">Local-only mode</p>}

      {view === "builder" && canBuild ? (
        <FormBuilder profile={profile} onCancel={() => setView("list")} onSaved={form => { setNotice(`Saved ${form.title}.`); setSearch(""); setView("list"); }} />
      ) : view === "registration" ? (
        <><div className="fb-toolbar no-print"><button className="btn ghost" type="button" onClick={() => setView("list")}><Icon name="chevronLeft" size={16} /> Forms</button></div>{children}</>
      ) : typeof view === "object" ? (
        <SavedFormView key={`${view.id}:${profile.id}`} template={view} profile={profile} onClose={() => setView("list")} />
      ) : (
        <>
          <div className="fb-toolbar no-print">
            <div className="field fb-filter"><label htmlFor="form-search">Find a form</label><input id="form-search" value={search} onChange={event => setSearch(event.target.value)} type="search" /></div>
            {canBuild && <button type="button" className="btn primary" onClick={() => { setNotice(""); setActionError(""); setView("builder"); }}><Icon name="document" size={16} /> Upload form</button>}
            <button type="button" className="btn fb-icon" onClick={reload} title="Refresh forms" aria-label="Refresh forms" disabled={loading}><Icon name="refresh" size={16} /></button>
          </div>
          {notice && <p role="status" className="fb-field-note">{notice}</p>}
          {error && <p role="alert" className="auth-error">{error}</p>}
          {actionError && !confirmDelete && <p role="alert" className="auth-error">{actionError}</p>}
          {loading && <p role="status" className="fb-field-note">Loading forms...</p>}
          <div className="forms-table-wrap">
            <table className="forms-table" aria-label="Available forms">
              <thead><tr><th scope="col">Form</th><th scope="col">Fields</th><th scope="col">Added</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {showRegistration && <tr><td><button type="button" className="btn form-name" onClick={() => setView("registration")}>Student Registration Form</button><p className="form-source">Built-in form</p></td><td>Registration</td><td>Built-in</td><td /></tr>}
                {visibleForms.map(form => (
                  <tr key={form.id}>
                    <td><button type="button" className="btn form-name" onClick={() => setView(form)}>{form.title}</button><p className="form-source">{form.source_name || "Custom form"}</p></td>
                    <td>{form.definition.sections.reduce((total, section) => total + section.fields.length, 0)}</td>
                    <td>{new Date(form.created_at).toLocaleDateString()}</td>
                    <td>{canBuild && <div className="fb-actions">
                      {form.source_path && <button type="button" className="btn fb-icon" aria-label={`Download original ${form.title}`} title="Download original document" onClick={() => void downloadSource(form)}><Icon name="download" size={16} /></button>}
                      <button type="button" className="btn fb-icon" aria-label={`Delete ${form.title}`} title="Delete form" onClick={() => { setActionError(""); setConfirmDelete(form); }}><Icon name="close" size={16} /></button>
                    </div>}</td>
                  </tr>
                ))}
                {!loading && !showRegistration && !visibleForms.length && <tr><td colSpan={4}>No forms match this search.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      {confirmDelete && <Modal title="Delete form" onClose={() => { if (!deleting) setConfirmDelete(null); }} actions={<>
        <button type="button" className="btn ghost" disabled={deleting} onClick={() => setConfirmDelete(null)}>Cancel</button>
        <button type="button" className="btn danger" disabled={deleting} onClick={() => void deleteForm()}>{deleting ? "Deleting..." : "Delete form"}</button>
      </>}><p>Delete <strong>{confirmDelete.title}</strong> and all completed responses? This cannot be undone.</p>{actionError && <p className="auth-error" role="alert">{actionError}</p>}</Modal>}
    </div>
  );
}

function SavedFormView({ template, profile, onClose }: { template: SavedForm; profile: Profile; onClose: () => void }) {
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState("");
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    void loadFormResponse(template.id, profile.id).then(response => {
      if (!active) return;
      setAnswers(response?.answers ?? {});
      setSavedAt(response?.updated_at ?? "");
      setDirty(false);
    }).catch(error => { if (active) setLoadError(error instanceof Error ? error.message : "Your answers could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [template.id, profile.id, revision]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const save = async (): Promise<boolean> => {
    if (loading || saving || loadError) return false;
    const validation = validateFormAnswers(template.definition, answers);
    setFieldErrors(validation);
    if (Object.keys(validation).length) { setError("Complete the highlighted fields before saving."); return false; }
    setSaving(true);
    setError("");
    try {
      const response = await saveFormResponse(template.id, profile.id, answers);
      setSavedAt(response.updated_at);
      setDirty(false);
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Your answers could not be saved."); return false; }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fb-toolbar no-print">
        <button type="button" className="btn ghost" disabled={saving} onClick={() => dirty ? setConfirmLeave(true) : onClose()}><Icon name="chevronLeft" size={16} /> Forms</button>
        <button type="button" className="btn primary" disabled={loading || saving || !!loadError} onClick={() => void save()}><Icon name="check" size={16} /> {saving ? "Saving..." : "Save answers"}</button>
        <button type="button" className="btn ghost" disabled={loading || saving || !!loadError} onClick={async () => { if (await save()) window.print(); }}><Icon name="download" size={16} /> Print / PDF</button>
        {dirty ? <span className="fb-response-saved" role="status">Unsaved changes</span> : savedAt && <span className="fb-response-saved" role="status">Saved {new Date(savedAt).toLocaleString()}</span>}
      </div>
      {loading && <p role="status">Loading saved answers...</p>}
      {loadError && <div className="fb-message"><p className="auth-error" role="alert">{loadError}</p><button type="button" className="btn" onClick={() => setRevision(value => value + 1)}>Retry</button></div>}
      {error && <p role="alert" className="auth-error">{error}</p>}
      <fieldset className="fb-response-controls" disabled={loading || saving || !!loadError}>
        <FormFields definition={template.definition} answers={answers} errors={fieldErrors} onChange={(fieldId, value) => {
          setAnswers(current => ({ ...current, [fieldId]: value }));
          setDirty(true);
          setFieldErrors(current => { const next = { ...current }; delete next[fieldId]; return next; });
        }} />
      </fieldset>
      {confirmLeave && <ConfirmModal title="Unsaved answers" message="Leave this form without saving your changes?" confirmLabel="Discard changes" danger onConfirm={onClose} onCancel={() => setConfirmLeave(false)} />}
    </>
  );
}