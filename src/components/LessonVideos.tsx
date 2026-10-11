import { useState } from "react";
import { lessonVideoSource } from "../lib/lessonVideo";

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

function LessonVideo({ link, index }: { link: string; index: number }) {
  const [failed, setFailed] = useState(false);
  let source;
  try { source = lessonVideoSource(link); }
  catch (cause) {
    return <p className="auth-error" role="alert">{cause instanceof Error ? cause.message : "Invalid video link."}</p>;
  }
  return <figure className="lesson-video">
    {source.kind === "embed" ? <iframe src={source.src} title={`Lesson video ${index + 1}`}
      allow="picture-in-picture; encrypted-media" allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin" />
      : <video controls preload="metadata" src={source.src} onError={() => setFailed(true)} />}
    {failed && <p className="auth-error" role="alert">This video could not be played. Check the link and the video host's permissions.</p>}
    <figcaption><a href={link} target="_blank" rel="noopener noreferrer">Open video {index + 1} on its source site</a></figcaption>
  </figure>;
}

export function LessonVideos({ links }: { links: string[] }) {
  return <>{links.map((link, index) => <LessonVideo key={`${index}:${link}`} link={link} index={index} />)}</>;
}
