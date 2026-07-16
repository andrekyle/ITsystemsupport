import { useRef, useState } from "react";
import JSZip from "jszip";
import { Icon } from "../icons";
import type { PoeDoc, Profile } from "../types";
import { POE_SECTIONS, POE_TOTAL } from "../data/course";
import { loadProfiles, usePoe } from "../store";
import { downloadDoc, getFileBlob, uploadFile, userPrefix } from "../lib/files";
import { Avatar } from "../components/Avatar";
import { Ring } from "../components/Ring";

const MAX_FILE_MB = 10;

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const done = Object.keys(docs).length;

  async function downloadAll() {
    const zip = new JSZip();
    const clean = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim();
    for (const sec of POE_SECTIONS) {
      for (const item of sec.items) {
        const doc = docs[item.id];
        if (!doc) continue;
        const blob = await getFileBlob(doc);
        if (!blob) continue;
        const folder = clean(sec.heading);
        zip.file(`${folder}/${clean(item.label).slice(0, 80)} — ${clean(doc.name)}`, blob);
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
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`"${file.name}" is too large — files must be ${MAX_FILE_MB} MB or smaller.`);
      return;
    }
    try {
      const prefix = await userPrefix();
      const doc: PoeDoc = await uploadFile(`${prefix}/poe/${viewId}/${pendingItem}`, file);
      if (!saveDoc(pendingItem, doc)) {
        setError("Storage is full — remove some documents and try again.");
      }
    } catch {
      setError("The file could not be uploaded — check your connection and try again.");
    }
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
          {sec.items.map((item) => {
            const doc = docs[item.id];
            return (
              <div className="poe-row" key={item.id}>
                <div className="poe-item">
                  <span className={`status ${doc ? "done" : "none"}`}>
                    <Icon name={doc ? "checkCircle" : "circle"} size={20} />
                  </span>
                  <span className="t">{item.label}</span>
                </div>
                <div className="poe-doc">
                  {doc ? (
                    <>
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
                          onClick={() => removeDoc(item.id)}
                          title="Remove document"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  ) : canEdit && !readOnly ? (
                    <button className="btn ghost poe-upload" onClick={() => pickFor(item.id)}>
                      <Icon name="folder" size={15} />
                      Upload document
                    </button>
                  ) : (
                    <span className="muted">No document uploaded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={onPickFile} />

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
