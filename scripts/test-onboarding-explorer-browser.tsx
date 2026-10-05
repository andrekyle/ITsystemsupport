import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import { OnboardingPage, PackExplorer } from "../src/pages/Onboarding";
import { loadOnboardingPacks, persistOnboardingPacks } from "../src/lib/onboardingStorage";
import { archiveFilePaths } from "../src/lib/onboardingFiles";
import type { UploadSelection } from "../src/lib/onboardingFiles";
import type { OnboardingFile, OnboardingPack } from "../src/store";
import type { Profile } from "../src/types";
import "../src/styles.css";

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const profile: Profile = { id: "staff", name: "Staff", role: "Facilitator", createdAt: "2026-10-01T10:00:00Z" };
const file = (id: string, name: string, relativePath?: string, size = 100): OnboardingFile => ({
  id, name, relativePath, size, type: "text/plain", data: "data:text/plain;base64,SGVsbG8=",
  uploadedAt: "2026-10-01T10:00:00Z", modifiedAt: "2026-09-20T09:00:00Z", by: "Staff", byId: "staff",
});
const pack: OnboardingPack = {
  id: "test-pack", name: "System Support Material", audience: "staff",
  createdAt: "2026-10-01T10:00:00Z", by: "Staff", byId: "staff",
  files: [
    file("legacy", "Loose.txt", undefined, 200),
    file("guide", "Guide.docx", "Guides/Guide.docx", 300),
    file("answer", "Guide.docx", "Answers/Guide.docx", 400),
    file("week", "Week.txt", "Guides/Week 1/Week.txt"),
    file("extra", "Extra.pdf", "Guides/Extra.pdf", 500),
  ],
};
let root = createRoot(document.getElementById("fixture")!);
let uploaded: UploadSelection[] = [];
let removed: OnboardingFile | undefined;
async function render(current: OnboardingPack, canManage = true) {
  root.render(<PackExplorer pack={current} profile={profile} canManage={canManage}
    onBack={() => {}} onUpload={files => { uploaded = files; }} onRemoveFile={file => { removed = file; }} />);
  await tick();
}
function click(text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === text);
  assert(button, `Missing button ${text}`);
  button!.click();
}
const rows = () => [...document.querySelectorAll<HTMLElement>("[data-file-id]")].map(row => row.dataset.fileId);
async function folder(path: string) {
  let button = document.querySelector<HTMLButtonElement>(`[aria-label="Go to folder ${path}"]`);
  for (let i = 0; i < 100 && !button; i++) {
    await tick();
    button = document.querySelector<HTMLButtonElement>(`[aria-label="Go to folder ${path}"]`);
  }
  assert(button, `Missing folder ${path}`);
  button!.click();
  await tick();
}

