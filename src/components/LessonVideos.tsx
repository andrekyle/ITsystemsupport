import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { lessonVideoSource, type LessonVideoSource } from "../lib/lessonVideo";
import { recordLessonVideoView, type LessonVideoViewCount } from "../lib/lessonVideoViews";
import type { Profile, QuizQuestion } from "../types";
import { validVideoQuestions, videoEngagementKey, videoQuizId, VideoWatchTracker, type VideoQuiz } from "../lib/videoLearning";
import { VideoQuizEditor } from "./VideoQuizEditor";
import { TrackedVideoPlayer } from "./TrackedVideoPlayer";
import { Avatar } from "./Avatar";

type VideoComment = {
  id: string;
  text: string;
  author: Pick<Profile, "id" | "name" | "role" | "avatar">;
  likedBy: string[];
  createdAt: string;
};
type VideoLayout = { width: number; align: "left" | "center" | "right" };
const videoLayoutKey = (id: string) => `itss.video-layout.${id}`;
function readVideoLayout(id: string): VideoLayout {
  try {
    const value = JSON.parse(localStorage.getItem(videoLayoutKey(id)) ?? "null") as Partial<VideoLayout> | null;
    return { width: Math.min(100, Math.max(30, Number(value?.width) || 100)), align: value?.align === "left" || value?.align === "right" ? value.align : "center" };
  } catch { return { width: 100, align: "center" }; }
}

function isVideoComment(value: unknown): value is VideoComment {
  if (!value || typeof value !== "object") return false;
  const comment = value as Partial<VideoComment>;
  return typeof comment.id === "string"
    && typeof comment.text === "string"
    && !!comment.author
    && typeof comment.author.id === "string"
    && typeof comment.author.name === "string"
    && typeof comment.author.role === "string"
    && Array.isArray(comment.likedBy)
    && comment.likedBy.every(id => typeof id === "string")
    && typeof comment.createdAt === "string";
}

