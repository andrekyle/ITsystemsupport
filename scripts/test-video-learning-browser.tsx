import { createRoot } from "react-dom/client";
import { LessonVideos } from "../src/components/LessonVideos";
import { VideoQuizEditor } from "../src/components/VideoQuizEditor";
import { TrackedVideoPlayer } from "../src/components/TrackedVideoPlayer";
import { VideoWatchTracker, videoEngagementKey, videoQuizId, type VideoQuiz } from "../src/lib/videoLearning";
import { useProgress, loadProgress } from "../src/store";
import { computeGamification } from "../src/lib/gamification";
import { installSync } from "../src/lib/sync";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 40));
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function clickText(text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")]
    .find(element => element.textContent?.trim() === text);
  assert(button, `Missing button: ${text}`);
  button.click();
  return button;
}
const link = "https://example.com/video.mp4";
const id = videoQuizId(link);
const profileId = `video-learning-browser-${crypto.randomUUID()}`;
const unit = "114050";
const questions = Array.from({ length: 5 }, (_, i) => ({
  q: `What is concept ${i + 1}?`, options: ["Correct", "Incorrect", "Not covered", "None"],
  answer: 0, explain: "Concept explained in this video.",
}));
const quiz: VideoQuiz = { transcript: "The video explains five concepts. ".repeat(20), questions };
function Fixture() {
  const { state, saveQuizResult, setLogbookField } = useProgress(profileId);
  return <LessonVideos links={[link]} quizzes={{ [id]: quiz }}
    completedVideoIds={state.units[unit]?.quizzes?.[id]?.best === 5 ? [id] : []}
    logbook={state.units[unit]?.logbook}
    onLike={(link, liked) => {
      setLogbookField(unit, videoEngagementKey(link, "liked"), liked);
      if (liked) setLogbookField(unit, videoEngagementKey(link, "likeXp"), true);
    }}
    onComment={(link, comments) => {
      setLogbookField(unit, videoEngagementKey(link, "comments"), JSON.stringify(comments));
      setLogbookField(unit, videoEngagementKey(link, "commentXp"), true);
    }}
    onComplete={(_, answers) => saveQuizResult(unit, 5, 5, id, { answers, watchedFully: true })} />;
}
function launch() {
  const button = document.querySelector<HTMLButtonElement>(".lesson-video-launch");
  assert(button, "Launch button exists"); button.click();
}
async function simulatePlayback() {
  const video = document.querySelector<HTMLVideoElement>(".lesson-video-player video");
  assert(video, "Expanded native player exists");
  let seconds = 0;
  let clock = 0;
  const originalNow = performance.now.bind(performance);
  Object.defineProperty(performance, "now", { configurable: true, value: () => clock });
  Object.defineProperties(video, {
    currentTime: { configurable: true, get: () => seconds },
    duration: { configurable: true, value: 10 },
    paused: { configurable: true, value: false },
    seeking: { configurable: true, value: false },
  });
  try {
    video.dispatchEvent(new Event("playing"));
    seconds = 9; clock = 100;
    video.dispatchEvent(new Event("timeupdate"));
    seconds = 10; clock = 1100;
    video.dispatchEvent(new Event("ended"));
    await tick();
    assert(!document.querySelector(".lesson-video-quiz"), "Seeking to the end does not unlock questions");
    video.dispatchEvent(new Event("seeking"));
    for (let i = 0; i <= 10; i++) {
      seconds = i; clock = 3000 + i * 1000;
      video.dispatchEvent(new Event("timeupdate"));
      await tick();
    }
    video.dispatchEvent(new Event("ended"));
    await tick();
  } finally {
    Object.defineProperty(performance, "now", { configurable: true, value: originalNow });
  }
}

