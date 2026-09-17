import { useEffect, useRef, useState, type ReactNode } from "react";

import { Select } from "./Select";
import { SlideEditHistory } from "../lib/slideEditHistory";
import { sanitizeSlideHtml } from "../lib/slideRichText";

const EDITOR_SELECTOR = '[data-slide-rich="true"][contenteditable="true"]';

const commands = [
  ["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"],
  ["strikeThrough", "Strikethrough"], ["subscript", "Subscript"], ["superscript", "Superscript"],
  ["justifyLeft", "Align left"], ["justifyCenter", "Centre"], ["justifyRight", "Align right"], ["justifyFull", "Justify"],
  ["insertUnorderedList", "Bullet list"], ["insertOrderedList", "Numbered list"],
  ["indent", "Indent"], ["outdent", "Outdent"], ["removeFormat", "Clear formatting"],
  ["undo", "Undo"], ["redo", "Redo"], ["selectAll", "Select all"],
];

export function SlideTextToolbar({ enabled }: { enabled: boolean }) {
  const range = useRef<Range | null>(null);
  const host = useRef<HTMLElement | null>(null);
  const bookmark = useRef({ start: 0, end: 0 });
  const bar = useRef<HTMLDivElement>(null);
  const history = useRef(new SlideEditHistory());
  const baselines = useRef(new Map<number, string>());
  const replaying = useRef(false);
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const [font, setFont] = useState("");
  const [textColour, setTextColour] = useState("#808080");
  const [highlightColour, setHighlightColour] = useState("#fff59d");
  const [size, setSize] = useState("");
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const [menu, setMenu] = useState<"text" | "paragraph" | "table" | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const refreshHistory = () => setHistoryCounts({ undo: history.current.undoCount, redo: history.current.redoCount });
  const replay = (direction: "undo" | "redo") => {
    replaying.current = true;
    try {
      const edit = history.current[direction]();
      if (!edit) return;
      const editor = document.querySelectorAll<HTMLElement>(EDITOR_SELECTOR)[edit.field];
      if (!editor) {
        history.current[direction === "undo" ? "redo" : "undo"]();
        return;
      }
      editor.focus();
      editor.innerHTML = direction === "undo" ? edit.before : edit.after;
      baselines.current.set(edit.field, sanitizeSlideHtml(editor.innerHTML));
      // Use the same blur save path as typed and formatted text, then return
      // the caret to this field so the next keystroke continues editing it.
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.blur();
      editor.focus();
      const caret = document.createRange();
      caret.selectNodeContents(editor);
      caret.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(caret);
      host.current = editor;
      range.current = caret;
      const length = editor.textContent?.length ?? 0;
      bookmark.current = { start: length, end: length };
      setReady(true);
      setActive(commands.filter(([cmd]) => document.queryCommandState(cmd)).map(([cmd]) => cmd));
    } finally {
      replaying.current = false;
      refreshHistory();
    }
  };
  useEffect(() => {
    if (!enabled) return;
    const editors = () => Array.from(document.querySelectorAll<HTMLElement>(EDITOR_SELECTOR));
    editors().forEach((editor, index) => baselines.current.set(index, sanitizeSlideHtml(editor.innerHTML)));
    const targetEditor = (event: Event) => event.target instanceof Element ? event.target.closest<HTMLElement>(EDITOR_SELECTOR) : null;
    const baseline = (event: Event) => {
      const editor = targetEditor(event);
      if (!editor || replaying.current) return;
      baselines.current.set(editors().indexOf(editor), sanitizeSlideHtml(editor.innerHTML));
    };
    const record = (event: Event) => {
      const editor = targetEditor(event);
      if (!editor || replaying.current) return;
      const field = editors().indexOf(editor);
      const after = sanitizeSlideHtml(editor.innerHTML);
      const before = baselines.current.get(field) ?? after;
      history.current.record({ field, before, after });
      baselines.current.set(field, after);
      refreshHistory();
    };
    const onBeforeInput = (event: Event) => {
      if (!targetEditor(event)) return;
      const type = (event as InputEvent).inputType;
      if (type === "historyUndo" || type === "historyRedo") {
        event.preventDefault();
        replay(type === "historyUndo" ? "undo" : "redo");
      } else baseline(event);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (!targetEditor(event) && !bar.current?.contains(event.target as Node)) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      event.preventDefault();
      event.stopPropagation();
      replay(key === "y" || event.shiftKey ? "redo" : "undo");
    };
    document.addEventListener("focusin", baseline);
    document.addEventListener("beforeinput", onBeforeInput, true);
    document.addEventListener("input", record);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("focusin", baseline);
      document.removeEventListener("beforeinput", onBeforeInput, true);
      document.removeEventListener("input", record);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) {
      setMenu(null);
      setReady(false);
      host.current = null;
      range.current = null;
      return;
    }
    const remember = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const node = selection.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const editor = el?.closest<HTMLElement>(EDITOR_SELECTOR);
      if (editor && editor.contains(selection.focusNode)) {
        host.current = editor;
        range.current = selection.getRangeAt(0).cloneRange();
        const before = range.current.cloneRange();
        before.selectNodeContents(editor);
        before.setEnd(range.current.startContainer, range.current.startOffset);
        bookmark.current = { start: before.toString().length, end: before.toString().length + range.current.toString().length };
        setReady(true);
        setActive(commands.filter(([cmd]) => document.queryCommandState(cmd)).map(([cmd]) => cmd));
      } else if (!bar.current?.contains(document.activeElement)) {
        host.current = null;
        range.current = null;
        setReady(false);
      }
    };
    document.addEventListener("selectionchange", remember);
    return () => document.removeEventListener("selectionchange", remember);
  }, [enabled]);
  if (!enabled) return null;
  const restoreSelection = (collapseToEnd = false) => {
    const editor = host.current;
    if (!editor?.isConnected || !range.current) return null;
    // Saving on blur can replace the editable DOM before a font picker returns.
    // Restore by text offsets so formatting still applies to the selected words.
    const restored = document.createRange();
    restored.selectNodeContents(editor);
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let started = false;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const length = node.textContent?.length ?? 0;
      if (!started && bookmark.current.start <= offset + length) {
        restored.setStart(node, Math.max(0, bookmark.current.start - offset));
        started = true;
      }
      if (bookmark.current.end <= offset + length) {
        restored.setEnd(node, Math.max(0, bookmark.current.end - offset));
        break;
      }
      offset += length;
    }
    editor.focus();
    if (collapseToEnd) restored.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(restored);
    return { editor, selection };
  };
  const insertedTableHtml = () => {
    const rows = Math.max(1, Math.min(20, Number(tableRows) || 3));
    const cols = Math.max(1, Math.min(12, Number(tableCols) || 3));
    const headers = Array.from({ length: cols }, (_, index) => `<th scope="col">Heading ${index + 1}</th>`).join("");
    const bodyRows = Array.from({ length: Math.max(1, rows - 1) }, (_, rowIndex) =>
      `<tr>${Array.from({ length: cols }, (_, colIndex) => `<td>Row ${rowIndex + 1}, column ${colIndex + 1}</td>`).join("")}</tr>`
    ).join("");
    return `<div class="lesson-table-scroll"><table class="data lesson-table"><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table></div><p><br></p>`;
  };
  const applyList = (ordered: boolean) => {
    const restored = restoreSelection();
    if (!restored) return;
    const currentSelection = restored.selection;
    if (!currentSelection?.rangeCount) return;
    const currentRange = currentSelection.getRangeAt(0);
    if (!restored.editor.contains(currentRange.commonAncestorContainer)) return;
    if (currentRange.collapsed) {
      document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList", false);
      if (restored.selection?.rangeCount) range.current = restored.selection.getRangeAt(0).cloneRange();
      restored.editor.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    const list = document.createElement(ordered ? "ol" : "ul");
    list.className = "lesson-inferred-list";
    const fragment = currentRange.extractContents();
    if (!fragment.textContent?.trim() && !fragment.querySelector("img, table, br")) return;
    // Keep the extracted fragment intact. Looking at fragment.children here can
    // promote an entire paragraph and accidentally include text outside the
    // user's selection.
    const item = document.createElement("li");
    item.appendChild(fragment);
    list.appendChild(item);
    currentRange.insertNode(list);
    const caret = document.createRange();
    caret.selectNodeContents(list.lastElementChild ?? list);
    caret.collapse(false);
    const caretSelection = window.getSelection();
    caretSelection?.removeAllRanges();
    caretSelection?.addRange(caret);
    range.current = caret;
    restored.editor.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const insertTable = () => {
    const restored = restoreSelection(true);
    if (!restored) return;
    document.execCommand("insertHTML", false, insertedTableHtml());
    if (restored.selection?.rangeCount) range.current = restored.selection.getRangeAt(0).cloneRange();
    restored.editor.dispatchEvent(new Event("input", { bubbles: true }));
    setActive(commands.filter(([cmd]) => document.queryCommandState(cmd)).map(([cmd]) => cmd));
  };
  const run = (command: string, value?: string) => {
    if (command === "undo" || command === "redo") { replay(command); return; }
    if (command === "insertUnorderedList" || command === "insertOrderedList") {
      applyList(command === "insertOrderedList");
      setActive(commands.filter(([cmd]) => document.queryCommandState(cmd)).map(([cmd]) => cmd));
      return;
    }
    const restored = restoreSelection();
    if (!restored) return;
    document.execCommand("styleWithCSS", false, "true");
    if (command === "selectAll") {
      const all = document.createRange(); all.selectNodeContents(restored.editor);
      restored.selection?.removeAllRanges(); restored.selection?.addRange(all);
    } else document.execCommand(command, false, value);
    if (restored.selection?.rangeCount) range.current = restored.selection.getRangeAt(0).cloneRange();
    restored.editor.dispatchEvent(new Event("input", { bubbles: true }));
    setActive(commands.filter(([cmd]) => document.queryCommandState(cmd)).map(([cmd]) => cmd));
  };
  const commandButton = (cmd: string, label: string, icon?: ReactNode) => (
    <button key={cmd} type="button" className={icon ? "slide-tool-icon" : undefined} disabled={cmd === "undo" ? historyCounts.undo === 0 : cmd === "redo" ? historyCounts.redo === 0 : !ready} aria-label={label} aria-pressed={cmd === "undo" || cmd === "redo" ? undefined : active.includes(cmd)} title={cmd === "undo" || cmd === "redo" ? `${label} (${historyCounts[cmd]} of 10 available)` : label}
      onMouseDown={e => e.preventDefault()} onClick={() => run(cmd)}>{icon ?? label}</button>
  );
  const alignmentIcon = (center = false) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={center ? "M3 5h18M6 11h12M9 17h6" : "M3 5h18M3 11h12M3 17h6"} /></svg>;
  const menuToggle = (kind: "text" | "paragraph" | "table", label: string, symbol: string) => <button type="button" aria-label={label} title={label}
    aria-expanded={menu === kind} aria-controls={`slide-${kind}-options`} onMouseDown={e => e.preventDefault()}
    onClick={() => setMenu(menu === kind ? null : kind)}><span>{symbol}</span><span className="slide-tool-dots" aria-hidden="true">&#8942;</span></button>;
  return <div className="slide-text-toolbar" ref={bar} onKeyDown={e => { if (e.key === "Escape") { setMenu(null); host.current?.focus(); } }}>
    <div className="slide-text-controls" role="group" aria-label="Slide text formatting">
      {commandButton("undo", "Undo", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12" transform="translate(0 -2)" /></svg>)}
      {commandButton("redo", "Redo", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12" transform="translate(0 -2)" /></svg>)}
      {commandButton("bold", "Bold", <strong aria-hidden="true">B</strong>)}
      {commandButton("italic", "Italic", <i aria-hidden="true">i</i>)}
      {commandButton("underline", "Underline", <u aria-hidden="true">U</u>)}
      {menuToggle("text", "Font and text options", "A")}
      {commandButton("justifyLeft", "Align left", alignmentIcon())}
      {commandButton("justifyCenter", "Centre", alignmentIcon(true))}
      {commandButton("insertOrderedList", "Numbered list", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12" /><text x="1" y="7">1</text><text x="1" y="14">2</text><text x="1" y="21">3</text></svg>)}
      {menuToggle("table", "Table", "Table")}
      {menuToggle("paragraph", "Paragraph and editing options", "\u00b6")}
    </div>
    {menu && <div id={`slide-${menu}-options`} className="slide-text-options" role="group" aria-label={menu === "text" ? "Font and text options" : menu === "table" ? "Table options" : "Paragraph and editing options"}>
      {menu === "text" ? <>
        <div className="slide-tool-field"><span>Font</span><Select ariaLabel="Font" disabled={!ready} placeholder="Choose font" value={font} options={["Arial", "Verdana", "Georgia", "Times New Roman", "Courier New", "Tahoma", "Trebuchet MS"].map(value => ({ value, label: value }))} onChange={value => { setFont(value); run("fontName", value); }} /></div>
        <div className="slide-tool-field"><span>Size</span><Select ariaLabel="Font size" disabled={!ready} placeholder="Choose size" value={size} options={[10, 13, 16, 18, 24, 32, 48].map((value, i) => ({ value: String(i + 1), label: `${value} px` }))} onChange={value => { setSize(value); run("fontSize", value); }} /></div>
        <label className="slide-tool-colour" title="Text colour" aria-disabled={!ready}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17 12 3l6 14M8 12h8" /><path d="M3 21h18" style={{ stroke: textColour, strokeWidth: 3 }} /></svg>
          <input aria-label="Text colour" disabled={!ready} type="color" value={textColour} onChange={e => { setTextColour(e.target.value); run("foreColor", e.target.value); }} />
        </label>
        <label className="slide-tool-colour" title="Highlight" aria-disabled={!ready}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 13 9-10 4 4-10 9-3-3Zm0 0-3 5h5l1-2M3 21h18" /><path d="M3 21h18" style={{ stroke: highlightColour, strokeWidth: 3 }} /></svg>
          <input aria-label="Highlight" disabled={!ready} type="color" value={highlightColour} onChange={e => { setHighlightColour(e.target.value); run("hiliteColor", e.target.value); }} />
        </label>
        {commandButton("strikeThrough", "Strikethrough", <span aria-hidden="true" style={{ textDecoration: "line-through" }}>S</span>)}
        {commandButton("subscript", "Subscript", <span aria-hidden="true">x<sub>2</sub></span>)}
        {commandButton("superscript", "Superscript", <span aria-hidden="true">x<sup>2</sup></span>)}
        {commandButton("removeFormat", "Clear formatting", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h13M11 4l-4 15m5-3 5-5 5 5-5 5h-3l-4-4 2-1Zm1-1 5 5M12 21h10" /></svg>)}
      </> : menu === "table" ? <>
        <div className="slide-tool-field"><span>Rows</span><Select ariaLabel="Table rows" disabled={!ready} value={tableRows} options={Array.from({ length: 10 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))} onChange={setTableRows} /></div>
        <div className="slide-tool-field"><span>Columns</span><Select ariaLabel="Table columns" disabled={!ready} value={tableCols} options={Array.from({ length: 8 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))} onChange={setTableCols} /></div>
        <button type="button" disabled={!ready} onMouseDown={e => e.preventDefault()} onClick={insertTable}>Insert table</button>
      </> : <>
        {commands.filter(([cmd]) => ["justifyRight", "justifyFull", "insertUnorderedList", "indent", "outdent", "selectAll"].includes(cmd)).map(([cmd, label]) => commandButton(cmd, label))}
      </>}
      {!ready && <small>Click or select slide text to start formatting.</small>}
    </div>}
  </div>;
}
