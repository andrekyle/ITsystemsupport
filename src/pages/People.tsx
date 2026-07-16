import { useState } from "react";
import { Icon } from "../icons";
import type { EnrolmentInfo, Profile, Role, Route } from "../types";
import { isStaff } from "../types";
import { POE_SECTIONS, POE_TOTAL } from "../data/course";
import {
  createProfile,
  deleteProfile,
  hashPassword,
  loadPoeDocs,
  loadProfiles,
  updateProfile,
  usePoe,
} from "../store";
import { Avatar } from "../components/Avatar";
import { EMPTY_ENROLMENT, EnrolmentDetails, EnrolmentForm } from "../components/EnrolmentForm";
import { downloadDoc } from "../lib/files";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProfileHead({ profile }: { profile: Profile }) {
  return (
    <div className="card profile-head">
      <Avatar profile={profile} size={64} />
      <div>
        <div className="nm">{profile.name}</div>
        <div className="rl">
          {profile.role === "Super User" && <Icon name="shield" size={14} />}
          {profile.role} · joined {fmtDate(profile.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ---------- My profile ---------- */

export function ProfilePage({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EnrolmentInfo>({
    ...EMPTY_ENROLMENT,
    ...profile.enrolment,
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    onUpdateProfile({ enrolment: { ...draft, signedDate: new Date().toISOString() } });
    setEditing(false);
  }

  return (
    <>
      <div className="eyebrow">
        <Icon name="person" size={15} />
        My profile
      </div>
      <h1 className="page-title">My profile</h1>
      <p className="page-sub">System Support NQF Level 5 Learnership · Investec Group</p>

      <ProfileHead profile={profile} />

      <h2 className="section-title">
        <span className="ico">
          <Icon name="clipboard" size={20} />
        </span>
        Biographical enrolment information
        {!editing && (
          <button className="btn ghost profile-edit" onClick={() => setEditing(true)}>
            <Icon name="design" size={15} />
            {profile.enrolment ? "Edit" : "Complete now"}
          </button>
        )}
      </h2>

      {editing ? (
        <form className="card profile-enrol-card" onSubmit={save}>
          <EnrolmentForm value={draft} onChange={setDraft} />
          <div className="profile-edit-actions">
            <button className="btn" type="submit">
              <Icon name="checkCircle" size={15} />
              Save
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setDraft({ ...EMPTY_ENROLMENT, ...profile.enrolment });
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : profile.enrolment ? (
        <EnrolmentDetails enrolment={profile.enrolment} />
      ) : (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>
            No biographical enrolment information on record yet. Select “Complete now” to fill in
            the enrolment form — this is required for registration on the learnership.
          </span>
        </div>
      )}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="shield" size={20} />
        </span>
        Security
      </h2>
      <PasswordEditor
        hasPassword={!!profile.passwordHash}
        onSet={(hash) => onUpdateProfile({ passwordHash: hash })}
        onClear={() => onUpdateProfile({ passwordHash: undefined })}
      />
    </>
  );
}

function PasswordEditor({
  hasPassword,
  onSet,
  onClear,
}: {
  hasPassword: boolean;
  onSet: (hash: string) => void;
  onClear: () => void;
}) {
  const [pw, setPw] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!pw) return;
    onSet(await hashPassword(pw));
    setPw("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form className="card profile-enrol-card" onSubmit={save}>
      <div className="pw-row">
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="set-pw">{hasPassword ? "Change password" : "Set a sign-in password"}</label>
          <input
            id="set-pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password"
          />
        </div>
        <button className="btn" type="submit" disabled={!pw}>
          <Icon name="checkCircle" size={15} />
          Save
        </button>
        {hasPassword && (
          <button className="btn ghost" type="button" onClick={onClear}>
            Remove password
          </button>
        )}
      </div>
      {saved && <p className="muted" style={{ margin: "8px 0 0" }}>Password saved.</p>}
    </form>
  );
}

/* ---------- Students (facilitators & super users) ---------- */

export function StudentsPage({
  profile,
  route,
  navigate,
}: {
  profile: Profile;
  route: Route;
  navigate: (r: Route) => void;
}) {
  const isSuper = profile.role === "Super User";
  const isPrivileged = isStaff(profile.role);
  const [, setRev] = useState(0);
  const refresh = () => setRev((r) => r + 1);
  if (!isPrivileged) {
    return (
      <div className="callout">
        <span className="ico">
          <Icon name="shield" size={19} />
        </span>
        <span>This page is only available to facilitators, assessors, moderators and the super user.</span>
      </div>
    );
  }

  const all = loadProfiles();
  // Super Users manage every account; facilitators see their learners only
  const people = isSuper
    ? all.filter((p) => p.id !== profile.id)
    : all.filter((p) => p.role === "Learner");
  const student = route.studentId ? all.find((p) => p.id === route.studentId) : undefined;

  if (student)
    return (
      <StudentDetail student={student} viewer={profile} navigate={navigate} onChanged={refresh} />
    );

  return (
    <>
      <div className="eyebrow">
        <Icon name="people" size={15} />
        {isSuper ? "User management" : "Students"}
      </div>
      <h1 className="page-title">{isSuper ? "Users" : "Students"}</h1>
      <p className="page-sub">
        {isSuper
          ? "All accounts on this device — select a user to view their profile, update their details, reset their password or remove the account."
          : "All learner profiles on this device — select a student to view their enrolment information and uploaded documents."}
      </p>

      {isSuper && <AddUser onAdded={refresh} />}

      {people.length === 0 && (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>No {isSuper ? "other user" : "learner"} profiles exist yet.</span>
        </div>
      )}

      {people.map((s) => {
        const docs = Object.keys(loadPoeDocs(s.id)).length;
        return (
          <button
            key={s.id}
            className="profile-row"
            onClick={() => navigate({ page: "students", studentId: s.id })}
          >
            <Avatar profile={s} />
            <span>
              <span className="nm">{s.name}</span>
              <br />
              <span className="rl">
                {s.role} · {s.enrolment?.idNumber ? `ID ${s.enrolment.idNumber} · ` : ""}
                joined {fmtDate(s.createdAt)}
                {s.role === "Learner" && !s.enrolment ? " · enrolment form outstanding" : ""}
                {s.passwordHash ? " · password set" : ""}
              </span>
            </span>
            <span className="rl" style={{ marginLeft: "auto" }}>
              {s.role === "Learner" ? `${docs} / ${POE_TOTAL} documents` : ""}
            </span>
            <span className="chev">
              <Icon name="chevronRight" size={16} />
            </span>
          </button>
        );
      })}
    </>
  );
}

function AddUser({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Learner");
  const [pw, setPw] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProfile(name, role, undefined, pw ? await hashPassword(pw) : undefined);
    setName("");
    setRole("Learner");
    setPw("");
    setOpen(false);
    onAdded();
  }

  if (!open)
    return (
      <button className="btn ghost" style={{ marginBottom: 14 }} onClick={() => setOpen(true)}>
        <Icon name="person" size={15} />
        Add user
      </button>
    );

  return (
    <form className="card profile-enrol-card" style={{ marginBottom: 14 }} onSubmit={submit}>
      <div className="pw-row">
        <div className="field" style={{ flex: 2, marginBottom: 0 }}>
          <label htmlFor="au-nm">Full name</label>
          <input id="au-nm" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="au-rl">Role</label>
          <select id="au-rl" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="Learner">Learner</option>
            <option value="Facilitator">Facilitator</option>
            <option value="Assessor">Assessor</option>
            <option value="Moderator">Moderator</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="au-pw">Password (optional)</label>
          <input id="au-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <button className="btn" type="submit">
          <Icon name="checkCircle" size={15} />
          Create
        </button>
        <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <p className="muted" style={{ margin: "8px 0 0" }}>
        Learners added here can complete their biographical enrolment form from “My profile” after
        their first sign-in.
      </p>
    </form>
  );
}

function AdminPanel({
  student,
  onChanged,
  onDelete,
}: {
  student: Profile;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(student.name);
  const [role, setRole] = useState<Role>(student.role);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  };

  function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile(student.id, { name: name.trim(), role });
    onChanged();
    flash("Profile updated.");
  }

  async function setPassword() {
    if (!pw) return;
    updateProfile(student.id, { passwordHash: await hashPassword(pw) });
    setPw("");
    onChanged();
    flash("Password set.");
  }

  function resetPassword() {
    updateProfile(student.id, { passwordHash: undefined });
    onChanged();
    flash("Password removed — they can sign in without one and set a new password from My profile.");
  }

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="shield" size={20} />
        </span>
        Manage account — super user
      </h2>
      <div className="card profile-enrol-card">
        <form className="pw-row" onSubmit={saveDetails}>
          <div className="field" style={{ flex: 2, marginBottom: 0 }}>
            <label htmlFor="ad-nm">Full name</label>
            <input id="ad-nm" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="ad-rl">Role</label>
            <select id="ad-rl" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="Learner">Learner</option>
              <option value="Facilitator">Facilitator</option>
              <option value="Assessor">Assessor</option>
              <option value="Moderator">Moderator</option>
            </select>
          </div>
          <button className="btn" type="submit">
            <Icon name="checkCircle" size={15} />
            Save
          </button>
        </form>

        <div className="pw-row" style={{ marginTop: 14 }}>
          <div className="field" style={{ flex: 2, marginBottom: 0 }}>
            <label htmlFor="ad-pw">
              {student.passwordHash ? "Set a new password" : "Set a password"}
            </label>
            <input
              id="ad-pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password"
            />
          </div>
          <button className="btn" type="button" disabled={!pw} onClick={setPassword}>
            Set password
          </button>
          {student.passwordHash && (
            <button className="btn ghost" type="button" onClick={resetPassword}>
              Reset (remove) password
            </button>
          )}
          <button className="btn danger" type="button" onClick={onDelete}>
            Delete user
          </button>
        </div>
        {msg && (
          <p className="muted" style={{ margin: "10px 0 0" }}>
            {msg}
          </p>
        )}
      </div>
    </>
  );
}

function StudentDetail({
  student,
  viewer,
  navigate,
  onChanged,
}: {
  student: Profile;
  viewer: Profile;
  navigate: (r: Route) => void;
  onChanged: () => void;
}) {
  const isSuper = viewer.role === "Super User";
  const { docs } = usePoe(student.id);
  const [editingEnrol, setEditingEnrol] = useState(false);
  const [draft, setDraft] = useState<EnrolmentInfo>({ ...EMPTY_ENROLMENT, ...student.enrolment });
  const uploaded = POE_SECTIONS.flatMap((sec) =>
    sec.items.filter((item) => docs[item.id]).map((item) => ({ sec, item, doc: docs[item.id]! }))
  );

  function saveEnrol(e: React.FormEvent) {
    e.preventDefault();
    updateProfile(student.id, { enrolment: { ...draft, signedDate: new Date().toISOString() } });
    setEditingEnrol(false);
    onChanged();
  }

  function removeUser() {
    if (
      !window.confirm(
        `Delete ${student.name}'s account and all their saved progress, documents and notes? This cannot be undone.`
      )
    )
      return;
    deleteProfile(student.id);
    navigate({ page: "students" });
    onChanged();
  }

  return (
    <>
      <button className="btn ghost" onClick={() => navigate({ page: "students" })}>
        <Icon name="arrowLeft" size={15} />
        {isSuper ? "All users" : "All students"}
      </button>

      <h1 className="page-title" style={{ marginTop: 14 }}>
        {student.name}
      </h1>
      <p className="page-sub">
        {student.role} profile · System Support NQF Level 5 Learnership
      </p>

      <ProfileHead profile={student} />

      {isSuper && <AdminPanel student={student} onChanged={onChanged} onDelete={removeUser} />}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="clipboard" size={20} />
        </span>
        Biographical enrolment information
        {isSuper && !editingEnrol && (
          <button
            className="btn ghost profile-edit"
            onClick={() => {
              setDraft({ ...EMPTY_ENROLMENT, ...student.enrolment });
              setEditingEnrol(true);
            }}
          >
            <Icon name="design" size={15} />
            {student.enrolment ? "Edit" : "Complete on their behalf"}
          </button>
        )}
      </h2>
      {editingEnrol ? (
        <form className="card profile-enrol-card" onSubmit={saveEnrol}>
          <EnrolmentForm value={draft} onChange={setDraft} />
          <div className="profile-edit-actions">
            <button className="btn" type="submit">
              <Icon name="checkCircle" size={15} />
              Save
            </button>
            <button className="btn ghost" type="button" onClick={() => setEditingEnrol(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : student.enrolment ? (
        <EnrolmentDetails enrolment={student.enrolment} />
      ) : (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>This {student.role === "Learner" ? "student" : "user"} has not completed the biographical enrolment form yet.</span>
        </div>
      )}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="folder" size={20} />
        </span>
        Uploaded documents — {uploaded.length} / {POE_TOTAL}
      </h2>
      {uploaded.length === 0 ? (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>No documents uploaded yet.</span>
        </div>
      ) : (
        uploaded.map(({ sec, item, doc }) => (
          <div className="plan-upload-row" key={item.id}>
            <Icon name="document" size={17} />
            <span className="fileinfo">
              <span className="poe-file" title={doc.name}>
                {doc.name}
              </span>
              <span className="meta">
                {sec.heading} · {item.label} · {fmtSize(doc.size)} · {fmtDate(doc.uploadedAt)}
              </span>
            </span>
            {isSuper && (
              <button className="poe-dl" onClick={() => void downloadDoc(doc)} title="Download">
                <Icon name="download" size={17} />
              </button>
            )}
          </div>
        ))
      )}
    </>
  );
}
