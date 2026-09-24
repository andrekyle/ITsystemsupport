const PREFIX = "<!--slide-rich-->";
export const isRichText = (text: string) => text.startsWith(PREFIX);

/** Only retain formatting markup; never persist pasted scripts, handlers or URLs. */
export function sanitizeSlideHtml(html: string): string {
  const source = document.createElement("template");
  source.innerHTML = html;
  const allowed = new Set(["SPAN", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SUB", "SUP", "BR", "P", "DIV", "UL", "OL", "LI", "BLOCKQUOTE", "FONT", "H1", "H2", "H3", "H4", "TABLE", "COLGROUP", "COL", "THEAD", "TBODY", "TR", "TH", "TD", "IMG"]);
  const styles = ["font-family", "font-size", "font-weight", "font-style", "text-decoration", "color", "background-color", "text-align", "line-height", "letter-spacing", "margin-left", "margin-right", "margin-top", "margin-bottom", "vertical-align", "width", "min-width", "max-width", "height", "min-height", "object-fit", "object-position", "float", "display"];
  function clean(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    const fragment = document.createDocumentFragment();
    if (!(node instanceof HTMLElement) || ["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(node.tagName)) return fragment;
    if (node.tagName === "IMG" && !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(node.getAttribute("src") ?? "")) return fragment;
    const out = allowed.has(node.tagName) ? document.createElement(node.tagName === "FONT" ? "span" : node.tagName.toLowerCase()) : fragment;
    if (out instanceof HTMLElement) {
      const classes = Array.from(node.classList).filter(c => ["section-title", "lesson-p", "lesson-subsection", "lesson-subheading", "lesson-point-group", "lesson-point-lead", "lesson-inferred-list", "lesson-numlist", "num", "data", "lesson-table", "lesson-table-scroll", "card-grid", "lesson-cards", "card", "lesson-card", "t", "d", "lesson-example"].includes(c));
      if (classes.length) out.className = classes.join(" ");
      if (node.tagName === "TH" && ["col", "row"].includes(node.getAttribute("scope") ?? "")) out.setAttribute("scope", node.getAttribute("scope")!);
      if (node.tagName === "IMG") {
        const src = node.getAttribute("src") ?? "";
        out.setAttribute("src", src);
        out.setAttribute("alt", node.getAttribute("alt")?.slice(0, 300) ?? "Lesson image");
        out.setAttribute("draggable", "false");
        if (node.dataset.cropped === "true") out.dataset.cropped = "true";
      }
      if (node.tagName === "TD" || node.tagName === "TH") {
        const colspan = Number(node.getAttribute("colspan"));
        const rowspan = Number(node.getAttribute("rowspan"));
        if (Number.isInteger(colspan) && colspan > 1 && colspan <= 20) out.setAttribute("colspan", String(colspan));
        if (Number.isInteger(rowspan) && rowspan > 1 && rowspan <= 100) out.setAttribute("rowspan", String(rowspan));
      }
      for (const prop of styles) {
        const value = node.style.getPropertyValue(prop);
        if (value && !/url\s*\(|expression|var\s*\(/i.test(value)) out.style.setProperty(prop, value);
      }
      if (node.tagName === "FONT") {
        out.style.fontFamily = node.getAttribute("face") ?? "";
        out.style.color = node.getAttribute("color") ?? "";
        const sizes = ["", "10px", "13px", "16px", "18px", "24px", "32px", "48px"];
        out.style.fontSize = sizes[Number(node.getAttribute("size"))] ?? "";
      }
    }
    for (const child of Array.from(node.childNodes)) out.appendChild(clean(child));
    return out;
  }
  const result = document.createElement("div");
  for (const child of Array.from(source.content.childNodes)) result.appendChild(clean(child));
  return result.innerHTML;
}
export function richTextHtml(text: string): string {
  return isRichText(text) ? sanitizeSlideHtml(text.slice(PREFIX.length)) : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}
export function saveRichText(el: HTMLElement): string {
  return PREFIX + sanitizeSlideHtml(el.innerHTML);
}

export function plainSlideText(text: string): string {
  if (!isRichText(text)) return text;
  const el = document.createElement("div");
  el.innerHTML = richTextHtml(text).replace(/<br\s*\/?>|<\/(?:div|p|li|h1|h2|h3|h4|tr)>/gi, "\n").replace(/<\/(?:td|th)>/gi, " ");
  return el.textContent ?? "";
}
