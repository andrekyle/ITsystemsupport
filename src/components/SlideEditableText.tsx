import { createElement, useLayoutEffect, useRef, type ClipboardEvent, type HTMLAttributes, type KeyboardEvent } from "react";
import { sanitizeSlideHtml } from "../lib/slideRichText";

type Props = Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML" | "onInput" | "onBlur"> & {
  as: "div" | "span" | "p" | "th" | "td";
  html: string;
  onSave: (element: HTMLElement) => void;
};

/** Save each input without letting React replace the focused editor's DOM/caret. */
export function SlideEditableText({ as, html, onSave, contentEditable = true, onKeyDown, ...props }: Props) {
  const ref = useRef<HTMLElement>(null);
  const saved = useRef("");
  useLayoutEffect(() => {
    const editor = ref.current;
    if (!editor) return;
    const editing = contentEditable === true || contentEditable === "true";
    if ((!editing || document.activeElement !== editor) && editor.innerHTML !== html) editor.innerHTML = html;
    saved.current = sanitizeSlideHtml(html);
  }, [html, contentEditable]);

  const save = () => {
    const editor = ref.current;
    if (!editor || !(contentEditable === true || contentEditable === "true")) return;
    const next = sanitizeSlideHtml(editor.innerHTML);
    if (next === saved.current) return;
    onSave(editor);
    saved.current = next;
  };

  const paste = (event: ClipboardEvent<HTMLElement>) => {
    if (!(contentEditable === true || contentEditable === "true")) return;
    event.preventDefault();
    // Insert plain text through the browser's active editing context. It then
    // inherits the caret's current font, size, weight, colour and block/list
    // style instead of importing inconsistent formatting from Word or a site.
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    save();
  };

  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !(contentEditable === true || contentEditable === "true")) return;
    if (event.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection?.isCollapsed || !selection.rangeCount) return;
      const caret = selection.getRangeAt(0);
      const node = caret.startContainer;
      const element = node instanceof Element ? node : node.parentElement;
      const block = element?.closest<HTMLElement>("p,li,blockquote,h1,h2,h3,h4,div");
      if (!block || block === event.currentTarget || !event.currentTarget.contains(block)) return;
      const before = document.createRange();
      before.selectNodeContents(block);
      before.setEnd(caret.startContainer, caret.startOffset);
      if (before.toString().length > 0) return;
      const indentWrapper = block.closest<HTMLElement>("blockquote");
      const hasManualIndent = Boolean(block.style.marginLeft || block.style.textIndent);
      if (!indentWrapper && !hasManualIndent) return;
      event.preventDefault();
      if (hasManualIndent) {
        block.style.marginLeft = "";
        block.style.textIndent = "";
        block.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        document.execCommand("outdent");
      }
      save();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    if (event.shiftKey) {
      document.execCommand("outdent");
    } else {
      // Indent the containing paragraph so wrapped lines share the same left
      // edge, matching a word processor rather than padding only line one.
      document.execCommand("indent");
    }
    save();
  };

  return createElement(as, {
    ...props,
    ref,
    contentEditable,
    suppressContentEditableWarning: true,
    "data-slide-rich": "true",
    onKeyDown: keyDown,
    onPaste: paste,
    onInput: save,
    onBlur: save,
  });
}
