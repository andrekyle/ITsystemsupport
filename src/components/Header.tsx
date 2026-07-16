import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { Avatar, fileToAvatar } from "./Avatar";

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
      <div className="header-search">
        <Icon name="search" size={16} />
        <input placeholder="Search unit standards, modules…" aria-label="Search" />
      </div>
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
