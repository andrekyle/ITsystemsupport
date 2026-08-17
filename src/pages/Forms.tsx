import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, RegistrationForm, Route } from "../types";
import { updateProfile } from "../store";
import { COURSE_META } from "../data/course";

/**
 * Registration Form + related paper forms replacement.
 *
 * The Student Registration Form mirrors the paper intake form so a learner
 * can fill it in on any device; staff can view or print the completed copy
 * from the student's profile. Add more forms alongside this one — they all
 * follow the same pattern: pre-fill from `profile.enrolment` where sensible,
 * persist to a dedicated field on `Profile`, expose a Print button that
 * uses `window.print()` with `@media print` A4 sizing.
 */

const BLANK_REG_FORM: RegistrationForm = {
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
  learnership: "System Support NQF 5",
  registrationDate: "",
  employmentStatus: "",
  employerName: "",
  employerAddress: "",
  employerRelationship: "",
  qualificationCourseNumber: COURSE_META.saqaId ?? "",
  nqfLevel: "5",
  courseCode: "",
  credits: String(COURSE_META.credits ?? ""),
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

/** Fill in the fields we already know from the learner's enrolment info so
 *  they don't have to retype what they've entered before. */
function seededFromProfile(p: Profile): RegistrationForm {
  const e = p.enrolment;
  return {
    ...BLANK_REG_FORM,
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
    highestQualification: p.registrationForm?.highestQualification || e?.highestQualification || "",
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
      <div className="eyebrow">
        <Icon name="document" size={15} />
        Learner forms
      </div>
      <h1 className="page-title">Forms</h1>
      <p className="page-sub">
        Fill in the paper forms online — your details save automatically and staff can print an
        official copy from your profile.
      </p>
      <StudentRegistrationForm profile={profile} onUpdateProfile={onUpdateProfile} />
    </>
  );
}

/* ------------------------------------------------------------------------- */

function StudentRegistrationForm({
  profile,
  onUpdateProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}) {
  const seeded = useMemo(() => seededFromProfile(profile), [profile]);
  const [form, setForm] = useState<RegistrationForm>(seeded);
  const dirty = useRef(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dirty.current) setForm(seeded);
  }, [seeded]);

  function update<K extends keyof RegistrationForm>(k: K, v: RegistrationForm[K]) {
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
    // A tiny delay lets React flush the save state into the DOM before printing.
    setTimeout(() => window.print(), 60);
  }

  return (
    <div className="card reg-form-wrap">
      <div className="reg-form-actions no-print">
        <button className="btn" onClick={save}>
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

      <div className="reg-form" ref={printRef}>
        <header className="reg-header">
          <div className="reg-logo">ERUDITE</div>
          <h2>Student Registration Form</h2>
        </header>

        <FieldSet legend="Student Information (Please print)">
          <Row2>
            <Field label="National ID" value={form.nationalId} onChange={(v) => update("nationalId", v)} />
            <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} />
          </Row2>
          <Row2>
            <Field label="Full Name" value={form.fullName} onChange={(v) => update("fullName", v)} />
            <Field label="Surname" value={form.surname} onChange={(v) => update("surname", v)} />
          </Row2>
          <Row2>
            <Field label="Nick Name" value={form.nickName} onChange={(v) => update("nickName", v)} />
            <Field label="Maiden Name" value={form.maidenName} onChange={(v) => update("maidenName", v)} />
          </Row2>
          <Row2>
            <Field label="Email Address" type="email" value={form.emailAddress} onChange={(v) => update("emailAddress", v)} />
            <Field label="Contact Number" value={form.contactNumber} onChange={(v) => update("contactNumber", v)} />
          </Row2>
          <Row2>
            <PickField
              label="Marital Status"
              value={form.maritalStatus}
              options={["Married", "Single", "Divorced", "Widowed"]}
              onChange={(v) => update("maritalStatus", v)}
            />
            <Field label="Dependants" value={form.dependants} onChange={(v) => update("dependants", v)} />
          </Row2>
          <Row2>
            <PickField
              label="Title"
              value={form.title}
              options={["Adv", "Prof", "Dr", "Mr", "Mrs", "Ms"]}
              onChange={(v) => update("title", v)}
            />
            <Field label="Physical Address" value={form.physicalAddress} onChange={(v) => update("physicalAddress", v)} />
          </Row2>
          <Row2>
            <Field label="Country Code" value={form.countryCode} onChange={(v) => update("countryCode", v)} />
            <Field label="Postal Code" value={form.postalCode} onChange={(v) => update("postalCode", v)} />
          </Row2>
        </FieldSet>

        <FieldSet legend="Passport (If applicable)">
          <Row3>
            <Field label="Passport #" value={form.passportNumber} onChange={(v) => update("passportNumber", v)} />
            <Field label="Country" value={form.passportCountry} onChange={(v) => update("passportCountry", v)} />
            <Field label="Expiry Date" type="date" value={form.passportExpiry} onChange={(v) => update("passportExpiry", v)} />
          </Row3>
        </FieldSet>

        <FieldSet legend="Ethnic Group">
          <Row2>
            <Field label="Group" value={form.ethnicGroup} onChange={(v) => update("ethnicGroup", v)} />
            <Field label="Region / Country" value={form.ethnicRegion} onChange={(v) => update("ethnicRegion", v)} />
          </Row2>
        </FieldSet>

        <FieldSet legend="Home Language">
          <PickField
            label="Home Language"
            value={form.homeLanguage}
            options={[
              "Afrikaans",
              "English",
              "isiNdebele",
              "isiXhosa",
              "isiZulu",
              "Sepedi",
              "Sesotho",
              "Setswana",
              "siSwati",
              "Tshivenda",
              "Xitsonga",
              "Other",
            ]}
            onChange={(v) => update("homeLanguage", v)}
          />
        </FieldSet>

        <FieldSet legend="Disability Status (Please tick)">
          <div className="reg-checks">
            <CheckField label="Physical" checked={form.disabilityPhysical} onChange={(v) => update("disabilityPhysical", v)} />
            <CheckField label="Hearing" checked={form.disabilityHearing} onChange={(v) => update("disabilityHearing", v)} />
            <CheckField label="Intellectual" checked={form.disabilityIntellectual} onChange={(v) => update("disabilityIntellectual", v)} />
            <CheckField label="Visual" checked={form.disabilityVisual} onChange={(v) => update("disabilityVisual", v)} />
          </div>
        </FieldSet>

        <FieldSet legend="Educational Details (Please print)">
          <Row2>
            <Field label="Last School Attended" value={form.lastSchoolAttended} onChange={(v) => update("lastSchoolAttended", v)} />
            <Field label="Highest Grade Completed" value={form.highestGradeCompleted} onChange={(v) => update("highestGradeCompleted", v)} />
          </Row2>
          <Row2>
            <Field label="Year Completed" value={form.yearCompleted} onChange={(v) => update("yearCompleted", v)} />
            <Field label="Highest Qualification" value={form.highestQualification} onChange={(v) => update("highestQualification", v)} />
          </Row2>
        </FieldSet>

        <FieldSet legend="Employment Details (Please print)">
          <Row3>
            <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
            <Field label="Job Title" value={form.jobTitle} onChange={(v) => update("jobTitle", v)} />
            <Field label="Learnership" value={form.learnership} onChange={(v) => update("learnership", v)} />
          </Row3>
          <Row2>
            <Field label="Registration Date" type="date" value={form.registrationDate} onChange={(v) => update("registrationDate", v)} />
            <Field label="Employment Status" value={form.employmentStatus} onChange={(v) => update("employmentStatus", v)} />
          </Row2>
          <Row2>
            <Field label="Employer Contact Name" value={form.employerName} onChange={(v) => update("employerName", v)} />
            <Field label="Employer Address" value={form.employerAddress} onChange={(v) => update("employerAddress", v)} />
          </Row2>
          <Row2>
            <Field label="Relationship" value={form.employerRelationship} onChange={(v) => update("employerRelationship", v)} />
            <Field label="Qualification Course Number" value={form.qualificationCourseNumber} onChange={(v) => update("qualificationCourseNumber", v)} />
          </Row2>
          <Row3>
            <Field label="NQF Level" value={form.nqfLevel} onChange={(v) => update("nqfLevel", v)} />
            <Field label="Course Code" value={form.courseCode} onChange={(v) => update("courseCode", v)} />
            <Field label="Credits" value={form.credits} onChange={(v) => update("credits", v)} />
          </Row3>
        </FieldSet>

        <p className="reg-declaration">
          By signing this form, I confirm that the programme I have enrolled in with Erudite Skills
          Development Consultants (Pty) Ltd is compliant with Erudite Skills Development Consultants
          (Pty) Ltd's official qualification and I agree that all coursework and assessments will be
          conducted in accordance with this qualification. I hereby confirm that I am aware of
          Erudite Skills Development Consultants (Pty) Ltd's refund policy. I hereby declare that I
          will conduct myself as a good and responsible learner.
        </p>

        <Row3>
          <Field
            label="Learner Signature (typed)"
            value={form.learnerSignature}
            onChange={(v) => update("learnerSignature", v)}
          />
          <Field
            label="Date"
            type="date"
            value={form.learnerSignatureDate}
            onChange={(v) => update("learnerSignatureDate", v)}
          />
          <Field
            label="Student Number"
            value={form.studentNumber}
            onChange={(v) => update("studentNumber", v)}
          />
        </Row3>

        <FieldSet legend="Administration and Document Control (staff)">
          <Row2>
            <PickField
              label="Meets Entry Requirements?"
              value={form.meetsEntryRequirements}
              options={["yes", "no"]}
              onChange={(v) => update("meetsEntryRequirements", v as "" | "yes" | "no")}
            />
            <CheckField
              label="Requires Bridging Course"
              checked={form.requiresBridging}
              onChange={(v) => update("requiresBridging", v)}
            />
          </Row2>
          <Row2>
            <PickField
              label="Admission Decision"
              value={form.admissionDecision}
              options={["admit", "not-admit"]}
              onChange={(v) => update("admissionDecision", v as "" | "admit" | "not-admit")}
            />
            <Field
              label="Authorised By (name)"
              value={form.authorisedByName}
              onChange={(v) => update("authorisedByName", v)}
            />
          </Row2>
          <Row2>
            <Field
              label="Authorised Date"
              type="date"
              value={form.authorisedByDate}
              onChange={(v) => update("authorisedByDate", v)}
            />
            <span />
          </Row2>
        </FieldSet>

        <footer className="reg-footer">
          <span>QCTO</span>
          <span>W&amp;RSETA</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------- small form primitives ---------- */

function FieldSet({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="reg-fieldset">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="reg-row-2">{children}</div>;
}

function Row3({ children }: { children: React.ReactNode }) {
  return <div className="reg-row-3">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="reg-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function PickField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="reg-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="reg-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
