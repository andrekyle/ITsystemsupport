import { useState } from "react";
import { Icon } from "../icons";
import type { Profile, ProgressState, Route } from "../types";
import { isStaff } from "../types";
import { Gloss } from "./Course";
import { unitStatus } from "../store";
import { downloadIcs, parseSessionDates } from "../lib/integrations";
import type { IcsEvent } from "../lib/integrations";
import { activeCourse, activeCourseId, courseStorageKey, saveCustomCourse } from "../data/courses";
import { flushKey } from "../lib/sync";
import { supabase } from "../lib/supabase";
import {
  ASSESSMENT_FRAMEWORK,
  DELIVERABLES,
  FACILITATION_DUTIES,
  MODULES,
  PROGRAMME_MILESTONES,
  RESOURCES,
  isSaqaUnit,
  usLabel,
} from "../data/course";

export function AssessmentsPage({ profile }: { profile: Profile }) {
  return (
    <>
      <div className="eyebrow">
        <Icon name="clipboard" size={15} />
        Assessments
      </div>
      <h1 className="page-title">Assessment framework</h1>
      <p className="page-sub">
        <Gloss text="Assessments are conducted in line with QCTO, SETA and institutional requirements, and are valid, reliable, fair and aligned with the OCD and ASD for SAQA ID 48573." />
      </p>

      <div className="two-col">
        {ASSESSMENT_FRAMEWORK.map((sec) => (
          <div className="card" key={sec.heading}>
            <h2 className="section-title mt-0" style={{ margin: "0 0 10px" }}>
              <span className="ico">
                <Icon name={sec.icon} size={20} />
              </span>
              {sec.heading}
            </h2>
            <ul className="duty-list">
              {sec.items.map((it) => (
                <li key={it}>
                  <span className="ico">
                    <Icon name="checkCircle" size={16} />
                  </span>
                  <span>
                    <Gloss text={it} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {isStaff(profile.role) && (
        <>
          <h2 className="section-title">
            <span className="ico">
              <Icon name="presenter" size={20} />
            </span>
            Facilitation responsibilities
          </h2>
          <div className="two-col">
            {FACILITATION_DUTIES.map((sec) => (
              <div className="card" key={sec.heading}>
                <h2 className="section-title mt-0" style={{ margin: "0 0 10px" }}>
                  <span className="ico">
                    <Icon name={sec.icon} size={20} />
                  </span>
                  {sec.heading}
                </h2>
                <ul className="duty-list">
                  {sec.items.map((it) => (
                    <li key={it}>
                      <span className="ico">
                        <Icon name="checkCircle" size={16} />
                      </span>
                      <span>
                        <Gloss text={it} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="callout">
        <span className="ico">
          <Icon name="shield" size={19} />
        </span>
        <span>
          Assessment documentation is safeguarded to ensure confidentiality and compliance.
          Assessment-related queries or appeals are addressed and rectified through the
          institutional appeals process.
        </span>
      </div>
    </>
  );
}

export function DeliverablesPage() {
  return (
    <>
      <div className="eyebrow">
        <Icon name="checklist" size={15} />
        Deliverables
      </div>
      <h1 className="page-title">Deliverables & due dates</h1>
      <p className="page-sub">
        Standards and submission timelines for programme deliverables across the training calendar.
      </p>

      <div className="deliv-grid">
        {DELIVERABLES.map((d) => (
          <div className="card deliv-card" key={d.deliverable}>
            <span className="deliv-ico">
              <Icon name={d.icon} size={20} />
            </span>
            <strong className="deliv-name">{d.deliverable}</strong>
            <p className="deliv-standard">{d.standard}</p>
            <span className="deliv-due">
              <Icon name="clock" size={14} />
              {d.due}
            </span>
          </div>
        ))}
      </div>

      <div className="callout">
        <span className="ico">
          <Icon name="info" size={19} />
        </span>
        <span>
          Lesson plans are submitted for approval at least <strong>3 working days</strong> before each
          session. Attendance registers are signed and submitted <strong>after each session</strong>.
        </span>
      </div>
    </>
  );
}

export function ResourcesPage() {
  return (
    <>
      <div className="eyebrow">
        <Icon name="globe" size={15} />
        Resources
      </div>
      <h1 className="page-title">Resources</h1>
      <p className="page-sub">System Support NQF Level 5 Learnership · Investec Group</p>

      {RESOURCES.map((r) => (
        <a
          className="res-card"
          key={r.title}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="t">
            {r.title} ↗
          </span>
          <span className="d">{r.desc}</span>
        </a>
      ))}
    </>
  );
}

type CalendarDraft = {
  modules: {
    id: string;
    name: string;
    icon: string;
    image?: string;
    activities: number;
    units: { us: string; title: string; nqf: number; credits: number; dates: string; time: string }[];
  }[];
  milestones: { name: string; dates: string; time: string; icon: string }[];
};

const makeCalendarDraft = (): CalendarDraft => ({
  modules: MODULES.map((m) => ({ ...m, units: m.units.map((u) => ({ ...u })) })),
  milestones: PROGRAMME_MILESTONES.map((ms) => ({ ...ms })),
});

export function CalendarPage({
  navigate,
  progress,
  profile,
}: {
  navigate?: (r: Route) => void;
  progress?: ProgressState;
  profile?: Profile;
}) {
  const customCourse = activeCourseId().startsWith("custom-");
  const canEdit = customCourse ? profile?.role === "Super User" : import.meta.env.DEV;
  // In-place editing of the calendar (dev only — saving writes the edits
  // straight back into the course data file through /api/save-calendar).
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CalendarDraft>(makeCalendarDraft);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [focusedModuleId, setFocusedModuleId] = useState<string | null>(null);

  const startEditing = (moduleId: string | null = null) => {
    setDraft(makeCalendarDraft());
    setSaveState("idle");
    setFocusedModuleId(moduleId);
    setEditing(true);
  };

  const addModule = () => {
    const id = `module-${crypto.randomUUID()}`;
    setDraft((current) => {
      const base = editing ? current : makeCalendarDraft();
      return {
        ...base,
        modules: [...base.modules, {
          id, name: "", icon: "book", activities: 0,
          units: [{ us: "", title: "", nqf: 5, credits: 0, dates: "", time: "09h00 - 14h00" }],
        }],
      };
    });
    setFocusedModuleId(id);
    setSaveState("idle");
    setEditing(true);
  };

  const setModuleName = (mi: number, value: string) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) => (i === mi ? { ...m, name: value } : m)),
    }));

  const setUnitField = (mi: number, ui: number, field: "us" | "title" | "dates" | "time", value: string) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) =>
        i === mi ? { ...m, units: m.units.map((u, j) => (j === ui ? { ...u, [field]: value } : u)) } : m
      ),
    }));

  const setMilestoneField = (mi: number, field: "name" | "dates" | "time", value: string) =>
    setDraft((d) => ({
      ...d,
      milestones: d.milestones.map((ms, i) => (i === mi ? { ...ms, [field]: value } : ms)),
    }));

  const addUnitRow = (mi: number) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) =>
        i === mi
          ? { ...m, units: [...m.units, { us: "", title: "", nqf: 5, credits: 0, dates: "", time: "09h00 - 14h00" }] }
          : m
      ),
    }));

  const removeUnitRow = (mi: number, ui: number) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) => (i === mi ? { ...m, units: m.units.filter((_, j) => j !== ui) } : m)),
    }));

  const moveUnitRow = (mi: number, ui: number, delta: -1 | 1) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) => {
        if (i !== mi) return m;
        const target = ui + delta;
        if (target < 0 || target >= m.units.length) return m;
        const units = [...m.units];
        [units[ui], units[target]] = [units[target], units[ui]];
        return { ...m, units };
      }),
    }));

  const addMilestoneRow = () =>
    setDraft((d) => ({
      ...d,
      milestones: [...d.milestones, { name: "", dates: "", time: "09h00 - 14h00", icon: "certificate" }],
    }));

  const removeMilestoneRow = (mi: number) =>
    setDraft((d) => ({ ...d, milestones: d.milestones.filter((_, i) => i !== mi) }));

  const moveMilestoneRow = (mi: number, delta: -1 | 1) =>
    setDraft((d) => {
      const target = mi + delta;
      if (target < 0 || target >= d.milestones.length) return d;
      const milestones = [...d.milestones];
      [milestones[mi], milestones[target]] = [milestones[target], milestones[mi]];
      return { ...d, milestones };
    });

  async function saveEdits() {
    setSaveState("saving");
    setSaveError("");
    try {
      if (draft.modules.some((m) => !m.name.trim())) {
        throw new Error("Enter a name for every module before saving.");
      }
      // drop rows that were added but left completely empty
      const modules = draft.modules.map((m) => ({
        ...m,
        name: m.name.trim(),
        units: m.units.filter((u) => `${u.us}${u.title}${u.dates}`.trim() !== ""),
      }));
      const milestones = draft.milestones.filter((ms) => `${ms.name}${ms.dates}`.trim() !== "");
      if (customCourse) {
        const course = { ...activeCourse(), modules, programmeMilestones: milestones };
        saveCustomCourse(course);
        await flushKey(courseStorageKey(course.id), !!supabase);
        location.reload();
        return;
      }
      const res = await fetch("/api/save-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: activeCourseId(), modules, milestones }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSaveState("saved");
      setEditing(false);
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  }

  function exportIcs() {
    const events: IcsEvent[] = [];
    for (const m of MODULES)
      for (const u of m.units)
        for (const s of parseSessionDates(u.dates, u.time))
          events.push({
            title: `${usLabel(u.us)} — ${u.title}`,
            start: s.start,
            end: s.end,
            description: `${m.name} training session · ITSS Learn`,
          });
    for (const ms of PROGRAMME_MILESTONES)
      for (const s of parseSessionDates(ms.dates, ms.time))
        events.push({ title: ms.name, start: s.start, end: s.end, description: "ITSS Learn" });
    downloadIcs("ITSS-training-calendar", events, "ITSS Learn training calendar");
  }

  return (
    <>
      <div className="eyebrow">
        <Icon name="calendar" size={15} />
        Training calendar
      </div>
      <h1 className="page-title">Training dates</h1>
      <p className="page-sub">
        {customCourse ? "Add modules, unit standards and training dates for this course." : "All sessions run 09h00 – 14h00 as per the QCTO-approved training schedule (Jul 2026 – Jul 2027)."}
      </p>

      <p className="cal-toolbar">
        <button className="btn ghost sm" onClick={exportIcs} title="Import into Outlook, Teams or Google Calendar">
          <Icon name="download" size={15} /> Add all sessions to my calendar (.ics)
        </button>
        {canEdit && !editing && (
          <button className="btn ghost sm" onClick={() => startEditing()} title="Edit the training calendar in place, then save">
            <Icon name="pencil" size={15} /> Edit calendar
          </button>
        )}
        {canEdit && (
          <button className="btn ghost sm" onClick={addModule} disabled={saveState === "saving"}>
            <Icon name="plus" size={15} /> Add module
          </button>
        )}
        {editing && (
          <>
            <button className="btn primary sm" onClick={saveEdits} disabled={saveState === "saving"}>
              <Icon name="check" size={15} /> {saveState === "saving" ? "Saving…" : "Save changes"}
            </button>
            <button className="btn ghost sm" onClick={() => setEditing(false)} disabled={saveState === "saving"}>
              <Icon name="close" size={15} /> Cancel
            </button>
          </>
        )}
        {saveState === "saved" && !editing && (
          <span className="cal-save-note ok">
            <Icon name="checkCircle" size={15} /> Calendar saved
          </span>
        )}
        {saveState === "error" && <span className="cal-save-note err">Save failed: {saveError}</span>}
      </p>

      {(editing ? draft.modules : MODULES).map((m, i) => (
        <div key={m.id}>
          <h2 className="section-title">
            <span className="ico">
              <Icon name={m.icon} size={20} />
            </span>
            {editing ? (
              <>
                Module {i + 1}:{" "}
                <input
                  className="cal-edit cal-edit-name"
                  value={m.name}
                  autoFocus={m.id === focusedModuleId}
                  placeholder="Module name"
                  disabled={saveState === "saving"}
                  onChange={(e) => setModuleName(i, e.target.value)}
                  aria-label={`Module ${i + 1} name`}
                />
              </>
            ) : (
              <>
                Module {i + 1}: {m.name}
                {canEdit && (
                  <button
                    className="btn ghost sm"
                    onClick={() => startEditing(m.id)}
                    aria-label={`Edit module ${i + 1} name`}
                  >
                    <Icon name="pencil" size={15} /> Edit module
                  </button>
                )}
              </>
            )}
          </h2>
          <table className="data training-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>US ID</th>
                <th>Unit standard title</th>
                <th style={{ width: 190 }}>Training dates</th>
                <th style={{ width: 130 }}>Time</th>
                {editing && <th style={{ width: 96 }} aria-label="Row actions" />}
              </tr>
            </thead>
            <tbody>
              {m.units.map((u, j) => {
                if (editing) {
                  return (
                    <tr key={j}>
                      <td>
                        <input
                          className="cal-edit"
                          value={u.us}
                          onChange={(e) => setUnitField(i, j, "us", e.target.value)}
                          aria-label="US ID"
                        />
                      </td>
                      <td>
                        <input
                          className="cal-edit"
                          value={u.title}
                          onChange={(e) => setUnitField(i, j, "title", e.target.value)}
                          aria-label="Unit standard title"
                        />
                      </td>
                      <td>
                        <input
                          className="cal-edit"
                          value={u.dates}
                          onChange={(e) => setUnitField(i, j, "dates", e.target.value)}
                          aria-label="Training dates"
                        />
                      </td>
                      <td>
                        <input
                          className="cal-edit"
                          value={u.time}
                          onChange={(e) => setUnitField(i, j, "time", e.target.value)}
                          aria-label="Time"
                        />
                      </td>
                      <td className="cal-row-actions">
                        <span className="cal-row-btns">
                          <button
                            className="cal-row-move"
                            title="Move this row up"
                            aria-label="Move this row up"
                            onClick={() => moveUnitRow(i, j, -1)}
                            disabled={j === 0}
                          >
                            <Icon name="chevronUp" size={14} />
                          </button>
                          <button
                            className="cal-row-move"
                            title="Move this row down"
                            aria-label="Move this row down"
                            onClick={() => moveUnitRow(i, j, 1)}
                            disabled={j === m.units.length - 1}
                          >
                            <Icon name="chevronDown" size={14} />
                          </button>
                          <button
                            className="cal-row-remove"
                            title="Remove this row"
                            aria-label="Remove this row"
                            onClick={() => removeUnitRow(i, j)}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                }
                const done = progress ? unitStatus(progress, u.us) === "completed" : false;
                return (
                  <tr key={u.us} className={done ? "done-row" : undefined}>
                    <td>
                      {isSaqaUnit(u.us) ? (
                        <a
                          className="us-link"
                          href={`https://allqs.saqa.org.za/showUnitStandard.php?id=${u.us}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`View US ${u.us} on SAQA`}
                        >
                          {u.us}
                        </a>
                      ) : (
                        <span className="us-code">{u.us}</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`text-link${done ? " done-link" : ""}`}
                        style={{ textAlign: "left", fontWeight: 400 }}
                        onClick={() => navigate?.({ page: "unit", moduleId: m.id, unitId: u.us })}
                        title={`Open ${usLabel(u.us)} — ${u.title}${done ? " (completed)" : ""}`}
                      >
                        {u.title}
                      </button>
                    </td>
                    <td>{u.dates}</td>
                    <td>{u.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {editing && (
            <p className="cal-add-row">
              <button className="btn ghost sm" onClick={() => addUnitRow(i)} title="Add a new unit standard row to this module">
                <Icon name="plus" size={15} /> Add row
              </button>
            </p>
          )}
        </div>
      ))}

      <h2 className="section-title">
        <span className="ico">
          <Icon name="certificate" size={20} />
        </span>
        Programme milestones
      </h2>
      <table className="data milestone-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th style={{ width: 190 }}>Dates</th>
            <th style={{ width: 130 }}>Time</th>
            {editing && <th style={{ width: 96 }} aria-label="Row actions" />}
          </tr>
        </thead>
        <tbody>
          {(editing ? draft.milestones : PROGRAMME_MILESTONES).map((ms, i) => (
            <tr key={i}>
              <td>
                <span className={`with-ico${editing ? " cal-ico-edit" : ""}`}>
                  <span className="ico">
                    <Icon name={ms.icon} size={18} />
                  </span>
                  {editing ? (
                    <input
                      className="cal-edit"
                      value={ms.name}
                      onChange={(e) => setMilestoneField(i, "name", e.target.value)}
                      aria-label="Milestone name"
                    />
                  ) : (
                    <strong>
                      <Gloss text={ms.name} />
                    </strong>
                  )}
                </span>
              </td>
              <td>
                {editing ? (
                  <input
                    className="cal-edit"
                    value={ms.dates}
                    onChange={(e) => setMilestoneField(i, "dates", e.target.value)}
                    aria-label="Milestone dates"
                  />
                ) : (
                  ms.dates
                )}
              </td>
              <td>
                {editing ? (
                  <input
                    className="cal-edit"
                    value={ms.time}
                    onChange={(e) => setMilestoneField(i, "time", e.target.value)}
                    aria-label="Milestone time"
                  />
                ) : (
                  ms.time
                )}
              </td>
              {editing && (
                <td className="cal-row-actions">
                  <span className="cal-row-btns">
                    <button
                      className="cal-row-move"
                      title="Move this row up"
                      aria-label="Move this row up"
                      onClick={() => moveMilestoneRow(i, -1)}
                      disabled={i === 0}
                    >
                      <Icon name="chevronUp" size={14} />
                    </button>
                    <button
                      className="cal-row-move"
                      title="Move this row down"
                      aria-label="Move this row down"
                      onClick={() => moveMilestoneRow(i, 1)}
                      disabled={i === draft.milestones.length - 1}
                    >
                      <Icon name="chevronDown" size={14} />
                    </button>
                    <button
                      className="cal-row-remove"
                      title="Remove this row"
                      aria-label="Remove this row"
                      onClick={() => removeMilestoneRow(i)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <p className="cal-add-row">
          <button className="btn ghost sm" onClick={addMilestoneRow} title="Add a new milestone row">
            <Icon name="plus" size={15} /> Add row
          </button>
        </p>
      )}
    </>
  );
}
