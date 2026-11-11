import { useEffect, useState } from "react";
import { DocumentActions } from "./DocumentActions";
import "./learner-guide-114074-source.css";

type Values = Record<string, string | boolean>;

// PDF text runs and painted table rules cannot reflow together. Rebuild the
// introduction as ordinary table cells so each row follows its own content.
function repairIntroduction(markup: string): string {
  const document = new DOMParser().parseFromString(markup, "text/html");
  for (const page of document.querySelectorAll<HTMLElement>(".page")) {
    page.classList.add("guide-114074-page");
    // Use the complete source image; the bare image belongs to the source's
    // canvas editor, which is not executed in this reader.
    page.querySelectorAll("img.b").forEach(image => image.remove());
    page.querySelectorAll<HTMLElement>(".textLayer span").forEach(span => {
      span.removeAttribute("contenteditable");
    });
    if (!Array.from(page.querySelectorAll("span")).some(span => span.textContent === "Learner Guide Introduction")) continue;
    const runs = Array.from(page.querySelectorAll<HTMLElement>(".textLayer span"));
    const textBetween = (start: number, end: number, bodyOnly = true) => runs
      .filter(run => {
        const top = parseFloat(run.style.top);
        return top >= start && top < end && (!bodyOnly || parseFloat(run.style.left) > 25);
      }).map(run => run.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
    const labels = ["Purpose", "Outcomes", "Assessment", "To qualify", "Range of Learning", "Responsibility"];
    const starts = labels.map(label => {
      const run = runs.find(run => run.textContent?.trim() === label);
      return run ? parseFloat(run.style.top) : NaN;
    });
    if (starts.some(Number.isNaN)) continue;
    const heading = document.createElement("h2");
    heading.textContent = "Learner Guide Introduction";
    const table = document.createElement("table");
    table.className = "guide-introduction-table";
    const body = table.createTBody();
    const rows = [
      { label: "About the Learner Guide", text: textBetween(12, starts[0]) },
      ...labels.map((label, index) => ({
        label: label === "Assessment" ? "Assessment Criteria" : label,
        text: textBetween(starts[index] - .05, starts[index + 1] - .05 || 95),
      })),
    ];
    for (const entry of rows) {
      const row = body.insertRow();
      const label = document.createElement("th");
      label.scope = "row";
      label.textContent = entry.label;
      row.append(label);
      row.insertCell().textContent = entry.text;
    }
    page.classList.add("guide-introduction-page");
    page.replaceChildren(heading, table);
  }
  return document.body.innerHTML;
}

export function LearnerGuide114074({ onSave }: { values: Values; onChange: (key: string, value: string | boolean) => void; onSave: () => Promise<void> }) {
  const [pages, setPages] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/SAQA-114074-Learner-Guide.html", { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.text(); }).then(source => {
      const match = source.match(/<div id="pages">[\s\S]*?<\/div>\s*<script>/i);
      if (!match) throw new Error();
        const markup = match[0]
          .replace(/<script>[\s\S]*$/i, "")
          .replace(/<\/div>\s*$/, "</div>");
        setPages(repairIntroduction(markup));
    }).catch(reason => { if (reason?.name !== "AbortError") setError("The supplied 114074 Learner Guide could not be opened."); });
    return () => controller.abort();
  }, []);
  return <section className="recreated-learner-guide"><div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Learner Guide</strong><span>Answers and guide pages are displayed from the supplied workbook HTML.</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Unit 114074 Learner Guide" onSave={onSave} /><a className="btn ghost sm" href="/SAQA-114074-Learner-Guide.html" download>Download learner guide</a></div></div>{error ? <div className="callout" role="alert">{error}</div> : !pages ? <div className="learner-guide-loading">Opening the supplied Learner Guide…</div> : <div className="recreated-learner-guide-pages" dangerouslySetInnerHTML={{ __html: pages }} />}</section>;
}
