import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, Route } from "../types";
import { loadProfiles } from "../store";
import { TENANT } from "../lib/tenant";
import { cloudEnabled } from "../lib/supabase";
import { dedupeProfiles, fetchCloudLearnerData, mergeProfileWithCloud, remoteOnlyProfiles, type CloudLearnerData } from "../lib/directory";
import { analyse } from "./Analytics";
import "./admin-dashboard.css";

const daysAgo = (date?: string) => date && Number.isFinite(Date.parse(date))
  ? Math.floor((Date.now() - Date.parse(date)) / 86_400_000) : null;
const percent = (value: number) => `${Math.round(value * 100)}%`;

export function AdminDashboardPage({ profile, navigate }: { profile: Profile; navigate: (route: Route) => void }) {
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [loading, setLoading] = useState(cloudEnabled);
  const [error, setError] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(async () => {
    if (!cloudEnabled) { setUpdated(new Date()); setRevision((n) => n + 1); return; }
    setLoading(true);
    try {
      const result = await fetchCloudLearnerData();
      if (!result) { setError(true); return; }
      setCloud(result);
      setError(false);
      setUpdated(new Date());
      setRevision((n) => n + 1);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const users = useMemo(() => {
    const local = loadProfiles();
    return dedupeProfiles([
      ...local.map((p) => mergeProfileWithCloud(p, cloud)),
      ...remoteOnlyProfiles(local, cloud?.profiles ?? []),
    ]);
  }, [cloud, revision]);
  const learners = useMemo(() => users.filter((p) => p.role === "Learner").map((p) => analyse(p, cloud)), [users, cloud]);
  const staff = users.length - learners.length;
  const active7 = users.filter((p) => { const d = daysAgo(p.lastLogin); return d !== null && d >= 0 && d < 7; }).length;
  const active30 = users.filter((p) => { const d = daysAgo(p.lastLogin); return d !== null && d >= 0 && d < 30; }).length;
  const never = users.filter((p) => !p.lastLogin).length;
  const atRisk = learners.filter((r) => r.atRisk).length;
  const average = learners.length ? learners.reduce((sum, r) => sum + r.completion, 0) / learners.length : 0;
  const completed = learners.filter((r) => r.completion >= 1).length;
  const quizRows = learners.filter((r) => r.quizAvg !== null);
  const quizAverage = quizRows.length ? quizRows.reduce((sum, r) => sum + (r.quizAvg ?? 0), 0) / quizRows.length : null;
  const attendanceRows = learners.filter((r) => r.attendanceRate !== null);
  const attendanceAverage = attendanceRows.length ? attendanceRows.reduce((sum, r) => sum + (r.attendanceRate ?? 0), 0) / attendanceRows.length : null;

  const roles = ["Learner", "Facilitator", "Assessor", "Moderator", "Admin", "Super User"].map((name) => ({ name, count: users.filter((p) => p.role === name).length }));
  const completion = [
    { name: "0–24%", count: learners.filter((r) => r.completion < .25).length },
    { name: "25–49%", count: learners.filter((r) => r.completion >= .25 && r.completion < .5).length },
    { name: "50–74%", count: learners.filter((r) => r.completion >= .5 && r.completion < .75).length },
    { name: "75–99%", count: learners.filter((r) => r.completion >= .75 && r.completion < 1).length },
    { name: "100%", count: completed },
  ];
  const signups = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(1); date.setMonth(date.getMonth() - 5 + i);
    return { name: date.toLocaleDateString(undefined, { month: "short" }), count: users.filter((p) => {
      const created = new Date(p.createdAt);
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
    }).length };
  });

  const tiles = [
    { label: "Total users", value: users.length, detail: `${learners.length} learners · ${staff} staff`, icon: "people", page: "students" as const },
    { label: "Active in 7 days", value: active7, detail: `${active30} active in 30 days`, icon: "trend", page: "students" as const },
    { label: "Never signed in", value: never, detail: "Based on recorded profile logins", icon: "clock", page: "students" as const },
    { label: "Learners at risk", value: atRisk, detail: "Based on learning and attendance signals", icon: "shield", page: "analytics" as const },
    { label: "Average completion", value: percent(average), detail: `${completed} learners at 100%`, icon: "checklist", page: "analytics" as const },
    { label: "Average quiz score", value: quizAverage === null ? "—" : percent(quizAverage), detail: `${quizRows.length} learners with quiz results`, icon: "chart", page: "analytics" as const },
    { label: "Average attendance", value: attendanceAverage === null ? "—" : percent(attendanceAverage), detail: `${attendanceRows.length} learners with registers`, icon: "calendar", page: "attendance" as const },
    { label: "Evidence items", value: learners.reduce((sum, r) => sum + r.poeDone, 0), detail: "POE items across learners", icon: "folder", page: "analytics" as const },
  ];
  function downloadLearnerRegister() {
    const rows = [["Learner", "Role", "Email", "Created", "Last sign-in"], ...learners.map((r) => [r.profile.name, r.profile.role, r.profile.enrolment?.email ?? "", r.profile.createdAt, r.profile.lastLogin ?? ""])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "learner-register.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const lifecycleRows = learners.map((r) => {
    const docs = r.poeDone;
    const stage = r.completion >= 1 ? "Ready for graduation" : docs >= 8 ? "Evidence verification" : r.completion > 0 ? "Active learnership" : "Onboarding";
    const tone = stage === "Ready for graduation" ? "complete" : stage === "Evidence verification" ? "review" : stage === "Onboarding" ? "new" : "active";
    const onboarding = r.profile.enrolment ? "Complete" : "Pending";
    const graduation = r.completion >= 1 ? "Ready" : "In progress";
    return { ...r, docs, stage, tone, onboarding, graduation };
  }).sort((a, b) => a.stage.localeCompare(b.stage) || a.profile.name.localeCompare(b.profile.name));

  return <div className="admin-overview">
    <div className="admin-overview-head">
      <div><h1>{`Your platform at a glance, ${profile.name.split(" ")[0]}`}</h1><p>{TENANT.name} users, engagement and learning in one place</p></div>
      <button type="button" className="admin-refresh" onClick={() => void refresh()} disabled={loading}><span aria-hidden="true">↻</span>{loading ? "Refreshing…" : "Refresh data"}</button>
    </div>
    <p className="admin-data-note" role={error ? "alert" : undefined}>{error ? "Cloud data could not be refreshed. Showing available local or previously loaded data." : cloudEnabled ? `Tenant data · ${updated ? `Updated ${updated.toLocaleTimeString()}` : "Loading cloud data…"}` : "Local data on this device"}</p>
    <div className="admin-tiles">{tiles.map((tile) => <button type="button" className="admin-tile" key={tile.label} onClick={() => navigate({ page: tile.page })}>
      <span className="admin-tile-copy">
        <span className="admin-tile-label">{tile.label}</span>
        <small>{tile.detail}</small>
      </span>
      <strong className="admin-tile-value">{tile.value}</strong>
    </button>)}</div>
    <div className="admin-charts">
      <Chart title="Users by role" subtitle="Current profiles" data={roles} />
      <Chart title="Learner completion" subtitle="Share of the course completed" data={completion} />
      <Chart title="New profiles" subtitle="Profiles created per month · last 6 months" data={signups} columns />
    </div>
    <div className="admin-panels">
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Needs attention</h2><p>Learners with multiple risk signals</p></div><button type="button" onClick={() => navigate({ page: "analytics" })}>View analytics →</button></div>
        {learners.filter((r) => r.atRisk).sort((a, b) => a.completion - b.completion).slice(0, 6).map((r) => <button className="admin-user-row" type="button" key={r.profile.id} onClick={() => navigate({ page: "students", studentId: r.profile.id })}><span><strong>{r.profile.name}</strong><small>{r.riskReasons.join(" · ")}</small></span><b>{percent(r.completion)}</b></button>)}
        {!atRisk && <p className="admin-empty">No learners currently meet the at-risk criteria.</p>}
      </section>
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Recent sign-ins</h2><p>Last recorded profile sign-in</p></div><button type="button" onClick={() => navigate({ page: "students" })}>View users →</button></div>
        {users.filter((p) => p.lastLogin).sort((a, b) => Date.parse(b.lastLogin!) - Date.parse(a.lastLogin!)).slice(0, 6).map((p) => <button className="admin-user-row" type="button" key={p.id} onClick={() => navigate({ page: "students", studentId: p.id })}><span><strong>{p.name}</strong><small>{p.role}</small></span><time>{new Date(p.lastLogin!).toLocaleDateString()}</time></button>)}
        {!users.some((p) => p.lastLogin) && <p className="admin-empty">No sign-ins have been recorded yet.</p>}
      </section>
    </div>
    <section className="admin-panel admin-operations-panel">
      <div className="admin-records-toolbar">
        <div><span className="admin-records-eyebrow">PROCESSED DATA</span><h2>Learner operations</h2><p>Browse the latest learner records and verify documents from onboarding through graduation.</p></div>
      </div>
      <div className="admin-operations-table" role="table" aria-label="Learner lifecycle tracker">
        <div className="admin-operations-row admin-operations-head" role="row"><span>LEARNER</span><span>LIFECYCLE STAGE</span><span>LEARNING</span><span>DOCUMENTS</span><span>ONBOARDING</span><span>GRADUATION</span><span></span></div>
        {lifecycleRows.map((row) => <button type="button" className="admin-operations-row" key={row.profile.id} onClick={() => navigate({ page: "students", studentId: row.profile.id })} role="row"><span>{row.profile.name}</span><span>{row.stage}</span><span>{percent(row.completion)}</span><span>{row.docs} POE items</span><span>{row.onboarding}</span><span>{row.graduation}</span><span>Verify →</span></button>)}
        {!lifecycleRows.length && <p className="admin-empty">No learner records are available yet.</p>}
      </div>
    </section>
    <p className="admin-footnote">Activity uses recorded sign-ins, not live online presence. Metrics cover profiles available to this tenant; cloud figures depend on successful sync.</p>
  </div>;
}

function Chart({ title, subtitle, data, columns = false }: { title: string; subtitle: string; data: { name: string; count: number }[]; columns?: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return <section className={`admin-panel admin-chart${columns ? " admin-columns" : ""}`}><h2>{title}</h2><p>{subtitle}</p><div className="admin-bars" role="img" aria-label={`${title}: ${data.map((item) => `${item.name} ${item.count}`).join(", ")}`}>
    {data.map((item) => <div className="admin-bar-row" key={item.name}><span>{item.name}</span><div className="admin-bar-track"><div style={columns ? { height: `${item.count / max * 100}%` } : { width: `${item.count / max * 100}%` }} /></div><strong>{item.count}</strong></div>)}
  </div></section>;
}