async function test() {
  await persistOnboardingPacks([pack]);
  const saved = (await loadOnboardingPacks())[0];
  assert(saved.files[1].relativePath === "Guides/Guide.docx", "IndexedDB lost folder metadata");
  assert(saved.files[1].modifiedAt === pack.files[1].modifiedAt, "IndexedDB lost original modification time");
  await render(saved);
  assert(JSON.stringify(rows()) === '["legacy"]', "Root flattened subfolder files");
  assert(document.querySelectorAll(".ob-folder-row").length === 2, "Root folders are not visible");
  assert(document.querySelector('[aria-label="Go to folder Guides/Week 1"]'), "Nested sidebar folder is not visible");
  const headers = [...document.querySelectorAll("th")].map(header => header.textContent);
  assert(headers[0]?.startsWith("Name") && headers[1] === "Date modified" && headers[2] === "Type" && headers[3] === "Size",
    "Details columns do not follow the reference order");
  assert(document.querySelector("[data-file-id]")!.getBoundingClientRect().height <= 40, "Details rows are not compact");

  await folder("Guides");
  assert(JSON.stringify(rows()) === '["extra","guide"]', "Folder showed files from another folder or nested descendants");
  assert(document.querySelectorAll(".ob-folder-row").length === 1, "Child folder row is missing");
  assert(document.querySelector('[data-file-id="guide"] td:nth-child(2)')!.textContent?.includes("2026"),
    "Date modified is missing");
  assert(document.querySelector('[data-file-id="guide"] td:nth-child(2)')!.getAttribute("title") === pack.files[1].modifiedAt,
    "Explorer used upload time instead of original file modification time");
  click("Size");
  await tick();
  assert(JSON.stringify(rows()) === '["guide","extra"]', "Size sorting is incorrect");
  click("Size ↑");
  await tick();
  assert(JSON.stringify(rows()) === '["extra","guide"]', "Descending sorting is incorrect");

  const filesInput = document.querySelector<HTMLInputElement>('input[type="file"]:not([webkitdirectory])')!;
  const transfer = new DataTransfer();
  transfer.items.add(new File(["notes"], "New.txt", { lastModified: 1000 }));
  filesInput.files = transfer.files;
  filesInput.dispatchEvent(new Event("change", { bubbles: true }));
  assert(uploaded[0]?.relativePath === "Guides/New.txt", "Add files did not target the current folder");
  const directoryInput = document.querySelector<HTMLInputElement>("input[webkitdirectory]")!;
  const directoryTransfer = new DataTransfer();
  const nestedFile = new File(["notes"], "Nested.txt");
  Object.defineProperty(nestedFile, "webkitRelativePath", { value: "New folder/Child/Nested.txt" });
  directoryTransfer.items.add(nestedFile);
  directoryInput.files = directoryTransfer.files;
  directoryInput.dispatchEvent(new Event("change", { bubbles: true }));
  assert(uploaded[0]?.relativePath === "Guides/New folder/Child/Nested.txt", "Add folder lost its root or nested path");

  await folder("Guides/Week 1");
  assert(JSON.stringify(rows()) === '["week"]', "Nested folder contents are incorrect");
  click("Up");
  await tick();
  assert(rows().includes("guide") && !rows().includes("week"), "Up did not return to the parent folder");
  await folder("Answers");
  assert(JSON.stringify(rows()) === '["answer"]', "Same-named files leaked between folders");
  document.querySelector<HTMLButtonElement>('[aria-label="Remove Guide.docx"]')!.click();
  assert(removed?.id === "answer", "Remove selected the same-named file in the wrong folder");

  click(pack.name);
  await tick();
  const search = document.querySelector<HTMLInputElement>('[aria-label="Search this folder"]')!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setValue.call(search, "Guide.docx");
  search.dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
  assert(rows().length === 2, "Search did not find nested files");
  assert(document.querySelectorAll(".ob-search-location").length === 2, "Search did not show original folders");
  search.value = ""; // Reset by navigation.
  await folder("Guides");
  assert(!document.querySelector(".ob-search-location"), "Navigation did not clear search");

  await render(saved, false);
  assert(![...document.querySelectorAll("button")].some(button => button.textContent?.includes("Add files")),
    "Learners can add files");
  assert(!document.querySelector('[aria-label^="Remove "]'), "Learners can remove files");
  root.unmount();
  const reloaded = (await loadOnboardingPacks())[0];
  assert(reloaded.files[3].relativePath === "Guides/Week 1/Week.txt", "Reload lost nested folders");

  const zip = new JSZip();
  archiveFilePaths(reloaded.files).forEach(path => zip.file(path, "contents"));
  const archive = await JSZip.loadAsync(await zip.generateAsync({ type: "uint8array" }));
  assert(archive.file("Guides/Guide.docx") && archive.file("Answers/Guide.docx") &&
    archive.file("Guides/Week 1/Week.txt"), "ZIP flattened the folder hierarchy or overwrote names");

  root = createRoot(document.getElementById("fixture")!);
  root.render(<OnboardingPage profile={profile} route={{ page: "onboarding", packId: saved.id }} navigate={() => {}} />);
  await tick();
  await folder("Guides");
  const uploadInput = document.querySelector<HTMLInputElement>('input[type="file"]:not([webkitdirectory])')!;
  const actualUpload = new DataTransfer();
  actualUpload.items.add(new File(["uploaded content"], "Uploaded.txt", { type: "text/plain", lastModified: 1000 }));
  uploadInput.files = actualUpload.files;
  uploadInput.dispatchEvent(new Event("change", { bubbles: true }));
  let uploadedFile: OnboardingFile | undefined;
  for (let i = 0; i < 100; i++) {
    uploadedFile = (await loadOnboardingPacks())[0].files.find(file => file.name === "Uploaded.txt");
    if (uploadedFile) break;
    await tick();
  }
  assert(uploadedFile?.relativePath === "Guides/Uploaded.txt", "Actual upload did not persist its current folder");
  assert(uploadedFile?.modifiedAt === new Date(1000).toISOString(), "Actual upload did not persist the original file date");
  assert(uploadedFile?.data?.startsWith("data:text/plain;base64,"), "Actual upload did not save file content");

  let downloadedArchive: Blob | undefined;
  const originalCreate = URL.createObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = blob => {
    if (blob instanceof Blob) downloadedArchive = blob;
    return originalCreate.call(URL, blob);
  };
  HTMLAnchorElement.prototype.click = () => {};
  try {
    click("Download pack");
    for (let i = 0; i < 100 && !downloadedArchive; i++) await tick();
    assert(downloadedArchive, "Download pack did not create a ZIP");
    const downloaded = await JSZip.loadAsync(await downloadedArchive!.arrayBuffer());
    assert(downloaded.file("Guides/Uploaded.txt") && downloaded.file("Guides/Guide.docx") &&
      downloaded.file("Answers/Guide.docx"), "Actual ZIP download lost file folders");
  } finally {
    URL.createObjectURL = originalCreate;
    HTMLAnchorElement.prototype.click = originalClick;
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent =
    "PASS: details layout, folder navigation, breadcrumbs, original dates, sorting, current-folder uploads, nested folder uploads, duplicate names, search paths, learner permissions, IndexedDB reload, actual upload persistence and ZIP download hierarchy";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
