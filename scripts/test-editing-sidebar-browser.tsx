import { createRoot } from "react-dom/client";
import { EditingProvider } from "../src/components/EditingSidebar";
import { UnitPage } from "../src/pages/Course";
import { buildUnitContent } from "../src/lib/unitBuilder";
import { rememberUnitPack } from "../src/lib/unitStorage";
import { installSync } from "../src/lib/sync";
import { videoQuizId } from "../src/lib/videoLearning";
import "../src/styles.css";

const tick = () => new Promise(resolve => setTimeout(resolve, 60));
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function click(text: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")]
    .find(element => element.textContent?.trim() === text);
  assert(button, `Missing action: ${text}`); button.click();
}
function group(title: string) {
  const section = [...document.querySelectorAll<HTMLDetailsElement>(".editing-tool-group")]
    .find(element => element.querySelector("h3")?.textContent === title);
  assert(section, `Missing section: ${title}`);
  return section;
}
function fitsSidebar() {
  const sidebar = document.querySelector<HTMLElement>(".editing-sidebar");
  assert(sidebar && !sidebar.hidden, "Sidebar is visible");
  assert(sidebar.scrollWidth <= sidebar.clientWidth + 1, "Sidebar has no horizontal overflow");
  const bounds = sidebar.getBoundingClientRect();
  for (const element of sidebar.querySelectorAll<HTMLElement>("button,input,textarea,summary")) {
    if (!element.getClientRects().length) continue;
    const rect = element.getBoundingClientRect();
    assert(rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1,
      `Control fits sidebar: ${element.textContent?.trim().slice(0, 60) || element.getAttribute("aria-label")}`);
  }
}
async function test() {
  installSync();
  const source = "A local area network connects devices in one location. A router connects networks. A switch connects devices within a network. Ethernet supports wired connections.";
  const content = buildUnitContent({ us: "114059", title: "Network fundamentals", nqf: 5, credits: 5, dates: "", time: "" },
    source, { questions: 3, minutes: 60 });
  const file = { name: "Fixture", type: "application/pdf", size: 0, uploadedAt: "2026-10-12" };
  rememberUnitPack("itss.unitbuilder.114059.shared", JSON.stringify({
    revision: "sidebar-fixture", source, files: { pdf: file, pptx: file, answers: file }, content,
  }));
  localStorage.setItem("itss.lessonedits.114059.built-sidebar-fixture", JSON.stringify({
    videos: { 0: ["https://www.youtube.com/watch?v=abcdefghijk"] },
    videoQuizzes: { [videoQuizId("https://www.youtube.com/watch?v=abcdefghijk")]: {
      transcript: source.repeat(3),
      questions: Array.from({ length: 5 }, (_, index) => ({
        q: `Question ${index + 1}: What did the speaker explain about connecting devices within a local area network?`,
        options: [
          "A switch connects devices within a local area network using Ethernet connections.",
          "A router connects different networks together.",
          "Wireless devices cannot communicate.",
          "None of the above.",
        ],
        answer: 0, explain: "The speaker explained the difference between routers and switches.",
      })),
    } },
  }));
  createRoot(document.getElementById("fixture")!).render(
    <EditingProvider><div className="body"><main className="content">
      <UnitPage unitId="114059" profile={{ id: "sidebar-test", name: "Test", role: "Super User", createdAt: "2026-10-12" }}
        progress={{ units: {} }} toggleActivity={() => {}} saveQuizResult={() => {}} setLogbookField={() => {}}
        saveExerciseResult={() => {}} navigate={() => {}} />
    </main></div></EditingProvider>
  );
  for (let i = 0; i < 100 && !document.querySelector('[role="tab"]'); i++) await tick();
  click("Lesson"); await tick();
  if (innerWidth <= 640) {
    assert(document.querySelector<HTMLElement>(".editing-sidebar")?.hidden, "Desktop sidebar remains hidden on phones");
    assert(!document.querySelector(".lesson-header-edit"), "Phone layout is not forced into desktop editing");
  } else {
    click("Edit slide"); await tick();
    const finish = group("Slide 1 · Save and finish");
    const contentGroup = group("Slide content and images");
    const media = group("Videos and questions");
    assert(finish.getBoundingClientRect().top < contentGroup.getBoundingClientRect().top &&
      contentGroup.getBoundingClientRect().top < media.getBoundingClientRect().top, "Sections appear in workflow order");
    assert(media.querySelector(".lesson-video-editor-card"), "Saved videos appear without opening Add video");
    assert(!media.querySelector('input[type="url"]'), "Add-video form starts collapsed");
    assert(media.querySelector(".lesson-video-source-link")?.textContent?.includes("Open video source"),
      "Long URLs are replaced by a labelled source link");
    assert(media.querySelector(".lesson-video-quiz-state")?.textContent?.includes("5 questions saved"),
      "Assessment setup status is visible");
    fitsSidebar();
    click("Edit Video"); await tick();
    assert(media.querySelector('input[type="url"]'), "Add video opens a dedicated form");
    fitsSidebar();
    click("Cancel"); await tick();
    click("Edit slide text"); await tick();
    assert(group("Text formatting").open, "Text formatting appears when editing starts");
    const fontOptions = document.querySelector<HTMLButtonElement>('button[aria-label="Font and text options"]');
    assert(fontOptions, "Formatting options are labelled");
    fontOptions.click(); await tick(); fitsSidebar();
    fontOptions.click(); await tick();
    assert(finish.querySelector("button")?.textContent?.includes("Save to cloud"), "Save is the primary finish action");
    const settings = group("Slide quiz settings");
    const reset = group("Reset slide edits");
    assert(!settings.open && !reset.open, "Secondary settings and reset are collapsed by default");
    settings.querySelector("summary")?.click(); await tick();
    assert(settings.open && settings.querySelector('[aria-label="Number of quiz questions"]'),
      "Quiz settings remain accessible in their section");
    fitsSidebar();
    settings.querySelector("summary")?.click(); await tick();
    assert(!settings.open, "Sections can be collapsed");
    media.querySelector("summary")?.click(); await tick();
    assert(!media.open, "Media section can be collapsed");
    document.querySelector<HTMLElement>(".slide-whole-editor")?.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    assert(!media.open, "Editing updates do not reopen collapsed sections");
    media.querySelector("summary")?.click(); await tick();
    assert(media.open, "Media can be reopened");
    const assessment = media.querySelector<HTMLDetailsElement>(".lesson-video-quiz-editor");
    assert(assessment, "Video assessment setup exists");
    assessment.querySelector("summary")?.click(); await tick();
    assert(assessment.querySelector("textarea"), "Transcript entry remains available");
    const prompt = assessment.querySelector<HTMLTextAreaElement>(".generated-quiz-prompt");
    assert(prompt && parseFloat(getComputedStyle(prompt).fontSize) === 13,
      "Sidebar question text is compact at 13px");
    const options = assessment.querySelector<HTMLElement>(".generated-quiz-options");
    assert(options && getComputedStyle(options).gridTemplateColumns.split(" ").length === 1,
      "Sidebar answer options use one readable column");
    for (const textarea of assessment.querySelectorAll<HTMLTextAreaElement>(".generated-quiz-edit textarea")) {
      if (!textarea.getClientRects().length) continue;
      assert(textarea.scrollHeight <= textarea.clientHeight + 2, "Question and option text is not clipped");
    }
    fitsSidebar();
    const saveVideo = assessment.querySelector<HTMLButtonElement>(".lesson-video-save");
    const lastExplanation = assessment.querySelectorAll(".generated-quiz-explanation");
    assert(saveVideo && lastExplanation.length === 5, "Save Video follows all five questions");
    const saveRect = saveVideo.getBoundingClientRect();
    const explanationRect = lastExplanation[4].getBoundingClientRect();
    assert(saveRect.height <= 36 && saveRect.width < assessment.clientWidth,
      "Save Video is compact rather than full width");
    assert(saveRect.top - explanationRect.bottom >= 16,
      "Save Video has at least 16px clearance from the explanation");
    click("Done editing slide"); await tick();
    assert(document.querySelector<HTMLElement>(".editing-sidebar")?.hidden, "Finishing closes the sidebar");
    if (new URL(location.href).searchParams.has("preview")) {
      click("Edit slide"); await tick();
      click("Edit slide text"); await tick();
    }
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: ordered sidebar sections, save/finish actions, collapsible settings, video management and transcript setup; controls fit desktop/tablet and phone behavior is preserved";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
