import { createElement, useLayoutEffect, useRef, type ClipboardEvent, type HTMLAttributes } from "react";
import { sanitizeSlideHtml } from "../lib/slideRichText";

type Props = Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML" | "onInput" | "onBlur"> & {
  as: "div" | "span" | "p" | "th" | "td";
  html: string;
  onSave: (element: HTMLElement) => void;
};

/** Save each input without letting React replace the focused editor's DOM/caret. */
export function SlideEditableText({ as, html, onSave, contentEditable = true, ...props }: Props) {
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

  return createElement(as, {
    ...props,
    ref,
    contentEditable,
    suppressContentEditableWarning: true,
    "data-slide-rich": "true",
    onPaste: paste,
    onInput: save,
    onBlur: save,
  });
}
