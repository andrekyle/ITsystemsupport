import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import {
  useOnboardingPacks,
  type OnboardingFile,
  type OnboardingPack,
} from "../store";
import { deleteFile, downloadDoc, getFileBlob, getFileUrl, uploadFile } from "../lib/files";
import { ConfirmModal, Modal } from "../components/Modal";
import { Select } from "../components/Select";
import { logAudit } from "../lib/audit";

/** Largest onboarding folder/batch accepted, in megabytes. */
const MAX_PACK_MB = 500;

interface DroppedEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (file: File) => void, failure?: () => void) => void;
  createReader?: () => { readEntries: (success: (entries: DroppedEntry[]) => void, failure?: () => void) => void };
}

interface DirectoryHandleLike {
  kind: "directory";
  name: string;
  values: () => AsyncIterableIterator<DirectoryHandleLike | { kind: "file"; name: string; getFile: () => Promise<File> }>;
}

async function filesFromDroppedEntry(entry: DroppedEntry): Promise<File[]> {
  if (entry.isFile && entry.file) {
    return new Promise((resolve) => entry.file?.((file) => resolve([file]), () => resolve([])));
  }
  if (!entry.isDirectory || !entry.createReader) return [];
  const reader = entry.createReader();
  const children: DroppedEntry[] = [];
  while (true) {
    const batch = await new Promise<DroppedEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
    if (!batch.length) break;
    children.push(...batch);
  }
  return (await Promise.all(children.map(filesFromDroppedEntry))).flat();
}

