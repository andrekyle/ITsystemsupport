import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { isStaff } from "../types";
import { MODULES } from "../data/course";
import type { ProgressState } from "../types";
import { moduleCompletion } from "../store";
import { Ring } from "./Ring";

interface Props {
  collapsed: boolean;
  route: Route;
  progress: ProgressState;
  profile: Profile;
  navigate: (r: Route) => void;
}

export function Sidebar({ collapsed, route, progress, profile, navigate }: Props) {
  const isPrivileged = isStaff(profile.role);
  const nav = [
    { page: "dashboard" as const, icon: "dashboard", label: "Dashboard" },
    { page: "course" as const, icon: "book", label: "My Course" },
    { page: "progress" as const, icon: "trend", label: "Progress" },
    { page: "poe" as const, icon: "folder", label: "Portfolio of Evidence" },
    { page: "checklist" as const, icon: "checklist", label: "Appendix C Checklist" },
    ...(isPrivileged
      ? [
          {
            page: "students" as const,
            icon: "people",
            label: profile.role === "Super User" ? "Users" : "Students",
          },
        ]
      : []),
    { page: "calendar" as const, icon: "calendar", label: "Training Calendar" },
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

        {!collapsed && <div className="side-label">Modules · SAQA 48573</div>}
        <div className="side-section">
          {MODULES.map((m, i) => {
            const c = moduleCompletion(progress, m.id);
            const active = route.moduleId === m.id;
            return (
              <button
                key={m.id}
                className={`side-item${active ? " active" : ""}`}
                onClick={() => navigate({ page: "module", moduleId: m.id })}
                title={`Module ${i + 1}: ${m.name}`}
              >
                <span className="ico">
                  <Icon name={m.icon} />
                </span>
                {!collapsed && (
                  <>
                    <span className="txt">
                      {i + 1}. {m.name}
                    </span>
                    <span className="side-mini-progress">
                      <Ring value={c} size={24} stroke={2.6} />
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-footer">
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
    </nav>
  );
}