async function test() {
  localStorage.clear();
  installSync();
  const root = createRoot(document.getElementById("fixture")!);
  root.render(<Fixture />);
  await tick();
  launch(); await tick();
  const complete = document.querySelector<HTMLButtonElement>(".lesson-video-complete");
  assert(complete?.disabled, "Complete starts disabled");
  assert(!complete.querySelector("svg"), "Completion button has no check mark");
  assert(complete.getBoundingClientRect().height <= 26, "Completion button is compact");
  assert(!document.querySelector(".lesson-video-quiz"), "Quiz is hidden before full playback");
  complete.click(); await tick();
  assert(!loadProgress(profileId).units[unit]?.quizzes?.[id], "No early result or XP is recorded");
  await simulatePlayback();
  assert(document.querySelectorAll(".lesson-video-quiz fieldset").length === 5, "Five questions appear at the end");
  assert(complete.disabled, "Watching alone does not unlock completion");
  const fieldsets = [...document.querySelectorAll(".lesson-video-quiz fieldset")];
  for (const fieldset of fieldsets) {
    fieldset.querySelectorAll<HTMLInputElement>("input")[1].click(); await tick();
  }
  clickText("Check video answers"); await tick();
  assert(complete.disabled, "Wrong answers do not unlock completion");
  assert(computeGamification(loadProgress(profileId), 0, 0).xp === 0, "Failed checks earn no XP");
  for (const fieldset of fieldsets) {
    fieldset.querySelectorAll<HTMLInputElement>("input")[0].click(); await tick();
  }
  assert(complete.disabled, "Answers must be checked before completion");
  clickText("Check video answers"); await tick();
  assert(!complete.disabled, "All five correct answers unlock Complete");
  assert(computeGamification(loadProgress(profileId), 0, 0).xp === 0, "XP waits for Complete");
  complete.click(); await tick();
  for (const theme of ["light", "dark"]) {
    document.documentElement.dataset.theme = theme;
    assert(getComputedStyle(complete).backgroundColor === "rgb(16, 124, 16)" &&
      getComputedStyle(complete).borderTopWidth === "0px",
      "Successfully completed video quiz displays a green borderless button in both themes");
    assert(complete.getBoundingClientRect().height <= 26 && complete.getBoundingClientRect().width < 85,
      "Completed button stays small");
  }
  const result = loadProgress(profileId).units[unit]?.quizzes?.[id];
  assert(result?.best === 5 && result.total === 5 && result.attempts === 1, "Completion persists the five-question result once");
  assert(computeGamification(loadProgress(profileId), 0, 0).xp === 100, "Existing quiz XP and evidence credit are earned");
  document.querySelector<HTMLButtonElement>('button[aria-label="Like video"]')?.click();
  await tick();
  assert(computeGamification(loadProgress(profileId), 0, 0).xp === 105,
    `First like awards five XP: ${JSON.stringify(loadProgress(profileId).units[unit])}; ${document.querySelector(".lesson-video-status")?.textContent}`);
  document.querySelector<HTMLButtonElement>('button[aria-label="Unlike video"]')?.click();
  await tick();
  document.querySelector<HTMLButtonElement>('button[aria-label="Like video"]')?.click();
  await tick();
  assert(computeGamification(loadProgress(profileId), 0, 0).xp === 105, "Unlike/re-like cannot farm XP");
  document.querySelector<HTMLButtonElement>('button[aria-label="Show comments"]')?.click();
  await tick();
  const commentInput = document.querySelector<HTMLInputElement>(".lesson-video-comments input");
  assert(commentInput, "Comment input exists");
  const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  assert(inputSetter, "Input setter exists");
  for (const text of ["   ", "This explains networking clearly.", "Another comment."]) {
    inputSetter.call(commentInput, text);
    commentInput.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    clickText("Post"); await tick();
    const expected = text.trim() ? 115 : 105;
    assert(computeGamification(loadProgress(profileId), 0, 0).xp === expected,
      "Only the first nonempty comment earns ten XP");
  }
  const duplicateVideoProgress = structuredClone(loadProgress(profileId));
  duplicateVideoProgress.units["duplicate-unit"] = {
    activities: {}, logbook: {
      [videoEngagementKey(link, "likeXp")]: true,
      [videoEngagementKey(link, "commentXp")]: true,
    },
  };
  assert(computeGamification(duplicateVideoProgress, 0, 0).xp === 115,
    "Same video on another unit cannot duplicate engagement XP");
  complete.click(); await tick();
  assert(loadProgress(profileId).units[unit]?.quizzes?.[id]?.attempts === 1, "Repeat clicks cannot farm XP");
  document.querySelector<HTMLButtonElement>('button[aria-label="Close video"]')?.click();
  await tick();
  root.unmount();
  const reloadRoot = createRoot(document.getElementById("fixture")!);
  reloadRoot.render(<Fixture />);
  await tick(); launch(); await tick();
  assert(document.querySelector<HTMLButtonElement>(".lesson-video-complete")?.disabled &&
    document.querySelector(".lesson-video-complete")?.textContent?.includes("Completed"),
  "Completion survives remounting");
  assert(document.querySelector('button[aria-label="Unlike video"]'), "Like survives remounting");
  document.querySelector<HTMLButtonElement>('button[aria-label="Show comments"]')?.click();
  await tick();
  assert(document.querySelectorAll(".lesson-video-comments li").length === 2, "Comments survive remounting");
  assert(computeGamification(loadProgress(profileId), 0, 0).xp === 115, "Engagement XP survives remounting");
  document.querySelector<HTMLButtonElement>('button[aria-label="Close video"]')?.click();
  await tick();

  const staff = document.createElement("div"); document.body.append(staff);
  let savedQuiz: VideoQuiz | undefined;
  createRoot(staff).render(<VideoQuizEditor disabled={false}
    onSave={async value => { savedQuiz = value; }} />);
  await tick();
  staff.querySelector("summary")?.click();
  const textarea = staff.querySelector("textarea");
  assert(textarea, "Transcript editor exists");
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  assert(valueSetter, "Textarea setter exists");
  valueSetter.call(textarea, quiz.transcript);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    assert(input === "/api/generate-slide-quiz", "Uses the existing AI service");
    const request = JSON.parse(String(init?.body));
    assert(request.purpose === "video" && request.count === 5 && request.slideText === quiz.transcript,
      "Generation uses the supplied transcript and exactly five questions");
    return Response.json({ questions });
  };
  try {
    clickText("Generate five video questions"); await tick();
    assert(staff.querySelectorAll(".generated-quiz-edit").length === 5, "Staff review all five generated questions");
    const videoSaveButton = clickText("Save Video"); await tick();
    assert(getComputedStyle(videoSaveButton).backgroundColor === "rgb(198, 40, 40)",
      "Save Video is a red button");
    assert(savedQuiz?.questions.length === 5 && savedQuiz.transcript === quiz.transcript,
      "Reviewed assessment and source transcript are saved together");
    valueSetter.call(textarea, quiz.transcript + "Changed transcript.");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    const saveButton = [...staff.querySelectorAll<HTMLButtonElement>("button")]
      .find(button => button.textContent?.trim() === "Save Video");
    assert(saveButton?.disabled, "Changed transcripts require regeneration");
  } finally { window.fetch = originalFetch; }

  const streaming = document.createElement("div"); document.body.append(streaming);
  const streamingRoot = createRoot(streaming);
  let youtubeFinished = false;
  let youtubeError = "";
  const youtubeStart = performance.now();
  window.YT = { Player: class {
    constructor(_iframe: HTMLIFrameElement, options: { events: { onReady: () => void } }) {
      setTimeout(options.events.onReady, 0);
    }
    getCurrentTime() { return Math.min(1, (performance.now() - youtubeStart) / 1000); }
    getDuration() { return 1; }
    getPlayerState() { return this.getCurrentTime() >= 1 ? 0 : 1; }
    playVideo() {}
    destroy() {}
  } };
  streamingRoot.render(<TrackedVideoPlayer source={{ kind: "embed", src: "https://www.youtube-nocookie.com/embed/abcdefghijk" }}
    title="YouTube fixture" tracker={new VideoWatchTracker()} onFinished={() => { youtubeFinished = true; }}
    onError={message => { youtubeError = message; }} />);
  await tick();
  assert(streaming.querySelector("iframe")?.src.includes("enablejsapi=1"),
    "YouTube player enables tracked playback");
  assert(!youtubeFinished, "YouTube cannot unlock before reaching the end");
  for (let i = 0; i < 60 && !youtubeFinished && !youtubeError; i++) await tick();
  assert(youtubeFinished && !youtubeError, `YouTube SDK playback unlocks after full viewing: ${youtubeError}`);
  streamingRoot.unmount();

  const roundedTracker = new VideoWatchTracker();
  const roundedStart = performance.now();
  for (let i = 0; i <= 1200; i++) {
    roundedTracker.sample(i / 4, 301.8, roundedStart - 300000 + i * 250 + (i % 2 ? 15 : 0));
  }
  let roundedFinished = false;
  let roundedError = "";
  window.YT = { Player: class {
    constructor(_iframe: HTMLIFrameElement, options: { events: { onReady: () => void } }) {
      setTimeout(options.events.onReady, 0);
    }
    getCurrentTime() { return Math.min(301, 300 + (performance.now() - roundedStart) / 1000); }
    getDuration() { return 301.8; }
    getPlayerState() { return this.getCurrentTime() >= 301 ? 0 : 1; }
    playVideo() {}
    destroy() {}
  } };
  const roundedRoot = createRoot(streaming);
  roundedRoot.render(<TrackedVideoPlayer source={{ kind: "embed", src: "https://www.youtube-nocookie.com/embed/abcdefghijk" }}
    title="Rounded YouTube duration" tracker={roundedTracker}
    onFinished={() => { roundedFinished = true; }}
    onError={message => { roundedError = message; }} />);
  for (let i = 0; i < 60 && !roundedFinished && !roundedError; i++) await tick();
  assert(roundedFinished && !roundedError,
    `5:01 playable ending unlocks with 5:02 metadata despite polling jitter: ${roundedError}`);
  roundedRoot.unmount();

  const vimeoEvents: Record<string, (data: { seconds: number; duration: number }) => void> = {};
  window.Vimeo = { Player: class {
    on(event: string, callback: (data: { seconds: number; duration: number }) => void) { vimeoEvents[event] = callback; }
    off(event: string) { delete vimeoEvents[event]; }
    async ready() {}
    async play() {}
  } };
  let vimeoFinished = false;
  const vimeoRoot = createRoot(streaming);
  vimeoRoot.render(<TrackedVideoPlayer source={{ kind: "embed", src: "https://player.vimeo.com/video/123456?h=abc123" }}
    title="Vimeo fixture" tracker={new VideoWatchTracker()} onFinished={() => { vimeoFinished = true; }}
    onError={message => { throw new Error(message); }} />);
  await tick();
  assert(vimeoEvents.timeupdate && vimeoEvents.ended, "Vimeo SDK subscribes to playback and ending");
  const originalNow = performance.now.bind(performance);
  let time = 0;
  Object.defineProperty(performance, "now", { configurable: true, value: () => time });
  try {
    for (let i = 0; i <= 10; i++) {
      time = i * 1000;
      vimeoEvents.timeupdate({ seconds: i, duration: 10 }); await tick();
    }
    assert(!vimeoFinished, "Vimeo waits for ended before showing questions");
    vimeoEvents.ended({ seconds: 10, duration: 10 });
    assert(vimeoFinished, "Full Vimeo viewing unlocks questions on ended");
  } finally {
    Object.defineProperty(performance, "now", { configurable: true, value: originalNow });
  }
  vimeoRoot.unmount();
  assert(!Object.keys(vimeoEvents).length, "Closing unsubscribes from Vimeo SDK events");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: full watch + 5/5 gates completion; likes earn 5 XP and first comments earn 10 XP once per video; engagement and completion persist without duplicate XP; transcript-grounded questions save correctly";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
