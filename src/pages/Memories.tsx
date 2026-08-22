import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { isStaff } from "../types";
import { useMemories, type MemoryPhoto } from "../store";
import { fileToImageDataUrl } from "../components/Avatar";
import { ConfirmModal } from "../components/Modal";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** Class photo wall — everyone uploads pictures; play them back as a slideshow. */
export function MemoriesPage({ profile }: { profile: Profile }) {
  const staff = isStaff(profile.role);
  const { photos, urls, addPhotos, removePhoto } = useMemories();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  /** slideshow overlay: index into the chronological list; auto = advancing */
  const [show, setShow] = useState<{ idx: number; auto: boolean } | null>(null);

  const srcOf = (p: MemoryPhoto) => p.image ?? urls[p.id];
  /** chronological order for the slideshow (the story of the class) */
  const chrono = useMemo(
    () => [...photos].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)).filter((p) => srcOf(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos, urls]
  );
  /** newest first for the wall */
  const wall = useMemo(() => [...chrono].reverse(), [chrono]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;
    setError(null);
    const images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setBusy(`Preparing ${i + 1} / ${files.length}…`);
      try {
        images.push(await fileToImageDataUrl(files[i], 1600));
      } catch {
        // unreadable file — skip it
      }
    }
    if (!images.length) {
      setBusy(null);
      setError("Those files could not be read as pictures — try JPG or PNG photos.");
      return;
    }
    setBusy(images.length === 1 ? "Uploading your picture…" : `Uploading ${images.length} pictures…`);
    const saved = await addPhotos(profile, images);
    setBusy(null);
    if (saved === 0) {
      setError("The pictures could not be saved — check your connection and try again.");
    } else if (saved < images.length) {
      setError(`${saved} of ${images.length} pictures were saved — check your connection and retry the rest.`);
    }
  }

  return (
    <>
      <div className="eyebrow">
        <Icon name="image" size={15} />
        Gallery
      </div>
      <h1 className="page-title">Class memories</h1>
      <p className="page-sub">
        Our photo wall. Upload pictures from the classroom, group work and everything in between — then
        sit back and relive the course as a slideshow.
      </p>

      <div className="mem-actions">
        <button className="btn solid sm" onClick={() => fileRef.current?.click()} disabled={!!busy}>
          <Icon name="image" size={14} />
          Add pictures
        </button>
        <button
          className="btn ghost sm"
          onClick={() => setShow({ idx: 0, auto: true })}
          disabled={!chrono.length || !!busy}
          title={chrono.length ? "Play all pictures as a slideshow" : "Upload pictures first"}
        >
          <Icon name="play" size={14} />
          Play slideshow
        </button>
        {busy && <span className="mem-busy">{busy}</span>}
        {error && <span className="mem-error">{error}</span>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void onPick(e)}
        />
      </div>

      {wall.length === 0 && !busy ? (
        <div className="mem-empty">
          <Icon name="image" size={26} />
          <p>No pictures yet — be the first to add a class memory.</p>
        </div>
      ) : (
        <div className="mem-grid">
          {wall.map((p) => {
            const src = srcOf(p)!;
            const canRemove = staff || p.byId === profile.id;
            const chronoIdx = chrono.findIndex((c) => c.id === p.id);
            return (
              <figure className="mem-card" key={p.id}>
                <button
                  type="button"
                  className="mem-open"
                  title="Click to view"
                  onClick={() => setShow({ idx: Math.max(0, chronoIdx), auto: false })}
                >
                  <img src={src} alt={`Photo by ${p.by}`} loading="lazy" />
                </button>
                <figcaption className="mem-meta">
                  <span className="mem-by" title={p.by}>{p.by}</span>
                  <span className="mem-when">{fmtDate(p.uploadedAt)}</span>
                </figcaption>
                {canRemove && (
                  <button
                    type="button"
                    className="mem-del"
                    title="Remove this picture"
                    onClick={() => setConfirmId(p.id)}
                  >
                    <Icon name="close" size={13} />
                  </button>
                )}
              </figure>
            );
          })}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="Remove picture"
          message="Remove this picture from the class memories? This cannot be undone."
          confirmLabel="Remove"
          danger
          onConfirm={() => {
            void removePhoto(confirmId);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {show && chrono.length > 0 && (
        <Slideshow
          photos={chrono}
          srcOf={(p) => srcOf(p)!}
          start={Math.min(show.idx, chrono.length - 1)}
          auto={show.auto}
          onClose={() => setShow(null)}
        />
      )}
    </>
  );
}

const SLIDE_MS = 5000;

function Slideshow({
  photos,
  srcOf,
  start,
  auto,
  onClose,
}: {
  photos: MemoryPhoto[];
  srcOf: (p: MemoryPhoto) => string;
  start: number;
  auto: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);
  const [playing, setPlaying] = useState(auto);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);

  const next = () => setIdx((i) => (i + 1) % photos.length);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);

  // auto-advance
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(next, SLIDE_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, photos.length]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, photos.length]);

  // go fullscreen while the slideshow is open; closing fullscreen closes the show
  useEffect(() => {
    rootRef.current?.requestFullscreen?.().catch(() => {});
    const onFs = () => {
      if (!document.fullscreenElement && !closingRef.current) onClose();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    closingRef.current = true;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    onClose();
  };

  const cur = photos[idx];
  return (
    <div className="mem-show" ref={rootRef} role="dialog" aria-label="Class slideshow">
      <img key={cur.id} src={srcOf(cur)} alt={`Photo by ${cur.by}`} className={playing ? "kenburns" : undefined} />
      <div className="mem-show-cap">
        <strong>{cur.by}</strong>
        <span>{fmtDate(cur.uploadedAt)}</span>
      </div>
      <div className="mem-show-count">
        {idx + 1} / {photos.length}
      </div>
      <div className="mem-show-ctrl">
        <button className="mem-show-btn" title="Previous (←)" onClick={prev}>
          <Icon name="chevronLeft" size={17} />
        </button>
        <button
          className="mem-show-btn"
          title={playing ? "Pause (space)" : "Play (space)"}
          onClick={() => setPlaying((p) => !p)}
        >
          <Icon name={playing ? "pause" : "play"} size={17} />
        </button>
        <button className="mem-show-btn" title="Next (→)" onClick={next}>
          <Icon name="chevronRight" size={17} />
        </button>
        <button className="mem-show-btn" title="Close (Esc)" onClick={close}>
          <Icon name="close" size={17} />
        </button>
      </div>
    </div>
  );
}
