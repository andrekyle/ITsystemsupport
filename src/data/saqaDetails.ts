import type { SaqaDetails } from "../types";

/**
 * Editorial summaries of the official SAQA unit-standard HTML records retrieved
 * on 2026-10-11. Every returned ID and title was checked against the record's
 * identity table. Outcome rows retain the official numbering and identify the
 * corresponding assessment-criterion numbers; grouped prose is not a substitute
 * for the full assessment specification linked in source.
 *
 * Registration fields are transcribed, not inferred from course metadata.
 * The official records distinguish pre-2009 levels from current NQF levels.
 */
type Outcome = [outcome: string, criteriaSummary: string, criteriaCount: number];
type RecordSummary = {
  title: string;
  credits: number;
  purpose: string;
  range: string;
  knowledge: string;
  outcomes: Outcome[];
  originator?: keyof typeof ORIGINATORS;
  level?: 4 | 5 | 6;
  fundamental?: boolean;
  moderation?: string;
};

const ORIGINATORS = {
  it: ["SGB Information Systems and Technology", "Field 10 - Physical, Mathematical, Computer and Life Sciences", "Information Technology and Computer Sciences"],
  management: ["SGB Generic Management", "Field 03 - Business, Commerce and Management Studies", "Generic Management"],
  retail: ["SGB Retail and Wholesale", "Field 11 - Services", "Wholesale and Retail"],
  project: ["SGB Project Management", "Field 03 - Business, Commerce and Management Studies", "Project Management"],
  hr: ["SGB Human Resource Management and Practices", "Field 03 - Business, Commerce and Management Studies", "Human Resources"],
  manufacturing: ["SGB Manufacturing and Assembly Processes", "Field 06 - Manufacturing, Engineering and Technology", "Manufacturing and Assembly"],
  democracy: ["SGB Democracy, Human Rights, Peace and Elections", "Field 07 - Human and Social Studies", "Public Policy, Politics and Democratic Citizenship"],
  administration: ["SGB Administration", "Field 03 - Business, Commerce and Management Studies", "Public Administration"],
} as const;

const NOT_SPECIFIED = "Not specified in the official record.";
const NO_RANGE = "The overall unit-standard range is recorded as N/A; the outcome and criterion scopes below still apply.";
const IT_KNOWLEDGE = "Apply organisational quality, documentation, security, communication, health-and-safety and conduct standards. Comply with South African copyright, privacy, consumer and safety law, organisational policies, professional ethics and applicable regulation.";
const IT_DEVELOPMENT = `${IT_KNOWLEDGE} Understand the development tools relevant to the work, such as CASE tools, syntax-checking editors and source-version control.`;
const IT_TIME_COST = "Follow organisational quality, documentation, security, communication, safety and conduct procedures; complete work within normal professional time and cost limits; comply with South African copyright, privacy, safety and consumer law.";
const IT_MODERATION = "Providers require accreditation from the relevant ETQA. That ETQA oversees assessment moderation under the qualification's moderation guidelines and agreed ETQA procedures.";
const MANAGEMENT_MODERATION = "Assessors must be registered with the relevant ETQA or an ETQA with a memorandum of understanding with it. Providers need corresponding accreditation. The relevant ETQA oversees moderation under its agreed guidelines and procedures.";
const MANAGEMENT_RANGE = "Apply the learning in the learner's own area of responsibility: a division, department or business unit managed by the learner. Entities may be businesses, public institutions, small enterprises, non-profit or non-governmental organisations.";

