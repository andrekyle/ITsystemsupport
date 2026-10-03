const PREFIX = "<!--slide-rich-->";
export const isRichText = (text: string) => text.startsWith(PREFIX);

const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Convert plain Word/web clipboard text into predictable semantic blocks.
 * Source fonts and spacing are deliberately discarded. */
export function plainTextToSlideHtml(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").split("\n");
  const html: string[] = [];
  let listTag: "ol" | "ul" | "" = "";
  let listItems: string[] = [];
  const flushList = () => {
    if (!listTag) return;
    html.push(`<${listTag} class="slide-editor-list">${listItems.map(item => `<li>${escapeText(item)}</li>`).join("")}</${listTag}>`);
    listTag = "";
    listItems = [];
  };
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p class="lesson-p">${escapeText(paragraph.join(" ").replace(/\s+/g, " ").trim())}</p>`);
    paragraph = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    const numbered = line.match(/^\d+(?:\.\d+)*[.)]\s+(.+)$/);
    const bullet = line.match(/^[•·*+-]\s+(.+)$/);
    if (numbered || bullet) {
      flushParagraph();
      const tag = numbered ? "ol" : "ul";
      if (listTag !== tag) { flushList(); listTag = tag; }
      listItems.push((numbered?.[1] ?? bullet?.[1] ?? "").trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph(); flushList();
  return html.join("");
}

/** Only retain formatting markup; never persist pasted scripts, handlers or URLs. */
export function sanitizeSlideHtml(html: string): string {
  const source = document.createElement("template");
  source.innerHTML = html;
  const allowed = new Set(["SPAN", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SUB", "SUP", "BR", "P", "DIV", "UL", "OL", "LI", "BLOCKQUOTE", "FONT", "H1", "H2", "H3", "H4", "TABLE", "COLGROUP", "COL", "THEAD", "TBODY", "TR", "TH", "TD", "IMG"]);
  const styles = ["font-family", "font-size", "font-weight", "font-style", "text-decoration", "color", "background-color", "text-align", "text-indent", "line-height", "letter-spacing", "margin-left", "margin-right", "margin-top", "margin-bottom", "vertical-align", "width", "min-width", "max-width", "height", "min-height", "table-layout", "object-fit", "object-position", "float", "display", "transform", "transform-origin"];
  function clean(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    const fragment = document.createDocumentFragment();
    if (!(node instanceof HTMLElement) || ["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(node.tagName)) return fragment;
    const figureId = node.tagName === "IMG" ? node.getAttribute("data-figure-id") ?? "" : "";
    const imageSrc = node.tagName === "IMG" ? node.getAttribute("src") ?? "" : "";
    if (node.tagName === "IMG" && !/^[\w.-]{1,180}$/.test(figureId) && !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(imageSrc)) return fragment;
    const out = allowed.has(node.tagName) ? document.createElement(node.tagName === "FONT" ? "span" : node.tagName.toLowerCase()) : fragment;
    if (out instanceof HTMLElement) {
      const classes = Array.from(node.classList).filter(c => ["section-title", "lesson-p", "lesson-subsection", "lesson-subheading", "lesson-point-group", "lesson-point-lead", "lesson-inferred-list", "lesson-numlist", "slide-editor-list", "slide-layout-grid", "num", "data", "lesson-table", "lesson-table-scroll", "card-grid", "lesson-cards", "card", "lesson-card", "t", "d", "lesson-example"].includes(c));
      if (classes.length) out.className = classes.join(" ");
      if (node.tagName === "TH" && ["col", "row"].includes(node.getAttribute("scope") ?? "")) out.setAttribute("scope", node.getAttribute("scope")!);
      if (node.tagName === "IMG") {
        if (figureId) out.setAttribute("data-figure-id", figureId);
        if (/^(?:data:image\/(?:png|jpe?g|webp|gif);base64,|https:\/\/)/i.test(imageSrc)) out.setAttribute("src", imageSrc);
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
  if (isRichText(text)) return sanitizeSlideHtml(text.slice(PREFIX.length));
  let plain = text.trim();
  // Repair legacy one-cell Markdown tables that were saved as visible text.
  // Example: | Dear John,<br>I am writing ... | | --- |
  const flattenedContent = plain.match(/^\|\s*([\s\S]*?)\s*\|\s*\|\s*:?-{3,}:?\s*\|$/);
  if (flattenedContent) plain = flattenedContent[1].trim();
  plain = plain.replace(/\s*<br\s*\/?>\s*/gi, "\n");
  return plain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\r?\n/g, "<br>");
}
export function saveRichText(el: HTMLElement): string {
  return PREFIX + sanitizeSlideHtml(el.innerHTML);
}

/** Replace compact inline-image ids with their current local or signed URLs. */
export function hydrateSlideImages(html: string, sources: Record<string, string | undefined>): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll<HTMLImageElement>("img[data-figure-id]").forEach(image => {
    const source = sources[image.dataset.figureId ?? ""];
    if (source) image.src = source;
    // Transforms move only the painted pixels, not the float exclusion box.
    // Wrapped images must use actual flow geometry so text cannot sit below.
    if (image.style.float === "left" || image.style.float === "right") image.style.transform = "none";
  });
  return template.innerHTML;
}

export function plainSlideText(text: string): string {
  if (!isRichText(text)) return text;
  const el = document.createElement("div");
  el.innerHTML = richTextHtml(text).replace(/<br\s*\/?>|<\/(?:div|p|li|h1|h2|h3|h4|tr)>/gi, "\n").replace(/<\/(?:td|th)>/gi, " ");
  return el.textContent ?? "";
}
