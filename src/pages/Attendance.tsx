import { useCallback, useEffect, useState } from "react";
import type { Profile } from "../types";
import { isStaff } from "../types";
import { COURSE_META, MODULES } from "../data/course";
import { supabase } from "../lib/supabase";
import { Icon } from "../icons";

/**
 * Attendance Register — exact replica of the Eruditio paper form.
 *
 * One shared register exists per session date (Fridays). Every signed-in
 * learner signs their own row during class; the register is shared across
 * all accounts (itss.attendance.<date> → shared_state) and can be
 * downloaded as a PDF (print-to-PDF, A4 landscape).
 */

const ROW_COUNT = 15;
const TYPE_OPTIONS = ["Induction", "Training", "Tutoring", "Assessment", "Interviews"] as const;

interface AttRow {
  name: string;
  surname: string;
  idNumber: string;
  race: string;
  gender: string;
  arrival: string;
  signature: string;
}

interface AttData {
  header: Record<string, string>;
  /** profile id -> the row that learner signed */
  rows: Record<string, AttRow>;
  /** signing order (profile ids) */
  order: string[];
}

const EMPTY: AttData = { header: {}, rows: {}, order: [] };

const attKey = (dateIso: string) => `itss.attendance.${dateIso}`;

function readReg(key: string): AttData {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<AttData>) };
  } catch {
    /* fall through */
  }
  return EMPTY;
}

async function pullLatest(key: string): Promise<AttData | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("shared_state")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (data?.value) return { ...EMPTY, ...(JSON.parse(data.value) as Partial<AttData>) };
  } catch {
    /* offline — use local copy */
  }
  return null;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Today if it is a Friday, otherwise the upcoming Friday. */
function defaultFriday(): string {
  const d = new Date();
  const shift = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + shift);
  return isoDate(d);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** The unit standard scheduled on the given date (from the training calendar). */
function unitForDate(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  for (const m of MODULES) {
    for (const u of m.units) {
      const year = u.dates.match(/\b20\d{2}\b/);
      if (!year || +year[0] !== d.getFullYear()) continue;
      for (const seg of u.dates.matchAll(
        /(\d{1,2}(?:\s*,\s*\d{1,2})*)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi
      )) {
        if (MONTHS.indexOf(seg[2].toLowerCase()) !== d.getMonth()) continue;
        if (seg[1].split(/\s*,\s*/).some((x) => +x === d.getDate())) return `US ${u.us}`;
      }
    }
  }
  return "";
}

function headerDefaults(dateIso: string): Record<string, string> {
  const d = new Date(`${dateIso}T12:00:00`);
  return {
    course: COURSE_META.title,
    venue: "",
    nqf: String(COURSE_META.nqfLevel),
    credits: String(COURSE_META.credits),
    unitStandards: unitForDate(dateIso),
    type: "Training",
    client: "",
    qualification: `SAQA ${COURSE_META.saqaId}`,
    facilitator: "Andre Snell",
    date: d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
  };
}

