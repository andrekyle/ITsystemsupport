import { createRoot } from "react-dom/client";
import { UnitContentEditor } from "../src/components/UnitContentEditor";
import "../src/styles.css";
import "../src/components/unit-builder.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function test() {
  const text = "Long editable content. ".repeat(200);
  createRoot(document.getElementById("fixture")!).render(
    <div className="unit-builder"><div className="unit-builder-panel" style={{ width: 300 }}>
      <UnitContentEditor active={false} defaultOpen value={{
        heading: '<!--slide-rich--><span style="color:blue">Network&nbsp; Support</span>',
        q: text,
      }} onChange={() => {}} />
    </div></div>);
  await new Promise(resolve => setTimeout(resolve, 100));
  const group = document.querySelector<HTMLElement>(".unit-editor-group")!;
  assert(group.querySelector("summary")?.textContent?.endsWith(": Network Support") &&
    !group.querySelector("summary")?.textContent?.includes("<span"),
    "Heading displays plain text rather than HTML");
  for (const theme of ["light", "dark"]) {
    document.documentElement.dataset.theme = theme;
    const textarea = document.querySelectorAll("textarea")[1];
    const style = getComputedStyle(textarea);
    assert(style.fontSize === "12px" && style.borderTopWidth === "0px" &&
      style.borderRadius === "0px", "Fields are compact and borderless in both themes");
    assert(style.backgroundColor === "rgba(0, 0, 0, 0)", "Fields have no dark boxed background");
    assert(textarea.getBoundingClientRect().width >= 298, "Fields use the full panel width");
    assert(parseFloat(getComputedStyle(group).paddingLeft) === 0, "Nested groups do not waste width with indentation");
    const heading = document.querySelector("textarea")!;
    assert(heading.getBoundingClientRect().height <= 50, "Short heading does not waste vertical space");
    assert(getComputedStyle(group).borderTopWidth === "0px", "Groups are borderless");
    assert(style.resize === "vertical" && style.overflowY === "auto", "Fields resize and scroll");
    textarea.scrollTop = 100;
    assert(textarea.scrollTop > 0, "Long content actually scrolls");
    const height = textarea.getBoundingClientRect().height;
    textarea.style.height = `${height + 100}px`;
    assert(textarea.getBoundingClientRect().height >= height + 99, "Field can grow vertically");
  }
  document.body.dataset.result = "passed";
  document.getElementById("result")!.textContent = "PASS: plain headings, compact borderless fields and scrollable resizable text";
}
test().catch(error => {
  document.body.dataset.result = "failed";
  document.getElementById("result")!.textContent = String(error);
});
