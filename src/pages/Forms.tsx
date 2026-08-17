import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, RegistrationForm, Route } from "../types";
import { updateProfile } from "../store";

/**
 * Paper-form-accurate replacement for the Erudite Student Registration Form.
 * Layout follows the printed form section-by-section (see reference photo):
 *   - Student Information (label ⋮ value grid, 4-column rows)
 *   - Passport
 *   - Ethnic Group matrix (rows = subgroup, cols = region)
 *   - Home Language grid
 *   - Disability grid
 *   - Educational Details
 *   - Contact strip (orange bar with address + phone)
 *   - Employment Details
 *   - Learner declaration
 *   - Administration section
 *   - QCTO / W&RSETA footer strip
 */

const BLANK: RegistrationForm = {
  title: "",
  fullName: "",
  nickName: "",
  surname: "",
  maidenName: "",
  nationalId: "",
  dateOfBirth: "",
  emailAddress: "",
  contactNumber: "",
  maritalStatus: "",
  dependants: "",
  physicalAddress: "",
  countryCode: "",
  postalCode: "",
  passportNumber: "",
  passportCountry: "",
  passportExpiry: "",
  ethnicGroup: "",
  ethnicRegion: "",
  homeLanguage: "",
  disabilityPhysical: false,
  disabilityHearing: false,
  disabilityIntellectual: false,
  disabilityVisual: false,
  lastSchoolAttended: "",
  highestGradeCompleted: "",
  yearCompleted: "",
  highestQualification: "",
  company: "",
  jobTitle: "",
  learnership: "Learnership",
  registrationDate: "",
  employmentStatus: "",
  employerName: "",
  employerAddress: "",
  employerRelationship: "",
  qualificationCourseNumber: "",
  nqfLevel: "",
  courseCode: "",
  credits: "",
  learnerSignature: "",
  learnerSignatureDate: "",
  studentNumber: "",
  admissionDecision: "",
  meetsEntryRequirements: "",
  requiresBridging: false,
  authorisedByName: "",
  authorisedByDate: "",
  savedAt: "",
};

function seedFromProfile(p: Profile): RegistrationForm {
  const e = p.enrolment;
  return {
    ...BLANK,
    ...(p.registrationForm ?? {}),
    fullName: p.registrationForm?.fullName || e?.firstNames || p.name || "",
    surname: p.registrationForm?.surname || e?.surname || "",
    maidenName: p.registrationForm?.maidenName || e?.maidenName || "",
    title: p.registrationForm?.title || e?.title || "",
    nationalId: p.registrationForm?.nationalId || e?.idNumber || "",
    emailAddress: p.registrationForm?.emailAddress || e?.email || "",
    contactNumber: p.registrationForm?.contactNumber || e?.cellphone || e?.telephone || "",
    physicalAddress: p.registrationForm?.physicalAddress || e?.physicalAddress || "",
    postalCode: p.registrationForm?.postalCode || e?.physicalPostalCode || "",
    homeLanguage: p.registrationForm?.homeLanguage || e?.homeLanguage || "",
    highestQualification:
      p.registrationForm?.highestQualification || e?.highestQualification || "",
    company: p.registrationForm?.company || e?.employer || "",
    learnerSignature: p.registrationForm?.learnerSignature || e?.signature || "",
    learnerSignatureDate: p.registrationForm?.learnerSignatureDate || e?.signedDate || "",
    studentNumber: p.registrationForm?.studentNumber || p.id,
  };
}

export function FormsPage({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  route: Route;
  navigate: (r: Route) => void;
}) {
  return (
    <>
      <div className="eyebrow no-print">
        <Icon name="document" size={15} />
        Learner forms
      </div>
      <h1 className="page-title no-print">Forms</h1>
      <p className="page-sub no-print">
        Fill in the paper forms online — your details save automatically and staff can print an
        official copy from your profile.
      </p>
      <StudentRegistrationForm profile={profile} onUpdateProfile={onUpdateProfile} />
    </>
  );
}

/* ------------------------------------------------------------------------- */

