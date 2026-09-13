import type { CourseModule } from "../../types";
import type { CourseData } from "./index";

const meta = {
  title: "National Certificate: Generic Management",
  saqaId: "59201",
  nqfLevel: 5,
  credits: 162,
  qualityAssurance: "QCTO / Services SETA",
  time: "09h00 - 14h00",
};

const modules: CourseModule[] = [
  {
    id: "m1",
    name: "Professional Team Development",
    icon: "people",
    activities: 5,
    units: [
      { us: "12433", title: "Use communication techniques effectively", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252020", title: "Create and manage an environment that promotes innovation", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252027", title: "Devise and apply strategies to establish and maintain workplace relationships", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252037", title: "Build teams to achieve goals and objectives", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252043", title: "Manage a diverse work force to add value", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m2",
    name: "Professional Conflict and Change Management",
    icon: "chat",
    activities: 4,
    units: [
      { us: "114226", title: "Interpret and manage conflicts within the workplace", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "117853", title: "Conduct negotiations to deal with conflict situations", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252021", title: "Formulate recommendations for a change process", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252031", title: "Apply the principles and concepts of emotional intelligence to the management of self and others", nqf: 5, credits: 4, dates: "TBC", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m3",
    name: "Professional Human Resources Management",
    icon: "person",
    activities: 4,
    units: [
      { us: "12140", title: "Recruit and select candidates to fill defined positions", nqf: 5, credits: 9, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252035", title: "Select and coach first line managers", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252029", title: "Lead people development and talent management", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252041", title: "Promote a learning culture in an organisation", nqf: 5, credits: 5, dates: "TBC", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m4",
    name: "Professional Management and Leadership Development",
    icon: "gradcap",
    activities: 4,
    units: [
      { us: "120300", title: "Analyse leadership and related theories in a work context", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252042", title: "Apply the principles of ethics to improve organisational culture", nqf: 5, credits: 5, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252026", title: "Apply a systems approach to decision making", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252044", title: "Apply the principles of knowledge management", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m5",
    name: "Financial Management for Professionals",
    icon: "chart",
    activities: 3,
    units: [
      { us: "252040", title: "Manage the finances of a unit", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252036", title: "Apply mathematical analysis to economic and financial information", nqf: 5, credits: 6, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252030", title: "Analyse compliance to legal requirements and recommend corrective actions", nqf: 5, credits: 4, dates: "TBC", time: "09h00 - 14h00" },
    ],
  },
  {
    id: "m6",
    name: "Professional Results-Based Management — Planning, Monitoring and Evaluation",
    icon: "target",
    activities: 4,
    units: [
      { us: "252032", title: "Develop, implement and evaluate an operational plan", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252022", title: "Develop, implement and evaluate a project plan", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252034", title: "Monitor and evaluate team members against performance standards", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
      { us: "252025", title: "Monitor, assess and manage risk", nqf: 5, credits: 8, dates: "TBC", time: "09h00 - 14h00" },
    ],
  },
];

const programmeAbout = {
  intro:
    "A person acquiring this qualification will be able to manage first line managers in an organisational entity — team leaders, supervisors, junior managers, section heads and foremen.",
  lead: "On completion, the graduate will be able to:",
  outcomes: [
    { icon: "target", text: "Initiate, develop, implement and evaluate operational strategies, projects and action plans" },
    { icon: "trend", text: "Monitor and measure performance and apply continuous or innovative improvement interventions" },
    { icon: "people", text: "Lead a team of first line managers, capitalising on talents and promoting synergy between individuals and teams" },
    { icon: "chat", text: "Build relationships vertically and horizontally — with superiors and stakeholders across the value chain" },
    { icon: "shield", text: "Apply the principles of risk, financial and knowledge management and business ethics within regulatory frameworks" },
    { icon: "gradcap", text: "Enhance the development of teams and team members through skills facilitation, coaching and career direction" },
  ],
  saqaLink: {
    label: "View the registered qualification on SAQA (ID 59201)",
    url: "https://allqs.saqa.org.za/showQualification.php?id=59201",
  },
};

const programmePurpose = {
  intro:
    "The purpose of this qualification is to develop the management competencies required by learners in any occupation, particularly those who manage first line managers — building a talent pool of experienced and effective middle managers that represents the demographics of South African society.",
  pathway: [
    {
      icon: "layers",
      title: "NQF Level 4",
      desc: "FETC: Generic Management (or equivalent) — Communication and Mathematical Literacy at NQF Level 4 assumed to be in place",
      current: false,
    },
    {
      icon: "briefcase",
      title: "NQF Level 5 — you are here",
      desc: "Generic Management, 162 credits, earned in the workplace through the learnership",
      current: true,
    },
    {
      icon: "gradcap",
      title: "Beyond",
      desc: "National Diploma: Management (NQF 6) · degrees in management, business administration and organisational leadership",
      current: false,
    },
  ],
  pathwayNote:
    "The qualification can be achieved wholly or in part through recognition of prior learning — evidence may include previous qualifications, products, reports, testimonials, work records and portfolios, judged against the exit level outcomes.",
  designedTo: [
    { icon: "people", text: "Develop competence in managing first line managers — team leaders, supervisors and section heads" },
    { icon: "briefcase", text: "Strengthen management capability across private, public and non-profit entities" },
    { icon: "trend", text: "Build on the FETC: Generic Management towards NQF Level 6 management studies" },
    { icon: "dashboard", text: "Allow contextualisation for specific sectors and industries through elective specialisations" },
  ],
  competencies: [
    { icon: "person", text: "Analyse leadership and related theories and apply them in the work context" },
    { icon: "target", text: "Initiate, develop and evaluate operational strategies, projects and action plans" },
    { icon: "trend", text: "Monitor and measure performance and apply continuous improvement" },
    { icon: "people", text: "Build teams and manage a diverse workforce to add value" },
    { icon: "chat", text: "Devise strategies to establish and maintain workplace relationships" },
    { icon: "shield", text: "Monitor, assess and manage risk" },
    { icon: "database", text: "Apply the principles of knowledge management" },
    { icon: "award", text: "Apply the principles of ethics to improve organisational culture" },
    { icon: "chart", text: "Apply mathematical analysis to economic and financial information" },
    { icon: "briefcase", text: "Manage the finances of a unit" },
    { icon: "layers", text: "Apply a systems approach to decision making" },
    { icon: "gradcap", text: "Select, coach and develop first line managers" },
  ],
  nb: "The scope of generic management covers five domains: leadership, managing the environment, managing relations, managing knowledge and the practice of management. The elective component consists of specialisations — this programme follows the General Management specialisation, with elective unit standards totalling a minimum of 35 credits.",
  rationaleLead:
    "The National Certificate: Generic Management, NQF Level 5 forms part of a learning pathway of management qualifications across various sectors and industries.",
  rationale:
    "It is specifically designed to develop management competencies required by learners in any occupation, particularly those who manage first line managers. The qualification builds on the FETC: Generic Management and further develops the key concepts, principles and practices of management that enable learners to lead, manage, organise and control first line managers and team leaders — in companies, business units, public institutions, small businesses and non-profit organisations.",
};

const whatYoullLearn = {
  areas: [
    { icon: "person", text: "Leadership", desc: "Leadership and related theories applied in a work context; leading a team of first line managers." },
    { icon: "design", text: "Operational & Project Planning", desc: "Develop, implement and evaluate operational and project plans; recommend and manage change." },
    { icon: "chart", text: "Financial Management", desc: "Manage the finances of a unit and apply mathematical analysis to economic and financial information." },
    { icon: "shield", text: "Risk, Ethics & Compliance", desc: "Monitor, assess and manage risk; apply ethics to improve organisational culture; analyse legal compliance." },
    { icon: "people", text: "Team Development", desc: "Build teams, monitor performance against standards, select and coach first line managers." },
    { icon: "chat", text: "Workplace Relationships", desc: "Communication techniques, negotiation, conflict management and managing a diverse workforce." },
    { icon: "database", text: "Knowledge & Decision Making", desc: "Apply knowledge management principles and a systems approach to decision making." },
  ],
  facts: [
    { icon: "award", label: "Qualification level", value: "NQF Level 5", detail: "162 credits · SAQA ID 59201" },
    { icon: "document", label: "Minimum admission requirements", value: "NQF Level 4", detail: "Communication and Mathematical Literacy at NQF Level 4" },
    { icon: "briefcase", label: "Career opportunities", value: "", detail: "", pills: ["Junior/Middle Manager", "Section Head", "Operations Supervisor", "Team Manager"] },
    { icon: "clock", label: "Duration", value: "1 Year", detail: "Full-time · dates TBC" },
  ] as { icon: string; label: string; value: string; detail: string; pills?: string[] }[],
};

const resources = [
  {
    title: "SAQA — Qualification & Unit Standard search",
    url: "https://allqs.saqa.org.za/",
    desc: "Look up the registered unit standards (e.g. US 252032, 252040) and their outcomes.",
  },
  {
    title: "QCTO — Quality Council for Trades and Occupations",
    url: "https://www.qcto.org.za/",
    desc: "The quality council overseeing occupational qualifications and learnerships.",
  },
  {
    title: "Services SETA",
    url: "https://www.servicesseta.org.za/",
    desc: "The SETA responsible for quality assurance of the Generic Management learnership.",
  },
  {
    title: "Basic Conditions of Employment Act",
    url: "https://www.gov.za/documents/basic-conditions-employment-act",
    desc: "Core South African labour legislation every manager must apply (leave, hours, terminations).",
  },
  {
    title: "Labour Relations Act",
    url: "https://www.gov.za/documents/labour-relations-act",
    desc: "Discipline, dispute resolution and workplace relations — relevant to conflict and negotiation units.",
  },
];

const poeSections: { heading: string; icon: string; multi?: boolean; items: { id: string; label: string }[] }[] = [
  {
    heading: "1. Identity & contracting",
    icon: "person",
    items: [
      { id: "gm-id-copy", label: "Certified copy of ID" },
      { id: "gm-agreement", label: "Signed learnership agreement (learner, employer, provider)" },
      { id: "gm-induction", label: "Induction record and programme orientation sign-off" },
      { id: "gm-cv", label: "Curriculum vitae" },
    ],
  },
  {
    heading: "2. Formative assignments (with signed declarations & rubrics)",
    icon: "exercise",
    multi: true,
    items: [
      { id: "gm-fa01", label: "GM-M1-FA01 — Professional Team Development (submitted & assessed)" },
      { id: "gm-fa02", label: "GM-M2-FA02 — Professional Conflict and Change Management (submitted & assessed)" },
      { id: "gm-fa03", label: "GM-M3-FA03 — Professional Human Resources Management (submitted & assessed)" },
      { id: "gm-fa04", label: "GM-M4-FA04 — Professional Management and Leadership Development (submitted & assessed)" },
      { id: "gm-fa05", label: "GM-M5-FA05 — Financial Management for Professionals (submitted & assessed)" },
      { id: "gm-fa06", label: "GM-M6-FA06 — Results-Based Management: Planning, Monitoring and Evaluation (submitted & assessed)" },
    ],
  },
  {
    heading: "3. Knowledge assessments",
    icon: "clipboard",
    items: [
      { id: "gm-ka1", label: "Module 1 knowledge test script filed" },
      { id: "gm-ka2", label: "Module 2 knowledge test script filed" },
      { id: "gm-ka3", label: "Module 3 knowledge test script filed" },
      { id: "gm-ka4", label: "Module 4 knowledge test script filed" },
      { id: "gm-ka5", label: "Module 5 knowledge test script filed" },
      { id: "gm-ka6", label: "Module 6 knowledge test script filed" },
    ],
  },
  {
    heading: "4. Practical observation checklists (assessor-witnessed)",
    icon: "monitor",
    multi: true,
    items: [
      { id: "gm-ob-meeting", label: "Team meeting / communication session observed (US 12433)" },
      { id: "gm-ob-coaching", label: "Coaching session with a first line manager observed (US 252035)" },
      { id: "gm-ob-review", label: "Performance review against standards observed (US 252034)" },
      { id: "gm-ob-budget", label: "Budget presentation / financial review observed (US 252040)" },
      { id: "gm-ob-negotiation", label: "Negotiation or conflict-resolution role-play observed (US 117853)" },
      { id: "gm-ob-recruit", label: "Recruitment and selection process observed (US 12140)" },
    ],
  },
  {
    heading: "5. Workplace evidence",
    icon: "briefcase",
    multi: true,
    items: [
      { id: "gm-we-opplan", label: "Operational plan developed and evaluated (US 252032)" },
      { id: "gm-we-project", label: "Project plan with implementation records (US 252022)" },
      { id: "gm-we-finance", label: "Unit budget and financial monitoring records (US 252040)" },
      { id: "gm-we-risk", label: "Risk register and mitigation actions (US 252025)" },
      { id: "gm-we-team", label: "Team development and talent management records (US 252029)" },
    ],
  },
  {
    heading: "6. Testimonies & logbook",
    icon: "book",
    multi: true,
    items: [
      { id: "gm-tw-mentor", label: "Witness testimony — workplace mentor" },
      { id: "gm-tw-manager", label: "Witness testimony — line manager/supervisor" },
      { id: "gm-lb-weekly", label: "Logbook complete with weekly entries" },
      { id: "gm-lb-mentor", label: "Logbook signed by mentor per module" },
      { id: "gm-lb-final", label: "Final logbook sign-off (dates TBC)" },
    ],
  },
  {
    heading: "7. Summative & remediation",
    icon: "certificate",
    multi: true,
    items: [
      { id: "gm-sr-remedial", label: "Remediation records filed (if applicable)" },
      { id: "gm-sr-fisa", label: "FISA completed (dates TBC)" },
      { id: "gm-sr-moderation", label: "POE submitted for internal moderation" },
      { id: "gm-sr-verified", label: "POE verified by Services SETA" },
    ],
  },
];

const moduleFlow = {
  steps: [
    { name: "Study", desc: "Work through the unit standard study notes" },
    { name: "Practise", desc: "Complete the activities & practicals" },
    { name: "Logbook", desc: "Record your workplace evidence" },
    { name: "Quiz", desc: "Pass the module quiz (80%+)" },
    { name: "Assignment", desc: "Submit the official assignment for your POE" },
  ],
};

const programmeMilestones = [
  { name: "Remedials", dates: "TBC", time: "09h00 - 14h00", icon: "wrench" },
  { name: "FISA (Final Integrated Summative Assessment)", dates: "TBC", time: "09h00 - 14h00", icon: "certificate" },
  { name: "Logbook", dates: "TBC", time: "09h00 - 14h00", icon: "book" },
];

const deliverables = [
  { deliverable: "Lesson Plans", standard: "Submitted for approval before delivery", due: "At least 3 working days before session", icon: "document" },
  { deliverable: "Training Delivery", standard: "Minimum facilitation hours as per curriculum", due: "As per training calendar", icon: "presenter" },
  { deliverable: "Formative Assessment Records", standard: "Complete and submitted", due: "Within 5 working days after assessment", icon: "clipboard" },
  { deliverable: "Learner Progress Reports", standard: "Updated in learner files and LMS", due: "Monthly", icon: "chart" },
  { deliverable: "Attendance Registers", standard: "Signed and submitted", due: "After each session", icon: "checklist" },
];

const facilitationDuties = [
  {
    heading: "Facilitation & Curriculum",
    icon: "presenter",
    items: [
      "Facilitate learning in alignment with the QCTO-approved curriculum and training schedule.",
      "Develop lesson plans, training aids, and learner activities relevant to Generic Management.",
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

const assessmentFramework = [
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
      "Ensure assessments are valid, reliable, fair, and aligned with the OCD and ASD for SAQA ID 59201.",
      "Ensure consistency and standardisation in assessment decisions.",
      "Address and rectify any assessment-related queries or appeals.",
      "Conduct assessments in line with QCTO, SETA, and institutional requirements.",
    ],
  },
];

export const GENERIC_MANAGEMENT: CourseData = {
  id: "genman",
  label: "Generic Management (59201)",
  blurb:
    "A QCTO/SETA-aligned qualification developing middle managers who lead first line managers — operational planning, finance, risk, team leadership and workplace relationships.",
  meta,
  modules,
  programmeAbout,
  programmePurpose,
  whatYoullLearn,
  resources,
  poeSections,
  moduleFlow,
  programmeMilestones,
  deliverables,
  facilitationDuties,
  assessmentFramework,
};
