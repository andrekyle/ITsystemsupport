import { supabase } from "./supabase";
import { FILES_BUCKET } from "./files";

/**
 * Learner reports contain personal data (names, ID numbers), so they are NOT
 * bundled with the app or committed to the repo. They live in the private
 * Supabase "files" bucket under shared/reports/ — readable only by signed-in
 * users via short-lived signed URLs. The Super User uploads the HTML once;
 * after that the sidebar button opens it directly on any device.
 */
const TRACKER_PATH = "shared/reports/learner-tracker-investec-aug-2026.html";

function pickHtmlFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,text/html";
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
    // Chromium fires "cancel" when the dialog is dismissed
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}

/** Open the learner tracker report; on first use, upload it to private storage. */
export async function openTrackerReport(): Promise<void> {
  if (!supabase) {
    alert("Cloud storage is not configured on this device.");
    return;
  }
  // Open the tab synchronously so popup blockers allow it; fill it in after.
  const tab = window.open("", "_blank");

  const { data } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(TRACKER_PATH, 3600);
  if (data && data.signedUrl) {
    if (tab) tab.location.replace(data.signedUrl);
    else window.open(data.signedUrl, "_blank", "noopener");
    return;
  }

  // Not uploaded yet — ask the Super User for the report file (one-off).
  const wants = confirm(
    "The report is not in cloud storage yet.\n\nChoose the report HTML file to upload it once — after this it opens with a single click on any device."
  );
  if (!wants) {
    if (tab) tab.close();
    return;
  }
  const file = await pickHtmlFile();
  if (!file) {
    if (tab) tab.close();
    return;
  }
  const { error } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(TRACKER_PATH, file, { upsert: true, contentType: "text/html" });
  if (error) {
    if (tab) tab.close();
    alert(`Could not upload the report: ${error.message}`);
    return;
  }
  const { data: after } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(TRACKER_PATH, 3600);
  if (after && after.signedUrl) {
    if (tab) tab.location.replace(after.signedUrl);
    else window.open(after.signedUrl, "_blank", "noopener");
  } else if (tab) {
    tab.close();
  }
}
