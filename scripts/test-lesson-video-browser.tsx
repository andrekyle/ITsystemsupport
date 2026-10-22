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
function closeIsVisible() {
  const rect = button("Close video").getBoundingClientRect();
  assert(rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth,
    "Close button must stay fully inside the viewport");
  assert(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    ?.closest('button[aria-label="Close video"]'), "Close button must not be covered");
}

async function test() {
  const link = "https://example.com/lesson.mp4";
  const learnerProfile = {
    id: "profile-test-learner",
    name: "Test learner",
    role: "Learner" as const,
    createdAt: "2026-10-13T00:00:00.000Z",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230088cc'/%3E%3C/svg%3E",
  };
  createRoot(document.getElementById("fixture")!).render(
    <LessonVideos links={[link]} learnerName="Test learner" learnerProfile={learnerProfile} />
  );
  await tick();
  const launch = button("Watch Lesson video 1 in expanded player");
  const launchStyle = getComputedStyle(launch);
  assert(launchStyle.borderRadius === "0px", "Video thumbnail has square corners");
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    assert(launchStyle[`border${side}Width`] === "0px", "Video thumbnail has no border");
    assert(launchStyle[`padding${side}`] === "0px", "Video thumbnail has no edge padding");
  }
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
  const viewsPill = document.querySelector<HTMLElement>('.lesson-video-stats span[title="Each user counts once a day"]');
  assert(viewsPill?.textContent === "Views unavailable", "Without a platform connection the daily view count is reported unavailable");
  assert(document.querySelector(".lesson-video-watched")?.textContent?.includes("Test learner · learning now"),
    "The learner line keeps its progress text until a daily count exists");
  const scrollContent = document.querySelector<HTMLElement>(".lesson-video-scroll-content");
  const player = document.querySelector<HTMLElement>(".lesson-video-player");
  assert(scrollContent && player, "Player and scrolling details are separate");
  const viewer = document.querySelector<HTMLElement>(".lesson-video-modal")!;
  const media = player.querySelector("video,iframe")!;
  for (const element of [viewer, player, media]) {
    const style = getComputedStyle(element);
    assert(style.borderLeftWidth === "0px" && style.borderRightWidth === "0px" &&
      style.paddingLeft === "0px" && style.paddingRight === "0px", "Video viewer has no side borders or padding");
  }
  assert(Math.abs(media.getBoundingClientRect().width - viewer.getBoundingClientRect().width) < 1,
    "Video reaches both viewer edges");
  const mediaBounds = media.getBoundingClientRect();
  assert(Math.abs(mediaBounds.width / mediaBounds.height - 16 / 9) < 0.01,
    "Player preserves its full 16:9 aspect ratio rather than squeezing or cropping the video");
  const embedProbe = document.createElement("iframe");
  player.append(embedProbe);
  const embedBounds = embedProbe.getBoundingClientRect();
  assert(Math.abs(embedBounds.width / embedBounds.height - 16 / 9) < 0.01,
    "Embedded players also preserve the full video aspect ratio");
  embedProbe.remove();
  const playerTop = player.getBoundingClientRect().top;
  const overflowFixture = document.createElement("div");
  overflowFixture.style.height = "1000px";
  scrollContent.append(overflowFixture);
  scrollContent.scrollTop = 150;
  assert(scrollContent.scrollTop > 0, "Details content scrolls independently");
  assert(player.getBoundingClientRect().top === playerTop, "Video does not move while details scroll");
  closeIsVisible();
  overflowFixture.remove();
  scrollContent.scrollTop = 0;
  assert(document.activeElement === button("Close video"), "Opening focuses the close button");
  assert(document.body.style.overflow === "hidden", "Background scrolling is locked");
  assert(!document.querySelector('button[aria-label="Share video"]'), "Share button is removed");
  assert(!document.querySelector('button[aria-label="Save video"]'), "Save/tag button is removed");
  assert(!document.querySelector('button[aria-label="Remove saved video"]'), "Saved tag toggle is removed");
  assert(!document.querySelector(".lesson-video-stats")?.textContent?.includes("Share"),
    "Share stats are removed with the share action");

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
  const firstComment = document.querySelector<HTMLElement>(".lesson-video-comments li");
  assert(firstComment?.querySelector<HTMLImageElement>("img.avatar-img")?.alt === "Test learner",
    "Comments show the commenter's profile image avatar");
  assert(firstComment?.querySelector(".lesson-video-comment-body strong")?.textContent === "Test learner",
    "Comments show who posted them");
  assert(scrollContent.scrollHeight > scrollContent.clientHeight, "Long content scrolls below the video");
  scrollContent.scrollTop = scrollContent.scrollHeight;
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
  assert(thumbnail?.src === "https://i.ytimg.com/vi/abcdefghijk/maxresdefault.jpg",
    "YouTube links request the highest-resolution thumbnail first");
  const vimeoPreview = previewFixture.querySelector<HTMLIFrameElement>("iframe.lesson-video-thumbnail");
  assert(vimeoPreview?.src === "https://player.vimeo.com/video/123456?h=abc123",
    "Vimeo preview retains the privacy hash and does not autoplay");
  assert(vimeoPreview.tabIndex === -1 && getComputedStyle(vimeoPreview).pointerEvents === "none",
    "Embedded preview does not intercept Watch video clicks");
  assert(!previewFixture.querySelector('[role="dialog"]'), "Thumbnails do not open the player");
  Object.defineProperty(thumbnail, "naturalWidth", { configurable: true, value: 1280 });
  thumbnail.dispatchEvent(new Event("load"));
  await tick();
  assert(thumbnail.src.endsWith("/maxresdefault.jpg"), "Available high-resolution thumbnails are retained");
  Object.defineProperty(thumbnail, "naturalWidth", { configurable: true, value: 120 });
  thumbnail.dispatchEvent(new Event("load"));
  await tick();
  assert(thumbnail.src.endsWith("/sddefault.jpg"), "Missing high-resolution placeholders fall back to SD");
  thumbnail.dispatchEvent(new Event("error"));
  await tick();
  assert(thumbnail.src.endsWith("/hqdefault.jpg"), "Failed SD images fall back to the standard thumbnail");
  thumbnail.dispatchEvent(new Event("error"));
  await tick();
  assert(previewFixture.textContent?.includes("thumbnail unavailable"), "Thumbnail errors are visible");
  const completedFixture = document.createElement("div");
  document.body.append(completedFixture);
  createRoot(completedFixture).render(<LessonVideos links={[link]} completed />);
  await tick();
  completedFixture.querySelector<HTMLButtonElement>(".lesson-video-launch")!.click();
  await tick();
  const completedButton = document.querySelector<HTMLButtonElement>(".lesson-video-complete.is-complete");
  assert(completedButton?.disabled, "Completed video cannot earn completion again");
  for (const theme of ["light", "dark"]) {
    document.documentElement.dataset.theme = theme;
    const style = getComputedStyle(completedButton);
    assert(style.backgroundColor === "rgb(24, 135, 24)" && style.color === "rgb(255, 255, 255)" &&
      style.borderTopWidth === "0px", "Completed button is green with white text and no border in both themes");
  }
  button("Close video").click();
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: video thumbnails render for YouTube, Vimeo and direct files without autoplay; share counting and visible close-button regressions pass";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
