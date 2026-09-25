import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { Select } from "./Select";
import { SlideEditHistory } from "../lib/slideEditHistory";
import { sanitizeSlideHtml } from "../lib/slideRichText";
import { resizeImageRect, type ResizeCorner } from "../lib/imageGeometry";

const EDITOR_SELECTOR = '[data-slide-rich="true"][contenteditable="true"]';

const commands = [
  ["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"],
  ["strikeThrough", "Strikethrough"], ["subscript", "Subscript"], ["superscript", "Superscript"],
  ["justifyLeft", "Align left"], ["justifyCenter", "Centre"], ["justifyRight", "Align right"], ["justifyFull", "Justify"],
  ["insertUnorderedList", "Bullet list"], ["insertOrderedList", "Numbered list"],
  ["indent", "Indent"], ["outdent", "Outdent"], ["removeFormat", "Clear formatting"],
  ["undo", "Undo"], ["redo", "Redo"], ["selectAll", "Select all"],
];

export function SlideTextToolbar({ enabled, onStoreImage }: { enabled: boolean; onStoreImage?: (dataUrl: string) => Promise<{ id: string; src: string } | null> }) {
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
  const [menu, setMenu] = useState<"text" | "paragraph" | "table" | "image" | null>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<HTMLTableCellElement | null>(null);
  const [imageHeight, setImageHeight] = useState(260);
  const [cropImage, setCropImage] = useState(false);
  const [columnWidth, setColumnWidth] = useState(180);
  const [rowHeight, setRowHeight] = useState(56);
  const imageInput = useRef<HTMLInputElement>(null);
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
    if (!enabled) return;
    let resize: { cell: HTMLTableCellElement; editor: HTMLElement; table: HTMLTableElement; col: HTMLTableColElement; startX: number; startWidth: number; otherWidth: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      const cell = target?.closest<HTMLTableCellElement>(`${EDITOR_SELECTOR} td, ${EDITOR_SELECTOR} th`);
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      if (Math.abs(event.clientX - rect.right) > 7) return;
      const editor = cell.closest<HTMLElement>(EDITOR_SELECTOR);
      const table = cell.closest<HTMLTableElement>("table");
      if (!editor || !table) return;
      event.preventDefault();
      event.stopPropagation();
      setSelectedCell(cell);

      let colgroup = table.querySelector<HTMLTableColElement>("colgroup");
      if (!colgroup) {
        colgroup = document.createElement("colgroup");
        const firstRow = table.rows[0];
        Array.from(firstRow?.cells ?? []).forEach(sourceCell => {
          const col = document.createElement("col");
          col.style.width = `${sourceCell.getBoundingClientRect().width}px`;
          colgroup!.appendChild(col);
        });
        table.prepend(colgroup);
      }
      const columns = Array.from(colgroup.children) as HTMLTableColElement[];
      const col = columns[cell.cellIndex];
      if (!col) return;
      const widths = Array.from(table.rows[0]?.cells ?? []).map(item => item.getBoundingClientRect().width);
      table.style.tableLayout = "fixed";
      table.style.width = `${widths.reduce((sum, value) => sum + value, 0)}px`;
      resize = {
        cell,
        editor,
        table,
        col,
        startX: event.clientX,
        startWidth: rect.width,
        otherWidth: widths.reduce((sum, value, index) => sum + (index === cell.cellIndex ? 0 : value), 0),
      };
      document.body.classList.add("resizing-slide-table-column");
    };
    const pointerMove = (event: PointerEvent) => {
      if (!resize) return;
      event.preventDefault();
      const width = Math.max(48, Math.round(resize.startWidth + event.clientX - resize.startX));
      resize.col.style.width = `${width}px`;
      resize.col.style.minWidth = `${width}px`;
      resize.table.style.width = `${resize.otherWidth + width}px`;
      setColumnWidth(width);
    };
    const finish = () => {
      if (!resize) return;
      const editor = resize.editor;
      resize = null;
      document.body.classList.remove("resizing-slide-table-column");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    };
    document.addEventListener("pointerdown", pointerDown, true);
    document.addEventListener("pointermove", pointerMove, { passive: false });
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
    return () => {
      document.removeEventListener("pointerdown", pointerDown, true);
      document.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
      document.body.classList.remove("resizing-slide-table-column");
    };
  }, [enabled]);
  useEffect(() => {
    if (!selectedImage?.isConnected) { setImageRect(null); return; }
    const measure = () => {
      if (!selectedImage.isConnected) { setImageRect(null); return; }
      const rect = selectedImage.getBoundingClientRect();
      setImageRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(selectedImage);
    window.addEventListener("resize", measure);
    document.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("scroll", measure, true);
    };
  }, [selectedImage]);
  useEffect(() => {
    if (!enabled) return;
    let drag: { image: HTMLImageElement; editor: HTMLElement; startX: number; startY: number; grabX: number; grabY: number; moved: boolean; ghost: HTMLImageElement | null; dropRange: Range | null; frame: number; x: number; y: number } | null = null;
    const inspect = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const editor = target.closest<HTMLElement>(EDITOR_SELECTOR);
      if (!editor) return;
      const image = target.closest("img");
      const cell = target.closest("td,th");
      setSelectedImage(image instanceof HTMLImageElement ? image : null);
      setSelectedCell(cell instanceof HTMLTableCellElement ? cell : null);
      if (image instanceof HTMLImageElement) {
        setImageHeight(Math.round(parseFloat(image.style.height) || image.getBoundingClientRect().height || 260));
        setCropImage(image.dataset.cropped === "true");
        setMenu("image");
      } else if (cell instanceof HTMLTableCellElement) {
        setColumnWidth(Math.round(cell.getBoundingClientRect().width));
        setRowHeight(Math.round(cell.parentElement?.getBoundingClientRect().height ?? 56));
      }
    };
    const rangeAtPoint = (x: number, y: number) => {
      const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null; caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
      let result = doc.caretRangeFromPoint?.(x, y) ?? null;
      if (!result) {
        const position = doc.caretPositionFromPoint?.(x, y);
        if (position) { result = document.createRange(); result.setStart(position.offsetNode, position.offset); result.collapse(true); }
      }
      return result;
    };
    const pointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || !target.closest(EDITOR_SELECTOR)) return;
      const editor = target.closest<HTMLElement>(EDITOR_SELECTOR);
      if (!editor || event.button !== 0) return;
      event.preventDefault();
      target.draggable = false;
      target.setPointerCapture?.(event.pointerId);
      setSelectedImage(target);
      setImageHeight(Math.round(parseFloat(target.style.height) || target.getBoundingClientRect().height || 260));
      setCropImage(target.dataset.cropped === "true");
      setMenu("image");
      const rect = target.getBoundingClientRect();
      drag = { image: target, editor, startX: event.clientX, startY: event.clientY, grabX: event.clientX - rect.left, grabY: event.clientY - rect.top, moved: false, ghost: null, dropRange: null, frame: 0, x: event.clientX, y: event.clientY };
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
      event.preventDefault();
      if (!drag.ghost) {
        const rect = drag.image.getBoundingClientRect();
        drag.ghost = drag.image.cloneNode(true) as HTMLImageElement;
        Object.assign(drag.ghost.style, { position: "fixed", left: "0", top: "0", zIndex: "200", width: `${rect.width}px`, height: `${rect.height}px`, maxWidth: "none", margin: "0", opacity: "0.68", pointerEvents: "none", boxShadow: "0 10px 30px #0008" });
        document.body.appendChild(drag.ghost);
        drag.image.classList.add("is-being-moved");
        document.body.classList.add("moving-slide-image");
      }
      drag.moved = true;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (drag.frame) return;
      drag.frame = requestAnimationFrame(() => {
        if (!drag) return;
        drag.frame = 0;
        drag.ghost!.style.transform = `translate3d(${drag.x - drag.grabX}px, ${drag.y - drag.grabY}px, 0)`;
        const edge = 70;
        const speed = drag.y < edge ? -Math.ceil((edge - drag.y) / 5) : drag.y > innerHeight - edge ? Math.ceil((drag.y - (innerHeight - edge)) / 5) : 0;
        if (speed) window.scrollBy(0, speed);
        const candidate = rangeAtPoint(drag.x, drag.y);
        drag.dropRange = candidate && drag.editor.contains(candidate.startContainer) ? candidate : null;
      });
    };
    const finishDrag = (event: PointerEvent) => {
      if (!drag) return;
      const current = drag;
      if (current.frame) cancelAnimationFrame(current.frame);
      const exactRange = event.type === "pointercancel" ? null : rangeAtPoint(event.clientX, event.clientY);
      const finalRange = exactRange && current.editor.contains(exactRange.startContainer) ? exactRange : current.dropRange;
      if (current.moved && finalRange && event.type !== "pointercancel") {
        // Move the actual flow anchor, not only the painted image. A transform
        // would leave the float exclusion box behind and let text run under it.
        current.image.style.transform = "none";
        current.image.style.transformOrigin = "top left";
        const dropNode = finalRange.startContainer;
        const dropElement = dropNode instanceof Element ? dropNode : dropNode.parentElement;
        const dropBlock = dropElement?.closest<HTMLElement>("p,li,blockquote,h1,h2,h3,h4,div");
        // A float only affects content that follows it in document order. If
        // it is inserted at the pointer's character offset, text earlier on
        // that same first line is laid out before the float and paints across
        // the image. Anchor it at the start of the dropped text block instead
        // so the browser wraps the entire line around the image.
        if (dropBlock && dropBlock !== current.editor && current.editor.contains(dropBlock)) {
          dropBlock.insertBefore(current.image, dropBlock.firstChild);
        } else {
          let topLevel: Node = dropNode;
          while (topLevel.parentNode && topLevel.parentNode !== current.editor) {
            topLevel = topLevel.parentNode;
          }
          if (topLevel.parentNode === current.editor) {
            current.editor.insertBefore(current.image, topLevel);
          } else {
            finalRange.insertNode(current.image);
          }
        }
        const editorRect = current.editor.getBoundingClientRect();
        const imageRect = current.image.getBoundingClientRect();
        const desiredLeft = Math.max(
          0,
          Math.min(
            Math.max(0, editorRect.width - imageRect.width),
            event.clientX - current.grabX - editorRect.left
          )
        );
        const placeLeft = desiredLeft + imageRect.width / 2 <= editorRect.width / 2;
        // Keep the vertical text-flow anchor chosen by the caret range, but
        // preserve the pointer's exact horizontal drop position. Previously
        // every drop was reduced to a binary left/right float, which made the
        // image jump to one of two apparent snap points on release. Percentage
        // spacing also keeps the chosen position proportional on narrower
        // screens.
        const outerSpace = placeLeft
          ? desiredLeft
          : Math.max(0, editorRect.width - desiredLeft - imageRect.width);
        const outerPercent = editorRect.width > 0
          ? Math.min(100, Math.max(0, outerSpace / editorRect.width * 100))
          : 0;
        current.image.style.float = placeLeft ? "left" : "right";
        current.image.style.display = "inline";
        current.image.style.marginTop = "8px";
        current.image.style.marginBottom = "8px";
        current.image.style.marginLeft = placeLeft ? `${outerPercent}%` : "16px";
        current.image.style.marginRight = placeLeft ? "16px" : `${outerPercent}%`;
        const caret = document.createRange();
        caret.setStartAfter(current.image);
        caret.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(caret);
        notifyEditor(current.editor);
      }
      current.ghost?.remove();
      current.image.classList.remove("is-being-moved");
      document.body.classList.remove("moving-slide-image");
      const rect = current.image.getBoundingClientRect();
      setImageRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      drag = null;
    };
    const blockNativeDrag = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement && event.target.closest(EDITOR_SELECTOR)) event.preventDefault();
    };
    document.addEventListener("click", inspect);
    document.addEventListener("pointerdown", pointerDown);
    document.addEventListener("pointermove", pointerMove);
    document.addEventListener("pointerup", finishDrag);
    document.addEventListener("pointercancel", finishDrag);
    document.addEventListener("dragstart", blockNativeDrag);
    return () => {
      document.removeEventListener("click", inspect);
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("pointerup", finishDrag);
      document.removeEventListener("pointercancel", finishDrag);
      document.removeEventListener("dragstart", blockNativeDrag);
      if (drag?.frame) cancelAnimationFrame(drag.frame);
      drag?.ghost?.remove();
      document.body.classList.remove("moving-slide-image");
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
    const saved = range.current;
    const insideEditor = (node: Node) => node === editor || editor.contains(node);
    let restored: Range;
    // Toolbar pointer-down normally leaves the editable DOM untouched. Keep
    // the exact browser range in that case: rebuilding it from text lengths
    // loses the invisible paragraph separators represented by block elements,
    // which shifts a multi-paragraph selection backwards onto the heading and
    // blank line above it.
    if (
      saved.startContainer.isConnected &&
      saved.endContainer.isConnected &&
      insideEditor(saved.startContainer) &&
      insideEditor(saved.endContainer)
    ) {
      restored = saved.cloneRange();
    } else {
      // Saving on blur can replace the editable DOM before a font picker
      // returns. Only then fall back to the text-offset bookmark.
      restored = document.createRange();
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
    const colgroup = `<colgroup>${Array.from({ length: cols }, () => "<col>").join("")}</colgroup>`;
    const headers = Array.from({ length: cols }, () => `<th scope="col"><br></th>`).join("");
    const bodyRows = Array.from({ length: Math.max(1, rows - 1) }, () =>
      `<tr>${Array.from({ length: cols }, () => `<td><br></td>`).join("")}</tr>`
    ).join("");
    return `<div class="lesson-table-scroll"><table class="data lesson-table">${colgroup}<thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table></div><p><br></p>`;
  };
  const insertedLayoutHtml = () => {
    const rows = Math.max(1, Math.min(10, Number(tableRows) || 2));
    const cols = Math.max(1, Math.min(8, Number(tableCols) || 2));
    const colgroup = `<colgroup>${Array.from({ length: cols }, () => "<col>").join("")}</colgroup>`;
    const body = Array.from(
      { length: rows },
      () => `<tr style="height:120px">${Array.from({ length: cols }, () => "<td><p><br></p></td>").join("")}</tr>`
    ).join("");
    return `<table class="slide-layout-grid">${colgroup}<tbody>${body}</tbody></table><p><br></p>`;
  };
  const applyList = (ordered: boolean) => {
    const restored = restoreSelection();
    const selection = restored?.selection;
    if (!restored || !selection?.rangeCount) return;
    const selectedRange = selection.getRangeAt(0).cloneRange();
    const anchorNode = selection.anchorNode;
    const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
    const candidates = Array.from(restored.editor.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,li"));
    // Selection.containsNode(partial=true) follows the browser's actual
    // highlighted range. The former manual boundary comparison had its
    // source/target points reversed and selected the surrounding blocks.
    const selectedBlocks = Array.from(new Set(candidates.filter(element => selectedRange.collapsed
      ? element.contains(anchorNode)
      : selection.containsNode(element, true)).map(element => element.closest<HTMLElement>("li") ?? element)))
      .filter(element => restored.editor.contains(element));
    if (!selectedBlocks.length && anchorElement) {
      const closest = anchorElement.closest<HTMLElement>("li,p,h1,h2,h3,h4");
      if (closest && restored.editor.contains(closest)) selectedBlocks.push(closest);
    }
    if (!selectedBlocks.length) return;

    const selectedLists = Array.from(new Set(selectedBlocks.map(block => block.closest<HTMLOListElement | HTMLUListElement>("ol,ul")).filter((list): list is HTMLOListElement | HTMLUListElement => Boolean(list))));
    const requestedTag = ordered ? "OL" : "UL";
    let firstResult: HTMLElement | null = null;
    let lastResult: HTMLElement | null = null;
    if (selectedLists.length && selectedBlocks.every(block => block.tagName === "LI")) {
      const selectedItems = new Set(selectedBlocks as HTMLLIElement[]);
      selectedLists.forEach(list => {
        const fragment = document.createDocumentFragment();
        let run: HTMLOListElement | HTMLUListElement | null = null;
        const appendRun = (tag: "ol" | "ul") => {
          const next = document.createElement(tag);
          next.className = "slide-editor-list";
          next.setAttribute("style", list.getAttribute("style") ?? "");
          fragment.appendChild(next);
          run = next;
          firstResult ??= next;
          lastResult = next;
        };
        Array.from(list.children).forEach(child => {
          if (!(child instanceof HTMLLIElement)) return;
          const selected = selectedItems.has(child);
          if (selected && list.tagName === requestedTag) {
            const paragraph = document.createElement("p");
            paragraph.className = "lesson-p";
            paragraph.append(...Array.from(child.childNodes));
            fragment.appendChild(paragraph);
            firstResult ??= paragraph;
            lastResult = paragraph;
            run = null;
            return;
          }
          const targetTag = selected ? (ordered ? "ol" : "ul") : list.tagName.toLowerCase() as "ol" | "ul";
          if (!run || run.tagName.toLowerCase() !== targetTag) appendRun(targetTag);
          run!.appendChild(child);
        });
        list.replaceWith(fragment);
      });
    } else {
      let index = 0;
      while (index < selectedBlocks.length) {
        const first = selectedBlocks[index];
        const parent = first.parentNode;
        const group = [first];
        while (index + group.length < selectedBlocks.length) {
          const next = selectedBlocks[index + group.length];
          let sibling = group[group.length - 1].nextSibling;
          while (sibling?.nodeType === Node.TEXT_NODE && !sibling.textContent?.trim()) sibling = sibling.nextSibling;
          if (next.parentNode !== parent || sibling !== next) break;
          group.push(next);
        }
        const sourceStyle = getComputedStyle(first);
        const list = document.createElement(ordered ? "ol" : "ul");
        list.className = "slide-editor-list";
        list.style.fontFamily = sourceStyle.fontFamily;
        list.style.fontSize = sourceStyle.fontSize;
        list.style.fontWeight = sourceStyle.fontWeight;
        list.style.lineHeight = sourceStyle.lineHeight;
        parent?.insertBefore(list, first);
        group.forEach(block => {
          const item = document.createElement("li");
          item.append(...Array.from(block.childNodes));
          list.appendChild(item);
          block.remove();
        });
        firstResult ??= list;
        lastResult = list;
        index += group.length;
      }
    }
    if (firstResult && lastResult) {
      const resultRange = document.createRange();
      resultRange.setStartBefore(firstResult);
      resultRange.setEndAfter(lastResult);
      selection.removeAllRanges();
      selection.addRange(resultRange);
      range.current = resultRange.cloneRange();
    }
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
  const insertLayout = () => {
    const restored = restoreSelection(true);
    if (!restored) return;
    document.execCommand("insertHTML", false, insertedLayoutHtml());
    if (restored.selection?.rangeCount) range.current = restored.selection.getRangeAt(0).cloneRange();
    restored.editor.dispatchEvent(new Event("input", { bubbles: true }));
    setActive(commands.filter(([cmd]) => document.queryCommandState(cmd)).map(([cmd]) => cmd));
  };
  const notifyEditor = (editor: HTMLElement | null = host.current) => editor?.dispatchEvent(new Event("input", { bubbles: true }));
  const imageData = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const source = new Image();
      source.onerror = () => reject(new Error("The image format is not supported."));
      source.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(source.naturalWidth, source.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("The image could not be prepared."));
          return;
        }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        // JPEG has no alpha channel and turns transparent pixels black in
        // some browsers. Keep alpha-capable uploads transparent; JPEG photos
        // still use the smaller compressed representation.
        const preserveAlpha = /^(?:image\/png|image\/webp|image\/gif)$/i.test(file.type);
        resolve(preserveAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82));
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
  const insertImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const restored = restoreSelection(true);
    if (!restored?.selection?.rangeCount) return;
    const img = document.createElement("img");
    const dataUrl = await imageData(file);
    const stored = onStoreImage ? await onStoreImage(dataUrl) : { id: "", src: dataUrl };
    if (!stored) return;
    img.src = stored.src;
    if (stored.id) img.dataset.figureId = stored.id;
    img.alt = file.name.replace(/\.[^.]+$/, "") || "Lesson image";
    img.draggable = false;
    img.style.width = "60%";
    img.style.height = "auto";
    img.style.maxWidth = "100%";
    img.style.display = "inline";
    img.style.float = "left";
    img.style.margin = "8px 16px 8px 0";
    const selectionRange = restored.selection.getRangeAt(0);
    selectionRange.insertNode(img);
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    img.after(paragraph);
    const caret = document.createRange();
    caret.selectNodeContents(paragraph);
    caret.collapse(true);
    restored.selection.removeAllRanges();
    restored.selection.addRange(caret);
    range.current = caret;
    setSelectedImage(img);
    setImageHeight(260);
    setCropImage(false);
    setMenu("image");
    notifyEditor(restored.editor);
  };
  const updateImage = (update: (image: HTMLImageElement) => void) => {
    if (!selectedImage?.isConnected) return;
    update(selectedImage);
    const rect = selectedImage.getBoundingClientRect();
    setImageRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    notifyEditor(selectedImage.closest<HTMLElement>(EDITOR_SELECTOR));
  };
  const beginImageResize = (corner: ResizeCorner) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    const image = selectedImage;
    const editor = image?.closest<HTMLElement>(EDITOR_SELECTOR);
    if (!image || !editor) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const start = image.getBoundingClientRect();
    const editorWidth = Math.max(1, editor.getBoundingClientRect().width);
    const startMarginTop = Number.parseFloat(getComputedStyle(image).marginTop) || 0;
    let frame = 0;
    let latestX = startX;
    let latestY = startY;
    let changed = false;
    document.body.classList.add("resizing-slide-image");
    const move = (pointer: PointerEvent) => {
      pointer.preventDefault();
      latestX = pointer.clientX;
      latestY = pointer.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const next = resizeImageRect(start, latestX - startX, latestY - startY, corner, cropImage, editorWidth);
        if (cropImage) {
          image.style.objectFit = "cover";
          image.dataset.cropped = "true";
        }
        image.style.width = `${next.width}px`;
        image.style.height = `${next.height}px`;
        image.style.maxWidth = "100%";
        image.style.transformOrigin = "top left";
        image.style.transform = "none";
        // Use real float/margin geometry so the text exclusion area moves and
        // resizes with the picture. West handles anchor the right edge; east
        // handles anchor the left edge.
        if (corner.endsWith("e")) {
          image.style.float = "left";
          image.style.marginLeft = "0";
          image.style.marginRight = "16px";
        } else {
          image.style.float = "right";
          image.style.marginLeft = "16px";
          image.style.marginRight = "0";
        }
        image.style.marginTop = `${corner.startsWith("n") ? startMarginTop + start.height - next.height : startMarginTop}px`;
        image.style.marginBottom = "8px";
        setImageHeight(Math.round(next.height));
        const rect = image.getBoundingClientRect();
        setImageRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
        changed = true;
      });
    };
    const end = () => {
      const pendingFrame = frame !== 0;
      document.body.classList.remove("resizing-slide-image");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", end);
      if (pendingFrame) requestAnimationFrame(() => notifyEditor(editor));
      else if (changed) notifyEditor(editor);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
  };
  const updateColumnWidth = (width: number) => {
    const activeCell = selectedCell;
    if (!activeCell?.isConnected) return;
    const index = activeCell.cellIndex;
    const table = activeCell.closest("table");
    if (!table) return;
    let colgroup = table.querySelector("colgroup");
    if (!colgroup) {
      colgroup = document.createElement("colgroup");
      const count = Math.max(...Array.from(table.rows).map(row => row.cells.length));
      Array.from({ length: count }, () => colgroup!.appendChild(document.createElement("col")));
      table.prepend(colgroup);
    }
    const columns = Array.from(colgroup.children) as HTMLTableColElement[];
    while (columns.length <= index) {
      const col = document.createElement("col");
      colgroup.appendChild(col);
      columns.push(col);
    }
    columns[index].style.width = `${width}px`;
    columns[index].style.minWidth = `${width}px`;
    table.style.tableLayout = "fixed";
    table.style.width = `${Array.from(table.rows[0]?.cells ?? []).reduce((sum, cell, cellIndex) => sum + (cellIndex === index ? width : cell.getBoundingClientRect().width), 0)}px`;
    setColumnWidth(width);
    notifyEditor(activeCell.closest<HTMLElement>(EDITOR_SELECTOR));
  };
  const updateRowHeight = (height: number) => {
    const activeCell = selectedCell;
    const row = activeCell?.parentElement;
    if (!(row instanceof HTMLTableRowElement)) return;
    row.style.height = `${height}px`;
    row.style.minHeight = `${height}px`;
    setRowHeight(height);
    notifyEditor(row.closest<HTMLElement>(EDITOR_SELECTOR));
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
  const menuToggle = (kind: "text" | "paragraph" | "table" | "image", label: string, symbol: ReactNode) => <button type="button" className={`slide-tool-menu slide-tool-menu-${kind}`} aria-label={label} title={label}
    aria-expanded={menu === kind} aria-controls={`slide-${kind}-options`} onMouseDown={e => e.preventDefault()}
    onClick={() => setMenu(menu === kind ? null : kind)}><span className="slide-tool-menu-label">{symbol}</span>{kind === "text" && <span className="slide-tool-chevron" aria-hidden="true">⌄</span>}</button>;
  const tableIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M12 4v16M4 12h16" /></svg>;
  const imageIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 18 5-5 3 3 3-4 5 6"/></svg>;
  const paragraphIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11M9 12h8M9 19h11" /><path d="M4 5v14m0-14L2 7m2-2 2 2m-2 12-2-2m2 2 2-2" /></svg>;
  return <div className="slide-text-toolbar" ref={bar} onKeyDown={e => { if (e.key === "Escape") { setMenu(null); host.current?.focus(); } }}>
    <div className="slide-text-controls" role="group" aria-label="Slide text formatting">
      <span className="slide-tool-group">
        {commandButton("undo", "Undo", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12" transform="translate(0 -2)" /></svg>)}
        {commandButton("redo", "Redo", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12" transform="translate(0 -2)" /></svg>)}
      </span>
      <span className="slide-tool-group">
        {commandButton("bold", "Bold", <strong aria-hidden="true">B</strong>)}
        {commandButton("italic", "Italic", <i aria-hidden="true">i</i>)}
        {commandButton("underline", "Underline", <u aria-hidden="true">U</u>)}
        {menuToggle("text", "Font and text options", "A")}
      </span>
      <span className="slide-tool-group">
        {commandButton("justifyLeft", "Align left", alignmentIcon())}
        {commandButton("justifyCenter", "Centre", alignmentIcon(true))}
        {commandButton("insertOrderedList", "Numbered list", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12" /><text x="1" y="7">1</text><text x="1" y="14">2</text><text x="1" y="21">3</text></svg>)}
      </span>
      <span className="slide-tool-group">
        {menuToggle("paragraph", "Paragraph and editing options", paragraphIcon)}
        {menuToggle("table", "Insert table or screen layout", tableIcon)}
        <button type="button" className="slide-tool-icon" disabled={!ready} aria-label="Insert image at cursor" title="Insert image at cursor" onMouseDown={e => e.preventDefault()} onClick={() => imageInput.current?.click()}>{imageIcon}</button>
        {selectedImage && menuToggle("image", "Resize and crop selected image", imageIcon)}
      </span>
    </div>
    <input ref={imageInput} className="slide-image-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => void insertImage(event)} />
    {menu && <div id={`slide-${menu}-options`} className="slide-text-options" role="group" aria-label={menu === "text" ? "Font and text options" : menu === "table" ? "Table options" : menu === "image" ? "Image options" : "Paragraph and editing options"}>
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
        <button type="button" disabled={!ready} onMouseDown={e => e.preventDefault()} onClick={insertLayout}>Split screen</button>
        <label className="slide-tool-range">Column width <input type="number" min="48" max="900" step="1" disabled={!selectedCell} value={columnWidth} onChange={e => updateColumnWidth(Math.max(48, Number(e.target.value) || 48))} /> px</label>
        <label className="slide-tool-range">Row height <input type="number" min="28" max="600" step="1" disabled={!selectedCell} value={rowHeight} onChange={e => updateRowHeight(Math.max(28, Number(e.target.value) || 28))} /> px</label>
        {selectedCell && <small>Sizes apply to the selected cell’s complete column or row.</small>}
      </> : menu === "image" ? <>
        <label><input type="checkbox" checked={cropImage} onChange={e => { const checked = e.target.checked; setCropImage(checked); updateImage(image => { image.dataset.cropped = String(checked); image.style.height = checked ? `${imageHeight}px` : "auto"; image.style.objectFit = checked ? "cover" : "contain"; }); }} /> Crop to frame</label>
        <strong className="slide-image-wrap-label">Text wrapping</strong>
        <button type="button" onClick={() => updateImage(image => { image.style.transform = "none"; image.style.float = "left"; image.style.display = "inline"; image.style.margin = "8px 16px 8px 0"; })}>Wrap text right</button>
        <button type="button" onClick={() => updateImage(image => { image.style.transform = "none"; image.style.float = "none"; image.style.display = "block"; image.style.margin = "12px auto"; })}>No wrap · centre</button>
        <button type="button" onClick={() => updateImage(image => { image.style.transform = "none"; image.style.float = "right"; image.style.display = "inline"; image.style.margin = "8px 0 8px 16px"; })}>Wrap text left</button>
        <button type="button" className="danger" onClick={() => { if (!selectedImage) return; const editor = selectedImage.closest<HTMLElement>(EDITOR_SELECTOR); selectedImage.remove(); setSelectedImage(null); setMenu(null); notifyEditor(editor); }}>Remove image</button>
        <small>Drag the image inside the lesson to move it to another insertion point.</small>
      </> : <>
        <div className="slide-tool-field"><span>Style</span><Select ariaLabel="Paragraph style" disabled={!ready} value="" placeholder="Paragraph style" options={[{value:"p",label:"Normal text"},{value:"h1",label:"Heading 1"},{value:"h2",label:"Heading 2"},{value:"h3",label:"Heading 3"},{value:"h4",label:"Heading 4"}]} onChange={value => run("formatBlock", value)} /></div>
        {commands.filter(([cmd]) => ["justifyRight", "justifyFull", "insertUnorderedList", "indent", "outdent", "selectAll"].includes(cmd)).map(([cmd, label]) => commandButton(cmd, label))}
      </>}
      {!ready && <small>Click or select slide text to start formatting.</small>}
    </div>}
    {selectedImage && imageRect && <div className="slide-image-selection" aria-label="Selected image resize frame" style={{ left: imageRect.left, top: imageRect.top, width: imageRect.width, height: imageRect.height }}>
      {(["nw", "ne", "sw", "se"] as const).map(corner => <button key={corner} type="button" className={`slide-image-handle ${corner}`} aria-label={`Resize image from ${corner} corner`} onPointerDown={beginImageResize(corner)} />)}
    </div>}
  </div>;
}
