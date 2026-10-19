import { useEffect, useId, useMemo, useState } from "react";
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
type ChartMetric = "watch" | "views" | "likes" | "comments" | "completions";

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

const CHART_METRICS: { id: ChartMetric; label: string }[] = [
  { id: "watch", label: "Watch time" },
  { id: "views", label: "Views" },
  { id: "likes", label: "Likes" },
  { id: "comments", label: "Comments" },
  { id: "completions", label: "Quiz completions" },
];

function chartValue(video: VideoRow, metric: ChartMetric): number {
  if (metric === "watch") return video.watchSeconds / 60;
  return video[metric];
}

function chartNumber(value: number, metric: ChartMetric): string {
  return metric === "watch" ? `${Math.round(value)} min` : Math.round(value).toLocaleString("en-ZA");
}

function shortVideoTitle(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  const short = words.slice(0, 2).join(" ");
  return short.length > 15 ? `${short.slice(0, 13)}…` : short;
}

const AXIS_CHAR_EM = .58;
const AXIS_LABEL_SIZE = 10;

/** Shortens a label only if it cannot fit its bar slot at the given font size. */
function fitAxisLabel(title: string, maxWidth: number, fontSize: number): string {
  const text = shortVideoTitle(title);
  const maxChars = Math.floor(maxWidth / (fontSize * AXIS_CHAR_EM));
  return text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…` : text;
}

/** Bar path with rounded top corners and a flat base that sits on the baseline. */
function topRoundedBar(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height);
  const bottom = y + height;
  return `M${x},${bottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${bottom} Z`;
}

/** AI-usage-style vertical comparison chart with direct metric values. */
function VideoPerformanceChart({ videos, metric }: { videos: VideoRow[]; metric: ChartMetric }) {
  const gradientId = useId();
  const [tooltip, setTooltip] = useState<{ title: string; value: string; x: number; y: number } | null>(null);
  const rows = [...videos].sort((a, b) => chartValue(b, metric) - chartValue(a, metric));
  const W = 860;
  const H = 250;
  const padL = 12;
  const padR = 68;
  const padT = 18;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slots = Math.max(rows.length, 12);
  const slot = plotW / slots;
  const barW = Math.min(22, slot * .36);
  const labelWidth = slot - 6;
  const rawMax = Math.max(1, ...rows.map(row => chartValue(row, metric)));
  const tidyMax = rawMax <= 10 ? 10 : Math.ceil(rawMax / 10 ** Math.floor(Math.log10(rawMax))) * 10 ** Math.floor(Math.log10(rawMax));
  const max = rawMax / tidyMax > .8 ? tidyMax * 1.25 : tidyMax;
  const y = (value: number) => padT + plotH - value / max * plotH;
  const grid = [0, .5, 1].map(fraction => ({ value: max * fraction, py: y(max * fraction) }));
  const metricLabel = CHART_METRICS.find(item => item.id === metric)?.label ?? metric;
  const positionTooltip = (event: React.MouseEvent<SVGPathElement>, video: VideoRow, value: number) => {
    const bounds = event.currentTarget.closest(".video-chart-stage")?.getBoundingClientRect();
    if (!bounds) return;
    setTooltip({
      title: video.title,
      value: `${chartNumber(value, metric)} ${metricLabel.toLowerCase()}`,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };
  return <div className="video-chart-stage">
    <svg className="oa-chart video-vertical-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metricLabel} by video`}>
    <defs><linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0"><stop stopColor="var(--dashboard-chart-start, #10a37f)" /><stop offset="1" stopColor="var(--dashboard-chart-end, #10a37f)" /></linearGradient></defs>
    {grid.map(line => <g key={line.value}>
      {line.value > 0 && <line className="oa-grid" x1={padL} x2={padL + plotW} y1={line.py} y2={line.py} />}
      <text className="oa-axis" x={padL + plotW + 9} y={line.py + 4}>{chartNumber(line.value, metric)}</text>
    </g>)}
    {rows.map((video, index) => {
      const value = chartValue(video, metric);
      const cx = padL + slot * index + slot / 2;
      return <g key={video.id}>
        {value > 0 && <path className="video-bar-primary" style={{ fill: `url(#${gradientId})` }} d={topRoundedBar(cx - barW / 2, y(value), barW, Math.max(2, y(0) - y(value)), 4)}
          onMouseEnter={event => positionTooltip(event, video, value)}
          onMouseMove={event => positionTooltip(event, video, value)}
          onMouseLeave={() => setTooltip(null)} />}
        {value > 0 && <text className="video-bar-value" x={cx} y={Math.max(padT + 10, y(value) - 7)} textAnchor="middle">{chartNumber(value, metric)}</text>}
        <text className="video-axis-title" x={cx} y={H - 14} textAnchor="middle" style={{ fontSize: AXIS_LABEL_SIZE }}>{fitAxisLabel(video.title, labelWidth, AXIS_LABEL_SIZE)}<title>{video.title}</title></text>
      </g>;
    })}
    <line className="oa-baseline" x1={padL} x2={padL + plotW} y1={padT + plotH} y2={padT + plotH} />
    </svg>
    {tooltip && <div className="video-chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }} role="tooltip">
      <strong>{tooltip.title}</strong>
      <span>{tooltip.value}</span>
    </div>}
  </div>;
}

export function VideoMetrics() {
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"videos" | "learners">("videos");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("watch");
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
  const selectedVideos = selected?.videos ?? [];
  const chartOrderedVideos = [...videos].sort((a, b) => chartValue(b, chartMetric) - chartValue(a, chartMetric));
  const totals = videos.reduce((sum, row) => ({
    seconds: sum.seconds + row.watchSeconds,
    views: sum.views + row.views,
    likes: sum.likes + row.likes,
    comments: sum.comments + row.comments,
    completions: sum.completions + row.completions,
  }), { seconds: 0, views: 0, likes: 0, comments: 0, completions: 0 });
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
      <div className="video-metrics-kpis oa-metrics">
        <div><span><Icon name="clock" size={15} />Watch time</span><strong>{duration(totals.seconds)}</strong></div>
        <div><span><Icon name="play" size={15} />Platform views</span><strong>{totals.views}</strong></div>
        <div><span><Icon name="thumbUp" size={15} />Likes</span><strong>{totals.likes}</strong></div>
        <div><span><Icon name="chat" size={15} />Comments</span><strong>{totals.comments}</strong></div>
        <div><span><Icon name="checklist" size={15} />Quiz completions</span><strong>{totals.completions}</strong></div>
      </div>
      <section className="card video-trending-card">
        <div className="video-chart-head">
          <div><h3>Compare video performance</h3><p className="mini-note">Choose what you want to compare. Each bar is one video, ordered from highest to lowest.</p></div>
        </div>
        {videos.length ? <>
        <div className="video-chart-metrics" role="group" aria-label="Choose chart metric">
          {CHART_METRICS.map(item => <button key={item.id} type="button" className={chartMetric === item.id ? "active" : ""} aria-pressed={chartMetric === item.id} onClick={() => setChartMetric(item.id)}>{item.label}</button>)}
        </div>
        <VideoPerformanceChart videos={chartOrderedVideos} metric={chartMetric} />
        <p className="video-chart-help"><strong>How to read this:</strong> A taller bar means a higher result. Hover over a bar to see the full video name and exact value.</p>
        </> : <p className="empty-state">{loading ? "Loading video activity…" : "No video activity recorded yet. Metrics appear here once learners watch, like, comment on or complete videos."}</p>}
      </section>
      {videos.length > 0 && <div className="table-wrap card video-metrics-table-wrap"><table className="data video-metrics-table">
        <thead><tr><th>#</th><th>Video</th><th>Course</th><th>Views</th><th>Learners</th><th>Watch time</th><th>Likes</th><th>Comments</th><th>Completed</th></tr></thead>
        <tbody>{chartOrderedVideos.map((video, index) => <tr key={video.id}><td>{index + 1}</td><td><strong>{video.title}</strong></td><td>{video.course}</td><td>{video.views}</td><td>{video.learners}</td><td>{duration(video.watchSeconds)}</td><td>{video.likes}</td><td>{video.comments}</td><td>{video.completions}</td></tr>)}</tbody>
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
          <div><span><Icon name="play" size={15} />Videos engaged</span><strong>{selectedVideos.length}</strong></div>
          <div><span><Icon name="clock" size={15} />Watch time</span><strong>{duration(selectedVideos.reduce((n, row) => n + row.watchSeconds, 0))}</strong></div>
          <div><span><Icon name="thumbUp" size={15} />Likes</span><strong>{selectedVideos.reduce((n, row) => n + row.likes, 0)}</strong></div>
          <div><span><Icon name="chat" size={15} />Comments</span><strong>{selectedVideos.reduce((n, row) => n + row.comments, 0)}</strong></div>
          <div><span><Icon name="folder" size={15} />Uploads</span><strong>{Object.keys(selected.docs).length + (selected.learner.contentEntries?.length ?? 0)}</strong></div>
        </div>
        <div className="video-user-grid">
          <section className="card"><h3>Video interaction</h3>{selectedVideos.length ? selectedVideos.map(video => <div className="video-user-row" key={video.id}>
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
