import { createRoot } from "react-dom/client";
import { SlideEditableText } from "../src/components/SlideEditableText";
import { SlideTextToolbar } from "../src/components/SlideTextToolbar";
import { richTextHtml, saveRichText } from "../src/lib/slideRichText";
import { useLessonEdits } from "../src/store";

const unit = "__slide_editor_regression__";
const key = `itss.lessonedits.${unit}`;
const originals = ["First paragraph", "Second paragraph"];
function Fixture() {
  const { edits, setParagraph } = useLessonEdits(unit);
  const fields = [];
  let i = 0;
  while (i < originals.length) {
    const paragraphIndex = i;
    fields.push(<SlideEditableText key={i} as="p" id={`paragraph-${i}`}
      html={richTextHtml(edits.paragraphs?.[`0:${i}`] ?? originals[i])}
      onSave={element => setParagraph(0, paragraphIndex, saveRichText(element))} />);
    i++;
  }
  return <><SlideTextToolbar enabled />{fields}</>;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const stored = () => JSON.parse(localStorage.getItem(key) ?? "{}").paragraphs ?? {};
const select = (element: HTMLElement, end = false) => {
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  if (end) range.collapse(false);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
};
async function test() {
  const container = document.getElementById("fixture")!;
  let root = createRoot(container);
  const reloadExpected = sessionStorage.getItem("slide-edit-reload-expected");
  if (reloadExpected) {
    root.render(<Fixture />);
    await tick();
    assert(document.getElementById("paragraph-0")!.innerHTML === richTextHtml(reloadExpected), "Formatting must survive a full page reload");
    assert(document.getElementById("paragraph-1")!.textContent === "Changed second paragraph", "Text must survive a full page reload");
    sessionStorage.removeItem("slide-edit-reload-expected");
    document.body.dataset.result = "passed";
    document.getElementById("result")!.textContent = "PASS: immediate typing, correct paragraph index, formatting, caret, undo/redo, remount, and full page reload";
    return;
  }
  localStorage.removeItem(key);
  root.render(<Fixture />);
  await tick();
  const first = document.getElementById("paragraph-0")!;
  select(first, true);
  document.execCommand("insertText", false, " edited");
  await tick();
  assert(document.activeElement === first, "Typing must retain focus");
  assert(stored()["0:0"].includes("First paragraph edited"), "Save typing immediately at the first paragraph's index");
  assert(stored()["0:2"] === undefined, "Do not write to the final loop index");
  assert(window.getSelection()?.anchorOffset === first.textContent!.length, "Saving must preserve the caret");

  select(first);
  await tick();
  (document.querySelector('[aria-label="Bold"]') as HTMLButtonElement).click();
  await tick();
  const formatted = stored()["0:0"];
  assert(/font-weight: bold|<b>/.test(formatted), "Save toolbar formatting without blur");
  (document.querySelector('[aria-label="Undo"]') as HTMLButtonElement).click();
  await tick();
  assert(!/font-weight: bold|<b>/.test(stored()["0:0"]), "Persist undo");
  (document.querySelector('[aria-label="Redo"]') as HTMLButtonElement).click();
  await tick();
  assert(stored()["0:0"] === formatted, "Persist redo");

  const second = document.getElementById("paragraph-1")!;
  select(second);
  document.execCommand("insertText", false, "Changed second paragraph");
  await tick();
  assert(stored()["0:1"].includes("Changed second paragraph"), "Save the second field separately");
  assert(stored()["0:0"] === formatted, "Keep the first field when saving the second");
  root.unmount();
  root = createRoot(container);
  root.render(<Fixture />);
  await tick();
  assert(document.getElementById("paragraph-0")!.innerHTML === richTextHtml(formatted), "Restore formatting from storage on remount");
  assert(document.getElementById("paragraph-1")!.textContent === "Changed second paragraph", "Restore edited text from storage on remount");
  sessionStorage.setItem("slide-edit-reload-expected", formatted);
  location.reload();
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
