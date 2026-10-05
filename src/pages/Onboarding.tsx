import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Icon } from "../icons";
import type { Profile, Route } from "../types";
import {
  useOnboardingPacks,
  type OnboardingFile,
  type OnboardingPack,
} from "../store";
import { getFileBlob, getFileUrl, uploadFile } from "../lib/files";
import { ConfirmModal, Modal } from "../components/Modal";
import { Select } from "../components/Select";
import { Button } from "@fluentui/react-components";
import { logAudit } from "../lib/audit";
import {
  archiveFilePaths, fileTypeLabel, filesFromDirectoryHandle, filesFromDroppedEntry,
  onboardingFilePath, onboardingFolders, parentFolder, selectedFiles, withoutUploadRoot,
  type DirectoryHandleLike, type DroppedEntry, type UploadSelection,
} from "../lib/onboardingFiles";

/** Largest onboarding folder/batch accepted, in megabytes. */
const MAX_PACK_MB = 500;


interface FileGroup {
  id: string;
  label: string;
  icon: string;
  extensions: string[];
}

/** File-type summaries for pack cards and upload selections. */
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

function FileTypeIcon({ name }: { name: string }) {
  const ext = extOf(name);
  let kind = "file";
  let label = ext.slice(0, 3).toUpperCase() || "FILE";
  if (["doc", "docx", "rtf", "odt"].includes(ext)) { kind = "word"; label = "W"; }
  else if (ext === "pdf") { kind = "pdf"; label = "PDF"; }
  else if (["xls", "xlsx", "csv", "ods"].includes(ext)) { kind = "excel"; label = "X"; }
  else if (["ppt", "pptx", "odp"].includes(ext)) { kind = "powerpoint"; label = "P"; }
  else if (["html", "htm"].includes(ext)) { kind = "html"; label = "</>"; }
  else if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) { kind = "image"; label = "IMG"; }
  else if (["zip", "rar", "7z"].includes(ext)) { kind = "archive"; label = "ZIP"; }
  else if (ext === "txt") { kind = "text"; label = "TXT"; }

  return (
    <span className={`ob-type-icon ob-type-${kind}`} aria-hidden="true">
      <svg viewBox="0 0 38 44">
        <path className="ob-type-sheet" d="M7 1.5h16l8 8V42H7z" />
        <path className="ob-type-fold" d="M23 1.5v8h8" />
        {kind === "image" && <><circle cx="18" cy="19" r="2.2" /><path d="m11 31 7-7 4 4 3-3 5 5" /></>}
        {kind === "archive" && <path d="M20 8v4h-3v4h3v4h-3v4h3v4h-3v5h4" />}
      </svg>
      {kind !== "image" && kind !== "archive" && <span>{label}</span>}
    </span>
  );
}

