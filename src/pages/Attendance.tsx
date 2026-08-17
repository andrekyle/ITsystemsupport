import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Profile, UnitStandard } from "../types";
import { isStaff } from "../types";
import { COURSE_META, MODULES, usLabel } from "../data/course";
import { supabase } from "../lib/supabase";
import { fileToSignature, reprocessSignature } from "../lib/signature";
import { fetchCloudDirectory, updateCloudProfile } from "../lib/directory";
import { loadProfiles, updateProfile } from "../store";
import { logAudit } from "../lib/audit";
import { Icon } from "../icons";
import { ConfirmModal } from "../components/Modal";

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

const MONTHS_ATT: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** All calendar dates a unit is scheduled on (from its "dates" string like "5, 6 Aug 2026"). */
function unitScheduledIsoDates(u: UnitStandard): string[] {
  const days = Array.from(u.dates.matchAll(/\b(\d{1,2})\b/g)).map((m) => Number(m[1]));
  const monMatch = u.dates.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
  const yrMatch = u.dates.match(/\b(20\d{2})\b/);
  if (!days.length || !monMatch || !yrMatch) return [];
  const mon = MONTHS_ATT[monMatch[0].toLowerCase()];
  const yr = Number(yrMatch[1]);
  return days.map((d) => {
    const dt = new Date(yr, mon, d);
    const y = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  });
}

interface AttRow {
  name: string;
  surname: string;
  idNumber: string;
  race: string;
  gender: string;
  arrival: string;
  signature: string;
  /** data-URL of the learner's handwritten signature */
  signatureImage?: string;
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

/** Names on the register always start with a capital letter (per word). */
function capWords(s: string): string {
  return s.replace(/(^|[\s'’-])(\p{Ll})/gu, (_m, p: string, c: string) => p + c.toUpperCase());
}

/** Apply register-wide fixes to loaded data (capitalised names/surnames). */
function normalizeReg(data: AttData): AttData {
  const rows: AttData["rows"] = {};
  for (const [pid, row] of Object.entries(data.rows)) {
    rows[pid] = { ...row, name: capWords(row.name ?? ""), surname: capWords(row.surname ?? "") };
  }
  return { ...data, rows };
}

function readReg(key: string): AttData {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return normalizeReg({ ...EMPTY, ...(JSON.parse(raw) as Partial<AttData>) });
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
    if (data?.value) return normalizeReg({ ...EMPTY, ...(JSON.parse(data.value) as Partial<AttData>) });
  } catch {
    /* offline — use local copy */
  }
  return null;
}

/** Every register key: those on this device plus any others in the cloud. */
async function allRegisterKeys(): Promise<string[]> {
  const keys = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("itss.attendance.")) keys.add(k);
  }
  if (supabase) {
    try {
      const { data } = await supabase
        .from("shared_state")
        .select("key")
        .like("key", "itss.attendance.%");
      for (const r of data ?? []) keys.add(r.key);
    } catch {
      /* offline — local keys only */
    }
  }
  return [...keys];
}

/** Write a learner's (new) signature into every register row they signed —
 *  past sessions included — so a replaced signature pulls through everywhere. */
export async function updateRegisterSignatures(
  profileId: string,
  signatureImage: string
): Promise<void> {
  for (const key of await allRegisterKeys()) {
    const data = (await pullLatest(key)) ?? readReg(key);
    const row = data.rows[profileId];
    if (!row || row.signatureImage === signatureImage) continue;
    const next = { ...data, rows: { ...data.rows, [profileId]: { ...row, signatureImage } } };
    localStorage.setItem(key, JSON.stringify(next)); // also syncs to the shared cloud copy
  }
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Today if a unit is scheduled today; otherwise the next scheduled session date; otherwise the upcoming Friday. */
function defaultFriday(): string {
  const now = new Date();
  const todayIso = isoDate(now);
  // gather all future/today session dates from the training calendar
  const upcoming: string[] = [];
  for (const m of MODULES) {
    for (const u of m.units) {
      for (const iso of unitScheduledIsoDates(u)) {
        if (iso >= todayIso) upcoming.push(iso);
      }
    }
  }
  if (upcoming.length) {
    upcoming.sort();
    return upcoming[0];
  }
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
        if (seg[1].split(/\s*,\s*/).some((x) => +x === d.getDate())) return usLabel(u.us);
      }
    }
  }
  return "";
}

