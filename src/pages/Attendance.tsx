import { useCallback, useEffect, useState } from "react";
import type { Profile } from "../types";
import { isStaff } from "../types";
import { COURSE_META, MODULES } from "../data/course";
import { supabase } from "../lib/supabase";
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

/**
 * Reads a photo/scan of a signature on white paper and enhances it: adapts to
 * the photo's lighting, removes the paper plus any yellow/grey shadows, and
 * redraws the ink in a clean dark colour so only a crisp signature remains.
 */
function fileToSignature(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = Math.min(480, img.width);
      const h = Math.round((img.height / img.width) * w);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;

      // estimate the paper brightness (75th percentile of luminance) so the
      // cut-off adapts to dim photos, yellow paper tints and soft shadows
      const lums = new Float32Array(px.length / 4);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        lums[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      }
      const sorted = Float32Array.from(lums).sort();
      const paper = Math.max(120, sorted[Math.floor(sorted.length * 0.75)]);

      // pixels close to paper brightness (incl. yellowish shadows) → transparent;
      // clearly darker pixels = ink, redrawn in a uniform dark colour
      const start = paper * 0.85; // must be >15% darker than the paper to count
      const full = paper * 0.55; // 45% darker = fully opaque ink
      for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        const a = ((start - lums[j]) / (start - full)) * 255;
        px[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
        // clean dark ink — removes any yellow/brown colour cast from the photo
        px[i] = 16;
        px[i + 1] = 16;
        px[i + 2] = 32;
      }
      ctx.putImageData(data, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
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

  // live clock so the sign button opens by itself at 08:30 without a reload
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const today = isoDate(now);
  const isToday = dateIso === today;
  // students may only sign on the session day itself, from 08:30 in the morning
  const opensAt = new Date(`${dateIso}T08:30:00`);
  const openNow = isToday && now >= opensAt;
  const signed = !!reg.rows[profile.id];
  const canSign = !signed && (staff || openNow);

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
      name: e?.firstNames || parts.slice(0, -1).join(" ") || profile.name,
      surname: e?.surname || (parts.length > 1 ? parts[parts.length - 1] : ""),
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
    void signNow(sigPreview);
  };

  const skipSig = () => {
    onUpdateProfile({ signatureAsked: true });
    setAskSig(false);
    void signNow();
  };

  const setCell = (pid: string, field: keyof AttRow, value: string) =>
    save({ ...reg, rows: { ...reg.rows, [pid]: { ...reg.rows[pid], [field]: value } } });

  const clearRow = (pid: string) => {
    const rows = { ...reg.rows };
    delete rows[pid];
    save({ ...reg, rows, order: reg.order.filter((id) => id !== pid) });
  };

  /** Super user only: wipe the whole register for the selected date. */
  const clearRegister = () => save(EMPTY);

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
        <button className="btn" onClick={() => void refresh()}>
          <Icon name="trend" /> Refresh
        </button>
        <button className="btn primary" disabled={!canSign} onClick={onSignClick}>
          <Icon name="check" /> {signed ? "Signed" : "Sign the register — I'm here"}
        </button>
        {staff && (
          <button className="btn" onClick={() => window.print()}>
            <Icon name="download" /> Download as PDF
          </button>
        )}
        {profile.role === "Super User" && (
          <button className="btn danger" onClick={() => setConfirming({ kind: "register" })}>
            Clear register
          </button>
        )}
        {signed && (
          <span className="att-note">
            {staff ? "You have signed — you can still edit your row." : "You have signed the register."}
          </span>
        )}
        {!signed && !canSign && (
          <span className="att-note">
            {isToday
              ? "Signing opens at 08:30 this morning."
              : "Signing opens at 08:30 on the day of the session."}
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
