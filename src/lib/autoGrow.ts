/** Shared "auto-grow" behaviour for free-text `<textarea>` boxes across the
 *  app: the box always resizes to fit its content, so nobody has to notice
 *  a manual resize handle exists (mobile browsers mostly ignore/hide it
 *  anyway, since there's no mouse to drag) or scroll inside a tiny box to
 *  read what they just typed.
 *
 *  Usage: call from a ref callback (so it grows to fit on first mount, e.g.
 *  when re-opening a draft) and from `onInput` (so it grows live as the
 *  person types), and — if the value can also change programmatically
 *  (loading a saved draft, clearing the field, etc.) — from a `useEffect`
 *  keyed on that value.
 *
 *  Pass `maxHeightPx` for boxes that should still scroll internally past a
 *  sensible cap (e.g. a chat compose box) instead of growing without limit. */
export function autoGrowTextarea(el: HTMLTextAreaElement | null, maxHeightPx?: number): void {
  if (!el) return;
  el.style.height = "auto";
  const full = el.scrollHeight;
  const next = maxHeightPx ? Math.min(full, maxHeightPx) : full;
  el.style.height = `${next}px`;
  el.style.overflowY = maxHeightPx && full > maxHeightPx ? "auto" : "hidden";
}