function headerDefaults(dateIso: string): Record<string, string> {
  const d = new Date(`${dateIso}T12:00:00`);
  return {
    course: COURSE_META.title,    venue: "100 Grayston Drive, Sandown, Sandton, 2196, South Africa",
    nqf: String(COURSE_META.nqfLevel),
    credits: String(COURSE_META.credits),
    unitStandards: unitForDate(dateIso),
    type: "Training",
    client: "Investec",
    qualification: `SAQA ${COURSE_META.saqaId}`,
    facilitator: "Andre Snell",
    date: d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
  };
}

/** Read-only register sheet used by the "Download all registers" print view. */
function StaticSheet({ dateIso, data }: { dateIso: string; data: AttData }) {
  const defaults = headerDefaults(dateIso);
  const hdr = (field: string) => data.header[field] ?? defaults[field] ?? "";
  return (
    <div className="att-sheet att-sheet-static">
      <div className="att-logo">
        <img src="/downloads/cropped-cropped-Final_Full-Logo2-768x255.png" alt="Eruditio — Empower · Develop · Transform" />
      </div>
      <div className="att-banner">ATTENDANCE REGISTER</div>
      <table className="att-head">
        <tbody>
          <tr>
            <td className="lbl">Course</td>
            <td><span>{hdr("course")}</span></td>
            <td className="lbl">Venue</td>
            <td><span>{hdr("venue")}</span></td>
          </tr>
          <tr>
            <td className="lbl">NQF Level</td>
            <td><span>{hdr("nqf")}</span></td>
            <td className="lbl">Credits</td>
            <td><span>{hdr("credits")}</span></td>
          </tr>
          <tr>
            <td className="lbl">Unit Standards</td>
            <td><span>{hdr("unitStandards")}</span></td>
            <td className="lbl">Type</td>
            <td className="att-types">
              {TYPE_OPTIONS.map((t) => (
                <button key={t} type="button" className="att-type" disabled>
                  {t} <span className={`att-radio${hdr("type") === t ? " on" : ""}`} />
                </button>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="att-main-wrap">
        <img className="att-watermark icon" src="/downloads/Colour-ICon_1-scaled-1536x1339.png" alt="" aria-hidden="true" />
        <img className="att-watermark full" src="/downloads/cropped-cropped-Final_Full-Logo2-768x255.png" alt="" aria-hidden="true" />
        <table className="att-main">
          <thead>
            <tr>
              <th colSpan={2}>Name</th>
              <th>Surname</th>
              <th>ID Number</th>
              <th>Race</th>
              <th>Gender</th>
              <th>Time</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }, (_, i) => {
              const pid = data.order[i];
              const row = pid ? data.rows[pid] : undefined;
              return (
                <tr key={i}>
                  <td className="att-num">{i + 1}.</td>
                  <td className="att-name">{row?.name}</td>
                  <td>{row?.surname}</td>
                  <td>{row?.idNumber}</td>
                  <td>{row?.race}</td>
                  <td>{row?.gender}</td>
                  <td>{row?.arrival}</td>
                  <td className="att-sig-cell">
                    {row?.signatureImage ? (
                      <img className="att-sig-img" src={row.signatureImage} alt={`${row.name} signature`} />
                    ) : (
                      <span className="att-sig">{row?.signature}</span>
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
            <td><span>{hdr("client")}</span></td>
            <td className="lbl">Qualification:</td>
            <td><span>{hdr("qualification")}</span></td>
          </tr>
          <tr>
            <td className="lbl">Facilitator:</td>
            <td><span>{hdr("facilitator")}</span></td>
            <td className="lbl">Date:</td>
            <td><span>{hdr("date")}</span></td>
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
  );
}

export function AttendancePage({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  const staff = isStaff(profile.role);
  const isSuper = profile.role === "Super User";
  const [dateIso, setDateIso] = useState(defaultFriday);
  const [reg, setReg] = useState<AttData>(() => readReg(attKey(dateIso)));
  const [askSig, setAskSig] = useState(false);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [sigError, setSigError] = useState("");
  const [confirming, setConfirming] = useState<{ kind: "register" } | { kind: "row"; pid: string } | null>(null);
  /** all signed registers, loaded for the print-all view (null = normal single-register mode) */
  const [allRegs, setAllRegs] = useState<{ date: string; data: AttData }[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
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

  // live clock so the sign button opens by itself at the scheduled time without a reload
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const today = isoDate(now);
  const isToday = dateIso === today;
  // learners may sign any register on any day, at any time
  const signed = !!reg.rows[profile.id];
  const canSign = !signed;

  /** Sign the register: my details from my enrolment form + arrival time now. */
  const signNow = async (signatureImage?: string) => {
    // merge with the latest shared copy so classmates' rows are not lost
    const base = (await pullLatest(storageKey)) ?? readReg(storageKey);
    if (base.rows[profile.id]) {
      save(base);
      return;
    }
    const e = profile.enrolment;
    const parts = profile.name.trim().split(/\s+/);
    const now = new Date();
    const sig = signatureImage ?? profile.signatureImage;
    const row: AttRow = {
      name: capWords(e?.firstNames || parts.slice(0, -1).join(" ") || profile.name),
      surname: capWords(e?.surname || (parts.length > 1 ? parts[parts.length - 1] : "")),
      idNumber: e?.idNumber || "",
      race: e?.equityGroup || "",
      gender: e?.gender || "",
      arrival: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      signature: e?.signature || profile.name,
      ...(sig ? { signatureImage: sig } : {}),
    };
    save({
      header: { ...base.header, ...reg.header },
      rows: { ...base.rows, [profile.id]: row },
      order: base.order.includes(profile.id) ? base.order : [...base.order, profile.id],
    });
    logAudit(profile, "attendance.sign", `Signed the ${dateIso} attendance register at ${row.arrival}`);
  };

  /** First click: ask (only once, ever) for a photo of the handwritten signature. */
  const onSignClick = () => {
    if (!profile.signatureImage && !profile.signatureAsked) {
      setAskSig(true);
      return;
    }
    void signNow();
  };

  const onSigFile = async (file: File | undefined) => {
    if (!file) return;
    setSigError("");
    try {
      setSigPreview(await fileToSignature(file));
    } catch {
      setSigError("Could not read that image — try a clear photo of your signature.");
    }
  };

  const saveSigAndSign = () => {
    if (!sigPreview) return;
    onUpdateProfile({ signatureImage: sigPreview, signatureAsked: true });
    setAskSig(false);
    void (async () => {
      await signNow(sigPreview);
      // pull the new signature through to any previously signed registers
      await updateRegisterSignatures(profile.id, sigPreview);
    })();
  };

  const skipSig = () => {
    onUpdateProfile({ signatureAsked: true });
    setAskSig(false);
    void signNow();
  };

  const [fixingSig, setFixingSig] = useState(false);
  const [fixNote, setFixNote] = useState("");

  /** Staff: re-run the signature cleanup on every saved signature — all
   *  attendance registers plus every profile (this account and others). */
  const fixSignatures = async () => {
    setFixingSig(true);
    setFixNote("Cleaning signatures…");
    let fixed = 0;
    try {
      // 1) every attendance register (shared, hydrated to this device)
      for (const key of await allRegisterKeys()) {
        const data = (await pullLatest(key)) ?? readReg(key);
        let changed = false;
        for (const pid of Object.keys(data.rows)) {
          const img = data.rows[pid].signatureImage;
          if (!img) continue;
          const next = await reprocessSignature(img);
          if (next) {
            data.rows[pid] = { ...data.rows[pid], signatureImage: next };
            changed = true;
            fixed++;
          }
        }
        if (changed) {
          localStorage.setItem(key, JSON.stringify(data)); // also syncs to the cloud
          if (key === storageKey) setReg(data);
        }
      }

      // 2) profiles on this account (used the next time each learner signs)
      for (const p of loadProfiles()) {
        if (!p.signatureImage) continue;
        const next = await reprocessSignature(p.signatureImage);
        if (!next) continue;
        if (p.id === profile.id) onUpdateProfile({ signatureImage: next });
        else updateProfile(p.id, { signatureImage: next });
        fixed++;
      }

      // 3) profiles owned by other signed-in accounts (cloud)
      const dir = await fetchCloudDirectory();
      for (const p of dir?.profiles ?? []) {
        if (!p.signatureImage || !dir?.owners[p.id]) continue;
        const next = await reprocessSignature(p.signatureImage);
        if (!next) continue;
        const err = await updateCloudProfile(dir.owners[p.id], p.id, { signatureImage: next });
        if (!err) fixed++;
      }

      setFixNote(
        fixed ? `Cleaned ${fixed} signature${fixed === 1 ? "" : "s"}.` : "No saved signatures found."
      );
    } catch {
      setFixNote("Could not clean every signature — please try again.");
    } finally {
      setFixingSig(false);
    }
  };

  const setCell = (pid: string, field: keyof AttRow, value: string) => {
    const v = field === "name" || field === "surname" ? capWords(value) : value;
    save({ ...reg, rows: { ...reg.rows, [pid]: { ...reg.rows[pid], [field]: v } } });
  };

  const clearRow = (pid: string) => {
    const rows = { ...reg.rows };
    delete rows[pid];
    save({ ...reg, rows, order: reg.order.filter((id) => id !== pid) });
  };

  /** Super user only: wipe the whole register for the selected date. */
  const clearRegister = () => save(EMPTY);

  /** Print with a landscape @page rule injected for the duration of the dialog.
      (The rule can't live in styles.css — @page is global and would flip every
      other page's print, e.g. the Registration Form, into landscape.) */
  const printLandscape = () => {
    const style = document.createElement("style");
    style.textContent = "@page { size: A4 landscape; margin: 8mm; }";
    document.head.appendChild(style);
    window.print();
    setTimeout(() => style.remove(), 1000);
  };

  /** Gather every signed register (local + cloud) and open the print dialog with all of them. */
  const downloadAll = async () => {
    setLoadingAll(true);
    try {
      const regs: { date: string; data: AttData }[] = [];
      for (const key of await allRegisterKeys()) {
        const data = (await pullLatest(key)) ?? readReg(key);
        if (!Object.keys(data.rows).length) continue; // skip unsigned/empty registers
        regs.push({ date: key.slice("itss.attendance.".length), data });
      }
      regs.sort((a, b) => a.date.localeCompare(b.date));
      if (!regs.length) return;
      setAllRegs(regs);
      // let React render the sheets (and images lay out) before opening the print dialog
      setTimeout(() => {
        printLandscape();
        setAllRegs(null);
      }, 700);
    } finally {
      setLoadingAll(false);
    }
  };

  const onConfirm = () => {
    if (!confirming) return;
    if (confirming.kind === "register") clearRegister();
    else clearRow(confirming.pid);
    setConfirming(null);
  };

  // students only sign; the register itself is edited by staff
  const canEditRow = (_pid: string) => staff;

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
        form. {staff ? "Staff can edit any field, view past registers and download the PDF." : ""}
      </p>

      <div className="att-controls no-print">
        <label className="att-date">
          Session date{" "}
          <input type="date" value={dateIso} onChange={(e) => e.target.value && setDateIso(e.target.value)} />
        </label>
        <button className="btn ghost sm" onClick={() => void refresh()}>
          <Icon name="trend" size={15} /> Refresh
        </button>
        <button className="btn ghost sm" disabled={!canSign} onClick={onSignClick}>
          <Icon name="check" size={15} /> {signed ? "Signed" : "Sign the register — I'm here"}
        </button>
        {staff && (
          <button className="btn ghost sm" onClick={printLandscape}>
            <Icon name="download" size={15} /> Download as PDF
          </button>
        )}
        {staff && (
          <button className="btn ghost sm" disabled={loadingAll} onClick={() => void downloadAll()}>
            <Icon name="download" size={15} /> {loadingAll ? "Gathering registers…" : "Download all registers"}
          </button>
        )}
        {staff && (
          <button className="btn ghost sm" disabled={fixingSig} onClick={() => void fixSignatures()}>
            <Icon name="check" size={15} /> {fixingSig ? "Cleaning…" : "Fix signatures"}
          </button>
        )}
        {fixNote && <span className="att-note">{fixNote}</span>}
        {profile.role === "Super User" && (
          <button className="btn ghost sm danger" onClick={() => setConfirming({ kind: "register" })}>
            Clear register
          </button>
        )}
        {signed && (
          <span className="att-note">
            {staff ? "You have signed — you can still edit your row." : "You have signed the register."}
          </span>
        )}
      </div>

      {askSig && (
        <div className="card att-sigask no-print">
          <h3>Upload your signature</h3>
          <p>
            Sign your usual signature on a <strong>white piece of paper</strong>, take a clear
            photo (or scan) and upload it here. It is saved to your profile and used on the
            attendance register every Friday — you will only be asked this once.
          </p>
          <label className="btn">
            <Icon name="folder" /> Choose photo of my signature
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void onSigFile(e.target.files?.[0])}
            />
          </label>
          {sigError && <div className="auth-error">{sigError}</div>}
          {sigPreview && (
            <div className="att-sigpreview">
              <img src={sigPreview} alt="Your signature" />
            </div>
          )}
          <div className="att-sigask-actions">
            <button className="btn primary" disabled={!sigPreview} onClick={saveSigAndSign}>
              <Icon name="check" /> Save signature &amp; sign the register
            </button>
            <button className="btn ghost" onClick={skipSig}>
              Continue without a signature image
            </button>
          </div>
        </div>
      )}

      {allRegs &&
        createPortal(
          <div className="att-all">
            {allRegs.map((r) => (
              <StaticSheet key={r.date} dateIso={r.date} data={r.data} />
            ))}
          </div>,
          document.body
        )}
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
                <th>Time</th>
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
                      {pid && reg.rows[pid]?.signatureImage ? (
                        <img
                          className="att-sig-img"
                          src={reg.rows[pid].signatureImage}
                          alt={`${reg.rows[pid].name} signature`}
                        />
                      ) : pid ? (
                        cell(pid, "signature", "att-sig")
                      ) : null}
                      {pid && isSuper && (
                        <button
                          className="att-clear no-print"
                          title="Remove this learner from the register"
                          onClick={() => setConfirming({ kind: "row", pid })}
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

      {confirming && (
        <ConfirmModal
          title={confirming.kind === "register" ? "Clear this register?" : "Remove this learner?"}
          message={
            confirming.kind === "register" ? (
              <>All signatures and edits for this date will be removed. This cannot be undone.</>
            ) : (
              <>
                Remove{" "}
                <strong>
                  {reg.rows[confirming.pid]?.name} {reg.rows[confirming.pid]?.surname}
                </strong>{" "}
                from this register? Use this when someone signed by accident.
              </>
            )
          }
          confirmLabel={confirming.kind === "register" ? "Clear register" : "Remove learner"}
          danger
          onConfirm={onConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
