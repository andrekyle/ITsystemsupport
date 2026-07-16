import type { UnitContent } from "../types";

export interface GlossaryEntry {
  def: string;
  link?: { label: string; url: string };
}

/** Glossary terms — any occurrence in lesson text gets an explanatory bubble. */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  "operational systems": {
    def: "The software platforms a business uses to run its day-to-day work — for example the ticketing/ITSM system, monitoring dashboards, inventory and asset registers, email and collaboration platforms, and access-control logs. Because they record data automatically as work happens, they are the primary source of evidence for business reports.",
  },
  "p1 incidents": {
    def: "Priority 1 incidents — the most severe category of IT incident, where a critical system is down or many users cannot work. P2, P3 and P4 are progressively less urgent. Priority levels determine how fast the support team must respond under the SLA.",
  },
  "client-identifying data": {
    def: "Any detail that could reveal who a specific client is — names, ID or account numbers, contact details, or figures unique to one person (e.g. a portfolio value). Under POPIA this is protected personal information. Before using it in a report, aggregate it (show only totals, e.g. '214 clients affected') or anonymise it (remove or mask the identifiers, e.g. 'Client A').",
  },
  "service report": {
    def: "A recurring report (usually weekly or monthly) that shows how well the IT service performed against its agreed targets over the period — ticket volumes, resolution times, SLA compliance, system availability and notable incidents. It goes to service managers and business stakeholders so they can spot trends, hold the team to the SLA, and decide where to invest or improve.",
  },
  popia: {
    def: "The Protection of Personal Information Act (Act 4 of 2013) — South Africa's data-privacy law. It sets the conditions under which organisations may collect, store, use and share personal information, and it is enforced by the Information Regulator. For report writers it means: aggregate or anonymise personal data, and control who receives the document.",
    link: { label: "Read the Act on gov.za", url: "https://www.gov.za/documents/protection-personal-information-act" },
  },
  fsca: {
    def: "The Financial Sector Conduct Authority — South Africa's market-conduct regulator for financial institutions. It supervises how banks, insurers and investment providers treat customers and handle information, so reports containing client or market-sensitive data must meet its conduct and record-keeping requirements.",
    link: { label: "Visit fsca.co.za", url: "https://www.fsca.co.za" },
  },
  unencrypted: {
    def: "Stored without encryption — the file's contents are readable by anyone who gets hold of the device or file, because no password or cryptographic protection was applied. An unencrypted client presentation on a lost laptop means the client's information is immediately exposed, which makes it a reportable POPIA/security incident. Encrypting the disk or file would keep the data unreadable without the key.",
  },
  "first-call resolution": {
    def: "The percentage of support requests fully resolved during the caller's first contact with the service desk — no follow-up call, escalation or ticket reassignment needed. A high rate (targets are typically 70–80%) signals a skilled, well-equipped desk; a falling rate points to knowledge gaps, understaffing or unusually complex incidents.",
  },
  "sla compliance": {
    def: "How well the support team met the targets in its Service Level Agreement (SLA) — the contract that sets, for example, how fast a P1 incident must be answered and resolved. It is measured as the percentage of tickets handled within their agreed times (e.g. '93% of incidents resolved within SLA'). Persistent misses trigger reviews, penalties or corrective action plans.",
  },
  "prior learning": {
    def: "Learning you have already completed — credits, certificates or workplace experience gained before starting this qualification. Through Recognition of Prior Learning (RPL), your NQF Level 4 IT credits (e.g. a National Certificate: IT Technical Support) are formally recognised and counted towards this qualification, so you don't have to repeat learning you can already prove.",
  },
  "contextual qualifications framework": {
    def: "A design approach where one generic core qualification is adapted ('contextualised') to different industry settings. The core components teach the universal skills every systems-support professional needs, while the electives tailor the programme to a specific context — such as banking, retail or telecoms — so the same qualification stays relevant across many sectors.",
  },
  fisa: {
    def: "Final Integrated Summative Assessment — the concluding assessment written after all six modules are complete (scheduled 28 May – 4 June 2027). Rather than testing one unit standard at a time, it integrates knowledge and skills from across the whole qualification into a single summative event. Passing the FISA — together with a complete Portfolio of Evidence and signed-off logbook — is required before certification.",
  },
  poe: {
    def: "Portfolio of Evidence — the organised file proving your competence: assessed assignments, formative and summative results, workplace evidence, logbook entries and assessor feedback, collected per unit standard. The assessor and moderator check it, and it must be complete before you can be declared competent and certified.",
  },
  "sgb retail and wholesale": {
    def: "A Standards Generating Body (SGB) — a panel of industry experts appointed under SAQA to write the unit standards for a particular sector. 'SGB Retail and Wholesale' is the body that originally authored this unit standard for the retail/wholesale sector, which is why a business-report-writing standard from that sector appears in an IT qualification: it was adopted as a fundamental (transferable) component.",
  },
  "unit standard alignment index": {
    def: "The mapping table at the front of the learner manual that links each section (and its page numbers) to the specific outcomes (SOs) and assessment criteria (ACs) of US 8252. What must happen here: project or open the index, walk through it row by row and show learners exactly where in the manual each outcome is covered and how it will be assessed — so before the content starts, every learner knows what they must be able to do to be found competent.",
  },
  "level tba: pre-2009 was l5": {
    def: "In 2009 South Africa's National Qualifications Framework was restructured from 8 levels to 10. Standards registered before the change show their original level ('Pre-2009 was L5'), while the equivalent level on the new 10-level framework was still To Be Announced (TBA) — and because this standard later passed its end date, it was never formally re-mapped. In practice it is pitched at the original NQF Level 5.",
  },
  qcto: {
    def: "Quality Council for Trades and Occupations — the statutory body that oversees occupational qualifications in South Africa. It accredits training providers, approves curricula and assessment specifications, and issues the final certificates for occupational qualifications and learnerships.",
    link: { label: "Visit qcto.org.za", url: "https://www.qcto.org.za" },
  },
  seta: {
    def: "Sector Education and Training Authority — one of 21 bodies, each responsible for skills development in its economic sector. For this qualification it is the MICT SETA (Media, Information & Communication Technologies), which funds learnerships, accredits workplaces, registers assessors and moderators, and quality-assures the training.",
  },
  ocd: {
    def: "Occupational Curriculum Document — the QCTO-approved blueprint for the qualification. It sets out what must be taught: the knowledge modules, practical skills modules and workplace experience modules, with their scope, duration and entry requirements. Facilitation and lesson plans must stay aligned to it.",
  },
  "quantified benefit": {
    def: "A benefit expressed in measurable terms — rands saved, hours recovered, incidents avoided — rather than a vague claim. 'Fewer complaints' is unquantified; 'an estimated R180 000 a year in avoided trading-floor downtime' is quantified. Decision-makers weigh the quantified benefit against the total cost to approve or reject a proposal.",
  },
  exco: {
    def: "The executive committee — the most senior leadership team of the organisation (chief executive and the heads of major divisions). Exco approves budgets, strategy and significant spending, so reports written for it lead with conclusions, costs and recommendations rather than technical detail.",
  },
  asd: {
    def: "Assessment Specifications Document — the QCTO-approved companion to the curriculum that prescribes how competence must be assessed: the assessment methods and instruments, evidence requirements, weighting and conditions for the external summative assessment. Every formative and summative assessment must align with it.",
  },
};

