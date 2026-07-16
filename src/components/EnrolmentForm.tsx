import React from "react";
import type { EnrolmentInfo } from "../types";
import {
  ENROL_DISABILITIES,
  ENROL_EQUITY_GROUPS,
  ENROL_GENDERS,
  ENROL_LANGUAGES,
  ENROL_PROVINCES,
  ENROL_QUALIFICATIONS,
  ENROL_SOCIOECONOMIC,
  ENROL_TITLES,
} from "../types";

export const EMPTY_ENROLMENT: EnrolmentInfo = {
  title: "",
  firstNames: "",
  surname: "",
  maidenName: "",
  idNumber: "",
  age: "",
  gender: "",
  equityGroup: "",
  homeLanguage: "",
  disability: "None",
  highestQualification: "",
  socioeconomicStatus: "",
  physicalAddress: "",
  physicalProvince: "",
  physicalPostalCode: "",
  postalAddress: "",
  postalProvince: "",
  postalPostalCode: "",
  telephone: "",
  cellphone: "",
  fax: "",
  email: "",
  employer: "",
  employerSdlNo: "",
  nextOfKinName: "",
  nextOfKinRelationship: "",
  nextOfKinPhone: "",
  signature: "",
  signedDate: "",
};

/** Derive age from a South African ID number (YYMMDD…), if valid. */
export function ageFromSaId(id: string): string {
  const m = id.match(/^(\d{2})(\d{2})(\d{2})\d{7}$/);
  if (!m) return "";
  const yy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const now = new Date();
  const century = yy > now.getFullYear() % 100 ? 1900 : 2000;
  const dob = new Date(century + yy, mm - 1, dd);
  let age = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age--;
  return age > 0 && age < 120 ? String(age) : "";
}

type Field = keyof EnrolmentInfo;

/** Label term with a hover/focus definition bubble (same styling as lesson glossary bubbles). */
function LabelBubble({ text, def }: { text: string; def: string }) {
  const place = (e: React.SyntheticEvent<HTMLSpanElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const half = 170; // half bubble width + margin
    const x = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half);
    const below = r.top < 300;
    el.dataset.pos = below ? "below" : "above";
    el.style.setProperty("--bx", `${x}px`);
    el.style.setProperty("--by", below ? `${r.bottom + 10}px` : `${r.top - 10}px`);
  };
  return (
    <span className="term" tabIndex={0} onMouseEnter={place} onFocus={place}>
      {text}
      <span className="bubble" role="tooltip">
        <strong>{text}</strong>
        {def}
      </span>
    </span>
  );
}

export function EnrolmentForm({
  value,
  onChange,
}: {
  value: EnrolmentInfo;
  onChange: (v: EnrolmentInfo) => void;
}) {
  const set =
    (k: Field) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const next = { ...value, [k]: e.target.value };
      if (k === "idNumber") {
        const age = ageFromSaId(e.target.value);
        if (age) next.age = age;
      }
      onChange(next);
    };

  const select = (
    k: Field,
    label: string,
    options: readonly string[],
    required = true,
    span?: string
  ) => (
    <div className={`field${span ? ` ${span}` : ""}`}>
      <label htmlFor={`en-${k}`}>{label}</label>
      <select id={`en-${k}`} value={value[k]} onChange={set(k)} required={required}>
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const input = (
    k: Field,
    label: React.ReactNode,
    opts: {
      required?: boolean;
      span?: string;
      placeholder?: string;
      maxLength?: number;
      type?: string;
    } = {}
  ) => (
    <div className={`field${opts.span ? ` ${opts.span}` : ""}`}>
      <label htmlFor={`en-${k}`}>{label}</label>
      <input
        id={`en-${k}`}
        type={opts.type ?? "text"}
        value={value[k]}
        onChange={set(k)}
        required={opts.required}
        placeholder={opts.placeholder}
        maxLength={opts.maxLength}
      />
    </div>
  );

  const heading = (text: string) => <div className="enrol-head">{text}</div>;

  return (
    <div className="enrol-grid">
      {heading("Personal details")}
      {select("title", "Title", ENROL_TITLES, true, "c1")}
      {input("firstNames", "First names", { required: true, span: "c2" })}
      {input("surname", "Surname", { required: true, span: "c2" })}
      {input("maidenName", "Maiden name (if applicable)", { span: "c1" })}
      {input("idNumber", "ID number", {
        required: true,
        span: "c2",
        placeholder: "13-digit SA ID number",
        maxLength: 13,
      })}
      {input("age", "Age", { required: true, span: "c1", maxLength: 3 })}
      {heading("Demographics")}
      {select("gender", "Gender", ENROL_GENDERS, true, "c1")}
      {select("equityGroup", "Equity group", ENROL_EQUITY_GROUPS, true, "c1")}
      {select("homeLanguage", "Primary home language", ENROL_LANGUAGES, true, "c1")}
      {select("disability", "Disability", ENROL_DISABILITIES, true, "c1")}
      {heading("Education & socioeconomic status")}
      {select("highestQualification", "Highest qualification", ENROL_QUALIFICATIONS, true, "c2")}
      {select("socioeconomicStatus", "Socioeconomic status", ENROL_SOCIOECONOMIC, true, "c2")}
      {heading("Addresses")}
      {input("physicalAddress", "Physical address", { required: true, span: "full" })}
      {select("physicalProvince", "Province (physical)", ENROL_PROVINCES, true, "c2")}
      {input("physicalPostalCode", "Postal code (physical)", { required: true, span: "c1", maxLength: 4 })}
      {input("postalAddress", "Postal address (if different)", { span: "full" })}
      {select("postalProvince", "Province (postal)", ENROL_PROVINCES, false, "c2")}
      {input("postalPostalCode", "Postal code (postal)", { span: "c1", maxLength: 4 })}
      {heading("Contact details")}
      {input("telephone", "Telephone number", { span: "c1", type: "tel" })}
      {input("cellphone", "Cell phone number", { required: true, span: "c1", type: "tel" })}
      {input("fax", "Fax number", { span: "c1", type: "tel" })}
      {input("email", "Email address", { required: true, span: "full", type: "email" })}
      {heading("Employment")}
      {input("employer", "Employer", { span: "c2" })}
      {input(
        "employerSdlNo",
        <LabelBubble
          text="Employer SDL no"
          def="The employer's Skills Development Levy registration number with SARS (usually starts with 'L'). The SDL — 1% of payroll — funds SETA learnerships and skills programmes, and the MICT SETA uses this number to link your enrolment to your employer. Your HR or payroll department can provide it; leave blank if not applicable."
        />,
        { span: "c1" }
      )}
      {heading("Next of kin")}
      {input("nextOfKinName", "Full name", { required: true, span: "c2" })}
      {input("nextOfKinRelationship", "Relationship", {
        required: true,
        span: "c1",
        placeholder: "e.g. Mother, Spouse",
      })}
      {input("nextOfKinPhone", "Contact number", {
        required: true,
        span: "c1",
        type: "tel",
      })}
      {heading("Declaration")}
      {input("signature", "Signature (type your full name)", { required: true, span: "c2" })}
    </div>
  );
}

