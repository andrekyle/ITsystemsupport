import { useState } from "react";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { isStaff } from "../types";
import { MODULES } from "../data/course";
import {
  loadProfiles,
  useAnnouncements,
  useQaThreads,
  useSharedSettings,
} from "../store";
import { logAudit } from "../lib/audit";
import { leaderboard } from "../lib/gamification";
import { mailtoLink, outlookComposeLink, teamsChatLink } from "../lib/integrations";
import { Avatar } from "../components/Avatar";

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 3600 * 1000));
  if (days === 0) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export function CommunityPage({ profile }: { profile: Profile; navigate: (r: Route) => void }) {
  const staff = isStaff(profile.role);
  const isSuper = profile.role === "Super User";
  const [settings, updateSettings] = useSharedSettings();

  return (
    <>
      <div className="eyebrow">
        <Icon name="chat" size={15} />
        Community
      </div>
      <h1 className="page-title">Community &amp; support</h1>
      <p className="page-sub">
        Announcements, questions and answers, class leaderboard and your collaboration tools.
      </p>

      <EngagementLinks profile={profile} isSuper={isSuper} settings={settings} updateSettings={updateSettings} />

      <div className="community-cols">
        <div>
          <Announcements profile={profile} staff={staff} isSuper={isSuper} />
          <QaBoard profile={profile} staff={staff} />
        </div>
        <div>
          <Leaderboard profile={profile} />
        </div>
      </div>
    </>
  );
}

/* ---------- collaboration / integration links ---------- */

