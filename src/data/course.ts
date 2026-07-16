import type { CourseModule } from "../types";

export const COURSE_META = {
  title: "National Certificate: Information Technology – System Support",
  saqaId: "48573",
  nqfLevel: 5,
  credits: 148,
  qualityAssurance: "QCTO / MICT SETA",
  time: "09h00 - 14h00",
};

export const MODULES: CourseModule[] = [
  {
    id: "m1",
    name: "Personal Development",
    icon: "person",
    activities: 6,
    units: [
      { us: "8252", title: "Writing business reports in Retail/Wholesale practices", nqf: 5, credits: 6, dates: "17 Jul 2026", time: "09h00 - 14h00" },
      { us: "10135", title: "Work as a project team member", nqf: 4, credits: 8, dates: "24, 31 Jul 2026", time: "09h00 - 14h00" },
      { us: "114050", title: "Explain the principles of business and the role of information technology", nqf: 5, credits: 4, dates: "7 Aug 2026", time: "09h00 - 14h00" },
      { us: "114051", title: "Conduct a technical practitioners meeting", nqf: 5, credits: 4, dates: "14 Aug 2026", time: "09h00 - 14h00" },
      { us: "114055", title: "Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa", nqf: 5, credits: 3, dates: "21 Aug 2026", time: "09h00 - 14h00" },
      { us: "114046", title: "Demonstrate an understanding of issues affecting the management of a local area computer network (LAN)", nqf: 5, credits: 4, dates: "28 Aug 2026", time: "09h00 - 14h00" },
      { us: "114183", title: "Apply the principles of resolving problems for single-user and multi-user computer operating systems", nqf: 5, credits: 7, dates: "4, 11 Sep 2026", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m2",
    name: "Client Server Networking",
    icon: "network",
    activities: 4,
    units: [
      { us: "114058", title: "Demonstrate an understanding of the concepts of Multi-User computer Operating systems", nqf: 5, credits: 7, dates: "18, 25 Sep 2026", time: "09h00 - 14h00" },
      { us: "114059", title: "Demonstrate an understanding of estimating a unit of work and the implications of late delivery", nqf: 5, credits: 5, dates: "2 Oct 2026", time: "09h00 - 14h00" },
      { us: "114076", title: "Use computer technology to research a computer topic", nqf: 4, credits: 3, dates: "9 Oct 2026", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m3",
    name: "Network, Concept, Architecture",
    icon: "globe",
    activities: 5,
    units: [
      { us: "114060", title: "Demonstrate an understanding of local area computer networks, by installing a networked workstation", nqf: 5, credits: 5, dates: "16 Oct 2026", time: "09h00 - 14h00" },
      { us: "114061", title: "Demonstrate an understanding of Wide Area Computer Networks (WANs), comparing them with Local Area Networks (LANs)", nqf: 5, credits: 5, dates: "23 Oct 2026", time: "09h00 - 14h00" },
      { us: "114072", title: "Install and commission a local area computer network", nqf: 5, credits: 9, dates: "30 Oct, 6 Nov 2026", time: "09h00 - 14h00" },
      { us: "114074", title: "Demonstrate an understanding of different computer network architectures and standards", nqf: 5, credits: 5, dates: "13 Nov 2026", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m4",
    name: "Design a LAN for Developmental Office & Enterprise Development",
    icon: "design",
    activities: 5,
    units: [
      { us: "114052", title: "Demonstrate appropriate customer care in the context of IT support, according to a Service Level Agreement", nqf: 5, credits: 8, dates: "20, 27 Nov 2026", time: "09h00 - 14h00" },
      { us: "114056", title: "Describe enterprise systems management and its role in IT systems support", nqf: 5, credits: 3, dates: "4 Dec 2026", time: "09h00 - 14h00" },
      { us: "114075", title: "Design a local area computer network for a departmental office environment", nqf: 5, credits: 3, dates: "11 Dec 2026", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m5",
    name: "Configure, Operate & Administer Server Computer & Peripherals",
    icon: "server",
    activities: 5,
    units: [
      { us: "114047", title: "Install and configure a multi-user networked operating system", nqf: 5, credits: 9, dates: "15, 22 Jan 2027", time: "09h00 - 14h00" },
      { us: "114053", title: "Monitor and maintain a multi-user networked operating system", nqf: 5, credits: 6, dates: "29 Jan 2027", time: "09h00 - 14h00" },
      { us: "114054", title: "Administer a local area computer network", nqf: 5, credits: 7, dates: "5, 12 Feb 2027", time: "09h00 - 14h00" },
      { us: "114066", title: "Test Networked IT systems against given specifications", nqf: 5, credits: 4, dates: "19 Feb 2027", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m6",
    name: "Database Access",
    icon: "database",
    activities: 5,
    units: [
      { us: "114048", title: "Create database access for a computer application using structured query language", nqf: 5, credits: 9, dates: "26 Feb, 5, 12 Mar 2027", time: "09h00 - 14h00" },
      { us: "114049", title: "Demonstrate an understanding of Computer Database Management Systems", nqf: 5, credits: 7, dates: "19, 26 Mar 2027", time: "09h00 - 14h00" },
      { us: "114069", title: "Administer security systems for a multi-user computer system", nqf: 6, credits: 15, dates: "2, 9, 16, 23, 30 Apr 2027", time: "09h00 - 14h00" },
    ],
  },
];

export const PROGRAMME_ABOUT = {
  intro:
    "This qualification provides the student with the opportunity to pursue a career in support in the Information Technology field.",
  lead: "On completion, the graduate will be able to:",
  outcomes: [
    { icon: "wrench", text: "Troubleshoot hardware & software problems — investigate, diagnose, solve" },
    { icon: "monitor", text: "Install, configure & maintain hardware, applications, systems and networks" },
    { icon: "briefcase", text: "Understand the role of technology in the business context" },
    { icon: "database", text: "Store, manage & retrieve data to meet organisational requirements" },
    { icon: "shield", text: "Secure information systems against data loss and breaches of integrity" },
    { icon: "calendar", text: "Plan & undertake scheduled maintenance upgrades" },
    { icon: "chat", text: "Talk to clients and users to determine the nature of problems" },
    { icon: "chip", text: "Repair equipment and replace parts" },
  ],
  saqaLink: {
    label: "View the registered qualification on SAQA (ID 48573)",
    url: "https://allqs.saqa.org.za/showQualification.php?id=48573",
  },
};

export const PROGRAMME_PURPOSE = {
  intro:
    "The purpose of this qualification is to develop learners with the requisite competencies against the skills profile for the systems support career path — the overarching aim being to develop a broader base of skilled ICT professionals to underpin economic growth.",
  pathway: [
    {
      icon: "layers",
      title: "NQF Level 4",
      desc: "National Certificate: IT Technical Support (or equivalent) — used as prior learning",
      current: false,
    },
    {
      icon: "server",
      title: "NQF Level 5 — you are here",
      desc: "Systems Support, 148 credits, earned in the workplace through the learnership",
      current: true,
    },
    {
      icon: "gradcap",
      title: "Beyond",
      desc: "Credits towards Computer Studies/Science · employment in industry · professional body membership",
      current: false,
    },
  ],
  pathwayNote:
    "The qualification may be acquired through formal study or in the workplace through learnerships — so practical experience is gained WHILE qualifying, solving the old problem of graduates being turned away for lacking experience.",
  designedTo: [
    { icon: "gradcap", text: "Give undergraduate entry into networking/systems support with credits towards tertiary study" },
    { icon: "briefcase", text: "Prepare learners for initial employment in the computer industry" },
    { icon: "trend", text: "Recognise NQF Level 4 IT credits as prior learning" },
    { icon: "dashboard", text: "Feed learnership schemes across the ICT sector and beyond" },
  ],
  competencies: [
    { icon: "wrench", text: "Logical troubleshooting of day-to-day hardware & software problems" },
    { icon: "briefcase", text: "The role of technology in the business context" },
    { icon: "chat", text: "Integrated technology-based communication systems" },
    { icon: "database", text: "Storing, managing & retrieving data for the organisation" },
    { icon: "shield", text: "Secure information systems — no data loss, no integrity breaches" },
    { icon: "document", text: "Reflecting business structure in IT systems for efficiency" },
    { icon: "chip", text: "Mobilising technical resources to solve business problems" },
    { icon: "trend", text: "Cost-effective performance in technology-based projects" },
    { icon: "person", text: "Managing customer relations appropriately" },
    { icon: "layers", text: "Working within change, release & configuration processes" },
    { icon: "search", text: "Using research tools and knowledge-base repositories" },
    { icon: "award", text: "Identifying & communicating business opportunities" },
    { icon: "monitor", text: "Installing, supporting & maintaining end-user applications" },
  ],
  nb: "This qualification has been developed within a contextual qualifications framework — electives indicate the context in which the overall learning programme is designed and assessed. The core components form the generic base, contextualised to meet the unique and specific issues of the ICT sector and the range of enabled (vertical) markets. It has also been developed to assist with professionalisation across the IT industry, allowing qualified learners to gain membership of registered professional bodies in the ICT industry.",
  rationaleLead:
    "An increasing dissatisfaction of industry employers with the stated lack of ability of 'paper-certified' graduates seeking employment in systems support and networking precipitated a review of the competencies desired by industry.",
  rationale:
    "Three years of research in the sector revealed the need for entry-level candidates who can apply a range of institutionally acquired skills in the workplace, in the field of systems support, in a manner that adds business value. The stated requirement is for a new set of skills and competencies, within the specific focus of networking/systems support, contextualised as appropriate for a wide range of related industry sectors.",
};

export const WHAT_YOULL_LEARN = {
  areas: [
    { icon: "person", text: "Personal Development", desc: "Business reports, project teamwork, technical meetings, ethics and professional conduct in IT." },
    { icon: "server", text: "Server Installation and Configuration", desc: "Install and configure multi-user networked operating systems from bare metal to running service." },
    { icon: "wrench", text: "Server Administration", desc: "Monitor, maintain and administer servers, networks and backups day to day." },
    { icon: "layers", text: "Server Configuring Advanced Services", desc: "Configure advanced network services, security and multi-user environments against specification." },
    { icon: "monitor", text: "Desktop Infrastructure Implementation", desc: "Build, install and support networked workstations and the desktop environment." },
    { icon: "dashboard", text: "Desktop Application Environment Implementation", desc: "Deploy, support and maintain end-user applications across the organisation." },
    { icon: "document", text: "Enterprise Development", desc: "LAN design for departmental offices, enterprise systems management and SQL database access." },
  ],
  facts: [
    { icon: "award", label: "Qualification level", value: "NQF Level 5", detail: "148 credits · SAQA ID 48573" },
    { icon: "document", label: "Minimum admission requirements", value: "Grade 12", detail: "National Senior Certificate or equivalent" },
    { icon: "briefcase", label: "Career opportunities", value: "", detail: "", pills: ["End-User Support Technician", "IT Technician", "Network Technician", "System Administrator"] },
    { icon: "clock", label: "Duration", value: "1 Year", detail: "Full-time · 17 Jul 2026 – 25 Jun 2027" },
  ] as { icon: string; label: string; value: string; detail: string; pills?: string[] }[],
};

export const RESOURCES = [
  {
    title: "SAQA — Qualification & Unit Standard search",
    url: "https://allqs.saqa.org.za/",
    desc: "Look up the registered unit standards (e.g. US 114047, 114048) and their outcomes.",
  },
  {
    title: "Microsoft Learn",
    url: "https://learn.microsoft.com/",
    desc: "Free training for Windows Server, Active Directory, SQL Server and Microsoft 365 administration.",
  },
  {
    title: "W3Schools SQL Tutorial",
    url: "https://www.w3schools.com/sql/",
    desc: "Practise SQL SELECT, INSERT, UPDATE and JOIN queries for Module 6 (US 114048).",
  },
  {
    title: "CompTIA A+ / Network+ objectives",
    url: "https://www.comptia.org/certifications",
    desc: "Industry certification objectives that align well with the systems support curriculum.",
  },
  {
    title: "POPIA — Protection of Personal Information Act",
    url: "https://www.gov.za/documents/protection-personal-information-act",
    desc: "South African data protection law — relevant to ethics and professionalism (US 114055).",
  },
];

export const POE_SECTIONS: { heading: string; icon: string; items: { id: string; label: string }[] }[] = [
  {
    heading: "1. Identity & contracting",
    icon: "person",
    items: [
      { id: "id-copy", label: "Certified copy of ID" },
      { id: "agreement", label: "Signed learnership agreement (learner, employer, provider)" },
      { id: "induction", label: "Induction record and programme orientation sign-off" },
      { id: "cv", label: "Curriculum vitae" },
    ],
  },
  {
    heading: "2. Formative assignments (with signed declarations & rubrics)",
    icon: "exercise",
    items: [
      { id: "fa01", label: "SS-M1-FA01 — Personal Development (submitted & assessed)" },
      { id: "fa02", label: "SS-M2-FA02 — Client Server Networking (submitted & assessed)" },
      { id: "fa03", label: "SS-M3-FA03 — Network, Concept, Architecture (submitted & assessed)" },
      { id: "fa04", label: "SS-M4-FA04 — LAN Design & Customer Care (submitted & assessed)" },
      { id: "fa05", label: "SS-M5-FA05 — Server Administration (submitted & assessed)" },
      { id: "fa06", label: "SS-M6-FA06 — Database Access & Security (submitted & assessed)" },
    ],
  },
  {
    heading: "3. Knowledge assessments",
    icon: "clipboard",
    items: [
      { id: "ka1", label: "Module 1 knowledge test script filed" },
      { id: "ka2", label: "Module 2 knowledge test script filed" },
      { id: "ka3", label: "Module 3 knowledge test script filed" },
      { id: "ka4", label: "Module 4 knowledge test script filed" },
      { id: "ka5", label: "Module 5 knowledge test script filed" },
      { id: "ka6", label: "Module 6 knowledge test script filed" },
    ],
  },
  {
    heading: "4. Practical observation checklists (assessor-witnessed)",
    icon: "monitor",
    items: [
      { id: "ob-workstation", label: "Workstation installation observed (US 114060)" },
      { id: "ob-lan", label: "LAN installation & commissioning observed (US 114072)" },
      { id: "ob-sla", label: "SLA role-play observed (US 114052)" },
      { id: "ob-server", label: "Server installation & configuration observed (US 114047)" },
      { id: "ob-backup", label: "Backup and test restore observed (US 114054)" },
      { id: "ob-security", label: "Security administration observed (US 114069)" },
    ],
  },
  {
    heading: "5. Workplace evidence",
    icon: "briefcase",
    items: [
      { id: "we-reports", label: "Business reports written at work (US 8252)" },
      { id: "we-minutes", label: "Meeting agendas and minutes (US 114051)" },
      { id: "we-tickets", label: "Resolved tickets with 6-step documentation (US 114183)" },
      { id: "we-maintenance", label: "Maintenance and monitoring records (US 114053)" },
      { id: "we-sql", label: "SQL scripts / database work samples (US 114048)" },
    ],
  },
  {
    heading: "6. Testimonies & logbook",
    icon: "book",
    items: [
      { id: "tw-mentor", label: "Witness testimony — workplace mentor" },
      { id: "tw-manager", label: "Witness testimony — line manager/supervisor" },
      { id: "lb-weekly", label: "Logbook complete with weekly entries" },
      { id: "lb-mentor", label: "Logbook signed by mentor per module" },
      { id: "lb-final", label: "Final logbook sign-off (11, 18 or 25 Jun 2027)" },
    ],
  },
  {
    heading: "7. Summative & remediation",
    icon: "certificate",
    items: [
      { id: "sr-remedial", label: "Remediation records filed (if applicable)" },
      { id: "sr-fisa", label: "FISA completed (28 May – 4 Jun 2027)" },
      { id: "sr-moderation", label: "POE submitted for internal moderation" },
      { id: "sr-verified", label: "POE verified by MICT SETA" },
    ],
  },
];

export const POE_TOTAL = POE_SECTIONS.reduce((n, s) => n + s.items.length, 0);

export const MODULE_FLOW = {
  steps: [
    { name: "Study", desc: "Work through the unit standard study notes" },
    { name: "Practise", desc: "Complete the activities & practicals" },
    { name: "Logbook", desc: "Record your workplace evidence" },
    { name: "Quiz", desc: "Pass the module quiz (80%+)" },
    { name: "Assignment", desc: "Submit the official assignment for your POE" },
  ],
};

export const PROGRAMME_MILESTONES = [
  { name: "Remedials", dates: "7, 14, 21 May 2027", time: "09h00 - 14h00", icon: "wrench" },
  { name: "FISA (Final Integrated Summative Assessment)", dates: "28 May – 4 Jun 2027", time: "09h00 - 14h00", icon: "certificate" },
  { name: "Logbook", dates: "11, 18, 25 Jun 2027", time: "09h00 - 14h00", icon: "book" },
];

export const DELIVERABLES = [
  { deliverable: "Lesson Plans", standard: "Submitted for approval before delivery", due: "At least 3 working days before session", icon: "document" },
  { deliverable: "Training Delivery", standard: "Minimum facilitation hours as per curriculum", due: "As per training calendar", icon: "presenter" },
  { deliverable: "Formative Assessment Records", standard: "Complete and submitted", due: "Within 5 working days after assessment", icon: "clipboard" },
  { deliverable: "Learner Progress Reports", standard: "Updated in learner files and LMS", due: "Monthly", icon: "chart" },
  { deliverable: "Attendance Registers", standard: "Signed and submitted", due: "After each session", icon: "checklist" },
];

export const FACILITATION_DUTIES = [
  {
    heading: "Facilitation & Curriculum",
    icon: "presenter",
    items: [
      "Facilitate learning in alignment with the QCTO-approved curriculum and training schedule.",
      "Develop lesson plans, training aids, and learner activities relevant to IT – Systems Support.",
      "Adapt facilitation techniques to accommodate diverse learner needs while maintaining adherence to assessment criteria.",
      "Ensure that learning resources and materials remain current, accurate, and industry-relevant.",
    ],
  },
  {
    heading: "Learner Support",
    icon: "people",
    items: [
      "Provide academic guidance, mentorship, and constructive feedback to learners.",
      "Encourage active participation, problem-solving, and collaboration.",
      "Maintain professional and supportive communication throughout the learning process.",
    ],
  },
  {
    heading: "Assessment Support",
    icon: "clipboard",
    items: [
      "Conduct and facilitate formative assessments to monitor learner progress.",
      "Prepare learners for summative assessments in line with the Assessment Specifications Document (ASD).",
      "Support learners in gathering workplace evidence for competency demonstration.",
      "Assessment of POEs (Portfolios of Evidence).",
    ],
  },
];

export const ASSESSMENT_FRAMEWORK = [
  {
    heading: "Assessment Planning",
    icon: "calendar",
    items: [
      "Develop assessment plans that clearly outline methods, tools, and timelines.",
      "Communicate assessment requirements and processes to learners in advance.",
      "Coordinate assessment schedules to align with the training programme.",
    ],
  },
  {
    heading: "Conducting Assessments",
    icon: "clipboard",
    items: [
      "Assess both formative and summative assessments, ensuring compliance with assessment standards.",
      "Observe, evaluate, and document learner performance in practical and workplace settings.",
      "Provide timely, constructive feedback to learners to support development and readiness for competence.",
    ],
  },
  {
    heading: "Record-Keeping & Documentation",
    icon: "folder",
    items: [
      "Maintain detailed assessment records, including evidence of learner competence.",
      "Complete assessment reports and submit them within required timelines.",
      "Safeguard assessment documentation to ensure confidentiality and compliance.",
    ],
  },
  {
    heading: "Quality Assurance",
    icon: "shield",
    items: [
      "Ensure assessments are valid, reliable, fair, and aligned with the OCD and ASD for SAQA ID 48573.",
      "Ensure consistency and standardisation in assessment decisions.",
      "Address and rectify any assessment-related queries or appeals.",
      "Conduct assessments in line with QCTO, SETA, and institutional requirements.",
    ],
  },
];

export const TOTAL_UNITS = MODULES.reduce((n, m) => n + m.units.length, 0);
export const TOTAL_CREDITS = MODULES.reduce(
  (n, m) => n + m.units.reduce((c, u) => c + u.credits, 0),
  0
);

export function findModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export function findUnit(us: string) {
  for (const m of MODULES) {
    const u = m.units.find((x) => x.us === us);
    if (u) return { module: m, unit: u };
  }
  return undefined;
}
