import { useRef, useState } from "react";
import JSZip from "jszip";
import { Icon } from "../icons";
import type { PoeDoc, Profile } from "../types";
import { MAX_POE_FILES, POE_SECTIONS, POE_TOTAL } from "../data/course";
import { loadProfiles, poeItemCount, usePoe, usePoeReviews } from "../store";
import { downloadDoc, getFileBlob, uploadFile, userPrefix } from "../lib/files";
import { logAudit } from "../lib/audit";
import { Avatar } from "../components/Avatar";
import { Ring } from "../components/Ring";
import { VerdictSwitch } from "../components/VerdictSwitch";
import { PromptModal } from "../components/Modal";

const MAX_FILE_MB = 10;

/** Evidence uploads are limited to document / image / archive formats. */
const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "png", "jpg", "jpeg", "webp", "heic", "gif",
  "txt", "csv", "zip",
];
const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PoePage({ profile }: { profile: Profile }) {
  const isSuper = profile.role === "Super User";
  // assessors and moderators may open any learner's POE (read-only); the super user may also manage it
  const canBrowse = isSuper || profile.role === "Assessor" || profile.role === "Moderator";
  const profiles = loadProfiles();
  const [viewId, setViewId] = useState(profile.id);
  const viewing = profiles.find((p) => p.id === viewId) ?? profile;
  const readOnly = viewId !== profile.id && !isSuper;
  const canEdit = viewId === profile.id || isSuper;
  // downloads: the super user may download anything; everyone else only their own uploads
  const canDownload = viewId === profile.id || isSuper;

  const { docs, saveDoc, removeDoc } = usePoe(viewId);
  const { reviews, setReview, clearReview } = usePoeReviews();
  // assessors, moderators and the super user record review outcomes on learner POEs
  const canReview =
    (profile.role === "Assessor" || profile.role === "Moderator" || isSuper) &&
    viewing.role === "Learner";
  const viewReviews = reviews[viewId] ?? {};
  const reviewedCount = Object.keys(viewReviews).length;
  const competentCount = Object.values(viewReviews).filter((r) => r.status === "competent").length;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nycItem, setNycItem] = useState<string | null>(null);

  const done = poeItemCount(docs);

  /** All files uploaded for an item, oldest key first (multi-file keys use "id__n"). */
  const filesFor = (itemId: string) =>
    Object.entries(docs)
      .filter(([k]) => k === itemId || k.startsWith(`${itemId}__`))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([key, doc]) => ({ key, doc }));

  async function downloadAll() {
    const zip = new JSZip();
    const clean = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim();
    for (const sec of POE_SECTIONS) {
      for (const item of sec.items) {
        const files = filesFor(item.id);
        let i = 0;
        for (const { doc } of files) {
          i++;
          const blob = await getFileBlob(doc);
          if (!blob) continue;
          const folder = clean(sec.heading);
          const suffix = files.length > 1 ? ` (${i})` : "";
          zip.file(`${folder}/${clean(item.label).slice(0, 80)}${suffix} — ${clean(doc.name)}`, blob);
        }
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `POE — ${viewing.name}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function pickFor(itemId: string) {
    setPendingItem(itemId);
    fileRef.current?.click();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingItem) return;
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `"${file.name}" is not an accepted evidence format — upload PDF, Office, image, text or ZIP files.`
      );
      setPendingItem(null);
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`"${file.name}" is too large — files must be ${MAX_FILE_MB} MB or smaller.`);
      setPendingItem(null);
      return;
    }
    setUploadPct(0);
    try {
      const prefix = await userPrefix();
      const doc: PoeDoc = await uploadFile(
        `${prefix}/poe/${viewId}/${pendingItem}`,
        file,
        setUploadPct
      );
      if (!saveDoc(pendingItem, doc)) {
        setError("Storage is full — remove some documents and try again.");
      } else {
        logAudit(profile, "poe.upload", `Uploaded "${file.name}" for POE item ${pendingItem}`, {
          id: viewing.id,
          name: viewing.name,
        });
      }
    } catch {
      setError("The file could not be uploaded — check your connection and try again.");
    }
    setUploadPct(null);
    setPendingItem(null);
  }

  return (
    <>
      <div className="eyebrow">
        <Icon name="folder" size={15} />
        Portfolio of Evidence
      </div>
      <h1 className="page-title">Portfolio of Evidence</h1>
      <p className="page-sub">System Support NQF Level 5 Learnership · Investec Group</p>

      {canBrowse && (
        <div className="poe-viewer card">
          <Icon name="shield" size={18} />
          <span>
            {profile.role} — {isSuper ? "viewing and managing" : "viewing (read-only)"} POE for
          </span>
          <select value={viewId} onChange={(e) => setViewId(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role})
              </option>
            ))}
          </select>
          {viewId !== profile.id && <Avatar profile={viewing} size={26} />}
        </div>
      )}

      <div className="card poe-progress">
        <Ring value={done / POE_TOTAL} size={110} stroke={9} label={`${done} / ${POE_TOTAL}`} />
        <div style={{ flex: 1 }}>
          <div className="lbl">
            POE items complete — your Portfolio of Evidence must be complete before certification
          </div>
          {reviewedCount > 0 && (
            <div className="poe-review-summary">
              <span className="status-chip ok">{competentCount} competent</span>
              {reviewedCount - competentCount > 0 && (
                <span className="status-chip bad">{reviewedCount - competentCount} not yet competent</span>
              )}
              <span className="mini-note">
                {reviewedCount} of {POE_TOTAL} items reviewed by an assessor
              </span>
            </div>
          )}
        </div>
        {canDownload && (
          <button
            className="btn ghost poe-upload"
            onClick={downloadAll}
            disabled={done === 0}
            title={done === 0 ? "No documents uploaded yet" : "Download all documents as a ZIP"}
          >
            <Icon name="download" size={15} />
            Download all
          </button>
        )}
      </div>

      {error && (
        <div className="callout poe-error">
          <span className="ico">
            <Icon name="info" size={19} />
          </span>
          <span>{error}</span>
        </div>
      )}

      {POE_SECTIONS.map((sec) => (
        <div key={sec.heading}>
          <h2 className="section-title">
            <span className="ico">
              <Icon name={sec.icon} size={20} />
            </span>
            {sec.heading}
          </h2>
          <div className="card poe-table-card">
            <table className="data poe-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {sec.items.map((item) => {
            const files = filesFor(item.id);
            const max = sec.multi ? MAX_POE_FILES : 1;
            const uploadingThis =
              uploadPct !== null &&
              pendingItem !== null &&
              (pendingItem === item.id || pendingItem.startsWith(`${item.id}__`));
            const used = new Set(files.map((f) => f.key));
            let nextKey = item.id;
            for (let n = 2; used.has(nextKey); n++) nextKey = `${item.id}__${n}`;
            return (
              <tr key={item.id}>
                <td className="poe-item-cell">
                <div className="poe-item">
                  <span className={`status ${files.length ? "done" : "none"}`}>
                    <Icon name={files.length ? "checkCircle" : "circle"} size={20} />
                  </span>
                  <span className="t">
                    {item.label}
                    {(() => {
                      const rev = viewReviews[item.id];
                      if (!rev) return null;
                      return (
                        <span className="poe-review-line">
                          <span
                            className={`status-chip ${rev.status === "competent" ? "ok" : "bad"}`}
                            title={`Reviewed by ${rev.by} on ${new Date(rev.at).toLocaleDateString()}`}
                          >
                            {rev.status === "competent" ? "Competent" : "Not yet competent"}
                          </span>
                          {rev.note && <span className="mini-note">“{rev.note}”</span>}
                        </span>
                      );
                    })()}
                  </span>
                </div>
                </td>
                <td className="poe-doc-cell">
                <div className={`poe-doc${max > 1 ? " multi" : ""}`}>
                  {files.map(({ key, doc }) => (
                    <div className="poe-doc-line" key={key}>
                      <Icon name="document" size={17} />
                      <span className="fileinfo">
                        <span className="poe-file" title={doc.name}>
                          {doc.name}
                        </span>
                        <span className="meta">
                          {fmtSize(doc.size)} ·{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                      {canDownload && (
                        <button
                          className="poe-dl"
                          onClick={() => void downloadDoc(doc)}
                          title="Download"
                        >
                          <Icon name="download" size={17} />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          className="poe-remove"
                          onClick={() => {
                            removeDoc(key);
                            logAudit(profile, "poe.remove", `Removed "${doc.name}" from POE item ${item.id}`, {
                              id: viewing.id,
                              name: viewing.name,
                            });
                          }}
                          title="Remove document"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {canEdit && !readOnly && files.length < max && (
                    uploadingThis ? (
                      <div className="upload-progress" role="progressbar" aria-valuenow={uploadPct}>
                        <div className="track">
                          <div className="fill" style={{ width: `${uploadPct}%` }} />
                        </div>
                        <span className="pct">{uploadPct}%</span>
                      </div>
                    ) : (
                      <button className="btn ghost poe-upload" onClick={() => pickFor(nextKey)}>
                        <Icon name="folder" size={15} />
                        {files.length === 0
                          ? "Upload document"
                          : `Add another (${files.length}/${max})`}
                      </button>
                    )
                  )}
                  {files.length === 0 && !(canEdit && !readOnly) && (
                    <span className="muted">No document uploaded</span>
                  )}
                  {canReview && files.length > 0 && (
                    <div className="poe-review-actions">
                      <VerdictSwitch
                        value={
                          viewReviews[item.id]
                            ? viewReviews[item.id].status === "competent"
                              ? "yes"
                              : "no"
                            : null
                        }
                        yesLabel="Competent"
                        noLabel="Not yet"
                        yesTitle="Mark this evidence competent"
                        noTitle="Mark not yet competent — the learner sees your feedback"
                        onYes={() => {
                          setReview(profile, viewId, item.id, "competent");
                          logAudit(profile, "poe.review", `Marked POE item ${item.id} competent`, {
                            id: viewing.id,
                            name: viewing.name,
                          });
                        }}
                        onNo={() => setNycItem(item.id)}
                        onClear={() => clearReview(viewId, item.id)}
                      />
                    </div>
                  )}
                </div>
                </td>
              </tr>
            );
          })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <input ref={fileRef} type="file" accept={ACCEPT_ATTR} style={{ display: "none" }} onChange={onPickFile} />

      {nycItem && (
        <PromptModal
          title="Not yet competent"
          message="Feedback for the learner (what must be fixed)?"
          confirmLabel="Record review"
          onSubmit={(note) => {
            setReview(profile, viewId, nycItem, "nyc", note.trim() || undefined);
            logAudit(profile, "poe.review", `Marked POE item ${nycItem} not yet competent`, {
              id: viewing.id,
              name: viewing.name,
            });
            setNycItem(null);
          }}
          onCancel={() => setNycItem(null)}
        />
      )}

      <div className="callout">
        <span className="ico">
          <Icon name="shield" size={19} />
        </span>
        <span>
          Documents are saved to {viewId === profile.id ? "your" : `${viewing.name}'s`} profile on
          this device and are only accessible from {viewId === profile.id ? "your" : "their"}{" "}
          account — and by Super Users for moderation and verification.
        </span>
      </div>
    </>
  );
}
