import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import {
  useOnboardingPacks,
  type OnboardingFile,
  type OnboardingPack,
} from "../store";
import { downloadDoc, getFileBlob, getFileUrl, uploadFile } from "../lib/files";
import { ConfirmModal, Modal } from "../components/Modal";
import { logAudit } from "../lib/audit";

/** Largest single onboarding file accepted, in megabytes. */
const MAX_FILE_MB = 50;

interface FileGroup {
  id: string;
  label: string;
  icon: string;
  extensions: string[];
}

/** Explorer groupings — files are bucketed by extension, in this order. */
const FILE_GROUPS: FileGroup[] = [
  { id: "documents", label: "Documents", icon: "document", extensions: ["doc", "docx", "rtf", "odt", "txt"] },
  { id: "pdfs", label: "PDFs", icon: "clipboard", extensions: ["pdf"] },
  { id: "presentations", label: "Presentations", icon: "presenter", extensions: ["ppt", "pptx", "odp"] },
  { id: "spreadsheets", label: "Spreadsheets", icon: "chart", extensions: ["xls", "xlsx", "csv", "ods"] },
  { id: "web", label: "Web pages", icon: "globe", extensions: ["html", "htm"] },
  { id: "images", label: "Images", icon: "image", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"] },
  { id: "archives", label: "Archives", icon: "layers", extensions: ["zip", "rar", "7z"] },
];

const OTHER_GROUP: FileGroup = { id: "other", label: "Other files", icon: "folder", extensions: [] };

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

function groupOf(file: OnboardingFile): FileGroup {
  const ext = extOf(file.name);
  return FILE_GROUPS.find((g) => g.extensions.includes(ext)) ?? OTHER_GROUP;
}

/** Files that a browser can display directly in a new tab. */
const VIEWABLE = new Set(["pdf", "html", "htm", "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "txt"]);

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** New-folder / rename dialog. */
function PackDialog({
  pack,
  busy,
  onSave,
  onCancel,
}: {
  pack: OnboardingPack | null;
  busy: boolean;
  onSave: (name: string, description: string, audience: "learners" | "staff") => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(pack?.name ?? "");
  const [description, setDescription] = useState(pack?.description ?? "");
  const [audience, setAudience] = useState<"learners" | "staff">(pack?.audience ?? "learners");
  const valid = name.trim().length > 0;
  return (
    <Modal
      title={pack ? "Rename pack" : "New onboarding pack"}
      onClose={() => {
        if (!busy) onCancel();
      }}
      actions={
        <>
          <button className="btn ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn solid"
            disabled={busy || !valid}
            onClick={() => onSave(name, description, audience)}
          >
            {pack ? "Save changes" : "Create pack"}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="pack-name">Pack name</label>
        <input
          id="pack-name"
          autoFocus
          value={name}
          placeholder="e.g. Week 1 induction pack"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="pack-desc">Description (optional)</label>
        <input
          id="pack-desc"
          value={description}
          placeholder="What learners will find inside"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="pack-audience">Who can access this pack?</label>
        <select id="pack-audience" value={audience} onChange={(e) => setAudience(e.target.value as "learners" | "staff")}>
          <option value="learners">Students and staff</option>
          <option value="staff">Facilitators and administrators only</option>
        </select>
      </div>
    </Modal>
  );
}

/** In-app replacement for the browser's unstyleable folder-upload prompt. */
function UploadPackDialog({
  busy,
  onUpload,
  onCancel,
}: {
  busy: boolean;
  onUpload: (name: string, description: string, audience: "learners" | "staff", files: File[]) => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<"learners" | "staff">("learners");
  const [files, setFiles] = useState<File[]>([]);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    files.forEach((file) => {
      const group = FILE_GROUPS.find((item) => item.extensions.includes(extOf(file.name))) ?? OTHER_GROUP;
      counts.set(group.label, (counts.get(group.label) ?? 0) + 1);
    });
    return [...counts.entries()];
  }, [files]);

  return (
    <Modal
      title="Upload onboarding pack"
      onClose={() => {
        if (!busy) onCancel();
      }}
      actions={
        <>
          <button className="btn ghost" disabled={busy} onClick={onCancel}>Cancel</button>
          <button
            className="btn solid"
            disabled={busy || !name.trim() || !files.length}
            onClick={() => onUpload(name, description, audience, files)}
          >
            {busy ? "Uploading…" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
          </button>
        </>
      }
    >
      <p className="page-sub ob-upload-help">
        Select the Word documents, PDFs, presentations, HTML files and other resources that belong in this pack.
      </p>
      <div className="field">
        <label htmlFor="upload-pack-name">Pack name</label>
        <input id="upload-pack-name" autoFocus value={name} placeholder="e.g. System Support Material" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="upload-pack-desc">Description (optional)</label>
        <input id="upload-pack-desc" value={description} placeholder="What learners will find inside" onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="upload-pack-audience">Who can access this pack?</label>
        <select id="upload-pack-audience" value={audience} onChange={(e) => setAudience(e.target.value as "learners" | "staff")}>
          <option value="learners">Students and staff</option>
          <option value="staff">Facilitators and administrators only</option>
        </select>
      </div>
      <button className="ob-file-picker" disabled={busy} onClick={() => fileRef.current?.click()}>
        <Icon name="folder" size={24} />
        <span>
          <strong>{files.length ? `${files.length} files selected` : "Choose files"}</strong>
          <small>Select multiple files from the folder in one go</small>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          setFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {!!groups.length && (
        <div className="ob-selected-groups" aria-label="Selected file types">
          {groups.map(([label, count]) => <span key={label}>{label} · {count}</span>)}
        </div>
      )}
    </Modal>
  );
}

/** Explorer view of one pack: files grouped by type. */
function PackExplorer({
  pack,
  canManage,
  profile,
  onBack,
  onUpload,
  onRemoveFile,
}: {
  pack: OnboardingPack;
  canManage: boolean;
  profile: Profile;
  onBack: () => void;
  onUpload: (files: File[]) => void;
  onRemoveFile: (file: OnboardingFile) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
  const [downloadingPack, setDownloadingPack] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? pack.files.filter((f) => f.name.toLowerCase().includes(q)) : pack.files;
  }, [pack.files, query]);

  // keep the configured group order, dropping groups with no matching files
  const grouped = useMemo(() => {
    const buckets = new Map<string, { group: FileGroup; files: OnboardingFile[] }>();
    for (const file of filtered) {
      const group = groupOf(file);
      const bucket = buckets.get(group.id) ?? { group, files: [] };
      bucket.files.push(file);
      buckets.set(group.id, bucket);
    }
    const order = [...FILE_GROUPS, OTHER_GROUP];
    return order
      .map((g) => buckets.get(g.id))
      .filter((b): b is { group: FileGroup; files: OnboardingFile[] } => !!b)
      .map((b) => ({
        ...b,
        files: [...b.files].sort((a, z) => a.name.localeCompare(z.name)),
      }));
  }, [filtered]);

  async function openFile(file: OnboardingFile) {
    setOpening(file.id);
    const url = await getFileUrl(file);
    setOpening(null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function downloadPack() {
    if (!pack.files.length || downloadingPack) return;
    setDownloadingPack(true);
    try {
      const zip = new JSZip();
      for (const file of pack.files) {
        const blob = await getFileBlob(file);
        if (blob) zip.file(file.name, blob);
      }
      const archive = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(archive);
      link.download = `${pack.name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "") || "onboarding-pack"}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      logAudit(profile, "onboarding.download", `Downloaded onboarding pack "${pack.name}"`);
    } finally {
      setDownloadingPack(false);
    }
  }

  return (
    <>
      <div className="ob-crumbs">
        <button className="ob-crumb-link" onClick={onBack}>
          <Icon name="arrowLeft" size={14} />
          All packs
        </button>
        <Icon name="chevronRight" size={14} />
        <span className="ob-crumb-current">{pack.name}</span>
      </div>

      <h1 className="page-title">{pack.name}</h1>
      <p className="page-sub">
        {pack.description ? `${pack.description} · ` : ""}
        {pack.files.length} {pack.files.length === 1 ? "file" : "files"} · added by {pack.by} on{" "}
        {fmtDate(pack.createdAt)}
      </p>

      <div className="ob-toolbar">
        <div className="ob-search">
          <Icon name="search" size={15} />
          <input
            value={query}
            placeholder="Search files in this pack…"
            aria-label="Search files in this pack"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {canManage && (
          <button className="btn solid sm" onClick={() => fileRef.current?.click()}>
            <Icon name="plus" size={14} />
            Add files
          </button>
        )}
        <button
          className="btn ghost sm"
          disabled={!pack.files.length || downloadingPack}
          onClick={() => void downloadPack()}
        >
          <Icon name="download" size={14} />
          {downloadingPack ? "Preparing ZIP…" : "Download pack"}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onUpload(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>

      {!pack.files.length ? (
        <div className="ob-empty card">
          <Icon name="folder" size={30} />
          <strong>This pack is empty</strong>
          <span>
            {canManage
              ? "Add Word documents, PDFs, presentations or web pages so learners can download them."
              : "Your facilitator has not added any files to this pack yet."}
          </span>
        </div>
      ) : !filtered.length ? (
        <div className="ob-empty card">
          <Icon name="search" size={30} />
          <strong>No files match “{query}”</strong>
          <span>Try a different search term.</span>
        </div>
      ) : (
        grouped.map(({ group, files }) => (
          <section key={group.id} className="ob-group">
            <h2 className="ob-group-title">
              <Icon name={group.icon} size={16} />
              {group.label}
              <span className="ob-group-count">{files.length}</span>
            </h2>
            <div className="ob-file-grid">
              {files.map((file) => {
                const ext = extOf(file.name);
                return (
                  <div key={file.id} className="ob-file card">
                    <span className={`ob-file-ico ob-ext-${group.id}`}>
                      <Icon name={group.icon} size={20} />
                    </span>
                    <div className="ob-file-copy">
                      <strong title={file.name}>{file.name}</strong>
                      <small>
                        {ext ? `${ext.toUpperCase()} · ` : ""}
                        {fmtSize(file.size)} · {fmtDate(file.uploadedAt)}
                      </small>
                    </div>
                    <div className="ob-file-actions">
                      {VIEWABLE.has(ext) && (
                        <button
                          className="ob-icon-btn"
                          title={`Open ${file.name}`}
                          aria-label={`Open ${file.name}`}
                          disabled={opening === file.id}
                          onClick={() => void openFile(file)}
                        >
                          <Icon name="eye" size={15} />
                        </button>
                      )}
                      <button
                        className="ob-icon-btn"
                        title={`Download ${file.name}`}
                        aria-label={`Download ${file.name}`}
                        onClick={() => {
                          void downloadDoc(file);
                          logAudit(profile, "onboarding.download", `Downloaded "${file.name}"`);
                        }}
                      >
                        <Icon name="download" size={15} />
                      </button>
                      {canManage && (
                        <button
                          className="ob-icon-btn danger"
                          title={`Remove ${file.name}`}
                          aria-label={`Remove ${file.name}`}
                          onClick={() => onRemoveFile(file)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}

/**
 * Student onboarding packs — admins and facilitators upload folders of
 * induction material; every learner can browse and download them.
 */
export function OnboardingPage({
  profile,
  route,
  navigate,
}: {
  profile: Profile;
  route: Route;
  navigate: (r: Route) => void;
}) {
  const canManage = profile.role === "Super User" || profile.role === "Facilitator";
  const { packs, createPack, renamePack, removePack, addFiles, removeFile } = useOnboardingPacks();

  const [dialog, setDialog] = useState<{ pack: OnboardingPack | null } | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [confirmPack, setConfirmPack] = useState<OnboardingPack | null>(null);
  const [confirmFile, setConfirmFile] = useState<OnboardingFile | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAccessStaffPacks = profile.role === "Super User" || profile.role === "Facilitator";
  const visiblePacks = useMemo(
    () => packs.filter((pack) => pack.audience !== "staff" || canAccessStaffPacks),
    [packs, canAccessStaffPacks]
  );
  const open = route.packId ? visiblePacks.find((p) => p.id === route.packId) ?? null : null;

  async function handleUpload(packId: string, files: File[]) {
    setError(null);
    const tooBig = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    const ok = files.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    if (tooBig.length) {
      setError(
        `${tooBig.length === 1 ? `"${tooBig[0].name}" is` : `${tooBig.length} files are`} larger than ${MAX_FILE_MB} MB and ${tooBig.length === 1 ? "was" : "were"} skipped.`
      );
    }
    if (!ok.length) return;

    const uploaded: OnboardingFile[] = [];
    for (let i = 0; i < ok.length; i++) {
      const file = ok[i];
      setBusy(`Uploading ${i + 1} of ${ok.length} — ${file.name}`);
      try {
        const doc = await uploadFile(`shared/onboarding/${packId}`, file);
        uploaded.push({
          ...doc,
          id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          by: profile.name,
          byId: profile.id,
        });
      } catch {
        // skip this file — the summary below reports the shortfall
      }
    }
    setBusy(null);

    if (uploaded.length) {
      await addFiles(packId, uploaded);
      logAudit(
        profile,
        "onboarding.upload",
        `Uploaded ${uploaded.length} file(s) to onboarding pack ${packId}`
      );
    }
    if (uploaded.length < ok.length) {
      setError(
        `${ok.length - uploaded.length} of ${ok.length} files could not be uploaded — check your connection and try again.`
      );
    }
  }

  async function handlePackUpload(
    name: string,
    description: string,
    audience: "learners" | "staff",
    files: File[]
  ) {
    if (!files.length || !name.trim()) return;
    setDialogBusy(true);
    try {
      const pack = await createPack(profile, name, description, audience);
      logAudit(profile, "onboarding.pack.create", `Created onboarding pack "${pack.name}"`);
      await handleUpload(pack.id, files);
      setUploadDialog(false);
      navigate({ page: "onboarding", packId: pack.id });
    } catch {
      setError("The pack could not be uploaded — check your connection and try again.");
    } finally {
      setDialogBusy(false);
    }
  }

  async function saveDialog(name: string, description: string, audience: "learners" | "staff") {
    setDialogBusy(true);
    try {
      if (dialog?.pack) {
        await renamePack(dialog.pack.id, name, description, audience);
      } else {
        const pack = await createPack(profile, name, description, audience);
        logAudit(profile, "onboarding.pack.create", `Created onboarding pack "${pack.name}"`);
      }
      setDialog(null);
    } catch {
      setError("The pack could not be saved — check your connection and try again.");
    }
    setDialogBusy(false);
  }

  return (
    <>
      {!open && (
        <>
          <div className="eyebrow">
            <Icon name="folder" size={15} />
            Onboarding
          </div>
          <h1 className="page-title">Student onboarding packs</h1>
          <p className="page-sub">
            {canManage
              ? "Create packs of induction material — Word documents, PDFs, presentations and web pages. Everything you add here is available to every learner."
              : "Download your induction material. Open a pack to browse its documents, PDFs, presentations and web pages."}
          </p>

          <div className="ob-toolbar">
            {canManage && (
              <>
                <button className="btn solid sm" onClick={() => setUploadDialog(true)}>
                  <Icon name="folder" size={14} />
                  Upload pack
                </button>
                <button className="btn ghost sm" onClick={() => setDialog({ pack: null })}>
                  <Icon name="plus" size={14} />
                  New empty pack
                </button>
              </>
            )}
            <span className="ob-count">
              {visiblePacks.length} {visiblePacks.length === 1 ? "pack" : "packs"} available
            </span>
          </div>

          {!visiblePacks.length ? (
            <div className="ob-empty card">
              <Icon name="folder" size={30} />
              <strong>No onboarding packs yet</strong>
              <span>
                {canManage
                  ? "Create a pack to group the induction documents your learners need."
                  : "Your facilitator has not published any onboarding packs yet."}
              </span>
            </div>
          ) : (
            <div className="ob-pack-grid">
              {visiblePacks.map((pack) => {
                const types = new Set(pack.files.map((f) => groupOf(f).label));
                return (
                  <div key={pack.id} className="ob-pack card">
                    <button
                      className="ob-pack-open"
                      onClick={() => navigate({ page: "onboarding", packId: pack.id })}
                      title={`Open ${pack.name}`}
                    >
                      <span className="ob-pack-ico">
                        <Icon name="folder" size={26} />
                      </span>
                      <span className="ob-pack-copy">
                        <strong>{pack.name}</strong>
                        {pack.audience === "staff" && <span className="ob-staff-badge">Staff only</span>}
                        {pack.description && <small>{pack.description}</small>}
                        <span className="ob-pack-meta">
                          {pack.files.length} {pack.files.length === 1 ? "file" : "files"}
                          {types.size > 0 && ` · ${[...types].join(", ")}`}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={18} />
                    </button>
                    {canManage && (
                      <div className="ob-pack-actions">
                        <button
                          className="ob-icon-btn"
                          title={`Rename ${pack.name}`}
                          aria-label={`Rename ${pack.name}`}
                          onClick={() => setDialog({ pack })}
                        >
                          <Icon name="pencil" size={15} />
                        </button>
                        <button
                          className="ob-icon-btn danger"
                          title={`Delete ${pack.name}`}
                          aria-label={`Delete ${pack.name}`}
                          onClick={() => setConfirmPack(pack)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {open && (
        <PackExplorer
          pack={open}
          canManage={canManage}
          profile={profile}
          onBack={() => navigate({ page: "onboarding" })}
          onUpload={(files) => void handleUpload(open.id, files)}
          onRemoveFile={setConfirmFile}
        />
      )}

      {route.packId && !open && (
        <div className="ob-empty card">
          <Icon name="folder" size={30} />
          <strong>That pack is no longer available</strong>
          <span>It may have been removed.</span>
          <button className="btn ghost sm" onClick={() => navigate({ page: "onboarding" })}>
            Back to all packs
          </button>
        </div>
      )}

      {(busy || error) && (
        <div className="ob-status" role="status">
          {busy && <span className="ob-busy">{busy}</span>}
          {error && <span className="ob-error">{error}</span>}
        </div>
      )}

      {dialog && (
        <PackDialog
          pack={dialog.pack}
          busy={dialogBusy}
          onSave={(name, description, audience) => void saveDialog(name, description, audience)}
          onCancel={() => setDialog(null)}
        />
      )}

      {uploadDialog && (
        <UploadPackDialog
          busy={dialogBusy}
          onUpload={(name, description, audience, files) => void handlePackUpload(name, description, audience, files)}
          onCancel={() => setUploadDialog(false)}
        />
      )}

      {confirmPack && (
        <ConfirmModal
          danger
          title="Delete this pack?"
          message={`"${confirmPack.name}" and its ${confirmPack.files.length} file(s) will be removed for every learner. This cannot be undone.`}
          confirmLabel="Delete pack"
          onCancel={() => setConfirmPack(null)}
          onConfirm={() => {
            const doomed = confirmPack;
            setConfirmPack(null);
            void (async () => {
              await removePack(doomed.id);
              logAudit(profile, "onboarding.pack.delete", `Deleted onboarding pack "${doomed.name}"`);
              if (route.packId === doomed.id) navigate({ page: "onboarding" });
            })();
          }}
        />
      )}

      {confirmFile && open && (
        <ConfirmModal
          danger
          title="Remove this file?"
          message={`"${confirmFile.name}" will no longer be available to learners.`}
          confirmLabel="Remove file"
          onCancel={() => setConfirmFile(null)}
          onConfirm={() => {
            const doomed = confirmFile;
            setConfirmFile(null);
            void (async () => {
              await removeFile(open.id, doomed.id);
              logAudit(profile, "onboarding.file.delete", `Removed "${doomed.name}" from an onboarding pack`);
            })();
          }}
        />
      )}
    </>
  );
}
