import template from "../data/skillsPortfolio.json";
import { portfolioReportStyles } from "./portfolioReportStyles";
import type { Profile } from "../types";
import type { PortfolioValues } from "./skillsPortfolio";

export interface PortfolioField { kind: "field"; id: string; label: string; type: string; options?: { value: string; label: string }[] }
export interface PortfolioTable { kind: "table"; id: string; headers: string[]; rows: { id: string; text: string; fixed: boolean }[][] }
export interface PortfolioText { kind: "text"; id: string; level: string; text: string }
export interface PortfolioSection { id: string; title: string; blocks: (PortfolioField | PortfolioTable | PortfolioText)[] }
export const SKILLS_PORTFOLIO = template as PortfolioSection[];
export function profilePortfolioDefaults(profile: Profile): PortfolioValues {
  const e = profile.enrolment;
  return { f10: "17 July 2026 - 30 July 2027", f612: "17 July 2026 - 30 July 2027", f4: profile.name, f22: profile.name, f5: e?.idNumber ?? "", f6: profile.id,
    f23: e?.firstNames ?? "", f24: e?.email ?? "", f25: e?.cellphone || e?.telephone || "",
    f26: e?.physicalAddress ?? "", f27: e?.highestQualification ?? "", f8: e?.employer ?? "",
    f28: [e?.nextOfKinName, e?.nextOfKinPhone].filter(Boolean).join(" · ") };
}
export const escapePortfolioHtml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function portfolioReportHtml(profile: Profile, values: PortfolioValues) {
  const esc = escapePortfolioHtml;
  const date = new Intl.DateTimeFormat("en-ZA", { dateStyle: "long", timeZone: "Africa/Johannesburg" }).format(new Date());
  const sections = SKILLS_PORTFOLIO.map((section, index) => {
    let blocks = "";
    for (let i = 0; i < section.blocks.length; i++) {
      const block = section.blocks[i];
      if (block.kind === "text") {
        blocks += `<p${i === 0 ? ' class="section-caption"' : ""}>${esc(block.text)}</p>`;
      } else if (block.kind === "field") {
        blocks += '<dl class="details-grid">';
        while (i < section.blocks.length) {
          const field = section.blocks[i];
          if (field.kind !== "field") break;
          const value = field.type === "checkbox" ? values[field.id] === true ? "Confirmed" : "Not confirmed" : values[field.id] ?? "";
          blocks += `<div class="detail"><dt>${esc(field.label)}</dt><dd${field.type === "textarea" || field.label.toLowerCase() === "written response" ? ' class="written-response"' : ""}>${value === "" ? '<span class="empty">Not recorded</span>' : esc(value)}</dd></div>`;
          i++;
        }
        i--;
        blocks += "</dl>";
      } else {
        const extra = values[`extra.${block.id}`];
        const rows = [...block.rows.map(row => row.map(cell => cell.fixed ? cell.text : values[cell.id] ?? "")), ...(Array.isArray(extra) ? extra : [])];
        blocks += `<div class="table-wrap"><table><thead><tr>${block.headers.map(header => `<th scope="col">${esc(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell === "" ? "&#160;" : esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
    }
    const evidence = Object.entries(values).filter(([key]) => key.startsWith(`doc.${section.id}.`)).map(([, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return "";
      const reviewed = value.reviewedAt && !Number.isNaN(Date.parse(value.reviewedAt))
        ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" }).format(new Date(value.reviewedAt)) : "";
      const metadata = [value.status ?? "Pending verification", value.reviewer, reviewed].filter(Boolean).map(esc).join(" &middot; ");
      return `<div class="evidence-item"><div class="evidence-name">${esc(value.doc.name)}</div><div class="evidence-meta">${metadata}</div>${value.note ? `<p>${esc(value.note)}</p>` : ""}</div>`;
    }).join("");
    return `<section class="report-section"><header class="section-heading"><span class="section-number">${String(index + 1).padStart(2, "0")}</span><h2>${esc(section.title)}</h2></header>${blocks}${evidence ? `<aside class="evidence-list"><h3>Supporting evidence and verification</h3>${evidence}</aside>` : ""}</section>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(profile.name)} &mdash; Skills evidence register</title><style>${portfolioReportStyles}</style></head><body><main class="report"><header class="cover"><p class="eyebrow">Learning &amp; Development / Portfolio of Evidence</p><h1>Skills Development<br>Evidence Register</h1><p class="cover-description">Individual learner portfolio &middot; Assessment, moderation and verification</p><div class="cover-meta"><div><span class="meta-label">Prepared for</span><span class="meta-value">${esc(profile.name)}</span></div><div><span class="meta-label">Report generated</span><span class="meta-value">${esc(date)}</span></div></div></header>${sections}<footer class="report-footer"><span>Skills Development Evidence Register</span><span>Confidential &middot; Contains personal learner information</span></footer></main></body></html>`;
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
