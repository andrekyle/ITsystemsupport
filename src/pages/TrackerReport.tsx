import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { EditingTools } from "../components/EditingSidebar";
import type { Profile } from "../types";
import { supabase } from "../lib/supabase";
import { FILES_BUCKET } from "../lib/files";
import { enhanceTrackerHtml } from "../lib/trackerEditor";

/**
 * Learner Tracker Report — Super User only.
 *
 * The report HTML contains learner personal data (names, ID numbers), so it
 * is never bundled with the app or committed to the repo. It lives in the
 * private Supabase "files" bucket under shared/reports/. The page downloads
 * it with the signed-in client and renders it from a local blob: URL, which
 * sidesteps any content-type / content-disposition quirks on the storage
 * response (those made a plain signed-URL iframe render blank).
 */
const TRACKER_PATH = "shared/reports/learner-tracker-investec-aug-2026.html";

type Status = "loading" | "missing" | "ready" | "error";

export function TrackerReportPage({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<Status>("loading");
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const currentUrl = useRef<string | null>(null);
  const disconnectEditor = useRef<(() => void) | null>(null);
  const [editingReport, setEditingReport] = useState(false);
  const [reportTools, setReportTools] = useState<{ label: string; button: HTMLButtonElement; structure: boolean }[]>([]);
  const [fillTool, setFillTool] = useState<HTMLInputElement | null>(null);

  function connectEditor(frame: HTMLIFrameElement) {
    disconnectEditor.current?.();
    const doc = frame.contentDocument;
    const toolbar = doc?.querySelector<HTMLElement>(".edit-toolbar");
    if (!doc || !toolbar) return;
    const Sheet = doc.defaultView?.CSSStyleSheet;
    if (!Sheet) {
      setNote("This browser cannot move report tools into the editing sidebar. Use a current browser.");
      return;
    }
    // Keep sidebar presentation out of the report's exported HTML.
    const toolStyle = new Sheet();
    toolStyle.replaceSync('body.editing .edit-toolbar, body[contenteditable="true"] .edit-toolbar { display: none !important; }');
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, toolStyle];
    const update = () => {
      const active = doc.body.classList.contains("editing") || doc.body.contentEditable === "true";
      setEditingReport(active);
      setReportTools(Array.from(toolbar.querySelectorAll<HTMLButtonElement>("button")).map(button => ({
        label: button.textContent?.trim() || button.title || "Report tool",
        button,
        structure: !!button.closest(".tracker-column-controls"),
      })));
      setFillTool(toolbar.querySelector<HTMLInputElement>('input[type="color"]'));
    };
    const observer = new MutationObserver(update);
    observer.observe(doc.body, { attributes: true, attributeFilter: ["class", "contenteditable"] });
    update();
    disconnectEditor.current = () => {
      observer.disconnect();
      doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(sheet => sheet !== toolStyle);
    };
  }

  function setBlobUrl(u: string | null) {
    disconnectEditor.current?.();
    disconnectEditor.current = null;
    setEditingReport(false);
    setReportTools([]);
    setFillTool(null);
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = u;
    setUrl(u);
  }

  async function refresh() {
    if (!supabase) {
      setStatus("error");
      setNote("Cloud storage is not configured on this device.");
      return;
    }
    setStatus("loading");
    const { data, error } = await supabase.storage.from(FILES_BUCKET).download(TRACKER_PATH);
    if (error || !data) {
      setBlobUrl(null);
      setStatus("missing");
      return;
    }
    // Add spreadsheet editing controls to both legacy and newly uploaded copies.
    const html = enhanceTrackerHtml(await data.text());
    // Force the HTML type so the browser always renders it (not download it).
    const blob = new Blob([html], { type: "text/html" });
    setBlobUrl(URL.createObjectURL(blob));
    setStatus("ready");
  }

  useEffect(() => {
    void refresh();
    return () => {
      disconnectEditor.current?.();
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFilePicked(f: File | null) {
    if (!f || !supabase) return;
    setStatus("loading");
    setNote("");
    const { error } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(TRACKER_PATH, f, { upsert: true, contentType: "text/html" });
    if (error) {
      setStatus("missing");
      setNote(`Upload failed: ${error.message}`);
      return;
    }
    await refresh();
  }

  if (profile.role !== "Super User") {
    return (
      <div className="card">
        <p>This report is only available to the Super User.</p>
      </div>
    );
  }

  return (
    <>
      <div className="report-toolbar no-print">
        <h1 className="page-title" style={{ margin: 0 }}>Learner Tracker Report</h1>
        <div className="report-toolbar-actions">
          {status === "ready" && url && (
            <button
              className="btn ghost sm"
              onClick={() => window.open(url, "_blank")}
            >
              <Icon name="globe" size={15} /> Open in new tab
            </button>
          )}
          {status === "ready" && (
            <button className="btn ghost sm" onClick={() => fileInput.current?.click()}>
              <Icon name="download" size={15} /> Replace file
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".html,text/html"
        style={{ display: "none" }}
        onChange={(e) => void onFilePicked(e.target.files?.[0] ?? null)}
      />

      {status === "loading" && (
        <div className="card">
          <p>Loading the report…</p>
        </div>
      )}

      {status === "error" && (
        <div className="card">
          <p>{note}</p>
        </div>
      )}

      {status === "missing" && (
        <div className="card">
          <p style={{ marginBottom: 10 }}>
            The report is not in cloud storage yet. Upload{" "}
            <strong>Learner-Tracker-Investec-Aug-2026.html</strong> once — after this it opens
            directly on any device. It is stored privately; only signed-in users can reach it.
          </p>
          {note && <p style={{ marginBottom: 10 }}>{note}</p>}
          <button className="btn primary" onClick={() => fileInput.current?.click()}>
            <Icon name="folder" size={15} /> Choose report file
          </button>
        </div>
      )}

      {status === "ready" && url && (
        <div className="card report-frame-card">
          {note && <p role="alert">{note}</p>}
          <iframe className="report-frame" src={url} title="Learner Tracker Report"
            onLoad={event => connectEditor(event.currentTarget)} />
        </div>
      )}
      <EditingTools active={status === "ready" && editingReport} title="Report changes">
        {reportTools.filter(tool => !tool.structure).map((tool, index) => (
          <button key={index} type="button" className="btn ghost sm"
            disabled={tool.button.disabled}
            onClick={() => tool.button.click()}>{tool.label}</button>
        ))}
      </EditingTools>
      <EditingTools active={status === "ready" && editingReport} title="Spreadsheet tools">
        {reportTools.filter(tool => tool.structure).map((tool, index) => (
          <button key={index} type="button" className="btn ghost sm"
            disabled={tool.button.disabled}
            onClick={() => tool.button.click()}>{tool.label}</button>
        ))}
        {fillTool && <label>Cell fill
          <input type="color" defaultValue={fillTool.value} onChange={event => {
            fillTool.value = event.target.value;
            const FrameEvent = fillTool.ownerDocument.defaultView?.Event;
            if (FrameEvent) fillTool.dispatchEvent(new FrameEvent("input", { bubbles: true }));
          }} />
        </label>}
      </EditingTools>
    </>
  );
}
