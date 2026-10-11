import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { supabase } from "../lib/supabase";
import { activeCourse } from "../data/courses";
import { PasswordInput } from "./PasswordInput";
import { TENANT, TENANT_ID } from "../lib/tenant";

function TenantLogo() {
  return TENANT.logo ? (
    <img className="tenant-logo" src={TENANT.logo} alt={`${TENANT.name} logo`} />
  ) : (
    <><Icon name="certificate" size={26} /> {TENANT.appName}</>
  );
}

function savedAuthMode(): "signin" | "signup" {
  try {
    return sessionStorage.getItem("itss.auth-mode") === "signup" ? "signup" : "signin";
  } catch {
    // Storage may be blocked in privacy-focused browsers or embedded webviews.
    return "signin";
  }
}

function savedAuthError(): string | null {
  try {
    const message = sessionStorage.getItem("itss.auth-error");
    sessionStorage.removeItem("itss.auth-error");
    return message;
  } catch {
    return null;
  }
}

/** Email/password gate shown before the app when cloud sync is configured. */
export function CloudAuth() {
  const { meta: qualification } = activeCourse();
  const [mode, setMode] = useState<"signin" | "signup">(savedAuthMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(savedAuthError);
  const [notice, setNotice] = useState<string | null>(null);
  const submitting = useRef(false);

  // Keep the user on the registration screen if the page is refreshed (for
  // example after an accidental pull-to-refresh on mobile). Credentials stay
  // in component state and are deliberately not persisted.
  useEffect(() => {
    try {
      sessionStorage.setItem("itss.auth-mode", mode);
    } catch {
      // The screen still works when browser storage is unavailable.
    }
  }, [mode]);

  /** Translate Supabase auth errors into clear, actionable messages. */
  function friendlyError(message: string, current: "signin" | "signup"): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials"))
      return "Incorrect email or password. Check your details and try again — or, if you don't have an account yet, use “Create a new account” below.";
    if (m.includes("email not confirmed"))
      return "This email address hasn't been confirmed yet. Ask your facilitator to confirm the account, then sign in again.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "An account with this email already exists — go back to sign in instead.";
    if (m.includes("at least 6 characters") || m.includes("password should be"))
      return "Your password must be at least 6 characters long.";
    if (m.includes("valid email")) return "Please enter a valid email address.";
    if (m.includes("rate limit") || m.includes("too many requests"))
      return "Too many attempts — please wait a minute and try again.";
    if (m.includes("network") || m.includes("fetch"))
      return "Could not reach the server. Check your internet connection and try again.";
    return current === "signin"
      ? `Sign-in failed: ${message}`
      : `Could not create the account: ${message}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { tenant_id: TENANT_ID, company: TENANT.name } },
        });
        if (error) setError(friendlyError(error.message, "signup"));
        else if (!data.session)
          setNotice("Account created — check your email inbox to confirm your address, then sign in.");
        // when email confirmation is disabled a session is returned and the
        // auth listener in App takes over automatically
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(friendlyError(error.message, "signin"));
      }
    } catch (error) {
      setError(friendlyError(error instanceof Error ? error.message : String(error), mode));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!supabase) return;
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Type your email address above first, then tap “Forgot password?” again.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) setError(friendlyError(error.message, "signin"));
      else
        setNotice(
          `Password reset email sent to ${email} — open the link in it, and you'll be asked to choose a new password.`
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`gate${TENANT_ID === "discovery" ? " discovery-gate" : ""}`}>
      {TENANT_ID === "discovery" && (
        <div className="discovery-auth-showcase" aria-hidden="true">
          <img className="discovery-hero-logo" src={TENANT.logo!} alt="" />
          <p>GROW WITH PURPOSE.</p>
          <h2>Learn today.<br /><span>Make an impact.</span></h2>
          <div className="discovery-hero-rule" />
          <p className="discovery-hero-copy">Build your skills. Grow your confidence. Put your learning into practice.</p>
        </div>
      )}
      {TENANT_ID === "discovery" && (
        <div className="discovery-campus" aria-hidden="true">
          <svg viewBox="0 0 900 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="campus-sky" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#bde5ff" />
                <stop offset=".52" stopColor="#328bd2" />
                <stop offset="1" stopColor="#07518c" />
              </linearGradient>
              <linearGradient id="campus-glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#092844" />
                <stop offset=".42" stopColor="#1268a5" />
                <stop offset=".72" stopColor="#153f62" />
                <stop offset="1" stopColor="#061e34" />
              </linearGradient>
              <pattern id="campus-windows" width="38" height="42" patternUnits="userSpaceOnUse">
                <path d="M0 0H38M0 0V42" fill="none" stroke="#d2edff" strokeOpacity=".45" strokeWidth="2" />
                <path d="M5 5H32V34H5Z" fill="#9ddcff" fillOpacity=".12" />
              </pattern>
            </defs>
            <rect width="900" height="800" fill="url(#campus-sky)" />
            <path d="M0 0H900V220L590 170 360 250 0 340Z" fill="#fff" fillOpacity=".12" />
            <path d="M170 800V228Q180 156 250 145L405 127 540 202V800Z" fill="url(#campus-glass)" />
            <path d="M170 800V228Q180 156 250 145L405 127 540 202V800Z" fill="url(#campus-windows)" />
            <path d="M540 800V204L900 302V800Z" fill="#082941" />
            <path d="M540 204L900 302V800H540Z" fill="url(#campus-windows)" />
            <path d="M405 128Q480 167 540 204" fill="none" stroke="#e7f7ff" strokeOpacity=".8" strokeWidth="4" />
            <path d="M0 706Q220 680 390 716T900 684V800H0Z" fill="#092a3b" fillOpacity=".8" />
            <path d="M18 0Q-42 265 24 490T170 800" fill="none" stroke="#fff" strokeOpacity=".78" strokeWidth="3" />
            <path d="M48 0Q-10 256 52 480T205 800" fill="none" stroke="#fff" strokeOpacity=".36" strokeWidth="2" />
            <g fill="#d6ad6e" fillOpacity=".9">
              <circle cx="90" cy="663" r="48" /><circle cx="135" cy="693" r="62" />
              <circle cx="823" cy="638" r="43" /><circle cx="870" cy="685" r="58" />
            </g>
            <g fill="#285a42">
              <path d="M42 800l48-186 52 186z" /><path d="M84 800l55-142 48 142z" />
              <path d="M770 800l52-178 54 178z" /><path d="M824 800l48-136 42 136z" />
            </g>
            <path d="M0 755Q245 716 475 750T900 734V800H0Z" fill="#dfd5bb" />
            <path d="M0 778H900" stroke="#fff" strokeOpacity=".75" strokeWidth="5" />
          </svg>
        </div>
      )}
      <div className="gate-card">
        <div className="logo">
          <TenantLogo />
        </div>
        <div className="tenant-location">{TENANT.name} · {TENANT.location}</div>
        <h1>{mode === "signin" ? "Sign in to your account" : "Create your account"}</h1>
        <p className="sub">
          {qualification.title} · SAQA ID {qualification.saqaId} · NQF Level {qualification.nqfLevel}.
          {" "}Sign in to continue this qualification. Your profile and learning progress are
          stored securely online and available from any device.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="ca-email">Email address</label>
            <input
              id="ca-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ca-pw">Password</label>
            <PasswordInput
              id="ca-pw"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          {notice && (
            <div className="callout" style={{ marginTop: 0 }}>
              <span className="ico">
                <Icon name="info" size={19} />
              </span>
              <span>{notice}</span>
            </div>
          )}
          <button className="btn block" type="submit" disabled={busy}>
            <Icon name="signout" size={17} style={{ transform: "rotate(180deg)" }} />
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="divider">or</div>
        <button
          className="btn ghost block"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signin" ? "Create a new account" : "Back to sign in"}
        </button>
        {mode === "signin" && (
          <button className="btn ghost block" onClick={() => void forgotPassword()} disabled={busy}>
            Forgot password? Email me a reset link
          </button>
        )}
      </div>
    </div>
  );
}

/** Shown when the user lands back in the app from a password-recovery email. */
export function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`gate${TENANT_ID === "discovery" ? " discovery-gate" : ""}`}>
      <div className="gate-card">
        <div className="logo">
          <TenantLogo />
        </div>
        <h1>Choose a new password</h1>
        <p className="sub">Enter a new password for your account — you'll be signed in right away.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="rp-pw">New password</label>
            <PasswordInput
              id="rp-pw"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn block" type="submit" disabled={busy}>
            <Icon name="checkCircle" size={17} />
            {busy ? "Please wait…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
