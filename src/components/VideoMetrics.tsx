import { useEffect, useMemo, useState } from "react";
import { Icon } from "../icons";
import { Select } from "./Select";
import type { Profile, ProgressState } from "../types";
import { COURSE_META } from "../data/course";
import { loadProfiles } from "../store";
import {
  bestPoeDocs,
  bestProgress,
  dedupeProfiles,
  fetchCloudLearnerData,
  mergeProfileWithCloud,
  remoteOnlyProfiles,
  type CloudLearnerData,
} from "../lib/directory";

type VideoRow = {
  id: string;
  title: string;
  course: string;
  learners: number;
  views: number;
  watchSeconds: number;
  likes: number;
  comments: number;
  completions: number;
  score: number;
};

type LearnerVideo = Omit<VideoRow, "learners" | "score"> & { completed: boolean; liked: boolean };

const PREFIX = "videoengagement.";

function safeComments(value: unknown): number {
  if (typeof value !== "string") return 0;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch { return 0; }
}

function titleMap(): Record<string, string> {
  const titles: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("itss.lessonedits.")) continue;
      const value = JSON.parse(localStorage.getItem(key) ?? "{}") as { videoTitles?: Record<string, string> };
      Object.assign(titles, value.videoTitles ?? {});
    }
  } catch { /* malformed or unavailable local cache */ }
  return titles;
}

function fallbackTitle(id: string): string {
  const source = id.startsWith("video:") ? id.slice(6) : id;
  try {
    const url = new URL(source);
    const host = url.hostname.replace(/^www\./, "");
    const name = url.pathname.split("/").filter(Boolean).pop();
    return name ? `${host} · ${decodeURIComponent(name).slice(0, 42)}` : host;
  } catch { return source.slice(0, 55) || "Untitled video"; }
}

function learnerVideos(progress: ProgressState, titles: Record<string, string>): LearnerVideo[] {
  const rows = new Map<string, LearnerVideo>();
  const ensure = (source: string) => {
    const id = source.startsWith("video:") ? source : `video:${source}`;
    let row = rows.get(id);
    if (!row) {
      row = {
        id,
        title: titles[id] ?? fallbackTitle(id),
        course: COURSE_META.title,
        watchSeconds: 0,
        views: 0,
        likes: 0,
        comments: 0,
        completions: 0,
        completed: false,
        liked: false,
      };
      rows.set(id, row);
    }
    return row;
  };
  for (const unit of Object.values(progress.units)) {
    for (const [id, result] of Object.entries(unit.quizzes ?? {})) {
      if (!id.startsWith("video:")) continue;
      const row = ensure(id);
      if (result.best === result.total && result.total > 0) {
        row.completed = true;
        row.completions = 1;
      }
    }
    for (const [key, value] of Object.entries(unit.logbook ?? {})) {
      if (!key.startsWith(PREFIX)) continue;
      const rest = key.slice(PREFIX.length);
      const dot = rest.indexOf(".");
      if (dot < 0) continue;
      const action = rest.slice(0, dot);
      if (!['liked', 'comments', 'watchSeconds', 'viewCount'].includes(action)) continue;
      const row = ensure(rest.slice(dot + 1));
      if (action === "liked" && value === true) { row.liked = true; row.likes = 1; }
      if (action === "comments") row.comments = safeComments(value);
      if (action === "watchSeconds") row.watchSeconds = Math.max(row.watchSeconds, Number(value) || 0);
      if (action === "viewCount") row.views = Math.max(row.views, Number(value) || 0);
    }
  }
  return [...rows.values()];
}

