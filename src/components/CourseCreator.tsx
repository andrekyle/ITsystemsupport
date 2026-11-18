import { useState } from "react";
import { Modal } from "./Modal";
import { createCourse, courseStorageKey, saveCustomCourse, setActiveCourse } from "../data/courses";
import { useOnboardingPacks } from "../store";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";
import { loadContentModel } from "../lib/tokens";
import { ensureCourseCovers } from "../lib/courseCovers";
import { packCourseDetails, readQualificationDraft, type QualificationDraft } from "../lib/qualificationPack";

export function CourseCreator({ onClose }: { onClose: () => void }) {
  const { packs } = useOnboardingPacks();
  const [packId, setPackId] = useState("");
  const [draft, setDraft] = useState<QualificationDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof createCourse> | null>(null);
  const pack = packs.find(item => item.id === packId);
  function change(update: (value: QualificationDraft) => void) {
    setDraft(current => { if (!current) return current; const next = structuredClone(current); update(next); return next; });
  }
  async function readPack() {
    setSaving(true); setError(""); setProgress("Reading the qualification pack...");
    try {
      if (!pack) throw new Error("Select an uploaded qualification pack.");
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      const response = await fetch("/api/qualification-pack", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ packId, model: loadContentModel() }), signal: AbortSignal.timeout(290000) });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Could not read the qualification pack.");
      setDraft(readQualificationDraft(result.draft)); setProgress("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read the qualification pack."); setProgress(""); }
    finally { setSaving(false); }
  }
  async function save() {
    if (!draft || !pack) return;
    setSaving(true); setError("");
    try {
      let course = pending ?? createCourse(packCourseDetails(draft), draft.modules);
      course.sourcePack = { id: pack.id, name: pack.name };
      course.modules.forEach(module => module.units.forEach(unit => { unit.metadataSource = `Qualification pack: ${pack.name}`; }));
      setPending(course);
      course = await ensureCourseCovers(course, null, setPending, setProgress);
      setPending(course);
      saveCustomCourse(course);
      await flushKey(courseStorageKey(course.id), !!supabase);
      setActiveCourse(course.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the course."); setSaving(false); }
  }
  return <Modal className="course-creator-modal" title="Add course from qualification pack" onClose={onClose} actions={<>
    <button className="btn ghost" disabled={saving} onClick={onClose}>Cancel</button>
    {draft && !pending && <button className="btn ghost" disabled={saving} onClick={() => { setDraft(null); setError(""); setProgress(""); }}>Choose another pack</button>}
    <button className="btn ghost" disabled={saving || !pack} onClick={() => void (draft ? save() : readPack())}>{saving ? draft ? "Creating tiles..." : "Reading pack..." : pending ? "Retry save" : draft ? "Create course and tiles" : "Read qualification pack"}</button>
  </>}>
    {!draft ? <>
      <p>Select a pack already uploaded under Qualification Packs. AI will read its qualification details, modules and unit standards. Review the result before creating the course and its cover images.</p>
      <label className="field"><span>Qualification pack</span><select value={packId} disabled={saving} onChange={event => { setPackId(event.target.value); setError(""); }}><option value="">Select a qualification pack</option>{packs.map(item => <option key={item.id} value={item.id}>{item.name} ({item.files.length} files)</option>)}</select></label>
      {pack && <p>{pack.description || pack.name}</p>}
      {!packs.length && <p role="status">No qualification packs are available. Upload one under Qualification Packs, then return here.</p>}
    </> : <section aria-label="Qualification pack review">
      <p>Read from {pack?.name}. Review the qualification, module assignments and unit metadata. Covers will be generated when you create the course.</p>
      {draft.issues.length > 0 && <div role="status"><strong>Review notes</strong><ul>{draft.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></div>}
      <fieldset disabled={saving || !!pending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {([['title','Qualification name'],['saqaId','SAQA ID'],['nqfLevel','NQF level'],['credits','Credits'],['description','Description']] as const).map(([key,label]) => <label className="field" key={key}><span>{label}</span><input type={key === 'nqfLevel' || key === 'credits' ? 'number' : 'text'} value={typeof draft.qualification[key] === 'number' && Number(draft.qualification[key]) < (key === 'nqfLevel' ? 1 : 0) ? '' : draft.qualification[key]} onChange={event => change(value => { Object.assign(value.qualification, { [key]: key === 'nqfLevel' || key === 'credits' ? event.target.value === '' ? -1 : Number(event.target.value) : event.target.value }); })} /></label>)}
        <p>{draft.modules.length} modules, {draft.modules.reduce((total, module) => total + module.units.length, 0)} unit standards</p>
        {draft.modules.map((module, mi) => <details key={mi} open><summary>Module {mi + 1}: {module.name} ({module.units.length} unit standards)</summary>
          <label className="field"><span>Module {mi + 1}: name</span><input value={module.name} onChange={event => change(value => { value.modules[mi].name = event.target.value; })} /></label>
          <label className="field"><span>Module summary</span><textarea value={module.description} onChange={event => change(value => { value.modules[mi].description = event.target.value; })} /></label>
          <label className="field"><span>Module learning outcomes (one per line)</span><textarea value={module.outcomes.join("\n")} onChange={event => change(value => { value.modules[mi].outcomes = event.target.value.split("\n"); })} /></label>
          {module.units.map((unit, ui) => <details key={ui}><summary>{unit.us}: {unit.title}</summary>
            {([['us','Unit standard code'],['title','Unit title'],['nqf','Unit NQF level'],['credits','Unit credits'],['description','Unit summary']] as const).map(([key,label]) => <label className="field" key={key}><span>{label}</span><input type={key === 'nqf' || key === 'credits' ? 'number' : 'text'} value={typeof unit[key] === 'number' && Number(unit[key]) < (key === 'nqf' ? 1 : 0) ? '' : unit[key]} onChange={event => change(value => { Object.assign(value.modules[mi].units[ui], { [key]: key === 'nqf' || key === 'credits' ? event.target.value === '' ? -1 : Number(event.target.value) : event.target.value }); })} /></label>)}
            <label className="field"><span>Unit learning outcomes (one per line)</span><textarea value={unit.outcomes.join("\n")} onChange={event => change(value => { value.modules[mi].units[ui].outcomes = event.target.value.split("\n"); })} /></label>
          </details>)}
        </details>)}
      </fieldset>
    </section>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    {progress && <p role="status">{progress}</p>}
  </Modal>;
}
