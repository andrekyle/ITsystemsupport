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
  "pr.cio": {
    def: "The Pr.CIO® (Professional CIO) designation is awarded to those ICT professionals who have met global standards for competence, ethical issues, social implications, and legal and professional practice at the level of a Chief Information Officer. It is one of IITPSA's registered professional designations — used after one's name, it identifies the holder as belonging to a professional body.",
    link: { label: "IITPSA — careers in ICT", url: "https://www.iitpsa.org.za/careers-in-ict-info/" },
  },
  "codes of practice": {
    def: "A set of rules adopted by CSSA members to benefit members and the wider community. It serves an educational role and deals with how members exercise their professional competence: a series of statements prescribing minimum standards of practice, concerned with professional responsibility, grouped into elements — personal development; organisation and management; contracting; privacy, security and integrity; development of a system; implementation; and live systems. The code is viewed as a whole and observed in the spirit, not merely to the word.",
    link: { label: "UCT ethics notes — Code of Practice", url: "https://www.cs.uct.ac.za/mit_notes/ethics/htmls/ch04s03.html" },
  },
  "code of practice": {
    def: "A set of rules adopted by CSSA members to benefit members and the wider community. It serves an educational role and deals with how members exercise their professional competence: a series of statements prescribing minimum standards of practice, concerned with professional responsibility, grouped into elements — personal development; organisation and management; contracting; privacy, security and integrity; development of a system; implementation; and live systems. The code is viewed as a whole and observed in the spirit, not merely to the word.",
    link: { label: "UCT ethics notes — Code of Practice", url: "https://www.cs.uct.ac.za/mit_notes/ethics/htmls/ch04s03.html" },
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
        heading: "Purpose and content of a range of reports — introduction",
        icon: "presenter",
        flat: true,
        paragraphs: [
          "Time: 90 minutes · Activity: Self & Group.",
          "Because we are dealing with business communication, this section will be based on business communication — but the remainder of the types of reports do not differ much from this type of report. By practicing how to write an internal report on a business related matter, we will prepare you to learn the basics of report writing so that you may develop to writing more advanced and specific reports, as you move up in your career.",
          "There are a few general rules about report writing. A report should be a formal document and should be in the past tense as far as possible, as well as avoiding the use of first or second person pronouns. There should be a simple numbering system with clear headings.",
          "Before we start writing reports in business, we need to understand what the purpose of the report is — the outcome, or required outcome thereof — as well as the manner (style) in which the report must be written. Writing a report in a style which is not suited to its audience or readers will not be professional. Therefore we must understand what we need to put into the report and phrase (word) it appropriately so that the readers understand the information being given to them.",
        ],
        slideQuiz: [
          {
            q: "In which tense should a report be written, as far as possible?",
            options: ["Future tense", "Past tense", "Present tense", "Any tense — it does not matter"],
            answer: 1,
            explain: "A report should be a formal document and should be in the past tense as far as possible.",
          },
          {
            q: "Which pronouns should be avoided in a report?",
            options: [
              "Third person pronouns",
              "First or second person pronouns",
              "All pronouns",
              "Plural pronouns",
            ],
            answer: 1,
            explain: "Avoid the use of first or second person pronouns — a report is a formal document.",
          },
          {
            q: "What should a report's numbering and headings look like?",
            options: [
              "No numbering, decorative headings",
              "A simple numbering system with clear headings",
              "Roman numerals only",
              "Numbering only on the appendices",
            ],
            answer: 1,
            explain: "There should be a simple numbering system with clear headings.",
          },
          {
            q: "What must you understand BEFORE you start writing a business report?",
            options: [
              "The printing budget",
              "The purpose (required outcome) of the report and the style suited to its audience",
              "The company's founding date",
              "Only the deadline",
            ],
            answer: 1,
            explain: "First understand the purpose (the required outcome) and the manner/style in which the report must be written for its readers.",
          },
          {
            q: "Why does writing in a style unsuited to the audience matter?",
            options: [
              "It makes the report longer",
              "It will not be professional and readers may not understand the information",
              "It saves time",
              "It only matters for external reports",
            ],
            answer: 1,
            explain: "A report in a style not suited to its audience is not professional — the content must be phrased so the readers understand it.",
          },
        ],
      },
      {
        heading: "How to write a report — style, selectivity and accuracy",
        icon: "document",
        flat: true,
        paragraphs: [
          "Style — To be completely successful, a report which makes recommendations must ensure that the persons for whom the report is intended: read it without unnecessary delay; understand everything in it without undue effort; accept the facts, findings, conclusions and recommendations; and decide to take the action recommended. Achieving this demands more of you than merely presenting relevant facts accurately — it also demands that you communicate in a way that is both acceptable and intelligible to the readers.",
          "Selectivity — Careful choice of words can enable you to convey many subtleties of meaning.",
          "Accuracy — Check that everything you write is factually accurate. The facts should be capable of being verified. Moreover, arguments should be soundly based and your reasoning should be logical. You should not write anything that will misinform, mislead or unfairly persuade your readers. If you do, you will be doing a disservice not only to yourself but also to your department and organisation. Accurate information is essential for effective communication and decision making.",
        ],
        slideQuiz: [
          {
            q: "A successful report that makes recommendations must ensure readers…",
            options: [
              "File it for later reference",
              "Read it without delay, understand it without undue effort, accept the findings, and act on the recommendations",
              "Forward it to as many people as possible",
              "Admire the writer's vocabulary",
            ],
            answer: 1,
            explain: "The four aims: read without unnecessary delay, understand without undue effort, accept the facts and findings, and decide to take the recommended action.",
          },
          {
            q: "Beyond presenting facts accurately, good report style demands…",
            options: [
              "Long, impressive sentences",
              "Communicating in a way that is both acceptable and intelligible to the readers",
              "Using technical jargon",
              "Writing in the first person",
            ],
            answer: 1,
            explain: "Style means communicating in a way that is acceptable and intelligible to the readers — not merely accurate.",
          },
          {
            q: "What does selectivity mean in report writing?",
            options: [
              "Choosing which readers may see the report",
              "Careful choice of words to convey subtleties of meaning",
              "Selecting only positive findings",
              "Cutting the report to one page",
            ],
            answer: 1,
            explain: "Selectivity is the careful choice of words, which can convey many subtleties of meaning.",
          },
          {
            q: "What standard must facts in a report meet?",
            options: [
              "They must sound convincing",
              "They must be capable of being verified",
              "They must be approved by the marketing team",
              "They must come from the internet",
            ],
            answer: 1,
            explain: "Everything you write should be factually accurate, and the facts should be capable of being verified.",
          },
          {
            q: "Writing something that misleads or unfairly persuades readers…",
            options: [
              "Is acceptable if it supports your recommendation",
              "Does a disservice to yourself, your department and your organisation",
              "Is fine in the executive summary only",
              "Only matters in legal reports",
            ],
            answer: 1,
            explain: "Misinforming, misleading or unfairly persuading readers harms you, your department and the organisation — accurate information is essential for decision making.",
          },
        ],
      },
      {
        heading: "How to write a report — objectivity and conciseness",
        icon: "shield",
        flat: true,
        paragraphs: [
          "Objectivity — A report should not be an essay reflecting personal emotions and opinions. You must look at all sides of a problem with an open mind before stating your conclusions. Making it clear that you have an open mind when writing your report will, in most cases, make your conclusions and recommendations more acceptable to your readers. The emphasis, therefore, should be on the factual material presented and the conclusions drawn, rather than on any personal beliefs, biases or prejudices.",
          "Conciseness — Veni, Vidi, Vici (I came, I saw, I conquered). That is how Julius Caesar reported his visit to our shores. While none of your reports will be as short as this, you should aim to keep them concise. In doing this, do not mistake brevity for conciseness. A report may be brief because it omits important information. A concise report, on the other hand, is short but still contains all the essential details.",
          "To ensure you do not include material which can safely be left out, you should not ask: 'Can this information be included?' Rather, you should ask: 'Is it necessary for this information to be included?'",
        ],
        slideQuiz: [
          {
            q: "What does objectivity require of a report writer?",
            options: [
              "Expressing strong personal opinions",
              "Looking at all sides of a problem with an open mind before stating conclusions",
              "Only reporting management's view",
              "Avoiding conclusions entirely",
            ],
            answer: 1,
            explain: "A report is not an essay of personal emotions and opinions — look at all sides with an open mind before concluding.",
          },
          {
            q: "Where should the emphasis of a report fall?",
            options: [
              "On personal beliefs and biases",
              "On the factual material presented and the conclusions drawn",
              "On the writer's writing style",
              "On the company's reputation",
            ],
            answer: 1,
            explain: "The emphasis should be on the factual material and the conclusions drawn — not personal beliefs, biases or prejudices.",
          },
          {
            q: "What is the difference between brevity and conciseness?",
            options: [
              "There is no difference",
              "A brief report may omit important information; a concise report is short but contains all essential details",
              "Brevity is better than conciseness",
              "Concise reports are always longer",
            ],
            answer: 1,
            explain: "Do not mistake brevity for conciseness: brief may mean incomplete; concise means short yet complete.",
          },
          {
            q: "Which question should you ask about including material in a report?",
            options: [
              "'Can this information be included?'",
              "'Is it necessary for this information to be included?'",
              "'Will this make the report look longer?'",
              "'Does this paragraph sound clever?'",
            ],
            answer: 1,
            explain: "Ask 'Is it necessary for this information to be included?' — not merely whether it can be included.",
          },
          {
            q: "Why does an open-minded tone help your report?",
            options: [
              "It makes the report longer",
              "It makes your conclusions and recommendations more acceptable to readers",
              "It hides weak findings",
              "It avoids the need for evidence",
            ],
            answer: 1,
            explain: "Making it clear you have an open mind makes your conclusions and recommendations more acceptable to your readers.",
          },
        ],
      },
      {
        heading: "How to write a report — clarity, simplicity and pointless words",
        icon: "checkCircle",
        flat: true,
        paragraphs: [
          "Clarity and consistency — The best way to achieve clarity in your writing is to allow some time to elapse between the first draft and its revision. Try to leave it over the weekend, or at least overnight. If you are really under pressure and this is simply not possible, at least leave it over a lunch or coffee break. It is essential to have a period of time, no matter how short, when you can think of other things. In this way, when you come back to the report, you can look at it with a degree of objectivity.",
          "Simplicity — Usually, if your writing is selective, accurate, objective, concise, clear and consistent, it will also be as simple as it can be. You should guard against over-simplifying, for example to the point of missing out information which the reader needs to fully understand what you are trying to say. Keep your readers firmly in mind and keep asking yourself whether or not they will be able to follow the logic of your presentation.",
          "Avoid pointless words — Some words and phrases — like basically, actually, undoubtedly, each and every one and during the course of our investigation — keep cropping up in reports. Yet they add nothing to the message and often can be removed without changing the meaning or the tone. Try leaving them out of your writing. You will find your sentences survive, succeed and may even flourish without them.",
        ],
        slideQuiz: [
          {
            q: "What is the best way to achieve clarity in your writing?",
            options: [
              "Write the report in one sitting and submit immediately",
              "Allow time to elapse between the first draft and its revision",
              "Use longer words",
              "Have someone else write it",
            ],
            answer: 1,
            explain: "Let time pass between draft and revision — over a weekend, overnight, or at least a coffee break — so you can revise objectively.",
          },
          {
            q: "If you are under pressure, what is the minimum break you should take before revising?",
            options: [
              "No break is needed",
              "A lunch or coffee break",
              "A full week",
              "A month",
            ],
            answer: 1,
            explain: "Even under pressure, leave the draft over a lunch or coffee break so you can return to it thinking freshly.",
          },
          {
            q: "What is the danger of over-simplifying?",
            options: [
              "The report becomes too long",
              "Missing out information the reader needs to fully understand what you are saying",
              "Readers will think it's too formal",
              "It increases printing costs",
            ],
            answer: 1,
            explain: "Guard against over-simplifying to the point of leaving out information the reader needs.",
          },
          {
            q: "Which of these is an example of a pointless word or phrase?",
            options: ["Recommendation", "Basically", "Conclusion", "Findings"],
            answer: 1,
            explain: "Words like basically, actually, undoubtedly, each and every one, and during the course of our investigation add nothing to the message.",
          },
          {
            q: "What usually happens when you remove pointless words from your sentences?",
            options: [
              "The meaning changes completely",
              "The sentences survive, succeed and may even flourish without them",
              "The report becomes unreadable",
              "The tone becomes too casual",
            ],
            answer: 1,
            explain: "Pointless words can often be removed without changing the meaning or tone — your sentences flourish without them.",
          },
        ],
      },
      {
        heading: "The basic structure of a report",
        icon: "clipboard",
        flat: true,
        paragraphs: [
          "Types of reports can vary greatly; they can range from an experimental report to an environmental impact statement. There is however a basic structure common to most reports, irrespective of their type. The major components of a general report are:",
        ],
        bullets: [
          "Title page — identifies the report, its author and its date.",
          "Abstract — in less than 200 words: what was the problem, how was it investigated, what did you find out and what do your findings mean?",
          "Table of contents — a list of the major and minor sections of your report.",
          "Introduction — set the scene; give some background information about the topic. State the aim/purpose of the investigation. Outline the body sections.",
          "Main body — organise the sections in a logical sequence: what you investigated, what you found, what interpretations and what judgments you made. Use short informative headings and subheadings.",
          "Conclusion — what has been achieved and what is the significance of your findings and your discussion? Have your aims been successful or not?",
          "Recommendations — what do you recommend as a course of action following your conclusion?",
          "References — a list of all the sources you used.",
          "Appendices — any information (graphs, charts, tables or other data) you used in your report but did not include in the body.",
        ],
        slideQuiz: [
          {
            q: "What is the maximum length of an abstract?",
            options: ["Less than 200 words", "One full page", "500 words", "There is no limit"],
            answer: 0,
            explain: "The abstract covers the problem, method, findings and their meaning in less than 200 words.",
          },
          {
            q: "What belongs in the introduction?",
            options: [
              "The recommendations",
              "Background information, the aim/purpose of the investigation and an outline of the body sections",
              "The list of references",
              "Graphs and charts",
            ],
            answer: 1,
            explain: "The introduction sets the scene, gives background, states the aim/purpose and outlines the body sections.",
          },
          {
            q: "How should the main body be organised?",
            options: [
              "In alphabetical order",
              "In a logical sequence with short informative headings and subheadings",
              "As one long paragraph",
              "By order of importance to the writer",
            ],
            answer: 1,
            explain: "Organise the main body logically — what you investigated, found, interpreted and judged — with short informative headings.",
          },
          {
            q: "Where do graphs, charts and tables that were not included in the body belong?",
            options: ["The abstract", "The appendices", "The references", "The title page"],
            answer: 1,
            explain: "Appendices hold any information (graphs, charts, tables or other data) used in the report but not included in the body.",
          },
          {
            q: "Which component answers 'what do you recommend as a course of action following your conclusion?'",
            options: ["Introduction", "Recommendations", "Table of contents", "Abstract"],
            answer: 1,
            explain: "The recommendations state the course of action that follows from the conclusion.",
          },
        ],
      },
      {
        heading: "Types of reports",
        icon: "layers",
        flat: true,
        paragraphs: [
          "There are various types of reports. We may think of:",
        ],
        bullets: [
          "A report of a sports match.",
          "A report of an accident to the Police or an insurance company.",
          "A report of a social function, such as a wedding.",
          "A news report about an accident, meeting or noteworthy incident.",
          "A report of a commission of enquiry.",
          "A trade report.",
          "A company report or a Company Accident Report.",
          "An Annual Report by a Chairman or a Treasurer.",
          "An internal report on a business related matter following an investigation or collection of data.",
        ],
        slideQuiz: [
          {
            q: "Which of these is a type of report mentioned in the lesson?",
            options: [
              "A report of a commission of enquiry",
              "A shopping list",
              "A poem about business",
              "A text message",
            ],
            answer: 0,
            explain: "The lesson lists reports such as a commission of enquiry, trade reports, annual reports and internal business reports.",
          },
          {
            q: "Who might an accident report be written for?",
            options: [
              "The Police or an insurance company",
              "The sports team",
              "A wedding planner",
              "The newspaper crossword",
            ],
            answer: 0,
            explain: "An accident may be reported to the Police or an insurance company.",
          },
          {
            q: "Who typically produces an Annual Report?",
            options: [
              "A Chairman or a Treasurer",
              "A new employee",
              "The receptionist",
              "An external customer",
            ],
            answer: 0,
            explain: "The lesson mentions an Annual Report by a Chairman or a Treasurer.",
          },
          {
            q: "An internal business report usually follows…",
            options: [
              "An investigation or collection of data",
              "A staff birthday",
              "A public holiday",
              "A marketing slogan",
            ],
            answer: 0,
            explain: "An internal report on a business related matter follows an investigation or collection of data.",
          },
          {
            q: "Which statement about report types is TRUE?",
            options: [
              "Report types vary greatly, but most share a common basic structure",
              "All reports have completely different structures",
              "Only company reports have structure",
              "News reports are not really reports",
            ],
            answer: 0,
            explain: "Types of reports vary greatly — from sports reports to commissions of enquiry — but most share the same basic structure.",
          },
        ],
      },
      {
        heading: "Resources and procedures for obtaining and distributing confidential information",
        icon: "lock",
        flat: true,
        paragraphs: [
          "Time: 30 minutes · Activity: Self & Group.",
          "Resources for getting information — Firstly, all information which is available in the organisation must always be seen as confidential information. When some information is made available to the competitors of the organisation, they may have the upper hand and be able to take concepts and ideas from the organisation, and copy them. This could lead to serious financial implications for the organisation. Information centres in the organisation, such as the operations department, financial department, research and development, as well as the human resources department, will have information about the organisation and will be able to give an authorised individual all the information they may need of the organisation.",
          "Information sourced from the organisation can include, but is not limited to: financial statements / reports; research and development activities; marketing and advertising strategies; human resource needs / expectations; company vision with regards to the long term expectations and future of the organisation; and project specific information of certain aspects of projects undertaken by the organisation.",
          "Procedures for distributing information — Distributing information about the organisation must be handled in a very delicate manner and the recipients of such information must be selected carefully. Depending on the severity of the information and the level of security and/or risk attached to the information, recipients should be graded whether or not they are liable to obtain such information. Most information will be distributed to the individuals in the organisation dependent on their need for such information — the information should be relevant to their needs as well as their use.",
          "For instance: if the marketing department is going to be included in the distribution of a new marketing campaign for the organisation, the information given to them should purely be on the new product / service as well as how it will influence and/or attract customers, including the expected target market for the product. They need not know the amount spent on the research and development costs of the new product.",
        ],
        slideQuiz: [
          {
            q: "How should ALL information available in the organisation be treated?",
            options: [
              "As public information",
              "As confidential information",
              "As unimportant",
              "As marketing material",
            ],
            answer: 1,
            explain: "All information available in the organisation must always be seen as confidential information.",
          },
          {
            q: "What can happen if organisational information reaches competitors?",
            options: [
              "Nothing significant",
              "They may gain the upper hand, copy concepts and ideas, with serious financial implications",
              "The organisation gets free publicity",
              "The competitors must pay a fee",
            ],
            answer: 1,
            explain: "Competitors may take and copy concepts and ideas, which could lead to serious financial implications for the organisation.",
          },
          {
            q: "Which departments are examples of information centres in an organisation?",
            options: [
              "Operations, financial, research and development, and human resources",
              "Only the canteen",
              "Only the IT helpdesk",
              "Reception and security only",
            ],
            answer: 0,
            explain: "Information centres include operations, finance, R&D and HR — they can give an authorised individual the information they need.",
          },
          {
            q: "How should recipients of sensitive information be selected?",
            options: [
              "Everyone receives everything",
              "Carefully — graded by the severity of the information and their need for it",
              "First come, first served",
              "By seniority only",
            ],
            answer: 1,
            explain: "Recipients must be selected carefully and graded according to the severity/risk of the information and their need for it.",
          },
          {
            q: "In the marketing campaign example, what should the marketing department NOT be given?",
            options: [
              "The expected target market",
              "The research and development costs of the new product",
              "How the product will attract customers",
              "Details of the new product/service",
            ],
            answer: 1,
            explain: "Marketing receives what is relevant to their use — the product, its customer impact and target market — not the R&D spend.",
          },
        ],
      },
      {
        heading: "Verifying reported information is in accordance with requirements",
        icon: "checkCircle",
        flat: true,
        paragraphs: [
          "Time: 30 minutes · Activity: Self & Group.",
          "Before any report is sent to a person who will proof it and ensure it is correct, the originator of the report is required to double check that all the information given in the report is in line with the stipulated requirements of both the target audience as well as the required outcomes of the report.",
          "Therefore the person who wrote the report will get another person to read through it, with the required outlines and requirements at hand, and critique the report. This is done to get a second opinion on the report and to ensure that all the information required in the report is present, as well as check the biasness of the report to the readers.",
          "In many cases, once the report has been critiqued and sent for proofing, the report is handed to the head of the department for approval, at least a week in advance of the expected delivery date. They will have time to go through the report and then give their feedback with regards to add-ons and information which is not relevant to the report.",
          "In this process, organisational procedures must be strictly followed and adhered to, to ensure that the set protocols are followed for the gathering and distribution of information contained in the report. This is done to ensure that the report is true to its requirements and that it contains sufficient, but not too much information — at the same time giving all its readers the full value of the intended outcome of the report.",
        ],
        slideQuiz: [
          {
            q: "Who must first double-check that a report meets the stipulated requirements?",
            options: [
              "The head of department",
              "The originator (writer) of the report",
              "The proofreader",
              "The readers",
            ],
            answer: 1,
            explain: "Before the report goes for proofing, the originator must double check the information against the requirements of the audience and the required outcomes.",
          },
          {
            q: "Why does the writer ask another person to critique the report?",
            options: [
              "To share the blame",
              "To get a second opinion, confirm all required information is present, and check for bias",
              "To delay submission",
              "Because the writer cannot read",
            ],
            answer: 1,
            explain: "A second reader, with the required outlines at hand, checks completeness and the biasness of the report to the readers.",
          },
          {
            q: "How far in advance should the report be handed to the head of department for approval?",
            options: ["At least a week before the expected delivery date", "The same day", "One hour before", "A month after delivery"],
            answer: 0,
            explain: "The report goes to the department head at least a week in advance so they can review and give feedback.",
          },
          {
            q: "What feedback does the department head give?",
            options: [
              "Only spelling corrections",
              "Feedback on add-ons and information which is not relevant to the report",
              "A new title",
              "The final printing quote",
            ],
            answer: 1,
            explain: "The head reviews the report and gives feedback on add-ons and irrelevant information.",
          },
          {
            q: "Why must organisational procedures be strictly followed in this process?",
            options: [
              "To slow the process down",
              "To ensure set protocols for gathering and distributing information are followed, so the report is true to its requirements",
              "To create more paperwork",
              "To keep the report secret from its readers",
            ],
            answer: 1,
            explain: "Strict adherence ensures the report is true to its requirements, contains sufficient but not too much information, and gives readers the full value of its intended outcome.",
          },
        ],
      },
    ],

    exercises: [],

    questionSessions: [
      {
        id: "qs1",
        title: "Questioning — Evaluate spoken discourse in formal and informal texts",
        task: "Time: 45 minutes · Activity: Self & Group",
        steps: [
          "Give examples of different types of reports that are produced in organisations",
          "Explain the information that will be relayed in each of the reports you have mentioned above",
          "Explain your organisational procedures for obtaining and distributing sensitive company information",
          "Explain your organisational procedures for obtaining sensitive company information",
          "Identify and explain the steps that are used for compiling reports",
          "Explain how to ensure that the reported information is in accordance with the requirements of the report",
        ],
        checks: [
          {
            answer: [
              "Progress or status reports — routine updates on work, projects or service performance.",
              "Incident or investigation reports — a factual record of what happened, why, and what was done.",
              "Feasibility reports / business cases — analysis and recommendation to support a decision.",
              "Financial reports — budgets, expenditure, income and forecasts used to control money and plan spending.",
              "Performance reports — monthly service or SLA reporting against targets, showing whether the service is meeting agreed levels.",
              "Audit and compliance reports — findings against standards, policies or regulations.",
            ],
            concepts: [
              ["progress", "status"],
              ["incident", "investigation"],
              ["feasibility", "business case", "recommendation"],
              [
                "financial",
                "budget",
                "expenditure",
                "fiscal",
                "monetary",
                "money",
                "fund",
                "spending",
                "income",
                "forecast",
              ],
              ["performance", "sla", "monthly"],
              ["audit", "compliance"],
            ],
            labels: [
              "Progress/status reports",
              "Incident/investigation reports",
              "Feasibility/business case reports",
              "Financial reports",
              "Performance reports",
              "Audit/compliance reports",
            ],
            min: 3,
          },
          {
            answer: [
              "Progress/status reports relay what has been done, what is outstanding, and whether the work is on schedule and within budget.",
              "Incident reports relay the facts of the event: what happened, when, who was affected, the root cause, and the corrective action taken.",
              "Feasibility reports relay the options considered, costs and benefits, risks, and a clear recommendation.",
              "Financial reports relay income, expenditure, variances against budget and financial forecasts.",
              "Performance reports relay actual results measured against agreed targets (e.g. SLA compliance), with trends and exceptions.",
              "Audit reports relay findings, the evidence for them, and the required remediation.",
            ],
            concepts: [
              ["schedule", "outstanding", "done", "budget"],
              ["what happened", "root cause", "corrective", "facts"],
              ["options", "costs", "benefits", "recommendation", "risks"],
              ["income", "expenditure", "variance", "forecast"],
              ["targets", "sla", "trends", "results"],
              ["findings", "evidence", "remediation"],
            ],
            labels: [
              "Progress: work done and schedule",
              "Incident: facts, cause and correction",
              "Feasibility: options and recommendation",
              "Financial: figures and variances",
              "Performance: results vs targets",
              "Audit: findings and remediation",
            ],
            min: 3,
          },
          {
            answer: [
              "Sensitive information is obtained only through authorised channels — a formal request to the information owner, with line-manager approval and a clear business reason.",
              "Access is granted on a need-to-know / least-privilege basis, and the request and approval are recorded.",
              "Distribution is controlled: documents are classified (e.g. Internal, Confidential), shared only with authorised recipients over approved channels, and never left exposed.",
              "POPIA and company confidentiality policy govern all handling of personal and client information; breaches must be reported immediately.",
            ],
            concepts: [
              ["authorised", "approval", "formal request", "owner"],
              ["need-to-know", "need to know", "least privilege", "recorded"],
              ["classified", "classification", "controlled distribution", "labelled", "labeled", "marked confidential"],
              ["popia", "policy", "breach"],
            ],
            labels: [
              "Authorised request and approval",
              "Need-to-know access, recorded",
              "Classified, controlled distribution",
              "POPIA and confidentiality policy",
            ],
            min: 2,
          },
          {
            answer: [
              "Submit a formal request to the information owner stating the business reason for needing the information.",
              "Obtain the required approval (line manager and/or information owner) before any access is granted.",
              "Access is limited to what is needed for the task (least privilege) and is logged so there is an audit trail.",
              "Sign or observe the applicable confidentiality undertaking; personal and client information is handled under POPIA.",
            ],
            concepts: [
              ["request", "business reason"],
              ["approval", "approved", "authoris"],
              ["least privilege", "limited", "audit", "logged"],
              ["confidentiality", "popia", "undertaking"],
            ],
            labels: [
              "Formal request with reason",
              "Approval before access",
              "Limited, logged access",
              "Confidentiality and POPIA",
            ],
            min: 2,
          },
          {
            answer: [
              "Clarify the purpose and audience of the report — what decision or action it must support.",
              "Gather and verify the information: collect the facts, data and evidence from reliable sources.",
              "Organise and analyse the information: sort it into a logical structure, separating fact from opinion.",
              "Draft the report using the required structure — title, introduction/purpose, findings, conclusions, recommendations.",
              "Review and edit: check accuracy, completeness, plain language and spelling; make sure it meets the brief.",
              "Submit and distribute the report to the intended audience through the correct channels, on time.",
            ],
            concepts: [
              ["purpose", "audience"],
              ["gather", "collect", "verify", "sources"],
              ["organise", "analyse", "structure", "fact from opinion"],
              ["draft", "findings", "conclusions", "recommendations"],
              ["review", "edit", "check", "accuracy"],
              ["submit", "distribute", "on time"],
            ],
            labels: [
              "Clarify purpose and audience",
              "Gather and verify information",
              "Organise and analyse",
              "Draft with the required structure",
              "Review and edit",
              "Submit and distribute",
            ],
            min: 3,
          },
          {
            answer: [
              "Check the report against the brief or template: does it answer the questions it was asked to answer, in the required format?",
              "Verify every fact and figure against the source data, and reference the sources.",
              "Keep fact and opinion clearly separated, and label any assumptions.",
              "Have the report reviewed or proofread by a colleague or supervisor before submission.",
              "Confirm the report reaches the right audience, at the right time, through the correct channel.",
            ],
            concepts: [
              ["brief", "template", "format", "requirements"],
              ["verify", "source", "figures", "reference"],
              ["fact", "opinion", "assumption"],
              ["review", "proofread", "supervisor", "colleague"],
              ["audience", "right time", "channel"],
            ],
            labels: [
              "Check against the brief/format",
              "Verify facts against sources",
              "Separate fact and opinion",
              "Peer/supervisor review",
              "Right audience, time and channel",
            ],
            min: 3,
          },
        ],
      },
    ],

    assignments: [],

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
        { icon: "clock", label: "Time", value: "09:00 \u2013 14:00 · lunch 12:00 \u2013 13:00" },
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
              time: "25 minutes",
              title: "Index & Unit Standard Alignment — Facilitator",
              text: [
                "Read through the index with the learners, highlighting the areas that will be covered in this manual. Make reference to the Unit Standard Alignment Index to outline the specific outcomes that will be covered.",
              ],
              resources: ["LM p3"],
            },
            {
              time: "85 minutes",
              title: "Purpose and content of a range of reports — Facilitator & Class",
              bullets: [
                "Read through pages 4-7 of the learner manual, identifying different reports and the styles in which they are written.",
              ],
              resources: ["LM p4-7"],
            },
            {
              time: "10 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "25 minutes",
              title: "Procedures and resources for obtaining and distributing confidential information — Facilitator & Class",
              bullets: [
                "Read through page 8 and identify resources for getting information and procedures for distributing such information.",
              ],
              resources: ["LM p8"],
            },
            {
              time: "15 minutes",
              title: "Verifying reported information — Facilitator & Class",
              bullets: [
                "Read through page 9 and identify methods to check that the reported information is in accordance with the requirements.",
              ],
              resources: ["LM p9"],
            },
            {
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "30 minutes",
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

    selfAssessment: {
      intro: [
        "You are now ready to go through a check list. Be honest with yourself.",
        "Tick the box with either a \u221A or an X to indicate your response.",
      ],
      items: [
        "I am able to identify and explain different types of reports used in organisations.",
        "I am able to explain the use of the different types of reports.",
        "I am able to identify and explain the reasons for handling confidential information, confidentially.",
        "I am able to explain a range of techniques for compiling reports.",
        "I am able to explain how the reported information is checked for appropriateness and then distributed according to the intended audience of the report.",
      ],
      outro: [
        "You must think about any point you could not tick. Write this down as a goal.",
        "Decide on a plan of action to achieve these goals. Regularly review these goals.",
      ],
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
        slideQuiz: [
          {
            q: "What is the main focus of this section of Unit Standard 10135?",
            options: [
              "The cost of workstation hardware",
              "How each member contributes to team coherence, image, spirit and respectful interaction",
              "Writing feasibility reports for the bank",
              "Configuring Active Directory group policies",
            ],
            answer: 1,
            explain: "This section is about the contribution every member makes to team coherence, image and spirit and to respectful interaction between team members.",
          },
          {
            q: "\"Team spirit\" on an IT support team is best described as:",
            options: [
              "How loudly the team celebrates a resolved incident",
              "The shared willingness to help, back each other up and move the team's work forward",
              "The number of tickets closed per person",
              "The team's dress code",
            ],
            answer: 1,
            explain: "Spirit is the shared willingness to pull together toward the team's work — visible in helping, backing up and following through.",
          },
          {
            q: "Which action MOST directly protects the team's image with its stakeholders?",
            options: [
              "Escalating every ticket to management",
              "Delivering what was promised, on time and courteously, and speaking well of teammates in public",
              "Working strictly to your own job description and no further",
              "Blaming the previous shift when a call goes wrong",
            ],
            answer: 1,
            explain: "Image is built by consistent delivery, courteous conduct and public respect for teammates — not by shifting blame or hiding.",
          },
          {
            q: "\"Respecting differences\" between team members means:",
            options: [
              "Everyone must think the same way to avoid conflict",
              "Ignoring differences so nobody feels awkward",
              "Recognising and using the different backgrounds, temperaments and skills each member brings",
              "Only the leader's view matters",
            ],
            answer: 2,
            explain: "Respecting differences means recognising and using the strengths that come from different backgrounds, temperaments and skills.",
          },
          {
            q: "Which time allocation applies to this section as taught?",
            options: [
              "15 minutes",
              "30 minutes",
              "60 minutes",
              "90 minutes",
            ],
            answer: 3,
            explain: "The activity for this section is timed at 90 minutes (self & group work).",
          },
        ],
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
        slideQuiz: [
          {
            q: "Which of the following is clearly unproductive team behaviour?",
            options: [
              "Asking a clarifying question in a stand-up",
              "Consistently missing team meetings",
              "Volunteering for an extra shift",
              "Documenting a fix in the knowledge base",
            ],
            answer: 1,
            explain: "Consistently missing meetings is listed on the slide as clearly detrimental to the functioning of the team.",
          },
          {
            q: "A team-mate never replies to e-mail or Teams messages for days. What category does this fall under?",
            options: [
              "A quirky communication style",
              "Clearly unproductive behaviour",
              "A leadership problem",
              "None of the team's business",
            ],
            answer: 1,
            explain: "Not answering e-mail or messages in a reasonable time is listed as clearly unproductive.",
          },
          {
            q: "Which behaviour signals a lack of preparation and is called out on the slide?",
            options: [
              "Coming to a meeting with a written status update",
              "Never coming prepared to meetings",
              "Circulating an agenda beforehand",
              "Taking minutes",
            ],
            answer: 1,
            explain: "\"Never coming prepared to meetings\" is one of the listed clearly-unproductive behaviours.",
          },
          {
            q: "Which of these is a listed unproductive behaviour that damages team relations directly?",
            options: [
              "Discourteous or disrespectful language",
              "Asking for help",
              "Sharing credit publicly",
              "Praising a teammate's fix",
            ],
            answer: 0,
            explain: "Discourteous or disrespectful language is called out as clearly unproductive and destructive to team relations.",
          },
          {
            q: "Consistently missing deadlines is a problem primarily because it:",
            options: [
              "Reduces your personal credit-card limit",
              "Blocks other team members' work and undermines team commitments",
              "Is against company dress code",
              "Only affects the person who missed the deadline",
            ],
            answer: 1,
            explain: "Missed deadlines create downstream blockers for the rest of the team and erode the team's commitments to stakeholders.",
          },
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
        slideQuiz: [
          {
            q: "Questioning EVERY detail of the project until progress stalls is best described as:",
            options: [
              "Raising a concern",
              "Being principled",
              "Nitpicking",
              "Following procedure",
            ],
            answer: 2,
            explain: "Nitpicking is the extreme form of \"raising a concern\" — objecting to every possible detail until the project can't move.",
          },
          {
            q: "A member refuses to let anyone else alter or critique work she has done for the team. This is the extreme form of:",
            options: [
              "Ownership / responsibility (becoming possessiveness)",
              "Listening & reflecting (becoming lurking)",
              "Staying in touch (becoming nudging)",
              "Being principled (becoming uncompromising)",
            ],
            answer: 0,
            explain: "Healthy ownership becomes possessiveness when the person refuses to let anyone alter or critique the work.",
          },
          {
            q: "\"Lurking\" — never contributing in team meetings or communications — is the unproductive extreme of which normal behaviour?",
            options: [
              "Asking questions",
              "Listening and reflecting",
              "Being principled",
              "Following procedure",
            ],
            answer: 1,
            explain: "Listening & reflecting is normal; taken too far it becomes lurking — never contributing.",
          },
          {
            q: "A team-mate sends reminders every hour without giving people a reasonable interval to respond. This is:",
            options: [
              "Staying in touch",
              "Following procedure",
              "Nudging",
              "Modelling commitment",
            ],
            answer: 2,
            explain: "Nudging is the extreme form of \"staying in touch\" — reminders piled on before anyone has had time to answer.",
          },
          {
            q: "\"Doing everything\" — refusing to let other members contribute — is unproductive because it:",
            options: [
              "Uses too much electricity",
              "Prevents skill development, hides work, and undermines shared ownership of the outcome",
              "Reduces the leader's salary",
              "Speeds the project up beyond schedule",
            ],
            answer: 1,
            explain: "\"Doing everything\" starves other members of contribution — it kills skill development and shared ownership of the outcome.",
          },
        ],
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
        slideQuiz: [
          {
            q: "Before contacting the instructor about unproductive behaviour, the team should first:",
            options: [
              "Make a formal complaint to HR",
              "Try to resolve the problem within the team",
              "Remove the person from the team",
              "Ignore the behaviour and hope it passes",
            ],
            answer: 1,
            explain: "The slide says it is best to make a significant effort to resolve problems within the team before contacting the instructor.",
          },
          {
            q: "When deciding if behaviour is really unproductive, the team should ask whether it:",
            options: [
              "Is annoying to the leader personally",
              "Interferes with the team's work, consensus or morale",
              "Happens on Fridays",
              "Involves someone senior",
            ],
            answer: 1,
            explain: "The test is whether the behaviour interferes with completing work, reaching true consensus, or seriously harms morale.",
          },
          {
            q: "The recommended framing when raising a behaviour issue is:",
            options: [
              "\"You always ruin our meetings.\"",
              "\"I/We feel (frustrated/concerned) when you (behaviour) because it (effect on the team).\"",
              "\"Everyone thinks you're the problem.\"",
              "\"Fix it or I'll escalate.\"",
            ],
            answer: 1,
            explain: "The slide gives a specific I-statement template that focuses on the behaviour and its effect on the team, not on attacking the person.",
          },
          {
            q: "The team must make sure the issue is identified as a specific:",
            options: [
              "Personality flaw",
              "Behaviour, not the person",
              "Rule violation",
              "Salary problem",
            ],
            answer: 1,
            explain: "\"The problem is with the behaviour, not with the person.\" The team addresses behaviour, not identity.",
          },
          {
            q: "When a team-mate is \"missing in action\" and does not respond to repeated attempts to reach them, the team should:",
            options: [
              "Pretend they are still contributing",
              "Do all their work silently",
              "Inform the instructor so a solution can be worked out",
              "Fire them from the team without warning",
            ],
            answer: 2,
            explain: "For a missing-in-action member, the slide says it may be best to inform the instructor and work out an agreeable solution.",
          },
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
        slideQuiz: [
          {
            q: "According to the definition on this slide, contributing to team coherence means:",
            options: [
              "Only doing what the leader tells you",
              "Actively participating as a member of a team to move the team/work unit toward the completion of goals",
              "Completing your own tasks first, then leaving",
              "Escalating every problem to management",
            ],
            answer: 1,
            explain: "The slide's definition is: actively participating as a member of a team to move the team/work unit toward the completion of goals.",
          },
          {
            q: "\"Help the team obtain resources and clear away obstacles\" is an example of which behaviour on the slide?",
            options: [
              "Involve others and keep them informed",
              "Actively help the team or work unit accomplish its goals",
              "Model commitment",
              "Enforce compliance",
            ],
            answer: 1,
            explain: "Helping the team obtain resources and clearing obstacles is listed under \"actively help the team or work unit accomplish its goals.\"",
          },
          {
            q: "Which activity best demonstrates \"involve others and keep them informed\"?",
            options: [
              "Deciding on your own and telling the team afterwards",
              "Actively seeking the input of quiet team members and sharing information with everyone on the team",
              "Copying only the leader on decisions",
              "Waiting for people to ask before you share",
            ],
            answer: 1,
            explain: "The slide highlights seeking input from quiet members, listening respectfully, and sharing information with everyone.",
          },
          {
            q: "\"Modelling commitment\" as described on the slide includes:",
            options: [
              "Publicly criticising the team's decisions when things get hard",
              "Publicly pursuing the team's goals with enthusiasm and a can-do attitude",
              "Working extra hours only if paid overtime",
              "Rewriting the team's roles yourself",
            ],
            answer: 1,
            explain: "Modelling commitment is publicly and energetically pursuing the team's goals with enthusiasm and a can-do attitude.",
          },
          {
            q: "A good development activity on this slide is to:",
            options: [
              "Wait for someone to notice you",
              "Find a respected colleague or friend that you see as a good team player and ask them to mentor you",
              "Do the work of two people to look busy",
              "Volunteer for tasks outside the team's goals",
            ],
            answer: 1,
            explain: "The development-activities column recommends finding a respected colleague/friend seen as a good team player and asking them to mentor and advise you.",
          },
        ],
      },
      {
        heading: "Individual Needs Vs Team Needs",
        icon: "people",
        paragraphs: [
          "Besides differing in degrees of teaming instinct, people on teams differ in terms of personal agendas.",
          "We make a big deal out of team objectives. Team objectives are supposed to be these powerful visions that unite teams and drive them on irresistibly to success. But guess what, in teaming physics, the team objective is decidedly the weak force. The strong force remains the collection of personal wishes and wants that team members bring to the team.",
          "Just because we are attracted to teaming up, as described in the previous chapter, doesn't mean we set our other desires on the shelf. We don't know about you, but we'll be unintelligent if we'll forsake our personal dreams for the sake of some lousy workgroup. So a conflict exists between individual team members' goals and the overarching goal of the team itself.",
          "And it can play out very painfully. Imagine a team of four, with the acknowledged goal of creating an e-commerce site for a conventional business. The goal is simple; reengineer a local business to cyberspace.",
          "The four team members are Doug, a freelance programmer; Sarah, an in-house graphic designer; Miller, an outsider brought in to help develop a catalogue; and John, an old-guard sales engineer. Sounds workable... But the four people aren't stick figures. They each have an agenda that is subtly pulling the team apart.",
        ],
        cards: [
          {
            icon: "chip",
            title: "Doug — Freelance programmer",
            text: "Doug is upset because he has a program from a previous job that he feels would be fine for this job, with a few minor alterations. His agenda is to finish his part of the project and get on to the next one. Frankly, he needs the money. But his team-mates won't give him the go-ahead to do this.",
          },
          {
            icon: "design",
            title: "Sarah — In-house graphic designer",
            text: "Sarah is usually a good sport on teams, redoing work at their request. But Sarah has a secret. She's going to have a baby in seven months. Too early to tell everyone, doesn't want to count her chicken until it's hatched. But her mind is on that baby, and the project just doesn't do much for her. Her best design so far has been a garden page featuring characters from Peter Rabbit.",
          },
          {
            icon: "presenter",
            title: "Miller — Catalogue consultant",
            text: "Miller thinks he's God's gift to catalogue consulting. His taste in teamwork is to come in every day with a new plan, a major overhaul, a fresh vision. He's driving everyone crazy. People don't know this, but Miller is a recovering alcoholic going through a manic period. He's having the time of his life, getting interested in his career just as others are easing out of theirs.",
          },
          {
            icon: "briefcase",
            title: "John — Old-guard sales engineer",
            text: "John is the extrovert of the team. He helped start the company years ago, and he has reservations about the whole Internet thing. He read something in the paper, a year ago, that no one is making money there. It was his last fresh insight. Secretly, he resents the talented, but uncommitted youngsters around him, and lapses into frequent lectures on the virtue of selling garden supplies off the back of a truck. He feels unappreciated, and his lectures are a misguided effort to show people what is inside him.",
          },
        ],
        example: {
          title: "The quiet cost of unaddressed agendas",
          lines: [
            "We've just described four decent, talented people who are not in any way opposed to working on teams, and have nothing major against one another. But there are numerous conflicts between their individual goals and the team goal, and these conflicts will only build in significance.",
            "They probably won't ever blow up, or go ballistic or meltdown into a headline dysfunctional team. But they'll never gel as a team, and they won't meet their goal in a timely fashion, and the website will be a joke, because their team goals were deep-sixed by a raft of unfulfilled personal goals.",
            "Doug, Sarah, Miller and John are not going to click. Not for lack of good intentions. But their good intentions, taken together, are a feeble force compared to their individual, unaddressed needs.",
          ],
        },
        slideQuiz: [
          {
            q: "In \"teaming physics\" on this slide, the STRONG force is:",
            options: [
              "The team's mission statement",
              "The collection of personal wishes and wants each member brings to the team",
              "The organisational chart",
              "The project budget",
            ],
            answer: 1,
            explain: "The slide argues the team objective is the weak force; the strong force is the collection of personal wishes and wants team members bring.",
          },
          {
            q: "Which team member's private agenda is \"finish my part and move on because I need the money\"?",
            options: [
              "Sarah",
              "Miller",
              "John",
              "Doug",
            ],
            answer: 3,
            explain: "Doug wants to reuse an old program, finish his part and move on because he needs the money.",
          },
          {
            q: "Sarah's hidden distraction from the project is that she:",
            options: [
              "Is going to have a baby in seven months",
              "Wants Doug's job",
              "Is applying for another job",
              "Dislikes John",
            ],
            answer: 0,
            explain: "Sarah's secret on the slide is that she is going to have a baby in seven months, and her mind is on that baby.",
          },
          {
            q: "Miller's disruptive behaviour on the team is best described as:",
            options: [
              "Refusing to attend meetings",
              "Coming in every day with a new plan / fresh vision and driving everyone crazy",
              "Sabotaging Doug's code",
              "Copying Sarah's designs",
            ],
            answer: 1,
            explain: "Miller shows up daily with a new plan, major overhaul, or fresh vision — well-intentioned but driving the team crazy.",
          },
          {
            q: "The main lesson of the Doug / Sarah / Miller / John story is that:",
            options: [
              "Unaddressed personal agendas quietly derail otherwise well-intentioned teams",
              "You should never hire freelancers",
              "Only the leader's goals matter",
              "Team goals always override personal ones automatically",
            ],
            answer: 0,
            explain: "The four are decent and talented, yet unaddressed personal agendas quietly prevent the team from gelling and delivering.",
          },
        ],
      },
      {
        heading: "Rebalancing the load",
        icon: "layers",
        paragraphs: [
          "Effective teamwork means a continual balancing act between meeting team needs and individual needs.",
          "We're not just talking here about the basic human need for survival through affiliation with others that we discussed in the last chapter. We are speaking of all the things that each of us wants, things that have nothing to do with teams or jobs.",
          "While it's nice to be around other folks and work with them, we are all of us, still, looking out for number one. Forget all the movie scenes of the scrappy doughboy jumping on a live grenade to save his buddies in uniform. In real life, we take actions with others primarily to satisfy our personal agendas. People will only agree to team if it meets their own needs first.",
          "Of course, there are some of us who live for deferred gratification as a masochistic kick; like agreeing to work towards a team outcome now in exchange for some personal outcomes later on. These people happily forestall today's druthers in order to incur team payback tomorrow. But, in general, it's a \"me first,\" or at least a \"please consider my needs while we meet the team's,\" kind of world.",
        ],
        bullets: [
          "Team needs vs individual needs — both are always in play; ignore either and the team wobbles.",
          "Not just \"belonging\" — it's everything each of us wants, on and off the job.",
          "\"Me first\" is normal — plan for it, don't moralise about it.",
          "Deferred gratification exists — but it's the exception, not the rule.",
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
        slideQuiz: [
          {
            q: "Effective teamwork is described on this slide as:",
            options: [
              "The team overriding all personal needs",
              "A continual balancing act between meeting team needs and individual needs",
              "Every member sacrificing personal goals for the team",
              "The leader deciding what needs matter",
            ],
            answer: 1,
            explain: "The slide opens with: effective teamwork means a continual balancing act between meeting team needs and individual needs.",
          },
          {
            q: "According to the slide, in real life we take actions with others primarily to:",
            options: [
              "Impress the leader",
              "Satisfy our personal agendas",
              "Avoid punishment",
              "Prove we are selfless",
            ],
            answer: 1,
            explain: "In real life, we take actions with others primarily to satisfy our personal agendas.",
          },
          {
            q: "People will only agree to team if it:",
            options: [
              "Pays extra",
              "Has a written contract",
              "Meets their own needs first",
              "Is approved by senior management",
            ],
            answer: 2,
            explain: "The slide's blunt conclusion: people will only agree to team if it meets their own needs first.",
          },
          {
            q: "The \"deferred gratification\" personality on this slide:",
            options: [
              "Ignores personal outcomes altogether",
              "Agrees to a team outcome now in exchange for personal outcomes later",
              "Refuses any team payback",
              "Wants immediate personal reward only",
            ],
            answer: 1,
            explain: "Deferred-gratification people agree to work toward a team outcome now in exchange for personal outcomes later on.",
          },
          {
            q: "\"Looking out for number one\" on this slide means:",
            options: [
              "The team must come before the person, always",
              "Even while working with others, each of us is still primarily attending to our own wants",
              "Only the leader looks out for themselves",
              "You should refuse all teamwork",
            ],
            answer: 1,
            explain: "The point is that while it's nice to work with others, we are all still looking out for number one — plan for it.",
          },
        ],
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
        slideQuiz: [
          {
            q: "The term \"hidden agenda\" on this slide describes:",
            options: [
              "Meetings that were not on the calendar",
              "Covert careerism — members using the team for private ends without honest intent",
              "Team goals that were never written down",
              "Confidential company strategy",
            ],
            answer: 1,
            explain: "\"Hidden agenda\" was coined to describe covert careerism — dishonest and destructive to team coherence.",
          },
          {
            q: "To build trust, good teams must:",
            options: [
              "Keep their hidden agendas secret to avoid conflict",
              "Uncover their own hidden agendas and expose them to the light of day",
              "Report each other to management",
              "Rely only on the leader to spot problems",
            ],
            answer: 1,
            explain: "Good teams recognise that trust requires uncovering their own hidden agendas and exposing them to the light of day.",
          },
          {
            q: "Which of the following is one of the covert statements the slide warns about?",
            options: [
              "\"I'm here to learn from everyone.\"",
              "\"I'm not here to work with the team, but to take credit for its successes.\"",
              "\"I'm ready to help wherever needed.\"",
              "\"I'll follow the team's process.\"",
            ],
            answer: 1,
            explain: "The slide lists this exact quote — using the team to take credit for its successes — as a hidden-agenda statement.",
          },
          {
            q: "Which is listed on the slide as an HONOURABLE personal goal that may still pull someone from the team?",
            options: [
              "Making a name for oneself",
              "Wanting to belong to a team of \"winners\"",
              "Going back to school and getting that degree",
              "Wanting a group one can dominate",
            ],
            answer: 2,
            explain: "\"Going back to school and getting that degree\" appears in the honourable-goals list on the slide.",
          },
          {
            q: "The slide argues we should acknowledge personal goals as a team because:",
            options: [
              "It lets us fire the members who have them",
              "Knowing team-mates want us to achieve what we ourselves want is a terrific bond, and prevents selfish desires from sinking the effort",
              "It gives HR something to file",
              "Only then can the leader take control",
            ],
            answer: 1,
            explain: "Knowing team-mates want us to achieve what we ourselves want is a terrific bond — and acknowledging needs early prevents them from sinking the team.",
          },
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
        slideQuiz: [
          {
            q: "According to the slide, an ethical person always makes a moral connection between:",
            options: [
              "Salary, seniority and title",
              "Property, ownership and responsibility",
              "Time, money and stress",
              "Meetings, e-mail and reports",
            ],
            answer: 1,
            explain: "An ethical person always makes a moral connection between property, ownership, and responsibility.",
          },
          {
            q: "Learning to care about company \"stuff\" is described on the slide as being accomplished through:",
            options: [
              "Signing an asset register",
              "Thoughtful consideration — asking who paid, how you'd feel writing the cheque, and what the appropriate-use boundaries are",
              "Locking everything in a cupboard",
              "Buying your own equipment",
            ],
            answer: 1,
            explain: "The slide asks: who paid for this, how would I feel writing the cheque, and what are the boundaries for appropriate use — thoughtful consideration.",
          },
          {
            q: "Becoming TOO attached or too familiar with company property is a problem because you may:",
            options: [
              "Wear out the equipment",
              "Become desensitized to its appropriate professional use",
              "Get promoted too quickly",
              "Pay too much rent",
            ],
            answer: 1,
            explain: "If you use something every day, you may become desensitized to its appropriate professional use.",
          },
          {
            q: "The slide warns that ethical breaches involving company assets are:",
            options: [
              "Easily smoothed over with a sincere apology",
              "Rarely smoothed over with an apology — there is usually a smoking gun with no grey area",
              "Handled internally with a warning",
              "Considered a personal matter",
            ],
            answer: 1,
            explain: "Situations involving company assets are rarely smoothed over with an apology — the smoking gun leaves no grey area.",
          },
          {
            q: "Most industries deal with asset abuse or misuse with:",
            options: [
              "A written warning after three offences",
              "Additional training only",
              "Disciplinary action or termination on the first offence",
              "A pay cut for one month",
            ],
            answer: 2,
            explain: "The slide states: most industries deal with asset abuse or misuse with disciplinary action or termination on the first offence.",
          },
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
              "Involve others and keep them informed at every stage of the team's work.",
              "In team decisions and actions, actively seek the input of quiet team members, and ask what would make it easier for them to participate.",
              "Listen to others respectfully and fully. Recognize and use the differences and talents of others.",
              "Share information with everyone on the team so that no member is left in the dark.",
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
      {
        id: "ex3",
        title: "Reading — Contribute to building relations between team members and stakeholders",
        task: "Time: 90 minutes · Activity: Self & Group",
        scenario: [
          "Relations between the team members of an organisation and the stakeholders of the organisation are of paramount importance to ensure the smooth running of the organisation as well as the longevity thereof. If there is a breakdown in the communication between these two parties, a breakdown in the organisation will occur. Let's take the following extract of the Cape Town Tourism office and their stakeholders as an example. Once you have read through the article, answer the questions that follow (Exercise 4).",
          "Cape Town Tourism teams with stakeholders to keep Cape Town safe — Cape Town Safety & Security Plan unveiled",
          "Ensuring that Cape Town is a safe and secure environment for residents and visitors is an issue that seriously impacts on the functioning, sustainability and future growth of the Western Cape tourism industry.",
          "What's more, these issues of safety and security have an enormous impact on the experiences and quality of life of both residents and visitors to the Mother City. Cape Town Tourism, in partnership with various stakeholders in the Province and the City of Cape Town, has adopted an active stance in developing and implementing a practical, effective and integrated Cape Town Safety & Security Plan, finalised timeously as the Festive Season kicks off as an extension of the Provincial Safety and Security Plan.",
          "In broad terms, the following aspects are addressed in the Cape Town Safety & Security Plan:",
          "1. Creating awareness of the importance of visitor safety and security.",
          "2. Proactively developing and maintaining a safe and secure environment for visitors.",
          "3. Developing and maintaining capacity via the members and staff of Cape Town Tourism, to react quickly and effectively to visitor related incidents.",
          "4. Developing and maintaining effective communication with the Provincial Tourism Safety and Security Unit, the Tourism Victim Support programme, South African Police services, emergency services, media and other key role players.",
          "Key elements of the Cape Town Tourism Safety & Security Plan include:",
          "1. Participation and integration into the Provincial and National safety forums.",
          "2. Management of the integrated Cape Town Safety Forum.",
          "3. Participation in Local Safety Forums throughout the Cape Town Metropole.",
          "4. Initiation and management of Cape Town Tourism Members Safety Forum.",
          "5. Awareness and Communication campaigns, including distribution of practical safety tips and providing and assisting media in obtaining correct and factual information.",
          "Partners include the Provincial Government of the Western Cape and its Provincial Tourism Safety and Security Unit, the City of Cape Town, the Tourism industry, Cape Town Routes Unlimited, the Cape Town Partnership, the Chambers, City Improvement Districts (CIDs), and community representatives as well as Safety and Security Forces.",
          "Cape Town Tourism General Manager Mariëtte du Toit was quoted as saying, \"No single agency can be responsible for a safe destination, plan or react alone to visitor incidents. Every network of service providers has a role to play. Under the umbrella of the Department of Economic Development and Tourism's initiative, the Cape Town Safety & Security Plan promotes a practical partnership approach to tourism incident management\".",
          "\"Co-ordination and communication,\" du Toit went on to say, \"is the single most important aspect in the Cape Town Safety and Security Plan — in other words, an alignment that really works.\"",
          "Du Toit went on to explain that, as an organization that operates on the ground and within the communities of Cape Town, with a current membership base of 1 800 businesses and 18 Visitor Information Centres, Cape Town Tourism can play a strong role in the co-ordination, activation and ongoing awareness of the Cape Town Safety & Security Plan.",
          "She stressed the importance of using and reinforcing established and dedicated response mechanisms. These are:",
          "• Safety and Security incidents — 10111",
          "• Ambulance & Fire — 10177",
          "• Emergency services (other) — 107",
          "• Consumer complaints — 0800 007 081",
          "Much hard work has gone on behind the scenes, where strong relationships continue to be forged between the various safety and security role players. These partnerships will undertake the following combined tasks:",
          "• The ongoing monitoring of emergency response times.",
          "• Quantifying the success of the Cape Town Safety & Security Plan.",
          "• Identifying hotspots.",
          "• Embarking on joint awareness campaigns.",
          "• Ensuring that the Victim Support Programme is effectively utilized.",
          "Cape Town Tourism's membership base has been incorporated to further strengthen the Cape Town Safety & Security Plan: once incidents are reported to the dedicated response mechanisms, the relevant Cape Town Tourism Manager is contacted to ensure immediate activation of the Victim Support Programme. In addition, a Cape Town Tourism Membership Forum has been put in place that actively participates and feeds into the Cape Town and Provincial Safety and Security Forums. Members of Cape Town Tourism have also generously agreed to contribute to the Cape Town Tourism-run Band Aid Programme, which serves to provide additional services for feeding into the Victim Support Programme, for example accommodation, flights, tours, gifts and meal vouchers.",
          "Paramount to the Cape Town Safety & Security Plan is a zero tolerance approach towards crime. Communities throughout the Cape Town Metropole must claim their City back. In du Toit's words, \"No-one can afford to have the image of Cape Town tarnished. We desperately rely on tourism as a vehicle to spread economic benefits to all our people and as a means of improving living standards by creating sustainable employment opportunities.\"",
          "\"We rely on the people of Cape Town, the entire tourism industry and our law enforcement agencies to work together on this single most important challenge,\" she added. \"Ongoing awareness and communication that incorporates the citizens and communities of Cape Town is one of the most important aspects of the Safety & Security Plan.\" Summing things up succinctly, du Toit commented that Cape Town Tourism realises the importance of ongoing, year-round proactive and reactive programmes that can effectively turn a negative situation around and soften the blow. \"Cape Town is our home. As such, we all need to work together to make sure that she is safe so we can truly enjoy her and share her with each other and visitors from the world over.\"",
        ],
        steps: [
          "Read the extract carefully on your own and highlight every stakeholder, partner and response mechanism you can find.",
          "In your group, list the stakeholders and match each one to what they contribute to the Safety & Security Plan.",
          "Note the article's central claim about \"co-ordination and communication\" and the practical partnership approach — you will use this when you answer the questions in Exercise 4.",
        ],
      },
      {
        id: "ex4",
        title: "Questioning — Contribute to building relations between team members and stakeholders",
        task: "Time: 45 minutes · Activity: Self & Group",
        steps: [
          "Who are the different stakeholders and parties involved in the above article?",
          "Why do you think it is important for the various stakeholders and team members of the different parties to build solid relations?",
          "What are the needs of the stakeholders in the above article?",
          "What types of communication is used or mentioned in this article?",
          "How will the stakeholders ensure open and frank discussions between the parties?",
          "Why is it important that the commitments made to stakeholders are honoured and met?",
        ],
        checks: [
          {
            answer: [
              "Cape Town Tourism, the Provincial Government of the Western Cape and its Provincial Tourism Safety and Security Unit, the City of Cape Town, the Tourism industry and Cape Town Routes Unlimited.",
              "The Cape Town Partnership, the Chambers, City Improvement Districts (CIDs), community representatives and the Safety and Security Forces (SAPS, emergency services and Ambulance & Fire).",
              "The Tourism Victim Support programme, the Cape Town Tourism Members Safety Forum, the Cape Town Tourism-run Band Aid Programme, the media and the residents and visitors themselves.",
            ],
            concepts: [
              ["cape town tourism"],
              ["provincial", "western cape", "provincial government"],
              ["city of cape town"],
              ["saps", "police", "safety and security forces", "law enforcement"],
              ["cids", "chambers", "partnership", "community"],
              ["victim support", "band aid", "members forum", "media", "residents", "visitors"],
            ],
            labels: [
              "Cape Town Tourism",
              "Provincial Government / Safety and Security Unit",
              "City of Cape Town",
              "SAPS and Safety & Security Forces",
              "CIDs, Chambers, Partnership, community reps",
              "Victim Support, Band Aid, media, residents & visitors",
            ],
            min: 3,
          },
          {
            answer: [
              "No single agency can be responsible for a safe destination, plan or react alone to visitor incidents — every network of service providers has a role to play, so a practical partnership approach is required.",
              "Co-ordination and communication is the single most important aspect in the Safety and Security Plan — in other words, an alignment that really works between all the parties.",
              "Solid relations ensure that once incidents are reported to the dedicated response mechanisms, the relevant Cape Town Tourism Manager can be contacted to ensure immediate activation of the Victim Support Programme.",
            ],
            concepts: [
              ["no single agency", "partnership", "partnership approach"],
              ["co-ordination", "coordination", "communication"],
              ["alignment", "align"],
              ["react", "respond", "response"],
              ["trust", "role players", "role to play"],
            ],
            labels: [
              "No single agency can do it alone",
              "Co-ordination and communication",
              "Alignment that really works",
              "Fast, joined-up response to incidents",
              "Every role player has a part to play",
            ],
            min: 2,
          },
          {
            answer: [
              "A safe and secure environment for residents and visitors — the article says safety and security seriously impacts the functioning, sustainability and future growth of the Western Cape tourism industry.",
              "Effective communication with the Provincial Tourism Safety and Security Unit, the Tourism Victim Support programme, SAPS, emergency services, media and other key role players.",
              "Capacity to react quickly and effectively to visitor-related incidents, and immediate activation of the Victim Support Programme when incidents are reported.",
              "Awareness and communication campaigns, joint monitoring of emergency response times, identification of hotspots and quantifying the success of the plan.",
            ],
            concepts: [
              ["safe", "secure", "safety"],
              ["communication", "communicate"],
              ["react", "respond", "response"],
              ["victim support", "band aid"],
              ["awareness", "campaign"],
              ["monitor", "hotspot", "success"],
            ],
            labels: [
              "A safe and secure environment",
              "Effective communication with partners",
              "Fast response to visitor incidents",
              "Working Victim Support / Band Aid programme",
              "Awareness and communication campaigns",
              "Monitoring response times and hotspots",
            ],
            min: 3,
          },
          {
            answer: [
              "Awareness and communication campaigns, including distribution of practical safety tips to visitors and residents.",
              "Providing and assisting the media in obtaining correct and factual information about the Safety & Security Plan.",
              "Established and dedicated response mechanisms — telephone numbers such as 10111 for safety and security incidents, 10177 for Ambulance & Fire, 107 for other emergency services, and 0800 007 081 for consumer complaints.",
              "Structured forums for ongoing dialogue: the integrated Cape Town Safety Forum, Local Safety Forums throughout the Metropole, the Provincial and National safety forums, and the Cape Town Tourism Members Safety Forum.",
            ],
            concepts: [
              ["awareness", "campaign"],
              ["media"],
              ["response mechanism", "10111", "10177", "107", "0800", "hotline", "emergency number"],
              ["forum", "forums"],
              ["safety tips", "practical"],
            ],
            labels: [
              "Awareness campaigns",
              "Media briefings with factual info",
              "Dedicated emergency numbers",
              "Safety forums (provincial, city, members)",
              "Practical safety tips to visitors",
            ],
            min: 3,
          },
          {
            answer: [
              "By participating in and integrating with the Provincial and National safety forums, Local Safety Forums throughout the Metropole, and the Cape Town Tourism Members Safety Forum — established venues for open discussion.",
              "By actively participating in and feeding into the Cape Town and Provincial Safety and Security Forums through the Cape Town Tourism Membership Forum.",
              "By insisting on co-ordination and communication as the single most important aspect of the plan — an alignment that really works — so that every role player, from the citizen to the police, works together.",
              "By ongoing, year-round proactive and reactive programmes, and by using dedicated response mechanisms so that everyone knows how to raise a concern and be heard.",
            ],
            concepts: [
              ["forum", "forums"],
              ["participate", "participation", "feed into"],
              ["co-ordination", "coordination", "communication"],
              ["alignment"],
              ["ongoing", "year-round", "proactive", "reactive"],
              ["dedicated response", "10111", "10177", "107", "0800"],
            ],
            labels: [
              "Safety forums for open discussion",
              "Membership Forum feeds into provincial forums",
              "Co-ordination and communication",
              "Alignment that really works",
              "Ongoing proactive and reactive programmes",
              "Dedicated response mechanisms",
            ],
            min: 3,
          },
          {
            answer: [
              "The image of Cape Town — and the tourism industry it depends on — cannot afford to be tarnished; broken commitments would damage the destination brand.",
              "The city desperately relies on tourism as a vehicle to spread economic benefits to all its people and as a means of improving living standards by creating sustainable employment opportunities.",
              "Honouring commitments builds and maintains the trust between the stakeholders — Cape Town Tourism, government, SAPS, emergency services and community — that lets the partnership react quickly and effectively when incidents happen.",
              "If commitments are not met, communication breaks down between the parties — and, as the introduction warns, a breakdown in communication leads directly to a breakdown in the organisation as a whole.",
            ],
            concepts: [
              ["image", "tarnish", "brand", "reputation"],
              ["economy", "economic", "jobs", "employment", "living standards", "tourism"],
              ["trust", "reliance", "partnership"],
              ["breakdown", "communication"],
              ["safe", "safety", "security", "protect"],
            ],
            labels: [
              "Protecting the destination image",
              "Economic benefit and jobs depend on it",
              "Trust between the partners",
              "Prevents communication breakdown",
              "Keeps residents and visitors safe",
            ],
            min: 3,
          },
        ],
      },
    ],
    assignments: [],

    logbook: {
      assignmentTitle: "Assignment Two",
      programme: "Information Technology — Systems Support",
      unitLabel: "10135 — Work as a project team member",
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
        text: "Write a report on what contributions you and your fellow team members can make to build working relationships. Think about possible ideas and conventions which you could use. Attach your project here and mark it 10135 A.",
        resource: "Logbook",
      },
      knowledgeQuestions: [
        { text: "Criteria for working as a member of a team are identified and explained.", marks: [true, false, false, true, false, false] },
        { text: "Behaviours conducive to working as a member of a team are identified and explained.", marks: [true, false, false, true, false, false] },
        { text: "Team dynamics are identified and explained.", marks: [true, false, false, true, false, false] },
        { text: "The importance of building relations between team members and stakeholders is explained.", marks: [true, false, false, true, false, false] },
        { text: "Stakeholders are identified and their needs explained.", marks: [true, false, false, true, false, false] },
        { text: "The needs and objectives of team members are identified and explained.", marks: [true, false, false, true, false, false] },
        { text: "Methods and techniques for building team coherence and spirit are identified and explained.", marks: [true, false, false, true, false, false] },
        { text: "The importance of showing respect is explained.", marks: [true, false, false, true, false, false] },
      ],
      practicalActivities: [
        { text: "Team members are given sufficient support for them to achieve their work / project objectives.", marks: [false, true, false, false, true, false] },
        { text: "Team members are consulted with.", marks: [false, true, false, false, true, false] },
        { text: "Authority levels of all team members are identified and applied.", marks: [false, true, false, false, true, false] },
        { text: "Collaboration reflects the needs of all team members.", marks: [false, true, false, false, true, false] },
        { text: "Communications with stakeholders encourages open and frank discussions.", marks: [false, true, false, false, true, false] },
        { text: "Commitments to stakeholders are honoured and met.", marks: [false, true, false, false, true, false] },
        { text: "Team member actions are conducive to team coherence, spirit and image.", marks: [false, true, false, false, true, false] },
        { text: "Trust and support of colleagues is gained through applicable behaviours.", marks: [false, true, true, false, true, true] },
        { text: "Feedback is provided which leads to constructive working relationships.", marks: [false, true, false, false, true, false] },
        { text: "Differences between team members are identified and acknowledged.", marks: [false, true, false, false, true, false] },
        { text: "Team members are treated in ways which that demonstrate respect for individuals.", marks: [false, true, false, false, true, false] },
        { text: "Behaviours, which are of concern to individuals, are discussed promptly and openly with those concerned.", marks: [false, true, false, false, true, false] },
      ],
      workplaceActivities: [
        "Team members are given sufficient support for them to achieve their work / project objectives. Team members are consulted with.",
        "Authority levels of all team members are identified and applied. Collaboration reflects the needs of all team members.",
        "Communications with stakeholders encourages open and frank discussions. Commitments to stakeholders are honoured and met.",
        "Team member actions are conducive to team coherence, spirit and image. Trust and support of colleagues is gained through applicable behaviours.",
        "Feedback is provided which leads to constructive working relationships. Differences between team members are identified and acknowledged.",
        "Team members are treated in ways which that demonstrate respect for individuals. Behaviours, which are of concern to individuals, are discussed promptly and openly with those concerned.",
      ],
      workplaceEvidenceNote: "The workplace completes this section after observing the learner having complied to and completed all the activities as mentioned below.",
      otherActivities: [
        {
          activity: "Contribute to building relations between team members and stakeholders.",
          evidence: "Project — Report: Write a report on what contributions you and your fellow team members can make to build working relationships. Think about possible ideas and conventions which you could use. Attach your project here and mark it 10135 A.",
        },
      ],
      otherEvidenceNote: "Learner evidence and experience is recorded here. Make reference to equipment, chemicals and materials that were used in these processes.",
      projectChecklist: [{ no: "4", name: "10135 A" }],
    },

    selfAssessment: {
      intro: [
        "You are now ready to go through a check list. Be honest with yourself.",
        "Tick the box with either a \u221A or an X to indicate your response.",
      ],
      items: [
        "I am able to demonstrate an understanding of criteria for working as a member of a team.",
        "I am able to explain reasons why working autonomously and collaborating with other team members are important.",
        "I am able to contribute to building relationships between team members and stakeholders.",
        "I am able to make a positive contribution to team coherence, image and spirit.",
        "I am able to explain the importance of respect for personal, ethical, religious and cultural differences to enhance interaction between team members.",
      ],
      outro: [
        "You must think about any point you could not tick. Write this down as a goal.",
        "Decide on a plan of action to achieve these goals. Regularly review these goals.",
      ],
    },

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
        { icon: "clock", label: "Time", value: "09:00 \u2013 14:00 · lunch 12:00 \u2013 13:00" },
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
              time: "15 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "60 minutes",
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
              "Add more RAM (memory) so the operating system does not run out of working memory.",
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
              "A laser printer (a networked office laser or multifunction printer) is the right choice for this workload.",
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
        { icon: "clock", label: "Time", value: "09:00 – 14:00 (both days) · lunch 12:00 – 13:00" },
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
              time: "10 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "35 minutes",
              title: "Inside the case: motherboard, CPU, RAM — Facilitator & Class (hands-on)",
              bullets: [
                "Open the demo PC live: identify every part of section 5 on the real board.",
                "Seat and re-seat a CPU and RAM module; show thermal paste and the CMOS battery.",
                "Section 6: the desk-vs-filing-cabinet analogy; DDR generations on real DIMMs.",
              ],
              resources: ["Lesson sections 5–6", "Demo PC", "Demo box"],
            },
            {
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "30 minutes",
              title: "Storage, ports and cables — Class in pairs (hands-on)",
              bullets: [
                "Section 7 with the opened HDD vs SSD vs M.2 in hand; RAID on the whiteboard; the 3-2-1 backup rule.",
                "Section 8 as a port-identification race: pairs name every connector in the cable pile, then check against the lesson tables.",
              ],
              resources: ["Lesson sections 7–8", "Cable pile"],
            },
            {
              time: "10 minutes",
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
              time: "20 minutes",
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
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "15 minutes",
              title: "Software, licensing & the boot process — Facilitator & Class",
              bullets: [
                "Section 14: the software stack, the OS family, patching discipline, licence types (and the ethics of piracy).",
                "Section 15: boot a machine live and narrate POST → UEFI → bootloader → OS; map the where-it-stops troubleshooting table.",
              ],
              resources: ["Lesson sections 14–15", "Demo PC"],
            },
            {
              time: "20 minutes",
              title: "Exercises 1 & 2 — Class in pairs",
              bullets: [
                "Pairs complete both exercises in the app; facilitator circulates and takes feedback from two pairs per exercise.",
              ],
              resources: ["Exercises tab"],
            },
            {
              time: "10 minutes",
              title: "Quiz 2 & Self-Assessment — Learners individually",
              bullets: [
                "Learners complete Quiz 2 (Day 2 content) and judge their own competence; identify learners needing support.",
              ],
              resources: ["Quiz tab: Quiz 2"],
            },
            {
              time: "5 minutes",
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
                "Thank the learners and confirm the next session (US 114055, Friday 14 August).",
              ],
            },
          ],
        },
      ],
    },
  },

  /* ================================================================
     US 114050 — Explain the principles of business and the role of
     information technology
     NQF 5 · 4 credits
     ================================================================ */
  "114050": {
    lesson: [
      {
        heading: "Principles of business and the role of information technology — introduction",
        icon: "presenter",
        flat: true,
        lessonStart: { n: 1, title: "Explain the principles of business and the role of information technology" },
        paragraphs: [
          "Time: 90 minutes · Activity: Self & Group.",
          "Unit Standard 114050 — Explain the principles of business and the role of information technology. In this lesson you will be assessed against these specific outcomes and related assessment criteria: the description distinguishes types of business organisations (Sole trader, Partnership, Limited Co, Private Co, Public Ltd Company); the description outlines the common objectives within which businesses operate (Buying & Selling activity, Profit, Charity, Social Clubs); and the description outlines the environment within which businesses operate.",
          "Let's take a closer look at the different types of businesses there are, from which you must choose for your own setup.",
          "Forms of Enterprises: Sole Proprietor · Partnership · Closed Corporation · Company.",
        ],
        slideQuiz: [
          {
            q: "Which of these is NOT one of the four forms of enterprise covered in this lesson?",
            options: ["Sole Proprietor", "Partnership", "Closed Corporation", "Stokvel"],
            answer: 3,
            explain: "The four forms of enterprise are the Sole Proprietor, Partnership, Closed Corporation and Company.",
          },
          {
            q: "Which are common objectives within which businesses operate?",
            options: [
              "Buying & selling activity, profit, charity and social clubs",
              "Maximum profit, dividends and directors' bonuses only",
              "Charity work and community fund-raising events only",
              "Avoiding all risk and never entering new markets",
            ],
            answer: 0,
            explain: "The assessment criteria list buying & selling activity, profit, charity and social clubs as common objectives within which businesses operate.",
          },
          {
            q: "Which types of business organisations must your description distinguish?",
            options: [
              "Sole trader, Partnership, Limited Co, Private Co, Public Ltd Company",
              "Companies, trusts and government departments only",
              "Sole traders and informal traders working alone",
              "Government departments, municipalities and parastatals",
            ],
            answer: 0,
            explain: "The assessment criterion requires distinguishing the sole trader, partnership, limited company, private company and public limited company.",
          },
          {
            q: "How long is this lesson and what activity type is it?",
            options: ["90 minutes · Self & Group", "30 minutes · Written exam", "3 hours · Homework tasks", "15 minutes · Demonstration"],
            answer: 0,
            explain: "Time: 90 minutes · Activity: Self & Group.",
          },
          {
            q: "Besides organisation types and objectives, what else must the description outline?",
            options: [
              "The environment within which businesses operate",
              "The tax tables",
              "The staff payroll",
              "The company's logo, colours and other branding decisions",
            ],
            answer: 0,
            explain: "The third assessment criterion: the description outlines the environment within which businesses operate.",
          },
        ],
      },
      {
        heading: "The company (Pty Ltd) — private vs public",
        icon: "briefcase",
        flat: true,
        paragraphs: [
          "The company (which functions under Act 61 of 1973, as amended) may be considered as a more advanced form of ownership that eliminates the disadvantages of the sole proprietorship, partnership and close corporation, especially regarding unlimited liability and the possibilities to acquire capital.",
          "In South Africa two types of profit-seeking companies are found, namely the private and the public company. The most important differences between these two business forms are briefly summarised below:",
        ],
        table: {
          headers: ["", "Private Company", "Public Company"],
          rows: [
            ["Number of members (shareholders)", "Between one and 50", "At least seven"],
            ["Directors", "At least one", "At least two"],
            ["Shares", "May not be offered to the general public", "May be offered to the general public"],
            ["Transferability of shares", "Limited, may occur only with the consent of the board of directors", "Freely transferable"],
            ["Name", "Ends with: (Pty.) Ltd. or Proprietary (Limited)", "Ends with: Ltd. or Limited"],
            ["Legal requirements and limitations", "Subject to less requirements and limitations", "Subject to numerous requirements and limitations"],
          ],
        },
        figures: [
          {
            id: "114050-pty-ltd-sign",
            caption: "A (Pty) Ltd sign — the naming that marks a South African private company",
            hint: "Photo or illustration of a '(Pty) Ltd' company sign",
          },
        ],
        slideQuiz: [
          {
            q: "Under which Act does the company function?",
            options: ["Act 61 of 1973, as amended", "Act 108 of 1996", "Act 71 of 2008 only", "The Closed Corporations Act"],
            answer: 0,
            explain: "The company functions under Act 61 of 1973, as amended.",
          },
          {
            q: "How many members (shareholders) may a private company have?",
            options: ["Between one and 50", "At least seven", "No more than ten", "Unlimited"],
            answer: 0,
            explain: "A private company has between one and 50 members; a public company has at least seven.",
          },
          {
            q: "Which is TRUE of a public company's shares?",
            options: [
              "They may be offered to the general public and are freely transferable",
              "They may not be offered to members of the general public",
              "Transfers always need the board of directors' consent",
              "They do not exist — public companies have no shares",
            ],
            answer: 0,
            explain: "Public company shares may be offered to the general public and are freely transferable; private company shares are limited and need board consent.",
          },
          {
            q: "A private company's name ends with…",
            options: ["(Pty.) Ltd. or Proprietary (Limited)", "Ltd. or Limited on its own", "CC, for closed corporation", "Inc. or Incorporated"],
            answer: 0,
            explain: "Private companies end with (Pty.) Ltd. or Proprietary (Limited); public companies end with Ltd. or Limited.",
          },
          {
            q: "The company form eliminates which disadvantages of the other business forms?",
            options: [
              "Unlimited liability and the possibilities to acquire capital",
              "Having to pay tax and submit annual returns",
              "Needing customers and suppliers to trade with",
              "Needing employees and managers to run the business",
            ],
            answer: 0,
            explain: "The company is a more advanced form of ownership that eliminates the disadvantages of the sole proprietorship, partnership and close corporation, especially regarding unlimited liability and the possibilities to acquire capital.",
          },
        ],
      },
      {
        heading: "Closed corporations (CC)",
        icon: "people",
        flat: true,
        paragraphs: [
          "This type of business provides a simple, flexible, inexpensive and legal business structure for up to ten natural persons involved in business together.",
          "A closed corporation may not have more than ten members and must be registered with the Registrar of Closed Corporations in Pretoria.",
          "A closed corporation is seen as a legal person who can enter into contracts, operate a bank account, own property, sue or be sued in court.",
          "Certain registration and formation formalities as laid down in the Closed Corporations Act need to be completed before it is recognised. A closed corporation continues to exist until it is wound up or deregistered in terms of the Act.",
          "A closed corporation is formed and owned by its members, but it exists independently of them. Therefore, it continues to be a legal person even if membership changes or if all the members die. Its establishment, existence or termination can be done only by law, in terms of the Act.",
          "A closed corporation is owned and managed by its members; each has an interest (a percentage) in the business and this must always add up to 100 percent. A company, corporation or trust may not be a member of a closed corporation.",
        ],
        slideQuiz: [
          {
            q: "What is the maximum number of members a closed corporation may have?",
            options: ["Ten", "Twenty", "Fifty", "Seven"],
            answer: 0,
            explain: "A closed corporation may not have more than ten members and must be registered with the Registrar of Closed Corporations in Pretoria.",
          },
          {
            q: "Which statement about a CC is TRUE?",
            options: [
              "It is a legal person that can contract, bank, own property and sue or be sued",
              "It automatically dies the moment any one of its members dies",
              "A company, corporation or trust may become one of its members",
              "Members' interests may add up to any total the members choose",
            ],
            answer: 0,
            explain: "A CC is a legal person, exists independently of its members, may not have a company/corporation/trust as a member, and members' interests must always add up to 100 percent.",
          },
          {
            q: "Where must a closed corporation be registered?",
            options: [
              "With the Registrar of Closed Corporations in Pretoria",
              "At the local municipality where it will trade",
              "With SARS only, when it registers for income tax",
              "No registration is needed for a closed corporation",
            ],
            answer: 0,
            explain: "A closed corporation must be registered with the Registrar of Closed Corporations in Pretoria.",
          },
          {
            q: "What must the members' interests in a CC always add up to?",
            options: ["100 percent", "51 percent", "Ten shares", "Any amount"],
            answer: 0,
            explain: "Each member has an interest (a percentage) in the business and this must always add up to 100 percent.",
          },
          {
            q: "What happens to a CC if all its members die?",
            options: [
              "It continues to be a legal person — only law, in terms of the Act, can terminate it",
              "It automatically dissolves and its property goes to the heirs",
              "It becomes a partnership between the deceased members' families",
              "The state takes ownership of the corporation and its assets",
            ],
            answer: 0,
            explain: "A CC exists independently of its members — it continues even if membership changes or all the members die; establishment, existence or termination can be done only by law in terms of the Act.",
          },
        ],
      },
      {
        heading: "Partnerships",
        icon: "people",
        flat: true,
        paragraphs: [
          "This is a particular type of business association concluded between people who intend making and sharing profits.",
          "A partnership is not a legal person. The rights, duties and liabilities of a partnership bind the individual partners. In case of insolvency, a partnership estate may be sequestrated as it is then recognised as having a separate existence. If a partnership is sequestrated due to insolvency, the estates of all the partners are simultaneously sequestrated.",
          "Partnerships have a minimum of two and a maximum of 20 partners. However, certain professional partnerships may have more partners.",
          "A partnership is managed according to the agreement between the partners. Each partner is an agent of the partnership and thereby binds all other partners. Partners are jointly and severally liable for partnership debts.",
          "If you enter a partnership, it is always advisable to have a properly worded agreement drawn up by an attorney and signed by yourself and your partner. Among other things, the agreement should stipulate the action that needs to be taken if one of the partners should die or if the partnership should be dissolved.",
        ],
        slideQuiz: [
          {
            q: "How many partners may a partnership have?",
            options: [
              "A minimum of two and a maximum of 20 (certain professional partnerships may have more)",
              "A minimum of one and a maximum of ten natural persons",
              "At least seven members and at least two directors",
              "An unlimited number of partners in all cases",
            ],
            answer: 0,
            explain: "Partnerships have a minimum of two and a maximum of 20 partners, though certain professional partnerships may have more.",
          },
          {
            q: "Which is TRUE of partners' liability?",
            options: [
              "Partners are jointly and severally liable for partnership debts",
              "Only the senior partner is liable",
              "The partnership is a legal person so no partner is liable",
              "Liability is limited to each partner's contribution",
            ],
            answer: 0,
            explain: "A partnership is not a legal person — each partner is an agent of the partnership and partners are jointly and severally liable for its debts.",
          },
          {
            q: "Is a partnership a legal person?",
            options: [
              "No — the rights, duties and liabilities of a partnership bind the individual partners",
              "Yes — a partnership is always a legal person on its own",
              "Only if it has the full maximum of 20 partners",
              "Only once it has been registered with the Registrar in Pretoria",
            ],
            answer: 0,
            explain: "A partnership is not a legal person; its rights, duties and liabilities bind the individual partners.",
          },
          {
            q: "What should a properly worded partnership agreement stipulate, among other things?",
            options: [
              "The action to be taken if a partner dies or the partnership is dissolved",
              "The colour scheme and furnishing of the partnership's offices",
              "The names of the partners' favourite suppliers and customers",
              "Nothing — verbal agreements are best for partnerships",
            ],
            answer: 0,
            explain: "It is advisable to have an agreement drawn up by an attorney and signed — it should stipulate the action needed if a partner dies or the partnership is dissolved.",
          },
          {
            q: "Each partner acts as what for the partnership?",
            options: [
              "An agent — thereby binding all other partners",
              "A silent observer with no authority",
              "A shareholder with no liability for its debts",
              "An employee only, with no power to bind it",
            ],
            answer: 0,
            explain: "Each partner is an agent of the partnership and thereby binds all other partners.",
          },
        ],
      },
      {
        heading: "Sole proprietor — and researching the need for your business",
        icon: "person",
        flat: true,
        paragraphs: [
          "Only one person owns this type of business; there are no partners or co-owners. In this form of business there is no need for formal registration, administration or termination; no statutes regulate sole owners and no documentation needs registering. You do not necessarily have to carry on business alone and may employ people to manage or help you run the business. If your business becomes insolvent, it means that you will personally become insolvent.",
          "You will need to assess and research the need for this type of business in the area. In order to do this, you will have to take the following into account:",
        ],
        bullets: [
          "Your skills — can you do it or do you need help to successfully achieve it?",
          "Your interests — will you enjoy doing this type of business and the hours that come with it?",
          "Your other commitments — family, friends, other job or any other item that requires your attention away from this.",
          "Is there a market for the business? There must be a need for that type of business for it to be able to succeed.",
          "Who is the market? Who are your clients going to be — businesses or private individuals?",
          "How big is the market? Do you need to be able to produce in masses or can you take orders and produce on order?",
          "Who will your competition be? Are they close to your prospective location or not?",
          "Is the market you would like to enter still growing or is it stagnant? Are there other companies of similar nature? Are they growing or closing?",
          "Where will you open your business? Will it be in an office block or do you need retail space?",
          "What are the capital requirements of your business? How much do you need to open your business and operate it, until there is enough to provide for all the debts?",
          "How big must the business be to be successful — not too big (costing too much) or too small (will not have the capability to complete all the work)?",
          "What will the working hours be? Long working hours will require additional (overtime) pay; shorter working hours can affect productivity.",
          "How many people will be employed? Employing 10 if you need 20 can cause a delay in your delivery time to your clients, seen as bad service; vice versa, if you have 20 and only need 10, then you will be paying for staff that you do not need.",
          "What is the risk? How many other companies offer the same as you? Are they flourishing or closing down? Do you have existing clients? Can you afford to lose what you put into the company?",
          "Can the business operate from home? This will save on costs as well as travelling and many other expenses.",
        ],
        slideQuiz: [
          {
            q: "What happens if a sole proprietor's business becomes insolvent?",
            options: [
              "The owner personally becomes insolvent",
              "Only the business assets are lost",
              "The Registrar winds it up",
              "The shareholders absorb the loss",
            ],
            answer: 0,
            explain: "A sole proprietorship is not separate from its owner — if the business becomes insolvent, you personally become insolvent.",
          },
          {
            q: "Which of these is part of researching the need for a business?",
            options: [
              "Your skills, the market, the competition and the capital requirements",
              "Only the business name and how it will be advertised",
              "Only the logo design and the colours of the brand",
              "Only the working hours the owner prefers to keep",
            ],
            answer: 0,
            explain: "The research checklist covers your skills, interests, commitments, the market and its size, competition, location, capital requirements, business size, working hours, staffing, risk and whether the business can operate from home.",
          },
          {
            q: "Does a sole proprietorship require formal registration?",
            options: [
              "No — no statutes regulate sole owners and no documentation needs registering",
              "Yes — with the Registrar of Closed Corporations in Pretoria",
              "Yes — and it must have at least seven registered members",
              "Only once it starts employing staff to help run it",
            ],
            answer: 0,
            explain: "There is no need for formal registration, administration or termination — no statutes regulate sole owners and no documentation needs registering.",
          },
          {
            q: "May a sole proprietor employ other people?",
            options: [
              "Yes — you may employ people to manage or help you run the business",
              "No — a sole proprietor must always work completely alone",
              "Only family members may be employed in the business",
              "Only one assistant may be employed at any time",
            ],
            answer: 0,
            explain: "You do not necessarily have to carry on business alone and may employ people to manage or help you run the business.",
          },
          {
            q: "Why does the size of the market matter to your research?",
            options: [
              "It decides whether you must produce in masses or can take orders and produce on order",
              "It sets the tax rate the business will have to pay",
              "It determines the name the business must trade under",
              "It fixes the working hours the business must keep",
            ],
            answer: 0,
            explain: "How big is the market? Do you need to be able to produce in masses or can you take orders and produce on order?",
          },
        ],
      },
      {
        heading: "Choosing an idea — new, existing or franchised",
        icon: "design",
        flat: true,
        paragraphs: [
          "You may have a few ideas for a business that you would like to start. Taking the above criteria and rating them on a scale of 1–10, for each of the business ideas you have, will give you a better understanding of which business to start with at first.",
          "Another factor you may want to consider is the purchase of an existing business. The advantages being that the business is an ongoing concern and revenue would come in from day one. In addition, there is already a customer and supplier base; you would not have to hunt for premises or equipment. Bear in mind, however, that you will also be paying for goodwill and there may be unseen flaws.",
          "You could also decide upon opening a franchised business. This is a type of in-between business, from the two mentioned above. It is a new business — yes, you will be the first owner of the business — but it is also a known business (brand), so it is also an ongoing concern. Franchising is becoming very popular in South Africa; it can be explained as a marriage between a big business and a small business. The franchisor is usually a person or company with a highly marketable product or service. The franchisee is a person or company who is licensed by the franchisor to perform the marketing function and who provides most of the capital required for this purpose. The franchisor achieves rapid expansion at relatively low cost to him.",
          "The franchisee sets up a business with a good (already successful) product or service and obtains a number of big-business purchasing and advertising advantages. The relatively small size of the franchisee's business provides small-business advantages such as personal dedication and commitment and is therefore particularly suited to service-type businesses. Franchising has provided numerous opportunities for individuals to set up a business at relatively low risk. In South Africa today, franchising probably represents one of the best opportunities for aspiring entrepreneurs. According to the South African Franchise Association, franchising is about to explode in South Africa.",
        ],
        figures: [
          {
            id: "114050-existing-business",
            caption: "Buying an existing business — trading, customers and suppliers from day one",
            hint: "Photo of a small trading business (e.g. a milkshake bar / café)",
          },
        ],
        slideQuiz: [
          {
            q: "What is an advantage of buying an existing business?",
            options: [
              "It is an ongoing concern — revenue from day one, with an existing customer and supplier base",
              "It never has flaws, because the previous owner fixed them",
              "You never pay for goodwill when buying an ongoing concern",
              "It requires no capital because revenue starts on day one",
            ],
            answer: 0,
            explain: "An existing business trades from day one with customers, suppliers, premises and equipment in place — but you pay for goodwill and there may be unseen flaws.",
          },
          {
            q: "In franchising, who provides most of the capital and performs the marketing function?",
            options: ["The franchisee", "The franchisor", "The Registrar", "The bank"],
            answer: 0,
            explain: "The franchisee is licensed by the franchisor to perform the marketing function and provides most of the capital; the franchisor achieves rapid expansion at relatively low cost.",
          },
          {
            q: "How should you compare several business ideas before choosing one?",
            options: [
              "Rate each idea against the research criteria on a scale of 1–10",
              "Pick the idea that needs the least capital to start",
              "Pick the idea with the most memorable business name",
              "Toss a coin — every idea carries the same risk",
            ],
            answer: 0,
            explain: "Taking the criteria and rating them on a scale of 1–10 for each business idea gives you a better understanding of which business to start with first.",
          },
          {
            q: "What must you bear in mind when buying an existing business?",
            options: [
              "You will also be paying for goodwill and there may be unseen flaws",
              "It never has customers of its own when you take over",
              "Revenue only starts flowing after the first full year",
              "You must always rebuild the premises before trading",
            ],
            answer: 0,
            explain: "The business is an ongoing concern with revenue from day one — but you also pay for goodwill and there may be unseen flaws.",
          },
          {
            q: "According to the South African Franchise Association, what is about to happen in South Africa?",
            options: [
              "Franchising is about to explode",
              "Franchising is being banned",
              "All franchises are closing",
              "Franchise fees are being abolished",
            ],
            answer: 0,
            explain: "Franchising probably represents one of the best opportunities for aspiring entrepreneurs — according to the South African Franchise Association, franchising is about to explode in South Africa.",
          },
        ],
      },
      {
        heading: "Franchising — advantages, disadvantages and what you need",
        icon: "award",
        flat: true,
        paragraphs: ["Advantages of franchising:"],
        bullets: [
          "The chances of success are far greater because the franchisor can provide goods (or services) to the franchisee more cheaply than in the case of an independent business.",
          "The franchisor obtains bigger discounts by buying in bulk for his outlets.",
          "The franchisee sets up a business with a product or service which has an existing or acceptable image.",
          "Customers know the business, even if the outlet is new.",
          "An accepted image (brand) often takes years to build up, while a franchise business has this image (brand) from the start.",
          "Most franchisors offer franchisees a complete package which includes an operations manual, an accounting system, marketing assistance (including advertising and promotional aids), assistance with the design of the outlet as well as staff selection and training.",
          "Franchisees can look to the franchisor for management advice on an ongoing basis, because it is in the franchisor's own interest to ensure the success of every franchised outlet.",
        ],
        cards: [
          {
            icon: "info",
            title: "Disadvantages of franchising",
            text: "The franchisee normally enjoys selling rights which are restricted to a particular area only. Franchising demands strict controls by the franchisor in order to maintain uniform quality standards and cleanliness. Disadvantages may develop if the franchisee becomes too dependent on the franchisor. It does cost money to buy a franchise; initial franchise fees as well as ongoing royalty fees are charged.",
          },
          {
            icon: "checklist",
            title: "What do you need to be a franchisee?",
            text: "You must possess the qualities of a successful entrepreneur. Do a thorough investigation of the franchisor whose product or service interests you. Research the franchisor's track record with other franchisees and outlets, and the growth of the industry from within which the franchisor operates. Contact existing franchisees to find out how satisfied they are with the business. Establish what training will be provided. Get an attorney to scrutinise the franchise agreement form. The legal and financial aspects of the franchise business are important considerations and should be clearly defined and fair to both parties. Loans from financial institutions are more readily available to franchise businesses because of the reduced risk factor.",
          },
          {
            icon: "globe",
            title: "What are franchised businesses?",
            text: "Think of McDonald's, Steers, Spar and Shoprite. It is basically a business that has the same name and trades the same goods at more or less the same prices. The largest criteria for franchised outlets are that they must all look uniformly the same as well as sell the branded products which the franchisor suggests. More and more these products are being labelled as \u201chouse brands\u201d, which is a building tool for the franchise brand name. It gives the consumer the peace of mind that no matter where they are doing their purchases, they can be confident that they will receive the same quality from one outlet as they would from the next. This is the brand that consumers long for, which gives them confidence in the quality of the product they are buying.",
          },
        ],
        figures: [
          {
            id: "114050-franchise-mcdonalds",
            caption: "McDonald's, Sandton — a global franchise brand on a South African street",
            note: "Customers know the business even if the outlet is new — the accepted brand exists from the start.",
          },
          {
            id: "114050-franchise-spar",
            caption: "Spar, De Waterkant, Cape Town — every outlet looks uniformly the same",
            note: "The largest criterion for franchised outlets: a uniform look, selling the branded products the franchisor suggests.",
          },
          {
            id: "114050-franchise-shoprite",
            caption: "Shoprite, Zeerust — the same name and goods at more or less the same prices",
            note: "Bulk buying lets the franchisor supply outlets more cheaply than an independent business could source them.",
          },
          {
            id: "114050-franchise-kfc",
            caption: "KFC, Scottburgh, KwaZulu-Natal — one look and menu wherever you are",
            note: "Consumers get peace of mind: the same quality from one outlet as from the next.",
          },
          {
            id: "114050-franchise-nandos",
            caption: "Nando's, Canal Walk, Cape Town — a South African franchise that went global",
            note: "Founded in Johannesburg in 1987 — proof that a local franchise brand can expand worldwide.",
          },
          {
            id: "114050-franchise-wimpy",
            caption: "Wimpy, White River — family restaurant franchise in the same stable as Steers",
            note: "Famous Brands, the South African group behind Wimpy, Steers and Debonairs, franchises hundreds of outlets.",
          },
        ],
        slideQuiz: [
          {
            q: "Why are a franchisee's chances of success far greater?",
            options: [
              "The franchisor can provide goods or services more cheaply than an independent business could get them",
              "Franchises pay no initial fees and no ongoing royalties",
              "Franchises face no competition in their allocated areas",
              "Franchises need no staff because the franchisor provides them",
            ],
            answer: 0,
            explain: "Bulk buying lets the franchisor supply outlets more cheaply, and the franchisee starts with an accepted brand, a complete package and ongoing management advice.",
          },
          {
            q: "Which is a DISADVANTAGE of franchising?",
            options: [
              "Selling rights restricted to a particular area, strict controls, dependence and franchise/royalty fees",
              "Customers already know the business even when the outlet is new",
              "The brand and its image exist from the very first day of trading",
              "Training, marketing and outlet design help are all provided",
            ],
            answer: 0,
            explain: "Disadvantages: restricted selling rights, strict franchisor controls for uniform quality, possible over-dependence on the franchisor, plus initial franchise fees and ongoing royalties.",
          },
          {
            q: "What is the largest criterion for franchised outlets?",
            options: [
              "They must all look uniformly the same and sell the branded products the franchisor suggests",
              "Each outlet must look different to stand out in its own area",
              "Each outlet sets its own prices freely with no franchisor input",
              "Outlets may not advertise outside their allocated selling areas",
            ],
            answer: 0,
            explain: "Franchised outlets share the same name, look uniformly the same and trade the same goods at more or less the same prices — giving consumers confidence in consistent quality.",
          },
          {
            q: "What does the complete package most franchisors offer include?",
            options: [
              "An operations manual, accounting system, marketing assistance, outlet design help and staff selection and training",
              "Only a logo and the right to use the franchise name",
              "Only a bank loan to cover the initial franchise fees",
              "Only premises in a shopping centre chosen by the franchisor",
            ],
            answer: 0,
            explain: "Most franchisors offer a complete package: operations manual, accounting system, marketing assistance (advertising and promotional aids), outlet design assistance, and staff selection and training.",
          },
          {
            q: "Why can franchisees look to the franchisor for ongoing management advice?",
            options: [
              "Because it is in the franchisor's own interest to ensure the success of every franchised outlet",
              "Because franchise law forces them to support every outlet",
              "Because giving advice is free marketing for the franchisor",
              "They cannot — management advice is never provided to franchisees",
            ],
            answer: 0,
            explain: "Franchisees can look to the franchisor for management advice on an ongoing basis, because it is in the franchisor's own interest to ensure the success of every outlet.",
          },
        ],
      },
      {
        heading: "Aims, objectives and mission statements",
        icon: "target",
        flat: true,
        paragraphs: [
          "When a sole trader sets up they may have some unstated aims or objectives — for example to survive for the first year. Other businesses may wish to state exactly what they are aiming to do, such as Amazon, the Internet CD and bookseller, who wants to \u201cmake history and have fun\u201d.",
          "An aim is where the business wants to go in the future — its goals. It is a statement of purpose, e.g. we want to grow the business into Europe.",
          "Business objectives are the stated, measurable targets of how to achieve business aims. For instance: we want to achieve sales of €10 million in European markets in 2004.",
          "A mission statement sets out the business vision and values that enable employees, managers, customers and even suppliers to understand the underlying basis for the actions of the business.",
        ],
        slideQuiz: [
          {
            q: "What is an aim?",
            options: [
              "Where the business wants to go in the future — a statement of purpose",
              "A measurable sales target with a fixed deadline attached",
              "A legal registration document lodged with the Registrar",
              "A staff roster for the busiest months of the year",
            ],
            answer: 0,
            explain: "An aim is where the business wants to go in the future, its goals — e.g. \u201cwe want to grow the business into Europe.\u201d",
          },
          {
            q: "What are business objectives?",
            options: [
              "The stated, measurable targets of how to achieve business aims",
              "The company's values and the beliefs it stands for",
              "The founding documents lodged when it was registered",
              "The organisation chart showing who reports to whom",
            ],
            answer: 0,
            explain: "Objectives are measurable targets that deliver the aims — e.g. sales of €10 million in European markets in 2004.",
          },
          {
            q: "What does a mission statement do?",
            options: [
              "Sets out the vision and values so employees, managers, customers and suppliers understand the basis for the business's actions",
              "Lists the shareholders and the sizes of their shareholdings",
              "Replaces the business plan once the business starts trading",
              "Sets the tax rate the business must pay to the state",
            ],
            answer: 0,
            explain: "A mission statement sets out the business vision and values that explain the underlying basis for the actions of the business.",
          },
          {
            q: "What did Amazon, the Internet CD and bookseller, state it wants to do?",
            options: ["\u201cMake history and have fun\u201d", "\u201cSell the most books\u201d", "\u201cOpen 100 shops\u201d", "\u201cAvoid the internet\u201d"],
            answer: 0,
            explain: "Some businesses state exactly what they are aiming to do — Amazon wants to \u201cmake history and have fun\u201d.",
          },
          {
            q: "Who does a mission statement help to understand the basis for the business's actions?",
            options: [
              "Employees, managers, customers and even suppliers",
              "Only the CEO and the board of directors",
              "Only the shareholders who own the business",
              "Only the auditors checking the annual accounts",
            ],
            answer: 0,
            explain: "The mission statement enables employees, managers, customers and even suppliers to understand the underlying basis for the actions of the business.",
          },
        ],
      },
      {
        heading: "SMART objectives and the main objectives businesses pursue",
        icon: "checklist",
        flat: true,
        paragraphs: [
          "Objectives give the business a clearly defined target. Plans can then be made to achieve these targets. This can motivate the employees. It also enables the business to measure the progress towards its stated aims. The most effective business objectives meet the SMART criteria:",
        ],
        bullets: [
          "S — Specific: objectives are aimed at what the business does, e.g. a hotel might have an objective of filling 60% of its beds a night during October — an objective specific to that business.",
          "M — Measurable: the business can put a value to the objective, e.g. €10,000 in sales in the next half year of trading.",
          "A — Agreed by all those concerned in trying to achieve the objective.",
          "R — Realistic: the objective should be challenging, but it should also be achievable with the resources available.",
          "T — Time specific: they have a time limit of when the objective should be achieved, e.g. by the end of the year.",
        ],
        cards: [
          {
            icon: "shield",
            title: "Survival",
            text: "A short-term objective, probably for a small business just starting out, or when a new firm enters the market or at a time of crisis.",
          },
          {
            icon: "trend",
            title: "Profit maximisation",
            text: "Try to make the most profit possible — most likely to be the aim of the owners and shareholders.",
          },
          {
            icon: "checkCircle",
            title: "Profit satisfying",
            text: "Try to make enough profit to keep the owners comfortable — probably the aim of smaller businesses whose owners do not want to work longer hours.",
          },
          {
            icon: "chart",
            title: "Sales growth",
            text: "The business tries to make as many sales as possible. Managers may believe survival depends on being large, and large businesses can also benefit from economies of scale.",
          },
        ],
        example: {
          title: "When objectives conflict",
          lines: [
            "A business may find that some of its objectives conflict with one another:",
            "Growth versus profit — achieving higher sales in the short term (e.g. by cutting prices) will reduce short-term profit.",
            "Short-term versus long-term — a business may accept lower cash flows in the short term while it invests heavily in new products or plant and equipment.",
            "Large investors in the Stock Exchange are often accused of looking too much at short-term objectives and company performance rather than investing in a business for the long term.",
          ],
        },
        slideQuiz: [
          {
            q: "In SMART objectives, what does the R stand for?",
            options: [
              "Realistic — challenging but achievable with the resources available",
              "Rich — the objective must grow the owners' wealth",
              "Rapid — the objective must be reached quickly",
              "Recorded — the objective must be written down",
            ],
            answer: 0,
            explain: "SMART = Specific, Measurable, Agreed, Realistic, Time specific.",
          },
          {
            q: "Which objective aims to make enough profit to keep the owners comfortable?",
            options: ["Profit satisfying", "Profit maximisation", "Survival", "Sales growth"],
            answer: 0,
            explain: "Profit satisfying is making enough profit to keep the owners comfortable — typical of smaller businesses whose owners don't want longer hours.",
          },
          {
            q: "Cutting prices to grow sales in the short term is an example of which conflict?",
            options: [
              "Growth versus profit",
              "Ethics versus law",
              "Public versus private",
              "Franchisor versus franchisee",
            ],
            answer: 0,
            explain: "Higher short-term sales through price cuts reduce short-term profit — the growth-versus-profit conflict.",
          },
          {
            q: "A hotel aiming to fill 60% of its beds a night during October is an example of which SMART element?",
            options: ["Specific — aimed at what that business does", "Agreed — accepted by everyone involved", "Time specific only, with no other element", "None of the SMART elements at all"],
            answer: 0,
            explain: "S — Specific: objectives are aimed at what the business does, e.g. a hotel filling 60% of its beds a night during October.",
          },
          {
            q: "Why might a business accept lower cash flows in the short term?",
            options: [
              "While it invests heavily in new products or plant and equipment",
              "To upset the shareholders and drive its share price down",
              "To reduce the quality of its products and services",
              "Because cash flow objectives never matter to a business",
            ],
            answer: 0,
            explain: "Short-term versus long-term: a business may accept lower short-term cash flows while it invests heavily in new products or plant and equipment.",
          },
        ],
      },
      {
        heading: "Alternative aims and objectives — and why objectives change",
        icon: "globe",
        flat: true,
        paragraphs: [
          "Not all businesses seek profit or growth. Some organisations have alternative objectives.",
        ],
        cards: [
          {
            icon: "shield",
            title: "Ethical and socially responsible objectives",
            text: "Organisations like the Co-op or the Body Shop have objectives based on their beliefs about how one should treat the environment and people who are less fortunate.",
          },
          {
            icon: "briefcase",
            title: "Public sector corporations",
            text: "Run not only to generate a profit but to provide a service to the public — meeting the needs of the less well off or helping the economy function, e.g. a cheap and accessible transport service.",
          },
          {
            icon: "search",
            title: "Public sector organisations",
            text: "Those that monitor or control private sector activities have objectives to ensure that the businesses they are monitoring comply with the laws laid down.",
          },
          {
            icon: "gradcap",
            title: "Health care and education establishments",
            text: "Their objectives are to provide a service — most private schools, for instance, have charitable status. Their aim is the enhancement of their pupils through education.",
          },
          {
            icon: "people",
            title: "Charities and voluntary organisations",
            text: "Their aims and objectives are led by the beliefs they stand for.",
          },
        ],
        example: {
          title: "Changing objectives",
          lines: [
            "A business may change its objectives over time due to the following reasons:",
            "A business may achieve an objective and will need to move on to another one — e.g. survival in the first year may lead to an objective of increasing profit in the second year.",
            "The competitive environment might change, with the launch of new products from competitors.",
            "Technology might change product designs, so sales and production targets might need to change.",
          ],
        },
        slideQuiz: [
          {
            q: "Which organisations have objectives led by the beliefs they stand for?",
            options: [
              "Charities and voluntary organisations",
              "Public companies listed on the exchange",
              "Closed corporations and their members",
              "Franchisors and their franchisees",
            ],
            answer: 0,
            explain: "Charities and voluntary organisations are led by their beliefs; ethical businesses like the Co-op and Body Shop similarly act on beliefs about the environment and the less fortunate.",
          },
          {
            q: "Why do public sector corporations exist?",
            options: [
              "Not only to generate profit but to provide a service to the public",
              "Purely for profit maximisation on behalf of the state",
              "Only to monitor and control other private businesses",
              "To pay dividends to the government every year",
            ],
            answer: 0,
            explain: "Public sector corporations provide services the public needs — e.g. cheap, accessible transport — not just profit.",
          },
          {
            q: "Which is a reason a business might CHANGE its objectives?",
            options: [
              "An objective is achieved, competitors launch new products, or technology changes product designs",
              "Objectives may never change once they have been set",
              "Only a court order can ever change a business's objectives",
              "Only new shareholders may change a business's objectives",
            ],
            answer: 0,
            explain: "Objectives change when they are achieved (survival → profit), when the competitive environment shifts, or when technology changes designs and targets.",
          },
          {
            q: "The Co-op and the Body Shop are examples of organisations with…",
            options: [
              "Ethical and socially responsible objectives",
              "Profit maximisation objectives only",
              "No stated objectives of any kind",
              "Government mandates and regulations",
            ],
            answer: 0,
            explain: "Organisations like the Co-op or the Body Shop base their objectives on beliefs about how one should treat the environment and people who are less fortunate.",
          },
          {
            q: "Most private schools have which status, and what is their aim?",
            options: [
              "Charitable status — the enhancement of their pupils through education",
              "Public company status — paying dividends to shareholders",
              "Closed corporation status — maximising members' profit",
              "No official status at all — schools are unregulated",
            ],
            answer: 0,
            explain: "Health care and education establishments provide a service — most private schools have charitable status and aim to enhance their pupils through education.",
          },
        ],
      },
      {
        heading: "Systems theory and the business environment",
        icon: "layers",
        flat: true,
        lessonStart: { n: 2, title: "Describe systems theory with respect to information systems" },
        paragraphs: [
          "Welcome to Lesson 2: describe systems theory with respect to information systems. Time: 90 minutes · Activity: Self & Group.",
          "A manager is someone skilled in knowing how to analyse and improve the ability of an organisation to survive and grow in a complex and changing world. This means that managers have a set of tools that enable them to grasp the complexity of the organisation's environment.",
          "A management system describes the organisation and the set of significant interacting institutions and forces in the organisation's complex and rapidly changing environment that affect its ability to serve its customers. The firm must continuously monitor and adapt to the environment if it is to survive and prosper.",
          "Disturbances in the environment may spell profound threats or new opportunities for the firm. The successful firm will identify, appraise, and respond to the various opportunities and threats in its environment.",
        ],
        slideQuiz: [
          {
            q: "According to the lesson, what is a manager?",
            options: [
              "Someone skilled in analysing and improving the organisation's ability to survive and grow",
              "Someone appointed to hire and dismiss staff and negotiate their salaries",
              "Someone who owns the majority of the organisation's shares and collects its profits",
              "Someone who audits the organisation's accounts at the end of the financial year",
            ],
            answer: 0,
            explain: "Managers have a set of tools that enable them to grasp the complexity of the organisation's environment.",
          },
          {
            q: "What does a management system describe?",
            options: [
              "The organisation and the interacting forces that affect its ability to serve customers",
              "The payroll system and the schedule on which employees are paid",
              "The organisation chart showing who reports to whom in the business",
              "The tax rules and the legal returns the business must submit each year",
            ],
            answer: 0,
            explain: "A management system covers the organisation plus the significant interacting institutions and forces in its complex, rapidly changing environment.",
          },
          {
            q: "What must a firm do to survive and prosper?",
            options: [
              "Continuously monitor and adapt to its environment",
              "Ignore disturbances in the environment and focus only on internal operations",
              "Freeze all change until the environment becomes stable and predictable again",
              "Cut costs every year until it spends less than every competitor",
            ],
            answer: 0,
            explain: "The firm must continuously monitor and adapt to the environment if it is to survive and prosper.",
          },
          {
            q: "What can disturbances in the environment mean for a firm?",
            options: [
              "Profound threats or new opportunities",
              "Nothing — disturbances outside the firm cannot affect its performance",
              "Only threats — a disturbance never creates an opening for the firm",
              "Only opportunities — disturbances never put an established firm at risk",
            ],
            answer: 0,
            explain: "Disturbances may spell profound threats or new opportunities — the successful firm identifies, appraises and responds to both.",
          },
          {
            q: "What does the successful firm do about its environment?",
            options: [
              "Identifies, appraises and responds to the various opportunities and threats",
              "Waits for instructions from government before responding to any change",
              "Responds to threats but leaves the opportunities for its competitors",
              "Outsources environmental scanning and focuses on daily operations",
            ],
            answer: 0,
            explain: "Identify, appraise, respond — that is how the successful firm treats the opportunities and threats in its environment.",
          },
        ],
      },
      {
        heading: "The internal and external environment",
        icon: "globe",
        flat: true,
        paragraphs: [
          "The management system can be conceptualised on two levels. The first level involves the organisation's internal environment; the second involves its external environment.",
          "Internally, an organisation can be viewed as a resource conversion machine that takes inputs (labour, money, materials and equipment) from the external environment — the outside world — converts them into useful products, goods and services, and makes them available to customers as outputs.",
          "The external environment consists of all the outside institutions and forces that have an actual or potential interest or impact on the organisation's ability to achieve its objectives. Environmental forces create challenges and opportunities, and managers must react and adapt to changes in their internal and external environment:",
        ],
        bullets: [
          "Competitive and economic forces",
          "Technological, political and legal forces",
          "Demographic and cultural forces",
          "The ecosystem",
        ],
        example: {
          title: "Globalisation — an opportunity",
          lines: [
            "Improving technologies, such as transportation and communications, have enabled companies to expand into global or worldwide markets.",
            "Globalisation affects how organisations are managed — managers must learn to deal effectively with multiple cultures and political systems in the midst of rapidly changing markets and technology.",
            "They must anticipate this changing environment and develop the vision and competencies at all levels of their organisations to embrace this dynamic future.",
          ],
        },
        figures: [
          {
            id: "114050-environment-model",
            caption: "The organisation as a resource conversion machine amid its external forces",
            hint: "business environment diagram — inputs converted to outputs, surrounded by competitive, economic, technological, political, legal, demographic, cultural and ecosystem forces",
          },
        ],
        slideQuiz: [
          {
            q: "On which two levels can the management system be conceptualised?",
            options: [
              "The internal environment and the external environment",
              "The sales level and the marketing level of the commercial department",
              "The profit level and the loss level of the financial statements",
              "The head-office level and the branch level of the company structure",
            ],
            answer: 0,
            explain: "Level one is the organisation's internal environment; level two is its external environment.",
          },
          {
            q: "Viewed internally, an organisation is…",
            options: [
              "A resource conversion machine that turns inputs into useful outputs",
              "A collection of buildings, vehicles and equipment registered in its name",
              "A legal document lodged with the Registrar when the business was formed",
              "A bank account through which customer payments and salaries flow",
            ],
            answer: 0,
            explain: "Internally the organisation takes inputs from the outside world, converts them, and makes products, goods and services available as outputs.",
          },
          {
            q: "Which of these are INPUTS the organisation takes from the outside world?",
            options: [
              "Labour, money, materials and equipment",
              "Sunlight, water and the other natural resources around its premises",
              "Data and information only — physical resources are outputs",
              "Finished products, goods and services ready for its customers",
            ],
            answer: 0,
            explain: "The inputs are labour, money, materials and equipment — converted into useful products, goods and services.",
          },
          {
            q: "Which forces make up the external environment?",
            options: [
              "Competitive, economic, technological, political, legal, demographic, cultural and ecosystem forces",
              "The weather, the seasons, the tides and the physical climate immediately around its premises",
              "Only its direct competitors and the customers who buy from it each day",
              "Only the government, the laws it passes and the taxes it collects",
            ],
            answer: 0,
            explain: "All outside institutions and forces with an actual or potential interest or impact on the organisation's objectives.",
          },
          {
            q: "Globalisation is an example of…",
            options: [
              "An opportunity enabled by improving transportation and communications",
              "A threat with no upside for firms that already trade locally",
              "An internal input taken from the organisation's own resources",
              "A database structure used to organise records in related tables",
            ],
            answer: 0,
            explain: "Improving technologies let companies expand into worldwide markets — an opportunity that changes how organisations are managed.",
          },
        ],
      },
      {
        heading: "Types of information systems",
        icon: "dashboard",
        flat: true,
        paragraphs: [
          "Information systems serve different levels of the organisation. The diagram shows a typical pyramid hierarchy and the technology that is there to serve its needs — transaction processing at the base, knowledge work and management information in the middle, and decision and executive support at the top.",
          "The description distinguishes these types of information systems (any three):",
        ],
        cards: [
          {
            icon: "database",
            title: "Transaction Processing System (TPS)",
            text: "Collects, stores, modifies and retrieves the transactions of an organisation — the day-to-day events that generate or modify data.",
          },
          {
            icon: "design",
            title: "Knowledge Work System (KWS)",
            text: "Helps deal with problems requiring technical expertise or knowledge — word processing, spreadsheets, CAD, expert systems.",
          },
          {
            icon: "chart",
            title: "Management Information System (MIS)",
            text: "Converts data from internal and external sources into information managers use for planning, directing and controlling.",
          },
          {
            icon: "target",
            title: "Decision Support System (DSS)",
            text: "Supports \u201cwhat if\u201d analysis and unstructured decisions that require knowledge, insight and evaluation.",
          },
          {
            icon: "briefcase",
            title: "Executive Support System (ESS)",
            text: "Gives senior management a long-term, strategic view of the organisation and its environment.",
          },
        ],
        figures: [
          {
            id: "114050-is-pyramid",
            caption: "The organisational pyramid — technology serving each level",
            hint: "pyramid diagram with TPS at the base, KWS and MIS in the middle, DSS/ESS at the top",
          },
        ],
        slideQuiz: [
          {
            q: "Which are types of information systems?",
            options: [
              "TPS, KWS, MIS, DSS and ESS",
              "LAN, WAN, MAN and PAN",
              "CPU, RAM, SSD and GPU",
              "HTTP, FTP, SMTP and DNS",
            ],
            answer: 0,
            explain: "Transaction Processing, Knowledge Work, Management Information, Decision Support and Executive Support systems.",
          },
          {
            q: "Which system collects, stores, modifies and retrieves an organisation's transactions?",
            options: [
              "The Transaction Processing System (TPS)",
              "The Knowledge Work System (KWS)",
              "The Executive Support System (ESS)",
              "The Decision Support System (DSS)",
            ],
            answer: 0,
            explain: "That is the definition of a TPS — it handles the organisation's day-to-day transactions.",
          },
          {
            q: "Which system helps with problems requiring technical expertise or knowledge?",
            options: [
              "The Knowledge Work System (KWS)",
              "The Transaction Processing System (TPS)",
              "The Management Information System (MIS)",
              "A batch processing system run overnight",
            ],
            answer: 0,
            explain: "Knowledge work systems support technical and specialist work — CAD for designers, expert systems for engineers, and so on.",
          },
          {
            q: "Which system converts internal and external data into information for managers' decisions?",
            options: [
              "The Management Information System (MIS)",
              "The Transaction Processing System (TPS)",
              "The Computer Aided Design (CAD) package",
              "A standalone spreadsheet with no connection to data sources",
            ],
            answer: 0,
            explain: "The MIS converts data from internal and external sources into information for planning, directing and controlling.",
          },
          {
            q: "What does the pyramid diagram show?",
            options: [
              "The organisational hierarchy and the technology that serves each level's needs",
              "The floor plan of the offices from reception to the boardroom",
              "The schema of the database tables and their relationships",
              "The ownership of the company from shareholders to employees",
            ],
            answer: 0,
            explain: "Each level of the pyramid is served by its own kind of system — TPS at the base, up to executive support at the top.",
          },
        ],
      },
      {
        heading: "Transaction Processing Systems (TPS)",
        icon: "database",
        flat: true,
        paragraphs: [
          "A Transaction Processing System (TPS) collects, stores, modifies and retrieves the transactions of an organisation. A transaction is an event that generates or modifies data that is eventually stored in an information system. To be considered a transaction processing system, the computer must pass the ACID test.",
          "Contrasted with batch processing: batch processing is not transaction processing. Batch processing involves processing several transactions at the same time, and the results of each transaction are not immediately available when the transaction is being entered.",
          "Features of transaction processing systems:",
        ],
        bullets: [
          "Rapid response — fast performance with a rapid response time is critical. Businesses cannot afford to have customers waiting: the turnaround from input of the transaction to production of the output must be a few seconds or less.",
          "Reliability — many organisations rely heavily on their TPS; a breakdown will disrupt operations or even stop the business. The failure rate must be very low, with quick and accurate recovery and well-designed backup and recovery procedures.",
          "Inflexibility — a TPS wants every transaction processed in the same way regardless of the user, the customer or the time of day. If a TPS were flexible there would be too many opportunities for non-standard operations — an airline must consistently accept reservations from every travel agent.",
          "Controlled processing — the processing must support the organisation's operations: if roles and responsibilities are allocated to particular employees, the TPS should enforce and maintain this requirement.",
        ],
        slideQuiz: [
          {
            q: "What does a TPS do?",
            options: [
              "Collects, stores, modifies and retrieves the transactions of an organisation",
              "Designs new products and suggests materials for the engineers",
              "Writes the annual report and files it with the auditors",
              "Manages the organisation's e-mail and video conferencing",
            ],
            answer: 0,
            explain: "A Transaction Processing System handles the organisation's transactions end to end.",
          },
          {
            q: "What is a transaction?",
            options: [
              "An event that generates or modifies data stored in an information system",
              "Any meeting between employees where business is discussed",
              "A printed invoice only — electronic events do not count",
              "A phone call between the organisation and a customer",
            ],
            answer: 0,
            explain: "A transaction is any event that generates or modifies data eventually stored in the information system.",
          },
          {
            q: "Why is batch processing NOT transaction processing?",
            options: [
              "Several transactions are processed together and results are not immediately available",
              "Batches are too small to hold a meaningful number of transactions",
              "Batch runs never store their data after processing completes",
              "Batch systems run without computers, using manual records instead",
            ],
            answer: 0,
            explain: "In batch processing, results of each transaction are not immediately available while it is entered — a TPS responds at once.",
          },
          {
            q: "Why must a TPS respond rapidly?",
            options: [
              "Customers cannot be kept waiting — turnaround must be a few seconds or less",
              "Slow systems draw less power, so speed is purely a cost decision",
              "Speed is only cosmetic — customers do not notice response times",
              "A fast system reduces the need for backup and recovery procedures",
            ],
            answer: 0,
            explain: "Fast performance with rapid response is critical — a few seconds or less from input to output.",
          },
          {
            q: "Why is a TPS deliberately INFLEXIBLE?",
            options: [
              "Every transaction must be processed the same way — flexibility would invite non-standard operations",
              "Programmers keep the code rigid because flexible systems take far longer to design and build",
              "Flexible processing is prohibited by the Companies Act",
              "Rigid processing saves disk space in the data warehouses",
            ],
            answer: 0,
            explain: "A commercial airline must consistently accept reservations from a range of travel agents — different processing per agent would be a problem.",
          },
        ],
      },
      {
        heading: "The ACID test",
        icon: "shield",
        flat: true,
        paragraphs: [
          "To be considered a transaction processing system, the computer must pass the ACID test. A transaction's properties are:",
        ],
        cards: [
          {
            icon: "check",
            title: "Atomicity",
            text: "A transaction must be completed fully, or not happen at all. Simple idea: all or nothing.",
          },
          {
            icon: "shield",
            title: "Consistency",
            text: "A transaction must follow the rules of the system and leave the data correct. Simple idea: follow the rules and keep the information accurate.",
          },
          {
            icon: "lock",
            title: "Isolation",
            text: "Transactions happening at the same time do not interfere with each other. Each transaction works independently.",
          },
          {
            icon: "database",
            title: "Durability",
            text: "Once a transaction is successfully completed, the changes are saved permanently. Once saved, it stays saved.",
          },
        ],
        examples: [
          {
            title: "Atomicity — Investec example",
            lines: [
              "An Investec client transfers R5,000 to another account.",
              "R5,000 is deducted from the sender's account.",
              "R5,000 is credited to the receiver's account.",
              "Both actions must happen. If something goes wrong, the transaction is cancelled and the money remains unchanged.",
              "Simple idea: all or nothing.",
            ],
          },
          {
            title: "Consistency — Investec example",
            lines: [
              "An Investec client transfers R5,000 to another account. The transaction must follow the rules of the system and leave the data correct:",
              "1. The sender must have enough money.",
              "2. The correct amount must be deducted.",
              "3. The correct amount must be credited to the receiver.",
              "4. The account balances must remain accurate.",
              "Before the transfer — Sender: R20,000 · Receiver: R10,000.",
              "After the transfer — Sender: R15,000 · Receiver: R15,000.",
              "The database must show these correct balances. If the system deducted R5,000 from the sender but failed to add it to the receiver, the data would be incorrect.",
              "Consistency = follow the rules + keep the information accurate.",
            ],
          },
          {
            title: "Isolation — Investec example",
            lines: [
              "Two Investec clients make transactions at the same time.",
              "Client A transfers R5,000.",
              "Client B transfers R2,000.",
              "Each transaction is processed as if it is happening on its own.",
              "One transaction cannot accidentally affect or change the other transaction.",
              "Each transaction works independently.",
            ],
          },
          {
            title: "Durability — Investec example",
            lines: [
              "An Investec client transfers R5,000 to another account.",
              "The transfer is successfully completed.",
              "The new account balances are saved.",
              "Even if the system later crashes or loses power, the completed transaction is not lost.",
              "When the system comes back online, the updated balances remain.",
              "Once saved, it stays saved.",
            ],
          },
        ],
        slideQuiz: [
          {
            q: "Atomicity means…",
            options: [
              "A transaction's changes either all happen or none happen",
              "Transactions are kept as small as possible so they process quickly",
              "Data is broken into its smallest pieces before being stored",
              "Only one user may work on the system at any moment",
            ],
            answer: 0,
            explain: "All or nothing: an Investec client transfers R5,000 — the debit from the sender and the credit to the receiver must BOTH happen, or the transaction is cancelled and the money remains unchanged.",
          },
          {
            q: "Consistency means…",
            options: [
              "A correct transformation that does not violate the state's integrity constraints",
              "The system never changes its behaviour once it has passed its acceptance testing",
              "All data is formatted to look the same throughout the database",
              "Backups run on a consistent daily schedule without fail",
            ],
            answer: 0,
            explain: "Follow the rules and keep the data correct: after an R5,000 transfer the sender's R20,000 must become R15,000 and the receiver's R10,000 must become R15,000 — deducting without crediting would leave the data incorrect.",
          },
          {
            q: "Isolation means…",
            options: [
              "Concurrent transactions appear to each other to have run either before or after — not both",
              "The server sits in a locked room away from the office",
              "Users may not discuss their transactions while working",
              "Data is encrypted so that one transaction can never read the records another has written",
            ],
            answer: 0,
            explain: "Transactions running at the same time do not interfere: Client A transfers R5,000 while Client B transfers R2,000 — each is processed as if it were happening on its own.",
          },
          {
            q: "Durability means…",
            options: [
              "Once a transaction commits, its changes survive failures",
              "The hardware is built to run for years without breaking down",
              "Every piece of data is written twice to two separate drives",
              "The UPS can keep the system running for at least an hour",
            ],
            answer: 0,
            explain: "Once the R5,000 transfer completes, the new balances are saved permanently — even if the system later crashes or loses power, the updated balances remain when it comes back online.",
          },
          {
            q: "What must a computer pass to be considered a transaction processing system?",
            options: ["The ACID test", "The Turing test", "A stress test", "A spelling test"],
            answer: 0,
            explain: "Atomicity, Consistency, Isolation, Durability — the ACID test.",
          },
        ],
      },
      {
        heading: "Storing and retrieving — databases and files",
        icon: "server",
        flat: true,
        paragraphs: [
          "Storing and retrieving information from a TPS must be efficient and effective. The data are stored in warehouses or other databases, and the system must be well designed for its backup and recovery procedures.",
          "The storage and retrieval of data must be accurate, as it is used many times throughout the day. A database is a collection of data neatly organised, which stores the accounting and operational records. Databases are always protective of their delicate data, so they usually have a restricted view of certain data. Databases are designed using hierarchical, network or relational structures — each structure is effective in its own sense.",
        ],
        cards: [
          {
            icon: "layers",
            title: "Hierarchical structure",
            text: "Organises data in a series of levels — a top-to-bottom structure of nodes and branches. Each child node has branches and is linked to only one higher-level parent node.",
            figId: "114050-db-hierarchical",
          },
          {
            icon: "network",
            title: "Network structure",
            text: "Also organises data using nodes and branches — but unlike hierarchical, each child node can be linked to multiple higher parent nodes.",
            figId: "114050-db-network",
          },
          {
            icon: "dashboard",
            title: "Relational structure",
            text: "Organises its data in a series of related tables. This gives flexibility, as relationships between the tables are built.",
            figId: "114050-db-relational",
          },
        ],
        figures: [
          {
            id: "114050-db-structures",
            caption: "Hierarchical, network and relational database structures",
            hint: "diagrams of a hierarchical tree, a network graph and related tables",
          },
        ],
        slideQuiz: [
          {
            q: "Where does a TPS store its data?",
            options: [
              "In warehouses or other databases, with well-designed backup and recovery procedures",
              "On paper in fireproof filing cabinets at head office",
              "In RAM only, because memory is faster than any disk",
              "On the printer queue until the operator releases each document",
            ],
            answer: 0,
            explain: "Data are stored in warehouses or databases; backup and recovery must be well designed because the data is used all day.",
          },
          {
            q: "What is a database?",
            options: [
              "A collection of data neatly organised, storing the accounting and operational records",
              "A printout of a spreadsheet bound into the annual accounting file at head office",
              "A type of network cable that carries records between branches",
              "An e-mail folder where the accountant files supplier invoices",
            ],
            answer: 0,
            explain: "Databases protect their delicate data and usually give a restricted view of certain data.",
          },
          {
            q: "In a HIERARCHICAL structure, each child node is linked to…",
            options: [
              "Only one higher-level parent node",
              "Multiple higher-level parent nodes at the same time",
              "No other nodes anywhere in the structure",
              "Every other node in the entire structure",
            ],
            answer: 0,
            explain: "Hierarchical structures are top-to-bottom trees of nodes and branches — one parent per child.",
          },
          {
            q: "In a NETWORK structure, each child node can be linked to…",
            options: [
              "Multiple higher-level parent nodes",
              "Only one parent node directly above it",
              "Only the root node at the very top of the tree",
              "Nothing — network nodes stand entirely alone",
            ],
            answer: 0,
            explain: "Network structures use nodes and branches like hierarchical ones, but a child may have multiple parents.",
          },
          {
            q: "How does a RELATIONAL database organise data?",
            options: [
              "In a series of related tables, giving flexibility as relationships are built",
              "In one long list sorted by the date each record was captured",
              "As a single tree with one parent for every child record",
              "In image files scanned from the original paper documents",
            ],
            answer: 0,
            explain: "Relational databases hold related tables — relationships between the tables give the flexibility.",
          },
        ],
      },
      {
        heading: "Data processing — batch and on-line",
        icon: "clock",
        flat: true,
        paragraphs: [
          "Data processing systems are also known as transaction processing systems. A transaction is any event that is recorded — a sale, or signing up to a college course. The data is recorded and dealt with by some process. There are two ways in which transactions can be dealt with:",
        ],
        bullets: [
          "Batch systems — a number of transactions are collected over a period of time and dealt with all in one go. Goods ordered at a mail-order warehouse may have the tickets collected into a batch of 50 before the details are keyed in and saved to disk; only then is the stock-control program run. It may take several hours, but when someone is waiting four or five days for delivery this is not critical.",
          "On-line systems — updates of data are done immediately, which is important when time is critical. Sensors feeding data to a production line must update the program constantly so imbalances can be checked immediately. When you buy a ticket at a travel agent, the airline's computer is updated almost immediately — pseudo-on-line processing, where a delay of a few seconds is neither here nor there.",
        ],
        slideQuiz: [
          {
            q: "In a batch system…",
            options: [
              "Transactions are collected over a period and dealt with all in one go",
              "Each transaction updates the master files the instant it is entered",
              "Nothing is stored — results are printed and then discarded",
              "Only one transaction may exist in the system at a time",
            ],
            answer: 0,
            explain: "Batch systems collect transactions — like 50 mail-order tickets — and process them together.",
          },
          {
            q: "In the mail-order example, when is the stock-control program run?",
            options: [
              "Only after a batch of about 50 order tickets has been keyed in and saved",
              "Before any orders arrive, so stock is reserved in advance",
              "Every second, so the stock position is always current",
              "Never — stock control is handled by a separate company",
            ],
            answer: 0,
            explain: "The tickets are batched, keyed in and saved to disk — only then does the stock-control program run.",
          },
          {
            q: "On-line systems update data…",
            options: [
              "Immediately — important when time is critical",
              "Once a month when the accounts are reconciled",
              "Only at night when no users are on the system",
              "Only on Monday mornings with the branch downloads",
            ],
            answer: 0,
            explain: "On-line systems do updates immediately, which matters when time is critical.",
          },
          {
            q: "Sensors managing a production line need which kind of processing?",
            options: [
              "Constant, immediate updates so imbalances can be checked at once",
              "Weekly batches collected and processed every Friday",
              "Manual entry by an operator reading each sensor display",
              "No processing — the data is never captured at all",
            ],
            answer: 0,
            explain: "The sensors must update the program constantly so imbalances can be checked immediately.",
          },
          {
            q: "Buying an airline ticket at a travel agent is an example of…",
            options: [
              "Pseudo-on-line processing — a delay of a few seconds is neither here nor there",
              "Pure batch processing collected into batches of fifty like mail-order tickets",
              "Off-line processing completed after the customer has left",
              "No processing — the data is never captured at all",
            ],
            answer: 0,
            explain: "The airline's computer is updated almost immediately — a few seconds' delay does not matter.",
          },
        ],
      },
      {
        heading: "Knowledge work systems (KWS)",
        icon: "design",
        flat: true,
        paragraphs: [
          "Knowledge work systems are there to help deal with problems requiring technical expertise or knowledge. Software includes:",
        ],
        bullets: [
          "Word-processing for clerical staff.",
          "Spreadsheets for accounts and sales staff.",
          "Database management systems for keeping records.",
          "CAD for designers.",
          "Project management systems.",
          "Expert systems for specialist staff.",
          "In most organisations computers are networked; in large organisations several local area networks are linked together, with hardware and software that let groups of staff communicate using e-mail, document scanning, web-cams and video conferencing.",
        ],
        example: {
          title: "An expert system in action",
          lines: [
            "A system enables an engineer to select a particular metal alloy for a bearing.",
            "He types in the parameters he needs and the system suggests several different alloys.",
            "It is then up to the engineer to use his knowledge and experience to decide which alloy he will use.",
          ],
        },
        slideQuiz: [
          {
            q: "Knowledge work systems help deal with…",
            options: [
              "Problems requiring technical expertise or knowledge",
              "Payroll runs and the monthly payment of salaries",
              "Cleaning rosters and the scheduling of maintenance staff",
              "Building maintenance, parking and other facilities questions",
            ],
            answer: 0,
            explain: "KWS software supports technical and specialist work across the organisation.",
          },
          {
            q: "Which software belongs in a knowledge work system?",
            options: [
              "Word processing, spreadsheets, database management, CAD, project management and expert systems",
              "Games, media players and entertainment software licensed for use at lunchtime",
              "Antivirus, firewall and backup software protecting the organisation's network",
              "E-mail and calendar software only — every other package is an operational system",
            ],
            answer: 0,
            explain: "Each serves a kind of knowledge worker — clerical staff, accounts, record-keepers, designers and specialists.",
          },
          {
            q: "Who uses CAD in the examples given?",
            options: ["Designers", "Clerical staff", "Accounts staff", "Drivers"],
            answer: 0,
            explain: "CAD is the designers' tool; word processing serves clerical staff and spreadsheets serve accounts and sales.",
          },
          {
            q: "In the expert system example, what does the engineer do after the system suggests several alloys?",
            options: [
              "Uses his own knowledge and experience to decide which alloy to use",
              "Accepts the first suggestion without applying any judgement",
              "Asks the system to manufacture the bearing from the alloy",
              "Ignores the system and picks an alloy from a catalogue",
            ],
            answer: 0,
            explain: "The expert system suggests options — the final decision still rests on the engineer's knowledge and experience.",
          },
          {
            q: "How do staff in large organisations communicate across linked networks?",
            options: [
              "E-mail, document scanning, web-cams and video conferencing",
              "Fax machines only, because networks cannot carry documents",
              "Printed memoranda distributed by the internal post",
              "Notice boards in the canteen updated every morning",
            ],
            answer: 0,
            explain: "Several LANs are linked together with hardware and software that let groups of staff communicate.",
          },
        ],
      },
      {
        heading: "Management information systems (MIS)",
        icon: "chart",
        flat: true,
        paragraphs: [
          "Management Information Systems are designed to help managers monitor and control organisational performance, and plan for the future.",
          "The role of a management information system is to convert data from internal and external sources into information that can be used to aid in making effective decisions for planning, directing and controlling.",
          "The five classical functions of a manager are:",
        ],
        bullets: [
          "Planning — the direction a company takes, e.g. diversifying, or where to operate.",
          "Organising — resources such as people, space, equipment and services.",
          "Coordinating — the activities of various departments.",
          "Decision-making — about the organisation, the products or services made or sold, the employees, the use of IT.",
          "Controlling — monitoring and supervising the activities of others.",
        ],
        cards: [
          {
            icon: "database",
            title: "Data processing systems",
            text: "Record day-to-day transactions, e.g. the sale of a CD to a customer.",
          },
          {
            icon: "checklist",
            title: "Operational information systems",
            text: "Read the collected data and do things like producing lists of items that need to be re-ordered.",
          },
          {
            icon: "chart",
            title: "The MIS",
            text: "Analyses the sales data to highlight sales trends of different product lines — should the product get special promotion, or be discontinued?",
          },
        ],
        slideQuiz: [
          {
            q: "What is the role of an MIS?",
            options: [
              "To convert data from internal and external sources into information for planning, directing and controlling",
              "To replace managers entirely by taking all the organisation's decisions automatically",
              "To process the payroll and print salary slips",
              "To store paper files in an organised filing room",
            ],
            answer: 0,
            explain: "That is the best definition of an MIS — data in, decision-ready information out.",
          },
          {
            q: "Which are the five classical functions of a manager?",
            options: [
              "Planning, organising, coordinating, decision-making and controlling",
              "Buying, selling, hiring, firing and printing",
              "Reading, writing, arithmetic, filing and telephoning",
              "Input, processing, output, storage and communication",
            ],
            answer: 0,
            explain: "The MIS exists to give managers sufficient information to carry out these five functions.",
          },
          {
            q: "A data-processing system…",
            options: [
              "Records day-to-day transactions, such as the sale of a CD to a customer",
              "Analyses sales trends to decide which products to promote",
              "Makes strategic decisions about opening and closing stores",
              "Designs advertisements for the products the business sells",
            ],
            answer: 0,
            explain: "Data-processing systems record the day-to-day transactions; analysis is the MIS's job.",
          },
          {
            q: "An operational information system…",
            options: [
              "Reads the collected data and produces lists such as items that need re-ordering",
              "Ignores the collected data and works from manual stock counts taken weekly",
              "Replaces the MIS entirely in most organisations",
              "Serves only executives making strategic decisions",
            ],
            answer: 0,
            explain: "Operational information systems act on the collected data — like producing re-order lists.",
          },
          {
            q: "What does the MIS do with sales data?",
            options: [
              "Analyses it to highlight sales trends per product line — special promotion or discontinue?",
              "Deletes it at month-end once the accounts are closed",
              "Prints it for filing in the records office without any analysis performed",
              "Encrypts it so only the auditors can ever read it",
            ],
            answer: 0,
            explain: "The MIS highlights trends so decisions can be made about promoting or discontinuing product lines.",
          },
        ],
      },
      {
        heading: "MIS — information sources, flows and levels",
        icon: "trend",
        flat: true,
        paragraphs: [
          "The MIS deals with internal and external information. Internal information can be got quite easily from the various systems on the company network, e.g. sales figures for each product line. External information is gathered from:",
        ],
        bullets: [
          "Intelligence about competitors' activities — through reading articles in the press, leaks, or even industrial espionage.",
          "Information about population shifts — as the population gets older it is less likely to be interested in pop music or customising cars, and more likely to want weight-loss products or holidays for the over-50s.",
          "Economic and social factors — sales of cars would go down in an area where a major employer had just closed a plant.",
          "Government legislation — financial forecasts would change if the minimum wage rose.",
        ],
        cards: [
          {
            icon: "document",
            title: "Formal flows of information",
            text: "A procedure is adopted — e.g. downloading sales figures from several branches first thing on a Monday morning; specialised data collection agencies such as Dun and Bradstreet; people working on the same document at several locations; e-mail; company intranets.",
          },
          {
            icon: "chat",
            title: "Informal flows of information",
            text: "Chance meetings, reading magazines or newspapers, or watching the news on TV.",
          },
        ],
        table: {
          headers: ["Level", "Decisions it serves", "Example"],
          rows: [
            ["Operational", "Day-to-day decisions", "Ordering in more stock"],
            ["Tactical", "Short to medium term", "Introducing a new product to a particular retail outlet"],
            ["Strategic", "Long term — the organisation's future", "Opening a new store, or taking over a rival concern"],
          ],
        },
        slideQuiz: [
          {
            q: "Where does INTERNAL information for the MIS come from?",
            options: [
              "The various systems on the company network, e.g. sales figures for each product line",
              "Newspapers and trade magazines read by the marketing team each week",
              "Intelligence gathered about competitors' activities in the marketplace",
              "The weather service and other public information broadcasts on the radio",
            ],
            answer: 0,
            explain: "Internal information is easily gathered from the systems already on the company network.",
          },
          {
            q: "Which is a source of EXTERNAL information?",
            options: [
              "Intelligence about competitors, population shifts, economic and social factors, and government legislation",
              "The canteen menu, the weekend staff roster and the parking allocation list",
              "The office seating plan, the internal telephone directory and the fire drill roster",
              "Staff birthdays, work anniversaries and the schedule of annual leave",
            ],
            answer: 0,
            explain: "External information covers competitors' activities, demographics, economic and social factors and legislation.",
          },
          {
            q: "A FORMAL flow of information is…",
            options: [
              "One where a procedure is adopted, e.g. downloading branch sales figures every Monday morning",
              "A chance meeting with a supplier at an industry exhibition or conference",
              "Watching the news on television in the evening after getting home from work",
              "Reading a magazine article about a competitor's newly launched product",
            ],
            answer: 0,
            explain: "Formal flows follow procedures — scheduled downloads, data agencies like Dun and Bradstreet, shared documents, e-mail, intranets.",
          },
          {
            q: "INFORMAL information flows come from…",
            options: [
              "Chance meetings, magazines, newspapers or TV news",
              "Company intranets maintained by the IT department",
              "Scheduled downloads of sales figures from branches",
              "Specialised agencies such as Dun and Bradstreet",
            ],
            answer: 0,
            explain: "Informal flows are unplanned — chance meetings, magazines, newspapers, television.",
          },
          {
            q: "Which decision level deals with long-term choices such as opening a new store?",
            options: ["Strategic", "Operational", "Tactical", "Clerical"],
            answer: 0,
            explain: "Strategic decisions affect the organisation's future — new stores or taking over a rival. Operational is day-to-day; tactical is short-to-medium term.",
          },
        ],
      },
      {
        heading: "Types of decision — and how managers take them",
        icon: "target",
        flat: true,
        paragraphs: ["A manager can make two kinds of decision:"],
        cards: [
          {
            icon: "checklist",
            title: "Structured decisions",
            text: "Repetitive, needing a definite routine and procedure to deal with them — e.g. stock is below 15%, so an order needs to be placed with a supplier.",
          },
          {
            icon: "search",
            title: "Unstructured decisions",
            text: "Require knowledge, insight and evaluation. They may well crop up without warning, and the right decision can be critical.",
          },
        ],
        example: {
          title: "The stages of taking a decision",
          lines: [
            "The manager may well go through the following stages when considering what decision to take:",
            "1. Recognise the problem. The MIS may give information about the performance of the department, and where there is a problem.",
            "2. Consider the solution. A spreadsheet could be used to consider \u201cwhat if\u201d scenarios.",
            "3. The solution is chosen using the manager's experience as well as the information produced by the MIS.",
            "4. The solution is implemented and reviewed. Again the MIS can provide the data on which the solution is evaluated.",
            "Often solutions do not proceed smoothly and there may have to be backtracking from one stage to another.",
          ],
        },
        slideQuiz: [
          {
            q: "A STRUCTURED decision is…",
            options: [
              "Repetitive, with a definite routine and procedure — e.g. stock below 15% triggers an order",
              "A surprise crisis that arrives without warning and demands insight and evaluation",
              "One based on the manager's gut feel rather than a set routine",
              "One so important that it may never be delegated below board level",
            ],
            answer: 0,
            explain: "Structured decisions repeat and follow a routine — like re-ordering when stock falls below 15%.",
          },
          {
            q: "An UNSTRUCTURED decision…",
            options: [
              "Requires knowledge, insight and evaluation, and may crop up without warning",
              "Follows a fixed script agreed in advance with the department",
              "Happens on a fixed schedule, like a daily 9am stock review",
              "Needs no thought because the procedure decides the outcome",
            ],
            answer: 0,
            explain: "Unstructured decisions demand judgement — and getting them right can be critical.",
          },
          {
            q: "What is the FIRST stage when considering a decision?",
            options: [
              "Recognise the problem — the MIS shows where performance is off",
              "Implement a fix immediately before the problem grows",
              "Buy new software so the problem cannot happen again",
              "Review the solution and evaluate it against the MIS data",
            ],
            answer: 0,
            explain: "First recognise the problem; the MIS gives information about the department's performance and where the problem lies.",
          },
          {
            q: "How can \u201cwhat if\u201d scenarios be considered?",
            options: [
              "Using a spreadsheet",
              "Using a printer",
              "Using the phone",
              "They cannot be modelled",
            ],
            answer: 0,
            explain: "A spreadsheet lets the manager model \u201cwhat if\u201d scenarios before choosing a solution.",
          },
          {
            q: "What happens after a solution is implemented?",
            options: [
              "It is reviewed — the MIS provides the data on which it is evaluated, and there may be backtracking",
              "Nothing further happens — implementation is the final stage of the process",
              "The MIS is switched off so that it cannot interfere with the solution",
              "The decision becomes final and may never be revisited or changed in any way",
            ],
            answer: 0,
            explain: "Solutions are implemented and reviewed; they do not always proceed smoothly, so stages may be revisited.",
          },
        ],
      },
      {
        heading: "Word processors",
        icon: "document",
        flat: true,
        lessonStart: { n: 3, title: "Explain how information technology can be used in business" },
        paragraphs: [
          "Welcome to Lesson 3: explain how information technology can be used in business. Time: 90 minutes · Activity: Self & Group.",
          "Word processing means using a computer to create, edit and print documents. Of all computer applications, word processing is the most common. A word processor lets you create a document, store it electronically, display it on a screen, modify it by entering commands and characters from the keyboard, and print it — and in 2026 it also saves your work to the cloud automatically, keeps a version history, and lets several people edit the same document at the same time.",
          "The great advantage of word processing over using a typewriter is that you can make changes without retyping the entire document. If you make a typing mistake, you simply back up the cursor and correct it. You can delete a paragraph without leaving a trace, insert a word, sentence or paragraph in the middle of a document, or move sections of text from one place to another — then print or share only when you are happy.",
          "The word processors a business is most likely to use today are Microsoft Word (part of Microsoft 365, with the Copilot AI assistant built in), Google Docs (part of Google Workspace, with the Gemini assistant), and the free LibreOffice Writer. All of them run on Windows, macOS, tablets and phones — and in a web browser.",
        ],
        example: {
          title: "In business",
          lines: [
            "Word processors produce the documents a business runs on: letters, quotations, contracts, reports, policies, meeting minutes and staff communications.",
            "Effect on the business: documents go out faster and with fewer errors, templates keep every document on-brand, and cloud sharing means a team finishes one document together instead of emailing copies around.",
          ],
        },
        figures: [
          {
            id: "114050-word-processor",
            caption: "A modern word processor — Microsoft Word with the Copilot assistant",
            hint: "screenshot of Microsoft Word (Microsoft 365) editing a business letter, with the Copilot AI side panel open",
          },
        ],
        slideQuiz: [
          {
            q: "What is word processing?",
            options: [
              "Using a computer to create, edit and print documents",
              "Using a computer to calculate budgets in a grid of cells",
              "Using a computer to design logos and edit photographs",
              "Using a computer to store customer records in tables",
            ],
            answer: 0,
            explain: "Word processing is using a computer to create, edit and print documents — the most common of all computer applications.",
          },
          {
            q: "What is the great advantage of a word processor over a typewriter?",
            options: [
              "You can make changes without retyping the entire document",
              "It prints documents in colour rather than only in black ink",
              "It never needs electricity, so it keeps working in a power cut",
              "It writes the document itself, so nobody has to draft anything",
            ],
            answer: 0,
            explain: "Mistakes are corrected in place — delete, insert and move text without retyping the document.",
          },
          {
            q: "Which word processors is a business most likely to use in 2026?",
            options: [
              "Microsoft Word, Google Docs and LibreOffice Writer",
              "Lotus Word Pro, WordStar and IBM DisplayWrite",
              "Corel Ventura, PageMaker and Harvard Graphics",
              "WordPad, Teletext and the Windows Notepad app",
            ],
            answer: 0,
            explain: "Word (Microsoft 365), Google Docs (Google Workspace) and the free LibreOffice Writer are today's common choices.",
          },
          {
            q: "Besides printing, what does a modern word processor do with your document?",
            options: [
              "Saves it to the cloud automatically and keeps a version history",
              "Deletes it every evening so that the file server does not fill up",
              "Faxes it to head office every time you press the spacebar",
              "Locks it so that only the IT department can ever open it",
            ],
            answer: 0,
            explain: "Cloud autosave, version history and real-time co-authoring are standard in 2026.",
          },
          {
            q: "Which documents would a business produce with a word processor?",
            options: [
              "Letters, quotations, contracts, reports and policies",
              "Only spreadsheet budgets and cash-flow forecasts",
              "Only databases of customers and stock on hand",
              "Only photographs, logos and video advertisements",
            ],
            answer: 0,
            explain: "The business paperwork — letters, quotes, contracts, reports, policies — is word-processor territory.",
          },
        ],
      },
      {
        heading: "Basic features every word processor supports",
        icon: "checklist",
        flat: true,
        paragraphs: [
          "Word processors vary considerably, but all of them support the following basic features:",
        ],
        bullets: [
          "Insert text — add text anywhere in the document.",
          "Delete text — erase characters, words, lines or pages as easily as crossing them out on paper.",
          "Cut and paste — remove (cut) a section of text from one place and insert (paste) it somewhere else.",
          "Copy — duplicate a section of text.",
          "Page size and margins — define various page sizes and margins; the word processor automatically re-fits the text.",
          "Search and replace — find a particular word or phrase, and optionally replace every occurrence with other text.",
          "Word wrap — the word processor automatically starts a new line when the current one is full, and re-flows the text if the margins change.",
          "Print — send the document to a printer, or save it as a PDF to email or WhatsApp to a client.",
        ],
        example: {
          title: "Text editors vs full-featured word processors",
          lines: [
            "A program that supports only these basics (and maybe a few more) is called a text editor — Windows Notepad is the classic example.",
            "Most word processors support far more, and are called full-featured word processors — the next slide looks at what they add.",
          ],
        },
        slideQuiz: [
          {
            q: "What does CUT AND PASTE do?",
            options: [
              "Removes text from one place and inserts it somewhere else",
              "Duplicates a section of text without removing the original",
              "Erases a page so thoroughly that it can never be recovered",
              "Prints the selected paragraph on a separate sheet of paper",
            ],
            answer: 0,
            explain: "Cut removes the text; paste inserts it at the new position — copy is the feature that duplicates.",
          },
          {
            q: "What does WORD WRAP do?",
            options: [
              "Starts a new line automatically when the current line is full",
              "Draws a decorative border around the edge of every page",
              "Underlines every word that the spell checker cannot recognise",
              "Compresses the document so that it uses less disk space",
            ],
            answer: 0,
            explain: "Word wrap moves to the next line automatically and re-flows the text when the margins change.",
          },
          {
            q: "What does SEARCH AND REPLACE let you do?",
            options: [
              "Find a word or phrase and swap every occurrence for other text",
              "Find a lost file anywhere on the computer's hard drive",
              "Replace the printer with a newer model automatically",
              "Search the internet for a better version of your document",
            ],
            answer: 0,
            explain: "It searches for the characters you specify and can replace each occurrence with replacement text.",
          },
          {
            q: "If you change the page size or margins, what happens to the text?",
            options: [
              "The word processor automatically readjusts it so that it fits",
              "It disappears and must be typed in again from the beginning",
              "It prints exactly as it did before, ignoring the new settings",
              "It is moved into a brand-new empty document window",
            ],
            answer: 0,
            explain: "Page size and margin settings re-fit the existing text automatically.",
          },
          {
            q: "A program that supports only the basic features is called…",
            options: [
              "A text editor — Windows Notepad is the classic example",
              "A desktop publishing system for full-colour magazines",
              "A database management system for structured records",
              "A presentation package for building slide shows",
            ],
            answer: 0,
            explain: "Basics only = text editor; word processors with more are called full-featured word processors.",
          },
        ],
      },
      {
        heading: "Full-featured word processors",
        icon: "settings",
        flat: true,
        paragraphs: [
          "Full-featured word processors let you manipulate and format documents in more sophisticated ways:",
        ],
        bullets: [
          "File management — create, delete, move and search for files without leaving the program.",
          "Font specifications — change fonts, sizes and typefaces; apply bold, italics and underlining.",
          "Footnotes and cross-references — automatic numbering and placement of footnotes, and easy references to other sections of the document.",
          "Graphics — embed illustrations, charts and photos into the document, drawn in the program or inserted from another one.",
          "Headers, footers and page numbering — customised text at the top and bottom of every page, with the correct page number tracked automatically.",
          "Layout — different margins and indenting methods within a single document.",
          "Macros — record a series of keystrokes or commands and replay them to save time on common combinations.",
          "Merges (mail merge) — merge names and addresses from a list into a template to generate personalised letters, labels or certificates.",
          "Spell checker — highlights any words that it does not recognise.",
          "Tables of contents and indexes — created automatically from codes you insert in the document.",
          "Thesaurus — search for synonyms without leaving the word processor.",
          "Windows — edit two or more documents at the same time, each in its own window.",
          "WYSIWYG (what you see is what you get) — the document appears on screen exactly as it will look when printed.",
        ],
        example: {
          title: "What 2026 adds",
          lines: [
            "Track changes and comments — colleagues suggest edits without destroying your text; you accept or reject each one.",
            "Real-time co-authoring — several people type in the same document at once, each cursor labelled with a name.",
            "AI assistants — Copilot in Word and Gemini in Google Docs draft, summarise, rewrite and translate text on request.",
            "Dictation — speak, and the document types itself with punctuation added automatically.",
          ],
        },
        slideQuiz: [
          {
            q: "What is a MACRO?",
            options: [
              "A recorded series of keystrokes or commands replayed to save time",
              "A very large font used for the main heading on a title page",
              "A picture embedded in the header of every page of a document",
              "A list of all the files stored in the word processor's folder",
            ],
            answer: 0,
            explain: "A macro represents a series of keystrokes or commands — replaying it saves time on common combinations.",
          },
          {
            q: "What is MAIL MERGE particularly useful for?",
            options: [
              "Generating many personalised documents from one template and a list",
              "Sending one email to the company's internet service provider",
              "Combining two printers so that documents print twice as fast",
              "Compressing old letters so that they use less storage space",
            ],
            answer: 0,
            explain: "Merging a name-and-address list into a template produces personalised letters, labels or certificates — the classic example is mailing labels.",
          },
          {
            q: "What does WYSIWYG mean?",
            options: [
              "The document on screen looks exactly as it will look when printed",
              "The word processor warns you whenever your grammar is incorrect",
              "The file is watermarked so that other people cannot copy it",
              "The window resizes itself to match the size of the paper",
            ],
            answer: 0,
            explain: "What You See Is What You Get — the screen matches the printed result exactly.",
          },
          {
            q: "What does a SPELL CHECKER do?",
            options: [
              "Highlights any words that it does not recognise",
              "Rewrites your paragraphs in more formal English",
              "Translates the entire document into another language",
              "Counts the words and reports the reading time",
            ],
            answer: 0,
            explain: "The spell checker checks spelling and highlights words it does not recognise.",
          },
          {
            q: "Which AI assistants are built into Word and Google Docs in 2026?",
            options: [
              "Copilot in Word and Gemini in Google Docs",
              "Clippy in Word and Jeeves in Google Docs",
              "Siri in Word and Cortana in Google Docs",
              "Watson in Word and Bixby in Google Docs",
            ],
            answer: 0,
            explain: "Microsoft 365 Copilot and Google Gemini draft, summarise, rewrite and translate text inside the document.",
          },
        ],
      },
      {
        heading: "Spreadsheets",
        icon: "chart",
        flat: true,
        paragraphs: [
          "A spreadsheet is a rectangular table (or grid) of information, often financial information. The word comes from bookkeeping: ledgers were \u201cspread\u201d across two facing pages — categories of expenditure across the top, invoices down the left margin, and each amount in the cell where its row and column intersect.",
          "An electronic spreadsheet keeps that layout — rows, columns and cells — but adds formulas. A cell can hold a calculation such as =SUM(B2:B13), and when any number changes, every formula that depends on it recalculates instantly. Charts, pivot tables and conditional formatting turn the numbers into pictures and summaries.",
          "In 2026 the spreadsheets a business will meet are Microsoft Excel (Microsoft 365 — Copilot can write formulas and analyse the data for you), Google Sheets (browser-based and shared in real time) and the free LibreOffice Calc.",
        ],
        example: {
          title: "In business",
          lines: [
            "Spreadsheets carry the numbers of the business: budgets, cash-flow forecasts, price lists, quotations, sales analysis, stock counts and simple dashboards.",
            "They also answer \u201cwhat if\u201d questions — what happens to profit if a supplier raises prices 10%, or the rand weakens? — the same scenario modelling that supports the decision stages you met in Lesson 2.",
            "Effect on the business: calculations are accurate and instant, scenarios are tested before money is spent, and managers see trends in charts instead of raw figures.",
          ],
        },
        figures: [
          {
            id: "114050-spreadsheet",
            caption: "A spreadsheet — rows, columns, cells and a chart",
            hint: "screenshot of Microsoft Excel or Google Sheets showing a small business budget with a chart",
          },
        ],
        slideQuiz: [
          {
            q: "What is a spreadsheet?",
            options: [
              "A rectangular grid of information, often financial information",
              "A program for writing letters, contracts and reports",
              "A structured collection of records managed by a DBMS",
              "A tool for editing photographs and drawing illustrations",
            ],
            answer: 0,
            explain: "A spreadsheet is a rectangular table (grid) of information — very often financial information.",
          },
          {
            q: "Where does the word \u201cspreadsheet\u201d come from?",
            options: [
              "Bookkeeping ledgers spread across two facing pages",
              "The sheet of plastic spread over early computer screens",
              "A brand of accounting paper sold during the 1950s",
              "The spread of personal computers through offices",
            ],
            answer: 0,
            explain: "Ledgers were \u201cspread\u201d across facing pages — columns for expenditure, invoices down the margin, amounts in the intersecting cells.",
          },
          {
            q: "What happens when you change one number in a spreadsheet?",
            options: [
              "Every formula that depends on it recalculates instantly",
              "You must retype every calculation that used the old number",
              "The spreadsheet locks until a manager approves the change",
              "Nothing — formulas only calculate when the file is printed",
            ],
            answer: 0,
            explain: "Automatic recalculation is the spreadsheet's superpower — change an input and every dependent formula updates.",
          },
          {
            q: "Which spreadsheet applications will a business meet in 2026?",
            options: [
              "Microsoft Excel, Google Sheets and LibreOffice Calc",
              "Lotus 1-2-3, Quattro Pro and VisiCalc",
              "SuperCalc, Multiplan and Lotus Symphony",
              "MS Works, ClarisWorks and AppleWorks",
            ],
            answer: 0,
            explain: "Excel (with Copilot), Google Sheets and the free LibreOffice Calc are the 2026 line-up.",
          },
          {
            q: "How do spreadsheets support the decision stages from Lesson 2?",
            options: [
              "\u201cWhat if\u201d scenarios can be tested before money is spent",
              "They take the decision so that the manager does not have to",
              "They replace the MIS so that no other reports are needed",
              "They print each decision on letterhead for the records",
            ],
            answer: 0,
            explain: "A spreadsheet models \u201cwhat if\u201d scenarios — exactly the tool the manager uses when considering solutions.",
          },
        ],
      },
      {
        heading: "Databases",
        icon: "database",
        flat: true,
        paragraphs: [
          "A database is a structured collection of records or data stored in a computer system, so that a program — or a person using a query language — can consult it to answer questions. The records retrieved in answer to queries are information that can be used to make decisions. The computer program used to manage and query a database is the database management system (DBMS).",
          "A typical query could be: \u201cHow many burgers with two or more patties were sold in March in region 4?\u201d To answer it, the database must store information about the burgers sold — number of patties, sales date and sales region. Strictly, database means the collection of related records and DBMS means the software; in everyday use, \u201cdatabase\u201d often covers both.",
          "Every database has a schema — a structural description of the type of facts it holds and the relationships among them. The most common model is the relational model you met in Lesson 2: all information in multiple related tables of rows and columns, with relationships built through values shared between tables. Hierarchical and network models represent relationships more explicitly.",
          "The DBMSs a business will meet in 2026: Microsoft SQL Server and its cloud twin Azure SQL, the open-source PostgreSQL and MySQL, Oracle Database in large enterprises, and MongoDB where records do not fit neatly into tables. Small businesses often start with Microsoft Access or Airtable — and most new databases run in the cloud rather than on a server in the office.",
        ],
        example: {
          title: "In business",
          lines: [
            "Databases sit underneath almost every business system: customer records (the heart of CRM systems such as Salesforce and Microsoft Dynamics 365), stock and inventory, sales history, loyalty programmes, payroll and the point-of-sale itself.",
            "Effect on the business: questions that would take days with paper records — which products sell best, which customers have not bought in six months — are answered in seconds, and decisions are made on facts.",
            "Responsibility: in South Africa, POPIA requires a business to protect the personal information in its databases and to use it only for the purpose it was collected.",
          ],
        },
        figures: [
          {
            id: "114050-database",
            caption: "A database — related tables of records, queried through a DBMS",
            hint: "screenshot or diagram of a database — e.g. related tables in Microsoft Access / SQL Server, or a query returning records",
          },
        ],
        slideQuiz: [
          {
            q: "What is a database?",
            options: [
              "A structured collection of records stored so that it can be queried",
              "A grid of cells holding numbers and automatic formulas",
              "A program for creating, editing and printing documents",
              "A folder of photographs organised by the date taken",
            ],
            answer: 0,
            explain: "A database is a structured collection of records that a program or query language can consult to answer questions.",
          },
          {
            q: "What is a DBMS?",
            options: [
              "The software used to manage and query a database",
              "The person employed to type records into the system",
              "The cable that connects the database to the network",
              "The printed report produced at the end of each month",
            ],
            answer: 0,
            explain: "The database management system is the software that manages and queries the database.",
          },
          {
            q: "What is a SCHEMA?",
            options: [
              "A structural description of the facts a database holds and their relationships",
              "A password that unlocks the database for the administrator only",
              "A backup copy of the database stored safely in another building",
              "A diagram of the office showing where each computer is placed",
            ],
            answer: 0,
            explain: "The schema describes the objects represented in the database and the relationships among them.",
          },
          {
            q: "Which DBMSs will a business most likely meet in 2026?",
            options: [
              "SQL Server / Azure SQL, PostgreSQL, MySQL, Oracle and MongoDB",
              "dBase III, Paradox, FoxPro and Lotus Approach",
              "Windows Media Player, WinZip, WinRAR and Paint",
              "WordPerfect, Quattro Pro, Freelance and Organizer",
            ],
            answer: 0,
            explain: "SQL Server/Azure SQL, PostgreSQL, MySQL, Oracle and MongoDB are the mainstream 2026 database engines.",
          },
          {
            q: "What does POPIA require of a South African business?",
            options: [
              "Protect personal information and use it only for its collected purpose",
              "Publish its customer database on the internet once every year",
              "Keep all records on paper as well as inside the database",
              "Delete its entire customer database every five years",
            ],
            answer: 0,
            explain: "POPIA makes the business responsible for protecting personal information and using it only for the purpose it was collected.",
          },
        ],
      },
      {
        heading: "Graphics",
        icon: "design",
        flat: true,
        paragraphs: [
          "Computer graphics is the field concerned with digitally creating and manipulating visual content — from 2D images and photo editing to 3D models, animation and video. A broad classification of its subfields:",
        ],
        bullets: [
          "Geometry — ways to represent and process surfaces and shapes.",
          "Animation — ways to represent and manipulate motion.",
          "Rendering — algorithms that reproduce how light falls on a scene.",
          "Imaging — image acquisition and image editing.",
        ],
        cards: [
          {
            icon: "design",
            title: "Canva",
            text: "Browser-based design for social posts, flyers and presentations — the tool most small businesses actually use.",
            figId: "114050-tool-canva",
          },
          {
            icon: "design",
            title: "Adobe Photoshop & Illustrator",
            text: "Professional photo editing and vector illustration, now with Firefly generative AI built in.",
            figId: "114050-tool-adobe",
          },
          {
            icon: "layers",
            title: "Figma",
            text: "Collaborative design in the browser, from marketing graphics to app interfaces.",
            figId: "114050-tool-figma",
          },
          {
            icon: "chip",
            title: "Blender",
            text: "Free, professional 3D modelling and animation.",
            figId: "114050-tool-blender",
          },
          {
            icon: "play",
            title: "CapCut & Adobe Premiere Pro",
            text: "Video editing for adverts and social media.",
            figId: "114050-tool-video",
          },
          {
            icon: "monitor",
            title: "AI image generation",
            text: "Tools such as Firefly, DALL·E and Midjourney draft visuals from a text description — this card's artwork was generated by Midjourney.",
            figId: "114050-tool-ai",
          },
        ],
        examples: [
          {
            title: "In business",
            lines: [
              "Graphics software produces the visual face of the business: logos and branding, adverts, social-media posts, product photos, packaging, signage and presentation slides.",
              "Effect on the business: a professional image builds trust, and producing artwork in-house with tools like Canva is faster and far cheaper than outsourcing every design job.",
            ],
          },
        ],
        slideQuiz: [
          {
            q: "What is computer graphics concerned with?",
            options: [
              "Digitally creating and manipulating visual content",
              "Storing structured records so that they can be queried",
              "Calculating budgets in a grid of rows and columns",
              "Sending email between the branches of a business",
            ],
            answer: 0,
            explain: "Computer graphics digitally synthesises and manipulates visual content — 2D, 3D, animation and imaging.",
          },
          {
            q: "Which subfield of graphics deals with MOTION?",
            options: ["Animation", "Geometry", "Rendering", "Imaging"],
            answer: 0,
            explain: "Animation studies ways to represent and manipulate motion.",
          },
          {
            q: "What does RENDERING study?",
            options: [
              "Algorithms that reproduce how light falls on a scene",
              "Ways to represent and process surfaces and shapes",
              "Methods for acquiring and editing photographs",
              "Techniques for compressing video for the internet",
            ],
            answer: 0,
            explain: "Rendering studies algorithms to reproduce light transport — how light falls on a scene.",
          },
          {
            q: "Which design tool do most small businesses use for social posts and flyers?",
            options: [
              "Canva — browser-based design with ready-made templates",
              "Blender — free 3D modelling and animation software",
              "AutoCAD — technical drawing for engineers and architects",
              "Visual Studio — a programming environment for developers",
            ],
            answer: 0,
            explain: "Canva's templates let non-designers produce professional artwork in minutes — which is why small businesses love it.",
          },
          {
            q: "How does graphics software affect a business?",
            options: [
              "A professional visual image builds trust, and in-house design saves money",
              "It removes the need for the business to do any advertising at all",
              "It slows marketing down because pictures take longer than words",
              "It only matters to businesses that sell cameras and lenses",
            ],
            answer: 0,
            explain: "Professional visuals build trust — and tools like Canva make them cheap and fast to produce in-house.",
          },
        ],
      },
      {
        heading: "Integrated office suites — Microsoft 365",
        icon: "briefcase",
        flat: true,
        paragraphs: [
          "An office suite bundles the applications an office needs — word processor, spreadsheet, presentations, email — built to work together: one look and feel, one spell checker, and live links so that an Excel chart pasted into a Word report updates when the numbers change. Suites are also platforms: businesses and third parties write add-ins that extend them with custom commands and specialised features.",
          "Microsoft Office was introduced in 1989 on the Mac and in 1990 on Windows, originally as a bundle of Word, Excel and PowerPoint. Today it is Microsoft 365 — a cloud subscription rather than a boxed product.",
          "A Microsoft 365 business subscription in 2026 includes Word, Excel, PowerPoint, Outlook (email and calendar), OneNote, Teams (chat, calls and meetings), OneDrive cloud storage and SharePoint — with the Copilot AI assistant woven through all of them. Files live in the cloud, open on desktop, browser, tablet or phone, and several people can work in the same file at once.",
        ],
        example: {
          title: "In business",
          lines: [
            "One subscription per employee covers documents, spreadsheets, presentations, email, meetings and file storage — priced per user per month instead of a large once-off licence.",
            "Effect on the business: everything works together and is always up to date. A quotation drafted in Word, costed in Excel and presented in PowerPoint can be shared in Teams and signed off the same day.",
          ],
        },
        figures: [
          {
            id: "114050-office-suite",
            caption: "Microsoft 365 — one subscription, one set of tools that work together",
            hint: "collage of Microsoft 365 apps (Word, Excel, PowerPoint, Outlook, Teams, OneDrive) or the Microsoft 365 home screen",
          },
        ],
        slideQuiz: [
          {
            q: "What is an office suite?",
            options: [
              "A bundle of office applications built to work together",
              "A single program that can only edit photographs",
              "The room in which a company's servers are kept",
              "A collection of printers shared through the network",
            ],
            answer: 0,
            explain: "A suite bundles the word processor, spreadsheet, presentations and email — with a shared look and live links between them.",
          },
          {
            q: "Which three applications made up the first Microsoft Office?",
            options: [
              "Word, Excel and PowerPoint",
              "Outlook, Teams and OneDrive",
              "Access, Publisher and Visio",
              "Paint, Notepad and WordPad",
            ],
            answer: 0,
            explain: "The first Office (1989 on Mac, 1990 on Windows) bundled Word, Excel and PowerPoint.",
          },
          {
            q: "How is Microsoft 365 sold in 2026?",
            options: [
              "As a cloud subscription priced per user per month",
              "As a boxed DVD bought once from a computer shop",
              "As free software paid for by on-screen advertising",
              "As hardware built into every new laptop's keyboard",
            ],
            answer: 0,
            explain: "Microsoft 365 is a cloud subscription — per user per month, always the latest version.",
          },
          {
            q: "What advantage do LIVE LINKS between suite applications give?",
            options: [
              "An Excel chart in a Word report updates when the numbers change",
              "Word documents print faster because Excel shares its printer",
              "PowerPoint slides can never be edited by unauthorised users",
              "Outlook deletes old emails to free up space for spreadsheets",
            ],
            answer: 0,
            explain: "Linked data keeps documents current — change the spreadsheet and the chart in the report follows.",
          },
          {
            q: "Which AI assistant is woven through Microsoft 365?",
            options: ["Copilot", "Gemini", "Alexa", "Siri"],
            answer: 0,
            explain: "Copilot drafts documents, writes formulas, summarises meetings and answers questions across Microsoft 365.",
          },
        ],
      },
      {
        heading: "Other suites on the 2026 market",
        icon: "globe",
        flat: true,
        paragraphs: [
          "Microsoft 365's biggest rival is Google Workspace: Docs, Sheets, Slides, Gmail, Drive, Meet and Chat, with the Gemini AI assistant. It was designed for the web browser from day one, so real-time collaboration is its greatest strength — many start-ups and schools run on it entirely.",
          "LibreOffice (Writer, Calc, Impress and the Base database) is free and open-source, works fully offline, and opens Microsoft formats — a serious option where budgets or connectivity are tight. Other suites include Apple iWork (Pages, Numbers, Keynote), Zoho Workplace, OnlyOffice and WPS Office.",
          "Whatever the suite, file compatibility is what matters: the Microsoft formats .docx, .xlsx and .pptx are the de facto standards for exchanging editable files, and PDF is the standard for final documents. Every suite above reads and writes them.",
        ],
        example: {
          title: "Suites that came before — and what they teach us",
          lines: [
            "Lotus SmartSuite (Word Pro, the 1-2-3 spreadsheet, Freelance Graphics, the Approach database and Organizer) and Corel WordPerfect Office (WordPerfect, Quattro Pro, the Paradox database) once competed head-on with Microsoft Office.",
            "Lotus 1-2-3 — the program that put a PC on every accountant's desk in the 1980s — was discontinued in 2013; WordPerfect survives only in a small legal niche. CorelDRAW lives on, but as a graphics tool rather than an office suite.",
            "The lesson: compatibility beats features. Users would not switch away from the formats everyone else used — the same reason .docx and .xlsx still rule today.",
          ],
        },
        examples: [
          {
            title: "Choosing a suite for a business",
            lines: [
              "Cost — subscription (Microsoft 365, Google Workspace) vs free (LibreOffice).",
              "Collaboration — does the team co-author documents and meet online?",
              "Compatibility — will customers and suppliers be able to open every file you send?",
              "Connectivity — browser-first suites need reliable internet; LibreOffice does not.",
              "Skills — most staff already know Word and Excel, which lowers training costs.",
            ],
          },
        ],
        slideQuiz: [
          {
            q: "What is Google Workspace's greatest strength?",
            options: [
              "Real-time collaboration in the browser",
              "It works without any internet connection",
              "It is the only suite that can print documents",
              "It comes free with every Windows computer",
            ],
            answer: 0,
            explain: "Workspace was designed for the browser from day one — live co-editing is its signature.",
          },
          {
            q: "Why might a business choose LibreOffice?",
            options: [
              "It is free, open-source and works fully offline",
              "It is the only suite that includes a spreadsheet",
              "It includes unlimited cloud storage for every user",
              "It is required by law for South African companies",
            ],
            answer: 0,
            explain: "LibreOffice costs nothing, needs no internet connection, and still opens Microsoft formats.",
          },
          {
            q: "Which file formats are the de facto standards for exchanging editable documents?",
            options: [
              ".docx, .xlsx and .pptx",
              ".lwp, .123 and .prz",
              ".wpd, .qpw and .dbf",
              ".bmp, .wav and .exe",
            ],
            answer: 0,
            explain: "The Microsoft formats .docx, .xlsx and .pptx are the exchange standards; PDF is the standard for final documents.",
          },
          {
            q: "What happened to Lotus 1-2-3, the spreadsheet that dominated the 1980s?",
            options: [
              "It was discontinued — users would not leave the formats everyone else used",
              "It is still the world's best-selling spreadsheet program in 2026",
              "It became Google Sheets after Google purchased IBM's software",
              "It was renamed Microsoft Excel after a court settlement",
            ],
            answer: 0,
            explain: "1-2-3 was discontinued in 2013 — compatibility beats features, and the market had standardised on Microsoft's formats.",
          },
          {
            q: "Which factors matter when choosing a suite for a business?",
            options: [
              "Cost, collaboration, compatibility, connectivity and staff skills",
              "The colour of the icons and the surname of the founder",
              "Only the price — every suite is otherwise identical",
              "Whether it ships on floppy disks, CDs or DVDs",
            ],
            answer: 0,
            explain: "Weigh cost, collaboration needs, file compatibility, internet reliability and existing staff skills.",
          },
        ],
      },
      {
        heading: "How these applications serve the business",
        icon: "target",
        flat: true,
        paragraphs: [
          "Pull it all together: each family of applications has a function (what it does) and an effect (what it changes for the business). Being able to explain both — function and effect — is the outcome this lesson assesses.",
        ],
        cards: [
          {
            icon: "document",
            title: "Word processors",
            text: "Function: create, edit and share the business's documents — letters, quotes, contracts, reports. Effect: faster, error-free, on-brand paperwork, and a team finishing one copy together.",
          },
          {
            icon: "chart",
            title: "Spreadsheets",
            text: "Function: calculate, analyse and chart numbers — budgets, forecasts, price lists. Effect: accurate instant arithmetic and \u201cwhat if\u201d answers before money is committed.",
          },
          {
            icon: "database",
            title: "Databases",
            text: "Function: store and query the records the business runs on — customers, stock, sales. Effect: facts on demand for decisions, one trusted copy of the truth, POPIA-compliant custody of personal data.",
          },
          {
            icon: "design",
            title: "Graphics",
            text: "Function: create the visual face of the business — logos, adverts, social posts, product photos. Effect: a professional image that builds trust, produced in-house at low cost.",
          },
          {
            icon: "briefcase",
            title: "Integrated suites",
            text: "Function: bundle all of the above with email, meetings and cloud files that work together. Effect: one subscription, one login, shared data — and staff skills that transfer between tasks.",
          },
        ],
        example: {
          title: "Activity — Questioning (45 minutes · Self & Group)",
          lines: [
            "Open the Exercises tab and complete \u201cHow IT can be used in business\u201d.",
            "For each application family, explain its functions and the effects it has on the business — the AI marker will check your answers.",
          ],
        },
        slideQuiz: [
          {
            q: "When explaining an application for this outcome, what TWO things must you cover?",
            options: [
              "Its function (what it does) and its effect on the business",
              "Its price in rand and the year it was first released",
              "Its icon design and the colour of its splash screen",
              "Its file size on disk and the speed of its installer",
            ],
            answer: 0,
            explain: "Function and effect — what the application does, and what it changes for the business.",
          },
          {
            q: "Which application family answers \u201cwhat if\u201d questions before money is committed?",
            options: ["Spreadsheets", "Word processors", "Graphics packages", "Presentation software"],
            answer: 0,
            explain: "Spreadsheets model scenarios — change an assumption and every dependent figure recalculates.",
          },
          {
            q: "Which application family is the trusted store of customers, stock and sales records?",
            options: ["Databases", "Word processors", "Spreadsheets", "Graphics packages"],
            answer: 0,
            explain: "Databases hold the business's records and answer queries in seconds.",
          },
          {
            q: "Which application family produces the visual face of the business?",
            options: ["Graphics packages", "Databases", "Spreadsheets", "Email clients"],
            answer: 0,
            explain: "Graphics tools produce the logos, adverts, posts and photos that customers see.",
          },
          {
            q: "What is the effect of adopting an integrated office suite?",
            options: [
              "One subscription with shared data and skills that transfer between tasks",
              "The business no longer needs anyone in its accounts department",
              "Documents can never again be sent to people outside the business",
              "Each application must be bought separately from a different vendor",
            ],
            answer: 0,
            explain: "A suite means one subscription, one login, applications that share data — and skills that carry across.",
          },
        ],
      },
      {
        heading: "From data to wisdom",
        icon: "gradcap",
        flat: true,
        lessonStart: { n: 4, title: "Explain the relationship between a business and its data requirements" },
        paragraphs: [
          "Welcome to Lesson 4 — the final lesson of this unit: the relationship between a business and its information needs. Time: 90 minutes · Activity: Self & Group.",
          "No field of activity attracts more attention than knowledge management — yet few sources clearly define what knowledge actually is, and how it differs from data, information and wisdom. To understand one of them, you have to understand all of them.",
          "According to Russell Ackoff, a systems theorist and professor of organisational change, the content of the human mind can be classified into five categories:",
        ],
        cards: [
          {
            icon: "database",
            title: "Data",
            text: "Symbols — raw facts with no significance beyond their existence.",
          },
          {
            icon: "chart",
            title: "Information",
            text: "Data processed to be useful; answers \u201cwho\u201d, \u201cwhat\u201d, \u201cwhere\u201d and \u201cwhen\u201d questions.",
          },
          {
            icon: "book",
            title: "Knowledge",
            text: "The application of data and information; answers \u201chow\u201d questions.",
          },
          {
            icon: "search",
            title: "Understanding",
            text: "Appreciation of \u201cwhy\u201d — it supports the move from each level to the next.",
          },
          {
            icon: "gradcap",
            title: "Wisdom",
            text: "Evaluated understanding — the only category that deals with the future, because it incorporates vision and design.",
          },
        ],
        example: {
          title: "Past and future",
          lines: [
            "The first four categories relate to the past — they deal with what has been or what is known.",
            "Only wisdom deals with the future: with wisdom, people can create the future rather than just grasp the present and past. But achieving wisdom is not easy — people must move successively through the other categories.",
          ],
        },
        figures: [
          {
            id: "114050-dikw-pyramid",
            caption: "The journey from data to wisdom — understanding supports each transition",
            hint: "DIKW pyramid or staircase diagram: data \u2192 information \u2192 knowledge \u2192 wisdom",
          },
        ],
        slideQuiz: [
          {
            q: "According to Ackoff, what is DATA?",
            options: [
              "Symbols — raw facts with no significance beyond their existence",
              "Evaluated understanding that incorporates vision and design",
              "The appropriate collection of information intended to be useful",
              "The appreciation of \u201cwhy\u201d that connects the other levels",
            ],
            answer: 0,
            explain: "Data is symbols — raw, it simply exists, with no meaning of itself.",
          },
          {
            q: "Which questions does INFORMATION answer?",
            options: [
              "\u201cWho\u201d, \u201cwhat\u201d, \u201cwhere\u201d and \u201cwhen\u201d",
              "Only \u201chow\u201d and never anything else",
              "Only \u201cwhy\u201d and never anything else",
              "Questions that have no humanly-known answers",
            ],
            answer: 0,
            explain: "Information is data processed to be useful — it answers who, what, where and when.",
          },
          {
            q: "KNOWLEDGE answers which kind of question?",
            options: [
              "\u201cHow\u201d questions — the application of data and information",
              "\u201cWhen\u201d questions — the timing of events in the business",
              "\u201cWhere\u201d questions — the location of the organisation's assets",
              "No questions — knowledge cannot be put into words at all",
            ],
            answer: 0,
            explain: "Knowledge is the application of data and information; it answers \u201chow\u201d questions.",
          },
          {
            q: "Which is the ONLY category that deals with the future?",
            options: [
              "Wisdom — it incorporates vision and design",
              "Data — symbols always describe what is still to come",
              "Information — the who/what/where/when of tomorrow",
              "Knowledge — memorised answers predict everything",
            ],
            answer: 0,
            explain: "The first four categories deal with the past; only wisdom deals with the future.",
          },
          {
            q: "How is wisdom achieved?",
            options: [
              "By moving successively through the other categories",
              "By purchasing a sufficiently powerful computer system",
              "By memorising every entry in a very large database",
              "By skipping understanding and jumping straight to it",
            ],
            answer: 0,
            explain: "Achieving wisdom is not easy — people must move successively through data, information, knowledge and understanding.",
          },
        ],
      },
      {
        heading: "Data and information",
        icon: "database",
        flat: true,
        paragraphs: [
          "Data is raw. It simply exists and has no significance beyond its existence. It can exist in any form, usable or not, and it does not have meaning of itself. In computer terms, a spreadsheet generally starts out by holding data.",
          "Information is data that has been given meaning by way of relational connection. This meaning can be useful — but does not have to be. In computer terms, a relational database makes information from the data stored within it.",
        ],
        example: {
          title: "The weather example",
          lines: [
            "Data — a fact or statement of an event without relation to other things: \u201cIt is raining.\u201d",
            "Information — embodies the understanding of a relationship, possibly cause and effect: \u201cThe temperature dropped 15 degrees and then it started raining.\u201d",
          ],
        },
        slideQuiz: [
          {
            q: "What gives DATA meaning, turning it into information?",
            options: [
              "Relational connection — relating it to other things",
              "Printing it out on paper and filing it in a cabinet",
              "Storing it twice so that it can never be lost",
              "Converting it into capital letters and bold type",
            ],
            answer: 0,
            explain: "Information is data that has been given meaning by way of relational connection.",
          },
          {
            q: "In computer terms, what generally starts out by holding DATA?",
            options: ["A spreadsheet", "A firewall", "A printer", "A web browser"],
            answer: 0,
            explain: "A spreadsheet generally starts out by holding raw data.",
          },
          {
            q: "In computer terms, what makes INFORMATION from stored data?",
            options: [
              "A relational database",
              "A screen saver",
              "A paper shredder",
              "An extension cable",
            ],
            answer: 0,
            explain: "A relational database makes information from the data stored within it — by connecting it.",
          },
          {
            q: "\u201cIt is raining\u201d is an example of…",
            options: [
              "Data — a fact without relation to other things",
              "Wisdom — a systemic grasp of the whole weather cycle",
              "Knowledge — a pattern that predicts what happens next",
              "Understanding — the appreciation of why the sky is grey",
            ],
            answer: 0,
            explain: "A bare fact, unrelated to anything else, is data.",
          },
          {
            q: "\u201cThe temperature dropped 15 degrees and then it started raining\u201d is…",
            options: [
              "Information — a relationship, possibly cause and effect",
              "Noise — two unrelated statements placed side by side",
              "Wisdom — an evaluated understanding of the atmosphere",
              "Data — a symbol with no significance beyond existing",
            ],
            answer: 0,
            explain: "Relating the temperature drop to the rain embodies a relationship — that is information.",
          },
        ],
      },
      {
        heading: "Knowledge, understanding and wisdom",
        icon: "book",
        flat: true,
        paragraphs: [
          "Knowledge is the appropriate collection of information, such that its intent is to be useful. Knowledge is a deterministic process: when someone memorises information, they have amassed knowledge — useful to them, but it does not by itself infer further knowledge. School children memorise the times table: they can tell you 2 × 2 = 4, but asked 1267 × 300 they cannot respond, because that entry is not in their table.",
          "Understanding is an interpolative, probabilistic, cognitive and analytical process — the ability to take knowledge and synthesise new knowledge from it. The difference between understanding and knowledge is the difference between learning and memorising. In computer terms, AI systems possess understanding: they synthesise new knowledge from previously stored information — in 2026, generative AI assistants like Copilot and Gemini do exactly this at scale.",
          "Wisdom is an extrapolative, non-deterministic, non-probabilistic process. It calls upon all the previous levels — and on uniquely human programming such as moral and ethical codes. It asks questions to which there is no easily-achievable answer, and it is how we judge between right and wrong, good and bad. The authors' view: computers do not have, and will never have, wisdom — it resides as much in the heart as in the mind.",
        ],
        example: {
          title: "The weather example, continued",
          lines: [
            "Knowledge — a pattern that connects and predicts: \u201cIf the humidity is very high and the temperature drops substantially, the atmosphere is often unlikely to hold the moisture — so it rains.\u201d",
            "Wisdom — grasps the fundamental principles behind the knowledge; it is essentially systemic: \u201cIt rains because it rains\u201d — an understanding of all the interactions between raining, evaporation, air currents and temperature gradients.",
          ],
        },
        slideQuiz: [
          {
            q: "Why can a child who memorised the times table not answer 1267 × 300?",
            options: [
              "That entry is not in their table — they memorised, but do not yet understand",
              "The answer changes every year, so no table could ever contain it",
              "Times tables are secret and children may not see the big entries",
              "Multiplication of large numbers is impossible without a computer",
            ],
            answer: 0,
            explain: "Memorised knowledge only covers what was memorised — answering beyond it needs understanding.",
          },
          {
            q: "The difference between understanding and knowledge is the difference between…",
            options: [
              "Learning and memorising",
              "Reading and writing",
              "Hardware and software",
              "Speaking and listening",
            ],
            answer: 0,
            explain: "Understanding synthesises new knowledge from what is known — learning, not just memorising.",
          },
          {
            q: "In computer terms, which systems possess UNDERSTANDING?",
            options: [
              "AI systems — they synthesise new knowledge from stored information",
              "Screen savers — they activate when the computer becomes idle",
              "Printers — they convert digital documents into paper copies",
              "Extension cables — they carry power to wherever it is needed",
            ],
            answer: 0,
            explain: "AI systems synthesise new knowledge from previously stored information and knowledge — in 2026, generative AI does this at scale.",
          },
          {
            q: "What does WISDOM call upon that the other levels do not?",
            options: [
              "Uniquely human programming — moral and ethical codes",
              "A faster processor and considerably more memory",
              "A larger times table with many more entries",
              "A reliable connection to the internet at all times",
            ],
            answer: 0,
            explain: "Wisdom calls on moral and ethical codes — it is how we judge right from wrong.",
          },
          {
            q: "What is the authors' view on computers and wisdom?",
            options: [
              "Computers do not have, and will never have, wisdom",
              "Computers achieved wisdom when AI systems first appeared",
              "Computers will gain wisdom once they can beat us at chess",
              "Computers are already wiser than every living human being",
            ],
            answer: 0,
            explain: "Wisdom is seen as uniquely human — it resides as much in the heart as in the mind.",
          },
        ],
      },
      {
        heading: "When is a pattern knowledge — and when is it noise?",
        icon: "search",
        flat: true,
        paragraphs: [
          "There is still a question: when is a pattern knowledge, and when is it noise? Consider: \u201cAbugt dbesbt regtc uatn s uitrzt. ubtxte pstye ysote anet sser extess…\u201d To you this sequence is 100% novelty — equivalent to noise. There is no foundation for you to connect with the pattern. Yet to someone who knows the translation, the statements are Newton's three laws of motion. Is something knowledge if you can't understand it?",
          "Now consider a different sequence: I have a box. It is 3 feet wide, 3 feet deep and 6 feet high. It is very heavy, with a door on the front. When I open it, there is food inside. It is colder inside than outside. You usually find it in the kitchen. There is a smaller compartment with ice in it. When you open the door, a light comes on. When you move it, you usually find dirt underneath — and junk collects on top.",
          "What is it? A refrigerator — you knew, because at some point you connected with the pattern; every further statement only confirmed your understanding. In a society that had never seen a refrigerator, you might still be scratching your head.",
        ],
        example: {
          title: "The point for business",
          lines: [
            "Information only becomes knowledge when the receiver can connect it to a pattern they understand.",
            "That is why businesses must present information in the language and context of the people who must use it — a dashboard nobody understands is noise, however accurate its data.",
          ],
        },
        slideQuiz: [
          {
            q: "Why does the scrambled text read as NOISE?",
            options: [
              "There is no foundation for you to connect with the pattern",
              "It is printed in a font that is too small to read comfortably",
              "It contains numbers as well as letters mixed close together",
              "It was written by a computer rather than a human author",
            ],
            answer: 0,
            explain: "100% novelty is equivalent to noise — without a foundation, you cannot connect with the pattern.",
          },
          {
            q: "What was the scrambled text actually?",
            options: [
              "Newton's three laws of motion, in translation",
              "The recipe for a traditional South African stew",
              "A list of the world's ten longest rivers",
              "The opening page of a well-known novel",
            ],
            answer: 0,
            explain: "To someone who knows the translation, the lines are Newton's three laws — knowledge you could not access.",
          },
          {
            q: "At what point did the box description become knowledge for you?",
            options: [
              "When you connected with the pattern and recognised a refrigerator",
              "Only after all eleven statements had been read out in full",
              "It never became knowledge — the description stayed noise",
              "When the box's exact colour was finally revealed",
            ],
            answer: 0,
            explain: "Once you connected with the pattern, each further statement only added confirmation.",
          },
          {
            q: "Why might the same description stay meaningless to someone else?",
            options: [
              "Their society may never have seen a refrigerator",
              "Descriptions can only be understood by their author",
              "Boxes cannot be described accurately in words",
              "They would need the description in capital letters",
            ],
            answer: 0,
            explain: "Without the concept, there is no pattern to connect with — the sequence stays noise.",
          },
          {
            q: "What does this teach a business about presenting information?",
            options: [
              "Present it in the language and context of the people who must use it",
              "Present as much raw data as possible and let everyone dig through it",
              "Keep dashboards deliberately complex so they appear professional",
              "Only senior managers should ever see the business's information",
            ],
            answer: 0,
            explain: "A dashboard nobody understands is noise — information must connect to patterns its users understand.",
          },
        ],
      },
      {
        heading: "Communication in decision making",
        icon: "chat",
        flat: true,
        paragraphs: [
          "Decision making is the cognitive process leading to the selection of a course of action among variations. Every decision-making process produces a final choice — an action or an opinion. It begins when we need to do something but know not what. Decision making is therefore a reasoning process, which can be rational or irrational, and can be based on explicit or tacit assumptions.",
          "Structured, rational decision making is an important part of all science-based professions, where specialists apply their knowledge to make informed decisions — for example, medical decision making often involves making a diagnosis and then selecting an appropriate treatment.",
          "Research using naturalistic methods shows, however, that under higher time pressure, higher stakes or increased ambiguity, experts use intuitive decision making rather than structured approaches — recognition-primed decisions that fit a set of indicators into the expert's experience to arrive immediately at a satisfactory course of action without weighing alternatives. Recent robust-decision efforts also formally integrate uncertainty into the process.",
        ],
        slideQuiz: [
          {
            q: "What is DECISION MAKING?",
            options: [
              "The cognitive process of selecting a course of action among variations",
              "The accounting process of balancing debits against credits",
              "The manufacturing process of assembling parts into products",
              "The marketing process of designing an advertising campaign",
            ],
            answer: 0,
            explain: "Decision making selects a course of action among variations, producing a final choice.",
          },
          {
            q: "Every decision-making process produces…",
            options: [
              "A final choice — an action or an opinion",
              "A profit for the organisation, without exception",
              "A written report of at least twenty pages",
              "A committee to review the decision annually",
            ],
            answer: 0,
            explain: "The output of decision making is a final choice — it can be an action or an opinion.",
          },
          {
            q: "Decision making can be based on which kinds of assumptions?",
            options: [
              "Explicit assumptions or tacit assumptions",
              "Only assumptions written into company policy",
              "Only assumptions approved by the board",
              "No assumptions — decisions never rest on them",
            ],
            answer: 0,
            explain: "The reasoning can be rational or irrational, resting on explicit or tacit assumptions.",
          },
          {
            q: "What does medical decision making typically involve?",
            options: [
              "Making a diagnosis and selecting an appropriate treatment",
              "Choosing the cheapest medicine available on the shelf",
              "Asking the patient to decide the treatment on their own",
              "Repeating the same treatment for every single patient",
            ],
            answer: 0,
            explain: "A science-based profession: specialists apply knowledge — diagnose, then select treatment.",
          },
          {
            q: "Under time pressure and high stakes, experts tend to…",
            options: [
              "Use intuitive, recognition-primed decisions from experience",
              "Stop working entirely until the pressure has subsided",
              "Always convene a committee before any action is taken",
              "Weigh every alternative exhaustively before moving",
            ],
            answer: 0,
            explain: "Recognition-primed decision making fits indicators into experience for an immediate, satisfactory course of action.",
          },
        ],
      },
      {
        heading: "Price control",
        icon: "trend",
        flat: true,
        paragraphs: [
          "A free price system (the price mechanism) is an economic system where prices are set by the interchange of supply and demand. The resulting prices are signals, communicated between producers and consumers, which guide the production and distribution of resources: supplies are rationed, income is distributed and resources are allocated.",
          "A free price system contrasts with a controlled or fixed price system, where prices are set by government within a controlled market or planned economy.",
          "The price control of an organisation is largely governed by other organisations and the prices they charge for similar products and services. Communication between the pricing, costing and manufacturing departments is essential to ensure goods or services can be rendered at the same or better price than competitors — so the organisation can sell to its market.",
        ],
        slideQuiz: [
          {
            q: "In a FREE price system, prices are set by…",
            options: [
              "The interchange of supply and demand",
              "The government within a planned economy",
              "The oldest business in each industry",
              "A yearly vote among all the customers",
            ],
            answer: 0,
            explain: "The free price mechanism sets prices through supply and demand.",
          },
          {
            q: "In a free price system, prices act as…",
            options: [
              "Signals between producers and consumers guiding production and distribution",
              "Fixed values that never change once they are first printed",
              "Penalties issued to businesses that produce too much stock",
              "Decorations with no effect on how resources are allocated",
            ],
            answer: 0,
            explain: "Prices are signals — they ration supplies, distribute income and allocate resources.",
          },
          {
            q: "In a CONTROLLED or fixed price system, prices are set by…",
            options: [
              "Government, within a controlled market or planned economy",
              "Whichever business has the largest advertising budget",
              "The interchange of supply and demand on open markets",
              "International tourists visiting the country each season",
            ],
            answer: 0,
            explain: "Controlled systems fix prices by government decision rather than by the market.",
          },
          {
            q: "What largely governs an organisation's own pricing?",
            options: [
              "Other organisations' prices for similar products and services",
              "The personal preferences of the organisation's founder",
              "The weather conditions in the month the price is set",
              "The number of employees on the payroll that year",
            ],
            answer: 0,
            explain: "Competitors' prices for similar products and services largely govern the organisation's price control.",
          },
          {
            q: "Which departments must communicate for competitive pricing?",
            options: [
              "Pricing, costing and manufacturing",
              "Reception, catering and security",
              "Legal, archiving and janitorial",
              "Recruitment, payroll and training",
            ],
            answer: 0,
            explain: "Pricing, costing and manufacturing must talk so goods sell at the same or better price than competitors.",
          },
        ],
      },
      {
        heading: "Quality control",
        icon: "shield",
        flat: true,
        paragraphs: [
          "In engineering and manufacturing, quality control and quality engineering develop systems to ensure products or services are designed and produced to meet or exceed customer requirements — often together with other business and engineering disciplines in a cross-functional approach.",
          "Quality assurance covers all activities from design, development, production and installation to servicing and documentation. It introduced the rules \u201cfit for purpose\u201d and \u201cdo it right the first time\u201d, and includes regulating the quality of raw materials, assemblies, products and components; services related to production; and management, production and inspection processes.",
          "This function exists to ensure the quality of products or services is in line with — if not above — the level of competitors. Communication is highly required: competitors' items are checked and measured against the organisation's own quality.",
        ],
        cards: [
          { icon: "target", title: "Plan", text: "Decide the objective and the process needed to deliver it." },
          { icon: "wrench", title: "Do", text: "Carry out the plan and collect data along the way." },
          { icon: "search", title: "Check", text: "Measure the results against the expected outcome." },
          { icon: "check", title: "Act", text: "Correct the differences and standardise what worked." },
        ],
        example: {
          title: "PDCA",
          lines: [
            "One of the most widely used paradigms for QA management is the PDCA approach: Plan – Do – Check – Act.",
          ],
        },
        slideQuiz: [
          {
            q: "What do quality control systems ensure?",
            options: [
              "Products and services meet or exceed customer requirements",
              "Products are always the cheapest available on the market",
              "Services are rendered only to long-standing customers",
              "Factories operate every day of the year without pause",
            ],
            answer: 0,
            explain: "QC and quality engineering ensure products or services meet or exceed customer requirements.",
          },
          {
            q: "Which activities does QUALITY ASSURANCE cover?",
            options: [
              "Design, development, production, installation, servicing and documentation",
              "Only the final inspection immediately before an item is shipped",
              "Only the marketing and advertising of the finished product",
              "Only the recruitment and training of production staff",
            ],
            answer: 0,
            explain: "QA covers everything from design through documentation — the whole life of the product.",
          },
          {
            q: "Which two rules did quality assurance introduce?",
            options: [
              "\u201cFit for purpose\u201d and \u201cdo it right the first time\u201d",
              "\u201cThe customer is always right\u201d and \u201cnever give refunds\u201d",
              "\u201cCheapest wins\u201d and \u201cship now, fix problems later\u201d",
              "\u201cMeasure twice\u201d and \u201conly inspect on Mondays\u201d",
            ],
            answer: 0,
            explain: "QA introduced \u201cfit for purpose\u201d and \u201cdo it right the first time\u201d.",
          },
          {
            q: "What does PDCA stand for?",
            options: [
              "Plan – Do – Check – Act",
              "Price – Discount – Cost – Audit",
              "Produce – Deliver – Collect – Advertise",
              "Prepare – Design – Create – Approve",
            ],
            answer: 0,
            explain: "PDCA — Plan, Do, Check, Act — is one of the most widely used QA management paradigms.",
          },
          {
            q: "Why is communication required in quality control?",
            options: [
              "Competitors' items are checked and measured against the organisation's quality",
              "Quality inspectors may never speak to the production department",
              "Customers must approve each unit before it leaves the factory",
              "The government sets every quality standard in every industry",
            ],
            answer: 0,
            explain: "The organisation measures its quality against competitors — that comparison needs communication.",
          },
        ],
      },
      {
        heading: "Marketing and business performance",
        icon: "people",
        flat: true,
        paragraphs: [
          "Marketing is done by means of meetings between the research & development department and the sales & marketing departments. This interaction ensures new products are fully understood by the marketing department, which can then market them to consumers and increase sales. The process is two-way: marketing surveys current clients to hear what they want, then returns to R&D to configure or manufacture the products and services clients are requesting.",
          "Business performance management (BPM) is a set of processes that help organisations optimise their business performance — a framework for organising, automating and analysing the methodologies, metrics, processes and systems that drive performance. BPM is seen as the next generation of business intelligence (BI).",
          "BPM helps businesses make efficient use of their financial, human, material and other resources. Performance areas are analysed by various individuals and departments to understand what the performing tools are — and to apply the same tools where the business performs less well, ensuring growth. Communication here is of utmost importance: all views, opinions and input are required to make educated decisions.",
        ],
        slideQuiz: [
          {
            q: "Which departments meet to make marketing work?",
            options: [
              "Research & development with sales & marketing",
              "Security and catering with facilities management",
              "The legal department with the janitorial service",
              "Reception with the archives and the mail room",
            ],
            answer: 0,
            explain: "R&D and sales & marketing meet so new products are fully understood before being marketed.",
          },
          {
            q: "Why is the marketing process TWO-WAY?",
            options: [
              "Surveys of clients flow back to R&D to build what clients request",
              "Every advert must be printed in two different languages",
              "Marketing staff swap desks with production staff monthly",
              "Each product is marketed twice — once locally, once abroad",
            ],
            answer: 0,
            explain: "Marketing surveys clients, hears what they want, and returns to R&D to configure it.",
          },
          {
            q: "What is business performance management (BPM)?",
            options: [
              "Processes that help organisations optimise their business performance",
              "A payroll system that calculates overtime for factory workers",
              "A legal requirement to publish accounts every three months",
              "A brand of accounting software sold in the early nineties",
            ],
            answer: 0,
            explain: "BPM organises, automates and analyses the methodologies, metrics, processes and systems that drive performance.",
          },
          {
            q: "BPM is seen as the next generation of…",
            options: [
              "Business intelligence (BI)",
              "Batch processing (BP)",
              "Word processing (WP)",
              "Desktop publishing (DTP)",
            ],
            answer: 0,
            explain: "BPM is seen as the next generation of business intelligence.",
          },
          {
            q: "How does a business use its performance analysis to grow?",
            options: [
              "Apply the tools from performing areas to the areas performing less well",
              "Close every department whose results fall below the average",
              "Keep the analysis secret so competitors cannot copy it",
              "Reward only the single best-performing employee each year",
            ],
            answer: 0,
            explain: "Understand what the performing tools are — then use them where the business performs less well.",
          },
        ],
      },
      {
        heading: "Protecting the information — threats and sub-systems",
        icon: "lock",
        flat: true,
        paragraphs: [
          "The information a business gathers is valuable — which means it faces threats. The three classics you must be able to explain:",
        ],
        cards: [
          {
            icon: "lock",
            title: "Unauthorised access",
            text: "Outsiders (hackers) or insiders reading data they have no right to see. Defences: passwords and multi-factor authentication, access rights per role, encryption — and POPIA makes protecting personal information a legal duty.",
          },
          {
            icon: "shield",
            title: "Viruses and malware",
            text: "Malicious software that corrupts, steals or destroys data — in 2026 above all ransomware, arriving through phishing email. Defences: antivirus, updates and patches, backups, and staff who think before they click.",
          },
          {
            icon: "person",
            title: "Disgruntled staff",
            text: "Insiders who damage, leak or delete data deliberately. Defences: least-privilege access, audit trails of who did what, and immediately removing access when someone leaves.",
          },
        ],
        examples: [
          {
            title: "Who needs what — the information needs of the sub-systems",
            lines: [
              "HR (employment) — employee records, contracts, leave and attendance, payslips, performance reviews.",
              "Production (manufacture) — orders, raw-material stock, production schedules, quality measurements.",
              "Marketing (branding) — brand assets, campaign results, customer feedback and survey data.",
              "Financial (cash flow) — invoices, payments, debtors and creditors, cash-flow forecasts, budgets.",
            ],
          },
          {
            title: "Activity — Questioning (Self & Group)",
            lines: [
              "Open the Exercises tab and complete \u201cThe relationship between a business and its information needs\u201d.",
              "You will explain how a business uses data, converts it to information, applies it in its roles, guards it against threats — and what each sub-system needs. The AI marker checks your answers.",
            ],
          },
        ],
        figures: [
          {
            id: "114050-data-threats",
            caption: "Threats to business information — and the defences against them",
            hint: "diagram or photo illustrating data security threats: hacker / phishing email / ransomware warning screen",
          },
        ],
        slideQuiz: [
          {
            q: "What is UNAUTHORISED ACCESS?",
            options: [
              "Outsiders or insiders reading data they have no right to see",
              "Logging into your own account from a different computer",
              "Opening the office before the official working hours",
              "Reading the company newsletter without subscribing",
            ],
            answer: 0,
            explain: "Unauthorised access is any access to data by someone without the right to it — hacker or insider.",
          },
          {
            q: "Which malware threat dominates in 2026, and how does it usually arrive?",
            options: [
              "Ransomware — usually arriving through phishing email",
              "Floppy-disk boot viruses passed around by couriers",
              "Fax-machine worms spreading over telephone lines",
              "Screen savers that slowly fade the office monitors",
            ],
            answer: 0,
            explain: "Ransomware delivered by phishing is the defining malware threat — backups and cautious staff are key defences.",
          },
          {
            q: "Which defences fit the DISGRUNTLED STAFF threat?",
            options: [
              "Least-privilege access, audit trails, and removing access when someone leaves",
              "Banning all employees from ever using the company's computers",
              "Keeping no records at all so there is nothing anyone can leak",
              "Trusting everyone equally and never reviewing what they do",
            ],
            answer: 0,
            explain: "Limit what each person can touch, log what they do, and cut access immediately at exit.",
          },
          {
            q: "Which information does the FINANCIAL sub-system need?",
            options: [
              "Invoices, payments, debtors and creditors, cash-flow forecasts",
              "Raw-material stock levels and production schedules",
              "Brand assets and the results of marketing campaigns",
              "Leave records, contracts and performance reviews",
            ],
            answer: 0,
            explain: "Finance runs on invoices, payments, debtors/creditors and the cash-flow forecast.",
          },
          {
            q: "Which information does the HR sub-system need?",
            options: [
              "Employee records, contracts, leave, payslips and reviews",
              "Machine maintenance logs and factory floor layouts",
              "Competitors' price lists and market-share reports",
              "Delivery routes and the fuel usage of the fleet",
            ],
            answer: 0,
            explain: "HR needs the employment information — records, contracts, leave and attendance, payslips, reviews.",
          },
        ],
      },
    ],

    exercises: [
      {
        id: "qs114050b",
        title: "Questioning — Principles of business and the role of information technology",
        task: "Time: 45 minutes · Activity: Self & Group",
        steps: [
          "Explain the following type of company — Sole trader",
          "Explain the following type of company — Partnership",
          "Explain the following type of company — Limited Co",
          "Explain the following type of company — Private Co",
          "Explain the following type of company — Public Ltd Company",
          "Explain how these companies interact with their clients with regards to — Buying & Selling activities",
          "Explain how these companies interact with their clients with regards to — Profit",
          "Explain how these companies interact with their clients with regards to — Charity",
          "Explain how these companies interact with their clients with regards to — Social Clubs",
          "Explain these businesses activities and the environment within which such businesses operate",
        ],
        checks: [
          {
            answer: [
              "A sole trader is owned by one person — there are no partners or co-owners.",
              "No formal registration, administration or termination is needed and no statutes regulate sole owners.",
              "If the business becomes insolvent, the owner personally becomes insolvent.",
            ],
            concepts: [
              ["one person", "one owner", "no partners", "single owner", "on your own"],
              ["no registration", "no formal registration", "not registered", "no statutes"],
              ["personally insolvent", "personal insolvency", "personally liable", "personal risk"],
            ],
            labels: [
              "One owner — no partners or co-owners",
              "No formal registration needed",
              "Owner personally insolvent if the business fails",
            ],
            min: 2,
          },
          {
            answer: [
              "A partnership is a business association between people who intend making and sharing profits.",
              "It has a minimum of two and a maximum of 20 partners and is not a legal person.",
              "Partners are jointly and severally liable for the partnership's debts.",
            ],
            concepts: [
              ["sharing profits", "share profits", "making and sharing", "association"],
              ["two", "twenty", "not a legal person"],
              ["jointly and severally", "liable for", "debts"],
            ],
            labels: [
              "Association to make and share profits",
              "Two to 20 partners — not a legal person",
              "Partners jointly and severally liable",
            ],
            min: 2,
          },
          {
            answer: [
              "A limited company is registered under the Companies Act (Act 61 of 1973) and is a legal person separate from its owners.",
              "It eliminates unlimited liability — the shareholders' liability is limited.",
              "It improves the business's ability to acquire capital.",
            ],
            concepts: [
              ["companies act", "legal person", "act 61", "registered company"],
              ["limited liability", "liability is limited", "unlimited liability"],
              ["capital", "raise money", "funding"],
            ],
            labels: [
              "Registered under the Companies Act — a legal person",
              "Limits the owners' liability",
              "Better able to acquire capital",
            ],
            min: 2,
          },
          {
            answer: [
              "A private company has between one and 50 members (shareholders) and at least one director.",
              "Its shares may not be offered to the general public and transfers need the board of directors' consent.",
              "Its name ends with (Pty) Ltd and it is subject to fewer legal requirements.",
            ],
            concepts: [
              ["fifty", "50", "one director"],
              ["not be offered", "may not offer", "board", "consent"],
              ["pty", "proprietary", "fewer requirements", "less requirements"],
            ],
            labels: [
              "One to 50 shareholders, at least one director",
              "Shares not offered to the public — board consent to transfer",
              "Name ends (Pty) Ltd — fewer requirements",
            ],
            min: 2,
          },
          {
            answer: [
              "A public company has at least seven members (shareholders) and at least two directors.",
              "Its shares may be offered to the general public and are freely transferable.",
              "Its name ends with Ltd and it is subject to numerous legal requirements and limitations.",
            ],
            concepts: [
              ["seven", "two directors"],
              ["general public", "freely transferable", "offered to the public"],
              ["ltd", "limited", "numerous requirements"],
            ],
            labels: [
              "At least seven members and two directors",
              "Shares offered to the public — freely transferable",
              "Name ends Ltd — numerous requirements",
            ],
            min: 2,
          },
          {
            answer: [
              "Buying and selling is the core trading activity — the business buys goods or services from suppliers and sells them to its clients.",
              "The business interacts with clients by offering goods or services at prices clients are prepared to pay.",
            ],
            concepts: [
              ["buying", "selling", "trade", "trading"],
              ["clients", "customers", "prices", "goods or services"],
            ],
            labels: [
              "Core trading activity — buying and selling",
              "Serving clients with goods or services at a price",
            ],
            min: 1,
          },
          {
            answer: [
              "Businesses charge clients more for goods or services than they cost, so profit is made from serving clients.",
              "Some businesses aim for profit maximisation while others are satisfied with enough profit to keep the owners comfortable.",
            ],
            concepts: [
              ["profit", "charge", "more than they cost"],
              ["maximisation", "maximise", "satisfying", "comfortable"],
            ],
            labels: [
              "Profit is earned from serving clients",
              "Profit maximisation vs profit satisfying",
            ],
            min: 1,
          },
          {
            answer: [
              "Charities interact with their clients to raise funds and provide help — their aims and objectives are led by the beliefs they stand for, not by profit.",
            ],
            concepts: [["charity", "charitable", "beliefs", "not for profit", "help"]],
            labels: ["Charitable purpose — led by beliefs, not profit"],
            min: 1,
          },
          {
            answer: [
              "Social clubs exist to provide a service to their members rather than to make a profit — the members are the clients.",
            ],
            concepts: [["social club", "members", "service"]],
            labels: ["A service to members rather than profit"],
            min: 1,
          },
          {
            answer: [
              "Businesses operate within a market — there must be a need for the business, and you must know who the clients are, how big the market is and whether it is growing or stagnant.",
              "They operate within a competitive environment — who the competitors are, how close they are and whether they are flourishing.",
              "They operate within an economic and resource environment — capital requirements, premises or working from home, staffing, working hours and the risks involved.",
            ],
            concepts: [
              ["market", "need", "clients", "customers", "growing"],
              ["competition", "competitors"],
              ["capital", "premises", "risk", "staffing", "working hours"],
            ],
            labels: [
              "The market and its size",
              "The competition",
              "Capital, premises, staffing and risk",
            ],
            min: 2,
          },
        ],
      },
      {
        id: "qs114050sys",
        title: "Questioning — Systems theory with respect to information systems",
        task: "Time: 90 minutes · Activity: Self & Group",
        steps: [
          "Explain the concept of a system, making reference to whole or parts in an orderly arrangement according to a plan",
          "Explain the theoretical components of systems (Input–Process–Output)",
          "Distinguish between three different types of information systems — Type 1: Transaction Processing System (TPS)",
          "Distinguish between three different types of information systems — Type 2: Knowledge Work System (KWS)",
          "Distinguish between three different types of information systems — Type 3: Management Information System (MIS)",
        ],
        checks: [
          {
            answer: [
              "A system is a whole made up of parts that work together.",
              "The parts are put together in an orderly arrangement according to a plan, to achieve a purpose.",
            ],
            concepts: [
              ["whole", "parts"],
              ["orderly", "arrangement", "plan", "purpose"],
            ],
            labels: [
              "A whole made up of parts",
              "Orderly arrangement according to a plan",
            ],
            min: 2,
          },
          {
            answer: [
              "Input — the system takes in resources such as labour, money, materials, equipment or data from its environment.",
              "Process — the system converts or transforms the inputs into something useful.",
              "Output — the system delivers the useful products, goods, services or information to its customers.",
            ],
            concepts: [
              ["input", "takes in", "resources"],
              ["process", "convert", "transform"],
              ["output", "delivers", "products", "services"],
            ],
            labels: ["Input", "Process", "Output"],
            min: 3,
          },
          {
            answer: [
              "A Transaction Processing System collects, stores, modifies and retrieves the transactions of an organisation.",
              "A transaction is an event that generates or modifies data that is eventually stored in the information system.",
              "A TPS must pass the ACID test and offer rapid response, reliability and consistent, controlled (inflexible) processing.",
            ],
            concepts: [
              ["transaction processing", "tps", "collects", "stores"],
              ["event", "generates", "modifies data"],
              ["acid", "rapid response", "reliability", "inflexib"],
            ],
            labels: [
              "Collects, stores, modifies and retrieves transactions",
              "A transaction is an event that creates or changes data",
              "ACID test, rapid response and reliability",
            ],
            min: 2,
          },
          {
            answer: [
              "A Knowledge Work System helps people deal with problems requiring technical expertise or knowledge.",
              "Its software includes word processing, spreadsheets, database management systems, CAD, project management and expert systems.",
            ],
            concepts: [
              ["knowledge work", "kws", "technical expertise", "knowledge"],
              ["word processing", "spreadsheet", "cad", "expert system", "database"],
            ],
            labels: [
              "Supports work needing technical expertise or knowledge",
              "Software: word processing, spreadsheets, CAD, expert systems",
            ],
            min: 1,
          },
          {
            answer: [
              "A Management Information System converts data from internal and external sources into information managers use to make effective decisions for planning, directing and controlling.",
              "It serves decisions at the operational, tactical and strategic levels of the organisation.",
            ],
            concepts: [
              ["management information", "mis", "internal and external", "effective decisions", "planning"],
              ["operational", "tactical", "strategic"],
            ],
            labels: [
              "Converts internal and external data into decision-making information",
              "Serves operational, tactical and strategic levels",
            ],
            min: 1,
          },
        ],
      },
      {
        id: "qs114050apps",
        title: "Questioning — How IT can be used in business",
        task: "Time: 45 minutes · Activity: Self & Group — explain how each of the following aspects of IT can be used in businesses, making reference to their functions as well as the effects they have on the business.",
        steps: [
          "Explain how Word Processors can be used in business — their functions and the effects they have on the business",
          "Explain how Spreadsheets can be used in business — their functions and the effects they have on the business",
          "Explain how Databases can be used in business — their functions and the effects they have on the business",
          "Explain how Graphics can be used in business — their functions and the effects they have on the business",
          "Explain how Integrated office suites can be used in business — their functions and the effects they have on the business",
        ],
        checks: [
          {
            answer: [
              "A word processor creates, edits, stores and prints business documents — letters, quotations, contracts, reports, policies and minutes.",
              "Functions include inserting and deleting text, cut/copy/paste, formatting fonts, spell checking and mail merge for personalised letters — with cloud autosave and co-authoring in tools like Word and Google Docs.",
              "Effect: documents are produced faster and more accurately without retyping, templates keep them on-brand, and the business presents a professional image.",
            ],
            concepts: [
              ["letters", "contracts", "reports", "quotation", "documents", "create", "edit"],
              ["insert", "delete", "cut", "paste", "spell", "mail merge", "format", "co-auth"],
              ["faster", "professional", "retyp", "accura", "errors", "brand"],
            ],
            labels: [
              "Creates and edits business documents",
              "Functions: editing, formatting, spell check, mail merge",
              "Effect: faster, accurate, professional documents",
            ],
            min: 2,
          },
          {
            answer: [
              "A spreadsheet holds numbers in a grid of rows, columns and cells, and formulas recalculate automatically whenever a value changes.",
              "Businesses use spreadsheets — Excel, Google Sheets — for budgets, cash-flow forecasts, price lists, sales analysis, charts and \u201cwhat if\u201d scenarios.",
              "Effect: calculations are accurate and instant, scenarios are tested before money is spent, and managers make better-informed decisions.",
            ],
            concepts: [
              ["rows", "columns", "grid", "cells", "formula", "recalculat"],
              ["budget", "forecast", "price", "sales", "what if", "cash", "chart"],
              ["accura", "decision", "instant", "errors", "before money", "informed"],
            ],
            labels: [
              "Grid of cells with automatically recalculating formulas",
              "Used for budgets, forecasts and \u201cwhat if\u201d analysis",
              "Effect: accuracy and better-informed decisions",
            ],
            min: 2,
          },
          {
            answer: [
              "A database is a structured collection of records managed by a DBMS that can be queried to answer business questions.",
              "Businesses keep customer records (CRM), stock and inventory, sales history, loyalty programmes and payroll in databases such as SQL Server, PostgreSQL or MySQL.",
              "Effect: questions are answered in seconds from large volumes of data, decisions rest on facts, and personal information is protected as POPIA requires.",
            ],
            concepts: [
              ["structured", "records", "dbms", "query", "collection"],
              ["customer", "stock", "sales", "inventory", "crm", "payroll", "loyalty"],
              ["decision", "seconds", "facts", "popia", "protect", "quick"],
            ],
            labels: [
              "Structured records managed and queried by a DBMS",
              "Holds customer, stock and sales records",
              "Effect: fast factual answers and protected personal data",
            ],
            min: 2,
          },
          {
            answer: [
              "Graphics software digitally creates and edits visual content — images, illustrations, animation and video.",
              "Businesses use tools like Canva, Photoshop and Figma for logos and branding, adverts, social-media posts, product photos, packaging and presentations.",
              "Effect: a professional visual image builds customer trust, and producing artwork in-house is faster and cheaper than outsourcing design.",
            ],
            concepts: [
              ["visual", "images", "edit", "create", "illustrat", "animat", "video"],
              ["logo", "advert", "social", "marketing", "brand", "presentation", "photos"],
              ["professional", "trust", "in-house", "cheap", "faster", "image"],
            ],
            labels: [
              "Creates and edits visual content",
              "Used for logos, adverts and marketing material",
              "Effect: professional image at low in-house cost",
            ],
            min: 2,
          },
          {
            answer: [
              "An integrated office suite bundles the word processor, spreadsheet, presentations and email into one package with a shared look, and the applications work together — an Excel chart linked into a Word report updates when the numbers change.",
              "Suites such as Microsoft 365 and Google Workspace add cloud storage, meetings and AI assistants, so files are co-authored and available on any device.",
              "Effect: one subscription covers most office work, data flows between applications instead of being retyped, and skills learned in one application transfer to the others.",
            ],
            concepts: [
              ["bundle", "suite", "together", "word processor", "spreadsheet", "email", "linked"],
              ["microsoft 365", "google workspace", "cloud", "co-auth", "any device", "meetings"],
              ["subscription", "transfer", "retyp", "one login", "flows", "skills"],
            ],
            labels: [
              "Bundled applications that share data and a common look",
              "Cloud suites: Microsoft 365 and Google Workspace",
              "Effect: one subscription, shared data, transferable skills",
            ],
            min: 2,
          },
        ],
      },
      {
        id: "qs114050data",
        title: "Questioning — The relationship between a business and its information needs",
        task: "Time: 90 minutes · Activity: Self & Group — explain how a business requires, converts, uses and protects its data and information.",
        steps: [
          "Explain how a business requires and uses data",
          "Explain how an organisation will convert this data into information",
          "Explain how this information will be used in the following role — Communication (in decision making)",
          "Explain how this information will be used in the following role — Price control",
          "Explain how this information will be used in the following role — Quality control",
          "Explain how this information will be used in the following role — Marketing",
          "Explain how this information will be used in the following role — Business performance",
          "Explain how the information obtained, gathered and used holds threats — Unauthorised access",
          "Explain how the information obtained, gathered and used holds threats — Viruses",
          "Explain how the information obtained, gathered and used holds threats — Disgruntled staff",
          "Explain the information needs of the following sub-system — HR (employment)",
          "Explain the information needs of the following sub-system — Production (manufacture)",
          "Explain the information needs of the following sub-system — Marketing (branding)",
          "Explain the information needs of the following sub-system — Financial (cash flow)",
        ],
        checks: [
          {
            answer: [
              "A business collects raw facts from its daily operations — sales, purchases, stock counts, customer details, times and amounts.",
              "Data is raw and has no meaning of itself; it is captured and stored (for example in spreadsheets and databases) so it can later be processed.",
            ],
            concepts: [
              ["sales", "purchases", "stock", "customer", "collect", "captur", "transactions", "daily"],
              ["raw", "no meaning", "stored", "spreadsheet", "database", "facts", "symbols"],
            ],
            labels: [
              "Collects raw facts from daily operations",
              "Data is raw — captured and stored for later processing",
            ],
            min: 1,
          },
          {
            answer: [
              "Data is given meaning by relational connection — relating one fact to another, as a relational database does with its tables.",
              "Processing data (sorting, grouping, comparing, summarising) turns it into information that answers who, what, where and when.",
            ],
            concepts: [
              ["relational", "relationship", "meaning", "connect", "database"],
              ["process", "sort", "group", "summar", "who", "what", "where", "when", "compar"],
            ],
            labels: [
              "Meaning through relational connection",
              "Processing answers who, what, where and when",
            ],
            min: 1,
          },
          {
            answer: [
              "Information is communicated to decision makers, who select a course of action among variations.",
              "Decisions can be structured and rational or intuitive under time pressure — either way the information must reach the right people to produce the final choice.",
            ],
            concepts: [
              ["decision", "course of action", "choice", "select"],
              ["rational", "intuitive", "communicat", "structured", "pressure", "reasoning"],
            ],
            labels: [
              "Feeds decision makers' choice of action",
              "Supports rational and intuitive decisions",
            ],
            min: 1,
          },
          {
            answer: [
              "Prices are signals set by supply and demand, and an organisation's prices are largely governed by what competitors charge for similar products.",
              "Pricing, costing and manufacturing departments communicate the information so goods sell at the same or better price than competitors.",
            ],
            concepts: [
              ["supply and demand", "signals", "competitor", "similar"],
              ["pricing", "costing", "manufacturing", "better price", "same or better", "communicat"],
            ],
            labels: [
              "Prices as signals; competitors govern pricing",
              "Pricing, costing and manufacturing communicate",
            ],
            min: 1,
          },
          {
            answer: [
              "Quality information ensures products and services meet or exceed customer requirements — fit for purpose, done right the first time.",
              "Quality assurance covers design through documentation, uses PDCA (Plan–Do–Check–Act), and measures the organisation's quality against competitors.",
            ],
            concepts: [
              ["meet or exceed", "customer requirements", "fit for purpose", "first time"],
              ["pdca", "plan", "check", "act", "competitor", "assurance", "inspect"],
            ],
            labels: [
              "Meets or exceeds customer requirements",
              "QA from design to documentation; PDCA; competitor checks",
            ],
            min: 1,
          },
          {
            answer: [
              "Marketing uses information from meetings between R&D and sales & marketing so new products are fully understood and marketed to consumers.",
              "It is two-way: client surveys tell the business what customers want, and that information goes back to R&D to build it.",
            ],
            concepts: [
              ["r&d", "research", "sales", "understood", "meetings", "market the product"],
              ["survey", "two-way", "clients", "customers want", "feedback", "back to"],
            ],
            labels: [
              "R&D and marketing share product information",
              "Two-way: surveys feed customer wants back to R&D",
            ],
            min: 1,
          },
          {
            answer: [
              "Business performance management organises, automates and analyses the metrics, processes and systems that drive performance — the next generation of business intelligence.",
              "Performance information shows which tools work, so they can be applied where the business performs less well — using financial, human and material resources efficiently.",
            ],
            concepts: [
              ["bpm", "metrics", "analys", "business intelligence", "optimis", "performance"],
              ["tools", "perform", "growth", "resources", "efficien", "areas"],
            ],
            labels: [
              "BPM analyses the metrics that drive performance",
              "Apply what works to weaker areas; efficient resources",
            ],
            min: 1,
          },
          {
            answer: [
              "Unauthorised access — hackers or insiders reading data they have no right to see, risking theft, fraud and POPIA breaches.",
              "Defences include passwords and multi-factor authentication, per-role access rights and encryption.",
            ],
            concepts: [
              ["hacker", "insider", "no right", "unauthoris", "steal", "popia", "fraud"],
              ["password", "multi-factor", "mfa", "access rights", "encrypt", "authentication"],
            ],
            labels: [
              "Outsiders/insiders reading data without the right",
              "Defences: passwords, MFA, access rights, encryption",
            ],
            min: 1,
          },
          {
            answer: [
              "Viruses and malware corrupt, steal or destroy data — today above all ransomware arriving through phishing email.",
              "Defences include antivirus, updates and patches, backups, and staff who think before they click.",
            ],
            concepts: [
              ["virus", "malware", "ransomware", "phishing", "corrupt", "destroy"],
              ["antivirus", "updates", "patch", "backup", "click", "defen"],
            ],
            labels: [
              "Malware corrupts, steals or destroys data",
              "Defences: antivirus, patches, backups, cautious staff",
            ],
            min: 1,
          },
          {
            answer: [
              "Disgruntled staff are insiders who deliberately damage, leak or delete the organisation's data.",
              "Defences include least-privilege access, audit trails of who did what, and removing access immediately when someone leaves.",
            ],
            concepts: [
              ["insider", "deliberate", "leak", "delete", "damage", "disgruntled"],
              ["least-privilege", "least privilege", "audit", "remove access", "leaves", "offboard"],
            ],
            labels: [
              "Insiders deliberately damaging or leaking data",
              "Defences: least privilege, audit trails, access removal",
            ],
            min: 1,
          },
          {
            answer: [
              "HR needs employment information: employee records, contracts, leave and attendance, payslips and performance reviews.",
            ],
            concepts: [
              ["employee records", "contracts", "leave", "payslip", "payroll", "performance", "attendance"],
            ],
            labels: ["Employee records, contracts, leave, payslips, reviews"],
            min: 1,
          },
          {
            answer: [
              "Production needs manufacturing information: orders, raw-material stock, production schedules and quality measurements.",
            ],
            concepts: [
              ["orders", "raw material", "stock", "schedule", "quality", "manufactur"],
            ],
            labels: ["Orders, materials, schedules, quality measurements"],
            min: 1,
          },
          {
            answer: [
              "Marketing needs branding information: brand assets, campaign results, customer feedback and survey data.",
            ],
            concepts: [
              ["brand", "campaign", "feedback", "survey", "customers", "advert"],
            ],
            labels: ["Brand assets, campaign results, customer feedback"],
            min: 1,
          },
          {
            answer: [
              "Finance needs cash-flow information: invoices, payments, debtors and creditors, cash-flow forecasts and budgets.",
            ],
            concepts: [
              ["invoice", "payment", "debtor", "creditor", "cash flow", "cash-flow", "budget", "forecast"],
            ],
            labels: ["Invoices, payments, debtors/creditors, forecasts, budgets"],
            min: 1,
          },
        ],
      },
    ],
    assignments: [],

    selfAssessment: {
      intro: [
        "You are now ready to go through a check list. Be honest with yourself.",
        "Tick the box with either a \u221A or an X to indicate your response.",
      ],
      items: [
        "I am able to describe fundamental business concepts.",
        "I am able to describe systems theory with respect to information systems.",
        "I am able to explain how IT can be used in business.",
        "I am able to explain the relationship between a business and its data requirements.",
      ],
      outro: [
        "You must think about any point you could not tick. Write this down as a goal.",
        "Decide on a plan of action to achieve these goals. Regularly review these goals.",
      ],
    },

    logbook: {
      assignmentTitle: "Assignment",
      programme: "Information Technology — Systems Support",
      unitLabel: "114050 — Explain the principles of business and the role of information technology",
      detailFields: [
        "Learner Name",
        "Qualification",
        "Group / Class",
        "Workplace Name",
        "Supervisor / Mentor",
        "Start & Completion Date",
      ],
      project: {
        time: "Own time",
        title: "Project — Research",
        text: "Compile a project which demonstrates how Information Technology can be used in everyday business. You may make use of articles, pictures and other media to demonstrate this. Attach your project here and mark it 114050.",
        resource: "Logbook",
      },
      knowledgeQuestions: [
        { text: "The description distinguishes types of business organisations.", marks: [true, false, false, true, false, false] },
        { text: "The description outlines the common objectives within which businesses operate.", marks: [true, false, false, true, false, false] },
        { text: "The description outlines the environment within which businesses operate.", marks: [true, false, false, true, false, false] },
        { text: "The description defines the concept of a system.", marks: [true, false, false, true, false, false] },
        { text: "The description identifies theoretical components of a system.", marks: [true, false, false, true, false, false] },
        { text: "The explanation identifies the purpose of computer applications in business.", marks: [true, false, false, true, false, false] },
        { text: "The explanation outlines the functions of computer applications in business.", marks: [true, false, false, true, false, false] },
        { text: "The explanation illustrates the effects of IT on business systems.", marks: [true, true, true, true, true, true] },
        { text: "The explanation distinguishes data and information.", marks: [true, false, false, true, false, false] },
        { text: "The explanation outlines the role of information in decision making.", marks: [true, false, false, true, false, false] },
        { text: "The explanation identifies the main threats to data security and integrity.", marks: [true, false, false, true, false, false] },
        { text: "The explanation identifies the sub-systems that make up a business and the information needs associated with each sub-system.", marks: [true, false, false, true, false, false] },
      ],
      practicalActivities: [],
      workplaceActivities: ["Explain how IT can be used in business."],
      workplaceEvidenceNote: "This is to verify that the learner has taken part in the activities in their workplace.",
      otherActivities: [
        {
          activity: "Explain how IT can be used in business.",
          evidence: "Project — Research: Compile a project which demonstrates how Information Technology can be used in everyday business. You may make use of articles, pictures and other media to demonstrate this. Attach your project here and mark it 114050.",
        },
      ],
      otherEvidenceNote: "Learner evidence and experience is recorded here. Make reference to equipment, chemicals and materials that were used in these processes.",
      projectChecklist: [{ no: "5", name: "114050" }],
    },

    lessonPlan: {
      title: "Facilitator Preparation",
      startTime: "09:00",
      details: [
        { icon: "calendar", label: "Dates", value: "Friday 21 · Thursday 27 August 2026" },
        { icon: "clock", label: "Time", value: "09:00 \u2013 14:00 daily · lunch 12:00 \u2013 13:00" },
        { icon: "globe", label: "Venue", value: "Investec, Sandton, Johannesburg" },
        { icon: "presenter", label: "Facilitator", value: "Andre Snell" },
      ],
      prep: [
        "Study the notes in this lesson plan carefully to ensure preparation is done before the start of classes.",
        "Study the learner materials so that you are familiar with the topics that will be covered in this part of the course.",
        "Download the Lesson 1\u20134 slide decks from this tab; the lesson pages carry the figures and gate quizzes used in class.",
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
          heading: "Day 1 — Friday, 21 August 2026 · Lessons 1 & 2: Principles of business · Systems theory",
          rows: [
            {
              time: "10 minutes",
              title: "Index & Unit Standard Alignment — Facilitator",
              text: [
                "Read through the index with the learners, highlighting the areas that will be covered. Make reference to the Unit Standard Alignment Index to outline the specific outcomes, and show where the four lessons sit in the unit.",
              ],
              resources: ["LM index"],
            },
            {
              time: "80 minutes",
              title: "Lesson 1 — Principles of business & the role of IT — Facilitator & Class",
              bullets: [
                "Forms of enterprises: sole proprietor, partnership, closed corporation, private vs public company (comparison table).",
                "Researching a business idea: skills, market, competition, capital, location, risk; buying an existing business; franchising with the South African examples.",
                "Aims, objectives and mission statements; SMART; survival, profit maximisation, profit satisfying, sales growth; why objectives change.",
                "Learners answer each section's gate quiz as you go — all five correct unlocks the next section.",
              ],
              resources: ["Lesson tab — sections 1\u201310", "Lesson 1 slides (.pptx)"],
            },
            {
              time: "10 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "20 minutes",
              title: "Questioning — Lesson 1 — Class in pairs",
              bullets: [
                "Learners complete \u201cPrinciples of business and the role of information technology\u201d; the AI marker gives instant feedback. Take feedback from two pairs.",
              ],
              resources: ["Exercises tab"],
            },
            {
              time: "10 minutes",
              title: "Knowledge check — Quiz 1 — Learners individually",
              bullets: [
                "Learners complete Quiz 1 (Principles of business and the role of IT). 80%+ is competent.",
              ],
              resources: ["Quiz tab"],
            },
            {
              time: "30 minutes",
              title: "Lesson 2 (part 1) — Systems theory — Facilitator & Class",
              bullets: [
                "The manager and the management system; the internal and external environment; globalisation; types of information systems: TPS, KWS, MIS, DSS and ESS.",
              ],
              resources: ["Lesson tab — sections 11\u201315", "Lesson 2 slides (.pptx)"],
            },
            {
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "30 minutes",
              title: "Lesson 2 (part 2) — Transactions to decisions — Facilitator & Class",
              bullets: [
                "TPS features and the ACID test with the Investec transfer examples.",
                "Database structures (hierarchical, network, relational); batch vs on-line processing; KWS; the MIS and the manager's five functions; information sources, flows and levels; structured vs unstructured decisions and the decision stages.",
              ],
              resources: ["Lesson tab — sections 16\u201321", "Lesson 2 slides (.pptx)"],
            },
            {
              time: "20 minutes",
              title: "Questioning — Lesson 2 — Class in pairs",
              bullets: [
                "Learners complete \u201cSystems theory with respect to information systems\u201d — system concept, Input\u2013Process\u2013Output, TPS/KWS/MIS.",
              ],
              resources: ["Exercises tab"],
            },
            {
              time: "10 minutes",
              title: "Knowledge check — Quiz 2 — Learners individually",
              bullets: [
                "Learners complete Quiz 2 (Systems theory and information systems). Unfinished gate quizzes are completed in own time before Day 2.",
              ],
              resources: ["Quiz tab"],
            },
          ],
        },
        {
          heading: "Day 2 — Thursday, 27 August 2026 · Lessons 3 & 4: IT in business · Information needs · wrap-up",
          startTime: "09:00",
          rows: [
            {
              time: "10 minutes",
              title: "Recap & parking bay — Facilitator",
              text: [
                "Recap Day 1, answer parked questions, and check that gate quizzes for sections 1\u201321 are complete.",
              ],
              resources: ["Parking bay"],
            },
            {
              time: "80 minutes",
              title: "Lesson 3 — How IT can be used in business — Facilitator & Class",
              bullets: [
                "Word processors: the basic features, full-featured tools, and what 2026 adds (Copilot, Gemini, co-authoring).",
                "Spreadsheets: rows, columns, formulas that recalculate, \u201cwhat if\u201d scenarios — Excel, Google Sheets, LibreOffice Calc.",
                "Databases in business and the 2026 engines (SQL Server/Azure SQL, PostgreSQL, MySQL, Oracle, MongoDB) — and POPIA duties.",
                "Graphics and the 2026 toolbox picture cards; Microsoft 365, Google Workspace and the suites that came before; function AND effect for every family.",
              ],
              resources: ["Lesson tab — sections 22\u201330", "Lesson 3 slides (.pptx)"],
            },
            {
              time: "20 minutes",
              title: "Questioning — Lesson 3 — Class in pairs",
              bullets: [
                "Learners complete \u201cHow IT can be used in business\u201d — functions and effects of the five application families.",
              ],
              resources: ["Exercises tab"],
            },
            {
              time: "10 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "60 minutes",
              title: "Lesson 4 — The business and its information needs — Facilitator & Class",
              bullets: [
                "From data to wisdom: Ackoff's five categories; data vs information; knowledge, understanding and wisdom; pattern vs noise (the refrigerator riddle).",
                "Communication in decision making; price control; quality control and PDCA; marketing and business performance (BPM).",
                "Protecting the information: unauthorised access, viruses and ransomware, disgruntled staff — and the information needs of HR, Production, Marketing and Finance.",
              ],
              resources: ["Lesson tab — sections 31\u201339", "Lesson 4 slides (.pptx)"],
            },
            {
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "30 minutes",
              title: "Questioning — Lesson 4 — Class in pairs",
              bullets: [
                "Learners work through \u201cThe relationship between a business and its information needs\u201d — data, information, the five roles, the three threats and the four sub-systems.",
                "Anything not finished is completed in own time before the logbook deadline.",
              ],
              resources: ["Exercises tab"],
            },
            {
              time: "10 minutes",
              title: "Self-Assessment — Learners individually",
              bullets: [
                "Learners complete the self-assessment checklist honestly and write down goals for any point they could not tick.",
              ],
              resources: ["Self assessment tab"],
            },
            {
              time: "20 minutes",
              title: "Quiz retries, logbook briefing & wrap-up — Facilitator",
              bullets: [
                "Learners retry any quiz below 80% and finish outstanding gate quizzes.",
                "Outline the research project — how IT is used in everyday business — for workplace evidence; attach it in the logbook marked 114050. Address remaining parking-bay questions and close the unit.",
              ],
              resources: ["Quiz tab", "Logbook", "Evaluation tab"],
            },
          ],
        },
      ],
    },

    quiz: [],
    quizzes: [
      {
        id: "q-business",
        title: "Quiz 1 — Principles of business and the role of IT",
        questions: [
      {
        q: "Which types of business organisation must you be able to distinguish for this unit standard?",
        options: [
          "Sole trader, Partnership, Limited Co, Private Co, Public Ltd Company",
          "Companies only — sole traders and partnerships are excluded",
          "Sole traders and partnerships only — companies are excluded",
          "Trusts, stokvels, co-operatives and burial societies",
        ],
        answer: 0,
        explain: "The assessment criteria require distinguishing the sole trader, partnership, limited company, private company and public limited company.",
      },
      {
        q: "A private company may have how many members, and a public company at least how many?",
        options: [
          "Between one and 50; at least seven",
          "Up to ten; at least two",
          "Two to 20; at least 50",
          "Exactly one member; at least one member",
        ],
        answer: 0,
        explain: "Private company: between one and 50 members. Public company: at least seven members (and at least two directors).",
      },
      {
        q: "Who may NOT be a member of a closed corporation?",
        options: [
          "A company, corporation or trust",
          "A natural person older than eighteen",
          "One of the ten registered members",
          "The founding member of the corporation",
        ],
        answer: 0,
        explain: "A CC is for up to ten natural persons — a company, corporation or trust may not be a member, and members' interests must total 100 percent.",
      },
      {
        q: "What happens when a partnership is sequestrated due to insolvency?",
        options: [
          "The estates of all the partners are simultaneously sequestrated",
          "Only the partnership's own estate is affected by the sequestration",
          "Only the managing partner's personal estate is affected",
          "Nothing — a partnership can never be sequestrated by a court",
        ],
        answer: 0,
        explain: "A partnership is not a legal person: partners are jointly and severally liable, and sequestration of the partnership sequestrates all the partners' estates simultaneously.",
      },
      {
        q: "Which business form needs NO formal registration, administration or termination?",
        options: ["Sole proprietor", "Public company", "Closed corporation", "Private company"],
        answer: 0,
        explain: "No statutes regulate sole owners and no documentation needs registering — but if the business becomes insolvent, the owner personally becomes insolvent.",
      },
      {
        q: "Franchising is best described as…",
        options: [
          "A marriage between a big business and a small business",
          "A type of public company listed on the stock exchange",
          "A government grant scheme for new small businesses",
          "An unregistered partnership between two big businesses",
        ],
        answer: 0,
        explain: "The franchisor (big business, marketable product) licenses the franchisee (small business) to market it — the franchisor expands cheaply, the franchisee starts with a proven brand.",
      },
      {
        q: "Why are loans more readily available to franchise businesses?",
        options: [
          "Because of the reduced risk factor",
          "Because banks own the franchises",
          "Because no capital is needed",
          "Because royalties are paid to the bank",
        ],
        answer: 0,
        explain: "Financial institutions lend more readily to franchises because the proven brand and support package reduce the risk.",
      },
      {
        q: "\u201cAchieve sales of €10 million in European markets in 2004\u201d is an example of…",
        options: [
          "A business objective — a stated, measurable target",
          "A mission statement setting out vision and values",
          "An aim — a statement of general purpose",
          "A code of conduct for the sales department",
        ],
        answer: 0,
        explain: "Objectives are the stated, measurable targets of how to achieve business aims; the aim would be e.g. \u201cgrow the business into Europe.\u201d",
      },
      {
        q: "Which SMART element says an objective must have a deadline?",
        options: ["Time specific", "Specific", "Measurable", "Agreed"],
        answer: 0,
        explain: "T — Time specific: objectives carry a time limit, e.g. by the end of the year.",
      },
      {
        q: "Which objective is typical of a small business just starting out or a firm in crisis?",
        options: ["Survival", "Profit maximisation", "Sales growth", "Economies of scale"],
        answer: 0,
        explain: "Survival is the short-term objective of new entrants and businesses in crisis; profit and growth objectives usually come later.",
      },
        ],
      },
      {
        id: "q-systems",
        title: "Quiz 2 — Systems theory and information systems",
        questions: [
          {
            q: "What does a management system describe?",
            options: [
              "The organisation and the interacting forces that affect its ability to serve customers",
              "The payroll system and the schedule on which salaries are paid each month",
              "The layout of the offices and the equipment installed in them",
              "The company's logo, colours and other branding decisions",
            ],
            answer: 0,
            explain: "A management system covers the organisation plus the significant interacting institutions and forces in its complex, rapidly changing environment — the firm must continuously monitor and adapt to survive and prosper.",
          },
          {
            q: "Viewed internally, an organisation is a resource conversion machine. What does it convert?",
            options: [
              "Inputs — labour, money, materials and equipment — into useful products, goods and services as outputs",
              "Data and information into paper documents for filing at head office",
              "Customers into suppliers by negotiating long-term supply contracts with them",
              "Outputs into inputs by recycling its own products for reuse",
            ],
            answer: 0,
            explain: "The organisation takes inputs from the external environment, converts them, and makes products, goods and services available to customers as outputs.",
          },
          {
            q: "Which forces make up the organisation's external environment?",
            options: [
              "Competitive, economic, technological, political, legal, demographic, cultural and ecosystem forces",
              "Only its direct competitors and the customers who buy from it each day",
              "Only the government, the laws it passes and the taxes it collects",
              "The internal staff, the equipment and the buildings the organisation owns",
            ],
            answer: 0,
            explain: "The external environment is all outside institutions and forces with an actual or potential interest or impact on the organisation's ability to achieve its objectives.",
          },
          {
            q: "What is a transaction, and what does a Transaction Processing System do?",
            options: [
              "An event that generates or modifies data; the TPS collects, stores, modifies and retrieves them",
              "A transaction is a meeting between managers; the TPS records and files the minutes",
              "A transaction is a printed report; the TPS prints and distributes it to departments",
              "A transaction is an e-mail message; the TPS delivers it across the network",
            ],
            answer: 0,
            explain: "A TPS collects, stores, modifies and retrieves transactions — events that generate or modify data eventually stored in the information system — and must pass the ACID test.",
          },
          {
            q: "What does the ACID test stand for?",
            options: [
              "Atomicity, Consistency, Isolation, Durability",
              "Accuracy, Control, Integrity, Distribution",
              "Access, Copying, Inserting, Deletion",
              "Auditing, Checking, Inspection, Documentation",
            ],
            answer: 0,
            explain: "To be considered a transaction processing system the computer must pass the ACID test: Atomicity, Consistency, Isolation and Durability.",
          },
          {
            q: "Which ACID property means a committed transaction's changes survive failures?",
            options: ["Durability", "Atomicity", "Isolation", "Consistency"],
            answer: 0,
            explain: "Durability: once a transaction completes successfully (commits), its changes to the state survive failures.",
          },
          {
            q: "Why is batch processing NOT transaction processing?",
            options: [
              "Several transactions are processed together and results are not available during entry",
              "Batch runs are prohibited for financial records by law",
              "Batch systems never store their data once the processing run has completed",
              "Batch systems respond within milliseconds, far too fast to audit properly",
            ],
            answer: 0,
            explain: "Batch processing collects transactions and deals with them in one go; an on-line system updates immediately — like the airline computer updated within seconds of buying a ticket (pseudo-on-line processing).",
          },
          {
            q: "In which database structure can a child node be linked to MULTIPLE higher parent nodes?",
            options: ["Network structure", "Hierarchical structure", "Relational structure", "A flat file"],
            answer: 0,
            explain: "Network structures allow a child multiple parents; hierarchical structures allow only one parent per child; relational databases organise data in a series of related tables.",
          },
          {
            q: "What is the role of a management information system (MIS)?",
            options: [
              "To convert data from internal and external sources into information for planning, directing and controlling",
              "To type letters and documents for the clerical staff",
              "To design components such as bearings for engineers",
              "To replace managers entirely by taking all the organisation's decisions automatically",
            ],
            answer: 0,
            explain: "The MIS provides managers with sufficient information to make informed decisions across the five functions: planning, organising, coordinating, decision-making and controlling.",
          },
          {
            q: "Which level of MIS information serves LONG-TERM decisions such as opening a new store or taking over a rival?",
            options: ["Strategic", "Operational", "Tactical", "Clerical"],
            answer: 0,
            explain: "Strategic information serves long-term decisions; operational covers day-to-day choices like re-ordering stock, and tactical covers short-to-medium-term moves like introducing a product to a retail outlet.",
          },
        ],
      },
    ],

    saqa: {
      notice:
        "SOUTH AFRICAN QUALIFICATIONS AUTHORITY — Registered unit standard. Specific outcomes and related assessment criteria as supplied in the learner material.",
      registration: [
        { label: "SAQA US ID", value: "114050" },
        { label: "Unit standard title", value: "Explain the principles of business and the role of information technology" },
        { label: "NQF level", value: "5" },
        { label: "Credits", value: "4" },
      ],
      sections: [
        {
          heading: "Specific outcomes and related assessment criteria",
          icon: "target",
          paragraphs: ["Specific outcome: Explain the principles of business and the role of information technology."],
          bullets: [
            "The description distinguishes types of business organisations. (Sole trader, Partnership, Limited Co, Private Co, Public Ltd Company)",
            "The description outlines the common objectives within which businesses operate. (Buying & Selling activity, Profit, Charity, Social Clubs)",
            "The description outlines the environment within which businesses operate.",
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
    lesson: [
      {
        heading: "Introduction — ethics and professionalism for the computer industry in South Africa",
        icon: "presenter",
        flat: true,
        paragraphs: [
          "Unit Standard 114055 — Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa — is about knowing how a computing professional is expected to behave: the professional practices that are acceptable and unacceptable, the professional bodies that represent the industry, the codes of practice they publish, and the code of ethics that governs issues such as equality of opportunity and software piracy.",
          "The lesson works through two big sections. First, Professionalism and Codes of Practice: the CSSA Constitution and its Code of Practice — competence, organisation and management, contracting, privacy and security, development, implementation and live systems — and the professional bodies CSSA, BITF, ITUC and ITA. Second, the Code of Ethics: equality of opportunity, and how the industry fights software piracy in South Africa.",
          "Each slide presents a piece of the learner manual as text. Read it carefully, then answer the slide quiz to unlock the next slide. After the lesson, two Question Sessions assess your knowledge with typed answers, and a self-assessment checklist closes the unit.",
        ],
      },
      {
        heading: "The CSSA Constitution — elevating ICT capability and professionalism",
        icon: "shield",
        flat: true,
        paragraphs: [
          "The Constitution is an important tool for the Information Society, guiding the way we operate. At the AGM on 22 July 2004 an amended version of the Constitution was adopted; the previous version had been registered in terms of the Companies Act in 1970, so it was updated to reflect today's environment.",
          "The Society (the Computer Society of South Africa) is established to elevate Information and Communications Technology (ICT) capability and professionalism in South Africa, specifically:",
        ],
        bullets: [
          "To facilitate the exchange of opinions and views on ICT, and to inform and promote knowledge of ICT to members and the public for the development and use of ICT.",
          "By representing industry practitioners, to inform and lobby Government on ICT policy.",
          "To obtain from members and other sources information relating to ICT, and to disseminate such information amongst the public and the Society by means of journals, circulars, publications, lectures, seminars, conferences or otherwise.",
          "To improve the technical and general knowledge and to elevate the professional status of persons engaged in ICT.",
          "Education and training to elevate the level of ICT capability in South Africa.",
          "Professional development and advancement.",
          "Community development that enhances the standards and levels of ICT for the greater good of the South African people.",
          "To do all such other lawful things as are incidental or conducive to the attainment of the above purposes.",
        ],
        slideQuiz: [
          {
            q: "What is the purpose of the Computer Society of South Africa as set out in its Constitution?",
            options: [
              "To sell computer hardware to government departments",
              "To elevate ICT capability and professionalism in South Africa",
              "To regulate internet service providers",
              "To license software developers",
            ],
            answer: 1,
            explain: "The Society is established to elevate Information and Communications Technology (ICT) capability and professionalism in South Africa.",
          },
          {
            q: "Which of these is one of the CSSA's stated aims?",
            options: [
              "To restrict knowledge of ICT to paying members only",
              "To represent industry practitioners and inform and lobby Government on ICT policy",
              "To set the retail prices of computers in South Africa",
              "To replace university computer science degrees",
            ],
            answer: 1,
            explain: "By representing industry practitioners, the CSSA informs and lobbies Government on ICT policy.",
          },
          {
            q: "When was the amended CSSA Constitution adopted?",
            options: [
              "At the AGM on 22 July 2004",
              "In 1970, when it was first registered",
              "On 1 October 1997",
              "On 1 November 2006",
            ],
            answer: 0,
            explain: "The amended Constitution was adopted at the AGM on 22 July 2004; the previous version had been registered under the Companies Act in 1970.",
          },
          {
            q: "How does the CSSA disseminate ICT information to the public and its members?",
            options: [
              "Only through private members-only meetings",
              "By means of journals, circulars, publications, lectures, seminars and conferences",
              "Through paid television advertisements",
              "It does not share information",
            ],
            answer: 1,
            explain: "The Society obtains information relating to ICT and disseminates it amongst the public and the Society by journals, circulars, publications, lectures, seminars, conferences or otherwise.",
          },
          {
            q: "Which of these is a stated purpose of the CSSA relating to the broader community?",
            options: [
              "Community development that enhances the standards and levels of ICT for the greater good of the South African people",
              "Restricting ICT access to registered professionals",
              "Setting import duties on computer equipment",
              "Running the national telecommunications network",
            ],
            answer: 0,
            explain: "Alongside education, training and professional development, the CSSA pursues community development that enhances ICT standards for the greater good of the South African people.",
          },
        ],
      },
      {
        heading: "CSSA today — the IITPSA (Institute of Information Technology Professionals South Africa)",
        icon: "people",
        flat: true,
        paragraphs: [
          "The Computer Society of South Africa (CSSA) is now known as the Institute of Information Technology Professionals South Africa (IITPSA). The legacy CSSA Code of Practice and professional conduct guidelines can now be found through the official IITPSA website (iitpsa.org.za), and the Institute's current Constitution is published at https://www.iitpsa.org.za/constitution/ — read it there to see how the aims on the previous slide live on today.",
          "Joining is straightforward: create a profile on the IITPSA Membership Portal, choose your membership tier, submit certified qualifications and a CV, and pay the relevant application and annual fees.",
          "Why join? IITPSA members participate in their ICT professional community — they network, engage, learn and share with other members, who are found in almost every province in South Africa, with the main concentrations in Gauteng, the Western Cape, the Eastern Cape and KwaZulu-Natal.",
        ],
        bullets: [
          "Professional recognition — by using the respected letters 'MIITPSA' (Member), 'PMIITPSA®' (Professional Member) or 'Pr.CIO®' (Professional CIO) after one's name, members are identified as belonging to a professional body.",
          "International recognition — IITPSA membership grading and admission criteria are continuously evaluated in accordance with international practices and are maintained in line with these requirements.",
          "Networking — seminars, workshops and other events provide opportunities for networking; IITPSA Central Office will help you find a Special Interest Group or a one-off event.",
          "Career advancement — increasingly, companies recognise IITPSA membership for their ICT staff as a prerequisite for promotion and career advancement.",
        ],
        slideQuiz: [
          {
            q: "What is the Computer Society of South Africa (CSSA) known as today?",
            options: [
              "The Business Software Alliance (BSA)",
              "The Institute of Information Technology Professionals South Africa (IITPSA)",
              "The Information Technology Association (ITA)",
              "The Black Information Technology Forum (BITF)",
            ],
            answer: 1,
            explain: "The CSSA is now known as the Institute of Information Technology Professionals South Africa (IITPSA).",
          },
          {
            q: "Where can the legacy CSSA Code of Practice and professional conduct guidelines be found today?",
            options: [
              "They no longer exist",
              "Through the official IITPSA website",
              "Only in printed libraries",
              "On the SAPS website",
            ],
            answer: 1,
            explain: "The legacy CSSA code of practice and professional conduct guidelines are available through the official IITPSA website (iitpsa.org.za).",
          },
          {
            q: "Which of these is the correct set of steps to become an IITPSA member?",
            options: [
              "Send an email and wait for an invitation",
              "Create a profile on the IITPSA Membership Portal, choose your membership tier, submit certified qualifications and a CV, and pay the relevant application and annual fees",
              "Buy a licence from a software reseller",
              "Pass a government examination only",
            ],
            answer: 1,
            explain: "Membership starts on the IITPSA Membership Portal: create a profile, choose a tier, submit certified qualifications and a CV, and pay the application and annual fees.",
          },
          {
            q: "Which designatory letters identify an IITPSA Professional Member?",
            options: ["MIITPSA", "PMIITPSA®", "Pr.CIO®", "BSc(IT)"],
            answer: 1,
            explain: "'MIITPSA' denotes a Member, 'PMIITPSA®' a Professional Member and 'Pr.CIO®' a Professional CIO — using them identifies you as belonging to a professional body.",
          },
          {
            q: "Why do companies increasingly value IITPSA membership for their ICT staff?",
            options: [
              "It reduces their software licence costs",
              "It is recognised as a prerequisite for promotion and career advancement",
              "It exempts staff from the Code of Practice",
              "It replaces formal qualifications",
            ],
            answer: 1,
            explain: "Increasingly, companies recognise IITPSA membership for their ICT staff as a prerequisite for promotion and career advancement.",
          },
        ],
      },
      {
        heading: "The CSSA Code of Practice — what it is and who it binds",
        icon: "checklist",
        flat: true,
        paragraphs: [
          "The generally accepted Codes of Good Practice in the South African IT industry are set out by the Computer Society of South Africa — one of, if not the most respected associations concerned with South African Information Technology.",
          "The Code of Practice is directed to all professional members of the CSSA. It consists, essentially, of a series of statements that prescribe minimum standards of practice to be observed by members.",
          "The Code is concerned with professional responsibility. All members have responsibilities — to clients, to users, to the State and to society at large. Members who are employees also have responsibilities to their employers and employers' customers and, often, to a Trade Union. In the event of an apparent clash in responsibilities, obligations or prescribed practice, the Society should be consulted at the earliest opportunity.",
          "The Code is to be viewed as a whole: individual parts are not intended to be used in isolation to justify errors of omission or commission. The Code is intended to be observed in the spirit and not merely to the word.",
          "Because CSSA membership covers all occupations relevant to the use of computers, the Code is set out in two levels: Level One — a series of brief statements defining the elements of practice to be observed; Level Two — the rationale for the Level One statements. Many clauses may seem to state the obvious, but much that goes wrong in computer use does so because the obvious has been overlooked.",
        ],
        slideQuiz: [
          {
            q: "The CSSA Code of Practice consists essentially of…",
            options: [
              "A price list for professional services",
              "A series of statements that prescribe minimum standards of practice to be observed by members",
              "A list of approved software products",
              "Employment contracts for IT workers",
            ],
            answer: 1,
            explain: "The Code is a series of statements prescribing minimum standards of practice for all professional CSSA members.",
          },
          {
            q: "Why is the Code set out in two levels?",
            options: [
              "Level One is for managers and Level Two is for technicians",
              "Because CSSA membership covers all computing occupations, so every member must be able to reach appropriate interpretations — Level One states the practice, Level Two gives the rationale",
              "Level Two replaces Level One every year",
              "To separate hardware rules from software rules",
            ],
            answer: 1,
            explain: "Level One gives brief statements of practice; Level Two explains the rationale — enabling every member, whatever their occupation, to interpret the Code.",
          },
          {
            q: "Which statement about the Code is TRUE?",
            options: [
              "Individual parts may be used in isolation to justify errors",
              "The Code applies only to programmers",
              "The Code is intended to be observed in the spirit and not merely to the word",
              "Members owe responsibilities only to their employer",
            ],
            answer: 2,
            explain: "The Code is viewed as a whole and observed in the spirit — and members have responsibilities to clients, users, the State and society at large.",
          },
          {
            q: "To whom is the CSSA Code of Practice directed?",
            options: [
              "Only company directors",
              "All professional members of the CSSA",
              "Government employees only",
              "Software vendors only",
            ],
            answer: 1,
            explain: "The Code of Practice is directed to all professional members of the CSSA.",
          },
          {
            q: "What should a member do in the event of an apparent clash in responsibilities, obligations or prescribed practice?",
            options: [
              "Ignore the clash and continue working",
              "Resign immediately",
              "Consult the Society at the earliest opportunity",
              "Choose whichever obligation pays better",
            ],
            answer: 2,
            explain: "Members have responsibilities to clients, users, the State, society, employers and often a Trade Union — when these clash, the Society should be consulted at the earliest opportunity.",
          },
        ],
      },
      {
        heading: "Code of Practice 1 — Personal competence and keeping up to date",
        icon: "person",
        flat: true,
        paragraphs: [
          "In the practice of their profession, members will, to the extent that they are responsible:",
        ],
        bullets: [
          "1.1 Keep themselves, and subordinates, informed of new technologies, practices, legal requirements and standards relevant to their duties — others expect you to provide special skills and advice, and computing is developing and changing rapidly. You cannot retain professional standing by relying on the knowledge you had when you qualified.",
          "1.2 Ensure subordinates are trained on an equal opportunity basis, in order to be effective in their duties and to qualify for increased responsibilities — regularly review the training needs of your staff and pass on your hard-won knowledge and experience.",
          "1.3 Accept only such work as they believe they are competent to perform, and not hesitate to obtain additional expertise from appropriately qualified individuals where advisable — always be aware of your own limitations and never knowingly imply competence you do not possess.",
          "1.4 Actively seek opportunities for increasing efficiency and effectiveness to the benefit of the user and of the ultimate recipient — look beyond the defined task to other needs that emerge, procedures that need modification and benefits that might be achieved.",
        ],
        slideQuiz: [
          {
            q: "According to clause 1.3, a professional member should…",
            options: [
              "Accept any work offered and learn on the job",
              "Accept only work they believe they are competent to perform, obtaining additional expertise where advisable",
              "Refuse all work outside their comfort zone",
              "Delegate difficult work to subordinates without review",
            ],
            answer: 1,
            explain: "You should be aware of your own limitations, never imply competence you do not possess, and bring in additional expertise when needed.",
          },
          {
            q: "Why must members keep themselves and subordinates informed of new technologies and standards (1.1)?",
            options: [
              "Because employers pay more for certifications",
              "Because computing develops and changes rapidly — you cannot rely on the state of your knowledge at the time you achieved professional status",
              "Because it is a legal requirement of the Companies Act",
              "Because clients ask for certificates",
            ],
            answer: 1,
            explain: "Others expect you to provide special skills and advice; in a rapidly changing field you must keep up to date and encourage staff to do the same.",
          },
          {
            q: "Under clause 1.2, subordinates must be trained…",
            options: [
              "Only when the budget allows",
              "On an equal opportunity basis, to be effective in their duties and to qualify for increased responsibilities",
              "Only if they request it in writing",
              "By external providers only",
            ],
            answer: 1,
            explain: "Clause 1.2 requires training subordinates on an equal opportunity basis so they are effective in their duties and can qualify for increased responsibilities.",
          },
          {
            q: "Clause 1.4 asks members to actively seek opportunities for…",
            options: [
              "Personal promotion above colleagues",
              "Increasing efficiency and effectiveness to the benefit of the user and the ultimate recipient",
              "Reducing the client's involvement in projects",
              "Extending project deadlines",
            ],
            answer: 1,
            explain: "Look beyond the defined task — to other needs that emerge, procedures that need modification and benefits that might be achieved.",
          },
          {
            q: "What does the Code say about implying competence?",
            options: [
              "It is acceptable in job interviews",
              "You should never knowingly imply competence you do not possess",
              "It is only a problem if the client finds out",
              "Competence need never be proven",
            ],
            answer: 1,
            explain: "Always be aware of your own limitations and never knowingly imply competence you do not possess — obtain additional expertise where advisable.",
          },
        ],
      },
      {
        heading: "Code of Practice 2 — Organisation and management",
        icon: "people",
        flat: true,
        paragraphs: [
          "This section of the Code is concerned with broad principles. Since computer management is still management, the normal principles applicable to any kind of management apply here also:",
        ],
        bullets: [
          "2.1 Plan, establish and review objectives, tasks and organisational structures for themselves and subordinates, to help meet overall objectives — it is dangerously easy to become engrossed in the problem of the moment and lose sight of the overall objectives of the organisation.",
          "2.2 Ensure that specific tasks are assigned to individuals according to their known ability and competence — delegate work that develops competence and increases motivation, without leaving users with a service below what they are entitled to.",
          "2.3 Establish and maintain channels of communication from and to seniors, equals and subordinates — good communication is vital to business success and computer work requires constant interaction with users. Communication skills can be improved considerably by formal training.",
          "2.4 Be accountable for the quality, timeliness and use of resources in the work for which they are responsible — provide a service of agreed quality, on time and within budget, plan for contingencies and make others aware of foreseeable difficulties and dangers. You cannot turn your back on a problem once encountered.",
        ],
        slideQuiz: [
          {
            q: "Clause 2.4 makes a professional accountable for…",
            options: [
              "Only the technical accuracy of their code",
              "The quality, timeliness and use of resources in the work for which they are responsible",
              "The profits of the whole company",
              "Their colleagues' mistakes",
            ],
            answer: 1,
            explain: "High on your professional duties is providing a service of agreed quality, on time and within budget — including contingency planning.",
          },
          {
            q: "Which statement reflects clause 2.3 on communication?",
            options: [
              "Communication will look after itself",
              "Formal channels of communication must exist upwards, downwards and sideways — and communication skills can be improved by formal training",
              "Only managers need communication skills",
              "Users should be kept at arm's length from the computer team",
            ],
            answer: 1,
            explain: "It is often assumed communication looks after itself, but formal channels in all directions — especially with users — are vital.",
          },
          {
            q: "Under clause 2.2, specific tasks must be assigned to individuals according to…",
            options: [
              "Seniority alone",
              "Their known ability and competence",
              "Who is available at the time",
              "Alphabetical order",
            ],
            answer: 1,
            explain: "Assign tasks according to known ability and competence — delegating work that develops competence and increases motivation without degrading the service users are entitled to.",
          },
          {
            q: "Why does clause 2.1 warn against becoming engrossed in the problem of the moment?",
            options: [
              "Because problems should be ignored",
              "Because it is dangerously easy to lose sight of the overall objectives of the organisation",
              "Because managers should not solve problems themselves",
              "Because it slows down the payroll",
            ],
            answer: 1,
            explain: "Plan, establish and review objectives, tasks and structures — staying focused on the organisation's overall objectives, not just today's crisis.",
          },
          {
            q: "According to clause 2.4, what should you do about foreseeable difficulties and dangers?",
            options: [
              "Keep them to yourself to avoid alarm",
              "Plan for contingencies and make others aware of them — you cannot turn your back on a problem once encountered",
              "Wait until they become real problems",
              "Delegate them to subordinates",
            ],
            answer: 1,
            explain: "Accountability includes contingency planning and making others aware of foreseeable difficulties — you cannot turn your back on a problem once encountered.",
          },
        ],
      },
      {
        heading: "Code of Practice 3 — Contracting",
        icon: "checklist",
        flat: true,
        paragraphs: [
          "Some formal agreement — even if not a specific contract — is needed before any project is started. Commitment and definition of responsibilities are essential, in advance of action:",
        ],
        bullets: [
          "3.1 Seek expert advice in the preparation of any formal contract — just as you expect to be consulted in your field, be ready to consult other specialists for guidance on contracts, commerce, finance, tax, law or risk evaluation. A badly drawn-up contract or a wrong assessment of a legal situation carries real dangers; many professional bodies provide 'standard contract' forms to reduce problem areas.",
          "3.2 Ensure that all requirements and the practical responsibilities of all parties are adequately covered in any contract or tendering procedures — review the totality of the detail, taking care that items such as provision of accommodation, typing, data preparation, responsibility for media security and standby arrangements are not forgotten, and that everyone party to the contract is fully aware of their obligations.",
        ],
        slideQuiz: [
          {
            q: "According to clause 3.1, when preparing a formal contract you should…",
            options: [
              "Write it yourself to save money",
              "Seek expert advice — consulting specialists in areas such as commerce, finance, tax, law or risk evaluation",
              "Copy a competitor's contract",
              "Skip the contract if the client is trusted",
            ],
            answer: 1,
            explain: "Consult other specialists just as you would expect to be consulted in your own field; standard contract forms from professional bodies also help.",
          },
          {
            q: "Why must all requirements and responsibilities be covered in the contract (3.2)?",
            options: [
              "To make the contract longer",
              "So that overlooked items (accommodation, data preparation, media security, standby arrangements) do not cause problems and hurt profitability — and every party knows their obligations",
              "Because the law requires a minimum page count",
              "So the client cannot cancel",
            ],
            answer: 1,
            explain: "Review the totality of the detail as carefully as a system specification — forgotten items create problems and affect profitability.",
          },
          {
            q: "What is needed before any project is started?",
            options: [
              "A press release",
              "Some formal agreement — commitment and definition of responsibilities, in advance of action",
              "A completed system design",
              "Payment in full",
            ],
            answer: 1,
            explain: "Even if not a specific contract, a formal agreement defining commitment and responsibilities is essential before action begins.",
          },
          {
            q: "Why do many professional bodies provide 'standard contract' forms?",
            options: [
              "To increase legal fees",
              "To reduce problem areas — a badly drawn-up contract or wrong assessment of a legal situation carries real dangers",
              "To make every project identical",
              "Because the law requires their use",
            ],
            answer: 1,
            explain: "Standard contract forms help reduce problem areas; badly drawn contracts and wrong legal assessments are genuinely dangerous.",
          },
          {
            q: "Which of these easily-forgotten items does clause 3.2 say must be covered in a contract?",
            options: [
              "The team's lunch preferences",
              "Provision of accommodation, typing, data preparation, responsibility for media security and standby arrangements",
              "The client's marketing plans",
              "Office decoration budgets",
            ],
            answer: 1,
            explain: "Review the totality of the detail so items like accommodation, data preparation, media security and standby arrangements are not forgotten.",
          },
        ],
      },
      {
        heading: "Code of Practice 4 — Privacy, security and integrity",
        icon: "shield",
        flat: true,
        paragraphs: [
          "A system is at risk from the moment the project that develops it is first conceived, and the risk remains at least until after the system is finally discontinued. Threats to security range from incompetence, accident and carelessness to deliberate theft, fraud, espionage or malicious attack.",
          "Members must ascertain and evaluate all potential risks with regard to the cost, effectiveness and practicality of proposed levels of security (4.1) — deciding how much should be spent on security in four areas: Protection (preventing threats from becoming reality), Detection (in time to take suppressive action), Suppression (to limit the effect) and Recovery (to rectify and get the system going).",
        ],
        bullets: [
          "4.2 Recommend appropriate levels of security, commensurate with the anticipated risks and appropriate to the needs of the client — some areas of risk are mandatory, such as health and safety legislation.",
          "4.3 Apply, monitor and report upon the effectiveness of the agreed levels of security — an ongoing security audit keeps people aware of requirements and identifies weaknesses and loopholes; review arrangements as technology and methods of breaching security develop.",
          "4.4 Ensure that all staff are trained to take effective action to protect life, data and equipment (in that order) in the event of disaster — the safety of people comes first, backups must exist for data, and equipment should be replaceable and insured.",
          "4.5 Take all reasonable measures to protect confidential information from inadvertent or deliberate improper access or use — your responsibility for confidentiality is at least as great as in other professions, made more complex by the speed and capacity of computers.",
          "4.6 Ensure that competent people are assigned responsibility for the accuracy and integrity of the data in data files and each part of an organisation's database.",
          "4.7 Ensure that, where stored data may be dangerous to an individual, the individual has adequate rights of review, correction and appeal — for example credit information that is incorrect or disputed.",
        ],
        slideQuiz: [
          {
            q: "In the event of disaster, staff must be trained to protect — in this order:",
            options: [
              "Equipment, data, life",
              "Data, equipment, life",
              "Life, data, equipment",
              "Whatever is most expensive first",
            ],
            answer: 2,
            explain: "Clause 4.4: protect life, data and equipment — in that order. People's safety always comes first.",
          },
          {
            q: "What are the four areas of spending on system security (4.1)?",
            options: [
              "Hardware, software, network, people",
              "Protection, Detection, Suppression, Recovery",
              "Firewalls, antivirus, backups, passwords",
              "Plan, Do, Check, Act",
            ],
            answer: 1,
            explain: "Protection prevents threats becoming reality; Detection in time to act; Suppression limits the effect; Recovery gets the system going again.",
          },
          {
            q: "Clause 4.7 says individuals whose stored data may be dangerous to them must have…",
            options: [
              "No access to the data",
              "Adequate rights of review, correction and appeal",
              "A copy of the whole database",
              "Compensation payments",
            ],
            answer: 1,
            explain: "Where data such as credit information is incorrect or disputed, procedures must let the affected person review it, have it rectified, or have their viewpoint incorporated.",
          },
          {
            q: "From when until when is a system at risk?",
            options: [
              "Only while it is being developed",
              "Only after go-live",
              "From the moment the project is first conceived until at least after the system is finally discontinued",
              "Only during office hours",
            ],
            answer: 2,
            explain: "Risk begins at conception and remains at least until after the system is discontinued — threats range from incompetence and accident to theft, fraud, espionage and malicious attack.",
          },
          {
            q: "What does clause 4.3 say about the agreed levels of security?",
            options: [
              "Set them once and never revisit them",
              "Apply, monitor and report on their effectiveness — an ongoing security audit that is reviewed as technology and breach methods develop",
              "They are the client's problem after handover",
              "They only apply to financial systems",
            ],
            answer: 1,
            explain: "An ongoing security audit keeps people aware of requirements and identifies weaknesses; arrangements must be reviewed as technology and methods of breaching security develop.",
          },
        ],
      },
      {
        heading: "Code of Practice 5 — Development",
        icon: "design",
        flat: true,
        paragraphs: [
          "'Development' means all the work involved to reach the stage where a viable computer system is ready to become operational, including installing the system in its eventual production environment. Key clauses:",
        ],
        bullets: [
          "5.1 Exercise impartiality when evaluating each project with respect to its technical, moral and economic benefits — do not lose objectivity through enthusiasm for the latest technology.",
          "5.2 Effectively plan, monitor, adjust and report on all development, acquisition or replacement projects.",
          "5.3 Ensure that effective standard procedures and documentation are available and used — standards should not cause inhibiting rigidity but provide a framework.",
          "5.4 Specify the system objectives, completion date, cost and security requirements for the client and the criteria for their achievement — and review objectives regularly on large projects.",
          "5.5 Ensure that the client can participate in all stages of problem analysis, system development and implementation — the system ultimately belongs to the client.",
          "5.6 Ensure that each task is completed to a defined level before the next dependent task is started — e.g. do not start writing a program before the specification is complete.",
          "5.7 Specify and conduct program tests and system tests to prove the system functions as intended — not merely to detect errors — with the client involved.",
          "5.8 Ensure that systems are designed and documented to facilitate subsequent audit, maintenance, enhancement and accurate comprehension by users.",
          "5.9 Ensure that input and output are designed to obviate misunderstanding — avoid jargon, unfamiliar codes and abbreviations; use plain language.",
          "5.10 Ensure adequate procedures exist to delete erroneous, redundant and out-of-date data from files.",
          "5.11 Ensure adequate procedures exist to restore data and program files after loss, corruption or system failure — designed in at the start, not after a disaster.",
          "5.12 Ensure that projects are completed with technical soundness, using the most appropriate technology, within time and cost constraints — the best technology for the client's problem, not necessarily the most sophisticated.",
        ],
        slideQuiz: [
          {
            q: "According to clause 5.5, why should the client participate in all stages of development?",
            options: [
              "To reduce the developer's workload",
              "Because the system ultimately belongs to the client, who must maintain control — and involvement ensures you produce the system the client requires",
              "Because clients enjoy writing code",
              "To transfer legal liability to the client",
            ],
            answer: 1,
            explain: "Seek the client's involvement in key activities such as specification, quality control and test data — that is how you produce what the client requires.",
          },
          {
            q: "Clause 5.12 says the technology exploited should be…",
            options: [
              "The most sophisticated available",
              "The cheapest on the market",
              "The best for the client's problem — not necessarily the most sophisticated",
              "Whatever the developer knows best",
            ],
            answer: 2,
            explain: "Cost and service are the criteria of an effective system, rather than technical ingenuity.",
          },
          {
            q: "What is the objective of system testing under clause 5.7?",
            options: [
              "Merely to detect errors",
              "To prove the system functions as intended, with the client involved",
              "To delay the launch date",
              "To train new programmers",
            ],
            answer: 1,
            explain: "Test each program separately, then together, then with the rest of the system — to prove the system functions as intended, not merely to find errors.",
          },
          {
            q: "What does 'Development' mean in the Code?",
            options: [
              "Only writing program code",
              "All the work involved to reach the stage where a viable computer system is ready to become operational, including installing it in its production environment",
              "Marketing a finished product",
              "Training the help desk",
            ],
            answer: 1,
            explain: "Development covers everything up to a viable system ready for operation — including installation in its eventual production environment.",
          },
          {
            q: "Clause 5.6 requires that each task is completed to a defined level before the next dependent task starts. Which is the given example?",
            options: [
              "Do not start writing a program before the specification is complete",
              "Do not hire staff before the office opens",
              "Do not test before the budget is approved",
              "Do not document until the system is live",
            ],
            answer: 0,
            explain: "For example, do not start writing a program before its specification is complete — dependent tasks need finished predecessors.",
          },
        ],
      },
      {
        heading: "Code of Practice 6 & 7 — Implementation and live systems",
        icon: "network",
        flat: true,
        paragraphs: [
          "Implementation is the transition from development to full operation; Live Systems covers the ongoing operation of systems handed over by design and development staff:",
        ],
        bullets: [
          "6.1 Ensure adequate provision is made for user and operations staff training in all functions of the system for which they are responsible — the task is not complete until the system can be used effectively by the client's staff, and training in advance of implementation counters resistance to change.",
          "6.2 Effectively plan, monitor, adjust and report upon all activities concerned with the changeover from development to operational running — all who are affected must be advised of changes and given the opportunity to comment.",
          "6.3 Ensure expeditious and economic completion of implementation consistent with adequate testing and security — a professional judgement between under- and over-testing; if corners are cut, evaluate the likely effect and make it known.",
          "7.1 Plan and operate efficient and reliable processing within defined budgets — users depend on processing services just as they depend on the application software.",
          "7.2 Monitor performance and quality and arrange regular reviews of the efficiency, effectiveness and security of live systems — check not only how well the system meets its original objectives, but how it has evolved with current business requirements.",
          "7.3 Plan, from the start of a project, to provide adequate maintenance and enhancement support to live systems — much criticism of computer applications is traceable to their failure to respond to changing conditions.",
          "7.4 Establish good liaison with users and provide proper facilities for dealing with enquiries and day-to-day problems — maintain continuous formal and informal liaison, including channels for emergencies.",
        ],
        slideQuiz: [
          {
            q: "Under clause 6.1, when is your task complete?",
            options: [
              "When the code compiles",
              "When the system is handed to the operations team",
              "Not until you have seen the new system through to implementation and the client's staff can use it effectively",
              "When the invoice is paid",
            ],
            answer: 2,
            explain: "Professional duty requires seeing the system through to implementation, with users trained in advance to counter resistance to change.",
          },
          {
            q: "Clause 7.3 says maintenance and enhancement support should be planned…",
            options: [
              "Only after users complain",
              "From the start of the project",
              "Once the budget allows",
              "Never — systems should not change",
            ],
            answer: 1,
            explain: "Project plans should include a formal system to control enhancement and identify maintenance resources — avoiding the criticism that applications fail to respond to changing conditions.",
          },
          {
            q: "Under clause 6.3, what must you do if corners are cut during implementation?",
            options: [
              "Say nothing and hope for the best",
              "Evaluate the likely effect and make it known",
              "Blame the client",
              "Cancel the project",
            ],
            answer: 1,
            explain: "Implementation is a professional judgement between under- and over-testing — if corners are cut, evaluate the likely effect and make it known.",
          },
          {
            q: "What does clause 7.2 say regular reviews of live systems should check?",
            options: [
              "Only whether the hardware is clean",
              "Not only how well the system meets its original objectives, but how it has evolved with current business requirements",
              "Only the licence expiry dates",
              "Only user satisfaction scores",
            ],
            answer: 1,
            explain: "Monitor performance and quality, reviewing efficiency, effectiveness and security — against original objectives and current business requirements.",
          },
          {
            q: "Clause 7.4 requires good liaison with users, including…",
            options: [
              "One meeting per year",
              "Proper facilities for dealing with enquiries and day-to-day problems, with continuous formal and informal liaison and channels for emergencies",
              "A ban on user contact outside office hours",
              "Communication only through lawyers",
            ],
            answer: 1,
            explain: "Maintain continuous formal and informal liaison with users, including channels for enquiries, day-to-day problems and emergencies.",
          },
        ],
      },
      {
        heading: "Professional computer bodies in South Africa — CSSA, BITF, ITUC and ITA",
        icon: "people",
        flat: true,
        paragraphs: [
          "CSSA — The Computer Society of South Africa, from which the Constitution and Code of Practice above are directly derived: one of, if not the most respected associations concerned with South African Information Technology.",
          "BITF — The Black Information Technology Forum was launched in Cape Town in 1995 to propel black individuals into the mainstream of the ICT industry. A Gauteng branch formed in 1997 and the forum became a national organisation in 1998, with branches serving 2 400 members. It is the largest organisation representing the interests of black people in South Africa's ICT industry and has considerable credibility with government bodies. It aims to empower members with technical and business skills, make members significant role players in the ICT sector, improve access to technology for historically disadvantaged communities, actively influence policy-making forums, and promote the status of historically disadvantaged individuals and communities in the ICT sector. Its two programmes develop skills, internships and experiential training, and promote governance and black economic empowerment (the ABC Programme).",
          "ITUC — The International Trade Union Confederation is the world's largest trade union federation, formed on 1 November 2006 out of the merger of the International Confederation of Free Trade Unions (ICFTU) and the World Confederation of Labour (WCL). It assists the South African IT market in trading internationally, empowering the market — especially its emerging sector.",
          "ITA — The Information Technology Association is the official trade and employer body of the ICTe industry, striving to promote consistent standards of professionalism and service. Its purpose, per its Constitution, is to 'represent and promote the interests of its members, which shall be employers active in the Information Technology Sector.' Founded in 1934 (as the Transvaal Typewriter and Office Appliance Traders Association), it was renamed the ITA after the amalgamation of the Business Equipment Association and the Computer Services Association. Its primary business is to promote and represent the ICTe industry nationally and internationally, assemble and disseminate information, provide a networking and marketing platform, and encourage interest groups that influence standards, strategies and legislation. It operates through an Executive Council and three divisions: the Information Technology Users Council (ITUC — guaranteeing the authenticity and credibility of examinations), the Recruitment Consultancy Services Group (ITARCS — recruitment and contracting issues under the Labour Relations Act) and the Payroll Authors Group (PAG — liaising with government so payroll software incorporates legislative changes).",
        ],
        slideQuiz: [
          {
            q: "Which body was launched in Cape Town in 1995 to propel black individuals into the mainstream of the ICT industry?",
            options: ["CSSA", "BITF", "ITUC", "ITA"],
            answer: 1,
            explain: "The Black Information Technology Forum (BITF) — now the largest organisation representing the interests of black people in South Africa's ICT industry.",
          },
          {
            q: "What is the ITUC?",
            options: [
              "A South African software licensing authority",
              "The world's largest trade union federation, formed in 2006 from the merger of the ICFTU and WCL",
              "A branch of the CSSA",
              "A government department",
            ],
            answer: 1,
            explain: "The International Trade Union Confederation assists the South African IT market in trading internationally, empowering especially the emerging sector.",
          },
          {
            q: "Which of these is a division of the ITA?",
            options: [
              "The Payroll Authors Group (PAG)",
              "The Business Software Alliance (BSA)",
              "The South African Police Services (SAPS)",
              "SAFACT",
            ],
            answer: 0,
            explain: "The ITA operates through three divisions: ITUC, ITARCS and the Payroll Authors Group (PAG).",
          },
          {
            q: "When and under what name was the ITA founded?",
            options: [
              "In 1934, as the Transvaal Typewriter and Office Appliance Traders Association",
              "In 2006, as the International Trade Union Confederation",
              "In 1995, as the Black Information Technology Forum",
              "In 1970, as the Computer Society of South Africa",
            ],
            answer: 0,
            explain: "The ITA was founded in 1934 as the Transvaal Typewriter and Office Appliance Traders Association, later renamed after the amalgamation of the Business Equipment Association and the Computer Services Association.",
          },
          {
            q: "How many members did the BITF's branches serve when it became a national organisation?",
            options: ["240", "2 400", "24 000", "400"],
            answer: 1,
            explain: "The BITF became a national organisation in 1998, with branches serving 2 400 members.",
          },
        ],
      },
      {
        heading: "Code of ethics — the music piracy example",
        icon: "chat",
        flat: true,
        paragraphs: [
          "'Piracy' is generally considered to include: (a) pirate recordings, where just the music is copied, usually by ordinary people on a not-for-profit basis; (b) counterfeiting, which copies the music and the packaging and attempts to pass the copy off as the real thing; (c) online piracy — the same, done via the internet; and (d) bootlegging — recording and trading a performance (usually a live concert) that has not been officially released.",
          "RIAA, the Recording Industry Association of America, claims the recording industry 'loses' around 4.2 billion US dollars to piracy each year — a figure reached by inferring that each pirate transaction represents a lost legitimate sale, which is overly simplistic. Even so, full-blown counterfeiting is both illegal and unethical, and we ought not to support it by buying cheap counterfeits at flea markets and from street traders.",
          "Some 'home pirates' see themselves as modern-day Robin Hoods — but the argument does not hold. In a free market the way to drive an overpriced product's price down is not to buy it; and if protest is really your goal, copying a friend's CD is not an effective protest. The ethical answer: if you really like the CD, buy a legitimate copy and discard the pirated one.",
        ],
        slideQuiz: [
          {
            q: "Which of these is NOT one of the forms of piracy described?",
            options: [
              "Pirate recordings",
              "Counterfeiting",
              "Bootlegging",
              "Buying a legitimate CD at a retail store",
            ],
            answer: 3,
            explain: "The four forms are pirate recordings, counterfeiting, online piracy and bootlegging — buying a legitimate copy is the ethical alternative.",
          },
          {
            q: "Why is RIAA's $4.2 billion 'loss' figure described as overly simplistic?",
            options: [
              "Because piracy does not exist",
              "Because it infers that every pirate transaction represents a lost legitimate sale — but many pirate buyers would never have bought the real product",
              "Because the figure is in dollars, not rands",
              "Because it excludes online piracy",
            ],
            answer: 1,
            explain: "People buy pirated music because it is cheaper — it is not at all obvious that all would buy the real thing if piracy were unavailable.",
          },
          {
            q: "What is 'bootlegging'?",
            options: [
              "Copying just the music on a not-for-profit basis",
              "Copying the music and packaging to pass off as the real thing",
              "Recording and trading a performance (usually a live concert) that has not been officially released",
              "Buying music from a legitimate online store",
            ],
            answer: 2,
            explain: "Bootlegging is recording and trading a performance — usually a live concert — that has not been officially released.",
          },
          {
            q: "What is the ethical answer if you really like a CD you copied?",
            options: [
              "Keep the copy — no harm done",
              "Buy a legitimate copy and discard the pirated one",
              "Share it with more friends",
              "Sell the copy to recover costs",
            ],
            answer: 1,
            explain: "The 'Robin Hood' argument does not hold: if you really like the CD, buy a legitimate copy and discard the pirated one.",
          },
          {
            q: "What is 'counterfeiting' in the music piracy context?",
            options: [
              "Copying just the music on a not-for-profit basis",
              "Copying the music and the packaging and attempting to pass the copy off as the real thing",
              "Streaming music legally",
              "Recording a live concert",
            ],
            answer: 1,
            explain: "Counterfeiting copies both the music and the packaging, attempting to pass the copy off as the real thing.",
          },
        ],
      },
      {
        heading: "Software piracy in South Africa — the scale of the problem",
        icon: "globe",
        flat: true,
        paragraphs: [
          "Half of the software in use in South Africa has been illegal — not paid for, or pirated. In the US about 30% of software is pirated, in the UK 35%, and in the rest of Africa the rate runs into the 90% range. BSA figures showed South Africa's rate rising to 49% (from 48%) even as the worldwide rate fell to 38% — a retail revenue loss to the local software industry of R580-million. 'For almost every copy of software sold, another is pirated or stolen,' said Microsoft South Africa's director of legalisation.",
          "The Business Software Alliance (BSA) — an anti-piracy umbrella body made up of large software companies — recovered R300 000 in out-of-court settlements and committed to prosecuting offenders to the full extent of the law. Illegal copying and distribution of software is the main obstacle to the growth of the software sector, with worldwide industry losses estimated at US$11-billion in 1998.",
          "By 2006 about 36% of the software used by South African businesses was illegal, depriving more than 30 000 people of jobs in the multibillion-rand IT industry and representing at least R1,2bn in economic losses. 'Software piracy remains one of the major hurdles to realising the potential of the information economy in South Africa, on the continent and around the world,' said the BSA's local chairperson. Globally, piracy was most prevalent in Zimbabwe and Vietnam (90%); the African average topped 70%. BSA calculated that dropping the global piracy rate from 35% to 25% would create about 2,4 million new jobs and add $67bn in tax revenues worldwide.",
          "South African law does allow enforcement of copyright violation: the Intellectual Property Laws Amendment Act (effective 1 October 1997) brought South Africa closer to compliance with its World Trade Organisation TRIPS obligations, especially in protection for computer programs, compilations of data and databases, and audio-visual works.",
        ],
        slideQuiz: [
          {
            q: "What is the Business Software Alliance (BSA)?",
            options: [
              "A software retailer",
              "An anti-piracy umbrella body made up of large software companies",
              "A government tax authority",
              "A trade union for programmers",
            ],
            answer: 1,
            explain: "The BSA is an industry body representing commercial software developers and their hardware partners, fighting piracy through awareness, settlements and prosecution.",
          },
          {
            q: "According to the 2006 study, software piracy among South African businesses…",
            options: [
              "Was about 36%, depriving more than 30 000 people of jobs and costing at least R1,2bn",
              "Had been completely eliminated",
              "Was the lowest in the world",
              "Only affected the music industry",
            ],
            answer: 0,
            explain: "About 36% of business software was illegal — over 30 000 jobs lost and at least R1,2bn in economic losses.",
          },
          {
            q: "Which law brought South Africa closer to compliance with its TRIPS obligations?",
            options: [
              "The Companies Act of 1926",
              "The Intellectual Property Laws Amendment Act (effective 1 October 1997)",
              "The Labour Relations Act",
              "POPIA",
            ],
            answer: 1,
            explain: "The 1997 amendment improved protection for computer programs, data compilations, databases and audio-visual works.",
          },
          {
            q: "Roughly what share of software in use in South Africa was reported as illegal?",
            options: ["About half (rising to 49%)", "About 5%", "About 90%", "None"],
            answer: 0,
            explain: "Half of software in use has been illegal — BSA figures showed South Africa's rate rising to 49% even as the worldwide rate fell to 38%.",
          },
          {
            q: "What did the BSA calculate would happen if the global piracy rate dropped from 35% to 25%?",
            options: [
              "Nothing would change",
              "About 2,4 million new jobs and $67bn in added tax revenues worldwide",
              "Software prices would double",
              "Piracy would rise elsewhere",
            ],
            answer: 1,
            explain: "Dropping the global rate by ten points would create about 2,4 million new jobs and add $67bn in tax revenues worldwide.",
          },
        ],
      },
      {
        heading: "What is piracy? — the forms of software piracy",
        icon: "shield",
        flat: true,
        paragraphs: [
          "Software piracy is the failure to comply with software licence agreements. Piracy, in any form, is an unlawful action and offenders are liable to either civil or criminal prosecution. All software users and resellers must understand the different forms of software piracy in order to comply with the law and protect themselves and their business.",
          "The various forms of software piracy are:",
        ],
        bullets: [
          "End User Copying — a licensed software user passes their software on to friends, business colleagues and family to copy indiscriminately; or, with volume licences, users and businesses under-report the number of computers on which the software is installed.",
          "Reseller Copying — resellers pass their software on to their clients.",
          "Counterfeiting — criminals copy the software and collateral, such as manuals, and sell it as the original product.",
        ],
        slideQuiz: [
          {
            q: "What is software piracy?",
            options: [
              "Downloading free open-source software",
              "The failure to comply with software licence agreements — an unlawful action liable to civil or criminal prosecution",
              "Using software after office hours",
              "Selling second-hand computers",
            ],
            answer: 1,
            explain: "Software piracy is the failure to comply with software licence agreements, and offenders face civil or criminal prosecution.",
          },
          {
            q: "Under-reporting the number of computers on which volume-licensed software is installed is an example of…",
            options: ["End User Copying", "Reseller Copying", "Counterfeiting", "Bootlegging"],
            answer: 0,
            explain: "End User Copying includes both passing software to others and under-reporting installations under a volume licence.",
          },
          {
            q: "Why does piracy harm even lawful software users?",
            options: [
              "It does not affect them",
              "Lower vendor revenues limit re-investment in R&D, service and support — and pirate software may introduce viruses and carries no quality guarantees or technical support",
              "It makes software cheaper for everyone",
              "It only harms musicians",
            ],
            answer: 1,
            explain: "Piracy limits R&D investment; pirate products can carry viruses, destroy mission-critical data, and give no access to support.",
          },
          {
            q: "What is 'Reseller Copying'?",
            options: [
              "A reseller passing their software on to their clients",
              "A user copying software for family",
              "Criminals copying software and manuals to sell as originals",
              "Making a personal backup copy",
            ],
            answer: 0,
            explain: "Reseller Copying is when resellers pass their software on to their clients — one of the three forms of software piracy.",
          },
          {
            q: "What can happen to offenders who commit software piracy in any form?",
            options: [
              "Nothing — it is a civil matter only",
              "They are liable to either civil or criminal prosecution",
              "They receive a warning letter at most",
              "Only companies can be prosecuted, never individuals",
            ],
            answer: 1,
            explain: "Piracy in any form is an unlawful action and offenders are liable to either civil or criminal prosecution.",
          },
        ],
      },
      {
        heading: "Fighting piracy in South Africa — enforcement and industry action",
        icon: "checkCircle",
        flat: true,
        paragraphs: [
          "bidorbuy, one of South Africa's largest online marketplaces, took a proactive stance against the selling of pirated goods online, declaring combating piracy a top priority. 'Piracy is nothing less than serious theft. It is a crime that impacts right across our society, from government to the retail sector and right down to the individual customer, who, in buying pirated goods, ends up with inferior products. The only winners are the criminals,' said its managing director.",
          "bidorbuy works closely with industry bodies and authorities: the South African Police Services (SAPS), the Southern African Federation Against Copyright Theft (SAFACT), the Business Software Alliance (BSA) and the Independent Communications Authority of South Africa (ICASA). SAFACT — the trade association representing the entertainment industry, which loses approximately R200 million per annum to piracy — entered an agreement with bidorbuy to fight the sale of pirated DVD movies and games online.",
          "Law enforcement has also cracked down on DVD piracy (which crippled sales of local films such as Mama Jack and the Oscar-winning Tsotsi), and music industry figures raided Johannesburg streets to wipe out pirated CDs. So piracy in South Africa is addressed through: copyright legislation and TRIPS compliance; BSA prosecution and out-of-court settlements; SAFACT and SAPS enforcement action; online marketplaces policing their platforms; and public awareness campaigns that software piracy is stealing — no more, no less.",
        ],
        slideQuiz: [
          {
            q: "Which of these bodies works against copyright theft in the entertainment industry in Southern Africa?",
            options: ["SAFACT", "PAG", "ITARCS", "WCL"],
            answer: 0,
            explain: "The Southern African Federation Against Copyright Theft (SAFACT) represents the entertainment industry, which loses about R200 million a year to piracy.",
          },
          {
            q: "Which is NOT one of the ways piracy is addressed in South Africa?",
            options: [
              "Copyright legislation and TRIPS compliance",
              "BSA prosecutions and settlements",
              "Enforcement raids by SAFACT, SAPS and industry bodies",
              "Government subsidies for buyers of pirated software",
            ],
            answer: 3,
            explain: "Piracy is fought through legislation, prosecution, enforcement raids, online marketplace policing and public awareness — never subsidised.",
          },
          {
            q: "Approximately how much does the entertainment industry represented by SAFACT lose to piracy per annum?",
            options: ["R200 million", "R2 000", "R580", "R67bn"],
            answer: 0,
            explain: "SAFACT — the trade association representing the entertainment industry — loses approximately R200 million per annum to piracy.",
          },
          {
            q: "According to bidorbuy's managing director, who are the only winners when pirated goods are sold?",
            options: [
              "The customers, who save money",
              "The criminals",
              "The retailers",
              "The government",
            ],
            answer: 1,
            explain: "'Piracy is nothing less than serious theft… The only winners are the criminals' — customers end up with inferior products.",
          },
          {
            q: "Which South African films were named as victims of DVD piracy?",
            options: [
              "Mama Jack and the Oscar-winning Tsotsi",
              "District 9 and Invictus",
              "Sarafina and Yesterday",
              "No films were affected",
            ],
            answer: 0,
            explain: "DVD piracy crippled sales of local films such as Mama Jack and the Oscar-winning Tsotsi.",
          },
        ],
      },
    ],
    exercises: [
      {
        id: "ex1",
        title: "Question Session 1 — Professionalism and Codes of Practice for the computer industry in South Africa",
        task: "Time: 45 minutes · Activity: Self & Group",
        steps: [
          "Identify and explain acceptable and unacceptable professional practices found in the computer industry",
          "Identify and explain the CSSA as a professional body in South Africa",
          "Identify and explain the BITF as a professional body in South Africa",
          "Identify and explain the ITUC as a professional body in South Africa",
          "Identify and explain the ITA as a professional body in South Africa (at least 2 points)",
          "Identify and explain the codes of practice for the IT industry in South Africa",
        ],
        checks: [
          {
            answer: [
              "Acceptable practices follow the CSSA Code of Practice: keep yourself and subordinates up to date with new technologies, practices, legal requirements and standards; accept only work you are competent to perform; train subordinates on an equal opportunity basis; communicate through proper channels; be accountable for quality, timeliness and resources.",
              "Protect privacy, security and integrity: protect life, data and equipment (in that order); protect confidential information; give individuals rights of review, correction and appeal over data that may harm them.",
              "Unacceptable practices include claiming competence you do not possess, neglecting security and confidentiality, ignoring legal requirements, software piracy in any form, and using parts of the code in isolation to justify errors of omission or commission.",
            ],
            concepts: [
              ["up to date", "informed", "new technologies", "keep up", "competent", "competence"],
              ["confidential", "security", "privacy", "protect"],
              ["accountable", "quality", "responsib"],
              ["piracy", "claiming competence", "unacceptable", "neglect"],
            ],
            labels: [
              "Competence and keeping up to date",
              "Security, privacy and confidentiality",
              "Accountability and responsibility",
              "Unacceptable practices (false competence, piracy, neglect)",
            ],
            min: 2,
          },
          {
            answer: [
              "The CSSA (Computer Society of South Africa) is one of, if not the most respected associations concerned with South African Information Technology.",
              "It is established to elevate ICT capability and professionalism in South Africa: facilitating the exchange of opinions and views on ICT, representing industry practitioners to inform and lobby Government on ICT policy, disseminating ICT information via journals, lectures, seminars and conferences, improving technical knowledge and elevating the professional status of persons engaged in ICT.",
              "It publishes the Code of Practice and Code of Conduct that prescribe minimum standards of practice and behaviour for all professional members.",
            ],
            concepts: [
              ["computer society", "cssa"],
              ["professionalism", "professional status", "elevate"],
              ["code of practice", "code of conduct", "minimum standards"],
              ["government", "lobby", "policy", "represent"],
            ],
            labels: [
              "The Computer Society of South Africa",
              "Elevating ICT capability and professionalism",
              "Publishes the codes of practice and conduct",
              "Represents practitioners and lobbies government",
            ],
            min: 2,
          },
          {
            answer: [
              "The BITF (Black Information Technology Forum) was launched in Cape Town in 1995 to propel black individuals into the mainstream of the ICT industry, becoming a national organisation in 1998 with 2 400 members.",
              "It is the largest organisation representing the interests of black people in South Africa's ICT industry and has considerable credibility with government bodies.",
              "It aims to empower members with technical and business skills, improve access to technology for historically disadvantaged communities, actively influence policy-making forums, and promote the status of historically disadvantaged individuals and communities in the ICT sector.",
            ],
            concepts: [
              ["black information technology forum", "bitf", "black"],
              ["1995", "cape town", "launched"],
              ["empower", "skills", "disadvantaged"],
              ["policy", "government", "represent"],
            ],
            labels: [
              "The Black Information Technology Forum",
              "Launched in Cape Town in 1995",
              "Empowering historically disadvantaged people",
              "Influencing policy and representing members",
            ],
            min: 2,
          },
          {
            answer: [
              "The ITUC (International Trade Union Confederation) is the world's largest trade union federation.",
              "It was formed on 1 November 2006 out of the merger of the International Confederation of Free Trade Unions (ICFTU) and the World Confederation of Labour (WCL).",
              "This union assists the South African IT market in trading internationally, thus empowering the market — but more so those in the emerging sector of the market.",
            ],
            concepts: [
              ["trade union", "union"],
              ["largest", "world"],
              ["2006", "merger", "icftu", "wcl"],
              ["international", "trading", "emerging"],
            ],
            labels: [
              "A trade union federation",
              "The world's largest",
              "Formed in 2006 from the ICFTU/WCL merger",
              "Helps SA's IT market trade internationally",
            ],
            min: 2,
          },
          {
            answer: [
              "The ITA (Information Technology Association) is the official trade and employer body of the ICTe industry, striving to promote consistent standards of professionalism and service.",
              "Its purpose is to represent and promote the interests of its members — employers active in the Information Technology sector — nationally and internationally at governmental, NGO, parastatal and business level.",
              "Founded in 1934, it was renamed the ITA after the amalgamation of the Business Equipment Association and the Computer Services Association.",
              "It assembles and disseminates information, provides a networking and marketing platform, and operates through three divisions: the Information Technology Users Council (ITUC), the Recruitment Consultancy Services Group (ITARCS) and the Payroll Authors Group (PAG).",
            ],
            concepts: [
              ["information technology association", "ita", "trade", "employer"],
              ["represent", "promote", "interests", "members"],
              ["professionalism", "standards", "service"],
              ["1934", "founded", "divisions", "ituc", "itarcs", "pag", "networking"],
            ],
            labels: [
              "Official trade and employer body of the ICTe industry",
              "Represents and promotes employers' interests",
              "Promotes consistent standards of professionalism",
              "History and divisions (ITUC, ITARCS, PAG)",
            ],
            min: 2,
          },
          {
            answer: [
              "The codes of practice are set out by the Computer Society of South Africa in its Code of Practice — a series of statements prescribing minimum standards of practice for all professional members, observed in the spirit and not merely to the word.",
              "Its main areas are: personal competence and keeping up to date (accept only work you are competent to perform); organisation and management (plan and review objectives, assign tasks by ability, maintain communication, be accountable for quality and timeliness); contracting (seek expert advice; cover all requirements and responsibilities).",
              "Privacy, security and integrity (evaluate risks; protect life, data and equipment in that order; protect confidential information; rights of review and correction); development (impartiality, standards, client participation, testing, documentation, plain-language input/output, restore procedures); implementation (training, planned changeover, adequate testing); and live systems (reliable processing, performance reviews, maintenance support, user liaison).",
            ],
            concepts: [
              ["cssa", "computer society", "code of practice"],
              ["minimum standards", "spirit"],
              ["competence", "management", "contracting", "organisation"],
              ["security", "privacy", "development", "implementation", "live systems"],
            ],
            labels: [
              "Set out by the CSSA Code of Practice",
              "Minimum standards observed in the spirit",
              "Competence, management and contracting",
              "Security, development, implementation and live systems",
            ],
            min: 2,
          },
        ],
      },
      {
        id: "ex2",
        title: "Question Session 2 — Code of ethics in the computer industry in South Africa",
        task: "Time: 45 minutes · Activity: Self & Group",
        steps: [
          "Explain how the computer industry supports equality of opportunity",
          "Explain how the computer industry is against computer software piracy",
          "Identify ways in which piracy is addressed in South Africa",
        ],
        checks: [
          {
            answer: [
              "The CSSA Code of Practice requires that subordinates are trained on an equal opportunity basis, in order to be effective in their duties and to qualify for increased responsibilities.",
              "Bodies such as the BITF work to propel black individuals into the mainstream of the ICT industry, improve access to technology for historically disadvantaged communities, and promote the status of historically disadvantaged individuals and communities in the ICT sector.",
              "The CSSA's constitution commits it to education and training that elevates the level of ICT capability in South Africa, and to community development that enhances the standards and levels of ICT for the greater good of the South African people.",
            ],
            concepts: [
              ["equal opportunity", "equality"],
              ["training", "trained", "education"],
              ["disadvantaged", "bitf", "access"],
              ["community", "development"],
            ],
            labels: [
              "Training on an equal opportunity basis",
              "Education and training for all",
              "Empowering historically disadvantaged people",
              "Community development",
            ],
            min: 2,
          },
          {
            answer: [
              "Software piracy is the failure to comply with software licence agreements — an unlawful action in any form, with offenders liable to civil or criminal prosecution.",
              "The Business Software Alliance (BSA) — an anti-piracy umbrella body made up of large software companies — raises public awareness, recovers losses through out-of-court settlements, and prosecutes offenders to the full extent of the law.",
              "The industry emphasises the harm piracy does: lower vendor revenues limit re-investment in research and development and support infrastructures; pirate software may introduce viruses and gives users no quality guarantees or technical support; and piracy deprives the economy of jobs — 'software piracy is stealing, no more, no less.'",
            ],
            concepts: [
              ["licence", "license", "agreement", "unlawful", "illegal"],
              ["bsa", "business software alliance", "prosecut", "settlement"],
              ["stealing", "theft", "crime"],
              ["jobs", "revenue", "r&d", "research", "viruses", "harm"],
            ],
            labels: [
              "Piracy breaks licence agreements and the law",
              "BSA awareness, settlements and prosecution",
              "Piracy is stealing",
              "The harm piracy does to industry and jobs",
            ],
            min: 2,
          },
          {
            answer: [
              "Legislation: the Intellectual Property Laws Amendment Act (effective 1 October 1997) strengthened protection for computer programs, compilations of data and databases, moving South Africa closer to compliance with the World Trade Organisation's TRIPS agreement.",
              "Enforcement and prosecution: the Business Software Alliance recovers losses through out-of-court settlements and prosecutes offenders; law enforcement (SAPS) and SAFACT conduct crackdowns and raids on pirated DVDs and CDs.",
              "Industry and marketplace action: online marketplaces such as bidorbuy work with SAPS, SAFACT, the BSA and ICASA to combat pirated goods sold online; and public awareness campaigns remind South Africans that buying, selling or illegally copying software supports crime.",
            ],
            concepts: [
              ["legislation", "intellectual property", "copyright", "trips", "law"],
              ["bsa", "prosecut", "settlement", "enforcement"],
              ["safact", "saps", "raid", "crackdown"],
              ["bidorbuy", "online", "awareness", "icasa"],
            ],
            labels: [
              "Copyright legislation and TRIPS compliance",
              "BSA prosecution and settlements",
              "SAFACT and SAPS enforcement raids",
              "Online marketplace policing and public awareness",
            ],
            min: 2,
          },
        ],
      },
    ],
    assignments: [],
    selfAssessment: {
      intro: [
        "You are now ready to go through a check list. Be honest with yourself.",
        "Tick the box with either a \u221A or an X to indicate your response.",
      ],
      items: [
        "I am able to describe professionalism for the computer industry in South Africa.",
        "I am able to describe the codes of practice for professionalism in the IT industry in South Africa.",
        "I am able to describe the code of ethics in the computer industry in South Africa.",
      ],
      outro: [
        "You must think about any point you could not tick. Write this down as a goal.",
        "Decide on a plan of action to achieve these goals. Regularly review these goals.",
        "Show your completed self-assessment to your facilitator and make the necessary arrangements to assist you to become competent in any area you could not tick.",
      ],
    },
    quiz: [
      {
        q: "What is the CSSA Code of Practice?",
        options: [
          "A price list for professional IT services in South Africa",
          "A series of statements that prescribe minimum standards of practice, observed in the spirit and not merely to the word",
          "A licence agreement for commercial software",
          "An employment contract for IT workers",
        ],
        answer: 1,
        explain: "The Code of Practice is directed to all professional members of the CSSA and prescribes minimum standards of practice — viewed as a whole and observed in the spirit.",
      },
      {
        q: "Which body was launched in Cape Town in 1995 to propel black individuals into the mainstream of the ICT industry?",
        options: ["CSSA", "BITF", "ITUC", "ITA"],
        answer: 1,
        explain: "The Black Information Technology Forum (BITF) became a national organisation in 1998 and is the largest organisation representing the interests of black people in South Africa's ICT industry.",
      },
      {
        q: "In the event of disaster, clause 4.4 of the Code of Practice says staff must be trained to protect — in this order:",
        options: [
          "Equipment, data, life",
          "Data, equipment, life",
          "Life, data, equipment",
          "Whatever is most expensive first",
        ],
        answer: 2,
        explain: "Protect life, data and equipment — in that order. The safety of people always comes first.",
      },
      {
        q: "How does the CSSA Code of Practice support equality of opportunity?",
        options: [
          "By reserving membership for senior managers",
          "By requiring that subordinates are trained on an equal opportunity basis, to be effective in their duties and to qualify for increased responsibilities",
          "By setting equal salaries across the industry",
          "By limiting training to those already qualified",
        ],
        answer: 1,
        explain: "Clause 1.2 requires training on an equal opportunity basis, and the CSSA constitution commits to education, training and community development for all.",
      },
      {
        q: "Which of these is NOT one of the ways piracy is addressed in South Africa?",
        options: [
          "Copyright legislation and TRIPS compliance",
          "BSA prosecutions and out-of-court settlements",
          "Enforcement raids by SAFACT and SAPS",
          "Government subsidies for buyers of pirated software",
        ],
        answer: 3,
        explain: "Piracy is fought through legislation, prosecution, enforcement raids, online marketplace policing and public awareness — it is never subsidised.",
      },
      {
        q: "What is the Computer Society of South Africa (CSSA) known as today?",
        options: [
          "The Business Software Alliance (BSA)",
          "The Institute of Information Technology Professionals South Africa (IITPSA)",
          "The Information Technology Association (ITA)",
          "The Southern African Federation Against Copyright Theft (SAFACT)",
        ],
        answer: 1,
        explain: "The CSSA is now the IITPSA — and the legacy CSSA Code of Practice and professional conduct guidelines are found through the official IITPSA website.",
      },
      {
        q: "Which set of steps starts an IITPSA membership application?",
        options: [
          "Write a letter to the Minister of Communications",
          "Create a profile on the IITPSA Membership Portal, choose your membership tier, submit certified qualifications and a CV, and pay the relevant application and annual fees",
          "Pass a practical exam at any university",
          "Ask an existing member to nominate you at the AGM",
        ],
        answer: 1,
        explain: "Membership begins on the IITPSA Membership Portal: create a profile, choose a tier, submit certified qualifications and a CV, and pay the application and annual fees.",
      },
      {
        q: "What is the purpose of the Computer Society of South Africa as set out in its Constitution?",
        options: [
          "To sell computer hardware to government departments",
          "To elevate ICT capability and professionalism in South Africa",
          "To regulate internet service providers",
          "To set retail prices for software",
        ],
        answer: 1,
        explain: "The Society is established to elevate Information and Communications Technology capability and professionalism in South Africa.",
      },
      {
        q: "According to clause 1.3 of the Code of Practice, a professional member should…",
        options: [
          "Accept any work offered and learn on the job",
          "Accept only work they believe they are competent to perform, obtaining additional expertise where advisable",
          "Refuse all unfamiliar work permanently",
          "Delegate difficult work without review",
        ],
        answer: 1,
        explain: "Be aware of your own limitations, never knowingly imply competence you do not possess, and bring in appropriately qualified expertise when advisable.",
      },
      {
        q: "Clause 2.4 makes a professional accountable for…",
        options: [
          "Only the technical accuracy of their code",
          "The quality, timeliness and use of resources in the work for which they are responsible",
          "The profits of the whole company",
          "Their colleagues' mistakes",
        ],
        answer: 1,
        explain: "Provide a service of agreed quality, on time and within budget — planning for contingencies and making others aware of foreseeable difficulties.",
      },
      {
        q: "What are the four areas of spending on system security under clause 4.1?",
        options: [
          "Hardware, software, network, people",
          "Protection, Detection, Suppression, Recovery",
          "Firewalls, antivirus, backups, passwords",
          "Plan, Do, Check, Act",
        ],
        answer: 1,
        explain: "Protection prevents threats becoming reality; Detection in time to act; Suppression limits the effect; Recovery rectifies and gets the system going again.",
      },
      {
        q: "Under clause 5.5, why should the client participate in all stages of system development?",
        options: [
          "To reduce the developer's workload",
          "Because the system ultimately belongs to the client — involvement ensures you produce the system the client requires",
          "Because clients enjoy writing code",
          "To transfer legal liability to the client",
        ],
        answer: 1,
        explain: "Seek the client's involvement in key activities such as specification, quality control and test data — the system ultimately belongs to the client.",
      },
      {
        q: "Under clause 6.1, when is your task complete?",
        options: [
          "When the code compiles",
          "When the invoice is paid",
          "Not until you have seen the system through to implementation and the client's staff can use it effectively",
          "When the project manager signs off the design",
        ],
        answer: 2,
        explain: "Professional duty requires seeing the system through to implementation, with users trained in advance to counter resistance to change.",
      },
      {
        q: "What is software piracy?",
        options: [
          "Downloading free open-source software",
          "The failure to comply with software licence agreements — an unlawful action liable to civil or criminal prosecution",
          "Using software after office hours",
          "Selling second-hand computers",
        ],
        answer: 1,
        explain: "Software piracy is the failure to comply with software licence agreements; offenders face civil or criminal prosecution. Its forms are End User Copying, Reseller Copying and Counterfeiting.",
      },
      {
        q: "Which trade association represents the entertainment industry against copyright theft in Southern Africa?",
        options: ["SAFACT", "PAG", "ITARCS", "WCL"],
        answer: 0,
        explain: "The Southern African Federation Against Copyright Theft (SAFACT) — the entertainment industry loses approximately R200 million per annum to piracy.",
      },
    ],

    logbook: {
      assignmentTitle: "Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa",
      programme: "Information Technology — Systems Support",
      unitLabel: "114055 — Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa",
      detailFields: [
        "Learner Name",
        "Qualification",
        "Group / Class",
        "Workplace Name",
        "Supervisor / Mentor",
        "Start & Completion Date",
      ],
      project: {
        time: "45 minutes",
        title: "Project — Code of Ethics",
        text: "Compile an ideal example of an ideal code of ethics derived from the current code of ethics followed within the South African IT industry. Attach your project here and mark it 114055.",
        resource: "Logbook",
      },
      knowledgeQuestions: [
        { text: "The description identifies acceptable and unacceptable professional practices found in the computer industry.", marks: [true, false, false, true, false, false] },
        { text: "The description identifies known professional bodies in South Africa.", marks: [true, false, false, true, false, false] },
        { text: "A short description of each named professional body is provided.", marks: [true, false, false, true, false, false] },
        { text: "The description identifies the codes of practice for the IT industry in South Africa.", marks: [true, true, true, true, true, true] },
        { text: "The description provides a brief explanation of the codes of practice identified.", marks: [true, false, false, true, false, false] },
        { text: "The description confirms that the computer industry supports equality of opportunity.", marks: [true, false, false, true, false, false] },
        { text: "The description confirms the understanding that the computer industry is against computer software piracy.", marks: [true, false, false, true, false, false] },
        { text: "The description identifies ways in which piracy is addressed in South Africa.", marks: [true, false, false, true, false, false] },
      ],
      practicalActivities: [
        { text: "Describe acceptable and unacceptable professional behaviour expected in the South African computer industry.", marks: [true, true, true, true, true, true] },
        { text: "Research and explain the purpose and role of professional bodies such as CSSA, BITF, ITUC and ITA.", marks: [true, false, false, true, false, false] },
        { text: "Explain the South African codes of practice and how they guide professional conduct in IT work.", marks: [true, false, false, true, false, false] },
      ],
      workplaceActivities: [
        "Identify acceptable and unacceptable professional practices in the computer industry.",
        "Identify known professional bodies in South Africa.",
        "Provide a short description of each named professional body.",
        "Identify the codes of practice for the IT industry in South Africa.",
        "Explain the codes of practice identified.",
        "Confirm that the computer industry supports equality of opportunity.",
        "Confirm that the computer industry is against software piracy.",
        "Identify ways in which piracy is addressed in South Africa.",
      ],
      workplaceEvidenceNote: "The workplace completes this section after observing the learner having complied with and completed all the activities mentioned below.",
      otherActivities: [
        {
          activity: "Describe the code of ethics in the computer industry in South Africa.",
          evidence: "Project — Code of Ethics: Compile an ideal example of an ideal code of ethics derived from the current code of ethics followed within the South African IT industry. Attach your project here and mark it 114055.",
        },
      ],
      otherEvidenceNote: "Learner evidence and experience is recorded here. Make reference to equipment, chemicals and materials that were used in these processes.",
      projectChecklist: [{ no: "1", name: "114055" }],
    },

    lessonPlan: {
      title: "Facilitator Preparation",
      startTime: "09:00",
      details: [
        { icon: "calendar", label: "Date", value: "Friday, 14 August 2026" },
        { icon: "clock", label: "Time", value: "09:00 \u2013 14:00 · lunch 12:00 \u2013 13:00" },
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
              time: "25 minutes",
              title: "Index & Unit Standard Alignment — Facilitator",
              text: [
                "Read through the index with the learners, highlighting the areas that will be covered in this manual. Make reference to the Unit Standard Alignment Index to outline the specific outcomes that will be covered.",
              ],
              resources: ["LM p3"],
            },
            {
              time: "60 minutes",
              title: "Codes of practice for the IT industry in SA — Facilitator & Class",
              bullets: [
                "Read through pages 4-16 of the learner manual, identifying the codes of practice of the IT industry in South Africa.",
              ],
              resources: ["LM p4-16"],
            },
            {
              time: "30 minutes",
              title: "Questionnaire 1 — Class in pairs",
              bullets: [
                "Facilitator to read through the questions with the learners, ensuring they understand what is expected of them.",
                "Allow the learners to complete the questions; take feedback from two groups/pairs.",
              ],
              resources: ["LM p17-19"],
            },
            {
              time: "10 minutes",
              title: "Break",
              break: true,
            },
            {
              time: "55 minutes",
              title: "Codes of ethics in the computer industry — Facilitator & Class",
              bullets: [
                "Read through pages 20-25 of the learner manual, identifying the codes of ethics in the computer industry.",
              ],
              resources: ["LM p20-25"],
            },
            {
              time: "60 minutes",
              title: "Lunch",
              break: true,
            },
            {
              time: "30 minutes",
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