export function AttendancePage({ profile }: { profile: Profile }) {
  const staff = isStaff(profile.role);
  const [dateIso, setDateIso] = useState(defaultFriday);
  const [reg, setReg] = useState<AttData>(() => readReg(attKey(dateIso)));
  const storageKey = attKey(dateIso);

  const refresh = useCallback(async () => {
    const latest = await pullLatest(storageKey);
    if (latest) {
      localStorage.setItem(storageKey, JSON.stringify(latest));
      setReg(latest);
    } else {
      setReg(readReg(storageKey));
    }
  }, [storageKey]);

  // load the selected day's register and keep it fresh while class is on
  useEffect(() => {
    setReg(readReg(storageKey));
    void refresh();
    const t = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(t);
  }, [storageKey, refresh]);

  const save = useCallback(
    (next: AttData) => {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setReg(next);
    },
    [storageKey]
  );

  const defaults = headerDefaults(dateIso);
  const hdr = (field: string) => reg.header[field] ?? defaults[field] ?? "";
  const setHdr = (field: string, value: string) =>
    save({ ...reg, header: { ...reg.header, [field]: value } });

  const today = isoDate(new Date());
  const isToday = dateIso === today;
  const signed = !!reg.rows[profile.id];
  const canSign = !signed && (isToday || staff);

  /** Sign the register: my details from my enrolment form + arrival time now. */
  const signNow = async () => {
    // merge with the latest shared copy so classmates' rows are not lost
    const base = (await pullLatest(storageKey)) ?? readReg(storageKey);
    if (base.rows[profile.id]) {
      save(base);
      return;
    }
    const e = profile.enrolment;
    const parts = profile.name.trim().split(/\s+/);
    const now = new Date();
    const row: AttRow = {
      name: e?.firstNames || parts.slice(0, -1).join(" ") || profile.name,
      surname: e?.surname || (parts.length > 1 ? parts[parts.length - 1] : ""),
      idNumber: e?.idNumber || "",
      race: e?.equityGroup || "",
      gender: e?.gender || "",
      arrival: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      signature: e?.signature || profile.name,
    };
    save({
      header: { ...base.header, ...reg.header },
      rows: { ...base.rows, [profile.id]: row },
      order: base.order.includes(profile.id) ? base.order : [...base.order, profile.id],
    });
  };

  const setCell = (pid: string, field: keyof AttRow, value: string) =>
    save({ ...reg, rows: { ...reg.rows, [pid]: { ...reg.rows[pid], [field]: value } } });

  const clearRow = (pid: string) => {
    const rows = { ...reg.rows };
    delete rows[pid];
    save({ ...reg, rows, order: reg.order.filter((id) => id !== pid) });
  };

  const canEditRow = (pid: string) => staff || pid === profile.id;

  const cell = (pid: string, field: keyof AttRow, cls?: string) => {
    const row = reg.rows[pid];
    if (!row) return null;
    return canEditRow(pid) ? (
      <input
        className={`att-cell${cls ? ` ${cls}` : ""}`}
        value={row[field]}
        onChange={(e) => setCell(pid, field, e.target.value)}
      />
    ) : (
      <span className={cls}>{row[field]}</span>
    );
  };

  const hdrCell = (field: string) =>
    staff ? (
      <input className="att-cell" value={hdr(field)} onChange={(e) => setHdr(field, e.target.value)} />
    ) : (
      <span>{hdr(field)}</span>
    );

  return (
    <div className="attendance-page">
      <h1 className="page-title no-print">Attendance Register</h1>
      <p className="page-sub no-print">
        Sign the register every Friday during class — your details fill in from your enrolment
        form. {staff ? "Staff can edit any field and view past registers." : ""}
      </p>

      <div className="att-controls no-print">
        <label className="att-date">
          Session date{" "}
          <input type="date" value={dateIso} onChange={(e) => e.target.value && setDateIso(e.target.value)} />
        </label>
        <button className="btn" onClick={() => void refresh()}>
          <Icon name="trend" /> Refresh
        </button>
        <button className="btn primary" disabled={!canSign} onClick={() => void signNow()}>
          <Icon name="check" /> {signed ? "Signed" : "Sign the register — I'm here"}
        </button>
        <button className="btn" onClick={() => window.print()}>
          <Icon name="download" /> Download as PDF
        </button>
        {signed && <span className="att-note">You have signed — you can still edit your row.</span>}
        {!signed && !canSign && (
          <span className="att-note">Signing opens on the day of the session.</span>
        )}
      </div>

      <div className="att-sheet">
        <div className="att-logo">
          <img src="/downloads/cropped-cropped-Final_Full-Logo2-768x255.png" alt="Eruditio — Empower · Develop · Transform" />
        </div>

        <div className="att-banner">ATTENDANCE REGISTER</div>

        <table className="att-head">
          <tbody>
            <tr>
              <td className="lbl">Course</td>
              <td>{hdrCell("course")}</td>
              <td className="lbl">Venue</td>
              <td>{hdrCell("venue")}</td>
            </tr>
            <tr>
              <td className="lbl">NQF Level</td>
              <td>{hdrCell("nqf")}</td>
              <td className="lbl">Credits</td>
              <td>{hdrCell("credits")}</td>
            </tr>
            <tr>
              <td className="lbl">Unit Standards</td>
              <td>{hdrCell("unitStandards")}</td>
              <td className="lbl">Type</td>
              <td className="att-types">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="att-type"
                    disabled={!staff}
                    onClick={() => setHdr("type", hdr("type") === t ? "" : t)}
                  >
                    {t} <span className={`att-radio${hdr("type") === t ? " on" : ""}`} />
                  </button>
                ))}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="att-main-wrap">
          <img
            className="att-watermark icon"
            src="/downloads/Colour-ICon_1-scaled-1536x1339.png"
            alt=""
            aria-hidden="true"
          />
          <img
            className="att-watermark full"
            src="/downloads/cropped-cropped-Final_Full-Logo2-768x255.png"
            alt=""
            aria-hidden="true"
          />
          <table className="att-main">
            <thead>
              <tr>
                <th colSpan={2}>Name</th>
                <th>Surname</th>
                <th>ID Number</th>
                <th>Race</th>
                <th>Gender</th>
                <th>Arrival Time</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROW_COUNT }, (_, i) => {
                const pid = reg.order[i];
                return (
                  <tr key={i}>
                    <td className="att-num">{i + 1}.</td>
                    <td className="att-name">{pid ? cell(pid, "name") : null}</td>
                    <td>{pid ? cell(pid, "surname") : null}</td>
                    <td>{pid ? cell(pid, "idNumber") : null}</td>
                    <td>{pid ? cell(pid, "race") : null}</td>
                    <td>{pid ? cell(pid, "gender") : null}</td>
                    <td>{pid ? cell(pid, "arrival") : null}</td>
                    <td className="att-sig-cell">
                      {pid ? cell(pid, "signature", "att-sig") : null}
                      {pid && staff && (
                        <button
                          className="att-clear no-print"
                          title="Clear this row"
                          onClick={() => clearRow(pid)}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <table className="att-foot">
          <tbody>
            <tr>
              <td className="lbl">Client:</td>
              <td>{hdrCell("client")}</td>
              <td className="lbl">Qualification:</td>
              <td>{hdrCell("qualification")}</td>
            </tr>
            <tr>
              <td className="lbl">Facilitator:</td>
              <td>{hdrCell("facilitator")}</td>
              <td className="lbl">Date:</td>
              <td>{hdrCell("date")}</td>
            </tr>
          </tbody>
        </table>

        <div className="att-company">
          <div>Eruditio Skills Development Consultants (Pty) Ltd</div>
          <div>Office 44/45 Villa Valencia Business Park, 244 Monument Road</div>
          <div>Glen Marais, Kempton Park 1619</div>
          <div>
            www.eruditio.co.za&ensp;<span className="att-link">info@eruditio.co.za</span>
          </div>
          <div>+27 11 973 0205</div>
        </div>
      </div>
    </div>
  );
}