async function filesFromDirectoryHandle(directory: DirectoryHandleLike): Promise<File[]> {
  const files: File[] = [];
  for await (const entry of directory.values()) {
    if (entry.kind === "file") files.push(await entry.getFile());
    else files.push(...await filesFromDirectoryHandle(entry));
  }
  return files;
}

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
      className="ob-pack-modal"
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
        <label>Who can access this pack?</label>
        <Select
          value={audience}
          ariaLabel="Who can access this pack?"
          options={[
            { value: "learners", label: "Students and staff" },
            { value: "staff", label: "Facilitators and administrators only" },
          ]}
          onChange={(value) => setAudience(value as "learners" | "staff")}
        />
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
  const folderRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<"learners" | "staff">("learners");
  const [folderMode, setFolderMode] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const isOverLimit = totalBytes > MAX_PACK_MB * 1024 * 1024;

  function acceptFiles(next: File[], suggestedName?: string) {
    setFiles(next);
    setSelectionError(
      next.reduce((sum, file) => sum + file.size, 0) > MAX_PACK_MB * 1024 * 1024
        ? `This folder is larger than ${MAX_PACK_MB} MB. Remove files or choose a smaller folder.`
        : null
    );
    if (!name.trim() && suggestedName) setName(suggestedName);
  }

  async function chooseFolder() {
    const picker = (window as unknown as {
      showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
    }).showDirectoryPicker;
    if (!picker) {
      folderRef.current?.click();
      return;
    }
    try {
      const directory = await picker.call(window);
      acceptFiles(await filesFromDirectoryHandle(directory), directory.name);
    } catch {
      // Closing the operating-system picker is not an upload error.
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (busy) return;
    const entries: DroppedEntry[] = Array.from(event.dataTransfer.items)
      .map((item): DroppedEntry | null => {
        const getter = (item as unknown as { webkitGetAsEntry?: () => DroppedEntry | null }).webkitGetAsEntry;
        return getter?.call(item) ?? null;
      })
      .filter((entry): entry is DroppedEntry => entry !== null);
    const dropped = entries.length
      ? (await Promise.all(entries.map(filesFromDroppedEntry))).flat()
      : Array.from(event.dataTransfer.files);
    const folderName = entries.length === 1 && entries[0].isDirectory ? entries[0].name : undefined;
    acceptFiles(dropped, folderName);
  }

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
      className="ob-upload-modal"
      onClose={() => {
        if (!busy) onCancel();
      }}
      actions={
        <>
          <button className="btn ghost" disabled={busy} onClick={onCancel}>Cancel</button>
          <button
            className="btn solid"
            disabled={busy || !name.trim() || !files.length || isOverLimit}
            onClick={() => onUpload(name, description, audience, files)}
          >
            {busy ? "Uploading…" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
          </button>
        </>
      }
    >
      <p className="page-sub ob-upload-help">
        Select Word documents, PDFs, presentations, spreadsheets, images, HTML files and other resources for this pack.
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
        <label>Who can access this pack?</label>
        <Select
          value={audience}
          ariaLabel="Who can access this pack?"
          options={[
            { value: "learners", label: "Students and staff" },
            { value: "staff", label: "Facilitators and administrators only" },
          ]}
          onChange={(value) => setAudience(value as "learners" | "staff")}
        />
      </div>
      <div
        className={`ob-file-picker${isOverLimit ? " invalid" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => void handleDrop(e)}
        onClick={() => {
          if (!busy) folderMode ? void chooseFolder() : fileRef.current?.click();
        }}
      >
        <Icon name={folderMode ? "folder" : "document"} size={24} />
        <span>
          <strong>{files.length ? `${files.length} files · ${fmtSize(totalBytes)}` : `Drop or choose ${folderMode ? "a folder" : "files"}`}</strong>
          <small>Uploads may contain up to {MAX_PACK_MB} MB</small>
        </span>
        <span className="ob-upload-mode" onClick={(e) => e.stopPropagation()}>
          <span className={!folderMode ? "active" : ""}>Files</span>
          <button
            type="button"
            className="ob-mode-toggle"
            role="switch"
            aria-checked={folderMode}
            aria-label="Upload a folder instead of individual files"
            disabled={busy}
            onClick={() => setFolderMode((current) => !current)}
          >
            <span className="ob-mode-knob" />
          </button>
          <span className={folderMode ? "active" : ""}>Folder</span>
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          acceptFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        hidden
        {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          const folderName = selected[0]?.webkitRelativePath.split("/")[0];
          acceptFiles(selected, folderName);
          e.target.value = "";
        }}
      />
      {selectionError && <div className="ob-selection-error" role="alert">{selectionError}</div>}
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

  async function uploadDocuments(packId: string, files: File[]): Promise<OnboardingFile[]> {
    setError(null);
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_PACK_MB * 1024 * 1024) {
      throw new Error(`This upload is ${fmtSize(totalBytes)}. Onboarding folders may be up to ${MAX_PACK_MB} MB.`);
    }
    if (!files.length) return [];

    const uploaded: OnboardingFile[] = [];
    const failures: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBusy(`Uploading ${i + 1} of ${files.length} — ${file.name}`);
      try {
        const doc = await uploadFile(`shared/onboarding/${packId}`, file);
        uploaded.push({
          ...doc,
          id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          by: profile.name,
          byId: profile.id,
        });
      } catch (uploadError) {
        failures.push(uploadError instanceof Error ? uploadError.message : `Could not upload ${file.name}`);
      }
    }
    setBusy(null);

    if (!uploaded.length) {
      throw new Error(failures[0] || "None of the selected files could be uploaded.");
    }
    if (failures.length) {
      setError(`${failures.length} of ${files.length} files could not be uploaded. ${failures[0]}`);
    }
    return uploaded;
  }

  async function handleUpload(packId: string, files: File[]) {
    try {
      const uploaded = await uploadDocuments(packId, files);
      if (!uploaded.length) return;
      await addFiles(packId, uploaded);
      logAudit(profile, "onboarding.upload", `Uploaded ${uploaded.length} file(s) to onboarding pack ${packId}`);
    } catch (uploadError) {
      setBusy(null);
      setError(uploadError instanceof Error ? uploadError.message : "The files could not be uploaded.");
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
    const uploadId = `pack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    let uploaded: OnboardingFile[] = [];
    try {
      uploaded = await uploadDocuments(uploadId, files);
      const pack = await createPack(profile, name, description, audience, uploaded);
      logAudit(profile, "onboarding.pack.create", `Created onboarding pack "${pack.name}"`);
      logAudit(profile, "onboarding.upload", `Uploaded ${uploaded.length} file(s) to onboarding pack ${pack.id}`);
      setUploadDialog(false);
      navigate({ page: "onboarding", packId: pack.id });
    } catch (uploadError) {
      await Promise.all(uploaded.map((file) => deleteFile(file.path)));
      setBusy(null);
      setError(uploadError instanceof Error ? uploadError.message : "The pack could not be uploaded.");
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
              ? "Create packs of induction material — documents, PDFs, presentations, spreadsheets, images and web pages."
              : "Download your induction material. Open a pack to browse documents, PDFs, presentations, spreadsheets and images."}
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
