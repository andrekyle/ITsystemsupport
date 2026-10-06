import { Icon } from "../icons";
import type { Profile, ProgressState, Route } from "../types";
import { Gloss } from "./Course";
import {
  COURSE_META,
  MODULES,
  POE_TOTAL,
  PROGRAMME_MILESTONES,
  TOTAL_UNITS,
  isSaqaUnit,
  usLabel,
} from "../data/course";
import { loadAnnouncements, loadProfiles, moduleCompletion, overallStats, unitStatus, useOutcomes, usePoe } from "../store";
import { attendanceSignedCount, computeGamification } from "../lib/gamification";
import { Bar, Ring } from "../components/Ring";
import { TokenGauge } from "../components/TokenGauge";
import { Button } from "@fluentui/react-components";

export function Dashboard({
  profile,
  progress,
  navigate,
  adminMode = false,
}: {
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
  adminMode?: boolean;
}) {
  const { docs: poeDocs } = usePoe(profile.id);
  const { outcomes } = useOutcomes();
  const s = overallStats(progress, poeDocs, outcomes[profile.id] ?? {});
  const poeDone = Object.keys(poeDocs).length;
  const game = computeGamification(progress, poeDone, attendanceSignedCount(profile.id));
  const announcements = loadAnnouncements().slice(0, 2);

  if (profile.role === "Super User" && adminMode) {
    const users = loadProfiles();
    const learners = users.filter(user => user.role === "Learner").length;
    const staff = users.length - learners;
    const actions: {
      page: Route["page"];
      image: string;
      title: string;
      detail: string;
      icon: string;
      eyebrow: string;
      metric?: string;
      metricLabel?: string;
      tone: string;
    }[] = [
      { page: "students", image: "/admin-images/users-reference.png", title: "Users & students", detail: "Manage accounts, roles, learner records and access.", icon: "people", eyebrow: "Identity & access", metric: String(users.length), metricLabel: "total users", tone: "azure" },
      { page: "analytics", image: "/admin-images/analytics-reference.png", title: "Learning analytics", detail: "Review engagement, completion and assessment performance.", icon: "chart", eyebrow: "Performance", metricLabel: "live insights", tone: "emerald" },
      { page: "trackerReport", image: "/admin-images/tracker-reference.png", title: "Learner tracker", detail: "Monitor individual and cohort progress in one report.", icon: "target", eyebrow: "Progress oversight", metric: String(learners), metricLabel: "learners tracked", tone: "violet" },
      { page: "attendance", image: "/admin-images/attendance-reference.png", title: "Attendance", detail: "Capture registers and verify participation records.", icon: "calendar", eyebrow: "Session control", metricLabel: "daily registers", tone: "amber" },
      { page: "course", image: "/admin-images/course-reference.png", title: "Course content", detail: "Build units, edit lessons and manage learning materials.", icon: "book", eyebrow: "Curriculum", metricLabel: "author lessons", tone: "cyan" },
      { page: "forms", image: "/admin-images/forms-reference.png", title: "Forms", detail: "Create and maintain operational and learner forms.", icon: "document", eyebrow: "Documentation", metricLabel: "digital workflows", tone: "rose" },
    ];
    const operations: { page: Route["page"]; icon: string; title: string; detail: string; eyebrow: string }[] = [
      { page: "compliance", icon: "shield", title: "Compliance", detail: "Review programme requirements, evidence and risk areas.", eyebrow: "Governance" },
      { page: "calendar", icon: "calendar", title: "Training calendar", detail: "Plan sessions, delivery dates and upcoming activity.", eyebrow: "Scheduling" },
      { page: "onboarding", icon: "folder", title: "Onboarding packs", detail: "Publish induction material and starter resources.", eyebrow: "Setup" },
      { page: "reports", icon: "robot", title: "AI Assistant", detail: "Generate reports and operational outputs faster.", eyebrow: "Automation" },
    ];
    return <section className="admin-dashboard">
      <div className="eyebrow"><Icon name="shield" size={15}/> Administration</div>
      <div className="admin-hero card">
        <div className="admin-dashboard-head"><div><h1 className="page-title">Admin workspace</h1><p className="page-sub">Run delivery, people, reporting and compliance from one cleaner control surface.</p></div><span className="admin-mode-badge"><Icon name="shield" size={15}/> Admin mode</span></div>
        <div className="admin-summary" aria-label="User summary">
          <div className="admin-summary-card"><span className="admin-summary-label">Platform users</span><strong>{users.length}</strong><small>All active accounts across the workspace</small></div>
          <div className="admin-summary-card"><span className="admin-summary-label">Learners</span><strong>{learners}</strong><small>Tracked for progress, attendance and outcomes</small></div>
          <div className="admin-summary-card"><span className="admin-summary-label">Staff</span><strong>{staff}</strong><small>Facilitators, assessors, moderators and admins</small></div>
        </div>
      </div>
      <h2 className="section-title"><span className="ico"><Icon name="dashboard" size={20}/></span>Management tools</h2>
      <div className="admin-action-grid">{actions.map(action => <button type="button" key={action.page} className={`card admin-action-card tone-${action.tone}`} onClick={() => navigate({ page: action.page })}>
        <span className="admin-action-media"><img src={action.image} alt="" aria-hidden="true" /></span>
        <span className="admin-action-body">
          <span className="admin-action-topline">{action.eyebrow}</span>
          <span className="admin-action-copy"><strong>{action.title}</strong><small>{action.detail}</small></span>
          <span className="admin-action-footer">{action.metric ? <span className="admin-action-metric"><strong>{action.metric}</strong> {action.metricLabel}</span> : <span className="admin-action-metric admin-action-metric-muted">{action.metricLabel}</span>}<span className="admin-action-cta">Open workspace <Icon name="chevronRight" size={15}/></span></span>
        </span>
        <span className="admin-action-badge"><Icon name={action.icon} size={18}/></span>
      </button>)}</div>
      <h2 className="section-title"><span className="ico"><Icon name="target" size={20}/></span>Operations</h2>
      <div className="admin-operations">
        {operations.map(item => <button type="button" key={item.page} className="card clickable admin-operation-card" onClick={() => navigate({page:item.page})}>
          <span className="admin-operation-icon"><Icon name={item.icon} size={20}/></span>
          <span className="admin-operation-copy"><em>{item.eyebrow}</em><strong>{item.title}</strong><small>{item.detail}</small></span>
          <Icon name="chevronRight" size={18}/>
        </button>)}
      </div>
    </section>;
  }

  // next unit not yet completed
  const next = (() => {
    for (const m of MODULES)
      for (const u of m.units)
        if (unitStatus(progress, u.us) !== "completed") return { m, u };
    return undefined;
  })();

  return (
    <>
      <div className="eyebrow">
        <Icon name="home" size={15} />
        Dashboard
      </div>
      <h1 className="page-title">Welcome back, {profile.name.split(" ")[0]}</h1>
      <p className="page-sub">
        {COURSE_META.title} · SAQA ID {COURSE_META.saqaId} · NQF Level {COURSE_META.nqfLevel} ·{" "}
        {COURSE_META.credits} Credits
      </p>

      <div className="card-grid">
        <div className="card stat-card">
          <span className="ico">
            <Icon name="target" size={26} />
          </span>
          <div>
            <div className="num">{Math.round(s.overall * 100)}%</div>
            <div className="lbl">Overall completion</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="award" size={26} />
          </span>
          <div>
            <div className="num">
              {s.creditsEarned}
              <span style={{ fontSize: 15, color: "var(--ink-3)" }}> / {COURSE_META.credits}</span>
            </div>
            <div className="lbl">Credits earned</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="checkCircle" size={26} />
          </span>
          <div>
            <div className="num">
              {s.unitsCompleted}
              <span style={{ fontSize: 15, color: "var(--ink-3)" }}> / {TOTAL_UNITS}</span>
            </div>
            <div className="lbl">Unit standards completed</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="book" size={26} />
          </span>
          <div>
            <div className="num">
              {s.modulesCompleted}
              <span style={{ fontSize: 15, color: "var(--ink-3)" }}> / {MODULES.length}</span>
            </div>
            <div className="lbl">Modules completed</div>
          </div>
        </div>
        <div
          className="card stat-card clickable"
          onClick={() => navigate({ page: "poe" })}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          <span className="ico">
            <Icon name="folder" size={26} />
          </span>
          <div>
            <div className="num">
              {poeDone}
              <span style={{ fontSize: 15, color: "var(--ink-3)" }}> / {POE_TOTAL}</span>
            </div>
            <div className="lbl">POE items complete</div>
          </div>
        </div>
      </div>

      {profile.role === "Super User" && <TokenGauge />}

      <div className="card xp-card">
        <div className="xp-head">
          <span className="xp-level">
            <Icon name="award" size={22} />
            Level {game.level} · {game.levelName}
          </span>
          <span className="xp-points">
            {game.xp} XP
            {game.nextLevelXp !== null && (
              <span className="mini-note"> · {game.nextLevelXp - game.xp} XP to next level</span>
            )}
          </span>
        </div>
        <Bar
          value={
            game.nextLevelXp === null
              ? 1
              : (game.xp - game.levelFloor) / (game.nextLevelXp - game.levelFloor)
          }
          green={game.nextLevelXp === null}
        />
        <div className="badge-strip">
          {game.badges.map((b) => (
            <span
              key={b.id}
              className={`game-badge${b.earned ? " earned" : ""}`}
              title={`${b.name} — ${b.desc}${b.earned ? "" : " (locked)"}`}
            >
              <Icon name={b.icon} size={16} />
              <span className="game-badge-name">{b.name}</span>
            </span>
          ))}
        </div>
        <p className="mini-note" style={{ margin: "6px 0 0" }}>
          Earn XP by finishing activities, scoring 80%+ on quizzes, passing exercises, uploading POE
          evidence and signing the register. See the class leaderboard on the{" "}
          <a
            href="#community"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: "community" });
            }}
          >
            Community page
          </a>
          .
        </p>
      </div>

      {announcements.length > 0 && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="bell" size={20} />
            </span>
            Latest announcements
          </h2>
          {announcements.map((a) => (
            <button
              key={a.id}
              className="card clickable announce-teaser"
              onClick={() => navigate({ page: "community" })}
            >
              <strong>{a.title}</strong>
              <span className="announce-teaser-body">{a.body}</span>
              <span className="mini-note">
                {a.by} ({a.role}) · {new Date(a.at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </>
      )}

      {next && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="play" size={20} />
            </span>
            Continue learning
          </h2>
          <button
            className="card clickable"
            onClick={() => navigate({ page: "unit", moduleId: next.m.id, unitId: next.u.us })}
          >
            <div className="module-card">
              <div className="head">
                <span className="ico">
                  <Icon name={next.m.icon} size={22} />
                </span>
                <div style={{ flex: 1 }}>
                  <h3>
                    {usLabel(next.u.us)} — {next.u.title}
                  </h3>
                  <span className="sub">
                    {next.m.name} · NQF {next.u.nqf}
                    {next.u.credits > 0 ? ` · ${next.u.credits} credits` : ""} · {next.u.dates}
                  </span>
                </div>
                <Icon name="chevronRight" size={18} color="var(--ink-3)" />
              </div>
            </div>
          </button>
        </>
      )}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="trend" size={20} />
        </span>
        Module progress
      </h2>
      <div className="card" style={{ padding: "8px 18px" }}>
        {MODULES.map((m, i) => {
          const c = moduleCompletion(progress, m.id);
          return (
            <div
              key={m.id}
              className="dash-mod-row"
              style={{
                borderBottom: i < MODULES.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <Icon name={m.icon} size={19} color="var(--azure)" />
              <span className="dash-mod-name">
                {i + 1}. {m.name}
              </span>
              <span className="dash-mod-bar">
                <Bar value={c} green={c === 1} />
              </span>
              <span className="pct dash-mod-pct">
                {Math.round(c * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="calendar" size={20} />
        </span>
        Programme milestones
      </h2>
      <div className="card-grid">
        {PROGRAMME_MILESTONES.map((ms) => (
          <div className="card stat-card" key={ms.name}>
            <span className="ico">
              <Icon name={ms.icon} size={24} />
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                <Gloss text={ms.name} />
              </div>
              <div className="lbl">
                {ms.dates} · {ms.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="callout">
        <span className="ico">
          <Icon name="info" size={19} />
        </span>
        <span>
          Learner progress reports are updated in learner files and the LMS <strong>monthly</strong>.
          Formative assessment records are submitted within <strong>5 working days</strong> after each
          assessment. See{" "}
          <a
            href="#deliverables"
            onClick={(e) => {
              e.preventDefault();
              navigate({ page: "deliverables" });
            }}
          >
            Deliverables
          </a>{" "}
          for the full schedule.
        </span>
      </div>
    </>
  );
}

export function ProgressPage({
  profile,
  progress,
  navigate,
}: {
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const { docs: poeDocs } = usePoe(profile.id);
  const { outcomes } = useOutcomes();
  const s = overallStats(progress, poeDocs, outcomes[profile.id] ?? {});
  return (
    <>
      <div className="eyebrow">
        <Icon name="trend" size={15} />
        Progress tracking
      </div>
      <h1 className="page-title">My progress</h1>
      <p className="page-sub">
        Track completion across all {TOTAL_UNITS} unit standards, {COURSE_META.credits} credits and{" "}
        {MODULES.length} modules of SAQA ID {COURSE_META.saqaId}.
      </p>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
        <Ring value={s.overall} size={110} stroke={9} showLabel />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="meta-row" style={{ margin: 0 }}>
            <span className="pill">
              <span className="ico">
                <Icon name="checkCircle" size={15} />
              </span>
              {s.unitsCompleted} completed
            </span>
            <span className="pill">
              <span className="ico">
                <Icon name="clock" size={15} />
              </span>
              {s.unitsInProgress} in progress
            </span>
            <span className="pill">
              <span className="ico">
                <Icon name="award" size={15} />
              </span>
              {s.creditsEarned} / {COURSE_META.credits} credits
            </span>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            A unit standard is complete when its lesson, formative assessment, summative assessment
            and POE evidence are all marked done.
          </p>
        </div>
      </div>

      {MODULES.map((m, i) => (
        <div key={m.id}>
          <h2 className="section-title">
            <span className="ico">
              <Icon name={m.icon} size={20} />
            </span>
            Module {i + 1}: {m.name}
          </h2>
          <table className="data training-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>US ID</th>
                <th>Unit standard title</th>
                <th style={{ width: 60 }}>NQF</th>
                <th style={{ width: 70 }}>Credits</th>
                <th style={{ width: 130 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {m.units.map((u) => {
                const st = unitStatus(progress, u.us);
                return (
                  <tr
                    key={u.us}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate({ page: "unit", moduleId: m.id, unitId: u.us })}
                  >
                    <td>
                      {isSaqaUnit(u.us) ? (
                        <a
                          className="us-link"
                          href={`https://allqs.saqa.org.za/showUnitStandard.php?id=${u.us}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`View US ${u.us} on SAQA`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {u.us}
                        </a>
                      ) : (
                        <span className="us-code">{u.us}</span>
                      )}
                    </td>
                    <td>{u.title}</td>
                    <td>{u.nqf}</td>
                    <td>{u.credits}</td>
                    <td>
                      {st === "completed" && (
                        <span className="chip done">
                          <Icon name="checkCircle" size={13} /> Complete
                        </span>
                      )}
                      {st === "in-progress" && (
                        <span className="chip progress">
                          <Icon name="clock" size={13} /> In progress
                        </span>
                      )}
                      {st === "not-started" && (
                        <span className="chip none">
                          <Icon name="circle" size={13} /> Not started
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}