export function LessonVideoEditor({ links, onSave, disabled, quizzes, onSaveQuiz, titles, onSaveTitle }: {
  links: string[];
  onSave: (links: string[]) => Promise<void>;
  disabled: boolean;
  quizzes?: Record<string, VideoQuiz>;
  onSaveQuiz?: (link: string, quiz: VideoQuiz) => Promise<void>;
  titles?: Record<string, string>;
  onSaveTitle?: (link: string, title: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (next: string[]) => {
    setSaving(true);
    setError("");
    try {
      await onSave(next);
      setLink("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The video could not be saved. Please try again.");
    } finally { setSaving(false); }
  };
  return <div className="lesson-video-editor">
    <button type="button" className="btn ghost sm slide-tool-action" disabled={disabled || saving}
      aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <Icon name={open ? "close" : links.length > 0 ? "pencil" : "play"} size={16} />
      {open ? "Cancel" : links.length > 0 ? "Edit Video" : "Add video"}
    </button>
    {open && <div className="lesson-video-form">
      <label>Video link
        <input type="url" value={link} disabled={saving || disabled}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={event => setLink(event.target.value)} />
      </label>
      <p className="muted">Paste a YouTube, Vimeo or direct video link. The host must allow playback.</p>
      <button type="button" className="btn ghost sm slide-tool-action" disabled={!link.trim() || saving || disabled}
        onClick={() => {
          try {
            const source = lessonVideoSource(link);
            if (links.some(existing => lessonVideoSource(existing).src === source.src)) throw new Error("This video is already on the slide.");
            void save([...links, link.trim()]);
          } catch (cause) { setError(cause instanceof Error ? cause.message : "The video link is invalid."); }
        }}>{saving ? "Saving..." : "Insert video"}</button>
    </div>}
    {links.length > 0 && <div className="lesson-video-saved-list">
      <p className="editing-tool-label">Videos on this slide ({links.length})</p>
      {links.map((value, index) => <div className="lesson-video-editor-card" key={`${index}:${value}`}>
        <div className="lesson-video-entry">
        <strong>Video {index + 1}</strong>
        <button type="button" className="btn ghost sm lesson-video-remove" disabled={saving || disabled}
          onClick={() => void save(links.filter((_, i) => i !== index))}>Remove video {index + 1}</button>
        </div>
        {onSaveTitle && <label className="lesson-video-title-editor">Video heading
          <span>
            <input
              type="text"
              defaultValue={titles?.[videoQuizId(value)] ?? `Lesson video ${index + 1}`}
              disabled={saving || disabled}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              onBlur={event => {
                const title = event.currentTarget.value.trim() || `Lesson video ${index + 1}`;
                event.currentTarget.value = title;
                if (title !== (titles?.[videoQuizId(value)] ?? `Lesson video ${index + 1}`)) {
                  setSaving(true);
                  setError("");
                  void onSaveTitle(value, title).catch(cause => {
                    setError(cause instanceof Error ? cause.message : "The video heading could not be saved.");
                  }).finally(() => setSaving(false));
                }
              }}
            />
          </span>
        </label>}
        <VideoLayoutEditor id={videoQuizId(value)} disabled={saving || disabled} />
        <a className="lesson-video-source-link" href={value} target="_blank" rel="noopener noreferrer"
          title={value}>Open video source <Icon name="chevronRight" size={14} /></a>
        {onSaveQuiz && <VideoQuizEditor quiz={quizzes?.[videoQuizId(value)]} disabled={saving || disabled}
          onSave={quiz => onSaveQuiz(value, quiz)} />}
      </div>)}
    </div>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </div>;
}

function VideoLayoutEditor({ id, disabled }: { id: string; disabled: boolean }) {
  const [layout, setLayout] = useState<VideoLayout>(() => readVideoLayout(id));
  const update = (next: VideoLayout) => { setLayout(next); localStorage.setItem(videoLayoutKey(id), JSON.stringify(next)); window.dispatchEvent(new CustomEvent("itss-video-layout", { detail: id })); };
  return <div className="lesson-video-layout-editor">
    <label>Video width
      <input type="range" min="30" max="100" step="5" value={layout.width} disabled={disabled} onChange={event => update({ ...layout, width: Number(event.target.value) })} />
      <span>{layout.width}%</span>
    </label>
    <fieldset><legend>Alignment</legend>
      {(["left", "center", "right"] as const).map(align => <label key={align}><input type="radio" name={`video-align-${id}`} checked={layout.align === align} disabled={disabled} onChange={() => update({ ...layout, align })} /> {align}</label>)}
    </fieldset>
  </div>;
}

function LessonVideoPreview({ source }: { source: LessonVideoSource }) {
  const [error, setError] = useState("");
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const thumbnailSizes = ["maxresdefault", "sddefault", "hqdefault"];
  function trySmallerThumbnail() {
    if (thumbnailIndex < thumbnailSizes.length - 1) {
      setThumbnailIndex(thumbnailIndex + 1);
    } else {
      setError("Video thumbnail unavailable. Select Watch video to try playback.");
    }
  }
  const url = new URL(source.src);
  if (error) return <span className="lesson-video-preview-error" role="status">{error}</span>;
  if (source.kind === "file") {
    return <video
      className="lesson-video-thumbnail"
      src={source.src}
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      onLoadedMetadata={event => {
        const video = event.currentTarget;
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.min(0.1, video.duration / 2);
        }
      }}
      onError={() => setError("Video preview unavailable. Select Watch video to try playback.")}
    />;
  }
  if (url.hostname === "www.youtube-nocookie.com") {
    return <img
      className="lesson-video-thumbnail"
      src={`https://i.ytimg.com/vi/${url.pathname.split("/")[2]}/${thumbnailSizes[thumbnailIndex]}.jpg`}
      alt=""
      loading="lazy"
      onLoad={event => {
        // YouTube can return a 120px placeholder instead of a missing-image error.
        if (event.currentTarget.naturalWidth <= 120) trySmallerThumbnail();
      }}
      onError={trySmallerThumbnail}
    />;
  }
  return <iframe
    className="lesson-video-thumbnail"
    src={source.src}
    title="Video thumbnail preview"
    tabIndex={-1}
    aria-hidden="true"
    referrerPolicy="strict-origin-when-cross-origin"
  />;
}

function LessonVideo({
  link,
  index,
  heading,
  completed,
  learnerName,
  learnerProfile,
  onComplete,
  questions,
  initialLiked = false,
  initialComments = [],
  onLike,
  onComment,
  onWatchProgress,
  onViewCount,
}: {
  link: string;
  index: number;
  heading?: string;
  completed: boolean;
  learnerName: string;
  learnerProfile?: Profile;
  questions?: QuizQuestion[];
  onComplete?: (answers: number[]) => void;
  initialLiked?: boolean;
  initialComments?: Array<string | VideoComment>;
  onLike?: (liked: boolean) => void;
  onComment?: (comments: VideoComment[]) => void;
  onWatchProgress?: (seconds: number, duration: number) => void;
  onViewCount?: (views: number) => void;
}) {
  const videoId = videoQuizId(link);
  const commenterProfile: Profile = learnerProfile ?? {
    id: "current-video-learner",
    name: learnerName || "You",
    role: "Learner",
    createdAt: "",
  };
  const [failed, setFailed] = useState(false);
  const [layout, setLayout] = useState<VideoLayout>(() => readVideoLayout(videoId));
  useEffect(() => {
    const refresh = (event: Event) => { if ((event as CustomEvent<string>).detail === videoId) setLayout(readVideoLayout(videoId)); };
    window.addEventListener("itss-video-layout", refresh);
    return () => window.removeEventListener("itss-video-layout", refresh);
  }, [videoId]);
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [comments, setComments] = useState<VideoComment[]>(() => initialComments.map((comment, commentIndex) =>
    typeof comment === "string"
      ? {
          id: `legacy-${commentIndex}-${comment}`,
          text: comment,
          author: { id: commenterProfile.id, name: commenterProfile.name, role: commenterProfile.role, avatar: commenterProfile.avatar },
          likedBy: [],
          createdAt: "",
        }
      : comment
  ));
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [status, setStatus] = useState("");
  const [platformViews, setPlatformViews] = useState<LessonVideoViewCount | null>(null);
  const [viewCountError, setViewCountError] = useState("");
  const openButton = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const tracker = useRef(new VideoWatchTracker());
  const [watchedFully, setWatchedFully] = useState(false);
  const [rewatchRequired, setRewatchRequired] = useState(false);
  const [redoingCompletedQuiz, setRedoingCompletedQuiz] = useState(false);
  const [watchAttempt, setWatchAttempt] = useState(0);
  const [playbackError, setPlaybackError] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [credited, setCredited] = useState(false);
  const quizReady = validVideoQuestions(questions);
  const canComplete = watchedFully && quizReady && quizScore === 5;
  const isCompleted = completed || credited;
  let source;
  try { source = lessonVideoSource(link); }
  catch (cause) {
    return <p className="auth-error" role="alert">{cause instanceof Error ? cause.message : "Invalid video link."}</p>;
  }

  const title = heading?.trim() || `Lesson video ${index + 1}`;
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      openButton.current?.focus();
    };
  }, [open]);

  function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = commentDraft.trim();
    if (!comment) return;
    try {
      const next: VideoComment[] = [...comments, {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: comment,
        author: {
          id: commenterProfile.id,
          name: commenterProfile.name,
          role: commenterProfile.role,
          avatar: commenterProfile.avatar,
        },
        likedBy: [],
        createdAt: new Date().toISOString(),
      }];
      onComment?.(next);
      setComments(next);
      setCommentDraft("");
      setShowComments(true);
      setStatus(onComment ? "Comment posted. Your first comment on this video earns 10 XP; additional comments earn no extra XP." : "Comment posted.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Your comment could not be saved. Please retry.");
    }
  }

  return <>
    <figure className={`lesson-video lesson-video-align-${layout.align}`} style={{ width: `${layout.width}%` }}>
      <button
        ref={openButton}
        type="button"
        className="lesson-video-launch"
        aria-label={`Watch ${title} in expanded player`}
        onClick={() => {
          setFailed(false);
          setPlaybackError("");
          setViewCountError("");
          // The platform counts each user once a day; the last total stays visible while it refreshes.
          void recordLessonVideoView(source.src).then(result => {
            setPlatformViews(result);
            onViewCount?.(result.views);
          }).catch((cause: unknown) => {
            setViewCountError(cause instanceof Error ? cause.message : "The platform view count is unavailable.");
          });
          setOpen(true);
        }}
      >
        <LessonVideoPreview key={source.src} source={source} />
        <span className="lesson-video-launch-content">
          <span className="lesson-video-launch-play"><Icon name="play" size={30} /></span>
          <span className="lesson-video-launch-label">{title}</span>
          <span className="lesson-video-launch-hint">Watch video</span>
        </span>
      </button>
      {failed && <p className="auth-error" role="alert">This video could not be played. Check the link and the video host's permissions.</p>}
    </figure>
    {open && createPortal(
      <div className="lesson-video-overlay" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}>
        <section className="lesson-video-modal" role="dialog" aria-modal="true" aria-labelledby={`lesson-video-title-${index}`}>
          <header className="lesson-video-modal-header">
            <div className="lesson-video-watched">
              <span>
                {platformViews === null
                  ? `${learnerName || "You"} · ${isCompleted ? "completed this video" : "learning now"}`
                  : <>
                    {`${platformViews.views.toLocaleString()} ${platformViews.views === 1 ? "view" : "views"} on this platform`}
                    <small className="lesson-video-daily-note">
                      {platformViews.counted ? "Counted as your view for today" : "You were already counted today"} · one view per user per day
                    </small>
                  </>}
              </span>
            </div>
            <button ref={closeButton} type="button" className="lesson-video-icon-button" aria-label="Close video" onClick={() => setOpen(false)}>
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="lesson-video-scroll-content" tabIndex={0} aria-label="Video, details and questions">
          <div className="lesson-video-player">
            <TrackedVideoPlayer key={watchAttempt} source={source} title={title} tracker={tracker.current}
              onFinished={() => {
                setWatchedFully(true);
                setPlaybackError("");
                if (rewatchRequired) {
                  setRewatchRequired(false);
                  setAnswers({});
                  setQuizScore(null);
                  setStatus("Video watched again. You can now reattempt the quiz.");
                }
              }}
              onError={setPlaybackError}
              onWatchProgress={onWatchProgress} />
          </div>
          {playbackError && <p className="auth-error lesson-video-feedback" role="alert">{playbackError}</p>}
          {viewCountError && <p className="auth-error lesson-video-feedback" role="alert">{viewCountError}</p>}
          {!quizReady && !isCompleted && <p className="lesson-video-feedback" role="status">
            Staff must add this video's transcript and five questions before it can be completed.
          </p>}
          {rewatchRequired && quizReady && (!isCompleted || redoingCompletedQuiz) && <p className="lesson-video-feedback" role="status">
            {quizScore === null
              ? "Watch the full video again to unlock a fresh quiz attempt."
              : `You scored ${quizScore}/5. Watch the full video again to unlock a fresh quiz attempt.`}
          </p>}
          {watchedFully && quizReady && (!isCompleted || redoingCompletedQuiz) && <section className="lesson-video-quiz" aria-label="Video knowledge check">
            <h3>Video knowledge check</h3>
            <p>{isCompleted
              ? "This is a quiz reattempt. Your result will not count towards XP because you have already completed this quiz."
              : "Answer all five questions correctly to unlock Complete and earn XP."}</p>
            <form onSubmit={event => {
              event.preventDefault();
              const score = questions.reduce((total, question, i) => total + (answers[i] === question.answer ? 1 : 0), 0);
              setQuizScore(score);
            }}>
              {questions.map((question, i) => <fieldset key={i} disabled={quizScore !== null}>
                <legend>{i + 1}. {question.q}</legend>
                {question.options.map((option, oi) => <label key={oi}>
                  <input type="radio" name={`video-${index}-question-${i}`} checked={answers[i] === oi}
                    onChange={() => { setAnswers(current => ({ ...current, [i]: oi })); setQuizScore(null); }} />
                  {option}
                </label>)}
              </fieldset>)}
              <button type="submit" className="lesson-video-check-answers" disabled={Object.keys(answers).length !== 5 || quizScore !== null}>Check video answers</button>
            </form>
            {quizScore !== null && (quizScore === 5
              ? <p role="status">{isCompleted
                  ? "5/5 correct. Reattempt complete; your original XP award is unchanged."
                  : "5/5 correct. Complete is now available."}</p>
              : <div className="lesson-video-retry" role="status">
                  <p>{quizScore}/5 correct. Watch the video again before trying a fresh quiz.</p>
                  <button type="button" className="btn ghost sm" onClick={() => {
                    setRewatchRequired(true);
                    setWatchedFully(false);
                    tracker.current.reset();
                    setWatchAttempt(attempt => attempt + 1);
                    setStatus("Watch the full video again to unlock your next quiz attempt.");
                  }}>
                    <Icon name="refresh" size={15} /> Redo quiz
                  </button>
                </div>)}
          </section>}

          <div className="lesson-video-description">
            <span className="lesson-video-kind">VIDEO LESSON · {source.kind === "embed" ? "STREAMING" : "VIDEO FILE"}</span>
            <h2 id={`lesson-video-title-${index}`}>{title}</h2>
            <p>Part of your course learning materials.</p>
            <a href={link} target="_blank" rel="noopener noreferrer">Open video source</a>
          </div>

          <div className="lesson-video-stats" aria-label="Your activity">
            <span title="Each user counts once a day">
              {platformViews === null
                ? viewCountError ? "Views unavailable" : "Views loading"
                : `${platformViews.views.toLocaleString()} Platform views`}
            </span>
            <span>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</span>
            <span>{liked ? "1 Like" : "0 Likes"}</span>
          </div>

          <div className="lesson-video-actions">
            <button
              type="button"
              className={`lesson-video-complete${isCompleted ? " is-complete" : ""}`}
              disabled={isCompleted || !onComplete || !canComplete}
              onClick={() => {
                if (!canComplete || isCompleted || !onComplete) return;
                try {
                  onComplete(Array.from({ length: 5 }, (_, i) => answers[i]));
                  setCredited(true);
                  setStatus("Video completed. Your quiz result has been recorded for XP.");
                } catch (cause) {
                  setStatus(cause instanceof Error ? cause.message : "Video completion could not be saved. Please retry.");
                }
              }}
            >
              {isCompleted ? "Completed" : "Complete"}
            </button>
            {isCompleted && quizReady && !redoingCompletedQuiz && <button
              type="button"
              className="btn ghost sm lesson-video-redo-completed"
              onClick={() => {
                setRedoingCompletedQuiz(true);
                setRewatchRequired(true);
                setWatchedFully(false);
                setAnswers({});
                setQuizScore(null);
                tracker.current.reset();
                setWatchAttempt(attempt => attempt + 1);
                setStatus("Watch the full video again to unlock the quiz reattempt. No additional XP will be awarded.");
              }}
            >
              <Icon name="refresh" size={15} /> Redo quiz
            </button>}
            <div className="lesson-video-action-tools">
              <button type="button" className={`lesson-video-icon-button${liked ? " is-active" : ""}`} aria-label={liked ? "Unlike video" : "Like video"} aria-pressed={liked} onClick={() => {
                try {
                  onLike?.(!liked);
                  setLiked(!liked);
                  setStatus(!liked && onLike ? "Video liked. The first like on this video earns 5 XP; liking again earns no extra XP." : "");
                } catch (cause) {
                  setStatus(cause instanceof Error ? cause.message : "Your like could not be saved. Please retry.");
                }
              }}>
                <Icon name="thumbUp" size={18} />
              </button>
              <button type="button" className="lesson-video-icon-button" aria-label={showComments ? "Hide comments" : "Show comments"} aria-expanded={showComments} onClick={() => setShowComments((value) => !value)}>
                <Icon name="message" size={18} />
              </button>
              {learnerProfile?.role === "Super User" && <a className="lesson-video-icon-button lesson-video-more-button" href={link} target="_blank" rel="noopener noreferrer" aria-label="Open source video">
                <Icon name="more" size={18} />
              </a>}
            </div>
          </div>
          {status && <p className="lesson-video-status" role="status">{status}</p>}

          {showComments && (
            <section className="lesson-video-comments" aria-label="Video comments">
              <h3>Comments ({comments.length})</h3>
              {comments.length > 0 ? (
                <ul>
                  {comments.map((comment) => <li key={comment.id}>
                    <Avatar profile={comment.author as Profile} size={32} />
                    <span className="lesson-video-comment-body">
                      <strong>{comment.author.name}</strong>
                      {editingCommentId === comment.id ? <form
                        className="lesson-video-comment-edit"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const text = editCommentDraft.trim();
                          if (!text) return;
                          const next = comments.map(item => item.id === comment.id ? { ...item, text } : item);
                          setComments(next);
                          onComment?.(next);
                          setEditingCommentId(null);
                          setEditCommentDraft("");
                          setStatus("Comment updated.");
                        }}
                      >
                        <input
                          value={editCommentDraft}
                          onChange={(event) => setEditCommentDraft(event.target.value)}
                          aria-label="Edit comment"
                          autoFocus
                        />
                        <button type="submit" disabled={!editCommentDraft.trim()}>Save</button>
                        <button type="button" className="is-cancel" onClick={() => {
                          setEditingCommentId(null);
                          setEditCommentDraft("");
                        }}>Cancel</button>
                      </form> : <span>{comment.text}</span>}
                    </span>
                    {comment.author.id === commenterProfile.id && editingCommentId !== comment.id && <button
                      type="button"
                      className="lesson-video-comment-like"
                      aria-label="Edit your comment"
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditCommentDraft(comment.text);
                      }}
                    >
                      <Icon name="pencil" size={14} />
                    </button>}
                    {comment.author.id !== commenterProfile.id && <button
                      type="button"
                      className={`lesson-video-comment-like${comment.likedBy.includes(commenterProfile.id) ? " is-active" : ""}`}
                      aria-label={comment.likedBy.includes(commenterProfile.id) ? `Unlike ${comment.author.name}'s comment` : `Like ${comment.author.name}'s comment`}
                      aria-pressed={comment.likedBy.includes(commenterProfile.id)}
                      onClick={() => {
                        const liked = comment.likedBy.includes(commenterProfile.id);
                        const next = comments.map(item => item.id === comment.id
                          ? { ...item, likedBy: liked ? item.likedBy.filter(id => id !== commenterProfile.id) : [...item.likedBy, commenterProfile.id] }
                          : item);
                        setComments(next);
                        onComment?.(next);
                      }}
                    >
                      <Icon name="thumbUp" size={14} />
                      {comment.likedBy.length > 0 && <span>{comment.likedBy.length}</span>}
                    </button>}
                  </li>)}
                </ul>
              ) : (
                <p>Start the conversation about this video.</p>
              )}
              <form onSubmit={addComment}>
                <label className="sr-only" htmlFor={`lesson-video-comment-${index}`}>Write a comment</label>
                <input
                  id={`lesson-video-comment-${index}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a comment..."
                />
                <button type="submit" disabled={!commentDraft.trim()}>Post</button>
              </form>
            </section>
          )}
          </div>
        </section>
      </div>,
      document.body
    )}
  </>;
}

export function LessonVideos({
  links,
  completed = false,
  learnerName = "You",
  learnerProfile,
  onComplete,
  quizzes,
  completedVideoIds,
  logbook,
  onLike,
  onComment,
  titles,
  onWatchProgress,
  onViewCount,
}: {
  links: string[];
  completed?: boolean;
  learnerName?: string;
  learnerProfile?: Profile;
  quizzes?: Record<string, VideoQuiz>;
  completedVideoIds?: string[];
  onComplete?: (link: string, answers: number[]) => void;
  logbook?: Record<string, string | boolean>;
  onLike?: (link: string, liked: boolean) => void;
  onComment?: (link: string, comments: VideoComment[]) => void;
  onWatchProgress?: (link: string, seconds: number, duration: number) => void;
  onViewCount?: (link: string, views: number) => void;
  titles?: Record<string, string>;
}) {
  return <>{links.map((link, index) => {
    let id: string;
    try { id = videoQuizId(link); }
    catch (cause) {
      return <p key={`${index}:${link}`} className="auth-error" role="alert">
        {cause instanceof Error ? cause.message : "Invalid video link."}
      </p>;
    }
    let initialComments: Array<string | VideoComment> = [];
    const storedComments = logbook?.[videoEngagementKey(link, "comments")];
    if (typeof storedComments === "string") {
      try {
        const parsed: unknown = JSON.parse(storedComments);
        if (!Array.isArray(parsed) || !parsed.every(comment => typeof comment === "string" || isVideoComment(comment)))
          throw new Error("Saved video comments are invalid.");
        initialComments = parsed;
      } catch (cause) {
        return <p key={id} className="auth-error" role="alert">
          {cause instanceof Error ? cause.message : "Saved video comments could not be loaded."}
        </p>;
      }
    }
    return <LessonVideo
      key={`${index}:${link}:${JSON.stringify(quizzes?.[id]?.questions)}`}
      link={link}
      index={index}
      heading={titles?.[id]}
      completed={completedVideoIds?.includes(id) ?? completed}
      questions={quizzes?.[id]?.questions}
      learnerName={learnerName}
      learnerProfile={learnerProfile}
      initialLiked={logbook?.[videoEngagementKey(link, "liked")] === true}
      initialComments={initialComments}
      onLike={onLike ? liked => onLike(link, liked) : undefined}
      onComment={onComment ? comments => onComment(link, comments) : undefined}
      onWatchProgress={onWatchProgress ? (seconds, duration) => onWatchProgress(link, seconds, duration) : undefined}
      onViewCount={onViewCount ? views => onViewCount(link, views) : undefined}
      onComplete={onComplete ? answers => onComplete(link, answers) : undefined}
    />;
  })}</>;
}
