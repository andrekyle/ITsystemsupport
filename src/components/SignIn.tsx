import { useState } from "react";
import { Icon } from "../icons";
import type { EnrolmentInfo, Profile, Role } from "../types";
import {
  assertNoDuplicateProfile,
  createProfile,
  DuplicateProfileError,
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

  /** Combine local + cloud profiles and abort with a friendly error message
   *  if the person signing up already has an account somewhere. */
  async function ensureNoDuplicate(attempt: { name: string; enrolment?: EnrolmentInfo }) {
    const local = loadProfiles();
    let candidates: Profile[] = local;
    try {
      const dir = await fetchCloudDirectory();
      if (dir) {
        const seen = new Set(local.map((p) => p.id));
        candidates = [...local, ...dir.profiles.filter((p) => !seen.has(p.id))];
      }
    } catch {
      /* offline or RLS-restricted: local check is still enforced */
    }
    assertNoDuplicateProfile(candidates, attempt);
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
    if (role === "Learner") {
      try {
        await ensureNoDuplicate({ name });
      } catch (err) {
        if (err instanceof DuplicateProfileError) {
          setDupError(err.message);
          return;
        }
        throw err;
      }
      // pre-fill first names / surname from the full name
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
      await ensureNoDuplicate({ name });
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
    try {
      await ensureNoDuplicate({ name, enrolment: enrol });
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
            {profiles.map((p) => (
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