/** Learning content per unit standard (US id -> content). */
export const CONTENT: Record<string, UnitContent> = {
  /* ================================================================
     US 8252 — Writing business reports
     Context: Investec — IT & business support environment
     NQF 5 · 6 credits
     ================================================================ */
  "8252": {
    lesson: [
      {
        heading: "1. Purpose and audience of business reports",
        icon: "target",
        paragraphs: [
          "A business report is a structured, factual document written to inform decision-making. In a banking support environment, reports turn raw operational data — service desk tickets, system uptime figures, client feedback, security incidents — into information that managers and executives can act on.",
          "Before writing a single word, a report writer must answer two questions: Why is this report needed (purpose)? and Who will read it (audience)? The purpose determines what information is included; the audience determines the level of detail, tone and technical language used. In a bank, a third question always applies: is any of this information confidential or client-identifying?",
        ],
        bullets: [
          "Purpose examples: to inform (monthly IT service desk report), to analyse (investigation into repeated core-banking downtime), to recommend (business case for upgrading trading-floor workstations), to record (security or system incident report).",
          "Audience examples: IT Service Delivery Manager (operational detail), Head of Technology (summary and trends), Risk & Compliance (evidence and controls), external auditors (audit trail), business unit heads such as Private Banking or Wealth & Investment (impact on their clients).",
          "A report for exco leads with conclusions and recommendations; a report for the service desk team leads with procedure and detail.",
          "Always confirm the terms of reference: scope, deadline, format, classification level, and who commissioned the report.",
        ],
      },
      {
        heading: "2. Types of reports in a banking support environment",
        icon: "folder",
        paragraphs: [
          "Technology and operations teams rely on a predictable set of report types. Recognising the type tells you which structure and content conventions to follow.",
        ],
        bullets: [
          "IT service performance report — periodic (weekly/monthly) analysis of ticket volumes, first-call resolution, SLA compliance, and system availability across head office and the regional offices.",
          "Incident report — a factual record of an event (system outage, security breach attempt, data-centre power failure, lost device) with time, place, systems and people involved, and actions taken.",
          "Progress report — status of a project or initiative (e.g. Windows fleet upgrade, meeting-room AV refresh, network segmentation project) against plan.",
          "Feasibility / investigative report — examines options and recommends a course of action, e.g. moving a workload to cloud, replacing the visitor-management system, or extending service desk hours.",
          "Compliance report — evidence that policies and regulations (POPIA, FSCA requirements, internal information-security policy) are being met.",
          "Client-impact report — summarises how a technology event affected Private Banking or Wealth & Investment clients, written for business stakeholders in non-technical language.",
        ],
      },
      {
        heading: "3. Structure of a formal business report",
        icon: "document",
        paragraphs: [
          "A formal report follows a standard skeleton. Not every report needs every part — a one-page incident report may only need four sections — but the order never changes, because readers expect to find information in predictable places.",
        ],
        bullets: [
          "Title page — report title, author, date, recipient, reference number, and classification (e.g. Internal / Confidential).",
          "Executive summary — the whole report in one page or less: purpose, key findings, main recommendations. Written last, read first.",
          "Table of contents — for reports longer than about four pages.",
          "Introduction — background, purpose, scope and method of the report.",
          "Findings / body — the facts, organised under numbered headings, supported by tables and charts.",
          "Conclusions — what the findings mean. No new information may appear here.",
          "Recommendations — specific, actionable, costed where possible, and linked to the conclusions.",
          "Appendices — supporting detail (ticket exports, monitoring graphs, questionnaires, photographs) referenced from the body.",
        ],
      },
      {
        heading: "4. Gathering and analysing information",
        icon: "search",
        paragraphs: [
          "A report is only as credible as its data. In a support environment, most evidence comes from operational systems, but observation and people are equally valid sources when correctly documented.",
          "Analysis means comparing: this month vs last month, actual vs SLA target, one office vs another. A number on its own means nothing; a comparison creates a finding.",
        ],
        bullets: [
          "System sources: the ITSM/ticketing system (e.g. ServiceNow), monitoring and uptime dashboards, asset registers, access-control logs, telephony statistics.",
          "Human sources: service desk analysts, branch staff, business-unit interviews, client-experience feedback routed through relationship managers.",
          "Verify data before using it — check the date range, the site filter (head office vs regional offices), and whether after-hours tickets are included.",
          "Distinguish fact from opinion. A fact can be proven from records — 'P1 incidents rose from 2 to 7 this quarter' comes straight from the ticketing system. An opinion is an impression or judgement — 'the network team seemed overloaded' is how things appeared to you, not something the data proves.",
          "Opinions are allowed in a report, but they must be labelled so the reader never mistakes them for proven fact — introduce them with wording like 'In the writer's view…' or 'Staff interviewed felt that…'.",
          "Keep source records — they become your appendices and your POE evidence. Never paste client-identifying data into a report; aggregate or anonymise it (POPIA).",
        ],
      },
      {
        heading: "5. Plain business language, tone and style",
        icon: "design",
        paragraphs: [
          "Business reports use plain, formal, objective language. The goal is that a busy reader — an executive between meetings — understands each sentence on first reading. South African business writing follows UK spelling conventions.",
        ],
        bullets: [
          "Prefer short sentences (15–20 words) and short paragraphs (3–5 sentences).",
          "Use active voice where possible: 'The service desk missed the SLA target', not 'The SLA target was not met by the service desk'.",
          "Avoid jargon and abbreviations the reader may not know; define technical terms (P1, MTTR, VPN) on first use — especially for business-unit readers.",
          "Be objective: report what the evidence shows, not what you feel. Avoid emotive words like 'terrible' or 'fantastic'.",
          "Use consistent numbering (1, 1.1, 1.1.1) and parallel headings.",
          "Numbers: use figures for quantities and percentages; state currency as R12 450; be consistent with decimal places and time formats (14h00, not 2pm).",
        ],
      },
      {
        heading: "6. Presenting data, editing and distribution",
        icon: "chart",
        paragraphs: [
          "Tables and charts carry the evidence of a service report. Choose the format that matches the point: tables for exact values, line charts for trends (ticket volumes over 12 months), bar charts for comparisons (SLA compliance by team), pie charts (sparingly) for composition.",
          "Editing is a separate step from writing. Check structure first, then paragraphs, then sentences, then spelling — in that order. Finally, control the distribution of the report: at a bank, confidentiality is not optional. Client data, security findings and system vulnerabilities must only reach the intended audience.",
        ],
        bullets: [
          "Every table and figure needs a number, a title and a source line (e.g. 'Source: ServiceNow export, 1–30 Jun 2026'), and must be referred to in the text.",
          "Round large numbers for readability in the body; keep exact figures in appendices.",
          "Proofread on paper or a second screen; read the executive summary last to confirm it still matches the findings.",
          "Version-control the document (v0.1 draft, v1.0 final) and date every issue.",
          "Apply the bank's information classification: mark reports Internal or Confidential, distribute via approved channels only, and never email confidential reports to personal addresses — this is a POPIA, FSCA and information-security requirement.",
        ],
      },

      /* ---------- Lesson 2 — from planning to a complete model report ---------- */
      {
        heading: "Lesson 2.1 — Purpose and types of business reports",
        icon: "target",
        paragraphs: [
          "A business report is a structured document that presents information, analysis and recommendations so that managers can make informed decisions. In IT systems support you will write incident reports, investigation reports, project status reports and recommendation reports. This lesson takes you from planning to a complete, worked model report.",
        ],
        bullets: [
          "Every report exists to answer ONE question for the reader — 'What must I know or decide?' If you cannot state that question, you are not ready to write.",
          "Informational reports — present facts without analysis (e.g. weekly helpdesk ticket statistics, stock-take results in a retail store).",
          "Analytical reports — investigate a problem, analyse causes and draw conclusions (e.g. root-cause report after a server outage, investigation into stock shrinkage).",
          "Recommendation reports — propose a course of action with justification and costs (e.g. motivation to upgrade departmental hardware, proposal to change a supplier).",
          "Progress/status reports — track a project or task against plan (e.g. monthly rollout progress, weekly project status to the steering committee).",
          "Incident reports — record what happened, impact, cause and corrective action (e.g. the Sandton 3rd-floor outage).",
          "Compliance/audit reports — demonstrate that rules were followed (e.g. software licence audit).",
        ],
        example: {
          title: "Example — choosing the right type",
          lines: [
            "Situation: The division head asks, 'Why could Private Banking not print on Monday, and how do we stop it happening again?'",
            "Wrong choice: an informational report listing every ticket logged (facts, but no answer).",
            "Right choice: an analytical + recommendation report — findings (what happened and why), conclusions (root cause) and recommendations (UPS, DHCP reservation, post-maintenance checklist).",
          ],
        },
      },
      {
        heading: "Lesson 2.2 — Know your audience",
        icon: "people",
        paragraphs: [],
        bullets: [
          "Identify the primary reader (who decides) and secondary readers (who else will see it).",
          "Executives and division heads read the executive summary first — often ONLY that. Put business impact and the decision needed there.",
          "Technical colleagues need enough detail to verify and repeat your work — logs, settings, versions go in findings or an appendix.",
          "Anticipate the reader's questions — What did it cost? What is the risk? How long will the fix take? Who must act?",
          "Never make the reader translate — convert technical facts into business consequences.",
        ],
        example: {
          title: "Example — same fact, two audiences",
          lines: [
            "To a technician: 'The LanmanServer service failed to start after the unclean shutdown; dependency on the storage stack timed out (Event ID 7022).'",
            "To the division head: 'The server that hosts the department's shared documents did not restart correctly after the weekend power work, so staff could not open client files until 10:05.'",
            "Both are true. Each reader gets the version they can act on.",
          ],
        },
      },
      {
        heading: "Lesson 2.3 — The standard report structure",
        icon: "document",
        paragraphs: [],
        bullets: [
          "Title page — report title, author and role, date, prepared for whom, version and classification (e.g. Internal use only).",
          "Abstract — the whole report in under 200 words: the problem, how it was investigated, what you found and what it means. Written LAST, read FIRST.",
          "Table of contents — a numbered list of the major and minor sections so readers can navigate.",
          "Introduction — set the scene: background, purpose, scope (what is covered and what is not) and method (how you investigated).",
          "Main body — the facts and analysis in a logical sequence under clear numbered headings, each supported by evidence (logs, screenshots, figures, interviews).",
          "Conclusion — what the findings mean and whether the aim was met. No new facts may appear here.",
          "Recommendations — numbered, specific and actionable: WHO must do WHAT by WHEN, and what it costs.",
          "References — a list of all the sources used.",
          "Appendices — supporting detail not needed in the body: full logs, ticket lists, charts, tables.",
          "Number every heading (1, 1.1, 1.2 …) so readers can refer to sections precisely.",
        ],
        example: {
          title: "Example — a model abstract",
          lines: [
            "'On Monday 6 July at 08:15, all 30 Private Banking staff on the 3rd floor lost access to printing and the shared P: drive following weekend electrical maintenance. Client-facing work was disrupted for two hours, including a 09:00 client onboarding meeting. The investigation found that the departmental file server did not restart cleanly because it has no UPS or graceful-shutdown procedure, and the shared printer lost its network address when the DHCP scope was rebuilt. Three preventive measures are recommended: install a UPS with automated shutdown (R8,500), reserve fixed addresses for printers, and adopt a post-maintenance verification checklist. Approval is requested by 10 July.'",
            "Note: problem, findings, impact, recommendations and the decision needed — all in one paragraph, under 200 words.",
          ],
        },
      },
      {
        heading: "Lesson 2.4 — Planning before you write",
        icon: "checklist",
        paragraphs: [],
        bullets: [
          "Step 1 — Write down the reader and the ONE question the report answers.",
          "Step 2 — Gather and verify facts: tickets, logs, interviews, dates, figures. Facts you cannot verify do not go in.",
          "Step 3 — Group facts into themes: these become your findings headings.",
          "Step 4 — Draft an outline: every heading with one line describing what goes under it.",
          "Step 5 — Only now start writing: body first, then conclusions, then recommendations, then the executive summary, then the title page.",
          "Keep your outline and notes — assessors (and auditors) may ask for evidence of planning.",
        ],
        example: {
          title: "Example — outline for the outage report",
          lines: [
            "1. Introduction — purpose: explain Monday's outage and prevent recurrence; scope: 3rd floor only.",
            "2. Findings — 2.1 Timeline of events · 2.2 Business impact (14 tickets, client meeting) · 2.3 Server failed to restart (no UPS) · 2.4 Printer lost IP (DHCP rebuild).",
            "3. Conclusions — outage caused by unmanaged power-down, not hardware failure.",
            "4. Recommendations — 4.1 UPS + shutdown procedure · 4.2 DHCP reservations · 4.3 Post-maintenance checklist.",
            "5. Appendix — event log extracts, ticket list.",
          ],
        },
      },
      {
        heading: "Lesson 2.5 — Writing style: plain, professional language",
        icon: "design",
        paragraphs: [],
        bullets: [
          "Short sentences (aim under 20 words). One idea per sentence. One topic per paragraph.",
          "Active voice — 'The technician replaced the switch', not 'The switch was replaced'.",
          "Concrete and specific — numbers, dates, names of systems; not 'recently', 'some users', 'a while'.",
          "Define abbreviations at first use — 'Dynamic Host Configuration Protocol (DHCP)'.",
          "Neutral and factual tone — report what happened, never blame individuals.",
          "Proofread twice — once for meaning, once for spelling/grammar. Then have a colleague read it.",
        ],
        example: {
          title: "Example — weak vs strong sentences",
          lines: [
            "Weak: 'There were some issues with the server which meant that quite a few users were unfortunately not able to do their work for a while.'",
            "Strong: 'The file server was unavailable from 08:15 to 10:05. Thirty users could not access shared documents.'",
            "Weak: 'It is recommended that consideration be given to the possible procurement of a UPS.'",
            "Strong: 'Recommendation 1: Install a UPS on the 3rd-floor server by 10 July (quote attached: R8,500).'",
          ],
        },
      },
      {
        heading: "Lesson 2.6 — Presenting data: tables and charts",
        icon: "chart",
        paragraphs: [],
        bullets: [
          "Use a table when the reader must look up exact values; use a chart when the pattern matters more than the numbers.",
          "Every table and figure gets a number and a title ('Table 2: Tickets logged by hour, Monday 6 July').",
          "Refer to every table/figure in the text — never leave the reader to guess why it is there.",
          "Round sensibly (R8,500 not R8,499.87) and state units (minutes, rand, tickets).",
          "Keep raw data in the appendix; summarise in the body.",
        ],
        example: {
          title: "Example — summarising ticket data",
          lines: [
            "In the body: 'Fourteen tickets were logged between 08:15 and 08:35, all reporting printing or P: drive failures (Table 1).'",
            "Table 1: Tickets by category — Printing: 8 · Shared drive: 5 · Other: 1.",
            "In the appendix: the full ticket list with numbers, times and users.",
          ],
        },
      },
      {
        heading: "Worked example — complete model report (condensed)",
        icon: "award",
        paragraphs: [],
        bullets: [
          "Study this model. It is the standard your Section A assignment report is marked against.",
        ],
        example: {
          title: "Model report — 3rd-floor service outage, Investec Sandton",
          lines: [
            "TITLE PAGE — 'Report on the 3rd-Floor Printing and Shared Drive Outage of Monday 6 July 2026' · Prepared for: Head, Private Banking · Prepared by: A. Snell, IT Service Desk · Date: 8 July 2026 · Classification: Internal.",
            "1. ABSTRACT — On Monday 6 July at 08:15, all 30 Private Banking staff on the 3rd floor lost access to printing and the shared P: drive following weekend electrical maintenance. Client-facing work was disrupted for two hours, including a 09:00 client onboarding meeting. The investigation found that the departmental file server did not restart cleanly because it has no UPS or graceful-shutdown procedure, and the shared printer lost its network address when the DHCP scope was rebuilt. Three preventive measures are recommended: install a UPS with automated shutdown (R8,500), reserve fixed addresses for printers, and adopt a post-maintenance verification checklist. Approval is requested by 10 July.",
            "3. INTRODUCTION — Purpose: establish the cause of the outage and recommend preventive measures. Scope: 3rd-floor LAN services only. Method: ticket review, user interviews, server event logs, DHCP records.",
            "4. INCIDENT ANALYSIS — 4.1 Timeline: 08:15 first ticket; 08:35 fourteen tickets logged; 09:20 file service restored manually; 10:05 printer restored. 4.2 Impact: 30 users unable to print or open shared files; client onboarding pack printed 40 minutes late. 4.3 Server: event logs show the file-sharing service failed to start after power restoration; the server has no UPS and no shutdown procedure was followed during the maintenance. 4.4 Printer: the DHCP scope was rebuilt during maintenance; the printer received a new address and the print server still pointed to the old one.",
            "5. CONCLUSION — The outage was caused by an unmanaged power-down during planned maintenance, combined with the absence of address reservations. Hardware is healthy; the risk will recur at the next maintenance window unless controls are introduced.",
            "6. RECOMMENDATIONS — 6.1 Install a UPS with automated graceful shutdown on the 3rd-floor server by 10 Jul (R8,500 — quote attached). Owner: Infrastructure. 6.2 Create DHCP reservations for all printers and servers by 9 Jul. Owner: Network team. 6.3 Adopt a post-maintenance verification checklist, run before 07:00 on the first business day after any maintenance. Owner: Service Desk team leader.",
            "7. REFERENCES — Investec IT Change Management Standard v4.0 · 3rd-floor server event log (6 July 2026) · DHCP scope configuration record.",
            "8. APPENDICES — A: Event log extracts · B: Ticket list · C: UPS quotation.",
            "SIGNED — A. Snell, IT Service Desk, 8 July 2026.",
          ],
        },
      },
      {
        heading: "Investec sample reports — 7 worked models",
        icon: "folder",
        flat: true,
        paragraphs: [],
        bullets: [
          "Use these samples to compare the purpose and content of incident reports, investigation reports, project status reports and recommendation reports.",
          "Each sample follows the full report structure: title page, abstract, table of contents, introduction, main body, conclusion, recommendations, references and appendices.",
          "Keep client, colleague and system information confidential. Use only authorised evidence such as tickets, monitoring alerts, change records, logs and approved interviews.",
        ],
      },
      {
        heading: "Sample report 1 — Incident report: Online Banking login outage",
        icon: "globe",
        paragraphs: [],
        example: {
          title: "Model incident report — Online Banking login outage",
          lines: [
            "TITLE PAGE — 'Report on the Online Banking Login Outage of 6 July 2026' · Prepared for: Head, Digital Channels · Prepared by: T. Mokoena, IT Service Desk · Date: 6 July 2026 · Version 1.0 · Classification: Internal.",
            "1. ABSTRACT — On 6 July 2026 the Online Banking authentication service suffered elevated login failures affecting about 18% of attempts for 35 minutes. The Service Desk logged 43 calls and escalated to Digital Channels Support. Service recovered after the authentication node was restarted. An incident review and a confirmed failover test are recommended to prevent recurrence.",
            "3. INTRODUCTION — Purpose: record the login outage and its cause, and agree preventive actions. Scope: the Online Banking authentication service only; branch and card systems are excluded. Method: monitoring dashboard alerts, Service Desk call logs, authentication node event logs and the on-call engineer's timeline.",
            "4. INCIDENT ANALYSIS — 4.1 Timeline: 09:12 monitoring reported elevated failures; 09:12–09:47 about 18% of logins failed; 09:47 authentication node restarted and service normalised. 4.2 Impact: 43 related Service Desk calls; customers intermittently unable to log in for 35 minutes. 4.3 Cause: one authentication node stopped responding and did not fail over automatically. 4.4 Response: escalation to Digital Channels Support and an internal service advisory were issued.",
            "5. CONCLUSION — The outage was caused by a single authentication node fault that did not fail over. Customer impact was limited and temporary, but the failover gap will recur unless it is tested and corrected.",
            "6. RECOMMENDATIONS — 6.1 Complete an incident review (Digital Channels Support, by 9 July 2026). 6.2 Confirm and run the authentication failover test (Platform Engineering, by 10 July 2026). 6.3 Add automated node health alerting to detect failover gaps (Monitoring team, next release).",
            "7. REFERENCES — Investec IT Incident Management Procedure v3.2 · Online Banking monitoring dashboard (6 July 2026) · ITIL 4 incident management guidance.",
            "8. APPENDICES — A: Monitoring alert extract · B: Service Desk call list · C: Authentication node event log.",
            "SIGNED — T. Mokoena, IT Service Desk, 6 July 2026.",
          ],
        },
      },
      {
        heading: "Sample report 2 — Incident report: Lost corporate laptop",
        icon: "shield",
        paragraphs: [],
        example: {
          title: "Model incident report — Lost corporate laptop",
          lines: [
            "TITLE PAGE — 'Report on the Lost Corporate Laptop Incident of 12 July 2026' · Prepared for: Head, IT Security · Prepared by: N. Dlamini, IT Security · Date: 13 July 2026 · Version 1.0 · Classification: Confidential.",
            "1. ABSTRACT — On 12 July 2026 a Relationship Manager reported a lost Investec laptop after travel between Rosebank and Sandton. The device was encrypted and MFA-protected, and IT Security remotely locked and wiped it within 15 minutes. No client data exposure was identified, so business impact was low. Manager sign-off, a replacement device and a user security refresher are recommended.",
            "3. INTRODUCTION — Purpose: record the lost-laptop incident, the security response and follow-up actions. Scope: the single reported device and its access; no other devices are in scope. Method: user report, IT Security action log, device management console and the compliance ticket record.",
            "4. INCIDENT ANALYSIS — 4.1 Timeline: 17:40 loss reported; 17:55 remote lock and wipe initiated; cached sessions disabled and a compliance notification ticket opened. 4.2 Controls: the device was encrypted and protected by multi-factor authentication. 4.3 Exposure: no confirmed client data exposure was identified. 4.4 Impact: low; no service or client disruption resulted.",
            "5. CONCLUSION — Existing encryption and MFA controls contained the risk, and the rapid remote wipe removed residual exposure. The incident is low impact but highlights a need to reinforce travel security habits.",
            "6. RECOMMENDATIONS — 6.1 Obtain line-manager sign-off on the incident (Line manager, by 13 July 2026). 6.2 Issue a replacement encrypted device (IT Asset team, by 13 July 2026, R14,000). 6.3 Deliver a travel-security refresher to the user (IT Security awareness, before device handover).",
            "7. REFERENCES — Investec IT Security Incident Procedure v2.1 · Device management console record (12 July 2026) · POPIA breach-assessment guidance.",
            "8. APPENDICES — A: IT Security action log · B: Device management console record · C: Compliance notification ticket.",
            "SIGNED — N. Dlamini, IT Security, 13 July 2026.",
          ],
        },
      },
      {
        heading: "Sample report 3 — Investigation report: Repeated VPN disconnections",
        icon: "network",
        paragraphs: [],
        example: {
          title: "Model investigation report — Repeated VPN disconnections",
          lines: [
            "TITLE PAGE — 'Investigation Report on Repeated VPN Disconnections, 1–10 July 2026' · Prepared for: Head, Private Banking IT · Prepared by: S. Naidoo, Network Support · Date: 11 July 2026 · Version 1.0 · Classification: Internal.",
            "1. ABSTRACT — Between 1 and 10 July 2026, Private Banking users logged 28 VPN disconnection tickets. Investigation of firewall logs, endpoint versions and user interviews found affected laptops running an outdated VPN client after a failed staged update. The root cause was incomplete deployment validation, not poor user networks. Upgrading the remaining clients and adding deployment verification are recommended.",
            "3. INTRODUCTION — Purpose: establish why VPN disconnections recurred and recommend a fix. Scope: Private Banking VPN clients only; branch WAN links are excluded. Method: review of 28 tickets, firewall connection logs, an endpoint version audit and user interviews.",
            "4. INVESTIGATION FINDINGS — 4.1 Tickets: 28 disconnection tickets over ten days, concentrated in one device group. 4.2 Endpoints: affected laptops ran an outdated VPN client version. 4.3 Cause: a staged client update failed on one device group and was not detected. 4.4 Network: firewall logs showed stable links, ruling out user network quality.",
            "5. CONCLUSION — The disconnections were caused by an outdated VPN client left in place by an unvalidated deployment, not by user network problems. The issue will persist on any device group that misses update validation.",
            "6. RECOMMENDATIONS — 6.1 Upgrade the remaining outdated VPN clients (Network Support, by 12 July 2026). 6.2 Add a deployment success report to every client rollout (Endpoint Management, ongoing). 6.3 Confirm version compliance before closing future change records (Change Manager, ongoing).",
            "7. REFERENCES — Investec Change Management Standard v4.0 · VPN client deployment change record · ITIL 4 problem management guidance.",
            "8. APPENDICES — A: VPN ticket list · B: Firewall log extract · C: Endpoint version audit.",
            "SIGNED — S. Naidoo, Network Support, 11 July 2026.",
          ],
        },
      },
      {
        heading: "Sample report 4 — Investigation report: Print-cost increase",
        icon: "trend",
        paragraphs: [],
        example: {
          title: "Model investigation report — Print-cost increase",
          lines: [
            "TITLE PAGE — 'Investigation Report on the 5th-Floor Print-Cost Increase, May–June 2026' · Prepared for: Head, Office Services · Prepared by: L. van Wyk, Print Services · Date: 3 July 2026 · Version 1.0 · Classification: Internal.",
            "1. ABSTRACT — Print costs on the Sandton 5th-floor multifunction devices rose 32% from May to June 2026. Investigation of print volumes, colour usage and departmental codes found default colour printing enabled after a driver update and secure-release missing on two devices. The increase resulted from print policy controls removed during the update. Restoring controls and adding monthly exception reporting are recommended.",
            "3. INTRODUCTION — Purpose: explain the print-cost increase and recommend corrective action. Scope: Sandton 5th-floor multifunction devices; other floors are excluded. Method: print management reports, colour-usage analysis and a device configuration review.",
            "4. INVESTIGATION FINDINGS — 4.1 Cost: a 32% month-on-month increase from May to June 2026. 4.2 Colour: default colour printing was enabled after a driver update. 4.3 Devices: secure-release settings were missing on two devices. 4.4 Usage: departmental codes showed the rise concentrated in routine documents.",
            "5. CONCLUSION — The cost increase was caused by print policy controls removed during a driver update, not by higher business demand. Costs will stay elevated until default settings are restored.",
            "6. RECOMMENDATIONS — 6.1 Restore mono-default and secure-release settings on all 5th-floor devices (Print Services, by 6 July 2026). 6.2 Re-apply secure-release to the two affected devices (Print Services, immediately). 6.3 Introduce monthly print exception reporting (Office Services, monthly).",
            "7. REFERENCES — Investec Print & Output Management Policy v1.3 · Managed print service monthly report (May–June 2026) · Device driver release notes.",
            "8. APPENDICES — A: Print management report · B: Colour-usage analysis · C: Device configuration record.",
            "SIGNED — L. van Wyk, Print Services, 3 July 2026.",
          ],
        },
      },
      {
        heading: "Sample report 5 — Project status report: Windows 11 pilot rollout",
        icon: "monitor",
        paragraphs: [],
        example: {
          title: "Model project status report — Windows 11 pilot rollout",
          lines: [
            "TITLE PAGE — 'Project Status Report — Windows 11 Pilot Rollout, 15 June–3 July 2026' · Prepared for: Windows 11 Project Sponsor · Prepared by: R. Peters, Project Lead · Date: 3 July 2026 · Version 1.0 · Classification: Internal.",
            "1. ABSTRACT — For the period 15 June to 3 July 2026 the Windows 11 pilot is amber. Of 40 planned laptops, 34 are upgraded, 3 are deferred for application compatibility and 3 await user availability. Scope is unchanged and the main risk is the uncertified treasury spreadsheet add-in. Completing compatibility testing and the deferred upgrades, then a go/no-go decision, are recommended.",
            "3. INTRODUCTION — Purpose: report pilot progress against plan and flag risks. Scope: the 40-laptop Windows 11 pilot group; the wider estate rollout is excluded. Method: deployment tooling records, compatibility test results and pilot-user feedback.",
            "4. PROGRESS AND STATUS — 4.1 Progress: 34 of 40 laptops upgraded. 4.2 Deferred: 3 laptops held for application compatibility and 3 awaiting user availability. 4.3 Risk: the treasury spreadsheet add-in is not yet certified. 4.4 Scope and budget: scope unchanged; no budget variance reported.",
            "5. CONCLUSION — The pilot is largely on track but rated amber because the treasury add-in risk is unresolved and six laptops remain outstanding. The risk is manageable within the current plan.",
            "6. RECOMMENDATIONS — 6.1 Complete compatibility testing (Application Support, by 8 July 2026). 6.2 Upgrade the deferred laptops (Deployment team, by 11 July 2026). 6.3 Submit a phase 2 go/no-go recommendation (Project Lead, by 13 July 2026).",
            "7. REFERENCES — Windows 11 pilot project plan v1.0 · Application compatibility test log · Investec Endpoint Standard v5.2.",
            "8. APPENDICES — A: Deployment status list · B: Compatibility test results · C: Pilot-user feedback.",
            "SIGNED — R. Peters, Project Lead, 3 July 2026.",
          ],
        },
      },
      {
        heading: "Sample report 6 — Project status report: Branch Wi-Fi upgrade",
        icon: "briefcase",
        paragraphs: [],
        example: {
          title: "Model project status report — Branch Wi-Fi upgrade",
          lines: [
            "TITLE PAGE — 'Project Status Report — Branch Wi-Fi Upgrade, 1–30 June 2026' · Prepared for: Branch Infrastructure Sponsor · Prepared by: K. Botha, Project Lead · Date: 2 July 2026 · Version 1.0 · Classification: Internal.",
            "1. ABSTRACT — For June 2026 the Branch Wi-Fi upgrade is green. Access points are installed at 5 of 6 planned branches, with the sixth delayed by landlord access approval. Budget used is 71% against a planned 75%, and no major incidents occurred during cutover. Completing the remaining cabling, coverage testing and manager sign-off are the next milestones.",
            "3. INTRODUCTION — Purpose: report upgrade progress and confirm next milestones. Scope: the six-branch Wi-Fi upgrade programme; head-office networking is excluded. Method: installation records, the budget tracker and the cutover incident log.",
            "4. PROGRESS AND STATUS — 4.1 Installation: access points live at 5 of 6 branches. 4.2 Delay: cabling at the sixth branch is held by landlord access approval. 4.3 Budget: 71% used against a planned 75%. 4.4 Stability: no major service incidents during cutover.",
            "5. CONCLUSION — The programme is on track and within budget, with the only constraint being external landlord access at one branch. Overall delivery risk is low.",
            "6. RECOMMENDATIONS — 6.1 Complete the remaining branch cabling (Field Services, once landlord access is granted). 6.2 Run post-install coverage tests at all branches (Network Support, by 10 July 2026). 6.3 Obtain branch manager acceptance sign-off (Project Lead, on completion).",
            "7. REFERENCES — Branch Wi-Fi upgrade project charter v1.0 · Site installation records · Investec Network Design Standard v3.1.",
            "8. APPENDICES — A: Installation record · B: Budget tracker · C: Cutover incident log.",
            "SIGNED — K. Botha, Project Lead, 2 July 2026.",
          ],
        },
      },
      {
        heading: "Sample report 7 — Recommendation report: Service desk knowledge base",
        icon: "book",
        paragraphs: [],
        example: {
          title: "Model recommendation report — Service desk knowledge base",
          lines: [
            "TITLE PAGE — 'Recommendation Report — Service Desk Knowledge Base' · Prepared for: Head, IT Service Management · Prepared by: A. Snell, IT Service Desk · Date: 3 July 2026 · Version 1.0 · Classification: Internal.",
            "1. ABSTRACT — Recurring first-line issues — password resets, VPN setup, printer mapping and Teams audio — make up 41% of Service Desk requests. A searchable knowledge base would cut repeat effort and speed resolution. Using the existing ITSM knowledge module (Option 1) avoids new licensing costs and links articles to tickets. Approval is requested to assign two analysts and start monthly article review.",
            "3. INTRODUCTION — Purpose: recommend how to reduce recurring first-line requests. Scope: Service Desk first-line support and knowledge tooling; second-line processes are excluded. Method: ticket category analysis and comparison of knowledge-base options.",
            "4. ANALYSIS AND OPTIONS — 4.1 Demand: password resets, VPN setup, printer mapping and Teams audio total 41% of first-line requests. 4.2 Option 1 — existing ITSM knowledge module: no new licensing, supports approval workflows, links articles to tickets. 4.3 Option 2 — new standalone tool: added licensing cost and integration effort. 4.4 Effort: article creation needs dedicated analyst time.",
            "5. CONCLUSION — A knowledge base is justified by the high share of repeat issues, and Option 1 delivers it at lowest cost with existing integration. Delay prolongs avoidable first-line effort.",
            "6. RECOMMENDATIONS — 6.1 Implement the ITSM knowledge module for recurring issues (IT Service Management, by 10 July 2026). 6.2 Assign two analysts to create the initial articles (Service Desk Manager, by 10 July 2026). 6.3 Require monthly article review (Team leads, monthly).",
            "7. REFERENCES — Service Desk ticket analysis (Q2 2026) · ITSM knowledge management module documentation · ITIL 4 knowledge management guidance.",
            "8. APPENDICES — A: Ticket category analysis · B: Option comparison · C: Draft article backlog.",
            "SIGNED — A. Snell, IT Service Desk, 3 July 2026.",
          ],
        },
      },
      {
        heading: "Common mistakes that cost marks",
        icon: "info",
        paragraphs: [
          "Assessors see the same errors over and over. Check your report against each of these before you submit.",
        ],
        cards: [
          {
            icon: "document",
            title: "Summary that introduces",
            text: "An executive summary must summarise the report, not introduce it — 'This report will look at…' is wrong.",
          },
          {
            icon: "bell",
            title: "New information at the end",
            text: "Nothing new may appear in the conclusions or recommendations.",
          },
          {
            icon: "search",
            title: "Findings without evidence",
            text: "Every factual claim needs a source — a log, ticket or interview.",
          },
          {
            icon: "target",
            title: "Vague recommendations",
            text: "No owner, no deadline, no cost — a recommendation nobody can act on.",
          },
          {
            icon: "people",
            title: "Blaming people",
            text: "Describe process failures — never point at individuals.",
          },
          {
            icon: "design",
            title: "Inconsistent formatting",
            text: "Mixed fonts, unnumbered headings, missing page numbers.",
          },
          {
            icon: "checkCircle",
            title: "Submitting without proofreading",
            text: "Spelling errors destroy credibility instantly.",
          },
        ],
      },
      {
        heading: "Practice exercises — do these before the assignment",
        icon: "exercise",
        paragraphs: [
          "Work through these five short exercises to sharpen each skill before you tackle the formal assignment.",
        ],
        cards: [
          {
            icon: "document",
            title: "Exercise 1 — Executive summary",
            text: "Take yesterday's most interesting helpdesk ticket and write ONLY an executive summary (max 6 sentences). Swap with a classmate and critique each other against the Lesson 2.3 checklist.",
          },
          {
            icon: "design",
            title: "Exercise 2 — Plain language",
            text: "Rewrite into plain language: 'Utilisation of the aforementioned printing device was rendered impossible' and 'A resolution was effected by the undersigned'.",
          },
          {
            icon: "checklist",
            title: "Exercise 3 — Build an outline",
            text: "Build a full outline (Lesson 2.4 style) for a report recommending a second monitor for all service desk staff.",
          },
          {
            icon: "search",
            title: "Exercise 4 — Analyse a real report",
            text: "Find a real report (or news article) and identify its purpose, audience and type. Does the first paragraph answer the reader's question?",
          },
          {
            icon: "chart",
            title: "Exercise 5 — Draft Table 1",
            text: "Draft Table 1 for the model report above from this raw data: tickets at 08:15, 08:16, 08:18 (printing), 08:20, 08:22 (P: drive), 08:25 (printing ×3), 08:30 (P: drive ×2), 08:31 (printing ×2), 08:33 (P: drive), 08:35 (email).",
          },
        ],
        modelAnswer: [
          {
            heading: "Exercise 1 — What a competent executive summary looks like",
            bullets: [
              "Structure: states the problem, the business impact, the cause, the action taken and any decision needed — in that order, max 6 sentences.",
              "Language: plain business English, no jargon, no ticket numbers — the reader must understand it without opening the ticket.",
              "Common gaps to critique: starting with 'This summary will…' (introducing, not summarising), missing the business impact, or burying the decision needed.",
            ],
          },
          {
            heading: "Exercise 2 — Plain-language rewrites",
            bullets: [
              "'Utilisation of the aforementioned printing device was rendered impossible' → 'The printer could not be used.'",
              "'A resolution was effected by the undersigned' → 'I fixed the problem.'",
              "Credit any rewrite that is short, active voice, and keeps the full meaning.",
            ],
          },
          {
            heading: "Exercise 3 — Model outline: second monitor for service desk staff",
            bullets: [
              "1. Introduction: purpose — motivate a second monitor for all service desk staff; scope — service desk only.",
              "2. Findings:",
              "2.1 Current single-monitor setup and window-switching time.",
              "2.2 Observed error rate when transcribing between systems.",
              "2.3 Industry/peer benchmarks.",
              "2.4 Cost of monitors and arms.",
              "3. Conclusions: measurable time loss and transcription errors are caused by the single-screen setup.",
              "4. Recommendations: procure one additional monitor per analyst (quantity, unit cost, total), owner (IT Asset team), delivery date.",
              "5. Appendix: supplier quotes, time-study notes.",
            ],
          },
          {
            heading: "Exercise 4 — Marking guidance",
            bullets: [
              "Any real report is acceptable. The learner must correctly identify:",
              "(a) The purpose — inform / analyse / recommend / record.",
              "(b) The primary audience.",
              "(c) The report type.",
              "Then judge whether the opening paragraph answers the reader's question — a 'no' with a sound reason earns full credit.",
            ],
          },
          {
            heading: "Exercise 5 — Model Table 1",
            table: {
              headers: ["Category", "Tickets"],
              rows: [
                ["Printing", "8"],
                ["P: drive (shared drive)", "5"],
                ["Email", "1"],
                ["Total", "14"],
              ],
              caption:
                "Table 1: Tickets by category, 08:15–08:35, Monday 6 July. Source: ticket system export.",
            },
            bullets: [
              "How the totals are derived: Printing = 08:15 + 08:16 + 08:18 + 08:25 (×3) + 08:31 (×2) = 8 · P: drive = 08:20 + 08:22 + 08:30 (×2) + 08:33 = 5 · Email = 08:35 = 1 · Total = 14.",
              "Check: the table has a number, a title with the period covered, category totals (not the raw list), and a stated source (ticket system export).",
              "Insight worth credit: the 08:35 email ticket is probably unrelated to the outage — noting this shows critical reading of raw data.",
            ],
          },
        ],
      },
    ],

    exercises: [
      {
        id: "ex1",
        title: "Exercise 1 — Match purpose and audience",
        task: "For each of the four scenarios below, write down (a) the purpose of the report, (b) the primary audience, and (c) two things that audience will want to see first.",
        steps: [
          "Scenario A: P1 incidents on the core banking platform have doubled in three months. The Head of Technology has asked for a report.",
          "Scenario B: The IT support team wants to extend service desk hours to 19h00 for the trading floor. Exco must approve the extra staffing cost.",
          "Scenario C: A contractor's laptop containing an unencrypted client presentation was lost in the office parkade. Risk & Compliance requires a report within 48 hours.",
          "Scenario D: The monthly IT service performance report for June must go to the IT Service Delivery Manager and the business unit heads of Private Banking and Wealth & Investment.",
          "Compare your answers with a partner and note where the same facts would be presented differently for different audiences — e.g. what exco needs vs what Risk & Compliance needs.",
        ],
        modelAnswer: [
          {
            heading: "Scenario A — P1 incidents doubled",
            bullets: [
              "Purpose: to analyse — investigate the trend in P1 incidents and recommend corrective action.",
              "Audience: Head of Technology.",
              "Wants to see first: (1) the scale and trend of the increase with figures (e.g. 3 → 7 per quarter), and (2) the root causes identified so far with the immediate mitigation plan.",
            ],
          },
          {
            heading: "Scenario B — Extended service desk hours",
            bullets: [
              "Purpose: to recommend — a feasibility report / business case for extending hours to 19h00.",
              "Audience: Exco.",
              "Wants to see first: (1) the total cost vs the quantified benefit, and (2) the risk of not acting — unsupported trading-floor incidents after 17h00 and their business impact.",
            ],
          },
          {
            heading: "Scenario C — Lost unencrypted laptop",
            bullets: [
              "Purpose: to record — a factual incident report supporting a POPIA exposure assessment.",
              "Audience: Risk & Compliance (48-hour deadline).",
              "Wants to see first: (1) exactly what client information was exposed, and (2) the containment actions already taken (device block, client notification assessment) with a precise timeline.",
            ],
          },
          {
            heading: "Scenario D — Monthly IT service performance report",
            bullets: [
              "Purpose: to inform — routine reporting of June service performance.",
              "Audience: IT Service Delivery Manager (operational detail) plus Private Banking and Wealth & Investment business unit heads (client impact).",
              "Wants to see first: (1) SLA compliance against target, and (2) any client-impacting incidents affecting their business units.",
            ],
          },
          {
            heading: "Key insight",
            paragraphs: [
              "The same facts change shape per audience: exco needs decisions and costs first; Risk & Compliance needs evidence, timelines and exposure; operational managers need detail they can act on. Purpose determines what goes in; audience determines how it is presented.",
            ],
          },
        ],
      },
      {
        id: "ex2",
        title: "Exercise 2 — Rewrite in plain business language",
        task: "Rewrite each sentence in plain, objective, active-voice business English. Aim for fewer than 20 words per sentence.",
        steps: [
          "\"It has come to the attention of the undersigned that connectivity degradation events of a not insignificant magnitude have been experienced on the trading floor.\"",
          "\"The service desk stats were absolutely terrible this month and the night-shift analysts basically didn't even try.\"",
          "\"Utilisation of the aforementioned VPN apparatus was discontinued by Private Banking personnel owing to functionality challenges.\"",
          "\"We might possibly want to think about maybe looking into getting more spare laptops for the support team.\"",
          "Swap with a partner: check each rewrite for active voice, objectivity, defined abbreviations and sentence length.",
        ],
        modelAnswer: [
          {
            heading: "Model rewrites",
            bullets: [
              "1. \"The trading floor lost network connectivity 14 times this month.\" (Active, specific, 9 words — replaces pompous phrasing with a measurable fact.)",
              "2. \"The service desk missed its June targets. Night-shift resolution rates require investigation.\" (Objective — replaces emotive blame with evidence and a next step.)",
              "3. \"Private Banking staff stopped using the VPN because connections failed repeatedly.\" (Plain words — 'utilisation of the apparatus was discontinued' becomes 'stopped using'.)",
              "4. \"The support team needs five additional spare laptops.\" (Direct and specific — hedging like 'might possibly maybe' removed, quantity stated.)",
            ],
          },
          {
            heading: "What competence looks like",
            paragraphs: [
              "Each rewrite is under 20 words, uses active voice, states verifiable facts rather than opinions, and avoids jargon. Numbers replace vague intensifiers — '14 times' carries more weight than 'a not insignificant magnitude'.",
            ],
          },
        ],
      },
      {
        id: "ex3",
        title: "Exercise 3 — Rebuild the report skeleton",
        task: "The sections of an incident-investigation report on repeated Wi-Fi outages in the client-meeting suites have been shuffled. Arrange them in the correct order and justify each placement in one sentence.",
        steps: [
          "Shuffled sections: Recommendations · Appendix: monitoring graphs and ticket export · Introduction · Executive summary · Findings: outages by floor and access point · Title page (marked Internal) · Conclusions · Table of contents.",
          "Write the correct sequence 1–8.",
          "For each section, state in one sentence what belongs in it for THIS report.",
          "Identify which two sections a one-page version for the facilities manager could drop without losing credibility.",
        ],
        modelAnswer: [
          {
            heading: "Correct sequence",
            bullets: [
              "1. Title page (marked Internal) — identifies the report, author, date, reference and classification.",
              "2. Executive summary — the whole investigation in one page: purpose, key findings, main recommendation.",
              "3. Table of contents — navigation for a report longer than about four pages.",
              "4. Introduction — background to the Wi-Fi complaints, scope of the investigation and method.",
              "5. Findings: outages by floor and access point — the evidence, organised under numbered headings.",
              "6. Conclusions — what the findings mean (e.g. two access points account for 80% of outages); no new facts.",
              "7. Recommendations — specific, costed actions linked to the conclusions.",
              "8. Appendix: monitoring graphs and ticket export — supporting detail referenced from the findings.",
            ],
          },
          {
            heading: "One-page version",
            paragraphs: [
              "Drop the table of contents (only needed beyond ±4 pages) and the executive summary (a one-pager is its own summary). The title block, findings, conclusions and recommendations must stay — they carry the evidence chain that gives the report credibility.",
            ],
          },
        ],
      },
      {
        id: "ex4",
        title: "Exercise 4 — Draft an executive summary",
        task: "Using the service desk data provided, draft an executive summary of no more than 150 words for the IT Service Delivery Manager.",
        steps: [
          "Data: June ticket volume 3 412 (May: 3 108). First-call resolution 71% (SLA target 75%). Average resolution time down from 5h10 to 4h22. P1 incidents: 3 (two caused by a failed switch in the data centre). Client-facing systems availability 99.2% (target 99.5%). Two new analysts started on 15 June.",
          "State purpose in the first sentence.",
          "Give the two or three findings that matter most — with figures.",
          "End with one clear recommendation.",
          "Check: could the manager act on your summary without reading anything else?",
        ],
        download: {
          filename: "service-desk-data-june.csv",
          label: "Download sample service data (CSV)",
          mime: "text/csv",
          content: [
            "SERVICE DESK MONTHLY SUMMARY - JUNE",
            "Metric,May,June,SLA Target",
            "Ticket volume,3108,3412,",
            "First-call resolution,74%,71%,75%",
            "Average resolution time,5h10,4h22,4h30",
            "P1 incidents,1,3,0",
            "Client-facing systems availability,99.5%,99.2%,99.5%",
            "Analysts on shift,9,11 (two started 15 June),",
            "",
            "P1 INCIDENT LOG - JUNE",
            "Ticket ID,Priority,Opened,Resolved,Duration,Cause,Affected system",
            "INC0031204,P1,03 June 08:12,03 June 10:47,2h35,Failed switch - data centre rack B4,ITSM platform",
            "INC0031377,P1,11 June 14:03,11 June 16:58,2h55,Failed switch - data centre rack B4,Telephony",
            "INC0031590,P1,24 June 07:41,24 June 09:02,1h21,Expired certificate,Client portal",
            "",
            "TICKET VOLUME BY BUSINESS UNIT - JUNE",
            "Business unit,Tickets,First-call resolution",
            "Private Banking,1184,69%",
            "Wealth & Investment,876,72%",
            "Corporate & Institutional Banking,758,71%",
            "Group functions,594,74%",
          ].join("\n"),
        },
        modelAnswer: [
          {
            heading: "Model executive summary (±120 words)",
            paragraphs: [
              "\"This summary reports June service desk performance for the IT Service Delivery Manager. Ticket volume rose 9.8% to 3 412 (May: 3 108), yet average resolution time improved from 5h10 to 4h22. Two measures missed target: first-call resolution of 71% was 4 percentage points below the 75% SLA target, and client-facing systems availability of 99.2% fell short of the 99.5% target, driven by three P1 incidents — two caused by the same failed data-centre switch. Two new analysts joined on 15 June, improving capacity. Recommendation: replace the failed switch and add redundancy immediately, and fast-track the new analysts' training so first-call resolution returns to target by August.\"",
            ],
          },
          {
            heading: "Why this is competent",
            bullets: [
              "Purpose stated in the first sentence.",
              "The findings that matter most lead: the two SLA misses, each with exact figures and comparisons.",
              "Cause is identified factually (the failed switch) without speculation or blame.",
              "Ends with one clear, actionable, time-bound recommendation.",
              "Under 150 words — the manager can act without reading anything else.",
            ],
          },
        ],
      },
    ],

    assignments: [
      {
        id: "as1",
        title: "Assignment 1 — Monthly IT service performance report",
        brief: "Prepare a complete formal business report (1 500 – 2 000 words) analysing the bank's monthly IT service performance, using the simulated ServiceNow data pack provided by your facilitator (ticket volumes, SLA compliance, system availability, and client-impact incidents for the month).",
        requirements: [
          "Full formal structure: title page with classification (Internal), executive summary, contents, introduction, findings, conclusions, recommendations, appendices.",
          "At least two tables and two charts, each numbered, titled, sourced (e.g. 'ServiceNow export, June 2026') and referenced in the text.",
          "Comparisons: actual vs SLA target, current vs previous month, and at least one analysis by business unit (Private Banking, Wealth & Investment, Corporate & Institutional Banking).",
          "At least three specific, actionable recommendations linked to your conclusions — at least one addressing SLA compliance and one addressing recurring incidents.",
          "Plain business English, UK spelling, abbreviations defined on first use, numbered headings, version and date on the document. No client-identifying information anywhere in the report (POPIA).",
        ],
        evidence: "Submit the report to your facilitator for formative feedback, then file the assessed copy and your source data pack in your Portfolio of Evidence (POE).",
      },
      {
        id: "as2",
        title: "Assignment 2 — Incident report: data-centre power failure",
        brief: "At 07h42 on a Monday, a UPS failure in the data centre took down two racks, interrupting the ITSM platform and telephony for 3 hours 20 minutes. Trading was unaffected, but 214 service desk calls could not be logged and Private Banking client onboarding was delayed. Write a short-form incident/investigation report (600 – 800 words) for the IT Operations Manager.",
        requirements: [
          "Short-form structure: heading block (to/from/date/ref/classification), purpose, factual findings, conclusions, recommendations.",
          "Chronology of the incident and response: detection, escalation, failover attempts, vendor call-out, restoration, and post-incident checks.",
          "Clear separation of fact from opinion; any assumption must be labelled as such.",
          "One table summarising impact by system and business unit (duration, users affected, client impact).",
          "Recommendations covering both immediate remediation (UPS maintenance, monitoring alerts) and prevention (redundancy testing schedule, communication protocol).",
        ],
        evidence: "Submit within 5 working days of the briefing session. The assessed report and assessor feedback form are filed in your POE as summative evidence.",
      },
    ],

    notes: [
      {
        id: "incident-report",
        title: "IT Support Incident Report — worked example",
        image: "/notes/incident-report.png",
        caption:
          "A complete incident report showing numbered structure, objective tone, factual findings, root cause analysis and a confidentiality notice.",
      },
    ],

    lessonPlan: {
      title: "Facilitator Preparation",
      startTime: "09:00",
      details: [
        { icon: "calendar", label: "Date", value: "Friday, 17 July 2026" },
        { icon: "clock", label: "Time", value: "09:00 \u2013 14:00" },
        { icon: "globe", label: "Venue", value: "Investec, Sandton, Johannesburg" },
        { icon: "presenter", label: "Facilitator", value: "Andre Snell" },
      ],
      prep: [
        "Study the notes in this lesson plan carefully to ensure preparation is done before the start of classes.",
        "Study the learner materials so that you are familiar with the topics that will be covered in this part of the course.",
      ],
      sections: [
        {
          rows: [
            {
              title: "Room Set Up",
              text: ["Ensure venue and equipment needed is ready."],
            },
            {
              time: "20 minutes",
              title: "Meet, Greet & Seat",
              text: [
                "Learners to get out their stationery and settle. Allow learners to sign the class register OR check learners against the class register.",
                "Explain the parking bay to the learners where they can ask questions and it will be parked until the class has been completed, and then attended to.",
              ],
              resources: ["Class Register", "LM p1"],
            },
          ],
        },
        {
          heading: "Unit Standard 8252",
          rows: [
            {
              time: "30 minutes",
              title: "Index & Unit Standard Alignment — Facilitator",
              text: [
                "Read through the index with the learners, highlighting the areas that will be covered in this manual. Make reference to the Unit Standard Alignment Index to outline the specific outcomes that will be covered.",
              ],
              resources: ["LM p3"],
            },
            {
              time: "90 minutes",
              title: "Purpose and content of a range of reports — Facilitator & Class",
              bullets: [
                "Read through pages 4-7 of the learner manual, identifying different reports and the styles in which they are written.",
              ],
              resources: ["LM p4-7"],
            },
            {
              time: "25 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "30 minutes",
              title: "Procedures and resources for obtaining and distributing confidential information — Facilitator & Class",
              bullets: [
                "Read through page 8 and identify resources for getting information and procedures for distributing such information.",
              ],
              resources: ["LM p8"],
            },
            {
              time: "30 minutes",
              title: "Verifying reported information — Facilitator & Class",
              bullets: [
                "Read through page 9 and identify methods to check that the reported information is in accordance with the requirements.",
              ],
              resources: ["LM p9"],
            },
            {
              time: "45 minutes",
              title: "Questionnaire 1 — Class in pairs",
              bullets: [
                "Facilitator to read through the questions with the learners, ensuring they understand what is expected of them.",
                "Allow the learners to complete the questions; take feedback from two groups/pairs.",
              ],
              resources: ["LM p10-11"],
            },
            {
              time: "10 minutes",
              title: "Self-Assessment — Learners individually",
              bullets: [
                "Explain to the learners that they have to judge their own knowledge gained in the unit by ticking the blocks they feel competent with.",
                "Allow the learners to tick the blocks and take feedback from each learner.",
                "Identify those learners who have shortcomings and assist them with fulfilling the requirements.",
              ],
              resources: ["LM p12"],
            },
            {
              time: "10 minutes",
              title: "Parking Bay — Facilitator",
              bullets: [
                "Take all the questions from the learners and answer them individually.",
                "Ensure the entire class understands the questions posed by other learners.",
              ],
              resources: ["White Board"],
            },
            {
              time: "10 minutes",
              title: "Closing — Facilitator",
              bullets: [
                "Thank the learners for their participation.",
                "Agree with them when the next facilitation session is scheduled for.",
              ],
            },
          ],
        },
      ],
    },

    logbook: {
      assignmentTitle: "Assignment One",
      programme: "Information Technology — Systems Support",
      unitLabel: "8252 — Writing business reports in Retail/Wholesale practices",
      detailFields: [
        "Learner Name",
        "Qualification",
        "Group / Class",
        "Workplace Name",
        "Supervisor / Mentor",
        "Start & Completion Date",
      ],
      project: {
        time: "30 minutes",
        title: "Project — Report",
        text: "Compile a report on your overall progress for the week/month in your department. Choose the correct format, layout and style. Attach your report here and mark it 8252.",
        resource: "Logbook",
      },
      knowledgeQuestions: [
        { text: "Relating the purpose and content of a range of reports to the information needs of business", marks: [true, false, false, true, false, false] },
        { text: "Available information resources", marks: [true, false, false, true, false, false] },
        { text: "Organisational procedures for the dissemination of confidential information", marks: [true, false, false, true, false, false] },
        { text: "Organisational standards relating to layout and format of various reports", marks: [true, false, false, true, false, false] },
        { text: "Information needs of the organisation", marks: [true, false, false, true, false, false] },
        { text: "Purpose and content of a range of reports required by Retail/Wholesale practices", marks: [true, false, false, true, false, false] },
        { text: "Organisational reporting deadlines", marks: [true, false, false, true, false, false] },
        { text: "Techniques for writing business reports appropriate to a range of information requirements", marks: [true, false, false, true, false, false] },
        { text: "Recipients of various reports", marks: [true, false, false, true, false, false] },
      ],
      practicalActivities: [
        { text: "Recognising appropriate information resources and organisational procedures for obtaining and distributing confidential information", marks: [false, true, false, false, true, false] },
        { text: "Applying a range of techniques for compiling reports, ensuring content and format are appropriate to information requirements and that reporting deadlines are met", marks: [true, true, true, true, true, true] },
        { text: "Liaising with relevant parties and verifying reported information is in accordance with requirements, compiling and distributing additional commentary/information where required", marks: [false, true, false, false, true, false] },
      ],
      workplaceActivities: [
        "Recognising appropriate information resources and organisational procedures for obtaining and distributing confidential information",
        "Applying a range of techniques for compiling reports, ensuring content and format are appropriate to information requirements and that reporting deadlines are met",
        "Liaising with relevant parties and verifying reported information is in accordance with requirements, compiling and distributing additional commentary/information where required",
      ],
      workplaceEvidenceNote: "The workplace completes this section after observing the learner having complied to and completed all the activities as mentioned below.",
      otherActivities: [
        {
          activity: "Applying a range of techniques for compiling reports, ensuring content and format are appropriate to information requirements and that reporting deadlines are met",
          evidence: "Project — Report: Compile a report on your overall progress for the week/month in your department. Choose the correct format, layout and style. Attach your report here and mark it 8252.",
        },
      ],
      otherEvidenceNote: "Learner evidence and experience is recorded here. Make reference to equipment, chemicals and materials that were used in these processes.",
      projectChecklist: [{ no: "3", name: "8252" }],
    },

    saqa: {
      notice:
        "SOUTH AFRICAN QUALIFICATIONS AUTHORITY — Registered unit standard that has passed the end date. In this record both the pre-2009 NQF Level and the NQF Level are shown; references to NQF Levels are to the pre-2009 levels unless stated otherwise. This unit standard does not replace any other unit standard and is not replaced by any other unit standard.",
      registration: [
        { label: "SAQA US ID", value: "8252" },
        { label: "Unit standard title", value: "Writing business reports in Retail/Wholesale practices" },
        { label: "Originator", value: "SGB Retail and Wholesale" },
        { label: "Primary / delegated quality assurance functionary", value: "—" },
        { label: "Field", value: "Field 11 — Services" },
        { label: "Subfield", value: "Wholesale and Retail" },
        { label: "ABET band", value: "Undefined" },
        { label: "Unit standard type", value: "Regular" },
        { label: "Pre-2009 NQF level", value: "Level 5" },
        { label: "NQF level", value: "Level TBA: Pre-2009 was L5" },
        { label: "Credits", value: "6" },
        { label: "Registration status", value: "Passed the End Date — status was \"Reregistered\"" },
        { label: "Registration start date", value: "2018-07-01" },
        { label: "Registration end date", value: "2023-06-30" },
        { label: "SAQA decision number", value: "SAQA 06120/18" },
        { label: "Last date for enrolment", value: "2026-06-30" },
        { label: "Last date for achievement", value: "2029-06-30" },
      ],
      sections: [
        {
          heading: "Purpose of the unit standard",
          icon: "target",
          paragraphs: [
            "This unit standard is a fundamental standard towards the qualification National Diploma in Retail / Wholesale Management at NQF 5.",
            "It provides the fundamental competence to write business reports in preparation for the core and elective standards at this level.",
          ],
        },
        {
          heading: "Learning assumed to be in place / RPL",
          icon: "book",
          paragraphs: ["Communication at NQF Level 4."],
        },
        {
          heading: "Unit standard range",
          icon: "folder",
          bullets: [
            "Reports including Board Reports, Proposals, Budgets, Flash Reports and Strategic Plans.",
            "Techniques for compiling reports including structure and style of business reports, format and layout, and use of business terminology.",
          ],
        },
        {
          heading: "Specific Outcome 1 & Assessment Criterion 1",
          icon: "checklist",
          paragraphs: ["The demonstrated ability to make decisions and consider options when:"],
          bullets: [
            "Relating the purpose and content of a range of reports to the information needs of business.",
            "Recognising appropriate information resources and organisational procedures for obtaining and distributing confidential information.",
            "Applying a range of techniques for compiling reports, ensuring content and format are appropriate to information requirements and that reporting deadlines are met.",
            "Liaising with relevant parties and verifying reported information is in accordance with requirements, compiling and distributing additional commentary/information where required.",
          ],
        },
        {
          heading: "Essential embedded knowledge",
          icon: "database",
          paragraphs: ["The demonstrated understanding of:"],
          bullets: [
            "Information needs of the organisation.",
            "Purpose and content of a range of reports required by Retail/Wholesale practices.",
            "Available information resources.",
            "Organisational procedures for the dissemination of confidential information.",
            "Organisational standards relating to layout and format of various reports.",
            "Organisational reporting deadlines.",
            "Techniques for writing business reports appropriate to a range of information requirements.",
            "Recipients of various reports.",
          ],
        },
        {
          heading: "Critical cross-field outcomes (CCFO)",
          icon: "people",
          bullets: [
            "Working — demonstrate an understanding of the world as a set of related systems where follow-up actions are vital to ensuring that confidential information is received and verified by authorised recipients.",
            "Organising — organise oneself and one's activities when compiling reports so that sufficient time is set aside to check comprehensiveness and accuracy of information reported.",
            "Collecting — collect, organise, analyse and critically evaluate information when compiling reports so that information reflected is appropriate to business needs.",
            "Communicating — communicate effectively when compiling written reports by applying a style and format that facilitates clear interpretation of facts presented on the part of the recipient.",
          ],
        },
        {
          heading: "Assessor criteria — evidence required",
          icon: "clipboard",
          paragraphs: ["The ability to produce the following evidence:"],
          bullets: [
            "Give a brief description of the various information needs of business practices.",
            "Describe the range of reports compiled in business practices and explain the purpose, content and deadline date of each report.",
            "Describe the resources that can be used when gathering information for various reports.",
            "Describe organisational procedures relating to the dissemination of confidential information.",
            "Demonstrate techniques for compiling reports utilising layouts and formats appropriate to information requirements presented by the assessor.",
          ],
        },
        {
          heading: "Accreditation, moderation & reregistration",
          icon: "shield",
          bullets: [
            "The Retail/Wholesale SETA in its ETQA role will accredit providers against this unit standard.",
            "As per the SAQA Board decision/s at the time, this unit standard was reregistered in 2012 and 2015.",
          ],
        },
        {
          heading: "Qualifications utilising this unit standard",
          icon: "certificate",
          table: {
            headers: ["Type", "ID", "Qualification title", "NQF level", "Status", "End date", "QA functionary"],
            rows: [
              [
                "Fundamental",
                "48573",
                "National Certificate: Information Technology: Systems Support",
                "Level 5 (pre-2009)",
                "Passed the End Date — was \"Reregistered\"",
                "2023-06-30",
                "MICTS",
              ],
            ],
          },
        },
      ],
    },

    quiz: [
      {
        q: "What is the primary purpose of a business report?",
        options: [
          "To demonstrate the writer's vocabulary and technical expertise",
          "To provide structured, factual information that supports decision-making",
          "To create a permanent record of staff opinions",
          "To satisfy a filing requirement",
        ],
        answer: 1,
        explain: "A report exists to inform decisions — everything in it (structure, content, tone, classification) serves the reader's need to decide or act.",
      },
      {
        q: "Which section of a formal report is written LAST but read FIRST?",
        options: ["Introduction", "Conclusions", "Executive summary", "Appendices"],
        answer: 2,
        explain: "The executive summary condenses the whole report — purpose, key findings, main recommendations — so it can only be written once the report is complete.",
      },
      {
        q: "An incident report states: 'The network team seemed lazy and the monitoring was terrible.' What is the main problem with this sentence?",
        options: [
          "It is too short for a formal report",
          "It uses subjective, emotive opinion instead of objective evidence",
          "It should appear in the appendix instead",
          "It uses the active voice",
        ],
        answer: 1,
        explain: "Reports must be objective. 'P1 response time averaged 47 minutes against a 15-minute target while two monitoring alerts failed to trigger' is evidence; 'lazy' and 'terrible' are unsupported opinion.",
      },
      {
        q: "Exco must decide whether to extend service desk hours to 19h00 for the trading floor. Which report type is required?",
        options: ["Incident report", "Compliance report", "Progress report", "Feasibility report"],
        answer: 3,
        explain: "A feasibility (investigative) report examines options against criteria such as cost, demand and risk, and recommends a course of action.",
      },
      {
        q: "Where may NEW information (not previously mentioned) never appear in a report?",
        options: [
          "In the findings",
          "In the appendices",
          "In the conclusions and recommendations",
          "In the introduction",
        ],
        answer: 2,
        explain: "Conclusions interpret findings and recommendations flow from conclusions — introducing new facts there breaks the logic chain and undermines credibility.",
      },
      {
        q: "June's first-call resolution was 71% against an SLA target of 75%. Which statement expresses this as a proper finding?",
        options: [
          "The service desk was disappointing in June.",
          "June first-call resolution of 71% was 4 percentage points below the SLA target of 75%.",
          "Service desk figures are attached for your perusal.",
          "The target was missed due to analyst attitude.",
        ],
        answer: 1,
        explain: "A finding is a factual comparison with figures. Option A is opinion, C avoids analysis, and D asserts a cause without evidence.",
      },
      {
        q: "Which chart type best shows the TREND in monthly service desk ticket volumes over 12 months?",
        options: ["Pie chart", "Line chart", "Organogram", "Scatter plot of individual tickets"],
        answer: 1,
        explain: "Line charts show movement over time. Pie charts show composition at a point in time; they cannot show a trend.",
      },
      {
        q: "What must EVERY table or figure in a report have?",
        options: [
          "A colour scheme matching the bank's branding",
          "At least ten rows of data",
          "A number, a title, a source, and a reference to it in the text",
          "A signature from the finance department",
        ],
        answer: 2,
        explain: "Numbering, titling and sourcing (e.g. 'Source: ServiceNow export, June 2026') make evidence traceable, and referring to the table in the text ties it into the argument.",
      },
      {
        q: "Which sentence is in plain, active business English?",
        options: [
          "It was decided that the VPN pilot would be discontinued by the infrastructure team.",
          "The aforementioned remote-access endeavour has been terminated forthwith.",
          "The infrastructure team ended the VPN pilot on 15 May because connection failures exceeded 8%.",
          "The VPN pilot is basically dead now.",
        ],
        answer: 2,
        explain: "It is active ('The infrastructure team ended…'), specific (date and figure), and free of jargon and slang.",
      },
      {
        q: "Why must the distribution of a confidential report be controlled?",
        options: [
          "To make the report seem more important",
          "Because POPIA, FSCA requirements and the bank's information-security policy require information to reach only its intended audience",
          "So that fewer copies need to be printed",
          "Because executive summaries are copyrighted",
        ],
        answer: 1,
        explain: "Client data, security findings and system vulnerabilities carry legal and regulatory obligations — controlled distribution through approved channels protects clients and the bank.",
      },
    ],
  },
};

export function getContent(us: string): UnitContent | undefined {
  return CONTENT[us];
}
