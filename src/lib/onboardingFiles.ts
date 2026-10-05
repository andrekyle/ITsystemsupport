import type { OnboardingFile } from "../store";

export interface UploadSelection {
  file: File;
  relativePath: string;
}

export interface DroppedEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (file: File) => void, failure: (error: DOMException) => void) => void;
  createReader?: () => {
    readEntries: (success: (entries: DroppedEntry[]) => void, failure: (error: DOMException) => void) => void;
  };
}

export interface DirectoryHandleLike {
  kind: "directory";
  name: string;
  values: () => AsyncIterableIterator<DirectoryHandleLike | {
    kind: "file";
    name: string;
    getFile: () => Promise<File>;
  }>;
}

export function normalizeFilePath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  if (!parts.length || parts.some(part => part === "." || part === "..")) {
    throw new Error("A file has an invalid folder path. Choose the folder again.");
  }
  return parts.join("/");
}

/** Browser paths, not cloud object paths, define the explorer hierarchy. */
export function onboardingFilePath(file: OnboardingFile): string {
  return normalizeFilePath(file.relativePath || file.name);
}

export function parentFolder(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

export function selectedFiles(files: File[], stripRoot = false): UploadSelection[] {
  const selections = files.map(file => ({
    file,
    relativePath: normalizeFilePath(file.webkitRelativePath || file.name),
  }));
  return stripRoot ? withoutUploadRoot(selections) : selections;
}

/** A single uploaded folder becomes the pack itself, not a duplicate child. */
export function withoutUploadRoot(files: UploadSelection[]): UploadSelection[] {
  const root = files[0]?.relativePath.split("/")[0];
  if (!root || !files.every(item => item.relativePath.startsWith(`${root}/`))) return files;
  return files.map(item => ({ ...item, relativePath: item.relativePath.slice(root.length + 1) }));
}

export async function filesFromDroppedEntry(entry: DroppedEntry, parent = ""): Promise<UploadSelection[]> {
  const relativePath = normalizeFilePath(parent ? `${parent}/${entry.name}` : entry.name);
  if (entry.isFile && entry.file) {
    const file = entry.file;
    return new Promise((resolve, reject) => {
      file.call(entry, result => resolve([{ file: result, relativePath }]), reject);
    });
  }
  if (!entry.isDirectory || !entry.createReader) {
    throw new Error(`Could not read "${entry.name}". Try selecting the folder instead.`);
  }
  const reader = entry.createReader();
  const children: DroppedEntry[] = [];
  while (true) {
    const batch = await new Promise<DroppedEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    children.push(...batch);
  }
  return (await Promise.all(children.map(child => filesFromDroppedEntry(child, relativePath)))).flat();
}

export async function filesFromDirectoryHandle(
  directory: DirectoryHandleLike,
  parent = ""
): Promise<UploadSelection[]> {
  const relativePath = normalizeFilePath(parent ? `${parent}/${directory.name}` : directory.name);
  const files: UploadSelection[] = [];
  for await (const entry of directory.values()) {
    if (entry.kind === "file") {
      files.push({ file: await entry.getFile(), relativePath: normalizeFilePath(`${relativePath}/${entry.name}`) });
    } else {
      files.push(...await filesFromDirectoryHandle(entry, relativePath));
    }
  }
  return files;
}

export function onboardingFolders(files: OnboardingFile[]): string[] {
  const folders = new Set<string>();
  for (const file of files) {
    const parts = onboardingFilePath(file).split("/");
    for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join("/"));
  }
  return [...folders].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function fileTypeLabel(name: string): string {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const labels: Record<string, string> = {
    doc: "Microsoft Word Document", docx: "Microsoft Word Document",
    xls: "Microsoft Excel Worksheet", xlsx: "Microsoft Excel Worksheet",
    ppt: "Microsoft PowerPoint Presentation", pptx: "Microsoft PowerPoint Presentation",
    pdf: "PDF Document", txt: "Text Document", csv: "CSV File",
    html: "HTML Document", htm: "HTML Document", zip: "ZIP Archive",
  };
  return labels[ext] ?? (ext ? `${ext.toUpperCase()} File` : "File");
}

/** Keep same-named files in different folders; suffix actual duplicate paths. */
export function archiveFilePaths(files: OnboardingFile[]): string[] {
  const used = new Set<string>();
  return files.map(file => {
    const original = onboardingFilePath(file);
    let path = original;
    let suffix = 2;
    const dot = original.lastIndexOf(".");
    const extension = dot > original.lastIndexOf("/") + 1 ? dot : original.length;
    while (used.has(path)) {
      path = `${original.slice(0, extension)} (${suffix++})${original.slice(extension)}`;
    }
    used.add(path);
    return path;
  });
}
