import { useState } from "react";
import { Icon } from "../icons";
import { supabase } from "../lib/supabase";
import { COURSE_META } from "../data/course";

/** Email/password gate shown before the app when cloud sync is configured. */
export function CloudAuth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else if (!data.session)
          setNotice("Account created — check your email inbox to confirm your address, then sign in.");
        // when email confirmation is disabled a session is returned and the
        // auth listener in App takes over automatically
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      }
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
            <input
              id="ca-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}
