import { createElement, useLayoutEffect, useRef, type HTMLAttributes } from "react";
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
    if (document.activeElement !== editor && editor.innerHTML !== html) editor.innerHTML = html;
    saved.current = sanitizeSlideHtml(html);
  }, [html]);

  const save = () => {
    const editor = ref.current;
    if (!editor || !(contentEditable === true || contentEditable === "true")) return;
    const next = sanitizeSlideHtml(editor.innerHTML);
    if (next === saved.current) return;
    onSave(editor);
    saved.current = next;
  };

  return createElement(as, {
    ...props,
    ref,
    contentEditable,
    suppressContentEditableWarning: true,
    "data-slide-rich": "true",
    onInput: save,
    onBlur: save,
  });
}
