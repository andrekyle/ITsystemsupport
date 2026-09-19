import React, { useRef, useState } from "react";
import { Icon } from "../icons";
import { DateTimePicker } from "./DateTimePicker";
import { InlineText, InlineIconBtn } from "./InlineText";
import type { LogbookChecklistRow, LogbookSpec, PoeDoc } from "../types";
import { deleteFile, downloadDoc, uploadFile, userPrefix } from "../lib/files";
import { autoGrowTextarea } from "../lib/autoGrow";
import { ConfirmModal } from "./Modal";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type RowListKey = "knowledgeQuestions" | "practicalActivities";

function ChecklistRows({
  rows,
  startNo,
  values,
  onChange,
  editable,
  onEdit,
}: {
  rows: LogbookChecklistRow[];
  startNo: number;
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  editable?: boolean;
  /** edit-mode mutations of the row list itself */
  onEdit?: (mutate: (list: LogbookChecklistRow[]) => void) => void;
}) {
  return (
    <>
      {rows.map((row, i) => (
        <tr key={i}>
          <td className="lb-no">{startNo + i}</td>
          <td>
            {editable && onEdit ? (
              <div className="lb-edit-row">
                <InlineText value={row.text} editable multiline placeholder="Checklist item" onSave={(text) => onEdit((list) => { list[i].text = text; })} />
                <span className="lb-edit-ctls">
                  <InlineIconBtn title="Move up" icon="chevronUp" onClick={() => onEdit((list) => { if (i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]]; })} />
                  <InlineIconBtn title="Move down" icon="chevronDown" onClick={() => onEdit((list) => { if (i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]]; })} />
                  <InlineIconBtn title="Insert row below" icon="plus" onClick={() => onEdit((list) => { list.splice(i + 1, 0, { text: "New checklist item", marks: list[i].marks.slice() }); })} />
                  <InlineIconBtn title="Delete row" icon="trash" danger onClick={() => onEdit((list) => { list.splice(i, 1); })} />
                </span>
              </div>
            ) : (
              row.text
            )}
          </td>
          {row.marks.map((def, ci) => {
            const key = `ec:${startNo + i}:${ci}`;
            const stored = values[key];
            const on = editable ? def : typeof stored === "boolean" ? stored : def;
            return (
              <td key={ci} className="lb-mark">
                <button
                  type="button"
                  className={`lb-markbtn${on ? " on" : ""}`}
                  onClick={() => (editable && onEdit ? onEdit((list) => { list[i].marks[ci] = !def; }) : onChange(key, !on))}
                  aria-pressed={on}
                  title={editable ? (on ? "Default: marked — click to clear" : "Default: not marked — click to mark") : on ? "Remove mark" : "Mark"}
                >
                  <Icon name={on ? "checkCircle" : "circle"} size={15} />
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

const SIX_COLS_HEADERS = [
  "Learner Activity",
  "Logbook Activity",
  "Project",
  "Learner Manual",
  "Logbook Activity",
  "Project",
];

function HeaderRows({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <tr className="lb-headrow">
        <th colSpan={2} rowSpan={3} className="lb-title">
          {title}
          {subtitle && <span className="sub">{subtitle}</span>}
        </th>
        <th colSpan={6}>Evidence checklist</th>
      </tr>
      <tr className="lb-headrow">
        <th colSpan={3}>Workplace</th>
        <th colSpan={3}>Assessor</th>
      </tr>
      <tr className="lb-headrow">
        {SIX_COLS_HEADERS.map((h, i) => (
          <th key={i}>{h}</th>
        ))}
      </tr>
    </>
  );
}

export interface LogbookValues {
  [key: string]: string | boolean;
}

interface LogbookProps {
  spec: LogbookSpec;
  values: LogbookValues;
  onChange: (key: string, value: string | boolean) => void;
  /** super-user edit mode: every heading, row and default mark of the structure is editable in place */
  editable?: boolean;
  onSpecChange?: (spec: LogbookSpec) => void;
}

export function Logbook({ spec, values, onChange, editable = false, onSpecChange }: LogbookProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  /** file chosen but not yet saved — committed by the Save report button */
  const [pending, setPending] = useState<File | null>(null);
  const editing = editable && !!onSpecChange;
  const update = (mutate: (draft: LogbookSpec) => void) => {
    if (!onSpecChange) return;
    const draft = structuredClone(spec);
    mutate(draft);
    onSpecChange(draft);
  };
  const editRows = (key: RowListKey) => (mutate: (list: LogbookChecklistRow[]) => void) => update((draft) => mutate(draft[key]));
  const text = (value: string, onSave: (text: string) => void, options: { as?: "span" | "div" | "p" | "strong"; className?: string; placeholder?: string; multiline?: boolean } = {}) => (
    <InlineText value={value} editable={editing} onSave={onSave} as={options.as} className={options.className} placeholder={options.placeholder} multiline={options.multiline} />
  );
  const addButton = (label: string, onClick: () => void) => (
    <button type="button" className="btn ghost sm plan-add" onClick={onClick}><Icon name="plus" size={13} /> {label}</button>
  );
  const projectDoc: PoeDoc | null = (() => {
    const raw = values["project.upload"];
    if (typeof raw !== "string" || !raw) return null;
    try { return JSON.parse(raw) as PoeDoc; } catch { return null; }
  })();

  function onProjectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`"${file.name}" is too large — files must be 10 MB or smaller.`);
      return;
    }
    // stage only — nothing is uploaded until the learner presses Save report
    setPending(file);
  }

  async function saveReport() {
    if (!pending || uploadPct !== null) return;
    const file = pending;
    const previous = projectDoc;
    setUploadError(null);
    setUploadPct(0);
    try {
      const prefix = await userPrefix();
      const doc = await uploadFile(`${prefix}/logbook`, file, setUploadPct);
      onChange("project.upload", JSON.stringify(doc));
      // the replaced report is no longer referenced — clean it out of storage
      if (previous?.path && previous.path !== doc.path) void deleteFile(previous.path);
      setPending(null);
    } catch {
      setUploadError("The file could not be saved — check your connection and try again.");
    }
    setUploadPct(null);
  }

  function cancelPending() {
    setPending(null);
    setUploadError(null);
  }

  function removeReport() {
    setConfirmRemove(false);
    if (projectDoc?.path) void deleteFile(projectDoc.path);
    onChange("project.upload", "");
    setUploadError(null);
  }

  const field = (k: string, placeholder = "") => (
    <input
      className="lb-input"
      type="text"
      value={(values[k] as string) ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(k, e.target.value)}
    />
  );
  const area = (k: string, label: string) => (
    <div className="lb-feedback-box">
      <span className="muted">{label}</span>
      <textarea
        className="lb-textarea"
        ref={(el) => autoGrowTextarea(el)}
        value={(values[k] as string) ?? ""}
        onChange={(e) => onChange(k, e.target.value)}
        onInput={(e) => autoGrowTextarea(e.currentTarget)}
      />
    </div>
  );
  const check = (k: string, label: string) => (
    <label className="lb-checkbox" key={k}>
      <input
        type="checkbox"
        checked={!!values[k]}
        onChange={(e) => onChange(k, e.target.checked)}
      />
      {label}
    </label>
  );
  const multiline = (k: string) => (
    <textarea
      className="lb-textarea lb-cellarea"
      ref={(el) => autoGrowTextarea(el)}
      rows={3}
      value={(values[k] as string) ?? ""}
      onChange={(e) => onChange(k, e.target.value)}
      onInput={(e) => autoGrowTextarea(e.currentTarget)}
    />
  );
  const dateField = (k: string) => (
    <DateTimePicker
      className="bare"
      withTime={false}
      value={(values[k] as string) ?? ""}
      onChange={(v) => onChange(k, v)}
      placeholder="Select date"
      ariaLabel="Pick date"
    />
  );

  return (
    <div className={`logbook${editing ? " lb-editing" : ""}`}>
      <h2 className="section-title">
        <span className="ico">
          <Icon name="book" size={20} />
        </span>
        Learner Logbook — {text(spec.assignmentTitle, (v) => update((d) => { d.assignmentTitle = v || "Assignment One"; }), { placeholder: "Assignment title" })}
      </h2>
      <p className="muted" style={{ marginTop: -6 }}>
        {text(spec.programme, (v) => update((d) => { d.programme = v; }), { placeholder: "Programme" })} · {text(spec.unitLabel, (v) => update((d) => { d.unitLabel = v; }), { placeholder: "Unit standard" })} · All fields are editable and saved to your profile.
      </p>

      {/* Learner details */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Learner details</div>
        <table className="data kv lb-details">
          <tbody>
            {spec.detailFields.map((f, fi) => (
              <tr key={fi}>
                <td className="k">
                  {editing ? (
                    <span className="lb-edit-row">
                      {text(f, (v) => update((d) => { d.detailFields[fi] = v; }), { placeholder: "Field label" })}
                      <span className="lb-edit-ctls">
                        <InlineIconBtn title="Move up" icon="chevronUp" onClick={() => update((d) => { if (fi > 0) [d.detailFields[fi - 1], d.detailFields[fi]] = [d.detailFields[fi], d.detailFields[fi - 1]]; })} />
                        <InlineIconBtn title="Move down" icon="chevronDown" onClick={() => update((d) => { if (fi < d.detailFields.length - 1) [d.detailFields[fi + 1], d.detailFields[fi]] = [d.detailFields[fi], d.detailFields[fi + 1]]; })} />
                        <InlineIconBtn title="Remove field" icon="trash" danger onClick={() => update((d) => { d.detailFields.splice(fi, 1); })} />
                      </span>
                    </span>
                  ) : f}
                </td>
                <td className="lb-fill">
                  {f === "Start & Completion Date" ? (
                    <span className="lb-daterange">
                      {dateField("detail:Start Date")}
                      <span className="muted">to</span>
                      {dateField("detail:Completion Date")}
                    </span>
                  ) : (
                    field(`detail:${f}`)
                  )}
                </td>
              </tr>
            ))}
            {editing && (
              <tr>
                <td colSpan={2}>{addButton("Add detail field", () => update((d) => { d.detailFields.push("New field"); }))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Project task */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Logbook project</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Time</th>
              <th>Activity</th>
              <th style={{ width: 110 }}>Resources</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{text(spec.project.time, (v) => update((d) => { d.project.time = v; }), { placeholder: "e.g. 30 minutes" })}</td>
              <td>
                {text(spec.project.title, (v) => update((d) => { d.project.title = v; }), { as: "strong", placeholder: "Project title" })}
                <br />
                {text(spec.project.text, (v) => update((d) => { d.project.text = v; }), { placeholder: "Project instructions", multiline: true })}
                <div className="lb-upload">
                  {pending ? (
                    <>
                      <span className="lb-pending-chip">
                        <Icon name="document" size={14} />
                        {pending.name}
                      </span>
                      <span className="muted lb-attach-meta">
                        {fmtSize(pending.size)} · not saved yet
                      </span>
                      <button
                        type="button"
                        className="btn solid sm"
                        disabled={uploadPct !== null}
                        onClick={() => void saveReport()}
                        title="Save this report to your logbook"
                      >
                        <Icon name="checkCircle" size={14} />
                        {uploadPct !== null ? `Saving… ${uploadPct}%` : "Save report"}
                      </button>
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={uploadPct !== null}
                        onClick={cancelPending}
                      >
                        Cancel
                      </button>
                    </>
                  ) : projectDoc ? (
                    <>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => void downloadDoc(projectDoc)}
                        title="Download your uploaded report"
                      >
                        <Icon name="document" size={14} />
                        {projectDoc.name}
                      </button>
                      <span className="muted lb-attach-meta">
                        {fmtSize(projectDoc.size)}
                        {projectDoc.uploadedAt
                          ? ` · uploaded ${new Date(projectDoc.uploadedAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : ""}
                      </span>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => fileRef.current?.click()}
                        title="Choose a new file to replace this one — you'll press Save to confirm"
                      >
                        <Icon name="folder" size={15} />
                        Replace report
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setConfirmRemove(true)}
                        title="Remove this report from your logbook"
                      >
                        <Icon name="close" size={14} />
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Icon name="folder" size={15} />
                      Upload my report
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.odt,.rtf,.txt,image/*"
                    onChange={onProjectFile}
                  />
                  {uploadError && <span className="lb-upload-error">{uploadError}</span>}
                </div>
                {confirmRemove && projectDoc && (
                  <ConfirmModal
                    title="Remove uploaded report?"
                    message={
                      <>
                        <strong>{projectDoc.name}</strong> will be removed from your logbook. You
                        can upload a new report at any time.
                      </>
                    }
                    confirmLabel="Remove report"
                    danger
                    onConfirm={removeReport}
                    onCancel={() => setConfirmRemove(false)}
                  />
                )}
              </td>
              <td>{text(spec.project.resource, (v) => update((d) => { d.project.resource = v; }), { placeholder: "e.g. Logbook" })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Evidence checklist */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>
          Evidence checklist
        </div>
        {editing && (
          <p className="muted lb-edit-hint">
            Click a row to edit its text. Clicking a mark sets the default evidence mark for that row; learners can still adjust their own marks.
          </p>
        )}
        <div className="lb-scroll">
          <table className="data lb-matrix">
            <tbody>
              <HeaderRows
                title="Specific outcome & assessment criteria"
                subtitle="Embedded knowledge questions"
              />
              <ChecklistRows
                rows={spec.knowledgeQuestions}
                startNo={1}
                values={values}
                onChange={onChange}
                editable={editing}
                onEdit={editRows("knowledgeQuestions")}
              />
              {editing && (
                <tr className="lb-add-row">
                  <td colSpan={8}>{addButton("Add knowledge question", () => update((d) => { d.knowledgeQuestions.push({ text: "New knowledge question", marks: [true, false, false, true, false, false] }); }))}</td>
                </tr>
              )}
              <HeaderRows title="Practical activities" />
              <ChecklistRows
                rows={spec.practicalActivities}
                startNo={spec.knowledgeQuestions.length + 1}
                values={values}
                onChange={onChange}
                editable={editing}
                onEdit={editRows("practicalActivities")}
              />
              {editing && (
                <tr className="lb-add-row">
                  <td colSpan={8}>{addButton("Add practical activity", () => update((d) => { d.practicalActivities.push({ text: "New practical activity", marks: [false, true, false, false, true, false] }); }))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workplace activities */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Workplace activities</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>
                Activity
                <span className="sub">
                  These activities must be completed or complied to by the learner in the workplace.
                </span>
              </th>
              <th>
                Evidence
                <span className="sub">{text(spec.workplaceEvidenceNote, (v) => update((d) => { d.workplaceEvidenceNote = v; }), { placeholder: "Evidence note", multiline: true })}</span>
              </th>
              <th style={{ width: 100 }}>Workplace</th>
              <th style={{ width: 90 }}>Learner</th>
            </tr>
          </thead>
          <tbody>
            {spec.workplaceActivities.map((a, i) => (
              <tr key={i}>
                <td>
                  {editing ? (
                    <div className="lb-edit-row">
                      {text(a, (v) => update((d) => { d.workplaceActivities[i] = v; }), { placeholder: "Workplace activity", multiline: true })}
                      <span className="lb-edit-ctls">
                        <InlineIconBtn title="Move up" icon="chevronUp" onClick={() => update((d) => { if (i > 0) [d.workplaceActivities[i - 1], d.workplaceActivities[i]] = [d.workplaceActivities[i], d.workplaceActivities[i - 1]]; })} />
                        <InlineIconBtn title="Move down" icon="chevronDown" onClick={() => update((d) => { if (i < d.workplaceActivities.length - 1) [d.workplaceActivities[i + 1], d.workplaceActivities[i]] = [d.workplaceActivities[i], d.workplaceActivities[i + 1]]; })} />
                        <InlineIconBtn title="Delete activity" icon="trash" danger onClick={() => update((d) => { d.workplaceActivities.splice(i, 1); })} />
                      </span>
                    </div>
                  ) : a}
                </td>
                <td className="lb-fill">{multiline(`wpa:${i}:evidence`)}</td>
                <td className="lb-fill">{field(`wpa:${i}:workplace`)}</td>
                <td className="lb-fill">{field(`wpa:${i}:learner`)}</td>
              </tr>
            ))}
            {editing && (
              <tr className="lb-add-row">
                <td colSpan={4}>{addButton("Add workplace activity", () => update((d) => { d.workplaceActivities.push("New workplace activity"); }))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Other activities */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Other activities</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>
                Activity
                <span className="sub">These activities have to be completed by the learner.</span>
              </th>
              <th>
                Evidence
                <span className="sub">{text(spec.otherEvidenceNote, (v) => update((d) => { d.otherEvidenceNote = v; }), { placeholder: "Evidence note", multiline: true })}</span>
              </th>
              <th style={{ width: 100 }}>Assessor</th>
              <th style={{ width: 90 }}>Learner</th>
            </tr>
          </thead>
          <tbody>
            {spec.otherActivities.map((a, i) => (
              <tr key={i}>
                <td>
                  {editing ? (
                    <div className="lb-edit-row">
                      {text(a.activity, (v) => update((d) => { d.otherActivities[i].activity = v; }), { as: "strong", placeholder: "Activity" })}
                      <span className="lb-edit-ctls">
                        <InlineIconBtn title="Move up" icon="chevronUp" onClick={() => update((d) => { if (i > 0) [d.otherActivities[i - 1], d.otherActivities[i]] = [d.otherActivities[i], d.otherActivities[i - 1]]; })} />
                        <InlineIconBtn title="Move down" icon="chevronDown" onClick={() => update((d) => { if (i < d.otherActivities.length - 1) [d.otherActivities[i + 1], d.otherActivities[i]] = [d.otherActivities[i], d.otherActivities[i + 1]]; })} />
                        <InlineIconBtn title="Delete activity" icon="trash" danger onClick={() => update((d) => { d.otherActivities.splice(i, 1); })} />
                      </span>
                    </div>
                  ) : (
                    <strong>{a.activity}</strong>
                  )}
                </td>
                <td>{text(a.evidence, (v) => update((d) => { d.otherActivities[i].evidence = v; }), { placeholder: "Evidence required", multiline: true })}</td>
                <td className="lb-fill">{field(`oa:${i}:assessor`)}</td>
                <td className="lb-fill">{field(`oa:${i}:learner`)}</td>
              </tr>
            ))}
            {editing && (
              <tr className="lb-add-row">
                <td colSpan={4}>{addButton("Add other activity", () => update((d) => { d.otherActivities.push({ activity: "New activity", evidence: "Evidence required" }); }))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* For assessor */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>For assessor — file checked</div>
        <table className="data lb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Assessor signature</th>
              <th>Workplace</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1].map((r) => (
              <tr key={r}>
                <td className="lb-fill">{dateField(`fc:${r}:date`)}</td>
                <td className="lb-fill">{field(`fc:${r}:sign`)}</td>
                <td className="lb-fill">{field(`fc:${r}:workplace`)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {[
          {
            who: "Workplace",
            note: "This is to verify that the learner has taken part in the activities in their workplace.",
            fields: [["Workplace (Sign)", "Designation"], ["Name", "Date"]],
          },
          {
            who: "Assessor",
            note: "This is to verify that the learner has completed all the above and has achieved competence.",
            fields: [["Assessor Name", "Assessor Reg. No"], ["Assessor Signature", "Date"]],
          },
          {
            who: "Learner",
            note: "This is to verify that the assessor has observed me in the workplace.",
            fields: [["Learner's Name", "Learner's Reg. No"], ["Learner's Signature", "Date"]],
          },
        ].map((blk) => (
          <div className="lb-signblock" key={blk.who}>
            <p className="lesson-p" style={{ marginBottom: 8 }}>
              <strong>{blk.who}</strong> — {blk.note}
            </p>
            {blk.fields.map((pair, i) => (
              <div className="lb-signrow" key={i}>
                {pair.map((f) => (
                  <span className="lb-signline" key={f}>
                    {f}: {f === "Date" ? dateField(`sign:${blk.who}:${f}`) : field(`sign:${blk.who}:${f}`)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Feedback record */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Feedback record</div>
        {area("fb:comments", "Comments from learner:")}
        <div className="task-label">Judgement</div>
        <div className="lb-judgement">
          {[
            "Meets the requirements",
            "Does not meet the requirements",
            "Requires additional evidence",
            "Requires another assessment",
            "Can continue to the next assessment",
            "Requires another assessment by another assessor",
          ].map((j) => check(`fb:j:${j}`, j))}
        </div>
        <div className="lb-signrow" style={{ marginTop: 12 }}>
          <span className="lb-signline">
            Action required: {field("fb:action")}
          </span>
          <span className="lb-signline">
            By when: {dateField("fb:bywhen")}
          </span>
        </div>
        <div style={{ marginTop: 12 }}>{area("fb:remarks", "Assessor's feedback remarks:")}</div>
      </div>

      {/* Declaration + project checklist */}
      <div className="card lb-card">
        <div className="task-label" style={{ marginTop: 0 }}>Declaration by learner</div>
        <p className="lesson-p">
          I, <span className="lb-inline-input">{field("decl:name", "full name")}</span>, declare
          that I am satisfied that the feedback given to me by the Assessor was relevant, sufficient
          and done in a constructive manner. I accept the assessment judgement and have no further
          questions relating to this particular assessment instrument.
        </p>
        {["Learner", "Assessor", "Moderator"].map((who) => (
          <div className="lb-signrow" key={who}>
            <span className="lb-signline">
              <span className="lbl">{who} Name:</span> {field(`decl:${who}:name`)}
            </span>
            <span className="lb-signline">
              <span className="lbl sm">Signature:</span> {field(`decl:${who}:signature`)}
            </span>
            <span className="lb-signline">
              <span className="lbl xs">Date:</span> {dateField(`decl:${who}:date`)}
            </span>
          </div>
        ))}

        <div className="task-label">Project checklist</div>
        <p className="muted" style={{ marginBottom: 8 }}>
          This serves to confirm that the undersigned parties have completed, checked and attached
          the following activities to this logbook.
        </p>
        <div className="lb-scroll">
          <table className="data lb-table lb-compact lb-project-checklist">
            <colgroup>
              <col className="lb-pc-no" />
              <col className="lb-pc-project" />
              <col className="lb-pc-name" />
              <col className="lb-pc-date" />
              <col className="lb-pc-name" />
              <col className="lb-pc-date" />
              <col className="lb-pc-name" />
              <col className="lb-pc-date" />
            </colgroup>
            <thead>
              <tr>
                <th>No</th>
                <th>Project name</th>
                <th>Learner</th>
                <th>Date</th>
                <th>Workplace</th>
                <th>Date</th>
                <th>Assessor</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {spec.projectChecklist.map((p, pi) => (
                <React.Fragment key={pi}>
                  <tr>
                    <td>{text(p.no, (v) => update((d) => { d.projectChecklist[pi].no = v || String(pi + 1); }), { placeholder: "No" })}</td>
                    <td>
                      {editing ? (
                        <div className="lb-edit-row">
                          {text(p.name, (v) => update((d) => { d.projectChecklist[pi].name = v; }), { placeholder: "Project name" })}
                          <span className="lb-edit-ctls">
                            <InlineIconBtn title="Move up" icon="chevronUp" onClick={() => update((d) => { if (pi > 0) [d.projectChecklist[pi - 1], d.projectChecklist[pi]] = [d.projectChecklist[pi], d.projectChecklist[pi - 1]]; })} />
                            <InlineIconBtn title="Move down" icon="chevronDown" onClick={() => update((d) => { if (pi < d.projectChecklist.length - 1) [d.projectChecklist[pi + 1], d.projectChecklist[pi]] = [d.projectChecklist[pi], d.projectChecklist[pi + 1]]; })} />
                            <InlineIconBtn title="Delete project" icon="trash" danger onClick={() => update((d) => { d.projectChecklist.splice(pi, 1); })} />
                          </span>
                        </div>
                      ) : p.name}
                    </td>
                    <td className="lb-fill">{field(`pc:${p.no}:learner`)}</td>
                    <td className="lb-fill">{dateField(`pc:${p.no}:ldate`)}</td>
                    <td className="lb-fill">{field(`pc:${p.no}:workplace`)}</td>
                    <td className="lb-fill">{dateField(`pc:${p.no}:wdate`)}</td>
                    <td className="lb-fill">{field(`pc:${p.no}:assessor`)}</td>
                    <td className="lb-fill">{dateField(`pc:${p.no}:adate`)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="lb-comments-label">
                      Comments
                    </td>
                    <td colSpan={6} className="lb-fill">
                      {multiline(`pc:${p.no}:comments`)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {editing && (
                <tr className="lb-add-row">
                  <td colSpan={8}>{addButton("Add project", () => update((d) => { d.projectChecklist.push({ no: String(d.projectChecklist.length + 1), name: "New project" }); }))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