const RECORDS: Record<string, RecordSummary> = {
  "8252": {
    title: "Writing business reports in Retail/Wholesale practices", credits: 6, originator: "retail",
    purpose: "Develop the business-report writing competence underpinning the core and elective learning of the NQF 5 Retail/Wholesale management diploma.",
    range: "Business reports include board reports, proposals, budgets, flash reports and strategic plans. Coverage includes report structure, style, layout, format and business terminology.",
    knowledge: "Know organisational information needs, report purposes and recipients, information sources, confidentiality procedures, required report formats, reporting deadlines and appropriate writing techniques.",
    moderation: "The Retail/Wholesale SETA, acting as ETQA, accredits providers against this standard. A separate moderation procedure is not specified in this field.",
    outcomes: [
      ["Choose and apply appropriate business-reporting methods", "Match report purpose and content to business needs; use suitable information sources and confidentiality procedures; compile correctly formatted reports by their deadlines; consult relevant parties, verify information and distribute additional commentary where needed. The official outcome and criterion notes carry these requirements.", 1],
    ],
  },
  "10135": {
    title: "Work as a project team member", credits: 8, originator: "project", level: 4, fundamental: true,
    purpose: "Enable a non-leading project-team member to contribute independently, collaborate, build stakeholder relationships and respect colleagues' differences.",
    range: "Applies to a contributing member, not the leader, on projects of any size. Team dynamics include goals, roles, priorities, structure, communication, cohesion, skills, trust and relationships; communication includes written, oral, non-verbal and signal methods.",
    knowledge: "Understand team and group working methods, communication and relationship-building, confidential team information, organisational plans and emerging threats or opportunities, cultural norms, tolerance, empathy and self-control.",
    moderation: "The Services SETA ETQA or GENFETQA accredits providers and assessors against the standard. Separate moderation arrangements are not specified in this field.",
    outcomes: [
      ["Understand team-member expectations", "Explain the criteria for team membership, supportive behaviours and team dynamics.", 3],
      ["Work independently and collaboratively", "Support colleagues' objectives, consult them, respect each member's authority and collaborate in ways that reflect everyone's needs.", 4],
      ["Build team and stakeholder relationships", "Explain why relationships matter; identify stakeholders and their needs; encourage frank communication and fulfil commitments.", 4],
      ["Strengthen team cohesion, image and spirit", "Identify members' needs and goals, explain team-building techniques, act to reinforce cohesion, earn colleagues' trust and support, and give constructive feedback.", 5],
      ["Respect individual differences", "Acknowledge personal, ethical, religious and cultural differences; explain and demonstrate respect; promptly discuss behaviour that causes concern with those involved.", 4],
    ],
  },
  "12140": {
    title: "Recruit and select candidates to fill defined positions", credits: 9, originator: "hr",
    purpose: "Equip recruitment and selection practitioners to plan recruitment, attract applicants and choose people for clearly defined organisational positions.",
    range: "No overall range is specified. Criteria cover position descriptions/profiles, validated selection procedures, media/networking/search recruitment and candidate evidence from at least three listed sources.",
    knowledge: "Relevant legislation and knowledge of the position and industry sector are required; other essential knowledge is evidenced explicitly or implicitly through the assessment criteria.",
    moderation: `${MANAGEMENT_MODERATION} Candidates may approach an appropriately accredited assessment agency, assessor or provider for assessment.`,
    outcomes: [
      ["Plan recruitment and selection", "Obtain complete position information; choose a validated, legally compliant procedure; identify methods/resources and manage budgets; develop unbiased criteria and controls; plan timing, contingencies, verification, selection and feedback.", 6],
      ["Recruit applicants", "Implement recruitment and response controls; screen against critical job requirements; revise ineffective recruitment; prepare candidate lists; maintain a compliant applicant database and activate contingencies for unplanned events.", 7],
      ["Select staff", "Verify backgrounds and qualifications; assess using at least three listed evidence sources; interview appropriately; justify shortlists and final choices against job, organisational and legal requirements; give tactful timely feedback to both successful and unsuccessful applicants; authorise and forward accurate records; handle contingencies.", 8],
    ],
  },
  "12433": {
    title: "Use communication techniques effectively", credits: 8, originator: "manufacturing",
    purpose: "Develop advanced workplace communication for supervisors and senior technical staff in manufacturing and assembly.",
    range: "Use a range of advanced written and spoken communication techniques in a supervisory or senior technical organisational role.",
    knowledge: "Understand communication theory, report and presentation features, audience needs, discussion and meeting procedures, data collection, report writing, presentation preparation/delivery and relevant company communication policies.",
    moderation: "MERSETA ETQA policies govern assessment. Assessors must at least be accredited and technically qualified. Workplace or simulated evidence and RPL are permitted. Learners may choose their assessment language but must also demonstrate reporting in the workplace's usual language where required. Assessment may stand alone or be integrated into a qualification.",
    outcomes: [
      ["Explain workplace communication methods and theory", "Demonstrate oral/written techniques and theory; lead discussions and chair meetings correctly; provide reports and presentations for inspection; deliver effectively. The same four criteria apply to all four outcomes: clear experience-based explanations, meaningful technical content, systematic data analysis, audience-appropriate structure and logical presentation, supported by why/what-if answers.", 4],
      ["Lead discussions and chair meetings", "Apply standard meeting procedures and communication theory; produce reviewable reports/presentations and deliver them effectively. Evidence must be clear, logically organised, technically meaningful and audience-appropriate, with systematically gathered information and explanations of relevant why/what-if situations.", 4],
      ["Produce workplace reports using varied data-gathering methods", "Demonstrate communication theory, effective meeting leadership and a portfolio of reports/presentations. Gather and analyse information systematically, communicate technical facts clearly, suit the audience and justify report, meeting and presentation choices.", 4],
      ["Deliver presentations", "Demonstrate communication techniques, effective discussion/meeting leadership and inspectable written/presentation evidence. Deliver clear, logical, audience-focused presentations grounded in analysed information, and answer why/what-if questions about communication practice.", 4],
    ],
  },
  "15224": {
    title: "Empower team members through recognising strengths, encouraging participation in decision making and delegating tasks", credits: 4, originator: "management", fundamental: true,
    purpose: "Enable managers across economic sectors to empower staff through performance recognition, participative decisions, delegation and review.",
    range: "Recognition of achievement may include public acknowledgement or an incentive.",
    knowledge: "Understand motivation theories, brainstorming, negotiation, delegation and follow-up, and feedback techniques.",
    moderation: "Assessment must be contextual and practical, with formative and summative components. Assessors, moderators and providers require Services ETQA registration/accreditation or the stated sector-ETQA arrangements under a memorandum of understanding. Apply the relevant ETQA's moderation requirements.",
    outcomes: [
      ["Recognise team members' performance", "Identify roles and expected performance; tell staff what works, what needs improvement and future expectations; give prompt, honest, simple, specific and constructive feedback against communicated standards; treat colleagues as valued and trusted.", 6],
      ["Include staff in decisions", "Explain the situation and decisions required; encourage innovative solutions; ask staff to propose, evaluate and select alternatives; use debate to reach common ground and the best solution.", 4],
      ["Delegate tasks", "Break work into suitable tasks and allocate them appropriately; explain expectations, method, support and authority; agree reporting schedules and information flow; monitor completion as a development opportunity and recognise success.", 7],
      ["Review decisions and delegated work", "Review decisions with groups against objectives, confirm sound decisions and amend or withdraw unsound ones; review tasks with delegates and agree alternative plans for unsuccessful work.", 4],
    ],
  },
  "114046": {
    title: "Demonstrate an understanding of issues affecting the management of a local area computer network (LAN)", credits: 4,
    purpose: "Provide conceptual LAN-management knowledge for people working in or entering IT: access, performance, support and malware issues.",
    range: `${NO_RANGE} Access includes user/operator/administrator roles and identity, folder, file, time and location controls; malware coverage includes at least two listed types.`,
    knowledge: IT_TIME_COST,
    outcomes: [
      ["Explain LAN access management", "Identify manageable resources, distinguish user/operator/administrator access, explain identity/folder/file/time/location controls and the purpose of access audit trails.", 4],
      ["Explain LAN performance", "Explain response-time factors including device speed, bandwidth, queues, processing and transmission quality; describe diagnostic data collection and problem analysis; compare hardware, protocol and media improvements.", 4],
      ["Explain LAN support", "Distinguish supplier, third-party and local support sources, and explain user expectations of support options, guarantees and software tools.", 2],
      ["Explain LAN malware", "Explain symptoms and transmission, and select suitable prevention, detection and removal methods; cover at least two of the listed malware types.", 2],
    ],
  },
  "114047": {
    title: "Install and configure a multi-user networked operating system", credits: 9,
    purpose: "Develop proficient IT practice in planning, installing, configuring, testing and documenting a multi-user network operating system.",
    range: `${NO_RANGE} Outcome scopes include feasibility, scheduling/resources, manufacturer and installation specifications, backup/rollback, testing and user acceptance.`,
    knowledge: IT_DEVELOPMENT,
    outcomes: [
      ["Plan system-software installation", "Check feasibility; estimate milestones, time and resources; minimise user disruption; assess risk probability/impact, mitigations and contingencies; define a review against user needs and SLAs.", 6],
      ["Install the operating system", "Follow manufacturer guidance; meet manufacturer and installation specifications; restore the pre-installation environment if installation fails.", 4],
      ["Configure the operating system", "Customise to the installation specification and verify performance against manufacturer and company requirements.", 2],
      ["Test installation and configuration", "Follow manufacturer test guidance and verify specified functions, environment compatibility and communication with hardware and applications.", 4],
      ["Document the installation", "Record configuration/customisation and test results; include user acceptance evidence and basic operating instructions.", 4],
    ],
  },
  "114048": {
    title: "Create database access for a computer application using structured query language", credits: 9,
    purpose: "Develop advanced competence in reviewing SQL database-access requirements and designing, coding, testing and documenting application access.",
    range: `${NO_RANGE} Requirements cover at least four listed database concepts; design covers at least three listed indexing approaches; coding covers at least three listed SQL type/routine features. Testing covers logic, access and debugging; documentation must be clear and usable.`,
    knowledge: `${IT_DEVELOPMENT} Understand international software-development capability models, including the cited ISO SPICE and CMM examples.`,
    outcomes: [
      ["Review SQL database-access requirements", "Assess feasibility, objectives and critical performance factors; estimate effort and cost; adopt a review that verifies the required access outcomes.", 4],
      ["Design SQL database access", "Meet user needs and data-analysis results; use third-normal-form tables; identify access methods and table/key relationships; keep primary/foreign key types consistent. Include the specified indexing and table-definition scope.", 6],
      ["Write SQL access code", "Implement the design using clear constructs/instructions and language optimisations; join only necessary tables; preserve integrity under concurrent access; minimise global sharing and use cohesive, weakly coupled modules.", 8],
      ["Test SQL access programs", "Exercise all logic paths, fix detected errors and confirm access works in the required environment and meets design and performance requirements.", 5],
      ["Document SQL access programs", "Provide documentation that improves code understanding and complements its self-documenting structure.", 2],
    ],
  },
  "114049": {
    title: "Demonstrate an understanding of Computer Database Management Systems", credits: 7,
    purpose: "Provide foundational understanding of database-management problems, commercial DBMS features, DBMS models and practical end-user tools.",
    range: `${NO_RANGE} Cover access, sharing, security, integrity, privacy, reliability, risk and performance; commercial access/recovery/audit/distribution/backup/transaction features; hierarchical, relational, network and object DBMS models.`,
    knowledge: IT_KNOWLEDGE,
    outcomes: [
      ["Explain data-management issues and DBMS responses", "Identify each issue with examples and explain how a DBMS addresses it.", 2],
      ["Explain commercial DBMS features", "Describe each feature's purpose and contribution to resolving data-management issues.", 2],
      ["Compare DBMS types", "Describe the characteristics and example uses of hierarchical, relational, network and object models.", 2],
      ["Review DBMS end-user tools", "Evaluate features, limitations and database interaction from actual use of the tools.", 3],
    ],
  },
  "114050": {
    title: "Explain the principles of business and the role of information technology", credits: 4,
    purpose: "Provide conceptual knowledge of business, information systems, business applications and organisational information needs for IT learners and workers.",
    range: `${NO_RANGE} Criterion scopes include business forms/objectives, input-process-output, any three listed information-system types, office applications, information security and any two business subsystems.`,
    knowledge: IT_DEVELOPMENT,
    outcomes: [
      ["Describe basic business concepts", "Distinguish organisational forms such as sole traders, partnerships and companies; explain commercial/non-commercial objectives and the business operating environment.", 3],
      ["Describe systems theory for information systems", "Define a system as ordered interrelated parts; identify input, process and output; distinguish any three listed information-system types.", 3],
      ["Explain business uses of IT", "Explain application purposes and functions and illustrate their effects on business systems, including word processing, spreadsheets, databases, graphics and integrated suites.", 3],
      ["Relate business to information needs", "Distinguish raw data from processed information; explain decision-making uses and security/integrity threats; describe information needs for any two listed business subsystems.", 4],
    ],
  },
  "114051": {
    title: "Conduct a technical practitioners meeting", credits: 4,
    purpose: "Develop proficient practice in understanding, preparing, chairing and following up technical practitioners' meetings.",
    range: "Assessment follows the learner's chosen technical contractual, project or review meeting. Technical reviews require appropriately knowledgeable participants, including a note-taker able to understand the technical discussion.",
    knowledge: IT_KNOWLEDGE,
    outcomes: [
      ["Explain technical-meeting types and methods", "Explain a selected meeting type, democratic/autocratic/facilitative leadership, decision methods, motions/amendments/voting conventions and the note-taker's technical knowledge requirement.", 5],
      ["Prepare a technical meeting", "Arrange venue, facilities, technology and information; document clear outcomes; invite relevant participants promptly; complete and circulate the agenda and supporting papers.", 4],
      ["Chair a technical meeting", "Agree conduct rules, apply meeting conventions, follow the agenda, encourage participation and minimise conflict; prioritise topics/time; record clear decisions with action deadlines within the meeting's mandate.", 6],
      ["Follow up the meeting", "Produce accurate policy-compliant minutes; circulate agreed discussion records promptly in the required format; summarise discussions and actions.", 3],
    ],
  },
  "114052": {
    title: "Demonstrate appropriate customer care in the context of IT support, according to a Service Level Agreement", credits: 8,
    purpose: "Develop proficient customer communication, request handling and working relationships in IT support governed by a service-level agreement.",
    range: "Use a supplied SLA during assessment; its timeframes, documentation levels and specified tasks govern the work. Customers include end-users and line managers.",
    knowledge: IT_KNOWLEDGE,
    outcomes: [
      ["Communicate with IT customers", "Communicate politely, clearly and sensitively; share complete accurate information promptly; report progress, timescale deviations and requests that cannot be resolved.", 5],
      ["Assess and respond to support requests", "Gather sufficient valid problem/system/context information; analyse support records against the SLA; report findings; initiate agreed remedial action promptly; alert colleagues to unresolved problems; meet timescales and maintain complete current records.", 7],
      ["Maintain customer relationships", "Provide accurate timely progress information, handle conflict calmly and sensitively, and follow up satisfaction with earlier resolutions, taking further action when needed.", 4],
    ],
  },
  "114053": {
    title: "Monitor and maintain a multi-user networked operating system", credits: 6,
    purpose: "Develop proficient monitoring, problem resolution and maintenance of a multi-user network operating system.",
    range: "No overall range is specified. Outcome scopes cover performance specifications/comparisons/limits/recommendations; symptoms, diagnostics and documentation; and maintenance security, integrity, backups and performance.",
    knowledge: IT_DEVELOPMENT,
    outcomes: [
      ["Monitor operating-system performance", "Explain measures and justify a monitoring strategy; implement it; compare measured results with user perceptions; identify limiting factors and justify performance improvements.", 5],
      ["Resolve operating-system problems", "Restore symptom-free service using industry diagnostic procedures and tools; justify solutions with diagnostic evidence and document causes and remedies.", 5],
      ["Maintain the operating system", "Configure to organisational needs; retain software integrity/security through changes; monitor and tune to maximise operation/performance within manufacturer and organisational specifications.", 3],
    ],
  },
  "114054": {
    title: "Administer a local area computer network", credits: 7,
    purpose: "Develop proficient LAN administration in user access, directory services, performance monitoring, troubleshooting and backup.",
    range: `${NO_RANGE} Directory infrastructure includes DNS; troubleshooting includes user, fileserver and performance problems.`,
    knowledge: IT_TIME_COST,
    outcomes: [
      ["Set up LAN user access", "Create/delete accounts to manufacturer and user requirements; complete access documentation and validate accounts against organisational requirements.", 3],
      ["Set up directory services", "Create/delete DNS directory-to-IP mappings as specified; document and validate mappings against organisational requirements.", 3],
      ["Monitor LAN performance", "Collect data using industry-recommended procedures and analyse it to evaluate network performance.", 2],
      ["Resolve LAN problems", "Resolve user, fileserver and performance faults using industry-recommended procedures and complete the associated documentation.", 2],
      ["Implement LAN backup", "Develop an industry- and organisation-aligned backup plan; implement the system and audit backup procedures.", 3],
    ],
  },
};

