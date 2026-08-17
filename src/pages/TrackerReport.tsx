import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile } from "../types";
import { supabase } from "../lib/supabase";
import { FILES_BUCKET } from "../lib/files";

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

  function setBlobUrl(u: string | null) {
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
    // Force the HTML type so the browser always renders it (not download it).
    const blob = new Blob([data], { type: "text/html" });
    setBlobUrl(URL.createObjectURL(blob));
    setStatus("ready");
  }

  useEffect(() => {
    void refresh();
    return () => {
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
          <iframe className="report-frame" src={url} title="Learner Tracker Report" />
        </div>
      )}
    </>
  );
}
