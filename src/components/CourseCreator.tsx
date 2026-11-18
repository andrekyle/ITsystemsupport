import { useState } from "react";
import { Modal } from "./Modal";
import { createCourse, courseStorageKey, saveCustomCourse, setActiveCourse } from "../data/courses";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";
import { loadContentModel } from "../lib/tokens";
import { validateCourseDetails, validateCourseModules, type GeneratedCourseModule } from "../lib/courseMetadata";
import { ensureCourseCovers } from "../lib/courseCovers";

export function CourseCreator({ onClose }: { onClose: () => void }) {
  const [fields, setFields] = useState({ title: "", saqaId: "", nqfLevel: "5", credits: "0", description: "" });
  const [moduleCount, setModuleCount] = useState("1");
  const [unitCounts, setUnitCounts] = useState(["1"]);
  const [modules, setModules] = useState<GeneratedCourseModule[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverProgress, setCoverProgress] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof createCourse> | null>(null);
  const details = () => ({ ...fields, nqfLevel: Number(fields.nqfLevel), credits: Number(fields.credits), unitCounts: unitCounts.map(Number) });
  async function generate() {
    setSaving(true); setError("");
    try {
      const input = details();
      validateCourseDetails(input);
      if (Number(moduleCount) !== input.unitCounts.length) throw new Error("Enter a module count between 1 and 20.");
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      const response = await fetch("/api/course-metadata", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ ...input, model: loadContentModel() }), signal: AbortSignal.timeout(150000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not generate course metadata.");
      validateCourseModules(data.modules, input.unitCounts);
      setModules(data.modules);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate course metadata."); }
    finally { setSaving(false); }
  }
  async function save() {
    if (!modules) return;
    setSaving(true); setError("");
    try {
      let course = pending ?? createCourse(details(), modules);
      setPending(course);
      course = await ensureCourseCovers(course, null, setPending, setCoverProgress);
      setPending(course);
      saveCustomCourse(course);
      await flushKey(courseStorageKey(course.id), !!supabase);
      setActiveCourse(course.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the course."); setSaving(false); }
  }
  return <Modal className="course-creator-modal" title="Add course" onClose={onClose} actions={<>
    <button className="btn ghost" disabled={saving} onClick={onClose}>Cancel</button>
    {modules && !pending && <button className="btn ghost" disabled={saving} onClick={() => { setModules(null); setError(""); }}>Edit details</button>}
    <button className="btn ghost" disabled={saving} onClick={() => void (modules ? save() : generate())}>{saving ? modules ? "Saving..." : "Generating metadata..." : pending ? "Retry save" : modules ? "Create course" : "Generate course metadata"}</button>
  </>}>
    <p>Enter the course details and unit standard counts. AI will organise the qualification into modules and populate metadata for every unit standard.</p>
    <fieldset disabled={saving || !!modules} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {([['title', 'Course name'], ['saqaId', 'SAQA ID'], ['nqfLevel', 'NQF level'], ['credits', 'Credits'], ['description', 'Description']] as const).map(([key, label]) => <label className="field" key={key}>
        <span>{label}</span>
        <input value={fields[key]} type={key === 'nqfLevel' || key === 'credits' ? 'number' : 'text'} min={key === 'nqfLevel' ? 1 : key === 'credits' ? 0 : undefined} max={key === 'nqfLevel' ? 10 : undefined} step={1} onChange={e => setFields({ ...fields, [key]: e.target.value })} />
      </label>)}
      <label className="field"><span>Number of modules</span><input type="number" min={1} max={20} step={1} value={moduleCount} onChange={event => {
        const value = event.target.value; setModuleCount(value);
        const count = Number(value);
        if (Number.isInteger(count) && count >= 1 && count <= 20) setUnitCounts(current => Array.from({ length: count }, (_, index) => current[index] ?? "1"));
      }} /></label>
      {unitCounts.map((count, index) => <label className="field" key={index}><span>Module {index + 1}: number of unit standards</span><input type="number" min={1} max={30} step={1} value={count} onChange={event => setUnitCounts(current => current.map((item, i) => i === index ? event.target.value : item))} /></label>)}
    </fieldset>
    {modules && <section aria-label="Generated course metadata">
      <p>Review the generated module summaries and learning outcomes before creating the course. You can edit metadata later in the Training Calendar.</p>
      {modules.map((module, index) => <details key={index} open><summary><strong>Module {index + 1}: {module.name}</strong> - {module.units.length} unit standards</summary>
        <p>{module.description}</p><ul>{module.outcomes.map((outcome, i) => <li key={i}>{outcome}</li>)}</ul>
        {module.units.map(unit => <details key={unit.us}><summary>{unit.us}: {unit.title} - NQF {unit.nqf} - {unit.credits} credits</summary><p>{unit.description}</p><ul>{unit.outcomes.map((outcome, i) => <li key={i}>{outcome}</li>)}</ul></details>)}
      </details>)}
    </section>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    {coverProgress && <p role="status">{coverProgress}</p>}
  </Modal>;
}
