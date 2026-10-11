import { useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, ProfileContentEntry, ProfileContentType } from "../types";
import { ConfirmModal, Modal } from "./Modal";
import { fileToImageDataUrl } from "./Avatar";

const CONTENT_TYPES: { type: ProfileContentType; icon: string; achievement?: boolean }[] = [
  { type: "Article", icon: "document" },
  { type: "Podcast", icon: "wave" },
  { type: "Video", icon: "play" },
  { type: "Book", icon: "book" },
  { type: "Course", icon: "presenter" },
  { type: "Event", icon: "calendar" },
  { type: "Experience", icon: "briefcase" },
  { type: "Accomplishment", icon: "award", achievement: true },
  { type: "Award", icon: "award", achievement: true },
  { type: "Certificate", icon: "certificate", achievement: true },
  { type: "Badge", icon: "shield", achievement: true },
  { type: "Degree", icon: "gradcap", achievement: true },
];

export function ProfilePortfolio({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<ProfileContentEntry | null>(null);
  const [removing, setRemoving] = useState<ProfileContentEntry | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const entries = profile.contentEntries ?? [];
  const close = () => { if (uploading) return; setAdding(false); setDraft(null); setError(""); };

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    setUploading(true);
    try {
      const image = await fileToImageDataUrl(file, 800);
      setDraft(current => current ? { ...current, image } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload the image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || uploading) return;
    const title = draft.title.trim();
    const titleInput = event.currentTarget.elements.namedItem("title");
    if (titleInput instanceof HTMLInputElement) {
      titleInput.setCustomValidity(title ? "" : "Enter a title.");
      if (!titleInput.reportValidity()) return;
    }
    const entry = {
      ...draft,
      title,
      organisation: draft.organisation.trim(),
      description: draft.description.trim(),
      url: draft.url.trim(),
    };
    try {
      onUpdateProfile({
        contentEntries: entries.some(item => item.id === entry.id)
          ? entries.map(item => item.id === entry.id ? entry : item)
          : [...entries, entry],
      });
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the entry. Please try again.");
    }
  }

  return (
    <>
      <h2 className="section-title">
        <span className="ico"><Icon name="award" size={20} /></span>
        Learning & achievements
        <button className="btn ghost profile-edit" type="button" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} /> Add
        </button>
      </h2>
      <p className="lesson-p">Build your profile with learning, experience and achievements.</p>
      {entries.length === 0 ? (
        <div className="callout">
          <Icon name="info" size={19} />
          <span>No entries yet. Select Add to document your learning or an achievement.</span>
        </div>
      ) : (
        <div className="profile-content-grid">
          {entries.map(entry => (
            <article className="card profile-content-entry" key={entry.id}>
              {entry.image && <img className="profile-content-image" src={entry.image} alt={`Image for ${entry.title}`} />}
              <span className="pill">
                <Icon name={CONTENT_TYPES.find(item => item.type === entry.type)?.icon ?? "document"} size={15} />
                {entry.type}
              </span>
              <h3>{entry.title}</h3>
              {(entry.organisation || entry.date) && (
                <p className="profile-content-meta">{[entry.organisation, entry.date].filter(Boolean).join(" · ")}</p>
              )}
              {entry.description && <p className="profile-content-description">{entry.description}</p>}
              {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer">View resource <Icon name="chevronRight" size={13} /></a>}
              <div className="profile-content-actions">
                <button className="icon-btn" type="button" title="Edit entry" aria-label={`Edit ${entry.title}`}
                  onClick={() => { setDraft({ ...entry }); setAdding(true); }}><Icon name="pencil" size={18} /></button>
                <button className="icon-btn danger-text" type="button" title="Remove entry" aria-label={`Remove ${entry.title}`}
                  onClick={() => setRemoving(entry)}><Icon name="trash" size={18} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
      {adding && (
        <Modal
          title={draft ? `${entries.some(entry => entry.id === draft.id) ? "Edit" : "Add"} ${draft.type.toLowerCase()}` : "Add content to your profile"}
          className="profile-content-modal"
          onClose={close}
          actions={draft ? (
            <>
              <button className="btn ghost" type="button" disabled={uploading} onClick={close}>Cancel</button>
              <button className="btn" type="submit" form="profile-content-form" disabled={uploading}>Save</button>
            </>
          ) : <button className="btn ghost" type="button" onClick={close}>Cancel</button>}
        >
          {error && <p className="auth-error" role="alert">{error}</p>}
          {draft ? (
            <form id="profile-content-form" onSubmit={save}>
              <div className="profile-image-upload">
                <span className="profile-image-upload-label">Image <span>(optional)</span></span>
                <button type="button" className="btn ghost profile-image-upload-button"
                  disabled={uploading} onClick={() => imageInputRef.current?.click()}>
                  <Icon name="image" size={18} />
                  {uploading ? "Uploading..." : draft.image ? "Replace image" : "Upload image"}
                </button>
                <input ref={imageInputRef} type="file" hidden aria-label="Image (optional)"
                  accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={uploadImage} />
                <p>PNG, JPEG or WebP. Portrait and landscape images keep their proportions.</p>
              </div>
              {uploading && <p role="status">Uploading image...</p>}
              {draft.image && (
                <div className="profile-content-image-preview">
                  <img className="profile-content-image" src={draft.image} alt="Uploaded image preview" />
                  <button className="icon-btn danger-text" type="button" disabled={uploading}
                    title="Remove image" aria-label="Remove uploaded image"
                    onClick={() => setDraft({ ...draft, image: undefined })}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              )}
              <label className="field">Title
                <input name="title" autoFocus required maxLength={200} value={draft.title}
                  onChange={event => { event.target.setCustomValidity(""); setDraft({ ...draft, title: event.target.value }); }} />
              </label>
              <label className="field">Organisation, author or provider (optional)
                <input maxLength={200} value={draft.organisation} onChange={event => setDraft({ ...draft, organisation: event.target.value })} />
              </label>
              <label className="field">Date (optional)
                <input type="date" value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} />
              </label>
              <label className="field">Description (optional)
                <textarea rows={4} maxLength={4000} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
              </label>
              <label className="field">Resource link (optional)
                <input type="url" placeholder="https://" value={draft.url}
                  pattern="https?://.+" title="Use a full http:// or https:// link."
                  onChange={event => setDraft({ ...draft, url: event.target.value })} />
              </label>
            </form>
          ) : (
            <>
              {[false, true].map(achievement => (
                <section className="profile-content-picker" key={String(achievement)}>
                  <h3>{achievement ? "Achievements" : "Learning & experience"}</h3>
                  <p>{achievement ? "Demonstrate skill by documenting what you have achieved." : "Add learning, experience, and coursework to your profile."}</p>
                  <div className="profile-content-options">
                    {CONTENT_TYPES.filter(item => !!item.achievement === achievement).map(item => (
                      <button className="btn ghost sm" type="button" key={item.type} onClick={() => setDraft({
                        id: crypto.randomUUID(), type: item.type, title: "", organisation: "", date: "", description: "", url: "",
                      })}>
                        <Icon name={item.icon} size={16} /> {item.type}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </Modal>
      )}
      {removing && (
        <ConfirmModal title="Remove profile entry?" message={<>
          <p>Remove "{removing.title}" from your profile?</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </>}
          confirmLabel="Remove" danger onCancel={() => { setRemoving(null); setError(""); }} onConfirm={() => {
            try {
              onUpdateProfile({ contentEntries: entries.filter(entry => entry.id !== removing.id) });
              setRemoving(null);
              setError("");
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not remove the entry. Please try again.");
            }
          }} />
      )}
    </>
  );
}