export function EnrolmentDetails({ enrolment }: { enrolment: EnrolmentInfo }) {
  const addr = (street: string, province: string, code: string) =>
    [street, province, code].filter(Boolean).join(", ");
  const groups: { heading: string; rows: [string, string][] }[] = [
    {
      heading: "Personal details",
      rows: [
        ["Title", enrolment.title],
        ["First names", enrolment.firstNames],
        ["Surname", enrolment.surname],
        ["Maiden name", enrolment.maidenName],
        ["ID number", enrolment.idNumber],
        ["Age", enrolment.age],
      ],
    },
    {
      heading: "Demographics",
      rows: [
        ["Gender", enrolment.gender],
        ["Equity group", enrolment.equityGroup],
        ["Primary home language", enrolment.homeLanguage],
        ["Disability", enrolment.disability],
      ],
    },
    {
      heading: "Education & socioeconomic status",
      rows: [
        ["Highest qualification", enrolment.highestQualification],
        ["Socioeconomic status", enrolment.socioeconomicStatus],
      ],
    },
    {
      heading: "Addresses",
      rows: [
        ["Physical address", addr(enrolment.physicalAddress, enrolment.physicalProvince, enrolment.physicalPostalCode)],
        ["Postal address", addr(enrolment.postalAddress, enrolment.postalProvince, enrolment.postalPostalCode)],
      ],
    },
    {
      heading: "Contact details",
      rows: [
        ["Telephone number", enrolment.telephone],
        ["Cell phone number", enrolment.cellphone],
        ["Fax number", enrolment.fax],
        ["Email address", enrolment.email],
      ],
    },
    {
      heading: "Employment",
      rows: [
        ["Employer", enrolment.employer],
        ["Employer SDL no", enrolment.employerSdlNo],
      ],
    },
    {
      heading: "Next of kin",
      rows: [
        ["Full name", enrolment.nextOfKinName],
        ["Relationship", enrolment.nextOfKinRelationship],
        ["Contact number", enrolment.nextOfKinPhone],
      ],
    },
    {
      heading: "Declaration",
      rows: [
        [
          "Signed",
          enrolment.signature
            ? `${enrolment.signature}${
                enrolment.signedDate
                  ? ` · ${new Date(enrolment.signedDate).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""
              }`
            : "",
        ],
      ],
    },
  ];

  return (
    <table className="data kv enrol-details">
      <tbody>
        {groups
          .map((g) => ({ ...g, rows: g.rows.filter(([, v]) => v) }))
          .filter((g) => g.rows.length > 0)
          .map((g) => (
            <React.Fragment key={g.heading}>
              <tr className="group">
                <td colSpan={2}>{g.heading}</td>
              </tr>
              {g.rows.map(([k, v]) => (
                <tr key={k}>
                  <td className="k">{k}</td>
                  <td style={{ whiteSpace: "pre-line" }}>{v}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
      </tbody>
    </table>
  );
}
