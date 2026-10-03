import { useEffect, useState } from "react";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { isStaff } from "../types";
import type { ProgressState } from "../types";
import { isInstalled, installHelpMessage, onInstallChange, promptInstall } from "../lib/install";
import { AlertModal } from "./Modal";

// Sentence case: first letter uppercased, subsequent words lowercased, but
// leave all-uppercase tokens (acronyms like LAN, SAQA, IT) untouched.
function toSentenceCase(s: string): string {
  const parts = s.split(/(\s+|[/&,\-])/);
  let seenFirst = false;
  return parts
    .map((tok) => {
      if (!tok.trim() || /^[/&,\-]$/.test(tok)) return tok;
      const isAcronym = tok.length > 1 && tok === tok.toUpperCase() && /[A-Z]/.test(tok);
      if (isAcronym) {
        seenFirst = true;
        return tok;
      }
      const lower = tok.toLowerCase();
      if (!seenFirst) {
        seenFirst = true;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join("");
}

interface Props {
  collapsed: boolean;
  route: Route;
  progress: ProgressState;
  profile: Profile;
  navigate: (r: Route) => void;
}

export function Sidebar({ collapsed, route, profile, navigate }: Props) {
  const isPrivileged = isStaff(profile.role);
  const [installed, setInstalled] = useState(isInstalled);
  const [installMsg, setInstallMsg] = useState<string | null>(null);
  useEffect(() => onInstallChange(() => setInstalled(isInstalled())), []);

  async function onInstallClick() {
    if (await promptInstall()) return;
    setInstallMsg(installHelpMessage());
  }

  const nav = [
    { page: "dashboard" as const, icon: "dashboard", label: "Dashboard" },
    { page: "course" as const, icon: "book", label: "My Course" },
    { page: "progress" as const, icon: "trend", label: "Progress" },
    { page: "howto" as const, icon: "target", label: "Reach 100%" },
    { page: "community" as const, icon: "chat", label: "Community & Support" },
    { page: "chat" as const, icon: "chat", label: "Chat" },
    { page: "memories" as const, icon: "image", label: "Gallery" },
    { page: "poe" as const, icon: "folder", label: "Portfolio of Evidence" },
    { page: "checklist" as const, icon: "checklist", label: "Appendix C Checklist" },
    { page: "sectiond" as const, icon: "document", label: "Section D Declaration" },
    { page: "forms" as const, icon: "clipboard", label: "Forms" },
    { page: "compliance" as const, icon: "shield", label: "Compliance" },
    ...(isPrivileged
      ? [{ page: "analytics" as const, icon: "chart", label: "Learning Analytics" }]
      : []),
    ...(isPrivileged
      ? [
          {
            page: "students" as const,
            icon: "people",
            label: profile.role === "Super User" ? "Users" : "Students",
          },
        ]
      : [
          {
            page: "students" as const,
            icon: "people",
            label: "Enrolled Learners",
          },
        ]),
    ...(profile.role === "Super User"
      ? [
          { page: "trackerReport" as const, icon: "chart", label: "Learner Tracker Report" },
          { page: "reports" as const, icon: "robot", label: "AI Assistant" },
        ]
      : []),
    { page: "calendar" as const, icon: "calendar", label: "Training Calendar" },
    { page: "attendance" as const, icon: "clipboard", label: "Attendance Register" },
    { page: "voting" as const, icon: "chart", label: "Voting Station" },
    { page: "assessments" as const, icon: "clipboard", label: "Assessments" },
    { page: "deliverables" as const, icon: "checklist", label: "Deliverables" },
    { page: "resources" as const, icon: "globe", label: "Resources" },
  ];

  return (
    <nav className={`sidebar${collapsed ? " collapsed" : ""}`} aria-label="Main navigation">
      <div className="sidebar-scroll">
        <div className="side-section">
          {nav.map((n) => (
            <button
              key={n.page}
              className={`side-item${route.page === n.page ? " active" : ""}`}
              onClick={() => navigate({ page: n.page })}
              title={n.label}
            >
              <span className="ico">
                <Icon name={n.icon} />
              </span>
              {!collapsed && <span className="txt">{n.label}</span>}
            </button>
          ))}
        </div>

      </div>

      <div className="sidebar-footer">
        {!installed && (
          <button
            className="side-item install-app"
            title="Install ITSS Learn on this device — works offline once installed"
            onClick={() => void onInstallClick()}
          >
            <span className="ico">
              <Icon name="download" />
            </span>
            {!collapsed && <span className="txt">Download the app</span>}
          </button>
        )}
        <button
          className={`side-item${route.page === "profile" ? " active" : ""}`}
          title={`${profile.name} · ${profile.role} — view profile`}
          onClick={() => navigate({ page: "profile" })}
        >
          <span className="ico">
            <Icon name="person" />
          </span>
          {!collapsed && <span className="txt">{profile.name}</span>}
          {!collapsed && <span className="badge">{profile.role}</span>}
        </button>
      </div>
      {installMsg && <AlertModal message={installMsg} onClose={() => setInstallMsg(null)} />}
    </nav>
  );
}
