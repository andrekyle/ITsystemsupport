import { createRoot } from "react-dom/client";
import { UnitContentEditor } from "../src/components/UnitContentEditor";
import "../src/styles.css";
import "../src/components/unit-builder.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function test() {
  const text = "Long editable content. ".repeat(200);
  let latest: unknown = null;
  createRoot(document.getElementById("fixture")!).render(
    <div className="unit-builder" style={{ width: 560 }}>
      <UnitContentEditor value={{
        lesson: [
          { heading: '<!--slide-rich--><span style="color:blue">Network&nbsp; Support</span>', paragraphs: [text] },
          { heading: "Second lesson", paragraphs: ["Short paragraph."] },
        ],
        quiz: [{ q: "Which device joins networks?", options: ["Router", "Switch"], answer: 0, explain: "Routers join networks." }],
      }} onChange={value => { latest = value; }} />
    </div>);
  await new Promise(resolve => setTimeout(resolve, 100));
  const lesson = document.querySelector<HTMLElement>('.unit-editor-section[data-unit-section="lesson"]')!;
  assert(lesson.querySelector("h3")?.textContent === "Lesson sections" && lesson.querySelector(".unit-editor-count")?.textContent === "2",
    "Sections are labelled with their item count");
  const cards = lesson.querySelectorAll<HTMLElement>(".unit-editor-card");
  const title = cards[0].querySelector(".unit-editor-card-title")?.textContent;
  assert(title === "Network Support" && !title.includes("<span") && !cards[0].querySelector("textarea"),
    "Collapsed cards show the plain-text heading rather than HTML");
  assert(cards[0].querySelector<HTMLButtonElement>('[aria-label="Move Lesson section 1 up"]')?.disabled &&
    !cards[1].querySelector<HTMLButtonElement>('[aria-label="Move Lesson section 2 up"]')?.disabled &&
    cards[1].querySelector<HTMLButtonElement>('[aria-label="Move Lesson section 2 down"]')?.disabled,
    "Move actions are disabled at the list edges");
  cards[0].querySelector<HTMLButtonElement>(".unit-editor-card-toggle")!.click();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(cards[0].classList.contains("is-open") &&
    cards[0].querySelector(".unit-editor-card-toggle")?.getAttribute("aria-expanded") === "true" &&
    !cards[1].classList.contains("is-open"), "Only the chosen card expands");
  const paragraph = cards[0].querySelector<HTMLElement>(".unit-editor-line")!;
  assert(paragraph.querySelector(".unit-editor-index")?.textContent === "1" &&
    paragraph.querySelector('[aria-label="Remove Paragraph 1"]') && !paragraph.querySelector('[aria-label="Duplicate Paragraph 1"]'),
    "Text lines are numbered with move and remove actions only");
  const quiz = document.querySelector<HTMLElement>('.unit-editor-section[data-unit-section="quiz"]')!;
  quiz.querySelector<HTMLButtonElement>(".unit-editor-card-toggle")!.click();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(quiz.querySelector('.nice-select-btn[aria-label="Correct answer for Quiz question 1"]')?.textContent?.includes("1. Router"),
    "Correct answer is chosen from the options");
  for (const theme of ["light", "dark"]) {
    document.documentElement.dataset.theme = theme;
    const textarea = paragraph.querySelector("textarea")!;
    const style = getComputedStyle(textarea);
    assert(style.fontSize === "12px" && style.borderTopWidth === "0px", `Fields are compact and borderless in ${theme} mode`);
    assert(style.backgroundColor === "rgba(0, 0, 0, 0)", `Fields have no boxed background in ${theme} mode`);
    assert(textarea.getBoundingClientRect().right >= paragraph.querySelector(".unit-editor-item-actions")!.getBoundingClientRect().left - 12 &&
      textarea.getBoundingClientRect().width >= paragraph.clientWidth * .6, "Fields use the available row width");
    const heading = cards[0].querySelector("textarea")!;
    assert(heading.getBoundingClientRect().height <= 50, "Short heading does not waste vertical space");
    assert(getComputedStyle(cards[0]).borderLeftWidth === "0px" && getComputedStyle(cards[0]).borderRightWidth === "0px", "Cards are not boxed in");
    assert(style.resize === "vertical" && style.overflowY === "auto", "Fields resize and scroll");
    textarea.scrollTop = 100;
    assert(textarea.scrollTop > 0, "Long content actually scrolls");
    const height = textarea.getBoundingClientRect().height;
    textarea.style.height = `${height + 100}px`;
    assert(textarea.getBoundingClientRect().height >= height + 99, "Field can grow vertically");
    textarea.style.height = "";
  }
  lesson.querySelector<HTMLButtonElement>('[aria-label="Remove Lesson section 2"]')!.click();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(latest === null && lesson.querySelector(".unit-editor-item-confirm")?.textContent?.includes("Remove this lesson section?"),
    "Removing asks for confirmation first");
  [...lesson.querySelectorAll<HTMLButtonElement>(".unit-editor-item-confirm button")].find(b => b.textContent === "Remove")!.click();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(Array.isArray((latest as { lesson?: unknown[] })?.lesson) && (latest as { lesson: unknown[] }).lesson.length === 1,
    "Confirming removes the item");
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: sectioned cards with plain headings, labelled actions, confirmation and compact borderless resizable text";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
