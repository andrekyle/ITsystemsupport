import { useRef, useState } from "react";
import { Icon } from "../icons";
import type { WorkbookMemoState } from "../store";
import { deleteFile, downloadDoc, getFileUrl, uploadFile } from "../lib/files";

export interface WorkbookMemoBlueprint {
  id: string;
  question: string;
  maxMarks: number;
  tasks: { task: number; text: string; marks: number }[];
}

type MemoApiResponse = { jobId?: string; status?: string; items?: WorkbookMemoState["items"]; model?: string; error?: string };

async function memoRequest(body: Record<string, unknown>) {
  const response = await fetch("/api/workbook-memo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const raw = await response.text();
  let parsed: MemoApiResponse;
  try { parsed = JSON.parse(raw) as MemoApiResponse; }
  catch { throw new Error(response.ok ? "The memo service returned an invalid response." : `The memo could not be processed (${response.status}). Please try again.`); }
  if (!response.ok && response.status !== 202) throw new Error(parsed.error || `The memo could not be processed (${response.status}). Please try again.`);
  return parsed;
}

const pause = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export function WorkbookMemo({ unitId, blueprint, memo, onChange }: { unitId: string; blueprint: WorkbookMemoBlueprint[]; memo: WorkbookMemoState; onChange: (next: WorkbookMemoState) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) { setError("Choose a PDF memo."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("The memo must be 10 MB or smaller."); return; }
    setBusy(true); setError(""); setProgress(5);
    let stored: Awaited<ReturnType<typeof uploadFile>> | undefined;
    try {
      stored = await uploadFile(`shared/workbook-memos/${unitId}`, file, pct => setProgress(5 + Math.round(pct * .35)));
      const fileUrl = await getFileUrl(stored);
      // Cloud uploads use a short-lived signed URL, avoiding Vercel's request
      // body limit. Local-only mode falls back to the data URL.
      const fileData = fileUrl?.startsWith("data:") ? fileUrl : undefined;
      setProgress(45);
      let parsed = await memoRequest({ mode: "extract", unitId, blueprint, filename: file.name, fileUrl: fileData ? undefined : fileUrl, fileData });
      for (let attempt = 0; !parsed.items?.length && parsed.jobId && attempt < 120; attempt += 1) {
        await pause(2_000);
        setProgress(Math.min(89, 46 + Math.floor(attempt / 3)));
        parsed = await memoRequest({ mode: "extract-status", jobId: parsed.jobId, blueprint });
      }
      if (!parsed.items?.length) throw new Error(parsed.error || "The memo took too long to process. Please try again.");
      setProgress(90);
      if (memo.file?.path && memo.file.path !== stored.path) void deleteFile(memo.file.path);
      // In local-only mode uploadFile returns the PDF as a large data URL.
      // It is needed for extraction, but must never be copied into localStorage.
      const persistedFile = stored.path
        ? stored
        : { name: stored.name, type: stored.type, size: stored.size, uploadedAt: stored.uploadedAt };
      onChange({ file: persistedFile, items: parsed.items, model: parsed.model, updatedAt: new Date().toISOString() });
      setProgress(100);
    } catch (reason) {
      if (stored?.path && stored.path !== memo.file?.path) void deleteFile(stored.path);
      setError(reason instanceof Error ? reason.message : "The memo could not be saved.");
    }
    finally { setBusy(false); }
  };

  return <section className="card workbook-memo">
    <div className="workbook-memo-head"><div className="practical-hero-icon"><Icon name="document" size={26}/></div><div><span className="practical-kicker">Learner Workbook</span><h2>Marking memo</h2><p>Upload the official PDF memo. OpenAI extracts its marking criteria and uses them as the ground truth for semantic marking.</p></div></div>
    <div className="workbook-memo-upload">
      <input ref={input} hidden type="file" accept="application/pdf,.pdf" onChange={event => { const file=event.target.files?.[0]; event.target.value=""; void pick(file); }}/>
      <button className="btn" type="button" disabled={busy} onClick={()=>input.current?.click()}><Icon name="upload" size={16}/> {busy ? `Reading memo… ${progress}%` : memo.file ? "Replace memo PDF" : "Upload memo PDF"}</button>
      {memo.file && <>{(memo.file.path || memo.file.data) && <button className="btn ghost" type="button" onClick={()=>void downloadDoc(memo.file!)}><Icon name="download" size={16}/> Download memo</button>}<span className="muted">{memo.file.name}</span></>}
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!!memo.items.length && <div className="workbook-memo-ready"><Icon name="checkCircle" size={18}/><div><strong>Memo ready for marking</strong><span>{memo.items.length} activities · {memo.items.reduce((sum,item)=>sum+item.criteria.length,0)} marking criteria{memo.updatedAt ? ` · updated ${new Date(memo.updatedAt).toLocaleString()}` : ""}</span></div></div>}
    {!!memo.items.length && <div className="workbook-memo-list">{memo.items.map(item=><details key={item.id}><summary><span>{item.question}</span><b>{item.maxMarks} marks</b></summary>{item.tasks?.length ? <table className="workbook-memo-table"><thead><tr><th>Question</th><th>Marks</th></tr></thead><tbody>{[...item.tasks].sort((a,b)=>a.task-b.task).map(task=><tr key={task.id}><td><strong>Task {task.task}</strong><span>{task.text}</span></td><td>{task.marks}</td></tr>)}</tbody></table> : null}<h4>Marking criteria</h4><table className="workbook-memo-table"><thead><tr><th>Criterion</th><th>Marks</th></tr></thead><tbody>{item.criteria.map(criterion=><tr key={criterion.id}><td>{criterion.text}</td><td>{criterion.marks}</td></tr>)}</tbody></table></details>)}</div>}
  </section>;
}