const ETHNIC_ROWS = [
  "Angola",
  "European Countries",
  "North American Countries",
  "South American Countries",
];
const ETHNIC_COLS = [
  "Asian Countries",
  "Australia & New Zealand",
  "Mauritius",
  "Mozambique",
  "Namibia",
  "Botswana",
  "British & British Commonwealth Countries",
  "Central & South American Countries",
  "Seychelles",
  "South Africa",
];

const HOME_LANGS = [
  ["Afrikaans", "English", "isiNdebele", "isiXhosa", "isiZulu"],
  ["Sepedi", "Sesotho", "Setswana", "siSwati", "Tshivenda"],
  ["Xitsonga", "Other"],
];

const DISABILITIES: Array<{ key: keyof RegistrationForm; label: string }> = [
  { key: "disabilityPhysical", label: "Physical" },
  { key: "disabilityHearing", label: "Hearing" },
  { key: "disabilityIntellectual", label: "Intellectual" },
  { key: "disabilityVisual", label: "Visual" },
];

function StudentRegistrationForm({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  const seeded = useMemo(() => seedFromProfile(profile), [profile]);
  const [form, setForm] = useState<RegistrationForm>(seeded);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setForm(seeded);
  }, [seeded]);

  function set<K extends keyof RegistrationForm>(k: K, v: RegistrationForm[K]) {
    dirty.current = true;
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function save() {
    const next: RegistrationForm = { ...form, savedAt: new Date().toISOString() };
    onUpdateProfile({ registrationForm: next });
    updateProfile(profile.id, { registrationForm: next });
    setForm(next);
    dirty.current = false;
  }

  function print() {
    save();
    setTimeout(() => window.print(), 60);
  }

  return (
    <div className="card srf-wrap">
      <div className="srf-actions no-print">
        <button className="btn primary" onClick={save}>
          <Icon name="checkCircle" size={15} /> Save
        </button>
        <button className="btn ghost" onClick={print}>
          <Icon name="download" size={15} /> Print / PDF
        </button>
        {form.savedAt && (
          <span className="mini-note">
            Saved {new Date(form.savedAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="srf-page">
        {/* --- Masthead ------------------------------------------------------ */}
        <div className="srf-mast">
          <div className="srf-logo" aria-hidden>
            <span className="srf-logo-mark">e</span>
            <span className="srf-logo-word">rudite</span>
          </div>
          <div className="srf-mast-title">Student Registration Form</div>
        </div>

        {/* --- Student Information ----------------------------------------- */}
        <SectionLabel text="Student Information (Please print)" />
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="15%">National ID</TL>
              <TF w="35%" value={form.nationalId} onChange={(v) => set("nationalId", v)} />
              <TL w="15%">Date of Birth</TL>
              <TF w="35%" type="date" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
            </tr>
            <tr>
              <TL>Full Name</TL>
              <TF value={form.fullName} onChange={(v) => set("fullName", v)} />
              <TL>Surname</TL>
              <TF value={form.surname} onChange={(v) => set("surname", v)} />
            </tr>
            <tr>
              <TL>Nick Name</TL>
              <TF value={form.nickName} onChange={(v) => set("nickName", v)} />
              <TL>Maiden Name</TL>
              <TF value={form.maidenName} onChange={(v) => set("maidenName", v)} />
            </tr>
            <tr>
              <TL>Email Address</TL>
              <TF type="email" value={form.emailAddress} onChange={(v) => set("emailAddress", v)} />
              <TL>Contact Number</TL>
              <TF value={form.contactNumber} onChange={(v) => set("contactNumber", v)} />
            </tr>
          </tbody>
        </table>

        {/* Title tickboxes + marital status + physical address ------------- */}
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="8%">Title</TL>
              <td className="srf-inline" colSpan={3}>
                {["Adv", "Prof", "Dr", "Mr", "Mrs", "Ms"].map((t) => (
                  <Tick
                    key={t}
                    label={t}
                    checked={form.title === t}
                    onChange={(v) => set("title", v ? t : "")}
                  />
                ))}
              </td>
            </tr>
            <tr>
              <TL>Marital Status</TL>
              <td className="srf-inline" colSpan={3}>
                {["Married", "Single", "Divorced", "Widowed"].map((s) => (
                  <Tick
                    key={s}
                    label={s}
                    checked={form.maritalStatus === s}
                    onChange={(v) => set("maritalStatus", v ? s : "")}
                  />
                ))}
                <span className="srf-inline-gap" />
                <TInlineLabel>Dependants</TInlineLabel>
                <input
                  className="srf-input srf-input-narrow"
                  value={form.dependants}
                  onChange={(e) => set("dependants", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <TL w="15%">Physical Address</TL>
              <td colSpan={3}>
                <input
                  className="srf-input"
                  value={form.physicalAddress}
                  onChange={(e) => set("physicalAddress", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <TL>Country Code</TL>
              <TF value={form.countryCode} onChange={(v) => set("countryCode", v)} />
              <TL>Postal Code</TL>
              <TF value={form.postalCode} onChange={(v) => set("postalCode", v)} />
            </tr>
          </tbody>
        </table>

        {/* --- Passport ----------------------------------------------------- */}
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="8%">Passport</TL>
              <TL w="8%">Number</TL>
              <TF w="18%" value={form.passportNumber} onChange={(v) => set("passportNumber", v)} />
              <TL w="10%">Country</TL>
              <TF w="20%" value={form.passportCountry} onChange={(v) => set("passportCountry", v)} />
              <TL w="10%">Expiry</TL>
              <TF w="16%" type="date" value={form.passportExpiry} onChange={(v) => set("passportExpiry", v)} />
            </tr>
          </tbody>
        </table>

        {/* --- Ethnic Group matrix ---------------------------------------- */}
        <SectionLabel text="Ethnic Group (Please tick the appropriate box(es))" />
        <table className="srf-matrix">
          <thead>
            <tr>
              <th></th>
              {ETHNIC_COLS.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ETHNIC_ROWS.map((r) => (
              <tr key={r}>
                <th>{r}</th>
                {ETHNIC_COLS.map((c) => {
                  const key = `${r}||${c}`;
                  const on = form.ethnicGroup === key;
                  return (
                    <td key={c}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => set("ethnicGroup", e.target.checked ? key : "")}
                        aria-label={`${r} — ${c}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- Home Language grid ----------------------------------------- */}
        <SectionLabel text="Home Language (Please tick)" />
        <table className="srf-table srf-check-grid">
          <tbody>
            {HOME_LANGS.map((row, ri) => (
              <tr key={ri}>
                {row.map((lang) => (
                  <td key={lang} className="srf-inline">
                    <Tick
                      label={lang}
                      checked={form.homeLanguage === lang}
                      onChange={(v) => set("homeLanguage", v ? lang : "")}
                    />
                  </td>
                ))}
                {/* pad the row so columns align */}
                {Array.from({ length: 5 - row.length }).map((_, i) => (
                  <td key={`p${i}`} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- Disability Status ------------------------------------------ */}
        <SectionLabel text="Disability Status (Please tick)" />
        <table className="srf-table srf-check-grid">
          <tbody>
            <tr>
              {DISABILITIES.map((d) => (
                <td key={d.label} className="srf-inline">
                  <Tick
                    label={d.label}
                    checked={form[d.key] as boolean}
                    onChange={(v) => set(d.key, v as never)}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* --- Educational Details ---------------------------------------- */}
        <SectionLabel text="Educational Details (Please print)" />
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="20%">Last School Attended</TL>
              <TF value={form.lastSchoolAttended} onChange={(v) => set("lastSchoolAttended", v)} />
              <TL w="20%">Grade Completed</TL>
              <TF value={form.highestGradeCompleted} onChange={(v) => set("highestGradeCompleted", v)} />
            </tr>
            <tr>
              <TL>Highest Qualification</TL>
              <TF value={form.highestQualification} onChange={(v) => set("highestQualification", v)} />
              <TL>Year Completed</TL>
              <TF value={form.yearCompleted} onChange={(v) => set("yearCompleted", v)} />
            </tr>
          </tbody>
        </table>

        {/* --- Address strip (orange) ------------------------------------- */}
        <div className="srf-strip">
          <span>85 Vale Avenue, 2 Anniston Road, New Redruth, Alberton Park, 1449</span>
          <span>011 972 6266</span>
        </div>

        {/* --- Employment Details ----------------------------------------- */}
        <SectionLabel text="Employment Details (Please print)" />
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="12%">Company</TL>
              <TF value={form.company} onChange={(v) => set("company", v)} />
              <TL w="12%">Job Title</TL>
              <TF value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />
              <TL w="12%">Learnership</TL>
              <TF value={form.learnership} onChange={(v) => set("learnership", v)} />
            </tr>
            <tr>
              <TL>Registration Date</TL>
              <TF type="date" value={form.registrationDate} onChange={(v) => set("registrationDate", v)} />
              <TL>Employment Status</TL>
              <TF value={form.employmentStatus} onChange={(v) => set("employmentStatus", v)} />
              <TL>Contact</TL>
              <TF value={form.contactNumber} onChange={(v) => set("contactNumber", v)} />
            </tr>
            <tr>
              <TL>Name and Surname</TL>
              <TF value={form.employerName} onChange={(v) => set("employerName", v)} />
              <TL>Employer Address</TL>
              <TF value={form.employerAddress} onChange={(v) => set("employerAddress", v)} />
              <TL>Email Address</TL>
              <TF value={form.emailAddress} onChange={(v) => set("emailAddress", v)} />
            </tr>
            <tr>
              <TL>Relationship</TL>
              <TF value={form.employerRelationship} onChange={(v) => set("employerRelationship", v)} />
              <TL>NQF Level</TL>
              <TF value={form.nqfLevel} onChange={(v) => set("nqfLevel", v)} />
              <TL>Credits</TL>
              <TF value={form.credits} onChange={(v) => set("credits", v)} />
            </tr>
            <tr>
              <TL>Qualification / Course Title</TL>
              <TF value={form.qualificationCourseNumber} onChange={(v) => set("qualificationCourseNumber", v)} />
              <TL>Course Code</TL>
              <TF value={form.courseCode} onChange={(v) => set("courseCode", v)} />
              <TL>Registration Date</TL>
              <TF type="date" value={form.registrationDate} onChange={(v) => set("registrationDate", v)} />
            </tr>
          </tbody>
        </table>

        {/* --- Declaration + Student Number ------------------------------- */}
        <div className="srf-decl">
          <p>
            I, <SmallInput value={form.learnerSignature} onChange={(v) => set("learnerSignature", v)} />
            <strong> STUDENT NUMBER</strong>{" "}
            <SmallInput value={form.studentNumber} onChange={(v) => set("studentNumber", v)} />{" "}
            <strong>STUDENT ID</strong> — hereby confirm that the programme I have enrolled in with
            Erudite Skills Development Consultants (Pty) Ltd is compliant with Erudite Skills
            Development Consultants (Pty) Ltd's official qualification and I agree that all
            coursework and assessments will be conducted in accordance with this qualification.
          </p>
          <p>
            I hereby confirm that I am aware of Erudite Skills Development Consultants (Pty) Ltd's
            refund policy. I hereby declare that I will conduct myself as a good and responsible
            learner.
          </p>
          <div className="srf-sig-row">
            <div>
              <SmallInput value={form.learnerSignature} onChange={(v) => set("learnerSignature", v)} placeholder="Signature" />
              <div className="srf-sig-line">Signature</div>
            </div>
            <div>
              <SmallInput value={form.physicalAddress} onChange={(v) => set("physicalAddress", v)} placeholder="Place" />
              <div className="srf-sig-line">Place</div>
            </div>
            <div>
              <SmallInput type="date" value={form.learnerSignatureDate} onChange={(v) => set("learnerSignatureDate", v)} />
              <div className="srf-sig-line">Date</div>
            </div>
          </div>
        </div>

        {/* --- Administration and Document Control ------------------------ */}
        <SectionLabel text="Administration and Document Control (To be completed by the Administrator)" />
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="20%">Certified Copy of ID</TL>
              <td className="srf-inline">
                <TickYesNo yes={form.meetsEntryRequirements === "yes"} no={form.meetsEntryRequirements === "no"} onYes={() => set("meetsEntryRequirements", "yes")} onNo={() => set("meetsEntryRequirements", "no")} />
              </td>
              <TL w="20%">Certified Copy of Highest Qualification</TL>
              <td className="srf-inline">
                <TickYesNo yes={form.admissionDecision === "admit"} no={form.admissionDecision === "not-admit"} onYes={() => set("admissionDecision", "admit")} onNo={() => set("admissionDecision", "not-admit")} />
              </td>
            </tr>
            <tr>
              <TL>Entry Requirements</TL>
              <td className="srf-inline" colSpan={3}>
                {["Meets Entry", "Doesn't Meet Entry", "Requires Bridging"].map((opt) => (
                  <Tick
                    key={opt}
                    label={opt}
                    checked={
                      (opt === "Meets Entry" && form.meetsEntryRequirements === "yes") ||
                      (opt === "Doesn't Meet Entry" && form.meetsEntryRequirements === "no") ||
                      (opt === "Requires Bridging" && form.requiresBridging)
                    }
                    onChange={(v) => {
                      if (opt === "Meets Entry") set("meetsEntryRequirements", v ? "yes" : "");
                      else if (opt === "Doesn't Meet Entry") set("meetsEntryRequirements", v ? "no" : "");
                      else set("requiresBridging", v);
                    }}
                  />
                ))}
              </td>
            </tr>
            <tr>
              <TL>Admission Decision</TL>
              <td className="srf-inline" colSpan={3}>
                {["Accepted with Merit", "Accepted", "Rejected"].map((opt) => (
                  <Tick
                    key={opt}
                    label={opt}
                    checked={
                      (opt === "Accepted" && form.admissionDecision === "admit") ||
                      (opt === "Rejected" && form.admissionDecision === "not-admit") ||
                      (opt === "Accepted with Merit" && form.admissionDecision === "admit" && form.requiresBridging)
                    }
                    onChange={(v) => {
                      if (opt === "Accepted") set("admissionDecision", v ? "admit" : "");
                      else if (opt === "Rejected") set("admissionDecision", v ? "not-admit" : "");
                    }}
                  />
                ))}
              </td>
            </tr>
            <tr>
              <TL>Authorised By</TL>
              <TF value={form.authorisedByName} onChange={(v) => set("authorisedByName", v)} />
              <TL>Authorised Date</TL>
              <TF type="date" value={form.authorisedByDate} onChange={(v) => set("authorisedByDate", v)} />
            </tr>
          </tbody>
        </table>

        {/* --- Footer with partner logos ----------------------------------- */}
        <div className="srf-footer">
          <span className="srf-logo srf-mini" aria-hidden>
            <span className="srf-logo-mark">e</span>
            <span className="srf-logo-word">rudite</span>
          </span>
          <div className="srf-badge srf-qcto">QCTO</div>
          <div className="srf-badge srf-seta">W&amp;RSETA</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small primitives (kept private to this file) ---------- */

function SectionLabel({ text }: { text: string }) {
  return <div className="srf-section-label">{text}</div>;
}

function TL({ children, w }: { children: React.ReactNode; w?: string }) {
  return (
    <td className="srf-label" style={w ? { width: w } : undefined}>
      {children}
    </td>
  );
}

function TF({
  value,
  onChange,
  type = "text",
  w,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  w?: string;
}) {
  return (
    <td className="srf-cell" style={w ? { width: w } : undefined}>
      <input
        className="srf-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </td>
  );
}

function TInlineLabel({ children }: { children: React.ReactNode }) {
  return <span className="srf-inline-label">{children}</span>;
}

function Tick({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="srf-tick">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function TickYesNo({
  yes,
  no,
  onYes,
  onNo,
}: {
  yes: boolean;
  no: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <>
      <label className="srf-tick">
        <input type="checkbox" checked={yes} onChange={onYes} />
        <span>Yes</span>
      </label>
      <label className="srf-tick">
        <input type="checkbox" checked={no} onChange={onNo} />
        <span>No</span>
      </label>
    </>
  );
}

function SmallInput({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      className="srf-input srf-input-inline"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
