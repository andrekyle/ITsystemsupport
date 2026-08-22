import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Icon } from "../icons";
import type { EnrolmentInfo, PoeDoc, Profile, ProgressState, Role, Route } from "../types";
import { isStaff } from "../types";
import { COURSE_META, MODULES, POE_SECTIONS, POE_TOTAL, usLabel } from "../data/course";
import { getContent } from "../data/content";
import {
  assertNoDuplicateProfile,
  createProfile,
  deleteProfile,
  DuplicateProfileError,
  hashPassword,
  loadPoeDocs,
  loadProfiles,
  loadProgress,
  poeItemCount,
  unitCompletion,
  unitProgress,
  updateProfile,
  useOutcomes,
  usePoe,
  useSharedSettings,
} from "../store";
import { logAudit } from "../lib/audit";
import { openOnboardingPack } from "../lib/onboarding";
import { mailtoLink, outlookComposeLink, teamsChatLink } from "../lib/integrations";
import { VerdictSwitch } from "../components/VerdictSwitch";
import { Avatar } from "../components/Avatar";
import { EMPTY_ENROLMENT, EnrolmentDetails, EnrolmentForm } from "../components/EnrolmentForm";
import { AlertModal, ConfirmModal, PromptModal } from "../components/Modal";
import { downloadDoc, getFileBlob } from "../lib/files";
import { fileToSignature } from "../lib/signature";
import { cloudEnabled, makeHeadlessClient } from "../lib/supabase";
import { updateRegisterSignatures } from "./Attendance";
import {
  deleteCloudProfile,
  fetchCloudDirectory,
  fetchCloudProgress,
  identityKeys,
  mergeProfileWithCloud,
  purgeOwnProfileCopy,
  resolveCloudLink,
  updateCloudProfile,
  type CloudDirectory,
} from "../lib/directory";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** True when `a` is a strictly newer ISO login timestamp than `b`. */
function newerLogin(a: string | undefined, b: string | undefined): boolean {
  if (!a) return false;
  if (!b) return true;
  return Date.parse(a) > Date.parse(b);
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

type LastOnlineKey = "onlineNow" | "today" | "yesterday" | "thisWeek" | "inactive" | "never";

function lastOnlineState(lastLogin?: string): { key: LastOnlineKey; label: string; tone: "done" | "progress" | "none" } {
  if (!lastLogin) return { key: "never", label: "Never", tone: "none" };
  const t = Date.parse(lastLogin);
  if (!Number.isFinite(t)) return { key: "never", label: "Never", tone: "none" };
  const now = new Date();
  if (now.getTime() - t <= 10 * 60 * 1000) return { key: "onlineNow", label: "Online now", tone: "done" };
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t >= startOfToday) return { key: "today", label: "Active today", tone: "progress" };
  if (t >= startOfToday - 24 * 60 * 60 * 1000) return { key: "yesterday", label: "Active yesterday", tone: "progress" };
  if (now.getTime() - t <= 7 * 24 * 60 * 60 * 1000) return { key: "thisWeek", label: "Active this week", tone: "progress" };
  return { key: "inactive", label: "Inactive", tone: "none" };
}

/** Everyone (learners included) can see who is currently online. */
function OnlineNow({ people, viewer }: { people: Profile[]; viewer: Profile }) {
  // Re-render every 30s so the "online now" 10-minute window rolls forward
  // even if the cloud directory hasn't refreshed yet.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30 * 1000);
    return () => window.clearInterval(t);
  }, []);
  // the signed-in viewer is online by definition, even if their stored
  // lastLogin timestamp has aged past the online-now window
  const everyone = people.some((p) => p.id === viewer.id) ? people : [viewer, ...people];
  const states = everyone.map((p) => ({
    p,
    state:
      p.id === viewer.id
        ? ({ key: "onlineNow", label: "Online now", tone: "done" } as const)
        : lastOnlineState(p.lastLogin),
  }));
  const online = states.filter((s) => s.state.key === "onlineNow");
  const footParts = [
    { count: states.filter((s) => s.state.key === "today").length, text: "active earlier today" },
    { count: states.filter((s) => s.state.key === "yesterday").length, text: "active yesterday" },
    { count: states.filter((s) => s.state.key === "thisWeek").length, text: "active this week" },
  ]
    .filter((p) => p.count > 0)
    .map((p) => `${p.count} ${p.text}`);
  return (
    <div className="card online-now">
      <div className="online-now-head">
        <span className="online-dot" aria-hidden="true" />
        Who's online
        <span className="online-count">{online.length} online now</span>
      </div>
      <div className="online-people">
        {online.map(({ p }) => (
          <span key={p.id} className="online-person">
            <Avatar profile={p} size={24} />
            {p.name}
            {p.id === viewer.id ? " (you)" : ""}
          </span>
        ))}
      </div>
      {footParts.length > 0 && <div className="online-now-foot">{footParts.join(" · ")}</div>}
    </div>
  );
}