function duration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = seconds / 3600;
  return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)} hr`;
}

export function VideoMetrics() {
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"videos" | "learners">("videos");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let alive = true;
    void fetchCloudLearnerData().then(value => { if (alive) setCloud(value); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const learners = useMemo(() => {
    const local = loadProfiles().filter(item => item.role === "Learner");
    const remote = remoteOnlyProfiles(local, cloud?.profiles ?? []).filter(item => item.role === "Learner");
    return dedupeProfiles([...local.map(item => mergeProfileWithCloud(item, cloud)), ...remote]);
  }, [cloud]);
  const titles = useMemo(titleMap, []);
  const activity = useMemo(() => learners.map(learner => ({
    learner,
    progress: bestProgress(learner, cloud),
    videos: learnerVideos(bestProgress(learner, cloud), titles),
    docs: bestPoeDocs(learner, cloud),
  })), [learners, cloud, titles]);
  const videos = useMemo(() => {
    const map = new Map<string, VideoRow & { people: Set<string> }>();
    for (const entry of activity) for (const video of entry.videos) {
      const row = map.get(video.id) ?? {
        id: video.id, title: video.title, course: video.course,
        learners: 0, views: 0, watchSeconds: 0, likes: 0, comments: 0, completions: 0,
        score: 0, people: new Set<string>(),
      };
      row.people.add(entry.learner.id);
      row.watchSeconds += video.watchSeconds;
      row.views = Math.max(row.views, video.views);
      row.likes += video.likes;
      row.comments += video.comments;
      row.completions += video.completions;
      map.set(video.id, row);
    }
    return [...map.values()].map(({ people, ...row }) => ({
      ...row,
      learners: people.size,
      score: row.watchSeconds + row.views * 30 + row.likes * 120 + row.comments * 180 + row.completions * 240,
    })).sort((a, b) => b.score - a.score);
  }, [activity]);
  const selected = activity.find(item => item.learner.id === selectedId) ?? activity[0];
  const totals = videos.reduce((sum, row) => ({
    seconds: sum.seconds + row.watchSeconds,
    views: sum.views + row.views,
    likes: sum.likes + row.likes,
    comments: sum.comments + row.comments,
    completions: sum.completions + row.completions,
  }), { seconds: 0, views: 0, likes: 0, comments: 0, completions: 0 });
  const maxScore = Math.max(1, ...videos.map(row => row.score));

  return <div className="video-metrics">
    <div className="video-metrics-head">
      <div>
        <h2>Video analytics</h2>
        <p>Watch time, engagement and learning activity across {COURSE_META.title}.</p>
      </div>
      <span className="video-metrics-sync">{loading ? "Syncing learner data…" : `${learners.length} learners`}</span>
    </div>
    <div className="video-metrics-switch" role="tablist" aria-label="Video analytics views">
      <button type="button" className={view === "videos" ? "active" : ""} onClick={() => setView("videos")}>Video performance</button>
      <button type="button" className={view === "learners" ? "active" : ""} onClick={() => setView("learners")}>Learner activity</button>
    </div>

    {view === "videos" ? <>
      <div className="video-metrics-kpis">
        <div><span>Watch time</span><strong>{duration(totals.seconds)}</strong></div>
        <div><span>Platform views</span><strong>{totals.views}</strong></div>
        <div><span>Likes</span><strong>{totals.likes}</strong></div>
        <div><span>Comments</span><strong>{totals.comments}</strong></div>
        <div><span>Quiz completions</span><strong>{totals.completions}</strong></div>
      </div>
      <section className="card video-trending-card">
        <h3>Trending videos</h3>
        <p className="mini-note">Ranked using watch time, likes, comments and completed video quizzes.</p>
        {videos.length ? <div className="video-chart">
          {videos.slice(0, 10).map((video, index) => <div className="video-chart-row" key={video.id}>
            <span className="video-rank">{index + 1}</span>
            <div className="video-chart-label"><strong>{video.title}</strong><span>{video.course}</span></div>
            <div className="video-chart-track"><span style={{ width: `${Math.max(4, video.score / maxScore * 100)}%` }} /></div>
            <span className="video-chart-value">{duration(video.watchSeconds)}</span>
          </div>)}
        </div> : <p className="empty-state">Video metrics will appear after learners begin watching course videos.</p>}
      </section>
      {videos.length > 0 && <div className="table-wrap card video-metrics-table-wrap"><table className="data video-metrics-table">
        <thead><tr><th>Video</th><th>Course</th><th>Views</th><th>Learners</th><th>Watch time</th><th>Likes</th><th>Comments</th><th>Completed</th></tr></thead>
        <tbody>{videos.map(video => <tr key={video.id}><td><strong>{video.title}</strong></td><td>{video.course}</td><td>{video.views}</td><td>{video.learners}</td><td>{duration(video.watchSeconds)}</td><td>{video.likes}</td><td>{video.comments}</td><td>{video.completions}</td></tr>)}</tbody>
      </table></div>}
    </> : <>
      <div className="video-learner-picker field">
        <label>Learner</label>
        <Select
          value={selected?.learner.id ?? ""}
          ariaLabel="Choose a learner"
          className="video-learner-select"
          onChange={setSelectedId}
          options={activity.map(item => ({ value: item.learner.id, label: item.learner.name }))}
          placeholder="Choose a learner"
        />
      </div>
      {selected ? <>
        <div className="video-metrics-kpis">
          <div><span>Videos engaged</span><strong>{selected.videos.length}</strong></div>
          <div><span>Watch time</span><strong>{duration(selected.videos.reduce((n, row) => n + row.watchSeconds, 0))}</strong></div>
          <div><span>Likes</span><strong>{selected.videos.reduce((n, row) => n + row.likes, 0)}</strong></div>
          <div><span>Comments</span><strong>{selected.videos.reduce((n, row) => n + row.comments, 0)}</strong></div>
          <div><span>Uploads</span><strong>{Object.keys(selected.docs).length + (selected.learner.contentEntries?.length ?? 0)}</strong></div>
        </div>
        <div className="video-user-grid">
          <section className="card"><h3>Video interaction</h3>{selected.videos.length ? selected.videos.map(video => <div className="video-user-row" key={video.id}>
            <Icon name={video.completed ? "checkCircle" : "play"} size={17} />
            <span><strong>{video.title}</strong><small>{duration(video.watchSeconds)} · {video.liked ? "Liked" : "Not liked"} · {video.comments} comments · {video.completed ? "Quiz completed" : "Quiz incomplete"}</small></span>
          </div>) : <p className="empty-state">No recorded video interaction yet.</p>}</section>
          <section className="card"><h3>Uploaded resources and evidence</h3>
            {(selected.learner.contentEntries?.length ?? 0) === 0 && Object.keys(selected.docs).length === 0
              ? <p className="empty-state">No uploaded resources or POE evidence yet.</p>
              : <>
                {(selected.learner.contentEntries ?? []).map(resource => <div className="video-user-row" key={resource.id}><Icon name="share" size={17} /><span><strong>{resource.title}</strong><small>{resource.type}{resource.organisation ? ` · ${resource.organisation}` : ""}</small></span></div>)}
                {Object.entries(selected.docs).map(([key, doc]) => <div className="video-user-row" key={key}><Icon name="document" size={17} /><span><strong>{doc.name}</strong><small>POE evidence · {new Date(doc.uploadedAt).toLocaleDateString()}</small></span></div>)}
              </>}
          </section>
        </div>
      </> : <p className="empty-state">No learner profiles are available.</p>}
    </>}
  </div>;
}
