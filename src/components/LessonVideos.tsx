import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { lessonVideoSource, type LessonVideoSource } from "../lib/lessonVideo";
import { recordLessonVideoView, type LessonVideoViewCount } from "../lib/lessonVideoViews";
import type { QuizQuestion } from "../types";
import { validVideoQuestions, videoEngagementKey, videoQuizId, VideoWatchTracker, type VideoQuiz } from "../lib/videoLearning";
import { VideoQuizEditor } from "./VideoQuizEditor";
import { TrackedVideoPlayer } from "./TrackedVideoPlayer";

export function LessonVideoEditor({ links, onSave, disabled, quizzes, onSaveQuiz }: {
  links: string[];
  onSave: (links: string[]) => Promise<void>;
  disabled: boolean;
  quizzes?: Record<string, VideoQuiz>;
  onSaveQuiz?: (link: string, quiz: VideoQuiz) => Promise<void>;
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
    <button type="button" className="btn ghost sm" disabled={disabled || saving}
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
      <button type="button" className="btn ghost sm" disabled={!link.trim() || saving || disabled}
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
        <a className="lesson-video-source-link" href={value} target="_blank" rel="noopener noreferrer"
          title={value}>Open video source <Icon name="chevronRight" size={14} /></a>
        {onSaveQuiz && <VideoQuizEditor quiz={quizzes?.[videoQuizId(value)]} disabled={saving || disabled}
          onSave={quiz => onSaveQuiz(value, quiz)} />}
      </div>)}
    </div>}
    {error && <p className="auth-error" role="alert">{error}</p>}
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
  completed,
  learnerName,
  onComplete,
  questions,
  initialLiked = false,
  initialComments = [],
  onLike,
  onComment,
}: {
  link: string;
  index: number;
  completed: boolean;
  learnerName: string;
  questions?: QuizQuestion[];
  onComplete?: (answers: number[]) => void;
  initialLiked?: boolean;
  initialComments?: string[];
  onLike?: (liked: boolean) => void;
  onComment?: (comments: string[]) => void;
}) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<string[]>(initialComments);
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const [platformViews, setPlatformViews] = useState<LessonVideoViewCount | null>(null);
  const [viewCountError, setViewCountError] = useState("");
  const openButton = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const sharePending = useRef(false);
  const tracker = useRef(new VideoWatchTracker());
  const [watchedFully, setWatchedFully] = useState(false);
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

  const title = `Lesson video ${index + 1}`;
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

  async function shareVideo() {
    if (sharePending.current) return;
    sharePending.current = true;
    setSharing(true);
    setStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title, url: link });
        setShareCount((count) => count + 1);
        setStatus("Video shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setStatus("Video link copied. Copying a link does not count as a share.");
      } else {
        setStatus("Sharing is not available in this browser.");
        return;
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setStatus(cause instanceof Error ? cause.message : "The video could not be shared.");
    } finally {
      sharePending.current = false;
      setSharing(false);
    }
  }

  function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = commentDraft.trim();
    if (!comment) return;
    try {
      const next = [...comments, comment];
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
    <figure className="lesson-video">
      <button
        ref={openButton}
        type="button"
        className="lesson-video-launch"
        aria-label={`Watch ${title} in expanded player`}
        onClick={() => {
          setFailed(false);
          setPlaybackError("");
          setViewCountError("");
          // The platform counts each learner once a day; the last total stays visible while it refreshes.
          void recordLessonVideoView(source.src).then(setPlatformViews).catch((cause: unknown) => {
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
              <span className="lesson-video-watched-avatar" aria-hidden="true">
                {learnerName.trim().charAt(0).toUpperCase() || "Y"}
              </span>
              <span>
                {platformViews === null
                  ? `${learnerName || "You"} · ${isCompleted ? "completed this video" : "learning now"}`
                  : <>
                    {`${platformViews.views.toLocaleString()} ${platformViews.views === 1 ? "view" : "views"} on this platform`}
                    <small className="lesson-video-daily-note">
                      {platformViews.counted ? "Counted as your view for today" : "You were already counted today"} · one view per learner per day
                    </small>
                  </>}
              </span>
            </div>
            <button ref={closeButton} type="button" className="lesson-video-icon-button" aria-label="Close video" onClick={() => setOpen(false)}>
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="lesson-video-player">
            <TrackedVideoPlayer source={source} title={title} tracker={tracker.current}
              onFinished={() => { setWatchedFully(true); setPlaybackError(""); }}
              onError={setPlaybackError} />
          </div>
          <div className="lesson-video-scroll-content" tabIndex={0} aria-label="Video details and questions">
          {playbackError && <p className="auth-error lesson-video-feedback" role="alert">{playbackError}</p>}
          {viewCountError && <p className="auth-error lesson-video-feedback" role="alert">{viewCountError}</p>}
          {!quizReady && !isCompleted && <p className="lesson-video-feedback" role="status">
            Staff must add this video's transcript and five questions before it can be completed.
          </p>}
          {watchedFully && quizReady && !isCompleted && <section className="lesson-video-quiz" aria-label="Video knowledge check">
            <h3>Video knowledge check</h3>
            <p>Answer all five questions correctly to unlock Complete and earn XP.</p>
            <form onSubmit={event => {
              event.preventDefault();
              setQuizScore(questions.reduce((score, question, i) => score + (answers[i] === question.answer ? 1 : 0), 0));
            }}>
              {questions.map((question, i) => <fieldset key={i}>
                <legend>{i + 1}. {question.q}</legend>
                {question.options.map((option, oi) => <label key={oi}>
                  <input type="radio" name={`video-${index}-question-${i}`} checked={answers[i] === oi}
                    onChange={() => { setAnswers(current => ({ ...current, [i]: oi })); setQuizScore(null); }} />
                  {option}
                </label>)}
              </fieldset>)}
              <button type="submit" className="btn" disabled={Object.keys(answers).length !== 5}>Check video answers</button>
            </form>
            {quizScore !== null && <p role="status">{quizScore === 5
              ? "5/5 correct. Complete is now available."
              : `${quizScore}/5 correct. Review the video and try again; all five must be correct.`}</p>}
          </section>}

          <div className="lesson-video-description">
            <span className="lesson-video-kind">VIDEO LESSON · {source.kind === "embed" ? "STREAMING" : "VIDEO FILE"}</span>
            <h2 id={`lesson-video-title-${index}`}>{title}</h2>
            <p>Part of your course learning materials.</p>
            <a href={link} target="_blank" rel="noopener noreferrer">Open video source</a>
          </div>

          <div className="lesson-video-stats" aria-label="Your activity">
            <span title="Each learner counts once a day">
              {platformViews === null
                ? viewCountError ? "Views unavailable" : "Views loading"
                : `${platformViews.views.toLocaleString()} Platform views`}
            </span>
            <span>{shareCount} {shareCount === 1 ? "Share" : "Shares"}</span>
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
              <button type="button" className="lesson-video-icon-button" aria-label="Share video" disabled={sharing} onClick={() => void shareVideo()}>
                <Icon name="share" size={18} />
              </button>
              <button type="button" className={`lesson-video-icon-button${saved ? " is-active" : ""}`} aria-label={saved ? "Remove saved video" : "Save video"} aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
                <Icon name="tag" size={18} />
              </button>
              <button type="button" className="lesson-video-icon-button" aria-label="Show comments" aria-expanded={showComments} onClick={() => setShowComments((value) => !value)}>
                <Icon name="message" size={18} />
              </button>
              <a className="lesson-video-icon-button" href={link} target="_blank" rel="noopener noreferrer" aria-label="Open source video">
                <Icon name="more" size={18} />
              </a>
            </div>
          </div>
          {status && <p className="lesson-video-status" role="status">{status}</p>}

          {showComments && (
            <section className="lesson-video-comments" aria-label="Video comments">
              <h3>Comments ({comments.length})</h3>
              {comments.length > 0 ? (
                <ul>
                  {comments.map((comment, commentIndex) => <li key={`${commentIndex}-${comment}`}>{comment}</li>)}
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
  onComplete,
  quizzes,
  completedVideoIds,
  logbook,
  onLike,
  onComment,
}: {
  links: string[];
  completed?: boolean;
  learnerName?: string;
  quizzes?: Record<string, VideoQuiz>;
  completedVideoIds?: string[];
  onComplete?: (link: string, answers: number[]) => void;
  logbook?: Record<string, string | boolean>;
  onLike?: (link: string, liked: boolean) => void;
  onComment?: (link: string, comments: string[]) => void;
}) {
  return <>{links.map((link, index) => {
    let id: string;
    try { id = videoQuizId(link); }
    catch (cause) {
      return <p key={`${index}:${link}`} className="auth-error" role="alert">
        {cause instanceof Error ? cause.message : "Invalid video link."}
      </p>;
    }
    let initialComments: string[] = [];
    const storedComments = logbook?.[videoEngagementKey(link, "comments")];
    if (typeof storedComments === "string") {
      try {
        const parsed: unknown = JSON.parse(storedComments);
        if (!Array.isArray(parsed) || !parsed.every(comment => typeof comment === "string"))
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
      completed={completedVideoIds?.includes(id) ?? completed}
      questions={quizzes?.[id]?.questions}
      learnerName={learnerName}
      initialLiked={logbook?.[videoEngagementKey(link, "liked")] === true}
      initialComments={initialComments}
      onLike={onLike ? liked => onLike(link, liked) : undefined}
      onComment={onComment ? comments => onComment(link, comments) : undefined}
      onComplete={onComplete ? answers => onComplete(link, answers) : undefined}
    />;
  })}</>;
}
