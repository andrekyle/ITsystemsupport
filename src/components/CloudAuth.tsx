import { useState } from "react";
import { Icon } from "../icons";
import { supabase } from "../lib/supabase";
import { COURSE_META } from "../data/course";
import { PasswordInput } from "./PasswordInput";

/** Email/password gate shown before the app when cloud sync is configured. */
export function CloudAuth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setError(friendlyError(error.message, "signup"));
        else if (!data.session)
          setNotice("Account created — check your email inbox to confirm your address, then sign in.");
        // when email confirmation is disabled a session is returned and the
        // auth listener in App takes over automatically
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(friendlyError(error.message, "signin"));
      }
    } finally {
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
    <div className="gate">
      <div className="gate-card">
        <div className="logo">
          <Icon name="certificate" size={26} />
          ITSS Learn
        </div>
        <h1>{mode === "signin" ? "Sign in to your account" : "Create your account"}</h1>
        <p className="sub">
          {COURSE_META.title} · SAQA ID {COURSE_META.saqaId} · NQF Level {COURSE_META.nqfLevel}.
          Your profile and progress are stored securely online — sign in from any device to
          continue where you left off.
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
    <div className="gate">
      <div className="gate-card">
        <div className="logo">
          <Icon name="certificate" size={26} />
          ITSS Learn
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
