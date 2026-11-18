import { useState } from "react";
import type { Profile } from "../types";
import { activeCourse, courseStorageKey } from "../data/courses";
import { enrolCourseLearners, isEnrolledInCourse } from "../lib/courseEnrolment";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";
import { Modal } from "./Modal";

export function CourseEnrolment({ candidates, onSaved }: { candidates: Profile[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const course = activeCourse();
  if (!course.id.startsWith("custom-")) return null;
  const available = candidates.filter(profile => profile.role === "Learner" && !isEnrolledInCourse(profile));
  async function save() {
    setSaving(true); setError("");
    try {
      enrolCourseLearners(available.filter(profile => selected.includes(profile.id)));
      await flushKey(courseStorageKey(course.id), !!supabase);
      onSaved(); setOpen(false); setSelected([]);
    } catch (e) { setError(e instanceof Error ? e.message : "Enrolment could not be saved. Retry."); }
    finally { setSaving(false); }
  }
  return <>
    <p>Students shown here are enrolled in {course.meta.title}.</p>
    <button type="button" className="btn" onClick={() => { setOpen(true); setError(""); }}>Enrol students</button>
    {open && <Modal title="Enrol students in this qualification" onClose={() => { if (!saving) setOpen(false); }} actions={<>
      <button className="btn ghost" disabled={saving} onClick={() => setOpen(false)}>Cancel</button>
      <button className="btn solid" disabled={saving || !selected.length} onClick={() => void save()}>{saving ? "Saving enrolment..." : "Enrol selected students"}</button>
    </>}>
      <p>{course.meta.title}</p>
      {!available.length && <p>No other learner accounts are available. Create a learner using Add User to enrol a new student in this qualification.</p>}
      {available.map(profile => <label key={profile.id} style={{ display: "flex", gap: 10, padding: "8px 0" }}><input type="checkbox" disabled={saving} checked={selected.includes(profile.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, profile.id] : ids.filter(id => id !== profile.id))} />{profile.name}</label>)}
      {error && <p role="alert" className="auth-error">{error}</p>}
    </Modal>}
  </>;
}
