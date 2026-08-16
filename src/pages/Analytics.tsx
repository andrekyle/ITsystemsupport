import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import { COURSE_META, MODULES, POE_TOTAL, TOTAL_UNITS } from "../data/course";
import {
  loadProfiles,
  moduleCompletion,
  overallStats,
  poeItemCount,
} from "../store";
import { downloadText } from "../lib/audit";
import {
  attendanceRegisterCount,
  attendanceSignedCount,
  computeGamification,
} from "../lib/gamification";
import {
  bestPoeDocs,
  bestProgress,
  fetchCloudLearnerData,
  remoteOnlyProfiles,
  type CloudLearnerData,
} from "../lib/directory";
import { Avatar } from "../components/Avatar";
import { Bar } from "../components/Ring";

/**
 * Learning analytics: completion, participation and performance per learner
 * and for the cohort, with at-risk flags and CSV export for reporting.
 */

interface LearnerRow {
  profile: Profile;
  completion: number;
  unitsCompleted: number;
  creditsEarned: number;
  quizAvg: number | null;
  quizzesTaken: number;
  exerciseAvg: number | null;
  poeDone: number;
  attendance: number;
  attendanceRate: number | null;
  lastLogin: string | undefined;
  daysSinceSeen: number | null;
  xp: number;
  level: number;
  levelName: string;
  atRisk: boolean;
  riskReasons: string[];
}

function analyse(p: Profile, registers: number, cloud: CloudLearnerData | null): LearnerRow {
  const progress = bestProgress(p.id, cloud);
  const s = overallStats(progress);
  const docs = bestPoeDocs(p.id, cloud);

  let quizBestSum = 0;
  let quizCount = 0;
  let exSum = 0;
  let exCount = 0;
  for (const unit of Object.values(progress.units)) {
    const results = [...(unit.quiz ? [unit.quiz] : []), ...Object.values(unit.quizzes ?? {})];
    for (const q of results) {
      if (!q.total) continue;
      quizBestSum += q.best / q.total;
      quizCount++;
    }
    for (const ex of Object.values(unit.exercises ?? {})) {
      if (!ex.total) continue;
      exSum += ex.best / ex.total;
      exCount++;
    }
  }

  const attendance = attendanceSignedCount(p.id);
  const attendanceRate = registers > 0 ? attendance / registers : null;
  const daysSinceSeen = p.lastLogin
    ? Math.floor((Date.now() - new Date(p.lastLogin).getTime()) / (24 * 3600 * 1000))
    : null;

  const riskReasons: string[] = [];
  if (s.overall < 0.25) riskReasons.push("low completion");
  if (attendanceRate !== null && attendanceRate < 0.5) riskReasons.push("low attendance");
  if (daysSinceSeen === null) riskReasons.push("never signed in");
  else if (daysSinceSeen > 14) riskReasons.push(`inactive ${daysSinceSeen}d`);
  if (quizCount > 0 && quizBestSum / quizCount < 0.5) riskReasons.push("low quiz scores");

  const g = computeGamification(progress, poeItemCount(docs), attendance);

  return {
    profile: p,
    completion: s.overall,
    unitsCompleted: s.unitsCompleted,
    creditsEarned: s.creditsEarned,
    quizAvg: quizCount ? quizBestSum / quizCount : null,
    quizzesTaken: quizCount,
    exerciseAvg: exCount ? exSum / exCount : null,
    poeDone: poeItemCount(docs),
    attendance,
    attendanceRate,
    lastLogin: p.lastLogin,
    daysSinceSeen,
    xp: g.xp,
    level: g.level,
    levelName: g.levelName,
    atRisk: riskReasons.length >= 2,
    riskReasons,
  };
}

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

function rowsCsv(rows: LearnerRow[], registers: number): string {
  const cell = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const header =
    "Learner,Completion %,Units completed,Credits,Avg quiz %,Quizzes taken,Avg exercise %,POE items,Attendance,Attendance %,Last seen,XP,Level,At risk,Risk reasons";
  const body = rows.map((r) =>
    [
      cell(r.profile.name),
      cell(Math.round(r.completion * 100)),
      cell(r.unitsCompleted),
      cell(r.creditsEarned),
      cell(r.quizAvg === null ? "" : Math.round(r.quizAvg * 100)),
      cell(r.quizzesTaken),
      cell(r.exerciseAvg === null ? "" : Math.round(r.exerciseAvg * 100)),
      cell(r.poeDone),
      cell(`${r.attendance}/${registers}`),
      cell(r.attendanceRate === null ? "" : Math.round(r.attendanceRate * 100)),
      cell(r.lastLogin ? new Date(r.lastLogin).toLocaleString() : "never"),
      cell(r.xp),
      cell(`${r.level} ${r.levelName}`),
      cell(r.atRisk ? "YES" : "no"),
      cell(r.riskReasons.join("; ")),
    ].join(",")
  );
  return [header, ...body].join("\r\n");
}

type SortKey = "name" | "completion" | "quiz" | "attendance" | "seen" | "xp";

