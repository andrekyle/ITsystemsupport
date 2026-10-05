import assert from "node:assert/strict";
import { test } from "node:test";
import {
  archiveFilePaths, filesFromDirectoryHandle, filesFromDroppedEntry,
  normalizeFilePath, onboardingFilePath, onboardingFolders, parentFolder,
  selectedFiles, withoutUploadRoot,
  type DirectoryHandleLike, type DroppedEntry,
} from "../src/lib/onboardingFiles";
import type { OnboardingFile } from "../src/store";

const document = (relativePath?: string, id = relativePath ?? "legacy"): OnboardingFile => ({
  id, name: "Guide.docx", relativePath, type: "", size: 10,
  uploadedAt: "2026-10-01T12:00:00Z", by: "Staff", byId: "staff",
});

function file(name: string, path?: string) {
  const result = new File(["contents"], name, { lastModified: 1000 });
  if (path) Object.defineProperty(result, "webkitRelativePath", { value: path });
  return result;
}

test("directory input retains nested paths and uses the selected root as the pack", () => {
  const files = selectedFiles([
    file("Guide.docx", "Material/Guides/Guide.docx"),
    file("Guide.docx", "Material/Answers/Guide.docx"),
    file("Notes.txt", "Material/Notes.txt"),
  ], true);
  assert.deepEqual(files.map(item => item.relativePath), ["Guides/Guide.docx", "Answers/Guide.docx", "Notes.txt"]);
  assert.equal(files[0].file.lastModified, 1000);
  assert.equal(selectedFiles([file("Loose.txt")])[0].relativePath, "Loose.txt");
  assert.equal(selectedFiles([file("Guide.docx", "Material/Guides/Guide.docx")])[0].relativePath,
    "Material/Guides/Guide.docx", "Add folder preserves its root inside the current folder");
});

test("native directory handles retain every ancestor folder", async () => {
  type Entry = DirectoryHandleLike | { kind: "file"; name: string; getFile: () => Promise<File> };
  const directory = (name: string, entries: Entry[]): DirectoryHandleLike => ({
    kind: "directory", name,
    async *values() {
      for (const entry of entries) yield entry;
    },
  });
  const handle = directory("Material", [
    directory("Guides", [{ kind: "file", name: "Guide.docx", getFile: async () => file("Guide.docx") }]),
    directory("Answers", [{ kind: "file", name: "Guide.docx", getFile: async () => file("Guide.docx") }]),
  ]);
  assert.deepEqual(withoutUploadRoot(await filesFromDirectoryHandle(handle)).map(item => item.relativePath),
    ["Guides/Guide.docx", "Answers/Guide.docx"]);
});

test("dropped directories drain all reader batches and retain nested paths", async () => {
  const droppedFile = (name: string): DroppedEntry => ({
    name, isFile: true, isDirectory: false, file: success => success(file(name)),
  });
  const directory = (name: string, batches: DroppedEntry[][]): DroppedEntry => ({
    name, isFile: false, isDirectory: true,
    createReader: () => {
      let index = 0;
      return { readEntries: success => success(batches[index++] ?? []) };
    },
  });
  const selected = await filesFromDroppedEntry(directory("Material", [
    [directory("Guides", [[droppedFile("Guide.docx")]])],
    [directory("Answers", [[droppedFile("Guide.docx")]])],
    [droppedFile("Notes.txt")],
  ]));
  assert.deepEqual(selected.map(item => item.relativePath), [
    "Material/Guides/Guide.docx", "Material/Answers/Guide.docx", "Material/Notes.txt",
  ]);
  assert.deepEqual(withoutUploadRoot(selected).map(item => item.relativePath), [
    "Guides/Guide.docx", "Answers/Guide.docx", "Notes.txt",
  ]);
});

test("directory read failures are reported instead of silently omitting files", async () => {
  const error = new DOMException("Permission denied", "NotAllowedError");
  await assert.rejects(filesFromDroppedEntry({
    name: "Secret", isFile: false, isDirectory: true,
    createReader: () => ({ readEntries: (_success, failure) => failure(error) }),
  }), /Permission denied/);
  await assert.rejects(filesFromDroppedEntry({
    name: "Secret.txt", isFile: true, isDirectory: false,
    file: (_success, failure) => failure(error),
  }), /Permission denied/);
});

test("folder hierarchy and legacy root files survive metadata serialization", () => {
  const files = JSON.parse(JSON.stringify([
    document("Guides/Week 1/Guide.docx"), document("Answers/Guide.docx"), document(),
  ])) as OnboardingFile[];
  assert.deepEqual(onboardingFolders(files), ["Answers", "Guides", "Guides/Week 1"]);
  assert.equal(onboardingFilePath(files[2]), "Guide.docx");
  assert.equal(parentFolder(onboardingFilePath(files[2])), "");
  assert.equal(normalizeFilePath("Guides\\Week 1\\Guide.docx"), "Guides/Week 1/Guide.docx");
  assert.throws(() => normalizeFilePath("../Guide.docx"), /invalid folder path/);
});

test("ZIP paths preserve same-named files across folders and do not overwrite duplicates", () => {
  const paths = archiveFilePaths([
    document("Guides/Guide.docx"), document("Answers/Guide.docx"),
    document("Guides/Guide.docx", "duplicate"), document("Guides/Guide (2).docx"),
    { ...document("Guides/.notes"), name: ".notes" }, { ...document("Guides/.notes", "notes-duplicate"), name: ".notes" },
    document(),
  ]);
  assert.deepEqual(paths, [
    "Guides/Guide.docx", "Answers/Guide.docx", "Guides/Guide (2).docx", "Guides/Guide (2) (2).docx",
    "Guides/.notes", "Guides/.notes (2)", "Guide.docx",
  ]);
  assert.equal(new Set(paths).size, paths.length);
});
