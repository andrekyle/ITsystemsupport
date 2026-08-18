import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { getContent } from "../data/content";
import { MODULES } from "../data/course";
import { loadProfiles, useChatThreads } from "../store";
import { Avatar, fileToAvatar } from "./Avatar";

/** Session schedule derived from the US 8252 lesson plan (starts 09:00). */
const PLAN = getContent("8252")?.lessonPlan;
/** The date the session takes place, from the lesson plan details. */
const SESSION_DATE =
  PLAN?.details?.find((d) => d.label === "Date")?.value.replace(/^\w+,\s*/, "") ?? "17 July 2026";
const SCHEDULE = (() => {
  const plan = PLAN;
  if (!plan) return [] as { start: number; end: number; title: string }[];
  const [sh, sm] = (plan.startTime ?? "09:00").split(":").map(Number);
  let clock = sh * 60 + sm;
  const out: { start: number; end: number; title: string }[] = [];
  for (const sec of plan.sections) {
    for (const r of sec.rows) {
      const mins = parseInt(r.time ?? "", 10) || 0;
      if (!mins) continue;
      out.push({ start: clock, end: clock + mins, title: r.title.split(" — ")[0] });
      clock += mins;
    }
  }
  return out;
})();

/** Every scheduled session across the course (from the unit standard dates), sorted. */
const ALL_SESSIONS = (() => {
  const MON: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const out: { start: Date; end: Date; us: string }[] = [];
  for (const m of MODULES) {
    for (const u of m.units) {
      const year = u.dates.match(/\b20\d{2}\b/);
      if (!year) continue;
      const tm = u.time.match(/(\d{1,2})h(\d{2})\s*-\s*(\d{1,2})h(\d{2})/);
      const [sh, sm, eh, em] = tm ? [+tm[1], +tm[2], +tm[3], +tm[4]] : [9, 0, 14, 0];
      for (const seg of u.dates.matchAll(
        /(\d{1,2}(?:\s*,\s*\d{1,2})*)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi
      )) {
        const mon = MON[seg[2].toLowerCase()];
        for (const d of seg[1].split(/\s*,\s*/)) {
          out.push({
            start: new Date(+year[0], mon, +d, sh, sm),
            end: new Date(+year[0], mon, +d, eh, em),
            us: u.us,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
})();

function fmtSession(d: Date): string {
  const day = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return `${day}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Live clock (real time) describing the current lesson-plan session — the session starts at 09:00. */
function SessionClock({ onOpenUnit }: { onOpenUnit?: (us: string) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const sessionDay = new Date(`${SESSION_DATE} 00:00`);
  const isSessionDay =
    now.getFullYear() === sessionDay.getFullYear() &&
    now.getMonth() === sessionDay.getMonth() &&
    now.getDate() === sessionDay.getDate();

  const simMin = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 60;
  let label = "";
  let usRef: string | null = null; // clickable unit-standard reference shown after the label
  let ends: number | null = null; // end of the current session, minutes since midnight

  const currentSession = ALL_SESSIONS.find((s) => now >= s.start && now <= s.end);
  const nextSession = ALL_SESSIONS.find((s) => s.start.getTime() > now.getTime());

  if (isSessionDay && SCHEDULE.length) {
    // US 8252 session day: show the live lesson-plan activity
    const current = SCHEDULE.find((s) => simMin >= s.start && simMin < s.end);
    if (current) {
      label = current.title;
      ends = current.end;
    } else if (simMin < SCHEDULE[0].start) label = "Session starts at 09:00";
    else if (nextSession) {
      label = `Session complete — next session ${fmtSession(nextSession.start)} ·`;
      usRef = nextSession.us;
    } else {
      label = "Session complete — well done";
    }
  } else if (currentSession) {
    label = "Session in progress —";
    usRef = currentSession.us;
    ends = currentSession.end.getHours() * 60 + currentSession.end.getMinutes();
  } else if (nextSession) {
    label = `Next session: ${fmtSession(nextSession.start)} ·`;
    usRef = nextSession.us;
  } else {
    label = "All sessions concluded";
  }

  const today = now.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const endLabel =
    ends !== null
      ? `ends ${String(Math.floor(ends / 60)).padStart(2, "0")}:${String(ends % 60).padStart(2, "0")}`
      : "";

  return (
    <div
      className="header-clock"
      title={`Session clock — the session starts at 09:00 on ${SESSION_DATE}`}
    >
      <Icon name="clock" size={16} />
      <span className="date">{today}</span>
      <span className="time">
        {hh}:{mm}:{ss}
      </span>
      {label && <span className="session">{label}</span>}
      {usRef && (
        <button
          className="session-us"
          onClick={() => onOpenUnit?.(usRef!)}
          title={`Open unit standard ${usRef}`}
        >
          US {usRef}
        </button>
      )}
      {endLabel && <span className="ends">{endLabel}</span>}
    </div>
  );
}

interface Props {
  profile: Profile;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onSignOut: () => void;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onOpenProfile: () => void;
  onOpenUnit?: (us: string) => void;
  navigate?: (r: Route) => void;
}

export function Header({
  profile,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onSignOut,
  onUpdateProfile,
  onOpenProfile,
  onOpenUnit,
  navigate,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Live-updating list of chat threads; filter to ones with unread messages for me.
  const chatThreads = useChatThreads();
  const notifs = useMemo(() => {
    return chatThreads
      .filter((t) => t.aId === profile.id || t.bId === profile.id)
      .map((t) => {
        const otherId = t.aId === profile.id ? t.bId : t.aId;
        const unread = t.unreadFor(profile.id);
        // The other person's name: every chat message stores its sender's
        // display name, so read it off their most recent message. Fall back
        // to the local profile list, then a generic label.
        const fromMsgs = [...t.messages].reverse().find((m) => m.byId === otherId && m.by)?.by;
        const otherName =
          fromMsgs ||
          loadProfiles().find((p) => p.id === otherId)?.name ||
          "Someone";
        return { threadKey: t.key, otherId, otherName, unread, latest: t.latest };
      })
      .filter((n) => n.unread > 0)
      .sort((a, b) => (b.latest?.at ?? "").localeCompare(a.latest?.at ?? ""));
  }, [chatThreads, profile.id]);
  const unreadCount = notifs.reduce((n, x) => n + x.unread, 0);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [notifOpen]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const avatar = await fileToAvatar(file);
      onUpdateProfile({ avatar });
    } catch {
      // ignore unreadable images
    }
  }

  return (
    <header className="header">
      <button className="icon-btn" onClick={onToggleSidebar} title="Toggle navigation" aria-label="Toggle navigation">
        <Icon name="menu" size={19} />
      </button>
      <div className="brand">
        <Icon name="certificate" size={24} color="var(--azure)" />
        <span className="brand-name">ITSS Learn</span>
        <span className="brand-sub">System Support · NQF 5</span>
      </div>
      <SessionClock onOpenUnit={onOpenUnit} />
      <div className="header-right">
        <div className="notif-wrap" ref={notifRef}>
          <button
            className={`icon-btn${unreadCount > 0 ? " has-unread" : ""}`}
            title={unreadCount > 0 ? `${unreadCount} unread message${unreadCount === 1 ? "" : "s"}` : "No new notifications"}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((o) => !o)}
          >
            <Icon name="bell" size={19} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="notif-menu" role="menu">
              <div className="notif-head">Notifications</div>
              {notifs.length === 0 ? (
                <div className="notif-empty">
                  <Icon name="bell" size={20} />
                  <p className="mini-note">You're all caught up.</p>
                </div>
              ) : (
                <>
                  {notifs.map((n) => (
                    <button
                      key={n.threadKey}
                      className="notif-item"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate?.({ page: "chat", studentId: n.otherId });
                      }}
                    >
                      <span className="notif-item-title">
                        <Icon name="chat" size={14} /> New message from <strong>{n.otherName}</strong>
                      </span>
                      {n.latest && (
                        <span className="notif-item-preview mini-note">"{n.latest.body}"</span>
                      )}
                      <span className="notif-item-badge">{n.unread}</span>
                    </button>
                  ))}
                  <button
                    className="notif-foot btn ghost sm"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate?.({ page: "chat" });
                    }}
                  >
                    Open all conversations
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>
        <div className="profile-menu-wrap" ref={menuRef}>
          <button
            className="profile-chip"
            title="Profile"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
          >
            <Avatar profile={profile} />
            <span className="who">
              <span className="nm">{profile.name}</span>
              <br />
              <span className="rl">{profile.role}</span>
            </span>
          </button>
          {menuOpen && (
            <div className="profile-menu" role="menu">
              <div className="pm-head">
                <Avatar profile={profile} size={48} />
                <div>
                  <div className="nm">{profile.name}</div>
                  <div className="rl">
                    {profile.role === "Super User" && <Icon name="shield" size={13} />}
                    {profile.role}
                  </div>
                </div>
              </div>
              <button
                className="pm-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
              >
                <Icon name="clipboard" size={17} />
                View profile
              </button>
              <button className="pm-item" role="menuitem" onClick={() => fileRef.current?.click()}>
                <Icon name="person" size={17} />
                {profile.avatar ? "Change profile picture" : "Add profile picture"}
              </button>
              {profile.avatar && (
                <button
                  className="pm-item"
                  role="menuitem"
                  onClick={() => onUpdateProfile({ avatar: undefined })}
                >
                  <Icon name="circle" size={17} />
                  Remove picture
                </button>
              )}
              <button className="pm-item" role="menuitem" onClick={onSignOut}>
                <Icon name="signout" size={17} />
                Sign out
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onPickFile}
          />
        </div>
      </div>
    </header>
  );
}
