import { useState } from "react";
import { Icon } from "../icons";
import type { EnrolmentInfo, Profile, Role } from "../types";
import { createProfile, hashPassword, loadProfiles } from "../store";
import { COURSE_META } from "../data/course";
import { Avatar } from "./Avatar";
import { EMPTY_ENROLMENT, EnrolmentForm } from "./EnrolmentForm";
import { cloudEnabled, supabase } from "../lib/supabase";

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

  function pickProfile(p: Profile) {
    if (p.passwordHash) {
      setAuthFor(p);
      setAuthPw("");
      setAuthError(false);
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (role === "Learner") {
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
    const p = createProfile(name, role, undefined, password ? await hashPassword(password) : undefined);
    setProfiles(loadProfiles());
    onSignIn(p);
  }

  async function submitEnrolment(e: React.FormEvent) {
    e.preventDefault();
    const p = createProfile(
      name,
      role,
      { ...enrol, signedDate: new Date().toISOString() },
      password ? await hashPassword(password) : undefined
    );
    setProfiles(loadProfiles());
    onSignIn(p);
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
            ? "Enter your password"
            : enrolling
              ? "Biographical Enrolment Information"
              : creating
                ? "Create your profile"
                : "Sign in"}
        </h1>
        <p className="sub">
          {authFor
            ? `Signing in as ${authFor.name} (${authFor.role}).`
            : enrolling
              ? "Required for first-time enrolment on the learnership. This information is saved to your profile and is visible to you, your facilitator and super users."
              : `${COURSE_META.title} · SAQA ID ${COURSE_META.saqaId} · NQF Level ${COURSE_META.nqfLevel}. Your progress is saved to your profile on this device.`}
        </p>

        {authFor && (
          <form onSubmit={submitAuth}>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                value={authPw}
                onChange={(e) => {
                  setAuthPw(e.target.value);
                  setAuthError(false);
                }}
                autoFocus
                required
              />
            </div>
            {authError && (
              <p className="auth-error">Incorrect password. Ask a super user to reset it if you have forgotten it.</p>
            )}
            <button className="btn block" type="submit">
              <Icon name="signout" size={17} style={{ transform: "rotate(180deg)" }} />
              Sign in
            </button>
            <div className="divider">or</div>
            <button type="button" className="btn ghost block" onClick={() => setAuthFor(null)}>
              Back to profiles
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
              <input
                id="npw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Protects your profile on this device"
              />
            </div>
            <button className="btn block" type="submit">
              <Icon name="signout" size={17} style={{ transform: "rotate(180deg)" }} />
              Continue
            </button>
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
