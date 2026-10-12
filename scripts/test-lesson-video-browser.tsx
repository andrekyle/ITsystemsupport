import { createRoot } from "react-dom/client";
import { LessonVideos } from "../src/components/LessonVideos";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 30));
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function button(label: string) {
  const element = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  assert(element, `Missing button: ${label}`);
  return element;
}
function stats(expected: number) {
  assert(document.querySelector(".lesson-video-stats")?.textContent?.includes(
    `${expected} ${expected === 1 ? "Share" : "Shares"}`), `Expected ${expected} shares`);
}
function closeIsVisible() {
  const rect = button("Close video").getBoundingClientRect();
  assert(rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth,
    "Close button must stay fully inside the viewport");
  assert(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    ?.closest('button[aria-label="Close video"]'), "Close button must not be covered");
}
function setShare(value: Navigator["share"] | undefined) {
  Object.defineProperty(navigator, "share", { configurable: true, value });
}

async function test() {
  const link = "https://example.com/lesson.mp4";
  createRoot(document.getElementById("fixture")!).render(
    <LessonVideos links={[link]} learnerName="Test learner" />
  );
  await tick();
  const filePreview = document.querySelector<HTMLVideoElement>(".lesson-video-launch video");
  assert(filePreview?.getAttribute("src") === link, "Direct files display a video frame preview");
  assert(filePreview.muted && !filePreview.autoplay && !filePreview.controls,
    "Preview is silent and does not play before opening");
  Object.defineProperty(filePreview, "duration", { configurable: true, value: 10 });
  filePreview.dispatchEvent(new Event("loadedmetadata"));
  assert(filePreview.currentTime === 0.1, "Direct-file preview seeks past the initial frame");
  button("Watch Lesson video 1 in expanded player").click();
  await tick();
  closeIsVisible();
  assert(document.activeElement === button("Close video"), "Opening focuses the close button");
  assert(document.body.style.overflow === "hidden", "Background scrolling is locked");
  stats(0);

  setShare(undefined);
  let copies = 0;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async (value: string) => {
      assert(value === link, "Copies the video link");
      copies++;
    } },
  });
  button("Share video").click();
  await tick();
  assert(copies === 1, "Clipboard fallback copies once");
  stats(0);
  assert(document.querySelector(".lesson-video-status")?.textContent?.includes("does not count"),
    "Clipboard feedback explains that copies are not shares");

  let shares = 0;
  let finishShare: (() => void) | undefined;
  setShare(async data => {
    assert(data?.url === link, "Shares the original video link");
    shares++;
    await new Promise<void>(resolve => { finishShare = resolve; });
  });
  const shareButton = button("Share video");
  shareButton.click();
  shareButton.click();
  await tick();
  assert(shares === 1 && shareButton.disabled, "Prevents duplicate shares while pending");
  stats(0);
  assert(finishShare, "Native share is pending");
  finishShare();
  await tick();
  stats(1);
  assert(!shareButton.disabled, "Sharing is enabled after completion");

  setShare(async () => { throw new DOMException("Cancelled", "AbortError"); });
  shareButton.click();
  await tick();
  stats(1);
  assert(!document.querySelector(".lesson-video-status"), "Cancellation is not shown as an error or success");

  setShare(async () => { throw new Error("Share failed"); });
  shareButton.click();
  await tick();
  stats(1);
  assert(document.querySelector(".lesson-video-status")?.textContent === "Share failed", "Share errors are visible");

  setShare(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async () => { throw new Error("Copy failed"); } },
  });
  shareButton.click();
  await tick();
  stats(1);
  assert(document.querySelector(".lesson-video-status")?.textContent === "Copy failed", "Copy errors are visible");
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  shareButton.click();
  await tick();
  stats(1);
  assert(document.querySelector(".lesson-video-status")?.textContent?.includes("not available"),
    "Unsupported sharing is reported");

  button("Show comments").click();
  await tick();
  const modal = document.querySelector<HTMLElement>(".lesson-video-modal");
  assert(modal, "Video modal is open");
  for (let i = 0; i < 15; i++) {
    const input = document.querySelector<HTMLInputElement>(".lesson-video-comments input");
    assert(input, "Comment input is present");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    assert(setter, "Input value setter is available");
    setter.call(input, `Test comment ${i}`);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    document.querySelector(".lesson-video-comments form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
  }
  assert(modal.scrollHeight > modal.clientHeight, "Long content scrolls inside the modal");
  modal.scrollTop = modal.scrollHeight;
  await tick();
  closeIsVisible();
  button("Close video").click();
  await tick();
  assert(!document.querySelector('[role="dialog"]'), "Visible close button closes the viewer");
  assert(document.body.style.overflow !== "hidden", "Closing restores background scrolling");
  assert(document.activeElement === button("Watch Lesson video 1 in expanded player"),
    "Closing restores focus to the launch button");
  button("Watch Lesson video 1 in expanded player").click();
  await tick();
  closeIsVisible();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await tick();
  assert(!document.querySelector('[role="dialog"]'), "Escape still closes the viewer");
  const previewFixture = document.createElement("div");
  document.body.append(previewFixture);
  createRoot(previewFixture).render(<LessonVideos links={[
    "https://youtu.be/abcdefghijk",
    "https://vimeo.com/123456/abc123",
  ]} />);
  await tick();
  const thumbnail = previewFixture.querySelector<HTMLImageElement>("img.lesson-video-thumbnail");
  assert(thumbnail?.src === "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
    "YouTube links display their video thumbnail");
  const vimeoPreview = previewFixture.querySelector<HTMLIFrameElement>("iframe.lesson-video-thumbnail");
  assert(vimeoPreview?.src === "https://player.vimeo.com/video/123456?h=abc123",
    "Vimeo preview retains the privacy hash and does not autoplay");
  assert(vimeoPreview.tabIndex === -1 && getComputedStyle(vimeoPreview).pointerEvents === "none",
    "Embedded preview does not intercept Watch video clicks");
  assert(!previewFixture.querySelector('[role="dialog"]'), "Thumbnails do not open the player");
  thumbnail.dispatchEvent(new Event("error"));
  await tick();
  assert(previewFixture.textContent?.includes("thumbnail unavailable"), "Thumbnail errors are visible");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: video thumbnails render for YouTube, Vimeo and direct files without autoplay; share counting and visible close-button regressions pass";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