function ProfileHead({ profile }: { profile: Profile }) {
  return (
    <div className="card profile-head">
      <Avatar profile={profile} size={96} />
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
  const [sharedSettings] = useSharedSettings();
  const [draft, setDraft] = useState<EnrolmentInfo>({
    ...EMPTY_ENROLMENT,
    ...profile.enrolment,
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    // If the learner filled in first names + surname, keep the top-level
    // profile name in sync so avatars, sidebars, chats and lists match.
    const nextEnrol = { ...draft, signedDate: new Date().toISOString() };
    const derived = [nextEnrol.firstNames?.trim(), nextEnrol.surname?.trim()]
      .filter(Boolean)
      .join(" ");
    const patch: Partial<Profile> = { enrolment: nextEnrol };
    if (derived && derived !== profile.name) patch.name = derived;
    onUpdateProfile(patch);
    logAudit(profile, "enrolment.saved", "Updated own biographical enrolment information");
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

      <div className="contact-row">
        <button
          className="btn ghost sm"
          title="Your printable onboarding pack — welcome letter, calendar, document checklist, POE guide"
          onClick={() =>
            openOnboardingPack(profile, {
              supportEmail: sharedSettings.supportEmail,
              teamsUrl: sharedSettings.teamsUrl,
            })
          }
        >
          <Icon name="document" size={15} /> My onboarding pack
        </button>
      </div>

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
          <Icon name="design" size={20} />
        </span>
        My signature
      </h2>
      <SignatureEditor profile={profile} onUpdateProfile={onUpdateProfile} />

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

/** Upload / replace the handwritten signature — can be redone any number of times. */
function SignatureEditor({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      setPreview(await fileToSignature(file));
    } catch {
      setError("Could not read that image — try a clear photo of your signature.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function save() {
    if (!preview) return;
    onUpdateProfile({ signatureImage: preview, signatureAsked: true });
    // pull the new signature through to every register this learner signed
    void updateRegisterSignatures(profile.id, preview);
    setPreview(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card profile-enrol-card">
      {profile.signatureImage && !preview ? (
        <div className="sig-current">
          <img src={profile.signatureImage} alt="Your signature" />
        </div>
      ) : !preview ? (
        <p className="muted" style={{ margin: "0 0 10px" }}>
          No signature on record yet. Sign your usual signature on a{" "}
          <strong>white piece of paper</strong>, take a clear photo of it and upload it here — it
          is used to sign the attendance register.
        </p>
      ) : null}

      {preview && (
        <div className="sig-current preview">
          <div className="task-label" style={{ marginTop: 0 }}>
            New signature — preview
          </div>
          <img src={preview} alt="New signature preview" />
        </div>
      )}

      <div className="pw-row" style={{ alignItems: "center" }}>
        <label className="btn ghost sm" style={{ cursor: "pointer" }}>
          <Icon name="folder" size={15} />
          {profile.signatureImage || preview ? "Choose a new photo" : "Choose photo of my signature"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        {preview && (
          <>
            <button className="btn sm" type="button" onClick={save}>
              <Icon name="checkCircle" size={15} />
              {profile.signatureImage ? "Replace signature" : "Save signature"}
            </button>
            <button className="btn ghost sm" type="button" onClick={() => setPreview(null)}>
              Cancel
            </button>
          </>
        )}
      </div>

      {busy && <p className="muted" style={{ margin: "8px 0 0" }}>Cleaning up the photo…</p>}
      {error && <p className="muted" style={{ margin: "8px 0 0", color: "var(--red, #c42b1c)" }}>{error}</p>}
      {saved && <p className="muted" style={{ margin: "8px 0 0" }}>Signature saved — updated on every register you have signed.</p>}
      {profile.signatureImage && !preview && (
        <p className="muted" style={{ margin: "8px 0 0" }}>
          You can replace your signature as many times as you like — the new one pulls through to
          every attendance register you have signed, past sessions included.
        </p>
      )}
    </div>
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
    let timer: number | undefined;
    const load = () => {
      void fetchCloudDirectory().then((d) => {
        if (alive && d) setCloud(d);
      });
    };
    load();
    // Refresh periodically so that other learners' lastLogin timestamps stay
    // fresh — otherwise a user who signs in *after* this page opened would
    // still appear offline until the viewer navigated away and back.
    timer = window.setInterval(load, 30 * 1000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      if (timer !== undefined) window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [rev]);
  const localRaw = loadProfiles();
  const cloudProfiles = cloud?.profiles ?? [];
  // Build a cloud-side lookup for cross-account status. A learner's own
  // account stamps `lastLogin` in *its* cloud row; without merging, the
  // super-user's local copy of the same profile (which never gets stamped)
  // would win and the learner would keep showing as "Never". Index by every
  // identity token because the local and cloud copies may have different
  // enrolment completeness (e.g. no ID number locally).
  const cloudById = new Map(cloudProfiles.map((p) => [p.id, p] as const));
  const cloudByKey = new Map<string, Profile>();
  for (const p of cloudProfiles) {
    for (const key of identityKeys(p)) {
      const cur = cloudByKey.get(key);
      if (!cur || newerLogin(p.lastLogin, cur.lastLogin)) cloudByKey.set(key, p);
    }
  }
  const findCloudMatch = (p: Profile): Profile | undefined => {
    const byId = cloudById.get(p.id);
    if (byId) return byId;
    for (const key of identityKeys(p)) {
      const hit = cloudByKey.get(key);
      if (hit) return hit;
    }
    return undefined;
  };
  const mergeFromCloud = (p: Profile): Profile => {
    const match = findCloudMatch(p);
    if (!match) return p;
    const patch: Partial<Profile> = {};
    if (newerLogin(match.lastLogin, p.lastLogin)) patch.lastLogin = match.lastLogin;
    if (!p.avatar && match.avatar) patch.avatar = match.avatar;
    return Object.keys(patch).length ? { ...p, ...patch } : p;
  };
  const local = localRaw.map(mergeFromCloud);
  const localIds = new Set(local.map((p) => p.id));
  // Filter out cloud copies that already appear locally (by id or any
  // identity token) so the same person doesn't show as two rows.
  const localKeys = new Set<string>();
  for (const p of local) for (const k of identityKeys(p)) localKeys.add(k);
  const remote = cloudProfiles.filter(
    (p) => !localIds.has(p.id) && !identityKeys(p).some((k) => localKeys.has(k))
  );
  // Collapse duplicate cloud entries (same identity, different ids) — keep
  // the one with the newest lastLogin so learners who accidentally signed
  // up twice show as a single "Active today" row instead of two.
  const dedupedRemote: Profile[] = [];
  const remoteChosen = new Map<string, Profile>();
  for (const p of remote) {
    const keys = identityKeys(p);
    const existingKey = keys.find((k) => remoteChosen.has(k));
    if (!existingKey) {
      for (const k of keys) remoteChosen.set(k, p);
      dedupedRemote.push(p);
    } else {
      const cur = remoteChosen.get(existingKey)!;
      if (newerLogin(p.lastLogin, cur.lastLogin)) {
        const idx = dedupedRemote.indexOf(cur);
        if (idx >= 0) dedupedRemote[idx] = p;
        for (const k of identityKeys(cur)) if (remoteChosen.get(k) === cur) remoteChosen.delete(k);
        for (const k of keys) remoteChosen.set(k, p);
      }
    }
  }
  const remoteIds = new Set(dedupedRemote.map((p) => p.id));
  const all = [...local, ...dedupedRemote];
  // Super Users manage every account; facilitators see their learners;
  // learners see the enrolled learner list (read-only)
  const people = (
    isSuper
      ? all.filter((p) => p.id !== profile.id)
      : all.filter((p) => p.role === "Learner")
  ).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const student = route.studentId ? all.find((p) => p.id === route.studentId) : undefined;

  if (student && (isPrivileged || student.role === "Learner")) {
    // Identity-aware link so a locally-seeded profile still finds its owner
    // in the cloud even when the local seed id differs from the cloud id.
    const link = resolveCloudLink(student, cloud);
    const isRemote = remoteIds.has(student.id);
    const cloudProfileId = link?.cloudId ?? student.id;
    return (
      <StudentDetail
        student={student}
        viewer={profile}
        navigate={navigate}
        onChanged={refresh}
        remote={isRemote}
        owner={link?.owner ?? cloud?.owners[student.id]}
        cloudProfileId={cloudProfileId}
        cloudDocs={cloud?.poe[cloudProfileId]}
      />
    );
  }

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

      {isSuper && <AddUser viewer={profile} onAdded={refresh} />}

      {isSuper && (
        <DownloadAllAssignments
          learners={people.filter((p) => p.role === "Learner")}
          remoteIds={remoteIds}
          owners={cloud?.owners ?? {}}
          cloudProfiles={cloud?.profiles ?? []}
        />
      )}

      {people.length > 0 && <OnlineNow people={people} viewer={profile} />}

      {isPrivileged && people.length > 0 && (
        <PeopleSummary people={people} viewer={profile} cloud={cloud} remoteIds={remoteIds} navigate={navigate} />
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
        const link = resolveCloudLink(s, cloud);
        const cloudId = link?.cloudId ?? s.id;
        const displayed = mergeProfileWithCloud(s, cloud);
        const localCount = isRemote ? 0 : poeItemCount(loadPoeDocs(s.id));
        const cloudCount = poeItemCount(cloud?.poe[cloudId] ?? {});
        const docs = isRemote ? cloudCount : localCount || cloudCount;
        const online = lastOnlineState(displayed.lastLogin);
        const hasOwnCloudAccount = !!link || isRemote;
        return (
          <button
            key={s.id}
            className="profile-row"
            onClick={() => navigate({ page: "students", studentId: s.id })}
          >
            <Avatar profile={displayed} />
            <span>
              <span className="nm">{displayed.name}</span>
              <br />
              <span className="rl">
                {displayed.role}
                {" · last online "}
                <span className={`chip ${online.tone}`}>{online.label}</span>
                {displayed.lastLogin ? ` (${fmtDateTime(displayed.lastLogin)})` : ""}
              {" · joined "}
              {fmtDate(displayed.createdAt)}
              {isPrivileged && hasOwnCloudAccount ? " · own sign-in account" : ""}
              {isPrivileged && displayed.role === "Learner" && !displayed.enrolment ? " · enrolment form outstanding" : ""}
              {isPrivileged && displayed.passwordHash ? " · password set" : ""}
              </span>
            </span>
            <span className="rl docs">
              {isPrivileged && displayed.role === "Learner" ? `${docs} / ${POE_TOTAL} documents` : ""}
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

function AddUser({ viewer, onAdded }: { viewer: Profile; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Learner");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      // Duplicate check against local + cloud so a second copy of a real
      // learner never gets created here.
      const local = loadProfiles();
      let candidates: Profile[] = local;
      try {
        const dir = await fetchCloudDirectory();
        if (dir) {
          const seen = new Set(local.map((p) => p.id));
          candidates = [...local, ...dir.profiles.filter((p) => !seen.has(p.id))];
        }
      } catch {
        /* offline / RLS: local check still enforced */
      }
      try {
        assertNoDuplicateProfile(candidates, { name });
      } catch (err) {
        if (err instanceof DuplicateProfileError) {
          setError(err.message);
          return;
        }
        throw err;
      }

      // Provision a real Supabase auth account so the learner appears in the
      // dashboard and can sign in with their own credentials from any device.
      // A headless client keeps the admin's own session untouched.
      let cloudNotice = "";
      let cloudUserId: string | undefined;
      const trimmedEmail = email.trim().toLowerCase();
      if (cloudEnabled && trimmedEmail) {
        const password = pw.trim() || generateTempPassword();
        const headless = makeHeadlessClient();
        if (headless) {
          const { data, error: signUpErr } = await headless.auth.signUp({
            email: trimmedEmail,
            password,
          });
          if (signUpErr) {
            const msg = signUpErr.message.toLowerCase();
            if (msg.includes("already registered") || msg.includes("already been registered")) {
              cloudNotice =
                " An account with this email already exists in Supabase — this local profile is linked to it.";
            } else {
              setError(`Could not create the Supabase account: ${signUpErr.message}`);
              return;
            }
          } else if (!data.session) {
            cloudNotice =
              ` Sign-up email sent to ${trimmedEmail} — the learner must confirm it before signing in.`;
            cloudUserId = data.user?.id;
          } else {
            cloudNotice = ` Supabase account created for ${trimmedEmail}.`;
            cloudUserId = data.user?.id;
          }
        }
      }

      // Build the local profile with the email baked into enrolment so later
      // sign-ups match by identity.
      const enrolment = trimmedEmail
        ? ({ ...EMPTY_ENROLMENT, email: trimmedEmail } as EnrolmentInfo)
        : undefined;
      const created = createProfile(
        name,
        role,
        enrolment,
        pw ? await hashPassword(pw) : undefined
      );
      // stamp the resolved auth uid on the profile so chat can address them
      // immediately even before they sign in for the first time
      if (cloudUserId) {
        updateProfile(created.id, { cloudUserId });
      }
      logAudit(viewer, "account.create", `Added ${role} account via People → Add User`, {
        id: created.id,
        name: created.name,
      });

      setName("");
      setEmail("");
      setRole("Learner");
      setPw("");
      if (cloudNotice) setNotice(cloudNotice.trim());
      else setOpen(false);
      onAdded();
    } finally {
      setBusy(false);
    }
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
        <div className="field" style={{ flex: 2, marginBottom: 0 }}>
          <label htmlFor="au-em">Email address</label>
          <input
            id="au-em"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={cloudEnabled ? "learner@example.co.za" : "(cloud not configured)"}
            required={cloudEnabled}
            disabled={!cloudEnabled}
          />
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
        <button className="btn" type="submit" disabled={busy}>
          <Icon name="checkCircle" size={15} />
          {busy ? "Creating…" : "Create"}
        </button>
        <button className="btn ghost" type="button" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
      <p className="muted" style={{ margin: "8px 0 0" }}>
        {cloudEnabled
          ? "A Supabase account is created for the email address so the learner can sign in from any device. Leave the password blank to auto-generate a temporary one — email confirmation may still be required."
          : "Learners added here can complete their biographical enrolment form from “My profile” after their first sign-in."}
      </p>
      {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
      {notice && (
        <div className="callout" style={{ marginTop: 8 }}>
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>{notice}</span>
        </div>
      )}
    </form>
  );
}

/** Random URL-safe password used when the admin doesn't set one at Add User time. */
function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(36)).join("").slice(0, 14);
}

function AdminPanel({
  student,
  onPatch,
  onDelete,
  onRemoveLocal,
}: {
  student: Profile;
  onPatch: (patch: Partial<Profile>) => Promise<boolean>;
  onDelete: () => void;
  /** present when this device holds a local copy — removes only that copy */
  onRemoveLocal?: () => void;
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
          {onRemoveLocal && (
            <button
              className="btn ghost sm"
              type="button"
              onClick={onRemoveLocal}
              title="Remove the copy stored on this device only — their cloud account is not touched"
            >
              Remove from this device
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

/* ---------- assignment export (single learner and whole cohort) ---------- */

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ASSIGNMENT_DOC_CSS = `
  body{font-family:Segoe UI,Arial,sans-serif;max-width:820px;margin:32px auto;padding:0 20px;color:#1c2430}
  h1{margin-bottom:2px} .sub{color:#5c6774;margin-top:0}
  section{margin-top:30px;border-top:2px solid #d8dee6;padding-top:12px}
  h2{font-size:17px} h3{margin:18px 0 2px;font-size:15px}
  .marks{color:#5c6774;margin:2px 0 10px;font-size:13px}
  .q{margin:0 0 12px}
  .q-head{font-size:12px;color:#5c6774;text-transform:uppercase;letter-spacing:.4px}
  .q-text{font-weight:600;margin:2px 0 4px}
  .answer{white-space:pre-wrap;background:#f4f6f8;padding:8px 12px;border-radius:4px}
  .answer.ok{background:#f0f8f2}
  .learner-head{margin-top:48px;padding-top:20px;border-top:3px solid #1c2430}
  .learner-head h1{font-size:22px}
  .learner-head:first-of-type{margin-top:20px;padding-top:0;border-top:none}
  @media print{
    body{margin:10mm auto}
    .learner-head{break-before:page;border-top:none}
    .learner-head:first-of-type{break-before:auto}
  }
`;

/* side navigation for the all-learners export */
const ASSIGNMENT_NAV_CSS = `
  body{padding-left:210px}
  .learner-nav{position:fixed;left:0;top:0;bottom:0;width:200px;background:#fafafa;border-right:1px solid #d8dee6;padding:16px 10px 16px 14px;overflow-y:auto}
  .learner-nav .nav-title{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5c6774;margin:0 0 10px 6px}
  .learner-nav a{display:block;font-size:12.5px;font-weight:600;color:#1c2430;text-decoration:none;border-radius:6px;padding:7px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .learner-nav a:hover{background:#eef1f4}
  .learner-nav a.empty{color:#9aa5b1;font-weight:500}
  .learner-head{scroll-margin-top:16px}
  @media(max-width:900px){body{padding-left:0}.learner-nav{display:none}}
  @media print{body{padding-left:0}.learner-nav{display:none}}
`;

/** Every exercise/assignment a learner has worked on — typed answers with
 *  marks — as printable HTML section blocks (one per unit standard). */
function assignmentUnitBlocks(prog: ProgressState): string[] {
  const unitBlocks: string[] = [];
  for (const { unit, content } of assessedUnits()) {
    if (!content?.exercises.length) continue;
    const up = prog.units[unit.us];
    const lb = up?.logbook ?? {};
    const exBlocks: string[] = [];
    for (const ex of content.exercises) {
      if (!ex.checks?.length) continue;
      const answers = ex.steps
        .map((step, i) => ({
          step,
          text: String(lb[`exq.${ex.id}.${i}`] ?? "").trim(),
          ok: lb[`exq.${ex.id}.${i}.ok`] === true,
          check: ex.checks?.[i],
        }))
        .filter((a) => a.check);
      const res = up?.exercises?.[ex.id];
      if (!res && answers.every((a) => !a.text)) continue; // not started
      const qHtml = answers
        .map(
          (a, i) => `
        <div class="q">
          <div class="q-head">Question ${i + 1} — ${a.ok ? "✓ correct" : "not yet correct"}</div>
          <div class="q-text">${escHtml(a.step)}</div>
          <div class="answer${a.ok ? " ok" : ""}">${a.text ? escHtml(a.text) : "<em>No answer typed</em>"}</div>
        </div>`
        )
        .join("");
      exBlocks.push(`
      <div class="exercise">
        <h3>${escHtml(ex.title)}</h3>
        <p class="marks">${
          res
            ? `Best ${res.best}/${res.total} marks · last attempt ${res.last}/${res.total} · ${res.attempts} attempt${res.attempts === 1 ? "" : "s"} of 3`
            : "Saved answers — not yet submitted for marking"
        }</p>${qHtml}
      </div>`);
    }
    if (exBlocks.length)
      unitBlocks.push(`
    <section>
      <h2>${escHtml(usLabel(unit.us))} — ${escHtml(unit.title)}</h2>${exBlocks.join("")}
    </section>`);
  }
  return unitBlocks;
}

function exportTimestamp(): string {
  return new Date().toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Super-user bulk export: every learner's completed assignments in one file. */
function DownloadAllAssignments({
  learners,
  remoteIds,
  owners,
  cloudProfiles,
}: {
  learners: Profile[];
  remoteIds: Set<string>;
  owners: Record<string, string>;
  cloudProfiles: Profile[];
}) {
  const [busy, setBusy] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  async function downloadAll() {
    setBusy(true);
    try {
      const sections: string[] = [];
      const navLinks: string[] = [];
      let withWork = 0;
      for (let i = 0; i < learners.length; i++) {
        const s = learners[i];
        setProgressMsg(`Preparing… ${i + 1}/${learners.length}`);
        let prog: ProgressState | null;
        // Resolve the learner's cloud identity so even a locally-seeded profile
        // (different local/cloud ids) picks up their real progress.
        const link = resolveCloudLink(s, { profiles: cloudProfiles, poe: {}, owners });
        if (remoteIds.has(s.id)) {
          const owner = link?.owner ?? owners[s.id];
          const cloudId = link?.cloudId ?? s.id;
          prog = owner ? await fetchCloudProgress(owner, cloudId) : null;
        } else {
          prog = loadProgress(s.id);
          if (Object.keys(prog.units).length === 0 && link) {
            prog = (await fetchCloudProgress(link.owner, link.cloudId)) ?? prog;
          }
        }
        const blocks = prog ? assignmentUnitBlocks(prog) : [];
        if (blocks.length) withWork++;
        navLinks.push(
          `<a href="#learner-${i}"${blocks.length ? "" : ' class="empty" title="No saved answers yet"'}>${escHtml(s.name)}</a>`
        );
        sections.push(`
  <div class="learner-head" id="learner-${i}"><h1>${escHtml(s.name)}</h1></div>
  ${blocks.length ? blocks.join("") : `<p><em>${prog ? "No assignment or exercise answers have been saved yet." : "Saved answers could not be fetched from the cloud."}</em></p>`}`);
      }
      const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Completed assignments — all learners</title>
<style>${ASSIGNMENT_DOC_CSS}${ASSIGNMENT_NAV_CSS}</style></head><body>
<nav class="learner-nav" aria-label="Jump to learner"><div class="nav-title">Learners</div>
${navLinks.join("\n")}
</nav>
<h1>Completed assignments — all learners</h1>
<p class="sub">System Support NQF Level 5 Learnership · ${learners.length} learners (${withWork} with saved answers) · exported ${escHtml(exportTimestamp())} by the super user</p>
${sections.join("")}
</body></html>`;
      downloadHtmlFile("Assignments — all learners.html", html);
    } finally {
      setBusy(false);
      setProgressMsg("");
    }
  }

  return (
    <button
      className="btn ghost"
      style={{ margin: "0 0 14px" }}
      onClick={() => void downloadAll()}
      disabled={busy || learners.length === 0}
      title="Download every learner's completed assignment and exercise answers as one printable file"
    >
      <Icon name="download" size={15} />
      {busy ? progressMsg || "Preparing…" : "Download all assignments"}
    </button>
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
    cell: ({ p }) => {
      const state = lastOnlineState(p.lastLogin);
      return (
        <span className="summary-login-cell">
          <span className={`chip ${state.tone}`}>{state.label}</span>
          <span className="summary-login-time">{p.lastLogin ? fmtDateTime(p.lastLogin) : "No sign-in yet"}</span>
        </span>
      );
    },
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
  viewer,
  cloud,
  remoteIds,
  navigate,
}: {
  people: Profile[];
  viewer: Profile;
  cloud: CloudDirectory | null;
  remoteIds: Set<string>;
  navigate: (r: Route) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState<string[]>(loadSummaryCols);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cloudStats, setCloudStats] = useState<Record<string, QuizStats>>({});
  const [sortBy, setSortBy] = useState<{ col: string; dir: 1 | -1 } | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | "all">("Learner");

  const needScores = cols.includes("quizScore") || cols.includes("quizzes");

  useEffect(() => {
    if (!open || !needScores) return;
    let alive = true;
    for (const p of people) {
      if (p.role !== "Learner" || cloudStats[p.id]) continue;
      const isRemote = remoteIds.has(p.id);
      if (!isRemote && Object.keys(loadProgress(p.id).units).length > 0) continue;
      const link = resolveCloudLink(p, cloud);
      const owner = link?.owner ?? cloud?.owners[p.id];
      const cloudId = link?.cloudId ?? p.id;
      if (!owner) {
        if (isRemote) setCloudStats((s) => ({ ...s, [p.id]: quizStats({ units: {} }) }));
        continue;
      }
      void fetchCloudProgress(owner, cloudId).then((prog) => {
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
  const hasActiveFilters = roleFilter !== "Learner";

  function genderBucket(p: Profile): "male" | "female" | "other" | "notSet" {
    const raw = p.enrolment?.gender?.trim().toLowerCase();
    if (!raw) return "notSet";
    if (raw === "male") return "male";
    if (raw === "female") return "female";
    return "other";
  }

  const filteredPeople = people.filter((p) => {
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    return true;
  });

  // build row contexts once so we can sort by any column's value
  const rows: SummaryRowCtx[] = filteredPeople.map((p) => {
    const isRemote = remoteIds.has(p.id);
    const link = resolveCloudLink(p, cloud);
    const cloudId = link?.cloudId ?? p.id;
    const localDocs = isRemote ? {} : loadPoeDocs(p.id);
    const docs = isRemote
      ? poeItemCount(cloud?.poe[cloudId] ?? {})
      : poeItemCount(
          Object.keys(localDocs).length > 0 ? localDocs : (cloud?.poe[cloudId] ?? localDocs)
        );
    const localProg = isRemote ? null : loadProgress(p.id);
    const stats =
      p.role !== "Learner" || !needScores
        ? null
        : isRemote
          ? (cloudStats[p.id] ?? null)
          : localProg && Object.keys(localProg.units).length > 0
            ? quizStats(localProg)
            : (cloudStats[p.id] ?? quizStats(localProg ?? { units: {} }));
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

  const selectedIds = new Set(active.map((c) => c.id));
  const learnerRows = rows.filter((ctx) => ctx.p.role === "Learner");
  const learnerCount = learnerRows.length;
  const staffCount = rows.length - learnerCount;
  const maleCount = rows.filter((ctx) => genderBucket(ctx.p) === "male").length;
  const femaleCount = rows.filter((ctx) => genderBucket(ctx.p) === "female").length;
  const otherGenderCount = rows.filter((ctx) => genderBucket(ctx.p) === "other").length;
  const noGenderCount = rows.filter((ctx) => genderBucket(ctx.p) === "notSet").length;
  const ageValues = rows
    .map((ctx) => Number(ctx.p.enrolment?.age))
    .filter((n) => Number.isFinite(n) && n > 0);
  const docsValues = learnerRows.map((ctx) => ctx.docs);
  const scoreValues = learnerRows
    .map((ctx) => ctx.stats?.overallPct)
    .filter((v): v is number => typeof v === "number");
  const quizCompetenceRates = learnerRows
    .map((ctx) => {
      if (!ctx.stats || !ctx.stats.quizCount) return null;
      return Math.round((ctx.stats.quizCompetent / ctx.stats.quizCount) * 100);
    })
    .filter((v): v is number => typeof v === "number");
  // Online states count everyone (viewer included, always online) regardless
  // of the role filter — "who is online" is a live stat of the whole system,
  // not a property of the filtered set.
  const everyone = people.some((p) => p.id === viewer.id) ? people : [viewer, ...people];
  const onlineStateCounts = everyone.reduce(
    (acc, p) => {
      const state = p.id === viewer.id ? "onlineNow" : lastOnlineState(p.lastLogin).key;
      acc[state] += 1;
      return acc;
    },
    { onlineNow: 0, today: 0, yesterday: 0, thisWeek: 0, inactive: 0, never: 0 } as Record<LastOnlineKey, number>
  );
  const joinedTimes = rows.map((ctx) => Date.parse(ctx.p.createdAt)).filter((t) => Number.isFinite(t));

  const textFieldWidgets: Array<{ id: string; label: string; getter: (ctx: SummaryRowCtx) => string }> = [
    { id: "idNumber", label: "ID numbers on record", getter: (ctx) => ctx.p.enrolment?.idNumber ?? "" },
    {
      id: "qualification",
      label: "Qualifications on record",
      getter: (ctx) => ctx.p.enrolment?.highestQualification ?? "",
    },
    { id: "email", label: "Emails on record", getter: (ctx) => ctx.p.enrolment?.email ?? "" },
    { id: "cellphone", label: "Cellphones on record", getter: (ctx) => ctx.p.enrolment?.cellphone ?? "" },
    { id: "language", label: "Home languages on record", getter: (ctx) => ctx.p.enrolment?.homeLanguage ?? "" },
    { id: "employer", label: "Employers on record", getter: (ctx) => ctx.p.enrolment?.employer ?? "" },
  ];

  const widgets: Array<{ key: string; value: string | number; label: string; icon: string }> = [
    {
      key: "visible-users",
      value: rows.length,
      label: `Visible users (${learnerCount} learners)`,
      icon: "people",
    },
  ];

  if (selectedIds.has("role")) {
    widgets.push(
      { key: "learners", value: learnerCount, label: "Learners", icon: "person" },
      { key: "staff", value: staffCount, label: "Staff roles", icon: "shield" }
    );
  }
  if (selectedIds.has("gender")) {
    widgets.push(
      { key: "male", value: maleCount, label: "Male", icon: "person" },
      { key: "female", value: femaleCount, label: "Female", icon: "person" },
      {
        key: "other-gender",
        value: otherGenderCount + noGenderCount,
        label: "Other / not set",
        icon: "person",
      }
    );
  }
  if (selectedIds.has("age")) {
    widgets.push(
      {
        key: "youngest-age",
        value: ageValues.length ? `${Math.min(...ageValues)}` : "—",
        label: "Youngest age",
        icon: "calendar",
      },
      {
        key: "oldest-age",
        value: ageValues.length ? `${Math.max(...ageValues)}` : "—",
        label: "Oldest age",
        icon: "calendar",
      }
    );
  }
  if (selectedIds.has("docs")) {
    const avgDocs = docsValues.length ? (docsValues.reduce((a, b) => a + b, 0) / docsValues.length).toFixed(1) : "0";
    const fullDocs = docsValues.filter((d) => d >= POE_TOTAL).length;
    widgets.push(
      { key: "avg-docs", value: avgDocs, label: "Avg POE docs per learner", icon: "folder" },
      { key: "full-docs", value: fullDocs, label: `Learners with all ${POE_TOTAL} docs`, icon: "checkCircle" }
    );
  }
  if (selectedIds.has("quizScore")) {
    const avgScore = scoreValues.length
      ? `${Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)}%`
      : "—";
    widgets.push({ key: "avg-quiz-score", value: avgScore, label: "Average quiz score", icon: "chart" });
  }
  if (selectedIds.has("quizzes")) {
    const avgCompetence = quizCompetenceRates.length
      ? `${Math.round(quizCompetenceRates.reduce((a, b) => a + b, 0) / quizCompetenceRates.length)}%`
      : "—";
    widgets.push({
      key: "avg-quiz-competence",
      value: avgCompetence,
      label: "Average quiz competence",
      icon: "award",
    });
  }
  widgets.push(
    { key: "online-now", value: onlineStateCounts.onlineNow, label: "Online now", icon: "clock" },
    { key: "active-today", value: onlineStateCounts.today, label: "Active today", icon: "clock" },
    { key: "active-yesterday", value: onlineStateCounts.yesterday, label: "Active yesterday", icon: "clock" },
    { key: "active-week", value: onlineStateCounts.thisWeek, label: "Active this week", icon: "clock" },
    { key: "inactive", value: onlineStateCounts.inactive, label: "Inactive", icon: "clock" },
    { key: "never-login", value: onlineStateCounts.never, label: "Never logged in", icon: "clock" }
  );
  if (selectedIds.has("joined")) {
    const newest = joinedTimes.length ? fmtDate(new Date(Math.max(...joinedTimes)).toISOString()) : "—";
    const oldest = joinedTimes.length ? fmtDate(new Date(Math.min(...joinedTimes)).toISOString()) : "—";
    widgets.push(
      { key: "newest-join", value: newest, label: "Newest join date", icon: "calendar" },
      { key: "oldest-join", value: oldest, label: "Oldest join date", icon: "calendar" }
    );
  }
  for (const field of textFieldWidgets) {
    if (!selectedIds.has(field.id)) continue;
    const filled = rows.filter((ctx) => field.getter(ctx).trim()).length;
    widgets.push({
      key: `filled-${field.id}`,
      value: `${filled} / ${rows.length}`,
      label: field.label,
      icon: "checkCircle",
    });
  }

  return (
    <div className="card summary-card" style={{ marginBottom: 14 }}>
      <div className="summary-toolbar">
        <div className="task-label" style={{ margin: 0 }}>
          Summary — {rows.length} of {people.length} {people.length === 1 ? "person" : "people"}
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn ghost summary-btn" onClick={() => setPickerOpen((v) => !v)}>
          <Icon name="settings" size={15} />
          Choose fields ({active.length})
        </button>
        <button className="btn ghost summary-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="summary-filters">
        <label className="summary-filter">
          <span>Role</span>
          <span className="summary-select-wrap">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "all")}>
              <option value="all">All roles</option>
              <option value="Learner">Learner</option>
              <option value="Facilitator">Facilitator</option>
              <option value="Assessor">Assessor</option>
              <option value="Moderator">Moderator</option>
              <option value="Super User">Super User</option>
            </select>
          </span>
        </label>
        {hasActiveFilters && (
          <button
            className="btn ghost sm summary-btn summary-clear"
            type="button"
            onClick={() => {
              setRoleFilter("Learner");
            }}
          >
            <Icon name="filter" size={15} />
            Clear filters
          </button>
        )}
      </div>

      <div className="summary-widgets">
        {widgets.map((w) => (
          <div key={w.key} className="card stat-card summary-widget">
            <span className="ico">
              <Icon name={w.icon} size={20} />
            </span>
            <div>
              <div className="num">{w.value}</div>
              <div className="lbl">{w.label}</div>
            </div>
          </div>
        ))}
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
      ) : rows.length === 0 ? (
        <p className="muted" style={{ margin: "10px 0 0" }}>
          No users match the selected filters.
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
  cloudProfileId,
  canDownload,
}: {
  student: Profile;
  remote?: boolean;
  owner?: string;
  /** identity-matched profile id in the owner's cloud account */
  cloudProfileId?: string;
  /** super user only — shows the completed-assignments download */
  canDownload?: boolean;
}) {
  const [progress, setProgress] = useState<ProgressState | null>(
    remote ? null : loadProgress(student.id)
  );
  useEffect(() => {
    const local = remote ? null : loadProgress(student.id);
    if (local && Object.keys(local.units).length > 0) {
      setProgress(local);
      return;
    }
    if (!owner) {
      setProgress(local ?? { units: {} });
      return;
    }
    let alive = true;
    setProgress(remote ? null : local);
    void fetchCloudProgress(owner, cloudProfileId ?? student.id).then((p) => {
      if (!alive) return;
      setProgress(p && Object.keys(p.units).length > 0 ? p : (local ?? { units: {} }));
    });
    return () => {
      alive = false;
    };
  }, [student.id, remote, owner, cloudProfileId]);

  const units = assessedUnits();

  /** Export every exercise/assignment the learner has worked on — their typed
   *  answers with marks — as a single printable HTML file. */
  function downloadAssignments(prog: ProgressState) {
    const unitBlocks = assignmentUnitBlocks(prog);
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Completed assignments — ${escHtml(student.name)}</title>
<style>${ASSIGNMENT_DOC_CSS}</style></head><body>
<h1>Completed assignments — ${escHtml(student.name)}</h1>
<p class="sub">System Support NQF Level 5 Learnership · exported ${escHtml(exportTimestamp())} by the super user</p>
${unitBlocks.length ? unitBlocks.join("") : "<p><em>No assignment or exercise answers have been saved yet.</em></p>"}
</body></html>`;
    downloadHtmlFile(`Assignments — ${student.name}.html`, html);
  }

  const hasWork =
    !!progress &&
    units.some(({ unit, content }) => {
      const up = progress.units[unit.us];
      if (!up) return false;
      if (up.exercises && Object.keys(up.exercises).length) return true;
      return !!content?.exercises.some((ex) =>
        (ex.checks ?? []).some((_, i) => String(up.logbook?.[`exq.${ex.id}.${i}`] ?? "").trim())
      );
    });

  const heading = (
    <h2 className="section-title">
      <span className="ico">
        <Icon name="chart" size={20} />
      </span>
      Academic record — quizzes, exercises &amp; scores
      {canDownload && progress && (
        <button
          className="btn ghost profile-edit"
          onClick={() => downloadAssignments(progress)}
          disabled={!hasWork}
          title={
            hasWork
              ? "Download all completed assignment and exercise answers with marks"
              : "No assignment answers saved yet"
          }
        >
          <Icon name="download" size={15} />
          Download completed assignments
        </button>
      )}
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
        // Logbook project upload (stored as a JSON PoeDoc under project.upload)
        let logbookDoc: PoeDoc | null = null;
        {
          const raw = prog?.logbook?.["project.upload"];
          if (typeof raw === "string" && raw) {
            try {
              const parsed = JSON.parse(raw) as PoeDoc;
              if (parsed && parsed.name) logbookDoc = parsed;
            } catch {
              /* older/corrupt value — ignore */
            }
          }
        }
        return (
          <div className="card attempts-card" key={unit.us}>
            <div className="task-label" style={{ marginTop: 0 }}>
              {usLabel(unit.us)} — {unit.title}
            </div>
            {quizRows.map((row) => {
              const r = row.result;
              const pct = r ? Math.round((r.best / r.total) * 100) : null;
              const latest = r?.history?.[0]?.date;
              // Look up the quiz's question set so we can render it below.
              const quiz =
                row.key === "quiz"
                  ? content?.quiz
                  : content?.quizzes?.find((q) => q.id === row.key)?.questions;
              return (
                <details className="exercise-answers" key={row.key}>
                  <summary className="attempt-row acad">
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
                  </summary>
                  <QuizAnswers
                    questions={quiz ?? []}
                    result={r}
                    picks={prog?.logbook?.[`quiz.${row.key}.picks`]}
                  />
                </details>
              );
            })}
            {exercises.map((ex) => {
              const r = prog?.exercises?.[ex.id];
              const pct = r ? Math.round((r.best / r.total) * 100) : null;
              const lb = prog?.logbook ?? {};
              const typedAny = ex.checks?.some((_, i) => String(lb[`exq.${ex.id}.${i}`] ?? "").trim());
              return (
                <details key={ex.id} className="exercise-answers">
                  <summary className="attempt-row acad">
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
                    <span className="dt">
                      {r ? `last score ${r.last}/${r.total}` : typedAny ? "draft in logbook" : ""}
                    </span>
                  </summary>
                  <ExerciseAnswers exercise={ex} logbook={lb} />
                </details>
              );
            })}
            {logbookDoc && (
              <div className="attempt-row acad">
                <Icon name="folder" size={17} color="var(--green)" />
                <span className="sc">Logbook project — uploaded report</span>
                <span className="cell">
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => void downloadDoc(logbookDoc!)}
                    title="Download this learner's uploaded logbook report"
                  >
                    <Icon name="download" size={13} /> {logbookDoc.name}
                  </button>
                </span>
                <span className="cell">
                  <span className="chip done">submitted</span>
                </span>
                <span className="dt">{logbookDoc.uploadedAt ? fmtDateTime(logbookDoc.uploadedAt) : ""}</span>
              </div>
            )}
            {quizRows.length === 0 && exercises.length === 0 && !logbookDoc && (
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

/** Inline view of a quiz's questions with the correct answer(s), the
 *  learner's picks (when available), and attempt history. Persisted picks
 *  come from `progress.units[us].logbook['quiz.<id>.picks']` — for older
 *  attempts made before we saved picks, only questions + correct answers
 *  are shown. */
function QuizAnswers({
  questions,
  result,
  picks,
}: {
  questions: import("../types").QuizQuestion[];
  result?: { best: number; total: number; attempts: number; history?: { score: number; total: number; date: string }[] };
  picks?: unknown;
}) {
  let parsedPicks: Record<number, { kind: string; picks?: number[] }> | null = null;
  if (typeof picks === "string") {
    try {
      const raw = JSON.parse(picks);
      if (raw && typeof raw === "object") {
        parsedPicks = raw as Record<number, { kind: string; picks?: number[] }>;
      }
    } catch {
      parsedPicks = null;
    }
  }
  if (questions.length === 0) {
    return (
      <p className="muted" style={{ margin: "6px 0 0 32px", fontSize: 12.5 }}>
        Quiz questions are not available.
      </p>
    );
  }
  return (
    <div className="exercise-answer-list">
      {result?.history && result.history.length > 0 && (
        <div className="quiz-history">
          <span className="mini-note">Attempt history: </span>
          {result.history.map((h, i) => (
            <span className="chip progress" key={i} style={{ marginRight: 6 }}>
              {new Date(h.date).toLocaleDateString()} · {h.score}/{h.total}
            </span>
          ))}
        </div>
      )}
      {questions.map((q, qi) => {
        const correct = q.answers ?? [q.answer];
        const pick = parsedPicks ? parsedPicks[qi] : undefined;
        const chosen: number[] =
          pick && pick.kind === "choice" && Array.isArray(pick.picks) ? pick.picks : [];
        return (
          <div className="exercise-answer" key={qi}>
            <div className="exercise-answer-head">
              <span className="mini-note">Question {qi + 1}</span>
            </div>
            <div className="exercise-answer-q">{q.q}</div>
            {q.kind === "choice" || !q.kind ? (
              <div className="quiz-options">
                {q.options.map((opt, oi) => {
                  const isCorrect = correct.includes(oi);
                  const isPicked = chosen.includes(oi);
                  let cls = "quiz-option";
                  if (isCorrect) cls += " correct";
                  if (isPicked && !isCorrect) cls += " wrong-pick";
                  if (isPicked && isCorrect) cls += " right-pick";
                  return (
                    <div className={cls} key={oi}>
                      <span className="quiz-mark">
                        {isCorrect ? "✓" : isPicked ? "✗" : ""}
                      </span>
                      {String.fromCharCode(65 + oi)}. {opt}
                      {isPicked && (
                        <span className="mini-note" style={{ marginLeft: 6 }}>
                          (learner's pick)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mini-note" style={{ marginTop: 4 }}>
                {q.kind === "order" ? "Ordering question" : "Matching question"} — see quiz for
                full detail.
              </p>
            )}
            {q.explain && (
              <p className="mini-note" style={{ marginTop: 6 }}>
                {q.explain}
              </p>
            )}
          </div>
        );
      })}
      {!parsedPicks && result && (
        <p className="mini-note" style={{ marginLeft: 12 }}>
          Only the overall score is available for this attempt — the learner's individual picks
          were not recorded on that attempt.
        </p>
      )}
    </div>
  );
}

/** Inline view of a learner's typed answers to an exercise's questions,
 *  with the marker's verdict pulled straight from their logbook. Used inside
 *  the AcademicRecord expandable row so staff can drill into any exercise
 *  without leaving the profile page. */
function ExerciseAnswers({
  exercise,
  logbook,
}: {
  exercise: { id: string; title: string; steps: string[]; checks?: unknown[] };
  logbook: Record<string, unknown>;
}) {
  const rows = (exercise.checks ?? []).map((_, i) => {
    const key = `exq.${exercise.id}.${i}`;
    const text = String(logbook[key] ?? "").trim();
    const ok = logbook[`${key}.ok`] === true;
    return { i, step: exercise.steps[i] ?? "", text, ok };
  });
  const anyTyped = rows.some((r) => r.text);
  if (!anyTyped) {
    return (
      <p className="muted" style={{ margin: "6px 0 0 32px", fontSize: 12.5 }}>
        No answers typed yet.
      </p>
    );
  }
  return (
    <div className="exercise-answer-list">
      {rows.map((r) => (
        <div className="exercise-answer" key={r.i}>
          <div className="exercise-answer-head">
            <span className={`chip ${r.ok ? "done" : "none"}`}>
              {r.ok ? "✓ correct" : r.text ? "not yet" : "no answer"}
            </span>
            <span className="mini-note">Question {r.i + 1}</span>
          </div>
          <div className="exercise-answer-q">{r.step}</div>
          {r.text ? (
            <div className={`exercise-answer-body${r.ok ? " ok" : ""}`}>{r.text}</div>
          ) : (
            <div className="mini-note" style={{ marginTop: 4 }}>
              No answer typed
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StudentDetail({
  student,
  viewer,
  navigate,
  onChanged,
  remote,
  owner,
  cloudProfileId,
  cloudDocs,
}: {
  student: Profile;
  viewer: Profile;
  navigate: (r: Route) => void;
  onChanged: () => void;
  /** profile belongs to another sign-in account — edits are written to their cloud rows */
  remote?: boolean;
  owner?: string;
  /** identity-matched profile id in the owner's cloud account (may differ from student.id) */
  cloudProfileId?: string;
  cloudDocs?: Record<string, PoeDoc>;
}) {
  const isSuper = viewer.role === "Super User";
  const staffViewer = isStaff(viewer.role);
  const canRecordOutcomes =
    isSuper || viewer.role === "Assessor" || viewer.role === "Moderator";
  const [sharedSettings] = useSharedSettings();
  const { docs: localDocs } = usePoe(student.id);
  // For remote profiles cloudDocs is authoritative; for locally-seeded copies
  // that also have an owning cloud account we fall back to cloud when local
  // is empty, so uploaded documents show up in the profile view.
  const hasLocalDocs = Object.keys(localDocs).length > 0;
  const docs = remote
    ? (cloudDocs ?? {})
    : hasLocalDocs
      ? localDocs
      : (cloudDocs ?? localDocs);
  const canManage = isSuper;
  const [editingEnrol, setEditingEnrol] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLocal, setConfirmLocal] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [zipping, setZipping] = useState(false);
  const [draft, setDraft] = useState<EnrolmentInfo>({ ...EMPTY_ENROLMENT, ...student.enrolment });
  const uploaded = POE_SECTIONS.flatMap((sec) =>
    sec.items.flatMap((item) =>
      Object.entries(docs)
        .filter(([k]) => k === item.id || k.startsWith(`${item.id}__`))
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([key, doc]) => ({ sec, item, key, doc }))
    )
  );

  /** Bundle every uploaded POE document into a single ZIP, foldered by section. */
  async function downloadPortfolio() {
    setZipping(true);
    try {
      const zip = new JSZip();
      const clean = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim();
      const perItem = new Map<string, number>();
      let added = 0;
      for (const { sec, item, doc } of uploaded) {
        const blob = await getFileBlob(doc);
        if (!blob) continue;
        const n = (perItem.get(item.id) ?? 0) + 1;
        perItem.set(item.id, n);
        const suffix = n > 1 ? ` (${n})` : "";
        zip.file(
          `${clean(sec.heading)}/${clean(item.label).slice(0, 80)}${suffix} — ${clean(doc.name)}`,
          blob
        );
        added++;
      }
      if (!added) {
        setAlertMsg("None of the documents could be fetched — check your connection and try again.");
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `POE — ${student.name}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setAlertMsg("The portfolio could not be downloaded — check your connection and try again.");
    } finally {
      setZipping(false);
    }
  }

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
    // audit trail for account administration
    const target = { id: student.id, name: student.name };
    if (patch.role && patch.role !== student.role) {
      logAudit(viewer, "account.role", `Changed role from ${student.role} to ${patch.role}`, target);
    }
    if ("passwordHash" in patch) {
      logAudit(
        viewer,
        "account.password",
        patch.passwordHash ? "Set a new password" : "Removed the password",
        target
      );
    }
    if (patch.enrolment) {
      logAudit(viewer, "enrolment.saved", "Updated biographical enrolment information", target);
    }
    onChanged();
    return true;
  }

  async function saveEnrol(e: React.FormEvent) {
    e.preventDefault();
    const nextEnrol = { ...draft, signedDate: new Date().toISOString() };
    const derived = [nextEnrol.firstNames?.trim(), nextEnrol.surname?.trim()]
      .filter(Boolean)
      .join(" ");
    const patch: Partial<Profile> = { enrolment: nextEnrol };
    if (derived && derived !== student.name) patch.name = derived;
    const okSave = await patchStudent(patch);
    if (okSave) setEditingEnrol(false);
  }

  /** Local-only removal: deletes this device's copy of the profile and its
   *  data. Never touches the person's own cloud account rows, so their real
   *  profile stays intact. */
  async function removeLocalCopy() {
    setConfirmLocal(false);
    // 1. wipe local storage first
    deleteProfile(student.id);
    // 2. purge directly from *this* account's cloud snapshot — bypasses the
    //    600ms debounce so the removal cannot lose a race against navigation.
    const err = await purgeOwnProfileCopy(student.id);
    if (err) {
      setAlertMsg(
        `Removed from this device, but the cloud sync failed: ${err} — the profile may reappear on the next sign-in.`
      );
      return;
    }
    logAudit(viewer, "account.delete", "Removed the local copy of this profile from this device", {
      id: student.id,
      name: student.name,
    });
    navigate({ page: "students" });
    onChanged();
  }

  async function removeUser() {
    setConfirmDelete(false);
    // Sweep out every duplicate copy of this person across all cloud rows —
    // when a learner has signed up more than once (e.g. on two devices), a
    // single-row delete just gets resurrected by the other device's next
    // sync. Match by any identity token so different ids for the same person
    // still get cleaned up.
    const targetKeys = new Set(identityKeys(student));
    try {
      const dir = await fetchCloudDirectory();
      if (dir) {
        const seen = new Set<string>();
        for (const p of dir.profiles) {
          if (seen.has(p.id)) continue;
          const matches =
            p.id === student.id ||
            identityKeys(p).some((k) => targetKeys.has(k));
          if (!matches) continue;
          const own = dir.owners[p.id];
          if (!own) continue;
          seen.add(p.id);
          const err = await deleteCloudProfile(own, p.id);
          if (err) {
            setAlertMsg(err);
            return;
          }
        }
      }
    } catch {
      /* offline / RLS: fall through to id-based delete below */
    }
    // Also handle the primary row (may be this account's own local copy or a
    // cloud row that fetchCloudDirectory skipped because it's ours).
    if (remote) {
      if (owner) {
        const err = await deleteCloudProfile(owner, student.id);
        if (err) {
          setAlertMsg(err);
          return;
        }
      }
    } else {
      deleteProfile(student.id);
    }
    // And drop any local copies that share the identity (protects against
    // this account having accidentally stored a duplicate itself).
    for (const p of loadProfiles()) {
      if (p.id === student.id) continue;
      if (identityKeys(p).some((k) => targetKeys.has(k))) deleteProfile(p.id);
    }
    logAudit(viewer, "account.delete", `Deleted the account and all its data`, {
      id: student.id,
      name: student.name,
    });
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

      {staffViewer && (
        <div className="contact-row">
          <button
            className="btn ghost sm"
            title="Printable onboarding pack — welcome letter, calendar, document checklist, POE guide"
            onClick={() => {
              openOnboardingPack(student, {
                supportEmail: sharedSettings.supportEmail,
                teamsUrl: sharedSettings.teamsUrl,
              });
            }}
          >
            <Icon name="document" size={15} /> Onboarding pack
          </button>
          {student.enrolment?.email && (
            <>
              <a
                className="btn ghost sm"
                href={mailtoLink(
                  student.enrolment.email,
                  `${COURSE_META.title} — message from ${viewer.name}`
                )}
                title={`Email ${student.enrolment.email} with your default mail app`}
              >
                <Icon name="document" size={15} /> Email
              </a>
              <a
                className="btn ghost sm"
                href={outlookComposeLink(
                  student.enrolment.email,
                  `${COURSE_META.title} — message from ${viewer.name}`
                )}
                target="_blank"
                rel="noreferrer"
                title={`Email ${student.enrolment.email} via Outlook on the web (needs a signed-in Microsoft 365 account with a mailbox)`}
              >
                <Icon name="globe" size={15} /> Email (Outlook web)
              </a>
              <a
                className="btn ghost sm"
                href={teamsChatLink(student.enrolment.email)}
                target="_blank"
                rel="noreferrer"
                title="Open a Microsoft Teams chat"
              >
                <Icon name="chat" size={15} /> Teams chat
              </a>
            </>
          )}
        </div>
      )}

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
        <AdminPanel
          student={student}
          onPatch={patchStudent}
          onDelete={() => setConfirmDelete(true)}
          onRemoveLocal={!remote ? () => setConfirmLocal(true) : undefined}
        />
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
          <AcademicRecord
            student={student}
            remote={remote}
            owner={owner}
            cloudProfileId={cloudProfileId}
            canDownload={isSuper}
          />
          {student.role === "Learner" && canRecordOutcomes && (
            <OutcomesPanel
              student={student}
              viewer={viewer}
              remote={remote}
              owner={owner}
              cloudProfileId={cloudProfileId}
              cloudDocs={cloudDocs}
            />
          )}
          <h2 className="section-title">
            <span className="ico">
              <Icon name="folder" size={20} />
            </span>
            Uploaded documents — {poeItemCount(docs)} / {POE_TOTAL} items · {uploaded.length}{" "}
            {uploaded.length === 1 ? "file" : "files"}
            {isSuper && uploaded.length > 0 && (
              <button
                className="btn ghost profile-edit"
                onClick={() => void downloadPortfolio()}
                disabled={zipping}
                title="Download every uploaded document as a single ZIP"
              >
                <Icon name="download" size={15} />
                {zipping ? "Preparing ZIP…" : "Download portfolio (ZIP)"}
              </button>
            )}
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

      {confirmLocal && (
        <ConfirmModal
          title="Remove from this device?"
          message={
            <>
              Remove the copy of <strong>{student.name}</strong> stored on this device (profile,
              progress, documents and notes kept under your account)? Their own cloud account and
              real profile are <strong>not</strong> affected.
            </>
          }
          confirmLabel="Remove local copy"
          onConfirm={() => void removeLocalCopy()}
          onCancel={() => setConfirmLocal(false)}
        />
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

/* ---------- unit assessment outcomes (assessor / moderator / super user) ---------- */

function OutcomesPanel({
  student,
  viewer,
  remote,
  owner,
  cloudProfileId,
  cloudDocs,
}: {
  student: Profile;
  viewer: Profile;
  /** profile belongs to another sign-in account — progress lives in their cloud rows */
  remote?: boolean;
  owner?: string;
  /** identity-matched profile id in the owner's cloud account */
  cloudProfileId?: string;
  /** POE docs for this learner from the cloud directory (staff-side view) */
  cloudDocs?: Record<string, PoeDoc>;
}) {
  const { outcomes, setOutcome, clearOutcome } = useOutcomes();
  const [progress, setProgress] = useState<ProgressState>(() =>
    remote ? { units: {} } : loadProgress(student.id)
  );
  useEffect(() => {
    const local = remote ? { units: {} } : loadProgress(student.id);
    setProgress(local);
    if (!owner || Object.keys(local.units).length > 0) return;
    let alive = true;
    void fetchCloudProgress(owner, cloudProfileId ?? student.id).then((p) => {
      if (alive && p && Object.keys(p.units).length > 0) setProgress(p);
    });
    return () => {
      alive = false;
    };
  }, [student.id, remote, owner, cloudProfileId]);
  // POE docs — cloud copy for remote students, local for people on this device.
  const poe = remote ? (cloudDocs ?? {}) : loadPoeDocs(student.id);
  const forLearner = outcomes[student.id] ?? {};
  const recorded = Object.keys(forLearner).length;
  const competent = Object.values(forLearner).filter((o) => o.status === "C").length;
  const [nycUnit, setNycUnit] = useState<string | null>(null);

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="award" size={20} />
        </span>
        Assessment outcomes — {recorded} recorded, {competent} competent
      </h2>
      <div className="card" style={{ overflowX: "auto" }}>
        <p className="muted" style={{ margin: "0 0 10px" }}>
          Record the formal assessor decision per unit standard. Learners see their outcome on the
          Compliance page; outcomes feed the statement of results and certification checks.
        </p>
        <table className="data outcome-table">
          <thead>
            <tr>
              <th>Unit standard</th>
              <th>Progress</th>
              <th>Outcome</th>
              <th>Recorded by</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.flatMap((m) => m.units).map((u) => {
              const o = forLearner[u.us];
              const pct = Math.round(unitProgress(progress, u.us, poe) * 100);
              return (
                <tr key={u.us}>
                  <td>
                    <strong>{usLabel(u.us)}</strong>
                    <div className="mini-note">{u.title.slice(0, 70)}</div>
                  </td>
                  <td>{pct}%</td>
                  <td>
                    {o ? (
                      <span className={`status-chip ${o.status === "C" ? "ok" : "bad"}`}>
                        {o.status === "C" ? "Competent" : "Not yet competent"}
                      </span>
                    ) : (
                      <span className="status-chip info">Pending</span>
                    )}
                    {o?.note && <div className="mini-note">“{o.note}”</div>}
                  </td>
                  <td>
                    {o ? (
                      <>
                        {o.by}
                        <div className="mini-note">{new Date(o.at).toLocaleDateString()}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <VerdictSwitch
                      value={o ? (o.status === "C" ? "yes" : "no") : null}
                      yesLabel="Competent"
                      noLabel="Not yet"
                      yesTitle="Record this unit as Competent"
                      noTitle="Record as Not Yet Competent — you can add feedback for the learner"
                      onYes={() => {
                        setOutcome(viewer, student.id, u.us, "C");
                        logAudit(viewer, "outcome.set", `Recorded US ${u.us} outcome: Competent`, {
                          id: student.id,
                          name: student.name,
                        });
                      }}
                      onNo={() => setNycUnit(u.us)}
                      onClear={() => clearOutcome(student.id, u.us)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {nycUnit && (
        <PromptModal
          title="Not yet competent"
          message="Feedback / remediation required (optional)?"
          confirmLabel="Record outcome"
          onSubmit={(note) => {
            setOutcome(viewer, student.id, nycUnit, "NYC", note.trim() || undefined);
            logAudit(viewer, "outcome.set", `Recorded US ${nycUnit} outcome: Not Yet Competent`, {
              id: student.id,
              name: student.name,
            });
            setNycUnit(null);
          }}
          onCancel={() => setNycUnit(null)}
        />
      )}
    </>
  );
}
