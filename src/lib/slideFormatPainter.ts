const BLOCK_SELECTOR = "p,h1,h2,h3,h4,li,blockquote,td,th";
const TEXT_PROPERTIES = ["font-family", "font-size", "font-weight", "font-style", "letter-spacing", "vertical-align"] as const;
const BLOCK_PROPERTIES = ["text-align", "line-height", "text-indent", "margin-left", "margin-right", "margin-top", "margin-bottom"] as const;

export interface SlideTextFormat {
  text: Record<string, string>;
  paragraph: Record<string, string>;
  blockTag: string;
  userColour: boolean;
}

export function copySlideTextFormat(editor: HTMLElement, range: Range): SlideTextFormat | null {
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let source: HTMLElement | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.textContent?.length ?? 0;
    if (!range.collapsed && end > start && range.intersectsNode(node)) {
      source = node.parentElement;
      break;
    }
  }
  source ??= range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement;
  if (!source) return null;
  const style = getComputedStyle(source);
  const text: Record<string, string> = {};
  for (const property of TEXT_PROPERTIES) text[property] = style.getPropertyValue(property);
  const decorations = new Set<string>();
  let highlight = "transparent";
  let userColour = false;
  for (let node: HTMLElement | null = source; node && node !== editor; node = node.parentElement) {
    const current = getComputedStyle(node);
    for (const decoration of current.textDecorationLine.split(" ")) if (decoration !== "none") decorations.add(decoration);
    if (highlight === "transparent" && current.backgroundColor !== "rgba(0, 0, 0, 0)" && current.backgroundColor !== "transparent") highlight = current.backgroundColor;
    userColour ||= node.dataset.userColor === "true";
  }
  text["text-decoration"] = Array.from(decorations).join(" ") || "none";
  text["background-color"] = highlight;
  if (userColour) text.color = style.color;
  const block = source.closest<HTMLElement>(BLOCK_SELECTOR);
  const paragraph: Record<string, string> = {};
  if (block && editor.contains(block)) {
    const computed = getComputedStyle(block);
    for (const property of BLOCK_PROPERTIES) paragraph[property] = computed.getPropertyValue(property);
  }
  return { text, paragraph, blockTag: block && /^H[1-4]$/.test(block.tagName) ? block.tagName.toLowerCase() : "p", userColour };
}

export function paintSlideTextFormat(editor: HTMLElement, selection: Selection, format: SlideTextFormat): boolean {
  if (!selection.rangeCount || selection.isCollapsed) return false;
  let range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer) || !range.toString()) return false;
  const suppressIntermediateSave = (event: Event) => event.stopImmediatePropagation();
  editor.addEventListener("input", suppressIntermediateSave, true);
  try { document.execCommand("removeFormat", false); }
  finally { editor.removeEventListener("input", suppressIntermediateSave, true); }
  range = selection.getRangeAt(0).cloneRange();
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) if (walker.currentNode instanceof Text && range.intersectsNode(walker.currentNode)) nodes.push(walker.currentNode);
  const painted: HTMLElement[] = [];
  const blocks = new Set<HTMLElement>();
  for (const node of nodes.reverse()) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (end <= start) continue;
    const block = node.parentElement?.closest<HTMLElement>(BLOCK_SELECTOR);
    if (block && editor.contains(block)) blocks.add(block);
    const part = document.createRange();
    part.setStart(node, start);
    part.setEnd(node, end);
    const span = document.createElement("span");
    for (const [property, value] of Object.entries(format.text)) span.style.setProperty(property, value);
    if (format.userColour) span.dataset.userColor = "true";
    span.appendChild(part.extractContents());
    part.insertNode(span);
    painted.unshift(span);
  }
  if (!painted.length) return false;
  for (let block of blocks) {
    if (/^(P|H[1-4])$/.test(block.tagName) && block.tagName.toLowerCase() !== format.blockTag) {
      const replacement = document.createElement(format.blockTag);
      for (const attribute of Array.from(block.attributes)) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...Array.from(block.childNodes));
      block.replaceWith(replacement);
      block = replacement;
    }
    for (const [property, value] of Object.entries(format.paragraph)) block.style.setProperty(property, value);
  }
  const result = document.createRange();
  result.setStartBefore(painted[0]);
  result.setEndAfter(painted[painted.length - 1]);
  selection.removeAllRanges();
  selection.addRange(result);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
