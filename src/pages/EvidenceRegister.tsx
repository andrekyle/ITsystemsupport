import { useEffect, useRef, useState } from "react";
import { downloadDoc, uploadFile, userPrefix } from "../lib/files";
import { loadProfiles, loadProgress, usePoe } from "../store";
import { isAdminRole, type PoeDoc, type Profile, type ProgressState } from "../types";
import { Select } from "../components/Select";
import { cloudProfileIds, fetchCloudLearnerData, mergeProfileWithCloud, remoteOnlyProfiles, type CloudLearnerData } from "../lib/directory";
import { Icon } from "../icons";
import { Modal } from "../components/Modal";
import { PortfolioDateInput } from "../components/PortfolioDateInput";
import { useSkillsPortfolio } from "../lib/skillsPortfolio";
import { SKILLS_PORTFOLIO, portfolioReportHtml, profilePortfolioDefaults, validatePortfolioImport, type PortfolioTable } from "../lib/skillsPortfolioContent";
import { mergeProgressEvidence } from "../lib/progressEvidence";
import { savedWorkbookAnswers, savedLessonAnswers, savedLessonQuizResults, savedAcademicWorkHtml } from "../lib/academicEvidence";
import { useSavedLessonQuizzes } from "../lib/useSavedLessonQuizzes";
import { WORKBOOK_SPECS } from "../data/workbookSpecs";
import "./admin-dashboard.css";
import "./evidence-register.css";

