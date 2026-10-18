import { createElement, useLayoutEffect, useRef, type ClipboardEvent, type HTMLAttributes, type KeyboardEvent } from "react";
import { plainTextToSlideHtml, sanitizeSlideHtml } from "../lib/slideRichText";
import { usePhoneView } from "./usePhoneView";

type Props = Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML" | "onInput" | "onBlur"> & {
  as: "div" | "span" | "p" | "th" | "td";
  html: string;
  onSave: (element: HTMLElement) => void;
};

/** Save each input without letting React replace the focused editor's DOM/caret. */
export function SlideEditableText({ as, html, onSave, contentEditable: requestedEditable = true, onKeyDown, ...props }: Props) {
  const phone = usePhoneView();
  const contentEditable = !phone && requestedEditable;
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

  const normalizeDefaultTypography = (block: HTMLElement) => {
    block.classList.add("slide-editor-default-text");
    if (block.tagName === "P") block.classList.add("lesson-p");
    [block, ...Array.from(block.querySelectorAll<HTMLElement>("*"))].forEach(element => {
      element.style.removeProperty("font-family");
      element.style.removeProperty("font-size");
      element.style.removeProperty("color");
      element.removeAttribute("face");
      element.removeAttribute("size");
      element.removeAttribute("color");
      delete element.dataset.userColor;
    });
  };

  const paste = (event: ClipboardEvent<HTMLElement>) => {
    if (!(contentEditable === true || contentEditable === "true")) return;
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    if (event.currentTarget.classList.contains("slide-whole-editor")) {
      const pasted = document.createElement("template");
      pasted.innerHTML = plainTextToSlideHtml(text);
      pasted.content.querySelectorAll<HTMLElement>("p,ul,ol,li").forEach(normalizeDefaultTypography);
      if (pasted.content.childNodes.length) {
        document.execCommand("insertHTML", false, pasted.innerHTML);
        save();
      }
      return;
    }
    if (/\r?\n/.test(text)) document.execCommand("insertHTML", false, plainTextToSlideHtml(text));
    else document.execCommand("insertText", false, text);
    save();
  };

  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !(contentEditable === true || contentEditable === "true")) return;
    if (event.key === "Enter" && !event.shiftKey) {
      const selection = window.getSelection();
      const node = selection?.anchorNode;
      const element = node instanceof Element ? node : node?.parentElement;
      const heading = element?.closest<HTMLElement>("h1,h2,h3,h4");
      if (heading && event.currentTarget.contains(heading)) {
        event.preventDefault();
        document.execCommand("insertParagraph");
        document.execCommand("formatBlock", false, "p");
        if (event.currentTarget.classList.contains("slide-whole-editor")) {
          const editor = event.currentTarget;
          window.setTimeout(() => {
            const selection = window.getSelection();
            const node = selection?.anchorNode;
            const element = node instanceof Element ? node : node?.parentElement;
            const block = element?.closest<HTMLElement>("p,li,blockquote,div");
            if (block && block !== editor && editor.contains(block)) {
              normalizeDefaultTypography(block);
              save();
            }
          }, 0);
        }
        save();
        return;
      }
      if (event.currentTarget.classList.contains("slide-whole-editor")) {
        const editor = event.currentTarget;
        window.setTimeout(() => {
          const selection = window.getSelection();
          const node = selection?.anchorNode;
          const element = node instanceof Element ? node : node?.parentElement;
          const block = element?.closest<HTMLElement>("p,li,blockquote,div");
          if (block && block !== editor && editor.contains(block)) {
            normalizeDefaultTypography(block);
            save();
          }
        }, 0);
      }
    }
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
    tabIndex: phone ? undefined : props.tabIndex,
    suppressContentEditableWarning: true,
    "data-slide-rich": "true",
    onKeyDown: keyDown,
    onPaste: paste,
    onInput: save,
    onBlur: save,
  });
}
