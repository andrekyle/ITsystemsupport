import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { getContent } from "../data/content";
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

/** Live clock (real time) describing the current lesson-plan session — the session starts at 09:00. */
function SessionClock() {
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
  let ends: number | null = null; // end of the current session, minutes since midnight

  if (!SCHEDULE.length) {
    label = "";
  } else if (!isSessionDay) {
    label = now < sessionDay ? `Session starts ${SESSION_DATE}, 09:00` : "Session concluded";
  } else {
    const current = SCHEDULE.find((s) => simMin >= s.start && simMin < s.end);
    if (current) {
      label = current.title;
      ends = current.end;
    } else if (simMin < SCHEDULE[0].start) label = "Session starts at 09:00";
    else label = "Session complete — well done";
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
}

export function Header({
  profile,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onSignOut,
  onUpdateProfile,
  onOpenProfile,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

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
      <SessionClock />
      <div className="header-right">
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={19} />
        </button>
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
