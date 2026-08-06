import type { UnitContent } from "../types";

/** Illustrates the water-supply analogy used in the PSU "matching" quiz question.
 * Deliberately shows ONLY the analogy side (river → treatment plant → pipes → city
 * network → buildings) so the learner can still visualise the metaphor without
 * being handed the pairing to the real PC components. */
const WATER_ANALOGY_SVG = `
<svg viewBox="0 0 960 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The water supply analogy: river, treatment plant, pipes, city network, buildings">
  <defs>
    <marker id="wa-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#1f6feb"/>
    </marker>
    <style>
      .wa-lbl { font: 600 12px system-ui, -apple-system, Segoe UI, sans-serif; fill:#0b3a7a; text-anchor:middle; }
      .wa-hd  { font: 700 12px system-ui, -apple-system, Segoe UI, sans-serif; fill:#0b3a7a; text-anchor:middle; letter-spacing:.06em; text-transform:uppercase; }
      .wa-box { fill:#eaf3ff; stroke:#8fb6ff; stroke-width:1.4; }
      .wa-arrow { stroke:#1f6feb; stroke-width:2.2; fill:none; marker-end:url(#wa-arr); }
      .wa-ico { fill:none; stroke:#0b3a7a; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .wa-fill { fill:#8fb6ff; }
    </style>
  </defs>

  <text x="480" y="22" class="wa-hd">The water supply system</text>

  <!-- 1. River -->
  <g transform="translate(20,40)">
    <rect class="wa-box" x="0" y="0" width="150" height="130" rx="10"/>
    <path class="wa-ico" d="M18 55 Q35 40 55 55 T95 55 T135 55"/>
    <path class="wa-ico" d="M18 75 Q35 60 55 75 T95 75 T135 75"/>
    <path class="wa-ico" d="M18 95 Q35 80 55 95 T95 95 T135 95"/>
    <text x="75" y="120" class="wa-lbl">River</text>
  </g>

  <!-- arrow -->
  <path class="wa-arrow" d="M175 105 h30"/>

  <!-- 2. Water treatment plant -->
  <g transform="translate(210,40)">
    <rect class="wa-box" x="0" y="0" width="150" height="130" rx="10"/>
    <rect class="wa-ico" x="20" y="60" width="110" height="40"/>
    <circle class="wa-ico" cx="45" cy="60" r="14"/>
    <circle class="wa-ico" cx="105" cy="60" r="14"/>
    <path class="wa-ico" d="M20 60h110"/>
    <path class="wa-ico" d="M75 35v25"/>
    <path class="wa-fill" d="M68 27h14l-7 -10z"/>
    <text x="75" y="120" class="wa-lbl">Treatment plant</text>
  </g>

  <!-- arrow -->
  <path class="wa-arrow" d="M365 105 h30"/>

  <!-- 3. Pipes -->
  <g transform="translate(400,40)">
    <rect class="wa-box" x="0" y="0" width="150" height="130" rx="10"/>
    <rect class="wa-ico" x="15" y="55" width="120" height="14" rx="4"/>
    <rect class="wa-ico" x="15" y="80" width="120" height="14" rx="4"/>
    <path class="wa-ico" d="M45 55v-14M105 55v-14M45 94v14M105 94v14"/>
    <text x="75" y="120" class="wa-lbl">Pipes</text>
  </g>

  <!-- arrow -->
  <path class="wa-arrow" d="M555 105 h30"/>

  <!-- 4. City water network -->
  <g transform="translate(590,40)">
    <rect class="wa-box" x="0" y="0" width="150" height="130" rx="10"/>
    <path class="wa-ico" d="M20 90h110M75 50v40M40 65v25M110 65v25M55 75h40"/>
    <circle class="wa-fill" cx="20" cy="90" r="4"/>
    <circle class="wa-fill" cx="130" cy="90" r="4"/>
    <circle class="wa-fill" cx="75" cy="50" r="4"/>
    <circle class="wa-fill" cx="40" cy="65" r="4"/>
    <circle class="wa-fill" cx="110" cy="65" r="4"/>
    <text x="75" y="120" class="wa-lbl">City water network</text>
  </g>

  <!-- arrow -->
  <path class="wa-arrow" d="M745 105 h30"/>

  <!-- 5. Buildings -->
  <g transform="translate(780,40)">
    <rect class="wa-box" x="0" y="0" width="160" height="130" rx="10"/>
    <path class="wa-ico" d="M20 100V60l20 -15 20 15V100z"/>
    <path class="wa-ico" d="M70 100V50h30V100"/>
    <path class="wa-ico" d="M115 100V70h20V100"/>
    <path class="wa-ico" d="M145 100V80h10V100"/>
    <path class="wa-ico" d="M78 60h4v6h-4zM88 60h4v6h-4zM78 73h4v6h-4zM88 73h4v6h-4z"/>
    <text x="80" y="120" class="wa-lbl">Buildings</text>
  </g>
</svg>
`;

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

  /* ================================================================
     US 10135 — Work as a project team member
     NQF 4 · 8 credits
     ================================================================ */
  "10135": {
    lesson: [
      {
        heading: "Unit Standard 10135 alignment index — what you must be proved competent in",
        icon: "target",
        paragraphs: [
          "Unit Standard 10135 — Work as a project team member — is about working effectively as part of a project team: understanding what is expected of a team member, contributing to the team's coherence and spirit, and building sound relations with fellow team members and stakeholders. In an IT systems support environment, almost everything is delivered by teams — a service desk shift, a workstation rollout, a system upgrade project — so competence in this unit standard underpins your daily work.",
          "The alignment index below maps each section of the learner manual to the outcomes you must be proved competent in. Use it to navigate the manual and to check, section by section, that you can produce the evidence required to complete the unit standard.",
        ],
        table: {
          headers: ["Competence requirements", "What this section covers", "Page"],
          rows: [
            [
              "Unit Standard 10135 alignment index",
              "Here you will find the different outcomes explained which you need to be proved competent in, in order to complete Unit Standard 10135.",
              "3",
            ],
            [
              "Demonstrate an understanding of criteria for working as a member of a team and working autonomously in a team",
              "This section covers the required understanding that team members must harbour to work effectively and autonomously as part of the team.",
              "4",
            ],
            [
              "Question Session 1",
              "Your knowledge of this section is assessed with the questions.",
              "11",
            ],
            [
              "Contribution to team coherence, image and spirit and respect differences to enhance interaction between team members",
              "This section covers the different contributions members of a team have to make to ensure that all the members are happy and compliant with the team's efforts and endeavours in reaching their goals.",
              "13",
            ],
            [
              "Question Session 2",
              "Your knowledge of this section is assessed with the questions.",
              "20",
            ],
            [
              "Contribute to building relations between team members and stakeholders",
              "This section explains the importance of relations between different members of the team and the stakeholders of an organisation / entity to ensure that the required outcome is reached.",
              "22",
            ],
            [
              "Question Session 3",
              "Your knowledge of this section is assessed with the questions.",
              "25",
            ],
            [
              "Self assessment",
              "Once you have completed all the questions after being facilitated, you need to check the progress you have made. If you feel that you are competent in the areas mentioned, you may tick the blocks; if however you feel that you require additional knowledge, you need to indicate so in the block below. Show this to your facilitator and make the necessary arrangements to assist you to become competent.",
              "27",
            ],
          ],
        },
      },
      {
        heading: "Alignment index — specific outcomes and assessment criteria (SO 1–3)",
        icon: "clipboard",
        paragraphs: [
          "Each specific outcome (SO) states what you must be able to do; its assessment criteria (AC) state the evidence an assessor looks for to prove competence. Read them before each manual section so you know exactly what you are working towards.",
        ],
        table: {
          headers: ["Ref", "Specific outcomes and related assessment criteria"],
          rows: [
            ["SO 1", "Demonstrate an understanding of criteria for working as a member of a team"],
            ["AC 1", "Criteria for working as a member of a team are identified and explained"],
            ["AC 2", "Behaviours conducive to working as a member of a team are identified and explained"],
            ["AC 3", "Team dynamics are identified and explained"],
            ["SO 2", "Work autonomously and collaborate with other team members"],
            ["AC 1", "Team members are given sufficient support for them to achieve their work / project objectives"],
            ["AC 2", "Team members are consulted with"],
            ["AC 3", "Authority levels of all team members are identified and applied"],
            ["AC 4", "Collaboration reflects the needs of all team members"],
            ["SO 3", "Contribute to building relations between team members and stakeholders"],
            ["AC 1", "The importance of building relations between team members and stakeholders is explained"],
            ["AC 2", "Stakeholders are identified and their needs explained"],
            ["AC 3", "Communications with stakeholders encourages open and frank discussions"],
            ["AC 4", "Commitments to stakeholders are honoured and met"],
          ],
        },
      },
      {
        heading: "Alignment index — specific outcomes and assessment criteria (SO 4–5)",
        icon: "clipboard",
        paragraphs: [
          "The remaining two specific outcomes focus on the interpersonal side of teamwork — the contribution you make to the team's coherence, image and spirit, and the respect you show for personal, ethical, religious and cultural differences.",
        ],
        table: {
          headers: ["Ref", "Specific outcomes and related assessment criteria"],
          rows: [
            ["SO 4", "Make a positive contribution to team coherence, image and spirit"],
            ["AC 1", "The needs and objectives of team members are identified and explained"],
            ["AC 2", "Methods and techniques for building team coherence and spirit are identified and explained"],
            ["AC 3", "Team member actions are conducive to team coherence, spirit and image"],
            ["AC 4", "Trust and support of colleagues is gained through applicable behaviours"],
            ["AC 5", "Feedback is provided which leads to constructive working relationships"],
            ["SO 5", "Respect personal, ethical, religious and cultural differences to enhance interaction between team members"],
            ["AC 1", "Differences between team members are identified and acknowledged"],
            ["AC 2", "The importance of showing respect is explained"],
            ["AC 3", "Team members are treated in ways which demonstrate respect for individuals"],
            ["AC 4", "Behaviours, which are of concern to individuals, are discussed promptly and openly with those concerned"],
          ],
        },
      },
      {
        heading: "Demonstrate an understanding of criteria for working as a member of a team & Working Autonomously",
        icon: "target",
        flat: true,
        paragraphs: ["Time: 90 minutes · Activity: Self & Group"],
      },
      {
        heading: "How to be an effective team member",
        icon: "people",
        paragraphs: [
          "Working on teams can be rewarding, but at times it can be difficult and downright frustrating. If there are poor communicators on your team, you may often feel left in the dark, confused or misunderstood. To create a successful team, effective communication methods are necessary for both team members and leaders. Even though some people understand their communication skills need improving, many aren't certain how to improve them. So, in the following article, we've outlined how to avoid some common team blunders as well as some helpful advice on how to be a better team-mate or leader overall. Go… team!",
        ],
      },
      {
        heading: "If You are a Team Member",
        icon: "checklist",
        paragraphs: [],
        bullets: [
          "Communicate, Communicate, Communicate — If you have a problem with someone in your group, talk to him about it. Letting bad feelings brew will only make you sour and want to isolate yourself from the group. Not only does it feel good to get it out, but it will be better for the team in the long run.",
          "Don't Blame Others — People in your group lose respect for you if you're constantly blaming others for not meeting deadlines. You're not fooling anyone; people know who isn't pulling his weight in a group. Pointing the finger will only make you look cowardly. Group members understand if you have a heavy workload and weren't able to meet a deadline. Saying something like, \"I'm really sorry, but I'll get it to you by the end of today.\" will earn you a lot more respect than trying to make it seem like it's everyone else's fault that you missed your deadline.",
          "Support Group Member's Ideas — If a team mate suggests something, always consider it – even if it's the silliest idea you've ever heard! Considering the group's ideas shows you're interested in other people's ideas, not just your own. And this makes you a good team member. After all, nobody likes a know-it-all.",
          "No Bragging — It's one thing to rejoice in your successes with the group, but don't act like a superstar. Doing this will make others regret your personal successes and may create tension within the group. You don't have to brag to let people know you've done a good job, people will already know. Have faith that people will recognize when good work is being done and that they'll let you know how well you're doing. Your response? Something like \"Thanks, that means a lot.\" is enough.",
          "Listen Actively — Look at the person who's speaking to you, nod, ask probing questions and acknowledge what's said by paraphrasing points that have been made. If you're unclear about something that's been said, ask for more information to clear up any confusion before moving on. Effective communication is a vital part of any team, so the value of good listening skills shouldn't be underestimated.",
          "Get Involved — Share suggestions, ideas, solutions and proposals with your team members. Take the time to help your fellow team mates, no matter the request. You can guarantee there will be a time in the future when you'll need some help or advice. And if you've helped them in past, they'll be more than happy to lend a helping hand.",
        ],
      },
      {
        heading: "The Modern Workplace",
        icon: "briefcase",
        paragraphs: [
          "No matter what profession you choose, more than likely, you will be asked to contribute to a team. Teams are found in many modern workplace environments in fields ranging from engineering and health care to journalism and foreign policy.",
          "More than ever employers are looking for ways to combine individual talents and harness the synergy of a high performance team. Some of the specific benefits include:",
        ],
        bullets: [
          "Complete large-scale projects — Many projects in the workplace are too large or too complex for one individual to complete alone. Imagine trying to build an enormous project all by yourself!",
          "Develop More Solutions — Different people looking at the same problem will find different solutions. A team can review ideas and put together a final solution which incorporates the best individual ideas.",
          "Detect Flaws — A team looking at different proposed solutions may also find pitfalls that an individual might miss. The final solution is that much stronger.",
          "Build Social Connections — Working on a team allows you to interact with your colleagues much more than sitting in neighbouring cubicles - or lecture seats - would.",
        ],
      },
      {
        heading: "Roles in General",
        icon: "clipboard",
        paragraphs: [
          "What roles are available will depend much on the project and the wishes of your instructor. For instance, if the project is to create a Web site, your instructor may ask your team to have a leader/editor, a writer, a graphic artist and a Webmaster/HTML specialist.",
          "If your instructor does not give any guidance, the team is free to organise itself as it chooses, but it is important that:",
        ],
        bullets: [
          "Everyone agrees on appropriate roles — This may take some negotiation to decide.",
          "Everyone is satisfied in their roles — Individuals must feel a sense of satisfaction in order for the team to function. Fortunately, teams will typically have people with different temperaments and skills who will want different roles. In addition, your team may want to rotate roles throughout the semester.",
        ],
      },
      {
        heading: "Flexibility",
        icon: "layers",
        paragraphs: [
          "Whatever role you may have, it is still important that the entire team provide input on every facet of the project. For instance, if you were a \"writer\", it is perfectly acceptable for a \"graphic artist\" to evaluate and comment on your work. He or she may provide a unique perspective that will enhance your work. The same would be true for the \"graphic artist\" or any other member of the team.",
        ],
      },
      {
        heading: "The Leader",
        icon: "person",
        paragraphs: [
          "Most teams will have a leader, and this is a very important position because he or she is responsible for the management of the entire project. However, it is important not to have too \"heavy\" a hand, or team morale may be lowered. A leader is typically responsible for setting a base agenda, facilitating meetings, and monitoring progress with communicating with members as needed. But all actions must be agreed to by the team. Although you may suggest a course of action, you must be sure the team agrees to it. If the team wants to go in another direction, you should be willing to compromise.",
        ],
      },
      {
        heading: "Other Roles",
        icon: "people",
        paragraphs: [
          "If your team is looking for a way to organize, these are some other roles that can be used, especially when formulating and testing ideas. Again, it suggested that you be flexible with these roles. Teams can rotate them or combine them in one person, for instance, a recorder/summarizer.",
        ],
        bullets: [
          "Initiator — Someone who suggests new ideas. One or more people can have this role at a time.",
          "Recorder — This person records whatever ideas a team member may have. It is important that this person quote a team member accurately and not \"edit\" or evaluate them.",
          "Devil's Advocate/Skeptic — This is someone whose responsibility is to look for potential flaws in an idea.",
          "Optimist — This is someone who tries to maintain a positive frame of mind and facilitates the search for solutions.",
          "Timekeeper — Someone who tracks time spent on each portion of the meeting.",
          "Gate Keeper — This person works to ensure that each member gives input on an issue. One strategy to do this is to ask everyone to voice their opinion one at a time. Another is to cast votes.",
          "Summarizer — Someone who summarizes a list of options.",
        ],
      },
      {
        heading: "Listening and Critiquing",
        icon: "chat",
        paragraphs: [],
        bullets: [
          "Active Listening — Communication is a two-way street, so it is important that you listen carefully to your team mates when they are speaking. Don't tune speakers out or get caught in the trap of planning ahead to what you want to say next. You may miss an important detail, and in the worst case, you repeat the detail you missed because you were not listening.",
          "Ask Questions — If you hear something that confuses you, you should ask about it. Maybe you missed a detail or maybe you remembered something others forgot. In any case, it's important that everyone understand exactly what's going on. Chances are that if you're confused, then others are too. Conversely, if a team member asks you a question, you should answer it courteously. The team member may be bringing up a crucial detail that could make or break the team's plans.",
          "Constructive Feedback — Although it is important to evaluate proposed ideas and suggestions, critiques need to be presented with tact. Some tips that may help:",
          "Don't express an opinion as a fact — You may hate orange text on green, but that is an opinion unless you can cite a legitimate reason for your concern (such as that this colour combination may be harder to read).",
          "Explain your reasons — If you do have a strong opinion, explain why you feel that way. This will allow others to evaluate your comments more effectively.",
          "Restate the original idea — To be sure you have correctly understood someone else's idea before you respond to it.",
          "Compliment another's idea — Even if you do not think it would work, some part of it may be valid and could be usable in another form.",
          "Respond, don't react — If you feel like you're ready to explode, give yourself a few seconds before speaking.",
          "Don't interrupt",
          "Critique the idea, not the person",
          "Be courteous",
          "Avoid jargon",
          "Chat a Little — A meeting does not have to be 100% business. It is perfectly fine to ask team members how they are doing or what they are planning next weekend. This can really help ease tension when disagreements occur later. Of course, you should not socialize for the entire meeting.",
        ],
      },
      {
        heading: "Presenting Ideas",
        icon: "presenter",
        paragraphs: ["These tips also work if you are presenting an idea."],
        bullets: [
          "Body Language Awareness — If you are having a bad day or are feeling unhappy with the team project, you could be giving off negative signals with body language or a harsh tone. Even if you are saying the right thing, team members may still react negatively if you send the wrong body language signals. If you are feeling tense before going into a meeting, try taking a deep breath to relax.",
          "Humour — While you would not want to make fun of your team mates or tell jokes that may offend others, there are plenty of topics that your team mates may find humorous - some of them may even be project related.",
          "Patience — You may have the best idea, but not everyone may understand it the first time. The same question may be asked more than once. A member may forget a deadline unless reminded. Disagreements may occur over small details. Or conversely, team members may decide an issue too hastily, and may have to backtrack later. But, in most cases, it will all work out.",
        ],
      },
      {
        heading: "Conflict in the Team — I. Conflict Happens",
        icon: "info",
        paragraphs: ["Most members of a team have to learn two fundamentals:"],
        bullets: [
          "Having different opinions is one of the essential benefits of teamwork.",
          "Team members have strong feelings and emotions. A team cannot achieve its full potential if all that is allowed is logic or information.",
        ],
      },
      {
        heading: "II. Clarify Expectations",
        icon: "checklist",
        paragraphs: [
          "Fortunately, it is possible to take steps to minimize disagreement and conflict and to resolve those disagreements that may be dangerously escalating.",
          "Stating expectations clearly will give the team a common ground to begin any discussion. Some ways to clarifying expectations include:",
        ],
        bullets: [
          "Developing a clear statement of team mission or purpose",
          "Ground rules governing participation, sharing of responsibilities",
          "Agreement to depersonalize conflicts",
          "Team recognition that team process, including discussion and brainstorming, is important to results and needs regular attention",
          "Use of structured processes for problem solving and conflict resolution",
          "Awareness of stages of project development and maintenance priorities of each stage",
          "Clearly and appropriately defined individual responsibilities for real work for each other; clear linkage between individual responsibilities and the team mission",
          "Clearly defined project standards and time lines",
        ],
      },
      {
        heading: "III. Identify the Type of Team Conflict",
        icon: "search",
        paragraphs: [
          "If conflict escalates, the following tips may help the team resolve disagreements in a step-by-step manner.",
        ],
        bullets: [
          "Internal conflict — An individual or team member is experiencing a personal conflict that may or may not be related to the team, but which is interfering with the person's ability to perform.",
          "Individual conflict with one other team member — One team member is in conflict with another",
          "Individual conflict with the entire team — One team member is experiencing conflict with the entire team",
          "Conflict between several team members — The entire team is experiencing conflict with several other team members",
          "Team conflict with one person outside of the team (such as a faculty member responsible for content)",
        ],
      },
      {
        heading: "IV. Identify Team Needs",
        icon: "target",
        paragraphs: ["Define the team's problem as a shared need. As a group:"],
        bullets: [
          "Identify the causes.",
          "Determine the criteria for a solution.",
          "Generate options.",
          "Determine possible solutions.",
          "Develop implementation plans.",
          "Review results later on a regular basis.",
        ],
      },
      {
        heading: "V. Depersonalize Team-Internal Conflict",
        icon: "chat",
        paragraphs: [
          "At this step, it is especially critical that every member of the team provide his or her view.",
          "During the problem-solving phase focus on issues not personalities. These guidelines help depersonalize conflicts.",
        ],
        bullets: [
          "Encourage each side to objectively explain his or her bottom line requirements. When the team is determining a solution, each person's criteria should be evaluated.",
          "Remind the team of ground rules while generating options such as \"no criticizing statements by other people until all ideas are posted.\"",
          "Encourage everyone to listen to other points of view.",
          "During the process keep encouraging points of agreement.",
          "Don't stifle new anger, but also don't dwell on it.",
        ],
      },
      {
        heading: "Another set of steps to consider as a team",
        icon: "checklist",
        paragraphs: [],
        bullets: [
          "Acknowledge that the conflict exists.",
          "Gain common ground.",
          "Seek to understand all angles.",
          "Attack the issue not each other.",
          "Develop an action plan.",
        ],
      },
      {
        heading: "VI. Structuring Discussion",
        icon: "clipboard",
        paragraphs: ["Here is a structured way to handle conflicts:"],
        bullets: [
          "Let each person state his or her view briefly.",
          "Have neutral team members reflect on areas of agreement or disagreement.",
          "Explore areas of disagreement for specific issues.",
          "Have opponents suggest modifications to their own points of view as well as others.",
          "If consensus is blocked, ask opponents if they can accept the team's decision.",
        ],
      },
      {
        heading: "VII. Key Questions that can help teams work through conflict",
        icon: "search",
        paragraphs: [],
        bullets: [
          "What are we supposed to accomplish as a team?",
          "What are each of our roles and responsibilities in accomplishing that goal?",
          "Who and when do each of us need to get information from?",
          "If we get into trouble, whom can we ask for help?",
          "What strengths do each of us bring in accomplishing our goals?",
          "How are we going to make ourselves more accessible to one another?",
          "How can we express differences without blaming others?",
          "Which behaviours are unproductive? How can we help individuals take ownership of their unproductive behaviour? Don't excuse a team member when he or she behaves badly.",
        ],
      },
      {
        heading: "Contribution to team coherence, image and spirit and Respect differences to enhance interaction between team members",
        icon: "award",
        flat: true,
        paragraphs: ["Time: 90 minutes · Activity: Self & Group"],
      },
      {
        heading: "What is \"Unproductive Behavior\"? — Clearly Unproductive",
        icon: "bell",
        paragraphs: [
          "Some behaviors are clearly detrimental to the functioning of the team. These include:",
        ],
        bullets: [
          "Consistently missing meetings",
          "Consistently missing deadlines",
          "Never coming prepared to meetings",
          "Not answering e-mail or messages in a reasonable time",
          "Discourteous or disrespectful language",
        ],
      },
      {
        heading: "When Excessive \"Team Behavior\" is Unproductive",
        icon: "trend",
        paragraphs: [
          "Other behaviors may be acceptable and even beneficial in moderation, but in an extreme form, can be disruptive to the team. For example:",
        ],
        table: {
          headers: ["Normal/Productive", "Extreme/Unproductive"],
          rows: [
            ["Raising a Concern", "Nitpicking - Questioning or objecting to every possible detail on the project"],
            ["Asking Questions", "Missing Details - Constantly asking questions because you were not paying attention the first time"],
            ["Ownership/Responsibility", "Possessiveness - Refusal to allow anyone to alter or critique the work you have done for the project"],
            ["Principled", "Uncompromising - Never accepting any proposed compromises"],
            ["Listening & Reflecting", "Lurking - Never contributing in team meetings or other communications"],
            ["Staying in Touch", "Nudging - Always sending reminders and not allowing members a reasonable interval before responding before sending out more notes"],
            ["Follows Procedure", "Inflexible - Not allowing for changes in a plan or agenda"],
            ["On top of things", "Doing Everything - Not allowing other members to make contributions"],
          ],
        },
      },
      {
        heading: "What to do?",
        icon: "wrench",
        paragraphs: [
          "Generally, it is best to make a significant effort to resolve problems within the team before contacting the instructor.",
          "If one or more people are showing unproductive behavior, try these steps:",
        ],
        bullets: [
          "First, the team should decide if the behavior in question is really unproductive or just a part of the team process. Does the behavior?",
          "Interfere with the team's ability to complete project work?",
          "Interfere with the team's ability to reach true consensus?",
          "Significantly interfere with team morale? Morale may not be perfect all the time, but people should be able to work together.",
          "Make sure a specific behavior has been identified as unproductive. The problem is with the behavior not with the person.",
          "When discussing the behavior with a person, try to frame the issue as: \"I/We feel (frustrated/concerned) when you (fill in behavior) because it (explain how it affects the team).\"",
          "When appropriate, acknowledge that the person may be acting with the best of intentions.",
          "Allow the person to express his or her side of the issue, but make sure he or she understands why the team is concerned.",
          "If necessary, attempt to reach a compromise so that both the individual and the person are satisfied.",
          "In some cases, a team member may be \"missing in action.\" If that person has not responded to the team's repeated attempts to get in touch or never appears to meet with the team, it may be best to inform the instructor. The team and the instructor can work on a solution agreeable to the team",
        ],
      },
      {
        heading: "Definition",
        icon: "book",
        paragraphs: [
          "Actively participating as a member of a team to move the team/work unit toward the completion of goals.",
        ],
        table: {
          headers: ["Ways to Demonstrate this Skill", "Development Activities"],
          rows: [
            [
              "Actively help the team or work unit accomplish its goals. · Ask what are the team's specific goals and objectives. If there are none, work with other team members to create some. Do all you can to ensure they are measurable. · Find out what are the team's milestones, dates and check-in times to make sure the team can track progress toward goals. If there are none, work with other team members to create them. · Find out what are the roles and responsibilities of the team members. If there are none, work with other team members to define these. · Suggest procedures or processes for achieving team goals. Help the team obtain resources as necessary. · Where possible, help clear away obstacles to the team's accomplishments.",
              "Find a respected colleague or friend that you see as a good team player and ask them to mentor and advise you as you develop these skills in yourself. · Treat your work unit as a team and try out some of the team behaviours described here with them. Discuss your experiences with the mentor you identified, above. · If your team or work unit runs into organizational or other obstacles, look for ways to help the team get around the obstacles yourselves. Help your team-mates brainstorm sources, contacts, and approaches. · Ask managers or senior staff to help you and other team members build a \"business case\" for requesting any resources that the team needs but is finding it hard to get.",
            ],
            [
              "Involve others and keep them informed. · In team decisions and actions, actively seek the input of quiet team members, and ask what would make it easier for them to participate. · Listen to others respectfully and fully. Recognize and use the differences and talents of others. · Share information with everyone on the team.",
              "Together with your team, make a list of decisions and actions the team must make in the next couple of months. Pick three or four of the most important ones. · For each, list the stakeholders – people who will in some way be affected by the decision (their support will be needed, their work will be impacted, etc.). Work with the team to identify ways to involve these stakeholders. · Use the behaviours described in the next column to keep everyone interested and involved.",
            ],
            [
              "Model commitment. · Energetically and publicly pursue the team's goals, and adhere to the team's defined roles, responsibilities, and processes. · Demonstrate enthusiasm and commitment for the team's projects and initiatives as a way of motivating yourself and others. Choose to have a can-do attitude; approach challenges with optimism and energy.",
              "If you disagree with something the team is doing, raise your objection with the team. When you are in public, speak out in support of the team's initiatives and decisions. · When your team or work unit encounters problems or setbacks, work at responding with energy, interest, and enthusiasm for finding a way to solve the problem. · Avoid revisiting past history of problems, except to look for data that will help the team solve the current one.",
            ],
          ],
        },
      },
      {
        heading: "Individual Needs Vs Team Needs",
        icon: "people",
        paragraphs: [
          "Besides differing in degrees of teaming instinct, people on teams differ in terms of personal agendas.",
          "We make a big deal out of team objectives. Team objectives are supposed to be these powerful visions that unite teams and drive them on irresistibly to success. But guess what, in teaming physics, the team objective is decidedly the weak force. The strong force remains the collection of personal wishes and wants that team members bring to the team.",
          "Just because we are attracted to teaming up, as described in the previous chapter, doesn't mean we set our other desires on the shelf. We don't know about you, but we'll be unintelligent if we'll forsake our personal dreams for the sake of some lousy workgroup. So a conflict exists between individual team members' goals and the overarching goal of the team itself.",
          "And it can play out very painfully. Imagine a team of four, with the acknowledged goal of creating an e-commerce site for a conventional business. The goal is simple; reengineer a local business to cyberspace. Sounds workable... but the four people aren't stick figures — each has an agenda that is subtly pulling the team apart.",
        ],
        cards: [
          {
            icon: "chip",
            title: "Doug — Freelance programmer",
            text: "Has a program from a previous job he thinks is perfect with a few tweaks. Wants to finish and move on to the next gig — frankly, he needs the money. His team-mates won't give him the go-ahead.",
          },
          {
            icon: "design",
            title: "Sarah — In-house graphic designer",
            text: "Usually a good sport, cheerfully redoing work on request. But Sarah has a secret: she's expecting a baby in seven months. Her mind is on that baby, and the project just doesn't do much for her. Her best design so far is a garden page featuring characters from Peter Rabbit.",
          },
          {
            icon: "presenter",
            title: "Miller — Catalogue consultant",
            text: "Thinks he's God's gift to catalogue consulting and shows up daily with a new plan, a major overhaul, a fresh vision. He's driving everyone crazy. Unknown to the others, he is a recovering alcoholic going through a manic period — having the time of his life just as others are easing out of theirs.",
          },
          {
            icon: "briefcase",
            title: "John — Old-guard sales engineer",
            text: "Extrovert, helped start the company years ago. Has reservations about the whole Internet thing — he read a year ago that no one makes money there and that was his last fresh insight. Secretly resents the talented, uncommitted youngsters around him, and lapses into frequent lectures on selling garden supplies off the back of a truck.",
          },
        ],
        example: {
          title: "The quiet cost of unaddressed agendas",
          lines: [
            "Four decent, talented people. Nothing major against one another. No opposition to teamwork.",
            "But numerous conflicts between individual goals and the team goal — and these conflicts will only build in significance.",
            "They probably won't blow up, go ballistic or meltdown into a headline dysfunctional team.",
            "But they'll never gel as a team, they won't meet their goal in a timely fashion, and the website will be a joke — because the team goals were deep-sixed by a raft of unfulfilled personal goals.",
            "Not for lack of good intentions. But their good intentions, taken together, are a feeble force compared to their individual, unaddressed needs.",
          ],
        },
      },
      {
        heading: "Rebalancing the load",
        icon: "layers",
        paragraphs: [
          "Effective teamwork is a continual balancing act between meeting team needs and meeting individual needs. And we don't just mean the basic human need for survival through affiliation. We mean all the private wants each of us carry — things that have nothing to do with teams or jobs.",
          "While it's nice to be around other folks and work with them, we are all of us, still, looking out for number one. Forget the movie scenes of the scrappy doughboy jumping on a live grenade to save his buddies. In real life we take action with others primarily to satisfy our personal agendas — people will only agree to team up if it meets their own needs first.",
        ],
        cards: [
          {
            icon: "person",
            title: "Me first",
            text: "The default setting. I show up for the team when the team shows up for me. Ignore this and commitment quietly evaporates.",
          },
          {
            icon: "people",
            title: "Please consider my needs",
            text: "A softer version, and probably the most common. \"I'll pull my weight — just don't pretend I don't have a life outside this project.\"",
          },
          {
            icon: "clock",
            title: "Deferred gratification",
            text: "A rarer breed: happy to forestall today's druthers in exchange for team payback tomorrow. Useful people to have around — just don't assume everyone works this way.",
          },
        ],
        example: {
          title: "Bottom line",
          lines: [
            "People will only agree to team if it meets their own needs first.",
            "So plan for the balancing act — team goals + private goals — instead of pretending it isn't happening.",
          ],
        },
      },
      {
        heading: "Find the agenda",
        icon: "search",
        paragraphs: [
          "\"Good soldiers\" are sometimes not soldiers at all. Teams must be leery of members who have no honest intention to be working members of the team. In their hearts, they are saying:",
          "\"I'm not here to work with the team, but to take credit for its successes.\"",
          "\"I'm not here to work with the team, but to associate with some of its members.\"",
          "\"I'm not here to work with the team, but to use it as a steppingstone to better things.\"",
          "The term \"hidden agenda\" was coined to describe this kind of covert careerism. It is not honest and it is very destructive to team coherence. Good teams recognise the fact that in order to build trust, they must uncover their own hidden agendas and expose them to the light of day.",
          "In our hypothetical team, everyone has to put their agendas on the table for the others to examine. Sarah, Miller, John need to be apprised of Doug's frustration. Chances are they will empathize with his need to finish up and move on, and move more quickly. Perhaps, with their empathy under his belt, Doug will relax a bit and let the project find its own rhythm. Even if Sarah does not tell Doug, Miller, and John about her pregnancy, she needs to communicate to them that something is cooking that is pulling her from the work. It's possible that she isn't the best person for the team, and may have to be replaced. Hey, it happens. Miller needs to be told that he's making people crazy. It doesn't have to be cruel. Telling Miller why others are ambivalent about the project should engage him, and modulate his excesses. It wouldn't hurt for them to learn why he's so excited, either; it's much bigger than a love of catalogue sales.",
          "And John, poor John needs to open up and respect his team-mates more. He's so connected to the company of ten years ago that it prevents him from being her now in a useful way. He should tell his story, but then he should shut up. One lesson of teaming is that one is never too old to grow up. Only by processing through each team member's wishes and wants, and at the very minimum acknowledging their validity, can the group redirect its focus; which has suddenly grown more intense, and deep with knowledge, at the team goal. And make the best gardening supplies website the world ever saw.",
          "Who is to say that the team mission is the only mission that a team can acknowledge and pursue? Deep down, most of us are not especially good soldiers, and we do not long to subordinate our own desires to the common good. To the contrary: sacrifice, loyalty, and the willingness to go through a little effort for one another occur only when cards are on the table, and people are allowed (and required) to be honest about their needs. Personal goals that prevent us from achieving team goals are often very honourable:",
          "Having a baby",
          "Spending more time with family",
          "Seeking a better job after this one",
          "Going back to school and getting that degree",
          "Or they can be a shade less edifying:",
          "Making a name for oneself",
          "Joining a team that is clearly funded",
          "Wanting to belong to a team of \"winners\" for a change",
          "Wanting a group that one can dominate",
          "Glomming onto a team that has already achieved successes",
          "Hiding behind a powerful executive's support and championship",
          "Whatever the personal goals, we need to know what they are, and to deal with them, or at least acknowledge them, as a team, perhaps even to make them corollary team goals. When we know our fellow team members want us to achieve what we ourselves want that is a terrific bond between members.",
          "The sooner we know one another's personal needs and hopes, the better for the team. This doesn't mean these personal needs have to be completely met first before true teaming can get underway. It does mean that acknowledging and addressing these needs as a group, early on, can help prevent our \"selfish\" desires from sinking the team effort.",
        ],
      },
      {
        heading: "Ethics",
        icon: "shield",
        paragraphs: [
          "Everyone deals with stuff differently. Some detach themselves from the asset so they don't care about it or they attach themselves too much so they feel like the rightful owners. In the first situation, learning to care about company stuff is accomplished through thoughtful consideration. Who paid for this and how would I feel about writing the check that pays for it? What are the boundaries for appropriate use? This is an attitude that doesn't necessarily change from work to home. An ethical person doesn't put a dollar amount on respecting the property of others. He or she always makes a moral connection between property, ownership, and responsibility.",
          "In the second case, becoming too attached or familiar with company property creates a problem as well. If you use something every day, you may become desensitized to its appropriate professional use. Do you balance company financial accounts like your own? Do you find yourself hitting the computer or kicking the copier (even if it deserves it)? Do you treat records and private information in a casual manner? It might be time to take a more serious approach to company property.",
          "Beware of \"messing with the money or the stuff\" because ethical situations involving company assets, no matter how small are rarely smoothed over with an apology. There's always a smoking gun that does not leave grey areas for rationalization or explanation. Most industries deal with asset abuse or misuse with disciplinary action or termination on the first offence. Again, business ethics boils down to the day-to-day choices you make no matter who you are or what responsibilities you have. From the minute you step from the parking lot into your workplace, see the things around you in proper context.",
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: "Questioning — Demonstrate an understanding of criteria for working as a member of a team & Working Autonomously",
        task: "Time: 45 minutes · Activity: Self & Group",
        scenario: [
          "Your brief — You all work for Investec, on the IT systems support team at the Sandton office. Next month 40 new graduate analysts start, and your team must plan how their workstations, user accounts and first-week IT support will be delivered — without disrupting the business. Working as one project team, you must design the delivery plan, and in doing so practise everything this session teaches about working as a member of a team and working autonomously.",
          "Groups — The class of twelve splits into three project teams of four. Each team works independently on its own plan; at the end the three plans are compared, and feedback is taken from the groups.",
          "Step 1 — Form the team and agree the roles. Everyone must agree on appropriate roles and everyone must be satisfied in their role: a leader who sets the base agenda, facilitates the discussion and monitors progress, plus supporting roles from the lesson — initiator, recorder, devil's advocate/skeptic, optimist, timekeeper, gate keeper and summarizer. Because there are only four of you and eight roles, some members must take on two roles (for example recorder/summarizer or timekeeper/gate keeper) — agree the combinations together.",
          "Step 2 — Clarify expectations before you start: agree a clear statement of your team's mission, ground rules for participation, each member's responsibilities, and the time line for the task.",
          "Step 3 — Brainstorm the delivery plan for Investec — for example the workstation build and imaging schedule, account and access requests, a floor-walker roster for the analysts' first week, a mini service desk for their questions, and how the plan will be communicated to the business. Every member gives input, the gate keeper makes sure quiet members are heard, and everyone listens actively and asks questions.",
          "Step 4 — Critique each other's ideas the right way: don't express an opinion as a fact, explain your reasons, restate the original idea before responding, compliment what is usable, respond — don't react, don't interrupt, critique the idea and not the person, be courteous, and avoid jargon.",
          "Step 5 — Divide the plan so each member delivers one part autonomously: state what you will do on your own authority, when you will consult the team, and how you will report progress and support the others so the whole plan succeeds.",
          "Step 6 — If the team disagrees, handle it the way the lesson teaches: let each person state their view briefly, focus on the issues and not personalities, seek common ground, and develop an action plan.",
          "Step 7 — The recorder documents the final plan and the summarizer presents it to the class. Afterwards, answer the questions below using what you experienced in the exercise.",
        ],
        idealAnswer: [
          {
            heading: "Ideal team set-up (Steps 1–2)",
            bullets: [
              "Member 1 — Leader + gate keeper: sets the base agenda, facilitates the discussion, monitors progress and makes sure every member gives input (asking quiet members to voice their opinion one at a time).",
              "Member 2 — Initiator + optimist: suggests new ideas and keeps a positive frame of mind, facilitating the search for solutions.",
              "Member 3 — Recorder + summarizer: records ideas accurately without editing or evaluating them, and summarises the list of options for decisions.",
              "Member 4 — Devil's advocate/skeptic + timekeeper: looks for potential flaws in each idea and tracks the time spent on each part of the 45 minutes.",
              "Mission statement: \"Deliver a working, supported IT environment for Investec's 40 new graduate analysts from day one — without disrupting the business.\"",
              "Ground rules: everyone speaks on every decision; no criticising statements until all ideas are posted; the team's decisions are agreed by all; the task is time-boxed to 45 minutes.",
            ],
          },
          {
            heading: "Ideal delivery plan (Step 3)",
            bullets: [
              "Workstations — build and image all 40 workstations during the week before start date (10 per day plus 4 spares), test a sample of each batch, and deliver to desks over the weekend.",
              "Accounts and access — submit a bulk user-account and access request up front with line-manager approvals, applying least-privilege; verify every sign-in works before day one.",
              "First-week support — a floor-walker roster with two members on the analysts' floor every morning of week one, and a mini service desk queue dedicated to graduate questions with a one-page FAQ handout.",
              "Communication — the plan, timeline and support contacts are shared with the business unit heads, building security and the analysts themselves before day one.",
              "Control — a daily 15-minute team stand-up during week one to report progress, surface problems early and rebalance the workload.",
            ],
          },
          {
            heading: "Working autonomously (Step 5)",
            bullets: [
              "Each member owns one workstream — imaging, accounts and access, floor-walking and the mini desk, or communication and scheduling.",
              "Own authority: executing the agreed tasks inside your workstream (building machines, logging the access requests, walking the floor).",
              "Consult first: anything that touches another member's workstream, changes the agreed plan, or affects production systems.",
              "Report without being chased: progress is reported at the daily stand-up so the team's picture stays accurate and members can support each other.",
            ],
          },
          {
            heading: "Handling disagreement (Step 6)",
            paragraphs: [
              "Example: two members disagree on imaging 10 machines a day versus all 40 in one day. Each states their view briefly; the team focuses on the issue (risk of a bad image spreading to all 40) and not personalities; common ground is found (both want day-one readiness); the action plan is a staged schedule with batch testing — recorded by the recorder with the reasons.",
            ],
          },
          {
            heading: "Why this is competent",
            bullets: [
              "Roles were agreed by everyone and every member is satisfied in their role — with combinations negotiated openly because four members carry eight roles.",
              "Expectations were clarified: mission, ground rules, responsibilities and time line.",
              "All members were consulted — the gate keeper drew in quiet members, and ideas were critiqued, not people.",
              "Authority levels were identified and applied: each member knows what they decide alone, what needs consultation and what must be escalated.",
              "The collaboration reflects the needs of all members: workload balanced across workstreams, progress shared daily, and support given so every part of the plan succeeds.",
            ],
          },
        ],
        steps: [
          "Identify and explain the criteria for working effectively as a member of a team",
          "Identify and explain behaviours conducive to working as a member of a team",
          "Identify and explain what the team dynamics are",
          "Explain how you will ensure that team members are given sufficient support for them to achieve their work / project objectives",
          "Explain how you will ensure that all the team members are consulted with",
          "Identify and explain the authority levels of all team members",
          "Explain how you will ensure tat these authority levels are applied",
          "Explain how you will ensure that collaboration reflects the needs of all team members",
        ],
        checks: [
          {
            answer: [
              "Communicate, Communicate, Communicate — If you have a problem with someone in your group, talk to him about it. Letting bad feelings brew will only make you sour and want to isolate yourself from the group.",
              "Don't Blame Others — People in your group lose respect for you if you're constantly blaming others for not meeting deadlines.",
              "Support Group Member's Ideas — If a team mate suggests something, always consider it. Considering the group's ideas shows you're interested in other people's ideas, not just your own.",
              "No Bragging — It's one thing to rejoice in your successes with the group, but don't act like a superstar.",
              "Listen Actively — Look at the person who's speaking to you, nod, ask probing questions and acknowledge what's said by paraphrasing points that have been made.",
              "Get Involved — Share suggestions, ideas, solutions and proposals with your team members. Take the time to help your fellow team mates, no matter the request.",
            ],
            concepts: [
              ["communicate", "communication", "talk", "speak"],
              ["blame", "blaming", "finger"],
              ["support ideas", "consider ideas", "support", "ideas"],
              ["brag", "bragging", "superstar", "boast"],
              ["listen", "listening"],
              ["involved", "involve", "help", "share"],
            ],
            labels: [
              "Communicate about problems",
              "Don't blame others",
              "Support group members' ideas",
              "No bragging",
              "Listen actively",
              "Get involved and help",
            ],
            min: 3,
          },
          {
            answer: [
              "Active Listening — listen carefully to your team mates when they are speaking; don't tune speakers out.",
              "Ask Questions — if you hear something that confuses you, ask about it; if a team member asks you a question, answer it courteously.",
              "Constructive Feedback — critique the idea, not the person; be courteous; don't interrupt; explain your reasons; respond, don't react; avoid jargon.",
              "Chat a Little — a meeting does not have to be 100% business; this can really help ease tension when disagreements occur later.",
              "Body Language Awareness — even if you are saying the right thing, team members may react negatively if you send the wrong body language signals.",
              "Humour and Patience — not everyone may understand your idea the first time; the same question may be asked more than once.",
            ],
            concepts: [
              ["listen", "listening"],
              ["question", "questions", "ask"],
              ["feedback", "critique", "criticize", "criticise"],
              ["courteous", "polite", "respect"],
              ["patience", "patient"],
              ["body language", "humour", "humor", "chat"],
            ],
            labels: [
              "Active listening",
              "Asking and answering questions",
              "Constructive feedback",
              "Courtesy and respect",
              "Patience",
              "Body language, humour and friendly chat",
            ],
            min: 3,
          },
          {
            answer: [
              "Having different opinions is one of the essential benefits of teamwork.",
              "Team members have strong feelings and emotions — a team cannot achieve its full potential if all that is allowed is logic or information.",
              "Teams organise around roles — a leader who sets a base agenda, facilitates meetings and monitors progress, and other roles such as the initiator, recorder, devil's advocate/skeptic, optimist, timekeeper, gate keeper and summarizer.",
              "Conflict happens — it is possible to take steps to minimize disagreement and conflict and to resolve those disagreements that may be dangerously escalating.",
            ],
            concepts: [
              ["opinions", "different opinions", "disagree"],
              ["feelings", "emotions", "emotion"],
              ["roles", "leader", "role"],
              ["conflict", "disagreement"],
            ],
            labels: [
              "Different opinions benefit the team",
              "Strong feelings and emotions",
              "Team roles (leader and others)",
              "Conflict happens and can be managed",
            ],
            min: 2,
          },
          {
            answer: [
              "Actively help the team or work unit accomplish its goals.",
              "Ask what are the team's specific goals and objectives; find out the team's milestones, dates and check-in times so the team can track progress toward goals.",
              "Suggest procedures or processes for achieving team goals. Help the team obtain resources as necessary.",
              "Where possible, help clear away obstacles to the team's accomplishments.",
              "Take the time to help your fellow team mates, no matter the request.",
            ],
            concepts: [
              ["help", "assist", "support"],
              ["goals", "objectives", "goal"],
              ["resources", "obstacles"],
              ["milestones", "progress", "track"],
              ["suggest", "procedures", "share"],
            ],
            labels: [
              "Actively help the team",
              "Know the team's goals and objectives",
              "Resources and clearing obstacles",
              "Milestones and tracking progress",
              "Suggest procedures and share",
            ],
            min: 3,
          },
          {
            answer: [
              "Involve others and keep them informed.",
              "In team decisions and actions, actively seek the input of quiet team members, and ask what would make it easier for them to participate.",
              "Listen to others respectfully and fully. Recognize and use the differences and talents of others.",
              "Share information with everyone on the team.",
              "Ensure that each member gives input on an issue — ask everyone to voice their opinion one at a time, or cast votes.",
            ],
            concepts: [
              ["involve", "informed", "inform"],
              ["input", "opinion", "voice"],
              ["listen"],
              ["share information", "share"],
              ["everyone", "each member", "all members", "all the members"],
            ],
            labels: [
              "Involve others and keep them informed",
              "Seek every member's input",
              "Listen respectfully",
              "Share information",
              "Include everyone, one at a time",
            ],
            min: 3,
          },
          {
            answer: [
              "Most teams will have a leader — a very important position because he or she is responsible for the management of the entire project: setting a base agenda, facilitating meetings, and monitoring progress with communicating with members as needed.",
              "It is important not to have too \"heavy\" a hand, or team morale may be lowered — all actions must be agreed to by the team.",
              "Other roles carry their own responsibilities: leader/editor, writer, graphic artist and Webmaster/HTML specialist — or initiator, recorder, devil's advocate/skeptic, optimist, timekeeper, gate keeper and summarizer.",
              "Everyone must agree on appropriate roles, and everyone must be satisfied in their roles.",
            ],
            concepts: [
              ["leader"],
              ["agree", "agreed", "agreement"],
              ["roles", "role"],
              ["responsible", "responsibility", "manage", "management"],
            ],
            labels: [
              "The leader's position",
              "Actions agreed by the team",
              "Defined roles",
              "Responsibility for managing the project",
            ],
            min: 2,
          },
          {
            answer: [
              "All actions must be agreed to by the team — although you may suggest a course of action, you must be sure the team agrees to it; if the team wants to go in another direction, you should be willing to compromise.",
              "Everyone agrees on appropriate roles — this may take some negotiation to decide — and everyone is satisfied in their roles.",
              "Whatever role you may have, it is still important that the entire team provide input on every facet of the project; teams can rotate roles or combine them in one person.",
            ],
            concepts: [
              ["agree", "agreed", "agreement"],
              ["compromise", "negotiation", "negotiate"],
              ["roles", "role"],
              ["input", "rotate"],
            ],
            labels: [
              "Team agreement on actions",
              "Negotiation and compromise",
              "Agreed and satisfying roles",
              "Whole-team input and rotating roles",
            ],
            min: 2,
          },
          {
            answer: [
              "Effective teamwork means a continual balancing act between meeting team needs and individual needs — people will only agree to team if it meets their own needs first.",
              "Everyone has to put their agendas on the table for the others to examine; good teams uncover their own hidden agendas and expose them to the light of day.",
              "Whatever the personal goals, we need to know what they are, and to deal with them, or at least acknowledge them, as a team — the sooner we know one another's personal needs and hopes, the better for the team.",
            ],
            concepts: [
              ["balance", "balancing"],
              ["individual needs", "personal needs", "own needs", "personal goals"],
              ["team needs"],
              ["agenda", "agendas"],
              ["acknowledge", "honest", "on the table"],
            ],
            labels: [
              "A continual balancing act",
              "Individual and personal needs",
              "Team needs",
              "Agendas on the table",
              "Acknowledging needs as a team",
            ],
            min: 3,
          },
        ],
      },
      {
        id: "ex2",
        title: "Questioning — contribution to team coherence, image and spirit and Respect differences to enhance interaction between team members",
        task: "Time: 45 minutes · Activity: Self & Group",
        steps: [
          "Explain how you will identify the needs and objectives of team members",
          "Explain the methods and techniques for building team coherence and spirit",
          "Explain how you will ensure that team member actions are conducive to team coherence, spirit and image",
          "Explain how trust and support of colleagues is gained through applicable behaviours",
          "Explain how feedback can be provided which leads to constructive working relationships",
          "Explain how differences between team members can be identified and acknowledged",
          "Explain the importance of showing respect in teams",
          "Explain how team members can be treated in ways which that demonstrate respect for individuals",
          "Explain why behaviours, which are of concern to individuals, must be discussed promptly and openly with those concerned",
        ],
        checks: [
          {
            answer: [
              "Everyone has to put their agendas on the table for the others to examine — good teams uncover their own hidden agendas and expose them to the light of day.",
              "The sooner we know one another's personal needs and hopes, the better for the team — acknowledging and addressing these needs as a group, early on, can help prevent \"selfish\" desires from sinking the team effort.",
              "In team decisions and actions, actively seek the input of quiet team members, and ask what would make it easier for them to participate.",
              "Ask what are the team's specific goals and objectives — if there are none, work with other team members to create some.",
            ],
            concepts: [
              ["agenda", "agendas"],
              ["needs", "hopes", "objectives"],
              ["ask", "input", "talk", "discuss"],
              ["acknowledge", "honest", "open", "table"],
            ],
            labels: [
              "Uncover hidden agendas",
              "Know personal needs and hopes",
              "Ask for and seek input",
              "Acknowledge needs openly",
            ],
            min: 2,
          },
          {
            answer: [
              "Develop a clear statement of team mission or purpose, with ground rules governing participation and sharing of responsibilities.",
              "Agree to depersonalize conflicts, use structured processes for problem solving and conflict resolution, and clearly define individual responsibilities, project standards and time lines.",
              "Model commitment — energetically and publicly pursue the team's goals, demonstrate enthusiasm and commitment for the team's projects and initiatives, and choose to have a can-do attitude.",
              "Chat a Little — a meeting does not have to be 100% business; this can really help ease tension when disagreements occur later.",
            ],
            concepts: [
              ["mission", "purpose"],
              ["ground rules", "rules"],
              ["responsibilities", "responsibility"],
              ["commitment", "enthusiasm", "attitude"],
              ["depersonalize", "conflict"],
            ],
            labels: [
              "Clear team mission or purpose",
              "Ground rules",
              "Defined responsibilities",
              "Model commitment and enthusiasm",
              "Depersonalize conflict",
            ],
            min: 3,
          },
          {
            answer: [
              "Avoid behaviours that are clearly detrimental to the team: consistently missing meetings or deadlines, never coming prepared to meetings, not answering e-mail or messages in a reasonable time, and discourteous or disrespectful language.",
              "If you disagree with something the team is doing, raise your objection with the team — when you are in public, speak out in support of the team's initiatives and decisions.",
              "When your team encounters problems or setbacks, work at responding with energy, interest, and enthusiasm for finding a way to solve the problem.",
            ],
            concepts: [
              ["meetings", "deadlines"],
              ["prepared", "prepare"],
              ["courteous", "respectful", "respect", "language"],
              ["support", "public"],
              ["enthusiasm", "energy", "commitment"],
            ],
            labels: [
              "Meetings and deadlines kept",
              "Come prepared",
              "Courteous, respectful language",
              "Public support for the team",
              "Energy and enthusiasm",
            ],
            min: 3,
          },
          {
            answer: [
              "Don't Blame Others — people in your group lose respect for you if you're constantly blaming others for not meeting deadlines.",
              "No Bragging — have faith that people will recognize when good work is being done and that they'll let you know how well you're doing.",
              "Support group members' ideas and take the time to help your fellow team mates, no matter the request — if you've helped them in past, they'll be more than happy to lend a helping hand.",
              "Uncover hidden agendas and expose them to the light of day — good teams recognise that this is how trust is built.",
            ],
            concepts: [
              ["blame", "blaming"],
              ["brag", "bragging", "boast"],
              ["help", "support"],
              ["honest", "hidden agenda", "agendas", "trust"],
            ],
            labels: [
              "Don't blame others",
              "Don't brag",
              "Help and support team mates",
              "Honesty builds trust",
            ],
            min: 2,
          },
          {
            answer: [
              "Don't express an opinion as a fact, and explain your reasons — this will allow others to evaluate your comments more effectively.",
              "Restate the original idea to be sure you have correctly understood it, and compliment another's idea — some part of it may be valid and could be usable in another form.",
              "Respond, don't react; don't interrupt; critique the idea, not the person; be courteous; avoid jargon.",
            ],
            concepts: [
              ["opinion", "fact"],
              ["reasons", "explain"],
              ["restate", "compliment"],
              ["idea not the person", "not the person"],
              ["courteous", "interrupt", "jargon", "react"],
            ],
            labels: [
              "Opinion vs fact",
              "Explain your reasons",
              "Restate and compliment ideas",
              "Critique the idea, not the person",
              "Courteous, calm responses",
            ],
            min: 3,
          },
          {
            answer: [
              "Having different opinions is one of the essential benefits of teamwork — team members have strong feelings and emotions.",
              "Let each person state his or her view briefly, and have neutral team members reflect on areas of agreement or disagreement.",
              "Acknowledge that the conflict exists, gain common ground, and seek to understand all angles.",
            ],
            concepts: [
              ["opinions", "different"],
              ["state", "view", "listen"],
              ["acknowledge"],
              ["understand", "common ground"],
            ],
            labels: [
              "Different opinions exist",
              "Let each person state their view",
              "Acknowledge the difference",
              "Seek to understand all angles",
            ],
            min: 2,
          },
          {
            answer: [
              "Discourteous or disrespectful language is clearly detrimental to the functioning of the team.",
              "Listen to others respectfully and fully — recognize and use the differences and talents of others.",
              "Critique the idea, not the person, and be courteous — morale may not be perfect all the time, but people should be able to work together.",
            ],
            concepts: [
              ["respect", "respectful", "disrespect"],
              ["listen"],
              ["courteous", "courtesy"],
              ["morale", "work together", "trust"],
            ],
            labels: [
              "Respectful treatment",
              "Respectful listening",
              "Courtesy",
              "Morale and working together",
            ],
            min: 2,
          },
          {
            answer: [
              "Look at the person who's speaking to you, nod, ask probing questions and acknowledge what's said by paraphrasing points that have been made.",
              "If a team member asks you a question, answer it courteously; listen to others respectfully and fully.",
              "Actively seek the input of quiet team members; recognize and use the differences and talents of others; critique the idea, not the person.",
            ],
            concepts: [
              ["listen", "listening"],
              ["courteous", "courteously", "polite"],
              ["input", "quiet"],
              ["talents", "differences"],
              ["idea not the person", "not the person"],
            ],
            labels: [
              "Active listening",
              "Courteous answers",
              "Seek quiet members' input",
              "Recognise differences and talents",
              "Critique ideas, not people",
            ],
            min: 2,
          },
          {
            answer: [
              "If you have a problem with someone in your group, talk to him about it — letting bad feelings brew will only make you sour and want to isolate yourself from the group; not only does it feel good to get it out, but it will be better for the team in the long run.",
              "Make sure a specific behavior has been identified as unproductive — the problem is with the behavior not with the person.",
              "When discussing the behavior with a person, try to frame the issue as: \"I/We feel (frustrated/concerned) when you (fill in behavior) because it (explain how it affects the team)\" — and allow the person to express his or her side of the issue.",
            ],
            concepts: [
              ["talk", "discuss", "raise"],
              ["feelings brew", "brew", "sour", "isolate", "resentment"],
              ["behavior", "behaviour"],
              ["not the person", "not with the person"],
              ["express", "side"],
            ],
            labels: [
              "Talk about it directly and promptly",
              "Bad feelings brew when left unspoken",
              "Focus on the specific behaviour",
              "The behaviour, not the person",
              "Let them express their side",
            ],
            min: 2,
          },
        ],
      },
    ],
    assignments: [],
    quiz: [],
    quizzes: [
      {
        id: "q-alignment",
        title: "Quiz 1 — Alignment index: what you must be proved competent in",
        questions: [
          {
            q: "What is Unit Standard 10135 — Work as a project team member — about?",
            options: [
              "Working effectively as part of a project team and knowing what is expected of a team member",
              "Contributing to the team's coherence and spirit",
              "Building sound relations with fellow team members and stakeholders",
              "Managing the project budget and timeline",
            ],
            answer: 0,
            answers: [0, 1, 2],
            explain: "US 10135 is about working effectively as part of a project team: what is expected of a team member, contributing to the team's coherence and spirit, and building sound relations with fellow team members and stakeholders. Budgets and timelines are not part of this unit standard.",
          },
          {
            q: "Which of these sections appear in the Unit Standard 10135 alignment index?",
            options: [
              "Demonstrate an understanding of criteria for working as a member of a team and working autonomously in a team",
              "Contribution to team coherence, image and spirit and respect differences to enhance interaction between team members",
              "Contribute to building relations between team members and stakeholders",
              "Installing and configuring a Windows server",
            ],
            answer: 0,
            answers: [0, 1, 2],
            explain: "The alignment index lists the three content sections (team criteria, team coherence & respect, and stakeholder relations) plus the Question Sessions and self assessment — server installation belongs to other unit standards.",
          },
          {
            q: "How is your knowledge assessed and checked as you work through the manual?",
            options: [
              "Question Sessions assess your knowledge after each content section",
              "A self assessment once you have completed all the questions after being facilitated",
              "A practical server-room examination",
              "It is not assessed at all",
            ],
            answer: 0,
            answers: [0, 1],
            explain: "Each section is followed by a Question Session ('Your knowledge of this section is assessed with the questions'), and once all questions are completed after facilitation you check your own progress in the self assessment.",
          },
          {
            q: "What should you do in the self assessment?",
            options: [
              "Tick the blocks for the areas in which you feel competent",
              "Indicate in the block where you feel you require additional knowledge",
              "Show it to your facilitator and make the necessary arrangements to assist you to become competent",
              "Keep the results to yourself",
            ],
            answer: 0,
            answers: [0, 1, 2],
            explain: "In the self assessment you tick the blocks where you feel competent, indicate where you require additional knowledge, and show this to your facilitator to arrange assistance — you never keep it to yourself.",
          },
        ],
      },
      {
        id: "q-so13",
        title: "Quiz 2 — Specific outcomes and assessment criteria (SO 1–3)",
        questions: [
          {
            q: "Specific Outcome 1 requires you to demonstrate an understanding of…",
            options: [
              "project budgeting software",
              "criteria for working as a member of a team",
              "network architecture",
              "employment law",
            ],
            answer: 1,
            explain: "SO 1: Demonstrate an understanding of criteria for working as a member of a team.",
          },
          {
            q: "Which of the following is an assessment criterion of SO 1?",
            options: [
              "Servers are installed and configured",
              "Team dynamics are identified and explained",
              "Reports are formatted with numbered headings",
              "Stakeholder budgets are approved",
            ],
            answer: 1,
            explain: "SO 1's assessment criteria: criteria for teamwork identified and explained, behaviours conducive to teamwork identified and explained, and team dynamics identified and explained.",
          },
          {
            q: "Under SO 1, behaviours conducive to working as a member of a team must be…",
            options: [
              "ignored",
              "identified and explained",
              "punished",
              "kept confidential",
            ],
            answer: 1,
            explain: "AC 2 of SO 1: behaviours conducive to working as a member of a team are identified and explained.",
          },
          {
            q: "Specific Outcome 2 is about…",
            options: [
              "working autonomously and collaborating with other team members",
              "writing the team's annual report",
              "recruiting new staff",
              "auditing the project finances",
            ],
            answer: 0,
            explain: "SO 2: Work autonomously and collaborate with other team members.",
          },
          {
            q: "Under SO 2, team members must be given sufficient support so that they can…",
            options: [
              "leave work early",
              "achieve their work / project objectives",
              "avoid consulting anyone",
              "skip team meetings",
            ],
            answer: 1,
            explain: "AC 1 of SO 2: team members are given sufficient support for them to achieve their work / project objectives.",
          },
          {
            q: "Under SO 2, the authority levels of all team members must be…",
            options: [
              "hidden from the team",
              "identified and applied",
              "removed entirely",
              "decided by the newest member",
            ],
            answer: 1,
            explain: "AC 3 of SO 2: authority levels of all team members are identified and applied.",
          },
          {
            q: "Under SO 2, collaboration must reflect…",
            options: [
              "only the leader's needs",
              "the needs of all team members",
              "the needs of the fastest worker",
              "whatever the client demands",
            ],
            answer: 1,
            explain: "AC 4 of SO 2: collaboration reflects the needs of all team members.",
          },
          {
            q: "Specific Outcome 3 is about…",
            options: [
              "contributing to building relations between team members and stakeholders",
              "designing the team's office layout",
              "installing database software",
              "scheduling annual leave",
            ],
            answer: 0,
            explain: "SO 3: Contribute to building relations between team members and stakeholders.",
          },
          {
            q: "Under SO 3, communications with stakeholders must encourage…",
            options: [
              "one-way instructions only",
              "open and frank discussions",
              "as little contact as possible",
              "formal letters only",
            ],
            answer: 1,
            explain: "AC 3 of SO 3: communications with stakeholders encourages open and frank discussions.",
          },
          {
            q: "Under SO 3, commitments to stakeholders must be…",
            options: [
              "renegotiated after the deadline",
              "honoured and met",
              "avoided wherever possible",
              "made only in writing",
            ],
            answer: 1,
            explain: "AC 4 of SO 3: commitments to stakeholders are honoured and met.",
          },
        ],
      },
      {
        id: "q-friday1",
        title: "Quiz 3 — Friday's content: being an effective team member",
        questions: [
          {
            q: "If you have a problem with someone in your group, what should you do?",
            options: [
              "Let bad feelings brew until they pass",
              "Talk to him about it — it is better for the team in the long run",
              "Complain to everyone except the person",
              "Leave the team immediately",
            ],
            answer: 1,
            explain: "Communicate, Communicate, Communicate: talk to the person — letting bad feelings brew will only make you sour and want to isolate yourself from the group.",
          },
          {
            q: "What happens when you constantly blame others for not meeting deadlines?",
            options: [
              "The team respects you more",
              "People in your group lose respect for you — pointing the finger only makes you look cowardly",
              "Deadlines automatically move",
              "Nothing at all",
            ],
            answer: 1,
            explain: "People know who isn't pulling his weight — blaming others loses their respect and makes you look cowardly.",
          },
          {
            q: "What earns more respect than making a missed deadline seem like everyone else's fault?",
            options: [
              "Saying nothing",
              "Saying something like: \"I'm really sorry, but I'll get it to you by the end of today.\"",
              "Blaming the software",
              "Deleting the deadline from the plan",
            ],
            answer: 1,
            explain: "An honest apology with a new commitment earns far more respect than shifting the blame.",
          },
          {
            q: "How should you treat a team mate's suggestion — even if it's the silliest idea you've ever heard?",
            options: [
              "Reject it immediately",
              "Always consider it — it shows you're interested in other people's ideas, not just your own",
              "Laugh at it with the group",
              "Report it to the leader",
            ],
            answer: 1,
            explain: "Support Group Member's Ideas: always consider suggestions — nobody likes a know-it-all.",
          },
          {
            q: "When someone recognises your good work, what is an appropriate response instead of bragging?",
            options: [
              "\"Thanks, that means a lot.\"",
              "\"Obviously — I'm the best on this team.\"",
              "\"You should tell management immediately.\"",
              "\"I did everyone's work anyway.\"",
            ],
            answer: 0,
            explain: "No Bragging: have faith that people will recognise good work — a simple 'Thanks, that means a lot.' is enough.",
          },
          {
            q: "Which of these is part of listening actively?",
            options: [
              "Planning what you will say next while the other person talks",
              "Looking at the speaker, nodding, asking probing questions and paraphrasing what's been said",
              "Checking your phone",
              "Interrupting to save time",
            ],
            answer: 1,
            explain: "Listen Actively: look at the speaker, nod, ask probing questions and acknowledge what's said by paraphrasing points that have been made.",
          },
          {
            q: "Why should you take the time to help your fellow team mates, no matter the request?",
            options: [
              "So they owe you money",
              "Because there will be a time when you need help — and if you've helped them in the past, they'll be happy to lend a helping hand",
              "Because the leader is watching",
              "There is no reason to help",
            ],
            answer: 1,
            explain: "Get Involved: you can guarantee a time will come when you'll need help or advice — past helpfulness is repaid.",
          },
          {
            q: "According to 'The Modern Workplace', how does a team detect flaws?",
            options: [
              "By blaming the last person who worked on the solution",
              "A team looking at different proposed solutions may find pitfalls that an individual might miss — the final solution is that much stronger",
              "By outsourcing all checking",
              "Flaws cannot be detected in teams",
            ],
            answer: 1,
            explain: "Detect Flaws: a team reviewing proposed solutions finds pitfalls an individual might miss, making the final solution stronger.",
          },
          {
            q: "When a team organises its own roles, what two things are important?",
            options: [
              "Everyone agrees on appropriate roles, and everyone is satisfied in their roles",
              "The leader decides everything, and no one questions it",
              "Roles are kept secret, and never rotated",
              "Only the fastest workers get roles",
            ],
            answer: 0,
            explain: "It is important that everyone agrees on appropriate roles (this may take negotiation) and that everyone is satisfied in their roles.",
          },
          {
            q: "Which role is responsible for looking for potential flaws in an idea?",
            options: [
              "The Optimist",
              "The Devil's Advocate/Skeptic",
              "The Timekeeper",
              "The Recorder",
            ],
            answer: 1,
            explain: "The Devil's Advocate/Skeptic is someone whose responsibility is to look for potential flaws in an idea.",
          },
        ],
      },
      {
        id: "q-friday2",
        title: "Quiz 4 — Friday's content: conflict, behaviour and team needs",
        questions: [
          {
            q: "When giving constructive feedback, you should not express an opinion as…",
            options: ["a question", "a fact", "a compliment", "a suggestion"],
            answer: 1,
            explain: "Don't express an opinion as a fact — you may hate orange text on green, but that is an opinion unless you can cite a legitimate reason for your concern.",
          },
          {
            q: "Complete the feedback tip: \"Critique the ___, not the person.\"",
            options: ["budget", "idea", "leader", "deadline"],
            answer: 1,
            explain: "Critique the idea, not the person — one of the tips for presenting critiques with tact.",
          },
          {
            q: "What are the two fundamentals most members of a team have to learn about conflict?",
            options: [
              "Conflict is always bad, and emotions must be banned",
              "Having different opinions is one of the essential benefits of teamwork, and team members have strong feelings and emotions",
              "Only leaders may disagree, and meetings must be short",
              "Conflict should be reported to HR, and never discussed",
            ],
            answer: 1,
            explain: "Conflict happens: different opinions are an essential benefit of teamwork, and a team cannot achieve its full potential if all that is allowed is logic or information.",
          },
          {
            q: "Which of the following is a way to clarify expectations in a team?",
            options: [
              "Developing a clear statement of team mission or purpose",
              "Keeping responsibilities undefined",
              "Avoiding ground rules",
              "Letting time lines emerge by accident",
            ],
            answer: 0,
            explain: "Clarifying expectations includes a clear mission statement, ground rules, agreement to depersonalize conflicts, clearly defined responsibilities, and defined project standards and time lines.",
          },
          {
            q: "During the problem-solving phase of a conflict, the team should focus on…",
            options: ["personalities", "issues, not personalities", "who to blame", "seniority"],
            answer: 1,
            explain: "Depersonalize team-internal conflict: during the problem-solving phase focus on issues not personalities.",
          },
          {
            q: "In a structured discussion to handle conflict, what happens first?",
            options: [
              "Opponents suggest modifications",
              "Each person states his or her view briefly",
              "The team votes immediately",
              "The leader announces the outcome",
            ],
            answer: 1,
            explain: "Structuring discussion step 1: let each person state his or her view briefly.",
          },
          {
            q: "Which of the following is clearly unproductive behaviour?",
            options: [
              "Raising a concern about a plan",
              "Consistently missing meetings and deadlines",
              "Asking a question to clarify a detail",
              "Following the agreed procedure",
            ],
            answer: 1,
            explain: "Clearly unproductive: consistently missing meetings, consistently missing deadlines, never coming prepared, not answering messages in reasonable time, and discourteous or disrespectful language.",
          },
          {
            q: "'Raising a Concern' is normal and productive — what is its extreme, unproductive form?",
            options: [
              "Lurking",
              "Nitpicking — questioning or objecting to every possible detail on the project",
              "Nudging",
              "Doing Everything",
            ],
            answer: 1,
            explain: "In extreme form, raising a concern becomes Nitpicking: questioning or objecting to every possible detail on the project.",
          },
          {
            q: "In 'teaming physics', what is the strong force on a team?",
            options: [
              "The team objective",
              "The collection of personal wishes and wants that team members bring to the team",
              "The project deadline",
              "The office layout",
            ],
            answer: 1,
            explain: "The team objective is decidedly the weak force; the strong force remains the collection of personal wishes and wants members bring to the team.",
          },
          {
            q: "What must good teams do with hidden agendas?",
            options: [
              "Encourage them — they build competition",
              "Uncover their own hidden agendas and expose them to the light of day, because hidden agendas are destructive to team coherence",
              "Write them into the project plan",
              "Ignore them completely",
            ],
            answer: 1,
            explain: "The 'hidden agenda' is not honest and is very destructive to team coherence — good teams uncover their own hidden agendas and expose them to the light of day.",
          },
        ],
      },
    ],

    lessonPlan: {
      title: "Facilitator Preparation",
      startTime: "09:00",
      details: [
        { icon: "calendar", label: "Date", value: "Friday, 7 August 2026" },
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
          heading: "Day 1 — Friday, 7 August 2026 · Unit Standard 10135",
          startTime: "09:00",
          rows: [
            {
              time: "30 minutes",
              title: "Index & Unit Standard Alignment — Facilitator",
              text: [
                "Read through the index with the learners, highlighting the areas that will be covered in this manual. Make reference to the Unit Standard Alignment Index to outline the specific outcomes that will be covered.",
              ],
              resources: ["LM p2"],
            },
            {
              time: "90 minutes",
              title: "Criteria for working as a team member — Facilitator & Class",
              bullets: [
                "Read through pages 4-10 of the learner manual, identifying criteria for working as a team member.",
              ],
              resources: ["LM p4-10"],
            },
            {
              time: "45 minutes",
              title: "Questionnaire 1 — Class in pairs",
              bullets: [
                "Facilitator to read through the questions with the learners, ensuring they understand what is expected of them.",
                "Allow the learners to complete the questions; take feedback from two groups/pairs.",
              ],
              resources: ["LM p11-12"],
            },
            {
              time: "90 minutes",
              title: "Contribution to team coherence, respect and interaction between team members — Facilitator & Class",
              text: ["Read through pages 13-19 of the learner manual, identifying the following:"],
              bullets: [
                "Productive and non-productive behaviour",
                "Individual needs versus team needs.",
              ],
              resources: ["LM p13-19"],
            },
          ],
        },
        {
          heading: "Day 2 — Friday, 7 August 2026 · Unit Standard 10135",
          startTime: "09:00",
          rows: [
            {
              time: "90 minutes",
              title: "Building relations between team members and stakeholders — Facilitator & Class",
              text: [
                "Read through pages 21-24 of the learner manual for the article on Cape Town tourism and staff.",
              ],
              resources: ["LM p21-24"],
            },
            {
              time: "45 minutes",
              title: "Questionnaire 2 — Class in pairs",
              bullets: [
                "Facilitator to read through the questions with the learners, ensuring they understand what is expected of them.",
                "Allow the learners to complete the questions; take feedback from two groups/pairs.",
              ],
              resources: ["LM p25-26"],
            },
            {
              time: "10 minutes",
              title: "Self-Assessment — Learners individually",
              bullets: [
                "Explain to the learners that they have to judge their own knowledge gained in the unit by ticking the blocks they feel competent with.",
                "Allow the learners to tick the blocks and take feedback from each learner.",
                "Identify those learners who have shortcomings and assist them with fulfilling the requirements.",
              ],
              resources: ["LM p27"],
            },
          ],
        },
      ],
    },
  },

  /* ================================================================
     HWSW — Hardware and Software (internal two-day lesson)
     Wednesday 5 & Thursday 6 August 2026 · enrichment, no credits
     ================================================================ */
  HWSW: {
    lesson: [
      {
        heading: "Welcome — why hardware and software matter",
        icon: "chip",
        flat: true,
        paragraphs: [
          "Everything you will ever fix, install, upgrade or support in your IT career is either hardware or software. Hardware is the physical part of a computer system — anything you can touch, from the smallest RAM chip to a data centre the size of a shopping centre. Software is the set of instructions that tells that hardware what to do — you cannot touch it, but without it the most expensive server in the world is just an expensive heater.",
          "Over these two days we travel the whole landscape: where computers came from (and the remarkable people — many of them women — who invented computing), what every component inside a PC does, the printers and peripherals on the desks around you, the network and data centre hardware behind the scenes, the cloud hardware you will never see but use every day, and the software that brings it all to life.",
          "By the end you should be able to pick up any component, name it, explain what it does, and reason about what happens when it fails — the core skill of a systems support technician.",
        ],
        cards: [
          {
            icon: "chip",
            title: "Hardware",
            text: "The physical machinery: CPU, RAM, storage, motherboard, ports, printers, switches, servers, racks. If you can touch it (or trip over its cable), it is hardware.",
          },
          {
            icon: "layers",
            title: "Software",
            text: "The instructions: operating systems, applications, utilities. Stored as data, executed by the CPU. If you can only see it on a screen, it is software.",
          },
          {
            icon: "settings",
            title: "Firmware",
            text: "Software permanently stored on a chip inside hardware — the BIOS/UEFI on a motherboard, the controller code in an SSD or printer. The bridge between the two worlds.",
          },
        ],
        figures: [
          { id: "hardware-collage", caption: "The hardware landscape — from a RAM module to a data centre", hint: "a collage/poster of hardware at every scale (component, PC, rack, data centre)" },
          { id: "software-stack", caption: "The software stack — firmware, operating system, applications", hint: "a simple layered diagram: hardware at the bottom, firmware, OS, apps on top" },
        ],
      },
      {
        heading: "1. In the beginning — Babbage, Ada Lovelace and the first idea of a computer",
        icon: "book",
        paragraphs: [
          "The story of your job starts two hundred years ago, before electricity was in homes. In 1822 the English mathematician Charles Babbage designed the Difference Engine — a hand-cranked machine of brass gears built to calculate mathematical tables without human error. He then went further: his Analytical Engine (designed from 1837) had a 'mill' that did the arithmetic and a 'store' that held numbers — exactly the CPU-and-memory split every computer still uses today. It read its instructions from punched cards, an idea borrowed from the Jacquard loom, which since 1804 had woven silk patterns controlled by holes punched in cards.",
          "Ada Lovelace, a mathematician and the daughter of the poet Lord Byron, studied the Analytical Engine and in 1843 published a set of notes that included a step-by-step method for the machine to compute Bernoulli numbers — widely regarded as the first computer program ever written. More importantly, she saw what even Babbage did not: that a machine manipulating symbols could go beyond numbers and one day compose music or create art. She imagined general-purpose computing — and, in a sense, predicted today's AI — a century before the first computer was built.",
          "The punched card outlived them both. In 1890 Herman Hollerith used punched cards and electric tabulating machines to process the US census in two years instead of eight. His Tabulating Machine Company merged into what was renamed, in 1924, International Business Machines — IBM. Data processing was an industry before a single electronic computer existed.",
        ],
        bullets: [
          "1804 — Jacquard loom: punched cards control a machine (a pattern is a 'program').",
          "1822 — Babbage's Difference Engine: automatic calculation by machine.",
          "1837 — Babbage's Analytical Engine: mill (processor) + store (memory) + card input — the architecture of every computer since.",
          "1843 — Ada Lovelace publishes the first algorithm intended for a machine, and foresees computers working with more than numbers.",
          "1890 — Hollerith's punched-card tabulators process the US census; his company becomes IBM in 1924.",
        ],
        table: {
          headers: ["Analytical Engine (1837)", "Modern equivalent"],
          rows: [
            ["The mill — performed the arithmetic", "CPU (processor)"],
            ["The store — held 1,000 numbers of 40 digits", "RAM (memory)"],
            ["Punched operation & variable cards", "Program and data input"],
            ["Printer and curve-drawing apparatus", "Output devices"],
          ],
        },
        figures: [
          { id: "babbage-portrait", caption: "Charles Babbage (1791–1871), 'father of the computer'", hint: "portrait photograph or engraving of Charles Babbage" },
          { id: "difference-engine", caption: "The Difference Engine — a working build stands in the Science Museum, London", hint: "photo of the Science Museum's completed Difference Engine No. 2" },
          { id: "ada-lovelace", caption: "Ada Lovelace (1815–1852), the first computer programmer", hint: "the famous 1840 watercolour portrait of Ada Lovelace" },
          { id: "jacquard-loom", caption: "A Jacquard loom with its chain of punched cards", hint: "photo of a Jacquard loom showing the punched-card chain" },
          { id: "hollerith-machine", caption: "Hollerith tabulating machine and a punched card — the 1890 census", hint: "photo of the Hollerith tabulator and/or an 80-column punched card" },
        ],
      },
      {
        heading: "2. When 'computer' was a job title — the women who computed",
        icon: "people",
        paragraphs: [
          "For most of history a 'computer' was a person — someone employed to do calculations by hand, and for a century that skilled, painstaking work was done overwhelmingly by women. At Harvard Observatory from the 1880s, a team of women 'computers' including Williamina Fleming, Annie Jump Cannon and Henrietta Swan Leavitt catalogued hundreds of thousands of stars; Leavitt's work became a foundation for measuring the universe.",
          "At NACA — later NASA — teams of women computed flight and rocket trajectories with pencils, slide rules and mechanical calculators. In the segregated 'West Area Computing' unit, Black women mathematicians did this work while being kept in separate offices: Katherine Johnson calculated the trajectory for America's first human spaceflight, and John Glenn refused to fly his 1962 orbital mission until she personally re-checked the electronic computer's figures — 'If she says they're good, then I'm ready to go.' Dorothy Vaughan became NASA's first Black supervisor and, seeing electronic computers coming, taught herself and her whole team FORTRAN programming. Mary Jackson became NASA's first Black female engineer. Their story is told in the film Hidden Figures.",
          "During the Second World War, hundreds of women computed artillery firing tables for the US Army — and at Bletchley Park in Britain, where Alan Turing's team broke the German Enigma cipher with electromechanical 'bombe' machines, roughly three quarters of the ten-thousand-strong workforce were women, many operating Colossus (1943), the world's first programmable electronic digital computer.",
          "So when the first general-purpose electronic computer arrived, it was natural that women programmed it. ENIAC (1945) weighed 30 tons and used about 18,000 vacuum tubes; its six original programmers — Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Wescoff, Fran Bilas and Ruth Lichterman — programmed it by physically re-plugging cables and setting switches, with no manuals and no training course, inventing programming as a discipline as they went. For decades their role was almost forgotten; today they are recognised as pioneers.",
          "One of them, Betty Snyder (later Holberton), went on to help design UNIVAC. Alongside her worked Grace Hopper, a US Navy officer and mathematician who believed programs should be written in something closer to English: she created the first compiler (A-0, 1952) and drove the creation of COBOL (1959), a language still running banks today. Her team also popularised the word 'debugging' after taping an actual moth, found jamming a relay in the Harvard Mark II, into the logbook.",
        ],
        table: {
          headers: ["Pioneer", "Contribution"],
          rows: [
            ["Ada Lovelace (1843)", "First published algorithm for a machine; foresaw general-purpose computing"],
            ["Harvard Computers (1880s–1920s)", "Catalogued the stars; foundations of modern astronomy"],
            ["Katherine Johnson (NASA)", "Trajectories for the first US human spaceflights; verified John Glenn's orbit"],
            ["Dorothy Vaughan (NASA)", "First Black NASA supervisor; retrained her team from hand computing to FORTRAN"],
            ["Mary Jackson (NASA)", "NASA's first Black female engineer"],
            ["Bletchley Park women (WWII)", "Operated the bombes and Colossus that broke enemy ciphers"],
            ["The ENIAC Six (1945)", "First programmers of a general-purpose electronic computer"],
            ["Grace Hopper (1952–59)", "First compiler; mother of COBOL; 'debugging'"],
          ],
        },
        figures: [
          { id: "human-computers", caption: "A room of human 'computers' at work with calculating machines", hint: "photo of NACA/Harvard women computers working at desks with mechanical calculators" },
          { id: "katherine-johnson", caption: "Katherine Johnson — her calculations carried astronauts to orbit and back", hint: "NASA portrait of Katherine Johnson at her desk" },
          { id: "bletchley-bombe", caption: "A rebuilt bombe at Bletchley Park — electromechanical codebreaking", hint: "photo of the Bletchley Park bombe rebuild, ideally with an operator" },
          { id: "colossus", caption: "Colossus (1943) — the first programmable electronic digital computer", hint: "wartime photo of Colossus with its operators" },
          { id: "eniac", caption: "ENIAC (1945) — 30 tons, ~18,000 valves, 150 kW", hint: "classic wide photo of ENIAC filling the room" },
          { id: "eniac-programmers", caption: "Two of the ENIAC Six re-plugging the machine — this was programming in 1946", hint: "the famous photo of ENIAC programmers at the plugboards" },
          { id: "grace-hopper", caption: "Rear Admiral Grace Hopper — the first compiler and COBOL", hint: "portrait of Grace Hopper in naval uniform, or at UNIVAC" },
          { id: "first-bug", caption: "The 'first actual case of bug being found' — the moth in the Mark II logbook, 1947", hint: "photo of the Harvard Mark II logbook page with the taped moth" },
        ],
      },
      {
        heading: "3. Five generations of hardware — valves to AI silicon",
        icon: "trend",
        paragraphs: [
          "Computer hardware has been reinvented roughly every fifteen years, each time by a new switching technology that made machines smaller, faster, cheaper and more reliable. Engineers group this history into five generations.",
          "The turning point was 23 December 1947, when John Bardeen, Walter Brattain and William Shockley demonstrated the transistor at Bell Labs — a solid-state switch with no glowing filament to burn out. In 1958–59 Jack Kilby and Robert Noyce independently worked out how to put many transistors on one chip: the integrated circuit. In 1971 Intel squeezed an entire processor onto a single chip — the 4004 microprocessor, with 2,300 transistors. A modern CPU carries tens of billions. Gordon Moore's 1965 observation that transistor counts double roughly every two years — Moore's Law — held for half a century and is the reason the phone in your pocket outcomputes ENIAC by a factor of billions.",
          "Once processors were chips, computers could sit on desks. The MITS Altair 8800 (1975) launched the hobbyist era — and a tiny company called Microsoft, which wrote its BASIC. The Apple II (1977) put computers in homes and schools; the IBM PC 5150 (1981) put them on every office desk and, because IBM published its specifications, created the 'PC-compatible' industry your workstations still descend from. Laptops shrank the desktop; the iPhone (2007) put a networked computer in every pocket; and since the mid-2010s the frontier has been massive parallel hardware — GPUs and AI accelerators in hyperscale data centres — bringing the story full circle to rooms of machinery, just like ENIAC, but a trillion times faster.",
        ],
        table: {
          headers: ["Generation", "Technology", "Era", "Example machines"],
          rows: [
            ["1st", "Vacuum tubes (valves)", "1940s–1950s", "ENIAC, UNIVAC I, Colossus"],
            ["2nd", "Transistors", "late 1950s–1960s", "IBM 1401, CDC 1604"],
            ["3rd", "Integrated circuits", "1960s–1970s", "IBM System/360, PDP-11"],
            ["4th", "Microprocessors", "1971–today", "Altair 8800, Apple II, IBM PC, every desktop and phone"],
            ["5th", "Massively parallel & AI silicon", "2010s–today", "GPU clusters, Google TPU pods, Apple M-series"],
          ],
        },
        bullets: [
          "1947 — the transistor (Bell Labs): the single most important invention in electronics.",
          "1958–59 — the integrated circuit (Kilby & Noyce): many transistors on one chip.",
          "1965 — Moore's Law: transistor counts double roughly every two years.",
          "1971 — Intel 4004: the first microprocessor, 2,300 transistors at 740 kHz.",
          "1975–81 — Altair 8800 → Apple II → IBM PC: computing reaches desks and homes.",
          "2007 — iPhone: a computer, camera, GPS and modem in one pocket-sized slab.",
          "2010s–today — GPUs and AI accelerators fill data centres; a laptop chip has ~20 billion transistors.",
        ],
        figures: [
          { id: "vacuum-tubes", caption: "Vacuum tubes (valves) — the switches of the first generation", hint: "close-up photo of glowing vacuum tubes / a tube from ENIAC" },
          { id: "first-transistor", caption: "Replica of the first point-contact transistor, Bell Labs 1947", hint: "photo of the first transistor replica" },
          { id: "integrated-circuit", caption: "An integrated circuit die — thousands of transistors on one chip", hint: "macro photo of an IC die or Kilby's first IC" },
          { id: "intel-4004", caption: "Intel 4004 (1971) — the first microprocessor", hint: "photo of the Intel 4004 chip in its ceramic package" },
          { id: "altair-8800", caption: "MITS Altair 8800 (1975) — switches and lights, no screen, no keyboard", hint: "photo of the Altair 8800 front panel" },
          { id: "apple-ii-ibm-pc", caption: "Apple II (1977) and IBM PC 5150 (1981) — computing reaches homes and offices", hint: "side-by-side photos of the Apple II and IBM PC 5150" },
          { id: "iphone-2007", caption: "The iPhone (2007) — the computer becomes personal and permanent", hint: "photo of the original iPhone presentation or the device itself" },
          { id: "moores-law-chart", caption: "Moore's Law — transistor counts, 1971–today (log scale)", hint: "the classic Moore's Law transistor-count chart" },
        ],
      },
      {
        heading: "4. The evolution of software — machine code to AI",
        icon: "layers",
        paragraphs: [
          "Hardware is only half the story. The first programmers set switches and re-plugged cables (ENIAC), then wrote raw machine code — pure numbers — and assembly language, which gave the numbers names. Software as we know it began when languages let humans write something readable and a program translated it for the machine: Grace Hopper's compiler idea gave us FORTRAN (1957) for science and COBOL (1959) for business.",
          "Operating systems emerged in the 1960s so expensive machines could run many jobs; UNIX (1969, Bell Labs) introduced ideas — files, folders, users, permissions, small tools joined together — that live on in Linux, macOS, Android and even Windows. The PC era brought MS-DOS (1981) and then the graphical user interface: invented at Xerox PARC, made famous by the Macintosh (1984) and Windows. In 1991 two things changed everything: Linus Torvalds released Linux, proving world-class software could be built in the open by volunteers, and Tim Berners-Lee released the World Wide Web, turning the internet into a place. Browsers, e-mail and the web made software something you visit, not only something you install.",
          "The 2000s moved software off your machine: web applications, then 'software as a service' (Gmail, Microsoft 365), then app stores (2008) delivering programs to phones. Under it all, virtualisation let one physical server pretend to be many — the software trick that makes cloud computing possible. And the newest layer is AI: machine-learning models, and since 2022 large language models, which are trained on thousands of GPUs and are already part of the support technician's toolkit. Ada Lovelace's prediction — machines working with words, music and ideas, not just numbers — took 180 years to come true.",
        ],
        table: {
          headers: ["Era", "When", "What changed"],
          rows: [
            ["Plugboards & machine code", "1940s", "Programs are wiring and raw numbers"],
            ["Assembly & compilers", "1950s", "Humans write words; FORTRAN and COBOL translate them"],
            ["Operating systems & UNIX", "1960s–70s", "The machine manages itself: jobs, files, users"],
            ["PC software & the GUI", "1980s", "MS-DOS, Macintosh, Windows — computing for everyone"],
            ["Open source & the web", "1990s", "Linux, the World Wide Web, browsers"],
            ["Cloud, SaaS & apps", "2000s–10s", "Software lives in data centres; app stores on phones"],
            ["AI & large language models", "2010s–today", "Software that learns from data and generates language, code and images"],
          ],
        },
        figures: [
          { id: "punched-tape-code", caption: "Programs on punched cards and paper tape", hint: "photo of a punched-card program deck or paper tape reel" },
          { id: "unix-pdp11", caption: "Ken Thompson and Dennis Ritchie at the PDP-11 — birthplace of UNIX and C", hint: "the classic Bell Labs photo of Thompson & Ritchie at the PDP-11" },
          { id: "msdos-screen", caption: "MS-DOS — the C:\\> prompt every 1980s office knew", hint: "screenshot of an MS-DOS command prompt with a DIR listing" },
          { id: "mac-1984", caption: "The Macintosh (1984) brings the graphical user interface to the masses", hint: "photo of the original Macintosh 128K showing its desktop" },
          { id: "windows95-launch", caption: "Windows 95 — software becomes a cultural event", hint: "photo of a Windows 95 launch queue or the desktop with Start menu" },
          { id: "linux-tux", caption: "Linux — open source runs most of the world's servers (and Android phones)", hint: "Tux the penguin logo, or a Linux terminal screenshot" },
          { id: "www-berners-lee", caption: "Tim Berners-Lee and the first web server (a NeXT computer, 1991)", hint: "photo of Berners-Lee with the NeXT cube 'do not power down' machine" },
          { id: "ai-chat-llm", caption: "Large language models — software that writes language, code and images", hint: "screenshot of an AI chat assistant answering an IT support question" },
        ],
      },
      {
        heading: "5. Inside the case — motherboard, CPU and chipset",
        icon: "chip",
        paragraphs: [
          "Open any desktop and everything connects to one large circuit board: the motherboard. It carries the CPU socket, the RAM slots, the expansion slots, the storage connectors and the rear ports, and its chipset directs the traffic between them. Boards come in standard sizes (form factors) — ATX, the smaller Micro-ATX and the compact Mini-ITX — which must match the case. A small coin-cell battery (CR2032) keeps the clock and firmware settings alive when the machine is unplugged: when a PC starts 'forgetting' its date, that battery is your first suspect.",
          "The CPU (central processing unit) is the machine's brain — Babbage's 'mill' shrunk onto a fingernail of silicon. Its speed is set by how many cores it has (independent processing units — 4 to 16 in desktops), its clock speed in GHz (cycles per second), and its cache (tiny, very fast memory on the chip itself). Desktop CPUs come mainly from Intel (Core i3/i5/i7/i9, LGA sockets) and AMD (Ryzen 3/5/7/9, AM4/AM5 sockets) — the socket on the board must match the CPU exactly. Phones, tablets, Apple's M-series laptops and many new servers instead use ARM-based processors, which do more work per watt.",
          "The CPU produces serious heat and will slow itself down (thermal throttling) or shut off if it overheats — so it always wears a heatsink and fan (or liquid cooler) with a thin layer of thermal paste in between. A machine that runs fine for ten minutes and then crawls is very often a cooling problem: dust, a failed fan, or dried-out paste.",
        ],
        table: {
          headers: ["CPU spec", "What it means", "Rule of thumb"],
          rows: [
            ["Cores / threads", "Independent workers / tasks each core can juggle", "More cores = better multitasking, VMs, rendering"],
            ["Clock speed (GHz)", "Cycles per second per core", "Higher = snappier single tasks (within one generation)"],
            ["Cache (MB)", "On-chip memory, far faster than RAM", "More cache smooths repeated work"],
            ["Socket (e.g. LGA1700, AM5)", "Physical + electrical fit to the board", "CPU and motherboard socket must match exactly"],
            ["TDP (watts)", "Heat the cooler must remove", "Higher TDP needs a bigger cooler and PSU"],
          ],
        },
        figures: [
          { id: "motherboard-labelled", caption: "An ATX motherboard with every major part labelled", hint: "labelled diagram/photo of an ATX board: socket, RAM slots, PCIe, M.2, SATA, chipset, VRM, headers" },
          { id: "cpu-top-bottom", caption: "A desktop CPU — heat-spreader top and contact pads underneath", hint: "photo showing a CPU's top and its underside (LGA pads or PGA pins)" },
          { id: "cpu-in-socket", caption: "Seating a CPU in its socket — zero force, correct alignment triangle", hint: "photo of a CPU being placed into an open LGA/AM5 socket" },
          { id: "cpu-cooler-paste", caption: "Heatsink, fan and a pea-sized dot of thermal paste", hint: "photo of thermal paste application and a tower cooler being mounted" },
          { id: "cmos-battery", caption: "The CR2032 CMOS battery — keeps clock and settings alive", hint: "photo of the coin cell on a motherboard" },
        ],
      },
      {
        heading: "6. Memory — RAM, the machine's working desk",
        icon: "database",
        paragraphs: [
          "RAM (random access memory) is the computer's working space. Think of a desk and a filing cabinet: storage (the drive) is the filing cabinet where everything is kept permanently; RAM is the desktop where you spread out what you are busy with right now. A bigger desk lets you work on more things at once — but the desk is cleared every time the power goes off. RAM is volatile: its contents vanish at shutdown, which is why unsaved work is lost when the power trips.",
          "Desktop RAM comes as DIMM modules; laptops use the shorter SO-DIMM. Each generation — DDR3, DDR4, DDR5 — is faster and more efficient, and they are not interchangeable: the notch in the module physically prevents fitting the wrong generation. Fitting modules in matched pairs activates dual-channel mode, roughly doubling memory bandwidth. Servers use ECC (error-correcting code) RAM, which detects and fixes single-bit memory errors on the fly — essential when a machine must run for years without a wrong number.",
          "When RAM runs out, the operating system parks the least-used data on the drive instead (the page file / virtual memory) — and because even an SSD is far slower than RAM, the whole machine suddenly feels like it is wading through mud. That is why 'my PC is slow when I have many tabs and apps open' is usually a RAM problem, and why adding RAM is the most cost-effective upgrade for an ageing office PC.",
        ],
        table: {
          headers: ["Generation", "Typical speed", "Voltage", "Seen in"],
          rows: [
            ["DDR3", "1333–1866 MT/s", "1.5 V", "Machines from ~2008–2015"],
            ["DDR4", "2133–3200 MT/s", "1.2 V", "Most current office fleets"],
            ["DDR5", "4800–7200+ MT/s", "1.1 V", "New desktops & laptops from ~2022"],
          ],
        },
        bullets: [
          "How much is enough (2026): 8 GB = bare minimum office work · 16 GB = comfortable standard · 32 GB+ = power users, VMs, design work.",
          "Symptoms of too little RAM: slow with many apps/tabs, constant disk activity, 'out of memory' warnings.",
          "Symptoms of faulty RAM: random blue screens, corrupted files, failed boots with beep codes — test with Windows Memory Diagnostic or MemTest86.",
          "RAM has no moving parts and rarely wears out — but it must be seated firmly; a half-seated module is a classic no-boot cause.",
        ],
        figures: [
          { id: "ddr-dimm", caption: "A DDR4 DIMM — chips, gold edge connector and the keying notch", hint: "clear photo of a desktop RAM module" },
          { id: "dimm-vs-sodimm", caption: "Desktop DIMM vs laptop SO-DIMM", hint: "side-by-side photo of a DIMM and SO-DIMM" },
          { id: "ram-install", caption: "Seating RAM — open the clips, align the notch, press until they click", hint: "photo of RAM being pressed into motherboard slots" },
          { id: "ecc-server-ram", caption: "ECC registered DIMMs in a server board", hint: "photo of server RAM banks (many DIMM slots populated)" },
        ],
      },
      {
        heading: "7. Storage — HDD, SSD, NVMe, RAID and backups",
        icon: "folder",
        paragraphs: [
          "Storage is the filing cabinet: it keeps the operating system, applications and data permanently. For decades that meant the hard disk drive (HDD) — spinning magnetic platters at 5,400 or 7,200 rpm with read/write heads flying microns above them. HDDs are cheap per terabyte and still rule bulk storage, but they are mechanical: they are slow to find data (the heads must physically move), fragile when dropped, and they wear out. A clicking or grinding drive is a drive announcing its retirement — back it up immediately.",
          "The solid-state drive (SSD) stores data in flash memory chips — no moving parts, silent, shock-proof and dramatically faster. Early SSDs used the same SATA interface as hard drives (~550 MB/s ceiling); modern NVMe SSDs plug straight into the motherboard's M.2 slot and use PCIe lanes, reaching 3,500–7,000+ MB/s. Swapping an old machine's HDD for an SSD is the single most transformative upgrade in desktop support — boot times fall from minutes to seconds.",
          "Servers and storage arrays combine many drives with RAID (redundant array of independent disks) so that a drive can die without losing data or stopping work. And remember the golden rule that RAID is not a backup: it protects against a dead drive, not against deletion, ransomware, theft or fire. Real protection is the 3-2-1 rule — three copies of the data, on two different types of media, one of them off-site (or in the cloud). Tape (LTO) still guards the world's archives: slow to access, but cheap, long-lived and offline where ransomware cannot reach.",
        ],
        table: {
          headers: ["RAID level", "How it works", "Survives", "Cost"],
          rows: [
            ["RAID 0", "Striping — data split across drives", "Nothing — one dead drive loses all", "Fast, all capacity usable; never for important data"],
            ["RAID 1", "Mirroring — identical copies on two drives", "One drive failure", "Half the capacity"],
            ["RAID 5", "Striping + parity across 3+ drives", "One drive failure", "One drive's worth of parity"],
            ["RAID 6", "Striping + double parity across 4+ drives", "Two drive failures", "Two drives' worth of parity"],
            ["RAID 10", "Mirrored pairs, striped", "One per mirror pair", "Half the capacity; fast rebuilds — common for databases"],
          ],
        },
        bullets: [
          "Speed ladder (typical): HDD ~150 MB/s → SATA SSD ~550 MB/s → NVMe Gen3 ~3,500 MB/s → NVMe Gen4/5 7,000+ MB/s.",
          "Watch drive health with S.M.A.R.T. (CrystalDiskInfo or vendor tools) — reallocated sectors and pending sectors are early warnings.",
          "USB flash drives and memory cards are flash storage too — handy, but never the only copy of anything.",
          "Optical discs (CD/DVD/Blu-ray) are now mainly for archives and old software — many new PCs no longer ship with a drive.",
        ],
        figures: [
          { id: "hdd-open", caption: "Inside a hard drive — platters, arm and read/write heads", hint: "photo of an opened HDD showing platters and actuator arm" },
          { id: "ssd-vs-hdd", caption: "2.5-inch SATA SSD next to a 3.5-inch HDD", hint: "side-by-side photo of an SSD and HDD" },
          { id: "m2-nvme", caption: "An M.2 NVMe SSD — a whole drive on a stick of gum", hint: "photo of an M.2 NVMe drive being fitted to a motherboard slot" },
          { id: "sata-cables", caption: "SATA data and power connectors", hint: "photo of SATA data cable and SATA power connector" },
          { id: "raid-diagram", caption: "RAID 0, 1, 5 and 10 visualised", hint: "diagram showing striping, mirroring and parity layouts" },
          { id: "lto-tape", caption: "LTO tape cartridge and drive — the archive workhorse", hint: "photo of an LTO tape cartridge/drive or tape library robot" },
        ],
      },
      {
        heading: "8. Ports, connectors and cables",
        icon: "design",
        paragraphs: [
          "The back (and front) panel of a computer is where the support technician lives. Knowing every port on sight — and which cable, speed and adapter belongs to it — turns 'my screen is blank' calls from mysteries into thirty-second fixes.",
          "USB (universal serial bus) replaced a zoo of older connectors and now does everything: keyboards, printers, storage, phones, docks and even charging laptops. The trap is that the connector shape and the speed are separate things — a USB-C port may run at anything from USB 2.0 speed to USB4/Thunderbolt speeds, so read the spec, not the shape. Colour hints help: black = USB 2.0, blue = 3.0 (5 Gbps), teal/red often faster or always-powered.",
          "For displays, modern machines use HDMI (TVs, projectors, most monitors) and DisplayPort (high resolutions and refresh rates, daisy-chaining, standard on business docks); older fleets still carry blue VGA (analogue, fuzzy at high resolution) and white DVI. USB-C with 'DP Alt Mode' can carry DisplayPort video, power and data down one cable — which is why one dock cable now runs a whole desk. Networking uses the RJ45 jack (Ethernet) — and its little cousin RJ11 is telephone/ADSL, a classic mix-up. Legacy round PS/2 keyboard/mouse ports, serial (COM) and parallel printer ports still appear on industrial gear, point-of-sale machines and old lab equipment.",
        ],
        table: {
          headers: ["USB standard", "Marketing name", "Max speed", "Connector(s)"],
          rows: [
            ["USB 1.1", "Full Speed", "12 Mbps", "Type-A/B"],
            ["USB 2.0", "Hi-Speed", "480 Mbps", "Type-A/B, Mini, Micro"],
            ["USB 3.2 Gen 1", "SuperSpeed (was 3.0)", "5 Gbps", "Type-A (blue), Type-C"],
            ["USB 3.2 Gen 2", "SuperSpeed+", "10 Gbps", "Type-A, Type-C"],
            ["USB4 / Thunderbolt 3–4", "—", "20–40 Gbps", "Type-C only"],
          ],
        },
        bullets: [
          "Video ranking for sharp, fast displays: DisplayPort ≥ HDMI 2.x > DVI > VGA. For a 4K or high-refresh monitor, reach for DisplayPort or HDMI 2.1.",
          "HDMI and DisplayPort carry audio too; VGA and DVI do not.",
          "RJ45 = network, RJ11 = telephone — the RJ11 plug fits loosely into an RJ45 socket and will 'connect' nothing.",
          "3.5 mm audio jacks: green = line out/headphones, pink = microphone, blue = line in.",
          "USB-C docks/dongles are the modern toolkit: one port becomes power + display + network + USB — but a cheap cable that only carries USB 2.0 will silently break displays and speed.",
        ],
        figures: [
          { id: "rear-io-panel", caption: "A rear I/O panel with every port labelled", hint: "labelled photo of a desktop rear panel: USB-A/C, HDMI, DP, RJ45, audio jacks, PS/2" },
          { id: "usb-connector-types", caption: "USB connector family — A, B, Mini, Micro and C", hint: "chart/photo of USB connector types side by side" },
          { id: "video-connectors", caption: "VGA, DVI, HDMI and DisplayPort compared", hint: "photo of the four video connectors/cables side by side" },
          { id: "rj45-rj11", caption: "RJ45 (network) vs RJ11 (telephone) — same family, different jobs", hint: "close-up of RJ45 and RJ11 plugs together" },
          { id: "usbc-dock", caption: "One USB-C/Thunderbolt dock cable running a whole desk", hint: "photo of a laptop on a dock with monitors, network and peripherals attached" },
        ],
      },
      {
        heading: "9. Power, cooling, graphics and expansion",
        icon: "settings",
        paragraphs: [
          "The power supply unit (PSU) converts 230 V AC from the wall into the low-voltage DC the components need, delivered over standard connectors: the 24-pin motherboard cable, the 4/8-pin CPU (EPS) cable, 6/8-pin PCIe connectors for graphics cards and SATA power for drives. PSUs are rated in watts and by efficiency (80 Plus Bronze/Gold/Platinum). A failing PSU is a master of disguise — random restarts, crashes under load, machines that 'sometimes' refuse to start — so a PSU tester earns its place in every toolkit. In South Africa, load shedding makes clean power part of the job: at minimum a surge protector on every machine, and a desktop UPS for anything that matters, sized to allow a graceful shutdown.",
          "The GPU (graphics processing unit) draws every pixel. Integrated graphics (built into the CPU) are fine for office work; a discrete graphics card with its own VRAM is needed for design, CAD, video editing, gaming — and, because a GPU is thousands of small cores working in parallel, for AI. The same architecture that draws triangles trains neural networks, which is why the AI boom is, at heart, a graphics-card boom. Cards plug into the motherboard's PCIe x16 slot; PCIe also hosts capture cards, 10 Gb network cards and NVMe adapters, with each generation doubling bandwidth.",
          "All of it makes heat, and heat is the enemy of silicon. Case fans create front-to-back airflow; CPU coolers move heat from the chip; all-in-one liquid coolers pump it to a radiator. Dust is insulation and a fan-killer: a machine in a workshop or under a desk breathes dust all day, so periodic cleaning with compressed air (machine off, fans held still) is genuine preventative maintenance, not cosmetics.",
        ],
        bullets: [
          "PSU connectors to recognise: 24-pin ATX (board), 8-pin EPS (CPU), 6/8-pin PCIe (GPU), SATA power (drives), Molex (legacy).",
          "Never open a PSU — its capacitors hold lethal charge long after unplugging. Faulty unit = replace unit.",
          "UPS types: standby (basic desktop), line-interactive (voltage smoothing — right for SA offices), online double-conversion (servers, zero-transfer time).",
          "Symptoms ladder: random reboots under load → suspect PSU or overheating; artifacts/lines on screen → suspect GPU or its memory; sudden shutdowns after minutes → suspect cooling/dust.",
          "Thermal paste dries out over years — repasting an old, hot-running laptop often drops temperatures 10–15 °C.",
        ],
        figures: [
          { id: "psu-connectors", caption: "A modular PSU and its connector family", hint: "photo of a PSU with 24-pin, EPS, PCIe and SATA cables labelled" },
          { id: "gpu-card", caption: "A discrete graphics card — GPU die, VRAM, fans and PCIe edge", hint: "photo of a graphics card, ideally with cooler removed showing the die" },
          { id: "pcie-slots", caption: "PCIe x16 and x1 slots on a motherboard", hint: "photo showing different-length PCIe slots" },
          { id: "aio-cooler", caption: "An all-in-one liquid cooler — pump block, tubes and radiator", hint: "photo of an AIO liquid cooler installed in a case" },
          { id: "dusty-pc", caption: "Why preventative maintenance exists", hint: "photo of a dust-choked heatsink/fan before cleaning" },
          { id: "desktop-ups", caption: "A desktop line-interactive UPS — load-shedding survival kit", hint: "photo of a small office UPS with a PC plugged in" },
        ],
      },
      {
        heading: "10. Peripherals and printers",
        icon: "monitor",
        paragraphs: [
          "Peripherals are the hardware at the edge of the system — where humans meet the machine. Input devices: keyboards, mice, scanners, webcams, barcode readers, signature pads. Output devices: monitors, speakers, headsets and printers. Monitors are judged by panel type (IPS = accurate colours and angles, VA = contrast, TN = cheap and fast), resolution (Full HD 1920×1080 → QHD → 4K), refresh rate (60 Hz office standard; 120 Hz+ for smooth motion) and connector (HDMI/DisplayPort — see section 8).",
          "Printers cause more support tickets per rand than any other device, so know them cold. The laser printer is the office standard: a laser draws the page as static charge on a rotating drum, powdered toner sticks to the charge, and the fuser melts it onto the paper — fast, sharp text and the lowest cost per page in volume. The inkjet sprays microscopic ink droplets — brilliant for photos and small-office colour, but the ink is expensive per page and clogs if unused. Thermal printers darken heat-sensitive paper — every till slip and shipping label; no ink or toner at all, but the print fades. The dot-matrix impact printer hammers pins through a ribbon — obsolete except where it is irreplaceable: multi-part carbon invoices and delivery notes. 3D printers extrude melted plastic layer by layer to 'print' objects — increasingly found printing jigs, brackets and replacement clips. Multifunction printers (MFPs) combine printer, scanner, copier and sometimes fax, and in businesses they are shared network devices with their own IP address, print queues and driver deployment.",
          "Consumables and cost-per-page decide what an office should buy: a laser's toner cartridge and drum yield thousands of pages cheaply; inkjet cartridges yield hundreds expensively. And learn the classic fault signatures — a repeating smudge every few centimetres is a damaged drum; ghost images mean fuser or drum; streaks usually mean toner low or a dirty corona wire; paper jams trace to worn pickup rollers or the wrong paper weight.",
        ],
        table: {
          headers: ["Printer type", "How it prints", "Best at", "Watch out for"],
          rows: [
            ["Laser", "Static charge on a drum + toner, fused by heat", "Office volume — fast, sharp, cheapest per page", "Drum damage, fuser wear, toner mess if cartridge cracked"],
            ["Inkjet", "Sprays liquid ink droplets", "Photos, colour, low-volume home/small office", "Costly ink, clogged nozzles when idle"],
            ["Thermal", "Heats special coated paper", "Receipts, labels, tickets — silent, no consumable ink", "Print fades; special paper only"],
            ["Dot-matrix", "Pins strike an inked ribbon", "Multi-part carbon forms, dusty warehouses", "Slow, loud, low quality"],
            ["3D (FDM)", "Extrudes melted filament in layers", "Prototypes, brackets, replacement parts", "Slow; bed-levelling and filament care"],
          ],
        },
        bullets: [
          "Connecting printers: USB (one desk), network cable or Wi-Fi (shared, own IP address), or via a print server. Business MFPs authenticate users and hold jobs until badge release (secure/'follow-me' print).",
          "Driver rule: the operating system needs the right driver for the exact model — most 'printer prints gibberish' tickets are wrong-driver tickets.",
          "Fault signatures: repeating marks = drum · ghosting = fuser/drum · streaks = toner/corona · jams = rollers/paper · 'offline' = queue stuck, IP changed or sleep mode.",
          "Scanners on MFPs commonly scan-to-email or scan-to-folder (SMB) — when scanning breaks after a password change, that stored credential is the culprit.",
          "KVM switches let one Keyboard, Video (monitor) and Mouse control several machines — server rooms and testing benches.",
        ],
        figures: [
          { id: "monitor-panels", caption: "Monitor panel types and resolutions compared", hint: "comparison image of IPS/VA/TN panels or a resolution size chart" },
          { id: "laser-printer-cutaway", caption: "Inside a laser printer — drum, toner, laser unit and fuser", hint: "cutaway diagram of the laser printing process" },
          { id: "toner-drum", caption: "Toner cartridge and imaging drum", hint: "photo of a toner cartridge and separate drum unit" },
          { id: "inkjet-printhead", caption: "Inkjet cartridges and print head", hint: "photo of inkjet cartridges/print head" },
          { id: "thermal-receipt", caption: "Thermal receipt printer — no ink, just heat", hint: "photo of a POS thermal printer printing a till slip" },
          { id: "dot-matrix", caption: "Dot-matrix printer with fan-fold multi-part paper", hint: "photo of a dot-matrix printer and carbon-copy forms" },
          { id: "printer-3d", caption: "A 3D printer building a part layer by layer", hint: "photo of an FDM 3D printer mid-print" },
          { id: "office-mfp", caption: "A network multifunction printer — print, scan, copy for a whole floor", hint: "photo of an office MFP with its control panel" },
        ],
      },
      {
        heading: "Day 2 · 11. Network hardware — connecting it all",
        icon: "network",
        paragraphs: [
          "Day 2 zooms out: from one computer to all of them. Every networked device needs a NIC (network interface card) — today built into every motherboard (Gigabit or 2.5 Gb Ethernet) and every laptop (Wi-Fi). From there, the switch is the heart of the LAN: it connects the devices in a building and forwards traffic only to the port where the destination lives. Unmanaged switches are plug-and-play; managed switches add configuration — VLANs to separate departments, monitoring, and security. PoE (power over Ethernet) switches send electricity down the network cable itself, powering wireless access points, IP cameras and desk phones with no plug point needed.",
          "The router connects networks to each other — in practice, your LAN to the internet. It is the gateway: it translates private office addresses to the public internet (NAT), usually hands out addresses (DHCP) and holds the first firewall rules. In businesses a dedicated firewall appliance (FortiGate, Palo Alto, pfSense) inspects traffic in depth. The link to the outside world arrives through a modem or, with fibre, an ONT (optical network terminal) — fibre-to-the-business is now the South African standard, with LTE/5G as backup.",
          "Wireless access points (APs) give Wi-Fi coverage — ceiling-mounted in a grid, all fed and powered by cabled PoE runs back to the switch: wireless for the users is cables for the technician. And the cabling itself is hardware you will handle weekly: UTP copper in categories (Cat5e = 1 Gbps, Cat6/6a = up to 10 Gbps) terminated in RJ45 plugs, wall boxes and patch panels in the server cabinet; fibre optic for long runs and between buildings (multimode for short hops, single-mode for kilometres), plugged into switches via small SFP transceiver modules. Neat patch cabling is not vanity — it is the difference between a five-minute fault trace and an afternoon of despair.",
        ],
        table: {
          headers: ["Device", "Job", "Where you meet it"],
          rows: [
            ["NIC", "Connects one device to the network", "Every PC, printer and server"],
            ["Switch", "Connects devices in a LAN; forwards frames per port", "Network cabinet on every floor"],
            ["Router", "Connects networks; gateway to the internet (NAT, routing)", "Server room / comms cabinet"],
            ["Firewall", "Allows/blocks traffic by rules; inspects threats", "Between the LAN and the internet"],
            ["Access point", "Wi-Fi radio bridged to the wired LAN", "Ceilings, fed by PoE"],
            ["Modem / ONT", "Converts provider signal (fibre/DSL/LTE) to Ethernet", "Where the line enters the building"],
            ["Patch panel", "Neat termination of all wall-point cables", "Top of the network cabinet"],
          ],
        },
        bullets: [
          "Cable categories: Cat5e → 1 Gbps · Cat6 → 10 Gbps to 55 m · Cat6a → 10 Gbps to 100 m. Max run 100 m including patch leads.",
          "Wi-Fi generations: Wi-Fi 4 (n) → 5 (ac) → 6/6E (ax, adds 6 GHz) → 7 (be). Coverage and interference matter more than the number on the box.",
          "Fibre: multimode (orange/aqua, short runs) vs single-mode (yellow, long runs); handled via SFP/SFP+ modules in switch ports.",
          "A link light tells a story: solid/blinking = link and traffic; dead = cable, port or NIC. Cable testers and a tone generator are the network tech's stethoscope.",
          "Home-vs-enterprise: the home 'router' is really router + switch + AP + modem in one plastic box; enterprises separate them so each can scale and fail independently.",
        ],
        figures: [
          { id: "nic-card", caption: "A PCIe network interface card (and the onboard RJ45 it replaces)", hint: "photo of a NIC card / motherboard Ethernet port" },
          { id: "managed-switch", caption: "A 48-port managed PoE switch in a rack", hint: "photo of an enterprise switch with patch cables" },
          { id: "router-firewall", caption: "Business router and firewall appliance", hint: "photo of an enterprise router/firewall (e.g. FortiGate) in a cabinet" },
          { id: "wifi-ap", caption: "Ceiling wireless access point, powered by PoE", hint: "photo of a ceiling-mounted AP" },
          { id: "patch-panel", caption: "Patch panel and cable management — every wall point ends here", hint: "photo of a tidy patch panel with labelled ports" },
          { id: "cat6-rj45", caption: "Cat6 UTP cable and RJ45 termination", hint: "photo of UTP cable pairs and a crimped RJ45 plug" },
          { id: "fibre-sfp", caption: "Fibre patch leads and SFP transceivers", hint: "photo of fibre cables (LC connectors) and SFP modules" },
          { id: "onts-fibre", caption: "Fibre ONT — where the internet enters the building", hint: "photo of a fibre ONT/CPE on a wall" },
        ],
      },
      {
        heading: "12. Data centre hardware — where the servers live",
        icon: "server",
        paragraphs: [
          "A data centre is a building engineered to keep computers alive: continuous power, continuous cooling, continuous connectivity, and physical security. The computers themselves are servers — machines built for reliability rather than looks: ECC RAM, redundant hot-swappable power supplies and drives, and a management port (iDRAC/iLO) that lets a technician power, monitor and even reinstall the machine remotely. Servers come as towers (small offices), rack servers (the standard — flat 'pizza boxes' measured in rack units: 1U = 4.45 cm, in 42U cabinets), and blades (many thin servers sharing one chassis's power and networking).",
          "Storage in the data centre outgrows single machines: DAS is storage directly attached to one server; a NAS is a storage appliance serving files over the network (shared folders); a SAN is a dedicated high-speed storage network (Fibre Channel or iSCSI) presenting raw disk volumes to many servers — the storage arrays behind databases and virtual machine farms, full of hot-swappable drives, dual controllers and battery-backed cache.",
          "Then the life-support systems. Power: utility feed(s) → UPS rooms full of batteries that bridge the gap instantly → diesel generators that carry the load for hours — critical in South Africa, where load shedding makes the generator yard the most important 'hardware' on site. Rack-level PDUs (power distribution units) feed each cabinet, ideally from two independent paths (A+B) so one failure drops nothing. Cooling: CRAC units and chilled-water systems push cold air through raised floors or contained hot/cold aisles — servers face cold aisles, exhaust into hot aisles, and containment stops the two mixing. Redundancy is described as N+1 (one spare of everything) or 2N (a complete duplicate), and facilities are graded Tier I–IV on how much can fail without downtime. Add biometric access control, CCTV, fire suppression that won't destroy electronics (inert gas, not water), and environmental sensors watching temperature and humidity — every one of these is hardware someone must support.",
        ],
        table: {
          headers: ["Storage model", "What it is", "Typical use"],
          rows: [
            ["DAS", "Disks attached directly to one server", "Small setups, backups, scratch space"],
            ["NAS", "File-serving appliance on the LAN (SMB/NFS)", "Departmental shared folders, media"],
            ["SAN", "Dedicated storage network presenting block volumes", "Databases, VM farms, enterprise storage arrays"],
          ],
        },
        bullets: [
          "Rack maths: cabinets are 42U high; a 1U server is 4.45 cm; blade chassis pack the most compute per U.",
          "Hot-swap culture: PSUs, fans and drives are replaced with the machine running — never assume; check the light (amber = attention, blue = identify).",
          "Power chain to memorise: utility → transfer switch → generator → UPS → PDU → server PSU A/B.",
          "N+1 = one spare (four aircon units where three suffice); 2N = everything fully duplicated.",
          "Out-of-band management (iDRAC/iLO) is the remote hands: BIOS, power and console over the network even when the OS is dead.",
          "South African reality: a data centre's diesel contract and battery health matter as much as its bandwidth.",
        ],
        figures: [
          { id: "datacentre-aisle", caption: "A data centre aisle — racks, structured cabling, contained airflow", hint: "photo down a data-centre cold aisle" },
          { id: "rack-42u", caption: "A 42U rack — servers, switches, PDU and cable management labelled", hint: "labelled photo/diagram of a populated server rack" },
          { id: "rack-server-1u", caption: "A 1U rack server slid out on rails — hot-swap drives in front", hint: "photo of a 1U/2U server showing drive bays" },
          { id: "blade-chassis", caption: "A blade chassis — many servers, one enclosure", hint: "photo of a blade enclosure with blades partially removed" },
          { id: "san-array", caption: "A SAN storage array — shelves of hot-swappable drives", hint: "photo of an enterprise storage array" },
          { id: "ups-room", caption: "The UPS battery room — seconds of grace, bought in advance", hint: "photo of data-centre UPS units/battery strings" },
          { id: "diesel-generator", caption: "Standby diesel generators — hours of runtime when the grid fails", hint: "photo of industrial standby generators" },
          { id: "hot-cold-aisle", caption: "Hot/cold aisle containment — cooling as architecture", hint: "diagram of hot/cold aisle airflow" },
          { id: "rack-pdu", caption: "Rack PDUs on A and B power paths", hint: "photo of vertical rack PDUs with dual feeds" },
        ],
      },
      {
        heading: "13. Cloud hardware — the computers behind 'the cloud'",
        icon: "globe",
        paragraphs: [
          "'The cloud' is not weather — it is other people's data centres, rented over the internet. When Investec runs a workload in Microsoft Azure or AWS, that workload executes on physical servers in a hyperscale data centre: a warehouse-sized facility holding hundreds of thousands of servers, built in standardised halls, where hardware is replaced by the rack rather than the machine. Both Azure and AWS operate cloud regions physically located in Johannesburg (and AWS in Cape Town) — 'the cloud' can be twenty minutes up the M1.",
          "Cloud providers organise hardware into regions (a metro area) containing availability zones (independent data centres with separate power, cooling and networks) so customers survive a whole-building failure. The magic ingredient is virtualisation: a hypervisor on each physical host slices it into many virtual machines, so one 128-core server safely runs workloads for dozens of customers. When you click 'create VM', no human moves; software finds spare capacity on a host and carves you a slice — hardware as an API.",
          "The AI era has reshaped this hardware: training and running large models needs GPU clusters — racks of accelerator boards (NVIDIA H100-class GPUs, Google TPU pods) joined by ultra-fast InfiniBand networks and increasingly liquid-cooled, drawing so much power that new data centres are planned around electricity supply first. Meanwhile edge and CDN nodes place small clusters close to users so content loads fast, and South Africa reaches the world's clouds through undersea fibre cables — WACS, EASSy, Equiano and 2Africa — the least visible, most important hardware in the country. Someone still racks, cables and repairs all of this: 'data centre technician' is a genuine career path for systems support graduates.",
        ],
        table: {
          headers: ["Layer", "You manage", "Provider's hardware does"],
          rows: [
            ["On-premises", "Everything — building to browser", "—"],
            ["IaaS (e.g. Azure VMs)", "OS, apps, data", "Servers, storage, network, building"],
            ["PaaS (e.g. managed database)", "Apps and data only", "Everything below the platform"],
            ["SaaS (e.g. Microsoft 365)", "Your data and settings", "Absolutely everything else"],
          ],
        },
        bullets: [
          "Region = metro with data centres · Availability zone = independent building(s) · put two copies in two zones and a building can burn down without downtime.",
          "Hypervisors you'll hear about: VMware ESXi, Microsoft Hyper-V, KVM/Proxmox — the same idea at every scale, from a test bench to Azure.",
          "Why GPUs for AI: thousands of small cores doing the same sum on different data — matrix arithmetic is exactly what neural networks need.",
          "Undersea cables land at Melkbosstrand, Yzerfontein, Duduza & Amanzimtoti — a ship's anchor dragging a cable can slow a whole country's internet (it has happened).",
          "Shared responsibility: the provider secures the hardware; you still secure your data, identities and configuration — 'in the cloud' never means 'not my problem'.",
        ],
        figures: [
          { id: "hyperscale-aerial", caption: "A hyperscale data centre campus from the air", hint: "aerial photo of a hyperscale data-centre campus" },
          { id: "cloud-regions-map", caption: "Cloud regions in South Africa — Johannesburg and Cape Town", hint: "map of Azure/AWS regions in Africa" },
          { id: "hypervisor-diagram", caption: "One physical host, many virtual machines — the hypervisor", hint: "diagram of VMs on a hypervisor on hardware" },
          { id: "gpu-cluster", caption: "An AI GPU cluster — accelerator trays and InfiniBand cabling", hint: "photo of a GPU server/rack (e.g. DGX/H100 systems)" },
          { id: "liquid-cooled-rack", caption: "Liquid cooling reaches the rack — AI density demands it", hint: "photo of liquid-cooled server infrastructure / TPU pod" },
          { id: "undersea-cable-map", caption: "The undersea cables connecting South Africa to the world", hint: "map of WACS/EASSy/Equiano/2Africa cable routes" },
          { id: "cable-landing", caption: "Submarine fibre cable — the internet is mostly under the sea", hint: "photo of a submarine cable cross-section or cable-laying ship" },
        ],
      },
      {
        heading: "14. Software today — types, operating systems and licensing",
        icon: "layers",
        paragraphs: [
          "Software divides into layers a technician must tell apart, because each fails differently. Firmware lives inside devices (UEFI/BIOS, SSD controllers, printer firmware). Drivers teach the operating system to speak to specific hardware — half of all 'hardware' faults are really driver faults. The operating system manages everything: processes, memory, storage, devices, users and security. Utilities keep the system healthy (backup, antivirus/EDR, disk tools, remote support). Applications do the actual work people bought the computer for — from Office and browsers to core banking systems.",
          "The operating systems you will support: Windows 11 on the desktop fleet and Windows Server (Active Directory, file/print, group policy) in the back office; macOS on design and executive machines; Linux (Ubuntu, Red Hat, Debian) running most servers, appliances and the entire cloud; Android and iOS on every phone — managed through MDM (mobile device management) rather than by visiting desks. Updates are not optional housekeeping: unpatched software is how ransomware gets in, so businesses stage and push patches centrally (Windows Update for Business, Intune, WSUS) — and firmware needs patching too.",
          "Finally, licensing — because software is bought as a right to use, not a thing. OEM licences live and die with the machine they shipped on; retail licences move with the owner; volume licensing covers fleets; subscription (Microsoft 365, Adobe) rents always-current software per user per month; and open-source licences (GPL, MIT, Apache) grant free use with conditions. Using software outside its licence is piracy — a real legal and financial risk that software vendors audit for — and a professional-ethics matter for you under this qualification.",
        ],
        table: {
          headers: ["Licence type", "How it works", "Example"],
          rows: [
            ["OEM", "Pre-installed; tied to that machine forever", "Windows 11 Home on a bought laptop"],
            ["Retail (FPP)", "Bought separately; transferable to a new machine", "Boxed/downloaded Windows or Office"],
            ["Volume", "One agreement covering many machines/users", "Enterprise Windows + Office fleet"],
            ["Subscription (SaaS)", "Per user per month, always updated", "Microsoft 365, Adobe Creative Cloud"],
            ["Open source", "Free to use/modify under licence conditions", "Linux (GPL), VS Code parts (MIT)"],
            ["Freeware / trial", "Free to use, but not open; trials expire", "7-Zip (free), WinRAR (nagware)"],
          ],
        },
        bullets: [
          "Software stack in one line: firmware → drivers → operating system → utilities → applications.",
          "The OS's six jobs: run programs (processes), share memory, manage files, drive devices, control users/permissions, present an interface.",
          "Patch discipline: security updates promptly, feature updates staged; test, then deploy in rings.",
          "Drivers from the vendor beat drivers from 'driver booster' utilities — never install driver-updater tools on fleet machines.",
          "Antivirus has grown into EDR (endpoint detection & response) — agents that watch behaviour, not just known virus signatures.",
        ],
        figures: [
          { id: "os-family", caption: "The operating systems a support tech meets in one week", hint: "collage of Windows 11, Windows Server, macOS, Ubuntu, Android and iOS screens/logos" },
          { id: "task-manager", caption: "Task Manager — watching processes, memory and the page file live", hint: "screenshot of Windows Task Manager performance tab" },
          { id: "device-manager", caption: "Device Manager — where driver problems show their yellow triangles", hint: "screenshot of Windows Device Manager with a flagged device" },
          { id: "linux-server-terminal", caption: "A Linux server — no desktop, just work", hint: "screenshot of a Linux SSH terminal (htop or systemctl output)" },
          { id: "licence-diagram", caption: "Licence models compared — own, rent, share", hint: "diagram comparing OEM/retail/volume/subscription/open-source licensing" },
        ],
      },
      {
        heading: "15. The boot process — hardware and software shake hands",
        icon: "play",
        paragraphs: [
          "Everything in this lesson meets in the thirty seconds after the power button. Press it, and the PSU runs a self-check before signalling 'power good'. The CPU wakes and executes the UEFI/BIOS firmware from a chip on the motherboard. The firmware runs POST (power-on self-test) — checking CPU, RAM and essential devices — and if something fundamental is broken, it reports with beep codes or diagnostic LEDs, because the screen may not even work yet. POST passed, the firmware works down the boot order to find a bootable device, loads the bootloader (Windows Boot Manager or Linux's GRUB), which loads the operating system kernel, which loads drivers and services, and finally the login screen appears. Firmware → bootloader → kernel → drivers → services → user: hardware handing over to software, layer by layer.",
          "This sequence is your diagnostic map, because where the boot stops tells you what is broken. Completely dead (no fans, no lights) = power: wall socket, cable, PSU switch, PSU. Fans spin but no display and no beep = motherboard/CPU/RAM seating — reseat RAM first. Beeps or LED pattern = the code names the culprit (usually RAM or GPU). 'No boot device found' = drive dead, cable loose, or boot order pointing somewhere silly (a leftover USB stick is the classic). Windows starts then blue-screens = usually a driver or failing disk — note the stop code, boot Safe Mode. Slow from cold but fine warm = old HDD gasping; check S.M.A.R.T. and get the data off.",
        ],
        table: {
          headers: ["Where boot stops", "Prime suspects", "First moves"],
          rows: [
            ["Nothing at all", "Power: socket, cable, PSU", "Test wall point, cable, PSU tester"],
            ["Fans spin, black screen, no beep", "RAM seating, CPU, board", "Reseat RAM/GPU, minimal boot"],
            ["Beep code / debug LED", "Per code — often RAM or GPU", "Look up the code; reseat named part"],
            ["'No boot device'", "Drive, cable, boot order", "Check UEFI boot order & drive detection"],
            ["Blue screen during OS load", "Driver, disk, recent update", "Stop code, Safe Mode, disk health"],
            ["Boots but crawls", "Full disk, dying HDD, low RAM, malware", "S.M.A.R.T., Task Manager, disk space"],
          ],
        },
        figures: [
          { id: "post-screen", caption: "POST — the firmware checking hardware before any OS exists", hint: "photo/screenshot of a POST/UEFI splash screen with device checks" },
          { id: "uefi-setup", caption: "UEFI setup — boot order, drive detection, temperatures", hint: "photo of a UEFI/BIOS setup screen showing boot order" },
          { id: "boot-sequence-diagram", caption: "The boot chain: firmware → bootloader → kernel → drivers → login", hint: "flow diagram of the boot sequence" },
          { id: "bsod", caption: "A stop error (BSOD) — the code is the clue, not the catastrophe", hint: "photo of a Windows blue screen with a stop code" },
        ],
      },
    ],
    exercises: [
      {
        id: "hwsw-identify",
        title: "Exercise 1 — Know your hardware",
        task: "Answer as a support technician would: name the component, then justify it from how the hardware works.",
        scenario: [
          "You are on the IT support desk. Each question below is a real ticket or purchasing decision. Answer in full sentences — name the hardware, and explain WHY, using what you learned about how it works.",
        ],
        steps: [
          "A user's PC is painfully slow whenever they have many browser tabs and Excel open at once, and the disk light flickers constantly. Which single upgrade would help most, and why?",
          "Explain the difference between an HDD and an SSD, and which one you would specify for a new laptop and why.",
          "A designer gets a new 4K monitor that must run at a high refresh rate. Which cable/port should they use, and why not VGA?",
          "The finance department prints about 5,000 pages of reports a month. Which printer type do you recommend, and why?",
          "Name the device that connects all the office PCs to each other, and the device that connects the office network to the internet — and describe what each one does.",
        ],
        checks: [
          {
            answer: [
              "Add more RAM (memory).",
              "With too little RAM the operating system pages to the much slower drive (virtual memory), which is why the disk light flickers and everything crawls when many applications are open. More RAM gives the machine a bigger working desk, so it stops swapping to disk.",
            ],
            concepts: [
              ["ram", "memory"],
              ["page", "paging", "swap", "virtual memory", "page file", "disk instead", "slower drive", "slower disk"],
              ["more apps", "many apps", "many tabs", "multitask", "working", "at once", "desk"],
            ],
            labels: ["names RAM as the upgrade", "links slowness to paging/virtual memory on the disk", "links RAM to holding many open apps"],
            min: 2,
          },
          {
            answer: [
              "An HDD stores data on spinning magnetic platters read by moving heads — mechanical, cheaper per terabyte, but slower and fragile when dropped.",
              "An SSD stores data in flash memory chips with no moving parts — much faster, silent and shock-resistant.",
              "For a laptop: an SSD, because laptops get moved and knocked (no moving parts to damage) and the speed transforms boot and application load times.",
            ],
            concepts: [
              ["platter", "spinning", "magnetic", "moving parts", "mechanical", "heads"],
              ["flash", "no moving", "chips", "solid state", "nand"],
              ["faster", "speed", "quicker", "boot"],
              ["ssd"],
              ["shock", "drop", "knock", "fragile", "durable", "robust"],
            ],
            labels: ["HDD = spinning platters/mechanical", "SSD = flash, no moving parts", "SSD is faster", "chooses SSD for the laptop", "durability/shock reason for laptops"],
            min: 3,
          },
          {
            answer: [
              "Use DisplayPort (or HDMI 2.1) — these digital connections have the bandwidth for 4K at high refresh rates.",
              "VGA is an old analogue standard: it cannot carry the bandwidth for 4K/high refresh, and the analogue signal goes soft and fuzzy at high resolutions.",
            ],
            concepts: [
              ["displayport", "display port", "hdmi 2.1", "hdmi2.1"],
              ["bandwidth", "refresh", "high resolution", "4k"],
              ["analogue", "analog", "old", "fuzzy", "blurry", "quality", "cannot", "can't"],
            ],
            labels: ["names DisplayPort/HDMI 2.1", "bandwidth/refresh reasoning", "why VGA fails (analogue/low bandwidth)"],
            min: 2,
          },
          {
            answer: [
              "A laser printer (a networked office laser / MFP).",
              "Lasers are built for volume: fast pages per minute, sharp text, and toner gives by far the lowest cost per page — inkjet ink at that volume would cost a fortune and the printer would not keep up.",
            ],
            concepts: [
              ["laser"],
              ["cost per page", "toner", "cheaper", "cost-effective", "economical", "volume", "high volume"],
              ["fast", "speed", "pages per minute", "duty"],
            ],
            labels: ["recommends laser", "cost-per-page/toner reasoning", "speed/volume reasoning"],
            min: 2,
          },
          {
            answer: [
              "The switch connects all the office devices into the local network and forwards traffic to the correct port.",
              "The router is the gateway that connects the office network to the internet (and other networks), routing traffic and translating private addresses (NAT).",
            ],
            concepts: [
              ["switch"],
              ["router"],
              ["gateway", "internet", "nat", "between networks", "connects networks", "routes"],
              ["forwards", "port", "connects devices", "local", "lan"],
            ],
            labels: ["names the switch", "names the router", "router's gateway/internet role", "switch's LAN role"],
            min: 3,
          },
        ],
      },
      {
        id: "hwsw-history-cloud",
        title: "Exercise 2 — From Ada to the cloud",
        task: "Connect the history of computing to the hardware behind today's cloud.",
        scenario: [
          "Answer in your own words. Marks come from the key ideas, not from perfect wording.",
        ],
        steps: [
          "Who is regarded as the first computer programmer, and what exactly did she do a century before computers existed?",
          "Before machines, what did the word 'computer' mean — and who did that work at NASA in the 1950s and 60s?",
          "What was ENIAC, and what was remarkable about how it was programmed?",
          "Your branch manager asks: 'Where IS the cloud, actually?' Give the honest hardware answer in plain language.",
          "Name three pieces of hardware found in a data centre but not on an office desk, and say what each one does.",
        ],
        checks: [
          {
            answer: [
              "Ada Lovelace. In 1843 she published notes on Babbage's Analytical Engine containing a step-by-step method for the machine to compute Bernoulli numbers — the first published algorithm intended for a machine — and she foresaw that computers could one day work with music, words and symbols, not just numbers.",
            ],
            concepts: [
              ["ada", "lovelace"],
              ["algorithm", "program", "bernoulli", "notes", "instructions"],
              ["analytical engine", "babbage"],
              ["beyond numbers", "music", "art", "symbols", "foresaw", "predicted", "vision"],
            ],
            labels: ["names Ada Lovelace", "the first algorithm/program", "for Babbage's Analytical Engine", "her vision beyond numbers"],
            min: 3,
          },
          {
            answer: [
              "A 'computer' was a person employed to do calculations by hand — a job title.",
              "At NASA (then NACA) that work was done largely by women, including the segregated West Area Computing unit of Black women mathematicians — Katherine Johnson, Dorothy Vaughan and Mary Jackson — who computed spaceflight trajectories.",
            ],
            concepts: [
              ["person", "people", "job", "by hand", "human"],
              ["women", "woman"],
              ["katherine johnson", "dorothy vaughan", "mary jackson", "west area", "hidden figures"],
              ["trajector", "calculations", "flight", "orbit", "spaceflight"],
            ],
            labels: ["computer = a person's job", "the work was done by women", "names the NASA computers", "what they calculated"],
            min: 3,
          },
          {
            answer: [
              "ENIAC (1945) was the first general-purpose electronic computer — 30 tons and about 18,000 vacuum tubes.",
              "It was programmed by six women — the ENIAC Six — who set switches and re-plugged cables by hand, without manuals or training, effectively inventing programming as a job.",
            ],
            concepts: [
              ["first", "general-purpose", "electronic"],
              ["vacuum tube", "valve", "18,000", "18000", "30 ton"],
              ["women", "six"],
              ["cables", "plugboard", "switches", "re-plug", "replug", "wiring", "no manual"],
            ],
            labels: ["what ENIAC was", "its scale/valves", "programmed by six women", "programming = cables and switches"],
            min: 3,
          },
          {
            answer: [
              "The cloud is physical data centres owned by providers like Microsoft and Amazon — buildings full of servers, storage and network hardware that we rent over the internet.",
              "Both Azure and AWS run data centre regions here in South Africa (Johannesburg, and Cape Town for AWS), so 'our cloud' may literally be servers up the road — virtualisation just slices those physical machines into the virtual ones we use.",
            ],
            concepts: [
              ["data centre", "data center", "datacentre", "datacenter", "buildings", "warehouse"],
              ["servers", "hardware", "physical", "machines"],
              ["rent", "provider", "someone else", "microsoft", "amazon", "internet"],
              ["johannesburg", "cape town", "south africa", "region"],
            ],
            labels: ["cloud = real data centres", "full of physical servers", "rented from a provider over the internet", "regions exist in South Africa"],
            min: 3,
          },
          {
            answer: [
              "Examples: a rack server (compute in a 42U cabinet); a SAN storage array (shelves of drives serving many servers); a UPS battery system (instant bridge power); a diesel generator (long outages); a PDU (rack power distribution); a CRAC/cooling unit (removes heat); a blade chassis; a KVM console.",
            ],
            concepts: [
              ["rack server", "blade", "1u", "42u", "server"],
              ["san", "storage array", "nas", "tape", "library"],
              ["ups", "generator", "pdu", "power"],
              ["crac", "cooling", "aircon", "hot aisle", "chiller"],
              ["kvm", "patch panel", "core switch", "firewall appliance"],
            ],
            labels: ["server hardware", "enterprise storage", "power hardware", "cooling hardware", "other DC hardware"],
            min: 3,
          },
        ],
      },
    ],

    assignments: [
      {
        id: "hwsw-a1",
        title: "Assignment — Workplace hardware audit & evolution poster",
        brief:
          "Part A: Audit one workstation at your workplace (with permission): record CPU model, RAM size and type, storage type and capacity, every visible port, the connected peripherals and printer (type and how it connects), and how the machine reaches the network. Part B: Create a one-page 'Evolution of Computing' timeline poster — at least ten milestones from Babbage and Ada Lovelace to AI — suitable for the training-room wall.",
        requirements: [
          "Part A as a table: component · what you found · how you identified it (System Information, Task Manager, physical inspection).",
          "Include at least: CPU, RAM, storage, three ports, one peripheral, the printer, and the network connection (cable/Wi-Fi, and to what device).",
          "One paragraph: the single most cost-effective upgrade for this machine, justified.",
          "Part B poster: minimum ten milestones with dates; at least three must be pre-1950 and at least two must feature the women pioneers.",
          "Any format (Word, PowerPoint, Canva, hand-drawn and photographed) — legibility and accuracy count, not artistic talent.",
        ],
        evidence:
          "Submit both parts within 5 working days of Day 2. The assessed audit and poster are filed in your POE as evidence for this lesson.",
      },
    ],

    quiz: [],
    quizzes: [
      {
        id: "hwsw-day1",
        title: "Quiz 1 — History & inside the PC (Day 1)",
        questions: [
          {
            q: "Who is regarded as the first computer programmer?",
            options: ["Grace Hopper", "Ada Lovelace", "Katherine Johnson", "Charles Babbage"],
            answer: 1,
            explain: "Ada Lovelace published the first algorithm intended for a machine (Babbage's Analytical Engine) in 1843. Grace Hopper and Katherine Johnson are later pioneers; Babbage designed the machines.",
          },
          {
            q: "Babbage's Analytical Engine had a 'mill' and a 'store'. What are their modern equivalents?",
            options: ["Printer and scanner", "CPU and RAM", "Keyboard and monitor", "Router and switch"],
            answer: 1,
            explain: "The mill performed arithmetic (today's CPU) and the store held numbers (today's memory/RAM) — the same architecture every computer still uses.",
          },
          {
            q: "Before electronic machines existed, what was a 'computer'?",
            options: [
              "A mechanical calculator",
              "A person employed to do calculations — very often a woman",
              "A punched card",
              "A telegraph operator",
            ],
            answer: 1,
            explain: "'Computer' was a job title for people who calculated by hand — from the Harvard Observatory women to NASA's West Area Computers.",
          },
          {
            q: "Which statements about ENIAC (1945) are true?",
            options: [
              "It used about 18,000 vacuum tubes and weighed around 30 tons",
              "It was programmed by six women by re-plugging cables and setting switches",
              "It fitted on a desk",
              "It ran Windows",
            ],
            answer: 0,
            answers: [0, 1],
            explain: "ENIAC filled a room with ~18,000 valves and was programmed by the ENIAC Six at plugboards. Desktop computers and Windows came decades later.",
          },
          {
            q: "What did Grace Hopper contribute to computing?",
            options: [
              "The first compiler and the drive behind COBOL",
              "The first microprocessor",
              "The World Wide Web",
              "The iPhone",
            ],
            answer: 0,
            explain: "Hopper created the first compiler (A-0, 1952) and championed English-like programming, leading to COBOL (1959). Her team also popularised the term 'debugging'.",
          },
          {
            q: "Put the hardware generations in the correct order:",
            options: [
              "Transistors → valves → microprocessors → integrated circuits",
              "Vacuum tubes → transistors → integrated circuits → microprocessors",
              "Integrated circuits → vacuum tubes → transistors → microprocessors",
              "Microprocessors → integrated circuits → transistors → vacuum tubes",
            ],
            answer: 1,
            explain: "1st gen valves (ENIAC) → 2nd gen transistors (1947) → 3rd gen integrated circuits (1958–59) → 4th gen microprocessors (Intel 4004, 1971).",
          },
          {
            q: "A PC 'forgets' its date and time every time it is unplugged. What is the most likely cause?",
            options: ["Faulty RAM", "A flat CMOS coin-cell battery", "A failing hard drive", "The wrong printer driver"],
            answer: 1,
            explain: "The CR2032 coin cell keeps the clock and firmware settings alive when the machine has no power — when it dies, the clock resets.",
          },
          {
            q: "Which upgrades would most help a PC that slows down when many applications are open at once? (Select all that apply)",
            options: [
              "Add more RAM",
              "Replace the HDD with an SSD",
              "A bigger monitor",
              "A faster printer",
            ],
            answer: 0,
            answers: [0, 1],
            explain: "Slowness with many open apps means paging to the drive: more RAM reduces the paging, and an SSD makes the unavoidable paging far faster. Monitors and printers change nothing.",
          },
          {
            q: "What is the key difference between RAM and storage?",
            options: [
              "RAM is permanent; storage is temporary",
              "RAM is fast, temporary working memory that empties at power-off; storage keeps data permanently",
              "They are the same thing",
              "Storage is faster than RAM",
            ],
            answer: 1,
            explain: "RAM is the volatile working desk (cleared at shutdown); storage is the filing cabinet that holds everything permanently. RAM is orders of magnitude faster.",
          },
          {
            q: "Which port would you choose to drive a 4K monitor at a high refresh rate?",
            options: ["VGA", "PS/2", "DisplayPort", "RJ11"],
            answer: 2,
            explain: "DisplayPort (or HDMI 2.1) has the bandwidth for 4K at high refresh. VGA is analogue and low-bandwidth; PS/2 is a keyboard/mouse port; RJ11 is telephone.",
          },
          {
            q: "Which RAID level mirrors two drives so one can fail without data loss?",
            options: ["RAID 0", "RAID 1", "RAID 5", "JBOD"],
            answer: 1,
            explain: "RAID 1 keeps identical copies on two drives. RAID 0 stripes with NO redundancy; RAID 5 uses parity across 3+ drives.",
          },
          {
            q: "A laser printer produces a smudge that repeats at regular intervals down every page. The classic culprit is…",
            options: ["The USB cable", "A damaged imaging drum", "Too much RAM", "The Wi-Fi signal"],
            answer: 1,
            explain: "A mark on the rotating drum prints once per revolution — a repeating defect at fixed intervals is the drum's signature. Cables and Wi-Fi cause missing pages, not repeating marks.",
          },
        ],
      },
      {
        id: "hwsw-day2",
        title: "Quiz 2 — Network, data centre, cloud & software (Day 2)",
        questions: [
          {
            q: "Which device connects the devices within an office LAN, forwarding traffic to the correct port?",
            options: ["Router", "Switch", "Modem", "UPS"],
            answer: 1,
            explain: "The switch is the heart of the LAN. The router connects networks to each other (e.g. LAN to internet); the modem/ONT converts the provider's signal; a UPS is power protection.",
          },
          {
            q: "What does PoE (Power over Ethernet) make possible?",
            options: [
              "Faster downloads",
              "Powering devices like access points, IP cameras and phones through the network cable itself",
              "Wireless charging",
              "Longer Wi-Fi range",
            ],
            answer: 1,
            explain: "PoE switches send power down the UTP cable, so ceiling APs, cameras and desk phones need no plug point.",
          },
          {
            q: "Which cabling facts are correct? (Select all that apply)",
            options: [
              "Cat6a UTP supports 10 Gbps up to 100 m",
              "Single-mode fibre is used for long distances",
              "RJ11 is the standard network connector",
              "The maximum UTP run is about 100 m",
            ],
            answer: 0,
            answers: [0, 1, 3],
            explain: "Cat6a carries 10 Gbps the full 100 m and 100 m is the UTP limit; single-mode fibre covers kilometres. RJ11 is the small telephone connector — RJ45 is network.",
          },
          {
            q: "What is a SAN?",
            options: [
              "A file-sharing appliance for one department",
              "A dedicated high-speed storage network presenting disk volumes to many servers",
              "A type of printer",
              "An antivirus product",
            ],
            answer: 1,
            explain: "A SAN (storage area network) connects servers to shared storage arrays over Fibre Channel or iSCSI — the storage behind databases and VM farms. The file-sharing appliance is a NAS.",
          },
          {
            q: "In a data centre power chain, which order is correct when the grid fails?",
            options: [
              "Generator takes the load instantly; UPS is for long outages",
              "UPS batteries carry the load instantly, then generators take over for the long haul",
              "Servers switch to laptop batteries",
              "The PDU generates power",
            ],
            answer: 1,
            explain: "UPS batteries bridge the seconds-long gap with zero interruption; generators start and carry the site for hours. PDUs only distribute power to racks.",
          },
          {
            q: "What does 'hot aisle / cold aisle' describe?",
            options: [
              "Fire safety zones",
              "Arranging racks so servers draw cold air from one aisle and exhaust heat into another, kept separate",
              "The queue at the coffee machine",
              "Zones with and without Wi-Fi",
            ],
            answer: 1,
            explain: "Facing rack fronts at contained cold aisles and exhausts at hot aisles stops hot and cold air mixing — the foundation of data-centre cooling efficiency.",
          },
          {
            q: "Where is 'the cloud', physically?",
            options: [
              "In the atmosphere, via satellites",
              "In providers' physical data centres — including Azure and AWS regions right here in South Africa",
              "Inside your Wi-Fi router",
              "Nowhere — it is purely virtual",
            ],
            answer: 1,
            explain: "Cloud services run on real servers in hyperscale data centres. Azure and AWS both operate South African regions (Johannesburg; AWS also Cape Town). Virtual machines still need physical hosts.",
          },
          {
            q: "What does a hypervisor do?",
            options: [
              "Cools the servers",
              "Slices one physical server into many isolated virtual machines",
              "Prints faster",
              "Replaces the firewall",
            ],
            answer: 1,
            explain: "Virtualisation software (ESXi, Hyper-V, KVM) lets one physical host run many VMs — the technology that makes cloud computing possible.",
          },
          {
            q: "Why are GPUs the hardware of the AI era?",
            options: [
              "They are cheaper than CPUs",
              "Their thousands of parallel cores are ideal for the matrix arithmetic neural networks need",
              "They use no electricity",
              "They store more data than hard drives",
            ],
            answer: 1,
            explain: "A GPU does the same small calculation across thousands of cores at once — exactly the shape of neural-network maths. That is why AI data centres are racks of GPUs (and TPUs).",
          },
          {
            q: "Which licence type is tied permanently to the machine it shipped on?",
            options: ["Retail", "Volume", "OEM", "Open source"],
            answer: 2,
            explain: "OEM licences live and die with the original machine. Retail licences transfer; volume covers fleets; open source grants use under its licence conditions.",
          },
          {
            q: "Which are real software layers between hardware and the user? (Select all that apply)",
            options: ["Firmware", "Drivers", "The operating system", "The desk the PC stands on"],
            answer: 0,
            answers: [0, 1, 2],
            explain: "Firmware lives in the devices, drivers teach the OS to use them, and the OS manages everything for the applications. The desk is furniture — useful, but not software.",
          },
          {
            q: "A PC shows 'No boot device found'. Which is NOT a likely cause?",
            options: [
              "The drive has failed",
              "A data cable has come loose",
              "The boot order points at an empty USB stick",
              "The monitor is 60 Hz",
            ],
            answer: 3,
            explain: "'No boot device' means the firmware cannot find a drive to boot: dead drive, loose cable or wrong boot order. The monitor's refresh rate has nothing to do with booting.",
          },
        ],
      },
      {
        id: "hwsw-psu",
        title: "Quiz 3 — How a PSU works",
        questions: [
          {
            q: "What voltage and frequency does a South African wall socket deliver?",
            options: [
              "12 V DC at 60 Hz",
              "120 V AC at 60 Hz",
              "230 V AC at 50 Hz",
              "320 V DC at 50 Hz",
            ],
            answer: 2,
            explain: "SA mains is 230 V AC at 50 Hz. The 320 V DC figure only appears inside the PSU after the bridge rectifier; 120 V / 60 Hz is North America.",
          },
          {
            q: "What is the job of the EMI filter at the PSU input?",
            options: [
              "It converts AC electricity into DC",
              "It removes electrical noise, spikes and interference before the electricity is used",
              "It steps 230 V down to 12 V directly",
              "It regulates the CPU's core voltage",
            ],
            answer: 1,
            explain: "The EMI filter is like a water filter for electricity — it cleans dirty AC before the rectifier sees it. Converting AC→DC is the rectifier's job, stepping down is the transformer's, and CPU regulation is done by the motherboard VRM.",
          },
          {
            q: "What does the bridge rectifier inside the PSU do?",
            options: [
              "Chops the DC into millions of tiny pulses per second",
              "Uses four diodes to turn ~230 V AC into approximately 320 V DC",
              "Smooths the ripples on the +12 V rail",
              "Turns the PC on when you press the power button",
            ],
            answer: 1,
            explain: "A bridge rectifier is four diodes acting as one-way gates, forcing AC to flow one direction only. In a SA PSU the result is roughly 320 V DC. Chopping is done later by the MOSFETs; smoothing is done by capacitors.",
          },
          {
            q: "MOSFETs in the PSU switch about 50,000–500,000 times per second. Why so fast?",
            options: [
              "So the PSU can run on DC without a rectifier",
              "So the transformer can be much smaller, cooler and more efficient",
              "To create the 50 Hz signal the CPU needs",
              "To keep the fans spinning at maximum RPM",
            ],
            answer: 1,
            explain: "High-frequency switching lets the PSU use a tiny high-frequency transformer instead of a huge 50 Hz one, making modern PSUs small, light and efficient. CPUs never see 50 Hz — they run on smooth DC.",
          },
          {
            q: "After the transformer steps the voltage down, what removes the last tiny ripples so the DC is stable enough for the CPU?",
            options: ["Diodes", "MOSFETs", "Capacitors", "The EMI filter"],
            answer: 2,
            explain: "Capacitors act like small reservoirs — they charge on the peaks and discharge in the dips, smoothing rough DC into stable DC. Even tiny fluctuations can crash a computer, so this stage is critical.",
          },
          {
            q: "Which components draw power from the PSU's +12 V rail? (Select all that apply)",
            options: [
              "CPU (via the motherboard's EPS connector)",
              "GPU (via the PCIe power connectors)",
              "Case fans and HDD spindle motors",
              "The BIOS chip on the motherboard",
            ],
            answer: 0,
            answers: [0, 1, 2],
            explain: "The +12 V rail powers everything that moves or draws serious current: CPU (through the VRM), GPU, fans and HDD motors. Small logic chips like BIOS run on +3.3 V.",
          },
          {
            q: "The PSU delivers +12 V to the motherboard, but a modern CPU actually runs on about 1.0–1.2 V. What bridges the gap?",
            options: [
              "The bridge rectifier converts 12 V to 1.1 V",
              "The PSU has a separate 1.1 V rail on the 24-pin connector",
              "VRMs (Voltage Regulator Modules) on the motherboard step 12 V down to the exact voltage the CPU asks for",
              "A special adapter cable inside the CPU cooler",
            ],
            answer: 2,
            explain: "Modern motherboards contain VRMs — precision DC-DC converters that step 12 V down to ~1.1 V and adjust it in real time as the CPU changes load. There is no 1.1 V rail on the PSU.",
          },
          {
            q: "Which internal component needs BOTH +12 V (for the motor) AND +5 V (for the electronics)?",
            options: ["An SSD", "A hard disk drive (HDD)", "A USB flash drive", "A DDR4 RAM stick"],
            answer: 1,
            explain: "HDDs use 12 V to spin the platters and 5 V for the controller board. SSDs and USB devices need only 5 V — no motor. RAM runs off 1.2–1.5 V generated on the motherboard from 3.3 V logic.",
          },
          {
            q: "Drag the eight stages into the correct order — from the wall socket to the components:",
            kind: "order",
            options: [],
            answer: 0,
            items: [
              "Wall outlet — 230 V AC",
              "EMI filter — removes noise and spikes",
              "Bridge rectifier — AC becomes ~320 V DC",
              "MOSFETs — chop DC into high-frequency pulses",
              "Transformer — steps the high-frequency voltage down",
              "Output rectifiers & capacitors — smooth into steady DC",
              "Voltage regulators — hold +12 V, +5 V, +3.3 V rock-steady",
              "Distribution to motherboard, CPU, GPU, drives, fans",
            ],
            explain: "The full journey: Wall → EMI filter → Rectifier → MOSFET switching → Transformer → Rectify + smooth → Regulate → Distribute. Every stage exists because computer components need clean, low-voltage, steady DC — the opposite of what comes out of the wall.",
          },
          {
            q: "Match each part of the water-supply analogy to the real PC component it represents:",
            kind: "match",
            options: [],
            answer: 0,
            imageSvg: WATER_ANALOGY_SVG,
            pairs: [
              { left: "The river feeding the town", right: "Wall outlet (230 V AC mains)" },
              { left: "The water treatment plant", right: "Power Supply Unit (PSU)" },
              { left: "The pipes leaving the plant", right: "PSU output cables (24-pin, EPS, PCIe, SATA)" },
              { left: "The city water network", right: "Motherboard power distribution" },
              { left: "Individual buildings that need different pressures", right: "PC components (CPU, GPU, RAM, SSD)" },
            ],
            explain: "The wall outlet is a raw river of energy. The PSU is the treatment plant that cleans it, controls it and outputs the right pressures. The cables are pipes; the motherboard is the city grid; each component is a building that needs a specific 'pressure' (voltage). Too much and it breaks, too little and it stalls — the PSU keeps every component supplied with clean, stable power.",
          },
        ],
      },
    ],

    lessonPlan: {
      title: "Facilitator Preparation",
      startTime: "09:00",
      details: [
        { icon: "calendar", label: "Dates", value: "Wednesday 5 & Thursday 6 August 2026" },
        { icon: "clock", label: "Time", value: "09:00 – 14:00 (both days)" },
        { icon: "globe", label: "Venue", value: "Investec, Sandton, Johannesburg" },
        { icon: "presenter", label: "Facilitator", value: "Andre Snell" },
      ],
      prep: [
        "Study the lesson content so you can tell the history as a story — the session lives or dies on the Babbage-to-AI narrative.",
        "Upload pictures into the image placeholders on the Lesson tab BEFORE Day 1 — every placeholder shows a hint describing exactly which picture to find.",
        "Pack the demo box: an old motherboard, a CPU, DDR3/DDR4 DIMMs, an opened hard drive, a 2.5\" SSD and M.2 stick, SATA/power cables, a PSU with its connectors, assorted cables (VGA, HDMI, DisplayPort, USB types, RJ45, RJ11), a patch lead and crimping tool, and if possible a small switch and access point to pass around.",
        "Arrange access to a machine that can be opened live in class, and to the office MFP for the printer walk-around.",
        "Load the two quizzes and both exercises; check the projector and a spare HDMI/USB-C adapter (practise what you preach).",
      ],
      sections: [
        {
          heading: "Day 1 — Wednesday, 5 August 2026 · The story of computing & inside the PC",
          rows: [
            {
              title: "Room Set Up",
              text: ["Venue, projector and demo-hardware box ready. Components laid out on a side table for the hands-on segments."],
            },
            {
              time: "20 minutes",
              title: "Meet, Greet & Seat",
              text: [
                "Learners settle and sign the class register. Explain the parking bay for questions that will be answered before close.",
              ],
              resources: ["Class Register", "White Board"],
            },
            {
              time: "25 minutes",
              title: "Hardware vs software — Facilitator & Class",
              bullets: [
                "Work through the Welcome section: hardware / software / firmware definitions.",
                "Pass a RAM module and an SSD around the room — the goal: no component is scary by 14:00 tomorrow.",
              ],
              resources: ["Lesson: Welcome section", "Demo box"],
            },
            {
              time: "60 minutes",
              title: "The story of computing: Babbage, Ada Lovelace, the women who computed, ENIAC — Facilitator (storytelling)",
              bullets: [
                "Sections 1–2 with the uploaded pictures full-screen: Babbage's engines, Ada Lovelace's notes, Hollerith and IBM.",
                "'Computer' as a job title: Harvard computers, NASA's West Area Computers (Hidden Figures), Bletchley Park, the ENIAC Six, Grace Hopper and the first bug.",
                "Discussion: why were these pioneers forgotten for decades, and what does that mean for our industry?",
              ],
              resources: ["Lesson sections 1–2", "Uploaded figures"],
            },
            {
              time: "30 minutes",
              title: "Five generations & the evolution of software — Facilitator & Class",
              bullets: [
                "Sections 3–4: valves → transistors → ICs → microprocessors → AI silicon; machine code → COBOL → UNIX → Windows → open source → cloud → AI.",
                "Anchor with the Moore's Law chart: the phone in your pocket vs ENIAC.",
              ],
              resources: ["Lesson sections 3–4"],
            },
            {
              time: "25 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "55 minutes",
              title: "Inside the case: motherboard, CPU, RAM — Facilitator & Class (hands-on)",
              bullets: [
                "Open the demo PC live: identify every part of section 5 on the real board.",
                "Seat and re-seat a CPU and RAM module; show thermal paste and the CMOS battery.",
                "Section 6: the desk-vs-filing-cabinet analogy; DDR generations on real DIMMs.",
              ],
              resources: ["Lesson sections 5–6", "Demo PC", "Demo box"],
            },
            {
              time: "45 minutes",
              title: "Storage, ports and cables — Class in pairs (hands-on)",
              bullets: [
                "Section 7 with the opened HDD vs SSD vs M.2 in hand; RAID on the whiteboard; the 3-2-1 backup rule.",
                "Section 8 as a port-identification race: pairs name every connector in the cable pile, then check against the lesson tables.",
              ],
              resources: ["Lesson sections 7–8", "Cable pile"],
            },
            {
              time: "20 minutes",
              title: "Power, cooling & graphics — Facilitator & Class",
              bullets: [
                "Section 9: PSU connectors on the real unit; dust and thermal throttling; UPS types for load shedding.",
              ],
              resources: ["Lesson section 9", "Demo PSU"],
            },
            {
              time: "10 minutes",
              title: "Day 1 wrap — Quiz 1 assigned",
              bullets: [
                "Learners complete Quiz 1 (History & inside the PC) in the app — tonight if not finished in class.",
              ],
              resources: ["Quiz tab: Quiz 1"],
            },
            {
              time: "10 minutes",
              title: "Parking Bay & Closing — Facilitator",
              bullets: [
                "Answer parked questions; confirm tomorrow continues at 09:00 with printers, networks, data centres and the cloud.",
              ],
              resources: ["White Board"],
            },
          ],
        },
        {
          heading: "Day 2 — Thursday, 6 August 2026 · Peripherals, networks, data centres, cloud & software",
          startTime: "09:00",
          rows: [
            {
              time: "15 minutes",
              title: "Recap & Quiz 1 review — Facilitator & Class",
              bullets: [
                "Quick-fire recap of Day 1; walk through any Quiz 1 questions the class found hard.",
              ],
              resources: ["Quiz 1 results"],
            },
            {
              time: "45 minutes",
              title: "Peripherals & printers — Facilitator & Class (walk-around)",
              bullets: [
                "Section 10: monitor panel types and connectors; then the printer deep-dive — laser process step by step, inkjet, thermal, dot-matrix, 3D.",
                "Walk to the office MFP: identify drum, toner, fuser, trays; discuss the fault-signature table (repeating marks, ghosting, streaks, jams).",
              ],
              resources: ["Lesson section 10", "Office MFP"],
            },
            {
              time: "40 minutes",
              title: "Network hardware — Facilitator & Class (hands-on)",
              bullets: [
                "Section 11: NIC → switch → router → firewall → AP → ONT, traced on the whiteboard from a desk PC to the internet.",
                "Pass around the switch, AP, patch leads, fibre lead and SFP; demonstrate crimping an RJ45 if time allows.",
              ],
              resources: ["Lesson section 11", "Demo switch/AP", "Crimping tool"],
            },
            {
              time: "25 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "60 minutes",
              title: "Data centre & cloud hardware — Facilitator & Class",
              bullets: [
                "Section 12 with the uploaded rack/aisle/UPS/generator pictures: servers, SAN vs NAS, the power chain, hot/cold aisles, N+1 vs 2N — and the load-shedding angle.",
                "Section 13: where the cloud physically is (Johannesburg & Cape Town regions), hypervisors, GPU/AI clusters, undersea cables.",
              ],
              resources: ["Lesson sections 12–13", "Uploaded figures"],
            },
            {
              time: "30 minutes",
              title: "Software, licensing & the boot process — Facilitator & Class",
              bullets: [
                "Section 14: the software stack, the OS family, patching discipline, licence types (and the ethics of piracy).",
                "Section 15: boot a machine live and narrate POST → UEFI → bootloader → OS; map the where-it-stops troubleshooting table.",
              ],
              resources: ["Lesson sections 14–15", "Demo PC"],
            },
            {
              time: "50 minutes",
              title: "Exercises 1 & 2 — Class in pairs",
              bullets: [
                "Pairs complete both exercises in the app; facilitator circulates and takes feedback from two pairs per exercise.",
              ],
              resources: ["Exercises tab"],
            },
            {
              time: "15 minutes",
              title: "Quiz 2 & Self-Assessment — Learners individually",
              bullets: [
                "Learners complete Quiz 2 (Day 2 content) and judge their own competence; identify learners needing support.",
              ],
              resources: ["Quiz tab: Quiz 2"],
            },
            {
              time: "10 minutes",
              title: "Parking Bay — Facilitator",
              bullets: [
                "Answer all parked questions; ensure the whole class understands each answer.",
              ],
              resources: ["White Board"],
            },
            {
              time: "10 minutes",
              title: "Closing — Facilitator",
              bullets: [
                "Full-circle recap: from human computers to AI — and where the systems support career fits in that story.",
                "Issue the assignment (hardware audit & evolution poster) — due within 5 working days.",
                "Thank the learners and confirm the next session (US 114050, Friday 7 August).",
              ],
            },
          ],
        },
      ],
    },
  },

  /* ================================================================
     US 114055 — Ethics and professionalism for the computer industry
     NQF 5 · 3 credits
     ================================================================ */
  "114055": {
    lesson: [],
    exercises: [],
    assignments: [],
    quiz: [],

    lessonPlan: {
      title: "Facilitator Preparation",
      startTime: "09:00",
      details: [
        { icon: "calendar", label: "Date", value: "Friday, 21 August 2026" },
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
          heading: "Unit Standard 114055",
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
              title: "Codes of practice for the IT industry in SA — Facilitator & Class",
              bullets: [
                "Read through pages 4-16 of the learner manual, identifying the codes of practice of the IT industry in South Africa.",
              ],
              resources: ["LM p4-16"],
            },
            {
              time: "45 minutes",
              title: "Questionnaire 1 — Class in pairs",
              bullets: [
                "Facilitator to read through the questions with the learners, ensuring they understand what is expected of them.",
                "Allow the learners to complete the questions; take feedback from two groups/pairs.",
              ],
              resources: ["LM p17-19"],
            },
            {
              time: "90 minutes",
              title: "Codes of ethics in the computer industry — Facilitator & Class",
              bullets: [
                "Read through pages 20-25 of the learner manual, identifying the codes of ethics in the computer industry.",
              ],
              resources: ["LM p20-25"],
            },
            {
              time: "45 minutes",
              title: "Questionnaire 2 — Class in pairs",
              bullets: [
                "Facilitator to read through the questions with the learners, ensuring they understand what is expected of them.",
                "Allow the learners to complete the questions; take feedback from two groups/pairs.",
              ],
              resources: ["LM p26"],
            },
            {
              time: "10 minutes",
              title: "Self-Assessment — Learners individually",
              bullets: [
                "Explain to the learners that they have to judge their own knowledge gained in the unit by ticking the blocks they feel competent with.",
                "Allow the learners to tick the blocks and take feedback from each learner.",
                "Identify those learners who have shortcomings and assist them with fulfilling the requirements.",
              ],
              resources: ["LM p27"],
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
  },

  /* ================================================================
     HWSW2 — Hardware and Software: Illustrated Slide Deck
     A companion visual lesson to HWSW. Each figure is a purpose-built
     infographic slide (stored under /public/HWSW/) presented in an
     order that walks the learner from "what is a computer" to "what
     runs on it" — hardware first (motherboard → CPU → cooling → RAM →
     storage → GPU/AI → power → case & ports → peripherals → network),
     then software (OS → applications → cloud, virtualisation, security
     and AI).
     ================================================================ */
  HWSW2: {
    lesson: [
      {
        heading: "Introduction — what is a computer system?",
        icon: "presenter",
        flat: true,
        paragraphs: [
          "A computer system is a partnership between two things: the hardware you can touch and the software that tells that hardware what to do. Neither is useful without the other — a laptop with no operating system is a paperweight, and an app with no processor to run on is just a file.",
          "Every machine you will ever support, from a gaming PC to a warehouse scanner to a phone, follows the same four-part pattern: input, processing, storage, and output. Once you can spot those four parts, you can reason about any device.",
          "In Part 1 we open the case and work through the physical components — motherboard, CPU, cooling, RAM, storage, power supply, ports, peripherals, and the networking hardware that puts a device online.",
          "In Part 2 we move up the stack into software — firmware, the operating system, the applications people use every day, and the modern cloud, virtualisation, security and AI layers that sit on top.",
          "By the end of the deck you should be able to point at any part of a computer, name it, explain what it does, and know whether it lives on the hardware side or the software side.",
        ],
        figures: [],
      },
      {
        heading: "The four components of a computer system — the map for the whole lesson",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Every computer = input + processing + storage + output.",
          "• Hardware is what you touch; software is what runs on it.",
          "• Use this map to place every other slide in the deck.",
        ],
        figures: [
          { id: "hwsw2-4-components", caption: "The four components of a computer system — the map for the whole lesson" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Database software",
              "Firmware and low-level software",
              "Graphics and AI hardware — from rendering to neural networks",
              "The four components of a computer system — the map for the whole lesson",
            ],
            answer: 3,
            explain: "This slide covers: The four components of a computer system — the map for the whole lesson.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Webcam and microphone for calls and content.",
              "Different jobs, often confused.",
              "Steps 12 V from the PSU down to ~1 V for the CPU.",
              "Every computer = input + processing + storage + output.",
            ],
            answer: 3,
            explain: "Correct: \"Every computer = input + processing + storage + output.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Hardware is what you touch; software is what runs on it.",
              "Run on top of the OS.",
              "Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
              "Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
            ],
            answer: 0,
            explain: "Correct: \"Hardware is what you touch; software is what runs on it.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Access point: provides Wi-Fi coverage.",
              "Use this map to place every other slide in the deck.",
              "NVIDIA vs AMD vs Intel Arc for GPUs.",
              "Stores structured data (SQL Server, MySQL, Postgres).",
            ],
            answer: 1,
            explain: "Correct: \"Use this map to place every other slide in the deck.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Colour-coded pairs enable dual-channel mode.",
              "Every computer = input + processing + storage + output.",
              "Hardware is what you touch; software is what runs on it.",
              "Use this map to place every other slide in the deck.",
            ],
            answer: 0,
            explain: "\"Colour-coded pairs enable dual-channel mode.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "PART 1 — HARDWARE: the physical machine",
        icon: "presenter",
        flat: true,
        paragraphs: [
          "Every slide in Part 1 shows a physical component you can point at inside a PC case. Work outwards from the motherboard: processors, cooling, memory, storage, power, case & ports, input and output devices, and networking hardware.",
        ],
        figures: [],
      },
      {
        heading: "Motherboard components — the labelled overview",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Central hub that connects CPU, RAM, storage, GPU and PSU.",
          "• Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.",
          "• Chipset routes traffic between all components.",
        ],
        figures: [
          { id: "hwsw2-motherboard-components", caption: "Motherboard components — the labelled overview" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Motherboard components — the labelled overview",
              "Firmware and low-level software",
              "Database software",
              "Input devices — the essentials",
            ],
            answer: 0,
            explain: "This slide covers: Motherboard components — the labelled overview.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Central hub that connects CPU, RAM, storage, GPU and PSU.",
              "Used for SATA SSDs, HDDs and DVD drives.",
              "VMs run whole guest OSes on shared hardware.",
              "'The cloud' = someone else's servers.",
            ],
            answer: 0,
            explain: "Correct: \"Central hub that connects CPU, RAM, storage, GPU and PSU.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Runs on servers, routers and endpoints.",
              "Support role: getting AI tools working for users.",
              "SaaS, PaaS, IaaS — three service models.",
              "Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.",
            ],
            answer: 3,
            explain: "Correct: \"Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Chipset routes traffic between all components.",
              "Initialises hardware, then hands over to the OS.",
              "Copilots, chatbots, image and voice tools.",
              "Undersized PSU = crashes under GPU load.",
            ],
            answer: 0,
            explain: "Correct: \"Chipset routes traffic between all components.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Chipset routes traffic between all components.",
              "Often licensed per user or per device.",
              "Central hub that connects CPU, RAM, storage, GPU and PSU.",
              "Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.",
            ],
            answer: 1,
            explain: "\"Often licensed per user or per device.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "The CPU socket — where the processor lives",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Physical mount that connects the CPU to the board.",
          "• Socket type (LGA, PGA, BGA) must match the CPU.",
          "• Damaged pins here = dead motherboard.",
        ],
        figures: [
          { id: "hwsw2-motherboard-cpu-socket", caption: "The CPU socket — where the processor lives" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "SATA ports — connecting SATA drives and optical drives",
              "The CPU socket — where the processor lives",
              "Expansion hardware — add-in cards",
              "Operating systems — the core system software",
            ],
            answer: 1,
            explain: "This slide covers: The CPU socket — where the processor lives.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Software tells hardware what to do.",
              "Physical mount that connects the CPU to the board.",
              "Talks directly over PCIe — no SATA bottleneck.",
              "Tensor / matrix cores accelerate AI operations.",
            ],
            answer: 1,
            explain: "Correct: \"Physical mount that connects the CPU to the board.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Socket type (LGA, PGA, BGA) must match the CPU.",
              "Reliable, cheap, no leaks.",
              "Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
              "Watch for shared bandwidth with SATA on some boards.",
            ],
            answer: 0,
            explain: "Correct: \"Socket type (LGA, PGA, BGA) must match the CPU.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Each step is roughly ×1000.",
              "NVMe SSD: plugs into M.2, blazing fast.",
              "Firmware lives inside chips (BIOS/UEFI, SSD, NIC).",
              "Damaged pins here = dead motherboard.",
            ],
            answer: 3,
            explain: "Correct: \"Damaged pins here = dead motherboard.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Socket type (LGA, PGA, BGA) must match the CPU.",
              "SATA SSD: no moving parts, fast enough for most users.",
              "Damaged pins here = dead motherboard.",
              "Physical mount that connects the CPU to the board.",
            ],
            answer: 1,
            explain: "\"SATA SSD: no moving parts, fast enough for most users.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "VRM (Voltage Regulator Module) — the power behind your CPU",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Steps 12 V from the PSU down to ~1 V for the CPU.",
          "• Weak VRM = instability under heavy load.",
          "• Runs hot — needs its own heatsink on gaming boards.",
        ],
        figures: [
          { id: "hwsw2-vrm", caption: "VRM (Voltage Regulator Module) — the power behind your CPU" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "VRM (Voltage Regulator Module) — the power behind your CPU",
              "Input devices — the extended catalogue (24 devices)",
              "Different CPUs and GPUs — how modern processors compare",
              "Liquid CPU cooler — AIO (All-In-One)",
            ],
            answer: 0,
            explain: "This slide covers: VRM (Voltage Regulator Module) — the power behind your CPU.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "History explains today's design choices.",
              "Drivers translate between the two.",
              "Steps 12 V from the PSU down to ~1 V for the CPU.",
              "DHCP, DNS, VPN, firewall, load balancer.",
            ],
            answer: 2,
            explain: "Correct: \"Steps 12 V from the PSU down to ~1 V for the CPU.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Learn what each port can and can't carry.",
              "Weak VRM = instability under heavy load.",
              "Kernel bugs can crash the whole machine (BSOD).",
              "Form factors: ATX, Micro-ATX, Mini-ITX.",
            ],
            answer: 1,
            explain: "Correct: \"Weak VRM = instability under heavy load.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Runs hot — needs its own heatsink on gaming boards.",
              "Socket type (LGA, PGA, BGA) must match the CPU.",
              "PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
              "Enterprise policy changes via Group Policy.",
            ],
            answer: 0,
            explain: "Correct: \"Runs hot — needs its own heatsink on gaming boards.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Steps 12 V from the PSU down to ~1 V for the CPU.",
              "Runs hot — needs its own heatsink on gaming boards.",
              "Weak VRM = instability under heavy load.",
              "Browsers, email clients, messaging apps.",
            ],
            answer: 3,
            explain: "\"Browsers, email clients, messaging apps.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "BIOS / UEFI chip — the firmware that starts your PC",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• First code to run when you press power.",
          "• Initialises hardware, then hands over to the OS.",
          "• UEFI replaces the older BIOS with a modern interface.",
        ],
        figures: [
          { id: "hwsw2-bios-uefi", caption: "BIOS / UEFI chip — the firmware that starts your PC" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Rear I/O panel — old vs latest",
              "Virtualisation and containers",
              "Cloud computing software (part 1)",
              "BIOS / UEFI chip — the firmware that starts your PC",
            ],
            answer: 3,
            explain: "This slide covers: BIOS / UEFI chip — the firmware that starts your PC.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Damaged pins here = dead motherboard.",
              "More RAM = more apps open at once without slowing down.",
              "Wired vs wireless: speed vs convenience.",
              "First code to run when you press power.",
            ],
            answer: 3,
            explain: "Correct: \"First code to run when you press power.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "File system organises everything on disk.",
              "Keeps date, time and BIOS settings when unplugged.",
              "Initialises hardware, then hands over to the OS.",
              "Browsers, email clients, messaging apps.",
            ],
            answer: 2,
            explain: "Correct: \"Initialises hardware, then hands over to the OS.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Slower than NVMe but very flexible.",
              "UEFI replaces the older BIOS with a modern interface.",
              "Tiny, extremely fast memory next to the CPU cores.",
              "Updated with vendor tools — carefully.",
            ],
            answer: 1,
            explain: "Correct: \"UEFI replaces the older BIOS with a modern interface.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Initialises hardware, then hands over to the OS.",
              "Runs hot — usually needs a small heatsink.",
              "First code to run when you press power.",
              "UEFI replaces the older BIOS with a modern interface.",
            ],
            answer: 1,
            explain: "\"Runs hot — usually needs a small heatsink.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "CMOS battery — keeps BIOS settings and the clock alive",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Small coin cell (CR2032) on the motherboard.",
          "• Keeps date, time and BIOS settings when unplugged.",
          "• Dead battery = clock resets, boot errors.",
        ],
        figures: [
          { id: "hwsw2-cmos-battery", caption: "CMOS battery — keeps BIOS settings and the clock alive" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "CMOS battery — keeps BIOS settings and the clock alive",
              "The history of storage devices — from magnetic drums to NVMe",
              "Output devices — monitors, speakers, headphones, projectors, VR, printers and more",
              "When would you actually want to use the Registry?",
            ],
            answer: 0,
            explain: "This slide covers: CMOS battery — keeps BIOS settings and the clock alive.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Small coin cell (CR2032) on the motherboard.",
              "Queried with SQL.",
              "Fingerprint reader for secure sign-in.",
              "AC → rectifier → transformer → DC rails.",
            ],
            answer: 0,
            explain: "Correct: \"Small coin cell (CR2032) on the motherboard.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Front panel connects power button, USB and audio.",
              "Billions of transistors; multiple cores and threads.",
              "Microsoft 365, Google Workspace: everyday SaaS.",
              "Keeps date, time and BIOS settings when unplugged.",
            ],
            answer: 3,
            explain: "Correct: \"Keeps date, time and BIOS settings when unplugged.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Users are still the biggest attack surface.",
              "Thunderbolt 4/5 is the fastest general port on a PC.",
              "Dead battery = clock resets, boot errors.",
              "Windows, macOS, Linux, ChromeOS, Android, iOS.",
            ],
            answer: 2,
            explain: "Correct: \"Dead battery = clock resets, boot errors.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Small coin cell (CR2032) on the motherboard.",
              "3D and design tools (Blender, AutoCAD).",
              "Dead battery = clock resets, boot errors.",
              "Keeps date, time and BIOS settings when unplugged.",
            ],
            answer: 1,
            explain: "\"3D and design tools (Blender, AutoCAD).\" is about a different topic.",
          },
        ],
      },
      {
        heading: "CPU (Central Processing Unit) — anatomy of the chip",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Executes the instructions of every program.",
          "• Billions of transistors; multiple cores and threads.",
          "• Clock speed × cores × cache = real-world performance.",
        ],
        figures: [
          { id: "hwsw2-cpu", caption: "CPU (Central Processing Unit) — anatomy of the chip" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Expansion hardware — add-in cards",
              "CPU (Central Processing Unit) — anatomy of the chip",
              "DIMM slots — where RAM plugs in",
              "Storage hardware — the full family (HDD, SSD, NVMe)",
            ],
            answer: 1,
            explain: "This slide covers: CPU (Central Processing Unit) — anatomy of the chip.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Web servers, CMS platforms.",
              "Editors and IDEs (VS Code, IntelliJ, Xcode).",
              "Executes the instructions of every program.",
              "Runs hot — needs its own heatsink on gaming boards.",
            ],
            answer: 2,
            explain: "Correct: \"Executes the instructions of every program.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Billions of transistors; multiple cores and threads.",
              "NVIDIA vs AMD vs Intel Arc for GPUs.",
              "Storage capacity is a business problem, not just tech.",
              "Stores structured data (SQL Server, MySQL, Postgres).",
            ],
            answer: 0,
            explain: "Correct: \"Billions of transistors; multiple cores and threads.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Where every other software category starts.",
              "Runs on servers, routers and endpoints.",
              "Sealed pump moves coolant to a radiator.",
              "Clock speed × cores × cache = real-world performance.",
            ],
            answer: 3,
            explain: "Correct: \"Clock speed × cores × cache = real-world performance.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Clock speed × cores × cache = real-world performance.",
              "One data cable + one power cable per drive.",
              "Billions of transistors; multiple cores and threads.",
              "Executes the instructions of every program.",
            ],
            answer: 1,
            explain: "\"One data cable + one power cable per drive.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "CPU cache — L1, L2 and L3",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Tiny, extremely fast memory next to the CPU cores.",
          "• L1 fastest/smallest, L3 largest/shared.",
          "• Big cache helps games, databases and AI a lot.",
        ],
        figures: [
          { id: "hwsw2-cpu-cache", caption: "CPU cache — L1, L2 and L3" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "CPU cache — L1, L2 and L3",
              "CPU cooler — traditional air cooler",
              "M.2 slots — where NVMe SSDs live",
              "Networking software",
            ],
            answer: 0,
            explain: "This slide covers: CPU cache — L1, L2 and L3.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Tiny, extremely fast memory next to the CPU cores.",
              "NPU is power-efficient — great on laptops.",
              "Talks directly over PCIe — no SATA bottleneck.",
              "Tensor / matrix cores accelerate AI operations.",
            ],
            answer: 0,
            explain: "Correct: \"Tiny, extremely fast memory next to the CPU cores.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Better for very hot CPUs (i9/Ryzen 9).",
              "Kernel bugs can crash the whole machine (BSOD).",
              "L1 fastest/smallest, L3 largest/shared.",
              "Users think in files; support thinks in units.",
            ],
            answer: 2,
            explain: "Correct: \"L1 fastest/smallest, L3 largest/shared.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Big cache helps games, databases and AI a lot.",
              "Delivers 12 V, 5 V and 3.3 V to the board and drives.",
              "DDR4 and DDR5 are the current standards.",
              "Volatile — loses everything on power off.",
            ],
            answer: 0,
            explain: "Correct: \"Big cache helps games, databases and AI a lot.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Big cache helps games, databases and AI a lot.",
              "L1 fastest/smallest, L3 largest/shared.",
              "Tiny, extremely fast memory next to the CPU cores.",
              "Backups are critical — data loss = job loss.",
            ],
            answer: 3,
            explain: "\"Backups are critical — data loss = job loss.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Different CPUs and GPUs — how modern processors compare",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Intel vs AMD vs Apple: different sockets, same job.",
          "• NVIDIA vs AMD vs Intel Arc for GPUs.",
          "• Pick the chip that matches the user's workload.",
        ],
        figures: [
          { id: "hwsw2-different-cpus-gpus", caption: "Different CPUs and GPUs — how modern processors compare" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "CMOS battery — keeps BIOS settings and the clock alive",
              "CPU (Central Processing Unit) — anatomy of the chip",
              "Software modules — the programs that power your PC",
              "Different CPUs and GPUs — how modern processors compare",
            ],
            answer: 3,
            explain: "This slide covers: Different CPUs and GPUs — how modern processors compare.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Slot size: x1, x4, x8, x16 — must fit the card.",
              "Front panel connects power button, USB and audio.",
              "Stylus, trackball, joystick, controller, light gun.",
              "Intel vs AMD vs Apple: different sockets, same job.",
            ],
            answer: 3,
            explain: "Correct: \"Intel vs AMD vs Apple: different sockets, same job.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "NVIDIA vs AMD vs Intel Arc for GPUs.",
              "Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
              "Router: connects the LAN to the Internet.",
              "Hardware is what you touch; software is what runs on it.",
            ],
            answer: 0,
            explain: "Correct: \"NVIDIA vs AMD vs Intel Arc for GPUs.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "IP addresses identify devices on the network.",
              "Stylus, trackball, joystick, controller, light gun.",
              "Pick the chip that matches the user's workload.",
              "Every app depends on the OS to run.",
            ],
            answer: 2,
            explain: "Correct: \"Pick the chip that matches the user's workload.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "NVIDIA vs AMD vs Intel Arc for GPUs.",
              "Intel vs AMD vs Apple: different sockets, same job.",
              "Each step is roughly ×1000.",
              "Pick the chip that matches the user's workload.",
            ],
            answer: 2,
            explain: "\"Each step is roughly ×1000.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Graphics and AI hardware — from rendering to neural networks",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• The same GPU hardware runs games and neural networks.",
          "• Tensor / matrix cores accelerate AI operations.",
          "• Local AI models now run on consumer GPUs.",
        ],
        figures: [
          { id: "hwsw2-graphics-ai", caption: "Graphics and AI hardware — from rendering to neural networks" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Graphics and AI hardware — from rendering to neural networks",
              "The four components of a computer system — the map for the whole lesson",
              "M.2 slots — where NVMe SSDs live",
              "Cloud computing software (part 2)",
            ],
            answer: 0,
            explain: "This slide covers: Graphics and AI hardware — from rendering to neural networks.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Bad firmware update can brick a device.",
              "Programs users interact with directly.",
              "The same GPU hardware runs games and neural networks.",
              "Containers share the host OS, start in seconds.",
            ],
            answer: 2,
            explain: "Correct: \"The same GPU hardware runs games and neural networks.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "3D and design tools (Blender, AutoCAD).",
              "Runs hot — usually needs a small heatsink.",
              "Antivirus, EDR, SIEM, MFA, encryption.",
              "Tensor / matrix cores accelerate AI operations.",
            ],
            answer: 3,
            explain: "Correct: \"Tensor / matrix cores accelerate AI operations.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Local AI models now run on consumer GPUs.",
              "Support role: getting AI tools working for users.",
              "SaaS, PaaS, IaaS — three service models.",
              "Compilers, debuggers, version control (Git).",
            ],
            answer: 0,
            explain: "Correct: \"Local AI models now run on consumer GPUs.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "The same GPU hardware runs games and neural networks.",
              "Local AI models now run on consumer GPUs.",
              "Antivirus, backup, disk clean-up, compression.",
              "Tensor / matrix cores accelerate AI operations.",
            ],
            answer: 2,
            explain: "\"Antivirus, backup, disk clean-up, compression.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Modern AI PC hardware — CPU + GPU + NPU together",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• NPU (Neural Processing Unit) is a dedicated AI chip.",
          "• Copilot+ PCs use CPU, GPU and NPU together.",
          "• NPU is power-efficient — great on laptops.",
        ],
        figures: [
          { id: "hwsw2-modern-ai-pc", caption: "Modern AI PC hardware — CPU + GPU + NPU together" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Kernel vs Registry on Windows (part 2)",
              "Modern AI PC hardware — CPU + GPU + NPU together",
              "The four components of a computer system — the map for the whole lesson",
              "Cloud computing software (part 2)",
            ],
            answer: 1,
            explain: "This slide covers: Modern AI PC hardware — CPU + GPU + NPU together.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Runs hot — usually needs a small heatsink.",
              "NPU (Neural Processing Unit) is a dedicated AI chip.",
              "Weak VRM = instability under heavy load.",
              "Copilots, chatbots, image and voice tools.",
            ],
            answer: 1,
            explain: "Correct: \"NPU (Neural Processing Unit) is a dedicated AI chip.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Damaged pins here = dead motherboard.",
              "Wired vs wireless: speed vs convenience.",
              "Copilot+ PCs use CPU, GPU and NPU together.",
              "Used for SATA SSDs, HDDs and DVD drives.",
            ],
            answer: 2,
            explain: "Correct: \"Copilot+ PCs use CPU, GPU and NPU together.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Billions of transistors; multiple cores and threads.",
              "Pick the chip that matches the user's workload.",
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
              "NPU is power-efficient — great on laptops.",
            ],
            answer: 3,
            explain: "Correct: \"NPU is power-efficient — great on laptops.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Copilot+ PCs use CPU, GPU and NPU together.",
              "NPU is power-efficient — great on laptops.",
              "History explains today's design choices.",
              "NPU (Neural Processing Unit) is a dedicated AI chip.",
            ],
            answer: 2,
            explain: "\"History explains today's design choices.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "CPU cooler — traditional air cooler",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Heatsink + fan moves heat from CPU to case air.",
          "• Reliable, cheap, no leaks.",
          "• Thermal paste sits between CPU and heatsink.",
        ],
        figures: [
          { id: "hwsw2-cpu-cooler-air", caption: "CPU cooler — traditional air cooler" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "CPU cooler — traditional air cooler",
              "Multimedia and creative software",
              "Ports and connectors — USB-A/C, Thunderbolt, HDMI, DisplayPort, Ethernet, audio, SD",
              "Kernel vs Registry on Windows (part 1)",
            ],
            answer: 0,
            explain: "This slide covers: CPU cooler — traditional air cooler.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Heatsink + fan moves heat from CPU to case air.",
              "Better for very hot CPUs (i9/Ryzen 9).",
              "Kernel = the core code that runs the OS.",
              "Users think in files; support thinks in units.",
            ],
            answer: 0,
            explain: "Correct: \"Heatsink + fan moves heat from CPU to case air.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Back up before touching either.",
              "Reliable, cheap, no leaks.",
              "Cloud storage, cloud backup, cloud identity.",
              "HDD: spinning platters, cheap and large, slow.",
            ],
            answer: 1,
            explain: "Correct: \"Reliable, cheap, no leaks.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Slower than NVMe but very flexible.",
              "Old boards: PS/2, VGA, parallel, serial.",
              "Thermal paste sits between CPU and heatsink.",
              "Updated with vendor tools — carefully.",
            ],
            answer: 2,
            explain: "Correct: \"Thermal paste sits between CPU and heatsink.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Heatsink + fan moves heat from CPU to case air.",
              "Reliable, cheap, no leaks.",
              "Thermal paste sits between CPU and heatsink.",
              "Public, private, hybrid — three deployment models.",
            ],
            answer: 3,
            explain: "\"Public, private, hybrid — three deployment models.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Liquid CPU cooler — AIO (All-In-One)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Sealed pump moves coolant to a radiator.",
          "• Better for very hot CPUs (i9/Ryzen 9).",
          "• Pump can fail — watch for temperature spikes.",
        ],
        figures: [
          { id: "hwsw2-cpu-cooler-aio", caption: "Liquid CPU cooler — AIO (All-In-One)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "When would you actually want to use the Registry?",
              "SSD (NVMe M.2) — the modern fast SSD",
              "The history of storage devices — from magnetic drums to NVMe",
              "Liquid CPU cooler — AIO (All-In-One)",
            ],
            answer: 3,
            explain: "This slide covers: Liquid CPU cooler — AIO (All-In-One).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Weak VRM = instability under heavy load.",
              "Undersized PSU = crashes under GPU load.",
              "Kernel talks to hardware; UI talks to the user.",
              "Sealed pump moves coolant to a radiator.",
            ],
            answer: 3,
            explain: "Correct: \"Sealed pump moves coolant to a radiator.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Better for very hot CPUs (i9/Ryzen 9).",
              "Not all USB-C ports carry video or Thunderbolt.",
              "Small coin cell (CR2032) on the motherboard.",
              "Thermal paste sits between CPU and heatsink.",
            ],
            answer: 0,
            explain: "Correct: \"Better for very hot CPUs (i9/Ryzen 9).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Clock speed × cores × cache = real-world performance.",
              "Pump can fail — watch for temperature spikes.",
              "Run on top of the OS.",
              "Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
            ],
            answer: 1,
            explain: "Correct: \"Pump can fail — watch for temperature spikes.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Converts AC mains to DC rails for every component.",
              "Sealed pump moves coolant to a radiator.",
              "Better for very hot CPUs (i9/Ryzen 9).",
              "Pump can fail — watch for temperature spikes.",
            ],
            answer: 0,
            explain: "\"Converts AC mains to DC rails for every component.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Cooling and thermal components — the whole thermal system",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
          "• Airflow direction: in at the front, out at the rear.",
          "• Dust is enemy #1 — clean filters regularly.",
        ],
        figures: [
          { id: "hwsw2-cooling-components", caption: "Cooling and thermal components — the whole thermal system" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Cooling and thermal components — the whole thermal system",
              "Software modules — the programs that power your PC",
              "VRM (Voltage Regulator Module) — the power behind your CPU",
              "CMOS battery — keeps BIOS settings and the clock alive",
            ],
            answer: 0,
            explain: "This slide covers: Cooling and thermal components — the whole thermal system.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
              "Defence in depth — no single product is enough.",
              "Kernel talks to hardware; UI talks to the user.",
              "Undersized PSU = crashes under GPU load.",
            ],
            answer: 0,
            explain: "Correct: \"Case fans, CPU cooler, VRM & M.2 heatsinks, paste.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "New boards: USB-C, HDMI, DisplayPort, 2.5G Ethernet.",
              "Enterprise policy changes via Group Policy.",
              "PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
              "Airflow direction: in at the front, out at the rear.",
            ],
            answer: 3,
            explain: "Correct: \"Airflow direction: in at the front, out at the rear.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Dust is enemy #1 — clean filters regularly.",
              "Web servers, CMS platforms.",
              "Each port has a specific role: data, video, network, audio.",
              "Runs hot — needs its own heatsink on gaming boards.",
            ],
            answer: 0,
            explain: "Correct: \"Dust is enemy #1 — clean filters regularly.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Dust is enemy #1 — clean filters regularly.",
              "'The cloud' = someone else's servers.",
              "Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
              "Airflow direction: in at the front, out at the rear.",
            ],
            answer: 1,
            explain: "\"'The cloud' = someone else's servers.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Memory (RAM) — how the modules work",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Volatile — loses everything on power off.",
          "• More RAM = more apps open at once without slowing down.",
          "• DDR4 and DDR5 are the current standards.",
        ],
        figures: [
          { id: "hwsw2-memory-ram", caption: "Memory (RAM) — how the modules work" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Cloud computing software (part 1)",
              "Memory (RAM) — how the modules work",
              "Firmware and low-level software",
              "Input devices — the essentials",
            ],
            answer: 1,
            explain: "This slide covers: Memory (RAM) — how the modules work.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Check maximum supported speed in the manual.",
              "Volatile — loses everything on power off.",
              "Photo, video, audio editors (Photoshop, Premiere).",
              "Public, private, hybrid — three deployment models.",
            ],
            answer: 1,
            explain: "Correct: \"Volatile — loses everything on power off.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "More RAM = more apps open at once without slowing down.",
              "3D and design tools (Blender, AutoCAD).",
              "Antivirus, EDR, SIEM, MFA, encryption.",
              "Backups are critical — data loss = job loss.",
            ],
            answer: 0,
            explain: "Correct: \"More RAM = more apps open at once without slowing down.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Small tools, big impact on reliability.",
              "Chipset routes traffic between all components.",
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
              "DDR4 and DDR5 are the current standards.",
            ],
            answer: 3,
            explain: "Correct: \"DDR4 and DDR5 are the current standards.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "More RAM = more apps open at once without slowing down.",
              "Delivers 12 V, 5 V and 3.3 V to the board and drives.",
              "DDR4 and DDR5 are the current standards.",
              "Volatile — loses everything on power off.",
            ],
            answer: 1,
            explain: "\"Delivers 12 V, 5 V and 3.3 V to the board and drives.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "DIMM slots — where RAM plugs in",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Colour-coded pairs enable dual-channel mode.",
          "• Populate matching slots for double the bandwidth.",
          "• Check maximum supported speed in the manual.",
        ],
        figures: [
          { id: "hwsw2-dimm-slots", caption: "DIMM slots — where RAM plugs in" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "DIMM slots — where RAM plugs in",
              "Computer case (chassis)",
              "Kernel vs Registry on Windows (part 1)",
              "How a PSU converts and delivers power in a PC",
            ],
            answer: 0,
            explain: "This slide covers: DIMM slots — where RAM plugs in.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Clock speed × cores × cache = real-world performance.",
              "Copilot+ PCs use CPU, GPU and NPU together.",
              "Colour-coded pairs enable dual-channel mode.",
              "Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
            ],
            answer: 2,
            explain: "Correct: \"Colour-coded pairs enable dual-channel mode.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Clock speed × cores × cache = real-world performance.",
              "Populate matching slots for double the bandwidth.",
              "Sealed pump moves coolant to a radiator.",
              "Copilot+ PCs use CPU, GPU and NPU together.",
            ],
            answer: 1,
            explain: "Correct: \"Populate matching slots for double the bandwidth.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Check maximum supported speed in the manual.",
              "Drivers translate between the two.",
              "Volatile — loses everything on power off.",
              "Dust is enemy #1 — clean filters regularly.",
            ],
            answer: 0,
            explain: "Correct: \"Check maximum supported speed in the manual.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Colour-coded pairs enable dual-channel mode.",
              "Check maximum supported speed in the manual.",
              "Populate matching slots for double the bandwidth.",
              "DHCP, DNS, VPN, firewall, load balancer.",
            ],
            answer: 3,
            explain: "\"DHCP, DNS, VPN, firewall, load balancer.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Storage hardware — the full family (HDD, SSD, NVMe)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• HDD: spinning platters, cheap and large, slow.",
          "• SATA SSD: no moving parts, fast enough for most users.",
          "• NVMe SSD: plugs into M.2, blazing fast.",
        ],
        figures: [
          { id: "hwsw2-storage-hardware", caption: "Storage hardware — the full family (HDD, SSD, NVMe)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Data units explained — from 1 kilobyte to zettabytes",
              "New ports and connections — modern connectivity",
              "CPU (Central Processing Unit) — anatomy of the chip",
              "Storage hardware — the full family (HDD, SSD, NVMe)",
            ],
            answer: 3,
            explain: "This slide covers: Storage hardware — the full family (HDD, SSD, NVMe).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "MIDI, eye tracker, voice, iris, data glove, foot pedal.",
              "Small tools, big impact on reliability.",
              "KB → MB → GB → TB → PB → EB → ZB.",
              "HDD: spinning platters, cheap and large, slow.",
            ],
            answer: 3,
            explain: "Correct: \"HDD: spinning platters, cheap and large, slow.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "80 PLUS rating = efficiency (Bronze < Gold < Titanium).",
              "Switch: connects wired devices inside the LAN.",
              "SATA SSD: no moving parts, fast enough for most users.",
              "AC → rectifier → transformer → DC rails.",
            ],
            answer: 2,
            explain: "Correct: \"SATA SSD: no moving parts, fast enough for most users.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Users are still the biggest attack surface.",
              "NVMe SSD: plugs into M.2, blazing fast.",
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Thunderbolt 4/5 is the fastest general port on a PC.",
            ],
            answer: 1,
            explain: "Correct: \"NVMe SSD: plugs into M.2, blazing fast.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "SATA SSD: no moving parts, fast enough for most users.",
              "Front panel connects power button, USB and audio.",
              "HDD: spinning platters, cheap and large, slow.",
              "NVMe SSD: plugs into M.2, blazing fast.",
            ],
            answer: 1,
            explain: "\"Front panel connects power button, USB and audio.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "SSD (NVMe M.2) — the modern fast SSD",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Talks directly over PCIe — no SATA bottleneck.",
          "• Up to 10× faster than SATA SSDs.",
          "• Runs hot — usually needs a small heatsink.",
        ],
        figures: [
          { id: "hwsw2-ssd-nvme", caption: "SSD (NVMe M.2) — the modern fast SSD" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "SSD (NVMe M.2) — the modern fast SSD",
              "Memory (RAM) — how the modules work",
              "Web and internet software",
              "DIMM slots — where RAM plugs in",
            ],
            answer: 0,
            explain: "This slide covers: SSD (NVMe M.2) — the modern fast SSD.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Talks directly over PCIe — no SATA bottleneck.",
              "Hearing: speakers and headphones.",
              "Local AI models now run on consumer GPUs.",
              "DHCP, DNS, VPN, firewall, load balancer.",
            ],
            answer: 0,
            explain: "Correct: \"Talks directly over PCIe — no SATA bottleneck.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Users are still the biggest attack surface.",
              "Removing stubborn leftover app entries.",
              "Windows, macOS, Linux, ChromeOS, Android, iOS.",
              "Up to 10× faster than SATA SSDs.",
            ],
            answer: 3,
            explain: "Correct: \"Up to 10× faster than SATA SSDs.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Back up before touching either.",
              "Hardware is what you touch; software is what runs on it.",
              "Runs hot — usually needs a small heatsink.",
              "Colour-coded pairs enable dual-channel mode.",
            ],
            answer: 2,
            explain: "Correct: \"Runs hot — usually needs a small heatsink.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Talks directly over PCIe — no SATA bottleneck.",
              "Defence in depth — no single product is enough.",
              "Runs hot — usually needs a small heatsink.",
              "Up to 10× faster than SATA SSDs.",
            ],
            answer: 1,
            explain: "\"Defence in depth — no single product is enough.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "M.2 slots — where NVMe SSDs live",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Long, thin slot on the motherboard.",
          "• Uses PCIe lanes for high speed.",
          "• Watch for shared bandwidth with SATA on some boards.",
        ],
        figures: [
          { id: "hwsw2-m2-slots", caption: "M.2 slots — where NVMe SSDs live" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "BIOS / UEFI chip — the firmware that starts your PC",
              "M.2 slots — where NVMe SSDs live",
              "New ports and connections — modern connectivity",
              "Graphics and AI hardware — from rendering to neural networks",
            ],
            answer: 1,
            explain: "This slide covers: M.2 slots — where NVMe SSDs live.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Up to 10× faster than SATA SSDs.",
              "USB-C is reversible and delivers data + video + power.",
              "Long, thin slot on the motherboard.",
              "Most 'apps' today are really web apps.",
            ],
            answer: 2,
            explain: "Correct: \"Long, thin slot on the motherboard.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Uses PCIe lanes for high speed.",
              "Small tools, big impact on reliability.",
              "Chipset routes traffic between all components.",
              "KB → MB → GB → TB → PB → EB → ZB.",
            ],
            answer: 0,
            explain: "Correct: \"Uses PCIe lanes for high speed.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "History explains today's design choices.",
              "Hearing: speakers and headphones.",
              "DHCP, DNS, VPN, firewall, load balancer.",
              "Watch for shared bandwidth with SATA on some boards.",
            ],
            answer: 3,
            explain: "Correct: \"Watch for shared bandwidth with SATA on some boards.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Watch for shared bandwidth with SATA on some boards.",
              "USB-C is reversible and delivers data + video + power.",
              "Uses PCIe lanes for high speed.",
              "Long, thin slot on the motherboard.",
            ],
            answer: 1,
            explain: "\"USB-C is reversible and delivers data + video + power.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "SATA ports — connecting SATA drives and optical drives",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• One data cable + one power cable per drive.",
          "• Used for SATA SSDs, HDDs and DVD drives.",
          "• Slower than NVMe but very flexible.",
        ],
        figures: [
          { id: "hwsw2-sata-ports", caption: "SATA ports — connecting SATA drives and optical drives" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "SATA ports — connecting SATA drives and optical drives",
              "BIOS / UEFI chip — the firmware that starts your PC",
              "Utility software — the small tools that keep systems healthy",
              "Graphics and AI hardware — from rendering to neural networks",
            ],
            answer: 0,
            explain: "This slide covers: SATA ports — connecting SATA drives and optical drives.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "One data cable + one power cable per drive.",
              "Different jobs, often confused.",
              "Physical mount that connects the CPU to the board.",
              "CRM: customer records (Salesforce, Dynamics).",
            ],
            answer: 0,
            explain: "Correct: \"One data cable + one power cable per drive.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Removing stubborn leftover app entries.",
              "Long, thin slot on the motherboard.",
              "Used for SATA SSDs, HDDs and DVD drives.",
              "Dead battery = clock resets, boot errors.",
            ],
            answer: 2,
            explain: "Correct: \"Used for SATA SSDs, HDDs and DVD drives.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Slower than NVMe but very flexible.",
              "Tensor / matrix cores accelerate AI operations.",
              "Support technicians rely on utilities daily.",
              "Programs users interact with directly.",
            ],
            answer: 0,
            explain: "Correct: \"Slower than NVMe but very flexible.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Slower than NVMe but very flexible.",
              "Used for SATA SSDs, HDDs and DVD drives.",
              "One data cable + one power cable per drive.",
              "Support role: getting AI tools working for users.",
            ],
            answer: 3,
            explain: "\"Support role: getting AI tools working for users.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Data units explained — from 1 kilobyte to zettabytes",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• KB → MB → GB → TB → PB → EB → ZB.",
          "• Each step is roughly ×1000.",
          "• Users think in files; support thinks in units.",
        ],
        figures: [
          { id: "hwsw2-data-units", caption: "Data units explained — from 1 kilobyte to zettabytes" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "AI software",
              "Operating system components — kernel, drivers, file system, services, UI",
              "Programming and development software",
              "Data units explained — from 1 kilobyte to zettabytes",
            ],
            answer: 3,
            explain: "This slide covers: Data units explained — from 1 kilobyte to zettabytes.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "More RAM = more apps open at once without slowing down.",
              "UEFI replaces the older BIOS with a modern interface.",
              "First code to run when you press power.",
              "KB → MB → GB → TB → PB → EB → ZB.",
            ],
            answer: 3,
            explain: "Correct: \"KB → MB → GB → TB → PB → EB → ZB.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Each step is roughly ×1000.",
              "Dead battery = clock resets, boot errors.",
              "Long, thin slot on the motherboard.",
              "Databases, cloud, games — every type has a role.",
            ],
            answer: 0,
            explain: "Correct: \"Each step is roughly ×1000.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "L1 fastest/smallest, L3 largest/shared.",
              "NPU (Neural Processing Unit) is a dedicated AI chip.",
              "Users think in files; support thinks in units.",
              "Storage capacity is a business problem, not just tech.",
            ],
            answer: 2,
            explain: "Correct: \"Users think in files; support thinks in units.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Each step is roughly ×1000.",
              "KB → MB → GB → TB → PB → EB → ZB.",
              "Not all USB-C ports carry video or Thunderbolt.",
              "Users think in files; support thinks in units.",
            ],
            answer: 2,
            explain: "\"Not all USB-C ports carry video or Thunderbolt.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "The history of storage devices — from magnetic drums to NVMe",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Punched cards → tape → drums → HDD → SSD → NVMe.",
          "• Storage got smaller, faster and cheaper every decade.",
          "• History explains today's design choices.",
        ],
        figures: [
          { id: "hwsw2-history-storage", caption: "The history of storage devices — from magnetic drums to NVMe" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "The history of storage devices — from magnetic drums to NVMe",
              "Cloud computing software (part 1)",
              "Input devices — the essentials",
              "Rear I/O panel — old vs latest",
            ],
            answer: 0,
            explain: "This slide covers: The history of storage devices — from magnetic drums to NVMe.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Learn what each port can and can't carry.",
              "Global data doubles every couple of years.",
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
              "Form factors: ATX, Micro-ATX, Mini-ITX.",
            ],
            answer: 2,
            explain: "Correct: \"Punched cards → tape → drums → HDD → SSD → NVMe.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Scanner, barcode/QR reader, smart card reader.",
              "Both save cost and enable rapid deployment.",
              "USB-C is reversible and delivers data + video + power.",
              "Storage got smaller, faster and cheaper every decade.",
            ],
            answer: 3,
            explain: "Correct: \"Storage got smaller, faster and cheaper every decade.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "History explains today's design choices.",
              "Cable quality matters — cheap cables fail silently.",
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Thunderbolt 4/5 is the fastest general port on a PC.",
            ],
            answer: 0,
            explain: "Correct: \"History explains today's design choices.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
              "History explains today's design choices.",
              "Central hub that connects CPU, RAM, storage, GPU and PSU.",
              "Storage got smaller, faster and cheaper every decade.",
            ],
            answer: 2,
            explain: "\"Central hub that connects CPU, RAM, storage, GPU and PSU.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "How much information do we have in the world?",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Global data doubles every couple of years.",
          "• Most new data is video, images and telemetry.",
          "• Storage capacity is a business problem, not just tech.",
        ],
        figures: [
          { id: "hwsw2-info-in-world", caption: "How much information do we have in the world?" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Memory (RAM) — how the modules work",
              "How much information do we have in the world?",
              "Liquid CPU cooler — AIO (All-In-One)",
              "Web and internet software",
            ],
            answer: 1,
            explain: "This slide covers: How much information do we have in the world?.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "GPU-hungry — plan hardware accordingly.",
              "Global data doubles every couple of years.",
              "Registry = a database of settings for OS and apps.",
              "Applying a fix that has no GUI setting.",
            ],
            answer: 1,
            explain: "Correct: \"Global data doubles every couple of years.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "HR: people and payroll (Workday, Sage).",
              "Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
              "Most new data is video, images and telemetry.",
              "Compilers, debuggers, version control (Git).",
            ],
            answer: 2,
            explain: "Correct: \"Most new data is video, images and telemetry.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Compilers, debuggers, version control (Git).",
              "HR: people and payroll (Workday, Sage).",
              "SaaS, PaaS, IaaS — three service models.",
              "Storage capacity is a business problem, not just tech.",
            ],
            answer: 3,
            explain: "Correct: \"Storage capacity is a business problem, not just tech.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Most new data is video, images and telemetry.",
              "Storage capacity is a business problem, not just tech.",
              "Great way to modernise an older machine.",
              "Global data doubles every couple of years.",
            ],
            answer: 2,
            explain: "\"Great way to modernise an older machine.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Power Supply Unit (PSU) — anatomy and connectors",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Converts AC mains to DC rails for every component.",
          "• Rated in watts — must exceed system requirements.",
          "• 80 PLUS rating = efficiency (Bronze < Gold < Titanium).",
        ],
        figures: [
          { id: "hwsw2-psu", caption: "Power Supply Unit (PSU) — anatomy and connectors" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Power Supply Unit (PSU) — anatomy and connectors",
              "Kernel vs Registry on Windows (part 2)",
              "VRM (Voltage Regulator Module) — the power behind your CPU",
              "Cloud computing software (part 2)",
            ],
            answer: 0,
            explain: "This slide covers: Power Supply Unit (PSU) — anatomy and connectors.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Converts AC mains to DC rails for every component.",
              "Runs on servers, routers and endpoints.",
              "Heatsink + fan moves heat from CPU to case air.",
              "Support role: getting AI tools working for users.",
            ],
            answer: 0,
            explain: "Correct: \"Converts AC mains to DC rails for every component.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Pump can fail — watch for temperature spikes.",
              "Rated in watts — must exceed system requirements.",
              "Webcam and microphone for calls and content.",
              "Central hub that connects CPU, RAM, storage, GPU and PSU.",
            ],
            answer: 1,
            explain: "Correct: \"Rated in watts — must exceed system requirements.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "UEFI replaces the older BIOS with a modern interface.",
              "Small coin cell (CR2032) on the motherboard.",
              "80 PLUS rating = efficiency (Bronze < Gold < Titanium).",
              "More RAM = more apps open at once without slowing down.",
            ],
            answer: 2,
            explain: "Correct: \"80 PLUS rating = efficiency (Bronze < Gold < Titanium).\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Converts AC mains to DC rails for every component.",
              "Rated in watts — must exceed system requirements.",
              "80 PLUS rating = efficiency (Bronze < Gold < Titanium).",
              "Socket type (LGA, PGA, BGA) must match the CPU.",
            ],
            answer: 3,
            explain: "\"Socket type (LGA, PGA, BGA) must match the CPU.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "How a PSU converts and delivers power in a PC",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• AC → rectifier → transformer → DC rails.",
          "• Delivers 12 V, 5 V and 3.3 V to the board and drives.",
          "• Undersized PSU = crashes under GPU load.",
        ],
        figures: [
          { id: "hwsw2-psu-convert", caption: "How a PSU converts and delivers power in a PC" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Networking and connectivity — how devices reach each other",
              "Programming and development software",
              "Networking hardware (2026)",
              "How a PSU converts and delivers power in a PC",
            ],
            answer: 3,
            explain: "This slide covers: How a PSU converts and delivers power in a PC.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Hearing: speakers and headphones.",
              "Local AI models now run on consumer GPUs.",
              "HDD: spinning platters, cheap and large, slow.",
              "AC → rectifier → transformer → DC rails.",
            ],
            answer: 3,
            explain: "Correct: \"AC → rectifier → transformer → DC rails.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Delivers 12 V, 5 V and 3.3 V to the board and drives.",
              "Airflow direction: in at the front, out at the rear.",
              "Wired vs wireless: speed vs convenience.",
              "Backups are critical — data loss = job loss.",
            ],
            answer: 0,
            explain: "Correct: \"Delivers 12 V, 5 V and 3.3 V to the board and drives.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Software tells hardware what to do.",
              "Undersized PSU = crashes under GPU load.",
              "Storage got smaller, faster and cheaper every decade.",
              "Talks directly over PCIe — no SATA bottleneck.",
            ],
            answer: 1,
            explain: "Correct: \"Undersized PSU = crashes under GPU load.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Stylus, trackball, joystick, controller, light gun.",
              "AC → rectifier → transformer → DC rails.",
              "Delivers 12 V, 5 V and 3.3 V to the board and drives.",
              "Undersized PSU = crashes under GPU load.",
            ],
            answer: 0,
            explain: "\"Stylus, trackball, joystick, controller, light gun.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Computer case (chassis)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Provides airflow, mounting and physical protection.",
          "• Form factors: ATX, Micro-ATX, Mini-ITX.",
          "• Front panel connects power button, USB and audio.",
        ],
        figures: [
          { id: "hwsw2-case", caption: "Computer case (chassis)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Computer case (chassis)",
              "Expansion hardware — add-in cards",
              "DIMM slots — where RAM plugs in",
              "Operating systems — the core system software",
            ],
            answer: 0,
            explain: "This slide covers: Computer case (chassis).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Provides airflow, mounting and physical protection.",
              "Switch: connects wired devices inside the LAN.",
              "Global data doubles every couple of years.",
              "Configuration errors here cause most outages.",
            ],
            answer: 0,
            explain: "Correct: \"Provides airflow, mounting and physical protection.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Runs in the cloud or locally on an NPU/GPU.",
              "Rear I/O is soldered — you cannot swap it out.",
              "Intel vs AMD vs Apple: different sockets, same job.",
              "Form factors: ATX, Micro-ATX, Mini-ITX.",
            ],
            answer: 3,
            explain: "Correct: \"Form factors: ATX, Micro-ATX, Mini-ITX.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Front panel connects power button, USB and audio.",
              "Webcam and microphone for calls and content.",
              "Central hub that connects CPU, RAM, storage, GPU and PSU.",
              "Different jobs, often confused.",
            ],
            answer: 0,
            explain: "Correct: \"Front panel connects power button, USB and audio.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Front panel connects power button, USB and audio.",
              "Runs hot — needs its own heatsink on gaming boards.",
              "Provides airflow, mounting and physical protection.",
              "Form factors: ATX, Micro-ATX, Mini-ITX.",
            ],
            answer: 1,
            explain: "\"Runs hot — needs its own heatsink on gaming boards.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Rear I/O panel — old vs latest",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Old boards: PS/2, VGA, parallel, serial.",
          "• New boards: USB-C, HDMI, DisplayPort, 2.5G Ethernet.",
          "• Rear I/O is soldered — you cannot swap it out.",
        ],
        figures: [
          { id: "hwsw2-rear-io", caption: "Rear I/O panel — old vs latest" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "How a PSU converts and delivers power in a PC",
              "Rear I/O panel — old vs latest",
              "Cybersecurity software",
              "Power Supply Unit (PSU) — anatomy and connectors",
            ],
            answer: 1,
            explain: "This slide covers: Rear I/O panel — old vs latest.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Major clouds: AWS, Azure, Google Cloud.",
              "Old boards: PS/2, VGA, parallel, serial.",
              "Long, thin slot on the motherboard.",
              "Databases, cloud, games — every type has a role.",
            ],
            answer: 1,
            explain: "Correct: \"Old boards: PS/2, VGA, parallel, serial.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "New boards: USB-C, HDMI, DisplayPort, 2.5G Ethernet.",
              "Delivers 12 V, 5 V and 3.3 V to the board and drives.",
              "Kernel bugs can crash the whole machine (BSOD).",
              "Slower than NVMe but very flexible.",
            ],
            answer: 0,
            explain: "Correct: \"New boards: USB-C, HDMI, DisplayPort, 2.5G Ethernet.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Storage got smaller, faster and cheaper every decade.",
              "Often licensed per user or per device.",
              "Every computer = input + processing + storage + output.",
              "Rear I/O is soldered — you cannot swap it out.",
            ],
            answer: 3,
            explain: "Correct: \"Rear I/O is soldered — you cannot swap it out.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "New boards: USB-C, HDMI, DisplayPort, 2.5G Ethernet.",
              "Hearing: speakers and headphones.",
              "Rear I/O is soldered — you cannot swap it out.",
              "Old boards: PS/2, VGA, parallel, serial.",
            ],
            answer: 1,
            explain: "\"Hearing: speakers and headphones.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "New ports and connections — modern connectivity",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• USB-C is reversible and delivers data + video + power.",
          "• Thunderbolt 4/5 is the fastest general port on a PC.",
          "• Learn what each port can and can't carry.",
        ],
        figures: [
          { id: "hwsw2-new-ports", caption: "New ports and connections — modern connectivity" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "New ports and connections — modern connectivity",
              "M.2 slots — where NVMe SSDs live",
              "Cooling and thermal components — the whole thermal system",
              "Operating systems — the core system software",
            ],
            answer: 0,
            explain: "This slide covers: New ports and connections — modern connectivity.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Where every other software category starts.",
              "Registry edits can break login or app behaviour.",
              "USB-C is reversible and delivers data + video + power.",
              "Heatsink + fan moves heat from CPU to case air.",
            ],
            answer: 2,
            explain: "Correct: \"USB-C is reversible and delivers data + video + power.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Bad firmware update can brick a device.",
              "Thunderbolt 4/5 is the fastest general port on a PC.",
              "Firmware lives inside chips (BIOS/UEFI, SSD, NIC).",
              "Containers share the host OS, start in seconds.",
            ],
            answer: 1,
            explain: "Correct: \"Thunderbolt 4/5 is the fastest general port on a PC.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Learn what each port can and can't carry.",
              "SATA SSD: no moving parts, fast enough for most users.",
              "Every computer = input + processing + storage + output.",
              "Often licensed per user or per device.",
            ],
            answer: 0,
            explain: "Correct: \"Learn what each port can and can't carry.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "USB-C is reversible and delivers data + video + power.",
              "Learn what each port can and can't carry.",
              "Thunderbolt 4/5 is the fastest general port on a PC.",
              "Small coin cell (CR2032) on the motherboard.",
            ],
            answer: 3,
            explain: "\"Small coin cell (CR2032) on the motherboard.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Ports and connectors — USB-A/C, Thunderbolt, HDMI, DisplayPort, Ethernet, audio, SD",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Each port has a specific role: data, video, network, audio.",
          "• Not all USB-C ports carry video or Thunderbolt.",
          "• Cable quality matters — cheap cables fail silently.",
        ],
        figures: [
          { id: "hwsw2-peripheral-devices", caption: "Ports and connectors — USB-A/C, Thunderbolt, HDMI, DisplayPort, Ethernet, audio, SD" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Cooling and thermal components — the whole thermal system",
              "The CPU socket — where the processor lives",
              "M.2 slots — where NVMe SSDs live",
              "Ports and connectors — USB-A/C, Thunderbolt, HDMI, DisplayPort, Ethernet, audio, SD",
            ],
            answer: 3,
            explain: "This slide covers: Ports and connectors — USB-A/C, Thunderbolt, HDMI, DisplayPort, Ethernet, audio, SD.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "UEFI replaces the older BIOS with a modern interface.",
              "Thunderbolt 4/5 is the fastest general port on a PC.",
              "Small coin cell (CR2032) on the motherboard.",
              "Each port has a specific role: data, video, network, audio.",
            ],
            answer: 3,
            explain: "Correct: \"Each port has a specific role: data, video, network, audio.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Pick the chip that matches the user's workload.",
              "Billions of transistors; multiple cores and threads.",
              "Not all USB-C ports carry video or Thunderbolt.",
              "Steps 12 V from the PSU down to ~1 V for the CPU.",
            ],
            answer: 2,
            explain: "Correct: \"Not all USB-C ports carry video or Thunderbolt.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Access point: provides Wi-Fi coverage.",
              "Cable quality matters — cheap cables fail silently.",
              "Intel vs AMD vs Apple: different sockets, same job.",
              "Better for very hot CPUs (i9/Ryzen 9).",
            ],
            answer: 1,
            explain: "Correct: \"Cable quality matters — cheap cables fail silently.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Not all USB-C ports carry video or Thunderbolt.",
              "Access point: provides Wi-Fi coverage.",
              "Each port has a specific role: data, video, network, audio.",
              "Cable quality matters — cheap cables fail silently.",
            ],
            answer: 1,
            explain: "\"Access point: provides Wi-Fi coverage.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Expansion hardware — add-in cards",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
          "• Slot size: x1, x4, x8, x16 — must fit the card.",
          "• Great way to modernise an older machine.",
        ],
        figures: [
          { id: "hwsw2-expansion-hw", caption: "Expansion hardware — add-in cards" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Expansion hardware — add-in cards",
              "Different CPUs and GPUs — how modern processors compare",
              "Motherboard components — the labelled overview",
              "Database software",
            ],
            answer: 0,
            explain: "This slide covers: Expansion hardware — add-in cards.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
              "Up to 10× faster than SATA SSDs.",
              "Most 'apps' today are really web apps.",
              "Provides airflow, mounting and physical protection.",
            ],
            answer: 0,
            explain: "Correct: \"PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Rear I/O is soldered — you cannot swap it out.",
              "Used for SATA SSDs, HDDs and DVD drives.",
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
              "Slot size: x1, x4, x8, x16 — must fit the card.",
            ],
            answer: 3,
            explain: "Correct: \"Slot size: x1, x4, x8, x16 — must fit the card.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Undersized PSU = crashes under GPU load.",
              "Not all USB-C ports carry video or Thunderbolt.",
              "Great way to modernise an older machine.",
              "Microsoft 365, Google Workspace: everyday SaaS.",
            ],
            answer: 2,
            explain: "Correct: \"Great way to modernise an older machine.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
              "Billions of transistors; multiple cores and threads.",
              "Great way to modernise an older machine.",
              "Slot size: x1, x4, x8, x16 — must fit the card.",
            ],
            answer: 1,
            explain: "\"Billions of transistors; multiple cores and threads.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Input devices — the essentials",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Keyboard, mouse, touchpad, touchscreen.",
          "• Webcam and microphone for calls and content.",
          "• Fingerprint reader for secure sign-in.",
        ],
        figures: [
          { id: "hwsw2-input-devices", caption: "Input devices — the essentials" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Software modules — the programs that power your PC",
              "Input devices — the essentials",
              "Kernel vs Registry on Windows (part 2)",
              "VRM (Voltage Regulator Module) — the power behind your CPU",
            ],
            answer: 1,
            explain: "This slide covers: Input devices — the essentials.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Queried with SQL.",
              "Executes the instructions of every program.",
              "Keyboard, mouse, touchpad, touchscreen.",
              "Great way to modernise an older machine.",
            ],
            answer: 2,
            explain: "Correct: \"Keyboard, mouse, touchpad, touchscreen.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Webcam and microphone for calls and content.",
              "IP addresses identify devices on the network.",
              "Every app depends on the OS to run.",
              "Antivirus, backup, disk clean-up, compression.",
            ],
            answer: 0,
            explain: "Correct: \"Webcam and microphone for calls and content.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Major clouds: AWS, Azure, Google Cloud.",
              "Reliable, cheap, no leaks.",
              "Kernel = the core code that runs the OS.",
              "Fingerprint reader for secure sign-in.",
            ],
            answer: 3,
            explain: "Correct: \"Fingerprint reader for secure sign-in.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Fingerprint reader for secure sign-in.",
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Webcam and microphone for calls and content.",
              "Keyboard, mouse, touchpad, touchscreen.",
            ],
            answer: 1,
            explain: "\"OS, apps, utilities, drivers, firmware, middleware.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Input devices — the extended catalogue (24 devices)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Stylus, trackball, joystick, controller, light gun.",
          "• Scanner, barcode/QR reader, smart card reader.",
          "• MIDI, eye tracker, voice, iris, data glove, foot pedal.",
        ],
        figures: [
          { id: "hwsw2-input-devices-extended", caption: "Input devices — the extended catalogue (24 devices)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Input devices — the extended catalogue (24 devices)",
              "Cybersecurity software",
              "Power Supply Unit (PSU) — anatomy and connectors",
              "The history of storage devices — from magnetic drums to NVMe",
            ],
            answer: 0,
            explain: "This slide covers: Input devices — the extended catalogue (24 devices).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Stylus, trackball, joystick, controller, light gun.",
              "Thermal paste sits between CPU and heatsink.",
              "ERP: finance, stock, procurement (SAP, Oracle).",
              "Most new data is video, images and telemetry.",
            ],
            answer: 0,
            explain: "Correct: \"Stylus, trackball, joystick, controller, light gun.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Airflow direction: in at the front, out at the rear.",
              "Antivirus, EDR, SIEM, MFA, encryption.",
              "Scanner, barcode/QR reader, smart card reader.",
              "Backups are critical — data loss = job loss.",
            ],
            answer: 2,
            explain: "Correct: \"Scanner, barcode/QR reader, smart card reader.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "MIDI, eye tracker, voice, iris, data glove, foot pedal.",
              "Cloud storage, cloud backup, cloud identity.",
              "Learn what each port can and can't carry.",
              "Colour-coded pairs enable dual-channel mode.",
            ],
            answer: 0,
            explain: "Correct: \"MIDI, eye tracker, voice, iris, data glove, foot pedal.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "MIDI, eye tracker, voice, iris, data glove, foot pedal.",
              "Scanner, barcode/QR reader, smart card reader.",
              "Stylus, trackball, joystick, controller, light gun.",
              "Big cache helps games, databases and AI a lot.",
            ],
            answer: 3,
            explain: "\"Big cache helps games, databases and AI a lot.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Output devices — monitors, speakers, headphones, projectors, VR, printers and more",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
          "• Hearing: speakers and headphones.",
          "• Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
        ],
        figures: [
          { id: "hwsw2-output-devices", caption: "Output devices — monitors, speakers, headphones, projectors, VR, printers and more" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Utility software — the small tools that keep systems healthy",
              "Liquid CPU cooler — AIO (All-In-One)",
              "BIOS / UEFI chip — the firmware that starts your PC",
              "Output devices — monitors, speakers, headphones, projectors, VR, printers and more",
            ],
            answer: 3,
            explain: "This slide covers: Output devices — monitors, speakers, headphones, projectors, VR, printers and more.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Hardware is what you touch; software is what runs on it.",
              "Back up before touching either.",
              "Router: connects the LAN to the Internet.",
              "Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
            ],
            answer: 3,
            explain: "Correct: \"Sight: monitors, projectors, VR headsets, smart glasses, LED displays.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Hearing: speakers and headphones.",
              "DNS turns names into IP addresses.",
              "First code to run when you press power.",
              "More RAM = more apps open at once without slowing down.",
            ],
            answer: 0,
            explain: "Correct: \"Hearing: speakers and headphones.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Manages hardware, users, files, security.",
              "Photo, video, audio editors (Photoshop, Premiere).",
              "Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
              "Big cache helps games, databases and AI a lot.",
            ],
            answer: 2,
            explain: "Correct: \"Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Hearing: speakers and headphones.",
              "Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
              "Manages hardware, users, files, security.",
              "Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
            ],
            answer: 2,
            explain: "\"Manages hardware, users, files, security.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Networking hardware (2026)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Router: connects the LAN to the Internet.",
          "• Switch: connects wired devices inside the LAN.",
          "• Access point: provides Wi-Fi coverage.",
        ],
        figures: [
          { id: "hwsw2-networking-hw", caption: "Networking hardware (2026)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Networking hardware (2026)",
              "Enterprise and business software (ERP, CRM, HR)",
              "Application software — the big picture",
              "Motherboard components — the labelled overview",
            ],
            answer: 0,
            explain: "This slide covers: Networking hardware (2026).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Pump can fail — watch for temperature spikes.",
              "Central hub that connects CPU, RAM, storage, GPU and PSU.",
              "Router: connects the LAN to the Internet.",
              "Defence in depth — no single product is enough.",
            ],
            answer: 2,
            explain: "Correct: \"Router: connects the LAN to the Internet.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "SATA SSD: no moving parts, fast enough for most users.",
              "Fingerprint reader for secure sign-in.",
              "Every computer = input + processing + storage + output.",
              "Switch: connects wired devices inside the LAN.",
            ],
            answer: 3,
            explain: "Correct: \"Switch: connects wired devices inside the LAN.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Access point: provides Wi-Fi coverage.",
              "Chipset routes traffic between all components.",
              "KB → MB → GB → TB → PB → EB → ZB.",
              "Billions of transistors; multiple cores and threads.",
            ],
            answer: 0,
            explain: "Correct: \"Access point: provides Wi-Fi coverage.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Router: connects the LAN to the Internet.",
              "Access point: provides Wi-Fi coverage.",
              "The same GPU hardware runs games and neural networks.",
              "Switch: connects wired devices inside the LAN.",
            ],
            answer: 2,
            explain: "\"The same GPU hardware runs games and neural networks.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Networking and connectivity — how devices reach each other",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Wired vs wireless: speed vs convenience.",
          "• IP addresses identify devices on the network.",
          "• DNS turns names into IP addresses.",
        ],
        figures: [
          { id: "hwsw2-networking-connectivity", caption: "Networking and connectivity — how devices reach each other" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Multimedia and creative software",
              "Networking and connectivity — how devices reach each other",
              "How a PSU converts and delivers power in a PC",
              "Kernel vs Registry on Windows (part 1)",
            ],
            answer: 1,
            explain: "This slide covers: Networking and connectivity — how devices reach each other.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Watch for shared bandwidth with SATA on some boards.",
              "Wired vs wireless: speed vs convenience.",
              "Up to 10× faster than SATA SSDs.",
              "Provides airflow, mounting and physical protection.",
            ],
            answer: 1,
            explain: "Correct: \"Wired vs wireless: speed vs convenience.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Cable quality matters — cheap cables fail silently.",
              "Antivirus, backup, disk clean-up, compression.",
              "IP addresses identify devices on the network.",
              "Each step is roughly ×1000.",
            ],
            answer: 2,
            explain: "Correct: \"IP addresses identify devices on the network.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Hearing: speakers and headphones.",
              "Storage capacity is a business problem, not just tech.",
              "Global data doubles every couple of years.",
              "DNS turns names into IP addresses.",
            ],
            answer: 3,
            explain: "Correct: \"DNS turns names into IP addresses.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "IP addresses identify devices on the network.",
              "DNS turns names into IP addresses.",
              "File system organises everything on disk.",
              "Wired vs wireless: speed vs convenience.",
            ],
            answer: 2,
            explain: "\"File system organises everything on disk.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "PART 2 — SOFTWARE: the programs that bring the hardware to life",
        icon: "presenter",
        flat: true,
        paragraphs: [
          "Every slide in Part 2 is code — from firmware and the operating system, up through applications, and finally the modern layer of cloud, virtualisation, networking, security and AI software.",
        ],
        figures: [],
      },
      {
        heading: "Software modules — the programs that power your PC",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• OS, apps, utilities, drivers, firmware, middleware.",
          "• Databases, cloud, games — every type has a role.",
          "• Software tells hardware what to do.",
        ],
        figures: [
          { id: "hwsw2-software-modules-overview", caption: "Software modules — the programs that power your PC" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Software modules — the programs that power your PC",
              "Output devices — monitors, speakers, headphones, projectors, VR, printers and more",
              "Networking hardware (2026)",
              "CPU cache — L1, L2 and L3",
            ],
            answer: 0,
            explain: "This slide covers: Software modules — the programs that power your PC.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Registry = a database of settings for OS and apps.",
              "Applying a fix that has no GUI setting.",
              "Access point: provides Wi-Fi coverage.",
            ],
            answer: 0,
            explain: "Correct: \"OS, apps, utilities, drivers, firmware, middleware.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Bad firmware update can brick a device.",
              "Databases, cloud, games — every type has a role.",
              "Tensor / matrix cores accelerate AI operations.",
              "Programs users interact with directly.",
            ],
            answer: 1,
            explain: "Correct: \"Databases, cloud, games — every type has a role.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "GPU-hungry — plan hardware accordingly.",
              "Applying a fix that has no GUI setting.",
              "Software tells hardware what to do.",
              "CRM: customer records (Salesforce, Dynamics).",
            ],
            answer: 2,
            explain: "Correct: \"Software tells hardware what to do.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Databases, cloud, games — every type has a role.",
              "Software tells hardware what to do.",
              "Copilot+ PCs use CPU, GPU and NPU together.",
            ],
            answer: 3,
            explain: "\"Copilot+ PCs use CPU, GPU and NPU together.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Operating systems — the core system software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Windows, macOS, Linux, ChromeOS, Android, iOS.",
          "• Manages hardware, users, files, security.",
          "• Every app depends on the OS to run.",
        ],
        figures: [
          { id: "hwsw2-os", caption: "Operating systems — the core system software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "New ports and connections — modern connectivity",
              "How much information do we have in the world?",
              "Multimedia and creative software",
              "Operating systems — the core system software",
            ],
            answer: 3,
            explain: "This slide covers: Operating systems — the core system software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Keeps date, time and BIOS settings when unplugged.",
              "'The cloud' = someone else's servers.",
              "VMs run whole guest OSes on shared hardware.",
              "Windows, macOS, Linux, ChromeOS, Android, iOS.",
            ],
            answer: 3,
            explain: "Correct: \"Windows, macOS, Linux, ChromeOS, Android, iOS.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Manages hardware, users, files, security.",
              "Runs in the cloud or locally on an NPU/GPU.",
              "Tiny, extremely fast memory next to the CPU cores.",
              "Front panel connects power button, USB and audio.",
            ],
            answer: 0,
            explain: "Correct: \"Manages hardware, users, files, security.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Pick the chip that matches the user's workload.",
              "Every app depends on the OS to run.",
              "Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.",
              "Steps 12 V from the PSU down to ~1 V for the CPU.",
            ],
            answer: 1,
            explain: "Correct: \"Every app depends on the OS to run.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Kernel bugs can crash the whole machine (BSOD).",
              "Windows, macOS, Linux, ChromeOS, Android, iOS.",
              "Manages hardware, users, files, security.",
              "Every app depends on the OS to run.",
            ],
            answer: 0,
            explain: "\"Kernel bugs can crash the whole machine (BSOD).\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Operating system components — kernel, drivers, file system, services, UI",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Kernel talks to hardware; UI talks to the user.",
          "• Drivers translate between the two.",
          "• File system organises everything on disk.",
        ],
        figures: [
          { id: "hwsw2-os-components", caption: "Operating system components — kernel, drivers, file system, services, UI" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Operating system components — kernel, drivers, file system, services, UI",
              "How much information do we have in the world?",
              "New ports and connections — modern connectivity",
              "CPU cooler — traditional air cooler",
            ],
            answer: 0,
            explain: "This slide covers: Operating system components — kernel, drivers, file system, services, UI.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Kernel talks to hardware; UI talks to the user.",
              "Better for very hot CPUs (i9/Ryzen 9).",
              "Intel vs AMD vs Apple: different sockets, same job.",
              "Front panel connects power button, USB and audio.",
            ],
            answer: 0,
            explain: "Correct: \"Kernel talks to hardware; UI talks to the user.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Thunderbolt 4/5 is the fastest general port on a PC.",
              "Thermal paste sits between CPU and heatsink.",
              "ERP: finance, stock, procurement (SAP, Oracle).",
              "Drivers translate between the two.",
            ],
            answer: 3,
            explain: "Correct: \"Drivers translate between the two.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "File system organises everything on disk.",
              "Populate matching slots for double the bandwidth.",
              "PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
              "Runs hot — usually needs a small heatsink.",
            ],
            answer: 0,
            explain: "Correct: \"File system organises everything on disk.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "File system organises everything on disk.",
              "Thermal paste sits between CPU and heatsink.",
              "Kernel talks to hardware; UI talks to the user.",
              "Drivers translate between the two.",
            ],
            answer: 1,
            explain: "\"Thermal paste sits between CPU and heatsink.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Kernel vs Registry on Windows (part 1)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Kernel = the core code that runs the OS.",
          "• Registry = a database of settings for OS and apps.",
          "• Different jobs, often confused.",
        ],
        figures: [
          { id: "hwsw2-kernel-registry-1", caption: "Kernel vs Registry on Windows (part 1)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "The four components of a computer system — the map for the whole lesson",
              "Kernel vs Registry on Windows (part 1)",
              "Modern AI PC hardware — CPU + GPU + NPU together",
              "SSD (NVMe M.2) — the modern fast SSD",
            ],
            answer: 1,
            explain: "This slide covers: Kernel vs Registry on Windows (part 1).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Cable quality matters — cheap cables fail silently.",
              "Kernel = the core code that runs the OS.",
              "Editors and IDEs (VS Code, IntelliJ, Xcode).",
              "Each step is roughly ×1000.",
            ],
            answer: 1,
            explain: "Correct: \"Kernel = the core code that runs the OS.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Registry = a database of settings for OS and apps.",
              "Initialises hardware, then hands over to the OS.",
              "AC → rectifier → transformer → DC rails.",
              "Support technicians rely on utilities daily.",
            ],
            answer: 0,
            explain: "Correct: \"Registry = a database of settings for OS and apps.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Cloud storage, cloud backup, cloud identity.",
              "Learn what each port can and can't carry.",
              "Wired vs wireless: speed vs convenience.",
              "Different jobs, often confused.",
            ],
            answer: 3,
            explain: "Correct: \"Different jobs, often confused.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Registry = a database of settings for OS and apps.",
              "Removing stubborn leftover app entries.",
              "Different jobs, often confused.",
              "Kernel = the core code that runs the OS.",
            ],
            answer: 1,
            explain: "\"Removing stubborn leftover app entries.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Kernel vs Registry on Windows (part 2)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Kernel bugs can crash the whole machine (BSOD).",
          "• Registry edits can break login or app behaviour.",
          "• Back up before touching either.",
        ],
        figures: [
          { id: "hwsw2-kernel-registry-2", caption: "Kernel vs Registry on Windows (part 2)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Kernel vs Registry on Windows (part 2)",
              "Liquid CPU cooler — AIO (All-In-One)",
              "Web and internet software",
              "Utility software — the small tools that keep systems healthy",
            ],
            answer: 0,
            explain: "This slide covers: Kernel vs Registry on Windows (part 2).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
              "Better for very hot CPUs (i9/Ryzen 9).",
              "Kernel bugs can crash the whole machine (BSOD).",
              "Stores structured data (SQL Server, MySQL, Postgres).",
            ],
            answer: 2,
            explain: "Correct: \"Kernel bugs can crash the whole machine (BSOD).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Users think in files; support thinks in units.",
              "Registry edits can break login or app behaviour.",
              "Volatile — loses everything on power off.",
              "Manages hardware, users, files, security.",
            ],
            answer: 1,
            explain: "Correct: \"Registry edits can break login or app behaviour.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Back up before touching either.",
              "Containers share the host OS, start in seconds.",
              "Firmware lives inside chips (BIOS/UEFI, SSD, NIC).",
              "Check maximum supported speed in the manual.",
            ],
            answer: 0,
            explain: "Correct: \"Back up before touching either.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Kernel bugs can crash the whole machine (BSOD).",
              "Back up before touching either.",
              "Registry edits can break login or app behaviour.",
              "Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
            ],
            answer: 3,
            explain: "\"Case fans, CPU cooler, VRM & M.2 heatsinks, paste.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "When would you actually want to use the Registry?",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Applying a fix that has no GUI setting.",
          "• Removing stubborn leftover app entries.",
          "• Enterprise policy changes via Group Policy.",
        ],
        figures: [
          { id: "hwsw2-use-registry", caption: "When would you actually want to use the Registry?" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "CPU cache — L1, L2 and L3",
              "Output devices — monitors, speakers, headphones, projectors, VR, printers and more",
              "Input devices — the essentials",
              "When would you actually want to use the Registry?",
            ],
            answer: 3,
            explain: "This slide covers: When would you actually want to use the Registry?.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Touch & other senses: printers, plotters, 3D printers, haptic gloves, braille displays.",
              "L1 fastest/smallest, L3 largest/shared.",
              "Stores structured data (SQL Server, MySQL, Postgres).",
              "Applying a fix that has no GUI setting.",
            ],
            answer: 3,
            explain: "Correct: \"Applying a fix that has no GUI setting.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Major clouds: AWS, Azure, Google Cloud.",
              "IP addresses identify devices on the network.",
              "Removing stubborn leftover app entries.",
              "Kernel talks to hardware; UI talks to the user.",
            ],
            answer: 2,
            explain: "Correct: \"Removing stubborn leftover app entries.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Pump can fail — watch for temperature spikes.",
              "Enterprise policy changes via Group Policy.",
              "Windows, macOS, Linux, ChromeOS, Android, iOS.",
              "Defence in depth — no single product is enough.",
            ],
            answer: 1,
            explain: "Correct: \"Enterprise policy changes via Group Policy.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Removing stubborn leftover app entries.",
              "Bad firmware update can brick a device.",
              "Applying a fix that has no GUI setting.",
              "Enterprise policy changes via Group Policy.",
            ],
            answer: 1,
            explain: "\"Bad firmware update can brick a device.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Firmware and low-level software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Firmware lives inside chips (BIOS/UEFI, SSD, NIC).",
          "• Updated with vendor tools — carefully.",
          "• Bad firmware update can brick a device.",
        ],
        figures: [
          { id: "hwsw2-firmware-low-level", caption: "Firmware and low-level software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Firmware and low-level software",
              "The CPU socket — where the processor lives",
              "Cooling and thermal components — the whole thermal system",
              "The history of storage devices — from magnetic drums to NVMe",
            ],
            answer: 0,
            explain: "This slide covers: Firmware and low-level software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Firmware lives inside chips (BIOS/UEFI, SSD, NIC).",
              "Weak VRM = instability under heavy load.",
              "80 PLUS rating = efficiency (Bronze < Gold < Titanium).",
              "Copilots, chatbots, image and voice tools.",
            ],
            answer: 0,
            explain: "Correct: \"Firmware lives inside chips (BIOS/UEFI, SSD, NIC).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Use this map to place every other slide in the deck.",
              "Runs in the cloud or locally on an NPU/GPU.",
              "Tiny, extremely fast memory next to the CPU cores.",
              "Updated with vendor tools — carefully.",
            ],
            answer: 3,
            explain: "Correct: \"Updated with vendor tools — carefully.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "NPU is power-efficient — great on laptops.",
              "Socket type (LGA, PGA, BGA) must match the CPU.",
              "Bad firmware update can brick a device.",
              "PCIe cards add Wi-Fi, capture, sound, extra USB, RAID.",
            ],
            answer: 2,
            explain: "Correct: \"Bad firmware update can brick a device.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Firmware lives inside chips (BIOS/UEFI, SSD, NIC).",
              "More RAM = more apps open at once without slowing down.",
              "Bad firmware update can brick a device.",
              "Updated with vendor tools — carefully.",
            ],
            answer: 1,
            explain: "\"More RAM = more apps open at once without slowing down.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Application software — the big picture",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Programs users interact with directly.",
          "• Run on top of the OS.",
          "• Often licensed per user or per device.",
        ],
        figures: [
          { id: "hwsw2-app-software", caption: "Application software — the big picture" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Modern AI PC hardware — CPU + GPU + NPU together",
              "Application software — the big picture",
              "Virtualisation and containers",
              "Networking software",
            ],
            answer: 1,
            explain: "This slide covers: Application software — the big picture.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Used for SATA SSDs, HDDs and DVD drives.",
              "Applying a fix that has no GUI setting.",
              "Programs users interact with directly.",
              "Check maximum supported speed in the manual.",
            ],
            answer: 2,
            explain: "Correct: \"Programs users interact with directly.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Run on top of the OS.",
              "Used for SATA SSDs, HDDs and DVD drives.",
              "Check maximum supported speed in the manual.",
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
            ],
            answer: 0,
            explain: "Correct: \"Run on top of the OS.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Storage capacity is a business problem, not just tech.",
              "Queried with SQL.",
              "Converts AC mains to DC rails for every component.",
              "Often licensed per user or per device.",
            ],
            answer: 3,
            explain: "Correct: \"Often licensed per user or per device.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Often licensed per user or per device.",
              "ERP: finance, stock, procurement (SAP, Oracle).",
              "Run on top of the OS.",
              "Programs users interact with directly.",
            ],
            answer: 1,
            explain: "\"ERP: finance, stock, procurement (SAP, Oracle).\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Enterprise and business software (ERP, CRM, HR)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• ERP: finance, stock, procurement (SAP, Oracle).",
          "• CRM: customer records (Salesforce, Dynamics).",
          "• HR: people and payroll (Workday, Sage).",
        ],
        figures: [
          { id: "hwsw2-enterprise-software", caption: "Enterprise and business software (ERP, CRM, HR)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Enterprise and business software (ERP, CRM, HR)",
              "Programming and development software",
              "AI software",
              "Networking hardware (2026)",
            ],
            answer: 0,
            explain: "This slide covers: Enterprise and business software (ERP, CRM, HR).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "ERP: finance, stock, procurement (SAP, Oracle).",
              "Back up before touching either.",
              "Each port has a specific role: data, video, network, audio.",
              "Socket type (LGA, PGA, BGA) must match the CPU.",
            ],
            answer: 0,
            explain: "Correct: \"ERP: finance, stock, procurement (SAP, Oracle).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Updated with vendor tools — carefully.",
              "Sight: monitors, projectors, VR headsets, smart glasses, LED displays.",
              "CRM: customer records (Salesforce, Dynamics).",
              "MIDI, eye tracker, voice, iris, data glove, foot pedal.",
            ],
            answer: 2,
            explain: "Correct: \"CRM: customer records (Salesforce, Dynamics).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "HR: people and payroll (Workday, Sage).",
              "Databases, cloud, games — every type has a role.",
              "Big cache helps games, databases and AI a lot.",
              "Browsers, email clients, messaging apps.",
            ],
            answer: 0,
            explain: "Correct: \"HR: people and payroll (Workday, Sage).\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "HR: people and payroll (Workday, Sage).",
              "CRM: customer records (Salesforce, Dynamics).",
              "ERP: finance, stock, procurement (SAP, Oracle).",
              "Check maximum supported speed in the manual.",
            ],
            answer: 3,
            explain: "\"Check maximum supported speed in the manual.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Web and internet software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Browsers, email clients, messaging apps.",
          "• Web servers, CMS platforms.",
          "• Most 'apps' today are really web apps.",
        ],
        figures: [
          { id: "hwsw2-web-software", caption: "Web and internet software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Firmware and low-level software",
              "Application software — the big picture",
              "Storage hardware — the full family (HDD, SSD, NVMe)",
              "Web and internet software",
            ],
            answer: 3,
            explain: "This slide covers: Web and internet software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Removing stubborn leftover app entries.",
              "Watch for shared bandwidth with SATA on some boards.",
              "Executes the instructions of every program.",
              "Browsers, email clients, messaging apps.",
            ],
            answer: 3,
            explain: "Correct: \"Browsers, email clients, messaging apps.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Web servers, CMS platforms.",
              "Big cache helps games, databases and AI a lot.",
              "Photo, video, audio editors (Photoshop, Premiere).",
              "Public, private, hybrid — three deployment models.",
            ],
            answer: 0,
            explain: "Correct: \"Web servers, CMS platforms.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Tensor / matrix cores accelerate AI operations.",
              "AC → rectifier → transformer → DC rails.",
              "Most 'apps' today are really web apps.",
              "Support technicians rely on utilities daily.",
            ],
            answer: 2,
            explain: "Correct: \"Most 'apps' today are really web apps.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Web servers, CMS platforms.",
              "Browsers, email clients, messaging apps.",
              "CRM: customer records (Salesforce, Dynamics).",
              "Most 'apps' today are really web apps.",
            ],
            answer: 2,
            explain: "\"CRM: customer records (Salesforce, Dynamics).\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Multimedia and creative software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Photo, video, audio editors (Photoshop, Premiere).",
          "• 3D and design tools (Blender, AutoCAD).",
          "• GPU-hungry — plan hardware accordingly.",
        ],
        figures: [
          { id: "hwsw2-multimedia-software", caption: "Multimedia and creative software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Multimedia and creative software",
              "Operating systems — the core system software",
              "AI software",
              "Input devices — the extended catalogue (24 devices)",
            ],
            answer: 0,
            explain: "This slide covers: Multimedia and creative software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Users are still the biggest attack surface.",
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Photo, video, audio editors (Photoshop, Premiere).",
              "New boards: USB-C, HDMI, DisplayPort, 2.5G Ethernet.",
            ],
            answer: 2,
            explain: "Correct: \"Photo, video, audio editors (Photoshop, Premiere).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Socket type (LGA, PGA, BGA) must match the CPU.",
              "NPU is power-efficient — great on laptops.",
              "Each port has a specific role: data, video, network, audio.",
              "3D and design tools (Blender, AutoCAD).",
            ],
            answer: 3,
            explain: "Correct: \"3D and design tools (Blender, AutoCAD).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "GPU-hungry — plan hardware accordingly.",
              "Great way to modernise an older machine.",
              "Executes the instructions of every program.",
              "Removing stubborn leftover app entries.",
            ],
            answer: 0,
            explain: "Correct: \"GPU-hungry — plan hardware accordingly.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Photo, video, audio editors (Photoshop, Premiere).",
              "GPU-hungry — plan hardware accordingly.",
              "Talks directly over PCIe — no SATA bottleneck.",
              "3D and design tools (Blender, AutoCAD).",
            ],
            answer: 2,
            explain: "\"Talks directly over PCIe — no SATA bottleneck.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Database software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Stores structured data (SQL Server, MySQL, Postgres).",
          "• Queried with SQL.",
          "• Backups are critical — data loss = job loss.",
        ],
        figures: [
          { id: "hwsw2-database-software", caption: "Database software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Data units explained — from 1 kilobyte to zettabytes",
              "Database software",
              "Operating systems — the core system software",
              "Input devices — the extended catalogue (24 devices)",
            ],
            answer: 1,
            explain: "This slide covers: Database software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Where every other software category starts.",
              "Stores structured data (SQL Server, MySQL, Postgres).",
              "Runs on servers, routers and endpoints.",
              "Heatsink + fan moves heat from CPU to case air.",
            ],
            answer: 1,
            explain: "Correct: \"Stores structured data (SQL Server, MySQL, Postgres).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "DDR4 and DDR5 are the current standards.",
              "USB-C is reversible and delivers data + video + power.",
              "Queried with SQL.",
              "Public, private, hybrid — three deployment models.",
            ],
            answer: 2,
            explain: "Correct: \"Queried with SQL.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Uses PCIe lanes for high speed.",
              "Damaged pins here = dead motherboard.",
              "VMs run whole guest OSes on shared hardware.",
              "Backups are critical — data loss = job loss.",
            ],
            answer: 3,
            explain: "Correct: \"Backups are critical — data loss = job loss.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Queried with SQL.",
              "Backups are critical — data loss = job loss.",
              "Most 'apps' today are really web apps.",
              "Stores structured data (SQL Server, MySQL, Postgres).",
            ],
            answer: 2,
            explain: "\"Most 'apps' today are really web apps.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Programming and development software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Editors and IDEs (VS Code, IntelliJ, Xcode).",
          "• Compilers, debuggers, version control (Git).",
          "• Where every other software category starts.",
        ],
        figures: [
          { id: "hwsw2-programming-software", caption: "Programming and development software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Programming and development software",
              "Rear I/O panel — old vs latest",
              "Graphics and AI hardware — from rendering to neural networks",
              "SATA ports — connecting SATA drives and optical drives",
            ],
            answer: 0,
            explain: "This slide covers: Programming and development software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Editors and IDEs (VS Code, IntelliJ, Xcode).",
              "Rated in watts — must exceed system requirements.",
              "Case fans, CPU cooler, VRM & M.2 heatsinks, paste.",
              "Dust is enemy #1 — clean filters regularly.",
            ],
            answer: 0,
            explain: "Correct: \"Editors and IDEs (VS Code, IntelliJ, Xcode).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "DDR4 and DDR5 are the current standards.",
              "Compilers, debuggers, version control (Git).",
              "CRM: customer records (Salesforce, Dynamics).",
              "USB-C is reversible and delivers data + video + power.",
            ],
            answer: 1,
            explain: "Correct: \"Compilers, debuggers, version control (Git).\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Fingerprint reader for secure sign-in.",
              "One data cable + one power cable per drive.",
              "Where every other software category starts.",
              "SATA SSD: no moving parts, fast enough for most users.",
            ],
            answer: 2,
            explain: "Correct: \"Where every other software category starts.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Editors and IDEs (VS Code, IntelliJ, Xcode).",
              "Compilers, debuggers, version control (Git).",
              "Where every other software category starts.",
              "Uses PCIe lanes for high speed.",
            ],
            answer: 3,
            explain: "\"Uses PCIe lanes for high speed.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Utility software — the small tools that keep systems healthy",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Antivirus, backup, disk clean-up, compression.",
          "• Small tools, big impact on reliability.",
          "• Support technicians rely on utilities daily.",
        ],
        figures: [
          { id: "hwsw2-utility-software", caption: "Utility software — the small tools that keep systems healthy" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "The history of storage devices — from magnetic drums to NVMe",
              "Cybersecurity software",
              "The CPU socket — where the processor lives",
              "Utility software — the small tools that keep systems healthy",
            ],
            answer: 3,
            explain: "This slide covers: Utility software — the small tools that keep systems healthy.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Switch: connects wired devices inside the LAN.",
              "Software tells hardware what to do.",
              "Keyboard, mouse, touchpad, touchscreen.",
              "Antivirus, backup, disk clean-up, compression.",
            ],
            answer: 3,
            explain: "Correct: \"Antivirus, backup, disk clean-up, compression.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Small tools, big impact on reliability.",
              "Registry edits can break login or app behaviour.",
              "OS, apps, utilities, drivers, firmware, middleware.",
              "Dead battery = clock resets, boot errors.",
            ],
            answer: 0,
            explain: "Correct: \"Small tools, big impact on reliability.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Every app depends on the OS to run.",
              "Support technicians rely on utilities daily.",
              "Databases, cloud, games — every type has a role.",
              "ERP: finance, stock, procurement (SAP, Oracle).",
            ],
            answer: 1,
            explain: "Correct: \"Support technicians rely on utilities daily.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Stores structured data (SQL Server, MySQL, Postgres).",
              "Antivirus, backup, disk clean-up, compression.",
              "Small tools, big impact on reliability.",
              "Support technicians rely on utilities daily.",
            ],
            answer: 0,
            explain: "\"Stores structured data (SQL Server, MySQL, Postgres).\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Cloud computing software (part 1)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• SaaS, PaaS, IaaS — three service models.",
          "• Public, private, hybrid — three deployment models.",
          "• Major clouds: AWS, Azure, Google Cloud.",
        ],
        figures: [
          { id: "hwsw2-cloud-1", caption: "Cloud computing software (part 1)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Cloud computing software (part 1)",
              "Storage hardware — the full family (HDD, SSD, NVMe)",
              "Kernel vs Registry on Windows (part 2)",
              "Firmware and low-level software",
            ],
            answer: 0,
            explain: "This slide covers: Cloud computing software (part 1).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "SaaS, PaaS, IaaS — three service models.",
              "Queried with SQL.",
              "Antivirus, backup, disk clean-up, compression.",
              "Support role: getting AI tools working for users.",
            ],
            answer: 0,
            explain: "Correct: \"SaaS, PaaS, IaaS — three service models.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.",
              "Configuration errors here cause most outages.",
              "Global data doubles every couple of years.",
              "Public, private, hybrid — three deployment models.",
            ],
            answer: 3,
            explain: "Correct: \"Public, private, hybrid — three deployment models.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Major clouds: AWS, Azure, Google Cloud.",
              "Learn the slot names: CPU socket, DIMM, PCIe, M.2, SATA.",
              "Steps 12 V from the PSU down to ~1 V for the CPU.",
              "Configuration errors here cause most outages.",
            ],
            answer: 0,
            explain: "Correct: \"Major clouds: AWS, Azure, Google Cloud.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Major clouds: AWS, Azure, Google Cloud.",
              "Slower than NVMe but very flexible.",
              "SaaS, PaaS, IaaS — three service models.",
              "Public, private, hybrid — three deployment models.",
            ],
            answer: 1,
            explain: "\"Slower than NVMe but very flexible.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Cloud computing software (part 2)",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Microsoft 365, Google Workspace: everyday SaaS.",
          "• Cloud storage, cloud backup, cloud identity.",
          "• 'The cloud' = someone else's servers.",
        ],
        figures: [
          { id: "hwsw2-cloud-2", caption: "Cloud computing software (part 2)" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Input devices — the essentials",
              "Cloud computing software (part 2)",
              "How much information do we have in the world?",
              "CPU cooler — traditional air cooler",
            ],
            answer: 1,
            explain: "This slide covers: Cloud computing software (part 2).",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Pick the chip that matches the user's workload.",
              "Microsoft 365, Google Workspace: everyday SaaS.",
              "KB → MB → GB → TB → PB → EB → ZB.",
              "Billions of transistors; multiple cores and threads.",
            ],
            answer: 1,
            explain: "Correct: \"Microsoft 365, Google Workspace: everyday SaaS.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Cloud storage, cloud backup, cloud identity.",
              "Registry = a database of settings for OS and apps.",
              "NPU (Neural Processing Unit) is a dedicated AI chip.",
              "History explains today's design choices.",
            ],
            answer: 0,
            explain: "Correct: \"Cloud storage, cloud backup, cloud identity.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Rated in watts — must exceed system requirements.",
              "Dust is enemy #1 — clean filters regularly.",
              "Volatile — loses everything on power off.",
              "'The cloud' = someone else's servers.",
            ],
            answer: 3,
            explain: "Correct: \"'The cloud' = someone else's servers.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Cloud storage, cloud backup, cloud identity.",
              "Compilers, debuggers, version control (Git).",
              "'The cloud' = someone else's servers.",
              "Microsoft 365, Google Workspace: everyday SaaS.",
            ],
            answer: 1,
            explain: "\"Compilers, debuggers, version control (Git).\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Virtualisation and containers",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• VMs run whole guest OSes on shared hardware.",
          "• Containers share the host OS, start in seconds.",
          "• Both save cost and enable rapid deployment.",
        ],
        figures: [
          { id: "hwsw2-virtualization", caption: "Virtualisation and containers" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Virtualisation and containers",
              "CPU (Central Processing Unit) — anatomy of the chip",
              "SATA ports — connecting SATA drives and optical drives",
              "CMOS battery — keeps BIOS settings and the clock alive",
            ],
            answer: 0,
            explain: "This slide covers: Virtualisation and containers.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Watch for shared bandwidth with SATA on some boards.",
              "Removing stubborn leftover app entries.",
              "VMs run whole guest OSes on shared hardware.",
              "Provides airflow, mounting and physical protection.",
            ],
            answer: 2,
            explain: "Correct: \"VMs run whole guest OSes on shared hardware.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Use this map to place every other slide in the deck.",
              "Containers share the host OS, start in seconds.",
              "Programs users interact with directly.",
              "Most new data is video, images and telemetry.",
            ],
            answer: 1,
            explain: "Correct: \"Containers share the host OS, start in seconds.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Both save cost and enable rapid deployment.",
              "Webcam and microphone for calls and content.",
              "Old boards: PS/2, VGA, parallel, serial.",
              "HR: people and payroll (Workday, Sage).",
            ],
            answer: 0,
            explain: "Correct: \"Both save cost and enable rapid deployment.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "VMs run whole guest OSes on shared hardware.",
              "Both save cost and enable rapid deployment.",
              "Containers share the host OS, start in seconds.",
              "Punched cards → tape → drums → HDD → SSD → NVMe.",
            ],
            answer: 3,
            explain: "\"Punched cards → tape → drums → HDD → SSD → NVMe.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Networking software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• DHCP, DNS, VPN, firewall, load balancer.",
          "• Runs on servers, routers and endpoints.",
          "• Configuration errors here cause most outages.",
        ],
        figures: [
          { id: "hwsw2-networking-software", caption: "Networking software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Motherboard components — the labelled overview",
              "Different CPUs and GPUs — how modern processors compare",
              "Application software — the big picture",
              "Networking software",
            ],
            answer: 3,
            explain: "This slide covers: Networking software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Clock speed × cores × cache = real-world performance.",
              "Updated with vendor tools — carefully.",
              "Stylus, trackball, joystick, controller, light gun.",
              "DHCP, DNS, VPN, firewall, load balancer.",
            ],
            answer: 3,
            explain: "Correct: \"DHCP, DNS, VPN, firewall, load balancer.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "DNS turns names into IP addresses.",
              "NVIDIA vs AMD vs Intel Arc for GPUs.",
              "Runs on servers, routers and endpoints.",
              "Talks directly over PCIe — no SATA bottleneck.",
            ],
            answer: 2,
            explain: "Correct: \"Runs on servers, routers and endpoints.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Backups are critical — data loss = job loss.",
              "Configuration errors here cause most outages.",
              "NPU (Neural Processing Unit) is a dedicated AI chip.",
              "Registry = a database of settings for OS and apps.",
            ],
            answer: 1,
            explain: "Correct: \"Configuration errors here cause most outages.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Runs on servers, routers and endpoints.",
              "Support technicians rely on utilities daily.",
              "DHCP, DNS, VPN, firewall, load balancer.",
              "Configuration errors here cause most outages.",
            ],
            answer: 1,
            explain: "\"Support technicians rely on utilities daily.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "Cybersecurity software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Antivirus, EDR, SIEM, MFA, encryption.",
          "• Defence in depth — no single product is enough.",
          "• Users are still the biggest attack surface.",
        ],
        figures: [
          { id: "hwsw2-cybersecurity", caption: "Cybersecurity software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "Cybersecurity software",
              "Cloud computing software (part 2)",
              "Computer case (chassis)",
              "Virtualisation and containers",
            ],
            answer: 0,
            explain: "This slide covers: Cybersecurity software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Antivirus, EDR, SIEM, MFA, encryption.",
              "CRM: customer records (Salesforce, Dynamics).",
              "Runs hot — needs its own heatsink on gaming boards.",
              "USB-C is reversible and delivers data + video + power.",
            ],
            answer: 0,
            explain: "Correct: \"Antivirus, EDR, SIEM, MFA, encryption.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Cable quality matters — cheap cables fail silently.",
              "Switch: connects wired devices inside the LAN.",
              "Editors and IDEs (VS Code, IntelliJ, Xcode).",
              "Defence in depth — no single product is enough.",
            ],
            answer: 3,
            explain: "Correct: \"Defence in depth — no single product is enough.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "'The cloud' = someone else's servers.",
              "Webcam and microphone for calls and content.",
              "Users are still the biggest attack surface.",
              "The same GPU hardware runs games and neural networks.",
            ],
            answer: 2,
            explain: "Correct: \"Users are still the biggest attack surface.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Antivirus, EDR, SIEM, MFA, encryption.",
              "Most new data is video, images and telemetry.",
              "Users are still the biggest attack surface.",
              "Defence in depth — no single product is enough.",
            ],
            answer: 1,
            explain: "\"Most new data is video, images and telemetry.\" is about a different topic.",
          },
        ],
      },
      {
        heading: "AI software",
        icon: "chip",
        flat: true,
        paragraphs: [
          "• Copilots, chatbots, image and voice tools.",
          "• Runs in the cloud or locally on an NPU/GPU.",
          "• Support role: getting AI tools working for users.",
        ],
        figures: [
          { id: "hwsw2-ai-software", caption: "AI software" },
        ],
        slideQuiz: [
          {
            q: "Which topic does this slide cover?",
            options: [
              "When would you actually want to use the Registry?",
              "AI software",
              "Different CPUs and GPUs — how modern processors compare",
              "Multimedia and creative software",
            ],
            answer: 1,
            explain: "This slide covers: AI software.",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Compilers, debuggers, version control (Git).",
              "KB → MB → GB → TB → PB → EB → ZB.",
              "Copilots, chatbots, image and voice tools.",
              "Chipset routes traffic between all components.",
            ],
            answer: 2,
            explain: "Correct: \"Copilots, chatbots, image and voice tools.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "Runs in the cloud or locally on an NPU/GPU.",
              "Keeps date, time and BIOS settings when unplugged.",
              "Major clouds: AWS, Azure, Google Cloud.",
              "SaaS, PaaS, IaaS — three service models.",
            ],
            answer: 0,
            explain: "Correct: \"Runs in the cloud or locally on an NPU/GPU.\"",
          },
          {
            q: "Which statement is TRUE?",
            options: [
              "'The cloud' = someone else's servers.",
              "Form factors: ATX, Micro-ATX, Mini-ITX.",
              "The same GPU hardware runs games and neural networks.",
              "Support role: getting AI tools working for users.",
            ],
            answer: 3,
            explain: "Correct: \"Support role: getting AI tools working for users.\"",
          },
          {
            q: "Which statement is NOT true?",
            options: [
              "Support role: getting AI tools working for users.",
              "Microsoft 365, Google Workspace: everyday SaaS.",
              "Runs in the cloud or locally on an NPU/GPU.",
              "Copilots, chatbots, image and voice tools.",
            ],
            answer: 1,
            explain: "\"Microsoft 365, Google Workspace: everyday SaaS.\" is about a different topic.",
          },
        ],
      },
    ],
    exercises: [],
    assignments: [],
    quizzes: [
      {
        id: "hwsw2-hardware",
        title: "Hardware — 15-question knowledge check",
        questions: [
          {
            q: "The four core components of a computer system are input, processing, output and…?",
            options: [
              "Cables",
              "Storage",
              "Cooling",
              "Firmware",
            ],
            answer: 1,
            explain: "The four-part model is input → processing → storage → output.",
          },
          {
            q: "Which motherboard chip contains the firmware that runs first when you press the power button?",
            options: [
              "CMOS battery",
              "BIOS/UEFI chip",
              "PCIe slot",
              "VRM",
            ],
            answer: 1,
            explain: "The BIOS/UEFI chip stores the boot firmware; the CPU executes it first.",
          },
          {
            q: "A PC forgets the date, time and BIOS settings every time it is unplugged. What is the most likely cause?",
            options: [
              "Faulty RAM",
              "Failing SSD",
              "Flat CMOS coin-cell battery",
              "Wrong monitor cable",
            ],
            answer: 2,
            explain: "The CR2032 CMOS battery keeps the real-time clock and BIOS settings alive when the PSU is off.",
          },
          {
            q: "Which unit converts wall-socket AC into the low-voltage DC rails (+12 V, +5 V, +3.3 V) the motherboard needs?",
            options: [
              "VRM",
              "PSU",
              "UEFI chip",
              "CMOS battery",
            ],
            answer: 1,
            explain: "The Power Supply Unit rectifies and regulates mains AC into DC rails.",
          },
          {
            q: "Which of these is NOT a motherboard form factor?",
            options: [
              "ATX",
              "Micro-ATX",
              "Mini-ITX",
              "NVMe",
            ],
            answer: 3,
            explain: "NVMe is a storage protocol, not a motherboard form factor.",
          },
          {
            q: "Which port carries data, video and power in one cable at up to 40 Gbps?",
            options: [
              "VGA",
              "RJ45",
              "Thunderbolt / USB4",
              "HDMI 1.4",
            ],
            answer: 2,
            explain: "Thunderbolt 3/4 and USB4 combine PCIe data, DisplayPort video and USB PD power.",
          },
          {
            q: "A discrete graphics card physically plugs into which motherboard slot?",
            options: [
              "DIMM slot",
              "M.2 slot",
              "PCIe x16 slot",
              "SATA port",
            ],
            answer: 2,
            explain: "The GPU uses the long PCIe x16 slot for maximum bandwidth.",
          },
          {
            q: "Which of these is an INPUT-only device?",
            options: [
              "Monitor",
              "Printer",
              "Barcode scanner",
              "Speaker",
            ],
            answer: 2,
            explain: "A scanner only sends data in; the others produce output.",
          },
          {
            q: "A desktop has no built-in Ethernet. Which expansion card adds a wired network port?",
            options: [
              "Sound card",
              "GPU",
              "NIC",
              "TPM module",
            ],
            answer: 2,
            explain: "A Network Interface Card (NIC) provides an RJ45 Ethernet port.",
          },
          {
            q: "What is the primary job of the computer case (chassis)?",
            options: [
              "Boot the operating system",
              "Mount and protect components and route airflow",
              "Convert AC to DC",
              "Store user files",
            ],
            answer: 1,
            explain: "The case is a structural and thermal enclosure.",
          },
          {
            q: "Which connector on the rear I/O panel is used for wired networking?",
            options: [
              "HDMI",
              "RJ45 (Ethernet)",
              "DisplayPort",
              "USB-C",
            ],
            answer: 1,
            explain: "RJ45 is the standard Ethernet jack.",
          },
          {
            q: "You need the highest sustained SSD speed. Which motherboard connector do you use?",
            options: [
              "SATA III",
              "PS/2",
              "M.2 (NVMe)",
              "USB 2.0",
            ],
            answer: 2,
            explain: "NVMe SSDs in an M.2 slot use PCIe lanes and are far faster than SATA.",
          },
          {
            q: "What does a Voltage Regulator Module (VRM) do on a motherboard?",
            options: [
              "Stores boot firmware",
              "Steps 12 V down to the ~1 V the CPU needs, at high current",
              "Amplifies audio",
              "Keeps the real-time clock alive",
            ],
            answer: 1,
            explain: "The VRM converts PSU rails into a stable low voltage the CPU can use.",
          },
          {
            q: "UEFI is best described as…",
            options: [
              "A file system",
              "A modern firmware interface that replaces the legacy BIOS",
              "A CPU socket standard",
              "A cooling method",
            ],
            answer: 1,
            explain: "UEFI supports GPT, Secure Boot, larger drives and a GUI.",
          },
          {
            q: "Which everyday item is an OUTPUT device?",
            options: [
              "Keyboard",
              "Webcam",
              "Projector",
              "Microphone",
            ],
            answer: 2,
            explain: "Projectors output visual information to a screen or wall.",
          },
        ],
      },
      {
        id: "hwsw2-software",
        title: "Software — 15-question knowledge check",
        questions: [
          {
            q: "What is the primary job of an operating system?",
            options: [
              "Play videos",
              "Manage hardware and provide services to applications",
              "Store user files in the cloud",
              "Draw the desktop wallpaper",
            ],
            answer: 1,
            explain: "The OS mediates between applications and hardware.",
          },
          {
            q: "Which of these is a Linux distribution widely used on servers?",
            options: [
              "Windows 11",
              "macOS Sonoma",
              "Ubuntu Server",
              "iOS",
            ],
            answer: 2,
            explain: "Ubuntu, Red Hat and Debian are common server Linux distros.",
          },
          {
            q: "The Windows Registry stores…",
            options: [
              "User photos",
              "System, hardware and application configuration settings",
              "Passwords in plain text",
              "The kernel itself",
            ],
            answer: 1,
            explain: "The Registry is a hierarchical settings database.",
          },
          {
            q: "Editing the wrong Registry key can result in…",
            options: [
              "A faster boot",
              "An unbootable or unstable Windows system",
              "More RAM",
              "A brighter screen",
            ],
            answer: 1,
            explain: "Always back up before editing the Registry.",
          },
          {
            q: "Which OS component talks directly to hardware and manages memory, processes and devices?",
            options: [
              "Task Manager",
              "Kernel",
              "File Explorer",
              "Web browser",
            ],
            answer: 1,
            explain: "The kernel is the innermost layer of the OS.",
          },
          {
            q: "Firmware is best described as…",
            options: [
              "Any app you download",
              "Software permanently stored on a chip inside a device",
              "A hardware component",
              "A file format",
            ],
            answer: 1,
            explain: "BIOS/UEFI, SSD controllers and printer firmware all live on chips inside their devices.",
          },
          {
            q: "Which cloud service model does Microsoft 365 fall under?",
            options: [
              "Firmware",
              "IaaS",
              "Software as a Service (SaaS)",
              "Kernel-mode driver",
            ],
            answer: 2,
            explain: "SaaS delivers ready-to-use applications over the internet.",
          },
          {
            q: "PostgreSQL is an example of which category of software?",
            options: [
              "Utility software",
              "Database software (DBMS)",
              "Cybersecurity software",
              "Web browser",
            ],
            answer: 1,
            explain: "A DBMS manages structured data, typically via SQL.",
          },
          {
            q: "Which product is a well-known Enterprise Resource Planning (ERP) system?",
            options: [
              "SAP",
              "Notepad",
              "VLC",
              "Chrome",
            ],
            answer: 0,
            explain: "SAP, Oracle and Dynamics 365 are ERPs used across finance, HR and supply chain.",
          },
          {
            q: "Which of these is a hypervisor used to run virtual machines?",
            options: [
              "VMware ESXi",
              "Photoshop",
              "PowerPoint",
              "Chrome",
            ],
            answer: 0,
            explain: "ESXi, Hyper-V, KVM and Proxmox are hypervisors.",
          },
          {
            q: "Docker is best classified as a…",
            options: [
              "Container platform",
              "Backup tool",
              "Cloud storage service",
              "Antivirus",
            ],
            answer: 0,
            explain: "Containers share the host OS kernel and start in seconds.",
          },
          {
            q: "EDR (Endpoint Detection and Response) is a type of…",
            options: [
              "Word processor",
              "Cybersecurity software",
              "Database engine",
              "Rendering engine",
            ],
            answer: 1,
            explain: "EDR products detect, investigate and stop attacks on endpoints.",
          },
          {
            q: "Which is a common utility that keeps a system healthy?",
            options: [
              "Backup software",
              "ERP",
              "DBMS",
              "IDE",
            ],
            answer: 0,
            explain: "Utilities include backup, antivirus, disk tools and remote support.",
          },
          {
            q: "An IDE such as Visual Studio Code is used to…",
            options: [
              "Play music",
              "Write, debug and build application code",
              "Manage databases directly",
              "Route network traffic",
            ],
            answer: 1,
            explain: "IDEs bundle editor, compiler/linker and debugger.",
          },
          {
            q: "Which statement correctly describes cloud service models?",
            options: [
              "SaaS is raw hardware you rent by the hour",
              "SaaS = finished app; PaaS = platform to build on; IaaS = raw servers and network",
              "IaaS runs entirely on-device with no network",
              "PaaS is a physical hard drive",
            ],
            answer: 1,
            explain: "SaaS delivers a ready app, PaaS provides a development platform, IaaS provides raw infrastructure.",
          },
        ],
      },
      {
        id: "hwsw2-storage",
        title: "Storage — 15-question knowledge check",
        questions: [
          {
            q: "Which memory is VOLATILE — its contents are lost when power is removed?",
            options: [
              "RAM",
              "HDD",
              "SSD",
              "USB flash drive",
            ],
            answer: 0,
            explain: "RAM is volatile working memory; the others keep data without power.",
          },
          {
            q: "Storage manufacturers use the SI meaning of a kilobyte. How many bytes is that?",
            options: [
              "8",
              "1,000",
              "1,024",
              "1,000,000",
            ],
            answer: 1,
            explain: "1 kB = 1,000 bytes in SI. Windows reports sizes using binary (1 KiB = 1,024).",
          },
          {
            q: "Which is the FASTEST consumer storage interface listed?",
            options: [
              "SATA III",
              "USB 2.0",
              "NVMe over PCIe",
              "IDE/PATA",
            ],
            answer: 2,
            explain: "NVMe uses PCIe lanes and is dramatically faster than SATA.",
          },
          {
            q: "An M.2 slot can host…",
            options: [
              "Only HDDs",
              "Only DIMMs",
              "Both SATA and NVMe SSDs, depending on the drive",
              "Only optical drives",
            ],
            answer: 2,
            explain: "The physical M.2 slot supports both interfaces — check the drive's key and specs.",
          },
          {
            q: "Which storage device has spinning platters and a moving read/write head?",
            options: [
              "SSD",
              "HDD",
              "NVMe drive",
              "DIMM",
            ],
            answer: 1,
            explain: "Hard Disk Drives are mechanical; SSDs are solid-state flash.",
          },
          {
            q: "A user asks whether to install the operating system on the SSD or the HDD for best performance.",
            options: [
              "Install the OS on the SSD",
              "Install on the HDD to save the SSD's life",
              "Split it 50/50",
              "It makes no difference",
            ],
            answer: 0,
            explain: "SSDs give far faster boot times and application launches.",
          },
          {
            q: "How many DIMM slots does a typical mainstream desktop motherboard have?",
            options: [
              "1",
              "2",
              "4",
              "16",
            ],
            answer: 2,
            explain: "Most consumer boards ship with 2 or 4 DIMM slots (dual-channel).",
          },
          {
            q: "Which is the current mainstream generation of desktop RAM (2026)?",
            options: [
              "DDR2",
              "DDR3",
              "DDR4",
              "DDR5",
            ],
            answer: 3,
            explain: "DDR5 has replaced DDR4 on new mainstream builds.",
          },
          {
            q: "A PC constantly hits the pagefile. What will users notice after adding more RAM?",
            options: [
              "A faster CPU",
              "A larger screen",
              "More apps open smoothly at once",
              "More USB ports",
            ],
            answer: 2,
            explain: "More RAM means fewer disk swaps and much smoother multitasking.",
          },
          {
            q: "SATA III has a peak bandwidth of about…",
            options: [
              "100 Mbps",
              "6 Gbps (~600 MB/s)",
              "40 Gbps",
              "480 Mbps",
            ],
            answer: 1,
            explain: "SATA III tops out around 6 Gbps.",
          },
          {
            q: "Which is the LARGEST unit in this list?",
            options: [
              "Gigabyte",
              "Terabyte",
              "Megabyte",
              "Petabyte",
            ],
            answer: 3,
            explain: "KB < MB < GB < TB < PB < EB < ZB.",
          },
          {
            q: "Which storage technology largely replaced HDDs in laptops and modern desktops?",
            options: [
              "NAND-flash SSDs",
              "DDR5 DIMMs",
              "TPM chips",
              "Optical drives",
            ],
            answer: 0,
            explain: "SSDs use NAND flash — no moving parts, much faster, more reliable.",
          },
          {
            q: "Which is the correct order from FASTEST to SLOWEST?",
            options: [
              "HDD → RAM → SSD → cache",
              "CPU cache → RAM → NVMe SSD → HDD",
              "RAM → CPU cache → HDD → SSD",
              "All are the same speed",
            ],
            answer: 1,
            explain: "The memory hierarchy runs cache → RAM → SSD → HDD, fastest to slowest.",
          },
          {
            q: "A key advantage of NVMe over SATA SSDs is…",
            options: [
              "Lower price per GB",
              "Lower latency and much higher bandwidth via PCIe",
              "Bigger physical size",
              "Compatibility with IDE cables",
            ],
            answer: 1,
            explain: "NVMe was designed for the parallel nature of flash and uses PCIe.",
          },
          {
            q: "Roughly how many bytes are in 1 GB (decimal SI)?",
            options: [
              "1,000",
              "1,000,000",
              "1,000,000,000",
              "1,000,000,000,000",
            ],
            answer: 2,
            explain: "1 GB = 10^9 bytes in SI; Windows reports it using 2^30.",
          },
        ],
      },
      {
        id: "hwsw2-processing",
        title: "Processing — 15-question knowledge check",
        questions: [
          {
            q: "The Central Processing Unit (CPU) is best described as…",
            options: [
              "A type of RAM",
              "The main brain that fetches, decodes and executes instructions",
              "The graphics chip",
              "The BIOS firmware",
            ],
            answer: 1,
            explain: "The CPU is the general-purpose processor at the heart of the machine.",
          },
          {
            q: "What is the correct order of CPU cache from FASTEST to SLOWEST?",
            options: [
              "L3 → L2 → L1",
              "L1 → L2 → L3",
              "L2 → L1 → L3",
              "L1 → L3 → L2",
            ],
            answer: 1,
            explain: "L1 is closest and smallest/fastest; L3 is largest and slowest.",
          },
          {
            q: "Where does a desktop CPU physically install on the motherboard?",
            options: [
              "In the DIMM slot",
              "In the CPU socket",
              "In the PCIe slot",
              "On the SATA port",
            ],
            answer: 1,
            explain: "Intel LGA or AMD PGA/LGA sockets house the CPU.",
          },
          {
            q: "Which processor is designed specifically to accelerate on-device AI/ML workloads?",
            options: [
              "NPU",
              "PSU",
              "CMOS",
              "DIMM",
            ],
            answer: 0,
            explain: "Neural Processing Units run AI models efficiently on-device (Copilot+ PCs, phones).",
          },
          {
            q: "A stock air cooler consists of…",
            options: [
              "A heatsink with fins and a fan mounted on the CPU",
              "A liquid pump only",
              "A copper block with no fan",
              "A stick of RAM",
            ],
            answer: 0,
            explain: "Air coolers use a finned heatsink and a fan; AIO coolers use a pump and radiator.",
          },
          {
            q: "An AIO liquid cooler moves heat by circulating coolant between…",
            options: [
              "The PSU and the case fan",
              "A pump/block on the CPU and a radiator",
              "The GPU and the SSD",
              "The DIMMs and the socket",
            ],
            answer: 1,
            explain: "AIO = All-In-One closed-loop liquid cooler.",
          },
          {
            q: "Thermal paste is applied between…",
            options: [
              "The CPU heat-spreader and the cooler's base",
              "The DIMMs and the socket",
              "The motherboard tracks",
              "Inside the PSU",
            ],
            answer: 0,
            explain: "Thermal interface material fills microscopic gaps for better heat transfer.",
          },
          {
            q: "Modern GPUs are best at…",
            options: [
              "Storing files",
              "Massively parallel compute — ideal for graphics and AI training",
              "Booting the OS",
              "Running the BIOS",
            ],
            answer: 1,
            explain: "GPUs have thousands of small cores for parallel work.",
          },
          {
            q: "Which is TRUE of an Intel LGA socket?",
            options: [
              "The pins are on the motherboard; the CPU has flat pads",
              "The pins are on the CPU (like AMD PGA)",
              "It is soldered like a phone SoC",
              "It runs on 240 V AC",
            ],
            answer: 0,
            explain: "LGA = Land Grid Array. Pins live in the socket; the CPU has landing pads.",
          },
          {
            q: "A CPU is rated at 65 W TDP. That number is used mostly to…",
            options: [
              "Choose the peak GPU power",
              "Size the cooler that can dissipate its heat at base spec",
              "Set the RAM speed",
              "Pick the socket type",
            ],
            answer: 1,
            explain: "TDP (Thermal Design Power) guides cooler selection.",
          },
          {
            q: "What is hyper-threading / SMT (simultaneous multithreading)?",
            options: [
              "A cooling technology",
              "Presenting one physical core as two logical threads to the OS",
              "A GPU rendering mode",
              "A form of PSU rail",
            ],
            answer: 1,
            explain: "SMT/HT keeps a core busy when one thread stalls, improving utilisation.",
          },
          {
            q: "On a modern AI PC the CPU, GPU and NPU work together. The NPU specialises in…",
            options: [
              "3-D game rendering",
              "Efficient real-time AI inference at low power",
              "File compression",
              "Booting the OS",
            ],
            answer: 1,
            explain: "NPUs run neural networks efficiently for features like Copilot+ and Windows Studio Effects.",
          },
          {
            q: "Which motherboard component steps 12 V down to the ~1 V the CPU actually needs?",
            options: [
              "BIOS chip",
              "VRM (Voltage Regulator Module)",
              "CMOS battery",
              "Chipset",
            ],
            answer: 1,
            explain: "The VRM regulates voltage and delivers the high current the CPU draws.",
          },
          {
            q: "Which is TRUE about integrated (iGPU) vs discrete (dGPU) graphics?",
            options: [
              "They are exactly the same",
              "An iGPU is built into the CPU package; a dGPU is a separate card",
              "A dGPU plugs into the CPU socket",
              "iGPUs always outperform dGPUs",
            ],
            answer: 1,
            explain: "iGPUs share system RAM; dGPUs have their own VRAM, power and cooling.",
          },
          {
            q: "A CPU keeps thermal-throttling under sustained load. What should you check FIRST?",
            options: [
              "The internet connection",
              "Cooler mounting, fan spin and thermal-paste condition",
              "The monitor cable",
              "The keyboard driver",
            ],
            answer: 1,
            explain: "Throttling is a heat problem — always fix cooling first.",
          },
        ],
      },
    ],
    quiz: [],
  },
};

export function getContent(us: string): UnitContent | undefined {
  return CONTENT[us];
}
