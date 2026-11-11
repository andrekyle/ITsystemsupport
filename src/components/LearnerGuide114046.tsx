import { useEffect, useState } from "react";
import { DocumentActions } from "./DocumentActions";
import "./learner-guide-114046-source.css";

type Values = Record<string, string | boolean>;

export function LearnerGuide114046({ onSave }: { values: Values; onChange: (key: string, value: string | boolean) => void; onSave: () => Promise<void> }) {
  const [pages, setPages] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/SAQA-114046-Learner-Guide.html", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.text(); })
      .then(source => {
        const match = source.match(/<div id="pages">[\s\S]*?<\/div>\s*<script>/i);
        if (!match) throw new Error();
        setPages(match[0].replace(/<script>[\s\S]*$/i, "").replace(/<\/div>\s*$/, "</div>"));
      })
      .catch(reason => { if (reason?.name !== "AbortError") setError("The supplied 114046 Learner Guide could not be opened."); });
    return () => controller.abort();
  }, []);
  return <section className="recreated-learner-guide"><div className="lw-workbook-actions no-print"><div className="lw-workbook-actions-copy"><strong>Learner Guide</strong><span>Answers and guide pages are displayed from the supplied workbook HTML.</span></div><div className="lw-workbook-actions-controls"><DocumentActions name="Unit 114046 Learner Guide" onSave={onSave} /><a className="btn ghost sm" href="/SAQA-114046-Learner-Guide.html" download>Download learner guide</a></div></div>{error ? <div className="callout" role="alert">{error}</div> : !pages ? <div className="learner-guide-loading">Opening the supplied Learner Guide…</div> : <div className="recreated-learner-guide-pages" dangerouslySetInnerHTML={{ __html: pages }} />}</section>;
}
