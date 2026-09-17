import { lessonTableHtml, parseLessonTextBlocks, type LessonTableBlock } from "./lessonTables";

/** Numbered titles in imported learning material, rather than full sentences. */
export function isLessonSubheading(text: string): boolean {
  const value = text.replace(/\*\*/g, "").trim();
  return value.length <= 160 && !/[\r\n]/.test(value) && !/[.!?]$/.test(value) && /^\d+(?:\.\d+)*[.)]?\s+\p{L}/u.test(value);
}
export function isLessonListLead(text: string): boolean {
  return isLessonNumberedListLead(text) || isLessonBulletListLead(text);
}

export function isLessonNumberedListLead(text: string): boolean {
  const value = text.replace(/[\u00a0\s]+$/g, "").trim();
  return /\bfollowing items of work$/i.test(value)
    || /\bas follows:?$/i.test(value)
    || /\b(?:involves?|includes?|comprises?|consists? of|are|is)$/i.test(value);
}

export function isLessonBulletListLead(text: string): boolean {
  const value = text.replace(/[\u00a0\s]+$/g, "").trim();
  return /:$/.test(value) && !isLessonNumberedListLead(value);
}

/** A short source paragraph following a list lead, including full sentences. */
export function isLessonListPoint(text: string): boolean {
  const value = text.trim();
  return value.length > 0 && value.length <= 180 && !isLessonSubheading(value) && !isLessonListLead(value);
}

function tableElement(html: string): Element {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild ?? document.createTextNode("") as unknown as Element;
}

function normalizeLessonTables(root: Element): boolean {
  let changed = false;
  const isCandidate = (element: Element) => /^(P|DIV|BLOCKQUOTE)$/.test(element.tagName)
    && !element.querySelector("div,table,ul,ol,h2,h3")
    && !element.classList.contains("lesson-subsection")
    && !element.classList.contains("lesson-table-scroll")
    && (element.textContent ?? "").trim().length > 0;

  const containers = [root, ...Array.from(root.querySelectorAll("*")).filter(element =>
    !element.closest("table,ul,ol,li") && !/^(P|DIV|BLOCKQUOTE)$/.test(element.tagName)
  )];

  for (const container of containers) {
    const children = Array.from(container.children);
    let index = 0;
    while (index < children.length) {
      if (!isCandidate(children[index])) { index++; continue; }
      const run: Element[] = [];
      while (index < children.length && isCandidate(children[index])) run.push(children[index++]);
      const blocks = parseLessonTextBlocks(run.map(element => element.textContent ?? ""));
      const tables = blocks.filter((block): block is LessonTableBlock =>
        block.kind === "table" && block.sourceStart !== undefined && block.sourceEnd !== undefined
      );
      if (!tables.length) continue;

      const fragment = document.createDocumentFragment();
      let copied = 0;
      for (const table of tables) {
        const start = table.sourceStart ?? copied;
        const end = table.sourceEnd ?? start + 1;
        for (let copy = copied; copy < start; copy++) fragment.append(run[copy].cloneNode(true));
        fragment.append(tableElement(lessonTableHtml(table)));
        copied = end;
      }
      for (let copy = copied; copy < run.length; copy++) fragment.append(run[copy].cloneNode(true));
      run[0].before(fragment);
      run.forEach(element => element.remove());
      changed = true;
    }
  }
  return changed;
}

/** Apply heading and list grouping to saved whole-slide rich text. */
export function groupLessonHtml(html: string, sectionHeading = ""): string {
  const root = document.createElement("div");
  root.innerHTML = html;
  normalizeLessonTables(root);
  const isPoint = (element: Element) => /^(P|DIV|BLOCKQUOTE)$/.test(element.tagName)
    && !element.querySelector("div,table,ul,ol,h2,h3")
    && !element.classList.contains("lesson-subsection")
    && isLessonListPoint(element.textContent ?? "");
  const groupPoints = (first: Element | null, ordered: boolean) => {
    const points: Element[] = [];
    let next = first;
    while (next && isPoint(next)) {
      points.push(next); next = next.nextElementSibling;
    }
    if (!points.length) return;
    const list = document.createElement(ordered ? "ol" : "ul");
    list.className = "lesson-inferred-list";
    points[0].before(list);
    for (const point of points) {
      const item = document.createElement("li");
      // Preserve inline formatting without carrying paragraph/blockquote layout.
      const onlyChild = point.children.length === 1 && point.firstElementChild?.tagName === "P" ? point.firstElementChild : point;
      item.innerHTML = onlyChild!.innerHTML;
      list.append(item); point.remove();
    }
  };
  // The source parser promotes colon lead-ins into the section title.
  // Its following paragraphs still form a list in both reading and edit modes.
  if (isLessonListLead(sectionHeading)) groupPoints(root.firstElementChild, isLessonNumberedListLead(sectionHeading));
  for (const lead of Array.from(root.querySelectorAll("p,div,h2,h3"))) {
    if (lead.closest("li,table,.lesson-card") || lead.querySelector("p,div,table,ul,ol,h2,h3")) continue;
    if (isLessonListLead(lead.textContent ?? "")) groupPoints(lead.nextElementSibling, isLessonNumberedListLead(lead.textContent ?? ""));
  }
  const heading = (element: Element) =>
    !element.classList.contains("section-title") &&
    (/^H[23]$/.test(element.tagName) ||
      (/^(P|DIV)$/.test(element.tagName) && !element.querySelector("p,div,table,ul,ol") && isLessonSubheading(element.textContent ?? "")));
  for (const element of Array.from(root.querySelectorAll("p,div,h2,h3"))) {
    if (!heading(element) || element.closest("li,table,.lesson-card") || element.parentElement?.classList.contains("lesson-subsection")) continue;
    const group = document.createElement("div");
    group.className = "lesson-subsection";
    const title = document.createElement("h3");
    title.className = "lesson-subheading";
    title.innerHTML = element.innerHTML;
    element.replaceWith(group);
    group.append(title);
    while (group.nextElementSibling) {
      const next = group.nextElementSibling;
      if (heading(next) || !/^(P|UL|OL)$/.test(next.tagName)) break;
      if (next.tagName === "P") next.classList.add("lesson-p");
      group.append(next);
    }
  }
  return root.innerHTML;
}
