import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Profile, RegistrationForm, Route } from "../types";
import { updateProfile } from "../store";

/**
 * Eruditio Student Registration Form — laid out to match the paper form
 * exactly (see reference PDF in the repo). White background, blue title,
 * black hairline grid, orange contact strip, matching country nationality
 * matrix, home-language grid, disability grid, and page-2 employment /
 * declaration / admission decision blocks.
 */

const BLANK: RegistrationForm = {
  title: "",
  gender: "",
  fullName: "",
  nickName: "",
  surname: "",
  maidenName: "",
  nationalId: "",
  dateOfBirth: "",
  emailAddress: "",
  contactNumber: "",
  ethnicGroup: "",
  maritalStatus: "",
  dependants: "",
  employmentStatusYesNo: "",
  idType: "",
  physicalAddress: "",
  postalAddress: "",
  addressCode: "",
  postalCode: "",
  passportNumber: "",
  passportCountry: "",
  passportExpiry: "",
  nationality: "",
  ethnicRegion: "",
  homeLanguage: "",
  disabilityStatus: "",
  disabilityPhysical: false,
  disabilityHearing: false,
  disabilityIntellectual: false,
  disabilityVisual: false,
  lastSchoolAttended: "",
  highestGradeCompleted: "",
  schoolDistrict: "",
  yearAchievedSchool: "",
  highestQualification: "",
  yearAchievedQualification: "",
  institution: "",
  awards: "",
  yearCompleted: "",
  company: "",
  jobTitle: "",
  learnership: "",
  startDate: "",
  employmentStatus: "",
  industry: "",
  employerContactNumber: "",
  altContactName: "",
  altContactNumber: "",
  altContactRelationship: "",
  altContactEmail: "",
  qualificationTitle: "",
  nqfLevel: "",
  saqaId: "",
  credits: "",
  courseCode: "",
  notionalHours: "",
  registrationDate: "",
  enrolmentDate: "",
  qualificationCourseNumber: "",
  employerName: "",
  employerAddress: "",
  employerRelationship: "",
  signedAt: "",
  learnerSignature: "",
  learnerSignatureDate: "",
  studentNumber: "",
  docIdPassport: false,
  docHighestCert: false,
  docProofResidence: false,
  docCvProfile: false,
  verifiedBy: "",
  verificationDate: "",
  entryReqMeets: false,
  entryReqDoesntMeet: false,
  entryReqBridging: false,
  entryReqOther: "",
  admitStudent: false,
  doNotAdmit: false,
  requiresAdditionalDocs: false,
  authorisedByName: "",
  authorisedByDate: "",
  admissionDecision: "",
  meetsEntryRequirements: "",
  requiresBridging: false,
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
    postalAddress: p.registrationForm?.postalAddress || e?.postalAddress || e?.physicalAddress || "",
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

const NATIONALITIES = [
  "Angola",
  "Asian Countries",
  "Australia & New Zeeland",
  "Botswana",
  "Brittan & British Isles",
  "Central & South American Countries",
  "European Countries",
  "Lesotho",
  "Malawi",
  "Mauritius",
  "Mozambique",
  "Namibia",
  "North American Countries",
  "Other & Rest of Oceania",
  "Rest of Africa",
  "SADC",
  "Seychelles",
  "South Africa",
  "Swaziland",
  "Tanzania",
  "Zaire",
  "Zambia",
  "Zimbabwe",
  "Other",
];

const HOME_LANG_ROW_1 = ["Afrikaans", "English", "isiNdebele", "xiTsonga", "isiXhosa", "isiZulu"];
const HOME_LANG_ROW_2 = ["sePedi", "seSotho", "seTswana", "siSwati", "tshiVenda", "Other"];

const DISABILITY_ROW_1 = ["Communication", "Emotional", "Hearing", "Intellectual"];
const DISABILITY_ROW_2 = ["Physical", "Multiple", "Unspecified", "None"];

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
        Complete the paper forms online — details save automatically and staff can print an
        official copy from your profile.
      </p>
      <StudentRegistrationForm profile={profile} onUpdateProfile={onUpdateProfile} />
    </>
  );
}

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

      {/* ============================== PAGE 1 ============================== */}
      <div className="srf-page">
        <EruditioMasthead />
        <h2 className="srf-title">Student Registration Form</h2>

        <div className="srf-section-title">Student Information: <em>(Please print)</em></div>
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="14%">National ID</TL>
              <TF w="36%" value={form.nationalId} onChange={(v) => set("nationalId", v)} />
              <TL w="14%">Date of Birth</TL>
              <TF w="36%" type="date" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
            </tr>
            <tr>
              <TL>Full Names</TL>
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

        {/* Title | Gender | Ethnic Group row */}
        <table className="srf-table srf-narrow-labels">
          <tbody>
            <tr>
              <TL w="7%">Title</TL>
              <TF w="10%" value={form.title} onChange={(v) => set("title", v)} />
              <TL w="8%">Gender</TL>
              <TF w="7%" value={form.gender} onChange={(v) => set("gender", v)} />
              <TL w="12%">Ethnic Group</TL>
              {["African", "Indian", "Coloured", "Asian", "White"].map((eg) => (
                <TCTick
                  key={eg}
                  w="11.2%"
                  label={eg}
                  checked={form.ethnicGroup === eg}
                  onChange={(v) => set("ethnicGroup", v ? eg : "")}
                />
              ))}
            </tr>
            <tr>
              <TL>Marital Status</TL>
              <TCTick w="10%" label="Single" checked={form.maritalStatus === "Single"} onChange={(v) => set("maritalStatus", v ? "Single" : "")} />
              <TCTick w="9%" label="Married" checked={form.maritalStatus === "Married"} onChange={(v) => set("maritalStatus", v ? "Married" : "")} />
              <TCTick w="9%" label="Divorced" checked={form.maritalStatus === "Divorced"} onChange={(v) => set("maritalStatus", v ? "Divorced" : "")} />
              <TCTick w="9%" label="Widowed" checked={form.maritalStatus === "Widowed"} onChange={(v) => set("maritalStatus", v ? "Widowed" : "")} />
              <TL w="11%">Dependants</TL>
              <TF w="12%" value={form.dependants} onChange={(v) => set("dependants", v)} />
              <TL w="15%">Employment Status</TL>
              <TCTick w="7%" label="Yes" checked={form.employmentStatusYesNo === "yes"} onChange={(v) => set("employmentStatusYesNo", v ? "yes" : "")} />
              <TCTick w="7%" label="No" checked={form.employmentStatusYesNo === "no"} onChange={(v) => set("employmentStatusYesNo", v ? "no" : "")} />
            </tr>
            <tr>
              <TL>ID Type</TL>
              {["Passport No", "Driver's License", "Temp ID No", "ID Number"].map((t) => (
                <TCTick
                  key={t}
                  label={t}
                  checked={form.idType === t}
                  onChange={(v) => set("idType", v ? t : "")}
                />
              ))}
              <td colSpan={5} />
            </tr>
          </tbody>
        </table>

        {/* Physical / Postal addresses */}
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="14%">Physical Address</TL>
              <td className="srf-cell" style={{ width: "36%" }}>
                <textarea
                  className="srf-input srf-textarea"
                  value={form.physicalAddress}
                  onChange={(e) => set("physicalAddress", e.target.value)}
                />
              </td>
              <TL w="14%">Postal Address</TL>
              <td className="srf-cell" style={{ width: "36%" }}>
                <textarea
                  className="srf-input srf-textarea"
                  value={form.postalAddress}
                  onChange={(e) => set("postalAddress", e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <TL>Address Code</TL>
              <TF value={form.addressCode} onChange={(v) => set("addressCode", v)} />
              <TL>Postal Code</TL>
              <TF value={form.postalCode} onChange={(v) => set("postalCode", v)} />
            </tr>
          </tbody>
        </table>

        {/* Nationality matrix */}
        <div className="srf-section-title">Nationality: <em>(Please tick the relevant country you are from)</em></div>
        <table className="srf-table srf-nationality">
          <tbody>
            {chunks(NATIONALITIES, 6).map((row, ri) => (
              <tr key={ri}>
                {row.map((n) => (
                  <td key={n} className={`srf-tick-cell${form.nationality === n ? " on" : ""}`}
                      onClick={() => set("nationality", form.nationality === n ? "" : n)}>
                    <div className="srf-cell-label">{n}</div>
                  </td>
                ))}
                {/* pad row so every row has 6 cells */}
                {Array.from({ length: 6 - row.length }).map((_, i) => (
                  <td key={`pad-${i}`} className="srf-tick-cell" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Home Language */}
        <div className="srf-section-title">Home Language: <em>(Please tick)</em></div>
        <table className="srf-table srf-nationality">
          <tbody>
            <tr>
              {HOME_LANG_ROW_1.map((l) => (
                <td key={l} className={`srf-tick-cell${form.homeLanguage === l ? " on" : ""}`}
                    onClick={() => set("homeLanguage", form.homeLanguage === l ? "" : l)}>
                  <div className="srf-cell-label">{l}</div>
                </td>
              ))}
            </tr>
            <tr>
              {HOME_LANG_ROW_2.map((l) => (
                <td key={l} className={`srf-tick-cell${form.homeLanguage === l ? " on" : ""}`}
                    onClick={() => set("homeLanguage", form.homeLanguage === l ? "" : l)}>
                  <div className="srf-cell-label">{l}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Disability Status */}
        <div className="srf-section-title">Disability Status: <em>(Please tick)</em></div>
        <table className="srf-table srf-nationality">
          <tbody>
            <tr>
              {DISABILITY_ROW_1.map((d) => (
                <td key={d} className={`srf-tick-cell${form.disabilityStatus === d ? " on" : ""}`}
                    onClick={() => set("disabilityStatus", form.disabilityStatus === d ? "" : d)}>
                  <div className="srf-cell-label">{d}</div>
                </td>
              ))}
            </tr>
            <tr>
              {DISABILITY_ROW_2.map((d) => (
                <td key={d} className={`srf-tick-cell${form.disabilityStatus === d ? " on" : ""}`}
                    onClick={() => set("disabilityStatus", form.disabilityStatus === d ? "" : d)}>
                  <div className="srf-cell-label">{d}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Educational Status */}
        <div className="srf-section-title">Educational Status: <em>(Please print)</em></div>
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="18%">Last School Attended</TL>
              <TF w="47%" value={form.lastSchoolAttended} onChange={(v) => set("lastSchoolAttended", v)} />
              <TL w="15%">Grade Completed</TL>
              <TF w="20%" value={form.highestGradeCompleted} onChange={(v) => set("highestGradeCompleted", v)} />
            </tr>
            <tr>
              <TL>School District</TL>
              <TF value={form.schoolDistrict} onChange={(v) => set("schoolDistrict", v)} />
              <TL>Year Achieved</TL>
              <TF value={form.yearAchievedSchool} onChange={(v) => set("yearAchievedSchool", v)} />
            </tr>
            <tr>
              <TL>Highest Qualification</TL>
              <TF value={form.highestQualification} onChange={(v) => set("highestQualification", v)} />
              <TL>Year Achieved</TL>
              <TF value={form.yearAchievedQualification} onChange={(v) => set("yearAchievedQualification", v)} />
            </tr>
            <tr>
              <TL>Institution</TL>
              <TF value={form.institution} onChange={(v) => set("institution", v)} />
              <TL>Awards</TL>
              <TF value={form.awards} onChange={(v) => set("awards", v)} />
            </tr>
          </tbody>
        </table>

        {/* Orange contact strip */}
        <div className="srf-orange-strip">
          <span className="srf-pin">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5z"/>
            </svg>
            45 Villa Valencia, 2 Anemoon Road, Glen Marais, Kempton Park, 1619
          </span>
          <span className="srf-phone">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M6.6 10.8c1.4 2.8 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.9.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10 21 3 14 3 5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.4.2 2.7.6 3.9.1.4 0 .8-.2 1.1L6.6 10.8z"/>
            </svg>
            011 973 0205
          </span>
        </div>

        <div className="srf-pagebreak" />

        {/* ============================== PAGE 2 ============================== */}
        <div className="srf-section-title">Employment Details: <em>(Please print)</em></div>
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="14%">Company</TL>
              <TF w="36%" value={form.company} onChange={(v) => set("company", v)} />
              <TL w="14%">Job Title</TL>
              <TF w="18%" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />
              <TL w="12%">Learnership</TL>
              <TF w="6%" value={form.learnership} onChange={(v) => set("learnership", v)} />
            </tr>
            <tr>
              <TL>Start Date</TL>
              <TF type="date" value={form.startDate} onChange={(v) => set("startDate", v)} />
              <TL>Employment Status</TL>
              <td className="srf-cell" colSpan={3}>
                <input className="srf-input" value={form.employmentStatus} onChange={(e) => set("employmentStatus", e.target.value)} />
              </td>
            </tr>
            <tr>
              <TL>Industry</TL>
              <TF value={form.industry} onChange={(v) => set("industry", v)} />
              <TL>Contact Number</TL>
              <td className="srf-cell" colSpan={3}>
                <input className="srf-input" value={form.employerContactNumber} onChange={(e) => set("employerContactNumber", e.target.value)} />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="srf-section-title">Alternative Contact Details: <em>(Please print)</em></div>
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="14%">Name and Surname</TL>
              <TF value={form.altContactName} onChange={(v) => set("altContactName", v)} />
              <TL w="14%">Contact Number</TL>
              <TF value={form.altContactNumber} onChange={(v) => set("altContactNumber", v)} />
            </tr>
            <tr>
              <TL>Relationship</TL>
              <TF value={form.altContactRelationship} onChange={(v) => set("altContactRelationship", v)} />
              <TL>Email Address</TL>
              <TF type="email" value={form.altContactEmail} onChange={(v) => set("altContactEmail", v)} />
            </tr>
          </tbody>
        </table>

        <div className="srf-section-title">Qualification/Course Enrolment: <em>(Please print)</em></div>
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="14%">Qualification / Course Title</TL>
              <TF value={form.qualificationTitle} onChange={(v) => set("qualificationTitle", v)} />
              <TL w="12%">NQF Level</TL>
              <TF value={form.nqfLevel} onChange={(v) => set("nqfLevel", v)} />
            </tr>
            <tr>
              <TL>SAQA ID</TL>
              <TF value={form.saqaId} onChange={(v) => set("saqaId", v)} />
              <TL>Credits</TL>
              <TF value={form.credits} onChange={(v) => set("credits", v)} />
            </tr>
            <tr>
              <TL>Course Code</TL>
              <TF value={form.courseCode} onChange={(v) => set("courseCode", v)} />
              <TL>Notional Hours</TL>
              <TF value={form.notionalHours} onChange={(v) => set("notionalHours", v)} />
            </tr>
            <tr>
              <TL>Registration Date</TL>
              <TF type="date" value={form.registrationDate} onChange={(v) => set("registrationDate", v)} />
              <TL>Enrolment Date</TL>
              <TF type="date" value={form.enrolmentDate} onChange={(v) => set("enrolmentDate", v)} />
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div className="srf-declaration">
          <p>
            &ldquo;I, <SmallInput value={form.learnerSignature} onChange={(v) => set("learnerSignature", v)} />
            <strong> (STUDENT NAME)</strong>,{" "}
            <SmallInput value={form.studentNumber} onChange={(v) => set("studentNumber", v)} />
            <strong> (STUDENT ID NUMBER)</strong>, am fully aware that the programme I have enrolled in
            with Eruditio Skills Development Consultants (Pty) Ltd is registered with the Department of
            Education and that Eruditio Skills Development Consultants (Pty) Ltd is accredited to offer
            this qualification.
          </p>
          <p>
            I hereby confirm that I am aware of Eruditio Skills Development Consultant&apos;s cancelation
            and refund policy. I hereby declare that I will adhere to the student code of conduct provided
            to me and signed by me.
          </p>
        </div>

        {/* Signed at row */}
        <table className="srf-table">
          <tbody>
            <tr>
              <TL w="14%">Signed At</TL>
              <td className="srf-cell" colSpan={3}>
                <input className="srf-input" value={form.signedAt} onChange={(e) => set("signedAt", e.target.value)} />
              </td>
            </tr>
            <tr>
              <TL>Student Signature</TL>
              <TF value={form.learnerSignature} onChange={(v) => set("learnerSignature", v)} />
              <TL w="14%">Signature Date</TL>
              <TF type="date" value={form.learnerSignatureDate} onChange={(v) => set("learnerSignatureDate", v)} />
            </tr>
          </tbody>
        </table>

        {/* Administration and Document Control */}
        <div className="srf-section-title">
          Administration and Document Control: <em>(To be completed by the Admissions Officer)</em>
        </div>
        <table className="srf-table srf-admin">
          <tbody>
            <tr>
              <TL w="18%">Documents Submitted &amp; Verified</TL>
              <TCTick label="Certified Copy of ID/Passport" checked={form.docIdPassport} onChange={(v) => set("docIdPassport", v)} />
              <TCTick label="Certified Copy of Highest Certificate" checked={form.docHighestCert} onChange={(v) => set("docHighestCert", v)} />
              <TCTick label="Proof of Residence" checked={form.docProofResidence} onChange={(v) => set("docProofResidence", v)} />
              <TCTick label="CV / Profile" checked={form.docCvProfile} onChange={(v) => set("docCvProfile", v)} />
            </tr>
            <tr>
              <TL>Verified By</TL>
              <td className="srf-cell" colSpan={2}>
                <input className="srf-input" value={form.verifiedBy} onChange={(e) => set("verifiedBy", e.target.value)} placeholder="SD Administrator" />
              </td>
              <TL>Verification Date</TL>
              <TF type="date" value={form.verificationDate} onChange={(v) => set("verificationDate", v)} />
            </tr>
            <tr>
              <TL>Entry Requirements</TL>
              <TCTick label="Meets Entry Requirements" checked={form.entryReqMeets} onChange={(v) => set("entryReqMeets", v)} />
              <TCTick label="Doesn't Meet Entry Requirements" checked={form.entryReqDoesntMeet} onChange={(v) => set("entryReqDoesntMeet", v)} />
              <TCTick label="Requires Bridging Course" checked={form.entryReqBridging} onChange={(v) => set("entryReqBridging", v)} />
              <td className="srf-cell">
                <div className="srf-inline-with-label">
                  <span className="srf-inline-label">Other:</span>
                  <input className="srf-input" value={form.entryReqOther} onChange={(e) => set("entryReqOther", e.target.value)} />
                </div>
              </td>
            </tr>
            <tr>
              <TL>Admission Decision</TL>
              <TCTick label="Admit Student" checked={form.admitStudent} onChange={(v) => set("admitStudent", v)} />
              <TCTick label="Do Not Admit Student" checked={form.doNotAdmit} onChange={(v) => set("doNotAdmit", v)} />
              <TCTick label="Requires Additional Documents" checked={form.requiresAdditionalDocs} onChange={(v) => set("requiresAdditionalDocs", v)} />
              <td className="srf-cell" />
            </tr>
            <tr>
              <TL>Authorised By</TL>
              <td className="srf-cell" colSpan={2}>
                <input className="srf-input" value={form.authorisedByName} onChange={(e) => set("authorisedByName", e.target.value)} placeholder="Training Manager" />
              </td>
              <TL>Authorised Date</TL>
              <TF type="date" value={form.authorisedByDate} onChange={(v) => set("authorisedByDate", v)} />
            </tr>
          </tbody>
        </table>

        {/* Footer accreditation lines + logos */}
        <div className="srf-accred-lines">
          <div>Company Reg no: 2012/017833/07</div>
          <div>QCTO Accreditation: 07-QCTO/SDP030222-439</div>
          <div>W&amp;R SETA Accreditation: 100</div>
          <div>Services SETA: 12709</div>
        </div>

        <div className="srf-footer-logos">
          <img
            src="/logos/Quality-Council-for-Trades-and-Occupations.png"
            alt="QCTO — Quality Council for Trades and Occupations"
            className="srf-footer-logo"
          />
          <img
            src="/logos/Services-SETAFavicon.png"
            alt="Services SETA"
            className="srf-footer-logo"
          />
          <img
            src="/logos/w&Rseta.png"
            alt="W&amp;RSETA"
            className="srf-footer-logo"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function chunks<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function EruditioMasthead() {
  return (
    <div className="srf-masthead">
      <img src="/logos/eruditio.png" alt="Eruditio" className="srf-eruditio-logo" />
    </div>
  );
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

function TCTick({
  label,
  checked,
  onChange,
  w,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  w?: string;
}) {
  return (
    <td
      className={`srf-tick-cell${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
      style={w ? { width: w } : undefined}
    >
      <div className="srf-cell-label">{label}</div>
    </td>
  );
}

function SmallInput({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      className="srf-input srf-input-inline"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