/** In-app replacement for the browser's unstyleable folder-upload prompt. */
function UploadPackDialog({
  busy,
  onUpload,
  onCancel,
}: {
  busy: boolean;
  onUpload: (name: string, description: string, audience: "learners" | "staff", files: UploadSelection[]) => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<"learners" | "staff">("learners");
  const [folderMode, setFolderMode] = useState(true);
  const [files, setFiles] = useState<UploadSelection[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const totalBytes = useMemo(() => files.reduce((sum, item) => sum + item.file.size, 0), [files]);
  const isOverLimit = totalBytes > MAX_PACK_MB * 1024 * 1024;

  function acceptFiles(next: UploadSelection[], suggestedName?: string) {
    setFiles(next);
    setSelectionError(
      next.reduce((sum, item) => sum + item.file.size, 0) > MAX_PACK_MB * 1024 * 1024
        ? `This folder is larger than ${MAX_PACK_MB} MB. Remove files or choose a smaller folder.`
        : null
    );
    if (!name.trim() && suggestedName) setName(suggestedName);
  }

  async function chooseFolder() {
    const picker = (window as Window & {
      showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
    }).showDirectoryPicker;
    if (!picker) {
      folderRef.current?.click();
      return;
    }
    try {
      const directory = await picker.call(window);
      acceptFiles(withoutUploadRoot(await filesFromDirectoryHandle(directory)), directory.name);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSelectionError(error instanceof Error ? error.message : "The folder could not be read.");
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
    try {
      const dropped = entries.length
        ? (await Promise.all(entries.map(entry => filesFromDroppedEntry(entry)))).flat()
        : selectedFiles(Array.from(event.dataTransfer.files));
      const folderName = entries.length === 1 && entries[0].isDirectory ? entries[0].name : undefined;
      acceptFiles(folderName ? withoutUploadRoot(dropped) : dropped, folderName);
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : "The dropped folder could not be read.");
    }
  }

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    files.forEach(({ file }) => {
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
        Select documents and other resources for this pack. Folder uploads keep their subfolders and original file locations.
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
          acceptFiles(selectedFiles(Array.from(e.target.files ?? [])));
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
          acceptFiles(selectedFiles(selected, true), folderName);
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

/** Details view with pack-relative folders, never extension-based regrouping. */
export function PackExplorer({
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
  onUpload: (files: UploadSelection[]) => void;
  onRemoveFile: (file: OnboardingFile) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set());
  const [sort, setSort] = useState<{ column: "name" | "modified" | "type" | "size"; descending: boolean }>({
    column: "name", descending: false,
  });
  const [opening, setOpening] = useState<string | null>(null);
  const [downloadingPack, setDownloadingPack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const folders = useMemo(() => onboardingFolders(pack.files), [pack.files]);
  const currentFolder = folders.includes(folder) ? folder : "";
  const search = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const matches = pack.files.filter(file => {
      const path = onboardingFilePath(file);
      return search
        ? (!currentFolder || path.startsWith(`${currentFolder}/`)) && path.toLowerCase().includes(search)
        : parentFolder(path) === currentFolder;
    });
    return matches.sort((a, b) => {
      let result = 0;
      if (sort.column === "size") result = a.size - b.size;
      else if (sort.column === "modified") {
        result = new Date(a.modifiedAt ?? a.uploadedAt).getTime() - new Date(b.modifiedAt ?? b.uploadedAt).getTime();
      } else {
        const aValue = sort.column === "type" ? fileTypeLabel(a.name) : a.name;
        const bValue = sort.column === "type" ? fileTypeLabel(b.name) : b.name;
        result = aValue.localeCompare(bValue, undefined, { numeric: true });
      }
      return (sort.descending ? -result : result) || onboardingFilePath(a).localeCompare(onboardingFilePath(b));
    });
  }, [pack.files, currentFolder, search, sort]);
  const childFolders = folders.filter(path => parentFolder(path) === currentFolder &&
    (!search || path.toLowerCase().includes(search) ||
      filtered.some(file => onboardingFilePath(file).startsWith(`${path}/`))))
    .sort((a, b) => (sort.column === "name" && sort.descending ? -1 : 1) * a.localeCompare(b, undefined, { numeric: true }));

  function navigateFolder(path: string) {
    setFolder(path);
    setQuery("");
    setError(null);
  }

  function selectFolder(path: string, hasChildren: boolean) {
    navigateFolder(path);
    if (!hasChildren) return;
    setExpandedFolders(current => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function addSelection(files: File[], isFolder = false) {
    try {
      const selections = selectedFiles(files).map(item => ({
        ...item,
        relativePath: currentFolder ? `${currentFolder}/${item.relativePath}` : item.relativePath,
      }));
      if (selections.length) onUpload(selections);
    } catch (error) {
      setError(error instanceof Error ? error.message : `The selected ${isFolder ? "folder" : "files"} could not be read.`);
    }
  }

  async function downloadFile(file: OnboardingFile) {
    setError(null);
    try {
      const blob = await getFileBlob(file);
      if (!blob) throw new Error(`"${file.name}" could not be downloaded. Check your connection and try again.`);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      logAudit(profile, "onboarding.download", `Downloaded "${onboardingFilePath(file)}"`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "The file could not be downloaded.");
    }
  }

  async function openFile(file: OnboardingFile) {
    setError(null);
    if (!VIEWABLE.has(extOf(file.name))) {
      await downloadFile(file);
      return;
    }
    setOpening(file.id);
    try {
      const url = await getFileUrl(file);
      if (!url) throw new Error(`"${file.name}" could not be opened. Check your connection and try again.`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The file could not be opened.");
    } finally { setOpening(null); }
  }

  async function downloadPack() {
    if (!pack.files.length || downloadingPack) return;
    setDownloadingPack(true);
    setError(null);
    try {
      const zip = new JSZip();
      const paths = archiveFilePaths(pack.files);
      for (const [index, file] of pack.files.entries()) {
        const blob = await getFileBlob(file);
        if (!blob) throw new Error(`"${file.name}" could not be downloaded. No ZIP was created; check your connection and try again.`);
        zip.file(paths[index], blob, { date: new Date(file.modifiedAt ?? file.uploadedAt) });
      }
      const archive = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(archive);
      link.download = `${pack.name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "") || "onboarding-pack"}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      logAudit(profile, "onboarding.download", `Downloaded onboarding pack "${pack.name}"`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "The pack could not be downloaded.");
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
        <button className="ob-crumb-link" onClick={() => navigateFolder("")}>{pack.name}</button>
        {currentFolder.split("/").filter(Boolean).map((part, index, parts) => (
          <span className="ob-crumb-part" key={parts.slice(0, index + 1).join("/")}>
            <Icon name="chevronRight" size={14} />
            <button className="ob-crumb-link" onClick={() => navigateFolder(parts.slice(0, index + 1).join("/"))}>{part}</button>
          </span>
        ))}
      </div>

      <h1 className="page-title">{pack.name}</h1>
      <p className="page-sub">
        {pack.description ? `${pack.description} · ` : ""}
        {pack.files.length} {pack.files.length === 1 ? "file" : "files"} · added by {pack.by} on{" "}
        {fmtDate(pack.createdAt)}
      </p>

      <div className="ob-toolbar">
        <button className="btn ghost sm" disabled={!currentFolder} onClick={() => navigateFolder(parentFolder(currentFolder))}>
          <Icon name="arrowLeft" size={14} /> Up
        </button>
        <div className="ob-search">
          <Icon name="search" size={15} />
          <input
            value={query}
            placeholder="Search this folder…"
            aria-label="Search this folder"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {canManage && (
          <>
            <button className="btn solid sm" onClick={() => fileRef.current?.click()}>
              <Icon name="plus" size={14} /> Add files
            </button>
            <button className="btn ghost sm" onClick={() => folderRef.current?.click()}>
              <Icon name="folder" size={14} /> Add folder
            </button>
          </>
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
            if (e.target.files?.length) addSelection(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
        <input ref={folderRef} type="file" multiple hidden aria-label="Add folder"
          {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={e => {
            addSelection(Array.from(e.target.files ?? []), true);
            e.target.value = "";
          }} />
      </div>

      {error && <div className="ob-error" role="alert">{error}</div>}
      <div className="ob-explorer">
        <nav className="ob-folder-nav" aria-label="Pack folders">
          <Button appearance="subtle" className={!currentFolder ? "active" : ""} aria-current={!currentFolder ? "location" : undefined}
            aria-expanded={folders.length ? expandedFolders.has("") : undefined}
            onClick={() => selectFolder("", folders.length > 0)}>
            {folders.length > 0 && <Icon name="chevronRight" size={13} className={`ob-folder-disclosure${expandedFolders.has("") ? " open" : ""}`} />}
            <Icon name="folder" size={16} className="ob-folder-icon" /><span className="ob-folder-label">{pack.name}</span>
          </Button>
          {folders.filter(path => {
            if (!expandedFolders.has("")) return false;
            const parts = path.split("/");
            return parts.slice(0, -1).every((_, index) => expandedFolders.has(parts.slice(0, index + 1).join("/")));
          }).map(path => {
            const hasChildren = folders.some(candidate => parentFolder(candidate) === path);
            const isExpanded = expandedFolders.has(path);
            return <Button appearance="subtle" key={path} title={path} aria-label={`Go to folder ${path}`}
              className={currentFolder === path ? "active" : ""}
              aria-current={currentFolder === path ? "location" : undefined}
              aria-expanded={hasChildren ? isExpanded : undefined}
              style={{ paddingLeft: 12 + path.split("/").length * 14 }}
              onClick={() => selectFolder(path, hasChildren)}>
              {hasChildren
                ? <Icon name="chevronRight" size={13} className={`ob-folder-disclosure${isExpanded ? " open" : ""}`} />
                : <span className="ob-folder-disclosure-placeholder" />}
              <Icon name="folder" size={16} className="ob-folder-icon" /><span className="ob-folder-label">{path.split("/").pop()}</span>
            </Button>;
          })}
        </nav>
        <div className="ob-details-scroll">
          <table className="ob-details" aria-label={`Files in ${currentFolder || pack.name}`}>
            <thead><tr>
              {(["name", "modified", "type", "size"] as const).map(column => (
                <th key={column} scope="col" aria-sort={sort.column === column ? (sort.descending ? "descending" : "ascending") : "none"}>
                  <button onClick={() => setSort({ column, descending: sort.column === column && !sort.descending })}>
                    {{ name: "Name", modified: "Date modified", type: "Type", size: "Size" }[column]}
                    {sort.column === column && <span aria-hidden="true">{sort.descending ? " ↓" : " ↑"}</span>}
                  </button>
                </th>
              ))}
              <th scope="col"><span className="ob-actions-label">Actions</span></th>
            </tr></thead>
            <tbody>
              {childFolders.map(path => (
                <tr key={path} className="ob-folder-row">
                  <td><button className="ob-entry-name" onClick={() => navigateFolder(path)} title={path}>
                    <Icon name="folder" size={20} /><span>{path.split("/").pop()}</span>
                  </button></td>
                  <td />
                  <td>File folder</td>
                  <td />
                  <td />
                </tr>
              ))}
              {filtered.map((file) => {
                const ext = extOf(file.name);
                return (
                  <tr key={file.id} data-file-id={file.id}>
                    <td><button className="ob-entry-name" title={onboardingFilePath(file)}
                      disabled={opening === file.id} onClick={() => void openFile(file)}>
                      <FileTypeIcon name={file.name} /><span>{file.name}</span>
                    </button>
                      {search && parentFolder(onboardingFilePath(file)) !== currentFolder &&
                        <button className="ob-search-location" onClick={() => navigateFolder(parentFolder(onboardingFilePath(file)))}>
                          {parentFolder(onboardingFilePath(file)) || pack.name}
                        </button>}
                    </td>
                    <td title={file.modifiedAt ?? file.uploadedAt}>
                      {new Date(file.modifiedAt ?? file.uploadedAt).toLocaleString(undefined, {
                        year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </td>
                    <td title={fileTypeLabel(file.name)}>{fileTypeLabel(file.name)}</td>
                    <td className="ob-details-size">{fmtSize(file.size)}</td>
                    <td><div className="ob-file-actions">
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
                        onClick={() => void downloadFile(file)}
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
                    </div></td>
                  </tr>
                );
              })}
              {!filtered.length && !childFolders.length && <tr><td colSpan={5} className="ob-details-empty">
                {search ? `No files match “${query}” in this folder.` : "This folder is empty."}
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="ob-count ob-explorer-count">{childFolders.length} folders · {filtered.length} files{search ? " found" : ""}</p>
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

  async function uploadDocuments(packId: string, files: UploadSelection[]): Promise<OnboardingFile[]> {
    setError(null);
    const totalBytes = files.reduce((sum, item) => sum + item.file.size, 0);
    if (totalBytes > MAX_PACK_MB * 1024 * 1024) {
      throw new Error(`This upload is ${fmtSize(totalBytes)}. Onboarding folders may be up to ${MAX_PACK_MB} MB.`);
    }
    if (!files.length) return [];

    const uploaded: OnboardingFile[] = [];
    const failures: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const { file, relativePath } = files[i];
      setBusy(`Uploading ${i + 1} of ${files.length} — ${file.name}`);
      try {
        const doc = await uploadFile(`shared/onboarding/${packId}/${crypto.randomUUID()}`, file);
        uploaded.push({
          ...doc,
          relativePath,
          modifiedAt: new Date(file.lastModified).toISOString(),
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

  async function handleUpload(packId: string, files: UploadSelection[]) {
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
    files: UploadSelection[]
  ) {
    if (!files.length || !name.trim()) return;
    setDialogBusy(true);
    const uploadId = `pack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const uploaded = await uploadDocuments(uploadId, files);
      const pack = await createPack(profile, name, description, audience, uploaded);
      logAudit(profile, "onboarding.pack.create", `Created onboarding pack "${pack.name}"`);
      logAudit(profile, "onboarding.upload", `Uploaded ${uploaded.length} file(s) to onboarding pack ${pack.id}`);
      setUploadDialog(false);
      navigate({ page: "onboarding", packId: pack.id });
    } catch (uploadError) {
      // A failed cloud save can still have a durable pending pack referencing
      // these objects. Keep them available for the next sync retry.
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
                      {!canManage && <Icon name="chevronRight" size={18} />}
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
          key={open.id}
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
