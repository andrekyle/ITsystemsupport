import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { lessonVideoSource, type LessonVideoSource } from "../lib/lessonVideo";
import { recordLessonVideoView } from "../lib/lessonVideoViews";

export function LessonVideoEditor({ links, onSave, disabled }: {
  links: string[];
  onSave: (links: string[]) => Promise<void>;
  disabled: boolean;
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
      aria-expanded={open} onClick={() => setOpen(value => !value)}>Add video</button>
    {open && <div className="lesson-video-form">
      <label>Video link
        <input type="url" value={link} disabled={saving || disabled}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={event => setLink(event.target.value)} />
      </label>
      <p className="muted">YouTube, Vimeo, or a direct MP4, WebM or OGV link. The host must allow playback or embedding.</p>
      <button type="button" className="btn ghost sm" disabled={!link.trim() || saving || disabled}
        onClick={() => {
          try {
            const source = lessonVideoSource(link);
            if (links.some(existing => lessonVideoSource(existing).src === source.src)) throw new Error("This video is already on the slide.");
            void save([...links, link.trim()]);
          } catch (cause) { setError(cause instanceof Error ? cause.message : "The video link is invalid."); }
        }}>{saving ? "Saving..." : "Insert video"}</button>
      {links.map((value, index) => <div className="lesson-video-entry" key={`${index}:${value}`}>
        <span>{value}</span>
        <button type="button" className="btn ghost sm" disabled={saving || disabled}
          onClick={() => void save(links.filter((_, i) => i !== index))}>Remove video {index + 1}</button>
      </div>)}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>}
  </div>;
}

function LessonVideoPreview({ source }: { source: LessonVideoSource }) {
  const [error, setError] = useState("");
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
      src={`https://i.ytimg.com/vi/${url.pathname.split("/")[2]}/hqdefault.jpg`}
      alt=""
      loading="lazy"
      onError={() => setError("Video thumbnail unavailable. Select Watch video to try playback.")}
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
}: {
  link: string;
  index: number;
  completed: boolean;
  learnerName: string;
  onComplete?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const [platformViewCount, setPlatformViewCount] = useState<number | null>(null);
  const [viewCountError, setViewCountError] = useState("");
  const openButton = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const sharePending = useRef(false);
  let source;
  try { source = lessonVideoSource(link); }
  catch (cause) {
    return <p className="auth-error" role="alert">{cause instanceof Error ? cause.message : "Invalid video link."}</p>;
  }

  const title = `Lesson video ${index + 1}`;
  const playerSrc = (() => {
    if (source.kind !== "embed") return source.src;
    const url = new URL(source.src);
    url.searchParams.set("autoplay", "1");
    return url.href;
  })();

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
    setComments((current) => [...current, comment]);
    setCommentDraft("");
    setShowComments(true);
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
          setPlatformViewCount(null);
          setViewCountError("");
          void recordLessonVideoView(source.src).then(setPlatformViewCount).catch((cause: unknown) => {
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
                {platformViewCount === null
                  ? viewCountError || `${learnerName || "You"} · ${completed ? "completed this lesson" : "learning now"}`
                  : `${platformViewCount.toLocaleString()} ${platformViewCount === 1 ? "view" : "views"} on this platform`}
              </span>
            </div>
            <button ref={closeButton} type="button" className="lesson-video-icon-button" aria-label="Close video" onClick={() => setOpen(false)}>
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="lesson-video-player">
            {source.kind === "embed" ? (
              <iframe
                src={playerSrc}
                title={title}
                allow="autoplay; picture-in-picture; encrypted-media"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <video controls autoPlay preload="metadata" src={source.src} onError={() => setFailed(true)} />
            )}
            {failed && <p className="auth-error" role="alert">This video could not be played. Check the link and the video host's permissions.</p>}
          </div>

          <div className="lesson-video-description">
            <span className="lesson-video-kind">VIDEO LESSON · {source.kind === "embed" ? "STREAMING" : "VIDEO FILE"}</span>
            <h2 id={`lesson-video-title-${index}`}>{title}</h2>
            <p>Part of your course learning materials.</p>
            <a href={link} target="_blank" rel="noopener noreferrer">Open video source</a>
          </div>

          <div className="lesson-video-stats" aria-label="Your activity">
            <span>
              {platformViewCount === null
                ? viewCountError ? "Views unavailable" : "Views loading"
                : `${platformViewCount.toLocaleString()} Platform views`}
            </span>
            <span>{completed ? "Completed" : "Not completed"}</span>
            <span>{shareCount} {shareCount === 1 ? "Share" : "Shares"}</span>
            <span>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</span>
            <span>{liked ? "1 Like" : "0 Likes"}</span>
          </div>

          <div className="lesson-video-actions">
            <button
              type="button"
              className={`lesson-video-complete${completed ? " is-complete" : ""}`}
              disabled={completed || !onComplete}
              onClick={onComplete}
            >
              <Icon name="checkCircle" size={16} />
              {completed ? "Completed" : "Complete"}
            </button>
            <div className="lesson-video-action-tools">
              <button type="button" className={`lesson-video-icon-button${liked ? " is-active" : ""}`} aria-label={liked ? "Unlike video" : "Like video"} aria-pressed={liked} onClick={() => setLiked((value) => !value)}>
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
}: {
  links: string[];
  completed?: boolean;
  learnerName?: string;
  onComplete?: () => void;
}) {
  return <>{links.map((link, index) => (
    <LessonVideo
      key={`${index}:${link}`}
      link={link}
      index={index}
      completed={completed}
      learnerName={learnerName}
      onComplete={onComplete}
    />
  ))}</>;
}
