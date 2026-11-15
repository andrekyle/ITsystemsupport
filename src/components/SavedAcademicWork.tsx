import { useEffect, useState } from "react";
import type { Profile, ProgressState } from "../types";
import { cloudEnabled } from "../lib/supabase";
import { bestProgress, cloudProfileIds, fetchCloudLearnerData, fetchCloudLessonQuizzes } from "../lib/directory";
import { combineLessonQuizEvidence, localLessonQuizEvidence, savedAcademicWorkHtml, savedLessonAnswers, savedLessonQuizResults, savedWorkbookAnswers, type LessonQuizEvidence } from "../lib/academicEvidence";
import { mergeProgressEvidence } from "../lib/progressEvidence";
import { WORKBOOK_SPECS } from "../data/workbookSpecs";
import { downloadText } from "../lib/audit";

/** Source answers remain distinct from formal completion and assessor outcomes. */
export function SavedAcademicWork({ profile, progress }: { profile: Profile; progress: ProgressState }) {
  const [saved, setSaved] = useState<{ id: string; progress: ProgressState; lessons: LessonQuizEvidence } | null>(null);
  const [loading, setLoading] = useState(cloudEnabled);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(cloudEnabled); setError("");
    void (async () => {
      const cloud = cloudEnabled ? await fetchCloudLearnerData() : null;
      if (cloudEnabled && !cloud) throw new Error("Saved work could not be fully loaded. Please retry.");
      const ids = cloudProfileIds(profile, cloud);
      const lessons = combineLessonQuizEvidence(localLessonQuizEvidence(ids), cloudEnabled ? await fetchCloudLessonQuizzes(ids) : {});
      if (active) setSaved({ id: profile.id, progress: bestProgress(profile, cloud), lessons });
    })().catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Saved work could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profile.id, refresh]);
  const current = saved?.id === profile.id ? saved : null;
  const combined = current ? mergeProgressEvidence(current.progress, progress) : progress;
  const lessons = current?.lessons ?? localLessonQuizEvidence([profile.id]);
  const ids = [...new Set([...Object.keys(combined.units), ...Object.keys(lessons)])];
  const workbookCount = ids.reduce((count, id) => count + savedWorkbookAnswers(combined.units[id]).length, 0);
  const lessonCount = ids.reduce((count, id) => count + savedLessonAnswers(lessons[id]).length, 0);
  const completedQuizzes = ids.reduce((count, id) => count + savedLessonQuizResults(lessons[id]).filter(result => result.completed).length, 0);
  const blocks = ids.map(id => ({ id, html: savedAcademicWorkHtml(combined.units[id], WORKBOOK_SPECS[id], lessons[id]) })).filter(row => row.html);
  return <section className="card" style={{ marginBottom: 20 }}>
    <h2 className="section-title">Saved assignments and quizzes</h2>
    <p>{workbookCount} workbook answers · {lessonCount} lesson-quiz selections{!loading && !error && ` · ${completedQuizzes} lesson quizzes completed`}</p>
    {loading && <p role="status">Checking saved cloud records…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button type="button" className="btn ghost sm" onClick={() => setRefresh(value => value + 1)} disabled={loading}>Refresh saved work</button>{" "}
    <button type="button" className="btn sm" disabled={loading || !!error || !blocks.length} onClick={() => downloadText(`saved-assignments-quizzes.html`, `<!doctype html><meta charset="utf-8"><title>Saved assignments and quizzes</title><style>body{font:16px system-ui;max-width:1000px;margin:32px auto;padding:16px}.answer{white-space:pre-wrap}section{margin-bottom:32px}.marks{color:#555}</style><h1>Saved assignments and quizzes</h1>${blocks.map(row => `<section><h2>Unit ${row.id.replace(/[^a-zA-Z0-9 ._-]/g, "")}</h2>${row.html}</section>`).join("")}`, "text/html")}>Download saved work</button>
    <details style={{ marginTop: 12 }}><summary>View saved answers</summary>
      {blocks.map(row => <details key={row.id} style={{ marginTop: 12 }}><summary>Unit {row.id}</summary><div dangerouslySetInnerHTML={{ __html: row.html }} /></details>)}
      {!loading && !error && !blocks.length && <p>No saved answers were found in the available records.</p>}
    </details>
  </section>;
}
