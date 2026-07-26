import { useEffect, useState } from "react";
import { Icon } from "../icons";
import type { EnrolmentInfo, PoeDoc, Profile, ProgressState, Role, Route } from "../types";
import { isStaff } from "../types";
import { MODULES, POE_SECTIONS, POE_TOTAL } from "../data/course";
import { getContent } from "../data/content";
import {
  createProfile,
  deleteProfile,
  hashPassword,
  loadPoeDocs,
  loadProfiles,
  loadProgress,
  poeItemCount,
  updateProfile,
  usePoe,
} from "../store";
import { Avatar } from "../components/Avatar";
import { EMPTY_ENROLMENT, EnrolmentDetails, EnrolmentForm } from "../components/EnrolmentForm";
import { AlertModal, ConfirmModal } from "../components/Modal";
import { downloadDoc } from "../lib/files";
import {
  deleteCloudProfile,
  fetchCloudDirectory,
  fetchCloudProgress,
  updateCloudProfile,
  type CloudDirectory,
} from "../lib/directory";

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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
        <button className="btn sm" type="submit" disabled={!pw}>
          <Icon name="checkCircle" size={15} />
          Save
        </button>
        {hasPassword && (
          <button className="btn ghost sm" type="button" onClick={onClear}>
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
  const [rev, setRev] = useState(0);
  const refresh = () => setRev((r) => r + 1);
  const [cloud, setCloud] = useState<CloudDirectory | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchCloudDirectory().then((d) => {
      if (alive && d) setCloud(d);
    });
    return () => {
      alive = false;
    };
  }, [rev]);
  const local = loadProfiles();
  const localIds = new Set(local.map((p) => p.id));
  const remote = (cloud?.profiles ?? []).filter((p) => !localIds.has(p.id));
  const remoteIds = new Set(remote.map((p) => p.id));
  const all = [...local, ...remote];
  // Super Users manage every account; facilitators see their learners;
  // learners see the enrolled learner list (read-only)
  const people = (
    isSuper
      ? all.filter((p) => p.id !== profile.id)
      : all.filter((p) => p.role === "Learner")
  ).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const student = route.studentId ? all.find((p) => p.id === route.studentId) : undefined;

  if (student && (isPrivileged || student.role === "Learner"))
    return (
      <StudentDetail
        student={student}
        viewer={profile}
        navigate={navigate}
        onChanged={refresh}
        remote={remoteIds.has(student.id)}
        owner={cloud?.owners[student.id]}
        cloudDocs={cloud?.poe[student.id]}
      />
    );

  return (
    <>
      <div className="eyebrow">
        <Icon name="people" size={15} />
        {isSuper ? "User management" : isPrivileged ? "Students" : "Enrolled learners"}
      </div>
      <h1 className="page-title">
        {isSuper ? "Users" : isPrivileged ? "Students" : "Enrolled Learners"}
      </h1>
      <p className="page-sub">
        {isSuper
          ? "All accounts on this device and in the cloud — select a user to view their profile, update their details, reset their password or remove the account."
          : isPrivileged
            ? "All learner profiles on this device and in the cloud — select a student to view their enrolment information and uploaded documents."
            : "Everyone enrolled on this learnership. Personal contact details are kept private."}
      </p>

      {isSuper && <AddUser onAdded={refresh} />}

      {isPrivileged && people.length > 0 && (
        <PeopleSummary people={people} cloud={cloud} remoteIds={remoteIds} navigate={navigate} />
      )}

      {people.length === 0 && (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>No {isSuper ? "other user" : "learner"} profiles exist yet.</span>
        </div>
      )}

      {people.map((s) => {
        const isRemote = remoteIds.has(s.id);
        const docs = isRemote
          ? poeItemCount(cloud?.poe[s.id] ?? {})
          : poeItemCount(loadPoeDocs(s.id));
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
                {s.role}
                {isPrivileged
                  ? ` · last login ${s.lastLogin ? fmtDateTime(s.lastLogin) : "never"}`
                  : ""}
                {" · joined "}
                {fmtDate(s.createdAt)}
                {isPrivileged && isRemote ? " · own sign-in account" : ""}
                {isPrivileged && s.role === "Learner" && !s.enrolment ? " · enrolment form outstanding" : ""}
                {isPrivileged && s.passwordHash ? " · password set" : ""}
              </span>
            </span>
            <span className="rl docs">
              {isPrivileged && s.role === "Learner" ? `${docs} / ${POE_TOTAL} documents` : ""}
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
  onPatch,
  onDelete,
}: {
  student: Profile;
  onPatch: (patch: Partial<Profile>) => Promise<boolean>;
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

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onPatch({ name: name.trim(), role })) flash("Profile updated.");
  }

  async function setPassword() {
    if (!pw) return;
    if (await onPatch({ passwordHash: await hashPassword(pw) })) {
      setPw("");
      flash("Password set.");
    }
  }

  async function resetPassword() {
    if (await onPatch({ passwordHash: undefined })) {
      flash("Password removed — they can sign in without one and set a new password from My profile.");
    }
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
          <button className="btn sm" type="submit">
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
              autoComplete="new-password"
            />
          </div>
          <button className="btn ghost sm" type="button" disabled={!pw} onClick={setPassword}>
            Set password
          </button>
          {student.passwordHash && (
            <button className="btn ghost sm" type="button" onClick={resetPassword}>
              Reset (remove) password
            </button>
          )}
          <button className="btn danger sm" type="button" onClick={onDelete}>
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

/* ---------- summary table (staff) ---------- */

/** All units that carry quizzes or marked exercises. */
function assessedUnits() {
  return MODULES.flatMap((m) =>
    m.units.map((u) => ({ unit: u, content: getContent(u.us) }))
  ).filter(
    (x) =>
      x.content &&
      (x.content.quiz.length ||
        x.content.quizzes?.length ||
        x.content.exercises.some((e) => e.checks))
  );
}

interface QuizStats {
  quizCount: number;
  quizAttempted: number;
  quizCompetent: number;
  questionsBest: number;
  questionsTotal: number;
  overallPct: number;
}

/** Overall quiz totals for a student across the whole programme. */
function quizStats(progress: ProgressState): QuizStats {
  let quizCount = 0;
  let quizAttempted = 0;
  let quizCompetent = 0;
  let questionsBest = 0;
  let questionsTotal = 0;
  for (const { unit, content } of assessedUnits()) {
    const prog = progress.units[unit.us];
    const named = content?.quizzes ?? [];
    if (named.length) {
      for (const qz of named) {
        quizCount++;
        questionsTotal += qz.questions.length;
        const r = prog?.quizzes?.[qz.id];
        if (r) {
          quizAttempted++;
          questionsBest += r.best;
          if (r.best / r.total >= 0.8) quizCompetent++;
        }
      }
    } else if (content?.quiz.length) {
      quizCount++;
      questionsTotal += content.quiz.length;
      const r = prog?.quiz;
      if (r) {
        quizAttempted++;
        questionsBest += r.best;
        if (r.best / r.total >= 0.8) quizCompetent++;
      }
    }
  }
  const overallPct = questionsTotal ? Math.round((questionsBest / questionsTotal) * 100) : 0;
  return { quizCount, quizAttempted, quizCompetent, questionsBest, questionsTotal, overallPct };
}

interface SummaryCol {
  id: string;
  label: string;
  cell: (ctx: SummaryRowCtx) => React.ReactNode;
  /** value used when sorting by this column — null sorts last */
  sort: (ctx: SummaryRowCtx) => string | number | null;
}

interface SummaryRowCtx {
  p: Profile;
  docs: number;
  stats: QuizStats | null; // null while cloud scores are loading
}

const SUMMARY_COLS: SummaryCol[] = [
  { id: "name", label: "Name", cell: ({ p }) => <strong>{p.name}</strong>, sort: ({ p }) => p.name },
  { id: "role", label: "Role", cell: ({ p }) => p.role, sort: ({ p }) => p.role },
  {
    id: "idNumber",
    label: "ID number",
    cell: ({ p }) => p.enrolment?.idNumber || "—",
    sort: ({ p }) => p.enrolment?.idNumber || null,
  },
  {
    id: "qualification",
    label: "Highest qualification",
    cell: ({ p }) => p.enrolment?.highestQualification || "—",
    sort: ({ p }) => p.enrolment?.highestQualification || null,
  },
  {
    id: "email",
    label: "Email",
    cell: ({ p }) => p.enrolment?.email || "—",
    sort: ({ p }) => p.enrolment?.email || null,
  },
  {
    id: "cellphone",
    label: "Cellphone",
    cell: ({ p }) => p.enrolment?.cellphone || "—",
    sort: ({ p }) => p.enrolment?.cellphone || null,
  },
  {
    id: "gender",
    label: "Gender",
    cell: ({ p }) => p.enrolment?.gender || "—",
    sort: ({ p }) => p.enrolment?.gender || null,
  },
  {
    id: "age",
    label: "Age",
    cell: ({ p }) => p.enrolment?.age || "—",
    sort: ({ p }) => (p.enrolment?.age ? Number(p.enrolment.age) : null),
  },
  {
    id: "language",
    label: "Home language",
    cell: ({ p }) => p.enrolment?.homeLanguage || "—",
    sort: ({ p }) => p.enrolment?.homeLanguage || null,
  },
  {
    id: "employer",
    label: "Employer",
    cell: ({ p }) => p.enrolment?.employer || "—",
    sort: ({ p }) => p.enrolment?.employer || null,
  },
  {
    id: "docs",
    label: "POE documents",
    cell: ({ p, docs }) => (p.role === "Learner" ? `${docs} / ${POE_TOTAL}` : "—"),
    sort: ({ p, docs }) => (p.role === "Learner" ? docs : null),
  },
  {
    id: "quizScore",
    label: "Quiz score",
    cell: ({ p, stats }) =>
      p.role !== "Learner"
        ? "—"
        : !stats
          ? "…"
          : `${stats.questionsBest} / ${stats.questionsTotal} (${stats.overallPct}%)`,
    sort: ({ p, stats }) => (p.role !== "Learner" || !stats ? null : stats.overallPct),
  },
  {
    id: "quizzes",
    label: "Quizzes competent",
    cell: ({ p, stats }) =>
      p.role !== "Learner"
        ? "—"
        : !stats
          ? "…"
          : `${stats.quizCompetent} of ${stats.quizCount} (${stats.quizAttempted} attempted)`,
    sort: ({ p, stats }) => (p.role !== "Learner" || !stats ? null : stats.quizCompetent),
  },
  {
    id: "lastLogin",
    label: "Last login",
    cell: ({ p }) => (p.lastLogin ? fmtDateTime(p.lastLogin) : "never"),
    sort: ({ p }) => (p.lastLogin ? Date.parse(p.lastLogin) : null),
  },
  {
    id: "joined",
    label: "Joined",
    cell: ({ p }) => fmtDate(p.createdAt),
    sort: ({ p }) => Date.parse(p.createdAt),
  },
];

const SUMMARY_COLS_KEY = "itss.summaryCols";
const DEFAULT_SUMMARY_COLS = ["name", "role", "qualification", "quizScore", "quizzes"];

function loadSummaryCols(): string[] {
  try {
    const raw = localStorage.getItem(SUMMARY_COLS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      const valid = arr.filter((id) => SUMMARY_COLS.some((c) => c.id === id));
      if (valid.length) return valid;
    }
  } catch {
    /* corrupted — fall back to defaults */
  }
  return DEFAULT_SUMMARY_COLS;
}

/** Staff-only summary table of everyone, with a pick-your-columns control. */
function PeopleSummary({
  people,
  cloud,
  remoteIds,
  navigate,
}: {
  people: Profile[];
  cloud: CloudDirectory | null;
  remoteIds: Set<string>;
  navigate: (r: Route) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState<string[]>(loadSummaryCols);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cloudStats, setCloudStats] = useState<Record<string, QuizStats>>({});
  const [sortBy, setSortBy] = useState<{ col: string; dir: 1 | -1 } | null>(null);

  const needScores = cols.includes("quizScore") || cols.includes("quizzes");

  useEffect(() => {
    if (!open || !needScores) return;
    let alive = true;
    for (const p of people) {
      if (p.role !== "Learner" || !remoteIds.has(p.id) || cloudStats[p.id]) continue;
      const owner = cloud?.owners[p.id];
      if (!owner) {
        setCloudStats((s) => ({ ...s, [p.id]: quizStats({ units: {} }) }));
        continue;
      }
      void fetchCloudProgress(owner, p.id).then((prog) => {
        if (alive)
          setCloudStats((s) => ({ ...s, [p.id]: quizStats(prog ?? { units: {} }) }));
      });
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, needScores, people, cloud, remoteIds]);

  function toggleCol(id: string) {
    setCols((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      localStorage.setItem(SUMMARY_COLS_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!open)
    return (
      <button className="btn ghost" style={{ marginBottom: 14 }} onClick={() => setOpen(true)}>
        <Icon name="chart" size={15} />
        Summary table
      </button>
    );

  const active = SUMMARY_COLS.filter((c) => cols.includes(c.id));

  // build row contexts once so we can sort by any column's value
  const rows: SummaryRowCtx[] = people.map((p) => {
    const isRemote = remoteIds.has(p.id);
    const docs = isRemote
      ? poeItemCount(cloud?.poe[p.id] ?? {})
      : poeItemCount(loadPoeDocs(p.id));
    const stats =
      p.role !== "Learner" || !needScores
        ? null
        : isRemote
          ? (cloudStats[p.id] ?? null)
          : quizStats(loadProgress(p.id));
    return { p, docs, stats };
  });

  const sortCol = sortBy ? active.find((c) => c.id === sortBy.col) : undefined;
  if (sortBy && sortCol) {
    rows.sort((a, b) => {
      const va = sortCol.sort(a);
      const vb = sortCol.sort(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1; // missing values always last
      if (vb === null) return -1;
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { sensitivity: "base", numeric: true });
      return cmp * sortBy.dir;
    });
  }

  function clickHeader(id: string) {
    setSortBy((prev) =>
      prev?.col === id ? { col: id, dir: prev.dir === 1 ? -1 : 1 } : { col: id, dir: 1 }
    );
  }

  return (
    <div className="card summary-card" style={{ marginBottom: 14 }}>
      <div className="summary-toolbar">
        <div className="task-label" style={{ margin: 0 }}>
          Summary — {people.length} {people.length === 1 ? "person" : "people"}
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost" onClick={() => setPickerOpen((v) => !v)}>
          <Icon name="settings" size={15} />
          Choose fields ({active.length})
        </button>
        <button className="btn ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      {pickerOpen && (
        <div className="summary-fields">
          {SUMMARY_COLS.map((c) => (
            <label key={c.id} className="summary-field">
              <input
                type="checkbox"
                checked={cols.includes(c.id)}
                onChange={() => toggleCol(c.id)}
              />
              {c.label}
            </label>
          ))}
        </div>
      )}

      {active.length === 0 ? (
        <p className="muted" style={{ margin: "10px 0 0" }}>
          No fields selected — choose at least one field above.
        </p>
      ) : (
        <div className="summary-scroll">
          <table className="data">
            <thead>
              <tr>
                {active.map((c) => (
                  <th
                    key={c.id}
                    className="sortable"
                    title={`Sort by ${c.label.toLowerCase()}`}
                    aria-sort={
                      sortBy?.col === c.id
                        ? sortBy.dir === 1
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    onClick={() => clickHeader(c.id)}
                  >
                    {c.label}
                    {sortBy?.col === c.id && (
                      <span className="sort-arrow">{sortBy.dir === 1 ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((ctx) => (
                <tr
                  key={ctx.p.id}
                  className="summary-row"
                  onClick={() => navigate({ page: "students", studentId: ctx.p.id })}
                >
                  {active.map((c) => (
                    <td key={c.id}>{c.cell(ctx)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Full academic record — every quiz and marked exercise with the student's scores. */
function AcademicRecord({
  student,
  remote,
  owner,
}: {
  student: Profile;
  remote?: boolean;
  owner?: string;
}) {
  const [progress, setProgress] = useState<ProgressState | null>(
    remote ? null : loadProgress(student.id)
  );
  useEffect(() => {
    if (!remote) {
      setProgress(loadProgress(student.id));
      return;
    }
    let alive = true;
    setProgress(null);
    if (!owner) {
      setProgress({ units: {} });
      return;
    }
    void fetchCloudProgress(owner, student.id).then((p) => {
      if (alive) setProgress(p ?? { units: {} });
    });
    return () => {
      alive = false;
    };
  }, [student.id, remote, owner]);

  const units = assessedUnits();

  const heading = (
    <h2 className="section-title">
      <span className="ico">
        <Icon name="chart" size={20} />
      </span>
      Academic record — quizzes, exercises &amp; scores
    </h2>
  );

  if (!progress)
    return (
      <>
        {heading}
        <p className="muted">Loading saved scores from the cloud…</p>
      </>
    );

  // overall quiz totals across the whole programme
  const { quizCount, quizAttempted, quizCompetent, questionsBest, questionsTotal, overallPct } =
    quizStats(progress);

  return (
    <>
      {heading}
      <div className="card attempts-card">
        <div className="task-label" style={{ marginTop: 0 }}>
          Overall — across all {quizCount} quizzes
        </div>
        <div className="attempt-row">
          <span className="col-left">
            <Icon
              name={quizCompetent === quizCount && quizCount > 0 ? "checkCircle" : "clipboard"}
              size={17}
              color={
                quizCompetent === quizCount && quizCount > 0 ? "var(--green)" : "var(--ink-3)"
              }
            />
            <span className="sc">
              {questionsBest} / {questionsTotal} questions
            </span>
            <span className={`chip ${overallPct >= 80 ? "done" : "none"}`}>{overallPct}%</span>
            <span className={`chip ${quizCompetent === quizCount && quizCount > 0 ? "done" : "progress"}`}>
              {quizCompetent} of {quizCount} quizzes competent
            </span>
          </span>
          <span className="dt">
            {quizAttempted} of {quizCount} attempted
          </span>
        </div>
      </div>

      {units.map(({ unit, content }) => {
        const prog = progress.units[unit.us];
        const named = content?.quizzes ?? [];
        const quizRows = named.length
          ? named.map((qz) => ({
              key: qz.id,
              label: qz.title,
              totalQuestions: qz.questions.length,
              result: prog?.quizzes?.[qz.id],
            }))
          : content?.quiz.length
            ? [
                {
                  key: "quiz",
                  label: "Knowledge check",
                  totalQuestions: content.quiz.length,
                  result: prog?.quiz,
                },
              ]
            : [];
        const exercises = (content?.exercises ?? []).filter((e) => e.checks);
        return (
          <div className="card attempts-card" key={unit.us}>
            <div className="task-label" style={{ marginTop: 0 }}>
              US {unit.us} — {unit.title}
            </div>
            {quizRows.map((row) => {
              const r = row.result;
              const pct = r ? Math.round((r.best / r.total) * 100) : null;
              const latest = r?.history?.[0]?.date;
              return (
                <div className="attempt-row acad" key={row.key}>
                  <Icon
                    name={pct !== null && pct >= 80 ? "checkCircle" : "clipboard"}
                    size={17}
                    color={pct !== null && pct >= 80 ? "var(--green)" : "var(--ink-3)"}
                  />
                  <span className="sc">{row.label}</span>
                  <span className="cell">
                    {r ? (
                      <span className={`chip ${pct !== null && pct >= 80 ? "done" : "none"}`}>
                        {r.best}/{r.total} · {pct}%
                      </span>
                    ) : (
                      <span className="chip none">not attempted</span>
                    )}
                  </span>
                  <span className="cell">
                    {r ? (
                      <span className="chip progress">
                        {r.attempts} attempt{r.attempts === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                  <span className="dt">{latest ? fmtDateTime(latest) : `${row.totalQuestions} questions`}</span>
                </div>
              );
            })}
            {exercises.map((ex) => {
              const r = prog?.exercises?.[ex.id];
              const pct = r ? Math.round((r.best / r.total) * 100) : null;
              return (
                <div className="attempt-row acad" key={ex.id}>
                  <Icon
                    name={pct !== null && pct >= 80 ? "checkCircle" : "design"}
                    size={17}
                    color={pct !== null && pct >= 80 ? "var(--green)" : "var(--ink-3)"}
                  />
                  <span className="sc">Exercise — {ex.title}</span>
                  <span className="cell">
                    {r ? (
                      <span className={`chip ${pct !== null && pct >= 80 ? "done" : "none"}`}>
                        {r.best}/{r.total} marks · {pct}%
                      </span>
                    ) : (
                      <span className="chip none">not attempted</span>
                    )}
                  </span>
                  <span className="cell">
                    {r ? (
                      <span className="chip progress">
                        {r.attempts} attempt{r.attempts === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                  <span className="dt">{r ? `last score ${r.last}/${r.total}` : ""}</span>
                </div>
              );
            })}
            {quizRows.length === 0 && exercises.length === 0 && (
              <p className="muted" style={{ margin: 0 }}>
                No marked work in this unit.
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

function StudentDetail({
  student,
  viewer,
  navigate,
  onChanged,
  remote,
  owner,
  cloudDocs,
}: {
  student: Profile;
  viewer: Profile;
  navigate: (r: Route) => void;
  onChanged: () => void;
  /** profile belongs to another sign-in account — edits are written to their cloud rows */
  remote?: boolean;
  owner?: string;
  cloudDocs?: Record<string, PoeDoc>;
}) {
  const isSuper = viewer.role === "Super User";
  const staffViewer = isStaff(viewer.role);
  const { docs: localDocs } = usePoe(student.id);
  const docs = remote ? (cloudDocs ?? {}) : localDocs;
  const canManage = isSuper;
  const [editingEnrol, setEditingEnrol] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [draft, setDraft] = useState<EnrolmentInfo>({ ...EMPTY_ENROLMENT, ...student.enrolment });
  const uploaded = POE_SECTIONS.flatMap((sec) =>
    sec.items.flatMap((item) =>
      Object.entries(docs)
        .filter(([k]) => k === item.id || k.startsWith(`${item.id}__`))
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([key, doc]) => ({ sec, item, key, doc }))
    )
  );

  /** Routes profile changes to the local store, or to the owning account's cloud rows. */
  async function patchStudent(patch: Partial<Profile>): Promise<boolean> {
    if (remote) {
      if (!owner) return false;
      const err = await updateCloudProfile(owner, student.id, patch);
      if (err) {
        setAlertMsg(err);
        return false;
      }
    } else {
      updateProfile(student.id, patch);
    }
    onChanged();
    return true;
  }

  async function saveEnrol(e: React.FormEvent) {
    e.preventDefault();
    const okSave = await patchStudent({
      enrolment: { ...draft, signedDate: new Date().toISOString() },
    });
    if (okSave) setEditingEnrol(false);
  }

  async function removeUser() {
    setConfirmDelete(false);
    if (remote) {
      if (!owner) return;
      const err = await deleteCloudProfile(owner, student.id);
      if (err) {
        setAlertMsg(err);
        return;
      }
    } else {
      deleteProfile(student.id);
    }
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

      {remote && staffViewer && (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>
            This user signs in with their own account — changes you save here are written to their
            cloud storage and reach them the next time the app loads on their device.
          </span>
        </div>
      )}

      {canManage && (
        <AdminPanel student={student} onPatch={patchStudent} onDelete={() => setConfirmDelete(true)} />
      )}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="clipboard" size={20} />
        </span>
        Biographical enrolment information
        {canManage && !editingEnrol && (
          <button
            className="btn ghost profile-edit"
            style={{ marginRight: 23 }} /* align with the Delete user button inside the card above */
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
        <EnrolmentDetails enrolment={student.enrolment} redact={!staffViewer} />
      ) : (
        <div className="callout">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>This {student.role === "Learner" ? "student" : "user"} has not completed the biographical enrolment form yet.</span>
        </div>
      )}

      {staffViewer && (
        <>
          <AcademicRecord student={student} remote={remote} owner={owner} />
          <h2 className="section-title">
            <span className="ico">
              <Icon name="folder" size={20} />
            </span>
            Uploaded documents — {poeItemCount(docs)} / {POE_TOTAL} items · {uploaded.length}{" "}
            {uploaded.length === 1 ? "file" : "files"}
          </h2>
          {uploaded.length === 0 ? (
            <div className="callout">
              <span className="ico">
                <Icon name="info" size={19} />
              </span>
              <span>No documents uploaded yet.</span>
            </div>
          ) : (
            uploaded.map(({ sec, item, key, doc }) => (
              <div className="plan-upload-row" key={key}>
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
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this user?"
          message={
            <>
              Delete <strong>{student.name}</strong>'s account and all their saved progress,
              documents and notes? This cannot be undone.
            </>
          }
          confirmLabel="Delete user"
          danger
          onConfirm={() => void removeUser()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg("")} />}
    </>
  );
}