const SORT_LABELS: Record<SortKey, string> = {
  completion: "Completion",
  quiz: "Quiz average",
  attendance: "Attendance",
  seen: "Last seen",
  xp: "XP",
  name: "Name",
};

export function AnalyticsPage({ profile }: { profile: Profile; navigate: (r: Route) => void }) {
  const registers = attendanceRegisterCount();
  const [sort, setSort] = useState<SortKey>("completion");
  const [ascending, setAscending] = useState(false);
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchCloudLearnerData().then((d) => {
      if (alive && d) setCloud(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Click the active sort again to flip direction; a new column resets to its natural order. */
  const applySort = (key: SortKey) => {
    if (key === sort) {
      setAscending((a) => !a);
    } else {
      setSort(key);
      setAscending(key === "name" || key === "seen"); // A→Z and most-recent-first feel natural
    }
  };

  const rows = useMemo(() => {
    const local = loadProfiles().filter((p) => p.role === "Learner");
    const remote = remoteOnlyProfiles(loadProfiles(), cloud?.profiles ?? []).filter(
      (p) => p.role === "Learner"
    );
    const all = [...local, ...remote];
    return all.map((p) => analyse(p, registers, cloud));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registers, profile.id, cloud]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    switch (sort) {
      case "name":
        arr.sort((a, b) => b.profile.name.localeCompare(a.profile.name));
        break;
      case "quiz":
        arr.sort((a, b) => (b.quizAvg ?? -1) - (a.quizAvg ?? -1));
        break;
      case "attendance":
        arr.sort((a, b) => (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1));
        break;
      case "seen":
        arr.sort((a, b) => (b.daysSinceSeen ?? 9999) - (a.daysSinceSeen ?? 9999));
        break;
      case "xp":
        arr.sort((a, b) => b.xp - a.xp);
        break;
      default:
        arr.sort((a, b) => b.completion - a.completion);
    }
    if (ascending) arr.reverse();
    return arr;
  }, [rows, sort, ascending]);

  const cohort = useMemo(() => {
    const n = rows.length;
    const avg = (f: (r: LearnerRow) => number | null) => {
      const vals = rows.map(f).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      n,
      completion: avg((r) => r.completion),
      quiz: avg((r) => r.quizAvg),
      attendance: avg((r) => r.attendanceRate),
      atRisk: rows.filter((r) => r.atRisk).length,
      activeWeek: rows.filter((r) => r.daysSinceSeen !== null && r.daysSinceSeen <= 7).length,
    };
  }, [rows]);

  const moduleAvgs = useMemo(
    () =>
      MODULES.map((m) => {
        const vals = rows.map((r) => moduleCompletion(bestProgress(r.profile.id, cloud), m.id));
        return {
          module: m,
          avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
        };
      }),
    [rows, cloud]
  );

  const sortBtn = (key: SortKey, label: string) => (
    <button
      key={key}
      className={`sort-chip${sort === key ? " active" : ""}`}
      title={
        sort === key
          ? `Sorted by ${SORT_LABELS[key].toLowerCase()} — click to reverse the order`
          : `Sort the table by ${SORT_LABELS[key].toLowerCase()}`
      }
      aria-pressed={sort === key}
      onClick={() => applySort(key)}
    >
      {label}
      {sort === key && <span aria-hidden="true"> {ascending ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <>
      <div className="eyebrow">
        <Icon name="chart" size={15} />
        Analytics
      </div>
      <h1 className="page-title">Learning analytics</h1>
      <p className="page-sub">
        Completion · participation · performance — {COURSE_META.title} ({TOTAL_UNITS} unit
        standards, {POE_TOTAL} POE items, {registers} registers held)
      </p>

      <div className="card-grid">
        <div className="card stat-card">
          <span className="ico">
            <Icon name="people" size={26} />
          </span>
          <div>
            <div className="num">{cohort.n}</div>
            <div className="lbl">Learners</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="target" size={26} />
          </span>
          <div>
            <div className="num">{pct(cohort.completion)}</div>
            <div className="lbl">Avg completion</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="award" size={26} />
          </span>
          <div>
            <div className="num">{pct(cohort.quiz)}</div>
            <div className="lbl">Avg best quiz score</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="clipboard" size={26} />
          </span>
          <div>
            <div className="num">{pct(cohort.attendance)}</div>
            <div className="lbl">Avg attendance</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="clock" size={26} />
          </span>
          <div>
            <div className="num">{cohort.activeWeek}</div>
            <div className="lbl">Active in last 7 days</div>
          </div>
        </div>
        <div className="card stat-card">
          <span className="ico">
            <Icon name="bell" size={26} />
          </span>
          <div>
            <div className="num">{cohort.atRisk}</div>
            <div className="lbl">At-risk learners</div>
          </div>
        </div>
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="layers" size={20} />
        </span>
        Cohort progress by module
      </h2>
      <div className="card">
        {moduleAvgs.map(({ module: m, avg }, i) => (
          <div className="module-avg-row" key={m.id}>
            <span className="module-avg-name">
              {i + 1}. {m.name}
            </span>
            <Bar value={avg} />
            <span className="module-avg-pct">{Math.round(avg * 100)}%</span>
          </div>
        ))}
        {rows.length === 0 && <p className="mini-note">No learners enrolled yet.</p>}
      </div>

      <h2 className="section-title">
        <span className="ico">
          <Icon name="trend" size={20} />
        </span>
        Learner detail
        <span style={{ flex: 1 }} />
        <button
          className="btn ghost sm"
          disabled={rows.length === 0}
          onClick={() =>
            downloadText(
              `learning-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
              rowsCsv(sorted, registers)
            )
          }
        >
          <Icon name="download" size={15} /> Export CSV
        </button>
      </h2>
      <div className="card" style={{ overflowX: "auto" }}>
        <div className="sort-row">
          <span className="mini-note">Sort by:</span>
          {sortBtn("completion", "Completion")}
          {sortBtn("quiz", "Quiz avg")}
          {sortBtn("attendance", "Attendance")}
          {sortBtn("seen", "Last seen")}
          {sortBtn("xp", "XP")}
          {sortBtn("name", "Name")}
          <span style={{ flex: 1 }} />
          <span className="mini-note">
            {sorted.length} {sorted.length === 1 ? "learner" : "learners"} · sorted by{" "}
            {SORT_LABELS[sort].toLowerCase()} {ascending ? "(ascending)" : "(descending)"}
          </span>
        </div>
        {sorted.length === 0 ? (
          <p className="mini-note">No learners enrolled yet.</p>
        ) : (
          <table className="data analytics-table">
            <thead>
              <tr>
                <th className={`sortable${sort === "name" ? " sorted" : ""}`} onClick={() => applySort("name")}>
                  Learner{sort === "name" ? (ascending ? " ↑" : " ↓") : ""}
                </th>
                <th className={`sortable${sort === "completion" ? " sorted" : ""}`} onClick={() => applySort("completion")}>
                  Completion{sort === "completion" ? (ascending ? " ↑" : " ↓") : ""}
                </th>
                <th>Units</th>
                <th>Credits</th>
                <th className={`sortable${sort === "quiz" ? " sorted" : ""}`} onClick={() => applySort("quiz")}>
                  Quiz avg{sort === "quiz" ? (ascending ? " ↑" : " ↓") : ""}
                </th>
                <th>Exercises</th>
                <th>POE</th>
                <th className={`sortable${sort === "attendance" ? " sorted" : ""}`} onClick={() => applySort("attendance")}>
                  Attendance{sort === "attendance" ? (ascending ? " ↑" : " ↓") : ""}
                </th>
                <th className={`sortable${sort === "seen" ? " sorted" : ""}`} onClick={() => applySort("seen")}>
                  Last seen{sort === "seen" ? (ascending ? " ↑" : " ↓") : ""}
                </th>
                <th className={`sortable${sort === "xp" ? " sorted" : ""}`} onClick={() => applySort("xp")}>
                  XP{sort === "xp" ? (ascending ? " ↑" : " ↓") : ""}
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.profile.id} className={r.atRisk ? "at-risk" : ""}>
                  <td>
                    <span className="cell-person">
                      <Avatar profile={r.profile} size={22} />
                      {r.profile.name}
                    </span>
                  </td>
                  <td>
                    <span className="cell-bar">
                      <Bar value={r.completion} />
                      {Math.round(r.completion * 100)}%
                    </span>
                  </td>
                  <td>
                    {r.unitsCompleted}/{TOTAL_UNITS}
                  </td>
                  <td>{r.creditsEarned}</td>
                  <td>
                    {pct(r.quizAvg)}
                    {r.quizzesTaken > 0 && (
                      <span className="mini-note"> ({r.quizzesTaken})</span>
                    )}
                  </td>
                  <td>{pct(r.exerciseAvg)}</td>
                  <td>
                    {r.poeDone}/{POE_TOTAL}
                  </td>
                  <td>
                    {registers ? `${r.attendance}/${registers}` : "—"}
                    {r.attendanceRate !== null && (
                      <span className="mini-note"> ({Math.round(r.attendanceRate * 100)}%)</span>
                    )}
                  </td>
                  <td className="nowrap">
                    {r.daysSinceSeen === null
                      ? "never"
                      : r.daysSinceSeen === 0
                        ? "today"
                        : `${r.daysSinceSeen}d ago`}
                  </td>
                  <td>
                    {r.xp}
                    <span className="mini-note"> L{r.level}</span>
                  </td>
                  <td>
                    {r.atRisk ? (
                      <span className="status-chip bad" title={r.riskReasons.join(", ")}>
                        At risk
                      </span>
                    ) : (
                      <span className="status-chip ok">On track</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mini-note">
          A learner is flagged <strong>at risk</strong> when two or more apply: completion below
          25%, attendance below 50%, inactive for 14+ days, average quiz score below 50%.
        </p>
      </div>
    </>
  );
}
