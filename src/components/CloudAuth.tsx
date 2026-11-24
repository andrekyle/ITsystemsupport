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

function savedAuthError(): string | null {
  try {
    const message = sessionStorage.getItem("itss.auth-error");
    sessionStorage.removeItem("itss.auth-error");
    return message;
  } catch {
    return null;
  }
}

function clearPasswordRecoveryMarker() {
  try {
    window.sessionStorage.removeItem("itss.passwordRecovery");
  } catch {
    // The marker is temporary and will disappear when the tab closes.
  }
}

/** Email/password gate shown before the app when cloud sync is configured. */
export function CloudAuth() {
  const { meta: qualification } = activeCourse();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(savedAuthError);
  const [notice, setNotice] = useState<string | null>(null);
  const submitting = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const signInLink = useRef<HTMLAnchorElement>(null);
  const discovery = TENANT_ID === "discovery";
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 980px)").matches);
  const popup = discovery && !mobile;
  const [loginOpen, setLoginOpen] = useState(() =>
    window.location.hash === "#discovery-login" || !!error
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 980px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!discovery) return;
    const syncHash = () => setLoginOpen(window.location.hash === "#discovery-login");
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [discovery]);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (!popup) {
      if (!dialogRef.current.open) dialogRef.current.show();
      return;
    }
    if (loginOpen) {
      dialogRef.current.close();
      dialogRef.current.showModal();
      dialogRef.current.querySelector<HTMLInputElement>("#ca-email")?.focus();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        dialogRef.current?.close();
        document.body.style.overflow = previousOverflow;
      };
    }
    dialogRef.current.close();
  }, [popup, loginOpen]);

  function closeLogin() {
    if (busy) return;
    setLoginOpen(false);
    setPassword("");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    signInLink.current?.focus();
  }

  /** Translate Supabase auth errors into clear, actionable messages. */
  function friendlyError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials"))
      return "Incorrect email or password. Check your details and try again. New learners should ask their facilitator to create an account.";
    if (m.includes("email not confirmed"))
      return "This email address hasn't been confirmed yet. Ask your facilitator to confirm the account, then sign in again.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "An account with this email already exists. Sign in or ask your facilitator for help.";
    if (m.includes("at least 6 characters") || m.includes("password should be"))
      return "Your password must be at least 6 characters long.";
    if (m.includes("valid email")) return "Please enter a valid email address.";
    if (m.includes("rate limit") || m.includes("too many requests"))
      return "Too many attempts — please wait a minute and try again.";
    if (m.includes("network") || m.includes("fetch"))
      return "Could not reach the server. Check your internet connection and try again.";
    return `Sign-in failed: ${message}`;
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(friendlyError(error.message));
    } catch (error) {
      setError(friendlyError(error instanceof Error ? error.message : String(error)));
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
      try {
        window.sessionStorage.setItem("itss.passwordRecovery", "1");
      } catch {
        // Supabase's recovery event still identifies the flow if storage is unavailable.
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        clearPasswordRecoveryMarker();
        setError(friendlyError(error.message));
      }
      else
        setNotice(
          `Password reset email sent to ${email} — open the link in it, and you'll be asked to choose a new password.`
        );
    } catch (failure) {
      clearPasswordRecoveryMarker();
      setError(friendlyError(failure instanceof Error ? failure.message : String(failure)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`gate${TENANT_ID === "discovery" ? " discovery-gate" : " investec-gate"}`}>
      {discovery && !mobile && (
        <a className="discovery-signin-link" href="#discovery-login" ref={signInLink}
          onClick={() => setLoginOpen(true)}>
          Sign in
        </a>
      )}
      {discovery && !mobile && (
        <div className="discovery-auth-showcase">
          <img className="discovery-hero-logo" src={TENANT.logo!} alt="Discovery" />
          <h2>Learn today.<br />Make an<br /><span>impact.</span></h2>
          <p className="discovery-hero-copy">Build your skills. Grow your confidence. Put your learning into practice.</p>
          <div className="discovery-hero-rule" />
        </div>
      )}
      <dialog ref={dialogRef} open={popup ? undefined : true}
        className={popup ? "discovery-login-dialog" : "auth-inline-dialog"}
        aria-labelledby="cloud-auth-title"
        onCancel={(event) => event.preventDefault()}>
      <div className="gate-card">
        {popup && (
          <button type="button" className="discovery-login-close" aria-label="Close sign-in"
            disabled={busy} onClick={closeLogin}>×</button>
        )}
        <div className="logo">
          <TenantLogo />
        </div>
        {TENANT_ID === "investec" && <img className="investec-auth-zebra" src="/logos/investec-zebra.png" alt="Investec zebra" />}
        <h1 id="cloud-auth-title">Sign in to your account</h1>
        <p className="sub">
          {qualification.title} · SAQA ID {qualification.saqaId} · NQF Level {qualification.nqfLevel}.
          {" "}Sign in to continue this qualification.
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
              autoComplete="current-password"
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
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <p className="muted" style={{ textAlign: "center" }}>
          New learner? Ask your facilitator to create your account and assign your cohort.
        </p>
        <button className="btn ghost block" onClick={() => void forgotPassword()} disabled={busy}>
          Forgot password? Email me a reset link
        </button>
      </div>
      </dialog>
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
