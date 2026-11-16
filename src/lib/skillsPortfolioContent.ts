import template from "../data/skillsPortfolio.json";
import type { Profile } from "../types";
import type { PortfolioValues } from "./skillsPortfolio";

export interface PortfolioField { kind: "field"; id: string; label: string; type: string; options?: { value: string; label: string }[] }
export interface PortfolioTable { kind: "table"; id: string; headers: string[]; rows: { id: string; text: string; fixed: boolean }[][] }
export interface PortfolioText { kind: "text"; id: string; level: string; text: string }
export interface PortfolioSection { id: string; title: string; blocks: (PortfolioField | PortfolioTable | PortfolioText)[] }
export const SKILLS_PORTFOLIO = template as PortfolioSection[];
export function profilePortfolioDefaults(profile: Profile): PortfolioValues {
  const e = profile.enrolment;
  return { f4: profile.name, f22: profile.name, f5: e?.idNumber ?? "", f6: profile.id,
    f23: e?.firstNames ?? "", f24: e?.email ?? "", f25: e?.cellphone || e?.telephone || "",
    f26: e?.physicalAddress ?? "", f27: e?.highestQualification ?? "", f8: e?.employer ?? "",
    f28: [e?.nextOfKinName, e?.nextOfKinPhone].filter(Boolean).join(" · ") };
}
export const escapePortfolioHtml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function portfolioReportHtml(profile: Profile, values: PortfolioValues) {
  const esc = escapePortfolioHtml;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(profile.name)} — Skills evidence register</title><style>body{font:15px/1.5 system-ui;max-width:1100px;margin:32px auto;padding:20px}section{break-before:page}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{border:1px solid #bbb;text-align:left;padding:8px;vertical-align:top}p{white-space:pre-wrap}@media print{button{display:none}}</style><h1>Skills Development evidence register</h1><h2>${esc(profile.name)}</h2>${SKILLS_PORTFOLIO.map(section => `<section><h2>${esc(section.title)}</h2>${section.blocks.map(block => {
    if (block.kind === "text") return `<p>${esc(block.text)}</p>`;
    if (block.kind === "field") return `<p><strong>${esc(block.label)}:</strong> ${esc(block.type === "checkbox" ? values[block.id] === true ? "Confirmed" : "Not confirmed" : values[block.id] ?? "")}</p>`;
    const extra = values[`extra.${block.id}`];
    const rows = [...block.rows.map(row => row.map(cell => cell.fixed ? cell.text : values[cell.id] ?? "")), ...(Array.isArray(extra) ? extra : [])];
    return `<table><thead><tr>${block.headers.map(header => `<th>${esc(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("")}${Object.entries(values).filter(([key]) => key.startsWith(`doc.${section.id}.`)).map(([, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    return `<p><strong>Evidence:</strong> ${esc(value.doc.name)} · ${esc(value.status ?? "Pending verification")} · ${esc(value.reviewer ?? "")} ${esc(value.reviewedAt ?? "")}<br>${esc(value.note ?? "")}</p>`;
  }).join("")}</section>`).join("")}</html>`;
}

export function validatePortfolioImport(input: unknown, learnerId: string): PortfolioValues {
  const data = input as { format?: string; learnerId?: string; values?: PortfolioValues };
  if (!data || data.format !== "itss-skills-portfolio-v1" || data.learnerId !== learnerId || !data.values || typeof data.values !== "object" || Array.isArray(data.values)) throw new Error("Choose a Skills evidence register export for this learner.");
  const allowed = new Set(SKILLS_PORTFOLIO.flatMap(section => section.blocks.flatMap(block => block.kind === "field" ? [block.id] : block.kind === "table" ? [`extra.${block.id}`, ...block.rows.flatMap(row => row.filter(cell => !cell.fixed).map(cell => cell.id))] : [])));
  const result: PortfolioValues = {};
  for (const [key, value] of Object.entries(data.values)) {
    if (!allowed.has(key)) continue; // Imports do not authorise verification or inject file paths.
    if (typeof value === "string" && value.length <= 30000 || typeof value === "boolean") result[key] = value;
    else if (key.startsWith("extra.") && Array.isArray(value) && value.length <= 500 && value.every(row => Array.isArray(row) && row.length <= 12 && row.every(cell => typeof cell === "string" && cell.length <= 30000))) result[key] = value;
    else throw new Error("The export contains an invalid field value.");
  }
  return result;
}
