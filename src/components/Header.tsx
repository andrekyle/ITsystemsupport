import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { getContent } from "../data/content";
import { Avatar, fileToAvatar } from "./Avatar";

/** Session schedule derived from the US 8252 lesson plan (starts 09:00). */
const SCHEDULE = (() => {
  const plan = getContent("8252")?.lessonPlan;
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

/** TEST MODE: cycle to the next lesson-plan session every 5 seconds (set to false for the real 09:00 clock). */
const CLOCK_TEST = true;

/** Live clock that starts at 09:00 and describes the current lesson-plan session. */
function SessionClock() {
  const [elapsed, setElapsed] = useState(0); // seconds since the clock started
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  let sim: number; // seconds since midnight
  let label = "";

  if (CLOCK_TEST && SCHEDULE.length) {
    // jump to the start of the next session every 5 seconds
    const idx = Math.floor(elapsed / 5) % SCHEDULE.length;
    const current = SCHEDULE[idx];
    sim = current.start * 60 + (elapsed % 5);
    label = current.title;
  } else {
    sim = 9 * 3600 + elapsed; // starting at 09:00
    const simMin = sim / 60;
    if (SCHEDULE.length) {
      const current = SCHEDULE.find((s) => simMin >= s.start && simMin < s.end);
      if (current) label = current.title;
      else if (simMin < SCHEDULE[0].start) label = "Session starts soon";
      else label = "Session complete — well done";
    }
  }

  const hh = String(Math.floor(sim / 3600)).padStart(2, "0");
  const mm = String(Math.floor((sim % 3600) / 60)).padStart(2, "0");
  const ss = String(sim % 60).padStart(2, "0");

  return (
    <div className="header-clock" title="Session clock — follows the lesson plan from 09:00">
      <Icon name="clock" size={16} />
      <span className="time">
        {hh}:{mm}:{ss}
      </span>
      {label && <span className="session">{label}</span>}
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
