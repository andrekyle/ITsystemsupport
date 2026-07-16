import { Icon } from "../icons";
import type { Profile, ProgressState, Route } from "../types";
import { Gloss } from "./Course";
import {
  COURSE_META,
  MODULES,
  POE_TOTAL,
  PROGRAMME_MILESTONES,
  TOTAL_UNITS,
} from "../data/course";
import { moduleCompletion, overallStats, unitStatus, usePoe } from "../store";
import { Bar, Ring } from "../components/Ring";

export function Dashboard({
  profile,
  progress,
  navigate,
}: {
  profile: Profile;
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const s = overallStats(progress);
  const { docs: poeDocs } = usePoe(profile.id);
  const poeDone = Object.keys(poeDocs).length;

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
                    US {next.u.us} — {next.u.title}
                  </h3>
                  <span className="sub">
                    {next.m.name} · NQF {next.u.nqf} · {next.u.credits} credits · {next.u.dates}
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "11px 0",
                borderBottom: i < MODULES.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <Icon name={m.icon} size={19} color="var(--azure)" />
              <span style={{ width: 320, fontSize: 14, flexShrink: 0 }}>
                {i + 1}. {m.name}
              </span>
              <span style={{ flex: 1 }}>
                <Bar value={c} green={c === 1} />
              </span>
              <span className="pct" style={{ fontSize: 12.5, color: "var(--ink-3)", width: 38, textAlign: "right" }}>
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
  progress,
  navigate,
}: {
  progress: ProgressState;
  navigate: (r: Route) => void;
}) {
  const s = overallStats(progress);
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
          <table className="data">
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
                    <td>{u.us}</td>
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
