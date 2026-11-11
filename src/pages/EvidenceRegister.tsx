import { useMemo, useRef, useState } from "react";
import { downloadDoc, uploadFile } from "../lib/files";
import { loadProfiles, usePoe } from "../store";
import type { PoeDoc, Profile } from "../types";
import "./admin-dashboard.css";

const evidenceGroups = [
  { title: "Learner file", items: ["EEA1", "Certified ID copy", "Signed class register", "Certificate of completion", "Signed learnership + employment contract"] },
  { title: "Payroll & funding", items: ["Invoice + proof of payment", "12-month payroll summary", "First, middle and last payslip", "EMP201 for measured period", "Proof of payment for first and last EMP201"] },
  { title: "SETA & provider", items: ["SETA registration", "WSP / ATR / Pivotal report", "Proof of submission to SETA", "SETA approval", "Eruditio accreditation proof"] },
];

const itemKey = (item: string) => "sde-" + item.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function EvidenceRegisterPage({ profile: _profile }: { profile: Profile }) {
  const learners = useMemo(() => loadProfiles().filter((p) => p.role === "Learner").sort((a, b) => a.name.localeCompare(b.name)), []);
  const [learnerId, setLearnerId] = useState(learners[0]?.id ?? "");
  const learner = learners.find((p) => p.id === learnerId) ?? learners[0];
  const { docs, saveDoc } = usePoe(learner?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const allExistingDocs = Object.entries(docs).filter(([key]) => !key.startsWith("sde-"));

  async function uploadFor(item: string, file: File) {
    if (!learner) return;
    setError(null);
    try { await saveDoc(itemKey(item), await uploadFile("poe/" + learner.id + "/skills-development", file)); }
    catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    finally { setPendingItem(null); }
  }

  async function pullExisting(item: string, doc: PoeDoc) {
    if (!learner) return;
    await saveDoc(itemKey(item), doc);
  }

  function downloadLearnerRegister() {
    const learners = loadProfiles().filter((p) => p.role === "Learner");
    const rows = [["Learner", "Role", "Email", "Created", "Last sign-in"], ...learners.map((p) => [p.name, p.role, p.enrolment?.email ?? "", p.createdAt, p.lastLogin ?? ""])];
    const csv = rows.map((row) => row.map((cell) => "\"" + String(cell).replace(/"/g, "\"\"") + "\"").join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "learner-register.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="admin-overview">
    <div className="admin-overview-head">
      <div><h1>Skills Development evidence register</h1><p>Admin oversight checklist for sampled learner files and measured-period evidence.</p></div>
      <button type="button" className="admin-refresh" onClick={downloadLearnerRegister}>Download learner register CSV ↓</button>
    </div>
    <section className="admin-panel admin-evidence-panel">
      <div className="admin-records-toolbar"><label><strong>Learner file</strong><select value={learner?.id ?? ""} onChange={(e) => setLearnerId(e.target.value)}>{learners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><span>{learner ? learner.enrolment?.email ?? "No email on record" : "No learners available"}</span></div>
      {error && <p role="alert" className="admin-data-note">{error}</p>}
      <div className="admin-evidence-grid">{evidenceGroups.map((group) => <div className="admin-evidence-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => { const doc = docs[itemKey(item)]; return <div className="evidence-register-item" key={item}><label><input type="checkbox" checked={!!doc} readOnly /> <span>{item}</span></label><span className="evidence-register-actions">{doc ? <><button type="button" onClick={() => void downloadDoc(doc)}>Download</button><span title={doc.name}>{doc.name}</span></> : <><button type="button" onClick={() => { setPendingItem(item); inputRef.current?.click(); }}>Upload</button>{allExistingDocs.length > 0 && <select defaultValue="" onChange={(e) => { const found = allExistingDocs.find(([key]) => key === e.target.value)?.[1]; if (found) void pullExisting(item, found); }}><option value="">Pull from POE / student file</option>{allExistingDocs.map(([key, existing]) => <option key={key} value={key}>{existing.name}</option>)}</select>}</>}</span></div>; })}</div>)}</div>
      <p className="admin-evidence-note">Also retain sampled attendance registers, trainer payslips, disability confirmations and reasonable-accommodation letters where applicable. Absorption claims require the succeeding long-term employment contract and the trainee tracker to include all learners.</p>
      <input ref={inputRef} hidden type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file && pendingItem) void uploadFor(pendingItem, file); e.currentTarget.value = ""; }} />
    </section>
  </div>;
}
