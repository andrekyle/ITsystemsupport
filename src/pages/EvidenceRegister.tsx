import { useEffect, useRef, useState } from "react";
import { downloadDoc, uploadFile, userPrefix } from "../lib/files";
import { loadProfiles, usePoe } from "../store";
import type { Profile } from "../types";
import { Select } from "../components/Select";
import { fetchCloudDirectory, remoteOnlyProfiles, resolveCloudLink, type CloudDirectory } from "../lib/directory";
import { Icon } from "../icons";
import "./admin-dashboard.css";
import "./evidence-register.css";

const evidenceGroups = [
  { title: "Learner file", items: ["EEA1", "Certified ID copy", "Signed class register", "Certificate of completion", "Signed learnership + employment contract"] },
  { title: "Payroll & funding", items: ["Invoice + proof of payment", "12-month payroll summary", "First, middle and last payslip", "EMP201 for measured period", "Proof of payment for first and last EMP201"] },
  { title: "SETA & provider", items: ["SETA registration", "WSP / ATR / Pivotal report", "Proof of submission to SETA", "SETA approval", "Eruditio accreditation proof"] },
];

const itemKey = (item: string) => "sde-" + item.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function EvidenceRegisterPage({ profile: _profile }: { profile: Profile }) {
  const [cloud, setCloud] = useState<CloudDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    void fetchCloudDirectory().then((directory) => { if (alive) setCloud(directory); })
      .catch(() => { if (alive) setError("Could not load cloud learners. Refresh to try again."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const localProfiles = loadProfiles();
  const learners = [...localProfiles, ...(cloud ? remoteOnlyProfiles(localProfiles, cloud.profiles) : [])]
    .filter((p) => p.role === "Learner").sort((a, b) => a.name.localeCompare(b.name));
  const [learnerId, setLearnerId] = useState("");
  const learner = learners.find((p) => p.id === learnerId) ?? learners[0];
  const { docs: ownDocs, saveDoc } = usePoe(learner?.id ?? "");
  const cloudLink = learner ? resolveCloudLink(learner, cloud) : null;
  const cloudDocs = (cloudLink && cloud?.poe[cloudLink.cloudId]) || (learner && cloud?.poe[learner.id]);
  const docs = { ...cloudDocs, ...ownDocs };
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState(evidenceGroups[0].title);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingItem, setPendingItem] = useState<string | null>(null);

  async function uploadFor(item: string, file: File) {
    if (!learner) return;
    setError(null);
    if (file.size > 10 * 1024 * 1024) { setError("Files must be 10 MB or smaller."); return; }
    setUploadPct(0);
    try {
      const prefix = await userPrefix();
      const doc = await uploadFile(`${prefix}/poe/${learner.id}/${itemKey(item)}`, file, setUploadPct);
      if (!saveDoc(itemKey(item), doc)) throw new Error("Storage is full. Free up space and try again.");
    }
    catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    finally { setPendingItem(null); setUploadPct(null); }
  }

  function downloadLearnerRegister() {
    const rows = [["Learner", "Role", "Email", "Created", "Last sign-in"], ...learners.map((p) => [p.name, p.role, p.enrolment?.email ?? "", p.createdAt, p.lastLogin ?? ""])];
    const csv = rows.map((row) => row.map((cell) => "\"" + String(cell).replace(/"/g, "\"\"") + "\"").join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "learner-register.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="admin-overview evidence-register-page">
    <div className="admin-overview-head">
      <div><h1>Skills Development evidence register</h1><p>Admin oversight checklist for sampled learner files and measured-period evidence.</p></div>
      <button type="button" className="btn ghost" onClick={downloadLearnerRegister}>Download learner register CSV ↓</button>
    </div>
    <section className="admin-evidence-panel">
      <div className="admin-records-toolbar evidence-register-toolbar card">
        <div className="evidence-learner-picker"><strong>Learner file</strong><Select value={learner?.id ?? ""}
          ariaLabel="Choose learner file" placeholder={loading ? "Loading learners?" : "No learners available"}
          disabled={uploadPct !== null || learners.length === 0}
          options={learners.map((p) => ({ value: p.id, label: p.name, hint: p.enrolment?.email }))}
          onChange={(id) => { setLearnerId(id); setPendingItem(null); setError(null); }} /></div>
        <span>{learner ? learner.enrolment?.email ?? "No email on record" : loading ? "Loading learners?" : "No learners available"}</span>
      </div>
      {error && <p role="alert" className="admin-data-note">{error}</p>}
      <div className="tabs poe-section-tabs" role="tablist" aria-label="Skills Development evidence sections">
        {evidenceGroups.map((group, index) => <button key={group.title} type="button" role="tab"
          id={`evidence-tab-${index}`} aria-controls={`evidence-panel-${index}`}
          aria-selected={selectedSection === group.title} tabIndex={selectedSection === group.title ? 0 : -1}
          className={`tab${selectedSection === group.title ? " active" : ""}`}
          onClick={() => setSelectedSection(group.title)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % evidenceGroups.length;
            else if (event.key === "ArrowLeft") next = (index + evidenceGroups.length - 1) % evidenceGroups.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = evidenceGroups.length - 1;
            else return;
            event.preventDefault();
            setSelectedSection(evidenceGroups[next].title);
            document.getElementById(`evidence-tab-${next}`)?.focus();
          }}><Icon name="folder" size={14} />{group.title}</button>)}
      </div>
      {evidenceGroups.map((group, index) => <section key={group.title} role="tabpanel"
        id={`evidence-panel-${index}`} aria-labelledby={`evidence-tab-${index}`} hidden={selectedSection !== group.title}>
        <h2 className="section-title"><span className="ico"><Icon name="folder" size={20} /></span>{group.title}</h2>
        <div className="card poe-table-card"><table className="data poe-table">
          <thead><tr><th>Item</th><th>Evidence</th></tr></thead>
          <tbody>{group.items.map((item) => {
            const doc = docs[itemKey(item)];
            return <tr key={item}>
              <td><div className="poe-item"><span className={`status ${doc ? "done" : "none"}`} role="img" aria-label={doc ? "Uploaded" : "Not uploaded"}>
                <Icon name={doc ? "checkCircle" : "circle"} size={20} />
              </span><span className="t">{item}</span></div></td>
              <td className="poe-doc-cell"><div className="poe-doc">
                {doc ? <div className="poe-doc-line"><Icon name="file" size={18} /><span className="fileinfo"><span className="poe-file" title={doc.name}>{doc.name}</span></span>
                  <button type="button" className="btn ghost poe-upload" onClick={() => void downloadDoc(doc)}><Icon name="download" size={15} />Download</button></div>
                : <><button type="button" className="btn ghost poe-upload" disabled={!learner || uploadPct !== null} onClick={() => { setPendingItem(item); inputRef.current?.click(); }}><Icon name="upload" size={15} />{pendingItem === item && uploadPct !== null ? `Uploading ${uploadPct}%` : "Upload evidence"}</button>
                  </>}
              </div></td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>)}
      <p className="admin-evidence-note">Also retain sampled attendance registers, trainer payslips, disability confirmations and reasonable-accommodation letters where applicable. Absorption claims require the succeeding long-term employment contract and the trainee tracker to include all learners.</p>
      <input ref={inputRef} hidden type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file && pendingItem) void uploadFor(pendingItem, file); e.currentTarget.value = ""; }} />
    </section>
  </div>;
}