Object.assign(RECORDS, {
  "114055": {
    title: "Demonstrate an awareness of ethics and professionalism for the computer industry in South Africa", credits: 3,
    purpose: "Provide conceptual understanding of South African IT professionalism, professional codes and ethical conduct.",
    range: `${NO_RANGE} Identify and describe at least two of the listed South African professional bodies; address equality of opportunity and software piracy.`,
    knowledge: IT_KNOWLEDGE,
    outcomes: [
      ["Explain IT professionalism", "Distinguish acceptable and unacceptable practices; identify at least two listed professional bodies and briefly describe each.", 3],
      ["Explain professional codes of practice", "Identify South African IT codes of practice and explain the identified codes.", 2],
      ["Explain IT ethics", "Demonstrate understanding of equal opportunity, opposition to software piracy and ways piracy is addressed in South Africa.", 3],
    ],
  },
  "114056": {
    title: "Describe enterprise systems management and its role in IT systems support", credits: 3,
    purpose: "Provide foundational knowledge of enterprise systems-management components, their support role and the effect of incorrect installations.",
    range: `${NO_RANGE} Describe at least two components from configuration, network, operating-system, security and application management. Include fault/alert interfaces, thresholds and heartbeat rates.`,
    knowledge: IT_KNOWLEDGE,
    outcomes: [
      ["Describe enterprise systems-management components", "Identify at least two typical components and explain each one's role.", 2],
      ["Explain systems management in support", "Explain present network/OS fault-management purposes and future application/interface uses; show how incorrect hardware/network or alert-generator installation affects management; describe client parameters such as thresholds and heartbeat rate.", 4],
    ],
  },
  "114058": {
    title: "Demonstrate an understanding of the concepts of Multi-User computer Operating systems", credits: 7,
    purpose: "Build foundational understanding of multi-user operating-system requirements, components, implementation strategies and performance.",
    range: `${NO_RANGE} Evaluate two different operating systems, covering process, memory, processor and storage management, functions and performance.`,
    knowledge: IT_DEVELOPMENT,
    outcomes: [
      ["Describe multi-user operating systems", "Identify functional requirements; explain component purposes and interrelationships, including relationships to the underlying hardware.", 3],
      ["Analyse multi-user operating systems", "Identify implemented functions, explain the implementation strategy and relate resulting performance characteristics to that strategy.", 3],
    ],
  },
  "114059": {
    title: "Demonstrate an understanding of estimating a unit of work and the implications of late delivery", credits: 5,
    purpose: "Build conceptual understanding of cost/benefit analysis, work estimates and the effects of late delivery on related work.",
    range: `${NO_RANGE} Cost estimates cover at least one of structured or object-oriented programming; delay effects include time and cost.`,
    knowledge: "Apply organisational quality, documentation, security, communication, safety and conduct standards, organisational requirements, professional ethics and relevant legislation/regulation.",
    outcomes: [
      ["Interpret cost/benefit documentation", "Identify cost and benefit components and explain the purpose of each.", 2],
      ["Estimate work time", "Break the work into logical estimating components and include implementation/testing of interfaces to other components where applicable.", 2],
      ["Estimate work cost", "Break work into logical components, include applicable interface implementation/testing and recognise that additional people or resources can raise costs.", 3],
      ["Explain late-delivery effects", "Recognise that the work may form part of a larger deliverable and explain time/cost effects on related components.", 2],
    ],
  },
  "114060": {
    title: "Demonstrate an understanding of local area computer networks, by installing a networked workstation", credits: 5,
    purpose: "Develop foundational LAN knowledge and demonstrate it through a standards-compliant network-workstation installation.",
    range: `${NO_RANGE} Cover at least three listed LAN components, star/bus/ring arrangements, Ethernet/Token Ring/TCP/IP and at least two listed media; installation includes specifications, documentation and safety.`,
    knowledge: IT_KNOWLEDGE,
    outcomes: [
      ["Explain LANs", "Explain LAN purpose and at least three components; compare star/bus/ring configurations, the listed protocols and at least two transmission media.", 5],
      ["Install a LAN workstation", "Meet manufacturer, user and industry requirements; test and resolve installation problems; complete organisational documentation and leave the workplace clean and tidy.", 4],
    ],
  },
  "114061": {
    title: "Demonstrate an understanding of Wide Area Computer Networks (WAN`s), comparing them with Local Area Networks (LAN`s)", credits: 5,
    purpose: "Provide foundational WAN knowledge, evaluation of an implemented WAN and understanding of network administration.",
    range: `${NO_RANGE} Evaluate a multi-site WAN connected by circuit/packet switching. Cover at least three listed components and at least two listed media, topology/protocol comparisons and administration.`,
    knowledge: IT_DEVELOPMENT,
    outcomes: [
      ["Explain WANs", "Explain WAN purpose and at least three listed components; compare star/bus/ring configurations, Ethernet/TCP/IP/SNA and at least two listed transmission media.", 5],
      ["Evaluate a WAN", "Identify implementation; distinguish hardware, software, media and carrier functions/examples; assess functional features/constraints and fitness for use; propose and compare alternative designs.", 5],
      ["Explain network administration", "Explain technical control/monitoring tasks, response-time factors, inter-network protocols/gateways and security procedures including encryption, keys, passwords, logs and audits; complete administration documentation.", 5],
    ],
  },
  "114066": {
    title: "Test Networked IT systems against given specifications", credits: 4,
    purpose: "Develop proficient selection, planning, execution and recording of networked-system tests against supplied specifications.",
    range: "Networked IT systems include multiple network workstations and a server, or interacting programs with interfaces to other components; this is more complex than isolated unit testing.",
    knowledge: `${IT_KNOWLEDGE} Complete the work within normal professional time and cost limits.`,
    outcomes: [
      ["Select a suitable test procedure", "Clarify test purpose/data needs, factors affecting procedure choice and available resources; comply with regulatory, licensing, contractual and safety requirements.", 4],
      ["Prepare networked-system testing", "Create a specification-aligned plan identifying what to test, scenarios, test data and expected results for each scenario.", 4],
      ["Execute networked-system tests", "Prepare and apply the selected procedure; test all performance and operational requirements; remedy procedure problems and comply with regulatory, licensing, contractual and safety requirements.", 5],
      ["Collect and record test results", "Produce, correctly collect and check sufficient data against the documented scenarios; remedy data-collection problems and record results in an appropriate information system.", 5],
    ],
  },
  "114069": {
    title: "Administer security systems for a multi-user computer system", credits: 15, level: 6,
    purpose: "Equip security administrators to interpret organisational policy, secure connected desktops and maintain, manage, review and support multi-user security systems.",
    range: "Multi-user systems include mid-range, mainframe and network-fileserver systems. Security covers the physical systems, connected desktop/other computers and associated software; maintenance covers file, access, resource and encryption controls.",
    knowledge: "Be proficient in role-related corporate/industry/professional standards and access-control systems. Be familiar with business applications, organisational ICT infrastructure, continuity/risk planning, information-capture methods and relevant national/international privacy, data-protection and intellectual-property legislation.",
    outcomes: [
      ["Understand organisational security policy", "Locate and read the policy and resolve questions about unclear provisions.", 2],
      ["Secure connected desktops", "Scan for viruses; record/remove viruses under policy; monitor and record illegal software; report both kinds of incidents under company procedures.", 5],
      ["Maintain multi-user security", "Determine/store and restore backups correctly; configure security changes to requirements; obtain authorisation and implement policy-compliant changes without weakening system integrity or security.", 5],
      ["Manage multi-user security", "Use internal/external resources to identify and update security gaps; act on exposures/violations; provide policy-compliant access; monitor/tune to manufacturer, organisational and security-policy requirements.", 5],
      ["Review multi-user security", "Review needs, evaluation-software reports, OS access controls, file classifications, input/output/file/processing controls and module/system-wide checks; follow organisational review procedures and recommend improvements.", 8],
      ["Support security-system users", "Identify and resolve user problems through organisational procedures and give appropriate advice on system use.", 2],
    ],
  },
  "114072": {
    title: "Install and commission a local area computer network", credits: 9,
    purpose: "Develop the ability to install LAN devices and software and test the completed network against specifications.",
    range: `${NO_RANGE} Install LAN system/application software under manufacturer guidance; configuration, performance and test records must meet installation specifications.`,
    knowledge: `${IT_KNOWLEDGE} Complete work within normal professional time and cost limits.`,
    outcomes: [
      ["Install LAN devices", "Ensure devices pass manufacturer diagnostics without errors; locate/connect and configure/customise them to manufacturer and installation specifications.", 3],
      ["Install and configure LAN software", "Ensure system and application software operates, is configured/customised and performs according to manufacturer and installation requirements.", 3],
      ["Test the installed LAN", "Verify network operation against manufacturer/installation specifications; follow the required test procedure and record results as specified.", 3],
    ],
  },
  "114074": {
    title: "Demonstrate an understanding of different computer network architectures and standards", credits: 5,
    purpose: "Provide foundational understanding of network types, standards, channel use, components, switching and management issues.",
    range: `${NO_RANGE} Cover at least three listed network types, three addressing/switching methods and three architecture standards; compare baseband/broadband and CSMA/CD/token passing; include circuit/packet switching and WAN management.`,
    knowledge: IT_DEVELOPMENT,
    outcomes: [
      ["Describe network types and standards", "Distinguish at least three listed network types, compare topologies, describe at least three listed node-addressing/switching methods and at least three architecture standards.", 4],
      ["Explain channel use and LAN components", "Explain baseband/broadband; compare CSMA/CD with token passing; describe the listed component purposes and illustrate configurations and installation issues.", 4],
      ["Explain LAN architectures", "Identify circuit/packet switching and compare implementation, cost, performance, reliability and security; explain WAN strategic/growth/day-to-day management, costs and security.", 3],
    ],
  },
  "114075": {
    title: "Design a local area computer network for a departmental office environment", credits: 5,
    purpose: "Develop proficient LAN design from user requirements through component selection to an informed network proposal.",
    range: `${NO_RANGE} Design covers efficient use of devices/carrier services; component selection considers function, performance, capacity, compatibility, reliability, cost and availability.`,
    knowledge: `${IT_KNOWLEDGE} Complete work within normal professional time and cost limits.`,
    outcomes: [
      ["Review LAN requirements", "Assess feasibility, user objectives and critical performance factors; estimate resources/cost and adopt a review to verify that user needs will be met.", 4],
      ["Design the LAN", "Meet user needs, use resources efficiently through the topology and comply with equipment-manufacturer and support-provider requirements.", 3],
      ["Source LAN components", "Identify suitable suppliers and ensure components satisfy functional, performance, capacity, compatibility, reliability, cost and availability needs.", 2],
      ["Propose the LAN", "Explain scope/objectives so users can judge fit; enable implementation-time/cost estimates; identify costs, benefits and assumptions for alternative solutions.", 4],
    ],
  },
  "114076": {
    title: "Use computer technology to research a computer topic", credits: 3, level: 4, fundamental: true,
    purpose: "Develop competence in planning, conducting, analysing and presenting computer-topic research using computer technology.",
    range: `${NO_RANGE} Research uses the internet and other computer applications; presentation uses the application chosen in the plan.`,
    knowledge: "Apply organisational quality, documentation, security, communication, safety and conduct procedures and South African copyright, privacy, safety and consumer law.",
    moderation: "Providers require accreditation by the relevant ETQA. A separate moderation process is not specified in this field.",
    outcomes: [
      ["Plan computer-topic research", "Define topic, objectives and scope; set timing, methods and sources; identify the audience, presentation method and applications for analysis/presentation.", 3],
      ["Conduct computer-assisted research", "Gather data to the plan; analyse and draw conclusions; describe methods so validity can be judged; report progress at planned intervals and use a computer application for analysis.", 5],
      ["Present research findings", "Use the planned application to communicate summarised research data and conclusions to the target audience.", 2],
    ],
  },
  "114183": {
    title: "Apply the principles of resolving problems for single-user and multi-user computer operating systems", credits: 7,
    purpose: "Develop proficient diagnostic-tool selection, problem identification and evidence-based resolution of single- and multi-user operating-system faults.",
    range: "The range field describes analytical judgement and responsibility and lists 30 contact, 10 self-directed and 10 coaching hours (total 50). These are the record's stated figures, not a recalculation of its 7 credits. Outcome scopes cover configuration, file-management and user-access faults.",
    knowledge: "Be familiar with business applications, configuration/change management, operating systems, corporate/industry/professional standards, organisational infrastructure, customer-service techniques and progress reporting; be proficient with everyday desktop software.",
    moderation: "Providers and assessors require relevant ETQA accreditation. ETQA/NSB-aligned assessment must be fair, unbiased, transparent, affordable and developmental. Evidence includes theory questions, a portfolio, reporting/communication and direct observation in actual or simulated work. ETQA moderation follows qualification guidelines and agreed procedures.",
    outcomes: [
      ["Explain operating-system diagnostic software", "Explain diagnostic tools' functions/operation and factors governing their selection.", 2],
      ["Identify operating-system problems", "Identify and describe configuration, file and access faults within agreed times; establish causes without trial-and-error and log problems for later reference.", 3],
      ["Resolve operating-system problems", "Use industry diagnostic procedures and a diagnostic tool; justify remedies with evidence, document causes/solutions and return systems to symptom-free service.", 5],
    ],
  },
} satisfies Record<string, RecordSummary>);

