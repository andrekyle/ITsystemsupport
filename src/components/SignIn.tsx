import { useEffect, useState } from "react";
import { Icon } from "../icons";
import type { EnrolmentInfo, Profile, Role } from "../types";
import {
  createProfile,
  DuplicateProfileError,
  findDuplicateProfile,
  getLastProfileId,
  hashPassword,
  loadProfiles,
  updateProfile,
} from "../store";
import { COURSE_META } from "../data/course";
import { Avatar } from "./Avatar";
import { EMPTY_ENROLMENT, EnrolmentForm } from "./EnrolmentForm";
import { PasswordInput } from "./PasswordInput";
import { cloudEnabled, supabase } from "../lib/supabase";
import { fetchCloudDirectory } from "../lib/directory";

export function SignIn({ onSignIn }: { onSignIn: (p: Profile) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles());
  const [creating, setCreating] = useState(profiles.length === 0);

  // On a fresh device the cloud sync hydrates `itss.profiles` from Supabase
  // *after* this component has mounted. Without watching for that, the
  // super/existing user is stuck in "create a new account" mode and the
  // submit handler routes them to the enrolment form. Re-read on storage
  // events (fired by sync.ts on hydration) and poll briefly as a safety net.
  useEffect(() => {
    const sync = () => {
      const next = loadProfiles();
      setProfiles((prev) =>
        prev.length === next.length && prev.every((p, i) => p.id === next[i]?.id)
          ? prev
          : next
      );
    };
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "itss.profiles") sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", sync);
    const timer = window.setInterval(sync, 1000);
    // stop polling once we have profiles or after ~15s so cloud hydration
    // has time to land on slow connections without running forever
    const stopper = window.setTimeout(() => window.clearInterval(timer), 15000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", sync);
      window.clearInterval(timer);
      window.clearTimeout(stopper);
    };
  }, []);

  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Learner");
  const [password, setPassword] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrol, setEnrol] = useState<EnrolmentInfo>(EMPTY_ENROLMENT);
  const [authFor, setAuthFor] = useState<Profile | null>(null);
  const [authPw, setAuthPw] = useState("");
  const [authError, setAuthError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [resetError, setResetError] = useState("");
  const [dupError, setDupError] = useState("");

  // If cloud hydration brought profiles in after the "create new" screen
  // opened, drop back to the picker so the user can just click their name.
  useEffect(() => {
    if (profiles.length > 0 && creating && !name.trim() && !enrolling) {
      setCreating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles.length]);

  /** Look for a duplicate across local + cloud profiles. If the person
   *  already has a profile *anywhere*, we adopt it instead of creating a
   *  second one — required so that a learner whose profile the facilitator
   *  seeded via People > Add User can still sign in on their own device.
   *  Returns `{ match, isLocal }` when found, or `undefined` when the name
   *  is free to use. */
  async function findExisting(attempt: { name: string; enrolment?: EnrolmentInfo }) {
    const local = loadProfiles();
    const localDup = findDuplicateProfile(local, attempt);
    if (localDup) return { match: localDup, isLocal: true as const };
    try {
      const dir = await fetchCloudDirectory();
      if (dir) {
        const cloudDup = findDuplicateProfile(dir.profiles, attempt);
        if (cloudDup) return { match: cloudDup, isLocal: false as const };
      }
    } catch {
      /* offline or RLS-restricted: local check is still enforced */
    }
    return undefined;
  }

  /** Write a cloud-only profile into local storage so subsequent sign-ins,
   *  attendance registers and progress are attached to the same identity
   *  across devices. */
  function adoptCloudProfile(p: Profile) {
    const existing = loadProfiles();
    if (!existing.some((q) => q.id === p.id)) {
      const merged = [...existing, p];
      localStorage.setItem("itss.profiles", JSON.stringify(merged));
    }
    setProfiles(loadProfiles());
  }

  function pickProfile(p: Profile) {
    if (p.passwordHash) {
      setAuthFor(p);
      setAuthPw("");
      setAuthError(false);
      setResetting(false);
      setNewPw("");
      setConfirmPw("");
      setResetError("");
    } else {
      onSignIn(p);
    }
  }

  // The account owner (or the last person who used this device) should show
  // at the top of the picker so a super/facilitator with a large list of
  // seeded student profiles doesn't accidentally sign in as a student.
  const rolePriority: Record<Role, number> = {
    "Super User": 0,
    Facilitator: 1,
    Assessor: 2,
    Moderator: 3,
    Learner: 4,
  };
  const lastId = getLastProfileId();
  const orderedProfiles = [...profiles].sort((a, b) => {
    if (a.id === lastId) return -1;
    if (b.id === lastId) return 1;
    const dr = (rolePriority[a.role] ?? 9) - (rolePriority[b.role] ?? 9);
    if (dr !== 0) return dr;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!authFor) return;
    if ((await hashPassword(authPw)) === authFor.passwordHash) {
      onSignIn(authFor);
    } else {
      setAuthError(true);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!authFor) return;
    if (newPw.length < 4) {
      setResetError("Use at least 4 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setResetError("Passwords do not match.");
      return;
    }
    const updated = updateProfile(authFor.id, { passwordHash: await hashPassword(newPw) });
    setProfiles(loadProfiles());
    onSignIn(updated ?? authFor);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setDupError("");
    const existing = await findExisting({ name });
    if (existing) {
      if (!existing.isLocal) adoptCloudProfile(existing.match);
      // A profile already exists for this person — sign them in with it
      // instead of forcing a duplicate. Password prompt handled by pickProfile.
      pickProfile(existing.match);
      return;
    }
    if (role === "Learner") {
      const parts = name.trim().split(/\s+/);
      setEnrol((prev) => ({
        ...prev,
        firstNames: prev.firstNames || parts.slice(0, -1).join(" ") || parts[0],
        surname: prev.surname || (parts.length > 1 ? parts[parts.length - 1] : ""),
      }));
      setEnrolling(true);
      return;
    }
    try {
      const p = createProfile(name, role, undefined, password ? await hashPassword(password) : undefined);
      setProfiles(loadProfiles());
      onSignIn(p);
    } catch (err) {
      if (err instanceof DuplicateProfileError) {
        setDupError(err.message);
        return;
      }
      throw err;
    }
  }

  async function submitEnrolment(e: React.FormEvent) {
    e.preventDefault();
    setDupError("");
    const existing = await findExisting({ name, enrolment: enrol });
    if (existing) {
      if (!existing.isLocal) adoptCloudProfile(existing.match);
      pickProfile(existing.match);
      return;
    }
    try {
      const p = createProfile(
        name,
        role,
        { ...enrol, signedDate: new Date().toISOString() },
        password ? await hashPassword(password) : undefined
      );
      setProfiles(loadProfiles());
      onSignIn(p);
    } catch (err) {
      if (err instanceof DuplicateProfileError) {
        setDupError(err.message);
        return;
      }
      throw err;
    }
  }

  return (
    <div className="gate">
      <div className={`gate-card${enrolling ? " wide" : ""}`}>
        <div className="logo">
          <Icon name="certificate" size={26} />
          ITSS Learn
        </div>
        <h1>
          {authFor
            ? resetting
              ? "Reset your password"
              : "Enter your password"
            : enrolling
              ? "Biographical Enrolment Information"
              : creating
                ? "Create your profile"
                : "Sign in"}
        </h1>
        <p className="sub">
          {authFor
            ? resetting
              ? `Set a new password for ${authFor.name} (${authFor.role}). No email confirmation needed.`
              : `Signing in as ${authFor.name} (${authFor.role}).`
            : enrolling
              ? "Required for first-time enrolment on the learnership. This information is saved to your profile and is visible to you, your facilitator and super users."
              : `${COURSE_META.title} · SAQA ID ${COURSE_META.saqaId} · NQF Level ${COURSE_META.nqfLevel}. Your progress is saved to your profile on this device.`}
        </p>

        {authFor && !resetting && (
          <form onSubmit={submitAuth}>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <PasswordInput
                id="pw"
                value={authPw}
                onChange={(v) => {
                  setAuthPw(v);
                  setAuthError(false);
                }}
                autoComplete="current-password"
                autoFocus
                required
              />
            </div>
            {authError && (
              <p className="auth-error">Incorrect password. Forgot it? Reset it below — no email needed.</p>
            )}
            <button className="btn block" type="submit">
              <Icon name="signout" size={17} style={{ transform: "rotate(180deg)" }} />
              Sign in
            </button>
            <button
              type="button"
              className="linklike block"
              onClick={() => {
                setResetting(true);
                setNewPw("");
                setConfirmPw("");
                setResetError("");
              }}
            >
              Forgot your password?
            </button>
            <div className="divider">or</div>
            <button type="button" className="btn ghost block" onClick={() => setAuthFor(null)}>
              Back to profiles
            </button>
          </form>
        )}

        {authFor && resetting && (
          <form onSubmit={submitReset}>
            <div className="field">
              <label htmlFor="rpw">New password</label>
              <PasswordInput
                id="rpw"
                value={newPw}
                onChange={(v) => {
                  setNewPw(v);
                  setResetError("");
                }}
                autoComplete="new-password"
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label htmlFor="rpw2">Confirm new password</label>
              <PasswordInput
                id="rpw2"
                value={confirmPw}
                onChange={(v) => {
                  setConfirmPw(v);
                  setResetError("");
                }}
                autoComplete="new-password"
                required
              />
            </div>
            {resetError && <p className="auth-error">{resetError}</p>}
            <button className="btn block" type="submit">
              <Icon name="checkCircle" size={17} />
              Set new password &amp; sign in
            </button>
            <div className="divider">or</div>
            <button type="button" className="btn ghost block" onClick={() => setResetting(false)}>
              Back
            </button>
          </form>
        )}

        {!creating && !enrolling && !authFor && (
          <>
            {orderedProfiles.map((p) => (
              <button key={p.id} className="profile-row" onClick={() => pickProfile(p)}>
                <Avatar profile={p} />
                <span>
                  <span className="nm">{p.name}</span>
                  <br />
                  <span className="rl">{p.role}</span>
                </span>
                <span className="chev">
                  {p.passwordHash ? <Icon name="shield" size={15} /> : <Icon name="chevronRight" size={16} />}
                </span>
              </button>
            ))}
            <div className="divider">or</div>
            <button className="btn ghost block" onClick={() => setCreating(true)}>
              <Icon name="person" size={17} />
              Create a new profile
            </button>
            {cloudEnabled && (
              <button
                className="btn ghost block"
                style={{ marginTop: 8 }}
                onClick={() => void supabase?.auth.signOut()}
              >
                <Icon name="signout" size={17} />
                Sign out of this account on this device
              </button>
            )}
          </>
        )}

        {creating && !enrolling && !authFor && (
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="nm">Full name</label>
              <input
                id="nm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Thandi Nkosi"
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="rl">Role</label>
              <select id="rl" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="Learner">Learner</option>
                <option value="Facilitator">Facilitator</option>
                <option value="Assessor">Assessor</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="npw">Password (optional)</label>
              <PasswordInput
                id="npw"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Protects your profile on this device"
              />
            </div>
            <button className="btn block" type="submit">
              <Icon name="signout" size={17} style={{ transform: "rotate(180deg)" }} />
              Continue
            </button>
            {dupError && <p className="auth-error" style={{ marginTop: 8 }}>{dupError}</p>}
            {profiles.length > 0 && (
              <>
                <div className="divider">or</div>
                <button type="button" className="btn ghost block" onClick={() => setCreating(false)}>
                  Back to profiles
                </button>
              </>
            )}
          </form>
        )}

        {enrolling && (
          <form onSubmit={submitEnrolment}>
            <EnrolmentForm value={enrol} onChange={setEnrol} />
            <button className="btn block" type="submit">
              <Icon name="checkCircle" size={17} />
              Complete enrolment
            </button>
            {dupError && <p className="auth-error" style={{ marginTop: 8 }}>{dupError}</p>}
            <div className="divider">or</div>
            <button type="button" className="btn ghost block" onClick={() => setEnrolling(false)}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
