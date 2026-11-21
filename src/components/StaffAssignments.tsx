import { useState } from "react";
import type { Profile } from "../types";
import { Avatar } from "./Avatar";
import { Select } from "./Select";
import { getCourses } from "../data/courses";
import { assignmentFor, isAssignedStaff, saveStaffAssignment, useAssignments } from "../lib/assignments";
import { flushKey } from "../lib/sync";
import { ASSIGNMENTS_KEY } from "../lib/assignments";
import { cloudEnabled, supabase } from "../lib/supabase";

export function StaffAssignmentsPanel({ viewer, people }: { viewer: Profile; people: Profile[] }) {
  const assignments = useAssignments();
  const [selected, setSelected] = useState("");
  const staffByAccount = new Map<string, Profile>();
  for (const profile of people.filter(isAssignedStaff)) {
    if (viewer.role === "Super User" &&
      (profile.id === viewer.id || (!!viewer.cloudUserId && profile.cloudUserId === viewer.cloudUserId))) continue;
    const accountId = profile.cloudUserId ?? profile.id;
    if (!staffByAccount.has(accountId)) staffByAccount.set(accountId, profile);
  }
  const staff = [...staffByAccount.values()];
  if (viewer.role === "Super User") staff.unshift(viewer);
  const person = staff.find(p => p.id === selected) ?? staff[0];
  const staffOptions = staff.map(profile => ({
    value: profile.id,
    ariaLabel: `${profile.name} (${profile.role})`,
    label: <StaffOption profile={profile} />,
  }));
  const hasOtherStaff = staff.some(profile => profile.id !== viewer.id);
  return <section className="card" style={{ padding: 20, marginTop: 20 }}>
    <h2>Staff assignments</h2>
    <p>Assign students and courses to each facilitator, assessor, or moderator. Unassigned staff cannot browse students or courses. Admins retain access to everyone and every course; assigning a Super User records their workload but does not limit their access.</p>
    {staff.length ? <><label htmlFor="assignment-staff">Staff member</label>
      <Select
        id="assignment-staff"
        ariaLabel="Staff member"
        value={person?.id ?? ""}
        buttonLabel={person ? <StaffOption profile={person} /> : "Choose staff member"}
        options={staffOptions}
        onChange={setSelected}
      />
      {viewer.role === "Super User" && !hasOtherStaff && <p className="mini-note" style={{ marginTop: 8 }}>
        No other facilitator accounts are registered yet. Add them above with the Facilitator, Assessor, or Moderator role to include them here.
      </p>}
      {person && <AssignmentForm key={person.id}
        viewer={viewer} staff={person} people={people} current={assignmentFor(person, assignments)} />}
    </> : <p>No facilitators, assessors, or moderators are available yet.</p>}
  </section>;
}

function StaffOption({ profile }: { profile: Profile }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
    <Avatar profile={profile} size={28} />
    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name} ({profile.role})</span>
  </span>;
}

function AssignmentForm({ viewer, staff, people, current }: {
  viewer: Profile; staff: Profile; people: Profile[]; current: { courseIds: string[]; learnerIds: string[] };
}) {
  const [courseIds, setCourseIds] = useState(current.courseIds);
  const [learnerIds, setLearnerIds] = useState(current.learnerIds);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (values: string[], id: string, checked: boolean) => checked ? [...new Set([...values, id])] : values.filter(v => v !== id);
  const learners = people.filter(p => p.role === "Learner");
  const cohorts = [...new Set(learners.map(p => p.cohortId?.trim()).filter((id): id is string => !!id))].sort();
  const cohortLearners = learners.filter(p => p.cohortId?.trim() === selectedCohort);
  const cohortProfileIds = () => cohortLearners.flatMap(p => [p.id, p.cloudUserId].filter((id): id is string => !!id));
  const allLearnerProfileIds = learners.flatMap(p => [p.id, p.cloudUserId].filter((id): id is string => !!id));
  const isViewerAssignment = staff.id === viewer.id || (!!viewer.cloudUserId && staff.cloudUserId === viewer.cloudUserId);
  const addCohort = () => setLearnerIds(ids => [...new Set([...ids, ...cohortProfileIds()])]);
  const removeCohort = () => {
    const cohortIds = new Set(cohortProfileIds());
    setLearnerIds(ids => ids.filter(id => !cohortIds.has(id)));
  };
  return <form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      let staffToSave = staff;
      if (cloudEnabled && !staffToSave.cloudUserId && staff.id === viewer.id && staff.role === "Super User") {
        if (!supabase) throw new Error("Cloud assignments are unavailable.");
        const { data, error } = await supabase.auth.getUser();
        if (error) throw new Error(`Could not identify your sign-in account: ${error.message}`);
        if (!data.user) throw new Error("Sign in again before saving assignments.");
        staffToSave = { ...staff, cloudUserId: data.user.id };
      }
      if (cloudEnabled && !staffToSave.cloudUserId) throw new Error("Link this staff member to a sign-in account before saving cloud assignments.");
      saveStaffAssignment(viewer, staffToSave, { courseIds, learnerIds });
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
      {isViewerAssignment && viewer.role === "Super User" && <button className="btn ghost sm" type="button" disabled={learners.length === 0} onClick={() => setLearnerIds(ids => [...new Set([...ids, ...allLearnerProfileIds])])}>
        Add all listed learners ({learners.length})
      </button>}
      {cohorts.length > 0 && <div style={{ marginBottom: 12 }}>
        <label htmlFor="assignment-cohort">Cohort</label>
        <select id="assignment-cohort" value={selectedCohort} onChange={e => setSelectedCohort(e.target.value)}>
          <option value="">Choose a cohort</option>
          {cohorts.map(cohort => <option key={cohort} value={cohort}>{cohort}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn ghost sm" type="button" disabled={!selectedCohort || cohortLearners.length === 0} onClick={addCohort}>
            Add all {cohortLearners.length} learners in cohort
          </button>
          <button className="btn ghost sm" type="button" disabled={!selectedCohort || cohortLearners.length === 0} onClick={removeCohort}>
            Remove cohort learners
          </button>
        </div>
      </div>}
      {learners.map(p => {
        const key = p.cloudUserId ?? p.id;
        const cohortLabel = p.cohortId?.trim();
        return <label key={p.id} style={{ display: "block", margin: "8px 0" }}>
          <input type="checkbox" checked={learnerIds.includes(key) || learnerIds.includes(p.id)} onChange={e => {
            const remaining = learnerIds.filter(id => id !== p.id && id !== key);
            setLearnerIds(e.target.checked ? [...new Set([...remaining, p.id, key])] : remaining);
          }} /> {p.name}{cohortLabel ? ` (${cohortLabel})` : ""}
        </label>;
      })}
      {cohorts.length === 0 && <p className="mini-note">No learners have an explicit cohort ID. Assign them individually or add cohort IDs first.</p>}
    </fieldset>
    <button className="btn" type="submit" disabled={busy}>{busy ? "Saving..." : "Save assignments"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
