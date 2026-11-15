import { useState } from "react";
import type { Profile } from "../types";
import { getCourses } from "../data/courses";
import { assignmentFor, isAssignedStaff, saveStaffAssignment, useAssignments } from "../lib/assignments";
import { flushKey } from "../lib/sync";
import { ASSIGNMENTS_KEY } from "../lib/assignments";
import { cloudEnabled } from "../lib/supabase";

export function StaffAssignmentsPanel({ viewer, people }: { viewer: Profile; people: Profile[] }) {
  const assignments = useAssignments();
  const [selected, setSelected] = useState("");
  const staff = people.filter(isAssignedStaff);
  const person = staff.find(p => p.id === selected) ?? staff[0];
  return <section className="card" style={{ padding: 20, marginTop: 20 }}>
    <h2>Staff assignments</h2>
    <p>Assign students and courses to each facilitator, assessor, or moderator. Unassigned staff cannot browse students or courses. Admins retain access to everyone and every course.</p>
    {staff.length ? <><label htmlFor="assignment-staff">Staff member</label>
      <select id="assignment-staff" value={person?.id ?? ""} onChange={e => setSelected(e.target.value)}>
        {staff.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
      </select>
      {person && <AssignmentForm key={person.id}
        viewer={viewer} staff={person} people={people} current={assignmentFor(person, assignments)} />}
    </> : <p>No facilitators, assessors, or moderators are available yet.</p>}
  </section>;
}

function AssignmentForm({ viewer, staff, people, current }: {
  viewer: Profile; staff: Profile; people: Profile[]; current: { courseIds: string[]; learnerIds: string[] };
}) {
  const [courseIds, setCourseIds] = useState(current.courseIds);
  const [learnerIds, setLearnerIds] = useState(current.learnerIds);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (values: string[], id: string, checked: boolean) => checked ? [...new Set([...values, id])] : values.filter(v => v !== id);
  return <form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      if (cloudEnabled && !staff.cloudUserId) throw new Error("Link this staff member to a sign-in account before saving cloud assignments.");
      saveStaffAssignment(viewer, staff, { courseIds, learnerIds });
      if (cloudEnabled) await flushKey(ASSIGNMENTS_KEY, true);
      setMessage("Assignments saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save assignments."); }
    finally { setBusy(false); }
  }}>
    <fieldset disabled={busy}><legend>Assigned courses</legend>
      {getCourses().map(course => <label key={course.id} style={{ display: "block", margin: "8px 0" }}>
        <input type="checkbox" checked={courseIds.includes(course.id)} onChange={e => setCourseIds(toggle(courseIds, course.id, e.target.checked))} /> {course.label}
      </label>)}
    </fieldset>
    <fieldset disabled={busy}><legend>Assigned students</legend>
      {people.filter(p => p.role === "Learner").map(p => {
        const key = p.cloudUserId ?? p.id;
        return <label key={p.id} style={{ display: "block", margin: "8px 0" }}>
          <input type="checkbox" checked={learnerIds.includes(key) || learnerIds.includes(p.id)} onChange={e => {
            const remaining = learnerIds.filter(id => id !== p.id && id !== key);
            setLearnerIds(e.target.checked ? [...new Set([...remaining, p.id, key])] : remaining);
          }} /> {p.name}
        </label>;
      })}
    </fieldset>
    <button className="btn" type="submit" disabled={busy}>{busy ? "Saving..." : "Save assignments"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