function EngagementLinks({
  profile,
  isSuper,
  settings,
  updateSettings,
}: {
  profile: Profile;
  isSuper: boolean;
  settings: { waygroundUrl: string; teamsUrl: string; supportEmail: string; staffCode: string };
  updateSettings: (patch: Partial<{ waygroundUrl: string; teamsUrl: string; supportEmail: string; staffCode: string }>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [wg, setWg] = useState(settings.waygroundUrl);
  const [teams, setTeams] = useState(settings.teamsUrl);
  const [email, setEmail] = useState(settings.supportEmail);
  const [code, setCode] = useState(settings.staffCode);

  const supportSubject = `ITSS Learn support — ${profile.name}`;

  return (
    <div className="card engage-card">
      <div className="engage-links">
        {settings.waygroundUrl && (
          <a className="btn" href={settings.waygroundUrl} target="_blank" rel="noreferrer">
            <Icon name="play" size={16} /> Live quiz on Wayground
          </a>
        )}
        {settings.teamsUrl && (
          <a className="btn ghost" href={settings.teamsUrl} target="_blank" rel="noreferrer">
            <Icon name="people" size={16} /> Class team on Teams
          </a>
        )}
        {settings.supportEmail && (
          <>
            <a
              className="btn ghost"
              href={outlookComposeLink(settings.supportEmail, supportSubject)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="globe" size={16} /> Email support (Outlook)
            </a>
            <a className="btn ghost" href={mailtoLink(settings.supportEmail, supportSubject)}>
              <Icon name="document" size={16} /> Email support (mail app)
            </a>
          </>
        )}
        {!settings.waygroundUrl && !settings.teamsUrl && !settings.supportEmail && (
          <span className="mini-note">
            {isSuper
              ? "Set your Wayground, Teams and support-email links so learners can reach you."
              : "Your facilitator has not published collaboration links yet."}
          </span>
        )}
        {isSuper && (
          <button className="btn ghost sm" onClick={() => setEditing((e) => !e)}>
            <Icon name="settings" size={15} /> {editing ? "Close" : "Configure"}
          </button>
        )}
      </div>

      {isSuper && editing && (
        <div className="engage-config">
          <div className="field">
            <label>Wayground (Quizizz) space URL</label>
            <input value={wg} onChange={(e) => setWg(e.target.value)} placeholder="https://wayground.com/admin/…" />
          </div>
          <div className="field">
            <label>Microsoft Teams team / channel link</label>
            <input value={teams} onChange={(e) => setTeams(e.target.value)} placeholder="https://teams.microsoft.com/l/team/…" />
          </div>
          <div className="field">
            <label>Support email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@example.co.za" />
          </div>
          <div className="field">
            <label>Staff access code (needed to register staff accounts)</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ITSS-STAFF-2026" />
          </div>
          <button
            className="btn sm"
            onClick={() => {
              updateSettings({
                waygroundUrl: wg.trim(),
                teamsUrl: teams.trim(),
                supportEmail: email.trim(),
                staffCode: code.trim(),
              });
              setEditing(false);
            }}
          >
            <Icon name="checkCircle" size={15} /> Save
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- announcements ---------- */

function Announcements({
  profile,
  staff,
  isSuper,
}: {
  profile: Profile;
  staff: boolean;
  isSuper: boolean;
}) {
  const { announcements, post, remove, togglePin } = useAnnouncements();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function submit() {
    if (!title.trim() || !body.trim()) return;
    post(profile, title, body);
    logAudit(profile, "announce.post", `Posted announcement “${title.trim()}”`);
    setTitle("");
    setBody("");
    setComposing(false);
  }

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="bell" size={20} />
        </span>
        Announcements
        <span style={{ flex: 1 }} />
        {staff && (
          <button className="btn ghost sm" onClick={() => setComposing((c) => !c)}>
            {composing ? "Cancel" : "New announcement"}
          </button>
        )}
      </h2>

      {composing && (
        <div className="card compose-card">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <button className="btn sm" onClick={submit} disabled={!title.trim() || !body.trim()}>
            <Icon name="bell" size={15} /> Publish to everyone
          </button>
        </div>
      )}

      {announcements.length === 0 && !composing && (
        <div className="card">
          <p className="mini-note">No announcements yet.</p>
        </div>
      )}
      {announcements.map((a) => (
        <div className={`card announce-card${a.pinned ? " pinned" : ""}`} key={a.id}>
          <div className="announce-head">
            {a.pinned && <Icon name="bell" size={14} />}
            <strong>{a.title}</strong>
            <span className="mini-note">
              {a.by} ({a.role}) · {fmtWhen(a.at)}
            </span>
            <span style={{ flex: 1 }} />
            {staff && (
              <button className="btn ghost sm" onClick={() => togglePin(a.id)}>
                {a.pinned ? "Unpin" : "Pin"}
              </button>
            )}
            {(isSuper || a.byId === profile.id) && (
              <button className="btn ghost sm danger" onClick={() => remove(a.id)}>
                Delete
              </button>
            )}
          </div>
          <p className="announce-body">{a.body}</p>
        </div>
      ))}
    </>
  );
}

/* ---------- Q&A support board ---------- */

function QaBoard({ profile, staff }: { profile: Profile; staff: boolean }) {
  const { threads, ask, reply, toggleResolved, remove } = useQaThreads();
  const isSuper = profile.role === "Super User";
  const [asking, setAsking] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [unit, setUnit] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const allUnits = MODULES.flatMap((m) => m.units);
  const visible = threads.filter((t) => showResolved || !t.resolved);

  function submitAsk() {
    if (!title.trim()) return;
    ask(profile, title, body, unit || undefined);
    logAudit(profile, "qa.post", `Asked “${title.trim()}”${unit ? ` (US ${unit})` : ""}`);
    setTitle("");
    setBody("");
    setUnit("");
    setAsking(false);
  }

  function submitReply(threadId: string) {
    if (!replyText.trim()) return;
    reply(profile, threadId, replyText);
    logAudit(profile, "qa.post", "Replied to a question");
    setReplyText("");
    setReplyFor(null);
  }

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="chat" size={20} />
        </span>
        Questions &amp; answers
        <span style={{ flex: 1 }} />
        <button className="btn ghost sm" onClick={() => setShowResolved((s) => !s)}>
          {showResolved ? "Hide resolved" : "Show resolved"}
        </button>
        <button className="btn ghost sm" onClick={() => setAsking((a) => !a)}>
          {asking ? "Cancel" : "Ask a question"}
        </button>
      </h2>

      {asking && (
        <div className="card compose-card">
          <div className="field">
            <label>Question</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I upload my logbook project?"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Details (optional)</label>
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="field">
            <label>Related unit standard (optional)</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">— none —</option>
              {allUnits.map((u) => (
                <option key={u.us} value={u.us}>
                  US {u.us} — {u.title.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
          <button className="btn sm" onClick={submitAsk} disabled={!title.trim()}>
            <Icon name="chat" size={15} /> Post question
          </button>
        </div>
      )}

      {visible.length === 0 && !asking && (
        <div className="card">
          <p className="mini-note">
            No open questions. Stuck on something? Ask here — your facilitator gets notified on
            their next visit.
          </p>
        </div>
      )}
      {visible.map((t) => (
        <div className={`card qa-card${t.resolved ? " resolved" : ""}`} key={t.id}>
          <div className="announce-head">
            <strong>{t.title}</strong>
            {t.unit && <span className="status-chip info">US {t.unit}</span>}
            {t.resolved && <span className="status-chip ok">Resolved</span>}
            <span className="mini-note">
              {t.by} · {fmtWhen(t.at)}
            </span>
            <span style={{ flex: 1 }} />
            {(staff || t.byId === profile.id) && (
              <button className="btn ghost sm" onClick={() => toggleResolved(t.id)}>
                {t.resolved ? "Reopen" : "Mark resolved"}
              </button>
            )}
            {(isSuper || t.byId === profile.id) && (
              <button className="btn ghost sm danger" onClick={() => remove(t.id)}>
                Delete
              </button>
            )}
          </div>
          {t.body && <p className="announce-body">{t.body}</p>}
          {t.replies.map((r) => (
            <div className={`qa-reply${isStaff(r.role) ? " staff" : ""}`} key={r.id}>
              <span className="qa-reply-by">
                {r.by}
                {isStaff(r.role) && <span className="status-chip info">{r.role}</span>}
                <span className="mini-note">{fmtWhen(r.at)}</span>
              </span>
              <span>{r.body}</span>
            </div>
          ))}
          {replyFor === t.id ? (
            <div className="qa-replybox">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitReply(t.id);
                }}
              />
              <button className="btn sm" onClick={() => submitReply(t.id)} disabled={!replyText.trim()}>
                Reply
              </button>
            </div>
          ) : (
            <button className="btn ghost sm" onClick={() => { setReplyFor(t.id); setReplyText(""); }}>
              Reply
            </button>
          )}
        </div>
      ))}
    </>
  );
}

/* ---------- leaderboard ---------- */

function Leaderboard({ profile }: { profile: Profile }) {
  const rows = leaderboard(loadProfiles());
  const top = rows.slice(0, 10);
  const myIndex = rows.findIndex((r) => r.profile.id === profile.id);

  return (
    <>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="award" size={20} />
        </span>
        Class leaderboard
      </h2>
      <div className="card leaderboard-card">
        {top.length === 0 ? (
          <p className="mini-note">No learners yet — the leaderboard fills up as the class works.</p>
        ) : (
          <ol className="leaderboard">
            {top.map((r, i) => (
              <li
                key={r.profile.id}
                className={r.profile.id === profile.id ? "me" : ""}
              >
                <span className={`rank r${i + 1}`}>{i + 1}</span>
                <Avatar profile={r.profile} size={30} />
                <span className="lb-name">
                  {r.profile.name}
                  <span className="mini-note">
                    Level {r.level} · {r.levelName} · {r.earnedBadges} badges
                  </span>
                </span>
                <span className="lb-xp">{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
        {myIndex >= 10 && (
          <p className="mini-note">
            You are ranked #{myIndex + 1} of {rows.length} — keep going!
          </p>
        )}
        <p className="mini-note">
          XP comes from completed activities (25), quizzes at 80%+ (50, perfect 75), passed
          exercises (30–45), POE uploads (20) and signed registers (15).
        </p>
      </div>
    </>
  );
}
