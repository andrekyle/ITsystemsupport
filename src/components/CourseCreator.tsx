import { useState } from "react";
import { Modal } from "./Modal";
import { createCourse, courseStorageKey, saveCustomCourse, setActiveCourse } from "../data/courses";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";

export function CourseCreator({ onClose }: { onClose: () => void }) {
  const [fields, setFields] = useState({ title: "", saqaId: "", nqfLevel: "5", credits: "0", description: "", moduleName: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof createCourse> | null>(null);
  async function save() {
    setSaving(true); setError("");
    try {
      const course = pending ?? createCourse({ ...fields, nqfLevel: Number(fields.nqfLevel), credits: Number(fields.credits) });
      setPending(course);
      saveCustomCourse(course);
      await flushKey(courseStorageKey(course.id), !!supabase);
      setActiveCourse(course.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the course."); setSaving(false); }
  }
  return <Modal title="Add course" onClose={() => { if (!saving) onClose(); }} actions={<>
    <button className="btn ghost" disabled={saving} onClick={onClose}>Cancel</button>
    <button className="btn primary" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : pending ? "Retry save" : "Create course"}</button>
  </>}>
    <p>Add your course details. You can add more modules and unit standards in the Training Calendar.</p>
    {([['title', 'Course name'], ['saqaId', 'SAQA ID'], ['nqfLevel', 'NQF level'], ['credits', 'Credits'], ['description', 'Description'], ['moduleName', 'First module name']] as const).map(([key, label]) => <label className="field" key={key}>
      <span>{label}</span>
      <input value={fields[key]} disabled={saving || !!pending} type={key === 'nqfLevel' || key === 'credits' ? 'number' : 'text'} onChange={e => setFields({ ...fields, [key]: e.target.value })} />
    </label>)}
    {error && <p role="alert" className="auth-error">{error}</p>}
  </Modal>;
}
