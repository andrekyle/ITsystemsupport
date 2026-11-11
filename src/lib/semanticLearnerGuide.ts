type Run = { text: string; x: number; end: number; y: number; size: number; bold: boolean };
export type GuideVisuals = {
  graphics: { page:number; src:string; top:number; width:number; alt:string }[];
  panels: { page:number; top:number; bottom:number }[];
};
export const guideGraphicsStyles = `.semantic-guide-cover{border:1px solid #e3b388!important;border-right:54px solid #f3780d!important;background:#ecd0a6!important}.semantic-guide-cover h1{color:#171717}.semantic-guide-logo{display:block;width:min(100%,360px);height:auto;margin:0 auto 36px}.semantic-guide-panel{background:#c7d8ee;border:1px solid #929ca8;padding:16px 20px;margin:18px 0}.semantic-guide-panel h2:first-child{margin-top:0}.semantic-guide-panel table{margin:0}.semantic-guide-panel th,.semantic-guide-panel td{background:transparent}.semantic-guide-section:not(.semantic-guide-cover){border:1px solid #f3b680}.semantic-guide-section table th{background:#c7d8ee}.semantic-guide-section h2{padding-bottom:8px;border-bottom:3px solid #dededb}@media(max-width:600px){.semantic-guide-cover{border-right-width:16px!important}.semantic-guide-panel{padding:12px}}@media print{.semantic-guide-panel,.semantic-guide-cover,th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`;

/** Reconstruct reading order from the source's PDF text runs, then discard
 * their fixed coordinates. All returned content participates in HTML flow. */
export function semanticLearnerGuide(source: string, visuals?: GuideVisuals): string {
  const doc = new DOMParser().parseFromString(source, "text/html");
  const article = doc.createElement("article");
  article.className = "semantic-guide";
  const pages = Array.from(doc.querySelectorAll<HTMLElement>("#pages > .page"));
  pages.forEach((page, pageIndex) => {
    const section = doc.createElement("section");
    section.className = "semantic-guide-section";
    section.setAttribute("aria-label", `Source page ${pageIndex + 1}`);
    if (pageIndex === 0) section.classList.add("semantic-guide-cover");
    for (const graphic of visuals?.graphics.filter(graphic => graphic.page === pageIndex + 1) ?? []) {
      const image = doc.createElement("img");
      image.className = "semantic-guide-logo";
      image.src = graphic.src;
      image.alt = graphic.alt;
      section.append(image);
    }
    const panelElements = new Map<number, HTMLElement>();
    const pagePanels = visuals?.panels.filter(panel => panel.page === pageIndex + 1) ?? [];
    let previousTarget: HTMLElement = section;
    const width = parseFloat(page.style.width) || 793.76;
    const runs: Run[] = [];
    for (const span of page.querySelectorAll<HTMLElement>(".textLayer span")) {
      const text = span.textContent ?? "";
      if (!text.trim() || span.style.transform.includes("rotate")) continue;
      const x = parseFloat(span.style.left);
      const y = parseFloat(span.style.top);
      const reg: number[] = JSON.parse(span.dataset.reg || "[0,0,0,0]");
      const size = Number(span.style.fontSize.match(/([\d.]+)px/)?.[1] ?? 12);
      runs.push({ text, x, y, end: x + reg[2] / (width * 2) * 100, size, bold: span.style.fontWeight === "bold" });
    }
    runs.sort((a, b) => Math.abs(a.y - b.y) < .3 ? a.x - b.x : a.y - b.y);
    const lines: Run[][] = [];
    for (const run of runs) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last[0].y - run.y) < .3) last.push(run);
      else lines.push([run]);
    }
    let paragraph: HTMLElement | undefined;
    let list: HTMLUListElement | undefined;
    let table: HTMLTableElement | undefined;
    let previousY = -100;
    const join = (items: Run[]) => items.map((run, index) => {
      const previous = items[index - 1];
      // Adjacent digit fragments (1140 + 76, 3 + 0) must stay joined.
      return `${previous && !( /\d$/.test(previous.text) && /^\d/.test(run.text) && run.x - previous.end < 1) ? " " : ""}${run.text}`;
    }).join("").replace(/\s+/g, " ").trim();
    for (const line of lines) {
      const text = join(line);
      const y = line[0].y;
      const panelIndex = pagePanels.findIndex(panel => y >= panel.top - .4 && y <= panel.bottom + .4);
      let target: HTMLElement = section;
      if (panelIndex >= 0) {
        if (!panelElements.has(panelIndex)) {
          const panel = doc.createElement("div");
          panel.className = "semantic-guide-panel";
          section.append(panel);
          panelElements.set(panelIndex, panel);
        }
        target = panelElements.get(panelIndex)!;
      }
      if (target !== previousTarget) { paragraph = undefined; list = undefined; table = undefined; }
      previousTarget = target;
      const heading = line.every(run => run.bold) && text.length < 160;
      const bullet = /^[•\uF0B7\uF0A7–]\s*/.test(text);
      const cells: Run[][] = [[]];
      for (const run of line) {
        const cell = cells[cells.length - 1];
        if (cell.length && run.x - cell[cell.length - 1].end > 4) cells.push([run]);
        else cell.push(run);
      }
      if (cells.length > 1 && !bullet) {
        paragraph = undefined; list = undefined;
        if (!table) { table = doc.createElement("table"); table.createTBody(); target.append(table); }
        const row = table.tBodies[0].insertRow();
        for (const cell of cells) {
          const element = doc.createElement(cell.every(run => run.bold) ? "th" : "td");
          element.textContent = join(cell);
          row.append(element);
        }
      } else {
        table = undefined;
        if (heading) {
          paragraph = undefined; list = undefined;
          const element = doc.createElement(pageIndex === 0 && line[0].size >= 20 ? "h1" : "h2");
          element.textContent = text; target.append(element);
        } else if (bullet) {
          paragraph = undefined;
          if (!list) { list = doc.createElement("ul"); target.append(list); }
          const item = doc.createElement("li"); item.textContent = text.replace(/^[•\uF0B7\uF0A7–]\s*/, ""); list.append(item);
        } else {
          if (!paragraph || y - previousY > 3) {
            paragraph = doc.createElement("p");
            if (list) list.lastElementChild?.append(paragraph); else target.append(paragraph);
          }
          if (paragraph.textContent) paragraph.append(" ");
          paragraph.append(text);
        }
      }
      previousY = y;
    }
    const footer = doc.createElement("footer");
    footer.textContent = `Unit standard 114076 · Source page ${pageIndex + 1} of ${pages.length}`;
    section.append(footer);
    article.append(section);
  });
  if (!pages.length) throw new Error("No learner guide pages found.");
  return article.outerHTML;
}