Object.assign(RECORDS, {
  "114226": {
    title: "Interpret and manage conflicts within the workplace", credits: 8, originator: "hr",
    purpose: "Enable learners to identify and resolve personal workplace conflict, choose appropriate strategies and develop their conflict-management skills.",
    range: "Focus on workplace conflict, although many conflict situations may be identified. Diversity-management conflicts are addressed in other unit standards.",
    knowledge: "Know Labour Relations Act provisions relevant to conflict resolution, personal-relationship terminology and the learner's organisational structure, policies and procedures.",
    moderation: "Assessment including RPL is available through appropriately accredited agencies/providers and registered assessors under the relevant ETQA or an ETQA with a memorandum of understanding. Moderation is conducted at the relevant ETQA's discretion, including the stated inter-ETQA arrangements.",
    outcomes: [
      ["Describe conflict sources", "Identify possible sources including perceptions/assumptions and example settings; discuss positive/negative effects, organisational conflict modes and personality conflict using transactional analysis.", 4],
      ["Explain conflict-management techniques", "Illustrate business conflict modes, useful management steps and the usual route toward resolution.", 3],
      ["Choose conflict strategies and action plans", "List Labour Relations Act resolution methods; justify the best strategy for a specific conflict; adapt action plans and explain organisational policies' preventive/resolution roles.", 4],
      ["Explain effective conflict-manager attributes", "Illustrate helpful personal characteristics; audit personal development needs; explain harmful attributes that should be avoided or controlled.", 3],
    ],
  },
  "117853": {
    title: "Conduct negotiations to deal with conflict situations", credits: 8, originator: "democracy",
    purpose: "Equip negotiators to prepare for conflict negotiations, conduct them, finalise agreements and evaluate the process.",
    range: `${NO_RANGE} Preparation includes logistics, participatory prioritisation, negotiation ranges/mandates and strategies; final records include implementation, monitoring, timing, commitments and sensitivity to diversity.`,
    knowledge: "Understand negotiation and its types, negotiation strategies and tactics, and communication processes.",
    moderation: "Assessors must be registered with the relevant ETQA and hold a Conflict qualification at NQF 6 or higher, or equivalent. Providers require relevant ETQA accreditation. Moderators must be registered assessors under the relevant ETQA or an ETQA with a memorandum of understanding. ETQA moderation follows agreed guidelines/procedures.",
    outcomes: [
      ["Prepare negotiations", "Arrange logistics; explain purpose and prioritise issues participatively; choose and justify strategies, ranges and tactics; identify/inform stakeholders on time; obtain mandates and gather/share relevant information.", 8],
      ["Engage in negotiations", "Align conduct with strategy/tactics, preserve relationships and pursue suitable outcomes; use respectful communication; explore options; seek amended mandates when necessary; explain outcomes to constituents and accurately record proceedings/interim results.", 7],
      ["Finalise and communicate agreements", "Confirm agreements verbally, or minute disagreement; record final terms including implementation/monitoring/timing/commitments and diversity needs; distribute and make agreements accessible to all stakeholders.", 3],
      ["Evaluate negotiation", "Assess strengths, weaknesses and achievement of the brief; record improvements for future processes; obtain and analyse participants' reactions against negotiation purposes.", 3],
    ],
  },
  "120300": {
    title: "Analyse leadership and related theories in a work context", credits: 8, originator: "administration", fundamental: true,
    purpose: "Develop understanding and application of leadership theories, roles and qualities in public-sector, local-government, commercial and community work contexts.",
    range: `${NO_RANGE} Criteria require at least four leadership definitions, five leader-quality examples, two accountability/responsibility examples, four theories/trend examples and three leadership case studies.`,
    knowledge: "Know leadership definitions, theories, roles and functions; management roles/functions and their distinction from leadership; institutional policy, procedures and legislation.",
    moderation: "Registered assessors and accredited providers under the relevant ETQA or an ETQA with a memorandum of understanding may assess, including through RPL. The relevant ETQA conducts moderation at its discretion.",
    outcomes: [
      ["Explain leadership", "Explain at least four definitions using workplace examples and illustrate leadership roles and at least five qualities.", 2],
      ["Distinguish leadership from management", "Define and compare both concepts, roles and qualities; discuss accountability/responsibility with at least two examples and their advantages/disadvantages; explain complementary workplace roles.", 4],
      ["Analyse leadership theories", "Identify/analyse at least four theories in work settings; examine trends/developments with at least four examples and justify advantages/disadvantages.", 3],
      ["Apply leadership roles and qualities", "Analyse roles/qualities and at least three leaders' case studies; assess role-model effects; apply a selected theory at work and formulate a personal leadership-development strategy.", 5],
    ],
  },
  "252020": {
    title: "Create and manage an environment that promotes innovation", credits: 6,
    purpose: "Enable managers to assess innovation opportunities, promote creativity, plan a supportive environment and lead creative problem-solving.",
    range: `${MANAGEMENT_RANGE} Innovation creates a new product, process or idea, including new combinations of ideas. Techniques include brainstorming, mind maps, lateral thinking and problem-solving; stakeholders include staff, managers, customers, suppliers and interest groups.`,
    knowledge: "Understand environments supporting creativity/innovation, enquiry and risk-taking cultures, creative-thinking and problem-solving techniques, and management practices that inhibit these.",
    outcomes: [
      ["Analyse innovation opportunities", "Identify innovation-supporting features; analyse the unit against them, interpret whether the environment supports innovation and identify improvements.", 4],
      ["Explain creativity techniques", "Identify accepted creativity/innovation techniques and explain three with practical examples.", 2],
      ["Plan an innovation-supporting environment", "Describe the manager's continuous-improvement role; record necessary processes/actions/approaches; explain implementation against resources/environment and promote commitment within the unit.", 4],
      ["Lead creative thinking", "Apply techniques to generate improvements; create alternatives and select the best using evaluation criteria; develop, record and communicate a policy-compliant implementation concept.", 5],
    ],
  },
  "252021": {
    title: "Formulate recommendations for a change process", credits: 8,
    purpose: "Enable managers to justify a need for change, analyse it, select a change model and recommend an implementation process.",
    range: MANAGEMENT_RANGE,
    knowledge: "Know change and change-management theories/models, human responses to change, SWOT-analysis techniques and the components of a change-management plan.",
    outcomes: [
      ["Explain the need for change", "Explain internal/external change and its impact on organisational sustainability; justify change through benefits to the unit.", 2],
      ["Analyse a change requirement", "Compare current and desired states; substantiate change through SWOT or another suitable analysis including benefits, risks/obstacles, positive forces and resilience.", 2],
      ["Select a change model", "Describe two models and their suitability for different processes; justify the selected model against analysis findings.", 2],
      ["Recommend change implementation", "Present a needs-aligned plan covering phases/actions/responsibilities/timing, stakeholders, outcomes, obstacles and responses; propose appropriate ways to manage human reactions and justify the change leader's role/competencies.", 3],
    ],
  },
  "252022": {
    title: "Develop, implement and evaluate a project plan", credits: 8,
    purpose: "Enable managers to choose and scope a workplace project, plan it, develop measurement tools and implement/evaluate progress.",
    range: `${MANAGEMENT_RANGE} Applies to once-off projects and events planned and implemented within the unit.`,
    knowledge: "Understand project planning/implementation methods, budgeting and the delegation of authority, responsibility and accountability.",
    outcomes: [
      ["Choose a workplace project", "Consider alternatives against unit objectives and justify the preferred option by viability, cost and results.", 2],
      ["Define project scope", "Define scope/deliverables and main activities; analyse risk likelihood and explain change processes essential to project success.", 4],
      ["Develop the project plan", "Link objectives to unit goals; identify sponsor/team/stakeholder contributions; create a WBS and activity relationships; communicate performance/quality requirements and check completeness, accuracy and compliance.", 5],
      ["Develop performance-measurement tools", "Create a Gantt chart, budget and quality parameters for time/cost/quality management; communicate the tools to secure shared understanding.", 4],
      ["Implement and evaluate the project", "Monitor implementation and results against plan/performance/quality criteria; analyse deviations, implement corrective actions and evaluate results against scope/objectives.", 5],
    ],
  },
  "252024": {
    title: "Evaluate current practices against best practice", credits: 4,
    purpose: "Enable managers to benchmark unit practices, choose improvements and plan the adoption of best practice.",
    range: `${MANAGEMENT_RANGE} Resources include people, physical resources, time and money. Practices include policies/procedures/processes/activities; best practice includes quality, service, manufacturing, environmental practice, continuous improvement and waste elimination.`,
    knowledge: "Understand best practice and world-class competitiveness, techniques for comparing policies/processes/practices, and strategies to overcome resistance to change.",
    outcomes: [
      ["Apply the best-practice concept", "Explain best practice in the unit; identify relevant practices and define world-class practice for its context.", 3],
      ["Analyse present practices", "Compare current with best practice; assess product/service reliability against internal/external expectations and identify maximum-gain opportunities.", 3],
      ["Choose practices to adopt", "Describe expected performance improvements, justify current practices to retain and justify best practices to introduce.", 3],
      ["Recommend implementation", "Make recommendations appropriate to the analysed current practices and aligned with best practice; communicate them for stakeholder feedback.", 3],
      ["Plan best-practice adoption", "Explain supporting change processes and resource needs; include tasks, responsibilities, timescales, measures and reasonable contingencies; describe monitoring, recording and evaluation.", 5],
    ],
  },
  "252025": {
    title: "Monitor, assess and manage risk", credits: 8,
    purpose: "Enable managers to understand risk, assess its impact, create contingency plans and test/revise them.",
    range: `${MANAGEMENT_RANGE} Risks include financial, occupational health/safety and environmental risks; environmental factors include systems/location/change. Strategies include mitigation, avoidance, elimination and acceptance. Contingency plans cover tasks, responsibilities, timing, resources and emergencies.`,
    knowledge: "Know relevant law including the Occupational Health and Safety Act, financial/health/safety/environmental risks, fraud and intellectual-property theft, contingency strategies and risk-assessment methods.",
    outcomes: [
      ["Explain potential unit risks", "Explain risk theory/practice, identify risk factors and explain the risk-management role of organisational policies/procedures.", 3],
      ["Identify and assess risk impact", "Document critical-process risk factors and possible scenarios; evaluate occurrence likelihood, rate impacts and document priorities for action.", 5],
      ["Develop contingency plans", "Develop/document policy-compliant plans, communicate them to stakeholders and distribute/store them under risk-management procedures.", 3],
      ["Test and revise plans", "Test under organisational procedures, document improvement recommendations from findings and revise plans accordingly.", 3],
    ],
  },
  "252026": {
    title: "Apply a systems approach to decision making", credits: 6,
    purpose: "Enable managers to analyse problems, involve stakeholders and choose/communicate decisions that account for interrelated organisational systems.",
    range: `${MANAGEMENT_RANGE} Stakeholders include own-unit staff, other-unit managers/staff, suppliers and customers.`,
    knowledge: "Understand systems approaches to decisions/problem-solving, critical and analytical thinking, and problem-definition/analysis techniques.",
    outcomes: [
      ["Analyse a problem critically", "Define the unit problem through critical/analytical thinking and identify contributing factors and other affected organisational areas.", 2],
      ["Engage stakeholders in analysis and solutions", "Communicate consultation purpose; explain analysis/idea-generation methods; involve stakeholders in internal/external analysis and staff in solutions; respect varied ideas, values and perspectives.", 5],
      ["Select feasible systemic solutions", "Analyse stakeholder input, prioritise options by effects on the unit/entity/external stakeholders and select the best solution accounting for interconnected issues and affected areas.", 3],
      ["Formulate and communicate the decision", "Explain the decision's wider-system impact, implementation activities/people/resources/timing and supporting change processes; communicate accessibly to implementers and stakeholders.", 4],
    ],
  },
  "252027": {
    title: "Devise and apply strategies to establish and maintain workplace relationships", credits: 6,
    purpose: "Enable managers to build stakeholder networks and constructive relationships with managers and team members while reducing personal conflict.",
    range: `${MANAGEMENT_RANGE} Colleagues may work in the same or other units; stakeholders include staff, managers, customers, suppliers, associations and professional bodies.`,
    knowledge: "Know networking/professional-network development guidelines, interpersonal and effective-group techniques, and conflict-handling techniques.",
    outcomes: [
      ["Network with stakeholders", "Identify/create relevant internal/external networking opportunities, attend meetings and establish mutually useful contacts; implement suitable communication strategies.", 3],
      ["Build constructive manager relationships", "Provide policy-compliant progress/results feedback; agree information/advice exchange; consult on relevant responsibilities, raise quality concerns directly and supply clear accurate timely information.", 5],
      ["Minimise personal conflict", "Explain conflict procedures to staff; act promptly on potential/actual conflict and refer situations to appropriate managers when required.", 3],
      ["Build constructive team relationships", "Consult all staff when setting shared goals; provide suitable chances to discuss work/personal matters; give positive feedback/advice and explain developments affecting them.", 4],
    ],
  },
  "252029": {
    title: "Lead people development and talent management", credits: 8,
    purpose: "Enable managers to analyse and record development needs, prepare a talent-aligned people-development plan and manage its implementation.",
    range: `${MANAGEMENT_RANGE} Analyse training needs for a unit. Implement at least two interventions: one formal credit-bearing programme and one workplace-based programme.`,
    knowledge: "Understand HR development, training-needs analysis, programme types/delivery modes and learning organisations/cultures/lifelong learning. Know relevant NQF, Skills Development, Skills Development Levies and Employment Equity requirements and the BBBEE scorecard.",
    outcomes: [
      ["Analyse staff development needs", "Determine skills gaps through a unit needs analysis; integrate appraisal results and talent strategy; obtain stakeholder agreement on interpretation.", 4],
      ["Record needs-analysis results", "Record training/non-training needs, relate them to career paths and talent strategy, and share the report in a usable format.", 4],
      ["Plan people development", "Justify programme types and linked objectives/outcomes; specify responsibilities/timing and the manager's role; align with legal/internal skills-development requirements and reflect a lifelong-learning culture.", 6],
      ["Manage plan implementation", "Implement the required credit-bearing and workplace interventions; monitor progress and national-system quality requirements; analyse achievement reports and integrate learner/stakeholder evaluation into a final improvement report.", 3],
    ],
  },
  "252031": {
    title: "Apply the principles and concepts of emotional intelligence to the management of self and others", credits: 4,
    purpose: "Enable managers to understand emotional intelligence, analyse relationship effects and identify their own development needs.",
    range: MANAGEMENT_RANGE,
    knowledge: "Know emotional-intelligence principles/concepts, emotionally intelligent feedback, behavioural self-awareness skills and improvement techniques.",
    outcomes: [
      ["Explain emotional intelligence", "Explain principles through life/work examples and describe concepts such as confidence, self-awareness, self-esteem and locus of control.", 2],
      ["Analyse emotional intelligence in relationships", "Explain personal/interpersonal competencies and analyse giving/receiving feedback for emotionally intelligent practices.", 2],
      ["Analyse interaction effects", "Illustrate positive/negative personal and interpersonal effects and consequences in life/work, such as motivation, conflict, stress, work climate and productivity.", 2],
      ["Evaluate personal emotional intelligence", "Analyse personal responses and strengths/weaknesses against the principles; identify development areas and relevant improvement techniques.", 3],
    ],
  },
} satisfies Record<string, RecordSummary>);

