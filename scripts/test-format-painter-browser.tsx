import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { SlideTextToolbar } from "../src/components/SlideTextToolbar";
import { SlideEditableText } from "../src/components/SlideEditableText";
import { sanitizeSlideHtml } from "../src/lib/slideRichText";
import "../src/styles.css";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const initial = `<h3 style="text-align:center;line-height:1.8"><span data-user-color="true" style="font-family:Georgia;font-size:24px;font-weight:700;font-style:italic;color:#c02040;background-color:#fff59d;text-decoration:underline">Source formatting</span></h3>
<p>Plain source</p><p>Before <span style="font-family:Arial;font-size:13px">target words</span> after</p>
<p><b><u>Remove old bold and underline</u></b></p><p>Second paragraph</p>
<table class="data lesson-table"><tbody><tr><td>Cell destination</td></tr></tbody></table>`;
let saved = "";
function Fixture() {
  return <><SlideTextToolbar enabled /><SlideEditableText as="div" className="slide-whole-editor" html={initial}
    onSave={element => { saved = sanitizeSlideHtml(element.innerHTML); localStorage.setItem("format-painter-test", saved); }} />
    <SlideEditableText as="div" html="<p>Another editor destination</p>" onSave={element => localStorage.setItem("format-painter-other", sanitizeSlideHtml(element.innerHTML))} /></>;
}
function button(label: string) {
  const result = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  assert(result, `${label} exists`);
  return result;
}
function textNode(text: string): Text {
  const editor = document.querySelector<HTMLElement>('[data-slide-rich="true"]')!;
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) if (walker.currentNode.textContent?.includes(text)) return walker.currentNode as Text;
  throw new Error(`Missing text: ${text}`);
}
async function select(text: string) {
  const editor = document.querySelector<HTMLElement>('[data-slide-rich="true"]')!;
  editor.focus();
  const node = textNode(text);
  const range = document.createRange();
  const offset = node.textContent!.indexOf(text);
  range.setStart(node, offset);
  range.setEnd(node, offset + text.length);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
  await tick();
}
async function copy(text: string) {
  await select(text);
  flushSync(() => button("Format painter").click());
  await tick();
  assert(button("Format painter").getAttribute("aria-pressed") === "true", "Painter arms after copying source");
}
async function paint(text: string) {
  await select(text);
  textNode(text).parentElement!.dispatchEvent(new Event("pointerup", { bubbles: true }));
  await tick();
}
async function test() {
  createRoot(document.getElementById("fixture")!).render(<Fixture />);
  await tick();
  if (innerWidth < 600) {
    assert(!document.querySelector('[aria-label="Format painter"]'), "Desktop editing controls stay hidden on phones");
  } else {
    assert(button("Format painter").disabled, "Painter requires a source selection");
    const editor = document.querySelector<HTMLElement>('[data-slide-rich="true"]')!;
    const originalText = editor.textContent;
    await copy("Source formatting");
    // Toolbar interactions must not accidentally paint the source selection.
    button("Font and text options").dispatchEvent(new Event("pointerup", { bubbles: true }));
    await tick();
    assert(button("Format painter").getAttribute("aria-pressed") === "true", "Toolbar pointer events do not apply the painter");
    await paint("target words");
    assert(button("Format painter").getAttribute("aria-pressed") === "false", "Painter applies once");
    let target = textNode("target words").parentElement!;
    const style = getComputedStyle(target);
    assert(style.fontFamily.includes("Georgia") && style.fontSize === "24px", "Font family and exact size are copied");
    assert(style.fontWeight === "700" && style.fontStyle === "italic" && style.textDecorationLine.includes("underline"), "Bold, italic and underline are copied");
    assert(style.color === "rgb(192, 32, 64)" && style.backgroundColor === "rgb(255, 245, 157)", "Explicit text colour and highlight are copied");
    assert(target.closest("h3") && getComputedStyle(target.closest("h3")!).textAlign === "center", "Heading style and paragraph alignment are copied");
    assert(getComputedStyle(textNode("Before ").parentElement!).fontFamily !== style.fontFamily, "Unselected text is not painted");
    assert(editor.textContent === originalText, "Painting never changes the words");
    assert(saved.includes('data-user-color="true"') && saved.includes("Georgia"), "Painted format goes through normal saving");
    flushSync(() => button("Undo").click());
    await tick();
    assert(!getComputedStyle(textNode("target words").parentElement!).fontFamily.includes("Georgia"), "One Undo reverses painting");
    flushSync(() => button("Redo").click());
    await tick();
    assert(getComputedStyle(textNode("target words").parentElement!).fontFamily.includes("Georgia"), "Redo restores painting");
    await copy("Plain source");
    await paint("Remove old bold and underline");
    target = textNode("Remove old bold and underline").parentElement!;
    assert(getComputedStyle(target).fontWeight === getComputedStyle(textNode("Plain source").parentElement!).fontWeight, "Plain source clears target bold");
    assert(!target.closest("u") && !getComputedStyle(target).textDecorationLine.includes("underline"), "Plain source clears target underline");
    await copy("Source formatting");
    await paint("Cell destination");
    assert(editor.querySelectorAll("table td").length === 1 && getComputedStyle(textNode("Cell destination").parentElement!).fontFamily.includes("Georgia"), "Table cell text is painted without damaging table structure");
    await copy("Source formatting");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick();
    assert(button("Format painter").getAttribute("aria-pressed") === "false", "Escape cancels painting");
    await copy("Source formatting");
    const selection = window.getSelection()!;
    const multi = document.createRange();
    multi.setStart(textNode("Remove old bold and underline"), 0);
    multi.setEnd(textNode("Second paragraph"), "Second paragraph".length);
    selection.removeAllRanges();
    selection.addRange(multi);
    editor.dispatchEvent(new Event("pointerup", { bubbles: true }));
    await tick();
    for (const text of ["Remove old bold and underline", "Second paragraph"]) assert(getComputedStyle(textNode(text).parentElement!).fontFamily.includes("Georgia"), "All selected paragraphs receive formatting");
    assert(textNode("Plain source").parentElement!.closest("p"), "An adjacent unselected paragraph retains its block style");
    await copy("Source formatting");
    const other = document.querySelectorAll<HTMLElement>('[data-slide-rich="true"]')[1];
    other.focus();
    const otherRange = document.createRange();
    otherRange.selectNodeContents(other.querySelector("p")!);
    selection.removeAllRanges();
    selection.addRange(otherRange);
    other.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", bubbles: true }));
    await tick();
    assert(other.querySelector("h3") && getComputedStyle(other.querySelector("span")!).fontFamily.includes("Georgia"), "Keyboard-selected text in another editor can receive copied formatting");
    assert(localStorage.getItem("format-painter-other")?.includes("Georgia"), "Cross-editor format painting saves in the destination");
    const persisted = localStorage.getItem("format-painter-test")!;
    editor.blur();
    editor.innerHTML = sanitizeSlideHtml(persisted);
    assert(getComputedStyle(textNode("target words").parentElement!).color === "rgb(192, 32, 64)", "Saved formatting survives sanitization and reloading");
    assert(editor.textContent === originalText, "Words are retained after painting, undo, redo and reload");
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = innerWidth < 600 ? "PASS: desktop format painter stays hidden on phones." : "PASS: format painter fonts, size, emphasis, colour, highlight, paragraph style, partial/multiple paragraphs, table cells, cross-editor keyboard selections, autosave/reload, undo/redo and cancellation.";
}
test().catch(error => { document.body.dataset.result = "failed"; document.getElementById("result")!.textContent = String(error); });
