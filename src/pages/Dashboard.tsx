import { useEffect, useState } from "react";
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
import { loadAnnouncements, loadProfiles, moduleCompletion, overallStats, poeItemCount, unitStatus, useOutcomes, usePoe } from "../store";
import { attendanceSignedCount, computeGamification } from "../lib/gamification";
import { Bar, Ring } from "../components/Ring";
import { TokenGauge } from "../components/TokenGauge";
import { Button } from "@fluentui/react-components";
import { VideoMetrics } from "../components/VideoMetrics";
import { bestPoeDocs, bestProgress, fetchCloudLearnerData, type CloudLearnerData } from "../lib/directory";
import { cloudEnabled } from "../lib/supabase";

export function Dashboard({
  profile,
  progress,
  navigate,
}: {
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [savedEvidence, setSavedEvidence] = useState<{ profileId: string; progress: ProgressState; cloud: CloudLearnerData } | null>(null);
  const [evidenceError, setEvidenceError] = useState(false);
  useEffect(() => {
    if (!cloudEnabled || profile.role !== "Learner") return;
    let alive = true;
    setEvidenceError(false);
    void fetchCloudLearnerData().then(data => {
      if (!alive) return;
      setEvidenceError(!data);
      if (data?.progress[profile.id]) {
        setSavedEvidence({ profileId: profile.id, progress: data.progress[profile.id], cloud: data });
      }
    }).catch(error => {
      console.error("Could not load saved XP evidence:", error);
      if (alive) setEvidenceError(true);
    });
    return () => { alive = false; };
  }, [profile.id, profile.role]);
  const dashboardTabs = [
    { id: "overview", label: "Overview", icon: "home" },
    { id: "learning", label: "Learning progress", icon: "trend" },
    ...(profile.role === "Super User" ? [
      { id: "videos", label: "Video metrics", icon: "play" },
      { id: "ai", label: "AI usage", icon: "chart" },
    ] : []),
  ];
  const { docs: poeDocs } = usePoe(profile.id);
  const { outcomes } = useOutcomes();
  // A learner may have a seeded local profile and a different cloud profile
  // id after signing in. Reconcile all linked snapshots so saved completions
  // do not disappear from the dashboard.
  const effectiveProgress = savedEvidence?.profileId === profile.id
    ? bestProgress(profile, savedEvidence.cloud)
    : progress;
  const effectivePoe = savedEvidence?.profileId === profile.id
    ? bestPoeDocs(profile, savedEvidence.cloud)
    : poeDocs;
  const s = overallStats(effectiveProgress, effectivePoe, outcomes[profile.id] ?? {});
  const poeDone = Object.keys(effectivePoe).length;
  const gameProgress = effectiveProgress;
  const gamePoe = effectivePoe;
  const classesAttended = attendanceSignedCount(profile);
  const game = computeGamification(gameProgress, poeItemCount(gamePoe), classesAttended);
  const announcements = loadAnnouncements().slice(0, 2);

  // next unit not yet completed
  const next = (() => {
    for (const m of MODULES)
      for (const u of m.units)
        if (unitStatus(effectiveProgress, u.us) !== "completed") return { m, u };
    return undefined;
  })();

  return (
    <div className="learner-dashboard">
      <div className="eyebrow">
        <Icon name="home" size={15} />
        Dashboard
      </div>
      <h1 className="page-title">Welcome back, {profile.name.split(" ")[0]}</h1>
      <p className="page-sub">
        {COURSE_META.title} · SAQA ID {COURSE_META.saqaId} · NQF Level {COURSE_META.nqfLevel} ·{" "}
        {COURSE_META.credits} Credits
      </p>
      {evidenceError && <p className="auth-error" role="alert">Could not verify all saved XP evidence. The displayed XP may be incomplete; reload to retry.</p>}

      <div className="card-grid dashboard-stats">
        <div className="card stat-card">
          <div className="learner-stat-copy">
            <div className="lbl"><span className="ico"><Icon name="target" size={17} /></span>Overall completion</div>
            <small>Course progress across all modules</small>
          </div>
          <div className="num">{Math.round(s.overall * 100)}%</div>
        </div>
        <div className="card stat-card">
          <div className="learner-stat-copy">
            <div className="lbl"><span className="ico"><Icon name="award" size={17} /></span>Credits earned</div>
            <small>{Math.max(0, COURSE_META.credits - s.creditsEarned)} credits remaining</small>
          </div>
          <div className="num">
            {s.creditsEarned}<span className="stat-total"> / {COURSE_META.credits}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="learner-stat-copy">
            <div className="lbl"><span className="ico"><Icon name="checkCircle" size={17} /></span>Unit standards completed</div>
            <small>{Math.max(0, TOTAL_UNITS - s.unitsCompleted)} unit standards remaining</small>
          </div>
          <div className="num">
            {s.unitsCompleted}<span className="stat-total"> / {TOTAL_UNITS}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="learner-stat-copy">
            <div className="lbl"><span className="ico"><Icon name="book" size={17} /></span>Modules completed</div>
            <small>{Math.max(0, MODULES.length - s.modulesCompleted)} modules remaining</small>
          </div>
          <div className="num">
            {s.modulesCompleted}<span className="stat-total"> / {MODULES.length}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="learner-stat-copy">
            <div className="lbl"><span className="ico"><Icon name="calendar" size={17} /></span>Classes attended</div>
            <small>Signed attendance registers</small>
          </div>
          <div className="num">{classesAttended}</div>
        </div>
        <div
          className="card stat-card clickable"
          onClick={() => navigate({ page: "poe" })}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          <div className="learner-stat-copy">
            <div className="lbl"><span className="ico"><Icon name="folder" size={17} /></span>POE items complete</div>
            <small>{Math.max(0, POE_TOTAL - poeDone)} evidence items remaining</small>
          </div>
          <div className="num">
            {poeDone}<span className="stat-total"> / {POE_TOTAL}</span>
          </div>
        </div>
      </div>

      <section className="dashboard-achievements" aria-label="Achievements">
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

      </section>

      <div className="tabs dashboard-section-tabs" role="tablist" aria-label="Dashboard sections">
        {dashboardTabs.map((item, index) => (
          <button key={item.id} type="button" role="tab" id={`dashboard-tab-${item.id}`}
            aria-controls={`dashboard-panel-${item.id}`} aria-selected={dashboardTab === item.id}
            tabIndex={dashboardTab === item.id ? 0 : -1}
            className={`tab${dashboardTab === item.id ? " active" : ""}`}
            onClick={() => setDashboardTab(item.id)}
            onKeyDown={event => {
              let nextIndex = index;
              if (event.key === "ArrowRight") nextIndex = (index + 1) % dashboardTabs.length;
              else if (event.key === "ArrowLeft") nextIndex = (index + dashboardTabs.length - 1) % dashboardTabs.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = dashboardTabs.length - 1;
              else return;
              event.preventDefault();
              setDashboardTab(dashboardTabs[nextIndex].id);
              document.getElementById(`dashboard-tab-${dashboardTabs[nextIndex].id}`)?.focus();
            }}>
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </div>

      {profile.role === "Super User" && (
        <section className="dashboard-detail-panel" role="tabpanel" tabIndex={0} id="dashboard-panel-videos" aria-labelledby="dashboard-tab-videos" hidden={dashboardTab !== "videos"}>
          <VideoMetrics />
        </section>
      )}

      {profile.role === "Super User" && (
        <section className="dashboard-detail-panel" role="tabpanel" tabIndex={0} id="dashboard-panel-ai" aria-labelledby="dashboard-tab-ai" hidden={dashboardTab !== "ai"}>
          <TokenGauge />
        </section>
      )}

      <section className="dashboard-detail-panel" role="tabpanel" tabIndex={0} id="dashboard-panel-overview" aria-labelledby="dashboard-tab-overview" hidden={dashboardTab !== "overview"}>
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

      </section>

      <section className="dashboard-detail-panel" role="tabpanel" tabIndex={0} id="dashboard-panel-learning" aria-labelledby="dashboard-tab-learning" hidden={dashboardTab !== "learning"}>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="trend" size={20} />
        </span>
        Module progress
      </h2>
      <div className="card dashboard-module-progress">
        {MODULES.map((m, i) => {
          const c = moduleCompletion(effectiveProgress, m.id);
          return (
            <div
              key={m.id}
              className="dash-mod-row"
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
      <div className="card-grid dashboard-milestones">
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
      </section>
    </div>
  );
}

export function DiscoveryDashboard({
  profile,
  progress,
  navigate,
}: {
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const modules = MODULES.map((module) => ({
    ...module,
    completion: moduleCompletion(progress, module.id),
  }));
  const completedUnits = modules.reduce(
    (count, module) =>
      count + module.units.filter((unit) => unitStatus(progress, unit.us) === "completed").length,
    0
  );
  const progressPercent =
    TOTAL_UNITS === 0
      ? 0
      : Math.round(
          (modules.reduce((sum, module) => sum + module.completion * module.units.length, 0) /
            TOTAL_UNITS) *
            100
        );
  const next = modules
    .flatMap((module) => module.units.map((unit) => ({ module, unit })))
    .find(({ unit }) => unitStatus(progress, unit.us) !== "completed");
  const nextRoute: Route = next
    ? { page: "unit", moduleId: next.module.id, unitId: next.unit.us }
    : { page: "course" };
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;

  const gettingStarted = [
    {
      icon: "book",
      title: "Explore your course",
      description: "See the learning plan and find the topics you'll work through.",
      route: { page: "course" as const },
    },
    {
      icon: "people",
      title: "Meet your community",
      description: "Connect with your learning community and find support.",
      route: { page: "community" as const },
    },
    {
      icon: "globe",
      title: "Browse resources",
      description: "Open the shared resources available for your learning.",
      route: { page: "resources" as const },
    },
  ];

  return (
    <div className="discovery-onboarding">
      <section className="discovery-onboarding-hero" aria-labelledby="discovery-welcome-title">
        <div className="discovery-onboarding-hero-copy">
          <div className="discovery-onboarding-kicker">
            <Icon name="target" size={16} />
            Your learning journey
          </div>
          <h1 id="discovery-welcome-title">Welcome to Discovery Learn, {firstName}</h1>
          <p>
            Get started with your learning plan, meet your community, and pick up where you left
            off.
          </p>
          <div className="discovery-onboarding-actions">
            <button
              type="button"
              className="discovery-onboarding-primary"
              onClick={() => navigate(nextRoute)}
            >
              <Icon name="play" size={17} />
              {next ? "Continue learning" : "Review your course"}
            </button>
            <button
              type="button"
              className="discovery-onboarding-secondary"
              onClick={() => navigate({ page: "course" })}
            >
              Explore course
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </div>
        <div className="discovery-onboarding-progress" aria-label="Course progress">
          <div className="discovery-onboarding-progress-head">
            <span>Course progress</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div
            className="discovery-onboarding-progress-track"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="discovery-onboarding-progress-note">
            {completedUnits} of {TOTAL_UNITS} unit standards completed
          </span>
        </div>
      </section>

      <section aria-labelledby="discovery-start-title">
        <div className="discovery-onboarding-section-heading">
          <div>
            <span className="discovery-onboarding-eyebrow">A good place to begin</span>
            <h2 id="discovery-start-title">Get started</h2>
          </div>
        </div>
        <div className="discovery-onboarding-start-grid">
          {gettingStarted.map((item, index) => (
            <button
              type="button"
              className="discovery-onboarding-start-card"
              key={item.title}
              onClick={() => navigate(item.route)}
            >
              <span className="discovery-onboarding-step">0{index + 1}</span>
              <span className="discovery-onboarding-card-icon">
                <Icon name={item.icon} size={21} />
              </span>
              <strong>{item.title}</strong>
              <span className="discovery-onboarding-card-description">{item.description}</span>
              <span className="discovery-onboarding-card-link">
                Open <Icon name="chevronRight" size={15} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="discovery-plan-title">
        <div className="discovery-onboarding-section-heading">
          <div>
            <span className="discovery-onboarding-eyebrow">Your personalized learning plan</span>
            <h2 id="discovery-plan-title">{COURSE_META.title}</h2>
          </div>
          <button
            type="button"
            className="discovery-onboarding-text-link"
            onClick={() => navigate({ page: "progress" })}
          >
            View progress <Icon name="chevronRight" size={15} />
          </button>
        </div>
        <div className="discovery-onboarding-module-list">
          {modules.map((module, index) => (
            <button
              type="button"
              className="discovery-onboarding-module"
              key={module.id}
              onClick={() => navigate({ page: "module", moduleId: module.id })}
            >
              <span className="discovery-onboarding-module-number">
                {module.completion === 1 ? (
                  <Icon name="checkCircle" size={19} />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span className="discovery-onboarding-module-main">
                <span className="discovery-onboarding-module-title">{module.name}</span>
                <span className="discovery-onboarding-module-meta">
                  {module.units.length} {module.units.length === 1 ? "unit" : "units"}
                </span>
              </span>
              <span className="discovery-onboarding-module-meter">
                <span className="discovery-onboarding-module-track">
                  <span style={{ width: `${Math.round(module.completion * 100)}%` }} />
                </span>
                <span>{Math.round(module.completion * 100)}%</span>
              </span>
              <Icon name="chevronRight" size={17} />
            </button>
          ))}
        </div>
      </section>
    </div>
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
  const [selectedModule, setSelectedModule] = useState(MODULES[0]?.id ?? "");
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

      <div className="tabs" role="tablist" aria-label="Module progress">
        {MODULES.map((m, index) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            id={`progress-tab-${m.id}`}
            aria-controls={`progress-panel-${m.id}`}
            aria-selected={selectedModule === m.id}
            tabIndex={selectedModule === m.id ? 0 : -1}
            className={`tab${selectedModule === m.id ? " active" : ""}`}
            title={m.name}
            onClick={() => setSelectedModule(m.id)}
            onKeyDown={(event) => {
              let nextIndex = index;
              if (event.key === "ArrowRight") nextIndex = (index + 1) % MODULES.length;
              else if (event.key === "ArrowLeft") nextIndex = (index + MODULES.length - 1) % MODULES.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = MODULES.length - 1;
              else return;
              event.preventDefault();
              setSelectedModule(MODULES[nextIndex].id);
              document.getElementById(`progress-tab-${MODULES[nextIndex].id}`)?.focus();
            }}
          >
            <Icon name={m.icon} size={15} /> Module {index + 1}
          </button>
        ))}
      </div>

      {MODULES.map((m, i) => (
        <section key={m.id} role="tabpanel" id={`progress-panel-${m.id}`}
          aria-labelledby={`progress-tab-${m.id}`} hidden={selectedModule !== m.id}>
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
        </section>
      ))}
    </>
  );
}