Object.assign(RECORDS, {
  "252032": {
    title: "Develop, implement and evaluate an operational plan", credits: 8,
    purpose: "Enable managers to create unit operational strategies and plans, implement them and evaluate achievement.",
    range: `${MANAGEMENT_RANGE} Operational plans include business plans.`,
    knowledge: "Know how to develop measurable achievable goals/standards, operational/business-plan elements, strengths/weaknesses analysis, implementation approaches/tools and monitoring/evaluation systems.",
    outcomes: [
      ["Develop unit operational strategies", "Examine the entity strategy and unit contribution; develop/document aligned strategies; systematically formulate clear measurable achievable goals/standards and involve stakeholders to gain commitment.", 5],
      ["Develop the operational plan", "Translate goals into tasks, responsibilities, timeframes, measures, resources and contingencies; validate measures against customer/unit needs; describe monitoring and seek team feedback.", 4],
      ["Implement the plan", "Implement and amend as needed to meet goals/standards; optimise resources for cost-effectiveness and encourage first-line managers' control measures.", 3],
      ["Monitor and evaluate achievement", "Monitor against planned standards, review team inputs/outputs, implement corrective action agreed with responsible managers and evaluate teams' contributions to unit performance.", 4],
    ],
  },
  "252034": {
    title: "Monitor and evaluate team members against performance standards", credits: 8,
    purpose: "Enable managers to formulate staff performance standards, establish monitoring, prepare reviews and conduct performance-review interviews.",
    range: `${MANAGEMENT_RANGE} The official range also explicitly refers to once-off projects and events planned and implemented in a unit.`,
    knowledge: "Know methods for formulating key-result areas and performance standards, performance-monitoring systems, review processes and constructive feedback.",
    outcomes: [
      ["Formulate staff performance standards", "Link standards to unit goals/deliverables; specify clear concise activities and expected standards; incorporate team feedback and document under organisational policy.", 4],
      ["Establish monitoring systems", "Review available systems; choose a policy-compliant system, communicate it for staff buy-in and set it up to monitor performance against standards.", 4],
      ["Prepare a performance review", "Agree time/place/review type; conduct and document a preliminary assessment using monitoring data; identify constructive methods for positive/negative feedback and prepare required documents.", 5],
      ["Conduct the review interview", "Follow agreed arrangements; give relevant fair supportive feedback; record strengths/weaknesses accurately and honestly; agree an improvement/build-on-strengths plan and document actions signed by both parties.", 5],
    ],
  },
  "252035": {
    title: "Select and coach first line managers", credits: 8,
    purpose: "Enable managers to select a first-line manager, plan and conduct coaching and monitor coaching results.",
    range: MANAGEMENT_RANGE,
    knowledge: "Understand deriving performance requirements from key-result areas, coaching processes, feedback, negotiation and conflict-handling techniques.",
    outcomes: [
      ["Select a first-line manager", "Analyse the job profile/key performance areas; define weighted selection criteria; liaise with recruitment; shortlist through interviews/checks or other techniques; decide and make offers under policy.", 5],
      ["Plan coaching", "Prepare a priority-based plan/schedule, record expected key-result-area performance and establish a system for recording discussion decisions and commitments.", 3],
      ["Coach the selected manager", "Agree purpose/content/schedule; discuss and record performance against key-result areas; agree gap-closing actions and give honest constructive supportive feedback.", 4],
      ["Monitor coaching outcomes", "Monitor agreed actions on schedule; recognise achievements, record corrective actions and follow up under policy; encourage line managers to agree and use coaching with their own staff.", 5],
    ],
  },
  "252036": {
    title: "Apply mathematical analysis to economic and financial information.", credits: 6, fundamental: true,
    purpose: "Enable managers to collect, organise, calculate, graph and analyse financial/economic data for their unit.",
    range: MANAGEMENT_RANGE,
    knowledge: "Know financial/economic data collection, organisation and analysis; averages, standard deviations and best-fit lines; time value of money; and graphical methods such as histograms, pie/bar/line/stack charts.",
    outcomes: [
      ["Collect and organise data mathematically", "Choose suitable collection/recording/organisation methods; collect relevant financial and demographic data and record it in a usable format.", 3],
      ["Calculate and represent data", "Calculate averages, standard deviations, best-fit lines and time-value-of-money results for different transactions; graph the data and calculations.", 4],
      ["Analyse economic relationships", "Represent relationships graphically with clear appropriate data-consistent numerical summaries and make mathematically grounded projections.", 3],
    ],
  },
  "252037": {
    title: "Build teams to achieve goals and objectives", credits: 6,
    purpose: "Enable managers to understand team theory/dynamics, build teams, lead effectively and evaluate/improve team performance.",
    range: MANAGEMENT_RANGE,
    knowledge: "Know team theory/dynamics, team types, high-performance-team characteristics, leadership styles and techniques for managing team dynamics.",
    outcomes: [
      ["Explain teams and their workplace importance", "Compare teams/interactions with groups, describe distinct team types and justify teams' contributions to workplace goals.", 3],
      ["Apply team theory to dynamics", "Illustrate team dynamics; analyse interpersonal/other conflict causes and identify particular cross-functional and virtual-team challenges.", 3],
      ["Explain team building", "Explain the process steps and analyse development stages through the human behaviours driving them.", 2],
      ["Analyse the team leader's role", "Explain effectiveness-focused leadership, compare leadership-style effects and describe constructive dynamics/conflict techniques promoting trust, cohesion, creativity and productivity.", 3],
      ["Evaluate and improve a team", "Evaluate functioning against high-performance-team characteristics and develop an improvement action plan.", 2],
    ],
  },
  "252040": {
    title: "Manage the finances of a unit", credits: 8,
    purpose: "Enable managers to understand managerial finance, interpret statements, forecast, budget and supervise unit finances.",
    range: `${MANAGEMENT_RANGE} Manage unit financial resources through forecasts and budgets; the record defines GAAP as Generally Accepted Accounting Practices.`,
    knowledge: "Understand finance versus accounting, financial relationships, trends/ratios, analysis of past performance, opportunity identification, future planning and financial-performance measurement.",
    outcomes: [
      ["Explain managerial-finance concepts", "Diagram the accounting cycle; relate forecasting/budgeting to strategic planning; illustrate accounting conventions and the entity's audit, income, cash-flow and balance-sheet reports.", 4],
      ["Interpret financial statements", "Check source authenticity/accuracy; apply profitability, liquidity, working-capital, asset-use and return ratios; recommend improvements based on the results.", 5],
      ["Prepare financial forecasts", "Identify forecast types/formats and standard sources; explain and incorporate relevant factors and analyse viability against organisational requirements.", 5],
      ["Draft operational budgets", "Link budgets to operational objectives and strategic plans; formulate under procedures and review/modify for alignment with the unit's operational plan.", 4],
      ["Supervise unit financial management", "Agree and follow monitoring systems; monitor each team's annual expenditure against criteria and implement policy-compliant corrective action when needed.", 3],
    ],
  },
  "252042": {
    title: "Apply the principles of ethics to improve organisational culture", credits: 5,
    purpose: "Enable managers to relate values, ethics and culture, analyse unit ethical conduct and recommend improvements.",
    range: `${MANAGEMENT_RANGE} Corporate ethics includes business ethics and public-sector ethical norms/standards.`,
    knowledge: "Know the South African Constitution, King Report on Corporate Governance, national/international corporate-ethics best practice, personal/organisational values and corporate-ethics principles.",
    outcomes: [
      ["Relate values, ethics and culture", "Illustrate personal values, organisational ethics/culture and conflicts between them in South African workplaces; analyse effects on the triple bottom line.", 3],
      ["Apply corporate ethics to a unit", "Explain ethical requirements from relevant laws/codes, including applicable Constitution/King/PFMA/Batho Pele documents; analyse governance and the unit's contribution and illustrate ethical practices across functional areas.", 3],
      ["Analyse unit ethical conduct", "Select an analysis instrument, gather/record conduct information and compare current with desired values, codes and ethics.", 3],
      ["Recommend stronger ethical practice", "Prepare an implementation plan; describe managers' decision-making responsibilities; allocate roles/timing for communication and for monitoring/evaluating improvements.", 4],
    ],
  },
  "252043": {
    title: "Manage a diverse work force to add value", credits: 6,
    purpose: "Enable managers to understand workforce diversity, realise its value, lead across similarities/differences and handle resulting conflict.",
    range: `${MANAGEMENT_RANGE} Diversity includes history, nationality, culture, background, experience, beliefs/values/attitudes, race, age, sex, disability, sexual orientation, language, talents and education.`,
    knowledge: "Know diversity's nature, unfair discrimination and discriminatory practices, cultural biases/stereotypes, discrimination types, diversity-management techniques and approaches to related disagreements/conflict.",
    outcomes: [
      ["Understand workplace diversity", "Define relevant differences; examine discrimination potential and internal/external relationship implications; identify biases, stereotypes and perceptions and their influence.", 4],
      ["Explain diversity's value", "Illustrate team/client benefits; explore ways to improve relationships/productivity, meet diverse staff needs within unit objectives and create opportunities through diverse client/community products/services.", 4],
      ["Manage similarities and differences", "Identify differing and shared beliefs/values/interests/attitudes through interaction; encourage diverse viewpoints and demonstrate sensitive, understanding management.", 4],
      ["Manage diversity-related conflict", "Acknowledge/manage disagreements to strengthen relationships; address unfair discrimination at the proper authority level and use conflict as a learning opportunity to improve cohesion.", 3],
    ],
  },
  "252044": {
    title: "Apply the principles of knowledge management", credits: 6,
    purpose: "Enable managers to understand knowledge management, analyse unit practice and prepare an implementation plan.",
    range: `${MANAGEMENT_RANGE} Outcome scope includes the knowledge economy, tacit/codified knowledge, knowledge assets/workers, intellectual property/capital, learning organisations and knowledge creation/sharing/transfer.`,
    knowledge: "Know knowledge-management theory/principles, intellectual property and capital, the knowledge economy, organisational learning/learning organisations and knowledge creation, sharing and storage.",
    moderation: "Not specified in the official record: the accreditation and moderation field is recorded as N/A.",
    outcomes: [
      ["Explain knowledge-management concepts", "Illustrate knowledge-economy drivers, describe system components and explain knowledge assets' competitive value and the results of managing knowledge.", 4],
      ["Analyse unit knowledge-management practice", "Compare current practices with entity policy and other units; interpret strengths/weaknesses and consolidate findings with improvement recommendations.", 4],
      ["Plan knowledge-management implementation", "Explain the manager's role with other participants; develop a policy-aligned operational plan covering activities, people, timing, measures, costs, benefits and risks; promote commitment and describe implementation using accepted practice.", 4],
    ],
  },
} satisfies Record<string, RecordSummary>);