const existingItems = ["EEA1", "Certified ID copy", "Signed class register", "Certificate of completion", "Signed learnership + employment contract", "Invoice + proof of payment", "12-month payroll summary", "First, middle and last payslip", "EMP201 for measured period", "Proof of payment for first and last EMP201", "SETA registration", "WSP / ATR / Pivotal report", "Proof of submission to SETA", "SETA approval", "Eruditio accreditation proof"];
const oldKey = (text: string) => "sde-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
function filename(label: string, original: string, learner: string) {
  const clean = (text: string, max: number) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, max).replace(/-$/, "");
  return `${clean(label, 42) || "Evidence"}-${clean(learner, 32) || "Learner"}${original.match(/\.[a-z0-9]{1,10}$/i)?.[0] ?? ""}`;
}
function formatPortfolioReviewDate(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "Date not recorded";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}
function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function EvidenceRegisterPage({ profile }: { profile: Profile }) {
  return isAdminRole(profile.role) ? <SkillsRegister profile={profile} /> : <div className="card"><h1>Administrator access required</h1></div>;
}
function SkillsRegister({ profile }: { profile: Profile }) {
  const [cloud, setCloud] = useState<CloudLearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void fetchCloudLearnerData().then(data => { if (alive) setCloud(data); })
      .catch(() => { if (alive) setError("Could not load learners. Please retry."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refresh]);
  const local = loadProfiles();
  const learners = [...local.map(p => mergeProfileWithCloud(p, cloud)), ...(cloud ? remoteOnlyProfiles(local, cloud.profiles) : [])].filter(p => p.role === "Learner").sort((a, b) => a.name.localeCompare(b.name));
  const [learnerId, setLearnerId] = useState("");
  const learner = learners.find(p => p.id === learnerId) ?? learners[0];
  const aliases = learner ? [...cloudProfileIds(learner, cloud)] : [];
  const lessonEvidence = useSavedLessonQuizzes(aliases, refresh);
  const progress = aliases.reduce<ProgressState>((result, id) => mergeProgressEvidence(mergeProgressEvidence(result, loadProgress(id)), cloud?.progress[id] ?? { units: {} }), { units: {} });
  const record = useSkillsPortfolio(learner?.id ?? "");
  const { docs: localDocs, saveDoc } = usePoe(learner?.id ?? "");
  const cloudDocs = learner ? Object.assign({}, ...[...cloudProfileIds(learner, cloud)].map(id => cloud?.poe[id] ?? {})) as Record<string, PoeDoc> : {};
  const docs = { ...cloudDocs, ...localDocs };
  const existingDocuments = [...Object.entries(docs), ...Object.entries(record.values).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value) ? [[key, value.doc] as [string, PoeDoc]] : [])]
    .filter(([, doc], index, all) => all.findIndex(([, other]) => (other.path || other.data || other.name) === (doc.path || doc.data || doc.name)) === index);
  const linkedDocuments: typeof record.values = {};
  const administration = SKILLS_PORTFOLIO.find(item => item.id === "section-3");
  administration?.blocks.forEach(block => {
    if (block.kind !== "table") return;
    block.rows.forEach((row, index) => {
      const label = row[0]?.text ?? "";
      const keys = /Identity document/i.test(label) ? ["id-copy", "gm-id-copy", oldKey("Certified ID copy")]
        : /Learnership agreement/i.test(label) ? ["agreement", "gm-agreement", oldKey("Signed learnership + employment contract")]
        : /SETA enrolment/i.test(label) ? [oldKey("SETA registration")] : [];
      const found = keys.map(key => docs[key]).find(Boolean);
      if (found) linkedDocuments[`doc.section-3.${block.id}-${index}`] = { doc: found };
    });
  });
  const values = { ...(learner ? profilePortfolioDefaults(learner) : {}), ...linkedDocuments, ...record.values };
  const [sectionId, setSectionId] = useState(SKILLS_PORTFOLIO[0].id);
  const [search, setSearch] = useState("");
  const section = SKILLS_PORTFOLIO.find(section => section.id === sectionId);
  const unitId = section?.title.match(/^Unit standard (\d+)$/)?.[1];
  const unitProgress = unitId ? progress.units[unitId] : undefined;
  const unitLessons = unitId ? lessonEvidence.lessons[unitId] ?? [] : [];
  const workbookAnswerCount = savedWorkbookAnswers(unitProgress).length;
  const lessonAnswerCount = savedLessonAnswers(unitLessons).length;
  const completedQuizCount = savedLessonQuizResults(unitLessons).filter(quiz => quiz.completed).length;
  const platformWorkLoading = loading || lessonEvidence.loading;
  const hasPlatformWork = workbookAnswerCount > 0 || lessonAnswerCount > 0 || completedQuizCount > 0;
  const [upload, setUpload] = useState<{ id: string; label: string; oldId?: string } | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [review, setReview] = useState<{ id: string; label: string; fallback?: PoeDoc; oldId?: string } | null>(null);
  const [existingTarget, setExistingTarget] = useState<{ id: string; label: string } | null>(null);
  const [existingKey, setExistingKey] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const disabled = !learner || record.loading || record.saving || !!record.error || uploadPct !== null;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (record.dirty || uploadPct !== null) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [record.dirty, uploadPct]);
  async function uploadEvidence(file: File) {
    if (!learner || !upload) return;
    const target = upload;
    setError("");
    if (file.size > 10 * 1024 * 1024) { setError("Files must be 10 MB or smaller."); return; }
    setUploadPct(0);
    try {
      const prefix = await userPrefix();
      const doc = await uploadFile(`${prefix}/poe/${learner.id}/${target.oldId ?? target.id.replace(/\./g, "-")}`, file, setUploadPct);
      const named = { ...doc, name: filename(target.label, file.name, learner.name) };
      if (!saveDoc(target.oldId ?? target.id.replace(/\./g, "-"), named)) throw new Error("Could not retain the document. Free storage space and try again.");
      record.update(target.id, { doc: named });
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUpload(null); setUploadPct(null); }
  }
  function attachmentRecord(id: string, fallback?: PoeDoc) {
    const value = values[id];
    if (value === false) return undefined;
    return value && typeof value === "object" && !Array.isArray(value) ? value : fallback ? { doc: fallback } : undefined;
  }
  const reviewItem = review ? attachmentRecord(review.id, review.fallback) : undefined;
  function attachment(id: string, label: string, fallback?: PoeDoc, oldId?: string) {
    const item = attachmentRecord(id, fallback);
    return <div className={`portfolio-evidence${item ? " has-document" : " is-empty"}`} key={id}>
      {item && <div className="portfolio-attachment-name" title={item.doc.name}><Icon name="upload" size={16} /><span>{item.doc.name}</span></div>}
      {item ? <div className="portfolio-review-line">
        <span className={`portfolio-evidence-status${item.status === 'Verified' ? ' verified' : ''}`}>{item.status ?? 'Pending verification'}</span>
        <button type="button" className="btn ghost" aria-label={`Manage evidence: ${label}`} onClick={() => setReview({ id, label, fallback, oldId })}>Manage</button>
      </div> : <button type="button" className="btn ghost evidence-icon-action" aria-label="Upload evidence" title={`Upload evidence: ${label}`} disabled={disabled} onClick={() => { setUpload({ id, label, oldId }); fileInput.current?.click(); }}>{upload?.id === id && uploadPct !== null ? <span>{uploadPct}%</span> : <Icon name="upload" size={16} />}</button>}
      {!item && existingDocuments.length > 0 && <button type="button" className="btn ghost evidence-icon-action" aria-label="Use existing document" title={`Use existing document: ${label}`} disabled={disabled} onClick={() => { setExistingKey(""); setExistingTarget({ id, label }); }}><Icon name="folder" size={16} /></button>}
    </div>;
  }
  function renderTable(block: PortfolioTable) {
    const stored = values[`extra.${block.id}`];
    const extra = Array.isArray(stored) ? stored : [];
    const rows = [...block.rows, ...extra.map((row, ri) => row.map((text, ci) => ({ id: `${block.id}-extra-${ri}-${ci}`, text, fixed: false })))];
    const results = block.headers.some(header => /C\s*\/\s*NYC/i.test(header));
    function cellControl(cell: { id: string; text: string }, ri: number, ci: number) {
      const header = block.headers[ci] ?? "Value";
      const value = ri < block.rows.length ? String(values[cell.id] ?? "") : cell.text;
      const onChange = (value: string) => {
        if (ri < block.rows.length) record.update(cell.id, value);
        else { const next = extra.map(row => [...row]); next[ri - block.rows.length][ci] = value; record.update(`extra.${block.id}`, next); }
      };
      if (/C\s*\/\s*NYC/i.test(header)) {
        const options = [{ value: "", label: "Not recorded" }, { value: "C", label: "Competent (C)" }, { value: "NYC", label: "Not yet competent (NYC)" }, { value: "Recognised", label: "Recognised" }];
        if (value && !options.some(option => option.value === value)) options.push({ value, label: value });
        return <Select ariaLabel={`${header}, row ${ri + 1}`} value={value} options={options} disabled={disabled} onChange={onChange} />;
      }
      const label = `${header}, row ${ri + 1}`;
      if (/\bdates?\b/i.test(header)) return <PortfolioDateInput label={label} value={value} disabled={disabled} onChange={onChange} />;
      return /description|finding|outcome|activities|scope|details|criteria|information|recorded|completed|parties|control/i.test(header)
        ? <textarea aria-label={label} disabled={disabled} rows={1} value={value} onChange={event => onChange(event.target.value)} />
        : <input type="text" aria-label={label} placeholder={sectionId === "section-3" ? "Add reference or note" : undefined} disabled={disabled} value={value} onChange={event => onChange(event.target.value)} />;
    }
    return <div className="portfolio-table" key={block.id}><div className="card poe-table-card"><table className={`data poe-table portfolio-data-table${results ? " portfolio-results-table" : ""}${sectionId === "section-3" ? " portfolio-administration-table" : ""}`}>
      {sectionId === "section-3" && <colgroup><col style={{ width: "36%" }} /><col style={{ width: "22%" }} /><col style={{ width: "42%" }} /></colgroup>}
      {results && <colgroup><col style={{ width: "11%" }} /><col style={{ width: "8%" }} /><col style={{ width: "25%" }} /><col style={{ width: "27%" }} /><col style={{ width: "29%" }} /></colgroup>}
      <thead><tr>{block.headers.map((header, i) => <th key={i}>{header}</th>)}<th>Evidence & verification</th></tr></thead>
      <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={cell.id}>{cell.fixed ? cell.text : cellControl(cell, ri, ci)}</td>)}<td>{attachment(`doc.${sectionId}.${block.id}-${ri}`, row[0]?.text || `${section?.title ?? "Portfolio"} row ${ri + 1}`)}</td></tr>)}</tbody>
    </table></div><button type="button" className="btn ghost" disabled={disabled} onClick={() => record.update(`extra.${block.id}`, [...extra, block.headers.map(() => "")])}>+ Add row</button></div>;
  }
  async function importData(file: File) {
    if (!learner) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Choose an export smaller than 5 MB.");
      for (const [key, value] of Object.entries(validatePortfolioImport(JSON.parse(await file.text()), learner.id))) record.update(key, value);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Import failed."); }
  }
  const filtered = SKILLS_PORTFOLIO.filter(item => `${item.title} ${item.blocks.filter(block => block.kind === "text").map(block => block.text).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="admin-overview evidence-register-page">
    <header className="portfolio-page-header">
      <div className="portfolio-heading-copy"><span className="portfolio-eyebrow">LEARNING &amp; DEVELOPMENT</span><h1>Skills Development evidence register</h1><p>Learner portfolios, assessment and verification records.</p></div>
    </header>
    <div className={`card evidence-register-toolbar${record.dirty ? " has-unsaved-changes" : ""}`}>
      <div className="evidence-learner-picker"><strong>Learner portfolio</strong><Select value={learner?.id ?? ""} ariaLabel="Choose learner portfolio" disabled={uploadPct !== null || record.saving || !learners.length}
        placeholder={loading ? "Loading learners…" : "No learners available"} options={learners.map(p => ({ value: p.id, label: p.name, hint: p.enrolment?.email }))}
        onChange={async id => { if (record.dirty && !await record.save()) return; setReview(null); setExistingTarget(null); setLearnerId(id); setError(""); }} /></div>
      <div className="portfolio-actions">
        <button type="button" className="btn primary" disabled={disabled} onClick={() => void record.save()}>{record.saving ? "Saving…" : "Save changes"}</button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => learner && downloadText(filename("Skills-Evidence", ".json", learner.name), JSON.stringify({ format: "itss-skills-portfolio-v1", learnerId: learner.id, learner: learner.name, exportedAt: new Date().toISOString(), values }, null, 2), "application/json")}>Export data</button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => importInput.current?.click()}>Import data</button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => learner && downloadText(filename("Skills-Portfolio", ".html", learner.name), portfolioReportHtml(learner, values), "text/html;charset=utf-8")}>Download portfolio</button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => { if (!learner) return; const view = window.open("", "_blank"); if (view) { view.document.write(portfolioReportHtml(learner, values)); view.document.close(); view.focus(); view.print(); } }}>Print / save PDF</button>
      </div>
      <p role="status" aria-live="polite">{record.loading ? "Loading portfolio…" : record.saving ? "Saving changes…" : record.dirty ? "Unsaved changes — draft retained on this device." : "All changes saved."}</p>
    </div>
    {(error || record.error) && <div className="card" role="alert"><p>{error || record.error}</p><button type="button" className="btn" onClick={() => { setError(""); record.refresh(); setRefresh(value => value + 1); }}>Retry</button></div>}
    {!loading && !learners.length && <p className="card">No learners are available.</p>}
    {learner && <div className="portfolio-layout">
      <nav className="card portfolio-navigation" aria-label="Portfolio sections">
        <label className="portfolio-field">Find a section<input type="search" placeholder="Title or unit standard" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <Select value={sectionId} ariaLabel="Portfolio section" options={[...filtered.map(item => ({ value: item.id, label: `${SKILLS_PORTFOLIO.indexOf(item) + 1}. ${item.title}` })), { value: "existing", label: "Existing evidence checklist" }]} onChange={setSectionId} />
        <p className="muted">50 portfolio sections · records are saved separately for each learner.</p>
      </nav>
      <section className="card portfolio-content" aria-label={section?.title ?? "Existing evidence checklist"} aria-busy={record.loading}>
        {section ? <>{section.id === "section-1" ? <div className="portfolio-overview-heading"><h2>{section.title}</h2>{section.blocks.slice(0, 2).map(block => block.kind === "text" ? <span key={block.id}>{block.text}</span> : null)}</div> : <h2 className="section-title">{section.title}</h2>}
        {section.id === 'section-50' && <div className="portfolio-table"><h3>All learners on the platform</h3>
          <button type="button" className="btn ghost" onClick={() => {
            const rows = [['Learner','Email','Employer','Profile created','Last sign-in'], ...learners.map(p => [p.name,p.enrolment?.email ?? '',p.enrolment?.employer ?? '',p.createdAt,p.lastLogin ?? ''])];
            downloadText('learner-register.csv', rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g,'""') + '"').join(',')).join('\n'), 'text/csv;charset=utf-8');
          }}>Download learner register CSV</button>
          <div className="poe-table-card"><table className="data poe-table"><thead><tr><th>Learner</th><th>Email</th><th>Employer / host</th><th>Recorded units</th></tr></thead><tbody>{learners.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.enrolment?.email ?? '—'}</td><td>{p.enrolment?.employer ?? '—'}</td><td>{Object.keys(cloud?.progress[p.id]?.units ?? {}).length}</td></tr>)}</tbody></table></div>
        </div>}
        {unitId && <aside className="portfolio-live-evidence" aria-label="Recorded platform work">
          <div className="portfolio-live-summary"><h3>Recorded platform work</h3>
            <p>{platformWorkLoading ? "Loading saved learner work..." : hasPlatformWork
              ? `${workbookAnswerCount} workbook answers \u00b7 ${lessonAnswerCount} lesson-quiz answers \u00b7 ${completedQuizCount} completed quizzes`
              : lessonEvidence.error ? "Saved learner work could not be fully loaded." : "No saved workbook or lesson-quiz work for this unit yet."}</p>
            {lessonEvidence.error && <p role="alert">{lessonEvidence.error}</p>}
          </div>
          {hasPlatformWork && <button type="button" className="btn ghost" disabled={platformWorkLoading || !learner} onClick={() => learner && downloadText(filename(`US-${unitId}-Saved-Work`, ".html", learner.name), `<!doctype html><html><meta charset="utf-8"><title>Saved learner work</title>${savedAcademicWorkHtml(unitProgress, WORKBOOK_SPECS[unitId], unitLessons)}</html>`, "text/html;charset=utf-8")}>Download recorded learner work</button>}
        </aside>}
        <div className="portfolio-fields">{section.blocks.map((block, index) => {
          if (section.id === "section-1" && index < 2 && block.kind === "text") return null;
          if (block.kind === "text") return /^h/.test(block.level) ? <h3 key={block.id}>{block.text}</h3> : <p key={block.id}>{block.text}</p>;
          if (block.kind === "table") return renderTable(block);
          const value = values[block.id];
          if (block.type === "checkbox") return <label className="portfolio-check" key={block.id}><input type="checkbox" checked={value === true} disabled={disabled} onChange={event => record.update(block.id, event.target.checked)} />{block.label}</label>;
          return <label className="portfolio-field" key={block.id}>{block.label}{block.type === "select" ? <Select ariaLabel={block.label} value={String(value ?? "")} disabled={disabled} options={block.options ?? []} onChange={value => record.update(block.id, value)} />
            : /\bdates?\b/i.test(block.label) || block.type === "date" ? <PortfolioDateInput label={block.label} value={String(value ?? "")} disabled={disabled} onChange={value => record.update(block.id, value)} />
            : block.type === "textarea" ? <textarea value={String(value ?? "")} disabled={disabled} onChange={event => record.update(block.id, event.target.value)} />
            : <input type="text" value={String(value ?? "")} disabled={disabled} onChange={event => record.update(block.id, event.target.value)} />}</label>;
        })}</div><h3>Section evidence</h3>{attachment(`doc.${section.id}.supporting`, section.title)}
          <div className="portfolio-bottom-nav"><button type="button" className="btn ghost" disabled={SKILLS_PORTFOLIO.indexOf(section) === 0} onClick={() => setSectionId(SKILLS_PORTFOLIO[SKILLS_PORTFOLIO.indexOf(section) - 1].id)}>Previous section</button><span>{SKILLS_PORTFOLIO.indexOf(section) + 1} / 50</span><button type="button" className="btn ghost" disabled={SKILLS_PORTFOLIO.indexOf(section) === 49} onClick={() => setSectionId(SKILLS_PORTFOLIO[SKILLS_PORTFOLIO.indexOf(section) + 1].id)}>Next section</button></div>
        </> : <><h2 className="section-title">Existing evidence checklist</h2>{existingItems.map(label => { const key = oldKey(label); return <div className="portfolio-legacy-item" key={key}><h3>{label}</h3>{attachment(`doc.existing.${key}`, label, docs[key] ?? (label === "Certified ID copy" ? docs["id-copy"] ?? docs["gm-id-copy"] : undefined), key)}</div>; })}</>}
      </section>
    </div>}
    <input ref={fileInput} type="file" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadEvidence(file); }} />
    {review && reviewItem && <Modal className="portfolio-review-modal" title="Manage evidence" onClose={() => setReview(null)} actions={<button type="button" className="btn primary" onClick={() => setReview(null)}>Done</button>}>
      <div className="portfolio-review-document"><span className="portfolio-review-context">{review.label}</span><div className="portfolio-review-file"><Icon name="file" size={18} /><p className="portfolio-review-filename">{reviewItem.doc.name}</p></div></div>
      <div className="portfolio-actions">
        {existingDocuments.length > 0 && <button type="button" className="btn ghost" disabled={disabled} onClick={() => { setExistingKey(""); setExistingTarget({ id: review.id, label: review.label }); setReview(null); }}>Use existing document</button>}
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => {
          record.update(review.id, false);
          setReview(null);
        }} data-action="remove">Remove document</button>
        <button type="button" className="btn ghost" disabled={disabled} onClick={() => { setUpload({ id: review.id, label: review.label, oldId: review.oldId }); fileInput.current?.click(); }}>Replace evidence</button>
        <button type="button" className="btn ghost" onClick={() => void downloadDoc({ ...reviewItem.doc, name: filename(review.label, reviewItem.doc.name, learner?.name ?? 'Learner') }).catch(() => setError('Could not download evidence. Please retry.'))}>Download</button>
      </div>
      <label className="portfolio-field">Verification status<Select ariaLabel={`Verification: ${review.label}`} value={reviewItem.status ?? 'Pending verification'} disabled={disabled} options={['Pending verification','Verified','Needs correction','Not applicable'].map(value => ({value,label:value}))} onChange={status => record.update(review.id, { ...reviewItem, status, reviewer: profile.name, reviewedAt: new Date().toISOString() })} /></label>
      <p className="portfolio-review-audit">{reviewItem.status ?? 'Pending verification'}{reviewItem.reviewer ? ` by ${reviewItem.reviewer} · ${formatPortfolioReviewDate(reviewItem.reviewedAt)}` : ''}</p>
      <label className="portfolio-field">Verification notes<textarea aria-label={`Verification notes: ${review.label}`} value={reviewItem.note ?? ''} disabled={disabled} onChange={event => record.update(review.id, { ...reviewItem, note: event.target.value })} /></label>
    </Modal>}
    {existingTarget && <Modal className="portfolio-existing-document-modal" title={`Use existing document - ${existingTarget.label}`} onClose={() => setExistingTarget(null)} actions={<button type="button" className="btn primary" disabled={disabled || !existingKey} onClick={() => {
      const selected = existingDocuments.find(([key]) => key === existingKey);
      if (!selected) return;
      record.update(existingTarget.id, { doc: selected[1] });
      setExistingTarget(null);
    }}>Link document</button>}>
      <p>Choose a document already uploaded for {learner?.name}.</p>
      <Select ariaLabel="Existing uploaded document" value={existingKey} placeholder="Choose an uploaded document" options={existingDocuments.map(([key, doc]) => ({ value: key, label: doc.name, hint: key }))} onChange={setExistingKey} />
      <p>Reuses the existing file. Verification is recorded separately for this portfolio entry.</p>
    </Modal>}
    <input ref={importInput} type="file" hidden accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importData(file); }} />
  </div>;
}