const DETAILS: Record<string, SaqaDetails> = Object.fromEntries(Object.entries(RECORDS).map(([id, record]) => {
  const originatorKey = record.originator ?? (id.startsWith("252") ? "management" : "it");
  const [originator, field, subfield] = ORIGINATORS[originatorKey];
  const level = record.level ?? 5;
  const oldProject = id === "10135";
  // The official IT pages have different last-enrolment dates from the
  // management pages; 114049 and 114050 are explicit IT exceptions.
  const itDeadline = originatorKey === "it" && id !== "114049" && id !== "114050";
  const registration = [
    { label: "SAQA unit standard ID", value: id },
    { label: "Unit standard title", value: record.title },
    { label: "ORIGINATOR", value: originator },
    { label: "PRIMARY OR DELEGATED QUALITY ASSURANCE FUNCTIONARY", value: "-" },
    { label: "FIELD", value: field },
    { label: "SUBFIELD", value: subfield },
    { label: "ABET BAND", value: "Undefined" },
    { label: "UNIT STANDARD TYPE", value: record.fundamental ? "Regular-Fundamental" : "Regular" },
    { label: "PRE-2009 NQF LEVEL", value: `Level ${level}` },
    { label: "NQF LEVEL", value: level === 4 ? "NQF Level 04" : `Level TBA: Pre-2009 was L${level}` },
    { label: "CREDITS", value: String(record.credits) },
    { label: "REGISTRATION STATUS", value: 'Passed the End Date -\nStatus was "Reregistered"' },
    { label: "REGISTRATION START DATE", value: oldProject ? "2005-02-09" : "2018-07-01" },
    { label: "REGISTRATION END DATE", value: oldProject ? "2005-11-30" : "2023-06-30" },
    { label: "SAQA DECISION NUMBER", value: oldProject ? "SAQA 1058/05" : "SAQA 06120/18" },
    { label: "LAST DATE FOR ENROLMENT", value: oldProject ? "2006-11-30" : itDeadline ? "2027-06-30" : "2028-06-30" },
    { label: "LAST DATE FOR ACHIEVEMENT", value: oldProject ? "2009-11-30" : itDeadline ? "2030-06-30" : "2031-06-30" },
  ];
  const details: SaqaDetails = {
    notice: "Source: South African Qualifications Authority (SAQA). These are concise paraphrased summaries, not the full assessment specification. Registration status and dates are reproduced from the official record; passed end dates must not be presented as active registration or a guarantee of current provider accreditation.",
    source: { url: `https://allqs.saqa.org.za/showUnitStandard.php?id=${id}`, retrieved: "2026-10-11" },
    registration,
    sections: [
      { heading: "Purpose of the unit standard", icon: "target", paragraphs: [record.purpose] },
      { heading: "Unit standard range", icon: "folder", paragraphs: [record.range || NOT_SPECIFIED] },
      {
        heading: "Specific outcomes and assessment criteria", icon: "checklist",
        paragraphs: ["Each row summarises the numbered outcome and its corresponding criteria together. Consult the official source for the complete wording and detailed range statements."],
        table: {
          headers: ["Specific outcome", "Corresponding assessment criteria"],
          rows: record.outcomes.map(([outcome, summary, count], index) => [
            `SO ${index + 1}: ${outcome}`,
            `SO ${index + 1}, AC ${count === 1 ? "1" : `1–${count}`}: ${summary}`,
          ]),
        },
      },
      { heading: "Essential embedded knowledge", icon: "database", paragraphs: [record.knowledge || NOT_SPECIFIED] },
      { heading: "Accreditation and moderation", icon: "shield", paragraphs: [record.moderation ?? (originatorKey === "it" ? IT_MODERATION : MANAGEMENT_MODERATION)] },
    ],
  };
  return [id, details];
}));

/** Verified official defaults only; callers must give saved inline drafts priority. */
export function getSaqaDetails(us: string): SaqaDetails | undefined {
  return Object.prototype.hasOwnProperty.call(DETAILS, us) ? DETAILS[us] : undefined;
}
